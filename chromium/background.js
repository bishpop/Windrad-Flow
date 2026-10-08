/* =====================================================================
   Windrad Flow – background
   - opens the command bar and carries out what you pick in it
   - module "Auto-archive": closes tabs you haven't used for a while and
     keeps them in an archive you can search and restore
   - module "Spaces": separate sets of tabs per window, the tabs of the
     other spaces are hidden
   ===================================================================== */
"use strict";

let S = null;
const ready = flowLoad().then((v) => { S = v; });
const T = (k, v) => flowT(S, k, v);
browser.storage.onChanged.addListener(async (changes) => {
  S = await flowLoad();
  if (changes.modules || changes.spaces) await spacesSync();
  if (changes.modules) setupArchiveAlarm();
});

/* =====================================================================
   Command bar: open it
   ===================================================================== */
// Firefox only lets the toolbar popup open directly inside the shortcut
// handler, so the URL of the active tab per window is kept up to date.
const activeUrl = new Map();
let focusedWindow = null;
const remember = (tab) => { if (tab && tab.active) activeUrl.set(tab.windowId, tab.url || ""); };
browser.tabs.query({ active: true }).then((tabs) => tabs.forEach(remember));
browser.windows.getLastFocused().then((w) => { focusedWindow = w.id; }).catch(() => {});
browser.tabs.onActivated.addListener(({ tabId }) => browser.tabs.get(tabId).then(remember).catch(() => {}));
browser.tabs.onUpdated.addListener((id, info, tab) => { if (info.url || info.status) remember(tab); });
browser.windows.onFocusChanged.addListener((id) => { if (id !== browser.windows.WINDOW_ID_NONE) focusedWindow = id; });

// the toolbar menu opens straight in search mode when Ctrl+Space was used
// on a page where the floating bar can't appear
let menuSearchMode = false;
const RESTRICTED = /^https?:\/\/(addons\.mozilla\.org|accounts\.firefox\.com|support\.mozilla\.org|chromewebstore\.google\.com|chrome\.google\.com\/webstore)\//;
const canDrawIn = (url) => /^(https?|file):/.test(url || "") && !RESTRICTED.test(url);

browser.commands.onCommand.addListener((cmd) => {
  if (cmd === "open-palette") {
    const url = activeUrl.get(focusedWindow);
    if (url !== undefined && !canDrawIn(url)) { menuSearchMode = true; browser.action.openPopup().catch(() => {}); return; }
    openInPage();
  }
  if (cmd === "toggle-note") ready.then(async () => {
    if (!S.modules.notes) return;
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && canDrawIn(tab.url)) sendToPage(tab.id, { type: "flow-note-open" }).catch(() => {});
  });
  if (cmd === "next-space") stepSpace(1);
  if (cmd === "prev-space") stepSpace(-1);
});

async function sendToPage(tabId, msg) {
  try { return await browser.tabs.sendMessage(tabId, msg); }
  catch {
    // page was open before Flow was installed -> add the helper and retry
    await browser.scripting.executeScript({ target: { tabId }, files: ["shared.js", "boosts.js", "content.js", "player.js", "notes.js", "volume.js"] });
    return browser.tabs.sendMessage(tabId, msg);
  }
}
async function openInPage() {
  await ready;
  if (!S.modules.palette) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  try { await sendToPage(tab.id, { type: "flow-palette", tabId: tab.id }); }
  catch { menuSearchMode = true; browser.action.openPopup().catch(() => {}); }
}

// copy text: Firefox's background has a page with clipboard access; Chromium's
// service worker doesn't, there an invisible helper page (offscreen) does it
async function copyText(text) {
  if (typeof document !== "undefined" && navigator.clipboard) return navigator.clipboard.writeText(text);
  const url = browser.runtime.getURL("offscreen.html");
  const has = browser.runtime.getContexts ? (await browser.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] })).length : 0;
  // Chromium-only API (never reached in Firefox, which has a clipboard above)
  const offscreenApi = browser["off" + "screen"];
  if (!has) await offscreenApi.createDocument({ url, reasons: ["CLIPBOARD"], justification: "Copy the page address" });
  const ok = await browser.runtime.sendMessage({ type: "flow-offscreen-copy", text });
  if (!ok) throw new Error("clipboard");
}

// small glass message on the current page (if the browser allows it there)
async function toast(text, color) {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab && canDrawIn(tab.url)) sendToPage(tab.id, { type: "flow-toast", text, color: color || S.color1 }).catch(() => {});
}

/* =====================================================================
   Command bar: data and actions
   ===================================================================== */
// Only answer messages meant for this listener – returning a promise for
// others would swallow the answer of the mini-player listener below.
const PALETTE_MSGS = new Set(["flow-menu-data", "flow-palette-data", "flow-activate", "flow-create-container", "flow-archive-restore",
  "flow-archive-remove", "flow-archive-clear", "flow-space-deleted"]);
