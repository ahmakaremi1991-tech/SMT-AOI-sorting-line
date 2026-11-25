'use strict';

/* ===================================================================
   AOI SORTING LINE — offline automatic sorting of suspect panels.
   Loader → Flipper 1 → Scanner → AOI → Flipper 2 → Unloader
   Unloader magazines: Mag 1 (good), Mag 2 (good), Mag 3 (defects).
   Single lane (lane 1, z = +170).  Units mm, transport height 950 mm.
   Every panel is GOOD unless the operator marks it in the AOI and
   then judges it PASS (good) or FAIL (bad).
   =================================================================== */

/* ---------- 1. config ---------- */
const WIDTHS=[164,175,190,212],PITCHES=[3,4,5],PROGRAMS=['Program 1','Program 2','Program 3','Program 4','Program 5'];
const DEFAULTS={side:'TOP',prog:'Program 1',magW:212,pitch:3,count:20,cap:10};   // used when the line setup is not activated
const USABLE_SLOTS=45;                                                          // 50 comb slots, top 5 stay empty

/* ---------- 2. language (EN / RO) ---------- */
const I18N={
 en:{title:'AOI SORTING LINE',sub:'Offline automatic sorting: suspect panels are loaded in magazines, inspected by the AOI and sorted into good and defect magazines. Every panel is good unless you mark it in the AOI and judge it.',
  lang:'Language',setup:'Line setup',setAct:'Activate line setup',setOff:'Setup off — defaults: TOP side, flippers bypass, magazine 212 mm, pitch 3, Program 1.',
  side:'Inspection side',prog:'AOI program',choose:'— choose —',magW:'Magazine width (mm)',pitch:'Magazine pitch',convW:'Conveyor / flipper width',flipMode:'Flippers',
  flip:'FLIP',bypass:'BYPASS',count:'Panels in loader',cap:'Magazine capacity',need:'Choose side, program, width and pitch to enable START.',locked:'Settings are locked while the line runs — use RESET to change them.',
  counters:'Counters',c_load:'Loaded',c_ins:'Inspected',c_good:'Good',c_bad:'Defect',c_judge:'Operator judgements',c_left:'Left in loader',
  mags:'Magazines',mag1:'Mag 1 · Good',mag2:'Mag 2 · Good',mag3:'Mag 3 · Defects',slots:'positions per magazine',
  START:'START',PAUSE:'PAUSE',RESUME:'RESUME',STOP:'STOP',RESET:'RESET',mark:'Mark panel for judgement',replace:'Replace magazine',
  covers:'Open covers',close:'Close covers',xray:'X-ray',labels:'Labels',speed:'Speed',over:'Overview',vLoader:'Loader',vAoi:'AOI',vUnl:'Unloader',vPush:'Pusher',follow:'Follow panel',vTop:'Top',
  judgeT:'Operator judgement',judgeMsg:'{sn} was marked for judgement – operator decision required.',pass:'PASS · GOOD',fail:'FAIL · BAD',judgeHint:'GOOD → Magazine 1 / 2 · BAD → Magazine 3 (defects)',
  fullGood:'Both good magazines are full – line stopped. Replace the magazines to continue.',fullBad:'Magazine 3 (defects) is full – line stopped. Replace it to continue.',
  doneT:'Run complete',doneClose:'Close',pctNok:'NOK',
  status:'Line',st_ready:'READY',st_run:'RUNNING',st_pause:'PAUSED',st_stop:'STOPPED',st_judge:'WAITING FOR OPERATOR',st_full:'MAGAZINE FULL',st_done:'RUN COMPLETE',
  m_loader:'LOADER',m_flip1:'FLIPPER 1',m_scan:'SCANNER',m_aoi:'AOI',m_flip2:'FLIPPER 2',m_unl:'UNLOADER',
  s_idle:'IDLE',s_wait:'WAITING',s_shuttle:'SHUTTLE TO MAGAZINE',s_pull:'PULLING PANEL',s_out:'PANEL OUT',s_in:'PANEL IN',s_flip:'FLIPPING 180°',s_bypass:'BYPASS',s_read:'READING CODE',
  s_insp:'INSPECTING',s_judge:'OPERATOR JUDGEMENT',s_sensor:'PANEL AT END SENSOR',s_feed:'BELT FEEDS PANEL IN',s_push:'PUSHER PUSHES PANEL HOME',s_return:'PUSHER BACK TO REFERENCE',s_full:'MAGAZINE FULL',s_swap:'MAGAZINE CHANGE',s_empty:'EMPTY',
  z_in:'unsorted parts',z_out:'sorted parts',z_an:'ANALYSIS AREA',z_an2:'defect panels (Mag 3)',
  l_start:'Line started · {side} · {prog} · width {w} mm · pitch {p}',l_load:'{sn} out of loader (magazine {m}, position {s})',l_flip:'{sn} flipped at {f}',l_bypass:'{sn} bypass at {f}',
  l_scan:'{sn} code read',l_aoi:'{sn} AOI result: {r}',l_mark:'{sn} marked for judgement',l_dec:'{sn} operator decision: {d}',l_store:'{sn} → Magazine {n}',l_full:'Magazine {n} full – line stopped',
  l_repl:'Magazine {n} replaced',l_done:'Run complete: {g} good, {b} defect',GOOD:'GOOD',BAD:'BAD',sum_side:'Side',sum_prog:'Program',sum_w:'Width',
  stTitle:'LINE STATUS',q_title:'Graphics quality',q_auto:'Auto',q_high:'High',q_low:'Low',q_note:'Auto switches to Low (no shadows, lower resolution) if the device is too slow.',ld_build:'Building machines…',ld_gfx:'Preparing graphics…',ld_ready:'Ready',pw:'pitch',cp:'capacity',cycK:'CYCLE TIME · SORTING',cyc1:'{n} panels/h · lead time {t} s',cyc0:'first panel in progress',hint:'Drag = rotate · Wheel = zoom · Right-drag = pan · Mark a panel while it is inside the AOI'},
 ro:{title:'LINIE DE SORTARE AOI',sub:'Sortare automată offline: plăcile suspecte sunt încărcate în magazii, inspectate de AOI și sortate în magazii pentru plăci bune și defecte. Fiecare placă este bună, cu excepția celor marcate în AOI și evaluate de operator.',
  lang:'Limbă',setup:'Configurare linie',setAct:'Activează configurarea liniei',setOff:'Configurare dezactivată — implicit: față TOP, flippere în bypass, magazie 212 mm, pas 3, Program 1.',
  side:'Fața inspectată',prog:'Program AOI',choose:'— alegeți —',magW:'Lățime magazie (mm)',pitch:'Pas magazie',convW:'Lățime conveior / flipper',flipMode:'Flippere',
  flip:'ÎNTOARCERE',bypass:'BYPASS',count:'Plăci în încărcător',cap:'Capacitate magazie',need:'Alegeți fața, programul, lățimea și pasul pentru a activa START.',locked:'Setările sunt blocate cât timp linia funcționează — folosiți RESET pentru a le modifica.',
  counters:'Contoare',c_load:'Încărcate',c_ins:'Inspectate',c_good:'Bune',c_bad:'Defecte',c_judge:'Decizii operator',c_left:'Rămase în încărcător',
  mags:'Magazii',mag1:'Mag 1 · Bune',mag2:'Mag 2 · Bune',mag3:'Mag 3 · Defecte',slots:'poziții pe magazie',
  START:'START',PAUSE:'PAUZĂ',RESUME:'CONTINUĂ',STOP:'STOP',RESET:'RESET',mark:'Marchează placa pentru evaluare',replace:'Înlocuiește magazia',
  covers:'Deschide capacele',close:'Închide capacele',xray:'Transparent',labels:'Etichete',speed:'Viteză',over:'Vedere generală',vLoader:'Încărcător',vAoi:'AOI',vUnl:'Descărcător',vPush:'Împingător',follow:'Urmărește placa',vTop:'De sus',
  judgeT:'Evaluare operator',judgeMsg:'{sn} a fost marcată pentru evaluare – este necesară decizia operatorului.',pass:'TRECE · BUNĂ',fail:'RESPINSĂ · DEFECTĂ',judgeHint:'BUNĂ → Magazia 1 / 2 · DEFECTĂ → Magazia 3 (defecte)',
  fullGood:'Ambele magazii pentru plăci bune sunt pline – linia s-a oprit. Înlocuiți magaziile pentru a continua.',fullBad:'Magazia 3 (defecte) este plină – linia s-a oprit. Înlocuiți-o pentru a continua.',
  doneT:'Rulare finalizată',doneClose:'Închide',pctNok:'NOK',
  status:'Linie',st_ready:'PREGĂTITĂ',st_run:'ÎN FUNCȚIUNE',st_pause:'PAUZĂ',st_stop:'OPRITĂ',st_judge:'AȘTEAPTĂ OPERATORUL',st_full:'MAGAZIE PLINĂ',st_done:'FINALIZATĂ',
  m_loader:'ÎNCĂRCĂTOR',m_flip1:'FLIPPER 1',m_scan:'SCANER',m_aoi:'AOI',m_flip2:'FLIPPER 2',m_unl:'DESCĂRCĂTOR',
  s_idle:'INACTIV',s_wait:'AȘTEAPTĂ',s_shuttle:'NAVETA LA MAGAZIE',s_pull:'EXTRAGE PLACA',s_out:'PLACA IESE',s_in:'PLACA INTRĂ',s_flip:'ÎNTOARCE 180°',s_bypass:'BYPASS',s_read:'CITEȘTE CODUL',
  s_insp:'INSPECTEAZĂ',s_judge:'EVALUARE OPERATOR',s_sensor:'PLACA LA SENZORUL FINAL',s_feed:'BANDA INTRODUCE PLACA',s_push:'ÎMPINGĂTORUL ÎMPINGE PLACA',s_return:'ÎMPINGĂTORUL REVINE',s_full:'MAGAZIE PLINĂ',s_swap:'SCHIMB MAGAZIE',s_empty:'GOL',
  z_in:'piese nesortate',z_out:'piese sortate',z_an:'ZONA DE ANALIZĂ',z_an2:'plăci defecte (Mag 3)',
  l_start:'Linie pornită · {side} · {prog} · lățime {w} mm · pas {p}',l_load:'{sn} scoasă din încărcător (magazia {m}, poziția {s})',l_flip:'{sn} întoarsă la {f}',l_bypass:'{sn} bypass la {f}',
  l_scan:'{sn} cod citit',l_aoi:'{sn} rezultat AOI: {r}',l_mark:'{sn} marcată pentru evaluare',l_dec:'{sn} decizia operatorului: {d}',l_store:'{sn} → Magazia {n}',l_full:'Magazia {n} plină – linia s-a oprit',
  l_repl:'Magazia {n} înlocuită',l_done:'Rulare finalizată: {g} bune, {b} defecte',GOOD:'BUNĂ',BAD:'DEFECTĂ',sum_side:'Față',sum_prog:'Program',sum_w:'Lățime',
  stTitle:'STARE LINIE',q_title:'Calitate grafică',q_auto:'Auto',q_high:'Înaltă',q_low:'Scăzută',q_note:'Auto trece pe Scăzută (fără umbre, rezoluție mai mică) dacă dispozitivul este prea lent.',ld_build:'Se construiesc utilajele…',ld_gfx:'Se pregătește grafica…',ld_ready:'Gata',pw:'pas',cp:'capacitate',cycK:'TIMP DE CICLU · SORTARE',cyc1:'{n} plăci/h · timp de tranzit {t} s',cyc0:'prima placă în lucru',hint:'Trageți = rotire · Rotiță = zoom · Clic dreapta = deplasare · Marcați o placă cât timp este în AOI'}
};
let LANG=(()=>{try{return localStorage.getItem('smt-lang')||'en';}catch(e){return 'en';}})();
const T=(k,o)=>{let s=(I18N[LANG][k]??I18N.en[k]??k);if(o)for(const q in o)s=s.split('{'+q+'}').join(o[q]);return s;};

