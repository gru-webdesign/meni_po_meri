/* ================= VEŽBE: animirana figura i biblioteka =================
   Originalne animacije: figura iz bočnog ugla, koordinate y nagore, pod je y=0.
   Položaj: hip [x,y], t ugao trupa od vertikale (+ napred), c zakrivljenost leđa, hd nagib glave,
   f1/f2 cilj zgloba stopala (bliža/dalja noga), h1/h2 cilj šake, tf1/tf2 ugao stopala, kb/eb smer savijanja. */
const SK={th:42,sh:40,ua:28,fa:26,to:50,nk:6,hr:10,ft:12};
function ik2(R,T,a,b,bend){let dx=T[0]-R[0],dy=T[1]-R[1],d=Math.hypot(dx,dy)||0.001;const mx=a+b-0.05,mn=Math.abs(a-b)+0.05;
  if(d>mx){dx*=mx/d;dy*=mx/d;d=mx}if(d<mn){dx*=mn/d;dy*=mn/d;d=mn}
  const ux=dx/d,uy=dy/d,ca=(a*a+d*d-b*b)/(2*a*d),ang=Math.acos(Math.max(-1,Math.min(1,ca)))*bend;
  return [[R[0]+a*(ux*Math.cos(ang)-uy*Math.sin(ang)),R[1]+a*(ux*Math.sin(ang)+uy*Math.cos(ang))],[R[0]+dx,R[1]+dy]]}
function exSolve(p){const D=Math.PI/180,t=p.t*D,hip=p.hip,sh=[hip[0]+SK.to*Math.sin(t),hip[1]+SK.to*Math.cos(t)],ha=(p.t+(p.hd||0))*D;
  const head=[sh[0]+(SK.nk+SK.hr)*Math.sin(ha),sh[1]+(SK.nk+SK.hr)*Math.cos(ha)];
  const leg=(f,kb,tf)=>{const [k,a]=ik2(hip,f,SK.th,SK.sh,kb==null?1:kb);const r=(tf||0)*D;return {k,a,toe:[a[0]+SK.ft*Math.cos(r),a[1]+SK.ft*Math.sin(r)]}};
  const arm=(h,eb)=>{const [e,w]=ik2(sh,h,SK.ua,SK.fa,eb==null?-1:eb);return {e,w}};
  return {hip,sh,head,t:p.t,c:p.c||0,l1:leg(p.f1,p.kb1,p.tf1),l2:leg(p.f2,p.kb2,p.tf2),a1:arm(p.h1,p.eb1),a2:arm(p.h2,p.eb2)}}
const lerp=(a,b,u)=>a+(b-a)*u;
function exLerp(A,B,u){const o={};for(const k in A){const a=A[k],b=B[k]==null?a:B[k];o[k]=Array.isArray(a)?[lerp(a[0],b[0],u),lerp(a[1],b[1],u)]:typeof a==='number'?lerp(a,b,u):(u<.5?a:b)}return o}
const ease=u=>-(Math.cos(Math.PI*u)-1)/2;

/* ---------- Osnovni položaji ---------- */
const STAND={hip:[0,80],t:0,c:0,hd:0,f1:[3,0],f2:[-3,0],h1:[6,78],h2:[-4,78],tf1:0,tf2:0};
const ALL4={hip:[-25,42],t:77,c:0,hd:-12,f1:[-66,5],f2:[-63,5],h1:[25,0],h2:[22,0],tf1:180,tf2:180};
const SUP={hip:[0,10],t:-90,c:0,hd:0,f1:[38,5],f2:[35,5],h1:[-4,7],h2:[-7,7],tf1:20,tf2:20};
const P=(b,o)=>Object.assign({},b,o);

