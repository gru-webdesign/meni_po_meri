/* ================= POMOĆNE ================= */
const R=Math.round;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ic=(n,c='')=>`<svg class="ic ${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const iso=d=>{const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)};
const addDays=(key,n)=>{const d=new Date(key+'T12:00:00');d.setDate(d.getDate()+n);return iso(d)};
const daysBetween=(a,b)=>R((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
const dIdx=key=>{const g=new Date(key+'T12:00:00').getDay();return g===0?6:g-1};
const fmt1=v=>(Math.round(v*10)/10).toString().replace('.',',');
const litres=ml=>fmt1(ml/1000);
const monthYear=d=>d.toLocaleDateString('sr-Latn-RS',{month:'long',year:'numeric'}).replace(/\.$/,'');
const DAYN=['Ponedeljak','Utorak','Sreda','Četvrtak','Petak','Subota','Nedelja'];
const DAYS=['Pon','Uto','Sre','Čet','Pet','Sub','Ned'];
const TYPE_NAMES={d:'Doručak',s:'Užina',l:'Ručak',v:'Večera'};
let TODAY=iso(new Date());
const isNative=!!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform());
const PL=n=>(window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins[n])||null;

/* ================= STANJE ================= */
const DEFP={name:'',sex:'',age:'',height:'',weight:'',goalW:'',pace:'umeren',job:'sed',move:'none',trainDays:[0,2,4],bf:'08:00',
  back:false,stomach:false,chol:false,bp:false,sugar:false,gluten:false,lactose:false,physioOk:false,tired:false,healthNote:'',
  mealsN:5,noFish:false,noPork:false,veg:false,noNuts:false,dislikes:'',budget:'srednji',partner:'ne',partnerPct:0.75,
  waterNow:'mid',soda:0,coffee:2,sleep:7.5,alcohol:'retko'};
const DEF={v:4,setup:false,start:null,p:DEFP,days:{},weights:[],waist:[],adj:0,reviews:[],lastReview:null,ovr:{},chat:[],miss:[],shop:{},health:{},notif:false,theme:'auto',grams:false,updated:0};
const LS='meniPoMeri.v2';
let S=JSON.parse(JSON.stringify(DEF));
try{
  const raw=localStorage.getItem(LS);
  if(raw){const o=JSON.parse(raw);S=Object.assign({},DEF,o);S.p=Object.assign({},DEFP,o.p||{});}
  else{ const old=localStorage.getItem('meniPoMeri.v1');
    if(old){const o=JSON.parse(old);
      S.weights=o.weights||[];S.health=o.health||{};S.notif=!!o.notif;S.start=o.start||null;
      Object.entries(o.days||{}).forEach(([k,d])=>{S.days[k]={eat:{},extra:[],water:d.water||0,soda:d.cola||0,walk:d.walk||0,ex:!!d.ex}});
      if(S.weights.length)S.p.weight=S.weights[S.weights.length-1].w; if(o.age)S.p.age=o.age; if(o.goalW)S.p.goalW=o.goalW; if(o.partner)S.p.partnerPct=o.partner;
    }}
}catch(e){}
if(!S.start)S.start=TODAY;
function save(){S.updated=Date.now();try{localStorage.setItem(LS,JSON.stringify(S));}catch(e){}}
const dayOf=(k=TODAY)=>{const d=S.days[k]||(S.days[k]={eat:{},extra:[],water:0,soda:0,walk:0,ex:false});d.eat=d.eat||{};d.extra=d.extra||[];return d};
const weekNo=()=>Math.max(1,Math.floor(daysBetween(S.start,TODAY)/7)+1);

/* ================= OBRAČUN ================= */
const curW=()=>(!S.setup||!S.weights.length)?+S.p.weight:S.weights[S.weights.length-1].w;
const bmr=(w=curW())=>10*w+6.25*S.p.height-5*S.p.age+(S.p.sex==='m'?5:-161);
const actF=()=>({sed:1.2,stand:1.3,phys:1.45}[S.p.job]||1.2)+({none:0,some:0.08,reg:0.15}[S.p.move]||0);
const tdee=()=>bmr()*actF();
const leftKg=()=>curW()-S.p.goalW;
function phase(){const l=leftKg();if(l<=0.3)return 'odrzavanje';if(l<5)return 'zavrsnica';if(weekNo()<=2)return 'start';return 'gubitak'}
const PHASES={start:['Start','Prve dve nedelje: navike, voda i redovni obroci.'],gubitak:['Gubitak','Stabilan deficit, cilj je doslednost.'],zavrsnica:['Završnica','Blizu si cilja, tempo je namerno sporiji.'],odrzavanje:['Održavanje','Cilj je dostignut. Jedeš koliko trošiš.']};
function rateKg(){const l=leftKg();if(l<=0.3)return 0;let r=curW()*(S.p.pace==='brzi'?0.0075:0.005);r=Math.min(r,1);if(l<5)r*=0.6;return r}
const floorK=()=>R(Math.max(S.p.sex==='m'?1500:1200,bmr()*0.8));
function target(){const t=tdee();let def=rateKg()*7700/7;def=Math.min(def,t*0.25);const k=t-def+(phase()==='odrzavanje'?0:S.adj);return R(Math.max(floorK(),k)/10)*10}
function macroT(){const k=target();const p=R(clamp(1.8*S.p.goalW,1.4*curW()*0.9,2.2*S.p.goalW));const f=R(k*0.28/9);const c=Math.max(80,R((k-p*4-f*9)/4));return {k,p,c,f}}
function waterT(){let ml=clamp(33*curW(),2000,3500);if(S.p.waterNow==='low'){const w=weekNo();ml*=w===1?0.6:w===2?0.8:1}else if(S.p.waterNow==='mid'&&weekNo()===1)ml*=0.85;return R(ml/250)*250}
function sodaPlan(){const base=R((+S.p.soda||0)*1000);if(base<=0)return null;const w=weekNo();
  if(w===1)return {max:Math.max(330,R(base/2/10)*10),t:'Pola od dosadašnjeg',tip:'Drugu polovinu zameni Zero varijantom ili mineralnom vodom sa limunom.'};
  if(w===2)return {max:500,t:'Samo Zero, najviše 0,5 l',tip:'Obični gazirani sok više ne kupuj. Čaša vode pre svakog gaziranog.'};
  if(w===3)return {max:330,t:'Zero najviše 1 limenka',tip:'Samo uz ručak. Kofein posle 15h kvari san.'};
  return {max:0,t:'Gazirano samo vikendom',tip:'Jedna limenka Zero vikendom. Voda je osnovno piće.'}}
const walkT=()=>{const b={none:30,some:40,reg:50}[S.p.move]||30;return Math.min(b+30,b+5*(weekNo()-1))};
function etaDate(){const r=rateKg();if(r<=0)return null;let w=curW(),weeks=0;while(w>S.p.goalW+0.3&&weeks<200){let rr=w*(S.p.pace==='brzi'?0.0075:0.005);rr=Math.min(rr,1);if(w-S.p.goalW<5)rr*=0.6;w-=rr;weeks++}return new Date(Date.now()+weeks*7*864e5)}

/* ================= JELOVNIK ================= */
const SLOTS={3:['d','l','v'],4:['d','l','s','v'],5:['d','s','l','s','v']};
const SHARE={3:[.3,.4,.3],4:[.25,.37,.1,.28],5:[.24,.1,.36,.1,.2]};
const OFFS={3:[0,5.5,11],4:[0,5,8.5,11],5:[0,3,6,9,11.5]};
function exclTags(){const p=S.p,x=[];if(p.gluten)x.push('gluten');if(p.lactose)x.push('laktoza');if(p.noFish||p.veg)x.push('riba');if(p.noPork||p.veg)x.push('svinja');if(p.veg)x.push('meso');if(p.noNuts)x.push('orasasto');return x}
function pool(type){const x=exclTags();const all=LIB.filter(m=>m.t.includes(type));const ok=all.filter(m=>!m.tg.some(t=>x.includes(t)));return ok.length?ok:all}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shuffled(arr,seed){const a=arr.slice(),r=rng(seed);for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const weekIdx=key=>Math.floor(daysBetween('2024-01-01',key)/7);
const nut=it=>{const v=F[it.k],g=it.q*it.g/100;return [v[0]*g,v[1]*g,v[2]*g,v[3]*g,v[4]*g]};
const sumN=items=>items.reduce((a,it)=>{const n=nut(it);return a.map((x,j)=>x+n[j])},[0,0,0,0,0]);
function roundStep(q,st){return Math.max(st,Math.round(q/st)*st)}
function scaleMeal(m,kcal){const base=sumN(m.i)[0];const f=clamp(kcal/base,0.6,1.9);
  const items=m.i.map(it=>Object.assign({},it,{q:it.fix?it.q:roundStep(it.q*f,it.st)}));return {id:m.id,n:m.n,r:m.r,tg:m.tg,items,nt:sumN(items)}}
function timeAdd(hhmm,h){const [a,b]=hhmm.split(':').map(Number);let t=a*60+b+R(h*60);t=R(t/15)*15;return String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0')}
function planFor(key){
  const n=+S.p.mealsN||5, slots=SLOTS[n], share=SHARE[n], offs=OFFS[n], kt=target(), di=dIdx(key), wi=weekIdx(key);
  const bf=(di>=5)?timeAdd(S.p.bf,1):S.p.bf;
  let sCount=0;
  return slots.map((type,i)=>{
    const P=pool(type), ord=shuffled(P,wi*97+type.charCodeAt(0)*13+n);
    let rank=type==='s'?sCount++:0;
    let m=ord[(di+rank*3)%ord.length];
    const ov=S.ovr[key]&&S.ovr[key][i]; if(ov){const mm=LIB.find(x=>x.id===ov);if(mm)m=mm}
    return {slot:i,type,time:timeAdd(bf,offs[i]),meal:scaleMeal(m,kt*share[i])};
  });
}
function swapMeal(key,slot){const pl=planFor(key)[slot];const P=pool(pl.type);const i=P.findIndex(m=>m.id===pl.meal.id);
  const used=planFor(key).map(x=>x.meal.id);let nx=P[(i+1)%P.length];for(let k=1;k<P.length;k++){const c=P[(i+k)%P.length];if(!used.includes(c.id)){nx=c;break}}
  S.ovr[key]=S.ovr[key]||{};S.ovr[key][slot]=nx.id;save();return nx}
const QF=q=>{const w=Math.floor(q),fr=q-w;const f=fr>=0.74?'¾':fr>=0.49?'½':fr>=0.24?'¼':'';return (w?w:'')+(f||(w?'':'0'))};
function unitStr(u,q){const f=UNITS[u]||[u,u,u];if(q===1)return f[0];if(q<1||q%1!==0)return f[1];if(q>=2&&q<=4)return f[1];return f[2]}
const measure=it=>QF(it.q)+' '+unitStr(it.u,it.q);
const shortName=k=>N[k][0].split(',')[0].split('(')[0].replace(' bez glutena','').replace(' bez pšenice','').trim();

/* ================= DNEVNIK ================= */
function dayTotals(key=TODAY){const d=S.days[key];if(!d)return [0,0,0,0];let t=[0,0,0,0];
  Object.values(d.eat||{}).forEach(e=>{if(e)t=[t[0]+e.k,t[1]+e.p,t[2]+e.c,t[3]+e.f]});
  (d.extra||[]).forEach(e=>{t=[t[0]+e.k,t[1]+(e.p||0),t[2]+(e.c||0),t[3]+(e.f||0)]});return t}
function eatMeal(key,slot,frac){const d=dayOf(key);const pl=planFor(key)[slot];
  if(!frac){delete d.eat[slot];}else{const n=pl.meal.nt;d.eat[slot]={fr:frac,n:pl.meal.n,k:n[0]*frac,p:n[1]*frac,c:n[2]*frac,f:n[3]*frac}}save()}
function adherence(key){const d=S.days[key];if(!d)return 0;const n=+S.p.mealsN||5;return Object.values(d.eat||{}).reduce((a,e)=>a+(e?e.fr:0),0)/n}

/* ================= PRILAGOĐAVANJE ================= */
function slopeKgWeek(){const ws=S.weights.filter(x=>daysBetween(x.d,TODAY)<=21);if(ws.length<2)return null;
  const xs=ws.map(x=>daysBetween(ws[0].d,x.d)),ys=ws.map(x=>x.w);const n=xs.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;
  let num=0,den=0;xs.forEach((x,i)=>{num+=(x-mx)*(ys[i]-my);den+=(x-mx)**2});if(den===0)return null;return num/den*7}
function runReview(force){
  if(!force){if(daysBetween(S.start,TODAY)<7)return null;if(S.lastReview&&daysBetween(S.lastReview,TODAY)<7)return null}
  const sl=slopeKgWeek();const adh=[...Array(7)].map((_,i)=>adherence(addDays(TODAY,-i))).reduce((a,b)=>a+b)/7;
  const exp=rateKg();let msg,ch=0;
  if(phase()==='odrzavanje'){msg='Na cilju si. Plan je prebačen na održavanje: jedeš koliko trošiš i pratiš kilažu jednom nedeljno.';}
  else if(sl===null){msg='Za proveru tempa trebaju bar dva merenja u poslednje 3 nedelje. Izmeri se ujutru, pre doručka.';}
  else{const loss=-sl;
    if(adh<0.6){msg=`Ove nedelje je pojedeno ${R(adh*100)}% planiranih obroka. Kalorije ne menjam dok se plan ne prati redovnije, jer bi promena bila nagađanje.`;}
    else if(loss<exp*0.35){ch=-100;msg=`Gubiš oko ${fmt1(Math.max(0,loss))} kg nedeljno, a cilj je ${fmt1(exp)} kg. Pošto se držiš plana, cilj spuštam za 100 kcal.`;}
    else if(loss>Math.max(1.2,exp*1.6)){ch=100;msg=`Gubiš ${fmt1(loss)} kg nedeljno, što je prebrzo i troši mišiće. Cilj podižem za 100 kcal.`;}
    else msg=`Tempo je dobar: ${fmt1(loss)} kg nedeljno, uz ${R(adh*100)}% pojedenih obroka. Nastavljamo isto.`;}
  const before=target();
  if(ch){S.adj=clamp(S.adj+ch,-400,300);}
  const after=target(); if(ch&&after===before&&ch<0){msg+=' Već si na najnižem bezbednom unosu, zato ostaje isto. Više hoda pomaže više od manje hrane.';}
  const rv={d:TODAY,msg,ch:after-before,k:after};S.reviews.unshift(rv);S.reviews=S.reviews.slice(0,20);S.lastReview=TODAY;save();return rv}

/* ================= TRENING ================= */
const EX_BACK=[
 ['Disanje stomakom','5 minuta, ležeći na leđima sa savijenim kolenima','Ruka na stomak, udah kroz nos tako da se stomak podigne, polako izdah. Smanjuje napetost leđa i stres.'],
 ['Modifikovani pregib (McGill)','3 × 5, zadržavanje 8 s','Jedna noga ispružena, druga savijena, šake ispod donjeg dela leđa. Podigni samo glavu i ramena 2 do 3 cm, vrat ostaje prav. Bez klasičnih trbušnjaka.'],
 ['Ptica-pas (bird-dog)','3 × 6 po strani, zadržavanje 8 s','Na sve četiri. Istovremeno ispruži suprotnu ruku i nogu, leđa ostaju ravna kao sto. Polako nazad.'],
 ['Most za gluteus','2 × 10','Ležeći na leđima, stopala na podu. Podigni kukove stežući zadnjicu, bez izvijanja leđa.'],
 ['Mačka-kamila','1 × 8, sporo','Na sve četiri, lagano zaobli pa ispravi leđa, bez forsiranja. Samo za razgibavanje.']];
const EX_STR=[
 ['Čučanj do stolice','3 × 10','Sedni na stolicu i ustani bez pomoći ruku, leđa uspravna, kolena prate prste.'],
 ['Sklekovi uz sto ili zid','3 × 8','Telo pravo od glave do peta. Što je oslonac niži, to je teže.'],
 ['Iskorak unazad uz oslonac','2 × 8 po nozi','Drži se za naslon stolice, korak unazad i lagano spusti koleno.'],
 ['Most za gluteus','3 × 12','Stopala na podu, podigni kukove i zadrži 2 sekunde gore.'],
 ['Veslanje sa flašama','3 × 12','Dve flaše vode, blagi pretklon iz kukova uz oslonac jednom rukom na sto, povlači ka kuku.'],
 ['Plank na kolenima','3 × 20 s','Laktovi ispod ramena, telo pravo od kolena do glave. Diši normalno.']];
function trainingToday(key=TODAY){const di=dIdx(key);const strDay=(S.p.trainDays||[]).includes(di);const back=S.p.back;
  if(back&&!S.p.physioOk)return {title:'Hod i vežbe za leđa',ex:EX_BACK,str:false,note:'Vežbe snage dolaze kad fizijatar odobri. Označi to u profilu.'};
  if(strDay)return {title:back?'Lagana snaga i leđa':'Trening snage, 25 min',ex:back?EX_BACK.slice(1,4).concat(EX_STR.slice(0,2)):EX_STR,str:true,note:'Kad sve serije postanu lake, dodaj 2 ponavljanja.'};
  return {title:back?'Hod i vežbe za leđa':'Hod i istezanje',ex:back?EX_BACK:[],str:false,note:back?'':'Danas je dan za oporavak. Hod je dovoljan.'}}

/* ================= POGLEDI ================= */
let TAB='danas',VIEWDAY=TODAY,WIZ=-1,prevTab='danas';
const app=document.getElementById('app');
const phead=(t,sub,right='')=>`<header class="phead"><div><h1>${t}</h1>${sub?`<div class="sub">${sub}</div>`:''}</div><div class="row">${right}<button class="avatar" data-go="profil" aria-label="Profil">${S.p.name?esc(S.p.name.trim()[0].toUpperCase()):ic('user-circle')}</button></div></header>`;
function bar(label,val,max,cls=''){const pc=max?Math.min(100,val/max*100):0;return `<div class="mbar ${cls}"><div class="mb-top"><span>${label}</span><span class="n">${R(val)}<em>/${R(max)} g</em></span></div><div class="mb-track"><i style="width:${pc}%"></i></div></div>`}

function viewDanas(){
  const d=dayOf(), pl=planFor(TODAY), mt=macroT(), tot=dayTotals(), wg=waterT(), sp=sodaPlan(), wt=walkT();
  const next=pl.find(x=>!d.eat[x.slot]);
  const C=2*Math.PI*52, pct=Math.min(1,tot[0]/mt.k), left=mt.k-tot[0];
  const h=new Date().getHours(), greet=h<11?'Dobro jutro':h<18?'Dobar dan':'Dobro veče';
  const dateStr=new Date().toLocaleDateString('sr-Latn-RS',{weekday:'long',day:'numeric',month:'long'});
  const tr=trainingToday();
  const ph=PHASES[phase()];
  const tips=[['Prvo doručak, pa kafa','Kafa na prazan stomak iritira želudac i pojačava glad posle podne.'],['Čaša vode uz svaku kafu','Najlakši način da dođeš do cilja za vodu.'],['Užinu spakuj ujutru','Glad posle posla je trenutak kad se naručuje dostava.'],['Kuvaj duplo','Ostaci od ručka su sutrašnji obrok bez kuvanja.'],['Ustani na 45 minuta','Dva minuta hoda rasterećuju kičmu i troše kalorije.'],['Večera do 20h','Lakša i ranija večera pomaže stomaku i snu.'],['Ekran dalje sat pre spavanja','Bolji san znači manje gladi sutradan i jači imunitet.']];
  const tip=tips[(dIdx(TODAY)+weekNo())%tips.length];
  return `${phead(greet+(S.p.name?', '+esc(S.p.name.split(' ')[0]):''),esc(dateStr.charAt(0).toUpperCase()+dateStr.slice(1)),`<span class="pill soft">${ph[0]} · N${weekNo()}</span>`)}
  <section class="hero" aria-label="Dnevni pregled">
    <div class="ring" role="img" aria-label="${R(tot[0])} od ${mt.k} kalorija">
      <svg viewBox="0 0 120 120"><circle class="track" cx="60" cy="60" r="52" fill="none" stroke-width="10"/><circle class="val ${left<0?'over':''}" cx="60" cy="60" r="52" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-pct)}"/></svg>
      <div class="mid"><b>${left>=0?R(left):'+'+R(-left)}</b><span>${left>=0?'kcal preostalo':'kcal preko'}</span></div>
    </div>
    <div class="next">
      <div class="lbl">Pojedeno ${R(tot[0])} od ${mt.k} kcal</div>
      ${bar('Proteini',tot[1],mt.p,'p')}${bar('Ugljeni hidrati',tot[2],mt.c,'c')}${bar('Masti',tot[3],mt.f,'f')}
    </div>
  </section>
  ${next?`<section class="card next-card"><div class="nc-top"><span class="lbl">Sledeće · ${TYPE_NAMES[next.type]} u ${next.time}</span><span class="n small muted">${R(next.meal.nt[0])} kcal</span></div>
    <button class="nc-name" data-meal-open="${next.slot}" data-key="${TODAY}">${esc(next.meal.n)}${ic('caret-right','sm')}</button>
    <div class="row"><button class="btn sm" data-eat="${next.slot}" data-fr="1">${ic('check','sm')}Pojeo sam</button><button class="btn ghost sm" data-eat="${next.slot}" data-fr="0.5">Pola</button><button class="btn ghost sm" data-swap="${next.slot}" data-key="${TODAY}">${ic('arrows-clockwise','sm')}Zameni</button></div></section>`
  :`<div class="tip">${ic('check-circle')}<div><b>Svi obroci za danas su pojedeni</b><span>Još samo voda i kretanje.</span></div></div>`}
  <section class="tiles" aria-label="Brzo beleženje" style="grid-template-columns:repeat(${sp?3:2},1fr)">
    ${tile('Voda','drop','drop-ic',litres(d.water),litres(wg)+' l',d.water/wg,'water',250,'+ čaša','')}
    ${sp?tile('Gazirano','beer-bottle','cola-ic',d.soda,(sp.max||0)+' ml',sp.max?d.soda/sp.max:(d.soda?1:0),'soda',330,'+ 0,33','cola '+(d.soda>sp.max?'over':'')):''}
    ${tile('Hod','footprints','walk-ic',d.walk,wt+' min',d.walk/wt,'walk',10,'+10 min','')}
  </section>
  <section class="card">
    <div class="sec-title"><h2>Obroci danas</h2><button class="btn ghost sm" data-sheet="add">${ic('plus','sm')}Van plana</button></div>
    <div class="tl">${pl.map(x=>{const e=d.eat[x.slot];return `
      <div class="mrow ${e?'done':''} ${next&&x.slot===next.slot?'is-next':''}"><span class="time">${x.time}</span>
        <button class="open" data-meal-open="${x.slot}" data-key="${TODAY}"><span class="w">${TYPE_NAMES[x.type]}${e&&e.fr<1?' · pola':''}</span><span class="nm">${esc(x.meal.n)}</span><span class="kc">${R(x.meal.nt[0])} kcal · P ${R(x.meal.nt[1])} g</span></button>
        <button class="tick ${e?'on':''} ${e&&e.fr<1?'half':''}" data-eat="${x.slot}" data-fr="${e?0:1}" aria-pressed="${!!e}" aria-label="${e?'Poništi':'Pojeo sam'}: ${esc(x.meal.n)}">${ic('check','sm')}</button></div>`}).join('')}
      ${d.extra.map((x,i)=>`<div class="mrow extra"><span class="time">${esc(x.t||'')}</span><div class="open"><span class="w">Van plana</span><span class="nm">${esc(x.n)}</span><span class="kc">${R(x.k)} kcal${x.p?' · P '+R(x.p)+' g':''}</span></div><button class="tick del" data-delx="${i}" aria-label="Obriši ${esc(x.n)}">${ic('x','sm')}</button></div>`).join('')}
    </div>
  </section>
  ${sleepCard(d)}
  <section class="card train-card">
    <div class="sec-title"><h2>${esc(tr.title)}</h2><button class="btn ghost sm" data-go="trening">Detalji</button></div>
    <div class="row" style="flex-wrap:wrap;gap:8px"><span class="pill line">${ic('footprints','sm')}Hod ${wt} min</span>${tr.ex.length?`<span class="pill line">${ic('barbell','sm')}${tr.ex.length} vežbi</span>`:''}${d.ex?`<span class="pill soft">${ic('check','sm')}Urađeno</span>`:''}</div>
  </section>
  ${sp&&d.soda>sp.max?`<div class="tip red">${ic('warning')}<div><b>Gazirano je danas preko plana</b><span>${esc(sp.tip)}</span></div></div>`:`<div class="tip">${ic('lightbulb')}<div><b>${esc(tip[0])}</b><span>${esc(tip[1])}</span></div></div>`}`;
}
function tile(label,icon,icCls,val,goal,frac,key,step,plusLbl,cls){
  return `<div class="tile ${cls}"><div class="t-top"><span class="${icCls}">${ic(icon,'sm')}</span>${label}</div>
  <div class="t-val">${val}<small> / ${goal}</small></div><div class="t-bar"><i style="width:${Math.min(100,(frac||0)*100)}%"></i></div>
  <div class="t-act"><button class="minus" data-trk="${key}" data-v="-${step}" aria-label="Oduzmi">${ic('minus','sm')}</button><button class="plus" data-trk="${key}" data-v="${step}">${plusLbl}</button></div></div>`}
function sleepCard(d){
  if(d.sleep!=null&&d.energy!=null)return '';
  const sl=d.sleep!=null?d.sleep:S.p.sleep;
  return `<section class="card"><div class="sec-title"><h2>Kako si spavao?</h2>${ic('moon')}</div>
   <div class="row between" style="flex-wrap:wrap;gap:12px"><div class="stepper"><button class="icon-btn" data-sleep="-0.5" aria-label="Manje sati">${ic('minus','sm')}</button><b class="n">${fmt1(sl)} h</b><button class="icon-btn" data-sleep="0.5" aria-label="Više sati">${ic('plus','sm')}</button></div></div>
   <div class="block-lbl" style="margin-top:12px">Energija ujutru</div>
   <div class="seg5">${[1,2,3,4,5].map(v=>`<button data-energy="${v}" class="${d.energy===v?'on':''}">${['Iscrpljen','Umoran','Okej','Dobro','Odlično'][v-1]}</button>`).join('')}</div></section>`}

function viewJelovnik(){
  const wk0=addDays(TODAY,-dIdx(TODAY)), days=[...Array(7)].map((_,i)=>addDays(wk0,i));
  const pl=planFor(VIEWDAY), tot=pl.reduce((a,x)=>a.map((v,j)=>v+x.meal.nt[j]),[0,0,0,0,0]), mt=macroT();
  return `${phead('Jelovnik',`Cilj ${mt.k} kcal · ${S.p.mealsN} obroka dnevno`)}
  <div class="days" role="tablist">${days.map(k=>`<button class="day ${k===VIEWDAY?'on':''} ${k===TODAY?'today':''}" data-day="${k}" role="tab" aria-selected="${k===VIEWDAY}"><b>${DAYS[dIdx(k)]}</b><span>${new Date(k+'T12:00').getDate()}.</span></button>`).join('')}</div>
  <section class="card">
    <div class="sec-title"><h2>${DAYN[dIdx(VIEWDAY)]}${VIEWDAY===TODAY?' <span class="pill soft" style="margin-left:6px;vertical-align:middle">danas</span>':''}</h2></div>
    <div class="totals"><div><b>${R(tot[0])}</b><span>kcal</span></div><div><b>${R(tot[1])}</b><span>proteini g</span></div><div><b>${R(tot[2])}</b><span>UH g</span></div><div><b>${R(tot[3])}</b><span>masti g</span></div></div>
    <div class="tl" style="margin-top:10px">${pl.map(x=>`<div class="mrow"><span class="time">${x.time}</span>
      <button class="open" data-meal-open="${x.slot}" data-key="${VIEWDAY}"><span class="w">${TYPE_NAMES[x.type]}</span><span class="nm">${esc(x.meal.n)}</span><span class="kc">${R(x.meal.nt[0])} kcal · P ${R(x.meal.nt[1])} · UH ${R(x.meal.nt[2])} · M ${R(x.meal.nt[3])}</span></button>
      <button class="icon-btn" data-swap="${x.slot}" data-key="${VIEWDAY}" aria-label="Zameni ${esc(x.meal.n)}">${ic('arrows-clockwise','sm')}</button></div>`).join('')}</div>
  </section>
  <div class="act-row">
    <button class="act-card" data-sheet="shop"><span class="bubble">${ic('shopping-cart')}</span><span><b>Kupovina</b><span>za ovu nedelju</span></span></button>
    <button class="act-card" data-sheet="hands"><span class="bubble">${ic('hand-palm')}</span><span><b>Mere bez vage</b><span>šaka, dlan, kašika</span></span></button>
  </div>
  <div class="note">${ic('info','sm')}<span>Porcije se same prilagođavaju tvom dnevnom cilju. Jelovnik se menja svake nedelje i poštuje ono što si isključio u profilu${exclTags().length?': '+exclTags().map(t=>({gluten:'bez glutena',laktoza:'bez laktoze',riba:'bez ribe',svinja:'bez svinjetine',meso:'bez mesa',orasasto:'bez orašastih'}[t])).join(', '):''}.</span></div>`;
}

function viewTrening(){
  const d=dayOf(), w=weekNo(), wt=walkT(), tr=trainingToday(), b={none:30,some:40,reg:50}[S.p.move]||30;
  return `${phead('Trening',S.p.back?'Prilagođeno kičmi':'Po tvom profilu')}
  ${S.p.back&&!S.p.physioOk?`<div class="tip red">${ic('first-aid')}<div><b>Pre prvog treninga</b><span>Vežbe pokaži fizijatru. Prekini odmah ako se javi bol niz nogu, trnjenje ili slabost u nozi.</span></div></div>`:''}
  <section class="hero" style="grid-template-columns:1fr"><div class="next">
    <div class="lbl">Nedelja ${w} · hodanje</div><h2>${wt} minuta danas</h2>
    <div class="row between" style="flex-wrap:wrap;gap:12px"><div class="macro-line"><div><b>${d.walk} / ${wt}</b>minuta</div></div>
    <div class="row"><button class="icon-btn dark" data-trk="walk" data-v="-10" aria-label="Oduzmi 10 minuta">${ic('minus','sm')}</button><button class="btn sm" data-trk="walk" data-v="10">+10 min</button></div></div>
    <span class="small" style="color:var(--night-muted)">Može u delovima, npr. 10 minuta posle svakog obroka. Svake nedelje +5 minuta, do ${b+30}.</span>
  </div></section>
  <section class="card">
    <div class="sec-title"><h2>${esc(tr.title)}</h2>${tr.str?`<span class="pill soft">${DAYS[dIdx(TODAY)]}</span>`:''}</div>
    ${tr.ex.length?tr.ex.map((e,i)=>`<details class="ex"><summary><span class="num">${i+1}</span><span class="et"><b>${esc(e[0])}</b><span>${esc(e[1])}</span></span><span class="car">${ic('caret-right','sm')}</span></summary><p>${esc(e[2])}</p></details>`).join(''):`<p class="muted">${esc(tr.note)}</p>`}
    ${tr.ex.length?`<button class="btn ${d.ex?'':'ghost'} block" style="margin-top:14px" data-ex="1">${ic('check','sm')}${d.ex?'Urađeno danas':'Označi kao urađeno'}</button>`:''}
    ${tr.ex.length&&tr.note?`<p class="small muted" style="margin-top:10px">${esc(tr.note)}</p>`:''}
  </section>
  <section class="card"><h2 style="margin-bottom:12px">Nedelja</h2>
    <div class="weekplan">${DAYS.map((dn,i)=>{const k=addDays(TODAY,i-dIdx(TODAY));const t=trainingToday(k);const dd=S.days[k];return `<div class="wp ${k===TODAY?'cur':''}"><b>${dn}</b><span>${t.str?ic('barbell','sm'):ic('footprints','sm')}</span>${dd&&dd.ex?`<em>${ic('check','sm')}</em>`:''}</div>`}).join('')}</div>
    <p class="small muted" style="margin-top:10px">Dani za snagu: ${(S.p.trainDays||[]).map(i=>DAYS[i]).join(', ')||'nisu izabrani'}. Menjaš ih u profilu.</p>
  </section>
  ${S.p.back?`<section class="card"><h2 style="margin-bottom:12px">Za sada izbegavaj</h2>
    <div class="avoid">${['Klasične trbušnjake i podizanje nogu iz ležećeg položaja','Pretklon sa teretom i dizanje teških stvari savijenih leđa','Uvrtanje trupa pod opterećenjem','Trčanje i skakanje dok kilaža ne padne','Sedenje duže od 45 minuta bez pauze'].map(t=>`<div>${ic('x','sm')}<span>${t}</span></div>`).join('')}</div></section>`:''}`;
}

function viewNapredak(){
  const W=S.weights, cw=curW(), lost=S.p.weight&&W.length?W[0].w-cw:0, eta=etaDate(), mt=macroT(), rv=S.reviews[0];
  const last7=[...Array(7)].map((_,i)=>{const k=addDays(TODAY,i-6);return {k,t:dayTotals(k)[0],a:adherence(k),l:DAYS[dIdx(k)]}});
  const maxK=Math.max(mt.k*1.25,...last7.map(x=>x.t));
  const avgK=last7.filter(x=>x.t>0);
  return `${phead('Napredak','Merenje jednom nedeljno, ujutru pre doručka')}
  <section class="card">
    <div class="wbig"><div class="now"><b>${fmt1(cw)}</b><span> kg</span></div>
      <div class="delta">${W.length>1?`<span class="pill ${lost>=0?'soft':'red'} n">${lost>=0?'-':'+'}${fmt1(Math.abs(lost))} kg</span>`:''}<span class="pill line n">${ic('target','sm')}${S.p.goalW} kg</span></div></div>
    <div class="winput"><input type="number" id="wIn" inputmode="decimal" step="0.1" min="40" max="250" placeholder="Današnja težina u kg" aria-label="Današnja težina u kg"><button class="btn" id="wAdd">${ic('scales','sm')}Upiši</button></div>
    ${chartSVG()}
    <p class="small muted" style="margin-top:8px">${eta?`Ovim tempom do ${S.p.goalW} kg oko <b>${monthYear(eta)}</b>. Isprekidana linija je plan.`:'Cilj je dostignut.'}</p>
  </section>
  <section class="card">
    <div class="sec-title"><h2>Prilagođavanje plana</h2><span class="pill soft">${PHASES[phase()][0]}</span></div>
    <div class="nums"><div><b class="n">${mt.k}</b><span>kcal dnevno</span></div><div><b class="n">${mt.p} g</b><span>proteini</span></div><div><b class="n">${fmt1(rateKg())}</b><span>kg nedeljno cilj</span></div></div>
    <p class="small" style="margin-top:12px">${rv?esc(rv.msg):'Prva provera tempa je posle 7 dana. Plan se proverava jednom nedeljno: ako kilaža stoji iako se držiš plana, kalorije se spuštaju; ako ide prebrzo, podižu se.'}</p>
    <p class="small muted" style="margin-top:6px">${esc(PHASES[phase()][1])} Kako kilaža pada, potrošnja se preračunava i porcije se same smanjuju.</p>
    <button class="btn ghost sm" id="reviewNow" style="margin-top:12px">${ic('arrows-clockwise','sm')}Proveri tempo sada</button>
  </section>
  <section class="card">
    <div class="sec-title"><h2>Kalorije, 7 dana</h2>${avgK.length?`<span class="pill line n">prosek ${R(avgK.reduce((a,b)=>a+b.t,0)/avgK.length)}</span>`:''}</div>
    <div class="kbars">${last7.map(x=>`<div class="kb"><div class="kb-col"><i class="${x.t>mt.k*1.05?'over':''}" style="height:${x.t/maxK*100}%"></i><s style="bottom:${mt.k/maxK*100}%"></s></div><span class="${x.k===TODAY?'cur':''}">${x.l}</span></div>`).join('')}</div>
    <p class="small muted" style="margin-top:8px">Linija je tvoj cilj od ${mt.k} kcal.</p>
  </section>
  <section class="card">
    <div class="sec-title"><h2>Obim struka</h2>${ic('ruler')}</div>
    <div class="winput" style="margin-top:0"><input type="number" id="waistIn" inputmode="decimal" step="0.5" placeholder="Obim u cm, u visini pupka" aria-label="Obim struka u cm"><button class="btn ghost" id="waistAdd">Upiši</button></div>
    ${S.waist.length?`<p class="small" style="margin-top:10px">Poslednje: <b class="n">${fmt1(S.waist[S.waist.length-1].v)} cm</b>${S.waist.length>1?`, od početka ${fmt1(S.waist[0].v-S.waist[S.waist.length-1].v)} cm manje`:''}.</p>`:`<p class="small muted" style="margin-top:10px">Struk pokazuje gubitak masti i kad vaga stoji. Meri jednom u dve nedelje.</p>`}
  </section>
  <section class="card"><h2 style="margin-bottom:4px">Imunitet i umor</h2>
    <div class="checks">${[['analize','Analize krvi','KKS, šećer, holesterol, vitamin D, gvožđe i feritin, B12, TSH.'],['apneja','Hrkanje i umor pomeni lekaru','Pauze u disanju tokom sna su česte kod veće kilaže.'],['vitd','Vitamin D preko zime','Doza po nalazu, uz dogovor sa lekarom.'],['fizijatar','Vežbe pokaži fizijatru','Pre nego što ih radiš svaki dan.']].filter(x=>x[0]!=='fizijatar'||S.p.back).map(x=>`<label class="ck ${S.health[x[0]]?'done':''}"><span class="shop-item" style="padding:0"><input type="checkbox" data-health="${x[0]}" ${S.health[x[0]]?'checked':''} aria-label="${esc(x[1])}"></span><span><b>${esc(x[1])}</b><span>${esc(x[2])}</span></span></label>`).join('')}</div></section>`;
}
function chartSVG(){
  const W=S.weights;if(!W.length)return '';
  const w=340,h=170,p={l:30,r:10,t:12,b:20};
  const start=new Date((W[0].d<S.start?W[0].d:S.start)+'T12:00').getTime(), end=Math.max(Date.now(),new Date(W[W.length-1].d+'T12:00').getTime())+21*864e5;
  const pts=W.map(x=>({t:new Date(x.d+'T12:00').getTime(),w:x.w}));
  const r0=pts[0].w*(S.p.pace==='brzi'?0.0075:0.005);
  const plan=[{t:pts[0].t,w:pts[0].w},{t:end,w:Math.max(S.p.goalW,pts[0].w-(end-pts[0].t)/864e5/7*Math.min(1,r0))}];
  const all=[...pts.map(x=>x.w),...plan.map(x=>x.w)];const lo=Math.floor(Math.min(...all)-1),hi=Math.ceil(Math.max(...all)+1);
  const X=t=>p.l+(t-start)/(end-start)*(w-p.l-p.r),Y=v=>p.t+(hi-v)/(hi-lo)*(h-p.t-p.b);
  const ticks=[lo,R((lo+hi)/2),hi];
  const line=pts.map((x,i)=>(i?'L':'M')+X(x.t).toFixed(1)+' '+Y(x.w).toFixed(1)).join(' ');
  const area=pts.length>1?line+` L${X(pts[pts.length-1].t).toFixed(1)} ${h-p.b} L${X(pts[0].t).toFixed(1)} ${h-p.b} Z`:'';
  const last=pts[pts.length-1];
  return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Grafikon težine">
   ${ticks.map(v=>`<line x1="${p.l}" x2="${w-p.r}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)"/><text x="${p.l-6}" y="${Y(v)+4}" text-anchor="end" font-size="10" font-family="var(--mono)" fill="var(--muted)">${v}</text>`).join('')}
   <line x1="${X(plan[0].t)}" y1="${Y(plan[0].w)}" x2="${X(plan[1].t)}" y2="${Y(plan[1].w)}" stroke="var(--muted)" stroke-dasharray="4 5" stroke-width="1.5"/>
   ${area?`<path d="${area}" fill="var(--accent)" opacity=".12"/>`:''}
   <path d="${line}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
   <circle cx="${X(last.t)}" cy="${Y(last.w)}" r="5.5" fill="var(--surface)" stroke="var(--accent)" stroke-width="2.5"/></svg>`}