/* ---------- 3. state ---------- */
const SET={active:false,side:null,prog:null,magW:null,pitch:null,count:20,cap:10};
function eff(){const s=SET.active?SET:DEFAULTS;const pitch=s.pitch||3,use=Math.floor(USABLE_SLOTS/pitch);
  return{side:s.side||'TOP',prog:s.prog||'Program 1',magW:s.magW||212,pitch,use,count:Math.min(SET.active?SET.count:DEFAULTS.count,3*use),cap:Math.min(SET.active?SET.cap:DEFAULTS.cap,use)};}
const setupValid=()=>!SET.active||(SET.side&&SET.prog&&SET.magW&&SET.pitch);
let E=eff();                                   // parameters of the built line
let started=false,userPause=false,stopped=false,hold=null,runDone=false;   // hold: null | 'judge' | 'full'
let simTime=0,speed=1;
const CNT={total:0,loaded:0,inspected:0,good:0,bad:0,judged:0};
let LINE=[],LOADER_,FLIP1,SCANR,AOI_,FLIP2,UNL;
const RECORDS=[];                              // one record per panel: id, aoi, decision, magazine
const logEl=$('log');
function log(t,c){const d=document.createElement('div');d.textContent=new Date(simTime*1000).toISOString().substr(14,5)+'  '+t;if(c)d.className=c;logEl.prepend(d);while(logEl.children.length>60)logEl.lastChild.remove();}

/* ---------- 4. coroutines ---------- */
const FRAME=-1;let cos=[],svc=[];             // cos: line work (frozen by holds), svc: service animations (magazine change)
class Co{constructor(g){this.g=g;this.wait=0;this.done=false;}
  step(dt){if(this.done)return;this.wait-=dt;let pass=dt,guard=0;
    while(this.wait<=0&&guard++<64){const r=this.g.next(pass);pass=0;if(r.done){this.done=true;return;}if(r.value===FRAME){this.wait=1e-9;return;}this.wait+=r.value;}}}
function run(g){const c=new Co(g);cos.push(c);return c;}
function runSvc(g){const c=new Co(g);svc.push(c);return c;}
const lerp=(a,b,k)=>a+(b-a)*k,ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function* tw(dur,fn){let t=0;fn(0);while(t<dur){t+=yield FRAME;fn(Math.min(1,t/dur));}}
let moving=0;
function* conveyTo(b,x,v=V){moving++;while(Math.abs(b.x-x)>.01){const dt=yield FRAME;const d=x-b.x;b.x+=Math.sign(d)*Math.min(Math.abs(d),v*dt);}moving--;}
const nextOf=m=>LINE[LINE.indexOf(m)+1]||null;
function* hand(m,b){const n=nextOf(m);while(n.busy||n.inbox.length)yield FRAME;n.busy=true;n.inbox.push(b);}

