/* ================= SAVETNIK: baza znanja i prepoznavanje pitanja ================= */
function norm(s){return String(s||'').toLowerCase().replace(/[čć]/g,'c').replace(/š/g,'s').replace(/ž/g,'z').replace(/đ/g,'dj').replace(/[^a-z0-9\s,.]/g,' ').replace(/\s+/g,' ').trim()}
const toks=s=>norm(s).replace(/[,.]/g,' ').split(' ').filter(x=>x.length>=2);
const has=(q,re)=>re.test(q);

/* Kalorije čestih namirnica i jela: naziv, porcija, kcal, P, UH, M */
const FOODS=[
 ['sarma','1 kom',180,9,8,12],['gibanica','1 parče',400,12,30,26],['burek','1 parče',600,17,45,38],['pica','1 parče',285,12,36,10],['pljeskavica','u lepinji',650,32,50,35],
 ['cevapi','10 kom u lepinji',900,45,60,50],['cevap','1 kom',70,4,0,6],['kajmak','1 kašika',70,1,1,7],['slanina','2 kriške',160,8,0,14],['kobasica','1 kom',300,12,2,27],
 ['palacinka','1 kom sa džemom',190,5,30,5],['palacinka sa nutelom','1 kom',260,5,32,12],['sladoled','1 kugla',140,2,17,7],['krofna','1 kom',300,5,35,16],['kroasan','1 kom',270,5,30,14],
 ['kifla','1 kom',200,6,38,3],['hleb','1 kriška',80,3,15,1],['integralni hleb','1 kriška',75,4,12,1],['pirinac','1 šolja kuvanog',210,4,45,0.5],['testenina','1 šolja kuvane',220,8,43,1.5],
 ['pomfrit','1 porcija',400,4,48,20],['krompir','1 srednji, kuvan',115,3,26,0.2],['pecen krompir','1 porcija sa uljem',250,4,35,10],['pasulj','1 činija',350,18,45,10],['prebranac','1 činija',380,18,50,12],
 ['musaka','1 porcija',550,25,35,35],['gulas','1 porcija',450,35,15,25],['pileci file','1 dlan',120,23,0,2.6],['piletina','1 dlan',120,23,0,2.6],['riba','1 dlan oslića',85,17,0,1.3],
 ['losos','1 dlan',210,20,0,13],['tuna','1 konzerva',140,31,0,1],['jaje','1 kom',79,7,0.4,5],['banana','1 kom',107,1.3,27,0.4],['jabuka','1 kom',94,0.5,25,0.3],
 ['pomorandza','1 kom',85,1.7,21,0.2],['grozdje','1 šaka',70,0.7,18,0.2],['orasi','1 šaka',190,4.5,4,19],['bademi','1 šaka',170,6,6,15],['cokolada','1 red (25 g)',135,2,14,8],
 ['crna cokolada','2 kockice',60,1,4,4],['cips','mala kesa',215,3,20,14],['smoki','1 kesa 50 g',265,6,26,15],['kokice','velika činija iz šerpe',100,3,20,1],['keks','5 kom',220,4,36,7],
 ['plazma','5 kom',220,4,36,7],['jogurt','1 čaša',120,7,9,6],['kiselo mleko','1 čaša',140,8,11,7],['kefir','1 čaša',130,8,10,6],['mleko','1 šolja',95,7,10,3],
 ['sir','1 kriška',100,7,1,8],['kackavalj','1 kriška',110,8,0,9],['ajvar','1 kašika',25,0.4,2,1.7],['med','1 kašika',64,0,17,0],['secer','1 kašičica',20,0,5,0],
 ['coca cola','0,33 l',139,0,35,0],['coca cola zero','0,33 l',1,0,0,0],['sok od pomorandze','1 čaša',110,2,26,0],['pivo','0,5 l',215,2,18,0],['vino','1 čaša',165,0,5,0],
 ['rakija','1 čašica',70,0,0,0],['kafa sa mlekom','1 šolja',40,2,3,2],['kafa','bez šećera',2,0,0,0],['kapucino','1 šolja',110,6,10,4],['energetsko pice','1 limenka',115,0,28,0],
 ['avokado','pola',115,1.5,6,10.5],['humus','2 kašike',60,2,4,4],['ovsene pahuljice','5 kašika',190,6.5,33,3],['gyros','1 porcija u pita hlebu',750,35,70,35],['hamburger','1 kom',550,28,45,28]
];
function foodLookup(q){const nq=' '+norm(q)+' ';let best=null;FOODS.forEach(f=>{const n=f[0];const st=(!n.includes(' ')&&n.length>=4)?n.slice(0,-1):n;if(nq.includes(' '+n)||nq.includes(' '+st)){if(!best||n.length>best[0].length)best=f}});return best}

/* Akcije iz odgovora */
function runAct(a){
  const [type,...rest]=a.split(':');const arg=rest.join(':');
  if(type==='swap'){const [key,slot]=arg.split('|');const nx=swapMeal(key,+slot);ask('Šta je novo za '+TYPE_NAMES[planFor(key)[+slot].type].toLowerCase()+'?');toast('Novo jelo: '+nx.n);return}
  if(type==='add'){const [n,k,p,c,f]=arg.split('|');addExtra(n,+k,+p||0,+c||0,+f||0);return}
  if(type==='go'){go(arg);return}
  if(type==='open'){const [key,slot]=arg.split('|');openSheet(mealSheet(key,+slot));return}
  if(type==='sheet'){if(arg==='shop')openSheet(shopSheet());else if(arg==='add')openSheet(addSheet());return}
  if(type==='ask'){ask(arg);return}
}

/* Pomoćno: odgovor o obroku */
function mealText(x,key){const m=x.meal;return `**${TYPE_NAMES[x.type]} u ${x.time}: ${m.n}**\n${R(m.nt[0])} kcal · P ${R(m.nt[1])} g · UH ${R(m.nt[2])} g · M ${R(m.nt[3])} g\n${m.items.map(it=>'- '+shortName(it.k)+': '+measure(it)).join('\n')}`}
function whichDay(q){if(/\bsutra\b/.test(q))return addDays(TODAY,1);if(/\bjuce\b/.test(q))return addDays(TODAY,-1);const dn=['ponedelj','utor','sred','cetvrt','petak','petk','subot','nedelj'],map=[0,1,2,3,4,4,5,6];for(let i=0;i<dn.length;i++)if(q.includes(dn[i])){const target=map[i],cur=dIdx(TODAY);return addDays(TODAY,(target-cur+7)%7)}return TODAY}
function whichType(q){if(/dorucak|doruck/.test(q))return 'd';if(/uzin/.test(q))return 's';if(/rucak|rucku|rucka/.test(q))return 'l';if(/vecer/.test(q))return 'v';return null}
const dayLabel=k=>k===TODAY?'danas':k===addDays(TODAY,1)?'sutra':DAYN[dIdx(k)].toLowerCase();

