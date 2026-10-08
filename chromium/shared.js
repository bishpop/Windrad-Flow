/* =====================================================================
   Windrad Flow – shared settings, texts and helpers
   (used by the background, the command bar and the settings page)
   ===================================================================== */
"use strict";

// Firefox or a Chromium browser (Brave, Chrome, Edge …)?
const FLOW_IS_FIREFOX = !!(globalThis.browser && browser.runtime && browser.runtime.getBrowserInfo);

const FLOW_DEFAULTS = {
  lang: "en",
  color1: "#ff7a95",
  color2: "#4fe3e0",
  theme: "windrad",                         // chosen theme (built-in key or own theme id)
  customThemes: [],                         // [{ id, name, stops[4], accent, second, text, panel }]
  modules: { palette: true, archive: false, spaces: false, player: false, notes: false, boosts: false, youtube: false, volume: false, peek: false },
  archive: {
    hours: 12,                              // close tabs not used for this long
    keepAudible: true,                      // never archive tabs that play sound
    exclude: [],                            // domains that are never archived
    max: 300,                               // entries kept in the archive
  },
  spaces: [],                               // [{ id, name, emoji, color, container }]
  spacesAdvanced: false,                    // show the container option
  player: { position: "left", style: "minimal", colors: "theme", glass: true, video: true, videoMode: "pip" },   // style: minimal | standard · colors: theme | cover | palette key
  notesOpts: { autoOpen: false },           // open the note automatically on pages that have one             // left (next to vertical tabs) | right
  palette: {
    openIn: "newtab",                       // newtab | current
    sources: { tabs: true, bookmarks: true, history: true },
    engine: "https://www.google.com/search?q=%s",
  },
};