/* ---------- 5. the AOI model (wrapped page model, transport 900 → placed at +50 mm) ---------- */
function buildAOI(parent,BW,BD){
  /* ===================================================================
     MACHINE
     =================================================================== */
  const CONV_Y=900, LANE_Z=[170,-170], BT=1.6;
  const machine=new THREE.Group();parent.add(machine);
  const shellMats=[];
  const sm=(c,r=.55,m=.05)=>{const x=std(c,r,m);shellMats.push(x);return x;};
  const M={
    white:sm(0xe9ecef,.5,.05), white2:sm(0xdfe3e7,.55,.05), dark:sm(0x2b3038,.6,.2), blue:sm(0x1557b8,.45,.15),
    alu:std(0xb9c0c8,.35,.85), aluD:std(0x7d858f,.45,.8), steel:std(0xd5dadf,.22,.95), black:std(0x15171a,.55,.2),
    granite:std(0x1d2024,.6,.1), belt:null, rubber:std(0x1b1d20,.9,0), camBlue:std(0x1b4fb0,.35,.6),
    glassLens:std(0x0b1020,.05,.9), copper:std(0xb87333,.35,.9), red:std(0xc8202a,.5,.1)
  };
  const NOSH={cast:false};
  
  /* --- lower cabinet: centre double door, function-label panel above it --- */
  const BODY_Y0=110,SILL=790,FZ=620,BX0=-300,BX1=240,AX0=-455,AX1=425;
  box(machine,BX0+625,SILL-BODY_Y0,1500,M.white,(BX0-625)/2,(SILL+BODY_Y0)/2,0,NOSH);
  box(machine,625-BX1,SILL-BODY_Y0,1500,M.white,(BX1+625)/2,(SILL+BODY_Y0)/2,0,NOSH);
  box(machine,BX1-BX0,SILL-BODY_Y0,1200,M.white,(BX0+BX1)/2,(SILL+BODY_Y0)/2,-150,NOSH);
  box(machine,BX1-BX0,SILL-648,300,M.white,(BX0+BX1)/2,(SILL+648)/2,600,NOSH);
  box(machine,BX1-BX0,16,300,M.white,(BX0+BX1)/2,BODY_Y0+8,600,NOSH);
  box(machine,1200,40,1450,M.dark,0,BODY_Y0-18,0,NOSH);
  [[-560,-680],[560,-680],[-560,680],[560,680]].forEach(p=>{cyl(machine,46,52,16,M.steel,p[0],8,p[1]);cyl(machine,13,13,100,M.steel,p[0],60,p[1]);cyl(machine,24,24,14,M.steel,p[0],88,p[1],{seg:6});
    cyl(machine,30,30,26,M.black,p[0]+(p[0]<0?90:-90),32,p[1],{rx:PI/2});});
  box(machine,BX0+625,3,3,M.dark,(BX0-625)/2,700,751,NOSH);box(machine,625-BX1,3,3,M.dark,(BX1+625)/2,700,751,NOSH);
  // electrical bay behind the doors
  box(machine,BX1-BX0,522,4,M.black,(BX0+BX1)/2,387,453,NOSH);
  box(machine,170,400,250,M.black,-195,326,600);cyl(machine,5,5,3,std(0x30ff70,.3,0,{emissive:0x30ff70,emissiveIntensity:2}),-150,480,726,{rx:PI/2,cast:false});
  box(machine,150,8,6,M.aluD,-195,440,727,NOSH);box(machine,150,8,6,M.aluD,-195,400,727,NOSH);
  box(machine,200,180,240,std(0x8d949c,.5,.5),110,216,600);box(machine,230,10,40,M.aluD,95,560,470,NOSH);
  [0x2d7be0,0x2d7be0,0xe8a020,0xdde2e6,0xdde2e6,0x30a050].forEach((c,i)=>box(machine,30,70,50,std(c,.5),5+i*34,560,490,NOSH));
  cyl(machine,22,22,90,M.alu,150,400,560);cyl(machine,30,30,8,M.black,150,450,560);
  const doors=[];
  [[BX0,1],[BX1,-1]].forEach(a=>{const g=new THREE.Group();g.position.set(a[0],0,750);machine.add(g);
    box(g,268,518,10,M.white2,a[1]*135,387,2,NOSH);box(g,30,104,7,M.black,a[1]*226,470,8,NOSH);box(g,16,80,5,std(0x30343a,.4,.3),a[1]*226,470,11,NOSH);
    doors.push({g,dir:a[1],open:0,target:0});});
  // blue logo panel
  (function(){const t=canvasTex(1080,280,(g,W,H)=>{g.fillStyle='#1b4db3';g.fillRect(0,0,W,H);g.textAlign='center';g.textBaseline='middle';
    g.fillStyle='#fff';g.font='900 150px "Arial Black",Arial,sans-serif';g.fillText('AOI',W/2,112);
    g.font='700 40px Arial';g.fillStyle='#cfe0ff';g.fillText('AUTOMATED OPTICAL INSPECTION',W/2,222);});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(BX1-BX0,140),std(0xffffff,.45,.1,{map:t}));m.position.set((BX0+BX1)/2,719,750.6);machine.add(m);})();
  // side service panels + vents
  const ventT=canvasTex(128,128,(g)=>{g.fillStyle='#d0d5da';g.fillRect(0,0,128,128);g.fillStyle='#2a2f36';for(let y=6;y<128;y+=12)g.fillRect(8,y,112,6);});
  [-1,1].forEach(s=>{
    box(machine,5,430,900,M.white2,s*626,1270,-120,NOSH);box(machine,5,520,900,M.white2,s*626,440,-120,NOSH);
    [[1440,-480],[1440,240],[640,-480],[640,240]].forEach(q=>box(machine,6,34,22,M.black,s*629,q[0],q[1],NOSH));
    const v=new THREE.Mesh(new THREE.PlaneGeometry(150,150),std(0xffffff,.6,.1,{map:ventT}));v.position.set(s*629.5,330,150);v.rotation.y=s*PI/2;machine.add(v);});
  
  /* --- upper enclosure --- */
  box(machine,1250,810,22,M.white,0,1195,-739,NOSH);                           // rear wall
  box(machine,AX0+625,810,22,M.white,(AX0-625)/2,1195,FZ-11,NOSH);             // left front column
  box(machine,625-AX1,810,22,M.white,(AX1+625)/2,1195,FZ-11,NOSH);             // right front column
  box(machine,AX0+625,22,FZ+750,M.white,(AX0-625)/2,1589,(FZ-750)/2,NOSH);     // roof strips
  box(machine,625-AX1,22,FZ+750,M.white,(AX1+625)/2,1589,(FZ-750)/2,NOSH);
  box(machine,AX1-AX0,22,700,M.white,(AX0+AX1)/2,1589,-400,NOSH);
  box(machine,AX1-AX0,74,20,M.dark,(AX0+AX1)/2,827,FZ-10,NOSH);                // sill behind the bay
  (function(){
    const sh=new THREE.Shape();sh.moveTo(-750,SILL);sh.lineTo(FZ,SILL);sh.lineTo(FZ,1600);sh.lineTo(-750,1600);sh.closePath();
    const ho=new THREE.Path();ho.moveTo(-310,868);ho.lineTo(310,868);ho.lineTo(310,965);ho.lineTo(-310,965);ho.closePath();sh.holes.push(ho);
    const g=new THREE.ExtrudeGeometry(sh,{depth:22,bevelEnabled:false});
    [-603,625].forEach(x=>{const m=new THREE.Mesh(g,M.white);m.rotation.y=-PI/2;m.position.x=x;machine.add(m);});
    [-1,1].forEach(s=>{box(machine,30,8,640,M.dark,s*628,968,0,NOSH);box(machine,30,8,640,M.dark,s*628,864,0,NOSH);box(machine,30,110,8,M.dark,s*628,916,314,NOSH);box(machine,30,110,8,M.dark,s*628,916,-314,NOSH);});
  })();
  // operator controls on the right column (E-stop, lamp, main power switch)
  (function(){const x=(AX1+625)/2,z=FZ;
    box(machine,120,290,5,M.white2,x,1330,z+2,NOSH);
    box(machine,96,96,4,std(0xf2c400,.5),x,1420,z+5,NOSH);cyl(machine,30,24,30,M.red,x,1420,z+22,{rx:PI/2,cast:false});
    cyl(machine,15,15,12,std(0x21b354,.4,.1,{emissive:0x0c8a3c,emissiveIntensity:.8}),x,1335,z+8,{rx:PI/2,cast:false});
    box(machine,74,84,6,std(0xf4f4f4,.5),x,1245,z+5,NOSH);cyl(machine,24,24,14,M.black,x,1245,z+12,{rx:PI/2,cast:false});box(machine,10,44,14,M.black,x,1245,z+20,NOSH);})();
  
  /* --- hood: silver bay with dark window + roof panel, hinged at the back, lifts up --- */
  const hoodPivot=new THREE.Group();hoodPivot.position.set(0,1600,-50);machine.add(hoodPivot);
  const glassMat=new THREE.MeshStandardMaterial({color:0x0a1420,roughness:.06,metalness:.4,transparent:true,opacity:.74,depthWrite:false,side:THREE.DoubleSide});
  (function(){
    const silver=new THREE.MeshStandardMaterial({color:0x5d636a,roughness:.5,metalness:.3,envMapIntensity:.5,side:THREE.DoubleSide});shellMats.push(silver);
    const off=new THREE.Group();off.position.set(0,-1600,50);hoodPivot.add(off);        // children use machine coordinates
    box(off,AX1-AX0,20,FZ+50,M.white,(AX0+AX1)/2,1590,(FZ-50)/2,NOSH);                  // roof panel
    const YC=885,v=[];
    const quad=(a,b,c,d)=>{v.push(...a,...b,...c,...a,...c,...d);};
    quad([AX0,YC,FZ],[BX0,YC,750],[BX0,1600,750],[AX0,1600,FZ]);                         // angled side faces
    quad([AX1,YC,FZ],[BX1,YC,750],[BX1,1600,750],[AX1,1600,FZ]);
    quad([AX0,YC,FZ],[BX0,YC,750],[BX0,SILL,750],[BX0,SILL,FZ]);                         // lower chamfers
    quad([AX1,YC,FZ],[BX1,YC,750],[BX1,SILL,750],[BX1,SILL,FZ]);
    quad([AX0,1600,FZ],[BX0,1600,750],[BX1,1600,750],[AX1,1600,FZ]);                     // top cap
    const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));bg.computeVertexNormals();
    off.add(new THREE.Mesh(bg,silver));
    const win=()=>{const p=new THREE.Path();p.moveTo(BX0+30,1000);p.lineTo(BX0+95,935);p.lineTo(BX1-95,935);p.lineTo(BX1-30,1000);p.lineTo(BX1-30,1572);p.lineTo(BX0+30,1572);p.closePath();return p;};
    const fs=new THREE.Shape();fs.moveTo(BX0,SILL);fs.lineTo(BX1,SILL);fs.lineTo(BX1,1600);fs.lineTo(BX0,1600);fs.closePath();fs.holes.push(win());
    const ff=new THREE.Mesh(new THREE.ExtrudeGeometry(fs,{depth:12,bevelEnabled:false}),silver);ff.position.z=738;off.add(ff);
    const ws=new THREE.Shape(win().getPoints());const gl=new THREE.Mesh(new THREE.ShapeGeometry(ws),glassMat);gl.position.z=744;gl.renderOrder=5;off.add(gl);
    box(off,300,14,14,M.steel,(BX0+BX1)/2,858,772,NOSH);box(off,14,14,24,M.steel,(BX0+BX1)/2-143,858,760,NOSH);box(off,14,14,24,M.steel,(BX0+BX1)/2+143,858,760,NOSH); // handle
  })();
  const hood={open:0,target:0};
  
  /* --- signal tower (red / amber / green, top to bottom) --- */
  const tower={};
  (function(){
    const g=new THREE.Group();g.position.set(520,1600,-260);machine.add(g);
    cyl(g,9,9,190,M.steel,0,95,0);cyl(g,22,26,14,M.black,0,7,0);
    [['r',0xff2a2a,270],['y',0xffa800,230],['g',0x22e06a,190]].forEach(a=>{const mt=new THREE.MeshStandardMaterial({color:a[1],emissive:a[1],emissiveIntensity:.05,roughness:.3,transparent:true,opacity:.92});tower[a[0]]=mt;cyl(g,24,24,38,mt,0,a[2]+19,0);});
    cyl(g,25,25,8,M.dark,0,312,0);
  })();
  
  /* --- operator monitor + keyboard on the left-hand arm --- */
  let monTex,monCtx;
  (function(){
    const g=new THREE.Group();g.position.set(-240,0,FZ);machine.add(g);
    box(g,60,380,40,M.white2,0,1180,20);box(g,40,40,190,M.white2,0,1330,115);box(g,40,40,150,M.white2,0,1040,95);
    const m=new THREE.Group();m.position.set(-150,1340,215);m.rotation.y=.16;g.add(m);
    box(m,730,440,34,std(0xc8ccd0,.4,.5),0,0,0);box(m,120,120,40,M.dark,0,0,-30);
    const c=document.createElement('canvas');c.width=640;c.height=400;monCtx=c.getContext('2d');
    monTex=new THREE.CanvasTexture(c);monTex.encoding=THREE.sRGBEncoding;monTex.anisotropy=8;
    const scr=new THREE.Mesh(new THREE.PlaneGeometry(690,400),new THREE.MeshBasicMaterial({map:monTex,toneMapped:false}));scr.position.set(0,0,18);m.add(scr);
    const k=new THREE.Group();k.position.set(-150,1030,250);k.rotation.y=.16;g.add(k);
    box(k,520,14,210,std(0xe6e8ea,.5),0,0,0);box(k,360,12,120,std(0xf2f3f4,.6),-50,13,-10);box(k,56,22,90,std(0xf2f3f4,.5),190,17,0);
  })();
  
  
  /* --- interior: bed, lighting --- */
  const interior=new THREE.Group();machine.add(interior);
  box(interior,1200,24,1340,M.granite,0,852,-65);box(interior,1200,50,1340,M.dark,0,815,-65,NOSH);
  const inLight=new THREE.PointLight(0xdfeaff,.9,1900,1);inLight.position.set(0,1500,-150);interior.add(inLight);
  box(interior,900,10,30,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xcfe2ff,emissiveIntensity:.9}),0,1540,-720,NOSH);
  
  /* --- conveyors (two lanes) --- */
  const beltTexBase=canvasTex(64,16,(g)=>{g.fillStyle='#1c1e21';g.fillRect(0,0,64,16);g.fillStyle='#2c3035';for(let x=0;x<64;x+=16)g.fillRect(x,0,6,16);},{repeat:true});
  const lanes=LANE_Z.map((z,i)=>{
    const L={i,z,state:'—',board:null,moving:0,g:new THREE.Group()};
    L.beltTex=beltTexBase.clone();L.beltTex.needsUpdate=true;L.beltTex.repeat.set(62,1);
    const bm=std(0xffffff,.9,0,{map:L.beltTex});
    const g=L.g;interior.add(g);
    [-1,1].forEach(s=>{
      const rz=z+s*(BD/2+7);
      box(g,1250,46,12,M.alu,0,CONV_Y-17,rz);                         // rail
      box(g,1250,6,5,M.aluD,0,CONV_Y+9,rz-s*3.5,NOSH);                // top guide lip
      box(g,1250,3,6,bm,0,CONV_Y-1.5,z+s*(BD/2-2.5),NOSH);            // belt
      [-520,-260,0,260,520].forEach(x=>box(g,30,30,14,M.aluD,x,865+7,rz)); // feet
      [-590,590].forEach(x=>cyl(g,9,9,14,M.black,x,CONV_Y-9,rz-s*8,{rx:PI/2,cast:false}));
      box(g,60,34,16,M.black,-560,CONV_Y-17,rz+s*14,NOSH);            // belt motor
    });
    // width-adjust lead screws
    [-420,420].forEach(x=>cyl(g,6,6,BD+40,M.steel,x,CONV_Y-30,z,{rx:PI/2,seg:10}));
    // board stopper + sensor
    L.stop=cyl(g,5,5,16,M.steel,BW/2+7,CONV_Y-12,z,{seg:12});
    box(g,14,10,10,std(0xff8a00,.5),BW/2+30,CONV_Y-22,z+BD/2-6,NOSH);
    // support plate under the board
    box(g,BW+20,6,BD-30,M.aluD,0,CONV_Y-30,z);
    for(let ix=-2;ix<=2;ix++)for(let iz=-1;iz<=1;iz++)cyl(g,3,3,26,M.steel,ix*50,CONV_Y-14,z+iz*60,{seg:8,cast:false});
    label(g,'LANE '+(i+1),90,22,-560,CONV_Y+13,z+BD/2+7+ (i?-22:22),{rx:-PI/2,fg:'#4fd1ff',pw:300,size:.7});
    return L;
  });
  
  /* --- XY linear-motor gantry --- */
  const gantry={x:0,z:0};
  const magT=canvasTex(256,16,(g)=>{for(let x=0;x<256;x+=16){g.fillStyle=(x/16)%2?'#8b6a2a':'#59431b';g.fillRect(x,0,16,16);}},{repeat:true});
  (function(){
    [-1,1].forEach(s=>{
      [-640,350].forEach(z=>box(interior,70,330,70,M.aluD,s*540,864+165,z));
      box(interior,84,70,1100,M.alu,s*540,1229,-145);
      const mt=magT.clone();mt.needsUpdate=true;mt.rotation=PI/2;mt.repeat.set(20,1);
      box(interior,40,4,1060,std(0xffffff,.4,.6,{map:mt}),s*540,1266,-145,NOSH);
      box(interior,12,10,1060,M.steel,s*540-s*30,1268,-145,NOSH);
    });
  })();
  const beam=new THREE.Group();interior.add(beam);
  box(beam,1160,110,96,M.alu,0,1325,0);
  box(beam,110,40,150,M.aluD,-540,1290,0);box(beam,110,40,150,M.aluD,540,1290,0);
  (function(){const mt=magT.clone();mt.needsUpdate=true;mt.repeat.set(22,1);box(beam,1000,40,4,std(0xffffff,.4,.6,{map:mt}),0,1325,50,NOSH);
    box(beam,1000,10,8,M.steel,0,1368,50,NOSH);box(beam,1000,10,8,M.steel,0,1282,50,NOSH);
    box(beam,1100,26,60,M.black,0,1394,-10,NOSH);})(); // cable chain
  
  /* --- optical head --- */
  const head=new THREE.Group();interior.add(head);
  const rings=[],projLens=[],projBeams=[];
  let flashSpot,glowSprite,fovGlow,fovStripe,stripeTex;
  const FOV_W=58.56,FOV_D=58.56;
  (function(){
    const h=head;
    box(h,200,150,34,M.aluD,0,1325,-68);                               // carriage on the beam
    box(h,180,330,18,M.alu,0,1215,-58);                                // Z plate
    box(h,70,12,60,M.alu,0,1290,-25);box(h,70,12,60,M.alu,0,1150,-25); // camera brackets
    // top camera
    box(h,66,84,66,M.camBlue,0,1280,0);
    cyl(h,10,10,26,M.black,16,1335,-10,{seg:12});
    label(h,'15MP',44,16,0,1290,33.5,{fg:'#fff',pw:256});
    cyl(h,24,24,110,M.black,0,1185,0);cyl(h,27,27,14,M.aluD,0,1215,0);
    cyl(h,33,30,70,M.black,0,1095,0);cyl(h,34,34,8,M.aluD,0,1128,0);
    // light dome
    const dome=new THREE.Mesh(new THREE.CylinderGeometry(42,118,92,48,1,true),new THREE.MeshStandardMaterial({color:0x121316,roughness:.55,metalness:.2,envMapIntensity:.3,side:THREE.DoubleSide}));
    dome.position.y=978;dome.castShadow=true;h.add(dome);
    cyl(h,46,46,10,M.aluD,0,1028,0,{open:false});
    const ringDef=[[1014,50,0xffffff],[996,66,0xff3030],[972,86,0x30ff60],[948,104,0x3a70ff]];
    ringDef.forEach(r=>{const mt=new THREE.MeshStandardMaterial({color:0x222222,emissive:r[2],emissiveIntensity:.04,roughness:.4});const t=new THREE.Mesh(new THREE.TorusGeometry(r[1],4.5,8,48),mt);t.rotation.x=PI/2;t.position.y=r[0];h.add(t);rings.push(mt);});
    // carrier ring for side cameras and projectors
    const cr=new THREE.Mesh(new THREE.TorusGeometry(150,7,8,48),M.aluD);cr.rotation.x=PI/2;cr.position.y=1100;cr.castShadow=true;h.add(cr);
    for(let k=0;k<4;k++){const a=k*PI/2+PI/4;box(h,110,10,16,M.aluD,Math.cos(a)*95,1100,Math.sin(a)*95,{ry:-a});}
    // 4 side-view cameras (diagonals)
    for(let k=0;k<4;k++){
      const a=k*PI/2+PI/4,g=new THREE.Group();g.position.set(Math.cos(a)*150,1062,Math.sin(a)*150);h.add(g);g.lookAt(new THREE.Vector3(0,902,0));
      box(g,36,36,52,M.camBlue,0,0,-30);cyl(g,12,12,40,M.black,0,0,16,{rx:PI/2,seg:16});cyl(g,9,9,2,M.glassLens,0,0,37,{rx:PI/2,seg:16,cast:false});
    }
    // 4 moire projectors (N/E/S/W)
    for(let k=0;k<4;k++){
      const a=k*PI/2,px=Math.cos(a)*158,pz=Math.sin(a)*158,g=new THREE.Group();g.position.set(px,1082,pz);h.add(g);g.lookAt(new THREE.Vector3(0,902,0));
      box(g,46,46,78,std(0x4a5058,.4,.7),0,0,-42);cyl(g,16,16,34,M.black,0,0,12,{rx:PI/2,seg:16});
      const lm=new THREE.MeshStandardMaterial({color:0x101828,emissive:0x9fd0ff,emissiveIntensity:0,roughness:.1});
      cyl(g,12,12,2,lm,0,0,30,{rx:PI/2,seg:16,cast:false});projLens.push(lm);
      box(g,14,14,10,M.copper,0,26,-60,NOSH);
      // projection frustum (apex at lens, base on the FOV)
      const ap=new THREE.Vector3(px,1082,pz).lerp(new THREE.Vector3(0,902,0),.13),y=CONV_Y+BT+.4,hw=FOV_W/2,hd=FOV_D/2;
      const c=[[-hw,y,-hd],[hw,y,-hd],[hw,y,hd],[-hw,y,hd]],v=[];
      for(let i=0;i<4;i++){const p=c[i],q=c[(i+1)%4];v.push(ap.x,ap.y,ap.z,p[0],p[1],p[2],q[0],q[1],q[2]);}
      const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute(v,3));
      const bm=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:0x9fd0ff,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));
      bm.layers.set(1);bm.visible=false;h.add(bm);projBeams.push(bm);
    }
    // strobe light
    flashSpot=new THREE.SpotLight(0xffffff,0,700,.42,.55,1);flashSpot.position.set(0,1040,0);
    const tg=new THREE.Object3D();tg.position.set(0,900,0);h.add(tg);flashSpot.target=tg;h.add(flashSpot);
    const gt=canvasTex(128,128,(g)=>{const gr=g.createRadialGradient(64,64,4,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.35,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);});
    glowSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:gt,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    glowSprite.scale.set(420,420,1);glowSprite.position.set(0,930,0);glowSprite.layers.set(1);h.add(glowSprite);
    // FOV illumination + fringe pattern on the board
    const pg=new THREE.PlaneGeometry(FOV_W,FOV_D);pg.rotateX(-PI/2);
    fovGlow=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
    fovGlow.position.y=CONV_Y+BT+.3;fovGlow.layers.set(1);h.add(fovGlow);
    stripeTex=canvasTex(64,8,(g)=>{for(let x=0;x<64;x++){const v=Math.round(127+127*Math.sin(x/64*2*PI));g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(x,0,1,8);}},{repeat:true});
    stripeTex.encoding=THREE.LinearEncoding;stripeTex.center.set(.5,.5);stripeTex.repeat.set(7,1);
    fovStripe=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({map:stripeTex,color:0xbfe0ff,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false}));
    fovStripe.position.y=CONV_Y+BT+.35;fovStripe.layers.set(2);fovStripe.visible=false;h.add(fovStripe);
    // FOV outline
    const fr=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints([[-1,-1],[1,-1],[1,1],[-1,1]].map(p=>new THREE.Vector3(p[0]*FOV_W/2,CONV_Y+BT+.5,p[1]*FOV_D/2))),new THREE.LineBasicMaterial({color:0x4fd1ff,transparent:true,opacity:.9}));
    fr.layers.set(1);h.add(fr);head.userData.frame=fr;
  })();
  
  
  return {machine,interior,lanes,beam,head,rings,projLens,projBeams,flashSpot,glowSprite,fovGlow,fovStripe,stripeTex,hoodPivot,doors,tower,monCtx,monTex,shellMats};
}


