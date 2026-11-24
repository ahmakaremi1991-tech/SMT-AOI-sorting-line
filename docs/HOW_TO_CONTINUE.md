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

## Test (headless)
```
node source/tests/check_sort.js "a|__sim.start()|60"
```
`window.__sim` gives you:
- `ff(seconds)`
- `start()`, `markPanel()`, `decide(true|false)`, `replaceMags()`, `rebuild()`, `setLang('en'|'ro')`
- `views.*`, `SET` (setup values), `CNT` (counters), `RECORDS`

Screenshots are written to `out/`, which is git-ignored.