const FLOW_I18N = {
  en: {
    placeholder: "Search tabs, bookmarks, history or type > for commands",
    secTabs: "Open tabs", secCommands: "Commands", secBookmarks: "Bookmarks", secHistory: "History", secWeb: "Web",
    switchTo: "Switch to tab", open: "Open", run: "Run",
    searchFor: "Search “{q}”", openUrl: "Open {q}",
    hintMove: "navigate", hintOpen: "open", hintNewTab: "other tab mode", hintClose: "close", hintCommands: "commands",
    noResults: "Nothing found",
    // commands
    c_newTab: "New tab", c_newWindow: "New window", c_privateWindow: "New private window",
    c_closeTab: "Close tab", c_reopen: "Reopen closed tab", c_duplicate: "Duplicate tab",
    c_pin: "Pin / unpin tab", c_mute: "Mute / unmute tab", c_reload: "Reload tab",
    c_copyLink: "Copy link", c_moveWindow: "Move tab to new window", c_closeOthers: "Close other tabs",
    c_unloadOthers: "Unload other tabs (free memory)", c_bookmark: "Bookmark this page",
    c_reader: "Toggle reader view", c_settings: "Windrad Flow settings",
    copied: "Link copied",
    // settings page
    settingsTitle: "Windrad Flow – Settings", general: "General", language: "Language",
    colors: "Colors", color1: "Color 1", color2: "Color 2", resetColors: "Reset to pink / teal",
    modules: "Modules", modulesHint: "Switch every part on or off. Switched-off modules don't run at all.",
    m_palette: "Command bar", m_archive: "Auto-archive tabs", m_spaces: "Spaces", m_player: "Mini player",
    m_notes: "Notes per page", m_boosts: "Boosts", soon: "coming soon",
    paletteTitle: "Command bar", shortcut: "Shortcut", reset: "Reset", pressKeys: "Press keys …",
    shortcutSaved: "Shortcut saved.", shortcutInvalid: "Use Ctrl or Alt plus a key, e.g. Ctrl+Shift+Space.",
    shortcutConflict: "{key} is also used by Firefox. It may not work there – better pick another one.",
    openIn: "Open results in", openNew: "New tab", openCurrent: "Current tab",
    openInHint: "Hold Shift while pressing Enter to use the other option.",
    sources: "Search in", s_tabs: "Open tabs", s_bookmarks: "Bookmarks", s_history: "History",
    engine: "Search engine",
    paletteHint: "Also opens with a click on the Windrad Flow icon in the toolbar.",
    backup: "Backup", backupHint: "Saves all Windrad Flow settings to a file.",
    export: "Export", import: "Import", imported: "Backup imported.", importFailed: "This file is not a valid backup.",
    saved: "Saved", version: "Version {v}",
    // archive
    secArchive: "Archive", restore: "Restore", archivedAgo: "archived {t}",
    c_archiveNow: "Archive this tab", c_openArchive: "Open archive",
    archiveTitle: "Auto-archive", archiveAfter: "Archive tabs not used for",
    h1: "1 hour", h3: "3 hours", h6: "6 hours", h12: "12 hours", h24: "1 day", h48: "2 days", h168: "1 week",
    keepAudible: "Never archive tabs that play sound",
    archiveRules: "Pinned tabs, the active tab and the last tab of a window are never archived.",
    exclude: "Never archive these sites", excludeHint: "One domain per line, e.g. youtube.com",
    archiveList: "Archived tabs", archiveEmpty: "Nothing archived yet.", clearArchive: "Clear archive",
    confirmClear: "Delete all archived tabs?", remove: "Remove",
    justNow: "just now", minAgo: "{n} min ago", hAgo: "{n} h ago", dAgo: "{n} d ago",
    // spaces
    secSpaces: "Spaces", switchSpace: "Switch", currentSpace: "current",
    c_newSpace: "New space", c_nextSpace: "Next space", c_prevSpace: "Previous space",
    c_moveTo: "Move tab to “{name}”",
    spacesTitle: "Spaces", spacesHint: "Each space has its own tabs. Switching hides the tabs of the other spaces. Pinned tabs stay visible everywhere.",
    addSpace: "Add space", spaceName: "Name", container: "Container", noContainer: "No container",
    deleteSpace: "Delete space", confirmDeleteSpace: "Delete “{name}”? Its tabs move to “{first}”.",
    newSpaceName: "New space", homeSpace: "Home",
    moveUp: "Move up", moveDown: "Move down",
    playerTitle: "Mini player", playerHint: "While a tab plays sound and you're on another tab, a small player appears in the bottom corner. It doesn't show on about: pages and other extensions' pages.",
    playerPos: "Position", posRight: "Bottom right", posLeft: "Bottom left",
    plStyle: "Look", plTiny: "Tiny (Zen)", plMinimal: "Minimal", plStandard: "With cover",
    plColors: "Colors", plTheme: "My Flow colors", plCover: "Adaptive – from the cover", plColorsHint: "Adaptive takes the colors of the cover / thumbnail of what's playing.",
    plVideo: "Video window for YouTube", plVideoHint: "▣ in the player opens the YouTube video in a small window showing only the video – logged in, with uBlock and all your extensions, right-click + wheel volume included. Drag and resize it like any window; the mini player controls it. Close it and the YouTube tab continues at the same spot.",
    plVideoMode: "Video window as", plPip: "Picture-in-picture (always on top)", plWin: "Firefox window",
    plVideoModeHint: "Picture-in-picture (Firefox 151+) moves the real YouTube video into an always-on-top window – logged in, uBlock, everything. Firefox only opens it after a click in the YouTube tab, so ▣ takes you there for one click and brings you back. Also: the new button in YouTube's player bar. Firefox window: small window with the YouTube page, not always on top.",
    plDragHint: "Drag the player anywhere on the page – it remembers the spot.", plResetPos: "Put the player back in the corner",
    plPipTitle: "Watch the video in a small window", plPipHint: "Firefox has this built in: Picture-in-Picture. The video floats above everything, can be dragged and resized. On the video tab press Ctrl + Shift + ] – or let it open by itself when you switch tabs: about:config → media.videocontrols.picture-in-picture.enable-when-switching-tabs.enabled = true (if your Firefox has this entry).",
    changeShortcut: "Change", shortcutChromium: "In Chromium browsers shortcuts are changed on the browser's own page – click to open it.",
    m_peek: "Peek (link previews)", peekTitle: "Peek", peekHint: "Alt + click a link to see it in a floating window – or right-click → “Open in Peek”, or select text and press Alt + Shift + G to search it.",
    pkMode: "Show previews as", pkOverlay: "Floating in the page", pkPopup: "Popup window", pkTrigger: "Open with",
    pkSize: "Size", pkWidth: "Width", pkHeight: "Height", pkDim: "Dim the page behind", pkBlur: "Blur the page behind",
    pkOutside: "Close when clicking outside", pkCloseOnBlur: "Close the popup when you go back to the browser",
    pkModeHint: "Floating: like Zen, right in the page. Popup: a small real window – always logged in, works on every site.",
    pkUseLogin: "Stay logged in inside previews", pkKindFull: "With toolbar & extensions", pkKindSlim: "Slim (no bars)",
    pkLoginNote: "In floating previews you may not be logged in (Brave blocks cookies in embedded pages). The popup window always uses your login.",
    shortcutsTitle: "Keyboard shortcuts", shortcutsHint: "Click a shortcut and press the new keys. Esc cancels, ↺ resets it.",
    cmdMenu: "Open the Windrad Flow menu", cmdCopyUrlT: "Copy the page address", cmdPeekSearchT: "Peek: search selected text",
    theme: "Theme", chooseTheme: "Choose theme…", themeHint: "A theme sets Color 1 and Color 2 everywhere – in Flow, on your start page and (with “My theme”) on YouTube.",
    themesTitle: "Themes", builtIn: "Built-in", yourThemes: "Your themes", newTheme: "New theme", editTheme: "Edit theme",
    themeName: "Name", tAccent: "Color 1 (accent)", tSecond: "Color 2", tText: "Text", tStops: "Background gradient",
    save: "Save", cancel: "Cancel", close: "Close", y_myTheme: "My theme", deleteTheme: "Delete theme",
    moduleOn: "Module on", moduleOff: "This module is off. Switch it on to use it.", navOff: "off",
    c_youtube: "YouTube settings", m_youtube: "YouTube", m_volume: "Volume control",
    ytPlayback: "Playback", y_quality: "Always play in", y_qAuto: "Automatic (YouTube decides)",
    y_qHint: "If a video doesn't have that quality, the highest one below it is used (e.g. 4K → 1080p).",
    y_startVol: "Start every video with the same volume", y_startVolHint: "Applies when a video opens – change it during the video as you like, the next one starts at this volume again.",
    y_wheel: "Right mouse button + wheel changes the volume", y_step: "Step per wheel notch",
    y_wheelHint: "Hold the right mouse button anywhere on YouTube and scroll. With the module “Volume control” you can go above 100 %.",
    volTitle: "Volume control", volHint: "Make every tab louder or quieter, up to 400 % – in the Windrad Flow menu. Protected videos (e.g. Netflix) only go up to 100 %.",
    volRemember: "Remember the volume per website", volume: "Volume", volLimited: "This page only allows up to 100 %.", volReset: "Reset to 100 %",
    ytTitle: "YouTube", ytHint: "Changes show up right away in open YouTube tabs.",
    ytHide: "Hide", y_shorts: "Shorts (feed, sidebar, search, channel tab)", y_redirect: "Open Shorts as normal videos",
    y_comments: "Comments", y_related: "Recommendations next to the video", y_home: "Home page feed",
    y_chips: "Category chips (All, Music, Gaming …)", y_endcards: "End screens and info cards in the video",
    y_merch: "Merch and ticket shelves", y_chat: "Live chat", y_chatTheater: "Then play live streams in theater mode",
    ytDesign: "Design", y_colors: "Own colors", y_preset: "Palette", y_custom: "Custom",
    y_gradient: "Background like my theme (gradient)", y_glass: "Glass effect for bars and menus",
    yc_accent: "Main color", yc_bg: "Main background", yc_bg2: "Second background", yc_hover: "Hover background",
    yc_text: "Main text", yc_text2: "Dimmer text", yc_shadow: "Shadow",
    c_noteThis: "Note for this page", c_boostThis: "Boost this site", c_toggleDark: "Dark mode for this site on / off",
    darkTitle: "Dark mode", dkDarkness: "Darkness", dkBrightness: "Brightness", dkContrast: "Contrast", dkSepia: "Sepia", dkGray: "Grayscale",
    dkText: "Text color", dkTOriginal: "Original", dkTSoft: "Soft", dkTWhite: "White", dkTWarm: "Warm", dkTAccent: "Color 1", dkTCustom: "Custom",
    dkTCustomColor: "Your text color", dkTextOnDark: "Use the text color on pages that are already dark too", dkReset: "Reset dark mode", dkPreview: "Preview",
    darkAll: "Dark mode on all websites", darkAllHint: "Replaces extensions like Dark Reader. Pages that are already dark stay as they are. Switch it off for single sites in the Boost panel or with “Dark mode for this site on / off”.",
    darkTip: "Tip: In Firefox under Settings → General → Website appearance choose “Dark” – sites with their own dark design then use it, which looks even better.",
    notHere: "Firefox doesn't allow this on this page – try it on a normal website.",
    secNotes: "Notes", openNote: "Open note",
    notesTitle: "Notes per page", notesHint: "A note belongs to the whole site or only to one page. Open it with Ctrl + Alt + N, the command bar or the menu.",
    autoOpen: "Open notes automatically when a page has one", notesList: "Your notes", notesEmpty: "No notes yet.",
    boostsTitle: "Boosts", boostsHint: "Change a website the way you like it: hide elements, other font, size, colors, own CSS. Open it from the command bar or the menu on the site.",
    boostsList: "Your boosts", boostsEmpty: "No boosts yet.", zapped: "{n} hidden", custom: "custom",
    confirmDeleteNote: "Delete this note?", confirmDeleteBoost: "Remove the boost for {site}?",
    menuSearch: "Search or run a command …", thisPage: "This page", notOnPage: "Not available on this page",
    allCommands: "All commands", pa_note: "Note", pa_boost: "Boost", pa_dark: "Dark", pa_copy: "Copy link", pa_yt: "YouTube",
    q_newTab: "New tab", q_newWindow: "Window", q_private: "Private", q_reopen: "Reopen", q_duplicate: "Duplicate",
    q_pin: "Pin", q_closeOthers: "Close others", q_unload: "Unload others", nowPlaying: "Now playing", quickActions: "Quick actions",
    openSettings: "Settings", done: "Done", searchHint: "Ctrl + Space opens the floating search on web pages",
    noModulesHint: "Switch on more modules in the settings.",
    newContainer: "+ New container for this space",
    needPrivate: "Allow Windrad Flow in private windows first (about:addons → Windrad Flow → Run in Private Windows).",
    nothingClosed: "No closed tab to restore.", failed: "Didn't work",
    spaceHome: "Private", spaceStudy: "Study", spaceProjects: "Projects",
    advanced: "Advanced", containerHint: "Optional: a Firefox container per space, e.g. a separate Google account. New empty tabs in that space open in it.",
    spaceShortcuts: "Switch spaces with Ctrl + Alt + ← / → (“Next space” / “Previous space”) (change them in Firefox: about:addons → gear icon → Manage Extension Shortcuts).",
  },
  de: {
    placeholder: "Tabs, Lesezeichen, Verlauf durchsuchen oder > für Befehle",
    secTabs: "Offene Tabs", secCommands: "Befehle", secBookmarks: "Lesezeichen", secHistory: "Verlauf", secWeb: "Web",
    switchTo: "Zum Tab wechseln", open: "Öffnen", run: "Ausführen",
    searchFor: "„{q}“ suchen", openUrl: "{q} öffnen",
    hintMove: "auswählen", hintOpen: "öffnen", hintNewTab: "anderer Tab-Modus", hintClose: "schließen", hintCommands: "Befehle",
    noResults: "Nichts gefunden",
    c_newTab: "Neuer Tab", c_newWindow: "Neues Fenster", c_privateWindow: "Neues privates Fenster",
    c_closeTab: "Tab schließen", c_reopen: "Geschlossenen Tab wiederherstellen", c_duplicate: "Tab duplizieren",
    c_pin: "Tab anheften / lösen", c_mute: "Tab stumm / laut", c_reload: "Tab neu laden",
    c_copyLink: "Link kopieren", c_moveWindow: "Tab in neues Fenster verschieben", c_closeOthers: "Andere Tabs schließen",
    c_unloadOthers: "Andere Tabs entladen (Speicher freigeben)", c_bookmark: "Seite als Lesezeichen speichern",
    c_reader: "Leseansicht an / aus", c_settings: "Windrad-Flow-Einstellungen",
    copied: "Link kopiert",
    settingsTitle: "Windrad Flow – Einstellungen", general: "Allgemein", language: "Sprache",
    colors: "Farben", color1: "Farbe 1", color2: "Farbe 2", resetColors: "Auf Pink / Teal zurücksetzen",
    modules: "Module", modulesHint: "Jeden Teil einzeln an- oder ausschalten. Ausgeschaltete Module laufen gar nicht.",
    m_palette: "Befehlsleiste", m_archive: "Tabs automatisch archivieren", m_spaces: "Spaces", m_player: "Mini-Player",
    m_notes: "Notizen pro Seite", m_boosts: "Boosts", soon: "kommt bald",
    paletteTitle: "Befehlsleiste", shortcut: "Tastenkürzel", reset: "Zurücksetzen", pressKeys: "Tasten drücken …",
    shortcutSaved: "Tastenkürzel gespeichert.", shortcutInvalid: "Nimm Strg oder Alt plus eine Taste, z. B. Strg+Umschalt+Leertaste.",
    shortcutConflict: "{key} nutzt auch Firefox. Dort funktioniert es eventuell nicht – nimm besser ein anderes.",
    openIn: "Ergebnisse öffnen in", openNew: "Neuem Tab", openCurrent: "Aktuellem Tab",
    openInHint: "Mit Umschalt + Enter nimmst du jeweils die andere Variante.",
    sources: "Durchsuchen", s_tabs: "Offene Tabs", s_bookmarks: "Lesezeichen", s_history: "Verlauf",
    engine: "Suchmaschine",
    paletteHint: "Öffnet sich auch mit einem Klick auf das Windrad-Flow-Symbol in der Symbolleiste.",
    backup: "Sicherung", backupHint: "Speichert alle Windrad-Flow-Einstellungen in eine Datei.",
    export: "Exportieren", import: "Importieren", imported: "Sicherung importiert.", importFailed: "Diese Datei ist keine gültige Sicherung.",
    saved: "Gespeichert", version: "Version {v}",
    secArchive: "Archiv", restore: "Wiederherstellen", archivedAgo: "archiviert {t}",
    c_archiveNow: "Diesen Tab archivieren", c_openArchive: "Archiv öffnen",
    archiveTitle: "Automatisch archivieren", archiveAfter: "Tabs archivieren, die nicht benutzt wurden seit",
    h1: "1 Stunde", h3: "3 Stunden", h6: "6 Stunden", h12: "12 Stunden", h24: "1 Tag", h48: "2 Tagen", h168: "1 Woche",
    keepAudible: "Tabs mit Ton nie archivieren",
    archiveRules: "Angeheftete Tabs, der aktive Tab und der letzte Tab eines Fensters werden nie archiviert.",
    exclude: "Diese Seiten nie archivieren", excludeHint: "Eine Domain pro Zeile, z. B. youtube.com",
    archiveList: "Archivierte Tabs", archiveEmpty: "Noch nichts archiviert.", clearArchive: "Archiv leeren",
    confirmClear: "Alle archivierten Tabs löschen?", remove: "Entfernen",
    justNow: "gerade eben", minAgo: "vor {n} Min.", hAgo: "vor {n} Std.", dAgo: "vor {n} T.",
    secSpaces: "Spaces", switchSpace: "Wechseln", currentSpace: "aktuell",
    c_newSpace: "Neuer Space", c_nextSpace: "Nächster Space", c_prevSpace: "Vorheriger Space",
    c_moveTo: "Tab nach „{name}“ verschieben",
    spacesTitle: "Spaces", spacesHint: "Jeder Space hat eigene Tabs. Beim Wechseln werden die Tabs der anderen Spaces ausgeblendet. Angeheftete Tabs bleiben überall sichtbar.",
    addSpace: "Space hinzufügen", spaceName: "Name", container: "Container", noContainer: "Kein Container",
    deleteSpace: "Space löschen", confirmDeleteSpace: "„{name}“ löschen? Seine Tabs wandern nach „{first}“.",
    newSpaceName: "Neuer Space", homeSpace: "Zuhause",
    moveUp: "Nach oben", moveDown: "Nach unten",
    playerTitle: "Mini-Player", playerHint: "Spielt ein Tab Ton ab und du bist auf einem anderen Tab, erscheint unten in der Ecke ein kleiner Player. Auf about:-Seiten und Seiten anderer Erweiterungen ist er nicht zu sehen.",
    playerPos: "Position", posRight: "Unten rechts", posLeft: "Unten links",
    plStyle: "Aussehen", plTiny: "Winzig (Zen)", plMinimal: "Minimal", plStandard: "Mit Cover",
    plColors: "Farben", plTheme: "Meine Flow-Farben", plCover: "Adaptiv – vom Cover", plColorsHint: "Adaptiv nimmt die Farben vom Cover / Vorschaubild dessen, was gerade läuft.",
    plVideo: "Video-Fenster für YouTube", plVideoHint: "▣ im Player öffnet das YouTube-Video in einem kleinen Fenster, das nur das Video zeigt – eingeloggt, mit uBlock und all deinen Erweiterungen, inklusive Rechtsklick + Mausrad für die Lautstärke. Verschieben und Größe ändern wie bei jedem Fenster; der Mini-Player steuert es. Schließt du es, macht der YouTube-Tab an derselben Stelle weiter.",
    plVideoMode: "Video-Fenster als", plPip: "Bild-im-Bild (immer oben)", plWin: "Firefox-Fenster",
    plVideoModeHint: "Bild-im-Bild (ab Firefox 151) verschiebt das echte YouTube-Video in ein Fenster, das immer oben bleibt – eingeloggt, mit uBlock und allem. Firefox öffnet es nur nach einem Klick im YouTube-Tab, deshalb bringt dich ▣ für einen Klick dorthin und danach zurück. Außerdem: der neue Knopf in YouTubes Player-Leiste. Firefox-Fenster: kleines Fenster mit der YouTube-Seite, nicht immer oben.",
    plDragHint: "Zieh den Player an eine beliebige Stelle der Seite – er merkt sich den Platz.", plResetPos: "Player zurück in die Ecke",
    plPipTitle: "Video in einem kleinen Fenster sehen", plPipHint: "Das kann Firefox schon selbst: Bild-im-Bild. Das Video schwebt über allem, lässt sich verschieben und in der Größe ändern. Auf dem Video-Tab Strg + Umschalt + ] drücken – oder es beim Tab-Wechsel automatisch öffnen lassen: about:config → media.videocontrols.picture-in-picture.enable-when-switching-tabs.enabled = true (falls es den Eintrag bei dir gibt).",
    changeShortcut: "Ändern", shortcutChromium: "In Chromium-Browsern änderst du Kürzel auf der eigenen Seite des Browsers – klick, um sie zu öffnen.",
    m_peek: "Peek (Link-Vorschau)", peekTitle: "Peek", peekHint: "Alt + Klick auf einen Link zeigt ihn in einem schwebenden Fenster – oder Rechtsklick → „In Peek öffnen“, oder Text markieren und Alt + Umschalt + G zum Suchen.",
    pkMode: "Vorschau anzeigen als", pkOverlay: "Schwebend in der Seite", pkPopup: "Popup-Fenster", pkTrigger: "Öffnen mit",
    pkSize: "Größe", pkWidth: "Breite", pkHeight: "Höhe", pkDim: "Seite dahinter abdunkeln", pkBlur: "Seite dahinter weichzeichnen",
    pkOutside: "Schließen beim Klick daneben", pkCloseOnBlur: "Popup schließen, wenn du zurück in den Browser klickst",
    pkModeHint: "Schwebend: wie bei Zen, direkt in der Seite. Popup: ein kleines echtes Fenster – immer eingeloggt, funktioniert auf jeder Seite.",
    pkUseLogin: "In Vorschauen eingeloggt bleiben", pkKindFull: "Mit Leisten & Erweiterungen", pkKindSlim: "Schlank (ohne Leisten)",
    pkLoginNote: "In schwebenden Vorschauen bist du eventuell nicht eingeloggt (Brave blockiert Cookies in eingebetteten Seiten). Das Popup-Fenster nutzt immer deinen Login.",
    shortcutsTitle: "Tastenkürzel", shortcutsHint: "Auf ein Kürzel klicken und die neuen Tasten drücken. Esc bricht ab, ↺ setzt zurück.",
    cmdMenu: "Windrad-Flow-Menü öffnen", cmdCopyUrlT: "Adresse der Seite kopieren", cmdPeekSearchT: "Peek: markierten Text suchen",
    theme: "Theme", chooseTheme: "Theme wählen…", themeHint: "Ein Theme setzt Farbe 1 und Farbe 2 überall – in Flow, auf deiner Startseite und (mit „Mein Theme“) auf YouTube.",
    themesTitle: "Themes", builtIn: "Mitgeliefert", yourThemes: "Deine Themes", newTheme: "Neues Theme", editTheme: "Theme bearbeiten",
    themeName: "Name", tAccent: "Farbe 1 (Akzent)", tSecond: "Farbe 2", tText: "Text", tStops: "Hintergrund-Verlauf",
    save: "Speichern", cancel: "Abbrechen", close: "Schließen", y_myTheme: "Mein Theme", deleteTheme: "Theme löschen",
    moduleOn: "Modul an", moduleOff: "Dieses Modul ist aus. Schalte es ein, um es zu nutzen.", navOff: "aus",
    c_youtube: "YouTube-Einstellungen", m_youtube: "YouTube", m_volume: "Lautstärkeregler",
    ytPlayback: "Wiedergabe", y_quality: "Immer abspielen in", y_qAuto: "Automatisch (YouTube entscheidet)",
    y_qHint: "Hat ein Video diese Qualität nicht, wird die höchste darunter genommen (z. B. 4K → 1080p).",
    y_startVol: "Jedes Video mit gleicher Lautstärke starten", y_startVolHint: "Gilt beim Öffnen eines Videos – währenddessen kannst du sie frei ändern, das nächste startet wieder mit diesem Wert.",
    y_wheel: "Rechte Maustaste + Mausrad ändert die Lautstärke", y_step: "Schritt pro Mausrad-Raste",
    y_wheelHint: "Rechte Maustaste irgendwo auf YouTube gedrückt halten und scrollen. Mit dem Modul „Lautstärkeregler“ geht es auch über 100 %.",
    volTitle: "Lautstärkeregler", volHint: "Jeden Tab lauter oder leiser machen, bis 400 % – im Windrad-Flow-Menü. Geschützte Videos (z. B. Netflix) gehen nur bis 100 %.",
    volRemember: "Lautstärke pro Website merken", volume: "Lautstärke", volLimited: "Diese Seite erlaubt nur bis 100 %.", volReset: "Auf 100 % zurücksetzen",
    ytTitle: "YouTube", ytHint: "Änderungen erscheinen sofort in offenen YouTube-Tabs.",
    ytHide: "Ausblenden", y_shorts: "Shorts (Feed, Seitenleiste, Suche, Kanal-Reiter)", y_redirect: "Shorts als normale Videos öffnen",
    y_comments: "Kommentare", y_related: "Empfehlungen neben dem Video", y_home: "Feed auf der Startseite",
    y_chips: "Kategorie-Chips (Alle, Musik, Gaming …)", y_endcards: "Endcards und Infokarten im Video",
    y_merch: "Merch- und Ticket-Regale", y_chat: "Live-Chat", y_chatTheater: "Livestreams dann im Kinomodus abspielen",
    ytDesign: "Design", y_colors: "Eigene Farben", y_preset: "Palette", y_custom: "Eigene",
    y_gradient: "Hintergrund wie mein Theme (Verlauf)", y_glass: "Glas-Effekt für Leisten und Menüs",
    yc_accent: "Hauptfarbe", yc_bg: "Haupthintergrund", yc_bg2: "Zweiter Hintergrund", yc_hover: "Hover-Hintergrund",
    yc_text: "Haupttext", yc_text2: "Gedämpfter Text", yc_shadow: "Schatten",
    c_noteThis: "Notiz zu dieser Seite", c_boostThis: "Diese Seite boosten", c_toggleDark: "Dunkelmodus für diese Seite an / aus",
    darkTitle: "Dunkelmodus", dkDarkness: "Dunkelheit", dkBrightness: "Helligkeit", dkContrast: "Kontrast", dkSepia: "Sepia", dkGray: "Graustufen",
    dkText: "Schriftfarbe", dkTOriginal: "Original", dkTSoft: "Weich", dkTWhite: "Weiß", dkTWarm: "Warm", dkTAccent: "Farbe 1", dkTCustom: "Eigene",
    dkTCustomColor: "Deine Schriftfarbe", dkTextOnDark: "Schriftfarbe auch auf Seiten verwenden, die schon dunkel sind", dkReset: "Dunkelmodus zurücksetzen", dkPreview: "Vorschau",
    darkAll: "Dunkelmodus auf allen Websites", darkAllHint: "Ersetzt Erweiterungen wie Dark Reader. Seiten, die schon dunkel sind, bleiben unverändert. Für einzelne Seiten abschalten im Boost-Panel oder mit „Dunkelmodus für diese Seite an / aus“.",
    darkTip: "Tipp: In Firefox unter Einstellungen → Allgemein → Aussehen von Websites „Dunkel“ wählen – Seiten mit eigenem dunklen Design nutzen es dann, das sieht noch besser aus.",
    notHere: "Firefox erlaubt das auf dieser Seite nicht – probier es auf einer normalen Website.",
    secNotes: "Notizen", openNote: "Notiz öffnen",
    notesTitle: "Notizen pro Seite", notesHint: "Eine Notiz gehört zur ganzen Website oder nur zu einer Seite. Öffnen mit Strg + Alt + N, über die Befehlsleiste oder das Menü.",
    autoOpen: "Notizen automatisch öffnen, wenn eine Seite eine hat", notesList: "Deine Notizen", notesEmpty: "Noch keine Notizen.",
    boostsTitle: "Boosts", boostsHint: "Pass eine Website an, wie du sie magst: Elemente ausblenden, andere Schrift, Größe, Farben, eigenes CSS. Öffnen über die Befehlsleiste oder das Menü auf der Seite.",
    boostsList: "Deine Boosts", boostsEmpty: "Noch keine Boosts.", zapped: "{n} ausgeblendet", custom: "eigenes CSS",
    confirmDeleteNote: "Diese Notiz löschen?", confirmDeleteBoost: "Boost für {site} entfernen?",
    menuSearch: "Suchen oder Befehl ausführen …", thisPage: "Diese Seite", notOnPage: "Auf dieser Seite nicht verfügbar",
    allCommands: "Alle Befehle", pa_note: "Notiz", pa_boost: "Boost", pa_dark: "Dunkel", pa_copy: "Link kopieren", pa_yt: "YouTube",
    q_newTab: "Neuer Tab", q_newWindow: "Fenster", q_private: "Privat", q_reopen: "Zurückholen", q_duplicate: "Duplizieren",
    q_pin: "Anheften", q_closeOthers: "Andere schließen", q_unload: "Andere entladen", nowPlaying: "Läuft gerade", quickActions: "Schnellaktionen",
    openSettings: "Einstellungen", done: "Erledigt", searchHint: "Strg + Leertaste öffnet auf Webseiten die schwebende Suche",
    noModulesHint: "Weitere Module kannst du in den Einstellungen einschalten.",
    newContainer: "+ Neuer Container für diesen Space",
    needPrivate: "Erlaube Windrad Flow zuerst in privaten Fenstern (about:addons → Windrad Flow → In privaten Fenstern ausführen).",
    nothingClosed: "Kein geschlossener Tab zum Wiederherstellen.", failed: "Hat nicht geklappt",
    spaceHome: "Privat", spaceStudy: "Uni", spaceProjects: "Projekte",
    advanced: "Erweitert", containerHint: "Optional: ein Firefox-Container pro Space, z. B. ein eigenes Google-Konto. Neue leere Tabs in diesem Space öffnen sich darin.",
    spaceShortcuts: "Spaces wechselst du mit Strg + Alt + ← / → („Nächster Space“ / „Vorheriger Space“) (änderbar in Firefox: about:addons → Zahnrad → Tastenkürzel für Erweiterungen verwalten).",
  },
};

