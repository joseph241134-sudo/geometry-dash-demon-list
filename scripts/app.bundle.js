/* ==== cloud.js ==== */
const SUPABASE_URL = 'https://sxsxxjdwvmfrrmggggcd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KCu1CyH-A5dIllXIB2SoDg_udx8YibQ';

const cloud = window.supabase ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

let cloudUser = null;
let cloudPublicId = null;
let cloudReady = false;
let cloudTimer = null;
let cloudBusy = false;
let cloudDirty = false;

const cloudLast = new Map();

function cloudSplit() {
  const { userLists: lists, ...profile } = buildSnapshot();
  const { lang, ...settings } = profile.appSettings;
  profile.appSettings = settings;
  profile.viewPrefs = { showFaces: !!viewPrefs.showFaces };
  return { profile, lists };
}

function cloudMarkSynced() {
  const { profile, lists } = cloudSplit();
  cloudLast.clear();
  cloudLast.set('profile', JSON.stringify(profile));
  lists.forEach(l => cloudLast.set(l.id, JSON.stringify(l)));
}

// Lee la nube
async function cloudFetch() {
  if (!cloudUser) return null;
  const [p, l] = await Promise.all([
    cloud.from('profiles').select('data, public_id').maybeSingle(),
    cloud.from('lists').select('data')
  ]);
  if (p.error || l.error) return null;
  return {
    profile: p.data?.data ?? null,
    publicId: p.data?.public_id ?? null,
    lists: l.data.map(r => r.data).sort((a, b) => a.id - b.id)
  };
}

// Sube lo que cambió
async function cloudSync() {
  const { profile, lists } = cloudSplit();
  const now = new Date().toISOString();
  const uid = cloudUser.id;

  const pJson = JSON.stringify(profile);
  if (cloudLast.get('profile') !== pJson) {
    const r = await cloud.from('profiles').upsert({ id: uid, data: profile, updated_at: now });
    if (r.error) { console.error('cloud profiles', r.error); return false; }
    cloudLast.set('profile', pJson);
  }

  const changed = lists.filter(l => cloudLast.get(l.id) !== JSON.stringify(l));
  if (changed.length) {
    const rows = changed.map(l => ({ id: l.id, owner_id: uid, data: l, updated_at: now }));
    const r = await cloud.from('lists').upsert(rows, { onConflict: 'owner_id,id' });
    if (r.error) { console.error('cloud lists', r.error); return false; }
    changed.forEach(l => cloudLast.set(l.id, JSON.stringify(l)));
  }

  const alive = new Set(lists.map(l => l.id));
  const removed = [...cloudLast.keys()].filter(k => k !== 'profile' && !alive.has(k));
  if (removed.length) {
    const r = await cloud.from('lists').delete().eq('owner_id', uid).in('id', removed);
    if (r.error) { console.error('cloud delete', r.error); return false; }
    removed.forEach(k => cloudLast.delete(k));
  }
  return true;
}

// Evita pushes simultáneos
async function cloudPush() {
  if (!cloudUser) return false;
  if (cloudBusy) { cloudDirty = true; return true; }
  cloudBusy = true;
  try {
    do { cloudDirty = false; if (!await cloudSync()) return false; } while (cloudDirty);
    return true;
  } catch (e) { console.error('cloudPush', e); return false; }
  finally { cloudBusy = false; }
}

// Baja de la nube: 'ok' | 'empty' | 'error'
async function cloudPull() {
  const remote = await cloudFetch();
  if (!remote) return 'error';
  cloudPublicId = remote.publicId;  
  if (!remote.profile && !remote.lists.length) return 'empty';

  const lang = appSettings.lang;
  const localPrefs = { ...viewPrefs };
  delete localPrefs.showFaces;

  applySnapshot({ ...(remote.profile || {}), userLists: remote.lists });
  appSettings.lang = lang;
  Object.assign(viewPrefs, localPrefs);
  cloudMarkSynced();
  return 'ok';
}

const LOGIN_FLAG = 'mdl_login_pending';
let cloudAwaitingUser = false;

function consumeLoginFlag() {
  let fresh = false;
  try {
    const ts = Number(localStorage.getItem(LOGIN_FLAG)) || 0;
    fresh = Date.now() - ts < 10 * 60 * 1000;
    localStorage.removeItem(LOGIN_FLAG);
  } catch (e) {}
  return fresh;
}

const isPristineList = l =>
  l.title === DEFAULT_LIST_TITLE && !l.demons.length && !l.image;

function localHasData() {
  return userLists.some(l => !isPristineList(l))
    || !!(profileState.avatar || profileState.banner || profileState.bannerColor || profileState.country)
    || (!!profileState.username && profileState.username !== 'Player 1');
}

// true = reemplazar datos locales · false = volver y cerrar sesión
function cloudConfirmOverwrite() {
  return new Promise(resolve => {
    let result = false;
    const ov = openModal({
      title: t('auth.overwriteTitle'),
      cls: 'modal-sm',
      dismissible: false,
      onClose: () => resolve(result),
      body: `<p class="dialog-text">${escapeHTML(t('auth.overwriteText'))}</p>`,
      actions: `
        <button type="button" class="btn-secondary" data-back>${t('auth.overwriteBack')}</button>
        <button type="button" class="btn-danger" data-ok>${t('auth.overwriteOk')}</button>`
    });
    ov.querySelector('[data-back]').addEventListener('click', () => closeModal(ov));
    ov.querySelector('[data-ok]').addEventListener('click', () => { result = true; closeModal(ov); });
  });
}

async function cloudLoadPublicId() {
  try {
    const { data } = await cloud.from('profiles').select('public_id').maybeSingle();
    cloudPublicId = data?.public_id ?? null;
  } catch (e) { cloudPublicId = null; }
}

async function cloudStart() {
  const { data } = await cloud.auth.getSession();
  cloudUser = data.session?.user ?? null;
  if (!cloudUser) { try { localStorage.removeItem(LOGIN_FLAG); } catch (e) {} return null; }

  if (consumeLoginFlag() && localHasData()) {
    const remote = await cloudFetch();
    if (remote && (remote.profile || remote.lists.length)) {
      cloudAwaitingUser = true;
      const replace = await cloudConfirmOverwrite();
      cloudAwaitingUser = false;
      if (!replace) { await cloudSignOut(true); return null; } // conserva los datos locales
    }
  }

  const res = await cloudPull();
  let synced = res === 'ok';
  if (res === 'empty') synced = await cloudPush();
  cloudReady = res !== 'error';
  if (cloudReady && cloudPublicId == null) await cloudLoadPublicId();
  if (synced) saveLocal();
  if (cloudReady) cloudMigrateImages().then(() => cloudCleanImages()).catch(e => console.error(e));
  return cloudUser;
}

async function cloudSignOut(keepLocal = false) {
  await cloud.auth.signOut();
  cloudUser = null; cloudReady = false; cloudLast.clear();
  clearTimeout(cloudTimer);
  if (keepLocal !== true) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(basicSnapshot()));
  }
  location.replace(location.pathname);
}

function cloudScheduleSync() {
  if (!cloudUser || !cloudReady) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(cloudPush, 1500);
}

const IMG_BUCKET = 'images';

