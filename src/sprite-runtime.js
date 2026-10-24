// Action atlases retain their authored poses. Sparse idle sheets use a stable
// ready pose with continuous, foot-anchored breathing instead of hard pose jumps.
const spritePlayback=new WeakMap();
let spriteFrameClock=0;
function spriteDefinition(family,key,action){
  const set=family==='hero'?(ART.heroForms?.[key]?.[combatHeroForm(key)]||ART.heroes[key]):state.boss&&ART.bosses?.[key]?ART.bosses[key]:ART.enemies[key];
  const mapped=action==='buff'?(set.buff?'buff':'cast'):action==='victory'?'cast':action==='hurt'?(set.hurt?'hurt':'attack'):action;
  return {sheet:set[mapped]||set.attack||set.idle,action:set[mapped]?mapped:mapped==='idle'?'idle':'attack'};
}
function spriteMarkup(family,key,action='idle'){
  const {sheet}=spriteDefinition(family,key,action),name=family==='hero'?HEROES[key].name:MONSTERS[key].name;
  // Six-star Noct's scythe catches a travelling glint now and then (CSS, masked to the blade).
  const rig=family==='hero'&&key==='shadow'?'<i class="scythe-glint"></i>':'';
  return `<span class="sprite-body" role="img" aria-label="${name}" data-family="${family}" data-key="${key}" data-action="${action}" data-frame="0" data-loop="true" style="background-image:url('${sheet.src}');background-size:${sheet.cols*100}% ${sheet.rows*100}%;background-position:0% 0%">${rig}</span>`;
}
// Foes at rest now and then play one of their own short actions ("fidgets": an 8-frame sheet that
// starts and ends in the resting pose), then go back to the idle loop. Returns true while one plays.
function spriteFidget(el,def,playback,now){
  playback.fidgetAt??=now+3000+Math.random()*4000;
  if(!playback.fidget){
    if(now<playback.fidgetAt)return false;
    playback.fidget={sheet:def.fidgets[Math.floor(Math.random()*def.fidgets.length)],start:now};
  }
  const f=playback.fidget,frame=Math.floor((now-f.start)/(f.sheet.frameDuration||130));
  if(frame>=f.sheet.count){playback.fidget=null;playback.fidgetAt=now+4000+Math.random()*4000;el.dataset.sheet='';return false;}
  if(el.dataset.sheet!=='fidget'){el.style.backgroundImage=`url('${f.sheet.src}')`;el.style.backgroundSize=`${f.sheet.cols*100}% ${f.sheet.rows*100}%`;el.dataset.sheet='fidget';}
  el.style.backgroundPosition=spriteCellPosition(f.sheet,frame);el.style.setProperty('--tween','0');el.dataset.frame=frame;el.dataset.action='idle';
  return true;
}
function spriteCellPosition(sheet,frame){
  const col=frame%sheet.cols,row=Math.floor(frame/sheet.cols);
  return `${sheet.cols===1?0:col/(sheet.cols-1)*100}% ${sheet.rows===1?0:row/(sheet.rows-1)*100}%`;
}
function spriteApply(el,action,index){
  if(!el)return;
  const {sheet,action:mapped}=spriteDefinition(el.dataset.family,el.dataset.key,action);
  const frame=Math.max(0,Math.min(sheet.count-1,Number.isFinite(index)?index:0)),col=frame%sheet.cols,row=Math.floor(frame/sheet.cols);
  const previous={image:el.style.backgroundImage,size:el.style.backgroundSize,position:el.style.backgroundPosition,frame:el.dataset.frame,action:el.dataset.action};
  if(el.dataset.sheet!==mapped){el.style.backgroundImage=`url('${sheet.src}')`;el.style.backgroundSize=`${sheet.cols*100}% ${sheet.rows*100}%`;el.dataset.sheet=mapped;}
  el.style.backgroundPosition=spriteCellPosition(sheet,frame);
  // Sheets drawn smaller than the idle carry a scale: grow the drawing box about the feet so the
  // character keeps one size across actions (the cell always fills the box).
  const grow=(sheet.scale||1)-1,foot=sheet.footY||.94;
  for(const [k,v] of Object.entries(grow?{left:-grow*50+'%',top:-grow*foot*100+'%',width:(1+grow)*100+'%',height:(1+grow)*100+'%'}:{left:'',top:'',width:'',height:''}))el.style.setProperty(k,v,grow?'important':'');
  if(action!=='idle')el.style.setProperty('--tween','0');
  el.style.setProperty('--tween-img',el.style.backgroundImage);el.style.setProperty('--tween-size',el.style.backgroundSize);el.style.setProperty('--cell-pos',el.style.backgroundPosition);
  // Noct moves like black mist: outside idle, each pose change leaves the previous pose
  // dissolving over the new one instead of snapping (idle has its own continuous cross-fade).
  if(el.dataset.key==='shadow'&&el.closest('.actor')&&!reduced&&previous.image&&(previous.frame!==String(frame)||previous.action!==action)&&action!=='idle'){
    el.style.setProperty('--tween-img',previous.image);el.style.setProperty('--tween-size',previous.size);el.style.setProperty('--tween-pos',previous.position);
    el.getAnimations({subtree:true}).filter(a=>a.id==='mist-dissolve').forEach(a=>a.cancel());
    const fade=el.animate([{opacity:.9,filter:'blur(0px)'},{opacity:0,filter:'blur(2.5px)'}],{duration:240,easing:'ease-out',pseudoElement:'::after'});fade.id='mist-dissolve';
  }
  el.dataset.action=action;el.dataset.frame=frame;
  updateActorHead(el,action,frame);
  if(el.dataset.family==='hero'&&el.dataset.key==='earth')updateNoriShieldAura(el);
}
function setSpriteAction(side,action,duration=0){
  const root=actor(side),el=root.querySelector('.sprite-body');if(!el)return;
  root.dataset.state=action;
  const idle=action==='idle';el.dataset.loop=String(idle);
  spritePlayback.set(el,{action,start:performance.now(),duration:duration||1200,manual:false});
  spriteApply(el,action,action==='hurt'&&spriteDefinition(el.dataset.family,el.dataset.key,action).action!=='hurt'?4:0);
}
function setSpriteFrame(side,action,index){
  const el=actor(side).querySelector('.sprite-body');if(!el)return;
  el.dataset.loop='false';spritePlayback.set(el,{action,manual:true});spriteApply(el,action,index);
}
function spriteTick(now){
  requestAnimationFrame(spriteTick);
  if(now-spriteFrameClock<30||document.hidden)return;
  spriteFrameClock=now;
  const modalOpen=$('selectDialog').open||$('resultDialog').open;
  document.querySelectorAll('.sprite-body').forEach(el=>{
    const inScene=el.closest('.actor');if(inScene&&modalOpen)return;
    if(inScene&&el.dataset.family==='hero'&&el.dataset.key==='earth')updateNoriShieldAura(el);
    if(!inScene&&!el.closest('dialog[open]'))return;
    let playback=spritePlayback.get(el);
    if(!playback){playback={action:'idle',start:now,manual:false};spritePlayback.set(el,playback);}
    if(playback.manual)return;
    if(reduced){if(el.dataset.frame!=='0')spriteApply(el,playback.action,0);return;}
    const def=spriteDefinition(el.dataset.family,el.dataset.key,playback.action).sheet;
    if(el.dataset.loop==='true'&&def.fidgets?.length&&!reduced&&spriteFidget(el,def,playback,now))return;
    if(el.dataset.loop==='true'){
      // Only dense, authored loops advance at rest. One/two/four-pose atlases
      // otherwise pop at shoulders, eyes and weapons; CSS supplies a smooth breath.
      const progress=def.count>=8?Math.max(0,now-playback.start)/(def.frameDuration||90):0,frame=Math.floor(progress)%def.count;
      if(+el.dataset.frame!==frame||el.dataset.action!=='idle')spriteApply(el,'idle',frame);
      // Idle breathes continuously: the next pose fades in over the current one (::after layer).
      if(def.count>=8){const t=progress%1;el.style.setProperty('--tween-pos',spriteCellPosition(def,(frame+1)%def.count));el.style.setProperty('--tween',(t*t*(3-2*t)).toFixed(3));}
    }else{
      const elapsed=Math.max(0,now-playback.start);
      const fallbackHurt=playback.action==='hurt'&&spriteDefinition(el.dataset.family,el.dataset.key,'hurt').action!=='hurt';
      const frame=fallbackHurt?Math.min(def.count-1,4+Math.floor(elapsed/Math.max(1,playback.duration)*2)):Math.min(def.count-1,Math.floor(elapsed/(playback.duration||1000)*def.count));
      if(+el.dataset.frame!==frame)spriteApply(el,playback.action,frame);
    }
  });
}
heroArt=key=>spriteMarkup('hero',key);
monsterArt=(key,boss=false)=>(boss?'<span class="boss-sigil" aria-hidden="true">'+icon('crown')+'</span>':'')+spriteMarkup('enemy',key);
landscapeArt=()=>`<img src="${ART.landscape}" alt="" draggable="false">`;
renderActors=function(){
  for(const side of ['hero','enemy'])$(side+'HeadHud').style.visibility='hidden';
  $('heroActor').innerHTML=heroArt(state.key);$('enemyActor').innerHTML=monsterArt(state.enemyKey,state.boss);
  $('enemyActor').classList.toggle('boss',state.boss);$('enemyActor').style.setProperty('--element',ELEMENTS[state.enemyKey].color);
  $('heroActor').style.setProperty('--element',ELEMENTS[state.key].color);
  $('heroActor').dataset.hero=state.key;
  $('enemyActor').dataset.element=state.enemyKey;
  const enemy=$('enemyActor'),tier=state.boss?'boss':progressionBattle?.tier==='elite'||state.qaElite?'elite':'normal';// qaElite: test builds (Noct Studio)
  enemy.dataset.tier=progressionIsDuel()||progressionBattle?.mode==='pvp'?'duel':tier;
  // Which boss sheet is shown: a world boss id, or "base" for the element's own boss (fire = the dragon king).
  enemy.dataset.bossArt=!state.boss?'':state.qaBossArt||(progressionBattle?.bossId&&ART.worldBosses?.[progressionBattle.bossId]?progressionBattle.bossId:'base');
  enemy.dataset.idleMotion=/bat|roc|wing|wisp|moth/.test(progressionBattle?.creature||progressionBattle?.bossId||'')?'hover':'breathe';
  mountElementalBossAura(enemy);
  if(state.key==='shadow')mountShadowVeil();
  renderEncounterScene();
  mountActorHead('hero');mountActorHead('enemy');
  setSpriteAction('hero','idle');setSpriteAction('enemy','idle');
};
function mountElementalBossAura(root){
  if(!state.boss||progressionIsDuel())return;
  const aura=document.createElement('span');aura.className='boss-element-aura';aura.setAttribute('aria-hidden','true');
  aura.style.setProperty('--element',({fire:'#ffad55',earth:'#b4de78',ice:'#9deaff',lightning:'#d7b3ff',shadow:'#bc9aef'})[state.enemyKey]||ELEMENTS[state.enemyKey].color);
  aura.innerHTML='<i class="boss-aura-halo"></i><i class="boss-aura-ground"></i><i class="boss-aura-arc"></i><i class="boss-aura-arc second"></i>'+
    Array.from({length:9},(_,i)=>`<b style="--delay:${-i*.47}s;--x:${i%2?96-i:4+i}%"></b>`).join('');
  root.append(aura);
}
const itemNames=['sword','heart','crystal','snow','shield'];
function itemImage(type,special=null){const name=special==='core'?'core':itemNames[type]+(special?'-'+special:'');return ART.items[name];}
paintTile=function(t){
  const p=TYPES[Math.max(0,t.type)],e=t.el;e.className='tile'+(t.special?' special '+t.special:'');
  e.setAttribute('aria-label',tileLabel(t));e.setAttribute('aria-rowindex',t.r+1);e.setAttribute('aria-colindex',t.c+1);e.setAttribute('aria-selected','false');
  e.dataset.type=itemNames[Math.max(0,t.type)];e.dataset.tier=t.special||'normal';
  e.style.setProperty('--tile-light',p.light);e.style.setProperty('--tile-bg',p.bg);e.style.setProperty('--tile-edge',p.edge);e.style.setProperty('--item-glow',p.color);
  e.innerHTML=`<span class="gem"><img class="item-art" src="${itemImage(t.type,t.special)}" alt="" draggable="false">${t.special&&t.special!=='core'?`<span class="special-tier" aria-hidden="true">${t.special==='bolt'?'IV':'V'}</span>`:''}</span>`;
};
function finishArtSetup(){
  $('tileLegend').innerHTML=TYPES.map((t,i)=>`<div class="legend-item"><span class="legend-icon"><img src="${itemImage(i)}" alt=""></span><span>${t.name}</span><small>${t.effect}</small></div>`).join('');
  $('helpLegend').innerHTML=TYPES.map((t,i)=>`<div><img class="help-item-art" src="${itemImage(i)}" alt=""><span><b>${t.name}</b> · ${['8 sát thương mỗi ngọc, trước hệ số nhân vật và nguyên tố','Hồi 1,2% HP tối đa mỗi ngọc (ít nhất 6 HP)','Tích thêm năng lượng để dùng tuyệt kỹ','Ghép 3 để đóng băng quái trong 1 lượt','Giáp bằng 1,5% HP tối đa mỗi ngọc (ít nhất 4); Yuki nhận gấp đôi'][i]}</span></div>`).join('');
  const gallery=document.createElement('div');gallery.className='special-gallery';gallery.innerHTML='<div class="special-gallery-head"><span>Item</span><span>Ghép 4 · Sao băng</span><span>Ghép 5 · Bùng nổ</span></div>'+TYPES.map((t,i)=>`<div class="special-gallery-row"><span><img src="${itemImage(i)}" alt="${t.name}"></span><span><img src="${itemImage(i,'bolt')}" alt="${t.name} Sao băng"></span><span><img src="${itemImage(i,'bomb')}" alt="${t.name} Bùng nổ"></span></div>`).join('');
  $('helpLegend').after(gallery);
  $('helpTitle').textContent='Kết nối. Tích lực. Bùng nổ.';
  requestAnimationFrame(spriteTick);
}
