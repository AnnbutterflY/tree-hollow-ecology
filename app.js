/* Offline SVG network, archive and pointer controls. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const escape = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data=window.TREE_DATA, M=window.TreeModel;
  if(!data||!M) { $('details').textContent='数据文件未加载，请将整个文件夹解压后打开 index.html。'; return; }
  const graph=M.build(data.records,window.TREE_ROLES), nodeMap=new Map(graph.nodes.map(n=>[n.id,n]));
  const recordMap=new Map(data.records.map(r=>[r.id,r]));
  const labels={tree:'树洞',species:'生物 / 类群',process:'生态过程'};
  const colors={tree:'#ffffff',species:'#4936d2',process:'#8e77df'};
  const evidenceNames={record:'备注记录',weather:'天气记录',trace:'痕迹证据',interpretation:'原记录的解释'};
  const viewNames={overview:['ECOLOGICAL OVERVIEW','一处树洞，一个微型生态。','有生物记录的树洞 · 天气与环境为属性'],all:['COMPLETE NETWORK',data.records.length+' 处树洞，彼此关联。','全部档案 · 朝向、高度与天气不作为节点'],tree:['HOLLOW × ORGANISM','沿着生命，回到树洞。','树洞与生物的观察关联'],ecology:['ECOLOGICAL RELATIONSHIPS','从微小生命，到生态过程。','虚线为角色推测，非现场证据']};
  const svg=$('network'), scene=$('scene');
  let viewName='overview', types=new Set(Object.keys(labels)), selected=null, isolated=false;
  let criteria={weather:'any',direction:'any',height:'any'}, contextualGraph=graph, contextualRecords=data.records;
  let visible={nodes:[],links:[]}, positions=new Map(), elements=new Map(), edgeElements=[];
  let width=800,height=680, zoom=1, panX=0,panY=0,alpha=0,paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let animation=0, gesture=null, mediaKind='photos';
  let showAllRecords=false;
  const ns='http://www.w3.org/2000/svg';
  function el(tag,attrs={}) {const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;}
  const chip=(id,text,extra='')=>`<button class="chip ${extra}" data-select="${escape(id)}">${escape(text??nodeMap.get(id)?.label??id)}</button>`;
  const section=(title,sub,content)=>`<section class="archive-section"><h3>${title}<small>${sub}</small></h3>${content}</section>`;
  function sourceLink(source) {return source?`<a href="${escape(source.url)}" target="_blank" rel="noopener noreferrer">${escape(source.title)} ↗</a>`:'';}
  function head(kicker,close=true) {return `<div class="archive-head"><span class="eyebrow">${kicker}</span>${close?'<button data-clear aria-label="关闭详情">×</button>':''}</div>`;}
  function roleContent(roles) {return roles.map(role=>`<div class="role-card"><h4>${chip('process:'+role.process,role.process,'inferred')}</h4><p>${escape(role.text)}</p>${sourceLink(role.source)}</div>`).join('');}
  function welcome() {
    $('details').innerHTML=head('TREE HOLLOW ARCHIVE',false)+`<div class="archive-body"><p class="subline">悬铃木 / 微小生命的居所</p><h2 class="lead">一个树洞，<br>不止一种生命。</h2><p>点击网络中的圆点，打开一份树洞档案；或者沿着一种生物，追寻它在校园里的踪迹。</p><button class="intro-photo" data-select="tree:A1"><img src="${escape(recordMap.get('A1')?.photos[0])}" alt="A1 树洞的原始实拍照片"><span>A1 · 从一处树洞开始 <small>查看档案 ↗</small></span></button>${section('从这里继续','FOLLOW A CONNECTION',`<div class="chips">${chip('species:弓背蚁','弓背蚁')}${chip('species:白蚁','白蚁痕迹')}${chip('species:鼻涕虫','鼻涕虫')}${chip('tree:C3','C3 · 真菌记录')}</div>`)}<div class="archive-summary"><div><strong>${data.records.length}</strong>树洞档案</div><div><strong>${data.meta.taxaLabels.length}</strong>生物 / 类群标签</div><div><strong>${data.meta.photos+data.meta.rubbings}</strong>照片与拓片</div></div><p class="muted">生物名称沿用表内标签，尚未统一为严格的物种名录。白蚁痕迹、羽化孔、粘液等不会被当作活体观察。</p></div>`;
  }
  function renderMedia(r) {
    const list=r[mediaKind];
    return `<div class="media-tabs"><button data-media-kind="photos" class="${mediaKind==='photos'?'active':''}">实拍照片 <small>${r.photos.length}</small></button><button data-media-kind="rubbings" class="${mediaKind==='rubbings'?'active':''}">树洞拓片 <small>${r.rubbings.length}</small></button></div>${list.length?list.map((src,i)=>`<button class="media-card" data-image="${escape(src)}" data-caption="${escape(r.id+' · '+(mediaKind==='photos'?'实拍照片':'拓片')+' · '+(i+1))}"><img src="${escape(src)}" alt="${escape(r.id)} ${mediaKind==='photos'?'实拍照片':'已裁去角标的拓片'}" loading="lazy"><span>⤢ 查看完整图片</span></button>`).join(''):`<div class="media-missing">本记录没有嵌入${mediaKind==='photos'?'实拍照片':'拓片'}</div>`}<div class="media-meta"><span>${mediaKind==='photos'?'FIELD PHOTOGRAPH':'HOLLOW IMPRESSION'}</span><span>表格编号 / ${escape(r.id)}</span></div>`;
  }
  function detailTree(n) {
    const r=n.record;
    const links=contextualGraph.links.filter(l=>l.source===n.id&&nodeMap.get(l.target).type==='species');
    return head('TREE HOLLOW ARCHIVE')+`<div class="archive-body"><p class="subline">${escape(r.zone)} 区 / 表格第 ${r.sourceRow} 行</p><h2 class="tree-id">${escape(r.id)}</h2><div id="recordMedia">${renderMedia(r)}</div><dl class="facts"><div><dt>离地高度</dt><dd>${escape(r.height??'未记录')}</dd></div><div><dt>树洞朝向</dt><dd>${escape(r.direction??'未记录')}</dd></div></dl>${section('生物与痕迹 · 当前条件','RECORDED ASSOCIATIONS',links.length?`<div class="chips">${links.map(l=>chip(l.target,nodeMap.get(l.target).label+(l.kind==='trace'?' · 痕迹':l.kind==='interpretation'?' · 解释':''),l.kind)).join('')}</div>`:'<p class="muted">没有可识别的生物记录。详见原始备注。</p>')}${section('观察天气','WEATHER NOTES',Object.entries(r.weather).map(([weather,text])=>`<div class="weather-row"><span>${escape(weather)}</span><p>${escape(text??'未记录')}</p></div>`).join(''))}${section('现场文字','ORIGINAL FIELD NOTES',`<pre class="notes">${escape(r.notes??'未记录')}</pre>`)}<p class="muted">来源：${escape(data.meta.source)} / ${escape(data.meta.sheet)} / 第 ${r.sourceRow} 行。保留原始名称与文字，未记录观察日期。</p></div>`;
  }
  function recordList(ids, note='') {
    const limit=showAllRecords?ids.length:40;
    return `${note?`<p class="muted">${escape(note)}</p>`:''}<div class="chips">${ids.slice(0,limit).map(id=>chip('tree:'+id,id)).join('')}</div>${ids.length>limit?`<button class="text-button" style="margin-top:12px" data-show-all>展开其余 ${ids.length-limit} 份档案 ↓</button>`:''}`;
  }
  function detailSpecies(n) {
    const traces=n.evidence.trace.filter(id=>!n.evidence.record.includes(id));
    const interpretations=n.evidence.interpretation.filter(id=>!n.evidence.record.includes(id)&&!traces.includes(id));
    const weatherNames=['晴天','雨天','阴天'];
    const max=Math.max(1,...weatherNames.map(w=>n.weather[w]?.length??0));
    const weatherPanel=weatherNames.map(w=>`<div class="weather-meter"><span>${w}</span><i><b style="width:${((n.weather[w]?.length??0)/max)*100}%"></b></i><span>${n.weather[w]?.length??0}</span></div>`).join('');
    return head('ORGANISM ARCHIVE')+`<div class="archive-body"><p class="subline">生物 / 类群 · 表内名称</p><h2>${escape(n.label)}</h2><div class="species-stats"><div><strong>${n.count}</strong><span>关联树洞</span></div><div><strong>${n.evidence.record.length}</strong><span>非痕迹背景记录</span></div><div><strong>${traces.length}</strong><span>仅痕迹背景记录</span></div></div>${interpretations.length?`<p class="muted">另有 ${interpretations.length} 处仅为原始备注的解释。</p>`:''}<div class="notice">以下统计随属性条件变化，按树洞编号去重，不代表个体数量。当天气列仅列名称、同档案备注只记痕迹时，保留天气计数，但不升级为活体证据。</div>${section('天气记录 · 当前条件','WEATHER AS AN ATTRIBUTE',weatherPanel+'<p class="muted">统计来自天气列，包含痕迹背景的名称记录；同一树洞可在多种天气下记录。0 表示无该天气记录，调查覆盖不均，不用于判断偏好。</p>')}${section('出现在哪些档案','FOLLOW THE HOLLOW',recordList(n.trees))}${traces.length?section('留下痕迹的档案','TRACE-CONTEXT EVIDENCE',`<div class="chips">${traces.map(id=>chip('tree:'+id,id,'trace')).join('')}</div>`):''}${section('可能的生态角色','ECOLOGICAL INTERPRETATION',n.roles?.length?roleContent(n.roles):'<p class="muted">本版本没有为这个标签添加生态过程推测。</p>')}${section('观察依据','SOURCE OBSERVATIONS',n.trees.slice(0,10).map(id=>{const r=recordMap.get(id);const obs=r.observations.filter(o=>o.name===n.label);return `<div class="observation-line">${chip('tree:'+id,id)} <strong>${[...new Set(obs.map(o=>o.traceContext?'天气记录（痕迹背景）':evidenceNames[o.evidence]))].join(' / ')}</strong><small>${obs.map(o=>escape(o.field+'：'+o.text)).join('<br>')}</small></div>`;}).join('')+(n.trees.length>10?'<p class="muted">以上展示前 10 份依据；其余原文可点击对应树洞查看。</p>':''))}</div>`;
  }
  function detailOther(n) {
    const connected=contextualGraph.links.filter(l=>l.source===n.id||l.target===n.id).map(l=>l.source===n.id?l.target:l.source);
    const description=n.concept??'此处为生态角色解释，使用虚线表示。关系来自类群知识或原始备注的解释，并不是现场测量、捕食证据或分解速率。';
    let content=section('可能的参与者与过程','CONCEPTUAL ASSOCIATIONS',`<div class="chips">${connected.map(id=>chip(id,undefined,'inferred')).join('')}</div>`)+(n.roles?.length?section('解释与资料','INTERPRETATION & SOURCES',roleContent(n.roles)):'');
    if(n.concept)content+=section('过程说明来源','BACKGROUND',sourceLink(window.TREE_ROLES.sources.soil));
    return head('ECOLOGICAL PROCESS')+`<div class="archive-body"><p class="subline">生态过程 / 生态角色推测</p><h2>${escape(n.label)}</h2><p>${escape(description)}</p>${content}</div>`;
  }
  function details() {
    if(!selected) {welcome();return;}
    const n=contextualGraph.nodes.find(n=>n.id===selected)??nodeMap.get(selected);
    $('details').innerHTML=n.type==='tree'?detailTree(n):n.type==='species'?detailSpecies(n):detailOther(n);
    $('archive').scrollTop=0;
  }
  function updateSelection() {
    const adjacent=selected?M.neighbors(contextualGraph,selected):null;
    elements.forEach((group,id)=>{
      group.classList.toggle('selected',id===selected);
      group.classList.toggle('dim',!!adjacent&&!adjacent.has(id));
      group.classList.toggle('emphasis',!!adjacent&&adjacent.has(id));
    });
    edgeElements.forEach(({element,link})=>{
      const related=link.source===selected||link.target===selected;
      element.classList.toggle('emphasis',!!selected&&related);
      element.classList.toggle('dim',!!selected&&!related);
    });
    $('selectionBar').hidden=!selected;
    if(selected) $('selectionLabel').textContent=nodeMap.get(selected).label+' · '+(adjacent.size-1)+' 个一阶关联';
    $('isolateButton').setAttribute('aria-pressed',String(isolated));
    $('isolateButton').textContent=isolated?'返回当前网络':'仅看关联';
    drawPositions();
  }
  function selectNode(id,fromSearch=false) {
    const n=nodeMap.get(id);if(!n)return;
    if(!contextualGraph.nodes.some(n=>n.id===id)) {resetContext();contextualGraph=graph;}
    if(fromSearch||!visible.nodes.some(v=>v.id===id)) {
      if(!types.has(n.type)) {types.add(n.type);document.querySelector(`.filters input[value="${n.type}"]`).checked=true;}
      if(!M.view(contextualGraph,viewName,types).nodes.some(v=>v.id===id)) viewName='all';
    }
    const changed=selected!==id;selected=id;showAllRecords=false;
    if(changed)mediaKind='photos';
    if(fromSearch) isolated=false;
    rebuild();details();
    $('searchResults').hidden=true;
    $('liveRegion').textContent='已选中'+n.label+'，右侧显示详情。';
    if(fromSearch) setTimeout(()=>{const p=positions.get(id);if(p){panX=width/2-p.x*zoom;panY=height*.45-p.y*zoom;transform();}},60);
  }
  function clearSelection() {selected=null;isolated=false;rebuild();welcome();}
  function setView(name) {viewName=name;isolated=false;rebuild();fit();}
  function rebuild() {
    contextualRecords=M.contextRecords(data.records,criteria);
    contextualGraph=M.contextGraph(data.records,window.TREE_ROLES,criteria);
    const subset=M.view(contextualGraph,viewName,types);
    if(selected&&!subset.nodes.some(n=>n.id===selected)) {selected=null;isolated=false;welcome();}
    visible=subset;
    if(isolated&&selected) {
      const related=M.neighbors(contextualGraph,selected);
      const nodes=subset.nodes.filter(n=>related.has(n.id)),ids=new Set(nodes.map(n=>n.id));
      visible={nodes,links:subset.links.filter(l=>ids.has(l.source)&&ids.has(l.target))};
    }
    const texts=viewNames[viewName];
    $('viewEnglish').textContent=texts[0];$('viewTitle').textContent=texts[1];$('viewHint').textContent=texts[2];
    document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===viewName;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    $('graphStatus').textContent=visible.nodes.length+' 节点 / '+visible.links.length+' 关系';
    const conditionText=['weather','direction','height'].map(key=>$(key+'Filter').selectedOptions[0].textContent);
    $('contextSummary').textContent=contextualRecords.length+' / '+data.records.length+' 份档案 · '+conditionText.join(' / ');
    $('emptyState').hidden=visible.nodes.length!==0;
    const total={};graph.nodes.forEach(n=>total[n.type]=(total[n.type]??0)+1);
    Object.keys(labels).forEach(type=>{$('type-'+type).textContent=visible.nodes.filter(n=>n.type===type).length+' / '+(total[type]??0);});
    $('nodes').replaceChildren();$('links').replaceChildren();elements=new Map();edgeElements=[];
    visible.nodes.forEach((n,i)=>{
      if(!positions.has(n.id)) {
        const angle=i*2.399963,rad=Math.sqrt((i+.5)/visible.nodes.length)*Math.min(width,height)*.36;
        positions.set(n.id,{id:n.id,x:width/2+Math.cos(angle)*rad,y:height*.47+Math.sin(angle)*rad,vx:0,vy:0});
      }
      const radius=n.type==='tree'?5.2:Math.min(32,11+Math.sqrt(n.count||1)*3.5);
      const p=positions.get(n.id);p.radius=radius;
      const group=el('g',{class:'graph-node','data-node':n.id,tabindex:'0',role:'button','aria-label':n.label+'，'+labels[n.type]+'，打开详情'});
      group.append(el('circle',{r:radius+6,class:'node-halo'}),el('circle',{r:radius,class:'node-core',fill:colors[n.type],stroke:n.type==='tree'?'#6b5cd2':'#7965d5'}));
      const title=el('title');title.textContent=n.label+(n.type==='species'?' · '+n.count+' 处关联树洞':'');group.append(title);
      const text=el('text',{y:radius+16});text.textContent=n.label;group.append(text);
      group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();selectNode(n.id);}});
      $('nodes').append(group);elements.set(n.id,group);
    });
    visible.links.forEach(link=>{
      const line=el('line',{class:'graph-edge '+link.kind});
      $('links').append(line);edgeElements.push({element:line,link});
    });
    updateSelection();reheat();
  }
  function drawPositions() {
    elements.forEach((g,id)=>{
      const p=positions.get(id),n=nodeMap.get(id);
      g.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
      const label=g.querySelector('text');
      const adjacent=selected&&M.neighbors(visible,selected).has(id);
      label.style.display=(n.type!=='tree'||id===selected||adjacent||zoom>1.8)?'':'none';
      if(n.type==='tree')label.setAttribute('font-size','9');
    });
    edgeElements.forEach(({element,link})=>{const a=positions.get(link.source),b=positions.get(link.target);element.setAttribute('x1',a.x);element.setAttribute('y1',a.y);element.setAttribute('x2',b.x);element.setAttribute('y2',b.y);});
  }
  function transform() {scene.setAttribute('transform',`translate(${panX} ${panY}) scale(${zoom})`);$('zoomLevel').textContent=Math.round(zoom*100)+'%';drawPositions();}
  function simulateStep() {
    const ps=visible.nodes.map(n=>positions.get(n.id));
    for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++) {
      const a=ps[i],b=ps[j];let dx=b.x-a.x,dy=b.y-a.y;
      let d2=dx*dx+dy*dy;
      if(d2<.1){dx=.7;dy=.7;d2=1;}
      const d=Math.sqrt(d2),min=a.radius+b.radius+22;
      const force=Math.min(6,1800/Math.max(d2,150))*alpha+(d<min?(min-d)*.07:0);
      const fx=dx/d*force,fy=dy/d*force;
      a.vx-=fx;a.vy-=fy;b.vx+=fx;b.vy+=fy;
    }
    visible.links.forEach(l=>{
      const a=positions.get(l.source),b=positions.get(l.target);
      const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;
      const preferred=a.radius+b.radius+(viewName==='all'||viewName==='tree'?65:95);
      const f=(d-preferred)*.009*alpha;
      a.vx+=dx/d*f;a.vy+=dy/d*f;b.vx-=dx/d*f;b.vy-=dy/d*f;
    });
    ps.forEach(p=>{
      const n=nodeMap.get(p.id);
      let cx=width/2,cy=height*.46;
      // Gentle anchors preserve the organism/process structure.
      if(n.type==='process'){cx=width*.67;cy=height*.60;}
      if(n.type==='species'){cx=width*.40;cy=height*.43;}
      p.vx+=(cx-p.x)*.0017*alpha;p.vy+=(cy-p.y)*.0017*alpha;
      p.vx*=.79;p.vy*=.79;
      if(p.fixed){p.vx=0;p.vy=0;}else{p.x+=p.vx;p.y+=p.vy;}
      if(!p.fixed){p.x=Math.max(p.radius+27,Math.min(width-p.radius-27,p.x));p.y=Math.max(p.radius+115,Math.min(height-p.radius-148,p.y));}
    });
  }
  function tick() {
    animation=0;
    if(paused||alpha<.006)return;
    for(let i=0;i<2;i++) simulateStep();
    alpha*=.97;drawPositions();animation=requestAnimationFrame(tick);
  }
  function reheat() {alpha=.8;if(!animation&&!paused)animation=requestAnimationFrame(tick);if(paused)drawPositions();}
  function fit() {zoom=1;panX=0;panY=0;transform();}
  function changeZoom(factor,cx=width/2,cy=height/2) {const next=Math.max(.3,Math.min(4,zoom*factor));panX=cx-(cx-panX)*next/zoom;panY=cy-(cy-panY)*next/zoom;zoom=next;transform();}
  function coords(event) {const rect=svg.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top};}
  const pointers=new Map();
  svg.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    const c=coords(event);pointers.set(event.pointerId,c);svg.setPointerCapture(event.pointerId);
    if(pointers.size===2) {
      if(gesture?.id)positions.get(gesture.id).fixed=false;
      const [a,b]=[...pointers.values()];gesture={pinch:true,dist:Math.hypot(a.x-b.x,a.y-b.y),moved:true};return;
    }
    const id=event.target.closest('[data-node]')?.dataset.node;
    gesture={id,start:c,last:c,moved:false,pointer:event.pointerId};
    if(id) {positions.get(id).fixed=true;svg.style.cursor='grabbing';}
  });
  svg.addEventListener('pointermove',event=>{
    if(!pointers.has(event.pointerId)||!gesture)return;
    const c=coords(event);pointers.set(event.pointerId,c);
    if(gesture.pinch&&pointers.size===2) {
      const [a,b]=[...pointers.values()],dist=Math.hypot(a.x-b.x,a.y-b.y);
      if(gesture.dist>0)changeZoom(dist/gesture.dist,(a.x+b.x)/2,(a.y+b.y)/2);
      gesture.dist=dist;return;
    }
    if(gesture.pinch)return;
    if(Math.hypot(c.x-gesture.start.x,c.y-gesture.start.y)>4)gesture.moved=true;
    if(gesture.id&&gesture.moved) {
      const p=positions.get(gesture.id);p.x=(c.x-panX)/zoom;p.y=(c.y-panY)/zoom;p.vx=p.vy=0;
      reheat();drawPositions();
    } else if(gesture.moved) {panX+=c.x-gesture.last.x;panY+=c.y-gesture.last.y;transform();}
    gesture.last=c;
  });
  function endPointer(event,cancelled=false) {
    pointers.delete(event.pointerId);
    if(!gesture)return;
    if(gesture.pinch) {if(pointers.size===0)gesture=null;return;}
    const previous=gesture;gesture=null;svg.style.cursor='';
    if(previous.id) {positions.get(previous.id).fixed=false;if(!previous.moved&&!cancelled)selectNode(previous.id);}
    else if(!previous.moved&&!cancelled)clearSelection();
  }
  svg.addEventListener('pointerup',event=>endPointer(event));
  svg.addEventListener('pointercancel',event=>endPointer(event,true));
  svg.addEventListener('wheel',event=>{event.preventDefault();const c=coords(event);changeZoom(Math.exp(-event.deltaY*.001),c.x,c.y);},{passive:false});
  svg.addEventListener('keydown',event=>{if(event.target!==svg)return;if(event.key==='+'||event.key==='='){event.preventDefault();changeZoom(1.2);}if(event.key==='-'){event.preventDefault();changeZoom(1/1.2);}if(event.key==='Escape')clearSelection();});
  $('details').addEventListener('click',event=>{
    const target=event.target.closest('button');if(!target)return;
    if(target.dataset.select)selectNode(target.dataset.select);
    else if(target.hasAttribute('data-clear'))clearSelection();
    else if(target.dataset.mediaKind){mediaKind=target.dataset.mediaKind;const r=nodeMap.get(selected)?.record;if(r)$('recordMedia').innerHTML=renderMedia(r);}
    else if(target.dataset.image){$('largeImage').src=target.dataset.image;$('largeImage').alt=target.dataset.caption;$('mediaCaption').textContent=target.dataset.caption+(target.dataset.image.includes('rubbings')?' · 图片角标已裁去，编号以表格为准':' · 实拍照片显示副本');$('mediaDialog').showModal();}
    else if(target.hasAttribute('data-show-all')){showAllRecords=true;const top=$('archive').scrollTop;details();$('archive').scrollTop=top;}
  });
  $('viewTabs').addEventListener('click',event=>{const b=event.target.closest('[data-view]');if(b)setView(b.dataset.view);});
  document.querySelectorAll('.filters input').forEach(input=>input.addEventListener('change',()=>{input.checked?types.add(input.value):types.delete(input.value);rebuild();}));
  function resetContext(){criteria={weather:'any',direction:'any',height:'any'};['weather','direction','height'].forEach(key=>$(key+'Filter').value='any');}
  function restoreFilters(){types=new Set(Object.keys(labels));document.querySelectorAll('.filters input').forEach(i=>i.checked=true);resetContext();rebuild();details();}
  for(const key of ['weather','direction','height']) $(key+'Filter').addEventListener('change',()=>{criteria[key]=$(key+'Filter').value;isolated=false;rebuild();details();fit();});
  $('clearContext').addEventListener('click',()=>{resetContext();rebuild();details();fit();});
  $('restoreFilters').addEventListener('click',restoreFilters);
  $('browseTrees').addEventListener('click',()=>{restoreFilters();setView('tree');});
  $('clearSelection').addEventListener('click',clearSelection);
  $('isolateButton').addEventListener('click',()=>{isolated=!isolated;rebuild();fit();});
  $('zoomIn').addEventListener('click',()=>changeZoom(1.2));$('zoomOut').addEventListener('click',()=>changeZoom(1/1.2));$('fitButton').addEventListener('click',fit);
  function pauseStatus(){$('pauseButton').setAttribute('aria-pressed',String(paused));$('pauseButton').setAttribute('aria-label',paused?'继续布局':'暂停布局');$('pauseButton').textContent=paused?'▷':'Ⅱ';}
  $('pauseButton').addEventListener('click',()=>{paused=!paused;pauseStatus();if(!paused)reheat();});
  $('resetButton').addEventListener('click',()=>{viewName='overview';selected=null;isolated=false;positions.clear();$('search').value='';$('searchResults').hidden=true;restoreFilters();welcome();fit();});
  function search() {
    const q=$('search').value.trim().toLowerCase();
    if(!q){$('searchResults').hidden=true;return;}
    const results=graph.nodes.filter(n=>n.label.toLowerCase().includes(q)).sort((a,b)=>{
      const ae=a.label.toLowerCase()===q,be=b.label.toLowerCase()===q;return Number(be)-Number(ae)||b.count-a.count;
    });
    $('searchResults').innerHTML=results.length?results.slice(0,35).map(n=>`<button data-result="${escape(n.id)}"><span>${escape(n.label)}</span><small>${labels[n.type]}</small></button>`).join('')+(results.length>35?'<p>仅展示前 35 项，请输入更具体的名称。</p>':''):'<p>没有找到记录，请试试 A1 或弓背蚁。</p>';
    $('searchResults').hidden=false;
  }
  $('search').addEventListener('input',search);$('search').addEventListener('focus',search);
  $('search').addEventListener('keydown',event=>{
    if(event.key==='Escape')$('searchResults').hidden=true;
    if(event.key==='Enter'){const b=$('searchResults').querySelector('[data-result]');if(b){event.preventDefault();selectNode(b.dataset.result,true);}}
    if(event.key==='ArrowDown'){event.preventDefault();$('searchResults').querySelector('button')?.focus();}
  });
  $('searchResults').addEventListener('click',event=>{const b=event.target.closest('[data-result]');if(b)selectNode(b.dataset.result,true);});
  $('clearSearch').addEventListener('click',()=>{$('search').value='';$('searchResults').hidden=true;$('search').focus();});
  document.addEventListener('pointerdown',event=>{if(!event.target.closest('.search-wrap'))$('searchResults').hidden=true;});
  const refs=window.TREE_ROLES.sources;
  $('methodContent').innerHTML=`<h3>数据来源与编号</h3><p>${escape(data.meta.source)} / ${escape(data.meta.sheet)}，共 ${data.records.length} 份树洞档案。${data.meta.photos} 张实拍照片与 ${data.meta.rubbings} 张拓片按 Excel 的锚点行、列和该行编号匹配，未分配图片 ${data.meta.unmatchedImages.length} 张。图片自身角标可能错位，不用于归档；拓片显示副本已移除角标并裁去外围空边。A4 角标覆盖拓片上缘，显示副本连同覆盖区域裁去，未补画。原工作簿与原图保持不变。</p><h3>主体与属性分层</h3><p>主网络展示树洞与生物。生态关系视图展示生物及可能的生态过程。天气、树洞朝向、离地高度是档案属性，放在左侧条件筛选和右侧详情中，不作为同级网络节点。多个条件同时生效。</p><h3>天气筛选</h3><p>晴天、雨天、阴天分别有 ${data.meta.weatherRecordedRows['晴天']}、${data.meta.weatherRecordedRows['雨天']}、${data.meta.weatherRecordedRows['阴天']} 行填写。指定天气时，网络仅使用该天气列的生物记录；未指定天气的备注仍保留在详情中。空白不是没有生物，调查覆盖不均，不能据此推断天气偏好或出现概率。</p><h3>朝向与高度</h3><p>高度记录 ${data.meta.heightRecorded} 份，朝向记录 ${data.meta.directionRecorded} 份，原始文字保留在详情。含多个高度的档案按任一值匹配区间；负值单列为“负值 · 按原表”，不推断测量基准。高度区间是页面派生分组，原表裸数沿用高度列的厘米语境。未填写或无法提取数值的高度不强制补值。</p><h3>关系与证据</h3><p>实线表示原始观察关联，点线表示痕迹，长虚线表示生态解释。羽化孔、蛛网、卵囊、粘液、白蚁路径等不会被当作活体计数。天气列仅写名称且备注只记痕迹时，保留天气列记录并标明痕迹背景。表内类群名称未强制合并，${data.meta.taxaLabels.length} 个标签不等于 ${data.meta.taxaLabels.length} 个经过鉴定的物种。</p><h3>操作</h3><p>拖动圆点，滚轮缩放，拖动空白平移；触屏双指缩放。点击节点显示当前条件中的一阶关系与档案。键盘 Tab 选择控件及节点，Enter / 空格打开节点，画布聚焦后 + / − 缩放，Esc 清除选择。搜索不可见档案时会清除冲突的属性条件以定位该档案。</p><h3>生态角色资料</h3><p>虚线表示可能性，不是本树洞实地测量。星天牛作为可能的木材利用者单列，拟蚁蛛不被默认设定为专门捕食蚂蚁。</p><ul>${Object.values(refs).map(s=>`<li>${sourceLink(s)}</li>`).join('')}</ul><p>网页离线可运行，外部资料链接需网络。完整行列映射和拓片裁切坐标见 data-audit.json。</p>`;
  const showInfo=()=>$('infoDialog').showModal();
  $('aboutButton').addEventListener('click',showInfo);$('dataNoteButton').addEventListener('click',showInfo);
  $('closeInfo').addEventListener('click',()=>$('infoDialog').close());$('closeMedia').addEventListener('click',()=>$('mediaDialog').close());
  for(const d of [$('infoDialog'),$('mediaDialog')])d.addEventListener('click',event=>{if(event.target===d){const rect=d.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)d.close();}});
  let resizeTimer;
  const resize=()=>{
    const oldW=width,oldH=height;const rect=svg.getBoundingClientRect();width=rect.width;height=rect.height;
    svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
    positions.forEach(p=>{p.x*=width/oldW;p.y*=height/oldH;});
    fit();reheat();
  };
  new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,80);}).observe(svg);
  $('recordCount').textContent=data.records.length;$('taxaCount').textContent=data.meta.taxaLabels.length;$('pictureCount').textContent=data.meta.photos+data.meta.rubbings;
  const rect=svg.getBoundingClientRect();width=rect.width;height=rect.height;
  welcome();rebuild();pauseStatus();
})();