// Sube una imagen (Blob o dataURL) y devuelve su URL pública, o null si falla
async function cloudStoreImage(src) {
  try {
    const blob = typeof src === 'string' ? await (await fetch(src)).blob() : src;
    if (/svg/i.test(blob.type)) return null;
    const ext = (blob.type.split('/')[1] || 'webp').replace('jpeg', 'jpg');
    const path = `${cloudUser.id}/${Date.now()}${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error } = await cloud.storage.from(IMG_BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' });
    if (error) { console.error('storage', error); return null; }
    return cloud.storage.from(IMG_BUCKET).getPublicUrl(path).data.publicUrl;
  } catch (e) { console.error('storage', e); return null; }
}

async function cloudMigrateImages() {
  if (!cloudUser || !cloudReady) return false;
  const jobs = [];
  const swap = (obj, key) => {
    if (typeof obj[key] === 'string' && obj[key].startsWith('data:'))
      jobs.push(cloudStoreImage(obj[key]).then(u => { if (u) obj[key] = u; }));
  };
  swap(profileState, 'avatar'); swap(profileState, 'banner');
  userLists.forEach(l => swap(l, 'image'));
  if (!jobs.length) return false;
  await Promise.all(jobs);
  saveData();
  return true;
}

// Borra de Storage las imágenes que ya no se usan (más de 1 día)
async function cloudCleanImages() {
  if (!cloudUser || !cloudReady) return 0;
  const { profile, lists } = cloudSplit();
  const used = JSON.stringify([profile, lists]);
  const { data, error } = await cloud.storage.from(IMG_BUCKET).list(cloudUser.id, { limit: 1000 });
  if (error) return 0;
  const stale = data
    .filter(f => !used.includes(f.name) && Date.now() - new Date(f.created_at) > 864e5)
    .map(f => `${cloudUser.id}/${f.name}`);
  if (stale.length) await cloud.storage.from(IMG_BUCKET).remove(stale);
  return stale.length;
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden && cloudUser && cloudReady) { clearTimeout(cloudTimer); cloudPush(); }
});

/* ==== i18n.js ==== */
// ------------------------------------------------------
// constante de idiomas (en / es / fr.. proceso)
// ------------------------------------------------------

const LANGS = [
  { id: 'en', name: 'English' },
  { id: 'es', name: 'Español' },
];

const I18N = {
  en: {
    'common.ok': 'OK', 'common.cancel': 'Cancel', 'common.save': 'Save', 'common.delete': 'Delete', 
    'common.noPhoto': 'No image', 'dlg.alert': 'Notice', 'dlg.confirm': 'Confirm', 'o': 'or',

  //header ->
    'header.home': 'Home', 'header.settings': 'Settings', 'header.language': 'Language', 'header.login': 'Log in',
  
  //footer ->
    'footer.text': 'Create your own level lists and share them.', 'footer.reports': 'Reports', 'footer.copy': 'independent project · created by',
    'legal.privacy': 'Privacy policy', 'legal.terms': 'Terms of use',

    'view.top': 'Back to top',

//vista (SPA): main ----->
    'profile.edit': 'Edit profile', 'profile.id': 'ID: {id}',

    'home.gdProfile': 'Geometry Dash - Stats:', 'home.gdRank': 'Global Top',
    'gd.editTitle': 'Edit GD stats', 'profile.gdName': 'Username:', 'profile.gdId': 'ID:', 'profile.gdRank': 'Global top:',

    'home.main': 'Main list', 'home.others': 'Other lists', 

    'list.edit': 'Edit list', 'list.setMain': 'Set as main', 'list.unsetMain': 'Remove from main',

    'list.by': 'By {name}', 'home.demons': 'Demons', 'home.hardest': 'Hardest',
    'home.lastAdded': 'Last demon added', 'list.view': 'View',

    'home.mainEmpty': 'No main list', 'home.mainEmptyText': 'Create your main list to see it here.', 'home.createMain': 'Create list',

    'lists.reorder': 'Reorder lists', 'list.moveUp': 'Move up', 'list.moveDown': 'Move down', 'lists.needTwo': 'You need to have at least 2 secondary lists.',
    'lists.add': '+ Add', 'lists.empty': 'You have no secondary lists.', 'home.listEmpty': 'No demons',

    'io.import': 'Import', 'io.export': 'Export', 'view.stats': 'Stats', 'io.options': 'Options',

//vista de bienvenida --->
    'welcome.h1': 'Create and organize your own',
    'welcome.account': 'Log in', 'welcome.guest': 'Enter as guest', 'welcome.levels': 'Levels',

    'welcome.text': 'Create your Geometry Dash demons list: rank your hardest levels and record the number of attempts and the date of completion for each one.',

    'welcome.f1t': 'Autocomplete', 'welcome.f1d': 'More than 10,000 levels with automatic completion.',
    'welcome.f2t': 'Demon list', 'welcome.f2d': 'Reorder, filter, and search through your list of demons.',
    'welcome.f3t': 'Records', 'welcome.f3d': 'Stores the number of attempts and the date of completion for each level.',
    'welcome.f4t': 'Themes', 'welcome.f4d': 'Choose from 10 different themes and customize your profile.',

//modales y pops de modal --->

  //modal-perfil ->
    'profile.editTitle': 'Edit profile',
    'profile.uploadImg': 'Upload image', 'profile.removeImg': 'Remove image', 'profile.uploadBanner': 'Upload banner', 'profile.removeBanner': 'Remove banner', 'profile.bannerColor': 'Change color',
    'profile.editBanner': 'Edit banner', 'profile.editAvatar': 'Edit picture', 'color.title': 'Pick a color', 'color.reset': 'Reset', 'color.apply': 'Apply',

    'login.bannerNeeded': 'Log in to upload a banner.',

    'profile.username': 'Username:', 'profile.name': 'your name', 'profile.country': 'Nationality:', 'profile.countryPh': 'Search your country...',
    
    'profile.bio': 'Biography:', 'profile.noBio': 'No biography.',

    'profile.type': 'Platform:', 'profile.typeNone': 'Not specified', 'profile.typePc': 'PC', 'profile.typeMobile': 'Mobile',
    'profile.bioPh': 'This video game is so easy...',

  //modal-iniciar sesion ->
    'login.title': 'Log in', 'auth.text': 'Sign in to save your lists in the cloud and use them on any device.',
    'auth.google': 'Continue with Google', 'auth.legal': 'By continuing, you accept our {terms} and {privacy}.',

    'acc.title': 'Account', 'acc.logged': 'Signed in as {email}', 'acc.signOut': 'Sign out',

    'auth.overwriteTitle': 'Existing account', 'auth.overwriteBack': 'Go back', 'auth.overwriteOk': 'Continue',
    'auth.overwriteText': 'This account already has saved data. If you continue, it will replace the data currently on this device. Do you wish to continue?', 'acc.error': 'Could not sync with the cloud. Check your connection.',

  //modal-vincular (en proceso) ->
    'sync.title': 'Link account', 'sync.submit': 'Link', 
    'sync.user': 'Geometry Dash username or ID:', 'sync.soon': 'Coming soon, with faith.',

    'sync.infoBtn': 'Information', 'sync.infoTitle': 'Link account', 'sync.infoText': 'We are still working on this feature. It will be available in upcoming versions :)',
  // modal-exportar lista como imagen ->
    'export.btn': 'List', 'export.quick': 'Quick select:', 'export.extra': 'Extra options:',
    'export.title': 'Download list image', 'export.from': 'From:', 'export.to': 'To:', 'export.all': 'All', 'export.top': 'Top {n}',
    'export.hint': 'Select the levels you wish to include in the image, a maximum of {max} per download.', 
    'export.profile': 'Include photo and name',
    'export.range': 'Selected: #{from} – #{to} · ({n} demons)', 'export.download': 'Download',

  //modal-lista ->
    'listm.new': 'Create new list', 'listm.edit': 'Edit list', 'listm.create': 'Create list', 'listm.saveChanges': 'Save', 'listm.favTitle': 'Mark as favorite', 

    'listm.upload': 'Upload banner', 'listm.remove': 'Remove banner', 'listm.png': 'Download image', 
    
    'listm.banner': 'List banner or image:', 'listm.name': 'List name:',

    'listm.blurOff': 'Card blur is turned off in Settings.',

    'listm.import': 'Import list', 'listm.export': 'Export list', 
    'listm.invalidFile': 'This format is not supported.', 'listm.importErr': 'Error, the list could not be imported.', 'listm.importOk': 'List imported successfully.',
    'listm.replaceConfirm': 'This will replace the demons of this list with the ones in the file. Continue?', 'listm.deleteConfirm': 'Delete "{title}" and all its demons? This cannot be undone.',
    
  //modal-demon ->
    'demon.add': 'Add demon', 'demon.edit': 'Edit demon', 'demon.save': 'Save', 'demon.create': 'Add demon',

    'demon.thumbHint': 'Icon preview - thumbnail:', 'demon.name': 'Name:', 'demon.creator': 'Creator:', 'demon.difficulty': 'Difficulty:',
    'demon.levelId': 'ID:', 'demon.attempts': 'Attempts:', 'demon.winDate': 'Win date:', 'demon.position': 'Position:',

    'demon.yt': 'YouTube URL:',

    'demon.deleteConfirm': 'Delete "{name}" from this list? This cannot be undone.',

//vista (SPA): Lista ----->

    'view.subtitle': 'Created by {name} · {n} demons', 'view.listId': 'list: {id}',
    'view.filters': 'Filters', 'view.difficulty': 'Difficulty', 'view.all': 'All', 'view.favFilter': 'Filter favorites', 'view.onlyFav': 'Favorites only',

    'export.needLogin': 'Log in to download your list as a PNG.',

    'view.lock': 'Lock/unlock dragging', 'view.thumbYt': 'Show demon icons', 'view.sort': 'Sort by',

    'view.search': 'Filter by name or position...', 'sort.custom': 'Custom order', 'sort.custom_rev': 'Reversed order', 'sort.attempts_desc': 'Most attempts', 
    'sort.attempts_asc': 'Fewest attempts', 'sort.recent': 'Newest date', 'sort.oldest': 'Oldest date',

    'view.addDemon': '+ Demon', 'view.noMatch': 'No demon matches the filters', 'view.noMatchText': 'Change the search or the filters to see more results.',
    'view.empty': 'This list has no demons yet', 'view.emptyText': 'Press to add your first demon.',
    
    'view.compact': 'Compact view', 'view.count': 'Showing {shown} of {total} demons', 'view.clearFilters': 'Clear filters',

    'stats.show': 'Show statistics', 'stats.profile': 'View profile', 'stats.info': 'Information',
    'stats.attempts': 'Attempts', 'stats.total': 'Total', 'stats.avg': 'Average', 
    'stats.calendar': 'Chart', 'stats.demons': 'Demons', 'stats.realDiff': 'Difficulty',
    'stats.attHint': 'Only demons with recorded attempts are taken into account for this data.',
    'stats.calHint': 'Statistics for the last 5 months.\nFirst bar: Total demons completed each month.\nSecond bar: Average difficulty per month on a scale from 1 (Easy) to 5 (Extreme).',

  //card-demon ->
    'card.publishedBy': 'published by {name}', 'card.by': 'by {name}', 'card.attempts': 'Attempts:', 'card.date': 'Date:',
    'card.edit': 'Edit demon', 'card.addBelow': 'Add demon below', 'card.showcase': 'Watch showcase',

    'common.name': 'Name', 'common.creator': 'Creator', 'common.difficulty': 'Difficulty',
  
  //demon-aleatorio ->
    'dice.title': 'Random demon',
    'dice.again': 'Roll again', 'dice.empty': 'Add some demons to your list first.', 'dice.copy': 'Copy ID', 'dice.copied': 'Copied!',
    'compact.title': 'Overview',
    
    'common.close': 'Close', 'hint.addDemon': 'To add another demon, hover over a demon card and press (+).',
    'view.lockBlocked': 'Clear the filters or sort mode to unlock dragging.',

//vista (SPA): configuracion ----->

    'settings.title': 'Settings', 'settings.subtitle': 'Appearance and data', 
    
    'settings.theme': 'Theme', 'settings.themeHint': 'Preset themes, solid colors and gradients.',

    'theme.blue': 'Blue', 'theme.white': 'White', 'theme.dark': 'Dark', 'theme.purple': 'Purple', 'theme.rosa-dark': 'Dark pink', 'theme.halloween': 'Halloween',
    'theme.atardecer': 'Sunset', 'theme.neon': 'Neon', 'theme.bosque': 'Forest', 'theme.pizarra': 'Slate', 'theme.gris': 'Gray',

    'settings.blur': 'List background', 'settings.blurHint': 'A dark background with a gradient appears on the list cards.',
    'settings.blurList': 'Degraded',
    
    'settings.data': 'Your account data', 
    'settings.dataHint': `All data is stored only in this browser. Clearing the cache or site data may erase everything. You can avoid this by exporting a backup first or by signing in.`,
    'settings.export': 'Export', 'settings.import': 'Import <small style="color: var(--mute); font-size: 11.5px; ">(overwrites everything)</small>', 

    'settings.invalidFile': 'The file is not valid.', 'settings.incompatible': 'The file does not match or is not compatible.',
    'settings.importConfirm': 'This will replace ALL your current data with the file contents. Continue?', 'settings.importTooBig': 'Import failed, the file is too large.',

    'settings.delHint': 'Delete all your account data. If you are not signed in, the data saved in this browser will be deleted.', 'settings.dataHintCloud': 'Your data is stored in your account. Export a backup before deleting or importing.', 
    'settings.deleteConfirm': 'ALL your data on this device will be deleted. There is no way to recover it. Continue?', 'settings.deleteConfirmCloud': 'ALL your account data will be deleted. There is no way to recover it. Continue?',
    'settings.deleteAll': 'Delete all data', 'settings.deletePrompt': 'Type DELETE to confirm', 'settings.deleteWord': 'DELETE',

    'storage.full': 'Changes could not be saved: the browser storage is full. Try smaller images.'
  },

  es: {
    'common.ok': 'Aceptar', 'common.cancel': 'Cancelar', 'common.save': 'Guardar', 'common.delete': 'Eliminar', 
    'common.noPhoto': 'Sin imagen', 'dlg.alert': 'Aviso', 'dlg.confirm': 'Confirmar', 'o': 'o',

  //header ->
    'header.home': 'Inicio', 'header.settings': 'Ajustes', 'header.language': 'Idioma', 'header.login': 'Iniciar sesión',
  
  //footer ->
    'footer.text': 'Crea tus propias listas de niveles y compártelas.', 'footer.reports': 'Reportes', 'footer.copy': 'proyecto independiente · creado por',
    'legal.privacy': 'Política de privacidad', 'legal.terms': 'Términos de uso',

    'view.top': 'Volver arriba',

//vista (SPA): main ----->
    'profile.edit': 'Editar perfil', 'profile.id': 'ID: {id}',

    'home.gdProfile': 'Geometry Dash - Estadísticas:', 'home.gdRank': 'Top Global',
    'gd.editTitle': 'Editar estadísticas de GD', 'profile.gdName': 'Usuario:', 'profile.gdId': 'ID:', 'profile.gdRank': 'Top global:',

    'home.main': 'Lista principal', 'home.others': 'Otras listas', 

    'list.edit': 'Editar lista', 'list.setMain': 'Establecer como principal', 'list.unsetMain': 'Quitar de principal',

    'list.by': 'Por {name}', 'home.demons': 'Demons', 'home.hardest': 'Hardest',
    'home.lastAdded': 'Último Demon agregado', 'list.view': 'Ver',

    'home.mainEmpty': 'Sin lista principal', 'home.mainEmptyText': 'Crea tu lista principal para verla aquí.', 'home.createMain': 'Crear lista',

    'lists.reorder': 'Ordenar listas', 'list.moveUp': 'Subir', 'list.moveDown': 'Bajar', 'lists.needTwo': 'Tienes que tener al menos 2 listas secundarias.',

    'lists.add': '+ Añadir', 'lists.empty': 'No tienes listas secundarias.', 'home.listEmpty': 'Sin demons',

    'io.import': 'Importar', 'io.export': 'Exportar', 'view.stats': 'Estadísticas', 'io.options': 'Opciones',

//vista de bienvenida --->
    'welcome.h1': 'Crea y organiza tu propia',
    'welcome.account': 'Iniciar sesión', 'welcome.guest': 'Entrar sin cuenta', 'welcome.levels': 'Niveles',

    'welcome.text': 'Crea tu lista de demons de Geometry Dash: ordena tus niveles más difíciles y registra los intentos y la fecha de victoria de cada uno.',

    'welcome.f1t': 'Autocompletado', 'welcome.f1d': 'Más de 10.000 niveles con autocompletado automático.',
    'welcome.f2t': 'Lista de demons', 'welcome.f2d': 'Reordena, filtra y busca en tu lista de demons.',
    'welcome.f3t': 'Registro', 'welcome.f3d': 'Guarda los intentos y la fecha de victoria de cada nivel.',
    'welcome.f4t': 'Temas', 'welcome.f4d': 'Elige entre 10 temas distintos y personaliza tu perfil.',

//modales y pops de modal --->

  //modal-perfil ->
    'profile.editTitle': 'Editar perfil',
    'profile.uploadImg': 'Subir imagen', 'profile.removeImg': 'Quitar imagen', 'profile.uploadBanner': 'Subir banner', 'profile.removeBanner': 'Quitar banner', 'profile.bannerColor': 'Cambiar color',
    'profile.editBanner': 'Editar banner', 'profile.editAvatar': 'Editar imagen', 'color.title': 'Elegir color', 'color.reset': 'Restablecer', 'color.apply': 'Aplicar',

    'login.bannerNeeded': 'Inicia sesión para subir un banner.',

    'profile.username': 'Nombre de usuario:', 'profile.name': 'tu nombre', 'profile.country': 'Nacionalidad:', 'profile.countryPh': 'Busca tu país...',
    
    'profile.bio': 'Biografía:', 'profile.noBio': 'Sin biografía.',

    'profile.type': 'Plataforma:', 'profile.typeNone': 'Sin especificar', 'profile.typePc': 'PC', 'profile.typeMobile': 'Celular',
    'profile.bioPh': 'Que fácil este videojuego...',

  //modal-iniciar sesion ->
    'login.title': 'Iniciar sesión', 'auth.text': 'Inicia sesión para guardar tus listas en la nube y usarlas en cualquier dispositivo.',
    'auth.google': 'Continuar con Google', 'auth.legal': 'Al continuar, aceptas nuestros {terms} y la {privacy}.',

    'acc.title': 'Cuenta', 'acc.logged': 'Sesión iniciada como {email}', 'acc.signOut': 'Cerrar sesión',

    'auth.overwriteTitle': 'Cuenta existente', 'auth.overwriteBack': 'Volver', 'auth.overwriteOk': 'Continuar',
    'auth.overwriteText': 'Esta cuenta ya tiene datos guardados. Si continúas, reemplazarán los datos que tienes ahora en este dispositivo. ¿Deseas continuar?', 'acc.error': 'No se pudo sincronizar con la nube. Revisa tu conexión.',

  //modal-vincular (en proceso) ->
    'sync.title': 'Vincular cuenta', 'sync.submit': 'Vincular', 
    'sync.user': 'Usuario o ID de Geometry Dash:', 'sync.soon': 'Próximamente, con fe.',

    'sync.infoBtn': 'Información', 'sync.infoTitle': 'Vincular cuenta', 'sync.infoText': 'Aún estamos trabajando en esta función. Estará disponible en próximas versiones :)',

  // modal-exportar lista como imagen ->
    'export.btn': 'Lista', 'export.quick': 'Selección rápida:', 'export.extra': 'Opciones extras:',
    'export.title': 'Descargar imagen de lista', 'export.from': 'Desde:', 'export.to': 'Hasta:', 'export.all': 'Todos', 'export.top': 'Top {n}',
    'export.hint': 'Selecciona los niveles que quieras incluir en la imagen, un máximo de {max} por descarga.', 
    'export.profile': 'Incluir foto y nombre',
    'export.range': 'Seleccionados: #{from} – #{to} · ({n} demons)', 'export.download': 'Descargar',

  //modal-lista ->
    'listm.new': 'Crear nueva lista', 'listm.edit': 'Editar lista', 'listm.create': 'Crear lista', 'listm.saveChanges': 'Guardar', 'listm.favTitle': 'Marcar como favorito', 

    'listm.upload': 'Subir banner', 'listm.remove': 'Eliminar banner', 'listm.png': 'Descargar imagen',
    
    'listm.banner': 'Banner o imagen de lista:', 'listm.name': 'Nombre de lista:',

    'listm.blurOff': 'El difuminado de cartas está desactivado en Ajustes.',

    'listm.import': 'Importar lista', 'listm.export': 'Exportar lista', 
    'listm.invalidFile': 'Este formato no es compatible.', 'listm.importErr': 'Error, no se pudo importar la lista.', 'listm.importOk': 'Lista importada con éxito.',
    'listm.replaceConfirm': 'Esto reemplazará los demons de esta lista por los del archivo. ¿Continuar?', 'listm.deleteConfirm': '¿Eliminar "{title}" y todos sus demons? No se podrán recuperar.',
    
  //modal-demon ->
    'demon.add': 'Agregar demon', 'demon.edit': 'Editar demon', 'demon.save': 'Guardar', 'demon.create': 'Agregar demon',

    'demon.thumbHint': 'Previsualización de icono - miniatura:', 'demon.name': 'Nombre:', 'demon.creator': 'Creador:', 'demon.difficulty': 'Dificultad:',
    'demon.levelId': 'ID:', 'demon.attempts': 'Intentos:', 'demon.winDate': 'Fecha de victoria:', 'demon.position': 'Posición:',

    'demon.yt': 'URL de YouTube:',

    'demon.deleteConfirm': '¿Eliminar "{name}" de esta lista? No se podrá recuperar.',

//vista (SPA): Lista ----->

    'view.subtitle': 'Creado por {name} · {n} demons', 'view.listId': 'lista: {id}',
    'view.filters': 'Filtros', 'view.difficulty': 'Dificultad', 'view.all': 'Todas', 'view.favFilter': 'Filtrar favoritos', 'view.onlyFav': 'Solo favoritos',

    'export.needLogin': 'Inicia sesión para descargar tu lista como PNG.',

    'view.lock': 'Bloquear/desbloquear arrastre', 'view.thumbYt': 'Mostrar iconos Demon', 'view.sort': 'Ordenar por',

    'view.search': 'Filtrar por nombre o posición...', 'sort.custom': 'Orden personalizado', 'sort.custom_rev': 'Orden invertido', 'sort.attempts_desc': 'Más intentos', 
    'sort.attempts_asc': 'Menos intentos', 'sort.recent': 'Fecha más reciente', 'sort.oldest': 'Fecha más antigua',

    'view.addDemon': '+ Demon', 'view.noMatch': 'Ningún demon coincide con los filtros', 'view.noMatchText': 'Cambia la búsqueda o filtros para ver más resultados.',
    'view.empty': 'Esta lista aún no tiene demons', 'view.emptyText': 'Pulsa para añadir tu primer demon.',
    
    'view.compact': 'Vista compacta', 'view.count': 'Mostrando {shown} de {total} demons', 'view.clearFilters': 'Limpiar filtros',

    'stats.show': 'Ver estadísticas', 'stats.profile': 'Ver perfil', 'stats.info': 'Información',
    'stats.attempts': 'Intentos', 'stats.total': 'Total', 'stats.avg': 'Promedio', 
    'stats.calendar': 'Gráfica', 'stats.demons': 'Demons', 'stats.realDiff': 'Dificultad',
    'stats.attHint': 'Para estos datos solo se toman en cuenta los demons que tienen intentos registrados.',
    'stats.calHint': 'Estadísticas de los últimos 5 meses.\nPrimera barra: Total de demons completados en cada mes.\nSegunda Barra: Promedio de dificultad por mes. Se toma una escala de 1 (Easy) hasta 5 (Extreme).',

  //card-demon ->
    'card.publishedBy': 'publicado por {name}', 'card.by': 'por {name}', 'card.attempts': 'Intentos:', 'card.date': 'Fecha:',
    'card.edit': 'Editar demon', 'card.addBelow': 'Agregar demon debajo', 'card.showcase': 'Ver showcase',
  
  //demon-aleatorio ->
    'dice.title': 'Demon aleatorio',
    'dice.again': 'Volver a tirar', 'dice.empty': 'Primero agrega demons a tu lista.', 'dice.copy': 'copiar ID', 'dice.copied': '¡Copiado!',
    
    'common.close': 'Cerrar', 'hint.addDemon': 'Para agregar un nivel pasa el mouse sobre una carta demon y pulsa (+).',
    'view.lockBlocked': 'Quita los filtros o el modo de orden para desbloquear el arrastre.',

//vista (SPA): configuracion ----->

    'settings.title': 'Ajustes', 'settings.subtitle': 'Apariencia y datos', 
    
    'settings.theme': 'Tema', 'settings.themeHint': 'Temas preestablecidos, colores sólidos y gradientes.',

    'theme.blue': 'Azul', 'theme.white': 'Blanco', 'theme.dark': 'Oscuro', 'theme.purple': 'Púrpura', 'theme.rosa-dark': 'Rosa oscuro', 'theme.halloween': 'Halloween',
    'theme.atardecer': 'Atardecer', 'theme.neon': 'Neón', 'theme.bosque': 'Bosque', 'theme.pizarra': 'Pizarra', 'theme.gris': 'Gris',

    'settings.blur': 'Fondo de Listas', 'settings.blurHint': 'Aparece en las cartas de listas, un fondo oscuro con degradado.',
    'settings.blurList': 'Degradado',
    
    'settings.data': 'Datos de tu cuenta', 
    'settings.dataHint': `Todos los datos se guardan únicamente en este navegador, al borrar el caché o datos del sistema es posible que toda la información se pierda. Puedes evitar esto exportando una copia de seguridad antes o iniciando sesión.`,
    'settings.export': 'Exportar', 'settings.import': 'Importar <small style="color: var(--mute); font-size: 11.5px; ">(sobreescribe todo)</small>', 

    'settings.invalidFile': 'El archivo no es válido.', 'settings.incompatible': 'El archivo no coincide o no es compatible.',
    'settings.importConfirm': 'Esto reemplazará TODOS tus datos actuales por los del archivo. ¿Continuar?', 'settings.importTooBig': 'Error al importar, archivo demasiado grande.',

    'settings.delHint': 'Borrar todos los datos de tu cuenta. Si no has iniciado sesión, se borrarán los datos guardados en este navegador.', 'settings.dataHintCloud': 'Tus datos se guardan en tu cuenta. Exporta una copia de seguridad antes de borrar o importar.', 
    'settings.deleteConfirm': 'Se borrarán TODOS tus datos en este dispositivo. No hay manera de recuperarlos. ¿Continuar?', 'settings.deleteConfirmCloud': 'Se borrarán TODOS los datos de tu cuenta, no hay manera de recuperarlos. ¿Continuar?',
    'settings.deleteAll': 'Borrar todos los datos', 'settings.deletePrompt': 'Escribe BORRAR para confirmar', 'settings.deleteWord': 'BORRAR',

    'storage.full': 'No se pudieron guardar los cambios: el almacenamiento del navegador está lleno. Prueba con imágenes más ligeras.'
  },

// -- proceso
  fr: {
    'meta.title': 'My Demon List | Geometry Dash',
    'meta.desc': 'Créez et organisez vos listes personnelles de demons Geometry Dash : tier, essais, date de victoire, favoris et vos statistiques.',
  
  //generales ->
    'common.ok': 'Ok', 'common.cancel': 'Annuler', 'common.save': 'Enregistrer', 'common.delete': 'Supprimer', 
    'common.noPhoto': 'Sans image',
    'dlg.alert': 'Avis', 'dlg.confirm': 'Confirmer', 'o': 'ou',

  //header ->
    'header.home': 'Accueil', 'header.settings': 'Paramètres', 'header.language': 'Langue', 'header.login': 'Se connecter',
  
  //footer ->
    'footer.text': 'Créez vos propres listes de niveaux et partagez-les.', 'footer.reports': 'Signalements', 'footer.copy': 'projet indépendant · créé par',
    'legal.privacy': 'Politique de confidentialité', 'legal.terms': 'Conditions d\'utilisation',

    'view.top': 'Retour en haut',

//vista (SPA): main ----->
    'profile.edit': 'Modifier le profil', 'profile.id': 'ID : {id}',

    'home.gdProfile': 'Geometry Dash - Statistiques :', 'home.gdRank': 'Top mondial',
    'gd.editTitle': 'Modifier les statistiques GD', 'profile.gdName': 'Utilisateur :', 'profile.gdId': 'ID :', 'profile.gdRank': 'Top mondial :',

    'home.main': 'Liste principale', 'home.others': 'Autres listes', 

    'list.edit': 'Modifier la liste', 'list.setMain': 'Définir comme principale', 'list.unsetMain': 'Retirer des principales',

    'list.by': 'Par {name}', 'home.demons': 'Demons', 'home.hardest': 'Hardest',
    'home.lastAdded': 'Dernier demon ajouté', 'list.view': 'Voir',

    'home.mainEmpty': 'Aucune liste principale', 'home.mainEmptyText': 'Créez votre liste principale pour la voir ici.', 'home.createMain': 'Créer une liste',

    'lists.reorder': 'Réorganiser les listes', 'list.moveUp': 'Monter', 'list.moveDown': 'Descendre',
    'lists.add': '+ Ajouter', 'lists.empty': 'Vous n\'avez aucune liste secondaire.', 'home.listEmpty': 'Aucun demon',

    'io.import': 'Importer', 'io.export': 'Exporter', 'view.stats': 'Statistiques', 'io.options': 'Options',

//vista de bienvenida --->
    'welcome.text': 'Gérez votre progression, créez votre propre Demon List de vos niveaux les plus difficiles sur Geometry Dash', 'welcome.h1': 'Créez et organisez votre propre',
    'welcome.account': 'Se connecter', 'welcome.guest': 'Entrer sans compte', 'welcome.levels': 'Niveaux enregistrés',

    'welcome.f1t': 'Saisie automatique', 'welcome.f1d': 'Auto-complétion automatique des niveaux.',
    'welcome.f2t': 'Éditeur de liste', 'welcome.f2d': 'Modifiez facilement votre demon list.',
    'welcome.f3t': 'Enregistrement', 'welcome.f3d': 'Enregistrez la date et le nombre de tentatives pour chaque niveau.',
    'welcome.f4t': 'Thèmes', 'welcome.f4d': 'Choisissez parmi plusieurs thèmes personnalisés.',

//modales y pops de modal --->

  //modal-perfil ->
    'profile.editTitle': 'Modifier le profil',
    'profile.uploadImg': 'Téléverser une image', 'profile.removeImg': 'Supprimer l\'image', 'profile.uploadBanner': 'Téléverser une bannière', 'profile.removeBanner': 'Supprimer la bannière', 'profile.bannerColor': 'Changer de couleur',
    'profile.editBanner': 'Modifier la bannière', 'profile.editAvatar': 'Modifier l\'image', 'color.title': 'Choisir une couleur', 'color.reset': 'Réinitialiser', 'color.apply': 'Appliquer',

    'login.bannerNeeded': 'Connectez-vous pour téléverser une bannière.',

    'profile.username': 'Nom d\'utilisateur :', 'profile.name': 'votre nom', 'profile.country': 'Nationalité :', 'profile.countryPh': 'Recherchez votre pays...',
    
    'profile.bio': 'Biographie :', 'profile.noBio': 'Aucune biographie.',

    'profile.type': 'Plateforme :', 'profile.typeNone': 'Non spécifiée', 'profile.typePc': 'PC', 'profile.typeMobile': 'Mobile',
    'profile.bioPh': 'Décrivez-vous en une phrase ...',

  //modal-iniciar sesion ->
    'login.title': 'Se connecter', 'auth.text': 'Connectez-vous pour enregistrer vos listes dans le cloud et les utiliser sur tout appareil.',
    'auth.google': 'Continuer avec Google', 'auth.legal': 'En continuant, vous acceptez nos {terms} et la {privacy}.',

    'acc.title': 'Compte', 'acc.logged': 'Connecté en tant que {email}', 'acc.signOut': 'Se déconnecter',

    'auth.overwriteTitle': 'Compte existant', 'auth.overwriteBack': 'Revenir', 'auth.overwriteOk': 'Continuer',
    'auth.overwriteText': 'Ce compte contient déjà des données. Si vous continuez, elles remplaceront les données actuellement présentes sur cet appareil. Souhaitez-vous continuer ?', 'acc.error': 'Synchronisation impossible. Vérifiez votre connexion.',

  //modal-vincular (en proceso) ->
    'sync.title': 'Lier un compte', 'sync.submit': 'Lier', 
    'sync.user': 'Nom d\'utilisateur ou ID Geometry Dash :', 'sync.soon': 'Bientôt disponible, avec foi.',

    'sync.infoBtn': 'Informations', 'sync.infoTitle': 'Lier un compte', 'sync.infoText': 'Nous travaillons encore sur cette fonctionnalité. Elle sera disponible dans les prochaines versions :)',
  // modal-exportar lista como imagen ->
    'export.btn': 'Liste', 'export.quick': 'Sélection rapide :', 'export.extra': 'Options supplémentaires :',
    'export.title': 'Télécharger l\'image de la liste', 'export.from': 'De :', 'export.to': 'À :', 'export.all': 'Tous', 'export.top': 'Top {n}',
    'export.hint': 'Sélectionnez les niveaux que vous souhaitez inclure dans l\'image, avec un maximum de {max} par téléchargement.', 
    'export.profile': 'Inclure la photo et le nom',
    'export.range': 'Sélectionnés : #{from} – #{to} · ({n} demons)', 'export.download': 'Télécharger',

  //modal-lista ->
    'listm.new': 'Créer une nouvelle liste', 'listm.edit': 'Modifier la liste', 'listm.create': 'Créer la liste', 'listm.saveChanges': 'Enregistrer', 'listm.favTitle': 'Marquer comme favorite', 

    'listm.upload': 'Téléverser une bannière', 'listm.remove': 'Supprimer la bannière', 'listm.png': 'Télécharger l\'image', 
    
    'listm.banner': 'Bannière ou image de la liste :', 'listm.name': 'Nom de la liste :',

    'listm.blurOff': 'Le flou des cartes est désactivé dans les Paramètres.',

    'listm.import': 'Importer une liste', 'listm.export': 'Exporter la liste', 
    'listm.invalidFile': 'Ce format n\'est pas pris en charge.', 'listm.importErr': 'Erreur : impossible d\'importer la liste.', 'listm.importOk': 'Liste importée avec succès.',
    'listm.replaceConfirm': 'Cela remplacera les demons de cette liste par ceux du fichier. Continuer ?', 'listm.deleteConfirm': 'Supprimer « {title} » et tous ses demons ? Impossible de les récupérer.',
    
  //modal-demon ->
    'demon.add': 'Ajouter un demon', 'demon.edit': 'Modifier le demon', 'demon.save': 'Enregistrer', 'demon.create': 'Ajouter un demon',

    'demon.thumbHint': 'Aperçu de l\'icône - miniature :', 'demon.name': 'Nom :', 'demon.creator': 'Créateur :', 'demon.difficulty': 'Difficulté :',
    'demon.levelId': 'ID :', 'demon.attempts': 'Essais :', 'demon.winDate': 'Date de victoire :', 'demon.position': 'Position :',

    'demon.yt': 'URL YouTube :',

    'demon.deleteConfirm': 'Supprimer « {name} » de cette liste ? Impossible de le récupérer.',

//vista (SPA): Lista ----->

    'view.subtitle': 'Créée par {name} · {n} demons', 'view.listId': 'liste : {id}',
    'view.filters': 'Filtres', 'view.difficulty': 'Difficulté', 'view.all': 'Toutes', 'view.favFilter': 'Filtrer les favoris', 'view.onlyFav': 'Uniquement les favoris',

    'export.needLogin': 'Connectez-vous pour télécharger votre liste en PNG.',

    'view.search': 'Rechercher un niveau...', 'view.lock': 'Verrouiller/déverrouiller le glissement', 'view.thumbYt': 'Afficher les icônes demon', 'view.sort': 'Trier par',

    'sort.custom_rev': 'Ordre inversé', 'sort.custom': 'Ordre personnalisé', 'sort.attempts_desc': 'Plus d\'essais', 
    'sort.attempts_asc': 'Moins d\'essais', 'sort.recent': 'Date la plus récente', 'sort.oldest': 'Date la plus ancienne',

    'view.addDemon': '+ Demon', 'view.noMatch': 'Aucun demon ne correspond aux filtres', 'view.noMatchText': 'Modifiez la recherche ou les filtres pour voir plus de résultats.',
    'view.empty': 'Cette liste ne contient pas encore de demons', 'view.emptyText': 'Appuyez pour ajouter votre premier demon.',
  
  //card-demon ->
    'card.publishedBy': 'publié par {name}', 'card.by': 'par {name}', 'card.attempts': 'Essais :', 'card.date': 'Date :',
    'card.edit': 'Modifier le demon', 'card.addBelow': 'Ajouter un demon ci-dessous', 'card.showcase': 'Voir le showcase',

    'common.name': 'Nom', 'common.creator': 'Créateur', 'common.difficulty': 'Difficulté',
  
  //demon-aleatorio ->
    'dice.title': 'Demon aléatoire',
    'dice.again': 'Relancer', 'dice.empty': 'Ajoutez d\'abord des demons à votre liste.', 'dice.copy': 'Copier l\'ID', 'dice.copied': 'Copié !',
    'compact.title': 'Aperçu',
    
    'common.close': 'Fermer', 'hint.addDemon': 'Pour ajouter un autre demon, survolez une carte demon et cliquez sur (+).',
    'view.lockBlocked': 'Retirez les filtres ou le mode de tri pour déverrouiller le glissement.',

//vista (SPA): configuracion ----->

    'settings.title': 'Paramètres', 'settings.subtitle': 'Apparence et données', 
    
    'settings.theme': 'Thème', 'settings.themeHint': 'Thèmes prédéfinis, couleurs unies et dégradés.',

    'theme.blue': 'Bleu', 'theme.white': 'Blanc', 'theme.dark': 'Sombre', 'theme.purple': 'Violet', 'theme.rosa-dark': 'Rose sombre', 'theme.halloween': 'Halloween',
    'theme.atardecer': 'Coucher de soleil', 'theme.neon': 'Néon', 'theme.bosque': 'Forêt', 'theme.pizarra': 'Ardoise', 'theme.gris': 'Gris',

    'settings.blur': 'Flou', 'settings.blurHint': 'Affiché sur les cartes de listes : un fond sombre et flouté avec la miniature de la liste.',
    'settings.blurList': 'Flou',
    
    'settings.data': 'Données de votre compte', 
    'settings.dataHint': `Toutes les données sont enregistrées uniquement dans ce navigateur ; vider le cache ou les données du site peut tout effacer. Vous pouvez l'éviter en exportant d'abord une sauvegarde ou en vous connectant.`,
    'settings.export': 'Exporter', 'settings.import': 'Importer <small style="color: var(--mute); font-size: 11.5px; ">(écrase tout)</small>', 

    'settings.invalidFile': 'Le fichier n\'est pas valide.', 'settings.incompatible': 'Le fichier ne correspond pas ou n\'est pas compatible.',
    'settings.importConfirm': 'Cela remplacera TOUTES vos données actuelles par le contenu du fichier. Continuer ?', 'settings.importTooBig': 'Échec de l\'importation, le fichier est trop volumineux.',

    'settings.delHint': 'Supprimer toutes les données de votre compte. Si vous n\'êtes pas connecté, les données enregistrées dans ce navigateur seront supprimées.', 'settings.dataHintCloud': 'Vos données sont enregistrées dans votre compte. Exportez une sauvegarde avant toute suppression ou importation.', 
    'settings.deleteConfirm': 'TOUTES vos données sur cet appareil seront supprimées. Impossible de les récupérer. Continuer ?', 'settings.deleteConfirmCloud': 'TOUTES les données de votre compte seront supprimées. Impossible de les récupérer. Continuer ?',
    'settings.deleteAll': 'Supprimer toutes les données', 'settings.deletePrompt': 'Tapez SUPPRIMER pour confirmer', 'settings.deleteWord': 'SUPPRIMER',

    'storage.full': 'Les modifications n\'ont pas pu être enregistrées : le stockage du navigateur est plein. Essayez avec des images plus petites.'
  }
};

const currentLang = () => (typeof appSettings !== 'undefined' && I18N[appSettings.lang]) ? appSettings.lang : 'en';

function t(key, vars) {
  let text = I18N[currentLang()][key] ?? I18N.en[key] ?? key;
  if (vars) text = text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return text;
}

function applyLanguage() {
  const lang = currentLang();
  document.documentElement.lang = lang;

  const setMeta = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute('content', value);
  };
  setMeta('meta[property="og:locale"]', lang === 'fr' ? 'fr_FR' : (lang === 'en' ? 'en_US' : 'es_ES'));

  const topBtn = document.getElementById('btnScrollTop');
  if (topBtn) topBtn.title = t('view.top');

  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });

  applyLegalLanguage(); // no-op fuera de privacy.html / terms.html
}

// ------------------------------------------------------
// Traduccion de paginas legales
// ------------------------------------------------------
 
const LEGAL_I18N = {
  en: {
    privacy: {
      title: 'Privacy Policy | My Demon List',
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
              <path d="M 12 4.22 C 9.43 4.22 7.34 6.31 7.34 8.88 L 7.34 11.23 L 8.98 11.23 L 8.98 8.88 C 8.98 7.21 10.33 5.86 12 5.86 C 13.67 5.86 15.02 7.21 15.02 8.88 L 15.02 11.23 L 16.66 11.23 L 16.66 8.88 C 16.66 6.31 14.57 4.22 12 4.22 Z" />
              <path d="M 7.68 10.37 L 16.32 10.37 C 17.12 10.37 17.76 11.01 17.76 11.81 L 17.76 18.34 C 17.76 19.14 17.12 19.78 16.32 19.78 L 7.68 19.78 C 6.88 19.78 6.24 19.14 6.24 18.34 L 6.24 11.81 C 6.24 11.01 6.88 10.37 7.68 10.37 Z M 12 12.62 C 11.39 12.62 10.9 13.12 10.9 13.73 C 10.9 14.21 11.21 14.62 11.62 14.77 L 11.62 17.04 C 11.62 17.25 11.79 17.42 12 17.42 C 12.21 17.42 12.38 17.25 12.38 17.04 L 12.38 14.77 C 12.79 14.62 13.1 14.21 13.1 13.73 C 13.1 13.12 12.61 12.62 12 12.62 Z" />
            </svg>
          </div>
          <h1>Privacy Policy</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Last updated: October 24, 2026</p>

        <p>My Demon List is an independent project created to organize your own lists of demon levels and keep track of your progress in <strong>Geometry Dash</strong>.</p>

        <h2>1. What data is collected?</h2>
        <ul>
          <li><strong>Account:</strong> if you sign in with Google, we receive your email address and the basic profile data Google provides. We do not receive your password.</li>
          <li><strong>Content you create:</strong> your lists, demons, statistics and profile. We also receive any images you upload and your preference settings (theme and blur).</li>
          <li><strong>Technical data:</strong> when you use level autocomplete, the server receives the search text and your IP address in order to provide a response and limit abuse.</li>
        </ul>

        <h2>2. Where is it stored?</h2>
        <ul>
          <li><strong>Without signing in:</strong> everything is stored only in your browser, in local storage.</li>
          <li><strong>Signed in:</strong> your data is stored in the cloud. Images you upload are kept in public storage: anyone with the direct link can view them. Your browser only keeps basic preferences and the session.</li>
        </ul>

        <h2>3. Third-party services</h2>
        <p>To work, the application uses the following services. Some of them receive your IP address when your browser loads or queries their resources:</p>
        <ul>
          <li><strong>Google:</strong> sign-in and YouTube video thumbnails.</li>
          <li><strong>Supabase:</strong> authentication, database and image storage.</li>
          <li><strong>GitHub Pages:</strong> website hosting.</li>
          <li><strong>Render:</strong> level autocomplete service; it receives the text searched and your IP.</li>
        </ul>
        <p>Level data comes from GD Ladder (gdladder.com), adapted for this project.</p>

        <h2>4. What we don't do</h2>
        <p>We do not sell your data or use analytics. We use your browser's local storage to keep your session and preferences; we do not use tracking cookies. We do not share your information with third parties, except the providers needed for the app to work (section 3).</p>

        <h2>5. Your rights</h2>
        <p>You can export and delete your data at any time from <b>Settings</b>. To delete your account and your email, contact us through the report form.</p>

        <h2>6. Changes and contact</h2>
        <p>We may update this policy; the date above shows the latest version. For questions or requests, use the report form.</p>
      `
    },
    terms: {
      title: 'Terms of Use | My Demon List',
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="80%" height="80%" fill="currentColor">
              <path d="M 19 6 L 14 1 L 5 1 C 3.9 1 3 1.9 3 3 L 3 21 C 3 22.1 3.9 23 5 23 L 19 23 C 20.1 23 21 22.1 21 21 L 21 8 L 19 6 Z M 13 3 L 18.5 8.5 L 13 8.5 L 13 3 Z M 19 21 L 5 21 L 5 3 L 11 3 L 11 10 L 19 10 L 19 21 Z" />
              <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="8" y1="16" x2="16" y2="16" />
              </g>
            </svg>
          </div>
          <h1>Terms of Use</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Last updated: October 24, 2026</p>

        <p>By using or registering on My Demon List, you agree to comply with these terms. If you do not agree with them, please do not use the application.</p>

        <h2>1. Independent project</h2>
        <p>My Demon List is a fan-made project with no affiliation with RobTop Games or Geometry Dash. All names, trademarks, logos and visual assets of the game belong to their respective owners.</p>

        <h2>2. Your account and your content</h2>
        <ul>
          <li>You can use the application anonymously or sign in with Google to sync your data in the cloud.</li>
          <li>You are responsible for what you upload. You keep all rights to your content.</li>
          <li>Your personal data is handled according to the <a href="privacy.html">privacy policy</a>.</li>
        </ul>

        <h2>3. Acceptable use</h2>
        <ul>
          <li>Do not upload content that is illegal, offensive or that infringes third-party rights.</li>
          <li>Do not attempt to abuse or overload the server.</li>
        </ul>

        <h2>4. Availability and liability</h2>
        <p>The service is provided "as is". As an independent project, it is not guaranteed to be uninterrupted or error-free. We are not responsible for accidental loss of data or progress. We recommend exporting a backup copy from <b>Settings</b>.</p>

        <h2>5. Suspension</h2>
        <p>We may limit or delete accounts that violate these terms.</p>

        <h2>6. Changes</h2>
        <p>We may update these terms; continuing to use the application means accepting the current version.</p>
      `
    }
  },
 
// -- proceso
  fr: {
    privacy: {
      title: 'Politique de confidentialité | My Demon List',
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="100%" height="100%" fill="currentColor">
              <path d="M 12 4.22 C 9.43 4.22 7.34 6.31 7.34 8.88 L 7.34 11.23 L 8.98 11.23 L 8.98 8.88 C 8.98 7.21 10.33 5.86 12 5.86 C 13.67 5.86 15.02 7.21 15.02 8.88 L 15.02 11.23 L 16.66 11.23 L 16.66 8.88 C 16.66 6.31 14.57 4.22 12 4.22 Z" />
              <path d="M 7.68 10.37 L 16.32 10.37 C 17.12 10.37 17.76 11.01 17.76 11.81 L 17.76 18.34 C 17.76 19.14 17.12 19.78 16.32 19.78 L 7.68 19.78 C 6.88 19.78 6.24 19.14 6.24 18.34 L 6.24 11.81 C 6.24 11.01 6.88 10.37 7.68 10.37 Z M 12 12.62 C 11.39 12.62 10.9 13.12 10.9 13.73 C 10.9 14.21 11.21 14.62 11.62 14.77 L 11.62 17.04 C 11.62 17.25 11.79 17.42 12 17.42 C 12.21 17.42 12.38 17.25 12.38 17.04 L 12.38 14.77 C 12.79 14.62 13.1 14.21 13.1 13.73 C 13.1 13.12 12.61 12.62 12 12.62 Z" />
            </svg>
          </div>
          <h1>Politique de confidentialité</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Dernière mise à jour : 24 octobre 2026</p>

        <p>My Demon List est un projet indépendant créé pour organiser vos propres listes de niveaux demon et suivre votre progression dans <strong>Geometry Dash</strong>.</p>

        <h2>1. Quelles données sont collectées ?</h2>
        <ul>
          <li><strong>Compte :</strong> si vous vous connectez avec Google, nous recevons votre adresse e-mail et les données de profil de base fournies par Google. Nous ne recevons pas votre mot de passe.</li>
          <li><strong>Contenu que vous créez :</strong> vos listes, demons, statistiques et profil. Nous recevons aussi les images que vous téléversez et vos paramètres de préférence (thème et flou).</li>
          <li><strong>Données techniques :</strong> lorsque vous utilisez l'autocomplétion des niveaux, le serveur reçoit le texte recherché ainsi que votre adresse IP, afin de fournir une réponse et de limiter les abus.</li>
        </ul>

        <h2>2. Où sont-elles stockées ?</h2>
        <ul>
          <li><strong>Sans connexion :</strong> tout est stocké uniquement dans votre navigateur, dans le stockage local.</li>
          <li><strong>Avec connexion :</strong> vos données sont stockées dans le cloud. Les images que vous téléversez sont conservées dans un stockage public : toute personne disposant du lien direct peut les voir. Dans votre navigateur ne restent que les préférences de base et la session.</li>
        </ul>

        <h2>3. Services tiers</h2>
        <p>Pour fonctionner, l'application utilise les services suivants. Certains reçoivent votre adresse IP lorsque votre navigateur charge ou interroge leurs ressources :</p>
        <ul>
          <li><strong>Google :</strong> connexion et miniatures des vidéos YouTube.</li>
          <li><strong>Supabase :</strong> authentification, base de données et stockage des images.</li>
          <li><strong>GitHub Pages :</strong> hébergement du site.</li>
          <li><strong>Render :</strong> service d'autocomplétion des niveaux ; il reçoit le texte recherché et votre IP.</li>
        </ul>
        <p>Les données des niveaux proviennent de GD Ladder (gdladder.com), adaptées pour ce projet.</p>

        <h2>4. Ce que nous ne faisons pas</h2>
        <p>Nous ne vendons pas vos données et n'utilisons pas d'outils d'analyse. Nous utilisons le stockage local de votre navigateur pour conserver votre session et vos préférences ; nous n'utilisons pas de cookies de suivi. Nous ne partageons pas vos informations avec des tiers, sauf les prestataires nécessaires au fonctionnement de l'application (section 3).</p>

        <h2>5. Vos droits</h2>
        <p>Vous pouvez exporter et supprimer vos données à tout moment depuis les <b>Paramètres</b>. Pour supprimer votre compte et votre e-mail, contactez-nous via le formulaire de signalement.</p>

        <h2>6. Modifications et contact</h2>
        <p>Nous pouvons mettre à jour cette politique ; la date ci-dessus indique la dernière version. Pour toute question ou demande, utilisez le formulaire de signalement.</p>
      `
    },
    terms: {
      title: "Conditions d'utilisation | My Demon List",
      html: `
        <div style="display: flex; flex-direction: row; align-items: center; gap: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--line-1);">
          <div class="square">
            <svg xmlns="http://w3.org" viewBox="0 0 24 24" width="80%" height="80%" fill="currentColor">
              <path d="M 19 6 L 14 1 L 5 1 C 3.9 1 3 1.9 3 3 L 3 21 C 3 22.1 3.9 23 5 23 L 19 23 C 20.1 23 21 22.1 21 21 L 21 8 L 19 6 Z M 13 3 L 18.5 8.5 L 13 8.5 L 13 3 Z M 19 21 L 5 21 L 5 3 L 11 3 L 11 10 L 19 10 L 19 21 Z" />
              <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="8" y1="16" x2="16" y2="16" />
              </g>
            </svg>
          </div>
          <h1>Conditions d'utilisation</h1>
        </div>
        <p class="updated" style="padding-top: 4px;">Dernière mise à jour : 24 octobre 2026</p>

        <p>En utilisant My Demon List ou en vous y inscrivant, vous acceptez de respecter ces conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.</p>

        <h2>1. Projet indépendant</h2>
        <p>My Demon List est un projet de fans, sans lien avec RobTop Games ni avec Geometry Dash. Tous les noms, marques déposées, logos et ressources visuelles du jeu appartiennent à leurs propriétaires respectifs.</p>

        <h2>2. Votre compte et votre contenu</h2>
        <ul>
          <li>Vous pouvez utiliser l'application de manière anonyme ou vous connecter avec Google pour synchroniser vos données dans le cloud.</li>
          <li>Vous êtes responsable de ce que vous téléversez. Vous conservez tous les droits sur votre contenu.</li>
          <li>Vos données personnelles sont traitées conformément à la <a href="privacy.html">politique de confidentialité</a>.</li>
        </ul>

        <h2>3. Utilisation acceptable</h2>
        <ul>
          <li>Ne téléversez pas de contenu illégal, offensant ou portant atteinte aux droits de tiers.</li>
          <li>N'essayez pas d'abuser du serveur ni de le surcharger.</li>
        </ul>

        <h2>4. Disponibilité et responsabilité</h2>
        <p>Le service est fourni « tel quel ». Étant un projet indépendant, il n’est pas garanti qu’il soit ininterrompu ou exempt d’erreurs. Nous ne sommes pas responsables de la perte accidentelle de données ou de progression. Nous vous recommandons d'exporter une copie de sauvegarde depuis les <b>Paramètres</b>.</p>

        <h2>5. Suspension</h2>
        <p>Nous pouvons limiter ou supprimer les comptes qui ne respectent pas ces conditions.</p>

        <h2>6. Modifications</h2>
        <p>Nous pouvons mettre à jour ces conditions ; continuer à utiliser l'application implique d'accepter la version en vigueur.</p>
      `
    }
  }
};

