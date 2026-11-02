/* Asset packs (docs/GAME_DESIGN.md §16): sorts every runtime file the hub and combat load into
 * packs that are downloaded together — core, one per chapter (its map, scenes, foes, elites, boss,
 * music), one per hero form — and writes assets/packs.json with each pack's files and size.
 * src/gemwoven/asset-packs.js decides which packs an account needs. Source art (raw/, sources/)
 * never ships, so it is not listed.
 *   node scripts/build_asset_packs.cjs
 */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),W=require(path.join(ROOT,'src/gemwoven/world.js'));
const FILE=/assets\/[A-Za-z0-9_.\/-]+\.(?:webp|png|jpg|ogg|wav|mp3|json|woff2)/g;
// Every file a build or source references, plus the hub manifest.
const files=new Set();
for(const rel of ['Game.html','Gemwoven.html',...fs.readdirSync(path.join(ROOT,'src')).filter(f=>f.endsWith('.js')).map(f=>'src/'+f),...fs.readdirSync(path.join(ROOT,'src/gemwoven')).filter(f=>f.endsWith('.js')).map(f=>'src/gemwoven/'+f)]){
  const text=fs.readFileSync(path.join(ROOT,rel),'utf8');for(const m of text.matchAll(FILE))files.add(m[0]);
}
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/gemwoven/manifest.json'),'utf8'));
// Only fields the game loads: source art and prompts (source, sources, prompt*, raw*) never ship.
const SKIP=/^(source|sources|prompt|prompts|promptFile|promptFiles|raw|rawSheet|reference|references)$/;
const walk=v=>{if(typeof v==='string'){for(const m of v.matchAll(FILE))files.add(m[0]);}else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')for(const [k,x] of Object.entries(v))if(!SKIP.test(k))walk(x);};walk(manifest);
// Who owns a path. Bosses share ids with elements (fire, ice...), so the folder before the id decides.
const chapterOf={},bossChapter={};for(const c of W.CHAPTERS){chapterOf[c.id]=c.index;bossChapter[c.boss]=c.index;for(const id of [...c.ordinary,...c.elites])chapterOf[id]??=c.index;}
const HEROES=['novice','fire','ice','earth','lightning','shadow'];
function packOf(file){
  const parts=file.split('/'),name=parts.at(-1);
  const hero=parts.indexOf('heroes'),bossAt=parts.findIndex(p=>['bosses','boss-anim','boss-skills','themes','encounters'].includes(p)),bossId=bossAt>=0?parts[bossAt+1].replace(/\.[a-z0-9]+$/,''):null;
  if(bossChapter[bossId])return 'chapter-'+bossChapter[bossId];
  const heroKey=hero>=0?(parts[hero+1]==='forms'?parts[hero+2]:parts[hero+1]):null;
  if(HEROES.includes(heroKey)){const form=file.match(/form-(\d)/);return `hero-${heroKey}-f${form?form[1]:1}`;}
  const formFx=file.match(/\/fx\/forms\/([a-z]+)-(\d)/);if(formFx&&HEROES.includes(formFx[1]))return `hero-${formFx[1]}-f${formFx[2]}`;
  if(/\/hero-forms\/|\/form-skills\//.test(file)){const h=HEROES.find(h=>file.includes('/'+h));if(h){const form=file.match(/form-?(\d)/);return `hero-${h}-f${form?form[1]:1}`;}}
  for(const seg of [...parts.slice(1,-1),name.replace(/\.[a-z0-9]+$/,'')]){
    const key=seg.replace(/^boss-/,''),theme=key.split(/[-_.]/)[0];
    if(chapterOf[seg])return 'chapter-'+chapterOf[seg];if(chapterOf[key])return 'chapter-'+chapterOf[key];
    if(chapterOf[theme]&&!/^(fire|ice|earth|lightning)$/.test(theme))return 'chapter-'+chapterOf[theme];
  }
  if(file.startsWith('assets/gemwoven/summon/'))return 'summon';
  return 'core';
}
const packs={};let missing=0;
for(const file of [...files].sort()){
  if(/\/(raw|sources?)\/|\/raw-[^/]*$|prompt[^/]*$|\.txt$/.test(file))continue; // reproducibility sources, never shipped
  const abs=path.join(ROOT,file);if(!fs.existsSync(abs)){missing++;continue;}
  const id=packOf(file),pack=packs[id]??={id,files:[],bytes:0};pack.files.push(file);pack.bytes+=fs.statSync(abs).size;
}
// Chapter 1 ships with core so a new account plays at once; the install also carries Hiro.
const out={version:1,generated:'scripts/build_asset_packs.cjs',install:['core','chapter-1','hero-novice-f1'],packs:Object.values(packs).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}))};
fs.writeFileSync(path.join(ROOT,'assets/packs.json'),JSON.stringify(out,null,1)+'\n');
const mb=n=>(n/1048576).toFixed(1)+' MB',total=out.packs.reduce((n,p)=>n+p.bytes,0),install=out.packs.filter(p=>out.install.includes(p.id)).reduce((n,p)=>n+p.bytes,0);
console.log(`${files.size-missing} runtime files, ${out.packs.length} packs, ${mb(total)} in all; install ${mb(install)}${missing?`; ${missing} referenced files not found`:''}`);
for(const p of out.packs)console.log(p.id.padEnd(22),String(p.files.length).padStart(5),mb(p.bytes).padStart(10));
