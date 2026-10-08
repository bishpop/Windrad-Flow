/* =====================================================================
   Windrad Flow – mini player (drawn on the page you're looking at)
   Two looks: "minimal" (title, artist, line, times, |< ▶ >|) and
   "standard" (with cover and more buttons). Drag it anywhere – the spot
   is remembered. Colors: Flow colors, a palette or adaptive (cover).
   ===================================================================== */
(() => {
  "use strict";
  if (window.top !== window || window.__windradFlowPlayer) return;
  window.__windradFlowPlayer = true;

  const TXT = {
    en: { video: "Watch the video here", backToTab: "Continue in the YouTube tab", closeVideo: "Close the video window", play: "Play", pause: "Pause", back: "Back 10 s", fwd: "Forward 10 s", prev: "Previous", next: "Next",
          mute: "Mute / unmute", go: "Go to the tab", close: "Hide player" },
    de: { video: "Video hier ansehen", backToTab: "Im YouTube-Tab weiterschauen", closeVideo: "Video-Fenster schließen", play: "Abspielen", pause: "Pause", back: "10 s zurück", fwd: "10 s vor", prev: "Vorheriger", next: "Nächster",
          mute: "Stumm / laut", go: "Zum Tab", close: "Player ausblenden" },
  };
  const P = {
    play: "M8 5v14l11-7z", pause: "M6 5h4v14H6zm8 0h4v14h-4z",
    prev: "M6 6h2v12H6zm3.5 6 8.5 6V6z", next: "M16 6h2v12h-2zM6 18l8.5-6L6 6z",
    back: "M12.5 8c-2.7 0-5.1 1-7 2.6L2 7v9h9l-3.6-3.6c1.4-1.2 3.2-1.9 5.1-1.9 3.5 0 6.5 2.3 7.6 5.5l2.4-.8C21.1 11 17.2 8 12.5 8",
    fwd: "M11.5 8c2.7 0 5.1 1 7 2.6L22 7v9h-9l3.6-3.6c-1.4-1.2-3.2-1.9-5.1-1.9-3.5 0-6.5 2.3-7.6 5.5L1.5 15.2C2.9 11 6.8 8 11.5 8",
    vol: "M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4",
    muted: "M3 9v6h4l5 5V4L7 9zm16.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z",
    video: "M3 5h18v14H3zm2 2v10h14V7zm7 2h5v4h-5z",
    back2tab: "M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14zM5 5h6v2H7v10h10v-4h2v6H5z",
    close: "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
  };
  const NS = "http://www.w3.org/2000/svg";
  const icon = (n) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24");
    const p = document.createElementNS(NS, "path"); p.setAttribute("fill", "currentColor"); p.setAttribute("d", P[n]); s.append(p); return s; };
  const el = (tag, cls, ...kids) => { const n = document.createElement(tag); if (cls) n.className = cls; n.append(...kids.filter(Boolean)); return n; };
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = String(s % 60).padStart(2, "0");
    return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`; };
  const HEX = /^#[0-9a-f]{3,6}$/i;
  const col = (v, d) => (HEX.test(v || "") ? v : d);

  let host = null, ui = null, poll = null, built = "";

  // everything goes through Flow's background – it forwards to the
  // picture-in-picture window if the video plays there
  const send = (cmd) => browser.runtime.sendMessage({ type: "flow-player-cmd", cmd }).then((s) => { if (s) update(s); }).catch(() => {});

  function css(s) {
    const L = s.look || {};
    const c1 = col(L.c1, "#ff7a95"), c2 = col(L.c2, "#4fe3e0"), bg = col(L.bg, "#142636"), tx = col(L.text, "#eee7f6");
    return `
      :host { all: initial; }
      .p { position: fixed; z-index: 2147483646; width: 290px; color: ${tx}; box-sizing: border-box;
           font: 13px/1.3 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
           background: ${s.glass ? `color-mix(in srgb, ${bg} 74%, transparent)` : bg};
           ${s.glass ? "backdrop-filter: blur(18px) saturate(1.35);" : ""}
           border: 1px solid color-mix(in srgb, ${c1} 40%, rgba(255, 255, 255, 0.14));
           box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 16px 40px rgba(0, 0, 0, 0.4);
           cursor: grab; user-select: none; touch-action: none;
           transition: border-color 400ms ease, background 400ms ease;
           animation: in 380ms cubic-bezier(.16, 1, .3, 1) both; }
      .p.drag { cursor: grabbing; box-shadow: inset 0 1px 0 rgba(255,255,255,.08), 0 22px 50px rgba(0,0,0,.5); transition: none; }
      .p.out { animation: out 220ms ease-in both; }
      button { all: unset; cursor: pointer; display: grid; place-items: center; color: ${tx}; opacity: .85; border-radius: 10px;
               transition: background 150ms ease, opacity 150ms ease, transform 100ms ease; }
      button:hover { background: rgba(255, 255, 255, 0.1); opacity: 1; }
      button:active { transform: scale(0.9); }
      button:focus-visible { outline: 2px solid ${c1}; }
      .x { position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%; opacity: 0; }
      .p:hover .x { opacity: .7; }
      .x:hover { background: rgba(255, 138, 156, 0.22); color: #ff8a9c; opacity: 1; }
      .x svg { width: 12px; height: 12px; }
      .vid { position: absolute; top: 8px; right: 34px; width: 22px; height: 22px; border-radius: 7px; opacity: 0; }
      .p:hover .vid { opacity: .75; }
      .vid:hover { opacity: 1; background: color-mix(in srgb, ${c1} 25%, transparent); color: ${c1}; }
      .vid svg { width: 13px; height: 13px; }
      .tiny .vid { position: static; flex: none; }
      .title { font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      .title:hover { text-decoration: underline; text-decoration-color: ${c1}; text-underline-offset: 3px; }
      .artist { opacity: .62; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; cursor: pointer; }
      .line { height: 3px; border-radius: 3px; background: rgba(255, 255, 255, 0.16); position: relative; cursor: pointer; }
      .line:hover { height: 5px; margin-top: -1px; margin-bottom: -1px; }
      .line i { position: absolute; inset: 0 auto 0 0; border-radius: 3px; background: linear-gradient(90deg, ${c1}, ${c2}); transition: width 1s linear; }
      .line b { position: absolute; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%; background: ${tx};
                box-shadow: 0 0 8px ${c1}; opacity: 0; transition: opacity 150ms ease, left 1s linear; }
      .p:hover .line b { opacity: 1; }
      .times { display: flex; justify-content: space-between; font-size: 11px; opacity: .62; font-variant-numeric: tabular-nums; }
      .live .line, .live .times { display: none; }

      /* ---- minimal (your sketch) ---- */
      .p.minimal { padding: 14px 18px 12px; border-radius: 24px; }
      .minimal .title { font-size: 16px; padding-right: 18px; }
      .minimal .artist { margin-top: 2px; font-size: 12.5px; }
      .minimal .line { margin: 12px 0 6px; }
      .minimal .ctl { display: flex; justify-content: center; align-items: center; gap: 22px; margin-top: 2px; }
      .minimal .ctl button { width: 30px; height: 30px; }
      .minimal .ctl button svg { width: 17px; height: 17px; }
      .minimal .ctl .main { width: 38px; height: 38px; border-radius: 50%; border: 2px solid ${c1}; opacity: 1; color: ${c1}; }
      .minimal .ctl .main:hover { background: color-mix(in srgb, ${c1} 18%, transparent); }

      /* ---- standard (with cover) ---- */
      .p.standard { width: 320px; padding: 10px; border-radius: 16px; }
      .standard .top { display: flex; gap: 10px; align-items: center; padding-right: 22px; }
      .standard .art { width: 46px; height: 46px; flex: none; border-radius: 10px; background: rgba(255,255,255,.07); overflow: hidden; display: grid; place-items: center; }
      .standard .art img { width: 100%; height: 100%; object-fit: cover; animation: fade 300ms ease both; }
      .standard .art img.fav { width: 22px; height: 22px; object-fit: contain; }
      .standard .txt { flex: 1; min-width: 0; }
      .standard .line { margin: 10px 2px 4px; }
      .standard .times { margin: 0 2px; }
      .standard .ctl { display: flex; align-items: center; justify-content: space-between; margin-top: 6px; }
      .standard .ctl button { width: 32px; height: 32px; }
      .standard .ctl button svg { width: 18px; height: 18px; }
      .standard .ctl .main { width: 40px; height: 40px; border-radius: 50%; opacity: 1; color: #10141c; background: linear-gradient(135deg, ${c1}, ${c2}); }
      .standard .ctl .main:hover { filter: brightness(1.08); background: linear-gradient(135deg, ${c1}, ${c2}); }

      /* ---- tiny (Zen style): equalizer, title / artist, play on hover ---- */
      .p.tiny { width: 220px; padding: 7px 8px 9px 11px; border-radius: 14px; display: flex; align-items: center; gap: 9px; overflow: hidden; }
      .tiny .eq { width: 13px; height: 11px; flex: none;
        background: linear-gradient(${c1}, ${c2}) 0 100% / 3px 40% no-repeat, linear-gradient(${c1}, ${c2}) 50% 100% / 3px 80% no-repeat,
                    linear-gradient(${c1}, ${c2}) 100% 100% / 3px 55% no-repeat;
        animation: eq 900ms ease-in-out infinite alternate; }
      .tiny.paused .eq { animation-play-state: paused; opacity: .5; }
      .tiny .txt { flex: 1; min-width: 0; }
      .tiny .title { font-size: 12px; font-weight: 600; padding-right: 0; }
      .tiny .artist { font-size: 10.5px; }
      .tiny .main { width: 26px; height: 26px; border-radius: 50%; flex: none; opacity: 0; transform: scale(.85);
        transition: opacity 150ms ease, transform 150ms ease, background 150ms ease; }
      .tiny .main svg { width: 13px; height: 13px; }
      .p.tiny:hover .main, .tiny.paused .main { opacity: 1; transform: none; }
      .tiny .hair { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: rgba(255, 255, 255, 0.08); }
      .tiny .hair i { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, ${c1}, ${c2}); transition: width 1s linear; }
      /* tiny: video, play and close sit in one row – no overlapping */
      .tiny .x, .tiny .vid { position: static; flex: none; width: 22px; height: 22px; margin: 0; }
      .tiny .x { margin-left: -4px; }
      .p.tiny:hover .x, .p.tiny:hover .vid { opacity: .75; }
      @keyframes eq { 0% { background-size: 3px 40%, 3px 85%, 3px 55%; } 33% { background-size: 3px 90%, 3px 35%, 3px 75%; }
                      66% { background-size: 3px 55%, 3px 70%, 3px 30%; } 100% { background-size: 3px 75%, 3px 45%, 3px 95%; } }
      @keyframes in { from { opacity: 0; transform: translateY(14px) scale(0.97); } }
      @keyframes out { to { opacity: 0; transform: translateY(10px) scale(0.98); } }
      @keyframes fade { from { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .p { animation: none !important; } }`;
  }

  function build(s) {
    host?.remove();
    host = document.createElement("windrad-flow-player");
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = css(s);
    const L = TXT[s.lang] || TXT.en;
    const btn = (cls, name, cmd, label) => {
      const b = el("button", cls, icon(name)); b.title = label; b.setAttribute("aria-label", label);
      b.addEventListener("click", (e) => { e.stopPropagation(); cmd(); }); return b;
    };
    ui = { style };
    ui.title = el("div", "title"); ui.artist = el("div", "artist");
    for (const t of [ui.title, ui.artist]) { t.title = L.go; t.addEventListener("click", (e) => { if (!moved) send("goto"); e.stopPropagation(); }); }
    ui.fill = el("i"); ui.knob = el("b");
    ui.line = el("div", "line", ui.fill, ui.knob);
    ui.line.addEventListener("pointerdown", (e) => e.stopPropagation());
    ui.line.addEventListener("click", (e) => { e.stopPropagation(); const r = ui.line.getBoundingClientRect(); send((e.clientX - r.left) / r.width); });
    ui.cur = el("span"); ui.dur = el("span");
    ui.play = btn("main", "pause", () => send("toggle"), L.pause);
    const prev = btn("", "prev", () => send("prev"), L.prev), next = btn("", "next", () => send("next"), L.next);
    const x = btn("x", "close", () => { send("dismiss"); hide(); }, L.close);
    ui.vid = s.ytId ? btn("vid", "video", () => openVideo(), L.video) : null;
    ui.ytId = s.ytId;
    if (s.style === "tiny") {
      // knob / line / times exist but aren't shown – the hairline shows progress
      ui.hair = el("i");
      ui.box = el("div", "p tiny", el("span", "eq"), el("div", "txt", ui.title, ui.artist), ui.vid, ui.play, el("div", "hair", ui.hair), x);
    } else if (s.style === "standard") {
      ui.art = el("span", "art");
      ui.mute = btn("", "vol", () => send("mute"), L.mute);
      ui.box = el("div", "p standard",
        el("div", "top", ui.art, el("div", "txt", ui.title, ui.artist)), ui.line, el("div", "times", ui.cur, ui.dur),
        el("div", "ctl", ui.mute, prev, btn("", "back", () => send("back"), L.back), ui.play,
           btn("", "fwd", () => send("fwd"), L.fwd), next, el("span", "", "")), ui.vid, x);
    } else {
      ui.box = el("div", "p minimal", ui.title, ui.artist, ui.line, el("div", "times", ui.cur, ui.dur),
        el("div", "ctl", prev, ui.play, next), ui.vid, x);
    }
    for (const b of ui.box.querySelectorAll("button")) b.addEventListener("pointerdown", (e) => e.stopPropagation());
    root.append(style, ui.box);
    document.documentElement.append(host);
    built = `${s.style}|${s.glass}|${JSON.stringify(s.look)}|${s.lang}|${s.pos}|${s.ytId}`;
    place(s);
    setupDrag(s);
  }

  /* --- position: saved spot, else the chosen corner --------------------- */
  let moved = false;
  async function place(s) {
    const { playerPos } = await browser.storage.local.get("playerPos").catch(() => ({}));
    const b = ui.box;
    if (playerPos) {
      const x = Math.min(Math.max(8, playerPos.x * innerWidth), innerWidth - b.offsetWidth - 8);
      const y = Math.min(Math.max(8, playerPos.y * innerHeight), innerHeight - b.offsetHeight - 8);
      Object.assign(b.style, { left: `${x}px`, top: `${y}px`, right: "auto", bottom: "auto" });
    } else {
      Object.assign(b.style, { left: s.pos === "right" ? "auto" : "18px", right: s.pos === "right" ? "18px" : "auto", bottom: "18px", top: "auto" });
    }
  }
  function setupDrag() {
    const b = ui.box;
    b.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      b.setPointerCapture(e.pointerId);
      const r = b.getBoundingClientRect();
      const sx = e.clientX - r.left, sy = e.clientY - r.top, x0 = e.clientX, y0 = e.clientY;
      moved = false;
      const move = (ev) => {
        if (!moved && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
        moved = true;
        b.classList.add("drag");
        const x = Math.min(Math.max(0, ev.clientX - sx), innerWidth - b.offsetWidth);
        const y = Math.min(Math.max(0, ev.clientY - sy), innerHeight - b.offsetHeight);
        Object.assign(b.style, { left: `${x}px`, top: `${y}px`, right: "auto", bottom: "auto" });
      };
      const up = () => {
        b.removeEventListener("pointermove", move); b.removeEventListener("pointerup", up);
        b.classList.remove("drag");
        if (moved) browser.storage.local.set({ playerPos: { x: b.offsetLeft / innerWidth, y: b.offsetTop / innerHeight } });
        setTimeout(() => { moved = false; }, 0);
      };
      b.addEventListener("pointermove", move); b.addEventListener("pointerup", up);
    });
  }

  let lastState = null;
  function update(s) {
    if (!s) { hide(); return; }
    lastState = s;
    const key = `${s.style}|${s.glass}|${JSON.stringify(s.look)}|${s.lang}|${s.pos}|${s.ytId}`;
    if (!host || key !== built) build(s);
    const L = TXT[s.lang] || TXT.en;
    ui.title.textContent = s.title;
    ui.artist.textContent = s.artist && s.artist !== s.title ? s.artist : s.host;
    if (ui.art) {
      const pic = s.art || s.fav;
      if (pic && ui.art.firstChild?.getAttribute("src") !== pic) {
        const img = el("img", s.art ? "" : "fav"); img.alt = ""; img.src = pic; img.onerror = () => img.remove();
        ui.art.replaceChildren(img);
      }
    }
    if (!vid) {                                        // with the video window, it reports its own state
      ui.play.replaceChildren(icon(s.paused ? "play" : "pause"));
      ui.play.title = s.paused ? L.play : L.pause;
    }
    if (ui.mute) ui.mute.replaceChildren(icon(s.muted ? "muted" : "vol"));
    ui.box.classList.toggle("live", !s.duration);
    const pct = s.duration ? Math.min(100, (s.time / s.duration) * 100) : 0;
    ui.fill.style.width = `${pct}%`;
    if (ui.hair) ui.hair.style.width = `${pct}%`;
    if (!vid) ui.box.classList.toggle("paused", !!s.paused);
    if (vid && ui.vid) ui.vid.style.display = "none";
    ui.knob.style.left = `${pct}%`;
    ui.cur.textContent = fmt(s.time); ui.dur.textContent = fmt(s.duration);
    if (!poll) poll = setInterval(() => { if (!document.hidden) send("state"); }, 1000);
  }

  function hide() {
    if (pip) closeVideo();                          // back on the video's tab: it continues there
    clearInterval(poll); poll = null;
    if (!host) return;
    const h = host, box = ui.box;
    host = null; built = "";
    box.classList.add("out");
    setTimeout(() => h.remove(), 220);
  }

  /* ======================================================================
     Video window. Two kinds (settings → Mini player):
     - "pip": always-on-top picture-in-picture window (Firefox 151+,
       Document Picture-in-Picture) with YouTube's embedded player
     - "window": the real YouTube page in a small Firefox window (background)
     ====================================================================== */
  const vid = null;                                       // (kept for older code paths)
  let pip = null;                                         // { win, frame, time, duration, paused, title }

  function openVideo() {
    const mode = (lastState && lastState.videoMode) || "pip";
    browser.runtime.sendMessage({ type: "flow-player-cmd", cmd: mode === "window" ? "videoOut" : "pipPrompt" }).catch(() => {});
  }

  async function openPip(api) {
    const ytId = ui && ui.ytId;
    if (!ytId) return;
    const { pipSize } = await browser.storage.local.get("pipSize").catch(() => ({}));
    let win;
    try {
      // must happen right after your click (the browser requires that)
      win = await api.requestWindow({ width: (pipSize && pipSize.w) || 480, height: (pipSize && pipSize.h) || 270 });
    } catch (e) {
      browser.runtime.sendMessage({ type: "flow-player-cmd", cmd: "videoOut" }).catch(() => {});   // fallback: Firefox window
      return;
    }
    const st = await browser.runtime.sendMessage({ type: "flow-player-cmd", cmd: "pipOut" }).catch(() => null);
    const start = Math.max(0, Math.floor((st && st.time) || 0));
    const d = win.document;
    const style = d.createElement("style");
    style.textContent = `html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
      iframe { position: fixed; inset: 0; width: 100%; height: 100%; border: 0; }`;
    d.head.append(style);
    d.title = (st && st.title) || "YouTube";
    const frame = d.createElement("iframe");
    frame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
    frame.setAttribute("allowfullscreen", "");
    frame.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    frame.src = `https://www.youtube.com/embed/${encodeURIComponent(ytId)}?autoplay=1&start=${start}&enablejsapi=1&rel=0&playsinline=1&origin=${encodeURIComponent(location.origin)}`;
    d.body.append(frame);
    pip = { win, frame, time: start, duration: (st && st.duration) || 0, paused: false };

    // the embedded player reports time, length and state (YouTube's iframe API)
    const listen = () => frame.contentWindow && frame.contentWindow.postMessage(
      JSON.stringify({ event: "listening", id: "windrad", channel: "widget" }), "https://www.youtube.com");
    frame.addEventListener("load", () => { listen(); setTimeout(listen, 1000); });
    win.addEventListener("message", (e) => {
      if (!pip || e.source !== frame.contentWindow) return;
      try {
        const m = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const info = m && m.info;
        if (!info) return;
        if (typeof info.currentTime === "number") pip.time = info.currentTime;
        if (typeof info.duration === "number" && info.duration) pip.duration = info.duration;
        if (typeof info.playerState === "number") pip.paused = info.playerState !== 1 && info.playerState !== 3;
      } catch {}
    });
    // window closed (✕, or back to the tab) -> the YouTube tab continues there
    win.addEventListener("pagehide", () => {
      if (!pip) return;
      const p = pip;
      pip = null;
      browser.storage.local.set({ pipSize: { w: win.innerWidth, h: win.innerHeight } }).catch(() => {});
      browser.runtime.sendMessage({ type: "flow-player-cmd", cmd: { handBack: p.time, play: !p.paused } }).catch(() => {});
    });
  }

  function pipCommand(func, args = []) {
    if (!pip || !pip.frame.contentWindow) return;
    pip.frame.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube.com");
  }
  function closeVideo() { if (pip) pip.win.close(); }

  // the background asks this page (the one hosting the window) for state / commands
  browser.runtime.onMessage.addListener((m) => {
    if (!m || !pip) return;
    if (m.type === "flow-pip-state") return Promise.resolve({ time: pip.time, duration: pip.duration, paused: pip.paused });
    if (m.type === "flow-pip-cmd") {
      const c = m.cmd;
      if (c === "toggle") { pipCommand(pip.paused ? "playVideo" : "pauseVideo"); pip.paused = !pip.paused; }
      else if (c === "back") pipCommand("seekTo", [Math.max(0, pip.time - 10), true]);
      else if (c === "fwd") pipCommand("seekTo", [pip.time + 10, true]);
      else if (typeof c === "number" && pip.duration) { pip.time = c * pip.duration; pipCommand("seekTo", [pip.time, true]); }
      return Promise.resolve(true);
    }
  });

  browser.runtime.onMessage.addListener((m) => { if (m && m.type === "flow-player") update(m.state); });
  // "back in the corner" in the settings -> rebuild at the next update
  browser.storage.onChanged.addListener((c) => { if (c.playerPos && !c.playerPos.newValue) built = ""; });
  browser.runtime.sendMessage({ type: "flow-player-hello" }).then((s) => { if (s) update(s); }).catch(() => {});
})();
