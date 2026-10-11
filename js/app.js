/* ============================ actions ============================= */
function setStatus(id,s){
  const o=D.topics[id]||(D.topics[id]={});const was=o.s;o.s=s;
  if(s===2){o.d=today();if(D.settings.autoRev&&was!==2&&!o.nx&&!o.m){o.rc=0;o.nx=addDays(today(),REV_STEPS[0])}}
  else{delete o.d;delete o.nx;delete o.rc;delete o.m;delete o.lr}
  if(!o.s&&!o.r&&!o.n)delete D.topics[id];
}
const keepScroll=fn=>{const y=window.scrollY;fn();window.scrollTo(0,y)};

/* ---------- notifications & badge ---------- */
const notifSupported=()=>'Notification' in window;
function notifState(){if(!notifSupported())return t('n_unsupported');const p=Notification.permission;return p==='granted'?t('n_granted'):p==='denied'?t('n_denied'):t('n_ask')}
async function showNotif(title,body,tag){
  if(!notifSupported()||Notification.permission!=='granted')return false;
  try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(reg){await reg.showNotification(title,{body,tag,icon:'icons/icon-192.png',badge:'icons/icon-192.png'});return true}}catch(e){}
  try{new Notification(title,{body,tag,icon:'icons/icon-192.png'});return true}catch(e){return false}
}
function setBadge(n){document.title=(n?`(${n}) `:'')+t('app_title');try{if(navigator.setAppBadge){n?navigator.setAppBadge(n).catch(()=>{}):navigator.clearAppBadge&&navigator.clearAppBadge().catch(()=>{})}}catch(e){}}
function checkReminders(){
  const r=D.settings.remind;if(!r.on)return;const now=new Date(),d0=today();if(r.last===d0)return;
  const [h,m]=(r.time||'08:00').split(':').map(Number);if(now.getHours()*60+now.getMinutes()<h*60+m)return;
  const n=dueCount(),tasks=(D.plans[d0]||[]).filter(x=>!x.done).length;r.last=d0;save();
  if(n||tasks){const parts=[];if(n)parts.push(t('n_rev',n));if(tasks)parts.push(t('n_tasks',tasks));showNotif(t('today')+': '+parts.join(' · '),t('notif_body'),'daily-'+d0)}
}
async function askPerm(){
  if(!notifSupported()){toast(t('n_unsupported'));return false}
  if(Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}
  if(Notification.permission!=='granted'){toast(t('n_denied'));return false}
  return true;
}

/* ---------- PWA install & update ---------- */
let deferredPrompt=null,swWaiting=null;
const isStandalone=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)&&!window.MSStream;
function installBtn(big){
  if(isStandalone())return'';
  if(!deferredPrompt&&!isIOS())return'';
  return big?`<button class="btn pri" data-act="install">${ico('download',16)} ${t('install')}</button>`:`<button class="ib inst" data-act="install" title="${t('install')}" aria-label="${t('install')}">${ico('download',18)}</button>`;
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;render()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;toast(t('installed'));render()});
function showUpdate(){const u=$('#upd');if(!u)return;u.innerHTML=`<span>${t('upd_text')}</span><button class="btn sm pri" id="updBtn">${t('upd_btn')}</button>`;u.hidden=false;$('#updBtn').onclick=()=>{swWaiting&&swWaiting.postMessage('SKIP_WAITING')}}

/* ---------- focus timer ---------- */
function timerFinish(auto){
  const tm=timerGet();if(!tm)return;
  const mins=auto?tm.mins:Math.round((Date.now()-(tm.end-tm.mins*60000))/60000);
  try{localStorage.removeItem(TKEY)}catch(e){}
  if(mins>=1){D.log[today()]=(D.log[today()]||0)+mins;save()}
  if(auto){showNotif(t('timer_done_title'),t('timer_done_body',mins),'timer');toast(t('timer_done_toast',mins))}
  else toast(mins>=1?t('logged',mins):t('too_short'));
  render();
}

