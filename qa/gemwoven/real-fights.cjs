/* Real-combat check for the balance simulator (docs/GAME_DESIGN.md §5.2): a bot plays whole fights in
 * Game.html (the real combat code, effects reduced) with a save built exactly like balance-sim's
 * heroes, so the simulator's win rates and fight lengths can be checked against the game itself.
 * The bot plays like the simulator: the game's own hint score, the best move 80% of the time,
 * the ultimate as soon as it is ready.
 *   node qa/gemwoven/real-fights.cjs [fights=20] [--pages 3] [--json out.json] [--only "Hiro 1★"] [--stage 100] [--mult 1,1.5]
 * Needs the dev server on 127.0.0.1:8080 and Edge (Playwright channel msedge).
 */
const path=require('node:path'),fs=require('node:fs');
const {chromium}=require(path.join(__dirname,'runtime/node_modules/playwright'));
const M=require('../../src/gemwoven/progression.js');
const BASE=process.env.GW_URL||'http://127.0.0.1:8080/';
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i>0?process.argv[i+1]:fallback;};
const FIGHTS=Number(process.argv[2])||20,PAGES=Number(arg('--pages',3)),ONLY=arg('--only',null);
// Same heroes as balance-sim.cjs (heroAt / typical / bare).
function heroSave(key,level,stars,{bare=false}={}){
  const evolution=M.EVOLUTION.filter(e=>level>=e.level&&stars>=e.stars).length;
  const skills=bare?[1,level>=10?1:0,evolution>=2?1:0,0]:[Math.min(10,1+Math.floor(level/20)),level>=10?Math.min(10,Math.floor(level/20)):0,evolution>=2?Math.min(10,Math.floor(level/40)):0,evolution>=5?1:0];
  const relic=bare?{level:1,evolution:1}:{level:Math.min(100,Math.max(1,Math.floor(level/5))),evolution:Math.min(5,1+Math.floor(level/50))};
  const gear=bare?null:level>=60?'epic':level>=30?'rare':level>=10?'uncommon':null,equipment=[],worn={};
  if(gear)for(const slot of Object.keys(M.SLOTS)){const id='qa-'+slot;equipment.push({id,slot,rarity:gear,level:Math.min(20,Math.floor(level/8)),affix:null});worn[slot]=id;}
  return {key,hero:{level,stars,evolution,copies:1,skills,gear:worn,relic},equipment};
}
const CASES=[
  ['Hiro trần','novice',1,{bare:true}],['Hiro 1★','novice',1],['Hiro 2★','novice',2],
  ['Mika trần','fire',1,{bare:true}],['Mika 1★','fire',1]];
