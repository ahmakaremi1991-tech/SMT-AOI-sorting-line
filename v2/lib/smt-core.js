'use strict';

/* ===================================================================
   SMT LINE SUITE — shared 3D setup.  Units: millimetres.
   X = board flow (left -> right), Y = up, Z = toward the operator.
   Conveyor (board top) at 900 mm; lane 1 at z = +170, lane 2 at z = -170.
   =================================================================== */
const CFG=Object.assign({shadow:1500,shadowFar:6000,shadowMap:2048,maxDist:9000,esd:3400,contact:[4300,2700]},window.SMT_CFG||{});
THREE.ColorManagement.legacyMode=false;
const $=id=>document.getElementById(id);
const PI=Math.PI, BGU=THREE.BufferGeometryUtils;
let seed=20261;
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const rr=(a,b)=>a+(b-a)*rnd(), pick=a=>a[Math.floor(rnd()*a.length)];

/* ---------- renderer / scene ---------- */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.autoClear=false;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x10151d);   /* dark-gray theme colour (also used by the CSS --scene variable) */
const camera=new THREE.PerspectiveCamera(38,1,10,40000);
camera.position.set(2450,1950,3300);
camera.layers.enable(1);camera.layers.enable(2);
const controls=new THREE.OrbitControls(camera,canvas);
controls.target.set(0,880,0);controls.enableDamping=true;controls.dampingFactor=.08;
controls.minDistance=45;controls.maxDistance=CFG.maxDist;controls.maxPolarAngle=PI*.495;

/* environment for reflections (small procedural studio) */
(function(){
  const es=new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.BoxGeometry(100,100,100),new THREE.MeshBasicMaterial({color:0x3a4250,side:THREE.BackSide})));
  const pm=new THREE.MeshBasicMaterial({color:0xffffff});
  [[0,49,0,60,1,60],[-49,10,0,1,40,70],[49,15,20,1,30,40],[0,10,49,70,30,1]].forEach(a=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a[3],a[4],a[5]),pm);m.position.set(a[0],a[1],a[2]);es.add(m);});
  const fl=new THREE.Mesh(new THREE.BoxGeometry(100,1,100),new THREE.MeshBasicMaterial({color:0x1a1d22}));fl.position.y=-49;es.add(fl);
  const pg=new THREE.PMREMGenerator(renderer);
  scene.environment=pg.fromScene(es,0.04).texture;pg.dispose();
})();

const hemi=new THREE.HemisphereLight(0xdfeaff,0x4a4f58,.75);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1.9);
sun.position.set(900,2900,1900);sun.castShadow=true;
sun.shadow.mapSize.set(CFG.shadowMap,CFG.shadowMap);
Object.assign(sun.shadow.camera,{left:-CFG.shadow,right:CFG.shadow,top:CFG.shadow,bottom:-CFG.shadow,near:200,far:CFG.shadowFar});
sun.shadow.bias=-.0004;sun.shadow.normalBias=1.2;
scene.add(sun);
const fill=new THREE.DirectionalLight(0x9fc0ff,.35);fill.position.set(-2000,1500,-1500);scene.add(fill);

/* ---------- helpers ---------- */
function canvasTex(w,h,draw,opt={}){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=renderer.capabilities.getMaxAnisotropy();if(opt.repeat){t.wrapS=t.wrapT=THREE.RepeatWrapping;}return t;}
const std=(color,rough=.6,metal=0,extra={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:rough,metalness:metal,envMapIntensity:metal>.5?1.1:.5},extra));
function box(parent,w,h,d,mat,x,y,z,o={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);if(o.cast!==false)m.castShadow=true;if(o.recv!==false)m.receiveShadow=true;if(o.rx)m.rotation.x=o.rx;if(o.ry)m.rotation.y=o.ry;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;}
function cyl(parent,r1,r2,h,mat,x,y,z,o={}){const m=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,o.seg||28,1,!!o.open),mat);m.position.set(x,y,z);if(o.cast!==false)m.castShadow=true;m.receiveShadow=true;if(o.rx)m.rotation.x=o.rx;if(o.rz)m.rotation.z=o.rz;parent.add(m);return m;}
function label(parent,text,w,h,x,y,z,o={}){
  const t=canvasTex(o.pw||512,o.ph||Math.round((o.pw||512)*h/w),(g,W,H)=>{if(o.bg){g.fillStyle=o.bg;g.fillRect(0,0,W,H);}g.fillStyle=o.fg||'#fff';g.font=(o.weight||'700')+' '+Math.round(H*(o.size||.62))+'px "Segoe UI",Arial,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText(text,W/2,H/2+H*.04);});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:!o.bg,toneMapped:false}));
  m.position.set(x,y,z);if(o.ry)m.rotation.y=o.ry;if(o.rx)m.rotation.x=o.rx;parent.add(m);return m;
}

/* ---------- floor (re-tinted by the theme) ---------- */
const floorMat=std(0xffffff,.82,0);
const stubMat=std(0x2b323d,.75,.1);          /* neighbouring machines in the line */
(function(){
  const f=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),floorMat);
  f.rotation.x=-PI/2;f.receiveShadow=true;scene.add(f);
  // ESD safety line around the machine
  const lt=canvasTex(64,64,(g)=>{g.fillStyle='#e8b923';g.fillRect(0,0,64,64);});
  [[0,1250,CFG.esd,60],[0,-1250,CFG.esd,60]].forEach(a=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(a[2],a[3]),new THREE.MeshBasicMaterial({map:lt,transparent:true,opacity:.55}));m.rotation.x=-PI/2;m.position.set(a[0],1,a[1]);scene.add(m);});
  // soft contact shadow under the machine
  const st=canvasTex(256,256,(g,W,H)=>{const gr=g.createRadialGradient(W/2,H/2,W*.18,W/2,H/2,W*.5);gr.addColorStop(0,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,W,H);});
  const s=new THREE.Mesh(new THREE.PlaneGeometry(CFG.contact[0],CFG.contact[1]),new THREE.MeshBasicMaterial({map:st,transparent:true,depthWrite:false}));
  s.rotation.x=-PI/2;s.position.y=2;scene.add(s);
})();
function floorTex(dark){const t=canvasTex(512,512,(g,W,H)=>{g.fillStyle=dark?'#232a34':'#d5dae0';g.fillRect(0,0,W,H);g.strokeStyle=dark?'rgba(255,255,255,.055)':'rgba(0,0,0,.07)';g.lineWidth=2;g.strokeRect(0,0,W,H);
  for(let i=0;i<900;i++){g.fillStyle=(dark?'rgba(255,255,255,':'rgba(0,0,0,')+(Math.random()*.025)+')';g.fillRect(Math.random()*W,Math.random()*H,2,2);}},{repeat:true});t.repeat.set(40,40);return t;}
const _ftex={};
SMT.onTheme(d=>{
  scene.background.set(d?0x10151d:0xeef1f5);
  const k=d?'d':'l';if(!_ftex[k])_ftex[k]=floorTex(d);floorMat.map=_ftex[k];floorMat.needsUpdate=true;
  stubMat.color.set(d?0x2b323d:0xb7bfc9);hemi.intensity=d?.75:.95;hemi.groundColor.set(d?0x4a4f58:0x9aa3ad);
  renderer.toneMappingExposure=d?1.05:1.0;
});
/* line-neighbour stub with a readable flow label */
function lineStub(x,z,w,d,text){box(scene,w,1000,d,stubMat,x,500,z,NOSH);
  label(scene,text,Math.min(560,w-60),78,x,1001,z+d/2-90,{rx:-PI/2,bg:'#1e6fd9',fg:'#ffffff',pw:900,size:.46});}
/* ===================================================================
   SHARED PCB KIT — the one demo board every machine in the line uses.
   250 x 200 x 1.6 mm, 289 SMD parts.  Units mm, board top at y = BT.
   =================================================================== */
