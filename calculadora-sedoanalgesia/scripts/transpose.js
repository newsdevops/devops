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



// ===== Zoom instantáneo cuando la tarjeta está COMPLETA en pantalla =====
function disableInstantZoom(wrap){
  if(!wrap) return;

  wrap.classList.remove('has-instant-zoom');

  // Quita zoom
 EventListener('scroll', wrap._zoomHandlers.onScroll, { passive: true });  wrap.querySelectorAll('.drug-card.is-zoom').forEach(c => c.classList.remove('is-zoom'));
    window.removeEventListener('resize', wrap._zoomHandlers.onResize);
    wrap._zoomHandlers = null;
  }




function enableInstantZoom(wrap, categoria){
  if(!wrap) return;

  // Solo en estrecho + solo cuando el filtro es "TODOS"
  const shouldEnable = isNarrow() && (filtros && filtros[categoria] === null);
  if(!shouldEnable){
    disableInstantZoom(wrap);
    return;
  }

  const cards = Array.from(wrap.querySelectorAll('.drug-card'));
  if(!cards.length){
    disableInstantZoom(wrap);
    return;
  }

  wrap.classList.add('has-instant-zoom');

  // Si ya estaba activo de antes (render reconstruye), resetea handlers
  if (wrap._zoomHandlers) {
    window.removeEventListener('scroll', wrap._zoomHandlers.onScroll, { passive: true });
    window.removeEventListener('resize', wrap._zoomHandlers.onResize);
    wrap._zoomHandlers = null;
  }

  function getHeaderH(){
    const h = document.querySelector('.app-header')?.getBoundingClientRect().height || 0;
    return Math.round(h);
  }

  function fullyVisible(el){
    const r = el.getBoundingClientRect();
    const headerH = getHeaderH();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    // tolerancia para bordes (evita “no está completo” por 1px)
    const tol = 4;

    // completamente visible debajo del header
    return (r.top >= headerH - tol) && (r.bottom <= vh + tol);
  }

  function setZoom(target){
    cards.forEach(c => c.classList.toggle('is-zoom', c === target));
  }

  // Elige la mejor tarjeta “completa”
  function pickBestFull(){
    const headerH = getHeaderH();

    const full = cards.filter(fullyVisible);
    if (!full.length) return null;

    // Si hay varias completas, elegimos la más cercana a la parte superior útil (debajo del header)
    full.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return Math.abs(ra.top - headerH) - Math.abs(rb.top - headerH);
    });

    return full[0];
  }

  // Actualiza zoom (instantáneo) — funciona igual al bajar y al subir
  let rafId = 0;
  function updateZoom(){
    rafId = 0;
    const best = pickBestFull();
    if (best) {
      setZoom(best);
    } else {
      // Si ninguna está completa, NO cambiamos nada (evita parpadeos).
      // Si prefieres “quitar zoom” cuando ninguna es completa, descomenta:
      // setZoom(null);
    }
  }

  function requestUpdate(){
    if (rafId) return;
    rafId = requestAnimationFrame(updateZoom);
  }

  const onScroll = () => requestUpdate();
  const onResize = () => requestUpdate();

  wrap._zoomHandlers = { onScroll, onResize };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Estado inicial (tu caso del primer fármaco)
  // 1) si hay alguna completa, zoom a esa
  // 2) si no, forzamos la primera para que se note al entrar en TODOS
  const initial = pickBestFull() || cards[0];
  setZoom(initial);

  // Reintento tras un frame (por si el layout no estaba asentado)
  requestAnimationFrame(() => {
    const again = pickBestFull() || cards[0];
    setZoom(again);
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
  
// Zoom instantáneo (solo "TODOS" y modo estrecho)
  enableInstantZoom(wrap, categoria);

  
}
