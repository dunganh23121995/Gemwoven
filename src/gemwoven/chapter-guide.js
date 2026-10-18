/* A field guide inside the expedition scene; no generic dialog or gear slot. */
(()=>{
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const picture=(key,cls='')=>`<img class="${cls}" src="${esc((A[key]||A['crest']).file)}" alt="" draggable="false">`;
  function fieldGuide(el,p,state,d){
    const counter=M.counterProgress(p,d.chapter),start=(d.chapter-1)*50,bossOpen=p.campaign.cleared>=start+49;
    el.innerHTML=`<header><h2>${esc(d.name)}</h2><button class="game-btn" data-action="guide:close">Đóng</button></header><div class="chapter-boss-intro">${picture('boss-'+d.id,'chapter-boss-portrait')}<div><h3>Chương ${d.chapter}</h3><p>${esc(d.chapterName)}</p><p>Chuyển pha: 70% / 35% HP<br>3 sao boss: còn ≥50% HP, ≤20 lượt</p></div></div><section class="chapter-artifact">${picture(d.counterKey)}<div><h3>${esc(d.counter)} · Bậc ${counter.rank}/4</h3><p>${counter.shards}/12 mảnh · Giảm ${Math.round(counter.reduction*100)}% cơ chế chủ đề</p><p>${esc(d.counterText)}</p></div></section><div class="chapter-elite-milestones">${d.eliteMilestones.map((n,i)=>{const stage=start+n,stars=p.campaign.stars[stage]||0,claimed=counter.claimed.includes(n);return `<button data-action="guide:elite" data-index="${stage}" ${p.campaign.cleared<stage-1?'disabled':''} aria-label="Tinh anh mốc ${n}, ${stars} sao">${picture('creature-'+d.theme+'-'+d.elites[i%2][0])}<b>Mốc ${n}</b><span>${'★'.repeat(stars)+'☆'.repeat(3-stars)}</span><small>${claimed?'Đã nhận 3 mảnh':'3 sao: +3 mảnh'}</small></button>`;}).join('')}</div><p class="chapter-counter-note">Mảnh chỉ nhận một lần mỗi mốc khi thắng 3 sao: còn ít nhất 50% HP và kết thúc trong 16 lượt. Đồ tự ghép, không mất khi thua và không chiếm ô tướng.</p><div class="chapter-boss-challenge"><p>${counter.rank===4?'Khắc chế hoàn chỉnh. Vẫn cần phá hộ vệ và ngắt đòn niệm.':`Khắc chế ${counter.shards}/12: có thể vào boss nhưng cơ chế ${esc(d.status)} sẽ khó xử lý hơn.`}</p><button class="game-btn" data-action="guide:challenge" data-index="${start+50}" ${bossOpen?'':'disabled'}>${bossOpen?'Thách đấu boss':'Vượt mốc 49 để vào boss'}</button></div><details><summary>Nội tại và cách đối phó</summary><p>${esc(d.passive)}</p><p>Ghép 6 ngọc ${['Kiếm','Tim','Ngọc','Tuyết','Khiên'][d.tile]}: giảm 1 tầng ${esc(d.status)}, giảm 12 điểm ${esc(d.gauge)}. Đòn niệm bị ngắt khi ghép đủ 6 ngọc đó trong lượt hoặc gây ít nhất 6% HP boss trong cửa sổ niệm.</p><p>${d.eliteLessons.map(esc).join(' ')}</p></details><details><summary>Bộ 6 kỹ năng của boss</summary>${d.skills.map(s=>`<article class="chapter-skill"><b>Pha ${s.phase} · ${esc(s.name)}</b><p>${esc(s.description)}</p></article>`).join('')}</details>`;
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='campaign')return p;
    const d=M.WORLD.EXPANSION.definitions.find(d=>d.chapter===state.chapter);if(!d)return p;
    const c=M.counterProgress(p,d.chapter),key='campaign.counter-guide';C[key]=`${d.counter} ${c.shards}/12`;
    if(!state.mapStage)L.screens.campaign.nodes.push({id:key,text:key,kind:'button',rect:[18,1465,183,156],asset:'inventory-slot',icon:d.counterKey,iconRect:[43,8,98,95],labelRect:[3,111,177,38],size:23,tone:'gold',action:'guide:open',className:'chapter-guide-entry'});
    if(state.chapterGuide)L.screens.campaign.nodes.push({id:'campaign.field-guide',kind:'content',rect:[44,357,853,1100],backgroundAsset:'panel-parchment',className:'chapter-field-guide',build:el=>fieldGuide(el,p,state,d)});
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='journey:chapter')state.chapterGuide=false;
    if(!action.startsWith('guide:'))return handle(action,el,ctx,state);
    const cmd=action.slice(6);
    if(cmd==='open'){state.mapStage=null;state.chapterGuide=true;ctx.render();}
    if(cmd==='close'){state.chapterGuide=false;ctx.render();}
    if(cmd==='challenge'||cmd==='elite')return handle('journey:stage',{dataset:{index:el.dataset.index}},ctx,state);
    if(cmd==='chapter'){state.chapter=Number(el.dataset.chapter);state.chapterGuide=true;ctx.navigate('campaign');}
    return true;
  };
})();
