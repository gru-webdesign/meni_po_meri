/* ================= PREMIUM: besplatno je samo Danas po planu; ostalo je Premium. Naplata RevenueCat, reklame AdMob ================= */
const CFG=window.MPM_CFG||{};
const FREE_TABS=['danas','profil','wizard'];
const PW_FEAT={jelovnik:['Nedeljni jelovnik, kuvar i kupovina','fork-knife'],trening:['Treninzi sa animacijama','barbell'],napredak:['Praćenje napretka','chart-line-up'],savetnik:['Savetnik za ishranu','chat-circle-dots'],
  swap:['Zamena jela','arrows-clockwise'],other:['Upis obroka mimo plana','pencil-simple'],cook:['Kuvanje korak po korak','cooking-pot'],shop:['Spisak za kupovinu','shopping-cart'],photo:['Tvoje fotografije jela','camera'],workout:['Vođeni trening','play']};
const PW_LIST=[['fork-knife','Ceo nedeljni jelovnik, kuvar sa 78 recepata i spisak za kupovinu'],['arrows-clockwise','Zamena jela i upis obroka mimo plana, dan se sam prilagodi'],['barbell','Treninzi sa animacijama, joga, istezanje i program za leđa'],['chart-line-up','Kilaža, navike, san i energija, imunitet i nagrade'],['chat-circle-dots','Savetnik koji zna tvoj plan'],['prohibit','Bez reklama']];
function isPrem(){const p=S.prem;if(!p||!p.on)return false;if(p.src==='test')return true;if(p.src==='rc')return !p.until||Date.now()<p.until+3*864e5;return false}
const RC=()=>PL('Purchases');let OFFER=null,BILL=false;
async function billingInit(){const P=RC();if(!P||!CFG.rcKey)return;try{await P.configure({apiKey:CFG.rcKey});BILL=true;const r=await P.getCustomerInfo();applyCI(r.customerInfo);
  P.addCustomerInfoUpdateListener(ci=>applyCI(ci)).catch(()=>{});const o=await P.getOfferings();OFFER=(o&&o.current)||null;if(!sheet.hidden&&sheetBody.querySelector('.pw'))refreshPaywall()}catch(e){console.warn('billing',e)}}
function applyCI(ci){const was=isPrem(),e=ci&&ci.entitlements&&ci.entitlements.active&&ci.entitlements.active.premium;
  if(e)S.prem={on:true,src:'rc',until:e.expirationDate?Date.parse(e.expirationDate):null,trial:e.periodType==='TRIAL',checked:Date.now()};
  else if(!S.prem||S.prem.src!=='test')S.prem={on:false};
  save();if(was!==isPrem())onPremChange()}
function onPremChange(){document.body.classList.toggle('free',!isPrem());adsSync();if(!isPrem()&&!FREE_TABS.includes(TAB))go('danas');else rerender()}
const pkg=t=>OFFER&&OFFER.availablePackages.find(x=>x.packageType===t);
const trialOf=p=>{try{const f=p.product.defaultOption&&p.product.defaultOption.freePhase;if(!f)return 0;const m=String(f.billingPeriod.iso8601||'').match(/P(\d+)([DWM])/);return m?(+m[1])*({D:1,W:7,M:30}[m[2]]):7}catch(e){return 0}};
let PW_PLAN='y';
function paywall(feat){const f=PW_FEAT[feat],py=pkg('ANNUAL'),pm=pkg('MONTHLY'),trial=trialOf(py||pm||{})||(OFFER?0:7);
  const price=(p,fb)=>p?p.product.priceString:fb,mo=py&&py.product.price?Math.round(py.product.price/12):null;
  return `<div class="pw"><div class="sheet-head"><div><div class="w">${f?esc(f[0])+' je deo Premiuma':'Meni po meri'}</div><h2 id="sheetTitle">Premium</h2></div>${closeBtn}</div>
   <div class="pw-hero">${icd(f?f[1]:'crown')}<p>${f?`Besplatna verzija prati plan za danas. ${esc(f[0])} i sve ostalo otključava Premium.`:'Sve što ti treba da stigneš do cilja, na jednom mestu.'}</p></div>
   <ul class="pw-list">${PW_LIST.map(x=>`<li>${icd(x[0],'sm')}<span>${x[1]}</span></li>`).join('')}</ul>
   <div class="pw-plans" role="radiogroup" aria-label="Plan">
    <button class="pw-plan ${PW_PLAN==='y'?'on':''}" data-pwplan="y" role="radio" aria-checked="${PW_PLAN==='y'}"><span class="pw-badge">Najisplativije</span><b>Godišnje</b><span class="n">${price(py,'2.490 RSD')}</span><small>${mo?'oko '+fmtK(mo)+' '+(py.product.currencyCode||'')+' mesečno':'oko 208 RSD mesečno'}</small></button>
    <button class="pw-plan ${PW_PLAN==='m'?'on':''}" data-pwplan="m" role="radio" aria-checked="${PW_PLAN==='m'}"><b>Mesečno</b><span class="n">${price(pm,'349 RSD')}</span><small>otkaži bilo kad</small></button></div>
   <button class="btn block pw-cta" data-pwbuy="1">${trial?`Probaj ${trial} dana besplatno`:'Pređi na Premium'}</button>
   <p class="small muted pw-legal">${trial?`Posle ${trial} dana besplatnog perioda pretplata se obnavlja automatski dok je ne otkažeš. `:'Pretplata se obnavlja automatski dok je ne otkažeš. '}Otkazuješ u Google Play → Pretplate, najkasnije dan pre obnove.</p>
   <div class="pw-links"><button class="btn ghost sm" data-pwrestore="1">Vrati kupovinu</button>${CFG.test?`<button class="btn ghost sm" data-pwtest="1">${ic('flask','sm')}Uključi Premium za test</button>`:''}</div>
   ${!BILL?`<p class="small muted" style="margin-top:8px">${CFG.test?'Ovo je verzija za testiranje. Kupovina radi kad aplikacija bude na Google Play-u.':'Kupovina trenutno nije dostupna. Proveri internet i Google Play.'}</p>`:''}</div>`}
