(function(){'use strict';
const boot=document.getElementById('boot-status');
if(window.HollowUI)boot?.remove();else if(boot){boot.textContent='画面未能完整加载，请检查网络后刷新重试。';const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();boot.append(retry);}
if(matchMedia('(pointer:coarse)').matches){
 document.documentElement.classList.add('touch-device');
 const tip=document.createElement('aside');tip.className='mobile-play-hint';tip.textContent='横屏游玩，画面和按钮会更清楚。';
 const close=document.createElement('button');close.textContent='知道了';close.onclick=()=>tip.remove();tip.append(close);document.body.append(tip);
}
document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
})();
