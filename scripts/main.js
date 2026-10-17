// main.js
// ======================================================
// Estado global, utilidades, header y vista principal
// ======================================================

let profileStats = { demons: 0, moons: 0, diamonds: 0, stars: 0, userCoins: 0, coins: 0 };
let viewPrefs = { sort: 'custom', dragLocked: false };
let userLists = [];
let filterFavoritesOnly = false;
let profileState = { username: 'Player 1', avatar: '', banner: '', bannerColor: '', country: '' };

const DEFAULT_AVATAR = 'resources/avatar.jpg';
const FAV_ICON = { on: 'resources/fav_on.png', off: 'resources/fav_off.png' };
const getAvatar = () => profileState.avatar || DEFAULT_AVATAR;

// ------------------------------------------------------
// Iconos SVG
// ------------------------------------------------------

const svgConfiguration = `
<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  <circle cx="12" cy="12" r="2" />
</svg>`;

const svgHome = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
  <polyline points="9 22 9 12 15 12 15 22"></polyline>
</svg>`;

const svgGlobe = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="2" y1="12" x2="22" y2="12"></line>
  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
</svg>`;

const svgInfo = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <line x1="12" y1="16" x2="12" y2="12"></line>
  <line x1="12" y1="8" x2="12.01" y2="8"></line>
</svg>`;

const svgOptions = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="5" r="2" fill="currentColor"/>
  <circle cx="12" cy="12" r="2" fill="currentColor"/>
  <circle cx="12" cy="19" r="2" fill="currentColor"/>
</svg>
`
const svgPencil = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`;
const svgPin = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`;

const svgFilter = `
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
    <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
    <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
    <line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line>
    <line x1="17" y1="16" x2="23" y2="16"></line>
  </svg>`;

const svgSearch = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="10" cy="10" r="6"></circle><line x1="21" y1="21" x2="15" y2="15"></line>
  </svg>`;

const svgPerfil = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2A5 5 0 1 0 12 12A5 5 0 0 0 12 2ZM4 19C4 15.686 7.582 13 12 13C16.418 13 20 15.686 20 19C20 20.105 19.105 21 18 21H6C4.895 21 4 20.105 4 19Z" />
  </svg>
`
// ------------------------------------------------------
// Utilidades
// ------------------------------------------------------

const $ = id => document.getElementById(id);
const fmtNum = n => (n === undefined || n === null || n === '') ? '-' : (Number(n) || 0).toLocaleString();

// Minúsculas y sin tildes, compara textos
const normalizeText = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

function escapeHTML(str) {
  if (!str) return '';
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

// Devuelve el color si es un #hex válido, si no ''
function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : '';
}

