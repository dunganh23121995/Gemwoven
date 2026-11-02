// Films the elites in a real campaign fight (needs tools/dev_server.py on port 8080):
//   node qa/gemwoven/capture-elites.cjs [id ...]            every elite when none is named
// Each elite plays its basic blow, both skills, a hurt and its fall; a strip of frames per beat lands in
// qa/gemwoven/elites/<id>-<beat>.png (not tracked) and any page error or stray position is printed.
const path=require('path'),fs=require('fs');
const {chromium}=require(path.join(__dirname,'runtime/node_modules/playwright'));
const W=require('../../src/gemwoven/world.js');
const URL_BASE='http://127.0.0.1:8080',OUT=path.join(__dirname,'elites');fs.mkdirSync(OUT,{recursive:true});
const ids=process.argv.slice(2),stages=[];
W.CHAPTERS.forEach((c,i)=>c.elites.forEach((id,v)=>stages.push({id,stage:i*50+[5,15,25,35,45][v],boss:c.boss,reach:!!W.ELITE_BASIC[id].reach})));
const beats=[['basic',q=>q.foeStrike(40)],['skill1',q=>q.foeCast(0)],['skill2',q=>q.foeCast(1)],['turn',q=>q.enemyAction()]];
(async()=>{
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true}),problems=[];
  for(const s of stages.filter(s=>!ids.length||ids.includes(s.id))){
    const ctx=await browser.newContext({viewport:{width:430,height:760}}),page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/favicon|net::/.test(m.text()))errors.push(m.text());});
    for(let tries=0;;tries++){await page.goto(URL_BASE+'/Gemwoven.html#campaign');const up=await page.waitForFunction(()=>window.GEMWOVEN_GAME?.engine,null,{timeout:30000}).catch(()=>null);if(up)break;if(tries>=3)throw Error('hub did not start');errors.length=0;}
    const token=await page.evaluate(stage=>{const g=GEMWOVEN_GAME.engine,p=g.read();p.campaign.cleared=stage-1;localStorage.setItem(GemwovenProgression.KEY,JSON.stringify(p));return GEMWOVEN_GAME.engine.begin('campaign',stage).token;},s.stage);
    await page.goto(URL_BASE+'/Game.html?qa=1&encounter='+encodeURIComponent(token));
    await page.waitForFunction(()=>window.gameQA&&gameQA.state&&document.querySelector('#enemyActor .sprite-body'));
    await page.waitForTimeout(1500);
    await page.evaluate(({id,boss})=>{const q=gameQA;q.state.qaFoeFx={boss,tier:'elite',creature:id};q.state.hp=99999;q.state.enemyMax=q.state.enemyHp=99999;},s);
    for(const [name,run] of beats){
      const shots=[];
      const job=page.evaluate(code=>{window.__beat=(0,eval)(code)(gameQA);return 0;},run.toString());
      let spanMin=1e9;const started=Date.now();
      for(let k=0;k<12;k++){
        await page.waitForTimeout(k?190:90);
        const x=await page.evaluate(()=>document.querySelector('#enemyActor').getBoundingClientRect().left);spanMin=Math.min(spanMin,x);
        shots.push(await page.locator('#scene').screenshot({type:'jpeg',quality:80}));
      }
      await job;await page.evaluate(()=>window.__beat).catch(e=>errors.push(e.message));
      const home=await page.evaluate(()=>document.querySelector('#enemyActor').getBoundingClientRect().left);
      const moved=Math.round(home-spanMin);
      if(s.reach&&['basic','turn'].includes(name)&&moved>14)problems.push(`${s.id} shoots but moved ${moved}px in ${name}`);
      if(!s.reach&&name==='basic'&&moved<20)problems.push(`${s.id} melee only moved ${moved}px`);
      fs.writeFileSync(path.join(OUT,`${s.id}-${name}.json`),JSON.stringify({ms:Date.now()-started,moved}));
      shots.forEach((b,k)=>fs.writeFileSync(path.join(OUT,`${s.id}-${name}-${String(k).padStart(2,'0')}.jpg`),b));
      await page.waitForTimeout(900);
    }
    // Hurt, then the fall.
    await page.evaluate(()=>gameQA.spriteAction('enemy','hurt',500));await page.waitForTimeout(260);
    fs.writeFileSync(path.join(OUT,`${s.id}-hurt.jpg`),await page.locator('#scene').screenshot({type:'jpeg',quality:80}));
    await page.waitForTimeout(600);
    // The real fall: down to its last health, one blow, and the frames it plays on the way out.
    const frames=await page.evaluate(async()=>{const q=gameQA,seen=[];q.state.qaFoeFx=q.state.qaFoeFx;q.state.enemyArmor=0;q.state.enemyHp=1;const el=document.querySelector('#enemyActor .sprite-body'),t=setInterval(()=>seen.push(el.dataset.action+el.dataset.frame),60);await q.heroStrike(5000);await q.finishBattle();clearInterval(t);return [...new Set(seen)].filter(f=>f.startsWith('defeat'));});
    if(frames.length<5)problems.push(`${s.id} fall shows only ${frames.join(',')}`);
    fs.writeFileSync(path.join(OUT,`${s.id}-defeat.jpg`),await page.locator('#scene').screenshot({type:'jpeg',quality:80}));
    if(errors.length)problems.push(s.id+': '+[...new Set(errors)].slice(0,3).join(' | '));
    console.log(s.id,errors.length?'ERR':'ok');await ctx.close();
  }
  await browser.close();
  console.log(problems.length?problems.join('\n'):'no problems');
})().catch(e=>{console.error(e);process.exit(1);});
