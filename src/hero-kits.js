/* Per-hero form kits. A hero whose forms need their own staging (as six-star Noct has in
 * shadow-combat.js) registers it in its own file (src/forms-<hero>.js):
 *   HERO_KITS.fire={forms:{2:{ultimate,attack,depart},3:{...}}}
 * ultimate()            replaces the form wrapper's ultimate (its generic sigil and burst). It runs
 *                       outside progression-combat's wrapper (form power, burn, Biến Dị), so a kit
 *                       normally calls formOriginalUltimate() and restages the hero's inner timeline.
 * attack(raw,options)   replaces the basic attack; returns {amount,blocked} like attack()
 * depart()              replaces the walk off a cleared stage
 * Any part a form leaves out keeps the shared behaviour. */
const HERO_KITS={};
function heroKit(key,form,part){return HERO_KITS[key]?.forms?.[form]?.[part]||null;}
// A sheet shown for the first time while it is still loading leaves the hero blank for a frame:
// every sheet and skill strip of the hero in play is fetched and decoded as soon as it appears.
const heroKitLoaded=new Set();
function heroKitPreload(key){
  if(heroKitLoaded.has(key))return;heroKitLoaded.add(key);
  const sheets=[...Object.values(ART.heroForms?.[key]||{}).flatMap(form=>Object.values(form)),...Object.values(ART.heroFx?.[key]||{}),...Object.values(ART.heroes?.[key]||{})];
  for(const src of new Set(sheets.map(sheet=>sheet?.src).filter(Boolean))){const img=new Image();img.src=src;img.decode?.().catch(()=>{});}
}
