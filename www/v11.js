/* ================= v11: san i energija iz tvojih podataka, imunitet iz tanjira ================= */
const E_LBL=['Iscrpljen','Umoran','Okej','Dobro','Odlično'];
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
const f1=x=>fmt1(Math.round(x*10)/10);
function sleepEnergyData(n=14){const out=[];for(let i=n-1;i>=0;i--){const k=addDays(TODAY,-i),d=S.days[k];out.push({k,sl:d&&d.sleep!=null&&d.energy!=null?+d.sleep:null,en:d&&d.energy!=null?+d.energy:null,d})}return out}
function seInsights(){const rows=[];Object.keys(S.days).sort().forEach(k=>{const d=S.days[k];if(d&&d.sleep!=null&&d.energy!=null)rows.push({k,sl:+d.sleep,en:+d.energy})});
  const out=[],cmp=(a,b,txtHi,txtLo,min=2)=>{if(a.length>=min&&b.length>=min){const A=avg(a),B=avg(b);if(Math.abs(A-B)>=0.5)out.push({d:Math.abs(A-B),t:`${txtHi} energija ti je u proseku <b>${f1(A)}/5</b>. ${txtLo} <b>${f1(B)}/5</b>.`})}};
  cmp(rows.filter(r=>r.sl>=7).map(r=>r.en),rows.filter(r=>r.sl<7).map(r=>r.en),'Kad spavaš 7 sati i više,','Kad spavaš manje,');
  const prev=k=>S.days[addDays(k,-1)];
  const wk=rows.filter(r=>prev(r.k));cmp(wk.filter(r=>(prev(r.k).walk||0)>=30).map(r=>r.en),wk.filter(r=>(prev(r.k).walk||0)<30).map(r=>r.en),'Ujutru posle dana sa bar 30 minuta hoda','Posle dana sa manje hoda');
  cmp(wk.filter(r=>(prev(r.k).soda||0)>0).map(r=>r.en),wk.filter(r=>(prev(r.k).soda||0)===0).map(r=>r.en),'Ujutru posle dana sa gaziranim sokom','Posle dana bez gaziranog');
  return {n:rows.length,list:out.sort((a,b)=>b.d-a.d).slice(0,2),sl:avg(rows.slice(-14).map(r=>r.sl)),en:avg(rows.slice(-14).map(r=>r.en))}}
function sleepCard(){const D=sleepEnergyData(14),I=seInsights(),need=Math.max(0,5-I.n),today=dayOf();
  const bars=D.map(x=>{const h=x.sl==null?0:Math.max(8,Math.min(100,(x.sl-3)/7*100));return `<div class="se-col ${x.k===TODAY?'cur':''}">
    <div class="se-bar" title="${x.sl==null?'nema upisa':f1(x.sl)+' h'}"><i style="height:${h}%" class="${x.sl==null?'none':x.sl>=7?'ok':'low'}"></i></div>
    <span class="se-en e${x.en||0}" aria-label="${x.en?E_LBL[x.en-1]:'nema upisa'}"></span><small>${DAYS[dIdx(x.k)][0]}</small></div>`}).join('');
  return `<section class="card se">
   <div class="sec-title"><h2>San i energija</h2><span class="small muted">14 dana</span></div>
   ${I.n?`<div class="se-stats"><div><b class="n">${I.sl!=null?f1(I.sl):'–'}<small> h</small></b><span>prosečan san</span></div><div><b class="n">${I.en!=null?f1(I.en):'–'}<small>/5</small></b><span>prosečna energija</span></div></div>`:''}
   <div class="se-chart" role="img" aria-label="San i energija po danima">${bars}</div>
   <div class="se-legend"><span><i class="lg ok"></i>7 h i više</span><span><i class="lg low"></i>manje od 7 h</span><span><i class="lg en"></i>energija ujutru</span></div>
   ${need?`<div class="se-empty">${icd('sparkle','sm')}<div><b>Još ${need} ${need===1?'jutarnji check-in':need<5?'jutarnja check-ina':'jutarnjih check-inova'}</b><span>Posle toga ovde vidiš kako san, hod i gazirani sok utiču baš na tvoju energiju.</span></div></div>
     ${!today.ci&&today.energy==null?`<button class="btn ghost sm" data-go="danas">${ic('sun','sm')}Uradi današnji check-in</button>`:''}`
    :I.list.length?`<div class="se-ins">${I.list.map(x=>`<div>${icd('lightbulb','sm')}<p>${x.t}</p></div>`).join('')}</div><p class="small muted se-note">Ovo su tvoji podaci, ne dokaz uzroka, ali obrazac vredi pratiti.</p>`
    :`<div class="se-ins"><div>${icd('lightbulb','sm')}<p>Za sada san, hod i sok ne prave veliku razliku u tvojoj energiji. Obrazac postaje jasniji posle još nekoliko nedelja.</p></div></div>`}
  </section>`}
