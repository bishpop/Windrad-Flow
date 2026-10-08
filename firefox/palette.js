/* =====================================================================
   Windrad Flow – command bar
   Everything you pick is carried out by the background, so it still
   finishes when the bar closes right away.
   ===================================================================== */
"use strict";

const $ = (id) => document.getElementById(id);
const PARAMS = new URLSearchParams(location.search);
const CTX = PARAMS.get("ctx") || "frame";        // frame (in a page) | action (toolbar popup)
let S, T, tab = null, data = { spaces: [], tabSpace: {}, activeSpace: null, archive: [] };
let items = [], sel = 0, allTabs = [], queryId = 0, closing = false, firstRender = true;

/* --- open / close ------------------------------------------------------- */
function close() {
  if (closing) return;
  closing = true;
  if (CTX === "action") { window.close(); return; }
  document.body.classList.add("closing");
  setTimeout(() => parent.postMessage({ flow: "close" }, "*"), 140);
}

/* --- search -------------------------------------------------------------- */
function score(q, title, url) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const t = (title || "").toLowerCase(), u = (url || "").toLowerCase(), h = flowHost(url).toLowerCase();
  let s = 0;
  for (const w of words) {
    let ws = 0;
    if (t.startsWith(w)) ws = 100;
    else if (t.includes(" " + w)) ws = 70;
    else if (t.includes(w)) ws = 45;
    if (h.startsWith(w)) ws = Math.max(ws, 90);
    else if (u.includes(w)) ws = Math.max(ws, 25);
    if (!ws) return 0;
    s += ws;
  }
  return s;
}
const looksLikeUrl = (s) => /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(s) && !/\s/.test(s);
const spaceById = (id) => data.spaces.find((s) => s.id === id);

function commands() {
  const list = FLOW_COMMANDS.filter((c) => (!c.module || S.modules[c.module]) && (!c.firefoxOnly || FLOW_IS_FIREFOX))
    .map((c) => ({ id: c.id, title: T(`c_${c.id}`), keys: c.keys }));
  // "move tab to <space>" for every other space
  for (const sp of data.spaces) if (sp.id !== data.tabSpace[tab?.id])
    list.push({ id: "moveToSpace", arg: sp.id, title: T("c_moveTo", { name: `${sp.emoji ? sp.emoji + " " : ""}${sp.name}` }),
                keys: `move space verschieben ${sp.name}` });
  return list;
}