/* ---------- 6. equipment ---------- */
function stationBase(o){const m=machine(Object.assign({inbox:[],busy:false,st:'s_idle'},o));m.inbox=[];return m;}
function buildLine(){
  E=eff();
  // panel and magazine follow the chosen magazine width; conveyors / flippers adjust their width to it
  MG.W=E.magW;MG.tag=String(E.magW);MG.pitch=10*E.pitch;MG.use=E.use;
  BD=E.magW-8;PSCALE=BD/200;BW=250*PSCALE;
  LOADER_=stationBase({key:'loader',name:T('m_loader'),L:1080,z1:RAIL_F+380,build(m){m.z0=m.z1-1750;buildMagHandler(m,true);}});
  FLIP1=stationBase({key:'flip1',name:T('m_flip1'),L:500,z1:RAIL_F+256,build(m){buildInverterBody(m,[LZ[0]]);}});
  SCANR=stationBase({key:'scanner',name:T('m_scan'),L:500,z1:RAIL_F+168,build(m){buildScannerBody(m,[LZ[0]]);}});
  AOI_=stationBase({key:'aoi',name:T('m_aoi'),L:1250,build(m){const A=buildAOI(m.g,BW,BD);A.machine.position.y=50;m.A=A;A.shellMats.forEach(x=>shellMats.push(x));
    m.hoods.push({p:A.hoodPivot,open:0,target:0,ang:-1.05});m.lamps=A.tower;m.H=1600;
    m.tags=[['15 MP camera, light dome, moiré projectors',0,1380,0],['Lane 1 (used)',-500,960,LZ[0]],['Lane 2 (not used on this line)',-500,960,LZ[1]]];}});
  FLIP2=stationBase({key:'flip2',name:T('m_flip2'),L:500,z1:RAIL_F+256,build(m){buildInverterBody(m,[LZ[0]]);}});
  UNL=stationBase({key:'unloader',name:T('m_unl'),L:1080,z1:RAIL_F+380,build(m){m.z0=m.z1-1750;buildMagHandler(m,false);
    m.magG.forEach((g,i)=>label(g,T('mag'+(i+1)),220,40,0,MG.H-80,MG.W/2+22,{bg:i===2?'#c8202a':'#1f9e55',fg:'#fff',pw:440,size:.62}));}});
  LINE=[LOADER_,FLIP1,SCANR,AOI_,FLIP2,UNL];
  const total=LINE.reduce((s,m)=>s+m.L,0);let x=-total/2;
  LINE.forEach((m,i)=>{m.i=i;m.x0=x;m.x1=x+m.L;m.cx=x+m.L/2;m.X=lx=>m.cx+lx;m.g.position.x=m.cx;m.build(m);x+=m.L;});
  buildZones(total);
  // loader magazines: panels fill magazine 1, then 2, then 3 (bottom to top)
  LOADER_.mags=[0,1,2].map(()=>({present:true,boards:new Array(MG.slots).fill(null),lift:0,busy:false}));
  let n=0;for(let i=0;i<3;i++)for(let k=0;k<MG.use&&n<E.count;k++){const b=newBoard(0);b.inMag=true;b.id='PCB-'+String(++n).padStart(4,'0');b.code=b.id;b.marked=true;drawMark(b,1);b.result='GOOD';LOADER_.mags[i].boards[k]=b;}
  CNT.total=n;
  LOADER_.platY=slotPlat(0);LOADER_.cz=LZ[0];LOADER_.rodX=rodRest(LOADER_);LOADER_.hook=0;LOADER_.sens=0;
  UNL.mags=[0,1,2].map(()=>({present:true,boards:new Array(MG.slots).fill(null),lift:0,busy:false,n:0}));
  UNL.platY=slotPlat(E.cap-1);UNL.cz=LZ[0];UNL.rodX=rodRest(UNL);UNL.hook=0;UNL.sens=0;
  [FLIP1,FLIP2].forEach(m=>{m.ang=0;m.flips=0;});SCANR.read=[0];SCANR.last='—';
  AOI_.fx={color:new THREE.Color(1,1,1),ring:-1,moire:-1,power:0};AOI_.gx=0;AOI_.gz=LZ[0];AOI_.cur=null;AOI_.canMark=false;
}

