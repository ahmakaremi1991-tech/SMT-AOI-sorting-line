# How to continue

## Online
https://ahmakaremi1991-tech.github.io/SMT-AOI-sorting-line/
If the link returns 404, open repository **Settings → Pages → Branch `main`, folder `/ (root)` → Save**.

## New Claude Code session
Start the session with this repository selected and say: *"Read `docs/PROJECT_HISTORY.md` and `docs/HOW_TO_CONTINUE.md`, then continue."*
When a change is done, add it to `docs/PROJECT_HISTORY.md`, then commit and push.

## Rebuild
```
cd source
npm install three@0.147.0 --prefix lib     # once; lib/ is git-ignored
python3 sort_build.py                      # writes ../index.html
```
`sort_build.py` puts these together, in order: `common.js` + `pcbkit.js` + `handling_parts.js` + `sort.js`. It also inserts `src/aoi.machine.js`, wrapped as `buildAOI(parent, BW, BD)`, into `sort.js` and fills the `page.py` shell around the script.

Shared parts (`common.js`, `pcbkit.js`, `handling_parts.js`, `shell.*`, `page.py`, `src/aoi.machine.js`) are copies from the SMT Equipment – Basic Knowledge repository. If a machine model changes there, copy the file here and rebuild.

## v2 (performance preview)
```
python3 source/v2/sort_build_v2.py         # writes v2/index.html, v2/app.js, v2/lib/*
node source/tests/perf_budget.js           # v1 vs v2 table, fails if v2 > 300 draw calls
PAGE=v2/index.html node source/tests/check_sort.js "a|__sim.start()|60"
```
v2 uses the same line engine (`source/sort.js`). `sort_build_v2.py` applies small text patches to it, so a change made in `sort.js` reaches both versions. If a patch target changes, the build stops with "patch target not found".
`source/v2/perf.js` holds the helpers meant for the full SMT line too:
- `freezeStatic`: merge parts that never move
- `shareMaterials`
- `instanceRepeat`: instancing for repeated parts
- `machineLOD`: inner detail only when the camera is close
- `ShadowSched`, `RenderGate`, `Quality`, `PerfHUD`

## Test (headless)
```
node source/tests/check_sort.js "a|__sim.start()|60"
```
`window.__sim` gives you:
- `ff(seconds)`
- `start()`, `markPanel()`, `decide(true|false)`, `replaceMags()`, `rebuild()`, `setLang('en'|'ro')`
- `views.*`, `SET` (setup values), `CNT` (counters), `RECORDS`

Screenshots are written to `out/`, which is git-ignored.
