/* ================= SPISAK ZA KUPOVINU: period, kupljeno, izbacivanje, ostava, svoje stavke ================= */
const SHOP_P=[['danas','Danas'],['sutra','Sutra'],['3d','3 dana'],['rest','Do nedelje'],['week','Cela nedelja'],['next','Sledeća nedelja'],['custom','Biram dane']];
const SHOP_CATS=['meso','mlecno','povrce','voce','ostalo'];
function shopInit(){S.shopB=S.shopB||{};S.shopX=S.shopX||{};S.shopAdd=S.shopAdd||{};S.pantry=S.pantry||{};S.shop=S.shop||{}}
function shopDays(){const p=uiGet('shopP','rest'),wk0=addDays(TODAY,-dIdx(TODAY)),seq=(a,n)=>[...Array(n)].map((_,i)=>addDays(a,i));
  switch(p){case 'danas':return [TODAY];case 'sutra':return [addDays(TODAY,1)];case '3d':return seq(TODAY,3);case 'week':return seq(wk0,7);case 'next':return seq(addDays(wk0,7),7);
    case 'custom':{const d=(S.ui.shopD||[]).filter(k=>k>=TODAY).sort();return d.length?d:[TODAY]}default:return seq(TODAY,7-dIdx(TODAY))}}
function shopKey(days){return uiGet('shopP','rest')==='week'?'w'+weekIdx(TODAY):'r'+days[0]+'_'+days[days.length-1]+'_'+days.length}
function shopPeriodLabel(days){const p=uiGet('shopP','rest'),f=k=>DAYS[dIdx(k)]+' '+(+k.slice(8))+'.';
  if(days.length===1)return (days[0]===TODAY?'Danas':days[0]===addDays(TODAY,1)?'Sutra':DAYN[dIdx(days[0])]);
  return p==='week'?'Cela nedelja':p==='next'?'Sledeća nedelja':`${f(days[0])} do ${f(days[days.length-1])}, ${days.length} ${days.length<5?'dana':'dana'}`}
const shopBoth=()=>S.p.partner==='da'&&S.ui.shopBoth!==false;
function shopData(){shopInit();const days=shopDays(),key=shopKey(days),mult=1+(shopBoth()?+S.p.partnerPct:0),agg={};
  if(key[0]==='w'&&!S.shopB[key]&&S.shop[key])S.shopB[key]=Object.assign({},S.shop[key]);
  days.forEach(dk=>{const d=S.days[dk];planFor(dk).forEach(x=>{if(d&&d.eat&&d.eat[x.slot])return;if(x.meal.custom)return;
    x.meal.items.forEach(it=>{const a=agg[it.k]||(agg[it.k]={g:0,meals:new Set(),days:new Set()});a.g+=it.q*it.g*mult;a.meals.add(x.meal.n);a.days.add(dk)})})});
  const B=S.shopB[key]||{},X=S.shopX[key]||{},add=S.shopAdd[key]||[];
  const keys=Object.keys(agg).sort((a,b)=>N[a][0].localeCompare(N[b][0],'sr'));
  const pantry=keys.filter(k=>S.pantry[k]),skip=keys.filter(k=>!S.pantry[k]&&X[k]),need=keys.filter(k=>!S.pantry[k]&&!X[k]);
  return {days,key,agg,B,X,add,pantry,skip,need,todo:need.filter(k=>!B[k]),got:need.filter(k=>B[k])}}
