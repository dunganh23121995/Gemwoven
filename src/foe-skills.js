// Foe skills on screen and in the rules.
//  * Statuses: lasting effects that bosses put on the hero or on themselves (damage over time,
//    stun, silence, weaken, stealth, undying...). They tick down at the start of every foe turn.
//  * Moves: how a skill is staged. Every boss skill names a move that suits its body (a beast
//    lunges and slams, a dragon breathes, a mage casts volleys and beams) and plays it with that
//    boss's own effect sheet (ART.bossFx). Elites use their chapter boss's effect, smaller.
//  * castFoeSkill: one skill from announcement to damage, shields, heals and statuses, shared by
//    classic chapters (progression-combat.js) and phase fights (expedition-combat.js).
// Common foes have no skill effect of their own: their one skill is a pounce (attack()).

// ---- Statuses ---------------------------------------------------------------------------------
const FOE_STATUS={
  dot:{label:'Thiêu đốt',side:'hero'},curse:{label:'Nguyền rủa',side:'hero'},mark:{label:'Ấn sấm',side:'hero'},
  weaken:{label:'Suy yếu',side:'hero'},vulnerable:{label:'Vỡ giáp',side:'hero'},silence:{label:'Phong ấn',side:'hero'},
  confuse:{label:'Hỗn loạn',side:'hero'},blind:{label:'Mù',side:'hero'},antiheal:{label:'Cấm hồi',side:'hero'},
  armorlock:{label:'Giáp tan chảy',side:'hero'},chill:{label:'Hàn ấn',side:'hero'},paralyze:{label:'Tê liệt',side:'hero'},
  stealth:{label:'Tàng hình',side:'self'},invulnerable:{label:'Miễn thương',side:'self'},undying:{label:'Bất tử',side:'self'},
  reflect:{label:'Gai phản',side:'self'},regen:{label:'Tái sinh',side:'self'},frenzy:{label:'Cuồng huyết',side:'self'}
};
let foeStatuses={},foeDamageTaken=0,foeHaste=0;
const foeHas=id=>(foeStatuses[id]?.turns||0)>0;
function foeStatusReset(){foeStatuses={};foeDamageTaken=0;foeHaste=0;const enemy=$('enemyActor');if(enemy)delete enemy.dataset.foeVeil;if(typeof syncFoeSelfStates==='function')syncFoeSelfStates();}
// Instant statuses (stun, wash, haste, rewind, drainAll) act at once and never become badges.
async function applyFoeStatus(s,base=20,pending=[]){
  if(!s||state.hp<=0||state.enemyHp<=0)return;
  const elite=foeSkillOwner()?.tier==='elite',turns=Math.max(1,s.turns||1),value=s.value||0;
  if(s.id==='stun'){state.playerFrozen=true;popActorSkill('hero','Choáng · mất lượt',false,pending);update();return;}
  // Paralysis: the hero loses this turn, then the shock drains energy (value) at every foe turn it lasts.
  if(s.id==='paralyze')state.playerFrozen=true;
  if(s.id==='haste'){foeHaste++;popActorSkill('enemy','Hành động thêm',false,pending);return;}
  if(s.id==='wash'){state.armor=0;state.energy=0;update();popActorSkill('hero','Cuốn trôi giáp & năng lượng',false,pending);return;}
  if(s.id==='rewind'){const back=Math.round(foeDamageTaken*(value||.5));foeDamageTaken=0;popActorSkill('enemy','Nghịch thời',false,pending);if(back)await buff('enemy','heal',back);return;}
  if(s.id==='drainAll'){state.energy=0;update();return;}
  const def=FOE_STATUS[s.id];if(!def)return;
  foeStatuses[s.id]={turns,value:value*(elite?.6:1),raw:base*(s.id==='paralyze'?.6:(value||.2)),stage:0};
  popActorSkill(def.side==='self'?'enemy':'hero',def.label,false,pending);
  if(s.id==='stealth'||s.id==='invulnerable')actor('enemy').dataset.foeVeil=s.id;
  update();
}
// Start of every foe turn: lasting damage and healing land, then every status loses a turn.
async function tickFoeStatuses(){
  for(const [id,s] of Object.entries(foeStatuses)){
    if(state.hp<=0||state.enemyHp<=0)break;
    if(id==='dot'){const r=damage('enemy',s.raw);await floating('hero','Thiêu đốt −'+r.amount);}
    if(id==='curse'){s.stage++;const r=damage('enemy',s.raw*s.stage);await floating('hero','Nguyền rủa −'+r.amount);}
    if(id==='regen')await buff('enemy','heal',Math.round(state.enemyMax*s.value));
    if(id==='paralyze'){state.energy=Math.max(0,state.energy-s.value);const r=damage('enemy',s.raw);await floating('hero','Tê liệt −'+r.amount+' · −'+s.value+' năng lượng');}
    if(--s.turns<=0){
      if(id==='mark'){const r=applyCombatDamage('hero',Math.round(HEROES[state.key].hp*s.value));await floating('hero','Ấn sấm nổ −'+r.amount);}
      delete foeStatuses[id];
    }
  }
  if(!foeHas('stealth')&&!foeHas('invulnerable'))delete actor('enemy').dataset.foeVeil;
  update();
}
// The boss's own states show on its body, not only in the status row: a frenzy burns red round it,
// stealth turns it to a shimmering shade, invulnerability closes a golden shell, undying a violet one,
// regeneration lifts green motes (foe-skills.css .foe-state).
const FOE_SELF_STATES=['frenzy','stealth','invulnerable','undying','regen'];
function syncFoeSelfStates(){
  const enemy=actor('enemy');if(!enemy)return;
  let aura=enemy.querySelector(':scope>.foe-state');
  const on=FOE_SELF_STATES.filter(id=>foeHas(id));
  if(!on.length){aura?.remove();for(const id of FOE_SELF_STATES)delete enemy.dataset['foe'+id[0].toUpperCase()+id.slice(1)];return;}
  if(!aura){aura=document.createElement('span');aura.className='foe-state';aura.setAttribute('aria-hidden','true');aura.innerHTML='<i></i><i></i><i></i><i></i><i></i>';enemy.prepend(aura);}
  for(const id of FOE_SELF_STATES){const key='foe'+id[0].toUpperCase()+id.slice(1);if(on.includes(id))enemy.dataset[key]='';else delete enemy.dataset[key];}
}
function renderFoeStatuses(){
  syncFoeSelfStates();
  for(const side of ['hero','enemy']){
    const row=$(side+'Statuses');if(!row)continue;row.querySelectorAll('.foe-status').forEach(n=>n.remove());
    for(const [id,s] of Object.entries(foeStatuses)){
      const def=FOE_STATUS[id];if(!def||(def.side==='self')!==(side==='enemy'))continue;
      const pill=document.createElement('span');pill.className='status-pill foe-status';pill.dataset.status=id;pill.title=def.label+' · còn '+s.turns+' lượt';pill.textContent=def.label+' '+s.turns;row.append(pill);
    }
  }
}
const foeStatusUpdate=update;update=function(){foeStatusUpdate();renderFoeStatuses();};
const foeStatusStart=startStage;startStage=function(){foeStatusReset();return foeStatusStart();};

// The rules side of the statuses, at the existing damage, heal, armour and energy hooks.
const foeBaseDamage=damage;
damage=function(side,raw,ledger=null){
  if(side==='hero'&&state.enemyHp>0){
    if(foeHas('stealth')||foeHas('invulnerable')){floating('enemy',foeHas('stealth')?'TRƯỢT':'MIỄN','armor');return {amount:0,blocked:0};}
    if(foeHas('blind')&&!ledger&&Math.random()<foeStatuses.blind.value){floating('enemy','TRƯỢT','armor');return {amount:0,blocked:0};}
    if(foeHas('weaken'))raw*=1-foeStatuses.weaken.value;
    const result=foeBaseDamage(side,raw,ledger);
    for(const id of ['confuse','reflect'])if(foeHas(id)&&result.amount>0&&state.hp>0){
      const back=applyCombatDamage('hero',Math.max(1,Math.round(result.amount*foeStatuses[id].value)));
      floating('hero',(id==='confuse'?'Tự đánh −':'Gai phản −')+back.amount);
    }
    return result;
  }
  if(side==='enemy'&&foeHas('vulnerable'))raw*=1+foeStatuses.vulnerable.value;
  const result=foeBaseDamage(side,raw,ledger);
  if(side==='enemy'&&foeHas('frenzy')&&result.amount>0)buff('enemy','heal',Math.round(result.amount*foeStatuses.frenzy.value));
  return result;
};
const foeBaseApply=applyCombatDamage;
applyCombatDamage=function(target,n){
  if(target==='enemy'&&foeHas('undying'))n=Math.min(n,Math.max(0,state.enemyArmor+state.enemyHp-1));
  const result=foeBaseApply(target,n);
  if(target==='enemy')foeDamageTaken+=result.amount;
  return result;
};
const foeBaseBuff=buff;
buff=function(side,kind,value,options){
  if(side==='hero'&&((kind==='heal'&&foeHas('antiheal'))||(kind==='armor'&&foeHas('armorlock')))){floating('hero',kind==='heal'?'Cấm hồi':'Giáp tan chảy','armor');return Promise.resolve(0);}
  if(side!=='enemy'||!bossOwnStyle())return foeBaseBuff(side,kind,value,options);
  // A chapter boss's gems keep it in its own style: no cast pose, hero emblem or sanctuary; armour it
  // gains puts on its own plates (and its armoured sheets, sprite-runtime.js).
  const job=foeBaseBuff(side,kind,value,{...options,plain:true});
  if(kind==='armor')job.then(()=>{const look=bossGuardLook();if(look&&state.enemyArmor>0&&!foeAura)foeGuardAura(look);});
  return job;
};
// A chapter boss's basic pounce lands with its body and its own recordings: no hero element emblem,
// speed trail, crescent slash, elemental bloom or synthesized sound (those belong to the heroes).
function bossOwnStyle(){const o=foeSkillOwner();return o?.tier==='boss'&&state.boss&&!!BOSS_SKILL_LOOKS[o.boss];}
function bossKit(){const o=foeSkillOwner(),looks=BOSS_SKILL_LOOKS[o?.boss]||{};return (progressionRules.WORLD.BOSSES[o?.boss]?.skills||[]).map(s=>({s,look:looks[s.name]})).filter(k=>k.look);}
const bossGuardLook=()=>bossKit().find(({s})=>s.shield&&!s.power||s.effects?.some(e=>e.type==='ward')&&!s.effects.some(e=>e.type==='hit'))?.look||null;
const bossBasicSounds=()=>bossKit().find(({s,look})=>!s.ult&&look.pose&&look.sounds?.hit)?.look.sounds||null;
let foeBasicStrike=false;
const foeBaseAttack=attack;
attack=async function(side,raw,options={}){
  if(side!=='enemy'||options.ultimate||!bossOwnStyle())return foeBaseAttack(side,raw,options);
  foeBasicStrike=true;try{return await foeBaseAttack(side,raw,options);}finally{foeBasicStrike=false;}
};
const foeBaseCharge=combatV3Charge,foeBaseTrail=combatV3AttackTrail,foeBaseSlash=combatV3Slash,foeBaseImpact=combatV3Impact,foeBaseWhoosh=combatV3Whoosh,foeBaseHitSound=combatV3HitSound;
combatV3Charge=function(side,...rest){if(side==='enemy'&&bossOwnStyle())return;return foeBaseCharge(side,...rest);};
combatV3AttackTrail=function(...a){if(!foeBasicStrike)return foeBaseTrail(...a);};
combatV3Slash=function(...a){if(!foeBasicStrike)return foeBaseSlash(...a);};
combatV3Impact=function(target,...rest){if(!(foeBasicStrike&&target==='hero'))return foeBaseImpact(target,...rest);};
combatV3Whoosh=function(...a){if(!foeBasicStrike)return foeBaseWhoosh(...a);const s=bossBasicSounds();if(s?.start)bossSkillSound(s.start,{volume:.2});};
combatV3HitSound=function(...a){if(!foeBasicStrike)return foeBaseHitSound(...a);const s=bossBasicSounds();if(s?.hit)bossSkillSound(s.hit,{volume:.26});};
const foeBaseTileYield=combatTileYield;
combatTileYield=function(side,type){
  if(side==='hero'&&((type===1&&foeHas('antiheal'))||(type===4&&foeHas('armorlock'))))return 0;
  return foeBaseTileYield(side,type);
};
// Silence is checked where ultimates start (castReadyUltimates, activateSkill): later layers
// replace heroUltimate itself.
const foeSilenced=()=>typeof foeHas==='function'&&foeHas('silence');

