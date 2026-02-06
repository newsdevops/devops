'use strict';

/* ---------- helpers ---------- */
function safeTxt(v){
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}
function fmtSuero(n, digits=0){
  const f = window.sueroCalc?.fmt;
  return f ? f(n, digits) : safeTxt(n);
}

/* Colores suaves (excel -> web) */
function rowColorByName(name){
  const n = String(name||'').toLowerCase();
  if (n.includes('basales') && n.includes('media')) return {accent:'#8b5cf6', bg:'rgba(139,92,246,.14)'};
  if (n.includes('basales')) return {accent:'#3b82f6', bg:'rgba(59,130,246,.5)'};
  if (n.includes('más 3')) return {accent:'#22c55e', bg:'rgba(34,197,94,.5)'};
  if (n.includes('más 5')) return {accent:'#16a34a', bg:'rgba(22,163,74,.5)'};
  if (n.includes('más 6')) return {accent:'#0ea5e9', bg:'rgba(14,165,233,.5)'};
  if (n.includes('más 10')) return {accent:'#f59e0b', bg:'rgba(245,158,11,.5)'};
  return {accent:'#6366f1', bg:'rgba(99,102,241,.12)'};
}


function groupColor(key){
  const map = {
    salinos:       { accent:'#3b82f6', bg:'rgba(59,130,246,.20)' },
    glucosalinos:  { accent:'#22c55e', bg:'rgba(34,197,94,.20)' },
    glucosados:    { accent:'#8b5cf6', bg:'rgba(139,92,246,.20)' },
    bicarbonatos:  { accent:'#f59e0b', bg:'rgba(245,158,11,.20)' },
    glucobicar:    { accent:'#ec4899', bg:'rgba(236,72,153,.20)' },
    otros:         { accent:'#6366f1', bg:'rgba(99,102,241,.20)' },
  };
  return map[key] || { accent:'#6366f1', bg:'rgba(99,102,241,.20)' };
}




// ================================
// Persistencia Composición (pills)
// ================================
const SUERO_COMP_OPEN_KEY = 'suero.comp.open.v1';

function loadCompOpenMap(){
  try { return JSON.parse(localStorage.getItem(SUERO_COMP_OPEN_KEY) || '{}') || {}; }
  catch(e){ return {}; }
}
function saveCompOpenMap(map){
  try { localStorage.setItem(SUERO_COMP_OPEN_KEY, JSON.stringify(map || {})); }
  catch(e){}
}




function bindSueroCompToggles(){
  const host = document.getElementById('sueroCompTables');
  if (!host || host.dataset.bound === '1') return;
  host.dataset.bound = '1';

  // Preferencias de accesibilidad: si el usuario prefiere menos animaciones, no hacemos smooth.
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  
function getHeaderOffset(){
  // usa tu variable CSS calculada si existe, o mide el header
  const cssVal = getComputedStyle(document.documentElement)
    .getPropertyValue('--app-header-h').trim();
  const n = parseFloat(cssVal);
  if (!Number.isNaN(n) && n > 0) return n;
  const header = document.querySelector('.app-header');
  return header ? Math.round(header.getBoundingClientRect().height) : 0;
}

function scrollToAnchor(anchorEl){
  const headerH = getHeaderOffset();
  const extra = 18; // ✅ un poco más para que se vea la pill completa
  const top = anchorEl.getBoundingClientRect().top + window.pageYOffset - headerH - extra;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: reduceMotion ? 'auto' : 'smooth'
  });
}


  host.addEventListener('click', (e) => {
    const btn = e.target.closest('button.suero-pill-toggle');
    if (!btn) return;

    const targetId = btn.getAttribute('aria-controls');
    const wrap = targetId ? document.getElementById(targetId) : null;
    if (!wrap) return;

    const wasHidden = wrap.hidden;

    // Toggle
    wrap.hidden = !wrap.hidden;
    btn.setAttribute('aria-expanded', wrap.hidden ? 'false' : 'true');

    // Persistencia (si lo tienes ya en tu versión, mantenlo aquí)
    if (typeof loadCompOpenMap === 'function' && typeof saveCompOpenMap === 'function') {
      const map = loadCompOpenMap();
      map[targetId] = !wrap.hidden;
      saveCompOpenMap(map);
    }

    // ✅ Si se está ABRIENDO: mover scroll y “foco” al contenido
    if (wasHidden && !wrap.hidden) {
      // Espera a que el navegador pinte el contenido (importantísimo)
      requestAnimationFrame(() => {
        scrollToAnchor(btn); // ✅ ahora “encuadra” la pill, no la tabla

        // Foco accesible al bloque abierto sin volver a desplazar scroll
        // (sirve para teclado/lectores; no “salta”)
        if (!wrap.hasAttribute('tabindex')) wrap.setAttribute('tabindex', '-1');
        wrap.focus?.({ preventScroll: true });
      });
    }
  });
}




