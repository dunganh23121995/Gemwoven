const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const checks=[],errors=[];
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
    page.on('pageerror',e=>errors.push(e.stack));
    await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    assert.equal(await page.locator('#skillBtn,#enemyIntent,.vitals-row,.section-heading').count(),0);
    for(const width of [320,390,430,1280]){
      await page.setViewportSize({width,height:width===320?800:width===390?844:width===430?900:1100});
      await page.evaluate(()=>gameQA.configure({key:'fire',enemyKey:'earth',stage:5,hp:170,enemyHp:5000,enemyMax:5000,energy:40}));
      await page.locator('#heroHeadHud').waitFor({state:'visible'});await page.locator('#enemyHeadHud').waitFor({state:'visible'});
      const layout=await page.evaluate(()=>({scene:document.querySelector('#scene').clientHeight,bottom:document.querySelector('#tileLegend').getBoundingClientRect().bottom,height:innerHeight,overflow:document.body.scrollWidth>innerWidth,huds:[...document.querySelectorAll('.actor-hud')].map(n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top};})}));
      assert.ok(layout.scene>=280&&layout.bottom<=layout.height);assert.equal(layout.overflow,false);
      assert.ok(layout.huds.every(r=>r.left>=0&&r.right<=width&&r.top>0),JSON.stringify({width,...layout}));
      await page.screenshot({path:`qa/combat-stage-${width}.png`,fullPage:true});
    }
    checks.push('Expanded arena and full board fit four viewports; old panels and manual ultimate button are absent');
    await page.setViewportSize({width:390,height:844});
    const anchors=await page.evaluate(async()=>{
      const frames=()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const samples=[];
      for(const key of ['fire','earth','ice','lightning']){
        gameQA.configure({key,enemyKey:key,stage:5,hp:170,energy:0});
        for(const side of ['hero','enemy'])for(const action of ['idle','attack','cast'])for(const frame of [0,3,5]){
          const actor=document.querySelector('#'+side+'Actor');
          gameQA.setSpriteFrame(side,action,frame);actor.style.transform='translate(19px,-12px) rotate(8deg) scale(1.04)';
          await frames();
          const pin=actor.querySelector('.actor-head-anchor').getBoundingClientRect(),hud=document.querySelector('#'+side+'HeadHud').getBoundingClientRect();
          samples.push({key,side,action,frame,dx:Math.abs(hud.left+hud.width/2-pin.left),dy:Math.abs(hud.bottom-(pin.top-9))});
          actor.style.transform='';
        }
      }
      return samples;
    });
    assert.ok(anchors.every(a=>a.dx<1&&a.dy<1),JSON.stringify(anchors.filter(a=>a.dx>=1||a.dy>=1)));
    checks.push('Name/HP follows 72 authored pose samples across all heroes and monsters, including rotation/translation/boss scale');
    await page.evaluate(()=>{
      const append=Element.prototype.append,remove=Element.prototype.remove;
      window.stageEvents=[];
      Element.prototype.append=function(...nodes){
        for(const node of nodes)if(node instanceof Element){
          if(node.classList.contains('ultimate-aura'))stageEvents.push({kind:'aura',side:node.dataset.auraSide,time:performance.now(),energy:gameQA.state.energy,enemyEnergy:gameQA.state.enemyEnergy});
          if(node.classList.contains('combat-v3-contact'))stageEvents.push({kind:'hit',time:performance.now()});
          if(node.classList.contains('actor-skill-pop'))stageEvents.push({kind:'popup',side:node.dataset.followActor,title:node.textContent,time:performance.now()});
        }
        return append.apply(this,nodes);
      };
      Element.prototype.remove=function(){if(this.classList.contains('ultimate-aura'))stageEvents.push({kind:'aura-end',side:this.dataset.auraSide,time:performance.now()});return remove.call(this);};
      window.stageFixture=async(key,owner='hero',reduced=true)=>{
        gameQA.configure({key,enemyKey:key,stage:5,hp:50,armor:0,energy:owner==='hero'?95:0,enemyHp:100000,enemyMax:100000,enemyArmor:0,enemyEnergy:owner==='enemy'?95:0,frozen:false});
        gameQA.setReduced(reduced);
        const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));types[4][2]=types[4][3]=types[4][4]=2;gameQA.setBoard(types);
        let seed=424;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};stageEvents.length=0;
        await gameQA.resolveBoard(owner);
        return {events:stageEvents.slice(),state:{...gameQA.state},effects:gameQA.effects,nodes:document.querySelectorAll('#combatEffects>*,.ultimate-aura,.combo-layer,.combo-transfer').length};
      };
    });
    await page.evaluate(()=>{window.stageRun=stageFixture('fire','hero',false);});
    await page.locator('.ultimate-aura').waitFor({state:'attached'});
    await page.screenshot({path:'qa/auto-ultimate-aura-mobile.png',fullPage:true});
    const full=await page.evaluate(()=>stageRun);
    const aura=full.events.find(e=>e.kind==='aura'),end=full.events.find(e=>e.kind==='aura-end'),hit=full.events.find(e=>e.kind==='hit');
    assert.equal(aura.side,'hero');assert.ok(aura.energy<100&&end.time-aura.time>=650&&hit.time>end.time);
    assert.ok(full.state.enemyHp<100000);assert.equal(full.nodes,0);assert.equal(full.effects,0);
    assert.ok(full.events.some(e=>e.kind==='popup'&&e.title.includes('Viêm')));
    checks.push('Full rage from matching automatically starts a visible aura and character-local skill name before damage');
    for(const key of ['fire','earth','ice','lightning']){
      const hero=await page.evaluate(key=>stageFixture(key),key);
      assert.ok(hero.events.some(e=>e.kind==='aura'&&e.side==='hero'));
      if(key==='ice'){assert.ok(hero.state.armor>=70&&hero.state.hp>=90);}else assert.ok(hero.state.enemyHp<100000);
      assert.equal(hero.effects,0);assert.equal(hero.nodes,0);
    }
    checks.push('All four heroes automatically cast their elemental ultimate; ice correctly grants its shield and healing');
    const boss=await page.evaluate(()=>stageFixture('earth','enemy'));
    assert.ok(boss.events.some(e=>e.kind==='aura'&&e.side==='enemy'));assert.ok(boss.state.hp<50);assert.ok(boss.state.enemyArmor>=35);
    assert.equal(boss.effects,0);assert.equal(boss.nodes,0);
    checks.push('Boss also casts automatically when its board match fills rage, with aura first and clean completion');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:checks.length,checks,headSamples:anchors.length,auraBeforeHitMs:Math.round(hit.time-aura.time),errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