browser.runtime.onMessage.addListener((msg) => {
  if (!msg || !PALETTE_MSGS.has(msg.type)) return;
  return handlePaletteMsg(msg);
});
async function handlePaletteMsg(msg) {
  await ready;
  if (msg.type === "flow-menu-data") {
    const search = menuSearchMode;
    menuSearchMode = false;
    const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
    if (S.modules.spaces) await whenSpacesReady();
    return {
      search, tabId: tab && tab.id,
      spaces: S.modules.spaces ? S.spaces : [],
      activeSpace: tab ? windowSpace.get(tab.windowId) : null,
      archive: S.modules.archive ? (await getArchive()).slice(0, 3) : [],
      media: S.modules.player ? await mediaState().catch(() => null) : null,
      private: await browser.extension.isAllowedIncognitoAccess(),
    };
  }
  if (msg.type === "flow-create-container") {
    const c = await browser.contextualIdentities.create({ name: msg.name, color: msg.color, icon: "circle" });
    return c.cookieStoreId;
  }
  if (msg.type === "flow-palette-data") {
    const tabSpace = {};
    for (const [id, sp] of spaceOfTab) tabSpace[id] = sp;
    const tab = msg.tabId ? await browser.tabs.get(msg.tabId).catch(() => null) : null;
    return {
      spaces: S.modules.spaces ? S.spaces : [],
      tabSpace,
      activeSpace: tab ? windowSpace.get(tab.windowId) : null,
      archive: S.modules.archive ? (await getArchive()).slice(0, 200) : [],
      notes: S.modules.notes ? Object.entries((await browser.storage.local.get({ notes: {} })).notes)
        .map(([key, n]) => ({ key, text: n.text.slice(0, 200), url: n.url, title: n.title, host: n.host, updated: n.updated }))
        .sort((a, b) => b.updated - a.updated) : [],
    };
  }
  if (msg.type === "flow-activate") {
    try { await activate(msg.item, msg.tabId, msg.shift); return { ok: true }; }
    catch (e) {
      console.warn("[Windrad Flow] command failed:", msg.item, e);
      const text = (e && e.message) || String(e);
      if (!msg.fromMenu) toast(`${T("failed")}: ${text}`, "#ff8a9c");
      return { ok: false, error: text };
    }
  }
  if (msg.type === "flow-archive-restore") return restoreArchived(msg.id);
  if (msg.type === "flow-archive-remove") return removeArchived(msg.id);
  if (msg.type === "flow-archive-clear") return browser.storage.local.set({ archiveList: [] });
  if (msg.type === "flow-space-deleted") return spaceDeleted(msg.id);
}

