// ------------------------------------------------------
// 1. Estado y constantes
// ------------------------------------------------------

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

// Iconos del botón de miniaturas (coloca tus imágenes en estas rutas)
const THUMB_ICON = {
  yt:   'resources/demon.png',
  face: 'resources/demon.png'
};

const SORT_MODES = ['custom', 'recent', 'oldest', 'attempts_desc', 'attempts_asc', 'tier_desc', 'tier_asc'];

// ------------------------------------------------------
// 2. Utilidades de la vista
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
  
  btn.disabled = filtered;
  btn.classList.toggle('active', locked);
  btn.querySelector('img').src = locked ? 'resources/padlock_close.png' : 'resources/padlock_open.png';
}

// ------------------------------------------------------
// 3. Arrastrar y soltar - sortable
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
// 4. Filtros y orden
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
    attempts_asc: (a, b) => num(a, 'attempts') - num(b, 'attempts'),
    tier_desc: (a, b) => num(b, 'tier') - num(a, 'tier'),
    tier_asc: (a, b) => num(a, 'tier') - num(b, 'tier')
  };
  if (sorters[listFilters.sort]) demons.sort(sorters[listFilters.sort]);

  return demons;
}

// ------------------------------------------------------
// 5. Vista principal de la lista
// ------------------------------------------------------

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
      </div>

      <div class="list-view-controls panel">
        <div class="filter-popup-wrapper" data-pop-root>
          <button type="button" id="btnOpenFilter" class="btn-filter-toggle button-square" title="${t('view.filters')}">${svgFilter}</button>

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
          ${svgSearch}
          <input type="text" id="searchDemon" class="form-input search-input-field" placeholder="${t('view.search')}" autocomplete="off" spellcheck="false">
          <div id="searchAutocomplete" class="pop autocomplete-dropdown"></div>
        </div>

        <button type="button" id="btnToggleLockDrag" class="button-square toggle" title="${t('view.lock')}"><img alt=""></button>

        <button type="button" id="btnToggleThumb" class="button-square toggle" title="${t('view.thumbYt')}"><img alt=""></button>

        <div class="sort-wrap" data-pop-root>
          <button type="button" id="btnSort" class="form-input select-btn" title="${t('view.sort')}" aria-haspopup="listbox"><span id="sortLabel"></span></button>
          <div id="sortMenu" class="pop pop-menu">
            ${SORT_MODES.map(m => `<button type="button" class="pop-item" data-sort="${m}">${t('sort.' + m)}</button>`).join('')}
          </div>
        </div>

      </div>

      <div class="list-view-body">
        <div class="demons-container" id="demonsContainer"></div>
        <aside class="list-sidebar panel">
          <div id="listStatsContainer"></div>
        </aside>
      </div>
    </div>
  `);

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