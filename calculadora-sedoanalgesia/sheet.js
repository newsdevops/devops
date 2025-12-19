
// sheet.js v20251215-7 — filas garantizadas, sticky sin solapes (tbody-offset = header + thead), caps/min Excel, trunc 3 dec sin ceros
(function(){
  'use strict';

  const ENTRADAS = [
    // SEDANTES
    {categoria:'sedantes', farmaco:'FENTANILO', via:'IV', dosisPorKg:'1 mcg/kg',   conc:'50 mcg/ml', tiempo:'3-5 min', limites:{max:{valor:75, unidad:'mcg'}}, obs:'Se puede repetir cada 5 min la mitad de la dosis previa.'},
    {categoria:'sedantes', farmaco:'FENTANILO', via:'IV', dosisPorKg:'1.5 mcg/kg', conc:'50 mcg/ml', tiempo:'—',       limites:{max:{valor:75, unidad:'mcg'}}, obs:'Evitar >0,5 ml por narina en la misma administración.'},
    {categoria:'sedantes', farmaco:'FENTANILO', via:'IN', dosisPorKg:'2 mcg/kg',   conc:'50 mcg/ml', tiempo:'—',       limites:{max:{valor:75, unidad:'mcg'}}, obs:'Evitar >0,5 ml por narina en la misma administración.'},

    {categoria:'sedantes', farmaco:'MIDAZOLAM', via:'IV', dosisPorKg:'0.1 mg/kg', conc:'5 mg/ml',  tiempo:'2-3 min', limites:{max:{valor:6, unidad:'mg'}},   obs:'Se puede diluir en 5 ml de SSF para facilitar la administración.'},
    {categoria:'sedantes', farmaco:'MIDAZOLAM', via:'IN', dosisPorKg:'0.3 mg/kg', conc:'5 mg/ml',  tiempo:'—',       limites:{max:{valor:6, unidad:'mg'}},   obs:''},

    {categoria:'sedantes', farmaco:'KETAMINA',   via:'IV', dosisPorKg:'1 mg/kg',   conc:'50 mg/ml', tiempo:'2-3 min', limites:{max:{valor:50, unidad:'mg'}},  obs:'No recomendado < 3 meses. Ritmo máx 0,5 mg/kg/min. Repetir 0,5 mg/kg cada 15 min si precisa.'},
    {categoria:'sedantes', farmaco:'KETAMINA',   via:'IM', dosisPorKg:'2 mg/kg',   conc:'50 mg/ml', tiempo:'—',       limites:{max:{valor:50, unidad:'mg'}},  obs:''},

    {categoria:'sedantes', farmaco:'PROPOFOL',   via:'IV', dosisPorKg:'0.5 mg/kg', conc:'10 mg/ml', tiempo:'2-3 min', limites:null,                           obs:'Admon directa o diluida. Valorar perfusión: 1-4 mg/kg/h tras bolo.'},
    {categoria:'sedantes', farmaco:'PROPOFOL',   via:'IV', dosisPorKg:'1 mg/kg',   conc:'10 mg/ml', tiempo:'2-3 min', limites:null,                           obs:'Repetir 0,5 mg/kg cada 15 min si precisa.'},

    {categoria:'sedantes', farmaco:'ETOMIDATO',  via:'IV', dosisPorKg:'0.15 mg/kg', conc:'2 mg/ml', tiempo:'30-60 s', limites:{max:{valor:20, unidad:'mg'}},  obs:'Administrar IV directa. No tiene efecto analgésico.'},
    {categoria:'sedantes', farmaco:'ETOMIDATO',  via:'IV', dosisPorKg:'0.2 mg/kg',  conc:'2 mg/ml', tiempo:'30-60 s', limites:{max:{valor:20, unidad:'mg'}},  obs:''}, 
	{categoria:'sedantes', farmaco:'DEXMEDETOMIDINA', via:'IV', dosisPorKg:'0.5 mcg/kg',
	conc:'100 mcg/ml', tiempo:'10 min', limites:{max:{valor:100, unidad:'mcg'}}, dosisMaxTxt:'1 mcg/kg/h (máx perfusión)',
	obs:'SIEMPRE administrar en bomba de infusión.'},

	{categoria:'sedantes', farmaco:'DEXMEDETOMIDINA', via:'IV', dosisPorKg:'1 mcg/kg',
	conc:'100 mcg/ml', tiempo:'10 min', limites:{max:{valor:100, unidad:'mcg'}}, dosisMaxTxt:'1 mcg/kg/h (máx perfusión)',
	obs:'Tras infusión inicial continuar PC: 0,2-0,7 mcg/kg/h.'},

    {categoria:'sedantes', farmaco:'DEXMEDETOMIDINA', via:'IN', dosisPorKg:'1-2.5 mcg/kg', conc:'100 mcg/ml', tiempo:'—', limites:{max:{valor:100, unidad:'mcg'}}, calcKg:1.5, obs:'EA: bradicardia, hipotensión, FA, HTA, síntomas digestivos.'},

    // ANTÍDOTOS

	{categoria:'antidotos', farmaco:'NALOXONA', via:'IV', dosisPorKg:'0.01 mg/kg', conc:'0.4 mg/ml', tiempo:'1 min', limites:{max:{valor:0.4, unidad:'mg'}}, enforceLimites:false, // ← NO clampa: sigue calculando aunque supere 0,4 mg 
	obs:'Repetir cada 2-3 min. Diluir hasta 1 ml de SSF. Máx acumulada 10 mg.'},
    {categoria:'antidotos', farmaco:'NALOXONA',   via:'IV', dosisPorKg:'0.1 mg/kg',  conc:'0.4 mg/ml', tiempo:'1 min',    limites:{max:{valor:2, unidad:'mg'}},   obs:''},
    {categoria:'antidotos', farmaco:'FLUMAZENILO',via:'IV', dosisPorKg:'0.01 mg/kg', conc:'0.1 mg/ml', tiempo:'30-60 s',  limites:{max:{valor:0.2, unidad:'mg'}}, obs:'Administrar cada minuto. Diluir hasta 1 ml de SSF. Máx acumulada 1 mg.'},
    {categoria:'antidotos', farmaco:'ATROPINA',   via:'IV', dosisPorKg:'0.02 mg/kg', conc:'1 mg/ml',   tiempo:'30-60 s',  limites:{min:{valor:0.1, unidad:'mg'}, max:{valor:0.2, unidad:'mg'}}, obs:'Administrar cada minuto. Diluir hasta 1 ml de SSF.'},
  ];




	const filtros = {
	  sedantes: null,   // null = TODOS
	  antidotos: null
	};

  const reRango = /^([0-9]+(?:[.,][0-9]+)?)(?:\s*[\-\u2013\u2014]\s*([0-9]+(?:[.,][0-9]+)?))?\s*(mcg|mg)\/kg$/i;
  
function parseUnidad(s) {
  // Ej.: "0.5 mg/kg", "1–2.5 mcg/kg", "1,5 mg/kg"
  const str = String(s || '').trim().toLowerCase();
  const m = str.match(/^(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*(mcg|mg)\/kg$/i);
  if (!m) return null;
  const min = parseFloat(m[1].replace(',', '.'));
  const max = m[2] ? parseFloat(m[2].replace(',', '.')) : null;
  return { min, max, unidad: m[3] };
}

  
function parseConcentracion(s) {
  // Ej.: "5 mg/ml", "100 mcg/ml", "0,4 mg/ml"
  const str = String(s || '').trim().toLowerCase();
  const m = str.match(/^(\d+(?:[.,]\d+)?)\s*(mcg|mg)\/ml$/i);
  if (!m) return null;
  return { valor: parseFloat(m[1].replace(',', '.')), unidad: m[2] };
}

  function trunc(x,d){ const f=Math.pow(10,d); return Math.trunc(x*f)/f; }
  function stripZeros(s){ return s.replace(/\.0+$/,'').replace(/(\.[0-9]*[1-9])0+$/,'$1'); }
  
const fmtES = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 });

// Formateadores extra para el caso "9"
const fmtES1 = new Intl.NumberFormat('es-ES', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});
const fmtES0 = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 0
});

