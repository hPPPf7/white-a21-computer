import * as THREE from 'three';

// A continuous stamped roof closes the space around the removable dust filter.
// Vent slots are real apertures; the fine filter uses one repeated texture, not individual wires.
export function refineCaseRoof(root, build=0) {
 const profiles=[
  {name:'A21',width:4.65,depth:2.10,y:4.505,filter:[-.24,3.80,1.78],white:true},
  {name:'Hyperion',width:6.10,depth:2.60,y:6.006,filter:[-.20,5.20,2.10]},
  {name:'TURRET',width:4.10,depth:2.02,y:4.470,filter:[-.23,3.23,1.74]},
 ];
 const p=profiles[build];
 const obsolete=['Top magnetic dust filter','Hyperion top dust filter','Top dust mesh','Top filter magnetic border','Filter end binding','Filter lift tab','Removable top filter edge'];
 for(const child of [...root.children])if(obsolete.includes(child.name))child.removeFromParent();
 const coat=new THREE.MeshStandardMaterial({color:p.white?'#eceeea':'#202730',metalness:.55,roughness:.42});
 const binding=new THREE.MeshStandardMaterial({color:p.white?'#afb4b4':'#171b21',roughness:.8});
 function add(geometry,name,position,material=coat){const o=new THREE.Mesh(geometry,material);o.name=p.name+' '+name;o.userData.partId='case';o.position.set(...position);o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
 const [fx,fw,fd]=p.filter;
 const rectangle=(shape,x,y,w,h,reverse=false)=>{const points=[[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]];if(reverse)points.reverse();points.forEach(([dx,dy],i)=>i?shape.lineTo(x+dx,y+dy):shape.moveTo(x+dx,y+dy));shape.closePath();return shape;};
 const shape=rectangle(new THREE.Shape(),0,0,p.width,p.depth);
 const columns=Math.floor((fw-.18)/.14),rows=Math.floor((fd-.18)/.14);
 for(let x=0;x<columns;x++)for(let z=0;z<rows;z++)shape.holes.push(rectangle(new THREE.Path(),fx+(x-(columns-1)/2)*.14,(z-(rows-1)/2)*.14,.092,.092,true));
 const deckGeometry=new THREE.ExtrudeGeometry(shape,{depth:.035,bevelEnabled:false});deckGeometry.translate(0,0,-.0175);
 const deck=add(deckGeometry,'continuous vented steel roof',[0,p.y,0]);deck.rotation.x=-Math.PI/2;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,64,64);ctx.fillStyle='black';ctx.fillRect(14,14,36,36);
 const alpha=new THREE.CanvasTexture(canvas);alpha.wrapS=alpha.wrapT=THREE.RepeatWrapping;alpha.repeat.set(fw/.035,fd/.035);
 // More than half the filter remains solid, keeping its mip levels above alphaTest at a distance.
 const filterMaterial=new THREE.MeshStandardMaterial({color:p.white?'#929b9c':'#343e49',metalness:.25,roughness:.8,alphaMap:alpha,alphaTest:.42,side:THREE.DoubleSide});
 const fy=p.y+.031;
 const filter=add(new THREE.PlaneGeometry(fw,fd),'fine mesh dust filter',[fx,fy,0],filterMaterial);filter.rotation.x=-Math.PI/2;
 for(const z of [-fd/2,fd/2])add(new THREE.BoxGeometry(fw+.04,.016,.032),'magnetic filter binding',[fx,fy+.005,z],binding);
 for(const x of [fx-fw/2,fx+fw/2])add(new THREE.BoxGeometry(.032,.016,fd),'magnetic filter end binding',[x,fy+.005,0],binding);
 add(new THREE.BoxGeometry(.13,.018,.20),'filter lift tab',[fx+fw/2-.075,fy+.015,fd/2-.12],binding);
 return deck;
}