/* Vežba: id, naziv, kategorija, doza, sekunde, MET, leđa/kolena/ramena (ok|pazi|ne), nivo, opis, koraci, kadrovi, trajanje kadra ms, rekvizit */
const EXL=[
 {id:'birddog',n:'Ptica-pas',cat:'ledja',dose:'3 × 6 po strani',sec:45,met:2.8,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Jača duboke mišiće trupa bez pritiska na kičmu.',cues:['Na sve četiri, šake ispod ramena, kolena ispod kukova.','Istovremeno ispruži suprotnu ruku i nogu.','Leđa ravna kao sto, zadrži 6 do 8 sekundi.','Polako nazad i zameni strane.'],
  k:[ALL4,P(ALL4,{h1:[80,58],f2:[-106,44],tf2:180}),ALL4,P(ALL4,{h2:[78,58],f1:[-106,44],tf1:180})],ms:1300},
 {id:'catcamel',n:'Mačka-kamila',cat:'ledja',dose:'1 × 8 sporo',sec:40,met:2.3,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Nežno razgibava kičmu pre ostalih vežbi.',cues:['Na sve četiri, opušteno.','Polako zaobli leđa i spusti glavu.','Zatim lagano ulegni leđa i podigni pogled.','Bez forsiranja krajnjih položaja.'],
  k:[P(ALL4,{c:13,hd:30}),P(ALL4,{c:-10,hd:-35})],ms:1800},
 {id:'curlup',n:'Pregib po McGillu',cat:'ledja',dose:'3 × 5, zadrži 8 s',sec:45,met:2.5,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Jača trbuh bez savijanja kičme, umesto klasičnih trbušnjaka.',cues:['Lezi na leđa, jedna noga ispružena, druga savijena.','Šake ispod donjeg dela leđa.','Podigni samo glavu i ramena 2 do 3 cm, vrat prav.','Zadrži 8 sekundi i spusti se.'],
  k:[P(SUP,{f1:[82,6],tf1:90,h1:[-2,6],h2:[-4,6]}),P(SUP,{f1:[82,6],tf1:90,h1:[-2,6],h2:[-4,6],t:-80,hd:-6})],ms:1500},
 {id:'bridge',n:'Most',cat:'ledja',dose:'2 × 10',sec:45,met:3,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Jača zadnjicu i rasterećuje donji deo leđa.',cues:['Lezi na leđa, stopala na podu u širini kukova.','Stegni zadnjicu i podigni kukove.','Telo u liniji od kolena do ramena, bez izvijanja.','Polako spusti, pršljen po pršljen.'],
  k:[SUP,{hip:[2,46],t:-143,c:0,hd:53,f1:[38,5],f2:[35,5],h1:[10,6],h2:[8,6],tf1:20,tf2:20}],ms:1400},
 {id:'deadbug',n:'Mrtva buba',cat:'ledja',dose:'2 × 6 po strani',sec:45,met:3,back:'ok',knee:'ok',sh:'ok',lvl:2,
  d:'Stabilnost trupa uz pokrete ruku i nogu.',cues:['Lezi na leđa, ruke ka plafonu, kolena savijena iznad kukova.','Donji deo leđa pritisnut uz pod.','Spusti suprotnu ruku i nogu ka podu.','Vrati se i zameni strane.'],
  k:[P(SUP,{h1:[-48,62],h2:[-52,61],f1:[40,52],f2:[38,50],tf1:60,tf2:60}),P(SUP,{h1:[-102,16],h2:[-52,61],f1:[40,52],f2:[82,20],tf1:60,tf2:80}),P(SUP,{h1:[-48,62],h2:[-52,61],f1:[40,52],f2:[38,50],tf1:60,tf2:60}),P(SUP,{h1:[-48,62],h2:[-102,16],f1:[82,20],f2:[38,50],tf1:80,tf2:60})],ms:1300},
 {id:'plankknee',n:'Plank na kolenima',cat:'ledja',dose:'3 × 20 s',sec:30,met:3,back:'ok',knee:'ok',sh:'pazi',lvl:1,
  d:'Lakša verzija planka za jak trup.',cues:['Podlaktice na podu, laktovi ispod ramena.','Kolena na podu, telo pravo od kolena do glave.','Stegni trbuh i diši normalno.','Ne spuštaj kukove.'],
  k:[{hip:[-20,26],t:85,c:0,hd:-10,f1:[-95,7],f2:[-93,7],h1:[56,5],h2:[54,5],tf1:180,tf2:180},{hip:[-20,27.5],t:84,c:0,hd:-10,f1:[-95,7],f2:[-93,7],h1:[56,5],h2:[54,5],tf1:180,tf2:180}],ms:1600},
 {id:'plank',n:'Plank',cat:'kalistenika',dose:'3 × 20 do 40 s',sec:30,met:3.8,back:'ok',knee:'ok',sh:'pazi',lvl:2,
  d:'Celo telo radi kao jedna čvrsta celina.',cues:['Podlaktice na podu, laktovi ispod ramena.','Noge ispružene, oslonac na prstima.','Telo pravo od peta do glave.','Stegni trbuh i zadnjicu.'],
  k:[{hip:[-22,33],t:94,c:0,hd:-8,f1:[-102,4],f2:[-100,4],h1:[56,5],h2:[54,5],tf1:-60,tf2:-60},{hip:[-22,34.5],t:93,c:0,hd:-8,f1:[-102,4],f2:[-100,4],h1:[56,5],h2:[54,5],tf1:-60,tf2:-60}],ms:1600},
 {id:'sphinx',n:'Sfinga',cat:'joga',dose:'3 × 30 s',sec:40,met:2.3,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Nežno izvijanje unazad, često prija kod problema sa diskom.',cues:['Lezi na stomak, noge opružene.','Osloni se na podlaktice, laktovi ispod ramena.','Grudi napred i gore, ramena dalje od ušiju.','Ako se javi bol niz nogu, prekini.'],
  k:[{hip:[0,8],t:90,c:0,hd:0,f1:[-82,6],f2:[-80,6],h1:[30,5],h2:[28,5],tf1:180,tf2:180},{hip:[0,8],t:62,c:-4,hd:-18,f1:[-82,6],f2:[-80,6],h1:[72,5],h2:[70,5],tf1:180,tf2:180}],ms:1900},
 {id:'childpose',n:'Dečja poza',cat:'joga',dose:'3 × 30 s',sec:40,met:2,back:'pazi',knee:'pazi',sh:'ok',lvl:1,
  d:'Opuštanje leđa i ramena uz duboko disanje.',cues:['Klekni i sedni na pete.','Spuštaj trup napred, ruke ispruži po podu.','Čelo spusti ka podu i diši duboko.','Ako ti prija, ostani 30 sekundi.'],
  k:[{hip:[-38,22],t:4,c:0,hd:0,f1:[-40,5],f2:[-42,5],h1:[-6,34],h2:[-9,34],tf1:180,tf2:180},{hip:[-38,22],t:100,c:7,hd:28,f1:[-40,5],f2:[-42,5],h1:[64,4],h2:[62,4],tf1:180,tf2:180}],ms:2000},
 {id:'kneechest',n:'Kolena na grudi',cat:'istezanje',dose:'3 × 20 s',sec:40,met:2,back:'pazi',knee:'ok',sh:'ok',lvl:1,
  d:'Opušta donji deo leđa i zadnjicu.',cues:['Lezi na leđa, kolena savijena.','Privuci kolena ka grudima.','Obuhvati ih rukama i diši mirno.','Glava ostaje na podu.'],
  k:[SUP,P(SUP,{f1:[12,52],f2:[10,50],h1:[-14,50],h2:[-16,48],tf1:60,tf2:60})],ms:1800},
 {id:'hamstring',n:'Zadnja loža uz traku',cat:'istezanje',dose:'2 × 30 s po nozi',sec:45,met:2,back:'pazi',knee:'ok',sh:'ok',lvl:1,
  d:'Isteže zadnju stranu noge bez savijanja kičme.',cues:['Lezi na leđa, traku ili peškir prebaci preko stopala.','Polako podigni ispruženu nogu.','Stani kad osetiš blago istezanje.','Druga noga ostaje na podu.'],
  k:[P(SUP,{f1:[30,48],f2:[82,6],tf2:90,h1:[-6,40],h2:[-8,40],tf1:90}),P(SUP,{f1:[8,90],f2:[82,6],tf2:90,h1:[-4,44],h2:[-6,44],tf1:170})],ms:2000,prop:'band'},
 {id:'quad',n:'Prednja loža stojeći',cat:'istezanje',dose:'2 × 30 s po nozi',sec:40,met:2.3,back:'ok',knee:'pazi',sh:'ok',lvl:1,
  d:'Isteže prednju stranu butine i kuk.',cues:['Stani uspravno, po potrebi se pridrži za zid.','Savij koleno i uhvati stopalo iza sebe.','Kolena su jedno pored drugog.','Kuk lagano gurni napred.'],
  k:[P(STAND,{h2:[40,108]}),P(STAND,{f1:[-26,62],tf1:90,h1:[-25,66],h2:[40,108]})],ms:1800},
 {id:'hipflexor',n:'Pregibač kuka u iskoraku',cat:'istezanje',dose:'2 × 30 s po strani',sec:45,met:2.3,back:'ok',knee:'pazi',sh:'ok',lvl:1,
  d:'Oslobađa prednju stranu kuka, korisno uz puno sedenja.',cues:['Klekni na jedno koleno, drugo stopalo ispred.','Trup uspravan, trbuh blago stegnut.','Polako gurni kukove napred.','Ruke možeš podići iznad glave.'],
  k:[{hip:[-6,44],t:0,c:0,hd:0,f1:[38,0],f2:[-60,5],h1:[22,48],h2:[20,48],tf1:0,tf2:180},{hip:[3,41],t:-8,c:-3,hd:-6,f1:[38,0],f2:[-60,5],h1:[-8,146],h2:[-10,146],tf1:0,tf2:180}],ms:2000},
 {id:'calfwall',n:'List uz zid',cat:'istezanje',dose:'2 × 30 s po nozi',sec:40,met:2,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Isteže list i Ahilovu tetivu.',cues:['Stani ispred zida, šake na zid.','Jedna noga napred savijena, druga iza opružena.','Peta zadnje noge ostaje na podu.','Polako se nagni ka zidu.'],
  k:[{hip:[-14,78],t:18,c:0,hd:0,f1:[22,0],f2:[-48,0],h1:[58,118],h2:[57,116],tf1:0,tf2:0},{hip:[-6,74],t:26,c:0,hd:0,f1:[22,0],f2:[-48,0],h1:[58,116],h2:[57,114],tf1:0,tf2:0}],ms:1900,prop:'wall',px:62},
 {id:'chest',n:'Otvaranje grudi',cat:'istezanje',dose:'10 ponavljanja',sec:40,met:2.3,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Popravlja držanje posle dugog sedenja.',cues:['Stani uspravno, ruke ispred sebe.','Raširi ruke unazad i spoji lopatice.','Grudi napred, pogled pravo.','Vrati ruke i ponovi.'],
  k:[P(STAND,{h1:[54,128],h2:[52,126]}),P(STAND,{h1:[-40,118],h2:[-42,116],t:-4,c:-2})],ms:1300},
 {id:'armcircles',n:'Kruženje rukama',cat:'istezanje',dose:'2 × 10 krugova',sec:30,met:2.5,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Zagreva ramena pre vežbanja.',cues:['Stani uspravno, ruke ispružene.','Opiši velike krugove rukama napred.','Pokret je spor i kontrolisan.','Posle 10 krugova promeni smer.'],
  k:[P(STAND,{h1:[54,130],h2:[52,130]}),P(STAND,{h1:[2,184],h2:[0,184]}),P(STAND,{h1:[-52,132],h2:[-54,132]}),P(STAND,{h1:[2,78],h2:[0,78]})],ms:700},
 {id:'neck',n:'Istezanje vrata',cat:'istezanje',dose:'5 sporih ponavljanja',sec:30,met:1.8,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Opušta vrat i ramena posle rada za računarom.',cues:['Sedi ili stani uspravno, ramena opuštena.','Polako spusti bradu ka grudima.','Zatim vrati glavu u neutralan položaj.','Bez naglih pokreta i zabacivanja.'],
  k:[STAND,P(STAND,{hd:32})],ms:1800},
 {id:'breath',n:'Disanje stomakom',cat:'joga',dose:'5 minuta',sec:60,met:1.3,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Smanjuje napetost leđa i stres.',cues:['Lezi na leđa, kolena savijena.','Šake na stomak.','Udahni kroz nos tako da se stomak podigne.','Polako izdahni na usta.'],
  k:[P(SUP,{h1:[-20,18],h2:[-22,18]}),P(SUP,{h1:[-20,22],h2:[-22,22],c:-6})],ms:2600},
 {id:'mountain',n:'Planina sa rukama gore',cat:'joga',dose:'5 dubokih udisaja',sec:30,met:2,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Uspravno držanje i disanje celim telom.',cues:['Stopala zajedno, težina ravnomerno.','Sa udahom podigni ruke iznad glave.','Sa izdahom ih spusti.','Ramena dalje od ušiju.'],
  k:[STAND,P(STAND,{h1:[3,184],h2:[-1,184],hip:[0,81]})],ms:2000},
 {id:'warrior',n:'Ratnik',cat:'joga',dose:'3 udisaja po strani',sec:40,met:2.8,back:'ok',knee:'pazi',sh:'ok',lvl:2,
  d:'Snaga nogu i otvaranje kukova.',cues:['Veliki korak napred, zadnja noga opružena.','Prednje koleno iznad članka.','Ruke podigni iznad glave.','Trup uspravan, diši duboko.'],
  k:[{hip:[-4,72],t:0,c:0,hd:0,f1:[45,0],f2:[-55,0],h1:[10,76],h2:[-2,76],tf1:0,tf2:0},{hip:[-2,58],t:0,c:-2,hd:-4,f1:[45,0],f2:[-55,0],h1:[4,180],h2:[0,180],tf1:0,tf2:0}],ms:2000},
 {id:'tree',n:'Drvo',cat:'joga',dose:'20 s po nozi',sec:40,met:2.2,back:'ok',knee:'ok',sh:'ok',lvl:2,
  d:'Ravnoteža i stabilnost zglobova.',cues:['Stani na jednu nogu.','Stopalo druge noge osloni na list ili butinu, ne na koleno.','Šake spoji ispred grudi.','Pogled u jednu tačku.'],
  k:[P(STAND,{f1:[-4,40],tf1:-60,h1:[16,112],h2:[14,112],f2:[0,0]}),P(STAND,{f1:[-4,40],tf1:-60,h1:[4,184],h2:[1,184],f2:[0,0]})],ms:2200},
 {id:'chairpose',n:'Stolica (joga)',cat:'joga',dose:'3 × 20 s',sec:40,met:3,back:'ok',knee:'pazi',sh:'ok',lvl:2,
  d:'Jača noge i zadnjicu.',cues:['Stopala zajedno, ruke gore.','Spusti kukove kao da sedaš na stolicu.','Težina na petama, leđa ravna.','Zadrži, pa ustani.'],
  k:[P(STAND,{h1:[3,184],h2:[-1,184]}),{hip:[-28,54],t:30,c:0,hd:-10,f1:[3,0],f2:[-3,0],h1:[25,144],h2:[23,143],tf1:0,tf2:0}],ms:1800},
 {id:'downdog',n:'Pas licem nadole',cat:'joga',dose:'3 × 5 udisaja',sec:40,met:2.8,back:'pazi',knee:'ok',sh:'pazi',lvl:2,
  d:'Isteže zadnju stranu nogu i ramena.',cues:['Krenite sa sve četiri.','Podigni kukove gore i unazad.','Kolena mogu ostati savijena.','Glava između ruku, diši mirno.'],
  k:[ALL4,{hip:[-25,84],t:140,c:0,hd:38,f1:[-56,2],f2:[-58,2],h1:[42,4],h2:[40,4],tf1:0,tf2:0}],ms:2000},
 {id:'squat',n:'Čučanj',cat:'kalistenika',dose:'3 × 10',sec:40,met:5,back:'ok',knee:'pazi',sh:'ok',lvl:2,
  d:'Osnova snage nogu i zadnjice.',cues:['Stopala u širini ramena.','Kukove gurni unazad i spusti se.','Kolena prate prste, leđa ravna.','Ustani kroz pete.'],
  k:[P(STAND,{h1:[56,130],h2:[54,129]}),{hip:[-26,46],t:40,c:0,hd:-14,f1:[3,0],f2:[-3,0],h1:[60,84],h2:[58,83],tf1:0,tf2:0}],ms:1300},
 {id:'chairsquat',n:'Čučanj do stolice',cat:'kalistenika',dose:'3 × 10',sec:40,met:4,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Bezbedan čučanj: stolica pokazuje dubinu.',cues:['Stani ispred stolice.','Sedni polako, bez pomoći ruku.','Kad dodirneš stolicu, ustani.','Leđa ravna, kolena prate prste.'],
  k:[P(STAND,{h1:[56,130],h2:[54,129]}),{hip:[-32,50],t:30,c:0,hd:-12,f1:[6,0],f2:[0,0],h1:[56,100],h2:[54,99],tf1:0,tf2:0}],ms:1400,prop:'chair'},
 {id:'pushwall',n:'Sklek uz zid',cat:'kalistenika',dose:'3 × 10',sec:40,met:3.5,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Prvi korak ka sklekovima.',cues:['Šake na zid u visini ramena.','Telo pravo od peta do glave.','Savij laktove i približi grudi zidu.','Odgurni se nazad.'],
  k:[{hip:[12,79],t:16,c:0,hd:0,f1:[-10,0],f2:[-12,0],h1:[72,126],h2:[71,124],tf1:0,tf2:0},{hip:[24,75],t:27,c:0,hd:-4,f1:[-10,0],f2:[-12,0],h1:[72,126],h2:[71,124],tf1:-20,tf2:-20}],ms:1200,prop:'wall',px:76},
 {id:'pushknee',n:'Sklek na kolenima',cat:'kalistenika',dose:'3 × 8',sec:40,met:4,back:'ok',knee:'pazi',sh:'pazi',lvl:2,
  d:'Jača grudi, ramena i ruke.',cues:['Šake ispod ramena, kolena na podu.','Telo pravo od kolena do glave.','Spusti grudi ka podu.','Odgurni se nazad gore.'],
  k:[{hip:[-4,26],t:58,c:0,hd:-6,f1:[-70,26],f2:[-72,24],h1:[40,2],h2:[38,2],tf1:90,tf2:90},{hip:[0,16],t:73,c:0,hd:-8,f1:[-70,26],f2:[-72,24],h1:[40,2],h2:[38,2],tf1:90,tf2:90}],ms:1200},
 {id:'lunge',n:'Iskorak unazad',cat:'kalistenika',dose:'2 × 8 po nozi',sec:45,met:4,back:'ok',knee:'pazi',sh:'ok',lvl:2,
  d:'Snaga i ravnoteža nogu.',cues:['Stani uspravno, šake na kukovima.','Korakni jednom nogom unazad.','Spusti zadnje koleno ka podu.','Vrati se kroz prednju petu.'],
  k:[P(STAND,{h1:[8,86],h2:[-6,86]}),{hip:[-14,46],t:0,c:0,hd:0,f1:[22,0],f2:[-70,4],h1:[-6,52],h2:[-20,52],tf1:0,tf2:-60}],ms:1400},
 {id:'calfraise',n:'Podizanje na prste',cat:'kalistenika',dose:'3 × 15',sec:40,met:3,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Jača listove i ravnotežu.',cues:['Stani uspravno, po potrebi uz zid.','Podigni se na prste.','Zadrži sekund gore.','Polako se spusti.'],
  k:[STAND,P(STAND,{hip:[0,89],f1:[2,9],f2:[-4,9],tf1:-42,tf2:-42})],ms:1000},
 {id:'wallsit',n:'Zidni čučanj',cat:'kalistenika',dose:'3 × 20 s',sec:30,met:3.5,back:'ok',knee:'pazi',sh:'ok',lvl:2,
  d:'Statična snaga butina, bez opterećenja kičme.',cues:['Leđa uz zid, stopala ispred.','Spusti se dok butine nisu skoro vodoravne.','Kolena iznad članaka.','Zadrži i diši.'],
  k:[{hip:[-16,46],t:0,c:0,hd:0,f1:[26,0],f2:[22,0],h1:[16,52],h2:[14,52],tf1:0,tf2:0},{hip:[-16,47.5],t:0,c:0,hd:0,f1:[26,0],f2:[22,0],h1:[16,53],h2:[14,53],tf1:0,tf2:0}],ms:1600,prop:'wall',px:-26},
 {id:'march',n:'Marš u mestu',cat:'kardio',dose:'60 s',sec:60,met:3.8,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Zagrevanje i kardio bez skokova.',cues:['Podiži kolena naizmenično.','Ruke se njišu uz telo.','Uspravno držanje.','Ubrzaj kad se zagreješ.'],
  k:[P(STAND,{f1:[30,40],tf1:-30,h1:[-22,86],h2:[24,90]}),P(STAND,{f2:[30,40],tf2:-30,h2:[-22,86],h1:[24,90]})],ms:550},
 {id:'boxing',n:'Boks u mestu',cat:'kardio',dose:'45 s',sec:45,met:5.5,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Diže puls bez skakanja.',cues:['Raskorak, kolena blago savijena.','Naizmenično udaraj rukama napred.','Trbuh stegnut, ne uvrći se previše.','Brzina po osećaju.'],
  k:[{hip:[0,78],t:4,c:0,hd:0,f1:[20,0],f2:[-18,0],h1:[64,128],h2:[20,118],tf1:0,tf2:0},{hip:[0,78],t:4,c:0,hd:0,f1:[20,0],f2:[-18,0],h1:[20,118],h2:[64,128],tf1:0,tf2:0}],ms:450},
 {id:'kneeup',n:'Koleno ka laktu stojeći',cat:'kardio',dose:'40 s',sec:40,met:4,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Lagani kardio koji aktivira i trbuh.',cues:['Ruke iza glave ili ispred grudi.','Podigni koleno ka grudima.','Spusti i zameni nogu.','Leđa ostaju uspravna.'],
  k:[P(STAND,{f1:[24,58],tf1:-20,h1:[14,128],h2:[10,128]}),P(STAND,{f2:[24,58],tf2:-20,h1:[14,128],h2:[10,128]})],ms:700},
 {id:'sitstand',n:'Ustajanje sa stolice',cat:'kalistenika',dose:'3 × 10',sec:40,met:3.5,back:'ok',knee:'ok',sh:'ok',lvl:1,
  d:'Svakodnevna snaga nogu, odličan početak.',cues:['Sedi na ivicu stolice, stopala na podu.','Nagni se blago napred.','Ustani bez pomoći ruku.','Polako sedi nazad.'],
  k:[{hip:[-32,50],t:14,c:0,hd:0,f1:[10,0],f2:[6,0],h1:[30,96],h2:[28,95],tf1:0,tf2:0},P(STAND,{f1:[10,0],f2:[6,0],hip:[6,80],h1:[50,126],h2:[48,125]})],ms:1500,prop:'chair'}
];
const EXM={};EXL.forEach(e=>EXM[e.id]=e);
const EX_CAT={ledja:'Leđa i trup',istezanje:'Istezanje',joga:'Joga',kalistenika:'Kalistenika',kardio:'Kardio bez skokova'};