// ¿Tiene un 9 en las primeras 3 posiciones decimales al redondear?
function endsWith9(x){
  const d1 = Math.round(x * 10)  % 10;   // 1ª decimal
  const d2 = Math.round(x * 100) % 10;   // 2ª decimal
  const d3 = Math.round(x * 1000) % 10;  // 3ª decimal
  return d1 === 9 || d2 === 9 || d3 === 9;}

function trunc3(x){ return Math.trunc(x * 1000) / 1000; }

  
function fmtDoseVal(x){ return fmtES.format(trunc3(x)); }

// Formateo "es-ES" con hasta 3 decimales, redondeando (no truncando)
function fmtMlVal(x) {
  const y = Math.round(x * 1000) / 1000; // redondeo a 3 decimales
  return fmtES.format(y);                // máximo 3 decimales, sin ceros de más
}


 

  function convertir(v,de,a){ if(de===a) return v; if(de==='mcg'&&a==='mg') return v/1000; if(de==='mg'&&a==='mcg') return v*1000; return NaN; }
  function aplicarLimites(total,u,lim){ let clamp=0,v=total;
    if(lim){ if(lim.max){ const M=convertir(lim.max.valor, lim.max.unidad, u); if(!isNaN(M)&&v>=M){v=M; clamp=1;} }
             if(lim.min){ const m=convertir(lim.min.valor, lim.min.unidad, u); if(!isNaN(m)&&v<m){v=m; clamp=-1;} } }
    return {valor:v, clamp};
  }
  function calcularFila(peso,e){
    const d=parseUnidad(e.dosisPorKg), c=parseConcentracion(e.conc); if(!d||!c) return {dosis:'—', ml:'—', clamp:0};
    const dosisKg = (typeof e.calcKg==='number') ? e.calcKg : d.min;
    
let total = dosisKg * peso;
const enforce = e.enforceLimites !== false; // por defecto true; esta fila lo pone a false
const { valor: cap, clamp } = enforce
  ? aplicarLimites(total, d.unidad, e.limites)
  : { valor: total, clamp: 0 };
total = cap;

    let vol; if(d.unidad===c.unidad) vol=total/c.valor; else if(d.unidad==='mcg'&&c.unidad==='mg') vol=(total/1000)/c.valor; else if(d.unidad==='mg'&&c.unidad==='mcg') vol=(total*1000)/c.valor;
    return {dosis:`${fmtDoseVal(total)} ${d.unidad}`, ml:`${fmtMlVal(vol)} ml`, clamp};
  }