function applyLegalLanguage() {
  const card = document.querySelector('.legal-card');
  const page = document.body.dataset.legal;
  if (!card || !page) return;

  if (!card.dataset.es) {
    card.dataset.es = card.innerHTML;
    card.dataset.esTitle = document.title;
  }

  const tr = LEGAL_I18N[appSettings.lang] && LEGAL_I18N[appSettings.lang][page];
  card.innerHTML = tr ? tr.html : card.dataset.es;
  document.title = tr ? tr.title : card.dataset.esTitle;
}

// ------------------------------------------------------
// constantes extras
// ------------------------------------------------------

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia',
  'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin',
  'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
  'Cambodia', 'Cameroon', 'Canada', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia',
  'Comoros', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark',
  'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea',
  'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana',
  'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland',
  'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan',
  'Kazakhstan', 'Kenya', 'Kiribati', 'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro',
  'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger',
  'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama',
  'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Qatar',
  'Republic of the Congo', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
  'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
  'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago',
  'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom',
  'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia',
  'Zimbabwe'
];

const svg = {
  Info: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  Options: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="13" r="2" fill="currentColor"/><circle cx="12" cy="20" r="2" fill="currentColor"/></svg>`,
  pc: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  mobile: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  Pencil: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  Pin: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`,
  Filter: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>`,
  Search: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"></circle><line x1="21" y1="21" x2="15" y2="15"></line></svg>`,
  Yt: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M21.58 7.19C21.35 6.33 20.67 5.65 19.81 5.42C18.25 5 12 5 12 5C12 5 5.75 5 4.19 5.42C3.33 5.65 2.65 6.33 2.42 7.19C2 8.75 2 12 2 12C2 12 2 15.25 2.42 16.81C2.65 17.67 3.33 18.35 4.19 18.58C5.75 19 12 19 12 19C12 19 18.25 19 19.81 18.58C20.67 18.35 21.35 17.67 21.58 16.81C22 15.25 22 12 22 12C22 12 22 8.75 21.58 7.19ZM10 15V9L15.2 12L10 15Z"/></svg>`,
  Configuration: `<svg xmlns="http://www.w3.org/2000/svg" height="18" width="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/><circle cx="12" cy="12" r="2" /></svg>`,
  Home: `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  Lang: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`,
  Globe: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.9 17.39c-.26-.8-1.01-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8M11 19.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.22.21-1.79L9 15v1a2 2 0 0 0 2 2m1-16A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/></svg>`,
  Flag_en: `<svg class="lang-flag" viewBox="0 0 30 21" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="21" fill="#b22234"/><g fill="#fff"><rect y="1.615" width="30" height="1.615"/><rect y="4.846" width="30" height="1.615"/><rect y="8.077" width="30" height="1.615"/><rect y="11.308" width="30" height="1.615"/><rect y="14.538" width="30" height="1.615"/><rect y="17.769" width="30" height="1.615"/></g><rect width="12" height="11.31" fill="#3c3b6e"/><g fill="#fff"><circle cx="2" cy="2" r=".6"/><circle cx="4.5" cy="2" r=".6"/><circle cx="7" cy="2" r=".6"/><circle cx="9.5" cy="2" r=".6"/><circle cx="2" cy="5.6" r=".6"/><circle cx="4.5" cy="5.6" r=".6"/><circle cx="7" cy="5.6" r=".6"/><circle cx="9.5" cy="5.6" r=".6"/><circle cx="2" cy="9.2" r=".6"/><circle cx="4.5" cy="9.2" r=".6"/><circle cx="7" cy="9.2" r=".6"/><circle cx="9.5" cy="9.2" r=".6"/></g></svg>`,
  Flag_es: `<svg class="lang-flag" viewBox="0 0 30 21" xmlns="http://www.w3.org/2000/svg"><rect width="30" height="21" fill="#d91023"/><rect x="10" width="10" height="21" fill="#fff"/><circle cx="15" cy="10.5" r="2.4" fill="#d9b44a" stroke="#8a6d1d" stroke-width=".6"/></svg>`,
  Perfil: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2A5 5 0 1 0 12 12A5 5 0 0 0 12 2ZM4 19C4 15.686 7.582 13 12 13C16.418 13 20 15.686 20 19C20 20.105 19.105 21 18 21H6C4.895 21 4 20.105 4 19Z" /></svg>`,
  Wave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" class="icon-chevron"><path d="M 7.41 8.59 L 12 13.17 L 16.59 8.59 L 18 10 L 12 16 L 6 10 L 7.41 8.59 Z" fill="currentColor" /></svg>`,
  MiniWave: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" class="icon-chevron"><path d="M 7.41 8.59 L 12 13.17 L 16.59 8.59 L 18 10 L 12 16 L 6 10 L 7.41 8.59 Z" fill="currentColor" /></svg>`,
  Drag: `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="9" cy="12" r="1.8"/><circle cx="15" cy="12" r="1.8"/><circle cx="9" cy="18" r="1.8"/><circle cx="15" cy="18" r="1.8"/></svg>`,
  Palette: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c1.7 0 3-1.3 3-3 0-.8-.3-1.5-.8-2-.5-.6-.8-1.2-.8-2 0-1.7 1.3-3 3-3h2.5c1.9 0 3.5-1.6 3.5-3.5C22 5.5 17.5 2 12 2z"/><circle cx="7" cy="10" r="1.4" fill="currentColor" stroke="none"/><circle cx="11" cy="7" r="1.4" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1.4" fill="currentColor" stroke="none"/></svg>`,
  AREDL: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h16"/><polyline points="7 16 10 12 13 14 19 8"/></svg>`,
  Dice: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="22" height="24"><g><path fill-rule="evenodd" d="M 250,50 L 440,145 Q 460,155 460,175 L 460,355 Q 460,375 440,385 L 270,475 Q 250,485 230,475 L 60,385 Q 40,375 40,355 L 40,175 Q 40,155 60,145 Z M 250,95 a 28.5,19.5 0 1,0 0.1,0 Z M 175,132 a 28.5,19.5 0 1,0 0.1,0 Z M 325,132 a 28.5,19.5 0 1,0 0.1,0 Z M 250,168 a 28.5,19.5 0 1,0 0.1,0 Z M 150,280 a 18,22.5 0 1,0 0.1,0 Z M 330,270 a 21,27 0 1,0 0.1,0 Z M 385,320 a 19.5,25.5 0 1,0 0.1,0 Z" fill="white" /></g></svg>`,
  Grid: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect></svg>`,
  Image: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
  Trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.93.63 1.5 1.98 2.63 3.61 2.95V19H7v2h10v-2h-4v-3.12c1.63-.32 2.98-1.45 3.61-2.95C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"/></svg>`,
  Import: `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  Export: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  Stats: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="20" x2="6" y2="11"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>`,
  Reorder: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16"/><polyline points="3 8 7 4 11 8"/><path d="M17 20V4"/><polyline points="13 16 17 20 21 16"/></svg>`,
  ArrowUp: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`,
  ArrowDown: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  Compact: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><line x1="4" y1="6" x2="4.01" y2="6"/><line x1="4" y1="12" x2="4.01" y2="12"/><line x1="4" y1="18" x2="4.01" y2="18"/></svg>`,
  Plus: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  Close: `<svg xmlns="http://w3.org" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  Analytics: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="3" /><line x1="7" y1="18" x2="7" y2="12" /><line x1="12" y1="18" x2="12" y2="8" /><line x1="17" y1="18" x2="17" y2="14" /></svg>`,
};

/* ==== storage.js ==== */
// ======================================================
// 1. Manejo de Local Storage
// ------------------------------------------------------
// Todo lo que se guarda vive en un solo objeto (STORAGE_KEY).
// Para persistir algo nuevo:
//   1) agregar en buildSnapshot()   (guardar)
//   2) agregar en applySnapshot()   (cargar)
//   3) llamar a saveData()
// ======================================================

const STORAGE_KEY = 'mdl_app_data';
const STORAGE_VERSION = 2;
const DEFAULT_LIST_TITLE = 'My Demon List';

// ======================================================
// 1. Normalizacion
// ======================================================

const safeImg = u => /^(https:\/\/[^\s'"()\\]+|data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[A-Za-z0-9+\/=]+)$/i.test(u || '') ? u : '';

const uid = (prefix) => `${prefix}_${Date.now()}${Math.random().toString(36).slice(2, 6)}`;

function normalizeDemon(demon) {
  return {
    id: demon.id || uid('d'),
    name: demon.name || '',
    creator: demon.creator || '',
    showcase: demon.showcase || '',
    difficulty: demon.difficulty || 'Easy Demon',
    levelId: String(demon.levelId ?? '').replace(/\D/g, ''),
    attempts: demon.attempts ?? '',
    winDate: demon.winDate || '',
    isFavorite: !!demon.isFavorite,
  };
}

function normalizeList(list) {
  const { isFavorite, ...rest } = list;
  return {
    ...rest,
    id: Number(list.id) || Date.now(),
    title: String(list.title || '').slice(0, 32),
    image: safeImg(list.image),
    isMain: list.isMain === true,
    order: Number.isFinite(list.order) ? list.order : Date.now(),
    demons: Array.isArray(list.demons) ? list.demons.map(normalizeDemon) : []
  };
}

// Pasos de migracion -- proceso min 15 u
function migrateData(parsed) {
  return parsed;
}

// ======================================================
// 2. Snapshot - guardado y restaurado
// ======================================================

function buildSnapshot() {
  return {
    version: STORAGE_VERSION,
    profileState,
    userLists,
    viewPrefs,
    appSettings
  };
}

function applySnapshot(data) {
  profileState = { ...profileState, ...(data.profileState || {}) };
  profileState.playerType = ['pc', 'mobile'].includes(profileState.playerType) ? profileState.playerType : '';
  profileState.gdId = String(profileState.gdId || '').replace(/\D/g, '').slice(0, 12);
  profileState.gdRank = normalizeGdRank(profileState.gdRank);
  profileState.gdName = String(profileState.gdName || '').slice(0, 20);
  profileState.bio = String(profileState.bio || '').slice(0, 160);
  if (Array.isArray(data.userLists)) {
    const legacy = !data.userLists.some(l => typeof l.isMain === 'boolean');
    userLists = data.userLists.map(l => normalizeList(legacy ? { ...l, isMain: !!l.isFavorite } : l));
    let found = false;
    userLists.forEach(l => { if (l.isMain) { if (found) l.isMain = false; found = true; } });
    userLists.sort((a, b) => a.order - b.order);
  }
  viewPrefs = { ...viewPrefs, ...(data.viewPrefs || {}) };
  appSettings = { ...DEFAULT_APP_SETTINGS, ...(data.appSettings || {}) };
  delete appSettings.bgColor;
  delete appSettings.bgImage;

  profileState.avatar = safeImg(profileState.avatar);
  profileState.banner = safeImg(profileState.banner);
}

// -------------- cargar - guardar --------------->
function loadData() {
  let parsed = null;
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    console.warn('Datos guardados ilegibles, se usarán los valores por defecto.', e);
  }

  if (!parsed || typeof parsed !== 'object') {
    userLists = [normalizeList({ id: Date.now(), title: DEFAULT_LIST_TITLE, author: profileState.username, isMain: true, demons: [] })];
    saveData();
    return;
  }

  applySnapshot(migrateData(parsed));
}

function saveData() {
  try {
    saveLocal();
    cloudScheduleSync();
    return true;
  } catch (e) {
    console.error('No se pudo guardar en localStorage', e);
    showAlert(t('storage.full'));
    return false;
  }
}

function basicSnapshot() {
  return { version: STORAGE_VERSION, viewPrefs, appSettings};
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudUser && cloudReady ? basicSnapshot() : buildSnapshot()));
}

