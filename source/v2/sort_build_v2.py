"""Build the v2 (performance) sorting line into ../../v2/ — the v1 page (../../index.html) is not touched.

v2 = the same line engine (../sort.js) + patches below + perf.js, with three.js and the shared
parts served as separate, cacheable files instead of being inlined into the page."""
import os,sys,shutil
D=os.path.dirname(os.path.abspath(__file__));SRC=os.path.dirname(D);ROOT=os.path.dirname(SRC)
sys.path.insert(0,SRC)
from page import page
import sort_build as v1                       # reuse v1 html pieces (side panel, stage, bar, css, aoi_part)
rd=lambda p:open(p,encoding='utf-8').read()
L=os.path.join(SRC,'lib','node_modules','three')
OUT=os.path.join(ROOT,'v2');os.makedirs(os.path.join(OUT,'lib'),exist_ok=True)

def rep(s,a,b,n=1):
    assert s.count(a)==n,('patch target not found',a[:70],s.count(a));return s.replace(a,b)

# ---------------- line engine patches ----------------
s=rd(os.path.join(SRC,'sort.js')).replace('/*__AOI_MODEL__*/',v1.aoi_part())
# new texts (EN / RO)
s=rep(s,"stTitle:'LINE STATUS',","stTitle:'LINE STATUS',q_title:'Graphics quality',q_auto:'Auto',q_high:'High',q_low:'Low',q_note:'Auto switches to Low (no shadows, lower resolution) if the device is too slow.',ld_build:'Building machines…',ld_gfx:'Preparing graphics…',ld_ready:'Ready',")
s=rep(s,"stTitle:'STARE LINIE',","stTitle:'STARE LINIE',q_title:'Calitate grafică',q_auto:'Auto',q_high:'Înaltă',q_low:'Scăzută',q_note:'Auto trece pe Scăzută (fără umbre, rezoluție mai mică) dacă dispozitivul este prea lent.',ld_build:'Se construiesc utilajele…',ld_gfx:'Se pregătește grafica…',ld_ready:'Gata',")
# rebuild: dispose old merged geometry, merge static parts after building, measure build time
s=rep(s,"  buildLine();if(xray)applyXray();setHoods(hoodsOpen);buildTags();ui(true);}",
        "  const _t0=performance.now();disposeFrozen();LODS.length=0;BI.reset();\n  buildLine();if(xray)applyXray();setHoods(hoodsOpen);buildTags();freezeLine();\n  PerfHUD.build=performance.now()-_t0;ShadowSched.force=true;RenderGate.dirty=true;ui(true);}")
# hood animation finishes instantly when covers are set during a rebuild (no extra frames needed)
# main loop: camera change detection, gated rendering, shadow scheduling, quality sampling
s=rep(s,"renderer.shadowMap.autoUpdate=false;\nconst clock","renderer.shadowMap.autoUpdate=false;\nlet _blink=null,_prevRendered=false,_lastT=performance.now(),_lodT=0,_monKey='';\nconst clock")
s=rep(s,"  controls.update();const dist=","  const camMoved=controls.update();const dist=")
s=rep(s,"  const [W,H]=SMT.size();renderer.setViewport(0,0,W,H);renderer.clear();renderer.shadowMap.needsUpdate=true;renderer.render(scene,camera);\n  if(showTags)tags",
"""  const hoodMoving=MACH.some(m=>m.hoods.some(h=>Math.abs(h.target-h.open)>.002));
  const simLive=dt>0&&((started&&!hold&&!runDone)||svc.length>0);
  const bl=(ls==='st_judge'||R)?blink:null;if(bl!==_blink){_blink=bl;RenderGate.dirty=true;}
  if((_lodT+=rdt)>.25){_lodT=0;updateLOD();}
  const need=RenderGate.dirty||simLive||hoodMoving||camMoved||!!tween||!!follow||ShadowSched.pending||ShadowSched.force;
  const _now=performance.now(),realDt=Math.min(1,(_now-_lastT)/1000);_lastT=_now;
  const [W,H]=SMT.size();
  if(need){BI.update();ShadowSched.update(shadowSig(),performance.now()/1000);renderer.setViewport(0,0,W,H);renderer.clear();renderer.render(scene,camera);RenderGate.dirty=false;RenderGate.frames++;
    if(_prevRendered)Quality.sample(realDt);}else RenderGate.skipped++;
  PerfHUD.frame(realDt,need&&_prevRendered);_prevRendered=need;
  if(need&&showTags)tags""")
s=rep(s,"  if(AOI_.A&&(AOI_._mt=(AOI_._mt||0)+rdt)>.4){AOI_._mt=0;drawAoiMonitor();}",
        "  if(AOI_.A&&(AOI_._mt=(AOI_._mt||0)+rdt)>.4){AOI_._mt=0;const k=(AOI_.cur?AOI_.cur.id+AOI_.cur.judged:'-')+CNT.inspected+CNT.good+CNT.bad+LANG+E.prog;if(k!==_monKey){_monKey=k;drawAoiMonitor();RenderGate.dirty=true;}}")
# hooks for tests, then the loading sequence instead of a blocking start
s=rep(s,"  ff:s=>{","  get perf(){return{calls:PerfHUD.calls,tris:renderer.info.render.triangles,programs:renderer.info.programs.length,frames:RenderGate.frames,skipped:RenderGate.skipped,build:PerfHUD.build,quality:Quality.level,mode:Quality.mode};},\n  setQuality:m=>Quality.set(m),ready:false,\n  ff:s=>{")
s=rep(s,"i18nDom();rebuild();\nframe();","boot();")
s=rep(s,"const views={over:()=>flyTo([400,4300,8600],[0,700,-200]),","const views={over:()=>flyTo(overPos(),[0,700,-200]),")
V2=rd(os.path.join(D,'sort_v2_tail.js'))
app="'use strict';\n"+s+"\n"+V2

