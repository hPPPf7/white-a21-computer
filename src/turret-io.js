import * as THREE from 'three';

// MSI X470 GAMING PRO CARBON (non-AC) rear I/O, oriented into the TURRET rear aperture.
export function createTurretRearIO(root) {
 const group=new THREE.Group();group.name='X470 fitted rear I/O assembly';group.userData.partId='motherboard';group.position.set(-2.055,3.43,-.69);group.rotation.y=-Math.PI/2;root.add(group);
 const steel=new THREE.MeshStandardMaterial({color:'#a9afb4',metalness:.8,roughness:.3});
 const shield=new THREE.MeshStandardMaterial({color:'#252c34',metalness:.45,roughness:.48});
 const black=new THREE.MeshStandardMaterial({color:'#080b10',roughness:.75});
 const gold=new THREE.MeshStandardMaterial({color:'#c5a052',metalness:.75,roughness:.3});
 const blue=new THREE.MeshStandardMaterial({color:'#2363a0',roughness:.5});
 const red=new THREE.MeshStandardMaterial({color:'#b3293b',roughness:.5});
 const green=new THREE.MeshStandardMaterial({color:'#71964b',roughness:.5});
 const purple=new THREE.MeshStandardMaterial({color:'#79538c',roughness:.5});
 const holes=[],ports=[];
 function add(geometry,name,x,y,z,material){const o=new THREE.Mesh(geometry,material);o.name=name;o.userData.partId='motherboard';o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function rect(w,h,cut=0){return [[-w/2+cut,-h/2],[w/2-cut,-h/2],[w/2,-h/2+cut],[w/2,h/2-cut],[w/2-cut,h/2],[-w/2+cut,h/2],[-w/2,h/2-cut],[-w/2,-h/2+cut]].filter((p,i,a)=>i===0||p[0]!==a[i-1][0]||p[1]!==a[i-1][1]);}
 function path(points,x=0,y=0,hole=false){const p=hole?new THREE.Path():new THREE.Shape();(hole?[...points].reverse():points).forEach(([a,b],i)=>i?p.lineTo(a+x,b+y):p.moveTo(a+x,b+y));p.closePath();return p;}
 function plate(points,depth,name,x,y,z,material,inner){const s=path(points);if(inner)s.holes.push(path(inner,0,0,true));const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return add(g,name,x,y,z,material);}
 function box(name,x,y,z,w,h,d,m){return add(new THREE.BoxGeometry(w,h,d),name,x,y,z,m);}
 function rectangular(name,x,y,w,h,kind){
  const cut=kind==='HDMI'?.017:kind==='DisplayPort'?.009:kind==='USB-C'?.015:0;
  const outer=rect(w,h,cut),inner=rect(w-.016,h-.016,Math.max(0,cut-.005));holes.push(path(rect(w+.004,h+.004,cut),x,y,true));
  plate(outer,.22,name+' metal socket',x,y,-.095,steel,inner);
  plate(inner,.006,name+' recessed cavity',x,y,-.066,black);
  if(kind.startsWith('USB')){
   box(name+' connector tongue',x,y,-.018,w*.32,h*.76,.018,kind==='USB2'?black:kind==='USB3'?blue:red);
   for(let i=0;i<(kind==='USB-C'?8:4);i++)box(name+' contact',x+w*.18,y+(i-((kind==='USB-C'?8:4)-1)/2)*h/(kind==='USB-C'?12:6),-.006,.008,.006,.004,gold);
  }else if(kind==='LAN'){
   box('RJ45 latch recess',x,y-h*.32,-.030,w*.50,h*.24,.012,black);
   for(let i=0;i<8;i++)box('RJ45 spring contact',x-w*.32+i*w*.09,y+h*.2,-.038,.005,.04,.008,gold);
   for(const [side,m]of [[-1,green],[1,gold]])box('LAN status LED lens',x+side*w*.34,y+h*.41,.017,.019,.015,.005,m);
  }else if(kind==='Optical')box('Optical S/PDIF dust flap',x,y,-.009,w*.72,h*.70,.014,black);
  else {box(name+' inner tongue',x,y,-.020,w*.3,h*.76,.012,black);for(let i=0;i<9;i++)box(name+' contact',x+w*.18,y-h*.32+i*h*.08,-.012,.006,.004,.005,gold);}
  ports.push({name,x,y});
 }
 function circularHole(x,y,r){const p=new THREE.Path();p.absarc(x,y,r,0,Math.PI*2,true);holes.push(p);}
 function disk(name,x,y,z,r,m){return add(new THREE.CircleGeometry(r,24),name,x,y,z,m);}
 function ring(name,x,y,z,r,t,m){return add(new THREE.TorusGeometry(r,t,6,24),name,x,y,z,m);}
 rectangular('USB 2.0 A',-.145,.65,.062,.14,'USB2');rectangular('USB 2.0 B',-.058,.65,.062,.14,'USB2');
 circularHole(.115,.65,.059);ring('PS/2 metal rim',.115,.65,.017,.055,.006,steel);disk('PS/2 black socket',.115,.65,-.026,.05,black);
 for(const [angle,m]of [[0,green],[Math.PI,purple]]){const half=new THREE.Mesh(new THREE.RingGeometry(.042,.05,16,1,angle,Math.PI),m);half.position.set(.115,.65,.016);half.name='PS/2 color insert';half.userData.partId='motherboard';group.add(half);}
 for(let i=0;i<6;i++){const a=i*Math.PI/3;disk('PS/2 pin aperture',.115+Math.cos(a)*.027,.65+Math.sin(a)*.027,-.024,.006,steel);}
 ports.push({name:'PS/2',x:.115,y:.65});
 rectangular('DisplayPort',-.093,.39,.063,.17,'DisplayPort');rectangular('HDMI',.095,.39,.067,.15,'HDMI');
 circularHole(0,.22,.030);ring('Clear CMOS button rim',0,.22,.016,.027,.004,steel);disk('Clear CMOS button',0,.22,.018,.023,black);ports.push({name:'Clear CMOS',x:0,y:.22});
 rectangular('USB 3.1 Gen1 A',-.075,.055,.062,.14,'USB3');rectangular('USB 3.1 Gen1 B',.075,.055,.062,.14,'USB3');
 rectangular('USB 3.1 Gen1 C',-.145,-.19,.062,.14,'USB3');rectangular('USB 3.1 Gen1 D',-.058,-.19,.062,.14,'USB3');rectangular('Gigabit LAN',.113,-.19,.126,.15,'LAN');
 rectangular('USB 3.1 Gen2 Type-A',-.085,-.415,.062,.14,'USB3Gen2');rectangular('USB 3.1 Gen2 Type-C',.095,-.415,.040,.09,'USB-C');
 for(const [i,x,y]of [[0,-.13,-.60],[1,0,-.60],[2,.13,-.60],[3,-.13,-.72],[4,0,-.72]]){circularHole(x,y,.037);ring('Gold audio jack '+i,x,y,.018,.030,.006,gold);disk('Audio socket interior '+i,x,y,-.025,.024,black);ring('Audio socket inner sleeve '+i,x,y,.003,.019,.003,steel);ports.push({name:'Audio '+i,x,y});}
 rectangular('Optical S/PDIF',.13,-.72,.078,.084,'Optical');
 const face=path(rect(.445,1.585));face.holes.push(...holes);const geometry=new THREE.ExtrudeGeometry(face,{depth:.014,bevelEnabled:false});geometry.translate(0,0,-.007);add(geometry,'X470 I/O shield with individual port apertures',0,0,0,shield);
 plate(rect(.465,1.605),.018,'I/O shield rolled perimeter',0,0,-.009,steel,rect(.435,1.575));
 group.userData.portCenters=ports;
 return group;
}
