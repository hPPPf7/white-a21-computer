import { routedCurve } from './routing.js';
import { inspectClearance } from './clearance.js';
import { refineCase } from './case-details.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';
import { createInspector } from './inspector.js';
import { batchStaticParts } from './performance.js';
import { refineHardware } from './details.js';
// Dimensions use 1 scene unit = 100 mm. The invoice is the build specification.
export const specification = Object.freeze({
  cpu: 'Intel Core i5-13500', cores: 14, threads: 20,
  motherboard: 'ASUS TUF GAMING B760M-PLUS WIFI',
  memory: 'ADATA XPG Lancer DDR5-5600 CL36 32GB (2 × 16GB), white',
  storage: ['UMAX M1500 1TB PCIe 4.0', 'KLEVV CRAS C710 1TB PCIe 3.0'],
  cooler: 'Apexgaming NANOCOOL PRO 240 ARGB, white',
  gpu: 'GIGABYTE GeForce RTX 4070 SUPER AERO OC 12G',
  case: 'ASUS A21, white', psu: 'Seasonic FOCUS GX-850 ATX 3.0, white',
});
const canvas = document.querySelector('#scene');
const compactDevice = window.matchMedia('(max-width: 900px), (pointer: coarse)').matches;
const maxPixelRatio = compactDevice ? 1 : 1.35;
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
renderer.shadowMap.enabled = !compactDevice;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d9dee1');
scene.fog = new THREE.Fog('#d9dee1', 22, 55);
const pmrem = new THREE.PMREMGenerator(renderer);
const environment = new RoomEnvironment();
scene.environment = pmrem.fromScene(environment, 0.04).texture;
environment.dispose();
pmrem.dispose();
scene.environmentIntensity = 0.72;

const camera = new THREE.PerspectiveCamera(35, 1, 0.04, 100);
const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 2.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.rotateSpeed = 0.65;
controls.panSpeed = 0.75;
controls.zoomSpeed = 0.8;
controls.minDistance = 2.3;
controls.maxDistance = 23;
controls.maxPolarAngle = Math.PI - 0.02;
controls.minPolarAngle = 0.02;
controls.screenSpacePanning = true;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
canvas.addEventListener('contextmenu', event => event.preventDefault());

