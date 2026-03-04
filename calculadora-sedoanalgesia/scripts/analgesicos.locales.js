// analgesicos.locales.js
// Integración en la app principal (sheet.html) para la sección "Analgésicos locales".
// Basado en anestesicos_locales.xlsx (según anestesicos.js) y adaptado a:
// - Input de peso global (#peso)
// - Estilo tabla "sheet" + cards (.drug-card/.tgrid) existente
// - Responsive: en <900px muestra cards y oculta tabla

(function(){
  'use strict';

  const MQ_NARROW = '(max-width: 900px)';
  const DATA = {
    defaults: { pesoKg: 10 },
    filas: [
      {
        farmaco: 'Lidocaína 1% (ml)',
        pres: '1 mg/ml',
        maxAbsolutaMg: 200,
        mgKg: 4.5,
        concMgMl: 10,
        maxMl: 20,
        formulaMg: 'MIN((peso*4.5), 200)',
        formulaMl: 'MIN((peso*4.5)/10, 20)',
        consideracion: 'Tamponamiento: Mezclar 1 ml de Bicarbonato de Sodio 1M con 9 ml de lidocaína neutraliza el pH y reduce significativamente el dolor de la infiltración'
      },
      {
        farmaco: 'Lidocaína 2% (ml)',
        pres: '2 mg/ml',
        maxAbsolutaMg: 200,
        mgKg: 4.5,
        concMgMl: 20,
        maxMl: 10,
        formulaMg: 'MIN((peso*4.5), 200)',
        formulaMl: 'MIN((peso*4.5)/20, 10)',
        consideracion: ''
      },
      {
        farmaco: 'Mepivacaina 1% (ml)',
        pres: '1 mg/ml',
        maxAbsolutaMg: 300,
        mgKg: 4,
        concMgMl: 10,
        maxMl: 15,
        formulaMg: 'MIN((peso*4), 300)',
        formulaMl: 'MIN((peso*4)/10, 15)',
        consideracion: 'No precisa mezclar con Adrenalina. Menor utilidad del tamponamiento, pH menos ácido'
      },
      {
        farmaco: 'Mepivacaína 2% (ml)',
        pres: '2 mg/ml',
        maxAbsolutaMg: 300,
        mgKg: 4,
        concMgMl: 20,
        maxMl: 15,
        formulaMg: 'MIN((peso*4), 300)',
        formulaMl: 'MIN((peso*4)/20, 15)',
        consideracion: ''
      }
    ],
    precauciones: [
      'Aspiración negativa (Fundamental): Antes de inyectar, siempre debes aspirar tirando del émbolo. Si sale sangre, estás en un vaso sanguíneo; debes retirar y reposicionar para evitar toxicidad sistémica.',
      'Inyección lenta: Inyectar el anestésico lentamente reduce el dolor por distensión de los tejidos y permite detectar reacciones adversas tempranas.',
      'Calentar el vial: Frotar el vial entre las manos hace que la inyección sea menos molesta.'
    ]
  };

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function isNarrow(){
    return !!(window.matchMedia && window.matchMedia(MQ_NARROW).matches);
  }

  function fmt(n, digits=2){
    if(n === null || n === undefined || n === '') return '';
    if(typeof n === 'string') return n;
    if(Number.isNaN(n)) return '';
    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(n);
  }
  
  
	function roundHalfUpInt(n){
	  return Math.round(n);
	}
	function roundHalfUp1(n){
	  return Math.round(n * 10) / 10;
	}
	function fmtFixed(n, digits){
	  if(n === null || n === undefined || n === '') return '';
	  if(typeof n === 'string') return n;
	  if(Number.isNaN(n)) return '';
	  return new Intl.NumberFormat('es-ES', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	  }).format(n);
	}


  function escapeHtml(str){
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'", '&#39;');
  }

  function calcMgMax(peso, mgKg, maxAbsolutaMg){
    return Math.min(peso * mgKg, maxAbsolutaMg);
  }

  function calcMlMax(peso, mgKg, concMgMl, maxMl){
    return Math.min((peso * mgKg) / concMgMl, maxMl);
  }

  // ---------- Render: tabla (desktop) ----------
  function renderTabla(pesoKg){
    const tbody = $('#tabla-analgesicos-locales tbody');
    if(!tbody) return;
    tbody.innerHTML = '';

let prevBase = null;

for (const f of DATA.filas) {
	
	  

const mgRaw = pesoKg * f.mgKg;
const mg = calcMgMax(pesoKg, f.mgKg, f.maxAbsolutaMg);
const ml = calcMlMax(pesoKg, f.mgKg, f.concMgMl, f.maxMl);

// true si está “capado” por máximo absoluto
const mgAtMax = mgRaw >= f.maxAbsolutaMg - 1e-9;



  const tr = document.createElement('tr');
  tr.className = 'row-loc';

  // --- Detectar cambio de grupo (Lidocaína -> Mepivacaína) ---
  const base = (f.farmaco || '')
    .split(' ')[0]
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita acentos

  if (prevBase && base !== prevBase) tr.classList.add('group-divider');
  prevBase = base;

  // Colores/acento de fila (ya lo usas)
  tr.style.setProperty('--row-accent', 'var(--loc-accent, #06b6d4)');
  tr.style.setProperty('--row-accent-bg', 'var(--loc-bg, rgba(6,182,212,.08))');
  
  
const isLido = /^Lidoca/i.test(f.farmaco);
const mgShow = isLido ? roundHalfUpInt(mg) : mg;
const mlShow = isLido ? roundHalfUp1(ml) : ml;


  tr.innerHTML = `
    <td class="col-farmaco">${escapeHtml(f.farmaco)}</td>
    <td>${escapeHtml(f.pres)}</td>

   

<td class="num dose ${mgAtMax ? "is-max" : ""}">
  <span class="hipo-val">${isLido ? fmtFixed(mgShow, 0) : fmt(mgShow, 2)}</span>
</td>

<td class="num vol">
  <span class="hipo-val">${isLido ? fmtFixed(mlShow, 1) : fmt(mlShow, 2)}</span>
</td>

    <td class="num limits">${escapeHtml(String(f.maxAbsolutaMg))} mg</td>
  `;

  tbody.appendChild(tr);
}
  }

  // ---------- Render: cards (móvil / estrecho) ----------
  function makeDiv(cls, txt){
    const d = document.createElement('div');
    d.className = cls;
    if(txt !== undefined && txt !== null) d.textContent = txt;
    return d;
  }

  function ensureCardsWrap(){
    const id = 'cards-analgesicos-locales';
    let el = document.getElementById(id);
    if(el) return el;
    const section = document.getElementById('section-analgesicos-locales');
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

  function renderCards(pesoKg){
    const wrap = ensureCardsWrap();
    if(!wrap) return;
    wrap.hidden = false;
    wrap.innerHTML = '';

    for(const f of DATA.filas){
      const mg = calcMgMax(pesoKg, f.mgKg, f.maxAbsolutaMg);
      const ml = calcMlMax(pesoKg, f.mgKg, f.concMgMl, f.maxMl);

      const card = makeDiv('drug-card', '');
      card.appendChild(makeDiv('drug-card__title', f.farmaco));

      const body = makeDiv('drug-card__body', '');
      const grid = makeDiv('tgrid', '');
      grid.style.setProperty('--cols', '1');
      grid.style.setProperty('--col-min', '220px');

      const addRow = (label, text, cls='') => {
        grid.appendChild(makeDiv('tgrid__cell tgrid__label', label));
        grid.appendChild(makeDiv(('tgrid__cell ' + cls).trim(), text));
      };

      addRow('PRESENTACIÓN', f.pres + `  ( ${f.concMgMl} mg/ml )`);
      
const isLido = /^Lidoca/i.test(f.farmaco);
const mgShow = isLido ? roundHalfUpInt(mg) : mg;
const mlShow = isLido ? roundHalfUp1(ml) : ml;

addRow('DOSIS MÁX (mg)', isLido ? fmtFixed(mgShow, 0) : fmt(mgShow,2), 'dose');
addRow('DOSIS MÁX (ml)', isLido ? fmtFixed(mlShow, 1) : fmt(mlShow,2), 'vol');

      addRow('MÁX ABSOLUTO', String(f.maxAbsolutaMg) + ' mg', 'limits');

      body.appendChild(grid);
      card.appendChild(body);
      wrap.appendChild(card);
    }
  }

  function renderTextos(){
    const cons = document.getElementById('loc-consideraciones');
    const prec = document.getElementById('loc-precauciones');

    if(cons){
      const items = DATA.filas
        .filter(x => x.consideracion && x.consideracion.trim().length)
        .map(x => `<li><strong>${escapeHtml(x.farmaco)}:</strong> ${escapeHtml(x.consideracion)}</li>`)
        .join('');
      cons.innerHTML = items ? `<ul>${items}</ul>` : '<p class="muted">—</p>';
    }

if (prec) {
  const html = DATA.precauciones.map((txt) => {
    // 1) Toda la línea de “Aspiración negativa…”: negrita + clase para color según tema
    if (/^Aspiración negativa \(Fundamental\):/.test(txt)) {
      return `<li class="prec-warn"><strong>${escapeHtml(txt)}</strong></li>`;
    }

    // 2) “Inyección lenta” y “Calentar el vial” en negrita (solo el título)
    let t = escapeHtml(txt);
    t = t.replace(/^Inyección lenta:/, "<strong>Inyección lenta:</strong>");
    t = t.replace(/^Calentar el vial:/, "<strong>Calentar el vial:</strong>");

    return `<li>${t}</li>`;
  }).join("");

  prec.innerHTML = `<ul>${html}</ul>`;
}

  }

  function toggleResponsive(pesoKg){
    const section = document.getElementById('section-analgesicos-locales');
    if(!section || section.hidden) return;

    const tableWrap = section.querySelector('.table-wrap');
    const cards = ensureCardsWrap();

    if(isNarrow()){
      if(tableWrap) tableWrap.style.display = 'none';
      renderCards(pesoKg);
    }else{
      if(tableWrap) tableWrap.style.display = '';
      if(cards){ cards.hidden = true; cards.innerHTML = ''; }
      renderTabla(pesoKg);
    }
  }

  function getPesoGlobal(){
    const raw = document.getElementById('peso')?.value ?? '';
    const p = parseFloat(String(raw).replace(',', '.')) || 0;
    return p;
  }

  // API pública para que sheet.ui.js pueda refrescar cuando cambie el peso
  window.renderAnalgesicosLocales = function(){
    const p = getPesoGlobal();
    renderTextos();
    toggleResponsive(p);
  };

  // Inicializa listeners mínimos
  function init(){
    // render inicial cuando se cargue el DOM
    window.renderAnalgesicosLocales();

    // re-render al cambiar el peso global
    const pesoEl = document.getElementById('peso');
    if(pesoEl){
      const onPeso = () => window.renderAnalgesicosLocales();
      pesoEl.addEventListener('input', onPeso);
      pesoEl.addEventListener('change', onPeso);
    }

    // re-render al cambiar tamaño
    let t;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = setTimeout(() => window.renderAnalgesicosLocales(), 80);
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();

// ================================
// MODAL "CONSIDERACIONES" (igual que Hipoglucemia)
// + Sticky offset bajo el header principal
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("locConsBtn");
  const overlay = document.getElementById("locConsOverlay");
  const content = document.getElementById("locConsContent");

  // Este div ya existe en tu HTML (card de "Consideraciones" en la sección)
  const src = document.getElementById("loc-consideraciones");

  if (btn && overlay && content) {
    const open = () => {
      // Copiamos el texto "que ya tienes" para no duplicarlo
      if (src) content.innerHTML = src.innerHTML;

      overlay.hidden = false;
      overlay.setAttribute("aria-hidden", "false");
      btn.setAttribute("aria-expanded", "true");
      document.body.classList.add("modal-open");
    };

    const close = () => {
      overlay.hidden = true;
      overlay.setAttribute("aria-hidden", "true");
      btn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("modal-open");
    };

    // Abrir
    btn.addEventListener("click", open);

    // Cerrar: igual que Hipoglucemia => pulsar en la tarjeta o fuera
    overlay.addEventListener("click", (e) => {
      const card = overlay.querySelector(".hipo-info-card");
      if (!card) return close();

      if (e.target === overlay) return close();      // click fuera
      if (e.target.closest(".hipo-info-card")) return close(); // click en tarjeta
    });

    // Cerrar con Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.hidden === false) close();
    });
  }

  // ================================
  // STICKY: calcular el "top" real según altura del header de la app
  // ================================
  const updateStickyTop = () => {
    const appHeader = document.querySelector(".app-header");
    const h = appHeader ? Math.round(appHeader.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--stickyTop", `${h}px`);
  };

  updateStickyTop();
  window.addEventListener("resize", updateStickyTop);
});

