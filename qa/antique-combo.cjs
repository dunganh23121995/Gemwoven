const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2}),errors=[],checks=[],layouts=[];
    page.on('pageerror',e=>errors.push(e.stack));
    await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
    await page.screenshot({path:'qa/antique-selection-mobile.png',fullPage:true});
    if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    for(const width of [320,390,430,1280]){
      const height=width===320?800:width===390?844:width===430?900:1100;
      await page.setViewportSize({width,height});
      const layout=await page.evaluate(()=>{
        const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width};};
        return {width:innerWidth,height:innerHeight,combat:rect('#battleCard'),board:rect('#boardFrame'),legend:rect('#tileLegend'),overflow:document.body.scrollWidth>innerWidth,corners:document.querySelectorAll('.battle-card>.antique-trim svg,.puzzle-card>.antique-trim svg').length};
      });layouts.push(layout);
      assert.equal(layout.overflow,false);assert.ok(layout.combat.bottom<layout.board.top);assert.equal(layout.corners,8);
      await page.screenshot({path:`qa/antique-layout-${width}.png`,fullPage:true});
      assert.ok(layout.legend.bottom<=height,`Entire board fits ${width}px phone frame: ${layout.legend.bottom} > ${height}`);
      checks.push(`Carved frames and full portrait board fit ${width}px without overflow`);
    }
    await page.setViewportSize({width:390,height:844});
    await page.evaluate(()=>{
      const nativeAnimate=Element.prototype.animate,nativeAppend=Element.prototype.append;
      window.comboVisual={freeze:true,events:[]};
      Element.prototype.animate=function(frames,options){
        const animation=nativeAnimate.call(this,frames,options);
        if(comboVisual.freeze&&this.closest('.combo-layer')&&Number(document.querySelector('#boardFrame').dataset.comboChain)>=2){
          animation.pause();animation.currentTime=Number(options.duration)*(this.classList.contains('combo-cue')?.78:.5);
          if(this.classList.contains('combo-cue'))window.comboBadgeAnimation=animation;
        }
        return animation;
      };
      Element.prototype.append=function(...nodes){
        for(const node of nodes)if(node instanceof Element){
          if(node.dataset.comboWave)comboVisual.events.push({kind:'wave',wave:+node.dataset.comboWave,gain:Number(document.querySelector('#boardFrame').style.getPropertyValue('--combo-gain')),glow:parseFloat(document.querySelector('#boardFrame').style.getPropertyValue('--combo-glow-size'))});
          if(node.dataset.comboTotal)comboVisual.events.push({kind:'finale',wave:+node.dataset.comboTotal});
          if(node.classList.contains('combo-transfer'))comboVisual.events.push({kind:'transfer'});
        }
        return nativeAppend.apply(this,nodes);
      };
      gameQA.configure({key:'earth',enemyKey:'earth',hp:150,armor:0,enemyHp:10000,enemyMax:10000});gameQA.setReduced(false);
      const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
      types[4][3]=types[5][3]=types[6][3]=1;types[3][3]=types[6][2]=types[6][4]=0;gameQA.setBoard(types);
      let seed=1029;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      window.antiqueComboRun=gameQA.resolveBoard('hero');
    });
    await page.waitForFunction(()=>document.querySelector('[data-combo-flourish="2"] [data-combo-pickup]'));
    const flourish=await page.evaluate(()=>{
      const cue=document.querySelector('.combo-cue'),board=document.querySelector('#board').getBoundingClientRect(),duration=Number(comboBadgeAnimation.effect.getTiming().duration);
      comboBadgeAnimation.currentTime=duration*.14;const launch=cue.getBoundingClientRect();
      comboBadgeAnimation.currentTime=duration*.78;const dock=cue.getBoundingClientRect();
      return {pickups:document.querySelectorAll('[data-combo-pickup]').length,crossRays:document.querySelectorAll('.combo-rays,[data-combo-flourish]>path').length,visible:dock.width>0,text:cue.textContent.trim(),extras:cue.querySelectorAll('small,span').length,duration,launchCenter:launch.top+launch.height/2,boardCenter:board.top+board.height/2,dockTop:dock.top,boardTop:board.top,dockCenter:dock.left+dock.width/2,boardX:board.left+board.width/2,glow:getComputedStyle(cue.querySelector('strong')).textShadow};
    });
    assert.ok(flourish.pickups>=1&&flourish.visible);
    assert.match(flourish.text,/^COMBO\s*×2$/);assert.equal(flourish.extras,0);
    assert.ok(flourish.duration>=600&&flourish.duration<=650&&Math.abs(flourish.launchCenter-flourish.boardCenter)<35,'The combo launches promptly from the board center');
    assert.ok(flourish.dockTop<flourish.boardTop+25&&Math.abs(flourish.dockCenter-flourish.boardX)<2,'Combo docks at the top center');
    assert.notEqual(flourish.glow,'none');assert.equal(flourish.crossRays,0,'Unexplained cross-board combo rays are removed');
    await page.screenshot({path:'qa/antique-combo-mobile.png',fullPage:true});
    checks.push('COMBO x1/x2 launches from center into the glowing top-center badge; gem pickups replace cross-rays');
    await page.evaluate(async()=>{comboVisual.freeze=false;for(const a of document.getAnimations())if(a.playState==='paused')a.finish();await antiqueComboRun;});
    const settled=await page.evaluate(()=>({events:comboVisual.events,fx:document.querySelectorAll('.combo-celestial,.combo-layer,.combo-transfer,.combo-hero-aura,#boardEffects>*').length,active:gameQA.effects,tiles:gameQA.board.flat().length}));
    assert.equal(settled.fx,0);assert.equal(settled.active,0);assert.equal(settled.tiles,64);assert.ok(!settled.events.some(e=>e.kind==='finale')&&settled.events.some(e=>e.kind==='transfer'));
    const waves=settled.events.filter(e=>e.kind==='wave');assert.ok(waves[1].gain>waves[0].gain&&waves[1].glow>waves[0].glow,'Higher combos have brighter text and a larger glow');
    checks.push('Constellation finale and energy transfer complete with no lingering effects');
    await page.locator('#motionBtn').click();
    assert.equal(await page.locator('#motionBtn').getAttribute('aria-pressed'),'true');
    assert.equal(await page.locator('#boardEffects').evaluate(e=>getComputedStyle(e).display),'none');
    await page.locator('#helpBtn').click();await page.screenshot({path:'qa/antique-help-mobile.png',fullPage:true});
    assert.equal(await page.locator('#helpDialog').evaluate(e=>e.scrollWidth>e.clientWidth),false);
    checks.push('NO FX toggle and engraved help dialog remain usable on mobile');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:checks.length,checks,layouts,combo:flourish,events:settled.events,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