function shopQty(k,g){const n=N[k];if(n[2])return Math.ceil(g/n[2]-0.05)+' '+n[1];if(n[1]==='ml')return g>=1000?fmt1(Math.ceil(g/250)/4)+' l':Math.max(50,Math.ceil(g/50)*50)+' ml';return g>=1000?fmt1(Math.ceil(g/100)/10)+' kg':Math.max(50,Math.ceil(g/50)*50)+' g'}
function shopRow(D,k,mode){const a=D.agg[k],nm=esc(N[k][0]),q=shopQty(k,a.g),sub=`${a.meals.size} ${a.meals.size===1?'obrok':a.meals.size<5?'obroka':'obroka'}${a.days.size>1?' · '+a.days.size+' dana':''}`;
  if(mode==='edit')return `<button class="sh-row ed ${D.X[k]?'':'on'}" data-sx="${k}" aria-pressed="${!D.X[k]}"><span class="ck">${ic('check','sm')}</span><span class="sh-n"><span>${nm}</span><small>${sub}</small></span><b>${q}</b></button>`;
  const got=!!D.B[k];return `<div class="sh-row ${got?'done':''}"><button class="sh-main" data-sb="${k}" aria-pressed="${got}"><span class="ck">${ic('check','sm')}</span><span class="sh-n"><span>${nm}</span><small>${sub}</small></span><b>${q}</b></button>${got?'':`<button class="sh-x" data-sx="${k}" aria-label="Ne treba: ${nm}">${ic('x','sm')}</button>`}</div>`}
