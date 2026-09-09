import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// All fine geometry stays in the original assembly coordinates. Shared instanced
// meshes keep hundreds of contacts, fins and SMD components inexpensive to draw.
export function refineHardware({pc,renderer}) {
  const unit=new THREE.BoxGeometry(1,1,1), transform=new THREE.Object3D();
  const textureScale=renderer.getPixelRatio() <= 1 ? 0.5 : 0.75;
  const metal=(color,metalness=.6,roughness=.38)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
  const silver=metal('#adb6bb',.87,.29), white=metal('#e6e8e4',.32,.34);
  const dark=metal('#151b1e',.12,.67), solder=metal('#a1a8ac',.78,.32);
  const gold=metal('#ba984c',.83,.29), green=metal('#174d3f',.12,.69);
  const copper=metal('#a66c42',.78,.3), grey=metal('#485257',.52,.42);
  const powder=metal('#e5e7e4',.15,.58);
  const materials={silver,white,dark,solder,gold,green,copper,grey,powder};
  let part='cpu';
  function add(mesh,name){mesh.name=name;mesh.userData.partId=part;mesh.castShadow=true;mesh.receiveShadow=true;pc.add(mesh);return mesh;}
  function box(name,size,pos,material=dark,round=0){const m=new THREE.Mesh(round?new RoundedBoxGeometry(...size,2,round):unit,material);if(!round)m.scale.set(...size);m.position.set(...pos);return add(m,name);}
  function batch(name,size,positions,material=gold){
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(...size),material,positions.length);
    positions.forEach((p,i)=>{transform.position.set(...p);transform.rotation.set(0,0,0);transform.scale.set(1,1,1);transform.updateMatrix();mesh.setMatrixAt(i,transform.matrix);});
    mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();return add(mesh,name);
  }
  function cylinder(name,radius,depth,pos,material=silver,rotation=[Math.PI/2,0,0]){
    const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,depth,24),material);m.position.set(...pos);m.rotation.set(...rotation);return add(m,name);
  }
  function torus(name,r,t,pos,material=silver,rotation=[0,0,0]){
    const m=new THREE.Mesh(new THREE.TorusGeometry(r,t,6,32),material);m.position.set(...pos);m.rotation.set(...rotation);return add(m,name);
  }
  function texture(w,h,draw){
    const c=document.createElement('canvas');
    c.width=Math.max(64,Math.round(w*textureScale));
    c.height=Math.max(64,Math.round(h*textureScale));
    const ctx=c.getContext('2d');ctx.scale(c.width/w,c.height/h);draw(ctx,w,h);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;
  }
  function decal(name,w,h,pos,map,rotation=[0,0,0]){
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map,transparent:true,toneMapped:false,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}));
    mesh.position.set(...pos);mesh.rotation.set(...rotation);add(mesh,name);mesh.castShadow=false;return mesh;
  }
  function polygon(name,points,depth,pos,material,rotation=[0,0,0],holes=[]){
    const shape=new THREE.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    for(const hole of holes){const path=new THREE.Path();if(hole.circle)path.absarc(hole.x,hole.y,hole.r,0,Math.PI*2,true);else {const {x,y,w,h}=hole;path.moveTo(x-w/2,y-h/2);path.lineTo(x-w/2,y+h/2);path.lineTo(x+w/2,y+h/2);path.lineTo(x+w/2,y-h/2);path.closePath();}shape.holes.push(path);}
    const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelSize:.003,bevelThickness:.002,bevelSegments:1,curveSegments:24});g.translate(0,0,-depth/2);
    const mesh=new THREE.Mesh(g,material);mesh.position.set(...pos);mesh.rotation.set(...rotation);return add(mesh,name);
  }
  function screw(pos,rotation=[0,0,0],radius=.019){
    const g=new THREE.Group();g.position.set(...pos);g.rotation.set(...rotation);g.userData.partId=part;pc.add(g);
    const head=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,.009,16),silver);head.rotation.x=Math.PI/2;g.add(head);
    for(const angle of [0,Math.PI/2]){const slot=new THREE.Mesh(new THREE.BoxGeometry(radius*1.2,.003,.001),dark);slot.position.z=.0055;slot.rotation.z=angle;g.add(slot);}
  }
  function removeWhere(predicate){const targets=[];pc.traverse(o=>{if(predicate(o))targets.push(o);});targets.forEach(o=>o.removeFromParent());}
  function traceTexture(color='#171d1b'){
    return texture(2048,2048,(ctx,w,h)=>{
      ctx.fillStyle=color;ctx.fillRect(0,0,w,h);
      let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
      for(let i=0;i<380;i++){
        const x=random()*w,y=random()*h,len=20+random()*230;
        ctx.strokeStyle=i%3?'#455348':'#646b4b';ctx.globalAlpha=.45;ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+len*.45,y);ctx.lineTo(x+len*.7,y+len*.25);ctx.lineTo(x+len,y+len*.25);ctx.stroke();
        ctx.fillStyle='#bcc29d';ctx.beginPath();ctx.arc(x,y,2.3,0,7);ctx.fill();
      }
      ctx.globalAlpha=1;ctx.strokeStyle='#94a499';ctx.lineWidth=2;
      for(let i=0;i<24;i++){const x=80+(i%6)*330,y=150+Math.floor(i/6)*450;ctx.strokeRect(x,y,80,45);}
      ctx.fillStyle='#afbbb2';ctx.font='20px monospace';
      for(let i=0;i<42;i++)ctx.fillText(['R','C','U','Q'][i%4]+(112+i*13),60+(i%7)*290,130+Math.floor(i/7)*322);
      ctx.font='bold 42px Arial';ctx.fillText('TUF GAMING B760M-PLUS WIFI',150,1730);
      ctx.font='26px Arial';ctx.fillText('ASUS    Intel B760    PCIe 5.0    DDR5',150,1800);
      ctx.font='21px monospace';ctx.fillText('M.2_1  PCIe 4.0 x4',600,1310);ctx.fillText('PCIEX16(G5)',540,1510);
    });
  }
  // Fine, directional machining roughness shared by metal parts.
  const grain=texture(256,256,(c,w,h)=>{c.fillStyle='#aaa';c.fillRect(0,0,w,h);for(let i=0;i<256;i++){const v=165+(i*17)%8;c.strokeStyle=`rgb(${v},${v},${v})`;c.beginPath();c.moveTo(0,i);c.lineTo(w,i);c.stroke();}});
  grain.colorSpace=THREE.NoColorSpace;grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(2,5);
  silver.roughnessMap=grain;

  // LGA1700 package: green laminate, notched IHS, laser marking, underside lands.
  removeWhere(o=>o.parent===pc&&o.userData.partId==='cpu');
  part='cpu';
  box('LGA1700 fiberglass package',[.455,.525,.022],[-.72,3.18,-.624],green,.008);
  polygon('Nickel plated stepped integrated heat spreader',[
    [-.18,-.233],[.18,-.233],[.18,-.155],[.204,-.155],[.204,-.08],[.18,-.08],
    [.18,.08],[.204,.08],[.204,.155],[.18,.155],[.18,.233],[-.18,.233],
    [-.18,.155],[-.204,.155],[-.204,.08],[-.18,.08],[-.18,-.08],[-.204,-.08],[-.204,-.155],[-.18,-.155],
  ],.046,[-.72,3.18,-.588],silver);
  const cpuMark=texture(1024,1024,c=>{
    c.fillStyle='#4f5b5b';c.font='bold 110px Arial';c.fillText('intel',145,240);
    c.font='64px Arial';c.fillText('CORE™ i5',145,340);c.font='bold 91px Arial';c.fillText('i5-13500',145,490);
    c.font='34px monospace';c.fillText('LGA1700   13th GEN',145,600);c.fillText('14 CORES / 20 THREADS',145,659);
    // Decorative manufacturing matrix, deliberately not a real serial number.
    for(let y=0;y<13;y++)for(let x=0;x<13;x++)if((x*7+y*11+x*y)%5<3)c.fillRect(150+x*9,730+y*9,7,7);
    c.font='27px monospace';c.fillText('INTEL CORE PROCESSOR',330,790);
  });
  decal('CPU laser-etched identification',.345,.415,[-.72,3.18,-.563],cpuMark);
  const lands=[];
  for(let y=0;y<42;y++)for(let x=0;x<40;x++)if(!(x>13&&x<26&&y>14&&y<27))lands.push([-.927+x*.0106,2.947+y*.01135,-.637]);
  batch('LGA gold contact array',[.0068,.0076,.003],lands,gold);
  const smds=[];for(let y=0;y<7;y++)for(let x=0;x<6;x++)smds.push([-.774+x*.0205,3.116+y*.019,-.640]);
  batch('CPU underside decoupling capacitors',[.012,.009,.005],smds,solder);
  polygon('CPU orientation triangle',[[0,0],[.026,0],[0,.026]],.002,[-.94,2.925,-.61],gold);

  // Motherboard laminate, socket, component populations and connector cavities.
  part='motherboard';
  const board=pc.getObjectByName('TUF GAMING B760M-PLUS WIFI PCB');
  const boardMaterial=metal('#ffffff',.12,.78);boardMaterial.map=traceTexture();board.material=boardMaterial;
  pc.traverse(o=>{if(o.name==='VRM fin')o.material=grey;});
  polygon('TUF angled I/O armor face',[[-.22,-.55],[.08,-.55],[.22,-.40],[.22,.55],[-.22,.55]],.028,[-1.66,3.31,-.388],grey);
  const tufPrint=texture(512,1536,c=>{
    c.strokeStyle='#8b9a9e';c.lineWidth=12;for(let i=0;i<5;i++){c.beginPath();c.moveTo(0,150+i*90);c.lineTo(510,430+i*90);c.stroke();}
    c.save();c.translate(175,1220);c.rotate(-Math.PI/2);c.fillStyle='#c4ccce';c.font='bold 91px Arial';c.fillText('TUF GAMING',0,0);c.restore();
  });
  decal('TUF armor graphics',.38,1.04,[-1.66,3.31,-.37],tufPrint);
  removeWhere(o=>['Copper PCB signal trace','Surface-mount component','DIMM slot','LGA1700 retention bracket'].includes(o.name));
  polygon('LGA1700 open retention frame',[[-.32,-.39],[.32,-.39],[.32,.39],[-.32,.39]],.025,[-.72,3.18,-.640],silver,[0,0,0],[{x:0,y:0,w:.472,h:.548}]);
  box('CPU socket black molded body',[.57,.69,.033],[-.72,3.18,-.674],dark,.012);
  box('CPU socket contact carrier',[.47,.55,.022],[-.72,3.18,-.647],dark,.004);
  const socketPins=[];for(let y=0;y<31;y++)for(let x=0;x<28;x++)socketPins.push([-.925+x*.0152,2.94+y*.016,-.634]);
  batch('LGA socket spring contacts',[.008,.009,.006],socketPins,gold);
  box('Socket retention lever',[.014,.70,.014],[-.38,3.18,-.609],silver,.005);
  cylinder('Retention hinge',.025,.47,[-.72,3.56,-.638],silver,[0,0,Math.PI/2]);
  for(const y of [2.85,3.5])screw([-.41,y,-.60],undefined,.023);
  const caps=[],resistors=[],ends=[];
  for(let i=0;i<130;i++){
    const x=-1.72+(i%22)*.103,y=1.62+Math.floor(i/22)*.103;
    if(x>-.12&&y>1.75)continue;
    resistors.push([x,y,-.683]);ends.push([x-.017,y,-.68],[x+.017,y,-.68]);
  }
  for(let i=0;i<36;i++)caps.push([-1.35+(i%12)*.115,3.57+Math.floor(i/12)*.058,-.666]);
  batch('Motherboard SMD resistor bodies',[.034,.019,.012],resistors,dark);
  batch('Motherboard soldered SMD terminals',[.009,.02,.014],ends,solder);
  batch('VRM ceramic capacitors',[.04,.018,.023],caps,grey);
  for(let i=0;i<8;i++){
    box('VRM molded power inductor',[.10,.10,.073],[-1.23+i*.145,3.69,-.63],grey,.008);
  }
  cylinder('CR2032 holder',.135,.035,[-1.40,1.96,-.638],dark);
  cylinder('CR2032 lithium coin cell',.118,.018,[-1.40,1.96,-.611],silver);
  const battery=texture(512,512,c=>{c.fillStyle='#5d6668';c.textAlign='center';c.font='60px Arial';c.fillText('+',256,150);c.font='44px Arial';c.fillText('CR2032',256,260);c.font='32px Arial';c.fillText('3V LITHIUM',256,325);});
  decal('Battery engraving',.20,.20,[-1.40,1.96,-.60],battery);
  for(let i=0;i<4;i++){
    const x=.06+i*.15;
    for(const dx of [-.028,.028])box('DDR5 slot wall',[.012,1.32,.085],[x+dx,3.22,-.626],dark,.003);
    box('DIMM keyed slot floor',[.054,1.32,.018],[x,3.22,-.664],grey);
    box('DDR5 slot notch',[.055,.025,.070],[x,3.10,-.626],dark);
    const pins=[];for(let j=0;j<65;j++)for(const dx of [-.016,.016])pins.push([x+dx,2.61+j*.0188,-.596]);
    batch('DDR5 connector contact pins',[.007,.008,.025],pins,gold);
  }
  for(const y of [2.46,1.91])box('M.2 edge connector',[.085,.235,.065],[-.20,y,-.65],dark,.006);
  for(let i=0;i<4;i++){
    box('SATA right-angle port',[.17,.12,.15],[.46,1.79+i*.14,-.605],dark,.008);
    box('SATA port cavity',[.011,.065,.092],[.550,1.79+i*.14,-.603],grey);
  }

  // SSDs now have thin PCBs, M-key gold fingers, NAND packages and printed labels.
  for(const [id,y,title,brand] of [['ssd1',2.46,'M1500  1TB','UMAX'],['ssd2',1.91,'CRAS C710  1TB','KLEVV']]){
    removeWhere(o=>o.parent===pc&&o.userData.partId===id);part=id;
    polygon('M.2 2280 PCB',[[-.40,-.11],[.4,-.11],[.4,-.072],[.37,-.072],[.37,-.057],[.4,-.057],[.4,.11],[-.4,.11]],.016,[-.63,y,-.651],id==='ssd1'?dark:green,[0,0,0],[{circle:true,x:-.375,y:0,r:.024}]);
    const contacts=[];for(let i=0;i<24;i++)if(i!==4&&i!==5)contacts.push([-.251,y-.098+i*.0084,-.64]);
    batch('M-key connector gold fingers',[.042,.005,.003],contacts,gold);
    for(const x of [-.83,-.59])box('NAND flash package',[.20,.166,.025],[x,y,-.63],dark,.006);
    box('SSD controller package',[.119,.13,.025],[-.39,y,-.63],grey,.003);
    const smd=[];for(let i=0;i<14;i++)smd.push([-.965+i*.046,y-.094,-.63]);
    batch('SSD surface-mount capacitors',[.022,.011,.009],smd,solder);
    const sticker=texture(1536,384,(c,w,h)=>{
      c.fillStyle=id==='ssd1'?'#292d31':'#172727';c.fillRect(0,0,w,h);
      c.fillStyle='#f0f0e8';c.font='bold 106px Arial';c.fillText(brand,48,130);c.font='62px Arial';c.fillText(title,48,230);
      c.fillStyle='#a7b9b8';c.font='33px monospace';c.fillText('NVMe M.2 2280   PCIe '+(id==='ssd1'?'4.0':'3.0'),48,298);
      c.fillStyle='#fff';for(let i=0;i<60;i++)if(i%3!==1)c.fillRect(880+i*8,58,(i%4)+2,123);
      c.font='28px monospace';c.fillText('CE   RoHS   1TB',895,243);
      c.fillStyle=id==='ssd1'?'#7687ab':'#8aca48';c.fillRect(0,h-16,w,16);
    });
    decal('SSD product label',.465,.163,[-.721,y,-.615],sticker);
    screw([-1.006,y,-.625],undefined,.022);
  }

  // White XPG heat spreaders on a real thin DIMM PCB. Face graphics read correctly
  // when the module is orbited, instead of existing only on its narrow top edge.
  removeWhere(o=>o.parent===pc&&o.userData.partId==='memory');part='memory';
  const ramPrint=texture(512,2048,(c,w,h)=>{
    c.fillStyle='#edf0ed';c.fillRect(0,0,w,h);
    c.fillStyle='#c4cdcc';c.beginPath();c.moveTo(0,0);c.lineTo(330,0);c.lineTo(130,h);c.lineTo(0,h);c.fill();
    c.strokeStyle='#91a2a5';c.lineWidth=6;for(let i=0;i<5;i++){c.beginPath();c.moveTo(90+i*35,0);c.lineTo(0,750+i*130);c.stroke();}
    c.save();c.translate(320,950);c.rotate(-Math.PI/2);c.fillStyle='#536870';c.font='bold 170px Arial';c.fillText('XPG',-270,0);c.font='50px Arial';c.fillText('LANCER  DDR5',-280,94);c.restore();
    c.fillStyle='#72858b';c.font='35px monospace';c.save();c.translate(340,1790);c.rotate(-Math.PI/2);c.fillText('16GB  5600  CL36',0,0);c.restore();
  });
  for(const x of [.20,.50]){
    box('DDR5 module black PCB',[.021,1.32,.365],[x,3.22,-.462],dark,.003);
    for(const side of [-1,1]){
      box('XPG white aluminum heat spreader',[.018,1.285,.30],[x+side*.026,3.22,-.424],white,.008);
      decal('XPG Lancer side artwork',.285,1.26,[x+side*.037,3.22,-.424],ramPrint,[0,side*Math.PI/2,0]);
      const contacts=[];for(let j=0;j<69;j++)if(j!==27&&j!==28)contacts.push([x+side*.012,2.595+j*.0182,-.623]);
      batch('DDR5 gold edge contacts',[.002,.010,.035],contacts,gold);
    }
    box('White top spine',[.069,1.24,.025],[x,3.22,-.261],powder,.01);
    for(const y of [2.56,3.88])box('DIMM seated locking clip',[.09,.07,.13],[x,y,-.56],white,.009);
  }

  // Replace the GPU's solid slabs with real fins, perforated metal and a shared
  // sculpted fan surround. Existing fan rotors and all power connections remain.
  part='gpu';
  const gpuPcb=pc.getObjectByName('GPU PCB seated into PCIe slot');gpuPcb.scale.x=2.2;gpuPcb.position.x=-.94;
  removeWhere(o=>['RTX 4070 SUPER heatsink','GPU heatsink fin gap','AERO white upper backplate','AERO bottom fan shroud','GPU backplate flow-through slot','GPU rear mounting bracket'].includes(o.name)||(o.name==='Fan frame edge'&&o.parent?.name==='WINDFORCE GPU fan'));
  const fins=[];for(let i=0;i<100;i++)fins.push([-1.98+i*.0289,2.10,.04]);
  batch('Individual aluminum GPU cooling fins',[.012,.32,1.04],fins,silver);
  // Bent heat pipes return into the two fin stacks.
  for(let i=0;i<5;i++){
    const z=-.34+i*.18;
    const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.78,2.10,z),new THREE.Vector3(-1.93,2.05,z),new THREE.Vector3(-1.93,1.98,z),new THREE.Vector3(-1.55,1.975,z),new THREE.Vector3(.64,1.975,z),new THREE.Vector3(.85,2.08,z)]);
    add(new THREE.Mesh(new THREE.TubeGeometry(curve,42,.023,8,false),silver),'Nickel plated GPU heatpipe');
  }
  const outline=[[-1.50,-.50],[-1.44,-.57],[1.42,-.57],[1.50,-.49],[1.50,.49],[1.42,.57],[-1.43,.57],[-1.50,.50]];
  const vents=[];for(let i=0;i<11;i++)vents.push({x:.77+i*.052,y:0,w:.026,h:.78});
  polygon('AERO angular metal backplate',outline,.033,[-.54,2.341,.04],white,[-Math.PI/2,0,0],vents);
  polygon('Single triple-fan AERO shroud',outline,.049,[-.54,1.787,.04],white,[Math.PI/2,0,0],[-.97,.01,.99].map(x=>({circle:true,x,y:0,r:.426})));
  for(const z of [-.52,.60])box('AERO sculpted shroud sidewall',[2.98,.19,.055],[-.54,1.861,z],white,.018);
  for(const x of [-1.51,-.53,.45]){
    torus('GPU intake chamfer',.427,.014,[x,1.756,.04],silver,[Math.PI/2,0,0]);
    const hub=texture(512,512,c=>{c.fillStyle='#cbd3d6';c.beginPath();c.arc(256,256,250,0,7);c.fill();c.fillStyle='#647981';c.textAlign='center';c.font='64px Arial';c.fillText('AERO',256,276);});
    decal('AERO fan hub logo',.14,.14,[x,1.755,.045],hub,[Math.PI/2,0,0]);
  }
  const backArtwork=texture(2048,768,c=>{
    c.strokeStyle='#bac6c9';c.lineWidth=3;
    for(let i=0;i<6;i++){c.beginPath();c.moveTo(80,220+i*45);c.lineTo(870,70+i*45);c.lineTo(1240,370+i*45);c.stroke();}
    c.fillStyle='#7b919b';c.font='italic 160px Arial';c.fillText('AERO',320,470);c.font='32px Arial';c.fillText('GEFORCE RTX 4070 SUPER',340,545);
  });
  // Replace old decals that would float above the thinner reconstructed backplate.
  removeWhere(o=>o.name==='AERO'&&o.parent?.name?.includes('RTX 4070')&&o.rotation.x!==0);
  decal('AERO backplate technical graphics',1.9,.87,[-.94,2.362,.04],backArtwork,[-Math.PI/2,0,0]);
  for(const x of [-1.86,-1.18,-.44,.71])for(const z of [-.40,.47])screw([x,2.365,z],[-Math.PI/2,0,0],.022);
  box('GPU rear steel I/O bracket',[.025,.43,1.12],[-2.285,2.125,.035],silver,.006);
  for(const z of [-.39,-.12,.15,.42]){
    box('GPU video output housing',[.24,.13,.19],[-2.15,2.18,z],silver,.01);
    box('HDMI DisplayPort dark cavity',[.014,.077,.13],[-2.303,2.18,z],dark,.006);
  }
  const rearSlots=[];for(let i=0;i<15;i++)rearSlots.push([-2.302,1.99,-.47+i*.07]);
  batch('GPU I/O ventilation apertures',[.003,.048,.025],rearSlots,dark);
  for(const name of ['Graphics card support','GPU support foot'])pc.getObjectByName(name).userData.partId='case';

  // Radiator end tanks surround a genuinely open fin stack; underside fan braces
  // and screw seats have physical thickness.
  part='cooler';removeWhere(o=>o.name==='NANOCOOL PRO 240 radiator');
  for(const x of [-1.66,.92])box('Radiator sealed end tank',[.17,.27,1.20],[x,4.25,.05],powder,.02);
  for(const x of [-1.52,.79])for(const z of [-.5,.6])screw([x,4.397,z],[-Math.PI/2,0,0],.025);
  part='case';
  // Stamped fan support struts are visible through the blades from either side.
  const fanGroups=[];pc.traverse(o=>{if(o.isGroup&&/120mm|WINDFORCE/.test(o.name))fanGroups.push(o);});
  for(const fan of fanGroups){
    const r=fan.name.includes('WINDFORCE')?.94:1.2;
    for(let i=0;i<4;i++){
      const brace=new THREE.Mesh(new THREE.BoxGeometry(r*.36,r*.035,r*.028),grey);brace.position.set(Math.cos(i*Math.PI/2)*r*.26,Math.sin(i*Math.PI/2)*r*.26,-r*.08);brace.rotation.z=i*Math.PI/2;fan.add(brace);
    }
    const shaped=new Set();fan.traverse(o=>{
      if(o.geometry?.type!=='ExtrudeGeometry'||shaped.has(o.geometry))return;
      shaped.add(o.geometry);const p=o.geometry.attributes.position;
      for(let i=0;i<p.count;i++)p.setZ(i,p.getZ(i)+.045*(p.getX(i)/.42)*(p.getY(i)/.22));
      p.needsUpdate=true;o.geometry.computeVertexNormals();
      o.geometry.computeBoundingBox();o.geometry.computeBoundingSphere();
      if(o.isInstancedMesh){o.computeBoundingBox();o.computeBoundingSphere();}
    });
  }

  // PSU underside grille and fan, side specification label and modular sockets.
  part='psu';
  const psuBody=pc.getObjectByName('Seasonic FOCUS GX-850 white PSU');psuBody.scale.x=1.51/1.4;psuBody.position.x-=.055;
  cylinder('PSU fan opening',.52,.012,[-1.51,.319,-.10],dark,[0,0,0]);
  for(let i=0;i<8;i++)torus('PSU concentric fan guard',.14+i*.05,.008,[-1.51,.307,-.10],silver,[Math.PI/2,0,0]);
  for(const angle of [0,Math.PI/2]){
    const cross=box('PSU grille support',[1.07,.012,.014],[-1.51,.296,-.10],silver);cross.rotation.y=angle;
  }
  for(const x of [-2.09,-.96])for(const z of [-.66,.45])screw([x,.311,z],[Math.PI/2,0,0],.025);
  const psuSticker=texture(1536,768,c=>{
    c.fillStyle='#eceeed';c.fillRect(0,0,1536,768);c.fillStyle='#263537';c.fillRect(0,0,1536,180);
    c.fillStyle='#fff';c.font='bold 100px Arial';c.fillText('Seasonic',60,128);c.font='bold 90px Arial';c.fillText('FOCUS GX',750,125);
    c.fillStyle='#35474b';c.font='bold 84px Arial';c.fillText('850W',70,305);c.font='38px Arial';c.fillText('ATX 3.0   /   FULL MODULAR',540,280);
    c.strokeStyle='#a1abad';c.lineWidth=2;for(let i=0;i<5;i++){c.beginPath();c.moveTo(65,370+i*56);c.lineTo(1470,370+i*56);c.stroke();}
    c.font='32px monospace';c.fillText('AC INPUT       100–240V~       50–60Hz',75,412);c.fillText('DC OUTPUT     +3.3V   +5V   +12V   -12V   +5Vsb',75,468);c.fillText('TOTAL POWER                      850 W',75,524);
    c.font='36px Arial';c.fillText('80 PLUS GOLD     CE     RoHS',75,696);
  });
  removeWhere(o=>o.name==='Seasonic · FOCUS GX-850');
  decal('Seasonic power supply specification sticker',1.20,.57,[-1.53,.68,.638],psuSticker);
  const ports=[];for(let row=0;row<2;row++)for(let j=0;j<12;j++)ports.push([-.813,.56+row*.21,-.63+j*.106]);
  batch('PSU modular socket recesses',[.025,.063,.068],ports,dark);
  return {materials};
}
