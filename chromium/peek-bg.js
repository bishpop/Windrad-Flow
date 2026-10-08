/* Windrad Peek inside Windrad Flow for Brave – its own scope */
(() => {
/* =====================================================================
   Windrad Peek – background
   While a preview is open in a tab, a temporary rule removes the
   headers that forbid embedding (X-Frame-Options, CSP frame-ancestors)
   – ONLY for frames in THAT tab. Closing the preview removes the rule,
   so normal browsing keeps its full protection.
   ===================================================================== */
"use strict";

const ruleId = (tabId) => 100000 + tabId;

async function allowFrames(tabId) {
  await browser.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [ruleId(tabId)],
    addRules: [{
      id: ruleId(tabId),
      priority: 1,
      action: {
        type: "modifyHeaders",
        responseHeaders: [
          { header: "x-frame-options", operation: "remove" },
          { header: "content-security-policy", operation: "remove" },
          { header: "content-security-policy-report-only", operation: "remove" },
        ],
      },
      condition: { tabIds: [tabId], resourceTypes: ["sub_frame"] },
    }],
  });
}
async function blockFramesAgain(tabId) {
  await browser.declarativeNetRequest.updateSessionRules({ removeRuleIds: [ruleId(tabId)] });
}

/* --- popup mode ---------------------------------------------------------
   A small real browser window, centered over the current one.
   Remembers which tab opened it, so "Open as tab" lands right next to it. */
const popups = new Map();   // popup window id -> { openerTabId, openerWindowId }

async function openPopup(url, tab) {
  const { peek: st0 = {} } = await browser.storage.local.get("peek");
  const st = { width: 82, height: 86, popupKind: "full", ...st0 };
  const w = await browser.windows.get(tab.windowId);
  const width = Math.round(w.width * st.width / 100);
  const height = Math.round(w.height * st.height / 100);
  const left = Math.round(w.left + (w.width - width) / 2);
  const top = Math.round(w.top + (w.height - height) / 2);
  const opts = { url, type: st.popupKind === "slim" ? "popup" : "normal", width, height, left, top };
  // same cookies as the tab you came from: same container, same private mode
  if (tab.incognito) opts.incognito = true;
  else if (tab.cookieStoreId && tab.cookieStoreId !== "firefox-default") opts.cookieStoreId = tab.cookieStoreId;
  const pw = await browser.windows.create(opts);
  popups.set(pw.id, { openerTabId: tab.id, openerWindowId: tab.windowId });
  // Firefox sometimes ignores the position on creation -> set it again
  browser.windows.update(pw.id, { left, top }).catch(() => {});
}

// back into the browser -> close the popup (if the option is on).
// Switching to another program (WINDOW_ID_NONE) keeps it open.
browser.windows.onFocusChanged.addListener(async (focused) => {
  if (!popups.size || focused === browser.windows.WINDOW_ID_NONE || popups.has(focused)) return;
  const { peek = {} } = await browser.storage.local.get("peek");
  const closeOnBlur = peek.closeOnBlur !== false;
  if (!closeOnBlur) return;
  for (const id of popups.keys()) browser.windows.remove(id).catch(() => {});
});
browser.windows.onRemoved.addListener((id) => popups.delete(id));

/* Chromium has no blocking webRequest in Manifest V3, so the "stay logged
   in" trick of the Firefox version isn't possible here. The popup mode
   always uses your normal login. */
const peek = new Map();   // tabs with an open preview

/* --- right-click menu ----------------------------------------------------- */
async function buildMenus() {
  await browser.menus.removeAll();
  const { modules = {} } = await browser.storage.local.get("modules");
  if (!modules.peek) return;                       // module off -> no menu entries
  browser.menus.create({ id: "peek-link", title: browser.i18n.getMessage("menuOpen"), contexts: ["link"] });
  browser.menus.create({ id: "peek-search", title: browser.i18n.getMessage("menuSearch"), contexts: ["selection"] });
}
browser.storage.onChanged.addListener((c) => { if (c.modules) buildMenus(); });
// build the menu every time the background starts (install, update, browser
// start, after Firefox unloaded the idle background) – always the same result
buildMenus();
browser.runtime.onInstalled.addListener(buildMenus);

browser.menus.onClicked.addListener((info, tab) => {
  if (!tab) return;
  if (info.menuItemId === "peek-link" && info.linkUrl)
    browser.tabs.sendMessage(tab.id, { type: "peek-open-url", url: info.linkUrl }, { frameId: 0 }).catch(() => {});
  if (info.menuItemId === "peek-search" && info.selectionText)
    browser.tabs.sendMessage(tab.id, { type: "peek-search", text: info.selectionText }, { frameId: 0 }).catch(() => {});
});

/* --- keyboard shortcut: search the selected text ------------------------- */
browser.commands.onCommand.addListener(async (cmd) => {
  if (cmd !== "peek-search") return;
  const { modules = {} } = await browser.storage.local.get("modules");
  if (!modules.peek) return;
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab) browser.tabs.sendMessage(tab.id, { type: "peek-search" }, { frameId: 0 }).catch(() => {});
});

browser.runtime.onMessage.addListener((msg, sender) => {
  if (!msg || typeof msg.type !== "string" || !msg.type.startsWith("peek-")) return;   // others are Flow's
  return handlePeekMsg(msg, sender);
});
async function handlePeekMsg(msg, sender) {
  const tab = sender.tab;
  if (!tab) return;
  switch (msg && msg.type) {
    case "peek-frame-url":
      // address inside the preview changed -> tell the main page of that tab
      browser.tabs.sendMessage(tab.id, msg, { frameId: 0 }).catch(() => {});
      return;
    case "peek-popup":
      await openPopup(msg.url, tab);
      return { ok: true };
    case "peek-am-i-popup":
      return { popup: popups.has(tab.windowId) };
    case "peek-popup-to-tab": {
      const info = popups.get(tab.windowId);
      let index;
      try { index = info ? (await browser.tabs.get(info.openerTabId)).index + 1 : undefined; } catch {}
      await browser.tabs.create({ url: msg.url, windowId: info?.openerWindowId, index, active: true });
      if (info) browser.windows.update(info.openerWindowId, { focused: true }).catch(() => {});
      browser.windows.remove(tab.windowId).catch(() => {});
      return { ok: true };
    }
    case "peek-popup-close":
      browser.windows.remove(tab.windowId).catch(() => {});
      return { ok: true };
    case "peek-open":
      peek.set(tab.id, { url: msg.url || "", storeId: tab.cookieStoreId, frames: new Set() });
      try { await allowFrames(tab.id); return { ok: true }; }
      catch (e) { return { ok: false, error: String(e) }; }
    case "peek-close":
      peek.delete(tab.id);
      try { await blockFramesAgain(tab.id); } catch {}
      return { ok: true };
    case "peek-newtab":
      peek.delete(tab.id);
      await blockFramesAgain(tab.id).catch(() => {});
      await browser.tabs.create({ url: msg.url, index: tab.index + 1, openerTabId: tab.id, active: true });
      return { ok: true };
  }
}

// Tab closed or reloaded while a preview was open -> clean up
browser.tabs.onRemoved.addListener((tabId) => { peek.delete(tabId); blockFramesAgain(tabId).catch(() => {}); });

})();