function makePCBKit(THREE,merge,canvasTex){
const PI=Math.PI;let seed=20261;
function rnd(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
const rr=(a,b)=>a+(b-a)*rnd(), pick=a=>a[Math.floor(rnd()*a.length)];
const std=(color,rough=.6,metal=0,extra={})=>new THREE.MeshStandardMaterial(Object.assign({color,roughness:rough,metalness:metal,envMapIntensity:metal>.5?1.1:.5},extra));
const BW=250,BD=200,BT=1.6,BALLS=[];
/* --- — high-detail assembled board (built once, instanced per board)
   =================================================================== */
const PM={ // component materials
  icBody:std(0x16181b,.55,.05), bgaSub:std(0x0e3b26,.5,.05), tin:std(0xd6dadd,.28,.9), solder:std(0xc9ced2,.2,.95),
  ceramic:std(0xe8e6df,.6,0), resTop:std(0x121314,.5,0), mlcc:std(0xb08a5a,.55,0), mlcc2:std(0x8d6b46,.55,0),
  alu:std(0xcfd4d8,.25,.92), ecapBase:std(0x111214,.6,0), tant:std(0xd99a1c,.55,0), tantMark:std(0x7a4a08,.6,0),
  ferrite:std(0x3a3d41,.75,.1), steel:std(0xd9dde0,.2,.95), plastic:std(0x1a1b1e,.6,0), gold:std(0xe2b84a,.25,.95),
  ledBase:std(0xf0efe8,.5,0), ledG:std(0x7dff9a,.3,0,{emissive:0x1bbf4a,emissiveIntensity:.5}), ledR:std(0xff8a8a,.3,0,{emissive:0xd02020,emissiveIntensity:.5}),
  fr4:std(0x0d4a2a,.6,.05)
};
function markMat(w,h,draw){const t=canvasTex(w,h,draw);return new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.35,roughness:.6,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});}
const mk=(lines,col='#b9bdc2')=>(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle=col;g.textAlign='center';g.textBaseline='middle';const n=lines.length;lines.forEach((l,i)=>{g.font=(i==0?'700 ':'500 ')+Math.round(H/(n+1.2)*(i==0?1.05:.8))+'px Arial';g.fillText(l,W/2,H*(i+1)/(n+1));});};
PM.markR=markMat(96,48,mk(['103'],'#e8e8e8'));
PM.markR2=markMat(96,48,mk(['4701'],'#e8e8e8'));
PM.markIC=markMat(256,128,mk(['OPA-2','2231 K7'],'#aeb3b8'));
PM.markIC2=markMat(256,96,mk(['SR-8','A2241'],'#aeb3b8'));
PM.markMCU=markMat(256,256,(g,W,H)=>{mk(['MCU','U-100','2244','9A'])(g,W,H);g.beginPath();g.arc(30,H-30,11,0,7);g.fillStyle='#63686d';g.fill();});
PM.markBGA=markMat(256,256,(g,W,H)=>{mk(['SoC','4-CORE','AB1234.01','2245'])(g,W,H);g.beginPath();g.arc(26,H-26,9,0,7);g.fillStyle='#8a8f94';g.fill();});
PM.markL=markMat(96,96,mk(['4R7'],'#d0d0d0'));
PM.markEcap=(function(){const t=canvasTex(128,128,(g,W,H)=>{g.fillStyle='#c9ced2';g.beginPath();g.arc(64,64,64,0,7);g.fill();g.fillStyle='#17181a';g.beginPath();g.arc(64,64,64,PI*.62,PI*1.38);g.closePath();g.fill();g.fillStyle='#17181a';g.font='700 26px Arial';g.textAlign='center';g.fillText('100',78,52);g.fillText('16V',78,82);g.font='500 16px Arial';g.fillText('K2A',78,104);});return std(0xffffff,.35,.5,{map:t});})();
PM.label=(function(){const t=canvasTex(300,100,(g,W,H)=>{g.fillStyle='#f4f4f0';g.fillRect(0,0,W,H);g.fillStyle='#111';let x=14;while(x<W-14){const w=1+Math.floor(Math.random()*4);g.fillRect(x,10,w,52);x+=w+1+Math.floor(Math.random()*3);}g.font='600 20px Consolas,monospace';g.textAlign='center';g.fillText('SN 0042-A17',W/2,86);});return std(0xffffff,.7,0,{map:t});})();

const geoCache={};
const BX=(w,h,d)=>{const k='b'+w+'_'+h+'_'+d;return geoCache[k]||(geoCache[k]=new THREE.BoxGeometry(w,h,d));};
const CY=(r1,r2,h,s=20)=>{const k='c'+r1+'_'+r2+'_'+h+'_'+s;return geoCache[k]||(geoCache[k]=new THREE.CylinderGeometry(r1,r2,h,s));};
const FLAT=(w,d)=>{const k='f'+w+'_'+d;if(!geoCache[k]){const g=new THREE.PlaneGeometry(w,d);g.rotateX(-PI/2);geoCache[k]=g;}return geoCache[k];};
const DISC=(r)=>{const k='d'+r;if(!geoCache[k]){const g=new THREE.CircleGeometry(r,28);g.rotateX(-PI/2);geoCache[k]=g;}return geoCache[k];};
const BALL=(r)=>{const k='s'+r;return geoCache[k]||(geoCache[k]=new THREE.SphereGeometry(r,7,5));};
class Bucket{constructor(){this.m={};}
  add(mat,geo,mtx){const g=geo.clone();g.applyMatrix4(mtx);(this.m[mat]=this.m[mat]||[]).push(g);}
  build(parent){for(const k in this.m){const g=merge(this.m[k]);this.m[k].forEach(x=>x.dispose());const mesh=new THREE.Mesh(g,PM[k]);mesh.receiveShadow=true;parent.add(mesh);}return parent;}}
const _m=new THREE.Matrix4(),_v=new THREE.Vector3();
function P(ls,mat,geo,x,y,z,ang=0){const m=new THREE.Matrix4().makeRotationY(ang);m.setPosition(x,y,z);ls.push([mat,geo,m]);}
function PR(ls,mat,geo,ang,x,y,z){const m=new THREE.Matrix4().makeRotationY(ang);_v.set(x,y,z).applyMatrix4(m);m.setPosition(_v);ls.push([mat,geo,m]);}
function padR(pd,ang,x,z,w,d){const c=Math.cos(ang),s=Math.sin(ang),odd=Math.abs(s)>.5;pd.push([x*c+z*s,-x*s+z*c,odd?d:w,odd?w:d]);}
function leadRow(ls,pd,n,pitch,edge,H,ang,lw){
  for(let i=0;i<n;i++){const px=(i-(n-1)/2)*pitch;
    PR(ls,'tin',BX(lw,.15,.5),ang,px,H*.55,edge+.2);
    PR(ls,'tin',BX(lw,+(H*.55).toFixed(3),.15),ang,px,H*.275+.04,edge+.45);
    PR(ls,'tin',BX(lw,.15,.65),ang,px,.075,edge+.72);
    padR(pd,ang,px,edge+.75,+(lw+.12).toFixed(3),1.35);}
}
/* --- component builders: fill part list (ls) + pad list (pd), return footprint info --- */
const C={
  chip:(L,W,H,type,mark)=>(ls,pd)=>{const t=+(Math.max(.22,L*.2)).toFixed(3);
    P(ls,type=='R'?'ceramic':(type=='C2'?'mlcc2':'mlcc'),BX(+(L-2*t).toFixed(3),H,W),0,H/2,0);
    P(ls,'tin',BX(t,+(H+.04).toFixed(3),+(W+.04).toFixed(3)),-(L-t)/2,H/2,0);P(ls,'tin',BX(t,+(H+.04).toFixed(3),+(W+.04).toFixed(3)),(L-t)/2,H/2,0);
    if(type=='R'){P(ls,'resTop',BX(+(L-2*t-.04).toFixed(3),.03,+(W-.08).toFixed(3)),0,H+.015,0);if(L>=1.6)P(ls,mark||'markR',FLAT(+(L-2*t-.15).toFixed(3),+(W*.72).toFixed(3)),0,H+.04,0);}
    pd.push([-L/2,0,L*.44,W*1.22],[L/2,0,L*.44,W*1.22]);return{w:L+.9,d:W+.7,h:H,kind:'chip',len:L};},
  led:(col)=>(ls,pd)=>{P(ls,'ledBase',BX(1.6,.3,.8),0,.15,0);P(ls,col,BX(1.0,.45,.78),0,.52,0);P(ls,'tin',BX(.3,.34,.84),-.65,.17,0);P(ls,'tin',BX(.3,.34,.84),.65,.17,0);
    pd.push([-.8,0,.7,1],[.8,0,.7,1]);return{w:2.5,d:1.5,h:.75,kind:'led',len:1.6};},
  soic:(n)=>(ls,pd)=>{const bl=+(n/2*1.27-.18).toFixed(2);
    P(ls,'icBody',BX(bl,1.45,3.9),0,.1+.725,0);P(ls,n>8?'markIC2':'markIC',FLAT(+(bl*.86).toFixed(2),n>8?2.9:3.1),0,1.57,0);
    P(ls,'tin',CY(.28,.28,.02,12),-bl/2+.7,1.56,1.3);
    leadRow(ls,pd,n/2,1.27,1.95,1.5,0,.42);leadRow(ls,pd,n/2,1.27,1.95,1.5,PI,.42);
    return{w:bl+.8,d:6.6,h:1.6,kind:'ic'};},
  qfp:(nps,body,pitch)=>(ls,pd)=>{
    P(ls,'icBody',BX(body,1.4,body),0,.1+.7,0);P(ls,'markMCU',FLAT(+(body*.82).toFixed(2),+(body*.82).toFixed(2)),0,1.52,0);
    for(let k=0;k<4;k++)leadRow(ls,pd,nps,pitch,body/2,1.5,k*PI/2,+(pitch*.46).toFixed(3));
    return{w:body+2.8,d:body+2.8,h:1.6,kind:'ic'};},
  bga:(size,pitch)=>(ls,pd)=>{const n=Math.floor((size-1)/pitch);for(let i=0;i<n;i++)for(let j=0;j<n;j++)BALLS.push([(i-(n-1)/2)*pitch,(j-(n-1)/2)*pitch,pitch*.5,pitch*.5]);
    for(let i=0;i<n;i++)for(let j=0;j<n;j++){if(i>1&&i<n-2&&j>1&&j<n-2)continue;P(ls,'solder',BALL(+(pitch*.3).toFixed(3)),(i-(n-1)/2)*pitch,.24,(j-(n-1)/2)*pitch);}
    P(ls,'bgaSub',BX(size,.36,size),0,.44+.18,0);P(ls,'icBody',BX(size-1.6,1.0,size-1.6),0,.8+.5,0);
    P(ls,'markBGA',FLAT(+(size*.74).toFixed(2),+(size*.74).toFixed(2)),0,1.82,0);
    return{w:size+1,d:size+1,h:1.85,kind:'ic'};},
  qfn:(s)=>(ls,pd)=>{P(ls,'icBody',BX(s,.85,s),0,.45,0);P(ls,'tin',CY(.25,.25,.02,12),-s/2+.7,.87,s/2-.7);
    const n=Math.round(s/.5)-2;for(let k=0;k<4;k++)for(let i=0;i<n;i++)padR(pd,k*PI/2,(i-(n-1)/2)*.5,s/2+.05,.26,.8);
    return{w:s+1,d:s+1,h:.9,kind:'ic'};},
  ecap:(d,h)=>(ls,pd)=>{const r=d/2;
    P(ls,'ecapBase',BX(d+.6,1.5,d+.6),0,.75,0);P(ls,'alu',CY(r,r,+(h-1.9).toFixed(2),28),0,1.4+(h-1.9)/2,0);
    P(ls,'alu',CY(+(r-.5).toFixed(2),r,.5,28),0,h-.25,0);P(ls,'markEcap',DISC(+(r-.5).toFixed(2)),0,h+.02,0);
    P(ls,'tin',BX(1.1,.25,.9),-(r+.75),.125,0);P(ls,'tin',BX(1.1,.25,.9),(r+.75),.125,0);
    pd.push([-(r+.5),0,d*.5,1.9],[(r+.5),0,d*.5,1.9]);return{w:d+1.2,d:d+1.2,h:h,kind:'ecap',round:r+.9};},
  tant:(L,W,H)=>(ls,pd)=>{P(ls,'tant',BX(L-.5,H,W),0,H/2+.03,0);P(ls,'tantMark',BX(.7,.03,W),-L/2+1.1,H+.045,0);
    P(ls,'tin',BX(.4,H*.6,W*.8),-L/2+.1,H*.3,0);P(ls,'tin',BX(.4,H*.6,W*.8),L/2-.1,H*.3,0);
    pd.push([-L/2+.2,0,1.6,W*.9],[L/2-.2,0,1.6,W*.9]);return{w:L+1,d:W+.8,h:H,kind:'tant'};},
  sot23:()=>(ls,pd)=>{P(ls,'icBody',BX(2.9,1.0,1.3),0,.6,0);leadRow(ls,pd,2,1.9,.65,1.0,0,.4);leadRow(ls,pd,1,1.9,.65,1.0,PI,.4);return{w:3.4,d:3.4,h:1.1,kind:'ic'};},
  ind:(s,h)=>(ls,pd)=>{P(ls,'ferrite',BX(s,h,s),0,h/2,0);P(ls,'markL',FLAT(s*.6,s*.6),0,h+.03,0);
    P(ls,'tin',BX(.5,h*.5,s*.7),-s/2,h*.25,0);P(ls,'tin',BX(.5,h*.5,s*.7),s/2,h*.25,0);pd.push([-s/2,0,1.8,s*.8],[s/2,0,1.8,s*.8]);return{w:s+1.2,d:s+.8,h:h,kind:'ic'};},
  xtal:()=>(ls,pd)=>{P(ls,'plastic',BX(11.6,.5,4.9),0,.25,0);P(ls,'steel',BX(10.6,3.0,4.1),0,2,0);pd.push([-5.6,0,2.4,2.2],[5.6,0,2.4,2.2]);return{w:13,d:5.6,h:3.5,kind:'ic'};},
  header:(n,rows)=>(ls,pd)=>{P(ls,'plastic',BX(+(n*2.54).toFixed(2),2.5,+(rows*2.54).toFixed(2)),0,1.25,0);
    for(let i=0;i<n;i++)for(let j=0;j<rows;j++)P(ls,'gold',BX(.64,8.4,.64),(i-(n-1)/2)*2.54,4.2,(j-(rows-1)/2)*2.54);
    return{w:n*2.54+.8,d:rows*2.54+.8,h:8.4,kind:'conn'};},
  usb:()=>(ls,pd)=>{P(ls,'steel',BX(14,7,13),0,3.5,0);P(ls,'plastic',BX(12,5,.5),0,3.5,6.4);pd.push([-7.2,-3,2,3],[7.2,-3,2,3]);return{w:15.5,d:14,h:7,kind:'conn'};},
  dpak:()=>(ls,pd)=>{P(ls,'icBody',BX(6.5,2.3,6.1),0,1.15,0);P(ls,'tin',BX(5.3,.5,1.3),0,.25,-3.6);leadRow(ls,pd,2,4.57,3.05,1.3,0,.8);
    pd.push([0,-1.6,6.4,6.6]);return{w:7.6,d:10,h:2.3,kind:'ic'};}
};