function resetData() {
  profileState = { ...DEFAULT_PROFILE };
  userLists = [];
  viewPrefs = { sort: 'custom', dragLocked: false };
  appSettings = { ...DEFAULT_APP_SETTINGS };
}

// ======================================================
// 3. Imagenes
// ======================================================

const blobToDataURL = blob => new Promise(resolve => {
  const r = new FileReader();
  r.onload = () => resolve(r.result);
  r.onerror = () => resolve(null);
  r.readAsDataURL(blob);
});

// Reduce la imagen y devuelve un Blob
function resizeImage(file, opts = 1280) {
  const { maxSize = 1280, quality = 0.86 } = typeof opts === 'number' ? { maxSize: opts } : opts;

  return new Promise((resolve) => {
    if (!file) return resolve(null);

    if (!/^image\//.test(file.type) || /gif|svg/.test(file.type)) return resolve(file);

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth, h = img.naturalHeight;
      const scale = Math.min(1, maxSize / Math.max(w, h));
      if (scale >= 1 && file.size < 350 * 1024) return resolve(file);

      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * scale));
      c.height = Math.max(1, Math.round(h * scale));
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(b => resolve(b || file), file.type === 'image/png' ? 'image/webp' : 'image/jpeg', quality);
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function readImageFile(file, opts) {
  const blob = await resizeImage(file, opts);
  if (!blob) return null;
  if (!cloudUser || !cloudReady) return blobToDataURL(blob); // sin sesión (base64)
  const url = await cloudStoreImage(blob);
  if (!url) { showAlert(t('acc.error')); return null; }
  return url;
}

/* ==== settings.js ==== */
const THEMES = ['blue', 'pizarra', 'gris', 'purple', 'dark', 'atardecer', 'neon', 'rosa-dark', 'bosque', 'halloween'];

const DEFAULT_APP_SETTINGS = {
  theme: 'blue',
  bgList: true,
  lang: 'es'
};

let appSettings = { ...DEFAULT_APP_SETTINGS };

// ======================================================
// 1. Configuraciones y preferencias
// ======================================================

function applyAppearance(fade = false) {
  const root = document.documentElement;
  const theme = THEMES.includes(appSettings.theme) ? appSettings.theme : DEFAULT_APP_SETTINGS.theme;

  if (fade) {
    root.classList.add('theme-fade');
    setTimeout(() => root.classList.remove('theme-fade'), 450);
  }
  root.setAttribute('data-bg-list', appSettings.bgList === false ? 'off' : 'on');
  root.setAttribute('data-theme', theme);
}

// ------------- Idioma ------------->
function setLanguage(lang) {
  if (!I18N[lang] || lang === appSettings.lang) return;
  appSettings.lang = lang;
  saveData();
  applyLanguage();
  renderHeader();
  renderRoute();
}

// ======================================================
// 2. Datos locales
// ======================================================

async function deleteAllData() {
  if (cloudUser && !cloudReady) return showAlert(t('acc.error'));
  if (!await showConfirm(t(cloudUser ? 'settings.deleteConfirmCloud' : 'settings.deleteConfirm'), { danger: true })) return;
  const word = await showPrompt(t('settings.deletePrompt'));
  if ((word || '').trim().toUpperCase() !== t('settings.deleteWord')) return;

  resetData();
  localStorage.removeItem(STORAGE_KEY);
  if (cloudUser && !await cloudPush()) return showAlert(t('acc.error'));
  location.href = location.pathname;
}

async function exportAllData() {
  let snap = buildSnapshot();
  if (cloudUser) {
    const remote = await cloudFetch();
    if (!remote) return showAlert(t('acc.error'));
    snap = { ...(remote.profile || {}), userLists: remote.lists };
  }
  downloadJSON(`mdl_backup_${new Date().toISOString().slice(0, 10)}.json`, snap);
}

function importAllData(file) {
  const reader = new FileReader();
  reader.onload = async () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (e) {
      return showAlert(t('settings.invalidFile'));
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.userLists)) {
      return showAlert(t('settings.incompatible'));
    }
    if (!await showConfirm(t('settings.importConfirm'), { danger: true })) return;

    if (cloudUser) {
      if (!cloudReady) return showAlert(t('acc.error'));
      applySnapshot(parsed);
      await cloudMigrateImages();
      if (!await cloudPush()) return showAlert(t('acc.error'));
      saveLocal();
    } else {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); }
      catch (e) { return showAlert(t('settings.importTooBig')); }
    }
    location.href = location.pathname;
  };
  reader.readAsText(file);
}

// ======================================================
// 3. Renderizado de vista
// ======================================================

function openSettingsView() {
  setPageTitle(t('settings.title'));

  mountView(`
    <div class="settings-view">
      <div class="list-view-header">
        <div class="list-view-heading">
          <h1 class="list-view-title">${t('settings.title')}</h1>
          <span class="list-view-subtitle">${t('settings.subtitle')}</span>
        </div>
      </div>

      <section class="settings-section panel" style="--i:0">
        <h2 class="settings-title">${t('settings.theme')}</h2>
        <p class="settings-hint">${t('settings.themeHint')}</p>
        <div class="theme-grid" id="themeGrid">
          ${THEMES.map(id => `
            <button type="button" class="theme-card" data-theme="${id}" data-theme-id="${id}">
              <span class="theme-swatches"><i></i><i></i><i></i></span>
              <span>${t('theme.' + id)}</span>
            </button>
          `).join('')}
        </div>
      </section>
      
      <section class="settings-section panel" style="--i:1">
        <h2 class="settings-title">${t('settings.blur')}</h2>
        <p class="settings-hint">${t('settings.blurHint')}</p>
        <label class="ex-check"><input type="checkbox" id="optBgList">${t('settings.blurList')}</label>
      </section>

      <section class="settings-section panel" style="--i:2">
        <h2 class="settings-title">${t('settings.data')}</h2>
        <p class="settings-hint">${t(cloudUser ? 'settings.dataHintCloud' : 'settings.dataHint')}</p>
        <div class="settings-row" style="border-bottom: 1px solid var(--line-1); padding-bottom: 12px;">
          <button type="button" id="btnExportAll" class="btn-line">${t('settings.export')}</button>
          <button type="button" id="btnImportAll" class="btn-line">${t('settings.import')}</button>
          <input type="file" id="fileImportAll" accept=".json,application/json" hidden>
        </div>
        <p class="settings-hint">${t('settings.delHint')}</p>
        <div class="settings-row">
          <button type="button" id="btnDeleteAll" class="btn-danger">${t('settings.deleteAll')}</button>
        </div>
      </section>
    </div>
  `);

  const refreshThemeCards = () => {
    document.querySelectorAll('#themeGrid .theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.themeId === appSettings.theme);
    });
  };

  // ---- Tema ----->
  $('themeGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card) return;
    appSettings.theme = card.dataset.themeId;
    applyAppearance(true);
    saveData();
    refreshThemeCards();
  });

  // ---- Degradado ----->
  [['optBgList', 'bgList']].forEach(([id, key]) => {
    const el = $(id);
    el.checked = appSettings[key] !== false;
    el.addEventListener('change', () => {
      appSettings[key] = el.checked;
      applyAppearance();
      saveData();
    });
  });

  // ---- Datos ----->
  $('btnExportAll').addEventListener('click', exportAllData);
  $('btnImportAll').addEventListener('click', () => $('fileImportAll').click());
  $('fileImportAll').addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (file) importAllData(file);
  });
  $('btnDeleteAll').addEventListener('click', deleteAllData);

  refreshThemeCards();
}

/* ==== demon_card.js ==== */
// ======================================================
// 1. Demon card
// ======================================================

function demonStatChip(label, value, cls = '') {
  if (!value) return '';
  return `<span class="d-stat ${cls}"><span class="d-stat-label">${label}</span>${escapeHTML(value)}</span>`;
}

function renderDemonCard(demon, position, index) {
  const ytThumb = viewPrefs.showFaces ? '' : getYouTubeThumbnail(demon.showcase);
  const id = escapeHTML(String(demon.id));
  const extraChips =
    demonStatChip(t('card.date'), demon.winDate, 'd-date') +
    demonStatChip(t('card.attempts'), demon.attempts ? Number(demon.attempts).toLocaleString() : '', 'd-att');

  return `
    <article class="demon-card" data-id="${id}" style="${diffColorStyle(demon.difficulty)};--i:${Math.min(index, 8)}">
      <div class="demon-thumb ${ytThumb ? 'has-yt' : 'default-thumb'}">
        ${ytThumb
          ? `<a href="${escapeHTML(showcaseUrl(demon.showcase))}" target="_blank" rel="noopener" title="${t('card.showcase')}">
               <img src="${ytThumb}" alt="" ${index < 6 ? '' : 'loading="lazy"'} decoding="async">
             </a>`
          : `<img src="${diffIcon(demon.difficulty)}" alt="${escapeHTML(demon.difficulty)}">`}
      </div>

      <div class="demon-details">
        <div class="demon-header">
          <h2 class="demon-name">#${position} - ${escapeHTML(demon.name)}</h2>
          ${demon.isFavorite ? `<img class="demon-fav-star" src="${FAV_ICON.on}" alt="">` : ''}
        </div>
        ${demon.creator ? `<span class="d-creator"><span class="by-full">${t('card.publishedBy', { name: escapeHTML(demon.creator) })}</span><span class="by-short">${t('card.by', { name: escapeHTML(demon.creator) })}</span></span>` : ''}
        <div class="demon-stats-row">
          <span class="d-diff">${ytThumb ? `<img src="${diffIcon(demon.difficulty)}" alt="">` : ''}${escapeHTML(demon.difficulty)}</span>
          ${extraChips}
        </div>
      </div>
      ${extraChips ? `<div class="demon-extra">${extraChips}</div>` : ''}

      <button type="button" class="btn-edit-demon" data-edit-demon="${id}" title="${t('card.edit')}">${svg.Pencil}</button>
      <button type="button" class="btn-add-demon-below" data-add-demon-after="${id}" title="${t('card.addBelow')}">${svg.Plus}</button>
    </article>
  `;
}

function renderDemons() {
  const container = $('demonsContainer');
  if (!container) return;

  updateLockButton();
  const demons = getVisibleDemons();
  updateFilterBar(demons.length);

  if (demons.length === 0) {
    const hasAny = currentList.demons.length > 0;
    container.innerHTML = `
      <div class="demons-empty">
        <p class="demons-empty-title">${hasAny ? t('view.noMatch') : t('view.empty')}</p>
        <p class="demons-empty-text">${hasAny ? t('view.noMatchText') : t('view.emptyText')}</p>
        ${!hasAny ? `<button type="button" id="btnEmptyAddDemon" class="btn-primary" style="margin-top: 12px;">${t('view.addDemon')}</button>` : ''}
      </div>
    `;
    
    const emptyBtn = container.querySelector('#btnEmptyAddDemon');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => openAddDemonModal(currentList.id));
    }
    return;
  }

  container.innerHTML = demons
  .map((d, i) => renderDemonCard(d, d.originalPosition, i))
  .join('');
  initSortable();
}

// ======================================================
// 2. Barra lateral de estadísticas
// ======================================================

function renderListStats() {
  const container = $('listStatsContainer');
  if (!container) return;

  const subtitle = $('listViewSubtitle');
  if (subtitle) subtitle.textContent = listSubtitleText();
  container.onclick = onStatsPanelClick;
  if (statsMode === 'stats') return renderAdvancedStats(container, currentList.demons || []);

  const demons = currentList.demons || [];
  const hardest = demons.length ? (demons[0].name || '-') : '-';
  const top = demons[0];

  const breakdown = DIFFICULTIES.map(diff => `
    <div class="diff-col">
      <img src="${DIFFICULTY[diff].icon}" alt="${diff}" class="diff-icon" title="${diff}">
      <span class="diff-count">${demons.filter(d => d.difficulty === diff).length}</span>
    </div>
  `).join('');

  const bannerImg = profileState.banner ? `background-image:url('${escapeHTML(profileState.banner)}');` : '';
  const badges = profileBadges();
  const extra = `
    <div class="profile-extra">
      ${badges ? `<div class="hp-badges">${badges}</div>` : ''}
      <div class="ps-block">
        <span class="ps-label">${t('profile.bio')}</span>
        <div class="hp-bio-box"><p class="hp-bio ${profileState.bio ? '' : 'empty'}">${profileState.bio ? escapeHTML(profileState.bio) : t('profile.noBio')}</p></div>
      </div>
      <div class="ps-block" style="gap: 10px">
        <span class="ps-label">${t('home.gdProfile')}</span>
        <div class="hp-gd-row">
          <div class="hp-gd-profile">
            <strong class="hp-gd-name">${escapeHTML(profileState.gdName) || '-'}</strong>
            <span class="hp-gd-id" style="font-size: 11.5px">${t('profile.id', { id: escapeHTML(profileState.gdId) || '-' })}</span>
          </div>
          ${renderGdRank()}
        </div>
      </div>
    </div>`;

  container.innerHTML = `
    <div class="profile-banner-container">
      <div class="profile-banner" style="${bannerStyle()}${bannerImg}"></div>
      <div class="profile-avatar-wrapper">
        <img src="${escapeHTML(getAvatar())}" alt="" class="profile-avatar" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">
      </div>
      <button type="button" class="sc-toggle sc-toggle-float" data-sc-mode="stats" title="${t('stats.show')}">${svg.Analytics}</button>
      ${publicIdText() !== '-' ? `<span class="profile-pid">${t('profile.id', { id: publicIdText() })}</span>` : ''}
    </div>

    <div class="profile-body">
      <h3 class="profile-title">${escapeHTML(profileState.username) || '-'}</h3>  
      <span class="profile-handle">${escapeHTML(currentList.title || '-')}</span>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card-label">Demons</span>
          <strong class="stat-card-value">${demons.length}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Hardest</span>
          <strong class="stat-card-value ${top ? 'is-diff' : ''}" ${top ? `style="${diffColorStyle(top.difficulty)}"` : ''} title="${escapeHTML(hardest)}">${escapeHTML(hardest)}</strong>
        </div>
      </div>

      <div class="diff-breakdown-row">${breakdown}</div>
      ${extra}
    </div>`;
}

// <span class="profile-list-id">${t('view.listId', { id: currentList.id })}</span> // agregar abajo de ${extra} id publicas - version 1.4

// ======================================================
// 2.1. Panel de estadísticas avanzadas
// ======================================================

let statsMode = 'profile'; // 'profile' | 'stats'
let statsSeries = { demons: true, diff: true };

const DIFF_EXTREME_AT = 4.4;
const DIFF_POW = 5;
const STATS_MONTHS = 5;
const diffNum = d => DIFFICULTIES.indexOf(d) + 1 || 1;

// Promedio ponderado (p = 5)
function realDifficulty(demons) {
  if (!demons.length) return 0;
  const raw = Math.pow(demons.reduce((s, d) => s + Math.pow(diffNum(d.difficulty), DIFF_POW), 0) / demons.length, 1 / DIFF_POW);
  return raw >= DIFF_EXTREME_AT ? 5 : raw;
}

function compactNum(n) {
  if (n < 1000) return String(n);
  const [div, suf] = n >= 1e9 ? [1e9, 'B'] : n >= 1e6 ? [1e6, 'M'] : [1e3, 'K'];
  const v = n / div;
  const dec = v < 10 ? 2 : v < 100 ? 1 : 0;
  return String(+(Math.floor(v * 10 ** dec) / 10 ** dec)) + suf;
}

function attemptsRows(demons) {
  return DIFFICULTIES.map(diff => {
    const ds = demons.filter(d => d.difficulty === diff && Number(d.attempts) > 0);
    const total = ds.reduce((s, d) => s + Number(d.attempts), 0);
    return { diff, total, avg: ds.length ? Math.round(total / ds.length) : 0 };
  });
}

function monthlyBuckets(demons) {
  const now = new Date();
  const out = [];
  for (let i = STATS_MONTHS - 1; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    let label = dt.toLocaleDateString(currentLang(), { month: 'short' }).replace('.', '');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    out.push({ y: dt.getFullYear(), m: dt.getMonth(), label, ds: [] });
  }
  demons.forEach(d => {
    const m = /^(\d{4})-(\d{2})/.exec(d.winDate || '');
    if (!m) return;
    const b = out.find(o => o.y === +m[1] && o.m === +m[2] - 1);
    if (b) b.ds.push(d);
  });
  return out;
}

function niceTop(max) {
  for (const v of [15, 30, 75, 150, 300]) if (max <= v) return v;
  return Math.ceil(max / 300) * 300;
}

function renderAdvancedStats(container, demons) {
  const rd = realDifficulty(demons);
  const icon = rd ? DIFFICULTY[DIFFICULTIES[Math.round(rd) - 1]].icon : '';

  const cell = n => n ? `<span title="${Number(n).toLocaleString()}">${compactNum(n)}</span>` : '<span>-</span>';

  const rows = attemptsRows(demons).map(r => `
    <div class="sc-row" style="${diffColorStyle(r.diff)}">
      <span class="sc-name">${r.diff.replace(' Demon', '')}</span>
      ${cell(r.total)}
      ${cell(r.avg)}
    </div>`).join('');

  const months = monthlyBuckets(demons);
  const top = niceTop(Math.max(0, ...months.map(b => b.ds.length)));
  const axisL = [1, 2, 3].map(k => `<span style="bottom:${k * 100 / 3}%">${top * k / 3}</span>`).join('');
  const axisR = [[5, 100], [3, 50], [1, 0]].map(([v, p]) => `<span style="bottom:${p}%">${v}</span>`).join('');

  const cols = months.map(b => {
    const n = b.ds.length;
    const d = realDifficulty(b.ds);
    const hN = n ? `max(3px, ${n / top * 100}%)` : '0';
    const hD = n ? `max(3px, ${(d - 1) / 4 * 100}%)` : '0';
    return `
      <div class="sc-col" title="${b.label}: ${n} demons${n ? ` · ${d.toFixed(1)}` : ''}">
        <span class="sc-bar sc-bar-n" style="height:${hN}"></span>
        <span class="sc-bar sc-bar-d" style="height:${hD}"></span>
      </div>`;
  }).join('');

  const leg = (key, label, color) =>
    `<button type="button" class="sc-leg ${statsSeries[key] ? 'on' : ''}" data-sc-series="${key}"><i class="sc-dot" style="--c:${color}"></i>${label}</button>`;
  const infoBtn = k => `<button type="button" class="sc-info" data-sc-info="${k}" title="${t('stats.info')}">${svg.Info}</button>`;

  container.innerHTML = `
    <div class="sc-panel">
      <div class="sc-head">
        <button type="button" class="sc-toggle" data-sc-mode="profile" title="${t('stats.profile')}">${svg.Perfil}</button>
        <h3 class="sc-title" title="${escapeHTML(currentList.title)}">${escapeHTML(currentList.title)}</h3>
        ${icon ? `<span class="sc-diff" style="${diffColorStyle(DIFFICULTIES[Math.round(rd) - 1])}"><b>${rd.toFixed(1)}</b><img class="sc-diff-icon" src="${icon}" alt=""></span>` : ''}
      </div>

      <div class="sc-table">
        <div class="sc-table-title">${t('stats.attempts')}${infoBtn('table')}</div>
        <div class="sc-row sc-row-head">
          <span></span><span>${t('stats.total')}</span><span>${t('stats.avg')}</span>
        </div>
        ${rows}
      </div>

      <div class="sc-cal-head">
        <span class="sc-cal-title">${t('stats.calendar')}</span>
        ${infoBtn('chart')}
        ${leg('demons', t('stats.demons'), 'var(--button)')}
        ${leg('diff', t('stats.realDiff'), 'var(--stat-alt)')}
      </div>

      <div class="sc-chart ${statsSeries.demons ? '' : 'hide-n'} ${statsSeries.diff ? '' : 'hide-d'}">
        <div class="sc-axis sc-axis-l">${axisL}</div>
        <div class="sc-plot">
          <i class="sc-grid" style="bottom:33.33%"></i><i class="sc-grid" style="bottom:66.66%"></i><i class="sc-grid" style="bottom:100%"></i>
          <div class="sc-cols">${cols}</div>
        </div>
        <div class="sc-axis sc-axis-r">${axisR}</div>
        <div class="sc-months">${months.map(b => `<span>${b.label}</span>`).join('')}</div>
      </div>
    </div>`;
}

function onStatsPanelClick(e) {
  const mode = e.target.closest('[data-sc-mode]');
  if (mode) { statsMode = mode.dataset.scMode; return renderListStats(); }

  const ser = e.target.closest('[data-sc-series]');
  if (ser) {
    const k = ser.dataset.scSeries, other = k === 'demons' ? 'diff' : 'demons';
    if (statsSeries[k] && !statsSeries[other]) return; // siempre queda una activa
    statsSeries[k] = !statsSeries[k];
    return renderListStats();
  }

  const inf = e.target.closest('[data-sc-info]');
  if (inf) showInfoModal(t('stats.info'), t(inf.dataset.scInfo === 'table' ? 'stats.attHint' : 'stats.calHint'));
}

// ======================================================
// 3. Autocompletado local
// ======================================================

function searchMatches(query, limit = 8) {
  if (!query) return [];
  const pos = /^#?(\d+)$/.exec(query);
  const byPos = pos ? currentList.demons[Number(pos[1]) - 1] : null;
  const byName = rankMatches(currentList.demons, query, d => d.name, limit);
  return byPos ? [byPos, ...byName.filter(d => d !== byPos)].slice(0, limit) : byName;
}

function renderLocalAutocomplete(query) {
  const dropdown = $('searchAutocomplete');
  if (!dropdown) return;

  const matches = searchMatches(query);
  if (matches.length === 0) return setPop(dropdown, false);

  dropdown.innerHTML = matches.map((m, i) => `
    <div class="autocomplete-item local-item" data-index="${i}" style="${diffColorStyle(m.difficulty)}">
      <div class="local-main">
        <span class="json-name">#${currentList.demons.indexOf(m) + 1} - ${escapeHTML(m.name)}</span>
        ${m.creator ? `<span class="json-creator">${t('list.by', { name: escapeHTML(m.creator) })}</span>` : ''}
      </div>
      <span class="d-diff">${escapeHTML(m.difficulty.replace(' Demon', ''))}</span>
    </div>
  `).join('');
  setPop(dropdown, true);

  dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('click', () => pickSearchResult(matches[Number(el.dataset.index)].id));
  });
}

/* ==== view_list.js ==== */
// ======================================================
// 1. Estados y constantes
// ======================================================

let currentList = null;
let isDragLocked = false;
let sortableInstance = null;

let listFilters = { sort: 'custom', difficulty: 'all', favorite: false };

const DIFFICULTY = {
  'Easy Demon':    { icon: 'resources/easy_128.webp',    color: '#9651cb' },
  'Medium Demon':  { icon: 'resources/medium_128.webp',  color: '#e241c2' },
  'Hard Demon':    { icon: 'resources/hard_128.webp',    color: '#68de54' },
  'Insane Demon':  { icon: 'resources/insane_128.webp',  color: '#d59c31' },
  'Extreme Demon': { icon: 'resources/extreme_128.webp', color: '#c62f2f' }
};
const DIFFICULTIES = Object.keys(DIFFICULTY);
const diffIcon = d => (DIFFICULTY[d] || DIFFICULTY['Easy Demon']).icon;
const diffColorStyle = d => `--diff-color:${DIFFICULTY[d] ? DIFFICULTY[d].color : 'var(--mute)'}`;

const SORT_MODES = ['custom', 'custom_rev', 'recent', 'oldest', 'attempts_desc', 'attempts_asc'];

// ======================================================
// 2. Utilidades y funciones
// ======================================================
// ------------------------------------------------------
// 2.1. Utilidades
// ------------------------------------------------------

const hasActiveFilters = () => listFilters.difficulty !== 'all' || listFilters.favorite;

const youTubeId = s => {
  s = String(s || '').trim();
  return (s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || s.match(/^([\w-]{11})$/) || [])[1] || '';
};
const showcaseUrl = s => `https://youtube.com/watch?v=${youTubeId(s)}`;
function getYouTubeThumbnail(url, quality = 'mqdefault') {
  const id = youTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : '';
}
function listSubtitleText() {
  return t('view.subtitle', { name: profileState.username, n: currentList.demons.length });
}

