/* ================= v6: tempo, upitnik, slobodan unos obroka, animirane vežbe, detaljni recepti ================= */

/* ---------- Nova polja profila ---------- */
Object.assign(DEFP,{waist0:'',why:'',whyTxt:'',walkNow:'',pushups:'',stairs:'',place:'kuca',sessLen:'20',
  likeYoga:false,likeStretch:false,likeCal:false,likeCardio:false,eqMat:false,eqBand:false,eqDb:false,
  knee:false,shoulder:false,hipj:false,preg:'ne',meds:'',diet:'sve',disl:[],cookSkill:'solidno',cookTime:'30',
  sweets:'',lateEat:'',stHunger:false,stSweet:false,stOut:false,stStress:false,stTime:false,stWeekend:false,sleepQ:'',stress:''});

/* ---------- Tempo mršavljenja ---------- */
const PACE={umeren:[.005,1,.6],brzi:[.0075,1,.6],int:[.0095,1.15,.75]};
const PACE_N={umeren:'Umereno',brzi:'Brže',int:'Intenzivno'};
function paceRate(w,pace){const l=w-S.p.goalW;if(!(l>0.3))return 0;const P=PACE[pace]||PACE.umeren;let r=Math.min(w*P[0],P[1]);if(l<5)r*=P[2];return r}
const noDeficit=()=>!!S.p.preg&&S.p.preg!=='ne';
function rateKg(){return noDeficit()?0:paceRate(curW(),S.p.pace)}
function weeksFor(pace,w0){let w=w0==null?curW():w0,n=0;if(!(w>0)||!(S.p.goalW>0))return 0;while(w>S.p.goalW+0.3&&n<400){const r=paceRate(w,pace);if(r<=0)break;w-=r;n++}return n}
function etaDate(){if(rateKg()<=0)return null;return new Date(Date.now()+weeksFor(S.p.pace)*7*864e5)}
function dietDef(){return Math.min(rateKg()*1100,tdee()*(S.p.pace==='int'?0.3:0.25))}
function activeGoal(){if(noDeficit()||phase()==='odrzavanje'||!S.p.weight)return 0;let a=rateKg()*1100-dietDef();if(S.p.pace==='int')a=Math.max(a,250);return a<60?0:R(a/10)*10}
function target(){const t=tdee();if(noDeficit())return R(t/10)*10;const k=t-dietDef()+(phase()==='odrzavanje'?0:S.adj);return R(Math.max(floorK(),k)/10)*10}
function activeToday(k=TODAY){const d=S.days[k]||{},wo=d.wo||[],walk=(d.walk||0)*2.5*curW()/60,wk=wo.reduce((a,x)=>a+(x.k||0),0);
  return {walk:R(walk),wo:R(wk),t:R(walk+wk),min:(d.walk||0)+wo.reduce((a,x)=>a+(x.min||0),0)}}

/* ---------- Ishrana po upitniku ---------- */
function exclTags(){const p=S.p,x=[];if(p.gluten)x.push('gluten');if(p.lactose)x.push('laktoza');if(p.noFish)x.push('riba');if(p.noPork)x.push('svinja');if(p.noNuts)x.push('orasasto');
  const d=p.veg?'veg':p.diet;if(d==='bezSv')x.push('svinja');if(d==='pesk')x.push('meso','svinja');if(d==='veg')x.push('meso','svinja','riba');if(d==='posno')x.push('meso','svinja','jaja','laktoza');return x}
const PRICEY=['losos','pastrmka','avokado','kinoa','maline','borovnice'];
const rTime=id=>{const r=RCP[id];return r?r[0]+r[1]:30};
pool=(function(orig){return function(type){let P=orig(type);const keep=(pred,min)=>{const r=P.filter(pred);if(r.length>=min)P=r};
  const dl=S.p.disl||[];if(dl.length)keep(m=>!m.i.some(it=>dl.includes(it.k)),3);
  if(S.p.budget==='nizak')keep(m=>!m.i.some(it=>PRICEY.includes(it.k)),4);
  if((type==='l'||type==='v')&&S.p.cookTime==='15')keep(m=>rTime(m.id)<=30,4);
  if((type==='l'||type==='v')&&S.p.cookSkill==='pocetnik')keep(m=>!RCP[m.id]||RCP[m.id][2]<2,4);
  return P}})(pool);

/* ---------- Upitnik ---------- */
FORM.length=0;
FORM.push(
 {sec:'Osnovno',sub:'Iz ovoga se računa koliko energije trošiš.',f:[
   {id:'name',l:'Ime',t:'text',ph:'Kako da te zovem'},
   {id:'sex',l:'Pol',t:'seg',o:[['m','Muški'],['z','Ženski']],req:1},
   {id:'age',l:'Godine',t:'num',min:16,max:90,ph:'npr. 35',req:1},{id:'height',l:'Visina (cm)',t:'num',min:130,max:220,ph:'npr. 178',req:1},
   {id:'weight',l:'Trenutna težina (kg)',t:'num',min:40,max:250,step:0.1,ph:'npr. 92,5',req:1},
   {id:'waist0',l:'Obim struka (cm), nije obavezno',t:'num',min:50,max:200,ph:'meri se u visini pupka'}]},
 {sec:'Cilj',sub:'Šta želiš i kojim tempom. Tempo možeš kasnije da promeniš.',f:[
   {id:'goalW',l:'Ciljna težina (kg)',t:'num',min:40,max:200,step:0.5,ph:'npr. 80',req:1},
   {id:'why',l:'Najvažniji razlog',t:'c1',o:[['zdravlje','Zdravlje'],['energija','Više energije'],['porodica','Zbog porodice'],['ledja','Manje bolova'],['izgled','Bolji izgled'],['samopouzdanje','Samopouzdanje']]},
   {id:'whyTxt',l:'Tvojim rečima, nije obavezno',t:'text',ph:'npr. da mogu da trčim sa decom'},
   {id:'pace',l:'Tempo',t:'pace'}]},
 {sec:'Kondicija',sub:'Na osnovu ovoga biramo težinu vežbi i plan hodanja.',f:[
   {id:'job',l:'Posao',t:'seg',o:[['sed','Sedeći'],['stand','Stojeći'],['phys','Fizički']]},
   {id:'move',l:'Kretanje sada',t:'seg',o:[['none','Skoro nimalo'],['some','Malo'],['reg','Redovno']]},
   {id:'walkNow',l:'Koliko dugo možeš da hodaš bez pauze',t:'c1',o:[['15','Do 15 min'],['30','15 do 30 min'],['60','30 do 60 min'],['60+','Više od sat']]},
   {id:'stairs',l:'Penjanje 2 sprata stepenicama',t:'c1',o:[['tesko','Teško, zadišem se'],['ok','Uz malo napora'],['lako','Lako']]},
   {id:'pushups',l:'Sklekova sada (može i na kolenima)',t:'c1',o:[['0','Nijedan'],['5','1 do 5'],['15','6 do 15'],['15+','Više od 15']]}]},
 {sec:'Trening',sub:'Program se pravi prema mestu, vremenu i onome što voliš.',f:[
   {id:'place',l:'Gde vežbaš',t:'seg',o:[['kuca','Kod kuće'],['napolju','Napolju'],['teretana','Teretana']]},
   {id:'sessLen',l:'Vreme za jedan trening',t:'seg',o:[['10','10 min'],['20','20 min'],['30','30 min'],['45','45 min']]},
   {id:'trainDays',l:'Dani za vežbe snage',t:'days'},
   {id:'_like',l:'Šta ti se dopada',t:'chips',o:[['likeStretch','Istezanje'],['likeYoga','Joga'],['likeCal','Kalistenika'],['likeCardio','Kardio bez skokova']]},
   {id:'_eq',l:'Imaš kod kuće',t:'chips',o:[['eqMat','Prostirku'],['eqBand','Traku za vežbanje'],['eqDb','Tegove']]}]},
 {sec:'Zdravlje',sub:'Jelovnik i vežbe izbegavaju ono što ti ne prija. Ovo ne zamenjuje lekara.',f:[
   {id:'_h',l:'Šta se odnosi na tebe',t:'chips',o:[['back','Diskus hernija ili kičma'],['knee','Kolena'],['shoulder','Ramena'],['hipj','Kukovi'],['stomach','Osetljiv želudac'],['chol','Povišen holesterol'],['bp','Povišen pritisak'],['sugar','Povišen šećer'],['gluten','Gluten mi ne prija'],['lactose','Laktoza mi ne prija'],['tired','Budim se umoran']]},
   {id:'physioOk',l:'Fizijatar je odobrio vežbe snage',t:'check',show:()=>S.p.back},
   {id:'preg',l:'Trudnoća ili dojenje',t:'seg',o:[['ne','Ne'],['trudnoca','Trudnoća'],['dojenje','Dojenje']],show:()=>S.p.sex==='z',help:'U trudnoći i dojenju plan ne pravi deficit, samo zdravije obroke.'},
   {id:'meds',l:'Lekovi koje redovno piješ',t:'text',ph:'nije obavezno'},
   {id:'healthNote',l:'Nešto drugo',t:'text',ph:'npr. alergija'}]},
 {sec:'Ishrana',sub:'Način ishrane, broj obroka i ono što ne voliš menjaju jelovnik.',f:[
   {id:'diet',l:'Način ishrane',t:'c1',o:[['sve','Jedem sve'],['bezSv','Bez svinjetine'],['pesk','Bez mesa, riba može'],['veg','Vegetarijanski'],['posno','Posno']]},
   {id:'mealsN',l:'Obroka dnevno',t:'seg',o:[['3','3'],['4','4'],['5','5']]},
   {id:'_d',l:'Ne jedem',t:'chips',o:[['noFish','Ribu'],['noPork','Svinjetinu'],['noNuts','Orašaste plodove']]},
   {id:'disl',l:'Ne volim',t:'ca',o:[['pecurke','Pečurke'],['tikvica','Tikvice'],['karfiol','Karfiol'],['brokoli','Brokoli'],['cvekla','Cveklu'],['kupus','Kupus'],['sociva','Sočivo'],['leblebija','Leblebiju'],['heljda','Heljdu'],['avokado','Avokado'],['spanac','Spanać'],['oslic','Oslić']]},
   {id:'dislikes',l:'Još nešto što ne voliš',t:'text',ph:'npr. kim'}]},
 {sec:'Kuhinja',sub:'Recepti se biraju prema vremenu i iskustvu u kuhinji.',f:[
   {id:'cookSkill',l:'Kuvanje ti ide',t:'seg',o:[['pocetnik','Početnik'],['solidno','Solidno'],['volim','Volim da kuvam']]},
   {id:'cookTime',l:'Vreme za ručak radnim danom',t:'seg',o:[['15','Do 20 min'],['30','Do 40 min'],['60','Imam vremena']]},
   {id:'budget',l:'Budžet za hranu',t:'seg',o:[['nizak','Skroman'],['srednji','Srednji'],['visok','Nije problem']]},
   {id:'partner',l:'Kuvaš i za još nekog',t:'seg',o:[['ne','Samo za sebe'],['da','I za partnera']]},
   {id:'partnerPct',l:'Partnerova porcija',t:'select',o:[['0.6','60% moje'],['0.75','75% moje'],['0.9','90% moje'],['1','Ista kao moja'],['1.15','115%, veća od moje'],['1.25','125%, veća od moje'],['1.4','140%, veća od moje']],help:'Ako partner ima veće potrebe, izaberi više od 100%.',show:()=>S.p.partner==='da'}]},
 {sec:'Navike',sub:'Odavde kreće plan za vodu, gazirano i saveti za ono što ti je teško.',f:[
   {id:'waterNow',l:'Vode piješ sada',t:'seg',o:[['low','Manje od 1 l'],['mid','1 do 2 l'],['ok','Više od 2 l']]},
   {id:'soda',l:'Gaziranih sokova dnevno (litara)',t:'num',min:0,max:5,step:0.1},
   {id:'coffee',l:'Kafa dnevno (šolja)',t:'num',min:0,max:12},
   {id:'alcohol',l:'Alkohol',t:'seg',o:[['ne','Ne pijem'],['retko','Par puta mesečno'],['cesto','Nedeljno']]},
   {id:'_st',l:'Šta ti je najteže',t:'chips',o:[['stHunger','Glad uveče'],['stSweet','Slatkiši'],['stOut','Jelo napolju i dostava'],['stStress','Jedem iz stresa'],['stTime','Nemam vremena'],['stWeekend','Vikendi']]}]},
 {sec:'San i ritam',sub:'San i stres utiču na glad koliko i hrana.',f:[
   {id:'sleep',l:'Spavaš prosečno (sati)',t:'num',min:3,max:12,step:0.5},
   {id:'sleepQ',l:'Kvalitet sna',t:'seg',o:[['los','Loš'],['srednji','Promenljiv'],['dobar','Dobar']]},
   {id:'stress',l:'Stres u poslednje vreme',t:'seg',o:[['nizak','Nizak'],['srednji','Srednji'],['visok','Visok']]},
   {id:'bf',l:'Doručak radnim danima u',t:'select',o:['06:00','06:30','07:00','07:30','08:00','08:30','09:00','09:30','10:00'].map(x=>[x,x])}]}
);
function paceCards(){const p=S.p,ok=p.weight>0&&p.goalW>0&&p.weight-p.goalW>0.3,save=p.pace;
  if(noDeficit())return `<div class="note">${ic('info','sm')}<span>U trudnoći i dojenju plan ne pravi deficit. Jelovnik ostaje, a kalorije su na nivou potrošnje.</span></div>`;
  if(!ok)return `<p class="small muted">Upiši trenutnu i ciljnu težinu da vidiš kada stižeš do cilja.</p>`;
  const rows=['umeren','brzi','int'].map(k=>{p.pace=k;const wk=weeksFor(k,+p.weight),dt=new Date(Date.now()+wk*7*864e5),kc=target(),ag=activeGoal();return {k,wk,dt,kc,ag}});p.pace=save;
  const base=rows[1].wk;
  return `<div class="pacec-list" role="radiogroup" aria-label="Tempo">${rows.map(r=>`<button type="button" role="radio" aria-checked="${p.pace===r.k}" class="pacec ${p.pace===r.k?'on':''}" data-pace="${r.k}">
    <span class="pc-top"><b>${PACE_N[r.k]}</b><span class="pc-wk n">${r.wk} ned.</span></span>
    <span class="pc-dt">Cilj oko ${monthYear(r.dt)}${r.k==='int'&&base>r.wk?` · ${R((base-r.wk)/4.3)} mes. brže od „Brže”`:''}</span>
    <span class="pc-meta">Jedeš oko ${fmtK(r.kc)} kcal${r.ag?` · kretanje oko ${fmtK(r.ag)} kcal dnevno`:' · dovoljno je hodanje'}</span></button>`).join('')}</div>
   ${p.pace==='int'?`<div class="note warn">${ic('first-aid','sm')}<span>Intenzivno znači oko sat brzog hoda i 20 minuta vežbi svakog dana, uz jelovnik. Pre početka se posavetuj sa lekarom${p.back?', a vežbe pokaži fizijatru':''}.</span></div>`:''}`}
