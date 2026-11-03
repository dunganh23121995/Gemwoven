/* Badges on the hub (agreed with Codex, docs/GAME_DESIGN.md §20 round 3):
 * - red with a count: rewards to take now, free (daily and weekly quests, newbie gifts, chapter chests,
 *   offline income, mail gifts);
 * - green dot: something can be raised now (level, star, evolution, gear, skills, fragments to fuse); a hint
 *   seen once stays hidden until it changes, and the player can turn hints off in Cài Đặt;
 * - every button that leads to a screen shows that screen's badge; "Thêm" sums the screens behind it.
 * A top-up event with a special reward rings its icon twice when the hub opens, then the ring stays still;
 * it never gets a red dot for "you could pay". Counts come from engine.notices() (progression.js).
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,O=window.GemwovenLiveOps;if(!G?.engine?.notices)return;
  const KEY='gemwoven.badges.v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'null')||{hints:true,seen:{}};}catch{return {hints:true,seen:{}};}};
  const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v));}catch{}};
  // Screens behind "Thêm" (not on the bottom bar) whose red counts add up on it.
  const MORE=['quests','events','offline','campaign','boss','rankings','vip','mail','shop','forge','chat','settings'];
  const BOTTOM=['home','upgrade','inventory','skills','summon','arena'];
  const reduced=()=>document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;

  function topupEvent(){const now=Date.now();return (O?.TOPUP_EVENTS||[]).find(e=>Date.parse(e.start)<=now&&now<Date.parse(e.end))||null;}
  function apply(state){
    const n=G.engine.notices(),prefs=read(),seen=prefs.seen||{};
    // Visiting a screen marks its hints as seen.
    if(n.hint[state.screen]){seen[state.screen]=n.hint[state.screen];prefs.seen=seen;write(prefs);}
    const fresh=key=>prefs.hints!==false&&(n.hint[key]||[]).some(sig=>!(seen[key]||[]).includes(sig));
    const red=key=>key==='more'?MORE.reduce((t,k)=>t+(n.claim[k]||0),0):n.claim[key]||0;
    const green=key=>key==='more'?false:fresh(key);
    for(const el of document.querySelectorAll('#scene [data-action]')){
      el.querySelector(':scope > .gw-badge')?.remove();
      const act=el.dataset.action,key=act.startsWith('route:')?act.slice(6):act==='journey:monthly'?'monthly':null;
      // The HUD avatar and currency buttons stay clean (the level number and plates sit there).
      if(!key||key===state.screen||/\.(mail|profile|gold-plus|gems-plus)$/.test(el.dataset.node||''))continue;
      const r=red(key),g=!r&&green(key);if(!r&&!g)continue;
      const b=document.createElement('span');b.className='gw-badge '+(r?'is-claim':'is-hint');b.setAttribute('aria-hidden','true');if(r)b.textContent=r>99?'99+':String(r);el.append(b);
      const label=el.getAttribute('aria-label')||'';if(r&&!/quà nhận/.test(label))el.setAttribute('aria-label',`${label} · ${r} quà nhận được`.trim());
    }
    // Cài Đặt: the switch for green hints.
    if(state.screen==='settings'){const form=document.getElementById('home-audio-form');if(form&&!form.querySelector('[data-hints]')){const l=document.createElement('label');l.className='mute-control';
      l.innerHTML=`<input type="checkbox" data-hints ${prefs.hints!==false?'checked':''}> Gợi ý nâng cấp (chấm xanh)`;l.querySelector('input').onchange=e=>{const v=read();v.hints=e.target.checked;write(v);};const mute=form.querySelector('.mute-control');if(mute)mute.after(l);else form.prepend(l);}}
    // Top-up event ring on the VIP entry.
    const ev=topupEvent();
    for(const el of document.querySelectorAll('#scene [data-node$=".feature-vip"]')){
      el.classList.toggle('topup-ring',!!ev);el.querySelector(':scope > .topup-tag')?.remove();if(!ev)continue;
      const tag=document.createElement('span');tag.className='topup-tag';tag.textContent=ev.tag;el.append(tag);
      if(!sessionStorage.getItem('gw-topup-rung')&&!reduced()){el.classList.add('topup-pulse');try{sessionStorage.setItem('gw-topup-rung','1');}catch{}setTimeout(()=>el.classList.remove('topup-pulse'),2600);}
    }
  }
  const mount=G.mount;
  // Some buttons are added after mount (living hub, journey panels): apply again once the frame has settled.
  const run=state=>{try{apply(state);}catch(e){console.warn('badges',e);}};
  // Other modules redraw some buttons later (live timers, hanging menus): watch the scene and badge again,
  // ignoring our own badges, at most a few times a second.
  let current=null,timer=0;
  const watch=new MutationObserver(list=>{if(!current||current.screen==='chat')return;if(list.every(m=>[...m.addedNodes,...m.removedNodes].every(n=>n.classList?.contains('gw-badge')||n.classList?.contains('topup-tag'))))return;
    clearTimeout(timer);timer=setTimeout(()=>run(current),120);});
  G.mount=(state,ctx)=>{const r=mount(state,ctx);current=state;run(state);return r;};
  watch.observe(document.body,{childList:true,subtree:true});
  window.GemwovenBadges={setHints(on){const p=read();p.hints=!!on;write(p);},hints:()=>read().hints!==false,apply:()=>current&&apply(current)};
})();