/* ================= BAZA ZNANJA ================= */
const P_=()=>S.p;
const KB=[
 {k:['restoran','napolj','izlaz','izlazi','kafan','jedemo vani','porudzb','dostav','naruc'],a:()=>`**Kad jedeš napolju**\n- Roštilj: piletina, ćevapi bez lepinje ili pola lepinje, šopska. Preskoči pomfrit, uzmi pečeno povrće.\n- Picerija: 2 parčeta i velika salata, ili pasta sa paradajz sosom${P_().gluten?' (pazi na gluten)':''}.\n- Kineski: piletina sa povrćem i pirinač, bez prženog i slatko-kiselog sosa.\n- Burger: jedan burger bez pomfrita, uz salatu i vodu.\n- Pre izlaska pojedi užinu, da ne dođeš gladan.\nObrok van plana upiši na Danas preko „Van plana”, a sledeći obrok neka bude lakši.`,more:['Koliko kalorija ima pljeskavica?','Šta ako pojedem više nego što treba?','Smem li alkohol?']},
 {k:['gazir','coca','kola','koka','sok','sokov','zasladj','energet'],a:()=>{const sp=sodaPlan();return `**Gazirani sokovi**\nLitar obične Coca-Cole ima oko 420 kcal i 106 g šećera. Izbacivanje je najbrži pojedinačni korak za mršavljenje.\n${sp?`- Ove nedelje: ${sp.t}. ${sp.tip}\n`:''}- Kad poželiš: mineralna voda sa limunom i ledom, ili Zero varijanta u prelaznom periodu.\n- Žudnja traje 10 do 15 minuta. Popij čašu vode i prošetaj.\n- Prvih dana možeš osetiti glavobolju i umor zbog manje kofeina i šećera. Prolazi za 3 do 5 dana.`},more:['Da li je Zero bezbedna?','Koliko vode treba da pijem?','Kafa i stomak']},
 {k:['zero','zasladjivac','aspartam','light'],a:()=>`**Zero i zaslađivači**\nZero nema kalorija i u umerenim količinama se smatra bezbednim. Koristi ga kao most dok se ne navikneš na vodu, ne kao trajnu zamenu za vodu. Kiselost gaziranih pića može da iritira osetljiv želudac${P_().stomach?', što je kod tebe bitno':''}.`},
 {k:['vod','pijem','zedj','hidrat'],a:()=>{const d=dayOf();return `**Voda**\nTvoj cilj danas je ${litres(waterT())} l, a uneo si ${litres(d.water)} l.\n- Čaša odmah po buđenju, pre svakog obroka i uz svaku kafu.\n- Flaša na stolu na poslu radi bolje od podsetnika.\n- Mineralna, čaj bez šećera i supa se računaju. Gazirani sokovi ne.\n- Žuta, tamna mokraća znači da piješ premalo.`},more:['Kako da izdržim bez gaziranog?','Da li kafa dehidrira?']},
 {k:['kaf','kofein','espres','nescaf'],a:()=>`**Kafa**\n- Do 3 do 4 šolje dnevno je u redu za većinu ljudi. Ti piješ oko ${P_().coffee}.\n- Kafa posle doručka, ne na prazan stomak${P_().stomach?'. Kod osetljivog želuca to pravi veliku razliku':''}.\n- Poslednja kafa do 15h, inače kvari san i sutradan vuče na slatko.\n- Uz svaku kafu čaša vode.\n- Kafa sa mlekom i šećerom ima oko 70 kcal. Tri dnevno su 210 kcal, kao cela užina.`,more:['Zašto se budim umoran?','Šta da jedem za doručak kad nemam vremena?']},
 {k:['dehidr'],a:()=>`Kafa blago pojačava mokrenje, ali ne dehidrira kod ljudi koji je piju redovno. Ipak, uz svaku kafu popij čašu vode, tako lakše dođeš do dnevnog cilja.`},
 {k:['alkohol','piv','vin','rakij','pice','zurk'],a:()=>`**Alkohol**\n- Pivo 0,5 l ima oko 215 kcal, čaša vina oko 165, čašica rakije oko 70.\n- Alkohol usporava sagorevanje masti dok se ne razgradi i pojačava glad.\n- Ako piješ: najviše 1 do 2 pića, uz obrok, i čaša vode posle svakog pića.\n- Biraj suvo vino ili rakiju umesto piva i koktela.\n- Sutradan bez „nadoknade” gladovanjem. Samo se vrati na plan.`,more:['Šta da jedem na slavi?','Koliko kalorija ima pivo?']},
 {k:['slav','praznik','bozic','nova godin','rodjend','svadb','gost'],a:()=>`**Slava, praznik, gosti**\n- Doručak i užinu pojedi normalno. Ko dođe gladan, pojede duplo.\n- Tanjir: pola salata i meso, malo priloga, kolač samo jedan i to onaj koji najviše voliš.\n- Sarma ima oko 180 kcal po komadu, parče gibanice oko 400.\n- Jedan dan ne kvari ništa. Sutradan nastavljaš po planu, bez kažnjavanja.\n- Ako je post, plan može biti posan: pasulj, sočivo, leblebija, riba vikendom.`,more:['Kako da jedem dok postim?','Šta ako pojedem više nego što treba?']},
 {k:['posn','postim','postu','postimo','u postu'],a:()=>`**Post**\nPosni dani u planu: sočivo sa spanaćem, prebranac, leblebija sa spanaćem, salata od tune (riba je dozvoljena vikendom i praznicima kod većine postova), pečena leblebija i voće za užine.\n- Proteina je manje, zato kombinuj mahunarke sa ribom gde je dozvoljeno.\n- Pazi na ulje i hleb, tu se kalorije najlakše nakupe.\nU profilu možeš privremeno označiti „Ne jedem meso” i jelovnik će se prilagoditi.`,more:['Zamena za ručak','Koliko proteina mi treba?']},
 {k:['prekrsi','preterao','prejeo','pojeo vise','vise nego','zabrlj','pao','posrnuo','omaska','varao','cheat'],a:()=>`**Kad se plan poremeti**\nJedan obrok ili dan ne kvari napredak. Kvari ga odustajanje posle toga.\n- Upiši šta si pojeo, bez prikrivanja. Tako vidiš realnu sliku.\n- Sledeći obrok po planu, bez preskakanja i bez kažnjavanja gladovanjem.\n- Popij vodu i prošetaj 20 minuta.\n- Vaga sutra može pokazati i 1 do 2 kg više. To je voda i so, nestaje za 2 do 3 dana.`,more:['Zašto vaga skače?','Kako da sprečim prejedanje uveče?']},
 {k:['vaga','stoji','plato','ne mrsav','ne pada','ne gub','zaglav'],a:()=>{const sl=slopeKgWeek();return `**Kad vaga stoji**\n${sl!==null?`Poslednje 3 nedelje menjaš se oko ${fmt1(-sl)} kg nedeljno.\n`:''}- Vaga normalno skače 1 do 2 kg od dana do dana zbog vode, soli i stolice. Gledaj trend, ne jedan dan.\n- Meri se uvek isto: ujutru, posle toaleta, pre doručka.\n- Proveri struk. Često se smanjuje i kad vaga stoji.\n- Ako se 2 nedelje ništa ne pomera, a jedeš po planu, aplikacija sama spušta kalorije za 100 pri nedeljnoj proveri.\n- Najčešći skriveni izvori: ulje „od oka”, gazirano, grickalice uz TV, vikendi.`},acts:[['Proveri tempo sada','go:napredak']],more:['Zašto vaga skače?','Kako se plan prilagođava?']},
 {k:['skac','fluktu','skoci','vise kila','dobio'],a:()=>`**Zašto vaga skače**\nTežina se menja i do 2 kg dnevno zbog vode, soli, ugljenih hidrata, stolice i hormona. Slan obrok ili obilna večera daju 1 do 2 kg vode koja nestaje za 2 do 3 dana. Masno tkivo se ne gomila preko noći. Zato gledaj nedeljni trend na grafikonu.`},
 {k:['prilagod','menja','zasto cilj','zasto kalor','spust','smanjen','proveri tempo','kako se plan'],a:()=>{const rv=S.reviews[0],mt=macroT();return `**Kako se plan prilagođava**\nTvoj cilj je sada ${mt.k} kcal (${PHASES[phase()][0].toLowerCase()}).\n- Potrošnja se računa iz profila i trenutne kilaže, pa porcije same malo opadaju kako mršaviš.\n- Jednom nedeljno aplikacija gleda trend kilaže i koliko obroka si pojeo. Ako stoji, a pratiš plan: -100 kcal. Ako ide prebrzo: +100 kcal.\n- Na 5 kg od cilja tempo se usporava, a na cilju plan prelazi na održavanje.\n- Najniži unos za tebe je ${floorK()} kcal.${rv?`\nPoslednja provera (${new Date(rv.d+'T12:00').toLocaleDateString('sr-Latn-RS',{day:'numeric',month:'long'})}): ${rv.msg}`:''}`},acts:[['Otvori napredak','go:napredak']]},
 {k:['protein','belancevin'],a:()=>{const mt=macroT(),tot=dayTotals();return `**Proteini**\nTvoj cilj je ${mt.p} g dnevno, danas si uneo ${R(tot[1])} g. Proteini čuvaju mišiće dok mršaviš i najduže drže sitost.\n- Dlan piletine ili ribe: oko 23 g\n- 2 jaja: 13 g\n- Grčki jogurt, pakovanje: 15 g\n- Pola šolje posnog sira: 12 g\n- Šolja kuvanog sočiva ili pasulja: 15 g\nU svakom obroku neka bude bar jedan izvor proteina.`},more:['Šta je danas za večeru?','Smem li da jedem jaja svaki dan?']},
 {k:['ugljen','hidrat','skrob','testen','pirinac','krompir','hleb','hlebo'],a:()=>`**Hleb, krompir, pirinač**\nNe moraš da ih izbacuješ. U planu ih imaš u merenim količinama: kriška hleba, jedan krompir ili šolja kuvanog pirinča uz obrok.\n- Biraj integralno, heljdu, krompir u ljusci. Duže drže sitost.\n- Pekarske proizvode (kifle, burek, pecivo) ostavi za izuzetke. Kifla ima oko 200 kcal, a parče bureka 600.\n${P_().gluten?'- Kod tebe je probni period bez glutena: heljdin ili kukuruzni hleb, pirinač, krompir, heljda i sertifikovani ovas.':''}`,more:['Šta je gluten i da li treba da ga izbacim?','Šta za doručak kad nemam vremena?']},
 {k:['gluten','celijak','psenic'],a:()=>`**Gluten**\nGluten je protein iz pšenice, raži i ječma. Kod osetljivosti izaziva nadimanje, bol i umor.\n- Probni period: 4 nedelje bez glutena, pa ga vrati i posmatraj stomak 3 do 5 dana.\n- Bez glutena: pirinač, krompir, heljda, kukuruz, proso, sertifikovani ovas.\n- Pre trajnog izbacivanja vredi da lekar proveri celijakiju krvnim testom, i to dok još jedeš gluten.\n${P_().gluten?'Jelovnik ti je trenutno bez glutena.':'Ako želiš probni period, označi to u profilu i jelovnik će se prilagoditi.'}`,acts:[['Otvori profil','go:profil']]},
 {k:['laktoz','mlecn','mleko','jogurt','sir'],a:()=>`**Mleko i mlečni proizvodi**\nGrčki jogurt, kefir, kiselo mleko i posni sir su odličan izvor proteina i kalcijuma, a kefir i jogurt pomažu crevima.\n- Kod netolerancije na laktozu kefir i tvrdi sirevi se često bolje podnose. Postoje i mleko i jogurt bez laktoze.\n- Pavlaka, kajmak i masni sirevi imaju mnogo kalorija, koristi ih kašikom, ne „od oka”.\n${P_().lactose?'Jelovnik ti je bez laktoze.':'Ako ti laktoza ne prija, označi to u profilu.'}`},
 {k:['jaj'],a:()=>`**Jaja**\nJaja su jeftin i kvalitetan protein. Za većinu ljudi 1 do 3 jaja dnevno je u redu, i kod blago povišenog holesterola, jer na holesterol u krvi više utiču zasićene masti (kobasice, slanina, kajmak, prženo) nego jaja. Spremaj ih bez mnogo ulja: kuvana, poširana ili u tiganju koji ne lepi.`},
 {k:['holester','lipid','trigliceri','srce','pritis','so ','soli','slan'],a:()=>`**Holesterol i pritisak**\n- Masna riba (losos, skuša, sardine) 2 puta nedeljno.\n- Ovas, mahunarke, orasi i maslinovo ulje svakog dana.\n- Manje: kobasice, slanina, kajmak, prženo, peciva, slatkiši.\n- So: bez dosoljavanja za stolom, kiseli kupus isperi, pazi na suhomesnato i čips.\n- Gubitak 5 do 10% kilaže sam po sebi primetno popravlja holesterol i pritisak.\nNalaz ponovi kod lekara posle 3 meseca plana.`},
 {k:['zeluda','stomak','zgaru','gorusic','nadim','gas','refluks','kiselin'],a:()=>`**Osetljiv želudac**\n- Bez kafe na prazan stomak. Prvo doručak.\n- Manji obroci češće umesto dva velika. Plan ti je zato na ${P_().mealsN} obroka.\n- Izbegavaj prženo, ljuto, mnogo luka i gaziranog.\n- Večera 2 do 3 sata pre spavanja, i ne lezi odmah posle jela.\n- Jedi polako, 15 do 20 minuta po obroku.\n- Ako se javi jak bol, povraćanje, crna stolica ili gubitak kilaže bez razloga, idi kod lekara.`,more:['Šta je gluten i da li treba da ga izbacim?','Kafa i stomak']},
 {k:['slatk','secer','cokolad','kolac','zudn','krem','nutel'],a:()=>`**Želja za slatkim**\n- Najčešće dolazi posle preskočenog obroka ili lošeg sna. Redovni obroci su prvi lek.\n- Posle ručka 2 kockice crne čokolade 85% su u redu.\n- Zamene: pečena jabuka sa cimetom, grčki jogurt sa borovnicama, čokoladna ovsena kaša.\n- Kod kuće ne drži zalihe. Kupuj jedno pakovanje kad baš poželiš.\n- Žudnja prolazi za 15 minuta. Voda i kratka šetnja pomažu.`,more:['Kako da sprečim prejedanje uveče?','Koliko kalorija ima čokolada?']},
 {k:['uvece','nocu','kasno','pred spavanj','grickal','frizider','tv'],a:()=>`**Prejedanje uveče**\n- Najčešći uzrok je premalo hrane tokom dana, naročito bez doručka i užina.\n- Užina oko 17h je obavezna, a večera sa dosta proteina.\n- Posle večere opere se zub, a kuhinja se „zatvara”.\n- Ako baš moraš: šolja čaja, kiseli krastavac, šargarepa, ili kefir.\n- Grickalice ne drži na vidnom mestu.`},
 {k:['cips','grick','smoki','kokic','keks'],a:()=>`**Grickalice**\nMala kesa čipsa ima oko 215 kcal, a uz film se lako pojedu dve. Zamene: velika činija kokica iz šerpe bez ulja (oko 100 kcal), pečena leblebija, šargarepa sa humusom, šaka badema. Grickaj iz činije, nikad iz kese.`,acts:[['Dodaj čips u dnevnik','add:Čips, mala kesa|215|3|20|14']]},
 {k:['dorucak','nemam vreme','brz dorucak','brzo dorucak','zurim','ujutru brzo'],a:()=>`**Brz doručak**\n- Ovsena kaša preko noći: večeras pomešaš ovas, mleko i jogurt, ujutru dodaš voće.\n- 2 kuvana jajeta (skuvaj 6 nedeljom) i kriška hleba.\n- Grčki jogurt sa voćem i orasima.\n- Heljdin hleb sa avokadom.\nDoručak je ono što drži energiju do ručka i smanjuje glad uveče. Ne preskači ga.`,more:['Šta je sutra za doručak?']},
 {k:['priprem','meal prep','unapred','nedelj kuv','spremi'],a:()=>`**Priprema unapred**\nNedeljom uveče, 45 minuta:\n- Skuvaj 6 do 8 jaja.\n- Ispeci pleh piletine ili ćuretine za 2 do 3 dana.\n- Skuvaj lonac pirinča ili heljde.\n- Iseci povrće u kutije.\n- Ovsenu kašu za ponedeljak stavi u frižider.\nRučak kuvaj duplo, pa je ostatak večera ili sutrašnji ručak.`,acts:[['Spisak za kupovinu','sheet:shop']]},
 {k:['kupovin','kupim','prodavn','market','spisak'],a:()=>`Spisak za ovu nedelju je napravljen iz tvog jelovnika i grupisan po delovima prodavnice${S.p.partner==='da'?', sa količinama za tebe i partnera':''}.`,acts:[['Otvori spisak','sheet:shop']]},
 {k:['partner','supru','zen','muz','porodic','deca','dete','klinc'],a:()=>`**Porodica i partner**\nJelovnik je pravljen tako da svi jedu isto, samo različite porcije.${S.p.partner==='da'?` Partnerova porcija je ${R(S.p.partnerPct*100)}% tvoje.`:''}\n- Deca jedu isto, uz dodatak hleba, voća i mlečnog po potrebi.\n- Grickalice za decu drži van vidokruga.\n- Kad deca donesu virus: češće pranje ruku, odvojeni peškiri i dovoljno sna za sve.`},
 {k:['imunit','prehlad','grip','virus','razbol','kasalj','temperatur'],a:()=>`**Imunitet**\n- San 7 do 8 sati je najjači „suplement”.\n- Vitamin C iz hrane: paprika, kivi, pomorandža, kupus, brokoli.\n- Cink: bundevine semenke, meso, mahunarke.\n- Kefir, kiselo mleko i kiseli kupus za creva.\n- Vitamin D preko zime, doza po nalazu, uz lekara.\n- Kad si bolestan: tople supe, dosta tečnosti, umesto treninga samo kratka šetnja. Ne gladuj.\n- Visoka temperatura duže od 3 dana ili otežano disanje traže lekara.`},
 {k:['vitamin','suplement','tablet','magnez','omega','cink'],a:()=>`**Suplementi**\nVećina vitamina dolazi iz hrane koju plan već sadrži. Zimi vredi proveriti vitamin D krvnim testom, jer je kod nas čest nedostatak. Omega-3 dobijaš iz ribe dva puta nedeljno. Bilo koji suplement u većoj dozi dogovori sa lekarom, posebno ako piješ lekove. „Detoks” preparati i tablete za mršavljenje nemaju smisla.`},
 {k:['umor','umoran','iscrplj','energij','pospan','budim'],a:()=>{const ds=[...Array(7)].map((_,i)=>S.days[addDays(TODAY,-i)]).filter(d=>d&&d.sleep!=null);const av=ds.length?ds.reduce((a,d)=>a+d.sleep,0)/ds.length:null;return `**Umor**\n${av?`Prosečno spavaš ${fmt1(av)} h u poslednjih 7 dana.\n`:''}Ako se budiš umoran i posle 8 sati sna, vredi proveriti:\n- Analize krvi: gvožđe i feritin, B12, vitamin D, TSH (štitna žlezda), šećer.\n- Hrkanje i pauze u disanju tokom sna (apneja). Česta je kod veće kilaže i lako se dijagnostikuje.\n- Kofein posle 15h i gazirano uveče.\n- Ekran do kasno.\nKad kilaža krene da pada, energija se obično primetno popravi za 3 do 4 nedelje.`},more:['Kako da spavam bolje?']},
 {k:['san','spav','nesanic','spavanj'],a:()=>`**Bolji san**\n- Isto vreme odlaska u krevet i buđenja, i vikendom.\n- Bez kafe posle 15h i bez gaziranog uveče.\n- Laka večera, 2 do 3 sata pre spavanja.\n- Ekran dalje sat pre spavanja, soba hladna i tamna.\n- Šetnja tokom dana poboljšava san.\nLoš san pojačava glad sutradan, posebno za slatkim.`},
 {k:['hernij','kicm','ledj','disk','krst','isijas','bol u'],a:()=>`**Kičma i diskus hernija**\n- Hodanje je najbolja aktivnost: rasterećuje diskove i troši kalorije.\n- Vežbe stabilnosti (pregib po McGillu, ptica-pas, most) jačaju trup bez pritiska na disk. Pokaži ih fizijatru.\n- Izbegavaj trbušnjake, pretklone sa teretom, uvrtanje i dugo sedenje.\n- Svaki skinut kilogram smanjuje opterećenje kičme.\n- Hitno lekaru: slabost u nozi, trnjenje u preponama ili problem sa mokrenjem.\n- Ako bol ide niz nogu ili se pojačava, prekini vežbe i javi se fizijatru.`,acts:[['Otvori trening','go:trening']],more:['Koliko da hodam?','Mogu li da plivam?']},
 {k:['hod','setn','korak','koracim'],a:()=>{const d=dayOf();return `**Hodanje**\nTvoj cilj ove nedelje je ${walkT()} minuta dnevno, danas imaš ${d.walk}.\n- Može u delovima: 10 minuta posle svakog obroka odlično spušta šećer u krvi.\n- Ravan teren, dobre patike, uspravno držanje, ruke se slobodno njišu.\n- Svake nedelje dodaj 5 minuta.\n- 30 minuta brzog hoda je otprilike 3.000 do 4.000 koraka i oko 150 kcal kod tvoje kilaže.`},acts:[['+10 min hoda','go:trening']]},
 {k:['pliv','bazen','voda vezb','akva'],a:()=>`**Plivanje**\nPlivanje i hodanje u vodi rasterećuju kičmu i odlične su aktivnosti uz višak kilograma. Kod diskus hernije je obično bolji kraul i leđni stil nego prsni sa glavom iznad vode, koji izvija vrat i donji deo leđa. Pre početka pitaj fizijatra.`},
 {k:['trening','vezb','teretan','snag','misic','trbusnj','cucanj','sklek'],a:()=>{const tr=trainingToday();return `**Trening**\nDanas: ${tr.title}.\n${tr.ex.length?tr.ex.map(e=>'- '+e[0]+': '+e[1]).join('\n'):'- Samo hod.'}\n${tr.note?tr.note+'\n':''}Za mršavljenje najviše radi ishrana, a trening čuva mišiće i kičmu. Doslednost je važnija od intenziteta.`},acts:[['Otvori trening','go:trening']]},
 {k:['sedim','sedenj','kancelar','posao','racunar','stolic'],a:()=>`**Sedeći posao**\n- Ustani na svakih 30 do 45 minuta i prošetaj 2 minuta.\n- Monitor u visini očiju, stopala na podu, leđa naslonjena.\n- Telefonske razgovore vodi u hodu.\n- Stepenice umesto lifta kad možeš.\n- Užinu i vodu imaj na stolu, da ne posežeš za automatom.`},
 {k:['ovas','pahulj','kasa'],a:()=>`Ovsene pahuljice su dobar izbor za doručak: dugo drže sitost, a beta-glukan pomaže kod holesterola. ${P_().gluten?'Uzmi one sa oznakom bez glutena, jer se obične često prave u istim pogonima kao pšenica. ':''}Pet kašika je oko 190 kcal.`},
 {k:['voc','banan','groz','jabuk'],a:()=>`**Voće**\nVoće je u planu 1 do 2 puta dnevno i ne goji samo po sebi. Najbolje uz užinu sa proteinom ili orasima. Banana oko 107 kcal, jabuka 94, šaka grožđa 70. Voćni sokovi i smutiji su druga priča: lako se popije 3 do 4 voćke odjednom.`},
 {k:['povrc','salat'],a:()=>`Povrće jedi koliko želiš: 2 pune šake uz ručak i večeru su minimum. Ima malo kalorija, mnogo vlakana i vitamina, a dobro puni stomak. Kalorije dolaze od ulja i preliva, zato ulje dodaj kašikom.`},
 {k:['ulj','mast','pržen','prz','tigan','fritez','maslac','kajmak'],a:()=>`**Masti i ulje**\nJedna kašika ulja ima oko 90 kcal. Ulje „od oka” je najčešći skriveni izvor kalorija.\n- Meri kašikom, ne sipaj iz flaše.\n- Peci u rerni, na grill tiganju ili u tiganju koji ne lepi.\n- Maslinovo ulje, orasi, avokado i riba su dobre masti. Kajmak, slanina i prženo ostavi za retke prilike.`},
 {k:['meso','crveno','svinj','kobas','sunk','suhomes','salam'],a:()=>`Piletina, ćuretina i riba su najbolji izbor svakog dana. Posna junetina i svinjski file su u redu 1 do 2 puta nedeljno. Suhomesnato (salama, kobasice, slanina, šunka) ima mnogo soli i zasićenih masti, pa ga ostavi za izuzetke, posebno zbog holesterola i pritiska.`},
 {k:['post isprekid','intermit','16 8','gladov','preskac','preskoc'],a:()=>`**Preskakanje obroka i isprekidani post**\nZa tebe nije dobar izbor, bar ne sada. Preskakanje doručka je navika koju menjamo, jer vodi u glad i prejedanje uveče, a želudac lošije podnosi duge pauze. Redovni obroci su osnova ovog plana.`},
 {k:['keto','bez ugljen','detoks','sokovi dijet','dijeta od'],a:()=>`Keto, detoks i druge stroge dijete daju brz početni pad, uglavnom vode, i teško se drže. Ovaj plan je napravljen da možeš da ga držiš mesecima, uz hranu koju voliš i jedeš sa porodicom. Rezultat dolazi od doslednosti, ne od strogoće.`},
 {k:['motivac','odusta','tesko','ne mogu','dosadil','ne ide'],a:()=>{const lost=S.weights.length?S.weights[0].w-curW():0;return `**Kad je teško**\n${lost>0.4?`Već si skinuo ${fmt1(lost)} kg. To je rezultat koji se vidi.\n`:''}- Ne moraš da budeš savršen, dovoljno je da budeš uporan. 80% plana daje odličan rezultat.\n- Gledaj struk i odeću, ne samo vagu.\n- Izaberi jednu stvar za ovu nedelju, na primer doručak svaki dan ili 2 l vode.\n- Loš dan je samo dan. Sledeći obrok je nova prilika.`}},
 {k:['cilj','odrzav','kad stignem','posle dijet'],a:()=>{const eta=etaDate();return `**Cilj i posle cilja**\n${eta?`Ovim tempom do ${S.p.goalW} kg stižeš oko ${monthYear(eta)}.`:'Cilj je dostignut.'}\nNa poslednjih 5 kg tempo se namerno usporava. Kad stigneš, plan prelazi na održavanje: kalorije se podižu do tvoje potrošnje, a navike ostaju iste. Upravo te navike čuvaju kilažu.`}},
 {k:['bezbedn','koliko brzo','brzo mrsav','mrsavljenje brz','brze','30 kg','mrsavljenj'],a:()=>`Bezbedan tempo je 0,5 do 1% telesne težine nedeljno, za tebe oko ${fmt1(rateKg())} kg. Prvih nedelja ide brže zbog vode i izbacivanja gaziranog. Brže od toga se gube mišići, pada imunitet i kilaža se vraća.`},
 {k:['merit','mere','vag','dlan','sak','kasik','solj','kuhinjsk'],a:()=>`**Mere bez vage**\n- Dlan (veličina i debljina): oko 100 g mesa ili ribe.\n- Šolja (250 ml): kuvan pirinač, sočivo, heljda.\n- Šaka: povrće ili voće.\n- Kašika je supena, kašičica je za kafu.\nKalorije su izračunate za te mere, sa greškom od oko 10%, što je dovoljno.`,acts:[['Prikaži mere','go:jelovnik']]},
 {k:['zdravo','cao','pozdrav','hej','dobro jutro','dobar dan'],a:()=>`Zdravo${S.p.name?' '+S.p.name.split(' ')[0]:''}! Pitaj me za jelovnik, kalorije, zamene, trening ili bilo šta oko ishrane.`},
 {k:['hvala','fala','super','odlicno'],a:()=>`Nema na čemu. Tu sam kad god zatreba.`}
];

