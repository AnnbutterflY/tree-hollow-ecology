/* Knowledge layer: never mutates spreadsheet records or their occurrence counts. */
(() => {
 const refs={
  soil:['明尼苏达大学 · 土壤中的生命','https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/living-soil-healthy-garden'],
  matter:['马里兰大学 · 土壤有机质与养分','https://www.extension.umd.edu/resource/soil-basics'],
  litter:['明尼苏达大学 · 等足类与马陆','https://extension.umn.edu/garden-and-home/home-maintenance/household-insects/sowbugs-millipedes-and-centipedes'],
  spring:['明尼苏达大学 · 弹尾虫','https://extension.umn.edu/garden-and-home/home-maintenance/household-insects/springtails'],
  predator:['加州大学 IPM · 捕食性天敌','https://ipm.ucanr.edu/home-and-landscape/beneficial-predators/'],
  aphid:['加州大学 IPM · 蚜虫','https://ipm.ucanr.edu/home-and-landscape/aphids/'],
  ant:['加州大学 IPM · 生物防治与蚂蚁','https://ipm.ucanr.edu/home-and-landscape/biological-control-and-natural-enemies-of-invertebrates/'],
  lace:['加州大学 IPM · 网蝽','https://ipm.ucanr.edu/home-and-landscape/lace-bugs/']
 };
 const nodes=[
  ['plant','悬铃木与周边植物','生产者',70,185,[], '植物通过光合作用把光能转为有机物中的化学能。叶片、木材、根系分泌物和枯落物，把树冠与树洞、土壤的食物网连接起来。','soil'],
  ['herb','网蝽等植食者','知识补充',320,90,[], '网蝽刺吸叶片组织。此处以网蝽类群示意植食通道；表格没有网蝽记录，不据这张示意图增加校园物种记录。具体物种与取食部位需要补充鉴定。','lace'],
  ['aphid','蚜虫 / 蜜露','知识补充',320,240,[], '蚜虫取食植物汁液并排出含糖蜜露，可为某些蚂蚁提供食物。它是解释蚁类关系的延伸节点，表格没有蚜虫记录。','aphid'],
  ['pred','蜘蛛 / 拟蚁蛛','捕食者',590,90,['蜘蛛','拟蚁蛛'], '蜘蛛捕食小型节肢动物，把多条食物路径连接起来。拟蚁外形不等于专吃蚂蚁；这里不指定本项目未观察到的猎物组合。','predator'],
  ['enemy','草蛉等捕食者','知识补充',590,235,[], '草蛉幼虫可以捕食蚜虫等小型猎物；成虫的食性可能不同。未把参考图中的瓢虫、红纹螨直接认定为已记录物种或已确认天敌。','predator'],
  ['ants','弓背蚁等蚂蚁','杂食 / 活动',845,240,['弓背蚁','蚂蚁','大头蚁','举腹蚁'], '表格记录了蚁类活动。某些蚂蚁利用蜜露并保护产蜜露昆虫，但本项目没有记录这种互作；不能由蚂蚁和网蝽共同出现推出保护关系。','ant'],
  ['dead','枯叶 / 腐木 / 残体','有机物入口',70,440,[], '植物枯落物、动物残体与排泄物进入碎屑食物网。此处是生态过程节点，不是表格中额外统计的样本。','matter'],
  ['det','西瓜虫 / 马陆','碎屑取食者',320,420,['西瓜虫','马陆'], '它们利用腐败植物材料，取食和碎化有机残体。与真菌、细菌的分解相互衔接，但不能把碎化与矿化视为同一个过程。','litter'],
  ['fungi','腐生真菌 / 细菌','分解者',590,440,['真菌','霉菌','胶质真菌','晶粒鬼伞','纯白微皮伞','靴耳'], '微生物分解有机物，部分养分转成植物可利用的无机形式。表内有真菌标签，但不是所有真菌都可直接认定为木腐菌；细菌为知识补充，未经项目检测。','soil'],
  ['spring','弹尾虫','微食物网',590,610,['弹尾虫'], '弹尾虫可以取食真菌、藻类、花粉和腐败有机物。它连接微生物资源与小型动物食物网，具体食谱因种类而异。','spring'],
  ['nutrient','可利用养分','矿化与吸收',845,440,[], '分解释放的部分养分可被根系和微生物吸收，另一些会固定、流失或暂存于有机质中。返回植物的是物质；能量在呼吸等过程中逐步散失。','matter'],
  ['wood','白蚁 / 天牛幼虫','木材利用',320,610,['白蚁','天牛','星天牛'], '白蚁与一些天牛幼虫可利用木材资源。天牛幼虫还可能利用活树组织，并非都属于腐食者。表格中的蛀孔、羽化孔或路径首先是痕迹，不自动等同于活体或正在取食。',null]
 ].map(([id,label,role,x,y,taxa,text,ref])=>({id,label,role,x,y,taxa,text,ref}));
 const edges=[
  ['plant','herb','叶片取食','活体植物 → 植食者','网蝽取食叶片组织。此箭头表达一般取食关系，不代表已在这些树洞中观察到。','lace','green'],
  ['plant','aphid','汁液取食','植物汁液 → 蚜虫','蚜虫利用植物汁液；这一节点用于补充食物网背景。','aphid','green'],
  ['herb','pred','潜在捕食','植食性小虫 → 捕食者','蜘蛛是广食性捕食者。该箭头仅表示可能通道，不指定本地网蝽与某一种蜘蛛的实际捕食事件。','predator','green'],
  ['aphid','enemy','捕食','蚜虫 → 草蛉幼虫','草蛉幼虫可捕食蚜虫；角色需要区分生活史阶段。','predator','green'],
  ['aphid','ants','蜜露资源','蜜露 → 蚂蚁','某些蚂蚁取食产蜜露昆虫提供的含糖分泌物。这里不是给所有蚁种规定食谱。','ant','mutual'],
  ['ants','aphid','保护互作','蚂蚁 → 产蜜露昆虫','部分蚁类会干扰天敌，保护产蜜露昆虫。这不是能量流向，也不是已确认的弓背蚁—网蝽关系。','ant','mutual'],
  ['plant','dead','枯落','植物 → 有机残体','枯叶、死亡组织等为碎屑食物网提供资源。','matter','brown'],
  ['dead','det','碎屑取食','腐败植物材料 → 碎屑取食者','西瓜虫和马陆利用腐烂植物材料，促进残体碎化。','litter','brown'],
  ['dead','fungi','分解基质','有机残体 → 分解者','腐生微生物利用有机物；这条路线可以与动物碎化并行，并不是必须先经过动物。','soil','brown'],
  ['det','fungi','碎化衔接','碎化与排泄 → 微生物分解','碎屑取食产生的细小残体与排泄物可继续进入微生物处理过程。箭头表示过程衔接，不是“真菌捕食西瓜虫”。','matter','brown'],
  ['fungi','spring','菌食','真菌资源 → 弹尾虫','部分弹尾虫取食真菌；也可能利用藻类、花粉等其他资源。','spring','brown'],
  ['spring','pred','潜在捕食','微型动物 → 捕食者','将微食物网连接到广食性捕食者的概念通道；具体捕食对象仍需现场观察。','predator','brown'],
  ['fungi','nutrient','矿化','有机养分 → 可利用无机养分','微生物分解伴随养分转化，也伴随微生物自身吸收和暂时固定。','matter','cycle'],
  ['nutrient','plant','根系吸收','养分 → 植物','养分经根系吸收重新进入植物体。这是物质循环，不是能量循环，也不代表测得了某棵树的养分通量。','soil','cycle'],
  ['dead','wood','部分木材利用','木质资源 → 木材利用者','白蚁和一些天牛幼虫可利用木材。天牛也可能从活体组织取食，所以此线不把所有天牛归为碎屑消费者。',null,'brown']
 ].map(([from,to,label,title,text,ref,path],i)=>({id:'edge'+i,from,to,label,title,text,ref,path}));
 window.FOOD_WEB={nodes,edges,refs};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nodeMap=new Map(nodes.map(n=>[n.id,n])),workspace=document.querySelector('.workspace'),tabs=document.getElementById('viewTabs');
 const button=document.createElement('button');button.id='foodwebTab';button.textContent='食物网与循环';button.setAttribute('aria-pressed','false');tabs.prepend(button);
 const panel=document.createElement('section');panel.id='foodwebPanel';panel.hidden=true;
 panel.innerHTML=`<header class="food-intro"><span>FOOD WEB / MATTER CYCLE</span><h2>从一片叶，到树洞里的循环。</h2><p>实心节点关联表格记录，空心节点补充生态知识。箭头旁的文字说明关系；连线均为知识解释，不是本地捕食实证。</p><div class="food-paths"><button data-path="all" aria-pressed="true">完整食物网</button><button data-path="green">植食与捕食</button><button data-path="brown">碎屑与分解</button><button data-path="cycle">养分回归</button><button data-path="mutual">蜜露与蚂蚁</button></div></header><div class="food-layout"><div class="food-scroll"><svg viewBox="0 0 1000 790" role="group" aria-label="可点击的食物网与物质循环"><defs><marker id="foodArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="#8b80c5"/></marker></defs><text class="food-row" x="32" y="28">01  绿色食物通道</text><text class="food-row" x="32" y="357">02  碎屑食物通道</text><g id="foodEdges"></g><g id="foodNodes"></g><text class="food-foot" x="32" y="760">物质可以循环 · 能量沿食物关系传递，并通过呼吸等过程散失</text></svg></div><aside id="foodDetail" aria-live="polite"></aside></div>`;
 workspace.after(panel);
 const svgNS='http://www.w3.org/2000/svg';function el(tag,attrs){const e=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));return e;}
 const source=key=>key?`<a href="${refs[key][1]}" target="_blank" rel="noopener">${refs[key][0]} ↗</a>`:'';
 const relatedRecords=n=>window.TREE_DATA.records.filter(r=>r.observations.some(o=>n.taxa.includes(o.name)));
 function showNode(n){const rows=relatedRecords(n);document.getElementById('foodDetail').innerHTML=`<small>${esc(n.role)}</small><h3>${esc(n.label)}</h3><p>${esc(n.text)}</p>${source(n.ref)}${rows.length?`<h4>${rows.length} 份相关表格档案</h4><p class="food-note">包含名称与痕迹记录；关联档案不等于观察到了这条食物关系。</p><div class="chips">${rows.map(r=>`<button class="chip" data-food-record="${r.id}">${r.id}</button>`).join('')}</div>`:'<p class="food-note">知识补充节点，不增加表格中的物种数、记录数或观察次数。</p>'}<h4>连接关系</h4>${edges.filter(e=>e.from===n.id||e.to===n.id).map(e=>`<button class="food-relation" data-food-edge="${e.id}">${esc(e.title)} →</button>`).join('')}`;highlight(new Set([n.id,...edges.filter(e=>e.from===n.id||e.to===n.id).flatMap(e=>[e.from,e.to])]),edges.filter(e=>e.from===n.id||e.to===n.id));}
 function showEdge(e){document.getElementById('foodDetail').innerHTML=`<small>关系解释</small><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p>${source(e.ref)}<p class="food-note">基于生态知识的示意关系，未作为本项目现场观察写入表格。</p><button class="food-relation" data-food-node="${e.from}">${esc(nodeMap.get(e.from).label)}</button><button class="food-relation" data-food-node="${e.to}">${esc(nodeMap.get(e.to).label)}</button>`;highlight(new Set([e.from,e.to]),[e]);}
 function highlight(ids,activeEdges){panel.querySelectorAll('.food-node').forEach(e=>e.classList.toggle('dimmed',!ids.has(e.dataset.id)));const selected=new Set(activeEdges.map(e=>e.id));panel.querySelectorAll('.food-edge').forEach(e=>e.classList.toggle('dimmed',!selected.has(e.dataset.id)));}
 edges.forEach(e=>{const a=nodeMap.get(e.from),b=nodeMap.get(e.to),g=el('g',{class:'food-edge',role:'button',tabindex:0,'aria-label':e.title,'data-id':e.id});let d,mx,my;
  if(e.path==='cycle'&&e.to==='plant'){d=`M ${a.x+73} ${a.y+74} C 955 690, 955 722, 870 722 L 95 722 Q 32 722, 32 659 L 32 267 Q 32 222, ${b.x} ${b.y+37}`;mx=680;my=711;}
  else if(e.from==='dead'&&e.to==='fungi'){d=`M ${a.x+100} ${a.y} C 255 360, 520 360, ${b.x+45} ${b.y}`;mx=385;my=378;}
  else if(e.path==='mutual'){const back=e.from==='ants',lane=back?338:200;d=`M ${a.x+73} ${a.y+(back?74:0)} C ${a.x+73} ${lane}, ${b.x+73} ${lane}, ${b.x+73} ${b.y+(back?74:0)}`;mx=655;my=lane+(back?-2:-8);}
  else if(e.from==='spring'&&e.to==='pred'){d=`M ${a.x+146} ${a.y+30} C 815 640, 815 125, ${b.x+146} ${b.y+30}`;mx=792;my=380;}
  else{const ax=a.x+65,ay=a.y+30,bx=b.x+65,by=b.y+30,dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;const sx=ax+ux*54,sy=ay+uy*42,tx=bx-ux*60,ty=by-uy*42;d=`M ${sx} ${sy} L ${tx} ${ty}`;mx=(sx+tx)/2;my=(sy+ty)/2-7;}
  g.append(el('path',{d,class:'food-edge-hit'}),el('path',{d,class:'food-edge-line','marker-end':'url(#foodArrow)'}));const t=el('text',{x:mx,y:my,'text-anchor':'middle'});t.textContent=e.label;g.append(t);g.addEventListener('click',()=>showEdge(e));g.addEventListener('keydown',ev=>{if(['Enter',' '].includes(ev.key)){ev.preventDefault();showEdge(e)}});document.getElementById('foodEdges').append(g);
 });
 nodes.forEach(n=>{const rows=relatedRecords(n),g=el('g',{class:'food-node '+(rows.length?'recorded':'concept'),transform:`translate(${n.x},${n.y})`,tabindex:0,role:'button','aria-label':n.label,'data-id':n.id});g.append(el('rect',{width:146,height:74,rx:18}));const title=el('text',{x:73,y:31,'text-anchor':'middle'});title.textContent=n.label;const role=el('text',{x:73,y:53,'text-anchor':'middle',class:'food-node-role'});role.textContent=n.role;g.append(title,role);g.addEventListener('click',()=>showNode(n));g.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();showNode(n)}});document.getElementById('foodNodes').append(g)});
 function activate(){workspace.hidden=true;panel.hidden=false;tabs.querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});document.getElementById('resetButton').hidden=true;}
 button.addEventListener('click',activate);tabs.addEventListener('click',e=>{if(e.target.closest('[data-view]')){workspace.hidden=false;panel.hidden=true;button.classList.remove('active');button.setAttribute('aria-pressed','false');document.getElementById('resetButton').hidden=false;window.dispatchEvent(new Event('resize'));}});
 panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.path){const subset=b.dataset.path==='all'?edges:edges.filter(x=>x.path===b.dataset.path);highlight(new Set(subset.flatMap(x=>[x.from,x.to])),subset);panel.querySelectorAll('[data-path]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));}if(b.dataset.foodNode)showNode(nodeMap.get(b.dataset.foodNode));if(b.dataset.foodEdge)showEdge(edges.find(x=>x.id===b.dataset.foodEdge));if(b.dataset.foodRecord){tabs.querySelector('[data-view="all"]').click();document.dispatchEvent(new CustomEvent('foodweb:record',{detail:b.dataset.foodRecord}));}});
 showNode(nodes[0]);highlight(new Set(nodes.map(n=>n.id)),edges);activate();
})();