function syncSortUI() {
  const label = $('sortLabel');
  if (!label) return;
  label.textContent = t('sort.' + listFilters.sort);
  $('sortMenu').querySelectorAll('.pop-item').forEach(b => b.classList.toggle('active', b.dataset.sort === listFilters.sort));
}

function syncFilterUI() {
  $('filterDiffGrid').querySelectorAll('.filter-diff-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === listFilters.difficulty));
  const fav = $('btnPopupFav');
  fav.classList.toggle('active', listFilters.favorite);
  fav.querySelector('img').src = listFilters.favorite ? FAV_ICON.on : FAV_ICON.off;
}

// Botón alternante: iconos demon
function updateThumbButton() {
  $('btnToggleThumb')?.classList.toggle('active', !!viewPrefs.showFaces);
}

// Vista compacta:
function updateCompactButton() {
  $('btnToggleCompact')?.classList.toggle('active', !!viewPrefs.compact);
  $('demonsContainer')?.classList.toggle('compact', !!viewPrefs.compact);
}

function clearFilters() {
  listFilters.difficulty = viewPrefs.difficulty = 'all';
  listFilters.favorite = viewPrefs.favorite = false;
  syncFilterUI();
  saveData();
  renderDemons();
}

// Indicador de filtrado
function updateFilterBar(shown) {
  const active = hasActiveFilters();
  $('btnOpenFilter')?.classList.toggle('has-active', active);
  const bar = $('filterBar');
  if (!bar) return;
  bar.classList.toggle('show', active);
  if (active) $('filterCount').textContent = t('view.count', { shown, total: currentList.demons.length });
}

// Ejecuta cb cuando el scroll se detiene (con tope de 3 s)
function afterScroll(cb) {
  const t0 = performance.now();
  let last = -1, still = 0;
  const check = () => {
    const y = window.scrollY;
    still = y === last ? still + 1 : 0;
    last = y;
    if (still >= 6 || performance.now() - t0 > 3000) return cb();
    requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

function pickSearchResult(id) {
  const input = $('searchDemon');
  input.value = '';
  input.blur();
  setPop($('searchAutocomplete'), false);
  jumpToDemon(id);
}

// Salto a carta
function jumpToDemon(id) {
  const find = () => document.querySelector(`.demon-card[data-id="${CSS.escape(String(id))}"]`);
  let card = find();
  if (!card && hasActiveFilters()) { clearFilters(); card = find(); }
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });

  clearTimeout(card._flashTimer);
  card.classList.add('flashing');
  void card.offsetWidth;
  card.classList.add('on');
  afterScroll(() => {
    card._flashTimer = setTimeout(() => {
      card.classList.remove('on');
      card._flashTimer = setTimeout(() => card.classList.remove('flashing'), 800);
    }, 500);
  });
}

function setSortMode(mode) {
  if (!SORT_MODES.includes(mode)) mode = 'custom';
  listFilters.sort = mode;
  viewPrefs.sort = mode;
  syncSortUI();
  saveData();
}

// Candado de arrastre: activo - cerrado
function updateLockButton() {
  const btn = $('btnToggleLockDrag');
  if (!btn) return;

  const filtered = hasActiveFilters() || (listFilters.sort !== 'custom');
  const locked = isDragLocked || filtered;
  
  btn.classList.toggle('blocked', filtered);
  btn.classList.toggle('active', locked);
  btn.querySelector('img').src = locked ? 'resources/padlock_close.png' : 'resources/padlock_open.png';
}

// ------------------------------------------------------
// 2.2. arrastre - sortable
// ------------------------------------------------------

function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

function initSortable() {
  const container = $('demonsContainer');
  
  const shouldBlockDrag = isDragLocked || hasActiveFilters() || (listFilters.sort !== 'custom');

  if (shouldBlockDrag || typeof Sortable === 'undefined') {
    destroySortable();
    return;
  }

  if (sortableInstance) return;

  sortableInstance = Sortable.create(container, {
    animation: 180,
    ghostClass: 'sortable-ghost',
    delay: 250,             
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;

      const ids = Array.from(container.querySelectorAll('.demon-card')).map(card => card.dataset.id);
      currentList.demons.sort((a, b) => ids.indexOf(String(a.id)) - ids.indexOf(String(b.id)));

      if (listFilters.sort !== 'custom') setSortMode('custom');
      saveData();
      renderDemons();
      renderListStats();
    }
  });
}

// ------------------------------------------------------
// 2.3. Filtros y orden
// ------------------------------------------------------

function getVisibleDemons() {
  let demons = currentList.demons.map((d, index) => ({
    ...d,
    originalPosition: index + 1
  }));

  if (listFilters.difficulty !== 'all') demons = demons.filter(d => d.difficulty === listFilters.difficulty);
  if (listFilters.favorite) demons = demons.filter(d => d.isFavorite);

  const time = d => (d.winDate ? new Date(d.winDate).getTime() : 0);
  const num = (d, key) => Number(d[key]) || 0;

  const sorters = {
    recent: (a, b) => time(b) - time(a),
    oldest: (a, b) => time(a) - time(b),
    attempts_desc: (a, b) => num(b, 'attempts') - num(a, 'attempts'),
    attempts_asc: (a, b) => num(a, 'attempts') - num(b, 'attempts')
  };
  if (sorters[listFilters.sort]) demons.sort(sorters[listFilters.sort]);
  else if (listFilters.sort === 'custom_rev') demons.reverse();

  return demons;
}

// ------------------------------------------------------
// 2.4. Aviso primer demon, dado y vista compacta
// ------------------------------------------------------

let hintTimer;

function hideAddDemonHint() {
  clearTimeout(hintTimer);
  const el = document.querySelector('.demon-hint');
  if (!el) return;
  el.classList.add('leaving');
  setTimeout(() => el.remove(), 260);
}

const HINT_KEY = 'mdl_hint_add_seen';

function showAddDemonHint() {
  try { if (localStorage.getItem(HINT_KEY)) return; } catch (e) { return; }
  if (window.matchMedia('(hover: none), (max-width: 640px)').matches) return;
  const main = $('main');
  if (!main) return;
  try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}

  const old = main.querySelector('.demon-hint');
  if (old) old.remove();
  clearTimeout(hintTimer);

  const el = document.createElement('div');
  el.className = 'demon-hint';
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="demon-hint-icon">+</span>
    <p>${t('hint.addDemon')}</p>
    <button type="button" class="demon-hint-close" aria-label="${t('common.close')}">✕</button>`;
  el.querySelector('.demon-hint-close').addEventListener('click', hideAddDemonHint);
  main.appendChild(el);

  hintTimer = setTimeout(hideAddDemonHint, 9000); // = duración de hintBar en CSS
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }
}

const exportListJSON = list =>
  downloadJSON(`${list.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`, list);

function readListFile(file) {
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(r.result);
        if (!data || !data.title || !Array.isArray(data.demons)) return resolve({ error: 'listm.invalidFile' });
        resolve({ data });
      } catch (e) { resolve({ error: 'listm.importErr' }); }
    };
    r.onerror = () => resolve({ error: 'listm.importErr' });
    r.readAsText(file);
  });
}

// ---- Dado: demon aleatorio (prueba) ----->
function openRandomDemonModal() {
  const demons = currentList.demons;
  if (!demons.length) return showAlert(t('dice.empty'));

  let anim = null, closed = false, rolling = false, copyTimer;

  const ov = openModal({
    title: 'Random Demon',
    cls: 'modal-dice',
    onClose: () => { closed = true; if (anim) anim.cancel(); },
    body: `
      <div class="dice-fold" id="diceThumb"><div class="dice-fold-in">
        <a class="dice-video" id="diceVideo" target="_blank" rel="noopener" title="${t('card.showcase')}"><img alt=""></a>
      </div></div>
      <div class="dice-pad">
  <div class="dice-head rolling" id="diceHead">
    <div class="dice-text">
      <div class="dice-title"><span id="diceName">?</span></div>
      <div class="dice-fold" id="diceBy"><div class="dice-fold-in">
        <p class="dice-by" id="diceByTxt"></p>
      </div></div>
    </div>
    <img class="dice-diff" id="diceDiff" alt="">
  </div>
  <div class="dice-fold" id="diceInfo"><div class="dice-fold-in">
    <button type="button" class="dice-id" id="diceId"></button>
  </div></div>
</div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnDiceClose">${t('common.close')}</button>
      <button type="button" class="btn-primary" id="btnDiceRoll">${t('dice.again')}</button>`
  });

  const head = $('diceHead'), nameEl = $('diceName'), info = $('diceInfo'), thumb = $('diceThumb'), by = $('diceBy');
  const idBtn = $('diceId'), rollBtn = $('btnDiceRoll');

  const fillInfo = (d) => {
  const yt = youTubeId(d.showcase);
  if (yt) {
    const img = $('diceVideo').querySelector('img');
    const hd = getYouTubeThumbnail(d.showcase, 'maxresdefault');
    img.onerror = () => { img.onerror = null; img.src = hd.replace('maxresdefault', 'mqdefault'); };
    img.src = hd;
    $('diceVideo').href = showcaseUrl(d.showcase);
  }
  thumb.classList.toggle('show', !!yt);

  $('diceDiff').src = diffIcon(d.difficulty);
  $('diceByTxt').innerHTML = d.creator ? t('card.publishedBy', { name: `<strong>${escapeHTML(d.creator)}</strong>` }) : '';
  by.classList.toggle('show', !!d.creator);

  idBtn.dataset.id = d.levelId || '';
  idBtn.textContent = 'ID: ' + (d.levelId || '');
  idBtn.title = t('dice.copy');
  info.classList.toggle('show', !!d.levelId);
};

  const finish = (d) => {
    const fs0 = parseFloat(getComputedStyle(nameEl).fontSize);
    const bw = nameEl.parentElement.clientWidth;

    head.classList.remove('rolling');
    nameEl.textContent = `#${demons.indexOf(d) + 1} - ${d.name}`;
    fillInfo(d);

    // posición final
    const s = fs0 / parseFloat(getComputedStyle(nameEl).fontSize);
    const w = nameEl.offsetWidth;
    nameEl.animate(
      [{ transform: `translateX(${(bw - w * s) / 2}px) scale(${s})` }, { transform: 'none' }],
      { duration: 280, easing: 'cubic-bezier(0.2, 0.9, 0.3, 1)' }
    );

    rolling = false;
    rollBtn.disabled = false;
  };

  const ROW = 45;

  const roll = () => {
    if (rolling) return;
    rolling = true;
    rollBtn.disabled = true;
    info.classList.remove('show');
    by.classList.remove('show');
    thumb.classList.remove('show');
    head.classList.add('rolling');

    const final = demons[Math.floor(Math.random() * demons.length)];
    if (demons.length < 2) return finish(final);

    const others = demons.filter(d => d !== final);
    const n = 21;
    const seq = [];
    let last = null;
    for (let i = 0; i < n; i++) {
      const pool = others.filter(d => d !== last);
      last = (pool.length ? pool : others)[Math.floor(Math.random() * (pool.length || others.length))];
      seq.push(last);
    }
    seq.push(final); // índice n
    seq.push(others[Math.floor(Math.random() * others.length)]); // fila de relleno debajo

    nameEl.innerHTML = `<div class="dice-strip">${seq.map(d => `<span class="dice-row">${escapeHTML(d.name)}</span>`).join('')}</div>`;

    anim = nameEl.firstChild.animate(
      [{ transform: 'translateY(0)' }, { transform: `translateY(${-(n - 1) * ROW}px)` }],
      { duration: 1680, easing: 'cubic-bezier(0.3, 0.6, 0.3, 1)', fill: 'forwards' }
    );
    anim.onfinish = () => { if (!closed) finish(final); };

    let lastRow = 0;
    const watch = () => {
      if (closed || anim.playState === 'finished') return;
      const p = anim.effect.getComputedTiming().progress;
      const row = p == null ? 0 : Math.floor(p * (n - 1) + 0.5);
      if (row > lastRow) { lastRow = row; tickSound(); }
      requestAnimationFrame(watch);
    };
    watch();
  };

  idBtn.addEventListener('click', async () => {
    const id = idBtn.dataset.id;
    if (!id) return;
    if (await copyText(id)) {
      idBtn.textContent = t('dice.copied');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { idBtn.textContent = id; }, 1200);
    }
  });

  $('btnDiceClose').addEventListener('click', () => closeModal(ov));
  rollBtn.addEventListener('click', roll);
  roll();
}

const SFX = {
  tick: { type: 'triangle', from: 900, to: 300, dur: 0.026, vol: 0.06 },
};

let audioCtx;
function playSfx(layers) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    [].concat(layers).forEach(({ type, from, to, dur, vol, delay = 0 }) => {
      const t0 = audioCtx.currentTime + delay;
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(from, t0);
      o.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    });
  } catch (e) {}
}
const tickSound = () => playSfx(SFX.tick);

// ---- exportar lista como imagen ----->
const loadImg = src => new Promise(r => {
  const i = new Image();
  i.crossOrigin = 'anonymous';
  i.onload = () => r(i);
  i.onerror = () => r(null);
  i.src = src;
});

const EXPORT_MAX = 75;

function openExportImageModal() {
  if (!requireLogin('export.needLogin')) return;

  const total = currentList.demons.length;
  if (!total) return showAlert(t('dice.empty'));

  const MAX = EXPORT_MAX;
  const allN = Math.min(total, MAX);
  const presets = [10, 25, 50, 75].map(n => ({ n, label: t('export.top', { n }), off: n >= allN }));

  const ov = openModal({
    title: t('export.title'),
    cls: 'modal-sm ex-img-modal',
    body: `
      <div class="thumb-text" style="margin-top: 8px; "><p>${t('export.hint', { total, max: MAX })}</p></div>

      <div class="ex-section">
        <span class="ex-label">${t('export.quick')}</span>
        <div class="filter-diff-grid" id="exPresets">
          ${presets.map(p => `<button type="button" class="filter-diff-pill" data-n="${p.n}" ${p.off ? 'disabled' : ''}>${p.label}</button>`).join('')}
          <button type="button" class="filter-diff-pill ex-all" data-n="${allN}">${total <= MAX ? t('export.all') : t('export.top', { n: MAX })}</button>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group"><label>${t('export.from')}</label>
          <input type="number" id="exFrom" class="form-input" min="1" max="${total}" step="1" value="1"></div>
        <div class="form-group"><label>${t('export.to')}</label>
          <input type="number" id="exTo" class="form-input" min="1" max="${total}" step="1" value="${allN}"></div>
      </div>

      <p class="modal-hint" style="margin-top: 10px; font-size: 13px; color: var(--text-1)" id="exRange"></p>

      <div class="ex-section ex-extra">
        <span class="ex-label" style="margin-bottom: 6px; ">${t('export.extra')}</span>
        <label class="ex-check"><input type="checkbox" id="exProfile" checked>${t('export.profile')}</label>
      </div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnExCancel">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnExGo">${t('export.download')}</button>`
  });

  const pillEls = ov.querySelectorAll('.filter-diff-pill');

  const range = () => {
    let f = Math.floor(Number($('exFrom').value)) || 1;
    let e = Math.floor(Number($('exTo').value)) || total;
    f = Math.min(Math.max(1, f), total);
    e = Math.min(Math.max(f, e), total);
    if (e - f + 1 > MAX) e = f + MAX - 1;
    return [f, e];
  };

  const refresh = () => {
    const [f, e] = range();
    $('exRange').textContent = t('export.range', { from: f, to: e, n: e - f + 1 });
    pillEls.forEach(b => b.classList.toggle('active', !b.disabled && f === 1 && e === Number(b.dataset.n)));
  };

  $('exPresets').addEventListener('click', (e) => {
    const pill = e.target.closest('[data-n]');
    if (!pill || pill.disabled) return;
    $('exFrom').value = 1;
    $('exTo').value = pill.dataset.n;
    refresh();
  });
  $('exFrom').addEventListener('input', refresh);
  $('exTo').addEventListener('input', refresh);
  $('btnExCancel').addEventListener('click', () => closeModal(ov));
  $('btnExGo').addEventListener('click', () => {
    const [f, e] = range();
    const withProfile = $('exProfile').checked;
    closeModal(ov);
    exportListImage(f, e, withProfile);
  });
  refresh();
}

async function exportListImage(from, to, withProfile = true) {
  const demons = currentList.demons.slice(from - 1, to);

  const icons = {};
  await Promise.all(DIFFICULTIES.map(async d => { icons[d] = await loadImg(DIFFICULTY[d].icon); }));
  const avatar = withProfile ? ((await loadImg(getAvatar())) || (await loadImg(DEFAULT_AVATAR))) : null;

  const PER_COL = 25;
  const cols = Math.ceil(demons.length / PER_COL);
  const rows = Math.min(demons.length, PER_COL);

  // una sola columna: todo más grande para que no quede espacio vacío
  const S = cols === 1 ? 1.5 : 1;
  const u = n => n * S;
  const ROW_H = u(44), COL_W = u(380), PAD = 32, HEAD_H = 128, AV = 56;
  const FONT = "'Inter', system-ui, sans-serif";

  const c = document.createElement('canvas');
  c.width = PAD * 2 + cols * COL_W - u(12);
  c.height = HEAD_H + rows * ROW_H + PAD;
  const ctx = c.getContext('2d');
  ctx.textBaseline = 'middle';

  const fit = (text, maxW) => {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  };

  // fondo
  ctx.fillStyle = cssHex('--bg', '#0b1118');
  ctx.fillRect(0, 0, c.width, c.height);

  // jugador (derecha): avatar + nombre
  let reserved = 0;
  if (withProfile) {
    const ax = c.width - PAD - AV, ay = PAD - 4;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + AV / 2, ay + AV / 2, AV / 2, 0, Math.PI * 2);
    ctx.clip();
    if (avatar) {
      const sw = Math.min(avatar.naturalWidth, avatar.naturalHeight);
      ctx.drawImage(avatar, (avatar.naturalWidth - sw) / 2, (avatar.naturalHeight - sw) / 2, sw, sw, ax, ay, AV, AV);
    }
    ctx.restore();
    ctx.strokeStyle = cssHex('--line-2', '#3c4a5c');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax + AV / 2, ay + AV / 2, AV / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `700 18px ${FONT}`;
    const name = fit(profileState.username || '-', 220);
    ctx.fillStyle = cssHex('--text-1', '#ffffff');
    ctx.textAlign = 'right';
    ctx.fillText(name, ax - 14, ay + AV / 2);
    ctx.textAlign = 'left';
    reserved = AV + 14 + ctx.measureText(name).width + 24;
  }

  // título + subtítulo
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = cssHex('--text-1', '#ffffff');
  ctx.fillText(fit(currentList.title, c.width - PAD * 2 - reserved), PAD, PAD + 18);

  ctx.font = `500 16px ${FONT}`;
  ctx.fillStyle = cssHex('--mute', '#9fb4c8');
  const partial = demons.length !== currentList.demons.length;
  ctx.fillText(`${demons.length} demons${partial ? ` · #${from} – #${to}` : ''}`, PAD, PAD + 56);

  // filas
  demons.forEach((d, i) => {
    const x = PAD + Math.floor(i / PER_COL) * COL_W;
    const y = HEAD_H + (i % PER_COL) * ROW_H;
    const w = COL_W - u(12), h = ROW_H - u(6);

    ctx.fillStyle = cssHex('--panel-2', '#1a2633');
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = DIFFICULTY[d.difficulty] ? DIFFICULTY[d.difficulty].color : '#888';
    ctx.fillRect(x, y, u(4), h);

    ctx.fillStyle = cssHex('--mute', '#9fb4c8');
    ctx.font = `700 ${u(14)}px ${FONT}`;
    ctx.fillText(`#${from + i}`, x + u(14), y + h / 2);

    const icon = icons[d.difficulty];
    if (icon) ctx.drawImage(icon, x + u(62), y + (h - u(30)) / 2, u(30), u(30));

    ctx.fillStyle = cssHex('--text-1', '#ffffff');
    ctx.font = `700 ${u(15)}px ${FONT}`;
    ctx.fillText(fit(d.name, w - u(102) - u(12)), x + u(102), y + h / 2);
  });

  c.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentList.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

// ======================================================
// 3. Renderizado de vista
// ======================================================

function openListView(listId) {
  currentList = userLists.find(l => l.id === listId);
  if (!currentList) {
    history.replaceState(null, '', location.pathname);
    return renderMainPage();
  }

  setPageTitle(currentList.title);
  isDragLocked = viewPrefs.dragLocked !== false;
  listFilters = {
    sort: SORT_MODES.includes(viewPrefs.sort) ? viewPrefs.sort : 'custom',
    difficulty: DIFFICULTIES.includes(viewPrefs.difficulty) ? viewPrefs.difficulty : 'all',
    favorite: viewPrefs.favorite === true
  };

  mountView(`
    <div class="list-view">
      <div class="list-view-header">
        <div class="list-view-heading">
          <h1 class="list-view-title">${escapeHTML(currentList.title)}</h1>
          <span class="list-view-subtitle" id="listViewSubtitle">${escapeHTML(listSubtitleText())}</span>
        </div>
        <div class="list-view-actions">
          <button type="button" id="btnImportList" class="btn-line btn-io btn-io-import" title="${t('listm.import')}">${svg.Import}<span class="btn-label">${t('io.import')}</span></button>
          <button type="button" id="btnExportList" class="btn-line btn-io btn-io-export" title="${t('listm.export')}">${svg.Export}<span class="btn-label">${t('io.export')}</span></button>
          <input type="file" id="fileImportList" accept=".json,application/json" hidden>

          <div class="io-menu" data-pop-root>
            <button type="button" id="btnIoMenu" class="btn-line" style="padding: 6px" title="${t('io.options')}" aria-haspopup="menu">${svg.Options}</button>
            <div id="ioPop" class="pop pop-menu">
              <button type="button" class="pop-item" data-io="import">${t('io.import')}</button>
              <button type="button" class="pop-item" data-io="export">${t('io.export')}</button>
            </div>
          </div>

          <button type="button" id="btnExportImg" class="btn-line" title="${t('export.title')}">${svg.Image}<span class="btn-label">${t('export.btn')}</span></button>
        </div>
      </div>

      <div class="list-view-controls panel">
        <button type="button" id="btnRandomDemon" class="button-square" style="padding-bottom: 1px" title="${t('dice.title')}">${svg.Dice}</button>

        <div class="filter-popup-wrapper" data-pop-root>
          <button type="button" id="btnOpenFilter" class="btn-filter-toggle button-square" title="${t('view.filters')}">${svg.Filter}</button>

          <div id="filterPopup" class="pop filter-popup-dropdown">
            <div class="filter-popup-header"><span>${t('view.filters')}</span></div>
            <div class="filter-popup-section">
              <span class="filter-popup-label">${t('view.difficulty')}</span>
              <div class="filter-diff-grid" id="filterDiffGrid">
                <button type="button" class="filter-diff-pill active" data-diff="all">${t('view.all')}</button>
                ${DIFFICULTIES.map(d => `
                  <button type="button" class="filter-diff-pill" data-diff="${d}">${d.replace(' Demon', '')}</button>
                `).join('')}
              </div>
            </div>
            <div class="filter-popup-section">
              <span class="filter-popup-label">${t('view.favFilter')}</span>
              <button type="button" id="btnPopupFav" class="filter-fav-option">
                <img src="${FAV_ICON.off}" alt="">
                <span>${t('view.onlyFav')}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="search-box" data-pop-root>
          ${svg.Search}
          <input type="text" id="searchDemon" class="form-input search-input-field" placeholder="${t('view.search')}" autocomplete="off" spellcheck="false">
          <div id="searchAutocomplete" class="pop autocomplete-dropdown"></div>
        </div>
        
        <button type="button" id="btnToggleLockDrag" class="button-square toggle" title="${t('view.lock')}"><img alt=""></button>

        <div class="sort-wrap" data-pop-root>
          <button type="button" id="btnSort" class="form-input select-btn" title="${t('view.sort')}" aria-haspopup="listbox"><span id="sortLabel"></span>${svg.MiniWave}</button>
          <div id="sortMenu" class="pop pop-menu">
            ${SORT_MODES.map(m => `<button type="button" class="pop-item" data-sort="${m}">${t('sort.' + m)}</button>`).join('')}
          </div>
        </div>

        <div class="view-toggle">
          <button type="button" id="btnToggleCompact" title="${t('view.compact')}">${svg.Compact}</button>
          <button type="button" id="btnToggleThumb" title="${t('view.thumbYt')}"><img src="resources/demon.png" alt=""></button>
        </div>
      </div>

      <div class="filter-bar" id="filterBar">
        <span class="filter-bar-count" id="filterCount"></span>
        <button type="button" id="btnClearFilters" class="filter-bar-clear">${svg.Close}<span>${t('view.clearFilters')}</span></button>
      </div>

      <div class="list-view-body">
        <div class="demons-container" id="demonsContainer"></div>
        <aside class="list-sidebar panel">
          <button type="button" class="stats-close" id="btnStatsClose" aria-label="${t('common.close')}">✕</button>
          <div id="listStatsContainer"></div>
        </aside>
      </div>

      <div class="stats-backdrop" id="statsBackdrop"></div>
      <button type="button" class="stats-fab" id="btnStatsFab" title="${t('view.stats')}" aria-label="${t('view.stats')}">${svg.Stats}</button>
    </div>`);
  
  // ---- export e import list ----->
  $('btnExportList').addEventListener('click', () => exportListJSON(currentList));
  $('btnImportList').addEventListener('click', () => $('fileImportList').click());
  $('fileImportList').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const { data, error } = await readListFile(file);
    if (error) return showAlert(t(error));
    if (!await showConfirm(t('listm.replaceConfirm'), { danger: true })) return;
    currentList.demons = data.demons.map(normalizeDemon);
    if (!saveData()) return;
    renderDemons();
    renderListStats();
    showToast(t('listm.importOk'));
  });
  // ---- img export ----->
  $('btnExportImg').addEventListener('click', openExportImageModal);

  // ---- menú export-import (cel) ----->
  $('btnIoMenu').addEventListener('click', () => setPop($('ioPop'), !$('ioPop').classList.contains('open')));
  $('ioPop').addEventListener('click', (e) => {
    const item = e.target.closest('[data-io]');
    if (!item) return;
    setPop($('ioPop'), false);
    $(item.dataset.io === 'import' ? 'btnImportList' : 'btnExportList').click();
  });

  // ---- cajón de stats (cel) ----->
  const listViewEl = document.querySelector('.list-view');
  const setStatsOpen = open => listViewEl.classList.toggle('stats-open', open);
  $('btnStatsFab').addEventListener('click', () => setStatsOpen(true));
  $('btnStatsClose').addEventListener('click', () => setStatsOpen(false));
  $('statsBackdrop').addEventListener('click', () => setStatsOpen(false));

  // ---- random mode ----->
  $('btnRandomDemon').addEventListener('click', openRandomDemonModal);

  // ---- filtros ----->
  $('btnOpenFilter').addEventListener('click', () => setPop($('filterPopup'), !$('filterPopup').classList.contains('open')));

  $('filterDiffGrid').addEventListener('click', (e) => {
    const pill = e.target.closest('[data-diff]');
    if (!pill) return;
    listFilters.difficulty = viewPrefs.difficulty = pill.dataset.diff;
    syncFilterUI(); saveData(); renderDemons();
  });

  $('btnPopupFav').addEventListener('click', () => {
    listFilters.favorite = viewPrefs.favorite = !listFilters.favorite;
    syncFilterUI(); saveData(); renderDemons();
  });

  // ---- buscador local ----->
  const searchInput = $('searchDemon');
  const showSearch = () => renderLocalAutocomplete(searchInput.value.trim());
  searchInput.addEventListener('input', showSearch);
  searchInput.addEventListener('focus', showSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = searchMatches(searchInput.value.trim())[0];
    if (!first) return;
    pickSearchResult(first.id);
  });

  // ---- candado de arrastre ----->
  $('btnToggleLockDrag').addEventListener('click', () => {
    if (hasActiveFilters() || listFilters.sort !== 'custom') return showToast(t('view.lockBlocked'));
    isDragLocked = !isDragLocked;
    viewPrefs.dragLocked = isDragLocked;
    saveData();
    updateLockButton();
    initSortable();
  });

  // ---- miniaturas: youtube / cara ----->
  $('btnToggleThumb').addEventListener('click', () => {
    viewPrefs.showFaces = !viewPrefs.showFaces;
    saveData();
    updateThumbButton();
    renderDemons();
  });

  updateThumbButton();

  $('btnToggleCompact').addEventListener('click', () => {
    viewPrefs.compact = !viewPrefs.compact;
    saveData();
    updateCompactButton();
  });
  updateCompactButton();
  $('btnClearFilters').addEventListener('click', clearFilters);

  // ---- orden ----->
  $('btnSort').addEventListener('click', () => setPop($('sortMenu'), !$('sortMenu').classList.contains('open')));
  $('sortMenu').addEventListener('click', (e) => {
    const item = e.target.closest('[data-sort]');
    if (!item) return;
    setSortMode(item.dataset.sort);
    setPop($('sortMenu'), false);
    renderDemons();
  });
  syncSortUI();

  $('demonsContainer').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-demon]');
    if (editBtn) return openEditDemonModal(currentList.id, editBtn.dataset.editDemon);

    const addBtn = e.target.closest('[data-add-demon-after]');
    if (addBtn) openAddDemonModal(currentList.id, addBtn.dataset.addDemonAfter);
  });

  syncFilterUI();
  renderDemons();
  renderListStats();
}

