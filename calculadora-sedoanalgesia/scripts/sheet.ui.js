// sheet.ui.js
'use strict';


/**
 * sheet.ui.js
 * ----------------
 * Capa de UI/eventos y sincronización de controles.
 * - Gestiona input de peso: al cambiar, llama a render().
 * - Crea y sincroniza controles de filtrado por fármaco (botones/submenú, select, dropdown).
 * - Inicializa drawer/tabs (drawer.js) y dropdown (dropdown.js).
 * - En resize: recalcula variables del header (sticky.js) y vuelve a renderizar.
 * Es el “pegamento” entre estado (filtros), controles y render (sheet.render.js).
 */


function uniqueFarmacos(categoria){
  const set = new Set();
  const list = [];
  ENTRADAS.forEach(e=>{
    if(e.categoria !== categoria) return;
    if(!set.has(e.farmaco)){
      set.add(e.farmaco);
      list.push(e.farmaco);
    }
  });
  return list;
}

function buildSubmenu(categoria, containerId){
  const container = document.getElementById(containerId);
  if(!container) return;

  container.innerHTML = '';

  
 // Botón TODOS (recomendado)
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'menu-item drug-btn' + (filtros[categoria] === null ? ' is-active' : '');
  allBtn.dataset.drug = '';
  allBtn.textContent = 'TODOS';
  container.appendChild(allBtn);

  uniqueFarmacos(categoria).forEach(drug => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-item drug-btn' + (filtros[categoria] === drug ? ' is-active' : '');
    btn.dataset.drug = drug;
    btn.textContent = drug; // ya viene en mayúsculas
    container.appendChild(btn);
  });

  // evitar dobles listeners
  if(container.dataset.bound === '1') return;
  container.dataset.bound = '1';

  container.addEventListener('click', (ev) => {
    const b = ev.target.closest('button.drug-btn');
    if(!b) return;

    const drug = b.dataset.drug || null; // '' => TODOS
    filtros[categoria] = drug;

    // iluminar activo
    container.querySelectorAll('button.drug-btn').forEach(x => {
      const active = (drug === null && !x.dataset.drug) || (x.dataset.drug === drug);
      x.classList.toggle('is-active', active);
    });
syncDrugSelect(categoria);
    syncDrugDropdown(categoria);
    render();
  });

}

/* Si cambias filtro desde escritorio (botones), actualiza el dropdown */

  
function buildDrugSelect(categoria, selectId){
  const sel = document.getElementById(selectId);
  if(!sel) return;

  // Rellenar opciones
  sel.innerHTML = '';

  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = 'TODOS';
  sel.appendChild(optAll);

  uniqueFarmacos(categoria).forEach(drug=>{
    const opt = document.createElement('option');
    opt.value = drug;
    opt.textContent = drug; // ya viene en mayúsculas
    sel.appendChild(opt);
  });

  // Valor inicial según filtro actual
  sel.value = filtros[categoria] || '';

  // Evitar duplicar listener
  if(sel.dataset.bound === '1') return;
  sel.dataset.bound = '1';

  sel.addEventListener('change', ()=>{
    const v = sel.value || null;
    filtros[categoria] = v;

    // Sincroniza el submenú de botones (desktop) aunque esté oculto
    syncDrugButtons(categoria);
    syncDrugDropdown(categoria);

    render();
  });
}

/* Actualiza el “iluminado” de los botones del submenú horizontal (desktop) */
function syncDrugButtons(categoria){
  const containerId = (categoria === 'sedantes') ? 'submenu-sedantes' : 'submenu-antidotos';
  const container = document.getElementById(containerId);
  if(!container) return;

  const activeDrug = filtros[categoria]; // null => TODOS

  container.querySelectorAll('button.drug-btn').forEach(btn=>{
    const d = btn.dataset.drug || null;
    const active = (activeDrug === null && d === null) || (d === activeDrug);
    btn.classList.toggle('is-active', active);
  });
}

/* Mantiene el select sincronizado cuando cambias por botones en escritorio */
function syncDrugSelect(categoria){
  const selId = (categoria === 'sedantes') ? 'drugSelect-sedantes' : 'drugSelect-antidotos';
  const sel = document.getElementById(selId);
  if(!sel) return;

  sel.value = filtros[categoria] || '';
}

  document.addEventListener('DOMContentLoaded', ()=>{
    
  document.getElementById('peso')?.addEventListener('input',render);
  setAppHeaderVar();
  // Re-render al cambiar el ancho (activar/desactivar vista traspuesta)
  let __rt;
  window.addEventListener('resize', () => {
    clearTimeout(__rt);
    __rt = setTimeout(() => {
      setAppHeaderVar();
      render();
    }, 80);
  });
  render();

	buildSubmenu('sedantes', 'submenu-sedantes');
	buildSubmenu('antidotos', 'submenu-antidotos');
	
buildDrugSelect('sedantes', 'drugSelect-sedantes');
buildDrugSelect('antidotos', 'drugSelect-antidotos');

buildDrugDropdown('sedantes', 'drugDD-sedantes');
buildDrugDropdown('antidotos', 'drugDD-antidotos');

  // ===== MENU + CAMBIO DE VISTA (SEDANTES / ANTÍDOTOS) =====
 initDrawer();

  // ===== CHECKLIST =====
  if(typeof initChecklist === 'function') initChecklist({ rootId: 'section-checklist' });
});
