/* =====================================================================
   Windrad Start – Logik (v1.1)
   Einstellungen liegen in browser.storage.local.
   ===================================================================== */
"use strict";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};
const uid = () => Math.random().toString(36).slice(2, 10);

/* --- Übersetzungen --------------------------------------------------- */
const I18N = {
  en: {
    tabTitle: "New tab", search: "Search", searchPlaceholder: "Search with Google or enter address",
    quickLinks: "Quick links", newNote: "New note", openSettings: "Open settings", closeSettings: "Close settings",
    settings: "Settings", general: "General", language: "Language", yourName: "Your name", showSeconds: "Show seconds",
    widgets: "Widgets", resetPositions: "Reset widget positions",
    w_clock: "Clock", w_greeting: "Greeting and date", w_search: "Search bar", w_links: "Quick links",
    w_notes: "Notes", w_todo: "To-do list",
    tileSize: "Tile size", showNames: "Show names", category: "Category", categoryName: "Category name",
    addCategory: "Add category", deleteCategory: "Delete category", newCategory: "New category",
    confirmDeleteCat: "Delete the category “{name}” and its {n} quick links?",
    perRow: "Per row", maxLinks: "Max. quick links", name: "Name", address: "Address", addLink: "Add quick link",
    remove: "Remove {name}", shownOf: "{shown} of {total} shown",
    noLinks: "No quick links in this category yet. Add some in the settings.",
    background: "Background", chooseImage: "Choose image", useGradient: "Use theme gradient", dim: "Dim", blur: "Blur",
    notePlaceholder: "Write something …", deleteNote: "Delete note", moveHint: "Drag to move",
    todoTitle: "To-do", todoAdd: "New task + Enter", todoEmpty: "Nothing to do.", deleteTask: "Delete task",
    greetNight: "Good night", greetMorning: "Good morning", greetDay: "Good afternoon", greetEvening: "Good evening",
    today: ". Today is {date}.",
    gearHover: "Show settings button only on hover", favorites: "Favorites",
    tileDesign: "Tile design", shape: "Shape", style: "Style",
    st_glass: "Glass", st_solid: "Solid", st_outline: "Outline", st_minimal: "Minimal",
    sh_card: "Card", sh_circle: "Circle", sh_squircle: "Squircle", sh_cloud: "Cloud",
    sh_clover: "Clover", sh_flower: "Flower", sh_burst: "Burst", sh_hexagon: "Hexagon",
    glassStrength: "Glass strength", glassBlur: "Glass blur", glassBorder: "Border",
    showAddTile: "Show “+” tile", addTile: "Add", toggleLink: "Show {name}",
    listEmpty: "No quick links yet. Add your first one below.",
    backup: "Backup", backupHint: "Saves all settings, quick links, notes and to-dos to a file.",
    colors: "Colors", color1: "Color 1", color2: "Color 2", resetColors: "Reset to pink / teal",
    ownIcon: "Own icon", ownIconHint: "Own icon (optional). Without one, the site's icon is used.",
    removeIcon: "Remove own icon", changeIcon: "Change icon of {name}",
    linksPos: "Position", pos_below: "Below search", pos_above: "Above search", pos_free: "Free",
    posFreeHint: "Hover over the quick links and drag them by the handle on the left.",
    copyLink: "Copy link", shortcut: "Shortcut", reset: "Reset", pressKeys: "Press keys …",
    shortcutSaved: "Shortcut saved.", shortcutInvalid: "Use Ctrl or Alt plus a letter, number or F-key, e.g. Ctrl+Alt+C.",
    shortcutNeedsExt: "Only works when installed as an extension.",
    shortcutConflict: "{key} is also used by Firefox ({what}). Firefox may ignore it, better pick another one.",
    showToast: "Show “Link copied”", toastPos: "Notification position",
    tp_tr: "Top right", tp_t: "Top", tp_br: "Bottom right", tp_b: "Bottom",
    cleanUrl: "Remove tracking parameters (utm_ …)", preview: "Preview", linkCopied: "Link copied",
    moveUp: "Move {name} up", moveDown: "Move {name} down", dragToSort: "Drag to reorder",
    clock: "Clock", clockSize: "Size", clockLock: "Lock clock",
    clockHint: "Unlocked: drag the clock anywhere. Locked: it stays put and can't be clicked.",
    clockReset: "Move clock back to the top", copyOn: "Copy the page address with a shortcut",
    version: "Version {v}",
    export: "Export", import: "Import", imported: "Backup imported.", importFailed: "This file is not a valid backup.",
  },
  de: {
    tabTitle: "Neuer Tab", search: "Suchen", searchPlaceholder: "Mit Google suchen oder Adresse eingeben",
    quickLinks: "Schnellzugriff", newNote: "Neue Notiz", openSettings: "Einstellungen öffnen", closeSettings: "Einstellungen schließen",
    settings: "Einstellungen", general: "Allgemein", language: "Sprache", yourName: "Dein Name", showSeconds: "Sekunden anzeigen",
    widgets: "Widgets", resetPositions: "Widget-Positionen zurücksetzen",
    w_clock: "Uhr", w_greeting: "Begrüßung und Datum", w_search: "Suchleiste", w_links: "Schnellzugriff",
    w_notes: "Notizen", w_todo: "To-do-Liste",
    tileSize: "Kachelgröße", showNames: "Namen anzeigen", category: "Kategorie", categoryName: "Name der Kategorie",
    addCategory: "Kategorie hinzufügen", deleteCategory: "Kategorie löschen", newCategory: "Neue Kategorie",
    confirmDeleteCat: "Kategorie „{name}“ mit {n} Schnellzugriffen löschen?",
    perRow: "Pro Reihe", maxLinks: "Max. Schnellzugriffe", name: "Name", address: "Adresse", addLink: "Schnellzugriff hinzufügen",
    remove: "{name} entfernen", shownOf: "{shown} von {total} angezeigt",
    noLinks: "Noch keine Schnellzugriffe in dieser Kategorie. Füge in den Einstellungen welche hinzu.",
    background: "Hintergrund", chooseImage: "Bild wählen", useGradient: "Theme-Verlauf nutzen", dim: "Abdunkeln", blur: "Unschärfe",
    notePlaceholder: "Schreib etwas …", deleteNote: "Notiz löschen", moveHint: "Ziehen zum Verschieben",
    todoTitle: "To-do", todoAdd: "Neue Aufgabe + Enter", todoEmpty: "Nichts zu tun.", deleteTask: "Aufgabe löschen",
    greetNight: "Gute Nacht", greetMorning: "Guten Morgen", greetDay: "Guten Tag", greetEvening: "Guten Abend",
    today: ". Heute ist {date}.",
    gearHover: "Einstellungs-Knopf nur beim Drüberfahren zeigen", favorites: "Favoriten",
    tileDesign: "Kachel-Design", shape: "Form", style: "Stil",
    st_glass: "Glas", st_solid: "Deckend", st_outline: "Umriss", st_minimal: "Minimal",
    sh_card: "Karte", sh_circle: "Kreis", sh_squircle: "Squircle", sh_cloud: "Wolke",
    sh_clover: "Kleeblatt", sh_flower: "Blume", sh_burst: "Stern", sh_hexagon: "Sechseck",
    glassStrength: "Glas-Stärke", glassBlur: "Glas-Unschärfe", glassBorder: "Rahmen",
    showAddTile: "„+“-Kachel anzeigen", addTile: "Hinzufügen", toggleLink: "{name} anzeigen",
    listEmpty: "Noch keine Schnellzugriffe. Füge unten den ersten hinzu.",
    backup: "Sicherung", backupHint: "Speichert alle Einstellungen, Schnellzugriffe, Notizen und To-dos in eine Datei.",
    colors: "Farben", color1: "Farbe 1", color2: "Farbe 2", resetColors: "Auf Pink / Teal zurücksetzen",
    ownIcon: "Eigenes Icon", ownIconHint: "Eigenes Icon (optional). Ohne wird das Icon der Seite genutzt.",
    removeIcon: "Eigenes Icon entfernen", changeIcon: "Icon von {name} ändern",
    linksPos: "Position", pos_below: "Unter der Suche", pos_above: "Über der Suche", pos_free: "Frei",
    posFreeHint: "Fahr über den Schnellzugriff und zieh ihn am Griff links an die gewünschte Stelle.",
    copyLink: "Link kopieren", shortcut: "Tastenkürzel", reset: "Zurücksetzen", pressKeys: "Tasten drücken …",
    shortcutSaved: "Tastenkürzel gespeichert.", shortcutInvalid: "Nimm Strg oder Alt plus Buchstabe, Zahl oder F-Taste, z. B. Strg+Alt+C.",
    shortcutNeedsExt: "Funktioniert nur, wenn die Erweiterung installiert ist.",
    shortcutConflict: "{key} nutzt auch Firefox ({what}). Firefox ignoriert es eventuell, nimm besser ein anderes.",
    showToast: "„Link kopiert“ anzeigen", toastPos: "Position des Hinweises",
    tp_tr: "Oben rechts", tp_t: "Oben", tp_br: "Unten rechts", tp_b: "Unten",
    cleanUrl: "Tracking-Parameter entfernen (utm_ …)", preview: "Vorschau", linkCopied: "Link kopiert",
    moveUp: "{name} nach oben", moveDown: "{name} nach unten", dragToSort: "Ziehen zum Sortieren",
    clock: "Uhr", clockSize: "Größe", clockLock: "Uhr fixieren",
    clockHint: "Nicht fixiert: Uhr an eine beliebige Stelle ziehen. Fixiert: Sie bleibt stehen und lässt sich nicht anklicken.",
    clockReset: "Uhr wieder nach oben setzen", copyOn: "Seitenadresse per Tastenkürzel kopieren",
    version: "Version {v}",
    export: "Exportieren", import: "Importieren", imported: "Sicherung importiert.", importFailed: "Diese Datei ist keine gültige Sicherung.",
  },
};
function t(key, vars = {}) {
  let s = (I18N[S.lang] || I18N.en)[key] ?? I18N.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}