async function activate(item, tabId, shift) {
  let tab = tabId ? await browser.tabs.get(tabId).catch(() => null) : null;
  if (!tab) [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  switch (item.kind) {
    case "tab":
      await browser.tabs.update(item.tabId, { active: true });
      await browser.windows.update(item.windowId, { focused: true });
      return;
    case "url": {
      const current = (S.palette.openIn === "current") !== !!shift;
      if (current && tab) await browser.tabs.update(tab.id, { url: item.url });
      else await browser.tabs.create({ url: item.url, index: tab ? tab.index + 1 : undefined, windowId: tab?.windowId });
      return;
    }
    case "space": return tab && switchSpace(tab.windowId, item.spaceId);
    case "archive": return restoreArchived(item.id, tab);
    case "cmd": return runCommand(item.id, tab, item.arg);
  }
}

async function runCommand(id, t, arg) {
  t = t || {};
  switch (id) {
    case "newTab": return browser.tabs.create({ windowId: t.windowId });
    case "newWindow": return browser.windows.create({});
    case "privateWindow":
      // Firefox only lets extensions open private windows if they're allowed there
      if (!(await browser.extension.isAllowedIncognitoAccess())) throw new Error(T("needPrivate"));
      return browser.windows.create({ incognito: true });
    case "closeTab": return browser.tabs.remove(t.id);
    case "reopen": {
      // newest first; skip entries Firefox can't restore any more
      const list = await browser.sessions.getRecentlyClosed({ maxResults: 10 });
      for (const entry of list) {
        const sid = (entry.tab || entry.window || {}).sessionId;
        if (!sid) continue;
        try { await browser.sessions.restore(sid); return; } catch {}
      }
      throw new Error(T("nothingClosed"));
    }
    case "duplicate": return browser.tabs.duplicate(t.id);
    case "pin": return browser.tabs.update(t.id, { pinned: !t.pinned });
    case "mute": return browser.tabs.update(t.id, { muted: !(t.mutedInfo && t.mutedInfo.muted) });
    case "reload": return browser.tabs.reload(t.id);
    case "copyLink":
      await copyText(t.url);
      return toast(T("copied"));
    case "moveWindow": return browser.windows.create({ tabId: t.id });
    case "closeOthers": {
      const others = await browser.tabs.query(FLOW_IS_FIREFOX ? { windowId: t.windowId, pinned: false, hidden: false } : { windowId: t.windowId, pinned: false });
      return browser.tabs.remove(others.filter((o) => o.id !== t.id).map((o) => o.id));
    }
    case "unloadOthers": {
      const others = await browser.tabs.query({ windowId: t.windowId, discarded: false });
      return browser.tabs.discard(others.filter((o) => o.id !== t.id && !o.active).map((o) => o.id));
    }
    case "bookmark": return browser.bookmarks.create({ title: t.title, url: t.url });
    case "reader": return browser.tabs.toggleReaderMode(t.id);
    case "archiveNow": return archiveTab(t, true);
    case "openArchive": return browser.tabs.create({ url: browser.runtime.getURL("options.html#archive") });
    case "newSpace": return browser.tabs.create({ url: browser.runtime.getURL("options.html#spaces-new") });
    case "nextSpace": return stepSpace(1);
    case "prevSpace": return stepSpace(-1);
    case "moveToSpace": return moveTabToSpace(t, arg);
    case "noteThis":
    case "boostThis":
    case "toggleDark":
      if (!canDrawIn(t.url)) throw new Error(T("notHere"));
      return sendToPage(t.id, { type: { noteThis: "flow-note-open", boostThis: "flow-boost-open", toggleDark: "flow-dark-toggle" }[id] });
    case "openNote": {
      // from the command bar: go to the page of the note and open it there
      const url = arg;
      let target = t && t.url && flowHost(t.url) === flowHost(url) ? t : null;
      if (!target) {
        target = await browser.tabs.create({ url, index: t?.index !== undefined ? t.index + 1 : undefined });
        await new Promise((res) => {
          const on = (id, info) => { if (id === target.id && info.status === "complete") { browser.tabs.onUpdated.removeListener(on); res(); } };
          browser.tabs.onUpdated.addListener(on);
          setTimeout(res, 15000);
        });
      }
      return sendToPage(target.id, { type: "flow-note-open" });
    }
    case "youtube": return browser.tabs.create({ url: browser.runtime.getURL("options.html#youtube") });
    case "settings": return browser.runtime.openOptionsPage();
  }
}

/* =====================================================================
   Module: auto-archive
   ===================================================================== */
const getArchive = async () => (await browser.storage.local.get({ archiveList: [] })).archiveList;

function setupArchiveAlarm() {
  if (S && S.modules.archive) browser.alarms.create("flow-archive", { periodInMinutes: 10, delayInMinutes: 1 });
  else browser.alarms.clear("flow-archive");
}
ready.then(setupArchiveAlarm);
browser.alarms.onAlarm.addListener(async (a) => {
  await ready;
  if (a.name === "flow-archive" && S.modules.archive) archiveOldTabs();
});

const excluded = (url) => {
  const h = flowHost(url);
  return S.archive.exclude.some((d) => d && (h === d || h.endsWith("." + d)));
};

async function archiveOldTabs() {
  const limit = Date.now() - S.archive.hours * 3600e3;
  const tabs = await browser.tabs.query({});
  const perWindow = {};
  for (const t of tabs) perWindow[t.windowId] = (perWindow[t.windowId] || 0) + 1;
  for (const t of tabs) {
    if (t.pinned || t.active || (S.archive.keepAudible && t.audible)) continue;
    if (!/^https?:/.test(t.url) || excluded(t.url)) continue;
    if ((t.lastAccessed || Date.now()) > limit) continue;
    if (perWindow[t.windowId] <= 1) continue;            // never close a window by accident
    perWindow[t.windowId]--;
    await archiveTab(t);
  }
}

async function archiveTab(t, manual) {
  if (!t || !t.url || !/^https?:/.test(t.url)) return;
  const list = await getArchive();
  list.unshift({
    id: Math.random().toString(36).slice(2, 10),
    url: t.url, title: t.title || t.url,
    fav: /^https?:/.test(t.favIconUrl || "") ? t.favIconUrl : "",
    at: Date.now(),
    container: t.cookieStoreId && t.cookieStoreId !== "firefox-default" ? t.cookieStoreId : "",
    space: spaceOfTab.get(t.id) || "",
  });
  await browser.storage.local.set({ archiveList: list.slice(0, S.archive.max) });
  await browser.tabs.remove(t.id).catch(() => {});
  if (manual) toast(`${T("secArchive")}: ${t.title || flowHost(t.url)}`);
}

async function restoreArchived(id, tab) {
  const list = await getArchive();
  const e = list.find((x) => x.id === id);
  if (!e) return;
  if (!tab) [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const opts = { url: e.url, active: true, windowId: tab?.windowId };
  if (e.container) {
    const ok = await browser.contextualIdentities.get(e.container).catch(() => null);
    if (ok) opts.cookieStoreId = e.container;
  }
  await browser.tabs.create(opts);
  await browser.storage.local.set({ archiveList: list.filter((x) => x.id !== id) });
}
async function removeArchived(id) {
  const list = await getArchive();
  await browser.storage.local.set({ archiveList: list.filter((x) => x.id !== id) });
}

/* =====================================================================
   Module: spaces
   Which space a tab / window belongs to is stored with Firefox's session
   data, so it survives restarts.
   ===================================================================== */
const spaceOfTab = new Map();     // tabId -> spaceId
const windowSpace = new Map();    // windowId -> active spaceId
const uid = () => Math.random().toString(36).slice(2, 10);
// after the background wakes up, the tab -> space table is read again first
let spacesReady = null;
const whenSpacesReady = () => (spacesReady ||= ready.then(spacesSync).catch((e) => console.warn("[Windrad Flow] spaces:", e)));
const spacesOn = () => S && S.modules.spaces && S.spaces.length;
const spaceById = (id) => S.spaces.find((s) => s.id === id);
let switching = false;

async function ensureDefaultSpace() {
  if (S.spaces.length) return;
  S.spaces = [
    { id: uid(), name: T("spaceHome"),     emoji: "🏠", color: S.color1,  container: "" },
    { id: uid(), name: T("spaceStudy"),    emoji: "🎓", color: S.color2,  container: "" },
    { id: uid(), name: T("spaceProjects"), emoji: "🛠", color: "#b18cff", container: "" },
  ];
  await browser.storage.local.set({ spaces: S.spaces });
}

async function setTabSpace(tabId, id) {
  spaceOfTab.set(tabId, id);
  await browser.sessions.setTabValue(tabId, "flowSpace", id).catch(() => {});
}
async function setWindowSpace(windowId, id) {
  windowSpace.set(windowId, id);
  await browser.sessions.setWindowValue(windowId, "flowSpace", id).catch(() => {});
}

// read what is stored, fill gaps, show/hide everything accordingly
async function spacesSync() {
  if (!browser.tabs.hide) return;                    // spaces need Firefox (hiding tabs)
  if (!S.modules.spaces) {
    const hidden = await browser.tabs.query({ hidden: true });
    if (hidden.length) await browser.tabs.show(hidden.map((t) => t.id)).catch(() => {});
    const wins = await browser.windows.getAll();
    for (const w of wins) browser.action.setBadgeText({ windowId: w.id, text: "" });
    return;
  }
  await ensureDefaultSpace();
  const valid = new Set(S.spaces.map((s) => s.id));
  const first = S.spaces[0].id;
  const wins = await browser.windows.getAll({ populate: true, windowTypes: ["normal"] });
  for (const w of wins) {
    let ws = await browser.sessions.getWindowValue(w.id, "flowSpace").catch(() => null);
    if (!valid.has(ws)) ws = first;
    await setWindowSpace(w.id, ws);
    for (const t of w.tabs) {
      let ts = spaceOfTab.get(t.id) || await browser.sessions.getTabValue(t.id, "flowSpace").catch(() => null);
      if (!valid.has(ts)) ts = ws;
      if (spaceOfTab.get(t.id) !== ts) await setTabSpace(t.id, ts);
    }
    await applyWindow(w.id);
  }
}

async function applyWindow(windowId) {
  if (!spacesOn()) return;
  const active = windowSpace.get(windowId);
  const tabs = await browser.tabs.query({ windowId });
  const show = [], hide = [];
  for (const t of tabs) {
    if (t.pinned || spaceOfTab.get(t.id) === active) { if (t.hidden) show.push(t.id); }
    else if (!t.hidden && !t.active) hide.push(t.id);
  }
  if (show.length) await browser.tabs.show(show).catch(() => {});
  if (hide.length) await browser.tabs.hide(hide).catch(() => {});
  const sp = spaceById(active);
  if (sp) {
    browser.action.setBadgeText({ windowId, text: sp.emoji || sp.name.slice(0, 1).toUpperCase() });
    browser.action.setBadgeBackgroundColor({ windowId, color: sp.color || S.color1 });
    browser.action.setTitle({ windowId, title: `Windrad Flow · ${sp.emoji ? sp.emoji + " " : ""}${sp.name}` });
  }
}

// the newly shown tab plays the switch animation (big glass card + sweep)
async function announceSpace(windowId, id, dir) {
  const sp = spaceById(id);
  const [t] = await browser.tabs.query({ windowId, active: true });
  if (!sp || !t || !canDrawIn(t.url)) return;
  const index = S.spaces.findIndex((s) => s.id === id);
  sendToPage(t.id, { type: "flow-space", space: { name: sp.name, emoji: sp.emoji, color: sp.color || S.color1 },
                     index, count: S.spaces.length, dir: dir || 1, color2: S.color2 }).catch(() => {});
}

async function switchSpace(windowId, id, { quiet = false, dir = 1 } = {}) {
  if (!spacesOn() || !spaceById(id)) return;
  switching = true;
  try {
    await setWindowSpace(windowId, id);
    const tabs = await browser.tabs.query({ windowId });
    const mine = tabs.filter((t) => !t.pinned && spaceOfTab.get(t.id) === id);
    const current = tabs.find((t) => t.active);
    if (!current || current.pinned || spaceOfTab.get(current.id) !== id) {
      // go to the last used tab of that space, or open a fresh one there
      if (mine.length) {
        const last = mine.sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0))[0];
        if (last.hidden) await browser.tabs.show(last.id).catch(() => {});
        await browser.tabs.update(last.id, { active: true });
      } else {
        await newTabInSpace(windowId, id);
      }
    }
    await applyWindow(windowId);
  } finally { switching = false; }
  if (!quiet) announceSpace(windowId, id, dir);
}

