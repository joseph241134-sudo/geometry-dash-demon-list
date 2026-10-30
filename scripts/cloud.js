const SUPABASE_URL = 'https://sxsxxjdwvmfrrmggggcd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_KCu1CyH-A5dIllXIB2SoDg_udx8YibQ';

const cloud = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let cloudUser = null;
let cloudReady = false;
let cloudTimer = null;
let cloudBusy = false;
let cloudDirty = false;

const cloudLast = new Map();

function cloudSplit() {
  const { userLists: lists, ...profile } = buildSnapshot();
  const { lang, ...settings } = profile.appSettings;
  profile.appSettings = settings;
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
    cloud.from('profiles').select('data').maybeSingle(),
    cloud.from('lists').select('data')
  ]);
  if (p.error || l.error) return null;
  return { profile: p.data?.data ?? null, lists: l.data.map(r => r.data).sort((a, b) => a.id - b.id) };
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
  } finally { cloudBusy = false; }
}

// Baja de la nube: 'ok' | 'empty' | 'error'
async function cloudPull() {
  const remote = await cloudFetch();
  if (!remote) return 'error';
  if (!remote.profile && !remote.lists.length) return 'empty';

  const lang = appSettings.lang;
  
  applySnapshot({ ...(remote.profile || {}), userLists: remote.lists });
  appSettings.lang = lang;
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
  l.title === DEFAULT_LIST_TITLE && !l.demons.length && !l.image && !l.isFavorite;

function localHasData() {
  return userLists.some(l => !isPristineList(l))
    || Object.values(profileStats).some(v => v)
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
      if (!replace) { await cloudSignOut(true); return null; }   // conserva los datos locales
    }
  }

  const res = await cloudPull();
  let synced = res === 'ok';
  if (res === 'empty') synced = await cloudPush();
  cloudReady = res !== 'error';
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
  try { sessionStorage.removeItem('mdl_welcome_seen'); } catch (e) {}
  location.replace(location.pathname);
}

function cloudScheduleSync() {
  if (!cloudUser || !cloudReady) return;
  clearTimeout(cloudTimer);
  cloudTimer = setTimeout(cloudPush, 1500);
}

const IMG_BUCKET = 'images';

// Sube una imagen (dataURL) y devuelve su URL pública, o null si falla
async function cloudStoreImage(dataUrl) {
  try {
    if (/^data:image\/svg/i.test(dataUrl)) return null;
    const blob = await (await fetch(dataUrl)).blob();
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

// Borra de Storage las imágenes que ya no usa nada (solo las de más de 1 día)
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