fieldHTML=(function(orig){return function(f){if(f.show&&!f.show())return '';const v=S.p[f.id];
  if(f.t==='c1')return `<div class="fld"><span>${f.l}</span><div class="chips" role="radiogroup" aria-label="${esc(f.l)}">${f.o.map(o=>`<button type="button" role="radio" aria-checked="${String(v)===o[0]}" class="chip-t ${String(v)===o[0]?'on':''}" data-c1="${f.id}|${o[0]}">${String(v)===o[0]?ic('check','sm'):''}${o[1]}</button>`).join('')}</div></div>`;
  if(f.t==='ca'){const a=v||[];return `<div class="fld"><span>${f.l}</span><div class="chips">${f.o.map(o=>`<button type="button" aria-pressed="${a.includes(o[0])}" class="chip-t ${a.includes(o[0])?'on':''}" data-ca="${f.id}|${o[0]}">${a.includes(o[0])?ic('check','sm'):''}${o[1]}</button>`).join('')}</div></div>`}
  if(f.t==='pace')return `<div class="fld"><span>${f.l}</span><div id="paceBox">${paceCards()}</div></div>`;
  return orig(f)}})(fieldHTML);
function numbersCard(){const mt=macroT(),eta=etaDate(),ag=activeGoal();return `<section class="card summary">
  <div class="sec-title"><h2>Tvoji brojevi</h2><span class="pill soft">${PACE_N[S.p.pace]||'Umereno'}</span></div>
  <div class="nums"><div><b class="n">${fmtK(mt.k)}</b><span>kcal dnevno</span></div><div><b class="n">${mt.p} g</b><span>proteini</span></div><div><b class="n">${litres(waterT())} l</b><span>voda</span></div>
  <div><b class="n">${fmtK(tdee())}</b><span>potrošnja kcal</span></div><div><b class="n">${fmt1(rateKg())}</b><span>kg nedeljno</span></div><div><b class="n">${ag?fmtK(ag):walkT()+"'"}</b><span>${ag?'kcal kretanja':'hod dnevno'}</span></div></div>
  <p class="small muted" style="margin-top:12px">UH ${mt.c} g i masti ${mt.f} g dnevno. ${noDeficit()?'Plan je bez deficita.':eta?'Do cilja oko '+monthYear(eta)+'.':'Cilj je dostignut, plan je na održavanju.'}${ag?` Kretanje: oko ${walkT()} min hoda i trening iz kartice Trening.`:''} Najniži unos koji plan dozvoljava je ${fmtK(floorK())} kcal.</p></section>`}
viewProfil=function(){const n=FORM.length,cur=Math.min(+uiGet('prof','0'),n);
  const tabs=segtabs('prof',FORM.map((s,j)=>[String(j),s.sec]).concat([[String(n),'Aplikacija']]),String(cur));
  const sec=cur<n?(s=>`<section class="card form-sec"><h2>${s.sec}</h2><p class="small muted" style="margin:2px 0 14px">${s.sub}</p><div class="fields">${s.f.map(fieldHTML).join('')}</div></section>`)(FORM[cur]):
  `<section class="card"><div class="sec-title"><h2>Savetnik</h2><span class="pill line n">${(S.miss||[]).length} bez odgovora</span></div>
    <p class="small muted">Pitanja na koja savetnik nije znao odgovor beleže se ovde. Kopiraj ih i pošalji da se dopune u bazu.</p>
    ${(S.miss||[]).length?`<div class="misslist">${S.miss.slice(-8).reverse().map(m=>`<div>${esc(m.q)}</div>`).join('')}</div><div class="row" style="flex-wrap:wrap;margin-top:12px"><button class="btn ghost sm" id="missCopy">${ic('copy','sm')}Kopiraj pitanja</button><button class="btn ghost sm" id="missClear">${ic('trash','sm')}Obriši listu</button></div>`:''}
  </section>
  <section class="card"><h2 style="margin-bottom:12px">Podešavanja</h2>
    <div class="fld" style="margin-bottom:12px"><span>Izgled</span><div class="seg theme-seg" role="radiogroup" aria-label="Izgled">${[['light','Svetla'],['dark','Tamna'],['auto','Kao telefon']].map(o=>`<button type="button" role="radio" aria-checked="${(S.theme||'auto')===o[0]}" class="${(S.theme||'auto')===o[0]?'on':''}" data-theme="${o[0]}">${o[1]}</button>`).join('')}</div></div>
    <label class="toggle" for="notifT">Podsetnici za obroke, vodu i šetnju<input type="checkbox" class="switch" id="notifT" ${S.notif?'checked':''}></label>
    <label class="toggle" for="gramsT">Prikaži grame pored domaćih mera<input type="checkbox" class="switch" id="gramsT" ${S.grams?'checked':''}></label>
    <div style="display:grid;gap:8px;margin-top:12px"><div class="block-lbl" style="margin:0">Rezervna kopija</div><p class="small muted">Podaci se čuvaju na telefonu i u Android rezervnoj kopiji. Za prelazak na drugi telefon sačuvaj fajl (Drive, Viber, mejl) i učitaj ga tamo. Fotografije jela ostaju samo na ovom telefonu.</p>
    <div class="row" style="flex-wrap:wrap"><button class="btn ghost sm" id="bkFile">${ic('download-simple','sm')}Sačuvaj u fajl</button><button class="btn ghost sm" id="bkLoad">${ic('upload-simple','sm')}Učitaj iz fajla</button><button class="btn ghost sm" id="bkCopy">${ic('copy','sm')}Kopiraj tekst</button><button class="btn ghost sm" id="bkRestore">Nalepi tekst</button></div></div>
    <div style="margin-top:14px"><button class="btn ghost sm" id="resetBtn">${ic('arrows-clockwise','sm')}Kreni plan od danas</button>
    <div id="resetConfirm" hidden class="err" style="margin-top:10px;display:grid;gap:10px"><span>Plan se vraća na nedelju 1. Upisi i kilaža ostaju.</span><div class="row"><button class="btn redb sm" id="resetYes">Kreni ispočetka</button><button class="btn ghost sm" id="resetNo">Odustani</button></div></div></div>
  </section>`;
  return `<header class="phead"><div><button class="back" data-go="${prevTab}">${ic('caret-left','sm')}Nazad</button><h1>Profil</h1><div class="sub">Sve u aplikaciji se računa odavde</div></div></header>
  ${numbersCard()}${tabs}<div class="segbody">${sec}</div>`};

/* ---------- Saveti po upitniku ---------- */
const WHY={zdravlje:'Zdravlje',energija:'Više energije',porodica:'Zbog porodice',ledja:'Manje bolova',izgled:'Bolji izgled',samopouzdanje:'Samopouzdanje'};
const ST_TIPS={stHunger:['Večernja glad','Večeru počni salatom i čašom vode, a popodnevnu užinu ne preskači.'],stSweet:['Želja za slatkim','Posle ručka pojedi voće ili dve kockice crne čokolade, umesto da trpiš do večeri.'],
  stOut:['Jelo napolju','Biraj roštilj ili ribu sa salatom. Lepinju i pomfrit podeli, i upiši obrok preko „Nešto drugo”.'],stStress:['Jedenje iz stresa','Pre grickalice prošetaj 5 minuta i popij čašu vode. Želja često prođe za 10 minuta.'],
  stTime:['Malo vremena','Nedeljom skuvaj dva jela duplo, pa imaš ručak za tri dana.'],stWeekend:['Vikendi','Vikendom zadrži doručak u isto vreme, to drži ostatak dana pod kontrolom.']};