/* ---------- Crtanje ---------- */
function exBounds(ex){let x0=1e9,x1=-1e9,y1=-1e9;ex.k.forEach(p=>{const s=exSolve(p);[s.hip,s.sh,s.head,s.l1.k,s.l1.a,s.l1.toe,s.l2.k,s.l2.a,s.l2.toe,s.a1.e,s.a1.w,s.a2.e,s.a2.w].forEach(q=>{x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])})});
  y1+=SK.hr;if(ex.prop==='wall'){x0=Math.min(x0,ex.px-8);x1=Math.max(x1,ex.px+8)}if(ex.prop==='chair'){x0=Math.min(x0,-60)}return {x0:x0-14,x1:x1+14,y1:Math.max(y1,60)+10}}
function exColors(){const cs=getComputedStyle(document.documentElement);const g=v=>cs.getPropertyValue(v).trim();return {a:g('--accent'),ink:g('--ink'),sunk:g('--sunk'),line:g('--line'),muted:g('--muted'),surf:g('--surface')}}
function exDraw(cv,ex,phase,col){const dpr=window.devicePixelRatio||1,W=cv.clientWidth||cv.width,H=cv.clientHeight||cv.height;if(!W||!H)return;
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr)}const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);x.clearRect(0,0,W,H);
  const n=ex.k.length,seg=phase*n,i=Math.floor(seg)%n,u=seg-Math.floor(seg),hold=.25,uu=u<hold?0:ease((u-hold)/(1-hold));
  const p=exLerp(ex.k[i],ex.k[(i+1)%n],n===2&&false?uu:uu),s=exSolve(p);
  const b=ex._b||(ex._b=exBounds(ex)),floorPad=18,sc=Math.min((W-16)/(b.x1-b.x0),(H-floorPad-8)/b.y1),ox=W/2-((b.x0+b.x1)/2)*sc,oy=H-floorPad;
  const X=q=>ox+q[0]*sc,Y=q=>oy-q[1]*sc;
  x.fillStyle=col.sunk;x.beginPath();x.roundRect?x.roundRect(ox+b.x0*sc,oy-2,(b.x1-b.x0)*sc,8,4):x.rect(ox+b.x0*sc,oy-2,(b.x1-b.x0)*sc,8);x.fill();
  if(ex.prop==='wall'){x.fillStyle=col.line;x.fillRect(ox+ex.px*sc-4,oy-200*sc,8,200*sc)}
  if(ex.prop==='chair'){x.strokeStyle=col.muted;x.lineWidth=Math.max(2,4*sc);x.lineCap='round';x.beginPath();x.moveTo(ox-58*sc,oy-44*sc);x.lineTo(ox-18*sc,oy-44*sc);x.moveTo(ox-54*sc,oy-44*sc);x.lineTo(ox-54*sc,oy);x.moveTo(ox-22*sc,oy-44*sc);x.lineTo(ox-22*sc,oy);x.moveTo(ox-56*sc,oy-44*sc);x.lineTo(ox-60*sc,oy-100*sc);x.stroke()}
  const seg2=(a,b2,w,c,al=1)=>{x.globalAlpha=al;x.strokeStyle=c;x.lineWidth=w*sc;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(X(a),Y(a));x.lineTo(X(b2),Y(b2));x.stroke();x.globalAlpha=1};
  const limb=(r,j,e,toe,c,al)=>{x.globalAlpha=al;x.strokeStyle=c;x.lineWidth=10*sc;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(X(r),Y(r));x.lineTo(X(j),Y(j));x.lineTo(X(e),Y(e));if(toe)x.lineTo(X(toe),Y(toe));x.stroke();x.globalAlpha=1};
  if(ex.prop==='band'){x.strokeStyle=col.muted;x.lineWidth=2;x.setLineDash([5,4]);x.beginPath();x.moveTo(X(s.a1.w),Y(s.a1.w));x.lineTo(X(s.l1.toe),Y(s.l1.toe));x.stroke();x.setLineDash([])}
  limb(s.sh,s.a2.e,s.a2.w,null,col.a,.38);limb(s.hip,s.l2.k,s.l2.a,s.l2.toe,col.a,.38);
  const D=Math.PI/180,nx=-Math.cos(s.t*D),ny=Math.sin(s.t*D),mid=[(s.hip[0]+s.sh[0])/2+nx*s.c,(s.hip[1]+s.sh[1])/2+ny*s.c];
  x.strokeStyle=col.a;x.lineWidth=17*sc;x.lineCap='round';x.beginPath();x.moveTo(X(s.hip),Y(s.hip));x.quadraticCurveTo(X(mid),Y(mid),X(s.sh),Y(s.sh));x.stroke();
  seg2(s.sh,s.head,7,col.a);x.fillStyle=col.a;x.beginPath();x.arc(X(s.head),Y(s.head),SK.hr*sc,0,7);x.fill();
  limb(s.hip,s.l1.k,s.l1.a,s.l1.toe,col.a,1);limb(s.sh,s.a1.e,s.a1.w,null,col.a,1);
  x.fillStyle=col.surf;x.beginPath();x.arc(X(s.head)+Math.sin((s.t+(p.hd||0))*D)*4*sc+3*sc,Y(s.head)-2*sc,1.8*sc,0,7);x.fill()}
