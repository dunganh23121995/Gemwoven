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
    // Beanstalk map: trunk and leaf pieces are separate images resolved from the page root.
    for(const selector of ['.bean-stem','.bean-branch','.map-platform']){
      const src=await page.locator(selector).first().getAttribute('src');
      assert.ok(src.includes('assets/gemwoven/')&&!src.includes('src/gemwoven/assets/'),selector+' resolves from page root');
      assert.ok(await page.locator(selector).first().evaluate(async e=>{await e.decode();return e.naturalWidth>0;}),selector+' loads');
    }
    assert.equal(await page.locator('.bean-leaf-group .world-pin').count(),7,'Every visible stage stands on a leaf');
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
      // Cards fall, land and open by themselves; a whole hero's spotlight waits for a tap.
      assert.equal(await page.locator('.celestial-card').count(),count);
      const committed=await page.evaluate(()=>GEMWOVEN_GAME.engine.exportSave());
      await page.waitForFunction(()=>{const s=document.querySelector('.summon-hero-stage');if(s)s.click();return document.querySelector('#summon-reveal')?.dataset.phase==='complete';},null,{timeout:60000,polling:500});
      assert.equal(await page.locator('.celestial-card.is-open').count(),count,'Every card opens by itself');
      assert.equal(await page.locator('.celestial-again-btn').count(),2,'Summon again is offered at the end');
      assert.equal(await page.evaluate(()=>GEMWOVEN_GAME.engine.exportSave()),committed,'Revealing never rolls or spends again');
      await page.locator('#summon-reveal').screenshot({path:path.join(__dirname,`detail-summon-${count}-open.png`)});
      await page.locator('.celestial-close').click();await page.waitForFunction(()=>!document.querySelector('#summon-reveal'));
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
    // Reduced motion: no fall; the cards appear opened (a hero still waits for its tap).
    await page.waitForFunction(()=>{const s=document.querySelector('.summon-hero-stage');if(s)s.click();return document.querySelector('#summon-reveal')?.dataset.phase==='complete';},null,{timeout:15000,polling:200});
    assert.equal(await page.locator('.celestial-card.is-open').count(),10,'Reduced motion shows every card opened');
    await page.locator('#summon-reveal').screenshot({path:path.join(__dirname,'detail-mobile-summon.png')});
    await page.locator('.celestial-close').click();await page.waitForFunction(()=>!document.querySelector('#summon-reveal'));
    // Real phone emulation: overflow must never widen the layout viewport, and dialogs fit the screen.
    const phone=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true});
    const mobile=await phone.newPage();mobile.on('pageerror',e=>errors.push(e.message));
    await mobile.goto(url+'/Gemwoven.html');await mobile.waitForTimeout(300);
    const fit=await mobile.evaluate(()=>({inner:innerWidth,client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth,frame:document.getElementById('viewport').getBoundingClientRect().toJSON()}));
    assert.equal(fit.inner,390,'Phone layout viewport is not widened by overflow');assert.ok(fit.scroll<=fit.client,'No horizontal scroll on phones');
    assert.ok(fit.frame.left>=0&&fit.frame.right<=390.5,'Game frame fits the phone width');
    await mobile.evaluate(()=>{location.hash='summon';});await mobile.waitForFunction(()=>document.querySelector('#stage').dataset.screen==='summon');
    await mobile.evaluate(()=>document.querySelector('[data-action="do:rates"]').click());
    const dialogBox=await mobile.locator('#preview-dialog').boundingBox(),closeBox=await mobile.locator('#close-dialog').boundingBox();
    assert.ok(dialogBox.x>=0&&dialogBox.x+dialogBox.width<=390&&dialogBox.y>=0&&dialogBox.y+dialogBox.height<=844,'Dialogs fit the phone screen');
    assert.ok(closeBox.width>=44&&closeBox.height>=44,'Dialog close is finger-sized');
    await phone.close();
    assert.deepEqual(errors,[]);
    console.log('Browser passed: 20 screens, 30 chapter maps, engraved labels, material layout, x1/x10 sealed reveals, grounded combat, 3-speed camera, mobile emulation fit, painted dialogs and reduced motion.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
