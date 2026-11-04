/* Trang trí (owner 04/11: "nhận khung combat Hỏa Hồ thì dùng thế nào?", Codex wardrobe round, mockup
 * assets/gemwoven/raw/wardrobe/mockup-1.png 8/10): tapping the HUD avatar opens one sheet for every personal look —
 * avatar (owned heroes' portraits and season avatars), avatar frame (with "Theo tướng": the selected hero's own frame),
 * title, nameplate, chat bubble, combat frame and entry effect, across every released season. Pick a piece to see it in
 * the preview, then Trang bị / Gỡ; a locked piece shows where it comes from. The Sổ "Bộ sưu tập" opens the same sheet
 * filtered to its season, and a reward that brings a piece offers "Trang bị ngay". On a test server only, "Thử" lets
 * any piece be worn for preview without owning it (progression.js lookTrial; never owned, never on the real domain).
 * Rules live in progression.js (cosmetics, wearCosmetic, cosmeticOption, trial*); the art is the shared drawn kit.
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,O=window.GemwovenLiveOps,A=window.GEMWOVEN_ASSETS;
  if(!G?.engine?.cosmetics||!O?.COSMETICS)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const file=k=>A[k]?.file||'';
  const SLOTS=[['avatar','Avatar','icon-hero'],['frame','Khung','kit-medal'],['title','Danh hiệu','icon-crown'],['nameplate','Thẻ tên','kit-plaque'],
    ['bubble','Bong bóng','icon-chat'],['combatFrame','Khung trận','kit-icon-swords'],['entry','Vào trận','kit-icon-sparkle']];
  const TRACK={free:'Thường',gold:'Vàng',jewel:'Diệu Ngọc'};
  const view={slot:'avatar',sel:null,season:null,ctx:null,state:null,modal:null};
  const playerName=()=>{try{return JSON.parse(localStorage.getItem('gemwoven.plaza.v1')||'{}').name||'Lữ Khách';}catch{return 'Lữ Khách';}};
  const cat=id=>O.COSMETICS.find(c=>c.id===id)||null;
  const heroPic=key=>file('portrait-'+key)||file('face-'+key);
  // The picture of any look id: an owned hero's portrait ('hero:<key>') or a catalogue piece.
  const pic=id=>!id?'':id.startsWith('hero:')?heroPic(id.slice(5)):cat(id)?.file||'';
  const seasonName=c=>c?.season!=null?O.seasonHero(c.season)?.name||'':'';
  const source=c=>c.source||[M.HEROES[c.hero]?.name,TRACK[c.track]&&`${TRACK[c.track]} ★${c.level}`].filter(Boolean).join(' · ');

  function state(){
    const p=G.engine.read(),trial=G.engine.lookTrial(),opts=G.engine.wardrobeOptions();
    const worn=trial.on?{...(p.cosmetics?.worn||{}),...trial.worn}:{...(p.cosmetics?.worn||{})};
    return {p,trial,opts,worn,looks:G.engine.looks(),owned:new Set(p.cosmetics?.owned||[])};
  }
  // The pieces of one slot: "none" first, then (avatar) the heroes, then the season pieces of every released season.
  function items(slot,s){
    const all=s.trial.on;let list=(all?O.COSMETICS:G.engine.cosmetics()).filter(c=>c.slot===slot);
    if(view.season!=null)list=list.filter(c=>c.season===view.season);
    const out=[{id:'',none:true,slot,owned:true,name:slot==='avatar'?'Theo tướng':'Không dùng'}];
    if(slot==='avatar'&&view.season==null)for(const key of Object.keys(M.HEROES))if(s.p.heroes[key]||all)
      out.push({id:'hero:'+key,slot,hero:key,owned:!!s.p.heroes[key],name:M.HEROES[key].name,file:heroPic(key)});
    for(const c of list)out.push({...c,owned:s.owned.has(c.id)});
    return out;
  }

  // ----- Preview: what the selected piece looks like where it is used -----
  function preview(slot,item,s){
    const look=k=>item&&item.slot===k?item.id:s.looks[k]||'';
    const avatar=pic(look('avatar'))||heroPic(s.p.selected),frame=pic(look('frame'));
    if(['avatar','frame','title','nameplate'].includes(slot)){
      const plate=pic(look('nameplate')),title=look('title')?cat(look('title')):null;
      return `<div class="wd-prof"><span class="wd-ava"><img class="in" src="${esc(avatar)}" alt=""><img class="ring" src="${esc(frame||file('avatar-ring'))}" alt=""></span>`+
        `<span class="wd-ids"><span class="wd-plate ${plate?'':'plain'}">${plate?`<img src="${esc(plate)}" alt="">`:''}<b>${esc(playerName())}</b></span>`+
        (title?`<span class="wd-title"><img src="${esc(title.file)}" alt=""><b>${esc(title.name)}</b></span>`:'')+`</span></div>`;
    }
    if(slot==='bubble'){const b=pic(look('bubble'));
      return `<div class="wd-chat"><span class="wd-ava small"><img class="in" src="${esc(avatar)}" alt="">${frame?`<img class="ring" src="${esc(frame)}" alt="">`:''}</span>`+
        `<span class="wd-bubble ${b?'':'plain'}">${b?`<img src="${esc(b)}" alt="">`:''}<b>Chào!</b></span></div>`;}
    // Khung trận / Vào trận: a small battle with the real corner placement (progression-combat.css .cos-corner).
    const corner=pic(look('combatFrame')),entry=slot==='entry'?pic(look('entry')):'';
    return `<div class="wd-battle"><img class="bg" src="${esc(file('battle-card-forest'))}" alt=""><img class="hero" src="assets/gemwoven/items/hero-${esc(s.p.selected)}.png" alt="">`+
      `<img class="foe" src="${esc(file('monster-slime'))}" alt="">`+(corner?['tl','tr','bl','br'].map(c=>`<img class="corner ${c}" src="${esc(corner)}" alt="">`).join(''):'')+
      (entry?`<span class="wd-entry" style="background-image:url('${esc(entry)}')"></span><button type="button" class="wd-play" data-wd="play" aria-label="Xem lại"><img src="${esc(file('season-mika-play')||file('kit-round'))}" alt=""></button>`:'')+`</div>`;
  }

  function draw(){
    const s=state(),slot=view.slot,list=items(slot,s),worn=slot==='frame'&&s.opts.followHero&&!s.trial.on?s.looks.frame||'':s.worn[slot]||'';
    const sel=list.find(x=>x.id===view.sel)||list.find(x=>x.id===worn)||list[0];view.sel=sel.id;
    const m=view.modal;
    const trial=s.trial.allowed?`<button type="button" class="wd-trial ${s.trial.on?'on':''}" data-wd="trial" aria-pressed="${s.trial.on}"><img src="${file(s.trial.on?'kit-toggle-on':'kit-toggle-off')}" alt=""><b>${s.trial.on?'Đang thử':'Thử mọi món'}</b><small>LAN</small></button>`:'';
    const chip=view.season!=null?`<button type="button" class="wd-chip" data-wd="all"><img src="${esc(file(`season-${O.seasonHero(view.season)?.art||'mika'}-emblem`))}" alt=""><b>${esc(O.seasonHero(view.season)?.name||'Mùa')}</b><i>×</i></button>`:'';
    const follow=slot==='frame'&&!s.trial.on?`<button type="button" class="wd-follow ${s.opts.followHero?'on':''}" data-wd="follow" aria-pressed="${s.opts.followHero}"><img src="${file(s.opts.followHero?'kit-toggle-on':'kit-toggle-off')}" alt=""><b>Theo tướng</b></button>`:'';
    m.body.innerHTML=trial+`<div class="wd-stage">${preview(slot,sel.none?null:sel,s)}</div>`+
      `<div class="wd-slots" role="tablist">${SLOTS.map(([id,name,icon])=>`<button type="button" role="tab" class="wd-slot ${id===slot?'on':''}" data-wd="slot" data-slot="${id}" aria-selected="${id===slot}"><span><img src="${esc(file(icon))}" alt=""></span><b>${name}</b></button>`).join('')}</div>`+
      `<div class="wd-name">${chip}<b>${esc(sel.name)}</b>${!sel.owned&&!s.trial.on?`<small><img src="${file('kit-lock')}" alt="">${esc(source(sel))}</small>`:''}${follow}</div>`+
      `<div class="wd-grid">${list.map(x=>{const on=x.id===sel.id,isWorn=x.id===worn,locked=!x.owned&&!s.trial.on;
        return `<button type="button" class="wd-item ${on?'on':''} ${locked?'locked':''}" data-wd="pick" data-id="${esc(x.id)}" aria-label="${esc(x.name)}${isWorn?' · đang dùng':''}${locked?' · chưa có':''}">`+
          (x.none?'<i class="none">—</i>':`<img class="${x.slot==='entry'?'strip':''}" src="${esc(x.file)}" alt="">`)+
          (isWorn?`<img class="worn" src="${file('kit-medal-worn')}" alt="">`:'')+(locked?`<em><img src="${file('kit-lock')}" alt="">${x.track==='newbie'?'Ngày '+x.level:x.level?'★'+x.level:''}</em>`:'')+`</button>`;}).join('')}</div>`;
    // Footer: one action for the selected piece.
    m.actions.replaceChildren();const btn=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.className='gw-btn '+cls;b.textContent=label;b.onclick=fn;m.actions.append(b);};
    if(s.trial.on)btn(sel.id===worn?'Bỏ thử':'Đeo thử','kp-gold',()=>act(()=>G.engine.lookTrialWear(sel.id===worn?null:sel.id||null,slot)));
    else if(sel.owned&&sel.id!==worn)btn(sel.none?'Dùng mặc định':'Trang bị','kp-gold',()=>act(()=>G.engine.wearCosmetic(sel.id||null,slot)));
    else if(sel.owned&&sel.id&&sel.id===worn&&!(slot==='frame'&&s.opts.followHero))btn('Gỡ','secondary',()=>act(()=>G.engine.wearCosmetic(null,slot)));
    else if(!sel.owned){const to=goTo(sel);if(to)btn('Đi tới','kp-gold',()=>{m.close();to();});}
    m.actions.classList.toggle('is-empty',!m.actions.children.length);
    m.body.querySelectorAll('[data-wd]').forEach(b=>b.onclick=()=>click(b));
  }
  // Where a locked piece comes from: the current season's Sổ, the Tân Thủ week; older seasons have ended.
  function goTo(c){const ctx=view.ctx,st=view.state;
    if(c.track==='newbie')return ()=>ctx.navigate('events');
    if(c.season!=null&&c.season===O.passSeason(Date.now()).index)return ()=>{if(st)st.vipTab='pass';ctx.navigate('vip');};
    return null;}
  function act(fn){try{fn();view.sel=null;draw();view.ctx?.render();}catch(e){view.ctx?.showModal('Chưa thể thực hiện',[],e.message);}}
  function click(b){const d=b.dataset;
    if(d.wd==='slot'){view.slot=d.slot;view.sel=null;draw();}
    if(d.wd==='pick'){view.sel=d.id;draw();}
    if(d.wd==='all'){view.season=null;view.sel=null;draw();}
    if(d.wd==='follow')act(()=>G.engine.cosmeticOption('followHero',!G.engine.wardrobeOptions().followHero));
    if(d.wd==='trial')act(()=>G.engine.lookTrialMode(!G.engine.lookTrial().on));
    if(d.wd==='play'){const e=view.modal.body.querySelector('.wd-entry');if(e){e.classList.remove('run');void e.offsetWidth;e.classList.add('run');}}
  }
  function open(ctx,{slot,season=null,item=null,state=null}={}){
    view.ctx=ctx;if(state)view.state=state;view.season=season;view.slot=slot||cat(item)?.slot||(season!=null?'frame':view.slot||'avatar');view.sel=item;
    view.modal=window.GemwovenUI.makeDialog('wardrobe','Trang trí','growth-dialog wd-dialog');draw();view.modal.present();
  }
  window.GemwovenWardrobe={open};

  // A reward that brings a piece: its picture in the sheet and "Trang bị ngay" in the footer.
  const showRewards=G.showRewards;
  G.showRewards=(ctx,reward,title,note)=>{
    const ids=[...(reward?.cosmetics||[]),...(reward?.cosmetic?[reward.cosmetic]:[])].filter(id=>cat(id));
    const shown=showRewards(ctx,reward,title,note);
    if(!ids.length)return shown;
    if(!shown)ctx.showModal(title||'Đã nhận',[],note||'');
    const extra=document.getElementById('dialog-extra'),c=cat(ids[0]);
    extra?.insertAdjacentHTML('beforeend',`<div class="wd-new">${ids.map(id=>`<span><img src="${esc(cat(id).file)}" alt=""><b>${esc(cat(id).name)}</b></span>`).join('')}</div>`);
    const holder=document.getElementById('dialog-links'),back=document.getElementById('return-dialog');
    if(holder&&back){const b=document.createElement('button');b.type='button';b.className='gw-btn';b.textContent='Trang bị ngay';
      b.onclick=()=>{try{G.engine.wearCosmetic(c.id,c.slot);document.getElementById('preview-dialog')?.close?.();b.closest('dialog')?.close();ctx.render();open(ctx,{item:c.id});}catch(e){ctx.showModal('Chưa thể trang bị',[],e.message);}};
      holder.replaceChildren(b);back.before(holder);holder.classList.add('inline');back.hidden=false;back.classList.add('secondary');holder.closest('.gw-actions')?.classList.remove('is-empty');b.focus?.({preventScroll:true});}
    return true;
  };

  // The HUD avatar opens Trang trí on every screen (the hero screen stays on the bottom bar).
  const decorate=G.decorate;
  G.decorate=state=>{const p=decorate(state);
    for(const n of window.GEMWOVEN_LAYOUT?.screens?.[state.screen]?.nodes||[])if(/\.profile$/.test(n.id))n.action='wardrobe:open';
    return p;};
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{view.state=state;if(action!=='wardrobe:open')return handle(action,el,ctx,state);open(ctx,{state});return true;};
})();
