/* Balance simulator (docs/GAME_DESIGN.md §5): plays whole fights on a seeded 8×8 board with the
 * shared rules (progression.js stats, kits, encounters) and a simplified copy of the combat loop:
 * cascades, sword chains (+15% per chained wave, every third a ×1.5 crit), hearts, shields, energy,
 * freeze, the hero's ultimate and the foe's skills. It estimates win rates; it is not the combat
 * code itself, so treat results as relative (hero A vs hero B, before vs after a tuning change).
 *   node qa/gemwoven/balance-sim.cjs [fights=300] [--json out.json]   prints a table (and keeps a JSON copy)
 */
const M=require('../../src/gemwoven/progression.js'),R=require('../../src/gemwoven/board-rules.js');
// TF=shell opens the same Biến Thân window with no effect at all (the baseline a look's spike is measured against).
// BOARD_OLD=1 replays the rules before the board round (7/2/5/2/2, no guard, ice drain); TF=none|old|new picks the Biến Thân model.
// STEP2=1 keeps the old rage table with the new control, combo rage and one ultimate a turn (step ii alone).
const BOSS_SWORD=+(process.env.BOSS_SWORD||(process.env.BOARD_OLD==='1'?1.15:R.FOE_SWORD.boss));
const STEP2=process.env.STEP2==='1',OLD=process.env.BOARD_OLD==='1',TF=process.env.TF||(OLD?'none':'new');
const SIZE=8,TYPES=5,SWORD=0,HEART=1,CRYSTAL=2,SNOW=3,SHIELD=4;
const BEATS={fire:'ice',earth:'lightning',ice:'earth',lightning:'fire'};
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
// ---- Board ----
function matches(b){const hit=new Set();
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE-2;c++){const t=b[r*SIZE+c];if(t>=0&&t===b[r*SIZE+c+1]&&t===b[r*SIZE+c+2]){hit.add(r*SIZE+c);hit.add(r*SIZE+c+1);hit.add(r*SIZE+c+2);}}
  for(let c=0;c<SIZE;c++)for(let r=0;r<SIZE-2;r++){const t=b[r*SIZE+c];if(t>=0&&t===b[(r+1)*SIZE+c]&&t===b[(r+2)*SIZE+c]){hit.add(r*SIZE+c);hit.add((r+1)*SIZE+c);hit.add((r+2)*SIZE+c);}}
  return hit;}
function fill(b,rand){for(let c=0;c<SIZE;c++){let w=SIZE-1;for(let r=SIZE-1;r>=0;r--){const t=b[r*SIZE+c];if(t>=0){b[w*SIZE+c]=t;w--;}}for(;w>=0;w--)b[w*SIZE+c]=Math.floor(rand()*TYPES);}}
function board(rand){const b=new Array(SIZE*SIZE);do{for(let i=0;i<b.length;i++)b[i]=Math.floor(rand()*TYPES);let m;while((m=matches(b)).size){for(const i of m)b[i]=-1;fill(b,rand);}}while(!moves(b).length);return b;}
function swap(b,i,j){const t=b[i];b[i]=b[j];b[j]=t;}
function moves(b){const out=[];for(let i=0;i<b.length;i++)for(const j of [i%SIZE<SIZE-1?i+1:-1,i+SIZE<b.length?i+SIZE:-1]){if(j<0)continue;swap(b,i,j);const m=matches(b);swap(b,i,j);if(m.size)out.push([i,j,m]);}return out;}
// Resolve one move: waves of matched tiles (cascades refill at random).
function resolve(b,[i,j],rand){swap(b,i,j);const waves=[];let m;while((m=matches(b)).size){const counts=[0,0,0,0,0];for(const k of m){counts[b[k]]++;b[k]=-1;}waves.push(counts);fill(b,rand);}
  if(!moves(b).length){const fresh=board(rand);for(let k=0;k<b.length;k++)b[k]=fresh[k];}return waves;}