/* ================= PREPOZNAVANJE ================= */
function answerCore(raw){
  const q=norm(raw);const T=toks(raw);

  // Upis: pojeo/popio sam ...
  const fl0=foodLookup(q);
  if(fl0&&/(pojeo|popio|pojela|popila|jeo sam|pio sam|smazao|pojedoh)/.test(q)){const m=q.match(/(\d+(?:\.\d+)?)/);let nm=m?parseFloat(m[1]):1;if(!(nm>0))nm=1;nm=Math.min(10,nm);const nmz=fl0[0].charAt(0).toUpperCase()+fl0[0].slice(1);
    return {text:`${nmz} (${fl0[1]})${nm!==1?' × '+String(nm).replace('.',','):''}: oko **${R(fl0[2]*nm)} kcal**. ${nm*fl0[2]>400?'Nije problem, samo neka sledeći obrok bude lakši i dodaj šetnju.':'Upiši ga da dnevni zbir bude tačan.'}`,acts:[['Upiši u dnevnik','add:'+nmz+(nm!==1?' × '+String(nm).replace('.',','):'')+'|'+R(fl0[2]*nm)+'|'+R(fl0[3]*nm)+'|'+R(fl0[4]*nm)+'|'+R(fl0[5]*nm)]],more:['Koliko mi je kalorija ostalo?','Šta ako pojedem više nego što treba?']}}
  // Zašto se cilj menja
  if(/zasto|zbog cega|kako to/.test(q)&&/cilj|kalorij|smanj|promen|porcij/.test(q)){const e=KB.find(x=>x.k.includes('prilagod'));return {text:e.a(),acts:e.acts||[]}}
  // Zamena obroka
  if(/zamen|umesto|ne volim|necu|nemam|drugo jelo|nesto drugo/.test(q)&&(whichType(q)||/obrok|jelo/.test(q))){
    const key=whichDay(q),pl=planFor(key);let type=whichType(q);let x=type?pl.find(p=>p.type===type):null;
    if(!x){const nx=pl.find(p=>!dayOf(key).eat[p.slot])||pl[0];x=nx}
    const alts=pool(x.type).filter(m=>m.id!==x.meal.id).slice(0,4);
    return {text:`Za ${dayLabel(key)} je ${TYPE_NAMES[x.type].toLowerCase()}: **${x.meal.n}**.\nDruge opcije koje odgovaraju tvom profilu:\n${alts.map(m=>'- '+m.n).join('\n')}\nDugme ispod menja jelo, a porcija se računa za tvoj cilj.`,acts:[['Zameni '+TYPE_NAMES[x.type].toLowerCase(),'swap:'+key+'|'+x.slot],['Prikaži recept','open:'+key+'|'+x.slot]]};
  }
  // Zamena namirnice
  const swapFood=[[/ribu|ribe|riba|losos|oslic|tun/,'ribu','piletinu ili ćuretinu (isto dlanova), jaja (2 jajeta umesto 1 dlana) ili leblebiju (pola konzerve umesto dlana).'],[/piletin|meso|ćuret|curet/,'meso','ribu (isti broj dlanova), jaja, posni sir ili mahunarke (šolja sočiva ili pasulja umesto dlana mesa).'],[/jaj/,'jaja','grčki jogurt (pakovanje umesto 2 jajeta), posni sir ili ćureći file.'],[/mlek|jogurt|sir\b|kefir/,'mlečno','mleko i jogurt bez laktoze, ili jaja i humus kao izvor proteina u užini.'],[/hleb|kriš|kris/,'hleb','pirinčane krekere (3 kom umesto kriške), krompir ili šaku kuvane heljde.'],[/pirinac|pirinč|pirinc|krompir|testen/,'prilog','krompir, heljdu, batat ili kukuruzni hleb u istoj količini (šolja ili pesnica).'],[/orah|orasi|badem|kikiriki/,'orašasto','bundevine semenke (1 kašika) ili avokado (četvrtina).']];
  if(/zamen|umesto|nemam|ne volim|cime da|čime/.test(q)){for(const [re,lbl,txt] of swapFood){if(re.test(q))return {text:`Umesto ${lbl.replace('ribu','ribe').replace('meso','mesa').replace('jaja','jaja').replace('hleb','hleba').replace('prilog','priloga')}: ${txt}\nAko ne jedeš nešto stalno, označi to u profilu i jelovnik se sam prilagođava.`,acts:[['Otvori profil','go:profil']]}}}

  // Recept
  if(/kako (da )?(napravim|spremim|se pravi|se sprema)|recept|priprem/.test(q)){
    const m=LIB.map(m=>({m,s:toks(m.n).filter(w=>w.length>3&&q.includes(w.slice(0,5))).length})).sort((a,b)=>b.s-a.s)[0];
    if(m&&m.s>0){const sm=scaleMeal(m.m,sumN(m.m.i)[0]);return {text:`**${m.m.n}**\n${sm.items.map(it=>'- '+shortName(it.k)+': '+measure(it)).join('\n')}\n${m.m.r}`}}
    const t=whichType(q);if(t){const key=whichDay(q),x=planFor(key).find(p=>p.type===t);if(x)return {text:mealText(x,key)+'\n'+x.meal.r,acts:[['Otvori obrok','open:'+key+'|'+x.slot]]}}
  }
  // Šta jedem
  const t=whichType(q);
  if((t&&/sta|šta|koji|kakav|imam|ima|meni|jelovnik|plan|za\b/.test(q))||/sta (jedem|je na meniju|imam danas)|jelovnik za|meni za (danas|sutra)/.test(q)){
    const key=whichDay(q),pl=planFor(key);
    if(t){const xs=pl.filter(p=>p.type===t);return {text:xs.map(x=>mealText(x,key)).join('\n\n'),acts:xs.slice(0,1).map(x=>['Prikaži recept','open:'+key+'|'+x.slot]).concat(key===TODAY?[['Zameni','swap:'+key+'|'+xs[0].slot]]:[]),more:['Koliko mi je kalorija ostalo?','Zamena za '+TYPE_NAMES[t].toLowerCase()]}}
    const tot=pl.reduce((a,x)=>a+x.meal.nt[0],0);return {text:`**Jelovnik za ${dayLabel(key)}** (${R(tot)} kcal)\n${pl.map(x=>`- ${x.time} ${TYPE_NAMES[x.type]}: ${x.meal.n}, ${R(x.meal.nt[0])} kcal`).join('\n')}`,acts:[['Otvori jelovnik','go:jelovnik']]};
  }
  // Kalorije namirnice
  const fl=foodLookup(q);
  if(fl&&/kalor|kcal|koliko|ima li|goji/.test(q)){return {text:`**${fl[0].charAt(0).toUpperCase()+fl[0].slice(1)}** (${fl[1]}): oko ${fl[2]} kcal\nProteini ${fmt1(fl[3])} g · UH ${fmt1(fl[4])} g · masti ${fmt1(fl[5])} g\nTo je ${R(fl[2]/macroT().k*100)}% tvog dnevnog cilja.`,acts:[['Dodaj u dnevnik','add:'+fl[0].charAt(0).toUpperCase()+fl[0].slice(1)+' ('+fl[1]+')|'+fl[2]+'|'+fl[3]+'|'+fl[4]+'|'+fl[5]]],more:['Koliko mi je kalorija ostalo?','Šta da jedem kad izlazimo u restoran?']}}
  // Preostale kalorije
  if(/koliko.*(kalor|kcal)|ostalo|preostal|koliko sam (pojeo|uneo|jeo)|dnevni unos|koliko jos/.test(q)&&!fl){
    const mt=macroT(),tot=dayTotals(),left=mt.k-tot[0];const pl=planFor(TODAY),d=dayOf(),rem=pl.filter(x=>!d.eat[x.slot]);
    return {text:`Danas si uneo **${R(tot[0])} kcal** od ${mt.k}. ${left>=0?`Ostalo je **${R(left)} kcal**.`:`Preko si za **${R(-left)} kcal**, pa neka sledeći obroci budu lakši i dodaj šetnju.`}\nProteini ${R(tot[1])} od ${mt.p} g · UH ${R(tot[2])} od ${mt.c} g · masti ${R(tot[3])} od ${mt.f} g.${rem.length?`\nNeoznačeni obroci u planu: ${rem.map(x=>x.meal.n+' ('+R(x.meal.nt[0])+')').join(', ')}.`:''}`,acts:[['Dodaj van plana','sheet:add']]};
  }
  // Napredak
  if(/koliko sam (skinuo|izgubio|smrsao|oslabio)|kad cu|kada cu|do cilja|moj napredak|kako napredujem|tempo/.test(q)){
    const lost=S.weights.length?S.weights[0].w-curW():0,eta=etaDate(),sl=slopeKgWeek();
    return {text:`Sada si ${fmt1(curW())} kg${lost>0?`, ${fmt1(lost)} kg manje od početka`:''}. ${sl!==null?`Poslednje 3 nedelje: ${fmt1(-sl)} kg nedeljno, a plan je ${fmt1(rateKg())}.`:'Za tempo trebaju bar dva merenja.'}\n${eta?`Do ${S.p.goalW} kg oko ${monthYear(eta)}.`:'Cilj je dostignut.'}`,acts:[['Otvori napredak','go:napredak']]};
  }
  // Trening danas
  if(/(sta|koliko|koji).*(trenir|vezb|hodam|setam|hod)/.test(q)&&/danas|sutra|treba|da/.test(q)){
    const key=whichDay(q),tr=trainingToday(key);return {text:`**${dayLabel(key).charAt(0).toUpperCase()+dayLabel(key).slice(1)}: ${tr.title}**\n- Hod: ${walkT()} minuta\n${tr.ex.map(e=>'- '+e[0]+': '+e[1]).join('\n')}${tr.note?'\n'+tr.note:''}`,acts:[['Otvori trening','go:trening']]};
  }
  // Ciljevi
  if(/koliko (mi )?(treba|trebam|smem)|moj cilj|cilj (kalorij|protein)|koliko (proteina|ugljen|masti)/.test(q)){const mt=macroT();return {text:`Tvoj dnevni cilj: **${mt.k} kcal**, proteini ${mt.p} g, ugljeni hidrati ${mt.c} g, masti ${mt.f} g, voda ${litres(waterT())} l, hod ${walkT()} min.\nIzračunato iz profila i trenutne kilaže, a menja se kako napreduješ.`,acts:[['Otvori profil','go:profil']]}}

  // Baza znanja
  let best=null,bs=0;
  KB.forEach(e=>{const sc=kbScore(e,q,T);if(sc>bs){bs=sc;best=e}});
  if(best&&bs>0){const a=best.a();return {text:a,acts:best.acts||[],more:best.more||null}}
  if(fl)return {text:`**${fl[0]}** (${fl[1]}): oko ${fl[2]} kcal, proteini ${fl[3]} g.`,acts:[['Dodaj u dnevnik','add:'+fl[0]+' ('+fl[1]+')|'+fl[2]+'|'+fl[3]+'|'+fl[4]+'|'+fl[5]]]};
  return {miss:true,text:`Nisam siguran da sam razumeo. Mogu da pomognem oko:\n- jelovnika i zamena („šta je sutra za ručak”, „zamena za večeru”)\n- kalorija („koliko mi je ostalo”, „koliko kalorija ima burek”)\n- treninga i kičme, imuniteta, sna, restorana, slave, gaziranog\nProbaj da pitaš drugim rečima.`,more:['Šta je danas za večeru?','Koliko mi je kalorija ostalo?','Šta da jedem kad izlazimo u restoran?','Zašto vaga stoji?']};
}

