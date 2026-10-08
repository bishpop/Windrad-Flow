/* Windrad Start inside Windrad Flow – its own scope */
(() => {
/* =====================================================================
   Windrad Start – Hintergrund: Adresse per Tastenkürzel kopieren
   ===================================================================== */
"use strict";

// Tracking-Parameter, die beim "sauberen Kopieren" entfernt werden
const TRACKING = /^(utm_\w+|fbclid|gclid|gclsrc|dclid|msclkid|yclid|twclid|igshid|igsh|mc_cid|mc_eid|_hsenc|_hsmi|mkt_tok|ref_src|si)$/i;

function cleanUrl(raw) {
  try {
    const u = new URL(raw);
    for (const k of [...u.searchParams.keys()]) if (TRACKING.test(k)) u.searchParams.delete(k);
    return u.toString();
  } catch { return raw; }
}

// copyText() comes from Flow's background

browser.commands.onCommand.addListener(async (command) => {
  if (command !== "copy-url") return;

  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.url) return;

  const st = await browser.storage.local.get(["copyEnabled", "copyClean", "copyToast", "toastPos", "color1", "color2", "lang"]);
  if (st.copyEnabled === false) return;
  const url = st.copyClean === false ? tab.url : cleanUrl(tab.url);
  await copyText(url);

  if (st.copyToast === false) return;
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch {}

  const opts = {
    text: st.lang === "de" ? "Link kopiert" : "Link copied",
    sub: host,
    c1: st.color1 || "#ff7a95",
    c2: st.color2 || "#4fe3e0",
    position: st.toastPos || "top-right",
    duration: 1600,
  };

  // eigene Startseite: Nachricht schicken statt einspritzen
  if (tab.url.startsWith(browser.runtime.getURL(""))) {
    browser.runtime.sendMessage({ type: "toast", opts }).catch(() => {});
    return;
  }
  // normale Webseiten. Auf geschützten Seiten (about:, Add-on-Seite von
  // Mozilla) erlaubt Firefox das nicht – dann wird nur kopiert.
  try {
    await browser.scripting.executeScript({ target: { tabId: tab.id }, func: windradToast, args: [opts] });
  } catch {}
});

})();