async function newTabInSpace(windowId, id) {
  const sp = spaceById(id);
  const opts = { windowId, active: true };
  if (sp && sp.container) opts.cookieStoreId = sp.container;
  pendingSpace = id;
  const t = await browser.tabs.create(opts).catch(() => browser.tabs.create({ windowId, active: true }));
  await setTabSpace(t.id, id);
  return t;
}
let pendingSpace = null;

async function stepSpace(dir) {
  await whenSpacesReady();
  if (!spacesOn()) return;
  const w = await browser.windows.getLastFocused();
  const cur = S.spaces.findIndex((s) => s.id === windowSpace.get(w.id));
  const next = S.spaces[(cur + dir + S.spaces.length) % S.spaces.length];
  switchSpace(w.id, next.id, { dir });
}

async function moveTabToSpace(t, id) {
  if (!spacesOn() || !t || !t.id || !spaceById(id)) return;
  await setTabSpace(t.id, id);
  if (t.pinned) return;
  if (id !== windowSpace.get(t.windowId) && t.active) {
    // the tab leaves the space you're looking at -> follow it
    await switchSpace(t.windowId, id);
  } else await applyWindow(t.windowId);
}

async function spaceDeleted(id) {
  S = await flowLoad();
  if (!S.spaces.length) return;
  const first = S.spaces[0].id;
  for (const [tabId, sp] of spaceOfTab) if (sp === id) await setTabSpace(tabId, first);
  for (const [winId, sp] of windowSpace) if (sp === id) await switchSpace(winId, first, { quiet: true });
}