/* ---------- Baza hrane za slobodan unos ---------- */
const FOOD2=[
 ['Pileće belo u lepinji','1 komad',600,45,55,20,'sendvic roštilj pileci file pilece belo lepinja'],['Pileće belo, porcija','1 porcija',330,50,0,14,'pileci file pilece belo rostilj'],
 ['Lepinja','1 komad',300,10,58,3,'somun'],['Pomfrit, mali','1 mala porcija',310,4,41,15,'pomfrit krompir'],['Pomfrit, srednji','1 porcija',450,6,60,22,'pomfrit krompir'],['Pomfrit, veliki','1 velika porcija',600,7,80,28,'pomfrit krompir'],
 ['Hamburger','1 komad',550,28,45,28,'burger pljeskavica'],['Čizburger','1 komad',600,30,45,32,'cheeseburger burger sir'],['Dupli burger','1 komad',850,48,45,52,'dupli burger'],['Pileći burger','1 komad',520,25,50,24,'burger piletina pileci'],
 ['Slana palačinka sa šunkom i sirom','1 komad',380,18,30,20,'palacinka slana sunka sir kackavalj'],['Slana palačinka sa pečurkama','1 komad',340,14,32,17,'palacinka slana pecurke'],['Palačinka sa eurokremom','1 komad',300,6,38,14,'palacinka slatka nutela eurokrem'],
 ['Giros u pita hlebu','1 komad',750,35,65,38,'gyros giros pita'],['Kebab u lepinji','1 komad',700,35,60,35,'doner kebab'],['Tortilja sa piletinom (fast food)','1 komad',650,35,60,28,'tortilja wrap'],['Hot dog','1 komad',350,12,30,20,'hotdog viršla'],
 ['Pica, parče','1 parče',285,12,36,10,'pizza pica pice parce'],['Pica, cela mala','1 mala pica',1000,42,120,38,'pizza pica pice cela'],['Ćevapi 5 kom u lepinji','1 porcija',600,30,55,28,'cevapi cevapcici lepinja'],['Ćevapi 10 kom u lepinji','1 porcija',900,45,60,50,'cevapi cevapcici lepinja'],
 ['Pljeskavica u lepinji','1 komad',650,32,50,35,'pljeskavica lepinja'],['Pljeskavica bez lepinje','1 komad',350,24,2,27,'pljeskavica'],['Gurmanska pljeskavica u lepinji','1 komad',850,40,55,50,'gurmanska pljeskavica'],
 ['Karađorđeva šnicla','1 porcija',900,45,40,60,'karadjordjeva snicla'],['Bečka šnicla','1 komad',500,35,25,30,'becka snicla pohovano'],['Pohovana piletina','1 porcija',450,35,25,22,'pohovano pileci pohovana'],
 ['Pileća krilca','6 komada',500,40,5,35,'krilca pileca'],['Pileći nageti','6 komada',290,15,18,18,'nuggets nageti'],['Pileći ražnjići','1 porcija',350,45,3,17,'raznjici pileci'],['Vešalica','1 porcija',600,45,2,45,'vesalica svinjska'],
 ['Kobasica sa roštilja','1 komad',300,13,2,27,'kobasica'],['Pečen pileći batak','1 komad',250,26,0,16,'batak pileci'],['Uštipci','5 komada',450,15,40,26,'ustipci'],
 ['Pita sa sirom','1 parče',350,12,30,20,'pita sir'],['Pita sa jabukama','1 parče',280,3,40,12,'pita jabuke'],['Pogačice','3 komada',300,8,30,16,'pogacice'],['Đevrek','1 komad',300,10,58,3,'djevrek'],['Perec','1 komad',250,8,48,3,'perec'],
 ['Kroasan','1 komad',270,5,30,14,'kroasan'],['Krofna','1 komad',300,5,35,16,'krofna'],['Kifla','1 komad',200,6,38,3,'kifla'],['Burek sa sirom','1 parče',600,17,45,38,'burek sir'],['Burek sa mesom','1 parče',650,20,45,42,'burek meso'],
 ['Tost sendvič','1 komad',350,18,35,15,'tost sendvic sunka sir'],['Sendvič šunka i sir','1 komad',400,18,40,18,'sendvic sunka sir'],['Gibanica','1 parče',400,13,30,25,'gibanica'],
 ['Šopska salata','1 porcija',220,8,10,16,'sopska salata'],['Srpska salata','1 porcija',90,2,9,5,'srpska salata'],['Kupus salata','1 porcija',80,2,8,4,'kupus salata'],['Ruska salata','1 porcija',350,6,15,30,'ruska salata'],['Zelena salata','1 porcija',40,1,3,3,'zelena salata'],
 ['Majonez','1 kašika',90,0,0,10,'majonez'],['Kečap','1 kašika',20,0,5,0,'kecap'],['Urnebes','2 kašike',120,5,2,10,'urnebes'],['Pavlaka','1 kašika',40,1,1,4,'pavlaka'],['Tartar sos','2 kašike',140,0,3,14,'tartar'],['Kajmak','1 kašika',70,1,1,7,'kajmak'],
 ['Sarma','1 komad',180,9,8,12,'sarma'],['Punjene paprike','2 komada',450,24,30,24,'punjene paprike'],['Pasulj sa kobasicom','1 činija',550,28,45,25,'pasulj kobasica'],['Podvarak','1 porcija',500,25,20,35,'podvarak'],
 ['Špagete bolonjeze','1 porcija',650,30,80,22,'spagete bolonjeze testenina'],['Špagete karbonara','1 porcija',750,28,80,35,'karbonara spagete'],['Lazanja','1 porcija',600,30,45,32,'lazanja'],['Rižoto','1 porcija',500,20,65,16,'rizoto'],
 ['Piletina sa pirinčem','1 porcija',550,40,60,14,'piletina pirinac'],['Čorba','1 činija',200,12,15,10,'corba'],['Supa sa rezancima','1 činija',150,6,20,4,'supa rezanci'],['Pržena riba','1 porcija',400,30,10,26,'riba przena'],['Pržene lignje','1 porcija',450,25,25,28,'lignje'],
 ['Pire krompir','1 porcija',200,4,30,8,'pire krompir'],['Kuvana jaja','2 komada',155,13,1,11,'jaja kuvana'],['Jaja na oko','2 komada',200,13,1,16,'jaja oko'],['Omlet od 3 jajeta','1 porcija',280,19,2,21,'omlet'],['Kačamak sa sirom','1 porcija',450,15,50,20,'kacamak palenta'],
 ['Baklava','1 parče',330,4,40,18,'baklava'],['Tulumbe','3 komada',300,3,45,13,'tulumbe'],['Torta','1 parče',400,5,45,22,'torta kolac'],['Kolač','1 parče',300,4,38,15,'kolac'],['Sladoled, kornet','1 komad',250,4,30,12,'sladoled kornet'],['Mafin','1 komad',350,5,45,17,'mafin'],['Vafl','1 komad',250,5,30,12,'vafl'],
 ['Sok od jabuke','1 čaša',110,0,27,0,'sok jabuka'],['Limunada sa šećerom','1 čaša',120,0,30,0,'limunada'],['Ledeni čaj','0,5 l',150,0,37,0,'ice tea ledeni caj'],['Pivo 0,33 l','1 flaša',140,1,11,0,'pivo'],['Pivo 0,5 l','1 krigla',215,2,18,0,'pivo'],
 ['Špricer','1 čaša',90,0,1,0,'spricer'],['Kafa late','1 šolja',150,8,13,7,'latte late kafa'],['Fanta ili Sprite 0,33 l','1 limenka',140,0,35,0,'fanta sprite sok gazirani'],['Smuti','1 čaša',200,4,40,2,'smoothie smuti'],
 ['Hleb, beli','1 kriška',80,3,15,1,'hleb'],['Proja','1 parče',200,5,25,9,'proja'],['Kokice','1 činija',100,3,20,1,'kokice'],['Čips','mala kesa',215,3,20,14,'cips']
];
const CU_POP=['Pileće belo u lepinji','Pomfrit, srednji','Hamburger','Slana palačinka sa šunkom i sirom','Pica, parče','Burek sa sirom','Ćevapi 10 kom u lepinji','Giros u pita hlebu','Pljeskavica u lepinji','Šopska salata'];
const CU_STOP=new Set(['sa','u','i','od','na','za','iz','po','mi','je','sam','pojeo','pojela','jeo','jela','jedan','jedna','jedno','jednu']);
const CU_UNIT=/^(kom|komada|komad|kriska|kriske|krisku|krisaka|casa|case|casu|solja|solje|solju|parce|parceta|kasika|kasike|kasiku|porcija|porcije|porciju|kesa|kesu|flasa|flase|flasu|limenka|limenke|g|gr|grama|ml|dl|l|x)$/;
const QW={pola:0.5,'½':0.5,cetvrt:0.25,dva:2,dve:2,tri:3,cetiri:4,pet:5,sest:6};
const cuTok=s=>norm(s).replace(/½/g,' pola ').split(/[\s,.]+/).filter(t=>t&&!CU_STOP.has(t));
let ALLF=null;
function foodsAll(){if(ALLF)return ALLF;const out=[],seen=new Set();const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const add=(n,por,k,p,c,f,al)=>{const key=norm(n);if(seen.has(key))return;seen.add(key);out.push({n:cap(n),por,k:+k,p:+p||0,c:+c||0,f:+f||0,toks:[...new Set(cuTok(n+' '+(al||'')))],nm:[...new Set(cuTok(n))],nt:Math.max(1,new Set(cuTok(n)).size)})};
  FOOD2.forEach(x=>add(...x));QUICK.forEach(q=>add(q[0],'1 porcija',q[2],q[3],q[4],q[5]));
  const DIA=[[/^cevap/,'ćevap'],[/pecen/,'pečen'],[/palacink/,'palačink'],[/cokolad/,'čokolad'],[/^cips/,'čips'],[/kackavalj/,'kačkavalj'],[/secer/,'šećer'],[/pomorandz/,'pomorandž'],[/grozdje/,'grožđe'],[/pileci/,'pileći'],[/gulas/,'gulaš'],[/energetsko pice/,'energetsko piće'],[/^kafa sa mlekom/,'kafa sa mlekom'],[/kapucino/,'kapućino'],[/^musaka/,'musaka'],[/coca cola/,'Coca-Cola']];
  if(typeof FOODS!=='undefined')FOODS.forEach(x=>{let n=x[0];DIA.forEach(([a,b])=>n=n.replace(a,b));add(n,x[1],x[2],x[3],x[4],x[5],x[0])});
  const sh={d:.24,s:.1,l:.36,v:.2};LIB.forEach(m=>{const sm=scaleMeal(m,target()*sh[m.t[0]]);add(m.n,'porcija iz plana',R(sm.nt[0]),R(sm.nt[1]),R(sm.nt[2]),R(sm.nt[3]))});
  ALLF=out;return out}
