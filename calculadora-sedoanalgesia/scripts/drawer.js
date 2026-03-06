// drawer.js
'use strict';

/**
 * drawer.js
 * ----------------
 * Menú hamburguesa (drawer) + pestañas (tabs).
 * - Abre/cierra el menú lateral con backdrop y accesibilidad básica (aria-...).
 * - Cambia la vista activa (mostrar/ocultar secciones) y marca el botón/tab activo.
 * - Inicializa listeners (click fuera, ESC, etc.).
 * No calcula ni renderiza tablas: solo controla navegación entre secciones.
 */
function initDrawer(defaultView){

  // ===== MENU + CAMBIO DE VISTA =====
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');

  // Todas las secciones principales (para ocultar/mostrar genérico)
  const allSections = Array.from(document.querySelectorAll('main > section.section'));

  // SOLO botones del drawer que tienen data-view
  const menuItems = Array.from(document.querySelectorAll('#sideMenu .menu-item[data-view]'));
  // SOLO pestañas del header que tienen data-view
  const tabItems = Array.from(document.querySelectorAll('.tabs .tab-item[data-view]'));
  // Grupos del menú (details)
  const navGroups = Array.from(document.querySelectorAll('#sideMenu details.nav-group'));
  
const subnavButtons = Array.from(document.querySelectorAll('.tabs--subnav .tab-item[data-view]'));

// Tabs nuevos (grupo + subnav)
const navTabs = document.getElementById('navTabs');
const navGroupBtns = Array.from(document.querySelectorAll('#navTabs .tab-item[data-nav]'));
const navDirectBtns = Array.from(document.querySelectorAll('#navTabs .tab-item[data-view]'));
const subnavBars = Array.from(document.querySelectorAll('.tabs--subnav[data-nav]'));
const subnavBtns = Array.from(document.querySelectorAll('.tabs--subnav .tab-item[data-view]'));

  // --- Mapa vista -> grupo del menú que debe quedar abierto ---
  function groupIdForView(view){
    switch(view){
      // Preparación
      case 'procedimientos-sedo': return 'nav-prep';
      case 'checklist': return 'nav-prep';

      // Estrategia
      case 'proc-no-dolorosos': return 'nav-estrategia';
      case 'proc-poco-dolorosos': return 'nav-estrategia';
      case 'proc-muy-dolorosos': return 'nav-estrategia';

      // Calculadora
      case 'sedantes': return 'nav-calc';
      case 'antidotos': return 'nav-calc';
      case 'analgesicos-sistemicos': return 'nav-calc';
      case 'analgesicos-locales': return 'nav-calc';

      // Eventos adversos
      case 'eventos-adversos': return 'nav-adversos';

      // Alta / Hipo
      case 'alta': return 'nav-alta';
      case 'hipoglucemia': return 'nav-hipo';

      default: return null;
    }
  }
  function navKeyForView(view){
  switch(view){
    case 'procedimientos-sedo':
    case 'checklist':
      return 'prep';

    case 'proc-no-dolorosos':
    case 'proc-poco-dolorosos':
    case 'proc-muy-dolorosos':
      return 'estrategia';

    case 'sedantes':
    case 'antidotos':
    case 'analgesicos-sistemicos':
    case 'analgesicos-locales':
      return 'calc';

    default:
      return null; // eventos-adversos, alta, hipoglucemia (sin subtabs)
  }
}
  function hideAllSubnav(){
  subnavBars.forEach(bar => bar.hidden = true);
  subnavBtns.forEach(b => b.classList.remove('is-active'));
}

function setActiveNavGroup(navKey){
  // Marca activo en tabs de grupo
  navGroupBtns.forEach(b => b.classList.toggle('is-active', b.dataset.nav === navKey));

  // Muestra solo la subnav de ese grupo
  subnavBars.forEach(bar => { bar.hidden = (bar.dataset.nav !== navKey); });
}

function setActiveNavDirect(view){
  navDirectBtns.forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
}

  function setActiveNavGroup(navKey){
  if (!navTabs) return;

  // marca activo en tabs de grupo (solo los que tienen data-nav)
  navTabs.querySelectorAll('button.tab-item[data-nav]').forEach(b => {
    b.classList.toggle('is-active', b.dataset.nav === navKey);
  });

  // muestra/oculta las barras subnav
  subnavBars.forEach(bar => {
    bar.hidden = (bar.dataset.nav !== navKey);
  });
}

  function navKeyForView(view){
  switch(view){
    case 'procedimientos-sedo':
    case 'checklist':
      return 'prep';

    case 'proc-no-dolorosos':
    case 'proc-poco-dolorosos':
    case 'proc-muy-dolorosos':
      return 'estrategia';

    case 'sedantes':
    case 'antidotos':
    case 'analgesicos-sistemicos':
    case 'analgesicos-locales':
      return 'calc';

    default:
      return null; // eventos-adversos, alta, hipoglucemia (no tienen subnav)
  }
}

  function setOpenGroupForView(view){
    const wanted = groupIdForView(view);
    navGroups.forEach(d => { d.open = !!(wanted && d.id === wanted); });
  }

  // Si el usuario abre un grupo manualmente, cerramos los demás
  navGroups.forEach(d => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      navGroups.forEach(other => { if (other !== d) other.open = false; });
    });
  });

  function openMenu(){
	  
	  document.body.classList.add('drawer-open');
    sideMenu.hidden = false;
    menuBackdrop.hidden = false;

    const MQ_DESKTOP = '(min-width: 900px) and (pointer: fine)';
    const isDesktop = window.matchMedia && window.matchMedia(MQ_DESKTOP).matches;

    if (isDesktop) {
      sideMenu.hidden = false;
      sideMenu.classList.add('is-open');
      sideMenu.setAttribute('aria-hidden','false');
      menuBackdrop.hidden = false;
      menuBtn?.setAttribute('aria-expanded','true');
    }

    void sideMenu.offsetWidth; // reflow
    sideMenu.setAttribute('aria-hidden','false');
    menuBtn?.setAttribute('aria-expanded','true');
    requestAnimationFrame(() => sideMenu.classList.add('is-open'));
	
	
  }

  function closeMenu(){
	  
	  document.body.classList.remove('drawer-open');
    sideMenu.classList.remove('is-open');
    sideMenu.setAttribute('aria-hidden','true');
    menuBtn?.setAttribute('aria-expanded','false');
    menuBackdrop.hidden = true;

    const onEnd = () => {
      sideMenu.hidden = true;
      sideMenu.removeEventListener('transitionend', onEnd);
    };
    sideMenu.addEventListener('transitionend', onEnd);
  }

  function setActiveButtons(list, view){
    const sueroSub = (window.sueroState && window.sueroState.view) ? window.sueroState.view : 'calculo';

    list.forEach(btn => {
      let active = (btn.dataset.view === view);

      // caso especial suero: si tuvieras subviews en el futuro
      if (view === 'sueroterapia' && btn.dataset.view === 'sueroterapia') {
        active = (btn.dataset.sueroView === sueroSub) || !btn.dataset.sueroView;
      }

      btn.classList.toggle('is-active', active);

      if(btn.getAttribute('role') === 'tab'){
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      }
    });
  }

  // ✅ Lista completa de vistas soportadas
  const VALID_VIEWS = new Set([
    // sedo / calculadora
    'sedantes','antidotos','analgesicos-sistemicos','analgesicos-locales',
    // preparación / estrategia
    'procedimientos-sedo','proc-no-dolorosos','proc-poco-dolorosos','proc-muy-dolorosos',
    // otros
    'eventos-adversos','checklist','alta',
    // módulos
    'sueroterapia','hipoglucemia'
  ]);

  let currentView = null;

  function setView(view){
    if(!VALID_VIEWS.has(view)) return;

    currentView = view;
	
	
// Marca la vista activa en el <body> para estilos específicos
document.body.dataset.view = view;

// Sincroniza tabs de grupo/subtabs con la vista actual
const navKey = navKeyForView(view);
if (navKey) setActiveNavGroup(navKey);

// Marca activo dentro de la subnav (si aplica)
subnavButtons.forEach(b => {
  b.classList.toggle('is-active', b.dataset.view === view);
});


    // Oculta todas y muestra solo la target (genérico)
    allSections.forEach(sec => sec.hidden = true);
    const target = document.getElementById(`section-${view}`);
    if (target) target.hidden = false;

    // Sincroniza tabs de módulo según vista principal
    if (view === 'sueroterapia') window.setModuleUI?.('suero');
    else if (view === 'hipoglucemia') window.setModuleUI?.('hipo');
    else window.setModuleUI?.('sedo');

    // Render hooks (solo donde aplica)
    if (view === 'sueroterapia') {
      window.setSueroView?.('calculo');
      window.renderSueroterapia?.();
    }
    if (view === 'hipoglucemia') window.renderHipoglucemia?.();
    if (view === 'analgesicos-locales') window.renderAnalgesicosLocales?.();

    // Marca activo en menú y tabs
    setActiveButtons(menuItems, view);
    setActiveButtons(tabItems, view);
    setOpenGroupForView(view);
	


if (!navKey) {
  // Vistas sin subtabs -> ocultar subnav + limpiar grupo activo
  hideAllSubnav();
  navGroupBtns.forEach(b => b.classList.remove('is-active'));
  setActiveNavDirect(view);
} else {
  // Vistas con subtabs -> mostrar solo su subnav, marcar grupo, marcar subtab activo
  setActiveNavDirect(null);
  setActiveNavGroup(navKey);
  subnavBtns.forEach(b => b.classList.toggle('is-active', b.dataset.view === view));
}
// Recalcula variables del header (evita huecos cuando se oculta el peso en ciertas vistas)

window.scrollTo({ top: 0, behavior: 'smooth' });
window.updatePesoDockLayout?.();
window.setAppHeaderVar?.();
  }

  // Estado inicial
  setView(defaultView || 'sedantes');

  // Abrir/cerrar menú
  menuBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu();
  });
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  // Click en items del menú
  menuItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      setView(v);
      closeMenu();
    });
  });