/* keep everything in order while you browse */
browser.tabs.onCreated.addListener(async (tab) => {
  await whenSpacesReady();
  if (!spacesOn() || spaceOfTab.has(tab.id)) return;
  let id = pendingSpace || (tab.openerTabId && spaceOfTab.get(tab.openerTabId)) || windowSpace.get(tab.windowId) || S.spaces[0].id;
  pendingSpace = null;
  await setTabSpace(tab.id, id);
  // empty new tab in a space with a container -> reopen it in that container
  const sp = spaceById(id);
  const blank = !tab.url || /^about:(newtab|home|blank)$/.test(tab.url) || tab.url.startsWith("moz-extension:");
  if (sp && sp.container && blank && tab.cookieStoreId !== sp.container && !tab.incognito) {
    const fresh = await browser.tabs.create({ windowId: tab.windowId, index: tab.index, active: tab.active,
                                               cookieStoreId: sp.container }).catch(() => null);
    if (fresh) { await setTabSpace(fresh.id, id); browser.tabs.remove(tab.id).catch(() => {}); }
  }
});
browser.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  await whenSpacesReady();
  if (!spacesOn() || switching) return;
  const t = await browser.tabs.get(tabId).catch(() => null);
  if (!t || t.pinned) return;
  const id = spaceOfTab.get(tabId);
  // a tab of another space was opened (e.g. from the command bar) -> go there
  if (id && id !== windowSpace.get(windowId)) switchSpace(windowId, id);
});
browser.tabs.onAttached.addListener(async (tabId, { newWindowId }) => {
  await whenSpacesReady();
  if (!spacesOn()) return;
  if (!windowSpace.has(newWindowId)) await setWindowSpace(newWindowId, spaceOfTab.get(tabId) || S.spaces[0].id);
  else await setTabSpace(tabId, windowSpace.get(newWindowId));
  applyWindow(newWindowId);
});
browser.tabs.onRemoved.addListener((tabId) => spaceOfTab.delete(tabId));
browser.windows.onRemoved.addListener((id) => windowSpace.delete(id));
browser.windows.onCreated.addListener(async (w) => {
  await whenSpacesReady();
  if (spacesOn() && !windowSpace.has(w.id)) setTimeout(spacesSync, 300);
});



