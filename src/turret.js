import { refineComponentFaces } from './component-faces.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { routedCurve, bundledStrands } from './routing.js';
import { refineTurretProducts } from './turret-products.js';
import * as THREE from 'three';
import { batchStaticParts } from './performance.js';

export const turretSpec=Object.freeze({cpu:'AMD Ryzen 5 2600',cores:6,threads:12,clock:'3.40 GHz',motherboard:'MSI X470 GAMING PRO CARBON',memory:'Kingston ValueRAM KVR26N19D8/16 × 2 (reference model, unconfirmed)',gpu:'MSI GeForce RTX 3060 Ti GAMING X TRIO 8GB (inferred)',storage:['Intel 760p SSDPEKKW256G8 · 256GB M.2','WDC WD10EZEX-00BBHA0 · 1TB HDD'],psu:'Cooler Master MWE Bronze 550 · 550W',case:'COUGAR TURRET RGB black (inferred variant)',cooler:'AMD Wraith Stealth (inferred)',fans:{front:2,rear:0,cpu:1}});
const parts=[
 ['cpu','處理器','AMD Ryzen 5 2600','6 核心 / 12 執行緒 · 3.40 GHz'],
 ['motherboard','主機板','MSI X470 GAMING PRO CARBON','AM4 · DDR4 · ATX'],
 ['memory','記憶體','Kingston ValueRAM · 32GB','建模選用 KVR26N19D8/16 ×2 · 品牌與時脈未確認'],
 ['gpu','顯示卡','MSI RTX 3060 Ti GAMING X TRIO','款式推定 · 8GB · TRI FROZR 2 · 雙 8-pin'],
 ['ssd1','M.2 固態硬碟','Intel 760p · 256GB','SSDPEKKW256G8 · M.2 2280 · PCIe 3.0 ×4'],
 ['hdd','機械硬碟','Western Digital · 1TB','WD10EZEX-00BBHA0 · 3.5 吋'],
 ['cooler','CPU 散熱器','AMD Wraith Stealth','型號推定 · Ryzen 2600 原配款 · AM4'],
 ['psu','電源供應器','Cooler Master MWE Bronze 550','550W 已確認 · 外觀按初代 MWE Bronze，版本推定'],
 ['frontFans','前方風扇','COUGAR VORTEX RGB FCB 120 ×2','型號推定 · Core Box C 控制器 · 前方兩顆'],
 ['case','機殼','COUGAR TURRET RGB','RGB 版本推定 · 206 × 461 × 420 mm'],
].map(([id,category,title,detail])=>({id,category,title,detail}));