// Click en tabs de grupo (data-nav) y directos (data-view)
navTabs?.addEventListener('click', (e) => {
  const btnView = e.target.closest('button.tab-item[data-view]');
  if (btnView) {
    setView(btnView.dataset.view);
    return;
  }

  const btnNav = e.target.closest('button.tab-item[data-nav]');
  if (!btnNav) return;

  const navKey = btnNav.dataset.nav;
  setActiveNavGroup(navKey);

  // Al cambiar de grupo, abre la vista activa de esa subnav (o la primera)
  const bar = subnavBars.find(x => x.dataset.nav === navKey);
  const first = bar?.querySelector('button.tab-item[data-view]');
  const active = bar?.querySelector('button.tab-item.is-active[data-view]') || first;
  if (active) setView(active.dataset.view);
});

// Click en subtabs (data-view)
subnavBars.forEach(bar => {
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('button.tab-item[data-view]');
    if (!btn) return;
    setView(btn.dataset.view);
  });
});
  // Click en tabs (header)
  tabItems.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });
// Click en tabs de grupo y directos
navTabs?.addEventListener('click', (e) => {
  const direct = e.target.closest('button.tab-item[data-view]');
  if (direct) {
    setView(direct.dataset.view);
    return;
  }

  const grp = e.target.closest('button.tab-item[data-nav]');
  if (!grp) return;

  const key = grp.dataset.nav;
  setActiveNavGroup(key);

  // Al pulsar grupo, entra a la primera opción de su subnav
  const bar = subnavBars.find(x => x.dataset.nav === key);
  const first = bar?.querySelector('button.tab-item[data-view]');
  if (first) setView(first.dataset.view);
});

// Click en subtabs
subnavBars.forEach(bar => {
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('button.tab-item[data-view]');
    if (!btn) return;
    setView(btn.dataset.view);
  });
});
  // ESC cierra menú
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && sideMenu.classList.contains('is-open')) closeMenu();
  });

  // API global usada por sheet.ui.js
  window.setMainView = setView;
  window.getMainView = () => currentView || (defaultView || 'sedantes');

  window.syncDrawerActive = () => {
    const v = window.getMainView ? window.getMainView() : (defaultView || 'sedantes');
    setActiveButtons(menuItems, v);
    setActiveButtons(tabItems, v);
    setOpenGroupForView(v);
  };
}