// ---- Fight ----
function fight(hero,enc,seed,{skill=.8}={}){
  const rand=rng(seed),b=board(rand),kit=hero.kit,s=hero.stats;
  const st={hp:s.hp,max:s.hp,armor:0,energy:kit.startEnergy||0,eHp:enc.enemyHp,eMax:enc.enemyHp,eArmor:0,eEnergy:0,stun:0,frozen:false,burn:null,regen:0,stored:0,enraged:false,turn:0,ults:0,foeTurns:0,lost:0,
    guard:0,iceBar:0,sealFree:0,tf:0,tfUsed:false,dodge:false,dodged:false,tfDmg:0,tfTurns:0,baseDmg:0,baseTurns:0};
  const heroCap=Math.max(999,Math.round(st.max*.5)),foeCap=Math.max(999,Math.round(st.eMax*.08));
  const heroMult=(hero.key!=='novice'&&hero.key!=='shadow'&&BEATS[hero.key]===enc.enemyKey)?1.5:1;
  const foeMult=(hero.key!=='shadow'&&BEATS[enc.enemyKey]===hero.key)?1.5:1;
  // Biến Thân: the old shared +Công (BOARD_OLD or TF=old) or each hero's board effect (TF=new, the default); TF=none skips it.
  const tfKit=TF==='none'||!kit.transform?null:TF==='shell'?{turns:kit.transform.turns,reduce:1e-9}:TF==='old'?{turns:kit.transform.turns,attack:.25+(Math.max(1,kit.ranks[3])-1)*.15/9,after:.1}:kit.transform;
  const takeHero=n=>{n=Math.round(n*foeMult*(st.enraged?1.25:1)*(1-kit.damageReduction)*(st.tf>0?1-(tfKit.reduce||.15):1)*Math.max(.5,1-s.defense));const blocked=Math.min(st.armor,n);st.armor-=blocked;st.hp-=n-blocked;};
  const storing=()=>hero.key==='earth'&&(st.stun>0||st.sealFree>0);
  // Nori's seal: his hits still land and a share of each also builds the burst (owner 05/11; SEAL_STORE overrides for tuning).
  // Biến Thân power (each hero's own number, TF_POWER overrides for tuning) lifts all hero damage while it lasts.
  const sealStore=process.env.SEAL_STORE!=null?+process.env.SEAL_STORE:OLD?null:R.NORI_SEAL_STORE.pve;
  const tfPower=()=>{if(!(st.tf>0)||TF!=='new'||!tfKit)return 0;const o=process.env.TF_POWER&&JSON.parse(process.env.TF_POWER);return o&&o[hero.key]!=null?o[hero.key]:tfKit.power||0;};
  const hitFoe=n=>{n=Math.round(n*heroMult*(1+tfPower()));if(st.tf>0)st.tfDmg+=n;else st.baseDmg+=n;if(storing()){if(sealStore==null){st.stored+=n;return;}st.stored+=Math.round(n*sealStore);}const blocked=Math.min(st.eArmor,n);st.eArmor-=blocked;st.eHp-=n-blocked;if(!st.enraged&&enc.boss&&st.eHp<=st.eMax*.4)st.enraged=true;};
  const heal=n=>{const before=st.hp;st.hp=Math.min(st.max,st.hp+n);return st.hp-before;};
  const blocked=()=>!OLD&&(st.guard>0||st.frozen||st.stun>0);
  // The burst lands once, without the element, power or other multipliers a second time (as combat does).
  const burst=()=>{const b2=Math.round(st.stored*(st.burstMult||kit.burst));st.stored=0;st.burstMult=0;const blocked=Math.min(st.eArmor,b2);st.eArmor-=blocked;st.eHp-=b2-blocked;if(st.tf>0)st.tfDmg+=b2;else st.baseDmg+=b2;};
  const value=(m,side)=>{let v=0;const own=side==='hero';for(const k of m){const t=b[k];v+=t===SWORD?1:t===CRYSTAL?(own?(st.energy>=60?.9:.6):.7):t===HEART?(own?(st.hp<st.max*.5?1:.3):.3):t===SHIELD?.4:.35;}return v;};
  const pick=side=>{const list=moves(b);let best=list[0],bv=-1;for(const mv of list){const v=value(mv[2],side)+rand()*.01;if(v>bv){bv=v;best=mv;}}return rand()<(side==='hero'?skill:.85)?best:list[Math.floor(rand()*list.length)];};
  const enemySkills=enc.skillSet.length?enc.skillSet:[{kind:'strike',power:1}];let skillTurn=0;
  // Old Lumi: every colour ×(2 + 0.05 × passive); new Lumi: her purple value, other colours by the table.
  const oldFactor=hero.key==='lightning'?2+.05*kit.ranks[1]:1;
  // Combat has no turn limit; 200 rounds only stops a stalemate (counted as a loss, reported apart).
  while(st.hp>0&&st.eHp>0&&st.turn<200){
    st.turn++;
    // Hero turn (start of turn: burn on foe, regen, earth heal-over-time).
    if(st.burn){hitFoe(st.burn.dmg);if(--st.burn.turns<=0)st.burn=null;}
    if(kit.regen)heal(Math.round(st.max*kit.regen));if(st.regen>0){heal(kit.heal*s.attack**.5|0);st.regen--;}
    if(tfKit&&!st.tfUsed&&(st.hp<=st.max*.5||st.ults>=2)){st.tfUsed=true;st.tf=tfKit.turns;}
    const tf=st.tf>0?tfKit:null,tfNew=tf&&TF!=='old';if(tf)st.tfTurns++;else st.baseTurns++;
    const waves=resolve(b,pick('hero'),rand);let chain=0,rage=0,firstSword=0,burned=false,overflow=0,ice=0;
    for(const [wi,w] of waves.entries()){
      chain=w[SWORD]?chain+1:0;
      if(w[SWORD]){const crit=chain>=3&&chain%3===0?1.5:1;let mult=1;
        if(tf&&TF==='old')mult*=1+tf.attack;else if(!tf&&TF==='old'&&st.tfUsed)mult*=1+tfKit.after;
        if(tfNew){if(!firstSword)firstSword=wi+1;const first=firstSword===wi+1;
          if(tf.firstSword&&first)mult*=1+tf.firstSword;if(tf.cascadeCrit&&wi+1>=tf.cascadeCrit.waves)mult*=tf.cascadeCrit.mult;
          if(tf.burn&&first&&!burned){burned=true;const dmg=tf.burn.base*s.attack;if(!(st.burn&&st.burn.dmg>=dmg))st.burn={dmg,turns:tf.burn.turns};}}
        hitFoe(w[SWORD]*8*kit.sword*(kit.pveSword||1)*kit.attackScale*s.attack*(1+Math.min(6,chain-1)*.15)*crit*mult);}
      const support=tfNew&&tf.support||1;
      if(w[HEART]){const amount=Math.round(w[HEART]*Math.max(Math.round(6*Math.max(1,Math.sqrt(s.attack))),Math.round(st.max*.012))*support),got=heal(amount);
        if(tfNew&&tf.overflowArmor&&amount>got){const add=Math.min(Math.round(st.max*tf.overflowCap)-overflow,Math.round((amount-got)*tf.overflowArmor));if(add>0){overflow+=add;st.armor=Math.min(heroCap,st.armor+add);}}}
      if(w[SHIELD])st.armor=Math.min(heroCap,st.armor+Math.round(w[SHIELD]*Math.max(kit.shieldGem,Math.round(st.max*.015*kit.shieldGem/4))*support));
      if(OLD){st.energy=Math.min(199,st.energy+(w[SWORD]*7+w[HEART]*2+w[CRYSTAL]*5+w[SNOW]*2+w[SHIELD]*2)*oldFactor);if(w[SNOW]>=3)st.frozen=true;continue;}
      let gain=STEP2?(w[SWORD]*7+w[HEART]*2+w[CRYSTAL]*5+w[SNOW]*2+w[SHIELD]*2)*oldFactor:w.reduce((sum,n,type)=>sum+n*R.heroRage(type,{purple:tfNew&&tf.purple||kit.purple||0}),0);
      if(tfNew&&tf.rageCap)gain=Math.max(0,Math.min(gain,tf.rageCap-rage));rage+=gain;st.energy=Math.min(R.ULTIMATE.cap,st.energy+gain);ice+=w[SNOW];
    }
    if(!OLD){
      let bonus=R.comboRage(waves.length);if(tfNew&&tf.rageCap)bonus=Math.max(0,Math.min(bonus,tf.rageCap-rage));st.energy=Math.min(R.ULTIMATE.cap,st.energy+bonus);
      if(ice&&!blocked()){const need=R.iceThreshold(enc.boss,tfNew?tf:null);
        st.iceBar+=ice;if(st.iceBar>=need){st.iceBar=0;st.frozen=true;}}
      if(tfNew&&tf.dodge&&waves.length>=tf.dodge.waves&&!st.dodged){st.dodged=true;st.dodge=true;}
    }
    if(st.eHp<=0)break;
    for(let cast=0;st.energy>=100&&st.eHp>0&&(OLD||cast<(+process.env.ULT_PER_TURN||R.ULTIMATE.perTurn));cast++){st.energy-=100;st.ults++;const exec=kit.execute&&st.eHp<st.eMax*kit.execute.threshold?kit.execute.bonus:1;
      // Nori form 3 (owner 14/11): each further ultimate this turn raises the seal's burst (progression.js noriChainBurst).
      if(hero.key==='earth'&&kit.form===3){const chain=M.noriChainBurst(kit.burst,cast+1);st.burstMult=st.stun>0||st.sealFree>0?Math.max(st.burstMult||kit.burst,chain):chain;}
      if(hero.key==='earth'){if(blocked()){if(!st.sealFree)st.sealFree=kit.stun;}else st.stun=Math.max(st.stun,kit.stun);st.regen=kit.regenTurns;}
      else hitFoe(kit.base*kit.power*s.attack*exec*(TF==='old'&&tf?1+tf.attack:1));
      if(hero.key==='ice'){st.armor=Math.min(heroCap,st.armor+kit.armor);if(!blocked())st.stun=Math.max(st.stun,1);if(kit.mutationArmor)st.armor=Math.min(heroCap,st.armor+Math.round(st.max*kit.mutationArmor));}
      if(kit.burn)st.burn={dmg:kit.burn.base*s.attack,turns:kit.burn.turns};
      if(kit.drain)st.eEnergy=Math.max(0,st.eEnergy-kit.drain);if(kit.echo)hitFoe(kit.echo*s.attack);if(kit.enemyDrain)st.eEnergy=Math.max(0,st.eEnergy-kit.enemyDrain);
      if(hero.key==='earth'&&kit.mutationArmor)st.armor=Math.min(heroCap,st.armor+Math.round(st.max*kit.mutationArmor));
    }
    if(st.tf>0&&--st.tf===0)st.dodge=false;
    if(st.eHp<=0)break;
    // Foe turn. A skipped turn ends the control and raises the guard (1 full action, boss 2); a full action lowers it.
    st.foeTurns++;
    if(st.frozen){st.frozen=false;st.lost++;if(!OLD)st.guard=enc.boss?R.CONTROL_GUARD.boss:R.CONTROL_GUARD.common;continue;}
    if(st.stun>0){st.stun--;st.lost++;if(!st.stun){if(st.stored)burst();if(!OLD)st.guard=enc.boss?R.CONTROL_GUARD.boss:R.CONTROL_GUARD.common;}continue;}
    const dodging=st.dodge;st.dodge=false;
    const foeWaves=resolve(b,pick('enemy'),rand);chain=0;let firstCrystal=true,firstSnow=true;
    for(const w of foeWaves){
      chain=w[SWORD]?chain+1:0;
      if(w[SWORD]&&!dodging){const crit=chain>=3&&chain%3===0?1.5:1;takeHero(w[SWORD]*8*(enc.boss?BOSS_SWORD:R.FOE_SWORD.common)*enc.enemyAttack*(1+Math.min(6,chain-1)*.15)*crit);}
      if(w[HEART])st.eHp=Math.min(st.eMax,st.eHp+w[HEART]*Math.max(6,Math.round(st.eMax*.002)));
      if(w[SHIELD])st.eArmor=Math.min(foeCap,st.eArmor+w[SHIELD]*Math.max(5,Math.round(st.eMax*.003)));
      const tiles=w.reduce((a,n)=>a+n,0);st.eEnergy=Math.min(100,st.eEnergy+R.FOE_RAGE.perGem*tiles+(w[CRYSTAL]&&firstCrystal?R.FOE_RAGE.firstCrystal:0));if(w[CRYSTAL])firstCrystal=false;
      if(OLD&&w[SNOW]&&firstSnow){st.energy=Math.max(0,st.energy-20);firstSnow=false;}
    }
    if(st.hp<=0)break;
    // Bosses cast at 100 energy (the runtime threshold); elites and common foes follow the four-turn cycle (guard, skill, heal).
    const cycle=st.turn%4,cast=enc.boss?st.eEnergy>=(OLD?80:R.ULTIMATE.cost):cycle===2||st.eEnergy>=100;
    if(!enc.boss&&cycle===1)st.eArmor=Math.min(foeCap,st.eArmor+Math.round(st.eMax*.03));
    if(!enc.boss&&cycle===3&&st.eHp<st.eMax*.65)st.eHp=Math.min(st.eMax,st.eHp+Math.round(st.eMax*.04));
    if(cast){st.eEnergy=enc.boss&&!OLD?st.eEnergy-R.ULTIMATE.cost:0;const sk=enemySkills[skillTurn++%enemySkills.length];
      if(sk.kind==='guard')st.eArmor=Math.min(foeCap,st.eArmor+Math.round(st.eMax*(sk.shield||.04)));
      else{takeHero(enc.enemySkillBase*(sk.power||1)*enc.enemyAttack);if(sk.kind==='drain')st.energy=Math.max(0,st.energy-(sk.drain||15));}}
    if(!OLD){if(st.guard>0)st.guard--;if(st.sealFree>0&&--st.sealFree===0&&st.stored)burst();}
  }
  return {won:st.eHp<=0&&st.hp>0,turns:st.turn,hpLeft:Math.max(0,st.hp)/st.max,ults:st.ults,foeTurns:st.foeTurns,lost:st.lost,tfDmg:st.tfDmg,tfTurns:st.tfTurns,baseDmg:st.baseDmg,baseTurns:st.baseTurns};
}
// ---- Scenarios ----
function heroAt(key,level,stars,evolution,{gear=null,gearLevel=0,skills,relic=true}={}){
  const p={heroes:{[key]:{level,stars,evolution,copies:1,skills:skills||[Math.min(10,1+Math.floor(level/20)),level>=10?Math.min(10,Math.floor(level/20)):0,evolution>=2?Math.min(10,Math.floor(level/40)):0,evolution>=5?1:0],gear:{},relic:relic?{level:Math.min(100,Math.max(1,Math.floor(level/5))),evolution:Math.min(5,1+Math.floor(level/50))}:{level:1,evolution:1},ticketMilestones:[]}},equipment:[]};
  if(gear)for(const slot of Object.keys(M.SLOTS)){const id='g-'+slot;p.equipment.push({id,slot,rarity:gear,level:gearLevel,affix:null});p.heroes[key].gear[slot]=id;}
  return {key,stats:M.stats(p,key),kit:M.skillKit(key,p.heroes[key])};
}
// Typical progress at a recommended level: evolution the stars allow, gear tier of the forge gates.
// What a player who only levels up has: evolution the stars allow, no gear, first skill rank only.
function bare(key,level,stars){const evo=M.EVOLUTION.filter(e=>level>=e.level&&stars>=e.stars).length;return heroAt(key,level,stars,evo,{skills:[1,level>=10?1:0,evo>=2?1:0,0],relic:false});}
function typical(key,level,stars){const evo=M.EVOLUTION.filter(e=>level>=e.level&&stars>=e.stars).length;const gear=level>=60?'epic':level>=30?'rare':level>=10?'uncommon':null;return heroAt(key,level,stars,evo,{gear,gearLevel:Math.min(20,Math.floor(level/8))});}
// Also reports the ultimate cadence (hero turns per ultimate) and the share of foe turns lost to freeze or stun.
function rate(hero,mode,index,n){let won=0,turns=0,allTurns=0,ults=0,foeTurns=0,lost=0,tfDmg=0,tfTurns=0,baseDmg=0,baseTurns=0;for(let i=0;i<n;i++){const r=fight(hero,M.encounter(mode,index),1000+i*7919);allTurns+=r.turns;ults+=r.ults;tfDmg+=r.tfDmg;tfTurns+=r.tfTurns;baseDmg+=r.baseDmg;baseTurns+=r.baseTurns;foeTurns+=r.foeTurns;lost+=r.lost;if(r.won){won++;turns+=r.turns;}}
  return {win:won/n,turns:won?turns/won:null,cadence:ults?allTurns/ults:null,lockShare:foeTurns?lost/foeTurns:0,
    // Damage per hero turn while Biến Thân is up against the rest of the fight (how strong the spike feels).
    tfSpike:tfTurns&&baseTurns&&baseDmg?(tfDmg/tfTurns)/(baseDmg/baseTurns):null};}
