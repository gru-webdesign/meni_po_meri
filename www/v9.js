/* ================= v9: svetla tema kao podrazumevana, foto kartica za sledeći obrok, navike kao lista ================= */
applyTheme=(function(orig){return function(){try{if(S&&!S.themeV9){S.themeV9=1;if(!S.theme||S.theme==='auto')S.theme='light';try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}}catch(e){}return orig()}})(applyTheme);
function mealPhoto(m){return m&&!m.custom?(photoOf(m.id)||bundledPh(m.id)):null}
function nextHero(next){const m=next.meal,ph=mealPhoto(m),t=m.nt;
  return `<section class="nxt" aria-label="Sledeći obrok">
   <button class="nxt-ph ${ph?'':'noph'}" data-meal-open="${next.slot}" data-key="${TODAY}" aria-label="Otvori recept: ${esc(m.n)}">${ph?`<img src="${ph}" alt="">`:`<span>${icd(mealIcon(m))}</span>`}
    <span class="nxt-tag">${ic('clock','sm')}${TYPE_NAMES[next.type]} · ${next.time}</span></button>
   <div class="nxt-b"><div class="nxt-lbl">Sledeće</div><button class="nxt-n" data-meal-open="${next.slot}" data-key="${TODAY}">${esc(m.n)}</button>
    <div class="nxt-m"><span><b class="n">${R(t[0])}</b> kcal</span><span><b class="n">${R(t[1])}</b> g P</span><span><b class="n">${R(t[2])}</b> g UH</span><span><b class="n">${R(t[3])}</b> g M</span></div>
    <div class="nxt-act"><button class="btn cta" data-eat="${next.slot}" data-fr="1">${ic('check','sm')}Pojeo sam</button>
     <button class="rbtn" data-eat="${next.slot}" data-fr="0.5" aria-label="Pojeo sam pola"><b>½</b><small>Pola</small></button>
     <button class="rbtn" data-swap="${next.slot}" data-key="${TODAY}" aria-label="Zameni jelo">${ic('arrows-clockwise','sm')}<small>Zameni</small></button>
     <button class="rbtn" data-other="${next.slot}" aria-label="Pojeo sam nešto drugo">${ic('pencil-simple','sm')}<small>Drugo</small></button></div></div></section>`}
function habitRow(kind,label,icon,val,goal,frac,key,step,plusLbl,over){const pc=Math.min(100,(frac||0)*100);
  return `<div class="hab ${kind} ${over?'over':''}"><span class="hab-ic">${icd(icon)}</span>
   <div class="hab-t"><div class="hab-top"><b>${label}</b><span class="n"><b>${val}</b> / ${goal}</span></div><div class="hab-bar"><i style="width:${pc}%"></i></div></div>
   <div class="hab-act"><button class="rb sm" data-trk="${key}" data-v="-${step}" aria-label="Oduzmi: ${label}">${ic('minus','sm')}</button><button class="rb plus" data-trk="${key}" data-v="${step}" aria-label="${plusLbl}">${ic('plus','sm')}</button></div></div>`}
function habitsCard(){const d=dayOf(),wg=waterT(),sp=sodaPlan(),wt=walkT();
  return `<section class="card habits" aria-label="Brzo beleženje"><div class="sec-title"><h2>Navike danas</h2><span class="small muted">dodir na + upisuje</span></div>
   ${habitRow('water','Voda','drop',litres(d.water),litres(wg)+' l',d.water/wg,'water',250,'Dodaj čašu vode')}
   ${sp?habitRow('cola','Gazirano','beer-bottle',d.soda,(sp.max||0)+' ml',sp.max?d.soda/sp.max:(d.soda?1:0),'soda',330,'Dodaj 0,33 l',d.soda>sp.max):''}
   ${habitRow('walk','Hod','footprints',d.walk,wt+' min',d.walk/wt,'walk',10,'Dodaj 10 minuta hoda')}</section>`}
viewDanas=(function(orig){return function(){let h=orig();const pl=planFor(TODAY),d=dayOf(),next=pl.find(x=>!d.eat[x.slot]);
  if(next)h=h.replace(/<section class="card next2">[\s\S]*?<\/section>/,nextHero(next));
  h=h.replace(/<section class="tiles"[\s\S]*?<\/section>/,habitsCard());
  return h}})(viewDanas);
