# Project history — SMT AOI Sorting Line

This was split out of the *SMT Equipment – Basic Knowledge* project on 2026-11-24 so that it has its own repository and link. The full history of the machine models is in that repository's `docs/PROJECT_HISTORY.md`.

## Standing rules
- Technical details come from real sources (datasheets, drawings, the owner's photos and videos), not from memory.
- The repository is public, so it contains no manufacturer, company or person names.
- Units are mm and the transport height is 950 mm. The line runs on lane 1 (z = +170), boards flow left to right, and the scale is the same as the catalogue's machine pages.
- Shared interface: White / Dark-gray theme, collapsible left panel, on-screen data toggles including Cycle time, and a persistent bottom toolbar.

## 2026-11-24 — First version
The owner provided a brief. Agreed decisions:
- **3D**, reusing the machine models. **Single lane.**
- Line: Loader → Flipper 1 → Scanner → AOI → Flipper 2 → Unloader.
- Unloader magazines: Mag 1 good, Mag 2 good (used after Mag 1 is full), Mag 3 defects (red).
- **No defect rate.** Every panel is good unless the operator presses *Mark panel for judgement* while it is in the AOI. The line then pauses and a pop-up shows the serial number: **PASS** sends the panel to Mag 1 / 2, **FAIL** to Mag 3. Each decision is logged.
- **Line setup is optional.** Off → defaults: TOP (flippers bypass), 212 mm, pitch 3, Program 1. On → the user chooses:
  - magazine width 164 / 175 / 190 / 212
  - loader / unloader pitch 3 / 4 / 5
  - inspection side TOP = bypass or BOT = flip (one setting for both flippers)
  - AOI program
  - number of panels
  - magazine capacity (maximum set by the pitch)

  Conveyor and flipper width follow the magazine, and the panel is scaled to fit. START is disabled until the setup is valid.
- The loader input fills 3 loader magazines in turn.
- Magazine mechanics:
  - Loader: unloads bottom → top. The puller rod goes under the panel and its finger flips up behind the far edge.
  - Unloader: fills top → bottom. The pusher waits behind the panel until the panel reaches the end sensor, pushes it in, then returns to its reference point.
- A full magazine stops the line, and a *Replace magazine* button continues it. Replaced magazines go to the SORTATE or Analysis area.
- Floor areas: PENTRU SORTARE, SORTATE, Analysis area.
- Controls: START / PAUSE / RESUME / STOP / RESET, speed 0.5–4×, tower light (green running, yellow paused or waiting for the operator, red stopped or magazine full), counters, magazine fill bars, event log, run summary, and **EN / RO**.

## 2026-11-24 — Own repository
The page moved from `machines/sorting_line.html` in the catalogue repository to this repository's `index.html`, with its own GitHub Pages link.

## 2026-11-24 — Performance v2 (preview at `/v2/`)
Following a teacher's review (lazy loading, loading indicator, touch controls), I measured the page: 764 draw calls per frame, a 4096 px shadow map recalculated on every frame, drawing even while idle, and a blank screen while the page builds. v2 was built next to v1, which is left unchanged:
- **Draw calls:** parts that never move are merged, identical materials are shared, and all panels are drawn with instancing. 764 → 224 draw calls.
- **Shadows:** 2048 px shadow map, recalculated only when a big part moves (at most 10 times a second); panels don't cast shadows.
- **Idle:** nothing is drawn while idle or paused; retina sharpness is capped at 1.5×.
- **Quality:** Auto / High / Low. Auto drops to Low below 28 fps.
- **Loading screen** with steps.
- **Libraries:** three.js and the shared parts are separate files that the browser caches.
- **Phone layout:** the side panel starts collapsed, the button bar is compact, the status panel folds, and the overview steps back on portrait screens.
- **Full-line groundwork:** machine detail by distance (the AOI head and gantry are only drawn when close or with the cover open) and an instancing helper for feeders and components.

The owner will review v2 before it replaces the main page.

## 2026-11-25 — Unloader pusher corrected again (new top-view video)
The owner filmed the unloader's pusher section from above. The video shows:
1. The panel comes to the end sensor while the pusher waits at its reference point, raised.
2. The shuttle lines up with the free slot and the **conveyor belts drive the panel into the magazine as far as they reach**.
3. The pusher then lowers behind the trailing edge and **pushes the panel home**. The pusher is a black lever on a belt actuator (red belt) beside the conveyor. It **stops at the magazine entrance and never goes into the magazine**.
4. The lever lifts and returns to its reference point.

Model changes (`handling_parts.js`, shared by the handling line and the sorting line):
- The actuator now runs to the magazine entrance.
- The lever pivots on its carriage, with a paddle at the tip.
- Stored panels sit with the trailing edge just inside the entrance.

The new step sequence is in the sorting line `unloaderRun` and the handling line UNLOAD `run`. A new **Pusher** camera view (top view with X-ray, following the shuttle) is on both pages.
