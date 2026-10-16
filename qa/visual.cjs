const { chromium } = require(require('path').join(require('os').tmpdir(),'minipuzzle-qa/node_modules/playwright'));
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:8000/Game.html?qa');await page.screenshot({path:'qa/desktop-select.png',fullPage:true});
  if(await page.locator('#heroList').isVisible())await page.locator('.gem-choice.chosen').click();await page.locator('#startBtn').click();await page.screenshot({path:'qa/desktop-game.png',fullPage:true});
  console.log('Initial',await page.evaluate(()=>({tiles:document.querySelectorAll('.tile').length,matches:gameQA.matches().tiles.length,moves:gameQA.legalMoves().length,body:document.body.scrollWidth,viewport:innerWidth})));
  await page.evaluate(async()=>{const move=gameQA.legalMoves()[0];await gameQA.trySwap(move.a,move.b);});
  await page.screenshot({path:'qa/desktop-after-turn.png',fullPage:true});
  console.log('After move',await page.evaluate(()=>({locked:gameQA.locked,effects:gameQA.effects,tiles:document.querySelectorAll('.tile').length,matches:gameQA.matches().tiles.length,moves:gameQA.legalMoves().length,state:gameQA.state})));
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'qa/mobile-game.png',fullPage:true});
  console.log('Mobile overflow',await page.evaluate(()=>document.body.scrollWidth>innerWidth));
  await page.goto('http://127.0.0.1:8000/Game.html?qa');await page.screenshot({path:'qa/mobile-select.png',fullPage:true});
  console.log('Errors',errors);await browser.close();if(errors.length)process.exitCode=1;
})();
