(() => {
'use strict';
const $ = id => document.getElementById(id);
const SIZE = 8;
const KEYS = ['fire','earth','ice','lightning'];
const ELEMENTS = {
  fire:{label:'Lửa',color:'#c98673',light:'#f7e6db',beats:'ice',icon:'flame'},
  earth:{label:'Đất',color:'#829a6d',light:'#e9efdd',beats:'lightning',icon:'leaf'},
  ice:{label:'Băng',color:'#7aacc0',light:'#e2f1f3',beats:'earth',icon:'snow'},
  lightning:{label:'Sét',color:'#a48ac4',light:'#eee4f5',beats:'fire',icon:'bolt'},
  shadow:{label:'Bóng tối',color:'#8abcc6',light:'#263344',beats:null,icon:'moon'},
  novice:{label:'Thường',color:'#b6a081',light:'#f1e6ce',beats:null,icon:'sword'}
};
const HEROES = {
  novice:{name:'Hiro',title:'Lữ Khách Tập Sự',hp:145,skill:'Kiếm Nhiệt Huyết',desc:'Một nhát kiếm gỗ · 70 sát thương cơ bản',trait:'Tướng khởi đầu · kiếm lữ khách gây thêm 20% sát thương',color:'#b59b78',dark:'#735b43',hair:'#6e4935'},
  fire:{name:'Mika',title:'Viêm Kiếm Sĩ',hp:170,skill:'Viêm Long Trảm',desc:'Tụ lửa kéo dài kiếm · phóng kiếm khí phát nổ · 135 sát thương cơ bản',trait:'Kiếm gây thêm 60% sát thương',color:'#df9d82',dark:'#a66b64',hair:'#8f5c55'},
  earth:{name:'Nori',title:'Thiết Giáp Vệ',hp:320,skill:'Mộc Linh Hộ Thể',desc:'Choáng 2 lượt · tích sát thương rồi nổ ×3 · hồi 40 HP/lượt ×3',trait:'Sát thương đánh thường giảm 25% (chỉ còn 75% sát thương gốc) · Đại khiên tích lực',color:'#a1b28b',dark:'#708567',hair:'#777363'},
  ice:{name:'Yuki',title:'Băng Tâm Vệ',hp:200,skill:'Thiên Băng Giáng',desc:'+25 giáp · triệu hồi băng gây 60 sát thương · choáng 1 lượt',trait:'Khiên +8 giáp · giảm 20% sát thương',color:'#9cc6d0',dark:'#7399b2',hair:'#adbbd9'},
  lightning:{name:'Lumi',title:'Lôi Cuồng Sư',hp:200,skill:'Ngũ Tinh Lôi',desc:'5 tia sét · tổng 140 sát thương',trait:'Tích năng lượng nhanh gấp đôi',color:'#b8a0d5',dark:'#8973ae',hair:'#d9bb8d'},
  shadow:{name:'Noct',title:'Ảnh Kiếm Sĩ',hp:190,skill:'Ngũ Ảnh Trảm',desc:'5 lượt lướt chém · tổng 150 sát thương',trait:'Lướt chém tốc độ · không chịu khắc hệ',color:'#7d9da9',dark:'#131722',hair:'#141820'}
};
const MONSTERS = {
  fire:{name:'Hỏa Long',boss:'Vua Hỏa Long',attack:'Hỏa tức',skill:'Viêm Long Tức',support:'Vảy hồng',heal:'Hạt lửa hồi sinh'},
  earth:{name:'Thạch Vệ',boss:'Cổ Thụ Đá',attack:'Trọng quyền',skill:'Địa Mạch Bộc Phát',support:'Áo giáp rêu',heal:'Nhựa sống'},
  ice:{name:'Cú Tuyết',boss:'Nữ Hoàng Tuyết',attack:'Lông vũ băng',skill:'Bão Tuyết Mộng Mơ',support:'Kén băng',heal:'Sương mai'},
  lightning:{name:'Lôi Thú',boss:'Chúa Tể Giông',attack:'Lôi kích',skill:'Cuồng Lôi',support:'Màn chắn điện',heal:'Nạp năng lượng'}
};
const TYPES = [
  {name:'Kiếm',icon:'sword',color:'#ba827b',light:'#f7dad0',bg:'#eec2b9',edge:'#d5a29e',effect:'Tấn công'},
  {name:'Tim',icon:'heart',color:'#c486a0',light:'#f5dce8',bg:'#eac5d8',edge:'#d3a6bf',effect:'Hồi máu'},
  {name:'Tinh thể',icon:'crystal',color:'#aa8bc4',light:'#e9dcf7',bg:'#d7c2eb',edge:'#bfa7d8',effect:'Năng lượng'},
  {name:'Băng',icon:'snow',color:'#7ea9c1',light:'#dcf0f6',bg:'#bdddea',edge:'#a2c5d8',effect:'Đóng băng'},
  {name:'Khiên',icon:'shield',color:'#b39b6e',light:'#f5ebcd',bg:'#e9dab0',edge:'#cebd94',effect:'Tăng giáp'}
];
const paths = {
  sword:'<path d="M22 5 27 5 27 10 14 23 9 18Z" fill="currentColor" opacity=".35"/><path d="m10 20 14-14 4-1-1 4-14 14M7 17l8 8M7 24l-3 4M5 22l5 5"/>',
  heart:'<path d="M16 27S3 19 3 11c0-8 10-9 13-2 3-7 13-6 13 2 0 8-13 16-13 16Z" fill="currentColor" stroke="none"/><path d="M8 10q2-3 5-1" stroke="#fff" opacity=".7"/>',
  crystal:'<path d="m16 3 10 10-3 12-7 5-7-5-3-12Z" fill="currentColor" opacity=".35"/><path d="m16 3 10 10-3 12-7 5-7-5-3-12Z M6 13h20M16 3l-4 10 4 17 4-17Z"/><path d="m9 11 6-6" stroke="#fff" opacity=".8"/>',
  snow:'<path d="M16 3v26M5 9l22 14M5 23 27 9M12 6l4 4 4-4M12 26l4-4 4 4M5 14l6-1-1-6M22 25l-1-6 6-1M5 18l6 1-1 6M22 7l-1 6 6 1"/>',
  shield:'<path d="M16 3 27 7v10c0 6-11 12-11 12S5 23 5 17V7Z" fill="currentColor" opacity=".27"/><path d="M16 3 27 7v10c0 6-11 12-11 12S5 23 5 17V7Z"/><path d="M16 9v13M11 15h10" stroke="#fffaf0" stroke-width="3"/>',
  flame:'<path d="M17 2c1 8 11 10 11 19 0 12-24 12-24 0 0-6 4-10 7-12 0 6 3 7 3 7s5-5 3-14Z" fill="currentColor" stroke="none"/><path d="M16 17c0 4 5 5 5 9 0 5-10 5-10 0 0-4 4-6 5-9Z" fill="#fff7db"/>',
  leaf:'<path d="M26 4C10 2 2 10 6 21s23 6 20-17Z" fill="currentColor" opacity=".25"/><path d="M26 4C10 2 2 10 6 21s23 6 20-17ZM5 28 22 9M11 21v-8M16 16h8"/>',
  bolt:'<path d="M18 2 5 19h10l-2 11L28 12H17Z" fill="currentColor" stroke="none"/><path d="m17 8-6 8h7" stroke="#fff" opacity=".6"/>',
  spark:'<path d="m16 2 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="currentColor" opacity=".6"/><path d="m26 1 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor" stroke="none"/>',
  bomb:'<circle cx="15" cy="20" r="10" fill="currentColor" opacity=".4"/><circle cx="15" cy="20" r="10"/><path d="M15 10V6h5l2-3M23 7l4 1M25 3l2-2M9 17l2-2"/>',
  crown:'<path d="m3 8 7 6 6-10 6 10 7-6-4 18H7Z" fill="currentColor" opacity=".3"/><path d="m3 8 7 6 6-10 6 10 7-6-4 18H7ZM8 22h16"/>',
  bulb:'<path d="M11 23h10M12 27h8M14 30h4M10 20C1 10 7 3 16 3s15 7 6 17l-1 3H11Z M16 16v7M12 13l4 3 4-3"/>',
  mouse:'<rect x="8" y="2" width="16" height="28" rx="8"/><path d="M16 3v9"/>',
  help:'<circle cx="16" cy="16" r="13"/><path d="M12 11c0-5 10-5 8 1-1 3-4 2-4 6M16 23v.1"/>',
  sound:'<path d="m14 6-7 6H3v8h4l7 6ZM20 11q6 5 0 10M24 6q11 10 0 20"/>',
  mute:'<path d="m14 6-7 6H3v8h4l7 6ZM21 12l8 8M29 12l-8 8"/>',
  moon:'<path d="M25 22A13 13 0 0 1 10 3 13 13 0 1 0 29 21Z" fill="currentColor" opacity=".3"/><path d="M25 22A13 13 0 0 1 10 3 13 13 0 1 0 29 21Z"/>',
  rainbow:'<path d="M3 25a13 13 0 0 1 26 0" stroke="#d496a3" stroke-width="5"/><path d="M8 25a8 8 0 0 1 16 0" stroke="#c5b48a" stroke-width="4"/><path d="M12 25a4 4 0 0 1 8 0" stroke="#92afc7" stroke-width="3"/>'
};
function icon(name,color='currentColor'){return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:${color}">${paths[name]||paths.spark}</svg>`;}
// The art, actors, board tiles and effects below are drawn by the extension layers (sprite-runtime.js, board-sequence.js,
// special-fx.js, combat-v3.js), which set these; the first versions that lived here were never used after them.
let heroArt,monsterArt,landscapeArt,renderActors,paintTile,moveTile,boardBurst,specialEffect,clearPlan,buff;

// Every new session starts at the fast full-effects pace. NO FX is opt-in.
let reduced=false;
let sound=true,audioContext=null,board=[],nextId=0,selected=null,locked=true,ended=false,turn='player',chosen='fire',newRun=true,pointer=null,suppressClickUntil=0,toastAnimation=null,plannedIntent=null;
let state={stage:1,score:0,key:'fire',hp:170,armor:0,energy:0,enemyKey:'earth',enemyHp:350,enemyMax:350,enemyArmor:0,enemyEnergy:0,boss:false,frozen:false,stunned:false,playerFrozen:false,enemyTurn:0,enraged:false};
const activeAnimations=new Set();
const rand=n=>Math.floor(Math.random()*n);
const mult=(a,b)=>ELEMENTS[a].beats===b?1.5:1;
const wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(ms/6,10):ms));
// Sound bytes behind an ART src: a linked file (Game.html serves its art beside it) or, in an
// embedded build, a data URI.
async function artBytes(src){
  if(src.startsWith('data:')){const binary=atob(src.split(',')[1]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
  const response=await fetch(src);if(!response.ok)throw Error('Missing sound '+src);return response.arrayBuffer();
}
function animate(el,frames,options={}){
  if(!el||!el.isConnected)return Promise.resolve();
  // Avoid a display-frame wait for each reduced-motion Web Animation. A short
  // tiny beat preserves action order in NO FX mode without display-frame waits.
  if(reduced)return new Promise(resolve=>setTimeout(resolve,4/1.5));
  const a=el.animate(frames,{duration:300,easing:'cubic-bezier(.22,.7,.3,1)',...options});
  activeAnimations.add(a);
  return a.finished.catch(()=>{}).finally(()=>{activeAnimations.delete(a);a.cancel();});
}
function sfx(kind){
  if(!sound)return;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const sequence={swap:[392,494],match:[523,659,784],hit:[196,147],buff:[659,784,1047],special:[523,659,784,1047],win:[523,659,784,1047,1319],fail:[294,247]}[kind]||[523];
    sequence.forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),at=audioContext.currentTime+i*.065;osc.type='sine';osc.frequency.setValueAtTime(f,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.19);osc.connect(gain);gain.connect(audioOutput(audioContext,'effects'));osc.start(at);osc.stop(at+.2);});
  }catch{sound=false;updateSettings();}
}
function message(text,log=true){$('message').textContent=text;if(log){const li=document.createElement('li');li.textContent=text;$('logEntries').prepend(li);while($('logEntries').children.length>30)$('logEntries').lastChild.remove();$('logCount').textContent=$('logEntries').children.length+' sự kiện';}}
function updateSettings(){document.body.classList.toggle('reduced-motion',reduced);const motion=$('motionBtn');motion.setAttribute('aria-pressed',String(reduced));motion.setAttribute('aria-label','NO FX');motion.title='NO FX: '+(reduced?'đang bật · bấm để bật lại hiệu ứng':'đang tắt · bấm để tắt hiệu ứng');motion.dataset.mode=reduced?'reduced':'full';motion.innerHTML=icon('spark')+'<span class="motion-status" aria-hidden="true">NO FX</span>';$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').setAttribute('aria-label',sound?'Tắt âm thanh':'Bật âm thanh');$('soundBtn').innerHTML=icon(sound?'sound':'mute');}
function toast(text){if(toastAnimation)toastAnimation.cancel();if(reduced)return;const el=$('boardToast');el.textContent=text;toastAnimation=el.animate([{opacity:0,transform:'translate(-50%,-35%) scale(.9)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.2},{opacity:1,offset:.65},{opacity:0,transform:'translate(-50%,-70%) scale(1)'}],{duration:175,easing:'ease-out'});toastAnimation.finished.catch(()=>{});}
function updateTurn(){const el=$('turnChip');el.className='turn-chip'+(turn==='enemy'?' enemy':locked?' busy':'');el.innerHTML='<i></i>'+(ended?'Kết thúc':turn==='frozen'?'Đóng băng · mất lượt':turn==='enemy'?'Lượt quái':locked?'Combo':'Lượt bạn');$('boardFrame').classList.toggle('enemy-turn',turn==='enemy'&&!ended);$('board').setAttribute('aria-busy',String(locked));$('hintBtn').disabled=locked||ended;}
function update(){
  const h=HEROES[state.key],m=MONSTERS[state.enemyKey];
  $('heroName').textContent=h.name;$('enemyName').textContent=state.boss?m.boss:m.name;
  for(const [prefix,key] of [['hero',state.key],['enemy',state.enemyKey]]){const e=ELEMENTS[key];$(prefix+'Element').innerHTML=icon(e.icon)+e.label;$(prefix+'Element').style.setProperty('--element',e.color);}
  $('heroHpText').textContent=Math.max(0,Math.round(state.hp))+' / '+h.hp;$('enemyHpText').textContent=Math.max(0,Math.round(state.enemyHp))+' / '+state.enemyMax;
  const hp=Math.max(0,state.hp/h.hp*100)+'%',ehp=Math.max(0,state.enemyHp/state.enemyMax*100)+'%';
  $('heroHp').style.width=hp;$('heroHpTrail').style.width=hp;$('enemyHp').style.width=ehp;$('enemyHpTrail').style.width=ehp;
  for(const [side,armor,rage]of [['hero',state.armor,state.energy],['enemy',state.enemyArmor,state.enemyEnergy]]){
    $(side+'Armor').innerHTML=icon('shield')+Math.round(armor);$(side+'Armor').hidden=armor<=0;
    $(side+'RageFill').style.width=rage+'%';$(side+'Rage').setAttribute('aria-valuenow',Math.round(rage));
  }
  $('heroStatuses').innerHTML=state.playerFrozen?'<span class="status-pill" title="Đóng băng">'+icon('snow')+'</span>':'';
  $('enemyStatuses').innerHTML=(state.frozen||state.stunned?'<span class="status-pill" title="'+(state.stunned?'Choáng':'Đóng băng')+'">'+icon(state.stunned?'spark':'snow')+'</span>':'')+(state.enraged?'<span class="status-pill enraged" title="Cuồng nộ">'+icon('flame')+'</span>':'');
  $('score').textContent=state.score.toLocaleString('vi-VN');$('stageLabel').textContent=(state.boss?'BOSS':'MÀN')+' '+String(state.stage).padStart(2,'0');$('footerStage').textContent='Màn '+state.stage;
  $('tipTitle').textContent=ELEMENTS[state.key].beats===state.enemyKey?'Bạn đang có lợi thế nguyên tố!':'Nhỏ bé. Nhưng đầy phép màu.';$('tipText').textContent=ELEMENTS[state.key].beats===state.enemyKey?ELEMENTS[state.key].label+' khắc '+ELEMENTS[state.enemyKey].label+' · Đòn đánh của '+h.name+' gây thêm 50% sát thương.':'Ghép 4 thẳng tạo Sao băng, chữ L/T tạo Bom, 5 thẳng tạo Lõi. Ghép Băng giúp bạn chặn lượt tiếp theo của quái.';
  $('journeyTrack').innerHTML=Array.from({length:5},(_,i)=>{const step=i+1,current=(state.stage-1)%5+1;return (i?'<span class="journey-line"></span>':'')+'<span class="journey-step '+(step===current?'active':step<current?'done':'')+'" '+(step===current?'aria-current="step"':'')+' aria-label="Màn '+(Math.floor((state.stage-1)/5)*5+step)+'">'+(step===5?icon('crown'):step<current?'✓':step)+'</span>';}).join('');
  updateTurn();
}

function all(){return board.flat().filter(Boolean);}
function tileType(t){return t&&t.special!=='core'?t.type:null;}
function newTile(type,r,c,special=null){return {id:++nextId,type,r,c,special,el:null};}
function tileLabel(t){return (t.special==='core'?'Lõi':TYPES[t.type].name+(t.special==='bolt'?' · Sao băng '+(t.dir==='col'?'dọc':'ngang'):t.special==='bomb'?' · Bom':''))+', hàng '+(t.r+1)+', cột '+(t.c+1);}
function place(t){t.el.style.left=t.c*12.5+'%';t.el.style.top=t.r*12.5+'%';t.el.setAttribute('aria-label',tileLabel(t));t.el.setAttribute('aria-rowindex',t.r+1);t.el.setAttribute('aria-colindex',t.c+1);}
function createTile(t){t.el=document.createElement('button');t.el.type='button';t.el.dataset.id=t.id;t.el.setAttribute('role','gridcell');t.el.tabIndex=-1;paintTile(t);place(t);$('board').append(t.el);}
function matches(){
  const groups=[],set=new Set();
  for(let axis=0;axis<2;axis++)for(let i=0;i<SIZE;i++)for(let j=0;j<SIZE;){
    const group=[],first=axis?board[j][i]:board[i][j],type=tileType(first);let end=j;
    while(end<SIZE&&type!==null&&tileType(axis?board[end][i]:board[i][end])===type){group.push(axis?board[end][i]:board[i][end]);end++;}
    if(group.length>=3){groups.push(group);group.forEach(t=>set.add(t));}j=Math.max(j+1,end);
  }
  return {groups,tiles:[...set]};
}
function matchClusters(m){
  const clusters=[];
  for(const group of m.groups){let combined=new Set(group);for(let i=clusters.length-1;i>=0;i--){if([...combined].some(t=>clusters[i].has(t))){clusters[i].forEach(t=>combined.add(t));clusters.splice(i,1);}}clusters.push(combined);}
  return clusters;
}
function adjacent(a,b){return a&&b&&Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;}
function swapData(a,b){const r=a.r,c=a.c;board[a.r][a.c]=b;board[b.r][b.c]=a;a.r=b.r;a.c=b.c;b.r=r;b.c=c;}
function legalMoves(includeCore=true){
  const result=[];
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)for(const [dr,dc] of [[0,1],[1,0]]){
    if(r+dr>=SIZE||c+dc>=SIZE)continue;
    const a=board[r][c],b=board[r+dr][c+dc];if(!a||!b)continue;
    if(a.special==='core'||b.special==='core'||a.special&&b.special){if(includeCore)result.push({a,b,score:100});continue;}
    swapData(a,b);const m=matches();if(m.tiles.length){const counts=[0,0,0,0,0];m.tiles.forEach(t=>counts[t.type]++);const score=counts[0]*8+counts[1]*(state.enemyHp<state.enemyMax*.6?5:0)+counts[4]*2+counts[2]*2;result.push({a,b,score});}swapData(a,b);
  }
  return result;
}
function seedBoard(){
  clearSelection();$('board').replaceChildren();$('boardEffects').replaceChildren();
  do{
    board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      let type;do{type=rand(5);}while(c>=2&&tileType(board[r][c-1])===type&&tileType(board[r][c-2])===type||r>=2&&tileType(board[r-1][c])===type&&tileType(board[r-2][c])===type);
      board[r][c]=newTile(type,r,c);
    }
  }while(!legalMoves().length);
  all().forEach(createTile);board[0][0].el.tabIndex=0;
}
function clearSelection(){if(selected?.el){selected.el.classList.remove('selected');selected.el.setAttribute('aria-selected','false');}selected=null;}
function selectTile(t){clearSelection();selected=t;t.el.classList.add('selected');t.el.setAttribute('aria-selected','true');}
function focusTile(t){all().forEach(x=>x.el.tabIndex=x===t?0:-1);t.el.focus({preventScroll:true});}
async function swapAnimated(a,b){const ar=a.r,ac=a.c,br=b.r,bc=b.c;swapData(a,b);sfx('swap');await Promise.all([moveTile(a,ar,ac),moveTile(b,br,bc)]);}
// Special gems follow one shared rule set (src/board-specials.js; owner 05/11, Claude + Codex): a straight 4 makes a
// Sao băng sweeping its band (row or column, 3 lanes), a straight 5+ or a 6+ cluster a Lõi, an L/T a Bom (5×5). The hero makes specials in
// PvE, both sides in PvP; specials a blast reaches fire once each, in generations (gen) the board plays together.
function makePlan(m,preferred,owner,core=null,coreType=null){
  const targets=new Set(m?m.tiles:[]),creates=[],playerTiles=new Set();
  if((owner==='hero'||specialDuel())&&m){
    const groups=m.groups.map(g=>g.map(tilePos)),swapped=(Array.isArray(preferred)?preferred:[preferred]).filter(Boolean).map(tilePos);
    for(const cl of matchClusters(m)){
      const cluster=[...cl].map(tilePos),shape=specialRules.shape(cluster,groups);if(!shape.kind)continue;
      const p=specialRules.createAt(cluster,swapped,q=>!tileAt(q).special);if(p==null)continue;
      creates.push({tile:tileAt(p),kind:shape.kind,dir:shape.dir});targets.delete(tileAt(p));
    }
  }
  const created=new Set(creates.map(x=>x.tile)),start=[];
  const typeAt=p=>tileAt(p)?.type??-1,isSpecial=p=>{const t=tileAt(p);return t?.special&&!created.has(t)?{kind:t.special,dir:t.dir}:null;};
  if(core){targets.add(core);start.push({p:tilePos(core),kind:'core',color:coreType??specialRules.mostCommon(typeAt)});}
  const run=specialRules.chain(start,[...targets].map(tilePos),typeAt,isSpecial);
  for(const p of run.cleared){const t=tileAt(p);if(t&&!created.has(t))targets.add(t);}
  const acts=specialActs(run.fired,created);
  // PvE keeps today's gift: gems a special clears on the foe's move are the hero's. In PvP the mover takes everything.
  if(!specialDuel())for(const a of acts)for(const t of a.hits)playerTiles.add(t);
  return {targets:[...targets],creates,acts,playerTiles};
}
// Two specials swapped together always fire, centred where the dragged gem landed (combo table in board-specials.js).
function makeComboPlan(a,b,owner){
  const typeAt=p=>tileAt(p)?.type??-1,kindAt=p=>tileAt(p)?.special||null;
  const spec=x=>({p:tilePos(x),kind:x.special,dir:x.dir,type:x.type});
  const c=specialRules.combo(spec(a),spec(b),tilePos(a),typeAt,kindAt);
  if(c.full)return makeCoreFusionPlan(a,1);
  const turned=c.turn.map(tileAt);
  // The turned gems fire as the partner kind; every other special the combo reaches fires once on its own.
  const start=c.turn.map(p=>({p,kind:c.kind,dir:c.dir}));
  const isSpecial=p=>{const t=tileAt(p);if(t===a||t===b)return null;return t?.special?{kind:t.special,dir:t.dir}:null;};
  const run=specialRules.chain(start,c.clear.filter(p=>!c.turn.includes(p)),typeAt,isSpecial);
  for(const p of c.clear)run.cleared.add(p);
  const targets=[...run.cleared].map(tileAt).filter(Boolean);
  const head={tile:a,partner:b,kind:'combo',name:c.name,gen:0,hits:c.clear.map(tileAt).filter(Boolean),turn:turned.length?{tiles:turned,kind:c.kind,dir:c.dir}:null};
  const acts=[head,...specialActs(run.fired,new Set()).map(x=>({...x,gen:x.gen+1}))];
  const playerTiles=new Set();if(!specialDuel()&&owner==='enemy')targets.forEach(t=>playerTiles.add(t));
  return {targets,creates:[],acts,playerTiles,combo:c.name};
}
const specialRules=globalThis.GemwovenSpecials;
const tileAt=p=>board[Math.floor(p/SIZE)]?.[p%SIZE]||null,tilePos=t=>t.r*SIZE+t.c;
function specialDuel(){return typeof progressionIsDuel==='function'&&progressionIsDuel();}
function specialActs(fired,created){
  // The chain's fired specials as board acts; gen lets the board play one ring of a chain together.
  return fired.map(f=>({tile:tileAt(f.p),kind:f.kind,dir:f.dir,color:f.color,gen:f.gen||0,hits:f.hits.map(tileAt).filter(t=>t&&!created.has(t))}));
}
// Two Lõi clear the whole board once for every special on it, the two Lõi included (owner 05/11: "nổ board số lần bằng
// item đặc biệt có trên board"; the single clear read no stronger than a Sao on a Lõi). Counted before the first blast.
function coreFusionCount(a,b){
  return a.special==='core'&&b.special==='core'?all().filter(t=>t.special).length:0;
}
function makeCoreFusionPlan(origin,total,wave=1,origins=null){
  const targets=all(),tile=board[origin.r][origin.c];
  // Where each wave starts: the swapped Lõi, the other Lõi, then every other special on the board (nearest first), so
  // the N waves come from the N specials instead of one spot (owner 05/11).
  if(!origins){const rest=all().filter(t=>t.special&&t!==tile).sort((a,b)=>(b.special==='core')-(a.special==='core')||Math.hypot(a.r-tile.r,a.c-tile.c)-Math.hypot(b.r-tile.r,b.c-tile.c));
    origins=[{r:tile.r,c:tile.c},...rest.map(t=>({r:t.r,c:t.c}))];}
  // The pair consumes every special together. Count once, before the first
  // blast; refills and subsequent matches cannot extend this finite sequence.
  return {targets,creates:[],acts:[{tile,kind:'core',hits:targets,fullBoard:true,wave,total}],
    playerTiles:new Set(targets),fusion:{total,wave,r:origin.r,c:origin.c,origins}};
}
function svgNode(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);$('boardEffects').append(e);return e;}
async function gravity(){
  const tasks=[];
  for(let c=0;c<SIZE;c++){
    const survivors=[];for(let r=SIZE-1;r>=0;r--)if(board[r][c])survivors.push(board[r][c]);
    for(let r=0;r<SIZE;r++)board[r][c]=null;
    let dest=SIZE-1;
    for(const t of survivors){const old=t.r;t.r=dest;board[dest--][c]=t;tasks.push(moveTile(t,old,c,c*3.5/1.5,'fall'));}
    const missing=dest+1;
    for(let r=dest;r>=0;r--){const t=newTile(rand(5),r,c);board[r][c]=t;createTile(t);tasks.push(moveTile(t,r-missing,c,c*3.5/1.5,'fall'));}
  }
  await Promise.all(tasks);
}
async function ensurePlayable(){
  if(legalMoves().length)return;
  message('Khu rừng đổi gió — bàn ngọc được xáo lại miễn phí.');toast('Một làn gió mới…');
  const tiles=all(),origins=new Map(tiles.map(t=>[t,{r:t.r,c:t.c}]));
  let attempts=0;
  do{
    for(let i=tiles.length-1;i>0;i--){const j=rand(i+1);[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}
    tiles.forEach((t,i)=>{t.r=Math.floor(i/SIZE);t.c=i%SIZE;board[t.r][t.c]=t;});attempts++;
  }while((matches().tiles.length||!legalMoves().length)&&attempts<200);
  if(attempts===200){seedBoard();return;}
  await Promise.all(tiles.map(t=>moveTile(t,origins.get(t).r,origins.get(t).c)));
}
function actor(side){return $(side==='hero'?'heroActor':'enemyActor');}
// Status texts (burns, curses, misses, interrupts) share the combat popup column and its readable hold.
async function floating(side,text,kind=''){await combatPopup(side,text,{kind:'status',tone:kind==='good'?'good':kind==='armor'?'ward':'',beat:690}).ready;}
async function combatParticles(side,key,count=8){if(reduced)return;const rect=$('scene').getBoundingClientRect(),x=rect.width*(side==='hero'?.24:.76),y=rect.height*.48;await Promise.all(Array.from({length:count},(_,i)=>{const e=document.createElement('i');e.className='combat-particle';e.style.left=x+'px';e.style.top=y+'px';e.style.setProperty('--element',ELEMENTS[key].color);e.innerHTML=icon(i%3?'spark':ELEMENTS[key].icon);$('combatEffects').append(e);const angle=i*Math.PI*2/count;return animate(e,[{opacity:1,transform:'translate(0,0) scale(.6)'},{opacity:0,transform:`translate(${Math.cos(angle)*65}px,${Math.sin(angle)*50}px) scale(1)`}],{duration:520}).finally(()=>e.remove());}));}
function damage(side,raw,ledger=null){
  const target=side==='hero'?'enemy':'hero',attackerKey=side==='hero'?state.key:state.enemyKey,defenderKey=side==='hero'?state.enemyKey:state.key;
  if(side==='hero')raw*=progressionKit(state.key).attackScale;
  if(ledger)ledger.raw+=raw;
  let n=Math.round((ledger?ledger.raw:raw)*mult(attackerKey,defenderKey)*(side==='enemy'&&state.enraged?1.25:1));if(target==='hero'&&progressionKit(state.key).damageReduction)n=Math.round(n*(1-progressionKit(state.key).damageReduction));
  if(ledger){const total=n;n-=ledger.applied;ledger.applied=total;}
  // Nori's seal: his hit still lands, and a share of it also builds the burst (owner 05/11; board-rules NORI_SEAL_STORE).
  if(side==='hero'&&state.key==='earth'&&state.noriStunTurns>0&&state.enemyHp>0&&state.hp>0){
    const share=GemwovenBoardRules.NORI_SEAL_STORE[typeof progressionIsDuel==='function'&&progressionIsDuel()?'duel':'pve'],stored=Math.round(n*share);
    state.noriStoredDamage=(state.noriStoredDamage||0)+stored;
    return {...applyCombatDamage(target,n),stored};
  }
  return applyCombatDamage(target,n);
}
function applyCombatDamage(target,n){
  const armorKey=target==='hero'?'armor':'enemyArmor',hpKey=target==='hero'?'hp':'enemyHp',blocked=Math.min(state[armorKey],n),previousHp=state[hpKey];state[armorKey]-=blocked;state[hpKey]=Math.max(0,state[hpKey]-(n-blocked));update();
  if(target==='enemy'&&state.boss&&previousHp>0&&state.enemyHp===0)combatVoice('enemy','death');
  // Shown numbers are what the bar lost: overkill is clipped to the HP that remained.
  return {amount:previousHp-state[hpKey],blocked};
}
// Armour scales with the bearer: 999 early, then half of a hero's max HP or 8% of
// an enemy's (large boss pools would otherwise turn guard skills into walls).
function combatArmorCap(side){return Math.max(999,Math.round(side==='hero'?HEROES[state.key].hp*.5:state.enemyMax*.08));}
async function attack(side,raw,{ultimate=false,hits=1}={}){
  const source=actor(side),target=actor(side==='hero'?'enemy':'hero'),key=side==='hero'?state.key:state.enemyKey,direction=side==='hero'?1:-1,targetSide=side==='hero'?'enemy':'hero';
  source.dataset.state=ultimate?'cast':'attack';
  if(ultimate){
    const halo=document.createElement('span');halo.className='buff-ring';halo.style.left=side==='hero'?'24%':'76%';halo.style.top='45%';halo.style.margin='-47px';halo.style.color=ELEMENTS[key].color;$('combatEffects').append(halo);
    await Promise.all([animate(halo,[{opacity:0,transform:'scale(1.5)'},{opacity:.75,transform:'scale(.65)',offset:.75},{opacity:0,transform:'scale(.4)'}],{duration:380}),combatParticles(side,key,10)]);halo.remove();
  }
  await animate(source,[{transform:'translateX(0)'},{transform:`translateX(${-direction*9}px) rotate(${-direction*4}deg)`},{transform:`translateX(${direction*(key==='fire'||key==='earth'?25:7)}px) rotate(${direction*3}deg)`}],{duration:250});
  let total=0,blocked=0;
  for(let i=0;i<hits;i++){
    const e=document.createElement('span');e.className='projectile';e.style.setProperty('--element',ELEMENTS[key].color);e.innerHTML=icon(ELEMENTS[key].icon);$('combatEffects').append(e);
    const w=$('scene').clientWidth,h=$('scene').clientHeight,start=w*(side==='hero'?.29:.71),finish=w*(side==='hero'?.73:.23);
    e.style.left=(key==='lightning'?finish:start)-17+'px';e.style.top=(key==='lightning'?5:h*.42)+'px';
    await Promise.all([animate(e,key==='lightning'?[{transform:'translateY(-15px) scale(.8)',opacity:.5},{transform:`translateY(${h*.42}px) scale(1.5)`,opacity:1}]:[{transform:'translateX(0) scale(.7)',opacity:.6},{transform:`translateX(${finish-start}px) scale(${ultimate?1.6:1.1})`,opacity:1}],{duration:key==='lightning'?150:230}),animate(source.querySelector('.rig-right-arm'),[{transform:'rotate(-30deg)'},{transform:'rotate(55deg)',offset:.55},{transform:'rotate(0deg)'}],{duration:230})]);e.remove();
    const result=damage(side,raw/hits);total+=result.amount;blocked+=result.blocked;sfx('hit');target.dataset.state='hurt';
    await Promise.all([animate(target,[{transform:'translateX(0)'},{transform:`translateX(${direction*10}px) rotate(${direction*5}deg)`,offset:.3},{transform:'translateX(0)'}],{duration:240}),floating(targetSide,result.amount?'-'+result.amount:'Chặn '+result.blocked,result.amount?'':'armor'),combatParticles(targetSide,key,ultimate?12:6)]);
  }
  source.dataset.state='idle';target.dataset.state='idle';return {amount:total,blocked};
}
async function resolveBoard(owner,initial=null,preferred=null){
  let m=matches(),plan=initial,chain=0;const combat=createLiveCombat();
  beginBoardCombo(owner);
  try{
  while(plan||m.tiles.length){
    chain++;plan ||= makePlan(m,chain===1?preferred:null,owner);
    combat.beginWave(chain,plan,owner);
    const wavePlan=plan;
    await clearPlan(plan,chain,t=>combat.collect(t,owner==='hero'||wavePlan.playerTiles.has(t)?'hero':'enemy',chain));
    const fusion=wavePlan.fusion;
    if(fusion&&fusion.wave<fusion.total){plan=makeCoreFusionPlan(fusion.origins?.[fusion.wave]||fusion,fusion.total,fusion.wave+1,fusion.origins);}
    else{m=matches();plan=null;}
  }
  await Promise.all([finishBoardCombo(),combat.finish()]);
  $('comboLabel').textContent=chain?'Combo ×'+chain:'Ghép 3 để tung phép';
  }finally{await combat.cancel();resetBoardCombo();}
}

function intent(){
  const m=MONSTERS[state.enemyKey];
  if(state.frozen||state.stunned)return {kind:'skip',name:state.stunned?'Đang bị choáng':'Đang bị đóng băng',icon:'snow',detail:'Bỏ qua lượt kế'};
  if(state.boss){if(state.enemyEnergy>=80)return {kind:'skill',name:m.skill,icon:ELEMENTS[state.enemyKey].icon,detail:'Ghép ngọc, đủ nộ sẽ tung chiêu'};return {kind:'board',name:'Kết nối ngọc phép',icon:'crystal',detail:'Boss tự chọn một nước ghép'};}
  const cycle=state.enemyTurn%4;
  if(cycle===1)return {kind:'guard',name:m.support,icon:'shield',detail:'+'+(10+state.stage*3)+' giáp'};
  if(cycle===2||state.enemyEnergy>=100)return {kind:'skill',name:m.skill,icon:ELEMENTS[state.enemyKey].icon,detail:state.enemyKey==='ice'?'Gây đóng băng 1 lượt':state.enemyKey==='lightning'?'Đánh 3 lần · hút 15 năng lượng':state.enemyKey==='earth'?'Đánh mạnh · tăng giáp':'3 ngọn lửa liên tiếp'};
  if(cycle===3&&state.enemyHp<state.enemyMax*.65)return {kind:'heal',name:m.heal,icon:'heart',detail:'Hồi '+(18+state.stage*5)+' HP'};
  return {kind:'board',name:'Kết nối ngọc phép',icon:'crystal',detail:'Ghép ngọc để tấn công và tích nộ'};
}
async function enemySkill({reserved=false}={}){
  // A chapter boss or elite staged by the studio (gameQA.configure with qaFoeFx) fights with its own kit, as in the
  // campaign: at full rage it casts its ultimate, never the stand-in foe's old rage (the fire dragon's Viêm Long Tức).
  const kit=state.qaFoeFx&&window.gameQA?.foeSkills?.()||[];
  if(kit.length){if(!reserved)state.enemyEnergy=0;const ult=kit.findIndex(s=>s.ult);return window.gameQA.foeCast(ult>=0?ult:0);}
  const key=state.enemyKey,m=MONSTERS[key],base=state.boss?60+state.stage*5:14+state.stage*4;
  if(!reserved)state.enemyEnergy=0;message((state.boss?'Boss':'Quái')+' tung '+m.skill+'!');update();
  await rageChoreography('enemy',base*(key==='earth'?1.1:key==='ice'?.75:1),{
    hits:key==='fire'?3:key==='lightning'?(state.boss?5:3):1,onRelease(pending){
      if(key==='earth'){state.enemyArmor=Math.min(combatArmorCap('enemy'),state.enemyArmor+(state.boss?35:12+state.stage*2));pending.push(combatLootReceive('enemy',4));}
      if(key==='ice'&&state.hp>0){state.playerFrozen=true;state.playerLock='freeze';message('Băng tuyết bao phủ! Bạn sẽ mất 1 lượt hành động.');popActorSkill('hero','Đóng băng',false,pending);}
      if(key==='lightning'){state.energy=Math.max(0,state.energy-15);message('Dòng điện cuốn đi 15 năng lượng của bạn.');}
    }
  });
  update();
}
async function enemyAction(){
  if(state.enemyHp<=0||state.hp<=0)return;
  turn='enemy';update();
  await castReadyUltimates();if(state.enemyHp<=0||state.hp<=0)return;
  await battleBeat(650);
  if(noriSealHolds()){await consumeNoriStunTurn();return;}
  if(state.frozen||state.stunned){message(state.stunned?'Quái bị choáng, bỏ qua lượt này.':'Quái bị đóng băng, bỏ qua lượt này.');await floating('enemy',state.stunned?'Choáng':'Đóng băng','armor');state.frozen=false;state.stunned=false;update();return;}
  const it=plannedIntent||intent();
  if(!state.boss&&it.kind==='board')message(MONSTERS[state.enemyKey].name+' dùng '+it.name+'.');
  if(state.boss&&!state.enraged&&state.enemyHp<=state.enemyMax*.4){state.enraged=true;message('Boss thức tỉnh! Sát thương tăng 25%.');await buff('enemy','armor',20+state.stage*2);}
  const played=await opponentBoardTurn();
  if(!played)await attack('enemy',(progressionBattle?10:10+5*(state.stage-1))*(state.boss?1.3:1));
  if(state.enemyHp>0&&state.hp>0){
    await castReadyUltimates();
    if(!state.boss&&state.hp>0&&state.enemyHp>0&&!noriSealHolds()){
      state.enemyTurn++;
      if(it.kind==='guard'||it.kind==='heal'){
        await battleBeat(450);
        if(it.kind==='guard'){message(MONSTERS[state.enemyKey].name+' dùng '+it.name+'.');await buff('enemy','armor',10+state.stage*3);}
        else{message(MONSTERS[state.enemyKey].name+' dùng '+it.name+'.');await buff('enemy','heal',18+state.stage*5);}
      }
    }
  }
  plannedIntent=intent();update();await battleBeat(380);
}
async function finishBattle(){
  if(state.hp>0&&state.enemyHp>0)return false;
  ended=true;const won=state.hp>0;const defeated=actor(won?'enemy':'hero');defeated.dataset.state='hurt';if(won)await foeFall();await animate(defeated,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(15px) scale(.85)'}],{duration:500,fill:'forwards'});defeated.style.opacity='0';actor(won?'hero':'enemy').dataset.state='victory';
  if(won)await departVictoriousHero();
  sfx(won?'win':'fail');$('resultArt').innerHTML=won?heroArt(state.key):monsterArt(state.enemyKey,state.boss);$('resultEyebrow').textContent=won?'MỘT CHIẾN THẮNG NHỎ':'NGHỈ MỘT CHÚT NHÉ';$('resultTitle').textContent=won?'Khu rừng mỉm cười!':'Ngày mai, lại lên đường.';
  $('resultDesc').textContent=won?'Đã vượt qua màn '+state.stage+'. Xem đối thủ tiếp theo rồi chọn người đồng hành. Máu, giáp và nộ được giữ lại.':'Bạn đã đi đến màn '+state.stage+'. Một hành trình mới luôn chờ bạn.';
  $('resultStage').textContent=String(state.stage).padStart(2,'0');$('resultScore').textContent=state.score.toLocaleString('vi-VN');$('nextBtn').innerHTML=(won?'Tiếp tục hành trình':'Bắt đầu hành trình mới')+' <span>→</span>';update();$('resultDialog').showModal();$('nextBtn').focus();return true;
}
async function perform(action){
  // Lock synchronously before any await: taps, swipes and skills share one transaction.
  if(locked||ended||$('selectDialog').open||$('helpDialog').open||$('audioSettingsDialog').open||$('resultDialog').open)return;
  locked=true;clearSelection();updateTurn();
  try{
    if(!state.playerFrozen){const consumed=await action();if(consumed&&typeof progressionRecordTurn==='function')progressionRecordTurn();await castReadyUltimates();if(consumed&&state.enemyHp>0&&state.hp>0)await enemyAction();}
    await castReadyUltimates();
    // Resolve disabled player turns before releasing input. Previously we showed
    // "Lượt bạn" while frozen, then silently consumed the user's next swap.
    // A fresh freeze from the following enemy action also resolves in this lock.
    while(state.playerFrozen&&state.hp>0&&state.enemyHp>0){
      turn='frozen';clearSelection();pointer=null;update();
      // Freeze, stun and paralysis each say what took the turn (owner 05/11: "phân biệt đóng băng với choáng").
      const lock={freeze:'Đóng băng',stun:'Choáng',paralyze:'Tê liệt'}[state.playerLock]||'Đóng băng';
      message(lock+': bạn mất 1 lượt. Đối thủ tiếp tục hành động.');
      await floating('hero',lock.toUpperCase()+' · MẤT LƯỢT','armor');
      await battleBeat(450);
      state.playerFrozen=false;state.playerLock=null;update();
      if(typeof progressionRecordTurn==='function')progressionRecordTurn();
      await enemyAction();await castReadyUltimates();
    }
    if(await finishBattle())return;
    await ensurePlayable();
  }catch(error){
    console.error('Battle transaction failed',error);seedBoard();message('Phép thuật bị gián đoạn. Bàn ngọc đã được khôi phục, bạn có thể tiếp tục.');
  }finally{turn='player';locked=ended;update();}
}
async function trySwap(a,b){
  if(!adjacent(a,b))return;
  return perform(async()=>{
    const core=a.special==='core'?a:b.special==='core'?b:null,other=core===a?b:a,fusionCount=coreFusionCount(a,b);
    await swapAnimated(a,b);
    if(fusionCount){await resolveBoard('hero',makeCoreFusionPlan(a,fusionCount));return true;}
    if(a.special&&b.special){await resolveBoard('hero',makeComboPlan(a,b,'hero'));return true;}
    if(core){await resolveBoard('hero',makePlan(null,null,'hero',core,other.type));return true;}
    if(!matches().tiles.length){await swapAnimated(a,b);sfx('fail');message('Chưa tạo được bộ ba. Thử một kết nối khác nhé.',false);return false;}
    await resolveBoard('hero',null,[a,b]);return true;
  });
}
// A tapped Lõi clears the colour most common on the board (owner 05/11; was a random colour).
function activateCore(t){return perform(async()=>{await resolveBoard('hero',makePlan(null,null,'hero',t,specialRules.mostCommon(p=>tileAt(p)?.type??-1)));return true;});}
function activateSkill(){
  if(state.energy<100)return;
  if(typeof foeSilenced==='function'&&foeSilenced()){message('Bị phong ấn: tuyệt kỹ chưa thể dùng.');return;}
  return perform(async()=>{
    state.energy-=100;update();await heroUltimate();
    return true;
  });
}
function tileFromElement(el){const button=el.closest?.('.tile');return button?all().find(t=>t.el===button):null;}
function onTileClick(t){
  if(!t||locked||ended)return;
  if(!selected&&t.special==='core'){activateCore(t);return;}
  if(selected===t){clearSelection();return;}
  if(selected&&adjacent(selected,t)){trySwap(selected,t);return;}
  selectTile(t);
}
$('board').addEventListener('click',e=>{if(performance.now()<suppressClickUntil)return;onTileClick(tileFromElement(e.target));});
$('board').addEventListener('pointerdown',e=>{
  if(locked||ended||e.button!==0||!e.isPrimary)return;
  const t=tileFromElement(e.target);if(!t)return;pointer={id:e.pointerId,t,x:e.clientX,y:e.clientY};$('board').setPointerCapture(e.pointerId);
});
$('board').addEventListener('pointerup',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const p=pointer;pointer=null;if($('board').hasPointerCapture(e.pointerId))$('board').releasePointerCapture(e.pointerId);
  if(locked||ended)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<15){suppressClickUntil=performance.now()+350;onTileClick(p.t);return;}
  suppressClickUntil=performance.now()+450;
  const horizontal=Math.abs(dx)>=Math.abs(dy),r=p.t.r+(horizontal?0:dy>0?1:-1),c=p.t.c+(horizontal?(dx>0?1:-1):0);
  if(r>=0&&r<SIZE&&c>=0&&c<SIZE)trySwap(p.t,board[r][c]);
});
$('board').addEventListener('pointercancel',()=>{pointer=null;});$('board').addEventListener('lostpointercapture',()=>{pointer=null;});
$('board').addEventListener('keydown',e=>{
  const t=tileFromElement(e.target);if(!t)return;
  const delta={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];
  if(delta){e.preventDefault();const r=Math.max(0,Math.min(7,t.r+delta[0])),c=Math.max(0,Math.min(7,t.c+delta[1]));focusTile(board[r][c]);}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();onTileClick(t);}
  if(e.key==='Escape')clearSelection();
});
$('hintBtn').addEventListener('click',async()=>{
  if(locked||ended)return;clearSelection();const moves=legalMoves();if(!moves.length)return;const move=moves[0];
  for(const t of [move.a,move.b])animate(t.el.firstElementChild,[{transform:'scale(1)'},{transform:'scale(.85)',outline:'2px solid #fff8e7',offset:.25},{transform:'scale(1)',offset:.5},{transform:'scale(.85)',outline:'2px solid #fff8e7',offset:.75},{transform:'scale(1)'}],{duration:900});
  message('Hai ngọc đang nhấp nháy có thể kết nối với nhau.',false);
});
$('motionBtn').addEventListener('click',()=>{reduced=!reduced;if(reduced)for(const a of activeAnimations)a.finish();updateSettings();});
$('soundBtn').addEventListener('click',()=>{sound=!sound;updateSettings();if(sound)sfx('buff');else audioContext?.suspend();});
$('helpBtn').addEventListener('click',()=>{$('helpDialog').showModal();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
for(const id of ['selectDialog','resultDialog'])$(id).addEventListener('cancel',e=>{e.preventDefault();if(id==='selectDialog'&&!$('heroDetail').hidden)showHeroList();});
$('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.querySelector('.brand').addEventListener('click',e=>e.preventDefault());
function showSelection(initial){
  newRun=initial;chosen=initial?'fire':state.key;
  chosen=progressionInitialHero(chosen);
  $('classGrid').innerHTML=progressionHeroKeys().map((key,i)=>{const h=HEROES[key];return `<button class="class-card gem-choice" data-class="${key}" aria-label="${h.name} · ${h.title}" title="${h.name}" aria-pressed="false" style="--gem-color:${ELEMENTS[key].color};--gem-light:${ELEMENTS[key].light};--glint-delay:${-i*.7}s"><span class="avatar-gem" aria-hidden="true"><span class="gem-portrait">${heroArt(key)}</span><span class="gem-facets"></span><span class="gem-gloss"></span></span><span class="gem-sparkles" aria-hidden="true"><i></i><i></i><i></i></span></button>`;}).join('');
  $('classGrid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{chosen=b.dataset.class;updateSelection();showHeroDetail();}));updateSelection();showHeroList(false);$('selectDialog').showModal();$('classGrid').querySelector(`[data-class="${chosen}"]`).focus();
}
function updateSelection(){
  $('classGrid').querySelectorAll('button').forEach(b=>{b.classList.toggle('chosen',b.dataset.class===chosen);b.setAttribute('aria-pressed',String(b.dataset.class===chosen));});
  $('startBtn').setAttribute('aria-label','Xuất chiến cùng '+HEROES[chosen].name);
}
function showHeroList(focus=true){
  $('heroDetail').hidden=true;$('heroList').hidden=false;
  $('selectDialog').classList.remove('showing-hero');
  $('selectTitle').textContent=newRun?'Chọn chiến binh của bạn.':'Một chặng đường mới.';
  $('selectIntro').textContent=progressionSelectionIntro(newRun?'Chọn người đồng hành cho trận đánh.':'Màn '+state.stage+' · Quái hệ '+ELEMENTS[state.enemyKey].label+' đang chờ.');
  $('heroSelectionScroll').scrollTop=0;
  if(focus)$('classGrid').querySelector(`[data-class="${chosen}"]`).focus({preventScroll:true});
}
function showHeroDetail(){
  const h=HEROES[chosen],element=ELEMENTS[chosen];
  const skillDetails={
    fire:'Đứng tại chỗ giơ cao kiếm chéo ra sau, vận sức khiến lưỡi kiếm dài dần và rực lửa. Bổ mạnh một nhát để phóng kiếm khí tới đối thủ; kiếm khí trúng đích phát nổ, gây 135 sát thương cơ bản.',
    earth:'Lao vào bằng đại khiên, gây choáng 2 lượt và không gây sát thương trực tiếp. Trong thời gian choáng, sát thương Nori gây ra được tích trữ; khi hết choáng, toàn bộ lượng tích trữ nổ với sức mạnh ×3. Hồi 40 HP vào đầu mỗi lượt của bạn trong 3 lượt tiếp theo.',
    ice:'Nhận 25 giáp, niệm phép bằng trượng rồi triệu hồi tảng băng lớn từ trên trời. Băng giáng xuống gây 60 sát thương cơ bản và choáng mục tiêu 1 lượt.',
    lightning:'Lơ lửng niệm phép, gọi mây giông và giáng liên tiếp 5 tia sét xuống đối thủ. Tổng sát thương cơ bản: 140.',
    shadow:'Chậm rãi áp sát rồi tăng tốc, để lại tàn ảnh qua 5 lần lướt chém phải–trái trước khi trở về. Tổng sát thương cơ bản: 150.'
  };
  $('selectTitle').textContent=h.name;$('selectIntro').textContent=h.title+' · '+element.label;
  $('heroList').hidden=true;$('heroDetail').hidden=false;
  $('selectDialog').classList.add('showing-hero');
  $('heroDetail').style.setProperty('--hero-tint',element.color);
  $('heroShowcase').dataset.hero=chosen;$('heroShowcase').innerHTML='<div class="hero-showcase-art">'+heroArt(chosen)+'</div>';
  const stats=[['Máu tối đa',h.hp+' HP'],['Sát thương / ngọc kiếm',chosen==='fire'?'12,8':chosen==='earth'?'4,8':'8'],['Giáp / ngọc khiên',chosen==='ice'?'+8':'+4'],['Hồi máu / ngọc tim','+6 HP']];
  $('heroDetailStats').innerHTML=stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  $('heroDetailTrait').textContent=h.trait+(chosen==='lightning'?' · Luôn lơ lửng khi còn sống.':'.');
  $('heroSkillName').textContent=h.skill;$('heroSkillDescription').textContent=skillDetails[chosen]||h.desc;
  $('heroStatNote').textContent='Sát thương cơ bản trước khắc hệ, liên hoàn và chí mạng; làm tròn khi gây sát thương.';
  $('heroCarryover').hidden=true;
  $('heroCarryover').textContent=newRun?'':'Xuất chiến với '+Math.min(state.hp,h.hp)+'/'+h.hp+' HP · '+state.armor+' giáp · '+state.energy+'/100 nộ. Chỉ số được giữ từ màn trước, máu giới hạn theo tướng.';
  $('selectTitle').focus({preventScroll:true});$('heroSelectionScroll').scrollTop=0;
}
$('heroBackBtn').addEventListener('click',()=>showHeroList());
function startStage(){
  state.noriStunTurns=0;state.noriStoredDamage=0;state.noriBurst=0;state.controlGuard=0;state.iceBar=0;state.playerIceBar=0;state.playerLock=null;state.tfDodge=false;state.noriSealFree=false;
  state.noriRegenTurns=0;clearNoriRenewal();
  stopCombatVoices();bossDeathVoicePlayed=false;
  resetBoardCombo();
  state.boss=state.stage%5===0;state.enemyMax=Math.round((350+180*(state.stage-1))*(state.boss?2.5:1));state.enemyHp=state.enemyMax;state.enemyArmor=0;state.enemyEnergy=0;state.frozen=false;state.stunned=false;state.playerFrozen=false;state.enemyTurn=0;state.enraged=false;
  ended=false;locked=false;turn='player';pointer=null;suppressClickUntil=0;plannedIntent=intent();$('heroActor').style.opacity='1';$('enemyActor').style.opacity='1';$('combatEffects').replaceChildren();seedBoard();renderActors();update();message(state.boss?'Người giữ rừng xuất hiện! Đọc ý định và chuẩn bị ngọc đặc biệt.':'Chào '+HEROES[state.key].name+'! Ghép ngọc, cùng nhau đánh thức khu rừng.');
}
// Every stage starts fresh (owner 04/11): full HP, no armour, no energy carried over.
$('startBtn').addEventListener('click',()=>{if(sound)sfx('buff');state.key=chosen;state.hp=HEROES[chosen].hp;state.armor=0;state.energy=0;$('selectDialog').close();startStage();$('hintBtn').focus({preventScroll:true});startReadyUltimates();});
$('nextBtn').addEventListener('click',async()=>{
  if(stageTransition)return;stageTransition=true;
  const won=state.hp>0;$('resultDialog').close();
  try{
    if(won){state.stage++;state.enemyKey=KEYS[rand(4)];}
    else{state={stage:1,score:0,key:'fire',hp:170,armor:0,energy:0,enemyKey:KEYS[rand(4)],enemyHp:350,enemyMax:350,enemyArmor:0,enemyEnergy:0,boss:false,frozen:false,stunned:false,playerFrozen:false,enemyTurn:0,enraged:false};$('logEntries').replaceChildren();$('logCount').textContent='0 sự kiện';}
    await previewNextEncounter(!won);
  }finally{stageTransition=false;}
});
// Resizing cancels visual interpolation only; model positions are already final.
let lastWidth=0;new ResizeObserver(entries=>{const w=entries[0].contentRect.width;if(lastWidth&&Math.abs(w-lastWidth)>2)for(const a of activeAnimations){if(a.effect?.target?.classList?.contains('tile'))a.finish();}lastWidth=w;}).observe($('board'));
/* GAME_EXTENSIONS */
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));$('helpBtn').innerHTML=icon('help');$('motionBtn').innerHTML=icon('spark');$('landscape').innerHTML=landscapeArt();
$('tileLegend').innerHTML=TYPES.map(t=>'<div class="legend-item"><span class="legend-icon">'+icon(t.icon,t.color)+'</span><span>'+t.name+'</span><small>'+t.effect+'</small></div>').join('');
$('helpLegend').innerHTML=TYPES.map((t,i)=>'<div>'+icon(t.icon,t.color)+'<span><b>'+t.name+'</b> · '+['8 sát thương mỗi ngọc, trước hệ số nhân vật và nguyên tố','Hồi 6 HP mỗi ngọc','Tích thêm năng lượng để dùng tuyệt kỹ','Ghép 3 để đóng băng quái trong 1 lượt','4 giáp mỗi ngọc; Yuki nhận 8'][i]+'</span></div>').join('');
updateSettings();state.enemyKey=KEYS[rand(4)];renderActors();update();seedBoard();showSelection(true);
if(typeof finishArtSetup==='function')finishArtSetup();
// Local QA bridge is opt-in and absent from normal game sessions.
if(new URLSearchParams(location.search).has('qa'))window.gameQA={
  beginBoardCombo,boardComboStart,finishBoardCombo,resetBoardCombo,
  warmCombatVoices,stopCombatVoices,restorationEffect,heroUltimate,enemySkill,rageChoreography,combatVoice,combatLootReceive,boardItemRecoil,specialStarNova,departVictoriousHero,damage,
  // Studio test: the whole stage mirrored, so the hero stands on the right facing left (texts read normally).
  // Positions inside the mirrored stage are read back unmirrored, so every move and effect lands as on the left.
  setHeroSide(side){
    document.documentElement.dataset.heroSide=side==='right'?'right':'left';
    if(!Element.prototype.qaRect){
      const rect=Element.prototype.qaRect=Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect=function(){
        const r=rect.call(this),scene=$('scene');
        if(document.documentElement.dataset.heroSide!=='right'||this===scene||!scene?.contains(this))return r;
        const s=rect.call(scene);return new DOMRect(s.left+s.right-r.right,r.top,r.width,r.height);
      };
    }
    renderActors();
  },
  warmNoctSounds,playNoctSound,stopNoctSounds,get noctSounds(){return [...noctSoundSources].map(({id,pan})=>({id,pan}));},
  playCastSound,stopCastSounds,get castSounds(){return [...castSoundSources].map(({id})=>id);},
  // Shows one drawn cell as is (a clip sheet's roles and clock skipped): the Studio's transition captures.
  showSpriteCell(side,action,index){const el=actor(side).querySelector('.sprite-body');if(!el)return;spritePlayback.set(el,{action,manual:true});el.dataset.loop='false';spriteApply(el,action,index);},
  spriteInfo(family,key,action){const {sheet,action:mapped}=spriteDefinition(family,key,action);return {action:mapped,count:sheet.count,heads:sheet.heads,span:sheet.span,footY:sheet.footY,scale:sheet.scale,bodyHeight:sheet.bodyHeight};},
  spriteAction(side,action,duration){setSpriteAction(side,action,duration);},
  get state(){return state;},get board(){return board;},get locked(){return locked;},get ended(){return ended;},matches,legalMoves,trySwap,activateSkill,activateCore,enemyAction,resolveBoard,ensurePlayable,makePlan,makeComboPlan,specialRules,attack,buff,setSpriteFrame,setSpriteAction,chooseEnemyMove,enemyThinkingLevel,opponentAI:OpponentAI,createLiveCombat,finishBattle,boardItemSound,boardImpactShake,
  get progressionTurns(){return progressionTurn;},
  get expedition(){return typeof expeditionState==='undefined'?null:expeditionState;},expeditionCollect,
  expeditionTurn(){return expeditionEnemyTurn();},rageCast(){state.enemyEnergy=100;return castReadyUltimates();},bossHistory(){return progressionBossHistory.slice();},heroStrike(raw){return attack('hero',raw);},foeStrike(raw){return attack('enemy',raw);},
  get progressionEnemyEffects(){return {dot:progressionEnemyDot?{...progressionEnemyDot}:null,charge:progressionEnemyCharge};},
  // Studio: try an alternative drawing of a hero (ART.heroVariants) in place of its current one.
  heroVariant(key,name){const base=ART.heroVariantBase||(ART.heroVariantBase={});base[key]??=ART.heroes[key];ART.heroes[key]=name?ART.heroVariants?.[key]?.[name]||base[key]:base[key];renderActors();update();return Object.keys(ART.heroVariants?.[key]||{});},
  configure(options){if(locked&&!$('selectDialog').open)throw Error('Wait for the current action to finish');Object.assign(state,options);if($('selectDialog').open)$('selectDialog').close();if($('resultDialog').open)$('resultDialog').close();startStage();Object.assign(state,options);plannedIntent=intent();renderActors();update();},
  setBoard(types,specials=[]){if(locked)throw Error('Board is busy');clearSelection();$('board').replaceChildren();board=types.map((row,r)=>row.map((type,c)=>newTile(type,r,c)));specials.forEach(s=>{board[s.r][s.c].special=s.kind;board[s.r][s.c].dir=s.kind==='bolt'?s.dir||'row':undefined;if(s.kind==='core')board[s.r][s.c].type=-1;});all().forEach(createTile);board[0][0].el.tabIndex=0;},
  // Studio only (?qa): turn one gem into a special (bolt row/col, bomb, core) or back into a plain gem, to test specials.
  setSpecial(r,c,kind,dir='row'){if(locked)throw Error('Board is busy');const t=board[r]?.[c];if(!t)return;t.special=kind||null;t.dir=kind==='bolt'?dir:undefined;
    if(kind==='core')t.type=-1;else if(t.type<0)t.type=rand(5);paintTile(t);clearSelection();},
  setReduced(value){reduced=value;updateSettings();},async settle(){await ensurePlayable();},get effects(){return activeAnimations.size;},get art(){return ART;},get monsters(){return MONSTERS;},get creatureNames(){return progressionRules.WORLD.CREATURE_NAMES;},creatureSheets,get foeStatuses(){return foeStatuses;},get foeHaste(){return foeHaste;},resetFoeStatuses(){foeStatusReset();},tickFoeStatuses(){return tickFoeStatuses();},applyFoeStatus(s,base){return applyFoeStatus(s,base);},castReadyUltimates(){return castReadyUltimates();},foeSkills(){const o=state.qaFoeFx;if(!o)return [];const W=progressionRules.WORLD;return (o.tier==='boss'?W.BOSSES[o.boss]?.skills:o.tier==='elite'?[...W.ELITE_SKILLS[o.creature],...(foeEliteUlt(o)?[foeEliteUlt(o)]:[])]:[W.COMMON_SKILL])||[];},
  foeCast(index,base=30){const s=this.foeSkills()[index];if(!s)return;const hit=s.effects?.find(e=>e.type==='hit'||e.type==='burst'),ward=s.effects?.find(e=>e.type==='ward'),heal=s.effects?.find(e=>e.type==='heal');
    const skill=s.effects?{name:s.name,move:s.move,ult:s.ult,kind:s.kind,power:hit?.power||0,hits:hit?.hits||1,shield:ward?.pct,heal:heal?.pct,status:s.effects.find(e=>e.type==='status')}:s;return castFoeSkill(skill,base);},
  // Summoned guards on the stage (each {hp,max}) and their attack, for visual checks.
  guards(list){return foeGuardsRender(list);},skillRule(s){return s.phase?'Giai đoạn '+s.phase+' (máu boss '+['>70%','35–70%','≤35%'][s.phase-1]+')':window.GemwovenBossTactics.skillRule(s);},guardsAttack(raw=40){return foeGuardsAttack(raw);},get chapters(){return progressionRules.WORLD.CHAPTERS;},get bossDefs(){return progressionRules.WORLD.BOSSES;}
};
})();