function tokSim(a,b){if(a===b)return 1;const L=Math.min(a.length,b.length);if(L>=3&&(a.startsWith(b)||b.startsWith(a)))return .85;
  let cp=0;while(cp<L&&a[cp]===b[cp])cp++;if(cp>=4&&cp>=L-2)return .78;if(cp>=3&&cp>=L-1)return .7;if(L>=5&&typeof lev==='function'&&lev(a,b)<=1)return .6;return 0}
function foodScore(q,fd){const qq=q.filter(t=>!/^\d+$/.test(t)||fd.toks.includes(t));if(!qq.length)return 0;let cov=0,mn=1;const hit=new Set();
  qq.forEach(t=>{let b=0;fd.toks.forEach(ft=>{const s=tokSim(t,ft);if(s>b)b=s});cov+=b;mn=Math.min(mn,b)});
  fd.nm.forEach((nt,j)=>{if(qq.some(t=>tokSim(t,nt)>0))hit.add(j)});
  const s=.72*(cov/qq.length)+.28*Math.min(1,hit.size/fd.nt);return mn<0.55?Math.min(s,0.5):s}
function bestFoods(q,n=1){const A=foodsAll();const r=A.map(f=>({f,s:foodScore(q,f)})).filter(x=>x.s>0.3).sort((a,b)=>b.s-a.s);return r.slice(0,n)}
function parseMeal(text){const chunks=String(text||'').split(/\s*(?:\+|,|;|\bplus\b|\buz\b|\bpa\b)\s*/i).map(s=>s.trim()).filter(Boolean);const segs=[],miss=[];
  chunks.forEach(ch=>{const raw=cuTok(ch),toks=[];let pq=null,grams=false;
    raw.forEach((t,i)=>{if(QW[t]!=null){pq=QW[t];return}const m=t.match(/^(\d+(?:[.,]\d+)?)x?$/)||t.match(/^x(\d+)$/);
      if(m){const v=parseFloat(String(m[1]).replace(',','.'));const nx=raw[i+1];if(nx&&/^(g|gr|grama|ml|dl)$/.test(nx)){grams=true;return}
        if(v>0&&v<=20){if(toks.length&&!raw.slice(i+1).some(x=>!CU_UNIT.test(x)&&!/^\d/.test(x)&&QW[x]==null)){toks[toks.length-1].qe=v}else pq=v}
        if(/^\d+$/.test(m[1]))toks.push({t:m[1],num:+m[1],q:null,soft:1});return}
      if(CU_UNIT.test(t))return;toks.push({t,q:pq});pq=null});
    const n=toks.length;if(!n)return;const best=new Array(n+1).fill(-1e9),from=new Array(n+1).fill(null);best[0]=0;
    const memo={};const seg=(a,b)=>{const k=a+'-'+b;if(memo[k])return memo[k];const q=toks.slice(a,b).map(x=>x.t);if(q.every(x=>/^\d+$/.test(x)))return memo[k]={s:0,soft:1};const r=bestFoods(q,1)[0];return memo[k]=r||{s:0}};
    for(let i=1;i<=n;i++){for(let j=Math.max(0,i-6);j<i;j++){const r=seg(j,i),len=toks.slice(j,i).filter(x=>!x.soft).length;let val=r.soft?best[j]:r.s>=0.62?best[j]+r.s*len-0.35:best[j]-0.15*len-0.2;if(val>best[i]){best[i]=val;from[i]={j,r,ok:r.s>=0.62,soft:r.soft}}}}
    const parts=[];let i=n;while(i>0){const f=from[i];parts.unshift({a:f.j,b:i,r:f.r,ok:f.ok,soft:f.soft});i=f.j}
    parts.forEach(p=>{if(p.soft)return;const words=toks.slice(p.a,p.b),key=norm(words.map(w=>w.t).join(' '));
      if(!p.ok){miss.push(words.filter(w=>!w.soft).map(w=>w.t).join(' '));return}
      const nw=words.find(w=>w.num),qw=words.find(w=>w.q!=null),qe=words.find(w=>w.qe!=null),fm=(p.r.f.n.match(/(\d+)\s*kom/)||p.r.f.por.match(/^(\d+)\s*kom/));
      let q=qw?qw.q:qe?qe.qe:1;if(nw&&fm){q=nw.num/+fm[1]}else if(!qw&&!qe&&nw)q=nw.num;
      segs.push({key,f:p.r.f,q:Math.round(clamp(q,0.25,20)*4)/4,txt:words.map(w=>w.t)})});
    if(grams)segs.forEach(s=>s.grams=true)});
  return {segs,miss}}

/* ---------- Slobodan unos: list ---------- */
let CU=null;
function cuState(){return CU||(CU={slot:null,text:'',qo:{},alt:{},altOpen:null,manual:false})}
function cuItems(){const c=cuState(),r=parseMeal(c.text);r.segs.forEach(s=>{if(c.alt[s.key]){const f=foodsAll().find(x=>x.n===c.alt[s.key]);if(f)s.f=f}if(c.qo[s.key]!=null)s.q=c.qo[s.key]});return r}
function cuTotals(segs){return segs.reduce((a,s)=>[a[0]+s.f.k*s.q,a[1]+s.f.p*s.q,a[2]+s.f.c*s.q,a[3]+s.f.f*s.q],[0,0,0,0])}
function customSheet(slot){CU={slot:slot==null?null:+slot,text:'',qo:{},alt:{},altOpen:null,manual:false};const pl=slot!=null?planFor(TODAY)[+slot]:null;
  return `<div class="sheet-head"><div><div class="w">${pl?TYPE_NAMES[pl.type]+' · umesto plana':'Dnevnik · van plana'}</div><h2 id="sheetTitle">Šta si pojeo?</h2></div>${closeBtn}</div>
  <div class="srch cu-srch">${ic('magnifying-glass','sm')}<input type="search" id="cuIn" autocomplete="off" placeholder="npr. pileće belo u lepinji i pomfrit" aria-label="Upiši šta si pojeo"></div>
  <p class="small muted cu-help">Više stvari odvoji sa „i”, „plus” ili zarezom. Količinu napiši ispred: pola, 2, dve.</p>
  <div id="cuOut">${cuOutHTML()}</div>`}
function cuOutHTML(){const c=cuState(),pl=c.slot!=null?planFor(TODAY)[c.slot]:null,rec=(S.cuRecent||[]).slice(0,6);
  if(!c.text.trim()&&!c.manual)return `${rec.length?`<div class="block-lbl">Skoro upisano</div><div class="chips cu-chips">${rec.map((r,i)=>`<button class="chip-t" data-curec="${i}">${esc(r.n)} <span class="muted n">${R(r.k)}</span></button>`).join('')}</div>`:''}
    <div class="block-lbl">Često</div><div class="chips cu-chips">${CU_POP.map(n=>`<button class="chip-t" data-cupop="${esc(n)}">${esc(n)}</button>`).join('')}</div>
    <button class="btn ghost sm" style="margin-top:14px" data-cuman="1">${ic('pencil-simple','sm')}Upiši kalorije ručno</button>`;
  const r=cuItems(),t=cuTotals(r.segs),man=c.manual;let mk=0;
  const rows=r.segs.map(s=>{const alts=c.altOpen===s.key?bestFoods(s.txt,6).filter(x=>x.f.n!==s.f.n).slice(0,5):[];
    return `<div class="cu-row"><div class="cu-n"><b>${esc(s.f.n)}</b><span>${esc(s.f.por)} · ${R(s.f.k)} kcal</span><button class="cu-alt" data-cualt="${esc(s.key)}">${c.altOpen===s.key?'Zatvori':'Nije to?'}</button></div>
      <div class="cu-q"><button class="icon-btn sm" data-cuq="${esc(s.key)}|-0.5" aria-label="Manje">${ic('minus','sm')}</button><b class="n">${QF(s.q)}</b><button class="icon-btn sm" data-cuq="${esc(s.key)}|0.5" aria-label="Više">${ic('plus','sm')}</button></div>
      <span class="cu-k n">${fmtK(s.f.k*s.q)}</span></div>${alts.length?`<div class="chips cu-alts">${alts.map(a=>`<button class="chip-t" data-cupick="${esc(s.key)}|${esc(a.f.n)}">${esc(a.f.n)} <span class="muted n">${R(a.f.k)}</span></button>`).join('')}</div>`:''}`}).join('');
  if(man){const mv=+((document.getElementById('cuK')||{}).value||0);mk=mv>0?mv:0}
  const total=t[0]+mk,diff=pl?total-pl.meal.nt[0]:0,ok=total>0;
  return `${rows||''}${r.miss.length?`<div class="note warn">${ic('question','sm')}<span>Nisam prepoznao: <b>${esc(r.miss.join(', '))}</b>. Probaj drugi naziv ili dodaj kalorije ručno.</span></div>`:''}
   ${r.segs.some(s=>s.grams)?`<div class="note">${ic('info','sm')}<span>Grame ne računam direktno, nego u porcijama. Podesi količinu dugmićima.</span></div>`:''}
   ${man?`<div class="form cu-man"><label class="fld" for="cuN"><span>Naziv</span><input type="text" id="cuN" placeholder="npr. domaći kolač"></label><label class="fld" for="cuK"><span>Kalorije</span><input type="number" id="cuK" inputmode="numeric" placeholder="kcal"></label></div>`:
     `<button class="btn ghost sm" data-cuman="1">${ic('pencil-simple','sm')}Dodaj kalorije ručno</button>`}
   ${ok?`<div class="cu-tot"><div><b class="n">${fmtK(total)}</b><span>kcal</span></div><div><b class="n">${R(t[1])}</b><span>proteini</span></div><div><b class="n">${R(t[2])}</b><span>UH</span></div><div><b class="n">${R(t[3])}</b><span>masti</span></div></div>
   ${pl?`<p class="small cu-cmp ${diff>80?'over':''}">Planirano je bilo ${fmtK(pl.meal.nt[0])} kcal. ${diff>80?`Ovo je ${fmtK(diff)} kcal više, pa će ostali današnji obroci biti malo manji.`:diff<-80?`Ovo je ${fmtK(-diff)} kcal manje, ostali obroci mogu biti malo veći.`:'To je otprilike isto.'}</p>`:`<p class="small muted cu-cmp">Ostali današnji obroci se prilagođavaju da dan ostane u okviru cilja.</p>`}`:''}
   <button class="btn block" data-cusave="1" ${ok?'':'disabled'} style="margin-top:12px">${ic('check','sm')}${pl?'Upiši umesto plana':'Dodaj u dnevnik'}</button>`}
