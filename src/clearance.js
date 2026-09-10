import * as THREE from 'three';
// Explicit, read-only model QA. Never called by the render loop.
export function inspectClearance(root){
 root.updateMatrixWorld(true);const solids=[],tubes=[],panels=[];
 const owner=o=>{while(o&&!o.userData.partId)o=o.parent;return o?.userData.partId;};
 root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||o.name.startsWith('Static parts /'))return;
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
 return {cableContacts,bodyContacts,panelCrossings};
}
