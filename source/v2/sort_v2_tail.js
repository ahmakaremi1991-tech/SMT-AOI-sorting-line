
/* ===================================================================
   v2 — performance layer for the sorting line (uses perf.js)
   =================================================================== */
/* panels receive shadows but don't cast them (they move all the time) */
/* all panels are drawn with one instanced mesh per panel part (board, components, bottom side):
   20 panels × 4 parts = 80 draw calls become 4.  The per-panel meshes stay for picking/positions but are hidden. */
const BI={parts:null,inst:[],max:256,
  reset(){this.inst.forEach(im=>{im.parent&&im.parent.remove(im);im.dispose();});this.inst=[];this.parts=null;},
  adopt(b){const ps=[];b.piv.traverse(o=>{if(o.isMesh&&o!==b.dec)ps.push(o);});
    if(!this.parts){this.parts=ps.map(o=>o.geometry.uuid+o.material.uuid);
      this.inst=ps.map(o=>{const im=new THREE.InstancedMesh(o.geometry,o.material,this.max);im.count=0;im.castShadow=false;im.receiveShadow=true;im.frustumCulled=false;im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);boardsG.add(im);return im;});}
    const same=ps.length===this.parts.length&&ps.every((o,i)=>o.geometry.uuid+o.material.uuid===this.parts[i]);
    b.parts=same?ps:null;if(same)ps.forEach(o=>o.visible=false);},
  update(){if(!this.parts)return;let n=0;
    for(const b of boards){if(!b.alive)continue;b.dec.visible=!b.inMag;if(!b.parts)continue;if(n>=this.max)break;
      b.g.updateMatrixWorld(true);b.parts.forEach((o,k)=>this.inst[k].setMatrixAt(n,o.matrixWorld));n++;}
    this.inst.forEach(im=>{im.count=n;im.instanceMatrix.needsUpdate=true;});}};
const _newBoard0=newBoard;newBoard=function(l){const b=_newBoard0(l);b.g.traverse(o=>{o.castShadow=false;});BI.adopt(b);return b;};

/* merge parts that never move, machine by machine */
function freezeLine(){MACH.forEach(m=>shareMaterials(m.g,shellMats));ZONES.forEach(z=>shareMaterials(z,shellMats));const dyn=new Set();const add=o=>{if(o)dyn.add(o);};
  MACH.forEach(m=>{m.hoods.forEach(h=>add(h.p));[m.car,m.rod,m.finger,m.plat].forEach(add);(m.magG||[]).forEach(add);(m.rot||[]).forEach(add);});
  const A=AOI_.A;if(A){[A.head,A.beam,A.hoodPivot].forEach(add);A.doors.forEach(d=>add(d.g));}
  let a=0,b=0;MACH.forEach(m=>{const r=freezeStatic(m.g,dyn);a+=r.before;b+=r.after;});ZONES.forEach(z=>{const r=freezeStatic(z);a+=r.before;b+=r.after;});
  setupLOD();return{before:a,after:b};}
/* level of detail: the AOI's inner gantry/head/cameras are only drawn when you are close or the cover is open */
function setupLOD(){const A=AOI_.A;if(!A)return;const d=new THREE.Group();d.name='aoi-detail';
  [A.beam,A.head].forEach(o=>{o.parent.remove(o);d.add(o);});A.interior.add(d);machineLOD(AOI_,d,{near:4200,always:()=>xray});}

/* shadows only need recalculating when one of these big parts has moved */
function shadowSig(){if(!LOADER_)return'';const r=Math.round;
  let s=r(LOADER_.cz)+','+r(UNL.cz)+','+r(LOADER_.platY)+','+r(UNL.platY)+','+r(FLIP1.ang*20)+','+r(FLIP2.ang*20);
  LOADER_.mags.forEach(g=>s+=','+r(g.lift||0)+(g.present?1:0));UNL.mags.forEach(g=>s+=','+r(g.lift||0)+(g.present?1:0));
  MACH.forEach(m=>m.hoods.forEach(h=>s+=','+r(h.open*30)));return s;}

/* overview distance follows the screen shape: a portrait phone needs to stand further back to see the whole line */
function overPos(){const k=Math.min(3.2,Math.max(1,1.75/camera.aspect)),T=[0,700,-200],P=[400,4300,8600];return P.map((v,i)=>T[i]+(v-T[i])*k);}
function qDom(){document.querySelectorAll('[data-q]').forEach(b=>b.classList.toggle('on',b.dataset.q===Quality.mode));}

/* loading sequence: show progress instead of a frozen blank page */
async function boot(){
  const nf=()=>new Promise(r=>requestAnimationFrame(()=>setTimeout(r,0)));
  const step=async(k,p)=>{$('ldT').textContent=T(k);$('ldB').style.width=p+'%';await nf();};
  await nf();
  PerfHUD.init($('perf'));RenderGate.init();Quality.onChange=resize;Quality.apply(Quality.mode==='low'?'low':'high');
  document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{Quality.set(b.dataset.q);qDom();});qDom();
  $('hud').querySelector('h2').onclick=()=>$('hud').classList.toggle('open');
  resize();camera.position.set(...overPos());controls.target.set(0,700,-200);
  await step('ld_build',45);i18nDom();rebuild();
  await step('ld_gfx',80);renderer.compile(scene,camera);
  await step('ld_ready',100);$('loading').classList.add('done');window.__sim.ready=true;frame();}