function shopSheet(){const D=shopData(),p=uiGet('shopP','rest'),edit=!!S.ui.shopEdit,total=D.need.length+D.add.length,gotN=D.got.length+D.add.filter(x=>x.b).length;
  const wk0=addDays(TODAY,-dIdx(TODAY)),sel=S.ui.shopD||[];
  const groups=list=>SHOP_CATS.map(c=>{const ks=list.filter(k=>N[k][3]===c);return ks.length?`<div class="shop-group"><div class="block-lbl">${CAT_NAMES[c]}</div>${ks.map(k=>shopRow(D,k,edit?'edit':'')).join('')}</div>`:''}).join('');
  const own=D.add.filter(x=>edit||!x.b);
  return `<div class="sheet-head"><div><div class="w">${esc(shopPeriodLabel(D.days))}${S.p.partner==='da'?(shopBoth()?' · za oboje':' · samo za tebe'):''}</div><h2 id="sheetTitle">Spisak za kupovinu</h2></div>${closeBtn}</div>
  <div class="fchips sh-per" role="tablist" aria-label="Za koji period">${SHOP_P.map(([k,l])=>`<button class="chip-t ${p===k?'on':''}" role="tab" aria-selected="${p===k}" data-shp="${k}">${l}</button>`).join('')}</div>
  ${p==='custom'?`<div class="sh-days">${[0,7].map(o=>`<div class="sh-wk"><span>${o?'Sledeća':'Ova'}</span>${[...Array(7)].map((_,i)=>{const k=addDays(wk0,o+i),past=k<TODAY;return `<button class="sh-day ${sel.includes(k)?'on':''}" ${past?'disabled':''} data-shd="${k}" aria-pressed="${sel.includes(k)}"><small>${DAYS[i]}</small><b class="n">${+k.slice(8)}</b></button>`}).join('')}</div>`).join('')}</div>`:''}
  ${S.p.partner==='da'?`<div class="seg mini" role="radiogroup" aria-label="Količine"><button type="button" class="${shopBoth()?'':'on'}" data-shboth="0">Samo za mene</button><button type="button" class="${shopBoth()?'on':''}" data-shboth="1">Za oboje</button></div>`:''}
  ${total?`<div class="sh-prog"><div class="sh-pt"><span><b class="n">${gotN}</b> od <span class="n">${total}</span> u korpi</span>${D.skip.length||D.pantry.length?`<span class="muted">${D.skip.length+D.pantry.length} ne treba</span>`:''}</div><div class="lvl-bar" style="background:var(--sunk)"><i style="width:${total?gotN/total*100:0}%"></i></div></div>`:''}
  <div class="sh-tools">${edit?`<button class="btn sm" data-shedit="0">${ic('check','sm')}Gotovo</button><button class="btn ghost sm" data-shall="1">Sve treba</button><button class="btn ghost sm" data-shall="0">Ništa ne treba</button>`:
    `<button class="btn ghost sm" data-shedit="1">${ic('pencil-simple','sm')}Izaberi šta treba</button><button class="btn ghost sm" data-share="shop">${ic('share-network','sm')}Podeli</button>${gotN?`<button class="btn ghost sm" data-shclr="1">${ic('arrow-counter-clockwise','sm')}Poništi korpu</button>`:''}`}</div>
  ${edit?`<div class="note">${ic('info','sm')}<span>Isključi ono što već imaš kod kuće. Na spisku ostaje samo ono što je označeno. Ako ti treba svega nekoliko stvari, dodirni „Ništa ne treba”, pa označi samo njih.</span></div>`:''}
  ${!D.need.length&&!D.skip.length&&!D.pantry.length?`<div class="empty">${icd('seal-check','lg')}<b>Nema šta da se kupi</b><span>Za ove dane su obroci već pojedeni ili nema plana. Izaberi drugi period.</span></div>`:''}
  ${edit?groups(D.need.concat(D.skip).sort((a,b)=>N[a][0].localeCompare(N[b][0],'sr'))):groups(D.todo)}
  ${!edit&&D.need.length&&!D.todo.length?`<div class="note ok">${icd('seal-check','sm')}<span>Sve sa spiska je u korpi.</span></div>`:''}
  <div class="shop-group"><div class="block-lbl">Dodaj svoje</div>${own.map(x=>`<div class="sh-row ${x.b?'done':''}"><button class="sh-main" data-sbo="${x.id}" aria-pressed="${!!x.b}"><span class="ck">${ic('check','sm')}</span><span class="sh-n"><span>${esc(x.n)}</span></span><b></b></button><button class="sh-x" data-sdo="${x.id}" aria-label="Obriši ${esc(x.n)}">${ic('trash','sm')}</button></div>`).join('')}
    <div class="sh-addrow"><input type="text" id="shNew" placeholder="npr. deterdžent, hleb za decu" aria-label="Nova stavka" autocomplete="off"><button class="icon-btn" data-shadd="1" aria-label="Dodaj">${ic('plus','sm')}</button></div></div>
  ${!edit&&(D.got.length||D.add.some(x=>x.b))?`<details class="sh-more" ${S.ui.shopOpenGot?'open':''}><summary data-shsum="got">U korpi (${D.got.length+D.add.filter(x=>x.b).length})${ic('caret-right','sm')}</summary>${D.got.map(k=>shopRow(D,k,'')).join('')}${D.add.filter(x=>x.b).map(x=>`<div class="sh-row done"><button class="sh-main" data-sbo="${x.id}" aria-pressed="true"><span class="ck">${ic('check','sm')}</span><span class="sh-n"><span>${esc(x.n)}</span></span><b></b></button></div>`).join('')}</details>`:''}
  ${!edit&&D.skip.length?`<details class="sh-more"><summary>Ne treba ovog puta (${D.skip.length})${ic('caret-right','sm')}</summary>${D.skip.map(k=>`<div class="sh-row skip"><span class="sh-n"><span>${esc(N[k][0])}</span><small>${shopQty(k,D.agg[k].g)}</small></span><button class="btn ghost sm" data-sx="${k}">Vrati</button><button class="btn ghost sm" data-span="${k}">Uvek imam</button></div>`).join('')}</details>`:''}
  ${D.pantry.length||Object.keys(S.pantry).length?`<details class="sh-more"><summary>Uvek imam kod kuće (${Object.keys(S.pantry).length})${ic('caret-right','sm')}</summary><p class="small muted" style="margin:4px 0 6px">Ove namirnice se nikad ne stavljaju na spisak.</p>${Object.keys(S.pantry).filter(k=>N[k]).map(k=>`<div class="sh-row skip"><span class="sh-n"><span>${esc(N[k][0])}</span></span><button class="btn ghost sm" data-span="${k}">Ukloni</button></div>`).join('')}</details>`:''}`}
function shopText(){const D=shopData(),lines=['Kupovina: '+shopPeriodLabel(D.days)+(shopBoth()?' (za dvoje)':'')];
  SHOP_CATS.forEach(c=>{const ks=D.todo.filter(k=>N[k][3]===c);if(!ks.length)return;lines.push('',CAT_NAMES[c].toUpperCase());ks.forEach(k=>lines.push('- '+N[k][0]+': '+shopQty(k,D.agg[k].g)))});
  const own=D.add.filter(x=>!x.b);if(own.length){lines.push('','OSTALO');own.forEach(x=>lines.push('- '+x.n))}return lines.join('\n')}