/* ================= SAVETNIK v3: razumevanje, kontekst, nove namere ================= */
const SYN=[[/\bvecr\w*|\bvecere\b|\bveceras\b|\bvecerati\b|\bvecerom\b|\bvecer\b/g,'vecera'],[/\bsmrs\w*|\bomrsa\w*/g,'mrsavljenje'],[/\brucati\b|\brucku\b|\bruckom\b/g,'rucak'],[/\bdoruckovati\b|\bdoruckom\b/g,'dorucak'],
 [/\bklop\w*/g,'hrana'],[/\bkoka ?kol\w*|\bkokakol\w*|\bcoca ?col\w*|\bkola\b/g,'coca cola'],[/\bpivce\b|\bpivca\b/g,'pivo'],[/\bkafic\w*/g,'kafa'],[/\bkcal\b|\bkalorij\w*/g,'kalorija'],
 [/\bkilaz\w*|\bkila\b|\bkile\b|\bkilogram\w*/g,'kg'],[/\bsetnj\w*|\bprosetati\b|\bsetam\b/g,'setnja hod'],[/\bteretan\w*/g,'trening teretana'],[/\bjeo\b|\bjela\b(?= sam)/g,'pojeo'],
 [/\bjednu\b|\bjedan\b|\bjedno\b/g,'1'],[/\bdva\b|\bdve\b|\bdvije\b/g,'2'],[/\btri\b/g,'3'],[/\bcetiri\b/g,'4'],[/\bpet\b(?! sati)/g,'5'],[/\bpola\b/g,'0.5'],[/\bvecernj\w*/g,'vecera'],[/\bmrsav\w*/g,'mrsavljenje'],[/\bdeblj\w*|\bgojim\b|\bugojio\b/g,'goji']];
