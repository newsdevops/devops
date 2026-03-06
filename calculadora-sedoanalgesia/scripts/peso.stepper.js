document.addEventListener("DOMContentLoaded", () => {
  const pesoInput = document.getElementById("peso");
  const pesoRange = document.getElementById("pesoRange");
  const btnMinus = document.getElementById("pesoMinusBar");
  const btnPlus  = document.getElementById("pesoPlusBar");
  const lockBtn  = document.getElementById("pesoLockBtn");
  const previewBadge = document.getElementById("pesoPreviewBadge");

  if (!pesoInput || !pesoRange || !btnMinus || !btnPlus) return;

  // ----- límites / step -----
  const MIN = parseFloat(pesoInput.min || pesoRange.min || "1");
  const MAX = parseFloat(pesoRange.max || pesoInput.max || "120");
  const STEP = parseFloat(pesoRange.step || pesoInput.step || "0.1");

  const clamp = (v) => Math.min(MAX, Math.max(MIN, v));
  const roundToStep = (v) => Math.round(v / STEP) * STEP;
  const decimals = (String(STEP).includes(".") ? String(STEP).split(".")[1].length : 0);

  function emitPeso() {
    // sheet.ui.js escucha input/change del #peso
    pesoInput.dispatchEvent(new Event("input", { bubbles: true }));
    pesoInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function isLocked() {
    return lockBtn?.getAttribute("aria-pressed") === "true";
  }

  function syncLockState() {
    const locked = isLocked();
    btnMinus.disabled = locked;
    btnPlus.disabled = locked;
    pesoRange.disabled = locked;
  }

  /* =========================================================
     SLIDER “VENTANA” (ULTRA FINO)
     ========================================================= */
  const SLIDER_WINDOW_KG = 20;       // ±10 kg
  const SLIDER_EDGE_RATIO = 0.20;

  let rangeLo = MIN;
  let rangeHi = MAX;

  function applyRangeWindow(lo, hi) {
    lo = clamp(roundToStep(lo));
    hi = clamp(roundToStep(hi));
    if (hi < lo) hi = lo;

    rangeLo = lo;
    rangeHi = hi;

    pesoRange.min = lo.toFixed(decimals);
    pesoRange.max = hi.toFixed(decimals);
  }

  function setRangeWindow(center, force = false) {
    const half = SLIDER_WINDOW_KG / 2;
    const edge = SLIDER_WINDOW_KG * SLIDER_EDGE_RATIO;

    const nearLeft  = (center - rangeLo) < edge;
    const nearRight = (rangeHi - center) < edge;
    if (!force && !(nearLeft || nearRight)) return;

    let lo = center - half;
    let hi = center + half;

    if (lo < MIN) { hi += (MIN - lo); lo = MIN; }
    if (hi > MAX) { lo -= (hi - MAX); hi = MAX; }

    applyRangeWindow(lo, hi);
  }

  function setPesoValue(val, emit = true) {
    let v = parseFloat(String(val).replace(",", "."));
    if (Number.isNaN(v)) v = MIN;

    v = clamp(roundToStep(v));

    setRangeWindow(v);
    pesoInput.value = v.toFixed(decimals);
    pesoRange.value = String(v);

    if (emit) emitPeso();
  }

  // init
  const initV = parseFloat(String(pesoInput.value).replace(",", "."));
  const initVal = (!Number.isNaN(initV) ? clamp(roundToStep(initV)) : MIN);

  applyRangeWindow(initVal - SLIDER_WINDOW_KG / 2, initVal + SLIDER_WINDOW_KG / 2);
  setPesoValue(initVal, false);
  syncLockState();

  /* =========================================================
     MÓVIL: PREVIEW mientras arrastra + COMMIT al soltar
     ========================================================= */
  const isMobile = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  let previewActive = false;
  let previewHideT = null;

  function showPreviewBadge() {
    if (!previewBadge) return;
    previewBadge.hidden = false;
    previewBadge.style.opacity = "1";
  }

  function hidePreviewBadgeSoon() {
    if (!previewBadge) return;
    clearTimeout(previewHideT);
    previewHideT = setTimeout(() => { previewBadge.hidden = true; }, 250);
  }

  const commitFromSlider = () => {
    if (isLocked()) return;
    setPesoValue(pesoRange.value, true);
    previewActive = false;
    hidePreviewBadgeSoon();
  };

  if (isMobile) {
    pesoRange.addEventListener("pointerdown", () => {
      if (isLocked()) return;
      previewActive = true;
      showPreviewBadge();
    });

    pesoRange.addEventListener("input", () => {
      if (isLocked()) return;
      if (!previewActive) { previewActive = true; showPreviewBadge(); }
      setPesoValue(pesoRange.value, false); // preview
    });

    pesoRange.addEventListener("pointerup", commitFromSlider);
    pesoRange.addEventListener("pointercancel", commitFromSlider);
    pesoRange.addEventListener("touchend", commitFromSlider);
    pesoRange.addEventListener("touchcancel", commitFromSlider);
    pesoRange.addEventListener("change", commitFromSlider);
  } else {
    pesoRange.addEventListener("input", () => {
      if (isLocked()) return;
      setPesoValue(pesoRange.value, true);
    });
  }

  // teclado
  pesoInput.addEventListener("input", () => {
    const v = parseFloat(String(pesoInput.value).replace(",", "."));
    if (Number.isNaN(v)) return;

    const vv = clamp(v);
    setRangeWindow(vv);

    const within = vv >= rangeLo && vv <= rangeHi;
    if (within) pesoRange.value = String(roundToStep(vv));
  });

  pesoInput.addEventListener("change", () => {
    if (isLocked()) return;
    setPesoValue(pesoInput.value, true);
  });

  pesoInput.addEventListener("blur", () => {
    if (isLocked()) return;
    setPesoValue(pesoInput.value, true);
  });

  /* =========================================================
     LONG PRESS +/- (aceleración)
     ========================================================= */
  const HOLD_CFG = {
    holdDelay: 250,
    tickMs: 120,
    ramp: [
      { t: 0,    mult: 1 },
      { t: 700,  mult: 2 },
      { t: 1400, mult: 5 },
      { t: 2500, mult: 10 }
    ]
  };

  function getMult(elapsed) {
    let mult = HOLD_CFG.ramp[0].mult;
    for (const r of HOLD_CFG.ramp) {
      if (elapsed >= r.t) mult = r.mult;
      else break;
    }
    return mult;
  }

  function setupHold(btn, direction) {
    let holdTimer = null;
    let interval = null;
    let startTs = 0;
    let startedByPress = false;

    const stop = () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
      if (interval) { clearInterval(interval); interval = null; }
      setTimeout(() => { startedByPress = false; }, 0);
    };

    const stepOnce = (mult = 1) => {
      const current = parseFloat(String(pesoRange.value).replace(",", "."));
      const next = current + (direction * STEP * mult);
      setPesoValue(next, true);
    };

    const start = () => {
      if (isLocked()) return;
      startedByPress = true;
      stepOnce(1);

      startTs = Date.now();
      holdTimer = setTimeout(() => {
        interval = setInterval(() => {
          if (isLocked()) return stop();
          const elapsed = Date.now() - startTs;
          stepOnce(getMult(elapsed));
        }, HOLD_CFG.tickMs);
      }, HOLD_CFG.holdDelay);
    };

    const hasPointer = "PointerEvent" in window;

    if (hasPointer) {
      btn.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        btn.setPointerCapture?.(e.pointerId);
        start();
      });
      btn.addEventListener("pointerup", stop);
      btn.addEventListener("pointercancel", stop);
      btn.addEventListener("pointerleave", stop);
    } else {
      btn.addEventListener("mousedown", (e) => { e.preventDefault(); start(); });
      document.addEventListener("mouseup", stop);
      btn.addEventListener("touchstart", (e) => { e.preventDefault(); start(); }, { passive: false });
      btn.addEventListener("touchend", stop);
      btn.addEventListener("touchcancel", stop);
    }

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (isLocked()) return;
      if (startedByPress) return;
      stepOnce(1);
    });
  }

  setupHold(btnMinus, -1);
  setupHold(btnPlus, +1);
  lockBtn?.addEventListener("click", () => setTimeout(syncLockState, 0));

  /* =========================================================
     DOCK: altura real -> --peso-dock-h y flag data-peso-dock
     (NO usamos offsetParent porque con position:fixed puede ser null)
     ========================================================= */
  const pesoDock = document.getElementById("pesoDock");
  const root = document.documentElement;

  function updateDockLayout(){
    if (!pesoDock) {
      root.style.setProperty("--peso-dock-h", "0px");
      document.body.dataset.pesoDock = "0";
      return;
    }

    const cs = getComputedStyle(pesoDock);
    const hidden = (cs.display === "none") || (cs.visibility === "hidden");

    if (hidden) {
      root.style.setProperty("--peso-dock-h", "0px");
      document.body.dataset.pesoDock = "0";
      return;
    }

    const h = Math.ceil(pesoDock.getBoundingClientRect().height);
    root.style.setProperty("--peso-dock-h", `${h}px`);
    document.body.dataset.pesoDock = "1";
  }

  updateDockLayout();

  if ("ResizeObserver" in window && pesoDock) {
    const ro = new ResizeObserver(() => updateDockLayout());
    ro.observe(pesoDock);
  }

  const mo = new MutationObserver(() => requestAnimationFrame(updateDockLayout));
  mo.observe(document.body, { attributes: true, attributeFilter: ["data-view", "class"] });

  window.addEventListener("resize", () => requestAnimationFrame(updateDockLayout));
  window.addEventListener("orientationchange", () => requestAnimationFrame(updateDockLayout));

  window.updatePesoDockLayout = updateDockLayout;
});
