const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],checks=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    await page.evaluate(()=>{
      const append=Element.prototype.append;
      window.liveTrace=null;
      Element.prototype.append=function(...nodes){
        for(const node of nodes){
          const tr=liveTrace;if(!tr||!(node instanceof Element))continue;
          if(node.dataset.boardPhase==='burst'){
            const tile=gameQA.board.flat().find(t=>t&&t.id===Number(node.dataset.tileId));
            tr.bursts.push({id:tile.id,type:tile.type,wave:Number(document.querySelector('#comboLabel').textContent.match(/\d+/)?.[0]||1),time:performance.now(),hp:gameQA.state.hp,armor:gameQA.state.armor,enemyHp:gameQA.state.enemyHp,enemyArmor:gameQA.state.enemyArmor,energy:gameQA.state.energy});
          }
          if(node.classList.contains('combat-v3-contact'))tr.hits.push(performance.now());
          if(node.classList.contains('ultimate-aura'))tr.ultimates.push(node.dataset.auraSide);
          if(this.id==='board'&&node.classList.contains('tile')&&!tr.refill)tr.refill={time:performance.now(),state:{...gameQA.state}};
        }
        return append.apply(this,nodes);
      };
      window.runLiveFixture=async({owner='hero',reduced=false,dead=false}={})=>{
        gameQA.configure({key:'fire',stage:1,boss:false,hp:50,armor:owner==='enemy'?500:0,energy:0,score:0,frozen:false,enemyKey:'fire',enemyHp:dead?1:100000,enemyMax:100000,enemyArmor:0,enemyEnergy:0});
        gameQA.setReduced(reduced);
        const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r*2+c)%5));
        gameQA.setBoard(types,[{r:0,c:0,kind:'core'}]);
        const board=gameQA.board,source=board[0][0],targets=board.flat();
        const playerTiles=new Set(owner==='hero'?targets:targets.filter(t=>t.c<4));
        // The lethal fixture gives the hero swords first, then the enemy hearts.
        if(dead){for(let i=1;i<16;i++)targets[i].type=0;for(let i=16;i<64;i++)targets[i].type=1;playerTiles.clear();targets.slice(0,16).forEach(t=>playerTiles.add(t));}
        const initial=targets.map(t=>({id:t.id,type:t.type,hero:playerTiles.has(t)}));
        let seed=3021;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
        liveTrace={bursts:[],hits:[],ultimates:[],refill:null};
        await gameQA.resolveBoard(owner,{targets,acts:[{tile:source,kind:'core',hits:targets}],creates:[],playerTiles});
        const result={...liveTrace,initial,state:{...gameQA.state},types:gameQA.board.map(row=>row.map(t=>t.type)),count:gameQA.board.flat().length,matches:gameQA.matches().tiles.length,effects:gameQA.effects,domEffects:document.querySelectorAll('#boardEffects>*,#combatEffects>*,.combo-layer,.combo-transfer').length};
        liveTrace=null;return result;
      };
    });
    await page.evaluate(()=>{window.liveRun=runLiveFixture();});
    await page.waitForFunction(()=>liveTrace?.hits.length&&document.querySelector('.combat-v3-contact')&&document.querySelector('#boardEffects>*'));
    await page.screenshot({path:'qa/live-combat-mobile.png',fullPage:true});
    const live=await page.evaluate(()=>liveRun);
    assert.ok(live.hits[0]<live.refill.time,'A real combat hit lands while the initial board clear is still running');
    assert.ok(live.bursts.find(b=>b.type===1).hp>50,'Hearts heal at their explosion');
    assert.ok(live.bursts.find(b=>b.type===4).armor>0,'Shields grant armor at their explosion');
    assert.ok(live.bursts.find(b=>b.type===2).energy>0,'Energy arrives before gravity');
    const counts=[0,0,0,0,0];for(const b of live.bursts)if(b.type>=0)counts[b.type]++;
    assert.equal(live.state.hp,Math.min(170,50+counts[1]*6),'Queued buff poses never grant healing twice');
    assert.equal(live.state.armor,Math.min(999,counts[4]*4),'Queued buff poses never grant armor twice');
    let swordChain=0,expectedRaw=0;
    for(const wave of [...new Set(live.bursts.map(b=>b.wave))]){
      const swords=live.bursts.filter(b=>b.wave===wave&&b.type===0).length;
      swordChain=swords?swordChain+1:0;expectedRaw+=swords*8*1.6*(1+Math.min(6,Math.max(0,swordChain-1))*.15)*(swordChain>=3&&swordChain%3===0?1.5:1);
    }
    assert.equal(100000-live.state.enemyHp,Math.round(expectedRaw)+135*live.ultimates.filter(side=>side==='hero').length,'Only consecutive sword waves earn the attack multiplier; rounding and ultimates are accounted separately');
    assert.equal(live.count,64);assert.equal(live.matches,0);assert.equal(live.effects,0);assert.equal(live.domEffects,0);
    checks.push('Full FX: combat hits, healing, armor and energy happen during the clear; no duplicate rewards or effects');
    const fast=await page.evaluate(()=>runLiveFixture({reduced:true}));
    assert.deepEqual(fast.types,live.types,'Audio/timing does not alter gameplay random draws');
    for(const stat of ['hp','armor','energy','score','enemyHp','frozen'])assert.equal(fast.state[stat],live.state[stat],stat+' is independent of animation batching');
    assert.equal(fast.effects,0);assert.equal(fast.domEffects,0);
    checks.push('NO FX preserves the same cascades, total damage, score and resources as full FX');
    const mixed=await page.evaluate(()=>runLiveFixture({owner:'enemy'}));
    const own=new Map(mixed.initial.map(t=>[t.id,t]));let heroHp=50,enemyHp=100000,heroArmor=0,enemyArmor=0;
    for(const event of mixed.bursts.filter(b=>own.has(b.id))){
      const item=own.get(event.id);
      if(item.type===4){if(item.hero)heroArmor+=4;else enemyArmor+=5;}
      if(item.type===1&&item.hero)heroHp=Math.min(170,heroHp+6);
      // Verify attribution at each shield impact; attacks may subsequently consume armor.
      if(item.type===4)assert.ok((item.hero?event.armor:event.enemyArmor)>0);
    }
    assert.ok(mixed.hits[0]<mixed.refill.time);assert.equal(mixed.effects,0);assert.equal(mixed.domEffects,0);
    checks.push('Enemy board turn also fights during propagation; player-owned special rewards reach the hero');
    const lethal=await page.evaluate(()=>runLiveFixture({owner:'enemy',dead:true}));
    const death=lethal.bursts.findIndex(b=>b.enemyHp===0);
    assert.ok(death>=0&&death<lethal.bursts.length-1);
    assert.ok(lethal.bursts.slice(death).every(b=>b.enemyHp===0),'Later enemy hearts cannot resurrect a defeated opponent');
    assert.equal(lethal.state.enemyHp,0);assert.equal(lethal.effects,0);assert.equal(lethal.domEffects,0);
    checks.push('Defeated enemy stays defeated while remaining board effects settle; no queued retaliation');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:checks.length,checks,firstHitBeforeRefillMs:Math.round(live.refill.time-live.hits[0]),errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