/* ==== modals.js ==== */
// ======================================================
// 1. Base de modales
// ======================================================

function topModal() {
  const all = $('modalContainer').querySelectorAll('.modal-overlay:not(.closing)');
  return all[all.length - 1] || null;
}

let skipPops = 0;
const pendingModalPush = [];
function flushModalPush() { while (pendingModalPush.length) pendingModalPush.shift()(); }
function openModal({ title = '', titleExtra = '', body = '', actions = '', cls = '', dismissible = true, onClose = null }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.dataset.dismissible = dismissible ? '1' : '';
  overlay._onClose = onClose;
  overlay._hasHistory = false;
  const push = () => { history.pushState({ modal: true }, ''); overlay._hasHistory = true; };
  if (skipPops > 0) {
    pendingModalPush.push(() => { if (!overlay.classList.contains('closing')) push(); });
    setTimeout(flushModalPush, 500);
  } else push();
  overlay.innerHTML = `
    <div class="modal-card ${cls}" role="dialog" aria-modal="true">
      ${title ? `<h2 class="modal-title"><span>${title}</span>${titleExtra}</h2>` : ''}
      <div class="modal-scroll-area">
        <div class="modal-body">${body}</div>
        ${actions ? `<div class="modal-actions">${actions}</div>` : ''}
      </div>
    </div>
`;

  let downOnOverlay = false;
  overlay.addEventListener('pointerdown', e => { downOnOverlay = e.target === overlay; });
  overlay.addEventListener('click', e => {
    if (dismissible && downOnOverlay && e.target === overlay) closeModal(overlay);
    downOnOverlay = false;
  });

  $('modalContainer').appendChild(overlay);

  // Foco automático
  if (window.matchMedia('(hover: hover)').matches) {
    const first = overlay.querySelector('input:not([type=file]):not([type=color]):not([type=date]):not([type=number]):not([type=range])');
    if (first) first.focus({ preventScroll: true });
  }
  return overlay;
}

function closeModal(overlay, fromPop = false) {
  const el = overlay || topModal();
  if (!el || el.classList.contains('closing')) return;
  if (el._hasHistory) {
    el._hasHistory = false;
    if (!fromPop) { skipPops++; history.back(); }
  }
  el.classList.add('closing');
  setTimeout(() => el.remove(), 170);
  if (typeof el._onClose === 'function') el._onClose();
}

// ---- Avisos y confirmaciones ----->
function showAlert(message, { title = t('dlg.alert') } = {}) {
  return new Promise(resolve => {
    const ov = openModal({
      title, cls: 'modal-sm', onClose: resolve,
      body: `<p class="dialog-text">${escapeHTML(message)}</p>`,
      actions: `<button type="button" class="btn-primary" data-ok>${t('common.ok')}</button>`
    });
    const ok = ov.querySelector('[data-ok]');
    ok.addEventListener('click', () => closeModal(ov));
    ok.focus();
  });
}

// Devuelve una promesa: true si aceptó, false si canceló o cerró
function showConfirm(message, { title = t('dlg.confirm'), danger = false, okText = t('common.ok') } = {}) {
  return new Promise(resolve => {
    let result = false;
    const ov = openModal({
      title, cls: 'modal-sm', onClose: () => resolve(result),
      body: `<p class="dialog-text">${message}</p>`,
      actions: `
        <button type="button" class="btn-secondary" data-cancel>${t('common.cancel')}</button>
        <button type="button" class="${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${okText}</button>`
    });
    ov.querySelector('[data-cancel]').addEventListener('click', () => closeModal(ov));
    ov.querySelector('[data-ok]').addEventListener('click', () => { result = true; closeModal(ov); });
    ov.querySelector('[data-ok]').focus();
  });
}

// Devuelve el texto escrito, o null si canceló
function showPrompt(message, { title = t('dlg.confirm'), placeholder = '' } = {}) {
  return new Promise(resolve => {
    let result = null;
    const ov = openModal({
      title, cls: 'modal-sm', onClose: () => resolve(result),
      body: `
        <p class="dialog-text">${escapeHTML(message)}</p>
        <div class="form-group"><input type="text" id="promptInput" class="form-input" spellcheck="false" autocomplete="off" placeholder="${escapeHTML(placeholder)}"></div>`,
      actions: `
        <button type="button" class="btn-secondary" data-cancel>${t('common.cancel')}</button>
        <button type="button" class="btn-primary" data-ok>${t('common.ok')}</button>`
    });
    const input = ov.querySelector('#promptInput');
    const accept = () => { result = input.value; closeModal(ov); };
    ov.querySelector('[data-cancel]').addEventListener('click', () => closeModal(ov));
    ov.querySelector('[data-ok]').addEventListener('click', accept);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') accept(); });
    input.focus();
  });
}

// true si hay sesión; si no, ofrece iniciarla
function requireLogin(msgKey) {
  if (cloudUser) return true;
  showConfirm(t(msgKey), { okText: t('login.title') }).then(ok => { if (ok) openSignInModal(); });
  return false;
}

// ---- Piezas reutilizables de formularios ----->
function bindFileInput(file, opts, onChange) {
  const input = $(file);
  const ov = input.closest('.modal-overlay');
  const save = ov.querySelector('.modal-actions .btn-primary');

  const setBusy = d => {
    ov._uploads = (ov._uploads || 0) + d;
    ov.classList.toggle('uploading', ov._uploads > 0);
    if (save) save.disabled = ov._uploads > 0;
  };

  input.addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setBusy(1);
    const data = await readImageFile(f, opts);
    setBusy(-1);
    if (data && !ov.classList.contains('closing')) onChange(data);
  });
}

const previewBox = (id, imgId) => `
  <div class="list-preview-wrap">
    <div class="list-preview-container" id="${id}">
      <img id="${imgId}" alt="">
      <span class="preview-empty">${t('common.noPhoto')}</span>
      <span class="preview-src" id="${id}Src"></span>
    </div>
    <div class="preview-edit" data-pop-root>
      <button type="button" class="edit-btn" id="${id}Btn" aria-haspopup="menu">${svg.Pencil}</button>
      <div class="pop pop-menu" id="${id}Pop">
        <button type="button" class="pop-item" data-act="upload">${t('listm.upload')}</button>
        <button type="button" class="pop-item" data-act="remove" id="${id}Remove">${t('listm.remove')}</button>
      </div>
    </div>
  </div>`;

function submitOnEnter(input, button) {
  input.addEventListener('keydown', e => { if (e.key === 'Enter') button.click(); });
}

function markInvalid(input) {
  input.classList.remove('is-invalid');
  void input.offsetWidth; // reinicia la animación
  input.classList.add('is-invalid');
  input.focus();
  input.addEventListener('input', () => input.classList.remove('is-invalid'), { once: true });
}

// ======================================================
// 2. Modal - Selector de color
// ======================================================

function hsvToHex(h, s, v) {
  const f = n => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const hex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(5))}${hex(f(3))}${hex(f(1))}`;
}

function hexToHsv(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: max ? d / max : 0, v: max };
}

function openColorModal({ value = '', fallback = '#ffffff', onApply }) {
  let { h, s, v } = hexToHsv(safeColor(value) || fallback);
  let typedHex = null;

  const ov = openModal({
    title: t('color.title'),
    cls: 'modal-sm',
    body: `
      <div class="cp">
        <div class="cp-area" id="cpArea"><div class="cp-thumb" id="cpThumb"></div></div>
        <input type="range" id="cpHue" class="cp-hue" min="0" max="360" step="1" aria-label="Hue">
        <div class="cp-sample">
          <span class="cp-swatch" id="cpSwatch"></span>
          <input type="text" id="cpHex" class="form-input" maxlength="7" spellcheck="false" autocomplete="off">
          <button type="button" class="btn-field" id="btnCpReset">${t('color.reset')}</button>
        </div>
      </div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnCpCancel">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnCpApply">${t('color.apply')}</button>`
  });

  const area = $('cpArea');
  const current = () => typedHex || hsvToHex(h, s, v);

  const render = (keepInput = false) => {
    const hex = current();
    area.style.setProperty('--cp-hue', `hsl(${h}, 100%, 50%)`);
    $('cpThumb').style.left = `${s * 100}%`;
    $('cpThumb').style.top = `${(1 - v) * 100}%`;
    $('cpThumb').style.background = hex;
    $('cpSwatch').style.background = hex;
    $('cpHue').value = h;
    if (!keepInput) $('cpHex').value = hex;
  };

  // ---- arrastrar ----->
  const clamp = n => Math.min(1, Math.max(0, n));
  let dragging = false;

  const pick = (e) => {
    const r = area.getBoundingClientRect();
    s = clamp((e.clientX - r.left) / r.width);
    v = 1 - clamp((e.clientY - r.top) / r.height);
    typedHex = null;
    render();
  };

  area.addEventListener('pointerdown', (e) => { dragging = true; area.setPointerCapture(e.pointerId); pick(e); });
  area.addEventListener('pointermove', (e) => { if (dragging) pick(e); });
  area.addEventListener('pointerup', () => { dragging = false; });
  area.addEventListener('pointercancel', () => { dragging = false; });

  // ---- tono y hex ----->
  $('cpHue').addEventListener('input', (e) => { h = Number(e.target.value); typedHex = null; render(); });

  $('cpHex').addEventListener('input', (e) => {
    let val = e.target.value.trim();
    if (!val.startsWith('#')) val = '#' + val;
    if (!/^#[0-9a-f]{6}$/i.test(val)) return;
    ({ h, s, v } = hexToHsv(val));
    typedHex = val.toLowerCase();
    render(true);
  });

  // ---- botones ----->
  $('btnCpReset').addEventListener('click', () => { onApply(''); closeModal(ov); });
  $('btnCpCancel').addEventListener('click', () => closeModal(ov));
  $('btnCpApply').addEventListener('click', () => { onApply(current()); closeModal(ov); });

  render();
}

// ======================================================
// 3. Modal - Editar perfil
// ======================================================

function openEditProfileModal() {
  let avatar = profileState.avatar || '';
  let banner = profileState.banner || '';
  let bannerColor = safeColor(profileState.bannerColor);
  let playerType = profileState.playerType || '';

  const ov = openModal({
    title: t('profile.editTitle'),
    cls: 'modal-profile',
    body: `
      <div class="pe-header" style="margin-top: -6px">
        <div class="pe-banner" id="peBanner"><img id="bannerPreview" alt=""></div>

        <div class="pe-banner-edit" data-pop-root>
          <button type="button" class="pe-edit-btn" id="btnBannerEdit" title="${t('profile.editBanner')}" aria-haspopup="menu">${svg.Pencil}</button>
          <div class="pop pop-menu" id="bannerPop">
            <button type="button" class="pop-item" data-act="upload">${t('profile.uploadBanner')}</button>
            <button type="button" class="pop-item" data-act="remove" id="btnBannerRemove">${t('profile.removeBanner')}</button>
            <button type="button" class="pop-item" data-act="color">${t('profile.bannerColor')}</button>
          </div>
        </div>

        <div class="pe-avatar-wrap" data-pop-root id="btnAvatarEdit">
          <div class="pe-avatar">
            <img id="avatarPreview" alt="">
            <button type="button" class="pe-edit-btn" title="${t('profile.editAvatar')}" aria-haspopup="menu">${svg.Pencil}</button>
          </div>
          <div class="pop pop-menu" id="avatarPop">
            <button type="button" class="pop-item" data-act="upload">${t('profile.uploadImg')}</button>
            <button type="button" class="pop-item" data-act="remove" id="btnAvatarRemove">${t('profile.removeImg')}</button>
          </div>
        </div>
      </div>

      <input type="file" id="fileBanner" accept="image/*" hidden>
      <input type="file" id="fileAvatar" accept="image/*" hidden>

      <div class="pe-fields">
        <div class="form-group">
          <label>${t('profile.username')}</label>
          <input type="text" id="editName" class="form-input" spellcheck="false" placeholder="${t('profile.name')}" maxlength="24" value="${escapeHTML(profileState.username)}">
        </div>

        <div class="form-group">
          <label>${t('profile.type')}</label>
          <div class="pe-types" id="peTypes">
            <button type="button" class="filter-diff-pill" data-type="">${t('profile.typeNone')}</button>
            <button type="button" class="filter-diff-pill" data-type="pc">${t('profile.typePc')}</button>
            <button type="button" class="filter-diff-pill" data-type="mobile">${t('profile.typeMobile')}</button>
          </div>
        </div>

        <div class="form-group position-relative" data-pop-root>
          <label>${t('profile.country')}</label>
          <input type="text" id="editCountry" class="form-input" spellcheck="false" autocomplete="off" placeholder="${t('profile.countryPh')}" value="${escapeHTML(profileState.country || '')}">
          <div id="countryPop" class="pop autocomplete-dropdown drop-up" style="margin-bottom: -20px"></div>
        </div>

        <div class="form-group">
          <label>${t('profile.bio')}</label>
          <textarea id="editBio" class="form-input" maxlength="140" rows="3" spellcheck="false" placeholder="${t('profile.bioPh')}">${escapeHTML(profileState.bio || '')}</textarea>
        </div>
      </div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnCancelEdit">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnSaveEdit">${t('common.save')}</button>`
  });

  const sync = () => {
    $('avatarPreview').src = avatar || DEFAULT_AVATAR;

    const box = $('peBanner');
    box.classList.toggle('has-img', !!banner);
    box.style.backgroundColor = bannerColor || '';
    if (banner) $('bannerPreview').src = banner; else $('bannerPreview').removeAttribute('src');

    $('btnBannerRemove').disabled = !banner;
    $('btnAvatarRemove').disabled = !avatar;
    ov.querySelectorAll('#peTypes .filter-diff-pill').forEach(b => b.classList.toggle('active', b.dataset.type === playerType));
  };

  // ---- archivos ----->
  bindFileInput('fileAvatar', 512, data => { avatar = data; sync(); });
  bindFileInput('fileBanner', { maxSize: 1600, quality: 0.86 }, data => { banner = data; sync(); });

  // ---- banner ----->
  $('btnBannerEdit').addEventListener('click', () => setPop($('bannerPop'), !$('bannerPop').classList.contains('open')));

  $('bannerPop').addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item || item.disabled) return;
    setPop($('bannerPop'), false);

    if (item.dataset.act === 'upload') { if (requireLogin('login.bannerNeeded')) $('fileBanner').click(); }
    else if (item.dataset.act === 'remove') { banner = ''; sync(); }
    else openColorModal({
      value: bannerColor,
      fallback: cssHex('--panel-banner', '#ffffff'),
      onApply: color => { bannerColor = color; sync(); }
    });
  });

  // ---- avatar ----->
  $('btnAvatarEdit').addEventListener('click', (e) => {
    if (e.target.closest('#avatarPop')) return;
    setPop($('avatarPop'), !$('avatarPop').classList.contains('open'));
  });

  $('avatarPop').addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item || item.disabled) return;
    setPop($('avatarPop'), false);

    if (item.dataset.act === 'upload') $('fileAvatar').click();
    else { avatar = ''; sync(); }
  });

  $('peTypes').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    playerType = b.dataset.type;
    sync();
  });
  // ---- nacionalidad ----->
  const countryInput = $('editCountry');
  const countryPop = $('countryPop');

  const showCountries = () => {
    const q = countryInput.value.trim();
    const list = q ? rankMatches(COUNTRIES, q, c => c, 8) : COUNTRIES;
    if (list.length === 0) return setPop(countryPop, false);

    countryPop.innerHTML = list.map(c => `<div class="autocomplete-item" data-country="${escapeHTML(c)}">${escapeHTML(c)}</div>`).join('');
    setPop(countryPop, true);
  };

  countryInput.addEventListener('input', showCountries);
  countryPop.addEventListener('click', (e) => {
    const item = e.target.closest('[data-country]');
    if (!item) return;
    countryInput.value = item.dataset.country;
    setPop(countryPop, false);
  });

  // ---- guardar ----->
  $('btnCancelEdit').addEventListener('click', () => closeModal(ov));
  submitOnEnter($('editName'), $('btnSaveEdit'));
  submitOnEnter(countryInput, $('btnSaveEdit'));

  $('btnSaveEdit').addEventListener('click', () => {
    const name = $('editName').value.trim();
    if (!name) return markInvalid($('editName'));

    const typed = countryInput.value.trim();
    const country = typed ? COUNTRIES.find(c => normalizeText(c) === normalizeText(typed)) : '';
    if (typed && !country) return markInvalid(countryInput);

    const bio = $('editBio').value.trim().slice(0, 160);

    const prev = { ...profileState };
    Object.assign(profileState, { username: name, avatar, banner, bannerColor, country, playerType, bio });
    if (!saveData()) { Object.assign(profileState, prev); return; }

    closeModal(ov);
    renderHeader();
    renderMainPage(false);
  });

  sync();
}

function openEditGdModal() {
  let rank = normalizeGdRank(profileState.gdRank);

  const ov = openModal({
    title: t('gd.editTitle'),
    cls: 'modal-sm',
    body: `
      <div class="form-group">
        <label>${t('profile.gdName')}</label>
        <input type="text" id="editGdName" class="form-input" spellcheck="false" maxlength="20" autocomplete="off" placeholder="-" value="${escapeHTML(profileState.gdName || '')}">
      </div>
      <div class="form-group">
        <label>${t('profile.gdId')}</label>
        <input type="text" id="editGdId" class="form-input" inputmode="numeric" maxlength="12" autocomplete="off" placeholder="-" value="${escapeHTML(profileState.gdId || '')}">
      </div>
      <div class="form-group position-relative" data-pop-root>
        <label>${t('profile.gdRank')}</label>
        <button type="button" id="gdRankBtn" class="form-input select-btn" aria-haspopup="listbox"><span id="gdRankLabel"></span>${svg.MiniWave}</button>
        <div id="gdRankPop" class="pop pop-menu rank-pop">
          <button type="button" class="pop-item" data-rank="">${t('profile.typeNone')}</button>
          ${RANK_TIERS.map(([max]) => `<button type="button" class="pop-item" data-rank="${max}">${rankLabel(max)}</button>`).join('')}
        </div>
      </div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnCancelGd">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnSaveGd">${t('common.save')}</button>`
  });

  const sync = () => {
    $('gdRankLabel').textContent = rank ? rankLabel(Number(rank)) : t('profile.typeNone');
    ov.querySelectorAll('#gdRankPop .pop-item').forEach(b => b.classList.toggle('active', b.dataset.rank === rank));
  };

  $('gdRankBtn').addEventListener('click', () => setPop($('gdRankPop'), !$('gdRankPop').classList.contains('open')));
  $('gdRankPop').addEventListener('click', (e) => {
    const b = e.target.closest('[data-rank]');
    if (!b) return;
    rank = b.dataset.rank;
    setPop($('gdRankPop'), false);
    sync();
  });

  $('btnCancelGd').addEventListener('click', () => closeModal(ov));
  ['editGdName', 'editGdId'].forEach(id => submitOnEnter($(id), $('btnSaveGd')));

  $('btnSaveGd').addEventListener('click', () => {
    const prev = { ...profileState };
    Object.assign(profileState, {
      gdName: $('editGdName').value.trim().slice(0, 20),
      gdId: $('editGdId').value.replace(/\D/g, '').slice(0, 12),
      gdRank: rank
    });
    if (!saveData()) { Object.assign(profileState, prev); return; }
    closeModal(ov);
    renderMainPage(false);
  });

  sync();
}

// ======================================================
// 4. Modales - Iniciar sesión
// ======================================================

function showInfoModal(title, text) {
  const ov = openModal({
    title,
    cls: 'modal-sm',
    body: `<p class="dialog-text" style="word-break: break-word">${escapeHTML(text)}</p>`,
    actions: `<button type="button" class="btn-primary" data-ok>${t('common.ok')}</button>`
  });
  ov.querySelector('[data-ok]').addEventListener('click', () => closeModal(ov));
}

// Cuenta de sincronización: inicio de sesión con Google
async function cloudSignInGoogle() {
  try { localStorage.setItem(LOGIN_FLAG, String(Date.now())); } catch (e) {}
  const { error } = await cloud.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: location.origin + location.pathname }
  });
  if (error) showAlert(error.message);
}

// Solo para sesión iniciada: sincronizar y cerrar sesión
function openAccountModal() {
  if (!cloudUser) return openSignInModal();

  const ov = openModal({
    title: t('acc.title'),
    cls: 'modal-sm',
    body: `<p class="dialog-text">${t('acc.logged', { email: escapeHTML(cloudUser.email) })}</p>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnAccOut">${t('acc.signOut')}</button>`
  });

  $('btnAccOut').addEventListener('click', () => cloudSignOut());
}