function applyI18n() {
  document.documentElement.lang = S.lang;
  document.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((e) => { e.placeholder = t(e.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria]").forEach((e) => { e.setAttribute("aria-label", t(e.dataset.i18nAria)); });
  document.querySelectorAll("[data-i18n-title]").forEach((e) => { e.title = t(e.dataset.i18nTitle); });
}

/* --- Speicher -------------------------------------------------------- */
const hasExt = typeof browser !== "undefined" && browser.storage && browser.storage.local;
// inside Windrad Flow "notes" are Flow's notes per page -> Start keeps its own key
const SKEY = (k) => (k === "notes" ? "startNotes" : k);
const store = {
  async get(key, fallback) {
    key = SKEY(key);
    try {
      if (hasExt) {
        const r = await browser.storage.local.get(key);
        return r[key] !== undefined ? r[key] : fallback;
      }
      const v = localStorage.getItem(key);
      return v !== null ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  },
  async set(key, value) {
    key = SKEY(key);
    try {
      if (hasExt) await browser.storage.local.set({ [key]: value });
      else localStorage.setItem(key, JSON.stringify(value));
    } catch (e) { console.error("Save failed:", e); }
  },
};
// Werte, die sofort beim Öffnen gebraucht werden, zusätzlich im schnellen
// localStorage zwischenspeichern -> Uhr & Begrüßung ohne Wartezeit
const QUICK_KEYS = ["lang", "name", "seconds", "widgets", "dim", "blur", "clockSize", "clockLock", "positions", "linksPos"];
function saveQuick() {
  try {
    const q = {};
    for (const k of QUICK_KEYS) q[k] = S[k];
    localStorage.setItem("windrad-quick", JSON.stringify(q));
  } catch {}
}
const save = (key) => {
  if (QUICK_KEYS.includes(key)) saveQuick();
  return store.set(key, S[key]);
};

/* --- Standardwerte --------------------------------------------------- */
const DEFAULTS = {
  lang: "en",
  name: "",
  seconds: false,
  widgets: { clock: true, greeting: true, search: true, links: true, notes: true, todo: false },
  color1: "#ff7a95",   // Pink
  color2: "#4fe3e0",   // Teal
  dim: 35,
  blur: 0,
  tileSize: "m",
  tileShape: "card",
  tileStyle: "glass",
  glass: 6,
  tileBlur: 18,
  tileBorder: true,
  showNames: true,
  addTile: true,
  gearHover: false,
  linksPos: "below",        // below | above | free
  copyToast: true,
  toastPos: "top-right",
  copyClean: true,
  copyEnabled: true,
  copyShortcut: "",          // gemerkt, solange "Link kopieren" aus ist
  clockSize: 160,
  clockLock: false,
  // Standard: keine Schnellzugriffe, der Nutzer legt sie selbst an
  categories: [{ id: "main", name: "", perRow: 6, max: 12, links: [] }],
  activeCat: "main",
  notes: [],
  todo: [],
  positions: {},
};
const S = {};

async function loadSettings() {
  // alle Einstellungen mit EINEM Zugriff lesen statt einzeln nacheinander
  const keys = [...Object.keys(DEFAULTS), "city", "weatherCache"];
  let all = {};
  try {
    if (hasExt) {
      const raw = await browser.storage.local.get(keys.map(SKEY));
      for (const k of keys) if (raw[SKEY(k)] !== undefined) all[k] = raw[SKEY(k)];
    }
    else for (const k of keys) { const v = localStorage.getItem(k); if (v !== null) all[k] = JSON.parse(v); }
  } catch {}
  for (const k of Object.keys(DEFAULTS)) S[k] = all[k] !== undefined ? all[k] : structuredClone(DEFAULTS[k]);
  S.widgets = { ...DEFAULTS.widgets, ...S.widgets };
  delete S.widgets.weather;
  // Reste aus alten Versionen nur einmal wegräumen
  if (hasExt && ("city" in all || "weatherCache" in all)) browser.storage.local.remove(["city", "weatherCache"]);
  saveQuick();

  // Übernahme aus v1.0 (eine einzige Kachel-Liste)
  const old = await store.get("tiles", null);
  if (old && Array.isArray(old)) {
    S.categories = [{ id: uid(), name: "", perRow: 6, max: 24, links: old }];
    S.activeCat = S.categories[0].id;
    await save("categories"); await save("activeCat");
    await store.set("tiles", null);
  }
  if (!S.categories.length) S.categories = structuredClone(DEFAULTS.categories);
  if (!S.categories.some((c) => c.id === S.activeCat)) S.activeCat = S.categories[0].id;
}

/* --- Sichtbarkeit der Widgets ---------------------------------------- */
function applyWidgets() {
  const w = S.widgets;
  $("clock").classList.toggle("hidden", !w.clock);
  $("greeting").classList.toggle("hidden", !w.greeting);
  $("search").classList.toggle("hidden", !w.search);
  $("links").classList.toggle("hidden", !w.links);
  $("add-note").classList.toggle("hidden", !w.notes);
  requestAnimationFrame(layoutFree);
  renderFloating();
}

/* --- Uhr & Begrüßung ------------------------------------------------- */
function greetingFor(h) {
  if (h < 5)  return t("greetNight");
  if (h < 11) return t("greetMorning");
  if (h < 18) return t("greetDay");
  return t("greetEvening");
}
function tick() {
  const locale = S.lang === "de" ? "de-DE" : "en-GB";
  const now = new Date();
  const opts = { hour: "2-digit", minute: "2-digit", hour12: false };
  if (S.seconds) opts.second = "2-digit";
  $("clock").textContent = now.toLocaleTimeString(locale, opts);

  const date = now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const g = $("greeting");
  g.textContent = "";
  const hello = el("strong", "", S.name ? `${greetingFor(now.getHours())}, ${S.name}` : greetingFor(now.getHours()));
  g.append(hello, document.createTextNode(t("today", { date })));
}
function startClock() {
  tick();
  setTimeout(() => { tick(); setInterval(tick, 1000); }, 1000 - (Date.now() % 1000));
}

/* --- Suche ------------------------------------------------------------ */
function looksLikeUrl(text) {
  return /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/i.test(text) && !/\s/.test(text);
}
$("search").addEventListener("submit", (e) => {
  const q = $("q").value.trim();
  if (!q) { e.preventDefault(); return; }
  if (looksLikeUrl(q)) {
    e.preventDefault();
    location.href = /^https?:\/\//i.test(q) ? q : `https://${q}`;
  }
});
document.addEventListener("keydown", (e) => {
  const typing = e.target.closest("input, textarea, select");
  if (e.key === "/" && !typing && S.widgets.search) { e.preventDefault(); $("q").focus(); }
  if (e.key === "Escape") closeSettings();
});

/* --- Schnellzugriff --------------------------------------------------- */
const normalizeUrl = (u) => (/^https?:\/\//i.test(u.trim()) ? u.trim() : `https://${u.trim()}`);
function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } }
const catName = (c) => c.name || (S.categories.indexOf(c) <= 0 ? t("favorites") : t("newCategory"));
const activeCat = () => S.categories.find((c) => c.id === S.activeCat) || S.categories[0];

function renderLinks() {
  renderLinksInner();
  if (S.linksPos === "free" && document.querySelector(".links.free")) layoutFree();
}
function renderLinksInner() {
  // Kategorie-Tabs (nur ab 2 Kategorien)
  const tabs = $("cat-tabs");
  tabs.textContent = "";
  if (S.categories.length > 1) {
    for (const c of S.categories) {
      const b = el("button", "cat-tab", catName(c));
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-selected", c.id === S.activeCat);
      b.onclick = () => { S.activeCat = c.id; save("activeCat"); renderLinks(); syncCategoryEditor(); };
      tabs.append(b);
    }
  }

  const cat = activeCat();
  const nav = $("tiles");
  nav.textContent = "";
  nav.dataset.size = S.tileSize;
  nav.dataset.shape = S.tileShape;
  nav.classList.toggle("no-names", !S.showNames);
  applyTileStyle(nav);

  const visible = cat.links.filter((l) => !l.off).slice(0, cat.max);
  const showAdd = S.addTile && visible.length < cat.max;
  const count = visible.length + (showAdd ? 1 : 0);

  if (!count) {
    nav.style.setProperty("--per-row", 1);
    nav.append(el("p", "empty", t("noLinks")));
    return;
  }
  nav.style.setProperty("--per-row", Math.max(1, Math.min(cat.perRow, count)));

  for (const l of visible) {
    const a = el("a", "tile");
    a.href = l.url;
    a.title = S.showNames ? hostOf(l.url) : l.name;
    const fav = el("span", "fav");
    fav.append(iconFor(l));
    a.append(fav, el("span", "name", l.name));
    makeSortable(a, l, cat, true);
    nav.append(a);
  }
  if (showAdd) {
    const b = el("button", "tile add");
    b.type = "button";
    b.title = t("addLink");
    const fav = el("span", "fav");
    fav.append(el("span", "letter", "+"));
    b.append(fav, el("span", "name", t("addTile")));
    b.onclick = () => {
      openSettings();
      $("s-links-section").scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => $("s-tile-name").focus(), 300);
    };
    nav.append(b);
  }
}

/* Icon einer Kachel: eigenes Bild -> favicon.ico -> favicon.png ->
   apple-touch-icon.png -> Anfangsbuchstabe */
function iconCandidates(l) {
  const h = hostOf(l.url);
  return [`https://${h}/favicon.ico`, `https://${h}/favicon.png`, `https://${h}/apple-touch-icon.png`];
}
function iconFor(l) {
  if (l.icon) {
    const img = el("img");
    img.alt = "";
    img.src = l.icon;
    return img;
  }
  const list = iconCandidates(l);
  const img = el("img");
  img.alt = "";
  let i = 0;
  const next = () => {
    if (i < list.length) { img.src = list[i++]; return; }
    img.replaceWith(el("span", "letter", (l.name || "?").charAt(0).toUpperCase()));
  };
  img.onerror = next;
  // manche Seiten liefern ein 1x1-Pixel statt eines Fehlers
  img.onload = () => { if (img.naturalWidth < 8) next(); };
  next();
  return img;
}

/* Bild verkleinern (max. 128 px) und als PNG speichern */
function fileToIcon(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, 128 / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/png"));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* Reihenfolge: Link "from" vor/hinter Link "to" schieben */
function moveLink(cat, from, to, after) {
  if (from === to) return;
  const list = cat.links;
  list.splice(list.indexOf(from), 1);
  let idx = list.indexOf(to);
  if (after) idx += 1;
  list.splice(idx, 0, from);
  save("categories");
  renderLinks();
  if ($("settings").classList.contains("open")) syncCategoryEditor();
}
// Drag & Drop für eine Liste von Elementen (Kacheln oder Einträge)
let dragLink = null;
function makeSortable(node, link, cat, horizontal) {
  node.draggable = true;
  node.addEventListener("dragstart", (e) => {
    dragLink = link;
    node.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/uri-list", link.url);
    e.dataTransfer.setData("text/plain", link.url);
  });
  node.addEventListener("dragend", () => {
    dragLink = null;
    node.classList.remove("dragging");
    document.querySelectorAll(".drop-before, .drop-after").forEach((n) => n.classList.remove("drop-before", "drop-after"));
  });
  const side = (e) => {
    const r = node.getBoundingClientRect();
    return horizontal ? e.clientX > r.left + r.width / 2 : e.clientY > r.top + r.height / 2;
  };
  node.addEventListener("dragover", (e) => {
    if (!dragLink || dragLink === link) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const after = side(e);
    node.classList.toggle("drop-after", after);
    node.classList.toggle("drop-before", !after);
  });
  node.addEventListener("dragleave", () => node.classList.remove("drop-before", "drop-after"));
  node.addEventListener("drop", (e) => {
    if (!dragLink || dragLink === link) return;
    e.preventDefault();
    moveLink(cat, dragLink, link, side(e));
  });
}

/* Stil der Kacheln (Glas / Deckend / Umriss / Minimal) */
function applyTileStyle(nav) {
  const g = S.glass / 100;
  const styles = {
    glass:   { bg: `rgba(255,255,255,${g})`, hover: `rgba(255,255,255,${g + 0.05})`,
               border: S.tileBorder ? "rgba(255,255,255,0.12)" : "transparent", blur: `${S.tileBlur}px` },
    solid:   { bg: "color-mix(in srgb, var(--panel) 92%, transparent)", hover: "color-mix(in srgb, var(--panel) 80%, white 6%)",
               border: S.tileBorder ? "rgba(255,255,255,0.12)" : "transparent", blur: "0px" },
    outline: { bg: "transparent", hover: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.28)", blur: "0px" },
    minimal: { bg: "transparent", hover: "rgba(255,255,255,0.08)", border: "transparent", blur: "0px" },
  }[S.tileStyle] || {};
  nav.style.setProperty("--t-bg", styles.bg);
  nav.style.setProperty("--t-bg-hover", styles.hover);
  nav.style.setProperty("--t-border", styles.border);
  nav.style.setProperty("--t-blur", styles.blur);
  $("s-glass-opts").classList.toggle("hidden", S.tileStyle !== "glass");
}

/* Editor im Panel */
/* eigenes Dropdown im Glas-Stil (statt des System-Menüs) */
const catDropdown = (() => {
  const root = $("s-cat");
  const btn = root.querySelector(".dd-btn");
  const list = root.querySelector(".dd-list");
  let active = -1;
  const items = () => [...list.children];
  const mark = () => items().forEach((li, i) => li.classList.toggle("active", i === active));
  const open = () => {
    list.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    active = items().findIndex((li) => li.getAttribute("aria-selected") === "true");
    mark();
  };
  const close = () => { list.hidden = true; btn.setAttribute("aria-expanded", "false"); };
  const pick = (id) => { close(); S.activeCat = id; save("activeCat"); renderLinks(); syncCategoryEditor(); btn.focus(); };

  btn.addEventListener("click", () => (list.hidden ? open() : close()));
  btn.addEventListener("keydown", (e) => {
    const n = items().length;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (list.hidden) open();
      active = (active + (e.key === "ArrowDown" ? 1 : -1) + n) % n;
      mark();
    } else if (e.key === "Enter" && !list.hidden && active >= 0) {
      e.preventDefault(); pick(items()[active].dataset.id);
    } else if (e.key === "Escape" && !list.hidden) {
      e.stopPropagation(); close();
    }
  });
  document.addEventListener("pointerdown", (e) => { if (!root.contains(e.target)) close(); });

  return {
    render() {
      list.textContent = "";
      for (const c of S.categories) {
        const li = el("li", "", catName(c));
        li.setAttribute("role", "option");
        li.dataset.id = c.id;
        li.setAttribute("aria-selected", c.id === S.activeCat);
        li.onclick = () => pick(c.id);
        list.append(li);
      }
      root.querySelector(".dd-label").textContent = catName(activeCat());
    },
    close,
  };
})();

function maxLabel(cat) {
  const on = cat.links.filter((l) => !l.off).length;
  return `${cat.max} (${t("shownOf", { shown: Math.min(cat.max, on), total: cat.links.length })})`;
}

// nach dem Verschieben mit den Pfeilen den Fokus mitnehmen (Tastatur)
function focusMove(index, dir) {
  const li = $("s-tiles").children[index];
  const btn = li && li.querySelector(`.t-move button:${dir === "up" ? "first-child" : "last-child"}`);
  if (btn && !btn.disabled) btn.focus();
  else if (li) li.querySelector(".t-move button:not(:disabled)")?.focus();
}

function syncCategoryEditor() {
  catDropdown.render();
  const cat = activeCat();
  $("s-cat-name").value = cat.name;
  $("s-cat-name").placeholder = S.categories.indexOf(cat) === 0 ? t("favorites") : t("newCategory");
  $("s-cat-del").disabled = S.categories.length < 2;
  $("s-perrow").value = cat.perRow;
  $("s-perrow-val").textContent = cat.perRow;
  $("s-max").value = cat.max;
  $("s-max-val").textContent = maxLabel(cat);

  const list = $("s-tiles");
  list.textContent = "";
  if (!cat.links.length) list.append(el("li", "empty-hint", t("listEmpty")));
  cat.links.forEach((l, i) => {
    const li = el("li", l.off ? "off" : "");
    const sw = el("input", "mini-switch");
    sw.type = "checkbox";
    sw.checked = !l.off;
    sw.setAttribute("aria-label", t("toggleLink", { name: l.name }));
    sw.onchange = () => { l.off = !sw.checked; save("categories"); renderLinks(); syncCategoryEditor(); };
    const del = el("button", "", "✕");
    del.type = "button";
    del.setAttribute("aria-label", t("remove", { name: l.name }));
    del.onclick = () => { cat.links.splice(i, 1); save("categories"); renderLinks(); syncCategoryEditor(); };

    // Icon: Klick = eigenes Bild hochladen
    const ic = el("label", "t-icon" + (l.icon ? " custom" : ""));
    ic.title = t("changeIcon", { name: l.name });
    ic.setAttribute("aria-label", t("changeIcon", { name: l.name }));
    ic.append(iconFor(l));
    const file = el("input");
    file.type = "file"; file.accept = "image/*"; file.hidden = true;
    file.onchange = async () => {
      if (!file.files[0]) return;
      try { l.icon = await fileToIcon(file.files[0]); save("categories"); renderLinks(); syncCategoryEditor(); } catch {}
    };
    ic.append(file);
    const parts = [sw, ic, el("span", "t-name", l.name), el("span", "t-url", hostOf(l.url))];
    if (l.icon) {
      const rs = el("button", "t-icon-reset", "↺");
      rs.type = "button";
      rs.title = t("removeIcon");
      rs.setAttribute("aria-label", t("removeIcon"));
      rs.onclick = () => { delete l.icon; save("categories"); renderLinks(); syncCategoryEditor(); };
      parts.push(rs);
    }
    const grip = el("span", "t-grip", "⋮⋮");
    grip.title = t("dragToSort");
    grip.setAttribute("aria-hidden", "true");
    const arrows = el("span", "t-move");
    const up = el("button", "", "↑");
    up.type = "button";
    up.disabled = i === 0;
    up.setAttribute("aria-label", t("moveUp", { name: l.name }));
    up.title = t("moveUp", { name: l.name });
    up.onclick = () => { moveLink(cat, l, cat.links[i - 1], false); focusMove(i - 1, "up"); };
    const down = el("button", "", "↓");
    down.type = "button";
    down.disabled = i === cat.links.length - 1;
    down.setAttribute("aria-label", t("moveDown", { name: l.name }));
    down.title = t("moveDown", { name: l.name });
    down.onclick = () => { moveLink(cat, l, cat.links[i + 1], true); focusMove(i + 1, "down"); };
    arrows.append(up, down);
    li.append(grip, ...parts, arrows, del);
    makeSortable(li, l, cat, false);
    list.append(li);
  });
}

$("s-cat-add").addEventListener("click", () => {
  const c = { id: uid(), name: "", perRow: 6, max: 12, links: [] };
  S.categories.push(c);
  S.activeCat = c.id;
  save("categories"); save("activeCat");
  renderLinks(); syncCategoryEditor();
  $("s-cat-name").select();
});
$("s-cat-del").addEventListener("click", () => {
  if (S.categories.length < 2) return;
  const cat = activeCat();
  if (cat.links.length && !confirm(t("confirmDeleteCat", { name: catName(cat), n: cat.links.length }))) return;
  S.categories = S.categories.filter((c) => c.id !== cat.id);
  S.activeCat = S.categories[0].id;
  save("categories"); save("activeCat");
  renderLinks(); syncCategoryEditor();
});
$("s-cat-name").addEventListener("input", (e) => {
  activeCat().name = e.target.value.trim();
  save("categories"); renderLinks(); catDropdown.render();
});
$("s-perrow").addEventListener("input", (e) => {
  activeCat().perRow = +e.target.value;
  $("s-perrow-val").textContent = e.target.value;
  save("categories"); renderLinks();
});
$("s-max").addEventListener("input", (e) => {
  const cat = activeCat();
  cat.max = +e.target.value;
  $("s-max-val").textContent = maxLabel(cat);
  save("categories"); renderLinks();
});
$("s-tile-add").addEventListener("click", () => {
  const url = $("s-tile-url").value.trim();
  if (!url) { $("s-tile-url").focus(); return; }
  const full = normalizeUrl(url);
  let name = $("s-tile-name").value.trim();
  if (!name) name = hostOf(full).split(".")[0].replace(/^./, (c) => c.toUpperCase());
  const link = { name, url: full };
  if (pendingIcon) link.icon = pendingIcon;
  activeCat().links.push(link);
  save("categories");
  $("s-tile-name").value = ""; $("s-tile-url").value = "";
  setPendingIcon(null);
  renderLinks(); syncCategoryEditor();
  $("s-tile-name").focus();
});
let pendingIcon = null;
function setPendingIcon(data) {
  pendingIcon = data;
  const prev = $("s-tile-icon-prev");
  prev.textContent = "";
  if (data) { const img = el("img"); img.src = data; img.alt = ""; prev.append(img); }
  else prev.textContent = "+";
  $("s-tile-icon-clear").classList.toggle("hidden", !data);
  $("s-tile-icon").value = "";
}
$("s-tile-icon").addEventListener("change", async (e) => {
  if (!e.target.files[0]) return;
  try { setPendingIcon(await fileToIcon(e.target.files[0])); } catch {}
});
$("s-tile-icon-clear").addEventListener("click", () => setPendingIcon(null));
$("s-tile-url").addEventListener("keydown", (e) => { if (e.key === "Enter") $("s-tile-add").click(); });

/* Segment-Schalter (Sprache, Kachelgröße) */
function setupSegmented(id, key, onChange) {
  const box = $(id);
  const sync = () => box.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === S[key]));
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b) return;
    S[key] = b.dataset.value; save(key); sync(); onChange();
  });
  sync();
}

