/* ================= v8: novi hero na Danas, razlog u zaglavlju ================= */
function ringSVG(pct,size,stroke,id,a,b){const r=(size-stroke)/2,c=2*Math.PI*r,p=Math.max(0,Math.min(1,pct));
  return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
   <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/>
   ${p>0?`<circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-p)}" style="transition:stroke-dashoffset .8s var(--ease)"/>`:''}</svg>`}
function todayHero(){const d=dayOf(),pl=planFor(TODAY),mt=macroT(),tot=dayTotals(),left=mt.k-tot[0],pct=mt.k?tot[0]/mt.k:0,eaten=Object.values(d.eat).filter(Boolean).length;
  const mac=(lbl,v,mx,id,a,b)=>`<div class="mac">${ringSVG(mx?v/mx:0,40,5,id,a,b)}<b class="n">${R(v)}<small>/${R(mx)} g</small></b><span>${lbl}</span></div>`;
  return `<section class="today" aria-label="Kalorije danas">
   <div class="td-top"><div class="td-k"><span class="eyebrow">${left>=0?'Ostalo za danas':'Preko cilja'}</span><b class="n ${left<0?'over':''}">${fmtK(Math.abs(left))}</b><span class="u">kcal · cilj ${fmtK(mt.k)}</span></div>
    <div class="td-ring">${ringSVG(pct,112,11,'rgK','var(--ring-a)','var(--ring-b)')}<div class="c"><b class="n">${R(Math.min(pct,9.99)*100)}%</b><span>pojedeno</span></div></div></div>
   <div class="td-meals" aria-label="${eaten} od ${pl.length} obroka">${pl.map(x=>{const e=d.eat[x.slot];return `<i class="${e?(e.fr<1?'half':'on'):''}"></i>`}).join('')}<span>${eaten} od ${pl.length} obroka</span></div>
   <div class="mac3">${mac('Proteini',tot[1],mt.p,'rgP','#2FB36B','#8FE0A8')}${mac('Ugljeni hidrati',tot[2],mt.c,'rgC','#E8A23A','#F6D27A')}${mac('Masti',tot[3],mt.f,'rgF','#EE7D62','#F9B9A6')}</div></section>`}
viewDanas=(function(orig){return function(){let h=orig();
  h=h.replace(/<section class="hero2" aria-label="Tanjir dana">[\s\S]*?<\/section>/,todayHero());
  const m=h.match(/<div class="why">[\s\S]*?<\/span><\/div>/);if(m){h=h.replace(m[0],'');const txt=m[0].replace(/<[^>]+>/g,'').replace('Tvoj razlog:','').trim();
    h=h.replace('</h1></div>',`</h1><div class="why2">${icd('heart','sm')}<span>${esc(txt)}</span></div></div>`)}
  return h}})(viewDanas);
