# Madi Freck — Animation Portfolio

A single-page portfolio site. Everything lives in `index.html`; each nav item is
a `<section class="page">` (`#home`, `#twod`, `#stopmotion`, `#skills`, `#about`).

## Navigation (how the pages switch)

Clicking a nav link just changes the URL hash (e.g. `#twod`). `js/main.js` then
shows that one section and hides the rest — **nothing reloads**. Because the
document never changes, the custom cursor never flashes back to the default.

- Works even when you **double-click `index.html`** (`file://`) — no server needed.
- Each view has a shareable URL, e.g. `…/index.html#about`.
- Only the visible section's media loads (browsers don't fetch images/videos
  inside a `hidden` element until it's shown), so adding lots of media is fine.
- To add a page: add a `<section id="newid" class="page section">…</section>`
  inside `<main id="app">` and a `<li><a href="#newid">…</a></li>` to the nav.
  The router picks it up automatically.

## Swapping in your own art

The decorations are currently simple SVG placeholders. Replace them with your
hand-drawn images — keep the same filenames (any of `.svg`, `.png`, `.jpg`
works, just update the `src` in `index.html` if you change the extension):

| File | What it is |
|------|------------|
| `images/arrow-top.svg`    | Swoosh / arrow above the name |
| `images/arrow-bottom.svg` | Swoosh / arrow below the name |
| `images/star-left.svg`    | Small star, left of the name |
| `images/star-right.svg`   | Star, right of the name |
| `images/profile.svg`      | Profile picture (shown in the circle) |

## Font

The **Jack Armstrong** font is installed at `fonts/Jack Armstrong.ttf` and loaded
via `@font-face` in `css/style.css`. If it's ever missing, the site falls back to
a handwritten-style font.

## Colours

All sampled from `images/profile pic.png`:

- Background yellow: `#feb800`
- Accent red (hair): `#9b0302`
- Blue (stars) — cursor & text highlight: `#0147ff`

Defined at the top of `css/style.css` if you want to tweak them.

## Viewing

Just open `index.html` in a browser.
