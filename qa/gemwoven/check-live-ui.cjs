const {JSDOM,VirtualConsole}=require('./runtime/node_modules/jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(String(e)));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(fs.readFileSync(path.join(root,'Gemwoven.html'),'utf8'),{url:'http://localhost/Gemwoven.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const motionPreference={matches:true};
const w=dom.window,d=w.document;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};w.matchMedia=()=>motionPreference;w.HTMLElement.prototype.scrollIntoView=function(){};
for(const name of ['assets','screens','expansion','copy','boss-chapters','boss-tactics','world','progression','progression-ui','art-screens','journey-ui','equipment-ui','chapter-guide','ui'])w.eval(fs.readFileSync(path.join(root,`src/gemwoven/${name}.js`),'utf8'));
const sleep=()=>new Promise(r=>setTimeout(r,15));
const click=action=>{const node=d.querySelector(`[data-action="${action}"]`);assert.ok(node,action);assert.equal(node.disabled,false,action);node.click();return node;};
async function go(key){w.location.hash=key;await sleep();assert.equal(d.title,'Gemwoven · '+w.GEMWOVEN_LAYOUT.names[key]);}
function captureMap(scope=d){return {scroll:(scope.querySelector('.exploration-map')||scope).scrollTop,origin:Number(scope.querySelector('.map-world').dataset.origin),height:parseFloat(scope.querySelector('.map-world').style.height),islands:Number(scope.querySelector('.map-world').dataset.islands),profile:JSON.parse(scope.querySelector('.map-world').dataset.profile),clouds:[...scope.querySelectorAll('.frontier-cloud')].map(cloud=>({rect:['left','top','width','height'].map(k=>parseFloat(cloud.style[k])),layers:[...cloud.querySelectorAll('img')].map(im=>({rect:['left','top','width','height'].map(k=>parseFloat(im.style[k])),src:im.getAttribute('src')}))})),background:JSON.parse(scope.querySelector('.map-world').dataset.profile).background,pins:[...scope.querySelectorAll('.world-pin')].map(pin=>({rect:['left','top','width','height'].map(k=>parseFloat(pin.style[k])),labelLeft:pin.classList.contains('label-left'),images:[...pin.querySelectorAll('img')].map(im=>({src:im.getAttribute('src'),platform:im.classList.contains('pin-platform'),hero:im.classList.contains('journey-hero'),lock:im.classList.contains('pin-lock')})),label:pin.querySelector('b').textContent,name:pin.querySelector('.pin-name')?.textContent||'',stars:pin.querySelector('.pin-stars')?.textContent||''}))};}
(async()=>{
  assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gems,0);assert.equal(d.title,'Gemwoven · Trang Chủ');
  let screens=0;
  assert.equal(d.querySelector('[data-node="home.hero"]').dataset.asset,'home-idle-novice-poster','Reduced motion uses the matching idle poster');
  motionPreference.matches=false;await go('inventory');await go('home');
  assert.equal(d.querySelector('[data-node="home.hero"]').dataset.asset,'home-idle-novice','Home displays the selected hero idle animation');
  assert.equal(d.querySelector('[data-node="home.hero"]').dataset.action,'hero:novice','Animated hero still opens the hero page');
  motionPreference.matches=true;await go('inventory');await go('home');
  for(const key of w.GEMWOVEN_LAYOUT.order){await go(key);const ids=[...d.querySelectorAll('[data-node]')].map(n=>n.dataset.node);assert.equal(new Set(ids).size,ids.length,key);assert.equal(d.querySelectorAll('.bottom-nav').length,key==='campaign'?0:7,key);if(key!=='home')assert.equal(d.querySelector(`[data-node="${key}.settings"]`),null,'Settings button belongs only on Home');for(const im of d.querySelectorAll('#scene img'))assert.ok(fs.existsSync(path.join(root,im.getAttribute('src'))),im.src);screens++;}
  const layers={home:['quests','explore','feature-chat','right-offline'],campaign:['title-board','stage-1','stage-2','back'],summon:['central-crystal','featured-board','pity-board','portrait-fire','summon-one','summon-ten'],inventory:['category-all','category-material','detail-panel','detail-art'],skills:['path-title-board','hero-model','detail-panel','node-0','node-3','locked-4'],quests:['quest-panel','quest-art','quest-accept','tavern-tab-0','tavern-tab-3'],tavern:['title-board','left-chalkboard','quest-panel'],upgrade:['hero-model','gear-weapon','gear-pants','gear-glasses','relic','upgrade-material-panel'],forge:['floating-sword','forge-panel','weapon-card'],shop:['product-preview','description-board','purchase-board'],arena:['fighter-fire','rank-one','mode-solo','mode-team']};
  const captures=[];
  for(const [key,items]of Object.entries(layers)){
    await go(key);assert.equal(d.querySelectorAll('#scene .live-panel').length,key==='campaign'?1:0,key+' must retain its illustrated layout');
    for(const id of items)assert.ok(d.querySelector(`[data-node="${key}.${id}"]`),key+'.'+id);
    if(key!=='campaign')assert.ok(d.querySelector(`[data-node="${key}.nav-active-label"]`).textContent.trim(),'Active menu label survives on '+key);
    for(const el of d.querySelectorAll('#scene .node-button'))assert.ok(el.getAttribute('aria-label')?.trim(),'Button name missing: '+el.dataset.node);
    for(const el of d.querySelectorAll('#scene [data-copy]'))assert.ok(el.textContent.trim()||el.dataset.copy==='forge.weapon-stars','Copy missing: '+el.dataset.copy);
    captures.push({key,map:key==='campaign'?captureMap():null,background:w.GEMWOVEN_LAYOUT.screens[key].background,nodes:[...d.querySelectorAll('#scene>.node')].map(el=>({id:el.dataset.node,kind:el.classList.contains('node-text')?'text':el.classList.contains('node-bar')?'bar':'art',rect:['left','top','width','height'].map(k=>parseFloat(el.style[k])),src:el.tagName==='IMG'?el.getAttribute('src'):null,images:[...el.querySelectorAll('img')].map(im=>({src:im.getAttribute('src'),rect:im.classList.contains('art')?[0,0,parseFloat(el.style.width),parseFloat(el.style.height)]:['left','top','width','height'].map(k=>parseFloat(im.style[k])),fit:im.classList.contains('art')?im.style.objectFit:'contain'})),texts:[...(el.dataset.copy?[el]:el.querySelectorAll('[data-copy]'))].map(t=>({value:t.textContent,size:parseFloat(t.style.fontSize)||28,tone:t.classList.contains('tone-ink')?'ink':t.classList.contains('tone-green')?'green':'gold',rect:t===el?[0,0,parseFloat(el.style.width),parseFloat(el.style.height)]:['left','top','width','height'].map((k,i)=>parseFloat(t.style[k])||(i>1?parseFloat(el.style[k]):0))}))}))});
  }
  fs.writeFileSync(path.join(__dirname,'layout.json'),JSON.stringify(captures));
  await go('inventory');click('bag-category:gear');assert.ok(d.querySelector('[data-node="inventory.empty"]'),'Empty gear category keeps a valid screen');assert.equal(d.querySelectorAll('[data-action^="bag-item:"]').length,0);click('bag-category:all');assert.ok(d.querySelector('[data-action="bag-item:coins"]'));click('bag-item:mana');assert.ok(d.querySelector('[data-node="inventory.item-description-mana"]').textContent.includes('nạp tiền'));
  for(const hero of ['fire','ice','earth','lightning','shadow','novice']){await go('skills');d.querySelector(`[data-action="do:hero"][data-hero="${hero}"]`).click();assert.ok(d.querySelector('[data-node="skills.hero-name-'+hero+'"]').textContent.includes(w.GemwovenProgression.HEROES[hero].name));assert.ok(d.querySelector('[data-node="skills.nav-active-label"]').textContent.trim());for(let i=0;i<4;i++){d.querySelector(`[data-action="do:skill-filter"][data-filter="${i}"]`).click();assert.equal(d.querySelectorAll('.skill-live').length,1);assert.ok(d.querySelector(`[data-copy="skills.skill-name-${hero}-${i}"]`).textContent.trim());}d.querySelector('[data-action="do:skill-filter"][data-filter="all"]').click();}
  for(const key of ['home','upgrade','inventory','skills','summon','arena']){click('route:'+key);await sleep();assert.equal(d.querySelector('[data-node="'+key+'.nav-active-label"]').textContent.trim(),w.GEMWOVEN_LAYOUT.names[key]);}
  await go('home');const places=[...d.querySelectorAll('.home-place')].map(n=>n.dataset.action);assert.equal(new Set(places).size,places.length);assert.equal(d.querySelectorAll('[data-node^="home.soul-"]').length,0);
  await go('quests');click('do:daily');await sleep();assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.tickets,1);assert.equal(d.querySelector('[data-action="do:daily"]').disabled,true);d.getElementById('close-dialog').click();
  await go('skills');assert.equal(d.querySelectorAll('.skill-live').length,4);d.querySelector('[data-action="do:skill-filter"][data-filter="1"]').click();assert.equal(d.querySelectorAll('.skill-live').length,1);d.querySelector('[data-action="do:skill-filter"][data-filter="all"]').click();assert.equal(d.querySelectorAll('.skill-live').length,4);
  await go('upgrade');assert.ok(d.querySelector('[data-node="upgrade.hero-model"] .art').src.endsWith('hero-novice.png'));const before=w.GEMWOVEN_GAME.engine.read();click('do:level');await sleep();assert.equal(w.GEMWOVEN_GAME.engine.read().heroes.novice.level,2);assert.ok(w.GEMWOVEN_GAME.engine.read().wallet.gold<before.wallet.gold);
  await go('summon');assert.equal(d.querySelector('[data-copy="summon.one-cost"]'),null);assert.equal(d.querySelector('[data-copy="summon.ten-cost"]'),null);click('do:summon');assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.tickets,1,'Opening popup does not spend');assert.ok(d.getElementById('summon-confirm').textContent.includes('Vé Triệu Hồi'));d.getElementById('confirm-summon').click();await new Promise(r=>setTimeout(r,40));assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.tickets,0);assert.equal(d.querySelectorAll('#summon-reveal .summon-result').length,1);d.querySelector('#summon-reveal button').click();
  click('do:summon');assert.ok(d.getElementById('summon-confirm').textContent.includes('Đá Ngọc'));assert.equal(d.getElementById('confirm-summon').disabled,true);d.querySelector('#summon-confirm .close').click();
  const paid=w.GEMWOVEN_GAME.engine.read();paid.wallet.gems=120;w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(paid));click('do:summon');d.querySelector('#summon-confirm .close').click();assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gems,120,'Cancel preserves premium funds');click('do:summon');assert.equal(d.getElementById('confirm-summon').disabled,false);d.getElementById('confirm-summon').click();await new Promise(r=>setTimeout(r,40));assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gems,0,'Confirmed fallback debits 120 gems');d.querySelector('#summon-reveal button').click();
  assert.equal(d.querySelectorAll('.portrait-gem').length,1);assert.equal(d.querySelectorAll('.featured-equipment').length,3);assert.equal(d.querySelector('[data-node="summon.ticket-balance"]'),null);assert.equal(d.querySelector('[data-node="summon.gem-balance"]'),null);
  await go('home');assert.equal(d.querySelector('[data-node="home.quests"]').dataset.action,'route:quests');assert.equal(d.querySelector('[data-node="home.right-offline"]').dataset.action,'route:offline');assert.equal(d.querySelector('[data-node="home.live"]'),null);assert.ok(d.querySelector('[data-node="home.feature-chat"]'));assert.ok(d.querySelector('[data-node="home.settings"]'));click('route:campaign');await sleep();assert.equal(d.querySelectorAll('.world-pin').length,7);assert.equal(d.querySelectorAll('.world-pin.boss').length,0);assert.equal(d.querySelectorAll('.world-pin.elite').length,0);assert.equal(d.querySelector('[data-node="campaign.settings"]'),null);assert.ok(d.body.classList.contains('exploration-open'));assert.ok(d.querySelector('.frontier-cloud'));assert.equal(d.querySelector('.exploration-fog'),null);assert.equal(d.querySelector('[data-node="campaign.stage-2"]').disabled,false);assert.ok(d.querySelector('[data-node="campaign.stage-2"]').classList.contains('locked'));
  d.querySelector('[data-node="campaign.stage-4"]').click();assert.equal(d.querySelector('[data-action="journey:challenge"]').disabled,true);click('journey:close-stage');
  const sky=d.querySelector('.map-header-cloud'),headerTerrain=d.querySelector('.map-header-terrain');
  assert.ok(sky&&!sky.hidden,'Clouds cover the entire header above the hidden milestone');
  assert.equal(sky.previousElementSibling,headerTerrain,'Clouds paint above terrain');
  const hud=d.querySelector('#scene>.node:not([data-node="campaign.map"])');
  assert.ok(sky.compareDocumentPosition(hud)&w.Node.DOCUMENT_POSITION_FOLLOWING,'HUD paints after the cloud layer');
  assert.equal(sky.getAttribute('aria-hidden'),'true');
  const beforePreview=w.GEMWOVEN_GAME.engine.exportSave();
  d.querySelector('[data-node="campaign.stage-1"]').click();
  assert.ok(d.querySelector('.encounter-sheet'));assert.equal(d.querySelectorAll('.encounter-star-rewards article').length,3);
  assert.ok(d.querySelector('.encounter-heading').textContent.includes(w.GemwovenProgression.encounter('campaign',1).enemyName));
  assert.equal(d.querySelector('[data-action="journey:challenge"]').disabled,false);
  assert.equal(w.GEMWOVEN_GAME.engine.exportSave(),beforePreview,'Inspecting a monster does not start battle or change the save');
  click('journey:close-stage');assert.equal(d.querySelector('.encounter-sheet'),null);
  d.querySelector('[data-node="campaign.stage-2"]').click();assert.equal(d.querySelector('[data-action="journey:challenge"]').disabled,true,'The preview stage is inspectable but cannot be fought');
  assert.ok(d.querySelector('.encounter-sheet .encounter-monster').src.includes('monster-acorn'));click('journey:close-stage');
  const heroChoiceSave=JSON.parse(beforePreview);heroChoiceSave.campaign.cleared=1;heroChoiceSave.campaign.stars[1]=2;
  heroChoiceSave.heroes.fire={...JSON.parse(JSON.stringify(heroChoiceSave.heroes.novice)),level:30};heroChoiceSave.selected='novice';
  w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(heroChoiceSave));await go('home');await go('campaign');
  captures.push({...captures.find(page=>page.key==='campaign'),key:'campaign-hero',map:captureMap()});
  assert.equal(d.querySelector('[data-node="campaign.stage-1"]').dataset.hero,'fire','Strongest owned hero stands on the last completed milestone');
  assert.equal(d.querySelectorAll('.cleared-hero').length,1);assert.ok(d.querySelector('.journey-hero').src.endsWith('hero-fire.png'));
  d.querySelector('[data-node="campaign.stage-2"]').click();
  assert.equal(d.querySelectorAll('[data-action="journey:choose-hero"]').length,2);
  assert.equal(d.querySelector('.encounter-roster .chosen').dataset.hero,'fire');
  d.querySelector('[data-action="journey:choose-hero"][data-hero="novice"]').click();
  assert.equal(d.querySelector('.encounter-roster .chosen').dataset.hero,'novice');
  assert.equal(w.GEMWOVEN_GAME.engine.read().pending,null,'Choosing a hero does not launch combat');
  const navigationErrorCount=errors.length;click('journey:challenge');await sleep();
  assert.equal(w.GEMWOVEN_GAME.engine.read().pending.hero,'novice','The chosen hero, not the strongest map marker, enters combat');
  assert.equal(w.GEMWOVEN_GAME.engine.read().pending.index,2);
  assert.ok(errors.splice(navigationErrorCount).every(error=>/Not implemented.*navigation/i.test(error)),'Only jsdom navigation limitation is expected');
  w.localStorage.setItem(w.GemwovenProgression.KEY,beforePreview);await go('home');await go('campaign');
  const chapterSave=w.GEMWOVEN_GAME.engine.read();chapterSave.campaign.cleared=50;chapterSave.campaign.stars=Object.fromEntries(Array.from({length:50},(_,i)=>[i+1,3]));w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(chapterSave));await go('home');await go('campaign');click('journey:rewards');d.querySelector('[data-action="journey:claim-stars"][data-milestone="50"]').click();assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gold,chapterSave.wallet.gold+2000);assert.equal(d.querySelector('[data-action="journey:claim-stars"][data-milestone="50"]').disabled,true);d.querySelector('[data-action="journey:chapter"][data-delta="1"]').click();assert.ok(d.querySelector('[data-node="campaign.stage-51"]'));
  await go('settings');const music=d.getElementById('home-volume-music');music.value='37';music.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(JSON.parse(w.localStorage.getItem('mam-phep-audio-v1')).music,37);await go('home');await go('settings');assert.equal(d.getElementById('home-volume-music').value,'37');
  await go('chat');let formChat=d.getElementById('town-chat-form');formChat.elements.namedItem('message').value='<img src=x onerror=alert(1)> Xin chào';formChat.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));assert.ok(d.querySelector('.chat-message p').textContent.includes('<img'));assert.equal(d.querySelector('.chat-message p img'),null);await go('home');await go('chat');assert.equal(d.querySelectorAll('.chat-message').length,1);
  await go('shop');assert.equal(d.querySelector('[data-resource="gems"]'),null);assert.equal(d.querySelector('[data-resource="tickets"]'),null);d.querySelector('[data-action="art:shop-product"][data-product="ore"]').click();d.querySelector('[data-action="art:quantity"][data-delta="1"]').click();const beforeBuy=w.GEMWOVEN_GAME.engine.read();click('art:purchase');await sleep();assert.equal(w.GEMWOVEN_GAME.engine.read().materials.ore,beforeBuy.materials.ore+2);assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gold,beforeBuy.wallet.gold-160);d.getElementById('close-dialog').click();
  await go('admin');const form=d.getElementById('event-form');form.elements.namedItem('id').value='harvest';form.elements.namedItem('title').value='<script>alert(1)</script>';form.elements.namedItem('enabled').checked=true;form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await sleep();await go('events');assert.ok(d.querySelector('.event-live').textContent.includes('<script>alert(1)</script>'));assert.equal(d.querySelector('.event-live script'),null);
  await go('home');click('hero:novice');await sleep();assert.equal(d.title,'Gemwoven · '+w.GEMWOVEN_LAYOUT.names.upgrade);assert.equal(d.getElementById('preview-dialog').open,false,'Hero taps navigate instead of opening a profile popup');assert.equal(d.querySelectorAll('[data-action="outfit:slot"]').length,7);assert.ok(d.querySelector('[data-node="upgrade.gear-pants"]'));assert.ok(d.querySelector('[data-node="upgrade.gear-glasses"]'));
  const outfitSave=w.GEMWOVEN_GAME.engine.read();outfitSave.wallet.gold=1000000;outfitSave.materials.essence=1000;outfitSave.materials.ore=1000;outfitSave.equipment.push({id:'qa-helmet',slot:'helmet',rarity:'rare',level:0,affix:null});w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(outfitSave));
  d.querySelector('[data-action="outfit:slot"][data-slot="helmet"]').click();assert.ok(d.querySelector('.outfit-panel'));assert.equal(d.getElementById('preview-dialog').open,false);d.querySelector('[data-action="outfit:item"][data-id="qa-helmet"]').click();click('outfit:equip');assert.equal(w.GEMWOVEN_GAME.engine.read().heroes.novice.gear.helmet,'qa-helmet');click('outfit:strengthen');assert.equal(w.GEMWOVEN_GAME.engine.read().equipment.find(g=>g.id==='qa-helmet').level,1);click('outfit:unequip');assert.equal(w.GEMWOVEN_GAME.engine.read().heroes.novice.gear.helmet,undefined);click('outfit:close');
  d.querySelector('[data-action="outfit:slot"][data-slot="relic"]').click();assert.equal(d.querySelectorAll('.relic-forms>div').length,5);click('outfit:train-relic');assert.equal(w.GEMWOVEN_GAME.engine.read().heroes.novice.relic.level,2);assert.equal(d.querySelector('[data-action="outfit:evolve-relic"]').disabled,true);click('outfit:close');
  const expeditionSave=w.GEMWOVEN_GAME.engine.read();expeditionSave.campaign.cleared=1049;expeditionSave.campaign.artifacts={};w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(expeditionSave));await go('home');await go('campaign');
  for(let i=0;i<30&&!d.querySelector('[data-action="guide:open"]');i++)d.querySelector('[data-action="journey:chapter"][data-delta="1"]').click();
  assert.ok(d.querySelector('[data-action="guide:open"]'));click('guide:open');assert.ok(d.querySelector('.chapter-field-guide'));assert.equal(d.querySelectorAll('.chapter-elite-milestones>button').length,4);assert.equal(d.querySelectorAll('.chapter-skill').length,6);assert.equal(d.getElementById('preview-dialog').open,false);assert.equal(d.querySelector('[data-action="guide:challenge"]').disabled,false,'Artifact is a soft gate');for(const im of d.querySelectorAll('.chapter-field-guide img'))assert.ok(fs.existsSync(path.join(root,im.getAttribute('src'))),im.src);click('guide:close');
  click('guide:open');click('guide:challenge');assert.ok(d.querySelector('.encounter-roster'),'Boss guide also requires choosing a hero before combat');assert.equal(w.GEMWOVEN_GAME.engine.read().pending,null);click('journey:close-stage');
  const counterSave=w.GEMWOVEN_GAME.engine.read();counterSave.campaign.artifacts.eldergrove={claimed:[10]};w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(counterSave));click('guide:open');assert.ok(d.querySelector('.chapter-artifact').textContent.includes('3/12'));click('guide:close');click('route:home');await sleep();click('route:inventory');await sleep();click('bag-category:other');assert.ok(d.querySelector('[data-action="bag-item:artifact-eldergrove"]'),'Earned counter item appears in the bag');
  // Exercise the actual map builder at each reveal boundary, including saved scroll positions.
  const fogSave=w.GEMWOVEN_GAME.engine.read();let visibilityCases=0;
  for(const chapter of [1,21,30])for(const cleared of [0,1,2,3,4,5,6,7,8,9,10,15,16,47,48,49,50]){
    const start=(chapter-1)*50+1,save=JSON.parse(JSON.stringify(fogSave));save.campaign.cleared=start-1+cleared;
    w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(save));
    const state={screen:'campaign',chapter,hero:'novice',mapScroll:{[chapter]:0},mapProgress:{[chapter]:save.campaign.cleared}};
    w.GEMWOVEN_GAME.decorate(state);
    const el=d.createElement('div');w.GEMWOVEN_LAYOUT.screens.campaign.nodes.find(n=>n.id==='campaign.map').build(el);
    const count=Math.min(50,Math.max(7,cleared+1)),pins=[...el.querySelectorAll('.world-pin')];
    assert.deepEqual(pins.map(pin=>Number(pin.dataset.index)),Array.from({length:count},(_,i)=>start+i));
    assert.equal(pins.filter(pin=>!pin.classList.contains('locked')).length,Math.min(50,cleared));
    assert.equal(el.querySelectorAll('.pin-stars').length,cleared,'Unbeaten stages have no earned stars');
    assert.equal(el.querySelectorAll('.world-pin.boss').length,cleared>=49?1:0,'Only the last stage can reveal a boss');
    const cloud=el.querySelector('.frontier-cloud');
    assert.equal(Boolean(cloud),cleared<49,'Fog disappears when the final stage is revealed');
    assert.equal(el.querySelectorAll('.pin-lock').length,count-Math.min(50,cleared),'Every locked preview has a lock badge');
    if(cloud){
      assert.equal(Number(cloud.dataset.firstHidden),start+count);
      assert.equal(parseFloat(cloud.style.width),941,'Cloud bank spans the complete map width');
      assert.equal(parseFloat(cloud.style.height),1492/8,'Fog stays a narrow band over one platform');
      assert.ok(cloud.querySelectorAll('img').length>=4,'Layered illustrated clouds, not a flat fill');
      assert.equal(cloud.textContent,'');assert.equal(cloud.querySelector('button'),null);
    }
    const world=el.querySelector('.map-world'),origin=Number(world.dataset.origin);
    const profile=JSON.parse(world.dataset.profile);
    for(const pin of pins){
      const source=JSON.parse(pin.dataset.sourceAnchor),band=profile.bands.find(b=>source[1]>=b.sourceTop&&source[1]<=b.sourceBottom);
      const floor=band.top+(source[1]-band.sourceTop)*band.artSize[1]/profile.sourceSize[1];
      const localY=(Number(pin.dataset.groundY)+origin)%profile.stride;
      assert.ok(Math.abs(localY-floor+profile.bleed)<.01,'Actor ground point matches the same source-pixel transform as its terrace');
      assert.ok(Math.abs(parseFloat(pin.style.top)+parseFloat(pin.style.height)*.835-Number(pin.dataset.groundY))<.01,'Platform center is grounded, not the sprite box center');
      assert.ok(Math.abs(Number(pin.dataset.groundX)-source[0]*941/profile.sourceSize[0])<.01);
    }
    if(chapter===1&&[8,16].includes(cleared))captures.push({...captures.find(page=>page.key==='campaign'),key:'campaign-'+cleared,map:captureMap(el)});

    const row=1492/8,slots=count+(cloud?1:0);assert.equal(parseFloat(world.style.height),Math.max(8,slots)*row,'Exactly eight rows per viewport; only excess milestones add scrolling');
    assert.ok(Number(el.dataset.scrollTarget)>=0&&Number(el.dataset.scrollTarget)<=parseFloat(world.style.height)-1492,'Old scroll positions stay in discovered terrain');
    if(slots<=8)assert.equal(parseFloat(world.style.height),1492,'Opening eight slots never scroll');
    if(cloud){const profile=JSON.parse(world.dataset.profile),hiddenY=(Number(world.dataset.islands)-1-Math.floor(count/profile.places.length))*profile.stride+profile.places[count%profile.places.length][1]-origin;assert.ok(parseFloat(cloud.style.top)+parseFloat(cloud.style.height)>=hiddenY+40,'Compact cloud still covers the whole first hidden platform');}
    const centers=pins.map(pin=>parseFloat(pin.style.top)+parseFloat(pin.style.height)/2);
    if(cloud)centers.push(parseFloat(cloud.style.top)+row/2);
    assert.equal(centers.filter(y=>y>=0&&y<1492).length,8,'Eight milestones, including the fog slot, fit in the frontier viewport');
    for(let scroll=0;scroll<=parseFloat(world.style.height)-1492;scroll+=row){
      assert.equal(centers.filter(y=>y>=scroll&&y<scroll+1492).length,8,'Eight milestone centers fit throughout the explored map');
    }
    if(cleared>=8)assert.ok(parseFloat(world.style.height)>1492,'Further unlocked stages require scrolling');
    if(cleared<49)assert.equal(el.querySelector(`[data-node="campaign.stage-${start+49}"]`),null,'Distant boss is absent from the DOM');
    if(cleared>=49)assert.equal(el.querySelector('.world-pin.boss').classList.contains('locked'),cleared<50);
    el.scrollTop=-200;el.onscroll();assert.equal(el.scrollTop,0,'Cannot scroll above the cloud boundary');
    el.scrollTop=1e6;el.onscroll();assert.equal(el.scrollTop,parseFloat(world.style.height)-1492,'Cannot scroll beyond the explored map');
    el.scrollTop=120;el.onscroll();assert.equal(state.mapScroll[chapter],origin+Math.min(120,parseFloat(world.style.height)-1492));
    if([8,16,47].includes(cleared)){
      const follow={screen:'campaign',chapter,mapScroll:{[chapter]:0},mapProgress:{[chapter]:save.campaign.cleared-1}};
      w.GEMWOVEN_GAME.decorate(follow);const moved=d.createElement('div');w.GEMWOVEN_LAYOUT.screens.campaign.nodes.find(n=>n.id==='campaign.map').build(moved);
      const hero=moved.querySelector('.cleared-hero'),heroY=parseFloat(hero.style.top)+parseFloat(hero.style.height)/2-Number(moved.dataset.scrollTarget);
      assert.ok(heroY>=row&&heroY<=row*3,`Camera follows the hero within the revealed terrain: chapter ${chapter}, cleared ${cleared}, y ${heroY}`);
      assert.equal(moved.querySelectorAll('.world-pin.locked').length,1,'Only one unbeaten milestone is visible after the opening stretch');
    }
    visibilityCases++;
  }
  fs.writeFileSync(path.join(__dirname,'layout.json'),JSON.stringify(captures));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,screens,visibilityCases,checks:'Persistent wallet, illustrated navigation, tutorial lock previews and full-width cloud frontier, trimmed scroll extent, hidden future bosses, summons, equipment, skills and events'},null,2));w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