function expand(raw){let q=norm(raw);SYN.forEach(([re,to])=>{q=q.replace(re,to)});return q.replace(/\s+/g,' ').trim()}
function lev(a,b){if(a===b)return 0;const m=a.length,n=b.length;if(Math.abs(m-n)>1)return 2;let prev=[...Array(n+1).keys()];for(let i=1;i<=m;i++){const cur=[i];for(let j=1;j<=n;j++)cur[j]=Math.min(prev[j]+1,cur[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));prev=cur}return prev[n]}
function kbScore(e,q,T){let s=0;e.k.forEach(st=>{if(st.includes(' ')){if(q.includes(st))s+=2;return}
  if(T.some(w=>w.startsWith(st)||(w.length>=4&&st.startsWith(w))))s+=1;
  else if(st.length>=5&&T.some(w=>w.length>=st.length&&lev(w.slice(0,st.length),st)<=1))s+=0.8});return s}
const CTX={intent:null,day:null,type:null,food:null};
const TYPE_WORD={d:'dorucak',s:'uzina',l:'rucak',v:'vecera'};
function dayWord(key){if(key===TODAY)return 'danas';if(key===addDays(TODAY,1))return 'sutra';return norm(DAYN[dIdx(key)])}

/* Namirnice za pretragu "šta mogu od ..." */
const ING=[[/piletin|pilec|piletinom/,['piletina','batak']],[/curet|curec/,['cureciFile','cureceMleveno']],[/jaj/,['jaje']],[/krompir/,['krompir']],[/pirinac|pirinc|riza/,['pirinac','pirinacInt']],[/tun/,['tuna']],
 [/pasulj/,['pasulj']],[/socivo|sociva/,['sociva']],[/leblebij|naut/,['leblebija']],[/\bsir/,['posniSir','mladiSir']],[/jogurt/,['grcki']],[/brokoli/,['brokoli']],[/tikvic/,['tikvica']],[/paprik/,['paprika']],
 [/pecurk/,['pecurke']],[/\briba|ribu|ribe/,['oslic','losos','skusa','pastrmka','sardine','tuna']],[/losos/,['losos']],[/oslic/,['oslic']],[/junetin|govedj|junec/,['junetina','junecaMlevena']],[/svinj/,['svinjskiFile']],
 [/mleven/,['cureceMleveno','junecaMlevena']],[/spanac/,['spanac']],[/heljd/,['heljda']],[/ovas|ovsen|pahulj/,['ovas']],[/kupus/,['kupus','kiseliKupus']],[/boranij/,['boranija']],[/grasak/,['grasak']],[/bundev/,['bundeva']],[/batat/,['batat']],[/avokad/,['avokado']]];

