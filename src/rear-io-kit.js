import * as THREE from 'three';

// Reusable recessed ports and shields; local +Z points out of the chassis.
export function rearIOKit(root,name,position,partId='motherboard') {
 const group=new THREE.Group();group.name=name;group.userData.partId=partId;group.position.set(...position);group.rotation.y=-Math.PI/2;root.add(group);
 const steel=new THREE.MeshStandardMaterial({color:'#a9afb4',metalness:.8,roughness:.3});
 const shield=new THREE.MeshStandardMaterial({color:'#252c34',metalness:.45,roughness:.48});
 const black=new THREE.MeshStandardMaterial({color:'#080b10',roughness:.75});
 const gold=new THREE.MeshStandardMaterial({color:'#c5a052',metalness:.75,roughness:.3});
 const blue=new THREE.MeshStandardMaterial({color:'#2363a0',roughness:.5});
 const red=new THREE.MeshStandardMaterial({color:'#b3293b',roughness:.5});
 const green=new THREE.MeshStandardMaterial({color:'#71964b',roughness:.5});
 const purple=new THREE.MeshStandardMaterial({color:'#79538c',roughness:.5});
 const holes=[],ports=[];
 function add(geometry,name,x,y,z,material){const o=new THREE.Mesh(geometry,material);o.name=name;o.userData.partId=partId;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
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
 function finish(w=.445,h=1.585){const face=path(rect(w,h));face.holes.push(...holes);const geometry=new THREE.ExtrudeGeometry(face,{depth:.014,bevelEnabled:false});geometry.translate(0,0,-.007);add(geometry,name+' perforated shield',0,0,0,shield);plate(rect(w+.02,h+.02),.018,name+' rolled perimeter',0,0,-.009,steel,rect(w-.01,h-.01));group.userData.portCenters=ports;return group;}
 function audio(name,x,y,color='#bd9b50'){circularHole(x,y,.037);const m=new THREE.MeshStandardMaterial({color,metalness:.6,roughness:.35});ring(name+' rim',x,y,.018,.030,.006,m);disk(name+' interior',x,y,-.025,.024,black);ports.push({name,x,y});}
 function button(name,x,y){circularHole(x,y,.030);ring(name+' rim',x,y,.016,.027,.004,steel);disk(name,x,y,.018,.023,black);ports.push({name,x,y});}
 function antenna(name,x,y){circularHole(x,y,.040);ring(name+' hex mounting nut',x,y,.012,.034,.007,gold);for(let i=0;i<4;i++)ring(name+' threaded barrel',x,y,.025+i*.009,.022,.003,gold);disk(name+' dielectric',x,y,.065,.016,black);disk(name+' center contact',x,y,.066,.004,gold);ports.push({name,x,y});}
 return {group,holes,ports,add,rect,path,plate,box,rectangular,circularHole,disk,ring,finish,audio,button,antenna,steel,shield,black,gold,blue};
}
