// Before/after performance comparison: v1 (v1/index.html, previous) vs v2 (index.html, main).
// node source/tests/perf_budget.js   → prints a table, exits 1 if v2 is over budget
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const BUDGET = { calls: 300 };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const rows = [];
  for (const [name, file] of [['v1', 'v1/index.html'], ['v2', 'index.html']]) {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.addInitScript(() => { try { localStorage.setItem('smt-quality', 'high'); } catch (e) {} });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    const t0 = Date.now();
    await p.goto('file://' + path.join(ROOT, file));
    await p.waitForFunction(() => window.__sim && (window.__sim.ready === undefined || window.__sim.ready), null, { timeout: 60000 });
    const ready = Date.now() - t0;
    await p.waitForTimeout(1500);
    const r = await p.evaluate(async (name) => {
      const out = {};
      const measure = (view) => {
        __sim.views[view](); __sim.endTween(); controls.update();
        renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera);
        const calls = renderer.info.render.calls, tris = renderer.info.render.triangles;
        // cost of one frame as each version renders it while the line runs
        let t = performance.now();
        for (let i = 0; i < 10; i++) { if (name === 'v1') renderer.shadowMap.needsUpdate = true; renderer.render(scene, camera); }
        const ms = (performance.now() - t) / 10;
        return { calls, tris, ms };
      };
      __sim.start(); __sim.ff(30);
      out.overview = measure('over'); out.aoi = measure('aoi');
      out.programs = renderer.info.programs.length; out.geos = renderer.info.memory.geometries;
      let t = performance.now(); __sim.rebuild(); out.rebuild = performance.now() - t;
      return out;
    }, name);
    // idle behaviour: frames drawn in 2 s while nothing moves
    const idle = await p.evaluate(async () => { const f0 = window.__sim.perf ? __sim.perf.frames : null; await new Promise(r => setTimeout(r, 2000)); return f0 === null ? 'always' : (__sim.perf.frames - f0) + ' frames'; });
    rows.push({ name, ready, ...r, idle, errs: errs.length });
    await p.close();
  }
  await b.close();
  const f = (x) => x.toFixed(1);
  console.log('| | v1 (current) | v2 |\n|---|---|---|');
  const [a, c] = rows;
  const line = (k, fa, fc) => console.log(`| ${k} | ${fa(a)} | ${fc(c)} |`);
  line('Page ready (ms)', x => x.ready, x => x.ready);
  line('Draw calls · overview', x => x.overview.calls, x => x.overview.calls);
  line('Draw calls · AOI close-up', x => x.aoi.calls, x => x.aoi.calls);
  line('Triangles · overview', x => x.overview.tris, x => x.overview.tris);
  line('Render time per frame · overview (ms)', x => f(x.overview.ms), x => f(x.overview.ms));
  line('Render time per frame · AOI (ms)', x => f(x.aoi.ms), x => f(x.aoi.ms));
  line('Shader programs', x => x.programs, x => x.programs);
  line('Geometries in memory', x => x.geos, x => x.geos);
  line('Rebuild after a setup change (ms)', x => f(x.rebuild), x => f(x.rebuild));
  line('Frames drawn in 2 s while idle', x => x.idle, x => x.idle);
  line('Page errors', x => x.errs, x => x.errs);
  const ok = c.overview.calls <= BUDGET.calls && c.aoi.calls <= BUDGET.calls && c.errs === 0;
  console.log(ok ? '\nv2 within budget' : '\nv2 OVER BUDGET'); process.exit(ok ? 0 : 1);
})();