// Normaliza texto: minúsculas, sin acentos, sin espacios sobrantes
function norm(s){
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')                 // separa diacríticos
    .replace(/[\u0300-\u036f]/g, '')  // elimina diacríticos
    .trim();
}

/**
 * Devuelve el texto fijo de "Dosis Máx" como en el Excel,
 * sin afectar a los cálculos (que siguen usando e.limites).
 */
function getDosisMaxTexto(e) {
  const f = norm(e.farmaco);   // fármaco normalizado
  const v = norm(e.via);       // via normalizada: 'iv', 'in', 'im'
  // Usamos tu parseUnidad existente para diferenciar Naloxona 0.01 vs 0.1
  const d = parseUnidad(e.dosisPorKg); // {min, max, unidad} ó null

  switch (f) {
    case 'fentanilo':
      return '50-75 mcg/dosis';

    case 'midazolam':
      return 'Dosis acumulada: 6 mg';

    case 'ketamina':
      return '50mg/dosis'; // (sin espacio, como indicaste)

    case 'propofol':
      return 'No dosis max.';

    case 'etomidato':
      return '20 mg/dosis';

    case 'dexmedetomidina':
      // Dos primeras filas (IV) -> 1 mcg/kg/h ; tercera (IN) -> 100 mcg
      return (v === 'iv') ? '1 mcg/kg/h' : '100 mcg';

    case 'naloxona':
      // 1ª fila -> 0,4 mg ; 2ª fila -> 2 mg
      if (d && d.unidad === 'mg') {
        // tolerancia por coma/punto y redondeos
        if (Math.abs(d.min - 0.01) < 1e-8) return '0,4 mg';
        if (Math.abs(d.min - 0.1)  < 1e-8) return '2 mg';
      }
      return '—';

    case 'flumazenilo':
      return '0,2 mg';


	case 'atropina':
		return 'Dosis min: 0,01 max: 0,2';


    default:
      // Si algo no coincide, devolvemos '—'
      // (opcionalmente, aquí podrías volver al texto derivado de e.limites)
      return '—';
  }
}







  function fila(e,peso){
    const r=calcularFila(peso,e), tr=document.createElement('tr');
	
	
// === Color por fármaco: NO toca deltas ni layout ===
 tr.style.setProperty('--row-accent', colorFor(e));

 tr.style.setProperty('--row-accent-bg', 'rgba(100, 0, 155, 0.05)'); // ejemplo
// … o calcula el RGBA desde el hex si prefieres (te paso función si la quieres)

	
    tr.classList.add(e.categoria==='sedantes'?'row-sed':'row-ant');

// === NUEVO: textos sin unidades para mostrar solo cifras ===
  const doseText = String(r.dosis).replace(/\s*(mcg|mg)\s*$/i, ''); // "0,16 mg" -> "0,16"
  const mlText   = String(r.ml).replace(/\s*ml\s*$/i,  '');         // "1,85 ml" -> "1,85"


// --- NUEVO: clases para la celda "Dosis (mg)" ---
  const doseClasses = ['dose'];
  // Para ATROPINA NO aplicamos clases de clamp (mantiene fondo azul)
  if (norm(e.farmaco) !== 'atropina') {
    if (r.clamp === 1) doseClasses.push('clamped-max');
    else if (r.clamp === -1) doseClasses.push('clamped-min');
  }

  // --- SUSTITUYE tu tr.innerHTML por este ---


    tr.innerHTML = 
 
 `
    <td class="col-farmaco">${e.farmaco}</td>
    <td>${e.via}</td>
    <td>${e.dosisPorKg}</td>
    <td>${e.conc}</td>

    <!-- Dosis (mg): muestra solo la cifra -->
    <td class="${doseClasses.join(' ')}">${doseText}</td>

    <!-- Dosis (ml): muestra solo la cifra -->
    <td class="vol">${mlText}</td>

    <!-- Dosis Máx: texto fijo como en Excel -->
    <td class="limits">${getDosisMaxTexto(e) || '—'}</td>

    <td>${e.tiempo || '—'}</td>
    <td>${e.obs || ''}</td>
  `;


	  
	  
/* === NUEVO: clasificar la celda "Vía" por tipo === */
  const viaTd = tr.children[1]; // Via es la 2ª columna
  if (viaTd) {
    const mapa = { IV: 'via-iv', IN: 'via-in', IM: 'via-im' };
    const clase = mapa[e.via] || null;
    if (clase) viaTd.classList.add(clase);
  }



    return tr;
  }

  function measureAndSetStickyVars(){
	
	const deltaTop = 350;   // sube la cabecera 10px
	const deltaOff = 300;   // reduce el espaciador 12px

    const app   = document.querySelector('.app-header');
    const thead = document.querySelector('.sheet thead');
    const headerH = app ? Math.round(app.getBoundingClientRect().height) : 0;
    const theadH  = thead ? Math.round(thead.getBoundingClientRect().height) : 40;
    document.documentElement.style.setProperty('--thead-top',    `${headerH - deltaTop}px`);
    document.documentElement.style.setProperty('--thead-height', `${theadH}px`);
    document.documentElement.style.setProperty('--tbody-offset', `${headerH + theadH - deltaOff}px`);
    // Diagnóstico
    let diag = document.getElementById('diag-info');
    if(!diag){ diag = document.createElement('div'); diag.id='diag-info';
      diag.style.cssText='margin:.25rem 0;color:#6b7280;font-size:.8rem;'; document.querySelector('main').appendChild(diag); }
    const sedCount = document.getElementById('body-sedantes')?.children.length||0;
    const antCount = document.getElementById('body-antidotos')?.children.length||0;
    //diag.textContent = `Alturas: header=${headerH}px, thead=${theadH}px • Filas: Sedantes=${sedCount}, Antídotos=${antCount}`;
  }


