/* =====================================================================
   Windrad Flow – volume control per tab (0 – 400 %)
   Above 100 % (and for exact control below) the sound runs through a
   gain node of the Web Audio API. Protected videos (Netflix & co.) can't
   be routed through it – there only 0 – 100 % works.
   ===================================================================== */
(() => {
  "use strict";
  if (window.top !== window || window.__windradFlowVolume) return;
  window.__windradFlowVolume = true;

  const host = location.hostname.replace(/^www\./, "");
  let pct = 100, on = false, remember = true, ctx = null, pending = false;
  const gains = new WeakMap();

  // can this video/audio be routed through Web Audio without going silent?
  function canRoute(m) {
    if (m.mediaKeys) return false;                                  // DRM
    const src = m.currentSrc || m.src || "";
    if (!src || /^(blob|data):/.test(src)) return true;
    try { return new URL(src, location.href).origin === location.origin || m.crossOrigin !== null; } catch { return false; }
  }
  function route(m) {
    if (gains.has(m)) return gains.get(m);
    if (!canRoute(m)) return null;
    // the browser only starts audio after you've interacted with the page;
    // routing earlier would mute the video -> wait for the first click/key
    if (!navigator.userActivation || !navigator.userActivation.hasBeenActive) { waitForActivation(); return null; }
    try {
      ctx = ctx || new AudioContext();
      const g = ctx.createGain();
      ctx.createMediaElementSource(m).connect(g).connect(ctx.destination);
      gains.set(m, g);
      return g;
    } catch { return null; }
  }
  function waitForActivation() {
    if (pending) return;
    pending = true;
    const go = () => { pending = false; applyAll(); };
    window.addEventListener("pointerdown", go, { once: true, capture: true });
    window.addEventListener("keydown", go, { once: true, capture: true });
  }
  function applyTo(m) {
    if (!on) return;
    if (pct === 100 && !gains.has(m)) return;                       // nothing to change, leave it alone
    const g = route(m);
    if (g) {
      g.gain.setTargetAtTime(pct / 100, ctx.currentTime, 0.03);      // smooth, no clicks
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } else if (pct <= 100) m.volume = pct / 100;
  }
  const applyAll = () => document.querySelectorAll("video, audio").forEach(applyTo);
  document.addEventListener("play", (e) => { if (e.target instanceof HTMLMediaElement) applyTo(e.target); }, true);

  async function setPct(v, store = true) {
    pct = Math.max(0, Math.min(400, Math.round(v)));
    applyAll();
    if (store && remember) {
      const { volumes = {} } = await browser.storage.local.get("volumes");
      if (pct === 100) delete volumes[host]; else volumes[host] = pct;
      browser.storage.local.set({ volumes });
    }
    return state();
  }
  const state = () => ({
    pct, media: document.querySelectorAll("video, audio").length > 0,
    limited: [...document.querySelectorAll("video, audio")].some((m) => !canRoute(m)),
  });

  async function load() {
    const { modules = {}, volumes = {}, volumeOpts = {} } = await browser.storage.local.get(["modules", "volumes", "volumeOpts"]);
    on = !!modules.volume;
    remember = volumeOpts.remember !== false;
    if (on && remember && volumes[host] !== undefined) { pct = volumes[host]; applyAll(); }
  }
  load();
  browser.storage.onChanged.addListener((c) => { if (c.modules || c.volumeOpts) load(); });

  browser.runtime.onMessage.addListener((m) => {
    if (!m || !on) return;
    if (m.type === "flow-volume-get") return Promise.resolve(state());
    if (m.type === "flow-volume-set") return setPct(m.pct);
  });
  // for the YouTube module (right-click + wheel above 100 %)
  window.__flowVolume = { get: () => pct, set: (v) => setPct(v), enabled: () => on };
})();
