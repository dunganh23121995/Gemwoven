/* Smoke check the generated portable file, including dynamically rebuilt screens. */
const {JSDOM,VirtualConsole}=require('./runtime/node_modules/jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'Gemwoven_6_Man.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,21);
assert.ok(!html.includes('src="src/gemwoven/'));
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(String(e)));
const dom=new JSDOM(html.replace(/<script>[\s\S]*?<\/script>/g,''),{runScripts:'outside-only',pretendToBeVisual:true,url:'file:///Gemwoven_6_Man.html',virtualConsole:vc});
const w=dom.window,d=w.document;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
for(const code of scripts)w.eval(code);
function verify(){
  assert.ok(d.getElementById('scene').style.backgroundImage.includes('data:image/webp;base64,'));
  for(const im of d.querySelectorAll('#scene img'))assert.ok(im.src.startsWith('data:image/'));
}
(async()=>{
  verify();
  for(const route of w.GEMWOVEN_LAYOUT.order){
    w.location.hash=route;await new Promise(r=>setTimeout(r,30));verify();
    if(route==='campaign'){
      assert.equal(d.querySelectorAll('.world-pin').length,7,'Portable map also hides distant stages');
      assert.equal(d.querySelector('[data-node="campaign.stage-8"]'),null);
      assert.equal(d.querySelector('.exploration-fog'),null);
      assert.ok(d.querySelector('.frontier-cloud img').src.startsWith('data:image/'),'Milestone cloud is embedded');
      assert.ok(JSON.parse(d.querySelector('.map-world').dataset.profile).background.startsWith('data:image/webp;'),'Close-up map is embedded');
      d.querySelector('[data-node="campaign.stage-1"]').click();verify();
      assert.equal(d.querySelectorAll('.encounter-star-rewards article').length,3);
      assert.equal(d.querySelectorAll('.encounter-roster button').length,1);
      d.querySelector('[data-action="journey:close-stage"]').click();
    }
  }
  w.location.hash='skills';await new Promise(r=>setTimeout(r,30));d.querySelector('[data-action="do:hero"][data-hero="shadow"]').click();verify();
  assert.ok(d.querySelector('[data-node="skills.hero-model"]>.art').src.startsWith('data:image/'));
  const preview={screen:'campaign',chapter:21,chapterGuide:true,hero:'novice'};w.GEMWOVEN_GAME.decorate(preview);const guide=w.GEMWOVEN_LAYOUT.screens.campaign.nodes.find(n=>n.id==='campaign.field-guide');assert.ok(guide);const holder=d.createElement('section');guide.build(holder);assert.equal(holder.querySelectorAll('.chapter-skill').length,6);for(const im of holder.querySelectorAll('img'))assert.ok(im.src.startsWith('data:image/'),'Boss guide embeds its new sprites and artifact');
  assert.deepEqual(errors,[]);console.log('Offline passed: all hub screens, Noct, exploration and boss guide use embedded images after navigation.');w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
