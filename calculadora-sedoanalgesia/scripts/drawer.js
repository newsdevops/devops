// drawer.js
'use strict';


/**
 * drawer.js
 * ----------------
 * Menú hamburguesa (drawer) + pestañas (tabs) para cambiar entre “Sedantes” y “Antídotos”.
 * - Abre/cierra el menú lateral con backdrop y accesibilidad básica (aria-...).
 * - Cambia la vista activa (mostrar/ocultar secciones) y marca el botón/tab activo.
 * - Inicializa listeners (click fuera, ESC, etc.).
 * No calcula ni renderiza tablas: solo controla la navegación entre secciones.
 */


function initDrawer(defaultView){
// ===== MENU + CAMBIO DE VISTA (SEDANTES / ANTÍDOTOS) =====
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');

  const sectionSed = document.getElementById('section-sedantes');
  const sectionAnt = document.getElementById('section-antidotos');
 const sectionChk = document.getElementById('section-checklist');
 
 const sectionSuero = document.getElementById('section-sueroterapia');
  
// SOLO botones del drawer que tienen data-view
const menuItems = Array.from(document.querySelectorAll('#sideMenu .menu-item[data-view]'));

// SOLO pestañas del header que tienen data-view
const tabItems  = Array.from(document.querySelectorAll('.tabs .tab-item[data-view]'));

 

  
function openMenu(){
  // mostrar elementos
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


// fuerza reflow para que el transition no se “pierda”
  void sideMenu.offsetWidth;

  // accesibilidad
  sideMenu.setAttribute('aria-hidden','false');
  menuBtn?.setAttribute('aria-expanded','true');

  // activar animación (en el siguiente frame para que el transition funcione)
  requestAnimationFrame(() => {
    sideMenu.classList.add('is-open');
  });
}


 
function closeMenu(){
  // quitar clase para animar salida
  sideMenu.classList.remove('is-open');

  // accesibilidad
  sideMenu.setAttribute('aria-hidden','true');
  menuBtn?.setAttribute('aria-expanded','false');

  // ocultar backdrop ya
  menuBackdrop.hidden = true;

  // al terminar la transición, ocultar el menú del todo
  const onEnd = () => {
    sideMenu.hidden = true;
    sideMenu.removeEventListener('transitionend', onEnd);
  };
  sideMenu.addEventListener('transitionend', onEnd);
}




function setActiveButtons(list, view){
  const sueroSub = window.sueroState?.view || 'calculo';

  list.forEach(btn=>{
    let active = (btn.dataset.view === view);

    // ✅ Si estamos en sueroterapia: marcar activo SOLO el subapartado actual
    if (view === 'sueroterapia' && btn.dataset.view === 'sueroterapia') {
      active = (btn.dataset.sueroView === sueroSub);
    }

    btn.classList.toggle('is-active', active);

    if(btn.getAttribute('role') === 'tab'){
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    }
  });
}



  
function setView(view){
	
 if(!['sedantes','antidotos','checklist','sueroterapia'].includes(view)) return;

  const showSed = view === 'sedantes';
  const showAnt = view === 'antidotos';
  const showChk = view === 'checklist';
  const showSue = view === 'sueroterapia';

  sectionSed.hidden = !showSed;
  sectionAnt.hidden = !showAnt;
  if(sectionChk) sectionChk.hidden = !showChk;
  if(sectionSuero) sectionSuero.hidden = !showSue;
  
// sincroniza tabs de módulo (Sedo/Suero)
if (view === 'sueroterapia') window.setModuleUI?.('suero');
else window.setModuleUI?.('sedo');

  
  
if (showSue) {
  // fuerza subvista por defecto y render inmediato
  if (typeof window.setSueroView === 'function') window.setSueroView('calculo');
  if (typeof window.renderSueroterapia === 'function') window.renderSueroterapia();
}


  setActiveButtons(menuItems, view);
  setActiveButtons(tabItems, view);
  window.scrollTo({ top: 0, behavior: 'smooth' });

}



  // Estado inicial (elige uno)
  setView(defaultView || 'sedantes');

  
menuBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  openMenu();
});

  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  menuItems.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const v = btn.dataset.view;
    setView(v);

    // Si es sueroterapia y viene subvista, aplicarla
    const sv = btn.dataset.sueroView;
    if (v === 'sueroterapia' && sv && typeof window.setSueroView === 'function') {
      window.setSueroView(sv);
      window.renderSueroterapia?.();
    }

    // En móvil cerramos el drawer; en desktop no
    const isDesktop = window.matchMedia && window.matchMedia('(min-width: 900px) and (pointer: fine)').matches;
    closeMenu();
  });
});


tabItems.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    setView(btn.dataset.view);
  });
});


  // Cerrar con ESC
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape' && sideMenu.classList.contains('is-open')){
      closeMenu();
    }
  });
  
  
window.setMainView = setView;
window.getMainView = () => (
  !sectionSuero?.hidden ? 'sueroterapia' :
  !sectionChk?.hidden ? 'checklist' :
  !sectionAnt?.hidden ? 'antidotos' :
  'sedantes'
);

window.syncDrawerActive = () => {
  const v = window.getMainView ? window.getMainView() : defaultView || 'sedantes';
  setActiveButtons(menuItems, v);
  setActiveButtons(tabItems, v);
};



}
