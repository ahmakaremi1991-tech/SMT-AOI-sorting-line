// Same scenario on v1 and v2, screenshots side by side in out/shots/cmp/
const { chromium } = require('playwright');
const path = require('path'); const ROOT = path.resolve(__dirname, '../..');
const STEPS = [
  ['overview', "__sim.start();__sim.ff(40);__sim.views.over();__sim.endTween()"],
  ['aoi', "for(let i=0;i<4000&&!(__sim.LINE[3].canMark&&__sim.LINE[3].cur);i++)__sim.ff(.02);__sim.views.aoi();__sim.endTween()"],
  ['unloader_xray', "__sim.ff(20);document.getElementById('bXray').click();__sim.views.unloader();__sim.endTween()"],
];
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [v, file] of [['v1', 'index.html'], ['v2', 'v2/index.html']]) {
    const p = await b.newPage({ viewport: { width: 1400, height: 820 } });
    await p.addInitScript(() => { try { localStorage.setItem('smt-quality', 'high'); localStorage.setItem('smt-side', 'min'); } catch (e) {} });
    await p.goto('file://' + path.join(ROOT, file));
    await p.waitForFunction(() => window.__sim && (window.__sim.ready === undefined || window.__sim.ready), null, { timeout: 60000 });
    await p.evaluate(() => { window.__step = 0; });
    for (const [n, js] of STEPS) {
      await p.evaluate(js => { eval(js); try { RenderGate.dirty = true; ShadowSched.force = true; } catch (e) {} }, js);
      await p.waitForTimeout(3500);
      await p.screenshot({ path: path.join(ROOT, 'out/shots/cmp', v + '_' + n + '.png') });
    }
    await p.close();
  }
  await b.close();
})();