/* ---------- 7. floor zones: input lane, output lane, analysis area ---------- */
let ZONES=[],zoneStore={out:[],an:[]};
function sign(par,main,subTxt,x,z,col){const g=new THREE.Group();g.position.set(x,0,z);par.add(g);
  box(g,30,2100,30,M.steel,0,1050,-300);box(g,900,10,10,M.steel,0,2100,-300);
  label(g,main,820,150,0,1900,-278,{bg:col,fg:'#fff',pw:1100,size:.5,weight:'900'});label(g,subTxt,820,60,0,1790,-278,{bg:'#1d2128',fg:'#dfe8f5',pw:1100,size:.55});return g;}
function crates(g,x,z,n,col){const mt=std(col,.7,.05);for(let i=0;i<n;i++){const cx=x+(i%3)*330,cy=Math.floor(i/3);box(g,300,190,420,mt,cx,95+cy*195,z);box(g,260,20,380,std(0x1d2128,.7),cx,193+cy*195,z,NOSH);}}
function buildZones(total){const g=new THREE.Group();scene.add(g);ZONES=[g];zoneStore={out:[],an:[]};
  const xl=-total/2-1350,xr=total/2+1350;
  const fl=(x,z,w,d,c)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:.18,depthWrite:false}));m.rotation.x=-PI/2;m.position.set(x,2,z);g.add(m);};
  fl(xl,250,1500,1300,0x1e6fd9);fl(xr,500,1500,1100,0x1f9e55);fl(xr,-950,1500,900,0xc8202a);
  sign(g,'PENTRU SORTARE',T('z_in'),xl,250,'#1e6fd9');crates(g,xl-330,350,5,0x5b6676);
  sign(g,'SORTATE',T('z_out'),xr,500,'#1f9e55');crates(g,xr-330,650,2,0x5b6676);
  sign(g,T('z_an'),T('z_an2'),xr,-950,'#c8202a');box(g,1100,40,700,std(0x3a3f47,.6,.2),xr,780,-950);[[-500,-300],[500,-300],[-500,300],[500,300]].forEach(p=>box(g,40,760,40,M.steel,xr+p[0],380,-950+p[1]));
  ZONES.xr=xr;}

/* ---------- 8. station programs ---------- */
function* loaderRun(m){
  while(true){
    const i=m.mags.findIndex(g=>g.boards.some(b=>b));
    if(i<0){m.st='s_empty';return;}
    const mg=m.mags[i],k=mg.boards.findIndex(b=>b);                              // bottom to top
    m.st='s_shuttle';const z0=m.cz,p0=m.platY;yield* tw(.25+Math.abs(m.magZ[i]-z0)/900,t=>{m.cz=lerp(z0,m.magZ[i],ease(t));m.platY=lerp(p0,slotPlat(k),ease(t));});
    const far=m.magX-BW/2-8;m.st='s_pull';m.hook=0;yield* tw(.9,t=>m.rodX=lerp(rodRest(m),far,ease(t)));yield* tw(.3,t=>m.hook=t);
    const b=mg.boards[k];mg.boards[k]=null;b.inMag=false;b.z=m.magZ[i];b.dy=0;b.t0=simTime;
    yield* tw(1.5,t=>{m.rodX=lerp(far,rodRest(m),t);b.x=m.X(m.rodX+BW/2+8);});yield* tw(.25,t=>m.hook=1-t);
    m.st='s_out';const zb=m.cz;yield* tw(.25+Math.abs(LZ[0]-zb)/900,t=>{m.cz=lerp(zb,LZ[0],ease(t));b.z=m.cz;});
    CNT.loaded++;log(T('l_load',{sn:b.id,m:i+1,s:k+1}));RECORDS.push({id:b.id,aoi:'',dec:'',mag:0,b});
    yield* conveyTo(b,m.X(m.L/2-BW/2-10));yield* hand(m,b);
    while(b.alive&&b.x<m.x1)yield FRAME;}}
function* flipRun(m){
  while(true){while(!m.inbox.length){m.st='s_wait';yield FRAME;}const b=m.inbox.shift();m.busy=true;
    m.st='s_in';yield* conveyTo(b,m.X(0));yield .2;
    if(E.side==='BOT'){m.st='s_flip';const a0=m.ang,f0=b.flip;yield* tw(2.0,k=>{m.ang=a0+PI*ease(k);b.flip=f0+PI*ease(k);});m.flips++;log(T('l_flip',{sn:b.id,f:m.name}));yield .2;}
    else{m.st='s_bypass';log(T('l_bypass',{sn:b.id,f:m.name}));}
    m.st='s_out';yield* conveyTo(b,m.X(m.L/2-BW/2-10));yield* hand(m,b);while(b.alive&&b.x<m.x1)yield FRAME;m.busy=false;}}
function* scanRun(m){
  while(true){while(!m.inbox.length){m.st='s_wait';yield FRAME;}const b=m.inbox.shift();m.busy=true;
    m.st='s_in';yield* conveyTo(b,m.X(DM_X-DM_X*PSCALE));m.st='s_read';m.read[0]=1;yield .6;m.read[0]=0;m.last=b.id;log(T('l_scan',{sn:b.id}),'ok');
    m.st='s_out';yield* conveyTo(b,m.X(m.L/2-BW/2-10));yield* hand(m,b);while(b.alive&&b.x<m.x1)yield FRAME;m.busy=false;}}
