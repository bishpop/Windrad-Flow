/* =====================================================================
   Windrad Flow – settings page
   ===================================================================== */
"use strict";
const $ = (id) => document.getElementById(id);
const START_HASH = location.hash;          // read before the page navigation rewrites it
const full = (h) => (h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h).toLowerCase();
let S, T;

let savedTimer;
async function save(key) {
  await browser.storage.local.set({ [key]: S[key] });
  $("saved").textContent = T("saved");
  clearTimeout(savedTimer);
  savedTimer = setTimeout(() => { $("saved").textContent = ""; }, 1200);
}

function texts() {
  T = (k, v) => flowT(S, k, v);
  document.documentElement.lang = S.lang;
  document.title = T("settingsTitle");
  document.querySelectorAll("[data-t]").forEach((e) => { e.textContent = T(e.dataset.t); });
  $("version").textContent = `Windrad Flow · ${T("version", { v: browser.runtime.getManifest().version })}`;
  renderModules();
  buildNav();
  showShortcut();
  renderShortcutList();
  renderArchive();
  renderSpaces();
  renderNotes();
  renderBoosts();
  renderYouTube();
}

function segmented(id, get, set) {
  const box = $(id);
  const sync = () => box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === get()));
  box.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { set(b.dataset.value); sync(); } });
  sync();
}

/* --- modules ----------------------------------------------------------- */
// a module is offered when this build has a settings page for it
const hasModule = (k) => !!document.getElementById(`sec-${k}`);
const READY = Object.keys(FLOW_DEFAULTS.modules).filter(hasModule);
function renderModules() {
  const box = $("modules");
  box.replaceChildren();
  for (const k of READY) {
    const cb = flowEl("input"); cb.type = "checkbox";
    const ready = READY.includes(k);
    cb.checked = ready && S.modules[k];
    cb.disabled = !ready;
    cb.addEventListener("change", () => { S.modules[k] = cb.checked; save("modules"); syncSections(); });
    const lab = flowEl("label", "switch", cb, flowEl("span", "", T(`m_${k}`)), ready ? null : flowEl("span", "soon", T("soon")));
    box.append(lab);
  }
  syncSections();
}
/* --- navigation: one page per section ---------------------------------- */
const NAV_ICONS = { "sec-general": "gear", "sec-modules": "command", "sec-palette": "search", "sec-archive": "archive",
  "sec-spaces": "window", "sec-player": "play", "sec-notes": "note", "sec-boosts": "bolt", "sec-youtube": "play",
  "sec-volume": "volume", "sec-backup": "copy", "sec-peek": "external" };
let currentPage = null;
function buildNav() {
  const nav = $("nav");
  nav.replaceChildren();
  for (const sec of document.querySelectorAll("#pages > section")) {
    const mod = sec.dataset.module;
    const title = sec.querySelector("h2")?.textContent || sec.id;
    const b = flowEl("button", "nav-item", flowIcon(NAV_ICONS[sec.id] || "command"), flowEl("span", "", title),
                     mod ? flowEl("i", "dot") : null);
    b.type = "button";
    b.dataset.page = sec.id;
    b.addEventListener("click", () => showPage(sec.id));
    nav.append(b);
  }
  syncSections();
  if (currentPage) showPage(currentPage, false);
}
function showPage(id, animate = true) {
  if (!$(id)) id = "sec-general";
  currentPage = id;
  for (const sec of document.querySelectorAll("#pages > section")) {
    const on = sec.id === id;
    sec.classList.toggle("page-on", on);
    if (on && animate) { sec.classList.remove("enter"); void sec.offsetWidth; sec.classList.add("enter"); }
  }
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("on", n.dataset.page === id));
  history.replaceState(null, "", `#${id.replace("sec-", "")}`);
  window.scrollTo({ top: 0 });
}
// every module page starts with its own on/off switch
function syncSections() {
  for (const sec of document.querySelectorAll("#pages > section[data-module]")) {
    const k = sec.dataset.module, on = !!S.modules[k];
    let bar = sec.querySelector(":scope > .module-bar");
    if (!bar) {
      const cb = flowEl("input"); cb.type = "checkbox";
      cb.addEventListener("change", () => { S.modules[k] = cb.checked; save("modules"); renderModules(); });
      bar = flowEl("div", "module-bar", flowEl("label", "switch", cb, flowEl("span", "", "")), flowEl("p", "muted small off-hint", ""));
      sec.querySelector("h2").after(bar);
    }
    bar.querySelector("input").checked = on;
    bar.querySelector(".switch span").textContent = T("moduleOn");
    bar.querySelector(".off-hint").textContent = T("moduleOff");
    sec.classList.toggle("module-off", !on);
    document.querySelector(`.nav-item[data-page="${sec.id}"]`)?.classList.toggle("off", !on);
  }
}

/* --- shortcut (same recorder as in Windrad Start) ---------------------- */
const DE = () => S.lang === "de";
function displayKeys(sc) {
  return DE() ? sc.replace(/\bCtrl\b/g, "Strg").replace(/\bShift\b/g, "Umschalt").replace(/\bSpace\b/g, "Leertaste") : sc;
}
async function showShortcut() {
  const c = (await browser.commands.getAll()).find((x) => x.name === "open-palette");
  $("shortcut").textContent = displayKeys((c && c.shortcut) || "–");
}
const KEY_NAMES = { ",": "Comma", ".": "Period", " ": "Space", ArrowUp: "Up", ArrowDown: "Down",
  ArrowLeft: "Left", ArrowRight: "Right", Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown",
  Insert: "Insert", Delete: "Delete" };
