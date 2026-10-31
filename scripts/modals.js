// ======================================================
// 1. Sistema base de modales
// ======================================================

function topModal() {
  const all = $('modalContainer').querySelectorAll('.modal-overlay:not(.closing)');
  return all[all.length - 1] || null;
}

let skipPops = 0;
function openModal({ title = '', titleExtra = '', body = '', actions = '', cls = '', dismissible = true, onClose = null }) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.dataset.dismissible = dismissible ? '1' : '';
  overlay._onClose = onClose;
  overlay._hasHistory = true;
  history.pushState({ modal: true }, '');
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

// ---- Piezas reutilizables de formularios ----->

// Conecta un <input type=file> oculto: al elegir una imagen la reduce y llama onChange(dataURL)
function bindFileInput(file, opts, onChange) {
  $(file).addEventListener('change', async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    const data = await readImageFile(f, opts);
    if (data) onChange(data);
  });
}

function bindImagePicker({ upload, remove, file, opts }, onChange) {
  $(upload).addEventListener('click', () => $(file).click());
  $(remove).addEventListener('click', () => onChange(''));
  bindFileInput(file, opts, onChange);
}

const previewBox = (id, imgId) => `
  <div class="list-preview-wrap">
    <div class="list-preview-container" id="${id}">
      <img id="${imgId}" alt="">
      <span class="preview-empty">${t('common.noPhoto')}</span>
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
// ------------------------------------------------------
// Cuadro de saturación/brillo + barra de tono + muestra con el hex y botón restablecer.
// openColorModal({ value, fallback, onApply })  →  onApply('#rrggbb') o onApply('') al restablecer
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

        <div class="form-group position-relative" data-pop-root>
          <label>${t('profile.country')}</label>
          <input type="text" id="editCountry" class="form-input" spellcheck="false" autocomplete="off" placeholder="${t('profile.countryPh')}" value="${escapeHTML(profileState.country || '')}">
          <div id="countryPop" class="pop autocomplete-dropdown drop-up"  style="margin-bottom: -20px"></div>
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
  };

  // ---- archivos ----->
  bindFileInput('fileAvatar', 512, data => { avatar = data; sync(); });
  bindFileInput('fileBanner', 1280, data => { banner = data; sync(); });

  // ---- banner ----->
  $('btnBannerEdit').addEventListener('click', () => setPop($('bannerPop'), !$('bannerPop').classList.contains('open')));

  $('bannerPop').addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item || item.disabled) return;
    setPop($('bannerPop'), false);

    if (item.dataset.act === 'upload') $('fileBanner').click();
    else if (item.dataset.act === 'remove') { banner = ''; sync(); }
    else openColorModal({
      value: bannerColor,
      fallback: cssHex('--panel-banner', '#ffffff'),
      onApply: color => { bannerColor = color; sync(); }
    });
  });

  // ---- avatar ----->
  $('btnAvatarEdit').addEventListener('click', () => setPop($('avatarPop'), !$('avatarPop').classList.contains('open')));

  $('avatarPop').addEventListener('click', (e) => {
    const item = e.target.closest('[data-act]');
    if (!item || item.disabled) return;
    setPop($('avatarPop'), false);

    if (item.dataset.act === 'upload') $('fileAvatar').click();
    else { avatar = ''; sync(); }
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

    const prev = { ...profileState };
    Object.assign(profileState, { username: name, avatar, banner, bannerColor, country });
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
    body: `<p class="dialog-text" style="white-space: normal; word-break: break-word">${escapeHTML(text)}</p>`,
    actions: `<button type="button" class="btn-primary" data-ok>${t('common.ok')}</button>`
  });
  ov.querySelector('[data-ok]').addEventListener('click', () => closeModal(ov));
}

function openLoginModal() {
  const ov = openModal({
    title: t('sync.title'),
    titleExtra: `<button type="button" id="btnLoginInfo" class="btn-info-icon" title="${escapeHTML(t('sync.infoBtn'))}">${svg.Info}</button>`,
    cls: 'modal-sm',
    body: `
      <div class="form-group">
        <label>${t('sync.user')}</label>
        <input type="text" id="loginInput" class="form-input" placeholder="robtop - id" spellcheck="false" autocomplete="off">
      </div>
      <div id="loginMsg" class="modal-hint"></div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnCancelLogin">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnLogin">${t('sync.submit')}</button>`
  });

  $('btnLoginInfo').addEventListener('click', () => showInfoModal(t('sync.infoTitle'), t('sync.infoText')));
  $('btnCancelLogin').addEventListener('click', () => closeModal(ov));
  $('loginInput').addEventListener('input', () => { $('loginMsg').textContent = ''; });
  // sin funcionalidad
  $('btnLogin').addEventListener('click', () => { $('loginMsg').textContent = t('sync.soon'); });
}

// Cuenta de sincronización: inicio de sesión con Google (Supabase)
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
    body: `<p class="dialog-text">${t('acc.logged', { email: escapeHTML(cloudUser.email) })}</p>
           <div id="accMsg" class="error-msg"></div>`,
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

// Mini modal de stat
function openStatModal(field) {
  const item = STAT_ITEMS.find(s => s[1] === field);
  if (!item) return;

  const ov = openModal({
    title: t(item[2]),
    cls: 'modal-sm',
    body: `
      <div class="form-group">
        <label>${t('stats.value')}</label>
        <input type="number" id="statInput" class="form-input" min="0" max="${STAT_MAX}" step="1" inputmode="numeric" autocomplete="off" value="${Number(profileStats[field]) || 0}">
      </div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnCancelStat">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnSaveStat">${t('common.save')}</button>`
  });

  const input = $('statInput');
  if (window.matchMedia('(hover: hover)').matches) { input.focus({ preventScroll: true }); input.select(); }

  $('btnCancelStat').addEventListener('click', () => closeModal(ov));
  submitOnEnter(input, $('btnSaveStat'));

  $('btnSaveStat').addEventListener('click', () => {
    const raw = input.value.trim();
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n < 0 || n > STAT_MAX) return markInvalid(input);

    const prev = profileStats[field];
    profileStats[field] = Math.floor(n);
    if (!saveData()) { profileStats[field] = prev; return; }

    closeModal(ov);
    renderStatsPanel();
  });
}

// ======================================================
// 5. Modal - Agregar / editar lista
// ======================================================

function openListModal(listId = null) {
  const isEditing = listId !== null;
  const list = isEditing ? userLists.find(item => item.id === listId) : null;
  if (isEditing && !list) return;

  let isFav = list ? !!list.isFavorite : false;
  let image = list ? (list.image || '') : '';

  const ov = openModal({
    title: isEditing ? t('listm.edit') : t('listm.new'),
    cls: 'modal-list',
    titleExtra: `<button type="button" id="favToggle" class="btn-fav-icon" title="${t('listm.favTitle')}"><img alt=""></button>
                <div class="sort-wrap options-modal" data-pop-root>
                  <button type="button" id="btnOptionsList" class="btn-options-icon" title="options">${svg.Options}</button>
                  <div class="pop pop-menu" id="optionsListMenu">
                     <button type="button" class="pop-item" data-act="import">${t('listm.import')}</button>
                     <button type="button" class="pop-item" data-act="export" ${!isEditing ? 'disabled' : ''}>${t('listm.export')}</button>
                     <input type="file" id="fileImportJSON" accept=".json" hidden>
                  </div>
                </div>`,
    body: `
      <div class="form-group">
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
      ${isEditing ? `<button type="button" id="btnDeleteList" class="btn-danger push-left">${t('common.delete')}</button>` : ''}
      <button type="button" id="btnCancelListModal" class="btn-secondary">${t('common.cancel')}</button>
      <button type="button" id="btnSaveListModal" class="btn-primary">${isEditing ? t('listm.saveChanges') : t('listm.create')}</button>`
  });

  // ---- favorito ----->
  const favBtn = $('favToggle');
  const syncFav = () => {
    favBtn.classList.toggle('active', isFav);
    favBtn.querySelector('img').src = isFav ? FAV_ICON.on : FAV_ICON.off;
  };
  favBtn.addEventListener('click', () => { isFav = !isFav; syncFav(); });

  // ---- imagen ----->
  const syncImage = () => {
    $('listImgBox').classList.toggle('has-img', !!image);
    if (image) $('listImgPreview').src = image; else $('listImgPreview').removeAttribute('src');
    $('listImgBoxRemove').disabled = !image;
  };
 bindFileInput('fileListImg', { maxSize: 800, quality: 0.86 }, data => { image = data; syncImage(); });

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
      downloadJSON(`${list.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`, list);
    }
  });

  // ---- logica importar ----->
  $('fileImportJSON').addEventListener('change', (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      let data;
      try {
        data = JSON.parse(event.target.result);
      } catch (err) {
        return showAlert(t('listm.importErr'));
      }
      if (!data || !data.title || !Array.isArray(data.demons)) return showAlert(t('listm.invalidFile'));

      if (isEditing) {
        if (!await showConfirm(t('listm.replaceConfirm'), { danger: true })) return;
        list.demons = data.demons.map(normalizeDemon);
      } else {
        userLists.push(normalizeList({ ...data, id: Date.now(), author: profileState.username }));
      }

      if (!saveData()) return;
      closeModal(ov);
      renderListsCards();
      showAlert(t('listm.importOk'));
    };
    reader.readAsText(file);
  });

  // ---- eliminar / guardar ----->
  $('btnCancelListModal').addEventListener('click', () => closeModal(ov));

  if (isEditing) {
    $('btnDeleteList').addEventListener('click', async () => {
      if (!await showConfirm(t('listm.deleteConfirm', { title: escapeHTML(list.title) }), { danger: true, okText: t('common.delete') })) return;
      userLists = userLists.filter(item => item.id !== listId);
      saveData();
      closeModal(ov);
      renderListsCards();
    });
  }

  submitOnEnter($('editListTitle'), $('btnSaveListModal'));

  $('btnSaveListModal').addEventListener('click', () => {
    const title = $('editListTitle').value.trim();
    if (!title) return markInvalid($('editListTitle'));

    if (isEditing) {
      Object.assign(list, { title, image, isFavorite: isFav });
    } else {
      userLists.push(normalizeList({
        id: Date.now(), title, image, isFavorite: isFav,
        author: profileState.username, demons: []
      }));
    }

    saveData();
    closeModal(ov);
    renderListsCards();
  });

  syncFav();
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
      winDate: $('demonDate').value,
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

  syncFav();
  setDifficultyUI(selectedDifficulty);
}