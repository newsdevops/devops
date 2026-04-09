// drawer.js
'use strict';
/**
 * Menú hamburguesa (drawer) + pestañas (tabs)
 * - Cierre con botón abajo derecha
 * - Tap fuera -> cierra
 * - Escape -> cierra
 * - Swipe down -> cerrar (desde grabber o cabecera)
 */
function initDrawer(defaultView){
  const menuBtn = document.getElementById('menuBtn');
  const menuBtnBottom = document.getElementById('menuBtnBottom');
  const sideMenu = document.getElementById('sideMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');

  const allSections = Array.from(document.querySelectorAll('main > section.section'));
  const menuItems = Array.from(document.querySelectorAll('#sideMenu .menu-item[data-view]'));
  const tabItems = Array.from(document.querySelectorAll('.tabs .tab-item[data-view]'));
  const navGroups = Array.from(document.querySelectorAll('#sideMenu details.nav-group'));

  const navTabs = document.getElementById('navTabs');
  const navGroupBtns = Array.from(document.querySelectorAll('#navTabs .tab-item[data-nav]'));
  const navDirectBtns = Array.from(document.querySelectorAll('#navTabs .tab-item[data-view]'));
  const subnavBars = Array.from(document.querySelectorAll('.tabs--subnav[data-nav]'));
  const subnavBtns = Array.from(document.querySelectorAll('.tabs--subnav .tab-item[data-view]'));

  const triggerButtons = [menuBtn, menuBtnBottom].filter(Boolean);
  let currentView = null;
  let lastOpener = null;

  const VALID_VIEWS = new Set([
    'sedantes','antidotos','analgesicos-sistemicos','analgesicos-locales',
    'procedimientos-sedo','proc-no-dolorosos','proc-poco-dolorosos','proc-muy-dolorosos',
    'eventos-adversos','checklist','alta','sueroterapia','hipoglucemia'
  ]);

  function sectionIdForView(view){
    return `section-${view}`;
  }

  function groupIdForView(view){
    switch(view){
      case 'procedimientos-sedo':
      case 'checklist': return 'nav-prep';
      case 'proc-no-dolorosos':
      case 'proc-poco-dolorosos':
      case 'proc-muy-dolorosos': return 'nav-estrategia';
      case 'sedantes':
      case 'antidotos':
      case 'analgesicos-sistemicos':
      case 'analgesicos-locales': return 'nav-calc';
      case 'eventos-adversos': return 'nav-adversos';
      case 'alta': return 'nav-alta';
      default: return null;
    }
  }

  function navKeyForView(view){
    switch(view){
      case 'procedimientos-sedo':
      case 'checklist': return 'prep';
      case 'proc-no-dolorosos':
      case 'proc-poco-dolorosos':
      case 'proc-muy-dolorosos': return 'estrategia';
      case 'sedantes':
      case 'antidotos':
      case 'analgesicos-sistemicos':
      case 'analgesicos-locales': return 'calc';
      default: return null;
    }
  }

  function syncExpanded(expanded){
    triggerButtons.forEach(btn => btn.setAttribute('aria-expanded', expanded ? 'true' : 'false'));
  }

  function resetSheetDragStyles(){
    if (!sideMenu) return;
    sideMenu.style.transform = '';
    sideMenu.style.transition = '';
    if (menuBackdrop) menuBackdrop.style.opacity = '';
    document.body.classList.remove('drawer-dragging');
  }

  function openMenu(opener){
    if (!sideMenu || !menuBackdrop) return;
    lastOpener = opener || document.activeElement;
    resetSheetDragStyles();
    sideMenu.hidden = false;
    menuBackdrop.hidden = false;
    requestAnimationFrame(() => {
      sideMenu.classList.add('is-open');
      document.body.classList.add('drawer-open');
      sideMenu.setAttribute('aria-hidden', 'false');
      syncExpanded(true);
      sideMenu.focus({ preventScroll: true });
    });
  }

  function closeMenu(options = {}){
    const { restoreFocus = true } = options;
    if (!sideMenu || !menuBackdrop) return;
    resetSheetDragStyles();
    sideMenu.classList.remove('is-open');
    document.body.classList.remove('drawer-open');
    sideMenu.setAttribute('aria-hidden', 'true');
    syncExpanded(false);

    const finish = () => {
      sideMenu.hidden = true;
      menuBackdrop.hidden = true;
      sideMenu.removeEventListener('transitionend', finish);
      if (restoreFocus && lastOpener && typeof lastOpener.focus === 'function') {
        lastOpener.focus({ preventScroll: true });
      }
    };

    sideMenu.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 260);
  }

  function hideAllSubnav(){
    subnavBars.forEach(bar => { bar.hidden = true; });
    subnavBtns.forEach(btn => btn.classList.remove('is-active'));
  }

  function setActiveNavGroup(navKey){
    navGroupBtns.forEach(btn => btn.classList.toggle('is-active', btn.dataset.nav === navKey));
    subnavBars.forEach(bar => { bar.hidden = bar.dataset.nav !== navKey; });
  }

  function setActiveNavDirect(view){
    navDirectBtns.forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === view));
  }

  function setOpenGroupForView(view){
    const wanted = groupIdForView(view);
    navGroups.forEach(group => { group.open = !!(wanted && group.id === wanted); });
  }

  function setActiveButtons(list, view){
    list.forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === view));
  }

  function setView(view){
    if (!VALID_VIEWS.has(view)) return;
    currentView = view;
    document.body.dataset.view = view;

    const targetId = sectionIdForView(view);
    allSections.forEach(section => { section.hidden = section.id !== targetId; });

    setActiveButtons(menuItems, view);
    setActiveButtons(tabItems, view);
    setOpenGroupForView(view);

    const navKey = navKeyForView(view);
    if (navKey) {
      setActiveNavDirect(null);
      setActiveNavGroup(navKey);
      subnavBtns.forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === view));
    } else {
      hideAllSubnav();
      navGroupBtns.forEach(btn => btn.classList.remove('is-active'));
      setActiveNavDirect(view);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    window.updatePesoDockLayout?.();
    window.setAppHeaderVar?.();
    window.dispatchEvent(new CustomEvent('mainviewchange', { detail: { view } }));
  }

  navGroups.forEach(group => {
    group.addEventListener('toggle', () => {
      if (!group.open) return;
      navGroups.forEach(other => { if (other !== group) other.open = false; });
    });
  });

  menuBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu(menuBtn);
  });

  menuBtnBottom?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openMenu(menuBtnBottom);
  });

  menuClose?.addEventListener('click', () => closeMenu());
  menuBackdrop?.addEventListener('click', () => closeMenu());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sideMenu && !sideMenu.hidden && sideMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });

  menuItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      setView(view);
      closeMenu({ restoreFocus: false });
    });
  });

  navTabs?.addEventListener('click', (e) => {
    const direct = e.target.closest('button.tab-item[data-view]');
    if (direct) { setView(direct.dataset.view); return; }
    const group = e.target.closest('button.tab-item[data-nav]');
    if (!group) return;
    const navKey = group.dataset.nav;
    setActiveNavGroup(navKey);
    const bar = subnavBars.find(x => x.dataset.nav === navKey);
    const active = bar?.querySelector('button.tab-item.is-active[data-view]');
    const first = bar?.querySelector('button.tab-item[data-view]');
    const next = active || first;
    if (next) setView(next.dataset.view);
  });

  subnavBars.forEach(bar => {
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('button.tab-item[data-view]');
      if (!btn) return;
      setView(btn.dataset.view);
    });
  });

  tabItems.forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  let dragStartY = 0;
  let dragCurrentY = 0;
  let draggingSheet = false;
  const DRAG_START_SELECTOR = '.side-menu__grabber, .side-menu__header';
  const SWIPE_CLOSE_THRESHOLD = 85;

  function onSheetTouchStart(e){
    if (!sideMenu || sideMenu.hidden || !sideMenu.classList.contains('is-open')) return;
    const startZone = e.target.closest(DRAG_START_SELECTOR);
    if (!startZone) return;
    draggingSheet = true;
    dragStartY = e.touches[0].clientY;
    dragCurrentY = dragStartY;
    sideMenu.style.transition = 'none';
    document.body.classList.add('drawer-dragging');
  }

  function onSheetTouchMove(e){
    if (!draggingSheet || !sideMenu) return;
    dragCurrentY = e.touches[0].clientY;
    const dy = Math.max(0, dragCurrentY - dragStartY);
    sideMenu.style.transform = `translateY(${dy}px)`;
    if (menuBackdrop) {
      const opacity = Math.max(0, 1 - (dy / 220));
      menuBackdrop.style.opacity = String(opacity);
    }
  }

  function onSheetTouchEnd(){
    if (!draggingSheet || !sideMenu) return;
    const dy = Math.max(0, dragCurrentY - dragStartY);
    draggingSheet = false;
    resetSheetDragStyles();
    if (dy > SWIPE_CLOSE_THRESHOLD) closeMenu({ restoreFocus: false });
  }

  sideMenu?.addEventListener('touchstart', onSheetTouchStart, { passive: true });
  sideMenu?.addEventListener('touchmove', onSheetTouchMove, { passive: true });
  sideMenu?.addEventListener('touchend', onSheetTouchEnd);
  sideMenu?.addEventListener('touchcancel', () => {
    draggingSheet = false;
    resetSheetDragStyles();
  });

  setView(defaultView || 'sedantes');
  syncExpanded(false);

  window.setMainView = setView;
  window.getMainView = () => currentView || defaultView || 'sedantes';
  window.syncDrawerActive = () => {
    const view = window.getMainView();
    setActiveButtons(menuItems, view);
    setActiveButtons(tabItems, view);
    setOpenGroupForView(view);
  };
}
