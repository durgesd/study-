/* ============================ actions ============================= */
function setStatus(id,s){
  const o=D.topics[id]||(D.topics[id]={});const was=o.s;o.s=s;
  if(s===2){o.d=today();if(D.settings.autoRev&&was!==2&&!o.nx&&!o.m){o.rc=0;o.nx=addDays(today(),REV_STEPS[0])}}
  else{delete o.d;delete o.nx;delete o.rc;delete o.m;delete o.lr}
  if(!o.s&&!o.r&&!o.n)delete D.topics[id];
}
const keepScroll=fn=>{const y=window.scrollY;fn();window.scrollTo(0,y)};

/* ---------- notifications & badge ---------- */
const APP_TITLE='Pariksha Path — Syllabus Tracker';
const notifSupported=()=>'Notification' in window;
function notifState(){if(!notifSupported())return'Not supported in this browser';const p=Notification.permission;return p==='granted'?'Allowed – reminders will appear':p==='denied'?'Blocked – allow notifications in browser site settings':'Permission not asked yet'}
async function showNotif(title,body,tag){
  if(!notifSupported()||Notification.permission!=='granted')return false;
  try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();if(reg){await reg.showNotification(title,{body,tag,icon:'icons/icon-192.png',badge:'icons/icon-192.png'});return true}}catch(e){}
  try{new Notification(title,{body,tag,icon:'icons/icon-192.png'});return true}catch(e){return false}
}
function setBadge(n){document.title=(n?`(${n}) `:'')+APP_TITLE;try{if(navigator.setAppBadge){n?navigator.setAppBadge(n).catch(()=>{}):navigator.clearAppBadge&&navigator.clearAppBadge().catch(()=>{})}}catch(e){}}
function checkReminders(){
  const r=D.settings.remind;if(!r.on)return;const now=new Date(),t=today();if(r.last===t)return;
  const [h,m]=(r.time||'08:00').split(':').map(Number);if(now.getHours()*60+now.getMinutes()<h*60+m)return;
  const n=dueCount(),tasks=(D.plans[t]||[]).filter(x=>!x.done).length;r.last=t;save();
  if(n||tasks){const bits=[];if(n)bits.push(`${n} topic${n>1?'s':''} to revise`);if(tasks)bits.push(`${tasks} task${tasks>1?'s':''} planned`);showNotif('Today: '+bits.join(' · '),'Open Pariksha Path and start with the revision list.','daily-'+t)}
}
async function askPerm(){
  if(!notifSupported()){toast('This browser does not support notifications');return false}
  if(Notification.permission==='default'){try{await Notification.requestPermission()}catch(e){}}
  if(Notification.permission!=='granted'){toast('Notifications are blocked. Allow them in your browser site settings.');return false}
  return true;
}

