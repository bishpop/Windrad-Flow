/* =====================================================================
   Windrad Peek – content script
   Alt + click on a link -> floating glass window with the page inside.
   Everything lives in a closed shadow DOM, so the website's CSS can't
   touch it and it can't break the website.
   ===================================================================== */
(() => {
  "use strict";
  if (window.__windradPeek) return;
  window.__windradPeek = true;

  /* --- inside the preview frame: report where it is -----------------------
     Runs only in the frame Peek created (it carries the name
     "windrad-peek"). Tells the main page the current address, also when
     a site changes it without reloading (e.g. YouTube). */
  if (window.top !== window) {
    if (window.parent !== window.top || window.name !== "windrad-peek") return;
    let last = "";
    const report = () => {
      if (location.href === last) return;
      last = location.href;
      browser.runtime.sendMessage({ type: "peek-frame-url", url: location.href, title: document.title }).catch(() => {});
    };
    report();
    setInterval(report, 600);
    return;
  }

  const msg = (k) => (browser.i18n && browser.i18n.getMessage(k)) || k;
  const DEFAULTS = {
    enabled: true,
    mode: "overlay",       // overlay (floating in the page) | popup (small window)
    engine: "https://www.google.com/search?q=%s",
    trigger: "alt",        // alt | alt+shift | ctrl+alt
    width: 82, height: 86, // % of the window
    dim: true, blur: true, outside: true,
    color1: "#ff7a95", color2: "#4fe3e0",
  };
  let S = { ...DEFAULTS };
  const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
  // Peek is a module of Windrad Flow: settings in "peek", on/off in
  // "modules", colors are the Flow colors
  const load = () => browser.storage.local.get(["peek", "modules", "color1", "color2"]).then((v) => {
    S = { ...DEFAULTS, ...(v.peek || {}), enabled: !!(v.modules && v.modules.peek),
          color1: v.color1 || DEFAULTS.color1, color2: v.color2 || DEFAULTS.color2 };
    for (const k of ["color1", "color2"]) if (!HEX.test(S[k])) S[k] = DEFAULTS[k];   // only real hex colors
    S.width = Math.min(98, Math.max(30, +S.width || DEFAULTS.width));
    S.height = Math.min(98, Math.max(30, +S.height || DEFAULTS.height));
  }).catch(() => {});
  load();
  browser.storage.onChanged?.addListener(load);

  function matchesTrigger(e) {
    if (!S.enabled) return false;
    switch (S.trigger) {
      case "alt+shift": return e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey;
      case "ctrl+alt":  return e.altKey && e.ctrlKey && !e.shiftKey && !e.metaKey;
      default:          return e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey;
    }
  }

  /* --- Alt + click on a link -------------------------------------------- */
  function linkFrom(e) {
    const a = e.composedPath ? e.composedPath().find((n) => n.tagName === "A" && n.href) : e.target.closest?.("a[href]");
    if (!a) return null;
    try {
      const u = new URL(a.href, location.href);
      return /^https?:$/.test(u.protocol) ? u.href : null;
    } catch { return null; }
  }
  // capture phase on window: we are first, before the page's own handlers
  window.addEventListener("click", (e) => {
    if (e.button !== 0 || !matchesTrigger(e)) return;
    const url = linkFrom(e);
    if (!url) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (S.mode === "popup") browser.runtime.sendMessage({ type: "peek-popup", url }).catch(() => { location.href = url; });
    else {
      const a = e.composedPath ? e.composedPath().find((n) => n.tagName === "A") : null;
      open(url, e.clientX, e.clientY, a);
    }
  }, true);
  // Alt on its own would otherwise also start a "save link" drag / menu
  for (const type of ["mousedown", "mouseup", "auxclick"]) {
    window.addEventListener(type, (e) => {
      if (e.button === 0 && matchesTrigger(e) && linkFrom(e)) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
  }

  /* --- the window -------------------------------------------------------- */
  let host = null, curWrap = null, oldOverflow = "", currentUrl = "";

  const ICON_PATHS = {
    open:   "M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14zM5 5h6v2H7v10h10v-4h2v6H5z",
    copy:   "M8 7V3h12v14h-4v4H4V7zm2 0h6v8h2V5h-8zM6 9v10h8V9z",
    check:  "M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z",
    reload: "M12 4a8 8 0 0 1 7.4 5H17v2h6V5h-2v2.3A10 10 0 1 0 22 12h-2a8 8 0 1 1-8-8z",
    max:    "M4 4h7v2H7.4l4.3 4.3-1.4 1.4L6 7.4V11H4zm16 16h-7v-2h3.6l-4.3-4.3 1.4-1.4 4.3 4.3V13h2z",
    min:    "M11 13v7H9v-3.6l-4.3 4.3-1.4-1.4L7.6 15H4v-2zm2-2V4h2v3.6l4.3-4.3 1.4 1.4L16.4 9H20v2z",
    close:  "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
  };
  const SVG_NS = "http://www.w3.org/2000/svg";
  function icon(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("d", ICON_PATHS[name]);
    svg.append(path);
    return svg;
  }
  const setIcon = (btn, name) => btn.replaceChildren(icon(name));
  // small DOM helper: el("div", "class", child, child …)
  function el(tag, cls, ...kids) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    n.append(...kids);
    return n;
  }
  function button(cls, iconName) {
    const b = el("button", cls, icon(iconName));
    b.type = "button";
    return b;
  }

  function css() {
    return `
      :host { all: initial; }
      .wrap { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center;
              font: 13px/1.3 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6; }
      .scrim { position: absolute; inset: 0; background: ${S.dim ? "rgba(6, 10, 18, 0.45)" : "transparent"};
               ${S.blur ? "backdrop-filter: blur(6px) saturate(0.9);" : ""}
               }
      .card { position: relative; width: var(--w, ${S.width}vw); height: var(--h, ${S.height}vh);
              transition: width 380ms cubic-bezier(.16, 1, .3, 1), height 380ms cubic-bezier(.16, 1, .3, 1); display: flex; flex-direction: column;
              border-radius: 16px; overflow: hidden;
              background: rgba(20, 38, 54, 0.78); backdrop-filter: blur(18px) saturate(1.3);
              border: 1px solid color-mix(in srgb, ${S.color1} 40%, rgba(255, 255, 255, 0.14));
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 30px 80px rgba(0, 0, 0, 0.5);
              will-change: transform; }
      .card:focus { outline: none; }
      .bar { flex: none; height: 40px; display: flex; align-items: center; gap: 8px; padding: 0 6px 0 12px; }
      .dot { width: 8px; height: 8px; border-radius: 50%; flex: none;
             background: linear-gradient(135deg, ${S.color1}, ${S.color2}); box-shadow: 0 0 8px ${S.color1}; }
      .host { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: 0.85; }
      .host b { font-weight: 600; opacity: 1; }
      button { all: unset; cursor: pointer; width: 30px; height: 30px; border-radius: 9px;
               display: grid; place-items: center; color: rgba(238, 231, 246, 0.8);
               transition: background 150ms ease, color 150ms ease; }
      button:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
      button:focus-visible { outline: 2px solid ${S.color1}; outline-offset: 1px; }
      button.close:hover { background: rgba(255, 138, 156, 0.22); color: #ff8a9c; }
      button.done { color: ${S.color2}; }
      button svg { width: 17px; height: 17px; }
      .frame { position: relative; flex: 1; margin: 0 6px 6px; border-radius: 11px; overflow: hidden; background: #fff; }
      iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #fff;
               opacity: 0; transition: opacity 260ms ease; }
      iframe.ready { opacity: 1; }
      .frame { background: rgba(255, 255, 255, 0.04); }
      .load { position: absolute; left: 0; top: 0; height: 2px; width: 35%; border-radius: 2px;
              background: linear-gradient(90deg, transparent, ${S.color1}, ${S.color2}, transparent);
              animation: run 1.1s ease-in-out infinite; }
      .bar > * { animation: rise 360ms 120ms cubic-bezier(.16, 1, .3, 1) both; }
      @keyframes fade { from { opacity: 0; } }
      @keyframes unfade { to { opacity: 0; } }
      @keyframes rise { from { opacity: 0; transform: translateY(-4px); } }
      @keyframes run { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
      @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
    `;
  }

  /* --- "Mac zoom": the window grows out of the link you clicked ---------
     The card starts exactly on top of the link (position + size) and
     zooms to its final place; closing flies back into the link.
     Its content fades in once the window has taken shape. */
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let originEl = null, originPoint = null;

  function originRect() {
    const r = originEl && originEl.isConnected ? originEl.getBoundingClientRect() : null;
    if (r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth) return r;
    const p = originPoint || { x: innerWidth / 2, y: innerHeight / 2 };
    return { left: p.x - 20, top: p.y - 10, width: 40, height: 20 };
  }
  function fromOriginTransform(card) {
    const c = card.getBoundingClientRect();
    const r = originRect();
    const sx = Math.max(0.02, r.width / c.width), sy = Math.max(0.02, r.height / c.height);
    const dx = (r.left + r.width / 2) - (c.left + c.width / 2);
    const dy = (r.top + r.height / 2) - (c.top + c.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  }
  function zoomIn(wrap) {
    if (reduceMotion()) return;
    const card = wrap.querySelector(".card");
    card.animate(
      [{ transform: fromOriginTransform(card), opacity: 0.4, borderRadius: "8px" },
       { transform: "none", opacity: 1, borderRadius: "16px" }],
      { duration: 520, easing: "cubic-bezier(.16, 1, .3, 1)" });
    for (const part of wrap.querySelectorAll(".bar, .frame"))
      part.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 170, easing: "ease-out", fill: "backwards" });
    wrap.querySelector(".scrim").animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: "ease-out" });
  }
  function zoomOut(wrap) {
    if (reduceMotion()) return Promise.resolve();
    const card = wrap.querySelector(".card");
    for (const part of wrap.querySelectorAll(".bar, .frame"))
      part.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "forwards" });
    wrap.querySelector(".scrim").animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" });
    return card.animate(
      [{ transform: "none", opacity: 1, borderRadius: "16px" },
       { transform: fromOriginTransform(card), opacity: 0.3, borderRadius: "8px" }],
      { duration: 340, easing: "cubic-bezier(.5, 0, .75, 0)", fill: "forwards" }).finished.catch(() => {});
  }

  function showAddress(wrap, url, title) {
    let u;
    try { u = new URL(url); } catch { return; }
    wrap.querySelector(".host b").textContent = u.hostname.replace(/^www\./, "");
    wrap.querySelector(".host .path").textContent = (u.pathname + u.search).replace(/^\/$/, "");
    wrap.querySelector(".host").title = title ? `${title}\n${url}` : url;
  }

  async function open(url, x, y, linkEl) {
    originEl = linkEl || null;
    originPoint = { x, y };
    if (host) close(true);
    currentUrl = url;
    const res = await browser.runtime.sendMessage({ type: "peek-open", url }).catch(() => null);
    if (!res || !res.ok) { location.href = url; return; }   // no permission -> just open normally

    host = document.createElement("windrad-peek");
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = css();

    const wrap = document.createElement("div");
    wrap.className = "wrap";
    const u = new URL(url);
    const bar = el("div", "bar",
      el("span", "dot"),
      el("span", "host", el("b"), el("span", "path")),
      button("reload", "reload"), button("max", "max"), button("copy", "copy"),
      button("open", "open"), button("close", "close"));
    const card = el("div", "card", bar, el("div", "frame", el("div", "load")));
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    wrap.append(el("div", "scrim"), card);
    showAddress(wrap, url);

    const btnCopy = wrap.querySelector(".copy"), btnOpen = wrap.querySelector(".open"), btnClose = wrap.querySelector(".close");
    btnCopy.title = msg("copyLink"); btnCopy.setAttribute("aria-label", msg("copyLink"));
    btnOpen.title = msg("openNewTab"); btnOpen.setAttribute("aria-label", msg("openNewTab"));
    btnClose.title = msg("close"); btnClose.setAttribute("aria-label", msg("close"));

    const iframe = document.createElement("iframe");
    // no "allow-top-navigation": the page can't hijack the tab it is shown in
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-presentation");
    iframe.setAttribute("allow", "fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture");
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    // fade the page in once it has loaded (no white flash)
    iframe.addEventListener("load", () => { iframe.classList.add("ready"); wrap.querySelector(".load")?.remove(); });
    iframe.name = "windrad-peek";          // lets the frame script recognise itself
    iframe.src = url;
    wrap.querySelector(".frame").append(iframe);

    const btnReload = wrap.querySelector(".reload"), btnMax = wrap.querySelector(".max");
    btnReload.title = msg("reload"); btnReload.setAttribute("aria-label", msg("reload"));
    btnReload.addEventListener("click", () => {
      iframe.classList.remove("ready");
      if (!wrap.querySelector(".load")) wrap.querySelector(".frame").prepend(Object.assign(document.createElement("div"), { className: "load" }));
      iframe.src = currentUrl;
    });
    let maxed = false;
    const syncMax = () => {
      card.style.setProperty("--w", maxed ? "98vw" : `${S.width}vw`);
      card.style.setProperty("--h", maxed ? "96vh" : `${S.height}vh`);
      setIcon(btnMax, maxed ? "min" : "max");
      const t = msg(maxed ? "restoreSize" : "maximize");
      btnMax.title = t; btnMax.setAttribute("aria-label", t);
    };
    btnMax.addEventListener("click", () => { maxed = !maxed; syncMax(); });
    syncMax();
    btnClose.addEventListener("click", () => close());
    btnOpen.addEventListener("click", () => {
      browser.runtime.sendMessage({ type: "peek-newtab", url: currentUrl });
      close(true);
    });
    btnCopy.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(currentUrl); } catch {}
      setIcon(btnCopy, "check"); btnCopy.classList.add("done"); btnCopy.title = msg("copied");
      setTimeout(() => { setIcon(btnCopy, "copy"); btnCopy.classList.remove("done"); btnCopy.title = msg("copyLink"); }, 1400);
    });
    wrap.querySelector(".scrim").addEventListener("click", () => { if (S.outside) close(); });

    root.append(style, wrap);
    curWrap = wrap;
    document.documentElement.append(host);
    zoomIn(wrap);
    oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";        // page behind doesn't scroll
    // keyboard focus into the window (without a visible ring), so Esc works
    card.tabIndex = -1;
    card.focus({ preventScroll: true });
  }

  function close(instant) {
    if (!host) return;
    const h = host, w = curWrap;
    host = null; curWrap = null;
    document.documentElement.style.overflow = oldOverflow;
    browser.runtime.sendMessage({ type: "peek-close" }).catch(() => {});
    if (instant || !w) { h.remove(); return; }
    zoomOut(w).then(() => h.remove());         // fly back into the link
  }

  /* --- in a Peek popup window: small floating control pill ------------- */
  browser.runtime.sendMessage({ type: "peek-am-i-popup" }).then((r) => {
    if (!r || !r.popup) return;
    const pill = document.createElement("windrad-peek-pill");
    const root = pill.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
        :host { all: initial; }
        .pill { position: fixed; right: 14px; bottom: 14px; z-index: 2147483647; display: flex; gap: 4px; padding: 4px;
                border-radius: 14px; background: rgba(20, 38, 54, 0.78); backdrop-filter: blur(16px) saturate(1.3);
                border: 1px solid color-mix(in srgb, ${S.color1} 40%, rgba(255, 255, 255, 0.14));
                box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 10px 28px rgba(0, 0, 0, 0.35);
                font: 500 13px "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
                opacity: 0.35; transition: opacity 200ms ease; animation: in 420ms cubic-bezier(.16, 1, .3, 1) both; }
        .pill:hover, .pill:focus-within { opacity: 1; }
        button { all: unset; cursor: pointer; display: flex; align-items: center; gap: 6px; height: 30px; padding: 0 10px;
                 border-radius: 10px; transition: background 150ms ease; }
        button:hover { background: rgba(255, 255, 255, 0.1); }
        button.x:hover { background: rgba(255, 138, 156, 0.22); color: #ff8a9c; }
        svg { width: 16px; height: 16px; }
        @keyframes in { from { opacity: 0; transform: translateY(10px) scale(0.95); } }
    `;
    const tabBtn = button("tab", "open");
    tabBtn.append(el("span", "", msg("popupToTab")));
    const xBtn = button("x", "close");
    root.append(style, el("div", "pill", tabBtn, xBtn));
    xBtn.title = msg("popupClose");
    xBtn.setAttribute("aria-label", msg("popupClose"));
    tabBtn.addEventListener("click", () =>
      browser.runtime.sendMessage({ type: "peek-popup-to-tab", url: location.href }));
    xBtn.addEventListener("click", () => browser.runtime.sendMessage({ type: "peek-popup-close" }));
    document.documentElement.append(pill);
    // Esc closes the popup – but not while typing or in fullscreen
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape" || document.fullscreenElement) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable='true']")) return;
      browser.runtime.sendMessage({ type: "peek-popup-close" });
    });
  }).catch(() => {});

  /* --- messages from the background ---------------------------------------- */
  let lastPointer = null;   // where the context menu was opened (origin of the zoom)
  window.addEventListener("contextmenu", (e) => { lastPointer = { x: e.clientX, y: e.clientY, el: e.target.closest?.("a") }; }, true);

  function selectionOrigin() {
    const sel = getSelection();
    if (!sel || !sel.rangeCount) return null;
    const r = sel.getRangeAt(0).getBoundingClientRect();
    return r.width ? r : null;
  }
  function openWithMode(url, x, y, el) {
    if (S.mode === "popup") browser.runtime.sendMessage({ type: "peek-popup", url }).catch(() => {});
    else open(url, x, y, el);
  }

  browser.runtime.onMessage?.addListener((m) => {
    if (!m) return;
    if (m.type === "peek-frame-url" && host && curWrap) {      // preview moved on
      currentUrl = m.url;
      showAddress(curWrap, m.url, m.title);
    } else if (m.type === "peek-open-url") {                   // right-click menu
      const p = lastPointer || { x: innerWidth / 2, y: innerHeight / 2 };
      openWithMode(m.url, p.x, p.y, p.el);
    } else if (m.type === "peek-search") {                     // selected text
      const text = (m.text || String(getSelection() || "")).trim();
      if (!text) return;
      const r = selectionOrigin();
      const url = S.engine.replace("%s", encodeURIComponent(text));
      openWithMode(url, r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top + r.height / 2 : innerHeight / 2,
                   r ? { isConnected: true, getBoundingClientRect: () => r } : null);
    }
  });

  // Esc closes (works while focus is on the page or the toolbar;
  // inside the preview, the page there gets the keys)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && host) { e.preventDefault(); e.stopImmediatePropagation(); close(); }
  }, true);
  window.addEventListener("pagehide", () => close(true));
})();