const FLOW_HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

async function flowLoad() {
  const raw = await browser.storage.local.get(Object.keys(FLOW_DEFAULTS)).catch(() => ({}));
  const S = structuredClone(FLOW_DEFAULTS);
  for (const k of Object.keys(FLOW_DEFAULTS)) {
    if (raw[k] === undefined) continue;
    S[k] = typeof FLOW_DEFAULTS[k] === "object" && !Array.isArray(FLOW_DEFAULTS[k])
      ? { ...FLOW_DEFAULTS[k], ...raw[k] } : raw[k];
  }
  S.palette.sources = { ...FLOW_DEFAULTS.palette.sources, ...(raw.palette && raw.palette.sources) };
  if (!Array.isArray(S.spaces)) S.spaces = [];
  if (!Array.isArray(S.customThemes)) S.customThemes = [];
  flowSetThemes(S.theme, S.customThemes);
  for (const k of ["color1", "color2"]) if (!FLOW_HEX.test(S[k])) S[k] = FLOW_DEFAULTS[k];
  return S;
}

function flowT(S, key, vars = {}) {
  let s = (FLOW_I18N[S.lang] || FLOW_I18N.en)[key] ?? FLOW_I18N.en[key] ?? key;
  for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

function flowApplyColors(S, root = document.documentElement) {
  root.style.setProperty("--accent", S.color1);
  root.style.setProperty("--teal", S.color2);
}

// small DOM helper without innerHTML: el("div", "cls", child, "text" …)
function flowEl(tag, cls, ...kids) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  n.append(...kids.filter((k) => k !== null && k !== undefined));
  return n;
}