const FIDS=[{x:-105,z:-90},{x:105,z:-90},{x:-105,z:90}];
const T=(function buildTemplate(){
  const S=10,CW=BW*S,CH=BD*S;
  const bucket=new Bucket(),cands=[],places=[],refs={};
  const SIZ={ '0402':[1.0,.5,.35],'0603':[1.6,.8,.45],'0805':[2.0,1.25,.5],'1206':[3.2,1.6,.55] };
  function place(pre,x,z,rot,builder,o={}){
    BALLS.length=0;const ls=[],pd=[],info=builder(ls,pd);refs[pre]=(refs[pre]||0)+1;const name=pre+refs[pre];
    const key=info.kind+'|'+ls.map(q=>q[0]).join(',')+'|'+info.w.toFixed(2)+'x'+info.d.toFixed(2)+'x'+(+info.h).toFixed(2);
    places.push({name,x,z,rot,pd,balls:BALLS.slice(),info,ls,key,cand:!!o.cand,silk:o.silk!==false});
  }
  const R=(sz,x,z,rot,o)=>{const s=SIZ[sz];place('R',x,z,rot,C.chip(s[0],s[1],s[2],'R',rnd()<.5?'markR':'markR2'),o);};
  const Cc=(sz,x,z,rot,o)=>{const s=SIZ[sz];place('C',x,z,rot,C.chip(s[0],s[1],+(Math.min(s[1]*.95,1.3)).toFixed(2),rnd()<.3?'C2':'C'),o);};
  const H=PI/2;
  /* ---- layout (mm, origin = board centre) ---- */
  // U1: big BGA + decoupling ring
  place('U',-65,-40,0,C.bga(27,1.0));
  for(let i=0;i<7;i++){Cc('0402',-77+i*4,-59,0);Cc('0402',-77+i*4,-21,0);Cc('0402',-84,-52+i*4,H);Cc('0402',-46,-52+i*4,H);}
  // U2: QFP-100 + crystal
  place('U',-65,40,0,C.qfp(25,14,.5));
  for(let i=0;i<7;i++){R('0603',-80+i*5,56,H);Cc('0603',-80+i*5,25,H);}
  place('Y',-93,40,H,C.xtal());Cc('0603',-93,50,0);Cc('0603',-93,30,0);
  // U3: BGA 17
  place('U',-5,-50,0,C.bga(17,.8));
  for(let i=0;i<4;i++){Cc('0402',9,-56+i*4,H);Cc('0402',-19,-56+i*4,H);Cc('0402',-11+i*4,-64,0);}
  // U4: QFP-64
  place('U',0,15,0,C.qfp(16,10,.5));
  for(let i=0;i<5;i++){R('0805',-12+i*6,30,H,{cand:i==1});Cc('0805',-12+i*6,1,H);}
  // U5: QFP-44
  place('U',-5,65,0,C.qfp(11,10,.8));
  for(let i=0;i<4;i++){R('1206',15+i*5,61,H,{cand:i==2});Cc('1206',15+i*5,71,H);}
  // SOIC logic row
  for(let i=0;i<4;i++)place('U',35+i*12,-6,0,C.soic(8),{cand:i==1});
  place('U',40,15,0,C.soic(16));place('U',62,15,0,C.soic(16));
  for(let i=0;i<7;i++)Cc('0603',35+i*6,5,0);
  for(let i=0;i<9;i++)R('1206',34+i*6,28,H,{cand:i==4||i==7});
  // power section
  place('U',40,-35,0,C.qfn(5));place('U',55,-35,0,C.qfn(5));
  place('L',72,-35,0,C.ind(6,3));place('L',72,-52,0,C.ind(6,3));
  place('Q',40,-56,0,C.dpak());
  place('C',56,-50,0,C.tant(7.3,4.3,2.8),{cand:true});place('C',56,-58,0,C.tant(7.3,4.3,2.8));
  [[95,-76],[108,-76],[95,-61],[108,-61]].forEach(p=>place('C',p[0],p[1],0,C.ecap(8,10)));
  place('C',94,-46,0,C.ecap(6.3,7.7),{cand:true});place('C',105,-46,0,C.ecap(6.3,7.7));
  place('C',100,-29,0,C.ecap(10,10.5));
  for(let i=0;i<3;i++)place('C',95+i*10,-9,H,C.tant(3.5,2.8,1.9));
  // connectors
  place('J',100,20,H,C.header(10,2));place('J',100,60,H,C.header(8,1));
  place('J',50,-90,0,C.header(13,2));place('J',85,90,0,C.usb());
  // LEDs and small-signal
  for(let i=0;i<6;i++){place('D',20+i*8,89,0,C.led(i%2?'ledR':'ledG'),{cand:i==2});R('0603',20+i*8,83,0);}
  for(let i=0;i<6;i++){place('Q',30+i*10,45,0,C.sot23(),{cand:i==3});R('0603',30+i*10,38.5,0);Cc('0402',30+i*10,51,0);}
  // passive fields
  for(let i=0;i<21;i++)(i%2?R:Cc)('0805',-110,-70+i*7,0,{cand:i==6||i==15});
  for(let c=0;c<3;c++)for(let i=0;i<10;i++)(((c+i)%3)?R:Cc)('0603',-38+c*6,-60+i*4,H,{cand:(c==1&&i==5)});
  place('U',-32,13,0,C.soic(8));place('U',-32,26,0,C.soic(8));
  for(let c=0;c<5;c++)for(let i=0;i<5;i++)(((c*2+i)%3)?R:Cc)('0805',-42+c*5,42+i*7,H,{cand:(c==2&&i==2)||(c==4&&i==0)});
  for(let i=0;i<11;i++)Cc('1206',22+i*6,-76,H,{cand:i==5});
  for(let i=0;i<15;i++)R('0603',-100+i*5,-72,H);
  for(let i=0;i<21;i++)Cc('0402',-50+i*3,86,H);
  for(let i=0;i<11;i++)R('0805',113,10+i*6,0,{cand:i==8});

  /* ---- board artwork (solder mask, traces, pads, silkscreen) ---- */
  const tex=canvasTex(CW,CH,(g)=>{
    const X=x=>(x+BW/2)*S,Z=z=>(z+BD/2)*S;
    g.fillStyle='#0f5a31';g.fillRect(0,0,CW,CH);
    // subtle copper-pour hatch
    g.strokeStyle='rgba(30,140,80,.18)';g.lineWidth=1;for(let i=-CH;i<CW;i+=14){g.beginPath();g.moveTo(i,0);g.lineTo(i+CH,CH);g.stroke();}
    // traces
    const padPts=[];places.forEach(p=>{const c=Math.cos(p.rot),s=Math.sin(p.rot);p.pd.forEach(a=>padPts.push([p.x+a[0]*c+a[1]*s,p.z-a[0]*s+a[1]*c]));});
    const dirs=[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]];
    g.lineCap='round';g.lineJoin='round';
    for(let i=0;i<620;i++){let p=pick(padPts),x=p[0],z=p[1],d=Math.floor(rnd()*8);
      g.strokeStyle=rnd()<.5?'#178049':'#1a8a4f';g.lineWidth=rnd()<.12?5:(rnd()<.5?2.2:1.6);g.beginPath();g.moveTo(X(x),Z(z));
      const n=2+Math.floor(rnd()*4);for(let k=0;k<n;k++){const l=rr(2,16),dd=dirs[d];x=Math.max(-121,Math.min(121,x+dd[0]*l));z=Math.max(-96,Math.min(96,z+dd[1]*l));g.lineTo(X(x),Z(z));d=(d+(rnd()<.5?1:7))%8;}
      g.stroke();
      if(rnd()<.75){g.fillStyle='#c9a54a';g.beginPath();g.arc(X(x),Z(z),3.6,0,7);g.fill();g.fillStyle='#0a2e1a';g.beginPath();g.arc(X(x),Z(z),1.5,0,7);g.fill();}
    }
    // pads (ENIG gold)
    places.forEach(p=>{g.save();g.translate(X(p.x),Z(p.z));g.rotate(-p.rot);
      p.pd.forEach(a=>{g.fillStyle='#0a3f22';g.fillRect((a[0]-a[2]/2)*S-1.5,(a[1]-a[3]/2)*S-1.5,a[2]*S+3,a[3]*S+3);g.fillStyle='#d9b85c';g.fillRect((a[0]-a[2]/2)*S,(a[1]-a[3]/2)*S,a[2]*S,a[3]*S);});
      g.restore();});
    places.forEach(p=>{if(!p.balls.length)return;g.save();g.translate(X(p.x),Z(p.z));g.rotate(-p.rot);
      p.balls.forEach(a=>{g.fillStyle='#d9b85c';g.beginPath();g.arc(a[0]*S,a[1]*S,a[2]*S*.55,0,7);g.fill();});g.restore();});
    // silkscreen
    g.strokeStyle='#f1f3f0';g.fillStyle='#f1f3f0';g.lineWidth=1.6;
    places.forEach(p=>{const i=p.info;if(!p.silk||i.w<2.4)return;g.save();g.translate(X(p.x),Z(p.z));g.rotate(-p.rot);
      if(i.round){g.beginPath();g.arc(0,0,i.round*S,0,7);g.stroke();g.font='700 22px Arial';g.fillText('+',-i.round*S-16,-i.round*S+10);}
      else if(i.kind=='ic'||i.kind=='conn'||i.kind=='tant'){const w=i.w*S+6,d=i.d*S+6;const c=10;
        [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(q=>{g.beginPath();g.moveTo(q[0]*w/2,q[1]*(d/2-c));g.lineTo(q[0]*w/2,q[1]*d/2);g.lineTo(q[0]*(w/2-c),q[1]*d/2);g.stroke();});
        g.beginPath();g.arc(-w/2-5,d/2+5,2.6,0,7);g.fill();}
      g.restore();
      if(i.kind!='chip'&&i.kind!='led'){g.font='600 13px Arial';const ex=(Math.abs(Math.sin(p.rot))>.5?i.d:i.w)/2,ez=(Math.abs(Math.sin(p.rot))>.5?i.w:i.d)/2;g.fillText(p.name,X(p.x-ex),Z(p.z-ez)-8);}
    });
    g.font='700 26px Arial';g.fillText('SMT DEMO BOARD · REV C',X(-100),Z(96.5));
    g.font='600 15px Arial';g.fillText('SMT LINE SIMULATION · 94V-0 · 2026-W46',X(-30),Z(96.5));
    // fiducials + tooling holes
    FIDS.forEach(f=>{g.fillStyle='#3a2a16';g.beginPath();g.arc(X(f.x),Z(f.z),15,0,7);g.fill();g.fillStyle='#e0bf62';g.beginPath();g.arc(X(f.x),Z(f.z),5,0,7);g.fill();});
    [[-118,-93],[118,-93],[-118,93],[118,93]].forEach(h=>{g.fillStyle='#d9b85c';g.beginPath();g.arc(X(h[0]),Z(h[1]),30,0,7);g.fill();g.fillStyle='#07090b';g.beginPath();g.arc(X(h[0]),Z(h[1]),16,0,7);g.fill();});
    g.strokeStyle='#caa64a';g.lineWidth=3;g.strokeRect(2,2,CW-4,CH-4);
  });
  const boardTop=std(0xffffff,.42,.12,{map:tex});
  const st=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(BW,BT,BD),PM.fr4);body.position.y=BT/2;body.castShadow=true;body.receiveShadow=true;st.add(body);
  const top=new THREE.Mesh(FLAT(BW,BD),boardTop);top.position.y=BT+.01;top.receiveShadow=true;st.add(top);
  const lb=new THREE.Mesh(FLAT(30,10),PM.label);lb.position.set(-68,BT+.05,-86);st.add(lb);
  const all=new Bucket(),noCand=new Bucket();
  places.forEach(p=>{const m=new THREE.Matrix4().makeRotationY(p.rot);m.setPosition(p.x,BT,p.z);
    p.ls.forEach(a=>{const mm=new THREE.Matrix4().multiplyMatrices(m,a[2]);all.add(a[0],a[1],mm);if(!p.cand)noCand.add(a[0],a[1],mm);});
    if(p.cand){const g=new THREE.Group(),b=new Bucket();p.ls.forEach(a=>b.add(a[0],a[1],a[2]));b.build(g);g.position.set(p.x,BT,p.z);g.rotation.order='YXZ';g.rotation.y=p.rot;
      cands.push({name:p.name,kind:p.info.kind,len:p.info.len||0,group:g,x:p.x,z:p.z,rot:p.rot,w:p.info.w,d:p.info.d,h:p.info.h});}});
  const compsAll=all.build(new THREE.Group()),compsNoCand=noCand.build(new THREE.Group());
  /* pad list for paste / stencil apertures: [x, z, w, d, name] (connectors are through-hole: no paste) */
  const pads=[];
  places.forEach(p=>{if(p.info.kind=='conn')return;const c=Math.cos(p.rot),s=Math.sin(p.rot),odd=Math.abs(s)>.5;
    p.pd.concat(p.balls).forEach((a,k)=>{pads.push([p.x+a[0]*c+a[1]*s,p.z-a[0]*s+a[1]*c,+((odd?a[3]:a[2])*.9).toFixed(3),+((odd?a[2]:a[3])*.9).toFixed(3),p.name+(p.pd.length>2?'.'+(k+1):'')]);});});
  function pasteGeo(skip){const pg=[];pads.forEach((q,i)=>{if(skip&&skip.has(i))return;const g=new THREE.BoxGeometry(q[2],.13,q[3]);g.translate(q[0],BT+.075,q[1]);pg.push(g);});const m=merge(pg);pg.forEach(g=>g.dispose());return m;}
  function candPadIdx(n){const idx=new Set(),stp=Math.floor(pads.length/n);for(let i=0;i<pads.length&&idx.size<n;i+=stp){let k=i;while(k<pads.length&&pads[k][2]*pads[k][3]<.25)k++;if(k<pads.length)idx.add(k);}return idx;}
  function partGroup(p){const g=new THREE.Group(),b=new Bucket();p.ls.forEach(a=>b.add(a[0],a[1],a[2]));b.build(g);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
  /* a new Group of fresh meshes sharing geometry/material with template groups */
  function inst(...groups){const g=new THREE.Group();groups.forEach(t=>t.children.forEach(m=>{const c=new THREE.Mesh(m.geometry,m.material);c.position.copy(m.position);c.rotation.copy(m.rotation);c.receiveShadow=true;c.castShadow=m.castShadow;g.add(c);}));return g;}
  let tris=0;compsAll.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});
  return{board:st,boardTop,compsAll,compsNoCand,cands,places,pads,pasteGeo,candPadIdx,partGroup,inst,tris:Math.round(tris)};
})();