/* ---------- focus timer ---------- */
function timerFinish(auto){
  const t=timerGet();if(!t)return;
  const mins=auto?t.mins:Math.round((Date.now()-(t.end-t.mins*60000))/60000);
  try{localStorage.removeItem(TKEY)}catch(e){}
  if(mins>=1){D.log[today()]=(D.log[today()]||0)+mins;save()}
  if(auto){showNotif('Focus session complete',`${mins} minutes logged. Take a short break.`,'timer');toast(`Session complete · ${mins}m logged`)}
  else toast(mins>=1?`${mins}m logged`:'Session too short to log');
  render();
}
function refreshAfter(id){
  renderNav();
  if(UI.view==='exam'){const row=document.getElementById('t-'+id);const sub=row&&row.closest('.subj');const ex=exByKey(UI.ex);
    const scroll=window.scrollY;renderListKeep();window.scrollTo(0,scroll)}
}
function renderListKeep(){
  // re-render list but keep note textarea focus state out of the way
  renderList();
  const ex=exByKey(UI.ex),s=examStat(ex);const hero=document.querySelector('.hero');
  if(hero){const keep=hero.querySelector('#examDate');const val=keep?keep.value:'';const tmp=document.createElement('div');tmp.innerHTML=vExam();const nh=tmp.querySelector('.hero');hero.innerHTML=nh.innerHTML;}
}
const A={
 nav(b){go(b.dataset.v,b.dataset.ex)},
 cycle(b){const id=b.dataset.id,s=((TS(id).s||0)+1)%3;setStatus(id,s);save();refreshAfter(id);
   if(s===2)toast('Marked done ✓')},
 revised(b){markRevised(b.dataset.id);save();keepScroll(render);toast('Revision recorded ✓')},
 snooze(b){snoozeRev(b.dataset.id,1);save();keepScroll(render);toast('Reminder moved to tomorrow')},
 autoRev(){D.settings.autoRev=!D.settings.autoRev;save();render()},
 remindToggle:async()=>{const r=D.settings.remind;if(!r.on){if(!await askPerm())return;r.on=true;r.last=null;toast('Daily reminder on')}else r.on=false;save();render()},
 testNotif:async()=>{if(!await askPerm())return;const ok=await showNotif('Pariksha Path','Reminders are working. Keep revising!','test');toast(ok?'Test notification sent':'Could not show notification')},
 timerLen(b){D.settings.focus=+b.dataset.m;save();render()},
 timerStart(){const m=D.settings.focus||25;try{localStorage.setItem(TKEY,JSON.stringify({end:Date.now()+m*60000,mins:m}))}catch(e){toast('Storage blocked – timer needs browser storage');return}if(notifSupported()&&Notification.permission==='default')Notification.requestPermission().catch(()=>{});render()},
 timerStop:async()=>{if(!await ask({title:'Discard this session?',body:'Time will not be added to your study log.',ok:'Discard',danger:true}))return;try{localStorage.removeItem(TKEY)}catch(e){}render()},
 timerDone(){timerFinish(false)},
 rev(b){const id=b.dataset.id,o=D.topics[id]||(D.topics[id]={});o.r=!o.r;if(!o.r)delete o.r;if(!o.s&&!o.r&&!o.n)delete D.topics[id];save();refreshAfter(id);toast(TS(id).r?'Added to revision list':'Removed from revision')},
 note(b){const id=b.dataset.id;UI.note[id]=!UI.note[id];refreshAfter(id);if(UI.note[id]){const t=document.querySelector(`[data-note="${id}"]`);t&&t.focus()}},
 toPlan(b){addTask(INDEX[b.dataset.id].t,b.dataset.id,today());toast('Added to today’s plan')},
 delcustom:async b=>{const id=b.dataset.id,x=INDEX[id];if(!await ask({title:'Remove custom topic?',body:'“'+esc(x.t)+'” will be removed from your syllabus along with its progress.',ok:'Remove',danger:true}))return;
   const k=x.ex.key+'.'+x.sub.k;D.custom[k]=(D.custom[k]||[]).filter(o=>o.id!==id);delete D.topics[id];save();buildIndex();render()},
 sub(b){const k=b.dataset.k;UI.open[k]=!UI.open[k];const sec=b.closest('.subj');sec.classList.toggle('open',!!UI.open[k]);b.setAttribute('aria-expanded',!!UI.open[k])},
 markall:async b=>{const ex=exByKey(b.dataset.ex),sub=ex.subjects.find(s=>s.k===b.dataset.s);
   if(!await ask({title:'Mark everything done?',body:'All topics in “'+esc(sub.n)+'” will be marked as done.',ok:'Mark all done'}))return;
   topicsOf(ex,sub).forEach(t=>{if(TS(t.id).s!==2)setStatus(t.id,2)});save();render();toast('Subject completed')},
 group(b){UI.group[UI.ex]=b.dataset.g;render()},
 filter(b){UI.filter=b.dataset.f;document.querySelectorAll('.f').forEach(x=>x.classList.toggle('on',x.dataset.f===UI.filter));renderList()},
 goTopic(b){const x=INDEX[b.dataset.id];UI.view='exam';UI.ex=x.ex.key;UI.q='';UI.filter='all';UI.group[x.ex.key]='All';UI.open[x.ex.key+'.'+x.sub.k]=true;render();
   const el=document.getElementById('t-'+x.id);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('flash')}},
 task(b){const l=D.plans[b.dataset.d]||[],t=l.find(x=>x.id===b.dataset.id);if(!t)return;t.done=!t.done;if(t.done)t.dd=today();else delete t.dd;save();render()},
 deltask:async b=>{const l=D.plans[b.dataset.d]||[];D.plans[b.dataset.d]=l.filter(x=>x.id!==b.dataset.id);if(!D.plans[b.dataset.d].length)delete D.plans[b.dataset.d];save();render()},
 refdone(b){setStatus(b.dataset.id,2);save();render();toast('Topic marked done ✓')},
 addTask(){const i=$('#newTask');if(!i.value.trim())return;addTask(i.value.trim(),null,UI.date);render();$('#newTask').focus()},
 day(b){const n=+b.dataset.n;UI.date=n===0?today():addDays(UI.date,n);render()},
 carry(){const t0=today();let n=0;D.plans[t0]=D.plans[t0]||[];Object.keys(D.plans).forEach(k=>{if(k<t0){const keep=[];D.plans[k].forEach(t=>{if(t.done)keep.push(t);else{D.plans[t0].push(t);n++}});if(keep.length)D.plans[k]=keep;else delete D.plans[k]}});save();render();toast(n+' task(s) moved to today')},
 addmin(b){const d=UI.date;D.log[d]=Math.max(0,(D.log[d]||0)+ +b.dataset.m);if(!D.log[d])delete D.log[d];save();render()},
 theme(b){D.settings.theme=b.dataset.t;document.documentElement.dataset.theme=b.dataset.t;save();render()},
 export(){exportData()},
 import(){$('#importFile').click()},
 restore:async b=>{const k=b.dataset.k;if(!await ask({title:'Restore this copy?',body:'Your current data is saved as a safety copy first, then replaced with the '+nice(k.slice(SNAP.length),{day:'numeric',month:'short'})+' copy.',ok:'Restore'}))return;
   try{const raw=localStorage.getItem(k);const obj=JSON.parse(raw);localStorage.setItem(KEY+'.before-restore',JSON.stringify(D));D=migrate(obj);buildIndex();saveNow();render();toast('Restored')}catch(e){toast('Could not restore that copy')}},
 reset:async()=>{const v=await ask({title:'Erase all progress?',body:'This removes every tick, note, plan and study log. A backup file downloads first. Type <b>ERASE</b> to continue.',ok:'Erase everything',danger:true,input:'',placeholder:'Type ERASE'});
   if(v!=='ERASE'){if(v!==false)toast('Not erased – you must type ERASE');return}
   exportData(true);try{localStorage.setItem(KEY+'.before-reset',JSON.stringify(D))}catch(e){}
   const th=D.settings.theme;D=blank();D.settings.theme=th;buildIndex();saveNow();render();toast('All progress erased')}
};
function addTask(text,ref,date){(D.plans[date]=D.plans[date]||[]).push({id:uid(),text,ref:ref||null,done:false});save()}
function exportData(silent){
  const blob=new Blob([JSON.stringify({app:'pariksha-path',exported:new Date().toISOString(),...D},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`pariksha-path-backup-${today()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  if(!silent){D.settings.lastExport=today();save();toast('Backup downloaded');render()}
}

/* ============================ events ============================== */
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const f=A[b.dataset.act];if(f)f(b,e)});
document.addEventListener('input',e=>{
  const t=e.target;
  if(t.id==='q'){UI.q=t.value;renderList()}
  if(t.dataset.note){const id=t.dataset.note,v=t.value.trim();const o=D.topics[id]||(D.topics[id]={});if(v)o.n=t.value;else delete o.n;if(!o.s&&!o.r&&!o.n)delete D.topics[id];save();
    const row=document.getElementById('t-'+id);if(row){const nb=row.querySelector('.ib.nt');nb&&nb.classList.toggle('on',!!v)}}
});
document.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='examDate'){const k=t.dataset.ex;D.exams[k]=D.exams[k]||{};if(t.value)D.exams[k].date=t.value;else delete D.exams[k].date;save();render()}
  if(t.id==='planDate'&&t.value){UI.date=t.value;render()}
  if(t.id==='remindTime'&&t.value){D.settings.remind.time=t.value;save();toast('Reminder time saved')}
  if(t.id==='goalIn'){D.settings.goal=Math.max(30,Math.min(1080,+t.value||240));save();render()}
  if(t.id==='importFile'&&t.files[0]){
    const fr=new FileReader();
    fr.onload=async()=>{try{
      const o=JSON.parse(fr.result);if(!o||typeof o.topics!=='object')throw 0;
      if(!await ask({title:'Import this backup?',body:'Current data will be replaced. A safety copy of what you have now is kept automatically.',ok:'Import'}))return;
      localStorage.setItem(KEY+'.before-import',JSON.stringify(D));D=migrate(o);delete D.app;delete D.exported;buildIndex();saveNow();render();toast('Backup imported');
    }catch(err){toast('That file is not a valid backup')}};
    fr.readAsText(t.files[0]);t.value='';
  }
});
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter')return;const t=e.target;
  if(t.dataset.addtopic&&t.value.trim()){
    const key=t.dataset.addtopic,[exk,sk]=key.split('.');
    (D.custom[key]=D.custom[key]||[]).push({id:`${exk}.${sk}.c${uid()}`,t:t.value.trim()});
    UI.open[key]=true;save();buildIndex();render();toast('Topic added');
    const el=document.querySelector(`[data-addtopic="${key}"]`);el&&el.focus();
  }
  if(t.id==='newTask'){A.addTask()}
});

/* =============================== boot ============================= */
render();
if(navigator.storage&&navigator.storage.persist){navigator.storage.persist().then(ok=>{const el=$('#persist');if(el)el.textContent=ok?'Yes':'Best-effort'}).catch(()=>{})}
/* ---------- timers, reminders, offline ---------- */
setInterval(()=>{
  const t=timerGet();
  if(t){if(Date.now()>=t.end)timerFinish(true);else{const el=$('#timerTxt');if(el)el.textContent=mmss(t.end-Date.now())}}
},1000);
checkReminders();setInterval(checkReminders,60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkReminders();if(UI.view==='dash'||UI.view==='rev')keepScroll(render)}});
new MutationObserver(()=>{const el=$('#persist');if(el&&el.textContent==='checking…'&&navigator.storage&&navigator.storage.persisted)navigator.storage.persisted().then(p=>{el.textContent=p?'Yes':'Best-effort'})}).observe(document.body,{childList:true,subtree:true});
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)){window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
