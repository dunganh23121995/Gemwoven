const {JSDOM,VirtualConsole}=require('./runtime/node_modules/jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),errors=[];
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(String(e)));vc.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(fs.readFileSync(path.join(root,'Gemwoven.html'),'utf8'),{url:'https://gemwoven.example/Gemwoven.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});
const motionPreference={matches:true,addEventListener(){},removeEventListener(){}};
const w=dom.window,d=w.document;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};w.matchMedia=()=>motionPreference;w.HTMLElement.prototype.scrollIntoView=function(){};
w.ResizeObserver=class{observe(){}disconnect(){}};const inert2d=new Proxy({},{get:(o,k)=>k in o?o[k]:()=>({addColorStop(){}})});w.HTMLCanvasElement.prototype.getContext=()=>inert2d;
for(const name of ['assets','screens','expansion','copy','boss-chapters','boss-tactics','world','progression','progression-ui','art-screens','journey-ui','equipment-ui','chapter-guide','form-effects','hero-forms','summon-cinematic','living-hub','ui'])w.eval(fs.readFileSync(path.join(root,`src/gemwoven/${name}.js`),'utf8'));
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
  // Every scene alias must resolve to the approved painting, including secondary screens.
  for(const key of w.GEMWOVEN_LAYOUT.order){
    if(key==='campaign')continue;
    await go(key);
    const screen=w.GEMWOVEN_LAYOUT.screens[key],asset=w.GEMWOVEN_ASSETS['background-'+(screen.backgroundKey||key)];
    assert.ok(asset,key+' has an approved background');
    assert.ok(fs.existsSync(path.join(root,asset.file)),key+' background exists');
    assert.ok(d.getElementById('scene').style.backgroundImage.includes(asset.file),key+' uses approved background');
    for(const source of [asset.source,...asset.promptFiles])assert.ok(fs.existsSync(path.join(root,source)),source);
  }
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
  await go('quests');click('do:daily');await sleep();assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.tickets,1);assert.equal(d.querySelector('[data-action="do:daily"]').disabled,true);
  {const tiles=[...d.querySelectorAll('#preview-dialog .reward-tile')];assert.equal(tiles.length,Object.keys(w.GemwovenProgression.DAILY[0].reward).length,'Quest rewards list every granted item');for(const t of tiles)assert.ok(t.querySelector('.reward-slot img').getAttribute('src'),'Reward tile shows the item art');}
  d.getElementById('close-dialog').click();
  await go('skills');assert.equal(d.querySelectorAll('.skill-live').length,4);d.querySelector('[data-action="do:skill-filter"][data-filter="1"]').click();assert.equal(d.querySelectorAll('.skill-live').length,1);d.querySelector('[data-action="do:skill-filter"][data-filter="all"]').click();assert.equal(d.querySelectorAll('.skill-live').length,4);
  await go('upgrade');assert.ok(/(hero-novice\.png|home-idle-novice-poster\.webp)$/.test(d.querySelector('[data-node="upgrade.hero-model"] .art').src),'Hiro stands on the upgrade screen (his showcase pose once drawn)');const before=w.GEMWOVEN_GAME.engine.read();click('do:level');await sleep();assert.equal(w.GEMWOVEN_GAME.engine.read().heroes.novice.level,2);assert.ok(w.GEMWOVEN_GAME.engine.read().wallet.gold<before.wallet.gold);
  await go('summon');assert.equal(d.querySelector('[data-copy="summon.one-cost"]'),null);assert.equal(d.querySelector('[data-copy="summon.ten-cost"]'),null);click('do:summon');assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.tickets,1,'Opening popup does not spend');assert.ok(d.getElementById('summon-confirm').textContent.includes('Vé Triệu Hồi'));d.getElementById('confirm-summon').click();await new Promise(r=>setTimeout(r,40));assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.tickets,0);assert.equal(d.querySelectorAll('#summon-reveal .celestial-card').length,1);await new Promise(r=>setTimeout(r,5));d.querySelector('#summon-reveal .summon-hero-stage')?.click();await new Promise(r=>setTimeout(r,5));assert.equal(d.querySelectorAll('#summon-reveal .celestial-card.is-open').length,1,'Cards open by themselves');assert.equal(d.getElementById('summon-reveal').dataset.phase,'complete','The reveal finishes on its own');assert.equal(d.querySelector('#summon-reveal .celestial-again').hidden,false,'Summon again is offered at the end');d.getElementById('summon-reveal').close();await sleep();
  click('do:summon');assert.ok(d.getElementById('summon-confirm').textContent.includes('Đá Ngọc'));assert.equal(d.getElementById('confirm-summon').disabled,true);assert.ok(!/sẽ dùng|Lượt này dùng/.test(d.getElementById('summon-confirm').textContent),'An unaffordable summon never promises a spend');assert.ok(d.getElementById('summon-confirm').classList.contains('gw-dialog'),'Confirmations share the painted dialog');d.querySelector('#summon-confirm .close').click();
  const paid=w.GEMWOVEN_GAME.engine.read();paid.wallet.gems=120;w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(paid));click('do:summon');d.querySelector('#summon-confirm .close').click();assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gems,120,'Cancel preserves premium funds');click('do:summon');assert.equal(d.getElementById('confirm-summon').disabled,false);d.getElementById('confirm-summon').click();await new Promise(r=>setTimeout(r,40));assert.equal(w.GEMWOVEN_GAME.engine.read().wallet.gems,0,'Confirmed fallback debits 120 gems');await new Promise(r=>setTimeout(r,5));d.querySelector('#summon-reveal .summon-hero-stage')?.click();await new Promise(r=>setTimeout(r,5));assert.equal(d.querySelectorAll('#summon-reveal .celestial-card.is-open').length,1,'Cards open by themselves');assert.equal(d.getElementById('summon-reveal').dataset.phase,'complete','The reveal finishes on its own');assert.equal(d.querySelector('#summon-reveal .celestial-again').hidden,false,'Summon again is offered at the end');d.getElementById('summon-reveal').close();await sleep();
  click('do:rates');assert.equal(d.querySelectorAll('#preview-dialog .gw-table tbody tr').length,w.GemwovenProgression.SUMMON_TABLE.length,'Rates show one row per reward tier');assert.ok(d.getElementById('preview-dialog').classList.contains('gw-dialog'));d.getElementById('close-dialog').click();
  {const gear=d.querySelector('[data-action="journey:featured-gear"]');assert.notEqual(gear.dataset.asset,'inventory-slot','Featured gear keeps its own art key');gear.click();assert.ok(d.querySelector('#dialog-art img').getAttribute('src').endsWith(w.GEMWOVEN_ASSETS[gear.dataset.asset].file),'Featured gear popup shows the gear');d.getElementById('close-dialog').click();}
  assert.equal(d.querySelectorAll('.portrait-gem').length,1);assert.equal(d.querySelectorAll('.featured-equipment').length,3);assert.ok(d.querySelector('[data-node="summon.ticket-balance"]').textContent.includes('Vé Triệu Hồi'),'Summon shows the ticket balance under the summon button');assert.equal(d.querySelector('[data-node="summon.gem-balance"]'),null);
  await go('home');assert.equal(d.querySelector('[data-node="home.quests"]').dataset.action,'route:quests');assert.equal(d.querySelector('[data-node="home.right-offline"]').dataset.action,'route:offline');assert.equal(d.querySelector('[data-node="home.live"]'),null);assert.ok(d.querySelector('[data-node="home.feature-chat"]'));assert.ok(d.querySelector('[data-node="home.settings"]'));click('route:campaign');await sleep();assert.equal(d.querySelectorAll('.world-pin').length,7);assert.equal(d.querySelectorAll('.world-pin.boss').length,0);assert.equal(d.querySelectorAll('.world-pin.elite').length,1,'Stage 5 is the first elite');assert.equal(d.querySelector('[data-node="campaign.settings"]'),null);assert.ok(d.body.classList.contains('exploration-open'));assert.ok(d.querySelector('.frontier-cloud'));assert.equal(d.querySelector('.exploration-fog'),null);assert.equal(d.querySelector('[data-node="campaign.stage-2"]').disabled,false);assert.ok(d.querySelector('[data-node="campaign.stage-2"]').classList.contains('locked'));
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
  const expeditionSave=w.GEMWOVEN_GAME.engine.read();expeditionSave.campaign.cleared=749;expeditionSave.campaign.artifacts={};w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(expeditionSave));await go('home');await go('campaign');
  for(let i=0;i<30&&!d.querySelector('[data-action="guide:open"]');i++)d.querySelector('[data-action="journey:chapter"][data-delta="1"]').click();
  assert.ok(d.querySelector('[data-action="guide:open"]'));click('guide:open');assert.ok(d.querySelector('.chapter-field-guide'));assert.equal(d.querySelectorAll('.chapter-elite-milestones>button').length,4);assert.equal(d.querySelectorAll('.chapter-skill').length,6);assert.equal(d.getElementById('preview-dialog').open,false);assert.equal(d.querySelector('[data-action="guide:challenge"]').disabled,false,'Artifact is a soft gate');for(const im of d.querySelectorAll('.chapter-field-guide img'))assert.ok(fs.existsSync(path.join(root,im.getAttribute('src'))),im.src);click('guide:close');
  click('guide:open');click('guide:challenge');assert.ok(d.querySelector('.encounter-roster'),'Boss guide also requires choosing a hero before combat');assert.equal(w.GEMWOVEN_GAME.engine.read().pending,null);click('journey:close-stage');
  const counterSave=w.GEMWOVEN_GAME.engine.read();counterSave.campaign.artifacts.eldergrove={claimed:[10]};w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(counterSave));click('guide:open');assert.ok(d.querySelector('.chapter-artifact').textContent.includes('3/12'));click('guide:close');click('route:home');await sleep();click('route:inventory');await sleep();click('bag-category:other');assert.ok(d.querySelector('[data-action="bag-item:artifact-eldergrove"]'),'Earned counter item appears in the bag');
  // Exercise the actual map builder at each reveal boundary, including saved scroll positions.
  const fogSave=w.GEMWOVEN_GAME.engine.read();let visibilityCases=0;
  for(const chapter of [1,15,24])for(const cleared of [0,1,2,3,4,5,6,7,8,9,10,15,16,47,48,49,50]){
    const start=(chapter-1)*50+1,save=JSON.parse(JSON.stringify(fogSave));save.campaign.cleared=start-1+cleared;
    w.localStorage.setItem(w.GemwovenProgression.KEY,JSON.stringify(save));
    const state={screen:'campaign',chapter,hero:'novice',mapScroll:{[chapter]:0},mapProgress:{[chapter]:save.campaign.cleared}};
    w.GEMWOVEN_GAME.decorate(state);
    const el=d.createElement('div');w.GEMWOVEN_LAYOUT.screens.campaign.nodes.find(n=>n.id==='campaign.map').build(el);
    const count=Math.min(50,Math.max(7,cleared+1)),pins=[...el.querySelectorAll('.world-pin')];
    assert.deepEqual(pins.map(pin=>Number(pin.dataset.index)),Array.from({length:count},(_,i)=>start+i));
    assert.equal(pins.filter(pin=>!pin.classList.contains('locked')).length,Math.min(50,cleared+1));
    assert.equal(el.querySelectorAll('.pin-stars').length,cleared,'Unbeaten stages have no earned stars');
    assert.equal(el.querySelectorAll('.world-pin.boss').length,cleared>=49?1:0,'Only the last stage can reveal a boss');
    const cloud=el.querySelector('.frontier-cloud');
    assert.equal(Boolean(cloud),cleared<49,'Fog disappears when the final stage is revealed');
    assert.equal(el.querySelectorAll('.pin-lock').length,count-Math.min(50,cleared+1),'Only inaccessible stages have lock badges');
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
      // Beanstalk map: each stage stands on its own leaf; positions belong to the assembled map.
      const source=JSON.parse(pin.dataset.sourceAnchor),group=pin.closest('.bean-leaf-group');
      assert.equal(profile.mode,'beanstalk-objects');assert.ok(group,'Every stage sits on a beanstalk leaf');
      const localY=(Number(pin.dataset.groundY)+origin)%profile.stride;
      assert.ok(Math.abs(localY-source[1])<.01,'Actor ground point follows the shared leaf ladder');
      assert.ok(Math.abs(parseFloat(group.style.top)+parseFloat(pin.style.getPropertyValue('--floor-y'))-Number(pin.dataset.groundY))<.01,'Leaf floor anchor is grounded, not the sprite box center');
      assert.ok(Math.abs(parseFloat(group.style.left)+parseFloat(pin.style.getPropertyValue('--floor-x'))-Number(pin.dataset.groundX))<.01,'Leaf floor anchor matches the stage x');
      assert.ok(Math.abs(Number(pin.dataset.groundX)-source[0]*941/profile.sourceSize[0])<.01);
    }
    if(chapter===1&&[8,16].includes(cleared))captures.push({...captures.find(page=>page.key==='campaign'),key:'campaign-'+cleared,map:captureMap(el)});

    // The beanstalk keeps 140px of root/soil below the first leaf; the opening view starts above it.
    const row=1492/8,root=140,slots=count+(cloud?1:0);assert.equal(parseFloat(world.style.height),Math.max(8,slots)*row+root,'Exactly eight rows per viewport; only excess milestones add scrolling');
    assert.ok(Number(el.dataset.scrollTarget)>=0&&Number(el.dataset.scrollTarget)<=parseFloat(world.style.height)-1492,'Old scroll positions stay in discovered terrain');
    if(slots<=8)assert.equal(parseFloat(world.style.height),1492+root,'Opening eight slots only add the root strip');
    if(cloud){const profile=JSON.parse(world.dataset.profile),hiddenY=(Number(world.dataset.islands)-1-Math.floor(count/profile.places.length))*profile.stride+profile.places[count%profile.places.length][1]-origin;assert.ok(parseFloat(cloud.style.top)+parseFloat(cloud.style.height)>=hiddenY+40,'Compact cloud still covers the whole first hidden platform');}
    const centers=pins.map(pin=>Number(pin.dataset.groundY));
    if(cloud)centers.push(parseFloat(cloud.style.top)+row/2);
    assert.equal(centers.filter(y=>y>=0&&y<1492).length,8,'Eight milestones, including the fog slot, fit in the frontier viewport');
    for(let scroll=0;scroll<=parseFloat(world.style.height)-root-1492;scroll+=row){
      assert.equal(centers.filter(y=>y>=scroll&&y<scroll+1492).length,8,'Eight milestone centers fit throughout the explored map');
    }
    if(cleared>=8)assert.ok(parseFloat(world.style.height)>1492,'Further unlocked stages require scrolling');
    if(cleared<49)assert.equal(el.querySelector(`[data-node="campaign.stage-${start+49}"]`),null,'Distant boss is absent from the DOM');
    if(cleared>=49)assert.equal(el.querySelector('.world-pin.boss').classList.contains('locked'),false,'Boss is playable after stage 49');
    el.scrollTop=-200;el.onscroll();assert.equal(el.scrollTop,0,'Cannot scroll above the cloud boundary');
    el.scrollTop=1e6;el.onscroll();assert.equal(el.scrollTop,parseFloat(world.style.height)-1492,'Cannot scroll beyond the explored map');
    el.scrollTop=120;el.onscroll();assert.equal(state.mapScroll[chapter],origin+Math.min(120,parseFloat(world.style.height)-1492));
    if([8,16,47].includes(cleared)){
      const follow={screen:'campaign',chapter,mapScroll:{[chapter]:0},mapProgress:{[chapter]:save.campaign.cleared-1}};
      w.GEMWOVEN_GAME.decorate(follow);const moved=d.createElement('div');w.GEMWOVEN_LAYOUT.screens.campaign.nodes.find(n=>n.id==='campaign.map').build(moved);
      const hero=moved.querySelector('.cleared-hero'),heroY=Number(hero.dataset.groundY)-Number(moved.dataset.scrollTarget);
      assert.ok(heroY>=row&&heroY<=row*3,`Camera follows the hero within the revealed terrain: chapter ${chapter}, cleared ${cleared}, y ${heroY}`);
      assert.equal(moved.querySelectorAll('.world-pin.next-stage').length,1,'Only one next milestone is visible after the opening stretch');
      assert.equal(moved.querySelectorAll('.world-pin.locked').length,0,'The next playable milestone is not locked');
    }
    visibilityCases++;
  }
  fs.writeFileSync(path.join(__dirname,'layout.json'),JSON.stringify(captures));
  { // Mailbox: welcome notice, letter view, studio send (no Đá Ngọc), item info with art, claim reward sheet, delete rules.
    const P=w.GemwovenProgression,E=w.GEMWOVEN_GAME.engine,art=id=>w.GEMWOVEN_ASSETS[P.RESOURCES[id][1]].file,dialog=d.getElementById('preview-dialog');
    w.localStorage.removeItem(P.KEY);await go('home');await go('mail');
    let rows=[...d.querySelectorAll('.mail-row')];assert.equal(rows.length,1,'A new save holds only the welcome notice');assert.ok(rows[0].textContent.includes('Chào mừng'));assert.ok(rows[0].querySelector('.mail-new'));
    assert.equal(d.querySelector('.mail-row[data-id="preview-gift-2026-10"]'),null,'No preview gift outside localhost');
    assert.equal(d.querySelector('.live-panel [data-action="route:quests"]'),null,'Daily quests are not a mailbox action');
    assert.equal(d.querySelector('[data-node="mail.mail"] .mail-count').textContent,'1','HUD envelope shows the unread count');
    assert.equal(d.querySelector('[data-action="do:mail-claim-all"]').disabled,true);
    rows[0].click();await sleep();assert.ok(d.querySelector('.mail-letter').textContent.includes('Hòm Thư là nơi Ban Quản Trị'));assert.equal(d.querySelector('[data-action="do:mail-claim"]'),null,'Notices have no claim button');
    assert.equal(d.querySelector('[data-action="do:mail-delete"]').disabled,false);assert.equal(d.querySelector('[data-node="mail.mail"] .mail-count'),null,'Read mail clears the count');click('do:mail-back');await sleep();
    await go('admin');const mailForm=d.getElementById('mail-form'),options=[...mailForm.querySelectorAll('select[name^="resource"] option')].map(o=>o.value);
    assert.ok(!options.includes('gems')&&!mailForm.textContent.includes('Đá Ngọc</option>'),'Đá Ngọc is never selectable');assert.deepEqual(options.filter(Boolean).slice(0,P.MAIL_RESOURCES.length),[...P.MAIL_RESOURCES]);
    assert.ok(d.querySelector('.mail-studio').textContent.includes('không phải trang quản trị đã xác thực'),'Studio is labelled as a local prototype');
    const fill=values=>{for(const [k,v]of Object.entries(values))mailForm.elements.namedItem(k).value=v;mailForm.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));};
    fill({title:'Thông báo lỗi',kind:'notice',resource0:'gold',count0:'10'});await sleep();assert.equal(d.getElementById('dialog-title').textContent,'Thư chưa hợp lệ');d.getElementById('close-dialog').click();
    const giftRows={gold:5000,tickets:10,ore:20,skillBooks:2};
    fill({title:'Quà bảo trì',body:'Cảm ơn bạn đã chờ.',kind:'gift',expiryDays:'7',...Object.fromEntries(Object.entries(giftRows).flatMap(([id,n],i)=>[['resource'+i,id],['count'+i,String(n)]]))});await sleep();
    assert.equal(d.getElementById('dialog-title').textContent,'Đã gửi thư');d.getElementById('close-dialog').click();await go('home');await go('admin');assert.equal(d.querySelectorAll('.mail-sent').length,1,'Studio lists its sent mail');
    await go('mail');rows=[...d.querySelectorAll('.mail-row')];assert.equal(rows.length,2);assert.ok(rows[0].classList.contains('is-gift'),'Newest first');
    assert.deepEqual([...rows[0].querySelectorAll('.mail-thumb img')].map(i=>i.getAttribute('src')),Object.keys(giftRows).map(art),'Row thumbnails show each attachment');
    click('do:mail-tab');d.querySelector('[data-action="do:mail-tab"][data-tab="gift"]').click();await sleep();assert.equal(d.querySelectorAll('.mail-row').length,1);d.querySelector('[data-action="do:mail-tab"][data-tab="notice"]').click();await sleep();assert.equal(d.querySelectorAll('.mail-row:not(.is-gift)').length,1);d.querySelector('[data-action="do:mail-tab"][data-tab="all"]').click();await sleep();
    d.querySelector('.mail-row.is-gift').click();await sleep();
    const tiles=[...d.querySelectorAll('.mail-gift')];assert.equal(tiles.length,4);assert.deepEqual(tiles.map(t=>t.querySelector('img').getAttribute('src')),Object.keys(giftRows).map(art),'Letter tiles show item art');assert.ok(tiles[0].textContent.includes('×5.000'));
    assert.equal(d.querySelector('[data-action="do:mail-delete"]').disabled,true,'Cannot delete a letter with unclaimed gifts');
    tiles[0].click();await sleep();assert.ok(dialog.open);assert.equal(d.getElementById('dialog-title').textContent,P.RESOURCES.gold[0]);assert.ok(d.querySelector('#dialog-art img').getAttribute('src').endsWith(art('gold')),'Item info shows the item image');assert.ok(d.getElementById('dialog-copy').textContent.includes('Đang có'));d.getElementById('close-dialog').click();
    const before=E.read();click('do:mail-claim');await sleep();const after=E.read();
    for(const [id,n]of Object.entries(giftRows))assert.equal((after.wallet[id]??after.materials[id])-(before.wallet[id]??before.materials[id]),n,'Claim grants '+id);assert.equal(after.wallet.gems,0);
    const rewardTiles=[...d.querySelectorAll('#preview-dialog .reward-tile')];assert.equal(rewardTiles.length,4,'Reward sheet lists every granted item');assert.deepEqual(rewardTiles.map(t=>t.querySelector('img').getAttribute('src')),Object.keys(giftRows).map(art));assert.ok(rewardTiles[0].textContent.includes('+5.000'));d.getElementById('close-dialog').click();
    assert.equal(d.querySelector('[data-action="do:mail-claim"]'),null);assert.ok(d.querySelector('.mail-gifts-title').textContent.includes('Đã nhận'));
    assert.deepEqual({...E.claimMail(E.mailbox().mails[0].id)},{},'A second claim grants nothing');
    click('do:mail-delete');await sleep();assert.equal(d.querySelectorAll('.mail-row').length,1);
    click('do:mail-delete-read');await sleep();d.getElementById('close-dialog').click();assert.ok(d.querySelector('.mail-empty').textContent.includes('Hòm thư trống'),'Empty state');assert.equal(d.querySelector('[data-action="do:mail-delete-read"]').disabled,true);
    // Localhost preview: the sample gift arrives once, clearly marked.
    const local=new JSDOM(fs.readFileSync(path.join(root,'Gemwoven.html'),'utf8'),{url:'http://127.0.0.1:5173/Gemwoven.html#mail',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),lw=local.window;
    lw.HTMLDialogElement.prototype.showModal=function(){this.open=true;};lw.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new lw.Event('close'));};lw.matchMedia=()=>motionPreference;lw.ResizeObserver=class{observe(){}disconnect(){}};lw.HTMLCanvasElement.prototype.getContext=()=>inert2d;
    for(const name of ['assets','screens','expansion','copy','boss-chapters','boss-tactics','world','progression','progression-ui','art-screens','journey-ui','equipment-ui','chapter-guide','form-effects','hero-forms','summon-cinematic','living-hub','ui'])lw.eval(fs.readFileSync(path.join(root,`src/gemwoven/${name}.js`),'utf8'));
    await sleep();const sample=local.window.document.querySelector('.mail-row[data-id="preview-gift-2026-10"]');assert.ok(sample&&sample.textContent.includes('Quà thử nghiệm'),'Localhost preview shows the sample gift');assert.equal(sample.querySelectorAll('.mail-thumb').length,4);
    assert.ok(lw.GEMWOVEN_GAME.engine.mailbox().mails.find(m=>m.source==='preview').body.includes('(bản thử nghiệm local)'));local.window.close();
  }
  // Panels outside the bottom menu carry a back arrow that returns to the previous screen.
  w.GEMWOVEN_GAME.engine.sendMail({kind:'notice',from:'Ban Quản Trị',title:'Kiểm tra nút quay lại',body:'Thư kiểm thử.',attachments:[],expiryDays:3});
  await go('inventory');await go('mail');assert.ok(d.querySelector('[data-node="mail.back"]'),'Mailbox has a back arrow');
  d.querySelector('.mail-row').click();await sleep();assert.ok(d.querySelector('.mail-detail'),'Letter opens');d.querySelector('[data-node="mail.back"]').click();await sleep();assert.equal(d.querySelector('.mail-detail'),null,'Back closes an open letter first');
  d.querySelector('[data-node="mail.back"]').click();await sleep();assert.equal(d.title,'Gemwoven · '+w.GEMWOVEN_LAYOUT.names.inventory,'Back returns to the previous screen');
  for(const key of ['boss','offline','rankings','events','vip','settings','admin','chat']){await go(key);assert.ok(d.querySelector(`[data-node="${key}.back"]`),key+' has a back arrow');}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,screens,visibilityCases,checks:'Persistent wallet, illustrated navigation, tutorial lock previews and full-width cloud frontier, trimmed scroll extent, hidden future bosses, summons, equipment, skills, events and mailbox (welcome, studio send without gems, item art, claim reward sheet, delete rules, localhost preview gift)'},null,2));w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
