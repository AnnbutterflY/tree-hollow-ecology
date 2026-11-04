(function(){'use strict';
function style(){document.querySelectorAll('.mission-entry').forEach(b=>{b.classList.add('bite-switch');if(b.textContent)b.textContent='';b.setAttribute('aria-label','进入树隙之间游戏');b.title='沿着虫子咬痕，进入树隙之间'});}
style();new MutationObserver(style).observe(document.body,{childList:true,subtree:true});
})();
