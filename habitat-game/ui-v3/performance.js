(function(){'use strict';
const boot=document.getElementById('boot-status');
// Decode only the next likely scene, after the current frame has painted.
const cached=new Set();let preloadTimer;
const board=document.getElementById('board');
function warmNext(){clearTimeout(preloadTimer);const n=Number(board.dataset.scene),next=({1:2,2:3,3:4,4:5,5:6,6:7,7:8,8:11,11:12})[n];if(!next||cached.has(next))return;preloadTimer=setTimeout(()=>{const img=new Image();img.decoding='async';img.fetchPriority='low';img.onload=()=>{cached.add(next);img.decode?.().catch(()=>{})};img.src='assets/ui/scene-'+next+'.webp';},700)}
new MutationObserver(warmNext).observe(board,{attributes:true,attributeFilter:['data-scene']});warmNext();
window.addEventListener('hollow-view-error',()=>{window.HollowUI?.toast('画面同步出现问题，请点击返回大厅后继续本轮。')});

if(window.HollowUI)boot?.remove();else if(boot){boot.textContent='画面未能完整加载，请检查网络后刷新重试。';const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();boot.append(retry);}
if(matchMedia('(pointer:coarse)').matches){
 document.documentElement.classList.add('touch-device');
 const tip=document.createElement('aside');tip.className='mobile-play-hint';tip.textContent='横屏游玩，画面和按钮会更清楚。';
 const close=document.createElement('button');close.textContent='知道了';close.onclick=()=>tip.remove();tip.append(close);document.body.append(tip);
}
document.addEventListener('visibilitychange',()=>document.documentElement.classList.toggle('page-hidden',document.hidden));
})();
