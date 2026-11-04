/* Gemwoven social server (docs/GAME_DESIGN.md §14): plaza presence, chat, friends, friendly-fight
 * invites and guilds over WebSocket. It owns every decision (positions, rate limits, distances,
 * guild ranks); clients send intents. Shared rules: src/gemwoven/social-protocol.js.
 *   node server/social/server.js [port=8091] [dataFile=server/social/data/social.json]
 * Dev: the hub on :8080 connects to ws://<host>:8091/social. Release: behind Cloudflare Tunnel at
 * wss://<game domain>/social, bound to 127.0.0.1 (set HOST=127.0.0.1).
 */
'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {WebSocketServer}=require('ws');
const S=require('../../src/gemwoven/social-protocol.js');
const ROOT=path.resolve(__dirname,'../..');

// registerPerHour: new accounts per address per hour (SOCIAL_REGISTER_PER_HOUR; 5 in release, raise it for QA).
function createServer({port=8091,host='0.0.0.0',dataFile=path.join(__dirname,'data/social.json'),now=()=>Date.now(),tickMs=100,registerPerHour=Number(process.env.SOCIAL_REGISTER_PER_HOUR)||5}={}){
  // ---- Storage: accounts and guilds (positions and area chat are never stored) ----
  let db={version:1,accounts:{},guilds:{},reports:[]};
  try{db={...db,...JSON.parse(fs.readFileSync(dataFile,'utf8'))};}catch{}
  let saveTimer=null;
  function save(){if(saveTimer)return;saveTimer=setTimeout(()=>{saveTimer=null;try{fs.mkdirSync(path.dirname(dataFile),{recursive:true});const tmp=dataFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(db));fs.renameSync(tmp,dataFile);}catch(e){console.error('save failed',e.message);}},1000);}
  function flush(){if(saveTimer){clearTimeout(saveTimer);saveTimer=null;}try{fs.mkdirSync(path.dirname(dataFile),{recursive:true});fs.writeFileSync(dataFile,JSON.stringify(db));}catch{}}
  let geo=S.DEFAULT_GEO;
  try{geo=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/gemwoven/plaza/plaza.json'),'utf8'));}catch{}
  const hash=s=>crypto.createHash('sha256').update(String(s)).digest('hex');
  const newId=n=>crypto.randomBytes(n).toString('hex');
  const day=(ms=now())=>new Date(ms+7*3600000).toISOString().slice(0,10);
  const week=(ms=now())=>{const d=new Date(ms+7*3600000),back=(d.getUTCDay()+6)%7;return new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate()-back)).toISOString().slice(0,10);};

  // ---- Live sessions ----
  const sessions=new Map(),channels=new Map(),duels=new Map();
  const send=(s,msg)=>{if(s.ws.readyState===1)s.ws.send(JSON.stringify(msg));};
  const account=id=>db.accounts[id];
  const online=id=>sessions.get(id);
  const blocked=(a,b)=>account(a)?.blocks?.includes(b)||account(b)?.blocks?.includes(a);
  const err=(s,text,ref)=>send(s,{t:'err',text,ref});
  const toast=(s,text)=>send(s,{t:'toast',text});
  function pub(s){const a=account(s.id),g=a.guild&&db.guilds[a.guild];return {id:s.id,name:a.name,x:Math.round(s.pos[0]),y:Math.round(s.pos[1]),p:s.profile,tag:g?.tag||'',guild:g?.name||'',emote:s.emote||null};}
  function inChannel(n){return [...(channels.get(n)||[])].map(id=>sessions.get(id)).filter(Boolean);}
  function broadcast(n,msg,{except,skipBlockedOf}={}){for(const s of inChannel(n)){if(s.id===except)continue;if(skipBlockedOf&&blocked(s.id,skipBlockedOf))continue;send(s,msg);}}
  function pickChannel(){for(let n=1;;n++){if((channels.get(n)?.size||0)<S.LIMITS.channelCap)return n;}}
  function joinChannel(s,n,at){
    if(s.channel){channels.get(s.channel)?.delete(s.id);broadcast(s.channel,{t:'leave',id:s.id});}
    s.channel=n;if(!channels.has(n))channels.set(n,new Set());channels.get(n).add(s.id);
    const spawn=geo.spawn||S.MAP.spawn;s.pos=at?[...at]:[spawn[0]+(Math.random()*280-140),spawn[1]-Math.random()*90];s.target=[...s.pos];
    send(s,{t:'channel',n,players:inChannel(n).filter(o=>o.id!==s.id&&!blocked(o.id,s.id)).map(pub),counts:channelCounts()});
    broadcast(n,{t:'join',p:pub(s)},{except:s.id,skipBlockedOf:s.id});
  }
  const channelCounts=()=>Object.fromEntries([...channels].filter(([,v])=>v.size).map(([k,v])=>[k,v.size]));

  // ---- Friends ----
  function friendView(id){const a=account(id);return {friends:(a.friends||[]).map(f=>{const o=account(f),s=online(f);return {id:f,name:o?.name||'?',online:!!s,channel:s?.channel||null,hero:o?.profile?.hero||'novice',level:o?.profile?.level||1,heart:(a.hearts?.day===day()&&a.hearts.ids.includes(f))};}),
    incoming:(a.incoming||[]).map(f=>({id:f,name:account(f)?.name||'?'})),outgoing:(a.outgoing||[]).map(f=>({id:f,name:account(f)?.name||'?'})),blocks:(a.blocks||[]).map(f=>({id:f,name:account(f)?.name||'?'})),friendPoints:a.friendPoints||0};}
  const pushFriends=id=>{const s=online(id);if(s)send(s,{t:'friends',...friendView(id)});};
  const ipLimits={};
  function hourly(a,key,limit){const h=a[key]??={at:now(),n:0};if(now()-h.at>3600000){h.at=now();h.n=0;}if(h.n>=limit)return false;h.n++;return true;}

  // ---- Guilds ----
  function guildView(gid,viewer){const g=db.guilds[gid];if(!g)return null;const level=S.guildLevel(g.exp),me=g.members[viewer];
    return {id:gid,name:g.name,tag:g.tag,emblem:g.emblem,policy:g.policy,minLevel:g.minLevel,notice:g.notice,exp:g.exp,level,cap:S.guildCap(level),next:S.GUILD_EXP[level]??null,
      members:Object.entries(g.members).map(([id,m])=>({id,name:account(id)?.name||'?',rank:m.rank,contribution:m.contribution,week:m.week===week()?m.weekContribution:0,checked:m.checkin===day(),online:!!online(id),level:account(id)?.profile?.level||1,hero:account(id)?.profile?.hero||'novice'}))
        .sort((a,b)=>S.RANK_ORDER.indexOf(a.rank)-S.RANK_ORDER.indexOf(b.rank)||b.contribution-a.contribution),
      applications:me&&S.RANKS[me.rank].approve?g.applications.map(id=>({id,name:account(id)?.name||'?',level:account(id)?.profile?.level||1})):[],
      log:g.log.slice(-30),me:me?{rank:me.rank,checked:me.checkin===day(),wove:g.lantern?.week===week()&&g.lantern.days[viewer]===day(),woven:g.lantern?.week===week()?g.lantern.by[viewer]||0:0}:null,
      lantern:{threads:g.lantern?.week===week()?g.lantern.threads:{},tier:g.lantern?.week===week()?S.lanternTier(g.lantern.threads):0},
      leaderAway:Math.floor((now()-(account(Object.keys(g.members).find(id=>g.members[id].rank==='leader'))?.lastSeen||now()))/86400000)};}
  function guildList(){return Object.entries(db.guilds).map(([id,g])=>({id,name:g.name,tag:g.tag,emblem:g.emblem,policy:g.policy,minLevel:g.minLevel,level:S.guildLevel(g.exp),members:Object.keys(g.members).length,cap:S.guildCap(S.guildLevel(g.exp))}));}
  const glog=(g,text)=>{g.log.push({at:now(),text});if(g.log.length>100)g.log.splice(0,g.log.length-100);};
  function pushGuild(gid){const g=db.guilds[gid];if(!g)return;for(const id of Object.keys(g.members)){const s=online(id);if(s)send(s,{t:'guild',guild:guildView(gid,id)});}}
  function refreshTag(id){const s=online(id);if(s&&s.channel)broadcast(s.channel,{t:'player',p:pub(s)});}
  function joinGuild(g,gid,id){g.members[id]={rank:'member',joined:now(),contribution:0,weekContribution:0,week:week(),checkin:null};account(id).guild=gid;g.applications=g.applications.filter(x=>x!==id);
    for(const other of Object.values(db.guilds))other.applications=other.applications.filter(x=>x!==id);glog(g,`${account(id).name} gia nhập bang.`);}
  function leaveGuild(id,why){const a=account(id),gid=a.guild,g=db.guilds[gid];if(!g)return;delete g.members[id];a.guild=null;a.leftGuildAt=now();glog(g,`${a.name} ${why}.`);
    if(!Object.keys(g.members).length){delete db.guilds[gid];return;}
    if(!Object.values(g.members).some(m=>m.rank==='leader')){const heir=Object.entries(g.members).sort(([,x],[,y])=>S.RANK_ORDER.indexOf(x.rank)-S.RANK_ORDER.indexOf(y.rank)||y.contribution-x.contribution)[0];heir[1].rank='leader';glog(g,`${account(heir[0]).name} trở thành Bang Chủ.`);}}
  function succession(){
    for(const [gid,g] of Object.entries(db.guilds)){
      const leader=Object.keys(g.members).find(id=>g.members[id].rank==='leader');if(!leader||online(leader))continue;
      const away=(now()-(account(leader)?.lastSeen||now()))/86400000;
      if(away>=S.LIMITS.leaderWarnDays&&!g.warned){g.warned=true;glog(g,`Bang Chủ vắng ${S.LIMITS.leaderWarnDays} ngày; sau ${S.LIMITS.leaderTransferDays} ngày quyền Bang Chủ sẽ chuyển.`);save();}
      if(away<S.LIMITS.leaderTransferDays)continue;
      const active=Object.entries(g.members).filter(([id])=>id!==leader&&now()-(account(id)?.lastSeen||0)<S.LIMITS.leaderWarnDays*86400000)
        .sort(([,x],[,y])=>S.RANK_ORDER.indexOf(x.rank)-S.RANK_ORDER.indexOf(y.rank)||y.contribution-x.contribution);
      if(!active.length)continue;g.members[leader].rank='member';active[0][1].rank='leader';g.warned=false;glog(g,`${account(active[0][0]).name} nhận quyền Bang Chủ (Bang Chủ cũ vắng ${S.LIMITS.leaderTransferDays} ngày).`);save();pushGuild(gid);
    }
  }
  function guildOp(s,m){
    const a=account(s.id),gid=a.guild,g=gid&&db.guilds[gid],me=g?.members[s.id],can=k=>me&&S.RANKS[me.rank][k];
    const level=s.profile.level;
    switch(m.op){
      case 'list':return send(s,{t:'guilds',list:guildList()});
      case 'create':{
        if(g)return err(s,'Bạn đã ở trong một bang.');if(level<S.LIMITS.guildMinLevel)return err(s,`Cần tướng cấp ${S.LIMITS.guildMinLevel} để lập bang.`);
        if(a.leftGuildAt&&now()-a.leftGuildAt<S.LIMITS.guildRejoinMs)return err(s,'Vừa rời bang: chờ 12 giờ.');
        const c=S.checkGuild(m.name,m.tag);if(!c.ok)return err(s,c.error);
        if(Object.values(db.guilds).some(x=>S.fold(x.name)===S.fold(c.name)))return err(s,'Tên bang đã có.');if(Object.values(db.guilds).some(x=>x.tag===c.tag))return err(s,'Thẻ bang đã có.');
        const id=newId(6);db.guilds[id]={name:c.name,tag:c.tag,emblem:S.GUILD_EMBLEMS.includes(m.emblem)?m.emblem:'sword',policy:'approval',minLevel:S.LIMITS.guildMinLevel,notice:'Chào mừng đến với bang!',members:{},applications:[],exp:0,log:[],created:now()};
        joinGuild(db.guilds[id],id,s.id);db.guilds[id].members[s.id].rank='leader';glog(db.guilds[id],`${a.name} lập bang ${c.name}.`);save();pushGuild(id);refreshTag(s.id);return toast(s,`Đã lập bang [${c.tag}] ${c.name}.`);}
      case 'apply':{
        const t=db.guilds[m.id];if(!t)return err(s,'Bang không tồn tại.');if(g)return err(s,'Bạn đã ở trong một bang.');
        if(a.leftGuildAt&&now()-a.leftGuildAt<S.LIMITS.guildRejoinMs)return err(s,'Vừa rời bang: chờ 12 giờ.');
        if(level<t.minLevel)return err(s,`Bang yêu cầu cấp ${t.minLevel}.`);if(t.policy==='closed')return err(s,'Bang đang đóng.');
        if(Object.keys(t.members).length>=S.guildCap(S.guildLevel(t.exp)))return err(s,'Bang đã đủ người.');
        if(t.policy==='open'){joinGuild(t,m.id,s.id);save();pushGuild(m.id);refreshTag(s.id);return toast(s,`Đã vào bang [${t.tag}].`);}
        if(!t.applications.includes(s.id))t.applications.push(s.id);save();pushGuild(m.id);return toast(s,'Đã gửi đơn, chờ bang duyệt.');}
      case 'approve':case 'reject':{
        if(!can('approve'))return err(s,'Bạn không có quyền duyệt.');if(!g.applications.includes(m.id))return err(s,'Đơn không còn.');
        if(m.op==='reject'){g.applications=g.applications.filter(x=>x!==m.id);save();return pushGuild(gid);}
        if(account(m.id).guild)return err(s,'Người này đã vào bang khác.');if(Object.keys(g.members).length>=S.guildCap(S.guildLevel(g.exp)))return err(s,'Bang đã đủ người.');
        joinGuild(g,gid,m.id);save();pushGuild(gid);refreshTag(m.id);const o=online(m.id);if(o)toast(o,`Bạn đã được nhận vào bang [${g.tag}].`);return;}
      case 'leave':{if(!g)return;leaveGuild(s.id,'rời bang');save();pushGuild(gid);send(s,{t:'guild',guild:null});return refreshTag(s.id);}
      case 'kick':{const t=g?.members[m.id];if(!can('kick')||!t||S.RANK_ORDER.indexOf(t.rank)<=S.RANK_ORDER.indexOf(me.rank))return err(s,'Không thể mời người này ra.');
        leaveGuild(m.id,'bị mời ra khỏi bang');save();pushGuild(gid);const o=online(m.id);if(o){send(o,{t:'guild',guild:null});toast(o,`Bạn đã rời bang [${g.tag}].`);}return refreshTag(m.id);}
      case 'promote':case 'demote':{const t=g?.members[m.id];if(!can('promote')||!t||m.id===s.id)return err(s,'Không thể đổi chức vụ.');
        const ranks=S.RANK_ORDER,next=ranks[ranks.indexOf(t.rank)+(m.op==='promote'?-1:1)];
        if(!next||ranks.indexOf(t.rank)<=ranks.indexOf(me.rank)&&!(m.op==='demote'&&me.rank==='leader'))return err(s,'Không thể đổi chức vụ.');
        if(next==='leader'){if(me.rank!=='leader')return err(s,'Chỉ Bang Chủ nhường chức.');me.rank='vice';t.rank='leader';glog(g,`${a.name} nhường Bang Chủ cho ${account(m.id).name}.`);}
        else{const cap=S.LIMITS.officers[next];if(cap&&Object.values(g.members).filter(x=>x.rank===next).length>=cap)return err(s,`Đủ ${cap} ${S.RANKS[next].name}.`);
          if(ranks.indexOf(next)<=ranks.indexOf(me.rank)&&me.rank!=='leader')return err(s,'Không thể thăng ngang chức mình.');t.rank=next;glog(g,`${account(m.id).name} thành ${S.RANKS[next].name}.`);}
        save();return pushGuild(gid);}
      case 'notice':{if(!can('notice'))return err(s,'Bạn không có quyền đổi thông báo.');const c=S.cleanText(m.text,S.LIMITS.guildNotice);if(!c.ok)return err(s,c.error);g.notice=c.text;glog(g,`${a.name} đổi thông báo.`);save();return pushGuild(gid);}
      case 'policy':{if(!can('notice'))return err(s,'Bạn không có quyền.');if(['open','approval','closed'].includes(m.policy))g.policy=m.policy;g.minLevel=Math.max(1,Math.min(500,Math.round(Number(m.minLevel)||g.minLevel)));save();return pushGuild(gid);}
      case 'checkin':{if(!me)return err(s,'Bạn chưa có bang.');if(me.checkin===day())return err(s,'Hôm nay đã điểm danh.');
        me.checkin=day();if(me.week!==week()){me.week=week();me.weekContribution=0;}me.contribution+=S.CHECKIN.contribution;me.weekContribution+=S.CHECKIN.contribution;a.contribution=(a.contribution||0)+S.CHECKIN.contribution;
        const before=S.guildLevel(g.exp);g.exp+=S.CHECKIN.exp;const after=S.guildLevel(g.exp);glog(g,`${a.name} điểm danh (+${S.CHECKIN.exp} kinh nghiệm bang).`);if(after>before)glog(g,`Bang lên cấp ${after}!`);
        save();pushGuild(gid);return toast(s,`Điểm danh: +${S.CHECKIN.contribution} cống hiến.`);}
      case 'weave':{
        if(!me)return err(s,'Bạn chưa có bang.');if(S.zoneAt(geo,s.pos[0],s.pos[1])!=='lantern')return err(s,'Đến chỗ Tơ Đèn cạnh sảnh bang để dệt.');
        if(!S.LANTERN.colors.some(([c])=>c===m.color))return err(s,'Màu sợi không hợp lệ.');
        const L=g.lantern=g.lantern?.week===week()?g.lantern:{week:week(),threads:{},by:{},days:{}};
        if(L.days[s.id]===day())return err(s,'Hôm nay bạn đã dệt một sợi.');if((L.by[s.id]||0)>=S.LIMITS.lanternPerWeek)return err(s,`Mỗi tuần dệt tối đa ${S.LIMITS.lanternPerWeek} sợi.`);
        const before=S.lanternTier(L.threads);L.threads[m.color]=(L.threads[m.color]||0)+1;L.by[s.id]=(L.by[s.id]||0)+1;L.days[s.id]=day();const after=S.lanternTier(L.threads);
        const name=S.LANTERN.colors.find(([c])=>c===m.color)[1];glog(g,`${a.name} dệt ${name}.`);if(after>before)glog(g,`Đèn bang sáng bậc ${after}!`);
        save();pushGuild(gid);return toast(s,`Đã dệt ${name} vào đèn bang.`);}
      case 'info':return send(s,{t:'guild',guild:g?guildView(gid,s.id):null});
      default:return err(s,'Lệnh bang không hợp lệ.');
    }
  }

  // ---- Messages ----
  function handle(s,m){
    const a=account(s.id);
    switch(m.t){
      case 'move':{s.target=S.clampTarget(geo,m.to);return;}
      case 'profile':{s.profile=S.cleanProfile(m.p);a.profile=s.profile;save();return broadcast(s.channel,{t:'player',p:pub(s)},{except:s.id});}
      case 'channel':{const n=Math.max(1,Math.min(99,Math.round(Number(m.n)||1)));if(n===s.channel)return;if((channels.get(n)?.size||0)>=S.LIMITS.channelCap)return err(s,'Kênh đã đầy.');return joinChannel(s,n);}
      case 'goto':{const f=online(m.id);if(!f||!a.friends?.includes(m.id))return err(s,'Bạn bè không trực tuyến.');if((channels.get(f.channel)?.size||0)>=S.LIMITS.channelCap&&f.channel!==s.channel)return err(s,'Kênh của bạn ấy đã đầy.');
        const spot=[f.pos[0]+40,f.pos[1]+10];const at=S.walkable(geo,spot[0],spot[1])?spot:f.pos;if(f.channel===s.channel){s.pos=[...at];s.target=[...at];return;}return joinChannel(s,f.channel,at);}
      case 'say':{
        const t=now();if(s.muteUntil>t)return err(s,'Bạn đang bị tạm khóa chat vài giây.');
        s.chatTimes=(s.chatTimes||[]).filter(x=>t-x<S.LIMITS.chatGapMs*S.LIMITS.chatBurst);
        if(s.chatTimes.length>=S.LIMITS.chatBurst||s.chatTimes.length&&t-s.chatTimes.at(-1)<S.LIMITS.chatGapMs/2)return err(s,'Nhắn chậm lại một chút.');
        const c=S.cleanText(m.text);if(!c.ok)return err(s,c.error);
        s.repeat=c.text===s.lastText?(s.repeat||1)+1:1;s.lastText=c.text;if(s.repeat>=S.LIMITS.repeat){s.muteUntil=t+S.LIMITS.repeatMuteMs;return err(s,'Lặp lại quá nhiều: tạm khóa chat 30 giây.');}
        s.chatTimes.push(t);(s.history=s.history||[]).push({at:t,ch:m.ch,text:c.text});if(s.history.length>20)s.history.shift();
        const g=a.guild&&db.guilds[a.guild],msg={t:'say',from:s.id,name:a.name,tag:g?.tag||'',ch:m.ch,text:c.text,at:t};
        if(m.ch==='guild'){if(!g)return err(s,'Bạn chưa có bang.');for(const id of Object.keys(g.members)){const o=online(id);if(o)send(o,msg);}return;}
        if(t-a.created<S.LIMITS.newAccountMs&&m.ch==='whisper'&&!a.friends?.includes(m.to))return err(s,'Tài khoản mới chỉ nhắn riêng với bạn bè.');
        if(m.ch==='whisper'){const o=online(m.to);if(!o)return err(s,'Người này không trực tuyến.');if(blocked(s.id,m.to))return err(s,'Không thể nhắn cho người này.');
          if(!a.friends?.includes(m.to)&&(o.channel!==s.channel||!S.near(o.pos,s.pos,S.LIMITS.channelCap*20)))return err(s,'Chỉ nhắn riêng với bạn bè hoặc người ở gần.');
          const w={...msg,to:m.to,toName:account(m.to).name};send(o,w);return send(s,w);}
        return broadcast(s.channel,{...msg,ch:'area'},{skipBlockedOf:s.id});}
      case 'emote':{if(!S.EMOTES.some(e=>e[0]===m.id))return;const t=now();if(t-(s.lastEmote||0)<1000)return;s.lastEmote=t;return broadcast(s.channel,{t:'emote',from:s.id,id:m.id},{skipBlockedOf:s.id});}
      case 'friend':{
        const o=account(m.id);if(!o||m.id===s.id)return err(s,'Người chơi không tồn tại.');
        for(const x of [a,o]){x.friends??=[];x.incoming??=[];x.outgoing??=[];}
        if(m.op==='request'){
          if(a.friends.includes(m.id))return err(s,'Đã là bạn bè.');if(blocked(s.id,m.id))return err(s,'Không thể kết bạn với người này.');
          if(a.friends.length>=S.LIMITS.friends||o.friends.length>=S.LIMITS.friends)return err(s,'Danh sách bạn bè đã đủ 50.');
          const other=online(m.id),sameGuild=a.guild&&a.guild===o.guild;
          if(!sameGuild&&!(other&&other.channel===s.channel&&S.near(other.pos,s.pos)))return err(s,'Đứng gần người ấy hơn để kết bạn.');
          if(a.incoming.includes(m.id)){m.op='accept';}else{if(!hourly(a,'friendHour',S.LIMITS.friendInvitesPerHour))return err(s,'Đã gửi nhiều lời mời, thử lại sau.');
            if(!a.outgoing.includes(m.id))a.outgoing.push(m.id);if(!o.incoming.includes(s.id))o.incoming.push(s.id);save();pushFriends(s.id);pushFriends(m.id);
            if(other)send(other,{t:'friendReq',from:s.id,name:a.name});return toast(s,`Đã gửi lời mời kết bạn tới ${o.name}.`);}
        }
        if(m.op==='accept'){if(!a.incoming.includes(m.id))return err(s,'Lời mời không còn.');a.incoming=a.incoming.filter(x=>x!==m.id);o.outgoing=o.outgoing.filter(x=>x!==s.id);
          a.outgoing=a.outgoing.filter(x=>x!==m.id);o.incoming=o.incoming.filter(x=>x!==s.id);
          if(!a.friends.includes(m.id))a.friends.push(m.id);if(!o.friends.includes(s.id))o.friends.push(s.id);save();pushFriends(s.id);pushFriends(m.id);
          const other=online(m.id);if(other)toast(other,`${a.name} đã đồng ý kết bạn.`);return toast(s,`Bạn và ${o.name} đã là bạn bè.`);}
        if(m.op==='decline'){a.incoming=a.incoming.filter(x=>x!==m.id);o.outgoing=o.outgoing.filter(x=>x!==s.id);save();return pushFriends(s.id),pushFriends(m.id);}
        if(m.op==='cancel'){a.outgoing=a.outgoing.filter(x=>x!==m.id);o.incoming=o.incoming.filter(x=>x!==s.id);save();return pushFriends(s.id),pushFriends(m.id);}
        if(m.op==='remove'){a.friends=a.friends.filter(x=>x!==m.id);o.friends=o.friends.filter(x=>x!==s.id);save();return pushFriends(s.id),pushFriends(m.id);}
        return;}
      case 'heart':{if(!a.friends?.includes(m.id))return err(s,'Chỉ tặng tim cho bạn bè.');a.hearts=a.hearts?.day===day()?a.hearts:{day:day(),ids:[]};if(a.hearts.ids.includes(m.id))return err(s,'Hôm nay đã tặng tim bạn này.');
        a.hearts.ids.push(m.id);const o=account(m.id);o.heartsIn=o.heartsIn?.day===day()?o.heartsIn:{day:day(),n:0};if(o.heartsIn.n<S.LIMITS.heartsPerDay){o.heartsIn.n++;o.friendPoints=(o.friendPoints||0)+1;}
        a.friendPoints=(a.friendPoints||0)+(a.hearts.ids.length<=S.LIMITS.heartsPerDay?1:0);save();pushFriends(s.id);pushFriends(m.id);const other=online(m.id);if(other)toast(other,`${a.name} tặng bạn một tim.`);return;}
      case 'block':{a.blocks??=[];if(m.on){if(!a.blocks.includes(m.id))a.blocks.push(m.id);a.friends=(a.friends||[]).filter(x=>x!==m.id);const o=account(m.id);if(o)o.friends=(o.friends||[]).filter(x=>x!==s.id);}else a.blocks=a.blocks.filter(x=>x!==m.id);
        save();pushFriends(s.id);pushFriends(m.id);return toast(s,m.on?'Đã chặn. Bạn sẽ không thấy tin nhắn của người này.':'Đã bỏ chặn.');}
      case 'report':{const o=online(m.id);db.reports.push({at:now(),by:s.id,who:m.id,reason:String(m.reason||'').slice(0,40),recent:o?.history?.slice(-20)||[]});if(db.reports.length>500)db.reports.shift();save();return toast(s,'Đã gửi báo cáo. Cảm ơn bạn.');}
      case 'duel':{
        const o=online(m.id);
        if(m.op==='invite'){if(!o)return err(s,'Người này không trực tuyến.');if(blocked(s.id,m.id))return err(s,'Không thể mời người này.');if(!hourly(a,'duelHour',S.LIMITS.duelInvitesPerHour))return err(s,'Đã mời nhiều trận, thử lại sau.');
          duels.set(s.id+'>'+m.id,now());send(o,{t:'duelInvite',from:s.id,name:a.name,p:s.profile});return toast(s,`Đã mời ${account(m.id).name} giao hữu, chờ trả lời…`);}
        const key=m.id+'>'+s.id,at=duels.get(key);duels.delete(key);
        if(!at||now()-at>S.LIMITS.duelReplyMs)return err(s,'Lời mời đã hết hạn.');
        if(m.op==='decline'){if(o)toast(o,`${a.name} từ chối giao hữu.`);return;}
        if(m.op==='accept'){if(!o)return err(s,'Người mời đã rời đi.');return startDuel(o,s);}
        return;}
      case 'ring':{s.ringReady=!!m.ready&&S.zoneAt(geo,s.pos[0],s.pos[1])==='ring';
        if(!s.ringReady)return;const other=inChannel(s.channel).find(o=>o.id!==s.id&&o.ringReady&&S.zoneAt(geo,o.pos[0],o.pos[1])==='ring'&&!blocked(o.id,s.id));
        if(other){s.ringReady=other.ringReady=false;startDuel(other,s);}else toast(s,'Đã sẵn sàng trên Sàn Giao Hữu. Chờ một người nữa bước vào và sẵn sàng.');return;}
      case 'guild':return guildOp(s,m);
      case 'friends':return pushFriends(s.id);
      case 'ping':return send(s,{t:'pong',at:now()});
      default:return err(s,'Lệnh không hợp lệ.');
    }
  }
  // Until the match server exists each player fights an AI copy of the other's hero with normalized stats
  // (the profile is unverified); no result is announced.
  function startDuel(a,b){const seed=crypto.randomInt(1,2**31);const card=s=>({id:s.id,name:account(s.id).name,hero:s.profile.hero,look:s.profile.look});
    const label='Giao hữu với bản sao · AI · Không thưởng';send(a,{t:'duelStart',seed,opponent:card(b),label});send(b,{t:'duelStart',seed,opponent:card(a),label});
    broadcast(a.channel,{t:'say',from:'system',name:'Hệ thống',ch:'system',text:`${account(a.id).name} và ${account(b.id).name} vào trận giao hữu!`,at:now()});}

  // ---- Connection: hello → (register) → welcome ----
  function welcome(s){
    const a=account(s.id);a.lastSeen=now();sessions.set(s.id,s);if(a.guild&&db.guilds[a.guild]?.members[s.id]?.rank==='leader')db.guilds[a.guild].warned=false;
    send(s,{t:'welcome',you:{id:s.id,name:a.name,created:a.created},map:S.MAP,friends:friendView(s.id),guild:a.guild?guildView(a.guild,s.id):null});
    joinChannel(s,pickChannel());
    for(const f of a.friends||[]){pushFriends(f);}
  }
  function onMessage(s,raw){
    let m;try{m=JSON.parse(raw);}catch{return;}if(!m||typeof m.t!=='string')return;
    const t=now();s.rate=(s.rate||[]).filter(x=>t-x<1000);if(s.rate.length>=30)return;s.rate.push(t);
    if(!s.id){
      if(m.t==='hello'){
        s.profile=S.cleanProfile(m.p);
        const a=m.id&&account(m.id);if(a&&a.token&&a.token===hash(m.token||'')){if(online(m.id))online(m.id).ws.close(4000,'Đăng nhập ở nơi khác');s.id=m.id;a.profile=s.profile;return welcome(s);}
        return send(s,{t:'needName'});
      }
      if(m.t==='register'){
        const c=S.checkName(m.name);if(!c.ok)return err(s,c.error,'register');
        if(Object.values(db.accounts).some(a=>S.fold(a.name)===S.fold(c.name)))return err(s,'Tên đã có người dùng.','register');
        if(!hourly(ipLimits[s.ip]??={},'register',registerPerHour))return err(s,'Đã tạo nhiều tài khoản từ địa chỉ này, thử lại sau.','register');
        // The server issues the token (stored hashed, revocable by deleting it); the device keeps it.
        const id=newId(8),token=newId(24);db.accounts[id]={name:c.name,token:hash(token),created:now(),profile:s.profile||S.cleanProfile(m.p),friends:[],incoming:[],outgoing:[],blocks:[],guild:null,contribution:0};save();
        s.id=id;send(s,{t:'registered',id,token});return welcome(s);
      }
      return;
    }
    try{handle(s,m);}catch(e){console.error(e);err(s,'Lỗi máy chủ.');}
  }
  function onClose(s){
    if(!s.id||sessions.get(s.id)!==s)return;sessions.delete(s.id);const a=account(s.id);if(a)a.lastSeen=now();
    if(s.channel){channels.get(s.channel)?.delete(s.id);broadcast(s.channel,{t:'leave',id:s.id});}
    for(const f of a?.friends||[])pushFriends(f);save();
  }

  // ---- Movement tick: the server moves everyone and sends positions 10 times a second ----
  let posSeq=0,lastSuccession=0;
  const timer=setInterval(()=>{
    if(now()-lastSuccession>3600000){lastSuccession=now();succession();}
    const dt=tickMs/1000;
    for(const [n,ids] of channels){const moved=[];
      for(const id of ids){const s=sessions.get(id);if(!s)continue;const r=S.step(geo,s.pos,s.target,dt,s.side);s.side=r.side;
        if(r.pos[0]!==s.pos[0]||r.pos[1]!==s.pos[1]){s.pos=r.pos;moved.push([id,Math.round(r.pos[0]),Math.round(r.pos[1])]);}
        if(r.blocked)s.target=[...s.pos];}
      if(moved.length)broadcast(n,{t:'pos',seq:++posSeq,p:moved});}
    const t=now();for(const [k,at] of duels)if(t-at>S.LIMITS.duelReplyMs)duels.delete(k);
  },tickMs);

  const server=http.createServer((req,res)=>{
    if(req.url.startsWith('/social/health')){res.writeHead(200,{'content-type':'application/json','access-control-allow-origin':'*'});return res.end(JSON.stringify({ok:true,version:S.VERSION,online:sessions.size,channels:channelCounts()}));}
    res.writeHead(404);res.end();
  });
  // Web clients must come from an allowed origin (SOCIAL_ORIGINS, comma separated; dev allows any).
  const origins=(process.env.SOCIAL_ORIGINS||'').split(',').map(x=>x.trim()).filter(Boolean);
  const wss=new WebSocketServer({server,path:'/social',maxPayload:4096,verifyClient:({origin})=>!origins.length||!origin||origins.includes(origin)});
  wss.on('connection',(ws,req)=>{const s={ws,id:null,profile:S.cleanProfile({}),ip:String(req.headers['cf-connecting-ip']||req.socket.remoteAddress||'')};ws.alive=true;
    ws.on('pong',()=>{ws.alive=true;});ws.on('message',raw=>onMessage(s,String(raw)));ws.on('close',()=>onClose(s));ws.on('error',()=>{});});
  // Heartbeat: a connection that misses a ping for 30 seconds is closed.
  const beat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;try{ws.ping();}catch{}}},30000);
  return {listen:()=>new Promise(r=>server.listen(port,host,()=>r(server.address().port))),close:()=>new Promise(r=>{clearInterval(timer);clearInterval(beat);flush();for(const c of wss.clients)c.terminate();wss.close();server.close(()=>r());}),db:()=>db,setGeo:g=>{geo=g;}};
}
module.exports={createServer};
if(require.main===module){
  const port=Number(process.argv[2])||Number(process.env.PORT)||8091;
  const app=createServer({port,host:process.env.HOST||'0.0.0.0',dataFile:process.argv[3]||process.env.SOCIAL_DATA||path.join(__dirname,'data/social.json')});
  app.listen().then(p=>console.log(`Gemwoven social server on :${p}/social`));
  for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>app.close().then(()=>process.exit(0)));
}
