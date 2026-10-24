/* Shared star thresholds select art; previews never alter ownership or stats. */
(() => {
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,A=window.GEMWOVEN_ASSETS,L=window.GEMWOVEN_LAYOUT,C=window.GEMWOVEN_DEFAULT_COPY;
  const originals={};
  for(const key of Object.keys(M.HEROES))for(const prefix of ['hero-','portrait-','home-idle-']){
    originals[prefix+key]=A[prefix+key];originals[prefix+key+'-poster']=A[prefix+key+'-poster'];
  }
  const palette={fire:'#ffb35e',ice:'#a6efff',earth:'#bde88d',lightning:'#d6b7ff',shadow:'#8d8d94'};
  function aura(key,form){
    const el=document.createElement('span');el.className='hero-form-effects';el.setAttribute('aria-hidden','true');
    el.innerHTML=window.GemwovenFormEffects.markup(key,form,A['form-aura-'+key]);
    return el;
  }
  function decorateBody(el,key,form){
    if(key==='shadow'&&form===3&&A['scythe-mask']&&!el.querySelector('.scythe-glint')){
      const image=el.querySelector('.art,img'),glint=document.createElement('i');glint.className='scythe-glint hub';
      if(image)glint.style.cssText=image.style.cssText;glint.style.setProperty('--scythe-mask',`url('${new URL(A['scythe-mask'].file,document.baseURI).href}')`);
      image?.after(glint);
    }
    if(key==='novice'||form<2)return;
    el.classList.add('has-hero-form');el.dataset.heroElement=key;el.dataset.heroForm=form;
    el.style.setProperty('--form-color',palette[key]);if(form===3)el.append(aura(key,form));
  }
  function fitBody(el,asset,target){
    const image=el.querySelector('.art,img');if(!image||!asset)return;
    const b=asset.footBounds||[0,0,asset.width,asset.height],a=asset.bodyAnchor||{x:(b[0]+b[2])/2/asset.width,crown:b[1]/asset.height,foot:b[3]/asset.height};
    const height=target/Math.max(.1,a.foot-a.crown),width=height*asset.width/asset.height;
    Object.assign(image.style,{position:'absolute',inset:'auto',width:width+'px',height:height+'px',maxWidth:'none',left:`calc(50% - ${width*a.x}px)`,bottom:-(height*(1-a.foot))+'px',translate:'none',padding:'0',objectFit:'contain'});
    el.style.setProperty('--hero-visible-height',target+'px');el.classList.add('hero-body-normalized');
  }
  window.GEMWOVEN_FORMS={decorateBody,fitBody};
  const decorate=G.decorate;
  G.decorate=state=>{
    const snapshot=G.engine.read();
    for(const key of Object.keys(M.HERO_FORMS)){
      const form=M.heroForm(key,snapshot.heroes[key]),poster=A[`form-${key}-${form}`],portrait=A[`form-portrait-${key}-${form}`],idle=A[`form-idle-${key}-${form}`];
      A['hero-'+key]=poster||originals['hero-'+key];A['portrait-'+key]=portrait||originals['portrait-'+key];
      A['home-idle-'+key]=idle||originals['home-idle-'+key];A['home-idle-'+key+'-poster']=poster||originals['home-idle-'+key+'-poster'];
    }
    const p=decorate(state);
    if(state.screen==='skills'){
      const key=state.hero,form=M.heroForm(key,p.heroes[key]),info=M.HERO_FORMS[key]?.[form-1];
      if(form>1&&info){
        C[`skills.skill-name-${key}-0`]=info.skill;
        C['skills.node-0']=info.skill;
        C[`skills.hero-title-${key}`]=info.name;
      }
    }
    if(state.screen==='home'&&M.heroForm(p.selected,p.heroes[p.selected])>1){
      const body=L.screens.home.nodes.find(n=>n.id==='home.hero');
      if(body)body.rect=[338,967,290,305];
    }
    if(state.screen==='upgrade'&&state.hero!=='novice'){
      const key=state.hero,form=M.heroForm(key,p.heroes[key]),caption=L.screens.upgrade.nodes.find(n=>n.id==='upgrade.hero-caption');
      if(caption){
        C[caption.text]=`${M.HEROES[key].name} · Hình thái ${form}/3 ›`;
        Object.assign(caption,{kind:'button',asset:'nameplate',fit:'fill',action:'forms:gallery',data:{hero:key},rect:[300,334,342,60],size:27,tone:'ink',labelRect:[22,10,298,40],className:'hero-form-link'});
      }
    }
    return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action!=='forms:gallery')return handle(action,el,ctx,state);
    const key=el.dataset.hero||state.hero,p=G.engine.read(),current=M.heroForm(key,p.heroes[key]);
    if(!M.HERO_FORMS[key])return true;
    // Same painted dialog as every other popup; on a phone the three forms are a swipe carousel.
    const modal=window.GemwovenUI.makeDialog('hero-form-gallery',M.HEROES[key].name+' · Ba hình thái','hero-form-gallery');modal.setAttribute('aria-label','Ba hình thái của '+M.HEROES[key].name);
    const intro=document.createElement('p');intro.className='form-gallery-intro';intro.textContent='4 sao: đổi diện mạo · 6 sao: thức tỉnh hào quang';
    const tabs=document.createElement('div');tabs.className='form-tabs';tabs.setAttribute('role','tablist');
    const list=document.createElement('div');list.className='hero-form-gallery-list';modal.body.append(intro,tabs,list);
    const cards=M.HERO_FORMS[key].map((info,i)=>{
      const form=i+1,card=document.createElement('article'),body=document.createElement('div');body.className='form-preview-body';
      const image=document.createElement('img'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,asset=i?(!reduced&&A[`form-idle-${key}-${form}`])||A[`form-${key}-${form}`]||originals['hero-'+key]:originals['hero-'+key];image.src=asset.file;image.alt=info.name;body.append(image);fitBody(body,asset,form===3?128:122);decorateBody(body,key,form);
      card.dataset.current=String(form===current&&!!p.heroes[key]);card.dataset.form=form;
      const title=document.createElement('h3');title.textContent=info.name;
      const note=document.createElement('p');note.className='form-state';note.textContent=`${[1,4,6][i]} sao · ${form===current&&p.heroes[key]?'Đang sử dụng':form<=current&&p.heroes[key]?'Đã mở':'Chưa mở'}`;
      const weapon=document.createElement('p');weapon.textContent=info.weapon;
      const skill=document.createElement('strong');skill.textContent=info.skill+(info.power?` · Tuyệt kỹ ×${String(info.power).replace('.',',')}`:'');
      card.append(body,title,note,weapon,skill);
      if(info.signature){const sig=document.createElement('p');sig.className='form-signature';sig.textContent=info.signature;card.append(sig);}
      list.append(card);
      const tab=document.createElement('button');tab.type='button';tab.className='gw-btn secondary';tab.setAttribute('role','tab');tab.textContent=`${[1,4,6][i]} ★`;tab.setAttribute('aria-label',`Hình thái ${form}`);
      tab.onclick=()=>list.scrollTo({left:card.offsetLeft-(list.clientWidth-card.clientWidth)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});tabs.append(tab);
      return card;
    });
    const mark=()=>{const center=list.scrollLeft+list.clientWidth/2;let best=0;cards.forEach((c,i)=>{if(Math.abs(c.offsetLeft+c.clientWidth/2-center)<Math.abs(cards[best].offsetLeft+cards[best].clientWidth/2-center))best=i;});[...tabs.children].forEach((t,i)=>{t.classList.toggle('secondary',i!==best);t.setAttribute('aria-selected',String(i===best));});};
    list.addEventListener('scroll',()=>requestAnimationFrame(mark),{passive:true});
    modal.present();
    const start=cards[Math.max(0,Math.min(2,current-1))];list.scrollLeft=start.offsetLeft-(list.clientWidth-start.clientWidth)/2;mark();return true;
  };
})();
