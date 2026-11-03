/* One continuous surface per original artwork. No duplicated rectangular crops.
   The paper/card/map frames are pinned in the same 1888 x 1312 coordinate space
   as their controls; only the illustrated scenery has a smooth depth field. */
(function () {
  'use strict';
  const board = document.querySelector('#board');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = {x: 0, y: 0, tx: 0, ty: 0};
  const nav = [0, 0, 315, 122];
  // Rectangles are fixed focal planes, with an additional smooth outside collar.
  const pages = {
    1: {zones: [[945,565,650,420,.65],[280,1170,560,270,1],[1550,1070,460,280,.9]], pins: [[20,20,320,300],[1540,20,1868,300],[680,1060,1230,1270]], amplitude: 8},
    2: {zones: [[760,620,510,610,1]], pins: [nav,[0,755,910,1312],[1170,0,1888,1312]], amplitude: 7},
    3: {zones: [[280,480,610,580,.85],[1740,70,380,520,.45]], pins: [nav,[900,115,1710,1195],[1520,960,1888,1255],[145,735,815,905],[80,1010,610,1200]], amplitude: 6},
    4: {zones: [[570,610,640,650,.55],[1340,675,530,600,.95]], pins: [nav,[1680,0,1888,1312],[1150,1060,1710,1275]], amplitude: 6},
    5: {zones: [[180,640,310,640,.7],[1720,550,400,630,.65]], pins: [nav,[320,278,1480,1038],[120,315,310,895],[1460,580,1888,1025],[630,1070,1330,1250]], amplitude: 5},
    6: {zones: [[490,125,600,300,.7],[1810,1260,400,260,.5]], pins: [nav,[740,0,1888,152],[15,242,1850,1240]], amplitude: 5},
    7: {zones: [[800,80,920,300,.65],[1820,650,200,650,.6]], pins: [nav,[0,205,1275,1090],[1260,220,1835,1285],[1130,665,1580,1312]], amplitude: 4},
    8: {zones: [[900,130,970,350,.8],[100,1010,260,360,.7]], pins: [nav,[775,35,1160,230],[165,300,1235,1180],[1300,330,1830,1200]], amplitude: 5},
    9: {zones: [[1040,640,1100,850,1]], pins: [nav,[1480,0,1888,375],[0,1210,650,1312]], amplitude: 8},
    10:{zones: [[1040,640,1100,850,1]], pins: [nav,[1480,0,1888,375],[0,1210,650,1312]], amplitude: 8}
  };
  const canvas = document.createElement('canvas');
  canvas.className = 'depth-surface';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false});
  let host, page = 1, config = pages[1], url = '', ready = false, revision = 0, dirty = true, raf = 0, last = 0, lastFlash = 0;
  let program, uniforms, texture;
  const vertex = `attribute vec2 aPosition; varying vec2 vUv;
    void main(){vUv=vec2((aPosition.x+1.0)*.5,(1.0-aPosition.y)*.5);gl_Position=vec4(aPosition,0.0,1.0);}`;
  const fragment = `precision highp float;
    varying vec2 vUv;uniform sampler2D uImage;uniform vec2 uPointer;uniform vec2 uTexel;
    uniform vec4 uZones[4];uniform float uWeights[4];uniform vec4 uPins[8];
    uniform int uZoneCount;uniform int uPinCount;uniform float uAmplitude;uniform float uFlash;uniform float uLobby;uniform float uPage;
    float pin(vec2 p,vec4 r){vec2 outside=max(max(r.xy-p,p-r.zw),vec2(0.0));return smoothstep(0.0,52.0,length(outside));}
    void main(){
      vec2 p=vUv*vec2(1888.0,1312.0);float z=.10;
      for(int i=0;i<4;i++){if(i<uZoneCount){vec4 r=uZones[i];vec2 q=(p-r.xy)/r.zw;float g=exp(-2.8*dot(q,q));z+=g*uWeights[i];}}
      z=min(z,1.0);
      // Full exterior border remains in place: no exposed image edges, no bleed.
      float edge=min(min(p.x,1888.0-p.x),min(p.y,1312.0-p.y));
      z*=smoothstep(0.0,110.0,edge);
      for(int i=0;i<8;i++){if(i<uPinCount)z*=pin(p,uPins[i]);}
      // The homepage's red axis and circular guide remain geometrically exact.
      if(uPage<1.5){z*=smoothstep(18.0,72.0,abs(length(p-vec2(944.0,632.0))-555.0));z*=smoothstep(8.0,58.0,abs(p.x-944.0));}
      vec2 uv=vUv-uPointer*vec2(uAmplitude,uAmplitude*.67)*z/vec2(1888.0,1312.0);
      vec3 color=texture2D(uImage,uv).rgb;
      // A subpixel optical falloff only while looking around, never a fuzzy UI.
      float amount=length(uPointer)*.08*z;
      vec3 soft=(texture2D(uImage,uv+uTexel*.55).rgb+texture2D(uImage,uv-uTexel*.55).rgb)*.5;
      color=mix(color,soft,amount);
      // The original red marks flicker in place; no translated copy of the page.
      float red=smoothstep(.17,.38,color.r-max(color.g,color.b))*smoothstep(.22,.48,color.r);
      float leftArea=1.0-smoothstep(1110.0,1195.0,p.x);
      color*=1.0+uFlash*uLobby*leftArea*red*.24;
      gl_FragColor=vec4(color,1.0);
    }`;
  function shader(kind, source) {
    const s=gl.createShader(kind);gl.shaderSource(s,source);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Depth shader could not compile');
    return s;
  }
  function initialize() {
    if(!gl)return;
    try {
      program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Depth surface unavailable');
      gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
      const a=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
      uniforms={};for(const n of ['uImage','uPointer','uTexel','uZones','uWeights','uPins','uZoneCount','uPinCount','uAmplitude','uFlash','uLobby','uPage'])uniforms[n]=gl.getUniformLocation(program,n);
      texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.uniform1i(uniforms.uImage,0);
    } catch {program=null;}
  }
  initialize();
  const localSources = new Map();
  function sourceUrl(source) {
    if(location.protocol!=='file:')return Promise.resolve(source);
    // Local file images cannot be uploaded into WebGL in Chromium. Load the
    // identical WebP bytes through a local script, without a server or CORS flags.
    const key=source.split('/').pop().replace('.webp','');
    if(!localSources.has(key))localSources.set(key,new Promise((resolve,reject)=>{
      if(window.HollowDepthSources?.[key]){resolve(window.HollowDepthSources[key]);return;}
      const script=document.createElement('script');script.src='assets/offline-depth/'+key+'.js';
      script.onload=()=>{const data=window.HollowDepthSources?.[key];script.remove();data?resolve(data):reject(new Error('Missing local artwork'));};
      script.onerror=()=>{script.remove();reject(new Error('Local artwork unavailable'));};document.head.append(script);
    }));
    return localSources.get(key);
  }
  function resize() {
    if(!host||!program)return;
    const r=board.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.5),w=Math.min(2360,Math.round(r.width*ratio));
    if(canvas.width!==w){canvas.width=w;canvas.height=Math.round(w*1312/1888);dirty=true;}
  }
  function setConfig() {
    const z=new Float32Array(16),weights=new Float32Array(4),pins=new Float32Array(32);
    config.zones.forEach((r,i)=>{z.set(r.slice(0,4),i*4);weights[i]=r[4]});config.pins.forEach((r,i)=>pins.set(r,i*4));
    gl.uniform4fv(uniforms.uZones,z);gl.uniform1fv(uniforms.uWeights,weights);gl.uniform4fv(uniforms.uPins,pins);
    gl.uniform1i(uniforms.uZoneCount,config.zones.length);gl.uniform1i(uniforms.uPinCount,config.pins.length);
    gl.uniform1f(uniforms.uAmplitude,config.amplitude);gl.uniform1f(uniforms.uLobby,page===2?1:0);gl.uniform1f(uniforms.uPage,page);
  }
  function bind(element, n, source) {
    const changed=host!==element||url!==source||page!==n;
    if(host!==element){host?.classList.remove('depth-ready');canvas.remove();host=element;host.classList.add('depth-host');host.prepend(canvas);}
    page=n;config=pages[n]||pages[1];host.dataset.depthPage=n;
    if(!program||reduced.matches){ready=false;host.classList.remove('depth-ready');return;}
    if(changed){pointer.x=pointer.y=pointer.tx=pointer.ty=0;dirty=true;setConfig();}
    resize();
    if(url!==source||!ready){url=source;ready=false;host.classList.remove('depth-ready');const id=++revision,img=new Image();
      img.onload=()=>{if(id!==revision)return;try{gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.uniform2f(uniforms.uTexel,1/img.width,1/img.height);ready=true;dirty=true;draw(0);host.classList.add('depth-ready');wake();}catch{ready=false;host.classList.remove('depth-ready');}};
      sourceUrl(source).then(src=>{if(id===revision)img.src=src}).catch(()=>{if(id===revision){ready=false;host.classList.remove('depth-ready');}});
    }else{host.classList.add('depth-ready');wake();}
  }
  function draw(flash) {
    if(!ready||!host?.isConnected)return;
    gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(uniforms.uPointer,pointer.x,pointer.y);gl.uniform1f(uniforms.uFlash,flash);gl.drawArrays(gl.TRIANGLES,0,6);
    // Independent transparent sprites stay inside their fixed card/panel.
    board.style.setProperty('--look-x',pointer.x.toFixed(4));board.style.setProperty('--look-y',pointer.y.toFixed(4));
    dirty=false;
  }
  function frame(time) {
    raf=0;if(document.hidden||reduced.matches||!ready)return;
    const dt=Math.min((time-last)||16,50);last=time;const ease=1-Math.exp(-dt/130);
    pointer.x+=(pointer.tx-pointer.x)*ease;pointer.y+=(pointer.ty-pointer.y)*ease;
    const moving=Math.abs(pointer.tx-pointer.x)+Math.abs(pointer.ty-pointer.y)>.00015;
    if(!moving){pointer.x=pointer.tx;pointer.y=pointer.ty;}
    const phase=time%7100,flash=page===2&&phase>6710?Math.sin(phase*.061)*Math.sin(phase*.097):0;
    if(dirty||moving||flash!==lastFlash){draw(flash);lastFlash=flash;}
    if(moving||page===2)raf=requestAnimationFrame(frame);
  }
  function wake(){if(!raf&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(frame);}
  function reset(){pointer.tx=pointer.ty=0;dirty=true;wake();}
  board.addEventListener('pointermove',e=>{if(reduced.matches||e.pointerType==='touch'||e.buttons||document.querySelector('.modal-shade'))return;const r=board.getBoundingClientRect();pointer.tx=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));pointer.ty=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));dirty=true;wake();});
  board.addEventListener('pointerleave',reset);board.addEventListener('pointerdown',reset);addEventListener('blur',reset);
  addEventListener('resize',()=>{resize();reset()});document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=0;reset()}});
  reduced.addEventListener('change',()=>{reset();if(host){const el=host,n=page,src=url;url='';bind(el,n,src)}});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;host?.classList.remove('depth-ready');});
  // A page can always fall back to its untouched artwork (including file://).
  window.HollowDepth={bind,reset,inspect:()=>({page,ready,renderer:ready?'continuous-surface':'original-artwork',pointer:{...pointer},fixedRegions:config.pins,amplitude:config.amplitude})};
})();
