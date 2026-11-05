// Board items (owner 05/11: "board thêm cơ chế mới nhưng hình ảnh item tương tác chưa được làm"; Codex critique and mockup
// in assets/gemwoven/raw/board-items/). Drawn pieces (ART.boardItems, cut by prep.py) dress every interactive board item:
//   Sao băng: the plain gem on a horizontal rune launcher (turned for a column); Bom: the gem in an open bronze cage with a
//   burning fuse; Lõi: a prism orb in a turning rune ring. A special pops when it is made; selecting one, or dragging it onto
//   another special, previews exactly what it will clear (the rules come from GemwovenSpecials, never a copy).
//   Frozen: an ice crust over the foe's feet that shatters on release (the ice build-up and the guard after a freeze are
//   status tiles, owner 05/11). Purple gems send rage comets to the gauge; a combo rage bonus bursts there.
// Every piece is one image moved whole (no frame swaps); reduced motion keeps only the still state.
const BOARD_ITEM=name=>ART.boardItems?.[name]||null;
const boardItemPlain=type=>ART.items[itemNames[Math.max(0,type)]];

// ----- Special gems on the board -----
const boardItemPaint=paintTile;
paintTile=function(t){
  const was=t.el?.dataset.tier;boardItemPaint(t);
  const e=t.el,gem=e.querySelector('.gem');if(!gem||!t.special||!ART.boardItems)return;
  gem.querySelector('.special-tier')?.remove();gem.querySelector('.special-dir')?.remove();
  const art=gem.querySelector('.item-art');
  // v3 (owner 05/11: "item đặc biệt hơi tệ … có thể làm lại"; assets/gemwoven/raw/board-fx-v3/): the gem keeps its full
  // size and its look; the special is light drawn behind it (a comet band with two arrow tips, a ring of fire, a
  // rainbow halo), no more metal launcher, cage or fuse.
  if(t.special==='bolt'){
    e.dataset.dir=t.dir==='col'?'col':'row';art.src=boardItemPlain(t.type);
    gem.insertAdjacentHTML('afterbegin',`<img class="bi-aura" src="${BOARD_ITEM('bolt-aura')}" alt="" draggable="false">`);
  }else if(t.special==='bomb'){
    art.src=boardItemPlain(t.type);
    gem.insertAdjacentHTML('afterbegin',`<img class="bi-firering" src="${BOARD_ITEM('bomb-ring')}" alt="" draggable="false">`);
  }else if(t.special==='core'){
    art.src=BOARD_ITEM('core');art.classList.add('bi-core');
    // A silky rainbow ring orbiting the orb's equator, tilted down so it reads as an ellipse: its far half behind the
    // orb, its near half in front (owner 05/11).
    const ring=ART.specialFx?.orbit||BOARD_ITEM('core-ring');
    gem.insertAdjacentHTML('afterbegin',`<span class="bi-orbit back"><img src="${ring}" alt="" draggable="false"></span>`);
    gem.insertAdjacentHTML('beforeend',`<span class="bi-orbit front"><img src="${ring}" alt="" draggable="false"></span>`);
  }
  if(was==='normal')boardItemPop(e);
};
// The moment a special is made: the gem swells from 1.35 and a star flash opens over it (once, never on a resting board).
function boardItemPop(el){
  if(reduced||!BOARD_ITEM('pop'))return;
  const star=document.createElement('img');star.className='bi-pop';star.src=BOARD_ITEM('pop');star.alt='';el.append(star);
  star.animate([{opacity:0,scale:.2,rotate:'-20deg'},{opacity:1,scale:1.15,offset:.35},{opacity:0,scale:1.55,rotate:'25deg'}],{duration:420,easing:'cubic-bezier(.2,.7,.3,1)'}).finished.then(()=>star.remove(),()=>star.remove());
  el.querySelector('.gem')?.animate([{scale:1.35},{scale:.94,offset:.6},{scale:1}],{duration:360,easing:'ease-out'});
}