const EXA={list:new Set(),raf:0,t0:performance.now()};
function exAnimate(){if(EXA.raf)return;const col=exColors();EXA.col=col;const loop=t=>{let alive=0;EXA.list.forEach(cv=>{if(!document.body.contains(cv)){EXA.list.delete(cv);return}alive++;if(cv._hid)return;const ex=EXM[cv.dataset.ex];if(!ex)return;const per=ex.ms*ex.k.length;exDraw(cv,ex,((t-EXA.t0)%per)/per,EXA.col)});EXA.raf=alive?requestAnimationFrame(loop):0};EXA.raf=requestAnimationFrame(loop)}
const EXIO=('IntersectionObserver' in window)?new IntersectionObserver(es=>es.forEach(en=>{en.target._hid=!en.isIntersecting}),{rootMargin:'40px'}):null;
const EXRM=()=>window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function exMount(root){const col=exColors();EXA.col=col;(root||document).querySelectorAll('canvas.exc').forEach(cv=>{const ex=EXM[cv.dataset.ex];if(!ex||EXA.list.has(cv))return;
  if(EXRM()&&!cv.dataset.live){requestAnimationFrame(()=>exDraw(cv,ex,1/ex.k.length+0.3/ex.k.length,col));return}
  if(EXIO&&!cv.dataset.live){cv._hid=true;EXIO.observe(cv)}EXA.list.add(cv)});if(EXA.list.size)exAnimate()}