/* ================= PROFIL ================= */
const FORM=[
 {sec:'Osnovno',sub:'Iz ovoga se računa koliko energije trošiš.',f:[
   {id:'name',l:'Ime',t:'text',ph:'Kako da te zovem'},
   {id:'sex',l:'Pol',t:'seg',o:[['m','Muški'],['z','Ženski']],req:1},
   {id:'age',l:'Godine',t:'num',min:16,max:90,ph:'npr. 35',req:1},{id:'height',l:'Visina (cm)',t:'num',min:130,max:220,ph:'npr. 178',req:1},
   {id:'weight',l:'Trenutna težina (kg)',t:'num',min:40,max:250,step:0.1,ph:'npr. 92,5',req:1}]},
 {sec:'Cilj',sub:'Tempo određuje veličinu deficita. Brže od 1 kg nedeljno ne ide.',f:[
   {id:'goalW',l:'Ciljna težina (kg)',t:'num',min:40,max:200,step:0.5,ph:'npr. 80',req:1},
   {id:'pace',l:'Tempo',t:'seg',o:[['umeren','Umereno'],['brzi','Brže']],help:'Umereno je 0,5% telesne težine nedeljno, brže 0,75%.'}]},
 {sec:'Aktivnost',sub:'Posao i kretanje menjaju potrošnju i plan hodanja.',f:[
   {id:'job',l:'Posao',t:'seg',o:[['sed','Sedeći'],['stand','Stojeći'],['phys','Fizički']]},
   {id:'move',l:'Kretanje sada',t:'seg',o:[['none','Skoro nimalo'],['some','Malo'],['reg','Redovno']]},
   {id:'trainDays',l:'Dani za vežbe snage',t:'days'},
   {id:'bf',l:'Doručak radnim danima u',t:'select',o:['06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00'].map(x=>[x,x])}]},
 {sec:'Zdravlje',sub:'Jelovnik i trening izbegavaju ono što ti ne prija. Ovo ne zamenjuje lekara.',f:[
   {id:'_h',l:'Šta se odnosi na tebe',t:'chips',o:[['back','Diskus hernija ili kičma'],['stomach','Osetljiv želudac'],['chol','Povišen holesterol'],['bp','Povišen pritisak'],['sugar','Povišen šećer'],['gluten','Gluten mi ne prija'],['lactose','Laktoza mi ne prija'],['tired','Budim se umoran']]},
   {id:'physioOk',l:'Fizijatar je odobrio vežbe snage',t:'check',show:()=>S.p.back},
   {id:'healthNote',l:'Nešto drugo',t:'text',ph:'npr. alergija, lekovi'}]},
 {sec:'Ishrana',sub:'Broj obroka i isključenja menjaju jelovnik.',f:[
   {id:'mealsN',l:'Obroka dnevno',t:'seg',o:[['3','3'],['4','4'],['5','5']]},
   {id:'_d',l:'Ne jedem',t:'chips',o:[['noFish','Ribu'],['noPork','Svinjetinu'],['veg','Meso uopšte'],['noNuts','Orašaste plodove']]},
   {id:'dislikes',l:'Ne volim (savetnik pamti)',t:'text',ph:'npr. pečurke, tikvice'},
   {id:'partner',l:'Kuvaš i za još nekog',t:'seg',o:[['ne','Samo za sebe'],['da','I za partnera']]},
   {id:'partnerPct',l:'Partnerova porcija',t:'select',o:[['0.6','60% moje'],['0.75','75% moje'],['0.9','90% moje'],['1','Ista kao moja'],['1.15','115%, veća od moje'],['1.25','125%, veća od moje'],['1.4','140%, veća od moje']],help:'Ako partner ima veće potrebe (npr. muškarac uz ženski profil), izaberi više od 100%.',show:()=>S.p.partner==='da'}]},
 {sec:'Navike',sub:'Odavde kreće plan za vodu, gazirano i san.',f:[
   {id:'waterNow',l:'Vode piješ sada',t:'seg',o:[['low','Manje od 1 l'],['mid','1 do 2 l'],['ok','Više od 2 l']]},
   {id:'soda',l:'Gaziranih sokova dnevno (litara)',t:'num',min:0,max:5,step:0.1},
   {id:'coffee',l:'Kafa dnevno (šolja)',t:'num',min:0,max:12},
   {id:'sleep',l:'Spavaš prosečno (sati)',t:'num',min:3,max:12,step:0.5},
   {id:'alcohol',l:'Alkohol',t:'seg',o:[['ne','Ne pijem'],['retko','Par puta mesečno'],['cesto','Nedeljno']]}]}
];
function fieldHTML(f){
  if(f.show&&!f.show())return '';
  const v=S.p[f.id];
  if(f.t==='text')return `<label class="fld" for="f_${f.id}"><span>${f.l}</span><input type="text" id="f_${f.id}" data-pf="${f.id}" value="${esc(v)}" placeholder="${esc(f.ph||'')}"></label>`;
  if(f.t==='num')return `<label class="fld" for="f_${f.id}"><span>${f.l}${f.req?' *':''}</span><input type="number" inputmode="decimal" id="f_${f.id}" data-pf="${f.id}" data-num="1" value="${v==null?'':v}" min="${f.min}" max="${f.max}" step="${f.step||1}" placeholder="${esc(f.ph||'')}"></label>`;
  if(f.t==='select')return `<label class="fld" for="f_${f.id}"><span>${f.l}</span><select id="f_${f.id}" data-pf="${f.id}">${f.o.map(o=>`<option value="${o[0]}" ${String(v)===String(o[0])?'selected':''}>${o[1]}</option>`).join('')}</select>${f.help?`<small class="muted">${f.help}</small>`:''}</label>`;
  if(f.t==='seg')return `<div class="fld"><span>${f.l}${f.req?' *':''}</span><div class="seg" role="radiogroup" aria-label="${esc(f.l)}">${f.o.map(o=>`<button type="button" role="radio" aria-checked="${String(v)===o[0]}" class="${String(v)===o[0]?'on':''}" data-seg="${f.id}" data-v="${o[0]}">${o[1]}</button>`).join('')}</div>${f.help?`<small class="muted">${f.help}</small>`:''}</div>`;
  if(f.t==='chips')return `<div class="fld"><span>${f.l}</span><div class="chips">${f.o.map(o=>`<button type="button" aria-pressed="${!!S.p[o[0]]}" class="chip-t ${S.p[o[0]]?'on':''}" data-flag="${o[0]}">${S.p[o[0]]?ic('check','sm'):''}${o[1]}</button>`).join('')}</div></div>`;
  if(f.t==='days')return `<div class="fld"><span>${f.l}</span><div class="chips days7">${DAYS.map((d,i)=>`<button type="button" aria-pressed="${(v||[]).includes(i)}" class="chip-t ${(v||[]).includes(i)?'on':''}" data-dayi="${i}">${d}</button>`).join('')}</div></div>`;
  if(f.t==='check')return `<label class="toggle" for="f_${f.id}">${f.l}<input type="checkbox" class="switch" id="f_${f.id}" data-pf="${f.id}" data-bool="1" ${v?'checked':''}></label>`;
  return '';
}
function numbersCard(){const mt=macroT(),eta=etaDate();return `<section class="card summary">
  <h2 style="margin-bottom:12px">Tvoji brojevi</h2>
  <div class="nums"><div><b class="n">${mt.k}</b><span>kcal dnevno</span></div><div><b class="n">${mt.p} g</b><span>proteini</span></div><div><b class="n">${litres(waterT())} l</b><span>voda</span></div>
  <div><b class="n">${R(tdee())}</b><span>potrošnja kcal</span></div><div><b class="n">${fmt1(rateKg())}</b><span>kg nedeljno</span></div><div><b class="n">${walkT()}'</b><span>hod dnevno</span></div></div>
  <p class="small muted" style="margin-top:12px">UH ${mt.c} g i masti ${mt.f} g dnevno. ${eta?'Do cilja oko '+monthYear(eta)+'.':'Cilj je dostignut, plan je na održavanju.'} Najniži unos koji plan dozvoljava je ${floorK()} kcal.</p></section>`}