// --six: the six heroes at 1/4/6★ (level = recommended) against a common stage, an elite and two bosses.
function six(n){const rows=[],heroes=[['Hiro','novice'],['Mika','fire'],['Yuki','ice'],['Nori','earth'],['Lumi','lightning'],['Noct','shadow']];
  const stages=[['ải 12 thường',12],['ải 10 tinh anh',10],['ải 50 boss',50],['ải 100 boss',100]];
  for(const [label,index] of stages){const rec=M.encounter('campaign',index).recommended;
    for(const [name,key] of heroes)for(const stars of key==='novice'?[1,2]:[1,4,6]){const h=typical(key,rec,stars),r=rate(h,'campaign',index,n);
      rows.push({stage:label,hero:name+' '+stars+'★',level:rec,power:h.stats.power,win:Math.round(r.win*100),turns:r.turns&&Math.round(r.turns),cadence:r.cadence&&+r.cadence.toFixed(1),lock:Math.round(r.lockShare*100)});}}
  return rows;}
if(require.main===module&&process.argv.includes('--six')){
  const n=Number(process.argv[2])||200,rows=six(n);
  const at=process.argv.indexOf('--json');if(at>0&&process.argv[at+1])require('node:fs').writeFileSync(process.argv[at+1],JSON.stringify({fights:n,rows},null,1));
  console.log('stage'.padEnd(16),'hero     lvl  power  win% turns ult/turns lock%');
  for(const r of rows)console.log(r.stage.padEnd(16),r.hero.padEnd(8),String(r.level).padStart(3),String(r.power).padStart(6),String(r.win).padStart(4)+'%',String(r.turns??'-').padStart(5),String(r.cadence??'-').padStart(9),String(r.lock).padStart(4)+'%');
}else if(require.main===module){
  const n=Number(process.argv[2])||300,rows=[];
  const cases=[
    ['Ch1 ải 10 (tinh anh)',10],['Ch1 ải 50 (boss)',50],['Ch2 ải 75',75],['Ch2 ải 100 (boss)',100],['Ch3 ải 150 (boss)',150],['Ch5 ải 250 (boss)',250]];
  const heroes=[['Hiro trần','novice',1,bare],['Hiro 1★','novice',1],['Hiro 2★','novice',2],['Mika trần','fire',1,bare],['Mika 1★','fire',1],['Mika 4★','fire',4],['Noct 6★','shadow',6]];
  for(const [label,index] of cases){const rec=M.encounter('campaign',index).recommended;
    for(const mult of [1,1.5,2])for(const [name,key,stars,make=typical] of heroes){const level=Math.min(500,Math.round(rec*mult)),h=make(key,level,stars),r=rate(h,'campaign',index,n);
      rows.push({stage:label,rec,level,hero:name,power:h.stats.power,win:Math.round(r.win*100),turns:r.turns&&Math.round(r.turns)});}}
  // Reports stay out of Git: pass --json <path> to keep one.
  const at=process.argv.indexOf('--json');if(at>0&&process.argv[at+1])require('node:fs').writeFileSync(process.argv[at+1],JSON.stringify({fights:n,rows},null,1));
  console.log('stage'.padEnd(22),'rec lvl hero      power  win% turns');
  for(const r of rows)console.log(r.stage.padEnd(22),String(r.rec).padStart(3),String(r.level).padStart(3),r.hero.padEnd(9),String(r.power).padStart(7),String(r.win).padStart(4)+'%',String(r.turns??'-').padStart(4));
}
module.exports={fight,heroAt,typical,bare,rate,six};