const FIREFOX_KEYS = new Set(["Ctrl+Shift+C", "Ctrl+Shift+I", "Ctrl+Shift+K", "Ctrl+Shift+J", "Ctrl+Shift+E", "Ctrl+Shift+M",
  "Ctrl+Shift+T", "Ctrl+Shift+N", "Ctrl+Shift+P", "Ctrl+Shift+B", "Ctrl+Shift+H", "Ctrl+Shift+O", "Ctrl+Shift+R",
  "Ctrl+Shift+W", "Ctrl+Shift+Y", "Ctrl+Shift+A", "Ctrl+Shift+Z", "Ctrl+Shift+V", "Ctrl+Shift+S", "Ctrl+Shift+D",
  "Ctrl+Shift+G", "Ctrl+Shift+X", "Ctrl+Shift+Q", "Alt+Left", "Alt+Right", "Alt+Home"]);
function keyToShortcut(e) {
  let key = null;
  if (/^Key[A-Z]$/.test(e.code)) key = e.code.slice(3);
  else if (/^Digit[0-9]$/.test(e.code)) key = e.code.slice(5);
  else if (/^F([1-9]|1[0-2])$/.test(e.key)) key = e.key;
  else if (KEY_NAMES[e.key]) key = KEY_NAMES[e.key];
  if (!key) return null;
  const mods = [];
  if (e.ctrlKey) mods.push("Ctrl");
  if (e.altKey) mods.push("Alt");
  if (e.shiftKey) mods.push("Shift");
  if (!/^F[0-9]+$/.test(key) && !e.ctrlKey && !e.altKey) return null;
  return [...mods, key].join("+");
}
let recording = false;
function setupShortcut() {
  const btn = $("shortcut"), msg = $("shortcut-msg");
  // Chromium can't change shortcuts from an extension -> open its shortcut page
  if (!browser.commands.update) {
    $("shortcut-reset").textContent = T("changeShortcut");
    const open = () => browser.tabs.create({ url: "chrome://extensions/shortcuts" });
    btn.addEventListener("click", open);
    $("shortcut-reset").addEventListener("click", open);
    msg.textContent = T("shortcutChromium");
    return;
  }
  btn.addEventListener("click", () => { recording = true; btn.classList.add("recording"); btn.textContent = T("pressKeys"); msg.textContent = ""; });
  btn.addEventListener("blur", () => { if (recording) { recording = false; btn.classList.remove("recording"); showShortcut(); } });
  btn.addEventListener("keydown", async (e) => {
    if (!recording || ["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
    e.preventDefault();
    if (e.key === "Escape") { recording = false; btn.classList.remove("recording"); showShortcut(); return; }
    const sc = keyToShortcut(e);
    if (!sc) { msg.textContent = T("shortcutInvalid"); return; }
    recording = false; btn.classList.remove("recording");
    try {
      await browser.commands.update({ name: "open-palette", shortcut: sc });
      const clash = FIREFOX_KEYS.has(sc) || /^Ctrl\+[A-Z0-9]$/.test(sc);
      msg.textContent = clash ? T("shortcutConflict", { key: displayKeys(sc) }) : T("shortcutSaved");
    } catch { msg.textContent = T("shortcutInvalid"); }
    showShortcut();
  });
  $("shortcut-reset").addEventListener("click", async () => {
    await browser.commands.reset("open-palette"); msg.textContent = T("shortcutSaved"); showShortcut();
  });
}

/* --- all shortcuts in one list (General page) --------------------------- */
const CMD_LABEL = { "copy-url": "cmdCopyUrlT", "_execute_action": "cmdMenu", "open-palette": "paletteTitle", "toggle-note": "c_noteThis",
  "peek-search": "cmdPeekSearchT", "next-space": "c_nextSpace", "prev-space": "c_prevSpace" };
const CMD_MODULE = { "toggle-note": "notes", "peek-search": "peek", "next-space": "spaces", "prev-space": "spaces" };
async function renderShortcutList() {
  const box = $("shortcut-list");
  if (!box) return;
  const cmds = await browser.commands.getAll();
  box.replaceChildren();
  for (const c of cmds) {
    if (CMD_MODULE[c.name] && !hasModule(CMD_MODULE[c.name])) continue;
    const b = flowEl("button", "btn ghost mono small-btn", displayKeys(c.shortcut || "–"));
    b.type = "button";
    const reset = flowEl("button", "icon-btn", "↺"); reset.type = "button"; reset.title = T("reset");
    const off = CMD_MODULE[c.name] && !S.modules[CMD_MODULE[c.name]];
    box.append(flowEl("li", off ? "dim" : "", flowEl("span", "txt", flowEl("div", "t", T(CMD_LABEL[c.name] || c.name))), b, reset));
    if (!browser.commands.update) {           // Chromium: only on the browser's own page
      const open = () => browser.tabs.create({ url: "chrome://extensions/shortcuts" });
      b.addEventListener("click", open); reset.addEventListener("click", open);
      continue;
    }
    let rec = false;
    b.addEventListener("click", () => { rec = true; b.classList.add("recording"); b.textContent = T("pressKeys"); });
    b.addEventListener("blur", () => { if (rec) { rec = false; renderShortcutList(); } });
    b.addEventListener("keydown", async (e) => {
      if (!rec || ["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
      e.preventDefault();
      if (e.key === "Escape") { rec = false; renderShortcutList(); return; }
      const sc = keyToShortcut(e);
      if (!sc) { $("shortcut-list-msg").textContent = T("shortcutInvalid"); return; }
      rec = false;
      try {
        await browser.commands.update({ name: c.name, shortcut: sc });
        const clash = FIREFOX_KEYS.has(sc) || /^Ctrl\+[A-Z0-9]$/.test(sc);
        $("shortcut-list-msg").textContent = clash ? T("shortcutConflict", { key: displayKeys(sc) }) : T("shortcutSaved");
      } catch { $("shortcut-list-msg").textContent = T("shortcutInvalid"); }
      renderShortcutList(); showShortcut();
    });
    reset.addEventListener("click", async () => { await browser.commands.reset(c.name); renderShortcutList(); showShortcut(); });
  }
}

/* --- colors ------------------------------------------------------------- */
function setupColors() {
  for (const n of [1, 2]) {
    const key = `color${n}`, pick = $(key), hex = $(`${key}-hex`);
    const sync = () => { pick.value = full(S[key]); hex.value = S[key]; hex.classList.remove("invalid"); };
    sync();
    pick.addEventListener("input", (e) => { S[key] = e.target.value; hex.value = S[key]; flowApplyColors(S); save(key); });
    hex.addEventListener("input", (e) => {
      let v = e.target.value.trim(); if (v && !v.startsWith("#")) v = "#" + v;
      const ok = FLOW_HEX.test(v); hex.classList.toggle("invalid", !ok && v.length > 1);
      if (ok) { S[key] = v.toLowerCase(); pick.value = full(v); flowApplyColors(S); save(key); }
    });
    hex.addEventListener("blur", sync);
  }
  $("reset-colors").addEventListener("click", () => {
    S.color1 = FLOW_DEFAULTS.color1; S.color2 = FLOW_DEFAULTS.color2;
    save("color1"); save("color2"); flowApplyColors(S);
    for (const n of [1, 2]) { $(`color${n}`).value = S[`color${n}`]; $(`color${n}-hex`).value = S[`color${n}`]; }
  });
}

/* --- themes ---------------------------------------------------------------- */
const themePreview = (box, P) => {
  box.style.background = `linear-gradient(120deg, ${P.stops[0]} 0%, ${P.stops[1]} 40%, ${P.stops[2]} 70%, ${P.stops[3]} 100%)`;
  const dots = box.querySelectorAll("i");
  if (dots[0]) dots[0].style.background = P.accent;
  if (dots[1]) dots[1].style.background = P.second;
  const aa = box.querySelector("b"); if (aa) aa.style.color = P.text;
};
function renderThemeRow() {
  const P = flowPaletteFor(S.theme);
  $("theme-name").textContent = P.name;
  themePreview($("theme-swatch"), P);
}
async function selectTheme(id) {
  const P = flowPaletteFor(id);
  S.theme = id; S.color1 = P.accent; S.color2 = P.second;
  flowSetThemes(S.theme, S.customThemes);
  await browser.storage.local.set({ theme: id, color1: P.accent, color2: P.second });   // start page follows via color1/2
  flowApplyColors(S);
  for (const n of [1, 2]) { $(`color${n}`).value = full(S[`color${n}`]); $(`color${n}-hex`).value = S[`color${n}`]; }
  renderThemeRow(); renderThemeGrids();
  $("saved").textContent = T("saved"); clearTimeout(savedTimer); savedTimer = setTimeout(() => { $("saved").textContent = ""; }, 1200);
}
function themeCard(id, P, own) {
  const prev = flowEl("span", "theme-preview", flowEl("i"), flowEl("i"), flowEl("b", "", "Aa"));
  themePreview(prev, P);
  const card = flowEl("button", `theme-card${id === S.theme ? " on" : ""}`, prev, flowEl("span", "theme-label", P.name));
  card.type = "button";
  card.addEventListener("click", () => selectTheme(id));
  if (own) {
    const edit = flowEl("span", "theme-edit", "✎"); edit.title = T("editTheme");
    edit.addEventListener("click", (e) => { e.stopPropagation(); openEditor(id); });
    card.append(edit);
  }
  return card;
}
function renderThemeGrids() {
  $("theme-grid-built").replaceChildren(...Object.entries(FLOW_PALETTES).map(([k, P]) => themeCard(k, P, false)));
  const own = S.customThemes.map((t) => themeCard(t.id, t, true));
  const add = flowEl("button", "theme-card add", flowEl("span", "theme-preview plus", "+"), flowEl("span", "theme-label", T("newTheme")));
  add.type = "button";
  add.addEventListener("click", () => openEditor(null));
  $("theme-grid-own").replaceChildren(...own, add);
}
let editing = null;
function openEditor(id) {
  const base = id ? S.customThemes.find((t) => t.id === id) : { ...flowPaletteFor(S.theme), name: T("newTheme") };
  editing = id;
  $("theme-editor-title").textContent = id ? T("editTheme") : T("newTheme");
  $("te-name").value = id ? base.name : `${base.name} 2`;
  $("te-accent").value = full(base.accent); $("te-second").value = full(base.second); $("te-text").value = full(base.text);
  for (let i = 0; i < 4; i++) $(`te-s${i}`).value = full(base.stops[i]);
  $("te-delete").classList.toggle("hidden", !id);
  $("theme-pick").classList.add("hidden"); $("theme-editor").classList.remove("hidden");
  updatePreview();
  $("te-name").focus();
}
const editorTheme = () => ({
  name: $("te-name").value.trim() || T("newTheme"),
  accent: $("te-accent").value, second: $("te-second").value, text: $("te-text").value,
  stops: [0, 1, 2, 3].map((i) => $(`te-s${i}`).value),
});
function updatePreview() { themePreview($("te-preview"), editorTheme()); }
function closeEditor() { $("theme-editor").classList.add("hidden"); $("theme-pick").classList.remove("hidden"); editing = null; }
function setupThemes() {
  renderThemeRow();
  const modal = $("theme-modal");
  const open = () => { renderThemeGrids(); closeEditor(); modal.classList.remove("hidden"); $("theme-close").focus(); };
  const close = () => modal.classList.add("hidden");
  $("theme-open").addEventListener("click", open);
  $("yt-theme-open")?.addEventListener("click", open);
  $("theme-close").addEventListener("click", close);
  modal.addEventListener("click", (e) => { if (e.target === modal) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.classList.contains("hidden")) close(); });
  for (const id of ["te-name", "te-accent", "te-second", "te-text", "te-s0", "te-s1", "te-s2", "te-s3"]) $(id).addEventListener("input", updatePreview);
  $("te-cancel").addEventListener("click", closeEditor);
  $("te-save").addEventListener("click", async () => {
    const t = editorTheme();
    t.panel = flowMix(t.stops[0], "#000000", 0.2);
    if (editing) Object.assign(S.customThemes.find((x) => x.id === editing), t);
    else { t.id = "own-" + Math.random().toString(36).slice(2, 8); S.customThemes.push(t); editing = t.id; }
    await browser.storage.local.set({ customThemes: S.customThemes });
    flowSetThemes(S.theme, S.customThemes);
    const id = editing;
    closeEditor();
    selectTheme(id);
  });
  $("te-delete").addEventListener("click", async () => {
    if (!editing) return;
    S.customThemes = S.customThemes.filter((t) => t.id !== editing);
    await browser.storage.local.set({ customThemes: S.customThemes });
    const wasCurrent = S.theme === editing;
    closeEditor();
    if (wasCurrent) selectTheme("windrad"); else renderThemeGrids();
  });
}

/* --- archive ------------------------------------------------------------- */
function setupArchive() {
  $("archive-hours").value = String(S.archive.hours);
  $("archive-hours").addEventListener("change", (e) => { S.archive.hours = +e.target.value; save("archive"); });
  $("keep-audible").checked = S.archive.keepAudible;
  $("keep-audible").addEventListener("change", (e) => { S.archive.keepAudible = e.target.checked; save("archive"); });
  $("exclude").value = S.archive.exclude.join("\n");
  $("exclude").addEventListener("change", (e) => {
    S.archive.exclude = e.target.value.split(/[\s,]+/).map((d) => d.trim().toLowerCase()
      .replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "")).filter(Boolean);
    e.target.value = S.archive.exclude.join("\n");
    save("archive");
  });
  $("archive-clear").addEventListener("click", () => {
    if (confirm(T("confirmClear"))) browser.runtime.sendMessage({ type: "flow-archive-clear" });
  });
  browser.storage.onChanged.addListener((c) => { if (c.archiveList) renderArchive(); });
}
async function renderArchive() {
  const list = (await browser.storage.local.get({ archiveList: [] })).archiveList;
  const box = $("archive-list");
  box.replaceChildren();
  if (!list.length) { box.append(flowEl("li", "empty", T("archiveEmpty"))); return; }
  for (const a of list) {
    const fav = flowEl("img", "fav"); fav.alt = "";
    fav.src = a.fav || `https://${flowHost(a.url)}/favicon.ico`;
    fav.onerror = () => { fav.style.visibility = "hidden"; };
    const restore = flowEl("button", "btn ghost small-btn", T("restore"));
    restore.type = "button";
    restore.addEventListener("click", () => browser.runtime.sendMessage({ type: "flow-archive-restore", id: a.id }));
    const del = flowEl("button", "icon-btn del", "✕");
    del.type = "button"; del.title = T("remove"); del.setAttribute("aria-label", T("remove"));
    del.addEventListener("click", () => browser.runtime.sendMessage({ type: "flow-archive-remove", id: a.id }));
    box.append(flowEl("li", "", fav,
      flowEl("span", "txt", flowEl("div", "t", a.title), flowEl("div", "s", `${flowHost(a.url)} · ${flowAgo(S, a.at)}`)),
      restore, del));
  }
}

/* --- spaces -------------------------------------------------------------- */
let containers = [];
// nearest of Firefox's container colors for a hex color
function firefoxColor(hex) {
  const pal = { blue: [55, 173, 255], turquoise: [0, 199, 230], green: [81, 205, 0], yellow: [255, 203, 0],
                orange: [255, 159, 0], red: [255, 97, 61], pink: [255, 75, 218], purple: [175, 81, 245] };
  const h = full(FLOW_HEX.test(hex || "") ? hex : "#ff7a95");
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  let best = "pink", d = Infinity;
  for (const [n, v] of Object.entries(pal)) { const x = v.reduce((a, k, i) => a + (k - c[i]) ** 2, 0); if (x < d) { d = x; best = n; } }
  return best;
}
const newId = () => Math.random().toString(36).slice(2, 10);
async function setupSpaces() {
  if (!$("sec-spaces")) return;                       // not in this build
  containers = browser.contextualIdentities ? await browser.contextualIdentities.query({}).catch(() => []) : [];
  renderSpaces();                                   // now with the container list
  $("space-add").addEventListener("click", () => addSpace(true));
  const adv = $("spaces-adv");
  const syncAdv = () => { adv.checked = S.spacesAdvanced; $("spaces-adv-hint").classList.toggle("hidden", !S.spacesAdvanced); };
  adv.addEventListener("change", () => { S.spacesAdvanced = adv.checked; save("spacesAdvanced"); syncAdv(); renderSpaces(); });
  syncAdv();
  if (START_HASH === "#spaces-new" && S.modules.spaces) addSpace(true);
}
function addSpace(focus) {
  S.spaces.push({ id: newId(), name: T("newSpaceName"), emoji: "✨", color: S.color2, container: "" });
  save("spaces");
  renderSpaces();
  if (focus) { const ins = document.querySelectorAll(".spaces input.name"); ins[ins.length - 1]?.select(); }
}
function renderSpaces() {
  const box = $("space-list");
  if (!box) return;
  box.replaceChildren();
  S.spaces.forEach((sp, i) => {
    const emoji = flowEl("input", "emoji"); emoji.type = "text"; emoji.value = sp.emoji || ""; emoji.maxLength = 4;
    emoji.addEventListener("change", () => { sp.emoji = emoji.value.trim(); save("spaces"); });
    const name = flowEl("input", "name"); name.type = "text"; name.value = sp.name; name.maxLength = 30;
    name.setAttribute("aria-label", T("spaceName"));
    name.addEventListener("change", () => { sp.name = name.value.trim() || T("newSpaceName"); save("spaces"); });
    const color = flowEl("input"); color.type = "color"; color.value = FLOW_HEX.test(sp.color || "") ? full(sp.color) : full(S.color1);
    color.addEventListener("change", () => { sp.color = color.value; save("spaces"); });
    const cont = flowEl("select");
    cont.setAttribute("aria-label", T("container"));
    cont.append(Object.assign(flowEl("option", "", T("noContainer")), { value: "" }));
    for (const c of containers) cont.append(Object.assign(flowEl("option", "", c.name), { value: c.cookieStoreId }));
    cont.append(Object.assign(flowEl("option", "", T("newContainer")), { value: "__new" }));
    cont.value = sp.container || "";
    cont.addEventListener("change", async () => {
      if (cont.value === "__new") {
        // Firefox creates the container; its color follows the space color
        try {
          const id = await browser.runtime.sendMessage({ type: "flow-create-container", name: sp.name, color: firefoxColor(sp.color) });
          containers = await browser.contextualIdentities.query({});
          sp.container = id;
        } catch { sp.container = ""; }
        save("spaces"); renderSpaces(); return;
      }
      sp.container = cont.value; save("spaces");
    });
    const btn = (label, title, cls, onClick, disabled) => {
      const b = flowEl("button", `icon-btn ${cls || ""}`, label);
      b.type = "button"; b.title = title; b.setAttribute("aria-label", title); b.disabled = !!disabled;
      b.addEventListener("click", onClick);
      return b;
    };
    const move = (d) => { const j = i + d; [S.spaces[i], S.spaces[j]] = [S.spaces[j], S.spaces[i]]; save("spaces"); renderSpaces(); };
    box.append(flowEl("li", "", emoji, name, color, S.spacesAdvanced ? cont : null,
      btn("↑", T("moveUp"), "", () => move(-1), i === 0),
      btn("↓", T("moveDown"), "", () => move(1), i === S.spaces.length - 1),
      btn("✕", T("deleteSpace"), "del", () => {
        if (!confirm(T("confirmDeleteSpace", { name: sp.name, first: S.spaces[i === 0 ? 1 : 0].name }))) return;
        S.spaces.splice(i, 1);
        save("spaces").then(() => browser.runtime.sendMessage({ type: "flow-space-deleted", id: sp.id }));
        renderSpaces();
      }, S.spaces.length < 2)));
  });
}
browser.storage.onChanged.addListener((c) => {
  // the background creates the first space when the module is switched on
  if (c.spaces && JSON.stringify(c.spaces.newValue) !== JSON.stringify(S.spaces)) { S.spaces = c.spaces.newValue || []; renderSpaces(); }
});

/* --- notes ---------------------------------------------------------------- */
function delBtn(title, onClick) {
  const b = flowEl("button", "icon-btn del", "✕");
  b.type = "button"; b.title = title; b.setAttribute("aria-label", title);
  b.addEventListener("click", onClick);
  return b;
}
async function renderNotes() {
  const box = $("notes-list");
  if (!box) return;
  const { notes = {} } = await browser.storage.local.get("notes");
  const list = Object.entries(notes).sort((a, b) => b[1].updated - a[1].updated);
  box.replaceChildren();
  if (!list.length) { box.append(flowEl("li", "empty", T("notesEmpty"))); return; }
  for (const [key, n] of list) {
    const first = n.text.split("\n").find((l) => l.trim()) || "";
    const where = key.startsWith("site:") ? n.host : `${n.host}${new URL(n.url).pathname}`;
    const open = flowEl("button", "btn ghost small-btn", T("openNote"));
    open.type = "button";
    open.addEventListener("click", () => browser.runtime.sendMessage({ type: "flow-activate", item: { kind: "cmd", id: "openNote", arg: n.url }, fromMenu: true }));
    box.append(flowEl("li", "", flowEl("span", "txt", flowEl("div", "t", first), flowEl("div", "s", `${where} · ${flowAgo(S, n.updated)}`)),
      open, delBtn(T("remove"), async () => {
        if (!confirm(T("confirmDeleteNote"))) return;
        const { notes = {} } = await browser.storage.local.get("notes");
        delete notes[key];
        await browser.storage.local.set({ notes });
      })));
  }
}

/* --- boosts ---------------------------------------------------------------- */
async function renderBoosts() {
  const box = $("boosts-list");
  if (!box) return;
  const { boosts = {} } = await browser.storage.local.get("boosts");
  const list = Object.entries(boosts).sort((a, b) => (b[1].updated || 0) - (a[1].updated || 0));
  box.replaceChildren();
  if (!list.length) { box.append(flowEl("li", "empty", T("boostsEmpty"))); return; }
  for (const [site, b] of list) {
    const bits = [];
    if (b.zap && b.zap.length) bits.push(T("zapped", { n: b.zap.length }));
    if (b.font && b.font !== "original") bits.push(b.font);
    if (b.zoom && b.zoom !== 100) bits.push(`${b.zoom}%`);
    if (b.dark === "on" || b.dark === true) bits.push("🌙");
    if (b.dark === "off") bits.push("☀");
    if (b.hue || (b.sat && b.sat !== 100)) bits.push("🎨");
    if (b.css && b.css.trim()) bits.push(T("custom"));
    const sw = flowEl("input"); sw.type = "checkbox"; sw.checked = b.enabled !== false;
    sw.className = "mini-switch"; sw.title = site;
    sw.addEventListener("change", async () => {
      const { boosts = {} } = await browser.storage.local.get("boosts");
      if (boosts[site]) { boosts[site].enabled = sw.checked; await browser.storage.local.set({ boosts }); }
    });
    const fav = flowEl("img", "fav"); fav.alt = ""; fav.src = `https://${site}/favicon.ico`;
    fav.onerror = () => { fav.style.visibility = "hidden"; };
    box.append(flowEl("li", "", fav, flowEl("span", "txt", flowEl("div", "t", site), flowEl("div", "s", bits.join(" · ") || "–")),
      flowEl("label", "switch inline", sw),
      delBtn(T("remove"), async () => {
        if (!confirm(T("confirmDeleteBoost", { site }))) return;
        const { boosts = {} } = await browser.storage.local.get("boosts");
        delete boosts[site];
        await browser.storage.local.set({ boosts });
      })));
  }
}
browser.storage.onChanged.addListener((c) => {
  if (c.notes) renderNotes();
  if (c.boosts) renderBoosts();
  let col = false;
  for (const k of ["color1", "color2"]) if (c[k] && FLOW_HEX.test(c[k].newValue || "") && S[k] !== c[k].newValue) { S[k] = c[k].newValue; col = true; }
  if (col) { flowApplyColors(S); for (const n of [1, 2]) { $(`color${n}`).value = full(S[`color${n}`]); $(`color${n}-hex`).value = S[`color${n}`]; } }
});

/* --- YouTube ------------------------------------------------------------- */
let Y = null;
async function loadYt() {
  const { yt = {} } = await browser.storage.local.get("yt");
  Y = { ...FLOW_YT_DEFAULTS, ...yt, hide: { ...FLOW_YT_DEFAULTS.hide, ...(yt.hide || {}) },
        custom: { ...FLOW_YT_DEFAULTS.custom, ...(yt.custom || {}) } };
}
const saveYt = () => browser.storage.local.set({ yt: Y }).then(() => {
  $("saved").textContent = T("saved"); clearTimeout(savedTimer); savedTimer = setTimeout(() => { $("saved").textContent = ""; }, 1200);
});
async function renderYouTube() {
  if (!$("yt-hide")) return;
  if (!Y) await loadYt();
  // hide switches
  const hide = $("yt-hide");
  hide.replaceChildren();
  for (const k of Object.keys(FLOW_YT_DEFAULTS.hide)) {
    const cb = flowEl("input"); cb.type = "checkbox"; cb.checked = !!Y.hide[k];
    cb.addEventListener("change", () => { Y.hide[k] = cb.checked; saveYt(); renderYouTube(); });
    const sub = k === "redirect" || k === "chatTheater";
    const lab = flowEl("label", `switch${sub ? " sub" : ""}`, cb, flowEl("span", "", T(`y_${k}`)));
    if (k === "redirect" && !Y.hide.shorts) lab.classList.add("hidden");
    if (k === "chatTheater" && !Y.hide.chat) lab.classList.add("hidden");
    hide.append(lab);
  }
  // playback
  $("yt-quality").value = String(Y.quality);
  $("yt-wheel").checked = Y.wheel;
  $("yt-startvol").checked = Y.startVolume;
  $("yt-startvol-row").classList.toggle("hidden", !Y.startVolume);
  $("yt-startvol-range").value = Y.startVolumeValue;
  $("yt-startvol-val").textContent = `${Y.startVolumeValue} %`;
  $("yt-step").value = String(Y.step);
  $("yt-step-row").classList.toggle("hidden", !Y.wheel);
  // design
  $("yt-colors").checked = Y.colors;
  $("yt-design").classList.toggle("hidden", !Y.colors);
  $("yt-gradient").checked = Y.gradient;
  $("yt-glass").checked = Y.glass;
  const sel = $("yt-preset");
  sel.replaceChildren(Object.assign(flowEl("option", "", `${T("y_myTheme")} (${flowPaletteFor("theme").name})`), { value: "theme" }),
                      ...Object.entries(flowAllThemes()).map(([k, p]) => Object.assign(flowEl("option", "", p.name), { value: k })),
                      Object.assign(flowEl("option", "", T("y_custom")), { value: "custom" }));
  sel.value = Y.preset;
  const colors = Y.preset === "custom" ? Y.custom : flowYtColors(Y.preset);
  const box = $("yt-swatches");
  box.replaceChildren();
  for (const k of ["accent", "bg", "bg2", "hover", "text", "text2", "shadow"]) {
    const pick = flowEl("input"); pick.type = "color"; pick.value = full(colors[k]);
    const hex = flowEl("input", "hex"); hex.type = "text"; hex.maxLength = 7; hex.value = colors[k];
    const set = (v) => {
      // editing a palette color turns it into your own palette
      if (Y.preset !== "custom") { Y.custom = { ...flowYtColors(Y.preset) }; Y.preset = "custom"; sel.value = "custom"; }
      Y.custom[k] = v.toLowerCase(); saveYt();
    };
    pick.addEventListener("input", () => { hex.value = pick.value; set(pick.value); });
    hex.addEventListener("input", () => {
      let v = hex.value.trim(); if (v && !v.startsWith("#")) v = "#" + v;
      const ok = FLOW_HEX.test(v); hex.classList.toggle("invalid", !ok && v.length > 1);
      if (ok) { pick.value = full(v); set(v); }
    });
    box.append(flowEl("div", "color-row", flowEl("span", "", T(`yc_${k}`)), pick, hex));
  }
}
function setupYouTube() {
  $("yt-quality").addEventListener("change", (e) => { Y.quality = e.target.value; saveYt(); });
  $("yt-wheel").addEventListener("change", (e) => { Y.wheel = e.target.checked; saveYt(); renderYouTube(); });
  $("yt-startvol").addEventListener("change", (e) => { Y.startVolume = e.target.checked; saveYt(); renderYouTube(); });
  $("yt-startvol-range").addEventListener("input", (e) => { Y.startVolumeValue = +e.target.value; $("yt-startvol-val").textContent = `${Y.startVolumeValue} %`; saveYt(); });
  $("yt-step").addEventListener("change", (e) => { Y.step = +e.target.value; saveYt(); });
  $("yt-colors").addEventListener("change", (e) => { Y.colors = e.target.checked; saveYt(); renderYouTube(); });
  $("yt-gradient").addEventListener("change", (e) => { Y.gradient = e.target.checked; saveYt(); });
  $("yt-glass").addEventListener("change", (e) => { Y.glass = e.target.checked; saveYt(); });
  $("yt-preset").addEventListener("change", (e) => {
    if (e.target.value === "custom" && Y.preset !== "custom") Y.custom = { ...flowYtColors(Y.preset) };
    Y.preset = e.target.value; saveYt(); renderYouTube();
  });
}

/* --- Peek (link previews) – Chromium build ---------------------------------- */
const PEEK_DEFAULTS = { mode: "overlay", trigger: "alt", width: 82, height: 86, dim: true, blur: true, outside: true,
  closeOnBlur: true, engine: "https://www.google.com/search?q=%s", useLogin: true, popupKind: "full" };
async function setupPeek() {
  if (!$("sec-peek")) return;
  const { peek = {} } = await browser.storage.local.get("peek");
  const P = { ...PEEK_DEFAULTS, ...peek };
  const store = () => browser.storage.local.set({ peek: P }).then(() => { $("saved").textContent = T("saved"); });
  segmented("peek-mode", () => P.mode, (v) => { P.mode = v; store(); $("peek-overlay").classList.toggle("hidden", v !== "overlay"); $("peek-popup").classList.toggle("hidden", v !== "popup"); });
  $("peek-overlay").classList.toggle("hidden", P.mode !== "overlay"); $("peek-popup").classList.toggle("hidden", P.mode !== "popup");
  segmented("peek-trigger", () => P.trigger, (v) => { P.trigger = v; store(); });
  for (const k of ["width", "height"]) {
    $(`peek-${k}`).value = P[k]; $(`peek-${k}-val`).textContent = `${P[k]} %`;
    $(`peek-${k}`).addEventListener("input", (e) => { P[k] = +e.target.value; $(`peek-${k}-val`).textContent = `${P[k]} %`; store(); });
  }
  if ($("peek-kind")) segmented("peek-kind", () => P.popupKind, (v) => { P.popupKind = v; store(); });
  for (const k of ["dim", "blur", "outside", "closeOnBlur", "useLogin"]) {
    if (!$(`peek-${k}`)) continue;
    $(`peek-${k}`).checked = P[k];
    $(`peek-${k}`).addEventListener("change", (e) => { P[k] = e.target.checked; store(); });
  }
  $("peek-engine").value = P.engine;
  $("peek-engine").addEventListener("change", (e) => { P.engine = e.target.value; store(); });
}

/* --- dark mode settings (Boosts page) --------------------------------------- */
function setupDark(boostGlobal) {
  const G = { ...boostGlobal };
  const D = { ...FLOW_DARK_DEFAULTS, ...(G.dark || {}) };
  let t;
  const store = () => {
    G.dark = { ...D };
    clearTimeout(t);
    t = setTimeout(() => browser.storage.local.set({ boostGlobal: G }).then(() => {
      $("saved").textContent = T("saved"); clearTimeout(savedTimer); savedTimer = setTimeout(() => { $("saved").textContent = ""; }, 1200);
    }), 150);
    preview();
  };
  $("dark-all").checked = !!G.darkAll;
  $("dark-all").addEventListener("change", (e) => { G.darkAll = e.target.checked; store(); });
  const unit = { darkness: "", brightness: " %", contrast: " %", sepia: " %", grayscale: " %" };
  const sync = () => {
    for (const k of Object.keys(unit)) { $(`dk-${k}`).value = D[k]; $(`dk-${k}-val`).textContent = `${D[k]}${unit[k]}`; }
    $("dk-text").querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === D.text));
    $("dk-custom-row").classList.toggle("hidden", D.text !== "custom");
    $("dk-textcolor").value = full(D.textColor); $("dk-textcolor-hex").value = D.textColor;
    $("dk-textondark").checked = !!D.textOnDark;
  };
  for (const k of Object.keys(unit)) $(`dk-${k}`).addEventListener("input", (e) => { D[k] = +e.target.value; $(`dk-${k}-val`).textContent = `${D[k]}${unit[k]}`; store(); });
  $("dk-text").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; D.text = b.dataset.value; sync(); store(); });
  $("dk-textcolor").addEventListener("input", (e) => { D.textColor = e.target.value; $("dk-textcolor-hex").value = D.textColor; store(); });
  $("dk-textcolor-hex").addEventListener("input", (e) => {
    let v = e.target.value.trim(); if (v && !v.startsWith("#")) v = "#" + v;
    if (FLOW_HEX.test(v)) { D.textColor = v.toLowerCase(); $("dk-textcolor").value = full(v); store(); }
  });
  $("dk-textondark").addEventListener("change", (e) => { D.textOnDark = e.target.checked; store(); });
  $("dk-reset").addEventListener("click", () => { Object.assign(D, FLOW_DARK_DEFAULTS); sync(); store(); });
  // live preview: a small light "web page" run through exactly the same filters
  function preview() {
    const F = flowDarkFilters(D);
    const page = $("dk-preview").querySelector(".dp-page");
    page.style.filter = F.page;
    page.querySelector(".dp-img").style.filter = F.media;
    const want = flowDarkTextColor(D, S.color1);
    const src = want ? flowDarkSourceColor(D, want) : "";
    page.querySelectorAll(".dp-h, .dp-t").forEach((n) => { n.style.color = src; });
  }
  sync(); preview();
}

