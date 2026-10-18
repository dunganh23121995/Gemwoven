/* Smoke check the generated portable file, including dynamically rebuilt screens. */
const {JSDOM,VirtualConsole}=require('./runtime/node_modules/jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const html=fs.readFileSync(path.join(root,'Gemwoven_6_Man.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
assert.equal(scripts.length,5);
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
  for(const route of ['inventory','skills']){
    w.location.hash=route;await new Promise(r=>setTimeout(r,30));verify();
  }
  d.querySelector('[data-node="skills.roster-shadow"]').click();verify();
  assert.equal(d.querySelector('[data-node="skills.hero-model"]').dataset.asset,'hero-shadow');
  assert.deepEqual(errors,[]);console.log('Offline passed: Home, Inventory, Skills and Noct all use embedded images after navigation.');w.close();
})().catch(e=>{console.error(e);w.close();process.exitCode=1;});