function viewProfil(){
  return `<header class="phead"><div><button class="back" data-go="${prevTab}">${ic('caret-left','sm')}Nazad</button><h1>Profil</h1><div class="sub">Sve u aplikaciji se računa odavde</div></div></header>
  ${numbersCard()}
  ${FORM.map(s=>`<section class="card form-sec"><h2>${s.sec}</h2><p class="small muted" style="margin:2px 0 14px">${s.sub}</p><div class="fields">${s.f.map(fieldHTML).join('')}</div></section>`).join('')}
  <section class="card"><div class="sec-title"><h2>Savetnik</h2><span class="pill line n">${(S.miss||[]).length} bez odgovora</span></div>
    <p class="small muted">Pitanja na koja savetnik nije znao odgovor beleže se ovde. Kopiraj ih i pošalji da se dopune u bazu.</p>
    ${(S.miss||[]).length?`<div class="misslist">${S.miss.slice(-8).reverse().map(m=>`<div>${esc(m.q)}</div>`).join('')}</div><div class="row" style="flex-wrap:wrap;margin-top:12px"><button class="btn ghost sm" id="missCopy">${ic('copy','sm')}Kopiraj pitanja</button><button class="btn ghost sm" id="missClear">${ic('trash','sm')}Obriši listu</button></div>`:''}
  </section>
  <section class="card"><h2 style="margin-bottom:12px">Podešavanja</h2>
    <div class="fld" style="margin-bottom:12px"><span>Izgled</span><div class="seg theme-seg" role="radiogroup" aria-label="Izgled">${[['light','Svetla'],['dark','Tamna'],['auto','Kao telefon']].map(o=>`<button type="button" role="radio" aria-checked="${(S.theme||'auto')===o[0]}" class="${(S.theme||'auto')===o[0]?'on':''}" data-theme="${o[0]}">${o[1]}</button>`).join('')}</div></div>
    <label class="toggle" for="notifT">Podsetnici za obroke, vodu i šetnju<input type="checkbox" class="switch" id="notifT" ${S.notif?'checked':''}></label>
    <label class="toggle" for="gramsT">Prikaži grame pored domaćih mera<input type="checkbox" class="switch" id="gramsT" ${S.grams?'checked':''}></label>
    <div style="display:grid;gap:8px;margin-top:12px"><div class="block-lbl" style="margin:0">Rezervna kopija</div><p class="small muted">Podaci su samo na ovom telefonu. Pre brisanja aplikacije ili promene telefona kopiraj ih i sačuvaj u beleškama.</p>
    <div class="row" style="flex-wrap:wrap"><button class="btn ghost sm" id="bkCopy">${ic('copy','sm')}Kopiraj podatke</button><button class="btn ghost sm" id="bkRestore">Vrati podatke</button></div></div>
    <div style="margin-top:14px"><button class="btn ghost sm" id="resetBtn">${ic('arrows-clockwise','sm')}Kreni plan od danas</button>
    <div id="resetConfirm" hidden class="err" style="margin-top:10px;display:grid;gap:10px"><span>Plan se vraća na nedelju 1. Upisi i kilaža ostaju.</span><div class="row"><button class="btn redb sm" id="resetYes">Kreni ispočetka</button><button class="btn ghost sm" id="resetNo">Odustani</button></div></div></div>
  </section>`;
}
function viewWizard(){
  const n=FORM.length, done=WIZ>=n;
  if(done)return `<div class="wiz"><div class="wiz-prog"><i style="width:100%"></i></div>
    <h1 class="wiz-h">Plan je spreman</h1><p class="muted" style="margin-bottom:14px">Ovo je izračunato iz tvog profila. Kako budeš upisivao kilažu i obroke, plan se sam prilagođava.</p>
    ${numbersCard()}
    <button class="btn block" id="wizGo" style="margin-top:14px">Kreni</button><button class="btn ghost block" data-wiz="-1" style="margin-top:8px">Nazad</button></div>`;
  const s=FORM[WIZ];
  return `<div class="wiz"><div class="wiz-prog"><i style="width:${(WIZ)/n*100}%"></i></div>
   <div class="small muted">Korak ${WIZ+1} od ${n}</div><h1 class="wiz-h">${s.sec}</h1><p class="muted" style="margin-bottom:16px">${s.sub}</p>
   <div class="fields">${s.f.map(fieldHTML).join('')}</div>
   <div id="wizErr" class="err" hidden style="margin-top:14px"></div>
   <div class="wiz-nav">${WIZ>0?`<button class="btn ghost" data-wiz="-1">${ic('caret-left','sm')}Nazad</button>`:'<span></span>'}<button class="btn" data-wiz="1">Dalje${ic('caret-right','sm')}</button></div></div>`;
}