function cuRefresh(){const o=document.getElementById('cuOut');if(o)o.innerHTML=cuOutHTML()}
function cuSave(){const c=cuState(),r=cuItems(),t=cuTotals(r.segs);let n=r.segs.map(s=>(s.q!==1?QF(s.q)+' × ':'')+s.f.n).join(' + ');
  if(c.manual){const k=+(document.getElementById('cuK')||{}).value||0,nm=((document.getElementById('cuN')||{}).value||'').trim();if(k>0&&k<5000){t[0]+=k;n=n?n+' + '+(nm||'ostalo'):(nm||'Obrok van plana')}}
  if(!(t[0]>0))return;n=n.slice(0,90);const it={n,k:R(t[0]),p:R(t[1]),c:R(t[2]),f:R(t[3])};
  S.cuRecent=[it].concat((S.cuRecent||[]).filter(x=>x.n!==n)).slice(0,8);
  if(c.slot!=null){const d=dayOf(),slot=c.slot,prev=d.eat[slot];d.eat[slot]=Object.assign({fr:1,id:'custom',custom:true},it);save();closeSheet();hap('medium');
    toast('Upisano umesto plana, ostatak dana je prilagođen',()=>{if(prev)d.eat[slot]=prev;else delete d.eat[slot];save()});rerender()}
  else{closeSheet();addExtra(it.n,it.k,it.p,it.c,it.f)}
  CU=null}
function addSheet(){return customSheet(null)}

/* ---------- Plan dana: zamenjeni obroci i prilagođavanje ostatka ---------- */
planFor=(function(orig){return function(key){const pl=orig(key),d=S.days[key];if(!d||!d.eat)return pl;let off=(d.extra||[]).length>0;
  pl.forEach(x=>{const e=d.eat[x.slot];if(e&&e.custom){off=true;x.meal={id:'custom',custom:true,n:e.n,r:'',tg:[],items:[],nt:[e.k,e.p||0,e.c||0,e.f||0,0]}}});
  if(S.tried&&!Object.getOwnPropertyDescriptor(S.tried,'custom'))Object.defineProperty(S.tried,'custom',{value:'x',enumerable:false,configurable:true});
  if(off&&key===TODAY){const rest=pl.filter(x=>!d.eat[x.slot]);if(rest.length){const plan=rest.reduce((a,x)=>a+x.meal.nt[0],0),left=target()-dayTotals(key)[0];
    const f=clamp(left/plan,0.6,1.25);if(Math.abs(f-1)>0.05){rest.forEach(x=>{const m=LIB.find(z=>z.id===x.meal.id);if(m)x.meal=scaleMeal(m,x.meal.nt[0]*f)});pl.adj=f}}}
  return pl}})(planFor);
mealIcon=(function(orig){return function(m){if(m&&m.custom){delete ICON_CACHE[m.id];const r=orig(m);delete ICON_CACHE[m.id];return r}return orig(m)}})(mealIcon);

/* ---------- Fotografije jela ---------- */
const PHC={};
function photoOf(id){if(!id||id==='custom')return null;if(PHC[id]!==undefined)return PHC[id];let v=null;try{v=localStorage.getItem('mpm.ph.'+id)}catch(e){}return PHC[id]=v}
av=(function(orig){return function(m,type,cls=''){const ph=m&&photoOf(m.id);return ph?`<span class="av-food ph ${cls}" aria-hidden="true"><img src="${ph}" alt=""></span>`:orig(m,type,cls)}})(av);
function photoBlock(id){const ph=photoOf(id);return `<div class="phblk ${ph?'has':''}">${ph?`<img src="${ph}" alt="Tvoja fotografija jela">`:''}
  <label class="phbtn">${ic('camera','sm')}<span>${ph?'Promeni fotografiju':'Dodaj fotografiju svog jela'}</span><input type="file" accept="image/*" class="phin" data-phid="${id}" hidden></label>
  ${ph?`<button class="phdel" data-phdel="${id}" aria-label="Obriši fotografiju">${ic('trash','sm')}</button>`:''}</div>`}
function photoSave(id,file){const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const M=720,s=Math.min(1,M/Math.max(img.width,img.height)),cv=document.createElement('canvas');cv.width=R(img.width*s);cv.height=R(img.height*s);
  cv.getContext('2d').drawImage(img,0,0,cv.width,cv.height);URL.revokeObjectURL(url);let q=.72,data=cv.toDataURL('image/jpeg',q);while(data.length>160000&&q>.4){q-=.1;data=cv.toDataURL('image/jpeg',q)}
  try{localStorage.setItem('mpm.ph.'+id,data);PHC[id]=data;hap('success');toast('Fotografija je sačuvana');refreshSheetNow();rerender()}catch(e){toast('Nema mesta za još fotografija. Obriši neku staru.')}};
  img.onerror=()=>{URL.revokeObjectURL(url);toast('Ova slika ne može da se otvori')};img.src=url}

/* ---------- Recepti ---------- */
const LV=['','Lako','Srednje','Zahtevnije'];
function rcpOf(m){const r=RCP[m.id];if(r)return {pt:r[0],ct:r[1],lv:r[2],st:r[3],tip:r[4]};const st=String(m.r||'').split(/(?<=\.)\s+/).filter(Boolean);return {pt:10,ct:stepMinutes(m.r||'')||0,lv:1,st,tip:''}}
const bothQ=it=>{const f=1+(+S.p.partnerPct||0.75);return Object.assign({},it,{q:it.fix?Math.round(it.q*f*2)/2:roundStep(it.q*f,it.st)})};
function ingrHTML(items){const both=S.p.partner==='da'&&S.ui.both;return `${S.p.partner==='da'?`<div class="seg mini" role="radiogroup" aria-label="Količine"><button type="button" class="${both?'':'on'}" data-both="0">Za mene</button><button type="button" class="${both?'on':''}" data-both="1">Za oboje</button></div>`:''}
  <div class="ingr">${items.map(it=>{const x=both?bothQ(it):it;return `<div><span>${esc(shortName(it.k))}</span><span class="q">${esc(measure(x))}${S.grams?`<span class="g">${R(x.q*x.g)} g</span>`:''}</span></div>`}).join('')}</div>`}
function stepsHTML(m){const r=rcpOf(m),tot=r.pt+r.ct;return `<div class="rmeta"><span>${ic('clock','sm')}${tot} min ukupno</span><span>${ic('timer','sm')}priprema ${r.pt} min${r.ct?` · kuvanje ${r.ct} min`:''}</span><span>${icd('cooking-pot','sm')}${LV[r.lv]}</span></div>
  <ol class="steps">${r.st.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>${r.tip?`<div class="note">${icd('lightbulb','sm')}<span>${esc(r.tip)}</span></div>`:''}`}
function prefsHTML(id,key,slot){return `<div class="prefs"><button class="fav ${S.fav[id]?'on':''}" data-fav="${id}" aria-pressed="${!!S.fav[id]}">${ic(S.fav[id]?'heart-fill':'heart','sm')}${S.fav[id]?'Omiljeno':'Volim ovo'}</button><button class="dis ${S.dis[id]?'on':''}" data-dis="${id}" data-key="${key}" data-slot="${slot}" aria-pressed="${!!S.dis[id]}">${ic(S.dis[id]?'thumbs-down-fill':'thumbs-down','sm')}${S.dis[id]?'Ne nudi više':'Ne sviđa mi se'}</button></div>`}
const nutHTML=t=>`<div class="nut"><div><b>${R(t[0])}</b><span>kcal</span></div><div><b>${R(t[1])}</b><span>proteini</span></div><div><b>${R(t[2])}</b><span>UH</span></div><div><b>${R(t[3])}</b><span>masti</span></div><div><b>${R(t[4]||0)}</b><span>vlakna</span></div></div>`;
function mealSheet(key,slot){const x=planFor(key)[slot],m=x.meal,t=m.nt,isToday=key===TODAY,e=isToday&&dayOf().eat[slot],pp=S.p.partner==='da';
  const head=`<div class="sheet-head"><div class="sh-l">${av(m,x.type,'lg')}<div><div class="w">${DAYN[dIdx(key)]} · ${TYPE_NAMES[x.type]} · ${x.time}</div><h2 id="sheetTitle">${esc(m.n)}</h2></div></div>${closeBtn}</div>`;
  if(m.custom)return `${head}${nutHTML(t)}<div class="note">${ic('pencil-simple','sm')}<span>Ovaj obrok si upisao umesto plana.</span></div>
    <div class="sheet-actions"><button class="btn ghost block" data-other="${slot}">${ic('pencil-simple','sm')}Upiši ponovo</button><button class="btn ghost block" data-uncustom="${slot}">${ic('arrow-counter-clockwise','sm')}Vrati planirani obrok</button></div>`;
  return `${head}${nutHTML(t)}${prefsHTML(m.id,key,slot)}${photoBlock(m.id)}
  <div class="block-lbl">Šta ti treba</div>${ingrHTML(m.items)}
  ${pp&&!S.ui.both?`<div class="partner">${ic('users')}<span>Partner: isti obrok, ${R(S.p.partnerPct*100)}% tvoje porcije, oko ${R(t[0]*S.p.partnerPct)} kcal</span></div>`:''}
  ${x.adj?`<div class="note">${ic('arrows-clockwise','sm')}<span>Porcija je ${x.adj<1?'smanjena':'povećana'} jer je danas bilo obroka van plana.</span></div>`:''}
  <div class="block-lbl">Priprema</div>${stepsHTML(m)}
  <div class="sheet-actions">
    <button class="btn ghost block" data-cook="${slot}" data-key="${key}">${ic('cooking-pot','sm')}Kuvaj korak po korak</button>
    ${isToday?(e?`<button class="btn ghost block" data-eat="${slot}" data-fr="0" data-from-sheet="1">Poništi unos</button>`:`<div class="row"><button class="btn" style="flex:1" data-eat="${slot}" data-fr="1" data-from-sheet="1">${ic('check','sm')}Pojeo sam</button><button class="btn ghost" data-eat="${slot}" data-fr="0.5" data-from-sheet="1">Pola</button></div>
      <button class="btn ghost block" data-other="${slot}">${ic('pencil-simple','sm')}Pojeo sam nešto drugo</button>`):''}
    <button class="btn ghost block" data-swap="${slot}" data-key="${key}" data-from-sheet="1">${ic('arrows-clockwise','sm')}Zameni drugim jelom</button>
  </div>`}
function recipeSheet(id){const m=LIB.find(x=>x.id===id),type=m.t[0],share={d:.24,s:.1,l:.36,v:.2},sm=scaleMeal(m,target()*share[type]),t=sm.nt;
  return `<div class="sheet-head"><div class="sh-l">${av(m,type,'lg')}<div><div class="w">${m.t.map(x=>TYPE_NAMES[x]).join(' ili ')}${S.tried[id]?' · probano':''}</div><h2 id="sheetTitle">${esc(m.n)}</h2></div></div>${closeBtn}</div>
  ${nutHTML(t)}${prefsHTML(id,TODAY,-1)}${photoBlock(id)}
  <div class="block-lbl">Šta ti treba</div>${ingrHTML(sm.items)}
  <div class="block-lbl">Priprema</div>${stepsHTML(sm)}
  <div class="sheet-actions"><button class="btn ghost block" data-cookr="${id}">${ic('cooking-pot','sm')}Kuvaj korak po korak</button><button class="btn block" data-place="${id}">${ic('plus','sm')}Stavi u današnji plan</button></div>`}
