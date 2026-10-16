// Runs against the shipped standalone page; it never re-injects game modules.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
const gameURL=process.env.GAME_QA_URL||pathToFileURL(path.resolve(__dirname,'../Game.html')).href+'?qa';

async function installTrace(page){
  await page.evaluate(()=>{
    window.boardTrace={active:false,events:[],firstRefill:null,fastAfterRefill:true};
    const append=Element.prototype.append,remove=Element.prototype.remove,set=Element.prototype.setAttribute,animate=Element.prototype.animate;
    function record(phase,el,extra={}){
      const tr=window.boardTrace;
      if(tr.active&&!tr.firstRefill)tr.events.push({phase,id:Number(el?.getAttribute('data-tile-id')||el?.dataset.id||0),kind:el?.getAttribute('data-fx-kind'),tier:Number(el?.getAttribute('data-special-tier')||0),time:performance.now(),...extra});
    }
    Element.prototype.append=function(...nodes){
      for(const node of nodes){
        if(this.id==='boardEffects'&&node instanceof Element&&node.hasAttribute('data-board-phase'))record(node.getAttribute('data-board-phase'),node);
        if(this.getAttribute('data-board-phase')==='blast-wave'&&node.tagName==='circle'&&!this.__qaWaveLogged){record('wave-radius',this,{radius:Number(node.getAttribute('r'))});this.__qaWaveLogged=true;}
        if(this.getAttribute('data-board-phase')==='beam'&&node.getAttribute?.('data-board-glitter')==='particle-trail')record('connection-particles',this,{connection:this.getAttribute('data-connection')});
        if(this.id==='board'&&node instanceof Element&&node.classList.contains('tile')){
          const tr=window.boardTrace;
          if(tr.active&&!tr.firstRefill){
            tr.firstRefill={time:performance.now(),effects:document.querySelector('#boardEffects').childElementCount};
            // Only the observed first clear plays at full speed. Later random
            // cascades use the app's existing reduced-motion setting.
            if(tr.fastAfterRefill)gameQA.setReduced(true);
          }
        }
      }
      return append.apply(this,nodes);
    };
    Element.prototype.remove=function(){if(this.hasAttribute('data-board-phase'))record(this.getAttribute('data-board-phase')+'-end',this);return remove.call(this);};
    Element.prototype.setAttribute=function(name,value){if(name==='data-arrived')record('arrival',this);return set.call(this,name,value);};
    Element.prototype.animate=function(frames,options){
      if(this.classList.contains('tile'))record('tile-motion',this,{effects:document.querySelector('#boardEffects').childElementCount,duration:options?.duration});
      if(this.classList.contains('gem')&&this.parentElement?.dataset.clearing==='true')record('dissolve',this.parentElement,{duration:options?.duration});
      return animate.call(this,frames,options);
    };
    window.resetBoardTrace=(fastAfterRefill=true)=>{window.boardTrace={active:true,events:[],firstRefill:null,fastAfterRefill,start:performance.now()};};
    window.fixtureTypes=()=>Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
    window.runBoardFixture=async kind=>{
      gameQA.configure({stage:1,boss:false,key:'earth',hp:320,armor:10000,enemyKey:'fire',enemyHp:100000,enemyMax:100000,energy:0,frozen:true});
      gameQA.setReduced(kind==='reduced');
      const types=fixtureTypes();
      const specials=kind==='bomb'?[{r:3,c:3,kind:'bolt'}]:kind==='chain'?[{r:2,c:2,kind:'bolt'},{r:3,c:3,kind:'bomb'},{r:4,c:4,kind:'core'}]:kind==='full'||kind==='reduced'?[{r:3,c:3,kind:'core'}]:[];
      gameQA.setBoard(types,specials);
      const board=gameQA.board;
      let plan,positions;
      if(kind==='creation'){
        plan={targets:board[3].slice(2,5),acts:[],creates:[{tile:board[0][0],kind:'bolt'},{tile:board[0][1],kind:'bomb'},{tile:board[0][2],kind:'core'}]};
      }else if(kind==='normal'){
        const targets=board[3].slice(2,5);plan={targets,acts:[],creates:[]};targets[1].el.focus();
      }else if(kind==='bomb'){
        const source=board[3][3],targets=board.flat().filter(t=>Math.abs(t.r-3)<=2&&Math.abs(t.c-3)<=2);
        positions=Object.fromEntries(targets.map(t=>[t.id,{r:t.r,c:t.c}]));
        plan={targets,acts:[{tile:source,kind:'bolt',hits:targets}],creates:[]};
      }else if(kind==='chain'){
        const bolt=board[2][2],a=board[2][3],bomb=board[3][3],b=board[3][4],core=board[4][4],c=board[6][6],created=board[0][1];
        plan={targets:[bolt,a,bomb,b,core,c],acts:[{tile:bolt,kind:'bolt',hits:[bolt,a,bomb,created]},{tile:bomb,kind:'bomb',hits:[bomb,a,b,core]},{tile:core,kind:'core',hits:[core,b,c]}],creates:[{tile:created,kind:'bolt'}]};
        created.el.focus();
      }else{
        const core=board[3][3],targets=board.flat();plan={targets,acts:[{tile:core,kind:'core',hits:targets}],creates:[]};
      }
      plan.playerTiles=new Set(plan.targets);
      const ids=plan.targets.map(t=>t.id),created=plan.creates[0]?.tile;
      resetBoardTrace();
      await gameQA.resolveBoard('hero',plan);
      const trace=boardTrace;trace.active=false;
      return {kind,ids,positions,events:trace.events,anticipationMs:trace.events.find(e=>e.phase==='burst')?.time-trace.start,firstClearMs:trace.firstRefill?.time-trace.start,refill:trace.firstRefill,elapsed:performance.now()-trace.start,created:created?.special,focused:[document.activeElement.getAttribute('aria-rowindex'),document.activeElement.getAttribute('aria-colindex')],count:gameQA.board.flat().length,fx:document.querySelector('#boardEffects').childElementCount,activeAnimations:gameQA.effects};
    };
  });
}

