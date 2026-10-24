/* A fully evolved hero leaves a cleared stage with something of its own, as six-star Noct hauls
 * a harvested soul: Mika's fox-fire spirit gallops at her heels, Yuki's snow rabbit hops beside
 * her, flowers sprout in Nori's footsteps, a comet trail of stars streams behind Lumi, and Tân,
 * a rookie on the road, kicks up dust as he runs. Art: assets/fx/depart (ART.departFx). */
const DEPART_FX={
  fire:{name:'fox',kind:'companion',form:3},
  ice:{name:'rabbit',kind:'companion',form:3},
  lightning:{name:'comet',kind:'trail',form:3},
  earth:{name:'sprout',kind:'ground',form:3,every:300,life:1500},
  novice:{name:'dust',kind:'ground',form:1,every:260,life:560}
};
function departFx(key){
  const fx=DEPART_FX[key],sheet=fx&&ART.departFx?.[fx.name];
  if(!sheet||reduced||combatHeroForm(key)<fx.form)return null;
  const root=actor('hero'),scene=$('scene'),strip=`--fx-count:${sheet.count};background-image:url('${sheet.src}');--fx-ms:${sheet.count*sheet.frameDuration}ms`;
  if(fx.kind!=='ground'){
    const node=document.createElement('span');node.className=`depart-fx depart-${fx.name}`;node.setAttribute('aria-hidden','true');node.style.cssText=strip;
    root.prepend(node);
    animate(node,[{opacity:0,scale:'.6'},{opacity:1,scale:'1'}],{duration:380,easing:'cubic-bezier(.2,.9,.3,1.2)'});
    return {tick(){},remove(){node.remove();}};
  }
  // Ground marks stay where they were left: they scroll back with the world as the camera follows.
  const marks=[];let last=-Infinity;
  return {
    tick(now,camera){
      if(now-last>=fx.every){
        last=now;
        const r=root.querySelector('.sprite-body').getBoundingClientRect(),s=scene.getBoundingClientRect();
        const node=document.createElement('span');node.className=`depart-mark depart-${fx.name}`;node.setAttribute('aria-hidden','true');
        node.style.cssText=`${strip};--mark-size:${r.height*.42}px;top:${r.top-s.top+r.height*.93}px`;
        $('combatEffects').append(node);marks.push({node,world:r.left-s.left+r.width*.42+camera});
        animate(node,[{opacity:1},{opacity:1,offset:.75},{opacity:0}],{duration:fx.life,fill:'both'}).finally(()=>node.remove());
      }
      for(const m of marks)m.node.style.left=`${m.world-camera}px`;
    },
    remove(){for(const m of marks)m.node.remove();}
  };
}
