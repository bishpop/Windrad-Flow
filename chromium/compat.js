/* =====================================================================
   Windrad Flow for Brave – small compatibility layer
   The code was written for Firefox ("browser.*" with promises). Chromium
   has "chrome.*": mostly the same, but message listeners must answer via
   sendResponse instead of returning a promise, and context menus have
   another name. This file evens that out – loaded first everywhere.
   ===================================================================== */
(() => {
  if (globalThis.__flowCompat) return;
  globalThis.__flowCompat = true;
  if (globalThis.browser && globalThis.browser.runtime && globalThis.browser.runtime.getBrowserInfo) return;   // real Firefox
  const api = globalThis.chrome;
  if (!api || !api.runtime) return;

  // onMessage: a listener may return a value or a promise -> becomes the answer
  const ev = api.runtime.onMessage;
  const add = ev.addListener.bind(ev);
  ev.addListener = (fn) => add((msg, sender, sendResponse) => {
    let r;
    try { r = fn(msg, sender); } catch (e) { console.warn("[Windrad Flow]", e); return false; }
    if (r && typeof r.then === "function") {
      r.then((v) => sendResponse(v), () => sendResponse(undefined));
      return true;                                   // keep the channel open for the async answer
    }
    if (r !== undefined) sendResponse(r);
    return false;
  });

  if (!api.menus && api.contextMenus) api.menus = api.contextMenus;
  globalThis.browser = api;
})();
