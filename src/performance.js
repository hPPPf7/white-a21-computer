import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Batch only opaque, stationary meshes with identical material/render state.
// Keep source objects for connector bounds; the inspector must keep them hidden.
export function batchStaticParts(root, rotors) {
  root.updateMatrixWorld(true);
  const moving = new Set(rotors), groups = new Map();
  root.traverse(mesh => {
    if (!mesh.isMesh || mesh.isInstancedMesh || !mesh.visible || mesh.children.length || Array.isArray(mesh.material) || mesh.material.transparent) return;
    let id, animated = false;
    for (let p=mesh;p && p!==root;p=p.parent) {
      id ||= p.userData.partId;
      if (moving.has(p)) animated = true;
    }
    if (animated || !id || id==='wiring') return;
    const attributes=Object.entries(mesh.geometry.attributes).map(([k,a])=>`${k}:${a.itemSize}:${a.normalized}`).sort().join(',');
    const key=[mesh.parent.uuid,id,mesh.material.uuid,mesh.castShadow,mesh.receiveShadow,mesh.renderOrder,attributes].join('|');
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(mesh);
  });
  let savedCalls=0;
  for(const meshes of groups.values()) {
    if(meshes.length<2)continue;
    const first=meshes[0];
    const geometries=meshes.map(mesh=>{
      const g=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
      g.applyMatrix4(mesh.matrix);return g;
    });
    const geometry=mergeGeometries(geometries);
    geometries.forEach(g=>g.dispose());
    if(!geometry)continue;
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
    const batch=new THREE.Mesh(geometry,first.material);
    batch.name='Static parts / '+first.name;
    let owner=first;while(!owner.userData.partId)owner=owner.parent;
    batch.userData.partId=owner.userData.partId;
    batch.castShadow=first.castShadow;batch.receiveShadow=first.receiveShadow;batch.renderOrder=first.renderOrder;
    first.parent.add(batch);
    meshes.forEach(mesh=>{mesh.visible=false;mesh.userData.batchedSource=true;});
    savedCalls+=meshes.length-1;
  }
  root.traverse(o=>{if(o.isMesh){o.updateMatrix();o.matrixAutoUpdate=false;}});
  return savedCalls;
}