/* =====================================================================
   Module: mini player
   Remembers the last tab that played sound. While you're on another tab,
   a small glass player in the corner controls it.
   ===================================================================== */
// Firefox puts the background to sleep when idle – the playing tab is
// therefore kept in session storage, not only in memory.
let media = null;          // { tabId, dismissed }
const saveMedia = () => browser.storage.session.set({ flowMedia: media }).catch(() => {});
async function loadMedia() {
  if (media) return media;
  media = (await browser.storage.session.get({ flowMedia: null }).catch(() => ({}))).flowMedia || null;
  if (!media) {
    const [playing] = await browser.tabs.query({ audible: true });
    if (playing) { media = { tabId: playing.id, dismissed: false }; saveMedia(); }
  }
  return media;
}

// runs INSIDE the media tab (all frames): finds the playing video/audio,
// optionally does something with it, and reports its state
function flowMediaControl(cmd) {
  const els = [...document.querySelectorAll("video, audio")];
  if (window.__windradPipVideo) els.unshift(window.__windradPipVideo);     // moved into picture-in-picture
  const m = els.find((e) => !e.paused) || els.find((e) => e.currentTime > 0) || null;
  if (!m) return null;
  const click = (sels) => { for (const s of sels) { const b = document.querySelector(s); if (b) { b.click(); return true; } } return false; };
  if (cmd === "toggle") { if (m.paused) m.play().catch(() => {}); else m.pause(); }
  if (cmd === "back") m.currentTime = Math.max(0, m.currentTime - 10);
  if (cmd === "fwd") m.currentTime = Math.min(m.duration || Infinity, m.currentTime + 10);
  if (cmd === "next") click([".ytp-next-button", "ytmusic-player-bar .next-button", "[data-testid=control-button-skip-forward]", ".skipControl__next"]);
  if (cmd === "prev") click([".ytp-prev-button", "ytmusic-player-bar .previous-button", "[data-testid=control-button-skip-back]", ".skipControl__previous"]);
  if (typeof cmd === "number") m.currentTime = cmd * (m.duration || 0);
  if (cmd === "pause") m.pause();
  // hand-over from the video window: jump to its time, optionally play
  if (cmd && typeof cmd === "object" && typeof cmd.seek === "number") {
    m.currentTime = cmd.seek;
    if (cmd.play) m.play().catch(() => {});
  }
  let meta = null;
  try { meta = navigator.mediaSession && navigator.mediaSession.metadata; } catch {}
  const art = meta && meta.artwork && meta.artwork.length ? meta.artwork[meta.artwork.length - 1].src : "";
  return {
    paused: m.paused,
    time: m.currentTime, duration: isFinite(m.duration) ? m.duration : 0,
    title: (meta && meta.title) || "", artist: (meta && meta.artist) || "", art: /^https?:/.test(art) ? art : "",
  };
}

async function mediaState(cmd) {
  await loadMedia();
  if (!media) return null;
  const t = await browser.tabs.get(media.tabId).catch(() => null);
  if (!t) { media = null; saveMedia(); return null; }
  let info = null;
  try {
    const res = await browser.scripting.executeScript({
      target: { tabId: t.id, allFrames: true }, func: flowMediaControl, args: [cmd === undefined ? null : cmd],
    });
    info = (res.find((r) => r.result) || {}).result || null;
  } catch {}
  // video is in the always-on-top window (lives in another tab) -> its time counts
  if (media.videoHost) {
    const pip = await browser.tabs.sendMessage(media.videoHost, { type: "flow-pip-state" }, { frameId: 0 }).catch(() => null);
    if (pip) info = { ...(info || {}), time: pip.time, duration: pip.duration || (info && info.duration) || 0, paused: pip.paused };
  }
  return {
    tabId: t.id, host: flowHost(t.url), fav: /^https?:/.test(t.favIconUrl || "") ? t.favIconUrl : "",
    videoMode: S.player.videoMode || "pip", pipOn: !!media.videoHost,
    // YouTube video id -> the player can show the video in its own small window
    ytId: S.player.video !== false ? ytIdOf(t.url) : "",
    title: (info && info.title) || t.title || flowHost(t.url), artist: (info && info.artist) || flowHost(t.url),
    art: (info && info.art) || "", muted: !!(t.mutedInfo && t.mutedInfo.muted),
    paused: info ? info.paused : !t.audible, time: info ? info.time : 0, duration: info ? info.duration : 0,
    lang: S.lang, pos: S.player.position, style: S.player.style || "minimal", glass: S.player.glass !== false,
    look: await playerLook((info && info.art) || (/^https?:/.test(t.favIconUrl || "") ? t.favIconUrl : "")),
  };
}

/* ---- video window: the real YouTube page in a small Firefox window ----
   (logged in, uBlock & all your extensions, Flow's YouTube features).
   It shows only the player; the YouTube tab pauses meanwhile. Closing the
   window continues the video in that tab at the same spot. */
