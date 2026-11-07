// ======================================================
// 1. Demon card
// ======================================================

function demonStatChip(label, value, cls = '') {
  if (!value) return '';
  return `<span class="d-stat ${cls}"><span class="d-stat-label">${label}</span>${escapeHTML(value)}</span>`;
}

function renderDemonCard(demon, position, index) {
  const ytThumb = viewPrefs.showFaces ? '' : getYouTubeThumbnail(demon.showcase);
  const id = escapeHTML(String(demon.id));
  const extraChips =
    demonStatChip(t('card.date'), demon.winDate, 'd-date') +
    demonStatChip(t('card.attempts'), demon.attempts ? Number(demon.attempts).toLocaleString() : '', 'd-att');

  return `
    <article class="demon-card" data-id="${id}" style="${diffColorStyle(demon.difficulty)};--i:${Math.min(index, 8)}">
      <div class="demon-thumb ${ytThumb ? 'has-yt' : 'default-thumb'}">
        ${ytThumb
          ? `<a href="${escapeHTML(showcaseUrl(demon.showcase))}" target="_blank" rel="noopener" title="${t('card.showcase')}">
               <img src="${ytThumb}" alt="" ${index < 6 ? '' : 'loading="lazy"'} decoding="async">
             </a>`
          : `<img src="${diffIcon(demon.difficulty)}" alt="${escapeHTML(demon.difficulty)}">`}
      </div>

      <div class="demon-details">
        <div class="demon-header">
          <h2 class="demon-name">#${position} - ${escapeHTML(demon.name)}</h2>
          ${demon.isFavorite ? `<img class="demon-fav-star" src="${FAV_ICON.on}" alt="">` : ''}
        </div>
        ${demon.creator ? `<span class="d-creator"><span class="by-full">${t('card.publishedBy', { name: escapeHTML(demon.creator) })}</span><span class="by-short">${t('card.by', { name: escapeHTML(demon.creator) })}</span></span>` : ''}
        <div class="demon-stats-row">
          <span class="d-diff">${ytThumb ? `<img src="${diffIcon(demon.difficulty)}" alt="">` : ''}${escapeHTML(demon.difficulty)}</span>
          ${extraChips}
        </div>
      </div>
      ${extraChips ? `<div class="demon-extra">${extraChips}</div>` : ''}

      <button type="button" class="btn-edit-demon" data-edit-demon="${id}" title="${t('card.edit')}">${svg.Pencil}</button>
      <button type="button" class="btn-add-demon-below" data-add-demon-after="${id}" title="${t('card.addBelow')}">${svg.Plus}</button>
    </article>
  `;
}

function renderDemons() {
  const container = $('demonsContainer');
  if (!container) return;

  updateLockButton();
  const demons = getVisibleDemons();
  updateFilterBar(demons.length);

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
// 2. Barra lateral de estadísticas
// ======================================================

function renderListStats() {
  const container = $('listStatsContainer');
  if (!container) return;

  const demons = currentList.demons || [];
  const hardest = demons.length ? (demons[0].name || '-') : '-';
  const top = demons[0];

  const breakdown = DIFFICULTIES.map(diff => `
    <div class="diff-col">
      <img src="${DIFFICULTY[diff].icon}" alt="${diff}" class="diff-icon" title="${diff}">
      <span class="diff-count">${demons.filter(d => d.difficulty === diff).length}</span>
    </div>
  `).join('');

  const bannerImg = profileState.banner ? `background-image:url('${escapeHTML(profileState.banner)}');` : '';
  const badges = profileBadges();
  const extra = `
    <div class="profile-extra">
      ${badges ? `<div class="hp-badges">${badges}</div>` : ''}
      <div class="ps-block">
        <span class="ps-label">${t('profile.bio')}</span>
        <div class="hp-bio-box"><p class="hp-bio ${profileState.bio ? '' : 'empty'}">${profileState.bio ? escapeHTML(profileState.bio) : t('profile.noBio')}</p></div>
      </div>
      <div class="ps-block" style="gap: 10px">
        <span class="ps-label">${t('home.gdProfile')}</span>
        <div class="hp-gd-row">
          <div class="hp-gd-profile">
            <strong class="hp-gd-name">${escapeHTML(profileState.gdName) || '-'}</strong>
            <span class="hp-gd-id" style="font-size: 11.5px">${t('profile.id', { id: escapeHTML(profileState.gdId) || '-' })}</span>
          </div>
          ${renderGdRank()}
        </div>
      </div>
    </div>`;

  container.innerHTML = `
    <div class="profile-banner-container">
      <div class="profile-banner" style="${bannerStyle()}${bannerImg}"></div>
      <div class="profile-avatar-wrapper">
        <img src="${escapeHTML(getAvatar())}" alt="" class="profile-avatar" onerror="this.onerror=null;this.src='${DEFAULT_AVATAR}'">
      </div>
      ${publicIdText() !== '-' ? `<span class="profile-pid">${t('profile.id', { id: publicIdText() })}</span>` : ''}
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
          <strong class="stat-card-value ${top ? 'is-diff' : ''}" ${top ? `style="${diffColorStyle(top.difficulty)}"` : ''} title="${escapeHTML(hardest)}">${escapeHTML(hardest)}</strong>
        </div>
      </div>

      <div class="diff-breakdown-row">${breakdown}</div>
      ${extra}
    </div>`;

  const subtitle = $('listViewSubtitle');
  if (subtitle) subtitle.textContent = listSubtitleText();
}

// <span class="profile-list-id">${t('view.listId', { id: currentList.id })}</span> // agregar abajo de ${extra} id publicas - version 1.4
// ======================================================
// 3. Autocompletado local
// ======================================================

function searchMatches(query, limit = 8) {
  if (!query) return [];
  const pos = /^#?(\d+)$/.exec(query);
  const byPos = pos ? currentList.demons[Number(pos[1]) - 1] : null;
  const byName = rankMatches(currentList.demons, query, d => d.name, limit);
  return byPos ? [byPos, ...byName.filter(d => d !== byPos)].slice(0, limit) : byName;
}

function renderLocalAutocomplete(query) {
  const dropdown = $('searchAutocomplete');
  if (!dropdown) return;

  const matches = searchMatches(query);
  if (matches.length === 0) return setPop(dropdown, false);

  dropdown.innerHTML = matches.map((m, i) => `
    <div class="autocomplete-item local-item" data-index="${i}" style="${diffColorStyle(m.difficulty)}">
      <div class="local-main">
        <span class="json-name">#${currentList.demons.indexOf(m) + 1} - ${escapeHTML(m.name)}</span>
        ${m.creator ? `<span class="json-creator">${t('list.by', { name: escapeHTML(m.creator) })}</span>` : ''}
      </div>
      <span class="d-diff">${escapeHTML(m.difficulty.replace(' Demon', ''))}</span>
    </div>
  `).join('');
  setPop(dropdown, true);

  dropdown.querySelectorAll('.autocomplete-item').forEach(el => {
    el.addEventListener('click', () => pickSearchResult(matches[Number(el.dataset.index)].id));
  });
}