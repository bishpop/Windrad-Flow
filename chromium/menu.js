/* =====================================================================
   Windrad Flow – toolbar menu (tidy version)
   1. search                      4. spaces
   2. now playing (if any)        5. eight quick actions + "All commands"
   3. this page: note, boost,     6. last archived tabs
      dark, copy link, volume
   ===================================================================== */
"use strict";
const $ = (id) => document.getElementById(id);
let S, T, D, tab = null, poll = null;

const canDraw = (url) => /^(https?|file):/.test(url || "") && !/^https?:\/\/(addons\.mozilla\.org|accounts\.firefox\.com|support\.mozilla\.org)\//.test(url);

function toast(text, kind) {
  const t = $("toast");
  t.textContent = text;
  t.className = `toast ${kind || ""}`;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { t.hidden = true; }, kind === "err" ? 5000 : 1300);
}
async function run(item, el, keepOpen) {
  el?.classList.add("busy");
  const res = await browser.runtime.sendMessage({ type: "flow-activate", item, tabId: D.tabId, fromMenu: true })
    .catch((e) => ({ ok: false, error: String(e) }));
  el?.classList.remove("busy");
  if (res && res.ok === false) { toast(res.error, "err"); return false; }
  if (keepOpen) { el?.classList.add("ok"); toast(T("done"), "ok"); setTimeout(() => el?.classList.remove("ok"), 900); }
  else window.close();
  return true;
}
const section = (id, title, ...kids) => { const box = $(id); box.classList.remove("hidden"); box.replaceChildren(...(title ? [flowEl("h2", "", ...[].concat(title))] : []), ...kids.filter(Boolean)); return box; };

/* --- 2. now playing --------------------------------------------------------- */
const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
let pl = null;
function renderPlayer(m) {
  if (!m) { $("player").classList.add("hidden"); clearInterval(poll); poll = null; return; }
  if (!pl) {
    const ib = (name, cmd, cls) => { const b = flowEl("button", `ib ${cls || ""}`, flowIcon(name)); b.type = "button";
      b.addEventListener("click", () => playerCmd(cmd)); return b; };
    pl = { art: flowEl("span", "art"), t: flowEl("div", "t"), a: flowEl("div", "a"), fill: flowEl("i") };
    pl.bar = flowEl("div", "bar", pl.fill);
    pl.bar.addEventListener("click", (e) => { const r = pl.bar.getBoundingClientRect(); playerCmd((e.clientX - r.left) / r.width); });
    const txt = flowEl("div", "pl-txt", pl.t, pl.a);
    txt.title = T("switchTo");
    txt.addEventListener("click", () => playerCmd("goto").then(() => window.close()));
    pl.play = ib("pause", "toggle", "big");
    section("player", T("nowPlaying"), flowEl("div", "pl-top", pl.art, txt), pl.bar,
      flowEl("div", "ctl", ib("prev", "prev"), pl.play, ib("next", "next")));
  }
  pl.t.textContent = m.title;
  pl.a.textContent = m.artist && m.artist !== m.title ? m.artist : m.host;
  const pic = m.art || m.fav;
  if (pic && pl.art.firstChild?.getAttribute("src") !== pic) {
    const img = flowEl("img", m.art ? "" : "fav"); img.alt = ""; img.src = pic; img.onerror = () => img.remove();
    pl.art.replaceChildren(img);
  }
  pl.play.replaceChildren(flowIcon(m.paused ? "play" : "pause"));
  pl.fill.style.width = m.duration ? `${Math.min(100, (m.time / m.duration) * 100)}%` : "0";
  pl.bar.classList.toggle("hidden", !m.duration);
  if (!poll) poll = setInterval(() => playerCmd("state"), 1000);
}
async function playerCmd(cmd) {
  const m = await browser.runtime.sendMessage({ type: "flow-player-cmd", cmd }).catch(() => null);
  if (m) renderPlayer(m);
}

/* --- 3. this page ------------------------------------------------------------- */
async function renderPage() {
  if (!tab) return;
  const host = flowHost(tab.url) || tab.url;
  const fav = flowEl("img"); fav.alt = ""; fav.src = /^(https?|data):/.test(tab.favIconUrl || "") ? tab.favIconUrl : "icons/icon.svg";
  fav.onerror = () => { fav.src = "icons/icon.svg"; };
  const site = flowEl("div", "site", fav, flowEl("span", "t", tab.title || host), flowEl("span", "h", host !== (tab.title || "") ? host : ""));

  if (!canDraw(tab.url)) {
    section("page", T("thisPage"), site, flowEl("p", "note", T("notOnPage")));
    return;
  }
  const pills = flowEl("div", "pills");
  const pill = (icon, label, onClick) => {
    const b = flowEl("button", "pill", flowIcon(icon), flowEl("span", "", label)); b.type = "button";
    b.addEventListener("click", () => onClick(b)); pills.append(b); return b;
  };
  if (S.modules.notes) pill("note", T("pa_note"), (b) => run({ kind: "cmd", id: "noteThis" }, b, false));
  if (S.modules.boosts) {
    pill("bolt", T("pa_boost"), (b) => run({ kind: "cmd", id: "boostThis" }, b, false));
    const dark = pill("moon", T("pa_dark"), async (b) => {
      if (await run({ kind: "cmd", id: "toggleDark" }, b, true)) b.classList.toggle("on");
    });
    browser.tabs.sendMessage(tab.id, { type: "flow-dark-get" }, { frameId: 0 })
      .then((r) => dark.classList.toggle("on", !!(r && r.on))).catch(() => {});
  }
  pill("link", T("pa_copy"), (b) => run({ kind: "cmd", id: "copyLink" }, b, true));
  if (S.modules.youtube && /(^|\.)youtube\.com$/.test(host)) pill("play", T("pa_yt"), (b) => run({ kind: "cmd", id: "youtube" }, b, false));

  section("page", T("thisPage"), site, pills);
  if (S.modules.volume) renderVolume();
}

