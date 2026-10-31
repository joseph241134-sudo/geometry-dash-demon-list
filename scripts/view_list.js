// ======================================================
// 1. Estados y constantes
// ======================================================

let currentList = null;
let isDragLocked = false;
let sortableInstance = null;

let listFilters = { sort: 'custom', difficulty: 'all', favorite: false, search: '' };

const DIFFICULTY = {
  'Easy Demon':    { icon: 'resources/easy_128.webp',    color: '#9651cb' },
  'Medium Demon':  { icon: 'resources/medium_128.webp',  color: '#e241c2' },
  'Hard Demon':    { icon: 'resources/hard_128.webp',    color: '#68de54' },
  'Insane Demon':  { icon: 'resources/insane_128.webp',  color: '#d59c31' },
  'Extreme Demon': { icon: 'resources/extreme_128.webp', color: '#952020' }
};
const DIFFICULTIES = Object.keys(DIFFICULTY);
const diffIcon = d => (DIFFICULTY[d] || DIFFICULTY['Easy Demon']).icon;
const diffColorStyle = d => `--diff-color:${DIFFICULTY[d] ? DIFFICULTY[d].color : 'var(--mute)'}`;

// falta colocar imagenes -->
const THUMB_ICON = {
  yt:   'resources/demon.png',
  face: 'resources/demon.png'
};

const SORT_MODES = ['custom', 'custom_rev', 'recent', 'oldest', 'attempts_desc', 'attempts_asc'];

// ======================================================
// 2. Utilidades y funciones
// ======================================================
// ------------------------------------------------------
// 2.1. Utilidades
// ------------------------------------------------------

const hasActiveFilters = () => !!(listFilters.search || listFilters.difficulty !== 'all' || listFilters.favorite);

const youTubeId = s => {
  s = String(s || '').trim();
  return (s.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/) || s.match(/^([\w-]{11})$/) || [])[1] || '';
};
const showcaseUrl = s => `https://youtube.com/watch?v=${youTubeId(s)}`;
function getYouTubeThumbnail(url, quality = 'mqdefault') {
  const id = youTubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : '';
}
function listSubtitleText() {
  return t('view.subtitle', { name: profileState.username, n: currentList.demons.length });
}

function syncSortUI() {
  const label = $('sortLabel');
  if (!label) return;
  label.textContent = t('sort.' + listFilters.sort);
  $('sortMenu').querySelectorAll('.pop-item').forEach(b => b.classList.toggle('active', b.dataset.sort === listFilters.sort));
}

// Botón alternante: miniatura / icon demon
function updateThumbButton() {
  const btn = $('btnToggleThumb');
  if (!btn) return;
  const faces = !!viewPrefs.showFaces;
  btn.classList.toggle('active', faces);
  btn.querySelector('img').src = faces ? THUMB_ICON.face : THUMB_ICON.yt;
}

function setSortMode(mode) {
  if (!SORT_MODES.includes(mode)) mode = 'custom';
  listFilters.sort = mode;
  viewPrefs.sort = mode;
  syncSortUI();
  saveData();
}

// Candado de arrastre: activo (cerrado)
function updateLockButton() {
  const btn = $('btnToggleLockDrag');
  if (!btn) return;

  const filtered = hasActiveFilters() || (listFilters.sort !== 'custom');
  const locked = isDragLocked || filtered;
  
  btn.classList.toggle('blocked', filtered);
  btn.classList.toggle('active', locked);
  btn.querySelector('img').src = locked ? 'resources/padlock_close.png' : 'resources/padlock_open.png';
}

// ------------------------------------------------------
// 2.2. arrastre - sortable
// ------------------------------------------------------

function destroySortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
}

