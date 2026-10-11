/* =========================== helpers ============================== */
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const fmt=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const today=()=>fmt(new Date());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return fmt(d)};
const diffDays=(a,b)=>Math.round((parseD(a)-parseD(b))/864e5);
const nice=(s,o)=>parseD(s).toLocaleDateString(LANG==='hi'?'hi-IN':'en-IN',o||{weekday:'short',day:'numeric',month:'short'});
const hash=s=>{let x=5381;for(let i=0;i<s.length;i++)x=((x<<5)+x+s.charCodeAt(i))|0;return (x>>>0).toString(36)};
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const hm=m=>{m=Math.round(m||0);const h=Math.floor(m/60),r=m%60;return h?`${h}${t('u_h')}${r?' '+r+t('u_m'):''}`:`${m}${t('u_m')}`};

/* line icons (24px grid) */
const IC={
 home:'<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
 master:'<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5l9 5 9-5" opacity=".55"/>',
 cgpsc:'<path d="M3 21h18"/><path d="M5 21V10M10 21V10M14 21V10M19 21V10"/><path d="M3 10l9-6 9 6z"/>',
 vyapam:'<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9z"/><path d="M9 14l2 2 4-4"/>',
 ssc:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
 rrb:'<rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 11h14M9 21l2-4M15 21l-2-4"/><circle cx="9" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="14" r="1" fill="currentColor"/>',
 rev:'<path d="M20 11a8 8 0 00-14-4M4 4v4h4"/><path d="M4 13a8 8 0 0014 4M20 20v-4h-4"/>',
 plan:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/>',
 set:'<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
 chev:'<path d="M9 6l6 6-6 6"/>',left:'<path d="M15 6l-6 6 6 6"/>',right:'<path d="M9 6l6 6-6 6"/>',
 chk:'<path d="M5 12.5l4.5 4.5L19 7.5" stroke-width="3.2"/>',
 star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
 note:'<path d="M4 5h16v11l-5 5H4z"/><path d="M15 21v-5h5M8 10h8M8 14h4"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
 download:'<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
 moon:'<path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z"/>',
 flame:'<path d="M12 3c1 4 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2 0-3-1-5 1-8z"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/>',
 bell:'<path d="M6 16V11a6 6 0 1112 0v5l2 2H4z"/><path d="M10 21h4"/>',
 globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'
};
const ico=(n,s=20,cls='')=>`<svg class="ic ${cls}" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;
