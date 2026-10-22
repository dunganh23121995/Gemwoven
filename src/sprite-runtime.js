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
  return `<span class="sprite-body" role="img" aria-label="${name}" data-family="${family}" data-key="${key}" data-action="${action}" data-frame="0" data-loop="true" style="background-image:url('${sheet.src}');background-size:${sheet.cols*100}% ${sheet.rows*100}%;background-position:0% 0%"></span>`;
}
function spriteApply(el,action,index){
  if(!el)return;
  const {sheet,action:mapped}=spriteDefinition(el.dataset.family,el.dataset.key,action);
  const frame=Math.max(0,Math.min(sheet.count-1,Number.isFinite(index)?index:0)),col=frame%sheet.cols,row=Math.floor(frame/sheet.cols);
  if(el.dataset.sheet!==mapped){el.style.backgroundImage=`url('${sheet.src}')`;el.style.backgroundSize=`${sheet.cols*100}% ${sheet.rows*100}%`;el.dataset.sheet=mapped;}
  el.style.backgroundPosition=`${sheet.cols===1?0:col/(sheet.cols-1)*100}% ${sheet.rows===1?0:row/(sheet.rows-1)*100}%`;
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
  if(now-spriteFrameClock<45||document.hidden)return;
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
    if(el.dataset.loop==='true'){
      // Only dense, authored loops advance at rest. One/two/four-pose atlases
      // otherwise pop at shoulders, eyes and weapons; CSS supplies a smooth breath.
      const frame=def.count>=8?Math.floor(Math.max(0,now-playback.start)/(def.frameDuration||90))%def.count:0;
      if(+el.dataset.frame!==frame||el.dataset.action!=='idle')spriteApply(el,'idle',frame);
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
  const enemy=$('enemyActor'),tier=state.boss?'boss':progressionBattle?.tier==='elite'?'elite':'normal';
  enemy.dataset.tier=progressionIsDuel()||progressionBattle?.mode==='pvp'?'duel':tier;
  // Which boss sheet is shown: a world boss id, or "base" for the element's own boss (fire = the dragon king).
  enemy.dataset.bossArt=!state.boss?'':progressionBattle?.bossId&&ART.worldBosses?.[progressionBattle.bossId]?progressionBattle.bossId:'base';
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
