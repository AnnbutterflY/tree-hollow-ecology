/* Temporary homepage entry; independent of the existing map and adventure state. */
(()=>{
  const selector='.header-right';
  function attach(){
    const host=document.querySelector(selector);
    if(!host)return false;
    if(document.querySelector('[data-hollow-theatre-map]'))return true;
    const style=document.createElement('style');
    style.textContent='.hollow-theatre-map-entry{display:inline-flex;align-items:center;gap:6px;padding:9px 12px;border:1px solid #83975b;border-radius:4px;background:#273922;color:#e2e9ce;text-decoration:none;font:12px "Microsoft YaHei",sans-serif;white-space:nowrap}.hollow-theatre-map-entry small{font-size:9px;opacity:.76}.hollow-theatre-map-entry:hover{background:#405333}.hollow-theatre-map-entry:focus-visible{outline:2px solid #91ac65;outline-offset:3px}@media(max-width:700px){.hollow-theatre-map-entry{position:absolute;left:220px;bottom:8px;padding:5px 8px;font-size:11px;gap:4px}.hollow-theatre-map-entry small{font-size:8px}}@media(max-width:360px){.hollow-theatre-map-entry small{display:none}}';
    document.head.append(style);
    const entry=document.createElement('a');
    entry.href='./hollow-toons/index.html';
    entry.className='hollow-theatre-map-entry';
    entry.dataset.hollowTheatreMap='';
    entry.innerHTML='虫剧场 <small>试玩 ↗</small>';
    const existing=host.querySelector('.mission-entry');
    existing?existing.after(entry):host.prepend(entry);
    return true;
  }
  if(!attach()){
    const observer=new MutationObserver(()=>{if(attach())observer.disconnect()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  }
})();
