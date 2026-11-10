/* ================= v7: fotografije jela iz aplikacije, programi kao kartice, izvori fotografija ================= */
const bundledPh=id=>typeof MEAL_CREDITS!=='undefined'&&id&&MEAL_CREDITS[id]?'img/meals/'+id+'.jpg':null;
av=(function(orig){return function(m,type,cls=''){const ph=m&&!m.custom&&!photoOf(m.id)&&bundledPh(m.id);return ph?`<span class="av-food ph ${cls}" aria-hidden="true"><img src="${ph}" alt="" loading="lazy" decoding="async"></span>`:orig(m,type,cls)}})(av);
const LICN={'cc0':'CC0','pdm':'javno dobro','by':'CC BY','by-sa':'CC BY-SA'};
const licTxt=c=>{const l=String(c.license||'').toLowerCase();return (LICN[l]||c.license||'').toUpperCase().replace('JAVNO DOBRO','javno dobro')+(c.lv&&LICN[l]&&l!=='cc0'&&l!=='pdm'?' '+c.lv:'')};
const stripTags=s=>String(s||'').replace(/<[^>]*>/g,'').trim();
function photoBlock(id){const own=photoOf(id),b=!own&&bundledPh(id),src=own||b,c=b&&MEAL_CREDITS[id];
  return `<div class="phblk ${src?'has':''}">${src?`<img src="${src}" alt="${own?'Tvoja fotografija jela':'Fotografija jela'}">`:''}
  <label class="phbtn">${ic('camera','sm')}<span>${own?'Promeni fotografiju':b?'Dodaj svoju':'Dodaj fotografiju svog jela'}</span><input type="file" accept="image/*" class="phin" data-phid="${id}" hidden></label>
  ${own?`<button class="phdel" data-phdel="${id}" aria-label="Obriši fotografiju">${ic('trash','sm')}</button>`:''}
  ${c&&!c.ai?`<span class="phcr">Foto: ${esc(stripTags(c.creator)||'nepoznat autor')} · ${esc(licTxt(c))}</span>`:''}</div>`}
const PG_EX={ledja:'birddog',istezanje:'hipflexor',joga:'warrior',kal1:'sitstand',kal2:'squat',kardio:'boxing'};
function progCard(p){const m=progMeta(p);if(m.ids.length<3)return '';const done=((S.days[TODAY]||{}).wo||[]).some(x=>x.p===p.id);
  return `<button class="progx pg-${p.id}" data-prog="${p.id}"><span class="pt"><span><b>${esc(p.n)}</b><small style="display:block;margin-top:4px">${m.min} min · ${m.kcal} kcal · ${m.ids.length} vežbi</small></span><span class="go">${ic('arrow-right','sm')}</span></span>${exThumb(PG_EX[p.id])}${done?`<span class="dn">${ic('check','sm')}</span>`:''}</button>`}
function creditsSheet(){const ids=Object.keys(typeof MEAL_CREDITS!=='undefined'?MEAL_CREDITS:{}).filter(id=>!MEAL_CREDITS[id].ai);
  return `<div class="sheet-head"><div><div class="w">${ids.length} fotografija</div><h2 id="sheetTitle">Izvori fotografija</h2></div>${closeBtn}</div>
  <p class="small muted" style="margin-bottom:12px">Fotografije jela su sa Openverse i Wikimedia Commons, pod slobodnim licencama. Isečene su i smanjene za aplikaciju. Hvala autorima.</p>
  <div class="credits">${ids.map(id=>{const c=MEAL_CREDITS[id],m=LIB.find(x=>x.id===id);return `<div><img src="img/meals/${id}.jpg" alt="" loading="lazy"><span><b>${esc(m?m.n:id)}</b><br>${esc(stripTags(c.creator)||'nepoznat autor')}, „${esc(stripTags(c.title)||'bez naslova')}”, ${esc(licTxt(c))}${c.page?` · <a href="${esc(c.page)}" target="_blank" rel="noopener">izvor</a>`:''}</span></div>`}).join('')}</div>`}
viewProfil=(function(orig){return function(){let h=orig();if(String(uiGet('prof','0'))===String(FORM.length)&&typeof MEAL_CREDITS!=='undefined'&&Object.values(MEAL_CREDITS).some(c=>!c.ai))
  h=h.replace('<div style="margin-top:14px"><button class="btn ghost sm" id="resetBtn">',`<div style="margin-top:14px"><button class="btn ghost sm" data-credits="1">${ic('image-square','sm')}Izvori fotografija</button></div><div style="margin-top:14px"><button class="btn ghost sm" id="resetBtn">`);return h}})(viewProfil);
app.addEventListener('click',e=>{const t=e.target.closest('[data-credits]');if(t){e.stopImmediatePropagation();openSheet(creditsSheet())}},true);
