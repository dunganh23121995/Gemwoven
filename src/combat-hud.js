// Combat HUD (docs/REQUEST_TRACKER.md I12, assets/raw/combat-hud: Codex mockups and review). Visual layer only:
// it moves the existing controls into drawn wood, leather, brass and parchment pieces (assets/combat-hud,
// assets/gemwoven/ui-kit) and never changes a rule, number, timing or sound. Every id the game and tests use stays
// on its element; the elements are restyled, wrapped or moved, never replaced.
//   top bar:      Về (hub link) · Ải tag (mirrors #stageLabel) · journey medal (#score) · settings medallion
//   settings:     #soundBtn, #motionBtn ("Hiệu ứng"), #helpBtn (with the gem guide) behind one gear
//   no action strip (owner 08/11): the ultimate fires by itself at 100 nộ, hints are gone; #turnChip stays hidden and
//   a short banner in the scene tells whose turn it is; Biến Thân is a medallion on the seam (progression-combat.js).
// Phone portrait stacks battle and board; landscape screens put the battle left and the board right.
(function combatHud(){
  if(new URLSearchParams(location.search).has('showcase'))return;
  const root=document.documentElement,app=document.querySelector('.app'),header=document.querySelector('.app-header');
  if(!app||!header||root.classList.contains('chud'))return;
  root.classList.add('chud');
  const make=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};

  // ---- Top bar ------------------------------------------------------------------------------------------------
  const bar=make('div','chud-bar');header.append(bar);
  const back=header.querySelector('.progression-back');
  if(back){back.textContent='Về';back.classList.add('chud-back');back.setAttribute('aria-label','Về thị trấn');back.prepend(make('i','chud-back-arrow'));bar.append(back);}
  const stage=make('span','chud-stage');stage.id='hudStage';stage.setAttribute('aria-hidden','true');bar.append(stage);
  // "MÀN 07" (sandbox) and "Chương 1 · Ải 7" (hub) both read as the short tag "Ải 7"; a named fight keeps its name.
  const shortStage=t=>{t=(t||'').trim();const m=t.match(/(?:Ải|MÀN|Màn)\s*0*(\d+)/);if(m)return 'Ải '+m[1];const b=t.match(/^BOSS\s*0*(\d+)/);return b?'Trùm · Ải '+b[1]:t;};
  const syncStage=()=>{const t=$('stageLabel').textContent;stage.textContent=shortStage(t);stage.title=t;};
  new MutationObserver(syncStage).observe($('stageLabel'),{childList:true,characterData:true,subtree:true});
  const scoreBox=document.querySelector('.board-heading .score');
  const medal=make('button','chud-score');medal.type='button';medal.id='hudScoreBtn';medal.setAttribute('aria-label','Điểm hành trình');
  medal.append(make('i','chud-medal'));if(scoreBox)medal.append(scoreBox);bar.append(medal);
  const gear=make('button','chud-gear');gear.type='button';gear.id='hudSettingsBtn';gear.setAttribute('aria-label','Cài đặt');gear.setAttribute('aria-haspopup','dialog');gear.setAttribute('aria-expanded','false');bar.append(gear);

  // ---- Settings sheet: the original buttons, each on a labelled row ------------------------------------------
  const sheet=make('div','chud-sheet');sheet.id='hudSettings';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-label','Cài đặt');
  sheet.append(make('div','chud-sheet-title','Cài đặt'));
  const rows=[['soundBtn','Âm thanh','speaker'],['motionBtn','Hiệu ứng','sparkle'],['audioSettingsBtn','Âm lượng','music'],['helpBtn','Cách chơi','help']];
  for(const [id,label,iconName] of rows){
    const button=$(id);if(!button)continue;
    const row=make('div','chud-row chud-row-'+iconName);row.append(make('i','chud-row-icon'),make('span','chud-row-label',label),button);
    row.addEventListener('click',e=>{if(!button.contains(e.target)&&!button.hidden&&!button.disabled)button.click();});
    sheet.append(row);
  }
  document.body.append(sheet);
  const tools=header.querySelector('.header-tools');if(tools)tools.hidden=true;
  // Only the settings that exist here show a row (the volume dialog is the hub's).
  const syncRows=()=>sheet.querySelectorAll('.chud-row').forEach(r=>{r.hidden=!!r.querySelector('button')?.hidden;});

  // ---- Short notes behind a tap (journey points, the ultimate) --------------------------------------------------
  const note=make('div','chud-note');note.id='hudNote';note.hidden=true;note.setAttribute('role','status');document.body.append(note);
  let noteFor=null;
  function place(panel,anchor,centre=false){
    panel.style.left=panel.style.top='0px';
    const a=anchor.getBoundingClientRect(),w=panel.offsetWidth,h=panel.offsetHeight,vw=innerWidth,vh=innerHeight;
    let x=centre?(vw-w)/2:a.left+a.width/2-w/2,y=a.bottom+(centre?26:8);if(y+h>vh-8)y=Math.max(8,a.top-h-8);
    panel.style.left=Math.round(Math.max(8,Math.min(vw-w-8,x))+scrollX)+'px';panel.style.top=Math.round(y+scrollY)+'px';
  }
  function closeAll(){
    if(!sheet.hidden){sheet.hidden=true;gear.setAttribute('aria-expanded','false');}
    note.hidden=true;noteFor=null;
  }
  function showNote(anchor,title,text){
    if(noteFor===anchor&&!note.hidden){closeAll();return;}
    closeAll();note.replaceChildren(make('b','',title),make('span','',text));note.hidden=false;noteFor=anchor;place(note,anchor);
  }
  gear.addEventListener('click',e=>{
    e.stopPropagation();const open=sheet.hidden;closeAll();if(!open)return;
    syncRows();sheet.hidden=false;gear.setAttribute('aria-expanded','true');place(sheet,gear,innerWidth<600);sheet.querySelector('button:not([hidden])')?.focus({preventScroll:true});
  });
  medal.addEventListener('click',e=>{e.stopPropagation();showNote(medal,'Điểm hành trình','Cộng khi ghép ngọc và hạ đối thủ.');});
  document.addEventListener('click',e=>{if(!sheet.contains(e.target)&&!note.contains(e.target))closeAll();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(!sheet.hidden||!note.hidden)){closeAll();gear.focus({preventScroll:true});}});
  $('helpBtn').addEventListener('click',()=>closeAll());
  addEventListener('resize',()=>closeAll());

  // ---- No action strip (owner 08/11: "Bỏ cái khoanh đỏ... bỏ cả gợi ý"; Codex mockup raw/combat-layout, 8/10) --------
  // The strip (turn ribbon, ultimate disc, hint bulb) is hidden; the scene takes its height. At each turn start a short
  // banner in the scene says whose turn it is, and the board frame keeps its enemy-turn glow.
  const strip=document.querySelector('.board-toolbar');if(strip)strip.hidden=true;
  const turnChip=$('turnChip'),banner=make('div','chud-turn-banner');banner.setAttribute('aria-hidden','true');$('scene')?.append(banner);
  let lastTurn='';
  if(turnChip)new MutationObserver(()=>{const t=turnChip.textContent.trim(),enemy=turnChip.classList.contains('enemy');
    if(!/^(Lượt |Đóng băng)/.test(t)||t===lastTurn)return;lastTurn=t;
    banner.textContent=t.split(' · ')[0]==='Đóng băng'?'Đóng băng · mất lượt':t;banner.classList.toggle('enemy',enemy);
    banner.classList.remove('show');void banner.offsetWidth;banner.classList.add('show');}).observe(turnChip,{childList:true,characterData:true,subtree:true,attributes:true});

  // ---- Wooden frames around the battlefield and the board ----------------------------------------------------
  const frame=()=>make('span','chud-frame','<i class="chud-c tl"></i><i class="chud-c tr"></i><i class="chud-c bl"></i><i class="chud-c br"></i><i class="chud-e t"></i><i class="chud-e b"></i><i class="chud-e l"></i><i class="chud-e r"></i>');
  const card=$('battleCard');if(card){const f=frame();f.setAttribute('aria-hidden','true');card.append(f);}
  const boardFrame=$('boardFrame');if(boardFrame){const f=frame();f.setAttribute('aria-hidden','true');boardFrame.append(f);}

  // ---- Backdrop around the columns: a painted plank wall (assets/combat-hud/backdrop.webp) ------------------
  const backdrop=make('div','chud-backdrop');backdrop.setAttribute('aria-hidden','true');document.body.prepend(backdrop);

  // Each fighter's nộ as a number on its spark gauge (inside the meter, so the meter keeps its own value).
  const rageNum={};for(const side of ['hero','enemy']){const r=$(side+'Rage');if(r){rageNum[side]=make('i','chud-rage-num');rageNum[side].setAttribute('aria-hidden','true');r.append(rageNum[side]);}}

  // ---- Live values: energy ring, element emblem, Vietnamese effects label ------------------------------------
  const hudUpdate=update;
  update=function(){
    hudUpdate();
    for(const side of ['hero','enemy']){const r=$(side+'Rage');if(!r)continue;const n=Math.max(0,Math.min(100,Math.round(+r.getAttribute('aria-valuenow')||0)));r.closest('.actor-hud')?.classList.toggle('is-rage-full',n>=100);if(rageNum[side])rageNum[side].textContent=n+'/100';}
    syncStage();
  };
  const hudSettings=updateSettings;
  updateSettings=function(){
    hudSettings();
    const motion=$('motionBtn'),status=motion.querySelector('.motion-status');if(status)status.textContent='Hiệu ứng';
    motion.setAttribute('aria-label','Hiệu ứng');motion.title=reduced?'Hiệu ứng đang tắt · bấm để bật':'Hiệu ứng đang bật · bấm để tắt';
    $('soundBtn').title=sound?'Âm thanh đang bật · bấm để tắt':'Âm thanh đang tắt · bấm để bật';
  };
})();
