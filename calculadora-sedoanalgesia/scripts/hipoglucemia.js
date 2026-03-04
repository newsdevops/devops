// Basado en otro.xlsx (hoja "HIPOGLUCEMIA").
// Se recalculan volúmenes/ritmos en función del peso, replicando las cuentas implícitas del Excel.


(function () {
'use strict';


const DATA = {
  defaults: {
    // Peso inicial encontrado en el Excel
    pesoKg: 13.5,
  },

  // Concentraciones típicas:
  // SG 10% = 10 g/100 ml = 100 mg/ml
  // SG 25% = 25 g/100 ml = 250 mg/ml
  conc: {
    sg10_mg_ml: 100,
    sg25_mg_ml: 250,
  },

  formulas: {
    bolo_rn_sg10:  "vol_ml = (200 mg/kg * peso) / 100 (mg/ml)",
    bolo_nino_sg10:"vol_ml = (500 mg/kg * peso) / 100 (mg/ml)",
    bolo_sg25:     "vol_ml = (500 mg/kg * peso) / 250 (mg/ml)",
    mant_rn:       "ml/h = (8 mg/kg/min * peso / 100) * 60",
    mant_nino:     "ml/h = (5 mg/kg/min * peso / 100) * 60",
    glucagon:      "0,03 mg/kg (máx 1 mg)"
  }
};

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

function fmt(n, digits=2){
  if(n === null || n === undefined || n === "") return "";
  if(typeof n === 'string') return n;
  if(Number.isNaN(n)) return "";
  return new Intl.NumberFormat('es-ES', {maximumFractionDigits: digits}).format(n);
}

function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('is-show');
  window.clearTimeout(toast._id);
  toast._id = window.setTimeout(()=>t.classList.remove('is-show'), 2200);
}

function escapeHtml(str){
  return String(str)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#039;');
}

// ---- Cálculos ----
function volBolo(pesoKg, dosisMgKg, concMgMl){
  return (dosisMgKg * pesoKg) / concMgMl;
}

function ritmoMantenimiento(pesoKg, mgKgMin, concMgMl){
  // ml/h = (mg/min) / (mg/ml) * 60
  const mgMin = mgKgMin * pesoKg;
  return (mgMin / concMgMl) * 60;
}

function calcAll(pesoKg){
  return {
    bolo: [
  {
    paciente: 'RN',
    dosis: '200 mg de glucosa / kg',
    soluciones: [
      {
        sol: 'SG 10%:',
        cls: 'sg10',
        valor: volBolo(pesoKg, 200, DATA.conc.sg10_mg_ml),
        unidad: 'ml',
        tiempo: 'a pasar en 2-3 min',
        formula: DATA.formulas.bolo_rn_sg10
      }
    ]
  },
  {
    paciente: 'NIÑO',
    dosis: '500 mg de glucosa / kg',
    soluciones: [
      {
        sol: 'SG 10%:',
        cls: 'sg10',
        valor: volBolo(pesoKg, 500, DATA.conc.sg10_mg_ml),
        unidad: 'ml',
        tiempo: 'a pasar en 2-3 min',
        formula: DATA.formulas.bolo_nino_sg10
      },
      {
        sol: 'SG 25%:',
        cls: 'sg25',
        valor: volBolo(pesoKg, 500, DATA.conc.sg25_mg_ml),
        unidad: 'ml',
        tiempo: 'a pasar en 5 min',
        formula: DATA.formulas.bolo_sg25
      }
    ]
  }
],


mant: [
  {
    paciente: 'RN',
    aporte: '8 mg de glucosa / kg / min',
    solucion: 'SG 10%',
    valor: ritmoMantenimiento(pesoKg, 8, DATA.conc.sg10_mg_ml),
    unidad: 'ml/h'
  },
  {
    paciente: 'NIÑO',
    aporte: '5 mg de glucosa / kg / min',
    solucion: 'SG 10%',
    valor: ritmoMantenimiento(pesoKg, 5, DATA.conc.sg10_mg_ml),
    unidad: 'ml/h'
  }
],

    glucagonMg: Math.min(0.03 * pesoKg, 1)
  };
}

// ---- Render ----
function renderBolo(rows){
  const tbody = $('#tablaBolo tbody');
  tbody.innerHTML = '';

  for (const r of rows){
    const tr = document.createElement('tr');

    tr.classList.add(
      r.paciente === 'RN' ? 'hipo-rn' :
      r.paciente === 'NIÑO' ? 'hipo-nino' : ''
    );

    const sols = r.soluciones || [];
    const multi = sols.length > 1;

    const solHtml = `
      <div class="hipo-lines ${multi ? 'is-multi' : ''}">
        ${sols.map(s => `
          <div class="hipo-line ${escapeHtml(s.cls || '')}">
            <span class="hipo-sol">${escapeHtml(s.sol)}</span>
          </div>
        `).join('')}
      </div>
    `;

    const resHtml = `
      <div class="hipo-lines ${multi ? 'is-multi' : ''}">
        ${sols.map(s => `
          <div class="hipo-line ${escapeHtml(s.cls || '')}">
            <span class="hipo-val">${fmt(s.valor, 0)} ${escapeHtml(s.unidad || '')}</span>
            <span class="hipo-time">${escapeHtml(s.tiempo || '')}</span>
          </div>
        `).join('')}
      </div>
    `;

    tr.innerHTML = `
      <td>${escapeHtml(r.paciente)}</td>
      <td>${escapeHtml(r.dosis)}</td>
      <td>${solHtml}</td>
      <td>${resHtml}</td>
    `;

    tbody.appendChild(tr);
  }
}



function renderMantenimiento(rows){
  const tbody = $('#tablaMantenimiento tbody');
  tbody.innerHTML = '';

  for(const r of rows){
    const tr = document.createElement('tr');

    // Colores por fila RN/NIÑO
    tr.classList.add(
      r.paciente === 'RN' ? 'hipo-rn' :
      r.paciente === 'NIÑO' ? 'hipo-nino' : ''
    );

    tr.innerHTML = `
      <td>${escapeHtml(r.paciente)}</td>
      <td>${escapeHtml(r.aporte)}</td>
      <td>${escapeHtml(r.solucion)}</td>
      <td class="num"><span class="hipo-val">${fmt(r.valor, 0)} ${escapeHtml(r.unidad)}</span></td>
    `;

    tbody.appendChild(tr);
  }
}




function getPesoInicial(){
  const saved = localStorage.getItem('hipo_pesoKg');
  const p = saved !== null ? Number(saved) : DATA.defaults.pesoKg;
  return Number.isFinite(p) && p >= 0 ? p : DATA.defaults.pesoKg;
}

function setPeso(peso){
  let p = Number(peso);
  if(!Number.isFinite(p) || p < 0) p = 0;
  localStorage.setItem('hipo_pesoKg', String(p));

  const res = calcAll(p);
  renderBolo(res.bolo);
  renderMantenimiento(res.mant);

  // Actualiza texto de glucagón (opcional: solo como info)
const card = document.querySelector('[aria-label="Alternativa"] .prose');
if(card){
  card.innerHTML =
    `<p><strong>Si imposibilidad de vía intravenosa:</strong> GLUCAGÓN IM a 0,03 mg/kg (máximo 1 mg)</p>`;
}
}

function bindPesoGlobal(){
  const pesoGlobal = document.getElementById('peso'); // input del header
  if (!pesoGlobal) return;

  const onChange = () => {
    const p = parseFloat(String(pesoGlobal.value).replace(',', '.')) || 0;
    setPeso(p);
  };

  pesoGlobal.addEventListener('input', onChange);
  pesoGlobal.addEventListener('change', onChange);

  onChange(); // inicial
}


function bindHipoInfoModal(){
  const btn = document.getElementById('hipoInfoBtn');
  const overlay = document.getElementById('hipoInfoOverlay');
  const card = overlay?.querySelector('.hipo-info-card');
  if(!btn || !overlay || !card) return;

  function open(){
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    btn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('hipo-info-open');
  }

  function close(){
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    btn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('hipo-info-open');
  }

  function toggle(){
    overlay.hidden ? open() : close();
  }

  // Evitar listeners duplicados
  if(btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  // Cierra al pulsar FUERA de la tarjeta
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) close();
  });

  // Cierra al pulsar en la TARJETA (como pediste)
  card.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    close();
  });

  // ESC cierra
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !overlay.hidden) close();
  });

  // Exponer por si quieres cerrarlo desde fuera
  window.closeHipoInfo = close;
}



function init(){
  bindPesoGlobal();
  bindHipoInfoModal();
}

document.addEventListener('DOMContentLoaded', init);

// ✅ EXPONER render global (DENTRO del IIFE)
window.renderHipoglucemia = () => {
  const pesoGlobal = document.getElementById('peso');
  const p = pesoGlobal
    ? (parseFloat(String(pesoGlobal.value).replace(',', '.')) || 0)
    : DATA.defaults.pesoKg;
  setPeso(p);
};

})();  // ✅ cierre del IIFE AL FINAL



