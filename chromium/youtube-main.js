/* =====================================================================
   Windrad Flow – YouTube helper in the page's own world (Chromium only)
   Calls YouTube's player functions for the YouTube module (volume and
   quality) and hands the result back through an attribute.
   ===================================================================== */
(() => {
  const ALLOWED = new Set(["getVolume", "setVolume", "isMuted", "unMute", "getAvailableQualityLevels",
                           "setPlaybackQualityRange", "setPlaybackQuality"]);
  window.addEventListener("windrad-yt-call", (e) => {
    let res = null;
    try {
      const { method, args } = JSON.parse(e.detail);
      const p = document.getElementById("movie_player");
      if (p && ALLOWED.has(method) && typeof p[method] === "function") res = p[method](...(args || []));
    } catch {}
    document.documentElement.setAttribute("data-windrad-yt-result", JSON.stringify(res === undefined ? null : res));
  });
})();
