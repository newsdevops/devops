// sticky.js
'use strict';


/**
 * sticky.js
 * ----------------
 * Cálculo de medidas para cabeceras “sticky” y variables CSS relacionadas.
 * - setAppHeaderVar(): guarda la altura real del header en una variable CSS.
 * - measureAndSetStickyVars(): calcula offsets del thead/tbody y los escribe en variables CSS
 *   para evitar solapes/espacios (incluye los deltas ajustados para este layout).
 * Lo llama sheet.ui.js (en resize) y sheet.render.js (tras renderizar).
 */


function setAppHeaderVar(){
  const h = document.querySelector('.app-header')?.getBoundingClientRect().height || 72;
  document.documentElement.style.setProperty('--app-header-h', `${Math.round(h)}px`);
}

function measureAndSetStickyVars(){
	
	const deltaTop = 350;   // sube la cabecera
	const deltaOff = 300;   // reduce el espaciador

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