function intentsV3(q,raw){
  const T=toks(q);
  // Nedeljni pregled
  if(/kako mi ide|ova nedelja|ove nedelje|nedeljni|izvestaj|pregled nedelj|kako stojim/.test(q)){
    const ks=[...Array(7)].map((_,i)=>addDays(TODAY,-i)),mt=macroT();const logged=ks.filter(k=>dayTotals(k)[0]>0);
    const avgK=logged.length?logged.reduce((a,k)=>a+dayTotals(k)[0],0)/logged.length:0;const adh=ks.reduce((a,k)=>a+adherence(k),0)/7;
    const wat=ks.map(k=>S.days[k]?S.days[k].water:0),walk=ks.map(k=>S.days[k]?S.days[k].walk:0);const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
    const sl=slopeKgWeek();const ex=ks.filter(k=>S.days[k]&&S.days[k].ex).length;
    const good=[],work=[];
    if(adh>=0.8)good.push('obroci po planu');else work.push('redovni obroci ('+R(adh*100)+'% pojedeno)');
    if(avg(wat)>=waterT()*0.8)good.push('voda');else work.push('voda (prosek '+litres(avg(wat))+' l)');
    if(avg(walk)>=walkT()*0.8)good.push('hodanje');else work.push('hodanje (prosek '+R(avg(walk))+' min)');
    return {text:`**Poslednjih 7 dana**\n- Kalorije: ${logged.length?'prosek '+R(avgK)+' kcal na '+logged.length+' upisanih dana, cilj '+mt.k:'nema upisa'}\n- Obroci po planu: ${R(adh*100)}%\n- Voda: prosek ${litres(avg(wat))} l od ${litres(waterT())} l\n- Hod: prosek ${R(avg(walk))} min od ${walkT()}\n- Vežbe: ${ex} od 7 dana\n- Kilaža: ${sl!==null?fmt1(-sl)+' kg nedeljno':'treba bar dva merenja'}\n${good.length?'Ide dobro: '+good.join(', ')+'.':''}${work.length?'\nZa sledeću nedelju fokus na: '+work[0]+'.':''}`,acts:[['Otvori napredak','go:napredak']]};
  }
  // Glad
  if(/gladan|gladna|glad me|umirem od gladi|sta (da )?(jedem|pojedem) (sad|odmah|sada)|nesto (da )?(pojedem|prezalogajim)/.test(q)){
    const pl=planFor(TODAY),d=dayOf(),nx=pl.find(x=>!d.eat[x.slot]),left=macroT().k-dayTotals()[0];
    if(!nx)return {text:`Svi obroci za danas su pojedeni${left>0?`, a ostalo ti je ${R(left)} kcal`:''}.\n- Prvo čaša vode ili čaj, glad i žeđ se lako pomešaju.\n- ${left>150?'Možeš kefir, jabuku, šargarepu sa humusom ili kuvano jaje (do 150 kcal).':'Ako baš moraš: krastavac, šargarepa ili šolja čaja.'}\n- Ako si gladan svako veče, javi mi, možda je večera premala.`,more:['Kako da sprečim prejedanje uveče?']};
    const [h,m]=nx.time.split(':').map(Number),now=new Date(),mins=h*60+m-(now.getHours()*60+now.getMinutes());
    if(mins<=60)return {text:`Sledeći obrok je blizu: **${nx.meal.n}** u ${nx.time}. Pojedi ga sada, ništa se ne kvari ako je sat ranije.`,acts:[['Prikaži obrok','open:'+TODAY+'|'+nx.slot]]};
    return {text:`Sledeći obrok je u ${nx.time}: ${nx.meal.n}. Do tada:\n- Čaša vode prvo.\n- Mala užina do 150 kcal: jabuka, kefir, kuvano jaje, šargarepa sa 2 kašike humusa.\n- Ako si propustio prethodni obrok, pojedi njega sada.`,acts:[['Prikaži sledeći obrok','open:'+TODAY+'|'+nx.slot]]};
  }
  // Imam X kalorija
  const km=q.match(/(\d{2,4}) ?(kalorija|kcal)/);
  if(km&&/(ostal|imam|preostal|jos|sta da|sta mogu|za)/.test(q)&&!foodLookup(q)){
    const X=+km[1];if(X<60)return {text:'To je malo prostora, dovoljno za čaj, krastavac ili šargarepu.'};
    const type=X<350?'s':'v';const opts=pool(type).map(m=>scaleMeal(m,X*0.9)).filter(m=>m.nt[0]<=X+20).sort((a,b)=>b.nt[1]-a.nt[1]).slice(0,4);
    return {text:`Za oko ${X} kcal, sa najviše proteina:\n${opts.map(m=>`- ${m.n}: ${R(m.nt[0])} kcal, P ${R(m.nt[1])} g`).join('\n')}`,acts:opts.slice(0,2).map(m=>['Recept: '+m.n,'ask:kako da napravim '+m.n])};
  }
  // Šta mogu od namirnica
  if(/(sta|koje|nesto) (mogu|da|jelo).*(od|sa|napravim|skuvam|spremim)|imam (u frizideru|kod kuce)|od (ovoga|toga) da/.test(q)||/^(imam|od) /.test(q)){
    const keys=[];ING.forEach(([re,ks])=>{if(re.test(q))ks.forEach(k=>keys.push(k))});
    if(keys.length){const x=exclTags();const res=LIB.filter(m=>!m.tg.some(t=>x.includes(t))).map(m=>({m,s:new Set(m.i.filter(it=>keys.includes(it.k)).map(it=>it.k)).size})).filter(r=>r.s>0).sort((a,b)=>b.s-a.s).slice(0,5);
      if(res.length)return {text:`Od toga možeš:\n${res.map(r=>`- ${r.m.n} (${TYPE_NAMES[r.m.t[0]].toLowerCase()})`).join('\n')}\nPorcije se računaju za tvoj cilj kad ga izabereš kao zamenu u jelovniku.`,acts:res.slice(0,3).map(r=>['Recept: '+r.m.n,'ask:kako da napravim '+r.m.n])};}
  }
  return null;
}
function followUp(q){
  const T=toks(q);if(T.length>5||!CTX.intent)return null;if(!(/^(a|i|a sta|sta je sa|a za|a koliko)\b/.test(q)||T.length<=2))return null;if(/zamen|umesto|recept|kako|kalorija|koliko/.test(q)&&CTX.intent!=='kcalfood')return null;
  const day=/\b(sutra|danas|juce|prekosutra|ponedelj\w*|utor\w*|sred\w*|cetvrt\w*|petak|petk\w*|subot\w*|nedelj\w*)\b/.exec(q);
  const type=whichType(q);
  if(CTX.intent==='meal'&&(day||type)){return 'sta je '+(day?day[1].replace('prekosutra',dayWord(addDays(TODAY,2))):CTX.day)+' za '+(type?TYPE_WORD[type]:(CTX.type?TYPE_WORD[CTX.type]:'jelovnik'))}
  if(CTX.intent==='swap'&&(day||type)){return 'zamena za '+(type?TYPE_WORD[type]:TYPE_WORD[CTX.type]||'rucak')+' '+(day?day[1]:CTX.day)}
  if(CTX.intent==='kcalfood'&&/^(a |i |a koliko |sta je sa )/.test(q+' ')&&foodLookup(q))return 'koliko kalorija ima '+q.replace(/^(a|i|sta je sa)\s+/,'');
  return null;
}
function suggestFor(q,T){const sc=KB.map(e=>({e,s:kbScore(e,q,T)})).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,3);return sc}
const TOPIC_Q=e=>{const m=e.a().match(/^\*\*(.+?)\*\*/);return m?m[1]:null};
function answer(raw){
  let q=expand(raw);const fu=followUp(q);if(fu)q=fu;
  let res=intentsV3(q,raw)||answerCore(q);
  // kontekst
  const t=whichType(q),day=whichDay(q);
  if(/zamen|umesto/.test(q)){CTX.intent='swap'}else if(t||/jelovnik|meni/.test(q)){CTX.intent='meal'}else if(/kalorija|koliko/.test(q)&&foodLookup(q)){CTX.intent='kcalfood'}else if(!res.miss){CTX.intent=null}
  if(t)CTX.type=t;CTX.day=dayWord(day);
  if(res.miss){S.miss=S.miss||[];if(!S.miss.some(m=>m.q===raw.trim()))S.miss.push({q:raw.trim(),d:TODAY});S.miss=S.miss.slice(-100);
    const T=toks(q),sg=suggestFor(q,T);
    const more=sg.map(x=>TOPIC_Q(x.e)).filter(Boolean).map(t=>t.charAt(0).toUpperCase()+t.slice(1).toLowerCase());
    res.text=`Ovo još ne znam sigurno. Zabeležio sam pitanje da ga dodam u bazu.${more.length?'\nMožda te zanima nešto od ovoga:':'\nMogu da pomognem oko jelovnika, zamena, kalorija jela, treninga, kičme, imuniteta, sna, restorana i slave.'}`;
    res.more=more.length?more:['Šta je danas za večeru?','Koliko mi je kalorija ostalo?','Kako mi ide ove nedelje?','Šta da jedem kad izlazimo u restoran?'];
  }
  return res;
}

