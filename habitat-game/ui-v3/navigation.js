(function(){'use strict';
function style(){document.querySelectorAll('.mission-entry').forEach(b=>{if(b.classList.contains('bite-switch'))return;b.classList.add('bite-switch');b.textContent='进入游戏';b.setAttribute('aria-label','进入树隙之间游戏');b.title='沿着虫子咬痕，进入树隙之间'});}
style();new MutationObserver(style).observe(document.body,{childList:true,subtree:true});
})();
