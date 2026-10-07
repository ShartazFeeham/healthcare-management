# Showcases

Four portfolio presentations of the same project, both plain HTML/CSS/JS with no build step, no CDN and no external fonts. They run offline.

```bash
cd docs/showcase && npm start     # http://localhost:4000
```

| | URL | What it is |
|---|---|---|
| **#1 Product case study** | `/` | Product-company style microsite: hero, animated stats, role-tabbed screenshot tour with autoplay, capability cards, animated architecture diagrams, engineering story, gallery. Embeddable slideshow at `/embed.html`. |
| **#4 One Take** | `/onetake/` | A 2-minute film of one afternoon (patient books, doctor delays, a message lands, the call connects, the report is written, the admin sees it). It is not a video: it is a scrubbable timeline of real captured frames, a scripted cursor, and the real HTTP requests the app made at that moment, shown underneath ("behind the glass"). Mac monitor on desktop, phone frame on phones, separate recordings for each. Space, arrows, `[` `]` chapters, swipe, chapter ticks, transcript, "See the fix" diff. |
| **#3 Presentation** | `/deck/` | A minimal slide deck. 14 slides, one idea each, feature text sliding in and out. Every screen is shown on a Mac monitor on desktop or in a phone on a phone, chosen from the viewer's device (switch with the Desktop/Phone toggle, or keys `D` / `P`). The stage is 16:9 on landscape and 9:16 on portrait phones. Arrow keys, swipe, tap, `F` fullscreen, `N` notes, `A` auto-play, deep links `#5`, prints to one slide per page. |
| **#2 Ward Round** | `/ward-round/` | A clinical-chart case study. The system is the patient, the engineer the attending. Real data drawn as an ECG, a boot sequence from a real run, one patient and one doctor followed through the product with callouts, seven real defects with interactive reconstructions and real diffs, decisions with trade-offs, and the real end-to-end results. A 60-second "Play the round" mode, keyboard shortcuts, light/dark, reduced-motion, works with JavaScript off. |

## Embedding in a portfolio

```html
<!-- #1: auto-playing slideshow -->
<iframe src="/showcase/site/embed.html" title="EA Healthcare" style="width:100%;aspect-ratio:16/10;border:0"></iframe>

<!-- #4: the recorded film -->
<iframe src="/showcase/onetake/index.html" title="One Take" loading="lazy" style="width:100%;aspect-ratio:16/10;border:0"></iframe>

<!-- #3: the presentation (works on phones too) -->
<iframe src="/showcase/deck/index.html?embed=1" title="EA Healthcare presentation" allow="fullscreen" style="width:100%;aspect-ratio:16/9;border:0"></iframe>

<!-- #2: full chart, auto-resizing -->
<script src="/showcase/ward-round/embed.js" data-src="/showcase/ward-round/index.html"></script>
```

Or copy `site/` or `ward-round/` as is.

## Regenerating

The running stack must be seeded (`docs/runner.sh 5`).

```bash
node tools/tour.mjs                  # #1: recapture the 46 screens -> site/assets/shots
node tools/stats.mjs                 # #1: refresh the numbers
node ward-round/tools/capture.mjs    # #2: scene screenshots, callout positions, frame sequences
node ward-round/tools/bake-data.mjs  # #2: DB counts, appointment pulse, service logs, e2e results, git diffs -> js/data.js
node ward-round/tools/build-page.mjs # #2: render index.html
```

```bash
node deck/tools/capture.mjs          # #3: desktop and phone captures of every feature screen
node deck/build.mjs                  # #3: render deck/index.html from deck/tools/slides.mjs
```

```bash
node onetake/tools/record.mjs        # #4: drive the real app and record frames, cursor and requests (desktop + phone)
node onetake/tools/build-film.mjs    # #4: pack to WebP and write film.js
```

Tools: `tools/cdp.mjs` is a dependency-free Chrome DevTools driver (installed Google Chrome + Node's built-in WebSocket).
