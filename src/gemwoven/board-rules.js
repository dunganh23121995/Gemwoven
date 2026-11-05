/* Board rules shared by combat (src/live-combat.js, src/game.js), the opponent AI (src/opponent-ai.js) and the balance
 * simulator (qa/gemwoven/balance-sim.cjs), so the three can never drift (docs/GAME_DESIGN.md §20 "Vòng Bàn ngọc",
 * Claude + Codex, owner 05/11). Gems: 0 Kiếm, 1 Tim, 2 Tím, 3 Băng, 4 Khiên.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenBoardRules=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const GEM={sword:0,heart:1,crystal:2,snow:3,shield:4};
  // Rage a gem gives the hero (and both players in duels): purple is the rage gem, every colour still charges a little.
  const HERO_RAGE=[3,2,7,2,2];
  // A foe in PvE keeps its own rule: 3 a gem, and 25 more for the first purple of a resolution.
  const FOE_RAGE={perGem:3,firstCrystal:25};
  // A foe's sword gem (×8 × its attack). Bosses hit at the original 1.15 (owner 05/11: the 0.82 trial is undone).
  const FOE_SWORD={common:.55,boss:1.15};
  // Nori's seal: his hits during it still land, and this share of each also builds the burst (owner 05/11). PvE stores
  // the whole hit; duels store 2/3, so n + 2/3·n × 3 keeps the old damage budget there (Codex).
  const NORI_SEAL_STORE={pve:1,duel:2/3};
  // One bonus per board resolution by its number of waves (only the highest tier reached, never summed).
  const COMBO_RAGE=[0,0,3,6,10,15];
  const comboRage=waves=>COMBO_RAGE[Math.max(0,Math.min(COMBO_RAGE.length-1,Math.floor(waves)||0))];
  // An ultimate costs 100 rage; the gauge banks up to 199; each side casts at most one in its own turn, after its board.
  const ULTIMATE={cost:100,cap:199,perTurn:1};
  // Ice (owner 05/11): every ice gem a side collects builds up on its opponent across turns; 6 freeze a common foe, an
  // elite or a PvP player, a boss needs 9; the count resets on a freeze.
  const ICE={common:6,boss:9};
  // After a stun or freeze ends, a boss must complete 2 full actions before stun or freeze can land again. Common foes,
  // elites and PvP players have no guard (owner 05/11: "kháng đóng băng chỉ áp dụng cho boss, quái thì vẫn bị tích luôn").
  const CONTROL_GUARD={common:0,boss:2};
  const iceThreshold=(boss,transform)=>transform?.ice?(boss?transform.ice.boss:transform.ice.common):boss?ICE.boss:ICE.common;
  const guardTurns=boss=>boss?CONTROL_GUARD.boss:CONTROL_GUARD.common;
  // Rage for one hero gem: the table, a kit's purple value (Lumi, Lumi's Biến Thân), then a kit-wide factor (borrowed
  // energy, foe effects).
  function heroRage(type,{purple=0,factor=1}={}){const base=type===GEM.crystal&&purple?purple:HERO_RAGE[type]||0;return base*factor;}
  // Kits (progression.js skillKit) own the hero numbers: Lumi's purple value and each hero's Biến Thân effect.
  return {GEM,HERO_RAGE,FOE_RAGE,FOE_SWORD,NORI_SEAL_STORE,COMBO_RAGE,comboRage,ULTIMATE,ICE,CONTROL_GUARD,iceThreshold,guardTurns,heroRage};
});
