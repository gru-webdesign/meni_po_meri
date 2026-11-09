/* ================= v4: polish, prikazi podataka, UX ================= */
S.fav=S.fav||{};S.dis=S.dis||{};S.ms=S.ms||{};

/* ---------- Haptika ---------- */
function hap(k='light'){try{const H=PL('Haptics');if(H){if(k==='success')H.notification({type:'SUCCESS'});else H.impact({style:k==='medium'?'MEDIUM':'LIGHT'});return}if(navigator.vibrate)navigator.vibrate(k==='success'?[10,40,10]:8)}catch(e){}}

/* ---------- Trajno čuvanje: localStorage + Preferences (Android) + nedeljna kopija u fajl ---------- */
let prefT=null;
function save(){S.updated=Date.now();const txt=JSON.stringify(S);try{localStorage.setItem(LS,txt)}catch(e){}
  clearTimeout(prefT);prefT=setTimeout(()=>{const P=PL('Preferences');if(P)P.set({key:LS,value:JSON.stringify(S)}).catch(()=>{});autoBackup()},400);
  setTimeout(checkMilestones,0)}
async function autoBackup(){const FS=PL('Filesystem');if(!FS)return;if(S.lastAuto&&daysBetween(S.lastAuto,TODAY)<7)return;
  try{await FS.writeFile({path:'meni-po-meri-auto-kopija.json',data:JSON.stringify(S),directory:'DATA',encoding:'utf8'});S.lastAuto=TODAY;try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}catch(e){}}
async function backupToFile(){const txt=JSON.stringify(S,null,0),name='meni-po-meri-kopija-'+TODAY+'.json';const FS=PL('Filesystem'),SH=PL('Share');
  try{if(FS&&SH){const r=await FS.writeFile({path:name,data:txt,directory:'CACHE',encoding:'utf8'});await SH.share({title:'Meni po meri: rezervna kopija',url:r.uri,dialogTitle:'Sačuvaj kopiju'});return}
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type:'application/json'}));a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Kopija je sačuvana')}
  catch(e){if(!(e&&/cancel/i.test(String(e.message||e))))openSheet(backupSheet(txt))}}
function restoreFromText(txt){const o=JSON.parse(txt);if(!o||typeof o!=='object'||!o.days||!o.p)throw new Error('bad');
  const prev=JSON.stringify(S);S=Object.assign({},DEF,o);S.p=Object.assign({},DEFP,o.p||{});S.fav=S.fav||{};S.dis=S.dis||{};S.ms=S.ms||{};save();applyTheme();
  if(S.setup){TAB='danas'}rerender();toast('Podaci su vraćeni',()=>{S=JSON.parse(prev);save();rerender()})}

/* ---------- Toast sa poništavanjem ---------- */
let undoFn=null;
function toast(t,undo){clearTimeout(toastT);undoFn=undo||null;
  toastEl.innerHTML=ic('check-circle','sm')+'<span>'+esc(t)+'</span>'+(undo?'<button class="undo" id="undoBtn">Poništi</button>':'');
  toastEl.classList.toggle('has-undo',!!undo);toastEl.classList.add('show');toastT=setTimeout(()=>{toastEl.classList.remove('show');undoFn=null},undo?4500:1900)}
toastEl.addEventListener('click',e=>{if(e.target.closest('#undoBtn')&&undoFn){const f=undoFn;undoFn=null;toastEl.classList.remove('show');f();hap();rerender()}});

/* ---------- Jelovnik: omiljena jela i ona koja ne voliš ---------- */
function pool(type){const x=exclTags();const all=LIB.filter(m=>m.t.includes(type));let ok=all.filter(m=>!m.tg.some(t=>x.includes(t)));if(!ok.length)ok=all;
  const nd=ok.filter(m=>!S.dis[m.id]);return nd.length?nd:ok}
function planFor(key){
  const n=+S.p.mealsN||5, slots=SLOTS[n], share=SHARE[n], offs=OFFS[n], kt=target(), di=dIdx(key), wi=weekIdx(key);
  const bf=(di>=5)?timeAdd(S.p.bf,1):S.p.bf;let sCount=0;const used=new Set();
  return slots.map((type,i)=>{
    const P=pool(type), ord=shuffled(P.concat(P.filter(m=>S.fav[m.id])),wi*97+type.charCodeAt(0)*13+n);
    const rank=type==='s'?sCount++:0;let idx=(di+rank*3)%ord.length,m=ord[idx];
    for(let k=0;k<ord.length&&used.has(m.id);k++){idx=(idx+1)%ord.length;m=ord[idx]}
    const ov=S.ovr[key]&&S.ovr[key][i];if(ov){const mm=LIB.find(x=>x.id===ov);if(mm)m=mm}
    used.add(m.id);
    return {slot:i,type,time:timeAdd(bf,offs[i]),meal:scaleMeal(m,kt*share[i])};
  });
}

