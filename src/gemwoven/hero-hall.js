/* Sảnh Anh Hùng — the Tướng screen as a hall where the heroes gather (owner 03/11, Codex design review 18).
 * - Roster: a strip that scrolls sideways (owned first, the chosen hero kept in view) and a "Tất cả" grid with
 *   element filters and one sort button, so any number of heroes fits.
 * - ⓘ beside the title opens the hero's profile: element, rarity, main stats and every skill (tap for its text),
 *   with a way to the Kỹ Năng screen.
 * - Two other owned heroes wait on the side pedestals of the hall (their own resting loop); a tap chooses one.
 * - The two side banners (Lộ trình, Chỉ số) and the element banners and lanterns are separate pictures drawn
 *   by Codex (assets/gemwoven/hall); the decorative ones sway, the ones you tap stay still.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G?.decorate||!M?.HEROES)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmt=n=>Math.floor(n||0).toLocaleString('vi-VN');
  const file=k=>A[k]?.file||'';
  const ELEMENTS=[['Hỏa','#e8553a'],['Băng','#5fb8e8'],['Mộc','#5aa84a'],['Lôi','#9a6ae0'],['Ảnh','#4b4a8a'],['Thường','#b89a62']];
  const tint=el=>(ELEMENTS.find(e=>e[0]===el)||ELEMENTS[5])[1];
  const skillIcon=(key,i)=>key==='novice'?['stat-attack','stat-shield','stat-heart','crest'][i]:`skill-${key}-${i}`;
  const view={element:'',sort:'level'};
  // Owned heroes first (highest level, then stars), the rest after in catalogue order.
  function order(p,list=Object.keys(M.HEROES)){
    const by={level:h=>h.level*10+h.stars,stars:h=>h.stars*1000+h.level}[view.sort];
    return list.slice().sort((a,b)=>{const ha=p.heroes[a],hb=p.heroes[b];if(!!ha!==!!hb)return ha?-1:1;return ha?by(hb)-by(ha):0;});
  }
  function card(p,key,selected,big){
    const h=p.heroes[key],hero=M.HEROES[key];
    return `<button type="button" class="hall-card ${h?'':'is-locked'} ${key===selected?'is-on':''}" data-action="do:hero" data-hero="${key}" style="--el:${tint(hero.element)}" aria-label="${esc(hero.name)}${h?' · cấp '+h.level:' · chưa sở hữu'}">`+
      `<img src="${file('face-'+key)}" alt="">${h?`<b>${h.level}</b>`:'<i>🔒</i>'}${big?`<span class="hall-stars">${h?'★'.repeat(h.stars):''}</span><em>${esc(hero.name)}</em>`:''}</button>`;
  }
  function strip(el,p,state){
    el.innerHTML=`<div class="hall-strip" role="list">${order(p).map(k=>card(p,k,state.hero)).join('')}</div>`;
    const s=el.firstChild,on=s.querySelector('.is-on');
    requestAnimationFrame(()=>{if(on)s.scrollLeft=Math.max(0,on.offsetLeft-s.clientWidth/2+on.offsetWidth/2);mark();});
    const mark=()=>{el.classList.toggle('more-left',s.scrollLeft>4);el.classList.toggle('more-right',s.scrollLeft+s.clientWidth<s.scrollWidth-4);};
    s.addEventListener('scroll',mark,{passive:true});
  }
  function allDialog(ctx,state){
    const modal=window.GemwovenUI.makeDialog('hero-all','Tất cả tướng','growth-dialog hall-dialog');
    const draw=()=>{const p=G.engine.read(),list=Object.keys(M.HEROES).filter(k=>!view.element||M.HEROES[k].element===view.element);
      modal.body.innerHTML=`<div class="hall-filters">${ELEMENTS.filter(([e])=>Object.values(M.HEROES).some(h=>h.element===e)).map(([e,c])=>`<button type="button" data-el="${e}" class="${view.element===e?'on':''}" style="--el:${c}">${e}</button>`).join('')}`+
        `<button type="button" data-sort class="hall-sort">${view.sort==='level'?'Cấp ↓':'Sao ↓'}</button></div>`+
        `<div class="hall-grid">${order(p,list).map(k=>card(p,k,state.hero,true)).join('')||'<p class="growth-lead">Chưa có tướng hệ này.</p>'}</div>`;
      modal.body.querySelectorAll('[data-el]').forEach(b=>b.onclick=()=>{view.element=view.element===b.dataset.el?'':b.dataset.el;draw();});
      modal.body.querySelector('[data-sort]').onclick=()=>{view.sort=view.sort==='level'?'stars':'level';draw();};
      modal.body.querySelectorAll('[data-hero]').forEach(b=>b.onclick=()=>{modal.close();state.hero=b.dataset.hero;state.outfitSlot=null;ctx.render();});};
    draw();modal.present();
  }
  function profileDialog(ctx,state){
    const p=G.engine.read(),key=state.hero,hero=M.HEROES[key],h=p.heroes[key],st=h?M.stats(p,key):null,form=h?M.lookForm(key,h):1,forms=M.HERO_FORMS[key]||[];
    const modal=window.GemwovenUI.makeDialog('hero-profile',hero.name,'growth-dialog hall-dialog hero-profile');
    const stat=(icon,v)=>`<span><img src="${file(icon)}" alt="">${v}</span>`;
    modal.body.innerHTML=`<div class="hp-head" style="--el:${tint(hero.element)}"><img src="${file('face-'+key)}" alt=""><div><b>${esc(forms[form-1]?.name||hero.title)}</b>`+
      `<span class="hp-tags"><i>${esc(hero.element)}</i>${M.RARITIES[hero.rarity]?.name===hero.element?'':`<i style="--q:${M.RARITIES[hero.rarity]?.color||'#999'}">${esc(M.RARITIES[hero.rarity]?.name||hero.rarity)}</i>`}</span>`+
      `<span class="hall-stars">${h?'★'.repeat(h.stars)+'☆'.repeat(Math.max(0,6-h.stars)):'Chưa sở hữu'}</span></div></div>`+
      `<p class="stat-chips">${stat('stat-heart',fmt(st?st.hp:hero.hp))}${stat('stat-attack','×'+(st?st.attack:hero.attack).toFixed(2).replace('.',','))}${stat('stat-shield',Math.round((st?st.defense:0)*100)+'%')}</p>`+
      `<div class="hp-skills">${hero.skills.map((name,i)=>{const t=M.skillText(key,h,i);return `<details><summary><img src="${file(skillIcon(key,i))}" alt=""><b>${esc(name)}</b><small>${esc(M.SKILL_BRANCHES[i])}${h&&t.unlocked?` · Cấp ${t.rank}/${t.max}`:' · 🔒'}</small></summary><p>${esc(t.description)}</p>${t.unlocked?'':`<p class="missing">${esc(M.skillGateText(i))}</p>`}</details>`;}).join('')}</div>`+
      (forms.length>1?`<div class="hp-forms">${forms.map((f,i)=>`<span class="${h&&i<M.formMax(key,h)?'':'locked'}">${i+1}<small>${esc(f.name)}</small></span>`).join('')}</div>`:'');
    const go=document.createElement('button');go.type='button';go.className='gw-btn';go.textContent='Kỹ năng';go.onclick=()=>{modal.close();ctx.navigate('skills');};
    modal.actions.append(go);modal.present();
  }
  // Two owned heroes besides the chosen one wait on the side pedestals: their own resting loop, a tap chooses.
  const PEDESTALS=[[61,476,140,200],[736,476,140,200]];
  // The five element banners hang from the rods painted on the back wall; they sway (decoration, never tapped).
  const BANNERS=[['fire',196],['ice',327],['earth',468],['lightning',610],['shadow',751]];
  function waiting(p,state){return order(p).filter(k=>p.heroes[k]&&k!==state.hero).slice(0,2);}

  // Kỹ Năng (owner 03/11): the tree moves up into the room the branch tabs left, so it never meets the roster,
  // and the roster becomes the same sideways strip as the hall's, on its own row under the hero.
  function skills(p,state){
    let nodes=L.screens.skills.nodes.filter(n=>!/^skills\.roster-/.test(n.id));
    for(const n of nodes)if(/^skills\.(node-\d|node-level-\d)$/.test(n.id)&&!n.hallShift){n.rect=[n.rect[0],n.rect[1]-110,...n.rect.slice(2)];n.hallShift=true;}
    nodes.push({id:'skills.roster',kind:'content',rect:[24,906,893,98],className:'exploration-map hall-roster skills-roster',build:el=>strip(el,p,state)});
    L.screens.skills.nodes=nodes;
  }
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen==='skills')skills(p,state);if(state.screen!=='upgrade')return p;
    // The stat line moved into the profile (ⓘ): the roster takes its row.
    let nodes=L.screens.upgrade.nodes.filter(n=>!/^upgrade\.(choose-|gear-stats$)/.test(n.id));
    nodes.unshift({id:'upgrade.hall-decor',kind:'content',rect:[0,0,941,1672],className:'exploration-map hall-decor',build:el=>{
      el.innerHTML=BANNERS.map(([k,x],i)=>A['hall-banner-'+k]?`<img class="hall-banner" src="${file('hall-banner-'+k)}" alt="" style="left:${x-28}px;top:300px;--d:${-(i*1.3).toFixed(1)}s">`:'').join('');}});
    // Owner: the banners match the hall; short labels, the ⓘ badge on the title board.
    for(const n of nodes){if(/^upgrade\.(left|right)-story-flag$/.test(n.id)){const left=n.id.includes('left');if(A['hall-flag-'+(left?'tall':'short')])n.asset='hall-flag-'+(left?'tall':'short');
      C[n.id+'-label']=left?'Lộ trình\n›':'Chỉ số\n›';n.className=((n.className||'')+' hall-flag').trim();}}
    if(!state.outfitSlot){
      nodes.push({id:'upgrade.roster',kind:'content',rect:[60,824,676,116],className:'exploration-map hall-roster',build:el=>strip(el,p,state)});
      nodes.push({id:'upgrade.roster-all',kind:'button',rect:[748,820,124,120],action:'hall:all',text:'upgrade.roster-all',asset:'kit-round',icon:'nav-more',iconRect:[26,14,72,72],labelRect:[0,84,124,36],className:'hall-all',size:24});C['upgrade.roster-all']='Tất cả';
      waiting(p,state).forEach((key,i)=>nodes.push({id:'upgrade.waiting-'+i,kind:'content',rect:PEDESTALS[i],className:'exploration-map hall-waiting',build:el=>{
        el.innerHTML=`<button type="button" class="hall-waiter" data-action="do:hero" data-hero="${key}" aria-label="Chọn ${esc(M.HEROES[key].name)}"><span class="hall-body"></span></button>`;
        const body=el.querySelector('.hall-body'),form=M.lookForm(key,p.heroes[key]);
        // Its own baked resting loop (show-<hero>-<form>, rig sheet); the drawn standing picture without one.
        const rig=A[`show-${key}-${form}`]?.sheets?.rig;
        if(!rig){body.innerHTML=`<img class="art" src="${file('hero-'+key)}" alt="">`;return;}
        Object.assign(body.style,{backgroundImage:`url("${rig.src}")`,backgroundSize:`${rig.cols*100}% ${rig.rows*100}%`});
        let f=0;const step=()=>{const i=f++%rig.count;body.style.backgroundPosition=`${(i%rig.cols)/(rig.cols-1)*100}% ${Math.floor(i/rig.cols)/(rig.rows-1)*100}%`;};step();
        if(!document.body.classList.contains('reduced-motion')){const t=setInterval(()=>{if(!body.isConnected){clearInterval(t);return;}step();},rig.frameDuration||110);}
      }}));
    }
    // Codex review 28: the step title, the EXP trough and the materials sit on one leather board.
    if(!state.outfitSlot){
      nodes=nodes.filter(n=>n.id!=='upgrade.level-strip');
      const i=nodes.findIndex(n=>n.id==='upgrade.level-preview');
      nodes.splice(Math.max(0,i),0,{id:'upgrade.level-board',kind:'content',rect:[188,946,566,372],className:'exploration-map hall-level-board',build:el=>{el.innerHTML='';}});
      for(const [id,rect] of [['upgrade.level-preview',[325,962,296,42]],['upgrade.exp-crystal',[212,1006,56,60]],['upgrade.exp-meter',[272,1016,440,30]],['upgrade.exp-value',[296,1050,350,32]]]){const n=nodes.find(n=>n.id===id);if(n)n.rect=rect;}
      // Full review 3: the main action is the second thing the eye meets, the counts read at a glance.
      for(const n of nodes){if(/^upgrade\.upgrade-materials-\d$/.test(n.id)){n.size=34;}
        if(n.id==='upgrade.upgrade-action'){n.rect=[275,1322,392,112];n.size=44;}
        if(/^upgrade\.(level-step|perk-list)$/.test(n.id))n.rect=[686,1348,128,62];}
    }
    nodes.push({id:'upgrade.profile-info',kind:'button',rect:[678,146,92,92],action:'hall:info',text:'upgrade.profile-info',className:'hall-info',size:40});C['upgrade.profile-info']='ⓘ';
    L.screens.upgrade.nodes=nodes;return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='hall:all'){allDialog(ctx,state);return true;}
    if(action==='hall:info'){profileDialog(ctx,state);return true;}
    return handle(action,el,ctx,state);
  };
})();