function* aoiCapture(m){const fx=m.fx;
  for(const c of [[0xff4a4a,1],[0x4aff7a,2],[0x5a8aff,3],[0xffffff,0]]){fx.color.setHex(c[0]);fx.ring=c[1];fx.moire=-1;fx.power=1;yield .04;fx.power=0;yield .012;}
  for(let k=0;k<2;k++){fx.color.setHex(0xbfe0ff);fx.ring=-1;fx.moire=k*2;fx.power=.5;yield .06;}fx.moire=-1;fx.power=0;}
function* aoiRun(m){
  while(true){while(!m.inbox.length){m.st='s_wait';yield FRAME;}const b=m.inbox.shift();m.busy=true;
    m.st='s_in';yield* conveyTo(b,m.X(0));m.cur=b;m.canMark=true;m.st='s_insp';
    const nx=3,nz=2,sx=(BW-58.56)/Math.max(1,nx-1),sz=(BD-58.56)/Math.max(1,nz-1);
    for(let r=0;r<nz;r++)for(let c=0;c<nx;c++){const cc=r%2?nx-1-c:c,tx=-BW/2+29.28+cc*sx,tz=LZ[0]-BD/2+29.28+r*sz,x0=m.gx,z0=m.gz;
      yield* tw(.08,k=>{m.gx=lerp(x0,tx,k);m.gz=lerp(z0,tz,k);});yield* aoiCapture(m);}
    m.canMark=false;CNT.inspected++;const rec=RECORDS.find(r=>r.b===b);rec.aoi=b.judged?T('BAD'):T('GOOD');
    if(!b.judged)log(T('l_aoi',{sn:b.id,r:T('GOOD')}),'ok');
    m.cur=null;m.st='s_out';const x0=m.gx,z0=m.gz;run(tw(.4,k=>{m.gx=lerp(x0,0,k);m.gz=lerp(z0,LZ[0],k);}));
    yield* conveyTo(b,m.X(m.L/2-BW/2-10));yield* hand(m,b);while(b.alive&&b.x<m.x1)yield FRAME;m.busy=false;}}
function magCount(mg){return mg.boards.filter(Boolean).length;}
function pickMag(b){const c=E.cap;if(b.result==='BAD')return magCount(UNL.mags[2])<c?2:-1;return magCount(UNL.mags[0])<c?0:magCount(UNL.mags[1])<c?1:-1;}
function* unloaderRun(m){
  while(true){while(!m.inbox.length){m.st='s_wait';yield FRAME;}const b=m.inbox.shift();m.busy=true;
    m.st='s_in';yield* conveyTo(b,m.X(m.shX+250-BW/2-6));m.sens=1;m.st='s_sensor';yield .4;
    let i;while((i=pickMag(b))<0){if(hold!=='full'){hold='full';m.st='s_full';const bad=b.result==='BAD';showWarn(T(bad?'fullBad':'fullGood'));log(T('l_full',{n:bad?3:'1 + 2'}),'ng');}yield FRAME;}
    const mg=m.mags[i];let k=E.cap-1;while(k>0&&mg.boards[k])k--;                     // top to bottom
    m.st='s_shuttle';const zb=m.cz,p0=m.platY;yield* tw(.25+Math.abs(m.magZ[i]-zb)/900,t=>{m.cz=lerp(zb,m.magZ[i],ease(t));b.z=m.cz;m.platY=lerp(p0,slotPlat(k),ease(t));});
    // 1) the conveyor belts drive the panel into the magazine as far as they reach (pusher still raised at reference)
    const ref=rodRest(m),home=m.magX-MG.L/2-2;
    m.st='s_feed';yield* conveyTo(b,m.X(m.shX+250-8+BW/2));m.sens=0;
    // 2) the lever drops behind the trailing edge, travels to it and pushes the panel home; the paddle stops at the magazine entrance
    m.st='s_push';yield* tw(.25,t=>m.hook=t);const edge=b.x-m.cx-BW/2-3;yield* tw(.8,t=>m.rodX=lerp(ref,edge,ease(t)));
    yield* tw(.7,t=>{m.rodX=lerp(edge,home,t);b.x=m.X(m.rodX+BW/2+3);});b.inMag=true;mg.boards[k]=b;
    // 3) lever up, back to the reference point
    m.st='s_return';yield* tw(.25,t=>m.hook=1-t);yield* tw(.9,t=>m.rodX=lerp(home,ref,ease(t)));
    const rec=RECORDS.find(r=>r.b===b);rec.mag=i+1;b.result==='BAD'?CNT.bad++:CNT.good++;m.outT.push(simTime);m.procT.push(simTime-b.t0);
    log(T('l_store',{sn:b.id,n:i+1}),b.result==='BAD'?'ng':'ok');
    const zc=m.cz;yield* tw(.25+Math.abs(LZ[0]-zc)/900,t=>m.cz=lerp(zc,LZ[0],ease(t)));m.busy=false;
    if(CNT.good+CNT.bad>=CNT.total)finishRun();}}

/* ---------- 9. operator actions ---------- */
function markPanel(){if(!started||!AOI_.cur||!AOI_.canMark||hold||userPause||stopped)return;
  const b=AOI_.cur;hold='judge';AOI_.st='s_judge';log(T('l_mark',{sn:b.id}),'cl');
  $('jMsg').textContent=T('judgeMsg',{sn:b.id});$('judge').classList.add('show');}
function decide(good){const b=AOI_.cur;if(hold!=='judge'||!b)return;b.judged=true;b.result=good?'GOOD':'BAD';CNT.judged++;
  log(T('l_dec',{sn:b.id,d:T(good?'GOOD':'BAD')}),good?'ok':'ng');$('judge').classList.remove('show');hold=null;AOI_.st='s_insp';}
function replaceMags(){if(hold!=='full')return;const full=UNL.mags.map((g,i)=>magCount(g)>=E.cap?i:-1).filter(i=>i>=0);
  UNL.st='s_swap';hideWarn();
  runSvc((function*(){
    for(const i of full){const mg=UNL.mags[i];mg.busy=true;yield .6;yield* tw(1.0,k=>mg.lift=k*900);
      const kept=magMesh(ZONES[0],1),bad=i===2,list=bad?zoneStore.an:zoneStore.out,n=list.length;
      kept.position.set(ZONES.xr-350+(n%3)*330,bad?800:0,(bad?-950:450)+Math.floor(n/3)*-10+(bad?0:-200));list.push(kept);
      mg.present=false;mg.boards.forEach(b=>b&&killBoard(b));mg.boards=new Array(MG.slots).fill(null);yield .5;mg.present=true;
      yield* tw(1.0,k=>mg.lift=(1-k)*900);mg.lift=0;mg.busy=false;log(T('l_repl',{n:i+1}),'cl');}
    hold=null;UNL.st='s_wait';})());}
function finishRun(){if(runDone)return;runDone=true;const tot=CNT.good+CNT.bad;
  log(T('l_done',{g:CNT.good,b:CNT.bad}),'ok');
  $('dBody').innerHTML=[[T('c_load'),CNT.loaded],[T('c_ins'),CNT.inspected],[T('c_good'),CNT.good],[T('c_bad'),CNT.bad],[T('c_judge'),CNT.judged],['% '+T('pctNok'),(tot?(CNT.bad/tot*100).toFixed(1):'0.0')+' %'],
    [T('sum_side'),E.side],[T('sum_prog'),E.prog],[T('sum_w'),E.magW+' mm · '+T('pw')+' '+E.pitch]].map(r=>'<tr><td>'+r[0]+'</td><td>'+r[1]+'</td></tr>').join('');
  $('done').classList.add('show');}

/* ---------- 10. run control ---------- */
function rebuild(){cos=[];svc=[];[...boards].forEach(b=>b.alive&&killBoard(b));boards=[];MACH.forEach(m=>scene.remove(m.g));MACH.length=0;ZONES.forEach(z=>scene.remove(z));
  shellMats.length=SHELL0;
  RECORDS.length=0;Object.keys(CNT).forEach(k=>CNT[k]=0);started=false;userPause=false;stopped=false;hold=null;runDone=false;simTime=0;moving=0;
  logEl.innerHTML='';hideWarn();$('judge').classList.remove('show');$('done').classList.remove('show');
  const _t0=performance.now();disposeFrozen();LODS.length=0;BI.reset();
  buildLine();if(xray)applyXray();setHoods(hoodsOpen);buildTags();freezeLine();
  PerfHUD.build=performance.now()-_t0;ShadowSched.force=true;RenderGate.dirty=true;ui(true);}
function start(){if(stopped&&started){stopped=false;ui(true);return;}if(started||!setupValid())return;
  started=true;log(T('l_start',{side:E.side,prog:E.prog,w:E.magW,p:E.pitch}));
  run(loaderRun(LOADER_));run(flipRun(FLIP1));run(scanRun(SCANR));run(aoiRun(AOI_));run(flipRun(FLIP2));run(unloaderRun(UNL));ui(true);}
function lineState(){return !started?'st_ready':runDone?'st_done':stopped?'st_stop':userPause?'st_pause':hold==='judge'?'st_judge':hold==='full'?'st_full':'st_run';}
function showWarn(t){$('wMsg').textContent=t;$('warn').classList.add('show');}
function hideWarn(){$('warn').classList.remove('show');}

