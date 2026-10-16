const restorationJobs=new Map();
function restorationEffect(side,kind){
  if(reduced)return Promise.resolve();
  const id=side+kind;if(restorationJobs.has(id))return restorationJobs.get(id);
  const heal=kind==='heal',field=document.createElement('span');
  field.className='restoration-field '+(heal?'bloom-renewal':'crystal-sanctuary');field.setAttribute('aria-hidden','true');
  field.innerHTML='<i class="restoration-floor"></i><i class="restoration-orbit"></i>'+(heal?'':'<i class="sanctuary-veil"></i><i class="sanctuary-arch arch-left"></i><i class="sanctuary-arch arch-right"></i>');
  actor(side).append(field);
  const jobs=[animate(field,[{opacity:0},{opacity:1,offset:.18},{opacity:1,offset:.65},{opacity:0}],{duration:860,easing:'linear'})];
  const floor=field.querySelector('.restoration-floor');
  jobs.push(animate(floor,[{transform:'translateX(-50%) scale(.45)',opacity:0},{transform:'translateX(-50%) scale(1)',opacity:.8,offset:.3},{transform:'translateX(-50%) scale(1.22)',opacity:0}],{duration:820,easing:'ease-out'}));
  jobs.push(animate(field.querySelector('.restoration-orbit'),[{transform:'translateX(-50%) rotate(-12deg) scale(.55)',opacity:0},{opacity:.85,offset:.25},{transform:'translateX(-50%) rotate(16deg) scale(1.1)',opacity:0}],{duration:860}));
  for(let i=0;i<(heal?12:8);i++){
    const mote=document.createElement('span');mote.className=heal?'restoration-petal':'sanctuary-crystal';
    const angle=i*Math.PI*2/(heal?12:8),x=50+Math.cos(angle)*(heal?38:43);
    mote.style.left=x+'%';mote.style.top=(heal?80+Math.sin(angle)*8:48+Math.sin(angle)*38)+'%';
    if(heal)mote.innerHTML='<svg viewBox="0 0 24 38"><path d="M12 35C-4 23 2 8 18 2C29 13 23 28 12 35Z" fill="currentColor"/><path d="M12 32Q8 17 18 5" fill="none" stroke="#fffbe4" stroke-opacity=".75" stroke-width="1"/></svg>';
    field.append(mote);
    jobs.push(animate(mote,[{opacity:0,transform:`translate(-50%,5px) rotate(${i*47}deg) scale(.4)`},{opacity:heal?.85:.95,offset:.25},{opacity:.7,offset:.65},{opacity:0,transform:`translate(calc(-50% + ${Math.cos(angle)*(heal?13:7)}px),${heal?-65-i%3*12:-18}px) rotate(${i*47+(heal?60:25)}deg) scale(${heal?.65:.85})`}],{duration:640,delay:i*17,easing:'ease-out'}));
  }
  const job=Promise.all(jobs).finally(()=>{field.remove();restorationJobs.delete(id);});restorationJobs.set(id,job);return job;
}
