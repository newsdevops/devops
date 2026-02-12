// checklist.js
'use strict';
/**
 * Checklist con:
 * - Persistencia de checks (localStorage) SOLO para elementos marcables manualmente.
 * - Padres con hijos: NO se marcan manualmente (se deshabilitan).
 *   Se marcan automáticamente cuando TODOS sus descendientes están marcados.
 * - Estilos: añade/quita clase .is-checked en .ck-line.
 * - Reset principal y reset por bloque (padres): desmarca hojas y CIERRA desplegables.
 * - Verificación: cuando TODO está marcado, muestra botón "Verificación Correcta",
 *   hace scroll hasta él y, al pulsarlo, navega a "Sedantes".
 */
(function(){
  const KEY_CHECK = 'sedoChecklist.checked.v5';
  const KEY_OPEN  = 'sedoChecklist.open.v5';

  function hash(str){
    let h = 5381;
    for(let i=0;i<str.length;i++) h = ((h<<5)+h) + str.charCodeAt(i);
    return (h>>>0).toString(36);
  }

  function loadJson(key){
    try{ return JSON.parse(localStorage.getItem(key) || '{}') || {}; }
    catch(_e){ return {}; }
  }

  function saveJson(key,obj){
    try{ localStorage.setItem(key, JSON.stringify(obj)); }
    catch(_e){}
  }

  function closestLine(el){
    return el.closest('.ck-line');
  }

  function lineTextFor(cb){
    const line = closestLine(cb);
    const sp = line ? line.querySelector('span') : null;
    return sp ? sp.textContent.trim() : '';
  }

  function indexPathFor(cb){
    const li = cb.closest('li');
    if(!li) return '';
    const path=[];
    let node=li;
    while(node && node.tagName==='LI'){
      const parent=node.parentElement;
      if(!parent) break;
      const siblings=Array.from(parent.children).filter(x=>x.tagName==='LI');
      path.push(String(siblings.indexOf(node)));
      node=parent.closest('li');
    }
    return path.reverse().join('.');
  }

  function checkboxId(cb){
    return 'ck_' + hash(indexPathFor(cb)+'|'+lineTextFor(cb));
  }

  function groupId(details, idx){
    const sp = details.querySelector('summary .ck-line span');
    const txt = sp ? sp.textContent.trim() : 'group';
    return 'g_' + hash(String(idx)+'|'+txt);
  }

  function setLineChecked(cb){
    const line = closestLine(cb);
    if(!line) return;
    line.classList.toggle('is-checked', !!cb.checked);
  }

  function isParentCheckbox(cb){
    if(cb.dataset.parent === '1') return true;
    // 1) Si está dentro de summary de details -> padre
    if(cb.closest('summary') && cb.closest('details')) return true;
    // 2) Si su <li> tiene un <ul> con algún checkbox -> padre
    const li = cb.closest('li');
    if(!li) return false;
    const childUL = Array.from(li.children).find(el => el.tagName === 'UL');
    if(!childUL) return false;
    return !!childUL.querySelector('input[type="checkbox"]');
  }

  function getChildLeafCheckboxesOfParent(cb){
    // Devuelve SOLO descendientes marcables manualmente (no padres)
    const li = cb.closest('li');
    const details = cb.closest('details');
    const container = details || li;
    if(!container) return [];

    let scope = null;
    if(details){
      scope = details.querySelector('ul');
    }else if(li){
      scope = Array.from(li.children).find(el => el.tagName === 'UL');
    }
    if(!scope) return [];

    const all = Array.from(scope.querySelectorAll('input[type="checkbox"]'));
    return all.filter(x => !isParentCheckbox(x) && !x.disabled);
  }

  function ensureVerifyButton(root){
    const wrap = root.querySelector('.checklist-wrap') || root;
    let vw = wrap.querySelector('.ck-verify-wrap');
    if(!vw){
      vw = document.createElement('div');
      vw.className = 'ck-verify-wrap';
      wrap.appendChild(vw);
    }
    let btn = vw.querySelector('#checklistVerifyBtn');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'checklistVerifyBtn';
      btn.className = 'ck-verify-btn';
      btn.hidden = true;
      btn.textContent = 'Verificación Correcta';
      vw.appendChild(btn);
    }
    return btn;
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
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClick();
      });
    }
    return btn;
  }

  function ensureRowReset(lineEl, onClick){
    if(!lineEl) return null;

    let btn = lineEl.querySelector('.ck-reset-sub');
    if(!btn){
      btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pill pill-reset ck-reset-sub';
      btn.textContent = 'RESET';
      lineEl.appendChild(btn);
    }
    if(btn.dataset.bound !== '1'){
      btn.dataset.bound = '1';
      btn.addEventListener('click', (e)=>{
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        onClick();
      });
    }
    return btn;
  }

  function goToSedantes(){
    const tab = document.querySelector('.tabs .tab-item[data-view="sedantes"]');
    const menu = document.querySelector('#sideMenu .menu-item[data-view="sedantes"]');
    (tab || menu)?.click();
  }

  function initChecklist(opts){
    
	opts = opts || {};
	const resetOnStart = !!opts.resetOnStart;

	const root = document.getElementById(opts.rootId || 'section-checklist') || document;
	const scope = root.querySelector('.checklist') || root;

	// Si resetOnStart: no restauramos nada y limpiamos persistencia
	let checkedStore = resetOnStart ? {} : loadJson(KEY_CHECK);
	let openMap     = resetOnStart ? {} : loadJson(KEY_OPEN);

	if (resetOnStart){
	  saveJson(KEY_CHECK, {});
	  saveJson(KEY_OPEN,  {});
	}


    const verifyBtn = ensureVerifyButton(root);
    let wasComplete = false;

    // ---- Persistencia open/closed de details ----
    const allDetails = Array.from(scope.querySelectorAll('details.ck-group'));
    allDetails.forEach((d, i) => {
      const gid = d.dataset.ckgid || groupId(d, i);
      d.dataset.ckgid = gid;

      
	  if (resetOnStart){
		d.open = false;
	  } else if (Object.prototype.hasOwnProperty.call(openMap, gid)){
		d.open = !!openMap[gid];
	  }

	  d.addEventListener('toggle', ()=>{
		openMap[gid] = d.open;
		saveJson(KEY_OPEN, openMap);

      });
    });

    // ---- Detectar padres y deshabilitar marcado manual ----
    const allCheckboxes = Array.from(scope.querySelectorAll('input[type="checkbox"]'));
    allCheckboxes.forEach(cb => {
      if(isParentCheckbox(cb)){
        cb.dataset.parent = '1';
        cb.disabled = true;
        cb.setAttribute('aria-disabled', 'true');
      }
    });

    // ---- Restaurar estado de checks SOLO para no-padre ----
    allCheckboxes.forEach(cb => {
      if(cb.dataset.parent === '1') return;
      const id = cb.dataset.ckid || checkboxId(cb);
      cb.dataset.ckid = id;
      if(Object.prototype.hasOwnProperty.call(checkedStore, id)){
        cb.checked = !!checkedStore[id];
      }
    });

    function getAllLeafs(){
      return Array.from(scope.querySelectorAll('input[type="checkbox"]'))
        .filter(cb => cb.dataset.parent !== '1' && !cb.disabled);
    }

    function closeDetails(list){
      list.forEach(d => {
        d.open = false;
        const gid = d.dataset.ckgid;
        if(gid) openMap[gid] = false;
      });
      saveJson(KEY_OPEN, openMap);
    }

    function closeAllDetails(){
      closeDetails(Array.from(scope.querySelectorAll('details.ck-group')));
    }

    function closeDetailsUnder(parentCb){
      const det = parentCb.closest('details.ck-group');
      const li = parentCb.closest('li');
      const base = det || li;
      if(!base) return;
      closeDetails(Array.from(base.querySelectorAll('details.ck-group')));
      // si el padre era un details, también cerrarlo
      if(det) closeDetails([det]);
    }

    function resetLeafs(leafs){
      leafs.forEach(cb => {
        cb.checked = false;
        const id = cb.dataset.ckid || checkboxId(cb);
        cb.dataset.ckid = id;
        delete checkedStore[id];
      });
      saveJson(KEY_CHECK, checkedStore);
    }

    function recomputeAll(){
      // 1) estilos
      Array.from(scope.querySelectorAll('input[type="checkbox"]')).forEach(setLineChecked);

      // 2) padres auto
      const parents = Array.from(scope.querySelectorAll('input[type="checkbox"][data-parent="1"]'));
      for(let pass=0; pass<10; pass++){
        let changed = false;
        for(const p of parents){
          const kids = getChildLeafCheckboxesOfParent(p);
          const allOn = kids.length ? kids.every(x => x.checked) : false;
          const prev = p.checked;
          p.checked = allOn;
          if(prev !== p.checked) changed = true;
          setLineChecked(p);
        }
        if(!changed) break;
      }

      // 3) completo
      const leafs = getAllLeafs();
      const complete = leafs.length > 0 && leafs.every(cb => cb.checked);
      verifyBtn.hidden = !complete;

      
if(complete && !wasComplete){
  showVerifyModal();     // <-- abre modal
}
if(!complete && wasComplete){
  hideVerifyModal();     // <-- si desmarcas algo, lo cierra
}

      wasComplete = complete;
    }

    // ---- Reset principal (desmarca todo + cierra desplegables) ----
    ensureHeaderReset(root, () => {
      resetLeafs(getAllLeafs());
      closeAllDetails();
      recomputeAll();
    });

    // ---- Reset por bloque (padres) ----
    const parents = Array.from(scope.querySelectorAll('input[type="checkbox"][data-parent="1"]'));
    parents.forEach(p => {
      const line = closestLine(p);
      if(!line) return;
      ensureRowReset(line, () => {
        resetLeafs(getChildLeafCheckboxesOfParent(p));
        closeDetailsUnder(p);
        recomputeAll();
      });
    });

    // Listener para guardar y recomputar
    allCheckboxes.forEach(cb => {
      if(cb.dataset.parent === '1') return;
      cb.addEventListener('change', () => {
        const id = cb.dataset.ckid || checkboxId(cb);
        cb.dataset.ckid = id;
        checkedStore[id] = cb.checked;
        saveJson(KEY_CHECK, checkedStore);
        recomputeAll();
      });
    });

    verifyBtn.addEventListener('click', () => {
      goToSedantes();
    });


function ensureVerifyModal(){
  let overlay = document.getElementById('ckVerifyOverlay');
  if(overlay) return overlay;

  overlay = document.createElement('div');
  overlay.id = 'ckVerifyOverlay';
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="ck-modal" role="dialog" aria-modal="true" aria-labelledby="ckModalTitle">
      <div class="ck-modal__title" id="ckModalTitle">Verificación completada</div>
      <div class="ck-modal__sub">Pulsa para volver a “Sedantes”.</div>
      <button type="button" id="checklistVerifyBtn">Verificación Correcta</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Cerrar si haces click fuera de la tarjeta (opcional, muy útil)
  overlay.addEventListener('click', (e) => {
    if(e.target === overlay) hideVerifyModal();
  });

  // ESC para cerrar (opcional)
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape' && !overlay.hidden) hideVerifyModal();
  });

  return overlay;
}

function showVerifyModal(){
  const overlay = ensureVerifyModal();
  
const verifyBtn = overlay.querySelector('#checklistVerifyBtn');

verifyBtn.addEventListener('click', () => {
  hideVerifyModal();
  goToSedantes();
});

  overlay.hidden = false;
  document.body.classList.add('ck-modal-open');

  // foco al botón
  const btn = overlay.querySelector('#checklistVerifyBtn');
  setTimeout(() => btn?.focus(), 0);
}

function hideVerifyModal(){
  const overlay = document.getElementById('ckVerifyOverlay');
  if(!overlay) return;
  overlay.hidden = true;
  document.body.classList.remove('ck-modal-open');
}




    // Estado inicial
    recomputeAll();
  }

  window.initChecklist = initChecklist;
})();