function assertSettled(result){
  assert.equal(result.count,64,result.kind+': complete board after resolution');
  assert.equal(result.fx,0,result.kind+': board effect nodes cleaned up');
  assert.equal(result.activeAnimations,0,result.kind+': tracked animations cleaned up');
  assert.equal(result.refill.effects,0,result.kind+': all visual tails finish before refill');
  for(const motion of result.events.filter(e=>e.phase==='tile-motion'))assert.equal(motion.effects,0,result.kind+': gravity waits for impact effects');
}

async function captureMobileEffects(browser,{coreVortexOnly=false}={}){
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const errors=[],captures=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(gameURL);if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  await page.locator('#boardFrame').scrollIntoViewIfNeeded();
  for(const kind of coreVortexOnly?['core']:['bolt','bomb','core']){
    await page.evaluate(kind=>{
      gameQA.configure({stage:1,key:'earth',hp:320,armor:10000,enemyKey:'fire',enemyHp:100000,enemyMax:100000,energy:0,frozen:true});
      gameQA.setReduced(false);
      const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
      types[3][2]=types[3][3]=types[3][4]=0;
      gameQA.setBoard(types,[{r:3,c:3,kind}]);
      const source=gameQA.board[3][3];
      const plan=kind==='core'?gameQA.makePlan(null,null,'hero',source,0):gameQA.makePlan(gameQA.matches(),null,'hero');
      window.mobileBoardPending=gameQA.resolveBoard('hero',plan);
    },kind);
    const capture=async(name,selector)=>{
      await page.locator(selector).first().waitFor({state:'attached',timeout:15000});
      const file=path.join(__dirname,name);
      await page.locator('#boardFrame').screenshot({path:file,animations:'allow'});captures.push(file);
    };
    if(kind==='bomb')await capture('board-tier5-lightning-mobile.png','[data-board-phase="beam"][data-fx-kind="bomb"][data-arrived="true"]');
    if(kind==='bolt'){
      const selector='[data-board-phase="blast-wave"][data-fx-kind="bolt"]';
      await page.locator(selector).first().waitFor({state:'attached',timeout:15000});
      await page.evaluate(()=>{
        const wave=document.querySelector('[data-board-phase="blast-wave"]');
        window.mobileWaveAnimations=document.getAnimations().filter(a=>wave?.contains(a.effect?.target));
        for(const a of mobileWaveAnimations){a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.4;}
      });
      await capture('board-tier4-shockwave-mobile.png',selector);
      await page.evaluate(()=>{for(const a of mobileWaveAnimations)if(a.playState==='paused')a.play();});
    }
    if(kind==='core'){
      await page.locator('[data-board-phase="charge"][data-fx-kind="core"]').waitFor({state:'attached'});
      await page.evaluate(()=>{
        const charge=document.querySelector('[data-board-phase="charge"][data-fx-kind="core"]');
        const tile=document.querySelector('.tile[data-id="'+charge.dataset.tileId+'"]');
        window.mobileChargeAnimations=document.getAnimations().filter(a=>charge.contains(a.effect?.target)||tile?.contains(a.effect?.target));
        for(const a of mobileChargeAnimations){const timing=a.effect.getTiming(),duration=Number(timing.duration);if(Number.isFinite(duration)&&duration<=2000&&timing.iterations===1){a.pause();a.currentTime=duration*(timing.easing==='linear'?.5:.2);}}
      });
      await capture('board-tier6-vortex-mobile.png','[data-board-phase="charge"][data-fx-kind="core"]');
      await page.evaluate(()=>{for(const a of mobileChargeAnimations)if(a.playState==='paused')a.play();});
      if(!coreVortexOnly)await capture('board-tier6-ribbon-mobile.png','[data-board-phase="beam"][data-fx-kind="core"][data-arrived="true"]');
    }
    await page.evaluate(async()=>{gameQA.setReduced(true);await mobileBoardPending;});
    assert.equal(await page.locator('#boardEffects > *').count(),0);
  }
  assert.deepEqual(errors,[]);await page.close();return captures;
}

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    if(process.argv.includes('--capture-only')||process.argv.includes('--capture-core-vortex')){
      console.log(JSON.stringify({passed:true,mobileCaptures:await captureMobileEffects(browser,{coreVortexOnly:process.argv.includes('--capture-core-vortex')})},null,2));return;
    }
    const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[],checks=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
    await page.goto(gameURL);if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await installTrace(page);

    const normal=await page.evaluate(()=>runBoardFixture('normal'));
    const impacts=normal.events.filter(e=>e.phase==='burst');
    assert.deepEqual(impacts.map(e=>e.id),normal.ids);
    const gaps=impacts.slice(1).map((event,i)=>event.time-impacts[i].time);
    assert.ok(gaps.every(gap=>gap>=60&&gap<150),'normal impacts keep the new 70ms cadence');
    assert.ok(normal.anticipationMs>=80,'normal matching keeps a brief anticipation');
    assert.ok(normal.events.filter(e=>e.phase==='dissolve').every(e=>e.duration>=120&&e.duration<=135),'gem dissolution takes about 127ms');
    for(const motion of normal.events.filter(e=>e.phase==='tile-motion'))assert.ok(motion.duration>=165&&motion.duration<=235,'gravity follows the new 1.5x playback speed');
    const firstBurstEnd=normal.events.find(e=>e.phase==='burst-end'&&e.id===impacts[0].id);
    assert.ok(firstBurstEnd.time-impacts[0].time>=180,'impact petals and motes finish before refill');
    assertSettled(normal);
    assert.deepEqual(normal.focused,['4','4']);
    checks.push('Normal match clears in order with visible impact spacing and preserves keyboard focus');

    const bomb=await page.evaluate(()=>runBoardFixture('bomb'));
    const rings=bomb.events.filter(e=>e.phase==='wave-radius');
    assert.deepEqual(rings.map(e=>e.radius),[130,230]);
    assert.ok(rings[1].time-rings[0].time>500,'outer bomb ring follows the complete inner ring');
    const bombBursts=bomb.events.filter(e=>e.phase==='burst');
    const radii=bombBursts.map(e=>Math.max(Math.abs(bomb.positions[e.id].r-3),Math.abs(bomb.positions[e.id].c-3)));
    assert.deepEqual(radii,[...radii].sort((a,b)=>a-b));
    assert.equal(bombBursts.length,25);assertSettled(bomb);
    checks.push('Tier 4 clears center, inner ring, and outer ring in sequence');

    const chain=await page.evaluate(()=>runBoardFixture('chain'));
    const charges=chain.events.filter(e=>e.phase==='charge'),ends=chain.events.filter(e=>e.phase==='charge-end');
    assert.deepEqual(charges.map(e=>e.id),[chain.ids[0],chain.ids[2],chain.ids[4]]);
    assert.ok(charges.every((event,i)=>ends[i].time-event.time>=230),'every special keeps its full charge time');
    for(let i=1;i<charges.length;i++)assert.ok(charges[i].time>=ends[i-1].time,'special charge phases never overlap');
    const bursts=chain.events.filter(e=>e.phase==='burst');
    assert.equal(bursts.length,chain.ids.length);assert.equal(new Set(bursts.map(e=>e.id)).size,chain.ids.length);
    for(const id of [chain.ids[3],chain.ids[5]]){
      const arrival=chain.events.findIndex(e=>e.phase==='arrival'&&e.id===id),burst=chain.events.findIndex(e=>e.phase==='burst'&&e.id===id);
      assert.ok(arrival>=0&&burst>arrival,'beam reaches each target before detonation');
    }
    assert.equal(chain.created,'bolt');assertSettled(chain);
    checks.push('Bolt→bomb→core chain charges sequentially, beams arrive before impact, and overlapping targets clear once');

    const connections=chain.events.filter(e=>e.phase==='connection-particles');
    assert.ok(connections.some(e=>e.kind==='bomb'&&e.connection==='electric-particle-stream'));
    assert.ok(connections.some(e=>e.kind==='core'&&e.connection==='prismatic-particle-stream'));
    assert.deepEqual(charges.map(e=>e.tier),[4,5,6]);
    const marks=chain.events.filter(e=>e.phase==='target-mark');
    assert.ok(marks.some(e=>e.kind==='bomb')&&marks.some(e=>e.kind==='core'));
    const creation=await page.evaluate(()=>runBoardFixture('creation'));
    assert.deepEqual(creation.events.filter(e=>e.phase==='creation').map(e=>[e.kind,e.tier]),[['bolt',4],['bomb',5],['core',6]]);
    assertSettled(creation);
    checks.push('Tier4 shockwaves, tier5 electric particles, tier6 prismatic particles, and all three creation effects are distinct');

    const full=await page.evaluate(()=>runBoardFixture('full'));
    const fullBursts=full.events.filter(e=>e.phase==='burst');
    assert.equal(fullBursts.length,64);
    const fullGaps=fullBursts.slice(1).map((event,i)=>event.time-fullBursts[i].time);
    assert.ok(fullGaps.every(gap=>gap>=45),'large clears never accelerate below a readable impact interval');
    assert.ok(full.firstClearMs>=4500&&full.firstClearMs<11500,'special propagation retains its established cadence with readable combo announcements');assertSettled(full);
    const reduced=await page.evaluate(()=>runBoardFixture('reduced'));
    assert.ok(reduced.firstClearMs<500,'reduced motion skips the sequential delays');
    assert.equal(reduced.events.filter(e=>e.phase==='burst'||e.phase==='beam'||e.phase==='charge').length,0);assertSettled(reduced);
    checks.push('Full-board clear stays readable and reduced motion retains the complete clear');

    const swap=await page.evaluate(()=>{
      gameQA.configure({stage:1,boss:false,key:'earth',hp:320,armor:10000,enemyKey:'fire',enemyHp:100000,enemyMax:100000,energy:100,frozen:true});
      gameQA.setReduced(false);const types=fixtureTypes();
      types[3][1]=4;types[3][2]=2;types[3][3]=1;types[3][4]=2;types[3][5]=0;types[4][3]=2;
      gameQA.setBoard(types);resetBoardTrace(false);
      const a=gameQA.board[3][3],b=gameQA.board[4][3];window.pendingBoardSwap=gameQA.trySwap(a,b);
      return {locked:gameQA.locked,busy:document.querySelector('#board').getAttribute('aria-busy'),swapDurations:boardTrace.events.filter(e=>e.phase==='tile-motion').map(e=>e.duration)};
    });
    assert.equal(swap.locked,true);assert.equal(swap.busy,'true');
    assert.ok(swap.swapDurations.length===2&&swap.swapDurations.every(duration=>duration>=100&&duration<=115),'swaps take about108ms');
    await page.waitForFunction(()=>boardTrace.events.some(e=>e.phase==='burst'));
    const input=await page.evaluate(async()=>{
      const a=gameQA.board[1][1],b=gameQA.board[1][2],ids=[a.id,b.id],energy=gameQA.state.energy;
      a.el.click();b.el.click();await gameQA.trySwap(a,b);await gameQA.activateSkill();
      return {ids,after:[gameQA.board[1][1].id,gameQA.board[1][2].id],energy,afterEnergy:gameQA.state.energy,selected:document.querySelectorAll('.tile.selected').length,locked:gameQA.locked,skillDisabled:!document.querySelector('#skillBtn')};
    });
    assert.deepEqual(input.ids,input.after);assert.equal(input.energy,input.afterEnergy);assert.equal(input.selected,0);assert.equal(input.locked,true);assert.equal(input.skillDisabled,true);
    await page.evaluate(async()=>{gameQA.setReduced(true);await pendingBoardSwap;boardTrace.active=false;});
    const unlocked=await page.evaluate(()=>({locked:gameQA.locked,busy:document.querySelector('#board').getAttribute('aria-busy'),count:gameQA.board.flat().length,matches:gameQA.matches().tiles.length,effects:gameQA.effects,fx:document.querySelector('#boardEffects').childElementCount}));
    assert.deepEqual(unlocked,{locked:false,busy:'false',count:64,matches:0,effects:0,fx:0});
    checks.push('A real swap locks tile clicks, additional swaps, and the ultimate until the complete action settles');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,url:gameURL,checks,normalImpactGapsMs:gaps.map(Math.round),normalAnticipationMs:Math.round(normal.anticipationMs),normalFirstClearMs:Math.round(normal.firstClearMs),bombFirstClearMs:Math.round(bomb.firstClearMs),chainFirstClearMs:Math.round(chain.firstClearMs),fullBoardFirstClearMs:Math.round(full.firstClearMs),minimumLargeImpactGapMs:Math.round(Math.min(...fullGaps)),specialChargeMs:charges.map((event,i)=>Math.round(ends[i].time-event.time)),reducedFirstClearMs:Math.round(reduced.firstClearMs),errors},null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