const FLOW_ICON_PATHS = {
  tab:      "M3 5h18v14H3zm2 4v8h14V9z",
  command:  "M7 4a3 3 0 1 0 0 6h2v4H7a3 3 0 1 0 3 3v-2h4v2a3 3 0 1 0 3-3h-2v-4h2a3 3 0 1 0-3-3v2h-4V7a3 3 0 0 0-3-3m0 2a1 1 0 0 1 1 1v1H7a1 1 0 0 1 0-2m10 0a1 1 0 0 1 0 2h-1V7a1 1 0 0 1 1-1m-7 4h4v4h-4zm-3 6h1v1a1 1 0 1 1-1-1m9 0h1a1 1 0 1 1-1 1z",
  bookmark: "M6 3h12v18l-6-4-6 4z",
  history:  "M13 3a9 9 0 0 0-9 9H1l4 4 4-4H6a7 7 0 1 1 2.1 5l-1.4 1.4A9 9 0 1 0 13 3m-1 5v5l4.3 2.5.7-1.2-3.5-2.1V8z",
  search:   "M10.5 3a7.5 7.5 0 0 1 6 12l4.7 4.7-1.5 1.5-4.7-4.7A7.5 7.5 0 1 1 10.5 3m0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11",
  globe:    "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m6.9 6h-3a15 15 0 0 0-1.4-3.9A8 8 0 0 1 18.9 8M12 4c.8 1.2 1.5 2.5 1.9 4h-3.8c.4-1.5 1.1-2.8 1.9-4M4.3 14a8 8 0 0 1 0-4h3.4a16 16 0 0 0 0 4zm.8 2h3a15 15 0 0 0 1.4 3.9A8 8 0 0 1 5.1 16m3-8h-3a8 8 0 0 1 4.4-3.9A15 15 0 0 0 8.1 8M12 20c-.8-1.2-1.5-2.5-1.9-4h3.8c-.4 1.5-1.1 2.8-1.9 4m2.3-6H9.7a14 14 0 0 1 0-4h4.6a14 14 0 0 1 0 4m.2 5.9a15 15 0 0 0 1.4-3.9h3a8 8 0 0 1-4.4 3.9m1.8-5.9a16 16 0 0 0 0-4h3.4a8 8 0 0 1 0 4z",
};
Object.assign(FLOW_ICON_PATHS, {
  plus:     "M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z",
  window:   "M3 4h18v16H3zm2 4v10h14V8z",
  private:  "M12 5c-4.4 0-8 2.5-9.5 6 1.5 3.5 5.1 6 9.5 6s8-2.5 9.5-6C20 7.5 16.4 5 12 5m-4 7.5a2 2 0 1 1 0-4 2 2 0 0 1 0 4m8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4",
  close:    "m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z",
  undo:     "M12.5 8c-2.7 0-5.1 1-7 2.6L2 7v9h9l-3.6-3.6c1.4-1.2 3.2-1.9 5.1-1.9 3.5 0 6.5 2.3 7.6 5.5l2.4-.8C21.1 11 17.2 8 12.5 8",
  copy:     "M8 7V3h12v14h-4v4H4V7zm2 0h6v8h2V5h-8zM6 9v10h8V9z",
  pin:      "M16 3v2h-1v6l3 3v2h-5v5h-2v-5H6v-2l3-3V5H8V3z",
  volume:   "M3 9v6h4l5 5V4L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4",
  reload:   "M12 4a8 8 0 0 1 7.4 5H17v2h6V5h-2v2.3A10 10 0 1 0 22 12h-2a8 8 0 1 1-8-8z",
  link:     "M10.6 13.4a1 1 0 0 1 0-1.4l3.5-3.5a1 1 0 1 1 1.4 1.4L12 13.4a1 1 0 0 1-1.4 0M7 16.9a3 3 0 0 1 0-4.2l2-2-1.4-1.4-2 2a5 5 0 0 0 7.1 7.1l2-2-1.4-1.4-2 2a3 3 0 0 1-4.3-.1M17 7.1a3 3 0 0 1 0 4.2l-2 2 1.4 1.4 2-2a5 5 0 0 0-7.1-7.1l-2 2 1.4 1.4 2-2a3 3 0 0 1 4.3.1",
  external: "M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14zM5 5h6v2H7v10h10v-4h2v6H5z",
  broom:    "m19.4 3.2 1.4 1.4-6.1 6.1 1.7 1.7-1.4 1.4-.6-.6-6.5 6.5c-.8.8-2 .8-2.8 0l-1.4-1.4 7.9-7.9-.6-.6 1.4-1.4 1.7 1.7z",
  moon:     "M12.3 3a8 8 0 1 0 8.7 10.2A7 7 0 0 1 12.3 3",
  star:     "m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  book:     "M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zm16 0h-5a3 3 0 0 0-1 .2V20a2 2 0 0 1 2-2h4z",
  archive:  "M3 4h18v4H3zm1 5h16v11H4zm5 3v2h6v-2z",
  gear:     "M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3.3h-4l-.4 2.6a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.4 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7",
  play:     "M8 5v14l11-7z", pause: "M6 5h4v14H6zm8 0h4v14h-4z",
  prev:     "M6 6h2v12H6zm3.5 6 8.5 6V6z", next: "M16 6h2v12h-2zM6 18l8.5-6L6 6z",
  note:     "M5 3h11l4 4v14H5zm2 2v14h11V8h-3V5zm2 6h7v2H9zm0 4h7v2H9z",
  bolt:     "M13 2 4 14h6l-1 8 9-12h-6z",
  muted:    "M3 9v6h4l5 5V4L7 9zm13.6 3 2.1-2.1-1.4-1.4-2.1 2.1-2.1-2.1-1.4 1.4 2.1 2.1-2.1 2.1 1.4 1.4 2.1-2.1 2.1 2.1 1.4-1.4z",
});
const FLOW_CMD_ICONS = {
  newTab: "plus", newWindow: "window", privateWindow: "private", closeTab: "close", reopen: "undo",
  duplicate: "copy", pin: "pin", mute: "volume", reload: "reload", copyLink: "link", moveWindow: "external",
  closeOthers: "broom", unloadOthers: "moon", bookmark: "star", reader: "book", archiveNow: "archive",
  openArchive: "archive", noteThis: "note", boostThis: "bolt", toggleDark: "moon", youtube: "play", newSpace: "plus", nextSpace: "next", prevSpace: "prev", settings: "gear",
};

