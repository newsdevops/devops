// checklist.js
'use strict';
/**
 * Checklist V3 (según diseño acordado):
 * - Checkbox manual SOLO en:
 *   - Principales: input[data-role="main"]
 *   - Opcional/Disponible: input[data-role="extra"] (summary)
 *   - Elementos internos dentro de details.ck-extra
 * - Los grupos normales (sin ck-extra) son informativos (sin checkbox).
 * - details arrancan abiertos (open), pero el usuario puede plegar/desplegar.
 * - Persistencia de checks (localStorage) para todos los checkbox existentes.
 * - Modal "Verificación Correcta" cuando TODOS los principales están marcados.
 */
(function(){
  const KEY_CHECK = 'sedoChecklist.v3.checked.v1';

  function loadJson(key){
    try{ return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch(_e){ return {}; }
  }
  function saveJson(key,obj){
    try{ localStorage.setItem(key, JSON.stringify(obj)); }catch(_e){}
  }

  function closestLine(el){ return el.closest('.ck-line'); }

  // ID estable por texto + contexto cercano
  function checkboxId(cb){
    const line = closestLine(cb);
    const txt = (line?.querySelector('span')?.textContent || '').trim();
    const role = cb.dataset.role || '';
    // Añade algo de contexto para evitar colisiones
    const details = cb.closest('details');
    const sumTxt = details?.querySelector('summary span')?.textContent?.trim() || '';
    const raw = `${role}|${sumTxt}|${txt}`;
    return 'ckv3_' + btoa(unescape(encodeURIComponent(raw))).replace(/=+$/,'');
  }

  function setLineChecked(cb){
    const line = closestLine(cb);
    if(!line) return;
    line.classList.toggle('is-checked', !!cb.checked);
  }

  function ensureHeaderReset(root, onClick){
    const header = root.querySelector('.section-header');
    if(!header) return null;
    let btn = header.querySelector('#ckResetAll');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'ckResetAll';
      btn.className = 'pill pill-reset';
      btn.textContent = 'RESET';
      header.appendChild(btn);
    }
    if(btn.dataset.bound !== '1'){
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); onClick(); });
    }
    return btn;
  }

  function goToSedantes(){
    const tab = document.querySelector('.tabs .tab-item[data-view="sedantes"]');
    const menu = document.querySelector('#sideMenu .menu-item[data-view="sedantes"]');
    (tab || menu)?.click();
  }

  function ensureVerifyModal(){
    let overlay = document.getElementById('ckVerifyOverlay');
    if(overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'ckVerifyOverlay';
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="ck-modal" role="dialog" aria-modal="true" aria-label="Verificación completada">
        <div class="ck-modal__title">Verificación completada</div>
        <div class="ck-modal__sub">Pulsa para volver a “Fármacos sistémicos”.</div>
        <button type="button" id="checklistVerifyBtn" class="ck-verify-btn">Verificación Correcta</button>
      </div>
    `;
    document.body.appendChild(overlay);

    // Cerrar si click fuera
    overlay.addEventListener('click', (e) => { if(e.target === overlay) hideVerifyModal(); });

    // ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape' && !overlay.hidden) hideVerifyModal();
    });

    return overlay;
  }

  function showVerifyModal(){
    const overlay = ensureVerifyModal();
    const btn = overlay.querySelector('#checklistVerifyBtn');

    // Evita duplicar listener
    if(btn && btn.dataset.bound !== '1'){
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        hideVerifyModal();
        goToSedantes();
      });
    }

    overlay.hidden = false;
    document.body.classList.add('ck-modal-open');
    setTimeout(() => btn?.focus(), 0);
  }

  function hideVerifyModal(){
    const overlay = document.getElementById('ckVerifyOverlay');
    if(!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('ck-modal-open');
  }

  function initChecklist(opts){
    opts = opts || {};
    const resetOnStart = !!opts.resetOnStart;

    const root = document.getElementById(opts.rootId || 'section-checklist') || document;
    const scope = root.querySelector('#checklist-root') || root;

    let store = resetOnStart ? {} : loadJson(KEY_CHECK);
    if(resetOnStart) saveJson(KEY_CHECK, {});

    const allCheckboxes = Array.from(scope.querySelectorAll('input[type="checkbox"]'));

    // Restore + paint
    allCheckboxes.forEach(cb => {
      const id = cb.dataset.ckid || checkboxId(cb);
      cb.dataset.ckid = id;
      if(Object.prototype.hasOwnProperty.call(store, id)) cb.checked = !!store[id];
      setLineChecked(cb);
    });

    const mainBoxes = () => Array.from(scope.querySelectorAll('input[type="checkbox"][data-role="main"]'));

    function recomputeComplete(){
      const mains = mainBoxes();
      const complete = mains.length > 0 && mains.every(x => x.checked);
      if(complete) showVerifyModal();
      else hideVerifyModal();
    }

    // Reset all
    ensureHeaderReset(root, () => {
      allCheckboxes.forEach(cb => { cb.checked = false; setLineChecked(cb); });
      store = {};
      saveJson(KEY_CHECK, store);
      hideVerifyModal();
    });

    // Change handler
    scope.addEventListener('change', (e) => {
      const cb = e.target.closest('input[type="checkbox"]');
      if(!cb) return;
      const id = cb.dataset.ckid || checkboxId(cb);
      cb.dataset.ckid = id;
      store[id] = !!cb.checked;
      saveJson(KEY_CHECK, store);
      setLineChecked(cb);
      // Modal solo depende de principales
      if(cb.dataset.role === 'main') recomputeComplete();
      else recomputeComplete();
    });

    // Mejor UX: permitir plegar/desplegar incluso si se pulsa en la fila (sin tocar el checkbox)
    scope.querySelectorAll('details.ck-group > summary').forEach(sum => {
      sum.addEventListener('click', (ev) => {
        const tgt = ev.target;
        // Si click en un checkbox, no forzamos nada: dejamos que actúe como checkbox.
        if(tgt && tgt.closest && tgt.closest('input[type="checkbox"]')) return;
        // Deja comportamiento nativo de <summary> (toggle). No preventDefault.
      });
    });

    // Estado inicial
    recomputeComplete();
  }

  window.initChecklist = initChecklist;
})();