/* ---------- Imunitet iz tanjira ---------- */
const IMM=[
 {id:'vp',n:'Voće i povrće',ic:'carrot',per:'day',goal:5,unit:'porcija',keys:null,tip:'Dodaj salatu uz ručak i voće uz užinu.'},
 {id:'c',n:'Vitamin C',ic:'orange-slice',per:'day',goal:1,unit:'dana',keys:['paprika','kupus','kiseliKupus','brokoli','karfiol','pomorandza','kivi','jagode','limun','paradajz','spanac','blitva','rukola','maline'],tip:'Paprika, kupus, kivi ili pomorandža svaki dan.'},
 {id:'f',n:'Fermentisano',ic:'jar',per:'week',goal:5,unit:'puta',keys:['kefir','kiseloMleko','grcki','kiseliKupus'],tip:'Kefir ili kiselo mleko uz užinu hrane dobre bakterije.'},
 {id:'r',n:'Riba',ic:'fish',per:'week',goal:2,unit:'puta',keys:['__riba'],tip:'Dva puta nedeljno masna riba, zbog omega-3.'},
 {id:'z',n:'Mahunarke, semenke, orašasto',ic:'grains',per:'week',goal:4,unit:'puta',keys:['sociva','leblebija','pasulj','bundevineSem','humus','orasi','bademi','kikiriki','chia'],tip:'Izvor cinka: sočivo, leblebija ili šaka semenki.'}];
const NOT_VEG=['krompir','luk','batat'];
function immunityWeek(){const wk0=addDays(TODAY,-dIdx(TODAY)),days=[];for(let k=wk0;k<=TODAY;k=addDays(k,1))days.push(k);const cnt={},cdays=new Set();let custom=0;IMM.forEach(c=>cnt[c.id]=0);
  days.forEach(k=>{const d=S.days[k];if(!d||!d.eat)return;Object.values(d.eat).forEach(e=>{if(!e)return;if(e.custom||!e.id||e.id==='custom'){custom++;return}const m=LIB.find(x=>x.id===e.id);if(!m)return;const fr=e.fr<1?0.5:1,ks=m.i.map(x=>x.k);
    cnt.vp+=fr*ks.filter(k2=>N[k2]&&(N[k2][3]==='povrce'||N[k2][3]==='voce')&&!NOT_VEG.includes(k2)).length;
    if(ks.some(k2=>IMM[1].keys.includes(k2)))cdays.add(k);
    if(ks.some(k2=>IMM[2].keys.includes(k2)))cnt.f+=fr;
    if(m.tg.includes('riba'))cnt.r+=fr;
    if(ks.some(k2=>IMM[4].keys.includes(k2)))cnt.z+=fr})});
  cnt.c=cdays.size;return {cnt,n:days.length,custom}}
function immSuggest(cat){const ex=exclTags();const L=LIB.filter(m=>!m.tg.some(t=>ex.includes(t))&&!S.dis[m.id]&&(cat.id==='r'?m.tg.includes('riba'):cat.id==='vp'?m.i.filter(x=>N[x.k]&&(N[x.k][3]==='povrce'||N[x.k][3]==='voce')).length>=3:m.i.some(x=>cat.keys.includes(x.k))));
  const s=daysBetween('2024-01-01',TODAY);return [L[s%L.length],L[(s+3)%L.length]].filter((x,i,a)=>x&&a.indexOf(x)===i)}
function immunityCard(){const W=immunityWeek(),rows=IMM.map(c=>{const goal=c.per==='day'?c.goal*W.n:c.goal,v=W.cnt[c.id],pc=Math.min(1,v/goal);return {c,goal,v,pc}});
  const low=rows.filter(r=>r.pc<(r.c.per==='day'?0.8:Math.min(1,W.n/7+0.15))).sort((a,b)=>a.pc-b.pc)[0],sug=low?immSuggest(low.c):[];
  return `<section class="card imm">
   <div class="sec-title"><h2>Imunitet iz tanjira</h2><span class="small muted">ova nedelja</span></div>
   <p class="small muted imm-lead">Računa se iz obroka koje upišeš kao pojedene.</p>
   <div class="imm-rows">${rows.map(r=>`<div class="imm-r ${r.pc>=1?'ok':''}"><span class="imm-ic">${icd(r.c.ic)}</span>
     <div class="imm-t"><div class="imm-top"><b>${r.c.n}</b><span class="n"><b>${fmt1(Math.round(r.v*2)/2)}</b> / ${r.goal}</span></div>
     <div class="imm-bar"><i style="width:${r.pc*100}%"></i></div><small>${r.c.per==='day'?(r.c.id==='c'?'cilj: svaki dan':'cilj: 5 porcija dnevno'):`cilj: ${r.goal} ${r.c.unit} nedeljno`}</small></div>
     ${r.pc>=1?`<span class="imm-ok">${ic('check','sm')}</span>`:''}</div>`).join('')}</div>
   ${low?`<div class="imm-tip"><div class="imm-tip-h">${icd('lightbulb','sm')}<b>Ove nedelje fali: ${low.c.id==="c"?low.c.n:low.c.n.toLowerCase()}</b></div><p>${low.c.tip}</p>
     ${sug.length?`<div class="imm-sug">${sug.map(m=>`<button data-recipe="${m.id}">${av(m,m.t[0])}<span>${esc(m.n)}</span>${ic('caret-right','sm')}</button>`).join('')}</div>`:''}</div>`
     :`<div class="imm-tip ok"><div class="imm-tip-h">${icd('seal-check','sm')}<b>Ove nedelje si sve pokrio</b></div></div>`}
   ${W.custom?`<p class="small muted" style="margin-top:10px">${W.custom} ${W.custom===1?'obrok upisan':'obroka upisana'} ručno nije uračunat, jer mu ne znamo sastojke.</p>`:''}
  </section>`}
function healthCard(){return sleepCard()+immunityCard()}
