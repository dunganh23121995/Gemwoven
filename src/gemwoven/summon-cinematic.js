/* The reward transaction completes before this presentation starts: nothing here rolls, spends
 * or grants. Cards are dealt in reveal order (bronze first, gold next, diamond last, the whole
 * hero at the very end): each card is a star that spirals down a whirlwind from the sky (round
 * and round a funnel that narrows as it falls, far side small, dim and behind, near side big,
 * bright and in front), splashes into the lake and only then bounces up into its slot as a card.
 * Gold and diamond cards shimmer; opening a whole-hero card plays that hero's own entrance.
 * All art is generated (assets/gemwoven/summon); code only moves, scales and fades it. Sounds are
 * single real CC0 recordings (scripts/prepare_summon_sounds.py) played at the hub's effects
 * volume, silent when the hub is muted. */
(() => {
  const A=window.GEMWOVEN_ASSETS,M=window.GemwovenProgression;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const url=key=>A[key]?new URL(A[key].file,document.baseURI).href:'';
  const img=(key,cls='')=>A[key]?`<img class="${cls}" src="${esc(url(key))}" alt="" draggable="false">`:'';
  const sprite=(key,cls,style='')=>{const s=A[key];if(!s)return '';
    return `<i class="sm-sprite ${cls}" aria-hidden="true" style="--sheet:url('${url(key).replace(/'/g,'%27')}');--count:${s.count};--cycle:${s.count*s.frameDuration}ms;${style}"></i>`;};
  const RANK={common:0,uncommon:1,rare:2,epic:3,legendary:4,divine:5};
  // Three card types. Diamond: whole heroes and legendary/divine weapons. Gold: hero fragments
  // and rare/epic weapons. Bronze: everything else (materials, other gear, plain weapons).
  const weapon=r=>r.kind==='gear'&&r.gear?.slot==='weapon';
  const cardType=r=>r.kind==='hero'||(weapon(r)&&RANK[r.rarity]>=4)?'diamond':r.kind==='fragments'||(weapon(r)&&RANK[r.rarity]>=2)?'gold':'bronze';
  const premium=r=>cardType(r)!=='bronze';
  // Reveal order: bronze by rarity, then gold (weapons, then fragments), then diamond with the
  // whole hero at the very end.
  const order=r=>({bronze:0,gold:10,diamond:20})[cardType(r)]+(r.kind==='hero'?9:r.kind==='fragments'?8:RANK[r.rarity]||0);
  const rewardArt=r=>r.kind==='hero'?'hero-'+r.hero:r.kind==='fragments'?(A['fragment-'+r.hero]?'fragment-'+r.hero:'portrait-'+r.hero)
    :r.kind==='gear'?M.SLOT_ART[r.gear.slot]:M.RESOURCES[r.resource]?.[1]||'summon-crystal';
  // ---- sound: the hub's effects volume and mute (journey-ui.js) apply to every cue ----
  const SOUND_FILES=window.GEMWOVEN_SUMMON_SOUNDS||Object.fromEntries(['star-1','star-2','star-3','star-4','splash','pop','choir','flip','gold','swell','bell','hero','ambience','drone']
    .map(k=>[k,`assets/audio/summon/${k}.ogg`]));
  const Sound={ctx:null,buffers:{},bed:null,wantBed:false,
    level(){const H=window.GemwovenHubAudio;if(H?.muted?.())return 0;const v=H?.levels?.().effects;return Number.isFinite(v)?v/100:1;},
    init(){
      if(this.ctx||!this.level())return;const AC=window.AudioContext||window.webkitAudioContext;if(!AC||!window.fetch)return;
      try{this.ctx=new AC();}catch{return;}
      for(const [k,u] of Object.entries(SOUND_FILES))fetch(new URL(u,document.baseURI).href).then(r=>r.arrayBuffer()).then(b=>this.ctx.decodeAudioData(b))
        .then(buf=>{this.buffers[k]=buf;if((k==='ambience'||k==='drone')&&this.wantBed)this.ambience(true);}).catch(()=>{});
    },
    play(name,{volume=1,pan=0,delay=0,loop=false}={}){
      const v=this.level()*volume,buf=this.buffers[name];if(!this.ctx||!v||!buf)return null;
      if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});
      const src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=buf;src.loop=loop;gain.gain.value=v;src.connect(gain);
      let out=gain;if(this.ctx.createStereoPanner){const p=this.ctx.createStereoPanner();p.pan.value=Math.max(-.8,Math.min(.8,pan));gain.connect(p);out=p;}
      out.connect(this.ctx.destination);src.start(this.ctx.currentTime+delay/1000);return {src,gain};
    },
    // Beds under the reveal: a sustained singing bowl and, quieter, the night lake. They fade in
    // with the screen and out when it closes.
    beds:{},
    ambience(on){
      this.wantBed=on;
      for(const [name,vol] of [['drone',.5],['ambience',.4]]){
        const bed=this.beds[name];
        if(on&&!bed){const b=this.play(name,{volume:vol,loop:true});if(!b)continue;const g=b.gain.gain,t=this.ctx.currentTime;g.setValueAtTime(0,t);g.linearRampToValueAtTime(vol*this.level(),t+2.2);this.beds[name]=b;}
        if(!on&&bed){const {src,gain}=bed,t=this.ctx.currentTime;gain.gain.cancelScheduledValues(t);gain.gain.setValueAtTime(gain.gain.value,t);gain.gain.linearRampToValueAtTime(0,t+.9);src.stop(t+.95);delete this.beds[name];}
      }
    }
  };
  const sparkles=n=>Array.from({length:n},(_,i)=>sprite('summon-sparkle','sm-twinkle',`--x:${[8,92,14,86,50][i%5]}%;--y:${[6,12,94,88,-3][i%5]}%;--s:${[26,20,22,18,24][i%5]}px;--d:${-(i*.73).toFixed(2)}s;--wait:${(2.4+i*.6).toFixed(1)}s`)).join('');

  // The living lake: drifting light, aurora, twinkling stars, moonlight glinting on the water.
  function sky(){
    const stars=[[12,14,22],[23,6,16],[38,19,26],[47,9,14],[58,24,18],[78,5,20],[88,18,24],[6,30,16],[31,33,14],[72,32,18],[93,36,14],[64,13,12],[17,41,12],[83,44,14]]
      .map(([x,y,s],i)=>sprite('summon-sparkle','sm-star',`left:${x}%;top:${y}%;--s:${s}px;--d:${-(i*.91).toFixed(2)}s;--wait:${(3.2+(i%5)*.9).toFixed(1)}s`)).join('');
    const glints=[[52,49,30,.55],[50,55,44,.6],[54,62,58,.7],[48,71,74,.75],[53,82,92,.6],[30,90,46,.35],[76,88,44,.35]]
      .map(([x,y,w,o],i)=>sprite('summon-glints','sm-glint',`left:${x}%;top:${y}%;width:${w}%;--o:${o};--d:${-(i*.37).toFixed(2)}s;--drift:${i%2?-1:1}`)).join('');
    const orbs=[[18,86,26],[36,78,14],[63,90,20],[82,80,30],[47,96,12],[27,64,10],[71,66,16]]
      .map(([x,y,s],i)=>`<img class="sm-orb" src="${esc(url('summon-orb'))}" alt="" style="left:${x}%;top:${y}%;--s:${s}px;--d:${-(i*2.3).toFixed(1)}s;--t:${(11+i%3*3)}s">`).join('');
    return `<div class="celestial-sky" aria-hidden="true"><div class="celestial-lake"></div>
      ${img('summon-halo','sm-moon')}${img('summon-aurora','sm-aurora')}${img('summon-aurora','sm-aurora second')}
      ${stars}${glints}${A['summon-orb']?orbs:''}${img('summon-halo','sm-gate')}</div>`;
  }

  window.GemwovenSummonReveal=input=>new Promise(resolve=>{
    document.getElementById('summon-reveal')?.close();
    const results=input.map((r,i)=>({r,i})).sort((a,b)=>order(a.r)-order(b.r)||a.i-b.i).map(x=>x.r);
    const modal=document.createElement('dialog');modal.id='summon-reveal';modal.className='celestial-reveal';
    modal.dataset.phase='sky';modal.dataset.count=results.length;
    modal.style.setProperty('--lake',`url("${url('summon-lake')}")`);
    modal.setAttribute('aria-label','Hồ Tinh Tú · Triệu hồi');
    modal.innerHTML=`${sky()}
      <p class="celestial-status" role="status">Tinh tú đang đáp lời…</p>
      <button type="button" class="celestial-close" aria-label="Đóng kết quả">×</button>
      <div class="celestial-fx back" aria-hidden="true"></div><div class="celestial-deck" hidden></div><div class="celestial-fx" aria-hidden="true"></div>
      <button type="button" class="celestial-skip">Bỏ qua ›</button>
      <footer><button type="button" class="celestial-open-all gw-btn" disabled>Mở tất cả</button><div class="celestial-again" hidden></div></footer>`;
    document.body.append(modal);
    const deck=modal.querySelector('.celestial-deck'),fx=modal.querySelector('.celestial-fx:not(.back)'),fxBack=modal.querySelector('.celestial-fx.back'),againBox=modal.querySelector('.celestial-again'),status=modal.querySelector('.celestial-status'),
      all=modal.querySelector('.celestial-open-all'),skipButton=modal.querySelector('.celestial-skip');
    const reduced=()=>document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    let opened=0,dealt=false,closed=false,heroStage=null,again=0;const timers=[],flights=[],stars=new Set();
    const play=(el,frames,opts)=>el.animate?el.animate(frames,opts):null;
    const later=(ms,fn)=>timers.push(setTimeout(()=>{if(!closed)fn();},ms));
    function layout(){
      // Card size follows the free board area: 5 across on wide frames, 3 across on phones.
      const box=deck.getBoundingClientRect(),n=results.length,cols=n<=1?1:modal.clientWidth<480?3:5,rows=Math.ceil(n/cols),gap=n>1?9:0;
      const width=Math.min(n<=1?190:150,(box.width-gap*(cols-1))/cols,(box.height-gap*(rows-1))/rows*.52);
      deck.style.setProperty('--cols',cols);deck.style.setProperty('--cw',Math.max(40,Math.floor(width))+'px');
    }
    function finish(){
      if(closed)return;closed=true;timers.forEach(clearTimeout);stars.forEach(st=>st.stop());observer.disconnect();heroStage?.stop();Sound.ambience(false);modal.remove();resolve(again);
    }
    modal.addEventListener('close',finish,{once:true});
    modal.querySelector('.celestial-close').onclick=()=>modal.close();
    const cards=results.map((r,i)=>{
      const card=document.createElement('button'),art=cardType(r),top=premium(r),R=M.RARITIES[r.rarity];
      card.type='button';card.className=`celestial-card rarity-${r.rarity} card-${art} tier-${top?'premium':'common'} is-waiting`;
      card.dataset.tier=top?'premium':'common';card.dataset.card=art;card.style.setProperty('--rarity',R.color);
      const win=A['summon-front-'+art]?.window||[.14,.18,.86,.72];
      card.style.setProperty('--win',`${win[1]*100}% ${(1-win[2])*100}% ${(1-win[3])*100}% ${win[0]*100}%`);
      const plaque=A["summon-front-"+art]?.plaque;if(plaque){card.style.setProperty("--plaque-top",plaque[0]*100+"%");card.style.setProperty("--plaque-h",plaque[1]*100+"%");}
      card.setAttribute('aria-label',`Thẻ ${i+1} · ${({bronze:'Thẻ đồng',gold:'Thẻ vàng',diamond:'Thẻ kim cương'})[art]} · Chưa mở`);card.setAttribute('aria-pressed','false');
      const shine=top?`<span class="card-shine" aria-hidden="true">${img('summon-streak')}</span>`:'';
      card.innerHTML=`${top?img('summon-halo','card-halo'):''}<span class="celestial-card-turn">
        <span class="celestial-back">${img('summon-back-'+art,'card-art')}${shine}</span>
        <span class="celestial-front" aria-hidden="true"><span class="card-window">${img('summon-back-'+art,'card-panel')}${img(rewardArt(r),'card-reward')}</span>${img('summon-front-'+art,'card-art')}${shine}<strong>${esc(r.name)}</strong></span></span>${top?`<span class="card-sparkles" aria-hidden="true">${sparkles(4)}</span>`:''}`;
      card.onclick=()=>open(card,r,0);deck.append(card);return card;
    });
    function open(card,r,delay){
      if(!dealt||card.classList.contains('is-open'))return;
      card.style.setProperty('--flip-delay',delay+'ms');card.classList.add('is-open');card.setAttribute('aria-pressed','true');
      card.setAttribute('aria-label',r.name+' · '+M.RARITIES[r.rarity].name);
      card.querySelector('.celestial-front').setAttribute('aria-hidden','false');card.querySelector('.celestial-back').setAttribute('aria-hidden','true');
      opened++;status.textContent=`Đã mở ${opened} / ${results.length} thẻ`;
      // Bronze: a plain card flip; gold: flip and a shimmering chime; diamond: a rising belltree
      // swell, then a bell (for a whole hero the bell rings as the hero steps out).
      const kind=card.dataset.card,pan=panOf(card),soft=delay>0&&kind==='bronze';
      later(delay,()=>{
        Sound.play('flip',{volume:kind==='bronze'?(soft?.5:.8):.55,pan});
        if(kind==='gold')Sound.play('gold',{volume:.9,pan,delay:200});
        if(kind==='diamond'){Sound.play('swell',{volume:.8,pan});if(r.kind!=='hero')Sound.play('bell',{volume:1,pan,delay:900});}
      });
      if(card.dataset.tier==='premium'&&!reduced())later(delay+380,()=>burst(card,6));
      if(r.kind==='hero'&&cardType(r)==='diamond')later(delay+(reduced()?0:850),()=>showHero(r));
      if(opened===results.length){all.disabled=true;status.textContent='Tinh tú đã tìm được chủ nhân';modal.dataset.phase='complete';later(delay+600,offerAgain);}
    }
    // Opening everything turns the common cards first and the premium ones last.
    all.onclick=()=>{let wait=0;cards.forEach((card,i)=>{if(card.classList.contains('is-open'))return;open(card,results[i],wait);wait+=card.dataset.card==='diamond'?900:card.dataset.tier==='premium'?520:110;});};
    // Everything is open: summon again (x1 / x10) with the cost the main buttons would charge; the
    // reveal closes and the normal confirmation runs (progression-ui.js), so nothing is spent here.
    function offerAgain(){
      const G=window.GEMWOVEN_GAME;if(!G?.engine?.summonQuote)return;
      againBox.replaceChildren(...[1,10].map(count=>{
        let q;try{q=G.engine.summonQuote(count);}catch{return document.createTextNode('');}
        const b=document.createElement('button');b.type='button';b.className='gw-btn celestial-again-btn';b.disabled=!q.enough;b.dataset.count=count;
        const cost=q.enough?q.cost:count;b.innerHTML=`<span>Triệu hồi tiếp ×${count}</span><small>${img(q.payment==='gems'?'mana':'ticket','again-cost')}${cost}</small>`;
        b.setAttribute('aria-label',`Triệu hồi tiếp ${count} lần, ${q.enough?cost+(q.payment==='gems'?' Đá Ngọc':' vé'):'chưa đủ tài nguyên'}`);
        b.onclick=()=>{again=count;modal.close();};return b;
      }));
      againBox.hidden=false;
    }
    const panOf=el=>{const m=modal.getBoundingClientRect(),c=el.getBoundingClientRect();return m.width?((c.left+c.width/2-m.left)/m.width-.5)*1.2:0;};

    // ---- one-shot effects, placed in the modal's own coordinates ----
    function fxAt(html,x,y,ms){
      const holder=document.createElement('div');holder.className='sm-at';holder.style.cssText=`left:${x}px;top:${y}px`;holder.innerHTML=html;
      fx.append(holder);setTimeout(()=>holder.remove(),ms);return holder;
    }
    function splash(x,y,size,sparks){
      const drops=Array.from({length:sparks},(_,i)=>sprite('summon-sparkle','sm-fly',`--a:${-150+i*120/Math.max(1,sparks-1)}deg;--r:${size*.55}px;--s:${16+i%3*7}px`)).join('');
      fxAt(sprite('summon-splash','sm-splash')+img('summon-ripple','sm-ripple')+drops,x,y,1500).style.setProperty('--s',size+'px');
    }
    function burst(card,n){
      const m=modal.getBoundingClientRect(),c=card.getBoundingClientRect();
      fxAt(img('summon-halo','sm-flash')+Array.from({length:n},(_,i)=>sprite('summon-sparkle','sm-fly',`--a:${i*360/n+15}deg;--r:${c.width*.75}px;--s:${18+i%3*6}px`)).join(''),
        c.left-m.left+c.width/2,c.top-m.top+c.height/2,1100);
    }
    // ---- dealing: a star falls from the sky on its own curved, twisting path ----
    const seeded=seed=>()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
    function fall(card,index){
      const kind=card.dataset.card,top=card.dataset.tier==='premium',m=modal.getBoundingClientRect(),c=card.getBoundingClientRect();
      const W=m.width,H=m.height,cx=c.left-m.left+c.width/2,cy=c.top-m.top+c.height/2,rnd=seeded(index*7919+results.length*31+1);
      // A whirlwind: the star circles a vertical axis while it falls; the funnel is wide in the sky
      // and narrows to the splash point on the lake (the axis drifts there too). sin(angle) is depth:
      // near (+1) is lower, bigger, brighter and in front; far (-1) is higher, smaller, dimmer,
      // blurred and behind the board.
      const I=[cx+(W*.5-cx)*.2+(rnd()-.5)*W*.06,H*(.875+(rnd()-.5)*.03)],top0=-H*.08;
      const axis0=W*(.5+(rnd()-.5)*.12),R0=W*(.3+rnd()*.08),R1=W*.035,turns=2.2+rnd()*.9,phase=rnd()*Math.PI*2,spin=index%3===1?-1:1;
      const dur=kind==='diamond'?2700:top?2300:1900,size=kind==='diamond'?60:top?50:40;
      const star=document.createElement('span');star.className=`sm-falling star-${kind}`;star.setAttribute('aria-hidden','true');
      star.innerHTML=img('summon-halo','sm-falling-halo')+sprite('summon-sparkle','sm-falling-core');
      star.style.setProperty('--s',size+'px');fx.append(star);
      Sound.play('star-'+(index%4+1),{volume:kind==='diamond'?.9:top?.7:.42,pan:(axis0/W-.5)*.8});
      const t0=performance.now();let raf=0,lastTrail=0,done=false,behind=false;
      const at=u=>{
        const fallT=Math.pow(u,1.25),funnel=Math.pow(u,.8),r=R0*(1-funnel)+R1*funnel;
        const th=phase+spin*turns*Math.PI*2*u,depth=Math.sin(th),ax=axis0+(I[0]-axis0)*Math.pow(u,1.6);
        return {x:ax+r*Math.cos(th),y:top0+(I[1]-top0)*fallT+r*.28*depth,depth,u};
      };
      const handle={stop(){if(done)return;done=true;cancelAnimationFrame(raf);star.remove();stars.delete(handle);}};stars.add(handle);
      function frame(now){
        if(closed||dealt){handle.stop();return;}
        const u=Math.min(1,(now-t0)/dur),{x,y,depth}=at(u),near=(depth+1)/2,grow=(.5+.5*u)*(.62+.6*near);
        // The far half of each loop passes behind the board; the near half in front of it.
        const back=depth<-.15&&u<.9;if(back!==behind){behind=back;(back?fxBack:fx).append(star);}
        star.style.transform=`translate(${x}px,${y}px) scale(${grow.toFixed(3)})`;
        star.style.opacity=(.45+.55*near).toFixed(2);star.style.filter=near<.4?`blur(${((.4-near)*3).toFixed(1)}px)`:'';star.style.zIndex=Math.round(near*100);
        if(now-lastTrail>(top?26:34)&&u<.97){lastTrail=now;trail(x,y,size*grow*(top?.8:.7),kind,near,back);}
        if(u<1){raf=requestAnimationFrame(frame);return;}
        handle.stop();splash(I[0],I[1],Math.max(80,c.width*(kind==='diamond'?2.3:top?1.9:1.5)),kind==='diamond'?7:top?4:0);
        Sound.play('splash',{volume:kind==='diamond'?1:top?.8:.55,pan:(I[0]/W-.5)*1.2});
        rise(card,I[0]-cx,I[1]-cy,kind);
      }
      raf=requestAnimationFrame(frame);
    }
    function trail(x,y,size,kind,near=1,back=false){
      const s=A['summon-sparkle'];if(!s)return;const t=document.createElement('i');t.className=`sm-sprite sm-trail star-${kind}`;
      t.style.cssText=`--sheet:url('${url('summon-sparkle').replace(/'/g,'%27')}');--count:${s.count};left:${x}px;top:${y}px;--s:${Math.max(8,size)}px;--o:${(.35+.65*near).toFixed(2)}`;
      (back?fxBack:fx).append(t);setTimeout(()=>t.remove(),950);
    }
    // From the splash the card bounces up out of the water into its slot.
    function rise(card,dx,dy,kind){
      const top=kind!=='bronze',dur=kind==='diamond'?950:top?850:720;
      card.classList.remove('is-waiting');card.classList.add('is-flying');
      const anim=play(card,[
        {transform:`translate(${dx}px,${dy}px) scale(.3)`,opacity:0,filter:'brightness(2.2)'},
        {transform:`translate(${dx*.5}px,${dy*.45}px) scale(.8)`,opacity:1,filter:'brightness(1.6)',offset:.35,easing:'cubic-bezier(.2,.7,.3,1)'},
        {transform:'translateY(-24px) scale(1.07)',opacity:1,filter:'brightness(1.3)',offset:.7,easing:'ease-in-out'},
        {transform:'translateY(6px) scale(.97)',opacity:1,filter:'brightness(1)',offset:.86},
        {transform:'none',opacity:1,filter:'none'}],{duration:dur,fill:'backwards'});
      if(anim)flights.push(anim);
      later(dur*.82,()=>Sound.play('pop',{volume:top?.6:.45,pan:panOf(card)}));
      const land=()=>{if(card.classList.contains('is-landed'))return;card.classList.remove('is-flying');card.classList.add('is-landed');if(top&&!closed&&!dealt)burst(card,kind==='diamond'?8:5);};
      if(anim)anim.onfinish=land;else later(dur,land);
    }
    function deal(){
      if(dealt||closed)return;dealt=true;timers.forEach(clearTimeout);timers.length=0;stars.forEach(st=>st.stop());
      flights.forEach(a=>a.playState!=='finished'&&a.finish());fx.replaceChildren();
      cards.forEach(card=>{card.classList.remove('is-waiting','is-flying');card.classList.add('is-landed');});
      modal.classList.remove('is-suspense');skipButton.hidden=true;all.disabled=!results.length;
      modal.dataset.phase='cards';status.textContent='Chạm từng thẻ để khám phá';cards[0]?.focus({preventScroll:true});
    }
    function start(){
      deck.hidden=false;layout();modal.dataset.phase='falling';
      if(reduced()){
        // Reduced motion: no fall, no splash; the cards simply fade in place.
        cards.forEach((card,i)=>{card.classList.remove('is-waiting');play(card,[{opacity:0},{opacity:1}],{duration:260,delay:i*40,fill:'backwards'});});
        deal();return;
      }
      status.textContent='Những lá bài rơi xuống mặt hồ…';
      // Bronze stars come quickly; then a pause of suspense; then each gold and diamond star alone.
      let t=250,end=0;const firstTop=cards.findIndex(c=>c.dataset.tier==='premium');
      const suspense=()=>{modal.classList.add('is-suspense');status.textContent='Mặt hồ rung động… ánh sáng lạ đang tụ lại!';Sound.play('choir',{volume:.85});};
      cards.forEach((card,i)=>{
        const top=card.dataset.tier==='premium';
        if(i===firstTop){if(i){later(t+200,suspense);t+=1300;}else{later(t,suspense);t+=700;}}
        if(top&&i===cards.length-1&&i>firstTop)t+=350;   // one more breath before the very best card
        const kind=card.dataset.card;
        later(t,()=>fall(card,i));end=Math.max(end,t+(kind==='diamond'?2700+950:top?2300+850:1900+720));
        t+=kind==='diamond'?1100:top?800:260;
      });
      later(end+80,deal);
    }
    skipButton.onclick=e=>{e.stopPropagation();deal();};
    modal.addEventListener('click',e=>{if(!dealt&&modal.dataset.phase==='falling'&&!e.target.closest('.celestial-close'))deal();});

    // ---- the whole hero steps out: its own showcase entrance plus a shimmer of light ----
    function showHero(r){
      if(closed)return;heroStage?.stop();
      const G=window.GEMWOVEN_GAME,form=M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),show=A[`show-${r.hero}-${form}`],H=M.HEROES[r.hero];
      const stage=document.createElement('div');stage.className='summon-hero-stage';stage.setAttribute('role','dialog');stage.setAttribute('aria-label',`${H.name} · ${H.title}`);
      stage.innerHTML=`<div class="summon-hero-light" aria-hidden="true">${img('summon-halo','sh-halo')}${img('summon-halo','sh-halo back')}${img('summon-orb','sh-orb')}</div>
        <div class="summon-hero-body"><img class="art" src="${esc(url(show?.sheets?`show-${r.hero}-${form}`:'hero-'+r.hero))}" alt=""></div>
        <div class="summon-hero-sparkles" aria-hidden="true">${Array.from({length:10},(_,i)=>sprite('summon-sparkle','sh-spark',`--x:${[12,86,24,74,50,8,92,34,64,46][i]}%;--y:${[30,26,58,62,14,78,74,84,86,40][i]}%;--s:${[30,26,22,34,28,20,24,18,22,16][i]}px;--d:${-(i*.41).toFixed(2)}s`)).join('')}</div>
        <div class="summon-hero-name"><strong>${esc(H.name)}</strong></div>`;
      modal.append(stage);
      const body=stage.querySelector('.summon-hero-body');
      const asset=show?.sheets?show:A['hero-'+r.hero];
      window.GEMWOVEN_FORMS?.fitBody?.(body,asset,body.clientHeight*.86);
      const handle=show?.sheets?window.GemwovenHeroShow?.attach(body,r.hero,form):null;
      if(handle&&form>1&&r.hero!=='novice'){
        body.classList.add('has-hero-form');body.dataset.heroElement=r.hero;body.dataset.heroForm=form;
        if(form===3&&window.GemwovenFormEffects&&A['form-aura-'+r.hero]){const aura=document.createElement('span');aura.className='hero-form-effects';aura.setAttribute('aria-hidden','true');aura.innerHTML=window.GemwovenFormEffects.markup(r.hero,form,A['form-aura-'+r.hero]);body.append(aura);}
      }
      if(!reduced())play(stage,[{opacity:0},{opacity:1}],{duration:420,fill:'backwards'});
      Sound.play('hero',{volume:1,delay:reduced()?0:450});
      if(handle)setTimeout(()=>{if(stage.isConnected)handle.summon();},reduced()?0:450);
      else if(!reduced())play(body,[{transform:'scale(.6)',opacity:0,filter:'brightness(3)'},{transform:'scale(1)',opacity:1,filter:'none'}],{duration:900,easing:'cubic-bezier(.2,.9,.3,1)'});
      const close=()=>{if(!stage.isConnected)return;handle?.stop();stage.remove();heroStage=null;all.focus?.({preventScroll:true});};
      heroStage={stop(){handle?.stop();stage.remove();}};
      stage.addEventListener('click',close);
      stage.tabIndex=-1;stage.focus({preventScroll:true});stage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();close();}});
    }

    const observer=new ResizeObserver(()=>{if(!closed&&!deck.hidden)layout();});observer.observe(modal);
    modal.showModal();
    // The reveal opens from the player's own tap, so audio may start now.
    Sound.init();Sound.ambience(true);
    // Preload the premium art and any hero entrance so nothing pops in mid-reveal.
    for(const r of results)if(r.kind==='hero'){const G=window.GEMWOVEN_GAME,f=M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),s=A[`show-${r.hero}-${f}`]?.sheets;
      for(const src of [s?.entrance,s?.rift,s?.idle])if(src){const im=new Image();im.src=new URL(src,document.baseURI).href;}}
    if(reduced())start();else later(700,start);
  });
})();