# ---------------- files ----------------
for a,b in [(('build','three.min.js'),'three.min.js'),(('examples','js','controls','OrbitControls.js'),'OrbitControls.js'),(('examples','js','utils','BufferGeometryUtils.js'),'BufferGeometryUtils.js')]:
    shutil.copyfile(os.path.join(L,*a),os.path.join(OUT,'lib',b))
core="'use strict';\n"+rd(os.path.join(SRC,'common.js')).replace("'use strict';\n","",1)+rd(os.path.join(SRC,'pcbkit.js'))+rd(os.path.join(SRC,'handling_parts.js'))+rd(os.path.join(D,'perf.js'))
open(os.path.join(OUT,'lib','smt-core.js'),'w',encoding='utf-8').write(core)
open(os.path.join(OUT,'app.js'),'w',encoding='utf-8').write(app)

LIBS='<script src="lib/three.min.js"></script>\n<script src="lib/OrbitControls.js"></script>\n<script src="lib/BufferGeometryUtils.js"></script>\n'
js=("<script>window.SMT_CFG={shadow:3600,shadowFar:16000,shadowMap:2048,maxDist:22000,esd:10600,contact:[11000,2800]};"
    "if(innerWidth<820&&(function(){try{return localStorage.getItem('smt-side')===null;}catch(e){return true;}})())document.getElementById('side').classList.add('min');</script>\n"
    '<script src="lib/smt-core.js"></script>\n<script src="app.js"></script>')
quality=('<div class="sec"><h3 data-t="q_title">Graphics quality</h3><div class="seg2 segQ"><button data-q="auto" data-t="q_auto">Auto</button><button data-q="high" data-t="q_high">High</button><button data-q="low" data-t="q_low">Low</button></div>'
         '<p class="note" data-t="q_note"></p></div>')
stage=('<div id="loading"><div class="lcard"><div class="lt">AOI SORTING LINE</div><div class="lbar"><i id="ldB" style="width:15%"></i></div><div id="ldT">Loading 3D library… / Se încarcă…</div></div></div>'
       '<div id="perf" class="panel" data-ov="perf"></div>'+v1.stage)
css=v1.css+"""
#loading{position:absolute;inset:0;z-index:20;display:flex;align-items:center;justify-content:center;background:var(--scene,#10151d);transition:opacity .4s}
#loading.done{opacity:0;pointer-events:none}
#loading .lcard{width:min(360px,80vw);text-align:center}#loading .lt{font-weight:900;letter-spacing:1.5px;margin-bottom:14px;font-size:18px}
#loading .lbar{height:6px;border-radius:4px;background:var(--btn);overflow:hidden}#loading .lbar i{display:block;height:100%;background:linear-gradient(90deg,var(--acc),var(--cy));transition:width .25s}
#ldT{margin-top:10px;font-size:12px;color:var(--mut)}
#perf{left:12px;top:142px;padding:6px 10px;font:11px/1.5 Consolas,Menlo,monospace;color:var(--mut)}#perf b{color:var(--txt)}
.segQ{display:grid;grid-template-columns:repeat(3,1fr)}
@media (max-width:820px){
 #hud{width:auto;left:auto;right:8px;top:8px;max-width:54vw;padding:8px 10px}#hud h2{margin-bottom:4px}#hud .sl{display:none}#hud #stList,#hud #log{display:none}#hud.open #stList,#hud.open #log{display:block}#hud h2{cursor:pointer}
 #cycle{top:8px;left:8px;transform:none;min-width:0;max-width:36vw;padding:6px 10px}#cycle .v{font-size:20px}#cycle .s{display:none}#cycle .k{font-size:9px;letter-spacing:.5px}
 #bar{left:6px;right:6px;bottom:6px;padding:5px;gap:4px}#bar button{padding:9px 10px;font-size:12px}#bar .lbl,#bar .sep,#bar [data-v="top"],#bar [data-v="follow"],#bar #bLab{display:none}
 #warn{top:auto;bottom:calc(var(--barH,46px) + 14px);max-width:92vw}
 .modal .card{min-width:0;width:92vw;padding:16px}.jb button{flex:1;padding:14px 10px}
 #perf{display:none}
}"""
html=page(dict(title='AOI SORTING LINE v2 — offline sorting of suspect panels · SMT simulation',fn='AOI SORTING LINE',
  sub='Offline automatic sorting line: loader, flipper, scanner, AOI, flipper and unloader.',
  overlays=[('title','Title',True),('cycle','Cycle time',True),('hud','Line status',True),('log','Event log',True),('hint','Mouse hint',True),('perf','Performance',False)],
  specs=[],extra_side=v1.extra+quality,machine_html=v1.mach,flow=v1.FLOW,flow_title='Sorting line',stage_html=stage,toolbar=v1.bar,libs=LIBS,script=js,css=css))
open(os.path.join(OUT,'index.html'),'w',encoding='utf-8').write(html)
tot=sum(os.path.getsize(os.path.join(dp,f)) for dp,_,fs in os.walk(OUT) for f in fs)
print('v2 written:',OUT,'page',os.path.getsize(os.path.join(OUT,'index.html'))//1024,'KB · total',tot//1024,'KB')
