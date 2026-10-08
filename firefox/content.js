/* =====================================================================
   Windrad Flow – page helper
   Shows the command bar (an extension page) as a floating layer over the
   current page and removes it again. It doesn't read the page.
   ===================================================================== */
(() => {
  "use strict";
  if (window.__windradFlow) return;
  window.__windradFlow = true;

  let frame = null, oldOverflow = "";

  function close() {
    if (!frame) return;
    frame.remove();
    frame = null;
    document.documentElement.style.overflow = oldOverflow;
  }
  function open(tabId) {
    if (frame) { close(); return; }               // shortcut again = close
    frame = document.createElement("iframe");
    frame.src = browser.runtime.getURL(`palette.html?ctx=frame&tab=${tabId}`);
    frame.setAttribute("allowtransparency", "true");
    frame.style.cssText = "all: initial; position: fixed; inset: 0; width: 100vw; height: 100vh; border: 0;"
      + "z-index: 2147483647; background: transparent; color-scheme: normal;";
    oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.append(frame);
    frame.focus();
  }

  /* small glass message (space switched, link copied …) */
  let toastHost = null;
  function toast(text, color) {
    toastHost?.remove();
    const h = document.createElement("windrad-flow-toast");
    const root = h.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    const c = /^#[0-9a-f]{3,6}$/i.test(color || "") ? color : "#ff7a95";
    style.textContent = `
      :host { all: initial; }
      .t { position: fixed; left: 50%; top: 18px; translate: -50% 0; z-index: 2147483647;
           padding: 9px 18px; border-radius: 14px; max-width: min(420px, calc(100vw - 32px));
           white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
           font: 500 14px/1.3 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
           background: rgba(20, 38, 54, 0.82); backdrop-filter: blur(16px) saturate(1.3);
           border: 1px solid color-mix(in srgb, ${c} 55%, rgba(255, 255, 255, 0.15));
           box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 30px rgba(0, 0, 0, 0.35), 0 0 18px color-mix(in srgb, ${c} 25%, transparent);
           animation: in 340ms cubic-bezier(.16, 1, .3, 1) both, out 260ms ease 1300ms forwards; }
      @keyframes in { from { opacity: 0; transform: translateY(-10px) scale(0.96); } }
      @keyframes out { to { opacity: 0; transform: translateY(-8px); } }
      @media (prefers-reduced-motion: reduce) { .t { animation: out 1ms linear 1500ms forwards; } }`;
    const box = document.createElement("div");
    box.className = "t";
    box.setAttribute("role", "status");
    box.textContent = text;
    root.append(style, box);
    document.documentElement.append(h);
    toastHost = h;
    setTimeout(() => { h.remove(); if (toastHost === h) toastHost = null; }, 1700);
  }

  /* space switch: glass card with emoji, name and position dots, plus a
     soft colored sweep across the page in the direction you switched */
  let spaceHost = null;
  function spaceSwitch(m) {
    spaceHost?.remove();
    const sp = m.space || {};
    const c = /^#[0-9a-f]{3,6}$/i.test(sp.color || "") ? sp.color : "#ff7a95";
    const d = m.dir < 0 ? -1 : 1;
    const h = document.createElement("windrad-flow-space");
    const root = h.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; }
      .w { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; display: grid; place-items: center;
           font: 500 15px/1.3 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6; }
      .dim { position: absolute; inset: 0; background: rgba(6, 10, 18, 0.22); animation: dim 1150ms ease both; }
      .sweep { position: absolute; top: 0; bottom: 0; width: 70vw; left: 0;
               background: linear-gradient(90deg, transparent, color-mix(in srgb, ${c} 26%, transparent), transparent);
               animation: sweep 900ms cubic-bezier(.45, 0, .2, 1) both; }
      .card { position: relative; min-width: 220px; padding: 22px 34px 18px; border-radius: 22px; text-align: center;
              background: rgba(20, 38, 54, 0.78); backdrop-filter: blur(22px) saturate(1.4);
              border: 1px solid color-mix(in srgb, ${c} 55%, rgba(255, 255, 255, 0.15));
              box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 24px 60px rgba(0, 0, 0, 0.45), 0 0 40px color-mix(in srgb, ${c} 22%, transparent);
              animation: card 1150ms cubic-bezier(.16, 1, .3, 1) both; }
      .e { font-size: 44px; line-height: 1.1; display: block; animation: pop 600ms 80ms cubic-bezier(.2, 1.4, .4, 1) both; }
      .n { margin-top: 6px; font-size: 20px; font-weight: 600; }
      .dots { display: flex; gap: 7px; justify-content: center; margin-top: 12px; }
      .dots i { width: 7px; height: 7px; border-radius: 99px; background: rgba(255, 255, 255, 0.22);
                transition: width 300ms ease, background 300ms ease; }
      .dots i.on { width: 20px; background: ${c}; box-shadow: 0 0 8px ${c}; }
      @keyframes dim { 0% { opacity: 0; } 20%, 70% { opacity: 1; } 100% { opacity: 0; } }
      @keyframes sweep { from { transform: translateX(${d > 0 ? "-80vw" : "110vw"}); } to { transform: translateX(${d > 0 ? "110vw" : "-80vw"}); } }
      @keyframes card {
        0%   { opacity: 0; transform: translateX(${d * 60}px) scale(0.92); filter: blur(4px); }
        22%  { opacity: 1; transform: none; filter: none; }
        72%  { opacity: 1; transform: none; }
        100% { opacity: 0; transform: translateX(${-d * 40}px) scale(0.97); } }
      @keyframes pop { from { transform: scale(0.4) rotate(${d * -12}deg); opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .sweep { display: none; } .card, .e, .dim { animation-duration: 1ms; animation-delay: 900ms; } }`;
    const dots = document.createElement("div");
    dots.className = "dots";
    for (let i = 0; i < (m.count || 1); i++) {
      const dot = document.createElement("i");
      if (i === m.index) dot.className = "on";
      dots.append(dot);
    }
    const e = document.createElement("span"); e.className = "e"; e.textContent = sp.emoji || "✦";
    const n = document.createElement("div"); n.className = "n"; n.textContent = sp.name || "";
    const card = document.createElement("div"); card.className = "card"; card.setAttribute("role", "status");
    card.append(e, n, dots);
    const w = document.createElement("div"); w.className = "w";
    const dim = document.createElement("div"); dim.className = "dim";
    const sweep = document.createElement("div"); sweep.className = "sweep";
    w.append(dim, sweep, card);
    root.append(style, w);
    document.documentElement.append(h);
    spaceHost = h;
    setTimeout(() => { h.remove(); if (spaceHost === h) spaceHost = null; }, 1250);
  }

  browser.runtime.onMessage.addListener((m) => {
    if (m && m.type === "flow-space") spaceSwitch(m);
    if (m && m.type === "flow-toast") toast(m.text, m.color);
    if (m && m.type === "flow-palette") open(m.tabId);
    if (m && m.type === "flow-palette-close") close();
  });
  // the command bar asks to be closed. Checked by WHO sends it (our own
  // frame) – the origin of extension pages isn't reliable for this.
  window.addEventListener("message", (e) => {
    if (frame && e.source === frame.contentWindow && e.data && e.data.flow === "close") close();
  });
})();
