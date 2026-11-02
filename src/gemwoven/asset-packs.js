/* Which asset packs an account needs (docs/GAME_DESIGN.md §16). Pack ids follow
 * scripts/build_asset_packs.cjs: core, summon, chapter-N, hero-<key>-f<form>. Nothing is downloaded
 * for a chapter not yet open or a hero not owned; the next chapter, the next endless floor's chapter
 * and the banner hero's first form are prefetched so they open without waiting.
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenAssetPacks=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const rules=()=>typeof module==='object'&&module.exports?require('./progression.js'):globalThis.GemwovenProgression;
  function packsFor(p,M=rules()){
    const W=M.WORLD,chapters=W.CHAPTERS.length,need=new Set(['core','chapter-1','hero-novice-f1']),prefetch=new Set();
    const open=Math.min(chapters,Math.floor((p.campaign?.cleared||0)/50)+1);
    for(let c=1;c<=open;c++)need.add('chapter-'+c);
    if(open<chapters)prefetch.add('chapter-'+(open+1));
    // Endless floors cycle the chapters: floors already beaten are needed, the next one is prefetched.
    const best=p.boss?.best||0;for(let f=1;f<=Math.min(best,chapters);f++)need.add('chapter-'+f);
    prefetch.add('chapter-'+(best%chapters+1));
    for(const [key,h] of Object.entries(p.heroes||{}))for(let f=1;f<=M.formMax(key,h);f++)need.add(`hero-${key}-f${f}`);
    const banner=M.SUMMON_BANNER.hero;need.add('summon');prefetch.add(`hero-${banner}-f1`);
    for(const id of need)prefetch.delete(id);
    return {need:[...need],prefetch:[...prefetch]};
  }
  // Bytes still to fetch for an account, given packs.json and the ids already cached.
  function download(p,catalog,cached=[],M=rules()){
    const want=packsFor(p,M),have=new Set(cached),size=id=>catalog.packs.find(x=>x.id===id)?.bytes||0;
    const missing=want.need.filter(id=>!have.has(id));
    return {missing,bytes:missing.reduce((n,id)=>n+size(id),0),prefetch:want.prefetch.filter(id=>!have.has(id))};
  }
  return {packsFor,download};
});
