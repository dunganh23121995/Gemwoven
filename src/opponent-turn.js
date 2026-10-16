async function opponentBoardTurn(){
  await ensurePlayable();
  const move=await chooseEnemyMove();
  if(!move)return false;
  const name=state.boss?MONSTERS[state.enemyKey].boss:MONSTERS[state.enemyKey].name;
  const a=move.a,b=move.b,core=a.special==='core'?a:b.special==='core'?b:null,fusionCount=coreFusionCount(a,b);
  $('comboLabel').textContent=name+' đang chọn ngọc';
  message(name+' chọn nước ghép: '+move.reason+'.',false);
  const group=svgNode('g',{'data-board-phase':'enemy-choice','aria-hidden':'true'});
  const x=a.c*100+50,y=a.r*100+50,tx=b.c*100+50,ty=b.r*100+50;
  const dx=tx-x,dy=ty-y,nx=-dy/100,ny=dx/100;
  const jobs=[];
  try{
    for(const [fromX,fromY,toX,toY,sign]of [[x,y,tx,ty,1],[tx,ty,x,y,-1]]){
      const path=svgNode('path',{d:`M${fromX} ${fromY} Q${(x+tx)/2+nx*30*sign} ${(y+ty)/2+ny*30*sign} ${toX} ${toY}`,fill:'none',stroke:'#ffcf90','stroke-width':5,'stroke-linecap':'round',pathLength:1,'stroke-dasharray':'1'});group.append(path);
      jobs.push(battleCueAnimate(path,[{opacity:0,strokeDashoffset:'1'},{opacity:1,strokeDashoffset:'0',offset:.55},{opacity:.8,offset:.85},{opacity:0}],{duration:1050}));
    }
    for(const t of [a,b]){
      t.el.classList.add('enemy-pick');
      jobs.push(battleCueAnimate(t.el.firstElementChild,[{filter:'brightness(1)',transform:'scale(1)'},{filter:'brightness(1.5)',transform:'scale(.9)',offset:.35},{filter:'brightness(1.4)',transform:'scale(1.05)',offset:.7},{filter:'brightness(1)',transform:'scale(1)'}],{duration:1050}));
    }
    await Promise.all(jobs);
  }finally{group.remove();a.el.classList.remove('enemy-pick');b.el.classList.remove('enemy-pick');}
  await battleBeat(180);
  await swapAnimated(a,b);
  if(fusionCount)await resolveBoard('enemy',makeCoreFusionPlan(a,fusionCount));
  else if(core)await resolveBoard('enemy',makePlan(null,null,'enemy',core,move.coreType));
  else await resolveBoard('enemy');
  return true;
}