/* ================= SAVETNIK ================= */
function viewSavetnik(){
  const sugs=['Šta je danas za večeru?','Koliko mi je kalorija ostalo?','Zamena za ručak','Šta da jedem kad izlazimo u restoran?','Kako da izdržim bez gaziranog?','Zašto vaga stoji?','Smem li da jedem hleb?','Koje vežbe za leđa?'];
  return `${phead('Savetnik','Odgovori iz tvog plana i baze znanja')}
  <div class="chat-wrap">
    ${S.chat.length?'':`<div class="chat-intro"><span class="av">${ic('leaf','lg')}</span><h2>Pitaj šta te zanima</h2><p class="muted">Ishrana, trening, kičma, imunitet, san, restoran, zamene. Znam tvoj profil, jelovnik i šta si danas uneo. Radi bez interneta.</p></div>`}
    <div class="msgs" id="msgs">${S.chat.map(m=>m.role==='user'?`<div class="msg u">${esc(m.content)}</div>`:`<div class="msg a">${md(m.content)}${(m.acts||[]).length?`<div class="acts">${m.acts.map(a=>`<button class="act" data-act="${esc(a[1])}">${esc(a[0])}</button>`).join('')}</div>`:''}</div>`).join('')}</div>
    <div class="sugs-h ${S.chat.length?'':'big'}">${(S.chat.length?(S.chat[S.chat.length-1].more||sugs.slice(0,4)):sugs).map(s=>`<button class="sug" data-sug="${esc(s)}"><span>${esc(s)}</span>${ic('arrow-up-right','sm')}</button>`).join('')}</div>
    ${S.chat.length?`<button class="btn ghost sm" id="chatClear" style="justify-self:start">${ic('trash','sm')}Očisti razgovor</button>`:''}
    <div class="chat-pad"></div>
  </div>`;
}
function md(t){
  const lines=esc(t).split('\n');let out='',inL=false;
  lines.forEach(l=>{let x=l.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    if(/^\s*[-•]\s+/.test(x)){if(!inL){out+='<ul>';inL=true}out+='<li>'+x.replace(/^\s*[-•]\s+/,'')+'</li>';}
    else{if(inL){out+='</ul>';inL=false}if(x.trim())out+='<p>'+x+'</p>';}});
  if(inL)out+='</ul>';return out}