/* Formen-Auswahl */
const SHAPES = ["card", "circle", "squircle", "cloud", "clover", "flower", "burst", "hexagon"];
function renderShapePicker() {
  const box = $("s-shape");
  box.textContent = "";
  for (const k of SHAPES) {
    const b = el("button");
    b.type = "button";
    b.setAttribute("aria-pressed", S.tileShape === k);
    b.append(el("span", `preview ${k}`), el("span", "", t(`sh_${k}`)));
    b.onclick = () => { S.tileShape = k; save("tileShape"); renderShapePicker(); renderLinks(); };
    box.append(b);
  }
}
$("s-glass").addEventListener("input", (e) => { S.glass = +e.target.value; $("s-glass-val").textContent = `${S.glass}%`; save("glass"); renderLinks(); });
$("s-tblur").addEventListener("input", (e) => { S.tileBlur = +e.target.value; $("s-tblur-val").textContent = `${S.tileBlur}px`; save("tileBlur"); renderLinks(); });
$("s-border").addEventListener("change", (e) => { S.tileBorder = e.target.checked; save("tileBorder"); renderLinks(); });
$("s-addtile").addEventListener("change", (e) => { S.addTile = e.target.checked; save("addTile"); renderLinks(); });
$("s-gear").addEventListener("change", (e) => { S.gearHover = e.target.checked; save("gearHover"); applyGear(); });
function applyGear() { document.body.classList.toggle("gear-hover", S.gearHover); }

