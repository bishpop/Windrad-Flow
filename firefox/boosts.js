/* =====================================================================
   Windrad Flow – Boosts (Arc-style site customizations)
   Runs early on every page and applies the saved boost of that site:
   hidden elements, font, size, colors and your own CSS. The panel to
   change it opens from the command bar / menu ("Boost this site").
   ===================================================================== */
(() => {
  "use strict";
  if (window.top !== window || window.__windradFlowBoosts) return;
  window.__windradFlowBoosts = true;

  const host = location.hostname.replace(/^www\./, "");
  const FONTS = {
    original: "",
    system: '"Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif',
    serif: 'Georgia, "Times New Roman", serif',
    mono: '"Cascadia Code", Consolas, ui-monospace, monospace',
    rounded: '"Nunito", "Segoe UI", "Arial Rounded MT Bold", system-ui, sans-serif',
  };
  // dark: "auto" = follow "Dark mode on all websites", "on" / "off" = this site only
  const EMPTY = { enabled: true, zap: [], font: "original", zoom: 100, hue: 0, sat: 100, dark: "auto", css: "" };
  let boost = { ...EMPTY }, modulesOn = false, styleEl = null;
  let darkAll = false;          // global switch from the settings
  let darkOpts = { ...FLOW_DARK_DEFAULTS }, accent = "#ff7a95";
  let nativeDark = null;        // is the page dark by itself? null = not known yet

  /* --- is the page already dark? ------------------------------------------
     Looks at the real background of <body> / <html> (our filter doesn't
     change these values). The answer is remembered per site, so the next
     visit is dark right away without a white flash. */
  function luminance(rgb) {
    const m = (rgb || "").match(/\d+(\.\d+)?/g);
    if (!m || m.length < 3 || (m.length > 3 && +m[3] === 0)) return null;      // transparent
    const [r, g, b] = m.slice(0, 3).map((v) => { v = +v / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  // first real (non-transparent) background found going up from an element
  function bgLum(node) {
    for (let n = node; n && n.nodeType === 1; n = n.parentElement) {
      if (n.tagName.startsWith("WINDRAD-")) return null;
      const cs = getComputedStyle(n);
      if (cs.backgroundImage !== "none" && /url\(/.test(cs.backgroundImage)) continue;   // pictures say nothing
      const l = luminance(cs.backgroundColor);
      if (l !== null) return l;
    }
    return null;
  }
  function detectDark() {
    if (document.documentElement.dataset.windradDark) return true;   // e.g. YouTube with Flow colors
    if (!document.body) return null;
    // our own white canvas rule must not fool the check
    if (styleEl && styleEl.sheet) styleEl.sheet.disabled = true;
    try {
      // 1) the page says it is dark only
      const meta = document.querySelector('meta[name="color-scheme"]');
      const scheme = ((meta && meta.content) || getComputedStyle(document.documentElement).colorScheme || "").trim();
      if (/^(only\s+)?dark$/.test(scheme)) return true;
      // 2) look at what is really behind several points of the visible page
      let dark = 0, light = 0;
      const W = innerWidth, H = innerHeight;
      for (const [x, y] of [[.5, .5], [.25, .3], [.75, .3], [.25, .75], [.75, .75], [.5, .12], [.08, .5], [.92, .5]]) {
        const el = document.elementFromPoint(W * x, H * y);
        const l = el ? bgLum(el) : null;
        if (l === null) continue;
        if (l < 0.18) dark++; else if (l > 0.35) light++;
      }
      if (dark + light >= 3) return dark > light;
      // 3) the main backgrounds
      for (const node of [document.body, document.documentElement]) {
        const l = luminance(getComputedStyle(node).backgroundColor);
        if (l !== null) return l < 0.25;
      }
      // 4) nothing painted: light text on the default canvas means a dark design
      const txt = luminance(getComputedStyle(document.body).color);
      if (txt !== null && txt > 0.5) return true;
      return /dark/.test(scheme) && matchMedia("(prefers-color-scheme: dark)").matches;
    } finally {
      if (styleEl && styleEl.sheet) styleEl.sheet.disabled = false;
    }
  }
  async function checkDark() {
    const d = detectDark();
    if (d === null || d === nativeDark) return;
    nativeDark = d;
    apply();
    const { darkCache = {} } = await browser.storage.local.get("darkCache");
    if (darkCache[host] !== d) { darkCache[host] = d; browser.storage.local.set({ darkCache }); }
  }
  let recheckTimer = null;
  const recheck = () => { clearTimeout(recheckTimer); recheckTimer = setTimeout(checkDark, 250); };
  function watchTheme() {
    const opts = { attributes: true, attributeFilter: ["class", "style", "data-theme", "data-color-mode", "dark", "theme"] };
    const mo = new MutationObserver(recheck);
    mo.observe(document.documentElement, opts);
    if (document.body) mo.observe(document.body, opts);
    matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", recheck);
  }
  function wantDark(b) {
    if (b.dark === "on" || b.dark === true) return true;
    if (b.dark === "off") return false;
    return darkAll && nativeDark === false;      // unknown -> wait for the check (no wrong flash)
  }

  /* --- turn a boost into CSS ------------------------------------------- */
  function buildCss(b) {
    const out = [];
    if (b.zap.length) out.push(`${b.zap.join(",\n")} { display: none !important; }`);
    if (FONTS[b.font]) out.push(`body, body :where(p, li, a, span, div, h1, h2, h3, h4, h5, h6, td, th, input, textarea, button, label, blockquote) { font-family: ${FONTS[b.font]} !important; }`);
    if (b.zoom && b.zoom !== 100) out.push(`html { zoom: ${b.zoom / 100} !important; }`);
    const f = [];
    const dark = wantDark(b);
    const D = flowDarkFilters(darkOpts);
    if (dark) f.push(D.page);
    if (b.hue) f.push(`hue-rotate(${b.hue}deg)`);
    if (b.sat !== 100) f.push(`saturate(${b.sat / 100})`);
    if (f.length) out.push(`html { filter: ${f.join(" ")} !important; }`);
    // dark mode: pictures and videos get the exact inverse -> they look normal
    if (dark) out.push(`img, picture, video, canvas, svg image, iframe, embed, object, [style*="background-image"]:not(html):not(body) { filter: ${D.media} !important; }
      html { background: #fff !important; }`);
    // text color: computed through the inverse of the filter so it shows exactly as chosen
    const want = flowDarkTextColor(darkOpts, accent);
    const TEXT = "body, body :where(p, span, li, td, th, dt, dd, h1, h2, h3, h4, h5, h6, blockquote, label, figcaption, article, section, main, div, strong, em, b, i, small)";
    if (want && dark) out.push(`${TEXT} { color: ${flowDarkSourceColor(darkOpts, want)} !important; }`);
    else if (want && !dark && darkOpts.textOnDark && nativeDark === true && darkAll && b.dark !== "off") out.push(`${TEXT} { color: ${want} !important; }`);
    if (f.length) out.push(`html { transition: filter 300ms ease; }`);
    if (b.css) out.push(b.css);
    return out.join("\n");
  }
  function apply() {
    const css = modulesOn && boost.enabled !== false ? buildCss(boost) : "";
    if (!styleEl) { styleEl = document.createElement("style"); styleEl.id = "windrad-flow-boost"; }
    styleEl.textContent = css;
    if (css && !styleEl.isConnected) (document.head || document.documentElement).append(styleEl);
    if (!css) styleEl.remove();
  }
  async function load() {
    const { modules = {}, boosts = {}, boostGlobal = {}, darkCache = {}, color1 } =
      await browser.storage.local.get(["modules", "boosts", "boostGlobal", "darkCache", "color1"]);
    modulesOn = !!modules.boosts;
    darkAll = !!boostGlobal.darkAll;
    darkOpts = { ...FLOW_DARK_DEFAULTS, ...(boostGlobal.dark || {}) };
    if (/^#[0-9a-f]{3,6}$/i.test(color1 || "")) accent = color1;
    boost = { ...EMPTY, ...(boosts[host] || {}) };
    if (boost.dark === true) boost.dark = "on";            // older versions stored true / false
    if (boost.dark === false) boost.dark = "auto";
    if (nativeDark === null && host in darkCache) nativeDark = darkCache[host];
    apply();
  }
  async function save() {
    const { boosts = {} } = await browser.storage.local.get("boosts");
    const isEmpty = !boost.zap.length && boost.font === "original" && boost.zoom === 100 && !boost.hue
                    && boost.sat === 100 && boost.dark === "auto" && !boost.css.trim();
    if (isEmpty) delete boosts[host]; else boosts[host] = { ...boost, updated: Date.now() };
    await browser.storage.local.set({ boosts });
  }
  load();
  browser.storage.onChanged.addListener((c) => { if (c.boosts || c.modules || c.boostGlobal || c.color1) load().then(() => panel && syncPanel()); });
  // pages that replace <head> later: put the style back, and check for a dark page
  document.addEventListener("DOMContentLoaded", () => { apply(); checkDark(); watchTheme(); });
  window.addEventListener("load", () => { setTimeout(checkDark, 300); setTimeout(checkDark, 1500); });

  /* =====================================================================
     The panel
     ===================================================================== */
  const TXT = {
    en: { title: "Boost", on: "Boost on", zap: "Hide elements", zapActive: "Click elements to hide · Esc to finish",
          hidden: "Hidden", none: "Nothing hidden yet.", showAll: "Show all again", font: "Font", size: "Size", colors: "Colors",
          hue: "Hue", sat: "Saturation", dark: "Dark mode", dAuto: "Auto", dOn: "On", dOff: "Off", css: "Own CSS", reset: "Reset this site", close: "Close",
          f: { original: "Original", system: "System", serif: "Serif", mono: "Mono", rounded: "Rounded" } },
    de: { title: "Boost", on: "Boost an", zap: "Elemente ausblenden", zapActive: "Elemente anklicken zum Ausblenden · Esc beendet",
          hidden: "Ausgeblendet", none: "Noch nichts ausgeblendet.", showAll: "Alle wieder zeigen", font: "Schrift", size: "Größe", colors: "Farben",
          hue: "Farbton", sat: "Sättigung", dark: "Dunkelmodus", dAuto: "Auto", dOn: "An", dOff: "Aus", css: "Eigenes CSS", reset: "Seite zurücksetzen", close: "Schließen",
          f: { original: "Original", system: "System", serif: "Serif", mono: "Mono", rounded: "Rund" } },
  };
  let panel = null, L = TXT.en, picking = null;
  const el = (tag, cls, ...kids) => { const n = document.createElement(tag); if (cls) n.className = cls; n.append(...kids.filter((k) => k !== null && k !== undefined)); return n; };

  async function openPanel() {
    if (panel) { closePanel(); return; }
    const S = await flowLoad();
    L = TXT[S.lang] || TXT.en;
    await load();
    const h = document.createElement("windrad-flow-boost");
    const root = h.attachShadow({ mode: "closed" });
    const c1 = S.color1, c2 = S.color2;
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .p { position: fixed; top: 14px; right: 14px; bottom: 14px; z-index: 2147483645; width: 300px;
        display: flex; flex-direction: column; border-radius: 18px; overflow: hidden;
        font: 13px/1.4 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
        background: rgba(20, 38, 54, 0.88); backdrop-filter: blur(20px) saturate(1.35);
        border: 1px solid color-mix(in srgb, ${c1} 40%, rgba(255, 255, 255, 0.14));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 24px 60px rgba(0, 0, 0, 0.45);
        animation: in 380ms cubic-bezier(.16, 1, .3, 1) both; }
      .p.out { animation: out 220ms ease-in both; }
      .p.picking { opacity: .35; pointer-events: none; transition: opacity 200ms ease; }
      .head { display: flex; align-items: center; gap: 8px; padding: 12px 12px 10px 14px; border-bottom: 1px solid rgba(255,255,255,.1); }
      .head b { font-size: 15px; } .head span { flex: 1; opacity: .6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .body { flex: 1; overflow-y: auto; padding: 4px 14px 14px; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, ${c1} 60%, transparent) transparent; }
      h3 { margin: 14px 0 7px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: ${c1}; }
      .btn { all: unset; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; height: 34px; padding: 0 12px;
        border-radius: 10px; background: color-mix(in srgb, ${c1} 16%, transparent); border: 1px solid color-mix(in srgb, ${c1} 45%, rgba(255,255,255,.12));
        transition: background 150ms ease, transform 100ms ease; }
      .btn:hover { background: color-mix(in srgb, ${c1} 26%, transparent); } .btn:active { transform: scale(.97); }
      .btn.ghost { background: rgba(255,255,255,.06); border-color: rgba(255,255,255,.12); }
      .btn.wide { width: calc(100% - 26px); }
      .x { all: unset; cursor: pointer; width: 28px; height: 28px; border-radius: 8px; display: grid; place-items: center; opacity: .75; }
      .x:hover { background: rgba(255,255,255,.1); opacity: 1; }
      .list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
      .z { display: flex; align-items: center; gap: 6px; padding: 5px 6px 5px 9px; border-radius: 8px; background: rgba(255,255,255,.05);
        font: 11px ui-monospace, Consolas, monospace; }
      .z span { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; opacity: .8; }
      .z button { all: unset; cursor: pointer; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; opacity: .6; }
      .z button:hover { background: rgba(255,138,156,.22); color: #ff8a9c; opacity: 1; }
      .muted { opacity: .55; font-size: 12px; }
      .seg { display: grid; grid-template-columns: repeat(5, 1fr); gap: 3px; padding: 3px; border-radius: 10px; background: rgba(255,255,255,.05); }
      .seg button { all: unset; cursor: pointer; text-align: center; padding: 6px 0; border-radius: 7px; font-size: 11px; opacity: .7; transition: background 150ms ease; }
      .seg button.on { opacity: 1; background: color-mix(in srgb, ${c1} 24%, transparent); }
      .seg.seg3 { flex: 1; grid-template-columns: repeat(3, 1fr); }
      .row { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
      .row label { width: 78px; font-size: 12px; opacity: .8; }
      .row output { width: 42px; text-align: right; font-size: 12px; opacity: .7; font-variant-numeric: tabular-nums; }
      input[type=range] { flex: 1; accent-color: ${c1}; }
      .sw { display: flex; align-items: center; justify-content: space-between; margin: 8px 0; cursor: pointer; }
      .sw input { appearance: none; width: 34px; height: 19px; border-radius: 99px; background: rgba(255,255,255,.14); position: relative; cursor: pointer; margin: 0; }
      .sw input::after { content: ""; position: absolute; top: 3px; left: 3px; width: 13px; height: 13px; border-radius: 50%; background: #eee7f6; transition: transform 180ms ease; }
      .sw input:checked { background: ${c1}; } .sw input:checked::after { transform: translateX(15px); }
      textarea { width: 100%; min-height: 110px; box-sizing: border-box; resize: vertical; padding: 8px 10px; border-radius: 10px;
        border: 1px solid rgba(255,255,255,.12); background: rgba(255,255,255,.05); color: #eee7f6; font: 12px ui-monospace, Consolas, monospace; outline: none; }
      textarea:focus { border-color: ${c1}; }
      .foot { padding: 10px 14px 14px; border-top: 1px solid rgba(255,255,255,.1); }
      .hl { position: fixed; z-index: 2147483644; pointer-events: none; border-radius: 6px; border: 2px solid ${c1};
        background: color-mix(in srgb, ${c1} 18%, transparent); box-shadow: 0 0 0 9999px rgba(6,10,18,.18), 0 0 18px ${c1};
        transition: all 90ms ease; }
      .hint { position: fixed; z-index: 2147483646; left: 50%; top: 16px; translate: -50% 0; padding: 9px 16px; border-radius: 99px;
        background: rgba(20, 38, 54, 0.9); border: 1px solid ${c1}; box-shadow: 0 10px 28px rgba(0,0,0,.35);
        font: 600 13px "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
        animation: in 300ms cubic-bezier(.16, 1, .3, 1) both; }
      .hl.zapped { animation: zap 360ms ease-out both; }
      @keyframes zap { to { transform: scale(.85); opacity: 0; } }
      @keyframes in { from { opacity: 0; transform: translateX(16px) scale(.98); } }
      @keyframes out { to { opacity: 0; transform: translateX(16px) scale(.98); } }
      @media (prefers-reduced-motion: reduce) { .p, .hint { animation: none !important; } }`;

    const enabled = el("input"); enabled.type = "checkbox";
    const x = el("button", "x", "✕"); x.title = L.close;
    const zapBtn = el("button", "btn wide", "⚡ ", L.zap);
    const list = el("div", "list");
    const showAll = el("button", "btn ghost wide", L.showAll);
    const seg = el("div", "seg");
    const fontBtns = Object.keys(FONTS).map((k) => { const b = el("button", "", L.f[k]); b.addEventListener("click", () => { boost.font = k; change(); }); seg.append(b); return [k, b]; });
    const range = (min, max, step) => { const r = el("input"); r.type = "range"; r.min = min; r.max = max; r.step = step; return r; };
    const zoom = range(70, 160, 5), hue = range(0, 360, 5), sat = range(0, 200, 5);
    const zoomOut = el("output"), hueOut = el("output"), satOut = el("output");
    const dark = el("div", "seg seg3");
    const darkBtns = [["auto", L.dAuto], ["on", L.dOn], ["off", L.dOff]].map(([v, t]) => {
      const b = el("button", "", t); b.addEventListener("click", () => { boost.dark = v; change(); }); dark.append(b); return [v, b];
    });
    const cssBox = el("textarea"); cssBox.spellcheck = false; cssBox.placeholder = "/* e.g. */\nbody { line-height: 1.7; }";
    const reset = el("button", "btn ghost wide", L.reset);

    const body = el("div", "body",
      el("label", "sw", el("span", "", L.on), enabled),
      el("h3", "", L.zap), zapBtn, list, showAll,
      el("h3", "", L.font), seg,
      el("h3", "", L.size), el("div", "row", el("label", "", L.size), zoom, zoomOut),
      el("h3", "", L.colors),
      el("div", "row", el("label", "", L.dark), dark),
      el("div", "row", el("label", "", L.hue), hue, hueOut),
      el("div", "row", el("label", "", L.sat), sat, satOut),
      el("h3", "", L.css), cssBox);
    const p = el("div", "p", el("div", "head", el("b", "", "⚡ ", L.title), el("span", "", host), x), body, el("div", "foot", reset));
    root.append(style, p);
    document.documentElement.append(h);

    let saveT;
    const change = () => { apply(); syncPanel(); clearTimeout(saveT); saveT = setTimeout(save, 250); };
    enabled.addEventListener("change", () => { boost.enabled = enabled.checked; change(); });
    zoom.addEventListener("input", () => { boost.zoom = +zoom.value; change(); });
    hue.addEventListener("input", () => { boost.hue = +hue.value; change(); });
    sat.addEventListener("input", () => { boost.sat = +sat.value; change(); });
    cssBox.addEventListener("input", () => { boost.css = cssBox.value; change(); });
    showAll.addEventListener("click", () => { boost.zap = []; change(); });
    reset.addEventListener("click", () => { boost = { ...EMPTY }; change(); });
    zapBtn.addEventListener("click", () => startPicking(root, p));
    x.addEventListener("click", closePanel);
    root.addEventListener("keydown", (e) => { if (e.key === "Escape" && !picking) closePanel(); });

    panel = { h, p, root, enabled, list, fontBtns, zoom, hue, sat, zoomOut, hueOut, satOut, darkBtns, cssBox, showAll };
    syncPanel();
  }

  function syncPanel() {
    if (!panel) return;
    const P = panel;
    P.enabled.checked = boost.enabled !== false;
    P.list.replaceChildren(...(boost.zap.length ? boost.zap.map((sel, i) => {
      const del = el("button", "", "✕");
      del.addEventListener("click", () => { boost.zap.splice(i, 1); apply(); syncPanel(); save(); });
      const row = el("div", "z", el("span", "", sel), del); row.title = sel;
      return row;
    }) : [el("div", "muted", L.none)]));
    P.showAll.style.display = boost.zap.length ? "" : "none";
    for (const [k, b] of P.fontBtns) b.className = boost.font === k ? "on" : "";
    P.zoom.value = boost.zoom; P.zoomOut.textContent = `${boost.zoom}%`;
    P.hue.value = boost.hue; P.hueOut.textContent = `${boost.hue}°`;
    P.sat.value = boost.sat; P.satOut.textContent = `${boost.sat}%`;
    for (const [v, b] of P.darkBtns) b.className = boost.dark === v ? "on" : "";
    if (P.root.activeElement !== P.cssBox) P.cssBox.value = boost.css;
  }

  function closePanel() {
    if (!panel) return;
    stopPicking();
    const { h, p } = panel;
    panel = null;
    p.classList.add("out");
    setTimeout(() => h.remove(), 220);
  }

  /* --- zap: click elements to hide them ---------------------------------- */
  const goodClass = (c) => /^[a-z][a-z0-9_-]{1,32}$/i.test(c) && !/\d{4,}|^(is|has)-|active|hover|focus|selected|open/i.test(c);
  function selectorFor(node) {
    if (node.id && /^[a-z][\w-]{1,40}$/i.test(node.id) && !/\d{4,}/.test(node.id)) return `#${CSS.escape(node.id)}`;
    const parts = [];
    let n = node;
    while (n && n.nodeType === 1 && n !== document.body && n !== document.documentElement && parts.length < 4) {
      let part = n.tagName.toLowerCase();
      const cls = [...n.classList].filter(goodClass).slice(0, 2);
      if (cls.length) part += cls.map((c) => `.${CSS.escape(c)}`).join("");
      else if (n.parentElement) {
        const same = [...n.parentElement.children].filter((c) => c.tagName === n.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(n) + 1})`;
      }
      parts.unshift(part);
      const sel = parts.join(" > ");
      try { if (document.querySelectorAll(sel).length <= 3) return sel; } catch {}
      if (n.parentElement && n.parentElement.id && /^[a-z][\w-]{1,40}$/i.test(n.parentElement.id)) return `#${CSS.escape(n.parentElement.id)} > ${sel}`;
      n = n.parentElement;
    }
    return parts.join(" > ");
  }
  function startPicking(root, p) {
    if (picking) return;
    const hl = el("div", "hl"), hint = el("div", "hint", L.zapActive);
    root.append(hl, hint);
    p.classList.add("picking");
    let target = null;
    const move = (e) => {
      const t = document.elementFromPoint(e.clientX, e.clientY);
      if (!t || t === panel?.h || t === document.documentElement || t === document.body) { hl.style.opacity = 0; target = null; return; }
      target = t;
      const r = t.getBoundingClientRect();
      Object.assign(hl.style, { opacity: 1, left: `${r.left - 2}px`, top: `${r.top - 2}px`, width: `${r.width + 4}px`, height: `${r.height + 4}px` });
    };
    const click = (e) => {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      if (!target) return;
      const sel = selectorFor(target);
      if (sel && !boost.zap.includes(sel)) boost.zap.push(sel);
      hl.classList.add("zapped");
      setTimeout(() => hl.classList.remove("zapped"), 360);
      apply(); syncPanel(); save();
    };
    const key = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); stopPicking(); } };
    const block = (e) => { e.preventDefault(); e.stopPropagation(); };
    window.addEventListener("mousemove", move, true);
    window.addEventListener("click", click, true);
    window.addEventListener("mousedown", block, true);
    window.addEventListener("mouseup", block, true);
    window.addEventListener("keydown", key, true);
    window.addEventListener("contextmenu", (e) => { block(e); stopPicking(); }, { capture: true, once: true });
    picking = { hl, hint, p, off: () => {
      window.removeEventListener("mousemove", move, true);
      window.removeEventListener("click", click, true);
      window.removeEventListener("mousedown", block, true);
      window.removeEventListener("mouseup", block, true);
      window.removeEventListener("keydown", key, true);
    } };
  }
  function stopPicking() {
    if (!picking) return;
    picking.off(); picking.hl.remove(); picking.hint.remove(); picking.p.classList.remove("picking");
    picking = null;
  }

  browser.runtime.onMessage.addListener((m) => {
    if (m && m.type === "flow-boost-open") openPanel();
    if (m && m.type === "flow-dark-get") return Promise.resolve({ on: modulesOn && boost.enabled !== false && wantDark(boost) });
    if (m && m.type === "flow-dark-toggle") {                 // quick switch for this site
      boost.dark = wantDark(boost) ? "off" : "on";
      apply(); syncPanel(); save();
    }
  });
})();
