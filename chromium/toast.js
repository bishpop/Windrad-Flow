/* =====================================================================
   "Link kopiert"-Hinweis im Glas-Stil.
   Diese Funktion muss in sich geschlossen bleiben: Sie wird vom
   Hintergrundskript per scripting.executeScript in die Webseite
   gespritzt und läuft dort ohne Zugriff auf andere Dateien.
   Ein Shadow-DOM schützt sie vor dem CSS der Webseite.
   ===================================================================== */
function windradToast(o) {
  const ID = "windrad-start-toast";
  document.getElementById(ID)?.remove();

  const host = document.createElement("div");
  host.id = ID;
  host.style.cssText = "all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;";
  const root = host.attachShadow({ mode: "closed" });

  const pos = {
    "top-right":     "top: 18px; right: 18px;",
    "top":           "top: 18px; left: 50%; --x: -50%;",
    "bottom-right":  "bottom: 18px; right: 18px; --dy: 12px;",
    "bottom":        "bottom: 18px; left: 50%; --x: -50%; --dy: 12px;",
  }[o.position] || "top: 18px; right: 18px;";

  const style = document.createElement("style");
  style.textContent = `
    .t {
      position: fixed; ${pos}
      --x: 0; --dy: -12px;
      display: flex; align-items: center; gap: 10px;
      max-width: min(360px, calc(100vw - 36px));
      padding: 10px 16px 10px 10px;
      border-radius: 14px;
      background: rgba(20, 38, 54, 0.72);
      backdrop-filter: blur(16px) saturate(1.3);
      border: 1px solid color-mix(in srgb, ${o.c1} 45%, rgba(255, 255, 255, 0.15));
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 12px 32px rgba(0, 0, 0, 0.35);
      color: #eee7f6;
      font: 500 14px/1.3 "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
      animation: in 260ms cubic-bezier(.2, .9, .3, 1.2) both, out 220ms ease-in ${o.duration}ms forwards;
    }
    ${o.position === "top" || o.position === "bottom" ? ".t { transform: translateX(-50%); }" : ""}
    .i {
      width: 28px; height: 28px; flex: none;
      display: grid; place-items: center;
      border-radius: 50%;
      background: linear-gradient(135deg, ${o.c1}, ${o.c2});
      color: #10141c;
    }
    .i svg { width: 16px; height: 16px; }
    .txt { display: flex; flex-direction: column; min-width: 0; }
    .sub { font-size: 12px; font-weight: 400; color: rgba(238, 231, 246, 0.6);
           overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    @keyframes in  { from { opacity: 0; transform: translate(var(--x), var(--dy)) scale(0.96); }
                     to   { opacity: 1; transform: translate(var(--x), 0) scale(1); } }
    @keyframes out { to   { opacity: 0; transform: translate(var(--x), var(--dy)) scale(0.98); } }
    @media (prefers-reduced-motion: reduce) {
      .t { animation: out 1ms linear ${o.duration}ms forwards; }
    }
  `;

  const box = document.createElement("div");
  box.className = "t";
  box.setAttribute("role", "status");
  box.innerHTML = `<span class="i"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/></svg></span><span class="txt"><span class="main"></span><span class="sub"></span></span>`;
  box.querySelector(".main").textContent = o.text;
  const sub = box.querySelector(".sub");
  if (o.sub) sub.textContent = o.sub; else sub.remove();

  root.append(style, box);
  document.documentElement.append(host);
  setTimeout(() => host.remove(), o.duration + 400);
}
