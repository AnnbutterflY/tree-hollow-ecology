(function(){'use strict';
const D=window.UI_DATA,L=window.UI_LOOT,clone=x=>JSON.parse(JSON.stringify(x));
const roles=new Map(D.roles.map(r=>[r.id,r])),points=new Map(D.points.map(p=>[p.id,p]));
const split=s=>String(s||'').split('、').filter(Boolean),name=m=>roles.get(m.role)?.生物||'',label=m=>name(m)+'——'+m.nickname;
const ranks={white:0,blue:1,purple:2,gold:3,rainbow:4};
function newMember(id){return {id,role:'',nickname:'',ready:false,online:true,clue:false,alive:true,phase:'role',signals:[],signalDone:false,run:null,home:null,awards:[],deposits:[]}}
function newRoom(code,host){return {protocol:3,id:crypto.randomUUID(),code,host,stage:'lobby',created:Date.now(),members:{[host]:newMember(host)},events:[],history:[],revision:0}}
function award(room,m,title,detail=''){const id=room.id+':'+title+':'+m.id;if(!m.awards.some(a=>a.id===id))m.awards.push({id,title,detail,at:Date.now()})}
function runFor(room,m,ids){const made=L.makeRun(ids.map(id=>points.get(id)).filter(Boolean));m.run={id:room.id+':'+m.id,bag:[],active:null,...made};for(const h of made.holes){h.originalValue=h.loot.reduce((s,i)=>s+i.value,0);h.highestTier=h.loot.reduce((t,i)=>ranks[i.tier]>ranks[t]?i.tier:t,'white');h.events=[];h.order=h.loot.slice().sort((a,b)=>a.y-b.y||a.x-b.x).map(i=>i.uid);h.cursor=0;h.due=0}m.phase='map'}
function resolveClues(room){
 const members=Object.values(room.members);if(!members.every(m=>m.clue))return;
 let pending=D.conflicts.flatMap(r=>members.flatMap(a=>members.filter(b=>a.id!==b.id&&name(a)===r.actor&&name(b)===r.target).map(b=>({...r,actorId:a.id,targetId:b.id}))));
 while(pending.length){pending=pending.filter(r=>room.members[r.actorId].alive&&room.members[r.targetId].alive);const rule=pending.find(r=>!pending.some(q=>q.targetId===r.actorId));if(!rule)break;const a=room.members[rule.actorId],b=room.members[rule.targetId];b.alive=false;b.phase='ended';b.failure={...rule,actorLabel:label(a),victimLabel:label(b)};room.events.push({type:'predation',...b.failure,at:Date.now()});award(room,b,'食物链的一环','被'+label(a)+'吃掉');award(room,a,'食物链上游','捕食了'+label(b));pending=pending.filter(r=>r!==rule)}
 for(const m of members.filter(x=>x.alive)){
  m.signals=D.round2.filter(r=>[r.生物A,r.生物B].includes(name(m))&&members.some(other=>other.alive&&other.id!==m.id&&[r.生物A,r.生物B].includes(name(other))&&name(other)!==name(m)));
  if(m.signals.length)m.phase='signal';else runFor(room,m,split(roles.get(m.role).第一轮候选编号));
 }
 room.stage='explore';
}
function duration(item){return Math.round(420+Math.log10(item.value+1)*240+Math.min(1800,item.value/100))}
function placement(mask,item,x,y,occupied=[]){return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&y+item.h<=mask.length&&x+item.w<=mask[0].length&&Array.from({length:item.h},(_,dy)=>Array.from({length:item.w},(_,dx)=>mask[y+dy][x+dx]&&!occupied.some(p=>x+dx>=p.x&&x+dx<p.x+p.w&&y+dy>=p.y&&y+dy<p.y+p.h))).flat().every(Boolean)}
const bagMask=Array.from({length:4},()=>Array(6).fill(true));
function classify(m,h){const vals=m.run.holes.map(p=>p.originalValue).sort((a,b)=>a-b),lo=vals[Math.floor((vals.length-1)/3)],hi=vals[Math.ceil((vals.length-1)*2/3)];if(vals[0]===vals.at(-1))return '平平无奇';return h.originalValue>hi?'如获珍宝':h.originalValue<=lo?'不毛之地':'平平无奇'}
function stars(m,h){const max=Math.max(...m.run.holes.map(x=>x.originalValue));return {resource:Math.max(1,Math.min(5,Math.ceil(h.originalValue/max*5))),protection:Math.min(5,h.events.filter(e=>e.resolved&&e.type==='hazard').length),danger:Math.min(5,h.events.filter(e=>e.type==='enemy'||e.type==='hazard').length)}}
function settleHomes(room){
 const live=Object.values(room.members).filter(m=>m.alive);if(!live.length||!live.every(m=>m.home))return;
 for(const m of live){const same=live.filter(p=>p.home===m.home);if(live.length===1&&Object.keys(room.members).length===1)award(room,m,'独自远行');else if(same.length===1)award(room,m,'独享树隙');
  for(const other of live.filter(p=>p.id!==m.id)){const signal=m.signals.some(r=>[r.生物A,r.生物B].includes(name(other)));award(room,m,signal?(m.home===other.home?'树隙搭档':'隔洞相望'):(m.home===other.home?'偶然的邻居':'两条平行线'),label(other))}
  if(same.length>=3)award(room,m,'一洞三家');if(live.length>=3&&new Set(live.map(x=>x.home)).size===live.length)award(room,m,'各有归处');
  const actors=same.map(p=>({role:name(p),nickname:p.nickname,id:p.id})),id=room.id+':home:'+m.home;if(!room.history.some(x=>x.id===id))room.history.push({id,at:Date.now(),actors,hole:m.home,achievements:[],status:'pending-battle'});
 }
 for(const h of room.history)h.achievements=[...new Set(live.filter(m=>m.home===h.hole).flatMap(m=>m.awards.map(a=>a.title)))];
}
function roomAction(state,actor,action,now=Date.now()){
 const room=clone(state),m=Object.hasOwn(room.members,actor)?room.members[actor]:null,a=action||{},error=message=>({state,error:message});
 if(a.type==='join'){if(m){m.online=true;return{state:room}}if(room.stage!=='lobby')return error('本轮已经开始，请等待下一轮。');if(Object.keys(room.members).length>=4)return error('房间已满，最多四人。');if(typeof actor!=='string'||actor.length>100)return error('无效身份');room.members[actor]=newMember(actor);return{state:room}}
 if(!m)return error('你不在这个房间中。');
 if(a.type==='presence'){m.online=!!a.online;return{state:room}}
 if(a.type==='role'){
  if(room.stage!=='lobby')return error('本轮角色已确定。');if(!roles.has(a.role))return error('请选择角色。');const nick=String(a.nickname||'').trim().slice(0,20);if(!nick)return error('请给自己取一个名字。');if(Object.values(room.members).some(p=>p.id!==actor&&p.role===a.role))return error('这个角色已被同伴选择。');Object.assign(m,{role:a.role,nickname:nick,ready:true});
 }else if(a.type==='begin'){
  if(actor!==room.host)return error('由房主开启本轮。');if(room.stage!=='lobby')return error('本轮已开始。');if(!Object.values(room.members).every(p=>p.ready&&p.online))return error('等所有同伴选好角色并在线后再出发。');room.stage='clues';for(const p of Object.values(room.members))p.phase='clue';
 }else if(a.type==='remove'){
  if(actor!==room.host||room.stage!=='lobby'||a.member===actor||!room.members[a.member])return error('只能在出发前移除同伴。');delete room.members[a.member];
 }else if(a.type==='clue'){
  if(room.stage!=='clues')return error('当前不能提交线索。');if(a.ids?.some(id=>!points.has(id)))return error('编号必须是有拓片的树洞。');m.clue=true;m.clueIds=[...new Set(a.ids||[])];m.phase='waiting';resolveClues(room);
 }else if(!m.alive)return error('本轮冒险已结束。');
 else if(a.type==='signal'){
  if(m.phase!=='signal'||m.signalDone)return error('没有待传递的线索。');m.signalDone=true;const ids=[...new Set(m.signals.flatMap(r=>split(r.共同树洞考察编号)))];runFor(room,m,ids);
  for(const r of m.signals){const dirs=r.生物信息方向.split('；');if(dirs.some(d=>d.trim().startsWith(name(m))))award(room,m,'把线索交给你');if(dirs.some(d=>d.split('→')[1]?.trim()===name(m)))award(room,m,'接住你的信号')}
 }else if(a.type==='open'){
  const h=m.run?.holes.find(x=>x.id===a.hole);if(!h||m.home)return error('这个树洞不在当前搜索范围。');m.run.active=h.id;m.phase='search';if(!h.searched&&!h.due){const i=h.loot.find(i=>i.uid===h.order[h.cursor]);h.due=now+duration(i)}
 }else if(a.type==='reveal'){
  const h=m.run?.holes.find(x=>x.id===m.run.active);if(!h||h.searched)return error('没有正在搜索的树洞。');if(now<h.due)return error('正在搜索，请稍候。');const item=h.loot.find(i=>i.uid===h.order[h.cursor]);if(item)item.revealed=true;h.cursor++;if(h.cursor>=h.order.length){h.searched=true;h.due=0;award(room,m,'第一件洞藏')}else h.due=now+duration(h.loot.find(i=>i.uid===h.order[h.cursor]));
 }else if(a.type==='close'){
  if(!m.run)return error('尚未进入搜索。');m.run.active=null;m.phase='map';
 }else if(['take','move','rotate','return'].includes(a.type)){
  const run=m.run,h=run?.holes.find(x=>x.id===run.active);if(!h||m.phase!=='search')return error('请先打开一个树洞。');
  if(a.type==='take'){const item=h.loot.find(i=>i.uid===a.uid&&!i.taken&&i.revealed);if(!item)return error('物品尚未找到。');const pos=Number.isInteger(a.x)?(placement(bagMask,item,a.x,a.y,run.bag)?{x:a.x,y:a.y}:null):L.fit(bagMask,item.w,item.h,run.bag);if(!pos)return error('背包放不下，请移动或放回其他物品。');run.bag.push({...item,...pos,origin:h.id});item.taken=true}
  else{const item=run.bag.find(i=>i.uid===a.uid);if(!item)return error('未找到背包物品。');const other=run.bag.filter(i=>i!==item);if(a.type==='return'){const existing=h.loot.find(i=>i.uid===item.uid);const pos=L.fit(h.mask,item.w,item.h,h.loot.filter(i=>!i.taken&&i!==existing&&!i.overflow));const returned={...item,...(pos||{x:-1,y:-1}),overflow:!pos,revealed:true,taken:false,returned:true};if(existing)Object.assign(existing,returned);else h.loot.push(returned);run.bag=other}else{const target={...item,...(a.type==='rotate'?{w:item.h,h:item.w}:{})},x=a.type==='move'?a.x:item.x,y=a.type==='move'?a.y:item.y;if(!placement(bagMask,target,x,y,other))return error('这里放不下，格子越界或与另一件物品重叠。');Object.assign(item,{x,y,w:target.w,h:target.h})}}
 }else if(a.type==='deposit'){
  if(!m.run||!m.run.bag.length)return error('背包中还没有藏品。');for(const i of m.run.bag){const claim=m.run.id+':'+i.uid;if(!m.deposits.some(x=>x.claim===claim))m.deposits.push({...i,claim,at:now})}m.run.bag=[];award(room,m,'第一件洞藏');
 }else if(a.type==='home'){
  if(!m.run?.holes.every(h=>h.searched)||m.home)return error('请先搜索完所有候选树洞。');const h=m.run.holes.find(x=>x.id===a.hole);if(!h)return error('请选择范围内的树洞。');if(!a.confirmEnvironment)return error('请确认已在现场查看环境。');m.home=h.id;m.phase='battle';const c=classify(m,h);award(room,m,c==='如获珍宝'?'满载之选':c==='不毛之地'?'别有洞天':'恰好安家');award(room,m,'安家树隙','玩家已确认现场环境；不视为物种适居的科学鉴定。');settleHomes(room);
 }else return error('不支持的操作。');
 room.revision++;return{state:room};
}
function roomView(room,id){const r=clone(room);delete r.joinSecrets;r.self=id;r.serverTime=Date.now();for(const m of Object.values(r.members))if(m.id!==id&&m.run){m.run.bag=[];for(const h of m.run.holes)h.loot=h.loot.filter(i=>i.revealed).map(i=>({...i}));m.deposits=[]}return r}
const Store={
 get(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}},
 set(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{window.dispatchEvent(new CustomEvent('save-error'));return false}},
 profile(nickname){const p=this.get('hollow-personal-v1:'+encodeURIComponent(nickname),{});return {nickname,balance:0,storage:[],collection:{},claims:[],stats:{},history:[],awards:{},...p}},
 save(p){return this.set('hollow-personal-v1:'+encodeURIComponent(p.nickname),p)},
 profiles(){return Object.keys(localStorage).filter(k=>k.startsWith('hollow-personal-v1:')).map(k=>this.get(k,null)).filter(Boolean)},
 sync(room,id){const m=room?.members[id];if(!m?.nickname)return;const p=this.profile(m.nickname);p.awards=p.awards||{};p.history=p.history||[];p.claims=p.claims||[];p.obtained=p.obtained||[];for(const a of m.awards)p.awards[a.id]=a;for(const d of m.deposits){if(!p.obtained.some(i=>i.uid===d.claim))p.obtained.push({...d,uid:d.claim});if(p.claims.includes(d.claim))continue;p.claims.push(d.claim);p.storage.push({...d,uid:d.claim,sourceRun:m.run?.id});p.stats.brought=(p.stats.brought||0)+1;if(d.tier==='gold'||d.tier==='rainbow')p.stats[d.tier]=(p.stats[d.tier]||0)+1}
  for(const h of room.history.filter(h=>h.actors.some(a=>a.id===id))){const idx=p.history.findIndex(x=>x.id===h.id);if(idx>=0)p.history[idx]=h;else p.history.push(h)}
  if(m.failure&&!p.history.some(h=>h.id===room.id+':failure:'+id))p.history.push({id:room.id+':failure:'+id,at:room.created,actors:[{role:name(m),nickname:m.nickname,id}],failure:m.failure,achievements:m.awards.map(a=>a.title),status:'ended'});
  p.searchedClaims=p.searchedClaims||[];if(m.run)for(const h of m.run.holes.filter(h=>h.searched)){const key=m.run.id+':'+h.id;if(!p.searchedClaims.includes(key)){p.searchedClaims.push(key);p.stats.searched=(p.stats.searched||0)+1}}p.homeClaims=p.homeClaims||[];if(m.home&&!p.homeClaims.includes(room.id)){p.homeClaims.push(room.id);p.stats.homes=(p.stats.homes||0)+1}p.fullBagClaims=p.fullBagClaims||[];if(m.run&&m.run.bag.reduce((n,i)=>n+i.w*i.h,0)===24&&!p.fullBagClaims.includes(m.run.id)){p.fullBagClaims.push(m.run.id);p.stats.fullBag=(p.stats.fullBag||0)+1}p.lastRole=m.role;this.save(p);
 },
 transact(nick,uid,mode){const p=this.profile(nick),i=p.storage.find(x=>x.uid===uid);if(!i)return false;p.storage=p.storage.filter(x=>x.uid!==uid);if(mode==='sell'){p.balance+=i.value;p.stats.sold=(p.stats.sold||0)+1}else{p.collection[i.name]=(p.collection[i.name]||0)+1}return this.save(p)},
 backup(){const data={};for(const k of Object.keys(localStorage))if(/^hollow-(personal-v1:|role-nicks-v1$|ui-v3-)/.test(k)&&!k.includes('host-'))data[k]=localStorage.getItem(k);return{format:'hollow-local-save',version:1,exported:new Date().toISOString(),data}},
 validateImport(obj){if(obj?.format!=='hollow-local-save'||obj.version!==1||!obj.data||typeof obj.data!=='object')throw Error('这不是树隙之间存档。');const entries=Object.entries(obj.data);if(entries.length>300)throw Error('存档内容过多。');for(const [k,v]of entries){if(!/^hollow-(personal-v1:|role-nicks-v1$|ui-v3-)/.test(k)||k.includes('host-')||typeof v!=='string'||v.length>8000000)throw Error('存档字段无效。');const p=JSON.parse(v);if(k.startsWith('hollow-personal-v1:')&&(!Array.isArray(p.storage)||!Array.isArray(p.claims)||!Number.isFinite(p.balance)||p.balance<0||typeof p.nickname!=='string'))throw Error('个人库数据不完整。')}return entries},
 import(obj){const entries=this.validateImport(obj),before=entries.map(([k])=>[k,localStorage.getItem(k)]);try{for(const[k,v]of entries)localStorage.setItem(k,v)}catch(e){for(const[k,v]of before){if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v)}throw Error('空间不足，已恢复原存档。')}return entries.length}
};
window.HollowCore={D,L,roles,points,split,name,label,newRoom,roomAction,roomView,placement,bagMask,classify,stars,duration,Store};
})();
