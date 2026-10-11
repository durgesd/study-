/* =====================================================================
   Merge engine for multi-device sync.
   Every editable record carries `u` (last-edit time in ms). Merging two
   copies keeps the newest version of each record, so nothing is lost when
   you study on phone and PC at different times (or offline).
   Deletions are tombstones (`del:true`) so they sync as well.
   A "reset" (erase / import / restore) stamps `resetAt`; the newer reset wins.
   ===================================================================== */
const clone=o=>JSON.parse(JSON.stringify(o));
const U=o=>(o&&o.u)||0;
/* canonical JSON (sorted keys) so two devices produce identical text for identical data */
function stable(v){
  if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
  if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
  return JSON.stringify(v===undefined?null:v);
}
const idCmp=(a,b)=>a.id.length-b.id.length||(a.id<b.id?-1:a.id>b.id?1:0);
function mergeStates(L,R){
  const lr=L.resetAt||0,rr=R.resetAt||0;
  if(rr>lr)return clone(R);
  if(lr>rr)return clone(L);
  const out=clone(L);
  /* topics: newest record wins */
  Object.entries(R.topics||{}).forEach(([id,r])=>{const l=out.topics[id];if(!l||U(r)>U(l))out.topics[id]=clone(r)});
  /* custom topics: by id, newest wins (tombstones included) */
  Object.keys(R.custom||{}).forEach(k=>{
    const map={};[...(out.custom[k]||[]),...R.custom[k]].forEach(o=>{const c=map[o.id];if(!c||U(o)>U(c))map[o.id]=clone(o)});
    out.custom[k]=Object.values(map).sort(idCmp);
  });
  Object.keys(out.custom).forEach(k=>{out.custom[k]=[...out.custom[k]].sort(idCmp)});
  /* plan tasks: by id across all dates, newest wins (a task moved to another day carries a newer stamp) */
  const best={};
  const eat=P=>Object.entries(P||{}).forEach(([date,list])=>list.forEach(t=>{const c=best[t.id];if(!c||U(t)>U(c.t))best[t.id]={t,d:date}}));
  eat(L.plans);eat(R.plans);
  out.plans={};
  Object.values(best).forEach(({t,d})=>(out.plans[d]=out.plans[d]||[]).push(clone(t)));
  Object.keys(out.plans).forEach(d=>out.plans[d].sort(idCmp));
  /* study minutes per day: newest stamp wins, otherwise larger value */
  out.log={...(L.log||{})};out.logu={...(L.logu||{})};
  Object.keys({...(R.log||{}),...(R.logu||{})}).forEach(d=>{
    const lu=(L.logu||{})[d]||0,ru=(R.logu||{})[d]||0,lv=(L.log||{})[d]||0,rv=(R.log||{})[d]||0;
    if(ru>lu){out.log[d]=rv;out.logu[d]=ru}else if(ru===lu&&rv>lv){out.log[d]=rv}
  });
  /* revision counters: only ever grow */
  out.revs={...(L.revs||{})};
  Object.entries(R.revs||{}).forEach(([d,n])=>{out.revs[d]=Math.max(out.revs[d]||0,n)});
  /* exam dates */
  out.exams={...(L.exams||{})};
  Object.entries(R.exams||{}).forEach(([k,r])=>{const l=out.exams[k];if(!l||U(r)>U(l))out.exams[k]=clone(r)});
  /* shared settings */
  out.settings=clone(U(R.settings)>U(L.settings)?R.settings:L.settings);
  return out;
}