function initSortable() {
  const container = $('demonsContainer');
  
  const shouldBlockDrag = isDragLocked || hasActiveFilters() || (listFilters.sort !== 'custom');

  if (shouldBlockDrag || typeof Sortable === 'undefined') {
    destroySortable();
    return;
  }

  if (sortableInstance) return;

  sortableInstance = Sortable.create(container, {
    animation: 180,
    ghostClass: 'sortable-ghost',
    delay: 250,             
    delayOnTouchOnly: true,
    touchStartThreshold: 5,
    onEnd: (evt) => {
      if (evt.oldIndex === evt.newIndex) return;

      const ids = Array.from(container.querySelectorAll('.demon-card')).map(card => card.dataset.id);
      currentList.demons.sort((a, b) => ids.indexOf(String(a.id)) - ids.indexOf(String(b.id)));

      if (listFilters.sort !== 'custom') setSortMode('custom');
      saveData();
      renderDemons();
      renderListStats();
    }
  });
}

// ------------------------------------------------------
// 2.3. Filtros y orden
// ------------------------------------------------------

function getVisibleDemons() {
  let demons = currentList.demons.map((d, index) => ({
    ...d,
    originalPosition: index + 1
  }));

  if (listFilters.search) {
    const q = normalizeText(listFilters.search);
    demons = demons.filter(d => normalizeText(d.name).includes(q));
  }
  if (listFilters.difficulty !== 'all') demons = demons.filter(d => d.difficulty === listFilters.difficulty);
  if (listFilters.favorite) demons = demons.filter(d => d.isFavorite);

  const time = d => (d.winDate ? new Date(d.winDate).getTime() : 0);
  const num = (d, key) => Number(d[key]) || 0;

  const sorters = {
    recent: (a, b) => time(b) - time(a),
    oldest: (a, b) => time(a) - time(b),
    attempts_desc: (a, b) => num(b, 'attempts') - num(a, 'attempts'),
    attempts_asc: (a, b) => num(a, 'attempts') - num(b, 'attempts')
  };
  if (sorters[listFilters.sort]) demons.sort(sorters[listFilters.sort]);
  else if (listFilters.sort === 'custom_rev') demons.reverse();

  return demons;
}

// ------------------------------------------------------
// 2.4. Aviso primer demon, dado y vista compacta
// ------------------------------------------------------

let hintTimer;

function hideAddDemonHint() {
  clearTimeout(hintTimer);
  const el = document.querySelector('.demon-hint');
  if (!el) return;
  el.classList.add('leaving');
  setTimeout(() => el.remove(), 260);
}

const HINT_KEY = 'mdl_hint_add_seen';

function showAddDemonHint() {
  try { if (localStorage.getItem(HINT_KEY)) return; } catch (e) { return; }
  if (window.matchMedia('(hover: none), (max-width: 640px)').matches) return;
  const main = $('main');
  if (!main) return;
  try { localStorage.setItem(HINT_KEY, '1'); } catch (e) {}

  const old = main.querySelector('.demon-hint');
  if (old) old.remove();
  clearTimeout(hintTimer);

  const el = document.createElement('div');
  el.className = 'demon-hint';
  el.setAttribute('role', 'status');
  el.innerHTML = `
    <span class="demon-hint-icon">+</span>
    <p>${t('hint.addDemon')}</p>
    <button type="button" class="demon-hint-close" aria-label="${t('common.close')}">✕</button>`;
  el.querySelector('.demon-hint-close').addEventListener('click', hideAddDemonHint);
  main.appendChild(el);

  hintTimer = setTimeout(hideAddDemonHint, 9000); // = duración de hintBar en CSS
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }
}