async function openVideoWindow(fromTab) {
  await loadMedia();
  if (!media) return null;
  if (media.popupWindow) {                               // already open -> bring it to the front
    browser.windows.update(media.popupWindow, { focused: true }).catch(() => {});
    return null;
  }
  const origin = await browser.tabs.get(media.tabId).catch(() => null);
  const id = origin && ytIdOf(origin.url);
  if (!id) return null;
  const st = await mediaState("pause");
  const t = Math.floor((st && st.time) || 0);
  const { pipWin = {} } = await browser.storage.local.get("pipWin");
  const host = fromTab ? await browser.windows.get(fromTab.windowId) : await browser.windows.getLastFocused();
  const width = pipWin.w || 480, height = pipWin.h || 300;
  const left = pipWin.x !== undefined ? pipWin.x : host.left + 16;
  const top = pipWin.y !== undefined ? pipWin.y : host.top + host.height - height - 16;
  const win = await browser.windows.create({
    url: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}&t=${t}s&windrad_mini=1`,
    type: "popup", width, height, left, top,
  });
  browser.windows.update(win.id, { left, top }).catch(() => {});
  media = { tabId: win.tabs[0].id, origin: origin.id, popupWindow: win.id, dismissed: false,
            lastTime: t, lastPaused: false };
  saveMedia();
  return null;
}
// window closed -> the YouTube tab continues where the window stopped
browser.windows.onRemoved.addListener(async (winId) => {
  await loadMedia();
  if (!media || media.popupWindow !== winId) return;
  const time = media.lastTime || 0, play = !media.lastPaused;
  media = { tabId: media.origin, dismissed: false };
  saveMedia();
  await mediaState({ seek: time, play }).catch(() => {});
  pushPlayer();
});
// focus moves between windows -> show / hide the mini player accordingly
browser.windows.onFocusChanged.addListener((id) => { if (id !== browser.windows.WINDOW_ID_NONE) pushPlayer(); });

function ytIdOf(url) {
  try {
    const u = new URL(url);
    if (!/(^|\.)youtube\.com$/.test(u.hostname)) return "";
    if (u.pathname === "/watch") return u.searchParams.get("v") || "";
    const m = u.pathname.match(/^\/(live|shorts)\/([\w-]{6,})/);
    return m ? m[2] : "";
  } catch { return ""; }
}

/* colors of the mini player: Flow colors, a palette, or adaptive from the cover */
const coverCache = new Map();
async function coverColor(url) {
  if (!url) return null;
  if (coverCache.has(url)) return coverCache.get(url);
  let result = null;
  try {
    const blob = await (await fetch(url)).blob();
    const bmp = await createImageBitmap(blob);
    const c = new OffscreenCanvas(24, 24);
    const ctx = c.getContext("2d");
    ctx.drawImage(bmp, 0, 0, 24, 24);
    const px = ctx.getImageData(0, 0, 24, 24).data;
    // the most colorful bright-enough pixel color wins (no greys)
    let best = null, bestScore = -1;
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b] = [px[i], px[i + 1], px[i + 2]];
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max ? (max - min) / max : 0, light = max / 255;
      const score = sat * 2 + (light > 0.35 ? light : 0);
      if (score > bestScore) { bestScore = score; best = [r, g, b]; }
    }
    if (best) {
      const hex = "#" + best.map((v) => v.toString(16).padStart(2, "0")).join("");
      result = flowMix(hex, "#ffffff", 0.15);
    }
  } catch {}
  coverCache.set(url, result);
  return result;
}
async function playerLook(art) {
  const mode = S.player.colors || "theme";
  if (mode !== "cover" && (FLOW_PALETTES[mode] || flowAllThemes()[mode])) {
    const P = flowPaletteFor(mode);
    return { c1: P.accent, c2: P.second, bg: P.panel, text: P.text };
  }
  if (mode === "cover") {
    const c = await coverColor(art);
    if (c) return { c1: c, c2: flowMix(c, "#ffffff", 0.45), bg: flowMix(c, "#0d1218", 0.82), text: "#f2eff6" };
  }
  return { c1: S.color1, c2: S.color2, bg: "#142636", text: "#eee7f6" };
}

// tell the page you're looking at whether to show the player
async function pushPlayer() {
  await whenSpacesReady();
  await loadMedia();
  const [active] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
  if (!active || !canDrawIn(active.url)) return;
  const show = S.modules.player && media && !media.dismissed && media.tabId !== active.id;
  const state = show ? await mediaState() : null;
  sendToPage(active.id, { type: "flow-player", state }).catch(() => {});
}

browser.tabs.onUpdated.addListener(async (id, info, tab) => {
  await whenSpacesReady();
  if (!S.modules.player) return;
  if (info.audible === true) {
    // the sound comes from our own video window on another page -> that is
    // still the same video, not a new source (else the window closes itself)
    await loadMedia();
    if (media && media.videoHost === id) return;
    if (media && media.tabId === id) { if (media.dismissed) { media.dismissed = false; saveMedia(); } pushPlayer(); return; }
    media = { tabId: id, dismissed: false }; saveMedia(); pushPlayer();
  }
  else if (info.audible === false || info.title) { await loadMedia(); if (media && id === media.tabId) pushPlayer(); }
});
browser.tabs.onActivated.addListener(async ({ tabId, previousTabId }) => {
  await whenSpacesReady();
  if (!S.modules.player) return;
  if (previousTabId) browser.tabs.sendMessage(previousTabId, { type: "flow-player", state: null }).catch(() => {});
  pushPlayer();
});
browser.tabs.onRemoved.addListener(async (id) => {
  await loadMedia();
  if (media && media.tabId === id) { media = null; saveMedia(); pushPlayer(); }
});

browser.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || !msg.type || !msg.type.startsWith("flow-player-")) return;
  return handlePlayerMsg(msg, sender);
});
async function handlePlayerMsg(msg, sender) {
  await whenSpacesReady();
  await loadMedia();
  // picture-in-picture is open -> back to the tab you came from
  if (msg.type === "flow-player-pipopen") {
    if (msg.returnTab) {
      const t = await browser.tabs.get(msg.returnTab).catch(() => null);
      if (t) { await browser.tabs.update(t.id, { active: true }); browser.windows.update(t.windowId, { focused: true }).catch(() => {}); }
    }
    return null;
  }
  // the small YouTube window reports its time + size (for the hand-back)
  if (msg.type === "flow-player-mini") {
    if (media && media.popupWindow && sender.tab && sender.tab.windowId === media.popupWindow) {
      media.lastTime = msg.time; media.lastPaused = msg.paused; saveMedia();
      if (msg.box) browser.storage.local.set({ pipWin: msg.box });
      if (msg.hidden) {
        // minimized: close the window -> the video goes back to its tab and
        // the mini player takes over again (behind another window: stays)
        const w = await browser.windows.get(media.popupWindow).catch(() => null);
        if (w && w.state === "minimized") browser.windows.remove(w.id).catch(() => {});
      }
    }
    return null;
  }
  if (!S.modules.player || !media) return null;
  const from = sender.tab && sender.tab.id;
  if (msg.type === "flow-player-hello") return from !== media.tabId && !media.dismissed ? mediaState() : null;
  if (msg.type === "flow-player-cmd") {
    const c = msg.cmd;
    // the video moves into the small window on this page: pause the original
    if (c === "videoOut") return openVideoWindow(sender.tab);
    // picture-in-picture: the browser only opens it after a click IN the
    // YouTube tab -> go there, show a big button, come back afterwards
    if (c === "pipPrompt") {
      const t = await browser.tabs.get(media.tabId);
      await browser.tabs.update(t.id, { active: true });
      await browser.windows.update(t.windowId, { focused: true });
      browser.tabs.sendMessage(t.id, { type: "flow-yt-pip-prompt", returnTab: sender.tab && sender.tab.id }, { frameId: 0 }).catch(() => {});
      return null;
    }
    // always-on-top window: pause the tab first (its time is the start), then
    // remember which page hosts the window
    if (c === "pipOut") {
      const st = await mediaState("pause");
      media.videoHost = sender.tab && sender.tab.id;
      saveMedia();
      return st;
    }
    if (media.videoHost && (c === "toggle" || c === "back" || c === "fwd" || typeof c === "number")) {
      await browser.tabs.sendMessage(media.videoHost, { type: "flow-pip-cmd", cmd: c }, { frameId: 0 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 150));
      return mediaState();
    }
    // …and back: continue in the original tab where the window stopped
    if (c && typeof c === "object" && "handBack" in c) {
      delete media.videoHost;
      saveMedia();
      await mediaState({ seek: c.handBack, play: !!c.play });
      if (c.activate) {
        const t = await browser.tabs.get(media.tabId);
        await browser.tabs.update(t.id, { active: true });
        await browser.windows.update(t.windowId, { focused: true });
      }
      return null;
    }
    if (c === "goto") {
      const t = await browser.tabs.get(media.tabId);
      await browser.tabs.update(t.id, { active: true });
      await browser.windows.update(t.windowId, { focused: true });
      return null;
    }
    if (c === "dismiss") { media.dismissed = true; saveMedia(); return null; }
    if (c === "mute") {
      const t = await browser.tabs.get(media.tabId);
      await browser.tabs.update(t.id, { muted: !(t.mutedInfo && t.mutedInfo.muted) });
      return mediaState();
    }
    return mediaState(typeof c === "number" ? Math.max(0, Math.min(1, c)) : c);
  }
}

whenSpacesReady();
