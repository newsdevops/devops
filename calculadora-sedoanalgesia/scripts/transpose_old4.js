// transpose.js
'use strict';


/**
 * transpose.js
 * ----------------
 * Vista “traspuesta” (modo estrecho / móvil) en formato tarjetas.
 * - Detecta si estamos en vista estrecha.
 * - Inyecta estilos específicos para cards (si no existen aún).
 * - Crea/actualiza el contenedor de cards por categoría y genera el grid traspuesto.
 * - Renderiza cards por fármaco usando los mismos datos/cálculos que la tabla.
 * No controla eventos de UI: solo genera la salida (DOM) de la vista traspuesta.
 */


const MQ_NARROW = '(max-width: 900px)';
function isNarrow(){
  return !!(window.matchMedia && window.matchMedia(MQ_NARROW).matches);
}

function setAppHeaderVar(){
  const h = document.querySelector('.app-header')?.getBoundingClientRect().height || 72;
  document.documentElement.style.setProperty('--app-header-h', `${Math.round(h)}px`);
}


function ensureTransposeStyles(){
  // Estilos movidos a sheet.css; se mantiene por compatibilidad
}


function ensureCardsWrap(categoria){
  const id = (categoria === 'sedantes') ? 'cards-sedantes' : 'cards-antidotos';
  let el = document.getElementById(id);
  if(el) return el;
  const sectionId = (categoria === 'sedantes') ? 'section-sedantes' : 'section-antidotos';
  const section = document.getElementById(sectionId);
  if(!section) return null;
  el = document.createElement('div');
  el.className = 'cards-wrap';
  el.id = id;
  el.hidden = true;
  const tableWrap = section.querySelector('.table-wrap');
  if(tableWrap) section.insertBefore(el, tableWrap);
  else section.appendChild(el);
  return el;
}

function viaClass(via){
  const mapa = { IV:'via-iv', IN:'via-in', IM:'via-im' };
  return mapa[via] || '';
}

function makeDiv(cls, txt){
  const d = document.createElement('div');
  d.className = cls;
  if(txt !== undefined && txt !== null) d.textContent = txt;
  return d;
}



// ===== Smooth focus (sin IntersectionObserver) =====
function disableSmoothFocus(wrap){
  if(!wrap) return;
  wrap.classList.remove('has-smooth-focus');

  if (wrap._smoothFocus) {
    window.removeEventListener('scroll', wrap._smoothFocus.onScroll, { passive: true });
    window.removeEventListener('resize', wrap._smoothFocus.onResize);
    wrap._smoothFocus = null;
  }

  wrap.querySelectorAll('.drug-card').forEach(c=>{
    c.style.removeProperty('--focus');
  });
}

/**
 * Aplica foco continuo basado en distancia al centro del viewport:
 * - estable, sin cambios abruptos
 * - solo en modo estrecho + filtro "TODOS"
 */
function enableSmoothFocus(wrap, categoria){
  if(!wrap) return;

  const shouldEnable = isNarrow() && (filtros && filtros[categoria] === null);
  if(!shouldEnable){
    disableSmoothFocus(wrap);
    return;
  }

  const cards = Array.from(wrap.querySelectorAll('.drug-card'));
  if(!cards.length){
    disableSmoothFocus(wrap);
    return;
  }

  wrap.classList.add('has-smooth-focus');

  // Si ya estaba, reinicializa (porque render reconstruye el DOM)
  if (wrap._smoothFocus) {
    disableSmoothFocus(wrap);
    wrap.classList.add('has-smooth-focus');
  }

  // Guardamos el foco actual para suavizar (lerp) sin temblores
  const state = new WeakMap();
  cards.forEach(c => state.set(c, 0));

  let rafId = 0;

  function clamp01(x){ return Math.max(0, Math.min(1, x)); }

  function update(){
    rafId = 0;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    // Línea guía: un poco por encima del centro suele “sentir” mejor
    const guideY = scrollY + (vh * 0.45);

    // Radio de influencia: cuanto mayor, más suave el traspaso entre cards
    const range = Math.max(900, Math.min(1200, vh * 0.7));

    // Calcula targetFocus para cada card según distancia a guideY
    for(const c of cards){
      // OJO: usamos offsetTop/offsetHeight (layout), no boundingClientRect transformado
      const top = c.offsetTop;
      const h = c.offsetHeight || 1;
      const centerY = top + (h / 2);

      const dist = Math.abs(centerY - guideY);
      const target = clamp01(1 - (dist / range));

      // Suavizado (lerp). Subir/bajar alpha cambia “sensación”:
      // 0.12–0.18 va muy bien en móvil.
      const prev = state.get(c) ?? 0;
      const next = prev + (target - prev) * 0.10;

      state.set(c, next);
      c.style.setProperty('--focus', next.toFixed(3));
    }
  }

  function requestUpdate(){
    if(rafId) return;
    rafId = requestAnimationFrame(update);
  }

  // Handlers
  const onScroll = () => requestUpdate();
  const onResize = () => requestUpdate();

  // Guardar para desmontar luego
  wrap._smoothFocus = { onScroll, onResize };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Primer pintado
  requestUpdate();
}




