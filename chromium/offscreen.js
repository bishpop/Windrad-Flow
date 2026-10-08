/* Windrad Flow for Brave – invisible helper page that writes to the clipboard
   (Chromium's service worker can't do that itself) */
browser.runtime.onMessage.addListener((m) => {
  if (!m || m.type !== "flow-offscreen-copy") return;
  const t = document.getElementById("t");
  t.value = m.text;
  t.select();
  return document.execCommand("copy");
});
