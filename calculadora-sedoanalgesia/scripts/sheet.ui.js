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
	
	const splash = document.getElementById('splash');
	
const splashStart = performance.now();

function hideSplashWithMinTime(minMs){
  if (!splash) return;
  const elapsed = performance.now() - splashStart;
  const wait = Math.max(0, minMs - elapsed);

  setTimeout(() => {
    splash.style.opacity = '0';
    splash.style.transition = 'opacity .18s ease';
    setTimeout(() => splash.remove(), 200);
  }, wait);
}


  const pesoInput = document.getElementById('peso');
  const pesoLockBtn = document.getElementById('pesoLockBtn');
  const pesoBadge = document.getElementById('pesoActiveBadge');
  const pesoBox = pesoInput?.closest('.peso-box');

  // -------------------------
  // 1) Indicador de peso activo
  // -------------------------
  function formatPeso(v){
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    if (Number.isNaN(n)) return '—';
    // Muestra 0 o 1 decimal según venga
    return (Math.round(n * 10) / 10).toLocaleString('es-ES', { maximumFractionDigits: 1 });
  }

  
function updatePesoBadge(){
  if (!pesoBadge || !pesoInput) return;

  const val = formatPeso(pesoInput.value);
  const isNarrow = window.matchMedia && window.matchMedia('(max-width: 760px)').matches;

  // En móvil, texto corto para que no se corte
  pesoBadge.textContent = isNarrow ? `Peso: ${val} kg` : `Peso activo: ${val} kg`;
}


  // -------------------------
  // 2) Bloqueo de peso (persistente y robusto)
  // -------------------------
  const LOCK_KEY = 'sedo.pesoLocked.v1';
  let isLocked = localStorage.getItem(LOCK_KEY) === '1';
  let lastPesoValue = pesoInput ? pesoInput.value : '';

  function applyLockState(){
    if (!pesoInput || !pesoLockBtn) return;

    // UI
    pesoLockBtn.setAttribute('aria-pressed', isLocked ? 'true' : 'false');
    pesoLockBtn.textContent = isLocked ? '🔒' : '🔓';
    pesoLockBtn.title = isLocked ? 'Peso bloqueado' : 'Bloquear peso';

    if (pesoBox) pesoBox.classList.toggle('is-locked', isLocked);

    // Para accesibilidad: no lo deshabilitamos (disabled) para que se pueda leer/focus si quieres.
    // En su lugar, bloqueamos cambios por eventos.
    pesoInput.setAttribute('aria-readonly', isLocked ? 'true' : 'false');
  }

  function setLocked(v){
    isLocked = !!v;
    localStorage.setItem(LOCK_KEY, isLocked ? '1' : '0');
    applyLockState();
  }

  // Evita cambios accidentales si está bloqueado
  function preventIfLocked(e){
    if (!isLocked) return false;
    e.preventDefault();
    e.stopPropagation();
    return true;
  }

  // Intercepta acciones típicas que cambian number input
  if (pesoInput){
    // wheel (muy típico que cambie sin querer)
    pesoInput.addEventListener('wheel', (e)=>{
      if (isLocked) {
        e.preventDefault();
      }
    }, { passive: false });

    // teclas que cambian el valor
    pesoInput.addEventListener('keydown', (e)=>{
      if (!isLocked) return;
      const keys = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'];
      if (keys.includes(e.key)) {
        e.preventDefault();
      }
    });

    // pega / input directo
    pesoInput.addEventListener('beforeinput', (e)=>{
      if (isLocked) {
        // bloquea ediciones (typing/paste)
        e.preventDefault();
      }
    });

    // por si el navegador cambia igual (fallback): revertir
    pesoInput.addEventListener('input', ()=>{
      if (isLocked) {
        pesoInput.value = lastPesoValue;
        updatePesoBadge();
        return;
      }
      lastPesoValue = pesoInput.value;
      updatePesoBadge();
      render();
    });
  }

  // Click del botón lock
  pesoLockBtn?.addEventListener('click', ()=>{
    setLocked(!isLocked);
  });

  // Estado inicial
  applyLockState();
  updatePesoBadge();

  // -------------------------
  // 3) Modo oscuro (toggle + persistencia)
  // -------------------------
  const THEME_KEY = 'sedo.theme.v1';
  const themeToggle = document.getElementById('themeToggle');

  function getStoredTheme(){
    const t = localStorage.getItem(THEME_KEY);
    return (t === 'dark' || t === 'light') ? t : null;
  }

  function applyTheme(theme){
    // theme: 'dark' | 'light' | null
    if (theme) document.documentElement.dataset.theme = theme;
    else document.documentElement.removeAttribute('data-theme');

    if (themeToggle){
      const isDark = theme === 'dark' || (!theme && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
      themeToggle.textContent = isDark ? '☀️' : '🌙';
      themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeToggle.title = isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro';
    }
  }

  // init theme
  applyTheme(getStoredTheme());

  // toggle theme
  themeToggle?.addEventListener('click', ()=>{
    const current = getStoredTheme();
    const next = (current === 'dark') ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });

  // -------------------------
  // 4) Tu lógica existente (la dejamos como está)
  // -------------------------
  // OJO: si ya tenías el listener input de peso, ahora lo gestiona el bloque anterior
  // así que NO vuelvas a añadir document.getElementById('peso')?.addEventListener('input',render);

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


	requestAnimationFrame(() => {
	  // un frame extra para dejar que pinte
	  requestAnimationFrame(hideSplash);
	});


 
	//===== MENU + CAMBIO DE VISTA =====
	// Arranca en checklist
	initDrawer('checklist');

	// ===== CHECKLIST =====
	// Arranca limpio (sin restaurar nada)
	if (typeof initChecklist === 'function'){
	  initChecklist({ rootId: 'section-checklist', resetOnStart: true });
	}
	
	hideSplashWithMinTime(3000); // 1.5 segundos mínimo

});
