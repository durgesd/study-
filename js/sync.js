/* =====================================================================
   Cross-device sync (Firebase Auth + Firestore, loaded on demand).
   Your data is merged, never blindly overwritten: see js/merge.js.
   Without FIREBASE_CONFIG the app simply stays local-only.
   ===================================================================== */
const FB_VER='10.14.1';
const Sync={state:'off',user:null,last:null,err:'',busy:false};
let FBx=null,transport=null,unsubSnap=null,pushT=null,pendingPush=false,skipKick=false;
const syncConfigured=()=>typeof FIREBASE_CONFIG!=='undefined'&&!!FIREBASE_CONFIG&&!!FIREBASE_CONFIG.apiKey;

/* the part of the data that travels between devices (theme, language, reminders stay per device) */
function syncable(){
  const s=D.settings;
  return{resetAt:D.resetAt||0,topics:D.topics,custom:D.custom,plans:D.plans,log:D.log,logu:D.logu,exams:D.exams,revs:D.revs,
    settings:{goal:s.goal,autoRev:s.autoRev,focus:s.focus,u:s.u||0}};
}
function applyMerged(m){
  if(stable(m)===stable(syncable()))return false;
  D.resetAt=m.resetAt;D.topics=m.topics;D.custom=m.custom;D.plans=m.plans;D.log=m.log;D.logu=m.logu;D.exams=m.exams;D.revs=m.revs;
  D.settings.goal=m.settings.goal;D.settings.autoRev=m.settings.autoRev;D.settings.focus=m.settings.focus;D.settings.u=m.settings.u;
  buildIndex();return true;
}
function quietSave(){skipKick=true;try{saveNow()}finally{skipKick=false}}
function refreshUI(){
  const a=document.activeElement;
  if(a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&a.id!=='q')))return; // never disturb typing
  keepScroll(render);
}
function mergeWith(remoteStr){
  const local=syncable();let merged=local;
  if(remoteStr)merged=mergeStates(local,JSON.parse(remoteStr));
  return{write:stable(merged),result:merged};
}
function syncKick(){
  if(skipKick||!Sync.user||!transport)return;
  clearTimeout(pushT);pushT=setTimeout(syncPush,1200);
}
async function syncPush(){
  if(!transport||!Sync.user)return;
  if(Sync.busy){pendingPush=true;return}
  Sync.busy=true;setState('syncing');
  try{
    const merged=await transport.transact(mergeWith);
    if(applyMerged(merged)){quietSave();refreshUI()}
    Sync.last=Date.now();setState('synced');
  }catch(e){setState(navigator.onLine===false?'offline':'error',e)}
  finally{Sync.busy=false;if(pendingPush){pendingPush=false;syncPush()}}
}
function onRemote(remoteStr){
  if(!remoteStr){syncKick();return}
  let remote;try{remote=JSON.parse(remoteStr)}catch(e){return}
  const m=mergeStates(syncable(),remote);
  if(applyMerged(m)){quietSave();refreshUI()}
  if(stable(m)!==stable(remote))syncKick();   // we hold something the cloud lacks
  Sync.last=Date.now();setState('synced');
}
function attach(tp){
  if(unsubSnap){try{unsubSnap()}catch(e){}unsubSnap=null}
  transport=tp;setState('syncing');
  unsubSnap=tp.listen(onRemote,e=>setState('error',e));
  syncPush();
}

/* ---------- Firebase wiring ---------- */
async function loadFB(){
  if(FBx)return FBx;
  const base=`https://www.gstatic.com/firebasejs/${FB_VER}/`;
  const [a,au,fs]=await Promise.all([import(base+'firebase-app.js'),import(base+'firebase-auth.js'),import(base+'firebase-firestore.js')]);
  const app=a.initializeApp(FIREBASE_CONFIG),auth=au.getAuth(app),db=fs.getFirestore(app);
  FBx={auth,db,au,fs};
  au.onAuthStateChanged(auth,onUser);
  return FBx;
}
function onUser(user){
  if(unsubSnap){try{unsubSnap()}catch(e){}unsubSnap=null}
  if(!user){Sync.user=null;transport=null;setState('signedout');return}
  Sync.user={uid:user.uid,email:user.email||user.displayName||''};
  try{localStorage.setItem('pp.sync','1')}catch(e){}
  const {db,fs}=FBx,ref=fs.doc(db,'users',user.uid);
  attach({
    transact:fn=>fs.runTransaction(db,async tx=>{
      const snap=await tx.get(ref),remote=snap.exists()?snap.data().data:null,r=fn(remote);
      if(r.write!==remote)tx.set(ref,{data:r.write,updatedAt:fs.serverTimestamp(),v:4});
      return r.result;
    }),
    listen:(cb,onErr)=>fs.onSnapshot(ref,snap=>{if(snap.metadata.hasPendingWrites)return;cb(snap.exists()?snap.data().data:null)},onErr)
  });
}
async function syncBoot(){
  if(!syncConfigured()){setState('off');return}
  let on=false;try{on=localStorage.getItem('pp.sync')==='1'}catch(e){}
  if(!on){setState('signedout');return}
  setState('syncing');
  try{await loadFB()}catch(e){setState(navigator.onLine===false?'offline':'error',e)}
}
function authMsg(e){
  const c=(e&&e.code)||'';
  const map={'auth/invalid-credential':'sy_e_cred','auth/wrong-password':'sy_e_cred','auth/user-not-found':'sy_e_cred','auth/email-already-in-use':'sy_e_exists','auth/weak-password':'sy_e_weak','auth/invalid-email':'sy_e_email','auth/unauthorized-domain':'sy_e_domain','auth/network-request-failed':'sy_e_net','auth/operation-not-allowed':'sy_e_op','auth/popup-closed-by-user':'sy_e_popup','auth/cancelled-popup-request':'sy_e_popup','auth/too-many-requests':'sy_e_many'};
  return map[c]?t(map[c]):t('sy_err_detail',c||(e&&e.message)||'?');
}
async function syncAuth(mode){
  const btns=document.querySelectorAll('#syncCard .btn');btns.forEach(b=>b.disabled=true);
  try{
    const F=await loadFB();
    if(mode==='google')await F.au.signInWithPopup(F.auth,new F.au.GoogleAuthProvider());
    else{
      const email=($('#syEmail')||{}).value?.trim(),pw=($('#syPass')||{}).value;
      if(!email||!pw){toast(t('sy_fill'));return}
      if(mode==='up')await F.au.createUserWithEmailAndPassword(F.auth,email,pw);
      else await F.au.signInWithEmailAndPassword(F.auth,email,pw);
    }
  }catch(e){toast(authMsg(e))}
  finally{btns.forEach(b=>b.disabled=false)}
}
async function syncSignOut(){
  if(!await ask({title:t('sy_out_title'),body:t('sy_out_body'),ok:t('sy_out')}))return;
  try{await FBx.au.signOut(FBx.auth)}catch(e){}
  try{localStorage.removeItem('pp.sync')}catch(e){}
  Sync.user=null;transport=null;setState('signedout');
}

