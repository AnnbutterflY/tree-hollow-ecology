(function(){'use strict';
if(new URLSearchParams(location.search).get('clueMap')==='1'){
 const css=document.createElement('style');css.textContent='.mission-entry,.network-entry,.about-button,.sound-toggle{display:none!important;pointer-events:none!important}.clue-map-return{position:fixed;right:18px;bottom:20px;z-index:99999;padding:13px 22px;background:#20291c;color:#e3e8b7;border:1px solid #b1bf75;border-radius:8px;font:600 16px "Microsoft YaHei",sans-serif;cursor:pointer}';document.head.append(css);
 document.addEventListener('click',e=>{if(e.target.closest('.mission-entry,.network-entry,.about-button,.sound-toggle')){e.preventDefault();e.stopImmediatePropagation()}},true);
 if(window.parent===window){const back=document.createElement('button');back.className='clue-map-return';back.textContent='← 返回线索';back.onclick=()=>history.back();document.body.append(back)}
 return;
}

function style(){document.querySelectorAll('.mission-entry').forEach(b=>{if(b.dataset.crackEntry)return;b.dataset.crackEntry='1';b.classList.add('bite-switch','crack-entry');b.replaceChildren();const art=document.createElement('span');art.className='crack-art';art.setAttribute('aria-hidden','true');for(let i=0;i<6;i++){const shard=document.createElement('i');shard.style.setProperty('--part',i);art.append(shard)}b.append(art);b.setAttribute('aria-label','树洞冒险');b.title='进入树洞冒险'});}
function position(){const compass=document.querySelector('.map-compass'),entry=document.querySelector('.crack-entry');if(!compass||!entry)return;const r=compass.getBoundingClientRect();entry.style.setProperty('left',Math.max(8,Math.min(innerWidth-130,r.left+r.width/2-60))+'px','important');entry.style.setProperty('top',(r.bottom+12)+'px','important');}addEventListener('resize',position);setInterval(position,500);style();position();new MutationObserver(style).observe(document.body,{childList:true,subtree:true});
})();