// ----- What a special will clear (preview) -----
const boardItemAt=q=>board[Math.floor(q/SIZE)]?.[q%SIZE];
const boardItemIndex=t=>t.r*SIZE+t.c;
function boardItemArea(a,b){
  const S=globalThis.GemwovenSpecials;if(!S||!a?.special)return [];
  const typeAt=q=>boardItemAt(q)?.type,kindAt=q=>boardItemAt(q)?.special||null;
  if(b?.special)return S.combo({p:boardItemIndex(a),kind:a.special,dir:a.dir,type:a.type},{p:boardItemIndex(b),kind:b.special,dir:b.dir,type:b.type},boardItemIndex(b),typeAt,kindAt).clear;
  if(a.special==='core')return [];
  return S.blast(a.special,boardItemIndex(b||a),a.dir,typeAt,a.type);
}
function boardItemPreview(cells){
  for(const el of document.querySelectorAll('#board .tile.bi-target'))el.classList.remove('bi-target');
  for(const q of cells||[])boardItemAt(q)?.el?.classList.add('bi-target');
  $('board').classList.toggle('bi-previewing',!!cells?.length);
}
const boardItemSelect=selectTile;
selectTile=function(t){boardItemSelect(t);boardItemPreview(t.special?boardItemArea(t):null);};
const boardItemClear=clearSelection;
clearSelection=function(){boardItemClear();boardItemPreview(null);};
// Dragging a special (or onto one): the cells of that swap light up before it is made.
$('board').addEventListener('pointermove',e=>{
  if(!pointer||pointer.id!==e.pointerId||locked)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.max(Math.abs(dx),Math.abs(dy))<15)return;
  const h=Math.abs(dx)>=Math.abs(dy),r=pointer.t.r+(h?0:dy>0?1:-1),c=pointer.t.c+(h?(dx>0?1:-1):0);
  const other=board[r]?.[c],a=pointer.t;
  boardItemPreview(a.special&&other?.special?boardItemArea(a,other):a.special&&other?boardItemArea(a,{...a,r,c}):other?.special&&!a.special?boardItemArea(other,{...other,r:a.r,c:a.c}):null);
});
for(const ev of ['pointerup','pointercancel'])$('board').addEventListener(ev,()=>boardItemPreview(selected?.special?boardItemArea(selected):null));
$('board').addEventListener('pointerover',e=>{
  if(locked||!selected?.special)return;const t=tileFromElement(e.target);
  if(t&&t!==selected&&t.special&&adjacent(selected,t))boardItemPreview(boardItemArea(selected,t));
});

// ----- The foe: frozen crust (the ice build-up and the guard are status tiles, combat-status.js) -----
let boardItemFrozen=false;
function boardItemFoe(){
  const foe=actor('enemy');if(!foe||!ART.boardItems)return;
  // Frozen: ice crust over the feet, a cold tint; released: the crust shatters.
  const frozen=!!state.frozen;
  if(frozen!==boardItemFrozen){boardItemFrozen=frozen;
    if(frozen){foe.querySelectorAll(':scope>.bi-crust').forEach(c=>c.remove());foe.classList.add('bi-frozen');
      // Two crusts: the wide one over the feet, a narrower one higher on the body, so the ice reaches the waist.
      for(const cls of ['bi-crust','bi-crust up']){const crust=document.createElement('img');crust.className=cls;crust.src=BOARD_ITEM('ice-crust');crust.alt='';foe.append(crust);
        if(!reduced)crust.animate([{opacity:0,scale:'1 .2'},{opacity:1,scale:'1 1.08',offset:.6},{scale:'1 1'}],{duration:340,delay:cls==='bi-crust'?0:90,easing:'ease-out',fill:'backwards'});}
      popActorSkill('enemy','ĐÓNG BĂNG · MẤT LƯỢT',false);}
    else{foe.classList.remove('bi-frozen');foe.querySelectorAll(':scope>.bi-crust').forEach((c,i)=>boardItemShatter(foe,c,i===0));}
  }
}
function boardItemShatter(foe,crust,shards=true){
  if(reduced){crust.remove();return;}
  // Shards are the drawn icicle (crisp edges), a few big and some small, thrown clear of the body.
  const shard=BOARD_ITEM('ice-pip');
  if(shard&&shards)for(let i=0;i<10;i++){const s=document.createElement('img');s.className='bi-shard'+(i%3===0?' big':'');s.src=shard;s.alt='';foe.append(s);
    const a=Math.PI*(1.02+i/9*.96),d=(i%3===0?150:100)+Math.random()*70;
    s.animate([{opacity:1,translate:'0 0',rotate:'0deg'},{opacity:1,offset:.55},{opacity:0,translate:`${Math.cos(a)*d}px ${Math.sin(a)*d}px`,rotate:`${(i%2?1:-1)*(90+i*20)}deg`}],{duration:520+i*20,easing:'cubic-bezier(.2,.6,.4,1)'}).finished.then(()=>s.remove(),()=>s.remove());}
  crust.animate([{opacity:1},{opacity:0,scale:'1.06 .5'}],{duration:150,easing:'ease-in'}).finished.then(()=>crust.remove(),()=>crust.remove());
}
const boardItemUpdate=update;
update=function(){boardItemUpdate();boardItemFoe();};