const pc = new THREE.Group();
pc.name = 'ASUS A21 / i5-13500 / 14C 20T';
pc.userData.specification = specification;
scene.add(pc);
const mat = (color, metalness = 0, roughness = 0.5, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
const white = mat('#f4f4f0', 0.34, 0.3);
const ivory = mat('#dddeda', 0.3, 0.45);
const silver = mat('#bfc6cb', 0.82, 0.28);
const dark = mat('#20262a', 0.25, 0.48);
const pcb = mat('#252c2c', 0.15, 0.73);
const black = mat('#111619', 0.1, 0.65);
const rubber = mat('#454b4d', 0, 0.95);
const gold = mat('#b69b59', 0.78, 0.38);
const cyan = mat('#b0f8ff', 0.25, 0.25, { emissive: '#42d9ed', emissiveIntensity: 1.8 });
const purple = mat('#d7bbff', 0.2, 0.3, { emissive: '#9e68fc', emissiveIntensity: 1.3 });
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
let currentPart = 'case';
function identify(mesh) { mesh.userData.partId = currentPart; return mesh; }
function box(name, size, position, material = white, radius = 0, parent = pc) {
  const geometry = radius ? new RoundedBoxGeometry(...size, 2, radius) : boxGeo;
  const mesh = new THREE.Mesh(geometry, material);
  if (!radius) mesh.scale.set(...size);
  mesh.position.set(...position); mesh.name = name;
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(identify(mesh)); return mesh;
}
function batchBoxes(name, size, positions, material = white, parent = pc) {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(...size), material, positions.length);
  const transform = new THREE.Object3D();
  positions.forEach((position, index) => {
    transform.position.set(...position);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(identify(mesh));
  return mesh;
}
function cylinder(name, radius, depth, position, material, parent = pc) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, 24), material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position); mesh.name = name;
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(identify(mesh)); return mesh;
}
function torus(radius, thickness, position, material, parent = pc) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, thickness, 6, 32), material);
  mesh.position.set(...position); parent.add(identify(mesh)); return mesh;
}
const labelTextureCache = new Map();
function label(text, width, height, position, options = {}, parent = pc) {
  const color = options.color || '#5d666c';
  const weight = options.weight || 600;
  const fontSize = options.fontSize || 88;
  const textureKey = JSON.stringify([text, color, weight, fontSize]);
  let texture = labelTextureCache.get(textureKey);
  if (!texture) {
    const c = document.createElement('canvas'); c.width = 512; c.height = 128;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = color;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${weight} ${fontSize / 2}px Arial, sans-serif`;
    ctx.fillText(text, 256, 66, 495);
    texture = new THREE.CanvasTexture(c); texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    labelTextureCache.set(textureKey, texture);
  }
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, opacity: options.opacity ?? 1 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position); mesh.name = text;
  if (options.rotation) mesh.rotation.set(...options.rotation);
  parent.add(identify(mesh)); return mesh;
}
function screw(position, parent = pc) {
  cylinder('Captive screw', 0.028, 0.013, position, silver, parent);
  box('Screw slot', [0.028, 0.005, 0.002], [position[0], position[1], position[2] + 0.008], dark, 0, parent);
}
function cable(name, points, radius = 0.04, material = ivory, parent = pc) {
  const path = routedCurve(points, name.includes('coolant') ? .55 : .28);
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, Math.max(32, points.length * 6), radius, 8, false), material);
  mesh.castShadow = true; mesh.name = name; parent.add(identify(mesh)); return path;
}
// Cut real apertures rather than painting a dark patch on a solid panel.
function cutPanel(name, width, height, thickness, position, holes, rotation = [0, 0, 0], material = ivory) {
  const s = new THREE.Shape();
  s.moveTo(-width/2,-height/2); s.lineTo(width/2,-height/2);
  s.lineTo(width/2,height/2); s.lineTo(-width/2,height/2); s.closePath();
  for (const [x,y,w,h] of holes) {
    const hole = new THREE.Path();
    hole.moveTo(x-w/2,y-h/2);hole.lineTo(x-w/2,y+h/2);
    hole.lineTo(x+w/2,y+h/2);hole.lineTo(x+w/2,y-h/2);hole.closePath();s.holes.push(hole);
  }
  const geo = new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:false});geo.translate(0,0,-thickness/2);
  const mesh = new THREE.Mesh(geo,material);mesh.name=name;mesh.position.set(...position);mesh.rotation.set(...rotation);
  mesh.castShadow=true;mesh.receiveShadow=true;pc.add(identify(mesh));return mesh;
}
function grommet(name, position, width, height, rotation = [0,0,0]) {
  return cutPanel(name,width,height,0.045,position,[[0,0,width-0.07,height-0.07]],rotation,rubber);
}
function perforatedMaterial(w, h, tint = '#f0f1ef') {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = '#000';
  for (const [x, y] of [[32, 32], [96, 96]]) { ctx.beginPath(); ctx.arc(x, y, 32, 0, Math.PI * 2); ctx.fill(); }
  const texture = new THREE.CanvasTexture(c);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(w / 0.095, h / 0.095);
  texture.anisotropy = 8;
  return mat(tint, 0.35, 0.45, { alphaMap: texture, alphaTest: 0.5, side: THREE.DoubleSide });
}
function meshPanel(name, w, h, position, rotation, tint) {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), perforatedMaterial(w, h, tint));
  p.name = name; p.position.set(...position); p.rotation.set(...rotation);
  p.receiveShadow = true; pc.add(identify(p)); return p;
}

// Powder-coated chassis. X: depth, Y: height, Z: width; glass faces +Z.
box('Floor of chassis', [4.65, 0.07, 2.2], [0, 0.27, 0]);
box('Steel right side panel', [4.65, 4.23, 0.045], [0, 2.435, -1.09], white, 0.025);
cutPanel('Motherboard tray with cable apertures',3.87,3.46,0.035,[-0.23,2.66,-0.82],[
  [1.38,0.49,0.40,0.76],[-0.97,1.48,0.59,0.28],[1.38,-1.29,0.40,0.55],
]);
grommet('24-pin routing grommet',[1.15,3.15,-0.82],0.43,0.79);
grommet('EPS routing grommet',[-1.20,4.14,-0.82],0.62,0.31);
grommet('Front I/O routing grommet',[1.15,1.37,-0.82],0.43,0.58);
for (const x of [-2.29, 2.29]) {
  for (const z of [-1.06, 1.06]) box('Chassis upright', [0.07, 4.3, 0.07], [x, 2.42, z], white, 0.012);
}
for (const y of [0.34, 4.5]) {
  for (const z of [-1.055, 1.055]) box('Side frame rail', [4.65, 0.105, 0.09], [0, y, z], white, 0.015);
}
for (const x of [-1.76, 1.76]) for (const z of [-0.79, 0.79]) {
  box('Case foot', [0.48, 0.2, 0.35], [x, 0.14, z], ivory, 0.05);
  box('Rubber foot pad', [0.41, 0.038, 0.29], [x, 0.027, z], rubber, 0.014);
}

// Front of the A21: full-height perforated mesh, a solid lower lip, no added fans.
for (const z of [-1.025, 1.025]) box('Front rolled edge', [0.11, 4.29, 0.10], [2.34, 2.425, z], white, 0.025);
for (const y of [0.44, 4.45]) box('Front cap', [0.12, 0.15, 2.06], [2.34, y, 0], white, 0.025);
meshPanel('A21 perforated front intake', 1.96, 3.88, [2.385, 2.45, 0], [0, Math.PI / 2, 0]);
label('ASUS', 0.40, 0.105, [2.403, 0.53, 0], { color: '#747c80', rotation: [0, Math.PI / 2, 0], weight: 700 });

// Top filter and recessed I/O controls are part of the physical model.
meshPanel('Top magnetic dust filter', 3.8, 1.78, [-0.24, 4.535, 0], [-Math.PI / 2, 0, 0]);
box('Top front I/O panel', [0.37, 0.07, 2.05], [2.10, 4.515, 0], white, 0.015);
const power = cylinder('Power button', 0.075, 0.018, [2.10, 4.566, 0.63], silver); power.rotation.x = 0;
const pRing = torus(0.055, 0.006, [2.10, 4.58, 0.63], cyan); pRing.rotation.x = -Math.PI / 2;
for (const z of [0.24, -0.05]) {
  box('USB-A socket', [0.079, 0.012, 0.165], [2.10, 4.56, z], dark, 0.01);
  box('USB 3 blue insert', [0.025, 0.014, 0.12], [2.10, 4.567, z], mat('#507287'));
}
for (const z of [-0.36, -0.55]) { const port = cylinder('3.5mm audio jack', 0.035, 0.012, [2.10, 4.565, z], black); port.rotation.x = 0; }

// Rear panel: ventilation, motherboard I/O, expansion covers, and PSU exhaust.
box('Rear panel', [0.055, 4.2, 2.10], [-2.29, 2.39, 0], ivory);
meshPanel('Rear exhaust grille', 1.25, 1.25, [-2.325, 3.62, 0.10], [0, -Math.PI / 2, 0], '#c5cccd');
box('Rear I/O inset', [0.07, 1.38, 0.39], [-2.335, 3.40, -0.74], silver, 0.018);
for (let i = 0; i < 6; i++) box('Rear USB and display port', [0.012, 0.10, 0.21], [-2.377, 2.88 + i * 0.16, -0.74], black, 0.01);
for (let i = 0; i < 4; i++) {
  box('PCI slot cover', [0.025, 0.14, 1.35], [-2.337, 1.35 + i * 0.20, 0.04], white, 0.008);
  for (let j = 0; j < 12; j++) box('PCI vent opening', [0.005, 0.035, 0.065], [-2.354, 1.35 + i * 0.20, -0.51 + j * 0.096], dark);
}
currentPart = 'psu';
box('PSU exhaust inset', [0.03, 0.60, 1.5], [-2.332, 0.66, -0.08], dark, 0.025);
meshPanel('PSU rear honeycomb', 1.40, 0.53, [-2.351, 0.66, -0.08], [0, -Math.PI / 2, 0], '#80898c');
box('IEC power socket', [0.04, 0.18, 0.27], [-2.378, 0.66, 0.37], black, 0.02);
box('Power rocker switch', [0.04, 0.13, 0.08], [-2.379, 0.68, 0.65], rubber, 0.01);

// PSU and its protective shroud.
currentPart = 'psu';
box('Seasonic FOCUS GX-850 white PSU', [1.4, 0.70, 1.50], [-1.53, 0.68, -0.12], white, 0.04);
label('Seasonic · FOCUS GX-850',1.10,0.20,[-1.53,0.68,0.639],{color:'#727e84'});
currentPart = 'case';
// The rear 15 mm remains open as a cable chase into the PSU compartment.
cutPanel('PSU shroud with through-hole and rear cable chase',4.38,1.87,0.045,[-0.04,1.075,0.08],[[1.25,-0.35,0.65,0.52]],[-Math.PI/2,0,0],white);
grommet('GPU power pass-through',[1.21,1.075,0.43],0.68,0.55,[-Math.PI/2,0,0]);
box('PSU shroud side', [4.38, 0.73, 0.038], [-0.04, 0.69, 0.945], white, 0.012);
label('ASUS', 0.49, 0.15, [-1.50, 0.67, 0.97], { color: '#a5adae' });
label('FOCUS GX · 850', 0.72, 0.12, [1.27, 0.55, 0.97], { color: '#9ba4a6', weight: 500 });
for (let i = 0; i < 24; i++) box('Shroud ventilation', [0.05, 0.003, 0.34], [-1.98 + i * 0.15, 1.1, -0.50], dark, 0.01);

// Micro-ATX motherboard: layered PCB, traces, sockets, heatsinks, and both SSDs.
currentPart = 'motherboard';
box('TUF GAMING B760M-PLUS WIFI PCB', [2.44, 2.44, 0.055], [-0.61, 2.75, -0.725], pcb, 0.022);
for (const x of [-1.76, 0.53]) for (const y of [1.60, 3.90]) screw([x, y, -0.681]);
const traceMat = mat('#626652', 0.5, 0.58);
for (let i = 0; i < 34; i++) {
  const x = -1.72 + (i % 17) * 0.13;
  box('Copper PCB signal trace', [0.007, 0.22 + (i % 4) * 0.06, 0.002], [x, 1.80 + Math.floor(i / 17) * 1.55, -0.694], traceMat);
}
for (let i = 0; i < 20; i++) {
  const x = -1.68 + (i % 10) * 0.22;
  box('Surface-mount component', [0.075, 0.04, 0.028], [x, 1.64 + Math.floor(i / 10) * 0.33, -0.66], black);
}
for (let i = 0; i < 9; i++) cylinder('Solid capacitor', 0.035, 0.085, [-1.61 + i * 0.21, 2.3, -0.61], silver);
box('I/O armor', [0.45, 1.14, 0.23], [-1.66, 3.31, -0.565], dark, 0.035);
box('VRM top heatsink', [1.24, 0.19, 0.2], [-0.67, 3.65, -0.57], silver, 0.016);
for (let i = 0; i < 10; i++) box('VRM fin', [0.024, 0.93, 0.05], [-1.845 + i * 0.04, 3.35, -0.42], silver);
label('TUF GAMING', 0.85, 0.13, [-0.68, 3.65, -0.455], { color: '#42494c' });
box('LGA1700 retention bracket', [0.69, 0.81, 0.05], [-0.72, 3.18, -0.645], silver, 0.02);
currentPart = 'cpu';
box('Intel Core i5-13500 · 14 cores · 20 threads', [0.43, 0.49, 0.035], [-0.72, 3.18, -0.596], silver, 0.02);
label('i5-13500', 0.36, 0.09, [-0.72, 3.22, -0.573], { color: '#414a50' });
for (const [y, name] of [[2.46, 'UMAX M1500 · 1TB'], [1.91, 'KLEVV C710 · 1TB']]) {
  currentPart = name.startsWith('UMAX') ? 'ssd1' : 'ssd2';
  box(name, [0.82, 0.22, 0.055], [-0.63, y, -0.65], dark, 0.012);
  box('M.2 heat spreader', [0.88, 0.18, 0.045], [-0.63, y, -0.605], silver, 0.014);
  label(name, 0.73, 0.095, [-0.63, y, -0.58], { color: '#454e54', weight: 500 });
  screw([-1.025, y, -0.575]);
}
currentPart = 'motherboard';
box('Chipset heatsink', [0.48, 0.40, 0.14], [0.21, 1.67, -0.64], dark, 0.02);
label('TUF', 0.30, 0.13, [0.21, 1.67, -0.56], { color: '#acb6b9' });
box('PCIe x16 reinforced slot', [1.69, 0.11, 0.10], [-0.88, 2.22, -0.625], silver, 0.014);
box('PCIe bottom slot', [0.83, 0.07, 0.08], [-1.14, 1.70, -0.625], black);

// Two white XPG Lancer modules, seated in alternating slots.
for (let i = 0; i < 4; i++) box('DIMM slot', [0.065, 1.33, 0.075], [0.06 + i * 0.15, 3.22, -0.627], black, 0.008);
currentPart = 'memory';
for (let i = 0; i < 2; i++) {
  const x = 0.20 + i * 0.30;
  box('XPG Lancer 16GB DDR5 white', [0.075, 1.29, 0.29], [x, 3.22, -0.462], white, 0.02);
  box('XPG metallic accent', [0.084, 0.48, 0.018], [x, 3.15, -0.307], silver, 0.008);
  box('Memory light diffuser', [0.069, 1.2, 0.029], [x, 3.22, -0.292], i ? purple : cyan, 0.018);
  label('XPG', 0.23, 0.067, [x, 3.17, -0.27], { color: '#495c65', rotation: [0, 0, Math.PI / 2] });
  for (const y of [2.56, 3.88]) box('DIMM locking tab', [0.10, 0.08, 0.15], [x, y, -0.56], ivory, 0.01);
}

// A detailed fan in local XY. Rotation axis is local Z.
const rotors = [];
function fan(name, position, size, rotation = [0, 0, 0], rgb = true, parent = pc) {
  const group = new THREE.Group(); identify(group); group.name = name; group.position.set(...position); group.rotation.set(...rotation); parent.add(group);
  const r = size * 0.435;
  for (const x of [-0.46, 0.46]) box('Fan frame edge', [size * 0.08, size, size * 0.20], [x * size, 0, 0], white, 0.025, group);
  for (const y of [-0.46, 0.46]) box('Fan frame edge', [size * 0.86, size * 0.08, size * 0.20], [0, y * size, 0], white, 0.025, group);
  torus(r, size * 0.035, [0, 0, 0.06], ivory, group);
  if (rgb) {
    const ringGeometry = new THREE.TorusGeometry(r * 0.965, size * 0.018, 8, 80);
    const colors = [];
    for (let i = 0; i < ringGeometry.attributes.position.count; i++) {
      const x = ringGeometry.attributes.position.getX(i), y = ringGeometry.attributes.position.getY(i);
      const color = new THREE.Color().setHSL(0.49 + 0.26 * (Math.sin(Math.atan2(y, x)) * 0.5 + 0.5), 0.7, 0.75);
      colors.push(color.r, color.g, color.b);
    }
    ringGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
    ring.position.z = size * 0.112; group.add(ring);
  }
  const rotor = new THREE.Group(); group.add(rotor); rotors.push(rotor);
  const shape = new THREE.Shape();
  shape.moveTo(0.12, 0); shape.bezierCurveTo(0.28, -0.10, 0.42, -0.04, 0.42, 0.12);
  shape.bezierCurveTo(0.35, 0.22, 0.20, 0.12, 0.11, 0.09); shape.closePath();
  const bladeGeometry = new THREE.ExtrudeGeometry(shape, { depth: 0.012, bevelEnabled: false, curveSegments: 12 });
  const bladeMat = rgb ? mat('#d7e8e9', 0.15, 0.42, { emissive: '#728cad', emissiveIntensity: 0.14, side: THREE.DoubleSide }) : ivory;
  const blades = new THREE.InstancedMesh(bladeGeometry, bladeMat, 9);
  const bladeTransform = new THREE.Object3D();
  for (let i = 0; i < 9; i++) {
    bladeTransform.scale.setScalar(size);
    bladeTransform.rotation.z = i * Math.PI * 2 / 9;
    bladeTransform.updateMatrix();
    blades.setMatrixAt(i, bladeTransform.matrix);
  }
  blades.instanceMatrix.needsUpdate = true;
  blades.computeBoundingSphere();
  rotor.add(blades);
  cylinder('Fan hub', size * 0.115, size * 0.17, [0, 0, 0.015], white, group);
  cylinder('Hub inset', size * 0.072, size * 0.006, [0, 0, size * 0.106], silver, group);
  for (const x of [-0.42, 0.42]) for (const y of [-0.42, 0.42]) screw([x * size, y * size, size * 0.109], group);
  return group;
}
currentPart = 'case';
fan('Rear 120mm case exhaust', [-2.16, 3.56, 0.17], 1.2, [0, Math.PI / 2, 0], false);

// 240 mm radiator and two downward-facing ARGB fans.
currentPart = 'cooler';
box('NANOCOOL PRO 240 radiator', [2.73, 0.27, 1.20], [-0.37, 4.25, 0.05], white, 0.035);
box('Radiator fin core', [2.43, 0.23, 1.07], [-0.37, 4.25, 0.05], dark);
batchBoxes('Radiator aluminum fin', [0.018, 0.225, 1.08], Array.from({length: 60}, (_, i) => [-1.55 + i * 0.040, 4.25, 0.05]), silver);
for (const z of [-0.565, 0.665]) box('Radiator white sidewall', [2.70, 0.27, 0.045], [-0.37, 4.25, z], white, 0.018);
for (const x of [-0.99, 0.25]) fan('NANOCOOL 120mm ARGB radiator fan', [x, 4.0, 0.05], 1.2, [Math.PI / 2, 0, 0]);
label('NANOCOOL', 0.73, 0.12, [-0.35, 4.25, 0.693], { color: '#8b9397', weight: 500 });

// CPU cold plate, illuminated pump face and sleeved tubes.
box('CPU cold plate in contact with heat spreader',[0.44,0.5,0.08],[-0.73,3.18,-0.55],silver,0.018);
box('NANOCOOL CPU water block', [0.66, 0.68, 0.34], [-0.73, 3.18, -0.38], white, 0.10);
for(const x of [-1.03,-0.43])for(const y of [2.86,3.5]) {
  box('Pump mounting lug',[0.11,0.12,0.17],[x,y,-0.57],silver,0.015);
  screw([x,y,-0.47]);
}
cylinder('Pump face metallic rim', 0.275, 0.055, [-0.73, 3.18, -0.19], silver);
torus(0.251, 0.015, [-0.73, 3.18, -0.152], cyan);
cylinder('Pump glass face', 0.233, 0.015, [-0.73, 3.18, -0.145], mat('#eaf1f3', 0.4, 0.22));
label('APEX', 0.32, 0.105, [-0.73, 3.22, -0.131], { color: '#53636c', weight: 700 });
label('i5-13500', 0.30, 0.074, [-0.73, 3.11, -0.130], { color: '#6d7a80', weight: 500 });
// Physical identification on the cooler mount, without a screen-space overlay.
label('14 CORE / 20 THREAD', 0.55, 0.073, [-0.73, 2.79, -0.38], { color: '#becacd', weight: 500 });
const sleeve = mat('#c6cdce', 0.08, 0.72);
// Fittings use the same endpoints as the hoses, including a straight strain-relief section.
const connections = [];
function fitting(name, position, direction, radius = 0.076) {
  const m = cylinder(name,radius,0.15,position,silver);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(...direction));
  for(const offset of [-0.055,0.055]) {
    const ring = torus(radius,0.009,position,rubber);
    ring.position.addScaledVector(new THREE.Vector3(...direction),offset);
    ring.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),new THREE.Vector3(...direction));
  }
}
for (let i = 0; i < 2; i++) {
  const y=3.08+i*0.22, z=-0.19+i*0.39;
  fitting('Pump swivel hose fitting',[-0.37,y,-0.34],[1,0,0]);
  fitting('Radiator end-tank hose fitting',[1.015,4.25,z],[1,0,0]);
  const points=[[-0.36,y,-0.34],[-0.18,y,-0.34],[0.17,y-0.16,0.14+i*0.22],
    [0.84+i*0.10,2.97+i*0.25,0.32+i*0.23],[1.48+i*0.13,3.32+i*0.22,0.32+i*0.23],
    [1.50+i*0.13,3.94+i*0.12,z],[1.28,4.25,z],[1.01,4.25,z]];
  const path=cable('Continuous coolant hose '+i,points,0.057,sleeve);
  connections.push({name:'Coolant '+i,from:'Pump swivel',to:'Radiator end tank',start:points[0],end:points.at(-1)});
  const ringCount = 48;
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.0575, 0.002, 6, 24), ivory, ringCount - 1);
  const ringTransform = new THREE.Object3D();
  for (let j = 1; j < ringCount; j++) {
    const t = j / ringCount;
    ringTransform.position.copy(path.getPointAt(t));
    ringTransform.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), path.getTangentAt(t).normalize());
    ringTransform.updateMatrix();
    rings.setMatrixAt(j - 1, ringTransform.matrix);
  }
  rings.instanceMatrix.needsUpdate = true;
  rings.computeBoundingSphere();
  rings.name = 'Coolant hose braided rings ' + i;
  pc.add(identify(rings));
}

// Horizontal triple-fan AERO graphics card, with the fan faces underneath.
currentPart = 'gpu';
const gpu = new THREE.Group(); identify(gpu); gpu.name = specification.gpu; pc.add(gpu);
box('GPU PCB seated into PCIe slot',[2.84,0.035,1.19],[-0.54,2.22,-0.015],pcb,0,gpu);
box('PCIe gold edge inside motherboard slot',[1.63,0.037,0.11],[-0.88,2.22,-0.624],gold,0,gpu);
box('GPU rear mounting bracket',[0.29,0.43,1.10],[-2.17,2.13,0.035],silver,0.012,gpu);
box('RTX 4070 SUPER heatsink', [2.98, 0.36, 1.09], [-0.54, 2.12, 0.04], silver, 0.025, gpu);
batchBoxes('GPU heatsink fin gap', [0.012, 0.32, 1.09], Array.from({length: 74}, (_, i) => [-1.99 + i * 0.039, 2.11, 0.045]), dark, gpu);
box('AERO white upper backplate', [3.0, 0.055, 1.13], [-0.54, 2.34, 0.04], white, 0.025, gpu);
box('AERO bottom fan shroud', [3.0, 0.07, 1.15], [-0.54, 1.90, 0.04], white, 0.028, gpu);
box('AERO side upper rail', [3.0, 0.10, 0.07], [-0.54, 2.29, 0.62], white, 0.024, gpu);
box('AERO side lower rail', [3.0, 0.09, 0.07], [-0.54, 1.94, 0.62], white, 0.024, gpu);
box('AERO illuminated badge', [0.74, 0.27, 0.05], [-0.91, 2.12, 0.63], white, 0.025, gpu);
label('AERO', 0.58, 0.185, [-0.91, 2.12, 0.66], { color: '#7597af', weight: 500 }, gpu);
label('GEFORCE RTX', 0.82, 0.13, [0.27, 2.26, 0.66], { color: '#657177', weight: 700 }, gpu);
label('AERO', 0.66, 0.20, [-0.88, 2.373, 0.02], { color: '#a2aaad', rotation: [-Math.PI / 2, 0, 0], weight: 500 }, gpu);
for (let i = 0; i < 3; i++) fan('WINDFORCE GPU fan', [-1.51 + i * 0.98, 1.86, 0.045], 0.94, [Math.PI / 2, 0, 0], false, gpu);
for (let i = 0; i < 9; i++) box('GPU backplate flow-through slot', [0.024, 0.004, 0.65], [0.46 + i * 0.046, 2.37, 0.06], dark, 0, gpu);
box('Graphics card support', [0.085, 0.77, 0.1], [0.65, 1.48, 0.29], silver, 0.015);
box('GPU support foot', [0.34, 0.025, 0.30], [0.65, 1.11, 0.29], white, 0.015);

// Every cable runs to a modeled socket, including the hidden part inside the PSU bay.
currentPart = 'wiring';
function socket(name,position,size=[0.15,0.13,0.12]) {
  const previous=currentPart;
  currentPart = /^PSU/.test(name) ? 'psu' : /^GPU/.test(name) ? 'gpu'
    : /^(Motherboard|CPU_|AIO_PUMP|CHA_FAN|5V|USB 3 front|F_PANEL|AAFP)/.test(name) ? 'motherboard'
    : /^(Pump|Radiator)/.test(name) ? 'cooler' : /^Rear fan/.test(name) ? 'case' : 'wiring';
  const mesh=box(name,size,position,black,0.012);
  box(name+' locking latch',[size[0]*0.45,0.027,0.035],[position[0],position[1]+size[1]/2,position[2]+size[2]/2],ivory,0.004);
  currentPart=previous;
  return mesh;
}
function wire(name,from,to,points,radius=0.012,material=white) {
  const path=cable(name,points,radius,material);
  connections.push({name,from:from.name,to:to.name,start:points[0],end:points.at(-1),fromMesh:from,toMesh:to,path,radius});
  return path;
}
const gpuSocket=socket('GPU 16-pin 12VHPWR socket',[0.13,2.34,0.47],[0.29,0.15,0.19]);
const gpuPlug=socket('GPU 12VHPWR latched plug',[0.13,2.47,0.47],[0.29,0.15,0.19]);
const psuGpu=socket('PSU CPU/PCIe modular plug A',[-0.78,0.70,0.28],[0.19,0.17,0.23]);
const psuGpuB=socket('PSU CPU/PCIe modular plug B',[-0.78,0.70,0.03],[0.19,0.17,0.23]);
for(let i=0;i<12;i++) {
  const col=i%6,row=Math.floor(i/6), dx=(col-2.5)*0.034;
  wire('GPU power conductor '+i,gpuPlug,i<6?psuGpu:psuGpuB,
    [[0.13+dx,2.52,0.44+row*0.05],[0.13+dx,2.85,0.44+row*0.05],
     [0.45+dx,2.95,0.72+row*0.05],[0.99+dx,2.59,0.76+row*0.05],
     [1.25+dx,1.65,0.53+row*0.05],[1.25+dx,1.08,0.40+row*0.05],
     [1.25+dx,0.84,0.40+row*0.05],[0.75,0.63+dx,0.28-row*0.25],
     [-0.76,0.70+dx*0.50,0.28-row*0.25]],0.014);
}
for(const [x,y,z] of [[0.13,2.71,0.465],[1.25,1.65,0.555],[1.25,1.20,0.45]])
  box('GPU fitted cable comb',[0.24,0.035,0.13],[x,y,z],ivory,0.008);
// Four thin sense conductors occupy the smaller row on the same connector.
for(let i=0;i<4;i++)wire('12VHPWR sense '+i,gpuPlug,psuGpu,
 [[0.08+i*0.032,2.51,0.54],[0.08+i*0.032,2.85,0.54],[0.43+i*0.018,2.98,0.84],
  [1.0+i*0.016,2.55,0.85],[1.3,1.5,0.59],[1.3,1.07,0.5],[1.3,0.82,0.5],[-0.76,0.72,0.32]],0.006,ivory);

const atx=socket('Motherboard ATX_PWR 24-pin',[0.58,3.12,-0.585],[0.12,0.49,0.23]);
const psuAtx=socket('PSU motherboard modular bank',[-0.78,0.69,-0.43],[0.19,0.25,0.55]);
for(let i=0;i<24;i++) {
  const dy=((i%12)-5.5)*0.032,row=Math.floor(i/12);
  wire('ATX 24-pin conductor '+i,atx,psuAtx,
   [[0.58+row*0.025,3.12+dy,-0.51],[0.73,3.12+dy,-0.28-row*0.037],
    [0.98,3.12+dy,-0.29-row*0.037],[1.15+row*0.03,3.12+dy,-0.55],
    [1.15+row*0.03,3.12+dy,-0.94],[1.15+row*0.03,2.67+dy,-0.96],
    [1.12+row*0.03,0.82+dy*0.3,-0.96],[0.66,0.69+dy*0.3,-0.64],[-0.76,0.69+dy*0.48,-0.57+row*0.25]],0.012);
}
box('ATX fitted cable comb',[0.037,0.42,0.11],[0.93,3.12,-0.31],ivory,0.008);
const eps=socket('Motherboard ATX_12V 8-pin',[-1.24,3.82,-0.595],[0.30,0.12,0.20]);
const psuEps=socket('PSU CPU EPS modular plug',[-0.78,0.88,-0.14],[0.19,0.13,0.24]);
for(let i=0;i<8;i++) {
  const dx=((i%4)-1.5)*0.046,row=Math.floor(i/4);
  wire('CPU EPS12V conductor '+i,eps,psuEps,
    [[-1.24+dx,3.83,-0.54+row*0.025],[-1.24+dx,3.82,-0.54+row*0.025],[-1.24+dx,3.82,-0.66],
     [-1.24+dx,4.14,-0.66],[-1.24+dx,4.14,-0.96],[-1.24+dx,3.73,-0.98],
     [-0.68+dx,1.0,-0.98],[-0.68+dx,0.80,-0.98],[-0.38,0.78,-0.35],[-0.76,0.88+row*0.025,-0.14+dx]],0.012);
}

// Fan PWM, pump power and addressable lighting are separate circuits.
const cpuFan=socket('CPU_FAN header',[-0.40,3.91,-0.615]);
const cpuOpt=socket('CPU_OPT header',[-0.60,3.91,-0.615]);
const pumpHeader=socket('AIO_PUMP header',[-0.18,3.91,-0.615]);
const chassisFan=socket('CHA_FAN header',[-1.67,2.63,-0.615]);
const argb=socket('5V ADD_GEN2 header',[0.48,2.45,-0.615]);
const pumpLead=socket('Pump power lead',[-0.90,3.565,-0.30],[0.10,0.07,0.10]);
wire('Pump power to AIO_PUMP',pumpLead,pumpHeader,[[-0.90,3.565,-0.30],[-0.90,3.61,-0.30],[-0.18,3.61,-0.30],[-0.18,3.81,-0.30],[-0.18,3.81,-0.67],[-0.18,3.91,-0.58]],0.016,dark);
for(const [x,header] of [[-0.99,cpuOpt],[0.25,cpuFan]]) {
  const lead=socket('Radiator fan PWM lead '+x,[x+0.53,4.0,-0.62],[0.09,0.08,0.10]);
  wire('Radiator fan to '+header.name,lead,header,[[x+0.53,4.0,-0.62],[x+0.53,4.08,-0.67],[header.position.x,4.08,-0.67],[header.position.x,3.91,-0.58]],0.014,dark);
}
const rearLead=socket('Rear fan PWM lead',[-1.985,3.04,-0.35],[0.10,0.10,0.12]);
wire('Rear fan to CHA_FAN',rearLead,chassisFan,[[-1.985,3.04,-0.35],[-1.98,2.88,-0.29],[-1.95,2.58,-0.29],[-1.67,2.58,-0.35],[-1.67,2.63,-0.58]],0.016,dark);
const lightSplit=socket('ARGB splitter junction',[0.96,3.80,-0.66],[0.17,0.08,0.10]);
wire('5V ARGB main harness',argb,lightSplit,[[0.48,2.45,-0.58],[0.78,2.45,-0.58],[0.78,3.80,-0.58],[0.78,4.00,-0.67],[0.96,3.95,-0.66],[0.96,3.80,-0.66]],0.013,ivory);
for(const x of [-0.99,0.25]) {
  const led=socket('Radiator fan ARGB lead '+x,[x+0.58,4.0,0.56],[0.07,0.08,0.10]);
  wire('Fan ARGB branch '+x,lightSplit,led,[[0.96,3.8,-0.66],[1.02,3.99,-0.67],[x+0.76,3.99,-0.67],[x+0.76,3.99,0.56],[x+0.58,4.0,0.56]],0.012,ivory);
}
const pumpRgb=socket('Pump ARGB lead',[-0.55,3.49,-0.39],[0.10,0.07,0.10]);
wire('Pump ARGB branch',lightSplit,pumpRgb,[[0.96,3.8,-0.66],[0.85,3.71,-0.22],[-0.25,3.70,-0.22],[-0.55,3.49,-0.39]],0.012,ivory);

// Front-panel PCB touches the underside of the USB, audio and power controls.
const io=box('Front I/O circuit board',[0.27,0.035,1.50],[2.1,4.47,0.04],pcb);
io.userData.partId='case';
for(const [name,pos,size] of [
 ['USB 3 front panel header',[0.55,2.65,-0.59],[0.15,0.23,0.17]],
 ['F_PANEL power switch and LED',[0.40,1.61,-0.59],[0.25,0.10,0.17]],
 ['AAFP front HD audio',[-1.61,1.61,-0.59],[0.19,0.10,0.17]],
]) {
  const header=socket(name,pos,size);
  const audio=name.startsWith('AAFP');
  const start=[2.1,4.47,audio?-0.42:name.startsWith('USB')?0.10:0.59];
  const points=[start,[1.94,4.32,start[2]],[1.86,4.16,-0.60],[1.86,3.0,-0.66],
   [1.83,1.37,-0.67],[1.15,1.37,-0.69],
   [audio?-1.45:pos[0]+0.19,1.40,-0.59],[pos[0],pos[1],-0.56]];
  // USB routes along the board's right edge, avoiding the GPU and DIMM slots.
  if(name.startsWith('USB')) points.splice(4,3,[1.60,2.53,-0.66],[0.83,2.54,-0.53]);
  wire(name+' harness',io,header,points,name.startsWith('USB')?0.026:0.015,dark);
}

refineHardware({pc,renderer});

// Low-reflection tempered glass preserves the view of actual geometry.
currentPart = 'case';
const glass = new THREE.MeshPhysicalMaterial({
  color: '#d5edf2', metalness: 0, roughness: 0.10, transparent: true,
  opacity: 0.075, transmission: 0, ior: 1.5, reflectivity: 0.35,
  clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide, depthWrite: false,
});
const panel = box('Tempered glass left side', [4.49, 4.08, 0.028], [-0.035, 2.42, 1.103], glass, 0.012);
panel.castShadow = false; panel.renderOrder = 10;
const edgeMaterial = mat('#a5bfc4', 0.45, 0.22, { transparent: true, opacity: 0.55 });
for (const y of [0.39, 4.46]) box('Polished glass edge', [4.48, 0.012, 0.018], [-0.035, y, 1.115], edgeMaterial);
for (const x of [-2.27, 2.20]) box('Polished glass edge', [0.012, 4.07, 0.018], [x, 2.42, 1.115], edgeMaterial);
for (const x of [-2.18, 2.12]) for (const y of [0.49, 4.35]) screw([x, y, 1.133]);

// Neutral photography studio, with restrained cool light inside the case.
scene.add(new THREE.HemisphereLight('#f0f6ff', '#8a8580', 0.85));
function areaLight(position, color, intensity, width, height) {
  const light = new THREE.RectAreaLight(color, intensity, width, height);
  light.position.set(...position); light.lookAt(0, 2, 0); scene.add(light);
}
areaLight([0, 7, 5], '#ffffff', 3, 5, 5);
areaLight([-5, 3, 2], '#dcf0ff', 2, 4, 5);
areaLight([4, 5, -3], '#fff5e8', 3, 3, 5);
const key = new THREE.DirectionalLight('#fffaf2', 1.8);
key.position.set(3, 8, 5); key.castShadow = true;
key.shadow.mapSize.set(1024, 1024);
Object.assign(key.shadow.camera, { left: -6, right: 6, top: 7, bottom: -5, near: 0.5, far: 20 });
key.shadow.normalBias = 0.025; key.shadow.bias = -0.0002; key.shadow.radius = 4;
scene.add(key);
for (const [pos, color] of [[[0.1, 3.85, 0.4], '#a785ff'], [[-1.0, 3.65, 0.4], '#8aebff']]) {
  const light = new THREE.PointLight(color, 0.9, 3, 2); light.position.set(...pos); pc.add(light);
}
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), mat('#cdd3d6', 0, 0.86));
floor.rotation.x = -Math.PI / 2; floor.position.y = 0.003; floor.receiveShadow = true; scene.add(floor);
// Soft contact shadow adds weight without a visible platform or UI.
const contactCanvas = document.createElement('canvas'); contactCanvas.width = contactCanvas.height = 128;
const cc = contactCanvas.getContext('2d'); const grad = cc.createRadialGradient(64, 64, 15, 64, 64, 64);
grad.addColorStop(0, 'rgba(20,30,36,0.28)'); grad.addColorStop(1, 'rgba(20,30,36,0)');
cc.fillStyle = grad; cc.fillRect(0, 0, 128, 128);
const contact = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 4.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(contactCanvas), transparent: true, depthWrite: false }));
contact.rotation.x = -Math.PI / 2; contact.position.y = 0.011; scene.add(contact);

refineCase(pc);
batchStaticParts(pc, rotors);
let hyperion = null;
const builds=[
  {pc,title:'WHITE A21',subtitle:'i5-13500 / RTX 4070 SUPER',specification,target:new THREE.Vector3(0,2.2,0),distance:12.6},
  null, null,
];
async function ensureBuild(index) {
  if (builds[index]) return builds[index];
  if(index===2){
    const {createTurret}=await import('./turret.js');
    const turret=createTurret(renderer);turret.pc.visible=false;scene.add(turret.pc);builds[2]=turret;return turret;
  }
  const { createHyperion } = await import('./hyperion.js');
  hyperion = createHyperion(renderer);
  hyperion.pc.visible = false;
  scene.add(hyperion.pc);
  builds[1] = {
    ...hyperion,
    views:{gpu:[.65,.25,1],lcdPack:[.45,-.65,1],lcdSingle:[1,.2,.45],ledPack:[1,.15,.30],strimer24:[.3,.2,1],strimerGpu:[.3,.2,1]},
  };
  return builds[index];
}
let buildIndex=0;
let interacted = false;
let inspector = null;
let controlActive = false;
let lastControlChange = -Infinity;
controls.addEventListener('change', () => { lastControlChange = performance.now(); });
controls.addEventListener('start', () => { interacted = true; controlActive = true; });
controls.addEventListener('end', () => { controlActive = false; });
function frame() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
  if (!interacted && !inspector?.selected) {
    const distance = Math.max(builds[buildIndex].distance, builds[buildIndex].distance * .82 / camera.aspect);
    controls.target.copy(builds[buildIndex].target);
    controls.maxDistance = Math.max(23, distance * 1.5);
    camera.position.copy(new THREE.Vector3(0.66, 0.34, 0.88).normalize().multiplyScalar(distance).add(controls.target));
  }
  controls.update();
}
window.addEventListener('resize', frame); frame();
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
inspector = createInspector({
  THREE, pc, camera, controls, canvas, reduceMotion,
  invalidateShadows: () => { renderer.shadowMap.needsUpdate = true; },
});
const selector=document.createElement('nav');
selector.className='build-selector';selector.setAttribute('aria-label','切換主機');
selector.innerHTML='<button class="build-arrow" id="previous-build" aria-label="上一台主機">‹</button><div class="build-identity" aria-live="polite"><span class="build-index">01 / 03</span><strong class="build-title">WHITE A21</strong><span class="build-subtitle">i5-13500 / RTX 4070 SUPER</span></div><button class="build-arrow" id="next-build" aria-label="下一台主機">›</button>';
document.body.append(selector);
let switchingBuild = false;
async function switchBuild(index) {
  index=(index+builds.length)%builds.length;
  if(index===buildIndex || switchingBuild)return;
  switchingBuild = true;
  const arrows = [...selector.querySelectorAll('.build-arrow')];
  const subtitle = selector.querySelector('.build-subtitle');
  arrows.forEach(button => { button.disabled = true; });
  subtitle.textContent = '載入 3D 模型…';
  let next;
  try {
    next = await ensureBuild(index);
  } catch (error) {
    console.error('Unable to load build', error);
    subtitle.textContent = '模型載入失敗，請重新整理頁面';
    return;
  } finally {
    switchingBuild = false;
    arrows.forEach(button => { button.disabled = false; });
  }
  inspector.setBuild(next);
  builds[buildIndex].pc.visible=false;next.pc.visible=true;
  buildIndex=index;interacted=true;
  renderer.shadowMap.needsUpdate = true;
  const distance=Math.max(next.distance,next.distance*.82/camera.aspect);
  controls.minDistance=2.3;controls.maxDistance=Math.max(30,distance*1.5);
  inspector.moveCamera(new THREE.Vector3(.66,.34,.88).normalize().multiplyScalar(distance).add(next.target),next.target.clone());
  selector.querySelector('.build-index').textContent=String(index+1).padStart(2,'0')+' / '+String(builds.length).padStart(2,'0');
  selector.querySelector('.build-title').textContent=next.title;
  selector.querySelector('.build-subtitle').textContent=next.subtitle;
  document.title='computer · '+next.title;
  canvas.setAttribute('aria-label',next.title+' 3D 主機模型。拖曳旋轉，右鍵平移，滾輪縮放。');
}
selector.querySelector('#previous-build').addEventListener('click',()=>switchBuild(buildIndex-1));
selector.querySelector('#next-build').addEventListener('click',()=>switchBuild(buildIndex+1));
let lastTime = 0;
let lastRenderTime = 0;
renderer.shadowMap.needsUpdate = true;
renderer.setAnimationLoop(time => {
  if (document.hidden) {
    lastTime = time;
    lastRenderTime = time;
    return;
  }
  // Keep wheel zoom and the damping tail smooth after the pointer is released.
  const targetFps = controlActive || inspector?.moving || time - lastControlChange < 180 ? 60 : 30;
  if (lastRenderTime && time - lastRenderTime < 1000 / targetFps - 1) return;
  const dt = Math.min((time - lastTime) / 1000, 0.05); lastTime = time;
  lastRenderTime = time;
  if (!reduceMotion.matches) {
    if(buildIndex===0)rotors.forEach((rotor,i)=>{rotor.rotation.z-=dt*(i>2?1.8:1.2);});
    else builds[buildIndex]?.update(dt);
  }
  controls.update();
  inspector.update(time);
  floor.visible = camera.position.y > 0.05;
  contact.visible = floor.visible && !inspector.selected;
  renderer.render(scene, camera);
});

// Read-only inspection hook for render and input verification; no on-screen UI.
window.__computer = {
  get specification(){return builds[buildIndex].specification;},
  get build(){return {index:buildIndex,title:builds[buildIndex].title,count:builds.length,visibleBuilds:builds.map(b=>b?.pc.visible??false),fanCounts:builds[buildIndex]?.fanCounts??null};},
  inspector: inspector.inspect,
  clearance:()=>inspectClearance(builds[buildIndex].pc),
  connections: () => buildIndex!==0 ? (builds[buildIndex]?.connections()??[]) : connections.map(c => {
    const result={name:c.name,from:c.from,to:c.to,start:c.start,end:c.end};
    if(c.fromMesh) {
      pc.updateMatrixWorld(true);
      result.startSeated=new THREE.Box3().setFromObject(c.fromMesh).expandByScalar(0.004).containsPoint(new THREE.Vector3(...c.start));
      result.endSeated=new THREE.Box3().setFromObject(c.toMesh).expandByScalar(0.004).containsPoint(new THREE.Vector3(...c.end));
    }
    return result;
  }),
  inspect: () => ({ camera: camera.position.toArray(), target: controls.target.toArray(), distance: camera.position.distanceTo(controls.target), objects: builds[buildIndex].pc.children.length, renderFrame: renderer.info.render.frame, pixelRatio: renderer.getPixelRatio(), shadows: renderer.shadowMap.enabled, drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, canvas: [canvas.width, canvas.height] }),
};
