const Form_URL = 'https://forms.gle/qRjqUCUfHmjcK4gx5';

// navegacion - privacy.terms
function goTo(search = '') {
  if (document.body.classList.contains('legal')) location.href = './' + search;
  else navigate(search);
}

// ======================================================
// 1. Header
// ======================================================

function renderHeader() {
  const header = $('header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-left">
      <div class="header-brand" title="My Demon List">
        <img src="resources/copes.png" alt="">
        <span>My <span style="color: var(--button)">Demon</span> List</span>
      </div>
      <nav class="header-actions">
        <button type="button" id="btnHeaderMainView" class="btn-header" title="${t('header.home')}">
          ${svg.Home}<span class="btn-label">${t('header.home')}</span>
        </button>
        <div class="lang-wrap" data-pop-root>
          <button type="button" id="btnHeaderLang" class="btn-header btn-icon" title="${t('header.language')}" aria-label="${t('header.language')}" aria-haspopup="menu">
            ${svg.Lang}${svg.Wave}
          </button>
          <div id="langPop" class="pop pop-menu">
            ${LANGS.map(l => `
            <button type="button" class="pop-item ${l.id === currentLang() ? 'active' : ''}" data-lang="${l.id}">${l.name}</button>
             `).join('')}
          </div>
        </div>
      </nav>
    </div>
    <nav class="header-actions" style="flex: 1; gap: 2px; ">
      <button type="button" id="btnHeaderSettings" class="btn-header" title="${t('header.settings')}" style="margin-left: auto; ">
        ${svg.Configuration}
      </button>
    </nav>
    <button type="button" id="btnHeaderLogin" class="btn-header btn-link-gd">
      ${svg.Perfil}${cloudUser ? escapeHTML(profileState.username) : t('header.login')}
    </button>
  `;

  header.querySelector('.header-brand').addEventListener('click', () => goTo());
  $('btnHeaderMainView').addEventListener('click', () => goTo());
  $('btnHeaderSettings').addEventListener('click', () => goTo('?settings=1'));
  $('btnHeaderLang').addEventListener('click', () => setPop($('langPop'), !$('langPop').classList.contains('open')));
  $('btnHeaderLogin').addEventListener('click', () => (cloudUser ? openAccountModal() : openSignInModal()));

  $('langPop').addEventListener('click', (e) => {
  const item = e.target.closest('[data-lang]');
  if (!item) return;
  setPop($('langPop'), false);
  setLanguage(item.dataset.lang);
});
}

// ======================================================
// 2. Footer
// ======================================================

function renderFooter() {
  const footer = $('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-card">
      <div class="footer-head">
        <div class="footer-title-group">
          <h2>
            ${svg.Globe}
            My Demon List GD
          </h2>
          <p class="footer-text" data-i18n="footer.text"></p>
        </div>

        <div class="footer-socials">
          <a href="${Form_URL}" class="social-btn" data-i18n-title="footer.reports" target="_blank" rel="noopener">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="8" x2="12" y2="14" />
              <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="footer-info-row">
          <span class="footer-copy">© 2026 <a href="./" class="footer-site-link">My Demon List</a> <span data-i18n="footer.copy"></span> <span class="footer-devs">Gabriel</span></span>
        </div>

        <nav class="footer-links">
          <a href="privacy.html" data-i18n="legal.privacy"></a>
          <a href="terms.html" data-i18n="legal.terms"></a>
        </nav>
      </div>
    </div>
  `;
}