/* --- backup ------------------------------------------------------------- */
function setupBackup() {
  $("export").addEventListener("click", async () => {
    const data = { app: "windrad-flow", version: 1, ...(await browser.storage.local.get(null)) };
    const a = flowEl("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = `windrad-flow-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(a); a.click(); a.remove();
  });
  $("import").addEventListener("change", (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const d = JSON.parse(r.result);
        if (d.app !== "windrad-flow") throw new Error();
        delete d.app; delete d.version;
        await browser.storage.local.set(d);
        $("backup-msg").textContent = T("imported");
        setTimeout(() => location.reload(), 600);
      } catch { $("backup-msg").textContent = T("importFailed"); }
      e.target.value = "";
    };
    r.readAsText(f);
  });
}

/* --- start -------------------------------------------------------------- */
(async () => {
  S = await flowLoad();
  flowApplyColors(S);
  texts();
  segmented("lang", () => S.lang, (v) => { S.lang = v; save("lang"); texts(); });
  segmented("player-pos", () => S.player.position, (v) => { S.player.position = v; save("player"); browser.storage.local.remove("playerPos"); });
  segmented("player-style", () => S.player.style, (v) => { S.player.style = v; save("player"); });
  const pc = $("player-colors");
  const fillColors = () => {
    pc.replaceChildren(Object.assign(flowEl("option", "", T("plTheme")), { value: "theme" }),
      Object.assign(flowEl("option", "", T("plCover")), { value: "cover" }),
      ...Object.entries(FLOW_PALETTES).map(([k, p]) => Object.assign(flowEl("option", "", p.name), { value: k })));
    pc.value = S.player.colors;
  };
  fillColors();
  pc.addEventListener("change", () => { S.player.colors = pc.value; save("player"); });
  $("player-glass").checked = S.player.glass !== false;
  $("player-glass").addEventListener("change", (e) => { S.player.glass = e.target.checked; save("player"); });
  $("player-video").checked = S.player.video !== false;
  $("player-video").addEventListener("change", (e) => { S.player.video = e.target.checked; save("player"); $("player-videomode-row").classList.toggle("hidden", !e.target.checked); });
  $("player-videomode-row").classList.toggle("hidden", S.player.video === false);
  segmented("player-videomode", () => S.player.videoMode || "pip", (v) => { S.player.videoMode = v; save("player"); });
  $("player-reset-pos").addEventListener("click", () => browser.storage.local.remove("playerPos").then(() => { $("saved").textContent = T("saved"); }));
  $("lang").addEventListener("click", () => setTimeout(fillColors, 0));
  segmented("openIn", () => S.palette.openIn, (v) => { S.palette.openIn = v; save("palette"); });
  for (const k of ["tabs", "bookmarks", "history"]) {
    const cb = $(`src-${k}`);
    cb.checked = S.palette.sources[k];
    cb.addEventListener("change", () => { S.palette.sources[k] = cb.checked; save("palette"); });
  }
  $("engine").value = S.palette.engine;
  $("engine").addEventListener("change", (e) => { S.palette.engine = e.target.value; save("palette"); });
  setupShortcut();
  setupColors();
  setupThemes();
  setupBackup();
  const h = START_HASH.slice(1).replace("-new", "");
  showPage(h ? `sec-${h}` : "sec-general", false);
  setupArchive();
  setupSpaces();
  setupPeek();
  const { volumeOpts = {} } = await browser.storage.local.get("volumeOpts");
  $("vol-remember").checked = volumeOpts.remember !== false;
  $("vol-remember").addEventListener("change", (e) => browser.storage.local.set({ volumeOpts: { remember: e.target.checked } }));
  await loadYt();
  setupYouTube();
  renderYouTube();
  const { boostGlobal = {} } = await browser.storage.local.get("boostGlobal");
  setupDark(boostGlobal);
  $("notes-auto").checked = S.notesOpts.autoOpen;
  $("notes-auto").addEventListener("change", (e) => { S.notesOpts.autoOpen = e.target.checked; save("notesOpts"); });
})();
