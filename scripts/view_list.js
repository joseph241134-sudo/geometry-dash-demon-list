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

const SORT_MODES = ['custom', 'recent', 'oldest', 'attempts_desc', 'attempts_asc', 'tier_desc', 'tier_asc'];

// ------------------------------------------------------
// 2. Utilidades de la vista
// ------------------------------------------------------

const hasActiveFilters = () => !!(listFilters.search || listFilters.difficulty !== 'all' || listFilters.favorite);

function getYouTubeThumbnail(url) {
  if (!url) return '';
  const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/|^)([a-zA-Z0-9_-]{11})/);
  const id = match ? match[1] : url;
  // el id va dentro de un atributo HTML: solo se acepta un id de YouTube válido
  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : '';
}

// Acepta una URL completa o solo el id del video
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
    delay: 150,             
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

// ======================================================
// 6. Demon card
// ======================================================

function demonStatChip(label, value, cls = '') {
  if (!value) return '';
  return `<span class="d-stat ${cls}"><span class="d-stat-label">${label}</span>${escapeHTML(value)}</span>`;
}

function renderDemonCard(demon, position, index) {
  const ytThumb = demon.useDefaultIcon ? '' : getYouTubeThumbnail(demon.showcase);
  const id = escapeHTML(String(demon.id));
  const extraChips =
    demonStatChip(t('card.tier'), demon.tier ? String(demon.tier) : '', 'd-tier') +
    demonStatChip(t('card.attempts'), demon.attempts ? Number(demon.attempts).toLocaleString() : '', 'd-att') +
    demonStatChip(t('card.date'), demon.winDate, 'd-date');

  return `
    <article class="demon-card" data-id="${id}" style="${diffColorStyle(demon.difficulty)};--i:${Math.min(index, 8)}">
      <div class="demon-thumb ${ytThumb ? 'has-yt' : 'default-thumb'}">
        ${ytThumb
          ? `<a href="${escapeHTML(showcaseUrl(demon.showcase))}" target="_blank" rel="noopener" title="${t('card.showcase')}">
               <img src="${ytThumb}" alt="" loading="lazy" decoding="async">
             </a>`
          : `<img src="${diffIcon(demon.difficulty)}" alt="${escapeHTML(demon.difficulty)}">`}
      </div>

      <div class="demon-details">
        <div class="demon-header">
          <h2 class="demon-name">#${position} - ${escapeHTML(demon.name)}</h2>
          ${demon.peak ? `<span class="d-peak">- #${Math.floor(Number(demon.peak))}</span>` : ''}
          ${demon.isFavorite ? `<img class="demon-fav-star" src="${FAV_ICON.on}" alt="">` : ''}
        </div>
        ${demon.creator ? `<span class="d-creator">${t('card.publishedBy', { name: escapeHTML(demon.creator) })}</span>` : ''}
        <div class="demon-stats-row">
          <span class="d-diff">${escapeHTML(demon.difficulty)}</span>
          ${extraChips}
        </div>
      </div>
            ${extraChips ? `<div class="demon-extra">${extraChips}</div>` : ''}

      <button type="button" class="btn-edit-demon" data-edit-demon="${id}" title="${t('card.edit')}">✎</button>
      <button type="button" class="btn-add-demon-below" data-add-demon-after="${id}" title="${t('card.addBelow')}">+</button>
    </article>
  `;
}

function renderDemons() {
  const container = $('demonsContainer');
  if (!container) return;

  updateLockButton();
  const demons = getVisibleDemons();

  if (demons.length === 0) {
    const hasAny = currentList.demons.length > 0;
    container.innerHTML = `
      <div class="demons-empty">
        <p class="demons-empty-title">${hasAny ? t('view.noMatch') : t('view.empty')}</p>
        <p class="demons-empty-text">${hasAny ? t('view.noMatchText') : t('view.emptyText')}</p>
        ${!hasAny ? `<button type="button" id="btnEmptyAddDemon" class="btn-primary" style="margin-top: 12px;">${t('view.addDemon')}</button>` : ''}
      </div>
    `;
    
    const emptyBtn = container.querySelector('#btnEmptyAddDemon');
    if (emptyBtn) {
      emptyBtn.addEventListener('click', () => openAddDemonModal(currentList.id));
    }
    return;
  }

  container.innerHTML = demons
  .map((d, i) => renderDemonCard(d, d.originalPosition, i))
  .join('');
  initSortable();
}

// ======================================================
// 7. Barra lateral de estadísticas
// ======================================================

function renderListStats() {
  const container = $('listStatsContainer');
  if (!container) return;

  const demons = currentList.demons || [];
  const hardest = demons.length ? (demons[0].name || '-') : '-';

  const breakdown = DIFFICULTIES.map(diff => `
    <div class="diff-col">
      <img src="${DIFFICULTY[diff].icon}" alt="${diff}" class="diff-icon" title="${diff}">
      <span class="diff-count">${demons.filter(d => d.difficulty === diff).length}</span>
    </div>
  `).join('');

  const bannerImg = profileState.banner ? `background-image:url('${escapeHTML(profileState.banner)}');` : '';

  container.innerHTML = `
    <div class="profile-banner-container">
      <div class="profile-banner" style="${bannerStyle()}${bannerImg}"></div>
      <div class="profile-avatar-wrapper">
        <img src="${escapeHTML(getAvatar())}" alt="" class="profile-avatar" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">
      </div>
    </div>

    <div class="profile-body">
      <h3 class="profile-title">${escapeHTML(profileState.username) || '-'}</h3>
      <span class="profile-handle">${escapeHTML(currentList.title || '-')}</span>

      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card-label">Demons</span>
          <strong class="stat-card-value">${demons.length}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card-label">Hardest</span>
          <strong class="stat-card-value" title="${escapeHTML(hardest)}">${escapeHTML(hardest)}</strong>
        </div>
      </div>

      <div class="diff-breakdown-row">${breakdown}</div>
      <div class="profile-footer">${t('view.footer')}</div>
    </div>
  `;

  const subtitle = $('listViewSubtitle');
  if (subtitle) subtitle.textContent = listSubtitleText();
}

// ======================================================
// 8. Autocompletado del buscador
// ======================================================

function renderLocalAutocomplete(query) {
  const dropdown = $('searchAutocomplete');
  if (!dropdown) return;

  const matches = query ? rankMatches(currentList.demons, query, d => d.name, 5) : [];
  if (matches.length === 0) return setPop(dropdown, false);

  dropdown.innerHTML = matches.map((m, i) => `
    <div class="autocomplete-item local-item" data-index="${i}" style="${diffColorStyle(m.difficulty)}">
      <span class="json-name">${escapeHTML(m.name)}</span>
      <span class="d-diff">${escapeHTML(m.difficulty.replace(' Demon', ''))}</span>
    </div>
  `).join('');
  setPop(dropdown, true);

  dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('click', () => {
      const input = $('searchDemon');
      input.value = matches[Number(el.dataset.index)].name;
      listFilters.search = input.value.trim();
      setPop(dropdown, false);
      renderDemons();
    });
  });
}