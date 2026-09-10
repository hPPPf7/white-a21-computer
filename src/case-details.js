import * as THREE from 'three';

// Case-only manufacturing details, added before static batching.
export function refineCase(root, hyperion=false) {
  const coat=new THREE.MeshStandardMaterial({color:hyperion?'#202730':'#eceeea',metalness:.55,roughness:.38});
  const edge=new THREE.MeshStandardMaterial({color:hyperion?'#52606b':'#b9c1c1',metalness:.78,roughness:.3});
  const rubber=new THREE.MeshStandardMaterial({color:'#252a2b',roughness:.85});
  const inset=new THREE.MeshStandardMaterial({color:'#10151a',metalness:.3,roughness:.45});
  function add(g,name,p,m=coat,rot=[0,0,0]){const o=new THREE.Mesh(g,m);o.name=name;o.position.set(...p);o.rotation.set(...rot);o.userData.partId='case';o.castShadow=true;o.receiveShadow=true;root.add(o);return o;}
  function box(n,size,p,m=coat){return add(new THREE.BoxGeometry(...size),n,p,m);}
  function panel(n,w,h,d,p,holes=[],rot=[0,0,0],m=coat){const s=new THREE.Shape();s.moveTo(-w/2,-h/2);s.lineTo(w/2,-h/2);s.lineTo(w/2,h/2);s.lineTo(-w/2,h/2);s.closePath();for(const[x,y,a,b]of holes){const q=new THREE.Path();q.moveTo(x-a/2,y-b/2);q.lineTo(x-a/2,y+b/2);q.lineTo(x+a/2,y+b/2);q.lineTo(x+a/2,y-b/2);q.closePath();s.holes.push(q);}const g=new THREE.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});g.translate(0,0,-d/2);return add(g,n,p,m,rot);}
  function bolt(p,axis='z'){
    const rot=axis==='x'?[0,0,Math.PI/2]:axis==='y'?[0,0,0]:[Math.PI/2,0,0];
    add(new THREE.CylinderGeometry(.028,.028,.014,12),'Recessed chassis screw',p,edge,rot);
    const q=[...p];q[{x:0,y:1,z:2}[axis]]+=axis==='x'?-.009:.009;
    const sizes=axis==='x'?[.004,.008,.034]:axis==='y'?[.034,.004,.008]:[.034,.008,.004];
    box('Screw driver recess',sizes,q,inset);
  }
  const old=root.getObjectByName('Rear panel');if(old)old.removeFromParent();
  if(!hyperion){
    panel('Stamped rear chassis with open exhaust',2.10,4.2,.055,[-2.29,2.39,0],[[.17,1.23,1.20,1.20],[-.74,1.01,.445,1.585],[-.12,-1.71,1.50,.70],[.04,-.5625,1.36,1.145]],[0,-Math.PI/2,0]);
    for(const o of [...root.children])if(['PCI slot cover','PCI vent opening'].includes(o.name))o.removeFromParent();
    for(let i=0;i<4;i++){
      panel('A21 slotted PCI cover',1.35,.14,.025,[-2.337,1.35+i*.20,.04],[[-.42,0,.23,.047],[-.14,0,.23,.047],[.14,0,.23,.047],[.42,0,.23,.047]],[0,-Math.PI/2,0]);
      bolt([-2.355,1.35+i*.20,.81],'x');
    }
    for(const z of [-.95,.95]){
      box('Front mesh folded return',[.09,3.91,.026],[2.345,2.45,z]);
      box('Top filter magnetic border',[3.85,.018,.033],[-.24,4.548,z*.95],rubber);
      for(const y of [.66,2.45,4.18])box('Front panel retaining clip',[.10,.15,.07],[2.25,y,z],rubber);
    }
    for(const x of [-2.165,1.685])box('Filter end binding',[.033,.018,1.84],[x,4.548,0],rubber);
    box('Filter lift tab',[.17,.025,.25],[1.64,4.559,.72],rubber);
    for(const z of [-1.066,1.066]){
      box('Folded top frame flange',[4.40,.028,.14],[-.03,4.43,z]);
      box('Folded bottom frame flange',[4.4,.026,.12],[-.03,.395,z]);
    }
    for(const x of [-2.19,2.13])for(const y of [.52,4.34]){
      box('Glass isolation washer',[.10,.10,.018],[x,y,1.118],rubber);bolt([x,y,1.153]);
    }
    for(const y of [.59,4.28])for(const z of [-.96,.94])bolt([-2.335,y,z],'x');
    box('Right panel folded rear grip',[.035,.55,.085],[-2.335,2.45,-1.075]);
    for(const x of [-1.76,1.76])for(const z of [-.79,.79])box('Foot upper mounting plate',[.53,.025,.40],[x,.235,z],edge);
    for(const z of [.24,-.05])for(const sign of [-1,1])box('USB metal socket lip',[.083,.009,.012],[2.1,4.574,z+sign*.077],edge);
    for(const z of [-.36,-.55])add(new THREE.TorusGeometry(.033,.006,6,18),'Audio jack metal rim',[2.1,4.576,z],edge,[-Math.PI/2,0,0]);
  }else{
    panel('Hyperion stamped rear frame',2.56,5.53,.06,[-3.04,3.22,0],[[.10,1.58,1.31,1.31],[-.91,1.35,.445,1.585],[.05,-.91,1.63,1.70],[.01,-2.31,1.69,.86]],[0,-Math.PI/2,0]);
    // Hinge knuckles, pivot pins and the tool-free door latch.
    for(const y of [1.12,5.36]){
      box('Door hinge mounting leaf',[.19,.34,.06],[-2.96,y,1.35],edge);
      for(const dy of [-.11,0,.11])add(new THREE.CylinderGeometry(.054,.054,.095,14),'Door hinge knuckle',[-3.02,y+dy,1.385],coat);
      add(new THREE.CylinderGeometry(.024,.024,.39,12),'Door hinge pivot pin',[-3.02,y,1.385],edge);
    }
    box('Recessed door latch backing',[.18,.51,.024],[2.89,3.15,1.349],rubber);
    panel('Door pull frame',.12,.36,.035,[2.91,3.15,1.38],[[0,0,.066,.25]],[0,0,0],edge);
    for(const x of [-2.90,2.89])box('Door perimeter gasket',[.022,5.16,.015],[x,3.23,1.32],rubber);
    for(const z of [-1.16,1.16]){
      box('Carry handle inset grip',[3.65,.045,.15],[0,6.071,z],rubber);
      for(const x of [-2.5,2.39]){box('Handle machined attachment block',[.26,.08,.28],[x,6.06,z],edge);bolt([x,6.112,z],'y');}
      box('Removable top filter edge',[5.54,.022,.038],[0,6.056,z*.91],edge);
    }
    // Two separate USB-C recesses alongside the existing four USB-A ports.
    for(const x of [2.61,2.87]){
      box('USB-C metal bezel',[.12,.018,.20],[x,6.063,.88],edge);
      box('USB-C port cavity',[.075,.02,.153],[x,6.072,.88],inset);
      box('USB-C central tongue',[.022,.021,.09],[x,6.079,.88],coat);
    }
    add(new THREE.TorusGeometry(.036,.006,6,18),'Headset jack rim',[2.74,6.071,-.96],edge,[-Math.PI/2,0,0]);
    add(new THREE.CylinderGeometry(.027,.027,.012,14),'Headset jack opening',[2.74,6.067,-.96],inset);
    for(let i=0;i<8;i++){
      const cover=root.children.find(o=>o.name==='Rear PCI expansion cover');if(cover)cover.removeFromParent();
      panel('Perforated removable PCI slot',1.62,.17,.025,[-3.09,1.56+i*.195,.05],[[-.51,0,.25,.063],[-.17,0,.25,.063],[.17,0,.25,.063],[.51,0,.25,.063]],[0,-Math.PI/2,0]);
      bolt([-3.114,1.56+i*.195,.94],'x');
    }
    for(const y of [.7,5.74])for(const z of [-1.14,1.14])bolt([-3.082,y,z],'x');
    panel('Accessory drawer fascia',1.5,.40,.035,[1.3,.79,1.236],[[0,.10,.50,.045]]);
    for(const x of [-2.48,2.48])for(const z of [-1.01,1.01])box('Cast foot inset shoulder',[.48,.052,.32],[x,.325,z],edge);
  }
}
