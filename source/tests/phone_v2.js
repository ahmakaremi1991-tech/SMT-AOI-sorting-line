// Phone-size check of v2 (touch, small screen) + loading screen capture
const { chromium, devices } = require('playwright');
const path = require('path'); const ROOT = path.resolve(__dirname, '../..'); const OUT = path.join(ROOT, 'out/shots/v2');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(ROOT, 'v2/index.html'), { waitUntil: 'commit' });
  await p.waitForSelector('#loading'); await p.waitForTimeout(400);
  await p.screenshot({ path: OUT + '/phone_loading.png' });
  await p.waitForFunction(() => window.__sim && window.__sim.ready, null, { timeout: 60000 });
  await p.waitForTimeout(2500); await p.screenshot({ path: OUT + '/phone_ready.png' });
  await p.tap('#bStart'); await p.evaluate(() => { __sim.ff(30); for (let i = 0; i < 4000 && !(__sim.LINE[3].canMark && __sim.LINE[3].cur); i++) __sim.ff(.02); });
  await p.waitForTimeout(1500); await p.tap('#bMark'); await p.waitForTimeout(2000);
  await p.screenshot({ path: OUT + '/phone_judge.png' });
  await p.tap('#jFail'); await p.waitForTimeout(800);
  console.log(JSON.stringify(await p.evaluate(() => ({ state: __sim.state, cnt: __sim.CNT, perf: __sim.perf, side: document.getElementById('side').className }))), errs);
  await b.close();
})();