/* ---- Proširena baza jela i pića ---- */
FOODS.push(
 ['kacamak','1 porcija',350,8,55,10],['pita sa mesom','1 parče',450,18,35,26],['pita sa jabukama','1 parče',300,4,45,12],['pita sa spanacem','1 parče',380,12,32,22],['pogaca','1 parče',250,7,42,6],
 ['djevrek','1 kom',300,10,55,5],['perec','1 kom',250,8,48,3],['kiflica','1 kom',90,2,14,3],['zemicka','1 kom',140,5,28,1],['tost','1 kriška',75,2.5,14,1],['sendvic iz pekare','1 kom',500,22,50,22],
 ['mekike','1 kom',250,5,30,12],['kolac','1 parče',350,4,45,17],['torta','1 parče',450,5,50,25],['baklava','1 parče',330,5,40,17],['tulumba','1 kom',150,1,20,7],['vanilice','3 kom',180,2,22,9],
 ['urmasica','1 kom',150,2,20,7],['puding','1 čaša',160,4,27,4],['sutlijas','1 porcija',250,7,40,7],['pohovana piletina','1 porcija',450,35,20,25],['karadjordjeva','1 kom',900,45,35,62],
 ['becka snicla','1 kom',550,35,25,34],['pecenje','1 porcija',450,30,0,36],['mesano meso','1 porcija sa roštilja',750,55,2,58],['kulen','3 kriške',180,10,1,15],['prsuta','3 kriške',120,14,0,7],
 ['sunka','2 kriške',70,9,1,3],['pileca prsa narezak','2 kriške',40,8,0.5,0.5],['pasteta','1 kašika',60,2,1,5],['majonez','1 kašika',95,0.2,0.2,10],['kecap','1 kašika',20,0.3,5,0],['pavlaka','1 kašika',40,0.5,0.6,4],
 ['feta','1 kriška 30 g',80,4,1,6],['mocarela','pola kuglice',125,9,1,10],['mladi sir','2 kašike',60,4,1,4],['urnebes','2 kašike',90,4,1,8],['proja','1 parče',250,6,35,9],
 ['riblja corba','1 činija',200,18,12,8],['pileca supa','1 činija',120,10,8,5],['govedja supa','1 činija',150,12,6,8],['paprikas','1 porcija',450,35,15,28],['sataras','1 porcija',150,3,12,10],
 ['djuvec','1 porcija',300,6,45,11],['punjene paprike','2 kom',450,25,30,25],['kupus salata','1 porcija',50,1,8,2],['sopska salata','1 porcija',200,8,8,15],['grcka salata','1 porcija',250,7,9,20],
 ['krompir salata','1 porcija',220,4,30,9],['pire krompir','1 porcija',220,4,30,9],['spagete bolonjeze','1 porcija',650,30,80,22],['lazanje','1 porcija',600,30,45,32],['karbonara','1 porcija',750,28,80,35],
 ['rizoto','1 porcija',450,20,60,14],['pica cela','cela margarita',850,35,105,30],['pomfrit mali','mala porcija',230,3,29,11],['giros','1 porcija u pita hlebu',750,35,70,35],['kebab','1 kom',700,35,65,32],
 ['pileci burger','1 kom',500,25,45,24],['big mek','1 kom',550,25,45,30],['cizburger','1 kom',300,15,33,12],['nagetsi','6 kom',270,15,16,16],['hot dog','1 kom',350,12,30,20],['tortilja sa piletinom','1 kom',500,30,45,20],
 ['susi','8 komada',350,15,55,8],['kesten','1 šaka pečenih',140,2,30,1],['kikiriki','1 šaka',170,7,5,14],['pistaci','1 šaka',160,6,8,13],['suvo grozdje','1 šaka',120,1,32,0],['urme','3 kom',70,0.6,18,0],
 ['suve sljive','5 kom',100,1,26,0],['nutela','1 kašika',100,1,11,6],['eurokrem','1 kašika',90,1,10,5],['dzem','1 kašika',50,0,13,0],['musli','1 šolja',350,9,60,8],['kornfleks','1 šolja sa mlekom',210,8,35,3],
 ['proteinska cokoladica','1 kom',200,20,20,7],['proteinski sejk','1 merica u vodi',120,24,3,1.5],['vocni jogurt','1 čaša',150,5,24,3],['kruska','1 kom',95,0.6,25,0.2],['breskva','1 kom',60,1.4,14,0.4],
 ['kajsije','3 kom',50,1.4,12,0.4],['sljive','5 kom',75,1,19,0.4],['tresnje','1 šaka',60,1,15,0.2],['lubenica','1 kriška',85,1.7,21,0.4],['dinja','1 kriška',50,1.2,12,0.3],['mandarine','2 kom',70,1,18,0.4],
 ['ananas','1 kriška',40,0.4,11,0.1],['smokve','2 kom',75,0.8,19,0.3],['nar','pola',115,2,26,1.6],['kukuruz','1 klip',120,4,27,1.5],['grasak','1 šolja',120,8,21,0.6],['boranija','1 šolja',40,2,9,0.3],
 ['kiseli krastavci','3 kom',15,0.6,3,0.2],['masline','10 kom',50,0.3,2,5],['limunada','1 čaša sa šećerom',100,0,26,0],['ledeni caj','0,5 l',150,0,38,0],['sok od jabuke','1 čaša',110,0,27,0],
 ['cedjeni sok','1 čaša',110,2,26,0.5],['topla cokolada','1 šolja',300,8,45,10],['kakao','1 šolja sa mlekom',200,8,25,7],['spricer','1 čaša',85,0,3,0],['kuvano vino','1 šolja',200,0,25,0],['koktel','1 kom',250,0,30,0],
 ['viski','1 čašica',70,0,0,0],['votka','1 čašica',70,0,0,0],['gin tonik','1 čaša',170,0,15,0],['radler','0,5 l',180,1,28,0],['bezalkoholno pivo','0,5 l',100,1,22,0],['cedevita','1 čaša',70,0,17,0],
 ['fanta','0,33 l',140,0,35,0],['sprite','0,33 l',130,0,33,0],['tonik','0,33 l',120,0,30,0],['kombuha','0,33 l',30,0,7,0],['heljda','1 šolja kuvane',155,6,34,1],['kinoa','1 šolja kuvane',220,8,39,3.5],
 ['kus kus','1 šolja kuvanog',175,6,36,0.3],['integralni pirinac','1 šolja kuvanog',215,5,45,1.8],['batat','1 kom',130,2.4,30,0.2],['leblebija','pola konzerve',200,11,32,3],['socivo','1 šolja kuvanog',230,18,40,0.8],
 ['tofu','100 g',145,15,3,9],['skusa','1 kom',300,28,0,21],['sardine','1 konzerva',190,22,0,10],['pastrmka','1 kom',240,34,0,10.5],['svinjski file','1 dlan',145,21,0,6],['junetina','1 dlan',150,22,0,7],
 ['cureci file','1 dlan',110,24,0,1.5],['pileci batak','1 kom',150,22,0,7],['krilca','6 kom',450,35,0,33],['jaja na oko','2 kom',200,13,1,16],['kajgana','3 jaja',280,19,2,22],['omlet','3 jaja',260,19,2,20],
 ['ulje','1 kašika',90,0,0,10],['maslac','1 kašika',100,0.1,0,11],['puter od kikirikija','1 kašika',90,4,3,8],['grcki jogurt','1 pakovanje',110,15,6,3],['posni sir','pola šolje',110,12,4,5],['cips','velika kesa 150 g',800,9,75,52]
);