const STAGES=[['Ch1 ải 50 (boss)',50],['Ch2 ải 100 (boss)',100],['Ch2 ải 75',75]].filter(([,i])=>!arg('--stage',null)||String(i)===arg('--stage',null));
const MULTS=(arg('--mult','1,1.5')).split(',').map(Number);
async function oneFight(page,save,index){
  await page.goto(BASE+'Game.html?qa',{waitUntil:'load'});
  const token=await page.evaluate(({save,index})=>{
    const M=window.GemwovenProgression,KEY='gemwoven.progression.v1';
    localStorage.removeItem(KEY);const e=M.makeEngine(localStorage);e.read();
    const p=JSON.parse(localStorage.getItem(KEY));
    p.heroes[save.key]={...(p.heroes.novice),...save.hero,ticketMilestones:[]};
    p.equipment=save.equipment;p.selected=save.key;p.campaign.cleared=Math.max(p.campaign.cleared,index-1);p.pending=null;
    localStorage.setItem(KEY,JSON.stringify(p));
    return M.makeEngine(localStorage).begin('campaign',index).token;
  },{save,index});
  await page.goto(BASE+'Game.html?qa&encounter='+encodeURIComponent(token),{waitUntil:'load'});
  await page.waitForFunction(()=>window.gameQA&&document.getElementById('startBtn'),null,{timeout:30000});
  await page.evaluate(()=>{window.gameQA.setReduced(true);});
  await page.waitForTimeout(300);
  await page.evaluate(()=>{const b=document.getElementById('startBtn');if(b&&document.getElementById('selectDialog').open)b.click();});
  return page.evaluate(async()=>{
    const q=window.gameQA,sleep=ms=>new Promise(r=>setTimeout(r,ms)),t0=performance.now();
    let moves=0,ults=0,dealt=0,lastHp=q.state.enemyHp;
    while(!q.ended&&performance.now()-t0<5*60000){
      if(document.getElementById('resultDialog').open)break;
      if(q.locked||document.getElementById('selectDialog').open){await sleep(15);continue;}
      // Biến Thân as soon as it is offered (a player would).
      const tf=document.querySelector('#transformBtn:not([hidden]):not(:disabled)');if(tf){tf.click();await sleep(30);}
      if(q.state.energy>=100){const before=q.state.energy;await q.activateSkill();if(q.state.energy<before)ults++;continue;}
      const list=q.legalMoves(true);if(!list.length){await sleep(30);continue;}
      let best=list[0];for(const m of list)if(m.score+Math.random()*.01>best.score)best=m;
      const m=Math.random()<.8?best:list[Math.floor(Math.random()*list.length)];
      const ok=await q.trySwap(m.a,m.b);if(ok!==false)moves++;
    }
    for(let i=0;i<200&&!document.getElementById('resultDialog').open;i++)await sleep(25);
    return {won:q.state.hp>0&&q.state.enemyHp<=0,moves,turns:q.progressionTurns,ults,hpLeft:Math.max(0,q.state.hp),enemyLeft:Math.max(0,q.state.enemyHp)/q.state.enemyMax,seconds:Math.round((performance.now()-t0)/1000)};
  });
}
(async()=>{
  // Each page has its own context (its own save in localStorage); static files are fetched once and served
  // from memory, so the dev server is not asked for every asset per fight.
  const browser=await chromium.launch({channel:'msedge'}),jobs=[],cache=new Map();
  async function contextWithCache(){
    const context=await browser.newContext({viewport:{width:1100,height:800}});
    await context.route(/\/(assets|src)\/|\.(js|css|webp|png|ogg|wav|mp3|json|woff2)(\?|$)/,async route=>{
      const url=route.request().url();
      if(!cache.has(url))cache.set(url,(async()=>{const r=await route.fetch();return {status:r.status(),headers:r.headers(),body:await r.body()};})());
      try{await route.fulfill(await cache.get(url));}catch{cache.delete(url);await route.continue();}
    });
    return context;
  }
  for(const [stage,index] of STAGES)for(const [label,key,stars,opt] of CASES){
    if(ONLY&&!label.includes(ONLY))continue;
    const rec=M.encounter('campaign',index).recommended;
    for(const mult of MULTS)for(let i=0;i<FIGHTS;i++)jobs.push({stage,index,label,level:Math.round(rec*mult),save:heroSave(key,Math.round(rec*mult),stars,opt)});
  }
  const results=[];let next=0;
  await Promise.all(Array.from({length:PAGES},async()=>{
    const context=await contextWithCache(),page=await context.newPage();
    while(next<jobs.length){const job=jobs[next++];let last=null;
      for(let attempt=0;attempt<3;attempt++){try{results.push({...job,save:undefined,...await oneFight(page,job.save,job.index)});last=null;break;}catch(e){last=e;await page.waitForTimeout(2000);}}
      if(last)results.push({...job,save:undefined,error:String(last.message).slice(0,120)});
      if(results.length%10===0)console.error(`${results.length}/${jobs.length}`);}
    await context.close();
  }));
  await browser.close();
  const groups={};for(const r of results){const g=groups[r.stage+'|'+r.label+'|'+r.level]??={stage:r.stage,hero:r.label,level:r.level,n:0,won:0,turns:0,errors:0};
    if(r.error){g.errors++;continue;}g.n++;if(r.won){g.won++;g.turns+=r.turns||r.moves;}}
  const rows=Object.values(groups).map(g=>({...g,win:g.n?Math.round(g.won/g.n*100):null,turns:g.won?Math.round(g.turns/g.won):null}));
  const out=arg('--json',null);if(out)fs.writeFileSync(out,JSON.stringify({fights:FIGHTS,rows,results},null,1));
  console.log('stage'.padEnd(20),'hero'.padEnd(10),'lvl  n  win% turns err');
  for(const r of rows)console.log(r.stage.padEnd(20),r.hero.padEnd(10),String(r.level).padStart(3),String(r.n).padStart(3),String(r.win).padStart(4)+'%',String(r.turns??'-').padStart(5),String(r.errors).padStart(3));
})();
