// Board control and Biến Thân effects (docs/GAME_DESIGN.md §20 "Vòng Bàn ngọc", owner 05/11). Numbers live in
// src/gemwoven/board-rules.js (shared with the opponent AI and the balance simulator) and in each hero's kit.
//   Ice: 3 in one board resolution freezes a common foe or an elite; a boss fills a bar to 6 across turns.
//   Guard: after a stun or freeze ends, the foe completes 1 full action (boss 2) before stun or freeze can land again.
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
// One hero ice gem collected in this resolution (count = ice so far in it). Rage from ice is paid by the caller either way.
function boardIceGem(count){
  if(controlBlocked())return;
  const need=BOARD_RULES.iceThreshold(state.boss,transformEffect());
  if(state.boss){state.iceBar=(state.iceBar||0)+1;if(state.iceBar>=need){state.iceBar=0;state.frozen=true;popActorSkill('enemy','ĐÓNG BĂNG',false);}}
  else if(count>=need){state.frozen=true;}
}
// Per side, the ultimates cast in the current own turn (reset when that side's turn begins).
const boardUltTurn={hero:0,enemy:0};
function boardUltAllowed(side){
  if(boardUltTurn[side]>=BOARD_RULES.ULTIMATE.perTurn)return false;
  return side==='hero'?turn!=='enemy':turn==='enemy';
}
const boardControlCast=castReadyUltimates;
castReadyUltimates=async function(){
  for(const side of ['hero','enemy']){
    if(state.hp<=0||state.enemyHp<=0)return;
    if(side==='enemy'&&noriSealHolds())continue;
    const key=side==='hero'?'energy':'enemyEnergy';if(state[key]<BOARD_RULES.ULTIMATE.cost||!boardUltAllowed(side))continue;
    if(side==='hero'&&typeof foeSilenced==='function'&&foeSilenced()){message('Bị phong ấn: tuyệt kỹ chưa thể dùng.');continue;}
    state[key]-=BOARD_RULES.ULTIMATE.cost;boardUltTurn[side]++;update();
    if(side==='hero')await heroUltimate();else await enemySkill({reserved:true});
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
