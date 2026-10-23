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

const svgDemon = `
<svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <!-- Cara circular con ojos recortados (transparentes) -->
  <path fill-rule="evenodd" d="M12 22C16.9706 22 21 17.9706 21 13C21 8.02944 16.9706 4 12 4C7.02944 4 3 8.02944 3 13C3 17.9706 7.02944 22 12 22ZM8.5 11.5C9.32843 11.5 10 12.3954 10 13.5C10 14.6046 9.32843 15.5 8.5 15.5C7.67157 15.5 7 14.6046 7 13.5C7 12.3954 7.67157 11.5 8.5 11.5ZM15.5 11.5C16.3284 11.5 17 12.3954 17 13.5C17 14.6046 16.3284 15.5 15.5 15.5C14.6716 15.5 14 14.6046 14 13.5C14 12.3954 14.6716 11.5 15.5 11.5Z" />
  
  <!-- Cuerno Izquierdo (curvado y ancho en la base) -->
  <path d="M4.5 9.5C3.8 6.5 4.8 3.5 7 1.5C6.5 4 8 6.5 10 7.8C8.2 8.8 6 9.8 4.5 9.5Z" />
  
  <!-- Cuerno Derecho (curvado y ancho en la base) -->
  <path d="M19.5 9.5C20.2 6.5 19.2 3.5 17 1.5C17.5 4 16 6.5 14 7.8C15.8 8.8 18 9.8 19.5 9.5Z" />
</svg>
`

const svgAttemps = `
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
  <line x1="18" y1="20" x2="18" y2="9" />
  <line x1="12" y1="20" x2="12" y2="7" />
  <line x1="6" y1="20" x2="6" y2="12" />
</svg>
`

const svgYutu = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M21.58 7.19C21.35 6.33 20.67 5.65 19.81 5.42C18.25 5 12 5 12 5C12 5 5.75 5 4.19 5.42C3.33 5.65 2.65 6.33 2.42 7.19C2 8.75 2 12 2 12C2 12 2 15.25 2.42 16.81C2.65 17.67 3.33 18.35 4.19 18.58C5.75 19 12 19 12 19C12 19 18.25 19 19.81 18.58C20.67 18.35 21.35 17.67 21.58 16.81C22 15.25 22 12 22 12C22 12 22 8.75 21.58 7.19ZM10 15V9L15.2 12L10 15Z"/>
</svg>`

const svgDate = `
<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M7 2C7.55228 2 8 2.44772 8 3V4H16V3C16 2.44772 16.4477 2 17 2C17.5523 2 18 2.44772 18 3V4H19C20.6569 4 22 5.34315 22 7V19C22 20.6569 20.6569 22 19 22H5C3.34315 22 2 20.6569 2 19V7C2 5.34315 3.34315 4 5 4H6V3C6 2.44772 6.44772 2 7 2ZM4 9H20V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V9ZM7 12C6.44772 12 6 12.4477 6 13C6 13.5523 6.44772 14 7 14H9C9.55228 14 10 13.5523 10 13C10 12.4477 9.55228 12 7 12ZM15 13C15 12.4477 15.4477 12 16 12H17C17.5523 12 18 12.4477 18 13C18 13.5523 17.5523 14 17 14H16C15.4477 14 15 13.5523 15 13Z"/>
</svg>
`

const svgLabel = `
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
    <line x1="7" y1="7" x2="7.01" y2="7"></line>
  </svg>
`

const svgRating = `
<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M3 2C3.55228 2 4 2.44772 4 3V19H20C20.5523 19 21 19.4477 21 20C21 20.5523 20.5523 21 20 21H3C2.44772 21 2 20.5523 2 20V3C2 2.44772 2.44772 2 3 2ZM13.8047 9.29289C14.1953 8.90237 14.8284 8.90237 15.2189 9.29289L19 13.074V10C19 9.44772 19.4477 9 20 9C20.5523 9 21 9.44772 21 10V16C21 16.5523 20.5523 17 20 17H14C13.4477 17 13 16.5523 13 16C13 15.4477 13.4477 15 14 15H16.5858L14.5118 12.926L11.7071 15.7071C11.3166 16.0976 10.6834 16.0976 10.2929 15.7071L5.29289 10.7071C4.90237 10.3166 4.90237 9.68342 5.29289 9.29289C5.68342 8.90237 6.31658 8.90237 6.70711 9.29289L11 13.5858L13.8047 9.29289Z"/>
</svg>`

// ------------------------------------------------------
// Utilidades
// ------------------------------------------------------

const $ = id => document.getElementById(id);
const fmtNum = n => (n === undefined || n === null || n === '') ? '-' : (Number(n) || 0).toLocaleString();

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
    <button type="button" id="btnStatsInfo" class="btn-info-icon stats-info-btn" title="${escapeHTML(t('login.title'))}" aria-label="${escapeHTML(t('login.title'))}">${svgInfo}</button>
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

  $('btnStatsInfo').addEventListener('click', openLoginModal);
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
          <p class="card-author">${t('list.by', { name: escapeHTML(profileState.username || '') })}</p>
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