return Object.assign(T,{BW,BD,BT,FIDS,FLAT,PM});
}

/* ===================================================================
   BOARD HANDLING LINE — nine handling machines, one page.
   Units mm.  X = board flow, Y = up, Z = toward the operator.
   Board top at 901.6 mm; lane 1 at z = +170, lane 2 at z = -170.
   Single-lane machines run on lane 1 (as the line printer does).
   =================================================================== */
const CONV_Y=950,BT=1.6,LZ=[170,-170],NOSH={cast:false};
let BW=250,BD=200,PSCALE=1;          // panel length / width (mm) and scale; the sorting line sets them from the magazine width
const shellMats=[];
const sm=(c,r=.55,m=.05)=>{const x=std(c,r,m);shellMats.push(x);return x;};
const M={
  body:sm(0xdfe3e7,.5,.08),body2:sm(0xc6ccd3,.5,.12),frame:sm(0x3b4048,.55,.25),blue:sm(0x1e6fd9,.45,.12),
  dark:std(0x24272b,.6,.2),alu:std(0xb9c0c8,.35,.85),aluD:std(0x7d858f,.45,.8),steel:std(0xd5dadf,.22,.95),black:std(0x15171a,.55,.2),
  yellow:std(0xf2c400,.5),red:std(0xc8202a,.5,.1),green:std(0x21b354,.4,.1),mag:std(0x8d959e,.45,.6),magD:std(0x4a5058,.5,.5),
  rubber:std(0x1b1d20,.9,0),cup:std(0x2a2d31,.7,0),brush:std(0x2e3a5a,.95,0),glass:null
};
M.glass=new THREE.MeshStandardMaterial({color:0x9db4c8,roughness:.05,metalness:.2,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
const KIT=makePCBKit(THREE,a=>BGU.mergeBufferGeometries(a,false),canvasTex);const FLAT=KIT.FLAT;

/* ---------- conveyor belt texture (animated while boards move) ---------- */
const beltTex=canvasTex(64,16,(g)=>{g.fillStyle='#1c1e21';g.fillRect(0,0,64,16);g.fillStyle='#2c3035';for(let x=0;x<64;x+=16)g.fillRect(x,0,6,16);},{repeat:true});
beltTex.repeat.set(.06,1);
const beltMat=std(0xffffff,.9,0,{map:beltTex});
function rails(g,xa,xb,z,y=CONV_Y,o={}){const len=xb-xa,cx=(xa+xb)/2;
  [-1,1].forEach(s=>{const rz=z+s*(BD/2+7);
    box(g,len,42,12,M.alu,cx,y-19,rz);box(g,len,6,5,M.aluD,cx,y+9,rz-s*3.5,NOSH);
    const b=new THREE.Mesh(new THREE.BoxGeometry(len,3,6),beltMat);b.position.set(cx,y-1.5,z+s*(BD/2-2.5));g.add(b);
    if(o.legs!==false)for(let x=xa+60;x<xb-20;x+=Math.max(200,len/3))box(g,26,y-40-(o.legBase||820),26,M.aluD,x,(y-40+(o.legBase||820))/2,rz);});
  if(o.motor!==false)box(g,60,34,16,M.black,xa+40,y-19,z+BD/2+21,NOSH);
}

/* ---------- generic enclosure: lower cabinet, posts, glass hood (lifts), function label ---------- */
function enclosure(m,o){
  const g=m.g,L=m.L,x0=-L/2,x1=L/2,D=o.D||1100,z0=o.z0??-D/2,z1=o.z1??D/2,H=o.H||1650,cab=o.cab||800;
  box(g,L,cab-100,z1-z0,M.body,0,(cab+100)/2,(z0+z1)/2,NOSH);
  box(g,L-40,90,z1-z0-60,M.dark,0,55,(z0+z1)/2,NOSH);
  [[x0+60,z0+60],[x1-60,z0+60],[x0+60,z1-60],[x1-60,z1-60]].forEach(p=>{cyl(g,30,36,14,M.steel,p[0],7,p[1]);cyl(g,10,10,60,M.steel,p[0],40,p[1]);});
  // front service doors on the cabinet
  const nd=Math.max(1,Math.round(L/600)),dw=(L-20)/nd;
  for(let i=0;i<nd;i++){box(g,dw-14,cab-260,6,M.body2,x0+10+dw*(i+.5),(cab+140)/2-20,z1+3,NOSH);box(g,12,90,12,M.dark,x0+10+dw*(i+1)-50,cab-260,z1+9,NOSH);}
  // function label band
  const lw=Math.min(L-40,o.labelW||L-40);
  label(g,m.name,lw,92,0,o.labelY||cab-70,z1+6.5,{bg:'#1e6fd9',fg:'#ffffff',pw:Math.round(lw*2),size:.62,weight:'900'});
  if(o.upper===false)return;
  // upper frame: posts + top rails + roof
  [[x0+15,z0+15],[x1-15,z0+15],[x0+15,z1-15],[x1-15,z1-15]].forEach(p=>box(g,30,H-cab,30,M.frame,p[0],(H+cab)/2,p[1]));
  box(g,L,24,30,M.frame,0,H-12,z0+15);box(g,L,24,30,M.frame,0,H-12,z1-15);box(g,30,24,z1-z0,M.frame,x0+15,H-12,(z0+z1)/2);box(g,30,24,z1-z0,M.frame,x1-15,H-12,(z0+z1)/2);
  const roof=new THREE.Mesh(new THREE.BoxGeometry(L-30,8,z1-z0-30),M.body);roof.position.set(0,H-4,(z0+z1)/2);g.add(roof);shellMats.includes(M.body);
  // rear and side glass (side glass leaves the conveyor band open)
  const pg=(w,h,x,y,z,ry)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),M.glass);p.position.set(x,y,z);if(ry)p.rotation.y=ry;p.renderOrder=5;g.add(p);};
  pg(L-60,H-cab-40,0,(H+cab)/2,z0+2);
  [x0+2,x1-2].forEach(x=>pg(z1-z0-60,H-1000-30,x,(H+1000)/2-10,(z0+z1)/2,PI/2));
  // hood: front glass door hinged along the top front edge
  const hp=new THREE.Group();hp.position.set(0,H-20,z1-15);g.add(hp);
  const hw=L-70,hh=H-cab-50;
  const fr=new THREE.Group();hp.add(fr);
  box(fr,hw,18,14,M.frame,0,-hh+9,0,NOSH);box(fr,hw,16,14,M.frame,0,-8,0,NOSH);box(fr,16,hh,14,M.frame,-hw/2+8,-hh/2,0,NOSH);box(fr,16,hh,14,M.frame,hw/2-8,-hh/2,0,NOSH);
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(hw-32,hh-34),M.glass);gl.position.set(0,-hh/2,2);gl.renderOrder=5;fr.add(gl);
  box(fr,Math.min(300,hw*.5),14,14,M.steel,0,-hh+36,20,NOSH);
  m.hoods.push({p:hp,open:0,target:0,ang:-1.15});
  m.H=H;
  return {x0,x1,z0,z1,H,cab};
}
function signal(m,x,z,H){const g=new THREE.Group();g.position.set(x,H,z);m.g.add(g);cyl(g,7,7,160,M.steel,0,80,0);
  const L={};[['r',0xff2a2a,214],['y',0xffa800,186],['g',0x22e06a,158]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3});L[a[0]]=mt;cyl(g,16,16,26,mt,0,a[2]+13,0);});m.lamps=L;}