/* --- Link kopieren (Tastenkürzel + Hinweis) -------------------------- */
const hasCommands = typeof browser !== "undefined" && browser.commands && browser.commands.update;
// Kürzel, die Firefox selbst belegt (Auswahl der wichtigsten)
const FIREFOX_KEYS = {
  "Ctrl+Shift+C": ["Inspector", "Inspektor"], "Ctrl+Shift+I": ["Developer Tools", "Entwicklerwerkzeuge"],
  "Ctrl+Shift+K": ["Web Console", "Web-Konsole"], "Ctrl+Shift+J": ["Browser Console", "Browser-Konsole"],
  "Ctrl+Shift+E": ["Network", "Netzwerkanalyse"], "Ctrl+Shift+M": ["Responsive Design Mode", "Bildschirmgrößen testen"],
  "Ctrl+Shift+T": ["Reopen closed tab", "Geschlossenen Tab wiederherstellen"],
  "Ctrl+Shift+N": ["Reopen closed window", "Geschlossenes Fenster wiederherstellen"],
  "Ctrl+Shift+P": ["New private window", "Neues privates Fenster"],
  "Ctrl+Shift+B": ["Bookmarks toolbar", "Lesezeichen-Symbolleiste"], "Ctrl+Shift+H": ["Library", "Bibliothek"],
  "Ctrl+Shift+O": ["Bookmarks", "Lesezeichen"], "Ctrl+Shift+Delete": ["Clear history", "Chronik löschen"],
  "Ctrl+Shift+R": ["Reload", "Neu laden"], "Ctrl+Shift+W": ["Close window", "Fenster schließen"],
  "Ctrl+Shift+Y": ["Downloads", "Downloads"], "Ctrl+Shift+A": ["List all tabs", "Alle Tabs auflisten"],
  "Ctrl+Shift+Z": ["Redo", "Wiederholen"], "Ctrl+Shift+V": ["Paste as plain text", "Als reinen Text einfügen"],
  "Ctrl+Shift+S": ["Screenshot", "Bildschirmfoto"], "Ctrl+Shift+D": ["Bookmark all tabs", "Alle Tabs als Lesezeichen"],
  "Ctrl+Shift+G": ["Find previous", "Vorheriges suchen"], "Ctrl+Shift+X": ["Text direction", "Textrichtung"],
  "Ctrl+Shift+Q": ["Quit", "Beenden"], "Ctrl+Shift+PageUp": ["Move tab", "Tab verschieben"],
  "Ctrl+Shift+PageDown": ["Move tab", "Tab verschieben"], "Ctrl+Shift+Home": ["Move tab", "Tab verschieben"],
  "Ctrl+Shift+End": ["Move tab", "Tab verschieben"], "Ctrl+Shift+Left": ["Select word", "Wort markieren"],
  "Ctrl+Shift+Right": ["Select word", "Wort markieren"], "Alt+Left": ["Back", "Zurück"],
  "Alt+Right": ["Forward", "Vor"], "Alt+Home": ["Home page", "Startseite"],
};
// Strg + einzelne Taste ist fast immer schon belegt (Strg+C, Strg+T, Strg+W …)
function firefoxClash(sc) {
  if (FIREFOX_KEYS[sc]) return FIREFOX_KEYS[sc][S.lang === "de" ? 1 : 0];
  if (/^Ctrl\+[A-Z0-9]$/.test(sc) || /^Ctrl\+(Comma|Period|Space|PageUp|PageDown|Home|End|Left|Right|Up|Down|Delete|Insert)$/.test(sc))
    return S.lang === "de" ? "Standard-Kürzel" : "built-in shortcut";
  return null;
}
const KEY_NAMES = {
  ",": "Comma", ".": "Period", " ": "Space", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left",
  ArrowRight: "Right", Home: "Home", End: "End", PageUp: "PageUp", PageDown: "PageDown",
  Insert: "Insert", Delete: "Delete",
};
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
  const isF = /^F\d+$/.test(key);
  if (!isF && !e.ctrlKey && !e.altKey) return null;   // Firefox verlangt Strg oder Alt
  return [...mods, key].join("+");
}
function displayKeys(sc) {
  if (S.lang !== "de") return sc;
  return sc.replace(/\bCtrl\b/g, "Strg").replace(/\bShift\b/g, "Umschalt").replace(/\bComma\b/g, "Komma")
    .replace(/\bPeriod\b/g, "Punkt").replace(/\bSpace\b/g, "Leertaste").replace(/\bDelete\b/g, "Entf")
    .replace(/\bInsert\b/g, "Einfg").replace(/\bHome\b/g, "Pos1").replace(/\bEnd\b/g, "Ende")
    .replace(/\bPageUp\b/g, "Bild↑").replace(/\bPageDown\b/g, "Bild↓");
}
async function showShortcut() {
  const btn = $("s-shortcut");
  if (!hasCommands) {
    btn.textContent = displayKeys("Ctrl+Alt+C");
    btn.disabled = true; $("s-shortcut-reset").disabled = true;
    $("s-shortcut-msg").textContent = t("shortcutNeedsExt");
    return;
  }
  const cmds = await browser.commands.getAll();
  const c = cmds.find((x) => x.name === "copy-url");
  btn.textContent = displayKeys((c && c.shortcut) || "–");
}
let recording = false;
$("s-shortcut").addEventListener("click", () => {
  if (!hasCommands) return;
  recording = true;
  const btn = $("s-shortcut");
  btn.classList.add("recording");
  btn.textContent = t("pressKeys");
  $("s-shortcut-msg").textContent = "";
  $("s-shortcut-msg").classList.remove("warn");
});
$("s-shortcut").addEventListener("keydown", async (e) => {
  if (!recording) return;
  if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) return;
  e.preventDefault(); e.stopPropagation();
  const btn = $("s-shortcut");
  const msg = $("s-shortcut-msg");
  if (e.key === "Escape") { recording = false; btn.classList.remove("recording"); showShortcut(); return; }
  const sc = keyToShortcut(e);
  if (!sc) { msg.textContent = t("shortcutInvalid"); msg.classList.add("warn"); return; }
  recording = false;
  btn.classList.remove("recording");
  try {
    await browser.commands.update({ name: "copy-url", shortcut: sc });
    const clash = firefoxClash(sc);
    msg.textContent = clash ? t("shortcutConflict", { key: displayKeys(sc), what: clash }) : t("shortcutSaved");
    msg.classList.toggle("warn", !!clash);
  } catch {
    msg.textContent = t("shortcutInvalid"); msg.classList.add("warn");
  }
  showShortcut();
});
$("s-shortcut").addEventListener("blur", () => {
  if (!recording) return;
  recording = false; $("s-shortcut").classList.remove("recording"); showShortcut();
});
$("s-shortcut-reset").addEventListener("click", async () => {
  if (!hasCommands) return;
  await browser.commands.reset("copy-url");
  $("s-shortcut-msg").textContent = t("shortcutSaved");
  $("s-shortcut-msg").classList.remove("warn");
  showShortcut();
});
$("s-toast").addEventListener("change", (e) => { S.copyToast = e.target.checked; save("copyToast"); });
$("s-clean").addEventListener("change", (e) => { S.copyClean = e.target.checked; save("copyClean"); });
function toastOpts(sub) {
  return { text: t("linkCopied"), sub, c1: S.color1, c2: S.color2, position: S.toastPos, duration: 1600 };
}
$("s-toast-test").addEventListener("click", () => windradToast(toastOpts("example.com")));
// Nachricht vom Hintergrund, wenn auf dieser Seite selbst kopiert wird
if (typeof browser !== "undefined" && browser.runtime && browser.runtime.onMessage) {
  browser.runtime.onMessage.addListener((m) => { if (m && m.type === "toast") windradToast(m.opts); });
}

