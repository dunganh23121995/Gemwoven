// Which sprite sheets each hero form really plays in combat (owner 12/11: the Studio's sheet list shows only the
// character's combat states). Presses every combat button in tools/hero-gallery.html for every hero and form and
// records the hero's sprite actions; writes assets/heroes/combat-states.json, which the Studio reads.
// Run from qa/gemwoven/runtime with the Studio server up: node combat-states.cjs [http://127.0.0.1:8080]
const fs=require('fs'),path=require('path');
const {chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:8080';
const BUTTONS=['attack','hit','ultimate','depart','afterglow','transform'];
(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:false,args:['--window-position=-2400,0']});
  const page=await browser.newPage({viewport:{width:1920,height:911}});
  await page.goto(base+'/tools/hero-gallery.html',{waitUntil:'load'});await page.waitForTimeout(5000);
  const heroes=await page.$$eval('#hero option',o=>o.map(x=>x.value));
  const out={};
  for(const hero of heroes){
    await page.goto(`${base}/tools/hero-gallery.html?hero=${hero}`,{waitUntil:'load'});await page.waitForTimeout(6000);
    const forms=await page.locator('#forms button').count();out[hero]={};
    for(let f=1;f<=forms;f++){
      await page.locator('#forms button').nth(f-1).click();await page.waitForTimeout(3000);
      await page.evaluate(()=>{const w=document.getElementById('game').contentWindow;w.__seen={};w.__cur='';
        new w.MutationObserver(()=>{for(const el of w.document.querySelectorAll('.sprite-body')){
          if(el.dataset.family!=='hero'||!el.closest('.actor')||!w.__cur)continue;const a=el.dataset.action;
          if(a&&a!=='idle')(w.__seen[w.__cur]||=new Set()).add(a);}}).observe(w.document.body,{attributes:true,subtree:true,attributeFilter:['data-frame','data-action']});});
      for(const b of BUTTONS){
        const btn=page.locator(`#combatBar [data-do="${b}"]`);if(!(await btn.count()))continue;
        await page.evaluate(b=>{document.getElementById('game').contentWindow.__cur=b;},b);
        await btn.first().click();await page.waitForTimeout(b==='transform'?7000:4500);
        await page.evaluate(()=>{document.getElementById('game').contentWindow.__cur='';});
        await page.locator('#combatBar [data-do="idle"]').click();await page.waitForTimeout(900);
      }
      out[hero][f]=await page.evaluate(()=>Object.fromEntries(Object.entries(document.getElementById('game').contentWindow.__seen).map(([k,v])=>[k,[...v]])));
      console.log(hero,f,JSON.stringify(out[hero][f]));
    }
  }
  await browser.close();
  const file=path.resolve(__dirname,'../../../assets/heroes/combat-states.json');
  fs.writeFileSync(file,JSON.stringify({note:'Sprite actions each hero form plays per combat button (qa/gemwoven/runtime/combat-states.cjs); the Studio sheet list reads it.',heroes:out},null,1)+'\n');
  console.log('wrote',file);
})();
