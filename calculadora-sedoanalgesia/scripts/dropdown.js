// dropdown.js
'use strict';


/**
 * dropdown.js
 * ----------------
 * Dropdown de selección de fármacos (UI para móvil/ventana estrecha).
 * - Construye las opciones (TODOS + fármacos únicos).
 * - Mantiene sincronizado el estado de filtros con la UI.
 * - Al seleccionar una opción, actualiza filtros y dispara render().
 * Este archivo NO decide qué se pinta; solo cambia el filtro y llama a render().
 */


function buildDrugDropdown(categoria, ddId){
  const dd = document.getElementById(ddId);
  if(!dd) return;

  const btn = dd.querySelector('.drug-dd__btn');
  const label = dd.querySelector('.drug-dd__label');
  const panel = dd.querySelector('.drug-dd__panel');
  if(!btn || !label || !panel) return;

  // Construir opciones
  panel.innerHTML = '';

  const items = ['TODOS', ...uniqueFarmacos(categoria)];
  items.forEach((txt, idx) => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'drug-dd__opt';
    opt.dataset.drug = (txt === 'TODOS') ? '' : txt;
    opt.setAttribute('role', 'option');
    opt.textContent = txt;
    panel.appendChild(opt);
  });

  // Sincroniza UI con el estado actual
  function syncUI(){
    const current = filtros[categoria] || null;
    const currentLabel = current ?? 'TODOS';
    label.textContent = currentLabel;

    panel.querySelectorAll('.drug-dd__opt').forEach(b=>{
      const drug = b.dataset.drug || null;
      const active = (current === null && drug === null) || (drug === current);
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  syncUI();

  // abrir/cerrar
  function open(){
    dd.classList.add('is-open');
    btn.setAttribute('aria-expanded', 'true');
}
  function close(){
    dd.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
  }
  function toggle(){
    dd.classList.contains('is-open') ? close() : open();
  }

  // Evitar listeners duplicados
  if(dd.dataset.bound !== '1'){
    dd.dataset.bound = '1';

    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      toggle();
    });

    panel.addEventListener('click', (e)=>{
      const opt = e.target.closest('.drug-dd__opt');
      if(!opt) return;

      const drug = opt.dataset.drug || null; // '' => TODOS
      filtros[categoria] = drug;

      // sincroniza también botones escritorio si existen
      if(typeof syncDrugButtons === 'function') syncDrugButtons(categoria);
      syncDrugSelect(categoria);

      // actualiza la UI del dropdown
      syncUI();

      // renderiza y cierra
      render();
      close();
    });

    // cerrar al click fuera
    document.addEventListener('click', ()=>{
      close();
    });

    // cerrar con ESC
    document.addEventListener('keydown', (e)=>{
      if(e.key === 'Escape') close();
    });
  }

  // Exponer un método de sync por si cambias filtro desde botones escritorio
  dd._sync = syncUI;
}

function syncDrugDropdown(categoria){
  const id = (categoria === 'sedantes') ? 'drugDD-sedantes' : 'drugDD-antidotos';
  const dd = document.getElementById(id);
  if(dd && typeof dd._sync === 'function') dd._sync();
}
