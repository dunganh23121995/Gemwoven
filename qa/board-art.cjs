// Validate the shipped page's effect identity, accessible toggle and mobile art.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
    const errors=[],checks=[],captures=[],motifs=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto(pathToFileURL(path.resolve(__dirname,'../Game.html')).href+'?qa');
    if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    assert.equal(await page.locator('#motionBtn').innerText(),'NO FX');
    assert.equal(await page.locator('#motionBtn').getAttribute('aria-pressed'),'false');
    assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('reduced-motion')),false);
    await page.locator('#motionBtn').click();
    assert.equal(await page.locator('#motionBtn').innerText(),'NO FX');
    assert.equal(await page.locator('#motionBtn').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#motionBtn').getAttribute('aria-label'),'NO FX');
    assert.equal(await page.locator('#combatEffects').evaluate(e=>getComputedStyle(e).display),'none');
    assert.equal(await page.locator('#boardEffects').evaluate(e=>getComputedStyle(e).display),'none');
    await page.locator('#motionBtn').click();
    assert.equal(await page.locator('#motionBtn').getAttribute('aria-pressed'),'false');
    assert.notEqual(await page.locator('#boardEffects').evaluate(e=>getComputedStyle(e).display),'none');
    checks.push('Fast full FX is the startup default even with reduced-motion media; NO FX hides both effect layers and toggles back');
    await page.locator('#boardFrame').scrollIntoViewIfNeeded();
    for(let type=0;type<5;type++){
      await page.evaluate(type=>{
        gameQA.configure({stage:1,key:'earth',enemyKey:'fire',hp:320,armor:10000,enemyHp:100000,enemyMax:100000,frozen:true});
        gameQA.setReduced(false);
        const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
        gameQA.setBoard(types);
        const targets=gameQA.board[3].slice(2,5);
        // Preserve the real image of this item in each petal.
        for(const tile of targets){tile.type=type;tile.el.querySelector('img').src=document.querySelectorAll('#tileLegend img')[type].src;}
        window.artPending=gameQA.resolveBoard('hero',{targets,acts:[],creates:[],playerTiles:new Set(targets)});
      },type);
      await page.waitForFunction(()=>document.querySelector('[data-board-phase="burst"] [data-art-fragment]'));
      const result=await page.evaluate(()=>{
        const burst=document.querySelector('[data-board-phase="burst"]');
        window.artAnimations=document.getAnimations().filter(a=>burst.contains(a.effect?.target)||a.effect?.target?.closest?.('.tile[data-clearing]'));
        for(const a of artAnimations){a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.4;}
        return {fragments:burst.querySelectorAll('[data-art-fragment] image').length,clips:burst.querySelectorAll('clipPath').length,mote:burst.querySelector('[data-mote]')?.getAttribute('data-mote'),shape:burst.querySelector('[data-mote]')?.getAttribute('d'),gradient:!!burst.querySelector('radialGradient'),sources:[...burst.querySelectorAll('image')].every(img=>img.getAttribute('href').startsWith('data:image/')),sparkles:burst.querySelectorAll('[data-sparkle]').length,lace:!!burst.querySelector('[data-board-glitter="halo-lace"]')};
      });
      assert.equal(result.fragments,4);assert.equal(result.clips,4);assert.ok(result.gradient&&result.sources);
      assert.ok(result.sparkles>=6&&result.lace,'All normal items keep local stardust and halo lace without hiding their own art');
      assert.equal(result.mote,['sword','heart','crystal','snow','shield'][type]);
      motifs.push(result.shape);
      if(type===1||type===3){
        const file=path.join(__dirname,`board-${result.mote}-dissolve-mobile.png`);
        await page.locator('#boardFrame').screenshot({path:file,animations:'allow'});captures.push(file);
      }
      await page.evaluate(async()=>{gameQA.setReduced(true);for(const a of artAnimations)a.finish();await artPending;});
      assert.equal(await page.locator('#boardEffects > *').count(),0);
      assert.equal(await page.evaluate(()=>gameQA.effects),0);
    }
    assert.equal(new Set(motifs).size,5);checks.push('All five items retain their own art and distinct particles while dissolving; no effect leaks');
    await page.evaluate(()=>{
      gameQA.configure({stage:1,key:'earth',enemyKey:'fire',hp:320,armor:10000,enemyHp:100000,enemyMax:100000,frozen:true});
      gameQA.setReduced(false);
      const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
      gameQA.setBoard(types,[{r:3,c:3,kind:'bolt'}]);
      const source=gameQA.board[3][3],targets=[source,gameQA.board[1][1],gameQA.board[5][5]];
      window.artPending=gameQA.resolveBoard('hero',{targets,acts:[{tile:source,kind:'bolt',hits:targets}],creates:[],playerTiles:new Set(targets)});
    });
    await page.waitForFunction(()=>document.querySelector('[data-board-phase="beam"][data-arrived]'));
    const ribbon=await page.evaluate(()=>{
      const beam=document.querySelector('[data-board-phase="beam"]');
      window.artAnimations=document.getAnimations().filter(a=>a.effect?.target?.closest?.('#boardEffects'));
      for(const a of artAnimations){a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.15;}
      const electric=beam.querySelector('[data-electric-channel] path:last-child'),electricAnimation=artAnimations.find(a=>a.effect.target===electric);
      let morphs=false;
      if(electricAnimation){const duration=Number(electricAnimation.effect.getTiming().duration);electricAnimation.currentTime=duration*.2;const first=getComputedStyle(electric).d;electricAnimation.currentTime=duration*.7;morphs=first!==getComputedStyle(electric).d;}
      const stars=[...beam.querySelectorAll('[data-wake-star]')];
      const disperses=stars.every(star=>{
        const animation=artAnimations.find(a=>a.effect.target===star);
        if(!animation)return false;
        const {delay,duration}=animation.effect.getTiming();
        animation.currentTime=delay+duration*.2;
        const start=new DOMMatrix(getComputedStyle(star).transform);
        animation.currentTime=delay+duration*.75;
        const end=new DOMMatrix(getComputedStyle(star).transform);
        const moves=Math.hypot(end.e-start.e,end.f-start.f)>8;
        animation.currentTime=delay+duration*.45;
        return moves;
      });
      return {style:beam.dataset.connection,particles:beam.querySelectorAll('[data-stream-particle]').length,bars:beam.querySelectorAll(':scope > path').length,head:!!beam.querySelector('[data-comet-head]'),electric:!!electric,morphs,stars:stars.length,disperses};
    });
    assert.equal(ribbon.style,'electric-particle-stream');assert.ok(ribbon.particles>=14&&ribbon.head&&ribbon.electric&&ribbon.morphs);assert.equal(ribbon.bars,0);
    assert.ok(ribbon.stars>=6&&ribbon.disperses,'Star afterglow visibly spreads away from the ray');
    const file=path.join(__dirname,'board-comet-ribbon-mobile.png');
    await page.locator('#boardFrame').screenshot({path:file,animations:'allow'});captures.push(file);
    await page.evaluate(async()=>{gameQA.setReduced(true);for(const a of artAnimations)a.finish();await artPending;});
    assert.equal(await page.locator('#boardEffects > *').count(),0);
    checks.push('Tier 4 retains continuous electrical motion with brighter particles and drifting star afterglow; all effects clean up');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:checks.length,checks,captures,errors},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
