// ======================================================
// Inicialización y ciclo de vida de la app
// ======================================================
function renderRoute() {
  if (document.body.classList.contains('legal')) {
    if (typeof applyLegalLanguage === 'function') applyLegalLanguage();
    return;
  }

  const params = new URLSearchParams(location.search);
  const listId = params.get('list');

  if (params.get('settings')) openSettingsView();
  else if (listId) openListView(Number(listId));
  else if (!welcomeSeen() && !cloudUser) renderWelcome();
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

  window.addEventListener('scroll', () => btn.classList.toggle('show', window.scrollY > 200), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initGlobalListeners() {
  window.addEventListener('popstate', () => {
    if (skipPops > 0) { skipPops--; return; }
    const modal = topModal();
    if (modal) {
      if (modal.dataset.dismissible) closeModal(modal, true);
      else history.pushState({ modal: true }, '');
      return;
    }
    renderRoute();
  });

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

const hasSession = () =>
  Object.keys(localStorage).some(k => /^sb-.+-auth-token$/.test(k)) ||
  /access_token|[?&]code=/.test(location.hash + location.search);

function paintAll() {
  applyAppearance();
  applyLanguage();
  renderHeader();
  renderRoute();
}

function init() {
  loadData();
  applyAppearance();
  initScrollTop();
  initGlobalListeners();
  renderFooter();
  warmUpAPI();
  if (hasSession()) markWelcomeSeen();

  if (!hasSession()) return paintAll();

  document.body.classList.add('booting');
  let painted = false;
  const reveal = () => {
    paintAll();
    document.body.classList.remove('booting');
    if (!painted && cloudUser && !cloudReady) showAlert(t('acc.error'));
    painted = true;
  };
  cloudStart().catch(e => console.error('cloudStart', e)).then(reveal);
  setTimeout(() => { if (!painted && !cloudAwaitingUser) reveal(); }, 8000);
}

function initLegal() {
  loadData();
  applyAppearance();
  initGlobalListeners();
  renderFooter();

  const paint = () => {
    applyLanguage();
    renderHeader();
  };
  paint();
  if (hasSession()) cloudStart().catch(e => console.error('cloudStart', e)).then(paint);
}

document.addEventListener('DOMContentLoaded', () =>
  document.body.classList.contains('legal') ? initLegal() : init());