function refreshSheetNow(){if(sheet.hidden)return;if(sheetBody.querySelector('[data-place]')&&RS){sheetBody.innerHTML=recipeSheet(RS);return}if(MS&&sheetBody.querySelector('.ingr,.nut'))sheetBody.innerHTML=mealSheet(MS.key,MS.slot);exMount(sheetBody)}

/* ---------- Režim kuvanja ---------- */
function openCook(key,slot,mObj){const m=mObj||planFor(key)[slot].meal;if(m.custom)return;const r=rcpOf(m);
  COOK={key:mObj?null:key,slot:mObj?null:slot,m,r,steps:r.st.slice(),step:0,done:{},timer:null};closeSheet();
  const el=document.createElement('div');el.className='cook';el.id='cook';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Režim kuvanja');document.body.appendChild(el);
  try{const K=PL('KeepAwake');if(K)K.keepAwake();else if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>COOK&&(COOK.lock=l)).catch(()=>{})}catch(e){}
  drawCook()}
function drawCook(){const c=COOK,el=document.getElementById('cook');if(!c||!el)return;const total=c.steps.length+1,i=c.step,last=i===total-1;
  const mins=i>0?stepMinutes(c.steps[i-1]):0,t=c.timer,both=S.p.partner==='da'&&S.ui.both;let body;
  if(i===0)body=`<div class="small muted">${c.r.pt+c.r.ct} min ukupno · ${LV[c.r.lv]}</div><h2>${esc(c.m.n)}</h2>
    ${S.p.partner==='da'?`<div class="seg mini" role="radiogroup" aria-label="Količine"><button type="button" class="${both?'':'on'}" data-both="0">Za mene</button><button type="button" class="${both?'on':''}" data-both="1">Za oboje</button></div>`:''}
    <div class="block-lbl">Pripremi sastojke</div><div class="cook-ing">${c.m.items.map((it,j)=>`<label class="shop-item ${c.done[j]?'done':''}"><input type="checkbox" data-cing="${j}" ${c.done[j]?'checked':''}><span>${esc(shortName(it.k))}</span><b>${esc(measure(both?bothQ(it):it))}</b></label>`).join('')}</div>`;
  else body=`<div class="small muted">Korak ${i} od ${c.steps.length}</div><p class="cook-step">${esc(c.steps[i-1])}</p>
    ${mins||t?`<div class="timer"><b id="tLeft">${t?fmtLeft(t.end-Date.now()):String(mins).padStart(2,'0')+':00'}</b>${t?`<button class="btn ghost" data-ctimer="stop">${ic('stop','sm')}Zaustavi</button>`:`<button class="btn" data-ctimer="${mins}">${ic('timer','sm')}Tajmer ${mins} min</button>`}</div>`:''}
    ${last&&c.r.tip?`<div class="note">${icd('lightbulb','sm')}<span>${esc(c.r.tip)}</span></div>`:''}`;
  el.innerHTML=`<div><div class="cook-top"><span class="small">${ic('cooking-pot','sm')} Režim kuvanja</span><button class="icon-btn" data-cclose="1" aria-label="Zatvori režim kuvanja">${ic('x')}</button></div><div class="cook-prog"><i style="width:${i/(total-1)*100}%"></i></div></div>
   <div class="cook-body">${body}</div>
   <div class="cook-nav"><button class="btn ghost" data-cnav="-1" ${i===0?'disabled style="opacity:.4"':''}>${ic('caret-left','sm')}Nazad</button><button class="btn" data-cnav="1">${last?'Gotovo':'Dalje'}${last?'':ic('caret-right','sm')}</button></div>`}

/* ---------- Vežbe: bezbednost i programi ---------- */
function exOK(e){const p=S.p;if(p.back&&!p.physioOk&&(e.back!=='ok'||e.lvl>1))return false;if(p.knee&&e.knee==='pazi'&&e.lvl>1)return false;if(p.shoulder&&e.sh==='pazi'&&e.lvl>1)return false;if(p.hipj&&e.id==='lunge')return false;return true}
function exWarn(e){const p=S.p,w=[];if(p.knee&&e.knee==='pazi')w.push('kolena');if(p.shoulder&&e.sh==='pazi')w.push('ramena');if(p.back&&e.back==='pazi')w.push('leđa');return w}
const PROGS=[
 {id:'ledja',n:'Leđa i trup',ic:'person-simple-tai-chi',d:'Duboki mišići trupa koji štite kičmu.',ex:['catcamel','birddog','curlup','bridge','deadbug','plankknee']},
 {id:'istezanje',n:'Istezanje posle posla',ic:'person-arms-spread',d:'Vrat, grudi, kukovi i noge posle sedenja.',ex:['neck','chest','armcircles','hipflexor','quad','calfwall','hamstring','kneechest']},
 {id:'joga',n:'Joga za početnike',ic:'flower-lotus',d:'Disanje, ravnoteža i pokretljivost.',ex:['breath','mountain','catcamel','childpose','sphinx','warrior','tree','downdog']},
 {id:'kal1',n:'Kalistenika, korak 1',ic:'barbell',d:'Snaga sopstvenom težinom, uz stolicu i zid.',ex:['march','sitstand','pushwall','bridge','calfraise','plankknee','wallsit']},
 {id:'kal2',n:'Kalistenika, korak 2',ic:'barbell',d:'Teže verzije kad korak 1 postane lak.',ex:['march','chairsquat','squat','pushknee','lunge','plank','calfraise']},
 {id:'kardio',n:'Kardio bez skokova',ic:'heartbeat',d:'Puls gore, bez udaraca u kolena i kičmu.',ex:['march','boxing','kneeup','march','boxing','kneeup'],r:2}];
const PRM={};PROGS.forEach(p=>PRM[p.id]=p);
const progEx=p=>p.ex.filter(id=>EXM[id]&&exOK(EXM[id]));
function woSeq(ids,rounds){const L=+S.p.sessLen||20,seq=[];if(!ids.length)return seq;seq.push({id:ids[0],t:'ready',dur:6});
  ids.forEach((id,ei)=>{const e=EXM[id],sets=+((e.dose.match(/^(\d)\s*×/)||[0,1])[1]),r=rounds||Math.max(1,Math.min(sets,L<=10?1:L<=20?2:3));
    for(let s=0;s<r;s++){seq.push({id,t:'work',set:s+1,of:r,dur:e.sec});if(s<r-1)seq.push({id,t:'rest',dur:15})}
    if(ei<ids.length-1)seq.push({id:ids[ei+1],t:'next',dur:15})});return seq}
const seqMin=seq=>Math.max(1,R(seq.reduce((a,x)=>a+x.dur,0)/60));
function progMeta(p){const ids=progEx(p),seq=woSeq(ids,p.r);return {ids,seq,min:seqMin(seq),kcal:R(seq.filter(x=>x.t==='work').reduce((a,x)=>a+(EXM[x.id].met-1)*curW()*x.dur/3600,0))}}
function fitLevel(){const p=S.p;if(p.pushups==='0'||p.stairs==='tesko'||p.walkNow==='15')return 1;if(p.pushups==='15'||p.pushups==='15+')return 3;return 2}
function trainingToday(key=TODAY){const di=dIdx(key),p=S.p,strDay=(p.trainDays||[]).includes(di),odd=daysBetween('2024-01-01',key)%2;let prog,str=false,note='';
  if(p.back&&!p.physioOk){prog=strDay?'ledja':(p.likeYoga&&!odd?'joga':'istezanje');note='Vežbe snage dolaze kad fizijatar odobri. Označi to u profilu.'}
  else if(strDay){str=true;prog=(p.back||fitLevel()===1)?'kal1':'kal2';note='Kad sve serije postanu lake, pređi na sledeći korak.'}
  else{prog=p.likeCardio||p.pace==='int'?(odd?'kardio':(p.likeYoga?'joga':'istezanje')):(p.likeYoga&&odd?'joga':'istezanje');note='Dan za oporavak: hod i lagan program.'}
  const extra=p.pace==='int'&&prog!=='kardio'?'kardio':null;
  const P=PRM[prog],ids=progEx(P);
  return {title:P.n,prog,extra,str,note,ex:ids.map(id=>[EXM[id].n,EXM[id].dose,EXM[id].d])}}

/* ---------- Trening prikaz ---------- */
const exThumb=(id,cls='')=>`<canvas class="exc ${cls}" data-ex="${id}" aria-hidden="true"></canvas>`;
function activeCard(compact){const ag=activeGoal();if(!ag)return '';const a=activeToday(),pc=Math.min(100,a.t/ag*100);
  return `<section class="card actc ${compact?'compact':''}"><div class="sec-title"><h2>${icd('fire','sm')}Kretanje danas</h2><span class="n small"><b>${fmtK(a.t)}</b> / ${fmtK(ag)} kcal</span></div>
   <div class="lvl-bar" style="background:var(--sunk)"><i style="width:${pc}%;background:var(--flame,var(--red))"></i></div>
   <p class="small muted" style="margin-top:8px">Hod ${fmtK(a.walk)} kcal · trening ${fmtK(a.wo)} kcal. ${pc>=100?'Cilj je ispunjen, svaka čast!':`Fali još oko ${fmtK(ag-a.t)} kcal, na primer ${Math.max(5,R((ag-a.t)/(2.5*curW()/60)/5)*5)} min brzog hoda.`}</p>
   ${compact?`<button class="btn ghost sm" data-go="trening" style="margin-top:10px">${icd('barbell','sm')}Otvori trening</button>`:''}</section>`}
function progCard(p,today){const m=progMeta(p);if(m.ids.length<3)return '';const d=S.days[TODAY]||{},done=(d.wo||[]).filter(x=>x.p===p.id);
  return `<button class="progc ${today?'today':''}" data-prog="${p.id}"><span class="pg-ic">${icd(p.ic)}</span><span class="pg-t"><b>${esc(p.n)}</b><small>${m.min} min · ${m.ids.length} vežbi${done.length?' · urađeno danas':''}</small></span>${done.length?`<span class="pg-done">${ic('check','sm')}</span>`:ic('caret-right','sm')}</button>`}
function todayWorkoutCard(){const tr=trainingToday(),P=PRM[tr.prog],m=progMeta(P),d=dayOf(),done=(d.wo||[]).filter(x=>x.p===P.id);
  return `<section class="card wocard"><div class="sec-title"><h2>${esc(P.n)}</h2>${tr.str?`<span class="pill soft">${icd('barbell')}snaga</span>`:`<span class="pill line">${m.min} min</span>`}</div>
   <p class="small muted" style="margin:-4px 0 12px">${esc(P.d)} ${m.min} min, oko ${m.kcal} kcal.</p>
   <div class="wostrip">${m.ids.slice(0,4).map(id=>`<button class="wo-th" data-exinfo="${id}" aria-label="${esc(EXM[id].n)}">${exThumb(id)}<span>${esc(EXM[id].n)}</span></button>`).join('')}</div>
   ${done.length?`<div class="note ok">${icd('seal-check','sm')}<span>Urađeno: ${done.reduce((a,x)=>a+x.min,0)} min, ${done.reduce((a,x)=>a+x.k,0)} kcal.</span></div>`:''}
   <div class="row" style="margin-top:12px;flex-wrap:wrap"><button class="btn" style="flex:1" data-wostart="${P.id}">${ic('play','sm')}${done.length?'Ponovi':'Kreni trening'}</button><button class="btn ghost" data-prog="${P.id}">Vežbe</button></div>
   ${tr.note?`<p class="small muted" style="margin-top:10px">${esc(tr.note)}</p>`:''}
   ${tr.extra?`<div class="note" style="margin-top:10px">${icd('heartbeat','sm')}<span>Intenzivni tempo: posle ovoga ili uveče uradi i „${PRM[tr.extra].n}”, ${progMeta(PRM[tr.extra]).min} min.</span></div>`:''}</section>`}
