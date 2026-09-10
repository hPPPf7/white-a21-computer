import { refineComponentFaces } from './component-faces.js';
import { routedCurve } from './routing.js';
import { refineCase } from './case-details.js';
import { batchStaticParts } from './performance.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const hyperionParts = [
  {id:'cpu',category:'處理器',title:'AMD Ryzen 7 9800X3D',detail:'8 核心 / 16 執行緒 · AM5'},
  {id:'motherboard',category:'主機板',title:'MSI MEG X870E GODLIKE',detail:'DDR5 · E-ATX · Dynamic Dashboard'},
  {id:'memory',category:'記憶體',title:'G.SKILL Trident Z5 Royal Neo',detail:'銀色 · 48GB (24GB × 2) · DDR5-6000 CL28'},
  {id:'ssd1',category:'固態硬碟',title:'WD Black SN850X · 4TB',detail:'M.2 · PCIe NVMe 4.0 ×4'},
  {id:'gpu',category:'水冷顯示卡',title:'AORUS RTX 5090 D XTREME',detail:'WATERFORCE · 32GB GDDR7 · 360mm 冷排'},
  {id:'cooler',category:'CPU 水冷',title:'ROG RYUJIN III 360 ARGB Extreme',detail:'LCD 冷頭 · 獨立 360mm 冷排'},
  {id:'case',category:'機殼',title:'ROG Hyperion GR701',detail:'黑色 · 強化玻璃 · E-ATX'},
  {id:'psu',category:'電源供應器',title:'ROG Thor 1200W Platinum III',detail:'白金牌 · 全模組 · ATX 3.1 · Gen5'},
  {id:'strimer24',category:'主機板燈效線',title:'Lian Li Strimer Wireless 24P',detail:'24-pin 主機板供電延長線'},
  {id:'strimerGpu',category:'顯示卡燈效線',title:'Lian Li Strimer Wireless 12V-2×6',detail:'GPU 16-pin 供電延長線'},
  {id:'lcdPack',category:'LCD 風扇 · 三入',title:'UNI FAN TL LCD Wireless',detail:'120mm · 黑色 · 頂部 ×3 · LCD 為展示內容'},
  {id:'lcdSingle',category:'LCD 風扇 · 單顆',title:'UNI FAN TL LCD Wireless',detail:'120mm · 黑色 · 後方 ×1 · LCD 為展示內容'},
  {id:'ledPack',category:'LED 風扇 · 三入',title:'UNI FAN TL LED Wireless',detail:'120mm · 黑色 · 前方 ×3'},
];
export const hyperionSpec = Object.freeze({
  cpu:'AMD Ryzen 7 9800X3D',cores:8,threads:16,motherboard:'MSI MEG X870E GODLIKE',
  memory:'G.SKILL Trident Z5 Royal Neo Silver DDR5-6000 CL28 48GB (2 × 24GB)',
  storage:['WD Black SN850X 4TB M.2 PCIe 4.0 ×4'],
  gpu:'GIGABYTE AORUS GeForce RTX 5090 D XTREME WATERFORCE 32GB GDDR7',
  cooler:'ASUS ROG RYUJIN III 360 ARGB Extreme',case:'ASUS ROG Hyperion GR701 black',
  psu:'ASUS ROG Thor 1200W Platinum III ATX 3.1',
  strimer:['Lian Li Strimer Wireless ARGB 24P','Lian Li Strimer Wireless ARGB 12V-2×6'],
  fans:{lcd:4,led:3},
});