// ---- Effect sheets ----------------------------------------------------------------------------
// Whose effect a foe wields: the campaign battle's chapter boss (or a test build's override).
function foeSkillOwner(){
  if(state.qaFoeFx)return state.qaFoeFx;
  return progressionBattle?{boss:progressionBattle.bossId,tier:progressionBattle.tier}:null;
}
function foeSkillSheet(look=null){
  const owner=foeSkillOwner();if(!owner||owner.tier==='normal'||reduced)return null;
  // A boss skill with its own look never falls back to the signature sheet (that one is the elites').
  if(look?.fx)return ART.bossFx?.[owner.boss+'/'+look.fx]||null;
  return ART.bossFx?.[owner.boss]||null;
}
// Each boss skill's own look and sound, so no two skills of a kit (or two bosses) look or sound alike, and
// nothing of it is shared with the chapter's elites (they wield the signature sheet ART.bossFx[boss]),
// common foes or heroes: fx names the skill's own sheet (assets/fx/bosses/<boss>/skills/<fx>,
// ART.bossFx['<boss>/<fx>']; size scales a lunge's mark), move overrides the skill's move, and sounds are
// the boss's own recordings (scripts/prepare_boss_skill_sounds.py, played as bossfx-<boss>-<cue>): start as
// the move begins, hit on the first contact, lock at a ward's peak, land as a quake crashes down, boom (a deep
// "uỳnh") the moment a giant's body or foot meets the ground (a quake's landing, a stomp). Such a
// skill drops the shared hit star, synthesized hit and buff glow. bless plays a sheet behind the boss with
// its sound after the strike (an ultimate's heal or blessing).
// Keyed by the chapter boss and the skill's name: elites fight with skills of their own names.
const BOSS_SKILL_LOOKS={
  // Thạch Mộc Cự Vệ: basalt, moss, fern and glowing amber sap (no gold or gems, the elites' signature):
  // a talon rake, a wall of twisted trunks, a sap-root snare, a quake and the spirit tree.
  earth:{
    'Nanh Vuốt':{fx:'claw',size:1.35,sounds:{start:'claw-swing',hit:'claw-hit'}},
    'Giáp Cổ Thụ':{fx:'guard',move:'ward',sounds:{start:'guard-grow',lock:'guard-lock'}},
    'Hút Linh Lực':{fx:'snare',move:'snare',sounds:{start:'snare-roots',hit:'snare-drain'}},
    'Thần Mộc Bất Tử':{fx:'quake',move:'quake',ground:.78,sounds:{land:'ult-slam'},bless:{fx:'bless',sound:'ult-bless'}}
  },
  // The other bosses follow the pilot: art from assets/fx/bosses/skill_prompts.py (each kit's identity),
  // recordings from scripts/pick_boss_skill_sounds.py.
  // Hỏa Long Tro Tàn: smouldering ash and embers.
  fire:{
    'Long Vĩ Quật':{fx:'tail',move:'tailwhip',pose:'tail',sounds:{start:'tail-start',hit:'tail-hit'}},
    'Vảy Dung Nham':{fx:'scale',move:'armorup',pose:'armor',sounds:{start:'scales-start',lock:'scales-lock'}},
    'Long Nha Thiêu Đốt':{fx:'lavaspit',move:'bite',pose:'bite',sounds:{start:'jaws-start',hit:'jaws-hit'}},
    'Long Viêm Diệt Thế':{soar:.26,fx:'firesea',move:'flight',pose:'fly',stream:'breathcone',sounds:{start:'flight-start',hit:'flight-hit'}}
  },
  // Băng Nguyệt Linh Hồ: moonlit frost.
  ice:{
    'Băng Thương':{fx:'moonshatter',move:'volley',bolt:'moonlance',channel:{fx:'moonchannel',at:'head',ms:900,size:0.6},sounds:{start:'moonspear-start',hit:'moonspear-hit',channel:'moonspear-channel'}},
    'Kết Giới Băng':{fx:'moondome',move:'dome',sounds:{start:'moonward-start',lock:'moonward-lock'}},
    'Hàn Phong':{fx:'gust',move:'sweep',pose:'howl',sounds:{start:'moonwind-start'}},
    'Nguyệt Băng Phong Ấn':{fx:'moonprison',upright:true,move:'bind',channel:{fx:'bigmoon',at:'head',ms:1300,size:1.1},sounds:{start:'moonseal-start',hit:'moonseal-hit',channel:'moonseal-channel'}}
  },
  // Lôi Sư Thiên Đỉnh: storm cloud and white thunder.
  lightning:{
    'Ngũ Lôi':{fx:'strike',move:'strikes',pose:'charge',sounds:{start:'strike-start',hit:'strike-hit'}},
    'Điện Trường':{fx:'fieldring',move:'snare',pose:'charge',ground:.72,size:1.3,beats:3,hold:true,sounds:{start:'field-start',hit:'field-hit'}},
    'Tụ Điện':{into:-.35,fx:'thunderclaw',move:'pounce',size:1.3,pose:'pounce',sounds:{start:'thunderclaw-start',hit:'thunderclaw-hit'}},
    'Lôi Thần Quang Pháo':{thick:1.5,ember:'#dff6ff',fx:'cannonhit',move:'jet',pose:'cannon',stream:'thundercone',size:1.3,beats:3,sounds:{start:'cannon-start',hit:'cannon-hit'}}
  },
  // Mẫu Nấm Độc: toadstool and bog.
  mire:{
    'Bào Tử Độc':{fx:'toadstools',move:'snare',channel:{fx:'gillspores',at:'head',ms:800,size:0.6},sounds:{start:'toadstools-start',hit:'toadstools-hit',channel:'gillspores-channel'}},
    'Tán Nấm Hồi Sinh':{fx:'bigcap',move:'bloom',size:.4,channel:{fx:'gillspores',at:'head',ms:800,size:0.6},sounds:{start:'bigcap-grow',channel:'gillspores-channel'}},
    'Rễ Bào Tử':{trail:true,fx:'rootcreep',move:'sweep',channel:{fx:'gillspores',at:'head',ms:800,size:0.6},sounds:{start:'mycelium-start',hit:'mycelium-hit',channel:'mycelium-channel'}},
    'Bào Tử Mê Loạn':{fx:'hypnospore',move:'cataclysm',warn:'#b070ff',beats:3,channel:{fx:'gillspores',at:'head',ms:800,size:0.6},sounds:{start:'dizzy-start',hit:'dizzy-hit',channel:'gillspores-channel'}}
  },
  // Bọ Vương Hoàng Kim: desert tomb stone.
  scarab:{
    'Giáp Cát Hoàng Kim':{fx:'elytron',move:'shutters',sounds:{start:'wingshield-start',lock:'wingshield-lock'}},
    'Sừng Vàng Xuyên Phá':{fx:'hornstrike',move:'gore',pose:'gore',sounds:{start:'hornstrike-start',hit:'hornstrike-hit'}},
    'Hàm Kìm Tam Kẹp':{clamp:[[1,2],[3,4]],fx:'clampspark',move:'pincer',pose:'snap',sounds:{start:'mandible-start',hit:'mandible-hit'}},
    'Lời Nguyền Pharaoh':{fx:'obelisks',move:'quake',channel:{fx:'suncrest',at:'head',ms:1100,size:0.6},sounds:{start:'obelisks-start',land:'obelisks-land',boom:'obelisks-boom',channel:'suncrest-channel'}}
  },
  // Hải Long San Hô: sea storm.
  leviathan:{
    'Thủy Long Tức':{ember:'#bff4ff',fx:'jetsplash',move:'jet',pose:'breathe',channel:{fx:'coralglow',at:'head',ms:700,size:0.5,pose:'breathe',hold:2},stream:'jetcone',sounds:{start:'jet-start',hit:'jet-hit',channel:'coralglow-channel'}},
    'Hô Phong Hoán Vũ':{fx:'raincloud',move:'pour',pose:'cast',channel:{fx:'coralglow',at:'head',ms:900,size:0.6},sounds:{start:'rainstorm-grow',channel:'rainstorm-channel'}},
    'Hàn Băng Tức':{fx:'frostmist',move:'jet',pose:'breathe',stream:'frostcone',ember:'#e8fbff',channel:{fx:'coralglow',at:'head',ms:700,size:0.5,pose:'breathe',hold:2},sounds:{start:'frostbreath-start',hit:'frostbreath-hit',channel:'frostbreath-channel'}},
    'Lôi Vũ Long Thần':{fx:'seabolt',move:'tempest',pose:'cast',channel:{fx:'coralglow',at:'head',ms:1400,size:0.8},cloud:'raincloud',sounds:{start:'thunderstorm-start',hit:'thunderstorm-hit',channel:'thunderstorm-channel'}}
  },
  // Cự Tượng Bánh Răng: forge and steam.
  colossus:{
    'Nạp Lõi Hơi Nước':{fx:'steamburst',move:'roar',pose:'charge',windup:2,release:4,sounds:{start:'steamburst-start',hit:'steamburst-hit'}},
    'Búa Tạ Cơ Khí':{fx:'hammer',move:'punch',pose:'slam',into:-.25,sounds:{start:'hammer-start',hit:'hammer-hit'}},
    'Giáp Bánh Răng':{fx:'gearshield',move:'orbit',sounds:{start:'ironwall-start',lock:'ironwall-lock'}},
    'Trọng Chùy Phá Giáp':{fx:'smash',move:'quake',pose:'slam',channel:{fx:'coreheat',at:'body',ms:1000,size:0.6},sounds:{start:'smash-start',land:'smash-land',boom:'smash-boom',channel:'coreheat-channel'}}
  },
  // Bọ Ngựa Lăng Tinh: black glass and spectrum.
  prism:{
    'Song Liềm Liên Trảm':{fx:'scythecut',move:'flurry',size:1.3,pose:'slash',sounds:{start:'scythecut-start',hit:'scythecut-hit'}},
    'Vỏ Tinh Thể':{fx:'prismpillar',move:'pillars',sounds:{start:'mirrors-start',lock:'mirrors-lock'}},
    'Quang Phổ Rạn Nứt':{fx:'spectrum',move:'beam',pose:'cross',channel:{fx:'crossglint',at:'front',ms:800,size:0.5},sounds:{start:'spectrum-start',hit:'spectrum-hit',channel:'crossglint-channel'}},
    'Thiên Liềm Loạn Vũ':{fx:'scythetrail',move:'rush',pose:'slash',finisher:'scythex',sounds:{start:'scythetrail-start',hit:'scythetrail-hit'}}
  },
  // Tử Thần Nguyệt Ảnh: grave and bone.
  reaper:{
    'Liềm Hồn':{into:-.15,fx:'scythe',move:'lunge',size:1.3,pose:'reap',sounds:{start:'scythe-start',hit:'scythe-hit'}},
    'Hút Hồn':{drain:'#d8ccff',fx:'soulknot',move:'spiral',channel:{fx:'moonblade',at:'front',ms:900,size:0.6},sounds:{start:'soulknot-start',hit:'soulknot-hit',channel:'soulknot-channel'}},
    'Nguyệt Trảm':{fx:'mooncrescent',move:'boomerang',pose:'reap',sounds:{start:'hookcut-start',hit:'hookcut-hit'}},
    'Ảnh Hồn Tiêu Biến':{fx:'tatters',move:'vanish',channel:{fx:'moonblade',at:'head',ms:1100,size:0.8},size:1.9,beats:3,sounds:{start:'tatters-start',hit:'tatters-hit',channel:'tatters-channel'}}
  },
  // Đại Bàng Thiên Phong: gale and hawk feathers.
  roc:{
    'Phong Vũ':{fx:'featherdart',move:'fan',pose:'beat',size:1.6,sounds:{start:'featherblade-start',hit:'featherblade-hit'}},
    'Lông Vũ Hộ Thể':{fx:'wings',move:'wings',sounds:{start:'featherwall-start',lock:'featherwall-lock'}},
    'Lốc Cướp Linh':{drain:'#c8fff2',fx:'cyclone',move:'sweep',pose:'beat',sounds:{start:'cyclone-start',hit:'cyclone-hit'}},
    'Đại Bàng Bổ Nhào':{fx:'dive',move:'dive',pose:'dive',sounds:{start:'dive-start',hit:'dive-hit'}}
  },
  // Nữ Hoàng Gai: black thorn and venom.
  briar:{
    'Gai Độc':{fx:'vinewhip',move:'thrust',pose:'lash',channel:{fx:'rosebloom',at:'front',ms:700,size:0.45},sounds:{start:'vinewhip-start',hit:'vinewhip-hit',channel:'rosebloom-channel'}},
    'Hoa Ăn Linh':{drain:'#a8ff8a',fx:'maw',move:'snare',channel:{fx:'rosebloom',at:'front',ms:700,size:0.45},sounds:{start:'maw-start',hit:'maw-hit',channel:'maw-channel'}},
    'Rừng Gai':{fx:'thornwrap',move:'wrap',channel:{fx:'rosebloom',at:'front',ms:700,size:0.45},sounds:{start:'brambles-start',lock:'brambles-lock',channel:'brambles-channel'}},
    'Vương Miện Gai Phản':{fx:'thornspike',move:'cataclysm',emblem:'thorncrown',warn:'#c0306a',channel:{fx:'thorncrown',at:'head',ms:1200,size:0.6},size:1.7,sounds:{start:'thorncrown-start',hit:'thorncrown-hit',channel:'thorncrown-channel'}}
  },
  // Thiên Sứ Nhật Quang: white holy flame.
  seraph:{
    'Nhật Kiếm':{fx:'sunlance',move:'thrust',pose:'thrust',sounds:{start:'thrust-start',hit:'thrust-hit'}},
    'Ánh Dương Tái Sinh':{fx:'heavenlight',move:'pour',sounds:{start:'halo-grow'}},
    'Hào Quang Phán Quyết':{fx:'lightspear',move:'rain',channel:{fx:'swordlight',at:'front',ms:900,size:0.5},sounds:{start:'lightspear-start',hit:'lightspear-hit',channel:'swordlight-channel'}},
    'Phong Ấn Thánh Quang':{fx:'holyseal',move:'column',channel:{fx:'swordlight',at:'head',ms:1200,size:0.9},size:1.5,beats:3,sounds:{start:'sealbeam-start',hit:'sealbeam-hit',channel:'sealbeam-channel'}}
  },
  // Long Đế Hư Không: nebula and starfield.
  eclipse:{
    'Nhật Thực':{fx:'eclipseburst',move:'volley',bolt:'eclipseorb',pose:'buffet',sounds:{start:'starshards-start',hit:'starshards-hit'}},
    'Hư Không Phán Quyết':{fx:'voidseam',move:'bite',pose:'bite',sounds:{start:'voidseam-start',hit:'voidseam-hit'}},
    'Tinh Vân Bạo Phát':{fx:'nebulafire',move:'breath',pose:'bite',sounds:{start:'nebulafire-start',hit:'nebulafire-hit'}},
    'Hố Đen Nuốt Chửng':{fx:'galaxy',move:'vortex',channel:{fx:'voidorb',at:'mouth',ms:1200,size:0.7},beats:5,size:1.0,core:'voidorb',sounds:{start:'galaxy-start',hit:'galaxy-hit',channel:'voidorb-channel'}}
  },
  // Thụ Vương Bạch Hoa: silver birch and spring petals.
  elderbloom:{
    'Chưởng Rễ Đâm Xuyên':{fx:'rootstab',move:'lunge',pose:'palm',sounds:{start:'rootspears-start',hit:'rootspears-hit'}},
    'Vỏ Cây Bạch Hoa':{fx:'blossomsigil',move:'sigil',channel:{fx:'sapglow',at:'body',ms:700,size:0.6},sounds:{start:'birchbark-start',lock:'birchbark-lock',channel:'sapglow-channel'}},
    'Gọi Vệ Rễ':{fx:'rootguard',move:'summon',channel:{fx:'sapglow',at:'body',ms:700,size:0.6},sounds:{start:'rootcircle-grow',channel:'rootcircle-channel'}},
    'Nở Hoa Ký Sinh':{fx:'parasite',move:'snare',channel:{fx:'sapglow',at:'body',ms:700,size:0.6},sounds:{start:'pollenbloom-start',hit:'pollenbloom-hit',channel:'pollenbloom-channel'}},
    'Mùa Xuân Vĩnh Cửu':{plate:'blossomplate',glaze:'#ffc8e6',fx:'springtree',move:'bloom',channel:{fx:'sapglow',at:'body',ms:700,size:0.6},sounds:{start:'springtree-grow',channel:'springtree-channel'}},
    'Thiên Căn Sụp Đổ':{fx:'rootquake',move:'cataclysm',warn:'#f3e6a0',channel:{fx:'sapglow',at:'body',ms:1100,size:0.9},size:1.45,beats:3,sounds:{start:'rootquake-start',hit:'rootquake-land',channel:'sapglow-channel'}}
  },
  // Bạo Chúa Tâm Nham: obsidian and sulfur.
  cinderheart:{
    'Song Quyền Nham Chấn':{fx:'fistwave',move:'lunge',pose:'punch',sounds:{start:'fistwave-start',hit:'fistwave-hit'}},
    'Giáp Huyền Nham':{fx:'obsidianshell',move:'shell',channel:{fx:'corefire',at:'body',ms:700,size:0.6},sounds:{start:'columns-start',lock:'columns-lock',channel:'corefire-channel'}},
    'Gọi Quỷ Lò':{fx:'lavajet',move:'summon',channel:{fx:'corefire',at:'body',ms:700,size:0.6},sounds:{start:'vent-grow',channel:'vent-channel'}},
    'Nung Chảy Phòng Tuyến':{fx:'spikeline',move:'sweep',channel:{fx:'corefire',at:'body',ms:700,size:0.6},sounds:{start:'spikeline-start',hit:'spikeline-land',channel:'spikeline-channel'}},
    'Mưa Tro Tàn':{fx:'cinderhit',move:'rain',bolt:'cinderdrop',pose:'cast',sounds:{start:'pumice-start',hit:'pumice-hit'}},
    'Trái Tim Phun Trào':{fx:'geyser',move:'cataclysm',warn:'#ff5a1a',channel:{fx:'corefire',at:'body',ms:1100,size:0.9},size:1.45,beats:3,sounds:{start:'geyser-start',hit:'geyser-hit',channel:'geyser-channel'}}
  },
  // Nữ Đế Băng Tinh: glacier and aurora.
  frostregent:{
    'Băng Thương Tam Liên':{fx:'lancehit',move:'volley',bolt:'icelance',channel:{fx:'sceptrefrost',at:'front',ms:750,size:0.5},sounds:{start:'icicle-start',hit:'icicle-hit',channel:'sceptrefrost-channel'}},
    'Kính Băng Phản Chiếu':{fx:'icemirror',move:'mirror',channel:{fx:'sceptrefrost',at:'front',ms:750,size:0.5},sounds:{start:'icemirror-start',lock:'icemirror-lock',channel:'icemirror-channel'}},
    'Gọi Hầu Cận Băng':{fx:'icepillar',move:'summon',channel:{fx:'sceptrefrost',at:'front',ms:750,size:0.5},sounds:{start:'icepillars-grow',channel:'sceptrefrost-channel'}},
    'Vương Miện Hàn Ngục':{fx:'iceprison',move:'bind',upright:true,channel:{fx:'sceptrefrost',at:'front',ms:750,size:0.5},size:1.3,sounds:{start:'aurorabeam-start',hit:'aurorabeam-hit',channel:'aurorabeam-channel'}},
    'Mưa Tinh Thể':{fx:'hail',move:'rain',channel:{fx:'sceptrefrost',at:'front',ms:750,size:0.5},sounds:{start:'hail-start',hit:'hail-hit',channel:'hail-channel'}},
    'Tuyết Táng Vĩnh Dạ':{fx:'glacierdrop',move:'drop',channel:{fx:'sceptrefrost',at:'front',ms:1100,size:0.5},size:1.5,sounds:{start:'glacierspire-start',hit:'glacierspire-hit',channel:'glacierspire-channel'}}
  },
  // Sư Ưng Lôi Hoàng: plasma and black storm feathers.
  tempestwing:{
    'Lôi Trảo Liên Kích':{fx:'plasmaclaw',move:'lunge',size:1.3,pose:'claw',sounds:{start:'plasmaclaw-start',hit:'plasmaclaw-hit'}},
    'Lông Vũ Thiên Lôi':{fx:'stormcrown',move:'crown',sounds:{start:'stormfeathers-start',lock:'stormfeathers-lock'}},
    'Gọi Vệ Phong':{fx:'windcircle',move:'summon',sounds:{start:'windcircle-grow'}},
    'Sấm Xuyên Tầng Mây':{ember:'#cfe8ff',fx:'plasmaball',move:'jet',stream:'boltcone',pose:'claw',sounds:{start:'plasmaball-start',hit:'plasmaball-hit'}},
    'Mắt Bão Cướp Linh':{fx:'stormeye',move:'bind',size:1.3,sounds:{start:'stormeye-start',hit:'stormeye-hit'}},
    'Thiên Phạt Cửu Lôi':{fx:'judgement',move:'stormcall',pose:'fly',beats:9,sounds:{start:'judgement-start',hit:'judgement-hit'}}
  },
  // Cai Ngục Vong Đăng: rust and ghostfire.
  souljailer:{
    'Liềm Cắt Hồn':{into:-.2,fx:'scythewheel',move:'lunge',pose:'swing',sounds:{hit:'ghostscythe-hit'}},
    'Lồng Đèn U Minh':{fx:'cagedrop',move:'cage',channel:{fx:'lanternglow',at:'front',ms:700,size:0.5},sounds:{start:'cage-start',lock:'cage-lock',channel:'lanternglow-channel'}},
    'Gọi Hồn Canh Ngục':{fx:'chaincircle',move:'summon',channel:{fx:'lanternglow',at:'front',ms:700,size:0.5},sounds:{start:'chaincircle-grow',channel:'chaincircle-channel'}},
    'Xiềng Xích Hút Sinh':{fx:'chainknot',move:'tether',pose:'swing',sounds:{start:'chainknot-start',hit:'chainknot-hit'}},
    'Tế Lễ Ngục Đăng':{fx:'ghostpillars',move:'snare',channel:{fx:'lanternglow',at:'front',ms:700,size:0.5},sounds:{start:'ghostpillars-start',hit:'ghostpillars-hit',channel:'ghostpillars-channel'}},
    'Đại Thu Hồn':{fx:'cageslam',move:'cataclysm',warn:'#6dffb0',channel:{fx:'lanternglow',at:'front',ms:1100,size:0.7},size:1.7,beats:3,sounds:{start:'cageslam-start',hit:'cageslam-hit',channel:'cageslam-channel'}}
  },
  // Lão Vương Bào Tử: rot and bioluminescence.
  sporefather:{
    'Gậy Nấm Hoại Sinh':{fx:'rotslam',move:'punch',pose:'smash',ground:0.8,sounds:{start:'rotslam-start',hit:'rotslam-land'}},
    'Mũ Nấm Tái Sinh':{fx:'fungus',move:'spots',channel:{fx:'gillglow',at:'head',ms:700,size:0.5},sounds:{start:'shelves-start',lock:'shelves-lock',channel:'gillglow-channel'}},
    'Gọi Nấm Con':{fx:'sprouts',move:'summon',channel:{fx:'gillglow',at:'head',ms:700,size:0.5},sounds:{start:'sprouts-grow',channel:'gillglow-channel'}},
    'Mưa Bào Tử Lục':{fx:'sporepod',move:'rain',channel:{fx:'gillglow',at:'head',ms:700,size:0.5},sounds:{start:'sporepod-start',hit:'sporepod-hit',channel:'sporepod-channel'}},
    'Hấp Thu Hoại Chất':{fx:'threads',move:'tether',channel:{fx:'gillglow',at:'head',ms:700,size:0.5},sounds:{start:'threads-start',hit:'threads-hit',channel:'threads-channel'}},
    'Đại Dịch Nở Hoa':{fx:'bloomrot',move:'snare',channel:{fx:'gillglow',at:'head',ms:1100,size:0.8},size:1.45,beats:3,sounds:{start:'bloomrot-start',hit:'bloomrot-hit',channel:'gillglow-channel'}}
  },
  // Huyền Quy Tinh Thành: castle masonry.
  prismback:{
    'Chấn Địa Tinh Nham':{fx:'bricks',move:'sweep',pose:'stomp',sounds:{start:'bricks-start',boom:'bricks-boom',hit:'bricks-land'}},
    'Tái Kết Mai Thành':{fx:'rampart',move:'rampart',channel:{fx:'crystalglow',at:'head',ms:700,size:0.5},sounds:{start:'wall-start',lock:'wall-lock',channel:'crystalglow-channel'}},
    'Gọi Vệ Tinh Thành':{fx:'towers',move:'summon',channel:{fx:'crystalglow',at:'head',ms:700,size:0.5},sounds:{start:'towers-grow',channel:'towers-channel'}},
    'Pháo Lăng Kính':{ember:'#fff2b0',fx:'cannonblast',move:'jet',pose:'cannon',stream:'prismcone',channel:{fx:'crystalglow',at:'head',ms:700,size:0.5},sounds:{start:'cannonblast-start',hit:'cannonblast-hit',channel:'cannonblast-channel'}},
    'Cộng Hưởng Nghịch Chấn':{fx:'quakering',move:'roar',pose:'stomp',sounds:{start:'quakering-start',boom:'quakering-boom',hit:'quakering-hit'}},
    'Thiên Thành Sụp Đổ':{fx:'towerfall',move:'drop',channel:{fx:'crystalglow',at:'head',ms:1100,size:0.8},size:1.55,sounds:{start:'collapse-start',hit:'collapse-hit',channel:'collapse-channel'}}
  },
  // Sa Vương Thời Luân: hourglass and time ripples.
  sandchronarch:{
    'Sa Nhận Phân Kỳ':{fx:'sandblade',move:'volley',pose:'sweep',sounds:{start:'sandblade-start',hit:'sandblade-hit'}},
    'Vành Sa Lậu':{fx:'sandsaturn',move:'saturn',channel:{fx:'sandglass',at:'body',ms:700,size:0.5},sounds:{start:'sandring-start',lock:'sandring-lock',channel:'sandglass-channel'}},
    'Gọi Ảnh Sa Vệ':{fx:'sandguard',move:'summon',channel:{fx:'sandglass',at:'body',ms:700,size:0.5},sounds:{start:'sandpillar-grow',channel:'sandpillar-channel'}},
    'Đảo Chiều Tinh Sa':{plate:'clockplate',glaze:'#9ff0e6',fx:'reverse',move:'bloom',channel:{fx:'sandglass',at:'body',ms:700,size:0.5},sounds:{start:'reverse-grow',channel:'reverse-channel'}},
    'Lãi Suất Thời Gian':{fx:'clockripple',move:'tether',channel:{fx:'sandglass',at:'body',ms:700,size:0.5},sounds:{start:'clockripple-start',hit:'clockripple-hit',channel:'clockripple-channel'}},
    'Chung Mạt Thời Luân':{fx:'sandfall',move:'tempest',channel:{fx:'sandglass',at:'body',ms:1200,size:0.8},cloud:'timewheel',cloudAt:'around',beats:5,pose:'cast',sounds:{start:'sandbeam-start',hit:'sandbeam-hit',channel:'sandbeam-channel'}}
  },
  // Long Vương Châu Triều: ink tide and pearl.
  coraltide:{
    'Song Trảo Sóng Ngọc':{into:-.2,fx:'inkclaws',move:'lunge',size:1.3,pose:'rake',sounds:{start:'inkclaws-start',hit:'inkclaws-hit'}},
    'Kết Giới Trân Châu':{fx:'clam',move:'backdrop',channel:{fx:'pearlglow',at:'head',ms:700,size:0.5},sounds:{start:'pearlwall-start',lock:'pearlwall-lock',channel:'pearlglow-channel'}},
    'Gọi San Hô Hộ Triều':{fx:'coralgrow',move:'summon',channel:{fx:'pearlglow',at:'head',ms:700,size:0.5},sounds:{start:'coralgrow-grow',channel:'coralgrow-channel'}},
    'Nghịch Lưu Rút Linh':{fx:'inkwhirl',move:'tether',mote:'pearlmote',channel:{fx:'pearlglow',at:'head',ms:700,size:0.5},sounds:{start:'inkwhirl-start',hit:'inkwhirl-hit',channel:'inkwhirl-channel'}},
    'Trăng Triều Hồi Sinh':{fx:'pearlspring',move:'rise',channel:{fx:'pearlglow',at:'head',ms:700,size:0.5},size:1.6,sounds:{start:'pearlspring-grow',channel:'pearlspring-channel'}},
    'Vạn Trượng Hải Triều':{stage:1.15,fx:'inkwave',move:'sweep',channel:{fx:'pearlglow',at:'head',ms:1100,size:0.8},size:2.1,beats:3,sounds:{start:'inkwave-start',hit:'inkwave-hit',channel:'inkwave-channel'}}
  },
  // Lang Vương Tử Nguyệt: blood moon and steel.
  moonfang:{
    'Nguyệt Kiếm Tam Trảm':{cuts:[2,3,2],into:-.15,fx:'starcut',move:'lunge',pose:'cut',sounds:{start:'tricut-start',hit:'tricut-hit'}},
    'Giáp Tử Nguyệt':{fx:'crescentguard',move:'crescent',channel:{fx:'bloodmoon',at:'head',ms:700,size:0.5},sounds:{start:'steelward-start',lock:'steelward-lock',channel:'bloodmoon-channel'}},
    'Song Ảnh Lang':{fx:'twinflames',move:'summon',channel:{fx:'bloodmoon',at:'head',ms:700,size:0.5},shadows:true,sounds:{start:'twinflames-grow',channel:'twinflames-channel'}},
    'Kiếm Ảnh Truy Hồn':{fx:'shadowx',move:'vanish',pose:'draw',sounds:{start:'shadowx-start',hit:'shadowx-hit'}},
    'Trăng Máu Hút Sinh':{drain:'#ff3a4a',fx:'fangs',move:'pincer',pose:'draw',sounds:{start:'fangs-start',hit:'fangs-hit'}},
    'Tử Nguyệt Chung Kiếm':{fx:'moonblade',move:'charge',pose:'draw',channel:{fx:'bloodmoon',at:'head',ms:1200,size:0.8},sounds:{start:'moonblade-start',hit:'moonblade-hit',channel:'moonblade-channel'}}
  }
};
function bossSkillLook(skill){
  const owner=foeSkillOwner();if(!owner||owner.tier!=='boss'||!skill?.name)return null;
  return BOSS_SKILL_LOOKS[owner.boss]?.[skill.name]||null;
}
function bossSkillSound(cue,options={}){
  const owner=foeSkillOwner();if(!cue||!owner)return;
  playCastSound('bossfx-'+owner.boss,cue,{volume:.3,pan:.25,...options});
}
// The foe's drawn body on the stage (its sheet's span, feet line and height), not its cell.
function foeBody(){
  const cell=actor('enemy').getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  const look=spriteDefinition('enemy',state.enemyKey,'idle').sheet,span=look.span||[.15,.85],foot=look.footY||.94,crown=Math.max(0,foot-(look.bodyHeight||.75));
  const left=cell.left-scene.left+cell.width*span[0],right=cell.left-scene.left+cell.width*span[1];
  const top=cell.top-scene.top+cell.height*crown,bottom=cell.top-scene.top+cell.height*foot;
  return {left,right,top,bottom,width:right-left,height:bottom-top,x:(left+right)/2,y:(top+bottom)/2};
}
// Plays one strip; a looping strip lives until stop(). behind:true draws it behind the actors;
// frame:n holds one frame (a beam stretches it along its length); from:n starts the strip at frame n;
// flip:'x' or 'y' mirrors it (the other half of a closing pair).
function foeFx(sheet,point,size,{loop=false,rotate=0,duration=0,z=6,behind=false,squash=1,frame=null,stretch=1,flip='',from=0}={}){
  // Never past the stage: a sheet that would cross the HUD line at the top keeps its bottom edge and
  // shrinks; one crossing a side shrinks about its centre (never below half its size).
  if(stretch===1&&!rotate&&!foeNoFit&&$('scene')){
    if(foeUltLesser)size*=.68;
    const W=$('scene').clientWidth,min=size*.5;let s=size,y=point.y;
    if(!foeNoFit&&y-s*squash/2<40){const bottom=y+s*squash/2;s=Math.max(min,(bottom-40)/squash);y=bottom-s*squash/2;}
    const side=Math.min(point.x,W-point.x)*2;if(s>side)s=Math.max(min,side);
    if(s!==size){point={x:point.x,y};size=s;}
  }
  const node=document.createElement('span');node.className='foe-fx';node.setAttribute('aria-hidden','true');
  node.style.cssText=`left:${point.x}px;top:${point.y}px;width:${size*stretch}px;height:${size*squash}px;z-index:${behind?1:z};--fx-count:${sheet.count};background-image:url('${sheet.src}');rotate:${rotate}deg`;
  if(flip)node.style.scale=flip==='x'?'-1 1':'1 -1';
  foeTint(node);
  (behind?$('scene'):$('combatEffects')).append(node);
  const at=n=>`${n/(sheet.count-1)*100}% 0`;
  if(frame!==null){node.style.backgroundPosition=at(frame);return {node,stop(){node.remove();}};}
  const run=node.animate([{backgroundPosition:at(from)},{backgroundPosition:'100% 0'}],{duration:duration||(sheet.count-from)*sheet.frameDuration,easing:`steps(${sheet.count-from},jump-none)`,iterations:loop?Infinity:1});
  if(!loop)run.finished.then(()=>node.remove(),()=>node.remove());
  return {node,stop(){run.cancel();node.remove();}};
}
// One hit of a foe skill landing on the hero: same rules and feedback as a basic attack.
function foeSkillContact(raw,ledger,index,strong,pending,{knock=1,own=false}={}){
  const direction=-1,evade=noctEvades('hero'),result=damage('enemy',raw,ledger);
  if(evade)noctDodge(direction,pending);
  else{
    combatVoice('hero','hurt');hitAccents('enemy',result,false,pending);
    // A boss skill with its own look lands with its own sheet and recording only (no shared hit star or synthesized hit).
    combatV3Action('hero','hurt',strong?560:410);if(!own){combatV3HitSound(state.enemyKey,strong);combatV3Impact('hero',state.enemyKey,direction,strong,pending);}
    combatV3Camera(direction,strong,state.boss,pending);
    const recoil=combatOuterMotion('hero',(strong?14:8)*knock,strong?6:3);
    pending.push(animate(actor('hero'),[{translate:'0 0'},{translate:`${direction*recoil.distance}px -3px`,offset:.3},{translate:'0 0'}],{duration:320*Math.min(1.6,knock),easing:'cubic-bezier(.2,.8,.35,1)'}));
  }
  combatV3Number('hero',result.amount?'-'+result.amount:'CHẶN '+result.blocked,result.amount?'damage':'armor',index,pending);
  return result;
}

