/* Real browser regression checks. Uses a fresh, isolated save and a local server. */
const {chromium}=require('./runtime/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}`,errors=[];
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'chrome',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const page=await context.newPage();
    page.on('pageerror',e=>errors.push(e.message));
    page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))errors.push(r.status()+' '+r.url());});
    await page.goto(url+'/Gemwoven.html');
    async function route(key){
      await page.evaluate(key=>{location.hash=key;},key);
      await page.waitForFunction(key=>document.querySelector('#stage').dataset.screen===key,key);
      await page.waitForTimeout(70);
    }
    for(const key of await page.evaluate(()=>GEMWOVEN_LAYOUT.order)){
      await route(key);
      await page.waitForFunction(()=>[...document.querySelectorAll('#scene img')].every(i=>i.complete&&i.naturalWidth));
      assert.equal(await page.locator('.hub-ambience').count(),1);
      assert.equal(await page.locator('.hub-ambience').evaluate(e=>getComputedStyle(e).pointerEvents),'none');
    }
    await route('campaign');
    assert.equal(await page.locator('.world-pin').count(),7);
    assert.equal(await page.locator('.next-stage .pin-lock').count(),0);
    const terrain=await page.locator('.terrain-band').first().evaluate(e=>getComputedStyle(e).backgroundImage);
    assert.ok(terrain.includes('/assets/gemwoven/')&&!terrain.includes('/src/gemwoven/assets/'),'Terrain resolves from page root');
    assert.ok(await page.locator('.terrain-band').first().evaluate(async e=>{
      const image=new Image();image.src=getComputedStyle(e).backgroundImage.slice(5,-2);await image.decode();return image.naturalWidth>0;
    }));
    await page.locator('#viewport').screenshot({path:path.join(__dirname,'detail-campaign.png')});
    await route('home');
    assert.equal(await page.locator('.home-place textPath').count(),6);
    for(const item of await page.locator('.home-feature-card').all()){
      assert.ok(await item.evaluate(e=>{
        const card=e.getBoundingClientRect(),icon=e.querySelector('.icon').getBoundingClientRect(),label=e.querySelector('.copy-layer').getBoundingClientRect();
        return label.bottom<=card.bottom&&label.top-icon.bottom>=0&&label.top-icon.bottom<8;
      }),'Home icon and label share the extended card');
    }
    await page.locator('#viewport').screenshot({path:path.join(__dirname,'detail-home.png')});
    await route('upgrade');
    for(const tab of ['level','stars','evolution']){
      await page.locator(`[data-action="do:upgrade-tab"][data-tab="${tab}"]`).click();
      for(const tile of await page.locator('.material-tile').all())assert.ok(await tile.evaluate(e=>{
        const icon=e.querySelector('.icon').getBoundingClientRect(),label=e.querySelector('.copy-layer').getBoundingClientRect();
        return icon.bottom<label.top&&label.width>0;
      }),'Material count has its own row');
      await page.locator('#viewport').screenshot({path:path.join(__dirname,`detail-upgrade-${tab}.png`)});
    }
    // Seed only this isolated browser profile to exercise x1 and x10 presentations.
    await page.evaluate(()=>{
      const p=GEMWOVEN_GAME.engine.read();p.wallet.tickets=11;localStorage.setItem(GemwovenProgression.KEY,JSON.stringify(p));
    });
    await route('summon');
    for(const count of [1,10]){
      await page.locator(`[data-action="do:summon"][data-count="${count}"]`).first().click();
      await page.locator('#confirm-summon').click();
      await page.waitForFunction(()=>document.querySelector('#summon-reveal').dataset.phase==='cards');
      assert.equal(await page.locator('.summon-card').count(),count);
      assert.equal(await page.locator('.summon-card.is-open').count(),0);
      assert.equal(await page.locator('.summon-card-front[aria-hidden="true"]').count(),count);
      const committed=await page.evaluate(()=>GEMWOVEN_GAME.engine.exportSave());
      await page.locator('#summon-reveal').screenshot({path:path.join(__dirname,`detail-summon-${count}-sealed.png`)});
      await page.locator('.summon-card').first().click();
      assert.equal(await page.locator('.summon-card.is-open').count(),1);
      if(count>1)await page.locator('.reveal-skip').click();
      await page.waitForTimeout(900);
      assert.equal(await page.locator('.summon-card.is-open').count(),count);
      assert.equal(await page.evaluate(()=>GEMWOVEN_GAME.engine.exportSave()),committed,'Revealing never rolls or spends again');
      await page.locator('#summon-reveal').screenshot({path:path.join(__dirname,`detail-summon-${count}-open.png`)});
      await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
    }
    assert.equal(await page.evaluate(()=>GEMWOVEN_GAME.engine.read().wallet.tickets),0);
    // All chapter backgrounds use the same validated URL/registration path.
    await page.evaluate(()=>{const p=GEMWOVEN_GAME.engine.read();p.campaign.cleared=1499;localStorage.setItem(GemwovenProgression.KEY,JSON.stringify(p));});
    await route('campaign');
    for(let chapter=1;chapter<=30;chapter++){
      await page.waitForFunction(()=>[...document.querySelectorAll('.world-pin img')].every(i=>i.complete&&i.naturalWidth));
      assert.ok(await page.locator('.map-world').evaluate(e=>JSON.parse(e.dataset.profile).sourceAnchors.length===8));
      if(chapter<30)await page.locator('[data-node="campaign.next"]').click();
    }
    // Use a second, clean profile for a real first campaign battle.
    const combatContext=await browser.newContext({viewport:{width:430,height:932}});
    const combat=await combatContext.newPage();combat.on('pageerror',e=>errors.push(e.message));
    await combat.goto(url+'/Gemwoven.html#campaign');
    const token=await combat.evaluate(()=>GEMWOVEN_GAME.engine.begin('campaign',1).token);
    await combat.goto(url+'/Game.html?qa=1&encounter='+encodeURIComponent(token));
    await combat.locator('#classGrid button').first().click();await combat.locator('#startBtn').click();
    await combat.waitForTimeout(700);
    assert.equal(await combat.locator('#landscape>.parallax-layer').count(),3);
    const grounding=await combat.evaluate(()=>{
      const scene=document.querySelector('#scene').getBoundingClientRect();
      return ['heroActor','enemyActor'].map(id=>{
        const e=document.getElementById(id),r=e.getBoundingClientRect(),f=Number(getComputedStyle(e).getPropertyValue('--foot-y'));
        return Math.abs(r.top+r.height*f-(scene.top+scene.height*.82));
      });
    });
    grounding.forEach(error=>assert.ok(error<1.5,'Opaque sprite feet sit on the authored floor'));
    await combat.locator('.app').screenshot({path:path.join(__dirname,'detail-combat.png')});
    await combat.evaluate(()=>{window.departureCheck=gameQA.departVictoriousHero();});
    await combat.waitForTimeout(900);
    const camera=await combat.locator('#landscape>.parallax-layer').evaluateAll(l=>l.map(e=>new DOMMatrix(getComputedStyle(e).transform).m41));
    assert.ok(Math.abs(camera[0])<Math.abs(camera[1])&&Math.abs(camera[1])<Math.abs(camera[2]),'Distant, ground and near layers pan at different speeds');
    await combat.screenshot({path:path.join(__dirname,'detail-combat-parallax.png')});
    await combat.evaluate(()=>window.departureCheck);
    await combatContext.close();
    await page.setViewportSize({width:390,height:844});await route('home');
    await page.locator('#viewport').screenshot({path:path.join(__dirname,'detail-mobile-home.png')});
    await page.emulateMedia({reducedMotion:'reduce'});await route('inventory');
    assert.equal(await page.locator('.hub-ambience').evaluate(e=>getComputedStyle(e).display),'none');
    await page.evaluate(()=>{const p=GEMWOVEN_GAME.engine.read();p.wallet.tickets=10;localStorage.setItem(GemwovenProgression.KEY,JSON.stringify(p));});
    await route('summon');
    await page.locator('[data-action="do:summon"][data-count="10"]').first().click();await page.locator('#confirm-summon').click();
    await page.waitForFunction(()=>document.querySelector('#summon-reveal').dataset.phase==='cards');
    await page.locator('.summon-card').first().focus();await page.keyboard.press('Enter');
    assert.equal(await page.locator('.summon-card.is-open').count(),1,'Keyboard opens a card with reduced motion');
    await page.locator('#summon-reveal').screenshot({path:path.join(__dirname,'detail-mobile-summon.png')});
    await page.locator('.reveal-skip').click();await page.getByRole('button',{name:'Tiếp tục',exact:true}).click();
    assert.deepEqual(errors,[]);
    console.log('Browser passed: 20 screens, 30 chapter maps, engraved labels, material layout, x1/x10 sealed reveals, grounded combat, 3-speed camera, mobile and reduced motion.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