/* --- Uhr-Einstellungen -------------------------------------------------- */
$("s-clocksize").addEventListener("input", (e) => {
  S.clockSize = +e.target.value;
  $("s-clocksize-val").textContent = `${S.clockSize}px`;
  applyClock(); save("clockSize"); layoutFree();
});
$("s-clocklock").addEventListener("change", (e) => { S.clockLock = e.target.checked; applyClock(); save("clockLock"); });
$("s-clock-reset").addEventListener("click", () => {
  delete S.positions.clock; save("positions"); saveQuick(); layoutFree();
});

/* --- Link kopieren ein/aus ----------------------------------------------
   Aus: Kürzel wird bei Firefox ausgetragen (die Tasten sind wieder frei)
   und das Hintergrundskript ignoriert den Befehl. An: altes Kürzel zurück. */
async function setCopyEnabled(on) {
  S.copyEnabled = on;
  save("copyEnabled");
  $("copy-opts").classList.toggle("hidden", !on);
  if (!hasCommands) return;
  try {
    const c = (await browser.commands.getAll()).find((x) => x.name === "copy-url");
    if (!on) {
      if (c && c.shortcut) { S.copyShortcut = c.shortcut; save("copyShortcut"); }
      await browser.commands.update({ name: "copy-url", shortcut: "" });
    } else if (!c || !c.shortcut) {
      if (S.copyShortcut) await browser.commands.update({ name: "copy-url", shortcut: S.copyShortcut });
      else await browser.commands.reset("copy-url");
    }
  } catch {}
  showShortcut();
}
$("s-copy-on").addEventListener("change", (e) => setCopyEnabled(e.target.checked));

