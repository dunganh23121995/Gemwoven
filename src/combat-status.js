// Status icons over each fighter (owner 04/11: "không cần hiện tên … thay bằng các biểu tượng băng, ×2, suy kiệt, thiêu đốt,
// choáng … các hiệu ứng buff, bất lợi"; Codex critique and mockup in assets/gemwoven/raw/combat-status/). The name plate
// above the HP bar becomes one row of drawn tiles: losing a turn first, then the other harms, then the boons, in a fixed
// order; at most five tiles (four and "+N" when more). Turns left in the top right corner, stacks as ×N bottom left, a
// damage factor under the glyph; an effect that lasts the whole fight has no number. A tap (or hover, or focus) opens a
// small parchment note: name, what it does, turns left. Names stay for screen readers only.
// In PvP fights each side's account name sits on a small plaque in its top corner of the stage (owner: "sau PvP thì tên
// tài khoản hiển thị góc trên màn combat, không đè lên các hiệu ứng"); PvE fights show no names.
const STATUS_ART='assets/combat-status/';
const pct=v=>Math.round((v||0)*100)+'%';
// kind: control (loses a turn) → debuff → buff; order inside a kind is the order of this table.
const STATUS_DEFS={
  freeze:{kind:'control',name:'Đóng băng',desc:()=>'Mất lượt tới'},
  stun:{kind:'control',name:'Choáng',desc:()=>'Mất lượt'},
  paralyze:{kind:'control',name:'Tê liệt',desc:s=>'Mất lượt, mỗi lượt địch mất máu và −'+Math.round(s.value||0)+' năng lượng'},
  burn:{kind:'debuff',name:'Thiêu đốt',desc:()=>'Mất máu mỗi lượt'},
  poison:{kind:'debuff',name:'Độc',desc:()=>'Mất máu mỗi lượt'},
  curse:{kind:'debuff',name:'Nguyền rủa',desc:()=>'Mất máu mỗi lượt, mạnh dần theo tầng'},
  thundermark:{kind:'debuff',name:'Ấn sấm',desc:s=>'Nổ khi hết lượt: −'+pct(s.value)+' máu tối đa'},
  seal:{kind:'debuff',name:'Phong ấn',desc:()=>'Không dùng được tuyệt kỹ'},
  weaken:{kind:'debuff',name:'Suy yếu',desc:s=>'Giảm '+pct(s.value)+' sát thương gây ra'},
  armorbreak:{kind:'debuff',name:'Vỡ giáp',desc:s=>'Nhận thêm '+pct(s.value)+' sát thương'},
  confuse:{kind:'debuff',name:'Hỗn loạn',desc:s=>'Đánh trúng thì tự chịu '+pct(s.value)+' sát thương đó'},
  blind:{kind:'debuff',name:'Mù',desc:s=>pct(s.value)+' cơ hội đánh trượt'},
  noheal:{kind:'debuff',name:'Cấm hồi',desc:()=>'Không hồi được máu'},
  armormelt:{kind:'debuff',name:'Giáp tan chảy',desc:()=>'Không nhận thêm giáp'},
  frostrune:{kind:'debuff',name:'Hàn ấn',desc:s=>'Nạp năng lượng chậm hơn '+pct(s.value)},
  transform:{kind:'buff',name:'Biến Thân',desc:s=>'Công +'+pct(s.value)+', giảm 15% sát thương nhận, miễn choáng'},
  afterglow:{kind:'buff',name:'Dư âm Biến Thân',desc:s=>'Công +'+pct(s.value)},
  veil:{kind:'buff',name:'Hóa mờ',desc:()=>'Chặn mọi bất lợi mới từ lượt địch'},
  regen:{kind:'buff',name:'Hồi phục',desc:()=>'Hồi máu mỗi lượt'},
  advantage:{kind:'buff',name:'Khắc hệ',desc:()=>'Gây thêm 50% sát thương'},
  rage:{kind:'buff',name:'Cuồng nộ',desc:()=>'Sát thương +25%'},
  stealth:{kind:'buff',name:'Tàng hình',desc:()=>'Né mọi đòn đánh'},
  invulnerable:{kind:'buff',name:'Miễn thương',desc:()=>'Không nhận sát thương'},
  undying:{kind:'buff',name:'Bất tử',desc:()=>'Không thể gục'},
  reflect:{kind:'buff',name:'Gai phản',desc:s=>'Trả lại '+pct(s.value)+' sát thương nhận'},
  frenzy:{kind:'buff',name:'Cuồng huyết',desc:s=>'Hồi '+pct(s.value)+' sát thương gây ra'},
  'foe-regen':{kind:'buff',icon:'regen',name:'Tái sinh',desc:s=>'Hồi '+pct(s.value)+' máu tối đa mỗi lượt'}
};
const STATUS_ORDER=Object.keys(STATUS_DEFS);
const FOE_TO_ICON={dot:'burn',curse:'curse',mark:'thundermark',weaken:'weaken',vulnerable:'armorbreak',silence:'seal',confuse:'confuse',blind:'blind',
  antiheal:'noheal',armorlock:'armormelt',chill:'frostrune',paralyze:'paralyze',stealth:'stealth',invulnerable:'invulnerable',undying:'undying',
  reflect:'reflect',regen:'foe-regen',frenzy:'frenzy'};
