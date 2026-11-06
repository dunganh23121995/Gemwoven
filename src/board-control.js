// Board control and Biến Thân effects (docs/GAME_DESIGN.md §20 "Vòng Bàn ngọc", owner 05/11). Numbers live in
// src/gemwoven/board-rules.js (shared with the opponent AI and the balance simulator) and in each hero's kit.
//   Ice (owner 05/11): ice gems build up on the opponent across turns; 6 freeze a common foe, an elite or a PvP player,
//   9 a boss. Nothing builds while a stun, a freeze or the guard is on.
//   Guard (bosses only): after a stun or freeze ends, a boss completes 2 full actions before stun or freeze can land again.
//   Nori's seal still stores damage while the guard is up, but then the foe keeps acting.
//   Ultimates: each side casts at most one in its own turn, after its board resolves; leftover rage is kept.
const BOARD_RULES=GemwovenBoardRules;
// True while a new stun or freeze cannot land: one is already on, or the foe has not yet acted enough since the last one.
function controlBlocked(){return (state.controlGuard||0)>0||!!state.frozen||!!state.stunned||(state.noriStunTurns>0&&!state.noriSealFree);}
function controlEnded(){state.controlGuard=BOARD_RULES.guardTurns(state.boss);}
function controlActed(){if(state.controlGuard>0)state.controlGuard--;}
// A Nori seal that stops the foe (not a guard-time seal that only stores damage).
function noriSealHolds(){return state.noriStunTurns>0&&!state.noriSealFree;}
// The hero's Biến Thân effect while it is on (the kit's transform entry), else null.
function transformEffect(){return progressionTransform?.left>0?(progressionTransformKit()||(progressionSandbox?progressionKit(state.key)?.transform:null)):null;}
// One ice gem the hero collected: it builds up on the foe. Rage from ice is paid by the caller either way.
function boardIceGem(){
  if(controlBlocked())return;
  const need=BOARD_RULES.iceThreshold(state.boss,transformEffect());
  state.iceBar=(state.iceBar||0)+1;if(state.iceBar>=need){state.iceBar=0;state.frozen=true;}
}
// One ice gem the other player collected in a PvP fight: it builds up on the hero (no Biến Thân, no guard in duels).
function boardIceOnHero(){
  if(state.playerFrozen)return;
  state.playerIceBar=(state.playerIceBar||0)+1;
  if(state.playerIceBar>=BOARD_RULES.ICE.common){state.playerIceBar=0;state.playerFrozen=true;state.playerLock='freeze';}
}
// Per side, the ultimates cast in the current own turn (reset when that side's turn begins).
const boardUltTurn={hero:0,enemy:0};
function boardUltAllowed(side){
  if(boardUltTurn[side]>=BOARD_RULES.ULTIMATE.perTurn)return false;
  return side==='hero'?turn!=='enemy':turn==='enemy';
}
castReadyUltimates=async function(){
  for(const side of ['hero','enemy']){
    if(state.hp<=0||state.enemyHp<=0)return;
    if(side==='enemy'&&noriSealHolds())continue;
    // A frozen or stunned hero has lost the turn: the ultimate waits until it is free again.
    if(side==='hero'&&state.playerFrozen)continue;
    const key=side==='hero'?'energy':'enemyEnergy';
    if(side==='hero'&&state[key]>=BOARD_RULES.ULTIMATE.cost&&typeof foeSilenced==='function'&&foeSilenced()){message('Bị phong ấn: tuyệt kỹ chưa thể dùng.');continue;}
    // Every full gauge is cast, one after another (no limit a turn).
    while(state[key]>=BOARD_RULES.ULTIMATE.cost&&boardUltAllowed(side)&&state.hp>0&&state.enemyHp>0){
      state[key]-=BOARD_RULES.ULTIMATE.cost;boardUltTurn[side]++;update();
      if(side==='hero')await heroUltimate();else await enemySkill({reserved:true});
    }
  }
};
// The enemy turn opens a new enemy ultimate allowance; when it is over, the hero's next turn opens a new one.
// A skipped (frozen or stunned) turn ends the control and raises the guard; a full action lowers it.
const boardControlEnemy=enemyAction;
enemyAction=async function(){
  boardUltTurn.enemy=0;
  const sealFree=state.noriSealFree&&state.noriStunTurns>0;
  const skipped=!!(state.frozen||state.stunned||noriSealHolds());
  try{await boardControlEnemy();}
  finally{
    boardUltTurn.hero=0;
    // The hero's turn begins here: rage that filled during the foe's turn is cast right away (owner 05/11), not after
    // the hero's next move (castReadyUltimates checks whose turn it is).
    if(state.hp>0&&state.enemyHp>0)turn='player';
    if(state.hp>0&&state.enemyHp>0){
      if(skipped){if(!noriSealHolds()&&!state.frozen&&!state.stunned)controlEnded();}
      else{controlActed();if(sealFree&&typeof consumeNoriStunTurn==='function')await consumeNoriStunTurn();}
    }
  }
};
// Noct's Biến Thân: a cascade of 3 waves lets him slip the next basic hit (once per Biến Thân).
const boardControlAttack=attack;
attack=async function(side,raw,options={}){
  if(side==='enemy'&&!options.ultimate&&state.tfDodge&&state.hp>0){
    state.tfDodge=false;popActorSkill('hero','NÉ ĐÒN',false);message('Biến Thân: né đòn thường.');update();
    return {amount:0,blocked:0,dodged:true};
  }
  return boardControlAttack(side,raw,options);
};
