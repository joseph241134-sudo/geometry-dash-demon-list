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

// ------------------------------------------------------
// Normalización
// ------------------------------------------------------

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

// Pasos de migracion
function migrateData(parsed) {
  return parsed;
}

// ------------------------------------------------------
// Snapshot: guardado - restaurado
// ------------------------------------------------------

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

// ------------------------------------------------------
// Cargar / Guardar
// ------------------------------------------------------

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

// ------------------------------------------------------
// Imágenes
// ------------------------------------------------------

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

    // GIF, SVG y archivos que no son imagen: sin tocar
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
  if (!cloudUser || !cloudReady) return blobToDataURL(blob);   // sin sesión: base64 como antes
  const url = await cloudStoreImage(blob);
  if (!url) { showAlert(t('acc.error')); return null; }
  return url;
}