/* === Paletas y orden por fármaco (color estable por nombre) === */
const COLORS_SED = ['#14b8a6','#0ea5e9','#22c55e','#38bdf8','#3b82f6','#06b6d4']; // verdes↔azules
const COLORS_ANT = ['#f97316','#ef4444','#fb923c','#dc2626','#ea580c','#fca5a5']; // naranjas↔rojos

// Ajusta el orden si quieres otra secuencia de colores
const ORDEN_SED = ['FENTANILO','MIDAZOLAM','KETAMINA','PROPOFOL','ETOMIDATO','DEXMEDETOMIDINA'];
const ORDEN_ANT = ['NALOXONA','FLUMAZENILO','ATROPINA'];

function colorFor(e){
  const arr   = (e.categoria === 'sedantes') ? COLORS_SED : COLORS_ANT;
  const orden = (e.categoria === 'sedantes') ? ORDEN_SED  : ORDEN_ANT;
  const i     = orden.indexOf(e.farmaco);
  const idx   = (i >= 0 ? i : 0) % arr.length; // fallback si no está en la lista
  return arr[idx];
}


  

// =========================================================
// VISTA TRASPUESTA (modo estrecho): tarjetas por fármaco
// - Inyecta estilos y crea contenedores si faltan.
// - Scroll horizontal SOLO cuando un fármaco tiene 3+ columnas.
// =========================================================
const MQ_NARROW = '(max-width: 900px)';
function isNarrow(){
  return !!(window.matchMedia && window.matchMedia(MQ_NARROW).matches);
}