const svgGoogle = `<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.9-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>`;

function openSignInModal() {
  const link = (href, key) => `<a href="${href}" target="_blank" rel="noopener">${t(key)}</a>`;
  openModal({
    title: t('login.title'),
    cls: 'modal-sm',
    body: `
      <p class="dialog-text">${t('auth.text')}</p>
      <button type="button" class="btn-google" id="btnGoogle">${svgGoogle}<span>${t('auth.google')}</span></button>
      <p class="legal-note">${t('auth.legal', { terms: link('terms.html', 'legal.terms'), privacy: link('privacy.html', 'legal.privacy') })}</p>`
  });
  $('btnGoogle').addEventListener('click', async () => {
    $('btnGoogle').disabled = true;
    await cloudSignInGoogle();
    $('btnGoogle').disabled = false;
  });
}

// ======================================================
// 5. Modal - Agregar / editar lista
// ======================================================

function openListModal(listId = null, asMain = false) {
  const isEditing = listId !== null;
  const list = isEditing ? userLists.find(item => item.id === listId) : null;
  if (isEditing && !list) return;

  let image = list ? (list.image || '') : '';

  const ov = openModal({
    title: isEditing ? t('listm.edit') : t('listm.new'),
    cls: 'modal-list',
    titleExtra: `<div class="sort-wrap options-modal" data-pop-root>
                  <button type="button" id="btnOptionsList" class="btn-options-icon" title="options">${svg.Options}</button>
                  <div class="pop pop-menu" id="optionsListMenu">
                     <button type="button" class="pop-item" data-act="import">${t('listm.import')}</button>
                     <button type="button" class="pop-item" data-act="export" ${!isEditing ? 'disabled' : ''}>${t('listm.export')}</button>
                     <input type="file" id="fileImportJSON" accept=".json" hidden>
                     <button type="button" class="pop-item" data-act="image" ${!isEditing ? 'disabled' : ''}>${t('listm.png')}</button>
                  </div>
                </div>`,
    body: `
      <div class="form-group">
        ${appSettings.bgList === false ? `<small class="blur-off">${t('listm.blurOff')}</small>` : ''}
        <label>${t('listm.banner')}</label>
        <div class="field-row" style="padding-top: 4px">
          ${previewBox('listImgBox', 'listImgPreview')}
          <input type="file" id="fileListImg" accept="image/*" hidden>
        </div>
      </div>

      <div class="form-group">
        <label>${t('listm.name')}</label>
        <input type="text" id="editListTitle" maxlength="32" spellcheck="false" class="form-input" placeholder="My Demon List" value="${list ? escapeHTML(list.title) : ''}">
      </div>`,
    actions: `
      <button type="button" id="btnCancelListModal" class="btn-secondary">${t('common.cancel')}</button>
      <button type="button" id="btnSaveListModal" class="btn-primary">${isEditing ? t('listm.saveChanges') : t('listm.create')}</button>`
  });

  // ---- imagen ----->
  const syncImage = () => {
    const yt = !image && list ? getYouTubeThumbnail(list.demons?.[0]?.showcase, 'maxresdefault') : '';
    const shown = image || yt;
    $('listImgBox').classList.toggle('has-img', !!shown);
    const img = $('listImgPreview');
      img.onerror = null;
      if (shown) {
        if (yt) img.onerror = () => { img.onerror = null; img.src = yt.replace('maxresdefault', 'mqdefault'); };
        img.src = shown;
      } else img.removeAttribute('src');
    $('listImgBoxSrc').innerHTML = image ? svg.Image : (yt ? svg.Yt : '');
    $('listImgBoxRemove').disabled = !image;
  };
  bindFileInput('fileListImg', { maxSize: 1280, quality: 0.86 }, data => { image = data; syncImage(); });

  $('listImgBoxBtn').addEventListener('click', () => setPop($('listImgBoxPop'), !$('listImgBoxPop').classList.contains('open')));

  $('listImgBoxPop').addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item || item.disabled) return;
    setPop($('listImgBoxPop'), false);

    if (item.dataset.act === 'upload') $('fileListImg').click();
    else { image = ''; syncImage(); }
  });

  // ---- pop exportar / importar ----->
  $('btnOptionsList').addEventListener('click', () => setPop($('optionsListMenu'), !$('optionsListMenu').classList.contains('open')));

  $('optionsListMenu').addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item || item.disabled) return;
    setPop($('optionsListMenu'), false);

    const action = item.dataset.act;

    if (action === 'import') {
      $('fileImportJSON').click();
    } 
    else if (action === 'export') {
      if (!isEditing) return;
      exportListJSON(list);
    } else if (action === 'image') {
      if (!isEditing) return;
      currentList = list;
      openExportImageModal();
    }
  });
  
  // ---- logica importar ----->
  $('fileImportJSON').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const { data, error } = await readListFile(file);
    if (error) return showAlert(t(error));

    if (isEditing) {
      if (!await showConfirm(t('listm.replaceConfirm'), { danger: true })) return;
      list.demons = data.demons.map(normalizeDemon);
    } else {
      const imported = normalizeList({ ...data, id: Date.now(), isMain: false, order: Date.now(), author: profileState.username });
      userLists.push(imported);
      if (asMain) setMainList(imported.id);
    }
    if (!saveData()) return;
    closeModal(ov);
    renderListsCards();
    showAlert(t('listm.importOk'));
  });

  // ---- eliminar / guardar ----->
  $('btnCancelListModal').addEventListener('click', () => closeModal(ov));

  submitOnEnter($('editListTitle'), $('btnSaveListModal'));

  $('btnSaveListModal').addEventListener('click', () => {
    const title = $('editListTitle').value.trim();
    if (!title) return markInvalid($('editListTitle'));

    if (isEditing) {
      Object.assign(list, { title, image });
    } else {
      const created = normalizeList({ id: Date.now(), title, image, author: profileState.username, demons: [] });
      userLists.push(created);
      if (asMain) setMainList(created.id);
    }

    saveData();
    closeModal(ov);
    renderListsCards();
  });

  syncImage();
}

const openAddListModal = () => openListModal();
const openEditListModal = (listId) => openListModal(listId);

// ======================================================
// 6. Modal - Agregar / editar demon
// ======================================================

const levelsCache = new Map();

