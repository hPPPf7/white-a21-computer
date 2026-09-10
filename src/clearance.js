import * as THREE from 'three';
// Explicit, read-only model QA. Never called by the render loop.
export function inspectClearance(root){
 root.updateMatrixWorld(true);const solids=[],tubes=[],panels=[];
 const owner=o=>{while(o&&!o.userData.partId)o=o.parent;return o?.userData.partId;};
 root.traverse(o=>{if(o.userData.clearanceRoute)tubes.push({name:o.name,parent:o.parent,userData:o.userData,matrixWorld:o.matrixWorld,geometry:{parameters:o.userData.clearanceRoute}});if(o.userData.bundleStrand)return;if(!o.isMesh||o.isInstancedMesh||o.name.startsWith('Static parts /'))return;
  if(!o.visible&&!o.userData.batchedSource)return;
  if(o.geometry.type==='TubeGeometry')tubes.push(o);
  if(o.geometry.type==='ExtrudeGeometry'&&owner(o)==='case')panels.push(o);
  if(!o.material.transparent&&['BoxGeometry','RoundedBoxGeometry'].includes(o.geometry.type)){const b=new THREE.Box3().setFromObject(o),s=b.getSize(new THREE.Vector3());if(s.x*s.y*s.z>.0005)solids.push({o,b,part:owner(o)});}
 });
 const cableContacts=[];
 for(const t of tubes){const r=t.geometry.parameters.radius;const p=Array.from({length:241},(_,i)=>t.geometry.parameters.path.getPoint(i/240)).map(v=>v.applyMatrix4(t.matrixWorld));const bb=new THREE.Box3().setFromPoints(p).expandByScalar(r);
  for(const s of solids){if(owner(t)===s.part||!bb.intersectsBox(s.b))continue;const hits=p.slice(10,-10).filter(v=>s.b.distanceToPoint(v)<r*.85);if(hits.length)cableContacts.push({tube:t.name,solid:s.o.name,part:s.part,samples:hits.length,at:hits[Math.floor(hits.length/2)].toArray().map(v=>+v.toFixed(3))});}
 }
 const bodyContacts=[];
 for(let i=0;i<solids.length;i++)for(let j=i+1;j<solids.length;j++){const a=solids[i],b=solids[j];if(a.part===b.part||/socket|connector|plug|header|latch|contact|lead|pin|port|screw|PCB|frame|rail|fin|bracket|ear/i.test(a.o.name+' '+b.o.name))continue;const size=a.b.clone().intersect(b.b).getSize(new THREE.Vector3());if(Math.min(...size.toArray())>.02&&size.x*size.y*size.z>.002)bodyContacts.push({a:a.o.name,b:b.o.name,overlap:size.toArray().map(v=>+v.toFixed(3))});}
 const panelCrossings=[],material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),ray=new THREE.Raycaster();
 for(const t of tubes){const points=Array.from({length:161},(_,i)=>t.geometry.parameters.path.getPoint(i/160).applyMatrix4(t.matrixWorld));const bounds=new THREE.Box3().setFromPoints(points);
  for(const p of panels){if(!bounds.intersectsBox(new THREE.Box3().setFromObject(p)))continue;const mesh=new THREE.Mesh(p.geometry,material);mesh.matrixWorld.copy(p.matrixWorld);
   for(let i=1;i<points.length;i++){const direction=points[i].clone().sub(points[i-1]),length=direction.length();if(length<1e-8)continue;ray.set(points[i-1],direction.normalize());ray.near=.00001;ray.far=length;const hits=ray.intersectObject(mesh,false);if(hits.length){panelCrossings.push({tube:t.name,panel:p.name,at:hits[0].point.toArray().map(v=>+v.toFixed(3))});break;}}
  }
 }material.dispose();
 // Tube-to-tube broad phase, followed by densely sampled centerline proximity.
 const routes=tubes.filter(t=>!/(guide|sense|Core Pipe)/i.test(t.name)).map(t=>{const points=Array.from({length:241},(_,i)=>t.geometry.parameters.path.getPoint(i/240).applyMatrix4(t.matrixWorld));return {t,points,r:t.geometry.parameters.radius,b:new THREE.Box3().setFromPoints(points).expandByScalar(t.geometry.parameters.radius)};}),tubeContacts=[];
 for(let i=0;i<routes.length;i++)for(let j=i+1;j<routes.length;j++){const a=routes[i],b=routes[j];if(Math.max(a.r,b.r)<.03||!a.b.intersectsBox(b.b))continue;let best=Infinity,at,indices;const shared=a.points[0].distanceTo(b.points[0])<.13;
  for(let ai=8;ai<233;ai++)for(let bi=8;bi<233;bi++){if(shared&&a.points[ai].distanceTo(a.points[0])<.25&&b.points[bi].distanceTo(b.points[0])<.25)continue;const d=a.points[ai].distanceToSquared(b.points[bi]);if(d<best){best=d;at=a.points[ai];indices=[ai,bi];}}
  if(best<(a.r+b.r)**2*.90)tubeContacts.push({a:a.t.name,b:b.t.name,gap:+(Math.sqrt(best)-a.r-b.r).toFixed(3),at:at.toArray().map(v=>+v.toFixed(3)),indices});
 }
 return {cableContacts,bodyContacts,panelCrossings,tubeContacts};
}