const A={
 nav(b){go(b.dataset.v,b.dataset.ex)},
 lang(b){LANG=b.dataset.l;D.settings.lang=LANG;document.documentElement.lang=LANG;save();render()},
 install:async()=>{if(deferredPrompt){deferredPrompt.prompt();try{await deferredPrompt.userChoice}catch(e){}deferredPrompt=null;render()}else ask({title:t('ios_title'),body:t('ios_body'),ok:t('ok')})},
 cycle(b){const id=b.dataset.id,s=((TS(id).s||0)+1)%3;setStatus(id,s);save();refreshAfter();if(s===2)toast(t('t_done'))},
 revised(b){markRevised(b.dataset.id);save();keepScroll(render);toast(t('t_revised'))},
 snooze(b){snoozeRev(b.dataset.id,1);save();keepScroll(render);toast(t('t_snoozed'))},
 autoRev(){D.settings.autoRev=!D.settings.autoRev;save();render()},
 remindToggle:async()=>{const r=D.settings.remind;if(!r.on){if(!await askPerm())return;r.on=true;r.last=null;toast(t('t_rem_on'))}else r.on=false;save();render()},
 testNotif:async()=>{if(!await askPerm())return;const ok=await showNotif(t('app'),t('test_body'),'test');toast(ok?t('t_test_ok'):t('t_test_fail'))},
 timerLen(b){D.settings.focus=+b.dataset.m;save();render()},
 timerStart(){const m=D.settings.focus||25;try{localStorage.setItem(TKEY,JSON.stringify({end:Date.now()+m*60000,mins:m}))}catch(e){toast(t('toast_storage'));return}if(notifSupported()&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});render()},
 timerStop:async()=>{if(!await ask({title:t('discard_title'),body:t('discard_body'),ok:t('discard'),danger:true}))return;try{localStorage.removeItem(TKEY)}catch(e){}render()},
 timerDone(){timerFinish(false)},
 rev(b){const id=b.dataset.id,o=D.topics[id]||(D.topics[id]={});o.r=!o.r;if(!o.r)delete o.r;if(!o.s&&!o.r&&!o.n)delete D.topics[id];save();refreshAfter();toast(TS(id).r?t('t_star_on'):t('t_star_off'))},
 note(b){const id=b.dataset.id;UI.note[id]=!UI.note[id];refreshAfter();if(UI.note[id]){const el=document.querySelector(`[data-note="${id}"]`);el&&el.focus()}},
 toPlan(b){const x=INDEX[b.dataset.id];addTask(tpc(x),b.dataset.id,today());toast(t('t_planned'))},
 delcustom:async b=>{const id=b.dataset.id,x=INDEX[id];if(!await ask({title:t('del_title'),body:t('del_body',esc(x.t)),ok:t('remove'),danger:true}))return;
   const k=x.ex.key+'.'+x.sub.k;D.custom[k]=(D.custom[k]||[]).filter(o=>o.id!==id);delete D.topics[id];save();buildIndex();render()},
 sub(b){const k=b.dataset.k;UI.open[k]=!UI.open[k];b.closest('.subj').classList.toggle('open',!!UI.open[k]);b.setAttribute('aria-expanded',!!UI.open[k])},
 markall:async b=>{const ex=exByKey(b.dataset.ex),sub=ex.subjects.find(s=>s.k===b.dataset.s);
   if(!await ask({title:t('markall_title'),body:t('markall_body',esc(subName(sub))),ok:t('mark_all')}))return;
   topicsOf(ex,sub).forEach(x=>{if(TS(x.id).s!==2)setStatus(x.id,2)});save();render();toast(t('t_subj_done'))},
 group(b){UI.group[UI.ex]=b.dataset.g;render()},
 filter(b){UI.filter=b.dataset.f;render()},
 cov(b){UI.cov=b.dataset.c;render()},
 goTopic(b){const x=INDEX[b.dataset.id];UI.view='exam';UI.ex=x.ex.key;UI.q='';UI.filter='all';UI.cov='all';UI.group[x.ex.key]='All';UI.open[x.ex.key+'.'+x.sub.k]=true;render();
   const el=document.getElementById('t-'+x.id);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('flash')}},
 task(b){const l=D.plans[b.dataset.d]||[],x=l.find(y=>y.id===b.dataset.id);if(!x)return;x.done=!x.done;if(x.done)x.dd=today();else delete x.dd;save();render()},
 deltask(b){const l=D.plans[b.dataset.d]||[];D.plans[b.dataset.d]=l.filter(x=>x.id!==b.dataset.id);if(!D.plans[b.dataset.d].length)delete D.plans[b.dataset.d];save();render()},
 refdone(b){setStatus(b.dataset.id,2);save();render();toast(t('t_done'))},
 addTask(){const i=$('#newTask');if(!i.value.trim())return;addTask(i.value.trim(),null,UI.date);render();$('#newTask').focus()},
 day(b){const n=+b.dataset.n;UI.date=n===0?today():addDays(UI.date,n);render()},
 carry(){const t0=today();let n=0;D.plans[t0]=D.plans[t0]||[];Object.keys(D.plans).forEach(k=>{if(k<t0){const keep=[];D.plans[k].forEach(x=>{if(x.done)keep.push(x);else{D.plans[t0].push(x);n++}});if(keep.length)D.plans[k]=keep;else delete D.plans[k]}});save();render();toast(t('t_carried',n))},
 addmin(b){const d=UI.date;D.log[d]=Math.max(0,(D.log[d]||0)+ +b.dataset.m);if(!D.log[d])delete D.log[d];save();render()},
 theme(b){D.settings.theme=b.dataset.t;document.documentElement.dataset.theme=b.dataset.t;document.querySelector('meta[name=theme-color]').content=b.dataset.t==='light'?'#F2F4FC':'#070B18';save();render()},
 export(){exportData()},
 import(){$('#importFile').click()},
 restore:async b=>{const k=b.dataset.k;if(!await ask({title:t('restore_title'),body:t('restore_body',nice(k.slice(SNAP.length),{day:'numeric',month:'short'})),ok:t('restore')}))return;
   try{const obj=JSON.parse(localStorage.getItem(k));localStorage.setItem(KEY+'.before-restore',JSON.stringify(D));D=migrate(obj);buildIndex();saveNow();render();toast(t('t_restored'))}catch(e){toast(t('t_restore_fail'))}},
 reset:async()=>{const v=await ask({title:t('erase_title'),body:t('erase_body'),ok:t('erase_ok'),danger:true,input:'',placeholder:t('erase_ph')});
   if(v!=='ERASE'){if(v!==false)toast(t('t_not_erased'));return}
   exportData(true);try{localStorage.setItem(KEY+'.before-reset',JSON.stringify(D))}catch(e){}
   const th=D.settings.theme,lg=D.settings.lang;D=blank();D.settings.theme=th;D.settings.lang=lg;buildIndex();saveNow();render();toast(t('t_erased'))}
};
function refreshAfter(){
  renderNav();
  if(UI.view==='exam')keepScroll(()=>{renderList();const hero=document.querySelector('.exhero');if(hero){const tmp=document.createElement('div');tmp.innerHTML=vExam();hero.innerHTML=tmp.querySelector('.exhero').innerHTML;const mp=document.querySelector('.mp');if(mp){const nm=tmp.querySelector('.mp');if(nm)mp.innerHTML=nm.innerHTML}}});
}
function addTask(text,ref,date){(D.plans[date]=D.plans[date]||[]).push({id:uid(),text,ref:ref||null,done:false});save()}
function exportData(silent){
  const blob=new Blob([JSON.stringify({app:'pariksha-path',exported:new Date().toISOString(),...D},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`pariksha-path-backup-${today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  if(!silent){D.settings.lastExport=today();save();toast(t('t_backup'));render()}
}

/* ============================ events ============================== */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const f=A[b.dataset.act];if(f)f(b,e)});
document.addEventListener('input',e=>{
  const el=e.target;
  if(el.id==='q'){UI.q=el.value;renderList()}
  if(el.dataset.note){const id=el.dataset.note,v=el.value.trim();const o=D.topics[id]||(D.topics[id]={});if(v)o.n=el.value;else delete o.n;if(!o.s&&!o.r&&!o.n)delete D.topics[id];save();
    const row=document.getElementById('t-'+id);if(row){const nb=row.querySelector('.ib.nt');nb&&nb.classList.toggle('on',!!v)}}
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='examDate'){const k=el.dataset.ex;D.exams[k]=D.exams[k]||{};if(el.value)D.exams[k].date=el.value;else delete D.exams[k].date;save();render()}
  if(el.id==='planDate'&&el.value){UI.date=el.value;render()}
  if(el.id==='goalIn'){D.settings.goal=Math.max(30,Math.min(1080,+el.value||240));save();render()}
  if(el.id==='remindTime'&&el.value){D.settings.remind.time=el.value;save();toast(t('t_time_saved'))}
  if(el.id==='importFile'&&el.files[0]){
    const fr=new FileReader();
    fr.onload=async()=>{try{
      const o=JSON.parse(fr.result);if(!o||typeof o.topics!=='object')throw 0;
      if(!await ask({title:t('imp_title'),body:t('imp_body'),ok:t('import_btn')}))return;
      localStorage.setItem(KEY+'.before-import',JSON.stringify(D));D=migrate(o);delete D.app;delete D.exported;buildIndex();saveNow();render();toast(t('t_imported'));
    }catch(err){toast(t('t_bad_file'))}};
    fr.readAsText(el.files[0]);el.value='';
  }
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;const el=e.target;
  if(el.dataset.addtopic&&el.value.trim()){
    const key=el.dataset.addtopic,[exk,sk]=key.split('.');
    (D.custom[key]=D.custom[key]||[]).push({id:`${exk}.${sk}.c${uid()}`,t:el.value.trim()});
    UI.open[key]=true;save();buildIndex();render();toast(t('t_topic_added'));
    const inp=document.querySelector(`[data-addtopic="${key}"]`);inp&&inp.focus();
  }
  if(el.id==='newTask')A.addTask();
});

/* =============================== boot ============================= */
(function boot(){
  const p=new URLSearchParams(location.search),v=p.get('view');
  if(['dash','rev','plan','set'].includes(v))UI.view=v;
  else if(v&&exByKey(v)){UI.view='exam';UI.ex=v}
  render();
  if(navigator.storage&&navigator.storage.persist){navigator.storage.persist().then(ok=>{const el=$('#persist');if(el)el.textContent=ok?t('yes'):t('best_effort')}).catch(()=>{})}
  setInterval(()=>{const tm=timerGet();if(tm){if(Date.now()>=tm.end)timerFinish(true);else{const el=$('#timerTxt');if(el)el.textContent=mmss(tm.end-Date.now())}}},1000);
  checkReminders();setInterval(checkReminders,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkReminders();if(UI.view==='dash'||UI.view==='rev')keepScroll(render)}});
  new MutationObserver(()=>{const el=$('#persist');if(el&&el.textContent==='…'&&navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(x=>{el.textContent=x?t('yes'):t('best_effort')})}).observe(document.body,{childList:true,subtree:true});
  if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)){
    window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').then(reg=>{
      if(reg.waiting&&navigator.serviceWorker.controller){swWaiting=reg.waiting;showUpdate()}
      reg.addEventListener('updatefound',()=>{const nw=reg.installing;nw&&nw.addEventListener('statechange',()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller){swWaiting=nw;showUpdate()}})});
    }).catch(()=>{}));
    let reloading=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});
  }
})();