async function search(raw) {
  const id = ++queryId;
  const cmdOnly = raw.startsWith(">");
  const q = (cmdOnly ? raw.slice(1) : raw).trim();
  const out = [];
  const src = S.palette.sources;
  const cmds = commands();

  if (!q) {
    if (!cmdOnly && data.spaces.length > 1) out.push({ section: "secSpaces" }, ...data.spaces.map(spaceItem));
    if (!cmdOnly && src.tabs) {
      const recent = allTabs.filter((t) => t.id !== tab?.id && !t.hidden)
        .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0)).slice(0, 5);
      if (recent.length) out.push({ section: "secTabs" }, ...recent.map(tabItem));
    }
    out.push({ section: "secCommands" }, ...cmds.slice(0, cmdOnly ? 99 : 5).map(cmdItem));
    if (!cmdOnly && data.archive.length) out.push({ section: "secArchive" }, ...data.archive.slice(0, 3).map(archiveItem));
    return id === queryId && render(out);
  }

  const cmdHits = cmds.map((c) => ({ c, s: score(q, c.title, "") || score(q, c.keys, "") }))
    .filter((x) => x.s).sort((a, b) => b.s - a.s).map((x) => cmdItem(x.c));
  if (cmdOnly) {
    if (cmdHits.length) out.push({ section: "secCommands" }, ...cmdHits);
    return id === queryId && render(out);
  }

  const sp = data.spaces.filter((s) => score(q, s.name, "")).map(spaceItem);
  if (sp.length) out.push({ section: "secSpaces" }, ...sp);
  if (src.tabs) {
    const tabs = allTabs.map((t) => ({ t, s: score(q, t.title, t.url) + 30 })).filter((x) => x.s > 30)
      .sort((a, b) => b.s - a.s).slice(0, 6).map((x) => tabItem(x.t));
    if (tabs.length) out.push({ section: "secTabs" }, ...tabs);
  }
  if (cmdHits.length) out.push({ section: "secCommands" }, ...cmdHits.slice(0, 4));

  const [bms, hist] = await Promise.all([
    src.bookmarks ? browser.bookmarks.search(q).catch(() => []) : [],
    src.history ? browser.history.search({ text: q, startTime: 0, maxResults: 40 }).catch(() => []) : [],
  ]);
  if (id !== queryId) return;
  const seen = new Set(allTabs.map((t) => t.url));
  const bmItems = bms.filter((b) => b.url && !seen.has(b.url))
    .map((b) => ({ b, s: score(q, b.title, b.url) })).filter((x) => x.s).sort((a, b) => b.s - a.s)
    .slice(0, 5).map((x) => { seen.add(x.b.url); return urlItem(x.b.title, x.b.url, "bookmark"); });
  if (bmItems.length) out.push({ section: "secBookmarks" }, ...bmItems);
  const arch = data.archive.map((a) => ({ a, s: score(q, a.title, a.url) })).filter((x) => x.s)
    .sort((a, b) => b.s - a.s).slice(0, 4).map((x) => { seen.add(x.a.url); return archiveItem(x.a); });
  if (arch.length) out.push({ section: "secArchive" }, ...arch);
  const notes = (data.notes || []).map((n) => ({ n, s: score(q, `${n.title} ${n.text}`, n.url) })).filter((x) => x.s)
    .sort((a, b) => b.s - a.s).slice(0, 4).map((x) => noteItem(x.n));
  if (notes.length) out.push({ section: "secNotes" }, ...notes);
  const hItems = hist.filter((h) => h.url && !seen.has(h.url))
    .map((h) => ({ h, s: score(q, h.title, h.url) + Math.min(20, h.visitCount || 0) })).filter((x) => x.s)
    .sort((a, b) => b.s - a.s).slice(0, 5).map((x) => urlItem(x.h.title, x.h.url, "history"));
  if (hItems.length) out.push({ section: "secHistory" }, ...hItems);

  const web = [];
  if (looksLikeUrl(q)) web.push({ kind: "url", icon: "globe", title: T("openUrl", { q }), sub: "",
    url: /^https?:\/\//i.test(q) ? q : `https://${q}`, badge: T("open") });
  web.push({ kind: "url", icon: "search", title: T("searchFor", { q }), sub: flowHost(S.palette.engine),
    url: S.palette.engine.replace("%s", encodeURIComponent(q)), badge: T("open") });
  out.push({ section: "secWeb" }, ...web);
  render(out, q);
}

function tabItem(t) {
  const sp = spaceById(data.tabSpace[t.id]);
  const where = sp && data.spaces.length > 1 && !t.pinned ? `${sp.emoji || "•"} ${sp.name} · ` : "";
  return { kind: "tab", tabId: t.id, windowId: t.windowId, title: t.title || t.url,
           sub: where + (flowHost(t.url) || t.url), fav: t.favIconUrl, badge: T("switchTo"), icon: "tab" };
}
function cmdItem(c) { return { kind: "cmd", id: c.id, arg: c.arg, title: c.title, sub: "", icon: "command", badge: T("run") }; }
function urlItem(title, url, icon) {
  return { kind: "url", title: title || url, sub: flowHost(url) || url, url, icon, siteIcon: true, badge: T("open") };
}
function spaceItem(s) {
  const cur = s.id === data.activeSpace;
  return { kind: "space", spaceId: s.id, title: s.name, emoji: s.emoji || s.name.slice(0, 1).toUpperCase(),
           color: s.color, sub: "", badge: cur ? T("currentSpace") : T("switchSpace") };
}
function noteItem(n) {
  const first = n.text.split("\n").find((l) => l.trim()) || "";
  return { kind: "cmd", id: "openNote", arg: n.url, title: first.slice(0, 90), sub: `${n.host} · ${flowAgo(S, n.updated)}`,
           icon: "note", badge: T("openNote") };
}
function archiveItem(a) {
  return { kind: "archive", id: a.id, title: a.title, sub: `${flowHost(a.url)} · ${T("archivedAgo", { t: flowAgo(S, a.at) })}`,
           url: a.url, fav: a.fav, icon: "history", siteIcon: !a.fav, badge: T("restore") };
}

/* --- drawing ----------------------------------------------------------- */
function highlight(text, q) {
  const span = flowEl("span", "title");
  const words = (q || "").toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) { span.textContent = text; return span; }
  const lower = text.toLowerCase();
  const marks = new Array(text.length).fill(false);
  for (const w of words) { const i = lower.indexOf(w); if (i >= 0) for (let k = i; k < i + w.length; k++) marks[k] = true; }
  let buf = "", on = false;
  const flush = () => { if (buf) span.append(on ? flowEl("mark", "", buf) : buf); buf = ""; };
  for (let i = 0; i < text.length; i++) { if (marks[i] !== on) { flush(); on = marks[i]; } buf += text[i]; }
  flush();
  return span;
}
function iconFor(it) {
  const box = flowEl("span", "ico");
  if (it.kind === "space") {
    box.append(flowEl("span", "letter", it.emoji));
    if (it.color && FLOW_HEX.test(it.color)) box.style.boxShadow = `inset 0 0 0 1px ${it.color}`;
    return box;
  }
  const fallback = () => box.replaceChildren(flowIcon(it.icon));
  const src = it.fav && /^(https?|data):/.test(it.fav) ? it.fav
            : it.siteIcon ? `https://${flowHost(it.url)}/favicon.ico` : null;
  if (src) {
    const img = flowEl("img"); img.alt = ""; img.src = src;
    img.onerror = fallback;
    box.append(img);
  } else fallback();
  return box;
}
function render(list, q = "") {
  items = list.filter((x) => !x.section);
  const box = $("list");
  box.replaceChildren(flowEl("div", "hl jump"));
  box.classList.toggle("first", firstRender);
  firstRender = false;
  if (!items.length) { box.append(flowEl("div", "empty", T("noResults"))); return; }
  let i = 0, n = 0;
  for (const it of list) {
    const delay = `${Math.min(n++, 12) * 18}ms`;
    if (it.section) { const h = flowEl("div", "sec", T(it.section)); h.style.setProperty("--d", delay); box.append(h); continue; }
    const idx = i++;
    const row = flowEl("div", "item",
      iconFor(it),
      flowEl("span", "txt", highlight(it.title, q), it.sub ? flowEl("div", "sub", it.sub) : null),
      flowEl("span", "badge", it.badge));
    row.setAttribute("role", "option");
    row.id = `opt-${idx}`;
    row.addEventListener("mousemove", () => { if (sel !== idx) select(idx, false); });
    row.addEventListener("click", (e) => activate(idx, e.shiftKey));
    row.style.setProperty("--d", delay);
    box.append(row);
  }
  select(0, false);
}
function select(i, scroll = true) {
  sel = Math.max(0, Math.min(items.length - 1, i));
  document.querySelectorAll(".item").forEach((n, k) => {
    n.classList.toggle("sel", k === sel);
    n.setAttribute("aria-selected", k === sel);
  });
  $("q").setAttribute("aria-activedescendant", `opt-${sel}`);
  const row = document.getElementById(`opt-${sel}`), hl = document.querySelector(".hl");
  if (row && hl) {
    hl.style.transform = `translateY(${row.offsetTop}px)`;
    hl.style.height = `${row.offsetHeight}px`;
    // first placement after drawing: no gliding from the top
    if (hl.classList.contains("jump")) requestAnimationFrame(() => hl.classList.remove("jump"));
  }
  if (scroll) row?.scrollIntoView({ block: "nearest" });
}

