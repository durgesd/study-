/* ============================== UI bits =========================== */
const exName=e=>LANG==='hi'&&e.nameH?e.nameH:e.name;
const exFull=e=>LANG==='hi'&&e.fullH?e.fullH:e.full;
const subName=s=>LANG==='hi'&&s.nh?s.nh:s.n;
const tpc=x=>LANG==='hi'&&x.h?x.h:x.t;
const gname=g=>LANG==='hi'&&GROUP_HI[g]?GROUP_HI[g]:g;
let toastT;
function toast(m){const el=$('#toast');el.textContent=m;el.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),2600)}
function ask({title,body='',ok=t('confirm'),danger=false,input=null,placeholder=''}){
  return new Promise(res=>{
    const r=$('#modalRoot');
    r.innerHTML=`<div class="ov"><div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${body}</p>${input!==null?`<input class="inp" id="mi" placeholder="${esc(placeholder)}" autocomplete="off">`:''}<div class="acts"><button class="btn" id="mc">${t('cancel')}</button><button class="btn ${danger?'dng':'pri'}" id="mo">${esc(ok)}</button></div></div></div>`;
    const done=v=>{r.innerHTML='';r.onkeydown=null;res(v)};
    $('#mc').onclick=()=>done(false);
    $('#mo').onclick=()=>done(input!==null?($('#mi').value||''):true);
    r.querySelector('.ov').addEventListener('click',e=>{if(e.target.classList.contains('ov'))done(false)});
    ($('#mi')||$('#mo')).focus();
    r.onkeydown=e=>{if(e.key==='Escape')done(false);if(e.key==='Enter'&&input!==null&&$('#mi'))done($('#mi').value)};
  });
}
let ringN=0;
function ring(p,c,size=92,sw=9){
  const r=(size-sw)/2,C=2*Math.PI*r,h=size/2,id='rg'+(++ringN);
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".55"/></linearGradient></defs><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--line2)" stroke-width="${sw}"/><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C*p/100} ${C}" transform="rotate(-90 ${h} ${h})"/></svg>`;
}
function countdown(ex){
  const d=(D.exams[ex.key]||{}).date;if(!d)return'';
  const n=diffDays(d,today());
  const txt=n>0?t('days_left',n):n===0?t('exam_today'):t('exam_passed');
  return `<span class="chip" style="--c:${ex.color}">${ico('clock',13)} ${txt} · ${nice(d,{day:'numeric',month:'short',year:'numeric'})}</span>`;
}
const covChips=e=>{if(!e)return'';const core=e.length===4?`<span class="core" title="${esc(t('p4'))}">★</span>`:'';return core+[...e].map(k=>{const x=exByKey(COV[k]);return `<span class="cv" style="--c:${x.color}" title="${esc(exName(x))}">${k}</span>`}).join('')};

/* ============================== chrome ============================ */
function renderNav(){
  const due=dueCount(),all=overall();setBadge(due);
  const items=[
    {v:'dash',ic:'home',l:t('nav_dash'),s:t('nav_dash_s')},
    {v:'exam',ex:'master',ic:'master',l:exName(MASTER),s:t('nav_master_s'),c:MASTER.color,p:examStat(MASTER).pct},
    {gap:1},
    ...EXAMS.map(e=>({v:'exam',ex:e.key,ic:e.key,l:exName(e),s:exFull(e),c:e.color,p:examStat(e).pct})),
    {gap:1},
    {v:'rev',ic:'rev',l:t('nav_rev'),s:due?t('rev_due_n',due):t('nav_rev_s'),c:due?'var(--rev)':null,badge:due},
    {v:'plan',ic:'plan',l:t('nav_plan'),s:t('nav_plan_s')},
    {v:'set',ic:'set',l:t('nav_set'),s:t('nav_set_s')}];
  $('#nav').innerHTML=items.map(i=>{
    if(i.gap)return'<div class="gap"></div>';
    const on=UI.view===i.v&&(i.v!=='exam'||UI.ex===i.ex);
    return `<button class="stop ${on?'on':''}" style="--c:${i.c||'var(--primary)'};--p:${i.p||0}%" data-act="nav" data-v="${i.v}" ${i.ex?`data-ex="${i.ex}"`:''} ${on?'aria-current="page"':''}><span class="dot ${i.p!==undefined?'has-p':''}"><i>${ico(i.ic,17)}</i></span><span class="l">${esc(i.l)}<small>${esc(i.s)}</small></span>${i.badge?`<span class="badge">${i.badge}</span>`:''}</button>`}).join('');
  const light=D.settings.theme==='light';
  $('#sidefoot').innerHTML=`<div class="seg" role="group" aria-label="Language"><button class="${LANG==='en'?'on':''}" data-act="lang" data-l="en">English</button><button class="${LANG==='hi'?'on':''}" data-act="lang" data-l="hi">हिन्दी</button></div>
   <div class="foot2"><button class="ib" data-act="theme" data-t="${light?'dark':'light'}" aria-label="${t('theme')}" title="${t('theme')}">${ico(light?'moon':'sun',18)}</button>${installBtn()}</div>
   <button class="syncchip chipbtn" data-act="nav" data-v="set">${syncChip()}</button>
   <div class="fsmall"><b>${all.d}/${all.n}</b> ${t('topics_done_short')}</div>`;
  const bn=[['dash','home',t('b_home')],['exam','master',t('b_syl')],['rev','rev',t('b_rev')],['plan','plan',t('b_plan')],['set','set',t('b_more')]];
  $('#bottomnav').innerHTML=bn.map(([v,ic,l])=>`<button class="${UI.view===v?'on':''}" data-act="nav" data-v="${v}" ${v==='exam'?`data-ex="${UI.ex}"`:''}>${ico(ic,22)}<span>${l}</span>${v==='rev'&&due?`<em class="badge">${due}</em>`:''}</button>`).join('');
  $('#topbar').innerHTML=`<div class="brand sm"><div class="logo">${ico('chk',18)}</div><b>${t('app')}</b></div><div class="chips" style="gap:8px"><button class="syncchip chipbtn" data-act="nav" data-v="set">${syncChip()}</button><div class="seg sm"><button class="${LANG==='en'?'on':''}" data-act="lang" data-l="en">EN</button><button class="${LANG==='hi'?'on':''}" data-act="lang" data-l="hi">हि</button></div></div>`;
}
function render(){
  renderNav();
  $('#main').innerHTML=UI.view==='dash'?vDash():UI.view==='exam'?vExam():UI.view==='plan'?vPlan():UI.view==='rev'?vRev():vSet();
  if(UI.view==='exam')renderList();
}
function go(v,ex){UI.view=v;if(ex)UI.ex=ex;UI.q='';UI.filter='all';UI.cov='all';render();window.scrollTo({top:0,behavior:'smooth'})}

/* ---------- Dashboard ---------- */
const RAILS=`<svg class="rails" viewBox="0 0 600 220" preserveAspectRatio="none" aria-hidden="true"><g fill="none"><path d="M-20 190C120 190 190 60 330 90S520 160 640 40" stroke="currentColor" stroke-width="16" stroke-dasharray="2 9" opacity=".35"/><path d="M-20 184C120 184 190 54 330 84S520 154 640 34" stroke="currentColor" stroke-width="2" opacity=".6"/><path d="M-20 196C120 196 190 66 330 96S520 166 640 46" stroke="currentColor" stroke-width="2" opacity=".6"/></g></svg>`;
function greet(){const h=new Date().getHours();return t(h<12?'g_am':h<17?'g_pm':'g_eve')}
function lane(ex,feat){
  const s=examStat(ex);
  return `<button class="lane ${feat?'feat':''}" style="--c:${ex.color}" data-act="nav" data-v="exam" data-ex="${ex.key}">
   <span class="ltile">${ico(ex.key,22)}</span>
   <span class="lmain"><span class="lhead"><b>${esc(exName(ex))}</b><small>${esc(exFull(ex))}</small>${feat?`<span class="chip" style="--c:${ex.color}">${t('start_here')}</span>`:''}</span>
     <span class="track"><i class="fill" style="width:${s.pct}%"></i><i class="engine" style="left:${s.pct}%"></i></span>
     <span class="lmeta"><span><i class="d" style="background:var(--done)"></i>${s.d} ${t('done')}</span><span><i class="d" style="background:var(--prog)"></i>${s.p} ${t('running')}</span><span><i class="d" style="background:var(--line2)"></i>${s.rest} ${t('left')}</span>${countdown(ex)}</span></span>
   <span class="lpct">${s.pct}<small>%</small></span></button>`;
}
function vDash(){
  const act=activity(),sk=streak(act),t0=today(),plan=planOf(t0),doneT=plan.filter(x=>x.done).length,mins=D.log[t0]||0,goal=D.settings.goal||240,all=overall(),rl=revLists();
  const need=!D.settings.lastExport||diffDays(t0,D.settings.lastExport)>=7;
  const banner=(all.d+all.p>0&&need)?`<div class="banner"><div><b>${t('bk_title')}</b><br><span class="muted">${D.settings.lastExport?t('bk_ago',diffDays(t0,D.settings.lastExport)):t('bk_never')} ${t('bk_text')}</span></div><button class="btn pri" data-act="export">${t('export')}</button></div>`:'';
  const warn=(!storageOK||lastErr)?`<div class="warn">${esc(t(lastErr||'err_storage'))}</div>`:'';
  const prog=Object.values(INDEX).filter(x=>TS(x.id).s===1).slice(0,6);
  const star=Object.values(INDEX).filter(x=>TS(x.id).r).slice(0,6);
  const li=x=>`<div class="row link" data-act="goTopic" data-id="${x.id}"><span class="chip" style="--c:${x.ex.color}">${esc(exName(x.ex))}</span><div class="grow"><div>${esc(tpc(x))}</div><small>${esc(subName(x.sub))}</small></div></div>`;
  const revCard=rl.due.length?`<div class="card revcard"><div class="pagehead" style="margin-bottom:6px"><div><h2 class="h2">${t('rev_today')} <span class="chip" style="--c:var(--rev)">${t('rev_due_n',rl.due.length)}</span></h2><p class="muted">${t('rev_today_sub')}</p></div><button class="btn pri" data-act="nav" data-v="rev">${t('open_rev')}</button></div>${rl.due.slice(0,4).map(x=>revRow(x)).join('')}</div>`:'';
  const line=t('today_line',rl.due.length,plan.length-doneT);
  return `<section class="hero dashhero">${RAILS}
    <div class="hl"><div class="muted dte">${nice(t0,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div><h1>${greet()}</h1><p class="lead">${line}</p>
      <div class="chips" style="margin-top:18px"><button class="btn pri" data-act="nav" data-v="${rl.due.length?'rev':'plan'}">${rl.due.length?t('start_rev'):t('open_plan')}</button><button class="btn" data-act="nav" data-v="exam" data-ex="master">${ico('master',16)} ${t('open_master')}</button></div></div>
    <div class="hr"><div class="ringwrap">${ring(all.pct,'var(--primary)',150,13)}<div class="n big">${all.pct}<small>%</small></div></div><div class="muted cap">${t('overall')}</div></div></section>
  ${warn}${banner}${revCard}
  <div class="stats">
    <div class="stat">${ico('flame',20,'si')}<div><div class="k">${t('streak')}</div><div class="v">${sk} <small>${t('days')}</small></div></div></div>
    <div class="stat">${ico('clock',20,'si')}<div><div class="k">${t('studied_today')}</div><div class="v">${hm(mins)} <small>/ ${hm(goal)}</small></div></div></div>
    <div class="stat">${ico('plan',20,'si')}<div><div class="k">${t('tasks_today')}</div><div class="v">${doneT} <small>/ ${plan.length}</small></div></div></div>
    <div class="stat">${ico('rev',20,'si')}<div><div class="k">${t('rev_due')}</div><div class="v" style="color:${rl.due.length?'var(--rev)':'inherit'}">${rl.due.length} <small>${rl.soon.length} ${t('upcoming')}</small></div></div></div>
    <div class="stat">${ico('target',20,'si')}<div><div class="k">${t('topics_done')}</div><div class="v">${all.d} <small>/ ${all.n}</small></div></div></div>
  </div>
  <h2 class="sec">${t('routes')} <small>${t('routes_sub')}</small></h2>
  <div class="lanes">${lane(MASTER,true)}${EXAMS.map(e=>lane(e)).join('')}</div>
  <div class="grid g2">
    <div><h2 class="sec">${t('plan_today')} <small>${doneT}/${plan.length}</small></h2><div class="card">${plan.length?plan.slice(0,6).map(x=>taskRow(x,t0,true)).join(''):`<div class="empty">${t('no_tasks_dash')}</div>`}</div></div>
    <div><h2 class="sec">${t('studying')} <small>${t('studying_sub')}</small></h2><div class="card">${prog.length?prog.map(li).join(''):`<div class="empty">${t('studying_empty')}</div>`}</div></div>
  </div>
  <div class="grid g2">
    <div><h2 class="sec">${t('starred')}</h2><div class="card">${star.length?star.map(li).join(''):`<div class="empty">${t('starred_empty')}</div>`}</div></div>
    <div><h2 class="sec">${t('last7')} <small>${t('study_time')}</small></h2><div class="card">${weekBars()}</div></div>
  </div>
  <h2 class="sec">${t('consistency')} <small>${t('weeks18')}</small></h2><div class="card">${heat(act)}</div>`;
}
function heat(a){
  const t0=today(),dow=(parseD(t0).getDay()+6)%7,start=addDays(t0,-(17*7+dow));let cells='';
  for(let i=0;i<18*7;i++){const d=addDays(start,i);if(d>t0){cells+='<i style="visibility:hidden"></i>';continue}
    const n=a[d]||0,l=n===0?0:n<=2?1:n<=5?2:n<=9?3:4;
    cells+=`<i class="${l?'l'+l:''} ${d===t0?'td':''}" title="${nice(d)}: ${n}"></i>`}
  return `<div class="heat">${cells}</div><div class="legend" style="margin-top:12px"><span>${t('less')}</span><span class="heat mini-heat"><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>${t('more')}</span></div>`;
}
function weekBars(){
  const t0=today(),days=[...Array(7)].map((_,i)=>addDays(t0,i-6)),mx=Math.max(60,...days.map(d=>D.log[d]||0)),tot=days.reduce((s,d)=>s+(D.log[d]||0),0);
  return `<div class="muted">${t('wk_total',hm(tot),hm(tot/7))}</div><div class="bars">${days.map(d=>{const m=D.log[d]||0;return `<div class="bar ${d===t0?'today':''}"><em>${m?hm(m):''}</em><i style="height:${Math.max(3,m/mx*78)}%"></i><span>${nice(d,{weekday:'short'})}</span></div>`}).join('')}</div>`;
}

/* ---------- Exam / Master view ---------- */
function masterPanel(){
  const r=readiness(),oc=overlapCounts(),tot=MASTER.subjects.reduce((s,x)=>s+x.t.length,0);
  const bars=Object.keys(COV).map(k=>{const x=exByKey(COV[k]),v=r[k],p=v.n?Math.round(v.d*100/v.n):0;
    return `<div class="rd"><div class="rdh"><b style="color:${x.color}">${esc(exName(x))}</b><span class="muted">${t('rd_line',v.d,v.n)}</span><span class="rdp">${p}%</span></div><div class="rbar"><i style="width:${v.n/tot*100}%;background:color-mix(in srgb,${x.color} 25%,transparent)"><b style="width:${v.n?v.d/v.n*100:0}%;background:${x.color}"></b></i></div></div>`}).join('');
  const ph=[['Foundation','ph1'],['General Studies','ph2'],['Chhattisgarh','ph3'],['Specific & Skills','ph4']].map(([g,k],i)=>`<div class="phase"><span class="pn">${i+1}</span><div><b>${gname(g)}</b><small>${t(k)}</small></div></div>`).join('');
  return `<div class="grid g2 mp"><div class="card"><h2 class="h2">${t('mp_ready')}</h2><p class="muted" style="margin:4px 0 14px">${t('mp_ready_sub')}</p>${bars}</div>
   <div class="card"><h2 class="h2">${t('mp_overlap')}</h2><div class="ov4"><div><b>${oc[4]}</b><small>${t('p4')}</small></div><div><b>${oc[3]}</b><small>${t('p3')}</small></div><div><b>${oc[2]}</b><small>${t('p2')}</small></div><div><b>${oc[1]}</b><small>${t('p1')}</small></div></div>
   <h2 class="h2" style="margin-top:18px">${t('mp_road')}</h2><div class="phases">${ph}</div></div></div>`;
}
function vExam(){
  const ex=exByKey(UI.ex),s=examStat(ex),g=UI.group[ex.key]||'All',dt=(D.exams[ex.key]||{}).date||'',m=!!ex.isMaster;
  const sw=ALL.map(e=>`<button class="xs ${e.key===ex.key?'on':''}" style="--c:${e.color}" data-act="nav" data-v="exam" data-ex="${e.key}">${ico(e.key,16)}${esc(exName(e))}</button>`).join('');
  const tabs=['All',...ex.groups].map(x=>`<button class="tab ${g===x?'on':''}" style="--c:${ex.color}" data-act="group" data-g="${esc(x)}">${esc(gname(x))}</button>`).join('');
  const flt=[['all','f_all'],['todo','f_todo'],['prog','f_prog'],['done','f_done'],['rev','f_rev']].map(([k,l])=>`<button class="f ${UI.filter===k?'on':''}" data-act="filter" data-f="${k}">${t(l)}</button>`).join('');
  const cv=m?`<div class="filters cvf"><span class="muted">${t('cov')}</span>${[['all',t('c_all')],['core','★ '+t('c_core')],['common',t('c_common')],...Object.keys(COV).map(k=>[k,exName(exByKey(COV[k]))])].map(([k,l])=>`<button class="f ${UI.cov===k?'on':''}" data-act="cov" data-c="${k}">${esc(l)}</button>`).join('')}</div>`:'';
  return `<div class="xsw">${sw}</div>
  <section class="hero exhero" style="--c:${ex.color}">${RAILS}
    <div class="ringwrap">${ring(s.pct,ex.color,132,12)}<div class="n big">${s.pct}<small>%</small></div></div>
    <div class="info"><h1>${esc(exName(ex))}</h1><div class="muted">${esc(exFull(ex))}</div>
      <div class="stack"><b class="a" style="width:${s.n?s.d/s.n*100:0}%"></b><b class="b" style="width:${s.n?s.p/s.n*100:0}%"></b></div>
      <div class="legend" style="margin:0"><span><i class="d" style="background:var(--done)"></i>${s.d} ${t('done')}</span><span><i class="d" style="background:var(--prog)"></i>${s.p} ${t('running')}</span><span><i class="d" style="background:var(--line2)"></i>${s.rest} ${t('left')}</span><span><i class="d" style="background:var(--rev)"></i>${s.r} ${t('to_rev')}</span></div>
      ${m?`<p class="muted" style="margin-top:12px;font-size:13.5px">${t('mp_note')}</p>`:`<div class="datebox"><label class="muted" for="examDate">${t('exam_date')}</label><input class="inp" type="date" id="examDate" value="${dt}" data-ex="${ex.key}">${countdown(ex)}</div>`}
    </div></section>
  ${m?masterPanel():''}
  <div class="toolbar"><div class="tabs">${tabs}</div><div class="search">${ico('search',17)}<input class="inp" id="q" placeholder="${esc(t('search_ph'))}" value="${esc(UI.q)}" autocomplete="off"></div></div>
  <div class="filters" style="margin-bottom:${m?8:16}px">${flt}</div>${cv}
  <div id="list"></div>`;
}
function covOK(e){const c=UI.cov;if(c==='all'||!e)return c==='all';if(c==='core')return e.length===4;if(c==='common')return e.length>=3;return e.includes(c)}
function renderList(){
  const ex=exByKey(UI.ex),g=UI.group[ex.key]||'All',q=UI.q.trim().toLowerCase(),f=UI.filter,L=$('#list');if(!L)return;
  let out='';const forced=q||f!=='all'||UI.cov!=='all';
  ex.subjects.filter(s=>g==='All'||s.g===g).forEach(sub=>{
    const all=topicsOf(ex,sub),st=stat(all);
    const vis=all.filter(x=>{const o=TS(x.id),s=o.s||0;
      if(q&&!(x.t.toLowerCase().includes(q)||(x.h||'').toLowerCase().includes(q)||(o.n||'').toLowerCase().includes(q)))return false;
      if(ex.isMaster&&UI.cov!=='all'&&!covOK(x.e))return false;
      if(f==='todo')return s===0;if(f==='prog')return s===1;if(f==='done')return s===2;if(f==='rev')return !!o.r;return true});
    if(forced&&!vis.length)return;
    const key=ex.key+'.'+sub.k,open=forced||UI.open[key];
    out+=`<section class="subj ${open?'open':''}" id="s-${key}"><button class="shead" data-act="sub" data-k="${key}" aria-expanded="${!!open}">
      <div class="nm"><b>${esc(subName(sub))}</b><small>${esc(gname(sub.g))} · ${t('n_done',st.d,st.n)}${st.p?` · ${st.p} ${t('running')}`:''}</small></div>
      <div class="mini"><b style="width:${st.n?st.d/st.n*100:0}%;background:var(--done)"></b><b style="width:${st.n?st.p/st.n*100:0}%;background:var(--prog)"></b></div>
      <div class="pct" style="color:${st.pct===100?'var(--done)':'var(--tx)'}">${st.pct}%</div>${ico('chev',18,'chev')}</button>
      <div class="sbody"><div class="sact"><button class="btn sm" data-act="markall" data-k="${key}" data-ex="${ex.key}" data-s="${sub.k}">${t('mark_all')}</button></div>
      ${vis.map(x=>topicRow(x)).join('')}
      <div class="addrow"><input class="inp" data-addtopic="${key}" placeholder="${esc(t('add_topic_ph'))}" autocomplete="off"></div></div></section>`;
  });
  L.innerHTML=out||`<div class="card empty">${t('no_match')}</div>`;
}
function topicRow(x){
  const o=TS(x.id),s=o.s||0,lbl=t(['st0','st1','st2'][s]);
  return `<div class="topic s${s}" id="t-${x.id}"><button class="chk" data-act="cycle" data-id="${x.id}" aria-label="${esc(tpc(x))} – ${lbl}" title="${lbl}">${ico('chk',15)}</button>
    <div class="tt">${esc(tpc(x))}${x.c?`<span class="cust">${t('custom')}</span>`:''} ${covChips(x.e)} ${s===1?`<span class="stlabel">${t('st1')}</span>`:''}${s===2&&o.d?`<small class="muted"> · ${nice(o.d,{day:'numeric',month:'short'})}</small>`:''}${revMeta(o)}</div>
    <div class="tools ${o.r||o.n||(o.nx&&o.nx<=today())?'keep':''}">
      ${(s===2&&o.nx&&o.nx<=today())?`<button class="btn sm" data-act="revised" data-id="${x.id}">${t('revised')}</button>`:''}
      <button class="ib rev ${o.r?'on':''}" data-act="rev" data-id="${x.id}" title="${t('tip_star')}" aria-label="${t('tip_star')}" aria-pressed="${!!o.r}">${ico('star',17)}</button>
      <button class="ib nt ${o.n?'on':''}" data-act="note" data-id="${x.id}" title="${t('tip_note')}" aria-label="${t('tip_note')}">${ico('note',17)}</button>
      <button class="ib" data-act="toPlan" data-id="${x.id}" title="${t('tip_plan')}" aria-label="${t('tip_plan')}">${ico('plus',17)}</button>
      ${x.c?`<button class="ib" data-act="delcustom" data-id="${x.id}" title="${t('tip_del')}" aria-label="${t('tip_del')}">${ico('trash',16)}</button>`:''}
    </div>
    ${UI.note[x.id]?`<div class="note"><textarea data-note="${x.id}" placeholder="${esc(t('note_ph'))}">${esc(o.n||'')}</textarea></div>`:''}</div>`;
}

/* ---------- Revision ---------- */
function revMeta(o){
  if(o.m)return ` <span class="stlabel ok">${t('mastered_l')}</span>`;
  if(!o.nx)return'';
  const late=diffDays(today(),o.nx);
  return late>=0?` <span class="stlabel late">${t('revise')}${late>0?' · '+t('late_d',late):' · '+t('today')}</span>`:` <small class="muted">· ${t('revise_on',nice(o.nx,{day:'numeric',month:'short'}))}</small>`;
}
function revRow(x,mode){
  const o=x.o||TS(x.id),step=(o.rc||0)+1,late=o.nx?diffDays(today(),o.nx):0;
  const sub=mode==='soon'?t('rev_step',step,REV_STEPS.length)+' · '+nice(o.nx,{weekday:'short',day:'numeric',month:'short'}):mode==='mastered'?t('rev_all',REV_STEPS.length):t('rev_step',step,REV_STEPS.length)+(late>0?' · '+t('overdue_d',late):' · '+t('due_today'));
  const acts=mode==='mastered'?'':mode==='soon'?`<button class="btn sm" data-act="revised" data-id="${x.id}">${t('revised_early')}</button>`:`<button class="btn sm" data-act="snooze" data-id="${x.id}">${t('tomorrow')}</button><button class="btn sm pri" data-act="revised" data-id="${x.id}">${t('revised')}</button>`;
  return `<div class="row"><span class="chip link" style="--c:${x.ex.color}" data-act="goTopic" data-id="${x.id}">${esc(exName(x.ex))}</span><div class="grow link" data-act="goTopic" data-id="${x.id}"><div>${esc(tpc(x))}</div><small>${esc(subName(x.sub))} · ${sub}</small></div><div class="chips nowrap">${acts}</div></div>`;
}
function vRev(){
  const r=revLists(),week=[...Array(7)].reduce((s,_,i)=>s+(D.revs[addDays(today(),-i)]||0),0);
  const groups={};r.soon.forEach(x=>(groups[x.o.nx]=groups[x.o.nx]||[]).push(x));
  const soonHtml=Object.keys(groups).sort().slice(0,10).map(d=>`<h3 class="dh muted">${nice(d,{weekday:'long',day:'numeric',month:'short'})} · ${groups[d].length}</h3>${groups[d].map(x=>revRow(x,'soon')).join('')}`).join('');
  return `<div class="pagehead"><div><h1>${t('nav_rev')}</h1><p>${t('rev_intro',REV_STEPS.join(', '))}</p></div><button class="btn" data-act="nav" data-v="set">${ico('bell',16)} ${t('rem_settings')}</button></div>
  <div class="stats"><div class="stat"><div><div class="k">${t('due_now')}</div><div class="v" style="color:${r.due.length?'var(--rev)':'inherit'}">${r.due.length}</div></div></div><div class="stat"><div><div class="k">${t('coming_up')}</div><div class="v">${r.soon.length}</div></div></div><div class="stat"><div><div class="k">${t('rev_week')}</div><div class="v">${week}</div></div></div><div class="stat"><div><div class="k">${t('mastered')}</div><div class="v">${r.mastered.length}</div></div></div></div>
  ${D.settings.autoRev?'':`<div class="banner"><div><b>${t('auto_off')}</b><br><span class="muted">${t('auto_off_sub')}</span></div><button class="btn pri" data-act="nav" data-v="set">${t('nav_set')}</button></div>`}
  <h2 class="sec">${t('due_now')} <small>${r.due.length}</small></h2><div class="card">${r.due.length?r.due.map(x=>revRow(x)).join(''):`<div class="empty">${t('rev_empty')}</div>`}</div>
  <h2 class="sec">${t('coming_up')} <small>${r.soon.length}</small></h2><div class="card">${r.soon.length?soonHtml:`<div class="empty">${t('rev_none_soon')}</div>`}</div>
  ${r.mastered.length?`<h2 class="sec">${t('mastered')} <small>${r.mastered.length}</small></h2><div class="card">${r.mastered.slice(0,10).map(x=>revRow(x,'mastered')).join('')}</div>`:''}`;
}

/* ---------- Planner ---------- */
function taskRow(x,date,mini){
  const ref=x.ref&&INDEX[x.ref];
  return `<div class="task ${x.done?'done':''}"><button class="chk sq" data-act="task" data-id="${x.id}" data-d="${date}" aria-label="${t('toggle_task')}">${ico('chk',15)}</button>
   <div class="tx"><div>${esc(ref?tpc(ref):x.text)}</div>${ref?`<small>${esc(exName(ref.ex))} · ${esc(subName(ref.sub))}</small>`:''}</div>
   ${(!mini&&ref&&TS(x.ref).s!==2)?`<button class="btn sm" data-act="refdone" data-id="${x.ref}">${t('mark_topic_done')}</button>`:''}
   ${mini?'':`<button class="ib" data-act="deltask" data-id="${x.id}" data-d="${date}" aria-label="${t('delete')}">${ico('trash',16)}</button>`}</div>`;
}
const TKEY='pariksha-path.timer';
function timerGet(){try{return JSON.parse(localStorage.getItem(TKEY)||'null')}catch(e){return null}}
function mmss(ms){const s=Math.max(0,Math.ceil(ms/1000));return pad(Math.floor(s/60))+':'+pad(s%60)}
function timerHtml(){
  const tm=timerGet(),f=D.settings.focus||25;
  if(tm){const pc=Math.min(100,100-(tm.end-Date.now())/(tm.mins*600));return `<div class="timer"><div class="ringwrap">${ring(pc,'var(--primary)',170,12)}<div class="n tnum" id="timerTxt">${mmss(tm.end-Date.now())}</div></div><div class="muted" style="margin-top:10px">${t('timer_running',tm.mins)}</div><div class="chips" style="margin-top:14px"><button class="btn dng" data-act="timerStop">${t('timer_stop')}</button><button class="btn" data-act="timerDone">${t('timer_finish')}</button></div></div>`}
  return `<div class="timer"><div class="ringwrap">${ring(0,'var(--primary)',170,12)}<div class="n tnum">${pad(f)}:00</div></div><div class="chips" style="margin-top:14px">${[25,45,60,90].map(m=>`<button class="btn sm ${f===m?'pri':''}" data-act="timerLen" data-m="${m}">${m}${t('u_m')}</button>`).join('')}</div><div class="chips" style="margin-top:14px"><button class="btn pri" data-act="timerStart">${t('timer_start')}</button></div><p class="muted" style="font-size:13px;margin-top:10px">${t('timer_note')}</p></div>`;
}
function vPlan(){
  const d=UI.date,t0=today(),list=planOf(d),done=list.filter(x=>x.done).length,m=D.log[d]||0,goal=D.settings.goal||240;
  let carry=0;Object.entries(D.plans).forEach(([k,l])=>{if(k<t0)carry+=l.filter(x=>!x.done&&!x.del).length});
  return `<div class="pagehead"><div><h1>${t('nav_plan')}</h1><p>${d===t0?t('today')+' · ':''}${nice(d,{weekday:'long',day:'numeric',month:'long'})}</p></div>
   <div class="datenav"><button class="ib bd" data-act="day" data-n="-1" aria-label="${t('prev')}">${ico('left',18)}</button><input class="inp" type="date" id="planDate" value="${d}" style="width:auto"><button class="ib bd" data-act="day" data-n="1" aria-label="${t('next')}">${ico('right',18)}</button>${d!==t0?`<button class="btn sm" data-act="day" data-n="0">${t('today')}</button>`:''}</div></div>
   ${carry&&d===t0?`<div class="banner"><div><b>${t('carry_title',carry)}</b><br><span class="muted">${t('carry_sub')}</span></div><button class="btn pri" data-act="carry">${t('carry_btn')}</button></div>`:''}
   <div class="grid g2">
    <div class="card"><h2 class="h2">${t('tasks')} <small class="muted">${t('n_done',done,list.length)}</small></h2>
      ${list.length?list.map(x=>taskRow(x,d)).join(''):`<div class="empty">${t('no_tasks')}</div>`}
      <div class="addrow" style="padding:14px 0 0"><input class="inp" id="newTask" placeholder="${esc(t('task_ph'))}" autocomplete="off"><button class="btn pri" data-act="addTask">${t('add')}</button></div></div>
    <div class="card"><h2 class="h2">${t('focus')} <small class="muted">${t('focus_sub')}</small></h2>${timerHtml()}</div>
    <div class="card"><h2 class="h2">${t('study_time')} <small class="muted">${t('goal')} ${hm(goal)}</small></h2>
      <div class="bigv">${hm(m)}</div>
      <div class="goalbar"><b style="width:${Math.min(100,m/goal*100)}%"></b></div><div class="muted" style="font-size:13px">${m>=goal?t('goal_hit'):t('goal_left',hm(Math.max(0,goal-m)))}</div>
      <div class="chips" style="margin-top:16px">${[15,30,60,120].map(x=>`<button class="btn sm" data-act="addmin" data-m="${x}">+${x>=60?x/60+t('u_h'):x+t('u_m')}</button>`).join('')}<button class="btn sm" data-act="addmin" data-m="-15">−15${t('u_m')}</button></div>
      <div class="datebox" style="margin-top:16px"><label class="muted" for="goalIn">${t('goal_min')}</label><input class="inp" type="number" min="30" max="1080" step="15" id="goalIn" value="${goal}" style="width:100px"></div></div>
    <div class="card"><h2 class="h2">${t('last7')}</h2>${weekBars()}</div>
   </div>`;
}

/* ---------- Settings ---------- */
function vSet(){
  const json=JSON.stringify(D),kb=(json.length/1024).toFixed(1),sn=snaps(),all=overall(),light=D.settings.theme==='light';
  return `<div class="pagehead"><div><h1>${t('nav_set')}</h1><p>${t('set_sub')}</p></div></div>
  ${(!storageOK||lastErr)?`<div class="warn">${esc(t(lastErr||'err_storage'))}</div>`:''}
  <div class="card synccard" id="syncCard" style="margin-bottom:16px">${syncCardInner()}</div>
  <div class="grid g2">
   <div class="card"><h2 class="h2">${t('your_data')}</h2>
     <div class="kv"><span class="muted">${t('topics_done')}</span><b>${all.d} / ${all.n}</b></div>
     <div class="kv"><span class="muted">${t('data_size')}</span><b>${kb} KB</b></div>
     <div class="kv"><span class="muted">${t('last_export')}</span><b>${D.settings.lastExport?nice(D.settings.lastExport,{day:'numeric',month:'short',year:'numeric'}):t('never')}</b></div>
     <div class="kv"><span class="muted">${t('started')}</span><b>${nice(D.settings.created||today(),{day:'numeric',month:'short',year:'numeric'})}</b></div>
     <div class="kv"><span class="muted">${t('protected')}</span><b id="persist">…</b></div>
     <div class="chips" style="margin-top:16px"><button class="btn pri" data-act="export">${ico('download',16)} ${t('export_btn')}</button><button class="btn" data-act="import">${t('import_btn')}</button></div>
     <p class="muted" style="font-size:13px;margin-top:14px">${t('import_note')}</p></div>
   <div class="card"><h2 class="h2">${t('appearance')}</h2>
     <div class="kv"><span>${t('language')}</span><div class="seg"><button class="${LANG==='en'?'on':''}" data-act="lang" data-l="en">English</button><button class="${LANG==='hi'?'on':''}" data-act="lang" data-l="hi">हिन्दी</button></div></div>
     <div class="kv"><span>${t('theme')}</span><div class="seg"><button class="${!light?'on':''}" data-act="theme" data-t="dark">${t('dark')}</button><button class="${light?'on':''}" data-act="theme" data-t="light">${t('light')}</button></div></div>
     <div class="kv"><span>${t('install_title')}<br><small class="muted">${t('install_sub')}</small></span>${installBtn(true)||`<span class="muted">${isStandalone()?t('installed'):t('install_na')}</span>`}</div>
     <h2 class="h2" style="margin-top:20px">${t('snapshots')} <small class="muted">${sn.length}</small></h2>
     ${sn.length?sn.slice(0,6).map(k=>`<div class="row"><div class="grow">${nice(k.slice(SNAP.length),{weekday:'short',day:'numeric',month:'short'})}<br><small>${t('snap_note')}</small></div><button class="btn sm" data-act="restore" data-k="${k}">${t('restore')}</button></div>`).join(''):`<div class="empty">${t('snap_empty')}</div>`}
   </div>
  </div>
  <h2 class="sec">${t('rem_title')}</h2>
  <div class="card"><div class="kv"><span>${t('auto_rev')}<br><small class="muted">${t('auto_rev_sub',REV_STEPS.join(', '))}</small></span><button class="btn sm ${D.settings.autoRev?'pri':''}" data-act="autoRev">${D.settings.autoRev?t('on'):t('off')}</button></div>
   <div class="kv"><span>${t('daily_rem')}<br><small class="muted">${notifState()}</small></span><button class="btn sm ${D.settings.remind.on?'pri':''}" data-act="remindToggle">${D.settings.remind.on?t('on'):t('off')}</button></div>
   <div class="kv"><span>${t('rem_time')}</span><input class="inp" type="time" id="remindTime" value="${D.settings.remind.time}" style="width:auto;padding:6px 10px"></div>
   <div class="chips" style="margin-top:14px"><button class="btn" data-act="testNotif">${t('test_notif')}</button></div>
   <p class="muted" style="font-size:13px;margin-top:12px">${t('rem_note')}</p></div>
  <h2 class="sec">${t('good_to_know')}</h2>
  <div class="card muted know">${t('know_1')}<br>${t('know_2')}<br>${t('know_3')}<br>${t('know_4')}</div>
  <h2 class="sec">${t('danger')}</h2>
  <div class="card"><div class="chips"><button class="btn dng" data-act="reset">${t('erase_btn')}</button></div><p class="muted" style="font-size:13px;margin-top:10px">${t('erase_note')}</p></div>`;
}