function ask(q){q=(q||'').trim();if(!q)return;const a=answer(q);S.chat.push({role:'user',content:q});
  S.chat.push({role:'assistant',content:a.text,acts:a.acts||[],more:a.more||null});if(S.chat.length>60)S.chat=S.chat.slice(-60);save();
  render();setTimeout(scrollEnd,30)}
function scrollEnd(){window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'})}

/* ================= SHEET ================= */
const sheet=document.getElementById('sheet'),sheetBody=document.getElementById('sheetBody');let lastFocus=null;
function openSheet(html){lastFocus=document.activeElement;sheetBody.innerHTML=html;sheet.hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>sheet.classList.add('open')))}
function closeSheet(){if(sheet.hidden)return;sheet.classList.remove('open');setTimeout(()=>{sheet.hidden=true;sheetBody.innerHTML='';if(lastFocus&&document.body.contains(lastFocus))lastFocus.focus({preventScroll:true})},300)}
const closeBtn=`<button class="icon-btn" data-close="1" aria-label="Zatvori">${ic('x')}</button>`;
function mealSheet(key,slot){
  const x=planFor(key)[slot],m=x.meal,t=m.nt,isToday=key===TODAY,e=isToday&&dayOf().eat[slot],pp=S.p.partner==='da';
  return `<div class="sheet-head"><div><div class="w">${DAYN[dIdx(key)]} · ${TYPE_NAMES[x.type]} · ${x.time}</div><h2 id="sheetTitle">${esc(m.n)}</h2></div>${closeBtn}</div>
  <div class="nut"><div><b>${R(t[0])}</b><span>kcal</span></div><div><b>${R(t[1])}</b><span>proteini</span></div><div><b>${R(t[2])}</b><span>UH</span></div><div><b>${R(t[3])}</b><span>masti</span></div><div><b>${R(t[4])}</b><span>vlakna</span></div></div>
  <div class="block-lbl">Šta ti treba</div>
  <div class="ingr">${m.items.map(it=>`<div><span>${esc(shortName(it.k))}</span><span class="q">${esc(measure(it))}${S.grams?`<span class="g">${R(it.q*it.g)} g</span>`:''}</span></div>`).join('')}</div>
  ${pp?`<div class="partner">${ic('users')}<span>Partner: isti obrok, ${R(S.p.partnerPct*100)}% tvoje porcije, oko ${R(t[0]*S.p.partnerPct)} kcal</span></div>`:''}
  <div class="block-lbl">Priprema</div><p class="prep">${esc(m.r)}</p>
  <div class="sheet-actions">
    ${isToday?(e?`<button class="btn ghost block" data-eat="${slot}" data-fr="0" data-from-sheet="1">Poništi unos</button>`:`<div class="row"><button class="btn" style="flex:1" data-eat="${slot}" data-fr="1" data-from-sheet="1">${ic('check','sm')}Pojeo sam</button><button class="btn ghost" data-eat="${slot}" data-fr="0.5" data-from-sheet="1">Pola</button></div>`):''}
    <button class="btn ghost block" data-swap="${slot}" data-key="${key}" data-from-sheet="1">${ic('arrows-clockwise','sm')}Zameni drugim jelom</button>
  </div>`}