// ---- Dado: demon aleatorio ----->
function openRandomDemonModal() {
  const demons = currentList.demons;
  if (!demons.length) return showAlert(t('dice.empty'));

  let timer = null, closed = false, rolling = false, copyTimer;

  const ov = openModal({
    title: 'Random Demon',
    cls: 'modal-dice',
    onClose: () => { closed = true; clearTimeout(timer); },
    body: `
      <div class="dice-fold" id="diceThumb"><div class="dice-fold-in">
        <a class="dice-video" id="diceVideo" target="_blank" rel="noopener" title="${t('card.showcase')}"><img alt=""></a>
      </div></div>
      <div class="dice-pad">
  <div class="dice-head rolling" id="diceHead">
    <div class="dice-text">
      <div class="dice-title"><span id="diceName">?</span></div>
      <div class="dice-fold" id="diceBy"><div class="dice-fold-in">
        <p class="dice-by" id="diceByTxt"></p>
      </div></div>
    </div>
    <img class="dice-diff" id="diceDiff" alt="">
  </div>
  <div class="dice-fold" id="diceInfo"><div class="dice-fold-in">
    <button type="button" class="dice-id" id="diceId"></button>
  </div></div>
</div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnDiceClose">${t('common.close')}</button>
      <button type="button" class="btn-primary" id="btnDiceRoll">${t('dice.again')}</button>`
  });

  const head = $('diceHead'), nameEl = $('diceName'), info = $('diceInfo'), thumb = $('diceThumb'), by = $('diceBy');
  const idBtn = $('diceId'), rollBtn = $('btnDiceRoll');

  const fillInfo = (d) => {
  const yt = youTubeId(d.showcase);
  if (yt) {
    const img = $('diceVideo').querySelector('img');
    const hd = getYouTubeThumbnail(d.showcase, 'maxresdefault');
    img.onerror = () => { img.onerror = null; img.src = hd.replace('maxresdefault', 'mqdefault'); };
    img.src = hd;
    $('diceVideo').href = showcaseUrl(d.showcase);
  }
  thumb.classList.toggle('show', !!yt);

  $('diceDiff').src = diffIcon(d.difficulty);
  $('diceByTxt').innerHTML = d.creator ? t('card.publishedBy', { name: `<strong>${escapeHTML(d.creator)}</strong>` }) : '';
  by.classList.toggle('show', !!d.creator);

  idBtn.dataset.id = d.levelId || '';
  idBtn.textContent = 'ID: ' + (d.levelId || '');
  idBtn.title = t('dice.copy');
  info.classList.toggle('show', !!d.levelId);
};

  const finish = (d) => {
    // posición inicial (centrado y grande)
    const fs0 = parseFloat(getComputedStyle(nameEl).fontSize);
    const bw = nameEl.parentElement.clientWidth;

    nameEl.classList.remove('tick');
    head.classList.remove('rolling');
    nameEl.textContent = `#${demons.indexOf(d) + 1} - ${d.name}`;
    fillInfo(d);

    // posición final (izquierda y chico) -> animar de una a otra
    const s = fs0 / parseFloat(getComputedStyle(nameEl).fontSize);
    const w = nameEl.offsetWidth;
    nameEl.animate(
      [{ transform: `translateX(${(bw - w * s) / 2}px) scale(${s})` }, { transform: 'none' }],
      { duration: 450, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
    );

    rolling = false;
    rollBtn.disabled = false;
  };

  const roll = () => {
    if (rolling) return;
    rolling = true;
    rollBtn.disabled = true;
    info.classList.remove('show');
    by.classList.remove('show');
    thumb.classList.remove('show');
    head.classList.add('rolling');

    const final = demons[Math.floor(Math.random() * demons.length)];
    const others = demons.filter(d => d !== final);
    const steps = demons.length > 1 ? 16 + Math.floor(Math.random() * 6) : 0;
    let i = 0, last = null;

    const tick = () => {
      if (closed) return;
      if (i >= steps) return finish(final);

      const pool = others.filter(d => d !== last);
      const list = pool.length ? pool : others;
      const d = i === steps - 1 ? final : list[Math.floor(Math.random() * list.length)];
      last = d;
      nameEl.textContent = d.name;
      nameEl.classList.remove('tick');
      void nameEl.offsetWidth;
      nameEl.classList.add('tick');

      i++;
      timer = setTimeout(tick, 45 + i * i * 0.9); // va frenando
    };
    tick();
  };

  idBtn.addEventListener('click', async () => {
    const id = idBtn.dataset.id;
    if (!id) return;
    if (await copyText(id)) {
      idBtn.textContent = t('dice.copied');
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => { idBtn.textContent = id; }, 1200);
    }
  });

  $('btnDiceClose').addEventListener('click', () => closeModal(ov));
  rollBtn.addEventListener('click', roll);
  roll();
}

