/* Motion painted into the hub backgrounds: waterfalls that really flow (a brightened copy of
 * the painted water, nudged down, shows through bands streaming downward), waterfall foam, birds, butterflies,
 * falling leaves, forge fire and the summon vortex (generated sprites in assets/gemwoven/ambient).
 * Coordinates are in the 941x1672 design space of each painted background. The layer sits
 * behind every control and never takes input. */
(() => {
  const A=window.GEMWOVEN_ASSETS;
  // flow: [x,y,w,h] painted water to set flowing; foam: [x,y,size]; fire: [x,y,size];
  // portal: [x,y,size,squash]; sparks: [x,y]; birds: lanes [y,duration s,delay s,scale,direction];
  // butterflies: [x,y,range]; leaves: [x,y] drop points.
  const SCENES={
    home:{
      flow:[[280,295,36,85],[518,405,52,95],[762,170,40,115],[352,820,96,385],[565,1150,56,110],[695,1050,70,155],[340,1370,92,230],[143,1395,108,100],[745,890,58,75]],
      foam:[[400,1195,96],[728,1200,90],[590,1258,70],[387,1590,110],[197,1488,90]],
      birds:[[150,15,0,1,1],[235,19,-7,.8,-1],[520,23,-14,.7,1]],
      butterflies:[[140,1520,70],[820,1400,60],[620,980,50]],
      leaves:[[150,120],[420,150],[860,420]]
    },
    summon:{
      flow:[[226,670,64,135],[458,742,46,115],[564,510,46,150],[724,208,62,115],[893,652,44,135]],
      portal:[[470,948,330,.34]],
      birds:[[180,18,-3,.75,1]],
      butterflies:[[90,1140,60],[860,1220,55]],
      leaves:[[120,90],[820,120]]
    },
    forge:{
      fire:[[818,555,118]],
      sparks:[[462,770]],
      birds:[[120,21,-9,.6,-1]],
      butterflies:[[150,1500,50]]
    },
    arena:{
      flow:[[30,812,64,190],[874,812,56,190],[312,1045,40,115],[598,1045,40,115],[668,1045,40,115]],
      fire:[[107,768,62],[834,768,62],[302,660,52],[639,660,52]],
      birds:[[130,17,-5,.7,1],[260,22,-12,.55,-1]],
      leaves:[[60,540],[900,600]]
    },
    shop:{birds:[[140,19,-4,.7,-1]],butterflies:[[160,1360,60],[790,1180,55]],leaves:[[880,300]]},
    upgrade:{birds:[[160,20,-6,.7,1]],butterflies:[[820,1450,55]],leaves:[[90,200]]},
    inventory:{butterflies:[[140,1500,50]],leaves:[[860,160]]},
    tavern:{butterflies:[[120,1480,50]],leaves:[[900,240]]}
  };
  const reduced=()=>document.body.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sprite=(name,cls,style)=>{
    const s=A['ambient-'+name];if(!s)return '';
    // Absolute URL: a url() inside a custom property resolves against the stylesheet otherwise.
    const url=new URL(s.file,document.baseURI).href.replace(/'/g,'%27');
    return `<i class="lm-sprite ${cls}" style="--sheet:url('${url}');--count:${s.count};--cycle:${s.count*s.frameDuration}ms;${style}"></i>`;
  };
  function markup(spec,background,theme){
    const out=[];
    for(const [x,y,w,h] of spec.flow||[]){
      const period=Math.max(26,Math.round(h/6)),bands=`repeating-linear-gradient(180deg,transparent 0px,#000 ${period*.35}px,#000 ${period*.5}px,transparent ${period*.85}px,transparent ${period}px)`;
      // Third layer: only painted water (export_water_masks.py), so rocks and leaves stay still.
      const water=A['ambient-water-'+theme],waterUrl=water?new URL(water.file,document.baseURI).href.replace(/'/g,'%27'):'';
      const mask=`radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%),${bands}`+(water?`,url('${waterUrl}')`:'');
      const size=`100% 100%,100% ${period}px`+(water?',941px 1672px':''),position=`0 0,0 0`+(water?`,${-x}px ${-y}px`:'');
      out.push(`<i class="lm-flow" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background-image:${background};background-position:${-x}px ${-y+3}px;-webkit-mask-image:${mask};mask-image:${mask};-webkit-mask-size:${size};mask-size:${size};-webkit-mask-position:${position};mask-position:${position};--period:${period}px;--water:${water?`${-x}px ${-y}px`:'0 0'}"></i>`);
    }
    for(const [x,y,size] of spec.foam||[])out.push(sprite('foam','lm-foam',`left:${x-size/2}px;top:${y-size*.62}px;width:${size}px;height:${size}px`));
    for(const [x,y,size] of spec.fire||[])out.push(sprite('forge','lm-fire',`left:${x-size/2}px;top:${y-size*.82}px;width:${size}px;height:${size}px`));
    for(const [x,y,size,squash] of spec.portal||[])out.push(sprite('portal','lm-portal',`left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;--squash:${squash}`));
    for(const [x,y] of spec.sparks||[])out.push(`<i class="lm-sparks" style="left:${x}px;top:${y}px">${Array.from({length:9},(_,i)=>`<b style="--a:${-160+i*17}deg;--d:${26+(i*13)%22}px;--t:${(i%3)*.04}s"></b>`).join('')}</i>`);
    for(const [y,duration,delay,scale,direction] of spec.birds||[])
      out.push(`<i class="lm-lane" style="top:${y}px;--dur:${duration}s;--delay:${delay}s;--dir:${direction}">${sprite('bird','lm-bird',`--scale:${scale}`)}</i>`);
    for(const [x,y,range] of spec.butterflies||[])out.push(`<i class="lm-wander" style="left:${x}px;top:${y}px;--range:${range}px;--delay:${-((x*3+y)%9)}s">${sprite('butterfly','lm-butterfly','')}</i>`);
    for(const [x,y] of spec.leaves||[])for(let i=0;i<2;i++)out.push(`<i class="lm-fall" style="left:${x+i*40}px;top:${y}px;--delay:${-(i*4.7+(x%5))}s;--drift:${i?-60:70}px">${sprite('leaf','lm-leaf',`--spin:${i?-1:1}`)}</i>`);
    return out.join('');
  }
  function mount(scene,state){
    scene.querySelector('.living-motion')?.remove();
    const theme=(window.GEMWOVEN_LAYOUT.screens[state.screen]?.backgroundKey)||state.screen,spec=SCENES[theme];
    if(!spec||reduced())return;
    const layer=document.createElement('div');layer.className='living-motion';layer.dataset.theme=theme;layer.setAttribute('aria-hidden','true');
    // The value sits inside a double-quoted style attribute: use single quotes in url().
    layer.innerHTML=markup(spec,(scene.style.backgroundImage||'none').replace(/"/g,"'"),theme);
    scene.prepend(layer);
  }
  window.GemwovenLivingMotion={mount,SCENES};
})();