function addSheet(){return `<div class="sheet-head"><div><div class="w">Dnevnik</div><h2 id="sheetTitle">Dodaj hranu van plana</h2></div>${closeBtn}</div>
  <div class="srch">${ic('magnifying-glass','sm')}<input type="search" id="qSearch" placeholder="Traži, npr. pica, pivo, burek" aria-label="Traži hranu"></div>
  <div class="quick" id="quickList">${QUICK.map((q,i)=>`<button class="qi" data-quick="${i}"><span>${esc(q[0])}</span><b class="n">${q[2]} kcal</b></button>`).join('')}</div>
  <div class="block-lbl" style="margin-top:16px">Ili upiši sam</div>
  <div class="form"><label class="fld" for="cName"><span>Šta</span><input type="text" id="cName" placeholder="npr. sarma"></label><label class="fld" for="cKcal"><span>Kalorije</span><input type="number" id="cKcal" inputmode="numeric" placeholder="kcal"></label></div>
  <button class="btn block" id="cAdd" style="margin-top:12px">Dodaj u dnevnik</button>
  <p class="small muted" style="margin-top:10px">Ne znaš kalorije? Pitaj savetnika, npr. „koliko kalorija ima sarma”.</p>`}
function shopSheet(){
  const wk0=addDays(TODAY,-dIdx(TODAY)),agg={},mult=1+(S.p.partner==='da'?+S.p.partnerPct:0);
  for(let i=0;i<7;i++)planFor(addDays(wk0,i)).forEach(x=>x.meal.items.forEach(it=>{agg[it.k]=(agg[it.k]||0)+it.q*it.g*mult}));
  const wk='w'+weekIdx(TODAY),done=S.shop[wk]||{};
  const qty=(k,g)=>{const n=N[k];if(n[2])return Math.ceil(g/n[2])+' '+n[1];if(n[1]==='ml')return g>=1000?fmt1(Math.ceil(g/250)/4)+' l':Math.ceil(g/50)*50+' ml';return g>=1000?fmt1(Math.ceil(g/100)/10)+' kg':Math.ceil(g/50)*50+' g'};
  const groups={};Object.keys(agg).forEach(k=>{(groups[N[k][3]]=groups[N[k][3]]||[]).push(k)});const keys=Object.keys(agg);
  return `<div class="sheet-head"><div><div class="w">Ova nedelja${S.p.partner==='da'?' · za tebe i partnera':''}</div><h2 id="sheetTitle">Spisak za kupovinu</h2></div>${closeBtn}</div>
  <p class="small muted" style="margin-bottom:14px"><span class="n" id="shopCount">${keys.filter(k=>done[k]).length}/${keys.length}</span> kupljeno. Količine su zaokružene naviše.</p>
  ${['meso','mlecno','povrce','voce','ostalo'].filter(c=>groups[c]).map(c=>`<div class="shop-group"><div class="block-lbl">${CAT_NAMES[c]}</div>${groups[c].sort((a,b)=>N[a][0].localeCompare(N[b][0],'sr')).map(k=>`<label class="shop-item ${done[k]?'done':''}"><input type="checkbox" data-shop="${k}" ${done[k]?'checked':''}><span>${esc(N[k][0])}</span><b>${qty(k,agg[k])}</b></label>`).join('')}</div>`).join('')}`}
