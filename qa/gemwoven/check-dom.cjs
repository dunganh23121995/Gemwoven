/* Legacy composition checks, kept as a source-art regression suite. */
const {JSDOM,VirtualConsole}=require('./runtime/node_modules/jsdom');
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),errors=[],checks=[];
const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(String(e)));virtualConsole.on('error',e=>errors.push(String(e)));
const dom=new JSDOM(fs.readFileSync(path.join(root,'Gemwoven.html'),'utf8'),{url:'http://localhost/Gemwoven.html',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole});
const w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
for(const name of ['assets','screens','expansion','copy','ui'])w.eval(fs.readFileSync(path.join(root,`src/gemwoven/${name}.js`),'utf8'));
const sleep=()=>new Promise(r=>setTimeout(r,15));
async function go(key){w.location.hash=key;await sleep();assert.equal(d.title,`Gemwoven · ${w.GEMWOVEN_LAYOUT.names[key]}`);}
function node(id){const el=d.querySelector(`[data-node="${id}"]`);assert.ok(el,id);return el;}
function toggle(id,value){d.getElementById(id).checked=value;d.getElementById(id).dispatchEvent(new w.Event('change'));}
function pass(label){checks.push(label);}
(async()=>{
  assert.equal(Object.keys(w.GEMWOVEN_LAYOUT.screens).length,9);
  assert.equal(d.title,'Gemwoven · Trang Chủ');
  for(const [key,screen] of Object.entries(w.GEMWOVEN_LAYOUT.screens)){
    await go(key);
    // The legacy level bar is replaced by the experience ring around the avatar.
    assert.equal(d.querySelectorAll('#scene .node').length,screen.nodes.filter(n=>!/\.(level-plate|level-meter|level-badge|level)$/.test(n.id)).length);
    const ids=screen.nodes.map(n=>n.id);assert.equal(new Set(ids).size,ids.length);
    for(const button of d.querySelectorAll('#scene button')){
      assert.ok(button.getAttribute('aria-label'));assert.ok(button.querySelector('img.art,img.hud-avatar-frame'));assert.ok(button.dataset.action);
    }
    for(const img of d.querySelectorAll('#scene img'))assert.ok(fs.existsSync(path.join(root,img.getAttribute('src'))),img.src);
    assert.ok(fs.existsSync(path.join(root,screen.background)));
    assert.equal(d.querySelectorAll('#scene .bottom-nav').length,7);
    const next=key==='home'?'inventory':'home';
    node(`${key}.nav-${next}`).click();await sleep();assert.equal(d.title,`Gemwoven · ${w.GEMWOVEN_LAYOUT.names[next]}`);
    pass(`${key}: composition, assets, labels, footer navigation`);
  }
  await go('arena');node('arena.mode-team').click();assert.equal(node('arena.mode-team').getAttribute('aria-pressed'),'true');assert.equal(node('arena.mode-solo').getAttribute('aria-pressed'),'false');node('arena.battle').click();assert.equal(d.getElementById('dialog-title').textContent,'Đấu trường 3v3');d.getElementById('close-dialog').click();assert.equal(d.getElementById('preview-dialog').open,false);pass('Arena mode and preview dialog');
  await go('shop');node('shop.product-mana').click();assert.equal(d.querySelector('[data-copy="shop.product-name"]').textContent,'Đá Ngọc');node('shop.quantity-plus').click();assert.equal(d.querySelector('[data-copy="shop.purchase-price"]').textContent,'● 600');for(let i=0;i<4;i++)node('shop.quantity-minus').click();assert.equal(d.querySelector('[data-copy="shop.quantity"]').textContent,'1');pass('Independent product selection and quantity limits');
  await go('forge');node('forge.forge-tab-2').click();assert.equal(d.querySelector('[data-copy="forge.forge-action"]').textContent,'KHẢM NGỌC');pass('Forge tabs');
  await go('upgrade');node('upgrade.upgrade-tab-1').click();assert.equal(d.querySelector('[data-copy="upgrade.upgrade-action"]').textContent,'Tăng Sao');pass('Upgrade tabs');
  await go('tavern');node('tavern.quest-dismiss').click();assert.equal(node('tavern.quest-panel').hidden,true);node('tavern.tavern-tab-1').click();assert.equal(node('tavern.quest-panel').hidden,false);pass('Tavern panel close and reopen');
  toggle('hide-copy',true);assert.ok(d.getElementById('stage').classList.contains('hide-copy'));toggle('hide-copy',false);
  toggle('show-bounds',true);assert.ok(d.getElementById('stage').classList.contains('show-bounds'));
  toggle('edit-copy',true);const title=d.querySelector('[data-copy="tavern.title"]');title.textContent='Tên quán mới';title.dispatchEvent(new w.Event('input',{bubbles:true}));toggle('edit-copy',false);await go('arena');await go('tavern');assert.equal(d.querySelector('[data-copy="tavern.title"]').textContent,'Tên quán mới');pass('Hide text, outlines, edit persistence across screens');
  await go('skills');
  const originalTitle=w.GEMWOVEN_COPY['skills.title'];w.GEMWOVEN_COPY['skills.title']='Kỹ năng tùy chỉnh';
  node('skills.roster-ice').click();assert.equal(d.querySelector('[data-copy="skills.title"]').textContent,'Kỹ năng tùy chỉnh');w.GEMWOVEN_COPY['skills.title']=originalTitle;
  for(const [hero,data] of Object.entries(w.GEMWOVEN_HEROES)){
    node('skills.roster-'+hero).click();
    assert.equal(node('skills.hero-model').dataset.asset,'hero-'+hero);
    for(let i=0;i<4;i++){
      node('skills.branch-'+i).click();
      assert.equal(d.querySelector(`[data-copy="skills.skill-name-${hero}-${i}"]`).textContent,data.skills[i][0]);
      assert.equal(node('skills.selected-icon').dataset.asset,`skill-${hero}-${i}`);
    }
  }
  pass('All 5 combat-matched heroes and 20 skill details');
  toggle('edit-copy',true);const skillLabel=d.querySelector('[data-copy="skills.skill-name-shadow-3"]');skillLabel.textContent='Tên kỹ năng riêng';skillLabel.dispatchEvent(new w.Event('input',{bubbles:true}));toggle('edit-copy',false);
  node('skills.roster-fire').click();node('skills.branch-3').click();assert.equal(d.querySelector('[data-copy="skills.skill-name-fire-3"]').textContent,'Cửu Vĩ Viêm Hồn');
  node('skills.roster-shadow').click();node('skills.branch-3').click();assert.equal(d.querySelector('[data-copy="skills.skill-name-shadow-3"]').textContent,'Tên kỹ năng riêng');
  await go('upgrade');assert.equal(node('upgrade.hero-model').dataset.asset,'hero-shadow');pass('Hero identity follows navigation; edited skill copy stays with its hero');
  await go('inventory');
  for(const category of ['all','item','material','gear','fragment','book','other']){
    node('inventory.category-'+category).click();
    const expected=w.GEMWOVEN_INVENTORY.filter(p=>category==='all'||p[3]===category);
    assert.equal(d.querySelectorAll('[data-action^="bag-item:"]').length,Math.min(16,expected.length));
    for(const item of expected.slice(0,16)){
      node('inventory.item-'+item[0]).click();assert.equal(node('inventory.detail-art').dataset.asset,item[0]);
    }
  }
  node('inventory.category-all').click();node('inventory.next').click();assert.equal(d.querySelectorAll('[data-action^="bag-item:"]').length,4);node('inventory.previous').click();assert.equal(d.querySelectorAll('[data-action^="bag-item:"]').length,16);pass('Inventory category filtering, item details and pagination');
  // Every interactive item must execute its lightweight action without exceptions.
  let exercised=0;
  for(const [key,screen] of Object.entries(w.GEMWOVEN_LAYOUT.screens)){
    for(const n of screen.nodes.filter(n=>n.kind==='button')){
      await go(key);if(key==='inventory')node('inventory.category-all').click();if(key==='skills'){node('skills.roster-fire').click();node('skills.branch-0').click();}if(d.getElementById('preview-dialog').open)d.getElementById('close-dialog').click();node(n.id).click();await sleep();exercised++;
    }
  }
  pass(`${exercised} button actions executed`);
  assert.deepEqual(errors,[]);
  const result={passed:true,scope:'jsdom: DOM and interaction logic only; no real browser visual testing',checks,buttonsExercised:exercised,errors};
  fs.writeFileSync(path.join(__dirname,'dom-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
