import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Exterior detail for isolated views. Layouts are visual reconstructions, not pinout CAD.
export function refineComponentFaces(root, build) {
 const metal=(color,metalness=.5,roughness=.45)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
 const silver=metal('#b2b8ba',.8,.34),gold=metal('#c2a152',.7,.32),green=metal('#254d3b',.12,.72);
 const dark=metal('#171c20',.2,.68),solder=metal('#858e90',.7,.4),copper=metal('#af744a',.75,.38);
 let part='cpu';
 function add(g,n,p,m=dark,rotation=[0,0,0],parent=root){const o=new THREE.Mesh(g,m);o.name=n;o.position.set(...p);o.rotation.set(...rotation);o.userData.partId=part;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
 const box=(n,size,p,m=dark)=>add(new THREE.BoxGeometry(...size),n,p,m);
 function batch(n,g,poses,m=gold,parent=root){const o=new THREE.InstancedMesh(g,m,poses.length),t=new THREE.Object3D();poses.forEach((p,i)=>{t.position.set(...p.slice(0,3));t.rotation.set(...(p.slice(3,6).length===3?p.slice(3,6):[0,0,0]));t.updateMatrix();o.setMatrixAt(i,t.matrix);});o.name=n;o.userData.partId=part;o.castShadow=true;o.receiveShadow=true;o.computeBoundingSphere();parent.add(o);return o;}
 function decal(n,w,h,p,draw,rotation=[0,0,0]){const c=document.createElement('canvas');c.width=1024;c.height=1024;draw(c.getContext('2d'));const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const o=add(new THREE.PlaneGeometry(w,h),n,p,new THREE.MeshStandardMaterial({map,transparent:true,roughness:.72,depthWrite:false}),rotation);o.castShadow=false;return o;}
 function etched(c,lines){c.fillStyle='#47534f';c.textAlign='center';lines.forEach((l,i)=>{c.font=(i===0?'bold 112':'64')+'px Arial';c.fillText(l,512,225+i*145);});for(let y=0;y<10;y++)for(let x=0;x<10;x++)if((x*11+y*7)%5<3)c.fillRect(105+x*14,780+y*14,11,11);}
 function triangle(p){const s=new THREE.Shape();s.moveTo(0,0);s.lineTo(.025,0);s.lineTo(0,.025);s.closePath();return add(new THREE.ShapeGeometry(s),'Package pin-one orientation triangle',p,gold);}
 const grid=[];
 // Representative 1,331-pin PGA field with a central component keep-out and keyed corners.
 for(let y=0;y<39;y++)for(let x=0;x<39;x++){
  if(x>=13&&x<=25&&y>=13&&y<=25)continue;
  if(x+y<3||(38-x)+y<3||x+(38-y)<3||(38-x)+(38-y)<2)continue;
  grid.push([(x-19)*.0094,(y-19)*.0094]);
 }
 if(build===2){
  for(const o of [...root.children])if(o.userData.partId==='cpu')o.removeFromParent();
  box('AM4 multilayer organic substrate',[.40,.40,.014],[-.83,3.45,-.583],green);
  add(new RoundedBoxGeometry(.347,.347,.029,3,.005),'Ryzen 2600 beveled nickel IHS',[-.83,3.45,-.550],silver);
  box('IHS lower mounting step',[.36,.36,.015],[-.83,3.45,-.570],silver);
  decal('Ryzen 2600 laser marking',.315,.315,[-.83,3.45,-.534],c=>etched(c,['AMD RYZEN','5 2600','AM4  /  6 CORE']));
  triangle([-1.027,3.253,-.575]);
  batch('AM4 PGA 1331 gold pins',new THREE.CylinderGeometry(.0018,.0022,.027,6),grid.map(([x,y])=>[-.83+x,3.45+y,-.6035,Math.PI/2,0,0]),gold);
  batch('AM4 pin solder shoulders',new THREE.CylinderGeometry(.0030,.0030,.002,6),grid.map(([x,y])=>[-.83+x,3.45+y,-.591,Math.PI/2,0,0]),gold);
  box('AM4 underside central mask',[.119,.119,.001],[-.83,3.45,-.5908],dark);
  const smd=[];for(let y=0;y<5;y++)for(let x=0;x<5;x++)smd.push([-.871+x*.0205,3.409+y*.0205,-.594]);
  batch('AM4 underside decoupling packages',new THREE.BoxGeometry(.010,.006,.005),smd,solder);
  part='motherboard';
  batch('AM4 socket pin wells',new THREE.CylinderGeometry(.0027,.0027,.001,6),grid.map(([x,y])=>[-.83+x,3.45+y,-.609,Math.PI/2,0,0]),dark);
  box('AM4 socket locking arm',[.011,.40,.011],[-.592,3.45,-.603],silver);
 } else if(build===1){
  const smd=[];for(const side of [-1,1])for(const a of [-.035,.035]){smd.push([-1.15+side*.191,4.32+a,-.866],[-1.15+a,4.32+side*.191,-.866]);}
  batch('AM5 exposed top-side capacitor packages',new THREE.BoxGeometry(.018,.014,.005),smd,solder);
  triangle([-1.382,4.087,-.866]);
  decal('AM5 underside package identification',.095,.095,[-1.15,4.32,-.895],c=>{c.fillStyle='#b5b8a2';c.font='110px monospace';c.fillText('AM5',240,460);c.font='60px monospace';c.fillText('LGA PACKAGE',100,620);},[0,Math.PI,0]);
 }
 // Dense contacts sit inside the socket in an assembled computer.
 // Render them only while inspecting the owning component.
 for(const o of root.children)if(/AM4 PGA|AM4 pin solder|AM4 socket pin wells|LGA gold contact array|AM5 processor gold lands/.test(o.name)){o.userData.inspectionOnly=true;o.visible=false;}
 // PCB reverse-side solder mask, connector joints and socket retention backplates.
 part='motherboard';
 const boards=[[-.61,2.75,-.7525,2.44,2.44,-.72,3.18],[-.98,3.77,-1.0125,2.77,3.05,-1.15,4.32],[-.63,2.81,-.75,2.44,3.05,-.83,3.45]];
 const [bx,by,bz,bw,bh,cx,cy]=boards[build];
 decal('Motherboard reverse-side copper routing',bw-.025,bh-.025,[bx,by,bz-.001],c=>{
  c.strokeStyle='#45564c';c.lineWidth=1.4;
  for(let i=0;i<180;i++){const x=(i*139)%1000,y=(i*233)%1000;c.beginPath();c.moveTo(x,y);c.lineTo(x+35,y);c.lineTo(x+70,y+35);c.lineTo(x+110,y+35);c.stroke();}
  c.fillStyle='#9ca99d';c.font='22px monospace';c.fillText('PCB REVERSE / SOCKET RETENTION',80,960);
 },[0,Math.PI,0]);
 const joints=[];for(let i=0;i<150;i++){const x=bx-bw*.43+(i%25)*bw*.0345,y=by-bh*.43+Math.floor(i/25)*bh*.14;if(Math.abs(x-cx)<.50&&Math.abs(y-cy)<.40)continue;joints.push([x,y,bz-.004]);}
 batch('Motherboard backside solder joints',new THREE.BoxGeometry(.018,.010,.004),joints,solder);
 box('Socket insulating rear pad',[.92,.65,.006],[cx,cy,bz-.006],dark);
 box('Socket steel retention backplate',[.79,.55,.013],[cx,cy,bz-.017],silver);
 for(const x of [-.42,.42])for(const y of [-.28,.28]){box('Backplate mounting ear',[.12,.12,.012],[cx+x,cy+y,bz-.016],silver);add(new THREE.CylinderGeometry(.032,.032,.012,12),'Rear socket screw',[cx+x,cy+y,bz-.027],dark,[Math.PI/2,0,0]);}
 // M.2 backs have traces/test pads; no invented rear NAND on single-sided products.
 const ssds=build===0?[['ssd1',-.63,2.46,-.659,-.251],['ssd2',-.63,1.91,-.659,-.251]]:build===1?[['ssd1',-1.14,3.58,-.911,-.755]]:[['ssd1',-.79,2.36,-.637,-1.171]];
 for(const[id,x,y,z,edge]of ssds){part=id;
  decal('M.2 reverse solder mask and test traces',.75,.19,[x,y,z-.0008],c=>{c.strokeStyle='#738570';c.lineWidth=3;for(let i=0;i<16;i++){c.beginPath();c.moveTo(40,60+i*55);c.lineTo(200+i*13,60+i*55);c.lineTo(240+i*13,110+i*55);c.lineTo(940,110+i*55);c.stroke();}c.fillStyle='#aab7a4';c.font='70px monospace';c.fillText('M.2 2280',290,540);},[0,Math.PI,0]);
  const pads=[];for(let i=0;i<24;i++)if(i!==4&&i!==5)pads.push([edge,y-.098+i*.0084,z-.002]);batch('M.2 reverse connector fingers',new THREE.BoxGeometry(.034,.005,.002),pads,gold);
  batch('M.2 rear test points',new THREE.BoxGeometry(.016,.016,.002),Array.from({length:12},(_,i)=>[x-.30+i*.052,y-.078,z-.002]),gold);
 }
 part='memory';
 if(build>0){for(const x of build===1?[-.03,.37]:[.23,.61]){
  const y=build===1?4.37:3.45,z=build===1?-.882:-.588;
  const count=build===1?69:144,step=build===1?.018:.00896,start=build===1?3.75:2.808;
  batch('DIMM reverse-side edge contacts',new THREE.BoxGeometry(.002,build===1?.011:.006,build===1?.035:.052),Array.from({length:count},(_,i)=>[x-(build===1?.014:.009),start+i*step,z]),gold);
  if(build===2)batch('ValueRAM termination resistors',new THREE.BoxGeometry(.003,.019,.010),Array.from({length:20},(_,i)=>[x-.009,y-.55+i*.055,-.55]),solder);
 }}

 // Folded PSU shell and a real fan opening, rather than a grille over a solid box.
 part='psu';root.updateMatrixWorld(true);
 const body=root.getObjectByName(['Seasonic FOCUS GX-850 white PSU','ROG Thor 1200W PSU body','MWE Bronze 550 PSU'][build]);
 body.geometry.computeBoundingBox();const local=body.geometry.boundingBox.getSize(new THREE.Vector3());
 const bounds=new THREE.Box3().setFromObject(body),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),bottom=bounds.min.y;
 if(build===2){const grille=root.getObjectByName('PSU rear exhaust');grille.position.x=bounds.min.x-.003;grille.position.y=center.y;for(const n of ['AC mains socket','AC rocker switch'])root.getObjectByName(n).position.x=bounds.min.x-.011;}
 if(build===1){root.getObjectByName('Thor OLED display bezel').position.z=bounds.max.z+.014;root.getObjectByName('Thor power display').position.z=bounds.max.z+.032;for(const o of [...root.children])if(o.userData.partId==='psu'&&o.name==='ROG THOR')o.removeFromParent();}
 const shell=new THREE.BoxGeometry(local.x,local.y,local.z),index=Array.from(shell.index.array);
 shell.setIndex(index.filter((_,i)=>i<18||i>=24));shell.clearGroups();body.geometry=shell;
 const fanRadius=build===1?.56:.51,shape=new THREE.Shape();shape.moveTo(-size.x/2,-size.z/2);shape.lineTo(size.x/2,-size.z/2);shape.lineTo(size.x/2,size.z/2);shape.lineTo(-size.x/2,size.z/2);shape.closePath();
 const hole=new THREE.Path();hole.absarc(0,0,fanRadius+.018,0,Math.PI*2,true);shape.holes.push(hole);
 const plate=new THREE.ExtrudeGeometry(shape,{depth:.013,bevelEnabled:false,curveSegments:32});plate.translate(0,0,-.0065);
 add(plate,'PSU punched fan mounting panel',[center.x,bottom+.0065,center.z],body.material,[Math.PI/2,0,0]);
 for(const o of [...root.children])if(o.name==='PSU fan opening')o.removeFromParent();
 for(const o of root.children)if(/PSU concentric fan guard|PSU grille support|MWE.*grille|MWE concentric|Thor fan guard/.test(o.name)){o.position.y=bottom-.008;o.position.x=center.x;o.position.z=center.z;}
 const housing=new THREE.Group();housing.name='PSU fan assembly';housing.userData.partId=part;housing.position.set(center.x,bottom+.024,center.z);housing.rotation.x=Math.PI/2;root.add(housing);
 add(new THREE.CylinderGeometry(fanRadius,fanRadius,.012,32),'PSU recessed intake shadow',[0,0,-.055],dark,[Math.PI/2,0,0],housing);
 const blade=new THREE.Shape();blade.moveTo(.12,0);blade.bezierCurveTo(.25,-.10,.48,-.03,.47,.12);blade.bezierCurveTo(.32,.23,.18,.13,.12,.05);blade.closePath();
 batch('PSU fan impeller blades',new THREE.ExtrudeGeometry(blade,{depth:.014,bevelEnabled:false,curveSegments:4}),Array.from({length:7},(_,i)=>[0,0,0,0,0,i*Math.PI*2/7]),solder,housing);
 add(new THREE.CylinderGeometry(.12,.12,.045,20),'PSU fan bearing',[0,0,.005],dark,[Math.PI/2,0,0],housing);
 for(const side of [-1,1]){
  const z=center.z+side*(size.z/2+.001);
  box('PSU folded side seam',[size.x-.08,.009,.003],[center.x,bottom+size.y*.72,z],solder);
  for(const x of [-1,1])for(const y of [.09,size.y-.09])add(new THREE.CylinderGeometry(.017,.017,.006,10),'PSU shell assembly screw',[center.x+x*(size.x/2-.065),bottom+y,z+side*.003],dark,[Math.PI/2,0,0]);
 }
 decal('PSU reverse specification plate',size.x*.68,size.y*.55,[center.x,center.y,center.z-size.z/2-.004],c=>{c.fillStyle='#242b2e';c.fillRect(0,0,1024,1024);c.fillStyle='#c0c7c6';c.textAlign='center';c.font='bold 88px Arial';c.fillText(['FOCUS GX-850','ROG THOR 1200W','MWE BRONZE 550'][build],512,170);c.font='47px monospace';c.fillText('AC 100-240V  50-60Hz',512,330);c.fillText('DC +12V / +5V / +3.3V',512,460);c.strokeStyle='#65706f';for(let i=0;i<5;i++){c.beginPath();c.moveTo(90,540+i*65);c.lineTo(934,540+i*65);c.stroke();}c.font='42px Arial';c.fillText('POWER SUPPLY',512,940);},[0,Math.PI,0]);
 // Cooler contact surfaces and fasteners, facing the CPU (negative Z).
 part='cooler';
 if(build===0){const plate=root.getObjectByName('CPU cold plate in contact with heat spreader');plate.scale.z=.045/.08;plate.position.z=-.5365;}
 if(build===1)root.getObjectByName('RYUJIN copper cold plate').position.z=-.780;
 const coolers=[[-.73,3.18,-.560,.43],[-1.15,4.32,-.8255,.47],[-.83,3.45,-.532,.50]];
 const [px,py,pz,pw]=coolers[build];
 box('Cooler machined contact face',[pw,pw,.006],[px,py,pz],build===2?silver:copper);
 const grooves=[];for(let i=0;i<20;i++)grooves.push([px-pw*.43+i*pw*.045,py,pz-.0035]);batch('Cold plate machining lines',new THREE.BoxGeometry(.0012,pw*.88,.0005),grooves,silver);
 for(const x of [-1,1])for(const y of [-1,1])add(new THREE.CylinderGeometry(.018,.018,.006,10),'Cold plate retaining screw',[px+x*pw*.43,py+y*pw*.43,pz-.005],dark,[Math.PI/2,0,0]);
 // Rear fan struts/motor labels on Hyperion and Turret (A21 already has them).
 if(build>0){const fans=[];root.traverse(o=>{if(o.isGroup&&/^(Top TL LCD fan|Rear TL LCD exhaust|Front TL LED intake|Upper RGB front intake|Lower RGB front intake)/.test(o.name))fans.push(o);});
  for(const f of fans){part=f.userData.partId;for(let i=0;i<4;i++){const a=i*Math.PI/2,o=add(new THREE.BoxGeometry(.39,.035,.022),'Fan rear motor support',[Math.cos(a)*.28,Math.sin(a)*.28,-.115],dark,[0,0,a],f);}
   add(new THREE.CylinderGeometry(.12,.12,.026,20),'Fan rear motor bearing',[0,0,-.123],dark,[Math.PI/2,0,0],f);
   for(const x of [-.52,.52])for(const y of [-.52,.52])add(new THREE.CylinderGeometry(.027,.027,.012,10),'Fan rear mounting screw',[x,y,-.12],silver,[Math.PI/2,0,0],f);
  }
 }
 if(build===1){part='gpu';box('Waterforce underside service cover',[2.67,.014,1.06],[-.86,2.706,.12],dark);
  for(const x of [-2.06,.31])for(const z of [-.31,.56])add(new THREE.CylinderGeometry(.024,.024,.008,12),'Waterblock underside screw',[x,2.695,z],silver);
 }
 if(build===2){part='hdd';
  add(new THREE.CylinderGeometry(.245,.245,.033,28),'HDD spindle motor underside',[1.12,.438,-.03],silver);
  add(new THREE.CylinderGeometry(.085,.085,.035,18),'HDD spindle bearing cap',[1.12,.421,-.03],dark);
  for(const [x,z,w,h]of [[.88,.20,.23,.18],[1.45,.15,.19,.16],[1.52,-.25,.12,.13]])box('HDD controller IC',[w,.020,h],[x,.428,z],dark);
  batch('HDD controller solder terminals',new THREE.BoxGeometry(.014,.006,.008),Array.from({length:36},(_,i)=>[.75+(i%12)*.059,.435,-.35+Math.floor(i/12)*.08]),solder);
 }
}

export function inspectComponentFaces(root) {
 const result={};
 root.traverse(o=>{if(!o.isMesh)return;let p=o;while(p&&!p.userData.partId)p=p.parent;const id=p?.userData.partId;if(!id)return;const entry=result[id]||={features:new Set(),inspectionOnly:[]};if(o.name&&!o.name.startsWith('Static parts /'))entry.features.add(o.name);if(o.userData.inspectionOnly)entry.inspectionOnly.push({name:o.name,count:o.count||1,visible:o.visible});});
 return Object.fromEntries(Object.entries(result).map(([id,e])=>[id,{features:[...e.features],inspectionOnly:e.inspectionOnly}]));
}