function flowIcon(name) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const p = document.createElementNS(NS, "path");
  p.setAttribute("fill", "currentColor");
  p.setAttribute("d", FLOW_ICON_PATHS[name] || FLOW_ICON_PATHS.globe);
  svg.append(p);
  return svg;
}

function flowHost(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } }

function flowAgo(S, ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return flowT(S, "justNow");
  if (m < 60) return flowT(S, "minAgo", { n: m });
  const h = Math.round(m / 60);
  if (h < 48) return flowT(S, "hAgo", { n: h });
  return flowT(S, "dAgo", { n: Math.round(h / 24) });
}

/* Commands shown in the command bar. They RUN in the background, so they
   still finish when the toolbar popup closes right after you pick one. */
const FLOW_COMMANDS = [
  { id: "newTab",        keys: "new tab neuer" },
  { id: "newWindow",     keys: "new window neues fenster" },
  { id: "privateWindow", keys: "private incognito privat" },
  { id: "closeTab",      keys: "close schließen" },
  { id: "reopen",        keys: "reopen restore undo wiederherstellen" },
  { id: "duplicate",     keys: "duplicate copy duplizieren" },
  { id: "pin",           keys: "pin unpin anheften lösen" },
  { id: "mute",          keys: "mute sound stumm ton" },
  { id: "reload",        keys: "reload refresh neu laden" },
  { id: "copyLink",      keys: "copy link url kopieren" },
  { id: "moveWindow",    keys: "move window detach verschieben fenster" },
  { id: "closeOthers",   keys: "close other andere schließen" },
  { id: "unloadOthers",  keys: "unload discard memory sleep entladen speicher" },
  { id: "bookmark",      keys: "bookmark save lesezeichen speichern" },
  { id: "reader",        keys: "reader read lesen leseansicht", firefoxOnly: true },
  { id: "archiveNow",    keys: "archive archivieren", module: "archive" },
  { id: "openArchive",   keys: "archive archiv öffnen", module: "archive" },
  { id: "newSpace",      keys: "space new neu", module: "spaces", firefoxOnly: true },
  { id: "nextSpace",     keys: "space next nächster", module: "spaces" },
  { id: "prevSpace",     keys: "space previous vorheriger", module: "spaces" },
  { id: "noteThis",      keys: "note notes notiz notizen", module: "notes" },
  { id: "boostThis",     keys: "boost zap hide style css anpassen ausblenden", module: "boosts" },
  { id: "toggleDark",    keys: "dark mode night dunkel dunkelmodus nacht", module: "boosts" },
  { id: "youtube",       keys: "youtube shorts farben colors yt", module: "youtube" },
  { id: "settings",      keys: "settings options einstellungen flow" },
];

