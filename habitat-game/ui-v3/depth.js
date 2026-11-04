(function(){'use strict';const board=document.querySelector('#board'),reduced=matchMedia('(prefers-reduced-motion: reduce)');let host,stack,page=1,source='',layers=[],x=0,y=0,tx=0,ty=0,raf;
// Hand-traced artwork planes in the original 1888 x 1312 coordinate space.
const outlines={
1:[['400,430 520,370 730,400 920,370 1200,370 1430,365 1450,730 1200,760 950,700 700,740 420,650',3],['20,1120 180,1020 360,1070 570,1160 650,1312 0,1312',2]],
2:[['320,260 490,175 600,270 690,185 815,200 920,345 980,615 930,875 780,1010 710,870 580,750 500,575 380,480',4]],
3:[['0,160 270,0 540,0 170,690 0,900',2]],
4:[['215,205 600,120 660,235 1150,100 1250,430 1080,920 470,1110 190,1020 130,640',1.5]],
5:[['0,135 270,0 440,0 150,600 0,770',2]],
6:[['310,80 505,50 625,135 650,260 610,355 450,410 330,340 290,210',2]],
7:[['0,95 280,0 490,0 240,200 0,200',1.5]],
8:[['15,140 410,140 410,235 335,235 335,330 15,330',2]],
9:[['0,650 200,390 360,210 600,100 830,145 950,30 1100,0 1270,180 1470,290 1888,350 1888,890 1570,800 1490,1130 1250,1270 910,1312 600,1180 350,1000 0,980',2]],
10:[]};
function bind(el,n,url){if(host===el&&page===n&&source===url)return;stack?.remove();host=el;page=n;source=url;host.classList.remove('depth-ready');host.classList.add('depth-host');stack=document.createElement('div');stack.className='cutout-depth';stack.setAttribute('aria-hidden','true');layers=[];for(const [points,strength]of outlines[n]||[]){const layer=document.createElement('div');layer.className='cutout-plane';const id='cut-plane-'+n+'-'+layers.length;layer.innerHTML=`<svg viewBox="0 0 1888 1312" preserveAspectRatio="none"><defs><clipPath id="${id}"><polygon points="${points}"/></clipPath></defs><image href="${url}" width="1888" height="1312" preserveAspectRatio="none" clip-path="url(#${id})"/></svg>`;stack.append(layer);layers.push({layer,strength})}host.prepend(stack);reset()}
function tick(){x+=(tx-x)*.075;y+=(ty-y)*.075;for(const {layer,strength}of layers)layer.style.transform=`translate3d(${x*strength}px,${y*strength*.65}px,0)`;board.style.setProperty('--look-x',x);board.style.setProperty('--look-y',y);if(Math.abs(x-tx)+Math.abs(y-ty)>.001)raf=requestAnimationFrame(tick);else raf=null}
function wake(){if(!raf)raf=requestAnimationFrame(tick)}function reset(){tx=ty=0;wake()}
board.addEventListener('pointermove',e=>{if(reduced.matches||e.buttons||e.pointerType==='touch')return;const r=board.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));wake()});board.addEventListener('pointerleave',reset);board.addEventListener('pointerdown',reset);addEventListener('blur',reset);window.HollowDepth={bind,reset,inspect:()=>({page,ready:true,renderer:'hand-traced-rigid-planes',layers:layers.length,pointer:{x,y}})};
})();