let statusStunned=false;
if(typeof applyFoeStatus==='function'){const original=applyFoeStatus;applyFoeStatus=function(s,...rest){if(s?.id==='stun')statusStunned=true;return original.call(this,s,...rest);};}
function combatStatusList(side){
  const out=[],add=(id,o={})=>{if(STATUS_DEFS[id])out.push({id,...o});};
  const foes=typeof foeStatuses==='object'&&foeStatuses?foeStatuses:{};
  const dot=side==='hero'?(typeof progressionEnemyDot!=='undefined'?progressionEnemyDot:null):(typeof progressionDot!=='undefined'?progressionDot:null);
  if(side==='hero'){
    if(!state.playerFrozen)statusStunned=false;
    if(state.playerFrozen&&!(foes.paralyze?.turns>0))add(statusStunned?'stun':'freeze',{turns:1});
    if(dot?.turns>0)add(dot.name==='Độc'?'poison':'burn',{turns:dot.turns});
    const veil=typeof progressionVeil!=='undefined'?progressionVeil:0;if(veil>0)add('veil',{turns:veil});
    const tf=typeof progressionTransform!=='undefined'?progressionTransform:null,kit=tf&&typeof progressionTransformKit==='function'?progressionTransformKit():null;
    if(tf&&kit)add(tf.left>0?'transform':'afterglow',tf.left>0?{turns:tf.left,value:kit.attack}:{value:kit.after});
    if(state.key==='earth'&&state.noriRegenTurns>0)add('regen',{turns:state.noriRegenTurns});
  }else{
    if(state.frozen)add('freeze',{turns:1});
    if(state.stunned)add('stun',{turns:state.noriStunTurns>0?state.noriStunTurns:1});
    if(dot?.turns>0)add('burn',{turns:dot.turns});
    if(state.enraged)add('rage',{mult:'×1,25'});
  }
  for(const [id,s] of Object.entries(foes)){
    const def=typeof FOE_STATUS==='object'&&FOE_STATUS[id];if(!def||!(s?.turns>0)||(def.side==='self')!==(side==='enemy'))continue;
    const icon=FOE_TO_ICON[id];if(!icon||out.some(o=>o.id===icon))continue;
    add(icon,{turns:s.turns,value:s.value,stacks:id==='curse'&&s.stage>0?s.stage:0});
  }
  const me=side==='hero'?state.key:state.enemyKey,them=side==='hero'?state.enemyKey:state.key;
  if(ELEMENTS[me]?.beats&&ELEMENTS[me].beats===them)add('advantage',{mult:'×1,5'});
  return out.sort((a,b)=>STATUS_ORDER.indexOf(a.id)-STATUS_ORDER.indexOf(b.id)||0).map(o=>{const def=STATUS_DEFS[o.id];
    return {...o,kind:def.kind,icon:def.icon||o.id,name:def.name,desc:def.desc(o),left:o.turns>0?'Còn '+o.turns+' lượt':'Đến hết trận'};});
}
function statusTile(s){
  const frame=s.kind==='buff'?'frame-buff':'frame-debuff';
  return `<button type="button" class="cs-tile is-${s.kind==='buff'?'buff':'debuff'}" data-status="${s.id}" aria-label="${s.name}: ${s.desc}. ${s.left}">`+
    `<img class="cs-frame" src="${STATUS_ART}${frame}.webp" alt=""><img class="cs-glyph" src="${STATUS_ART}${s.icon}.webp" alt="">`+
    (s.turns>0?`<b class="cs-turns">${s.turns}</b>`:'')+(s.stacks>0?`<b class="cs-stacks">×${s.stacks}</b>`:'')+(s.mult?`<b class="cs-mult">${s.mult}</b>`:'')+`</button>`;
}
const statusShown={hero:[],enemy:[]};
function renderCombatStatuses(){
  for(const side of ['hero','enemy']){
    const row=$(side+'Statuses');if(!row)continue;
    const list=combatStatusList(side),cap=5,shown=list.length>cap?list.slice(0,cap-1):list,more=list.length-shown.length;
    statusShown[side]=list;
    const html=shown.map(statusTile).join('')+(more>0?`<button type="button" class="cs-tile cs-more" data-status="+" aria-label="Thêm ${more} hiệu ứng"><img class="cs-frame" src="${STATUS_ART}frame-more.webp" alt=""><b>+${more}</b></button>`:'');
    // Older renderers (boss pills, Nori's seal count) still add chips here; the drawn tiles replace them all.
    if(row.dataset.cs!==html||[...row.children].some(n=>!n.classList.contains('cs-tile'))){row.innerHTML=html;row.dataset.cs=html;}
    row.classList.add('cs-row');
    // No element emblem on the spark gauge (owner 04/11: the energy icon on its left is enough); element advantage stays a tile.
    row.closest('.actor-hud')?.querySelector('.head-rage-track>.cs-elem')?.remove();
    // A fighter standing near the frame would push its gauges or its row out of the stage: slide them back inside
    // (gauges 8 px from the frame's inner edge, the row 6 px).
    const box=$('scene')?.getBoundingClientRect(),k=box?box.width/($('scene').offsetWidth||box.width):1,hud=row.closest('.actor-hud');
    const inside=(r,pad)=>!box||!r.width?0:r.left<box.left+pad*k?box.left+pad*k-r.left:r.right>box.right-pad*k?box.right-pad*k-r.right:0;
    if(hud){hud.style.marginLeft='';const bars=[...hud.querySelectorAll('.health-track,.head-rage-track,.shield-label')].map(n=>n.getBoundingClientRect()).filter(r=>r.width);
      if(bars.length){const r={left:Math.min(...bars.map(b=>b.left)),right:Math.max(...bars.map(b=>b.right)),width:1};const dx=inside(r,8);if(dx)hud.style.marginLeft=(dx/k)+'px';}}
    row.style.translate='';const dx=inside(row.getBoundingClientRect(),6);if(dx)row.style.translate=(dx/k)+'px 0';
  }
  renderPvpNames();
  if(statusTip&&!document.body.contains(statusTip.anchor))closeStatusTip();
}
// The parchment note: one effect, or the whole list from "+N"; it opens above the row when there is room.
let statusTip=null;
function pointTip(el,dir,at){el.dataset.point=dir;el.style.setProperty('--at',Math.round(at)+'px');}
function closeStatusTip(){statusTip?.anchor?.classList.remove('is-open');statusTip?.el.remove();statusTip=null;}
function openStatusTip(tile){
  closeStatusTip();const side=tile.closest('#heroStatuses')?'hero':'enemy',id=tile.dataset.status,list=statusShown[side]||[];
  const items=id==='+'?list:list.filter(s=>s.id===id);if(!items.length)return;
  const el=document.createElement('div');el.className='cs-tip'+(id==='+'?' is-list':'');el.setAttribute('role','tooltip');
  el.innerHTML=items.map(s=>`<p><img src="${STATUS_ART}${s.icon}.webp" alt=""><span><i><b>${s.name}</b><em>${s.left}</em></i><small>${s.desc}</small></span></p>`).join('');
  // On the page itself (fixed), so no scaled or clipped stage can move or cut it. It takes the first free spot inside the
  // stage (above the row, under the name plaques, in a corner, under the gauges) that covers the least of the gauges,
  // names and fighters; the chosen tile lights up.
  document.body.append(el);statusTip={el,anchor:tile};
  const scene=$('scene').getBoundingClientRect(),r=tile.getBoundingClientRect();
  // Room beside the stage, with the board below it (landscape phones): the note sits in that margin, level with the row.
  const board=document.querySelector('.puzzle-card')?.getBoundingClientRect(),stacked=!board||board.top>=scene.bottom-2;
  const margin=stacked?Math.max(scene.left,innerWidth-scene.right)-12:0;
  if(margin>=150){el.style.width=Math.min(220,margin)+'px';const left=scene.left>=innerWidth-scene.right;
    const top=Math.max(4,Math.min(innerHeight-el.offsetHeight-4,r.top));el.style.left=(left?scene.left-6-el.offsetWidth:scene.right+6)+'px';el.style.top=top+'px';
    pointTip(el,left?'right':'left',r.top+r.height/2-top);tile.classList.add('is-open');return;}
  const hud=(tile.closest('.actor-hud')||tile).getBoundingClientRect(),plates=[...document.querySelectorAll('.cs-pvp')].map(n=>n.getBoundingClientRect());
  const below=Math.max(scene.top+4,...plates.filter(b=>b.top<scene.top+60).map(b=>b.bottom+4));
  // A spot that covers a gauge or a status row (with a 4 px margin) loses to any that does not; then a name plaque costs
  // more than a fighter. Each spot is
  // tried at three widths (the CSS width, 92% and 84%), since a narrower, taller note sometimes fits between the rows.
  const blocks=[['.cs-tile,.health-track,.head-rage-track,.health-label,.shield-label',1000,4],['.cs-pvp',2,2],['.chud-back,.chud-gear',3,2],['#heroActor,#enemyActor',1,0]]
    .flatMap(([q,weight,m])=>[...document.querySelectorAll(q)].map(n=>[n.getBoundingClientRect(),weight,m])).filter(([b])=>b.width&&b.height);
  let best=null,bestCost=Infinity,w=0,h=0;
  const base=el.offsetWidth;
  for(const width of [base,Math.round(base*.92),Math.round(base*.84)]){
    el.style.width=width+'px';const W=el.offsetWidth,H=el.offsetHeight;
    const cost=(x,y)=>{if(x<scene.left+2||x+W>scene.right-2||y<4||y+H>innerHeight-4)return 1e9;
      return blocks.reduce((n,[b,weight,m])=>n+weight*Math.max(0,Math.min(x+W,b.right+m)-Math.max(x,b.left-m))*Math.max(0,Math.min(y+H,b.bottom+m)-Math.max(y,b.top-m)),0);};
    const spots=[[r.left+r.width/2-W/2,r.top-H-8],[scene.left+6,below],[scene.right-W-6,below],[scene.left+6,hud.bottom+6],[scene.right-W-6,hud.bottom+6],[r.left+r.width/2-W/2,hud.bottom+6]];
    for(const [sx,sy] of spots){const x=Math.max(scene.left+4,Math.min(scene.right-W-4,sx)),c=cost(x,sy)+(base-width)*2;if(c<bestCost){best=[x,sy,width];bestCost=c;w=W;h=H;}}
  }
  el.style.width=best[2]+'px';el.style.left=best[0]+'px';el.style.top=best[1]+'px';tile.classList.add('is-open');
  // A small parchment point toward the chosen tile when the note sits right above or below it.
  const cx=r.left+r.width/2-best[0];if(cx>14&&cx<w-14){if(best[1]+h<=r.top)pointTip(el,'down',cx);else if(best[1]>=r.bottom)pointTip(el,'up',cx);}
}
// A tap focuses the tile first (focusin opens the note), then clicks it: that click must not close the note again.
let statusFocusOpen=0;
document.addEventListener('click',e=>{const tile=e.target.closest?.('.cs-tile');if(tile){e.stopPropagation();if(statusTip?.anchor===tile&&performance.now()-statusFocusOpen>400)closeStatusTip();else if(statusTip?.anchor!==tile)openStatusTip(tile);return;}if(statusTip&&!e.target.closest?.('.cs-tip'))closeStatusTip();},true);
document.addEventListener('mouseover',e=>{const tile=e.target.closest?.('.cs-tile');if(tile&&matchMedia('(hover:hover)').matches&&statusTip?.anchor!==tile)openStatusTip(tile);});
document.addEventListener('mouseout',e=>{const tile=e.target.closest?.('.cs-tile');if(tile&&statusTip?.anchor===tile&&!tile.contains(e.relatedTarget)&&matchMedia('(hover:hover)').matches)closeStatusTip();});
document.addEventListener('focusin',e=>{const tile=e.target.closest?.('.cs-tile');if(tile&&statusTip?.anchor!==tile){openStatusTip(tile);statusFocusOpen=performance.now();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStatusTip();});
// PvP plaques: the local duel names its two players; a friendly match and the cup show this account and the other
// player's (or the AI copy's) display name. Long names end in "…"; a tap shows the whole name.
let statusPvpOverride=null;
function pvpNames(){
  if(statusPvpOverride)return statusPvpOverride;
  const b=typeof progressionBattle!=='undefined'?progressionBattle:null;if(!b||!['duel','spar','cup'].includes(b.mode))return null;
  let me='Bạn';try{me=JSON.parse(localStorage.getItem('gemwoven.social.v1')||'{}').name||me;}catch{}
  if(b.mode==='duel')return {hero:'Người chơi 1',enemy:'Người chơi 2',mode:'Cùng máy'};
  return {hero:me,enemy:(b.mode==='cup'?b.cup?.opponent?.name:b.opponent?.name)||b.enemyName||'Đối thủ',mode:'AI'};
}
// When the stage is too short for a plaque above the fighters' rows (landscape phones), both plaques move into the top
// bar, where a PvP fight needs neither the stage tag nor the journey score.
function renderPvpNames(){
  const names=pvpNames(),scene=$('scene'),bar=document.querySelector('.chud-bar');if(!scene)return;
  document.documentElement.classList.toggle('cs-pvp-on',!!names);
  const plates=[];
  for(const side of ['hero','enemy']){
    let plate=document.querySelector('.cs-pvp.'+side);
    if(!names){plate?.remove();continue;}
    if(!plate){plate=document.createElement('button');plate.type='button';plate.className='cs-pvp '+side;plate.innerHTML='<span></span>';plate.addEventListener('click',()=>plate.classList.toggle('is-full'));scene.append(plate);}
    const n=names[side];if(plate.dataset.name!==n){plate.dataset.name=n;plate.querySelector('span').textContent=n;plate.title=n;plate.setAttribute('aria-label',(side==='hero'?'Bên bạn: ':'Đối thủ: ')+n);}
    plates.push(plate);
  }
  const tag=document.querySelector('.chud-stage');if(tag){if(names?.mode)tag.dataset.mode=names.mode;else delete tag.dataset.mode;}
  if(!plates.length){document.documentElement.classList.remove('cs-pvp-bar');return;}
  const box=scene.getBoundingClientRect(),k=box.width/(scene.offsetWidth||box.width),tops=[...document.querySelectorAll('.cs-row')].map(r=>r.getBoundingClientRect().top).filter(t=>t>0);
  // Phones on their side always carry the names in the top bar (one place for every short stage).
  const room=tops.length?Math.min(...tops)-box.top:Infinity,short=matchMedia('(orientation:landscape) and (max-height:600px) and (min-aspect-ratio:3/2)').matches,inBar=!!bar&&(short||room<(10+24+12)*k);
  document.documentElement.classList.toggle('cs-pvp-bar',inBar);
  for(const plate of plates){const home=inBar?bar:scene;if(plate.parentNode!==home)home.append(plate);}
}
// Wrapped once every combat script has loaded, so the tiles are drawn after every other renderer; the boss pills only
// keep the auras on the boss's body.
if(typeof renderFoeStatuses==='function')renderFoeStatuses=function(){if(typeof syncFoeSelfStates==='function')syncFoeSelfStates();};
queueMicrotask(()=>{const statusUpdate=update;update=function(){statusUpdate();renderCombatStatuses();};update();});
// Turning the phone moves the stage's edges: slide the gauges, rows and name plates in again for the new size.
addEventListener('resize',()=>requestAnimationFrame(()=>{try{renderCombatStatuses();}catch{}}));
// Studio / QA: put effects on either side, and preview the PvP plaques.
queueMicrotask(()=>{if(!window.gameQA)return;Object.assign(window.gameQA,{
  statusQA(sides={}){
    for(const [side,map] of Object.entries(sides))for(const [id,turns] of Object.entries(map)){
      const foe=Object.entries(FOE_TO_ICON).find(([,icon])=>icon===id)?.[0]||id;
      if(id==='burn'&&side==='enemy'){progressionDot={turns,amount:10};continue;}
      if(id==='burn'||id==='poison'){if(side==='hero')progressionEnemyDot={name:id==='poison'?'Độc':'Thiêu đốt',turns,raw:10};continue;}
      if(id==='veil'){progressionVeil=turns;continue;}if(id==='stun'){if(side==='hero'){state.playerFrozen=true;statusStunned=true;}else state.stunned=true;continue;}
      if(id==='regen'&&side==='hero'){state.noriRegenTurns=turns;continue;}
      if(typeof FOE_STATUS==='object'&&FOE_STATUS[foe])foeStatuses[foe]={turns,value:.3,raw:10,stage:id==='curse'?2:0};
    }
    update();return {hero:combatStatusList('hero'),enemy:combatStatusList('enemy')};
  },
  pvpNames(names){statusPvpOverride=names||null;update();},
  get statuses(){return {hero:combatStatusList('hero'),enemy:combatStatusList('enemy')};}
});});
