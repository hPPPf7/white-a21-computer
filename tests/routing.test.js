import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Vector3, TubeGeometry } from 'three';
import { routedCurve, bundledStrands } from '../src/routing.js';

test('tight rear-chamber turn stays between side panel and tray', () => {
  const points = [[.85,4.18,-.94],[.85,4.18,-1.24],[.85,1.02,-1.24],[.42,.79,-.59]];
  const curve = routedCurve(points);
  const bounds = new Box3().setFromPoints(points.map(p => new Vector3(...p))).expandByScalar(1e-9);
  for (let i=0;i<=2000;i++) assert(bounds.containsPoint(curve.getPoint(i/2000)));
  assert(curve.getPoint(0).distanceTo(new Vector3(...points[0])) < 1e-9);
  assert(curve.getPoint(1).distanceTo(new Vector3(...points.at(-1))) < 1e-9);
  const geometry = new TubeGeometry(curve,36,.016,6,false);
  assert([...geometry.attributes.position.array].every(Number.isFinite));
  geometry.dispose();
});

test('duplicate route points keep connector endpoints and finite tangents', () => {
  const curve = routedCurve([[0,0,0],[0,0,0],[0,1,0],[0,1,0],[1,1,0]]);
  for (let i=0;i<=100;i++) assert(curve.getTangent(i/100).toArray().every(Number.isFinite));
  assert.deepEqual(curve.getPoint(0).toArray(),[0,0,0]);
  assert.deepEqual(curve.getPoint(1).toArray(),[1,1,0]);
});

test('conductors stay separated and within their audited bundle envelope', () => {
 const route=routedCurve([[0,0,0],[0,1,0],[1,2,0],[1,2,1]],.35);
 for(const count of [8,24]){
  const radius=.067,wireRadius=radius*(count===24?.12:.19),strands=bundledStrands(route,radius,count);
  for(let i=0;i<=120;i++){
   const t=i/120,center=route.getPointAt(t),points=strands.map(s=>s.getPoint(t));
   for(const point of points) assert(point.distanceTo(center)+wireRadius<=radius+1e-8);
   for(let a=0;a<points.length;a++)for(let b=a+1;b<points.length;b++) assert(points[a].distanceTo(points[b])>2*wireRadius);
  }
 }
});
