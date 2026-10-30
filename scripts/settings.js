// ======================================================
// Ajustes: temas, fondo, idioma y datos locales -- es basico
// ======================================================

const THEMES = ['blue', 'purple', 'dark', 'atardecer', 'neon', 'rosa-dark', 'bosque','halloween'];

const DEFAULT_APP_SETTINGS = {
  theme: 'blue',
  lang: (l => I18N[l] ? l : 'en')((navigator.language || 'en').slice(0, 2).toLowerCase())
};
let appSettings = { ...DEFAULT_APP_SETTINGS };

// ------------------------------------------------------
// Apariencia: tema, color e imagen de fondo
// ------------------------------------------------------

function applyAppearance(fade = false) {
  const root = document.documentElement;
  const theme = THEMES.includes(appSettings.theme) ? appSettings.theme : DEFAULT_APP_SETTINGS.theme;

  // transición suave de colores solo al cambiar de tema
  if (fade) {
    root.classList.add('theme-fade');
    setTimeout(() => root.classList.remove('theme-fade'), 450);
  }
  root.setAttribute('data-theme', theme);
}

// ------------------------------------------------------
// Idioma
// ------------------------------------------------------

function setLanguage(lang) {
  if (!I18N[lang] || lang === appSettings.lang) return;
  appSettings.lang = lang;
  saveData();
  applyLanguage();
  renderHeader();
  renderRoute();
}

// ------------------------------------------------------
// Datos locales: todo vive en localStorage
// ------------------------------------------------------

async function deleteAllData() {
  if (cloudUser && !cloudReady) return showAlert(t('acc.error'));
  if (!await showConfirm(t(cloudUser ? 'settings.deleteConfirmCloud' : 'settings.deleteConfirm'), { danger: true })) return;
  const word = await showPrompt(t('settings.deletePrompt'));
  if ((word || '').trim().toUpperCase() !== t('settings.deleteWord')) return;

  resetData();
  localStorage.removeItem(STORAGE_KEY);
  if (cloudUser && !await cloudPush()) return showAlert(t('acc.error'));   // borra listas + resetea perfil
  location.href = location.pathname;
}

async function exportAllData() {
  let snap = buildSnapshot();
  if (cloudUser) {
    const remote = await cloudFetch();                                      // exporta lo que hay en la nube
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
      if (!await cloudPush()) return showAlert(t('acc.error'));            // sube perfil/listas y borra las que no estén
      saveLocal();
    } else {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); }
      catch (e) { return showAlert(t('settings.importTooBig')); }
    }
    location.href = location.pathname;
  };
  reader.readAsText(file);
}

// ------------------------------------------------------
// Vista de ajustes
// ------------------------------------------------------

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
