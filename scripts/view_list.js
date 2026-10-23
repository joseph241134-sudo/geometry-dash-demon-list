// ------------------------------------------------------
// 1. Estado y constantes
// ------------------------------------------------------

let currentList = null;
let isDragLocked = false;
let sortableInstance = null;

let listFilters = { sort: 'custom', difficulty: 'all', favorite: false, search: '' };

const DIFFICULTY = {
  'Easy Demon':    { icon: 'https://gdladder.com/images/demon_logos/easy_128.webp',    color: '#9651cb' },
  'Medium Demon':  { icon: 'https://gdladder.com/images/demon_logos/medium_128.webp',  color: '#e241c2' },
  'Hard Demon':    { icon: 'https://gdladder.com/images/demon_logos/hard_128.webp',    color: '#68de54' },
  'Insane Demon':  { icon: 'https://gdladder.com/images/demon_logos/insane_128.webp',  color: '#d59c31' },
  'Extreme Demon': { icon: 'https://gdladder.com/images/demon_logos/extreme_128.webp', color: '#952020' }
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

function getYouTubeThumbnail(url, quality = 'mqdefault') {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|^)([a-zA-Z0-9_-]{11})/);
  const id = match ? match[1] : url;
  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://i.ytimg.com/vi/${id}/${quality}.jpg` : '';
}

const showcaseUrl = s => (s.includes('http') ? s : `https://youtube.com/watch?v=${s}`);

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
// 5. Vista de la lista (el HTML vive en list.html)
// ------------------------------------------------------

let listViewBound = false;

function playViewEnter() {
  const main = $('main');
  main.classList.remove('view-enter');
  void main.offsetWidth;
  main.classList.add('view-enter');
  setTimeout(() => main.classList.remove('view-enter'), 900);
}

// Eventos: se enlazan una sola vez, el HTML no se vuelve a crear
function bindListView() {
  // ---- filtros ----->
  $('filterDiffGrid').insertAdjacentHTML('beforeend', DIFFICULTIES.map(d => `
    <button type="button" class="filter-diff-pill" data-diff="${d}">${d.replace(' Demon', '')}</button>
  `).join(''));

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

  // ---- orden ----->
  $('btnSort').addEventListener('click', () => setPop($('sortMenu'), !$('sortMenu').classList.contains('open')));
  $('sortMenu').addEventListener('click', (e) => {
    const item = e.target.closest('[data-sort]');
    if (!item) return;
    setSortMode(item.dataset.sort);
    setPop($('sortMenu'), false);
    renderDemons();
  });

  // ---- cards ----->
  $('demonsContainer').addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-edit-demon]');
    if (editBtn) return openEditDemonModal(currentList.id, editBtn.dataset.editDemon);

    const addBtn = e.target.closest('[data-add-demon-after]');
    if (addBtn) openAddDemonModal(currentList.id, addBtn.dataset.addDemonAfter);
  });
}

// Deja los controles en su estado inicial (al abrir y al cambiar de idioma)
function resetListControls() {
  $('searchDemon').value = '';
  ['filterPopup', 'sortMenu', 'searchAutocomplete'].forEach(id => setPop($(id), false));

  $('filterDiffGrid').querySelectorAll('.filter-diff-pill').forEach(b => b.classList.toggle('active', b.dataset.diff === 'all'));

  const fav = $('btnPopupFav');
  fav.classList.remove('active');
  fav.querySelector('img').src = FAV_ICON.off;

  $('sortMenu').innerHTML = SORT_MODES.map(m => `<button type="button" class="pop-item" data-sort="${m}">${t('sort.' + m)}</button>`).join('');

  updateThumbButton();
  syncSortUI();
}

function openListView(listId) {
  currentList = userLists.find(l => l.id === listId);
  if (!currentList) return location.replace('./');

  setPageTitle(currentList.title);
  destroySortable();
  isDragLocked = viewPrefs.dragLocked !== false;
  listFilters = {
    sort: SORT_MODES.includes(viewPrefs.sort) ? viewPrefs.sort : 'custom',
    difficulty: 'all',
    favorite: false,
    search: ''
  };

  if (!listViewBound) { bindListView(); listViewBound = true; }
  resetListControls();

  $('listViewTitle').textContent = currentList.title;
  $('listView').hidden = false;
  playViewEnter();

  renderDemons();
  renderListStats();
}