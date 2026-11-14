// Plaza NPCs in place for review: phone 390x844 DPR2 and the Studio page (Game (Hub) tab) at 1920x911.
// The square opens offline (no social server) so the camera can stand by each NPC.
//   node assets/gemwoven/raw/plaza-npc/npcshot.cjs <outdir> [frameMs]
const {chromium}=require('../../../../qa/gemwoven/runtime/node_modules/playwright');
const fs=require('fs'),path=require('path');
const OUT=path.resolve(process.argv[2]||'npcshot')+'/';fs.mkdirSync(OUT,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const SPOTS=[['guide',[440,1260]],['weaver',[600,480]]];
async function prep(page){
  await page.evaluate(()=>{const K='gemwoven.progression.v1';window.GemwovenProgression.makeEngine(localStorage).read();const s=JSON.parse(localStorage.getItem(K));s.heroes.fire={...s.heroes.novice,level:45,stars:4};s.selected='fire';localStorage.setItem(K,JSON.stringify(s));localStorage.setItem('gemwoven.plaza.v1',JSON.stringify({helped:true}));});
}
async function stand(f,pos){await f.evaluate(p=>{const P=window.GemwovenPlaza.state;const c=P.root.querySelector('.pz-sheet:not([hidden]) .pz-close');if(c)c.click();P.me.pos=[...p];P.me.target=[...p];},pos);await sleep(1800);}
// Tap the NPC (she is in reach): her sheet opens (help for the guide, the lantern for the weaver).
async function talk(f,id){await f.evaluate(id=>{const a=window.GemwovenPlaza.state.actors.get('npc-'+id);a.el.querySelector('.pz-hit').click();},id);await sleep(1500);}
(async()=>{
  const b=await chromium.launch({channel:'chrome'});const errs=[];
  const init=()=>{window.GEMWOVEN_SOCIAL_URL='ws://127.0.0.1:9/none';};
  const ph=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});await ph.addInitScript(init);
  const p=await ph.newPage();p.on('pageerror',e=>errs.push('phone: '+e.message));p.on('response',r=>{if(r.status()>=400)errs.push('phone '+r.status()+' '+r.url());});
  await p.goto('http://127.0.0.1:8080/Gemwoven.html#home');await sleep(2000);await prep(p);
  await p.goto('http://127.0.0.1:8080/Gemwoven.html#chat');await sleep(5000);
  for(const [id,pos] of SPOTS){await stand(p,pos);await p.screenshot({path:OUT+`phone-${id}.png`});await talk(p,id);await p.screenshot({path:OUT+`phone-${id}-sheet.png`});}
  await p.evaluate(()=>document.documentElement.classList.add('reduced-motion'));  // what Cài Đặt › Hiệu ứng động off sets
  await stand(p,SPOTS[0][1]);await p.screenshot({path:OUT+'phone-guide-reduced.png'});
  console.log(await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches+' '+[...window.GemwovenPlaza.state.actors.values()].filter(a=>a.npc).map(a=>a.id+':'+a.frame).join(' ')));
  const dk=await b.newContext({viewport:{width:1920,height:911}});await dk.addInitScript(init);
  const d=await dk.newPage();d.on('pageerror',e=>errs.push('studio: '+e.message));
  await d.goto('http://127.0.0.1:8080/Gemwoven.html#home');await sleep(2000);await prep(d);
  await d.goto('http://127.0.0.1:8080/tools/studio.html');await sleep(2500);
  const tab=d.locator('text=Game (Hub)').first();if(await tab.count())await tab.click();await sleep(2500);
  const fr=d.frames().find(f=>/Gemwoven\.html/.test(f.url()));await fr.evaluate(()=>{location.hash='chat';});await sleep(5000);
  for(const [id,pos] of SPOTS){await stand(fr,pos);await d.screenshot({path:OUT+`studio-${id}.png`});await talk(fr,id);await d.screenshot({path:OUT+`studio-${id}-sheet.png`});}
  console.log(JSON.stringify(errs.slice(0,10)));await b.close();
})();
