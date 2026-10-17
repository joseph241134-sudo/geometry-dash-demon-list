// ======================================================
// Inicialización y ciclo de vida de la app
// ======================================================
function renderRoute() {
  const params = new URLSearchParams(location.search);
  const listId = params.get('list');

  if (params.get('settings')) openSettingsView();
  else if (listId) openListView(Number(listId));
  else renderMainPage();
}

function initScrollTop() {
  const btn = document.createElement('button');
  btn.id = 'btnScrollTop';
  btn.type = 'button';
  btn.className = 'scroll-top-btn';
  btn.title = t('view.top');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;
  document.body.appendChild(btn);

  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 600), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initGlobalListeners() {
  window.addEventListener('popstate', renderRoute);

  document.addEventListener('click', (e) => {
    document.querySelectorAll('.pop.open').forEach(pop => {
      const root = pop.closest('[data-pop-root]');
      if (!root || !root.contains(e.target)) pop.classList.remove('open');
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modal = topModal();
    if (modal) {
      if (modal.dataset.dismissible) closeModal(modal);
    } else {
      document.querySelectorAll('.pop.open').forEach(pop => pop.classList.remove('open'));
    }
  });
}

function init() {
  loadData();
  applyAppearance();
  applyLanguage();
  renderHeader();
  renderRoute();
  initScrollTop();
  initGlobalListeners();
  warmUpAPI();
}

document.addEventListener('DOMContentLoaded', init);