function refreshPaywall(){const f=sheetBody.querySelector('.pw')&&sheetBody.dataset.pwf;sheetBody.innerHTML=paywall(f||'')}
function showPaywall(feat){openSheet(paywall(feat));sheetBody.dataset.pwf=feat||'';hap()}
async function buy(){const P=RC(),p=pkg(PW_PLAN==='y'?'ANNUAL':'MONTHLY')||pkg(PW_PLAN==='y'?'MONTHLY':'ANNUAL');
  if(!P||!BILL||!p){toast(CFG.test?'U test verziji kupovina nije aktivna':'Kupovina trenutno nije dostupna');return}
  try{const r=await P.purchasePackage({aPackage:p});applyCI(r.customerInfo);if(isPrem()){closeSheet();confetti();toast('Dobrodošao u Premium')}}catch(e){if(!(e&&(e.userCancelled||e.code==='1'||/cancel/i.test(e.message||''))))toast('Kupovina nije uspela. Pokušaj ponovo.')}}
async function restore(){const P=RC();if(!P||!BILL){toast('Vraćanje kupovine radi u verziji sa Google Play-a');return}
  try{const r=await P.restorePurchases();applyCI(r.customerInfo);toast(isPrem()?'Premium je vraćen':'Nije pronađena aktivna pretplata');if(isPrem())closeSheet()}catch(e){toast('Vraćanje nije uspelo')}}
/* ---------- Zaključavanje ---------- */
go=(function(orig){return function(t){if(!FREE_TABS.includes(t)&&!isPrem()){showPaywall(t);return}return orig(t)}})(go);
let PW_MUTE=0;
toast=(function(orig){return function(...a){if(PW_MUTE)return;return orig(...a)}})(toast);
swapMeal=(function(orig){return function(key,slot){if(!isPrem()){PW_MUTE=1;setTimeout(()=>PW_MUTE=0,0);showPaywall('swap');return planFor(key)[slot].meal}return orig(key,slot)}})(swapMeal);
customSheet=(function(orig){return function(slot){if(!isPrem()){setTimeout(()=>{sheetBody.dataset.pwf='other'},0);return paywall('other')}return orig(slot)}})(customSheet);
shopSheet=(function(orig){return function(){if(!isPrem()){setTimeout(()=>{sheetBody.dataset.pwf='shop'},0);return paywall('shop')}return orig()}})(shopSheet);
openCook=(function(orig){return function(...a){if(!isPrem()){showPaywall('cook');return}return orig(...a)}})(openCook);
startWorkout=(function(orig){return function(...a){if(!isPrem()){showPaywall('workout');return}return orig(...a)}})(startWorkout);
photoSave=(function(orig){return function(...a){if(!isPrem()){showPaywall('photo');return}return orig(...a)}})(photoSave);
const LOCK_SEL='[data-swap],[data-other],[data-sheet="add"],[data-sheet="shop"],[data-cook],[data-cookr],label.phbtn';
function markLocks(root){if(isPrem())return;(root||document).querySelectorAll(LOCK_SEL).forEach(b=>{if(b.querySelector(':scope > .lkb'))return;b.classList.add('lk');b.insertAdjacentHTML('beforeend',`<span class="lkb" aria-label="Premium">${ic('lock-simple','sm')}</span>`)})}
function markTabs(){document.querySelectorAll('nav.tabs .tab').forEach(t=>{const lock=!isPrem()&&!FREE_TABS.includes(t.dataset.tab);t.classList.toggle('lock',lock);let b=t.querySelector('.lkb');if(lock&&!b)t.insertAdjacentHTML('beforeend',`<span class="lkb">${ic('lock-simple','sm')}</span>`);if(!lock&&b)b.remove()})}
render=(function(orig){return function(){orig();document.body.classList.toggle('free',!isPrem());markLocks(app);markTabs();adsSync()}})(render);
openSheet=(function(orig){return function(h){orig(h);markLocks(sheetBody);adsSync()}})(openSheet);
closeSheet=(function(orig){return function(){orig();setTimeout(adsSync,350)}})(closeSheet);
document.addEventListener('click',e=>{const t=e.target.closest('[data-pwplan],[data-pwbuy],[data-pwrestore],[data-pwtest],[data-pwopen],[data-pwmanage],[data-pwtestoff]');if(!t)return;e.preventDefault();e.stopImmediatePropagation();const d=t.dataset;
  if(d.pwplan){PW_PLAN=d.pwplan;hap();refreshPaywall()}else if(d.pwbuy)buy();else if(d.pwrestore)restore();else if(d.pwopen!==undefined)showPaywall('');
  else if(d.pwtest){S.prem={on:true,src:'test'};save();closeSheet();toast('Premium je uključen za testiranje');onPremChange()}
  else if(d.pwtestoff){S.prem={on:false};save();toast('Test Premium je isključen');onPremChange()}
  else if(d.pwmanage){const u='https://play.google.com/store/account/subscriptions?package=rs.gru.menipomeri';try{window.open(u,'_system')}catch(er){location.href=u}}},true);