function ensureTransposeStyles(){
  if(document.getElementById('transpose-style')) return;
  const st = document.createElement('style');
  st.id = 'transpose-style';
  st.textContent = `
    /* ===== Vista traspuesta (solo JS) ===== */
    .cards-wrap{ display:none; padding: var(--table-pad, .75rem); }
    .drug-card{ background:#fff; border:1px solid var(--border,#e5e7eb); border-radius:1rem;
      box-shadow:0 8px 22px rgba(0,0,0,.06); margin-bottom:.9rem; overflow:hidden; }
    .drug-card__title{ font-weight:900; padding:.65rem .85rem; border-bottom:1px solid var(--border,#e5e7eb);
      text-transform:uppercase; letter-spacing:.02em; }

    /* Por defecto: SIN scroll horizontal */
    .drug-card__body{ overflow-x: visible; -webkit-overflow-scrolling:touch; }
    /* Solo si el fármaco tiene 3+ columnas */
    .drug-card__body.is-scroll{ overflow-x:auto; }

    /* Grid traspuesto */
    .tgrid{ --cols:1; --col-min:105px; display:grid; width:100%;
	grid-template-columns: 100px repeat(var(--cols), minmax(var(--col-min), 1fr)); }

    /* Celdas */
    
    .tgrid__cell{ padding:.48rem .55rem; border-top:1px solid var(--border,#e5e7eb); min-width:0; overflow-wrap:anywhere; }


    /* Separadores verticales (línea tenue) entre columnas de datos */
    .tgrid__cell:not(.tgrid__label){ border-left:1px solid rgba(148,163,184,.45); }

    /* Etiquetas (1ª columna) un poco más pequeñas */
    .tgrid__label{ font-weight:800; color:#374151; background:#f8fafc;
      font-size:.72rem; letter-spacing:.02em; }
    .tgrid__colhead{ font-weight:900; text-transform:uppercase; background:#fff; font-size:.78rem; }

    /* Reutilizamos colores */
    .tgrid__cell.dose{ background:#9FC5E8; }
    .tgrid__cell.vol{ background:#9BBB59; }
   
	.tgrid__cell.limits{  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .tgrid__cell.clamped-max{ background:#fee2e2 !important; color:#7f1d1d; }
    .tgrid__cell.clamped-min{ background:#ffedd5 !important; color:#78350f; }
    .tgrid__cell.via-iv{ color:var(--via-iv,#C00000); font-weight:900; }
    .tgrid__cell.via-in{ color:var(--via-in,#3072C2); font-weight:900; }
    .tgrid__cell.via-im{ color:var(--via-im,#6CA62C); font-weight:900; }

    /* Modo estrecho: ocultar tabla y mostrar tarjetas */
    @media ${MQ_NARROW}{
      .section .table-wrap{ display:none !important; }
      .cards-wrap{ display:block; }
    }
  `;
  document.head.appendChild(st);
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

    // Cabecera: esquina vacía + columnas
    grid.appendChild(makeDiv('tgrid__cell tgrid__label', ''));
    cols.forEach(e => {
      const head = `${e.via}${e.dosisPorKg ? ' · ' + e.dosisPorKg : ''}`;
      grid.appendChild(makeDiv('tgrid__cell tgrid__colhead', head));
    });

    const addRow = (label, builder) => {
      grid.appendChild(makeDiv('tgrid__cell tgrid__label', label));
      cols.forEach(e => {
        const out = builder(e) || {};
        const cls = ('tgrid__cell ' + (out.cls || '')).trim();
        grid.appendChild(makeDiv(cls, out.text ?? ''));
      });
    };

    addRow('VÍA', (e) => ({ text: e.via || '—', cls: viaClass(e.via) }));
    addRow('DOSIS/PESO', (e) => ({ text: e.dosisPorKg || '—', cls: '' }));
    addRow('PR COM.', (e) => ({ text: e.conc || '—', cls: '' }));

    addRow('DOSIS', (e) => {
      const r = calcularFila(peso, e);
      const doseText = String(r.dosis).replace(/\s*(mcg|mg)\s*$/i, '');
      const cls = ['dose'];
      if(norm(e.farmaco) !== 'atropina'){
        if(r.clamp === 1) cls.push('clamped-max');
        else if(r.clamp === -1) cls.push('clamped-min');
      }
      return { text: doseText || '—', cls: cls.join(' ') };
    });

    addRow('ML', (e) => {
      const r = calcularFila(peso, e);
      const mlText = String(r.ml).replace(/\s*ml\s*$/i, '');
      return { text: mlText || '—', cls: 'vol' };
    });

    addRow('DOSIS MÁX', (e) => ({ text: getDosisMaxTexto(e) || '—', cls: 'limits' }));
    addRow('T. ADMÓN', (e) => ({ text: e.tiempo || '—', cls: '' }));
    addRow('OBS', (e) => ({ text: e.obs || '', cls: '' }));

    body.appendChild(grid);
    card.appendChild(body);
    wrap.appendChild(card);
  }
}
function render(){
  const pesoVal = document.getElementById('peso')?.value ?? '0';
  const peso = parseFloat(pesoVal.toString().replace(',', '.')) || 0;

  // Vista traspuesta en modo estrecho (sin scroll horizontal global)
  if(isNarrow()){
    ensureTransposeStyles();
    document.querySelectorAll('.section .table-wrap').forEach(w => { w.style.display = 'none'; });
    renderCardsFor('sedantes', peso);
    renderCardsFor('antidotos', peso);
    return;
  }else{
    document.querySelectorAll('.section .table-wrap').forEach(w => { w.style.display = ''; });
    const cs = document.getElementById('cards-sedantes');
    const ca = document.getElementById('cards-antidotos');
    if(cs){ cs.hidden = true; cs.innerHTML = ''; }
    if(ca){ ca.hidden = true; ca.innerHTML = ''; }
  }

  const tablaSed = document.getElementById('tabla-sedantes');
  const tablaAnt = document.getElementById('tabla-antidotos');
  tablaSed?.classList.toggle('show-farmaco', filtros.sedantes === null);
  tablaAnt?.classList.toggle('show-farmaco', filtros.antidotos === null);

  const sedTbody = document.querySelector('#tabla-sedantes tbody');
  const antTbody = document.querySelector('#tabla-antidotos tbody');
  if(!sedTbody || !antTbody) return;

  sedTbody.innerHTML = '';
  antTbody.innerHTML = '';

  let prevSed = null, prevAnt = null;

  ENTRADAS.forEach(e => {
    const f = filtros[e.categoria];
    if (f && e.farmaco !== f) return;

    const tr = fila(e, peso);
    const tgt = (e.categoria === 'sedantes') ? sedTbody : antTbody;
    const prev = (e.categoria === 'sedantes') ? prevSed : prevAnt;

    if(prev && prev !== e.farmaco){
      tr.classList.add('group-divider');
    }

    tgt.appendChild(tr);

    if(e.categoria === 'sedantes') prevSed = e.farmaco;
    else prevAnt = e.farmaco;
  });

  requestAnimationFrame(measureAndSetStickyVars);
  setTimeout(measureAndSetStickyVars, 120);
}

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