/* ---- Nove teme ---- */
KB.push(
 {k:['posle 18','posle sest','kasno jesti','uvece jesti','posle osam','mit'],a:()=>`**Mit: ne jede se posle 18h**\nNije važno kad jedeš, nego koliko ukupno pojedeš u danu. Večera u 19:30 je deo plana. Teška večera kasno ipak kvari san i smeta osetljivom želucu, zato neka bude lakša i 2 do 3 sata pre spavanja.`},
 {k:['sirce','jabukovo','limun vod','topla voda','metabolizam ubrz','sagorev','fat burn','tablete za'],a:()=>`**Mitovi o „topljenju masti”**\nJabukovo sirće, voda sa limunom ujutru, đumbir, „fat burner” tablete i čajevi za mršavljenje ne sagorevaju mast u merljivoj količini. Rade samo deficit kalorija, proteini, kretanje i san. Voda sa limunom je u redu ako ti lakše pada od obične vode.`},
 {k:['metabolizam','spor','genetik','hormon'],a:()=>`**Spor metabolizam**\nVeći ljudi zapravo troše više energije, ne manje. Tvoja dnevna potrošnja je oko ${R(tdee())} kcal. Kad napredak stane, uzrok je skoro uvek sitnica koja se ne broji (ulje, grickanje, vikendi) ili voda. Ako sumnjaš na štitnu žlezdu, TSH iz krvi to brzo pokaže.`},
 {k:['banan','vece voce','voce uvece','grozdje goji'],a:()=>`Banana, grožđe ili voće uveče ne goje samo po sebi. Banana ima oko 107 kcal i odlična je užina pred šetnju. Računa se ukupan unos u danu.`},
 {k:['zatvor','stolic','creva','varenj','vlakn'],a:()=>`**Varenje i zatvor**\n- Vlakna: povrće uz svaki obrok, ovas, mahunarke, voće, heljda. Cilj je oko 30 g dnevno.\n- Voda: vlakna bez vode pogoršavaju zatvor.\n- Kretanje: šetnja posle obroka pokreće creva.\n- Kefir i kiselo mleko pomažu crevnoj flori.\n- Krv u stolici, jak bol ili nagla promena koja traje duže od 2 nedelje traže lekara.`},
 {k:['stres','nervoz','emotivn','dosad','tuga','anksioz'],a:()=>`**Jedenje iz stresa**\nPre nego što posegneš za hranom, zastani 10 minuta: čaša vode, šetnja oko zgrade ili par minuta disanja stomakom. Pitaj se da li si gladan ili ti treba pauza. Redovni obroci i dovoljno sna smanjuju napade. Ako stres dugo traje i remeti san, vredi razgovarati sa nekim, prijateljem ili stručnjakom.`},
 {k:['putovanj','put ','pumpa','auto','avion','hotel','odmor','more'],a:()=>`**Na putu i na odmoru**\n- Ponesi užine: jabuke, orašaste plodove, kuvana jaja, krekere.\n- Na pumpi: jogurt, voda, sendvič sa piletinom ili salata umesto peciva i čokoladica.\n- U hotelu na doručku: jaja, sir, povrće, jedno pecivo.\n- Na odmoru je cilj da ne dobiješ, ne nužno da gubiš. Šetaj što više.`},
 {k:['smen','nocn','nocu radim','treca smena','dezurstv'],a:()=>`**Rad u smenama**\nPomeri obroke po svom „danu”: doručak posle buđenja, glavni obrok pre smene, laka užina tokom noći (jogurt, jaje, voće), a posle smene mali obrok pa spavanje. Izbegavaj kafu u poslednja 4 sata pre spavanja. Vreme doručka možeš da promeniš u profilu.`},
 {k:['na poslu','kancelarij','kutij','ponesem','posao jedem','menz'],a:()=>`**Hrana za posao**\n- Ostaci od večere su najbolji ručak za posao.\n- Salate koje se ne raskvase: kinoa sa leblebijom, sočivo sa povrćem, tuna i leblebija.\n- Užine u kutiji: jogurt, voće, orasi, kuvana jaja, štapići povrća sa humusom.\n- Flaša vode na stolu.`},
 {k:['jeftin','budzet','skup','para','novac','ustede','ustedi'],a:()=>`**Jeftinije, a zdravo**\n- Jaja, pasulj, sočivo, leblebija, ovas, krompir, kupus i šargarepa su najjeftinija hrana po hranljivoj vrednosti.\n- Smrznuto povrće i voće je jednako vredno kao sveže, a jeftinije.\n- Piletina u celom komadu ili bataci umesto filea.\n- Kuvaj veće količine i zamrzni porcije.\n- Najveća ušteda je preskočena dostava i gazirani sokovi.`},
 {k:['pekar','burek','kifl','pecivo','peciv','djevrek','pogac'],a:()=>`**Pekara**\nNajbolji izbor ako baš moraš: integralni sendvič sa piletinom ili sirom i povrćem, ili jedna integralna kifla uz jogurt. Burek (oko 600 kcal parče), pita i krofne su za retke prilike, i tada je to ceo obrok, ne užina. Uz pecivo uzmi jogurt ili kefir zbog proteina.`},
 {k:['mekdonald','mek','kebab','giros','fast food','brza hran','burger','kfc'],a:()=>`**Brza hrana**\n- McDonald's: pileći ili obični hamburger, salata, voda ili Zero. Bez pomfrita, ili samo mali.\n- Giros i kebab: pola porcije ili tanjir bez pita hleba, sa salatom.\n- Picerija: 2 parčeta tanke pice uz salatu.\nObrok upiši preko „Van plana”, a večera neka bude lakša.`,more:['Koliko kalorija ima giros?','Koliko kalorija ima big mek?']},
 {k:['protein sejk','proteinski sejk','sejk','surutk','whey','kreatin','bcaa','suplement za mis'],a:()=>`**Proteinski šejk i suplementi za trening**\nŠejk nije potreban ako jedeš po planu. Koristan je kao užina kad nemaš vremena: jedna merica ima oko 120 kcal i 24 g proteina. Kreatin je dobro istražen i bezbedan za zdrave ljude, ali za mršavljenje nije bitan. BCAA i „fat burneri” nemaju smisla. Kod bolesti bubrega ništa od ovoga bez lekara.`},
 {k:['upal','bole','boli','grcev','posle trening','posle vezb','misicna','upala misic'],a:()=>`**Upala mišića**\nBol 1 do 2 dana posle novih vežbi je normalan i prolazi sam. Pomaže lagano kretanje, šetnja, topla kupka i dovoljno proteina. Oštar bol, bol u zglobu ili bol niz nogu nisu upala mišića, tada prekini i javi se lekaru ili fizijatru.`},
 {k:['kolen','zglob','kuk ','skocn'],a:()=>`**Kolena i zglobovi**\nSvaki skinut kilogram skida oko 4 kg opterećenja sa kolena pri hodu. Ravan teren, dobre patike i postepeno povećanje hoda su najbolji start. Bicikl (i sobni) i voda su odlični jer ne opterećuju zglobove. Otok, zaključavanje ili bol koji ne prolazi traže pregled.`},
 {k:['kardio','trcanj','trcim','bicikl','sobni','eliptic'],a:()=>`**Kardio**\nZa tebe je sada najbolji hod, a uz odobrenje fizijatra i sobni bicikl ili plivanje. Trčanje ostavi za kasnije, kad kilaža primetno padne, jer jako opterećuje kičmu i kolena. Kardio troši kalorije, ali ishrana ostaje glavni alat za mršavljenje.`},
 {k:['koraka','koracim','pedometar','10000','10.000'],a:()=>`**Koraci**\nOrijentaciono, ${walkT()} minuta hoda je oko ${R(walkT()*105/100)*100} koraka. Cilj od 7.000 do 10.000 koraka dnevno je odličan, ali kreni postepeno od onoga što sada radiš i dodaj po 1.000 nedeljno.`},
 {k:['dijabet','insulin','glikem','povisen secer','secer u krvi','visok secer'],a:()=>`**Šećer u krvi**\n- Redovni obroci sa proteinom i povrćem drže šećer stabilnim.\n- Šetnja 10 minuta posle obroka primetno spušta šećer.\n- Izbaci gazirane sokove, voćne sokove i slatkiše između obroka.\n- Integralno i mahunarke umesto belog hleba.\nAko piješ lekove za šećer, smanjenje kalorija može da traži promenu doze, zato javi lekaru da si krenuo sa planom.`},
 {k:['stitn','tiroid','tsh','hashimot'],a:()=>`**Štitna žlezda**\nSmanjen rad štitne žlezde usporava metabolizam i izaziva umor, a proverava se jednostavno, TSH iz krvi. Ako se leči, plan funkcioniše isto, samo je važno da terapiju piješ redovno, pola sata pre doručka i kafe.`},
 {k:['pusen','cigaret','prestao da pus','vejp'],a:()=>`**Pušenje i kilaža**\nPosle prestanka pušenja često se dobije 2 do 4 kg, jer se pojača apetit. Pomažu redovne užine, voda, žvakaća bez šećera i šetnja kad dođe kriza. Prestanak pušenja je ipak veća korist za zdravlje od tih par kilograma.`},
 {k:['zima','hladno','zimi','zimsk'],a:()=>`**Zima**\nZimi se više jede, a manje kreće. Tople čorbe i variva iz plana zasite sa malo kalorija. Šetaj danju kad možeš, zbog svetla i vitamina D. Voda se zimi lako zaboravi, zato čaj bez šećera računaj u unos.`},
 {k:['deca','dete','klinc','dečj','dečij','uzina dec'],a:()=>`**Deca i grickalice u kući**\nDeca mogu da jedu isto što i ti, sa većim delom priloga, voća i mlečnog. Njihove grickalice drži u zatvorenom ormaru, ne na stolu. Najbolji uticaj na decu je kad vide da i roditelji jedu povrće i piju vodu.`},
 {k:['lek','terapij','antibiot','pritisak lek'],a:()=>`Lekovi ponekad utiču na apetit, šećer ili vodu u telu. Ako piješ terapiju za pritisak, šećer ili štitnu žlezdu, javi lekaru da si krenuo sa planom, jer se doze ponekad koriguju kako kilaža pada. Savetnik ne može da menja ni preporučuje lekove.`},
 {k:['povratim','povracanj','dijarej','proliv','stomacni virus'],a:()=>`**Stomačni virus**\nPrvih dana su važni tečnost i so: voda, čaj, supa, rehidratacioni rastvor. Kad krene da prolazi: pirinač, krompir, banana, dvopek, pa postepeno normalna hrana. Plan i kalorije pauziraj dok se ne oporaviš. Krv, visoka temperatura ili ako ne možeš da zadržiš tečnost duže od dana, lekar.`},
 {k:['vegan','vegetar','bez mesa','biljn'],a:()=>`**Bez mesa**\nProtein dobijaš iz jaja, mlečnih proizvoda, pasulja, sočiva, leblebije, tofua i semenki. U profilu označi „Ne jedem: meso uopšte” i jelovnik prelazi na vegetarijanska jela, uz iste kalorije.`,acts:[['Otvori profil','go:profil']]},
 {k:['smuti','smoothie','blend','frape'],a:()=>`Smuti je dobar ako ima protein: kefir ili jogurt, šaka voća, 2 kašike ovsa. Voćni smuti bez proteina lako ima 300 do 400 kcal i brzo ogladniš. Pij ga kao obrok ili užinu, ne uz obrok.`}
);
