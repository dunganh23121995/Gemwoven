const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],checks=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/Game.html?qa');if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
  for(const width of [320,390,430,1280]){
    await page.setViewportSize({width,height:width===320?800:width===390?844:width===1280?1100:900});
    const layout=await page.evaluate(()=>{
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width};};
      return {combat:rect('#battleCard'),board:rect('#boardFrame'),legend:rect('#tileLegend'),overflow:document.body.scrollWidth>innerWidth,height:innerHeight};
    });
    assert.ok(layout.combat.bottom<layout.board.top,'Combat above board');assert.ok(layout.board.width<=440);assert.equal(layout.overflow,false);assert.ok(layout.legend.bottom<=layout.height,'Full board fits viewport');
    checks.push(`Portrait layout: ${width}px, combat above complete board`);
  }
  await page.setViewportSize({width:390,height:844});
  const items=await page.evaluate(async()=>{
    const types=Array.from({length:8},(_,r)=>Array.from({length:8},(_,c)=>(r+c)%5));
    const specials=[];for(let c=0;c<5;c++){types[0][c]=types[1][c]=types[2][c]=c;specials.push({r:1,c,kind:'bolt'},{r:2,c,kind:'bomb'});}
    gameQA.setBoard(types,specials);
    const imgs=[...document.querySelectorAll('#board .item-art')];await Promise.all(imgs.map(i=>i.decode()));
    const images=imgs.filter((_,i)=>Math.floor(i/8)<3&&i%8<5);
    return {unique:new Set(images.map(i=>i.src)).size,decoded:images.every(i=>i.naturalWidth===192)};
  });assert.equal(items.unique,15);assert.ok(items.decoded);checks.push('Five normal items and ten distinct upgraded images decode correctly');
  await page.screenshot({path:'qa/mobile-item-tiers.png',fullPage:true});
  for(const key of ['fire','earth','ice','lightning']){
    await page.evaluate(key=>gameQA.configure({key,enemyKey:key,enemyHp:10000,enemyMax:10000,hp:80,armor:0}),key);
    const sheets=await page.evaluate(async()=>{
      const result=[];
      for(const side of ['hero','enemy'])for(const action of ['idle','attack',...(side==='hero'?['cast']:[])]){
        gameQA.setSpriteFrame(side,action,0);const el=document.querySelector('#'+side+'Actor .sprite-body');
        const src=el.style.backgroundImage.slice(5,-2),img=new Image();img.src=src;await img.decode();
        result.push({side,action,width:img.naturalWidth,height:img.naturalHeight});
      }
      gameQA.setSpriteAction('hero','idle');gameQA.setSpriteAction('enemy','idle');return result;
    });
    for(const s of sheets){assert.equal(s.width,s.action==='idle'?512:768);assert.equal(s.height,s.action==='idle'&&s.side==='enemy'?256:512);}
    const contact=await page.evaluate(async()=>{
      const sprite=document.querySelector('#heroActor .sprite-body'),samples=[];let recording=true;
      const sample=()=>{samples.push({frame:+sprite.dataset.frame,action:sprite.dataset.action,hp:gameQA.state.enemyHp,time:performance.now()});if(recording)requestAnimationFrame(sample);};sample();
      const start=performance.now(),hp=gameQA.state.enemyHp;await gameQA.attack('hero',40);recording=false;
      return {samples,start,hp,duration:performance.now()-start,fx:document.querySelector('#combatEffects').childElementCount,effects:gameQA.effects,action:sprite.dataset.action};
    });
    const frames=new Set(contact.samples.filter(s=>s.action==='attack').map(s=>s.frame));
    assert.deepEqual([...frames].sort(),[0,1,2,3,4,5],key+' has six visible attack poses');
    const firstHit=contact.samples.find(s=>s.hp<contact.hp);assert.equal(firstHit.frame,3,key+' damage arrives on contact frame');assert.ok(firstHit.time-contact.start>=400);assert.ok(contact.duration>1000);assert.equal(contact.fx,0);assert.equal(contact.effects,0);assert.equal(contact.action,'idle');
    checks.push(`${key}: authored atlases load, six attack poses visible, contact damage synchronized, effects clean`);
    const buff=await page.evaluate(async()=>{const hp=gameQA.state.hp;await gameQA.buff('hero','heal',20);return {gain:gameQA.state.hp-hp,action:document.querySelector('#heroActor .sprite-body').dataset.action,effects:gameQA.effects};});
    assert.equal(buff.gain,20);assert.equal(buff.action,'idle');assert.equal(buff.effects,0);checks.push(`${key}: frame-based healing returns to idle`);
    await page.screenshot({path:`qa/portrait-${key}.png`,fullPage:true});
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:checks.length,checks,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