async function renderVolume() {
  const st = await browser.tabs.sendMessage(tab.id, { type: "flow-volume-get" }, { frameId: 0 }).catch(() => null);
  if (!st) return;
  const range = flowEl("input"); range.type = "range"; range.min = 0; range.max = st.limited ? 100 : 400; range.step = 5;
  range.value = Math.min(st.pct, +range.max);
  range.title = T("volume");
  const pct = flowEl("span", "pct");
  const mute = flowEl("button", "ib"); mute.type = "button"; mute.title = T("volume");
  const reset = flowEl("button", "ib", flowIcon("undo")); reset.type = "button"; reset.title = T("volReset");
  let before = 100;
  const show = (v) => { pct.textContent = `${v} %`; pct.classList.toggle("over", v > 100); mute.replaceChildren(flowIcon(v === 0 ? "muted" : "volume")); };
  const set = (v) => { show(v); browser.tabs.sendMessage(tab.id, { type: "flow-volume-set", pct: v }, { frameId: 0 }).catch(() => {}); };
  show(+range.value);
  range.addEventListener("input", () => set(+range.value));
  mute.addEventListener("click", () => { if (+range.value > 0) { before = +range.value; range.value = 0; } else range.value = before || 100; set(+range.value); });
  reset.addEventListener("click", () => { range.value = 100; set(100); });
  $("page").append(flowEl("div", "vol", mute, range, pct, reset));
  if (st.limited) $("page").append(flowEl("p", "note", T("volLimited")));
}

/* --- 4. spaces ---------------------------------------------------------------- */
function renderSpaces() {
  if (!D.spaces.length) return;
  const chips = flowEl("div", "chips");
  for (const sp of D.spaces) {
    const chip = flowEl("button", `chip${sp.id === D.activeSpace ? " on" : ""}`, flowEl("span", "", sp.emoji || "•"), flowEl("span", "", sp.name));
    chip.type = "button";
    if (FLOW_HEX.test(sp.color || "")) chip.style.setProperty("--c", sp.color);
    chip.addEventListener("click", () => run({ kind: "space", spaceId: sp.id }, chip, false));
    chips.append(chip);
  }
  section("spaces", T("secSpaces"), chips);
}

/* --- 5. quick actions: the 8 most used + "All commands" ---------------------- */
const QUICK = [
  ["newTab", "plus", "q_newTab"], ["newWindow", "window", "q_newWindow"], ["privateWindow", "private", "q_private"],
  ["reopen", "undo", "q_reopen"], ["duplicate", "copy", "q_duplicate"], ["pin", "pin", "q_pin"],
  ["closeOthers", "broom", "q_closeOthers"], ["unloadOthers", "moon", "q_unload"],
];
const KEEP_OPEN = new Set(["pin", "unloadOthers"]);
function renderQuick() {
  const grid = flowEl("div", "grid");
  for (const [id, icon, label] of QUICK) {
    const tile = flowEl("button", "tile", flowIcon(icon), flowEl("span", "", T(label)));
    tile.type = "button"; tile.title = T(`c_${id}`);
    tile.addEventListener("click", () => run({ kind: "cmd", id }, tile, KEEP_OPEN.has(id)));
    grid.append(tile);
  }
  const more = flowEl("button", "more", `${T("allCommands")} →`); more.type = "button";
  more.addEventListener("click", () => location.assign("palette.html?ctx=action&q=%3E"));
  section("quick", [T("quickActions"), more], grid);
}

/* --- 6. archive ------------------------------------------------------------------ */
function renderArchive() {
  if (!D.archive.length) return;
  const rows = flowEl("div", "rows");
  for (const a of D.archive) {
    const img = flowEl("img"); img.alt = ""; img.src = a.fav || `https://${flowHost(a.url)}/favicon.ico`;
    img.onerror = () => { img.style.visibility = "hidden"; };
    const row = flowEl("button", "row", img, flowEl("span", "t", a.title), flowEl("span", "s", flowAgo(S, a.at)));
    row.type = "button"; row.title = `${T("restore")}: ${a.url}`;
    row.addEventListener("click", () => run({ kind: "archive", id: a.id }, row, false));
    rows.append(row);
  }
  const all = flowEl("button", "more", `${T("c_openArchive")} →`); all.type = "button";
  all.addEventListener("click", () => run({ kind: "cmd", id: "openArchive" }, all, false));
  section("archive", [T("secArchive"), all], rows);
}

/* --- start ------------------------------------------------------------------------ */
(async () => {
  S = await flowLoad();
  T = (k, v) => flowT(S, k, v);
  D = await browser.runtime.sendMessage({ type: "flow-menu-data" }).catch(() => null)
      || { spaces: [], archive: [], media: null };
  if (D.search) { location.replace("palette.html?ctx=action"); return; }   // Ctrl+Space on a protected page

  flowApplyColors(S);
  document.documentElement.lang = S.lang;
  tab = D.tabId ? await browser.tabs.get(D.tabId).catch(() => null) : null;

  $("search").append(flowIcon("search"), flowEl("span", "", T("menuSearch")), flowEl("kbd", "", S.lang === "de" ? "Strg+␣" : "Ctrl+␣"));
  $("search").addEventListener("click", () => location.assign("palette.html?ctx=action"));
  $("settings").append(flowIcon("gear"));
  $("settings").title = T("openSettings");
  $("settings").addEventListener("click", () => { browser.runtime.openOptionsPage(); window.close(); });

  renderPlayer(D.media);
  renderPage();
  renderSpaces();
  renderQuick();
  renderArchive();
})();
