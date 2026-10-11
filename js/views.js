/* ============================== UI bits =========================== */
let toastT;
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2600)}
function ask({title,body='',ok='Confirm',danger=false,input=null,placeholder=''}){
  return new Promise(res=>{
    const r=$('#modalRoot');
    r.innerHTML=`<div class="ov"><div class="modal" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${body}</p>${input!==null?`<input class="inp" id="mi" placeholder="${esc(placeholder)}" autocomplete="off">`:''}<div class="acts"><button class="btn" id="mc">Cancel</button><button class="btn ${danger?'dng':'pri'}" id="mo">${esc(ok)}</button></div></div></div>`;
    const done=v=>{r.innerHTML='';res(v)};
    $('#mc').onclick=()=>done(false);
    $('#mo').onclick=()=>done(input!==null?($('#mi').value||''):true);
    r.querySelector('.ov').addEventListener('click',e=>{if(e.target.classList.contains('ov'))done(false)});
    const f=$('#mi')||$('#mo');f.focus();
    r.onkeydown=e=>{if(e.key==='Escape')done(false);if(e.key==='Enter'&&input!==null&&$('#mi'))done($('#mi').value)};
  });
}
function ring(p,c,size=92,sw=9){
  const r=(size-sw)/2,C=2*Math.PI*r,h=size/2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="var(--line2)" stroke-width="${sw}"/><circle cx="${h}" cy="${h}" r="${r}" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-dasharray="${C*p/100} ${C}" transform="rotate(-90 ${h} ${h})"/></svg>`;
}
const exByKey=k=>EXAMS.find(e=>e.key===k);
function countdown(ex){
  const d=(D.exams[ex.key]||{}).date;if(!d)return'';
  const n=diffDays(d,today());
  const txt=n>0?`${n} day${n>1?'s':''} left`:n===0?'Exam today':'Exam date passed';
  return `<span class="chip" style="--c:${ex.color}">${txt} · ${nice(d,{day:'numeric',month:'short',year:'numeric'})}</span>`;
}

/* ============================== render ============================ */
function renderNav(){
  const st=overall(),due=dueCount();
  setBadge(due);
  const items=[{v:'dash',l:'Dashboard',s:'Overview & streak',d:'◎'},{gap:1}]
    .concat(EXAMS.map(e=>({v:'exam',ex:e.key,l:e.name,s:e.full,c:e.color,d:examStat(e).pct+'%'})))
    .concat([{gap:1},{v:'rev',l:'Revision',s:due?due+' due now':'Spaced reminders',d:due||'↻',c:due?'var(--rev)':null},{v:'plan',l:'Daily Planner',s:'Tasks, focus timer',d:'✓'},{v:'set',l:'Backup & Settings',s:'Export · Import',d:'⚙'}]);
  $('#nav').innerHTML=items.map(i=>{
    if(i.gap)return'<div class="gap"></div>';
    const on=UI.view===i.v&&(i.v!=='exam'||UI.ex===i.ex);
    return `<button class="stop ${on?'on':''}" style="--c:${i.c||'var(--primary)'}" data-act="nav" data-v="${i.v}" ${i.ex?`data-ex="${i.ex}"`:''} ${on?'aria-current="page"':''}><span class="dot">${i.d}</span><span class="l">${esc(i.l)}<small>${esc(i.s)}</small></span></button>`;
  }).join('');
  $('#sidefoot').innerHTML=`<b>${st.d} of ${st.n} topics done</b>Saved automatically in this browser. Export a backup now and then.`;
}
function render(){
  renderNav();
  const m=$('#main');
  m.innerHTML=UI.view==='dash'?vDash():UI.view==='exam'?vExam():UI.view==='plan'?vPlan():UI.view==='rev'?vRev():vSet();
  if(UI.view==='exam')renderList();
}
function go(v,ex){UI.view=v;if(ex)UI.ex=ex;UI.q='';UI.filter='all';render();window.scrollTo({top:0,behavior:'smooth'})}

/* ---------- Dashboard ---------- */
function vDash(){
  const act=activity(),sk=streak(act),t0=today(),plan=D.plans[t0]||[],doneT=plan.filter(t=>t.done).length,mins=D.log[t0]||0,goal=D.settings.goal||240,all=overall();
  const need=!D.settings.lastExport||diffDays(t0,D.settings.lastExport)>=7;
  const banner=(all.d+all.p>0&&need)?`<div class="banner"><div><b>Take a backup copy</b><br><span class="muted">${D.settings.lastExport?'Last export was '+diffDays(t0,D.settings.lastExport)+' days ago.':'You have not exported your progress yet.'} One file keeps your data safe even if browser data is cleared.</span></div><button class="btn pri" data-act="export">Export backup</button></div>`:'';
  const warn=(!storageOK||lastErr)?`<div class="warn">${esc(lastErr||'Browser storage is blocked – progress will not be saved. Open the site in a normal (non-private) window.')}</div>`:'';
  const cards=EXAMS.map(ex=>{const s=examStat(ex);return `<button class="card ecard" style="--c:${ex.color}" data-act="nav" data-v="exam" data-ex="${ex.key}">
    <div class="top"><div><h3>${ex.name}</h3><div class="full">${esc(ex.full)}</div></div>
    <div class="ringwrap">${ring(s.pct,ex.color)}<div class="n">${s.pct}<small>%</small></div></div></div>
    <div class="legend"><span><i style="background:var(--done)"></i>${s.d} done</span><span><i style="background:var(--prog)"></i>${s.p} running</span><span><i style="background:var(--line2)"></i>${s.rest} left</span></div>
    <div class="countdown">${countdown(ex)||'<span class="muted" style="font-size:12.5px">Set exam date inside →</span>'}</div></button>`}).join('');
  const prog=Object.values(INDEX).filter(x=>TS(x.id).s===1).slice(0,7);
  const rev=Object.values(INDEX).filter(x=>TS(x.id).r).slice(0,7);
  const li=x=>`<div class="row link" data-act="goTopic" data-id="${x.id}"><span class="chip" style="--c:${x.ex.color}">${x.ex.name}</span><div class="grow"><div>${esc(x.t)}</div><small>${esc(x.sub.n)}</small></div></div>`;
  const planHtml=plan.length?plan.slice(0,6).map(t=>taskRow(t,t0,true)).join(''):'<div class="empty">No tasks for today. Add one in the planner.</div>';
  const rl=revLists();
  const revCard=rl.due.length?`<div class="card revcard"><div class="pagehead" style="margin-bottom:6px"><div><h2 style="font-size:20px">Revise today <span class="chip" style="--c:var(--rev)">${rl.due.length} due</span></h2><p class="muted" style="margin-top:2px">Quick recall now keeps these topics from fading.</p></div><button class="btn pri" data-act="nav" data-v="rev">Open revision</button></div>${rl.due.slice(0,4).map(x=>revRow(x)).join('')}</div>`:'';
  return `<div class="pagehead"><div><h1>${greet()}</h1><p>${nice(t0,{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</p></div><button class="btn pri" data-act="nav" data-v="plan">Open today’s plan</button></div>
  ${warn}${banner}${revCard}
  <div class="stats">
    <div class="stat"><div class="k">Study streak</div><div class="v">${sk} <small>day${sk===1?'':'s'}</small></div></div>
    <div class="stat"><div class="k">Studied today</div><div class="v">${hm(mins)} <small>/ ${hm(goal)}</small></div></div>
    <div class="stat"><div class="k">Tasks today</div><div class="v">${doneT} <small>/ ${plan.length}</small></div></div>
    <div class="stat"><div class="k">Revision due</div><div class="v" style="color:${rl.due.length?'var(--rev)':'inherit'}">${rl.due.length} <small>${rl.soon.length} upcoming</small></div></div>
    <div class="stat"><div class="k">Topics completed</div><div class="v">${all.d} <small>/ ${all.n}</small></div></div>
  </div>
  <div class="grid g4">${cards}</div>
  <div class="grid g2">
    <div><h2 class="sec">Today’s plan <small>${doneT}/${plan.length} done</small></h2><div class="card">${planHtml}</div></div>
    <div><h2 class="sec">Currently studying <small>marked “in progress”</small></h2><div class="card">${prog.length?prog.map(li).join(''):'<div class="empty">Tap the circle next to a topic once to mark it “in progress”.</div>'}</div></div>
  </div>
  <div class="grid g2">
    <div><h2 class="sec">Revision list <small>starred topics</small></h2><div class="card">${rev.length?rev.map(li).join(''):'<div class="empty">Star a topic to add it here for revision.</div>'}</div></div>
    <div><h2 class="sec">Last 7 days <small>study time</small></h2><div class="card">${weekBars()}</div></div>
  </div>
  <h2 class="sec">Consistency <small>last 18 weeks</small></h2><div class="card">${heat(act)}</div>`;
}
function greet(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function heat(a){
  const t0=today(),dow=(parseD(t0).getDay()+6)%7;let start=addDays(t0,-(17*7+dow)),cells='';
  for(let i=0;i<18*7;i++){const d=addDays(start,i);if(d>t0){cells+='<i style="visibility:hidden"></i>';continue}
    const n=a[d]||0,l=n===0?0:n<=2?1:n<=5?2:n<=9?3:4;
    cells+=`<i class="${l?'l'+l:''} ${d===t0?'td':''}" title="${nice(d)}: ${n} activit${n===1?'y':'ies'}"></i>`}
  return `<div class="heat">${cells}</div><div class="legend" style="margin-top:12px"><span>Less</span><span class="heat" style="display:inline-grid;grid-template-rows:none;grid-auto-flow:column;padding:0"><i></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>More</span></div>`;
}
function weekBars(){
  const t0=today(),days=[...Array(7)].map((_,i)=>addDays(t0,i-6)),mx=Math.max(60,...days.map(d=>D.log[d]||0)),tot=days.reduce((s,d)=>s+(D.log[d]||0),0);
  return `<div class="muted">Total ${hm(tot)} · avg ${hm(tot/7)} per day</div><div class="bars">${days.map(d=>{const m=D.log[d]||0;return `<div class="bar ${d===t0?'today':''}"><em>${m?hm(m):''}</em><i style="height:${Math.max(3,m/mx*78)}%"></i><span>${nice(d,{weekday:'short'})}</span></div>`}).join('')}</div>`;
}

/* ---------- Exam view ---------- */
function vExam(){
  const ex=exByKey(UI.ex),s=examStat(ex),g=UI.group[ex.key]||'All',dt=(D.exams[ex.key]||{}).date||'';
  const tabs=['All',...ex.groups].map(x=>`<button class="tab ${g===x?'on':''}" style="--c:${ex.color}" data-act="group" data-g="${x}">${x}</button>`).join('');
  const flt=[['all','All'],['todo','Not started'],['prog','In progress'],['done','Done'],['rev','★ Revise']].map(([k,l])=>`<button class="f ${UI.filter===k?'on':''}" data-act="filter" data-f="${k}">${l}</button>`).join('');
  return `<div class="card hero" style="--c:${ex.color}">
    <div class="ringwrap">${ring(s.pct,ex.color,132,12)}<div class="n" style="font-size:30px">${s.pct}<small>%</small></div></div>
    <div class="info"><h1>${ex.name}</h1><div class="muted">${esc(ex.full)}</div>
      <div class="stack"><b class="a" style="width:${s.n?s.d/s.n*100:0}%"></b><b class="b" style="width:${s.n?s.p/s.n*100:0}%"></b></div>
      <div class="legend" style="margin-top:0"><span><i style="background:var(--done)"></i>${s.d} done</span><span><i style="background:var(--prog)"></i>${s.p} in progress</span><span><i style="background:var(--line2)"></i>${s.rest} remaining</span><span><i style="background:var(--rev)"></i>${s.r} to revise</span></div>
      <div class="datebox"><label class="muted" for="examDate">Exam date</label><input class="inp" type="date" id="examDate" value="${dt}" data-ex="${ex.key}">${countdown(ex)}</div>
    </div></div>
  <div class="toolbar"><div class="tabs">${tabs}</div><div class="search">${I.search}<input class="inp" id="q" placeholder="Search topics and notes…" value="${esc(UI.q)}" autocomplete="off"></div></div>
  <div class="filters" style="margin-bottom:16px">${flt}</div>
  <div id="list"></div>`;
}
function renderList(){
  const ex=exByKey(UI.ex),g=UI.group[ex.key]||'All',q=UI.q.trim().toLowerCase(),f=UI.filter,L=$('#list');if(!L)return;
  let out='';const forced=q||f!=='all';
  ex.subjects.filter(s=>g==='All'||s.g===g).forEach(sub=>{
    const all=topicsOf(ex,sub),st=stat(all);
    const vis=all.filter(t=>{const o=TS(t.id),s=o.s||0;
      if(q&&!(t.t.toLowerCase().includes(q)||(o.n||'').toLowerCase().includes(q)))return false;
      if(f==='todo')return s===0;if(f==='prog')return s===1;if(f==='done')return s===2;if(f==='rev')return !!o.r;return true});
    if(forced&&!vis.length)return;
    const key=ex.key+'.'+sub.k,open=forced||UI.open[key];
    out+=`<section class="subj ${open?'open':''}" id="s-${key}"><button class="shead" data-act="sub" data-k="${key}" aria-expanded="${!!open}">
      <div class="nm"><b>${esc(sub.n)}</b><small>${ex.groups.length>1?esc(sub.g)+' · ':''}${st.d}/${st.n} done${st.p?` · ${st.p} in progress`:''}</small></div>
      <div class="mini"><b style="width:${st.n?st.d/st.n*100:0}%;background:var(--done)"></b><b style="width:${st.n?st.p/st.n*100:0}%;background:var(--prog)"></b></div>
      <div class="pct" style="color:${st.pct===100?'var(--done)':'var(--tx)'}">${st.pct}%</div>${I.chev}</button>
      <div class="sbody"><div class="sact"><button class="btn sm" data-act="markall" data-k="${key}" data-ex="${ex.key}" data-s="${sub.k}">Mark all done</button></div>
      ${vis.map(t=>topicRow(t,ex)).join('')}
      <div class="addrow"><input class="inp" data-addtopic="${key}" placeholder="Add your own topic and press Enter" autocomplete="off"></div></div></section>`;
  });
  L.innerHTML=out||`<div class="card empty">Nothing matches. Try another search or filter.</div>`;
}
function topicRow(t){
  const o=TS(t.id),s=o.s||0,lbl=['Not started','In progress','Done'][s];
  const noteOpen=UI.note[t.id];
  return `<div class="topic s${s}" id="t-${t.id}"><button class="chk" data-act="cycle" data-id="${t.id}" aria-label="${esc(t.t)} – ${lbl}. Click to change status." title="${lbl} — click to change">${I.chk}</button>
    <div class="tt">${esc(t.t)}${t.c?'<span class="cust">custom</span>':''} ${s===1?'<span class="stlabel">in progress</span>':''}${s===2&&o.d?`<small class="muted"> · ${nice(o.d,{day:'numeric',month:'short'})}</small>`:''}${revMeta(o)}</div>
    <div class="tools ${o.r||o.n||(o.nx&&o.nx<=today())?'keep':''}">
      ${(s===2&&o.nx&&o.nx<=today())?`<button class="btn sm" data-act="revised" data-id="${t.id}" title="I revised this today">Revised ✓</button>`:''}
      <button class="ib rev ${o.r?'on':''}" data-act="rev" data-id="${t.id}" title="Mark for revision" aria-label="Toggle revision star" aria-pressed="${!!o.r}">${I.star}</button>
      <button class="ib nt ${o.n?'on':''}" data-act="note" data-id="${t.id}" title="Note" aria-label="Toggle note">${I.note}</button>
      <button class="ib" data-act="toPlan" data-id="${t.id}" title="Add to today’s plan" aria-label="Add to today’s plan">${I.plus}</button>
      ${t.c?`<button class="ib" data-act="delcustom" data-id="${t.id}" title="Remove custom topic" aria-label="Remove custom topic">${I.trash}</button>`:''}
    </div>
    ${(noteOpen||false)?`<div class="note"><textarea data-note="${t.id}" placeholder="Sources, formulas, weak points…">${esc(o.n||'')}</textarea></div>`:''}</div>`;
}

/* ---------- Revision ---------- */
function revMeta(o){
  if(o.m)return ' <span class="stlabel" style="background:color-mix(in srgb,var(--done) 18%,transparent);color:var(--done)">mastered</span>';
  if(!o.nx)return '';
  const late=diffDays(today(),o.nx);
  return late>=0?` <span class="stlabel" style="background:color-mix(in srgb,var(--rev) 18%,transparent);color:var(--rev)">revise${late>0?' · '+late+'d late':' today'}</span>`:` <small class="muted">· revise ${nice(o.nx,{day:'numeric',month:'short'})}</small>`;
}
function revRow(x,mode){
  const o=x.o||TS(x.id),step=(o.rc||0)+1,late=o.nx?diffDays(today(),o.nx):0;
  const sub=mode==='soon'?`Revision ${step} of ${REV_STEPS.length} · ${nice(o.nx,{weekday:'short',day:'numeric',month:'short'})}`:mode==='mastered'?`Completed all ${REV_STEPS.length} revisions`:`Revision ${step} of ${REV_STEPS.length}${late>0?' · '+late+' day'+(late>1?'s':'')+' overdue':' · due today'}`;
  const acts=mode==='mastered'?'':mode==='soon'?`<button class="btn sm" data-act="revised" data-id="${x.id}">Revised early</button>`:`<button class="btn sm" data-act="snooze" data-id="${x.id}" title="Remind me tomorrow">Tomorrow</button><button class="btn sm pri" data-act="revised" data-id="${x.id}">Revised ✓</button>`;
  return `<div class="row"><span class="chip link" style="--c:${x.ex.color}" data-act="goTopic" data-id="${x.id}">${x.ex.name}</span><div class="grow link" data-act="goTopic" data-id="${x.id}"><div>${esc(x.t)}</div><small>${esc(x.sub.n)} · ${sub}</small></div><div class="chips" style="flex-wrap:nowrap">${acts}</div></div>`;
}
function vRev(){
  const r=revLists(),week=[...Array(7)].reduce((s,_,i)=>s+(D.revs[addDays(today(),-i)]||0),0);
  const groups={};r.soon.forEach(x=>(groups[x.o.nx]=groups[x.o.nx]||[]).push(x));
  const soonHtml=Object.keys(groups).sort().slice(0,10).map(d=>`<h3 style="font-size:14px;margin:14px 0 2px" class="muted">${nice(d,{weekday:'long',day:'numeric',month:'short'})} · ${groups[d].length}</h3>${groups[d].map(x=>revRow(x,'soon')).join('')}`).join('');
  const star=Object.values(INDEX).filter(x=>TS(x.id).r);
  return `<div class="pagehead"><div><h1>Revision</h1><p>Every completed topic returns after ${REV_STEPS.join(', ')} days. Mark it revised and the next date is set for you.</p></div><button class="btn" data-act="nav" data-v="set">Reminder settings</button></div>
  <div class="stats"><div class="stat"><div class="k">Due now</div><div class="v" style="color:${r.due.length?'var(--rev)':'inherit'}">${r.due.length}</div></div><div class="stat"><div class="k">Coming up</div><div class="v">${r.soon.length}</div></div><div class="stat"><div class="k">Revised this week</div><div class="v">${week}</div></div><div class="stat"><div class="k">Mastered</div><div class="v">${r.mastered.length}</div></div></div>
  ${D.settings.autoRev?'':'<div class="banner"><div><b>Auto-schedule is off</b><br><span class="muted">Completed topics will not get revision dates. Turn it on in Settings.</span></div><button class="btn pri" data-act="nav" data-v="set">Open settings</button></div>'}
  <h2 class="sec">Due now <small>${r.due.length}</small></h2><div class="card">${r.due.length?r.due.map(x=>revRow(x)).join(''):'<div class="empty">Nothing due. Finish a topic and its first revision appears tomorrow.</div>'}</div>
  <h2 class="sec">Coming up <small>${r.soon.length}</small></h2><div class="card">${r.soon.length?soonHtml:'<div class="empty">No upcoming revisions yet.</div>'}</div>
  ${star.length?`<h2 class="sec">Starred for extra revision <small>${star.length}</small></h2><div class="card">${star.slice(0,12).map(x=>`<div class="row link" data-act="goTopic" data-id="${x.id}"><span class="chip" style="--c:${x.ex.color}">${x.ex.name}</span><div class="grow"><div>${esc(x.t)}</div><small>${esc(x.sub.n)}</small></div></div>`).join('')}</div>`:''}
  ${r.mastered.length?`<h2 class="sec">Mastered <small>${r.mastered.length}</small></h2><div class="card">${r.mastered.slice(0,10).map(x=>revRow(x,'mastered')).join('')}</div>`:''}`;
}

/* ---------- Planner ---------- */
function taskRow(t,date,mini){
  const ref=t.ref&&INDEX[t.ref];
  return `<div class="task ${t.done?'done':''}"><button class="chk" data-act="task" data-id="${t.id}" data-d="${date}" aria-label="Toggle task">${I.chk}</button>
   <div class="tx"><div>${esc(t.text)}</div>${ref?`<small>${esc(ref.ex.name)} · ${esc(ref.sub.n)}</small>`:''}</div>
   ${(!mini&&ref&&TS(t.ref).s!==2)?`<button class="btn sm" data-act="refdone" data-id="${t.ref}">Mark topic done</button>`:''}
   ${mini?'':`<button class="ib" data-act="deltask" data-id="${t.id}" data-d="${date}" aria-label="Delete task">${I.trash}</button>`}</div>`;
}
function vPlan(){
  const d=UI.date,t0=today(),list=D.plans[d]||[],done=list.filter(t=>t.done).length,m=D.log[d]||0,goal=D.settings.goal||240;
  let carry=0;Object.entries(D.plans).forEach(([k,l])=>{if(k<t0)carry+=l.filter(t=>!t.done).length});
  return `<div class="pagehead"><div><h1>Daily Planner</h1><p>${d===t0?'Today · ':''}${nice(d,{weekday:'long',day:'numeric',month:'long'})}</p></div>
   <div class="datenav"><button class="ib" data-act="day" data-n="-1" aria-label="Previous day">${I.left}</button><input class="inp" type="date" id="planDate" value="${d}" style="width:auto"><button class="ib" data-act="day" data-n="1" aria-label="Next day">${I.right}</button>${d!==t0?'<button class="btn sm" data-act="day" data-n="0">Today</button>':''}</div></div>
   ${carry&&d===t0?`<div class="banner"><div><b>${carry} unfinished task${carry>1?'s':''} from earlier days</b><br><span class="muted">Move them to today so nothing is forgotten.</span></div><button class="btn pri" data-act="carry">Move to today</button></div>`:''}
   <div class="grid g2">
    <div class="card"><h2 class="sec" style="margin-top:0">Tasks <small>${done}/${list.length} done</small></h2>
      ${list.length?list.map(t=>taskRow(t,d)).join(''):'<div class="empty">Nothing planned. Add a task below, or tap + next to any syllabus topic.</div>'}
      <div class="addrow" style="padding:14px 0 0"><input class="inp" id="newTask" placeholder="e.g. Chhattisgarh rivers – 2 hours" autocomplete="off"><button class="btn pri" data-act="addTask">Add</button></div></div>
    <div class="card"><h2 class="sec" style="margin-top:0">Focus timer <small>adds to study time</small></h2>${timerHtml()}</div>
    <div class="card"><h2 class="sec" style="margin-top:0">Study time <small>goal ${hm(goal)}</small></h2>
      <div class="stat" style="border:0;padding:0;background:none"><div class="v">${hm(m)}</div></div>
      <div class="goalbar"><b style="width:${Math.min(100,m/goal*100)}%"></b></div><div class="muted" style="font-size:13px">${m>=goal?'Goal reached. Well done.':hm(Math.max(0,goal-m))+' to reach today’s goal'}</div>
      <div class="chips" style="margin-top:16px">${[15,30,60,120].map(x=>`<button class="btn sm" data-act="addmin" data-m="${x}">+${x>=60?x/60+'h':x+'m'}</button>`).join('')}<button class="btn sm" data-act="addmin" data-m="-15">−15m</button></div>
      <div class="datebox" style="margin-top:16px"><label class="muted" for="goalIn">Daily goal (minutes)</label><input class="inp" type="number" min="30" max="1080" step="15" id="goalIn" value="${goal}" style="width:100px"></div>
      <h2 class="sec">Last 7 days</h2>${weekBars()}</div>
   </div>`;
}

const TKEY='pariksha-path.timer';
function timerGet(){try{return JSON.parse(localStorage.getItem(TKEY)||'null')}catch(e){return null}}
function mmss(ms){const s=Math.max(0,Math.ceil(ms/1000));return pad(Math.floor(s/60))+':'+pad(s%60)}
function timerHtml(){
  const t=timerGet();
  if(t){return `<div class="timer"><div class="tnum" id="timerTxt">${mmss(t.end-Date.now())}</div><div class="muted">${t.mins} minute session running${t.label?' · '+esc(t.label):''}</div><div class="chips" style="margin-top:14px"><button class="btn dng" data-act="timerStop">Stop & discard</button><button class="btn" data-act="timerDone">Finish now & log time</button></div></div>`}
  const f=D.settings.focus||25;
  return `<div class="timer"><div class="tnum">${pad(f)}:00</div><div class="chips">${[25,45,60,90].map(m=>`<button class="btn sm ${f===m?'pri':''}" data-act="timerLen" data-m="${m}">${m}m</button>`).join('')}</div><div class="chips" style="margin-top:14px"><button class="btn pri" data-act="timerStart">Start focus session</button></div><p class="muted" style="font-size:13px;margin-top:10px">Finished sessions are added to today’s study time automatically.</p></div>`;
}

/* ---------- Settings ---------- */
function vSet(){
  const json=JSON.stringify(D),kb=(json.length/1024).toFixed(1),sn=snaps(),all=overall();
  const light=D.settings.theme==='light';
  return `<div class="pagehead"><div><h1>Backup & Settings</h1><p>Your progress lives in this browser. Keep a backup file for safety.</p></div></div>
  ${(!storageOK||lastErr)?`<div class="warn">${esc(lastErr||'Browser storage is blocked.')}</div>`:''}
  <div class="grid g2">
   <div class="card"><h2 class="sec" style="margin-top:0">Your data</h2>
     <div class="kv"><span class="muted">Topics completed</span><b>${all.d} / ${all.n}</b></div>
     <div class="kv"><span class="muted">Data size</span><b>${kb} KB</b></div>
     <div class="kv"><span class="muted">Last export</span><b>${D.settings.lastExport?nice(D.settings.lastExport,{day:'numeric',month:'short',year:'numeric'}):'Never'}</b></div>
     <div class="kv"><span class="muted">Started on</span><b>${nice(D.settings.created||today(),{day:'numeric',month:'short',year:'numeric'})}</b></div>
     <div class="kv"><span class="muted">Protected storage</span><b id="persist">checking…</b></div>
     <div class="chips" style="margin-top:16px"><button class="btn pri" data-act="export">Export backup (.json)</button><button class="btn" data-act="import">Import backup</button></div>
     <p class="muted" style="font-size:13px;margin-top:14px">Importing replaces current data, but your current data is saved first as a safety copy.</p></div>
   <div class="card"><h2 class="sec" style="margin-top:0">Appearance</h2>
     <div class="chips"><button class="btn ${!light?'pri':''}" data-act="theme" data-t="dark">Dark</button><button class="btn ${light?'pri':''}" data-act="theme" data-t="light">Light</button></div>
     <h2 class="sec">Automatic daily copies <small>${sn.length} kept</small></h2>
     ${sn.length?sn.slice(0,7).map(k=>`<div class="row"><div class="grow">${nice(k.slice(SNAP.length),{weekday:'short',day:'numeric',month:'short'})}<br><small>Start-of-day copy</small></div><button class="btn sm" data-act="restore" data-k="${k}">Restore</button></div>`).join(''):'<div class="empty">Copies appear after your second day of use.</div>'}
   </div>
  </div>
  <h2 class="sec">Revision reminders</h2>
  <div class="card"><div class="kv"><span>Auto-schedule revision when a topic is marked done<br><small class="muted">Revision after ${REV_STEPS.join(', ')} days</small></span><button class="btn sm ${D.settings.autoRev?'pri':''}" data-act="autoRev">${D.settings.autoRev?'On':'Off'}</button></div>
   <div class="kv"><span>Daily reminder notification<br><small class="muted">${notifState()}</small></span><button class="btn sm ${D.settings.remind.on?'pri':''}" data-act="remindToggle">${D.settings.remind.on?'On':'Off'}</button></div>
   <div class="kv"><span>Reminder time</span><input class="inp" type="time" id="remindTime" value="${D.settings.remind.time}" style="width:auto;padding:6px 10px"></div>
   <div class="chips" style="margin-top:14px"><button class="btn" data-act="testNotif">Send test notification</button></div>
   <p class="muted" style="font-size:13px;margin-top:12px">Browsers can only show reminders while the app is open or running in the background. Install it to your home screen for the best result. Even if a reminder is missed, the due count is always shown on the sidebar, the browser tab and the dashboard when you open the app.</p></div>
  <h2 class="sec">Good to know</h2>
  <div class="card muted" style="font-size:14px;line-height:1.7">
   • Data is stored with <b>localStorage</b> on this device and browser. A different phone or browser starts empty – use Export / Import to move it.<br>
   • Clearing browser data or site data deletes progress. That is what the backup file is for.<br>
   • Syllabus is a study-friendly outline compiled from commonly followed patterns. Always verify with the latest official notification (psc.cg.gov.in, vyapam.cgstate.gov.in, ssc.gov.in, rrbcdg.gov.in).<br>
   • Your progress is tied to topic text, so you can safely edit the syllabus list in the code without losing marks.</div>
  <h2 class="sec">Danger zone</h2>
  <div class="card"><div class="chips"><button class="btn dng" data-act="reset">Erase all progress…</button></div><p class="muted" style="font-size:13px;margin-top:10px">A backup file downloads automatically before anything is erased.</p></div>`;
}