/* ---------- Premium u profilu ---------- */
viewProfil=(function(orig){return function(){let h=orig();if(String(uiGet('prof','0'))!==String(FORM.length))return h;const p=S.prem||{};
  const card=`<section class="card prem-card"><div class="sec-title"><h2>${icd('crown','sm')} Premium</h2><span class="pill ${isPrem()?'soft':'line'}">${isPrem()?(p.trial?'probni period':p.src==='test'?'test':'aktivan'):'besplatna verzija'}</span></div>
   ${isPrem()?`<p class="small muted">${p.until?'Sledeća obnova ili kraj: '+new Date(p.until).toLocaleDateString('sr-Latn-RS'):'Sve funkcije su otključane.'}</p>
     <div class="row" style="flex-wrap:wrap;margin-top:10px">${p.src==='rc'?`<button class="btn ghost sm" data-pwmanage="1">Upravljaj pretplatom</button>`:''}${p.src==='test'?`<button class="btn ghost sm" data-pwtestoff="1">Isključi test Premium</button>`:''}</div>`
   :`<p class="small muted">Besplatno pratiš plan za danas. Premium otključava jelovnik, treninge, napredak i savetnika, bez reklama.</p><div class="row" style="flex-wrap:wrap;margin-top:10px"><button class="btn sm" data-pwopen="1">Pogledaj Premium</button><button class="btn ghost sm" data-pwrestore="1">Vrati kupovinu</button></div>`}</section>`;
  return h.replace('<section class="card"><div class="sec-title"><h2>Savetnik</h2>',card+'<section class="card"><div class="sec-title"><h2>Savetnik</h2>')}})(viewProfil);
/* Danas za besplatne: mala kartica sa pozivom na Premium */
viewDanas=(function(orig){return function(){let h=orig();if(isPrem())return h;
  const up=`<button class="card pw-up" data-pwopen="1"><span class="pw-up-ic">${icd('crown')}</span><span class="pw-up-t"><b>${(t=>t?'Probaj Premium '+t+' dana besplatno':OFFER?'Pređi na Premium':'Probaj Premium 7 dana besplatno')(trialOf(pkg('ANNUAL')||pkg('MONTHLY')||{}))}</b><small>Jelovnik, zamene, treninzi, napredak, bez reklama</small></span>${ic('caret-right','sm')}</button>`;
  return h.replace('<section class="card habits"',up+'<section class="card habits"')}})(viewDanas);
/* ---------- Reklame ---------- */
const AD=()=>PL('AdMob');let AD_INIT=false,AD_MADE=false,AD_ON=false,AD_BUSY=false;
async function adsInit(){const A=AD();if(!A||isPrem())return;try{await A.initialize({initializeForTesting:!CFG.banner});
  try{const ci=await A.requestConsentInfo();if(ci&&ci.isConsentFormAvailable&&ci.status==='REQUIRED')await A.showConsentForm()}catch(e){}AD_INIT=true;adsSync()}catch(e){console.warn('ads',e)}}
async function adsSync(){const A=AD();if(!A||!AD_INIT||AD_BUSY)return;const want=!isPrem()&&TAB==='danas'&&sheet.hidden&&!document.getElementById('cook')&&!document.getElementById('wo')&&!document.querySelector('.lvlup');
  if(want===AD_ON)return;AD_BUSY=true;try{if(want){if(!AD_MADE){await A.showBanner({adId:CFG.banner||'ca-app-pub-3940256099942544/9214589741',adSize:'ADAPTIVE_BANNER',position:'BOTTOM_CENTER',margin:CFG.bannerMargin||88,isTesting:!CFG.banner});AD_MADE=true}else await A.resumeBanner();AD_ON=true}
  else{await A.hideBanner();AD_ON=false}document.body.classList.toggle('ads',AD_ON);AD_BUSY=false;setTimeout(adsSync,60)}catch(e){console.warn('ads',e);AD_BUSY=false}}
window.addEventListener('load',()=>setTimeout(()=>{billingInit();adsInit();document.body.classList.toggle('free',!isPrem());markTabs()},600));