/* ---------- Doslednost ---------- */
function dayScore(k){const d=S.days[k];if(!d)return null;const has=Object.keys(d.eat||{}).length||(d.extra||[]).length||d.water||d.walk;if(!has)return null;
  return 0.5*Math.min(1,adherence(k))+0.25*Math.min(1,(d.water||0)/waterT())+0.25*Math.min(1,(d.walk||0)/walkT())}
const DAY_ACC=['ponedeljak','utorak','sredu','četvrtak','petak','subotu','nedelju'];
const lvl=s=>s==null?0:s<0.2?0:s<0.45?1:s<0.65?2:s<0.85?3:4;
function streak(){let n=0,k=TODAY;if((dayScore(k)||0)<0.65)k=addDays(k,-1);while((dayScore(k)||0)>=0.65&&n<999){n++;k=addDays(k,-1)}return n}
function goodDays(){return Object.keys(S.days).filter(k=>(dayScore(k)||0)>=0.65).length}

/* ---------- Prekretnice ---------- */
function msDefs(){const W=S.weights,w0=W.length?W[0].w:+S.p.weight,lost=w0-curW(),pct=w0?lost/w0:0,wa=S.waist,wl=wa.length>1?wa[0].v-wa[wa.length-1].v:0;
  const water7=Object.keys(S.days).filter(k=>(S.days[k].water||0)>=waterT()).length;
  return [['start','flame','Prvi dan','Prvi upis',Object.keys(S.days).some(k=>dayScore(k)!=null)],['streak7','fire','7 dana zaredom','Dobar dan 7 puta u nizu',streak()>=7],
   ['water7','drop','Voda 7 dana','7 dana sa celim ciljem',water7>=7],['kg2','trend-down','-2 kg','Prva dva kilograma',lost>=2],['kg5','trend-down','-5 kg','Pet manje',lost>=5],
   ['pct5','medal','-5% težine','Već utiče na pritisak i šećer',pct>=0.05],['waist5','ruler','-5 cm struka','Manje masti oko stomaka',wl>=5],['kg10','trophy','-10 kg','Dvocifreno',lost>=10],
   ['pct10','medal','-10% težine','Veliki zdravstveni pomak',pct>=0.1],['days30','calendar-check','30 dobrih dana','Navika je stvorena',goodDays()>=30],['kg15','trophy','-15 kg','Petnaest manje',lost>=15],
   ['goal','target','Cilj','Dostignuta ciljna težina',S.weights.length>1&&curW()<=+S.p.goalW+0.3]]}
let msBusy=false;
function checkMilestones(){if(msBusy||!S.setup)return;msBusy=true;try{const fresh=msDefs().filter(m=>m[4]&&!S.ms[m[0]]);
  if(fresh.length){fresh.forEach(m=>S.ms[m[0]]=TODAY);try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}
    setTimeout(()=>{toast('Prekretnica: '+fresh[fresh.length-1][2]);hap('success')},900)}}finally{msBusy=false}}

