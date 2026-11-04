(function(){'use strict';
const ENDPOINT='https://anhome-d5gj9gjekabdf9a7b-1525088628.ap-shanghai.app.tcloudbase.com/hollow-rooms';
const randomId=()=>Array.from(crypto.getRandomValues(new Uint8Array(20)),v=>v.toString(16).padStart(2,'0')).join('');
function saved(key){let x=sessionStorage.getItem(key);if(!x){x=randomId();sessionStorage.setItem(key,x);}return x;}
class RoomClient{
 constructor(update){this.update=update;this.id=saved('hollow-cloud-player-v1');this.secret=saved('hollow-cloud-secret-v1');this.info={status:'idle',view:null,code:'',error:'',message:'',hosting:false};this.savedCode=sessionStorage.getItem('hollow-cloud-room-v1')||'';this.generation=0;this.queue=[];this.busy=false;this.attempt=0;this.disposed=false;}
 emit(p){this.info={...this.info,...p};this.update(this.info);}
 async request(body){const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),14000);try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...body,id:this.id,secret:this.secret,code:body.code||this.code}),signal:ctrl.signal});const data=await r.json();if(!r.ok){const e=Error(data.error||'云端连接暂时中断');e.status=r.status;throw e;}return data;}finally{clearTimeout(timer);}}
 accept(data){const signature=JSON.stringify({...data.view,serverTime:0}),unchanged=signature===this.signature&&this.info.status==='connected'&&!data.error&&!data.message&&!this.info.message;this.signature=signature;this.attempt=0;this.code=data.code||this.code;this.savedCode=this.code;sessionStorage.setItem('hollow-cloud-room-v1',this.code);const hosting=data.view?.host===this.id;this.hosting=hosting;if(unchanged)return;this.emit({status:'connected',view:data.view,code:this.code,hosting,error:'',message:data.error||data.message||''});}
 async connect(op,code){this.stop(false);this.disposed=false;const gen=this.generation;this.code=code||'';this.emit({status:'connecting',view:null,code:this.code,error:'',message:''});try{const data=await this.request({op,code});if(gen!==this.generation)return;this.accept(data);this.schedule();}catch(e){if(gen!==this.generation)return;this.emit({status:'error',error:e.name==='AbortError'?'云端连接超时，请重试。':e.message});}}
 create(restore=false){return restore&&this.savedCode?this.join(this.savedCode):this.connect('create');}
 join(code){code=String(code||'').toUpperCase().trim();if(!/^[A-Z2-9]{6}$/.test(code)){this.emit({error:'请输入六位房间码。'});return;}return this.connect('join',code);}
 schedule(delay){clearTimeout(this.timer);if(this.disposed)return;this.timer=setTimeout(()=>this.pump(),delay??(document.hidden?8000:2000));}
 async pump(){if(this.disposed||!this.code||this.busy)return;this.busy=true;const gen=this.generation,job=this.queue[0];try{const data=await this.request(job?{op:'action',action:job.action,requestId:job.id}:{op:'poll'});if(gen!==this.generation)return;if(job)this.queue.shift();this.accept(data);}catch(e){if(gen!==this.generation)return;this.attempt++;if([401,403,404].includes(e.status)){this.queue=[];this.emit({status:'error',error:e.message});this.disposed=true;}else this.emit({status:'reconnecting',error:this.attempt===1?'云端连接中断，正在自动重连。':'',message:''});}finally{if(gen===this.generation){this.busy=false;this.schedule(this.queue.length?100:this.attempt?Math.min(12000,2000*this.attempt):undefined);}}}
 send(action){if(this.disposed||!this.code)return;this.queue.push({id:randomId(),action});if(!this.busy)this.schedule(0);}
 retry(){return this.code||this.savedCode?this.join(this.code||this.savedCode):this.create();}
 stop(dispose=true){this.generation++;this.disposed=dispose;clearTimeout(this.timer);this.queue=[];this.busy=false;}
 leave(){const code=this.code;if(code)this.request({op:'leave',code}).catch(()=>{});this.stop();this.code='';this.emit({status:'idle',view:null,code:'',error:'',message:'',hosting:false});}
}
window.HollowRoomClient=RoomClient;
})();
