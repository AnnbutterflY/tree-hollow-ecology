(function(){'use strict';
// Keep this switch outside the board's inert subtree so event audio can also be muted.
const b=document.createElement('button');b.className='journey-audio';b.type='button';document.body.append(b);
function paint(){const on=HollowAudio.enabled;b.textContent=on?'声音 开':'声音 关';b.setAttribute('aria-label',on?'关闭背景音乐和音效':'开启背景音乐和音效');b.setAttribute('aria-pressed',String(on));}
b.onclick=()=>{HollowAudio.start().catch(()=>{});HollowAudio.toggle()};addEventListener('hollow:audio-change',paint);paint();
})();
