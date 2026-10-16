const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require(path.join(require('node:os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));

(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const checks=[],measurements=[],errors=[];
  try{
    const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
    page.on('pageerror',error=>errors.push(error.message));
    await page.addInitScript(()=>{
      const audit=window.__combatAudit={active:null,events:[],audio:[],samples:[],contexts:[]};
      const targetHp=()=>audit.active&&window.gameQA?gameQA.state[audit.active.side==='hero'?'enemyHp':'hp']:null;
      const animate=Element.prototype.animate;
      Element.prototype.animate=function(frames,options){
        if(audit.active&&(this.id==='scene'||String(this.className).includes('combat-v3-'))){
          audit.events.push({kind:'animation',id:this.id,className:String(this.className),at:performance.now(),frames,options:typeof options==='number'?{duration:options}:options});
        }
        return animate.call(this,frames,options);
      };
      const append=Element.prototype.append;
      Element.prototype.append=function(...nodes){
        if(audit.active)for(const node of nodes)if(node instanceof Element&&node.classList.contains('combat-v3-contact')){
          const sprite=document.querySelector('#'+audit.active.side+'Actor .sprite-body');
          audit.events.push({kind:'contact',at:performance.now(),hp:targetHp(),frame:Number(sprite.dataset.frame),action:sprite.dataset.action});
        }
        return append.apply(this,nodes);
      };
      const contextClass=window.AudioContext||window.webkitAudioContext;
      if(contextClass)for(const [method,kind] of [['createOscillator','tone'],['createBufferSource','noise']]){
        const create=contextClass.prototype[method];
        contextClass.prototype[method]=function(...args){
          if(!audit.contexts.includes(this))audit.contexts.push(this);
          const context=this,node=create.apply(this,args),start=node.start;
          node.start=function(when,...rest){
            const at=performance.now(),contextTime=context.currentTime;
            if(audit.active)audit.audio.push({kind,at,when,scheduledAt:at+((when??contextTime)-contextTime)*1000,duration:node.buffer?.duration,frequency:node.frequency?.value,type:node.type,hp:targetHp()});
            return start.call(this,when,...rest);
          };
          return node;
        };
      }
    });
    await page.goto(pathToFileURL(path.resolve('Game.html')).href+'?qa');
    if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();
    assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'true');
    checks.push('Sound is enabled by the Start gesture and available to combat');

    async function runAttack({side,key,other='fire',ultimate=false,hits=1,screenshot,muted=false,reduced=false}){
      await page.evaluate(async options=>{
        const {side,key,other,ultimate,hits,reduced}=options;
        gameQA.configure({stage:5,key:side==='hero'?key:other,enemyKey:side==='enemy'?key:other,hp:170,armor:0,enemyHp:10000,enemyMax:10000,enemyArmor:0});
        gameQA.setReduced(reduced);
        // Decode the authored atlases before measuring playback. Otherwise the
        // first attack includes a cold image-decode stall unrelated to pacing.
        const sheets=[];
        for(const actor of ['hero','enemy']){
          for(const action of ['idle','attack','cast']){
            gameQA.setSpriteFrame(actor,action,0);
            const sprite=document.querySelector('#'+actor+'Actor .sprite-body'),image=new Image();
            image.src=sprite.style.backgroundImage.slice(4,-1).replace(/^['"]|['"]$/g,'');
            sheets.push(image.decode().catch(()=>{}));
          }
          gameQA.setSpriteAction(actor,'idle');
        }
        await Promise.all(sheets);
        await new Promise(requestAnimationFrame);
        const audit=window.__combatAudit;
        audit.events=[];audit.audio=[];audit.samples=[];
        audit.active={side,key,ultimate,hits,start:performance.now(),hp:gameQA.state[side==='hero'?'enemyHp':'hp']};
        let recording=true;
        const sample=()=>{
          const sprite=document.querySelector('#'+side+'Actor .sprite-body');
          audit.samples.push({at:performance.now(),frame:Number(sprite.dataset.frame),action:sprite.dataset.action,hp:gameQA.state[side==='hero'?'enemyHp':'hp'],scene:getComputedStyle(document.querySelector('#scene')).transform});
          if(recording)requestAnimationFrame(sample);
        };
        sample();
        window.__combatAuditRun=gameQA.attack(side,40,{ultimate,hits}).then(result=>{
          recording=false;
          const data={...audit.active,result,duration:performance.now()-audit.active.start,events:audit.events,audio:audit.audio,samples:audit.samples,
            scene:getComputedStyle(document.querySelector('#scene')).transform,
            heroAction:document.querySelector('#heroActor .sprite-body').dataset.action,
            enemyAction:document.querySelector('#enemyActor .sprite-body').dataset.action,
            effects:gameQA.effects,nodes:document.querySelector('#combatEffects').childElementCount,
            contextStates:audit.contexts.map(context=>context.state)};
          audit.active=null;return data;
        });
      },{side,key,other,ultimate,hits,reduced});
      if(screenshot&&!process.argv.includes('--no-capture')){
        await page.waitForFunction(()=>{
          const event=__combatAudit.events.find(event=>event.kind==='contact');
          if(!event||performance.now()-event.at<75)return false;
          const transform=getComputedStyle(document.querySelector('#scene')).transform;
          if(transform==='none')return false;
          const matrix=new DOMMatrix(transform);
          return Math.abs(matrix.m41)>.2||Math.abs(matrix.m42)>.2;
        },{timeout:10000});
        await page.screenshot({path:screenshot,fullPage:true});
      }
      const run=await page.evaluate(()=>window.__combatAuditRun);
      const contacts=run.events.filter(event=>event.kind==='contact');
      assert.equal(contacts.length,hits,'One actual contact event per hit');
      for(const hit of contacts){
        assert.equal(hit.frame,3,'Damage/impact is on authored contact pose 3');
        assert.ok(hit.hp<run.hp,'Target HP changed before the visible impact');
        if(!reduced){
          const strike=run.events.filter(event=>event.kind==='animation'&&event.at<hit.at&&/combat-v3-(slash|lightning|ice-lance|breath)( |$)/.test(event.className)).at(-1);
          const arrival=strike.frames[strike.className.includes('ice-lance')?2:1].offset;
          assert.equal(strike.options.easing,'linear');
          const expected=strike.at+strike.options.duration*arrival;
          assert.ok(Math.abs(hit.at-expected)<110,`${side}/${key}: contact drift ${hit.at-expected}ms`);
          assert.ok(run.samples.some(sample=>sample.at>=hit.at&&sample.at<hit.at+500&&sample.scene!=='none'&&Math.abs(newMatrixX(sample.scene))>.15),'Whole arena has a visible translation after contact');
        }
      }
      if(!reduced){
        const poses=[...new Set(run.samples.filter(sample=>sample.action==='attack'||sample.action==='cast').map(sample=>sample.frame))].sort();
        assert.deepEqual(poses,[0,1,2,3,4,5],'All six poses are actually rendered');
        assert.equal(run.events.filter(event=>event.kind==='animation'&&event.id==='scene').length,hits,'Both attack directions shake the whole scene');
        const damageSample=run.samples.find(sample=>sample.hp<run.hp);
        assert.equal(damageSample.frame,3,'First rendered HP change is at contact pose');
        if(!ultimate)assert.ok(run.duration>=650&&run.duration<1250,`Normal action plays at 1.5x the previous speed (${run.duration.toFixed(0)} ms)`);
        else if((key==='fire'&&hits===3)||(key==='lightning'&&hits===5))assert.ok(run.duration>=1450&&run.duration<2900,'Multi-hit ultimate retains contacts at 1.5x the previous speed');
      }else{
        assert.equal(run.events.filter(event=>event.kind==='animation'&&event.id==='scene').length,0);
        assert.ok(run.duration<275,'Reduced-motion combat remains quick');
      }
      if(muted)assert.equal(run.audio.length,0,'Muted combat creates no audio sources');
      else{
        assert.ok(run.contextStates.includes('running'),'AudioContext is unlocked by the gesture');
        assert.ok(run.audio.some(event=>event.kind==='tone'&&event.hp===run.hp),'Charge sound starts before damage');
        const first=contacts[0];
        const contactDelay=({fire:side==='enemy'?180:115,earth:160,ice:320,lightning:115})[key];
        for(const [index,contact] of contacts.entries()){
          const beforeHp=index?contacts[index-1].hp:run.hp;
          const whoosh=run.audio.filter(event=>event.kind==='noise'&&event.hp===beforeHp&&event.at<contact.at&&event.at>contact.at-1200).at(-1);
          assert.ok(whoosh,'Whoosh begins before each contact');
          if(!reduced){
            assert.ok(Math.abs(whoosh.duration*1000-Math.round(contactDelay*.45))<1,'Whoosh duration scales with the entire weapon travel');
            assert.ok(Math.abs(whoosh.scheduledAt+whoosh.duration*1000-contact.at)<130,'Whoosh finishes when the weapon makes contact');
          }
          const impact=run.audio.filter(event=>event.kind==='noise'&&event.hp===contact.hp&&Math.abs(event.at-contact.at)<55);
          assert.ok(impact.length>0&&impact.every(event=>event.duration<=.31),'Impact sounds retain short natural transients');
        }
        assert.ok(run.audio.some(event=>event.kind==='tone'&&event.hp===first.hp&&Math.abs(event.at-first.at)<55),'Elemental impact tone starts at damage');
        assert.ok(run.audio.some(event=>event.kind==='noise'&&event.hp===first.hp&&Math.abs(event.at-first.at)<55),'Layered impact noise starts at damage');
      }
      assert.equal(run.scene,'none');assert.equal(run.heroAction,'idle');assert.equal(run.enemyAction,'idle');assert.equal(run.effects,0);assert.equal(run.nodes,0);
      measurements.push({side,key,ultimate,hits,muted,reduced,durationMs:Math.round(run.duration),contactAtMs:contacts.map(hit=>Math.round(hit.at-run.start)),audioSources:run.audio.length});
      checks.push(`${side} ${key}${ultimate?' ultimate':''}${muted?' muted':''}${reduced?' reduced motion':''}: synchronized contact, feedback, sound and cleanup`);
    }
    function newMatrixX(transform){return transform==='none'?0:Number(transform.match(/^matrix\((.*)\)$/)?.[1].split(',')[4]||0);}

    async function runBuff(side,kind){
      const run=await page.evaluate(async({side,kind})=>{
        gameQA.configure({stage:5,key:'ice',enemyKey:'earth',hp:100,armor:0,enemyHp:100,enemyMax:500,enemyArmor:0});gameQA.setReduced(false);
        const audit=window.__combatAudit,stat=kind==='heal'?(side==='hero'?'hp':'enemyHp'):(side==='hero'?'armor':'enemyArmor');
        audit.events=[];audit.audio=[];audit.samples=[];audit.active={side,start:performance.now()};
        const before=gameQA.state[stat];let recording=true;
        const sample=()=>{
          const sprite=document.querySelector('#'+side+'Actor .sprite-body');
          audit.samples.push({at:performance.now(),frame:Number(sprite.dataset.frame),action:sprite.dataset.action,value:gameQA.state[stat]});
          if(recording)requestAnimationFrame(sample);
        };
        sample();const gained=await gameQA.buff(side,kind,20);recording=false;
        const data={duration:performance.now()-audit.active.start,gained,before,after:gameQA.state[stat],samples:audit.samples,audio:audit.audio,effects:gameQA.effects,nodes:document.querySelector('#combatEffects').childElementCount,action:document.querySelector('#'+side+'Actor .sprite-body').dataset.action};
        audit.active=null;return data;
      },{side,kind});
      assert.equal(run.gained,20);assert.equal(run.after-run.before,20);
      assert.ok(run.duration>=650&&run.duration<1100,'Buff follows the new 1.5x playback speed');
      assert.deepEqual([...new Set(run.samples.filter(sample=>sample.action==='buff').map(sample=>sample.frame))].sort(),[0,1,2,3,4,5],'Buff renders all six cast poses');
      assert.equal(run.samples.find(sample=>sample.value>run.before).frame,3,'Buff stat changes at the authored release frame');
      assert.ok(run.audio.filter(event=>event.kind==='tone').length>=3,'Buff plays layered charge and release sounds');
      assert.equal(run.action,'idle');assert.equal(run.effects,0);assert.equal(run.nodes,0);
      measurements.push({side,kind,durationMs:Math.round(run.duration),audioSources:run.audio.length});
      checks.push(`${side} ${kind} buff: synchronized release, sound and cleanup`);
    }

    await runAttack({side:'hero',key:'fire',other:'earth',screenshot:'qa/mobile-hero-boss-impact-v4.png'});
    await runAttack({side:'enemy',key:'earth',other:'fire',screenshot:'qa/mobile-boss-hero-impact-v4.png'});
    for(const [side,key,other] of [['hero','earth','fire'],['enemy','fire','ice'],['hero','ice','lightning'],['enemy','ice','earth'],['hero','lightning','ice'],['enemy','lightning','fire']])await runAttack({side,key,other});
    await runAttack({side:'hero',key:'fire',other:'earth',ultimate:true,hits:3});
    await runAttack({side:'enemy',key:'lightning',other:'earth',ultimate:true,hits:5});
    await runBuff('hero','heal');await runBuff('enemy','armor');
    await page.locator('#soundBtn').click();assert.equal(await page.locator('#soundBtn').getAttribute('aria-pressed'),'false');
    await runAttack({side:'enemy',key:'fire',other:'earth',muted:true});
    await runAttack({side:'hero',key:'ice',other:'earth',muted:true,reduced:true});
    assert.deepEqual(errors,[]);
    const report={passed:checks.length,checks,measurements,errors};
    fs.writeFileSync('qa/combat-feedback-results.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
