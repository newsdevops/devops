'use strict';

window.sueroState = window.sueroState || { view: 'calculo' };

const SUERO_VIEW_LABELS = {
  calculo: 'CÁLCULO',
  composicion: 'COMPOSICIÓN',
  rehidratacion: 'REHIDRATACIÓN RÁPIDA',
  deshidrataciones: 'DESHIDRATACIONES'
};

function setSueroView(view){
  if(!window.SUERO_VIEWS?.includes(view)) return;
  window.sueroState.view = view;

  document.getElementById('suero-calculo')?.toggleAttribute('hidden', view !== 'calculo');
  document.getElementById('suero-composicion')?.toggleAttribute('hidden', view !== 'composicion');
  document.getElementById('suero-rehidratacion')?.toggleAttribute('hidden', view !== 'rehidratacion');
  document.getElementById('suero-deshidrataciones')?.toggleAttribute('hidden', view !== 'deshidrataciones');

  // activar botón (desktop)
  const bar = document.getElementById('sueroSubtabs');
  if(bar){
    bar.querySelectorAll('button[data-suero-view]').forEach(b=>{
      b.classList.toggle('is-active', b.dataset.sueroView === view);
    });
  }

  // sync dropdown (móvil)
  syncSueroDropdown();
  
// ✅ refresca selección del drawer SIN cambiar de vista principal
window.syncDrawerActive?.();


  if(typeof window.renderSueroterapia === 'function') window.renderSueroterapia();
  


}

function buildSueroDropdown(){
  const dd = document.getElementById('sueroDD');
  if(!dd) return;

  const btn = dd.querySelector('.drug-dd__btn');
  const label = dd.querySelector('.drug-dd__label');
  const panel = dd.querySelector('.drug-dd__panel');
  if(!btn || !label || !panel) return;

  panel.innerHTML = '';
  window.SUERO_VIEWS.forEach(v=>{
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'drug-dd__opt';
    opt.dataset.view = v;
    opt.textContent = SUERO_VIEW_LABELS[v] || v.toUpperCase();
    opt.setAttribute('role','option');
    panel.appendChild(opt);
  });

  function open(){ dd.classList.add('is-open'); btn.setAttribute('aria-expanded','true'); }
  function close(){ dd.classList.remove('is-open'); btn.setAttribute('aria-expanded','false'); }
  function toggle(){ dd.classList.contains('is-open') ? close() : open(); }

  if(dd.dataset.bound !== '1'){
    dd.dataset.bound = '1';

    btn.addEventListener('click', (e)=>{ e.stopPropagation(); toggle(); });

    panel.addEventListener('click', (e)=>{
      const opt = e.target.closest('.drug-dd__opt');
      if(!opt) return;
      setSueroView(opt.dataset.view);
      close();
    });

    document.addEventListener('click', ()=>close());
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
  }

  dd._sync = () => {
    const v = window.sueroState.view || 'calculo';
    label.textContent = SUERO_VIEW_LABELS[v] || v.toUpperCase();
    panel.querySelectorAll('.drug-dd__opt').forEach(b=>{
      const active = b.dataset.view === v;
      b.classList.toggle('is-active', active);
      b.setAttribute('aria-selected', active ? 'true':'false');
    });
  };

  dd._sync();
}

function syncSueroDropdown(){
  const dd = document.getElementById('sueroDD');
  if(dd && typeof dd._sync === 'function') dd._sync();
}

function initSueroUI(){
  // Desktop subtabs
  const bar = document.getElementById('sueroSubtabs');
  if(bar && bar.dataset.bound !== '1'){
    bar.dataset.bound = '1';
    bar.addEventListener('click', (e)=>{
      const b = e.target.closest('button[data-suero-view]');
      if(!b) return;
      setSueroView(b.dataset.sueroView);
    });
  }

  // Dropdown móvil
  buildSueroDropdown();

  // Default
  setSueroView('calculo');
}

window.initSueroUI = initSueroUI;
window.setSueroView = setSueroView;