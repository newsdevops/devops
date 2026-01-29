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
  
// SOLO botones del drawer que tienen data-view
const menuItems = Array.from(document.querySelectorAll('#sideMenu .menu-item[data-view]'));

// SOLO pestañas del header que tienen data-view
const tabItems  = Array.from(document.querySelectorAll('.tabs .tab-item[data-view]'));

 

  
function openMenu(){
  // mostrar elementos
  sideMenu.hidden = false;
  menuBackdrop.hidden = false;


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
  list.forEach(btn=>{
    const active = btn.dataset.view === view;
    btn.classList.toggle('is-active', active);

    // Si es un tab (tiene role="tab"), actualizamos aria-selected
    if(btn.getAttribute('role') === 'tab'){
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    }
  });
}

  
function setView(view){
	if(view !== 'sedantes' && view !== 'antidotos' && view !== 'checklist') return;
	const showSed = view === 'sedantes';
	const showAnt = view === 'antidotos';
	const showChk = view === 'checklist';
	sectionSed.hidden = !showSed;
	sectionAnt.hidden = !showAnt;
	if(sectionChk) sectionChk.hidden = !showChk;
	setActiveButtons(menuItems, view);
	setActiveButtons(tabItems, view);
	window.scrollTo({ top: 0, behavior: 'smooth' });
}



  // Estado inicial (elige uno)
  setView(defaultView || 'sedantes');

  menuBtn?.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  menuBackdrop?.addEventListener('click', closeMenu);

  menuItems.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      setView(btn.dataset.view);
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

}
