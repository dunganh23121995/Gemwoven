/* Deterministic encounter state; no DOM, clocks, randomness, rewards or storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenBossTactics=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function create(def,{rank=0,heroMax=1000,bossMax=1000,tier='boss',variant=0,skills=null}={}){
    return {id:def.id,tier,variant,own:tier==='boss'?null:skills,rank:clamp(Math.floor(rank),0,4),heroMax,bossMax,phase:1,turn:0,cast:0,stacks:0,gauge:0,enraged:false,ultTurn:-6,ward:tier==='boss'&&def.mechanic==='shell'?Math.round(bossMax*.12):0,adds:[],addHp:0,addMax:0,addCount:0,addLock:0,channel:null,cleanseTiles:0,vulnerable:0,events:[]};
  }
  const resist=t=>[0,.35,.5,.65,.8][t.rank];
  // Summoned guards: each with ADD_HP of the boss's health, each striking for ADD_POWER of a boss blow every
  // turn; they stand in front of the boss until they fall, and those still standing add up (MAX_ADDS).
  const MAX_ADDS=6,ADD_HP=.08,ADD_POWER=.25;
  // The pooled view of the guards (addHp, addMax, addCount) that the HUD and older checks read.
  function syncAdds(t){t.addCount=t.adds.length;t.addHp=t.adds.reduce((a,m)=>a+Math.max(0,m.hp),0);t.addMax=t.adds.reduce((a,m)=>a+m.max,0);}
  function collect(t,def,type){
    if(type!==def.tile)return;
    t.cleanseTiles++;if(t.channel)t.channel.tiles++;
    if(t.cleanseTiles>=6){t.cleanseTiles-=6;t.stacks=Math.max(0,t.stacks-1);t.gauge=Math.max(0,t.gauge-12);}
  }
  function incoming(t,def,amount){
    let left=Math.max(0,amount)*(t.vulnerable>0?1.15+t.rank*.04:1),absorbed=0;
    // Summoned guards stand in front of the boss and its shell: every blow lands on the front one, what is left
    // of it on the next, and only once all have fallen does the rest reach the boss.
    if(t.adds?.length&&t.addHp>0){
      while(left>0&&t.adds.length){const front=t.adds[0],taken=Math.min(front.hp,left);front.hp-=taken;left-=taken;absorbed+=taken;if(front.hp<=.001)t.adds.shift();}
      if(!t.adds.length){if(t.rank===4)t.addLock=3;t.vulnerable=Math.max(t.vulnerable,2);}
      syncAdds(t);
    }else if(t.addHp>0){const taken=Math.min(t.addHp,left);t.addHp-=taken;left-=taken;absorbed+=taken;if(t.addHp<=.001){t.addHp=0;t.addCount=0;if(t.rank===4)t.addLock=3;t.vulnerable=Math.max(t.vulnerable,2);}}
    if(t.ward>0){const multiplier=def.mechanic==='shell'?1+t.rank*.3:1,used=Math.min(left,t.ward/multiplier);t.ward=Math.max(0,t.ward-used*multiplier);left-=used;absorbed+=used;if(t.ward===0&&def.mechanic==='shell')t.vulnerable=t.rank===4?3:2;}
    if(t.channel)t.channel.damage+=left;
    return {amount:Math.max(0,Math.round(left)),absorbed:Math.round(absorbed)};
  }
  function effects(t,def,skill){
    const r=resist(t),scale=t.tier==='boss'?1:t.tier==='elite'?.65:.4,events=[];
    for(const e of skill.effects){
      if(e.type==='hit'||e.type==='burst')events.push({...e,power:e.power*(e.type==='burst'?1+t.stacks*.12*(1-r):1)*scale*(t.turn>18&&t.tier==='boss'?1+Math.min(.6,(t.turn-18)*.05):1)});
      if(e.type==='stack')t.stacks=Math.min(t.tier==='normal'?2:5,t.stacks+e.count);
      if(e.type==='ward')t.ward=Math.min(t.bossMax*.18,t.ward+t.bossMax*e.pct*scale*(1-r*.35));
      if(e.type==='heal')events.push({type:'heal',pct:e.pct*scale*(1-r)});
      if(e.type==='drain')events.push({type:'drain',amount:Math.ceil(e.amount*scale*(1-r))});
      if(e.type==='shatter')events.push({type:'shatter',fraction:def.mechanic==='heat'&&t.rank===4?0:e.fraction*(1-r)});
      if(e.type==='status')events.push({...e});
      // Each summon adds its guards to those still standing (at most MAX_ADDS), each with its own health.
      if(e.type==='adds'&&t.tier==='boss'&&t.addLock===0){
        t.adds=t.adds||[];const each=t.bossMax*ADD_HP*(1-r*.25);
        for(let k=0;k<(e.count||2)&&t.adds.length<MAX_ADDS;k++)t.adds.push({hp:each,max:each});
        syncAdds(t);
      }
    }
    return events;
  }
  function nextSkill(t,def,atTurn=t.turn+1){
    if(t.channel)return t.channel.skill;
    if(t.tier==='normal')return atTurn%3===0?(t.own?.[0]||def.skills[[0,1,3][t.variant%3]]):{name:'Đòn đánh thường',effects:[{type:'hit',power:1.4}]};
    if(t.tier==='elite')return t.own?t.own[t.cast%t.own.length]:def.skills[[0,1,3,4][(t.cast+t.variant)%4]];
    // A full rage gauge is answered with the ultimate, whatever the phase's rotation holds.
    if(t.enraged)return def.skills.find(x=>x.ult)||def.skills[5];
    const cycle=t.phase===1?[0,1,2,0,1]:t.phase===2?[3,2,4,0,1]:[5,3,4,5,2,3];
    return def.skills[cycle[t.cast%cycle.length]];
  }
  function forecast(t,def){
    const skill=nextSkill(t,def);
    return {name:t.channel?skill.name+' · Sắp giáng':skill.name,channel:!!t.channel,description:t.channel?'Phá niệm: gây 6% HP boss hoặc ghép 6 ngọc '+['Kiếm','Tim','Ngọc','Tuyết','Khiên'][def.tile]+' trong lượt này.':skill.description||'Tấn công cơ bản',phase:t.phase};
  }
  function advance(t,def,hpRatio,{skipAction=false}={}){
    if(!Number.isFinite(hpRatio)||hpRatio<=0)return [];
    t.events=[];t.turn++;
    const phase=t.tier==='boss'?(hpRatio<=.35?3:hpRatio<=.7?2:1):1;
    if(phase>t.phase){t.phase=phase;t.stacks=Math.min(5,t.stacks+phase-1);t.gauge=Math.min(100,t.gauge+10);t.cast=0;t.events.push({type:'phase',phase});}
    if(t.vulnerable>0)t.vulnerable--;if(t.addLock>0)t.addLock--;
    const r=resist(t),scale=t.tier==='boss'?1:t.tier==='elite'?.4:.15;
    if(t.tier==='boss'||t.tier==='elite'&&t.turn%2===0)t.stacks=Math.min(5,t.stacks+1);
    if(t.rank===4&&t.turn%3===0)t.stacks=Math.max(0,t.stacks-1);
    if(t.stacks&&scale)t.events.push({type:'hazard',amount:Math.ceil(t.heroMax*def.tick*t.stacks*(1-r)*scale)});
    t.gauge=clamp(t.gauge+(8+t.phase*2+t.addCount*3)*(1-r),0,100);
    if(t.gauge>=100){t.enraged=t.tier==='boss'&&t.turn-t.ultTurn>=6;t.events.push({type:'hazard',amount:Math.ceil(t.heroMax*.05*(1-r)*scale),overload:true});t.gauge=35;t.stacks=Math.min(t.tier==='normal'?2:5,t.stacks+2);}
    if(['growth','souls','poison','tide'].includes(def.mechanic)&&scale)t.events.push({type:'heal',pct:(t.stacks*.002+t.addCount*.002)*(1-r)*scale});
    if(['frost','time','storm'].includes(def.mechanic)&&t.stacks&&scale)t.events.push({type:'drain',amount:Math.ceil(t.stacks*2*(1-r)*scale)});
    if(t.addHp>0)t.events.push({type:'hit',power:ADD_POWER*t.addCount*(1-r),addAttack:true});
    if(skipAction)return t.events;
    const skill=nextSkill(t,def,t.turn);
    if(!t.channel){t.enraged=false;if(skill.ult)t.ultTurn=t.turn;}
    if(t.channel){
      const channel=t.channel;t.channel=null;
      if(channel.damage>=t.bossMax*.06||channel.tiles>=6){t.vulnerable=t.rank===4?3:2;t.stacks=Math.max(0,t.stacks-2);t.gauge=Math.max(0,t.gauge-35);if(t.rank===4&&def.mechanic==='tide')t.ward=0;t.events.push({type:'interrupt',name:skill.name});}
      else t.events.push({type:'cast',name:skill.name},...effects(t,def,skill));
      t.cast++;
    }else if(skill.channel&&t.tier==='boss'){
      t.channel={skill,damage:0,tiles:0};t.events.push({type:'windup',name:skill.name});
    }else{t.events.push({type:'cast',name:skill.name},...effects(t,def,skill));t.cast++;}
    return t.events;
  }
  // Chapter bosses 1-14 (skills with a kind, cast when their rage fills): each cast picks the skill that
  // fits the fight, by its kind. s: {hpRatio, armor (boss), heroHpRatio, heroEnergy, heroArmorRatio,
  // heroDot (a burn or poison of the boss still on the hero), statuses (the boss's own), history (names
  // cast so far, oldest first)}. The kit goes round: a skill is cast again only once every other one has
  // been (chooseSkill), the order following the fight. Ties keep the kit's order.
  function skillScore(skill,s){
    const k=skill.kind,h=s.history||[],used=h.includes(skill.name),since=used?h.length-1-h.lastIndexOf(skill.name):Infinity,ultSince=(()=>{let n=0;for(let i=h.length-1;i>=0;i--){if(s.ults?.includes(h[i]))break;n++;}return n;})();
    if(skill.ult){
      // The finisher closes each round of the kit: from the third cast on once the boss is hurt (60% HP)
      // or the hero is low, by the fourth cast anyway, and never within three casts of the last one.
      if(h.length<2||(used&&ultSince<3))return -1;
      return s.hpRatio<=.6||s.heroHpRatio<=.35||h.length>=3?100:-1;
    }
    let score=40;
    if(k==='guard')score=s.armor>0?-1:s.hpRatio<.85?60:25;
    else if(k==='heal')score=s.hpRatio<=.5?85:s.hpRatio<=.75?50:s.armor>0||!skill.shield?5:20;
    else if(k==='drain')score=s.heroEnergy>=60?75:s.heroEnergy>=35?45:20;
    else if(k==='burn'||k==='poison')score=s.heroDot?10:55;
    else if(k==='execute')score=s.heroHpRatio<(skill.threshold||.4)?90:25;
    else if(k==='lifesteal')score=s.hpRatio<.7?60:35;
    else if(k==='pierce')score=(s.heroArmorRatio||0)>.05?45+Math.min(30,s.heroArmorRatio*100):25;
    else if(k==='charge')score=h.length&&s.charges?.includes(h[h.length-1])?-1:45;
    // After a charge the next blow is the heavy one.
    if(h.length&&s.charges?.includes(h[h.length-1])&&skill.power>=1)score+=30;
    if(score<0)return score;
    if(!used)score+=8;
    if(since===0)score=Math.min(0,score-60);else if(since===1)score-=12;
    return score;
  }
  function chooseSkill(skills,s={}){
    const ctx={...s,ults:skills.filter(x=>x.ult).map(x=>x.name),charges:skills.filter(x=>x.kind==='charge').map(x=>x.name)};
    // The kit's skills already cast this round (a round ends when all of them have been).
    const plain=skills.filter(x=>!x.ult);let seen=new Set();
    for(const name of s.history||[]){if(ctx.ults.includes(name))continue;seen.add(name);if(plain.every(x=>seen.has(x.name)))seen=new Set();}
    const pick=list=>{let best=null,top=-Infinity;for(const skill of list){const v=skillScore(skill,ctx);if(v>top){top=v;best=skill;}}return top>=0?best:null;};
    // A skill that cannot be used now (a guard while armoured) waits; only then may another one come back.
    return pick(skills.filter(x=>x.ult||!seen.has(x.name)))||pick(skills)||skills[0];
  }
  // When each kind is cast (studio and docs).
  function skillRule(skill){
    if(skill.ult)return 'Tuyệt chiêu: từ lần tung thứ 3 khi boss còn ≤60% máu hoặc tướng ≤35% máu, chậm nhất lần thứ 4; cách nhau ít nhất 3 lần tung';
    return {guard:'Khi không còn giáp và đã mất máu',heal:'Khi máu boss ≤75% (gấp khi ≤50%)',drain:'Khi tướng sắp đầy nộ (≥60)',burn:'Khi tướng chưa bị thiêu',poison:'Khi tướng chưa trúng độc',
      execute:'Khi máu tướng dưới ngưỡng kết liễu',lifesteal:'Khi boss đã mất máu (<70%)',pierce:'Khi tướng đang có giáp',charge:'Tích lực, lần sau đánh mạnh; không tích hai lần liền',strike:'Đòn chính, dùng khi không có chiêu nào hợp hơn'}[skill.kind]||'Đòn chính';
  }
  return {create,resist,collect,incoming,advance,forecast,nextSkill,chooseSkill,skillRule,MAX_ADDS,ADD_HP,ADD_POWER};
});