function handsSheet(){return `<div class="sheet-head"><div><div class="w">Bez kuhinjske vage</div><h2 id="sheetTitle">Tvoja šaka je merica</h2></div>${closeBtn}</div>
  <div class="hands"><div class="hand"><b>Dlan</b><span>Meso ili riba veličine i debljine dlana, oko 100 g.</span></div><div class="hand"><b>Šolja</b><span>250 ml, kao šolja za čaj. Kuvan pirinač, sočivo, heljda.</span></div>
  <div class="hand"><b>Šaka</b><span>Povrće: 2 pune šake po obroku, može i više. Voće: 1 šaka.</span></div><div class="hand"><b>Kašika</b><span>Supena kašika. Kašičica je ona za kafu.</span></div></div>
  <p class="small muted" style="margin-top:14px">Kalorije su izračunate za te mere, sa greškom od oko 10%. To je sasvim dovoljno za dobar rezultat.</p>`}
function backupSheet(txt){return `<div class="sheet-head"><div><div class="w">Rezervna kopija</div><h2 id="sheetTitle">${txt?'Kopiraj ovaj tekst':'Nalepi sačuvanu kopiju'}</h2></div>${closeBtn}</div>
  <textarea id="bkTxt" rows="8" class="mono-ta" aria-label="Rezervna kopija" ${txt?'readonly':''}>${esc(txt)}</textarea>
  <div id="bkErr" class="err" hidden style="margin:12px 0">Ovo nije ispravna kopija. Nalepi ceo tekst koji si sačuvao.</div>
  ${txt?'':'<button class="btn block" id="bkGo" style="margin-top:12px">Vrati podatke</button>'}`}

/* ================= TOAST, RENDER ================= */
const toastEl=document.getElementById('toast');let toastT;
function toast(t){toastEl.innerHTML=ic('check-circle','sm')+esc(t);toastEl.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('show'),1900)}
function render(){
  const v=TAB==='danas'?viewDanas():TAB==='jelovnik'?viewJelovnik():TAB==='trening'?viewTrening():TAB==='napredak'?viewNapredak():TAB==='savetnik'?viewSavetnik():TAB==='profil'?viewProfil():viewWizard();
  app.innerHTML=`<div class="view">${v}</div>`;
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===TAB));
  document.getElementById('composer').hidden=TAB!=='savetnik';
  document.querySelector('nav.tabs').hidden=TAB==='wizard';
}
function rerender(){const y=window.scrollY;render();app.firstElementChild.style.animation='none';window.scrollTo(0,y)}
function go(t){if(t!=='profil'&&t!=='wizard')prevTab=t;else if(TAB!=='profil'&&TAB!=='wizard')prevTab=TAB;TAB=t;render();window.scrollTo({top:0});if(t==='savetnik')setTimeout(scrollEnd,30)}
document.querySelector('.tabs').addEventListener('click',e=>{const b=e.target.closest('.tab');if(b)go(b.dataset.tab)});

function profileChanged(full){save();if(S.notif)scheduleReminders();if(full)rerender()}

function syncInputs(){app.querySelectorAll('[data-pf]').forEach(el=>{if(el.dataset.bool)return;let v=el.value;if(el.dataset.num){if(v==='')return;v=parseFloat(String(v).replace(',','.'));if(isNaN(v))return}if(el.dataset.pf==='partnerPct')v=+v;S.p[el.dataset.pf]=v})}
function validateStep(i){const p=S.p,sec=FORM[i].sec;
  if(sec==='Osnovno'){if(!p.sex)return 'Izaberi pol, potreban je za tačan obračun potrošnje.';if(!(p.age>=16&&p.age<=90))return 'Upiši godine (16 do 90).';if(!(p.height>=130&&p.height<=220))return 'Upiši visinu u centimetrima (130 do 220).';if(!(p.weight>=40&&p.weight<=250))return 'Upiši trenutnu težinu u kilogramima.';}
  if(sec==='Cilj'){if(!(p.goalW>=40&&p.goalW<=200))return 'Upiši ciljnu težinu u kilogramima.';const h=p.height/100;if(p.goalW<18.5*h*h)return 'Ciljna težina je ispod zdravog opsega za tvoju visinu (najmanje '+Math.ceil(18.5*h*h)+' kg). Izaberi veću vrednost.';}
  return null}