export function createTurret(renderer){
 const pc=new THREE.Group();pc.name='COUGAR TURRET / Ryzen 5 2600';pc.userData.specification=turretSpec;
 let part='case';const rotors=[],links=[];
 const mat=(color,metalness=.4,roughness=.45)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const steel=mat('#161c23'),black=mat('#080c10',.1,.7),silver=mat('#9ba4aa',.8,.3),pcb=mat('#172623',.1,.7),gold=mat('#bf9d50',.8),rubber=mat('#1d2326',0,.95);
 const green=mat('#76fa96');green.emissive.set('#37e05b');green.emissiveIntensity=1.5;
 const glow=['#63ddff','#a18aff','#eb71f5','#80ff9d'].map(c=>{return new THREE.MeshBasicMaterial({color:c,toneMapped:false});});
 function add(g,n,p,m=steel,parent=pc,rotation=[0,0,0]){const o=new THREE.Mesh(g,m);o.position.set(...p);o.rotation.set(...rotation);o.name=n;o.userData.partId=part;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(n,s,p,m=steel,parent=pc)=>add(new THREE.BoxGeometry(...s),n,p,m,parent);
 const cyl=(n,r,h,p,m=silver,parent=pc,rot=[Math.PI/2,0,0])=>add(new THREE.CylinderGeometry(r,r,h,20),n,p,m,parent,rot);
 function text(n,w,h,p,color='#c6cdd2',rot=[0,0,0]){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.fillStyle=color;x.font='bold 42px Arial';x.textAlign='center';x.textBaseline='middle';x.fillText(n,256,64,500);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const o=add(new THREE.PlaneGeometry(w,h),n,p,new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}),pc,rot);o.castShadow=false;return o;}
 function batch(n,g,poses,m){const o=new THREE.InstancedMesh(g,m,poses.length),t=new THREE.Object3D();poses.forEach((p,i)=>{t.position.set(...p.slice(0,3));t.rotation.set(0,0,p[3]||0);t.updateMatrix();o.setMatrixAt(i,t.matrix);});o.computeBoundingSphere();o.name=n;o.userData.partId=part;o.castShadow=true;o.receiveShadow=true;pc.add(o);return o;}
 function plate(n,w,h,p,holes,rot=[0,0,0]){const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();for(const[x,y,a,b]of holes){const q=new THREE.Path();q.moveTo(x-a/2,y-b/2);q.lineTo(x-a/2,y+b/2);q.lineTo(x+a/2,y+b/2);q.lineTo(x+a/2,y-b/2);q.closePath();s.holes.push(q);}const g=new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:false});g.translate(0,0,-.0125);return add(g,n,p,steel,pc,rot);}
 function mesh(n,w,h,p,rot=[0,0,0]){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='white';x.fillRect(0,0,64,64);x.fillStyle='black';for(const[a,b]of [[16,16],[48,48]]){x.beginPath();x.arc(a,b,14,0,7);x.fill();}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(w/.12,h/.12);const m=steel.clone();m.alphaMap=t;m.alphaTest=.5;m.side=THREE.DoubleSide;return add(new THREE.PlaneGeometry(w,h),n,p,m,pc,rot);}
 function fan(n,p,size,rotation=[0,0,0],rgb=true){const g=new THREE.Group();g.position.set(...p);g.rotation.set(...rotation);g.userData.partId=part;g.name=n;pc.add(g);
 if(!n.startsWith('AMD')){for(const x of [-size/2,size/2])box('Fan mounting frame',[.065,size,.07],[x,0,0],black,g);for(const y of [-size/2,size/2])box('Fan mounting frame',[size,.065,.07],[0,y,0],black,g);}
 for(let i=0;i<(rgb?4:1);i++)add(new THREE.TorusGeometry(size*.425,.024,6,24,rgb?Math.PI/2:Math.PI*2),'Fan light ring',[0,0,.055],rgb?glow[i]:steel,g,[0,0,i*Math.PI/2]);
 const rotor=new THREE.Group();g.add(rotor);rotors.push(rotor);const s=new THREE.Shape();s.moveTo(.09,0);s.bezierCurveTo(.27,-.11,.49,-.04,.44,.15);s.bezierCurveTo(.32,.28,.16,.15,.09,.06);s.closePath();const geo=new THREE.ExtrudeGeometry(s,{depth:.022,bevelEnabled:false,curveSegments:5});const blades=new THREE.InstancedMesh(geo,steel,9),t=new THREE.Object3D();for(let i=0;i<9;i++){t.rotation.z=i*Math.PI*2/9;t.scale.setScalar(size);t.updateMatrix();blades.setMatrixAt(i,t.matrix);}blades.computeBoundingSphere();rotor.add(blades);cyl('Fan hub',size*.12,.12,[0,0,.08],black,g);return g;
 }
 function port(n,p,s=[.14,.12,.12]){return box(n,s,p,black);}
 function wire(n,a,b,points,r=.018,m=rubber){const old=part;part='wiring';const path=routedCurve(points);
 const count=n==='24-pin motherboard power'?24:/GPU.*PCIe|CPU EPS/.test(n)?8:0;
 if(count){const route=new THREE.Object3D();route.name=n;route.userData={partId:part,clearanceRoute:{path,radius:r}};pc.add(route);const geometries=bundledStrands(path,r,count).map(strand=>new THREE.TubeGeometry(strand,Math.max(36,points.length*5),r*(count===24?.12:.19),5,false));const mesh=add(mergeGeometries(geometries),n+' conductors',[0,0,0],m);mesh.userData.bundleStrand=true;geometries.forEach(g=>g.dispose());}
 else add(new THREE.TubeGeometry(path,Math.max(32,points.length*6),r,6,false),n,[0,0,0],m);links.push({name:n,from:a.name,to:b.name,start:points[0],end:points.at(-1),a,b});part=old;}
 // Chassis proportions follow TURRET; front finish is an approximation without a front photograph.
 box('Chassis floor',[4.10,.08,2.02],[0,.27,0]);box('Right steel side',[4.08,4.20,.04],[0,2.4,-1]);
 plate('Motherboard tray',3.80,3.67,[0,2.62,-.82],[[1.30,.58,.39,.8],[1.3,-.67,.39,.59],[-1.50,1.745,.32,.14]]);
 for(const x of [-2.01,2.01])for(const z of [-.96,.96])box('Chassis corner upright',[.075,4.22,.07],[x,2.4,z]);
 for(const y of [.34,4.47])for(const z of [-.97,.97])box('Side frame folded rail',[4.08,.10,.08],[0,y,z]);
 for(const x of [-1.52,1.52])for(const z of [-.73,.73]){box('Case foot',[.44,.18,.34],[x,.14,z]);box('Rubber foot pad',[.38,.035,.29],[x,.032,z],rubber);}
 mesh('Top dust mesh',3.23,1.74,[-.23,4.49,0],[-Math.PI/2,0,0]);
 plate('Rear ventilated frame',1.95,4.1,[-2.03,2.4,0],[[.10,1.25,1.24,1.24],[-.67,1.03,.39,1.4],[.08,-.59,1.37,1.40],[-.05,-1.78,1.52,.48]],[0,-Math.PI/2,0]);
 mesh('Unoccupied rear exhaust grille',1.23,1.23,[-2.049,3.65,.1],[0,-Math.PI/2,0]);
 for(let i=0;i<7;i++)plate('Removable PCI cover',1.35,.16,[-2.054,1.20+i*.19,.08],[[-.4,0,.22,.055],[0,0,.22,.055],[.4,0,.22,.055]],[0,-Math.PI/2,0]);
 for(const z of [-.95,.95]){box('Front intake side frame',[.15,4.15,.10],[2.04,2.4,z]);mesh('Front side air intake',.18,3.7,[2.035,2.45,z],[0,0,0]);}
 for(const y of [.36,4.43])box('Front cap',[.15,.15,1.9],[2.04,y,0]);
 const glass=new THREE.MeshPhysicalMaterial({color:'#9cacc0',transparent:true,opacity:.055,roughness:.16,metalness:.05,side:THREE.DoubleSide,depthWrite:false});
 const side=box('Tempered glass side panel',[3.97,4.06,.027],[0,2.41,1.017],glass);side.castShadow=false;side.renderOrder=10;
 const front=box('Tinted front window',[.025,3.91,1.79],[2.115,2.40,0],glass);front.castShadow=false;front.renderOrder=10;
 box('Front lower opaque fascia',[.045,.57,1.81],[2.12,.64,0]);
 text('COUGAR',.53,.15,[2.135,.66,0],'#acb3ba',[0,Math.PI/2,0]);
 for(const x of [-1.88,1.88])for(const y of [.5,4.3])cyl('Glass mounting screw',.04,.036,[x,y,1.045],silver);
 box('Top I/O strip',[.36,.06,1.88],[1.81,4.49,0]);for(const z of [.46,.16,-.14]){box('USB port housing',[.09,.02,.17],[1.81,4.529,z],silver);box('USB socket tongue',[.04,.023,.115],[1.81,4.539,z],black);}
 for(const z of [-.42,-.60])cyl('Audio jack',.034,.018,[1.81,4.536,z],black,pc,[0,0,0]);cyl('Power switch',.065,.016,[1.81,4.534,.73],silver,pc,[0,0,0]);
 plate('PSU shroud with wiring openings',3.95,1.80,[0,.99,.04],[[1.05,-.3,.55,.48]],[-Math.PI/2,0,0]);box('PSU shroud side',[3.95,.63,.035],[0,.66,.94]);
 mesh('Shroud ventilation',1.30,.76,[.13,1.011,-.19],[-Math.PI/2,0,0]);
 part='motherboard';
 const boardCanvas=document.createElement('canvas');boardCanvas.width=768;boardCanvas.height=1024;const bc=boardCanvas.getContext('2d');bc.fillStyle='#15201e';bc.fillRect(0,0,768,1024);bc.strokeStyle='#42514b';bc.lineWidth=1;
 for(let i=0;i<150;i++){const x=(i*97)%720,y=(i*163)%980;bc.beginPath();bc.moveTo(x,y);bc.lineTo(x+20,y);bc.lineTo(x+35,y+15);bc.lineTo(x+75,y+15);bc.stroke();}
 bc.fillStyle='#929e99';bc.font='9px monospace';for(let i=0;i<75;i++)bc.fillText('R'+(310+i),(i*113)%720,(i*67)%1000);
 const boardMap=new THREE.CanvasTexture(boardCanvas);boardMap.colorSpace=THREE.SRGBColorSpace;const boardMaterial=pcb.clone();boardMaterial.color.set('#ffffff');boardMaterial.map=boardMap;
 box('X470 PCB',[2.44,3.05,.06],[-.63,2.81,-.72],boardMaterial);
 // Fine board components use instancing rather than individual draw calls.
 batch('SMD capacitors',new THREE.BoxGeometry(.045,.025,.03),Array.from({length:110},(_,i)=>[-1.78+(i*37%113)/50,1.36+(i*29%137)/48,-.672]),silver);
 const lines=[];for(let i=0;i<22;i++)lines.push([-.6+(i%6)*.2,1.43+Math.floor(i/6)*.20,-.679]);batch('PCB signal traces',new THREE.BoxGeometry(.24,.007,.003),lines,gold);
 box('Rear I/O armor',[.40,2.02,.31],[-1.68,3.24,-.52]);box('VRM heatsink',[.80,.27,.24],[-.93,4.16,-.54]);
 for(let i=0;i<8;i++)box('VRM fin',[.05,.31,.25],[-1.29+i*.1,4.18,-.53]);
 box('Green I/O lighting',[.035,1.58,.025],[-1.443,3.34,-.345],green);text('GAMING PRO',1.1,.15,[-1.65,3.3,-.351],'#b9c3cd',[0,0,Math.PI/2]);text('CARBON',.72,.13,[-.93,4.18,-.405]);text('X470 GAMING PRO CARBON',1.42,.085,[-.60,2.16,-.676]);
 for(const x of [.04,.23,.42,.61])box('DIMM socket',[.075,1.43,.09],[x,3.45,-.63],black);
 box('AM4 CPU socket',[.63,.67,.06],[-.83,3.45,-.64],black);cyl('CMOS battery',.115,.04,[-1.34,1.65,-.65],silver);
 box('PCIe x16 slot',[1.75,.08,.13],[-.70,2.03,-.60],silver);for(const y of [1.57,1.35])box('PCIe expansion slot',[1.58,.07,.11],[-.76,y,-.61],black);
 const atx=port('Motherboard 24-pin',[.69,3.13,-.61],[.12,.45,.14]),eps=port('CPU EPS 8-pin',[-1.41,4.30,-.61]);
 const cpuFan=port('CPU_FAN header',[-.15,4.23,-.61]),sysFan=port('SYS_FAN header',[.62,1.46,-.61]);
 const sata=port('SATA data header',[.61,1.71,-.59],[.17,.24,.16]),fp=port('Front-panel header',[.30,1.30,-.62]),usb=port('USB front header',[.70,2.59,-.61]);
 part='cpu';box('Ryzen green CPU substrate',[.40,.40,.032],[-.83,3.45,-.582],pcb);box('Ryzen metal heat spreader',[.34,.34,.028],[-.83,3.45,-.552],silver);text('AMD RYZEN 5',.29,.075,[-.83,3.49,-.535]);text('2600',.18,.06,[-.83,3.39,-.535]);
 part='cooler';cyl('Aluminum cooler base',.41,.13,[-.83,3.45,-.44],silver);
 batch('Radial aluminum fins',new THREE.BoxGeometry(.033,.39,.22),Array.from({length:48},(_,i)=>{const a=i*Math.PI/24;return[-.83+Math.cos(a)*.27,3.45+Math.sin(a)*.27,-.27,a-Math.PI/2];}),silver);
 const cool=fan('AMD down-draft CPU fan',[-.83,3.45,-.07],.98,[0,0,0],false);text('AMD',.27,.09,[-.83,4.005,.008]);
 const coolPort=port('Cooler PWM lead',[-.63,3.90,-.12],[.09,.07,.07]);wire('CPU fan PWM',coolPort,cpuFan,[[-.63,3.90,-.12],[-.42,4.01,-.27],[-.23,4.31,-.37],[-.15,4.23,-.61]],.014);
 part='memory';for(const x of [.23,.61]){box('16GB DIMM green PCB',[.036,1.32,.22],[x,3.45,-.48],pcb);for(let i=0;i<8;i++)box('DDR4 memory chip',[.035,.11,.13],[x+.028,2.90+i*.15,-.46],black);box('DIMM gold contacts',[.03,1.23,.025],[x,3.45,-.604],gold);text('16GB DDR4',.60,.055,[x+.03,3.4,-.357],'#cccccc',[0,0,Math.PI/2]);}
 part='ssd1';box('Intel M.2 PCB',[.80,.22,.025],[-.79,2.36,-.629],pcb);box('Intel controller',[.15,.16,.018],[-1.05,2.36,-.605],black);box('Intel NAND package',[.27,.16,.018],[-.72,2.36,-.605],black);text('INTEL 256GB',.56,.09,[-.71,2.36,-.59]);cyl('M.2 mounting screw',.025,.012,[-.405,2.36,-.599],silver);
 part='gpu';box('MSI RTX backplate',[3.06,.045,1.04],[-.39,2.13,-.02]);box('Graphics PCB',[2.95,.027,.99],[-.39,2.085,-.03],pcb);box('PCIe gold edge',[1.62,.05,.10],[-.70,2.032,-.579],gold);
 batch('GPU aluminum fin stack',new THREE.BoxGeometry(.015,.38,.92),Array.from({length:72},(_,i)=>[-1.85+i*.041,1.87,.01]),silver);
 box('GPU fan shroud',[3.03,.045,1.07],[-.39,1.645,.015]);
 // Underside fan arrangement is approximate because it is hidden in the reference photograph.
 for(const x of [-1.40,-.40,.60])fan('Approximate MSI GPU fan',[x,1.60,.01],.85,[Math.PI/2,0,0],false);
 for(let i=0;i<3;i++)box('MSI RGB side light segment',[.59,.045,.034],[-1.39+i*.59,2.067,.532],glow[i]);
 box('GPU side logo rail',[2.08,.21,.033],[-.50,1.81,.529],steel);
 text('msi   GEFORCE RTX',2.04,.15,[-.5,1.85,.553]);text('GEFORCE RTX',.88,.22,[-1.34,2.16,-.13],'#eeeeee',[-Math.PI/2,0,0]);text('msi',.55,.24,[-.23,2.16,-.08],'#eeeeee',[-Math.PI/2,0,0]);
 for(let i=0;i<6;i++){const o=box('Backplate diagonal detail',[.028,.01,.46],[.54+i*.087,2.16,-.17],silver);o.rotation.y=-.5;}
 const gpuPower=port('GPU PCIe power connector',[.66,2.12,.70],[.17,.12,.14]);
 part='psu';box('MWE Bronze 550 PSU',[1.40,.71,1.50],[-1.27,.62,-.02],black);text('MWE BRONZE 550',1.18,.24,[-1.27,.60,.74]);text('COOLER MASTER',1.05,.12,[-1.27,.83,.74]);mesh('PSU rear exhaust',1.22,.52,[-2.045,.62,-.08],[0,-Math.PI/2,0]);box('AC mains socket',[.035,.20,.27],[-2.07,.60,.50],black);box('AC rocker switch',[.045,.12,.08],[-2.075,.63,.72],silver);
 const powerOut=port('Fixed PSU cable outlet',[-.54,.72,-.48],[.09,.22,.23]);
 part='hdd';box('WD10EZEX HDD metal chassis',[1.47,.26,1.016],[1.12,.59,-.03],silver);box('HDD lower controller PCB',[1.04,.017,.73],[1.20,.448,-.04],pcb);text('WD10EZEX  1TB',1.1,.40,[1.12,.727,-.03],'#101820',[-Math.PI/2,0,0]);for(const x of [.49,1.75])for(const z of [-.43,.37])cyl('HDD cover screw',.028,.01,[x,.725,z],black,pc,[0,0,0]);
 const hddData=port('HDD SATA data',[.365,.53,-.28],[.06,.08,.18]),hddPower=port('HDD SATA power',[.365,.53,.06],[.06,.08,.30]);
 part='case';for(const z of [-.59,.53])box('HDD drive cage rail',[1.7,.06,.055],[1.06,.39,z]);
 const frontIO=port('Top front I/O PCB',[1.81,4.43,.04],[.18,.035,1.2]);
 part='frontFans';fan('Upper RGB front intake',[1.87,3.56,.02],1.2,[0,-Math.PI/2,0]);fan('Lower RGB front intake',[1.87,2.18,.02],1.2,[0,-Math.PI/2,0]);
 const fanA=port('Upper fan cable connector',[1.85,3.04,-.51]),fanB=port('Lower fan cable connector',[1.85,1.65,-.51]);
 // Continuous point-to-point cable routes through the rear cable chamber.
 wire('24-pin motherboard power',powerOut,atx,[[-.54,.72,-.48],[-.33,.68,-.89],[.75,.79,-.91],[.75,3.15,-.91],[1.40,3.15,-.91],[1.40,3.15,-.60],[.97,3.15,-.38],[.69,3.13,-.61]],.067);
 wire('CPU EPS power',powerOut,eps,[[-.54,.64,-.56],[-.44,.55,-.56],[-.44,.48,-.91],[-1.72,.48,-.91],[-1.75,4.39,-.91],[-1.50,4.39,-.91],[-1.50,4.39,-.60],[-1.43,4.39,-.60],[-1.41,4.3,-.61]],.034);
 wire('GPU PCIe power',powerOut,gpuPower,[[-.54,.72,-.48],[.0,.82,-.55],[.22,.92,-.55],[1.02,.92,.30],[1.02,1.34,.30],[.66,1.43,.91],[.66,2.40,.91],[.66,2.40,.70],[.66,2.12,.70]],.052);
 wire('HDD SATA data',hddData,sata,[[.365,.53,-.28],[.23,.47,-.49],[1.19,.54,-.91],[1.19,1.93,-.90],[1.19,1.93,-.58],[1.09,1.65,-.58],[.61,1.71,-.59]],.017);
 wire('HDD SATA power',powerOut,hddPower,[[-.54,.72,-.48],[-.11,.49,-.41],[.12,.44,.06],[.365,.53,.06]],.035);
 for(const[a,y]of [[fanA,3.04],[fanB,1.65]])wire('Front fan power '+y,a,sysFan,[[1.85,y,-.51],[1.75,y-.15,-.86],[1.36,1.40,-.9],[.93,1.38,-.61],[.62,1.46,-.61]],.016);
 wire('Front USB cable',frontIO,usb,[[1.81,4.43,.04],[1.63,4.18,-.70],[1.57,2.51,-.65],[1.20,2.26,-.55],[.99,2.26,-.55],[.99,2.55,-.55],[.70,2.59,-.61]],.026);
 wire('Front power switch lead',frontIO,fp,[[1.81,4.43,.04],[1.61,4.21,-.71],[1.56,1.40,-.58],[.46,1.40,-.58],[.30,1.30,-.62]],.013);
 const light=new THREE.PointLight('#96baff',.8,3,2);light.position.set(1.35,3.5,.45);pc.add(light);
 refineTurretProducts({pc,rotors,links,box,cyl,text,batch,port,wire,setPart:id=>{part=id;},steel,black,silver,pcb,gold,rubber,glow});
 refineComponentFaces(pc, 2);
 batchStaticParts(pc,rotors);pc.updateMatrixWorld(true);
 return {pc,parts,specification:turretSpec,title:'COUGAR TURRET',subtitle:'Ryzen 5 2600 / RTX 3060 Ti',target:new THREE.Vector3(0,2.3,0),distance:12.6,views:{gpu:[.55,-.65,1],hdd:[.35,1,.60],memory:[.6,.15,1]},fanCounts:{front:2,rear:0,cpu:1,gpu:3},update(dt){rotors.forEach(r=>r.rotation.z-=dt*1.7);},connections(){pc.updateMatrixWorld(true);return links.map(l=>({name:l.name,from:l.from,to:l.to,start:l.start,end:l.end,startSeated:new THREE.Box3().setFromObject(l.a).expandByScalar(.005).containsPoint(new THREE.Vector3(...l.start)),endSeated:new THREE.Box3().setFromObject(l.b).expandByScalar(.005).containsPoint(new THREE.Vector3(...l.end))}));}};
}