export function createHyperion(renderer) {
  const root=new THREE.Group();root.name='ROG Hyperion / Ryzen 9800X3D / RTX 5090 D';root.userData.specification=hyperionSpec;
  const rotors=[],links=[];let part='case';
  const textureCache=new Map();
  const textureScale=renderer.getPixelRatio() <= 1 ? 0.5 : 0.75;
  const dark=new THREE.MeshStandardMaterial({color:'#131820',metalness:.48,roughness:.33});
  const black=new THREE.MeshStandardMaterial({color:'#080d12',metalness:.13,roughness:.58});
  const gunmetal=new THREE.MeshStandardMaterial({color:'#3a414b',metalness:.8,roughness:.29});
  const silver=new THREE.MeshStandardMaterial({color:'#c4cbd4',metalness:.94,roughness:.18});
  const gold=new THREE.MeshStandardMaterial({color:'#a99154',metalness:.8,roughness:.36});
  const boardMat=new THREE.MeshStandardMaterial({color:'#121918',metalness:.17,roughness:.76});
  const rubber=new THREE.MeshStandardMaterial({color:'#171d24',roughness:.93});
  const cyan=new THREE.MeshStandardMaterial({color:'#a3f5ff',emissive:'#35c8ed',emissiveIntensity:2.3,roughness:.25});
  const violet=new THREE.MeshStandardMaterial({color:'#baa6ff',emissive:'#783cff',emissiveIntensity:2.2,roughness:.25});
  const pink=new THREE.MeshStandardMaterial({color:'#ffb6eb',emissive:'#ef56b5',emissiveIntensity:1.9,roughness:.25});
  const unit=new THREE.BoxGeometry(1,1,1);
  const add=(m,name,parent=root)=>{m.name=name;m.userData.partId=part;m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
  const box=(name,size,pos,mat=dark,r=.012,parent=root)=>{const m=new THREE.Mesh(r?new RoundedBoxGeometry(...size,2,r):unit,mat);if(!r)m.scale.set(...size);m.position.set(...pos);return add(m,name,parent);};
  function batch(name,size,poses,mat=gold) {
    const m=new THREE.InstancedMesh(new THREE.BoxGeometry(...size),mat,poses.length),o=new THREE.Object3D();
    poses.forEach((p,i)=>{o.position.set(...p);o.updateMatrix();m.setMatrixAt(i,o.matrix);});m.instanceMatrix.needsUpdate=true;m.computeBoundingSphere();return add(m,name);
  }
  function cyl(name,r,d,pos,mat=silver,parent=root){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,24),mat);m.rotation.x=Math.PI/2;m.position.set(...pos);return add(m,name,parent);}
  function ring(name,r,t,pos,mat=gunmetal,parent=root){const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,32),mat);m.position.set(...pos);return add(m,name,parent);}
  function beam(name,a,b,w,d,mat=gunmetal) {
    const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),m=box(name,[w,start.distanceTo(end),d],start.clone().add(end).multiplyScalar(.5).toArray(),mat,.02);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),end.sub(start).normalize());return m;
  }
  function tex(w,h,draw,key=null){
    if(key&&textureCache.has(key))return textureCache.get(key);
    const c=document.createElement('canvas');
    c.width=Math.max(64,Math.round(w*textureScale));
    c.height=Math.max(64,Math.round(h*textureScale));
    const ctx=c.getContext('2d');ctx.scale(c.width/w,c.height/h);draw(ctx,w,h);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
    if(key)textureCache.set(key,t);
    return t;
  }
  function decal(name,w,h,pos,map,rot=[0,0,0],parent=root) {
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false,toneMapped:false}));m.position.set(...pos);m.rotation.set(...rot);add(m,name,parent);m.castShadow=false;return m;
  }
  function text(name,w,h,pos,color='#a8b7c8',rot=[0,0,0],parent=root) {
    return decal(name,w,h,pos,tex(1024,256,c=>{c.fillStyle=color;c.textAlign='center';c.textBaseline='middle';c.font='600 82px Arial';c.fillText(name,512,128,990);},`text:${name}:${color}`),rot,parent);
  }
  function polygon(name,points,depth,pos,mat=dark,rotation=[0,0,0],holes=[]) {
    const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();
    holes.forEach(([x,y,w,h])=>{const p=new THREE.Path();p.moveTo(x-w/2,y-h/2);p.lineTo(x-w/2,y+h/2);p.lineTo(x+w/2,y+h/2);p.lineTo(x+w/2,y-h/2);p.closePath();s.holes.push(p);});
    const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelThickness:.005,bevelSize:.005,bevelSegments:1});g.translate(0,0,-depth/2);
    const m=new THREE.Mesh(g,mat);m.position.set(...pos);m.rotation.set(...rotation);return add(m,name);
  }
  function screw(pos,parent=root) {
    cyl('Torx case fastener',.024,.017,pos,gunmetal,parent);
    box('Recessed screw drive',[.023,.007,.004],[pos[0],pos[1],pos[2]+.01],black,.002,parent);
  }
  function tube(name,points,r=.053,mat=rubber) {
    const path=routedCurve(points, name.includes('coolant') ? .65 : .35);
    const m=new THREE.Mesh(new THREE.TubeGeometry(path,Math.max(36,points.length*6),r,8,false),mat);add(m,name);
    return path;
  }
  function fitting(name,pos,axis=[1,0,0]) {
    const m=cyl(name,.080,.14,pos,gunmetal);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...axis));
    return m;
  }
  function port(name,pos,size=[.20,.12,.12]){return box(name,size,pos,black,.012);}
  function link(name,from,to,points,r=.018,mat=rubber) {
    tube(name,points,r,mat);
    links.push({name,from:from.name,to:to.name,start:points[0],end:points.at(-1),fromMesh:from,toMesh:to});
  }
  function meshPanel(name,w,h,pos,rot=[0,0,0]) {
    const map=tex(64,64,c=>{c.fillStyle='white';c.fillRect(0,0,64,64);c.fillStyle='black';c.beginPath();c.arc(32,32,23,0,Math.PI*2);c.fill();});
    map.colorSpace=THREE.NoColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(w/.065,h/.065);
    const mat=new THREE.MeshStandardMaterial({color:'#313844',metalness:.65,roughness:.38,alphaMap:map,alphaTest:.5,side:THREE.DoubleSide});
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);m.position.set(...pos);m.rotation.set(...rot);return add(m,name);
  }
  function screen(name,w,h,pos,title,value,rot=[0,0,0],parent=root) {
    const map=tex(768,768,(c,W,H)=>{
      const bg=c.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#0c1729');bg.addColorStop(1,'#070a11');c.fillStyle=bg;c.fillRect(0,0,W,H);
      c.strokeStyle='#60dfff';c.lineWidth=9;c.beginPath();c.arc(384,350,242,.25,5.5);c.stroke();
      c.strokeStyle='#9670ff';c.beginPath();c.arc(384,350,218,2.4,5.7);c.stroke();
      c.textAlign='center';c.fillStyle='#dbefff';c.font='bold 113px Arial';c.fillText(value,384,380);c.font='33px Arial';c.fillText(title,384,465);
      c.fillStyle='#647b9c';c.font='23px monospace';c.fillText('DISPLAY DEMO',384,673);
    },`screen:${title}:${value}`);
    return decal(name,w,h,pos,map,rot,parent);
  }
  function fan(name,pos,rotation,id,lcd=false) {
    part=id;
    const group=new THREE.Group();group.position.set(...pos);group.rotation.set(...rotation);add(group,name);
    const size=1.20;
    for(const x of [-.55,.55])box('TL fan edge',[.10,size,.22],[x,0,0],dark,.018,group);
    for(const y of [-.55,.55])box('TL fan edge',[1.02,.10,.22],[0,y,0],dark,.018,group);
    for(const x of [-.595,.595])box('Infinity side light',[.018,1.07,.026],[x,0,.106],x<0?cyan:violet,.008,group);
    ring('TL machined intake rim',.516,.031,[0,0,.10],gunmetal,group);
    ring('TL ARGB diffuser',.479,.017,[0,0,.117],lcd?cyan:violet,group);
    const rotor=new THREE.Group();group.add(rotor);rotors.push(rotor);
    const shape=new THREE.Shape();shape.moveTo(.13,0);shape.bezierCurveTo(.30,-.08,.48,.0,.46,.17);shape.bezierCurveTo(.36,.26,.22,.16,.12,.08);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.019,bevelEnabled:false,curveSegments:12});
    const blades=new THREE.InstancedMesh(geometry,gunmetal,9),bladeTransform=new THREE.Object3D();
    for(let i=0;i<9;i++){
      bladeTransform.rotation.z=i*Math.PI*2/9;bladeTransform.updateMatrix();blades.setMatrixAt(i,bladeTransform.matrix);
    }
    blades.instanceMatrix.needsUpdate=true;
    blades.computeBoundingSphere();
    rotor.add(blades);
    cyl('TL motor hub',lcd?.18:.125,.19,[0,0,.04],black,group);
    if(lcd)screen('TL LCD display',.31,.31,[0,0,.144],'LIAN LI','38°',[0,0,0],group);
    else text('LIAN LI',.18,.05,[0,0,.14],'#c8d2dd',[0,0,0],group);
    for(const x of [-.52,.52])for(const y of [-.52,.52])screw([x,y,.12],group);
    return group;
  }
  function radiator(name,pos,rotation,id) {
    part=id;const g=new THREE.Group();g.position.set(...pos);g.rotation.set(...rotation);add(g,name);
    for(const x of [-1.88,1.88])box('Radiator end tank',[.17,.27,1.23],[x,0,0],dark,.025,g);
    for(const z of [-.59,.59])box('Radiator sidewall',[3.8,.27,.07],[0,0,z],gunmetal,.012,g);
    const fins=new THREE.InstancedMesh(new THREE.BoxGeometry(.018,.235,1.12),gunmetal,96),o=new THREE.Object3D();
    for(let i=0;i<96;i++){o.position.set(-1.77+i*.037,0,0);o.updateMatrix();fins.setMatrixAt(i,o.matrix);}g.add(fins);
    return g;
  }

  // GR701: a substantially larger, angular metal exoskeleton with a hinged glass door.
  part='case';
  box('Hyperion chassis base',[6.11,.15,2.60],[0,.40,0],dark,.03);
  box('Hyperion right steel panel',[6.1,5.55,.07],[0,3.2,-1.30],dark,.025);
  polygon('Rear motherboard tray with cable apertures',[[-2.85,-2.15],[2.7,-2.15],[2.7,2.55],[-2.85,2.55]],.035,[0,3.27,-1.08],black,[0,0,0],[[.9,.72,.47,.9],[-1.8,2.10,.58,.25],[1.60,-1.75,.58,.6]]);
  for(const x of [-3.0,3.0])for(const z of [-1.23,1.23])beam('Hyperion corner column',[x,.45,z],[x,5.97,z],.15,.15,gunmetal);
  for(const y of [.48,5.96])for(const z of [-1.23,1.23])beam('Exterior longitudinal rail',[-3.02,y,z],[3.02,y,z],.15,.15,gunmetal);
  for(const z of [-1.16,1.16]){
    beam('Cast aluminum carry handle',[-2.55,6.17,z],[2.43,6.17,z],.16,.21,gunmetal);
    beam('Rear raised handle support',[-2.95,5.94,z],[-2.55,6.17,z],.17,.22,gunmetal);
    beam('Front raised handle support',[2.43,6.17,z],[2.98,5.94,z],.17,.22,gunmetal);
  }
  for(const x of [-2.48,2.48])for(const z of [-1.01,1.01]){
    box('Hyperion elevated cast foot',[.62,.27,.42],[x,.20,z],gunmetal,.06);
    box('Anti vibration sole',[.57,.06,.37],[x,.052,z],rubber,.02);
  }
  meshPanel('Hyperion front ventilation',2.40,5.25,[3.08,3.22,0],[0,Math.PI/2,0]);
  meshPanel('Hyperion top dust filter',5.54,2.1,[0,6.04,0],[-Math.PI/2,0,0]);
  for(const s of [-1,1]){
    beam('Hyperion front angular exoframe',[3.20,.52,s*1.18],[3.25,2.88,s*.63],.18,.15,gunmetal);
    beam('Hyperion front angular exoframe',[3.25,2.88,s*.63],[3.20,5.99,s*1.18],.18,.15,gunmetal);
    beam('Front ARGB accent',[3.29,1.0,s*1.02],[3.30,2.71,s*.70],.017,.017,s<0?cyan:violet);
  }
  text('ROG',.55,.23,[3.34,3.14,0],'#c1d0df',[0,Math.PI/2,0]);
  box('Upper USB I/O panel',[.47,.09,2.04],[2.74,6.01,0],black,.03);
  for(const z of [.60,.28,-.04,-.36]){
    box('USB 3.2 front socket',[.12,.014,.18],[2.74,6.062,z],gunmetal,.01);
    box('USB blue tongue',[.027,.016,.13],[2.74,6.069,z],cyan,.003);
  }
  const power=cyl('Power button',.085,.016,[2.75,6.065,-.70],gunmetal);power.rotation.x=0;
  box('Rear panel',[.06,5.53,2.56],[-3.04,3.22,0],dark,.018);
  meshPanel('Rear fan grille',1.30,1.30,[-3.08,4.80,.10],[0,-Math.PI/2,0]);
  for(let i=0;i<8;i++)box('Rear PCI expansion cover',[.025,.17,1.62],[-3.09,1.56+i*.195,.05],gunmetal,.005);
  polygon('Power shroud with GPU power aperture',[[-2.9,-1.19],[2.9,-1.19],[2.9,1.19],[-2.9,1.19]],.055,[0,1.40,0],dark,[-Math.PI/2,0,0],[[1.65,-.48,.66,.54],[1.76,.98,.45,.26]]);
  polygon('Lower side panel OLED opening',[[-2.93,-.39],[2.93,-.39],[2.93,.53],[-2.93,.53]],.06,[0,.87,1.19],dark,[0,0,0],[[-2.0,0,.95,.32]]);
  text('H Y P E R I O N',1.63,.13,[.55,.81,1.225],'#6f839a');
  text('REPUBLIC OF GAMERS',1.25,.09,[.58,.65,1.225],'#46586d');
  polygon('Side multifunction light panel',[[-.74,-1.925],[.74,-1.925],[.74,1.925],[-.74,1.925]],.035,[1.64,3.42,-1.02],gunmetal,[0,0,0],[[.03,-1.81,.42,.20]]);
  const rogArt=tex(640,1600,(c,w,h)=>{
    c.strokeStyle='#7967d9';c.lineWidth=9;c.beginPath();c.moveTo(100,500);c.lineTo(550,340);c.lineTo(450,610);c.lineTo(210,700);c.lineTo(120,640);c.lineTo(470,470);c.stroke();
    c.fillStyle='#91b1df';c.font='bold 75px Arial';c.fillText('ROG',210,865);c.save();c.translate(335,1380);c.rotate(-Math.PI/2);c.font='30px Arial';c.fillText('REPUBLIC OF GAMERS',0,0);c.restore();
  });
  decal('ROG side lightboard',1.35,3.5,[1.64,3.44,-.995],rogArt);
  const glass=new THREE.MeshPhysicalMaterial({color:'#aec6e2',transparent:true,opacity:.055,metalness:.05,roughness:.12,clearcoat:1,side:THREE.DoubleSide,depthWrite:false});
  const door=box('Hinged tempered glass door',[5.91,5.42,.027],[-.025,3.23,1.327],glass,.01);door.castShadow=false;door.renderOrder=10;
  for(const y of [.63,5.82])box('Glass machined border',[5.94,.029,.035],[-.025,y,1.342],gunmetal,.007);
  for(const x of [-2.93,2.9])for(const y of [1.14,5.37])screw([x,y,1.36]);

  part='motherboard';
  const boardTex=tex(1536,1536,(c,w,h)=>{
    c.fillStyle='#101818';c.fillRect(0,0,w,h);c.strokeStyle='#46534e';c.lineWidth=1;
    for(let i=0;i<160;i++){const x=(i*137)%w,y=(i*239)%h;c.beginPath();c.moveTo(x,y);c.lineTo(x+55,y);c.lineTo(x+100,y+45);c.lineTo(x+160,y+45);c.stroke();}
    c.fillStyle='#8e9c97';c.font='17px monospace';for(let i=0;i<35;i++)c.fillText('R'+(250+i),50+(i%7)*210,80+Math.floor(i/7)*280);
  });
  const pcbMat=boardMat.clone();pcbMat.color.set('#ffffff');pcbMat.map=boardTex;
  box('MSI MEG X870E GODLIKE PCB',[2.77,3.05,.055],[-.98,3.77,-.985],pcbMat,.018);
  box('GODLIKE upper VRM armor',[1.67,.26,.21],[-1.03,5.12,-.825],gunmetal,.025);
  box('GODLIKE rear I/O armor',[.47,1.29,.30],[-2.08,4.57,-.76],dark,.035);
  text('MEG',.29,.17,[-2.08,4.92,-.603],'#d1bc84');
  text('GODLIKE',1.03,.17,[-1.02,5.13,-.71],'#d1bc84');
  box('GODLIKE lower chipset armor',[2.56,.75,.15],[-.98,2.68,-.86],dark,.04);
  text('MSI  /  X870E',1.03,.14,[-1.42,2.54,-.777],'#8798ad');
  box('Dynamic Dashboard bezel',[.86,.43,.15],[-.01,3.40,-.79],gunmetal,.025);
  screen('MSI Dynamic Dashboard display',.79,.36,[-.01,3.40,-.708],'GODLIKE','MEG');
  const smds=[],pins=[];for(let i=0;i<100;i++)smds.push([-2.24+(i%20)*.126,2.31+Math.floor(i/20)*.068,-.937]);
  batch('GODLIKE SMD population',[.032,.017,.011],smds,silver);
  for(let i=0;i<24;i++)box('VRM fin',[.018,.72,.08],[-2.28+i*.015,4.5,-.572],gunmetal,0);
  polygon('AM5 open socket retention frame',[[-.31,-.30],[.31,-.30],[.31,.30],[-.31,.30]],.027,[-1.15,4.32,-.88],silver,[0,0,0],[[0,0,.45,.45]]);
  box('AM5 socket body',[.52,.52,.05],[-1.15,4.32,-.928],black,.015);
  for(let y=0;y<25;y++)for(let x=0;x<25;x++)pins.push([-1.34+x*.016,4.13+y*.016,-.899]);
  batch('AM5 contact grid',[.008,.008,.012],pins,gold);
  for(const x of [-.23,-.03,.17,.37])for(const dx of [-.028,.028])box('DDR5 slot rail',[.012,1.38,.09],[x+dx,4.37,-.906],black,.004);
  box('PCIe 5.0 reinforced slot',[1.81,.11,.12],[-1.15,3.00,-.894],silver,.008);
  for(const x of [-2.26,.31])for(const y of [2.34,5.19])screw([x,y,-.949]);
  const atx=port('MSI 24-pin power header',[.36,4.39,-.84],[.12,.49,.23]);
  const eps=port('MSI CPU EPS input',[-1.83,5.23,-.83],[.32,.12,.20]);
  const cpuFan=port('CPU_FAN header',[-.42,5.23,-.85]);
  const aio=port('AIO_PUMP header',[-.64,5.23,-.85]);
  const rearHeader=port('SYS_FAN header',[-2.18,3.65,-.85]);
  const usb=port('Internal USB 2.0 header',[-1.88,2.28,-.84]);
  const argb=port('5V ARGB header',[.17,5.23,-.85]);

  part='cpu';
  box('Ryzen AM5 organic substrate',[.48,.48,.024],[-1.15,4.32,-.881],boardMat,.008);
  polygon('AMD Ryzen notched heat spreader',[[-.21,-.21],[-.07,-.21],[-.07,-.16],[.07,-.16],[.07,-.21],[.21,-.21],[.21,-.07],[.16,-.07],[.16,.07],[.21,.07],[.21,.21],[.07,.21],[.07,.16],[-.07,.16],[-.07,.21],[-.21,.21],[-.21,.07],[-.16,.07],[-.16,-.07],[-.21,-.07]],.044,[-1.15,4.32,-.851],silver);
  text('AMD RYZEN',.29,.075,[-1.15,4.42,-.825],'#45505c');
  text('7 9800X3D',.31,.075,[-1.15,4.32,-.825],'#45505c');
  text('8 CORE / 16 THREAD',.28,.05,[-1.15,4.23,-.825],'#586573');
  const lands=[];for(let y=0;y<31;y++)for(let x=0;x<31;x++)if(!(x>10&&x<20&&y>10&&y<20))lands.push([-1.367+x*.0144,4.103+y*.0144,-.896]);
  batch('AM5 processor gold lands',[.008,.008,.002],lands,gold);

  part='memory';
  for(const x of [-.03,.37]){
    box('Royal Neo DIMM PCB',[.023,1.34,.39],[x,4.37,-.705],black,.004);
    for(const dx of [-.030,.030])box('Mirror-finish Royal heatspreader',[.023,1.30,.31],[x+dx,4.37,-.657],silver,.009);
    for(let i=0;i<21;i++){
      const crystal=new THREE.Mesh(new THREE.OctahedronGeometry(.048+(i%3)*.005,0),i%3===0?pink:i%3===1?cyan:violet);
      crystal.position.set(x,3.76+i*.061,-.48);crystal.scale.set(.66,1,.70);crystal.rotation.y=i*.91;add(crystal,'Crystalline Royal light bar');
    }
    text('G.SKILL',.60,.13,[x+.044,4.45,-.65],'#59626b',[0,Math.PI/2,Math.PI/2]);
    text('TRIDENT Z5 ROYAL NEO',.90,.06,[x+.044,4.23,-.65],'#697584',[0,Math.PI/2,Math.PI/2]);
    const fingers=[];for(let i=0;i<69;i++)fingers.push([x+.014,3.75+i*.018,-.882]);
    batch('DDR5 module edge contacts',[.003,.011,.035],fingers,gold);
  }
  part='ssd1';
  box('SN850X 2280 PCB',[.80,.22,.022],[-1.14,3.58,-.90],boardMat,.006);
  for(const x of [-1.40,-1.18,-.94])box('WD NAND and controller',[.17,.17,.025],[x,3.58,-.874],black,.004);
  const wd=tex(1024,256,c=>{c.fillStyle='#10151c';c.fillRect(0,0,1024,256);c.fillStyle='white';c.font='bold 72px Arial';c.fillText('WD_BLACK',35,96);c.font='38px Arial';c.fillText('SN850X   NVMe SSD   4TB',35,160);c.fillStyle='#e77e37';c.fillRect(0,239,1024,17);});
  decal('WD SN850X label',.67,.18,[-1.20,3.58,-.859],wd);
  const ssdPins=[];for(let i=0;i<24;i++)if(i!==5)ssdPins.push([-.755,3.48+i*.008,-.884]);batch('WD M-key gold contacts',[.034,.005,.003],ssdPins,gold);

  part='psu';
  box('ROG Thor 1200W PSU body',[1.89,.84,1.67],[-2.10,.91,.01],dark,.055);
  const oled=box('Thor OLED display bezel',[1.03,.39,.027],[-2.0,.87,1.215],black,.018);
  const thor=tex(1024,384,c=>{c.fillStyle='#08101c';c.fillRect(0,0,1024,384);c.fillStyle='#b9efff';c.font='bold 97px Arial';c.fillText('ROG THOR',65,133);c.font='60px Arial';c.fillText('1200W  PLATINUM III',65,239);c.fillStyle='#7485a1';c.font='22px Arial';c.fillText('DISPLAY DEMO',65,314);});
  decal('Thor power display',.92,.31,[-2.0,.87,1.233],thor);
  const psuAtx=port('Thor motherboard modular connector',[-1.12,.74,-.42],[.18,.28,.41]);
  const psuGpu=port('Thor native 12V-2x6 output',[-1.12,.76,.39],[.18,.18,.26]);
  const psuEps=port('Thor CPU modular connector',[-1.12,1.00,-.14],[.18,.13,.24]);
  const psuAux=port('Thor SATA peripheral power',[-1.12,.50,.13],[.18,.12,.26]);
  text('ROG THOR',.98,.19,[-2.11,.83,.86],'#bac4d1');
  for(let i=0;i<8;i++){const r=ring('Thor fan guard',.16+i*.048,.008,[-2.12,.487,0],gunmetal);r.rotation.x=Math.PI/2;}
  box('Thor rear power inlet',[.08,.20,.28],[-3.08,.81,.18],black,.02);

  // Two independent AIO systems; no shared or disconnected hose ends.
  const topRad=radiator('RYUJIN 360 top radiator',[-.55,5.70,0],[0,0,0],'cooler');
  part='cooler';
  box('RYUJIN copper cold plate',[.48,.48,.085],[-1.15,4.32,-.794],gunmetal,.02);
  box('RYUJIN III LCD pump housing',[.86,.87,.47],[-1.15,4.32,-.515],dark,.065);
  box('RYUJIN LCD bezel',[.79,.79,.032],[-1.15,4.32,-.265],gunmetal,.035);
  screen('RYUJIN LCD',.72,.72,[-1.15,4.32,-.244],'RYZEN 9800X3D','ROG');
  const pumpPort=port('RYUJIN pump power lead',[-1.45,4.75,-.60],[.11,.07,.11]);
  for(let i=0;i<2;i++){
    const a=fitting('RYUJIN pump swivel',[-.68,4.12+i*.24,-.48]),b=fitting('RYUJIN radiator fitting',[1.36,5.70,-.29+i*.58]);
    link('CPU AIO coolant tube '+i,a,b,[[-.68,4.12+i*.24,-.48],[-.39,4.12+i*.24,-.48],[.60+i*.18,3.97+i*.20,.15+i*.23],[1.73+i*.15,4.27+i*.22,.21+i*.23],[1.82+i*.14,5.28,-.29+i*.58],[1.63,5.70,-.29+i*.58],[1.36,5.70,-.29+i*.58]],.061,rubber);
  }
  for(const x of [-1.79,-.55,.69])fan('Top TL LCD fan',[x,5.44,0],[Math.PI/2,0,0],'lcdPack',true);
  fan('Rear TL LCD exhaust',[-2.83,4.77,.18],[0,Math.PI/2,0],'lcdSingle',true);

  part='gpu';
  box('5090 D liquid-cooled PCB',[2.85,.040,1.30],[-.94,3.02,-.01],boardMat,.008);
  box('AORUS 5090 water block',[2.97,.33,1.24],[-.86,2.88,.12],dark,.035);
  polygon('AORUS sculpted top armor',[[-1.49,-.58],[1.34,-.58],[1.49,-.42],[1.49,.47],[1.35,.60],[-1.39,.60],[-1.49,.47]],.045,[-.86,3.071,.12],gunmetal,[-Math.PI/2,0,0]);
  box('AORUS side infinity mirror',[2.43,.23,.025],[-.89,2.90,.763],black,.02);
  box('AORUS cyan accent',[2.60,.018,.018],[-.88,3.037,.786],cyan,.008);
  box('AORUS violet accent',[1.71,.016,.018],[-.63,2.759,.786],violet,.008);
  text('AORUS',.69,.20,[-1.61,2.90,.787],'#a7bceb');
  text('GEFORCE RTX 5090 D',1.12,.095,[-.27,2.91,.79],'#cbd7e9');
  text('XTREME WATERFORCE',1.57,.21,[-.85,3.098,.12],'#a3afbc',[-Math.PI/2,0,0]);
  const gpuPlug=port('AORUS 12V-2x6 input',[.02,3.16,.51],[.29,.19,.20]);
  box('GPU rear I/O plate',[.025,.44,1.4],[-3.05,2.90,.12],gunmetal,.008);
  box('GPU rear retention connection',[.69,.06,.15],[-2.69,3.04,-.34],gunmetal,.01);
  for(const z of [-.40,-.1,.2,.5])box('DisplayPort HDMI socket',[.028,.085,.16],[-3.072,2.96,z],black,.006);
  const pciPins=[];for(let i=0;i<74;i++)pciPins.push([-2.14+i*.023,3.005,-.715]);batch('5090 PCIe gold contacts',[.012,.031,.23],pciPins,gold);
  radiator('WATERFORCE front 360 radiator',[2.53,3.66,0],[0,0,Math.PI/2],'gpu');
  part='gpu';
  for(let i=0;i<2;i++){
    const a=fitting('5090 coolant outlet',[.66,2.93,-.11+i*.40]),b=fitting('5090 radiator fitting',[2.53,5.59,-.25+i*.50],[0,1,0]);
    link('GPU AIO coolant tube '+i,a,b,[[.66,2.93,-.11+i*.40],[.93,2.93,-.11+i*.40],[1.70,3.13,.22+i*.19],[2.09,4.03,.34+i*.19],[2.17,5.70,-.25+i*.5],[2.53,5.80,-.25+i*.5],[2.53,5.59,-.25+i*.5]],.057,rubber);
  }
  for(const y of [2.42,3.66,4.90])fan('Front TL LED intake',[2.79,y,0],[0,Math.PI/2,0],'ledPack',false);

  part='strimer24';
  const strimerAtx=port('Strimer 24-pin latched plug',[.39,4.38,-.69],[.14,.48,.18]);
  for(let i=0;i<12;i++){
    const dy=(i-5.5)*.033;
    link('Strimer motherboard power conductor '+i,strimerAtx,psuAtx,[[.39,4.38+dy,-.69],[.60,4.38+dy,-.30],[.92,4.38+dy,-.25],[.85,4.24+dy,-.49],[.85,4.18+dy,-1.24],[.85,1.02+dy*.3,-1.24],[.42,.79,-.59],[-1.12,.74+dy*.35,-.42]],.016,rubber);
    tube('24P luminous guide '+i,[[.39,4.38+dy,-.58],[.60,4.38+dy,-.27],[.92,4.38+dy,-.22],[.85,4.24+dy,-.46],[.85,4.18+dy,-1.14]],.010,[cyan,violet,pink][Math.floor(i/4)]);
  }
  for(const x of [.64,.86])box('Strimer 24-pin comb',[.033,.43,.055],[x,4.38,-.252],dark,.009);
  part='strimerGpu';
  for(let i=0;i<12;i++){
    const dx=((i%6)-2.5)*.038,row=Math.floor(i/6);
    link('Strimer GPU power conductor '+i,gpuPlug,psuGpu,[[.02+dx,3.21,.50+row*.045],[.02+dx,3.58,.50+row*.045],[.44+dx,3.63,.87+row*.045],[1.08+dx,3.15,.99+row*.045],[1.60+dx,2.30,.70+row*.045],[1.66+dx,1.28,.44+row*.045],[1.66+dx,.89,.44+row*.045],[.28,.76+dx,.40],[-1.12,.76+dx*.35,.39]],.014,rubber);
    if(i<6)tube('12V-2x6 luminous guide '+i,[[.02+dx,3.28,.57],[.02+dx,3.60,.58],[.44+dx,3.66,.96],[1.08+dx,3.16,1.06],[1.60+dx,2.30,.78],[1.66+dx,1.40,.55]],.019,[cyan,violet,pink][i%3]);
  }
  for(const y of [1.5,1.95])box('GPU Strimer guide comb',[.32,.04,.13],[1.66,y,y===1.5?.55:.66],dark,.008);
  part='wiring';
  for(let i=0;i<8;i++){const dx=((i%4)-1.5)*.04;link('CPU EPS conductor '+i,eps,psuEps,[[-1.83+dx,5.23,-.83],[-1.83+dx,5.45,-.85],[-1.83+dx,5.43,-1.21],[-1.0+dx,1.0,-1.21],[-.65,.93,-.62],[-1.12,1.0,-.14+dx]],.013,rubber);}
  link('RYUJIN pump to AIO_PUMP',pumpPort,aio,[[-1.45,4.75,-.60],[-1.45,4.89,-.52],[-.64,4.89,-.52],[-.13,4.89,-.52],[-.13,5.20,-.70],[-.64,5.30,-.70],[-.64,5.30,-.85],[-.64,5.23,-.85]],.017);
  const controlHub=port('Wireless fan controller SATA power hub',[1.76,1.50,-.98],[.22,.16,.09]);
  link('Wireless controller power',controlHub,psuAux,[[1.76,1.5,-.98],[1.76,1.22,-.98],[1.76,.87,-1.19],[.10,.52,.06],[-1.12,.5,.13]],.022);
  const fanHarness=port('Top linked fan PWM port',[1.24,5.42,-.46],[.10,.10,.10]);
  link('Top radiator fan PWM',fanHarness,cpuFan,[[1.24,5.42,-.46],[1.24,5.51,-.79],[-.42,5.50,-.93],[-.42,5.23,-.85]],.020);
  const rearPort=port('Rear fan PWM port',[-2.72,4.20,-.33],[.10,.10,.1]);
  link('Rear exhaust PWM',rearPort,rearHeader,[[-2.72,4.2,-.33],[-2.67,3.87,-.62],[-2.18,3.65,-.85]],.018);
  const frontPort=port('Front fan bank power input',[2.79,1.87,-.45],[.10,.1,.1]);
  link('Front fan bank power',frontPort,controlHub,[[2.79,1.87,-.45],[2.83,1.70,-.74],[2.83,1.52,-.76],[2.17,1.52,-.94],[1.76,1.5,-.98]],.023);
  link('LCD control USB harness',fanHarness,usb,[[1.24,5.42,-.46],[1.33,5.54,-.9],[.85,5.54,-.94],[.85,4.15,-.94],[.85,4.15,-1.20],[1.60,1.61,-1.20],[1.60,1.61,-.94],[-1.88,1.83,-.89],[-1.88,2.28,-.84]],.018);
  link('ARGB sync harness',argb,controlHub,[[.17,5.23,-.85],[.65,5.28,-.91],[.85,4.15,-.91],[.85,4.15,-1.20],[1.63,1.60,-1.20],[1.76,1.60,-.98],[1.76,1.5,-.98]],.013);
  const io=port('Front panel I/O PCB',[2.74,5.96,0],[.32,.04,1.75]);
  const fp=port('Motherboard F_PANEL header',[.16,2.28,-.84],[.18,.10,.12]);
  link('Front I/O harness',io,fp,[[2.74,5.96,0],[2.98,5.84,-.85],[2.97,2.0,-.92],[1.91,1.53,-.98],[.16,1.80,-.86],[.16,2.28,-.84]],.025);
  // Geometry-only ornament lights. There are no additional physical case fans.
  for(const [pos,color] of [[[.9,4.6,.4],'#7169ff'],[[-1.6,4.1,.4],'#65dfff'],[[2.0,2.6,.5],'#a758ea']]){
    const light=new THREE.PointLight(color,1.25,3.5,2);light.position.set(...pos);root.add(light);
  }
  refineComponentFaces(root, 1);
  refineCase(root, true);
  batchStaticParts(root, rotors);
  root.updateMatrixWorld(true);
  return {
    pc:root,parts:hyperionParts,specification:hyperionSpec,
    title:'ROG HYPERION',subtitle:'9800X3D / RTX 5090 D',target:new THREE.Vector3(0,3.12,0),distance:17.7,
    update(dt){rotors.forEach((r,i)=>r.rotation.z-=dt*(1.1+i*.09));},
    connections(){root.updateMatrixWorld(true);return links.map(l=>({name:l.name,from:l.from,to:l.to,start:l.start,end:l.end,startSeated:new THREE.Box3().setFromObject(l.fromMesh).expandByScalar(.008).containsPoint(new THREE.Vector3(...l.start)),endSeated:new THREE.Box3().setFromObject(l.toMesh).expandByScalar(.008).containsPoint(new THREE.Vector3(...l.end))}));},
    fanCounts:{lcd:root.children.filter(o=>o.isGroup&&['lcdPack','lcdSingle'].includes(o.userData.partId)).length,led:root.children.filter(o=>o.isGroup&&o.userData.partId==='ledPack').length},
  };
}