function shopRedraw(){if(sheet.hidden)return;const pnl=sheetBody.closest('.sheet-panel'),y=pnl?pnl.scrollTop:0;sheetBody.innerHTML=shopSheet();if(pnl)pnl.scrollTop=y}
function shopTrim(){['shopB','shopX','shopAdd'].forEach(f=>{const ks=Object.keys(S[f]);if(ks.length>12)ks.slice(0,ks.length-12).forEach(k=>delete S[f][k])})}
function shopAddItem(){const i=document.getElementById('shNew');if(!i)return;const n=i.value.trim();if(!n){i.focus();return}const D=shopData();
  (S.shopAdd[D.key]=S.shopAdd[D.key]||[]).push({id:Date.now().toString(36),n:n.slice(0,60),b:false});save();hap();shopRedraw();const j=document.getElementById('shNew');if(j)j.focus()}
function shopClick(e){const t=e.target.closest('[data-shp],[data-shd],[data-sb],[data-sx],[data-span],[data-shedit],[data-shall],[data-shclr],[data-shboth],[data-sbo],[data-sdo],[data-shadd],[data-shsum]');if(!t||!sheetBody.contains(t))return;
  const ds=t.dataset;if(ds.shsum){S.ui.shopOpenGot=!t.parentElement.open;return}
  e.preventDefault();e.stopImmediatePropagation();shopInit();const D=shopData(),K=D.key;
  if(ds.shp){S.ui.shopP=ds.shp;if(ds.shp==='custom'&&!(S.ui.shopD||[]).some(k=>k>=TODAY))S.ui.shopD=[TODAY,addDays(TODAY,1)]}
  else if(ds.shd){const a=(S.ui.shopD||[]).filter(k=>k>=TODAY),i=a.indexOf(ds.shd);if(i>=0)a.splice(i,1);else a.push(ds.shd);S.ui.shopD=a}
  else if(ds.sb){const B=S.shopB[K]=S.shopB[K]||{};B[ds.sb]=!B[ds.sb];if(!B[ds.sb])delete B[ds.sb];hap(B[ds.sb]?'medium':'light')}
  else if(ds.sx){const X=S.shopX[K]=S.shopX[K]||{};if(X[ds.sx])delete X[ds.sx];else{X[ds.sx]=true;const k=ds.sx;if(!S.ui.shopEdit)toast('Izbačeno: '+N[k][0],()=>{delete S.shopX[K][k];save();shopRedraw()})}}
  else if(ds.span){if(S.pantry[ds.span]){delete S.pantry[ds.span];toast('Vraćeno na spisak: '+N[ds.span][0])}else{S.pantry[ds.span]=true;toast(N[ds.span][0]+' se više ne stavlja na spisak')}}
  else if(ds.shedit){S.ui.shopEdit=ds.shedit==='1'}
  else if(ds.shall){const X=S.shopX[K]={};if(ds.shall==='0')D.need.concat(D.skip).forEach(k=>X[k]=true)}
  else if(ds.shclr){const prev=S.shopB[K];S.shopB[K]={};(S.shopAdd[K]||[]).forEach(x=>x.b=false);toast('Korpa je ispražnjena',()=>{S.shopB[K]=prev;save();shopRedraw()})}
  else if(ds.shboth){S.ui.shopBoth=ds.shboth==='1'}
  else if(ds.sbo){const x=(S.shopAdd[K]||[]).find(y=>y.id===ds.sbo);if(x){x.b=!x.b;hap()}}
  else if(ds.sdo){S.shopAdd[K]=(S.shopAdd[K]||[]).filter(y=>y.id!==ds.sdo)}
  else if(ds.shadd){shopAddItem();return}
  shopTrim();save();hap();shopRedraw()}
sheet.addEventListener('click',shopClick,true);
sheet.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='shNew'){e.preventDefault();shopAddItem()}});
