/* =====================================================================
   Windrad Flow – YouTube module
   Hides what you don't want (Shorts, comments, …) and gives YouTube your
   colors – optionally with the gradient of your theme as background.
   Runs early, so nothing flashes before it's hidden.
   ===================================================================== */
(() => {
  "use strict";
  // the live chat is its own little page inside a frame: it only gets the colors
  const CHAT = /^\/live_chat/.test(location.pathname);
  // embedded player (e.g. Flow's picture-in-picture window): volume wheel + quality
  const EMBED = /^\/embed\//.test(location.pathname);
  if ((window.top !== window && !CHAT && !EMBED) || window.__windradFlowYT) return;
  window.__windradFlowYT = true;

  /* ======================================================================
     Mini window (opened by the Flow player's ▣ button): show only the
     video, filling the whole window, and report time + size to Flow.
     ====================================================================== */
  const MINI = !CHAT && (new URLSearchParams(location.search).has("windrad_mini") || sessionStorage.getItem("windradMini") === "1");
  if (MINI) {
    sessionStorage.setItem("windradMini", "1");               // stays when YouTube moves on to the next video
    const ms = document.createElement("style");
    ms.id = "windrad-flow-mini";
    ms.textContent = `
      html, body { overflow: hidden !important; background: #000 !important; }
      #masthead-container, ytd-masthead, tp-yt-app-drawer, ytd-mini-guide-renderer, #guide,
      #secondary, #below, ytd-watch-metadata, #comments, #related, ytd-merch-shelf-renderer,
      ytd-popup-container > :not(tp-yt-iron-dropdown):not(ytd-menu-popup-renderer) { display: none !important; }
      ytd-app { --ytd-masthead-height: 0px !important; }
      #page-manager { margin-top: 0 !important; }
      ytd-watch-flexy, ytd-watch-flexy #columns, ytd-watch-flexy #primary, ytd-watch-flexy #primary-inner {
        margin: 0 !important; padding: 0 !important; max-width: none !important; min-width: 0 !important; }
      ytd-watch-flexy #full-bleed-container, ytd-watch-flexy #player-full-bleed-container,
      ytd-watch-flexy #player, ytd-watch-flexy #player-container-outer, ytd-watch-flexy #player-container-inner,
      ytd-watch-flexy #player-container, ytd-watch-flexy #ytd-player, ytd-watch-flexy #container.ytd-player,
      #movie_player, #movie_player .html5-video-container {
        position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
        max-width: none !important; max-height: none !important; min-height: 0 !important; padding: 0 !important; margin: 0 !important; }
      #player-container-inner { padding-top: 0 !important; }
      #movie_player video.html5-main-video {
        width: 100vw !important; height: 100vh !important; left: 0 !important; top: 0 !important; object-fit: contain !important; }
      #movie_player .ytp-chrome-bottom { width: calc(100vw - 24px) !important; left: 12px !important; }`;
    (document.head || document.documentElement).append(ms);
    document.addEventListener("DOMContentLoaded", () => { if (!ms.isConnected) document.head.append(ms); });
    // YouTube computes the player size itself – nudge it after layout changes
    const nudge = () => window.dispatchEvent(new Event("resize"));
    window.addEventListener("load", () => { nudge(); setTimeout(nudge, 800); });
    window.addEventListener("yt-navigate-finish", () => setTimeout(nudge, 300));
    // minimized -> back into the mini player (Flow checks it's really minimized,
    // not just hidden behind another window)
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "hidden") return;
      const v = document.querySelector("video.html5-main-video") || document.querySelector("video");
      browser.runtime.sendMessage({ type: "flow-player-mini", hidden: true,
        time: v ? v.currentTime : 0, paused: v ? v.paused : true }).catch(() => {});
    });
    setInterval(() => {
      const v = document.querySelector("video.html5-main-video") || document.querySelector("video");
      if (!v) return;
      browser.runtime.sendMessage({
        type: "flow-player-mini", time: v.currentTime, paused: v.paused,
        box: { x: window.screenX, y: window.screenY, w: window.outerWidth, h: window.outerHeight },
      }).catch(() => {});
    }, 1000);
  }

  let Y = null, on = false;
  const style = document.createElement("style");
  style.id = "windrad-flow-youtube";

  const HIDE = {
    shorts: `
      ytd-reel-shelf-renderer, ytd-rich-shelf-renderer[is-shorts],
      ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
      ytd-rich-section-renderer:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2),
      grid-shelf-view-model:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2),
      ytd-rich-item-renderer:has(ytm-shorts-lockup-view-model, ytm-shorts-lockup-view-model-v2, a[href^="/shorts/"]),
      ytd-video-renderer:has(a[href^="/shorts/"]), ytd-grid-video-renderer:has(a[href^="/shorts/"]),
      ytd-compact-video-renderer:has(a[href^="/shorts/"]),
      ytd-guide-entry-renderer:has(a[title="Shorts"]), ytd-mini-guide-entry-renderer[aria-label="Shorts"],
      ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
      yt-tab-shape[tab-title="Shorts"], tp-yt-paper-tab:has(> div[title="Shorts"]),
      yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"])`,
    comments: `ytd-comments#comments, #comments`,
    related: `ytd-watch-flexy #secondary #related, ytd-watch-next-secondary-results-renderer`,
    home: `ytd-browse[page-subtype="home"] ytd-rich-grid-renderer`,
    chips: `ytd-feed-filter-chip-bar-renderer, #chips-wrapper, yt-related-chip-cloud-renderer`,
    endcards: `.ytp-ce-element, .ytp-endscreen-content, .ytp-cards-teaser, .ytp-cards-button, .iv-branding`,
    merch: `ytd-merch-shelf-renderer, ytd-ticket-shelf-renderer, ytd-product-list-renderer`,
    chat: `ytd-live-chat-frame#chat, #chat-container`,
  };

  // colors for the live chat frame (it has its own variables)
  function chatCss() {
    if (!Y.colors) return "";
    const c = Y.preset === "custom" ? Y.custom : flowYtColors(Y.preset);
    const a = (hex, pct) => `color-mix(in srgb, ${hex} ${pct}%, transparent)`;
    const bg = Y.gradient || Y.glass ? a(c.bg, 72) : c.bg;
    return `
      html, html[dark], yt-live-chat-app, yt-live-chat-renderer {
        --yt-live-chat-background-color: ${bg} !important;
        --yt-live-chat-header-background-color: ${a(c.bg2, 85)} !important;
        --yt-live-chat-action-panel-background-color: ${a(c.bg2, 85)} !important;
        --yt-live-chat-vem-background-color: ${a(c.bg2, 85)} !important;
        --yt-live-chat-primary-text-color: ${c.text} !important;
        --yt-live-chat-secondary-text-color: ${c.text2} !important;
        --yt-live-chat-tertiary-text-color: ${c.text2} !important;
        --yt-live-chat-text-input-field-inactive-underline-color: ${a(c.text, 25)} !important;
        --yt-live-chat-text-input-field-active-underline-color: ${c.accent} !important;
        --yt-spec-base-background: ${bg} !important;
        --yt-spec-raised-background: ${a(c.bg2, 85)} !important;
        --yt-spec-menu-background: ${c.bg2} !important;
        --yt-spec-text-primary: ${c.text} !important;
        --yt-spec-text-secondary: ${c.text2} !important;
        --yt-spec-10-percent-layer: ${a(c.hover, 60)} !important;
        --yt-spec-call-to-action: ${c.accent} !important;
      }
      html, body { background: ${bg} !important; }
      * { scrollbar-color: ${a(c.accent, 70)} transparent; }`;
  }

  function buildCss() {
    if (CHAT) return chatCss();
    if (EMBED) return "";
    const out = [];
    const sels = Object.keys(HIDE).filter((k) => Y.hide[k]).map((k) => HIDE[k]);
    if (sels.length) out.push(`${sels.join(",\n")} { display: none !important; }`);
    if (Y.colors) {
      const c = Y.preset === "custom" ? Y.custom : flowYtColors(Y.preset);
      const P = Y.preset === "custom" ? null : flowPaletteFor(Y.preset);
      const a = (hex, pct) => `color-mix(in srgb, ${hex} ${pct}%, transparent)`;
      out.push(`
        html, html[dark], html:not([dark]) {
          --yt-spec-base-background: ${Y.gradient ? "transparent" : c.bg} !important;
          --yt-spec-raised-background: ${Y.glass ? a(c.bg2, 78) : c.bg2} !important;
          --yt-spec-menu-background: ${Y.glass ? a(c.bg2, 88) : c.bg2} !important;
          --yt-spec-general-background-a: ${Y.gradient ? "transparent" : c.bg} !important;
          --yt-spec-general-background-b: ${c.bg} !important;
          --yt-spec-general-background-c: ${c.bg2} !important;
          --yt-spec-brand-background-solid: ${c.bg} !important;
          --yt-spec-brand-background-primary: ${a(c.bg, 92)} !important;
          --yt-spec-brand-background-secondary: ${a(c.bg2, 92)} !important;
          --yt-spec-10-percent-layer: ${a(c.hover, 60)} !important;
          --yt-spec-additive-background: ${a(c.hover, 70)} !important;
          --yt-spec-badge-chip-background: ${a(c.hover, 80)} !important;
          --yt-spec-button-chip-background-hover: ${c.hover} !important;
          --yt-spec-touch-response: ${a(c.accent, 25)} !important;
          --yt-spec-outline: ${a(c.text, 12)} !important;
          --yt-spec-text-primary: ${c.text} !important;
          --yt-spec-text-primary-inverse: ${c.bg} !important;
          --yt-spec-text-secondary: ${c.text2} !important;
          --yt-spec-text-disabled: ${a(c.text2, 60)} !important;
          --yt-spec-icon-active-other: ${c.text} !important;
          --yt-spec-icon-inactive: ${c.text2} !important;
          --yt-spec-call-to-action: ${c.accent} !important;
          --yt-spec-static-brand-red: ${c.accent} !important;
          --yt-spec-brand-button-background: ${c.accent} !important;
          --yt-spec-themed-blue: ${c.accent} !important;
          --yt-spec-suggested-action: ${a(c.accent, 18)} !important;
          --yt-spec-shadow: ${c.shadow} !important;
          --yt-spec-inverted-background: ${c.text} !important;
          color-scheme: dark;
        }
        html { background-color: ${c.bg} !important; }
        body, ytd-app { background: transparent !important; }
        /* player: progress bar, scrubber, volume in the main color */
        .ytp-play-progress, .ytp-swatch-background-color, .ytp-volume-slider-handle,
        .ytp-volume-slider-handle::before, .ytp-settings-button.ytp-hd-quality-badge::after,
        .ytProgressBarLineProgressBarPlayed, .YtProgressBarLineProgressBarPlayed { background: ${c.accent} !important; }
        .ytp-scrubber-button.ytp-swatch-background-color { background: ${c.accent} !important; box-shadow: 0 0 8px ${c.accent} !important; }
        .ytProgressBarPlayheadProgressBarPlayheadDot { background: ${c.accent} !important; }
        /* subscribe button */
        .yt-spec-button-shape-next--mono.yt-spec-button-shape-next--filled {
          background: ${c.accent} !important; color: ${c.bg} !important; }
        /* menus, popups and their shadow */
        tp-yt-iron-dropdown, ytd-popup-container tp-yt-paper-dialog {
          box-shadow: 0 16px 40px ${c.shadow} !important; border-radius: 14px !important; }
        /* search bar (old and new YouTube search box) + suggestions */
        ytd-searchbox, yt-searchbox {
          --ytd-searchbox-background: ${a(c.bg2, 70)} !important;
          --ytd-searchbox-text-color: ${c.text} !important;
          --ytd-searchbox-legacy-border-color: ${a(c.text, 14)} !important;
          --ytd-searchbox-legacy-border-shadow-color: transparent !important;
          --ytd-searchbox-legacy-button-color: ${a(c.hover, 80)} !important;
          --ytd-searchbox-legacy-button-border-color: ${a(c.text, 14)} !important;
          --ytd-searchbox-legacy-button-focus-color: ${a(c.hover, 95)} !important;
          --ytd-searchbox-legacy-button-hover-color: ${a(c.hover, 95)} !important;
          --ytd-searchbox-legacy-button-hover-border-color: ${a(c.accent, 40)} !important;
        }
        ytd-searchbox #container.ytd-searchbox, .ytSearchboxComponentInputBox {
          background: ${a(c.bg2, 70)} !important; border-color: ${a(c.text, 14)} !important; color: ${c.text} !important;
          ${Y.glass ? "backdrop-filter: blur(12px);" : ""} transition: border-color 150ms ease, box-shadow 150ms ease; }
        ytd-searchbox[has-focus] #container.ytd-searchbox, .ytSearchboxComponentInputBoxHasFocus {
          border-color: ${c.accent} !important; box-shadow: 0 0 0 1px ${a(c.accent, 50)}, 0 0 14px ${a(c.accent, 25)} !important; }
        ytd-searchbox input, .ytSearchboxComponentInput { color: ${c.text} !important; background: transparent !important; }
        ytd-searchbox input::placeholder, .ytSearchboxComponentInput::placeholder { color: ${c.text2} !important; }
        #search-icon-legacy.ytd-searchbox, .ytSearchboxComponentSearchButton {
          background: ${a(c.hover, 80)} !important; border-color: ${a(c.text, 14)} !important; color: ${c.text} !important; }
        #search-icon-legacy.ytd-searchbox:hover, .ytSearchboxComponentSearchButton:hover { background: ${a(c.accent, 30)} !important; }
        #voice-search-button button, #voice-search-button .yt-spec-button-shape-next {
          background: ${a(c.hover, 80)} !important; color: ${c.text} !important; }
        /* suggestions under the search bar */
        .sbdd_b, .ytSearchboxComponentSuggestionsContainer, .gstl_50.sbdd_a .sbdd_b {
          background: ${a(c.bg2, 92)} !important; ${Y.glass ? "backdrop-filter: blur(18px);" : ""}
          border: 1px solid ${a(c.accent, 25)} !important; border-radius: 14px !important; box-shadow: 0 16px 40px ${c.shadow} !important; }
        .sbsb_c, .ytSuggestionComponentSuggestion { color: ${c.text} !important; }
        .sbsb_d, .ytSuggestionComponentHighlighted, .ytSuggestionComponentSuggestion:hover { background: ${a(c.hover, 80)} !important; }
        .sbpqs_a, .sbqs_c, .ytSuggestionComponentText { color: ${c.text} !important; }
        ::selection { background: ${a(c.accent, 40)}; }
        * { scrollbar-color: ${a(c.accent, 70)} transparent; }`);
      if (Y.gradient) {
        // the page background takes the gradient of your theme
        const stops = P ? P.stops : [c.bg, flowMix(c.bg, c.bg2, 0.5), c.bg2, flowMix(c.bg2, c.accent, 0.08)];
        out.push(`
          html { background: radial-gradient(ellipse 45% 60% at 95% 0%, ${a(c.accent, 7)}, transparent 70%),
                             linear-gradient(120deg, ${stops[0]} 0%, ${stops[1]} 40%, ${stops[2]} 70%, ${stops[3]} 100%) fixed,
                             ${c.bg} !important; }`);
      }
      if (Y.glass) {
        out.push(`
          #masthead-container #background, ytd-masthead #background, #frosted-glass {
            background: ${a(c.bg, 55)} !important; backdrop-filter: blur(18px) saturate(1.3) !important; }
          tp-yt-app-drawer #contentContainer, ytd-mini-guide-renderer {
            background: ${a(c.bg, 45)} !important; backdrop-filter: blur(18px) !important; }
          ytd-menu-popup-renderer, ytd-multi-page-menu-renderer, yt-sheet-view-model, ytd-unified-share-panel-renderer {
            background: ${a(c.bg2, 82)} !important; backdrop-filter: blur(20px) saturate(1.3) !important;
            border: 1px solid ${a(c.accent, 25)} !important; border-radius: 14px !important; }`);
      }
    }
    return out.join("\n");
  }

  function apply() {
    const css = on && Y ? buildCss() : "";
    style.textContent = css;
    if (css && !style.isConnected) (document.head || document.documentElement).append(style);
    if (!css) style.remove();
    // tell the dark mode of Boosts that YouTube is already dark (no inverting)
    if (on && Y && Y.colors) document.documentElement.dataset.windradDark = "1";
    else delete document.documentElement.dataset.windradDark;
    if (!CHAT && !EMBED) { redirectShorts(); scheduleTheater(); }
  }
  async function load() {
    const { modules = {}, yt = {}, theme, customThemes } = await browser.storage.local.get(["modules", "yt", "theme", "customThemes"]);
    flowSetThemes(theme, customThemes);
    on = !!modules.youtube;
    Y = { ...FLOW_YT_DEFAULTS, ...yt, hide: { ...FLOW_YT_DEFAULTS.hide, ...(yt.hide || {}) },
          custom: { ...FLOW_YT_DEFAULTS.custom, ...(yt.custom || {}) } };
    apply();
    if (volHost) { volHost.remove(); volHost = null; volUi = null; }   // new colors for the volume pill
  }

  /* chat hidden on a live stream -> theater mode, so no empty space next to
     the video. Only once per video – switch back yourself if you like. */
  let theaterDoneFor = "", theaterTimer = null;
  function scheduleTheater() {
    clearInterval(theaterTimer);
    if (!on || !Y || !Y.hide.chat || !Y.hide.chatTheater) return;
    let tries = 0;
    theaterTimer = setInterval(() => {
      const id = new URLSearchParams(location.search).get("v") || "";
      const flexy = document.querySelector("ytd-watch-flexy");
      const live = document.querySelector("ytd-live-chat-frame, #chat-container ytd-live-chat-frame") || (flexy && flexy.hasAttribute("live-chat-present"));
      if (++tries > 25 || !id || id === theaterDoneFor) { clearInterval(theaterTimer); return; }
      if (!flexy || !live) return;                      // not (yet) a live stream
      theaterDoneFor = id;
      clearInterval(theaterTimer);
      if (!flexy.hasAttribute("theater")) document.querySelector(".ytp-size-button")?.click();
    }, 600);
  }
  window.addEventListener("yt-navigate-finish", () => { if (!CHAT) scheduleTheater(); });

  // /shorts/ID -> /watch?v=ID (also when YouTube navigates without reloading)
  function redirectShorts() {
    if (!on || !Y || !Y.hide.shorts || !Y.hide.redirect) return;
    const m = location.pathname.match(/^\/shorts\/([\w-]{6,})/);
    if (m) location.replace(`/watch?v=${m[1]}`);
  }
  window.addEventListener("yt-navigate-start", redirectShorts);
  window.addEventListener("yt-navigate-finish", redirectShorts);
  document.addEventListener("DOMContentLoaded", () => { if (style.textContent && !style.isConnected) (document.head || document.documentElement).append(style); });

  /* ======================================================================
     Volume: hold the RIGHT mouse button and turn the wheel
     0 – 100 % moves YouTube's own volume (its slider follows), above that
     the Flow volume control boosts further (if that module is on).
     ====================================================================== */
  // YouTube's player functions live in the page's own JavaScript world.
  // Firefox: reach them directly (wrappedJSObject). Chromium: ask a tiny
  // helper that runs in the page world (youtube-main.js) via events.
  const BRIDGE_METHODS = ["getVolume", "setVolume", "isMuted", "unMute", "getAvailableQualityLevels",
                          "setPlaybackQualityRange", "setPlaybackQuality"];
  function bridgeCall(method, args) {
    window.dispatchEvent(new CustomEvent("windrad-yt-call", { detail: JSON.stringify({ method, args }) }));
    const raw = document.documentElement.getAttribute("data-windrad-yt-result");
    document.documentElement.removeAttribute("data-windrad-yt-result");
    try { return raw === null ? undefined : JSON.parse(raw); } catch { return undefined; }
  }
  const player = () => {
    const p = document.getElementById("movie_player");
    if (!p) return null;
    if (p.wrappedJSObject) return p.wrappedJSObject;
    if (typeof p.getVolume === "function") return p;
    const proxy = {};
    for (const m of BRIDGE_METHODS) proxy[m] = (...args) => bridgeCall(m, args);
    return proxy;
  };
  let rightDown = false, wheelUsed = false;
  window.addEventListener("mousedown", (e) => { if (e.button === 2) { rightDown = true; wheelUsed = false; } }, true);
  window.addEventListener("mouseup", (e) => { if (e.button === 2) setTimeout(() => { rightDown = false; }, 0); }, true);
  window.addEventListener("blur", () => { rightDown = false; });
  // used for volume -> no context menu (YouTube's or Firefox's)
  window.addEventListener("contextmenu", (e) => {
    if (wheelUsed) { e.preventDefault(); e.stopImmediatePropagation(); wheelUsed = false; }
  }, true);
  window.addEventListener("wheel", (e) => {
    if (CHAT || !rightDown || !on || !Y || !Y.wheel) return;
    e.preventDefault(); e.stopImmediatePropagation();
    wheelUsed = true;
    changeVolume(e.deltaY < 0 ? Y.step : -Y.step);
  }, { capture: true, passive: false });

  function changeVolume(delta) {
    const p = player();
    const boost = window.__flowVolume && window.__flowVolume.enabled() ? window.__flowVolume : null;
    const video = document.querySelector("video");
    let base = 100;
    try { base = p && p.getVolume ? p.getVolume() : Math.round((video ? video.volume : 1) * 100); } catch {}
    const extra = boost && base >= 100 ? boost.get() : 100;
    const total = Math.max(0, Math.min(boost ? 400 : 100, (base < 100 ? base : extra) + delta));
    try {
      if (p && p.setVolume) {
        if (p.isMuted && p.isMuted() && total > 0) p.unMute();
        p.setVolume(Math.min(100, total));
      } else if (video) { video.muted = false; video.volume = Math.min(1, total / 100); }
    } catch {}
    if (boost) boost.set(total > 100 ? total : 100);
    showVolume(total);
  }

  // glass pill in the middle of the player
  let volHost = null, volTimer = null, volUi = null;
  function showVolume(v) {
    if (!volHost) {
      volHost = document.createElement("windrad-flow-ytvol");
      const root = volHost.attachShadow({ mode: "closed" });
      const st = document.createElement("style");
      const c = (Y.colors ? (Y.preset === "custom" ? Y.custom : flowYtColors(Y.preset)).accent : null) || "#ff7a95";
      st.textContent = `
        :host { all: initial; }
        .v { position: fixed; z-index: 2147483647; left: 50%; top: 50%; translate: -50% -50%; pointer-events: none;
          display: flex; align-items: center; gap: 12px; padding: 12px 18px; border-radius: 16px; min-width: 200px;
          font: 600 15px "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; color: #eee7f6;
          background: rgba(20, 38, 54, 0.8); backdrop-filter: blur(16px) saturate(1.3);
          border: 1px solid color-mix(in srgb, ${c} 45%, rgba(255, 255, 255, 0.14));
          box-shadow: 0 14px 36px rgba(0, 0, 0, 0.4); transition: opacity 250ms ease, transform 250ms ease; }
        .v.hide { opacity: 0; transform: scale(.96); }
        .bar { flex: 1; height: 6px; border-radius: 6px; background: rgba(255, 255, 255, 0.14); overflow: hidden; position: relative; }
        .bar i { position: absolute; inset: 0 auto 0 0; border-radius: 6px; background: ${c}; transition: width 120ms ease; }
        .bar i.over { background: linear-gradient(90deg, ${c}, #ffb347); }
        .n { min-width: 48px; text-align: right; font-variant-numeric: tabular-nums; }
        svg { width: 20px; height: 20px; }`;
      const box = document.createElement("div"); box.className = "v hide";
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", "0 0 24 24");
      const path = document.createElementNS(ns, "path"); path.setAttribute("fill", "currentColor"); svg.append(path);
      const bar = document.createElement("div"); bar.className = "bar";
      const fill = document.createElement("i"); bar.append(fill);
      const n = document.createElement("span"); n.className = "n";
      box.append(svg, bar, n);
      root.append(st, box);
      document.documentElement.append(volHost);
      volUi = { box, path, fill, n };
      requestAnimationFrame(() => box.classList.remove("hide"));
    }
    const max = window.__flowVolume && window.__flowVolume.enabled() ? 400 : 100;
    volUi.box.classList.remove("hide");
    volUi.path.setAttribute("d", v === 0
      ? "M3 9v6h4l5 5V4L7 9zm13.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z"
      : "M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4M14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6");
    volUi.fill.style.width = `${(v / max) * 100}%`;
    volUi.fill.classList.toggle("over", v > 100);
    volUi.n.textContent = `${v} %`;
    clearTimeout(volTimer);
    volTimer = setTimeout(() => volUi && volUi.box.classList.add("hide"), 900);
  }

  /* ======================================================================
     Quality: always play in the chosen resolution – or the highest one
     the video has below it (4K wanted, video has 1080p -> 1080p)
     ====================================================================== */
  const Q = { 4320: "highres", 2160: "hd2160", 1440: "hd1440", 1080: "hd1080", 720: "hd720", 480: "large", 360: "medium" };
  const ORDER = ["highres", "hd2880", "hd2160", "hd1440", "hd1080", "hd720", "large", "medium", "small", "tiny"];
  function setQuality() {
    if (CHAT || !on || !Y || !Y.quality || Y.quality === "auto") return true;
    const p = player();
    if (!p || !p.getAvailableQualityLevels) return false;
    let levels = [];
    try { levels = Array.from(p.getAvailableQualityLevels()).filter((l) => l !== "auto"); } catch {}
    if (!levels.length) return false;
    const want = ORDER.indexOf(Q[Y.quality]);
    const pick = levels.find((l) => ORDER.indexOf(l) >= want) || levels[levels.length - 1];
    try {
      p.setPlaybackQualityRange(pick, pick);
      if (p.setPlaybackQuality) p.setPlaybackQuality(pick);
    } catch { return false; }
    return true;
  }
  /* ---- start volume: every new video opens with the chosen volume ---- */
  let startVolDoneFor = "", startVolTimer = null;
  function scheduleStartVolume() {
    clearInterval(startVolTimer);
    if (CHAT || EMBED || !on || !Y || !Y.startVolume) return;
    let tries = 0;
    startVolTimer = setInterval(() => {
      const id = new URLSearchParams(location.search).get("v") || location.pathname;
      if (++tries > 20 || id === startVolDoneFor) { clearInterval(startVolTimer); return; }
      const p = player();
      if (!p || !p.setVolume || !document.querySelector("video")) return;
      try {
        const v = Math.max(0, Math.min(100, Math.round(Y.startVolumeValue)));
        if (v > 0 && p.isMuted && p.isMuted()) p.unMute();
        p.setVolume(v);
        startVolDoneFor = id;
        clearInterval(startVolTimer);
      } catch {}
    }, 500);
  }
  window.addEventListener("yt-navigate-finish", scheduleStartVolume);
  document.addEventListener("loadeddata", (e) => { if (e.target instanceof HTMLVideoElement) scheduleStartVolume(); }, true);

  let qTimer = null;
  function scheduleQuality() {
    clearInterval(qTimer);
    let tries = 0;
    qTimer = setInterval(() => { if (setQuality() || ++tries > 20) clearInterval(qTimer); }, 700);
  }
  window.addEventListener("yt-navigate-finish", scheduleQuality);
  window.addEventListener("load", scheduleQuality);
  document.addEventListener("loadeddata", (e) => { if (e.target instanceof HTMLVideoElement) scheduleQuality(); }, true);

  /* ======================================================================
     Picture-in-picture (always on top, Firefox 151+): the REAL YouTube
     video element moves into the window – logged in, uBlock, everything –
     and comes back into the page when the window closes.
     ====================================================================== */
  const MAIN = !CHAT && !EMBED && !MINI;
  let pipWin = null, pipSize = null;
  browser.storage.local.get("pipSize").then((r) => { pipSize = r.pipSize || null; }).catch(() => {});

  async function enterPip(returnTab) {
    const api = window.documentPictureInPicture;
    if (!MAIN || !api || !api.requestWindow) return false;
    if (pipWin) { pipWin.focus(); return true; }
    const v = document.querySelector("#movie_player video.html5-main-video") || document.querySelector("video");
    if (!v) return false;
    let win;
    try { win = await api.requestWindow({ width: (pipSize && pipSize.w) || 480, height: (pipSize && pipSize.h) || 270 }); }
    catch { return false; }
    const parent = v.parentNode, next = v.nextSibling, wasPlaying = !v.paused;
    const old = { style: v.getAttribute("style"), controls: v.controls };
    const d = win.document;
    const st = d.createElement("style");
    st.textContent = `html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
      video { position: fixed; inset: 0; width: 100% !important; height: 100% !important; object-fit: contain; background: #000; }`;
    d.head.append(st);
    d.title = document.title.replace(/ - YouTube$/, "");
    v.removeAttribute("style");
    v.controls = true;                                      // Firefox's own controls inside the window
    d.body.append(v);
    window.__windradPipVideo = v;                           // Flow's mini player still finds it
    if (wasPlaying) v.play().catch(() => {});
    pipWin = win;
    win.addEventListener("pagehide", () => {
      const playing = !v.paused;
      browser.storage.local.set({ pipSize: { w: win.innerWidth, h: win.innerHeight } }).catch(() => {});
      v.controls = old.controls;
      if (old.style !== null) v.setAttribute("style", old.style);
      if (next && next.parentNode === parent) parent.insertBefore(v, next); else parent.append(v);
      window.__windradPipVideo = null;
      pipWin = null;
      if (playing) v.play().catch(() => {});
      window.dispatchEvent(new Event("resize"));            // let YouTube size the player again
    });
    browser.runtime.sendMessage({ type: "flow-player-pipopen", returnTab }).catch(() => {});
    return true;
  }

  // big button in the YouTube tab when ▣ was clicked in the mini player
  // (the browser opens picture-in-picture only after a click in this tab)
  function pipPrompt(returnTab) {
    document.querySelector("windrad-flow-pip-prompt")?.remove();
    const h = document.createElement("windrad-flow-pip-prompt");
    const root = h.attachShadow({ mode: "closed" });
    const c = Y && Y.colors ? (Y.preset === "custom" ? Y.custom : flowYtColors(Y.preset)).accent : "#ff7a95";
    const st = document.createElement("style");
    st.textContent = `
      :host { all: initial; }
      .w { position: fixed; inset: 0; z-index: 2147483647; display: grid; place-items: center; background: rgba(6, 10, 18, .45);
           backdrop-filter: blur(4px); animation: f 220ms ease both; font: 600 15px "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif; }
      button { all: unset; cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 16px 26px; border-radius: 18px;
               color: #eee7f6; background: rgba(20, 38, 54, .88); border: 1px solid ${c};
               box-shadow: 0 0 0 1px color-mix(in srgb, ${c} 40%, transparent), 0 20px 50px rgba(0,0,0,.5), 0 0 30px color-mix(in srgb, ${c} 30%, transparent);
               animation: p 360ms cubic-bezier(.16, 1, .3, 1) both; transition: transform 120ms ease; }
      button:hover { transform: scale(1.03); } button:active { transform: scale(.97); }
      svg { width: 22px; height: 22px; color: ${c}; }
      small { display: block; margin-top: 10px; text-align: center; color: rgba(238, 231, 246, .6); font-weight: 400; font-size: 12px; }
      @keyframes f { from { opacity: 0; } } @keyframes p { from { opacity: 0; transform: scale(.92); } }`;
    const de = (Y && Y.lang) || document.documentElement.lang;
    const b = document.createElement("button");
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", "0 0 24 24");
    const pth = document.createElementNS(ns, "path"); pth.setAttribute("fill", "currentColor");
    pth.setAttribute("d", "M3 5h18v14H3zm2 2v10h14V7zm7 2h5v4h-5z"); svg.append(pth);
    const label = document.createElement("span");
    label.textContent = /^de/.test(navigator.language) ? "Bild-im-Bild starten" : "Start picture-in-picture";
    b.append(svg, label);
    const hint = document.createElement("small");
    hint.textContent = /^de/.test(navigator.language) ? "Esc oder Klick daneben: abbrechen" : "Esc or click outside: cancel";
    const box = document.createElement("div"); box.append(b, hint);
    const w = document.createElement("div"); w.className = "w"; w.append(box);
    root.append(st, w);
    document.documentElement.append(h);
    const close = () => { h.remove(); window.removeEventListener("keydown", esc, true); };
    const esc = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", esc, true);
    w.addEventListener("click", (e) => { if (e.target === w) close(); });
    b.addEventListener("click", async () => { close(); await enterPip(returnTab); });
    b.focus();
  }

  // small button in YouTube's own player bar (next to settings)
  function addPipButton() {
    if (!MAIN || !window.documentPictureInPicture) return;
    const bar = document.querySelector("#movie_player .ytp-right-controls");
    if (!bar || bar.querySelector(".windrad-pip-btn")) return;
    const b = document.createElement("button");
    b.className = "ytp-button windrad-pip-btn";
    b.title = /^de/.test(navigator.language) ? "Bild-im-Bild (Windrad Flow)" : "Picture-in-picture (Windrad Flow)";
    b.setAttribute("aria-label", b.title);
    b.style.cssText = "display:inline-flex;align-items:center;justify-content:center;";
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "60%"); svg.setAttribute("height", "60%");
    const pth = document.createElementNS(ns, "path"); pth.setAttribute("fill", "#fff");
    pth.setAttribute("d", "M3 5h18v14H3zm2 2v10h14V7zm7 2h5v4h-5z"); svg.append(pth);
    b.append(svg);
    b.addEventListener("click", (e) => { e.stopPropagation(); enterPip(null); });
    bar.prepend(b);
  }
  if (MAIN) {
    window.addEventListener("yt-navigate-finish", () => setTimeout(addPipButton, 500));
    setInterval(addPipButton, 2000);
    browser.runtime.onMessage.addListener((m) => { if (m && m.type === "flow-yt-pip-prompt") pipPrompt(m.returnTab); });
  }

  load();
  browser.storage.onChanged.addListener((c) => { if (c.yt || c.modules || c.theme || c.customThemes) load().then(scheduleQuality); });
  window.addEventListener("load", scheduleStartVolume);
})();
