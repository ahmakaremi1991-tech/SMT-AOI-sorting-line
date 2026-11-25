// Unloader pusher sequence from above: arrive → belt feed → push → return.  PAGE=v1/index.html for the previous version.
const { chromium } = require('playwright');
const path = require('path'); const ROOT = path.resolve(__dirname, '../..'); const OUT = path.join(ROOT, 'out/shots/pusher');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1000, height: 640 } });
  await p.addInitScript(() => { try { localStorage.setItem('smt-quality', 'high'); localStorage.setItem('smt-side', 'min'); ['title','hud','cycle','hint','log'].forEach(k=>localStorage.setItem('smt-ov-'+k,'0')); } catch (e) {} });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(ROOT, process.env.PAGE || 'index.html'));
  await p.waitForFunction(() => window.__sim && (window.__sim.ready === undefined || window.__sim.ready), null, { timeout: 60000 });
  await p.evaluate(() => { window.__step = 0; __sim.start(); const U = __sim.LINE[5]; for (let i = 0; i < 20000 && U.st !== 's_in'; i++) __sim.ff(.02); __sim.views.pusher(); __sim.endTween(); });
  const shots = [['1_end_sensor', 's_sensor', .1], ['2_belt_feed', 's_feed', .55], ['3_push', 's_push', .75], ['4_home', 's_push', .85], ['5_return', 's_return', .7], ['6_reference', 's_wait', .05]];
  const log = [];
  for (const [n, st, extra] of shots) {
    const r = await p.evaluate(([st, extra]) => { const U = __sim.LINE[5]; let g = 0; for (; g < 20000 && U.st !== st; g++) __sim.ff(.01); __sim.ff(extra);
      try { RenderGate.dirty = true; ShadowSched.force = true; } catch (e) {}
      const b = U.mags.flatMap(m => m.boards).find(x => x) || null, cur = [...document.querySelectorAll('x')];
      return { st: U.st, finger: Math.round(U.rodX), entry: Math.round(U.magX - 355 / 2), hook: +U.hook.toFixed(2) }; }, [st, extra]);
    await p.waitForTimeout(2500); await p.screenshot({ path: path.join(OUT, (process.env.PAGE ? 'v2_' : '') + n + '.png') }); log.push(n + ' ' + JSON.stringify(r));
  }
  const max = await p.evaluate(() => { const U = __sim.LINE[5]; let mx = -1e9; for (let i = 0; i < 6000; i++) { __sim.ff(.02); mx = Math.max(mx, U.rodX); } return { maxFinger: Math.round(mx), entry: Math.round(U.magX - 355 / 2), stored: __sim.CNT.good }; });
  console.log(log.join('\n')); console.log(JSON.stringify(max), errs);
  await b.close();
})();