/* --- running a result: hand it to the background, then close ---------- */
let busy = false;
async function activate(i, shift) {
  const it = items[i];
  if (!it || closing || busy) return;
  busy = true;
  const item = { kind: it.kind, tabId: it.tabId, windowId: it.windowId, url: it.url, id: it.id, arg: it.arg, spaceId: it.spaceId };
  // wait until the background has received it (and usually done it) before
  // closing – a toolbar popup that closes too early can swallow the message
  const sent = browser.runtime.sendMessage({ type: "flow-activate", item, tabId: tab?.id, shift })
    .catch((e) => console.warn("[Windrad Flow]", e));
  const res = await Promise.race([sent, new Promise((r) => setTimeout(r, 1500))]);
  if (res && res.ok === false) { toast(res.error); busy = false; return; }   // show why, stay open
  close();
}
function toast(text) {
  document.querySelector(".toast")?.remove();
  const n = flowEl("div", "toast", text);
  document.body.append(n);
  setTimeout(() => n.remove(), 4500);
}

/* --- keyboard ---------------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { e.preventDefault(); close(); }
  else if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) { e.preventDefault(); select(sel + 1); }
  else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) { e.preventDefault(); select(sel - 1); }
  else if (e.key === "Enter") { e.preventDefault(); activate(sel, e.shiftKey); }
});
$("scrim").addEventListener("click", close);

let timer;
$("q").addEventListener("input", (e) => { clearTimeout(timer); timer = setTimeout(() => search(e.target.value), 60); });

/* --- start ------------------------------------------------------------- */
(async () => {
  S = await flowLoad();
  T = (k, v) => flowT(S, k, v);
  flowApplyColors(S);
  document.documentElement.lang = S.lang;
  if (CTX === "action") document.body.classList.add("action");

  document.querySelector(".search-ico").append(flowIcon("search"));
  $("q").placeholder = T("placeholder");
  const hint = (k, label) => flowEl("span", "", flowEl("kbd", "", k), label);
  $("hints").append(hint("↑↓", T("hintMove")), hint("Enter", T("hintOpen")), hint("Shift+Enter", T("hintNewTab")),
                    hint(">", T("hintCommands")), hint("Esc", T("hintClose")));
  if (PARAMS.get("q")) $("q").value = PARAMS.get("q");
  $("q").focus();

  const tabParam = +PARAMS.get("tab");
  allTabs = await browser.tabs.query({}).catch(() => []);
  tab = allTabs.find((t) => t.id === tabParam) || (await browser.tabs.query({ active: true, currentWindow: true }))[0] || null;
  allTabs = allTabs.filter((t) => !t.url.startsWith(browser.runtime.getURL("")));
  data = await browser.runtime.sendMessage({ type: "flow-palette-data", tabId: tab?.id }).catch(() => data) || data;
  search($("q").value);
})();
