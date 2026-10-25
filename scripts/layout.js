// ======================================================
// Layout compartido: header y footer
// ------------------------------------------------------
// Lo usan index.html y las páginas legales (privacy / terms).
// Un solo lugar para cambiar el header o el footer.
// ======================================================

const Form_URL = 'https://forms.gle/qRjqUCUfHmjcK4gx5';

// Iconos del header
const svgConfiguration = `
<svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  <circle cx="12" cy="12" r="2" />
</svg>`

const svgHome = `
<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
  <polyline points="9 22 9 12 15 12 15 22"></polyline>
</svg>
`

const svgLang = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04M18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12m-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
</svg>
`

const svgGlobe = `
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
  <path d="M17.9 17.39c-.26-.8-1.01-1.39-1.9-1.39h-1v-3a1 1 0 0 0-1-1H8v-2h2a1 1 0 0 0 1-1V7h2a2 2 0 0 0 2-2v-.41a7.984 7.984 0 0 1 2.9 12.8M11 19.93c-3.95-.49-7-3.85-7-7.93c0-.62.08-1.22.21-1.79L9 15v1a2 2 0 0 0 2 2m1-16A10 10 0 0 0 2 12a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2"/>
</svg>
`

const svgPerfil = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2A5 5 0 1 0 12 12A5 5 0 0 0 12 2ZM4 19C4 15.686 7.582 13 12 13C16.418 13 20 15.686 20 19C20 20.105 19.105 21 18 21H6C4.895 21 4 20.105 4 19Z" />
  </svg>
`

const svgWave = `
<svg xmlns="http://w3.org" viewBox="0 0 24 24" width="16" height="16" class="icon-chevron">
  <path d="M 7.41 8.59 L 12 13.17 L 16.59 8.59 L 18 10 L 12 16 L 6 10 L 7.41 8.59 Z" fill="currentColor" />
</svg>
`

// navegacion - privacy.terms
function goTo(search = '') {
  if (document.body.classList.contains('legal')) location.href = './' + search;
  else navigate(search);
}

// ------------------------------------------------------
// Header
// ------------------------------------------------------

function renderHeader() {
  const header = $('header');
  if (!header) return;

  header.innerHTML = `
    <div class="header-left">
      <div class="header-brand" title="${t('header.homeTitle')}">
        <img src="resources/cube.png" alt="">
        <span>My Demon List</span>
      </div>
      <nav class="header-actions">
        <button type="button" id="btnHeaderMainView" class="btn-header" title="${t('header.home')}">
          ${svgHome}<span class="btn-label">${t('header.home')}</span>
        </button>
        <button type="button" id="btnHeaderSettings" class="btn-header" title="${t('header.settings')}">
          ${svgConfiguration}<span class="btn-label">${t('header.settings')}</span>
        </button>
        <div class="lang-wrap" data-pop-root>
          <button type="button" id="btnHeaderLang" class="btn-header btn-icon" title="${t('header.language')}" aria-label="${t('header.language')}" aria-haspopup="menu">
            ${svgLang}${svgWave}
          </button>
          <div id="langPop" class="pop pop-menu">
            ${LANGS.map(l => `
              <button type="button" class="pop-item ${l.id === currentLang() ? 'active' : ''}" data-lang="${l.id}">${l.name}</button>
            `).join('')}
          </div>
        </div>
      </nav>
    </div>
    <button type="button" id="btnHeaderLogin" class="btn-header btn-link-gd">
      ${svgPerfil}${cloudUser ? escapeHTML(profileState.username) : t('header.login')}
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

// ------------------------------------------------------
// Footer (los textos con data-i18n los rellena applyLanguage)
// ------------------------------------------------------

function renderFooter() {
  const footer = $('footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-card">
      <div class="footer-head">
        <div class="footer-title-group">
          <h2>
            ${svgGlobe}
            My Demon List GD
          </h2>
          <p class="footer-text" data-i18n="footer.text"></p>
        </div>

        <div class="footer-socials">
          <a href="${Form_URL}" class="social-btn" aria-label="Form" title="${t('footer.reports')}" target="_blank">
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
          <span class="footer-copy">© 2026 <a href="./" class="footer-site-link">mydemonlist.com</a> ${t('footer.copy')} <span class="footer-devs">The Gamerlod</span></span>
        </div>

        <nav class="footer-links">
          <a href="privacy.html" data-i18n="legal.privacy"></a>
          <a href="terms.html" data-i18n="legal.terms"></a>
        </nav>
      </div>
    </div>
  `;
}