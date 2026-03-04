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
	
	
// Recalcula variables del header (evita huecos cuando se oculta el peso en ciertas vistas)
window.setAppHeaderVar?.();


    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Click en tabs (header)
  tabItems.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
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