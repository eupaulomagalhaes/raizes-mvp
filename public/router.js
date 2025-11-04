const routes = {
  '/': () => import('./pages/splash.js'),
  '/welcome': () => import('./pages/welcome.js'),
  '/login': () => import('./pages/login.js'),
  '/register': () => import('./pages/register.js'),
  '/games': () => import('./pages/games.js'),
  '/games/onde-esta-o-brinquedo': () => import('./games/onde-esta-o-brinquedo.js'),
  '/progress': () => import('./pages/progress.js'),
};

const appRoot = () => document.getElementById('app');

export function navigate(path){
  if (location.hash !== `#${path}`) {
    location.hash = `#${path}`;
  } else {
    // força re-render
    handleRoute();
  }
}

export function initRouter(){
  window.addEventListener('hashchange', handleRoute);
  if (!location.hash) location.hash = '#/';
  handleRoute();
}

async function handleRoute(){
  const path = location.hash.replace('#','') || '/';
  const loader = routes[path];
  const root = appRoot();
  if (!loader) {
    root.innerHTML = `<div class="card p-6">Rota não encontrada.</div>`;
    root.focus();
    return;
  }
  const module = await loader();
  const page = module.default;
  root.innerHTML = page.template();
  if (page.init) page.init({ navigate });
  // foco principal
  const main = root.querySelector('main, [role="main"]') || root.firstElementChild;
  if (main) main.setAttribute('tabindex','-1'), main.focus();
}