/* ---------- 11. UI: setup panel, buttons, counters, language ---------- */
const SHELL0=shellMats.length;let hoodsOpen=0,xray=false,showTags=false,tags=[];
function setHoods(o){hoodsOpen=o;MACH.forEach(m=>m.hoods.forEach(h=>h.target=o));}
function applyXray(){shellMats.forEach(mt=>{mt.transparent=xray;mt.opacity=xray?.12:1;mt.depthWrite=!xray;mt.needsUpdate=true;});}
function buildTags(){$('tags').innerHTML='';tags=[];MACH.forEach(m=>(m.tags||[]).forEach(t=>{const el=document.createElement('div');el.className='tag';el.textContent=t[0];$('tags').appendChild(el);tags.push({el,m,v:new THREE.Vector3(t[1],t[2],t[3])});}));}
const SHELL_RO={'Theme':'Temă','On-screen data':'Date pe ecran','Title':'Titlu','Cycle time':'Timp de ciclu','Line status':'Stare linie','Event log':'Jurnal evenimente','Mouse hint':'Indicație mouse',
  'White':'Alb','Dark gray':'Gri închis','Sorting line':'Linie de sortare','LOADER':'ÎNCĂRCĂTOR','SCANNER':'SCANER','UNLOADER':'DESCĂRCĂTOR'};
function i18nShell(){document.querySelectorAll('#sideBody .sec h3:not([data-t]),#sideBody .chk span:not([data-t]),[data-theme-btn],.flow span').forEach(e=>{if(!e.dataset.en)e.dataset.en=e.textContent;
  e.textContent=LANG==='ro'&&SHELL_RO[e.dataset.en]?SHELL_RO[e.dataset.en]:e.dataset.en;});}
function i18nDom(){document.documentElement.lang=LANG;i18nShell();document.querySelectorAll('[data-t]').forEach(e=>e.textContent=T(e.dataset.t));
  document.querySelector('#title .t1').textContent=T('title');document.querySelector('#title .t2').textContent=T('sub');
  document.querySelector('#sideBody .fn').textContent=T('title');document.querySelector('#sideBody .fn-sub').textContent=T('sub');document.querySelector('#rail .vtxt').textContent=T('title');
  $('hint').textContent=T('hint');$('progSel').options[0].textContent=T('choose');
  document.querySelectorAll('[data-lang]').forEach(b=>b.classList.toggle('on',b.dataset.lang===LANG));}
function setLang(l){LANG=l;try{localStorage.setItem('smt-lang',l);}catch(e){}i18nDom();if(!started)rebuild();else{ui(true);}}
function setupDom(){const act=SET.active,lock=started;
  $('setAct').checked=act;$('setAct').disabled=lock;$('setFields').classList.toggle('off',!act||lock);
  document.querySelectorAll('[data-side]').forEach(b=>b.classList.toggle('on',(act?SET.side:null)===b.dataset.side));
  document.querySelectorAll('[data-w]').forEach(b=>b.classList.toggle('on',(act?SET.magW:null)===+b.dataset.w));
  document.querySelectorAll('[data-p]').forEach(b=>b.classList.toggle('on',(act?SET.pitch:null)===+b.dataset.p));
  $('progSel').value=act?(SET.prog||''):'';
  const e=eff();$('cntIn').max=3*e.use;$('capIn').max=e.use;$('cntIn').value=act?Math.min(SET.count,3*e.use):e.count;$('capIn').value=act?Math.min(SET.cap,e.use):e.cap;
  $('wOut').textContent=(e.magW-8)+' mm';$('fOut').textContent=e.side==='BOT'?T('flip'):T('bypass');$('useOut').textContent=e.use+' '+T('slots');
  $('setNote').textContent=lock?T('locked'):!act?T('setOff'):!setupValid()?T('need'):'';
  ['setFields'].forEach(id=>$(id).querySelectorAll('button,select,input').forEach(x=>x.disabled=!act||lock));}
function changed(){if(started)return;const e=eff();SET.count=Math.min(SET.count,3*e.use);SET.cap=Math.min(SET.cap,e.use);rebuild();}
$('setAct').onchange=()=>{SET.active=$('setAct').checked;changed();};
document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>{SET.side=b.dataset.side;changed();});
document.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{SET.magW=+b.dataset.w;changed();});
document.querySelectorAll('[data-p]').forEach(b=>b.onclick=()=>{SET.pitch=+b.dataset.p;changed();});
$('progSel').onchange=()=>{SET.prog=$('progSel').value||null;changed();};
$('cntIn').onchange=()=>{SET.count=Math.max(1,+$('cntIn').value||1);changed();};
$('capIn').onchange=()=>{SET.cap=Math.max(1,+$('capIn').value||1);changed();};
document.querySelectorAll('[data-lang]').forEach(b=>b.onclick=()=>setLang(b.dataset.lang));
$('bStart').onclick=start;
$('bPause').onclick=()=>{if(!started||stopped)return;userPause=!userPause;ui(true);};
$('bStop').onclick=()=>{if(!started)return;stopped=true;userPause=false;ui(true);};
$('bReset').onclick=()=>rebuild();
$('bMark').onclick=markPanel;$('bRepl').onclick=replaceMags;
$('jPass').onclick=()=>decide(true);$('jFail').onclick=()=>decide(false);
$('dClose').onclick=()=>$('done').classList.remove('show');
document.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-s]').forEach(x=>x.classList.remove('on'));b.classList.add('on');speed=+b.dataset.s;});
$('bHood').onclick=()=>setHoods(hoodsOpen?0:1);
$('bXray').onclick=()=>{xray=!xray;applyXray();ui(true);};
$('bLab').onclick=()=>{showTags=!showTags;if(!showTags)tags.forEach(t=>t.el.style.display='none');ui(true);};
let tween=null,follow=null;
function flyTo(p,t,dur=1.2){tween={p0:camera.position.clone(),t0:controls.target.clone(),p1:new THREE.Vector3(...p),t1:new THREE.Vector3(...t),t:0,dur};follow=null;}
const views={over:()=>flyTo(overPos(),[0,700,-200]),
  loader:()=>{const m=LOADER_;setHoods(1);flyTo([m.cx-1300,2300,2300],[m.cx,1000,-350]);},
  aoi:()=>{const m=AOI_;setHoods(1);flyTo([m.cx+650,1950,1650],[m.cx,960,120]);},
  unloader:()=>{const m=UNL;setHoods(1);flyTo([m.cx+1300,2300,2300],[m.cx,1000,-350]);},
  follow:()=>{setHoods(1);const b=boards.filter(b=>b.alive&&!b.inMag).sort((a,c)=>c.x-a.x)[0];if(b){flyTo([b.x-350,CONV_Y+450,b.z+720],[b.x,CONV_Y,b.z],.9);follow={b};}},
  top:()=>{setHoods(1);flyTo([0,9000,10],[0,900,0]);},
  pusher:()=>{const m=UNL;setHoods(0);if(!xray){xray=true;applyXray();ui(true);}const x=m.X(PUSHX),z=m.cz;flyTo([x-40,CONV_Y+1650,z+330],[x,CONV_Y,z-30]);follow={pusher:true};}};
const PUSHX=-40;   // pusher view centre (unloader-local x): between the pusher reference and the magazine entrance
document.querySelectorAll('[data-v]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-v]').forEach(x=>x.classList.remove('on'));b.classList.add('on');views[b.dataset.v]();});
controls.addEventListener('start',()=>{tween=null;});
/* click a hood to open / close it */
const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();let downAt=null;
function hitHood(e){SMT.ndc(e,mouse);ray.setFromCamera(mouse,camera);const hs=[];MACH.forEach(m=>m.hoods.forEach(h=>hs.push(h)));
  const hit=ray.intersectObjects(hs.map(h=>h.p),true)[0];if(!hit)return null;for(let o=hit.object;o;o=o.parent){const h=hs.find(h=>h.p===o);if(h)return h;}return null;}
canvas.addEventListener('pointerdown',e=>{downAt=[e.clientX,e.clientY];});
canvas.addEventListener('pointerup',e=>{if(!downAt||Math.hypot(e.clientX-downAt[0],e.clientY-downAt[1])>5)return;const h=hitHood(e);if(h)h.target=h.target?0:1;});
canvas.addEventListener('pointermove',e=>{if(e.buttons)return;canvas.style.cursor=hitHood(e)?'pointer':'';});

const pillCls=k=>/s_wait|s_idle|s_empty/.test(k)?'idle':/s_full|s_judge/.test(k)?'ng':/s_swap|s_sensor/.test(k)?'cl':'';
let _uiKey='';
function ui(force){
  const ls=lineState();
  const bar=(id,v,max)=>{$(id).style.width=(max?Math.min(100,v/max*100):0)+'%';};
  // buttons
  $('bStart').disabled=(started&&!stopped)||runDone||!setupValid();$('bPause').disabled=!started||stopped||runDone;$('bStop').disabled=!started||stopped||runDone;
  $('bPause').textContent=T(userPause?'RESUME':'PAUSE');$('bPause').classList.toggle('on',userPause);
  $('bMark').disabled=!(started&&AOI_.cur&&AOI_.canMark&&!hold&&!userPause&&!stopped);$('bRepl').disabled=hold!=='full'||!!svc.length;
  $('bHood').textContent=T(hoodsOpen?'close':'covers');$('bHood').classList.toggle('on',!!hoodsOpen);$('bXray').classList.toggle('on',xray);$('bLab').classList.toggle('on',showTags);
  // status
  $('lineSt').textContent=T(ls);$('lineSt').className='pill '+(ls==='st_run'?'ok':ls==='st_ready'||ls==='st_done'?'idle':ls==='st_pause'||ls==='st_judge'?'cl':'ng');
  $('setLine').textContent=E.side+' · '+(E.side==='BOT'?T('flip'):T('bypass'))+' · '+E.prog+' · '+E.magW+' mm · '+T('pw')+' '+E.pitch+' · '+T('cp')+' '+E.cap;
  $('stList').innerHTML=LINE.map(m=>'<div class="row"><span>'+m.name+'</span><span class="pill '+pillCls(m.st)+'">'+T(m.st)+'</span></div>').join('');
  const left=LOADER_.mags.reduce((s,g)=>s+magCount(g),0);
  [['cLoad',CNT.loaded+' / '+CNT.total],['cIns',CNT.inspected],['cGood',CNT.good],['cBad',CNT.bad],['cJudge',CNT.judged],['cLeft',left]].forEach(([id,v])=>$(id).textContent=v);
  UNL.mags.forEach((g,i)=>{const n=magCount(g);$('m'+(i+1)+'n').textContent=n+' / '+E.cap;bar('m'+(i+1)+'b',n,E.cap);});
  // cycle time
  const o=UNL.outT.slice(-6),iv=[];for(let i=1;i<o.length;i++)iv.push(o[i]-o[i-1]);const avg=iv.length?iv.reduce((a,b)=>a+b,0)/iv.length:0;const pt=UNL.procT.length?UNL.procT[UNL.procT.length-1]:0;
  SMT.cycle(avg?avg.toFixed(1)+' s':'—',avg?T('cyc1',{n:Math.round(3600/avg),t:pt.toFixed(1)}):(started?T('cyc0'):T('st_ready')),T('cycK'));
  if(force)setupDom();
}

