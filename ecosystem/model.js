/* Pure data model; no browser/network dependencies. */
(function (root) {
  'use strict';
  function build(records, roles) {
    const nodes = new Map(), links = new Map();
    const node = (id, label, type, extra = {}) => {
      if (!nodes.has(id)) nodes.set(id, {id,label,type,count:0,...extra});
      return nodes.get(id);
    };
    const link = (source,target,kind,recordId,extra={}) => {
      const key = source+'|'+target;
      if (!links.has(key)) links.set(key,{id:key,source,target,kind,records:[],count:0,...extra});
      const l=links.get(key);
      if(recordId&&!l.records.includes(recordId)) {l.records.push(recordId);l.count=l.records.length;}
      return l;
    };
    records.forEach(r=>{
      const tid='tree:'+r.id;
      node(tid,r.id,'tree',{record:r,zone:r.zone});
      const byTaxon=new Map();
      r.observations.forEach(o=>{
        const sid='species:'+o.name;
        const n=node(sid,o.name,'species',{trees:[],weather:{},evidence:{record:[],trace:[],interpretation:[]}});
        if(!n.trees.includes(r.id)) n.trees.push(r.id);
        n.count=n.trees.length;
        const bucket=o.evidence==='weather'?(o.traceContext?'trace':'record'):o.evidence;
        if(n.evidence[bucket]&&!n.evidence[bucket].includes(r.id)) n.evidence[bucket].push(r.id);
        if(!byTaxon.has(sid)) byTaxon.set(sid,[]);
        byTaxon.get(sid).push(o);
        if(o.evidence==='weather') {
          n.weather[o.field]??=[];
          if(!n.weather[o.field].includes(r.id)) n.weather[o.field].push(r.id);
        }
      });
      byTaxon.forEach((observations,sid)=>{
        const kind=observations.some(o=>o.evidence==='record'||(o.evidence==='weather'&&!o.traceContext))?'observation':observations.some(o=>o.evidence==='trace'||o.traceContext)?'trace':'interpretation';
        link(tid,sid,kind,r.id,{observations});
      });
    });
    roles.forEach(role=>{
      const sid='species:'+role.species;
      if(!nodes.has(sid)) return;
      const species=nodes.get(sid);
      species.roles??=[];species.roles.push(role);
      const p=node('process:'+role.process,role.process,'process',{roles:[]});
      p.roles.push(role);
      link(sid,p.id,'inferred',null,{role, count:1});
    });
    // The two steps below are conceptual processes, never local measurements.
    if(nodes.has('process:木材分解')||nodes.has('process:碎屑利用')) {
      node('process:腐殖化','腐殖化','process',{roles:[],concept:'有机残体转化为土壤有机质的概念过程；未进行本项目的土壤测量。'});
      node('process:养分循环','养分循环','process',{roles:[],concept:'有机物分解可能释放并转移养分；本网络未测量养分通量。'});
      for(const p of ['木材分解','碎屑利用']) if(nodes.has('process:'+p)) link('process:'+p,'process:腐殖化','inferred',null,{count:1});
      link('process:腐殖化','process:养分循环','inferred',null,{count:1});
    }
    if(root.FOOD_WEB){
      const knowledge=root.FOOD_WEB;
      knowledge.nodes.forEach(k=>{
        const type=['dead','nutrient'].includes(k.id)?'process':'species';
        node('knowledge:'+k.id,k.label,type,{knowledge:true,concept:k.text,source:k.ref?{title:knowledge.refs[k.ref][0],url:knowledge.refs[k.ref][1]}:null,roles:[],trees:[],weather:{},evidence:{record:[],trace:[],interpretation:[]}});
        k.taxa.forEach(taxon=>{if(nodes.has('species:'+taxon))link('species:'+taxon,'knowledge:'+k.id,'inferred',null,{count:1,explanation:'类群与生态功能的对应，不表示发生于某一树洞。'});});
      });
      knowledge.edges.forEach(e=>link('knowledge:'+e.from,'knowledge:'+e.to,'inferred',null,{count:1,label:e.label,explanation:e.text,sourceRef:e.ref?{title:knowledge.refs[e.ref][0],url:knowledge.refs[e.ref][1]}:null}));
    }
    return {nodes:[...nodes.values()],links:[...links.values()]};
  }
  function view(graph,name,types) {
    if(name==='overview') {
      const nodes=graph.nodes.filter(n=>n.type==='species'&&!n.knowledge&&types.has('species'));
      const ids=new Set(nodes.map(n=>n.id)),byTree=new Map(),pairs=new Map();
      graph.links.forEach(l=>{if(l.source.startsWith('tree:')&&ids.has(l.target)){if(!byTree.has(l.source))byTree.set(l.source,new Set());byTree.get(l.source).add(l.target);}});
      byTree.forEach((species,tree)=>{const list=[...species].sort();for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const key=list[i]+'|'+list[j];if(!pairs.has(key))pairs.set(key,{id:key,source:list[i],target:list[j],kind:'association',records:[],count:0});const pair=pairs.get(key);pair.records.push(tree.slice(5));pair.count++;}});
      return {nodes,links:[...pairs.values()].sort((a,b)=>b.count-a.count||a.id.localeCompare(b.id)).slice(0,24)};
    }
    let allowed;
    if(name==='overview') allowed=new Set(['tree','species']);
    else if(name==='tree') allowed=new Set(['tree','species']);
    else if(name==='ecology') allowed=new Set(['species','process']);
    else allowed=new Set(['tree','species','process']);
    const linked=new Set(graph.links.flatMap(l=>[l.source,l.target]));
    const nodes=graph.nodes.filter(n=>allowed.has(n.type)&&types.has(n.type)&&(name!=='tree'||!n.knowledge));
    const ids=new Set(nodes.map(n=>n.id));
    return {nodes,links:graph.links.filter(l=>ids.has(l.source)&&ids.has(l.target))};
  }
  function neighbors(graph,id) {
    const result=new Set([id]);
    graph.links.forEach(l=>{if(l.source===id) result.add(l.target);if(l.target===id) result.add(l.source);});
    return result;
  }
  function heightMatches(r,value) {
    const heights=r.heightValuesCm??(Number.isFinite(r.heightCm)?[r.heightCm]:[]);
    if(value==='any')return true;
    if(value==='missing')return !heights.length;
    if(value==='negative')return heights.some(h=>h<0);
    if(value==='low')return heights.some(h=>h>=0&&h<50);
    if(value==='middle')return heights.some(h=>h>=50&&h<150);
    if(value==='high')return heights.some(h=>h>=150);
    return false;
  }
  function contextRecords(records,criteria={}) {
    const {weather='any',height='any',direction='any'}=criteria;
    return records.filter(r=>{
      const d=(r.direction??'').match(/(东北|东南|西北|西南|北|南|东|西)/)?.[1];
      return heightMatches(r,height)&&(direction==='any'||(direction==='missing'?!r.direction:d===direction))&&(weather==='any'||(weather==='missing'?!Object.values(r.weather??{}).some(v=>v!==null&&v!==undefined&&v!==''):r.weather?.[weather]!==null&&r.weather?.[weather]!==undefined&&r.weather?.[weather]!==''));
    });
  }
  function contextGraph(records,roles,criteria={}) {
    const filtered=contextRecords(records,criteria);
    const weather=criteria.weather??'any';
    return build(filtered.map(r=>({...r,observations:weather==='any'?r.observations:weather==='missing'?r.observations.filter(o=>o.evidence!=='weather'):r.observations.filter(o=>o.evidence==='weather'&&o.field===weather)})),roles);
  }
  root.TreeModel={build,view,neighbors,contextGraph,contextRecords};
})(window);
