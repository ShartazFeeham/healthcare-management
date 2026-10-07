# TODO

## Run everything
- [x] Make every service runnable, end to end; fix everything that's broken
- [x] Everything on localhost only (DB and all dependencies). Hard limit: no remote calls, must work with no internet
- [x] One exception: keep the Google translator integration, since it still works
- [x] Free to change DB, Gradle, Java and other versions to match this machine
- [x] Avoid downloading extra resources where possible
- [x] Full ownership: no questions, no pausing

## docs/ folder
- [x] Put docker, DB setup and helper scripts in `docs/`
- [x] `docs/runner.sh` menu:
  - [x] 1. Clean up docker containers, DB container, volumes
  - [x] 2. Set up docker and DB
  - [x] 3. Run backend and frontend
  - [x] 4. Seed
  - [x] 5. Automate all of the above
- [x] Seeder in `docs/` that fills the whole system with realistic dummy data

## Showcase
- [x] Screenshot every feature and every UI screen; keep them in one place
- [x] Build a portfolio-style showcase (Node app or similar) that is easy to embed in a portfolio site
  - [x] Product-showcase style (like a software company presenting its product)
  - [x] Focus on delivery quality and project work, not selling
  - [x] Highlight features, slideshow of screenshots, as polished as possible

## Root README
- [x] HLD diagrams with icons
- [x] Live-style animated flows (GIF or animated)

## Housekeeping
- [x] Keep this list as `TODO.md`

## Extended showcases (after TODO was complete)
- [x] Showcase #2 "Ward Round": clinical-chart case study planned with a sub-agent (context only, no code or screenshots shared)
- [x] Showcase #3: minimal slide presentation, Mac monitor on desktop / phone frame on mobile, sliding feature text (plan from a sub-agent, simplified to the requested minimal style)
- [x] Showcase #4 "One Take": scrubbable recorded film (real frames, scripted cursor, real requests), Mac monitor on desktop / phone frame on mobile; plan from a sub-agent
- [ ] Showcase #5: not started
- Standing preference: every new showcase is aesthetic but minimalistic, and responsive to the viewer's device
