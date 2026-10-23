// ======================================================
// 1. Manejo de Local Storage
// ------------------------------------------------------
// Todo lo que se guarda vive en un solo objeto (STORAGE_KEY).
// Para persistir algo nuevo:
//   1) agrégalo en buildSnapshot()   (guardar)
//   2) agrégalo en applySnapshot()   (cargar)
//   3) llama a saveData()
// ======================================================

const STORAGE_KEY = 'mdl_app_data';
const STORAGE_VERSION = 2;

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
    tier: demon.tier ?? '',
    attempts: demon.attempts ?? '',
    winDate: demon.winDate || '',
    isFavorite: !!demon.isFavorite,
    useDefaultIcon: !!demon.useDefaultIcon,
  };
}

function normalizeList(list) {
  return {
    ...list,
    id: Number(list.id) || Date.now(),
    title: list.title || 'Sin título',
    isFavorite: !!list.isFavorite,
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
    profileStats,
    profileState,
    userLists,
    filterFavoritesOnly,
    viewPrefs,
    appSettings
  };
}

function applySnapshot(data) {
  // gdProfileData = formato de versiones anteriores (mismos nombres de campo)
  profileStats = normalizeStats({ ...(data.gdProfileData || {}), ...(data.profileStats || {}) });
  profileState = { ...profileState, ...(data.profileState || {}) };
  if (Array.isArray(data.userLists)) userLists = data.userLists.map(normalizeList);
  filterFavoritesOnly = !!data.filterFavoritesOnly;
  viewPrefs = { ...viewPrefs, ...(data.viewPrefs || {}) };
  appSettings = { ...DEFAULT_APP_SETTINGS, ...(data.appSettings || {}) };
  delete appSettings.bgColor;

  profileState.avatar = safeImg(profileState.avatar);
  profileState.banner = safeImg(profileState.banner);
  appSettings.bgImage = safeImg(appSettings.bgImage)
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
  return { version: STORAGE_VERSION, filterFavoritesOnly, viewPrefs, appSettings: { ...appSettings, bgImage: '' } };
}

function saveLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudUser && cloudReady ? basicSnapshot() : buildSnapshot()));
}

function resetData() {
  profileStats = normalizeStats({});
  profileState = { username: 'Player 1', avatar: '', banner: '', bannerColor: '', country: '' };
  userLists = [];
  filterFavoritesOnly = false;
  viewPrefs = { sort: 'custom', dragLocked: false };
  appSettings = { ...DEFAULT_APP_SETTINGS };
}

// ------------------------------------------------------
// Imágenes
// ------------------------------------------------------

async function readImageFile(file, opts) {
  const data = await readImageFileRaw(file, opts);
  if (!data || !cloudUser || !cloudReady) return data;     // sin sesión: base64 como antes
  const url = await cloudStoreImage(data);
  if (!url) { showAlert(t('acc.error')); return null; }
  return url;
}

function readImageFileRaw(file, opts = 1280) {
  const { maxSize = 1280, quality = 0.86 } = typeof opts === 'number' ? { maxSize: opts } : opts;

  return new Promise((resolve) => {
    if (!file) return resolve(null);

    const readPlain = () => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.onerror = () => resolve(null);
      r.readAsDataURL(file);
    };

    // GIF, SVG y archivos que no son imagen
    if (!/^image\//.test(file.type) || /gif|svg/.test(file.type)) return readPlain();

    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth, h = img.naturalHeight;
      const scale = Math.min(1, maxSize / Math.max(w, h));
      if (scale >= 1 && file.size < 350 * 1024) return readPlain();

      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(w * scale));
      c.height = Math.max(1, Math.round(h * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);

      try {
        resolve(c.toDataURL(file.type === 'image/png' ? 'image/webp' : 'image/jpeg', quality));
      } catch (e) {
        readPlain();
      }
    };

    img.onerror = () => { URL.revokeObjectURL(url); readPlain(); };
    img.src = url;
  });
}