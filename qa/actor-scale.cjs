// Sample the rendered actor, not its configured keyframes: a lunge must not zoom.
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[],runs=[];
  try{
    const page=await browser.newPage({viewport:{width:390,height:844}});
    page.on('pageerror',e=>errors.push(e.stack));
    await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
    if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    for(const key of ['fire','earth','ice','lightning'])for(const side of ['hero','enemy']){
      const result=await page.evaluate(async({key,side})=>{
        gameQA.configure({stage:5,key,enemyKey:key,hp:10000,enemyHp:10000,enemyMax:10000,armor:0,enemyArmor:0,energy:0,enemyEnergy:0});
        gameQA.setReduced(false);
        const actors=[...document.querySelectorAll('#heroActor,#enemyActor')];
        for(const actor of actors){
          const actorSide=actor.id==='heroActor'?'hero':'enemy';
          for(const action of ['idle','attack','cast']){
            gameQA.setSpriteFrame(actorSide,action,0);
            const image=new Image();image.src=actor.querySelector('.sprite-body').style.backgroundImage.slice(4,-1).replace(/^['"]|['"]$/g,'');
            await image.decode();
          }
          gameQA.setSpriteAction(actorSide,'idle');
        }
        const base=actors.map(a=>[a.clientWidth,a.clientHeight,a.querySelector('.sprite-body').clientWidth]);
        const samples=[];let recording=true;
        function sample(){
          for(const [i,a]of actors.entries()){
            const m=new DOMMatrix(getComputedStyle(a).transform),sprite=a.querySelector('.sprite-body');
            samples.push({actor:a.id,sx:Math.hypot(m.a,m.b),sy:Math.hypot(m.c,m.d),action:sprite.dataset.action,frame:+sprite.dataset.frame,sameBox:base[i][0]===a.clientWidth&&base[i][1]===a.clientHeight&&base[i][2]===sprite.clientWidth});
          }
          if(recording)requestAnimationFrame(sample);
        }
        sample();
        const hp=gameQA.state[side==='hero'?'enemyHp':'hp'];
        await gameQA.attack(side,10);
        await gameQA.attack(side,10,{ultimate:true});
        await gameQA.buff(side,'armor',10);
        recording=false;await new Promise(requestAnimationFrame);
        return {key,side,samples,damage:hp-gameQA.state[side==='hero'?'enemyHp':'hp'],idle:actors.every(a=>a.querySelector('.sprite-body').dataset.action==='idle'),effects:gameQA.effects};
      },{key,side});
      assert.ok(result.samples.length>20);
      assert.ok(result.samples.every(s=>Math.abs(s.sx-1)<.001&&Math.abs(s.sy-1)<.001&&s.sameBox),JSON.stringify(result.samples.filter(s=>Math.abs(s.sx-1)>=.001||Math.abs(s.sy-1)>=.001||!s.sameBox)));
      assert.ok(result.damage>0&&result.idle);assert.equal(result.effects,0);
      runs.push({key,side,samples:result.samples.length,minScale:Math.min(...result.samples.map(s=>s.sx)),maxScale:Math.max(...result.samples.map(s=>s.sx))});
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:runs.length,checks:'All four heroes and four monsters keep unit scale through normal attacks, ultimates, receiving hits and buffs; atlas box size is stable and damage/cleanup still work',runs,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
