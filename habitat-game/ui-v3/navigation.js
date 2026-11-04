(function(){'use strict';
function style(){document.querySelectorAll('.mission-entry').forEach(b=>{if(b.dataset.crackEntry)return;b.dataset.crackEntry='1';b.classList.add('bite-switch','crack-entry');b.replaceChildren();const art=document.createElement('span');art.className='crack-art';art.setAttribute('aria-hidden','true');for(let i=0;i<6;i++){const shard=document.createElement('i');shard.style.setProperty('--part',i);art.append(shard)}const label=document.createElement('span');label.className='crack-label';label.textContent='树洞冒险';b.append(art,label);b.setAttribute('aria-label','树洞冒险');b.title='进入树洞冒险'});}
style();new MutationObserver(style).observe(document.body,{childList:true,subtree:true});
})();