const EXF=[['sve','Sve'],['ledja','Leđa'],['istezanje','Istezanje'],['joga','Joga'],['kalistenika','Kalistenika'],['kardio','Kardio']];
function exLibView(){const f=uiGet('exf','sve'),L=EXL.filter(e=>f==='sve'||e.cat===f);
  return `<div class="fchips" role="tablist">${EXF.map(([k,l])=>`<button class="chip-t ${f===k?'on':''}" data-exf="${k}" role="tab" aria-selected="${f===k}">${l}</button>`).join('')}</div>
   <div class="exgrid">${L.map(e=>{const ok=exOK(e),w=exWarn(e);return `<button class="excard ${ok?'':'off'}" data-exinfo="${e.id}">${exThumb(e.id)}<b>${esc(e.n)}</b><span class="km">${esc(e.dose)}</span>${!ok?`<span class="exflag">${ic('lock-simple','sm')}Za sada ne</span>`:w.length?`<span class="exflag warn">${ic('warning','sm')}Pazi: ${w.join(', ')}</span>`:''}</button>`}).join('')}</div>`}
function viewTrening(){const cur=uiGet('tr','danas'),d=dayOf(),w=weekNo(),wt=walkT();let body;
  if(cur==='danas')body=`${S.p.back&&!S.p.physioOk?`<div class="tip red">${ic('first-aid')}<div><b>Pre prvog treninga</b><span>Vežbe pokaži fizijatru. Prekini odmah ako se javi bol niz nogu, trnjenje ili slabost u nozi.</span></div></div>`:''}
   ${activeCard(false)}
   <section class="hero2 walkhero"><span class="av-food t-l lg">${icd('footprints')}</span><div><div class="small" style="font-weight:700;color:var(--accent-ink)">Nedelja ${w} · hodanje</div><div class="big n">${d.walk}<small>/ ${wt} min</small></div>
     <div class="row" style="margin-top:10px"><button class="icon-btn" data-trk="walk" data-v="-10" aria-label="Oduzmi 10 minuta">${ic('minus','sm')}</button><button class="btn sm" data-trk="walk" data-v="10">+10 min</button></div></div></section>
   ${todayWorkoutCard()}
   <section class="card"><h2 style="margin-bottom:12px">Ostali programi</h2><div class="progs">${PROGS.filter(p=>p.id!==trainingToday().prog).map(p=>progCard(p)).join('')}</div></section>`;
  else if(cur==='vezbe')body=exLibView();
  else if(cur==='nedelja')body=`<section class="card"><h2 style="margin-bottom:12px">Ova nedelja</h2>
    <div class="weekplan">${DAYS.map((dn,i)=>{const k=addDays(TODAY,i-dIdx(TODAY)),t=trainingToday(k),dd=S.days[k];return `<div class="wp ${k===TODAY?'cur':''}"><b>${dn}</b><span>${icd(PRM[t.prog].ic,'sm')}</span>${dd&&(dd.ex||(dd.wo||[]).length)?`<em>${ic('check','sm')}</em>`:''}</div>`}).join('')}</div>
    <div class="wklist">${DAYS.map((dn,i)=>{const k=addDays(TODAY,i-dIdx(TODAY)),t=trainingToday(k);return `<div class="${k===TODAY?'cur':''}"><span>${DAYN[i]}</span><b>${esc(t.title)}</b></div>`}).join('')}</div>
    <p class="small muted" style="margin-top:10px">Dani za snagu: ${(S.p.trainDays||[]).map(i=>DAYS[i]).join(', ')||'nisu izabrani'}. Menjaš ih u profilu.</p></section>
   <section class="card"><h2 style="margin-bottom:12px">Hodanje kroz nedelje</h2><div class="weeks">${[...Array(8)].map((_,i)=>{const m=walkT(i+1);return `<div class="wk ${i+1===Math.min(w,8)?'cur':i+1<w?'past':''}"><span class="wn">Nedelja ${i+1}</span><b>${m} min dnevno</b><span class="wm">${R(m*105/100)*100} koraka</span></div>`}).join('')}</div>
    <p class="small muted" style="margin-top:10px">Može u delovima, npr. 10 minuta posle svakog obroka.</p></section>`;
  else body=`${S.p.back?`<section class="card"><h2 style="margin-bottom:12px">Za sada izbegavaj</h2><div class="avoid">${['Klasične trbušnjake i podizanje nogu iz ležećeg položaja','Pretklon sa teretom i dizanje teških stvari savijenih leđa','Uvrtanje trupa pod opterećenjem','Trčanje i skakanje dok kilaža ne padne','Sedenje duže od 45 minuta bez pauze'].map(t=>`<div>${ic('x','sm')}<span>${t}</span></div>`).join('')}</div></section>`:''}
   <section class="card"><h2 style="margin-bottom:12px">Mali trikovi</h2><div class="insights">${[['person-simple-walk','Telefoniraj u hodu','Svaki razgovor je par stotina koraka više.'],['clock','Ustani na 45 minuta','Dva minuta hoda rasterećuju kičmu.'],['footprints','Stepenice umesto lifta','Jedan sprat je oko 15 kcal i jače noge.'],['drop','Voda pre treninga','Čaša vode pre šetnje smanjuje umor.'],['heartbeat','Brzina hoda','Hodaj tako da možeš da pričaš, ali ne i da pevaš.']].map(x=>`<div class="ins">${icd(x[0])}<div><b>${x[1]}</b><span>${x[2]}</span></div></div>`).join('')}</div></section>`;
  return `${phead('Trening',S.p.back?'Prilagođeno kičmi':'Po tvom profilu')}${segtabs('tr',[['danas','Danas'],['vezbe','Vežbe'],['nedelja','Nedelja'],['saveti','Saveti']],cur)}<div class="segbody">${body}</div>`}
function exSheet(id){const e=EXM[id],ok=exOK(e),w=exWarn(e);
  return `<div class="sheet-head"><div><div class="w">${EX_CAT[e.cat]} · ${e.lvl>1?'srednje':'početno'}</div><h2 id="sheetTitle">${esc(e.n)}</h2></div>${closeBtn}</div>
  <div class="exbig">${exThumb(id)}</div>
  <div class="rmeta"><span>${ic('timer','sm')}${esc(e.dose)}</span><span>${ic('fire','sm')}oko ${R((e.met-1)*curW()/60)} kcal/min</span></div>
  <p style="margin:4px 0 12px">${esc(e.d)}</p>
  <ol class="steps">${e.cues.map(c=>`<li>${esc(c)}</li>`).join('')}</ol>
  ${!ok?`<div class="note warn">${ic('lock-simple','sm')}<span>Za sada nije u tvom planu zbog ${S.p.back&&!S.p.physioOk?'kičme. Kad fizijatar odobri, označi to u profilu':'zglobova iz profila'}.</span></div>`:w.length?`<div class="note warn">${ic('warning','sm')}<span>Pazi na ${w.join(' i ')}: radi sporije i manjim opsegom. Bol je znak da staneš.</span></div>`:''}
  ${ok?`<div class="sheet-actions"><button class="btn block" data-woone="${id}">${ic('play','sm')}Vežbaj sada</button></div>`:''}`}
function progSheet(pid){const p=PRM[pid],m=progMeta(p);
  return `<div class="sheet-head"><div class="sh-l"><span class="av-food t-l lg">${icd(p.ic)}</span><div><div class="w">${m.min} min · oko ${m.kcal} kcal</div><h2 id="sheetTitle">${esc(p.n)}</h2></div></div>${closeBtn}</div>
  <p class="muted" style="margin-bottom:12px">${esc(p.d)}</p>
  <div class="exlist">${m.ids.map((id,i)=>`<button class="exrow" data-exinfo="${id}">${exThumb(id)}<span><b>${i+1}. ${esc(EXM[id].n)}</b><small>${esc(EXM[id].dose)}</small></span>${ic('caret-right','sm')}</button>`).join('')}</div>
  <div class="sheet-actions"><button class="btn block" data-wostart="${pid}">${ic('play','sm')}Kreni trening</button></div>`}

/* ---------- Vođeni trening ---------- */
let WO=null,woTick=null;
function startWorkout(pid,ids,title,rounds){const seq=woSeq(ids,rounds);if(!seq.length)return;closeSheet();
  WO={pid,title,seq,i:0,end:Date.now()+seq[0].dur*1000,paused:false,left:0,work:{},t0:Date.now(),fin:false};
  const el=document.createElement('div');el.className='wo';el.id='wo';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Trening');document.body.appendChild(el);
  try{const K=PL('KeepAwake');if(K)K.keepAwake();else if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>WO&&(WO.lock=l)).catch(()=>{})}catch(e){}
  drawWO();clearInterval(woTick);woTick=setInterval(woStep,250)}
function woCredit(){const x=WO.seq[WO.i];if(!x||x.t!=='work')return;const el=x.dur-(WO.paused?WO.left:Math.max(0,(WO.end-Date.now())/1000));WO.work[x.id]=(WO.work[x.id]||0)+Math.max(0,Math.min(x.dur,el))}
function woGo(n){woCredit();if(n>=WO.seq.length){woFinish();return}WO.i=Math.max(0,n);const x=WO.seq[WO.i];WO.end=Date.now()+x.dur*1000;if(WO.paused)WO.left=x.dur;hap(x.t==='work'?'medium':'light');drawWO()}
function woStep(){if(!WO||WO.paused||WO.fin)return;const left=(WO.end-Date.now())/1000,el=document.getElementById('woT');if(el)el.textContent=fmtLeft(left*1000);
  const ring=document.getElementById('woRing');if(ring){const x=WO.seq[WO.i];ring.style.strokeDashoffset=String(289*(1-Math.max(0,left)/x.dur))}
  if(left<=3.2&&left>0&&!WO.beep){WO.beep=1;hap()}if(left<=0){WO.beep=0;woGo(WO.i+1)}}
