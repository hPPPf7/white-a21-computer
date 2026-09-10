import * as THREE from 'three';
// Rounded polyline stays inside the control-point hull: no spline overshoot
// through side panels when turning into the cable-management chamber.
export function routedCurve(points, bend = .32){
 const p=points.map(v=>new THREE.Vector3(...v)).filter((v,i,a)=>!i||v.distanceToSquared(a[i-1])>1e-10),curve=new THREE.CurvePath();let last=p[0];
 for(let i=1;i<p.length-1;i++){
  const cut=Math.min(bend,p[i].distanceTo(p[i-1])*.46,p[i].distanceTo(p[i+1])*.46);
  const a=p[i].clone().add(p[i-1].clone().sub(p[i]).normalize().multiplyScalar(cut));
  const b=p[i].clone().add(p[i+1].clone().sub(p[i]).normalize().multiplyScalar(cut));
  if(last.distanceToSquared(a)>1e-12)curve.add(new THREE.LineCurve3(last.clone(),a));
  curve.add(new THREE.QuadraticBezierCurve3(a,p[i],b));last=b;
 }
 curve.add(new THREE.LineCurve3(last.clone(),p.at(-1)));return curve;
}

// Parallel transport keeps individual conductors aligned around a shared bend.
export function bundledStrands(path, radius, count) {
 const steps=160,frames=path.computeFrenetFrames(steps,false);
 return Array.from({length:count},(_,i)=>{
  const inner=count===24&&i<8,ringCount=count===24?(inner?8:16):8;
  const angle=(count===24&&!inner?i-8:i)*Math.PI*2/ringCount;
  const offset=radius*(count===24?(inner?.34:.76):.70);
  const curve=new THREE.Curve();
  curve.getPoint=(t,target=new THREE.Vector3())=>{
   const index=Math.min(steps-1,Math.floor(t*steps)),alpha=t*steps-index;
   const normal=frames.normals[index].clone().lerp(frames.normals[index+1],alpha).normalize();
   const binormal=frames.binormals[index].clone().lerp(frames.binormals[index+1],alpha).normalize();
   return target.copy(path.getPointAt(t)).addScaledVector(normal,Math.cos(angle)*offset).addScaledVector(binormal,Math.sin(angle)*offset);
  };
  return curve;
 });
}
