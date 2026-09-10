export function createInspector({ THREE, pc, camera, controls, canvas, reduceMotion, invalidateShadows = () => {} }) {
  let parts = [
    { id:'cpu', category:'處理器', title:'Intel Core i5-13500', detail:'14 核心 / 20 執行緒' },
    { id:'motherboard', category:'主機板', title:'ASUS TUF GAMING', detail:'B760M-PLUS WIFI' },
    { id:'memory', category:'記憶體', title:'XPG Lancer 白色 · 32GB', detail:'DDR5-5600 CL36 · 16GB × 2' },
    { id:'ssd1', category:'固態硬碟 01', title:'UMAX M1500 · 1TB', detail:'PCIe 4.0 · 讀 7000 / 寫 5500 MB/s' },
    { id:'ssd2', category:'固態硬碟 02', title:'KLEVV CRAS C710 · 1TB', detail:'PCIe 3.0 · 讀 2050 / 寫 1650 MB/s' },
    { id:'cooler', category:'水冷散熱', title:'Apexgaming NANOCOOL PRO', detail:'240mm · 白色 · ARGB' },
    { id:'gpu', category:'顯示卡', title:'RTX 4070 SUPER AERO OC', detail:'GIGABYTE · 12GB · 白色' },
    { id:'case', category:'機殼', title:'ASUS A21 白色', detail:'玻璃側板 · M-ATX · 後置 120mm 風扇' },
    { id:'psu', category:'電源供應器', title:'Seasonic FOCUS GX-850', detail:'850W · ATX 3.0 · 白色 · 全模組' },
  ];
  let catalog = new Map(parts.map(p => [p.id,p]));
  const initialParts=parts;
  let customViews={};
  catalog.set('wiring',{category:'內部線材',title:'供電與訊號連線',detail:'電源、風扇、ARGB 與前面板線材'});
  const ui = document.createElement('div'); ui.className='inspector';
  ui.innerHTML=`
    <div class="viewer-switches" aria-label="檢視選項">
      <button class="viewer-switch" id="hover-switch" role="switch" aria-checked="false"><span class="switch-track" aria-hidden="true"></span>配件提示</button>
      <button class="viewer-switch" id="list-switch" role="switch" aria-checked="false" aria-controls="parts-panel"><span class="switch-track" aria-hidden="true"></span>配置表</button>
    </div>
    <section id="parts-panel" class="parts-panel" aria-label="電腦配置表" hidden>
      <header><div><span class="panel-eyebrow">YOUR BUILD</span><h1>電腦配置</h1></div><span class="part-count">09</span></header>
      <p class="panel-hint">點選配件獨立檢視，再點一次回到整機。</p>
      <div class="parts-list">${parts.map((p,i)=>`<button class="part-row" data-part="${p.id}" aria-pressed="false"><span class="part-number">${String(i+1).padStart(2,'0')}</span><span class="part-copy"><span class="part-category">${p.category}</span><strong>${p.title}</strong><span class="part-detail">${p.detail}</span></span><span class="part-indicator" aria-hidden="true">↗</span></button>`).join('')}</div>
      <button class="restore-build" hidden>↶ 返回完整電腦</button>
    </section>
    <div class="part-tooltip" role="tooltip" hidden><span></span><strong></strong><small></small></div>
    <div class="sr-only" aria-live="polite" id="viewer-status"></div>`;
  document.body.append(ui);
  const hoverSwitch=ui.querySelector('#hover-switch'), listSwitch=ui.querySelector('#list-switch');
  const panel=ui.querySelector('.parts-panel'), tooltip=ui.querySelector('.part-tooltip');
  const restore=ui.querySelector('.restore-build'), status=ui.querySelector('#viewer-status');
  let rows=[...ui.querySelectorAll('.part-row')];
  let originalVisibility=new Map(pc.children.map(o=>[o,o.visible]));
  let selected=null, hints=false, list=false, savedView=null, transition=null;
  let pointer=null, dragging=false, dirty=false, activeHover=null;
  const raycaster=new THREE.Raycaster(), ndc=new THREE.Vector2();
  const scratch=new THREE.Box3();

  function hideTooltip() { tooltip.hidden=true;activeHover=null; }
  function layout() {
    const w=innerWidth,h=innerHeight;
    if(!list) camera.clearViewOffset();
    else if(w<=700) camera.setViewOffset(w,h,0,(panel.getBoundingClientRect().height-148)/2,w,h);
    else camera.setViewOffset(w,h,-(panel.getBoundingClientRect().right+20)/2,0,w,h);
    camera.updateProjectionMatrix();dirty=true;
  }
  function cancelMove() {
    transition=null;controls.enabled=true;controls.enableDamping=true;
  }
  function flyTo(position,target) {
    cancelMove();
    controls.enableDamping=false;controls.update();
    if(reduceMotion.matches) {
      camera.position.copy(position);controls.target.copy(target);controls.update();controls.enableDamping=true;return;
    }
    transition={start:performance.now(),fromPosition:camera.position.clone(),fromTarget:controls.target.clone(),position,target};
    controls.enabled=false;
  }
  function select(id) {
    hideTooltip();
    if(id===selected) id=null;
    if(id && !selected) savedView={position:camera.position.clone(),target:controls.target.clone(),min:controls.minDistance,max:controls.maxDistance};
    selected=id;
    for(const child of pc.children) {
      // Lights remain for an isolated object; all unrelated geometry is hidden.
      child.visible=child.isLight ? originalVisibility.get(child) : (id ? child.userData.partId===id && (child.userData.inspectionOnly || originalVisibility.get(child)) : originalVisibility.get(child));
    }
    invalidateShadows();
    rows.forEach(row=>row.setAttribute('aria-pressed',String(row.dataset.part===id)));
    restore.hidden=!id;
    if(id) {
      pc.updateMatrixWorld(true);
      const bounds=new THREE.Box3();
      for(const child of pc.children)if(child.visible && !child.isLight)bounds.union(scratch.setFromObject(child));
      const center=bounds.getCenter(new THREE.Vector3());
      const radius=bounds.getSize(new THREE.Vector3()).length()/2;
      const mobile=innerWidth<=700;
      const availableWidth=innerWidth-(list&&!mobile?panel.getBoundingClientRect().right+20:0);
      const availableHeight=innerHeight-(list&&mobile?panel.getBoundingClientRect().height+148:0);
      const vertical=Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*(availableHeight/innerHeight));
      const horizontal=Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*availableWidth/innerHeight);
      const distance=Math.max(0.75,radius/Math.sin(Math.min(vertical,horizontal))*1.13);
      // The CPU and M.2 SSDs are best inspected from their labeled faces.
      const viewDirections={memory:[1,0.18,0.50],gpu:[0.55,-0.60,0.95],...customViews};
      const direction=new THREE.Vector3(...(viewDirections[id]||(['cpu','ssd1','ssd2','motherboard'].includes(id)?[0.22,0.16,1]:[0.56,0.32,1]))).normalize();
      controls.minDistance=Math.max(0.22,radius*0.4);controls.maxDistance=Math.max(23,distance*2);
      flyTo(direction.multiplyScalar(distance).add(center),center);
      status.textContent=`單獨檢視：${catalog.get(id).title}`;
    } else if(savedView) {
      controls.minDistance=savedView.min;controls.maxDistance=savedView.max;
      flyTo(savedView.position,savedView.target);savedView=null;
      status.textContent='已返回完整電腦';
    }
    layout();
  }
  rows.forEach(row=>row.addEventListener('click',()=>select(row.dataset.part)));
  restore.addEventListener('click',()=>select(null));
  hoverSwitch.addEventListener('click',()=>{
    hints=!hints;hoverSwitch.setAttribute('aria-checked',String(hints));hideTooltip();dirty=true;
  });
  listSwitch.addEventListener('click',()=>{
    list=!list;listSwitch.setAttribute('aria-checked',String(list));panel.hidden=!list;
    if(!list&&selected)select(null);
    layout();
  });
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&selected)select(null);
  });
  canvas.addEventListener('pointermove',event=>{
    pointer={x:event.clientX,y:event.clientY};dirty=true;
  });
  canvas.addEventListener('pointerleave',()=>{pointer=null;hideTooltip();});
  canvas.addEventListener('pointerdown',()=>{cancelMove();dragging=true;hideTooltip();},true);
  window.addEventListener('pointerup',()=>{dragging=false;dirty=true;});
  controls.addEventListener('change',()=>{dirty=true;});
  window.addEventListener('resize',layout);
  new ResizeObserver(layout).observe(panel);

  const alphaPixels=new WeakMap();
  let lastHitTest=-Infinity;
  function hitTest() {
    dirty=false;
    if(!hints||!pointer||dragging||transition){hideTooltip();return;}
    const rect=canvas.getBoundingClientRect();
    ndc.set((pointer.x-rect.left)/rect.width*2-1,-(pointer.y-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(ndc,camera);
    const candidates=[];
    pc.traverseVisible(o=>{if(o.isMesh&&!o.material?.transparent)candidates.push(o);});
    const hits=raycaster.intersectObjects(candidates,false);
    let hit=null,id=null;
    for(const intersection of hits) {
      const object=intersection.object;
      // Pick through the glass and decal planes so internal parts can be identified.
      if(object.material?.transparent)continue;
      // Alpha-tested perforations are real holes to the pointer as well as the renderer.
      if(object.material?.alphaMap && intersection.uv) {
        const map=object.material.alphaMap, uv=intersection.uv.clone();map.transformUv(uv);
        const x=Math.floor(uv.x*map.image.width),y=Math.floor(uv.y*map.image.height);
        if(!alphaPixels.has(map.image))alphaPixels.set(map.image,map.image.getContext('2d').getImageData(0,0,map.image.width,map.image.height).data);
        if(alphaPixels.get(map.image)[(y*map.image.width+x)*4+1]<128)continue;
      }
      let ancestor=object;
      while(ancestor&&!ancestor.userData.partId)ancestor=ancestor.parent;
      id=ancestor?.userData.partId;
      if(catalog.has(id)){hit=object;break;}
    }
    if(!hit){hideTooltip();return;}
    const part=catalog.get(id);activeHover=id;
    tooltip.querySelector('span').textContent=part.category;
    tooltip.querySelector('strong').textContent=part.title;
    tooltip.querySelector('small').textContent=id==='wiring'?hit.name:part.detail;
    tooltip.hidden=false;
    const {width,height}=tooltip.getBoundingClientRect();
    tooltip.style.left=`${Math.max(8,Math.min(pointer.x+17,innerWidth-width-12))}px`;
    tooltip.style.top=`${Math.max(8,Math.min(pointer.y+18,innerHeight-height-12))}px`;
  }
  return {
    get selected(){return selected;},
    get moving(){return !!transition;},
    moveCamera: flyTo,
    setBuild(build) {
      cancelMove();hideTooltip();pointer=null;
      for(const [child,visible] of originalVisibility)child.visible=visible;
      pc=build.pc;parts=build.parts||initialParts;customViews=build.views||{};
      selected=null;savedView=null;restore.hidden=true;
      catalog=new Map(parts.map(p=>[p.id,p]));
      catalog.set('wiring',{category:'內部線材',title:'供電與訊號連線',detail:'電源、風扇、ARGB 與前面板線材'});
      originalVisibility=new Map(pc.children.map(o=>[o,o.visible]));
      invalidateShadows();
      ui.querySelector('.parts-list').innerHTML=parts.map((p,i)=>'<button class="part-row" data-part="'+p.id+'" aria-pressed="false"><span class="part-number">'+String(i+1).padStart(2,'0')+'</span><span class="part-copy"><span class="part-category">'+p.category+'</span><strong>'+p.title+'</strong><span class="part-detail">'+p.detail+'</span></span><span class="part-indicator" aria-hidden="true">↗</span></button>').join('');
      rows=[...ui.querySelectorAll('.part-row')];
      rows.forEach(row=>row.addEventListener('click',()=>select(row.dataset.part)));
      ui.querySelector('.part-count').textContent=String(parts.length).padStart(2,'0');
      ui.querySelector('.panel-eyebrow').textContent=build.title;
      panel.scrollTop=0;status.textContent='已切換主機：'+build.title;layout();dirty=true;
    },
    update(time) {
      if(transition) {
        const t=Math.min(1,Math.max(0,(time-transition.start)/850)), eased=t*t*(3-2*t);
        camera.position.lerpVectors(transition.fromPosition,transition.position,eased);
        controls.target.lerpVectors(transition.fromTarget,transition.target,eased);
        camera.lookAt(controls.target);
        if(t===1){cancelMove();controls.update();dirty=true;}
      }
      if(dirty && time-lastHitTest>=75){lastHitTest=time;hitTest();}
    },
    inspect:()=>({selected,hints,list,hover:activeHover,moving:!!transition,visibleParts:[...new Set(pc.children.filter(c=>c.visible&&!c.isLight).map(c=>c.userData.partId))] }),
  };
}