function applyTheme(){const r=document.documentElement;if(S.theme==='light'||S.theme==='dark')r.setAttribute('data-theme',S.theme);else r.removeAttribute('data-theme');
  const dark=S.theme==='dark'||(S.theme!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelectorAll('meta[name=theme-color]').forEach(m=>m.setAttribute('content',dark?'#0B0F0C':'#F3F6F2'));}
/* ================= DOGAĐAJI ================= */
function handle(e){
  const t=e.target.closest('button,input[type=checkbox],[data-close]');if(!t)return;const ds=t.dataset;
  if(ds.close){closeSheet();return}
  if(ds.go){go(ds.go);return}
  if(ds.eat!==undefined){const fr=+ds.fr;eatMeal(TODAY,+ds.eat,fr);if(fr)toast(fr<1?'Upisana pola porcije':'Obrok upisan');if(ds.fromSheet)closeSheet();rerender();return}
  if(ds.mealOpen!==undefined){openSheet(mealSheet(ds.key,+ds.mealOpen));return}
  if(ds.swap!==undefined){const nx=swapMeal(ds.key,+ds.swap);toast('Novo jelo: '+nx.n);if(ds.fromSheet){sheetBody.innerHTML=mealSheet(ds.key,+ds.swap)}rerender();return}
  if(ds.trk){const d=dayOf();d[ds.trk]=Math.max(0,(d[ds.trk]||0)+ +ds.v);save();rerender();return}
  if(ds.sleep){const d=dayOf();d.sleep=clamp((d.sleep!=null?d.sleep:S.p.sleep)+ +ds.sleep,3,12);save();rerender();return}
  if(ds.energy){const d=dayOf();d.energy=+ds.energy;if(d.sleep==null)d.sleep=S.p.sleep;save();toast('San i energija upisani');rerender();return}
  if(ds.ex){const d=dayOf();d.ex=!d.ex;save();if(d.ex)toast('Trening upisan');rerender();return}
  if(ds.day){VIEWDAY=ds.day;rerender();return}
  if(ds.delx!==undefined){dayOf().extra.splice(+ds.delx,1);save();rerender();return}
  if(ds.sheet==='shop'){openSheet(shopSheet());return}
  if(ds.sheet==='hands'){openSheet(handsSheet());return}
  if(ds.sheet==='add'){openSheet(addSheet());setTimeout(()=>{const s=document.getElementById('qSearch');s&&s.addEventListener('input',filterQuick)},50);return}
  if(ds.quick!==undefined){const q=QUICK[+ds.quick];addExtra(q[0],q[2],q[3],q[4],q[5]);closeSheet();return}
  if(ds.shop){const wk='w'+weekIdx(TODAY);S.shop[wk]=S.shop[wk]||{};S.shop[wk][ds.shop]=t.checked;save();t.closest('label').classList.toggle('done',t.checked);const c=document.getElementById('shopCount');if(c)c.textContent=sheetBody.querySelectorAll('[data-shop]:checked').length+'/'+sheetBody.querySelectorAll('[data-shop]').length;return}
  if(ds.health){S.health[ds.health]=t.checked;save();t.closest('.ck').classList.toggle('done',t.checked);return}
  if(ds.seg){const v=ds.v;S.p[ds.seg]=(ds.seg==='mealsN')?+v:v;t.parentElement.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b===t);b.setAttribute('aria-checked',b===t)});profileChanged(TAB==='profil'||ds.seg==='partner');if(TAB==='wizard'&&ds.seg==='partner')rerender();return}
  if(ds.flag){S.p[ds.flag]=!S.p[ds.flag];profileChanged(true);return}
  if(ds.dayi!==undefined){const i=+ds.dayi,a=S.p.trainDays||[];S.p.trainDays=a.includes(i)?a.filter(x=>x!==i):a.concat(i).sort();profileChanged(true);return}
  if(ds.wiz){syncInputs();if(+ds.wiz>0&&WIZ<FORM.length){const er=validateStep(WIZ);if(er){const b=document.getElementById('wizErr');b.textContent=er;b.hidden=false;return}}WIZ=clamp(WIZ+ +ds.wiz,0,FORM.length);rerender();window.scrollTo({top:0});return}
  if(ds.theme){S.theme=ds.theme;applyTheme();save();rerender();return}
  if(ds.sug){ask(ds.sug);return}
  if(ds.act){runAct(ds.act);return}
  if(t.dataset.bool){S.p[t.dataset.pf]=t.checked;profileChanged(true);return}
  switch(t.id){
    case 'wizGo':{const lw=S.weights.length?S.weights[S.weights.length-1].w:null;if(lw!==+S.p.weight){S.weights=S.weights.filter(x=>x.d!==TODAY);S.weights.push({d:TODAY,w:+S.p.weight});S.weights.sort((x,y)=>x.d<y.d?-1:1)}}S.setup=true;S.start=TODAY;save();if(S.notif)scheduleReminders();go('danas');toast('Plan je spreman');return;
    case 'gramsT':S.grams=t.checked;save();return;
    case 'notifT':{const want=t.checked;t.disabled=true;setReminders(want).then(ok=>{S.notif=ok?want:false;t.checked=S.notif;t.disabled=false;save();if(ok&&want)toast('Podsetnici su uključeni')});return}
    case 'bkCopy':{const txt=JSON.stringify(S);(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('Kopirano. Sačuvaj u beleškama.')).catch(()=>openSheet(backupSheet(txt)));return}
    case 'bkRestore':openSheet(backupSheet(''));return;
    case 'bkGo':try{const o=JSON.parse(document.getElementById('bkTxt').value);if(!o||typeof o!=='object'||!o.days)throw 0;S=Object.assign({},DEF,o);S.p=Object.assign({},DEFP,o.p||{});save();closeSheet();toast('Podaci su vraćeni');rerender()}catch(err){document.getElementById('bkErr').hidden=false}return;
    case 'resetBtn':document.getElementById('resetConfirm').hidden=false;return;
    case 'resetNo':document.getElementById('resetConfirm').hidden=true;return;
    case 'resetYes':S.start=TODAY;S.adj=0;S.lastReview=null;save();toast('Plan kreće od danas');rerender();return;
    case 'wAdd':{const i=document.getElementById('wIn'),v=parseFloat(String(i.value).replace(',','.'));if(v>40&&v<250){S.weights=S.weights.filter(x=>x.d!==TODAY);S.weights.push({d:TODAY,w:v});S.weights.sort((a,b)=>a.d<b.d?-1:1);save();const rv=runReview(false);toast(rv?'Upisano. Plan je proveren.':'Težina upisana');rerender()}else{i.focus();i.setAttribute('aria-invalid','true')}return}
    case 'waistAdd':{const i=document.getElementById('waistIn'),v=parseFloat(String(i.value).replace(',','.'));if(v>40&&v<250){S.waist=S.waist.filter(x=>x.d!==TODAY);S.waist.push({d:TODAY,v});save();toast('Obim upisan');rerender()}else i.focus();return}
    case 'reviewNow':{runReview(true);toast('Plan je proveren');rerender();return}
    case 'cAdd':{const n=document.getElementById('cName').value.trim()||'Obrok van plana',k=+document.getElementById('cKcal').value;if(k>0&&k<5000){addExtra(n,k,0,0,0);closeSheet()}else document.getElementById('cKcal').focus();return}
    case 'chatClear':S.chat=[];save();rerender();return;
    case 'missCopy':{const txt=(S.miss||[]).map(m=>m.d+': '+m.q).join('\n');(navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>toast('Pitanja su kopirana')).catch(()=>openSheet(backupSheet(txt)));return}
    case 'missClear':S.miss=[];save();rerender();return;
  }
}
function addExtra(n,k,p,c,f){const now=new Date();dayOf().extra.push({n,k,p,c,f,t:String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0')});save();toast('Dodato: '+n);rerender()}
function filterQuick(e){const q=norm(e.target.value);document.querySelectorAll('#quickList .qi').forEach((b,i)=>{b.hidden=q&&!norm(QUICK[i][0]).includes(q)})}
app.addEventListener('click',handle);sheet.addEventListener('click',handle);
app.addEventListener('change',e=>{const el=e.target;if(!el.dataset.pf||el.dataset.bool)return;let v=el.value;if(el.dataset.num){v=parseFloat(String(v).replace(',','.'));if(isNaN(v))return}
  if(el.dataset.pf==='partnerPct')v=+v;S.p[el.dataset.pf]=v;profileChanged(TAB==='profil')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
const chatIn=document.getElementById('chatIn');
document.getElementById('chatF').addEventListener('submit',e=>{e.preventDefault();const v=chatIn.value;chatIn.value='';chatIn.style.height='';ask(v)});
chatIn.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();document.getElementById('chatF').requestSubmit()}});
chatIn.addEventListener('input',()=>{chatIn.style.height='44px';chatIn.style.height=Math.min(120,chatIn.scrollHeight)+'px'});

/* ================= PODSETNICI ================= */
async function setReminders(on){const LN=PL('LocalNotifications');if(!LN){toast('Podsetnici rade u instaliranoj aplikaciji');return false}
  try{if(on){let perm=await LN.checkPermissions();if(perm.display!=='granted')perm=await LN.requestPermissions();if(perm.display!=='granted'){toast('Obaveštenja nisu dozvoljena');return false}}
    await scheduleReminders(on);return true}catch(e){toast('Podsetnici nisu podešeni');return false}}
async function scheduleReminders(on=true){const LN=PL('LocalNotifications');if(!LN)return;
  try{const pend=await LN.getPending();if(pend&&pend.notifications&&pend.notifications.length)await LN.cancel({notifications:pend.notifications.map(n=>({id:n.id}))});
  if(!on)return;const list=[],now=Date.now();const add=(id,at,title,body)=>{if(at.getTime()>now+60000)list.push({id,title,body,schedule:{at,allowWhileIdle:true},smallIcon:'ic_stat_leaf',iconColor:'#12803E'})};
  for(let d=0;d<7;d++){const key=addDays(iso(new Date()),d);planFor(key).forEach(x=>add(1000+d*10+x.slot,new Date(key+'T'+x.time+':00'),TYPE_NAMES[x.type]+' u '+x.time,x.meal.n+' · '+R(x.meal.nt[0])+' kcal'));
    [['10:30','Čaša vode','Popij čašu vode i upiši je.'],['13:00','Čaša vode','Pola dana je prošlo. Kako stoji voda?'],['16:00','Čaša vode','Još jedna čaša do kraja radnog dana.']].forEach((w,k)=>add(2000+d*10+k,new Date(key+'T'+w[0]+':00'),w[1],w[2]));
    add(3000+d,new Date(key+'T18:15:00'),'Vreme za šetnju','Danas je cilj '+walkT()+' minuta hoda.');}
  if(list.length)await LN.schedule({notifications:list})}catch(e){}}

/* ================= ANDROID ================= */
(function(){const A=PL('App');if(!A)return;
  A.addListener('backButton',()=>{if(!sheet.hidden)closeSheet();else if(TAB==='wizard'){if(WIZ>0){WIZ--;rerender()}else A.exitApp()}else if(TAB==='profil')go(prevTab);else if(TAB!=='danas')go('danas');else A.exitApp()});
  A.addListener('appStateChange',st=>{if(st.isActive&&iso(new Date())!==TODAY){TODAY=iso(new Date());VIEWDAY=TODAY;runReview(false);rerender();if(S.notif)scheduleReminders()}})})();

/* ================= START ================= */
applyTheme();
if(!S.setup){WIZ=0;TAB='wizard'}
render();
if(S.setup){runReview(false);if(S.notif)scheduleReminders()}
