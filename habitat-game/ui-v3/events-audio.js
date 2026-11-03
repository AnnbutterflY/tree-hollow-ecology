(function(){'use strict';
const A=window.HollowAudio;let kind='',epoch=0,loops=[],timers=new Set();
function stop(){epoch++;kind='';loops.splice(0).forEach(fn=>fn());timers.forEach(clearTimeout);timers.clear();A.event('')}
async function start(type){if(kind===type)return;stop();kind=type;const token=epoch;await A.start();if(token!==epoch)return;A.event(type);const{ctx,noise,loop}=A.engine();
const repeat=(fn,min,max)=>{const run=()=>{if(token!==epoch)return;fn();const id=setTimeout(()=>{timers.delete(id);run()},min+Math.random()*(max-min));timers.add(id)};run()};
if(type==='wind'){loops.push(loop({bus:'events',volume:.55,frequency:1250,color:'pink',swell:.16,panSpeed:.13}),loop({bus:'events',volume:.22,frequency:260,color:'brown',swell:.1}))}
else if(type==='rain'){loops.push(loop({bus:'events',volume:.23,frequency:3200,type:'highpass',color:'white',swell:.06}),loop({bus:'events',volume:.16,frequency:1900,color:'pink',swell:.1}));repeat(()=>noise({bus:'events',duration:.055,volume:.1,frequency:2300,color:'white',pan:Math.random()*1.6-.8}),170,750)}
else if(type==='bark'){repeat(()=>{const t=ctx.currentTime;noise({bus:'events',duration:.08,volume:.38,frequency:1600,pan:Math.random()-.5});noise({bus:'events',duration:.21,volume:.2,frequency:2600,color:'white',when:t+.06})},250,1050)}
else if(type==='human'){repeat(()=>{const t=ctx.currentTime;for(let i=0;i<2;i++){noise({bus:'events',duration:.26,volume:.43,frequency:680,color:'brown',attack:.025,when:t+i*.57,pan:i?.28:-.28});noise({bus:'events',duration:.19,volume:.19,frequency:2300,color:'pink',when:t+i*.57+.045})}},1450,2100)}
else if(type==='tremor'){loops.push(loop({bus:'events',volume:.65,frequency:170,color:'brown',swell:.8,panSpeed:.1}));repeat(()=>{noise({bus:'events',duration:.55,volume:.45,frequency:420,color:'brown'});noise({bus:'events',duration:.13,volume:.3,frequency:2400,color:'white',when:ctx.currentTime+.13,pan:Math.random()-.5})},340,900)}
}
function reward(item,stinky=false){A.start().then(()=>stinky?A.material(item):A.reveal(item||{tier:'gold'}))}
function land(){A.start().then(()=>{const{noise}=A.engine();noise({duration:.42,volume:.66,frequency:480,color:'brown'});noise({duration:.15,volume:.25,frequency:1800})})}
function shot(){A.engine().tone(270+Math.random()*100,.07,.07,'triangle',100)}
window.HollowEventAudio={start,stop,reward,land,shot,get kind(){return kind}};
})();
