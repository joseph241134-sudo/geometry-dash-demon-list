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
              <button type="button" id="btnEditProfile" class="avatar-button" title="${t('profile.edit')}">${svg.Pencil}</button>
            </div>
            <div class="description">
              <div class="profile-name-row">
                <span class="text-a" id="mainProfileName">${escapeHTML(profileState.username)}</span>
                ${profileState.country ? `<span class="profile-country">${svg.Pin}${escapeHTML(profileState.country)}</span>` : `<span class="profile-country">${svg.Pin}-</span>`}
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
    <button type="button" id="btnStatsInfo" class="btn-info-icon stats-info-btn" title="${escapeHTML(t('login.title'))}" aria-label="${escapeHTML(t('login.title'))}">${svg.Info}</button>
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
            ${list.isFavorite ? `<img class="card-fav-star" src="${FAV_ICON.on}" alt="">` : ''}
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