/* ---------- CÁLCULO ---------- */
function sueroRenderCalculo(pesoKg){
  const m2El = document.getElementById('sueroM2Val');
  const tbody = document.querySelector('#sueroTablaVolumenes tbody');
  if (!tbody) return;

  const m2 = window.sueroCalc?.calcM2?.(pesoKg);
  const vols = window.sueroCalc?.calcVolumenes?.(pesoKg) || [];
	const m2Txt = window.sueroCalc?.fmtFixed ? window.sueroCalc.fmtFixed(m2, 2) : fmtSuero(m2, 2);
  
if (m2El) m2El.textContent = `${m2Txt} m²`;


  tbody.innerHTML = '';
  for (const row of vols){
    const c = rowColorByName(row.nombre);
    const tr = document.createElement('tr');
    tr.className = 'row-sue';
    tr.style.setProperty('--row-accent', c.accent);
    tr.style.setProperty('--row-accent-bg', c.bg);

    tr.innerHTML = `
      <td>${safeTxt(row.nombre)}</td>
      <td class="num">${fmtSuero(row.ccDia, 0)}<span class="unit"> cc/día</span></td>
      <td class="num">${fmtSuero(row.mlh, 0)}<span class="unit"> ml/h</span></td>
    `;
    tbody.appendChild(tr);
  }
}

/* ---------- COMPOSICIÓN: 6 tablas ---------- */