/* ---------- Uvidi iz podataka ---------- */
function insights(){const keys=[...Array(28)].map((_,i)=>addDays(TODAY,-i)).filter(k=>dayTotals(k)[0]>0);
  if(keys.length<5)return {need:5-keys.length,list:[]};
  const avg=a=>a.reduce((x,y)=>x+y,0)/a.length,out=[],K=k=>dayTotals(k)[0];
  const sl=keys.filter(k=>S.days[k].sleep!=null),lo=sl.filter(k=>S.days[k].sleep<7),hi=sl.filter(k=>S.days[k].sleep>=7);
  if(lo.length>=2&&hi.length>=2){const d=avg(lo.map(K))-avg(hi.map(K));if(Math.abs(d)>=100)out.push(['moon',d>0?'Manje sna, više hrane':'San ne podiže unos',d>0?`Dana kad spavaš manje od 7 h uneseš oko ${R(d)} kcal više.`:`Kad spavaš kraće, ne jedeš više. Dobar znak.`])}
  const we=keys.filter(k=>dIdx(k)>=5),wd=keys.filter(k=>dIdx(k)<5);
  if(we.length>=2&&wd.length>=2){const p=(avg(we.map(K))/avg(wd.map(K))-1)*100;if(Math.abs(p)>=8)out.push(['calendar-blank',p>0?'Vikend je izazov':'Vikendom si bolji',p>0?`Vikendom uneseš ${R(p)}% više nego radnim danima. Isplaniraj subotu unapred.`:`Vikendom uneseš ${R(-p)}% manje nego radnim danima.`])}
  const l7=keys.filter(k=>daysBetween(k,TODAY)<7),mt=macroT();
  if(l7.length>=3){const hit=l7.filter(k=>dayTotals(k)[1]>=mt.p*0.9).length;out.push(['barbell',hit>=l7.length-1?'Proteini su na mestu':'Proteini zaostaju',`Cilj od ${mt.p} g dostignut ${hit} od ${l7.length} dana ove nedelje.${hit<l7.length-1?' Dodaj jaje, jogurt ili dlan mesa.':''}`])}
  const byD=[0,1,2,3,4,5,6].map(i=>keys.filter(k=>dIdx(k)===i)).map((ks,i)=>({i,n:ks.length,a:ks.length?avg(ks.map(adherence)):null})).filter(x=>x.n>=2);
  if(byD.length>=3){const w=byD.reduce((a,b)=>a.a<b.a?a:b);if(w.a<0.7)out.push(['warning','Najteži dan: '+DAYN[w.i].toLowerCase(),`Tog dana pojedeš ${R(w.a*100)}% planiranih obroka. Spremi hranu unapred za ${DAY_ACC[w.i]}.`])}
  const en=keys.filter(k=>S.days[k].energy!=null&&S.days[k].sleep!=null);
  if(en.length>=4){const a=en.filter(k=>S.days[k].sleep>=7),b=en.filter(k=>S.days[k].sleep<7);if(a.length>=2&&b.length>=2){const d=avg(a.map(k=>S.days[k].energy))-avg(b.map(k=>S.days[k].energy));if(d>=0.5)out.push(['lightning','San diže energiju',`Posle 7 i više sati sna energija ti je u proseku ${fmt1(d)} poena viša.`])}}
  const wat=l7.filter(k=>(S.days[k].water||0)>=waterT()).length;if(l7.length>=3)out.push(['drop',wat>=l7.length-1?'Voda je navika':'Voda može bolje',`Cilj za vodu ispunjen ${wat} od ${l7.length} dana.`]);
  return {need:0,list:out.slice(0,4)}}

/* ---------- Nedeljni izveštaj (prošla nedelja) ---------- */
function weekReport(){const mon=addDays(TODAY,-dIdx(TODAY)-7),ks=[...Array(7)].map((_,i)=>addDays(mon,i));
  const logged=ks.filter(k=>dayTotals(k)[0]>0);if(!logged.length)return null;const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
  const kc=avg(logged.map(k=>dayTotals(k)[0])),adh=avg(ks.map(adherence)),wat=avg(ks.map(k=>S.days[k]?S.days[k].water||0:0)),walk=avg(ks.map(k=>S.days[k]?S.days[k].walk||0:0));
  const ws=S.weights.filter(x=>x.d<=ks[6]),before=ws.filter(x=>x.d<mon),inw=ws.filter(x=>x.d>=mon);
  const dw=inw.length&&(before.length||inw.length>1)?inw[inw.length-1].w-(before.length?before[before.length-1].w:inw[0].w):null;
  const scores=[['redovni obroci',adh],['voda',wat/waterT()],['hodanje',walk/walkT()]].sort((a,b)=>a[1]-b[1]);
  return {kc,adh,wat,walk,dw,focus:scores[0][1]<0.85?scores[0][0]:null,mon}}
function reportCard(){const wi=weekIdx(TODAY);if(S.repSeen===wi)return '';const r=weekReport();if(!r)return '';
  return `<section class="report"><div class="row between"><span class="lbl">Prošla nedelja</span><button class="icon-btn dark" data-rep="1" aria-label="Zatvori izveštaj">${ic('x','sm')}</button></div>
   <h2>${r.dw!=null?(r.dw<=0?`${fmt1(-r.dw)} kg manje`:`${fmt1(r.dw)} kg više`):`${R(r.adh*100)}% plana ispunjeno`}</h2>
   <div class="rgrid"><div><b>${R(r.kc)}</b><span>kcal prosek</span></div><div><b>${R(r.adh*100)}%</b><span>obroka</span></div><div><b>${litres(r.wat)} l</b><span>voda</span></div></div>
   <p>${r.focus?`Fokus za ovu nedelju: <b style="color:var(--night-ink)">${r.focus}</b>. Ostalo drži kao do sada.`:'Sve tri navike su na mestu. Samo nastavi.'}</p></section>`}

