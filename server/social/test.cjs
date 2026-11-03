/* Social server integration test: real WebSocket clients against a server on a free port. */
const assert=require('node:assert/strict'),os=require('node:os'),path=require('node:path'),fs=require('node:fs');
const WebSocket=require('ws');
const {createServer}=require('./server.js');
const S=require('../../src/gemwoven/social-protocol.js');
const dataFile=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'gw-social-')),'social.json');
let clock=Date.parse('2026-11-04T03:00:00Z');const now=()=>clock;
function client(port){
  const ws=new WebSocket(`ws://127.0.0.1:${port}/social`),inbox=[],waiters=[];
  ws.on('message',raw=>{const m=JSON.parse(String(raw));inbox.push(m);for(const w of [...waiters])if(w.test(m)){waiters.splice(waiters.indexOf(w),1);w.done(m);}});
  const c={ws,inbox,send:m=>ws.send(JSON.stringify(m)),
    wait:(test,ms=2000)=>{const where=new Error().stack.split(/\n/)[2];const hit=inbox.find(m=>typeof test==='string'?m.t===test:test(m));if(hit){inbox.splice(inbox.indexOf(hit),1);return Promise.resolve(hit);}
      return new Promise((done,fail)=>{const w={test:typeof test==='string'?m=>m.t===test:test,done:m=>{inbox.splice(inbox.indexOf(m),1);clearTimeout(w.timer);done(m);}};w.timer=setTimeout(()=>fail(Error('timeout waiting for '+test+' '+where+' inbox='+JSON.stringify(inbox.slice(-4)))),ms);waiters.push(w);});},
    open:()=>new Promise(r=>ws.on('open',r))};
  return c;
}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function join(port,name,profile){const c=client(port);await c.open();c.send({t:'hello',p:profile});await c.wait('needName');c.send({t:'register',name,p:profile});const reg=await c.wait('registered');await c.wait('welcome');await c.wait('channel');return Object.assign(c,{id:reg.id,token:reg.token});}
async function walk(c,to){c.send({t:'move',to});await sleep(40);}
(async()=>{
  const app=createServer({port:0,host:'127.0.0.1',dataFile,now,tickMs:20});const port=await app.listen();
  try{
    const a=await join(port,'Lữ Khách A',{hero:'fire',level:45,power:900}),b=await join(port,'Kiếm Sĩ B',{hero:'novice',level:15,power:300});
    const bJoin=await a.wait(m=>m.t==='join'&&m.p.id===b.id);
    // Names are unique and checked.
    {const c=client(port);await c.open();c.send({t:'hello'});await c.wait('needName');c.send({t:'register',name:'lữ khách a'});assert.match((await c.wait('err')).text,/đã có/);c.send({t:'register',name:'admin x'});assert.match((await c.wait('err')).text,/hệ thống/);c.ws.close();}
    // Reconnect with the server-issued token; a wrong token is refused.
    {const c=client(port);await c.open();c.send({t:'hello',id:a.id,token:'nope'});await c.wait('needName');c.ws.close();}
    // Movement is the server's: far targets take time, and walls stop the hero.
    const far=[512,400];b.send({t:'move',to:far});
    const pos=await a.wait(m=>m.t==='pos'&&m.p.some(p=>p[0]===b.id));const step=pos.p.find(p=>p[0]===b.id);
    assert.ok(Math.hypot(step[1]-bJoin.p.x,step[2]-bJoin.p.y)<S.MAP.speed*.02+2,'one tick moves at most speed×dt');
    // Friend requests need the two to stand close.
    await sleep(2500);a.send({t:'friend',op:'request',id:b.id});assert.match((await a.wait('err')).text,/Đứng gần/);
    a.send({t:'move',to:[512,1380]});b.send({t:'move',to:[530,1380]});await sleep(3500);
    a.send({t:'friend',op:'request',id:b.id});await b.wait('friendReq');b.send({t:'friend',op:'accept',id:a.id});
    const fa=await a.wait(m=>m.t==='friends'&&m.friends.some(f=>f.id===b.id));assert.equal(fa.friends[0].online,true);
    // Area chat reaches the channel; spam is limited; words are masked.
    a.send({t:'say',ch:'area',text:'Xin chào quảng trường, đm'});const said=await b.wait(m=>m.t==='say'&&m.from===a.id);assert.equal(said.text,'Xin chào quảng trường, **');
    a.send({t:'say',ch:'area',text:'lần hai'});assert.match((await a.wait('err')).text,/chậm/);
    // Blocking hides chat.
    b.send({t:'block',id:a.id,on:true});await b.wait('toast');clock+=5000;await sleep(30);a.send({t:'say',ch:'area',text:'bạn có thấy không'});await sleep(150);
    assert.ok(!b.inbox.some(m=>m.t==='say'&&m.text==='bạn có thấy không'),'blocked chat hidden');b.send({t:'block',id:a.id,on:false});await b.wait('toast');
    b.send({t:'friend',op:'request',id:a.id});await sleep(80);a.send({t:'friend',op:'request',id:b.id});await sleep(80); // blocking removed the friendship; make it again
    // Guilds: level gate, create, apply, approve, ranks, check-in, lantern at the weaver only.
    b.send({t:'guild',op:'create',name:'Bang Nhỏ',tag:'BN'});assert.match((await b.wait('err')).text,/cấp 20/);
    b.send({t:'profile',p:{hero:'novice',level:30,power:400}});
    a.send({t:'guild',op:'create',name:'Hội Dệt Ngọc',tag:'DN',emblem:'gem'});await a.wait(m=>m.t==='guild'&&m.guild?.tag==='DN');const gid=(await (a.send({t:'guild',op:'info'}),a.wait('guild'))).guild.id;
    b.send({t:'guild',op:'apply',id:gid});await b.wait('toast');
    const pending=await a.wait(m=>m.t==='guild'&&m.guild.applications.length===1);assert.equal(pending.guild.applications[0].id,b.id);
    a.send({t:'guild',op:'approve',id:b.id});const joined=await b.wait(m=>m.t==='guild'&&m.guild);assert.equal(joined.guild.members.length,2);assert.equal(joined.guild.me.rank,'member');
    a.send({t:'guild',op:'promote',id:b.id});const promoted=await b.wait(m=>m.t==='guild'&&m.guild.me.rank==='elder');assert.ok(promoted);
    a.send({t:'guild',op:'promote',id:b.id});await b.wait(m=>m.t==='guild'&&m.guild.me.rank==='vice');
    b.send({t:'guild',op:'kick',id:a.id});assert.match((await b.wait('err')).text,/Không thể/);
    b.send({t:'guild',op:'checkin'});const checked=await b.wait(m=>m.t==='guild'&&m.guild.me.checked);assert.equal(checked.guild.exp,10);
    b.send({t:'guild',op:'checkin'});assert.match((await b.wait('err')).text,/đã điểm danh/);
    b.send({t:'guild',op:'weave',color:'red'});assert.match((await b.wait('err')).text,/Bà Dệt Đèn/);
    b.send({t:'move',to:[745,380]});a.send({t:'move',to:[735,390]});await sleep(9000);
    b.send({t:'guild',op:'weave',color:'red'});await b.wait(m=>m.t==='toast'&&/dệt/.test(m.text));
    a.send({t:'guild',op:'weave',color:'blue'});const woven=await a.wait(m=>m.t==='guild'&&m.guild.lantern.threads.blue===1);assert.equal(woven.guild.lantern.tier,0);
    b.send({t:'guild',op:'weave',color:'gold'});assert.match((await b.wait('err')).text,/Hôm nay/);
    // Guild chat reaches members only.
    clock+=5000;b.send({t:'say',ch:'guild',text:'Họp bang tối nay'});assert.equal((await a.wait(m=>m.t==='say'&&m.ch==='guild')).text,'Họp bang tối nay');
    // Friendly fight: invite, accept, both told to fight an AI copy; no result is announced.
    a.send({t:'duel',op:'invite',id:b.id});const inv=await b.wait('duelInvite');assert.equal(inv.from,a.id);
    b.send({t:'duel',op:'accept',id:a.id});const [da,db]=await Promise.all([a.wait('duelStart'),b.wait('duelStart')]);
    assert.equal(da.opponent.id,b.id);assert.equal(db.opponent.hero,'fire');assert.match(da.label,/bản sao · AI · Không thưởng/);
    // Leaving the plaza tells the channel.
    b.ws.close();await a.wait(m=>m.t==='leave'&&m.id===b.id);
    console.log(JSON.stringify({passed:true,checks:'register/token, server movement, proximity friends, chat limits+mask, block, guild gate/apply/approve/ranks/check-in, lantern zone+daily, guild chat, friendly fight invite'},null,1));
  }finally{await app.close();}
})().catch(e=>{console.error(e);process.exit(1);});
