/* Social protocol (docs/GAME_DESIGN.md §14): the rules the plaza client and the social server share —
 * map geometry and movement, limits, chat checks, guild ranks and levels, message names. The server
 * runs these checks with authority; the client runs the same ones to answer at once. No I/O here.
 * Map units are pixels of the painted plaza (assets/gemwoven/plaza/map.webp, 1024×1536).
 */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenSocial=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const VERSION=1;
  const MAP={width:1024,height:1536,spawn:[512,1400],speed:230,interact:170,view:30};
  const LIMITS={name:[3,14],chat:120,chatGapMs:2000,chatBurst:3,repeat:3,repeatMuteMs:30000,channelCap:40,friends:50,
    friendInvitesPerHour:10,duelInvitesPerHour:20,duelReplyMs:20000,movesPerSecond:10,newAccountMs:24*3600000,
    guildName:[3,16],guildTag:[2,4],guildNotice:160,guildBase:20,guildPerLevel:2,guildRejoinMs:12*3600000,guildMinLevel:20,
    officers:{vice:1,elder:2},heartsPerDay:30,leaderWarnDays:7,leaderTransferDays:14,lanternPerWeek:5};
  const CHANNELS=['area','guild','whisper','system'];
  const EMOTES=[['wave','Vẫy tay','👋'],['laugh','Cười','😄'],['love','Thích','❤️'],['cheer','Cổ vũ','🎉'],['think','Suy nghĩ','🤔'],['cry','Buồn','😢'],['angry','Giận','😠'],['duel','Khiêu chiến','⚔️']];
  // Guild ranks, highest first; what each may do.
  const RANKS={leader:{name:'Bang Chủ',approve:true,kick:true,promote:true,notice:true},vice:{name:'Phó Bang',approve:true,kick:true,promote:true,notice:true},
    elder:{name:'Trưởng Lão',approve:true,kick:false,promote:false,notice:false},member:{name:'Thành Viên',approve:false,kick:false,promote:false,notice:false}};
  const RANK_ORDER=['leader','vice','elder','member'];
  // Total guild experience at which each level starts (level n+1 needs 1.000×n more than level n; Codex round 3).
  const GUILD_EXP=[0,1000,3000,6000,10000,15000,21000,28000,36000,45000];
  const GUILD_EMBLEMS=['sword','shield','crown','gem','moon','sun','leaf','flame','wave','star','owl','fox'];
  const CHECKIN={contribution:10,exp:10};
  // Dệt Đèn Bang (weekly guild activity): each member picks one thread a day at the weaver, up to five a
  // week; the guild's lantern reaches tiers at 5/15/25 threads when every colour has its share.
  const LANTERN={colors:[['red','Sợi Hồng Ngọc','#e0605a'],['blue','Sợi Lam Ngọc','#5a8fe0'],['gold','Sợi Hoàng Ngọc','#e0b04a']],tiers:[5,15,25]};
  function lanternTier(threads){const total=LANTERN.colors.reduce((n,[c])=>n+(threads?.[c]||0),0);let tier=0;
    for(const [i,need] of LANTERN.tiers.entries())if(total>=need&&LANTERN.colors.every(([c])=>(threads?.[c]||0)>=i*2+1))tier=i+1;return tier;}
  function guildLevel(exp){let level=1;while(level<10&&exp>=GUILD_EXP[level])level++;return level;}
  function guildCap(level){return LIMITS.guildBase+LIMITS.guildPerLevel*(Math.max(1,Math.min(10,level))-1);}

  // ---- Text ----
  const fold=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase();
  // Whole words only, matched with their tone marks: folding Vietnamese would hit "các", "du lịch", "lon bia",
  // "đeo". Ascii shorthand is matched as typed (lower case).
  const BANNED=new Set(['địt','đụ','lồn','cặc','đéo','đm','đmm','đcm','dcm','dm','dmm','vcl','vkl','clm','cmm','fuck','shit','bitch','cunt']);
  const banned=w=>BANNED.has(String(w).normalize('NFC').toLowerCase());
  function cleanText(raw,max=LIMITS.chat){
    const text=String(raw??'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
    if(!text)return {ok:false,error:'Tin nhắn trống.'};
    if(text.length>max)return {ok:false,error:`Tối đa ${max} ký tự.`};
    const masked=text.replace(/[\p{L}\p{N}]+/gu,w=>banned(w)?'*'.repeat(w.length):w);
    return {ok:true,text:masked};
  }
  function checkName(raw){
    const name=String(raw??'').trim().replace(/\s+/g,' ');
    if(name.length<LIMITS.name[0]||name.length>LIMITS.name[1])return {ok:false,error:`Tên ${LIMITS.name[0]}–${LIMITS.name[1]} ký tự.`};
    if(!/^[\p{L}\p{N} _.-]+$/u.test(name))return {ok:false,error:'Tên chỉ gồm chữ, số, khoảng trắng, _ . -'};
    if(name.split(/[^\p{L}\p{N}]+/u).some(banned))return {ok:false,error:'Tên không phù hợp.'};
    if(/^(npc|gm|admin|he thong|system)\b/.test(fold(name)))return {ok:false,error:'Tên này dành cho hệ thống.'};
    return {ok:true,name};
  }
  function checkGuild(name,tag){
    const n=checkName(name);if(!n.ok&&!/ký tự/.test(n.error))return n;
    const clean=String(name??'').trim().replace(/\s+/g,' ');
    if(clean.length<LIMITS.guildName[0]||clean.length>LIMITS.guildName[1])return {ok:false,error:`Tên bang ${LIMITS.guildName[0]}–${LIMITS.guildName[1]} ký tự.`};
    const t=String(tag??'').trim().toUpperCase();
    if(!new RegExp(`^[A-Z0-9]{${LIMITS.guildTag[0]},${LIMITS.guildTag[1]}}$`).test(t))return {ok:false,error:`Thẻ bang ${LIMITS.guildTag[0]}–${LIMITS.guildTag[1]} chữ in hoa hoặc số.`};
    if(banned(t))return {ok:false,error:'Thẻ bang không phù hợp.'};
    return {ok:true,name:clean,tag:t};
  }

  // ---- Geometry: a walkable polygon minus round obstacles ----
  const DEFAULT_GEO={walk:[[60,260],[964,260],[964,1500],[60,1500]],blocks:[]};
  function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;}return hit;}
  function walkable(geo,x,y){geo=geo||DEFAULT_GEO;if(!inside(geo.walk,x,y))return false;for(const b of geo.blocks||[]){const dx=(x-b[0])/(b[2]),dy=(y-b[1])/(b[3]??b[2]);if(dx*dx+dy*dy<1)return false;}return true;}
  // One movement step toward a target, at most speed×dt. A blocked step turns aside a little more each try
  // (20°, 40° … 100°, either side, the side of the last turn first), so heroes walk round the fountain
  // and the notice board instead of stopping; `side` carries that choice to the next step.
  function step(geo,from,target,dt,side=0){
    const [x,y]=from,dx=target[0]-x,dy=target[1]-y,dist=Math.hypot(dx,dy),max=MAP.speed*dt;
    if(dist<.5)return {pos:[x,y],arrived:true,side:0};
    const len=Math.min(max,dist),a0=Math.atan2(dy,dx);
    if(walkable(geo,x+Math.cos(a0)*len,y+Math.sin(a0)*len))return {pos:[x+Math.cos(a0)*len,y+Math.sin(a0)*len],arrived:len>=dist,side:0};
    const order=side>=0?[1,-1]:[-1,1];
    for(let turn=1;turn<=5;turn++)for(const sign of order){const a=a0+sign*turn*Math.PI/9,nx=x+Math.cos(a)*len,ny=y+Math.sin(a)*len;if(walkable(geo,nx,ny))return {pos:[nx,ny],arrived:false,side:sign};}
    return {pos:[x,y],arrived:true,blocked:true,side:0};
  }
  function clampTarget(geo,t){const x=Math.max(0,Math.min(MAP.width,Number(t?.[0])||0)),y=Math.max(0,Math.min(MAP.height,Number(t?.[1])||0));return [Math.round(x),Math.round(y)];}
  const near=(a,b,r=MAP.interact)=>Math.hypot(a[0]-b[0],a[1]-b[1])<=r;
  function zoneAt(geo,x,y){for(const z of geo?.zones||[]){if(Math.hypot(x-z.x,y-z.y)<=z.r)return z.id;}return null;}

  // ---- Profile shown to others (unverified until the account server signs it) ----
  function cleanProfile(p){
    const hero=typeof p?.hero==='string'&&/^[a-z]{2,12}$/.test(p.hero)?p.hero:'novice';
    const num=(v,lo,hi)=>Math.max(lo,Math.min(hi,Math.round(Number(v)||lo)));
    return {hero,look:num(p?.look,1,3),level:num(p?.level,1,500),stars:num(p?.stars,1,6),power:num(p?.power,0,1e9),
      title:typeof p?.title==='string'?p.title.slice(0,24):'',titleTier:num(p?.titleTier,0,5),frame:typeof p?.frame==='string'?p.frame.slice(0,24):''};
  }
  return {VERSION,MAP,LIMITS,CHANNELS,EMOTES,RANKS,RANK_ORDER,GUILD_EXP,GUILD_EMBLEMS,CHECKIN,LANTERN,lanternTier,guildLevel,guildCap,
    fold,cleanText,checkName,checkGuild,DEFAULT_GEO,inside,walkable,step,clampTarget,near,zoneAt,cleanProfile};
});
