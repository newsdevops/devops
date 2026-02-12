// sheet.render.js
'use strict';


/**
 * sheet.render.js
 * ----------------
 * Render principal de la tabla (desktop) + orquestación de cambio a vista traspuesta.
 * - Genera filas (tr) a partir de ENTRADAS y del peso actual (usa sheet.calc.js).
 * - Aplica clases/colores por vía, por límites, y agrupadores por fármaco.
 * - Decide: si la pantalla es estrecha -> delega en transpose.js (cards) y termina.
 * - Si es pantalla normal -> pinta la tabla y recalcula variables sticky (sticky.js).
 * No gestiona menús ni filtros (eso es sheet.ui.js); solo pinta según el estado actual.
 */


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
    <td>${displayDosisPeso(e)}</td>
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


function render(){
  const pesoVal = document.getElementById('peso')?.value ?? '0';
  const peso = parseFloat(pesoVal.toString().replace(',', '.')) || 0;

  // =========================================================
  // Vista traspuesta en modo estrecho (sin scroll horizontal global)
  if(isNarrow()){
    ensureTransposeStyles();

	document.querySelectorAll('#section-sedantes .table-wrap, #section-antidotos .table-wrap').forEach(w => {
	  w.style.display = 'none';
	});

    renderCardsFor('sedantes', peso);
    renderCardsFor('antidotos', peso);
    return;
  } else {


	document.querySelectorAll('#section-sedantes .table-wrap, #section-antidotos .table-wrap').forEach(w => {
	  w.style.display = '';
	});
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
    if(f && e.farmaco !== f) return;

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
