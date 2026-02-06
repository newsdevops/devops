// sheet.calc.js
'use strict';


/**
 * sheet.calc.js
 * ----------------
 * - Parsea textos del tipo "0.1 mg/kg" y "5 mg/ml". * Motor de cálculo y formateo (sin tocar el DOM).
 * - Calcula dosis total y volumen (ml) según peso.
 * - Aplica límites (min/max) cuando corresponde y marca si hay “clamp”.
 * - Helpers de presentación: textos de “Dosis Máx”, etiquetas especiales, normalización de texto, color por fármaco, etc.
 * Lo usa sheet.render.js y transpose.js.
 */


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


// Texto mostrado en la fila/columna 'Dosis/Peso' (NO afecta a cálculos)
function displayDosisPeso(e){
  // Caso especial: NALOXONA -> etiquetar Rparcial/Rcompl sin tocar e.dosisPorKg
  if(norm(e.farmaco) === 'naloxona'){
    const d = String(e.dosisPorKg || '').trim();
    // aceptamos coma o punto en el input original
    if(/^0\.01\s*mg\/kg$/i.test(d) || /^0,01\s*mg\/kg$/i.test(d)) return 'Rparcial 0.01 mg/kg';
    if(/^0\.1\s*mg\/kg$/i.test(d)  || /^0,1\s*mg\/kg$/i.test(d))  return 'Rcompl 0.1 mg/kg';
  }
  return e.dosisPorKg || '—';
}

function colorFor(e){
  const arr   = (e.categoria === 'sedantes') ? COLORS_SED : COLORS_ANT;
  const orden = (e.categoria === 'sedantes') ? ORDEN_SED  : ORDEN_ANT;
  const i     = orden.indexOf(e.farmaco);
  const idx   = (i >= 0 ? i : 0) % arr.length; // fallback si no está en la lista
  return arr[idx];
}