/* Si cambias filtro desde escritorio (botones), actualiza el dropdown */
function syncDrugDropdown(categoria){
  const id = (categoria === 'sedantes') ? 'drugDD-sedantes' : 'drugDD-antidotos';
  const dd = document.getElementById(id);
  if(dd && typeof dd._sync === 'function') dd._sync();
}
  
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
  // Re-render al cambiar el ancho (activar/desactivar vista traspuesta)
  let __rt;
  window.addEventListener('resize', () => {
    clearTimeout(__rt);
    __rt = setTimeout(render, 80);
  });
  render();

	buildSubmenu('sedantes', 'submenu-sedantes');
	buildSubmenu('antidotos', 'submenu-antidotos');
	
buildDrugSelect('sedantes', 'drugSelect-sedantes');
buildDrugSelect('antidotos', 'drugSelect-antidotos');


buildDrugDropdown('sedantes', 'drugDD-sedantes');
buildDrugDropdown('antidotos', 'drugDD-antidotos');




  // ===== MENU + CAMBIO DE VISTA (SEDANTES / ANTÍDOTOS) =====
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');

  const sectionSed = document.getElementById('section-sedantes');
  const sectionAnt = document.getElementById('section-antidotos');
  
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
	if(view !== 'sedantes' && view !== 'antidotos') return;
  const showSed = view === 'sedantes';
  sectionSed.hidden = !showSed;
  sectionAnt.hidden = showSed;

  setActiveButtons(menuItems, view);
  setActiveButtons(tabItems, view);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}


  // Estado inicial (elige uno)
  setView('sedantes');

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
});

})();
