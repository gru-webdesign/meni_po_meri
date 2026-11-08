/* ================= START ================= */
(async function boot(){
  try{const P=PL('Preferences');if(P){const has=localStorage.getItem(LS);const r=await P.get({key:LS});
    if(r&&r.value){const o=JSON.parse(r.value);if(!has||(o.updated||0)>(S.updated||0)){S=Object.assign({},DEF,o);S.p=Object.assign({},DEFP,o.p||{});try{localStorage.setItem(LS,r.value)}catch(e){}}}
    else if(has){P.set({key:LS,value:has}).catch(()=>{})}}}catch(e){}
  S.fav=S.fav||{};S.dis=S.dis||{};S.ms=S.ms||{};S.ui=S.ui||{};S.tried=S.tried||{};S.frozen=S.frozen||{};S.shK=S.shK||{};if(S.shields==null)S.shields=0;
  applyTheme();detectBigText();
  if(!S.setup){WIZ=0;TAB='wizard'}
  let msg=null;
  if(S.setup){backfillTried();msg=updateFreezes();if(S.lastOpen&&daysBetween(S.lastOpen,TODAY)>=3)msg=msg||'Drago nam je što si tu. Nastavljamo od danas.';S.lastOpen=TODAY;
    if(S.lvlSeen==null)S.lvlSeen=levelOf(totalXP()).n;save()}
  render();
  if(S.setup){runReview(false);if(S.notif)scheduleReminders();checkMilestones();autoBackup();if(msg)setTimeout(()=>toast(msg),700)}
})();
