(function(){'use strict';
const tiers=['white','blue','purple','gold','rainbow'],L=window.UI_LOOT;
const limited=[
 ['雨珠','rainbow',1,1,300000],['树蜜胶','rainbow',1,2,360000],
 ['守藏者的收藏-蚁群标本','gold',2,2,95000],['守藏者的收藏-蝴蝶标本','rainbow',2,2,480000],['友情脚链','gold',1,1,35000]
].map(([name,tier,w,h,value],i)=>({id:'event-'+(i+1),name,tier,w,h,value,eventOnly:true,art:'assets/event-items-retro/event-'+(i+1)+'.webp'}));
const defs={
 rain:{name:'雨水渗入',allowed:['雨季水位尺','雨滴透镜','雨后泥点','树皮薄片'],layer:'rain',title:'rain'},
 wind:{name:'一阵穿堂风',allowed:['羽毛轻舟','卷边落叶','半透明翅片','褪色纸角','蛛丝小结'],layer:'wind',title:'wind'},
 bark:{name:'松动的树皮',allowed:['树皮薄片','细枝小叉','失物小匣'],layer:'bark',title:'bark'},
 human:{name:'陌生人类',allowed:null,layer:'human',title:'human'},
 tremor:{name:'远处的震动',allowed:['三重足迹','振动乐章','完整蝉蜕','干草软垫'],layer:'tremor',title:'tremor'}
};
const clone=o=>JSON.parse(JSON.stringify(o)),hole=m=>m.run?.holes.find(h=>h.id===m.run.active);
function random(e){let x=e.seed|0;x^=x<<13;x^=x>>>17;x^=x<<5;e.seed=x>>>0;return e.seed/4294967296}
function pick(e,list){return list[Math.floor(random(e)*list.length)]}
function makeItem(e,base){return {...base,uid:e.id+':item:'+(e.seq=(e.seq||0)+1),revealed:true,taken:false,origin:e.hole,eventSource:e.type}}
function normal(e,tier,exclude=''){return makeItem(e,pick(e,L.ITEMS.filter(i=>i.tier===tier&&i.name!==exclude)))}
function limitedItem(e,index){return makeItem(e,limited[index])}
function chance(m){const hs=m.run?.holes||[],done=hs.filter(h=>h.searched||h.blocked).length;return hs.length>1?Math.min(.4,.4*done/(hs.length-1)):0}
function enter(m,h,now,roll=Math.random){if(h.eventChecked||h.searched)return false;h.eventChecked=true;h.eventChance=chance(m);if(roll()>=h.eventChance)return false;
 const type=Object.keys(defs)[Math.floor(roll()*5)];m.event={id:crypto.randomUUID(),type,hole:h.id,stage:'intro',started:now,stageAt:now,seed:Math.floor(roll()*4294967295)||1,seq:0,cycle:0,deadline:0};h.due=0;m.phase='event';h.events.push({id:m.event.id,type:type==='human'?'visitor':'hazard',name:defs[type].name,resolved:false});return true}
function startForTest(m,h,type,now){h.eventChecked=false;const keys=Object.keys(defs);let n=0;const vals=[-1,(keys.indexOf(type)+.1)/5,.37];return enter(m,h,now,()=>vals[n++])}
function setStage(e,stage,now){e.stage=stage;e.stageAt=now;e.deadline=0}
function record(room,m,title,detail,now){const id=room.id+':event:'+title+':'+m.id;if(!m.awards.some(a=>a.id===id))m.awards.push({id,title,detail,at:now})}
function resume(room,m,now){const h=hole(m),e=m.event;if(h){const log=h.events.find(x=>x.id===e.id);if(log){log.resolved=true;log.outcome=e.outcome;log.at=now}h.due=h.searched?0:now+window.HollowCore.duration(h.loot.find(i=>i.uid===h.order[h.cursor]));}m.event=null;m.phase='search'}
function die(room,m,reason,now){const e=m.event;m.alive=false;m.phase='ended';m.failure={event:true,eventType:e.type,reason,actorLabel:defs[e.type].name,victimLabel:window.HollowCore.label(m)};record(room,m,'未竟的冒险',reason,now);e.stage='dead';e.deadline=0;room.events.push({type:'event-death',member:m.id,reason,at:now})}
function flood(room,m,now){const h=hole(m);h.blocked=true;h.searched=true;h.due=0;h.events.find(x=>x.id===m.event.id).outcome='积水封洞';m.event=null;m.run.active=null;m.phase='map';record(room,m,'暂避雨幕','保全自己，放弃积水树洞 '+h.id,now)}
function recordValue(m,item){const h=hole(m);h.eventClaims=h.eventClaims||[];if(h.eventClaims.includes(item.uid))return;h.eventClaims.push(item.uid);h.eventValue=(h.eventValue||0)+item.value;if(tiers.indexOf(item.tier)>tiers.indexOf(h.highestTier))h.highestTier=item.tier}
function putReward(m,item){recordValue(m,item);const C=window.HollowCore,pos=L.fit(C.bagMask,item.w,item.h,m.run.bag)||L.fit(C.bagMask,item.h,item.w,m.run.bag);if(pos)m.run.bag.push({...item,...pos});else{const h=hole(m);h.loot.push({...item,x:-1,y:-1,overflow:true,rewardPending:true});}return !!pos}
function chest(room,m,kind,now){const h=hole(m),e=m.event,r=random(e);let reward;
 if(kind==='hidden')reward=r<.4?limitedItem(e,1):normal(e,random(e)<.012?'rainbow':random(e)<.3?'gold':'purple');
 else reward=r<.30?limitedItem(e,2):r<.50?limitedItem(e,3):r<.512?normal(e,'rainbow'):normal(e,'gold');
 h.chest={id:e.id+':chest',kind,opened:false,reward,created:now};e.outcome=kind==='hidden'?'隐藏夹层':'守藏者的收藏';resume(room,m,now)}
function choice(e,now){setStage(e,'choice',now);e.countdownAt=e.type==='human'?0:now+650;e.deadline=e.type==='human'?0:e.countdownAt+10000}
function eligible(m,route){const e=m.event;return m.run.bag.filter(i=>e.type==='human'||(e.type==='rain'&&route==='rescue')||defs[e.type].allowed.includes(i.name))}
function submit(room,m,a,now){const e=m.event;if(e.stage!=='choice')return '当前不能提交物品。';const count=e.type==='rain'&&a.route==='rescue'?3:1,ids=a.uids;
 if(!Array.isArray(ids)||ids.length!==count||new Set(ids).size!==count)return '请选择 '+count+' 件不同的物品。';const candidates=eligible(m,a.route),items=ids.map(id=>candidates.find(i=>i.uid===id));if(items.some(i=>!i))return '物品不在背包中，或不符合这条路线。';m.run.bag=m.run.bag.filter(i=>!ids.includes(i.uid));e.spent=(e.spent||[]).concat(items.map(i=>({uid:i.uid,name:i.name})));const r=random(e);
 if(e.type==='rain'){if(a.route==='rescue'){e.reward=limitedItem(e,0);e.outcome='抢救藏品';setStage(e,'reward',now)}else if(r<.5){e.outcome='浮桥搭成';setStage(e,'bridge',now)}else{e.outcome='雨中脱险';setStage(e,'clearing',now)}}
 else if(e.type==='wind'){if(r<.5){e.outcome='风神附身';setStage(e,'clearing',now)}else{const pool=m.run.bag.slice(),n=Math.min(pool.length,1+Math.floor(random(e)*3));e.lost=[];for(let i=0;i<n;i++){const it=pick(e,pool);e.lost.push(it);pool.splice(pool.indexOf(it),1)}m.run.bag=pool;e.outcome='自然的考验';setStage(e,'windloss',now)}}
 else if(e.type==='bark'){if(r<.5)chest(room,m,'hidden',now);else{e.outcome='门后的住客';setStage(e,'guardian',now)}}
 else if(e.type==='human'){e.tradeKind=r<.4?'up':r<.8?'down':'robbed';if(e.tradeKind==='robbed'){e.outcome='谁给你的勇气';setStage(e,'robbed',now)}else{const rank=tiers.indexOf(items[0].tier),next=Math.max(0,Math.min(4,rank+(e.tradeKind==='up'?1:-1)));e.boundary=rank===next;e.reward=normal(e,tiers[next],e.boundary?items[0].name:'');e.outcome=e.tradeKind==='up'?'恭喜发财':'抱歉了我是坏蛋';setStage(e,'tradeOffer',now)}}
 else if(e.type==='tremor'){if(r<.5){e.outcome='震动平息';setStage(e,'rumbling',now)}else{e.reward=limitedItem(e,4);e.outcome='新朋友';setStage(e,'friend',now)}}
 return ''}
function startBattle(m,now){const e=m.event,items=[...new Map([...m.run.holes.flatMap(h=>h.loot.filter(i=>i.revealed)),...m.run.bag].map(i=>[i.uid,i])).values()];e.battle=window.HollowBattle.create(items,e.type==='bark'?'guardian':'tremor',()=>random(e),now);setStage(e,'battle',now)}
function action(room,m,a,now){const e=m.event;if(!e)return '没有进行中的随机事件。';if(a.eventId!==e.id)return '事件已经变化，请重试。';
 if(e.type!=='human'&&e.stage==='choice'&&now>=e.deadline){e.type==='rain'?flood(room,m,now):die(room,m,defs[e.type].name+'：未在倒计时内作出回应',now);return ''}
 if(a.type==='event-ready'){if(e.stage!=='intro')return '';if(now<e.started+3200)return '事件正在出现。';choice(e,now)}
 else if(a.type==='event-submit')return submit(room,m,a,now);
 else if(a.type==='event-fight'){if(!((e.type==='tremor'&&e.stage==='choice')||(e.type==='bark'&&e.stage==='guardian')))return '这里不能发起战斗。';startBattle(m,now)}
 else if(a.type==='event-claim'){if(!['reward','friend','tradeOffer'].includes(e.stage)||!e.reward)return '没有可领取的物品。';const item=e.reward;e.delivery=putReward(m,item)?'bag':'hole';e.reward=null;record(room,m,item.eventOnly?'树隙奇遇':'交换所得',item.name,now);if(e.type==='human')setStage(e,'tradeAgain',now);else setStage(e,'clearing',now)}
 else if(a.type==='event-again'){if(e.stage!=='tradeAgain')return '当前不能再次交换。';e.cycle++;choice(e,now)}
 else if(a.type==='event-leave'){if(e.stage==='tradeAgain'||(e.type==='human'&&e.stage==='choice'))setStage(e,'clearing',now);else if(e.type==='rain'&&e.stage==='choice')flood(room,m,now);else return '请先处理眼前的事件。'}
 else if(a.type==='battle-place'){if(e.stage!=='battle')return '当前没有战斗。';return window.HollowBattle.place(e.battle,a,now)}
 else if(a.type==='battle-start'){if(e.stage!=='battle')return '当前没有战斗。';return window.HollowBattle.start(e.battle,now)}
 else if(a.type==='battle-pulse'){if(e.stage!=='battle')return '当前没有战斗。';return window.HollowBattle.pulse(e.battle,now)}
 else if(a.type==='battle-pause'){if(e.stage!=='battle'||!['running','paused'].includes(e.battle.status))return '战斗尚未开始。';e.battle.status=e.battle.status==='running'?'paused':'running';e.battle.last=now}
 else if(a.type==='battle-speed'){if(e.stage!=='battle')return '当前没有战斗。';e.battle.speed=e.battle.speed===2?1:2;e.battle.last=now}
 else return '不支持的事件操作。';return ''}
function tick(room,now){let changed=false;for(const m of Object.values(room.members)){const e=m.event;if(!e||!m.alive)continue;
 // The countdown is armed by event-ready only after artwork has decoded and revealed.

 if(e.type==='human'&&(e.deadline||e.countdownAt)){e.deadline=0;e.countdownAt=0;changed=true}
 if(e.type!=='human'&&e.stage==='choice'&&now>=e.deadline){e.type==='rain'?flood(room,m,now):die(room,m,defs[e.type].name+'：未在倒计时内作出回应',now);changed=true;continue}
 const durations={clearing:1600,bridge:3200,windloss:4500,rumbling:5000,robbed:7500};if(durations[e.stage]&&now-e.stageAt>=durations[e.stage]){resume(room,m,now);changed=true;continue}
 if(e.stage==='battle'){const b=e.battle;if(window.HollowBattle.tick(b,now))changed=true;if(b.status==='won'){record(room,m,e.type==='bark'?'守藏者的试炼':'巨影之下',e.type==='bark'?'击退全部15只守卫虫':'守住了树洞',now);if(e.type==='bark')chest(room,m,'guardian',now);else{e.outcome='巨影退却';setStage(e,'battleWon',now)}changed=true}else if(b.status==='lost'){die(room,m,e.type==='bark'?'守藏者的守卫突破了防线':'巨影冲破了树洞防线',now);changed=true}}
 if(e.stage==='battleWon'&&now-e.stageAt>2500){resume(room,m,now);changed=true}
 }return changed}
function openChest(m,now){const h=hole(m),c=h?.chest;if(!c||c.opened)return '这个宝箱已经开启。';c.opened=true;c.due=now+window.HollowCore.duration(c.reward);return ''}
function revealChest(m,now){const h=hole(m),c=h?.chest;if(!c?.opened||c.claimed||c.visible||now<c.due)return '宝箱仍在搜索。';c.visible=true;recordValue(m,c.reward);h.loot.push({...c.reward,x:-1,y:-1,overflow:true,chestItem:true});h.highestTier=tiers.indexOf(c.reward.tier)>tiers.indexOf(h.highestTier)?c.reward.tier:h.highestTier;return ''}
window.HollowEvents={defs,limited,tiers,enter,chance,action,tick,eligible,openChest,revealChest,art:i=>i.art||limited.find(x=>x.name===i.name)?.art||'assets/items-retro/'+encodeURIComponent(i.name)+'.webp'};
})();
