# docs/

Everything needed to run, seed, test and present the project on one machine.

| Path | Purpose |
|---|---|
| `runner.sh` | Menu / one-shot automation: cleanup, setup, run, seed, all-in-one |
| `docker/` | `docker-compose.yml` for MySQL 8.4 (127.0.0.1:3306) and the schema init script |
| `scripts/` | `backend.sh` (build/start/stop services), `frontend.sh`, `reset-data.sh`, `serve-static.js` |
| `seeder/` | `seed.mjs` fills the system through the real APIs; `data/` holds people, catalogue, clinical and community content and the offline translation dictionary |
| `tests/` | `e2e.mjs`: UI end-to-end checks in headless Chrome |
| `diagrams/` | Animated architecture and flow diagrams (SVG + GIF) and their generator |
| `showcase/` | Portfolio site (`site/`), screenshot tour (`tools/tour.mjs`), statistics collector |

## Typical sessions

```bash
./docs/runner.sh 5                     # build everything from scratch and seed
./docs/runner.sh 3                     # just start the stack again (data is kept in the Docker volume)
node docs/tests/e2e.mjs                # verify the UI end to end
node docs/showcase/tools/tour.mjs      # recapture every screenshot
cd docs/showcase && npm start          # portfolio site on http://localhost:4000
node docs/diagrams/build.mjs && node docs/diagrams/render-gifs.mjs   # regenerate diagrams
```

## Seeded data

54 accounts (2 admins, 16 doctors, 36 patients), 40 medicines, 12 pieces of equipment, ~2,000 appointments (history inserted with SQL, upcoming ones booked through the API), 170 reviews, ~80 treatment records, 10 AI reports, ~50 community posts with comments and reactions, 8 wellness challenges, and 10 languages x 33 interface strings. Passwords: `Admin@1234`, `Doctor@1234`, `Patient@1234`. The seeder is deterministic.

## Requirements

Docker, JDK 21, Node 18+. Google Chrome for tests, screenshots and GIF export; Python 3 with Pillow for GIF export.
Dependencies are downloaded once at first build; after that nothing needs the internet.