/* ---------- Jutarnji check-in ---------- */
function checkinCard(d){if(d.ci)return '';const sl=d.sleep!=null?d.sleep:S.p.sleep,lw=curW();
  return `<section class="card checkin"><div class="sec-title"><h2>Jutarnji check-in</h2>${ic('sun')}</div>
   <div class="ci-row"><span>Težina <small class="muted">(nije obavezno)</small></span><input type="number" id="ciW" inputmode="decimal" step="0.1" placeholder="${fmt1(lw)}" aria-label="Današnja težina"></div>
   <div class="ci-row"><span>San</span><div class="stepper"><button class="icon-btn" data-sleep="-0.5" aria-label="Manje sati">${ic('minus','sm')}</button><b class="n">${fmt1(sl)} h</b><button class="icon-btn" data-sleep="0.5" aria-label="Više sati">${ic('plus','sm')}</button></div></div>
   <div class="block-lbl" style="margin-top:8px">Energija</div>
   <div class="seg5">${[1,2,3,4,5].map(v=>`<button data-energy="${v}" class="${d.energy===v?'on':''}">${['Iscrpljen','Umoran','Okej','Dobro','Odlično'][v-1]}</button>`).join('')}</div>
   <button class="btn block" id="ciSave" style="margin-top:14px">Sačuvaj</button></section>`}