/* --- Versionsnummer aus dem Manifest ------------------------------------ */
function showVersion() {
  let v = "";
  try { v = browser.runtime.getManifest().version; } catch {}
  $("s-version").textContent = `Windrad Start · ${v ? t("version", { v }) : "–"}`;
}

/* --- Sicherung (Export / Import) ------------------------------------- */
$("s-export").addEventListener("click", async () => {
  const data = { app: "windrad-start", version: 1 };
  for (const k of Object.keys(DEFAULTS)) data[k] = S[k];
  data.bgImage = await store.get("bgImage", null);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = el("a");
  a.href = URL.createObjectURL(blob);
  a.download = `windrad-start-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$("s-import").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.app !== "windrad-start") throw new Error("wrong file");
      for (const k of Object.keys(DEFAULTS)) if (k in data) await store.set(k, data[k]);
      if ("bgImage" in data) await store.set("bgImage", data.bgImage);
      $("s-backup-msg").textContent = t("imported");
      setTimeout(() => location.reload(), 600);
    } catch {
      $("s-backup-msg").textContent = t("importFailed");
    }
    e.target.value = "";
  };
  reader.readAsText(file);
});

/* --- Farben ----------------------------------------------------------- */
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
function fullHex(h) {           // #abc -> #aabbcc (für das Farbfeld)
  h = h.toLowerCase();
  return h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h;
}
function applyColors() {
  const root = document.documentElement.style;
  root.setProperty("--accent", S.color1);
  root.setProperty("--teal", S.color2);
  // Zwischenspeicher, damit die Farben beim nächsten Öffnen sofort da sind
  try { localStorage.setItem("windrad-colors", JSON.stringify([S.color1, S.color2])); } catch {}
}
// sofort beim Laden, noch bevor die Einstellungen gelesen sind
try {
  const c = JSON.parse(localStorage.getItem("windrad-colors") || "null");
  if (c && HEX.test(c[0]) && HEX.test(c[1])) {
    document.documentElement.style.setProperty("--accent", c[0]);
    document.documentElement.style.setProperty("--teal", c[1]);
  }
} catch {}
function syncColorInputs() {
  for (const n of [1, 2]) {
    $(`s-c${n}`).value = S[`color${n}`];
    $(`s-c${n}`).classList.remove("invalid");
    $(`s-c${n}-pick`).value = fullHex(S[`color${n}`]);
  }
}
for (const n of [1, 2]) {
  const key = `color${n}`;
  $(`s-c${n}`).addEventListener("input", (e) => {
    if (!e.isTrusted) return;
    let v = e.target.value.trim();
    if (v && !v.startsWith("#")) v = "#" + v;
    const ok = HEX.test(v);
    e.target.classList.toggle("invalid", !ok && v.length > 1);
    if (!ok) return;
    S[key] = v.toLowerCase();
    $(`s-c${n}-pick`).value = fullHex(v);
    applyColors(); save(key);
  });
  $(`s-c${n}`).addEventListener("blur", syncColorInputs);
  $(`s-c${n}-pick`).addEventListener("input", (e) => {
    if (!e.isTrusted || !$("settings").classList.contains("open")) return;
    S[key] = e.target.value;
    $(`s-c${n}`).value = e.target.value;
    $(`s-c${n}`).classList.remove("invalid");
    applyColors(); save(key);
  });
}
$("s-colors-reset").addEventListener("click", () => {
  S.color1 = DEFAULTS.color1; S.color2 = DEFAULTS.color2;
  save("color1"); save("color2"); applyColors(); syncColorInputs();
});


/* --- Frei verschiebbare Widgets (Notizen, To-do) ---------------------- */
// Position wird relativ zur Fenstergröße gespeichert (0..1), damit sie
// bei anderer Fenstergröße ungefähr an derselben Stelle bleibt.
function place(node, pos) {
  const maxX = Math.max(0, innerWidth - node.offsetWidth);
  const maxY = Math.max(0, innerHeight - node.offsetHeight);
  node.style.left = `${Math.round(Math.min(maxX, Math.max(0, pos.x * innerWidth)))}px`;
  node.style.top = `${Math.round(Math.min(maxY, Math.max(0, pos.y * innerHeight)))}px`;
}
function makeDraggable(node, handle, getPos, setPos) {
  handle.title = t("moveHint");
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("button")) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX - node.offsetLeft;
    const startY = e.clientY - node.offsetTop;
    node.classList.add("dragging");
    const move = (ev) => {
      const x = Math.min(innerWidth - node.offsetWidth, Math.max(0, ev.clientX - startX));
      const y = Math.min(innerHeight - node.offsetHeight, Math.max(0, ev.clientY - startY));
      node.style.left = `${x}px`; node.style.top = `${y}px`;
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      node.classList.remove("dragging");
      setPos({ x: node.offsetLeft / innerWidth, y: node.offsetTop / innerHeight });
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  });
  requestAnimationFrame(() => place(node, getPos()));
}
function widgetHead(title, closeLabel, onClose) {
  const head = el("div", "w-head");
  head.append(el("span", "grip", "⋮⋮"), el("span", "title", title));
  if (onClose) {
    const b = el("button", "", "✕");
    b.type = "button";
    b.setAttribute("aria-label", closeLabel);
    b.onclick = onClose;
    head.append(b);
  }
  return head;
}

function renderFloating() {
  const layer = $("widget-layer");
  layer.textContent = "";
  if (S.widgets.notes) S.notes.forEach((n) => layer.append(noteWidget(n)));
  if (S.widgets.todo) layer.append(todoWidget());
}

/* Notizen */
let noteSaveTimer;
const saveNotesSoon = () => { clearTimeout(noteSaveTimer); noteSaveTimer = setTimeout(() => save("notes"), 300); };

function noteWidget(n) {
  const w = el("div", "widget glass note");
  const head = widgetHead("", t("deleteNote"), () => {
    S.notes = S.notes.filter((x) => x.id !== n.id);
    save("notes"); w.remove();
  });
  const ta = el("textarea");
  ta.value = n.text;
  ta.placeholder = t("notePlaceholder");
  ta.setAttribute("aria-label", t("w_notes"));
  if (n.w) ta.style.width = `${n.w}px`;
  if (n.h) ta.style.height = `${n.h}px`;
  ta.addEventListener("input", () => { n.text = ta.value; saveNotesSoon(); });
  new ResizeObserver(() => {
    if (!ta.offsetWidth) return;
    n.w = ta.offsetWidth; n.h = ta.offsetHeight; saveNotesSoon();
  }).observe(ta);
  w.append(head, ta);
  makeDraggable(w, head, () => n.pos, (p) => { n.pos = p; save("notes"); });
  return w;
}
$("add-note").addEventListener("click", () => {
  const off = (S.notes.length % 6) * 0.025;
  const n = { id: uid(), text: "", pos: { x: 0.06 + off, y: 0.12 + off } };
  S.notes.push(n);
  save("notes");
  const w = noteWidget(n);
  $("widget-layer").append(w);
  requestAnimationFrame(() => w.querySelector("textarea").focus());
});

/* To-do */
function todoWidget() {
  const w = el("div", "widget glass todo");
  const head = widgetHead(t("todoTitle"));
  const list = el("ul");
  const draw = () => {
    list.textContent = "";
    if (!S.todo.length) { const e = el("li", "empty", t("todoEmpty")); list.append(e); }
    S.todo.forEach((item, i) => {
      const li = el("li", item.done ? "done" : "");
      const cb = el("input");
      cb.type = "checkbox";
      cb.checked = item.done;
      cb.onchange = () => { item.done = cb.checked; save("todo"); draw(); };
      const del = el("button", "", "✕");
      del.type = "button";
      del.setAttribute("aria-label", t("deleteTask"));
      del.onclick = () => { S.todo.splice(i, 1); save("todo"); draw(); };
      li.append(cb, el("span", "", item.text), del);
      list.append(li);
    });
  };
  const form = el("form");
  const input = el("input");
  input.placeholder = t("todoAdd");
  input.setAttribute("aria-label", t("todoAdd"));
  form.append(input);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    S.todo.push({ text, done: false });
    save("todo"); input.value = ""; draw();
  });
  draw();
  w.append(head, list, form);
  makeDraggable(w, head, () => S.positions.todo || { x: 0.76, y: 0.2 },
    (p) => { S.positions.todo = p; save("positions"); });
  return w;
}

/* Position des Schnellzugriffs: unter / über der Suche / frei */
/* --- Frei platzierbare Blöcke (Uhr, Schnellzugriff) ----------------------
   - gespeichert wird die MITTE (cx) und die Oberkante (y), relativ zur
     Fenstergröße -> bleibt mittig, egal wie breit der Block gerade ist
   - beim Ziehen rastet der Block an der Bildschirmmitte ein (Hilfslinien)
   - "dynamisch": landet ein Block auf Begrüßung, Suche oder einem anderen
     Block, weicht er automatisch nach oben oder unten aus */
const SNAP = 24;   // Abstand in Pixeln, ab dem eingerastet wird
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function clockPosDefault() {
  const p = S.positions.clock;
  return p && typeof p.cx === "number" ? p : { cx: 0.5, y: 0.05 };
}
function linksPosDefault() {
  const p = S.positions.links;
  if (p && typeof p.cx === "number") return p;
  const l = $("links");
  if (p && typeof p.x === "number") return { cx: p.x + l.offsetWidth / 2 / innerWidth, y: p.y };
  const below = S.widgets.search ? $("search").getBoundingClientRect().bottom + 24 : innerHeight * 0.55;
  return { cx: 0.5, y: below / innerHeight };
}

function visibleRect(id) {
  const n = $(id);
  if (!n || n.classList.contains("hidden") || !n.offsetWidth) return null;
  return n.getBoundingClientRect();
}
function overlaps(a, b, m = 12) {
  return a.left < b.right + m && a.right > b.left - m && a.top < b.bottom + m && a.bottom > b.top - m;
}
// Elemente, auf die ein freier Block nicht gelegt werden soll
function obstacles(extra) {
  const ids = ["greeting", "search", "add-note", "open-settings"];
  if (S.linksPos !== "free") ids.push("links");
  return [...ids.map(visibleRect).filter(Boolean), ...extra];
}
function placeFree(node, pos, extra = [], avoid = true) {
  const w = node.offsetWidth, h = node.offsetHeight;
  const cx = clamp(pos.cx * innerWidth, w / 2, Math.max(w / 2, innerWidth - w / 2));
  let top = clamp(pos.y * innerHeight, 0, Math.max(0, innerHeight - h));
  if (avoid) {
    const obs = obstacles(extra);
    for (let i = 0; i < 6; i++) {
      const r = { left: cx - w / 2, right: cx + w / 2, top, bottom: top + h };
      const hit = obs.find((o) => overlaps(r, o));
      if (!hit) break;
      const down = hit.bottom + 16, up = hit.top - 16 - h;
      const canDown = down + h <= innerHeight, canUp = up >= 0;
      if (canUp && (!canDown || Math.abs(up - top) <= Math.abs(down - top))) top = up;
      else if (canDown) top = down;
      else break;
    }
  }
  node.style.left = `${Math.round(cx)}px`;
  node.style.top = `${Math.round(top)}px`;
  return { left: cx - w / 2, right: cx + w / 2, top, bottom: top + h };
}

// alle freien Blöcke neu anordnen (Start, Fenstergröße, andere Kategorie …)
function layoutFree() {
  const placed = [];
  if (S.widgets.clock) placed.push(placeFree($("clock"), clockPosDefault()));
  if (S.linksPos === "free" && S.widgets.links) placeFree($("links"), linksPosDefault(), placed);
}

function guide(id, on, vertical) {
  let g = $(id);
  if (!g) {
    g = el("div", `snap-guide ${vertical ? "v" : "h"}`);
    g.id = id;
    document.body.append(g);
  }
  g.classList.toggle("on", on);
}

// Ziehen mit Einrasten; "key" = Name in S.positions
function setupFreeDrag(node, handle, key, canStart) {
  handle.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !canStart()) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    const startX = e.clientX, startY = e.clientY;
    const startCx = parseFloat(node.style.left) || innerWidth / 2;
    const startTop = parseFloat(node.style.top) || 0;
    node.classList.add("dragging");
    let snapX = false, snapY = false;
    const move = (ev) => {
      const w = node.offsetWidth, h = node.offsetHeight;
      let cx = startCx + ev.clientX - startX;
      let top = startTop + ev.clientY - startY;
      snapX = Math.abs(cx - innerWidth / 2) < SNAP;
      if (snapX) cx = innerWidth / 2;
      snapY = Math.abs(top + h / 2 - innerHeight / 2) < SNAP;
      if (snapY) top = innerHeight / 2 - h / 2;
      cx = clamp(cx, w / 2, innerWidth - w / 2);
      top = clamp(top, 0, innerHeight - h);
      node.style.left = `${Math.round(cx)}px`;
      node.style.top = `${Math.round(top)}px`;
      guide("guide-v", snapX, true);
      guide("guide-h", snapY, false);
    };
    const up = () => {
      handle.removeEventListener("pointermove", move);
      handle.removeEventListener("pointerup", up);
      handle.removeEventListener("pointercancel", up);
      node.classList.remove("dragging");
      guide("guide-v", false, true);
      guide("guide-h", false, false);
      S.positions[key] = {
        cx: snapX ? 0.5 : parseFloat(node.style.left) / innerWidth,
        y: parseFloat(node.style.top) / innerHeight,
      };
      save("positions");
      layoutFree();   // falls auf etwas anderem abgelegt: ausweichen
    };
    handle.addEventListener("pointermove", move);
    handle.addEventListener("pointerup", up);
    handle.addEventListener("pointercancel", up);
  });
}

/* Position des Schnellzugriffs: unter / über der Suche / frei */
let freeDragReady = false;
function applyLinksPos() {
  const links = $("links");
  const main = document.querySelector(".center");
  if (S.linksPos === "above") main.insertBefore(links, $("search"));
  else main.append(links);
  links.classList.toggle("free", S.linksPos === "free");
  $("s-linkspos-hint").classList.toggle("hidden", S.linksPos !== "free");
  if (!freeDragReady) {
    setupFreeDrag(links, $("links-grip"), "links", () => S.linksPos === "free");
    setupFreeDrag($("clock"), $("clock"), "clock", () => !S.clockLock);
    freeDragReady = true;
  }
  if (S.linksPos !== "free") { links.style.left = ""; links.style.top = ""; }
  requestAnimationFrame(layoutFree);
}

/* Uhr: Größe und Fixieren */
function applyClock() {
  const c = $("clock");
  c.style.setProperty("--clock-size", `${S.clockSize}px`);
  c.classList.toggle("locked", S.clockLock);
  c.title = S.clockLock ? "" : t("moveHint");
}

$("s-reset-pos").addEventListener("click", () => {
  S.positions = {};
  S.notes.forEach((n, i) => { n.pos = { x: 0.06 + (i % 6) * 0.025, y: 0.12 + (i % 6) * 0.025 }; });
  save("positions"); save("notes");
  renderFloating();
  applyLinksPos();
  saveQuick();
});

let resizeTimer;
addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    renderFloating();
    layoutFree();
  }, 150);
});

/* --- Hintergrund ------------------------------------------------------ */
/* Hintergrund ---------------------------------------------------------
   - Bilder werden beim Hochladen auf Bildschirmgröße verkleinert (JPEG),
     sonst müsste Firefox bei jedem neuen Tab mehrere MB lesen.
   - Ein winziges Vorschaubild liegt im schnellen Zwischenspeicher und ist
     sofort sichtbar; das echte Bild wird danach weich eingeblendet. */
const BG_THUMB = "windrad-bg-thumb";
function applyBgVars() {
  document.documentElement.style.setProperty("--dim", S.dim / 100);
  document.documentElement.style.setProperty("--bg-blur", `${S.blur}px`);
  $("bg").classList.toggle("blurred", S.blur > 0);   // Filter kostet Leistung, nur wenn nötig
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
function drawScaled(img, maxW, maxH, type, quality) {
  const scale = Math.min(1, maxW / img.naturalWidth, maxH / img.naturalHeight);
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL(type, quality);
}
function screenMax() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.min(3840, Math.max(1920, Math.round(screen.width * dpr)));
  const h = Math.min(2160, Math.max(1080, Math.round(screen.height * dpr)));
  return [w, h];
}
async function compressBackground(src) {
  const img = await loadImage(src);
  const [w, h] = screenMax();
  const out = drawScaled(img, w, h, "image/jpeg", 0.88);
  return out.length < src.length ? out : src;
}
function makeThumb(img) {
  const c = document.createElement("canvas");
  // 192 px breit und schon im Bild weichgezeichnet: beim Hochskalieren
  // wirkt es wie ein sanft unscharfes Foto statt wie Klötzchen
  const scale = 192 / Math.max(img.naturalWidth, img.naturalHeight);
  c.width = Math.max(1, Math.round(img.naturalWidth * scale));
  c.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.filter = "blur(5px)";
  // etwas größer zeichnen, damit der Weichzeichner keine hellen Ränder macht
  ctx.drawImage(img, -8, -8, c.width + 16, c.height + 16);
  return c.toDataURL("image/jpeg", 0.75);
}
const bgSig = (data) => `v2:${data.length}:${data.slice(-48)}`;
function showThumb(thumb) {
  const layer = $("bg-img");
  layer.style.backgroundImage = `url("${thumb}")`;
  layer.classList.add("thumb");
  $("bg").classList.add("has-image");
}
async function applyBackground() {
  applyBgVars();
  let data = await store.get("bgImage", null);
  const layer = $("bg-img");
  if (!data) {
    layer.style.backgroundImage = "";
    layer.classList.remove("thumb");
    $("bg").classList.remove("has-image");
    try { localStorage.removeItem(BG_THUMB); } catch {}
    return;
  }
  // alte, sehr große Bilder einmalig verkleinern
  if (data.length > 1500000) {
    try {
      const smaller = await compressBackground(data);
      if (smaller !== data) { data = smaller; store.set("bgImage", data); }
    } catch {}
  }
  try {
    const img = await loadImage(data);
    if (img.decode) await img.decode().catch(() => {});
    layer.style.backgroundImage = `url("${data}")`;
    layer.classList.remove("thumb");
    $("bg").classList.add("has-image");
    // Vorschaubild für den nächsten Tab aktualisieren
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(BG_THUMB) || "null"); } catch {}
    if (!cached || cached.sig !== bgSig(data)) {
      const thumb = makeThumb(img);
      try { localStorage.setItem(BG_THUMB, JSON.stringify({ sig: bgSig(data), thumb })); } catch {}
    }
  } catch {}
}
$("s-bg").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let data = reader.result;
    try { data = await compressBackground(data); } catch {}
    await store.set("bgImage", data);
    applyBackground();
  };
  reader.readAsDataURL(file);
  e.target.value = "";
});
$("s-bg-reset").addEventListener("click", async () => { await store.set("bgImage", null); applyBackground(); });
$("s-dim").addEventListener("input", (e) => { S.dim = +e.target.value; applyBgVars(); save("dim"); });
$("s-blur").addEventListener("input", (e) => { S.blur = +e.target.value; applyBgVars(); save("blur"); });

/* --- Einstellungs-Panel ---------------------------------------------- */
const WIDGET_KEYS = ["clock", "greeting", "search", "links", "notes", "todo"];
function renderWidgetSwitches() {
  const box = $("s-widgets");
  box.textContent = "";
  for (const k of WIDGET_KEYS) {
    const lab = el("label", "switch");
    const cb = el("input");
    cb.type = "checkbox";
    cb.checked = !!S.widgets[k];
    cb.onchange = () => { S.widgets[k] = cb.checked; save("widgets"); applyWidgets(); };
    lab.append(cb, el("span", "", t(`w_${k}`)));
    box.append(lab);
  }
}
function openSettings() {
  $("s-name").value = S.name;
  $("s-seconds").checked = S.seconds;
  $("s-names").checked = S.showNames;
  $("s-addtile").checked = S.addTile;
  $("s-gear").checked = S.gearHover;
  $("s-border").checked = S.tileBorder;
  $("s-glass").value = S.glass;  $("s-glass-val").textContent = `${S.glass}%`;
  $("s-tblur").value = S.tileBlur; $("s-tblur-val").textContent = `${S.tileBlur}px`;
  $("s-backup-msg").textContent = "";
  $("s-toast").checked = S.copyToast;
  $("s-copy-on").checked = S.copyEnabled;
  $("copy-opts").classList.toggle("hidden", !S.copyEnabled);
  $("s-clocksize").value = S.clockSize;
  $("s-clocksize-val").textContent = `${S.clockSize}px`;
  $("s-clocklock").checked = S.clockLock;
  showVersion();
  $("s-clean").checked = S.copyClean;
  $("s-shortcut-msg").textContent = "";
  showShortcut();
  renderShapePicker();
  syncColorInputs();
  $("s-dim").value = S.dim;
  $("s-blur").value = S.blur;
  renderWidgetSwitches();
  syncCategoryEditor();
  $("scrim").hidden = false;
  $("settings").classList.add("open");
  $("settings").setAttribute("aria-hidden", "false");
}
function closeSettings() {
  catDropdown.close();
  $("scrim").hidden = true;
  $("settings").classList.remove("open");
  $("settings").setAttribute("aria-hidden", "true");
}
$("open-settings").addEventListener("click", openSettings);
$("close-settings").addEventListener("click", closeSettings);
$("scrim").addEventListener("click", closeSettings);

$("s-name").addEventListener("input", (e) => { S.name = e.target.value.trim(); tick(); save("name"); });
$("s-seconds").addEventListener("change", (e) => { S.seconds = e.target.checked; tick(); save("seconds"); });
$("s-names").addEventListener("change", (e) => { S.showNames = e.target.checked; save("showNames"); renderLinks(); });

/* Sprache wechseln: alles neu beschriften */
function relabel() {
  applyI18n();
  tick();
  renderLinks();
  renderFloating();
  if ($("settings").classList.contains("open")) { renderWidgetSwitches(); syncCategoryEditor(); renderShapePicker(); showShortcut(); showVersion(); }
  applyClock();
  $("links-grip").title = t("moveHint");
}

/* --- Zeitmessung: in der Konsole (F12) des neuen Tabs sichtbar ---------- */
const T0 = performance.now();
function logTime(label) {
  console.info(`[Windrad] ${label}: ${Math.round(performance.now())} ms seit Tab-Start (Skript ab ${Math.round(T0)} ms)`);
}
requestAnimationFrame(() => requestAnimationFrame(() => logTime("erstes Bild")));

/* --- Sofort-Anzeige: Uhr & Begrüßung, bevor die Einstellungen geladen sind */
(() => {
  let q = {};
  try { q = JSON.parse(localStorage.getItem("windrad-quick") || "{}"); } catch {}
  for (const k of Object.keys(DEFAULTS)) S[k] = structuredClone(DEFAULTS[k]);
  Object.assign(S, q);
  S.widgets = { ...DEFAULTS.widgets, ...(q.widgets || {}) };
  document.documentElement.lang = S.lang;
  $("clock").classList.toggle("hidden", !S.widgets.clock);
  $("greeting").classList.toggle("hidden", !S.widgets.greeting);
  $("search").classList.toggle("hidden", !S.widgets.search);
  $("q").placeholder = t("searchPlaceholder");
  applyBgVars();
  applyClock();
  layoutFree();
  try {
    const th = JSON.parse(localStorage.getItem(BG_THUMB) || "null");
    if (th && th.thumb) showThumb(th.thumb);
  } catch {}
  tick();
  layoutFree();
})();

/* --- Start ------------------------------------------------------------ */
(async () => {
  await loadSettings();
  if (!HEX.test(S.color1)) S.color1 = DEFAULTS.color1;
  if (!HEX.test(S.color2)) S.color2 = DEFAULTS.color2;
  applyColors();
  applyI18n();
  applyBgVars();
  setupSegmented("s-lang", "lang", relabel);
  setupSegmented("s-size", "tileSize", renderLinks);
  setupSegmented("s-style", "tileStyle", renderLinks);
  setupSegmented("s-linkspos", "linksPos", applyLinksPos);
  setupSegmented("s-toastpos", "toastPos", () => windradToast(toastOpts("example.com")));
  $("links-grip").title = t("moveHint");
  applyGear();
  startClock();
  renderLinks();
  applyClock();
  applyWidgets();
  applyLinksPos();
  logTime("Einstellungen geladen & alles gezeichnet");
  applyBackground().then(() => logTime("Hintergrundbild fertig"));   // blockiert nichts
})();


/* ---- one set of colors with Windrad Flow -------------------------------
   Color 1 / Color 2 (and the language) are shared: change them in Flow's
   settings or here, and the other follows right away. */
if (hasExt && browser.storage.onChanged) {
  browser.storage.onChanged.addListener((c) => {
    let colors = false;
    for (const k of ["color1", "color2"]) {
      if (c[k] && HEX.test(c[k].newValue || "") && S[k] !== c[k].newValue) { S[k] = c[k].newValue; colors = true; }
    }
    if (colors) { applyColors(); if (typeof syncColorInputs === "function") syncColorInputs(); }
    if (c.lang && c.lang.newValue && c.lang.newValue !== S.lang && typeof applyI18n === "function") { S.lang = c.lang.newValue; applyI18n(); }
  });
}