// ---- lista compacta ----->
function openCompactListModal() {
  const demons = currentList.demons;

  const header = `<li class="compact-header">
    <span class="compact-pos" style="visibility: hidden;"></span>
    <span class="compact-header-name">${t('common.name')}</span>
    <span class="compact-header-creator">${t('common.creator')}</span>
    <span class="compact-header-diff">${t('common.difficulty')}</span>
  </li>`;

  const rows = demons.map((d, i) => `
    <li class="compact-row" style="${diffColorStyle(d.difficulty)}">
      <span class="compact-pos">${i + 1})</span>
      <span class="compact-name">${escapeHTML(d.name)}</span>
      <span class="compact-creator">${escapeHTML(d.creator || '-')}</span>
      <span class="compact-diff">${escapeHTML(String(d.difficulty).replace(' Demon', ''))}</span>
    </li>`).join('');

  const ov = openModal({
    title: `${currentList.title}<span class="compact-list-subtitle">${t('compact.title')}</span>`,
    titleExtra: `<small class="compact-count">${demons.length}</small>`,
    cls: 'modal-compact',
    body: demons.length
      ? `${header}<ul class="compact-list">${rows}</ul>`
      : `<p class="dialog-text">${t('view.empty')}</p>`,
    actions: `<button type="button" class="btn-secondary" data-close>${t('common.close')}</button>`
  });
  ov.querySelector('[data-close]').addEventListener('click', () => closeModal(ov));
}

// ---- exportar lista como imagen ----->
const loadImg = src => new Promise(r => {
  const i = new Image();
  i.crossOrigin = 'anonymous';
  i.onload = () => r(i);
  i.onerror = () => r(null);
  i.src = src;
});

const EXPORT_MAX = 75;

function openExportImageModal() {
  if (!cloudUser) {
    return showConfirm(t('export.needLogin'), { okText: t('login.title') })
      .then(ok => { if (ok) openSignInModal(); });
  }

  const total = currentList.demons.length;
  if (!total) return showAlert(t('dice.empty'));

  const MAX = EXPORT_MAX;
  const allN = Math.min(total, MAX);
  const presets = [10, 25, 50, 75].map(n => ({ n, label: t('export.top', { n }), off: n >= allN }));

  const ov = openModal({
    title: t('export.title'),
    cls: 'modal-sm ex-img-modal',
    body: `
      <div class="thumb-text" style="margin-top: 8px; "><p>${t('export.hint', { total, max: MAX })}</p></div>

      <div class="ex-section">
        <span class="ex-label">${t('export.quick')}</span>
        <div class="filter-diff-grid" id="exPresets">
          ${presets.map(p => `<button type="button" class="filter-diff-pill" data-n="${p.n}" ${p.off ? 'disabled' : ''}>${p.label}</button>`).join('')}
          <button type="button" class="filter-diff-pill ex-all" data-n="${allN}">${total <= MAX ? t('export.all') : t('export.top', { n: MAX })}</button>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group"><label>${t('export.from')}</label>
          <input type="number" id="exFrom" class="form-input" min="1" max="${total}" step="1" value="1"></div>
        <div class="form-group"><label>${t('export.to')}</label>
          <input type="number" id="exTo" class="form-input" min="1" max="${total}" step="1" value="${allN}"></div>
      </div>
      <p class="modal-hint" style="margin-top: 10px; font-size: 13px" id="exRange"></p>

      <div class="ex-section ex-extra">
        <span class="ex-label" style="margin-bottom: 6px; ">${t('export.extra')}</span>
        <label class="ex-check"><input type="checkbox" id="exProfile" checked>${t('export.profile')}</label>
      </div>`,
    actions: `
      <button type="button" class="btn-secondary" id="btnExCancel">${t('common.cancel')}</button>
      <button type="button" class="btn-primary" id="btnExGo">${t('export.download')}</button>`
  });

  const pillEls = ov.querySelectorAll('.filter-diff-pill');

  const range = () => {
    let f = Math.floor(Number($('exFrom').value)) || 1;
    let e = Math.floor(Number($('exTo').value)) || total;
    f = Math.min(Math.max(1, f), total);
    e = Math.min(Math.max(f, e), total);
    if (e - f + 1 > MAX) e = f + MAX - 1;
    return [f, e];
  };

  const refresh = () => {
    const [f, e] = range();
    $('exRange').textContent = t('export.range', { from: f, to: e, n: e - f + 1 });
    pillEls.forEach(b => b.classList.toggle('active', !b.disabled && f === 1 && e === Number(b.dataset.n)));
  };

  $('exPresets').addEventListener('click', (e) => {
    const pill = e.target.closest('[data-n]');
    if (!pill || pill.disabled) return;
    $('exFrom').value = 1;
    $('exTo').value = pill.dataset.n;
    refresh();
  });
  $('exFrom').addEventListener('input', refresh);
  $('exTo').addEventListener('input', refresh);
  $('btnExCancel').addEventListener('click', () => closeModal(ov));
  $('btnExGo').addEventListener('click', () => {
    const [f, e] = range();
    const withProfile = $('exProfile').checked;
    closeModal(ov);
    exportListImage(f, e, withProfile);
  });
  refresh();
}