// ---- Moves ------------------------------------------------------------------------------------
// Geometry shared by the moves: where the foe's drawn body reaches, its mouth, the hero's front.
function foeGeometry(){
  const source=combatV3Point('enemy'),target=combatV3Point('hero'),span=spriteDefinition('enemy',state.enemyKey,'attack').sheet.span||[.15,.85];
  const front=source.x-source.width*(.5-span[0]),heroFront=target.x+target.width*.3;
  return {source,target,body:Math.max(target.width,target.height),travel:Math.max(0,front-heroFront),mouth:{x:front+source.width*.04,y:source.y-source.height*.16}};
}
// A standing effect: each placement plays the sheet ({at,size} plus foeFx options, blend, opacity,
// clip and a delay before it), the ward locks at its third frame (lock sound, hits), and the last frames
// stand a moment and fade (hold ms; 0 lets them end on their own).
function foeLayer(fx,p){if(p.blend)fx.node.style.mixBlendMode=p.blend;if(p.opacity!=null)fx.node.style.opacity=p.opacity;if(p.clip)fx.node.style.clipPath=p.clip;return fx;}
// A boss whose sheets were painted in the wrong light for its body (BOSS_TINT: a CSS filter) has every
// sheet of its skills tinted: the thunder griffin's bolts blue-white instead of copper, the seraph's
// light gold instead of icy blue. A tint ending in 'cycle' also sweeps through the hues (a prism).
const BOSS_TINT={tempestwing:'hue-rotate(185deg) saturate(1.15) brightness(1.08)',seraph:'sepia(.55) saturate(2.1) hue-rotate(-12deg) brightness(1.08)'};
const BOSS_TINT_SKILLS={};
let foeCurrentSkill='',foeUltLesser=false,foeNoFit=false;
function foeTint(node){
  const boss=foeSkillOwner()?.boss,tint=BOSS_TINT_SKILLS[boss]?.[foeCurrentSkill]||BOSS_TINT[boss];if(!tint||reduced)return;
  if(tint==='cycle')node.animate([{filter:'hue-rotate(0deg) saturate(1.5)'},{filter:'hue-rotate(360deg) saturate(1.5)'}],{duration:800,iterations:Infinity});
  else node.style.filter=tint;
}
function foeHoldAll(c,placements,hold){
  for(const p of placements){
    const fx=foeLayer(foeFx(c.sheet,p.at,p.size,{...p,frame:c.sheet.count-1}),p),from=p.opacity??1;
    c.pending.push(animate(fx.node,[{opacity:from},{opacity:from,offset:.6},{opacity:0}],{duration:hold,easing:'ease-in'}).finally(()=>fx.stop()));
  }
}
async function foeStand(c,placements,{per=140,hold=900}={}){
  await c.cast();
  for(const p of placements){if(p.delay)await combatV3Wait(p.delay);foeLayer(foeFx(c.sheet,p.at,p.size,{...p,duration:c.sheet.count*per}),p);}
  await combatV3Wait(per*3);c.sound('lock');
  for(let i=0;i<c.hits;i++)c.contact(i);
  await combatV3Wait(per*3-20);
  if(hold){foeHoldAll(c,placements,hold);await combatV3Wait(300);}
}
const foePose=(transform,ms,easing='cubic-bezier(.2,.8,.3,1)')=>combatV3Pose(actor('enemy'),transform,ms,easing);
// A heavy blow's anticipation: the boss settles into its wind-up pose (frame of its action sheet), drawn
// back from the hero (at: where it stands, px left of home), and holds there quivering with the loaded
// weight before it lets go.
async function foeWindup(c,p,frame,{ms=460,at=0}={}){
  setSpriteFrame('enemy',p,frame);await foePose(`translate(${Math.min(4,16-at)}px,2px)`,240*c.pace,'cubic-bezier(.3,.6,.3,1)');
  const quiver=actor('enemy').animate([{translate:'0 0'},{translate:'1.5px -1px'},{translate:'-1.5px 0'},{translate:'0 0'}],{duration:120,iterations:Infinity});
  await combatV3Wait(ms*c.pace);quiver.cancel();
}
// How far left the boss must stand (px, a translate x) for the front of a pose frame (its claw, blade,
// jaws or fist: build.py front) to reach into the hero; the boss's art is measured where it stands now.
function foeReachX(c,pose,frame,into=.12){
  const el=actor('enemy').querySelector('.sprite-body'),{sheet}=spriteDefinition('enemy',state.enemyKey,pose),front=sheet.front?.[frame];
  if(!el||!front)return -c.g.travel;
  // The pose's own box in the actor's cell at its home spot (layout, without the move's translate), stepped
  // in as it would be drawn (spriteInset).
  const root=actor('enemy'),cell=root.offsetWidth,poseBox=spriteBox('enemy',state.enemyKey,sheet);
  const w=cell*poseBox.width,left=root.offsetLeft+poseBox.left*cell-spriteInset(el,sheet,poseBox);
  const at=left+w*front[0],want=c.g.target.x+c.g.target.width*into;
  return Math.min(0,want-at);
}
// The largest a sheet standing on the hero's ground (its ground line at fraction g of the cell) may be
// drawn so its top stays under the HUD and its sides inside the stage.
function foeFitSize(size,x,foot,g=.8){
  const W=$('scene').clientWidth;return Math.max(40,Math.min(size,(foot-40)/Math.max(.3,g),2*Math.max(20,x),2*Math.max(20,W-x)));
}
// The blow lands: a hard double shake and a short hit-stop so the contact reads.
async function foeImpact(c,ms=110){combatV3Camera(-1,true,true,c.pending);combatV3Camera(-1,true,true,c.pending);await combatV3Wait(ms);}
// A ghost of the boss in one pose of its action sheet, standing at a point of the stage (an afterimage
// of a blink attack); facing:1 turns it round to strike from the hero's far side.
function foeGhost(pose,frame,at,{facing=0,opacity=.85,ms=360}={}){
  const {sheet}=spriteDefinition('enemy',state.enemyKey,pose),body=actor('enemy').querySelector('.sprite-body'),box=body.getBoundingClientRect(),scale=(sheet.scale||1)/(+body.dataset.scale||1)**2;
  const w=box.width*scale,h=box.height*scale,ghost=document.createElement('span');ghost.className='foe-ghost';ghost.setAttribute('aria-hidden','true');
  ghost.style.cssText=`position:absolute;pointer-events:none;z-index:7;left:${at.x}px;top:${at.y}px;width:${w}px;height:${h}px;translate:-50% -${(sheet.footY||.94)*100}%;background:url('${sheet.src}') ${spriteCellPosition(sheet,frame)}/${sheet.cols*100}% ${sheet.rows*100}% no-repeat;${facing?'scale:-1 1;':''}filter:drop-shadow(0 0 6px #fff6)`;
  $('combatEffects').append(ghost);
  return animate(ghost,[{opacity:0},{opacity,offset:.15},{opacity,offset:.6},{opacity:0,filter:'blur(3px)'}],{duration:ms,easing:'ease-out'}).finally(()=>ghost.remove());
}
const FOE_MOVES={
  // Lunge: dash to the hero and strike in place (claws, bites, blades).
  // Each blow is the boss's own: it closes in, draws back (the sheet's wind-up frame) and holds, then
  // strikes; between blows it draws back again, more briefly.
  async lunge(c){
    const p=c.pose('attack'),near=-foeReachX(c,p,3)-30;setSpriteFrame('enemy',p,0);await foePose(`translate(${-near}px,-4px)`,260*c.pace,'cubic-bezier(.3,.6,.2,1)');
    // One blow: wind-up (frame 1) held, then the cut (frame 3). Several: the sheet is a combo, its cuts
    // (frames 2, 3, 4) one after another after one wind-up. The pose shows before the hit lands.
    for(let i=0;i<c.hits;i++){
      if(!i||c.hits<3)await foeWindup(c,p,1,{ms:i?240:440,at:near});
      const hit=c.look.cuts?.[i%c.look.cuts.length]??(c.hits>2?2+i%3:3),reach=foeReachX(c,p,hit,c.look.into??.12);
      setSpriteFrame('enemy',p,hit);await foePose(`translate(${reach}px,-2px)`,130*c.pace,'cubic-bezier(.6,0,.9,.5)');
      await combatV3Wait(90);
      foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.12,y:c.g.target.y-c.g.target.height*(.05+.08*(i%2))},c.g.body*.85*c.size*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.7,rotate:i%2?20:-15});
      c.contact(i,{knock:i===c.hits-1?1.5:1});await foeImpact(c,i===c.hits-1?200:150);
    }
    await combatV3Wait(380);setSpriteFrame('enemy',p,4);await combatV3Wait(200);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',420);
  },
  // Charge: a long wind-up, then a blurred rush that bowls through the hero.
  async charge(c){
    await foeWindup(c,c.pose('attack'),1,{ms:520,at:-10});
    const enemy=actor('enemy');enemy.style.filter='blur(1.2px)';
    for(let k=1;k<=3;k++)foeFx(c.sheet,{x:c.g.source.x-c.g.travel*k/4,y:c.g.target.y+c.g.target.height*.12},c.g.body*.6*c.scale,{squash:.6,duration:420});
    setSpriteFrame('enemy',c.pose('attack'),3);await foePose(`translate(${-c.g.travel-24}px,0)`,150*c.pace,'cubic-bezier(.5,0,.8,.6)');
    enemy.style.filter='';foeFx(c.sheet,{x:c.g.target.x,y:c.g.target.y},c.g.body*1.25*c.scale);
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:1.8});
    await foeImpact(c,160);setSpriteFrame('enemy',c.pose('attack'),4);await combatV3Wait(260);setSpriteFrame('enemy',c.pose('attack'),5);await foePose('translate(0,0)',380);
  },
  // Slam: leap into the air and crash down in front of the hero; a ground shockwave erupts.
  async slam(c){
    const p=c.pose('attack');await foeWindup(c,p,1,{ms:380});
    setSpriteFrame('enemy',p,2);await foePose(`translate(${-c.g.travel*.8}px,${-c.g.source.height*.34}px)`,300*c.pace,'cubic-bezier(.2,.7,.4,1)');
    await combatV3Wait(160);
    setSpriteFrame('enemy',p,3);await foePose(`translate(${-c.g.travel*.85}px,0)`,110,'cubic-bezier(.6,0,1,.6)');
    foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.1,y:c.g.target.foot-c.g.body*.12},c.g.body*1.7*c.scale,{squash:.55});
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:1.4});
    await foeImpact(c,180);await combatV3Wait(200);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',400);
  },
  // Breath: a stream of the boss's effect pours from its mouth across the arena.
  async breath(c){
    // Inhale (the pose drawn back, held), then the breath leaves the open mouth of the exhaling pose
    // (its mouth anchors when it has them) and rolls out to the hero in a widening stream.
    const p=c.pose('attack'),open=c.look.pose==='breathe'?4:3;
    await foeWindup(c,p,c.look.pose==='breathe'?2:1,{ms:480});setSpriteFrame('enemy',p,open);await foePose('translate(-6px,2px)',120);
    const from=foeMouthNow()||c.g.mouth,to={x:c.g.target.x,y:c.g.target.y-c.g.target.height*.05},count=12,per=Math.ceil(count/Math.max(1,c.hits));
    for(let k=0;k<count;k++){
      const t=(k+1)/count;if(k===6&&c.look.pose==='breathe')setSpriteFrame('enemy',p,5);
      foeFx(c.sheet,{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t+Math.sin(k*1.7)*5*t},c.g.body*(.22+.8*t)*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.8,rotate:k*37});
      if(c.hits&&(k%per===per-1||k===count-1)&&Math.floor(k/per)<c.hits)c.contact(Math.floor(k/per));
      await combatV3Wait(55*c.pace);
    }
    combatV3Camera(-1,true,true,c.pending);await combatV3Wait(c.sheet.count*c.sheet.frameDuration*.8+120);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',300);
  },
  // Volley: shards of the effect fly in arcs from the caster and burst on contact.
  async volley(c){
    await c.cast();await combatV3Wait(200*c.pace);
    for(let i=0;i<c.hits;i++){
      const spot={x:c.g.target.x+(Math.random()-.5)*c.g.target.width*.25,y:c.g.target.y-c.g.target.height*(.05+Math.random()*.15)};
      const start=foeMouthNow()||{x:c.g.source.x-c.g.source.width*.25,y:c.g.source.y-c.g.source.height*.12},angle=Math.atan2(spot.y-start.y,spot.x-start.x)*180/Math.PI;
      const fly=c.extra('bolt')||c.sheet,bolt=foeFx(fly,start,c.g.body*(c.look.bolt?.7:.42)*c.scale,{loop:true,rotate:angle+180,duration:fly.count*fly.frameDuration*.6,z:7});
      combatV3Whoosh(state.enemyKey,false,150);
      await animate(bolt.node,[{left:start.x+'px',top:start.y+'px'},{left:(start.x+spot.x)/2+'px',top:(start.y+spot.y)/2-c.g.target.height*(.25+.1*(i%2))+'px',offset:.5},{left:spot.x+'px',top:spot.y+'px'}],{duration:260*c.pace,easing:'cubic-bezier(.35,.1,.6,1)'});
      bolt.stop();foeFx(c.sheet,spot,c.g.body*.85*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.7});
      c.contact(i);if(i<c.hits-1)await combatV3Wait(60*c.pace);
    }
    await combatV3Wait(200);
  },
  // Beam: a charge gathers at the foe, then a long ray of the effect cuts across to the hero.
  async beam(c){
    await c.cast();
    const muzzle=foeMouthNow()||c.g.mouth,gather=foeFx(c.sheet,muzzle,c.g.body*.5*c.scale,{loop:true,duration:c.sheet.count*c.sheet.frameDuration*.5});
    await animate(gather.node,[{scale:'.3',opacity:.4},{scale:'1.2',opacity:1}],{duration:420});gather.stop();
    const from=muzzle,to={x:c.g.target.x,y:c.g.target.y-c.g.target.height*.08},dx=to.x-from.x,dy=to.y-from.y,len=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI,thick=c.g.body*.42*c.scale*c.size;
    const ray=foeFx(c.sheet,{x:(from.x+to.x)/2,y:(from.y+to.y)/2},thick,{frame:Math.floor(c.sheet.count/2),stretch:len/thick,rotate:angle,z:7});
    c.pending.push(animate(ray.node,[{opacity:0,scale:'1 .2'},{opacity:1,scale:'1 1.15',offset:.15},{opacity:1,scale:'1 .8',offset:.6},{opacity:0,scale:'1 .1'}],{duration:620+Math.max(0,c.hits-1)*110}).finally(()=>ray.stop()));
    foeFx(c.sheet,to,c.g.body*1.3*c.scale*c.size);combatV3Camera(-1,true,true,c.pending);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.3});if(i<c.hits-1)await combatV3Wait(90);}
    await combatV3Wait(420);
  },
  // Eruption: the effect bursts out of the ground under the hero.
  async eruption(c){
    await c.cast();await combatV3Wait(220*c.pace);
    for(let i=0;i<c.hits;i++){
      const last=i===c.hits-1,spot={x:c.g.target.x+(Math.random()-.5)*c.g.target.width*.25,y:c.g.target.y-c.g.target.height*(.05+Math.random()*.15)};
      foeFx(c.sheet,spot,c.g.body*(last?1.35:1.05)*c.scale);
      await combatV3Wait(c.sheet.frameDuration*2.6*c.pace);c.contact(i);
      if(!last)await combatV3Wait(140*c.pace);
    }
    await combatV3Wait(200);
  },
  // Rain: the effect falls from the sky onto the hero, one piece per hit.
  async rain(c){
    await c.cast();await combatV3Wait(240*c.pace);
    for(let i=0;i<c.hits;i++){
      const spot={x:c.g.target.x+(Math.random()-.5)*c.g.target.width*.5,y:c.g.target.y-c.g.target.height*(Math.random()*.2)},sky={x:spot.x+30,y:-c.g.body*.4};
      const fall=c.extra('bolt')||c.sheet,drop=foeFx(fall,sky,c.g.body*(c.look.bolt?.6:.5)*c.scale,{loop:true,rotate:c.look.bolt?-85:200,duration:fall.count*fall.frameDuration*.5,z:7});
      // It shows whole under the HUD, then falls.
      await animate(drop.node,[{left:sky.x+'px',top:sky.y+'px',opacity:0},{opacity:1,offset:.2},{left:spot.x+'px',top:spot.y+'px'}],{duration:240*c.pace,easing:'cubic-bezier(.55,0,1,.45)'});
      drop.stop();foeFx(c.sheet,spot,c.g.body*.95*c.scale,{duration:c.sheet.count*c.sheet.frameDuration*.7});
      c.contact(i);await combatV3Wait(70*c.pace);
    }
    await combatV3Wait(220);
  },
  // Roar: the foe bellows; a ring of its effect swells around it and a shockwave rolls along the ground.
  async roar(c){
    // look.windup / look.release: the frames of its pose that load and let go (a core charging, palms thrust).
    await foeWindup(c,c.pose('attack'),c.look.windup??1,{ms:c.look.windup?620:420});setSpriteFrame('enemy',c.pose('attack'),c.look.release??3);c.sound('boom',{volume:.42});
    c.pending.push(animate(actor('enemy'),[{translate:'0 0'},{translate:'3px -2px'},{translate:'-3px 1px'},{translate:'2px -1px'},{translate:'0 0'}],{duration:520}));
    const ring=foeFx(c.sheet,c.g.mouth,c.g.body*.6*c.scale*c.size,{duration:520});
    c.pending.push(animate(ring.node,[{scale:'.5',opacity:1},{scale:'2.4',opacity:0}],{duration:560,easing:'ease-out'}));
    combatV3Camera(-1,true,state.boss,c.pending);await combatV3Wait(160);
    if(c.hits){
      const feet=foeBody(),wave=foeFx(c.sheet,{x:feet.left+feet.width*.2,y:c.g.target.foot-c.g.body*.18},c.g.body*.9*c.scale,{loop:true,squash:.5,duration:c.sheet.count*c.sheet.frameDuration*.6});
      await animate(wave.node,[{left:feet.left+feet.width*.2+'px'},{left:c.g.target.x+'px'}],{duration:300*c.pace,easing:'ease-in'});wave.stop();
      for(let i=0;i<c.hits;i++)c.contact(i);
    }
    await combatV3Wait(300);setSpriteAction('enemy','idle');
  },
  // Tether: a chain of the effect binds the hero and pulls their strength into the foe.
  async tether(c){
    // The chain shoots out link by link from the boss's front point to the hero, pulls taut (held), bites
    // once per hit, then is hauled back in.
    await c.cast();await combatV3Wait(260);
    const from=c.g.target,to=foeMouthNow()||c.g.mouth,links=[];
    const link=c.extra('mote')||c.sheet;for(let k=5;k>=0;k--){const t=k/5;links.push(foeFx(link,{x:from.x+(to.x-from.x)*t,y:from.y-from.height*.05+(to.y-from.y+from.height*.05)*t},c.g.body*.32*c.scale,{loop:true,duration:link.count*link.frameDuration*.5,rotate:k*45}));await combatV3Wait(45);}
    links.reverse();
    for(const link of links)c.pending.push(animate(link.node,[{scale:'1'},{scale:'1.15'},{scale:'1'}],{duration:300}));
    await combatV3Wait(260);
    for(let i=0;i<c.hits;i++){c.contact(i);combatV3Camera(-1,false,true,c.pending);await combatV3Wait(170);}
    for(const [k,link] of links.entries())c.pending.push(animate(link.node,[{opacity:1},{opacity:0,left:to.x+'px',top:to.y+'px'}],{duration:320,delay:k*40,easing:'ease-in'}).finally(()=>link.stop()));
    await combatV3Wait(360);
  },
  // Vanish: the foe dissolves, reappears at the hero's side to strike, and fades back.
  async vanish(c){
    // It draws back and holds, melts away, and is there at the hero's side already swinging: wind-up
    // frame, the cut, a hard shake, the follow-through held, then it melts back home.
    const enemy=actor('enemy'),p=c.pose('attack');await foeWindup(c,p,1,{ms:540});
    foeFx(c.sheet,{x:c.g.source.x,y:c.g.source.y},c.g.body*1.1*c.scale);
    await animate(enemy,[{opacity:1,filter:'blur(0px)'},{opacity:0,filter:'blur(4px)'}],{duration:240});enemy.style.opacity='0';
    await combatV3Wait(200);
    const cut=foeReachX(c,p,3);enemy.style.transform=`translate(${cut+20}px,0)`;setSpriteFrame('enemy',p,2);
    await animate(enemy,[{opacity:0},{opacity:1}],{duration:110});enemy.style.opacity='';
    await combatV3Wait(160);setSpriteFrame('enemy',p,3);await foePose(`translate(${cut}px,0)`,80,'cubic-bezier(.6,0,.9,.5)');
    foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.1,y:c.g.target.y},c.g.body*1.05*c.scale*c.size);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.6});if(i<c.hits-1)await combatV3Wait(110);}
    await foeImpact(c,170);setSpriteFrame('enemy',p,4);await combatV3Wait(320);
    await animate(enemy,[{opacity:1},{opacity:0,filter:'blur(3px)'}],{duration:200});
    enemy.style.transform='';await animate(enemy,[{opacity:0},{opacity:1}],{duration:260});
  },
  // Ward: an armour grows round the foe and locks shut at its peak, stands a moment and fades. The
  // sheet is a hollow ring drawn twice, so the foe stands inside it: whole behind the foe, and its
  // lower arc again in front of the foe's legs.
  async ward(c){
    await c.cast();const body=foeBody(),size=body.height*.95/.66,at={x:body.x,y:body.y+body.height*.03},per=150;
    const ring=front=>{const fx=foeFx(c.sheet,at,size,{duration:c.sheet.count*per,z:6,behind:!front});if(front)fx.node.style.clipPath='inset(64% 0 0 0)';return fx;};
    const back=ring(false),near=ring(true);
    await combatV3Wait(per*3);c.sound('lock');await combatV3Wait(per*3-20);
    const held=[false,true].map(front=>{const fx=foeFx(c.sheet,at,size,{frame:c.sheet.count-1,z:6,behind:!front});if(front)fx.node.style.clipPath='inset(64% 0 0 0)';return fx;});
    back.stop();near.stop();
    for(let i=0;i<c.hits;i++)c.contact(i);
    for(const fx of held)c.pending.push(animate(fx.node,[{opacity:1},{opacity:1,offset:.6},{opacity:0}],{duration:800,easing:'ease-in'}).finally(()=>fx.stop()));
    await combatV3Wait(300);
  },
  // Snare: the effect grows out of the ground under the hero (its ground line at look.ground of the cell),
  // binds the hero and hits at its peak.
  async snare(c){
    await c.cast();await combatV3Wait(180*c.pace);
    const size=foeFitSize(c.g.body*1.25*c.scale*c.size,c.g.target.x,c.g.target.foot,c.ground),per=120;
    foeFx(c.sheet,{x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)},size,{duration:c.sheet.count*per,z:7});
    await combatV3Wait(per*3);
    // look.hold: the effect stays on the ground (its last frame) while it ticks.
    const tick=c.look.hold?320:90;if(c.look.hold)c.pending.push(combatV3Wait(per*3).then(()=>foeHoldAll(c,[{at:{x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)},size,z:7}],tick*c.hits+300)));
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:.4});if(i<c.hits-1)await combatV3Wait(tick);}
    await combatV3Wait(per*3+120);
  },
  // Quake: the foe leaps and crashes down short of the hero, and the ground under the hero erupts (the
  // sheet's ground line at look.ground of the cell).
  async quake(c){
    // Fists (or weight) raised high and held, a leap, and it crashes down short of the hero.
    const p=c.pose('attack');await foeWindup(c,p,2,{ms:560});
    const land=foeReachX(c,p,3,-.15);setSpriteFrame('enemy',p,2);await foePose(`translate(${land*.9}px,${-foeRise(c,p)}px)`,300*c.pace,'cubic-bezier(.2,.7,.4,1)');
    await combatV3Wait(140);
    setSpriteFrame('enemy',p,3);await foePose(`translate(${land}px,0)`,110,'cubic-bezier(.6,0,1,.6)');
    // In an ultimate the landing itself is the climax: its flash lands with the fists.
    if(foeUltLesser){foeUltLesser=false;c.landed=true;foeFlash(c);}
    // The ground takes the giant's whole weight: its crash and its deep boom, loud.
    const size=foeFitSize(c.g.body*1.5*c.scale,c.g.target.x,c.g.target.foot,c.ground),per=110;c.sound('land',{volume:.42});c.sound('boom',{volume:.46});
    foeFx(c.sheet,{x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)},size,{duration:c.sheet.count*per,z:7});
    await foeImpact(c,per*2);
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:1.6});
    await combatV3Wait(per*3);setSpriteFrame('enemy',p,4);await combatV3Wait(200);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',400);
  },
  // Bloom: the effect grows up from the ground behind the foe (heals, summons), and again over the foe
  // as light (screen) so it glows through the foe instead of hiding behind it; hits land at its peak.
  async bloom(c){
    await c.cast();
    const body=foeBody(),size=Math.max(body.width*1.25,body.height*1.1)*1.35*c.size,at={x:body.x-body.width*.15,y:body.bottom-size*(c.ground-.5)},per=150,duration=c.sheet.count*per;
    foeFx(c.sheet,at,size,{duration,behind:true});
    const glow=foeFx(c.sheet,at,size,{duration,z:6});glow.node.style.mixBlendMode='screen';glow.node.style.opacity='.7';
    await combatV3Wait(per*3);
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(per*3);
  },
  // Cataclysm (an ultimate's set piece): the stage darkens, a warning ring grows under the hero and
  // holds, the skill builds in pulses round the hero, then one great burst lands with a white flash, a
  // hard shake and the heaviest hit; its last frame lingers as the stage brightens. look.warn: the ring's
  // colour.
  async cataclysm(c){
    await c.cast();const t=c.g.target,scene=$('scene');
    const dim=document.createElement('span');dim.className='foe-dim';scene.append(dim);
    const warn=document.createElement('span');warn.className='foe-warn';warn.style.cssText=`left:${t.x}px;top:${t.foot}px;width:${Math.min(t.width*1.6,2*(t.x-8))}px;--warn:${c.look.warn||'#ff5a2a'}`;$('combatEffects').append(warn);
    dim.animate([{opacity:0},{opacity:1}],{duration:400,fill:'forwards'});
    await animate(warn,[{opacity:0,scale:'.3'},{opacity:1,scale:'1'}],{duration:420,easing:'ease-out',fill:'forwards'});
    const pulse=warn.animate([{opacity:1},{opacity:.45},{opacity:1}],{duration:260,iterations:Infinity});
    const size=c.g.body*1.2*c.scale,spot=k=>({x:t.x+(k%2?1:-1)*t.width*(.06+.04*k),y:t.foot-size*(c.ground-.5)});
    const build=Math.max(2,c.hits-1);
    for(let i=0;i<build;i++){foeFx(c.sheet,spot(i),size*(.6+.12*i),{duration:c.sheet.count*70,z:7});if(i<c.hits-1)c.contact(i,{knock:.4});combatV3Camera(-1,false,true,c.pending);await combatV3Wait(300*c.pace);}
    await combatV3Wait(260);pulse.cancel();
    const climax=foeLookSheet('climax'),g2=climax?.85:c.ground,big=foeFitSize(c.g.body*(climax?2:1.9)*c.scale*c.size,t.x,t.foot,g2),at={x:t.x,y:t.foot-big*(g2-.5)};
    foeFx(climax||c.sheet,at,big,{duration:(climax||c.sheet).count*120,z:7});await combatV3Wait(330);
    const flash=document.createElement('span');flash.className='foe-flash';scene.append(flash);
    c.pending.push(animate(flash,[{opacity:.45},{opacity:0}],{duration:280,easing:'ease-out'}).finally(()=>flash.remove()));
    if(c.hits)c.contact(c.hits-1,{knock:2.4});await foeImpact(c,220);combatV3Camera(-1,true,true,c.pending);
    warn.remove();await combatV3Wait(110*3);
    if(!climax)foeHoldAll(c,[{at,size:big,z:7}],700);
    c.pending.push(animate(dim,[{opacity:1},{opacity:0}],{duration:600,fill:'forwards'}).finally(()=>dim.remove()));
    await combatV3Wait(420);
  },
  // ---- Body attacks: the boss's own action sheets (look.pose) carry the blow -------------------
  // Tail whip: the boss closes in, twists and lashes its tail low across the hero, once per hit.
  async tailwhip(c){
    // One slow, heavy lash with a wind-up, like a great reptile's: the boss closes in, turns away and draws
    // its tail high over its back (held a beat), sweeps it through the hero at full weight and lets the
    // follow-through carry on before it recovers. Sheet: ready, turning, tail drawn, swing, blow, follow-through.
    const p=c.pose('attack'),blow=foeReachX(c,p,4,.25);setSpriteFrame('enemy',p,0);await foePose(`translate(${blow*.9}px,0)`,320*c.pace,'cubic-bezier(.3,.6,.3,1)');
    setSpriteFrame('enemy',p,1);await foePose(`translate(${blow*.86}px,2px)`,280*c.pace,'cubic-bezier(.3,.6,.3,1)');
    setSpriteFrame('enemy',p,2);await foePose(`translate(${blow*.82}px,4px) rotate(2deg)`,240*c.pace,'cubic-bezier(.3,.6,.3,1)');
    await combatV3Wait(560*c.pace);
    const size=c.g.body*1.45*c.scale,at={x:c.g.target.x+c.g.target.width*.05,y:c.g.target.y+c.g.target.height*.12};
    for(let i=0;i<c.hits;i++){
      setSpriteFrame('enemy',p,3);foeFx(c.sheet,at,size,{duration:c.sheet.count*90,z:7,flip:i%2?'y':''});
      await foePose(`translate(${blow}px,0) rotate(-3deg)`,150*c.pace,'cubic-bezier(.6,0,.9,.5)');
      setSpriteFrame('enemy',p,4);c.contact(i,{knock:2.4});combatV3Camera(-1,true,true,c.pending);combatV3Camera(-1,true,true,c.pending);
      await combatV3Wait(300*c.pace);
    }
    setSpriteFrame('enemy',p,5);await foePose(`translate(${blow*.9}px,0)`,380*c.pace);await combatV3Wait(200);
    await foePose('translate(0,0)',460);
  },
  // Bite: the head rears, the boss lunges and its jaws snap shut on the hero.
  // The beast's own jaws do it: the head rears, lunges in with the jaws gaping wide and hangs there a
  // beat, then they slam shut on the hero (a hard shake); the skill's sheet is only what spills from the
  // teeth (lava, a dark seam), never a second pair of jaws.
  async bite(c){
    const p=c.pose('attack'),enemy=actor('enemy'),bite=foeReachX(c,p,3,.02);
    setSpriteFrame('enemy',p,1);await foePose('translate(14px,-6px)',300*c.pace,'cubic-bezier(.3,.6,.3,1)');
    // The jaws gape wide where it stands and hold there, trembling; then one fast lunge snaps them on the hero.
    setSpriteFrame('enemy',p,2);await foePose('translate(20px,-4px)',160);
    const tremble=enemy.animate([{translate:'0 0'},{translate:'2px -1px'},{translate:'-2px 1px'},{translate:'0 0'}],{duration:110,iterations:Infinity});
    await combatV3Wait(560*c.pace);tremble.cancel();
    await foePose(`translate(${bite+18}px,2px)`,130*c.pace,'cubic-bezier(.6,0,.9,.5)');
    setSpriteFrame('enemy',p,3);await foePose(`translate(${bite}px,6px)`,60,'cubic-bezier(.6,0,1,.6)');
    const at={x:c.g.target.x+c.g.target.width*.1,y:c.g.target.y-c.g.target.height*.08};
    foeFx(c.sheet,at,c.g.body*.75*c.scale*c.size,{duration:c.sheet.count*75,z:7});
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.6});if(i<c.hits-1)await combatV3Wait(90);}
    combatV3Camera(-1,true,true,c.pending);combatV3Camera(-1,true,true,c.pending);await combatV3Wait(520);
    setSpriteFrame('enemy',p,4);await foePose(`translate(${bite*.5}px,0)`,300);
    setSpriteAction('enemy','idle');await foePose('translate(0,0)',300);
  },
  // Flight: wings beat, the boss rises and hovers over the arena, pours a long stream onto the hero
  // (look.stream sheet, one tick per hit) while the ground under the hero burns (the skill's sheet),
  // then lands. The hover pose loops for the whole flight.
  async flight(c){
    // look.soar: it climbs to the top corner of the stage (part of it may leave the screen), shift to the right.
    const p=c.pose('fly'),enemy=actor('enemy'),rise=c.look.soar?c.g.source.height*c.look.soar:foeRise(c,p),shift=c.look.soar?-c.g.source.width*.12:c.g.travel*.22;
    // The stream leaves the mouth of the flying pose and follows it through every wing beat and bob.
    let jet=null;
    let frame=0;const flap=setInterval(()=>setSpriteFrame('enemy',p,frame++%6),95);
    try{
      c.sound('start');
      await foePose(`translate(${-shift}px,${-rise}px)`,620,'cubic-bezier(.3,.7,.3,1)');
      const hover=enemy.animate([{translate:'0 0'},{translate:'0 -8px'},{translate:'0 0'}],{duration:760,iterations:Infinity});
      const stream=c.extra('stream'),to={x:c.g.target.x,y:c.g.target.foot-c.g.body*.15};
      const thick=c.g.body*1.1*c.scale,ticks=Math.max(1,c.hits),span=2600*c.pace;
      // An airborne breath in (held), then the fire pours out of the jaws, sweeping the hero's ground.
      await combatV3Wait(380);
      jet=foeBreathStream(c,stream,()=>foeMouthNow()||{x:c.g.mouth.x-shift,y:c.g.mouth.y-rise},to,thick);
      const size=c.g.body*1.5*c.scale,ground={x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)};
      const burn=foeFx(c.sheet,ground,size,{loop:true,duration:c.sheet.count*110,z:7});
      for(let i=0;i<ticks;i++){await combatV3Wait(span/ticks);c.contact(i,{knock:.5});if(i%2===0)combatV3Camera(-1,false,true,c.pending);}
      jet?.stop();jet=null;burn.stop();foeFx(c.sheet,ground,size,{from:3,duration:3*110,z:7});hover.cancel();
      await foePose('translate(0,0)',520,'cubic-bezier(.5,0,.6,1)');combatV3Camera(-1,true,true,c.pending);
    }finally{clearInterval(flap);}
    setSpriteAction('enemy','idle');
  },
  // Flurry: the boss closes in and cuts again and again in place, each cut at its own angle.
  async flurry(c){
    // It closes in with the blades raised and holds, then cuts again and again, each cut its own pose.
    const p=c.pose('attack'),near=-foeReachX(c,p,1)-24;setSpriteFrame('enemy',p,0);await foePose(`translate(${-near}px,0)`,260*c.pace,'cubic-bezier(.3,.6,.2,1)');
    await foeWindup(c,p,0,{ms:420,at:near});
    const size=c.g.body*.62*c.scale,angles=[-28,22,-8,38,-42,12];
    for(let i=0;i<c.hits;i++){
      setSpriteFrame('enemy',p,1+i%4);await foePose(`translate(${foeReachX(c,p,1+i%4)}px,${i%2?2:-2}px)`,90*c.pace,'cubic-bezier(.6,0,.9,.5)');await combatV3Wait(40);
      foeFx(c.sheet,{x:c.g.target.x+(i%2?8:-8),y:c.g.target.y-c.g.target.height*(.02+.06*(i%3))},size,{duration:c.sheet.count*50,rotate:angles[i%angles.length],flip:i%2?'x':'',z:7});
      c.contact(i,{knock:.7});combatV3Camera(-1,i===c.hits-1,true,c.pending);await combatV3Wait(150*c.pace);
    }
    await combatV3Wait(180);setSpriteFrame('enemy',p,5);await combatV3Wait(160);await foePose('translate(0,0)',320);
  },
  // Rush: the boss vanishes and cuts through the hero along changing diagonals (the skill's trail
  // sheet stretched across the stage), then reappears beside the hero for one closing cut (look.finisher).
  async rush(c){
    // Blades crossed, it crouches and holds, vanishes, and is seen in flashes all round the hero: a ghost
    // of it in a cutting pose on alternate sides at each cut, its blade trail across the hero.
    const enemy=actor('enemy'),p=c.pose('attack');await foeWindup(c,p,0,{ms:440});
    await animate(enemy,[{opacity:1},{opacity:0,filter:'blur(3px)'}],{duration:160});enemy.style.opacity='0';
    const t=c.g.target,cuts=Math.max(1,c.hits-1),angles=[-24,30,-60,12,64,-38,48,-8],len=c.g.body*1.6,thick=c.g.body*.42*c.scale;
    for(let i=0;i<cuts;i++){
      const side=i%2?1:-1;c.pending.push(foeGhost(p,1+i%4,{x:Math.max(t.width*.45,t.x-side*t.width*(.55+.12*(i%3))),y:t.foot-(i%3===1?t.height*.2:0)},{facing:side>0?1:0,ms:300}));
      foeFx(c.sheet,{x:t.x,y:t.y-t.height*.06},thick,{stretch:len/thick,rotate:angles[i%angles.length],duration:c.sheet.count*45,z:7});
      c.contact(i,{knock:.4});if(i%3===2)combatV3Camera(-1,false,true,c.pending);await combatV3Wait(150*c.pace);
    }
    enemy.style.transform=`translate(${-c.g.travel}px,0)`;setSpriteFrame('enemy',p,3);
    await animate(enemy,[{opacity:0},{opacity:1}],{duration:90});enemy.style.opacity='';
    const fin=c.extra('finisher')||c.sheet;foeFx(fin,{x:t.x,y:t.y-t.height*.05},c.g.body*1.6*c.scale,{duration:fin.count*70,z:7});
    await combatV3Wait(140);c.contact(c.hits-1,{knock:2});combatV3Camera(-1,true,true,c.pending);
    await combatV3Wait(320);await animate(enemy,[{opacity:1},{opacity:0}],{duration:150});
    enemy.style.transform='';await animate(enemy,[{opacity:0},{opacity:1}],{duration:220});
  },
  // Pounce: the boss crouches, springs in an arc and lands claws-first on the hero.
  async pounce(c){
    const p=c.pose('attack'),enemy=actor('enemy'),land=foeReachX(c,p,3,c.look.into??.12);await foeWindup(c,p,1,{ms:700,at:-8});
    setSpriteFrame('enemy',p,2);
    await animate(enemy,[{transform:'translate(0,0)'},{transform:`translate(${land*.55}px,${-c.g.source.height*.4}px)`,offset:.5},{transform:`translate(${land}px,0)`}],{duration:380*c.pace,easing:'cubic-bezier(.3,.5,.6,1)',fill:'forwards'});
    enemy.style.transform=`translate(${land}px,0)`;setSpriteFrame('enemy',p,3);
    foeFx(c.sheet,{x:c.g.target.x,y:c.g.target.y-c.g.target.height*.04},c.g.body*1.1*c.scale,{duration:c.sheet.count*60,z:7});
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.4});if(i<c.hits-1)await combatV3Wait(90);}
    await foeImpact(c,160);await combatV3Wait(220);setSpriteFrame('enemy',p,4);await combatV3Wait(160);await foePose('translate(0,0)',380);
  },
  // Gore: head down, the boss charges straight through the hero horns first.
  async gore(c){
    // Head lowered, the boss paws the ground and holds before it charges.
    const p=c.pose('attack'),enemy=actor('enemy');await foeWindup(c,p,1,{ms:560,at:-6});
    setSpriteFrame('enemy',p,2);enemy.style.filter='blur(1px)';
    await foePose(`translate(${foeReachX(c,p,3,-.1)}px,0)`,190*c.pace,'cubic-bezier(.6,0,.9,.5)');enemy.style.filter='';
    setSpriteFrame('enemy',p,3);foeFx(c.sheet,{x:c.g.target.x+c.g.target.width*.1,y:c.g.target.y},c.g.body*.8*c.scale*c.size,{duration:c.sheet.count*65,z:7});
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:2.2});
    await foeImpact(c,180);await combatV3Wait(200);setSpriteFrame('enemy',p,4);await combatV3Wait(160);await foePose('translate(0,0)',400);
  },
  // Punch: one heavy step in and the boss's own blows land, one per hit (a ground sheet with look.ground).
  async punch(c){
    // Each blow is drawn back and held (the frame before it) before it lands.
    const p=c.pose('attack'),near=-foeReachX(c,p,c.hits>1?2:3)-28;setSpriteFrame('enemy',p,0);await foePose(`translate(${-near}px,0)`,260*c.pace,'cubic-bezier(.4,.1,.3,1)');
    const size=c.g.body*1.15*c.scale*c.size,at=c.look.ground?{x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)}:{x:c.g.target.x,y:c.g.target.y-c.g.target.height*.04};
    const frames=c.hits>1?[2,4]:[3];
    for(let i=0;i<c.hits;i++){
      await foeWindup(c,p,c.hits>1?frames[i%frames.length]-1:1,{ms:i?260:440,at:near});
      setSpriteFrame('enemy',p,frames[i%frames.length]);await foePose(`translate(${foeReachX(c,p,frames[i%frames.length],c.look.into??.12)}px,2px)`,90*c.pace,'cubic-bezier(.6,0,.9,.5)');
      foeFx(c.sheet,at,size,{duration:c.sheet.count*60,z:7});c.contact(i,{knock:1.6});await foeImpact(c,150);
    }
    await combatV3Wait(420);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',420);
  },
  // Dive (sheet: ready, crouch, rising, banking, stoop, impact): it crouches and holds, beats up to the
  // top of the stage (whole, under the HUD), banks there a beat while its shadow grows on the hero, then
  // stoops diagonally down until its talons are in the hero, flares and pulls back home.
  async dive(c){
    const p=c.pose('attack'),enemy=actor('enemy'),t=c.g.target;
    await foeWindup(c,p,1,{ms:420});
    setSpriteFrame('enemy',p,2);const rise=Math.max(foeRise(c,p),c.g.source.height*.18),hover=-c.g.travel*.25;
    await foePose(`translate(${hover}px,${-rise}px)`,380*c.pace,'cubic-bezier(.3,.7,.3,1)');
    const shadow=document.createElement('span');shadow.className='foe-dive-shadow';shadow.style.cssText=`left:${t.x}px;top:${t.foot}px;width:${t.width*1.1}px`;$('combatEffects').append(shadow);
    c.pending.push(animate(shadow,[{opacity:0,scale:'.3'},{opacity:.55,scale:'1'}],{duration:620,fill:'forwards'}).finally(()=>setTimeout(()=>shadow.remove(),700)));
    setSpriteFrame('enemy',p,3);await foePose(`translate(${hover-10}px,${-rise-6}px)`,420,'ease-in-out');
    setSpriteFrame('enemy',p,4);const strike=foeReachX(c,p,5,-.1);
    await foePose(`translate(${strike}px,0)`,200*c.pace,'cubic-bezier(.6,0,1,.6)');
    setSpriteFrame('enemy',p,5);shadow.style.opacity='0';
    foeFx(c.sheet,{x:t.x,y:t.y},c.g.body*1.1*c.scale,{duration:c.sheet.count*70,z:7});
    for(let i=0;i<c.hits;i++)c.contact(i,{knock:1.8});
    await foeImpact(c,200);await combatV3Wait(240);setSpriteFrame('enemy',p,1);await foePose('translate(0,0)',440);
  },
  // Fan: one beat throws a spread of pieces at once, each on its own line.
  async fan(c){
    const p=c.pose('attack');await foeWindup(c,p,1,{ms:460});setSpriteFrame('enemy',p,3);
    const start=foeMouthNow()||{x:c.g.source.x-c.g.source.width*.3,y:c.g.source.y-c.g.source.height*.1},size=c.g.body*.45*c.scale*c.size,count=Math.max(3,c.hits);
    const flights=Array.from({length:count},(_,i)=>{const spread=(i-(count-1)/2)*.32,spot={x:c.g.target.x+(i-(count-1)/2)*8,y:c.g.target.y-c.g.target.height*(.1-spread*.6)};
      const fx=foeFx(c.sheet,start,size,{loop:true,rotate:Math.atan2(spot.y-start.y,spot.x-start.x)*180/Math.PI+180,duration:c.sheet.count*50,z:7});
      return animate(fx.node,[{left:start.x+'px',top:start.y+'px'},{left:spot.x+'px',top:spot.y+'px'}],{duration:260*c.pace,easing:'cubic-bezier(.4,0,.8,.6)'}).finally(()=>fx.stop());});
    await Promise.all(flights);
    for(let i=0;i<c.hits;i++){c.contact(i);if(i<c.hits-1)await combatV3Wait(50);}
    await combatV3Wait(160);setSpriteFrame('enemy',p,5);await combatV3Wait(160);
  },
  // Strikes: bolts fall one after another, walking from the boss up to the hero.
  async strikes(c){
    // It rears and charges (held), then the bolts walk in from it to the hero, the last the heaviest.
    const p=c.pose('attack');await foeWindup(c,p,1,{ms:520});setSpriteFrame('enemy',p,3);
    const size=c.g.body*1.3*c.scale,count=Math.max(1,c.hits),from=c.g.source.x-c.g.source.width*.5,to=c.g.target.x;
    for(let i=0;i<count;i++){
      const last=i===count-1,x=last?to:to+(i%2?1:-1)*c.g.target.width*(.08+.05*(i%3));
      foeFx(c.sheet,{x,y:c.g.target.foot-size*(c.ground-.5)},size*(last?1.25:1),{duration:c.sheet.count*65,z:7});
      await combatV3Wait(80);c.contact(i,{knock:last?1.6:.4});if(last)await foeImpact(c,140);else{combatV3Camera(-1,false,true,c.pending);await combatV3Wait(280*c.pace);}
    }
    await combatV3Wait(240);setSpriteFrame('enemy',p,5);await combatV3Wait(160);setSpriteAction('enemy','idle');
  },
  // Bind: bands close round the hero one by one, at different angles, the last one locking.
  async bind(c){
    await c.cast();
    const t=c.g.target,at={x:t.x,y:t.y-t.height*.05},size=c.g.body*1.2*c.scale*c.size,count=Math.max(1,c.hits),per=80;
    for(let i=0;i<count;i++){
      // look.upright: a prison standing round the hero closes tighter each time instead of turning.
      const turn=c.look.upright?0:i*60-60,fx=foeFx(c.sheet,at,size*(1-i*.08),{duration:c.sheet.count*per,rotate:turn,z:7});
      await combatV3Wait(per*3);c.contact(i,{knock:.3});
      if(i===count-1){fx.stop();foeHoldAll(c,[{at,size:size*(1-i*.08),rotate:turn,z:7}],700);}
    }
    combatV3Camera(-1,true,true,c.pending);await combatV3Wait(400);
  },
  // Jet: jaws open, a continuous stream pours from the boss's mouth onto the hero (look.stream, one tick
  // per hit), splashing on the hero (the skill's sheet), then the jaws close.
  async jet(c){
    const p=c.pose('attack'),breathe=['breathe','cannon'].includes(c.look.pose);
    await foeWindup(c,p,breathe?2:1,{ms:440});setSpriteFrame('enemy',p,breathe?4:2);await combatV3Wait(60);
    const stream=c.extra('stream'),from=foeMouthNow()||c.g.mouth,to={x:c.g.target.x+c.g.target.width*.1,y:c.g.target.y-c.g.target.height*.08};
    const thick=c.g.body*(c.look.thick||.95)*c.scale,ticks=Math.max(1,c.hits),span=1500*c.pace;
    // The cone is pinned by its tongue to the open jaws (foeConeAim) and grows out of them.
    const jet=foeBreathStream(c,stream,()=>foeMouthNow()||from,to,thick,{sweep:.2});
    const hitSheet=c.extra('impact')||c.sheet,splash=foeFx(hitSheet,to,c.g.body*.95*c.scale*c.size,{loop:true,duration:hitSheet.count*70,z:7});
    for(let i=0;i<ticks;i++){await combatV3Wait(span/ticks);c.contact(i,{knock:.7});}
    jet.stop();splash.stop();foeFx(hitSheet,to,c.g.body*1.3*c.scale*c.size,{from:2,duration:4*80,z:7});combatV3Camera(-1,true,true,c.pending);
    await combatV3Wait(200);setSpriteFrame('enemy',p,breathe?5:4);await combatV3Wait(160);setSpriteAction('enemy','idle');
  },
  // Tempest: storm clouds gather over the hero (look.cloud, held while the storm lasts), rain falls,
  // then bolts (the skill's sheet) strike down through it one by one.
  async tempest(c){
    await c.cast();
    // look.cloudAt 'around': the held sheet stands centred on the hero (a wheel) instead of over it.
    const t=c.g.target,cloud=c.extra('cloud'),csize=Math.min(c.g.body*2.1*c.scale,2*Math.max(40,t.x+20)),cat=c.look.cloudAt==='around'?{x:t.x,y:t.y-t.height*.05}:{x:t.x,y:t.foot-csize*(.8-.5)};
    const sky=cloud&&foeFx(cloud,cat,csize,{duration:cloud.count*120,z:6});
    await combatV3Wait(cloud?cloud.count*120*.55:200);
    const held=cloud&&foeFx(cloud,cat,csize,{frame:cloud.count-1,z:6});sky?.stop();
    const size=c.g.body*1.5*c.scale;
    for(let i=0;i<Math.max(1,c.hits);i++){
      foeFx(c.sheet,{x:t.x+(i%2?-1:1)*t.width*.12*(i%3),y:t.foot-size*(c.ground-.5)},size,{duration:c.sheet.count*55,z:7});
      await combatV3Wait(110);c.contact(i,{knock:i===c.hits-1?1.6:.5});combatV3Camera(-1,i===c.hits-1,true,c.pending);await combatV3Wait(180*c.pace);
    }
    if(held)c.pending.push(animate(held.node,[{opacity:1},{opacity:0}],{duration:600,easing:'ease-in'}).finally(()=>held.stop()));
    await combatV3Wait(250);
  },
  // Stormcall: the boss takes to the air on beating wings and calls bolts down on the hero from every
  // side, one per hit, the last one the heaviest; then it lands.
  async stormcall(c){
    const p=c.pose('fly'),enemy=actor('enemy'),rise=foeRise(c,p);
    let frame=0;const flap=setInterval(()=>setSpriteFrame('enemy',p,frame++%6),95);
    try{
      await foePose(`translate(${-c.g.travel*.1}px,${-rise}px)`,560,'cubic-bezier(.3,.7,.3,1)');
      const hover=enemy.animate([{translate:'0 0'},{translate:'0 -8px'},{translate:'0 0'}],{duration:760,iterations:Infinity});
      const t=c.g.target,count=Math.max(1,c.hits);
      for(let i=0;i<count;i++){
        // Bolts come down from the sky round the hero (the sheet's ground line on the hero's feet).
        const last=i===count-1,size=c.g.body*(last?1.9:1.2)*c.scale,dx=last?0:(i%2?-1:1)*t.width*(.15+.25*((i*37)%7)/7);
        foeFx(c.sheet,{x:t.x+dx,y:t.foot-size*(c.ground-.5)},size,{duration:c.sheet.count*50,z:7});
        await combatV3Wait(60);c.contact(i,{knock:last?1.8:.4});combatV3Camera(-1,last||i%3===0,true,c.pending);await combatV3Wait((last?260:120)*c.pace);
      }
      hover.cancel();await foePose('translate(0,0)',480,'cubic-bezier(.5,0,.6,1)');
    }finally{clearInterval(flap);}
    setSpriteAction('enemy','idle');
  },
  // Vortex: a black hole opens on the hero, the hero is dragged into it (shrinks and spins), then it
  // implodes with the last hit.
  async vortex(c){
    await c.cast();
    const t=c.g.target,at={x:t.x,y:t.y-t.height*.08},size=Math.min(c.g.body*2*c.scale*c.size,2*(t.x-6),2*(at.y-8)),hero=actor('hero');
    const hole=foeFx(c.sheet,at,size,{loop:true,duration:c.sheet.count*70,z:7}),coreSheet=c.extra('core');
    const core=coreSheet&&foeFx(coreSheet,at,size*.42,{frame:coreSheet.count-1,z:7});
    if(core)c.pending.push(animate(core.node,[{scale:'.2',opacity:0},{scale:'1',opacity:1,offset:.35},{scale:'1.05',opacity:1}],{duration:1500,fill:'forwards'}));
    c.pending.push(animate(hole.node,[{scale:'.2',opacity:0,rotate:'0deg'},{scale:'1',opacity:1,offset:.3},{scale:'1.1',opacity:1,rotate:'-200deg'}],{duration:1500}));
    const pull=animate(hero,[{scale:'1',rotate:'0deg'},{scale:'.82',rotate:'-10deg',offset:.6},{scale:'.7',rotate:'8deg'}],{duration:1300,easing:'ease-in'});
    const count=Math.max(1,c.hits);
    for(let i=0;i<count-1;i++){await combatV3Wait(1100/count);c.contact(i,{knock:.2});}
    await pull;await Promise.all([animate(hole.node,[{scale:'1.1',opacity:1},{scale:'.05',opacity:1}],{duration:260,easing:'ease-in'}),core&&animate(core.node,[{scale:'1.05'},{scale:'.05'}],{duration:260,easing:'ease-in'})]);hole.stop();core?.stop();
    foeFx(c.sheet,at,size*.7,{from:3,duration:3*60,z:7});c.contact(count-1,{knock:1.8});combatV3Camera(-1,true,true,c.pending);
    await animate(hero,[{scale:'.7'},{scale:'1.08',offset:.6},{scale:'1'}],{duration:360});hero.style.scale='';hero.style.rotate='';
    await combatV3Wait(200);
  },
  // Summon: the summoning effect rises on both sides of the boss (the skill's sheet), and out of it step
  // the chapter's two elites (their own idle art), or, with look.shadows, two crimson shadows of the
  // boss itself; they stand a moment and fade (the fight's HUD keeps them while they live).
  async summon(c){
    await c.cast();
    // The guards rise on the boss's side of the stage, both facing the hero, one nearer and lower than the
    // other; they step forward into a guard in front of the boss, hold it, and fade back into the boss.
    const body=foeBody(),per=130,size=body.height*.95*c.size,gap=Math.max(40,body.left-c.g.target.x-c.g.target.width*.5);
    const W=$('scene').clientWidth,spots=[{x:body.left-gap*.08,y:body.bottom+4,z:7,k:1},{x:body.left-gap*.6,y:body.bottom,z:6,k:.92}];
    for(const [k,spot] of spots.entries())foeFx(c.sheet,{x:spot.x,y:spot.y-size*.55*(c.ground-.5)},size*.55,{duration:c.sheet.count*per,z:spot.z-1,flip:k?'x':''});
    await combatV3Wait(per*2.5);c.sound('lock');
    // An expedition boss's guards stay on the stage (foeGuardsRender draws them); the move only opens the ground.
    const figures=$('foeGuards')?.children.length?[]:foeSummonFigures(c,body),step=Math.min(24,gap*.08);
    for(const [k,figure] of figures.entries()){
      const spot=spots[k%2],h=body.height*(c.look.shadows?.72:.74)*spot.k;
      figure.style.cssText+=`position:absolute;pointer-events:none;left:${spot.x}px;top:${spot.y}px;width:${h}px;height:${h}px;translate:-50% -94%;z-index:${spot.z}`;
      $('combatEffects').append(figure);
      c.pending.push(animate(figure,[{opacity:0,translate:'-50% -70%'},{opacity:1,translate:'-50% -94%',offset:.15},{opacity:1,translate:`calc(-50% - ${step}px) -94%`,offset:.3},
        {opacity:1,translate:`calc(-50% - ${step}px) -96%`,offset:.5},{opacity:1,translate:`calc(-50% - ${step}px) -94%`,offset:.7},{opacity:0,translate:`calc(-50% - ${step}px) -94%`,filter:`${figure.style.filter} blur(2px)`}],{duration:2600,delay:k*320,easing:'ease-in-out',fill:'backwards'}).finally(()=>figure.remove()));
    }
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(per*5);
  },
  // ---- Guards, heals and summons: each stands up in its own way --------------------------------
  // Armour cast: the boss gathers its power a moment (its armour then circles it).
  async armorcast(c){await c.cast();await combatV3Wait(300);c.sound('lock');for(let i=0;i<c.hits;i++)c.contact(i);await combatV3Wait(320);},
  // Armour up: the boss grows its own armour through its armour action (look.pose): the cracks glow, the
  // plates swell out (the skill's sheet flaring over the body as light) and lock on at frame 4, then it
  // rears in it; afterwards it rests in its armoured idle while the armour holds.
  async armorup(c){
    const p=c.pose('cast'),body=foeBody();
    for(let f=0;f<6;f++){
      setSpriteFrame('enemy',p,f);
      if(f===3){c.sound('lock');combatV3Camera(-1,false,true,c.pending);for(let i=0;i<c.hits;i++)c.contact(i);}
      await combatV3Wait(f===4?560:f===0?140:320);
    }
  },
  // Plates: pieces of armour fly in from all round and lock onto the foe's body, then stand and fade.
  async plates(c){
    await c.cast();
    const body=foeBody(),size=body.height*.38,per=110,count=6,travel=320,stagger=60,placed=[];
    for(let k=0;k<count;k++){
      const a=-Math.PI/2+k*2*Math.PI/count,rotate=a*180/Math.PI+90,behind=Math.sin(a)<-.5;
      const end={x:body.x+Math.cos(a)*body.width*.36,y:body.y+Math.sin(a)*body.height*.34},start={x:body.x+Math.cos(a)*body.width*1.5,y:body.y+Math.sin(a)*body.height*1.2};
      const fx=foeFx(c.sheet,start,size,{duration:travel+stagger*count+120,rotate,behind});
      c.pending.push(animate(fx.node,[{left:start.x+'px',top:start.y+'px',opacity:0},{opacity:1,offset:.3},{left:end.x+'px',top:end.y+'px',opacity:1}],{duration:travel,delay:k*stagger,easing:'cubic-bezier(.5,0,.8,.6)',fill:'forwards'}));
      placed.push({at:end,size,rotate,behind});
    }
    await combatV3Wait(travel+stagger*count);c.sound('lock');combatV3Camera(-1,false,true,c.pending);
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(120);foeHoldAll(c,placed,900);await combatV3Wait(300);
  },
  // Dome: a shell closes over the foe, drawn behind it and again over it as light.
  async dome(c){
    const body=foeBody(),size=Math.max(body.width*1.45,body.height*1.3),at={x:body.x,y:body.bottom-size*(c.ground-.5)};
    await foeStand(c,[{at,size,behind:true},{at,size,blend:'screen',opacity:.6}]);
  },
  // Shutters: two shell halves slide in from both sides and close in front of the foe, then part.
  async shutters(c){
    await c.cast();
    const body=foeBody(),size=body.height*.95,per=130,at={x:body.x,y:body.y+body.height*.05};
    const halves=['','x'].map((flip,k)=>{const side=k?1:-1,start={x:body.x+side*body.width*.95,y:at.y};
      const fx=foeFx(c.sheet,start,size,{duration:c.sheet.count*per,flip});
      c.pending.push(animate(fx.node,[{left:start.x+'px',opacity:0},{opacity:1,offset:.4},{left:at.x+'px',opacity:1}],{duration:per*3,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}));
      return {flip,side};});
    await combatV3Wait(per*3);c.sound('lock');combatV3Camera(-1,false,true,c.pending);
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(per*3);
    for(const {flip,side} of halves){
      const fx=foeFx(c.sheet,at,size,{frame:c.sheet.count-1,flip});
      c.pending.push(animate(fx.node,[{left:at.x+'px',opacity:1},{left:at.x+'px',opacity:1,offset:.45},{left:at.x+side*body.width*.55+'px',opacity:0}],{duration:900,easing:'ease-in'}).finally(()=>fx.stop()));
    }
    await combatV3Wait(300);
  },
  // Orbit: shields circle the foe on a flat ellipse, dimmer and smaller as they pass behind it.
  async orbit(c){
    await c.cast();
    const body=foeBody(),size=body.height*.32,count=4,rx=body.width*.62,ry=body.height*.16,cy=body.y+body.height*.12,duration=1800,steps=24;
    for(let k=0;k<count;k++){
      const fx=foeFx(c.sheet,{x:body.x,y:cy},size,{loop:true,duration:c.sheet.count*70});
      const frames=Array.from({length:steps+1},(_,s)=>{const a=s/steps*2.5*Math.PI+k*2*Math.PI/count,front=Math.sin(a);
        return {left:body.x+Math.cos(a)*rx+'px',top:cy+front*ry+'px',opacity:s===0||s===steps?0:front>0?1:.35,scale:String(.8+front*.2)};});
      c.pending.push(animate(fx.node,frames,{duration,easing:'linear'}).finally(()=>fx.stop()));
    }
    await combatV3Wait(450);c.sound('lock');
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(450);
  },
  // Pillars: pillars shoot up round the foe, one in front of it and two behind.
  async pillars(c){
    const body=foeBody(),size=body.height*.95,y=s=>body.bottom-s*(c.ground-.5);
    await foeStand(c,[{at:{x:body.left-size*.1,y:y(size)},size},{at:{x:body.right+size*.1,y:y(size)},size,behind:true,delay:110},{at:{x:body.x+body.width*.08,y:y(size*.8)},size:size*.8,behind:true,delay:110}]);
  },
  // Wings: a pair of wings opens behind the foe and wraps round it.
  async wings(c){
    const body=foeBody();await foeStand(c,[{at:{x:body.x,y:body.y},size:Math.max(body.width*1.9,body.height*1.5),behind:true}]);
  },
  // Wrap: growth climbs up the foe's legs from the ground.
  async wrap(c){
    const body=foeBody(),size=body.width*1.3;await foeStand(c,[{at:{x:body.x,y:body.bottom-size*(c.ground-.5)},size}]);
  },
  // Sigil: a ring opens on the ground under the foe and pieces rise out of it.
  async sigil(c){
    const body=foeBody(),size=body.width*1.75,at={x:body.x,y:body.bottom-size*.22};
    await foeStand(c,[{at,size,behind:true},{at,size,blend:'screen',opacity:.55}]);
  },
  // Shell: armour bursts out of the foe and hangs round it (the sheet's middle is empty).
  async shell(c){
    const body=foeBody();combatV3Camera(-1,false,true,c.pending);
    await foeStand(c,[{at:{x:body.x,y:body.y},size:Math.max(body.width,body.height)*1.25}],{per:120});
  },
  // Mirror: one shield spins in from above and stands in front of the foe.
  async mirror(c){
    await c.cast();
    const body=foeBody(),size=body.height*.72,per=130,to={x:body.left-size*.05,y:body.y},start={x:body.x+body.width*.3,y:body.top-size*.5};
    const fx=foeFx(c.sheet,start,size,{duration:c.sheet.count*per});
    c.pending.push(animate(fx.node,[{left:start.x+'px',top:start.y+'px',scale:'.15 1',opacity:0},{scale:'-1 1',opacity:1,offset:.35},{scale:'.3 1',offset:.7},{left:to.x+'px',top:to.y+'px',scale:'1 1',opacity:1}],{duration:per*3,easing:'cubic-bezier(.3,.7,.4,1)',fill:'forwards'}));
    await combatV3Wait(per*3);c.sound('lock');
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(per*3);foeHoldAll(c,[{at:to,size}],900);await combatV3Wait(300);
  },
  // Crown: a mass gathers over the foe's head and lets a curtain fall round it.
  async crown(c){
    const body=foeBody(),size=Math.max(body.height*1.35,body.width*1.4),at={x:body.x,y:body.bottom-size*(c.ground-.5)};
    await foeStand(c,[{at,size,behind:true},{at,size,blend:'screen',opacity:.55}]);
  },
  // Cage: the sheet's first frame drops from the sky over the foe, slams down and stands.
  async cage(c){
    await c.cast();
    const body=foeBody(),size=body.height*1.3,per=120,at={x:body.x,y:body.bottom-size*(c.ground-.5)},sky={x:body.x,y:-size*.6};
    const fall=foeFx(c.sheet,sky,size,{frame:0});
    await animate(fall.node,[{top:sky.y+'px'},{top:at.y-size*.1+'px'}],{duration:300,easing:'cubic-bezier(.55,0,1,.45)'});fall.stop();
    foeFx(c.sheet,at,size,{from:1,duration:(c.sheet.count-1)*per});c.sound('lock');combatV3Camera(-1,true,true,c.pending);
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait((c.sheet.count-1)*per-20);foeHoldAll(c,[{at,size}],900);await combatV3Wait(300);
  },
  // Spots: small growths pop out one by one over the foe's body.
  async spots(c){
    const body=foeBody(),size=body.width*.36,spots=[[-.28,-.3],[.3,-.18],[-.05,.02],[-.32,.24],[.26,.3]];
    await foeStand(c,spots.map(([u,v],k)=>({at:{x:body.x+u*body.width,y:body.y+v*body.height},size:size*(k%2?.85:1),delay:k?80:0,rotate:(k%2?14:-12)})),{per:110});
  },
  // Rampart: a wall rises from the ground between the foe and the hero.
  async rampart(c){
    const body=foeBody(),size=body.width*1.2;combatV3Camera(-1,false,true,c.pending);
    await foeStand(c,[{at:{x:body.left-size*.12,y:body.bottom+body.height*.04-size*(c.ground-.5)},size}]);
  },
  // Saturn: a flat ring circles the foe's waist, its far half behind the foe and its near half in front.
  async saturn(c){
    const body=foeBody(),size=body.width*1.95,at={x:body.x,y:body.y+body.height*.15};
    await foeStand(c,[{at,size,behind:true,clip:'inset(0 0 50% 0)'},{at,size,clip:'inset(50% 0 0 0)'}]);
  },
  // Backdrop: a great shell rises behind the foe and opens round it like a throne.
  async backdrop(c){
    const body=foeBody(),size=Math.max(body.width*1.8,body.height*1.45);
    await foeStand(c,[{at:{x:body.x,y:body.y-body.height*.02},size,behind:true}]);
  },
  // Crescent: a blade sweeps from behind the foe round its front and stands guard there.
  async crescent(c){
    await c.cast();
    const body=foeBody(),size=body.height*.85,per=130,to={x:body.left-size*.08,y:body.y};
    const fx=foeFx(c.sheet,{x:body.right,y:body.top},size,{duration:c.sheet.count*per});
    c.pending.push(animate(fx.node,[{left:body.right+size*.2+'px',top:body.top+'px',rotate:'150deg',opacity:0},{left:body.x+'px',top:body.bottom-size*.15+'px',rotate:'70deg',opacity:1,offset:.5},{left:to.x+'px',top:to.y+'px',rotate:'0deg',opacity:1}],{duration:per*3,easing:'cubic-bezier(.3,.6,.4,1)',fill:'forwards'}));
    await combatV3Wait(per*3);c.sound('lock');
    for(let i=0;i<c.hits;i++)c.contact(i);
    await combatV3Wait(per*3);foeHoldAll(c,[{at:to,size}],900);await combatV3Wait(300);
  },
  // Flank: two guardians rise on both sides of the foe.
  async flank(c){
    const body=foeBody(),size=body.height*.9,y=body.bottom-size*(c.ground-.5);
    await foeStand(c,[{at:{x:body.left-size*.22,y},size},{at:{x:body.right+size*.22,y},size,behind:true,flip:'x',delay:140}]);
  },
  // Pour: a column comes down from the sky onto the foe, behind it and over it as light.
  async pour(c){
    const body=foeBody(),size=Math.max(body.height*1.5,body.width*1.3),at={x:body.x,y:body.bottom-size*(c.ground-.5)};
    await foeStand(c,[{at,size,behind:true},{at,size,blend:'screen',opacity:.55}],{hold:0});
  },
  // Rise: a spring wells up at the foe's feet, in front of it.
  async rise(c){
    const body=foeBody(),size=body.height*.85*c.size;
    await foeStand(c,[{at:{x:body.left+body.width*.15,y:body.bottom-size*(c.ground-.5)},size}],{hold:0});
  },
  // ---- Attacks with their own paths ----------------------------------------------------------
  // Pincer: the boss closes in and its own jaws or blades clamp the hero, once per hit: open wide and
  // hold (the sheet's frame 1), clamp shut (frame 3) with a hard shake; the skill's sheet is only the small
  // burst where they bite in.
  async pincer(c){
    const p=c.pose('attack'),clamp=foeReachX(c,p,3,-.3);setSpriteFrame('enemy',p,0);await foePose(`translate(${clamp+30}px,0)`,280*c.pace,'cubic-bezier(.3,.6,.2,1)');
    const size=c.g.body*.6*c.scale,at={x:c.g.target.x+c.g.target.width*.08,y:c.g.target.y-c.g.target.height*.05};
    for(let i=0;i<c.hits;i++){
      const [open,shut]=c.look.clamp?.[i%c.look.clamp.length]||[1,3];
      await foeWindup(c,p,open,{ms:i?260:440,at:-clamp-30});
      await foePose(`translate(${clamp}px,2px)`,90*c.pace,'cubic-bezier(.6,0,.9,.5)');
      setSpriteFrame('enemy',p,shut);await combatV3Wait(40);foeFx(c.sheet,{x:at.x,y:at.y-i%2*c.g.target.height*.06},size,{duration:c.sheet.count*55,z:7,rotate:i%2?18:-12});
      c.contact(i,{knock:1.2});await foeImpact(c,i===c.hits-1?170:110);
    }
    await combatV3Wait(320);setSpriteFrame('enemy',p,5);await combatV3Wait(200);await foePose('translate(0,0)',400);
  },
  // Sweep: the effect races along the ground from the foe to the hero and breaks over them.
  async sweep(c){
    const p=c.pose('attack');await foeWindup(c,p,1,{ms:400});
    setSpriteFrame('enemy',p,3);await foePose('translate(-12px,4px) scale(1.02,.97)',140);c.sound('boom',{volume:.42});
    // look.stage: the effect is sized to the stage (a tidal wave half the screen tall), not to the bodies.
    const size=c.look.stage?$('scene').clientHeight*c.look.stage:foeFitSize(c.g.body*1.2*c.scale*c.size,c.g.target.x+c.g.target.width*.15,c.g.target.foot,c.ground),y=c.g.target.foot-size*(c.ground-.5),body=foeBody(),from=body.left+body.width*.18,to=c.g.target.x+c.g.target.width*.15;
    // It starts at the boss's front feet (on its own ground line) and runs along the ground to the hero.
    const startY=body.bottom-size*.55*(c.ground-.5);
    if(c.look.trail){for(let k=1;k<=4;k++){const t=k/5;foeFx(c.sheet,{x:from+(to-from)*t,y:startY+(y-startY)*t},size*(.45+.1*k),{duration:c.sheet.count*90,z:6});await combatV3Wait(110*c.pace);}}
    foeNoFit=!!c.look.stage;const run=foeFx(c.sheet,{x:from,y:startY},size,{loop:true,duration:c.sheet.count*70,z:7});foeNoFit=false;if(c.look.trail)run.node.style.opacity='0';
    await animate(run.node,[{left:from+'px',top:startY+'px',scale:'.55'},{left:to+'px',top:y+'px',scale:'.9'}],{duration:380*c.pace,easing:'cubic-bezier(.4,0,.8,.7)'});
    // look.trail: the growth erupts in planted sections along its way instead of one travelling stamp.
    if(c.look.trail){run.node.style.opacity='0';}
    run.stop();foeNoFit=!!c.look.stage;foeFx(c.sheet,{x:c.look.stage?Math.max(c.g.target.x,size*.36):c.g.target.x,y},size,{duration:c.sheet.count*90,z:7});foeNoFit=false;
    await combatV3Wait(160);combatV3Camera(-1,true,state.boss,c.pending);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.2});if(i<c.hits-1)await combatV3Wait(90);}
    await combatV3Wait(260);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',300);
  },
  // Spiral: pieces circle the hero, tighten and strike together.
  async spiral(c){
    await c.cast();await combatV3Wait(150*c.pace);
    const t=c.g.target,center={x:t.x,y:t.y-t.height*.05},count=6,r0=c.g.body*.85,size=c.g.body*.32*c.scale*c.size,duration=720,steps=14;
    for(let k=0;k<count;k++){
      const fx=foeFx(c.sheet,center,size,{loop:true,duration:c.sheet.count*60,z:7});
      const frames=Array.from({length:steps+1},(_,s)=>{const a=k*2*Math.PI/count+s/steps*1.8*Math.PI,r=r0*(1-s/steps*.92);
        return {left:center.x+Math.cos(a)*r+'px',top:center.y+Math.sin(a)*r*.62+'px',rotate:a*180/Math.PI+90+'deg',opacity:s===0?0:1};});
      c.pending.push(animate(fx.node,frames,{duration,easing:'cubic-bezier(.3,0,.8,.6)'}).finally(()=>fx.stop()));
    }
    await combatV3Wait(duration-40);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:.5});if(i<c.hits-1)await combatV3Wait(80);}
    await combatV3Wait(220);
  },
  // Column: a pillar comes down from the sky onto the hero.
  async column(c){
    await c.cast();await combatV3Wait(220*c.pace);
    const size=foeFitSize(c.g.body*1.55*c.scale*c.size,c.g.target.x,c.g.target.foot,c.ground),per=100;
    foeFx(c.sheet,{x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)},size,{duration:c.sheet.count*per,z:7});
    await combatV3Wait(per*2);combatV3Camera(-1,true,true,c.pending);
    for(let i=0;i<c.hits;i++){c.contact(i);if(i<c.hits-1)await combatV3Wait(100);}
    await combatV3Wait(per*3);
  },
  // Thrust: the foe stabs forward and the streak runs from its front through the hero.
  async thrust(c){
    const p=c.pose('attack');await foeWindup(c,p,1,{ms:680});
    setSpriteFrame('enemy',p,3);await foePose(`translate(${foeReachX(c,p,3,-.1)}px,-2px)`,110,'cubic-bezier(.5,0,.8,.6)');
    // The streak runs on from the tip of the blade (or vine) through the hero.
    const tip=foeMouthNow()||{x:c.g.source.x-c.g.source.width*.3,y:c.g.target.y},y=c.g.target.y-c.g.target.height*.05,to={x:c.g.target.x-c.g.target.width*.35,y},thick=c.g.body*.5*c.scale;
    const streak=foeFx(c.sheet,to,thick,{duration:c.sheet.count*65,z:7});foeConeAim(streak.node,tip,to);
    await combatV3Wait(110);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.3});if(i<c.hits-1)await combatV3Wait(80);}
    await foeImpact(c,140);await combatV3Wait(200);setSpriteFrame('enemy',p,4);await combatV3Wait(160);setSpriteFrame('enemy',p,5);await foePose('translate(0,0)',320);
  },
  // Drop: the sheet's first frame falls from the sky onto the hero and the rest is its impact.
  async drop(c){
    await c.cast();await combatV3Wait(160*c.pace);
    // Its shadow grows on the hero's ground, then the mass falls from the top of the screen onto it.
    const size=c.g.body*1.6*c.scale*c.size,per=100,at={x:c.g.target.x,y:c.g.target.foot-size*(c.ground-.5)},piece=Math.min(size*.75,c.g.target.foot*.55),sky={x:at.x+piece*.1,y:-piece*.6};
    const fall=foeFx(c.sheet,sky,piece,{frame:0,z:7});
    const shadow=document.createElement('span');shadow.className='foe-dive-shadow';shadow.style.cssText=`left:${at.x}px;top:${c.g.target.foot}px;width:${c.g.target.width*1.3}px`;$('combatEffects').append(shadow);
    animate(shadow,[{opacity:0,scale:'.4'},{opacity:.6,scale:'1'}],{duration:560,fill:'forwards'});
    await combatV3Wait(420);
    await animate(fall.node,[{left:sky.x+'px',top:sky.y+'px'},{left:at.x+'px',top:at.y-size*.12+'px'}],{duration:380*c.pace,easing:'cubic-bezier(.55,0,1,.45)'});fall.stop();shadow.remove();
    foeFx(c.sheet,at,size,{from:1,duration:(c.sheet.count-1)*per,z:7});combatV3Camera(-1,true,true,c.pending);
    for(let i=0;i<c.hits;i++){c.contact(i,{knock:1.3});if(i<c.hits-1)await combatV3Wait(90);}
    await combatV3Wait((c.sheet.count-1)*per);
  },
  // Boomerang: the effect's peak frame spins out to the hero in an arc and back to the foe.
  async boomerang(c){
    // A weapon pose (look.pose): the blade is drawn back and held, and the sweep releases the crescent.
    if(c.look.pose){const p=c.pose('attack');await foeWindup(c,p,1,{ms:480});setSpriteFrame('enemy',p,2);await combatV3Wait(90);setSpriteFrame('enemy',p,3);await combatV3Wait(40);}
    else{await c.cast();await combatV3Wait(150*c.pace);}
    const start=foeMouthNow()||{x:c.g.source.x-c.g.source.width*.3,y:c.g.source.y},hit={x:c.g.target.x,y:c.g.target.y-c.g.target.height*.05},size=c.g.body*.6*c.scale;
    const disc=foeFx(c.sheet,start,size,{frame:3,z:7});
    c.pending.push(animate(disc.node,[{rotate:'0deg'},{rotate:'-1440deg'}],{duration:760}));
    await animate(disc.node,[{left:start.x+'px',top:start.y+'px'},{left:(start.x+hit.x)/2+'px',top:hit.y-c.g.target.height*.45+'px',offset:.5},{left:hit.x+'px',top:hit.y+'px'}],{duration:330*c.pace,easing:'ease-in'});
    for(let i=0;i<c.hits;i++){c.contact(i);if(i<c.hits-1)await combatV3Wait(70);}
    await animate(disc.node,[{left:hit.x+'px',top:hit.y+'px',opacity:1},{left:(start.x+hit.x)/2+'px',top:hit.y+c.g.target.height*.25+'px',offset:.5},{left:start.x+'px',top:start.y+'px',opacity:.3}],{duration:340,easing:'ease-out'});
    disc.stop();if(c.look.pose){setSpriteFrame('enemy',c.pose('attack'),5);await combatV3Wait(200);}
  },
  // Aura: the effect bursts around the foe itself (guards, heals, self buffs).
  async aura(c){
    await c.cast();
    foeFx(c.sheet,{x:c.g.source.x,y:c.g.source.y-c.g.source.height*.05},Math.max(c.g.source.width,c.g.source.height)*(c.scale<1?1.25:1.55),{behind:true});
    await combatV3Wait(c.sheet.frameDuration*3);
    for(let i=0;i<c.hits;i++)c.contact(i);
  }
};
// Plays a move; contact(i) applies hit i. Without an effect sheet (reduced motion, common foes,
// missing art) the damage still lands through the ordinary attack.
// How high a flying boss rises: about a third of its height, never so high its crown leaves the stage.
// In a flying pose (its sheet's crown: the top of the drawing in its first frame), the top of the wings
// stays below the boss's HUD at the top of the stage.
function foeRise(c,pose=null){
  let top=foeBody().top;
  const sheet=pose&&spriteDefinition('enemy',state.enemyKey,pose).sheet,el=actor('enemy').querySelector('.sprite-body');
  if((sheet?.peak!=null||sheet?.crown)&&el){const box=el.getBoundingClientRect(),scene=$('scene').getBoundingClientRect(),grow=(sheet.scale||1)/(+el.dataset.scale||1),h=box.height*grow,foot=box.top-scene.top+box.height*(sheet.footY||.94);top=foot-h*((sheet.footY||.94)-(sheet.peak??sheet.crown[1]/256));}
  return Math.max(0,Math.min(c.g.source.height*.3,top-46));
}
// A breath cone (look.stream: its narrow tongue at the right end of the sheet) pinned by that end to a
// point and reaching to another: the sheet turns about its tongue, so the breath always leaves the mouth.
function foeConeAim(node,from,to){
  // The tongue starts a few pixels inside the jaws so no gap shows between mouth and breath.
  const d=Math.hypot(to.x-from.x,to.y-from.y)||1,ux=(to.x-from.x)/d,uy=(to.y-from.y)/d,x=from.x-ux*5,y=from.y-uy*5;
  Object.assign(node.style,{left:x+'px',top:y+'px',width:d+5+'px',translate:'-100% -50%',transformOrigin:'100% 50%',rotate:Math.atan2(uy,ux)*180/Math.PI-180+'deg'});
}
// A living breath from the boss's mouth (look.stream, a cone sheet): its tongue follows the mouth smoothly
// through every pose and bob, the cone flickers and sways, its end sweeps over the hero's ground, a hot
// flare burns at the jaws and sparks (look.ember) stream out along it. Returns stop().
function foeBreathStream(c,stream,mouth,to,thick,{sweep=.45,ember=c.look.ember||'#ffb347'}={}){
  if(!stream)return {stop(){}};
  const jet=foeFx(stream,to,thick,{loop:true,duration:stream.count*55,z:7}),flare=document.createElement('span');flare.className='foe-flare';flare.style.setProperty('--flare',ember);$('combatEffects').append(flare);
  let at=mouth(),running=true,last=0;const t0=performance.now();
  jet.node.animate([{opacity:0},{opacity:1}],{duration:160});
  const tick=now=>{
    if(!running)return;const m=mouth(),t=(now-t0)/1000;
    at={x:at.x+(m.x-at.x)*.5,y:at.y+(m.y-at.y)*.5};
    const aim={x:to.x+Math.sin(t*2.4)*c.g.target.width*sweep,y:to.y+Math.sin(t*3.7)*6};
    foeConeAim(jet.node,at,aim);jet.node.style.scale=`1 ${1+.14*Math.sin(t*15)+.06*Math.sin(t*37)}`;
    flare.style.left=at.x+'px';flare.style.top=at.y+'px';flare.style.scale=String(.85+.25*Math.abs(Math.sin(t*11)));
    if(now-last>60){last=now;const spark=document.createElement('span');spark.className='foe-mote';spark.style.cssText=`left:${at.x}px;top:${at.y}px;--mote:${ember};width:${6+Math.random()*6}px;height:${6+Math.random()*6}px`;$('combatEffects').append(spark);
      const end={x:at.x+(aim.x-at.x)*(.55+Math.random()*.45),y:at.y+(aim.y-at.y)*(.55+Math.random()*.45)+(Math.random()-.5)*thick*.6};
      spark.animate([{left:at.x+'px',top:at.y+'px',opacity:1},{left:end.x+'px',top:end.y+'px',opacity:0,scale:'.3'}],{duration:380+Math.random()*200,easing:'ease-out'}).finished.then(()=>spark.remove(),()=>spark.remove());}
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  return {stop(){running=false;jet.node.animate([{opacity:1},{opacity:0}],{duration:160}).finished.then(()=>jet.stop(),()=>jet.stop());flare.remove();}};
}
// The mouth of the pose the foe is drawn in right now (its sheet's mouth anchors, fractions of the cell,
// per frame), on the stage: where its breath leaves, wherever the pose has carried it.
function foeMouthNow(){
  const el=actor('enemy').querySelector('.sprite-body');if(!el)return null;
  // Drawn mouth anchors first, else the pose's front point (staff tip, sword tip, claw: build.py).
  const {sheet}=spriteDefinition('enemy',state.enemyKey,el.dataset.action),frame=+el.dataset.frame||0,anchor=sheet.mouth?.[frame]||sheet.front?.[frame];if(!anchor)return null;
  const box=el.getBoundingClientRect(),scene=$('scene').getBoundingClientRect();
  return {x:box.left-scene.left+box.width*anchor[0],y:box.top-scene.top+box.height*anchor[1]};
}
// The figures a summon brings: the chapter's elites in their resting pose, or the boss's own shadows.
function foeSummonFigures(c,body){
  const make=(sheet,filter)=>{const el=document.createElement('span');el.className='foe-summon';el.style.cssText=`background:url('${sheet.src}') 0 0/${sheet.cols*100}% ${sheet.rows*100}% no-repeat;filter:${filter}`;return el;};
  if(c.look.shadows&&!(ART.bossFx?.[foeSkillOwner()?.boss+'/minion'])){const sheet=spriteDefinition('enemy',state.enemyKey,'idle').sheet;return [0,1].map(()=>make(sheet,'brightness(.5) contrast(1.3) saturate(1.6) hue-rotate(-25deg) drop-shadow(0 0 3px #ff2a3a) drop-shadow(0 0 10px #b0101c)'));}
  const owner=foeSkillOwner(),chapter=progressionRules.WORLD.CHAPTERS.find(ch=>ch.boss===owner?.boss);
  // A boss with summoned guards of its own (assets/fx/bosses/<boss>/skills/minion.webp) brings two of them.
  const minion=!reduced&&ART.bossFx?.[owner?.boss+'/minion'];
  if(minion)return [0,1].map(()=>make({...minion,cols:1,rows:1},'drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 2px #0009) drop-shadow(0 4px 4px #000a)'));
  return (chapter?.elites||[]).slice(0,2).map(id=>ART.campaignCreatures?.[id]?.idle).filter(Boolean).map(sheet=>make(sheet,'drop-shadow(0 3px 3px #0008)'));
}
// The boss's own pose for a skill (look.pose, an action sheet of its own) when its art has it, else
// the fallback action (attack, cast).
function foeLookPose(look,fallback='attack'){
  const has=name=>name&&spriteDefinition('enemy',state.enemyKey,name).action===name;
  return has(look?.pose)?look.pose:has(fallback)?fallback:'attack';
}
function foeLookSheet(name){const owner=foeSkillOwner();return name&&!reduced&&ART.bossFx?.[owner?.boss+'/'+name]||null;}
// A caster gathers its power first (look.channel: its own sheet at its staff, crown, lantern or mouth,
// with the channel sound), in its cast pose; an expedition ultimate's wind-up turn plays it too.
async function foeChannel(look){
  const channel=look?.channel,sheet=foeLookSheet(channel?.fx);if(!sheet)return;
  const body=foeBody(),g=foeGeometry(),ms=channel.ms||900;
  const at=channel.at==='mouth'?g.mouth:channel.at==='head'?{x:body.x,y:body.top+body.height*.06}:channel.at==='front'?{x:body.left+body.width*.12,y:body.y-body.height*.12}:{x:body.x,y:body.y};
  // The cast pose rises to its peak (frame 4) and holds it while the power gathers.
  const pose=foeLookPose({pose:channel.pose},'cast');bossSkillSound(look.sounds?.channel);
  Array.from({length:(channel.hold??3)+1},(_,f)=>f).forEach((f,k)=>setTimeout(()=>setSpriteFrame('enemy',pose,f),k*Math.min(140,ms/6)));
  // The sheet builds its form once, then its last frame is held, swelling a little, until the release.
  // It never rises past the top of the stage (the boss's HUD sits there): a crown or ornament over the
  // head is pushed down until its top edge stays clear.
  const size=(channel.size||.6)*Math.max(body.width,body.height),build=Math.min(ms*.6,sheet.count*95);
  at.y=Math.max(at.y,size*.42+44);
  // Over the head it glows behind the boss, so a raised sword or staff is never hidden by it.
  const behind=channel.at==='head';
  foeFx(sheet,at,size,{duration:build,behind});await combatV3Wait(build-10);
  const held=foeFx(sheet,at,size,{frame:sheet.count-1,behind});
  await animate(held.node,[{scale:'1',opacity:1},{scale:'1.06',opacity:1,offset:.7},{scale:'1.12',opacity:0}],{duration:ms-build+220}).finally(()=>held.stop());
}
// Stagings whose every blow is heard (a flurry of cuts, a tail lashing twice, walking bolts).
const FOE_EVERY_HIT=new Set(['cataclysm','flurry','rush','tailwhip','strikes','punch','bind','tempest','stormcall','vortex']);
// Stagings that work on the boss itself (guards, heals): the cast pose gathers (frame 3) instead of
// thrusting toward the hero.
const FOE_SELF_MOVES=new Set(['armorcast','ward','bloom','plates','dome','shutters','orbit','pillars','wings','wrap','sigil','shell','mirror','crown','cage','spots','rampart','saturn','backdrop','crescent','pour','rise']);
// Stagings the foe casts (its cast pose and voice) rather than strikes.
const FOE_CAST_MOVES=new Set(['aura','armorcast','armorup','cataclysm','ward','snare','bloom','plates','dome','shutters','orbit','pillars','wings','wrap','sigil','shell','mirror','crown','cage','spots','rampart','saturn','backdrop','crescent','bind','tempest','vortex','summon','flank','pour','rise','spiral','column','drop','boomerang']);
async function foeSkillStrike(skill,raw,hits=1){
  const look=bossSkillLook(skill),sheet=foeSkillSheet(look);
  // A plain armour skill shows no guard image of its own: the boss gathers, then its armour plates circle
  // it (foeGuardAura); the fire dragon still grows its armour on its body (armorup). A skill that also
  // strikes plays its blow (as the tactical bosses' do in the fight), and its armour follows.
  const plated=skill?.shield&&!skill?.heal&&!(raw>0)&&look&&look.move!=='armorup'&&foeLookSheet(look.plate||'plate');
  const wanted=plated?'armorcast':look?.move||skill?.move,move=FOE_MOVES[wanted]?wanted:hits>1?'volley':'eruption';
  foeCurrentSkill=skill?.name||'';
  if(!sheet){if(raw>0)return attack('enemy',raw,{hits});return {amount:0,blocked:0};}
  const elite=foeSkillOwner().tier==='elite',pending=[],ledger={raw:0,applied:0},enemy=actor('enemy');
  // A look's beats stage one burst as several blows (the damage is split, the total unchanged).
  hits=raw>0?Math.max(1,Math.min(9,Math.max(Math.round(hits)||1,look?.beats||0))):0;
  let amount=0,blocked=0;
  const sounds=look?.sounds||{};
  const c={sheet,hits,pace:elite?.8:1,scale:elite?.68:1,size:look?.size||1,ground:look?.ground??.8,g:foeGeometry(),pending,look:look||{},
    sound(cue,options){bossSkillSound(sounds[cue],options);},
    pose(fallback){return foeLookPose(look,fallback);},
    // The cast pose builds to its peak (frame 4: staff, hand or blade thrust toward the hero) and holds
    // it through the release; after a channel it is already there, so it never drops back to rest.
    channeled:false,
    async cast(){const p=foeLookPose(look,'cast'),self=FOE_SELF_MOVES.has(move),top=self?2:3;if(this.channeled){setSpriteFrame('enemy',p,top);return;}for(let f=0;f<=top;f++){setSpriteFrame('enemy',p,f);await combatV3Wait(f?80:30);}},
    extra(key){return foeLookSheet(look?.[key]);},
    contact(i,options){
      if(sounds.hit&&(i===0||FOE_EVERY_HIT.has(move)))bossSkillSound(sounds.hit,{volume:i?.22:.3});
      const r=foeSkillContact(raw/hits,ledger,i,i===hits-1&&!elite,pending,{...options,own:!!look});amount+=r.amount;blocked+=r.blocked;update();
    }};
  enemy.classList.add('combat-v3-acting');enemy.style.zIndex='4';
  try{
    if(look?.channel){await foeChannel(look);c.channeled=true;}
    combatVoice('enemy',FOE_CAST_MOVES.has(move)?'cast':'attack');if(move!=='flight')c.sound('start');
    // An ultimate (one without a set piece of its own) is framed as one: the stage darkens and a warning
    // ring marks the hero's ground before it, and after it one dominant burst lands with a flash.
    const set=skill?.ult&&look&&raw>0&&move!=='cataclysm'&&!reduced;
    const stage=set?await foeUltPrelude(c):null;
    foeUltLesser=!!stage;
    try{await FOE_MOVES[move](c);}finally{foeUltLesser=false;}
    if(stage)await foeUltFinale(c,stage);
    await Promise.all(pending);
    return {amount,blocked};
  }finally{
    await Promise.allSettled(pending);enemy.classList.remove('combat-v3-acting');enemy.style.zIndex='';enemy.style.transform='';enemy.style.filter='';enemy.style.opacity='';
    actor('hero').style.translate='';combatV3Action('enemy','idle');combatV3Action('hero','idle');
  }
}
async function foeSkillAura(){return foeSkillStrike({move:'aura'},0,0);}
// An ultimate's blessing on the boss itself: its sheet blooms behind the boss, standing on the boss's
// feet (the sheet's ground ring at 72% of the cell).
async function foeSkillBless(blessing){
  const owner=foeSkillOwner(),sheet=!reduced&&ART.bossFx?.[owner?.boss+'/'+blessing.fx];if(!sheet)return;
  const body=foeBody(),size=Math.max(body.width*1.25,body.height*1.1),at={x:body.x,y:body.bottom-size*.22},duration=sheet.count*170;
  setSpriteAction('enemy','cast',1000);bossSkillSound(blessing.sound,{volume:.26});
  // Behind the boss as it is, and again over the boss as light (screen), so the sapling glows
  // through the boss instead of hiding behind it.
  foeFx(sheet,at,size,{duration,behind:true});
  const glow=foeFx(sheet,at,size,{duration,z:6});glow.node.style.mixBlendMode='screen';glow.node.style.opacity='.5';
  await combatV3Wait(duration);
}

// ---- An ultimate's frame -----------------------------------------------------------------------
function foeFlash(c){const flash=document.createElement('span');flash.className='foe-flash';$('scene').append(flash);c.pending.push(animate(flash,[{opacity:.45},{opacity:0}],{duration:280,easing:'ease-out'}).finally(()=>flash.remove()));combatV3Camera(-1,true,true,c.pending);}
async function foeUltPrelude(c){
  const t=c.g.target,dim=document.createElement('span');dim.className='foe-dim';$('scene').append(dim);
  const warn=document.createElement('span');warn.className='foe-warn';warn.style.cssText=`left:${t.x}px;top:${t.foot}px;width:${Math.min(t.width*1.6,2*(t.x-8))}px;--warn:${c.look.warn||'#ffd25a'}`;$('combatEffects').append(warn);
  dim.animate([{opacity:0},{opacity:.8}],{duration:380,fill:'forwards'});
  await animate(warn,[{opacity:0,scale:'.3'},{opacity:1,scale:'1'}],{duration:400,easing:'ease-out',fill:'forwards'});
  const pulse=warn.animate([{opacity:1},{opacity:.4},{opacity:1}],{duration:260,iterations:Infinity});
  await combatV3Wait(260);
  return {dim,warn,pulse};
}
async function foeUltFinale(c,{dim,warn,pulse}){
  if(c.landed){pulse.cancel();warn.remove();c.pending.push(animate(dim,[{opacity:.8},{opacity:0}],{duration:520,fill:'forwards'}).finally(()=>dim.remove()));return;}
  const t=c.g.target,g=c.ground,big=foeFitSize(c.g.body*1.7*c.scale,t.x,t.foot,g),at={x:t.x,y:t.foot-big*(g-.5)};
  pulse.cancel();warn.remove();
  // The boss's own finishing set piece (assets/fx/bosses/<boss>/skills/climax), its peak at frame 3.
  const climax=c.extra('climax')||foeLookSheet('climax');
  if(climax){const size=c.look.stage?$('scene').clientHeight*c.look.stage*.95:foeFitSize(c.g.body*2*c.scale,t.x,t.foot,.85);foeNoFit=!!c.look.stage;foeFx(climax,{x:t.x,y:t.foot-size*.35},size,{duration:climax.count*120,z:7});foeNoFit=false;await combatV3Wait(330);}
  else{foeFx(c.sheet,at,big,{from:1,duration:(c.sheet.count-1)*100,z:7});await combatV3Wait(200);}
  const flash=document.createElement('span');flash.className='foe-flash';$('scene').append(flash);
  c.pending.push(animate(flash,[{opacity:.42},{opacity:0}],{duration:260,easing:'ease-out'}).finally(()=>flash.remove()));
  await foeImpact(c,200);combatV3Camera(-1,true,true,c.pending);
  c.pending.push(animate(dim,[{opacity:.8},{opacity:0}],{duration:520,fill:'forwards'}).finally(()=>dim.remove()));
  await combatV3Wait(300);
}

// ---- What a skill leaves behind ---------------------------------------------------------------
// A drain: motes of the skill's sheet stream along curves from the hero into the boss's body, which pulses.
async function foeDrainFlow(look){
  if(reduced)return;
  const g=foeGeometry(),body=foeBody(),from={x:g.target.x,y:g.target.y-g.target.height*.1},to={x:body.x,y:body.y-body.height*.05},count=9,color=look.drain||'#ffe6a0';
  const flights=Array.from({length:count},(_,k)=>{
    const lift=(k%2?-1:1)*(.15+.07*(k%3))*g.body,mid={x:(from.x+to.x)/2,y:(from.y+to.y)/2+lift};
    const mote=document.createElement('span');mote.className='foe-mote';mote.style.cssText=`left:${from.x}px;top:${from.y}px;--mote:${color}`;$('combatEffects').append(mote);
    return animate(mote,[{left:from.x+'px',top:from.y+'px',opacity:0,scale:'.5'},{opacity:1,scale:'1.1',offset:.15},{left:mid.x+'px',top:mid.y+'px',scale:'1'},{left:to.x+'px',top:to.y+'px',opacity:.9,scale:'.5'}],{duration:640,delay:k*65,easing:'cubic-bezier(.4,0,.6,1)'}).finally(()=>mote.remove());
  });
  await Promise.all(flights);
  await actor('enemy').animate([{filter:'brightness(1)'},{filter:'brightness(1.5) saturate(1.3)'},{filter:'brightness(1)'}],{duration:420}).finished.catch(()=>{});
}
// A heal: motes of the skill's sheet rise round the boss and sink into its chest, which glows.
async function foeHealFlow(look){
  if(reduced)return;
  const body=foeBody(),to={x:body.x,y:body.y-body.height*.05},count=12,color=look.heal||'#b8ffc8';
  const flights=Array.from({length:count},(_,k)=>{
    const a=k/count*2*Math.PI,from={x:body.x+Math.cos(a)*body.width*.7,y:body.y+Math.sin(a)*body.height*.5};
    const mote=document.createElement('span');mote.className='foe-mote';mote.style.cssText=`left:${from.x}px;top:${from.y}px;--mote:${color}`;$('combatEffects').append(mote);
    return animate(mote,[{left:from.x+'px',top:from.y+'px',opacity:0},{opacity:1,offset:.25},{left:to.x+'px',top:to.y+'px',opacity:.9,scale:'.4'}],{duration:620,delay:k*40,easing:'cubic-bezier(.5,0,.7,1)'}).finally(()=>mote.remove());
  });
  await Promise.all(flights);
  await actor('enemy').animate([{filter:'brightness(1)'},{filter:'brightness(1.5) saturate(1.2)'},{filter:'brightness(1)'}],{duration:440}).finished.catch(()=>{});
}
// The boss's own armour while it holds (state.enemyArmor): pieces of its guard's sheet circle it on a
// flat ellipse, each with a short fading trail, passing behind the boss on the far side. A boss with an
// armoured idle of its own (the fire dragon) wears that too (src/sprite-runtime.js).
let foeAura=null;
// alive: while the armour holds (the boss's armour by default; an expedition boss's shell pool otherwise).
function foeGuardAura(look,alive=()=>state.enemyArmor>0){
  foeAura?.stop();foeAura=null;const sheet=foeLookSheet(look.fx);if(!sheet||reduced)return;
  let body=foeBody(),measured=performance.now(),running=true;
  // The pieces that circle it: the boss's own armour plate (assets/fx/bosses/<boss>/skills/plate), else
  // the guard sheet's peak frame (the dragon's own scales).
  const plate=foeLookSheet(look.plate||'plate'),piece=plate||sheet,count=plate||look.move==='armorup'?5:0,trail=0,size=body.height*(plate?.44:.28),peak=Math.min(3,piece.count-1),nodes=[];
  for(let k=0;k<count;k++)for(let t=0;t<=trail;t++){
    const fx=foeFx(piece,{x:body.x,y:body.y},size*(1-t*.16),{frame:peak,z:6});fx.node.style.opacity=String((1-t/(trail+1))*.95);
    fx.node.style.filter=(fx.node.style.filter||'')+' drop-shadow(0 0 2px #fff) drop-shadow(0 2px 4px #000a)';nodes.push({fx,k,t,front:true});
  }
  // A restrained copy of the whole guard stands behind the boss too, breathing, so the armour reads as
  // worn around it rather than as loose pieces.
  // (A boss wearing armour of its own, armorup, needs no shell behind it.)
  const shell=foeFx(sheet,{x:body.x,y:body.y+body.height*.05},Math.max(body.width,body.height)*1.12,{frame:sheet.count-1,behind:true});shell.node.style.display='none';
  const near=foeFx(sheet,{x:body.x,y:body.y+body.height*.05},Math.max(body.width,body.height)*1.12,{frame:sheet.count-1,z:6});near.node.style.display='none';
  const breathe=shell.node.animate(plate?[{opacity:.3},{opacity:.5},{opacity:.3}]:[{opacity:.6},{opacity:.85},{opacity:.6}],{duration:1600,iterations:Infinity}),glint=near.node.animate([{opacity:.45},{opacity:.7},{opacity:.45}],{duration:1600,iterations:Infinity});
  // The plates appear in place round the boss (no image of the whole guard first).
  for(const n of nodes)n.fx.node.animate([{opacity:0,scale:'.4'},{opacity:1,scale:'1'}],{duration:320,easing:'ease-out'});
  const tick=now=>{
    if(!running)return;
    if(!alive()||!state.boss||!actor('enemy')?.isConnected){stop();return;}
    copy();
    if(now-measured>500){body=foeBody();measured=now;for(const n of [shell,near])Object.assign(n.node.style,{left:body.x+'px',top:body.y+body.height*.05+'px'});}
    const rx=body.width*.62,ry=body.height*.15,cy=body.y-(plate?body.height*.04:-body.height*.15);
    for(const n of nodes){
      const a=now/650+n.k*2*Math.PI/count-n.t*.13,front=Math.sin(a)>0;
      n.fx.node.style.left=body.x+Math.cos(a)*rx+'px';n.fx.node.style.top=cy+Math.sin(a)*ry+'px';n.fx.node.style.scale=String(.8+.2*Math.sin(a));
      if(front!==n.front){n.front=front;(front?$('combatEffects'):$('scene')).append(n.fx.node);n.fx.node.style.zIndex=front?'6':'1';}
    }
    requestAnimationFrame(tick);
  };
  // The armour on the body itself: a glaze cut to the boss's own drawing (its sprite as a mask), tinted
  // with the guard's colour, a bright band sweeping across it now and then.
  const skin=actor('enemy').querySelector('.sprite-body'),glaze=document.createElement('span');glaze.className='foe-glaze';glaze.setAttribute('aria-hidden','true');
  glaze.style.setProperty('--glaze',look.glaze||'#ffd98a');glaze.style.opacity='.75';skin?.append(glaze);
  const copy=()=>{if(!skin)return;for(const [m,v] of [['maskImage',skin.style.backgroundImage],['maskSize',skin.style.backgroundSize],['maskPosition',skin.style.backgroundPosition]]){glaze.style[m]=v;glaze.style['webkit'+m[0].toUpperCase()+m.slice(1)]=v;}};
  const stop=()=>{running=false;glaze.remove();breathe.cancel();glint.cancel();shell.stop();near.stop();for(const n of nodes)n.fx.stop();if(foeAura?.stop===stop)foeAura=null;};
  foeAura={stop};requestAnimationFrame(tick);
}

function foeEmblem(fx,status){
  const sheet=foeLookSheet(fx);if(!sheet||reduced)return;
  const body=foeBody(),size=Math.max(body.width,body.height)*.42,at={x:body.x,y:Math.max(body.top+size*.1,size*.42+44)};
  const held=foeFx(sheet,at,size,{frame:sheet.count-1,z:6}),glow=held.node.animate([{opacity:.75},{opacity:1},{opacity:.75}],{duration:1400,iterations:Infinity});
  const watch=setInterval(()=>{if(!foeHas(status)||!state.boss||!actor('enemy')?.isConnected){clearInterval(watch);glow.cancel();held.stop();}},300);
}

// ---- Summoned guards (expedition bosses) ------------------------------------------------------
// The guards a boss has summoned stand in front of it until they fall (boss-tactics adds: each its own
// health), each drawn with the boss's own minion art and a health bar; new ones rise out of the ground.
function foeGuardSlots(count,body){
  const gap=Math.max(60,body.left-combatV3Point('hero').x),w=body.height*.46;
  return Array.from({length:count},(_,k)=>({x:body.left+body.width*.08-(k%3)*Math.min(w*.62,gap*.3)-(k>=3?w*.3:0),y:body.bottom+(k>=3?-10:4),z:k>=3?3:5,w:w*(k>=3?.86:1)}));
}
function foeGuardsRender(adds){
  const scene=$('scene');if(!scene)return;
  let layer=$('foeGuards');if(!layer){layer=document.createElement('div');layer.id='foeGuards';layer.className='foe-guards';scene.append(layer);}
  const owner=foeSkillOwner(),art=ART.bossFx?.[owner?.boss+'/minion'];
  if(!adds?.length||!art||!state.boss){layer.replaceChildren();return;}
  const body=foeBody(),slots=foeGuardSlots(adds.length,body),nodes=[...layer.children];
  while(nodes.length>adds.length){const gone=nodes.shift();gone.classList.add('falling');setTimeout(()=>gone.remove(),520);}
  adds.forEach((m,k)=>{
    let el=nodes[k];
    if(!el){el=document.createElement('span');el.className='foe-guard rising';el.setAttribute('aria-label','Hộ vệ');el.innerHTML='<i></i><b><em></em></b>';el.querySelector('i').style.backgroundImage=`url('${art.src}')`;layer.append(el);setTimeout(()=>el.classList.remove('rising'),700);}
    const s=slots[k];Object.assign(el.style,{left:s.x+'px',top:s.y+'px',width:s.w+'px',height:s.w+'px',zIndex:s.z});
    el.querySelector('em').style.width=Math.max(0,m.hp/m.max*100)+'%';
  });
}
// Every guard standing lunges at the hero in turn; the damage is split between them.
async function foeGuardsAttack(raw){
  const guards=[...($('foeGuards')?.children||[])].filter(g=>!g.classList.contains('falling'));
  if(!guards.length||reduced)return attack('enemy',raw,{hits:1});
  const pending=[],ledger={raw:0,applied:0},hero=combatV3Point('hero');
  for(const [k,g] of guards.entries()){
    const box=g.getBoundingClientRect(),scene=$('scene').getBoundingClientRect(),dx=hero.x+hero.width*.35-(box.left-scene.left+box.width*.3);
    await animate(g,[{transform:'translate(0,0)'},{transform:'translate(10px,2px)',offset:.25},{transform:`translate(${dx}px,-6px)`,offset:.6},{transform:'translate(0,0)'}],{duration:520,easing:'cubic-bezier(.3,.6,.3,1)'});
    foeSkillContact(raw/guards.length,ledger,k,false,pending);
  }
  await Promise.allSettled(pending);update();
}

// ---- One whole skill --------------------------------------------------------------------------
// base: the foe's skill damage before the skill's own power (enemySkillBase × level scaling).
async function castFoeSkill(skill,base,{charge=1,announce=true}={}){
  const name=skill.name,pending=[],who=progressionBattle?.enemyName||MONSTERS[state.enemyKey]?.name||'';
  if(announce){
    if(skill.ult){message(who+' · TUYỆT CHIÊU · '+name);popActorSkill('enemy','TUYỆT CHIÊU · '+name,true,pending);}
    else{message(who+' dùng '+name);popActorSkill('enemy',name,true,pending);}
  }
  const selfFirst=skill.status&&skill.status.target==='self'&&['stealth','invulnerable'].includes(skill.status.id);
  if(selfFirst)await applyFoeStatus(skill.status,base,pending);
  let result={amount:0,blocked:0};const previous=state.hp;
  if(skill.power>0){
    if(skill.drain)state.energy=Math.max(0,state.energy-skill.drain);
    let raw=base*skill.power*charge;
    if(skill.kind==='execute'&&state.hp/HEROES[state.key].hp<skill.threshold)raw*=skill.bonus;
    if(skill.shatter)state.armor=Math.round(state.armor*(1-skill.shatter));
    const reserved=skill.pierce?Math.floor(state.armor*skill.pierce):0;state.armor-=reserved;
    try{result=await foeSkillStrike(skill,raw,skill.hits||1);}finally{state.armor+=reserved;}
  }else if(skill.shield||skill.heal||bossSkillLook(skill))await foeSkillStrike({name:skill.name,move:skill.move||'aura',shield:skill.shield,heal:skill.heal},0,0);
  const look=bossSkillLook(skill),blessing=look?.bless,plain={plain:!!look};
  if(blessing)await foeSkillBless(blessing);
  // What a drain takes visibly flows from the hero into the boss before it heals or charges it.
  if(look&&((skill.leech&&previous>state.hp)||skill.drain))await foeDrainFlow(look);
  if(skill.leech&&previous>state.hp)await buff('enemy','heal',Math.round((previous-state.hp)*skill.leech),plain);
  if(skill.shield)await buff('enemy','armor',Math.round(state.enemyMax*skill.shield),plain);
  // The boss's armour stays on it while it holds: its guard's pieces circle it (foeGuardAura).
  if(skill.shield&&look&&!skill.power)foeGuardAura(look);
  if(skill.heal&&look)await foeHealFlow(look);
  if(skill.heal)await buff('enemy','heal',Math.round(state.enemyMax*skill.heal),plain);
  if(skill.status&&!selfFirst)await applyFoeStatus(skill.status,base,pending);
  // A status the boss wears (look.emblem: a sheet of its own, held over its head) stays visible while it lasts.
  if(look?.emblem&&skill.status)foeEmblem(look.emblem,skill.status.id);
  await Promise.allSettled(pending);update();
  return result;
}
