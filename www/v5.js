/* ================= v5: igrivost, sekcije, topliji izgled ================= */
S.ui=S.ui||{};S.tried=S.tried||{};S.frozen=S.frozen||{};S.shK=S.shK||{};if(S.shields==null)S.shields=0;
const icd=(n,c='')=>document.getElementById('d-'+n)?`<svg class="ic ${c}" aria-hidden="true"><use href="#d-${n}"/></svg>`:ic(n,c);
const fmtK=n=>R(n).toLocaleString('sr-Latn-RS');
const uiGet=(k,def)=>S.ui[k]||def;

/* ---------- Ikonice jela ---------- */
const ICON_CACHE={};
function mealIcon(m){if(ICON_CACHE[m.id])return ICON_CACHE[m.id];const n=norm(m.n);
  const RULES=[[/omlet|kajgan|jaj/,'egg'],[/kasa|palacink|chia|pahulj|ovsen/,'bowl-steam'],[/losos|oslic|tun|skus|pastrmk|sardin|rib/,'fish'],[/burger|pljeskavic/,'hamburger'],[/kokic/,'popcorn'],
    [/supa|corba|varivo|gulas|paprikas|socivo|pasulj|prebranac|grasak|boranij|leblebij/,'cooking-pot'],[/paprike|paprika sa|punjene/,'pepper'],[/sendvic|tost|hleb|proja|tortilj|kreker/,'bread'],[/avokad/,'avocado'],
    [/pilet|curet|batak|junet|svinj|raznj/,'fork-knife'],[/jogurt|kefir|kiselo mleko|smuti|puding|posni sir/,'bowl-food'],[/jabuk|krusk|pomorandz|kivi|banan|borovnic|jagod/,'orange'],
    [/orasi|badem|semenk/,'acorn'],[/sargarep|humus|salat|povrc|sopsk/,'carrot'],[/heljd|kinoa|kus|pirinac|rizot|testenin/,'grains']];
  for(const [re,i] of RULES)if(re.test(n))return ICON_CACHE[m.id]=i;return ICON_CACHE[m.id]='fork-knife'}
let av=(m,type,cls='')=>`<span class="av-food t-${type} ${cls}" aria-hidden="true">${icd(mealIcon(m))}</span>`;

/* ---------- Dnevnik: pamti id jela i prvo probanje ---------- */
function eatMeal(key,slot,frac){const d=dayOf(key);const pl=planFor(key)[slot];
  if(!frac){delete d.eat[slot]}else{const n=pl.meal.nt;d.eat[slot]={fr:frac,id:pl.meal.id,n:pl.meal.n,k:n[0]*frac,p:n[1]*frac,c:n[2]*frac,f:n[3]*frac};if(!S.tried[pl.meal.id]||S.tried[pl.meal.id]>key)S.tried[pl.meal.id]=key}save()}
function backfillTried(){Object.entries(S.days).forEach(([k,d])=>Object.values(d.eat||{}).forEach(e=>{if(!e)return;let id=e.id;if(!id){const m=LIB.find(x=>x.n===e.n);if(m){id=m.id;e.id=id}}if(id&&(!S.tried[id]||S.tried[id]>k))S.tried[id]=k}))}
const cookbookPool=()=>{const x=exclTags();return LIB.filter(m=>!m.tg.some(t=>x.includes(t)))};

/* ---------- Izazovi ---------- */
const Q_FOOD=[
 {id:'bf',t:'Pojedi doručak',ic:'egg',auto:d=>!!(d.eat&&d.eat[0])},
 {id:'all',t:'Upiši sve obroke danas',ic:'bowl-food',auto:d=>Object.keys(d.eat||{}).length>=(+S.p.mealsN||5),prog:d=>Object.keys(d.eat||{}).length+'/'+(+S.p.mealsN||5)},
 {id:'new',t:'Probaj jelo koje još nisi jeo',ic:'sparkle',hint:'Zameni jelo ili izaberi iz Kuvara',auto:(d,k)=>Object.values(d.eat||{}).some(e=>e&&e.id&&S.tried[e.id]===k)},
 {id:'cook',t:'Skuvaj obrok u režimu kuvanja',ic:'cooking-pot',hint:'U receptu: Kuvaj korak po korak',auto:d=>(d.cook||0)>0},
 {id:'veg',t:'Dve šake povrća uz ručak',ic:'carrot',manual:1},
 {id:'slow',t:'Jedi ručak polako, bar 15 minuta',ic:'clock',manual:1}];
const Q_HABIT=[
 {id:'w6',t:'Popij 6 čaša vode',ic:'drop',auto:d=>(d.water||0)>=1500,prog:d=>Math.min(6,Math.floor((d.water||0)/250))+'/6'},
 {id:'w8',t:'Popij 8 čaša vode',ic:'drop',auto:d=>(d.water||0)>=2000,prog:d=>Math.min(8,Math.floor((d.water||0)/250))+'/8'},
 {id:'walk20',t:'Hodaj 20 minuta',ic:'footprints',auto:d=>(d.walk||0)>=20,prog:d=>Math.min(20,d.walk||0)+'/20'},
 {id:'walk30',t:'Hodaj 30 minuta',ic:'footprints',auto:d=>(d.walk||0)>=30,prog:d=>Math.min(30,d.walk||0)+'/30'},
 {id:'ex',t:'Uradi vežbe za danas',ic:'barbell',auto:d=>!!d.ex},
 {id:'nosoda',t:'Dan bez gaziranog soka',ic:'beer-bottle',manual:1,cond:()=>!!sodaPlan(),block:d=>(d.soda||0)>0}];
const Q_LIGHT=[
 {id:'ci',t:'Jutarnji check-in',ic:'sun',auto:d=>!!d.ci},
 {id:'quiz',t:'Odgovori na pitanje dana',ic:'lightbulb',auto:d=>!!d.quiz},
 {id:'coffee',t:'Čaša vode uz svaku kafu',ic:'coffee',manual:1,cond:()=>+S.p.coffee>0},
 {id:'stand',t:'Ustani i prošetaj 5 puta tokom posla',ic:'person-simple-walk',manual:1,cond:()=>S.p.job==='sed'},
 {id:'nosnack',t:'Bez grickanja posle večere',ic:'moon',manual:1},
 {id:'sleep',t:'U krevet pre 23h',ic:'moon',manual:1},
 {id:'stairs',t:'Stepenice umesto lifta',ic:'footprints',manual:1}];
function questsFor(k){const d=S.days[k]||{};const r=rng(daysBetween('2024-01-01',k)*31+7);
  const pick=arr=>{const ok=arr.filter(q=>!q.cond||q.cond());return ok[Math.floor(r()*ok.length)]};
  return [pick(Q_FOOD),pick(Q_HABIT),pick(Q_LIGHT)].map(q=>{const blocked=q.block&&q.block(d);const done=!blocked&&(q.auto?!!q.auto(d,k):!!(d.q&&d.q[q.id]));return Object.assign({},q,{done,blocked,p:q.prog?q.prog(d):''})})}