async function exportListImage(from, to, withProfile = true) {
  const demons = currentList.demons.slice(from - 1, to);

  const icons = {};
  await Promise.all(DIFFICULTIES.map(async d => { icons[d] = await loadImg(DIFFICULTY[d].icon); }));
  const avatar = withProfile ? ((await loadImg(getAvatar())) || (await loadImg(DEFAULT_AVATAR))) : null;

  const PER_COL = 25;
  const cols = Math.ceil(demons.length / PER_COL);
  const rows = Math.min(demons.length, PER_COL);

  // una sola columna: todo más grande para que no quede espacio vacío
  const S = cols === 1 ? 1.5 : 1;
  const u = n => n * S;
  const ROW_H = u(44), COL_W = u(380), PAD = 32, HEAD_H = 128, AV = 56;
  const FONT = "'Inter', system-ui, sans-serif";

  const c = document.createElement('canvas');
  c.width = PAD * 2 + cols * COL_W - u(12);
  c.height = HEAD_H + rows * ROW_H + PAD;
  const ctx = c.getContext('2d');
  ctx.textBaseline = 'middle';

  const fit = (text, maxW) => {
    if (ctx.measureText(text).width <= maxW) return text;
    while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
    return text + '…';
  };

  // fondo
  ctx.fillStyle = cssHex('--bg', '#0b1118');
  ctx.fillRect(0, 0, c.width, c.height);

  // jugador (derecha): avatar + nombre
  let reserved = 0;
  if (withProfile) {
    const ax = c.width - PAD - AV, ay = PAD - 4;
    ctx.save();
    ctx.beginPath();
    ctx.arc(ax + AV / 2, ay + AV / 2, AV / 2, 0, Math.PI * 2);
    ctx.clip();
    if (avatar) {
      const sw = Math.min(avatar.naturalWidth, avatar.naturalHeight);
      ctx.drawImage(avatar, (avatar.naturalWidth - sw) / 2, (avatar.naturalHeight - sw) / 2, sw, sw, ax, ay, AV, AV);
    }
    ctx.restore();
    ctx.strokeStyle = cssHex('--line-2', '#3c4a5c');
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax + AV / 2, ay + AV / 2, AV / 2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `700 18px ${FONT}`;
    const name = fit(profileState.username || '-', 220);
    ctx.fillStyle = cssHex('--text-1', '#ffffff');
    ctx.textAlign = 'right';
    ctx.fillText(name, ax - 14, ay + AV / 2);
    ctx.textAlign = 'left';
    reserved = AV + 14 + ctx.measureText(name).width + 24;
  }

  // título + subtítulo
  ctx.font = `800 34px ${FONT}`;
  ctx.fillStyle = cssHex('--text-1', '#ffffff');
  ctx.fillText(fit(currentList.title, c.width - PAD * 2 - reserved), PAD, PAD + 18);

  ctx.font = `500 16px ${FONT}`;
  ctx.fillStyle = cssHex('--mute', '#9fb4c8');
  const partial = demons.length !== currentList.demons.length;
  ctx.fillText(`${demons.length} demons${partial ? ` · #${from} – #${to}` : ''}`, PAD, PAD + 56);

  // filas
  demons.forEach((d, i) => {
    const x = PAD + Math.floor(i / PER_COL) * COL_W;
    const y = HEAD_H + (i % PER_COL) * ROW_H;
    const w = COL_W - u(12), h = ROW_H - u(6);

    ctx.fillStyle = cssHex('--panel-2', '#1a2633');
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = DIFFICULTY[d.difficulty] ? DIFFICULTY[d.difficulty].color : '#888';
    ctx.fillRect(x, y, u(4), h);

    ctx.fillStyle = cssHex('--mute', '#9fb4c8');
    ctx.font = `700 ${u(14)}px ${FONT}`;
    ctx.fillText(`#${from + i}`, x + u(14), y + h / 2);

    const icon = icons[d.difficulty];
    if (icon) ctx.drawImage(icon, x + u(62), y + (h - u(30)) / 2, u(30), u(30));

    ctx.fillStyle = cssHex('--text-1', '#ffffff');
    ctx.font = `700 ${u(15)}px ${FONT}`;
    ctx.fillText(fit(d.name, w - u(102) - u(12)), x + u(102), y + h / 2);
  });

  c.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentList.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
// ======================================================
// 3. Renderizaado de vista (lista)
// ======================================================

function openListView(listId) {
  currentList = userLists.find(l => l.id === listId);
  if (!currentList) {
    history.replaceState(null, '', location.pathname);
    return renderMainPage();
  }

  setPageTitle(currentList.title);
  isDragLocked = viewPrefs.dragLocked !== false;
  listFilters = {
    sort: SORT_MODES.includes(viewPrefs.sort) ? viewPrefs.sort : 'custom',
    difficulty: 'all',
    favorite: false,
    search: ''
  };

  mountView(`
    <div class="list-view">
      <div class="list-view-header">
        <div class="list-view-heading">
          <h1 class="list-view-title">${escapeHTML(currentList.title)}</h1>
          <span class="list-view-subtitle" id="listViewSubtitle">${escapeHTML(listSubtitleText())}</span>
        </div>
        <div class="list-view-actions">
          <button type="button" id="btnExportImg" class="btn-line" title="${t('export.title')}">${svg.Image}<span class="btn-label">${t('export.btn')}</span></button>
        </div>
      </div>

      <div class="list-view-controls panel">
        <button type="button" id="btnRandomDemon" class="button-square" style="padding-bottom: 1px" title="${t('dice.title')}">${svg.Dice}</button>
        <div class="filter-popup-wrapper" data-pop-root>
          <button type="button" id="btnOpenFilter" class="btn-filter-toggle button-square" title="${t('view.filters')}">${svg.Filter}</button>

          <div id="filterPopup" class="pop filter-popup-dropdown">
            <div class="filter-popup-header"><span>${t('view.filters')}</span></div>
            <div class="filter-popup-section">
              <span class="filter-popup-label">${t('view.difficulty')}</span>
              <div class="filter-diff-grid" id="filterDiffGrid">
                <button type="button" class="filter-diff-pill active" data-diff="all">${t('view.all')}</button>
                ${DIFFICULTIES.map(d => `
                  <button type="button" class="filter-diff-pill" data-diff="${d}">${d.replace(' Demon', '')}</button>
                `).join('')}
              </div>
            </div>
            <div class="filter-popup-section">
              <span class="filter-popup-label">${t('view.favFilter')}</span>
              <button type="button" id="btnPopupFav" class="filter-fav-option">
                <img src="${FAV_ICON.off}" alt="">
                <span>${t('view.onlyFav')}</span>
              </button>
            </div>
          </div>
        </div>

        <div class="search-box" data-pop-root>
          ${svg.Search}
          <input type="text" id="searchDemon" class="form-input search-input-field" placeholder="${t('view.search')}" autocomplete="off" spellcheck="false">
          <div id="searchAutocomplete" class="pop autocomplete-dropdown"></div>
        </div>

        <button type="button" id="btnToggleLockDrag" class="button-square toggle" title="${t('view.lock')}"><img alt=""></button>
        
        <button type="button" id="btnCompactList" class="button-square" title="${t('compact.title')}">${svg.Grid}</button>

        <div class="sort-wrap" data-pop-root>
          <button type="button" id="btnSort" class="form-input select-btn" title="${t('view.sort')}" aria-haspopup="listbox"><span id="sortLabel"></span></button>
          <div id="sortMenu" class="pop pop-menu">
            ${SORT_MODES.map(m => `<button type="button" class="pop-item" data-sort="${m}">${t('sort.' + m)}</button>`).join('')}
          </div>
        </div>
        <button type="button" id="btnToggleThumb" class="button-square toggle" title="${t('view.thumbYt')}"><img alt=""></button>

      </div>

      <div class="list-view-body">
        <div class="demons-container" id="demonsContainer"></div>
        <aside class="list-sidebar panel">
          <div id="listStatsContainer"></div>
        </aside>
      </div>
    </div>
  `);
  
  $('btnExportImg').addEventListener('click', openExportImageModal);
  // ---- random mode ----->
  $('btnRandomDemon').addEventListener('click', openRandomDemonModal);

  // ---- filtros ----->
  $('btnOpenFilter').addEventListener('click', () => setPop($('filterPopup'), !$('filterPopup').classList.contains('open')));

  $('filterDiffGrid').addEventListener('click', (e) => {
    const pill = e.target.closest('[data-diff]');
    if (!pill) return;
    listFilters.difficulty = pill.dataset.diff;
    $('filterDiffGrid').querySelectorAll('.filter-diff-pill').forEach(b => b.classList.toggle('active', b === pill));
    renderDemons();
  });

  $('btnPopupFav').addEventListener('click', (e) => {
    listFilters.favorite = !listFilters.favorite;
    e.currentTarget.classList.toggle('active', listFilters.favorite);
    e.currentTarget.querySelector('img').src = listFilters.favorite ? FAV_ICON.on : FAV_ICON.off;
    renderDemons();
  });

  // ---- buscador local ----->
  const refreshSearch = debounce(renderDemons, 90);
  $('searchDemon').addEventListener('input', (e) => {
    listFilters.search = e.target.value.trim();
    refreshSearch();
    renderLocalAutocomplete(listFilters.search);
  });

  // ---- candado de arrastre ----->
  $('btnToggleLockDrag').addEventListener('click', () => {
    if (hasActiveFilters() || listFilters.sort !== 'custom') return showToast(t('view.lockBlocked'));
    isDragLocked = !isDragLocked;
    viewPrefs.dragLocked = isDragLocked;
    saveData();
    updateLockButton();
    initSortable();
  });

  // ---- miniaturas: youtube / cara ----->
  $('btnToggleThumb').addEventListener('click', () => {
    viewPrefs.showFaces = !viewPrefs.showFaces;
    saveData();
    updateThumbButton();
    renderDemons();
  });
  updateThumbButton();

  $('btnCompactList').addEventListener('click', openCompactListModal);
  // ---- orden ----->
  $('btnSort').addEventListener('click', () => setPop($('sortMenu'), !$('sortMenu').classList.contains('open')));
  $('sortMenu').addEventListener('click', (e) => {
    const item = e.target.closest('[data-sort]');
    if (!item) return;
    setSortMode(item.dataset.sort);
    setPop($('sortMenu'), false);
    renderDemons();
  });
  syncSortUI();


  $('demonsContainer').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-demon]');
    if (editBtn) return openEditDemonModal(currentList.id, editBtn.dataset.editDemon);

    const addBtn = e.target.closest('[data-add-demon-after]');
    if (addBtn) openAddDemonModal(currentList.id, addBtn.dataset.addDemonAfter);
  });

  renderDemons();
  renderListStats();
}