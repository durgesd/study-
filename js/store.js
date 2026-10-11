/* ============================ storage ============================= */
const KEY='pariksha-path.v1',SNAP='pariksha-path.snap.';
const REV_STEPS=[1,3,7,15,30]; // days after completion: 1st … 5th revision
let D,storageOK=true,lastErr='';
const blank=()=>({v:3,topics:{},custom:{},plans:{},log:{},exams:{},revs:{},settings:{theme:'dark',lang:null,goal:240,lastExport:null,created:today(),autoRev:true,remind:{on:false,time:'08:00',last:null},focus:25}});
function migrate(o){
  const b=blank(),r=Object.assign(b,o||{});
  r.settings=Object.assign(blank().settings,(o&&o.settings)||{});
  r.settings.remind=Object.assign(blank().settings.remind,(o&&o.settings&&o.settings.remind)||{});
  r.v=3;['topics','custom','plans','log','exams','revs'].forEach(k=>{if(!r[k]||typeof r[k]!=='object')r[k]={}});
  return r;
}
function load(){
  let raw=null;
  try{raw=localStorage.getItem(KEY);if(raw)return migrate(JSON.parse(raw))}catch(e){
    lastErr='err_data';
    try{if(raw)localStorage.setItem(KEY+'.corrupt',raw)}catch(_){}
    try{const b=localStorage.getItem(KEY+'.bak');if(b)return migrate(JSON.parse(b))}catch(_){}
  }
  return blank();
}
let saveT;
function save(){clearTimeout(saveT);saveT=setTimeout(saveNow,150)}
function saveNow(){
  try{
    const prev=localStorage.getItem(KEY),json=JSON.stringify(D);
    if(prev&&prev!==json)localStorage.setItem(KEY+'.bak',prev);
    const sk=SNAP+today();
    if(prev&&!localStorage.getItem(sk)){localStorage.setItem(sk,prev);pruneSnaps()}
    localStorage.setItem(KEY,json);storageOK=true;
  }catch(e){storageOK=false;toast(t('toast_storage'))}
}
function snaps(){const a=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(SNAP))a.push(k)}}catch(e){}return a.sort().reverse()}
function pruneSnaps(){snaps().slice(14).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}
window.addEventListener('beforeunload',saveNow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow()});

/* ========================== derived data ========================== */
let INDEX={};
function topicsOf(ex,sub){
  const base=sub.t.map(x=>({id:`${ex.key}.${sub.k}.${hash(x.t)}`,t:x.t,h:x.h,e:x.e,c:0}));
  const cu=(D.custom[ex.key+'.'+sub.k]||[]).map(o=>({id:o.id,t:o.t,h:'',e:'',c:1}));
  return base.concat(cu);
}
function buildIndex(){INDEX={};ALL.forEach(ex=>ex.subjects.forEach(s=>topicsOf(ex,s).forEach(x=>INDEX[x.id]={ex,sub:s,t:x.t,h:x.h,e:x.e,id:x.id})))}
const TS=id=>D.topics[id]||{};
function stat(items){let d=0,p=0,r=0;items.forEach(x=>{const o=TS(x.id);if(o.s===2)d++;else if(o.s===1)p++;if(o.r)r++});const n=items.length;return{n,d,p,r,rest:n-d-p,pct:n?Math.round(d*100/n):0}}
const subStat=(ex,s)=>stat(topicsOf(ex,s));
const examStat=ex=>stat(ex.subjects.flatMap(s=>topicsOf(ex,s)));
const overall=()=>stat(Object.values(INDEX).filter(x=>!x.ex.isMaster));
const exByKey=k=>ALL.find(e=>e.key===k);
function activity(){
  const a={};const add=(d,n)=>{if(d)a[d]=(a[d]||0)+n};
  Object.values(D.topics).forEach(o=>{if(o.s===2)add(o.d,1)});
  Object.entries(D.plans).forEach(([d,l])=>l.forEach(x=>{if(x.done)add(x.dd||d,1)}));
  Object.entries(D.log).forEach(([d,m])=>{if(m>0)add(d,Math.max(1,Math.floor(m/30)))});
  Object.entries(D.revs||{}).forEach(([d,n])=>add(d,n));
  return a;
}
function streak(a){let d=today(),n=0;if(!a[d])d=addDays(d,-1);while(a[d]){n++;d=addDays(d,-1)}return n}

/* master syllabus: how ready am I for each exam, based on master progress */
function readiness(){
  const out={};Object.keys(COV).forEach(k=>out[k]={n:0,d:0});
  MASTER.subjects.forEach(s=>topicsOf(MASTER,s).forEach(x=>{[...(x.e||'')].forEach(k=>{if(out[k]){out[k].n++;if(TS(x.id).s===2)out[k].d++}})}));
  return out;
}
function overlapCounts(){const c={1:0,2:0,3:0,4:0};MASTER.subjects.forEach(s=>s.t.forEach(x=>{if(x.e)c[x.e.length]++}));return c}

/* ---------- spaced revision ---------- */
function revLists(){
  const t0=today(),due=[],soon=[],mastered=[];
  Object.values(INDEX).forEach(x=>{const o=TS(x.id);if(o.s!==2)return;
    if(o.nx){const item=Object.assign({o,late:diffDays(t0,o.nx)},x);if(o.nx<=t0)due.push(item);else soon.push(item)}
    else if(o.m)mastered.push(Object.assign({o},x));});
  due.sort((a,b)=>b.late-a.late);soon.sort((a,b)=>a.o.nx<b.o.nx?-1:1);
  return{due,soon,mastered};
}
const dueCount=()=>revLists().due.length;
function markRevised(id){
  const o=D.topics[id];if(!o)return;
  o.rc=(o.rc||0)+1;o.lr=today();
  if(o.rc>=REV_STEPS.length){delete o.nx;o.m=1}else o.nx=addDays(today(),REV_STEPS[o.rc]);
  D.revs[today()]=(D.revs[today()]||0)+1;
}
function snoozeRev(id,days){const o=D.topics[id];if(o)o.nx=addDays(today(),days||1)}

/* ============================== state ============================= */
const UI={view:'dash',ex:'master',group:{},filter:'all',cov:'all',q:'',open:{},note:{},date:today()};
D=load();
LANG=D.settings.lang||((navigator.language||'').toLowerCase().startsWith('hi')?'hi':'en');
buildIndex();
document.documentElement.dataset.theme=D.settings.theme;
document.documentElement.lang=LANG;
