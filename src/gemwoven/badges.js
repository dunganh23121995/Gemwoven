/* Badges on the hub (agreed with Codex, docs/GAME_DESIGN.md §20 round 3):
 * - red with a count: rewards to take now, free (daily and weekly quests, newbie gifts, chapter chests,
 *   offline income, mail gifts);
 * - green ↑: something can be raised now (level, star, evolution, gear, skills, fragments to fuse); it stays
 *   while it is still possible (Codex UI review), and the player can turn hints off in Cài Đặt;
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
    const n=G.engine.notices(),prefs=read();
    const fresh=key=>prefs.hints!==false&&(n.hint[key]||[]).length>0;
    const red=key=>key==='more'?MORE.reduce((t,k)=>t+(n.claim[k]||0),0):n.claim[key]||0;
    const green=key=>key==='more'?false:fresh(key);
    for(const el of document.querySelectorAll('#scene [data-action]')){
      el.querySelector(':scope > .gw-badge')?.remove();
      const act=el.dataset.action,key=act.startsWith('route:')?act.slice(6):act==='journey:monthly'?'monthly':null;
      // The HUD avatar and currency buttons stay clean (the level number and plates sit there).
      // Only navigation (bottom bar, town places, side pennants, right icons) carries badges, never in-screen action buttons.
      if(!key||key===state.screen||!/\.(nav-|place-|feature-|right-|side-|explore$)/.test(el.dataset.node||''))continue;
      const r=red(key),g=!r&&green(key);if(!r&&!g)continue;
      const b=document.createElement('span');b.className='gw-badge '+(r?'is-claim':'is-hint');b.setAttribute('aria-hidden','true');b.textContent=r?(r>99?'99+':String(r)):'↑';el.append(b);
      const label=el.getAttribute('aria-label')||'';if(r&&!/quà nhận/.test(label))el.setAttribute('aria-label',`${label} · ${r} quà nhận được`.trim());
    }
    // Hòm thư: unread is blue; it turns red only when a gift is waiting (red means a reward to take).
    for(const c of document.querySelectorAll('#scene .mail-count'))c.classList.toggle('has-gift',(n.claim.mail||0)>0);
    // Cài Đặt: the switch for green hints.
    if(state.screen==='settings'){const form=document.getElementById('home-audio-form');if(form&&!form.querySelector('[data-hints]')){const l=document.createElement('label');l.className='mute-control';
      l.innerHTML=`<img class="kit-ico" src="${window.GEMWOVEN_ASSETS['kit-icon-up']?.file||''}" alt=""><span>Gợi ý nâng cấp</span><input type="checkbox" data-hints ${prefs.hints!==false?'checked':''}>`;l.querySelector('input').onchange=e=>{const v=read();v.hints=e.target.checked;write(v);};const group=form.querySelector('.kit-game'),mute=form.querySelector('.mute-control');if(group)group.append(l);else if(mute)mute.after(l);else form.prepend(l);}}
    // Top-up event ring on the VIP entry.
    const ev=topupEvent();
    for(const el of document.querySelectorAll('#scene [data-node$=".feature-vip"]')){
      el.classList.toggle('topup-ring',!!ev);el.querySelector(':scope > .topup-tag')?.remove();if(!ev)continue;
      // The ring alone marks a top-up event (Codex review 25: a text tag covered the card); its name is the tooltip.
      el.title=ev.name;
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
  G.mount=(state,ctx)=>{const r=mount(state,ctx);current=state;run(state);
    // Fill the phone's spare height with this screen's art, blurred (hub-polish.css).
    // An absolute URL: a relative one inside a custom property resolves against hub-polish.css, not the page.
    const bg=/url\(["']?([^"')]+)/.exec(document.getElementById('scene')?.style.backgroundImage||'')?.[1];if(bg)document.body.style.setProperty('--screen-bg',`url("${new URL(bg,document.baseURI).href}")`);return r;};
  watch.observe(document.body,{childList:true,subtree:true});
  window.GemwovenBadges={setHints(on){const p=read();p.hints=!!on;write(p);},hints:()=>read().hints!==false,apply:()=>current&&apply(current)};
})();
