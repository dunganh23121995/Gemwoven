/* Kỹ Năng tree in a real browser (phone 390×844): the four real skills sit on today's bough with no plates and no
 * scrolling; a QA-only fake hero (window.GEMWOVEN_QA_SKILLS) grows the bough by two-pad periods, scrolls, keeps the
 * selected node in view, hides the cue on the side with nothing left, and covers a free crown pad with leaves.
 * Uses its own local server and a fresh save. Run: node qa/gemwoven/check-skill-tree.cjs */
const {chromium}=require('./runtime/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.ogg':'audio/ogg','.json':'application/json'};
const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=`http://127.0.0.1:${server.address().port}`,errors=[];
  const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
  try{
    const open=async qa=>{
      const page=await (await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1})).newPage();
      page.on('pageerror',e=>errors.push(e.message));
      if(qa)await page.addInitScript(n=>{window.GEMWOVEN_QA_SKILLS=n;},qa);
      await page.goto(url+'/Gemwoven.html');await sleep(800);
      await page.evaluate(()=>{for(const k of Object.keys(localStorage))if(k.startsWith('gemwoven'))localStorage.removeItem(k);const M=window.GemwovenProgression,K='gemwoven.progression.v1';M.makeEngine(localStorage).read();const s=JSON.parse(localStorage.getItem(K));
        Object.assign(s.heroes.novice,{level:200,evolution:4,skills:[4,2,1,1]});localStorage.setItem(K,JSON.stringify(s));});
      await page.goto(url+'/Gemwoven.html#skills');await page.reload();await sleep(1500);return page;
    };
    const tree=page=>page.evaluate(()=>{const v=document.querySelector('.st-scroll'),t=document.querySelector('[data-node="skills.tree"]');
      return {nodes:document.querySelectorAll('.st-node').length,plates:document.querySelectorAll('.st-gate,.st-name,.st-need').length,crown:document.querySelectorAll('.st-crown').length,
        scroll:v?{top:Math.round(v.scrollTop),room:v.scrollHeight-v.clientHeight}:null,atTop:t.classList.contains('at-top'),atBottom:t.classList.contains('at-bottom'),
        sel:Number(document.querySelector('.st-node[aria-current]')?.dataset.index),panel:document.querySelector('.sd-name')?.textContent};});
    // Real heroes: four nodes, today's box, no plates, no scrolling.
    let page=await open(0),t=await tree(page);
    assert.deepEqual([t.nodes,t.plates,t.crown,t.scroll,t.sel],[4,0,0,null,0]);
    await page.close();
    // Eight QA skills: two periods (610.88 units of scrolling), opened at the root with the root selected.
    page=await open(8);t=await tree(page);
    assert.equal(t.nodes,8);assert.equal(t.plates,0);assert.equal(t.crown,0);assert.equal(t.sel,0);
    assert.ok(Math.abs(t.scroll.room-610.88)<2,'two periods of scrolling: '+t.scroll.room);
    assert.ok(t.atBottom&&!t.atTop,'opens at the root');
    assert.equal(await page.locator('.st-cue.down').isVisible(),false,'no down cue at the root');
    // The up cue climbs one period; the root goes out of view, so the nearest visible node becomes the selection.
    await page.locator('.st-cue.up').click();await sleep(1400);t=await tree(page);
    assert.ok(Math.abs(t.scroll.top-(610.88-305.44))<3,'one period up: '+t.scroll.top);
    assert.ok(t.sel>0,'selection followed the view: '+t.sel);
    // Scrolled to the crown, then a skill picked there: the view keeps it, and a QA skill only says it is a QA skill.
    await page.evaluate(()=>{document.querySelector('.st-scroll').scrollTop=0;});await sleep(1200);t=await tree(page);
    assert.ok(t.atTop&&t.sel>=4,'at the crown, a high skill is selected: '+t.sel);
    await page.locator('.st-node[data-index="6"]').click();await sleep(900);t=await tree(page);
    assert.equal(t.sel,6);assert.equal(t.panel,'Kỹ năng thử 7');assert.ok(t.scroll.top<5,'stays at the crown');
    // Choosing the root again (it is far below) scrolls it back into view.
    await page.evaluate(()=>document.querySelector('.st-node[data-index="0"]').click());await sleep(1400);t=await tree(page);
    assert.equal(t.sel,0);assert.ok(t.scroll.top>600,'root brought into view: '+t.scroll.top);
    await page.close();
    // Seven QA skills: the free crown pad wears the leafy tip.
    page=await open(7);t=await tree(page);
    assert.deepEqual([t.nodes,t.crown],[7,1]);
    await page.close();
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({passed:true,checks:'4 real skills unchanged without plates; QA 8: scroll room, cues, selection follows the view, chosen node brought into view; QA 7: leafy crown'},null,2));
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exit(1);});