async function searchLevels(query) {
  const q = normalizeText(query);
  if (q.length < 1) return [];
  if (levelsCache.has(q)) return levelsCache.get(q);

  try {
    const res = await fetch(`${API_BASE}/api/levels?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    if (levelsCache.size > 100) levelsCache.clear();
    levelsCache.set(q, data);
    return data;
  } catch (e) {
    return [];
  }
}

function openAddDemonModal(listId, afterId = null) {
  renderDemonModal(listId, null, afterId);
}

function openEditDemonModal(listId, demonId) {
  const list = userLists.find(l => String(l.id) === String(listId));
  const demon = list && list.demons.find(d => String(d.id) === String(demonId));
  if (demon) renderDemonModal(listId, demon);
}

// Normaliza nivel Json
function levelToFormData(level) {
  const rawDiff = level.difficulty || level.diff || 'Easy';
  const difficulty = rawDiff.includes('Demon') ? rawDiff : `${rawDiff} Demon`;
  return {
    name: level.name || level.title || '',
    creator: level.publisherName || level.creator || level.author || '',
    difficulty,
    levelId: String(level.id ?? '').replace(/\D/g, ''),
  };
}

function renderDemonModal(listId, demonData, afterId = null) {
  const isEdit = !!demonData;
  const list = userLists.find(l => l.id === listId);
  if (!list) return;

  let isFav = isEdit ? !!demonData.isFavorite : false;
  let selectedDifficulty = isEdit && DIFFICULTY[demonData.difficulty] ? demonData.difficulty : 'Easy Demon';
  const val = key => (isEdit ? escapeHTML(String(demonData[key] ?? '')) : '');

  const total = list.demons.length;
  const maxPos = isEdit ? total : total + 1;
  const curIdx = isEdit ? list.demons.findIndex(d => String(d.id) === String(demonData.id)) : -1;
  const afterIdx = afterId !== null ? list.demons.findIndex(d => String(d.id) === String(afterId)) : -1;
  const defaultPos = isEdit ? curIdx + 1 : (afterIdx === -1 ? total + 1 : afterIdx + 2);

  const ov = openModal({
    title: isEdit ? t('demon.edit') : t('demon.add'),
    cls: 'modal-demon',
    titleExtra: `<button type="button" class="btn-fav-icon" id="demonFav" title="${t('listm.favTitle')}"><img alt=""></button>`,
    body: `
      <div class="demon-modal-top">
        <div class="thumb-text">${svg.Yt}<p>${t('demon.thumbHint')}</p></div>
        <div class="demon-thumb-preview" id="demonThumbPreview"></div>
      </div>

      <div class="form-group position-relative" data-pop-root>
        <label>${t('demon.name')}</label>
        <input type="text" id="demonName" class="form-input" spellcheck="false" placeholder="bloodbath" autocomplete="off" value="${val('name')}">
        <div id="levelsAutocomplete" class="pop autocomplete-dropdown"></div>
      </div>

      <div class="form-group">
        <label>${t('demon.creator')}</label>
        <input type="text" id="demonCreator" class="form-input" spellcheck="false" placeholder="icedcave ${t('o')} cherryteam" autocomplete="off" value="${val('creator')}">
      </div>

      <div class="form-group">
        <label>${t('demon.difficulty')}</label>
        <div id="demonDiff" class="demon-diff-selector">
          ${DIFFICULTIES.map(d => `
            <button type="button" data-diff="${d}" title="${d}" style="${diffColorStyle(d)}"><img src="${DIFFICULTY[d].icon}" alt="${d}"></button>
          `).join('')}
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group"><label>${t('demon.levelId')}</label>
          <input type="text" inputmode="numeric" maxlength="12" id="demonLevelId" class="form-input" placeholder="-" autocomplete="off" value="${val('levelId')}"></div>
        <div class="form-group"><label>${t('demon.position')}</label>
          <input type="number" min="1" id="demonPos" class="form-input" max="${maxPos}" step="1" autocomplete="off" value="${defaultPos}"></div>
        <div class="form-group"><label>${t('demon.winDate')}</label>
          <input type="date" id="demonDate" class="form-input" autocomplete="off" value="${val('winDate')}"></div>
        <div class="form-group"><label>${t('demon.attempts')}</label>
          <input type="number" min="0" id="demonAtt" class="form-input" placeholder="-" autocomplete="off" value="${val('attempts')}"></div>
      </div>
      
      <div class="form-group">
        <label>${t('demon.yt')}</label>
        <input type="text" id="demonShowcase" class="form-input" spellcheck="false" placeholder="YouTube URL" autocomplete="off"
          value="${isEdit && demonData.showcase ? escapeHTML(demonData.showcase) : ''}">
      </div>`,
    actions: `
      ${isEdit ? `<button type="button" id="btnDeleteDemon" class="btn-danger push-left">${t('common.delete')}</button>` : ''}
      <button type="button" id="btnCancelDemon" class="btn-secondary">${t('common.cancel')}</button>
      <button type="button" id="btnSaveDemon" class="btn-primary">${isEdit ? t('demon.save') : t('demon.create')}</button>`
  });

  // ---- miniatura ----->
  const updateThumb = () => {
  const yt = getYouTubeThumbnail($('demonShowcase').value, 'maxresdefault');
  $('demonThumbPreview').innerHTML =
    `<img src="${yt || diffIcon(selectedDifficulty)}" alt="" class="${yt ? 'cover' : 'contain'}">`;

  const img = $('demonThumbPreview').firstChild;
  if (yt) img.onerror = () => { img.onerror = null; img.src = yt.replace('maxresdefault', 'mqdefault'); };
};

  const setDifficultyUI = (diff) => {
    selectedDifficulty = DIFFICULTY[diff] ? diff : 'Easy Demon';
    $('demonDiff').querySelectorAll('button').forEach(btn => {
      btn.classList.toggle('active-diff', btn.dataset.diff === selectedDifficulty);
    });
    updateThumb();
  };

  $('demonDiff').addEventListener('click', e => {
    const btn = e.target.closest('[data-diff]');
    if (btn) setDifficultyUI(btn.dataset.diff);
  });
  $('demonShowcase').addEventListener('input', updateThumb);

  // ---- favorito ----->
  const favBtn = $('demonFav');
  const syncFav = () => {
    favBtn.classList.toggle('active', isFav);
    favBtn.querySelector('img').src = isFav ? FAV_ICON.on : FAV_ICON.off;
  };
  favBtn.addEventListener('click', () => { isFav = !isFav; syncFav(); });

  // ---- autocompletado - backend ----->
  const nameInput = $('demonName');
  const dropdown = $('levelsAutocomplete');

  const showLevelMatches = debounce(async () => {
    const query = nameInput.value;
    if (!query.trim()) return setPop(dropdown, false);

    const matches = await searchLevels(query);
    if (nameInput.value !== query) return;
    if (matches.length === 0) return setPop(dropdown, false);

    dropdown.innerHTML = matches.map((m, i) => {
      const lv = levelToFormData(m);
      return `
        <div class="autocomplete-item json-item" data-index="${i}">
          <div class="json-name">${escapeHTML(lv.name || 'Unknown')} <span class="json-creator">by ${escapeHTML(lv.creator || 'Unknown')}</span></div>
          <div class="json-stats">${escapeHTML(lv.difficulty)}</div>
        </div>`;
    }).join('');
    setPop(dropdown, true);

    dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
      el.addEventListener('click', () => {
        const selected = matches[Number(el.dataset.index)];
        const lv = levelToFormData(selected);

        nameInput.value = lv.name;
        $('demonCreator').value = lv.creator;
        $('demonShowcase').value = selected.showcase ? `youtube.com/watch?v=${selected.showcase}` : '';
        $('demonLevelId').value = lv.levelId;
        setDifficultyUI(lv.difficulty);
        setPop(dropdown, false);
      });
    });
  }, 300);

  nameInput.addEventListener('input', () => {
    if (!nameInput.value.trim()) return setPop(dropdown, false);
    showLevelMatches();
  });

  // ---- eliminar / guardar ----->
  const refreshView = () => { renderDemons(); renderListStats(); };

  $('btnCancelDemon').addEventListener('click', () => closeModal(ov));

  if (isEdit) {
  $('btnDeleteDemon').addEventListener('click', async () => {
      if (!await showConfirm(t('demon.deleteConfirm', { name: escapeHTML(demonData.name) }), { danger: true, okText: t('common.delete') })) return;
      list.demons = list.demons.filter(d => String(d.id) !== String(demonData.id));
      saveData();
      closeModal(ov);
      refreshView();
    });
  }

  $('btnSaveDemon').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) return markInvalid(nameInput);

    const demon = normalizeDemon({
      id: isEdit ? demonData.id : undefined,
      name,
      creator: $('demonCreator').value.trim(),
      showcase: $('demonShowcase').value.trim(),
      difficulty: selectedDifficulty,
      levelId: $('demonLevelId').value.trim(),
      attempts: $('demonAtt').value,
      winDate: $('demonDate').value > maxDate ? maxDate : $('demonDate').value,
      isFavorite: isFav,
    });

    const pos = Math.min(maxPos, Math.max(1, parseInt($('demonPos').value, 10) || defaultPos));
    if (isEdit && curIdx !== -1) list.demons.splice(curIdx, 1);
    list.demons.splice(pos - 1, 0, demon);

    const moved = isEdit ? pos !== defaultPos : pos !== total + 1;
    if (moved && listFilters.sort !== 'custom') setSortMode('custom');

    saveData();
    closeModal(ov);
    refreshView();

    if (!isEdit) showAddDemonHint();

  });
  
  const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const maxDate = today.toISOString().slice(0, 10);
    $('demonDate').max = maxDate;

  syncFav();
  setDifficultyUI(selectedDifficulty);
}

/* ==== welcome.js ==== */
const WELCOME_KEY = 'mdl_welcome_seen';
const LEVELS_TOTAL = 10000;

const welcomeSeen = () => { try { return !!localStorage.getItem(WELCOME_KEY); } catch (e) { return true; } };
const markWelcomeSeen = () => { try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) {} };

function enterApp() {
  markWelcomeSeen();
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ======================================================
// 1. Renderizado de vista
// ======================================================

function renderWelcome() {
  setPageTitle();

  const I = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="12 16 16 12 12 8"/><line x1="16" y1="12" x2="5" y2="12"/>
  </svg>`;
  
  mountView(`
    <section class="welcome">
      <div class="welcome-top-pill">
        <div class="welcome-pill" style="--d:0">
          <span class="welcome-pill-dot"></span>
          <span><strong>+<span class="welcome-pill-num" >10.000</span></strong> ${t('welcome.levels')}</span>
        </div>
        <img src="resources/extreme_128.webp" alt="Extreme Demon" onError="this.style.display='none'">
      </div>

      <h1 class="welcome-title" style="--d:1">
        ${t('welcome.h1')}<br>
        <div class="welcome-title-accent"><span>Demon List </span>${svg.Trophy}</div>
      </h1>

      <p class="welcome-text" style="--d:2">${t('welcome.text')}</p>

      <div class="welcome-actions" style="--d:3">
        <button type="button" id="btnWelcomeAccount" class="btn-primary welcome-cta">${I}${t('welcome.account')}</button>
        <button type="button" id="btnWelcomeGuest" class="welcome-cta-2">${t('welcome.guest')}</button>
      </div>

      <div class="welcome-cards">
        ${[
          [svg.Search, 'f1'],
          [svg.Grid, 'f2'],
          [svg.AREDL, 'f3'],
          [svg.Palette, 'f4']
        ].map(([icon, k], i) => `
          <article class="welcome-card" style="--d:${4 + i}">
            <span class="welcome-card-icon">${icon}</span>
            <h3>${t(`welcome.${k}t`)}</h3>
            <p>${t(`welcome.${k}d`)}</p>
          </article>`).join('')}
      </div>
    </section>
  `, false);

  $('btnWelcomeGuest').addEventListener('click', enterApp);
  $('btnWelcomeAccount').addEventListener('click', openSignInModal);
}

/* ==== layout.js ==== */
const Form_URL = 'https://forms.gle/qRjqUCUfHmjcK4gx5';

// navegacion: privacy - terms
function goTo(search = '') {
  if (document.body.classList.contains('legal')) location.href = './' + search;
  else navigate(search);
}

// ======================================================
// 1. Renderizado - header
// ======================================================

function renderHeader() {
  const header = $('header');
  if (!header) return;

    header.innerHTML = `
    <div class="header-left">
      <div class="header-brand" title="My Demon List">
        <img src="resources/copes.png" alt="">
        <span>My <span style="color: var(--button)">Demon</span> List</span>
      </div>
      <nav class="header-actions">
        <button type="button" id="btnHeaderMainView" class="btn-header" title="${t('header.home')}">
          ${svg.Home}<span class="btn-label">${t('header.home')}</span>
        </button>
      </nav>
    </div>
    <nav class="header-actions" style="flex: 1; gap: 2px; align-items: center;">
      <div class="lang-wrap" data-pop-root style="margin-left: auto;">
        <button type="button" id="btnHeaderLang" class="btn-header btn-icon" title="${t('header.language')}" aria-label="${t('header.language')}" aria-haspopup="menu">
          ${svg.Lang}${svg.Wave}
        </button>
        <div id="langPop" class="pop pop-menu">
          ${LANGS.map(l => `
          <button type="button" class="pop-item ${l.id === currentLang() ? 'active' : ''}" data-lang="${l.id}">${svg['Flag_' + l.id] || ''}<span>${l.name}</span></button>
           `).join('')}
        </div>
      </div>
      <span class="header-sep" aria-hidden="true"></span>
      <button type="button" id="btnHeaderSettings" class="btn-header" title="${t('header.settings')}">
        ${svg.Configuration}
      </button>
    </nav>
    <button type="button" id="btnHeaderLogin" class="btn-header btn-link-gd ${cloudUser ? 'hd-user' : 'btn-capsule'}">
      ${cloudUser
        ? `<span class="hd-user-text"><b>${escapeHTML(profileState.username)}</b><small>${t('profile.id', { id: publicIdText() })}</small></span>
          <img class="hd-avatar" src="${escapeHTML(getAvatar())}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">`
        : `${svg.Perfil}${t('header.login')}`}
    </button>
  `;

  header.querySelector('.header-brand').addEventListener('click', () => goTo());
  $('btnHeaderMainView').addEventListener('click', () => goTo());
  $('btnHeaderSettings').addEventListener('click', () => goTo('?settings=1'));
  $('btnHeaderLang').addEventListener('click', () => setPop($('langPop'), !$('langPop').classList.contains('open')));
  $('btnHeaderLogin').addEventListener('click', () => (cloudUser ? openAccountModal() : openSignInModal()));

  $('langPop').addEventListener('click', (e) => {
  const item = e.target.closest('[data-lang]');
  if (!item) return;
  setPop($('langPop'), false);
  setLanguage(item.dataset.lang);
});
}

// ======================================================
// 2. Renderizado - footer
// ======================================================

function renderFooter() {
  const footer = $('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-card">
      <div class="footer-head">
        <div class="footer-title-group">
          <h2>
            ${svg.Globe}
            My Demon List GD
          </h2>
          <p class="footer-text" data-i18n="footer.text"></p>
        </div>

        <div class="footer-socials">
          <a href="${Form_URL}" class="social-btn" data-i18n-title="footer.reports" target="_blank" rel="noopener">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="8" x2="12" y2="14" />
              <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-info-row">
          <span class="footer-copy">© 2026 <a href="./" class="footer-site-link">My Demon List</a> <span data-i18n="footer.copy"></span> <span class="footer-devs">TheGamerlod</span></span>
        </div>

        <nav class="footer-links">
          <a href="privacy.html" data-i18n="legal.privacy"></a>
          <a href="terms.html" data-i18n="legal.terms"></a>
        </nav>
      </div>
    </div>
  `;
}

/* ==== main.js ==== */
// ======================================================
// 1. Estado global y utilidades
// ======================================================

let viewPrefs = { sort: 'custom', dragLocked: false };
let userLists = [];
const DEFAULT_PROFILE = { username: 'Player 1', avatar: '', banner: '', bannerColor: '', country: '', playerType: '', gdId: '', gdName: '', gdRank: '', bio: '' };
let profileState = { ...DEFAULT_PROFILE };

const DEFAULT_AVATAR = 'resources/avatar.jpg';
const FAV_ICON = { on: 'resources/fav_on.png', off: 'resources/fav_off.png' };
const getAvatar = () => profileState.avatar || DEFAULT_AVATAR;

// ID público
const publicIdText = () => (cloudUser && cloudPublicId) ? `#${cloudPublicId}` : '-';

// ------------------------------------------------------
// Utilidades
// ------------------------------------------------------

const $ = id => document.getElementById(id);

// Minúsculas y sin tildes, compara textos
const normalizeText = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function escapeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function debounce(fn, ms = 100) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

let toastTimer;
function showToast(msg) {
  let el = $('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

// -------------------- color modal (prueba) -------------------------------------->
function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : '';
}

function cssHex(varName, fallback = '#000000') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + [...v.slice(1)].map(c => c + c).join('');
  return fallback;
}
// ---------------------------------------------------------->

function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Filtra por relevancia: 0 exacto · 1 empieza por · 2 empieza una palabra · 3 contiene
function rankMatches(items, query, getName, limit = 10) {
  const q = normalizeText(query);
  if (!q) return [];

  const scored = [];
  items.forEach((item, i) => {
    const name = normalizeText(getName(item));
    if (!name) return;

    let score = -1;
    if (name === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.split(/[\s\-_.:]+/).some(w => w.startsWith(q))) score = 2;
    else if (name.includes(q)) score = 3;

    if (score >= 0) scored.push({ item, score, len: name.length, i });
  });

  scored.sort((a, b) => a.score - b.score || a.len - b.len || a.i - b.i);
  return scored.slice(0, limit).map(s => s.item);
}

const setPop = (el, open) => { if (el) el.classList.toggle('open', open); };

// ------------------------------------------------------
// Navegación y montaje de vistas
// ------------------------------------------------------

let viewEnterTimer;

function mountView(html, animate = true) {
  const main = $('main');
  destroySortable();
  main.innerHTML = html;

  clearTimeout(viewEnterTimer);
  main.classList.remove('view-enter');
  if (animate) {
    void main.offsetWidth;
    main.classList.add('view-enter');
    viewEnterTimer = setTimeout(() => main.classList.remove('view-enter'), 900);
  }
}

let renderedSearch = null;

function navigate(search = '') {
  const sameUrl = (location.search || '') === search;
  if (sameUrl && renderedSearch === search) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (!sameUrl) history.pushState(null, '', location.pathname + search);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setPageTitle(sub) {
  document.title = sub ? `${sub} | My Demon List` : 'My Demon List | Tu lista de demons de Geometry Dash';
}

// Estilo de banner
function bannerStyle() {
  const color = safeColor(profileState.bannerColor);
  return color ? `background-color:${color};` : '';
}

// -------------------------------------------------------------
// API · Backend (Render): autocompletado de niveles y warm-up
// -------------------------------------------------------------

const API_BASE = 'https://mdl-backend-tvpk.onrender.com';

function warmUpAPI() {
  fetch(`${API_BASE}/api/health`, { cache: 'no-store' }).catch(() => {});
}

// ======================================================
// 2. Vista principal
// ======================================================

const listThumb = l => l.image || getYouTubeThumbnail(l.demons?.[0]?.showcase, 'hqdefault');
const getMainList = () => userLists.find(l => l.isMain) || null;

function setMainList(listId) {
  userLists.forEach(l => { l.isMain = l.id === listId; });
}

// -------------------------------------------------------------
// 2.1. Hero del perfil (banner + avatar superpuesto)
// -------------------------------------------------------------

function profileBadges() {
  const out = [];
  if (profileState.playerType === 'pc') out.push(`<span class="hp-badge">${svg.pc}${t('profile.typePc')}</span>`);
  if (profileState.playerType === 'mobile') out.push(`<span class="hp-badge">${svg.mobile}${t('profile.typeMobile')}</span>`);
  if (profileState.country) out.push(`<span class="hp-badge">${svg.Pin}${escapeHTML(profileState.country)}</span>`);
  return out.join('');
}

const RANK_TIERS = [
  [1, '#ffd54a'], [10, '#ffd54a'], [100, '#aeacab'], [500, '#e0925a'], [1000, '#38bdf8'], [10000, '#4ade80'], [100000, '#d97fca'], [1000000, '#898b8b'],
];

const rankLabel = max =>
  max <= 3 ? `#${max}` : 'Top ' + (max >= 1e6 ? max / 1e6 + 'M' : max >= 1e3 ? max / 1e3 + 'K' : max);

// datos viejos
function normalizeGdRank(v) {
  const n = parseInt(v, 10) || 0;
  const tier = n ? RANK_TIERS.find(([max]) => n <= max) : null;
  return tier ? String(tier[0]) : '';
}

function renderGdRank() {
  const n = parseInt(profileState.gdRank, 10) || 0;
  const tier = n ? RANK_TIERS.find(([max]) => n <= max) : null;
  return `
    <div class="hp-gd-rank ${tier && tier[0] <= 1 ? 'podium' : ''}" style="--rank:${tier ? tier[1] : 'var(--mute)'}" title="${t('home.gdRank')}">
      <span class="hp-trophy">${svg.Trophy}</span>
      <strong>${tier ? rankLabel(tier[0]) : '-'}</strong>
    </div>`;
}

function renderHero() {
  const badges = profileBadges();
  const style = bannerStyle();

  return `
    <section class="hp-hero panel">
      <div class="hp-banner" ${style ? `style="${style}"` : ''}>
        ${profileState.banner ? `<img src="${escapeHTML(profileState.banner)}" alt="" onerror="this.remove()">` : ''}
      </div>
      <div class="hp-hero-body">
        <div class="hp-top">
          <div class="hp-avatar">
            <img src="${escapeHTML(getAvatar())}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">
          </div>
          <div class="hp-info">
            <div class="hp-name-row">
              <h1 class="hp-name">${escapeHTML(profileState.username)}</h1>
              <span class="hp-id">${t('profile.id', { id: publicIdText() })}</span>
            </div>
            ${badges ? `<div class="hp-badges">${badges}</div>` : ''}
          </div>
          <button type="button" id="btnHomeEdit" class="btn-line hp-edit">${svg.Pencil}<span>${t('profile.edit')}</span></button>
        </div>

        <div class="hp-lower">
          <div class="hp-bio-wrap">
            <span class="hp-bio-label">${t('profile.bio')}</span>
            <div class="hp-bio-box">
              <p class="hp-bio ${profileState.bio ? '' : 'empty'}">${profileState.bio ? escapeHTML(profileState.bio) : t('profile.noBio')}</p>
            </div>
          </div>
          <div class="hp-gd">
            <div class="hp-gd-head">
              <span class="hp-gd-label">${t('home.gdProfile')}</span>
              <button type="button" id="btnGdEdit" class="button-square hp-gd-edit" title="${t('gd.editTitle')}">${svg.Pencil}</button>
            </div>
            <div class="hp-gd-row">
              <div class="hp-gd-profile">
                <strong class="hp-gd-name">${escapeHTML(profileState.gdName) || '-'}</strong>
                <span class="hp-gd-id">${t('profile.id', { id: escapeHTML(profileState.gdId) || '-' })}</span>
              </div>
              ${renderGdRank()}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// -------------------------------------------------------------
// 2.2. Listas: principal + secundarias
// -------------------------------------------------------------

function listMenu(list, isMain = false) {
  const id = list.id;
  return `
    <div class="hp-menu" data-pop-root>
      <button type="button" class="hp-dots" data-menu-toggle title="${escapeHTML(t('list.edit'))}" aria-haspopup="menu">${svg.Options}</button>
      <div class="pop pop-menu hp-menu-pop">
        <button type="button" class="pop-item" data-edit-list="${id}">${t('list.edit')}</button>
        ${isMain
          ? `<button type="button" class="pop-item" data-unset-main>${t('list.unsetMain')}</button>`
          : `<button type="button" class="pop-item" data-set-main="${id}">${t('list.setMain')}</button>`}
        <button type="button" class="pop-item danger" data-delete-list="${id}">${t('common.delete')}</button>
      </div>
    </div>
  `;
}

function lastAddedDemon(demons) {
  let best = null, bestTs = 0;
  demons.forEach(d => {
    const m = /^d_(\d{13})/.exec(String(d.id));
    const ts = m ? Number(m[1]) : 0;
    if (ts > bestTs) { bestTs = ts; best = d; }
  });
  return best;
}

function formatWinDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
  if (!m) return '';
  return new Date(+m[1], +m[2] - 1, +m[3])
    .toLocaleDateString(currentLang(), { day: 'numeric', month: 'short', year: 'numeric' })
    .replace(/\./g, '');
}

const diffBar = demons => {
  if (!demons.length) return '';
  const segs = DIFFICULTIES.map(diff => {
    const n = demons.filter(d => d.difficulty === diff).length;
    return n ? `<i style="flex:${n};background:${DIFFICULTY[diff].color}"></i>` : '';
  }).join('');
  return `<div class="hp-item-bar" aria-hidden="true">${segs}</div>`;
};

const diffCounts = demons => DIFFICULTIES.map(diff => {
  const n = demons.filter(d => d.difficulty === diff).length;
  return `<div class="hp-diff-chip ${n ? '' : 'zero'}" style="${diffColorStyle(diff)}" title="${diff}">
    <img src="${DIFFICULTY[diff].icon}" alt="${diff}"><strong>${n}</strong>
  </div>`;
}).join('');

function renderMainCard(list) {
  const demons = list.demons || [];
  const top = demons[0];
  const hardest = top ? (top.name || '-') : '-';
  const img = listThumb(list);
  const hdImg = list.image ? '' : getYouTubeThumbnail(demons[0]?.showcase, 'maxresdefault');
  const last = lastAddedDemon(demons);

  const lastSlide = last ? `
    <div class="hp-rotor-slide">
      <span class="hp-main-last-label">${t('home.lastAdded')}${last.winDate ? ` <span class="hp-main-last-date">· ${escapeHTML(formatWinDate(last.winDate))}</span>` : ''}</span>
      <div class="hp-main-last-name">
        <img src="${diffIcon(last.difficulty)}" alt="${escapeHTML(last.difficulty)}" title="${escapeHTML(last.difficulty)}">
        <strong title="${escapeHTML(last.name)}">${escapeHTML(last.name)}</strong>
      </div>
    </div>` : '';
  const diffsSlide = `<div class="hp-rotor-slide hp-rotor-diffs">${diffCounts(demons)}</div>`;

  return `
    <div class="hp-main-card ${img ? 'has-bg' : ''}" data-card-list="${list.id}">
      ${listMenu(list, true)}
      ${img ? `<div class="hp-main-bg" style="background-image:url('${escapeHTML(hdImg || img)}'),url('${escapeHTML(img)}')"></div>` : ''}
      <div class="hp-main-top">
        <div class="hp-main-thumb ${img ? '' : 'empty'}">
          ${img
            ? `<img src="${escapeHTML(hdImg || img)}" alt="" loading="lazy" ${hdImg ? `onerror="this.onerror=null;this.src='${escapeHTML(img)}'"` : ''}>`
            : (top ? `<img class="contain" src="${diffIcon(top.difficulty)}" alt="">` : '')}
          ${top
            ? `<span class="hp-diff" style="${diffColorStyle(top.difficulty)}">#1 · ${escapeHTML(top.difficulty)}</span>`
            : `<span class="hp-diff-empty">${t('home.listEmpty')}</span>`}
        </div>
        <div class="hp-main-info">
          <h3 class="hp-main-title">${escapeHTML(list.title)}</h3>
          <p class="hp-main-by">${t('list.by', { name: escapeHTML(profileState.username || '') })}</p>
          <div class="hp-main-stats">
            <div class="hp-stat"><span>${t('home.demons')}</span><strong>${demons.length}</strong></div>
            <div class="hp-stat"><span>${t('home.hardest')}</span><strong class="hp-hardest" ${top ? `style="${diffColorStyle(top.difficulty)}"` : ''} title="${escapeHTML(hardest)}">${escapeHTML(hardest)}</strong></div>
          </div>
        </div>
      </div>
      <div class="hp-main-actions">
        <div class="hp-main-last ${last ? 'rotating' : ''}">
          <div class="hp-rotor-track">${last ? lastSlide + diffsSlide + lastSlide : diffsSlide}</div>
        </div>
        <button type="button" class="btn-primary hp-main-btn" data-view-list="${list.id}">${t('list.view')}</button>
      </div>
    </div>
  `;
}

function renderMainEmpty() {
  return `
    <div class="hp-empty">
      <p class="hp-empty-title">${t('home.mainEmpty')}</p>
      <p class="hp-empty-text">${t('home.mainEmptyText')}</p>
      <button type="button" class="btn-primary" data-create-main>${t('home.createMain')}</button>
    </div>
  `;
}

function renderOtherItem(list, i, n) {
  const demons = list.demons || [];
  const top = demons[0];
  const hardest = top ? (top.name || '-') : '-';
  const img = listThumb(list);

  const actions = reorderMode
    ? `<div class="hp-item-actions hp-reorder">
         <button type="button" class="hp-move" data-move-list="${list.id}" data-dir="-1" title="${t('list.moveUp')}" ${i === 0 ? 'disabled' : ''}>${svg.ArrowUp}</button>
         <button type="button" class="hp-move" data-move-list="${list.id}" data-dir="1" title="${t('list.moveDown')}" ${i === n - 1 ? 'disabled' : ''}>${svg.ArrowDown}</button>
       </div>`
    : `<div class="hp-item-actions">
         ${listMenu(list)}
         <button type="button" class="hp-view" data-view-list="${list.id}">${t('list.view')}</button>
       </div>`;

  return `
    <div class="hp-item ${img ? 'has-bg' : ''} ${reorderMode ? 'reordering' : ''}" data-card-list="${list.id}" ${top ? `style="${diffColorStyle(top.difficulty)}"` : ''}>
      ${img ? `<div class="hp-item-bg" style="background-image:url('${escapeHTML(img)}')"></div>` : ''}
      ${top
        ? `<div class="hp-item-icon"><img src="${diffIcon(top.difficulty)}" alt="${escapeHTML(top.difficulty)}" title="${escapeHTML(top.difficulty)}"></div>`
        : `<div class="hp-item-icon empty"></div>`}
      <div class="hp-item-info">
        <h4>${escapeHTML(list.title)}</h4>
        <div class="hp-item-chips">
          ${demons.length
            ? `<span class="hp-chip">${t('home.demons')}: <b>${demons.length}</b></span>
            <span class="hp-chip hp-chip-hardest" title="${escapeHTML(hardest)}">${t('home.hardest')}: <b>${escapeHTML(hardest)}</b></span>`
            : `<span class="hp-chip">${t('home.listEmpty')}</span>`}
        </div>
      </div>
      ${actions}
      ${diffBar(demons)}
    </div>
  `;
}

let rotorTimer = null;
let reorderMode = false;

function initRotor() {
  clearInterval(rotorTimer);
  const box = document.querySelector('.hp-main-last.rotating');
  if (!box) return;
  const track = box.firstElementChild;
  const card = box.closest('.hp-main-card');
  let step = 0, paused = false;

  card.addEventListener('mouseenter', () => { paused = true; });
  card.addEventListener('mouseleave', () => { paused = false; });

  track.addEventListener('transitionend', () => {
    if (step !== 2) return;
    track.style.transition = 'none';
    track.style.transform = 'translateY(0)';
    step = 0;
    void track.offsetHeight;
    track.style.transition = '';
  });

  rotorTimer = setInterval(() => {
    if (!box.isConnected) return clearInterval(rotorTimer);
    if (paused || document.hidden) return;
    step++;
    track.style.transform = `translateY(-${step * 100 / 3}%)`;
  }, 8000);
}

function markClippedDiffs() {
  document.querySelectorAll('.hp-rotor-diffs').forEach(el =>
    el.classList.toggle('clipped', el.scrollWidth > el.clientWidth + 1));
}

function renderListsCards() {
  const mainBox = $('homeMain');
  const othersBox = $('homeOthers');
  if (!mainBox || !othersBox) return;

  const main = getMainList();
  const others = userLists.filter(l => l !== main);
  if (others.length < 2) reorderMode = false;

  mainBox.innerHTML = main ? renderMainCard(main) : renderMainEmpty();
  othersBox.innerHTML = others.length
    ? others.map((l, i) => renderOtherItem(l, i, others.length)).join('')
    : `<div class="no-lists-msg">${t('lists.empty')}</div>`;

  const btn = $('btnReorder');
  if (btn) {
    btn.classList.toggle('blocked', others.length < 2);
    btn.classList.toggle('active', reorderMode);
  }

  initRotor();
  markClippedDiffs();
}

// -------------------------------------------------------------
// 2.3. Eventos de la vista principal
// -------------------------------------------------------------

const closeHomeMenus = () => document.querySelectorAll('.hp-menu-pop.open').forEach(p => p.classList.remove('open'));

function toggleHomeMenu(btn) {
  const pop = btn.nextElementSibling;
  const willOpen = !pop.classList.contains('open');
  closeHomeMenus();
  if (!willOpen) return;

  const r = btn.getBoundingClientRect();
  const h = pop.offsetHeight + 6;
  const footerTop = $('footer').getBoundingClientRect().top;
  if (r.bottom + h > footerTop && r.top - h > 0) {
    pop.style.top = 'auto';
    pop.style.bottom = `${window.innerHeight - r.top + 6}px`;
    pop.style.transformOrigin = 'bottom right';
  } else {
    pop.style.bottom = 'auto';
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.transformOrigin = 'top right';
  }
  pop.style.right = `${document.documentElement.clientWidth - r.right}px`;
  setPop(pop, true);
  window.addEventListener('scroll', closeHomeMenus, { capture: true, once: true });
}

async function deleteListFromHome(listId) {
  const list = userLists.find(l => l.id === listId);
  if (!list) return;
  if (!await showConfirm(t('listm.deleteConfirm', { title: escapeHTML(list.title) }), { danger: true, okText: t('common.delete') })) return;

  userLists = userLists.filter(l => l.id !== listId);
  saveData();
  renderListsCards();
}

function moveList(listId, dir) {
  const main = getMainList();
  const others = userLists.filter(l => l !== main);
  const i = others.findIndex(l => l.id === listId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= others.length) return;

  const a = userLists.indexOf(others[i]);
  const b = userLists.indexOf(others[j]);
  [userLists[a], userLists[b]] = [userLists[b], userLists[a]];
  userLists.forEach((l, idx) => { l.order = idx; });
  saveData();
  renderListsCards();
}

function onHomeClick(e) {
  const mv = e.target.closest('[data-move-list]');
  if (mv) return moveList(Number(mv.dataset.moveList), Number(mv.dataset.dir));
  if (reorderMode && e.target.closest('.hp-item')) return;

  const toggle = e.target.closest('[data-menu-toggle]');
  if (toggle) return toggleHomeMenu(toggle);

  const edit = e.target.closest('[data-edit-list]');
  if (edit) { closeHomeMenus(); return openEditListModal(Number(edit.dataset.editList)); }

  if (e.target.closest('[data-unset-main]')) {
    closeHomeMenus();
    setMainList(null);
    saveData();
    return renderListsCards();
  }

  const setMain = e.target.closest('[data-set-main]');
  if (setMain) {
    closeHomeMenus();
    setMainList(Number(setMain.dataset.setMain));
    saveData();
    return renderListsCards();
  }

  const del = e.target.closest('[data-delete-list]');
  if (del) { closeHomeMenus(); return deleteListFromHome(Number(del.dataset.deleteList)); }

  const view = e.target.closest('[data-view-list]');
  if (view) return navigate(`?list=${view.dataset.viewList}`);

  const card = e.target.closest('[data-card-list]');
  if (card && !e.target.closest('.hp-menu')) {
    if (document.querySelector('.hp-menu-pop.open')) return closeHomeMenus();
    const sel = window.getSelection();
    if (String(sel) && card.contains(sel.anchorNode)) return;
    return navigate(`?list=${card.dataset.cardList}`);
  }

  if (e.target.closest('[data-create-main]')) openListModal(null, true);
}

// -------------------------------------------------------------
// 2.4. Render de la vista
// -------------------------------------------------------------

function renderMainPage(animate = true) {
  if (!$('main')) return;
  setPageTitle();

  reorderMode = false;

  mountView(`
    <div class="home" id="home">
      ${renderHero()}

      <div class="hp-grid">
        <section class="hp-col">
          <div class="hp-section-head">
            <h2 class="hp-title">${t('home.main')}</h2>
          </div>
          <div id="homeMain"></div>
        </section>

        <section class="hp-col">
          <div class="hp-section-head">
            <h2 class="hp-title">${t('home.others')}</h2>
            <div class="hp-head-actions">
              <button type="button" id="btnReorder" class="button-square toggle" title="${t('lists.reorder')}">${svg.Reorder}</button>
              <button type="button" id="btnAddList" class="btn-primary">${t('lists.add')}</button>
            </div>
          </div>
          <div class="hp-others-box" id="homeOthers"></div>
        </section>
      </div>
    </div>
  `, animate);

  $('btnHomeEdit').addEventListener('click', openEditProfileModal);
  $('btnAddList').addEventListener('click', openAddListModal);
  $('home').addEventListener('click', onHomeClick);
  $('btnGdEdit').addEventListener('click', openEditGdModal);
  $('btnReorder').addEventListener('click', () => {
    if (userLists.filter(l => l !== getMainList()).length < 2) return showToast(t('lists.needTwo'));
    reorderMode = !reorderMode;
    renderListsCards();
  });

  renderListsCards();
}

window.addEventListener('resize', debounce(markClippedDiffs, 150));

/* ==== init.js ==== */
// ------------------------------------------------------
// Inicio y ciclo de vida
// ------------------------------------------------------

function renderRoute() {
  if (document.body.classList.contains('legal')) {
    if (typeof applyLegalLanguage === 'function') applyLegalLanguage();
    return;
  }
  renderedSearch = location.search || '';

  const params = new URLSearchParams(location.search);
  const listId = params.get('list');
  const isWelcome = !params.get('settings') && !listId && !welcomeSeen() && !cloudUser;

  const settingsBtn = $('btnHeaderSettings');
  const HomeBtn = $('btnHeaderMainView');
  if (settingsBtn) settingsBtn.disabled = isWelcome;
  if (HomeBtn) HomeBtn.disabled = isWelcome;

  if (params.get('settings')) openSettingsView();
  else if (listId) openListView(Number(listId));
  else if (isWelcome) renderWelcome();
  else renderMainPage();
}

function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'btnScrollTop';
  btn.type = 'button';
  btn.className = 'scroll-top-btn';
  btn.title = t('view.top');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 200), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initGlobalListeners() {
  window.addEventListener('popstate', () => {
    if (skipPops > 0) { skipPops--; if (!skipPops) flushModalPush(); return; }
    const modal = topModal();
    if (modal) {
      if (modal.dataset.dismissible) closeModal(modal, true);
      else history.pushState({ modal: true }, '');
      return;
    }
    renderRoute();
  });

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.pop.open').forEach(pop => {
      const root = pop.closest('[data-pop-root]');
      if (!root || !root.contains(e.target)) pop.classList.remove('open');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = topModal();
    if (modal) {
      if (modal.dataset.dismissible) closeModal(modal);
    } else {
      document.querySelectorAll('.pop.open').forEach(pop => pop.classList.remove('open'));
      document.querySelector('.list-view.stats-open')?.classList.remove('stats-open');
    }
  });
}

const hasSession = () =>
  Object.keys(localStorage).some(k => /^sb-.+-auth-token$/.test(k)) ||
  /access_token|[?&]code=/.test(location.hash + location.search);

function paintAll() {
  applyAppearance();
  applyLanguage();
  renderHeader();
  renderRoute();
}

function init() {
  loadData();
  applyAppearance();
  initScrollTop();
  initGlobalListeners();
  renderFooter();
  warmUpAPI();
  if (hasSession()) markWelcomeSeen();

  if (!hasSession()) return paintAll();

  document.body.classList.add('booting');
  let painted = false;
  const reveal = () => {
    paintAll();
    document.body.classList.remove('booting');
    if (!painted && cloudUser && !cloudReady) showAlert(t('acc.error'));
    painted = true;
  };
  cloudStart().catch(e => console.error('cloudStart', e)).then(reveal);
  setTimeout(() => { if (!painted && !cloudAwaitingUser) reveal(); }, 8000);
}

function initLegal() {
  loadData();
  applyAppearance();
  initGlobalListeners();
  renderFooter();

  const paint = () => {
    applyAppearance();
    applyLanguage();
    renderHeader();
  };
  paint();
  if (hasSession()) cloudStart().catch(e => console.error('cloudStart', e)).then(paint);
}

document.addEventListener('DOMContentLoaded', () =>
  document.body.classList.contains('legal') ? initLegal() : init());