function renderSueroComposicion6(){
  const host = document.getElementById('sueroCompTables');
  if(!host) return; // en tu HTML existe este contenedor
  const comp = DATA?.composicion || {};
  const salinos = comp.salinos || [];
  const glucosalinos = comp.glucosalinos || [];
  const otros = comp.otros || [];

  // 4 subtablas desde "otros"
  const glucosados = otros.filter(x => /^Glucosado/i.test(x.sol) || /^Glucosmon/i.test(x.sol));
  const bicarbonatos = otros.filter(x => /^Bicarbonato/i.test(x.sol));
  const glucobicar = otros.filter(x => /^GlucoBicar/i.test(x.sol));
  const varios = otros.filter(x =>
    !(/^Glucosado/i.test(x.sol) || /^Glucosmon/i.test(x.sol) || /^Bicarbonato/i.test(x.sol) || /^GlucoBicar/i.test(x.sol))
  );

  // ✅ AQUÍ estaba el fallo: "tables" debe existir ANTES de usarlo
  const tables = [
    { title:'Salinos',      key:'salinos',      rows: salinos },
    { title:'Glucosalinos', key:'glucosalinos', rows: glucosalinos },
    { title:'Glucosados',   key:'glucosados',   rows: glucosados },
    { title:'Bicarbonatos', key:'bicarbonatos', rows: bicarbonatos },
    { title:'GlucoBicar',   key:'glucobicar',   rows: glucobicar },
    { title:'Otros',        key:'otros',        rows: varios },
  ];

  const openMap = (typeof loadCompOpenMap === 'function') ? loadCompOpenMap() : {};

  host.innerHTML = tables.map((t, idx) => {
    const id = 'sueroComp_' + t.title.replace(/\s+/g,'_').toLowerCase();
    const openByDefault = Object.prototype.hasOwnProperty.call(openMap, id)
      ? !!openMap[id]
      : (idx === 0); // por defecto: solo Salinos abierto

    const col = groupColor(t.key);

    return `
      <div class="suero-comp-section" style="--comp-accent:${col.accent}; --comp-bg:${col.bg}; margin:.65rem 0;">
        <button
          type="button"
          class="suero-pill-toggle"
          aria-expanded="${openByDefault ? 'true' : 'false'}"
          aria-controls="${id}"
        >
          ${t.title}
        </button>

        <div class="suero-comp-wrap" id="${id}" ${openByDefault ? '' : 'hidden'}>
          <table class="sheet suero-comp">
            <thead>
              <tr>
                <th>Suero</th>
                <th>Glucosa</th>
                <th>Na</th>
                <th>Cl</th>
                <th>Bic</th>
                <th>Osmol</th>
              </tr>
              <tr class="suero-units">
                <th></th>
                <th>gr/L</th>
                <th>mEq/L</th>
                <th>mEq/L</th>
                <th>mEq/L</th>
                <th>mOsm/L</th>
              </tr>
            </thead>
            <tbody>
              ${t.rows.map(r => `
                <tr class="row-sue" style="--row-accent:${col.accent}; --row-accent-bg:${col.bg};">
                  <td data-label="Suero">${safeTxt(r.sol)}</td>
                  <td class="num" data-label="Glucosa (gr/L)">${fmtSuero(r.glucosa, 2)}</td>
                  <td class="num" data-label="Na (mEq/L)">${fmtSuero(r.na, 0)}</td>
                  <td class="num" data-label="Cl (mEq/L)">${fmtSuero(r.cl, 0)}</td>
                  <td class="num" data-label="Bic (mEq/L)">${fmtSuero(r.bic, 0)}</td>
                  <td class="num" data-label="Osmol (mOsm/L)">${fmtSuero(r.osmol, 0)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  if (typeof bindSueroCompToggles === 'function') bindSueroCompToggles();
}

/* ---------- REHIDRATACIÓN RÁPIDA (compacto: una sola caja) ---------- */

function renderSueroRehidratacionCompacta(){
  const host = document.getElementById('suero-rehidratacion');
  if(!host) return;

  const items = DATA?.textos?.rehidratacionRapida?.items || []; 
  host.innerHTML = `
    <div class="suero-box" style="border-left:4px solid #22c55e;">
      <div style="font-weight:950; margin:0 0 .45rem;">Rehidratación rápida</div>
      <ul>
        ${items.map(x => `<li>${safeTxt(x)}</li>`).join('')}
      </ul>
    </div>
  `;
}


/* ---------- DESHIDRATACIONES (compacto) ---------- */
function renderSueroDeshidratacionesCompactas(){
  const host = document.getElementById('suero-deshidrataciones');
  if(!host) return;

  const secs = DATA?.textos?.deshidrataciones || []; 
  const colors = [
    '#60a5fa', // hipo
    '#22c55e', // iso
    '#f59e0b', // hiper
  ];

  host.innerHTML = secs.map((sec, i) => `
    <div class="suero-card" style="border-left:4px solid ${colors[i % colors.length]}; margin-bottom:.75rem;">
      <div class="suero-card__title">${safeTxt(sec.titulo)}</div>
      <ul>
        ${(sec.bullets || []).map(b => `<li>${safeTxt(b)}</li>`).join('')}
      </ul>
    </div>
  `).join('');
}

/* ---------- Render público por vista ---------- */
function renderSueroterapia(){
  const sec = document.getElementById('section-sueroterapia');
  if(!sec || sec.hidden) return;

  const view = window.sueroState?.view || 'calculo';

  if(view === 'calculo'){
    const raw = document.getElementById('peso')?.value ?? '0';
    const pesoKg = parseFloat(String(raw).replace(',', '.')) || 0;
    sueroRenderCalculo(pesoKg);
  }
  else if(view === 'composicion'){
    renderSueroComposicion6();
  }
  else if(view === 'rehidratacion'){
    renderSueroRehidratacionCompacta();
  }
  else if(view === 'deshidrataciones'){
    renderSueroDeshidratacionesCompactas();
  }
}

window.renderSueroterapia = renderSueroterapia;