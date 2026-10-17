// ======================================================
// Ajustes: temas, fondo, idioma y datos locales -- es basico
// ======================================================

const THEMES = ['blue', 'white', 'dark', 'purple', 'infernal', 'discord', 'atardecer', 'neon', 'bosque', 'rosa', 'rosa-dark', 'halloween'];

const DEFAULT_APP_SETTINGS = {
  theme: 'blue',
  bgColor: '',
  bgImage: '',
  lang: (navigator.language || 'en').toLowerCase().startsWith('en') ? 'en' : 'es'
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

  const main = $('main');
  if (!main) return;
  main.style.backgroundColor = appSettings.bgColor || '';
  main.style.backgroundImage = appSettings.bgImage ? `url("${appSettings.bgImage}")` : '';
  // con fondo propio se oculta el fondo animado del tema (main.css)
  main.toggleAttribute('data-custom-bg', !!(appSettings.bgColor || appSettings.bgImage));
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
  if (!await showConfirm(t('settings.deleteConfirm'), { danger: true })) return;
  const word = await showPrompt(t('settings.deletePrompt'));
  if ((word || '').trim().toUpperCase() !== t('settings.deleteWord')) return;

  localStorage.removeItem(STORAGE_KEY);
  location.href = location.pathname;
}

function exportAllData() {
  downloadJSON(`mdl_backup_${new Date().toISOString().slice(0, 10)}.json`, buildSnapshot());
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

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (e) {
      return showAlert(t('settings.importTooBig'));
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
        <h2 class="settings-title">${t('settings.bg')}</h2>
        <div class="settings-bg-body">
          <div class="bg-preview" id="bgPreview"></div>
          <div class="settings-bg-controls">
            <div class="settings-row">
              <button type="button" id="btnBgUpload" class="btn-header">${t('settings.upload')}</button>
              <button type="button" id="btnBgRemove" class="btn-header">${t('settings.removeImg')}</button>
              <input type="file" id="fileBg" accept="image/*" hidden>
            </div>
            <div class="settings-row">
              <label for="bgColorInput" class="settings-hint">${t('settings.bgColor')}</label>
              <input type="color" id="bgColorInput" class="color-input">
              <button type="button" id="btnBgColorReset" class="btn-header">${t('settings.bgColorReset')}</button>
            </div>
            <p class="settings-hint">${t('settings.bgHint')}</p>
          </div>
        </div>
      </section>

      <section class="settings-section panel" style="--i:2">
        <h2 class="settings-title">${t('settings.data')}</h2>
        <p class="settings-hint">${t('settings.dataHint')}</p>
        <div class="settings-row">
          <button type="button" id="btnExportAll" class="btn-header">${t('settings.export')}</button>
          <button type="button" id="btnImportAll" class="btn-header">${t('settings.import')}</button>
          <input type="file" id="fileImportAll" accept=".json,application/json" hidden>
        </div>
        <div class="settings-row">
          <button type="button" id="btnDeleteAll" class="btn-danger">${t('settings.deleteAll')}</button>
        </div>
      </section>
    </div>
  `);

  const colorInput = $('bgColorInput');

  const refreshThemeCards = () => {
    document.querySelectorAll('#themeGrid .theme-card').forEach(card => {
      card.classList.toggle('active', card.dataset.themeId === appSettings.theme);
    });
  };

  const refreshBg = () => {
    const preview = $('bgPreview');
    preview.style.backgroundColor = appSettings.bgColor || '';
    preview.style.backgroundImage = appSettings.bgImage ? `url("${appSettings.bgImage}")` : '';
    preview.style.backgroundSize = appSettings.bgImage ? 'cover' : '';
    colorInput.value = appSettings.bgColor || cssHex('--bg', '#101011');
    $('btnBgRemove').disabled = !appSettings.bgImage;
    $('btnBgColorReset').disabled = !appSettings.bgColor;
  };

  // ---- Tema ----->
  $('themeGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.theme-card');
    if (!card) return;
    appSettings.theme = card.dataset.themeId;
    applyAppearance(true);
    saveData();
    refreshThemeCards();
    refreshBg();
  });

  // ---- Fondo ----->
  $('btnBgUpload').addEventListener('click', () => $('fileBg').click());

  $('fileBg').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const img = await readImageFile(file, { maxSize: 1600, quality: 0.8 });
    if (!img) return;

    const prev = appSettings.bgImage;
    appSettings.bgImage = img;
    if (!saveData()) appSettings.bgImage = prev;
    applyAppearance();
    refreshBg();
  });

  $('btnBgRemove').addEventListener('click', () => {
    appSettings.bgImage = '';
    saveData();
    applyAppearance();
    refreshBg();
  });

  colorInput.addEventListener('input', () => {
    appSettings.bgColor = colorInput.value;
    applyAppearance();
    refreshBg();
  });
  colorInput.addEventListener('change', saveData);

  $('btnBgColorReset').addEventListener('click', () => {
    appSettings.bgColor = '';
    saveData();
    applyAppearance();
    refreshBg();
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
  refreshBg();
}
