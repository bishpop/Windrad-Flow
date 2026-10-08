# Windrad Flow

**Zen / Arc-style tools for Firefox and Chromium browsers** – a command bar, a
custom start page, themes, a Dark Reader–style dark mode, YouTube tweaks, a mini
player, link previews and more, in one extension. Every part is a module you can
switch on or off.

| | Firefox | Chromium (Brave, Chrome, Edge, Vivaldi, Opera) |
|---|---|---|
| Folder | [`firefox/`](firefox) | [`chromium/`](chromium) |
| Minimum version | Firefox 140 | Chromium 116 |

---

## Contents

- [Modules](#modules)
- [Command bar](#command-bar)
- [Toolbar menu](#toolbar-menu)
- [Start page & themes](#start-page--themes)
- [Boosts & dark mode](#boosts--dark-mode)
- [YouTube](#youtube)
- [Mini player](#mini-player)
- [Peek – link previews](#peek--link-previews)
- [Notes per page](#notes-per-page)
- [Auto-archive](#auto-archive)
- [Spaces (Firefox)](#spaces-firefox)
- [Volume control](#volume-control)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Installation](#installation)
- [Permissions & privacy](#permissions--privacy)
- [Firefox vs. Chromium](#firefox-vs-chromium)

---

## Modules

| Module | What it does |
|---|---|
| **Command bar** | Search tabs, bookmarks, history and commands from anywhere |
| **Start page** | Clock, quick links, notes, to-do and your own background on every new tab |
| **Auto-archive** | Closes tabs you haven't used for a while and keeps them in an archive |
| **Spaces** *(Firefox)* | Separate sets of tabs (e.g. Private, Study, Projects) |
| **Mini player** | Controls whatever is playing while you're on another tab |
| **Notes per page** | A small note attached to a website or a single page |
| **Boosts** | Per-site changes: hide elements, font, size, colors, own CSS – and dark mode for all sites |
| **YouTube** | Hide Shorts & more, own colors, fixed quality, start volume, mouse-wheel volume |
| **Volume control** | Make any tab louder or quieter, up to 400 % |
| **Peek** | Alt + click a link to see it in a floating window |

All settings live on one page with a navigation on the left. Every module page
has its own on/off switch.

---

## Command bar

**Ctrl + Space** opens a search box on top of the page.

- **Open tabs** in all windows, **bookmarks**, **history**, **archived tabs** and **notes**
- **Commands** – type `>` to see only commands: new tab / window / private window,
  close, reopen closed tab, duplicate, pin, mute, reload, copy link, move tab to a new
  window, close or unload other tabs, bookmark, archive, note, boost, dark mode on/off,
  YouTube settings, settings
- **Web search** (Google, DuckDuckGo, Brave Search, Startpage, Bing, Ecosia) and
  “open address” as the last option
- `↑` `↓` select · `Enter` open · `Shift + Enter` open in the other tab mode · `Esc` close

On pages where browsers don't allow extensions to draw (`about:` / `chrome://`
pages, the add-on stores) it opens below the toolbar icon instead.

## Toolbar menu

A click on the Windrad Flow icon – or **Alt + Shift + F** – opens a compact menu:

1. **Search** and the settings
2. **Now playing** – only when something plays
3. **This page** – note, boost, dark mode, copy link, YouTube settings, volume slider
4. **Spaces** *(Firefox)*
5. **Quick actions** – the eight most used commands, *All commands →* for the rest
6. **Archive** – the last archived tabs

If something doesn't work, the menu tells you why.

## Start page & themes

The **start page** replaces the new tab page:

- Clock (draggable, lockable, size), greeting, search bar
- Quick links in categories – sizes, shapes, glass / solid / outline styles,
  drag to sort, custom icons
- Floating notes and a to-do list
- Your own background image with dim and blur
- Backup / restore of everything

**Themes** – Settings → General → *Choose theme…* opens a picker with the built-in
themes (**Windrad, Aurora, Lavender Night, Ember, Deep Sea, Cherry Blossom,
Graphite**) and **your own themes** (name, two colors, text color, four-step
background gradient, live preview, edit / delete).

A theme sets **Color 1 and Color 2 everywhere**: in Flow, on the start page, in the
mini player and – with “My theme” – on YouTube. The two colors are shared between
Flow's settings and the start page: change them in one place and the other follows
immediately.

## Boosts & dark mode

**Boosts** change a website the way you like it, applied as soon as the page loads.
Open the panel from the command bar or the menu (*Boost this site*):

- **Hide elements** – click anything (banners, sidebars, Shorts …) to hide it
- **Font** – original, system, serif, mono, rounded
- **Size** – 70–160 %
- **Colors** – dark mode (auto / on / off), hue, saturation
- **Own CSS**

**Dark mode on all websites** (Settings → Boosts) replaces extensions like Dark Reader:

- **Already dark pages stay as they are.** Flow looks at what is really painted
  behind the visible page (not just `<body>`), at the page's `color-scheme` and at
  its text color, and checks again when a site switches its own theme.
- Sliders for **darkness**, **brightness**, **contrast**, **sepia** and **grayscale**
- **Text color**: original, soft, white, warm, Color 1 or any custom color – Flow
  calculates it back through the filter, so it appears exactly as chosen
- Pictures and videos are inverted back and look normal
- Live preview in the settings, per-site override in the Boost panel

## YouTube

Settings → YouTube, or *YouTube settings* in the command bar / menu.

- **Hide:** Shorts (feed, sidebar, search, channel tab – and open Shorts links as
  normal videos), comments, recommendations, home feed, category chips, end screens,
  merch shelves, live chat (→ live streams switch to theater mode)
- **Own colors:** your theme or any palette, or 7 custom colors (main color, three
  backgrounds, two text colors, shadow) – progress bar, search bar, menus, live chat
- **Background like my theme** (gradient) and **glass** top bar / menus
- **Quality:** always play in the chosen resolution, or the highest one below it
  (4K wanted, 1080p video → 1080p)
- **Start volume:** every video opens with the same volume (e.g. 5 %)
- **Volume with the mouse:** hold the right mouse button and turn the wheel
- **Picture-in-picture button** in YouTube's player bar (always on top)

## Mini player

While a tab plays sound and you're on another tab, a small player appears on the page.

- Three looks: **Tiny** (Zen style), **Minimal**, **With cover**
- Colors: your theme, a palette, or **adaptive** from the cover
- Drag it anywhere – the position is remembered
- **▣ Video window** for YouTube: the video moves into an **always-on-top
  picture-in-picture window** (the real video, logged in) or into a small browser
  window; the mini player keeps controlling it and the timeline stays in sync.
  Closing it continues the video in the YouTube tab at the same spot.

## Peek – link previews

- **Alt + click** a link (or right-click → *Open in Peek*) shows the page in a
  floating window that zooms out of the link – or in a small popup window
  (with toolbar & extensions, or slim)
- **Alt + Shift + G** searches the selected text in Peek
- Live address bar, reload, maximize, copy link, open in a new tab
- *(Firefox)* stay logged in inside floating previews

## Notes per page

A small glass note for a whole website or a single page. Saves while you type, can
be dragged and resized. Pages with a note show a small *Note* button (or open it
automatically). All notes are searchable in the command bar and listed in the
settings.

## Auto-archive

Tabs you haven't used for 1 hour … 1 week are closed and kept in an archive.
Pinned tabs, the active tab, tabs playing sound and sites on your exclude list are
never archived. Restore them from the command bar, the menu or the settings.

## Spaces (Firefox)

Separate sets of tabs, like in Arc – the tabs of other spaces are hidden. Name,
emoji, color and optionally a Firefox container per space.
**Ctrl + Alt + ← / →** switches spaces with a short animation.

## Volume control

A slider in the menu makes the current tab louder or quieter, **0–400 %**,
remembered per website if you like. Protected videos (Netflix etc.) only go up to
100 %.

---

## Keyboard shortcuts

| Action | Firefox | Chromium |
|---|---|---|
| Command bar | Ctrl + Space | Ctrl + Space |
| Windrad Flow menu | Alt + Shift + F | Alt + Shift + F |
| Copy page address | Alt + Shift + C | Alt + Shift + C |
| Peek: search selection | Alt + Shift + G | Alt + Shift + G |
| Note for this page | Ctrl + Alt + N | *set it yourself* |
| Next / previous space | Ctrl + Alt + → / ← | – |

All shortcuts are listed in Settings → General. Firefox: change them there with a
click. Chromium: change them at `chrome://extensions/shortcuts`
(Chromium allows at most four preset shortcuts).

---

## Installation

### Firefox

**Try it (until the next restart):** `about:debugging` → *This Firefox* →
*Load Temporary Add-on…* → choose `firefox/manifest.json`.

**Permanently:** zip the *contents* of `firefox/` and sign it at
[addons.mozilla.org/developers](https://addons.mozilla.org/developers/)
(*On your own* = unlisted), then install the signed `.xpi`.

### Chromium (Brave, Chrome, Edge, Vivaldi, Opera)

1. Download or clone this repository and keep the `chromium/` folder somewhere it can stay.
2. Open `chrome://extensions` (Brave: `brave://extensions`) and switch on **Developer mode**.
3. **Load unpacked** → choose the `chromium/` folder.
4. Open a new tab once and keep the new tab page when the browser asks.
5. Pin the Windrad Flow icon to the toolbar.

After an update: replace the folder and click the reload icon on the extension's card.

---

## Permissions & privacy

**Windrad Flow collects nothing and sends nothing anywhere.** All settings,
notes and archived tabs stay in your browser's extension storage.

| Permission | Why |
|---|---|
| Tabs, sessions | list / switch tabs, run tab commands, reopen closed tabs |
| Bookmarks, history | search them in the command bar |
| Access to all websites, scripting | command bar, notes, boosts, dark mode, mini player, Peek, YouTube features |
| Alarms | check for old tabs every 10 minutes (auto-archive) |
| Context menus | *Open in Peek* / *Search in Peek* |
| Declarative net request | Peek: allow a page to be shown in the preview frame – only for that one tab, only while the preview is open |
| Clipboard (write), offscreen *(Chromium)* | copy link |
| Storage, unlimited storage | settings, notes, start page background |
| Hide tabs, containers, cookies, web request *(Firefox)* | Spaces, containers per space, staying logged in inside Peek previews |

---

## Firefox vs. Chromium

Everything works in both, except:

| Feature | Firefox | Chromium |
|---|---|---|
| Spaces & containers | ✅ | ❌ (browsers can't hide tabs) |
| Logged in inside floating Peek previews | ✅ | ❌ – use the Peek popup window |
| Reader view command | ✅ | ❌ |
| Change shortcuts inside the settings | ✅ | via `chrome://extensions/shortcuts` |

---

## Project structure

```
firefox/      Firefox build (Manifest V3, background scripts)
chromium/     Chromium build (Manifest V3, service worker + small compatibility layer)
  compat.js       maps the Firefox-style API (browser.*) to chrome.*
  sw.js           service worker that loads the background parts
  offscreen.*     clipboard helper for the service worker
  youtube-main.js YouTube player bridge (page world)
```

Both builds share the same code; the Chromium build adds the files above.

## License

[MIT](LICENSE) © Sanya ([bishpop](https://github.com/bishpop))