// ----- Rage: purple comets to the gauge, a burst for a combo bonus -----
let boardItemComets=0,boardItemLastComet=0;
function boardItemComet(from,side){
  if(reduced||!BOARD_ITEM('rage-comet')||!from)return;const now=performance.now();
  if(boardItemComets>=5||now-boardItemLastComet<60)return;boardItemLastComet=now;
  const gauge=$(side+'Rage');if(!gauge)return;const a=from.getBoundingClientRect(),b=gauge.getBoundingClientRect();if(!a.width||!b.width)return;
  // It lands on the gauge's icon end and is gone by then, so it never sits over a number.
  const x0=a.left+a.width/2,y0=a.top+a.height/2,x1=b.left+Math.min(14,b.width*.1),y1=b.top+b.height/2,dx=x1-x0,dy=y1-y0;
  const c=document.createElement('img');c.className='bi-comet';c.src=BOARD_ITEM('rage-comet');c.alt='';c.style.left=x0+'px';c.style.top=y0+'px';document.body.append(c);boardItemComets++;
  const angle=Math.atan2(dy,dx)*180/Math.PI+180,bend=Math.sign(dx||1)*-60;
  c.animate([{translate:'0 0',rotate:angle+'deg',opacity:0,scale:.6},{opacity:1,offset:.15},{translate:`${dx*.5+bend}px ${dy*.5}px`,rotate:angle+'deg',scale:1,offset:.55},{translate:`${dx}px ${dy}px`,rotate:angle+'deg',opacity:0,scale:.5}],
    {duration:520,easing:'cubic-bezier(.4,0,.6,1)'}).finished.then(()=>{c.remove();boardItemComets--;gauge.closest('.actor-hud')?.animate([{filter:'brightness(1.7) drop-shadow(0 0 6px #c58cff)'},{filter:'none'}],{duration:260});},()=>{c.remove();boardItemComets--;});
}
const boardItemLive=createLiveCombat;
createLiveCombat=function(...args){
  const combat=boardItemLive(...args),collect=combat.collect;
  combat.collect=function(tile,side,chain){const key=side==='hero'?'energy':'enemyEnergy',before=state[key];const out=collect.call(this,tile,side,chain);
    if(tile?.type===2&&state[key]>before)boardItemComet(tile.el,side);return out;};
  return combat;
};
function boardItemBurst(side,text){
  if(reduced||!BOARD_ITEM('rage-burst'))return;const gauge=$(side+'Rage');if(!gauge)return;const b=gauge.getBoundingClientRect();if(!b.width)return;
  // Just above the fighter's gauges (the open sky over the HUD), never over the HP or rage numbers or the other side's HUD.
  const hud=gauge.closest('.actor-hud')?.getBoundingClientRect()||b;
  // Kept inside the battle scene and below its top bar (the Về button), whatever the layout.
  // With no room above the HUD (short landscape stages) it shows just below it instead.
  const scene=$('scene')?.getBoundingClientRect(),top=!scene||hud.top-26>=scene.top+40?hud.top-26:hud.bottom+30;
  const n=document.createElement('div');n.className='bi-burst';n.style.left=(Math.max(hud.left,(scene?.left||0)+8)+30)+'px';n.style.top=top+'px';
  n.innerHTML=`<img src="${BOARD_ITEM('rage-burst')}" alt=""><b>Combo ${text}</b>`;document.body.append(n);
  n.animate([{opacity:0,scale:.3,rotate:'-30deg'},{opacity:1,scale:1.15,rotate:'0deg',offset:.3},{opacity:1,scale:1,offset:.7},{opacity:0,scale:.8,translate:'0 -14px'}],{duration:900,easing:'ease-out'}).finished.then(()=>n.remove(),()=>n.remove());
}
const boardItemPop2=popActorSkill;
popActorSkill=function(side,text,...rest){
  const m=/^COMBO ×\d+ · \+(\d+) NỘ$/.exec(text||'');if(m)boardItemBurst(side,'+'+m[1]);
  return boardItemPop2(side,text,...rest);
};
// QA: the capture scripts fire comets and a combo burst directly.
setTimeout(()=>{if(window.gameQA)Object.assign(window.gameQA,{boardItemComet,boardItemBurst,boardItemState(o){Object.assign(state,o);update();}});},0);