function drawWO(){const el=document.getElementById('wo');if(!el||!WO)return;
  if(WO.fin){const mins=Math.max(1,R((Date.now()-WO.t0)/60000)),k=woKcal();
    el.innerHTML=`<div class="wo-fin">${icd('trophy','lg')}<h2>Bravo, trening je gotov!</h2><div class="nums" style="width:100%"><div><b class="n">${mins}</b><span>minuta</span></div><div><b class="n">${k}</b><span>kcal</span></div><div><b class="n">${Object.keys(WO.work).length}</b><span>vežbi</span></div></div>
      <button class="btn block" data-wo="save">${ic('check','sm')}Upiši u dnevnik</button><button class="btn ghost block" data-wo="close">Zatvori bez upisa</button></div>`;return}
  const x=WO.seq[WO.i],e=EXM[x.id],n=WO.seq.length,lbl=x.t==='work'?`Vežbaj${x.of>1?` · serija ${x.set} od ${x.of}`:''}`:x.t==='rest'?'Odmor':x.t==='ready'?'Pripremi se':'Sledeća vežba';
  const left=WO.paused?WO.left:Math.max(0,(WO.end-Date.now())/1000);
  el.innerHTML=`<div class="wo-top"><span class="small">${esc(WO.title)}</span><button class="icon-btn" data-wo="close" aria-label="Prekini trening">${ic('x')}</button></div>
   <div class="cook-prog"><i style="width:${WO.i/(n-1||1)*100}%"></i></div>
   <div class="wo-stage ${x.t}">${exThumb(x.id,'wo-cv')}</div>
   <div class="wo-info"><div class="wo-ph ${x.t}">${lbl}</div><h2>${esc(e.n)}</h2>
    <div class="wo-tm"><svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="var(--sunk)" stroke-width="7"/><circle id="woRing" cx="50" cy="50" r="46" fill="none" stroke="${x.t==='work'?'var(--accent)':'var(--amber)'}" stroke-width="7" stroke-linecap="round" stroke-dasharray="289" stroke-dashoffset="${289*(1-left/x.dur)}" transform="rotate(-90 50 50)"/></svg><b id="woT" class="n">${fmtLeft(left*1000)}</b></div>
    <ul class="wo-cues">${e.cues.slice(x.t==='work'?1:0,x.t==='work'?4:2).map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div>
   <div class="wo-nav"><button class="icon-btn lg" data-wo="prev" aria-label="Prethodno">${ic('skip-back')}</button><button class="btn" data-wo="pause">${WO.paused?ic('play','sm')+'Nastavi':ic('pause','sm')+'Pauza'}</button><button class="icon-btn lg" data-wo="next" aria-label="Preskoči">${ic('skip-forward')}</button></div>`;
  const cv=el.querySelector('canvas');if(cv)cv.dataset.live='1';exMount(el)}
function woKcal(){return R(Object.entries(WO.work).reduce((a,[id,s])=>a+(EXM[id].met-1)*curW()*s/3600,0))}
function woFinish(){WO.fin=true;clearInterval(woTick);hap('success');confetti();drawWO()}
function woClose(saveIt){if(!WO)return;clearInterval(woTick);if(saveIt){const d=dayOf(),mins=Math.max(1,R((Date.now()-WO.t0)/60000));d.wo=d.wo||[];d.wo.push({p:WO.pid,n:WO.title,min:mins,k:woKcal()});d.ex=true;save();toast('Trening je upisan: '+mins+' min');}
  try{const K=PL('KeepAwake');if(K)K.allowSleep();else if(WO.lock)WO.lock.release()}catch(e){}const el=document.getElementById('wo');if(el)el.remove();WO=null;rerender()}
document.addEventListener('click',e=>{const t=e.target.closest('#wo [data-wo]');if(!t||!WO)return;const a=t.dataset.wo;
  if(a==='close'){if(WO.fin||Date.now()-WO.t0<20000)woClose(false);else{woCredit();WO.fin=true;clearInterval(woTick);drawWO()}return}
  if(a==='save'){woClose(true);return}
  if(a==='pause'){if(WO.paused){WO.paused=false;WO.end=Date.now()+WO.left*1000}else{WO.paused=true;WO.left=Math.max(0,(WO.end-Date.now())/1000)}hap();drawWO();return}
  if(a==='next'){woGo(WO.i+1);return}
  if(a==='prev'){let j=WO.i-1;while(j>0&&WO.seq[j].t!=='work')j--;woGo(Math.max(0,j));return}});

/* ---------- Danas: dodaci ---------- */
viewDanas=(function(orig){return function(){let h=orig();const pl=planFor(TODAY),p=S.p;
  const why=p.why||p.whyTxt?`<div class="why">${icd('heart','sm')}<span><b>Tvoj razlog:</b> ${esc(p.whyTxt||WHY[p.why]||'')}</span></div>`:'';
  h=h.replace('<section class="hero2"',why+'<section class="hero2"');
  h=h.replace(/(<div class="row nx-btns">[\s\S]*?data-swap="(\d+)"[^>]*>[\s\S]*?<\/button>)/,(m,a,s)=>a+`<button class="btn ghost sm" data-other="${s}">${ic('pencil-simple','sm')}Nešto drugo</button>`);
  if(pl.adj)h=h.replace('<div class="tl">',`<div class="note adjn">${ic('arrows-clockwise','sm')}<span>Ostatak dana je prilagođen: porcije su ${pl.adj<1?'manje':'veće'} za oko ${R(Math.abs(1-pl.adj)*100)}% da ostaneš u cilju.</span></div><div class="tl">`);
  const ac=activeCard(true);if(ac)h=h.replace('<section class="card quests">',ac+'<section class="card quests">');
  const st=Object.keys(ST_TIPS).filter(k=>p[k]);if(st.length){const tp=ST_TIPS[st[daysBetween('2024-01-01',TODAY)%st.length]];if(daysBetween('2024-01-01',TODAY)%2===0)h=h.replace(/<div class="tip"><svg[^>]*><use href="#d-lightbulb"\/><\/svg><div><b>[^<]*<\/b><span>[^<]*<\/span><\/div><\/div>\s*$/,`<div class="tip">${icd('lightbulb')}<div><b>${esc(tp[0])}</b><span>${esc(tp[1])}</span></div></div>`)}
  return h}})(viewDanas);

/* ---------- Događaji v6 ---------- */
function v6click(e){const t=e.target.closest('button,label.phbtn');if(!t)return;const ds=t.dataset;let handled=true;
  if(ds.c1){syncInputs();const [f,v]=ds.c1.split('|');S.p[f]=S.p[f]===v?'':v;save();hap();if(TAB==='wizard'||TAB==='profil')rerender()}
  else if(ds.ca){syncInputs();const [f,v]=ds.ca.split('|'),a=(S.p[f]||[]).slice(),i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);S.p[f]=a;save();hap();rerender()}
  else if(ds.pace){syncInputs();S.p.pace=ds.pace;save();hap();const b=document.getElementById('paceBox');if(b)b.innerHTML=paceCards();else rerender()}
  else if(ds.other!==undefined){openSheet(customSheet(ds.other));setTimeout(()=>{const i=document.getElementById('cuIn');i&&i.focus()},350)}
  else if(ds.uncustom!==undefined){const d=dayOf(),prev=d.eat[+ds.uncustom];delete d.eat[+ds.uncustom];save();closeSheet();toast('Vraćen je planirani obrok',()=>{d.eat[+ds.uncustom]=prev;save()});rerender()}
  else if(ds.cupop){const i=document.getElementById('cuIn');if(i){i.value=(i.value.trim()?i.value.trim()+' + ':'')+ds.cupop;cuState().text=i.value;cuRefresh()}}
  else if(ds.curec!==undefined){const r=(S.cuRecent||[])[+ds.curec];if(!r)return;const c=cuState();if(c.slot!=null){const d=dayOf();d.eat[c.slot]=Object.assign({fr:1,id:'custom',custom:true},r);save();closeSheet();toast('Upisano umesto plana');rerender()}else{closeSheet();addExtra(r.n,r.k,r.p,r.c,r.f)}CU=null}
  else if(ds.cuq){const [k,dv]=ds.cuq.split('|'),c=cuState(),seg=cuItems().segs.find(s=>s.key===k);if(seg){c.qo[k]=clamp(seg.q+ +dv,0.5,10);hap();cuRefresh()}}
  else if(ds.cualt){const c=cuState();c.altOpen=c.altOpen===ds.cualt?null:ds.cualt;cuRefresh()}
  else if(ds.cupick){const [k,n]=ds.cupick.split('|'),c=cuState();c.alt[k]=n;c.altOpen=null;hap();cuRefresh()}
  else if(ds.cuman){cuState().manual=true;cuRefresh();setTimeout(()=>{const i=document.getElementById('cuN');i&&i.focus()},50)}
  else if(ds.cusave){cuSave()}
  else if(ds.sheet==='add'){openSheet(customSheet(null));setTimeout(()=>{const i=document.getElementById('cuIn');i&&i.focus()},350)}
  else if(ds.both!==undefined){S.ui.both=ds.both==='1';save();hap();if(document.getElementById('cook')&&COOK)drawCook();else refreshSheetNow()}
  else if(ds.phdel){try{localStorage.removeItem('mpm.ph.'+ds.phdel)}catch(er){}PHC[ds.phdel]=null;toast('Fotografija je obrisana');refreshSheetNow();rerender()}
  else if(ds.cookr){const m=LIB.find(x=>x.id===ds.cookr),sh={d:.24,s:.1,l:.36,v:.2};openCook(null,null,scaleMeal(m,target()*sh[m.t[0]]))}
  else if(ds.exf){S.ui.exf=ds.exf;save();hap();rerender()}
  else if(ds.exinfo){openSheet(exSheet(ds.exinfo))}
  else if(ds.prog){openSheet(progSheet(ds.prog))}
  else if(ds.wostart){const p=PRM[ds.wostart],m=progMeta(p);startWorkout(p.id,m.ids,p.n,p.r)}
  else if(ds.woone){const ex=EXM[ds.woone];startWorkout('one',[ex.id],ex.n)}
  else handled=false;
  if(handled&&!t.matches('label.phbtn')){e.stopImmediatePropagation();e.preventDefault()}}
app.addEventListener('click',v6click,true);sheet.addEventListener('click',v6click,true);
document.addEventListener('click',e=>{const t=e.target.closest('#cook [data-both]');if(t){S.ui.both=t.dataset.both==='1';save();hap();drawCook()}});
document.addEventListener('input',e=>{if(e.target.id==='cuIn'){cuState().text=e.target.value;cuState().altOpen=null;cuRefresh()}else if(e.target.id==='cuK')cuRefresh()});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='cuIn'){e.preventDefault();e.target.blur()}});
document.addEventListener('change',e=>{const t=e.target;if(t.classList&&t.classList.contains('phin')&&t.files&&t.files[0])photoSave(t.dataset.phid,t.files[0])});

/* ---------- Ostalo ---------- */
render=(function(orig){return function(){orig();exMount(app)}})(render);
openSheet=(function(orig){return function(h){orig(h);exMount(sheetBody)}})(openSheet);
validateStep=(function(orig){return function(i){const r=orig(i);if(r)return r;const p=S.p;if(FORM[i].sec==='Cilj'&&!(p.weight-p.goalW>0)&&p.pace&&!noDeficit())return null;return null}})(validateStep);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&WO&&!WO.paused&&!WO.fin)woStep()});
app.addEventListener('change',e=>{const f=e.target.dataset&&e.target.dataset.pf;if(f==='weight'||f==='goalW'||f==='sex'){const b=document.getElementById('paceBox');if(b)b.innerHTML=paceCards()}});