/* ---------- Pitanje dana ---------- */
const QUIZ=[
 ['Koliko kalorija ima 1 g masti?',['4 kcal','7 kcal','9 kcal'],2,'Masti imaju 9 kcal po gramu, a proteini i ugljeni hidrati po 4. Zato ulje „od oka” najlakše izmakne kontroli.'],
 ['Koliko kalorija ima 1 g proteina?',['4 kcal','7 kcal','9 kcal'],0,'Proteini i ugljeni hidrati imaju po 4 kcal po gramu.'],
 ['Koliko kalorija ima 1 g alkohola?',['0 kcal','4 kcal','7 kcal'],2,'Alkohol ima 7 kcal po gramu, skoro kao mast, a pritom pojačava glad.'],
 ['Šta duže drži sitost?',['Čaša soka od jabuke','Jabuka','Šaka bombona'],1,'Cela jabuka ima vlakna i traži žvakanje, pa sitost traje duže nego posle soka sa istim kalorijama.'],
 ['Koja namirnica ima najviše proteina na 100 g?',['Pileći file','Kuvan pirinač','Banana'],0,'Pileći file ima oko 23 g proteina na 100 g, pirinač oko 3, a banana oko 1.'],
 ['Okvirno, koliko kalorija odgovara 1 kg masnog tkiva?',['oko 2.000','oko 7.700','oko 20.000'],1,'Okvirno pravilo je oko 7.700 kcal po kilogramu masti. Zato je realan tempo 0,5 do 1 kg nedeljno.'],
 ['Da li jelo posle 18h samo po sebi goji?',['Da, uvek','Ne, bitan je ukupan unos','Samo ako je voće'],1,'Telo računa ukupan unos u danu. Kasna obilna večera ipak može da pokvari san i smeta želucu.'],
 ['Koliko šećera ima limenka obične kole od 0,33 l?',['oko 10 g','oko 35 g','oko 60 g'],1,'Oko 35 g, odnosno oko 7 do 8 kašičica šećera u jednoj limenci.'],
 ['Šta je dobar izvor omega-3 masnih kiselina?',['Losos','Piletina','Krompir'],0,'Masna riba (losos, skuša, sardine) je najbolji izvor omega-3, korisnih za srce i holesterol.'],
 ['Šta posle obroka pomaže da šećer u krvi ne skoči naglo?',['Kratka šetnja','Ležanje','Desert'],0,'Već 10-ak minuta hoda posle obroka pomaže mišićima da iskoriste šećer iz krvi.'],
 ['Koliko vlakana dnevno se preporučuje odraslima?',['oko 5 g','oko 15 g','25 do 30 g'],2,'Preporuka je 25 do 30 g dnevno: povrće, mahunarke, integralne žitarice, voće.'],
 ['Koja namirnica ima najviše vlakana?',['Sočivo','Beli hleb','Beli pirinač'],0,'Šolja kuvanog sočiva ima oko 15 g vlakana, uz dosta proteina.'],
 ['Da li je smrznuto povrće manje vredno od svežeg?',['Da, mnogo','Slično je vredno','Nema vitamina'],1,'Smrzava se brzo posle berbe, pa zadrži većinu vitamina. Često je i jeftinije.'],
 ['Koja mera bez vage je najbolja za porciju mesa?',['Dlan','Prst','Pesnica sa dve ruke'],0,'Dlan (veličina i debljina) je oko 100 g mesa ili ribe.'],
 ['Gde se najčešće kriju trans masti?',['U industrijskim pecivima i grickalicama','U maslinovom ulju','U ribi'],0,'Industrijski prerađene masti u pecivima, keksu i grickalicama su najlošije masti za srce.'],
 ['Koliko vode otprilike čini telo odraslog čoveka?',['oko 30%','oko 60%','oko 90%'],1,'Oko 60% telesne mase je voda, zato i mali manjak tečnosti donosi umor i glavobolju.'],
 ['Šta najviše utiče na gubitak kilograma?',['Ukupan unos kalorija','Vreme obroka','Broj obroka'],0,'Ključ je deficit kalorija. Raspored obroka pomaže da ga lakše držiš.'],
 ['Za koliko vremena telo izbaci otprilike pola kofeina iz jedne kafe?',['za 1 sat','za oko 5 sati','za 24 sata'],1,'Za oko 5 sati, zato kafa posle 15h može da pokvari san.'],
 ['Koji vitamin telo stvara uz pomoć sunca?',['Vitamin C','Vitamin D','Vitamin B12'],1,'Vitamin D. Zimi ga kod nas mnogi imaju premalo, pa vredi proveriti nalaz.'],
 ['Šta od ovoga ima mnogo vitamina C?',['Paprika','Pirinač','Mleko'],0,'Paprika ima više vitamina C od pomorandže, posebno crvena.'],
 ['Koja užina duže drži sitost?',['Grčki jogurt','Keks','Sok'],0,'Grčki jogurt ima puno proteina, a proteini najduže drže sitost.'],
 ['Koliko proteina ima jedno jaje?',['oko 2 g','oko 6 do 7 g','oko 15 g'],1,'Jedno jaje ima oko 6 do 7 g kvalitetnih proteina.'],
 ['Šta pomaže kod zatvora?',['Vlakna i voda','Beli hleb','Manje vode'],0,'Vlakna uz dovoljno vode i kretanje pokreću creva.'],
 ['Koliko kalorija otprilike ima kašika ulja?',['oko 20','oko 90','oko 300'],1,'Oko 90 kcal. Tri kašike „od oka” su skoro cela užina.'],
 ['Koliko kalorija ima pivo od 0,5 l?',['oko 50','oko 215','oko 500'],1,'Oko 215 kcal, kao jedan manji obrok.'],
 ['Šta je dobar izvor kalcijuma?',['Jogurt','Jabuka','Beli pirinač'],0,'Mlečni proizvodi su najbolji izvor kalcijuma, važnog za kosti.'],
 ['Kako kratak san utiče na glad sutradan?',['Pojačava je','Smanjuje je','Nema uticaja'],0,'Posle kratkog sna raste hormon gladi, pa jače privlače slatko i masno.'],
 ['Koja aktivnost najmanje opterećuje kičmu i zglobove?',['Plivanje','Skakanje','Dizanje tereta iz pretklona'],0,'Voda nosi težinu tela, pa plivanje rasterećuje kičmu i kolena.'],
 ['Koji je zdrav tempo mršavljenja?',['0,5 do 1% težine nedeljno','5% težine nedeljno','3 kg svake nedelje'],0,'Taj tempo čuva mišiće i imunitet, a kilaža se ne vraća.'],
 ['Šta je „skriveni šećer”?',['Šećer dodat u gotove sosove, jogurte i pahuljice','Šećer u svežem voću','Šećer u mleku'],0,'Dodati šećer se krije u kečapu, voćnim jogurtima, žitaricama za doručak i sokovima.'],
 ['Koliko je jedna „šolja” u receptima ove aplikacije?',['100 ml','250 ml','500 ml'],1,'Šolja je 250 ml, kao šolja za čaj.'],
 ['Šta je bolje za doručak ako želiš energiju do ručka?',['Ovsena kaša i jaje','Kroasan i kafa','Samo kafa'],0,'Kombinacija vlakana i proteina daje stabilnu energiju bez naglog pada.']];
const quizIdx=k=>daysBetween('2024-01-01',k)%QUIZ.length;
function quizSheet(){const d=dayOf(),q=QUIZ[quizIdx(TODAY)],a=d.quiz;
  return `<div class="sheet-head"><div><div class="w">Pitanje dana · +10 listića</div><h2 id="sheetTitle">${esc(q[0])}</h2></div>${closeBtn}</div>
  <div class="qopts">${q[1].map((o,i)=>`<button class="qopt ${a?(i===q[2]?'ok':(i===a.a?'bad':'')):''}" data-qa="${i}" ${a?'disabled':''}><span>${esc(o)}</span>${a&&i===q[2]?ic('check','sm'):a&&i===a.a?ic('x','sm'):''}</button>`).join('')}</div>
  ${a?`<div class="tip ${a.ok?'':'soft-blue'}">${icd(a.ok?'seal-check':'lightbulb')}<div><b>${a.ok?'Tačno! +10 listića':'Skoro. +3 listića za trud'}</b><span>${esc(q[3])}</span></div></div><p class="small muted" style="margin-top:12px">Novo pitanje stiže sutra.</p>`:'<p class="small muted">Jedan pokušaj dnevno. Tačan odgovor donosi 10 listića.</p>'}`}