/* ---------- boards ---------- */
const bottomMat=std(0xffffff,.55,.05,{map:canvasTex(1000,800,(g,W,H)=>{g.fillStyle='#0f5a31';g.fillRect(0,0,W,H);g.strokeStyle='rgba(30,140,80,.25)';for(let i=-H;i<W;i+=12){g.beginPath();g.moveTo(i,0);g.lineTo(i+H,H);g.stroke();}
  g.fillStyle='#d9b85c';for(let i=0;i<260;i++){const x=Math.random()*W,y=Math.random()*H;g.fillRect(x,y,8,5);}
  g.fillStyle='#f1f3f0';g.font='700 46px Arial';g.fillText('BOTTOM SIDE',40,H-40);g.strokeStyle='#caa64a';g.lineWidth=6;g.strokeRect(3,3,W-6,H-6);})});
let serial=0;const DM_X=-40,DM_Z=-88,DM=12;
function newBoard(lane=0){
  const g=new THREE.Group(),piv=new THREE.Group();g.add(piv);
  const inner=KIT.inst(KIT.board);inner.position.y=-BT/2;piv.add(inner);
  const bot=new THREE.Mesh(FLAT(BW,BD),bottomMat);bot.rotation.x=PI;bot.position.y=-BT/2-.02;piv.add(bot);
  const c=document.createElement('canvas');c.width=c.height=112;const tex=new THREE.CanvasTexture(c);tex.encoding=THREE.sRGBEncoding;
  const dec=new THREE.Mesh(FLAT(DM,DM),new THREE.MeshBasicMaterial({map:tex,transparent:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-4}));
  dec.position.set(DM_X,BT/2+.03,DM_Z);dec.visible=false;piv.add(dec);
  if(PSCALE!==1)g.scale.setScalar(PSCALE);
  const b={g,piv,dec,dc:c,dt:tex,x:-1e5,z:LZ[lane],dy:0,lane,flip:0,sn:++serial,marked:false,code:'',bits:null,alive:true};
  boardsG.add(g);boards.push(b);return b;
}
const boardsG=new THREE.Group();scene.add(boardsG);let boards=[];
function killBoard(b){b.alive=false;boardsG.remove(b.g);b.dt.dispose();}
function dmBits(sn){let h=sn*2654435761>>>0;const n=14,bits=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++){let v;
  if(x==0||y==n-1)v=1;else if(y==0)v=x%2==0;else if(x==n-1)v=y%2==1;else{h^=h<<13;h^=h>>>17;h^=h<<5;v=(h>>>0)%100<48;}bits.push(v?1:0);}return bits;}
function drawMark(b,p){const c=b.dc,g=c.getContext('2d'),n=14,s=c.width/(n+2);g.clearRect(0,0,c.width,c.height);
  if(!b.bits)b.bits=dmBits(b.sn);g.fillStyle='rgba(40,120,70,.55)';g.fillRect(0,0,c.width,c.height);g.fillStyle='#e9f3df';
  const lim=Math.floor(p*n*n);for(let i=0;i<lim;i++)if(b.bits[i])g.fillRect(s*(1+i%n),s*(1+Math.floor(i/n)),s+.5,s+.5);b.dt.needsUpdate=true;b.dec.visible=true;}
function markFull(b){b.marked=true;b.code='SN2611'+String(b.sn).padStart(5,'0');drawMark(b,1);}


/* ===================================================================
   MACHINES — modelled on manufacturer data (sizes in mm, L along the
   line, W front-to-back, H).  Source noted per machine.
   =================================================================== */
const MACH=[];
function machine(o){const m=Object.assign({hoods:[],tags:[],inbox:[[],[]],busy:[false,false],state:'IDLE',done:0,outT:[],procT:[],lanesIn:[0],gap:0,g:new THREE.Group()},o);
  MACH.push(m);scene.add(m.g);return m;}
const V=233;                       // belt speed 14 m/min (manufacturer datasheets)
const RAIL_F=LZ[0]+200/2+7;         // fixed (front) rail position, z
M.ral=sm(0xdcdcd2,.55,.05);M.ral2=sm(0xcfcfc4,.55,.06);M.ralD=sm(0x9fa19b,.5,.1);
M.pnl=sm(0xe6e8ea,.5,.06);M.pnlD=sm(0x4f555d,.5,.2);M.inox=sm(0xc9ced3,.3,.8);
M.smoke=new THREE.MeshStandardMaterial({color:0x1a2026,roughness:.08,metalness:.3,transparent:true,opacity:.55,depthWrite:false,side:THREE.DoubleSide});
M.orange=std(0xf07a1c,.5,.05);

