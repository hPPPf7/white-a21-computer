import * as THREE from 'three';

// NANCOOL PRO white: clipped-square infinity mirror, illuminated emblem and side lattice.
// The mirror is layered geometry, avoiding another render pass or realtime reflection probe.
export function createNancoolPump(root) {
 const group=new THREE.Group();group.name='NANCOOL PRO clipped-square mirror pump';group.userData.partId='cooler';group.position.set(-.73,3.18,-.38);root.add(group);
 const white=new THREE.MeshStandardMaterial({color:'#eceee9',metalness:.32,roughness:.30});
 const chrome=new THREE.MeshStandardMaterial({color:'#afb5bc',metalness:.88,roughness:.17});
 const black=new THREE.MeshStandardMaterial({color:'#080b12',metalness:.65,roughness:.16});
 const light=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
 const outline=(size,cut=.035)=>{const h=size/2;return [[-h+cut,-h],[h-cut,-h],[h,-h+cut],[h,h-cut],[h-cut,h],[-h+cut,h],[-h,h-cut],[-h,-h+cut]];};
 function shape(size,inner=0){const s=new THREE.Shape();outline(size).forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();if(inner){const h=new THREE.Path();outline(inner,.028).reverse().forEach(([x,y],i)=>i?h.lineTo(x,y):h.moveTo(x,y));h.closePath();s.holes.push(h);}return s;}
 function mesh(g,n,p,m){const o=new THREE.Mesh(g,m);o.name=n;o.userData.partId='cooler';o.position.set(...p);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;}
 function slab(n,size,depth,z,m,inner=0){const g=new THREE.ExtrudeGeometry(shape(size,inner),{depth,bevelEnabled:false});g.translate(0,0,-depth/2);return mesh(g,n,[0,0,z],m);}
 function glow(n,size,width,z,strength){const g=new THREE.ShapeGeometry(shape(size,size-width*2));const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const color=new THREE.Color().setHSL(.76+.15*(p.getX(i)/size-p.getY(i)/size),.8,.58).multiplyScalar(strength);c.push(color.r,color.g,color.b);}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));return mesh(g,n,[0,0,z],light);}
 slab('NANCOOL white chamfered pump housing',.70,.260,-.025,white);
 slab('NANCOOL mirror cavity walls',.69,.170,.180,white,.620);
 slab('NANCOOL dark mirror well',.620,.010,.140,black);
 slab('NANCOOL machined silver lip',.704,.012,.270,chrome,.674);
 slab('NANCOOL black perimeter bezel',.674,.009,.272,black,.614);
 for(let i=0;i<5;i++)glow('NANCOOL infinity mirror light frame '+i,.608-i*.048,.010-i*.001,.267-i*.024,Math.pow(.65,i));
 // Geometric G emblem with an open inward return, repeated in the mirror depth.
 const mark=new THREE.Shape();[[-.10,.11],[.105,.11],[.105,.057],[-.041,.057],[-.041,-.055],[.048,-.055],[.048,-.012],[.005,-.012],[.005,.036],[.106,.036],[.106,-.108],[-.10,-.108]].forEach(([x,y],i)=>i?mark.lineTo(x,y):mark.moveTo(x,y));mark.closePath();
 for(let i=3;i>=0;i--){const m=new THREE.MeshBasicMaterial({color:new THREE.Color('#a16aef').multiplyScalar(Math.pow(.58,i)),toneMapped:false});const g=new THREE.ExtrudeGeometry(mark,{depth:.004,bevelEnabled:false});const o=mesh(g,'NANCOOL reflected Apexgaming emblem '+i,[0,-i*.007,.222-i*.020],m);o.scale.setScalar(1-i*.065);}
 const glass=new THREE.MeshStandardMaterial({color:'#a5b0d3',metalness:.78,roughness:.10,transparent:true,opacity:.085,depthWrite:false});
 mesh(new THREE.ShapeGeometry(shape(.613)),'NANCOOL smoked mirror face',[0,0,.279],glass).castShadow=false;
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=512;const c=canvas.getContext('2d');c.fillStyle='#292c34';c.fillRect(0,0,256,512);const gradient=c.createLinearGradient(0,0,256,512);gradient.addColorStop(0,'#8ba5ff');gradient.addColorStop(.55,'#c77bff');gradient.addColorStop(1,'#ffa8b5');c.fillStyle=gradient;
 for(let row=0;row<8;row++)for(let col=0;col<4;col++){const x=8+col*62,y=10+row*62;c.beginPath();c.moveTo(x,y);c.lineTo(x+48,y);c.lineTo(x+(row%2?48:0),y+43);c.closePath();c.fill();}
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const lattice=new THREE.MeshBasicMaterial({map,toneMapped:false});
 for(const side of [-1,1]){const o=mesh(new THREE.PlaneGeometry(.225,.49),'NANCOOL triangular illuminated side lattice',[side*.351,0,-.018],lattice);o.rotation.y=side*Math.PI/2;}
 return group;
}
