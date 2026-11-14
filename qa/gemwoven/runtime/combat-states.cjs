// Which sprite sheets each hero form really plays in combat (owner 12/11: the Studio's sheet list shows only the
// character's combat states). Presses every combat button in tools/hero-gallery.html for every hero and form and
// records the hero's sprite actions and the frames each one shows (owner 14/11: Noct 2's departure borrows one pose of
// its skill and cast sheets, then runs: the Studio opens the sheet a moment really plays and marks borrowed poses);
// writes assets/heroes/combat-states.json, which the Studio and build.py (the plaza's walk) read.
// Run from qa/gemwoven/runtime with the Studio server up: node combat-states.cjs [http://127.0.0.1:8080] [hero ...]
// (owner 14/11: after changing one hero, name it: only that hero is measured and merged into the file)
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const args=process.argv.slice(2),base=args.find(a=>/^https?:/.test(a))||'http://127.0.0.1:8080',only=args.filter(a=>!/^https?:/.test(a));
const BUTTONS=['attack','hit','ultimate','depart','afterglow','transform'];
(async()=>{
  const browser=await chromium.launch({channel:'chrome',headless:false,args:['--window-position=-2400,0']});
  const first=await browser.newPage({viewport:{width:1920,height:911}});
  await first.goto(base+'/tools/hero-gallery.html',{waitUntil:'load'});await first.waitForTimeout(5000);
  const heroes=(await first.$$eval('#hero option',o=>o.map(x=>x.value))).filter(h=>!only.length||only.includes(h));await first.close();
  const file=path.resolve(__dirname,'../../../assets/heroes/combat-states.json');
  const old=only.length&&fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  const out={...(old.heroes||{})},frames={...(old.frames||{})};
  for(const hero of heroes){
    // a fresh page per hero (13/11: one page through every hero's 18 combat runs ran out of renderer memory and crashed)
    const page=await browser.newPage({viewport:{width:1920,height:911}});
    await page.goto(`${base}/tools/hero-gallery.html?hero=${hero}`,{waitUntil:'load'});await page.waitForTimeout(6000);
    const forms=await page.locator('#forms button').count();out[hero]={};frames[hero]={};
    for(let f=1;f<=forms;f++){
      await page.locator('#forms button').nth(f-1).click();await page.waitForTimeout(3000);
      await page.evaluate(()=>{const w=document.getElementById('game').contentWindow;w.__seen={};w.__frames={};w.__cur='';
        new w.MutationObserver(()=>{for(const el of w.document.querySelectorAll('.sprite-body')){
          if(el.dataset.family!=='hero'||!el.closest('.actor')||!w.__cur)continue;const a=el.dataset.action;
          if(a&&a!=='idle'){(w.__seen[w.__cur]||=new Set()).add(a);((w.__frames[w.__cur]||={})[a]||=new Set()).add(+el.dataset.frame||0);}}}).observe(w.document.body,{attributes:true,subtree:true,attributeFilter:['data-frame','data-action']});});
      for(const b of BUTTONS){
        const btn=page.locator(`#combatBar [data-do="${b}"]`);if(!(await btn.count()))continue;
        await page.evaluate(b=>{document.getElementById('game').contentWindow.__cur=b;},b);
        await btn.first().click();await page.waitForTimeout(b==='transform'?7000:4500);
        await page.evaluate(()=>{document.getElementById('game').contentWindow.__cur='';});
        await page.locator('#combatBar [data-do="idle"]').click();await page.waitForTimeout(900);
      }
      out[hero][f]=await page.evaluate(()=>Object.fromEntries(Object.entries(document.getElementById('game').contentWindow.__seen).map(([k,v])=>[k,[...v]])));
      frames[hero][f]=await page.evaluate(()=>Object.fromEntries(Object.entries(document.getElementById('game').contentWindow.__frames).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([a,set])=>[a,[...set].sort((x,y)=>x-y)]))])));
      console.log(hero,f,JSON.stringify(out[hero][f]));
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(file,JSON.stringify({note:'Sprite actions each hero form plays per combat button, in the order first shown, and the frames each shows (qa/gemwoven/runtime/combat-states.cjs); the Studio sheet list and the plaza walk (build.py) read it.',heroes:out,frames},null,1)+'\n');
  console.log('wrote',file);
})();
