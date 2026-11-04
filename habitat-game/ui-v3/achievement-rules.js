(function(){const version=2;const icons=['完美的家','别有洞天','化作春泥','You are my destiny','偶然的邻居','一洞三家','隔洞相望（三人版）','顶级掠食者','黄雀在后','小可怜'];
function evaluate(room,m){const members=Object.values(room.members),success=p=>['won','escaped'].includes(p.encounter?.status),dead=p=>p.alive===false,n=members.length,live=members.filter(success),allDone=members.every(p=>success(p)||dead(p)),pred=(room.events||[]).filter(e=>e.type==='predation'),eaten=pred.some(e=>e.targetId===m.id),hunter=pred.some(e=>e.actorId===m.id);let title='';
if(eaten)title='小可怜';else if(hunter)title=dead(m)?'黄雀在后':success(m)?n===2?'顶级掠食者':live.some(p=>p.id!==m.id&&p.home===m.home)?'与虎谋皮':'强者总是孤独的':'';
else if(n===3&&pred.length){title=dead(m)?'化作春泥':success(m)&&allDone?(live.some(p=>p.id!==m.id&&p.home===m.home)?'与虎谋皮':'这瓜我不吃'):'';}
else if(n===1){title=dead(m)?'化作春泥':success(m)?({'如获珍宝':'完美的家','如获至宝':'完美的家','平平无奇':'洞里洞气','不毛之地':'别有洞天'}[m.encounter.category]||''):'';}
else if(allDone&&n===2){if(!live.length)title='双子星';else if(dead(m))title='化作春泥';else if(live.length===1)title='独自美丽';else if(live[0].home!==live[1].home)title='隔洞相望';else title=m.signals?.length?'You are my destiny':'偶然的邻居';}
else if(allDone&&n===3){if(!live.length)title='团灭套餐';else if(dead(m))title='化作春泥';else if(live.length===1)title='独苗求生';else if(live.length===2)title=live[0].home===live[1].home?'难夫难妻':'隔洞相望';else title=new Set(live.map(p=>p.home)).size===1?'一洞三家':'隔洞相望（三人版）';}
return title?[{id:room.id+':achievement-v2:'+m.id+':'+title,title,detail:'按本轮最终入住与存活结果结算',version,at:m.finishedAt||room.created}]:[];}
function refresh(room){for(const m of Object.values(room.members))m.awards=evaluate(room,m);for(const h of room.history||[])h.achievements=[...new Set((h.actors||[]).flatMap(a=>room.members[a.id]?.awards.map(a=>a.title)||[]))];return room;}
function migrate(p){if(p.achievementVersion===version)return p;p.awards={};for(const j of Object.values(p.journeys||{}))j.awards=[];for(const h of p.history||[])h.achievements=[];p.achievementVersion=version;return p;}
window.HollowAchievements={version,icons,evaluate,refresh,migrate,art:title=>icons.includes(title)?'assets/achievement-stamps/'+encodeURIComponent(title)+'.webp':null};})();