/* ---------- small parts ---------- */
const P=(g,w,h,d,mat,x,y,z)=>box(g,w,h,d,mat,x,y,z,NOSH);
function feet(g,x0,x1,z0,z1){[[x0+50,z0+50],[x1-50,z0+50],[x0+50,z1-50],[x1-50,z1-50]].forEach(p=>{cyl(g,26,30,10,M.steel,p[0],5,p[1]);cyl(g,9,9,60,M.steel,p[0],40,p[1]);});}
function touch(g,x,y,z,w=190,h=120){P(g,w,h,14,M.black,x,y,z+7);
  const t=canvasTex(256,160,(c)=>{c.fillStyle='#103a20';c.fillRect(0,0,256,160);c.fillStyle='#2ee068';c.fillRect(8,8,240,144);c.fillStyle='#0c2e18';c.font='700 20px Arial';c.fillText('RUN',16,34);c.fillRect(16,48,224,4);c.fillRect(16,64,140,4);c.fillRect(16,80,180,4);});
  const s=new THREE.Mesh(new THREE.PlaneGeometry(w-24,h-24),new THREE.MeshBasicMaterial({map:t,toneMapped:false}));s.position.set(x,y,z+14.5);g.add(s);}
function estop(g,x,y,z){P(g,70,70,4,M.yellow,x,y,z+2);cyl(g,22,18,22,M.red,x,y,z+14,{rx:PI/2,cast:false});}
function knob(g,x,y,z){P(g,60,60,10,M.orange,x,y,z+5);cyl(g,15,15,22,M.black,x,y,z+18,{rx:PI/2,cast:false});}
function vents(g,x,y,z,w=140){for(let i=0;i<4;i++)P(g,w,5,3,M.black,x,y+i*14,z+1.5);}
function handle(g,x,y,z,h=110){P(g,26,h,16,M.black,x,y,z+8);}
function fnLabel(g,text,w,x,y,z,ry=0){label(g,text,w,70,x,y,z,{bg:'#1e6fd9',fg:'#ffffff',pw:Math.round(w*2.2),size:.6,weight:'900',ry});}
function signal(m,x,z,H){const g=new THREE.Group();g.position.set(x,H,z);m.g.add(g);cyl(g,7,7,190,M.steel,0,95,0);
  const L={};[['r',0xff2a2a,244],['y',0xffa800,216],['g',0x22e06a,188]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3});L[a[0]]=mt;cyl(g,16,16,26,mt,0,a[2]+13,0);});m.lamps=L;}
/* hinged lid / door. kind 'lid': hinge at rear-top edge, lid extends +z.  kind 'door': hinge at top-front edge, door hangs down. */
function hinged(m,kind,w,d,x,y,z,glass=true,mat=M.ral){const p=new THREE.Group();p.position.set(x,y,z);m.g.add(p);
  if(kind==='lid'){P(p,w,12,30,mat,0,0,15);P(p,w,12,30,mat,0,0,d-15);P(p,30,12,d,mat,-w/2+15,0,d/2);P(p,30,12,d,mat,w/2-15,0,d/2);
    const gl=new THREE.Mesh(new THREE.BoxGeometry(w-60,4,d-60),glass?M.smoke:mat);gl.position.set(0,0,d/2);gl.renderOrder=5;p.add(gl);P(p,Math.min(240,w*.5),12,14,M.steel,0,10,d-10);}
  else{P(p,w,26,14,mat,0,-13,0);P(p,w,26,14,mat,0,-d+13,0);P(p,26,d,14,mat,-w/2+13,-d/2,0);P(p,26,d,14,mat,w/2-13,-d/2,0);
    const gl=new THREE.Mesh(new THREE.BoxGeometry(w-52,d-52,4),glass?M.smoke:mat);gl.position.set(0,-d/2,0);gl.renderOrder=5;p.add(gl);P(p,Math.min(260,w*.5),14,14,M.steel,0,-d+40,16);}
  m.hoods.push({p,open:0,target:0,ang:kind==='lid'?-1.2:-1.1});return p;}
/* end-wall with a slot opening for the conveyor at given lanes */
function endWall(g,x,z0,z1,y0,y1,lanes,mat=M.ral){const segs=[];let zc=z0;lanes.slice().sort((a,b)=>a-b).forEach(l=>{segs.push([zc,l-135]);zc=l+135;});segs.push([zc,z1]);
  segs.forEach(s=>{if(s[1]-s[0]>2)P(g,12,y1-y0,s[1]-s[0],mat,x,(y0+y1)/2,(s[0]+s[1])/2);});
  lanes.forEach(l=>{P(g,12,CONV_Y-60-y0,270,mat,x,(CONV_Y-60+y0)/2,l);P(g,12,y1-CONV_Y-80,270,mat,x,(y1+CONV_Y+80)/2,l);});}
function shell(g,x0,x1,z0,z1,y0,y1,mat,o={}){ // closed box with optional open faces and end-wall conveyor slots
  if(!o.noFront)P(g,x1-x0,y1-y0,12,mat,(x0+x1)/2,(y0+y1)/2,z1-6);
  if(!o.noRear)P(g,x1-x0,y1-y0,12,mat,(x0+x1)/2,(y0+y1)/2,z0+6);
  if(!o.noTop)P(g,x1-x0,12,z1-z0,mat,(x0+x1)/2,y1-6,(z0+z1)/2);
  [[x0+6,o.left],[x1-6,o.right]].forEach(([x,ln])=>{if(ln===false)return;if(ln&&ln.length)endWall(g,x,z0,z1,y0,y1,ln,mat);else P(g,12,y1-y0,z1-z0,mat,x,(y0+y1)/2,(z0+z1)/2);});}

/* ---------- triple-magazine handler (loader / unloader share the design) ---------- */
const MG={L:355,W:208,H:570,base:40,pitch:20,tooth:10,slots:25,use:20,tag:'164'};   // 355 long; width set to the board; comb rails every 10 mm, a board every 2nd slot (20 mm) so the gap is visible; top 5 positions empty
M.magW=std(0xd9dbd7,.62,.05);M.comb=std(0x18191b,.7,.05);
const _magGeo={};
function magGeo(W){                           // open-frame magazine for inner width W, merged per material and cached
  if(_magGeo[W])return _magGeo[W];
  const parts={w:[],c:[]};const L=MG.L,H=MG.H;
  const add=(k,w,h,d,x,y,z,rx=0,rz=0)=>{const g=new THREE.BoxGeometry(w,h,d);if(rx)g.rotateX(rx);if(rz)g.rotateZ(rz);g.translate(x,y,z);parts[k].push(g);};
  [-1,1].forEach(s=>{const zw=s*(W/2+12);
    [-1,1].forEach(e=>add('w',36,H,10,e*(L/2-18),H/2,zw));
    add('w',L,34,10,0,H-17,zw);add('w',L,30,10,0,15,zw);
    const dl=Math.hypot(L-72,H-64),an=Math.atan2(H-64,L-72);
    add('w',dl,9,5,0,H/2,s*(W/2+19),0,an);add('w',dl,9,5,0,H/2,s*(W/2+19),0,-an);
    add('c',L-80,H-70,3,0,H/2,s*(W/2+6));
    for(let j=0;j<(H-90)/MG.tooth;j++)add('c',L-84,2.6,10,0,MG.base+j*MG.tooth-BT/2-1.3,s*(W/2));
    for(let j=0;j<(H-90)/MG.tooth;j+=2)[-1,1].forEach(e=>add('c',8,1.6,1,e*(L/2-18),MG.base+j*MG.tooth,s*(W/2+17.5)));
  });
  [-1,1].forEach(e=>{add('w',36,30,W+34,e*(L/2-18),H-15,0);add('w',36,24,W+34,e*(L/2-18),12,0);});
  add('w',L-40,6,W+10,0,3,0);
  add('w',20,20,W-20,0,H+30,0);[-1,1].forEach(q=>add('w',16,34,16,0,H+12,q*(W/2-20)));
  const out={};for(const k in parts){out[k]=BGU.mergeBufferGeometries(parts[k],false);parts[k].forEach(g=>g.dispose());}return _magGeo[W]=out;}
function magMesh(par,face){const g=new THREE.Group();par.add(g);
  const G=magGeo(MG.W);[['w',M.magW],['c',M.comb]].forEach(([k,mt])=>{const m=new THREE.Mesh(G[k],mt);m.castShadow=true;m.receiveShadow=true;g.add(m);});
  label(g,MG.tag,70,30,face*(MG.L/2+.5),MG.H-15,0,{bg:'#1b1d20',fg:'#ffffff',pw:180,size:.72,ry:face*PI/2});
  return g;}
