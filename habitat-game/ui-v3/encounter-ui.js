(function(){'use strict';
let frame,root,channel='',ready=false,initializing=false;
const board=()=>document.getElementById('board');
function dispose(){if(!root)return;root.remove();root=frame=null;ready=false;channel='';board().inert=false;window.HollowAudio.duck(false);}
function config(){const U=window.HollowUI,m=U.me();if(!frame||!ready||!m?.encounter)return;frame.contentWindow.postMessage({type:'hollow-encounter:state',channel,encounter:m.encounter,nickname:m.nickname,role:m.role,audio:window.HollowAudio.enabled},location.protocol==='file:'?'*':location.origin);}
function sync(){
 const U=window.HollowUI,m=U?.me();if(!m||U.ui.scene!==8||m.phase!=='battle'||!m.alive){dispose();return;}
 if(!m.encounter){if(!initializing){initializing=true;queueMicrotask(()=>{U.send({type:'encounter-init'});initializing=false;})}return;}
 if(root?.dataset.encounter!==m.encounter.id){
  dispose();root=document.createElement('section');root.id='encounter-root';root.dataset.encounter=m.encounter.id;root.setAttribute('aria-label','不期之敌');
  const loading=document.createElement('div');loading.className='encounter-loading';loading.textContent='不期之敌 · 即将遭遇';root.append(loading);
  channel=crypto.randomUUID();const url=new URL('../../hollow-toons/index.html',document.baseURI);url.searchParams.set('encounter',m.encounter.id);url.searchParams.set('channel',channel);url.searchParams.set('role',m.role);url.searchParams.set('v','20261103-encounter1');if(new URLSearchParams(location.search).has('qa'))url.searchParams.set('qa','1');
  frame=document.createElement('iframe');frame.title='不期之敌战斗';frame.allow='autoplay; fullscreen; gamepad';frame.src=url.href;frame.onload=()=>{frame?.contentWindow.focus()};root.append(frame);document.body.append(root);board().inert=true;window.HollowAudio.duck(true);
 }
 config();
}
addEventListener('message',ev=>{
 if(!frame||ev.source!==frame.contentWindow||ev.origin!==(location.protocol==='file:'?'null':location.origin))return;
 const d=ev.data;if(!d||d.channel!==channel||typeof d.type!=='string')return;
 const U=window.HollowUI,m=U.me();if(!m?.encounter||d.encounterId!==m.encounter.id)return;
 if(d.type==='hollow-encounter:ready'){ready=true;config();return;}
 if(d.type==='hollow-encounter:loaded'){root?.querySelector('.encounter-loading')?.remove();return;}
 if(d.type==='hollow-encounter:result'){U.send({type:d.won?'encounter-stage':'encounter-loss',encounterId:m.encounter.id,stage:d.stage,time:d.time});config();}
 if(d.type==='hollow-encounter:checkpoint')U.send({type:'encounter-checkpoint',encounterId:m.encounter.id,stage:d.stage,snapshot:d.snapshot});
});
window.HollowEncounterUI={sync};
})();
