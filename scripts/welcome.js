const WELCOME_KEY = 'mdl_welcome_seen';
const LEVELS_TOTAL = 10000;

const welcomeSeen = () => { try { return !!localStorage.getItem(WELCOME_KEY); } catch (e) { return true; } };
const markWelcomeSeen = () => { try { localStorage.setItem(WELCOME_KEY, '1'); } catch (e) {} };

function enterApp() {
  markWelcomeSeen();
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

// ======================================================
// 1. Renderizado de vista
// ======================================================

function renderWelcome() {
  setPageTitle();

  const I = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="12 16 16 12 12 8"/><line x1="16" y1="12" x2="5" y2="12"/>
  </svg>`;
  
  mountView(`
    <section class="welcome">
      <div class="welcome-top-pill">
        <div class="welcome-pill" style="--d:0">
          <span class="welcome-pill-dot"></span>
          <span><strong>+<span class="welcome-pill-num" >10.000</span></strong> ${t('welcome.levels')}</span>
        </div>
        <img src="resources/extreme_128.webp" alt="Extreme Demon" onError="this.style.display='none'">
      </div>

      <h1 class="welcome-title" style="--d:1">
        ${t('welcome.h1')}<br>
        <div class="welcome-title-accent"><span>Demon List </span>${svg.Trophy}</div>
      </h1>

      <p class="welcome-text" style="--d:2">${t('welcome.text')}</p>

      <div class="welcome-actions" style="--d:3">
        <button type="button" id="btnWelcomeAccount" class="btn-primary welcome-cta">${I}${t('welcome.account')}</button>
        <button type="button" id="btnWelcomeGuest" class="welcome-cta-2">${t('welcome.guest')}</button>
      </div>

      <div class="welcome-cards">
        ${[
          [svg.Search, 'f1'],
          [svg.Grid, 'f2'],
          [svg.AREDL, 'f3'],
          [svg.Palette, 'f4']
        ].map(([icon, k], i) => `
          <article class="welcome-card" style="--d:${4 + i}">
            <span class="welcome-card-icon">${icon}</span>
            <h3>${t(`welcome.${k}t`)}</h3>
            <p>${t(`welcome.${k}d`)}</p>
          </article>`).join('')}
      </div>
    </section>
  `, false);

  $('btnWelcomeGuest').addEventListener('click', enterApp);
  $('btnWelcomeAccount').addEventListener('click', openSignInModal);
}