/* ---------- Listići i nivoi ---------- */
const LEVELS=[[0,'Seme','grains'],[80,'Klica','plant'],[250,'Izdanak','potted-plant'],[550,'Lala','flower-tulip'],[1000,'Cvet','flower'],[1700,'Lokvanj','flower-lotus'],[2600,'Mlado drvo','tree'],[3800,'Bor','tree-evergreen'],[5300,'Hrast','acorn'],[7500,'Šuma','tree-evergreen']];
function xpOfDay(k){const d=S.days[k];if(!d)return 0;let x=0;
  Object.values(d.eat||{}).forEach(e=>{if(e)x+=e.fr>=1?10:5});
  x+=Math.floor(Math.min(d.water||0,3000)/250)*2;x+=Math.floor(Math.min(d.walk||0,60)/2);
  if(d.ex)x+=10;if(d.ci)x+=5;x+=10*Math.min(2,d.cook||0);
  if(d.quiz)x+=d.quiz.ok?10:3;
  if(k>=(S.start||k)){const q=questsFor(k);x+=q.filter(z=>z.done).length*15;if(q.every(z=>z.done))x+=30}
  return x}
function totalXP(){let x=0;Object.keys(S.days).forEach(k=>x+=xpOfDay(k));x+=S.weights.length*5+Object.keys(S.ms||{}).length*25;return x}
function levelOf(xp){let i=0;while(i+1<LEVELS.length&&xp>=LEVELS[i+1][0])i++;
  if(i===LEVELS.length-1){const extra=Math.floor((xp-LEVELS[i][0])/3000);const base=LEVELS[i][0]+extra*3000;return {n:i+1+extra,name:extra?'Šuma '+(extra+1):LEVELS[i][1],icon:LEVELS[i][2],from:base,to:base+3000,xp}}
  return {n:i+1,name:LEVELS[i][1],icon:LEVELS[i][2],from:LEVELS[i][0],to:LEVELS[i+1][0],xp,next:LEVELS[i+1][1]}}

/* ---------- Niz i štit ---------- */
function streakInfo(){const ok=k=>(dayScore(k)||0)>=0.65;let n=0,k=TODAY,start=TODAY;if(!ok(k))k=addDays(k,-1);
  for(let i=0;i<999;i++){if(ok(k)){n++;start=k}else if(!S.frozen[k])break;k=addDays(k,-1)}return {n,start}}
function streak(){return streakInfo().n}
function updateFreezes(){const ok=k=>(dayScore(k)||0)>=0.65||!!S.frozen[k];const y=addDays(TODAY,-1),yy=addDays(TODAY,-2);let msg=null;
  if(!ok(y)&&S.shields>0&&ok(yy)&&(dayScore(yy)||0)>0&&y>=(S.start||y)){S.frozen[y]=true;S.shields--;msg='Štit je sačuvao tvoj niz za juče'}
  const si=streakInfo();for(let m=7;m<=si.n;m+=7){const key=si.start+':'+m;if(!S.shK[key]){S.shK[key]=1;if(S.shields<2){S.shields++;msg='Osvojio si štit za niz od '+m+' dana'}}}
  return msg}

/* ---------- Proslave ---------- */
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;const c=document.createElement('canvas');c.className='confetti';document.body.appendChild(c);
  const dpr=devicePixelRatio||1,W=innerWidth,H=innerHeight;c.width=W*dpr;c.height=H*dpr;const x=c.getContext('2d');x.scale(dpr,dpr);
  const cs=getComputedStyle(document.documentElement),cols=['--accent','--amber','--red','--blue'].map(v=>cs.getPropertyValue(v).trim()).concat(['#7AD39B']);
  const P=[...Array(140)].map(()=>({x:W/2+(Math.random()-.5)*90,y:H*.32,vx:(Math.random()-.5)*13,vy:-Math.random()*13-4,r:Math.random()*7+5,c:cols[Math.floor(Math.random()*cols.length)],a:Math.random()*6,va:(Math.random()-.5)*.35,s:Math.random()<.6}));
  const t0=performance.now();(function f(t){const e=t-t0;x.clearRect(0,0,W,H);P.forEach(p=>{p.vy+=.33;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.a+=p.va;x.save();x.translate(p.x,p.y);x.rotate(p.a);x.globalAlpha=Math.max(0,1-e/2400);x.fillStyle=p.c;
    if(p.s)x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);else{x.beginPath();x.arc(0,0,p.r/3,0,7);x.fill()}x.restore()});if(e<2400)requestAnimationFrame(f);else c.remove()})(t0)}
function showLevelUp(lv){confetti();hap('success');const o=document.createElement('div');o.className='lvlup';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');
  o.innerHTML=`<div class="box"><span class="plant-pot">${icd(lv.icon)}</span><div class="small muted" style="font-weight:700">Nivo ${lv.n}</div><h2>Tvoja biljka je sada ${esc(lv.name)}</h2><p class="muted">Raste svaki put kad se vratiš i upišeš dan. Samo tako nastavi.</p><button class="btn block" data-lvlok="1">Super</button></div>`;
  document.body.appendChild(o);o.addEventListener('click',e=>{if(e.target.closest('[data-lvlok]')||e.target===o)o.remove()})}
let celebrating=false;
function afterSave(){if(celebrating||!S.setup)return;celebrating=true;try{const lv=levelOf(totalXP());let dirty=false;
  if(S.lvlSeen==null){S.lvlSeen=lv.n;dirty=true}else if(lv.n>S.lvlSeen){S.lvlSeen=lv.n;dirty=true;setTimeout(()=>showLevelUp(lv),500)}
  const d=S.days[TODAY];if(d){const q=questsFor(TODAY);if(q.every(z=>z.done)&&!d.qb){d.qb=true;dirty=true;setTimeout(()=>{confetti();hap('success');toast('Svi izazovi! +30 listića bonusa')},350)}
    const n=+S.p.mealsN||5;if(Object.keys(d.eat||{}).length>=n&&!d.allc){d.allc=true;dirty=true;setTimeout(()=>{confetti();toast('Svi obroci za danas su upisani')},350)}}
  if(dirty)try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}finally{celebrating=false}}
save=(function(orig){return function(){orig();setTimeout(afterSave,0)}})(save);
closeCook=(function(orig){return function(done){if(done&&COOK){const d=dayOf();d.cook=(d.cook||0)+1}orig(done)}})(closeCook);

