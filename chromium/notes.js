/* =====================================================================
   Windrad Flow – notes per page (drawn on the page, closed shadow DOM)
   A note belongs to the whole site ("site:host") or one page
   ("page:origin+path"). Saved automatically while you type.
   ===================================================================== */
(() => {
  "use strict";
  if (window.top !== window || window.__windradFlowNotes) return;
  window.__windradFlowNotes = true;

  const TXT = {
    en: { title: "Note", site: "Site", page: "Page", ph: "Write something about this page …", saved: "Saved",
          del: "Delete note", close: "Close", open: "Note", scopeHint: "Note for the whole site or only this page" },
    de: { title: "Notiz", site: "Website", page: "Seite", ph: "Schreib etwas zu dieser Seite …", saved: "Gespeichert",
          del: "Notiz löschen", close: "Schließen", open: "Notiz", scopeHint: "Notiz für die ganze Website oder nur diese Seite" },
  };
  const host = location.hostname.replace(/^www\./, "");
  const KEY = { site: `site:${host}`, page: `page:${location.origin}${location.pathname}` };
  let S = null, L = TXT.en, note = null, scope = "site", ui = null, pill = null, saveTimer = null;

  const el = (tag, cls, ...kids) => { const n = document.createElement(tag); if (cls) n.className = cls; n.append(...kids.filter(Boolean)); return n; };
  const NS = "http://www.w3.org/2000/svg";
  const P = {
    note: "M5 3h11l4 4v14H5zm2 2v14h11V8h-3V5zm2 6h7v2H9zm0 4h7v2H9z",
    trash: "M9 3h6l1 2h4v2H4V5h4zM6 9h12l-1 12H7z",
    close: "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
  };
  const icon = (n) => { const s = document.createElementNS(NS, "svg"); s.setAttribute("viewBox", "0 0 24 24");
    const p = document.createElementNS(NS, "path"); p.setAttribute("fill", "currentColor"); p.setAttribute("d", P[n]); s.append(p); return s; };

  async function load() {
    S = await flowLoad();
    L = TXT[S.lang] || TXT.en;
    const { notes = {}, notesUi = null } = await browser.storage.local.get(["notes", "notesUi"]);
    if (notes[KEY.page]) { note = notes[KEY.page]; scope = "page"; }
    else if (notes[KEY.site]) { note = notes[KEY.site]; scope = "site"; }
    else { note = null; scope = "site"; }
    return notesUi;
  }

  function css(c1, c2) {
    return `
      :host { all: initial; }
      .card { position: fixed; z-index: 2147483645; width: 300px; height: 230px; min-width: 220px; min-height: 150px;
        display: flex; flex-direction: column; border-radius: 16px; overflow: hidden; resize: both;
        font: 13px/1.45 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
        background: rgba(20, 38, 54, 0.84); backdrop-filter: blur(18px) saturate(1.35);
        border: 1px solid color-mix(in srgb, ${c1} 40%, rgba(255, 255, 255, 0.14));
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 18px 44px rgba(0, 0, 0, 0.42);
        animation: in 360ms cubic-bezier(.16, 1, .3, 1) both; }
      .card.out { animation: out 200ms ease-in both; }
      .head { flex: none; display: flex; align-items: center; gap: 8px; padding: 8px 8px 6px 12px; cursor: grab; user-select: none; }
      .card.drag .head { cursor: grabbing; }
      .head svg.ic { width: 15px; height: 15px; color: ${c1}; flex: none; }
      .ttl { flex: 1; min-width: 0; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ttl span { font-weight: 400; opacity: .6; }
      .seg { display: flex; padding: 2px; gap: 2px; border-radius: 8px; background: rgba(255, 255, 255, 0.06); }
      .seg button { all: unset; cursor: pointer; padding: 2px 8px; border-radius: 6px; font-size: 11px; color: rgba(238, 231, 246, .6);
        transition: background 150ms ease, color 150ms ease; }
      .seg button.on { color: #eee7f6; background: color-mix(in srgb, ${c1} 26%, transparent); }
      .ib { all: unset; cursor: pointer; width: 24px; height: 24px; border-radius: 7px; display: grid; place-items: center;
        color: rgba(238, 231, 246, .7); transition: background 150ms ease, color 150ms ease; }
      .ib:hover { background: rgba(255, 255, 255, .1); color: #fff; }
      .ib.del:hover { background: rgba(255, 138, 156, .22); color: #ff8a9c; }
      .ib svg { width: 14px; height: 14px; }
      textarea { flex: 1; margin: 0 8px; padding: 8px 6px; resize: none; border: 0; outline: none; background: transparent;
        color: #eee7f6; font: inherit; scrollbar-width: thin; scrollbar-color: color-mix(in srgb, ${c1} 60%, transparent) transparent; }
      textarea::placeholder { color: rgba(238, 231, 246, .4); }
      .foot { flex: none; height: 22px; padding: 0 12px 4px; font-size: 11px; color: ${c2}; opacity: 0; transition: opacity 300ms ease; }
      .foot.show { opacity: .85; }
      .pill { position: fixed; right: 18px; bottom: 18px; z-index: 2147483645;
        display: flex; align-items: center; gap: 6px; padding: 7px 12px 7px 10px; border-radius: 99px; cursor: pointer;
        font: 600 12px "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
        background: rgba(20, 38, 54, 0.8); backdrop-filter: blur(14px);
        border: 1px solid color-mix(in srgb, ${c1} 45%, rgba(255, 255, 255, 0.14));
        box-shadow: 0 8px 22px rgba(0, 0, 0, .35); animation: in 360ms cubic-bezier(.16, 1, .3, 1) both;
        transition: transform 150ms ease, border-color 150ms ease; }
      .pill:hover { transform: translateY(-2px); border-color: ${c1}; }
      .pill svg { width: 14px; height: 14px; color: ${c1}; }
      @keyframes in { from { opacity: 0; transform: translateY(12px) scale(.97); } }
      @keyframes out { to { opacity: 0; transform: translateY(8px) scale(.97); } }
      @media (prefers-reduced-motion: reduce) { .card, .pill { animation: none !important; } }`;
  }

  function hostEl() {
    const h = document.createElement("windrad-flow-note");
    const root = h.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = css(S.color1, S.color2);
    root.append(style);
    document.documentElement.append(h);
    return { h, root };
  }

  /* --- small "Note" pill on pages that have one ------------------------- */
  function showPill() {
    if (pill || ui) return;
    const { h, root } = hostEl();
    const b = el("div", "pill", icon("note"), el("span", "", L.open));
    b.setAttribute("role", "button");
    b.addEventListener("click", () => { hidePill(); open(); });
    root.append(b);
    pill = h;
  }
  const hidePill = () => { pill?.remove(); pill = null; };

  /* --- the note window -------------------------------------------------- */
  async function open() {
    if (ui) { close(); return; }                       // shortcut again = close
    const pos = await load();
    hidePill();
    const { h, root } = hostEl();
    const ta = el("textarea", "");
    ta.placeholder = L.ph;
    ta.value = note ? note.text : "";
    const foot = el("div", "foot", L.saved);
    const segSite = el("button", "", L.site), segPage = el("button", "", L.page);
    const seg = el("div", "seg", segSite, segPage);
    seg.title = L.scopeHint;
    const syncSeg = () => { segSite.className = scope === "site" ? "on" : ""; segPage.className = scope === "page" ? "on" : ""; };
    const del = el("button", "ib del", icon("trash")); del.title = L.del;
    const x = el("button", "ib", icon("close")); x.title = L.close;
    const ic = icon("note"); ic.setAttribute("class", "ic");
    const head = el("div", "head", ic, el("div", "ttl", `${L.title} `, el("span", "", `· ${host}`)), seg, del, x);
    const card = el("div", "card", head, ta, foot);
    root.append(card);
    syncSeg();

    // position + size: remembered for all notes, kept inside the window
    const w = Math.min(pos?.w || 300, innerWidth - 24), hh = Math.min(pos?.h || 230, innerHeight - 24);
    card.style.width = `${w}px`; card.style.height = `${hh}px`;
    const left = pos ? Math.min(Math.max(8, pos.x * innerWidth), innerWidth - w - 8) : innerWidth - w - 20;
    const top = pos ? Math.min(Math.max(8, pos.y * innerHeight), innerHeight - hh - 8) : innerHeight - hh - 20;
    card.style.left = `${left}px`; card.style.top = `${top}px`;

    const savePos = () => browser.storage.local.set({ notesUi: {
      x: card.offsetLeft / innerWidth, y: card.offsetTop / innerHeight, w: card.offsetWidth, h: card.offsetHeight } });
    new ResizeObserver(() => { clearTimeout(card._rt); card._rt = setTimeout(savePos, 300); }).observe(card);

    head.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || e.target.closest("button")) return;
      e.preventDefault(); head.setPointerCapture(e.pointerId);
      const sx = e.clientX - card.offsetLeft, sy = e.clientY - card.offsetTop;
      card.classList.add("drag");
      const mv = (ev) => {
        card.style.left = `${Math.min(Math.max(0, ev.clientX - sx), innerWidth - card.offsetWidth)}px`;
        card.style.top = `${Math.min(Math.max(0, ev.clientY - sy), innerHeight - card.offsetHeight)}px`;
      };
      const up = () => { head.removeEventListener("pointermove", mv); head.removeEventListener("pointerup", up); card.classList.remove("drag"); savePos(); };
      head.addEventListener("pointermove", mv); head.addEventListener("pointerup", up);
    });

    const save = async () => {
      const { notes = {} } = await browser.storage.local.get("notes");
      delete notes[KEY.site === KEY[scope] ? KEY.page : KEY.site];   // a note lives in one place only
      delete notes[KEY[scope]];
      const text = ta.value;
      if (text.trim()) notes[KEY[scope]] = { text, url: location.href, title: document.title, host, updated: Date.now() };
      note = notes[KEY[scope]] || null;
      await browser.storage.local.set({ notes });
      foot.classList.add("show"); clearTimeout(foot._t); foot._t = setTimeout(() => foot.classList.remove("show"), 1200);
    };
    ta.addEventListener("input", () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); });
    segSite.addEventListener("click", () => { scope = "site"; syncSeg(); save(); });
    segPage.addEventListener("click", () => { scope = "page"; syncSeg(); save(); });
    del.addEventListener("click", () => { ta.value = ""; save().then(close); });
    x.addEventListener("click", close);
    card.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    ui = { h, card };
    setTimeout(() => ta.focus(), 50);
  }

  function close() {
    if (!ui) return;
    const { h, card } = ui;
    ui = null;
    clearTimeout(saveTimer);
    card.classList.add("out");
    setTimeout(() => { h.remove(); if (note && !S.notesOpts.autoOpen) showPill(); }, 200);
  }

  browser.runtime.onMessage.addListener((m) => { if (m && m.type === "flow-note-open") open(); });

  // pages that have a note: small pill, or open the note right away
  (async () => {
    await load();
    if (!S.modules.notes || !note) return;
    if (S.notesOpts.autoOpen) open(); else showPill();
  })();
})();
