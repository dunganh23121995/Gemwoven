/* The reward transaction completes before this presentation starts: nothing here rolls, spends
 * or grants. Cards are dealt in reveal order (bronze first, gold next, diamond last, the whole
 * hero at the very end): each card is a star that spirals down a whirlwind from the sky (round
 * and round a funnel that narrows as it falls, far side small, dim and behind, near side big,
 * bright and in front), splashes into the lake and only then bounces up into its slot as a card.
 * Cards open by themselves as they land; a whole hero pauses the reveal: the screen darkens, a
 * beam of holy light comes down and the hero steps out (its own entrance, then its showcase loop)
 * until the player taps to go on. Gold and diamond cards shimmer.
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
  // The hero's height on its spotlight, as a share of what the stage allows.
  const SPOT_SIZE=.31;
  const cardType=r=>r.kind==='hero'||(weapon(r)&&RANK[r.rarity]>=4)?'diamond':r.kind==='fragments'||(weapon(r)&&RANK[r.rarity]>=2)?'gold':'bronze';
  const premium=r=>cardType(r)!=='bronze';
  // Reveal order: bronze by rarity, then gold (weapons, then fragments), then diamond with the
  // whole hero at the very end.
  const order=r=>({bronze:0,gold:10,diamond:20})[cardType(r)]+(r.kind==='hero'?9:r.kind==='fragments'?8:RANK[r.rarity]||0);
  const rewardArt=r=>r.kind==='hero'?'hero-'+r.hero:r.kind==='fragments'?(A['fragment-'+r.hero]?'fragment-'+r.hero:'portrait-'+r.hero)
    :r.kind==='gear'?M.SLOT_ART[r.gear.slot]:M.RESOURCES[r.resource]?.[1]||'summon-crystal';
  // A whole hero on its card: the first resting frame of the summoned form's showcase, cropped to its
  // figure, so every hero and form fills its card window at the same height.
  const heroCard=r=>{
    if(r.kind!=='hero')return '';
    const G=window.GEMWOVEN_GAME,form=r.form||M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),show=A[`show-${r.hero}-${form}`];
    const b=show?.sheets&&show.footBounds,src=b&&new URL(show.sheets.idle,document.baseURI).href;if(!src)return '';
    const w=b[2]-b[0],h=b[3]-b[1],cw=show.width,ch=show.height;
    return `<span class="card-reward card-hero" aria-hidden="true" style="aspect-ratio:${w}/${h};background-image:url('${src.replace(/'/g,'%27')}');background-size:${200*cw/w}% ${400*ch/h}%;background-position:${b[0]/(2*cw-w)*100}% ${b[1]/(4*ch-h)*100}%"></span>`;
  };
  // ---- sound: the hub's effects volume and mute (journey-ui.js) apply to every cue ----
  const SOUND_FILES=window.GEMWOVEN_SUMMON_SOUNDS||Object.fromEntries(['touch','gold','bell','hero','ult-charge','ult-whoosh','ambience','drone']
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
    // Beds under the reveal: a calm harmonium drone and, quieter, the night lake. They fade in
    // with the screen and out when it closes.
    beds:{},
    ambience(on){
      this.wantBed=on;
      for(const [name,vol] of [['drone',.45],['ambience',.3]]){
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
      <footer><div class="celestial-again" hidden></div></footer>`;
    document.body.append(modal);
    const deck=modal.querySelector('.celestial-deck'),fx=modal.querySelector('.celestial-fx:not(.back)'),fxBack=modal.querySelector('.celestial-fx.back'),againBox=modal.querySelector('.celestial-again'),status=modal.querySelector('.celestial-status'),
      skipButton=modal.querySelector('.celestial-skip');
    const reduced=()=>document.documentElement.classList.contains('reduced-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
    let opened=0,dealt=false,closed=false,completed=false,heroStage=null,again=0;const timers=[],flights=[],stars=new Set();
    const play=(el,frames,opts)=>el.animate?el.animate(frames,opts):null;
    const later=(ms,fn)=>timers.push(setTimeout(()=>{if(!closed)fn();},ms));
    function layout(){
      // Card size follows the free board area: 5 across on wide frames, 4 across on phones. When a
      // card is too narrow for a readable name on its plaque (under 12px), names sit under the cards.
      const box={width:deck.clientWidth,height:deck.clientHeight},n=results.length,cols=n<=1?1:modal.clientWidth<480?Math.min(4,n):Math.min(5,n),rows=Math.ceil(n/cols),gap=n>1?9:0;
      const fit=label=>Math.min(n<=1?190:150,(box.width-gap*(cols-1))/cols,(box.height-gap*(rows-1)-rows*label)/rows*.52);
      let width=fit(0),below=n>1&&width*.105<12;if(below)width=fit(34);
      deck.style.setProperty('--cols',cols);deck.style.setProperty('--cw',Math.max(40,Math.floor(width))+'px');deck.dataset.names=below?'below':'plaque';
      deck.style.rowGap=(below?34+gap:gap)+'px';
      // Centre a short last row.
      const last=n%cols;cards.forEach((c,i)=>{c.style.gridColumnStart=last&&i===n-last?String(Math.floor((cols-last)/2)+1):'';});
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
        <span class="celestial-front" aria-hidden="true"><span class="card-window">${img('summon-back-'+art,'card-panel')}${heroCard(r)||img(rewardArt(r),'card-reward')}</span>${img('summon-front-'+art,'card-art')}${shine}<strong>${esc(r.name)}</strong></span></span>${top?`<span class="card-sparkles" aria-hidden="true">${sparkles(4)}</span>`:''}`;
      card.onclick=()=>{if(completed&&isHero(r))spotlight(r);};deck.append(card);return card;
    });
    // Cards open on their own as they land: bronze at once, gold and diamond with their shimmer
    // and a soft bowl or bell. A whole hero opens into its spotlight (see run()).
    function open(card,r,{quiet=false}={}){
      if(card.classList.contains('is-open'))return;
      card.classList.add('is-open');card.setAttribute('aria-pressed','true');
      card.setAttribute('aria-label',r.name+' · '+M.RARITIES[r.rarity].name);
      card.querySelector('.celestial-front').setAttribute('aria-hidden','false');card.querySelector('.celestial-back').setAttribute('aria-hidden','true');
      opened++;status.textContent=`Đã mở ${opened} / ${results.length} thẻ`;
      const kind=card.dataset.card;
      if(!quiet&&kind!=='bronze'){Sound.play(kind==='diamond'?'bell':'gold',{volume:1,pan:panOf(card)*.6});if(!reduced())later(380,()=>burst(card,kind==='diamond'?8:6));}
    }
    // Everything is open: summon again (x1 / x10) with the cost the main buttons would charge; the
    // reveal closes and the normal confirmation runs (progression-ui.js), so nothing is spent here.
    function offerAgain(){
      const G=window.GEMWOVEN_GAME;if(!G?.engine?.summonQuote)return;
      againBox.replaceChildren(...[1,10].map(count=>{
        let q;try{q=G.engine.summonQuote(count);}catch{return document.createTextNode('');}
        const b=document.createElement('button');b.type='button';b.className='gw-btn celestial-again-btn';b.disabled=!q.enough;b.dataset.count=count;
        const cost=q.enough?q.cost:count;b.innerHTML=`<span>Triệu hồi ×${count}</span><small>${img(q.payment==='gems'?'mana':'ticket','again-cost')}${cost}</small>`;
        b.setAttribute('aria-label',`Triệu hồi tiếp ${count} lần, ${q.enough?cost+(q.payment==='gems'?' Đá Ngọc':' vé'):'chưa đủ tài nguyên'}`);
        b.onclick=()=>{again=count;modal.close();};return b;
      }));
      againBox.hidden=false;
    }
    // Rects in the modal's own layout pixels (the modal is a phone-sized frame scaled to the screen).
    const inModal=el=>{const m=modal.getBoundingClientRect(),c=el.getBoundingClientRect(),k=modal.offsetWidth/(m.width||1);
      return {W:modal.offsetWidth,H:modal.offsetHeight,x:(c.left-m.left)*k,y:(c.top-m.top)*k,w:c.width*k,h:c.height*k};};
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
      const c=inModal(card);
      fxAt(img('summon-halo','sm-flash')+Array.from({length:n},(_,i)=>sprite('summon-sparkle','sm-fly',`--a:${i*360/n+15}deg;--r:${c.w*.75}px;--s:${18+i%3*6}px`)).join(''),
        c.x+c.w/2,c.y+c.h/2,1100);
    }
    // ---- dealing: a star falls from the sky on its own curved, twisting path ----
    const seeded=seed=>()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
    function fall(card,index){return new Promise(resolve=>{
      const kind=card.dataset.card,top=card.dataset.tier==='premium',c=inModal(card);
      const W=c.W,H=c.H,cx=c.x+c.w/2,cy=c.y+c.h/2,rnd=seeded(index*7919+results.length*31+1);
      // A whirlwind: the star circles a vertical axis while it falls (half a wide loop to one loop); the funnel is wide in the sky
      // and narrows to the splash point on the lake (the axis drifts there too). sin(angle) is depth:
      // near (+1) is lower, bigger, brighter and in front; far (-1) is higher, smaller, dimmer,
      // blurred and behind the board.
      const I=[cx+(W*.5-cx)*.2+(rnd()-.5)*W*.06,H*(.875+(rnd()-.5)*.03)],top0=-H*.03;
      const axis0=W*(.5+(rnd()-.5)*.12),R0=W*(.4+rnd()*.06),R1=W*.05,turns=.5+rnd()*.5,phase=rnd()*Math.PI*2,spin=index%3===1?-1:1;
      // Slow and gentle: a bronze star takes over four seconds to come down.
      const dur=kind==='diamond'?4600:top?4500:4300,size=kind==='diamond'?58:top?50:44;
      const star=document.createElement('span');star.className=`sm-falling star-${kind}`;star.setAttribute('aria-hidden','true');
      star.innerHTML=img('summon-halo','sm-falling-halo')+sprite('summon-sparkle','sm-falling-core');
      star.style.setProperty('--s',size+'px');fx.append(star);
      const t0=performance.now();let raf=0,last=null,done=false,behind=false;
      const at=u=>{
        const fallT=Math.pow(u,1.1),r=R1+(R0-R1)*Math.pow(1-u,1.15);
        const th=phase+spin*turns*Math.PI*2*u,depth=Math.sin(th),ax=axis0+(I[0]-axis0)*Math.pow(u,1.6);
        return {x:ax+r*Math.cos(th),y:top0+(I[1]-top0)*fallT+r*.5*depth,depth,u};
      };
      const handle={stop(){if(done)return;done=true;cancelAnimationFrame(raf);star.remove();stars.delete(handle);}};stars.add(handle);
      function frame(now){
        if(closed||dealt){handle.stop();resolve();return;}
        const u=Math.min(1,(now-t0)/dur),{x,y,depth}=at(u),near=(depth+1)/2,grow=(.5+.5*u)*(.7+.5*near);
        // The far half of each loop passes behind the board; the near half in front of it.
        const back=depth<-.15&&u<.9;if(back!==behind){behind=back;(back?fxBack:fx).append(star);}
        star.style.transform=`translate(${x}px,${y}px) scale(${grow.toFixed(3)})`;
        // Far side: smaller, dimmer and a touch soft, but always clearly visible.
        star.style.opacity=(.68+.32*near).toFixed(2);star.style.filter=near<.35?`blur(${((.35-near)*2).toFixed(1)}px)`:'';star.style.zIndex=Math.round(near*100);
        // A soft streak behind the star draws the whirlwind's spiral and fades away.
        if(u<.97){if(last)trail(last,[x,y],size*grow*(top?.5:.42),kind,near,back);last=[x,y];}
        if(u<1){raf=requestAnimationFrame(frame);return;}
        handle.stop();splash(I[0],I[1],Math.max(80,c.w*(kind==='diamond'?2.3:top?1.9:1.5)),kind==='diamond'?7:top?4:0);
        Sound.play('touch',{volume:top?1:.7,pan:(I[0]/W-.5)*.8});
        rise(card,I[0]-cx,I[1]-cy,kind).then(resolve);
      }
      raf=requestAnimationFrame(frame);
    });}
    // Star trails: soft, blurred streaks painted on one canvas behind the board and one in front of it,
    // fading out as the star moves on (the canvas keeps the modal's own layout pixels).
    const TRAIL={bronze:'190,222,255',gold:'255,214,130'},trails=new Map();let trailRaf=0,trailUntil=0;
    function trailCanvas(layer){
      let t=trails.get(layer);if(t?.cv.isConnected)return t;
      const cv=document.createElement('canvas');cv.className='sm-streaks';cv.setAttribute('aria-hidden','true');layer.prepend(cv);
      const k=modal.getBoundingClientRect().width/(modal.offsetWidth||1)*(devicePixelRatio||1);
      cv.width=Math.round(modal.offsetWidth*k);cv.height=Math.round(modal.offsetHeight*k);
      const ctx=cv.getContext('2d');ctx.setTransform(k,0,0,k,0,0);ctx.lineCap='round';
      t={cv,ctx};trails.set(layer,t);return t;
    }
    function fadeTrails(now,prev=now){
      // About a tenth of a streak is left after a second.
      const keep=Math.pow(.1,Math.min(100,now-prev)/1000);
      for(const {cv,ctx} of trails.values()){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='destination-out';
        ctx.fillStyle=`rgba(0,0,0,${1-keep})`;ctx.fillRect(0,0,cv.width,cv.height);ctx.restore();}
      trailRaf=now<trailUntil&&!closed?requestAnimationFrame(t=>fadeTrails(t,now)):0;
    }
    function trail(from,to,size,kind,near=1,back=false){
      const {ctx}=trailCanvas(back?fxBack:fx),o=.6+.4*near;
      // Diamond trails run through the rainbow, like the star's own prism.
      const glow=a=>TRAIL[kind]?`rgba(${TRAIL[kind]},${a})`:`hsla(${Math.round(performance.now()/5%360)},95%,78%,${a})`;
      ctx.save();ctx.globalCompositeOperation='lighter';
      // A wide soft glow, then a thinner bright core.
      ctx.filter=`blur(${Math.max(2,size*.12).toFixed(1)}px)`;ctx.strokeStyle=glow((.42*o).toFixed(2));ctx.lineWidth=Math.max(6,size*.55);
      ctx.beginPath();ctx.moveTo(...from);ctx.lineTo(...to);ctx.stroke();
      ctx.filter=`blur(${Math.max(1,size*.05).toFixed(1)}px)`;ctx.strokeStyle=`rgba(255,255,255,${(.5*o).toFixed(2)})`;ctx.lineWidth=Math.max(2,size*.16);
      ctx.beginPath();ctx.moveTo(...from);ctx.lineTo(...to);ctx.stroke();ctx.restore();
      trailUntil=performance.now()+2200;if(!trailRaf)trailRaf=requestAnimationFrame(t=>fadeTrails(t));
    }
    // From the splash the card bounces up out of the water into its slot.
    function rise(card,dx,dy,kind){return new Promise(resolve=>{
      const top=kind!=='bronze',dur=kind==='diamond'?1150:top?1050:950;
      card.classList.remove('is-waiting');card.classList.add('is-flying');
      const anim=play(card,[
        {transform:`translate(${dx}px,${dy}px) scale(.3)`,opacity:0,filter:'brightness(2.2)'},
        {transform:`translate(${dx*.5}px,${dy*.45}px) scale(.8)`,opacity:1,filter:'brightness(1.6)',offset:.35,easing:'cubic-bezier(.2,.7,.3,1)'},
        {transform:'translateY(-24px) scale(1.07)',opacity:1,filter:'brightness(1.3)',offset:.7,easing:'ease-in-out'},
        {transform:'translateY(6px) scale(.97)',opacity:1,filter:'brightness(1)',offset:.86},
        {transform:'none',opacity:1,filter:'none'}],{duration:dur,fill:'backwards'});
      if(anim)flights.push(anim);
      const land=()=>{if(card.classList.contains('is-landed'))return;card.classList.remove('is-flying');card.classList.add('is-landed');resolve();};
      if(anim)anim.onfinish=land;else later(dur,land);
    });}
    const isHero=r=>r.kind==='hero'&&cardType(r)==='diamond';
    const wait=ms=>new Promise(res=>later(ms,res));
    const suspense=()=>{modal.classList.add('is-suspense');status.textContent='Mặt hồ rung động… ánh sáng lạ đang tụ lại!';};
    function complete(){
      if(completed||closed)return;completed=true;dealt=true;
      modal.classList.remove('is-suspense');skipButton.hidden=true;modal.dataset.phase='complete';
      status.textContent='Tinh tú đã tìm được chủ nhân';offerAgain();
    }
    // "Bỏ qua": everything opens at once and the board shows; a hero can be tapped to see it again.
    function skip(){
      if(completed||closed)return;dealt=true;timers.forEach(clearTimeout);timers.length=0;stars.forEach(st=>st.stop());
      flights.forEach(a=>a.playState!=='finished'&&a.finish());fx.replaceChildren();fxBack.replaceChildren();heroStage?.stop();heroStage=null;
      cards.forEach((card,i)=>{card.classList.remove('is-waiting','is-flying');card.classList.add('is-landed');open(card,results[i],{quiet:true});});
      complete();
    }
    // The reveal plays by itself: bronze stars first, a pause of suspense, gold and diamond stars
    // one by one, each card opening as it lands. A whole hero comes last, alone, and its
    // spotlight waits for the player's tap before the reveal goes on.
    async function run(){
      deck.hidden=false;layout();modal.dataset.phase='falling';
      const heroes=cards.map((c,i)=>i).filter(i=>isHero(results[i])),rest=cards.map((c,i)=>i).filter(i=>!heroes.includes(i));
      if(reduced()){
        // Reduced motion: no fall or splash; cards appear opened, a hero still gets its spotlight.
        cards.forEach(c=>{c.classList.remove('is-waiting');c.classList.add('is-landed');});
        rest.forEach(i=>open(cards[i],results[i],{quiet:true}));
        for(const i of heroes){open(cards[i],results[i],{quiet:true});await spotlight(results[i]);}
        complete();return;
      }
      status.textContent='Những lá bài rơi xuống mặt hồ…';
      // Each star still falls slowly, but they overlap: bronze about every 0.6 s, a short beat of
      // suspense, then gold and diamond about every 0.9 s; a ten-pull reaches the hero in ~13 s.
      let t=300;const firstTop=cards.findIndex(c=>c.dataset.tier==='premium'),others=[],heroLandings=[];
      cards.forEach((card,i)=>{
        const top=card.dataset.tier==='premium',hero=heroes.includes(i);
        if(i===firstTop){later(Math.max(0,t-500),suspense);t+=i?800:400;}
        const landed=new Promise(res=>later(t,()=>fall(card,i).then(res)));
        if(hero)heroLandings.push([i,landed]);
        else others.push(landed.then(()=>{if(dealt)return;if(!top)open(card,results[i]);else later(250,()=>open(card,results[i]));}));
        t+=top?900:600;
      });
      await Promise.all(others);
      for(const [i,landed] of heroLandings){
        await landed;if(dealt)return;
        open(cards[i],results[i],{quiet:true});
        await spotlight(results[i]);if(dealt)return;
      }
      await wait(heroes.length?150:500);complete();
    }
    skipButton.onclick=e=>{e.stopPropagation();skip();};

    // ---- the whole hero steps out: the screen darkens, a beam of holy light comes down, and the
    // hero plays its own summoning entrance and then its showcase loop until the player taps ----
    function spotlight(r){return new Promise(resolve=>{
      if(closed){resolve();return;}heroStage?.stop();
      const G=window.GEMWOVEN_GAME,form=r.form||M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),show=A[`show-${r.hero}-${form}`],H=M.HEROES[r.hero];
      const stage=document.createElement('div');stage.className='summon-hero-stage';stage.setAttribute('role','dialog');stage.setAttribute('aria-label',`${H.name} · ${H.title}`);
      const pool=A['summon-beam']?.pool||.93;stage.style.setProperty('--pool',pool);
      stage.innerHTML=`<div class="summon-hero-dim" aria-hidden="true"></div>${img('summon-beam','sh-beam')}
        <div class="summon-hero-light" aria-hidden="true">${img('summon-halo','sh-halo back')}${img('summon-orb','sh-orb')}</div>
        <div class="summon-hero-body"><img class="art" src="${esc(url(show?.sheets?`show-${r.hero}-${form}`:'hero-'+r.hero))}" alt=""></div>
        <div class="summon-hero-sparkles" aria-hidden="true">${Array.from({length:10},(_,i)=>sprite('summon-sparkle','sh-spark',`--x:${[22,78,30,70,50,16,84,36,62,46][i]}%;--y:${[30,26,48,52,14,58,62,40,36,20][i]}%;--s:${[30,26,22,34,28,20,24,18,22,16][i]}px;--d:${-(i*.41).toFixed(2)}s`)).join('')}</div>
        <div class="summon-hero-name"><strong>${esc(H.name)}</strong></div>`;
      modal.append(stage);
      const body=stage.querySelector('.summon-hero-body');
      const asset=show?.sheets?show:A['hero-'+r.hero];
      // Never larger than the drawing itself, so the painted art stays crisp.
      const native=[asset?.bodyPx].filter(Boolean);
      // Shown a size smaller than the stage allows, so the hero stands inside the beam with room around it.
      const bodyHeight=Math.min(body.clientHeight*.86*SPOT_SIZE,...native);
      // Every hero and form stands at this one height, measured on the figure itself (crown to soles,
      // head-scale.json bodyPx), not on its drawing's box nor on the head (no headFit here): the
      // combat sheets of the duel below are sized the same way, so the hero never jumps in size.
      const figure=asset?.bodyPx&&asset.bodyAnchor?asset.bodyPx/(asset.height*(asset.bodyAnchor.foot-asset.bodyAnchor.crown)):1;
      window.GEMWOVEN_FORMS?.fitBody?.(body,asset,bodyHeight/figure/(asset?.headFit||1));
      {const sh=stage.clientHeight||1,feet=body.offsetTop+body.offsetHeight,beamTop=feet-.7*sh*pool,toBeam=y=>((y-beamTop)/(.7*sh)*100).toFixed(1)+'%';
        stage.style.setProperty('--beam-head',toBeam(feet-bodyHeight*1.08));stage.style.setProperty('--beam-feet',toBeam(feet-bodyHeight*.12));}
      const handle=show?.sheets?window.GemwovenHeroShow?.attach(body,r.hero,form):null;
      if(handle&&form>1&&r.hero!=='novice'){
        body.classList.add('has-hero-form');body.dataset.heroElement=r.hero;body.dataset.heroForm=form;
        if(form===3&&window.GemwovenFormEffects&&A['form-aura-'+r.hero]){const aura=document.createElement('span');aura.className='hero-form-effects';aura.setAttribute('aria-hidden','true');aura.innerHTML=window.GemwovenFormEffects.markup(r.hero,form,A['form-aura-'+r.hero]);body.append(aura);}
      }
      const calm=reduced(),stepIn=calm?0:1300;
      if(!calm)body.style.opacity='0';
      Sound.play('hero',{volume:1});Sound.play('bell',{volume:.55,delay:stepIn});
      const timersHere=[];
      // Once the summoning entrance has fully played out, it performs its ultimate once (or, without
      // one, one of its showcase actions), then rests in its showcase loop.
      const afterEntrance=()=>timersHere.push(setTimeout(()=>{if(!stage.isConnected||calm)return;
        duel(stage,body,{hero:r.hero,form,bodyHeight},timersHere);},300));
      // The beam lands first; then the hero steps out of it.
      timersHere.push(setTimeout(()=>{if(!stage.isConnected)return;body.style.opacity='';if(handle){handle.summon(afterEntrance);return;}
        if(!calm)play(body,[{transform:'scale(.6)',opacity:0,filter:'brightness(3)'},{transform:'scale(1)',opacity:1,filter:'none'}],{duration:900,easing:'cubic-bezier(.2,.9,.3,1)'});
        timersHere.push(setTimeout(afterEntrance,calm?0:900));},stepIn));
      let ready=false;timersHere.push(setTimeout(()=>{ready=true;},calm?0:stepIn+700));
      const done=()=>{timersHere.forEach(clearTimeout);handle?.stop();fight?.frame.getAnimations().forEach(a=>a.cancel());stage.remove();if(heroStage?.stage===stage)heroStage=null;resolve();};
      heroStage={stage,stop:done};
      const go=()=>{if(!ready||!stage.isConnected)return;if(calm){done();return;}
        const fade=play(stage,[{opacity:1},{opacity:0}],{duration:350,fill:'forwards'});if(fade)fade.onfinish=done;else done();};
      stage.addEventListener('click',go);
      stage.tabIndex=-1;stage.focus({preventScroll:true});stage.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});
    });}

    // ---- after the entrance: the hero moves left in its own way (its combat run, or hover for the
    // floating heroes) to its place in a fight, where the slime, the default foe, waits on the right; it
    // performs its real combat ultimate there, every effect and sound of the fight (Game.html in
    // showcase mode, summon-showcase.js, laid over the spotlight so its hero stands exactly on this
    // one), then goes back to the middle. Combat sheets stand at the showcase body's height. ----
    function combatSprite(body,sheet,bodyHeight){
      const A=bodyHeight*sheet.cellPx/(sheet.bodyPx||180),W=A*sheet.scale;
      const el=document.createElement('span');el.className='sh-combat';el.setAttribute('aria-hidden','true');
      el.style.cssText=`width:${W}px;height:${W}px;left:calc(50% - ${W/2}px);bottom:${-W*(1-sheet.footY)}px;background-image:url('${new URL(sheet.file,document.baseURI).href}');background-size:${sheet.cols*100}% ${sheet.rows*100}%`;
      const frame=i=>{i%=sheet.count;el.style.backgroundPosition=`${(i%sheet.cols)/(sheet.cols-1||1)*100}% ${Math.floor(i/sheet.cols)/(sheet.rows-1||1)*100}%`;};
      frame(0);body.append(el);return {el,frame};
    }
    // One fight page per reveal, loaded with the first hero and reused by every spotlight (moving a
    // frame in the page would reload it). It stays transparent and lets taps through to the spotlight.
    let fight=null;
    function fightFrame(){
      if(fight)return fight;
      const frame=document.createElement('iframe');frame.className='summon-fight';frame.title='';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;frame.allow='autoplay';
      frame.src=new URL('Game.html?qa&showcase',document.baseURI).href;modal.append(frame);
      const ready=new Promise(done=>frame.addEventListener('load',()=>{const s=frame.contentWindow?.gemwovenShowcase;if(s)s.ready.then(()=>done(s));else done(null);},{once:true}));
      fight={frame,ready:Promise.race([ready,new Promise(done=>setTimeout(()=>done(null),15000))])};return fight;
    }
    function duel(stage,body,o,timersHere){
      const at=(ms,fn)=>timersHere.push(setTimeout(()=>{if(stage.isConnected)fn();},ms));
      const move=A[`cmove-${o.hero}-${o.form}`],H=o.bodyHeight,{frame,ready}=fightFrame();
      const shown=()=>[...body.querySelectorAll('.hero-show,.art')];
      // Layout units of the stage (the hub may scale the whole scene with a transform); k converts
      // screen pixels to them. The fight frame lies on the stage in the same units.
      const sb=stage.getBoundingClientRect(),bb=body.getBoundingClientRect(),k=stage.offsetWidth/(sb.width||1);
      const SW=stage.offsetWidth,feet=(bb.bottom-sb.top)*k,cx=(bb.left-sb.left+bb.width/2)*k;
      // Moves from x `from` to `to` (and from size `s0` to `s1`, about the feet) with the hero's own
      // combat run or hover; faces back when moving left.
      function walk(from,to,s0,s1,ms,done){
        const parts=shown(),place=e=>{body.style.translate=`calc(-50% + ${from+(to-from)*e}px) 0`;body.style.scale=String(s0+(s1-s0)*e);};
        body.style.transformOrigin='50% 100%';
        if(!move||reduced()){place(1);done();return;}
        parts.forEach(el=>el.style.visibility='hidden');
        const s=combatSprite(body,move,H);if(to<from)s.el.style.transform='scaleX(-1)';
        const t0=performance.now();
        const tick=now=>{const k=Math.min(1,(now-t0)/ms),e=k*k*(3-2*k);s.frame(Math.floor((now-t0)/(move.ms||100)));place(e);
          if(k<1&&s.el.isConnected)requestAnimationFrame(tick);else{s.el.remove();parts.forEach(el=>el.style.visibility='');done();}};
        requestAnimationFrame(tick);
      }
      ready.then(show=>{if(!stage.isConnected||!show||!move)return;
        // The hero's combat idle cell on the spotlight (the box the fight page draws it in): the move
        // sheet's cell without its own scale, standing on the same feet.
        const boxW=H*move.cellPx/(move.bodyPx||180),below=boxW*(1-.94);
        // The fight page in its phone layout, stretched over the whole card, its hero and slime sized to
        // the spotlight hero (or the hero shrinks to fit the fight on a narrow card); the hero steps into it.
        const Wn=420,s=SW/Wn;let box;
        try{show.act(false);frame.style.width=Wn+'px';frame.style.height=stage.offsetHeight/s+'px';show.size(1);box=show.stage(o.hero,o.form);
          box=show.size(Math.min(1,boxW/(box.width*s)));}   // the fight's hero at the spotlight hero's size (never larger)
        catch{return;}   // the page is still busy with an ultimate the player skipped
        const f=Math.min(1,box.width*s/boxW),dx=(box.left+box.width/2)*s-cx;
        frame.style.transform=`scale(${s})`;frame.style.left='0';frame.style.top=feet+below*f-(box.top+box.height)*s+'px';
        play(frame,[{opacity:0},{opacity:1}],{duration:500,fill:'forwards'});stage.classList.add('dueling');
        walk(0,dx,1,f,900,()=>{
          // The fight page's hero takes over in the same spot for the ultimate.
          body.style.visibility='hidden';show.act(true);
          at(350,()=>Promise.resolve(show.play()).catch(()=>{}).then(()=>at(500,()=>{
            body.style.visibility='';show.act(false);
            play(frame,[{opacity:1},{opacity:0}],{duration:400,fill:'forwards'});
            walk(dx,0,f,1,900,()=>stage.classList.remove('dueling'));
          })));
        });
      });
    }

    const observer=new ResizeObserver(()=>{if(!closed&&!deck.hidden&&(completed||modal.dataset.phase==='sky'))layout();});observer.observe(modal);
    modal.showModal();
    // The reveal opens from the player's own tap, so audio may start now.
    Sound.init();Sound.ambience(true);
    // Preload the premium art and any hero entrance so nothing pops in mid-reveal.
    if(!reduced()&&results.some(r=>r.kind==='hero'))fightFrame();
    for(const r of results)if(r.kind==='hero'){const G=window.GEMWOVEN_GAME,f=r.form||M.heroForm(r.hero,G?.engine?.read?.().heroes?.[r.hero]),s=A[`show-${r.hero}-${f}`]?.sheets;
      for(const src of [s?.entrance,s?.rift,s?.idle])if(src){const im=new Image();im.src=new URL(src,document.baseURI).href;}}
    if(reduced())run();else later(400,run);
  });
})();