function buildMagHandler(m,isLoader){
  const L=m.L,x0=-L/2,x1=L/2,z1=m.z1,z0=m.z0,H=1750,s=isLoader?1:-1;
  // magazine bay on the free end (upstream for the loader, downstream for the unloader), shuttle housing towards the line
  const bx0=isLoader?x0:20,bx1=isLoader?-20:x1,hx0=isLoader?-20:x0,hx1=isLoader?x1:20;
  m.magX=(bx0+bx1)/2;m.shX=(hx0+hx1)/2;
  feet(m.g,x0,x1,z0,z1);
  // bay: plinth, platform lifter columns, upper panel, side walls
  P(m.g,bx1-bx0,260,z1-z0,M.ral,(bx0+bx1)/2,180,(z0+z1)/2);
  P(m.g,bx1-bx0,240,z1-z0,M.ral,(bx0+bx1)/2,H-120,(z0+z1)/2);                       // upper beam panel (documents hang here)
  P(m.g,bx1-bx0,H-310,24,M.ral,(bx0+bx1)/2,(H+310)/2,z1-12);P(m.g,bx1-bx0,H-310,24,M.ral,(bx0+bx1)/2,(H+310)/2,z0+12);
  [z0+70,z1-70].forEach(z=>P(m.g,60,1100,60,M.ralD,m.magX+(isLoader?150:-150),860,z));
  [0,1].forEach(i=>{const t=canvasTex(220,160,(c)=>{c.fillStyle='#fff';c.fillRect(0,0,160,220);c.fillStyle='#bbb';for(let k=0;k<9;k++)c.fillRect(14,20+k*18,132-(k%3)*20,6);c.strokeStyle='#111';c.lineWidth=10;c.strokeRect(0,0,160,220);});
    const d=new THREE.Mesh(new THREE.PlaneGeometry(206,150),new THREE.MeshBasicMaterial({map:t}));d.position.set(isLoader?bx0-1:bx1+1,H-120,z0+(z1-z0)*(i?0.72:0.28));d.rotation.y=isLoader?-PI/2:PI/2;m.g.add(d);});
  m.plat=new THREE.Group();m.g.add(m.plat);P(m.plat,bx1-bx0-40,20,z1-z0-240,M.ralD,m.magX,-10,(z0+z1)/2);
  m.magZ=[z1-213-225,z1-213-225-450,z1-213-225-900];                                 // 3 magazines side by side (drawing pitch ≈ 450 mm)
  m.magG=m.magZ.map(z=>{const g=magMesh(m.plat,isLoader?-1:1);g.position.set(m.magX,0,z);return g;});
  // shuttle housing: cabinet with three hinged top covers (as on the technical drawing)
  const hy=1180;shell(m.g,hx0,hx1,z0,z1,80,hy,M.ral,{noTop:true,left:isLoader?false:LZ,right:isLoader?[LZ[0]]:false});
  const cw=hx1-hx0-20,seg=(z1-z0-20)/3;for(let i=0;i<3;i++)hinged(m,'lid',cw,seg-6,m.shX,hy,z0+10+i*seg,i==2?false:true,M.ral);
  touch(m.g,m.shX+(isLoader?-120:120),1010,z1);estop(m.g,m.shX+(isLoader?120:-120),1020,z1);handle(m.g,m.shX,600,z1);vents(m.g,m.shX-80,180,z1);
  fnLabel(m.g,m.name,Math.min(470,cw-20),m.shX,1120,z1+1);
  estop(m.g,isLoader?bx0+40:bx1-40,1150,z1);signal(m,isLoader?bx0+60:bx1-60,z0+80,H);
  // shuttle carriage: Z linear rails + conveyor + puller/pusher cylinder
  [-1,1].forEach(q=>P(m.g,30,30,z1-z0-120,M.steel,m.shX+q*190,720,(z0+z1)/2));
  m.car=new THREE.Group();m.g.add(m.car);
  rails(m.car,m.shX-250,m.shX+250,0,CONV_Y,{legs:false});P(m.car,440,40,BD+60,M.aluD,m.shX,CONV_Y-80,0);P(m.car,80,170,80,M.dark,m.shX,CONV_Y-180,0);
  // board mover: a rodless actuator beside the conveyor; its finger runs 13 mm above the board, i.e. through the gap between two boards
  const zs=isLoader?-(BD/2+48):(BD/2+48),pa=isLoader?[-20,540]:[-540,20];
  m.reach=isLoader?440:140;
  P(m.car,pa[1]-pa[0],34,30,M.black,(pa[0]+pa[1])/2,CONV_Y+34,zs);
  if(!isLoader)P(m.car,pa[1]-pa[0]-20,8,2,M.red,(pa[0]+pa[1])/2,CONV_Y+34,zs-16);
  m.rod=new THREE.Group();m.car.add(m.rod);
  P(m.rod,60,46,46,M.dark,m.reach,CONV_Y+34,zs);
  if(isLoader){P(m.rod,20,10,Math.abs(zs),M.aluD,m.reach,CONV_Y-58,zs/2);P(m.rod,20,48,20,M.aluD,m.reach,CONV_Y-36,0);
    cyl(m.rod,7,7,m.reach,M.magW,m.reach/2,CONV_Y-13,0,{rz:PI/2,seg:14});}                 // white puller rod runs UNDER the panel
  else{P(m.rod,20,10,Math.abs(zs),M.aluD,m.reach,CONV_Y+20,zs/2);P(m.rod,m.reach,8,30,M.aluD,m.reach/2,CONV_Y+13,0);}
  m.finger=new THREE.Group();m.rod.add(m.finger);m.finger.position.y=isLoader?CONV_Y-13:CONV_Y+13;
  if(isLoader){P(m.finger,10,22,60,M.magW,0,8,0);P(m.finger,14,4,64,M.rubber,0,19,0);}       // finger flips UP behind the far edge
  else{P(m.finger,10,22,60,M.yellow,0,-8,0);P(m.finger,14,4,64,M.rubber,0,-19,0);}
  m.sensor=new THREE.MeshStandardMaterial({color:0x553300,emissive:0xff9a20,emissiveIntensity:.05});
  P(m.car,16,16,16,m.sensor,isLoader?m.shX-250+8:m.shX+250-8,CONV_Y+22,-(BD/2+18));       // end-of-conveyor sensor
  m.hook=0;
  m.H=H;
  m.tags=[['Magazine lift platform (3 magazines)',m.magX,1350,m.magZ[1]],['Shuttle conveyor (moves front ↔ back)',m.shX,1240,0],[isLoader?'Puller rod (under the panel, finger up)':'Pusher (belt actuator + finger)',m.shX,CONV_Y+120,isLoader?-160:160],['Hinged covers',m.shX,1240,z1-200]];}
function magBoardsUpdate(m){const off=m.platY;m.plat.position.y=off;
  m.mags.forEach((mg,i)=>{const g=m.magG[i];g.visible=mg.present;g.position.y=mg.lift||0;
    mg.boards.forEach((b,k)=>{if(b&&b.inMag){b.x=m.X(m.magX);b.z=m.magZ[i];b.dy=off+(mg.lift||0)+MG.base+k*MG.pitch-CONV_Y;}});});
  m.car.position.z=m.cz;m.rod.position.x=m.rodX;if(m.sensor)m.sensor.emissiveIntensity=m.sens?2.5:.05;m.finger.rotation.z=(m.key==='loader'?1:-1)*(1-m.hook)*1.3;}
const rodRest=m=>m.key==='loader'?60:m.shX-140;   // finger reference position (machine-local x)
const slotPlat=k=>CONV_Y-MG.base-k*MG.pitch;
function* swapMag(m,i,full){const mg=m.mags[i];mg.busy=true;yield 2.5;m.ops++;
  yield* tw(1.2,k=>mg.lift=k*900);mg.present=false;mg.boards.forEach(b=>b&&killBoard(b));mg.boards=new Array(MG.slots).fill(null);
  if(full)for(let k=0;k<MG.use;k++){const b=newBoard(0);b.inMag=true;mg.boards[k]=b;}
  yield 1.5;mg.present=true;yield* tw(1.2,k=>mg.lift=(1-k)*900);mg.lift=0;mg.busy=false;
  log((m.key==='loader'?'LOADER: full':'UNLOADER: empty')+' magazine placed in position '+(i+1),'cl');}


