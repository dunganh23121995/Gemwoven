/* Deterministic encounter state; no DOM, clocks, randomness, rewards or storage. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenBossTactics=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function create(def,{rank=0,heroMax=1000,bossMax=1000,tier='boss',variant=0,skills=null}={}){
    return {id:def.id,tier,variant,own:tier==='boss'?null:skills,rank:clamp(Math.floor(rank),0,4),heroMax,bossMax,phase:1,turn:0,cast:0,stacks:0,gauge:0,ward:tier==='boss'&&def.mechanic==='shell'?Math.round(bossMax*.12):0,addHp:0,addMax:0,addCount:0,addLock:0,channel:null,cleanseTiles:0,vulnerable:0,events:[]};
  }
  const resist=t=>[0,.35,.5,.65,.8][t.rank];
  function collect(t,def,type){
    if(type!==def.tile)return;
    t.cleanseTiles++;if(t.channel)t.channel.tiles++;
    if(t.cleanseTiles>=6){t.cleanseTiles-=6;t.stacks=Math.max(0,t.stacks-1);t.gauge=Math.max(0,t.gauge-12);}
  }
  function incoming(t,def,amount){
    let left=Math.max(0,amount)*(t.vulnerable>0?1.15+t.rank*.04:1),absorbed=0;
    if(t.ward>0){const multiplier=def.mechanic==='shell'?1+t.rank*.3:1,used=Math.min(left,t.ward/multiplier);t.ward=Math.max(0,t.ward-used*multiplier);left-=used;absorbed+=used;if(t.ward===0&&def.mechanic==='shell')t.vulnerable=t.rank===4?3:2;}
    if(t.addHp>0){const redirected=Math.min(t.addHp,left*.4);t.addHp-=redirected;left-=redirected;absorbed+=redirected;if(t.addHp<=.001){t.addHp=0;t.addCount=0;if(t.rank===4)t.addLock=3;t.vulnerable=Math.max(t.vulnerable,2);}}
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
      if(e.type==='adds'&&t.tier==='boss'&&t.addLock===0&&t.addHp===0){t.addCount=2;t.addMax=t.bossMax*.08*(1-r*.25);t.addHp=t.addMax;}
    }
    return events;
  }
  function nextSkill(t,def,atTurn=t.turn+1){
    if(t.channel)return t.channel.skill;
    if(t.tier==='normal')return atTurn%3===0?(t.own?.[0]||def.skills[[0,1,3][t.variant%3]]):{name:'Đòn đánh thường',effects:[{type:'hit',power:1.4}]};
    if(t.tier==='elite')return t.own?t.own[t.cast%t.own.length]:def.skills[[0,1,3,4][(t.cast+t.variant)%4]];
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
    if(t.gauge>=100){t.events.push({type:'hazard',amount:Math.ceil(t.heroMax*.05*(1-r)*scale),overload:true});t.gauge=35;t.stacks=Math.min(t.tier==='normal'?2:5,t.stacks+2);}
    if(['growth','souls','poison','tide'].includes(def.mechanic)&&scale)t.events.push({type:'heal',pct:(t.stacks*.002+t.addCount*.002)*(1-r)*scale});
    if(['frost','time','storm'].includes(def.mechanic)&&t.stacks&&scale)t.events.push({type:'drain',amount:Math.ceil(t.stacks*2*(1-r)*scale)});
    if(t.addHp>0)t.events.push({type:'hit',power:.15*t.addCount*(1-r),addAttack:true});
    if(skipAction)return t.events;
    const skill=nextSkill(t,def,t.turn);
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
  return {create,resist,collect,incoming,advance,forecast,nextSkill};
});
