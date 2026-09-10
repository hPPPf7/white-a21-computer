import * as THREE from 'three';
// Rounded polyline stays inside the control-point hull: no spline overshoot
// through side panels when turning into the cable-management chamber.
export function routedCurve(points){
 const p=points.map(v=>new THREE.Vector3(...v)).filter((v,i,a)=>!i||v.distanceToSquared(a[i-1])>1e-10),curve=new THREE.CurvePath();let last=p[0];
 for(let i=1;i<p.length-1;i++){
  const cut=Math.min(.10,p[i].distanceTo(p[i-1])*.25,p[i].distanceTo(p[i+1])*.25);
  const a=p[i].clone().add(p[i-1].clone().sub(p[i]).normalize().multiplyScalar(cut));
  const b=p[i].clone().add(p[i+1].clone().sub(p[i]).normalize().multiplyScalar(cut));
  if(last.distanceToSquared(a)>1e-12)curve.add(new THREE.LineCurve3(last.clone(),a));
  curve.add(new THREE.QuadraticBezierCurve3(a,p[i],b));last=b;
 }
 curve.add(new THREE.LineCurve3(last.clone(),p.at(-1)));return curve;
}