/* ---------- 12. main loop ---------- */
function resize(){const [w,h]=SMT.size();if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(SMT.stage());resize();
renderer.shadowMap.autoUpdate=false;
let _blink=null,_prevRendered=false,_lastT=performance.now(),_lodT=0,_monKey='';
const clock=new THREE.Clock();let uiT=0;const _p=new THREE.Vector3();
function stepSim(dt){
  const n=Math.max(1,Math.ceil(dt/.03));
  for(let i=0;i<n;i++){const d=dt/n;if(started&&!hold){simTime+=d;for(let k=0;k<cos.length;k++)cos[k].step(d);}for(let k=0;k<svc.length;k++)svc[k].step(d);}
  cos=cos.filter(c=>!c.done);svc=svc.filter(c=>!c.done);}
function frame(){
  requestAnimationFrame(frame);
  const rdt=Math.min(clock.getDelta(),.05),frozen=userPause||stopped,dt=frozen?0:(window.__step!==undefined?window.__step:rdt*speed);
  if(dt>0){stepSim(dt);if(moving>0&&!hold){beltTex.offset.x-=dt*V/16;if(AOI_.A)AOI_.A.lanes[0].beltTex.offset.x-=dt*V/20;}}
  // equipment poses
  magBoardsUpdate(LOADER_);magBoardsUpdate(UNL);
  [FLIP1,FLIP2].forEach(m=>m.rot[0].rotation.x=m.ang);
  SCANR.heads[0].emissiveIntensity=SCANR.read[0]?2.5:.1;SCANR.fans[0].visible=!!SCANR.read[0];
  {const A=AOI_.A,fx=AOI_.fx,p=fx.power;A.head.position.set(AOI_.gx,0,AOI_.gz);A.beam.position.z=AOI_.gz-133;
   if(fx.moire>=0&&dt>0)A.stripeTex.offset.x+=dt*7;
   A.flashSpot.intensity=fx.moire>=0?0:p*2.4;A.flashSpot.color.copy(fx.color);A.glowSprite.material.opacity=p*.5;A.glowSprite.material.color.copy(fx.color);
   A.fovGlow.material.opacity=fx.moire<0?p*.1:0;A.fovGlow.material.color.copy(fx.color);
   A.rings.forEach((m,i)=>m.emissiveIntensity=(p>0&&(fx.ring===i||fx.ring===9))?2.4:.04);
   for(let i=0;i<4;i++){A.projLens[i].emissiveIntensity=fx.moire===i?2.5:0;A.projBeams[i].visible=fx.moire===i;}
   A.fovStripe.visible=fx.moire>=0;if(fx.moire>=0)A.stripeTex.rotation=fx.moire*PI/2;A.head.userData.frame.material.opacity=AOI_.cur?.9:.25;}
  // lamps: green running · yellow paused / waiting for the operator · red stopped / magazine full
  const ls=lineState(),G=ls==='st_run',Y=ls==='st_pause'||ls==='st_judge'||ls==='st_ready'||ls==='st_done',R=ls==='st_stop'||ls==='st_full',blink=(performance.now()%700)<350;
  MACH.forEach(m=>{m.hoods.forEach(h=>{h.open+=(h.target-h.open)*Math.min(1,rdt*3);h.p.rotation.x=h.ang*h.open;});
    if(m.lamps){m.lamps.g.emissiveIntensity=G?1.8:.05;m.lamps.y.emissiveIntensity=Y&&(ls!=='st_judge'||blink)?1.8:.05;m.lamps.r.emissiveIntensity=R&&blink?1.8:.05;}});
  boards.forEach(b=>{if(!b.alive)return;b.g.position.set(b.x,CONV_Y+BT/2*PSCALE+b.dy,b.z);b.piv.rotation.x=b.flip;});
  if(tween){tween.t+=rdt;const k=ease(Math.min(1,tween.t/tween.dur));camera.position.lerpVectors(tween.p0,tween.p1,k);controls.target.lerpVectors(tween.t0,tween.t1,k);if(k>=1)tween=null;}
  if(follow&&follow.pusher&&!tween){_p.set(UNL.X(PUSHX),CONV_Y,UNL.cz-30).sub(controls.target);_p.x=0;camera.position.add(_p);controls.target.add(_p);}
  else if(follow&&!tween){if(!follow.b.alive||follow.b.inMag)follow=null;else{_p.set(follow.b.x,CONV_Y,follow.b.z).sub(controls.target);camera.position.add(_p);controls.target.add(_p);}}
  const camMoved=controls.update();const dist=camera.position.distanceTo(controls.target);camera.near=Math.max(1.5,Math.min(10,dist*.03));camera.updateProjectionMatrix();
  const hoodMoving=MACH.some(m=>m.hoods.some(h=>Math.abs(h.target-h.open)>.002));
  const simLive=dt>0&&((started&&!hold&&!runDone)||svc.length>0);
  const bl=(ls==='st_judge'||R)?blink:null;if(bl!==_blink){_blink=bl;RenderGate.dirty=true;}
  if((_lodT+=rdt)>.25){_lodT=0;updateLOD();}
  const need=RenderGate.dirty||simLive||hoodMoving||camMoved||!!tween||!!follow||ShadowSched.pending||ShadowSched.force;
  const _now=performance.now(),realDt=Math.min(1,(_now-_lastT)/1000);_lastT=_now;
  const [W,H]=SMT.size();
  if(need){BI.update();ShadowSched.update(shadowSig(),performance.now()/1000);renderer.setViewport(0,0,W,H);renderer.clear();renderer.render(scene,camera);RenderGate.dirty=false;RenderGate.frames++;
    if(_prevRendered)Quality.sample(realDt);}else RenderGate.skipped++;
  PerfHUD.frame(realDt,need&&_prevRendered);_prevRendered=need;
  if(need&&showTags)tags.forEach(t=>{_p.copy(t.v);t.m.g.localToWorld(_p);_p.project(camera);const vis=_p.z<1&&Math.abs(_p.x)<1&&Math.abs(_p.y)<1;t.el.style.display=vis?'block':'none';if(vis){t.el.style.left=((_p.x+1)/2*W)+'px';t.el.style.top=((1-_p.y)/2*H)+'px';}});
  uiT+=rdt;if(uiT>.15){uiT=0;ui(false);}
  if(AOI_.A&&(AOI_._mt=(AOI_._mt||0)+rdt)>.4){AOI_._mt=0;const k=(AOI_.cur?AOI_.cur.id+AOI_.cur.judged:'-')+CNT.inspected+CNT.good+CNT.bad+LANG+E.prog;if(k!==_monKey){_monKey=k;drawAoiMonitor();RenderGate.dirty=true;}}
}
function drawAoiMonitor(){const g=AOI_.A.monCtx,W=640,H=400;if(!g)return;g.fillStyle='#0b1220';g.fillRect(0,0,W,H);
  g.fillStyle='#1557b8';g.fillRect(0,0,W,40);g.fillStyle='#fff';g.font='700 20px Arial';g.textAlign='left';g.textBaseline='middle';g.fillText('AOI · '+E.prog+' · '+E.side,14,21);
  const b=AOI_.cur;g.font='600 26px Arial';g.fillStyle='#dfe8f5';g.fillText(b?b.id:'—',20,90);
  g.font='800 54px Arial';g.fillStyle=b&&b.judged?(b.result==='BAD'?'#ff4d5a':'#3ddc84'):'#9fb4cf';g.fillText(b?(b.judged?T(b.result):T('s_insp')):T('s_wait'),20,160);
  g.font='500 18px Arial';g.fillStyle='#8fa3bd';g.fillText(T('c_ins')+' '+CNT.inspected+'   '+T('c_good')+' '+CNT.good+'   '+T('c_bad')+' '+CNT.bad,20,360);AOI_.A.monTex.needsUpdate=true;}
camera.position.set(400,4300,8600);controls.target.set(0,700,-200);controls.maxDistance=20000;
window.__sim={get E(){return E;},SET,CNT,RECORDS,get LINE(){return LINE;},get started(){return started;},get hold(){return hold;},get state(){return lineState();},
  endTween:()=>{if(tween)tween.t=tween.dur;},start,rebuild,markPanel,decide,replaceMags,setLang,views,setHoods,
  get perf(){return{calls:PerfHUD.calls,tris:renderer.info.render.triangles,programs:renderer.info.programs.length,frames:RenderGate.frames,skipped:RenderGate.skipped,build:PerfHUD.build,quality:Quality.level,mode:Quality.mode};},
  setQuality:m=>Quality.set(m),ready:false,
  ff:s=>{const n=Math.round(s/.02);for(let i=0;i<n;i++)stepSim(.02);},
  pause:()=>{userPause=!userPause;},stop:()=>{stopped=true;},magCount:i=>magCount(UNL.mags[i])};
boot();


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
