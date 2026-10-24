/* Per-hero form kits. A hero whose forms need their own staging (as six-star Noct has in
 * shadow-combat.js) registers it in its own file (src/forms-<hero>.js):
 *   HERO_KITS.fire={forms:{2:{ultimate,attack,depart},3:{...}}}
 * ultimate()            replaces the whole ultimate (damage through the same kit maths)
 * attack(raw,options)   replaces the basic attack; returns {amount,blocked} like attack()
 * depart()              replaces the walk off a cleared stage
 * Any part a form leaves out keeps the shared behaviour. */
const HERO_KITS={};
function heroKit(key,form,part){return HERO_KITS[key]?.forms?.[form]?.[part]||null;}