/* ---------- Tanjir ---------- */
const TYPE_VAR={d:'--amber',s:'--red',l:'--accent',v:'--blue'};
function plateSVG(pl,d){const n=pl.length,tot=pl.reduce((a,x)=>a+x.meal.nt[0],0)||1,cx=66,cy=66,r=52,gap=n>1?5:0;let a=-90;
  const arc=(a0,a1)=>{const p=(ang)=>[cx+r*Math.cos(ang*Math.PI/180),cy+r*Math.sin(ang*Math.PI/180)];const [x0,y0]=p(a0),[x1,y1]=p(a1);return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`};
  const seg=pl.map(x=>{const sw=x.meal.nt[0]/tot*360,a0=a+gap/2,a1=a+sw-gap/2;a+=sw;const e=d.eat[x.slot];const col=`var(${TYPE_VAR[x.type]})`;
    return `<path d="${arc(a0,a1)}" fill="none" stroke="var(--slice-empty)" stroke-width="18" stroke-linecap="round"/>${e?`<path d="${arc(a0,a1)}" fill="none" stroke="${col}" stroke-width="18" stroke-linecap="round" opacity="${e.fr<1?.55:1}" class="seg-in"/>`:''}`}).join('');
  return `<svg viewBox="0 0 132 132" role="img" aria-label="Tanjir dana"><circle cx="66" cy="66" r="38" fill="var(--surface)"/>${seg}</svg>`}

/* ---------- Danas ---------- */
function tile2(kind,label,icon,val,goal,frac,key,step,plus,over){
  return `<div class="tile ${kind} ${over?'over':''}"><div class="t-top">${kind==='water'?`<span class="glass" aria-hidden="true"><i style="height:${Math.min(100,(frac||0)*100)}%"></i></span>`:`<span class="t-ic">${icd(icon)}</span>`}<span>${label}</span></div>
  <div class="t-val">${val}<small> / ${goal}</small></div><div class="t-bar"><i style="width:${Math.min(100,(frac||0)*100)}%"></i></div>
  <div class="t-act"><button class="minus" data-trk="${key}" data-v="-${step}" aria-label="Oduzmi">${ic('minus','sm')}</button><button class="plus" data-trk="${key}" data-v="${step}">${plus}</button></div></div>`}
function questsCard(){const d=dayOf(),qs=questsFor(TODAY),done=qs.filter(q=>q.done).length,qa=d.quiz;
  return `<section class="card quests"><div class="sec-title"><h2>Današnji izazovi</h2><span class="pill ${done===3?'soft':'line'} n">${done}/3</span></div>
   ${qs.map(q=>`<div class="q ${q.done?'done':''}"><span class="qi2">${q.done?ic('check'):icd(q.ic)}</span><span class="qt"><b>${esc(q.t)}</b><small>${q.blocked?'Danas nije uspelo, sutra novi izazov':q.hint&&!q.done?esc(q.hint)+' · ':''}${q.blocked?'':'+15 listića'}</small></span>
     ${q.done?(q.manual?`<button class="qundo" data-qclaim="${q.id}" aria-label="Poništi">${ic('arrow-counter-clockwise','sm')}</button>`:'<span></span>'):q.manual&&!q.blocked?`<button class="qclaim" data-qclaim="${q.id}">Gotovo</button>`:`<span class="qp">${esc(q.p||'')}</span>`}</div>`).join('')}
   <div class="qbonus">${icd('gift')}<span>${done===3?'Bonus od 30 listića je tvoj!':'Sva tri izazova donose još 30 listića'}</span></div>
   <button class="quizrow ${qa?'done':''}" data-quiz="1"><span class="qi2">${icd(qa?(qa.ok?'seal-check':'lightbulb'):'question')}</span><span class="qt"><b>Pitanje dana</b><small>${qa?(qa.ok?'Tačno odgovoreno · +10':'Odgovoreno · +3'):'Jedno pitanje o ishrani · +10 listića'}</small></span>${ic('caret-right','sm')}</button></section>`}
function viewDanas(){
  const d=dayOf(),pl=planFor(TODAY),mt=macroT(),tot=dayTotals(),wg=waterT(),sp=sodaPlan(),wt=walkT();
  const next=pl.find(x=>!d.eat[x.slot]),left=mt.k-tot[0],eaten=Object.keys(d.eat).length;
  const h=new Date().getHours(),greet=h<11?'Dobro jutro':h<18?'Dobar dan':'Dobro veče';
  const lv=levelOf(totalXP()),st=streak();
  const tips=[['Prvo doručak, pa kafa','Kafa na prazan stomak iritira želudac i pojačava glad posle podne.'],['Čaša vode uz svaku kafu','Najlakši način da dođeš do cilja za vodu.'],['Užinu spakuj ujutru','Glad posle posla je trenutak kad se naručuje dostava.'],['Kuvaj duplo','Ostaci od ručka su sutrašnji obrok bez kuvanja.'],['Ustani na 45 minuta','Dva minuta hoda rasterećuju kičmu i troše kalorije.'],['Večera do 20h','Lakša i ranija večera pomaže stomaku i snu.'],['Ekran dalje sat pre spavanja','Bolji san znači manje gladi sutradan i jači imunitet.']];
  const tip=tips[(dIdx(TODAY)+weekNo())%tips.length];
  const mc=(lbl,v,mx,col)=>`<div class="mcap"><span>${lbl}</span><span class="tr"><i style="width:${mx?Math.min(100,v/mx*100):0}%;background:var(${col})"></i></span><span class="v">${R(v)}/${R(mx)} g</span></div>`;
  return `<header class="phead home"><div><div class="hello">${greet}${S.p.name?',':''}</div><h1>${S.p.name?esc(S.p.name.split(' ')[0]):'Tvoj dan'}</h1></div><button class="avatar" data-go="profil" aria-label="Profil">${S.p.name?esc(S.p.name.trim()[0].toUpperCase()):ic('user-circle')}</button></header>
  <div class="status">
    <button class="st-chip fire" data-gonag="navike">${icd('fire')}<b class="n">${st}</b><small>${st===1?'dan':'dana'} niz</small></button>
    <button class="st-chip lvl" data-gonag="nagrade">${icd(lv.icon)}<b>${esc(lv.name)}</b><small class="n">${fmtK(lv.xp)} listića</small></button>
    ${S.shields?`<button class="st-chip shield" data-gonag="navike" aria-label="Štitova: ${S.shields}">${icd('shield-check')}<b class="n">${S.shields}</b></button>`:''}
  </div>
  ${reportCard()}
  <section class="hero2" aria-label="Tanjir dana">
    <div class="plate">${plateSVG(pl,d)}<div class="pc"><b class="n">${eaten}/${pl.length}</b><span>obroka</span></div></div>
    <div style="min-width:0"><div class="big n">${fmtK(Math.abs(left))}<small>kcal</small></div><div class="sub">${left>=0?`ostalo od ${fmtK(mt.k)}`:`preko cilja od ${fmtK(mt.k)}`}</div>
      <div class="mcaps">${mc('Proteini',tot[1],mt.p,'--accent')}${mc('UH',tot[2],mt.c,'--amber')}${mc('Masti',tot[3],mt.f,'--red')}</div></div>
  </section>
  ${next?`<section class="card next2">${av(next.meal,next.type,'lg')}<div class="nx-body"><span class="lbl">Sledeće · ${TYPE_NAMES[next.type]} u ${next.time}</span>
    <button class="nc-name" data-meal-open="${next.slot}" data-key="${TODAY}">${esc(next.meal.n)}</button><span class="kc">${R(next.meal.nt[0])} kcal · ${R(next.meal.nt[1])} g proteina</span></div>
    <div class="row nx-btns"><button class="btn sm" data-eat="${next.slot}" data-fr="1">${ic('check','sm')}Pojeo sam</button><button class="btn ghost sm" data-eat="${next.slot}" data-fr="0.5">Pola</button><button class="btn ghost sm" data-swap="${next.slot}" data-key="${TODAY}">${ic('arrows-clockwise','sm')}Zameni</button></div></section>`
  :`<div class="tip">${icd('seal-check')}<div><b>Svi obroci za danas su upisani</b><span>Još samo voda i šetnja.</span></div></div>`}
  ${!d.ci&&h<14?checkinCard(d):''}
  <section class="tiles" aria-label="Brzo beleženje" style="grid-template-columns:repeat(${sp?3:2},1fr)">
    ${tile2('water','Voda','drop',litres(d.water),litres(wg)+' l',d.water/wg,'water',250,'+ čaša')}
    ${sp?tile2('cola','Gazirano','beer-bottle',d.soda,(sp.max||0)+' ml',sp.max?d.soda/sp.max:(d.soda?1:0),'soda',330,'+ 0,33',d.soda>sp.max):''}
    ${tile2('walk','Hod','footprints',d.walk,wt+' min',d.walk/wt,'walk',10,'+10 min')}
  </section>
  ${questsCard()}
  <section class="card">
    <div class="sec-title"><h2>Obroci danas</h2><button class="btn ghost sm" data-sheet="add">${ic('plus','sm')}Van plana</button></div>
    <div class="tl">${pl.map(x=>{const e=d.eat[x.slot];return `<div class="sw" data-slot="${x.slot}"><div class="sw-bg"><span class="sw-l">${ic('check','sm')}Pojeo sam</span><span class="sw-r">Zameni${ic('arrows-clockwise','sm')}</span></div>
      <div class="mrow ${e?'done':''} ${next&&x.slot===next.slot?'is-next':''}">${av(x.meal,x.type)}
        <button class="open" data-meal-open="${x.slot}" data-key="${TODAY}"><span class="w">${TYPE_NAMES[x.type]} · ${x.time}${e&&e.fr<1?' · pola':''}${S.fav[x.meal.id]?`<span class="fav-dot">${ic('heart-fill')}</span>`:''}${!S.tried[x.meal.id]?'<span class="newtag">novo</span>':''}</span><span class="nm">${esc(x.meal.n)}</span><span class="kc">${R(x.meal.nt[0])} kcal</span></button>
        <button class="tick ${e?'on':''} ${e&&e.fr<1?'half':''}" data-eat="${x.slot}" data-fr="${e?0:1}" aria-pressed="${!!e}" aria-label="${e?'Poništi':'Pojeo sam'}: ${esc(x.meal.n)}">${ic('check','sm')}</button></div></div>`}).join('')}
      ${d.extra.map((x,i)=>`<div class="mrow extra"><span class="av-food t-x" aria-hidden="true">${icd('cookie')}</span><div class="open"><span class="w">Van plana · ${esc(x.t||'')}</span><span class="nm">${esc(x.n)}</span><span class="kc">${R(x.k)} kcal</span></div><button class="tick del" data-delx="${i}" aria-label="Obriši ${esc(x.n)}">${ic('x','sm')}</button></div>`).join('')}
    </div>
    ${Object.keys(S.days).length<4?`<p class="swipe-hint">Prevuci obrok udesno da ga upišeš, ulevo da ga zameniš.</p>`:''}
  </section>
  ${!d.ci&&h>=14?'':''}
  ${sp&&d.soda>sp.max?`<div class="tip red">${ic('warning')}<div><b>Gazirano je danas preko plana</b><span>${esc(sp.tip)}</span></div></div>`:`<div class="tip">${icd('lightbulb')}<div><b>${esc(tip[0])}</b><span>${esc(tip[1])}</span></div></div>`}`;
}

/* ---------- Segmentirane sekcije ---------- */
function segtabs(group,items,cur){return `<div class="segtabs ${items.length>4?'scroll':''}" role="tablist">${items.map(([k,l,i])=>`<button role="tab" aria-selected="${cur===k}" class="${cur===k?'on':''}" data-seg2="${group}|${k}">${i?ic(i,'sm'):''}${l}</button>`).join('')}</div>`}

/* ---------- Napredak ---------- */
function weightCards(){const W=S.weights,cw=curW(),lost=W.length?W[0].w-cw:0,eta=etaDate(),mt=macroT(),rv=S.reviews[0];
  return `<section class="card">
    <div class="wbig"><div class="now"><b>${fmt1(cw)}</b><span> kg</span></div>
      <div class="delta">${W.length>1?`<span class="pill ${lost>=0?'soft':'red'} n">${lost>=0?'-':'+'}${fmt1(Math.abs(lost))} kg</span>`:''}<span class="pill line n">${ic('target','sm')}${S.p.goalW} kg</span></div></div>
    <div class="winput"><input type="number" id="wIn" inputmode="decimal" step="0.1" min="40" max="250" placeholder="Današnja težina u kg" aria-label="Današnja težina u kg"><button class="btn" id="wAdd">${ic('scales','sm')}Upiši</button></div>
    ${chartSVG()}
    <p class="small muted" style="margin-top:8px">${eta?`Ovim tempom do ${S.p.goalW} kg oko <b>${monthYear(eta)}</b>.`:'Cilj je dostignut.'}</p></section>
  <section class="card"><div class="sec-title"><h2>Prilagođavanje plana</h2><span class="pill soft">${PHASES[phase()][0]}</span></div>
    <div class="nums"><div><b class="n">${fmtK(mt.k)}</b><span>kcal dnevno</span></div><div><b class="n">${mt.p} g</b><span>proteini</span></div><div><b class="n">${fmt1(rateKg())}</b><span>kg nedeljno</span></div></div>
    <p class="small" style="margin-top:12px">${rv?esc(rv.msg):'Prva provera tempa je posle 7 dana. Ako kilaža stoji iako se držiš plana, kalorije se spuštaju; ako ide prebrzo, podižu se.'}</p>
    <button class="btn ghost sm" id="reviewNow" style="margin-top:12px">${ic('arrows-clockwise','sm')}Proveri tempo sada</button></section>
  <section class="card"><div class="sec-title"><h2>Obim struka</h2>${ic('ruler')}</div>
    <div class="winput" style="margin-top:0"><input type="number" id="waistIn" inputmode="decimal" step="0.5" placeholder="Obim u cm, u visini pupka" aria-label="Obim struka u cm"><button class="btn ghost" id="waistAdd">Upiši</button></div>
    ${S.waist.length?`<p class="small" style="margin-top:10px">Poslednje: <b class="n">${fmt1(S.waist[S.waist.length-1].v)} cm</b>${S.waist.length>1?`, od početka ${fmt1(S.waist[0].v-S.waist[S.waist.length-1].v)} cm manje`:''}.</p>`:`<p class="small muted" style="margin-top:10px">Struk pokazuje gubitak masti i kad vaga stoji. Meri jednom u dve nedelje.</p>`}</section>`}
function heatCard(){const end=addDays(TODAY,6-dIdx(TODAY)),start=addDays(end,-34),cells=[];for(let i=0;i<35;i++)cells.push(addDays(start,i));const si=streakInfo();
  return `<section class="card streak-card"><div class="streak-top"><span class="flame">${icd('fire')}</span><div><div class="streak-big"><b>${si.n}</b><span>${si.n===1?'dan':'dana'} zaredom</span></div>
     <div class="small muted">${si.n?'Upiši i danas obroke, vodu i hod da niz raste.':'Dobar dan je 65% plana: obroci, voda i hod.'}</div></div></div>
   <div class="shields">${[0,1].map(i=>`<span class="sh ${i<S.shields?'on':''}">${icd('shield-check')}</span>`).join('')}<span class="small muted">Štit sačuva niz ako propustiš jedan dan. Dobijaš ga na svakih 7 dana niza.</span></div>
   <div class="heat-head">${DAYS.map(d=>`<span>${d}</span>`).join('')}</div>
   <div class="heat">${cells.map(k=>k>TODAY?`<i class="fut"></i>`:S.frozen[k]?`<i class="frz" title="${k}">${icd('shield-check')}</i>`:`<i class="l${lvl(dayScore(k))} ${k===TODAY?'today':''}" title="${k}"></i>`).join('')}</div>
   <div class="heat-leg">Manje <i style="background:var(--sunk)"></i><i style="background:color-mix(in srgb,var(--accent) 25%,var(--sunk))"></i><i style="background:color-mix(in srgb,var(--accent) 50%,var(--sunk))"></i><i style="background:color-mix(in srgb,var(--accent) 75%,var(--sunk))"></i><i style="background:var(--accent)"></i> Više</div></section>`}
function habitBars(){const ks=[...Array(7)].map((_,i)=>addDays(TODAY,i-6));const wg=waterT(),wt=walkT();
  const row=(lbl,icon,col,vals,goal,fmt)=>`<div class="hb"><div class="hb-h"><span>${icd(icon)}${lbl}</span><span class="small muted">cilj ${fmt(goal)}</span></div><div class="hb-bars">${vals.map((v,i)=>`<div><i style="height:${Math.min(100,v/goal*100)}%;background:var(${col})" class="${v>=goal?'full':''}"></i><span class="${ks[i]===TODAY?'cur':''}">${DAYS[dIdx(ks[i])][0]}</span></div>`).join('')}</div></div>`;
  return `<section class="card"><h2 style="margin-bottom:12px">Voda i hod, 7 dana</h2>${row('Voda','drop','--blue',ks.map(k=>S.days[k]?S.days[k].water||0:0),wg,v=>litres(v)+' l')}${row('Hod','footprints','--accent',ks.map(k=>S.days[k]?S.days[k].walk||0:0),wt,v=>v+' min')}</section>`}
function healthCard(){return `<section class="card"><h2 style="margin-bottom:4px">Imunitet i umor</h2>
    <div class="checks">${[['analize','Analize krvi','KKS, šećer, holesterol, vitamin D, gvožđe i feritin, B12, TSH.'],['apneja','Hrkanje i umor pomeni lekaru','Pauze u disanju tokom sna su česte kod veće kilaže.'],['vitd','Vitamin D preko zime','Doza po nalazu, uz dogovor sa lekarom.'],['fizijatar','Vežbe pokaži fizijatru','Pre nego što ih radiš svaki dan.']].filter(x=>x[0]!=='fizijatar'||S.p.back).map(x=>`<label class="ck ${S.health[x[0]]?'done':''}"><span class="shop-item" style="padding:0"><input type="checkbox" data-health="${x[0]}" ${S.health[x[0]]?'checked':''} aria-label="${esc(x[1])}"></span><span><b>${esc(x[1])}</b><span>${esc(x[2])}</span></span></label>`).join('')}</div></section>`}
function plantCard(){const lv=levelOf(totalXP()),pct=Math.min(100,(lv.xp-lv.from)/(lv.to-lv.from)*100),tx=xpOfDay(TODAY);
  return `<section class="plant-hero"><span class="plant-pot">${icd(lv.icon)}</span><div class="small" style="font-weight:700;color:var(--accent-ink)">Nivo ${lv.n}</div><h2>${esc(lv.name)}</h2>
   <div class="lvl-bar" role="progressbar" aria-valuenow="${R(pct)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>
   <div class="row between" style="width:100%"><span class="small n">${fmtK(lv.xp)} listića</span><span class="small muted">${lv.next?`još ${fmtK(lv.to-lv.xp)} do: ${esc(lv.next)}`:`još ${fmtK(lv.to-lv.xp)} do sledećeg nivoa`}</span></div>
   <div class="small" style="font-weight:600">Danas si skupio ${tx} listića</div></section>
  <section class="card"><h2 style="margin-bottom:12px">Kako rastu listići</h2><div class="earn">
   ${[['Obrok po planu','+10'],['Čaša vode','+2'],['2 minuta hoda','+1'],['Vežbe za danas','+10'],['Izazov','+15'],['Sva 3 izazova','+30'],['Pitanje dana','+10'],['Kuvanje uz recept','+10'],['Jutarnji check-in','+5'],['Merenje kilaže','+5'],['Prekretnica','+25']].map(x=>`<div><span>${x[0]}</span><b class="n">${x[1]}</b></div>`).join('')}</div></section>`}
function cookbookCard(){const P=cookbookPool(),n=P.filter(m=>S.tried[m.id]).length;
  return `<section class="card"><div class="sec-title"><h2>Moj kuvar</h2><span class="pill soft n">${n}/${P.length}</span></div>
   <div class="lvl-bar" style="background:var(--sunk)"><i style="width:${n/P.length*100}%"></i></div>
   <p class="small muted" style="margin-top:10px">Svako novo jelo koje upišeš ide u kolekciju. Na 10, 25 i 50 probanih jela čekaju te prekretnice.</p>
   <button class="btn ghost sm" data-gokuvar="1" style="margin-top:10px">${icd('cooking-pot')}Otvori kuvar</button></section>`}
function viewNapredak(){const cur=uiGet('nap','kilaza');
  const body=cur==='kilaza'?weightCards():cur==='navike'?heatCard()+habitBars()+healthCard():cur==='ishrana'?macroCard()+insightsCard():plantCard()+badgesCard()+cookbookCard();
  return `${phead('Napredak','')}${segtabs('nap',[['kilaza','Kilaža'],['navike','Navike'],['ishrana','Ishrana'],['nagrade','Nagrade']],cur)}<div class="segbody">${body}</div>`}
msDefs=(function(orig){return function(){const t=Object.keys(S.tried).length,lv=levelOf(Object.keys(S.days).reduce((a,k)=>a+xpOfDay(k),0)).n;
  return orig().concat([['cook10','cooking-pot','10 jela','Kuvar raste',t>=10],['cook25','cooking-pot','25 jela','Pravi gurman',t>=25],['cook50','cooking-pot','50 jela','Majstor kuhinje',t>=50],['lvl5','flower','Nivo 5','Biljka je procvetala',lv>=5],['shield','shield-check','Prvi štit','Niz od 7 dana',Object.keys(S.shK).length>0]])}})(msDefs);
function badgesCard(){const ds=msDefs();const got=ds.filter(m=>S.ms[m[0]]).length;
  return `<section class="card"><div class="sec-title"><h2>Prekretnice</h2><span class="pill line n">${got}/${ds.length}</span></div>
   <div class="badges">${ds.map(m=>`<div class="badge ${S.ms[m[0]]?'got':''}"><span class="bdg">${icd(m[1])}</span><b>${esc(m[2])}</b><span>${S.ms[m[0]]?new Date(S.ms[m[0]]+'T12:00').toLocaleDateString('sr-Latn-RS',{day:'numeric',month:'short'}).replace(/\.$/,''):esc(m[3])}</span></div>`).join('')}</div></section>`}

/* ---------- Jelovnik: plan i kuvar ---------- */
function planView(){const wk0=addDays(TODAY,-dIdx(TODAY)),days=[...Array(7)].map((_,i)=>addDays(wk0,i));
  const pl=planFor(VIEWDAY),tot=pl.reduce((a,x)=>a.map((v,j)=>v+x.meal.nt[j]),[0,0,0,0,0]);
  return `<div class="days" role="tablist">${days.map(k=>`<button class="day ${k===VIEWDAY?'on':''} ${k===TODAY?'today':''}" data-day="${k}" role="tab" aria-selected="${k===VIEWDAY}"><b>${DAYS[dIdx(k)]}</b><span>${new Date(k+'T12:00').getDate()}.</span></button>`).join('')}</div>
  <section class="card"><div class="sec-title"><h2>${DAYN[dIdx(VIEWDAY)]}${VIEWDAY===TODAY?' <span class="pill soft" style="margin-left:6px;vertical-align:middle">danas</span>':''}</h2><span class="pill line n">${fmtK(tot[0])} kcal</span></div>
    <div class="tl">${pl.map(x=>`<div class="mrow">${av(x.meal,x.type)}<button class="open" data-meal-open="${x.slot}" data-key="${VIEWDAY}"><span class="w">${TYPE_NAMES[x.type]} · ${x.time}${!S.tried[x.meal.id]?'<span class="newtag">novo</span>':''}</span><span class="nm">${esc(x.meal.n)}</span><span class="kc">${R(x.meal.nt[0])} kcal · P ${R(x.meal.nt[1])} · UH ${R(x.meal.nt[2])} · M ${R(x.meal.nt[3])}</span></button>
      <button class="icon-btn" data-swap="${x.slot}" data-key="${VIEWDAY}" aria-label="Zameni ${esc(x.meal.n)}">${ic('arrows-clockwise','sm')}</button></div>`).join('')}</div></section>
  <div class="act-row"><button class="act-card" data-sheet="shop"><span class="bubble">${icd('gift')}</span><span><b>Kupovina</b><span>po danima</span></span></button>
    <button class="act-card" data-sheet="hands"><span class="bubble">${icd('heart')}</span><span><b>Mere bez vage</b><span>šaka, dlan, kašika</span></span></button></div>`}
const KF=[['sve','Sve'],['d','Doručak'],['s','Užina'],['l','Ručak'],['v','Večera'],['fav','Omiljena'],['new','Neprobana']];
function kuvarView(){const f=uiGet('kf','sve'),P=cookbookPool(),n=P.filter(m=>S.tried[m.id]).length;
  const list=P.filter(m=>f==='sve'||(f==='fav'?S.fav[m.id]:f==='new'?!S.tried[m.id]:m.t.includes(f))).filter(m=>!S.dis[m.id]||f==='sve');
  const share={d:.24,s:.1,l:.36,v:.2};
  return `<div class="kprog"><span class="kp-ic">${icd('cooking-pot')}</span><div style="flex:1"><b>Probao si ${n} od ${P.length} jela</b><div class="lvl-bar" style="background:var(--sunk);margin-top:6px"><i style="width:${n/P.length*100}%"></i></div></div></div>
   <div class="srch">${ic('magnifying-glass','sm')}<input type="search" id="kSearch" placeholder="Traži jelo ili namirnicu" aria-label="Traži jelo"></div>
   <div class="fchips" role="tablist">${KF.map(([k,l])=>`<button class="chip-t ${f===k?'on':''}" data-kf="${k}" role="tab" aria-selected="${f===k}">${l}</button>`).join('')}</div>
   ${list.length?`<div class="kgrid" id="kGrid">${list.map(m=>{const sm=scaleMeal(m,target()*share[m.t[0]]);return `<button class="kcard" data-recipe="${m.id}" data-s="${esc(norm(m.n+' '+m.i.map(it=>N[it.k][0]).join(' ')))}">
     ${av(m,m.t[0])}${S.tried[m.id]?`<span class="tried" aria-label="Probano">${ic('check','sm')}</span>`:''}<b>${esc(m.n)}</b><span class="km">${TYPE_NAMES[m.t[0]]} · ${R(sm.nt[0])} kcal${S.fav[m.id]?' · '+ic('heart-fill','sm'):''}</span></button>`}).join('')}</div>`:
   `<div class="empty">${icd(f==='fav'?'heart':'sparkle','lg')}<b>${f==='fav'?'Još nema omiljenih jela':'Sve si probao!'}</b><span>${f==='fav'?'Otvori jelo i dodirni „Volim ovo”.':'Svaka čast, kuvar je kompletan.'}</span></div>`}`}
function viewJelovnik(){const cur=uiGet('jel','plan'),mt=macroT();
  return `${phead('Jelovnik',`Cilj ${fmtK(mt.k)} kcal · ${S.p.mealsN} obroka dnevno`)}${segtabs('jel',[['plan','Plan'],['kuvar','Kuvar']],cur)}<div class="segbody">${cur==='plan'?planView():kuvarView()}</div>`}
let RS=null;
function recipeSheet(id){const m=LIB.find(x=>x.id===id),type=m.t[0],share={d:.24,s:.1,l:.36,v:.2},sm=scaleMeal(m,target()*share[type]),t=sm.nt;
  return `<div class="sheet-head"><div class="row" style="align-items:flex-start">${av(m,type,'lg')}<div><div class="w">${m.t.map(x=>TYPE_NAMES[x]).join(' ili ')}${S.tried[id]?' · probano':''}</div><h2 id="sheetTitle">${esc(m.n)}</h2></div></div>${closeBtn}</div>
  <div class="nut"><div><b>${R(t[0])}</b><span>kcal</span></div><div><b>${R(t[1])}</b><span>proteini</span></div><div><b>${R(t[2])}</b><span>UH</span></div><div><b>${R(t[3])}</b><span>masti</span></div><div><b>${R(t[4])}</b><span>vlakna</span></div></div>
  <div class="prefs"><button class="fav ${S.fav[id]?'on':''}" data-fav="${id}" aria-pressed="${!!S.fav[id]}">${ic(S.fav[id]?'heart-fill':'heart','sm')}${S.fav[id]?'Omiljeno':'Volim ovo'}</button><button class="dis ${S.dis[id]?'on':''}" data-dis="${id}" data-key="${TODAY}" data-slot="-1" aria-pressed="${!!S.dis[id]}">${ic(S.dis[id]?'thumbs-down-fill':'thumbs-down','sm')}${S.dis[id]?'Ne nudi više':'Ne sviđa mi se'}</button></div>
  <div class="block-lbl">Šta ti treba</div><div class="ingr">${sm.items.map(it=>`<div><span>${esc(shortName(it.k))}</span><span class="q">${esc(measure(it))}${S.grams?`<span class="g">${R(it.q*it.g)} g</span>`:''}</span></div>`).join('')}</div>
  <div class="block-lbl">Priprema</div><p class="prep">${esc(m.r)}</p>
  <div class="sheet-actions"><button class="btn block" data-place="${id}">${ic('plus','sm')}Stavi u današnji plan</button></div>`}
refreshMealSheet=(function(orig){return function(key,slot){if(RS&&!sheet.hidden&&sheetBody.querySelector('[data-place]')){sheetBody.innerHTML=recipeSheet(RS);return}orig(key,slot)}})(refreshMealSheet);
function placeRecipe(id){const m=LIB.find(x=>x.id===id),pl=planFor(TODAY),d=dayOf();
  const cand=pl.filter(x=>m.t.includes(x.type));const slot=(cand.find(x=>!d.eat[x.slot])||null);
  if(!slot){toast(cand.length?'Taj obrok je danas već upisan':'U današnjem planu nema mesta za ovo jelo');return}
  const prev=S.ovr[TODAY]&&S.ovr[TODAY][slot.slot];S.ovr[TODAY]=S.ovr[TODAY]||{};S.ovr[TODAY][slot.slot]=id;save();closeSheet();hap('medium');
  toast(TYPE_NAMES[slot.type]+' danas: '+m.n,()=>{if(prev)S.ovr[TODAY][slot.slot]=prev;else delete S.ovr[TODAY][slot.slot];save()});rerender()}

/* ---------- Trening ---------- */
function viewTrening(){const cur=uiGet('tr','danas'),d=dayOf(),w=weekNo(),wt=walkT(),tr=trainingToday(),b={none:30,some:40,reg:50}[S.p.move]||30;let body;
  if(cur==='danas')body=`${S.p.back&&!S.p.physioOk?`<div class="tip red">${ic('first-aid')}<div><b>Pre prvog treninga</b><span>Vežbe pokaži fizijatru. Prekini odmah ako se javi bol niz nogu, trnjenje ili slabost u nozi.</span></div></div>`:''}
   <section class="hero2 walkhero"><span class="av-food t-l lg">${icd('footprints')}</span><div><div class="small" style="font-weight:700;color:var(--accent-ink)">Nedelja ${w} · hodanje</div><div class="big n">${d.walk}<small>/ ${wt} min</small></div>
     <div class="row" style="margin-top:10px"><button class="icon-btn" data-trk="walk" data-v="-10" aria-label="Oduzmi 10 minuta">${ic('minus','sm')}</button><button class="btn sm" data-trk="walk" data-v="10">+10 min</button></div></div></section>
   <section class="card"><div class="sec-title"><h2>${esc(tr.title)}</h2>${tr.str?`<span class="pill soft">${icd('barbell')}snaga</span>`:''}</div>
    ${tr.ex.length?tr.ex.map((e,i)=>`<details class="ex"><summary><span class="num">${i+1}</span><span class="et"><b>${esc(e[0])}</b><span>${esc(e[1])}</span></span><span class="car">${ic('caret-right','sm')}</span></summary><p>${esc(e[2])}</p></details>`).join(''):`<p class="muted">${esc(tr.note)}</p>`}
    ${tr.ex.length?`<button class="btn ${d.ex?'':'ghost'} block" style="margin-top:14px" data-ex="1">${ic('check','sm')}${d.ex?'Urađeno danas, +10 listića':'Označi kao urađeno'}</button>`:''}
    ${tr.ex.length&&tr.note?`<p class="small muted" style="margin-top:10px">${esc(tr.note)}</p>`:''}</section>`;
  else if(cur==='nedelja')body=`<section class="card"><h2 style="margin-bottom:12px">Ova nedelja</h2>
    <div class="weekplan">${DAYS.map((dn,i)=>{const k=addDays(TODAY,i-dIdx(TODAY));const t=trainingToday(k);const dd=S.days[k];return `<div class="wp ${k===TODAY?'cur':''}"><b>${dn}</b><span>${t.str?ic('barbell','sm'):ic('footprints','sm')}</span>${dd&&dd.ex?`<em>${ic('check','sm')}</em>`:''}</div>`}).join('')}</div>
    <p class="small muted" style="margin-top:10px">Dani za snagu: ${(S.p.trainDays||[]).map(i=>DAYS[i]).join(', ')||'nisu izabrani'}. Menjaš ih u profilu.</p></section>
   <section class="card"><h2 style="margin-bottom:12px">Hodanje kroz nedelje</h2><div class="weeks">${[...Array(8)].map((_,i)=>{const m=Math.min(b+30,b+5*i);return `<div class="wk ${i+1===Math.min(w,8)?'cur':i+1<w?'past':''}"><span class="wn">Nedelja ${i+1}</span><b>${m} min dnevno</b><span class="wm">${R(m*105/100)*100} koraka</span></div>`}).join('')}</div>
    <p class="small muted" style="margin-top:10px">Može u delovima, npr. 10 minuta posle svakog obroka.</p></section>`;
  else body=`${S.p.back?`<section class="card"><h2 style="margin-bottom:12px">Za sada izbegavaj</h2><div class="avoid">${['Klasične trbušnjake i podizanje nogu iz ležećeg položaja','Pretklon sa teretom i dizanje teških stvari savijenih leđa','Uvrtanje trupa pod opterećenjem','Trčanje i skakanje dok kilaža ne padne','Sedenje duže od 45 minuta bez pauze'].map(t=>`<div>${ic('x','sm')}<span>${t}</span></div>`).join('')}</div></section>`:''}
   <section class="card"><h2 style="margin-bottom:12px">Mali trikovi</h2><div class="insights">${[['person-simple-walk','Telefoniraj u hodu','Svaki razgovor je par stotina koraka više.'],['clock','Ustani na 45 minuta','Dva minuta hoda rasterećuju kičmu.'],['footprints','Stepenice umesto lifta','Jedan sprat je oko 15 kcal i jače noge.'],['drop','Voda pre treninga','Čaša vode pre šetnje smanjuje umor.']].map(x=>`<div class="ins">${icd(x[0])}<div><b>${x[1]}</b><span>${x[2]}</span></div></div>`).join('')}</div></section>`;
  return `${phead('Trening',S.p.back?'Prilagođeno kičmi':'Po tvom profilu')}${segtabs('tr',[['danas','Danas'],['nedelja','Nedelja'],['saveti','Saveti']],cur)}<div class="segbody">${body}</div>`}

/* ---------- Profil u tabovima ---------- */
viewProfil=(function(orig){return function(){const cur=+uiGet('prof','0');let h=orig(),i=0;
  h=h.replace(/<section class="card form-sec">/g,()=>{const n=i++;return `<section class="card form-sec" ${n!==cur?'hidden':''}>`});
  h=h.replace('<section class="card"><div class="sec-title"><h2>Savetnik</h2>',`<section class="card" ${cur!==6?'hidden':''}><div class="sec-title"><h2>Savetnik</h2>`);
  h=h.replace('<section class="card"><h2 style="margin-bottom:12px">Podešavanja</h2>',`<section class="card" ${cur!==6?'hidden':''}><h2 style="margin-bottom:12px">Podešavanja</h2>`);
  const tabs=segtabs('prof',FORM.map((s,j)=>[String(j),s.sec]).concat([['6','Aplikacija']]),String(cur));
  const at=h.indexOf('<section class="card form-sec"');return h.slice(0,at)+tabs+'<div class="segbody">'+h.slice(at)+'</div>'}})(viewProfil);

/* ---------- Događaji ---------- */
function v5click(e){const t=e.target.closest('button,[data-seg2]');if(!t)return;const ds=t.dataset;let handled=true;
  if(ds.seg2){const [g,v]=ds.seg2.split('|');S.ui[g]=v;save();hap();const tabsY=(document.querySelector('.segtabs')||{}).offsetTop||0;render();app.firstElementChild.style.animation='none';const sb=document.querySelector('.segbody');if(sb)sb.classList.add('seg-in');if(window.scrollY>tabsY-8)window.scrollTo(0,Math.max(0,tabsY-8))}
  else if(ds.qclaim){const d=dayOf();d.q=d.q||{};d.q[ds.qclaim]=!d.q[ds.qclaim];save();hap(d.q[ds.qclaim]?'medium':'light');if(d.q[ds.qclaim])toast('Izazov ispunjen, +15 listića');rerender()}
  else if(ds.quiz){openSheet(quizSheet())}
  else if(ds.qa!==undefined){const d=dayOf();if(d.quiz)return;const q=QUIZ[quizIdx(TODAY)],a=+ds.qa;d.quiz={i:quizIdx(TODAY),a,ok:a===q[2]};save();hap(d.quiz.ok?'success':'medium');if(d.quiz.ok)confetti();sheetBody.innerHTML=quizSheet();rerender()}
  else if(ds.gonag){S.ui.nap=ds.gonag;go('napredak')}
  else if(ds.gokuvar){S.ui.jel='kuvar';go('jelovnik')}
  else if(ds.kf){S.ui.kf=ds.kf;save();rerender()}
  else if(ds.recipe){RS=ds.recipe;openSheet(recipeSheet(ds.recipe))}
  else if(ds.place){placeRecipe(ds.place)}
  else if(ds.mealOpen!==undefined){RS=null;handled=false}
  else handled=false;
  if(handled){e.stopImmediatePropagation();e.preventDefault()}}
app.addEventListener('click',v5click,true);sheet.addEventListener('click',v5click,true);
app.addEventListener('input',e=>{if(e.target.id==='kSearch'){const q=norm(e.target.value);document.querySelectorAll('#kGrid .kcard').forEach(c=>{c.hidden=!!q&&!c.dataset.s.includes(q)})}});

/* ---------- Podsetnik za niz ---------- */
scheduleReminders=(function(orig){return async function(on=true){await orig(on);if(!on)return;const LN=PL('LocalNotifications');if(!LN)return;
  try{const list=[];for(let i=0;i<7;i++){const key=addDays(iso(new Date()),i),at=new Date(key+'T20:30:00');if(at.getTime()>Date.now()+60000)list.push({id:5000+i,title:'Sačuvaj niz',body:'Upiši današnje obroke i vodu. Tvoja biljka te čeka.',schedule:{at,allowWhileIdle:true},smallIcon:'ic_stat_leaf',iconColor:'#12803E'})}
    if(list.length)await LN.schedule({notifications:list})}catch(e){}}})(scheduleReminders);

/* ---------- Novi dan ---------- */
(function(){const A=PL('App');if(!A)return;A.addListener('appStateChange',st=>{if(!st.isActive||!S.setup)return;const m=updateFreezes();if(m){save();setTimeout(()=>toast(m),600)}})})();

function detectBigText(){try{const sp=document.createElement('span');sp.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;font:16px Arial,sans-serif';sp.textContent='MMMMMMMMMM';document.body.appendChild(sp);
  const cv=document.createElement('canvas').getContext('2d');cv.font='16px Arial,sans-serif';const ratio=sp.getBoundingClientRect().width/cv.measureText('MMMMMMMMMM').width;sp.remove();
  document.body.classList.toggle('bigtext',ratio>1.12||innerWidth<340)}catch(e){}}
window.addEventListener('resize',detectBigText);
