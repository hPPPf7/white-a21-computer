import * as THREE from 'three';
import { rearIOKit } from './rear-io-kit.js';

export function refineRearConnections(root,build) {
 const first=build===0;
 const obsolete=first?['Rear I/O inset','Rear USB and display port','GPU rear steel I/O bracket','GPU video output housing','HDMI DisplayPort dark cavity','GPU I/O ventilation apertures','PSU exhaust inset','PSU rear honeycomb','IEC power socket','Power rocker switch']:['GPU rear I/O plate','DisplayPort HDMI socket','Thor rear power inlet'];
 const removed=[];root.traverse(o=>{if(obsolete.includes(o.name))removed.push(o);});removed.forEach(o=>o.removeFromParent());
 // Occupied PCI slots are covered by the graphics card bracket, not blank slot covers.
 for(const o of [...root.children])if((first&&o.name==='A21 slotted PCI cover'&&o.position.y>1.9)||(!first&&o.name==='Perforated removable PCI slot'&&o.position.y>2.65))o.removeFromParent();
 const io=rearIOKit(root,first?'B760M fitted rear I/O':'GODLIKE fitted rear I/O',first?[-2.35,3.40,-.74]:[-3.085,4.57,-.91]);
 const A=(name,x,y,kind='USB3')=>io.rectangular(name,x,y,.062,.135,kind),C=(name,x,y)=>io.rectangular(name,x,y,.040,.09,'USB-C');
 if(first){
  io.rectangular('B760M DisplayPort',-.09,.665,.063,.17,'DisplayPort');io.rectangular('B760M HDMI',.09,.665,.067,.15,'HDMI');
  A('B760M USB 2.0 A',-.085,.43,'USB2');A('B760M USB 2.0 B',.085,.43,'USB2');
  A('B760M USB 10Gbps A',-.085,.205,'USB3Gen2');A('B760M USB 10Gbps B',.085,.205,'USB3Gen2');
  A('B760M USB 5Gbps A',-.085,-.015);A('B760M USB 5Gbps B',.085,-.015);
  A('B760M USB 5Gbps C',-.12,-.235);C('B760M USB-C 20Gbps',-.01,-.235);io.rectangular('B760M 2.5Gb LAN',.12,-.235,.126,.15,'LAN');
  io.antenna('B760M Wi-Fi antenna A',-.10,-.44);io.antenna('B760M Wi-Fi antenna B',.10,-.44);
  for(const [i,x,y,color]of [[0,-.13,-.60,'#82a9bc'],[1,0,-.60,'#709b71'],[2,.13,-.60,'#bb737f'],[3,-.13,-.72,'#30343a'],[4,0,-.72,'#c89150']])io.audio('B760M audio '+i,x,y,color);
  io.rectangular('B760M optical S/PDIF',.13,-.72,.078,.084,'Optical');
 }else{
  // Eight Type-A plus seven Type-C: two USB4 and five 10Gbps ports.
  for(const [row,y]of [[0,.67],[1,.46],[2,.25]])for(const [col,x]of [[0,-.085],[1,.085]])A('GODLIKE USB 10Gbps A'+(row*2+col+1),x,y,'USB3Gen2');
  for(const [name,x]of [['Flash BIOS',-.13],['Clear CMOS',0],['Smart button',.13]])io.button('GODLIKE '+name,x,.105);
  for(const [name,x]of [['USB4 40Gbps A',-.13],['USB4 40Gbps B',0],['USB-C 10Gbps A',.13]])C('GODLIKE '+name,x,-.01);
  for(const [name,x]of [['10Gb LAN',-.105],['5Gb LAN',.105]])io.rectangular('GODLIKE '+name,x,-.18,.126,.15,'LAN');
  for(const [i,x]of [[0,-.15],[1,-.05],[2,.05],[3,.15]])C('GODLIKE USB-C 10Gbps '+(i+2),x,-.355);
  A('GODLIKE USB 10Gbps A7',-.085,-.515,'USB3Gen2');A('GODLIKE USB 10Gbps A8',.085,-.515,'USB3Gen2');
  io.antenna('GODLIKE EZ Wi-Fi A',-.14,-.655);io.antenna('GODLIKE EZ Wi-Fi B',-.02,-.655);
  io.audio('GODLIKE line out',.11,-.655,'#c0a36c');io.audio('GODLIKE mic in',-.11,-.75,'#c0a36c');io.rectangular('GODLIKE optical S/PDIF',.10,-.75,.075,.069,'Optical');
 }
 io.finish();
 // A fitted enclosure joins the shield to the existing I/O armor; dimensions follow this model's board placement.
 const armor=root.getObjectByName(first?'I/O armor':'GODLIKE rear I/O armor');
 const backX=armor.position.x-(first?.225:.235),reach=backX-io.group.position.x;
 for(const z of [-.20,.20])io.box('Rear I/O enclosure side',z,0,-reach/2,.025,1.54,reach,io.shield);
 io.box('Rear I/O enclosure top',0,.77,-reach/2,.42,.025,reach,io.shield);
 io.box('Rear I/O enclosure bottom',0,-.77,-reach/2,.42,.025,reach,io.shield);

 const gpu=rearIOKit(root,first?'AERO GPU rear bracket':'AORUS GPU rear bracket',first?[-2.35,2.155,.04]:[-3.10,2.915,.05],'gpu');
 for(let i=0;i<4;i++)gpu.rectangular((first?'AERO':'AORUS')+' '+(i===3?'HDMI':'DisplayPort '+(i+1)),-.405+i*.27,.055,.18,.080,i===3?'HDMI':'DisplayPort');
 for(let i=0;i<13;i++)gpu.holes.push(gpu.path(gpu.rect(.035,.070),-.47+i*.078,-.125,true));
 gpu.finish(first?1.36:1.63,first?.49:.47);

 const psu=rearIOKit(root,first?'FOCUS GX rear panel':'THOR rear panel',first?[-2.355,.68,-.12]:[-3.105,.91,.01],'psu');
 const w=first?1.50:1.67,h=first?.70:.84;
 // Open ventilation and a recessed mains inlet with three blades.
 for(let x=0;x<11;x++)for(let y=0;y<6;y++)psu.holes.push(psu.path(psu.rect(.039,.045),-w/2+.065+x*.057,-h/2+.065+y*.085,true));
 const inletX=w/2-.32;
 psu.holes.push(psu.path(psu.rect(.29,.21,.025),inletX,-.04,true));psu.plate(psu.rect(.29,.21,.025),.065,'IEC mains inlet housing',inletX,-.04,-.015,psu.black,psu.rect(.23,.155,.018));psu.plate(psu.rect(.23,.155,.018),.008,'IEC mains recess',inletX,-.04,-.049,psu.black);
 for(const [x,y]of [[inletX-.065,-.065],[inletX+.065,-.065],[inletX,.010]])psu.box('IEC mains metal blade',x,y,-.008,.018,.035,.040,psu.steel);
 psu.ports.push({name:'IEC mains inlet',x:inletX,y:-.04});
 const sx=w/2-.09;psu.holes.push(psu.path(psu.rect(.12,.18),sx,-.025,true));psu.box('PSU rocker switch bezel',sx,-.025,.005,.12,.18,.04,psu.black);psu.box('PSU rocker paddle',sx,-.025,.030,.082,.14,.022,psu.shield);psu.box('PSU switch ON mark',sx,.01,.043,.005,.028,.002,psu.steel);psu.ring('PSU switch OFF mark',sx,-.062,.043,.011,.002,psu.steel);psu.ports.push({name:'Power switch',x:sx,y:-.025});
 psu.finish(w,h);
 const body=root.getObjectByName(first?'Seasonic FOCUS GX-850 white PSU':'ROG Thor 1200W PSU body');
 // Remove the shell's old solid rear face so the new ventilation remains open.
 const indices=Array.from(body.geometry.index.array);body.geometry.setIndex(indices.filter((_,i)=>i<6||i>=12));
 return {io:io.group,gpu:gpu.group,psu:psu.group};
}

// Read-only regression check: connector centerlines must pass through their own shield and case.
export function inspectRearPorts(root){
 root.updateMatrixWorld(true);const groups=[],casePanels=[];
 root.traverse(o=>{if(o.userData.portCenters)groups.push(o);if(o.isMesh&&o.userData.partId==='case'&&o.geometry.type==='ExtrudeGeometry'&&!o.name.startsWith('Static parts /'))casePanels.push(o);});
 const ray=new THREE.Raycaster(),blocked=[],counts=[];
 for(const group of groups){const own=[];group.traverse(o=>{if(o.isMesh&&/perforated shield|shield with individual/.test(o.name))own.push(o);});
  counts.push({assembly:group.name,count:group.userData.portCenters.length});
  for(const p of group.userData.portCenters){const world=new THREE.Vector3(p.x,p.y,0).applyMatrix4(group.matrixWorld);ray.set(world.clone().add(new THREE.Vector3(-.10,0,0)),new THREE.Vector3(1,0,0));ray.far=.13;
   for(const surface of [...own,...casePanels])if(ray.intersectObject(surface,false).length)blocked.push({assembly:group.name,port:p.name,surface:surface.name});
  }
 }
 return {counts,blocked};
}
