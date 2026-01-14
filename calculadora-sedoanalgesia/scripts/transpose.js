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


function resetCardFocus(wrap){
  if(!wrap) return;
  wrap.classList.remove('has-focus');
  wrap.querySelectorAll('.drug-card').forEach(c=>{
    c.classList.remove('is-active','is-focus','is-blurred');
  });
}

/**
 * Activa el efecto "card en foco" durante el scroll.
 * - Solo cuando categoria está en "TODOS" (filtros[categoria] === null)
 * - Solo en modo estrecho (isNarrow())
 */
function enableCardScrollFocus(wrap, categoria){
  if(!wrap) return;

  // Condición: solo "TODOS" en modo estrecho
  const shouldEnable = isNarrow() && (filtros && filtros[categoria] === null);

  // Si no procede, limpia estado y desconecta observer si existía
  if(!shouldEnable){
    if (wrap._focusObserver) {
      try { wrap._focusObserver.disconnect(); } catch(_e){}
      wrap._focusObserver = null;
    }
    resetCardFocus(wrap);
    return;
  }

  const cards = Array.from(wrap.querySelectorAll('.drug-card'));
  if(!cards.length){
    resetCardFocus(wrap);
    return;
  }

  // Si ya existe observer, lo reiniciamos para las cards nuevas (render reconstruye innerHTML)
  if (wrap._focusObserver) {
    try { wrap._focusObserver.disconnect(); } catch(_e){}
    wrap._focusObserver = null;
  }

  let lastActive = null;

  function applyState(activeCard, strongFocus){
    wrap.classList.toggle('has-focus', !!activeCard);

    cards.forEach(c=>{
      const isActive = (c === activeCard);
      c.classList.toggle('is-active', isActive);
      c.classList.toggle('is-focus', isActive && !!strongFocus);
      c.classList.toggle('is-blurred', !!activeCard && !isActive);
    });
  }

  function isFullyInViewport(el){
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;
    // Pequeña tolerancia para no parpadear por 1px
    const t = 6;
    return (r.top >= 0 - t) && (r.bottom <= vh + t);
  }

  const thresholds = [0, 0.15, 0.33, 0.5, 0.66, 0.8, 0.9, 1];

  const io = new IntersectionObserver((entries)=>{
    // Elegimos la tarjeta con mayor ratio visible
    let best = null;
    let bestRatio = 0;

    for(const e of entries){
      if(!e.isIntersecting) continue;
      if(e.intersectionRatio > bestRatio){
        bestRatio = e.intersectionRatio;
        best = e.target;
      }
    }

    // Si no hay nada razonable visible, limpiamos
    if(!best || bestRatio < 0.20){
      lastActive = null;
      applyState(null, false);
      return;
    }

    // Evita recalcular si es la misma
    lastActive = best;

    // Foco fuerte solo si está completa en pantalla
    const strong = isFullyInViewport(best) && bestRatio >= 0.90;

    applyState(best, strong);
  }, {
    root: null,
    threshold: thresholds
  });

  cards.forEach(c=> io.observe(c));
  wrap._focusObserver = io;

  // Estado inicial (por si ya hay una card bien posicionada al entrar)
  // (fuerza un micro "tick" para que IO haya medido algo)
  requestAnimationFrame(()=> {
    // Si no hay aún entradas, intentamos marcar la más centrada como activa (fallback)
    if(!lastActive){
      const vh = window.innerHeight || 0;
      let best = null, bestDist = Infinity;
      cards.forEach(c=>{
        const r = c.getBoundingClientRect();
        const center = (r.top + r.bottom) / 2;
        const dist = Math.abs(center - vh/2);
        if(dist < bestDist){
          bestDist = dist;
          best = c;
        }
      });
      if(best){
        applyState(best, isFullyInViewport(best));
      }
    }
  });
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
  
  
// Activar efecto de foco durante scroll (solo en "TODOS" y modo estrecho)
  enableCardScrollFocus(wrap, categoria);

}
