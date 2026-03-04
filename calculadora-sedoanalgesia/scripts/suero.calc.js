// suero.calc.js
'use strict';

/**
 * Hook de cálculo: aquí conectarás tu lógica validada.
 * Debe devolver un objeto con strings ya formateadas para pintar en UI.
 *
 * @param {number} pesoKg
 * @param {string} modeId
 * @returns {{ ccDia: string, mlH: string, notes?: string }}
 */
 
 // ---- Cálculos (réplica Excel) ----
function calcM2(peso){
  // =(4*B1+7)/(B1+90)
  return (4*peso + 7) / (peso + 90);
}

function calcBasales(peso){
  // =IF(B1<=10,B1*100,IF(B1<=20,((B1-10)*50)+1000,IF(B1>20,((B1-20)*20)+1500)))
  if(peso <= 10) return peso * 100;
  if(peso <= 20) return ((peso - 10) * 50) + 1000;
  return ((peso - 20) * 20) + 1500;
}

function calcVolumenes(peso){
  const basales = calcBasales(peso);
  const mk = (nombre, ccDia, formula) => ({
    nombre,
    ccDia,
    mlh: ccDia / 24,
    formula
  });

  return [
    mk('Basales', basales, DATA.formulas.basales),
    mk('Más 3%', basales + 3*(peso*1000/100), DATA.formulas.mas3),
    mk('Más 5%', basales + 5*(peso*1000/100), DATA.formulas.mas5),
    mk('Más 6%', basales + 6*(peso*1000/100), DATA.formulas.mas6),
    mk('Más 10%', basales + 10*(peso*1000/100), DATA.formulas.mas10),
    mk('Basales y media', basales * 1.5, DATA.formulas.basalesYMedia)
  ];
}
 
function sueroCompute(pesoKg, modeId) {
  // Placeholder seguro: NO calcula nada clínico.
  // Deja esto así hasta que metas tu fórmula validada.
  if (!pesoKg || pesoKg <= 0) {
    return { ccDia: '—', mlH: '—', notes: 'Introduce un peso válido.' };
  }

  return {
    ccDia: '—',
    mlH: '—',
    notes: `Modo seleccionado: ${modeId} (pendiente de fórmula).`,
  };
}

function fmt(n, digits=2){
  if (n === null || n === undefined || n === "") return "";
  if (typeof n === "string") return n;
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(n);
}

function fmtFixed(n, digits=2){
  if (n === null || n === undefined || n === "") return "";
  if (typeof n === "string") return n;
  if (Number.isNaN(n)) return "";
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(n);
}

window.sueroCalc = {
  calcM2,
  calcBasales,
  calcVolumenes,
  fmt,
  fmtFixed
};
