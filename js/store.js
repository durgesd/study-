/* ============================ storage ============================= */
const KEY='pariksha-path.v1',SNAP='pariksha-path.snap.';
let D,storageOK=true,lastErr='';
const REV_STEPS=[1,3,7,15,30]; // days after completion: 1st, 2nd, 3rd, 4th, 5th revision
const blank=()=>({v:2,topics:{},custom:{},plans:{},log:{},exams:{},revs:{},settings:{theme:'dark',goal:240,lastExport:null,created:today(),autoRev:true,remind:{on:false,time:'08:00',last:null},focus:25}});
function migrate(o){const b=blank();const r=Object.assign(b,o||{});r.settings=Object.assign(b.settings,(o&&o.settings)||{});r.settings.remind=Object.assign(blank().settings.remind,(o&&o.settings&&o.settings.remind)||{});r.v=2;['topics','custom','plans','log','exams','revs'].forEach(k=>{if(!r[k]||typeof r[k]!=='object')r[k]={}});return r}
function load(){
  let raw=null;
  try{raw=localStorage.getItem(KEY);if(raw)return migrate(JSON.parse(raw))}catch(e){
    lastErr='Main data unreadable – tried to recover from backup.';
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
  }catch(e){storageOK=false;toast('⚠ Browser storage blocked or full – export a backup now')}
}
function snaps(){const a=[];try{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(SNAP))a.push(k)}}catch(e){}return a.sort().reverse()}
function pruneSnaps(){snaps().slice(14).forEach(k=>{try{localStorage.removeItem(k)}catch(e){}})}
window.addEventListener('beforeunload',saveNow);
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveNow()});

/* ========================== derived data ========================== */
let INDEX={};
function topicsOf(ex,sub){
  const base=sub.t.map(t=>({id:`${ex.key}.${sub.k}.${hash(t)}`,t,c:0}));
  const cu=(D.custom[ex.key+'.'+sub.k]||[]).map(o=>({id:o.id,t:o.t,c:1}));
  return base.concat(cu);
}
function buildIndex(){INDEX={};EXAMS.forEach(ex=>ex.subjects.forEach(s=>topicsOf(ex,s).forEach(t=>INDEX[t.id]={ex,sub:s,t:t.t,id:t.id})))}
const TS=id=>D.topics[id]||{};
function stat(items){let d=0,p=0,r=0;items.forEach(x=>{const o=TS(x.id);if(o.s===2)d++;else if(o.s===1)p++;if(o.r)r++});const n=items.length;return{n,d,p,r,rest:n-d-p,pct:n?Math.round(d*100/n):0}}
const subStat=(ex,s)=>stat(topicsOf(ex,s));
const examStat=ex=>stat(ex.subjects.flatMap(s=>topicsOf(ex,s)));
function overall(){return stat(Object.values(INDEX))}
function activity(){
  const a={};const add=(d,n)=>{if(d)a[d]=(a[d]||0)+n};
  Object.values(D.topics).forEach(o=>{if(o.s===2)add(o.d,1)});
  Object.entries(D.plans).forEach(([d,l])=>l.forEach(t=>{if(t.done)add(t.dd||d,1)}));
  Object.entries(D.log).forEach(([d,m])=>{if(m>0)add(d,Math.max(1,Math.floor(m/30)))});
  Object.entries(D.revs||{}).forEach(([d,n])=>add(d,n));
  return a;
}
function streak(a){let d=today(),n=0;if(!a[d])d=addDays(d,-1);while(a[d]){n++;d=addDays(d,-1)}return n}

/* ============================== state ============================= */
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

const UI={view:'dash',ex:'cgpsc',group:{},filter:'all',q:'',open:{},note:{},date:today()};
D=load();buildIndex();
document.documentElement.dataset.theme=D.settings.theme;

