const WELCOME_KEY = 'mdl_welcome_seen';
const LEVELS_TOTAL = 10000;

const welcomeSeen = () => { try { return !!sessionStorage.getItem(WELCOME_KEY); } catch (e) { return true; } };
const markWelcomeSeen = () => { try { sessionStorage.setItem(WELCOME_KEY, '1'); } catch (e) {} };

function enterApp() {
  markWelcomeSeen();
  renderRoute();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function countUp(el, to, duration = 1400, delay = 250) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    el.textContent = to.toLocaleString();
    return;
  }
  const start = performance.now() + delay;
  const tick = (now) => {
    if (!el.isConnected) return;
    const p = Math.min(1, Math.max(0, (now - start) / duration));
    el.textContent = Math.max(1, Math.round(to * (1 - Math.pow(1 - p, 3)))).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  el.textContent = '1';
  requestAnimationFrame(tick);
}

function renderWelcome() {
  setPageTitle();
  mountView(`
    <section class="welcome">
      <h1 class="welcome-eyebrow" style="--d:0">My Demon List</h1>
      <p class="welcome-text" style="--d:1">${t('welcome.text')}</p>

      <div class="welcome-stat" style="--d:2">
        <span class="welcome-stat-row"><span class="welcome-stat-plus">+</span><span class="welcome-stat-num" id="welcomeCount">1</span></span>
        <span class="welcome-stat-label">${t('welcome.levels')}</span>
      </div>

      <div class="welcome-actions" style="--d:3">
        <button type="button" id="btnWelcomeAccount" class="btn-primary">${t('welcome.account')}</button>
        <button type="button" id="btnWelcomeGuest" class="btn-line">${t('welcome.guest')}</button>
      </div>
            <div class="welcome-cards">
        ${[
          [svg.Search, 'f1'],
          [svg.Drag, 'f2'],
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

  countUp($('welcomeCount'), LEVELS_TOTAL);
  $('btnWelcomeGuest').addEventListener('click', enterApp);
  $('btnWelcomeAccount').addEventListener('click', openSignInModal);
}