/* ---------- status UI ---------- */
function setState(s,e){Sync.state=s;Sync.err=e?(e.code||e.message||String(e)):'';renderSyncUI()}
function syncChip(){
  const m={off:['sy_off','off'],signedout:['sy_signedout','off'],syncing:['sy_syncing','busy'],synced:['sy_synced','ok'],offline:['sy_offline','warn'],error:['sy_error','bad']}[Sync.state]||['sy_off','off'];
  return `<i class="sd ${m[1]}"></i>${t(m[0])}`;
}
function renderSyncUI(){
  document.querySelectorAll('.syncchip').forEach(el=>{el.innerHTML=syncChip()});
  const c=document.getElementById('syncCard');
  if(c&&!c.contains(document.activeElement))c.innerHTML=syncCardInner();
}
function syncCardInner(){
  if(!syncConfigured()){
    return `<h2 class="h2">${ico('globe',20)} ${t('sy_title')}</h2><p class="muted">${t('sy_unconf')}</p>
      <ol class="steps">${[1,2,3,4,5,6].map(i=>`<li>${t('sy_step'+i)}</li>`).join('')}</ol>
      <p class="muted" style="font-size:13px">${t('sy_unconf_note')}</p>`;
  }
  if(Sync.user){
    const ago=Sync.last?nice(fmt(new Date(Sync.last)),{day:'numeric',month:'short'})+' '+new Date(Sync.last).toLocaleTimeString(LANG==='hi'?'hi-IN':'en-IN',{hour:'2-digit',minute:'2-digit'}):'—';
    return `<h2 class="h2">${ico('globe',20)} ${t('sy_title')} <span class="syncchip chipbtn">${syncChip()}</span></h2>
      <div class="kv"><span class="muted">${t('sy_account')}</span><b>${esc(Sync.user.email)}</b></div>
      <div class="kv"><span class="muted">${t('sy_last')}</span><b>${ago}</b></div>
      ${Sync.state==='error'?`<div class="warn" style="margin-top:12px">${esc(Sync.err==='permission-denied'?t('sy_e_rules'):t('sy_err_detail',Sync.err))}</div>`:''}
      <div class="chips" style="margin-top:14px"><button class="btn pri" data-act="syncNow">${ico('rev',16)} ${t('sy_now')}</button><button class="btn" data-act="syncOut">${t('sy_out')}</button></div>
      <p class="muted" style="font-size:13px;margin-top:12px">${t('sy_note')}</p>`;
  }
  return `<h2 class="h2">${ico('globe',20)} ${t('sy_title')} <span class="syncchip chipbtn">${syncChip()}</span></h2>
    <p class="muted" style="margin-bottom:12px">${t('sy_intro')}</p>
    <div class="syform"><input class="inp" id="syEmail" type="email" placeholder="${esc(t('sy_email'))}" autocomplete="email"><input class="inp" id="syPass" type="password" placeholder="${esc(t('sy_pass'))}" autocomplete="current-password"></div>
    <div class="chips" style="margin-top:12px"><button class="btn pri" data-act="syncIn">${t('sy_signin')}</button><button class="btn" data-act="syncUp">${t('sy_signup')}</button><button class="btn" data-act="syncGoogle">${t('sy_google')}</button></div>
    <p class="muted" style="font-size:13px;margin-top:12px">${t('sy_first')}</p>`;
}
window.addEventListener('online',()=>{if(Sync.user)syncPush()});
window.addEventListener('offline',()=>{if(Sync.user)setState('offline')});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&Sync.user)syncPush()});