/* ---------------- YouTube ------------------------------------------------- */
// the palettes of the Windrad theme: 4 gradient stops, accent, 2nd color, text, panel
const FLOW_PALETTES = {
  windrad:  { name: "Windrad",        stops: ["#0f2a3a", "#1d2a4a", "#2c2144", "#321f3c"], accent: "#ff7a95", second: "#4fe3e0", text: "#eee7f6", panel: "#142636" },
  aurora:   { name: "Aurora",         stops: ["#0b1f2a", "#0f2a33", "#12303a", "#1a2f3f"], accent: "#5fe0a8", second: "#8b9cff", text: "#e6f4ef", panel: "#10262a" },
  lavender: { name: "Lavender Night", stops: ["#16142b", "#1e1a3a", "#2a2048", "#32213f"], accent: "#b18cff", second: "#ff9ccf", text: "#eeeaf8", panel: "#1c1932" },
  ember:    { name: "Ember",          stops: ["#1c1512", "#251a16", "#2e1d18", "#351f1a"], accent: "#ff9a5c", second: "#ffd166", text: "#f5ece6", panel: "#241a16" },
  deepsea:  { name: "Deep Sea",       stops: ["#0a1418", "#0c1b22", "#0e212b", "#112432"], accent: "#4cc9f0", second: "#7b8cff", text: "#e4f2f7", panel: "#0f1d24" },
  cherry:   { name: "Cherry Blossom", stops: ["#1d1622", "#251a2a", "#2e1d31", "#361f33"], accent: "#ffa3c4", second: "#a8e6cf", text: "#f6edf2", panel: "#22192a" },
  graphite: { name: "Graphite",       stops: ["#141618", "#181b1e", "#1c1f23", "#202327"], accent: "#7aa2ff", second: "#c6a0ff", text: "#eceef1", panel: "#1a1d20" },
};
function flowMix(a, b, t) {            // mix two hex colors, t = share of b
  const h = (x) => (x.length === 4 ? "#" + [...x.slice(1)].map((c) => c + c).join("") : x);
  const p = (x) => [1, 3, 5].map((i) => parseInt(h(x).slice(i, i + 2), 16));
  const [A, Bc] = [p(a), p(b)];
  return "#" + A.map((v, i) => Math.round(v + (Bc[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
// the 7 YouTube colors derived from a palette (same fields as Enhancer for YouTube)
/* ---- themes: the built-in palettes + your own ones ------------------------
   "theme" (in YouTube / player settings) means: the theme chosen in Flow. */
let FLOW_THEME_ID = "windrad", FLOW_CUSTOM_THEMES = [];
function flowSetThemes(id, custom) {
  FLOW_THEME_ID = id || "windrad";
  FLOW_CUSTOM_THEMES = Array.isArray(custom) ? custom : [];
}
function flowAllThemes() {
  const out = {};
  for (const [k, p] of Object.entries(FLOW_PALETTES)) out[k] = p;
  for (const t of FLOW_CUSTOM_THEMES) if (t && t.id) out[t.id] = t;
  return out;
}
function flowPaletteFor(key) {
  const all = flowAllThemes();
  if (key === "theme") key = FLOW_THEME_ID;
  return all[key] || FLOW_PALETTES.windrad;
}
function flowYtColors(key) {
  const P = flowPaletteFor(key);
  return {
    accent: P.accent, bg: P.stops[0], bg2: P.stops[2], hover: flowMix(P.stops[2], P.accent, 0.12),
    text: P.text, text2: flowMix(P.text, P.stops[0], 0.25), shadow: flowMix(P.stops[0], "#000000", 0.5),
  };
}
const FLOW_YT_DEFAULTS = {
  hide: { shorts: true, redirect: true, comments: false, related: false, home: false, chips: false,
          endcards: false, merch: true, chat: false, chatTheater: true },
  colors: false, preset: "theme", custom: flowYtColors("windrad"), gradient: true, glass: true,
  quality: "auto",          // auto | 4320 | 2160 | 1440 | 1080 | 720 | 480 | 360
  startVolume: false,       // every video starts with the same volume …
  startVolumeValue: 20,     // … this one (%)
  wheel: true,              // right mouse button held + wheel = volume
  step: 5,                  // % per wheel step
};

/* ---------------- dark mode (Dark Reader–style filter) --------------------
   The page gets: invert(1) hue-rotate(180deg) contrast() brightness()
   sepia() grayscale(). Pictures/videos get the exact inverse of the first
   four, so they look normal. The text color is pre-computed through the
   inverse of the whole chain, so it ends up exactly as chosen on screen. */
const FLOW_DARK_DEFAULTS = {
  darkness: 80,        // 0 = dark grey background … 100 = pure black
  brightness: 100,     // 50 – 150 %
  contrast: 100,       // 50 – 150 %
  sepia: 0,            // 0 – 100 %
  grayscale: 0,        // 0 – 100 %
  text: "original",    // original | soft | white | warm | accent | custom
  textColor: "#e6e6e9",
  textOnDark: false,   // also recolor text on pages that are dark by themselves
};
const FLOW_TEXT_PRESETS = { soft: "#d6d6dc", white: "#ffffff", warm: "#efe3cf" };

function flowDarkParams(d) {
  d = { ...FLOW_DARK_DEFAULTS, ...(d || {}) };
  // darkness lifts the black of the background via contrast (0.62 … 1)
  const c = Math.max(0.3, (0.62 + 0.38 * d.darkness / 100) * (d.contrast / 100));
  const b = Math.max(0.3, d.brightness / 100);
  return { d, c, b, sepia: d.sepia / 100, gray: d.grayscale / 100 };
}
function flowDarkFilters(dark) {
  const p = flowDarkParams(dark);
  const tail = [p.sepia ? `sepia(${p.sepia})` : "", p.gray ? `grayscale(${p.gray})` : ""].filter(Boolean).join(" ");
  return {
    page: `invert(1) hue-rotate(180deg) contrast(${p.c.toFixed(3)}) brightness(${p.b.toFixed(3)})${tail ? " " + tail : ""}`,
    media: `brightness(${(1 / p.b).toFixed(3)}) contrast(${(1 / p.c).toFixed(3)}) hue-rotate(180deg) invert(1)`,
    bg: flowDarkScreenColor(dark, "#ffffff"),       // what a white page turns into
  };
}

// affine color maps: { m: 3x3, o: [3] }  ->  v' = m·v + o
function _aff(m, o) { return { m, o: o || [0, 0, 0] }; }
function _compose(A, B) {          // first A, then B
  const m = [0, 1, 2].map((i) => [0, 1, 2].map((j) => B.m[i][0] * A.m[0][j] + B.m[i][1] * A.m[1][j] + B.m[i][2] * A.m[2][j]));
  const o = [0, 1, 2].map((i) => B.m[i][0] * A.o[0] + B.m[i][1] * A.o[1] + B.m[i][2] * A.o[2] + B.o[i]);
  return { m, o };
}
function _darkChain(dark) {
  const p = flowDarkParams(dark);
  const I3 = (k) => [[k, 0, 0], [0, k, 0], [0, 0, k]];
  const cs = Math.cos(Math.PI), sn = Math.sin(Math.PI);
  const hue = [
    [0.213 + cs * 0.787 - sn * 0.213, 0.715 - cs * 0.715 - sn * 0.715, 0.072 - cs * 0.072 + sn * 0.928],
    [0.213 - cs * 0.213 + sn * 0.143, 0.715 + cs * 0.285 + sn * 0.140, 0.072 - cs * 0.072 - sn * 0.283],
    [0.213 - cs * 0.213 - sn * 0.787, 0.715 - cs * 0.715 + sn * 0.715, 0.072 + cs * 0.928 + sn * 0.072],
  ];
  const s = 1 - p.sepia, g = 1 - p.gray;
  const sepia = [
    [0.393 + 0.607 * s, 0.769 - 0.769 * s, 0.189 - 0.189 * s],
    [0.349 - 0.349 * s, 0.686 + 0.314 * s, 0.168 - 0.168 * s],
    [0.272 - 0.272 * s, 0.534 - 0.534 * s, 0.131 + 0.869 * s],
  ];
  const gray = [
    [0.2126 + 0.7874 * g, 0.7152 - 0.7152 * g, 0.0722 - 0.0722 * g],
    [0.2126 - 0.2126 * g, 0.7152 + 0.2848 * g, 0.0722 - 0.0722 * g],
    [0.2126 - 0.2126 * g, 0.7152 - 0.7152 * g, 0.0722 + 0.9278 * g],
  ];
  let A = _aff(I3(-1), [1, 1, 1]);                                  // invert(1)
  A = _compose(A, _aff(hue));                                       // hue-rotate(180deg)
  A = _compose(A, _aff(I3(p.c), [0.5 - 0.5 * p.c, 0.5 - 0.5 * p.c, 0.5 - 0.5 * p.c]));
  A = _compose(A, _aff(I3(p.b)));
  if (p.sepia) A = _compose(A, _aff(sepia));
  if (p.gray) A = _compose(A, _aff(gray));
  return A;
}
const _hexRgb = (h) => { h = h.length === 4 ? "#" + [...h.slice(1)].map((c) => c + c).join("") : h; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };
const _rgbHex = (v) => "#" + v.map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0")).join("");
function flowDarkScreenColor(dark, hex) {         // page color -> color seen on screen
  const A = _darkChain(dark), v = _hexRgb(hex);
  return _rgbHex([0, 1, 2].map((i) => A.m[i][0] * v[0] + A.m[i][1] * v[1] + A.m[i][2] * v[2] + A.o[i]));
}
function flowDarkSourceColor(dark, hex) {         // wanted screen color -> color to set in the page
  const A = _darkChain(dark), t = _hexRgb(hex).map((x, i) => x - A.o[i]), m = A.m;
  const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  if (Math.abs(det) < 1e-6) return hex;
  const inv = [
    [(m[1][1] * m[2][2] - m[1][2] * m[2][1]) / det, (m[0][2] * m[2][1] - m[0][1] * m[2][2]) / det, (m[0][1] * m[1][2] - m[0][2] * m[1][1]) / det],
    [(m[1][2] * m[2][0] - m[1][0] * m[2][2]) / det, (m[0][0] * m[2][2] - m[0][2] * m[2][0]) / det, (m[0][2] * m[1][0] - m[0][0] * m[1][2]) / det],
    [(m[1][0] * m[2][1] - m[1][1] * m[2][0]) / det, (m[0][1] * m[2][0] - m[0][0] * m[2][1]) / det, (m[0][0] * m[1][1] - m[0][1] * m[1][0]) / det],
  ];
  return _rgbHex([0, 1, 2].map((i) => inv[i][0] * t[0] + inv[i][1] * t[1] + inv[i][2] * t[2]));
}
// the text color the user wants on screen (null = keep the page's own)
function flowDarkTextColor(dark, accent) {
  const d = { ...FLOW_DARK_DEFAULTS, ...(dark || {}) };
  if (d.text === "original") return null;
  if (d.text === "accent") return accent || "#ff7a95";
  if (d.text === "custom") return /^#[0-9a-f]{3,6}$/i.test(d.textColor) ? d.textColor : null;
  return FLOW_TEXT_PRESETS[d.text] || null;
}
