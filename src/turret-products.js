import * as THREE from 'three';

// Product-based reconstruction. Unknown identities are explicit in the catalogue.
export function refineTurretProducts(api){
 const {pc,rotors,links,box,cyl,text,batch,port,wire,setPart,steel,black,silver,pcb,gold,rubber,glow}=api;
 const remove=predicate=>{for(const o of [...pc.children])if(predicate(o))o.removeFromParent();};
 const put=(g,n,p,m,rotation=[0,0,0],parent=pc)=>{const o=new THREE.Mesh(g,m);o.name=n;o.position.set(...p);o.rotation.set(...rotation);o.userData.partId=parent===pc?current:parent.userData.partId;o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
 let current;const part=id=>{current=id;setPart(id);};
 function ring(n,r,t,p,m,rot=[0,0,0],parent=pc){return put(new THREE.TorusGeometry(r,t,6,36),n,p,m,rot,parent);}
 function polygon(n,points,depth,p,m,holes=[],rotation=[0,0,0]){const s=new THREE.Shape();points.forEach(([x,y],i)=>i?s.lineTo(x,y):s.moveTo(x,y));s.closePath();for(const h of holes){const q=new THREE.Path();if(h.length===3)q.absarc(h[0],h[1],h[2],0,Math.PI*2,true);else {const[x,y,w,hg]=h;q.moveTo(x-w/2,y-hg/2);q.lineTo(x-w/2,y+hg/2);q.lineTo(x+w/2,y+hg/2);q.lineTo(x+w/2,y-hg/2);q.closePath();}s.holes.push(q);}const g=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:18});g.translate(0,0,-depth/2);return put(g,n,p,m,rotation);}
 function sticker(n,w,h,p,draw,rotation=[0,0,0]){const c=document.createElement('canvas');c.width=768;c.height=384;draw(c.getContext('2d'),768,384);const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;const o=put(new THREE.PlaneGeometry(w,h),n,p,new THREE.MeshBasicMaterial({map,transparent:true,depthWrite:false}),rotation);o.castShadow=false;return o;}
 const label=(n,w,h,p,lines,accent='#266cb5',rot=[0,0,0])=>sticker(n,w,h,p,(c,W,H)=>{c.fillStyle='#e9ebeb';c.fillRect(0,0,W,H);c.fillStyle=accent;c.fillRect(0,0,W,90);c.fillStyle='white';c.font='bold 53px Arial';c.fillText(lines[0],24,64);c.fillStyle='#182229';c.font='32px Arial';lines.slice(1).forEach((l,i)=>c.fillText(l,24,140+i*48));for(let i=0;i<65;i++)c.fillRect(28+i*6,310,1+i%3,44);},rot);
 // Gaming X Trio: official 323 x 140 x 56 mm, three fans, paired 8-pin power.
 part('gpu');remove(o=>o.userData.partId==='gpu'&&!o.name.includes('power connector'));
 const cx=-.30,z=.05;
 box('Gaming X Trio PCB',[3.14,.025,1.30],[cx,2.073,z],pcb);
 box('PCIe x16 edge seated in slot',[1.62,.047,.105],[-.70,2.035,-.579],gold);
 const outline=[[-1.615,-.58],[-1.52,-.70],[1.49,-.70],[1.615,-.56],[1.615,.56],[1.49,.70],[-1.49,.70],[-1.615,.56]];
 polygon('Graphene backplate with GPU core cutout',outline,.035,[cx,2.13,z],steel,[[-.29,.03,.38,.36],[1.12,-.38,.05,.32],[1.25,-.38,.05,.32],[1.38,-.38,.05,.32]],[-Math.PI/2,0,0]);
 box('GPU package rear capacitors',[.34,.025,.31],[cx-.29,2.109,.02],pcb);
 batch('Backplate SMD array',new THREE.BoxGeometry(.025,.011,.018),Array.from({length:20},(_,i)=>[cx-.43+(i%5)*.063,2.128,-.08+Math.floor(i/5)*.062]),silver);
 batch('Twin heatsink fin stacks',new THREE.BoxGeometry(.015,.40,1.17),Array.from({length:78},(_,i)=>[-1.84+i*.04,1.84,.05]),silver);
 for(const dz of [-.35,-.18,0,.18]){
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-1.5,1.79,dz),new THREE.Vector3(-.78,1.66,dz),new THREE.Vector3(.32,1.71,dz),new THREE.Vector3(1.1,1.92,dz)]);
  put(new THREE.TubeGeometry(curve,22,.031,7,false),'Nickel plated Core Pipe',[0,0,0],silver);
 }
 polygon('TRI FROZR 2 sculpted three-aperture shroud',outline,.058,[cx,1.60,z],black,[[-1.03,0,.455],[0,0,.455],[1.03,0,.455]],[Math.PI/2,0,0]);
 for(const x of [-1.33,-.30,.73]){
  const g=new THREE.Group();g.name='TORX FAN 4.0';g.userData.partId='gpu';g.position.set(x,1.585,z);g.rotation.x=Math.PI/2;pc.add(g);
  const rotor=new THREE.Group();g.add(rotor);rotors.push(rotor);
  const shape=new THREE.Shape();shape.moveTo(.13,0);shape.bezierCurveTo(.26,-.05,.42,-.16,.445,-.015);shape.bezierCurveTo(.42,.13,.23,.13,.13,.06);shape.closePath();
  const blades=new THREE.InstancedMesh(new THREE.ExtrudeGeometry(shape,{depth:.014,bevelEnabled:false,curveSegments:5}),steel,10),t=new THREE.Object3D();
  for(let i=0;i<10;i++){t.rotation.z=i*Math.PI/5;t.updateMatrix();blades.setMatrixAt(i,t.matrix);}blades.computeBoundingSphere();rotor.add(blades);
  for(let i=0;i<5;i++){const arc=new THREE.Mesh(new THREE.TorusGeometry(.438,.012,5,12,Math.PI/5),steel);arc.rotation.z=i*Math.PI*2/5;rotor.add(arc);}
  cyl('TORX motor cap',.13,.068,[0,0,.035],black,g);
  for(const a of [Math.PI/4,-Math.PI/4]){const rib=box('Angular silver shroud accent',[.20,.025,.045],[x+.43,1.567,z+(a>0?.53:-.53)],silver);rib.rotation.y=a;}
 }
 box('MSI side sculpted logo rail',[2.10,.19,.05],[-.60,1.86,.755],steel);
 text('msi   GEFORCE RTX',2.02,.13,[-.6,1.865,.784]);
 for(let i=0;i<4;i++)box('Mystic Light side diffuser',[.50,.043,.044],[-1.36+i*.5,2.075,.751],glow[i]);
 text('GEFORCE RTX',.83,.20,[-1.39,2.151,-.10],'#dfe4eb',[-Math.PI/2,0,0]);
 // Draw a shield mark rather than applying the whole product photo to a box.
 sticker('MSI backplate shield',.48,.45,[-.12,2.151,.10],c=>{c.strokeStyle='#dae0e5';c.lineWidth=15;c.beginPath();c.moveTo(120,60);c.lineTo(650,60);c.lineTo(580,265);c.lineTo(385,345);c.lineTo(190,265);c.closePath();c.stroke();c.font='bold 106px Arial';c.fillStyle='#dae0e5';c.fillText('msi',210,215);},[-Math.PI/2,0,0]);
 for(const x of [-1.75,-.88,.33,1.13])for(const zz of [-.50,.58])cyl('Backplate screw',.023,.01,[x,2.154,zz],silver,pc,[0,0,0]);
 box('Gaming Trio rear bracket',[.022,.56,1.38],[-1.924,1.86,z],silver);
 for(const zz of [-.42,-.13,.16,.45]){box('GPU video connector housing',[.15,.12,.21],[-1.91,1.98,zz],silver);box('HDMI DisplayPort opening',[.012,.074,.16],[-1.939,1.98,zz],black);}
 const a=pc.getObjectByName('GPU PCIe power connector');a.name='GPU 8-pin power connector A';
 const b=port('GPU 8-pin power connector B',[.87,2.12,.70],[.17,.12,.14]);
 for(const x of [.66,.87]){for(let i=0;i<4;i++)box('8-pin plug wire separator',[.010,.055,.07],[x-.055+i*.036,2.163,.70],silver);}
 wire('Second GPU 8-pin PCIe cable',pc.getObjectByName('Fixed PSU cable outlet'),b,[[-.54,.72,-.48],[.02,.86,-.5],[.24,.96,-.52],[1.17,.96,.48],[1.17,1.43,.48],[1.62,1.43,.90],[1.62,2.40,.90],[.87,2.40,.90],[.87,2.12,.70]],.044);
 // Low-profile AMD Wraith Stealth with AM4 screw spacing and molded circular rim.
 part('cooler');remove(o=>o.userData.partId==='cooler'&&o.name!=='Cooler PWM lead');
 cyl('Wraith Stealth aluminum base',.405,.08,[-.83,3.45,-.49],silver);
 batch('Wraith radial extrusion fins',new THREE.BoxGeometry(.020,.32,.18),Array.from({length:56},(_,i)=>{const a=i*Math.PI/28;return[-.83+Math.cos(a)*.275,3.45+Math.sin(a)*.275,-.36,a-Math.PI/2];}),silver);
 ring('Wraith circular molded shroud',.467,.037,[-.83,3.45,-.18],black);
 ring('Wraith upper rim',.467,.023,[-.83,3.45,-.079],steel);
 const wr=new THREE.Group();wr.name='Wraith Stealth seven-blade rotor';wr.userData.partId='cooler';wr.position.set(-.83,3.45,-.115);pc.add(wr);rotors.push(wr);
 const ws=new THREE.Shape();ws.moveTo(.13,0);ws.bezierCurveTo(.24,-.06,.43,-.13,.425,.075);ws.bezierCurveTo(.33,.20,.19,.13,.13,.08);ws.closePath();
 const wg=new THREE.ExtrudeGeometry(ws,{depth:.017,bevelEnabled:false,curveSegments:5});for(let i=0;i<7;i++){const o=new THREE.Mesh(wg,black);o.rotation.z=i*Math.PI*2/7;wr.add(o);}cyl('Wraith fan hub',.145,.09,[-.83,3.45,-.075],black);
 box('Wraith AMD logo tab',[.29,.12,.05],[-.83,3.97,-.10]);text('AMD',.24,.07,[-.83,3.971,-.072]);
 for(const x of [-1.28,-.38])for(const y of [3.18,3.72]){box('AM4 screw mounting ear',[.18,.12,.065],[x,y,-.38]);cyl('Captive spring screw',.037,.23,[x,y,-.32],silver);ring('Screw spring collar',.044,.009,[x,y,-.21],steel);}
 // Kingston ValueRAM is a low-confidence physical reference, not an asserted identification.
 part('memory');remove(o=>o.userData.partId==='memory');
 for(const x of [.23,.61]){
  box('ValueRAM 133.35 x 31.25 mm PCB',[.013,1.3335,.3125],[x,3.45,-.46],pcb);
  for(const side of [-1,1])for(let i=0;i<8;i++)box('2Rx8 DDR4 FBGA chip',[.012,.115,.095],[x+side*.012,2.91+i*.15,-.40],black);
  batch('DIMM 288-pin gold fingers',new THREE.BoxGeometry(.002,.006,.052),Array.from({length:144},(_,i)=>[x+.009,2.808+i*.00896,-.588]),gold);
  const l=label('ValueRAM reference label',.61,.105,[x+.020,3.43,-.40],['Kingston','KVR26N19D8/16','16GB DDR4'], '#35765a');
  l.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0,1,0),new THREE.Vector3(0,0,1),new THREE.Vector3(1,0,0)));
 }
 // Confirmed Intel part number maps to the 760p series, M.2 2280.
 part('ssd1');remove(o=>o.userData.partId==='ssd1');
 box('Intel 760p M.2 2280 PCB',[.80,.22,.014],[-.79,2.36,-.630],pcb);
 box('760p controller',[.12,.14,.014],[-1.05,2.36,-.615],black);
 for(const x of [-.85,-.65])box('Intel 3D NAND package',[.175,.16,.014],[x,2.36,-.615],black);
 label('Intel 760p identification label',.57,.185,[-.745,2.36,-.603],['intel SSD','760p   256GB','SSDPEKKW256G8'], '#1172a1');
 batch('M.2 connector fingers',new THREE.BoxGeometry(.042,.008,.003),Array.from({length:18},(_,i)=>[-1.171,2.267+i*.0105,-.618]),gold);
 cyl('M.2 hold-down screw',.026,.015,[-.405,2.36,-.613],silver);
 // WD Blue stamped cover and label, controller underside and SATA connector tongues.
 part('hdd');remove(o=>o.name==='WD10EZEX  1TB');
 const hdd=pc.getObjectByName('WD10EZEX HDD metal chassis');hdd.scale.y=.261/.26;
 box('WD Blue raised stamped cover',[1.40,.020,.95],[1.12,.729,-.03],silver);
 label('WD Blue 1TB factory-style label',.95,.70,[1.13,.742,-.04],['WD BLUE','1.0TB   SATA / 64MB','WD10EZEX-00BBHA0'], '#1971a7',[-Math.PI/2,0,0]);
 for(const x of [.48,1.76])for(const zz of [-.42,.36])cyl('WD cover Torx screw',.027,.014,[x,.749,zz],black,pc,[0,0,0]);
 for(const x of [.68,1.48])box('HDD cover stamped rib',[.016,.018,.82],[x,.746,-.03],steel);
 for(const [z,n]of [[-.28,7],[.06,15]])for(let i=0;i<n;i++)box('SATA exposed contact',[.006,.012,.009],[.330,.53,z-(n-1)*.006+i*.012],gold);
 // First-generation MWE Bronze reference; user's exact revision is not known.
 part('psu');const psu=pc.getObjectByName('MWE Bronze 550 PSU');psu.scale.y=.86/.71;psu.position.y=.74;
 remove(o=>['MWE BRONZE 550','COOLER MASTER'].includes(o.name));
 label('MWE Bronze PSU side label',1.22,.56,[-1.27,.70,.736],['COOLER MASTER','MWE BRONZE 550','550W   80 PLUS BRONZE'], '#756044');
 ring('MWE 120mm fan grille outer rim',.56,.014,[-1.27,.263,-.02],silver,[Math.PI/2,0,0]);
 for(let i=0;i<7;i++)ring('MWE concentric grille wire',.15+i*.055,.008,[-1.27,.262,-.02],steel,[Math.PI/2,0,0]);
 // X470 features verified against the manufacturer's board layout.
 part('motherboard');
 polygon('Angular carbon chipset heatsink',[[-.40,-.22],[.20,-.32],[.42,-.13],[.36,.24],[-.26,.32],[-.44,.11]],.09,[.23,1.73,-.58],steel);
 text('msi',.39,.13,[.24,1.74,-.528]);
 for(let i=0;i<6;i++){const o=box('Chipset diagonal grooves',[.43,.013,.008],[.20,1.55+i*.052,-.526],silver);o.rotation.z=.25;}
 const eps2=port('Second EPS socket (unpopulated)',[-1.18,4.30,-.61],[.19,.13,.13]);
 for(let i=0;i<2;i++)box('PCIe x1 socket',[.27,.07,.11],[-1.22,1.82-i*.43,-.61],black);
 for(let i=0;i<8;i++)box('Right-angle SATA III connector',[.14,.11,.15],[.61,1.38+i*.12,-.60],black);
 for(const [yy,n]of [[4.00,'PS2 and USB'],[3.66,'HDMI / DisplayPort'],[3.30,'USB 3.1'],[2.96,'LAN and USB']]){box(n+' rear housing',[.22,.26,.35],[-1.82,yy,-.62],silver);box(n+' rear opening',[.009,.17,.25],[-1.937,yy,-.62],black);}
 for(let i=0;i<5;i++)cyl('Gold audio jack',.034,.055,[-1.96,2.75-i*.09,-.62],gold,pc,[0,0,Math.PI/2]);
 // Vortex FCB 120 uses a Core Box controller rather than a direct motherboard fan connection.
 part('frontFans');
 for(const g of pc.children.filter(o=>o.isGroup&&o.userData.partId==='frontFans')){
  for(const z of [-.09,.105])for(let i=0;i<4;i++)put(new THREE.TorusGeometry(.528,.025,6,16,Math.PI/2),'Vortex tri-directional light ring',[0,0,z],glow[i],[0,0,i*Math.PI/2],g);
  for(const x of [-.51,.51])for(const y of [-.51,.51])box('Vortex rubber corner pad',[.16,.16,.13],[x,y,0],rubber,g);
 }
 const hub=port('COUGAR Core Box C controller',[.89,2.65,-.71],[.53,.75,.09]);
 remove(o=>o.userData.partId==='wiring'&&o.name.startsWith('Front fan power'));
 for(let i=links.length-1;i>=0;i--)if(links[i].name.startsWith('Front fan power'))links.splice(i,1);
 for(const[name,y]of [['Upper fan cable connector',3.04],['Lower fan cable connector',1.65]]){const fan=pc.getObjectByName(name);wire('Vortex 6-pin fan/controller '+y,fan,hub,[[1.85,y,-.51],[1.69,y,-.71],[.89,2.65,-.61],[.89,2.65,-.71]],.022);}
 wire('Core Box SATA power',pc.getObjectByName('Fixed PSU cable outlet'),hub,[[-.54,.72,-.48],[-.2,.72,-.93],[1.30,.72,-.93],[1.30,1.95,-.93],[1.30,1.95,-.69],[1.20,2.20,-.61],[.89,2.20,-.61],[.89,2.65,-.61],[.89,2.65,-.71]],.03);
 part('case');pc.getObjectByName('PSU shroud with wiring openings').position.y=1.19;const side=pc.getObjectByName('PSU shroud side');side.scale.y=.85/.63;side.position.y=.77;pc.getObjectByName('Shroud ventilation').position.y=1.211;
 // Drop animation references belonging to meshes replaced above.
 for(let i=rotors.length-1;i>=0;i--){let p=rotors[i];while(p.parent)p=p.parent;if(p!==pc)rotors.splice(i,1);}
}