/* ---------- Grafikoni ---------- */
function chartSVG(){
  const W=S.weights;if(!W.length)return '';
  const w=340,h=180,p={l:30,r:10,t:12,b:22};
  const pts=W.map(x=>({t:new Date(x.d+'T12:00').getTime(),w:x.w}));
  const tr=[];pts.forEach((x,i)=>{tr.push({t:x.t,w:i?tr[i-1].w+0.3*(x.w-tr[i-1].w):x.w})});
  const last=tr[tr.length-1],r=rateKg(),wk=7*864e5,horizon=Math.max(Date.now(),last.t)+8*wk;
  const proj=[],bandHi=[],bandLo=[];for(let t=last.t;t<=horizon;t+=wk){const n=(t-last.t)/wk;const v=Math.max(+S.p.goalW,last.w-r*n);proj.push({t,w:v});bandHi.push({t,w:Math.max(+S.p.goalW,last.w-r*0.7*n)});bandLo.push({t,w:Math.max(+S.p.goalW,last.w-r*1.3*n)})}
  const start=pts[0].t,end=horizon;const all=[...pts.map(x=>x.w),...bandLo.map(x=>x.w),...bandHi.map(x=>x.w)];
  const lo=Math.floor(Math.min(...all)-1),hi=Math.ceil(Math.max(...all)+1);
  const X=t=>p.l+(t-start)/((end-start)||1)*(w-p.l-p.r),Y=v=>p.t+(hi-v)/((hi-lo)||1)*(h-p.t-p.b);
  const path=a=>a.map((x,i)=>(i?'L':'M')+X(x.t).toFixed(1)+' '+Y(x.w).toFixed(1)).join(' ');
  const band=path(bandHi)+' '+bandLo.slice().reverse().map(x=>'L'+X(x.t).toFixed(1)+' '+Y(x.w).toFixed(1)).join(' ')+' Z';
  const ticks=[lo,R((lo+hi)/2),hi];
  const ml=d=>new Date(d).toLocaleDateString('sr-Latn-RS',{day:'numeric',month:'short'}).replace(/\.$/,'');
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Kilaža i trend">
   ${ticks.map(v=>`<line x1="${p.l}" x2="${w-p.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${p.l-6}" y="${Y(v)+4}" text-anchor="end" font-size="11" font-family="var(--mono)" fill="var(--muted)">${v}</text>`).join('')}
   ${r>0?`<path d="${band}" fill="var(--accent)" opacity=".1"/><path d="${path(proj)}" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 5"/>`:''}
   ${pts.map(x=>`<circle cx="${X(x.t)}" cy="${Y(x.w)}" r="3" fill="var(--muted)" opacity=".55"/>`).join('')}
   ${tr.length>1?`<path d="${path(tr)}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>`:''}
   <circle cx="${X(last.t)}" cy="${Y(last.w)}" r="5.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.5"/>
   <text x="${p.l}" y="${h-5}" font-size="11" fill="var(--muted)">${ml(start)}</text><text x="${w-p.r}" y="${h-5}" font-size="11" fill="var(--muted)" text-anchor="end">${ml(end)}</text></svg>
   <div class="legend"><span><i style="background:var(--accent)"></i>Trend (bez skokova vode)</span><span><i style="background:var(--muted);opacity:.55;border-radius:99px"></i>Merenja</span>${r>0?'<span><i style="background:var(--accent);opacity:.25"></i>Očekivano</span>':''}</div>`}
function heatCard(){const end=addDays(TODAY,6-dIdx(TODAY)),start=addDays(end,-34),cells=[];for(let i=0;i<35;i++){const k=addDays(start,i);cells.push(k)}
  const st=streak();
  return `<section class="card"><div class="sec-title"><h2>Doslednost</h2><div class="streak-big"><b>${st}</b><span>${st===1?'dan':'dana'} zaredom</span></div></div>
   <div class="heat-head">${DAYS.map(d=>`<span>${d}</span>`).join('')}</div>
   <div class="heat">${cells.map(k=>k>TODAY?`<i class="fut"></i>`:`<i class="l${lvl(dayScore(k))} ${k===TODAY?'today':''}" title="${k}"></i>`).join('')}</div>
   <div class="heat-leg">Manje <i style="background:var(--sunk)"></i><i class="l1" style="background:color-mix(in srgb,var(--accent) 25%,var(--sunk))"></i><i style="background:color-mix(in srgb,var(--accent) 50%,var(--sunk))"></i><i style="background:color-mix(in srgb,var(--accent) 75%,var(--sunk))"></i><i style="background:var(--accent)"></i> Više</div>
   <p class="small muted" style="margin-top:8px">Dan se računa po obrocima (pola), vodi i hodu (po četvrtina). Dobar dan je 65% i više.</p></section>`}
function insightsCard(){const r=insights();
  return `<section class="card"><h2 style="margin-bottom:12px">Uvidi</h2>${r.list.length?`<div class="insights">${r.list.map(x=>`<div class="ins">${ic(x[0])}<div><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div></div>`).join('')}</div>`:
   `<p class="small muted">Uvidi se pojavljuju posle 5 dana sa upisanim obrocima. Još ${r.need} ${r.need===1?'dan':'dana'}.</p>`}</section>`}
function macroCard(){const mt=macroT(),days=[...Array(7)].map((_,i)=>addDays(TODAY,i-6)).map(k=>{const t=dayTotals(k);const pk=t[1]*4,ck=t[2]*4,fk=t[3]*9,o=Math.max(0,t[0]-pk-ck-fk);return {k,t:t[0],pk,ck,fk,o}});
  const max=Math.max(mt.k*1.25,...days.map(d=>d.t)),av=days.filter(d=>d.t>0);
  return `<section class="card"><div class="sec-title"><h2>Kalorije i makroi</h2>${av.length?`<span class="pill line n">prosek ${R(av.reduce((a,b)=>a+b.t,0)/av.length)}</span>`:''}</div>
   <div class="mstack">${days.map(d=>`<div class="mst"><div class="mst-col"><i class="p" style="height:${d.pk/max*100}%"></i><i class="c" style="height:${d.ck/max*100}%"></i><i class="f" style="height:${d.fk/max*100}%"></i><i style="height:${d.o/max*100}%;background:var(--muted);opacity:.4"></i><s style="bottom:${mt.k/max*100}%"></s></div><span class="${d.k===TODAY?'n':''}" style="${d.k===TODAY?'color:var(--accent);font-weight:700':''}">${DAYS[dIdx(d.k)]}</span></div>`).join('')}</div>
   <div class="legend"><span><i style="background:var(--accent)"></i>Proteini</span><span><i style="background:#E0A43A"></i>UH</span><span><i style="background:var(--red);opacity:.85"></i>Masti</span><span><i style="background:var(--ink);opacity:.5;height:2px;vertical-align:3px"></i>Cilj ${mt.k}</span></div></section>`}
function badgesCard(){const ds=msDefs();const got=ds.filter(m=>S.ms[m[0]]).length;
  return `<section class="card"><div class="sec-title"><h2>Prekretnice</h2><span class="pill line n">${got}/${ds.length}</span></div>
   <div class="badges">${ds.map(m=>`<div class="badge ${S.ms[m[0]]?'got':''}">${ic(m[1])}<b>${esc(m[2])}</b><span>${S.ms[m[0]]?new Date(S.ms[m[0]]+'T12:00').toLocaleDateString('sr-Latn-RS',{day:'numeric',month:'short'}).replace(/\.$/,''):esc(m[3])}</span></div>`).join('')}</div></section>`}

/* ---------- Režim kuvanja ---------- */
let COOK=null,cookTick=null;
function openCook(key,slot){const x=planFor(key)[slot],m=x.meal;const steps=m.r.split(/(?<=\.)\s+/).map(s=>s.trim()).filter(Boolean);
  COOK={key,slot,m,steps,step:0,done:{},timer:null};closeSheet();
  const el=document.createElement('div');el.className='cook';el.id='cook';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Režim kuvanja');document.body.appendChild(el);
  try{const K=PL('KeepAwake');if(K)K.keepAwake();else if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>COOK&&(COOK.lock=l)).catch(()=>{})}catch(e){}
  drawCook()}
function stepMinutes(s){const all=[...s.matchAll(/(\d+)\s*(?:do\s*(\d+)\s*)?min/g)];if(!all.length)return 0;const a=all[0];return +(a[2]||a[1])}
function drawCook(){const c=COOK,el=document.getElementById('cook');if(!c||!el)return;const total=c.steps.length+1,i=c.step;
  const mins=i>0?stepMinutes(c.steps[i-1]):0,t=c.timer;
  let body;
  if(i===0)body=`<h2>${esc(c.m.n)}</h2><div class="block-lbl">Pripremi sastojke</div><div class="cook-ing">${c.m.items.map((it,j)=>`<label class="shop-item ${c.done[j]?'done':''}" style="padding:12px 0"><input type="checkbox" data-cing="${j}" ${c.done[j]?'checked':''}><span>${esc(shortName(it.k))}</span><b>${esc(measure(it))}</b></label>`).join('')}</div>`;
  else body=`<div class="small muted">Korak ${i} od ${c.steps.length}</div><p class="cook-step">${esc(c.steps[i-1])}</p>${mins||t?`<div class="timer"><b id="tLeft">${t?fmtLeft(t.end-Date.now()):String(mins).padStart(2,'0')+':00'}</b>${t?`<button class="btn ghost" data-ctimer="stop">${ic('stop','sm')}Zaustavi</button>`:`<button class="btn" data-ctimer="${mins}">${ic('timer','sm')}Tajmer ${mins} min</button>`}</div>`:''}`;
  el.innerHTML=`<div><div class="cook-top"><span class="small">${ic('cooking-pot','sm')} Režim kuvanja</span><button class="icon-btn" data-cclose="1" aria-label="Zatvori režim kuvanja">${ic('x')}</button></div><div class="cook-prog"><i style="width:${(i)/(total-1)*100}%"></i></div></div>
   <div class="cook-body">${body}</div>
   <div class="cook-nav"><button class="btn ghost" data-cnav="-1" ${i===0?'disabled style="opacity:.4"':''}>${ic('caret-left','sm')}Nazad</button><button class="btn" data-cnav="1">${i===total-1?'Gotovo':'Dalje'}${i===total-1?'':ic('caret-right','sm')}</button></div>`}
const fmtLeft=ms=>{ms=Math.max(0,ms);const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')};
function startTimer(mins){const end=Date.now()+mins*60000;COOK.timer={end};clearInterval(cookTick);
  cookTick=setInterval(()=>{const el=document.getElementById('tLeft');const left=COOK&&COOK.timer?COOK.timer.end-Date.now():0;if(el)el.textContent=fmtLeft(left);
    if(left<=0){clearInterval(cookTick);if(COOK)COOK.timer=null;hap('success');toast('Tajmer je gotov');try{navigator.vibrate&&navigator.vibrate([300,150,300])}catch(e){}drawCook()}},500);
  const LN=PL('LocalNotifications');if(LN)LN.schedule({notifications:[{id:9001,title:'Tajmer je gotov',body:COOK.m.n,schedule:{at:new Date(end),allowWhileIdle:true},smallIcon:'ic_stat_leaf',iconColor:'#12803E'}]}).catch(()=>{});
  drawCook()}
function stopTimer(){clearInterval(cookTick);if(COOK)COOK.timer=null;const LN=PL('LocalNotifications');if(LN)LN.cancel({notifications:[{id:9001}]}).catch(()=>{});drawCook()}
function closeCook(done){stopTimer();const el=document.getElementById('cook');if(el)el.remove();
  try{const K=PL('KeepAwake');if(K)K.allowSleep();else if(COOK&&COOK.lock)COOK.lock.release()}catch(e){}
  const c=COOK;COOK=null;if(done&&c&&c.key===TODAY&&!dayOf().eat[c.slot]){eatMeal(TODAY,c.slot,1);toast('Prijatno! Obrok je upisan',()=>eatMeal(TODAY,c.slot,0));hap('success');rerender()}}
document.addEventListener('click',e=>{const t=e.target.closest('#cook [data-cnav],#cook [data-cclose],#cook [data-ctimer],#cook [data-cing]');if(!t)return;const ds=t.dataset;
  if(ds.cclose){closeCook(false);return}
  if(ds.cnav){const n=COOK.step+ +ds.cnav,total=COOK.steps.length+1;if(n>=total){closeCook(true);return}COOK.step=clamp(n,0,total-1);hap();drawCook();return}
  if(ds.ctimer){if(ds.ctimer==='stop')stopTimer();else startTimer(+ds.ctimer);hap();return}
  if(ds.cing!==undefined){COOK.done[ds.cing]=t.checked;t.closest('label').classList.toggle('done',t.checked);hap();return}});

/* ---------- Deljenje spiska za kupovinu ---------- */
function shopText(){const tmp=document.createElement('div');tmp.innerHTML=shopSheet();const lines=['Kupovina, nedelja '+weekNo()+':'];
  tmp.querySelectorAll('.shop-group').forEach(g=>{const items=[...g.querySelectorAll('.shop-item')].filter(l=>!l.querySelector('input').checked);if(!items.length)return;
    lines.push('',g.querySelector('.block-lbl').textContent.toUpperCase());items.forEach(l=>lines.push('- '+l.querySelector('span').textContent+': '+l.querySelector('b').textContent))});return lines.join('\n')}
async function shareShop(){const text=shopText(),SH=PL('Share');
  try{if(SH){await SH.share({title:'Spisak za kupovinu',text,dialogTitle:'Podeli spisak'});return}if(navigator.share){await navigator.share({title:'Spisak za kupovinu',text});return}
    await navigator.clipboard.writeText(text);toast('Spisak je kopiran')}catch(e){if(!(e&&/cancel|abort/i.test(String(e.name||e.message||e))))openSheet(backupSheet(text))}}

/* ---------- Prevlačenje obroka ---------- */
let SWP=null,swipeClick=false;
app.addEventListener('pointerdown',e=>{const row=e.target.closest('.sw .mrow');if(!row||e.button>0)return;SWP={row,sw:row.parentElement,x:e.clientX,y:e.clientY,dx:0,on:false}});
app.addEventListener('pointermove',e=>{if(!SWP)return;const dx=e.clientX-SWP.x,dy=e.clientY-SWP.y;
  if(!SWP.on){if(Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.3){SWP.on=true;try{SWP.row.setPointerCapture(e.pointerId)}catch(_){}}else if(Math.abs(dy)>12){SWP=null;return}else return}
  SWP.dx=clamp(dx,-140,140);SWP.row.style.transform=`translateX(${SWP.dx}px)`;SWP.sw.classList.toggle('go-r',SWP.dx>20);SWP.sw.classList.toggle('go-l',SWP.dx<-20)});
function endSwipe(){if(!SWP)return;const s=SWP;SWP=null;if(!s.on)return;swipeClick=true;setTimeout(()=>swipeClick=false,350);
  s.row.style.transition='transform .25s var(--ease)';s.row.style.transform='';setTimeout(()=>{s.row.style.transition='';s.sw.classList.remove('go-r','go-l')},260);
  const slot=+s.sw.dataset.slot;
  if(s.dx>90){const d=dayOf(),prev=d.eat[slot];if(!prev){eatMeal(TODAY,slot,1);hap('medium');toast('Obrok upisan',()=>{eatMeal(TODAY,slot,0)});setTimeout(rerender,260)}}
  else if(s.dx<-90){const prev=S.ovr[TODAY]&&S.ovr[TODAY][slot];const nx=swapMeal(TODAY,slot);hap('medium');toast('Novo jelo: '+nx.n,()=>{if(prev)S.ovr[TODAY][slot]=prev;else delete S.ovr[TODAY][slot];save()});setTimeout(rerender,260)}}
app.addEventListener('pointerup',endSwipe);app.addEventListener('pointercancel',()=>{if(SWP){SWP.row.style.transform='';SWP.sw.classList.remove('go-r','go-l');SWP=null}});
app.addEventListener('click',e=>{if(swipeClick){e.stopPropagation();e.preventDefault()}},true);

/* ---------- Dupli dodir i nove akcije (pre glavnog rukovaoca) ---------- */
let lastKey='',lastAt=0;
function guard(e){const t=e.target.closest('button,input[type=checkbox]');if(!t)return;const ds=t.dataset;
  if(!ds.trk&&!ds.sleep&&!ds.cnav&&!ds.cuq){const key=(t.id||'')+'|'+Object.keys(ds).filter(k=>k!=='fr').sort().map(k=>k+'='+ds[k]).join('&');const now=Date.now();
    if(key===lastKey&&now-lastAt<450){e.stopImmediatePropagation();e.preventDefault();return}lastKey=key;lastAt=now}
  if(ds.trk||ds.eat!==undefined||ds.ex||ds.energy||ds.shop||ds.health||ds.seg||ds.flag)hap();
  // nove akcije
  if(ds.fav){S.fav[ds.fav]=!S.fav[ds.fav];if(S.fav[ds.fav])delete S.dis[ds.fav];save();hap();toast(S.fav[ds.fav]?'Dodato u omiljena jela':'Uklonjeno iz omiljenih');refreshMealSheet();e.stopImmediatePropagation();return}
  if(ds.dis){S.dis[ds.dis]=!S.dis[ds.dis];if(S.dis[ds.dis])delete S.fav[ds.dis];const key=ds.key,slot=+ds.slot;
    if(S.dis[ds.dis]&&S.ovr[key]&&S.ovr[key][slot]===ds.dis)delete S.ovr[key][slot];save();hap();
    toast(S.dis[ds.dis]?'Ovo jelo se više neće nuditi':'Jelo je vraćeno u jelovnik',()=>{S.dis[ds.dis]=!S.dis[ds.dis];save();refreshMealSheet()});refreshMealSheet();rerender();e.stopImmediatePropagation();return}
  if(ds.cook!==undefined){openCook(ds.key,+ds.cook);e.stopImmediatePropagation();return}
  if(ds.share==='shop'){shareShop();e.stopImmediatePropagation();return}
  if(ds.rep){S.repSeen=weekIdx(TODAY);save();rerender();e.stopImmediatePropagation();return}
  if(t.id==='ciSave'){const d=dayOf(),i=document.getElementById('ciW'),v=parseFloat(String(i&&i.value||'').replace(',','.'));
    if(d.sleep==null)d.sleep=S.p.sleep;if(d.energy==null){toast('Izaberi kako se osećaš');e.stopImmediatePropagation();return}
    if(v>40&&v<250){S.weights=S.weights.filter(x=>x.d!==TODAY);S.weights.push({d:TODAY,w:v});S.weights.sort((a,b)=>a.d<b.d?-1:1);runReview(false)}
    d.ci=true;save();hap('success');toast(v>40?'Check-in i težina sačuvani':'Check-in sačuvan');rerender();e.stopImmediatePropagation();return}
  if(t.id==='bkFile'){backupToFile();e.stopImmediatePropagation();return}
  if(t.id==='bkLoad'){document.getElementById('bkInput').click();e.stopImmediatePropagation();return}
  // poništavanje za postojeće akcije
  if(ds.eat!==undefined&&!ds.fromSheet){const slot=+ds.eat,fr=+ds.fr,prev=dayOf().eat[slot]?JSON.parse(JSON.stringify(dayOf().eat[slot])):null;
    eatMeal(TODAY,slot,fr);toast(fr?(fr<1?'Upisana pola porcije':'Obrok upisan'):'Unos je poništen',()=>{const d=dayOf();if(prev)d.eat[slot]=prev;else delete d.eat[slot];save()});rerender();e.stopImmediatePropagation();return}
  if(ds.delx!==undefined){const d=dayOf(),i=+ds.delx,item=d.extra[i];d.extra.splice(i,1);save();toast('Obrisano: '+item.n,()=>{dayOf().extra.splice(i,0,item);save()});rerender();e.stopImmediatePropagation();return}
  if(ds.swap!==undefined){const key=ds.key,slot=+ds.swap,prev=S.ovr[key]&&S.ovr[key][slot];const nx=swapMeal(key,slot);hap();
    toast('Novo jelo: '+nx.n,()=>{if(prev)S.ovr[key][slot]=prev;else delete S.ovr[key][slot];save();refreshMealSheet()});if(ds.fromSheet)refreshMealSheet(key,slot);rerender();e.stopImmediatePropagation();return}
}
let MS=null;
function refreshMealSheet(key,slot){if(key!=null)MS={key,slot};if(MS&&!sheet.hidden&&sheetBody.querySelector('.prefs'))sheetBody.innerHTML=mealSheet(MS.key,MS.slot)}
app.addEventListener('click',guard,true);sheet.addEventListener('click',guard,true);
document.addEventListener('click',e=>{const t=e.target.closest('[data-meal-open]');if(t)MS={key:t.dataset.key,slot:+t.dataset.mealOpen}},true);

/* ---------- Učitavanje kopije iz fajla ---------- */
(function(){const inp=document.createElement('input');inp.type='file';inp.accept='application/json,.json,text/plain';inp.id='bkInput';inp.hidden=true;document.body.appendChild(inp);
  inp.addEventListener('change',()=>{const f=inp.files&&inp.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{restoreFromText(String(rd.result))}catch(e){toast('Ovaj fajl nije ispravna kopija')}inp.value=''};rd.readAsText(f)})})();

/* ---------- Tastatura ---------- */
document.addEventListener('focusin',e=>{if(e.target.matches('input[type=text],input[type=number],input[type=search],textarea')){document.body.classList.add('kb');setTimeout(()=>{try{e.target.scrollIntoView({block:'center',behavior:'smooth'})}catch(_){}},300)}});
document.addEventListener('focusout',()=>setTimeout(()=>{const a=document.activeElement;if(!a||!a.matches||!a.matches('input[type=text],input[type=number],input[type=search],textarea'))document.body.classList.remove('kb')},120));

/* ---------- Tema i sistemske trake ---------- */
function applyTheme(){const r=document.documentElement;if(S.theme==='light'||S.theme==='dark')r.setAttribute('data-theme',S.theme);else r.removeAttribute('data-theme');
  const dark=S.theme==='dark'||(S.theme!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name=theme-color]').forEach(m=>m.setAttribute('content',dark?'#0B1712':'#E4F3EA'));
  try{const SB=PL('SystemBars');if(SB)SB.setStyle({style:dark?'DARK':'LIGHT'}).catch(()=>{})}catch(e){}}
try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(!S.theme||S.theme==='auto')applyTheme()})}catch(e){}

/* START je u v5.js */
