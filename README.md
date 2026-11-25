# SMT AOI Sorting Line — 3D simulator

**Online:** https://ahmakaremi1991-tech.github.io/SMT-AOI-sorting-line/

This is the **fast version (v2)**, the main version since 2026-11-25. Compared with the first version:
- about 3× fewer draw calls (764 → 224)
- shadows recalculated only when something big moves
- no drawing while idle
- a loading screen
- Graphics quality (Auto / High / Low) and a Performance overlay
- a phone layout

The previous version (a single self-contained HTML file) is kept at https://ahmakaremi1991-tech.github.io/SMT-AOI-sorting-line/v1/

An interactive 3D simulator of an offline AOI sorting line. Suspect panels are fed from magazines, inspected by the AOI and sorted into good and defect magazines.
The page is `index.html` + `app.js` + `lib/` (three.js and the shared parts are separate files the browser caches).

**Line:** Loader → Flipper 1 → Scanner → AOI → Flipper 2 → Unloader (Mag 1 good · Mag 2 good · Mag 3 defects)

## How to use
1. *(optional)* **Activate line setup** and choose:
   - inspection side: TOP = flippers bypass, BOT = flippers turn the panel
   - AOI program
   - magazine width: 164 / 175 / 190 / 212 mm
   - pitch: 3 / 4 / 5
   - number of panels and magazine capacity

   Conveyor and flipper width follow the magazine width. START stays disabled until the setup is complete. If line setup is off, the line uses the defaults: TOP, 212 mm, pitch 3, Program 1.
2. Press **START**. Every panel is good unless you press **Mark panel for judgement** while the panel is inside the AOI.
3. The line pauses and shows the panel's serial number. **PASS** sends it to Magazine 1 (Magazine 2 once 1 is full). **FAIL** sends it to Magazine 3.
4. A full magazine stops the line. Press **Replace magazine** to continue.
5. Other controls: PAUSE / RESUME, STOP, RESET, speed 0.5–4×, camera views, open covers, X-ray, labels, and the **English / Română** switch.

Floor areas: *PENTRU SORTARE* (unsorted input), *SORTATE* (sorted output) and the *Analysis area* for defect magazines.

## Files
| Path | What |
|---|---|
| `index.html` | the simulator (generated, do not edit by hand) |
| `source/` | build sources: shared page shell (`page.py`, `shell.*`, `common.js`), PCB and machine parts (`pcbkit.js`, `handling_parts.js`, `src/aoi.machine.js`), line engine and UI (`sort.js`), builder (`sort_build.py`) |
| `source/tests/` | headless Playwright checks (`check_sort.js`, `PAGE=v1/index.html` for the previous version), `perf_budget.js` (v1 vs v2 table), `compare_v1_v2.js`, `phone_v2.js` |
| `app.js`, `lib/`, `source/v2/` | main version: `perf.js` (reusable performance helpers), `sort_v2_tail.js`, `sort_build_v2.py` (patches `sort.js`, writes `index.html`, `app.js`, `lib/`) |
| `v1/` | previous single-file version (built by `source/sort_build.py`) |
| `docs/` | project history, decisions, and how to continue |

The machine models come from the sister project **SMT Equipment – Basic Knowledge** (https://ahmakaremi1991-tech.github.io/SMT-Equipment-Basic-knowledge-/). Models are generic, with no brand names.
