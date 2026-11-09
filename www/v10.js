/* ================= v10: prekidač teme u zaglavlju, podsetnici na Danas, talas pri dodiru ================= */
const isDark=()=>S.theme==='dark'||(S.theme!=='light'&&window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches);
function themeBtn(){const d=isDark();return `<button class="thm" data-thm="1" aria-label="${d?'Uključi svetlu temu':'Uključi tamnu temu'}" aria-pressed="${d}"><span class="thm-i ${d?'':'on'}">${ic('sun','sm')}</span><span class="thm-i ${d?'on':''}">${ic('moon','sm')}</span></button>`}
render=(function(orig){return function(){orig();const av=app.querySelector('.phead .avatar');if(av&&!app.querySelector('.thm')){if(av.parentElement.tagName==='HEADER'){const w=document.createElement('div');w.className='row hd-r';av.replaceWith(w);w.appendChild(av)}av.insertAdjacentHTML('beforebegin',themeBtn())}}})(render);
function notifCard(){if(S.notif||(S.notifSkip&&S.notifSkip>TODAY))return '';
  return `<section class="card ntf"><span class="ntf-ic">${icd('bell-ringing')}</span><div class="ntf-t"><b>Podsetnici za obroke i vodu</b><span>Javimo ti se za obroke, vodu i šetnju. Isključuješ ih u profilu.</span></div>
   <div class="ntf-a"><button class="btn sm" data-ntf="on">Uključi</button><button class="btn ghost sm" data-ntf="later">Ne sada</button></div></section>`}
viewDanas=(function(orig){return function(){let h=orig();const c=notifCard();if(c)h=h.replace('<section class="tday"',c+'<section class="tday"');return h}})(viewDanas);
document.addEventListener('click',e=>{const t=e.target.closest('[data-thm],[data-ntf]');if(!t)return;e.stopImmediatePropagation();e.preventDefault();
  if(t.dataset.thm){S.theme=isDark()?'light':'dark';save();applyTheme();hap();rerender();return}
  if(t.dataset.ntf==='later'){S.notifSkip=addDays(TODAY,7);save();rerender();return}
  if(t.dataset.ntf==='on'){t.disabled=true;setReminders(true).then(ok=>{S.notif=!!ok;save();if(ok){hap('success');toast('Podsetnici su uključeni')}rerender()})}},true);
/* talas pri dodiru umesto smanjivanja */
const RPL_SEL='button,.btn,.chip-t,.qi,.sug,.act-card,.mrow .open,label.phbtn,.shop-item,.sh-main';
document.addEventListener('pointerdown',e=>{const b=e.target.closest(RPL_SEL);if(!b||b.disabled)return;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const r=b.getBoundingClientRect();if(!r.width)return;let host=b.querySelector(':scope > .rpl-h');
  if(!host){if(getComputedStyle(b).position==='static')b.style.position='relative';host=document.createElement('span');host.className='rpl-h';host.setAttribute('aria-hidden','true');b.appendChild(host)}
  const s=Math.max(r.width,r.height)*2.2,c=document.createElement('span');c.className='rpl';c.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;host.appendChild(c);
  setTimeout(()=>c.remove(),650)},{passive:true});
