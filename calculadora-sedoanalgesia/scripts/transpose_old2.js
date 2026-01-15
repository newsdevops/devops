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


// ===== Zoom instantáneo cuando la tarjeta entra COMPLETA en pantalla =====
function disableInstantZoom(wrap){
  if(!wrap) return;
  wrap.classList.remove('has-instant-zoom');

  // quita clase a todas
  wrap.querySelectorAll('.drug-card.is-zoom').forEach(c => c.classList.remove('is-zoom'));

  // desconecta observer si existía
  if (wrap._zoomObserver) {
    try { wrap._zoomObserver.disconnect(); } catch(_e){}
    wrap._zoomObserver = null;
  }
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

  // Si ya había observer, reinicia (porque render reconstruye el DOM)
  if (wrap._zoomObserver) {
    try { wrap._zoomObserver.disconnect(); } catch(_e){}
    wrap._zoomObserver = null;
  }

  // Calcula el “viewport útil” descontando el header fijo
  function getHeaderH(){
    const h = document.querySelector('.app-header')?.getBoundingClientRect().height || 0;
    return Math.round(h);
  }

  function fullyVisible(el){
    const r = el.getBoundingClientRect();
    const headerH = getHeaderH();
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    // margen de tolerancia para no fallar por 1–2px
    const tol = 4;

    // completamente visible *debajo* del header fijo
    return (r.top >= headerH - tol) && (r.bottom <= vh + tol);
  }

  function setZoom(target){
    cards.forEach(c => c.classList.toggle('is-zoom', c === target));
  }

  // 1) Estado inicial (tu “duda del primer fármaco”)
  // Elegimos la primera tarjeta que ya esté completamente visible.
  // Si ninguna lo está, forzamos la primera (para que al entrar en TODOS se note algo).
  function initZoom(){
    const firstFull = cards.find(fullyVisible);
    setZoom(firstFull || cards[0]);
  }

  // 2) Observer: cuando alguna tarjeta está completa, se marca (instantáneo).
  // Usamos threshold alto + comprobación geométrica para fiabilidad.
  const thresholds = [0.95, 0.98, 1];

  const io = new IntersectionObserver((entries)=>{
    // Candidatas: las que estén intersectando fuerte y además sean fullyVisible()
    const candidates = entries
      .filter(e => e.isIntersecting && e.intersectionRatio >= 0.95)
      .map(e => e.target)
      .filter(fullyVisible);

    if(!candidates.length) return;

    // Si varias están completas (pantalla grande), elegimos la más “arriba” (más cercana al header)
    const headerH = getHeaderH();
    candidates.sort((a,b)=>{
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return Math.abs(ra.top - headerH) - Math.abs(rb.top - headerH);
    });

    setZoom(candidates[0]);
  }, {
    root: null,
    threshold: thresholds
  });

  cards.forEach(c => io.observe(c));
  wrap._zoomObserver = io;

  // Inicializa al render (y reintenta tras 1 frame, por si el layout aún no asentó)
  initZoom();
  requestAnimationFrame(initZoom);
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
