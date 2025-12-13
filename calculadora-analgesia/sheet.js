
// sheet.js v3.3.1 — filas garantizadas, sticky sin solapes (tbody-offset = header + thead), caps/min Excel, trunc 3 dec sin ceros
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
    <td>${e.farmaco}</td>
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
  const viaTd = tr.children[1]; // 2ª columna = Vía
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


  function render(){
    
const pesoVal = document.getElementById('peso')?.value ?? '0';
const peso = parseFloat(pesoVal.toString().replace(',', '.')) || 0;

    const sedTbody = document.getElementById('body-sedantes');
    const antTbody = document.getElementById('body-antidotos');
    sedTbody.innerHTML=''; antTbody.innerHTML='';

    let prevSed=null, prevAnt=null;
    ENTRADAS.forEach(e=>{
      const tr = fila(e, peso);
      const tgt = (e.categoria==='sedantes'?sedTbody:antTbody);
      const prev = (e.categoria==='sedantes'?prevSed:prevAnt);
      if(prev && prev!==e.farmaco){ tr.classList.add('group-divider'); }
      tgt.appendChild(tr);
      if(e.categoria==='sedantes') prevSed=e.farmaco; else prevAnt=e.farmaco;
    });

    requestAnimationFrame(measureAndSetStickyVars);
    setTimeout(measureAndSetStickyVars, 120);
  }
  
  

  document.addEventListener('DOMContentLoaded', ()=>{
    
  document.getElementById('peso')?.addEventListener('input',render);
  render();

  // ===== MENU + CAMBIO DE VISTA (SEDANTES / ANTÍDOTOS) =====
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  const menuClose = document.getElementById('menuClose');

  const sectionSed = document.getElementById('section-sedantes');
  const sectionAnt = document.getElementById('section-antidotos');
  const menuItems = Array.from(document.querySelectorAll('.menu-item'));
  const tabItems  = Array.from(document.querySelectorAll('.tab-item'));

  function openMenu(){
    sideMenu.classList.add('is-open');
    sideMenu.setAttribute('aria-hidden','false');
    menuBackdrop.hidden = false;
    menuBtn?.setAttribute('aria-expanded','true');
  }

  function closeMenu(){
    sideMenu.classList.remove('is-open');
    sideMenu.setAttribute('aria-hidden','true');
    menuBackdrop.hidden = true;
    menuBtn?.setAttribute('aria-expanded','false');
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