/* ---------- machine bodies shared by the handling line and the sorting line ---------- */
function buildScannerBody(m,lanes=LZ){const x0=-250,x1=250,z1=m.z1,z0=LZ[1]-BD/2-7-160;m.z0=z0;feet(m.g,x0,x1,z0,z1);
    P(m.g,x1-x0,CONV_Y-140,z1-z0,M.ral,0,(CONV_Y-140)/2+40,(z0+z1)/2);P(m.g,x1-x0,100,z1-z0,M.ral,0,CONV_Y-100,(z0+z1)/2);
    lanes.forEach(z=>rails(m.g,x0,x1,z,CONV_Y,{legs:false,motor:false}));
    [-1,1].forEach(q=>P(m.g,x1-x0,330,14,M.ral,0,CONV_Y+145,q>0?z1-7:z0+7));hinged(m,'lid',x1-x0-10,z1-z0-20,0,CONV_Y+315,z0+10,true,M.ral);
    knob(m.g,-140,CONV_Y-100,z1);knob(m.g,140,CONV_Y-100,z1);estop(m.g,180,CONV_Y-30,z1);[0,1,2].forEach(i=>P(m.g,24,24,8,[M.yellow,M.blue,M.red][i],-30+i*34,CONV_Y-30,z1+4));
    handle(m.g,-180,450,z1);vents(m.g,-140,120,z1);fnLabel(m.g,m.name,420,0,CONV_Y+60,z1+1);
    m.heads=[];m.fans=[];lanes.forEach((z,i)=>{P(m.g,60,80,60,M.black,DM_X,CONV_Y+230,z+DM_Z);const lm=new THREE.MeshStandardMaterial({color:0x200,emissive:0xff2020,emissiveIntensity:0});cyl(m.g,14,14,4,lm,DM_X,CONV_Y+188,z+DM_Z,{cast:false});m.heads.push(lm);
      const f=new THREE.Mesh(new THREE.ConeGeometry(28,186,4,1,true),new THREE.MeshBasicMaterial({color:0xff3030,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));f.position.set(DM_X,CONV_Y+95,z+DM_Z);f.visible=false;m.g.add(f);m.fans.push(f);});
    signal(m,x1-40,z0+40,CONV_Y+320);
    m.tags=[['Code reader lane 1',DM_X,CONV_Y+290,LZ[0]],['Code reader lane 2',DM_X,CONV_Y+290,LZ[1]],['Lane-width knobs',0,CONV_Y-60,z1]];}
function buildInverterBody(m,lanes=LZ){const x0=-250,x1=250,z1=m.z1,z0=LZ[1]-BD/2-7-345;m.z0=z0;feet(m.g,x0,x1,z0,z1);
    shell(m.g,x0,x1,z0,z1,70,1330,M.ral,{noFront:true,left:LZ,right:LZ});
    P(m.g,x1-x0,820,12,M.ral,0,480,z1-6);P(m.g,x1-x0,90,12,M.ral,0,1285,z1-6);P(m.g,40,340,12,M.ral,x0+20,1060,z1-6);P(m.g,40,340,12,M.ral,x1-20,1060,z1-6);
    hinged(m,'door',x1-x0-60,330,0,1235,z1+2,true,M.ral);touch(m.g,130,1290,z1,110,70);handle(m.g,-190,500,z1);vents(m.g,-170,120,z1);estop(m.g,180,820,z1);
    fnLabel(m.g,m.name,440,0,860,z1+1);
    m.rot=lanes.map(z=>{const g=new THREE.Group();g.position.set(0,CONV_Y+BT/2,z);m.g.add(g);
      [-1,1].forEach(s=>{const d=new THREE.Mesh(new THREE.TorusGeometry(140,9,8,40),M.aluD);d.rotation.y=PI/2;d.position.x=s*210;g.add(d);
        for(let a=0;a<4;a++){const sp=new THREE.Mesh(new THREE.BoxGeometry(8,280,8),M.aluD);sp.rotation.x=a*PI/4;sp.position.x=s*210;g.add(sp);}});
      [-1,1].forEach(v=>{[-1,1].forEach(s=>{P(g,440,10,12,M.alu,0,v*(BT/2+13),s*(BD/2+7));const bl=new THREE.Mesh(new THREE.BoxGeometry(440,3,6),beltMat);bl.position.set(0,v*(BT/2+2.5),s*(BD/2-2.5));g.add(bl);});});
      return g;});
    signal(m,x1-40,z0+40,1330);
    m.tags=[['Flip unit lane 1',0,CONV_Y+190,LZ[0]],['Flip unit lane 2',0,CONV_Y+190,LZ[1]]];}
/* ===================================================================
   PERF — reusable performance helpers for every SMT 3D page.
   freezeStatic · ShadowSched · RenderGate · Quality · PerfHUD ·
   instanceRepeat · machineLOD
   Loaded after common.js (renderer, scene, camera, sun, BGU).
   =================================================================== */

/* ---------- 1. merge parts that never move ----------
   Per parent group: sibling meshes with the same material, shadow flags,
   layers and render order become one mesh.  A group that moves keeps its
   transform — only the meshes inside it are merged — so hoods, shuttles,
   rotors and the AOI head still animate.  Objects flagged userData.keep
   (or listed in `skip`) are left untouched. */
const FROZEN=[];                                   // merged geometries (disposed on rebuild)
/* dyn: Set of groups that move (hoods, shuttles, rotors …). Every other sub-group is treated as
   rigid and flattened into the nearest moving ancestor (or the root). */
function freezeStatic(root,dyn){
  dyn=dyn||new Set();const roots=[root];let before=0,after=0;const _m=new THREE.Matrix4();
  while(roots.length){const R=roots.pop();const buckets=new Map();
    const walk=(node,M)=>{for(const c of node.children){
        if(dyn.has(c)||!c.visible){roots.push(c);continue;}
        c.updateMatrix();const CM=new THREE.Matrix4().multiplyMatrices(M,c.matrix);
        if(c.isMesh&&!c.isInstancedMesh&&!c.isSkinnedMesh&&!c.userData.keep&&!Array.isArray(c.material)){
          const g=c.geometry;before++;
          const k=c.material.uuid+'|'+c.castShadow+'|'+c.receiveShadow+'|'+c.renderOrder+'|'+c.layers.mask+'|'+!!g.index+'|'+Object.keys(g.attributes).sort().join(',')+'|'+c.frustumCulled;
          let l=buckets.get(k);if(!l)buckets.set(k,l=[]);l.push([c,CM]);}
        if(c.children.length)walk(c,CM);}};
    walk(R,_m.identity().clone());
    for(const list of buckets.values()){
      if(list.length<2||list.some(([c])=>c.children.length)){after+=list.length;continue;}
      const geos=list.map(([c,M])=>{const g=c.geometry.clone();g.applyMatrix4(M);g.clearGroups();g.morphAttributes={};return g;});
      const merged=BGU.mergeBufferGeometries(geos,false);geos.forEach(g=>g.dispose());
      if(!merged){after+=list.length;continue;}
      merged.computeBoundingSphere();
      const s=list[0][0],mm=new THREE.Mesh(merged,s.material);
      mm.castShadow=s.castShadow;mm.receiveShadow=s.receiveShadow;mm.renderOrder=s.renderOrder;mm.layers.mask=s.layers.mask;mm.frustumCulled=s.frustumCulled;mm.userData.frozen=true;
      list.forEach(([c])=>c.parent.remove(c));R.add(mm);FROZEN.push(merged);after++;}
  }
  return{before,after};
}
function disposeFrozen(){FROZEN.forEach(g=>g.dispose());FROZEN.length=0;}

/* ---------- 1b. share identical materials ----------
   Many parts create their own material with the same colour and finish; identical
   ones are replaced by one shared material so freezeStatic can merge them.
   Materials that are animated (emissive lamps, rings, sensors), transparent or
   textured stay untouched. */
function shareMaterials(root,shell){const pool=new Map();let n=0;
  root.traverse(o=>{if(!o.isMesh||Array.isArray(o.material))return;const m=o.material;
    if(!m.isMeshStandardMaterial||m.transparent||m.map||m.emissive.getHex()!==0||m.userData.keep)return;
    const k=[m.color.getHex(),m.roughness,m.metalness,m.envMapIntensity,m.side,m.flatShading,m.wireframe,m.depthWrite,m.polygonOffset,shell&&shell.includes(m)?'S':''].join('|');
    const q=pool.get(k);if(!q){pool.set(k,m);return;}if(q!==m){o.material=q;n++;}});return n;}

/* ---------- 2. repeated parts as one instanced mesh (feeders, feet, combs …) ---------- */
function instanceRepeat(par,geo,mat,matrices,o={}){
  const im=new THREE.InstancedMesh(geo,mat,matrices.length);matrices.forEach((m,i)=>im.setMatrixAt(i,m));
  im.instanceMatrix.needsUpdate=true;im.castShadow=o.cast!==false;im.receiveShadow=true;par.add(im);return im;}

/* ---------- 3. level of detail per machine ----------
   detail: group that is only shown when the camera is close or the covers are open.
   build: optional function that builds the detail the first time it is needed. */
const LODS=[];
function machineLOD(m,detail,o={}){const L={m,detail,near:o.near||4200,build:o.build||null,built:!o.build,needOpen:!!o.needOpen,always:o.always||null};LODS.push(L);return L;}
const _lv=new THREE.Vector3();
function updateLOD(){
  for(const L of LODS){L.m.g.getWorldPosition(_lv);const d=camera.position.distanceTo(_lv)-(L.m.L||0)/2;
    const open=L.m.hoods.some(h=>h.open>.05);let show=d<L.near||open;if(L.needOpen&&!open&&d>L.near*.6)show=false;if(L.always&&L.always())show=true;
    if(show&&!L.built){L.build(L);L.built=true;}
    if(L.detail.visible!==show){L.detail.visible=show;ShadowSched.force=true;RenderGate.dirty=true;}}}

/* ---------- 4. shadows: recalculated only when something big moves ---------- */
const ShadowSched={sig:'',t:-1,force:true,pending:false,
  update(sig,now){if(sig!==this.sig){this.sig=sig;this.pending=true;}
    if(this.force||(this.pending&&now-this.t>=.1)){renderer.shadowMap.needsUpdate=true;this.t=now;this.pending=false;this.force=false;return true;}return false;}};

/* ---------- 5. draw only when needed ---------- */
const RenderGate={dirty:true,frames:0,skipped:0,
  init(){const d=()=>{this.dirty=true;};controls.addEventListener('change',d);addEventListener('resize',d);
    ['pointerdown','pointerup','wheel','keydown','click','touchstart'].forEach(e=>addEventListener(e,d,{passive:true}));
    document.addEventListener('visibilitychange',d);SMT.onTheme(()=>{this.dirty=true;ShadowSched.force=true;});}};

/* ---------- 6. adaptive quality: Auto / High / Low ---------- */
const Quality={mode:(()=>{try{return localStorage.getItem('smt-quality')||'auto';}catch(e){return 'auto';}})(),level:'high',
  win:[],onChange:null,
  set(mode){this.mode=mode;try{localStorage.setItem('smt-quality',mode);}catch(e){}this.apply(mode==='low'?'low':'high');this.win=[];},
  apply(level){this.level=level;const hi=level==='high';sun.castShadow=hi;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,hi?1.5:1));
    ShadowSched.force=true;RenderGate.dirty=true;if(this.onChange)this.onChange();},
  sample(dt){if(this.mode!=='auto'||this.level==='low')return;this.win.push(dt);
    let s=0;for(const x of this.win)s+=x;if(s<2)return;const fps=this.win.length/s;this.win=[];
    if(fps<28)this.apply('low');}};

/* ---------- 7. on-screen performance figures ---------- */
const PerfHUD={el:null,t:0,n:0,acc:0,fps:0,build:0,calls:0,tris:0,
  init(el){this.el=el;},
  frame(dt,rendered){if(rendered){this.n++;this.acc+=dt;this.calls=renderer.info.render.calls;this.tris=renderer.info.render.triangles;}
    this.t+=dt;if(this.t<.5||!this.el)return;this.fps=this.acc>0?this.n/this.acc:0;this.t=0;this.n=0;this.acc=0;
    if(this.el.offsetParent===null)return;
    this.el.innerHTML='<b>'+(this.fps?this.fps.toFixed(0):'idle')+'</b> fps · <b>'+this.calls+'</b> draw calls · '+(this.tris/1000).toFixed(1)+'k triangles<br>'+
      renderer.info.programs.length+' shaders · quality '+Quality.level+(Quality.mode==='auto'?' (auto)':'')+' · build '+this.build.toFixed(0)+' ms';}};
