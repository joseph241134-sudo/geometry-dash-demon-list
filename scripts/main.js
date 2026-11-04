// ======================================================
// Main: renderizado de vista principal - costantes y utilidades
// ======================================================

// ======================================================
// 1. Estado global y utilidades
// ======================================================

let profileStats = { demons: 0, moons: 0, diamonds: 0, stars: 0, userCoins: 0, coins: 0 };
let viewPrefs = { sort: 'custom', dragLocked: false };
let userLists = [];
const DEFAULT_PROFILE = { username: 'Player 1', avatar: '', banner: '', bannerColor: '', country: '', playerType: '', gdId: '', gdName: '', gdRank: '', bio: '' };
let profileState = { ...DEFAULT_PROFILE };

const DEFAULT_AVATAR = 'resources/avatar.jpg';
const FAV_ICON = { on: 'resources/fav_on.png', off: 'resources/fav_off.png' };
const getAvatar = () => profileState.avatar || DEFAULT_AVATAR;

// ID público (columna public_id de Supabase); '-' sin sesión
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

// -------------------- color modal --------------------------------------
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

const setPop = (el, open) => { if (el) el.classList.toggle('open', open); };

// ------------------------------------------------------
// Navegación y montaje de vistas
// ------------------------------------------------------

let viewEnterTimer;

// Reemplaza el contenido de <main>. animate = false para repintar sin animación de entrada
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
  if ((location.search || '') === search) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  history.pushState(null, '', location.pathname + search);
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function setPageTitle(sub) {
  document.title = sub ? `${sub} | My Demon List` : t('meta.title');
}

// Estilo de banner
function bannerStyle() {
  const color = safeColor(profileState.bannerColor);
  return color ? `background-color:${color};` : '';
}

// -------------------------------------------------------------
// API · Backend (Render): autocompletado de niveles (/api/levels) y warm-up
// -------------------------------------------------------------

const API_BASE = 'https://mdl-backend-tvpk.onrender.com';

function warmUpAPI() {
  fetch(`${API_BASE}/api/health`, { cache: 'no-store' }).catch(() => {});
}

// -------------------------------------------------------------
// Stats del perfil (ya no se muestran; solo se normalizan los datos guardados)
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

// Deja cada stat como entero (también migra los datos guardados por versiones anteriores)
function normalizeStats(src) {
  const out = {};
  STAT_ITEMS.forEach(([, field]) => {
    out[field] = Math.min(STAT_MAX, Math.max(0, Math.floor(Number(src && src[field]) || 0)));
  });
  return out;
}


// ======================================================
// 2. Vista principal
// ======================================================

const HOME_ICONS = {
  pc: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
  mobile: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`
};

const listThumb = l => l.image || getYouTubeThumbnail(l.demons?.[0]?.showcase);
const getMainList = () => userLists.find(l => l.isMain) || null;

function setMainList(listId) {
  userLists.forEach(l => { l.isMain = l.id === listId; });
}

// -------------------------------------------------------------
// 2.1. Hero del perfil (banner + avatar superpuesto)
// -------------------------------------------------------------

function profileBadges() {
  const out = [];
  if (profileState.playerType === 'pc') out.push(`<span class="hp-badge">${HOME_ICONS.pc}${t('profile.typePc')}</span>`);
  if (profileState.playerType === 'mobile') out.push(`<span class="hp-badge">${HOME_ICONS.mobile}${t('profile.typeMobile')}</span>`);
  if (profileState.country) out.push(`<span class="hp-badge">${svg.Pin}${escapeHTML(profileState.country)}</span>`);
  return out.join('');
}

const RANK_TIERS = [
  [1, '#ffd54a'], [10, '#ffd54a'], [100, '#aeacab'],
  [500, '#e0925a'], [1000, '#38bdf8'], [10000, '#4ade80'], [100000, '#d97fca'],
  [1000000, '#7c7c7c'],
];

const rankLabel = max =>
  max <= 3 ? `#${max}` : 'Top ' + (max >= 1e6 ? max / 1e6 + 'M' : max >= 1e3 ? max / 1e3 + 'K' : max);

// número exacto (datos viejos) -> tier donde cae; '' si no tiene o se pasa del último
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
      ${img ? `<div class="hp-main-bg" style="background-image:url('${escapeHTML(img)}')"></div>` : ''}
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

// Repinta las dos secciones (principal y otras)
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
    btn.disabled = others.length < 2;
    btn.classList.toggle('active', reorderMode);
  }

  initRotor();
}

// -------------------------------------------------------------
// 2.3. Eventos de la vista principal
// -------------------------------------------------------------

const closeHomeMenus = () => document.querySelectorAll('.hp-menu-pop.open').forEach(p => p.classList.remove('open'));

// El menú es fixed para que no lo recorte el scroll interno de "Otras listas"
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

    // clic en cualquier parte de la carta
  const card = e.target.closest('[data-card-list]');
  if (card && !e.target.closest('.hp-menu')) {
    if (document.querySelector('.hp-menu-pop.open')) return closeHomeMenus();  // un menú abierto: solo se cierra
    if (String(window.getSelection())) return;                                  // no navegar si estaba seleccionando texto
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
  $('btnReorder').addEventListener('click', () => { reorderMode = !reorderMode; renderListsCards(); });

  renderListsCards();
}