// Lee una variable CSS del tema actual como #rrggbb (para <input type="color">)
function cssHex(varName, fallback = '#000000') {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v;
  if (/^#[0-9a-f]{3}$/i.test(v)) return '#' + [...v.slice(1)].map(c => c + c).join('');
  return fallback;
}

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

// Filtra y ordena por relevancia: 0 exacto · 1 empieza por · 2 empieza una palabra · 3 contiene
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

// Abre/cierra cualquier pop (init.js)
const setPop = (el, open) => { if (el) el.classList.toggle('open', open); };

// ------------------------------------------------------
// Navegación y montaje de vistas
// ------------------------------------------------------

let viewEnterTimer;

// Reemplaza el contenido de <main>. animate=false para repintar sin animación de entrada
function mountView(html, animate = true) {
  const main = $('main');
  destroySortable();
  main.innerHTML = html;

  clearTimeout(viewEnterTimer);
  main.classList.remove('view-enter');
  if (animate) {
    void main.offsetWidth; // reinicia la animación
    main.classList.add('view-enter');
    viewEnterTimer = setTimeout(() => main.classList.remove('view-enter'), 900);
  }
}

// navigate('') = inicio · navigate('?list=3') · navigate('?settings=1')
function navigate(search = '') {
  history.pushState(null, '', location.pathname + search);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setPageTitle(sub) {
  document.title = sub ? `${sub} | My Demon List` : t('meta.title');
}

// Estilo del banner (imagen o color)
function bannerStyle() {
  const color = safeColor(profileState.bannerColor);
  return color ? `background-color:${color};` : '';
}

// -------------------------------------------------------------
// API
//  · Backend (Render): autocompletado de niveles (/api/levels) y warm-up
//  · Perfil de GD: se pide desde el navegador a GDBrowser (cada usuario usa su propia IP)
// -------------------------------------------------------------

const API_BASE = 'https://mdl-backend-tvpk.onrender.com';

function warmUpAPI() {
  fetch(`${API_BASE}/api/health`, { cache: 'no-store' }).catch(() => {});
}


// -------------------------------------------------------------
// 1. Header
// -------------------------------------------------------------

function renderHeader() {
  const header = $('header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-left">
      <div class="header-brand" title="${t('header.homeTitle')}">
        <img src="resources/cube.png" alt="">
        <span>My Demon List</span>
      </div>
      <nav class="header-actions">
        <button type="button" id="btnHeaderMainView" class="btn-header" title="${t('header.home')}">
          ${svgHome}<span class="btn-label">${t('header.home')}</span>
        </button>
        <button type="button" id="btnHeaderSettings" class="btn-header" title="${t('header.settings')}">
          ${svgConfiguration}<span class="btn-label">${t('header.settings')}</span>
        </button>
        <div class="lang-wrap" data-pop-root>
          <button type="button" id="btnHeaderLang" class="btn-header btn-icon" title="${t('header.language')}" aria-label="${t('header.language')}" aria-haspopup="menu">
            ${svgGlobe}
          </button>
          <div id="langPop" class="pop pop-menu">
            ${LANGS.map(l => `
              <button type="button" class="pop-item ${l.id === currentLang() ? 'active' : ''}" data-lang="${l.id}">${l.name}</button>
            `).join('')}
          </div>
        </div>
      </nav>
    </div>
    <button type="button" id="btnHeaderLogin" class="btn-header btn-link-gd">
      ${svgPerfil}${t('header.login')}
    </button>
  `;

  $('btnHeaderMainView').addEventListener('click', () => navigate());
  $('btnHeaderSettings').addEventListener('click', () => navigate('?settings=1'));
  $('btnHeaderLang').addEventListener('click', () => setPop($('langPop'), !$('langPop').classList.contains('open')));
  $('btnHeaderLogin').addEventListener('click', openLoginModal);

  $('langPop').addEventListener('click', (e) => {
  const item = e.target.closest('[data-lang]');
  if (!item) return;
  setPop($('langPop'), false);
  setLanguage(item.dataset.lang);
});
}

// -------------------------------------------------------------
// 2. Vista principal
// -------------------------------------------------------------

function renderMainPage(animate = true) {
  if (!$('main')) return;
  setPageTitle();

  mountView(`
    <div class="adverts"></div>

    <div class="body">
      <div class="body-panel">
        <div class="main-panel-stats panel">
          <div class="panel">
            <div class="banner" ${bannerStyle() ? `style="${bannerStyle()}"` : ''}>
              ${profileState.banner ? `<img src="${escapeHTML(profileState.banner)}" alt="" onerror="this.remove()">` : ''}
            </div>
            <div class="avatar-wrapper">
              <div class="avatar">
                <img id="mainProfileAvatar" src="${escapeHTML(getAvatar())}" alt="" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">
              </div>
              <button type="button" id="btnEditProfile" class="avatar-button" title="${t('profile.edit')}">${svgPencil}</button>
            </div>
            <div class="description">
              <div class="profile-name-row">
                <span class="text-a" id="mainProfileName">${escapeHTML(profileState.username)}</span>
                ${profileState.country ? `<span class="profile-country">${svgPin}${escapeHTML(profileState.country)}</span>` : `<span class="profile-country">${svgPin}-</span>`}
              </div>
              <span class="text-b" id="mainProfileID"></span>
            </div>
          </div>
          <div class="complement-panel" id="statsComplementPanel"></div>
        </div>

        <div class="lists-panel panel">
          <div class="lists-panel-head">
            <div class="lists-head-text">
              <span class="text-s">${t('lists.title')}</span>
              <span class="text-b" id="listsDescription"></span>
            </div>
            <div class="lists-head-actions">
              <button type="button" id="btnAddList" class="btn-primary">${t('lists.add')}</button>
              <button type="button" id="btnFilterList" class="button-square toggle"><img alt=""></button>
            </div>
          </div>
          <div id="listsContainer"></div>
        </div>
      </div>
    </div>

    <div class="complement"></div>
  `, animate);

  $('btnEditProfile').addEventListener('click', openEditProfileModal);
  $('btnAddList').addEventListener('click', openAddListModal);
  $('btnFilterList').addEventListener('click', toggleFilterFavorites);
  $('listsContainer').addEventListener('click', onListsContainerClick);

  renderStatsPanel();
  renderListsCards();
  syncFavFilterBtn();
}

// -------------------------------------------------------------
// 3. Panel de estadísticas del perfil
// -------------------------------------------------------------

const STAT_ITEMS = [
  ['demon', 'demons', 'stats.demons'],
  ['moon', 'moons', 'stats.moons'],
  ['diamond', 'diamonds', 'stats.diamonds'],
  ['star', 'stars', 'stats.stars'],
  ['silvercoin', 'userCoins', 'stats.userCoins'],
  ['coin', 'coins', 'stats.secretCoins']
];

const STAT_MAX = 999999999;

// Deja cada stat como entero entre 0 y STAT_MAX (también migra los datos guardados por versiones anteriores)
function normalizeStats(src) {
  const out = {};
  STAT_ITEMS.forEach(([, field]) => {
    out[field] = Math.min(STAT_MAX, Math.max(0, Math.floor(Number(src && src[field]) || 0)));
  });
  return out;
}

function renderStatsPanel() {
  const container = $('statsComplementPanel');
  const mainID = $('mainProfileID');
  if (!container) return;

  mainID.textContent = t('profile.id', { id: '-' });
  container.innerHTML = `
    <button type="button" id="btnStatsInfo" class="btn-info-icon stats-info-btn" title="${escapeHTML(t('stats.infoBtn'))}" aria-label="${escapeHTML(t('stats.infoBtn'))}">${svgInfo}</button>
    <div class="grid-row">
      ${STAT_ITEMS.map(([icon, field, label]) => `
        <button type="button" class="stat" data-stat="${field}" title="${escapeHTML(t('stats.edit'))}">
          <img class="stat-img" src="resources/${icon}.png" alt="">
          <span class="stat-value">${fmtNum(profileStats[field])}</span>
          <span class="stat-label">${t(label)}</span>
        </button>
      `).join('')}
    </div>
  `;

  $('btnStatsInfo').addEventListener('click', openStatsInfoModal);
  container.querySelector('.grid-row').addEventListener('click', (e) => {
    const stat = e.target.closest('[data-stat]');
    if (stat) openStatModal(stat.dataset.stat);
  });
}

function refreshProfileViews() {
  renderHeader();
  if ($('statsComplementPanel')) renderStatsPanel();
  if ($('listStatsContainer')) renderListStats();
}

// -------------------------------------------------------------
// 4. Panel de listas
// -------------------------------------------------------------

function renderListsCards() {
  const container = $('listsContainer');
  if (!container) return;

  const count = $('listsDescription');
  if (count) count.textContent = t('lists.count', { n: userLists.length });

  const lists = filterFavoritesOnly ? userLists.filter(list => list.isFavorite) : userLists;

  if (lists.length === 0) {
    container.innerHTML = `<div class="no-lists-msg">${filterFavoritesOnly ? t('lists.emptyFav') : t('lists.empty')}</div>`;
    return;
  }

  container.innerHTML = lists.map((list, i) => {
    const demons = list.demons || [];
    const hardest = demons.length ? (demons[0].name || '-') : '-';

    return `
      <div class="list-card" style="--i:${Math.min(i, 8)}">
        <button type="button" class="card-btn-config" data-edit-list="${list.id}" title="${t('list.edit')}">
          <img src="resources/edit.png" alt="">
        </button>

        <div class="card-content">
          <div class="card-title-row">
            <h2 class="card-title">${escapeHTML(list.title)}</h2>
            ${list.isFavorite ? `<img class="card-fav-star" src="${FAV_ICON.on}" alt="" title="${t('list.favorite')}">` : ''}
          </div>
          <p class="card-author">${t('list.by', { name: escapeHTML(list.author || profileState.username) })}</p>
          <p class="card-description">${t('list.info', { n: demons.length, hardest: escapeHTML(hardest) })}</p>
        </div>

        <div class="card-over-side">
          <div class="card-visual-side">
            ${list.image ? `<img src="${escapeHTML(list.image)}" alt="" loading="lazy">` : ''}
          </div>
        </div>

        <button type="button" class="card-btn-view" data-view-list="${list.id}">${t('list.view')}</button>
      </div>
    `;
  }).join('');
}

function onListsContainerClick(e) {
  const edit = e.target.closest('[data-edit-list]');
  if (edit) return openEditListModal(Number(edit.dataset.editList));

  const view = e.target.closest('[data-view-list]');
  if (view) navigate(`?list=${view.dataset.viewList}`);
}

function syncFavFilterBtn() {
  const btn = $('btnFilterList');
  if (!btn) return;
  btn.classList.toggle('active', filterFavoritesOnly);  
  btn.title = t('lists.filterFav');
  btn.querySelector('img').src = filterFavoritesOnly ? FAV_ICON.on : FAV_ICON.off;
}

function toggleFilterFavorites() {
  filterFavoritesOnly = !filterFavoritesOnly;
  saveData();
  syncFavFilterBtn();
  renderListsCards();
}