function renderCardsFor(categoria, peso){
  const wrap = ensureCardsWrap(categoria);
  if(!wrap) return;
  wrap.hidden = false;
  wrap.innerHTML = '';

  const list = ENTRADAS.filter(e => {
    if(e.categoria !== categoria) return false;
    const f = filtros[categoria];
    if(f && e.farmaco !== f) return false;
    return true;
  });

  // Agrupa por fármaco preservando orden
  const order = [];
  const map = new Map();
  for(const e of list){
    if(!map.has(e.farmaco)){
      map.set(e.farmaco, []);
      order.push(e.farmaco);
    }
    map.get(e.farmaco).push(e);
  }

  for(const farmaco of order){
    const cols = map.get(farmaco) || [];
    const n = Math.max(1, cols.length);

    const card = makeDiv('drug-card', '');
    card.appendChild(makeDiv('drug-card__title', farmaco));

    const body = makeDiv('drug-card__body', '');
    // Solo mostramos scroll horizontal cuando hay 3 o más columnas
    if(n >= 3) body.classList.add('is-scroll');

    const grid = makeDiv('tgrid', '');
    grid.style.setProperty('--cols', String(n));
    // Con 3+ columnas forzamos overflow (pero sin cambiar el ancho en 1–2 col)
    grid.style.setProperty('--col-min', (n >= 3) ? '120px' : '105px');

    

    const addRow = (label, builder) => {
      grid.appendChild(makeDiv('tgrid__cell tgrid__label', label));
      cols.forEach(e => {
        const out = builder(e) || {};
        const cls = ('tgrid__cell ' + (out.cls || '')).trim();
        grid.appendChild(makeDiv(cls, out.text ?? ''));
      });
    };

    addRow('VÍA', (e) => ({ text: e.via || '—', cls: viaClass(e.via) }));
   addRow('DOSIS/PESO', (e) => ({ text: displayDosisPeso(e), cls: viaClass(e.via) }));
    addRow('PR COMERCIAL.', (e) => ({ text: e.conc || '—', cls: '' }));

    addRow('DOSIS (MG)', (e) => {
      const r = calcularFila(peso, e);
      const doseText = String(r.dosis).replace(/\s*(mcg|mg)\s*$/i, '');
      const cls = ['dose'];
      if(norm(e.farmaco) !== 'atropina'){
        if(r.clamp === 1) cls.push('clamped-max');
        else if(r.clamp === -1) cls.push('clamped-min');
      }
      return { text: doseText || '—', cls: cls.join(' ') };
    });

    addRow('DOSIS (ML)', (e) => {
      const r = calcularFila(peso, e);
      const mlText = String(r.ml).replace(/\s*ml\s*$/i, '');
      return { text: mlText || '—', cls: 'vol' };
    });

    addRow('DOSIS MÁX', (e) => ({ text: getDosisMaxTexto(e) || '—', cls: 'limits' }));
    addRow('T. ADMÓN', (e) => ({ text: e.tiempo || '—', cls: '' }));
    addRow('OBSERVACIONES', (e) => ({ text: e.obs || '', cls: '' }));

    body.appendChild(grid);
    card.appendChild(body);
    wrap.appendChild(card);
  }
  
  

// Foco suave en scroll (solo "TODOS" y modo estrecho)
  enableSmoothFocus(wrap, categoria);


}
