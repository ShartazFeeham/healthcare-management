# Showcase

One presentation: a minimal 14-slide deck. Plain HTML/CSS/JS, no build step to view, no CDN, no external fonts. Runs offline.

```bash
cd docs/showcase && npm start     # http://localhost:4000
```

Every screen is shown on a Mac monitor on desktop or in a phone on a phone, chosen from the viewer's device (toggle with the Desktop/Phone button, or keys `D` / `P`). Arrow keys, swipe, tap, `F` fullscreen, `N` notes, `A` auto-play, deep links `#5`, prints one slide per page.

Embed:

```html
<iframe src="/showcase/deck/index.html?embed=1" title="EA Healthcare presentation" allow="fullscreen" style="width:100%;aspect-ratio:16/9;border:0"></iframe>
```

`deck/resources/` keeps the captured screenshots, stats and run data the deck is built from. `node tools/tour.mjs` recaptures screenshots, `node tools/stats.mjs` refreshes stats, `node deck/build.mjs` regenerates `deck/index.html`.
