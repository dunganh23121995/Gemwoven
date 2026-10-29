/* Motion painted into the hub backgrounds: waterfalls that really flow (a brightened copy of
 * the painted water, nudged down, shows through bands streaming downward), waterfall foam, birds, butterflies,
 * falling leaves, forge fire and the summon vortex (generated sprites in assets/gemwoven/ambient).
 * The same motion lives in each hero's realm on the summon spotlight (REALMS, realm()): its
 * waterfalls or lava falls flow, lanterns and runes flicker, lava, aurora or sunlight breathe
 * (a brightened copy of the painting through its glow masks), the aurora waves, the storm vortex
 * turns and lightning strikes, smoke and clouds drift, birds, crows and butterflies pass.
 * Coordinates are in the 941x1672 design space of each painted background. The layer sits
 * behind every control and never takes input. */
(() => {
  const A=window.GEMWOVEN_ASSETS;
  // flow: [x,y,w,h] painted water to set flowing; foam: [x,y,size]; fire: [x,y,size];
  // portal: [x,y,size,squash]; sparks: [x,y]; birds: lanes [y,duration s,delay s,scale,direction];
  // butterflies: [x,y,range]; leaves: [x,y] drop points; glows: [x,y,size,'r,g,b'] flickering lights;
  // crows: lanes like birds, dark; pulse: the glow masks'
  // two halves breathe out of phase ('deep': they dim as well as brighten); vortex: [x,y,radius,s per
  // turn] the painted sky turning; wisps: [x,y,width,variant,'r,g,b',opacity,drift px,s] smoke and
  // cloud drifting (summon-wisps); rise: [x,y,width,'r,g,b',opacity] smoke rising; bolts: [x,y,height,
  // variant,period s,delay s] lightning strikes with a flash (summon-bolts); flames: [x,y,size]
  // lantern flames; aurora: [y,width,opacity] ribbons, and the painted aurora waves through its mask.
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
      // Summon light (assets/gemwoven/summon): turning rays on the crowning gem and the portal,
      // sparkles on gems and crystals, motes of light rising from the portal.
      rays:[[470,150,250,.55],[470,930,300,.4],[765,722,110,.5]],
      twinkles:[[470,118,87],[438,170,57],[503,182,49],[810,888,76],[858,915,57],[838,858,46],[765,712,65],[325,1128,53],[615,1128,53],[470,1062,57],[155,650,57],[592,370,42],[396,1000,49],[548,1004,46],[120,470,42],[700,90,46]],
      motes:[[430,950],[470,940],[510,955],[450,965],[495,935],[470,975]],
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
  // The heroes' realms on the summon spotlight (assets/gemwoven/summon/scenes-detail; water and
  // glow masks from export_scene_masks.py).
  const REALMS={
    earth:{
      flow:[[62,565,42,135],[246,662,36,62],[262,728,52,95],[325,615,28,90],[400,755,32,75],[585,520,70,140]],
      foam:[[287,822,60],[416,828,40]],
      wisps:[[640,90,300,3,'255,250,235',.3,70,40],[300,800,360,0,'235,245,230',.3,50,26],[620,745,320,0,'235,245,230',.28,-50,30]],
      birds:[[150,17,-2,.8,1],[260,22,-11,.6,-1]],
      butterflies:[[140,1150,60],[800,1200,55],[690,850,45]],
      pulse:true
    },
    fire:{
      flow:[[330,722,55,140],[735,600,32,100]],
      glows:[[85,445,120,'255,170,80'],[180,540,90,'255,170,80'],[890,565,110,'255,170,80'],[825,625,80,'255,170,80'],[84,1080,140,'255,160,70'],[867,1150,130,'255,160,70']],
      flames:[[85,452,30],[180,545,24],[890,572,28],[825,630,22],[84,1090,36],[867,1160,34]],
      pulse:'deep',
      rise:[[250,1010,280,'160,135,120',.45],[700,1080,300,'160,135,120',.45],[480,1240,320,'150,125,110',.4],[150,1290,280,'150,125,110',.42],[800,1340,300,'150,125,110',.4],[560,690,240,'170,130,110',.38],[330,640,220,'170,130,110',.35]]
    },
    ice:{
      aurora:[[80,1150,.2],[150,1000,.14]],
      wisps:[[200,330,360,3,'220,235,255',.3,60,40],[800,360,340,1,'210,225,250',.28,-60,44],[300,830,500,0,'225,240,255',.35,80,30],[700,880,460,0,'210,230,255',.3,-80,34]],
      flow:[[395,575,90,110],[480,570,65,110],[790,620,55,130]],
      twinkles:[[120,175,60],[185,240,40],[787,270,45],[30,690,45],[75,725,40],[880,705,45],[910,760,40],[230,690,40]],
      glows:[[480,205,520,'200,225,255']],
      pulse:true
    },
    lightning:{
      vortex:[556,256,330,150],
      wisps:[[150,420,420,1,'200,190,255',.35,80,38],[780,380,380,3,'200,190,255',.32,-70,42],[300,720,460,0,'215,205,255',.45,90,30],[700,690,420,3,'215,205,255',.4,-80,34],[480,800,380,1,'200,190,250',.35,60,42],[470,1330,420,0,'210,200,255',.4,70,28]],
      bolts:[[230,0,560,0,7.5,-2],[760,80,520,3,9.7,-6.1],[600,330,330,2,12.3,-9],[380,40,480,1,15.1,-12]],
      flow:[[250,500,22,60],[355,545,16,50],[478,715,28,65],[662,592,16,55]],
      twinkles:[[55,515,55],[172,605,40],[55,745,55],[778,655,40],[887,790,55],[275,325,35]],
      glows:[[100,262,130,'150,190,255'],[875,605,120,'150,190,255'],[755,612,80,'150,190,255']],
      pulse:true
    },
    shadow:{
      // Black clouds sail across the moon and black fog rolls over the courtyard (passing wisps), black smoke rises from the ruins.
      wisps:[[600,200,440,0,'14,10,18',.55,520,26],[350,320,400,3,'10,8,14',.5,-480,32],[780,110,380,1,'14,10,18',.45,-460,36],
        [250,870,640,0,'8,6,12',.6,420,20],[700,935,600,0,'8,6,12',.55,-420,24],[470,1015,660,3,'6,5,10',.5,380,28],[220,1130,600,0,'6,5,10',.45,-360,25]],
      flow:[[385,640,55,150],[575,712,32,90],[690,555,26,85],[750,510,22,60]],
      glows:[[765,478,130,'255,90,100']],
      crows:[[190,24,-6,.7,-1],[260,29,-18,.55,1]],
      rise:[[230,790,250,'10,8,14',.5],[720,770,240,'10,8,14',.45],[120,985,270,'8,6,12',.45],[840,1000,270,'8,6,12',.45],[480,650,230,'12,10,16',.4]],
      pulse:true
    }
  };
  const reduced=()=>document.body.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const sprite=(name,cls,style)=>{
    const s=A['ambient-'+name];if(!s)return '';
    // Absolute URL: a url() inside a custom property resolves against the stylesheet otherwise.
    const url=new URL(s.file,document.baseURI).href.replace(/'/g,'%27');
    return `<i class="lm-sprite ${cls}" style="--sheet:url('${url}');--count:${s.count};--cycle:${s.count*s.frameDuration}ms;${style}"></i>`;
  };
  function markup(spec,background,waterKey,glowKeys=[]){
    const out=[],light=key=>A[key]?new URL(A[key].file,document.baseURI).href.replace(/'/g,'%27'):'',glows=glowKeys.filter(k=>A[k]);
    const masked=(key,cls,style='')=>`<i class="${cls}" style="background-image:${background};-webkit-mask-image:url('${light(key)}');mask-image:url('${light(key)}');${style}"></i>`;
    // The sky first: the turning vortex, the waving aurora, drifting clouds, lightning.
    if(spec.vortex){const [x,y,r,turn]=spec.vortex;out.push(`<i class="lm-vortex" style="left:${x-r}px;top:${y-r}px;width:${2*r}px;height:${2*r}px;background-image:${background};background-position:${r-x}px ${r-y}px;--turn:${turn}s"></i>`);}
    if(spec.aurora){
      spec.aurora.forEach(([y,w,o],i)=>{if(A['summon-aurora'])out.push(`<img class="lm-ribbon" src="${light('summon-aurora')}" alt="" style="left:${470-w/2}px;top:${y}px;width:${w}px;--o:${o};--delay:${-i*13}s${i%2?';scale:-1 1':''}">`);});
      glows.forEach((k,i)=>out.push(masked(k,'lm-aurora',`--delay:${-i*3.7}s`)));
    }
    const wisp=(cls,x,y,w,v,rgb,o,style)=>{const s=A['summon-wisps'];if(!s)return;const h=w*s.height/(s.width/s.count);
      out.push(`<i class="${cls}" style="left:${x-w/2}px;top:${y-h/2}px;width:${w}px;height:${h}px;--c:${rgb};--o:${o};-webkit-mask-image:url('${light('summon-wisps')}');mask-image:url('${light('summon-wisps')}');-webkit-mask-position:${v/(s.count-1)*100}% 0;mask-position:${v/(s.count-1)*100}% 0;${style}"></i>`);};
    // A long drift (250 px or more) passes across and fades at both ends; a short one sways to and fro.
    spec.wisps?.forEach(([x,y,w,v,rgb,o,dx,dur],i)=>wisp(Math.abs(dx)>=250?'lm-wisp lm-pass':'lm-wisp',x,y,w,v,rgb,o,`--dx:${dx}px;--dur:${dur}s;--delay:${-((i*7.3)%dur).toFixed(1)}s`));
    spec.bolts?.forEach(([x,y,h,v,period,delay])=>{const s=A['summon-bolts'];if(!s)return;const w=h*s.width/s.count/s.height,t=`--period:${period}s;--delay:${delay}s`;
      out.push(`<i class="lm-flash" style="left:${x-h}px;top:${y+h/2-h}px;width:${2*h}px;height:${2*h}px;${t}"></i>`);
      out.push(`<i class="lm-bolt" style="left:${x-w/2}px;top:${y}px;width:${w}px;height:${h}px;background-image:url('${light('summon-bolts')}');background-position:${v/(s.count-1)*100}% 0;${t}"></i>`);});
    for(const [x,y,w,h] of spec.flow||[]){
      const period=Math.max(26,Math.round(h/6)),bands=`repeating-linear-gradient(180deg,transparent 0px,#000 ${period*.35}px,#000 ${period*.5}px,transparent ${period*.85}px,transparent ${period}px)`;
      // Third layer: only painted water (export_water_masks.py), so rocks and leaves stay still.
      const water=A[waterKey],waterUrl=water?new URL(water.file,document.baseURI).href.replace(/'/g,'%27'):'';
      const mask=`radial-gradient(ellipse 50% 50% at 50% 50%,#000 55%,transparent 100%),${bands}`+(water?`,url('${waterUrl}')`:'');
      const size=`100% 100%,100% ${period}px`+(water?',941px 1672px':''),position=`0 0,0 0`+(water?`,${-x}px ${-y}px`:'');
      out.push(`<i class="lm-flow" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;background-image:${background};background-position:${-x}px ${-y+3}px;-webkit-mask-image:${mask};mask-image:${mask};-webkit-mask-size:${size};mask-size:${size};-webkit-mask-position:${position};mask-position:${position};--period:${period}px;--water:${water?`${-x}px ${-y}px`:'0 0'}"></i>`);
    }
    for(const [x,y,size] of spec.foam||[])out.push(sprite('foam','lm-foam',`left:${x-size/2}px;top:${y-size*.62}px;width:${size}px;height:${size}px`));
    for(const [x,y,size] of spec.fire||[])out.push(sprite('forge','lm-fire',`left:${x-size/2}px;top:${y-size*.82}px;width:${size}px;height:${size}px`));
    for(const [x,y,size,squash] of spec.portal||[])out.push(sprite('portal','lm-portal',`left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;--squash:${squash}`));
    for(const [x,y] of spec.sparks||[])out.push(`<i class="lm-sparks" style="left:${x}px;top:${y}px">${Array.from({length:9},(_,i)=>`<b style="--a:${-160+i*17}deg;--d:${26+(i*13)%22}px;--t:${(i%3)*.04}s"></b>`).join('')}</i>`);
    for(const [x,y,size,o] of spec.rays||[])if(A['summon-halo'])out.push(`<i class="lm-rays" style="left:${x-size/2}px;top:${y-size/2}px;width:${size}px;height:${size}px;--o:${o};background-image:url('${light('summon-halo')}');--delay:${-((x+y)%13)}s"></i>`);
    spec.twinkles?.forEach(([x,y,size],i)=>{const s=A['summon-sparkle'];if(s)out.push(`<i class="lm-twinkle" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px;--sheet:url('${light('summon-sparkle')}');--count:${s.count};--wait:${(1.8+(i*7)%5*.45).toFixed(1)}s;--delay:${-(i*.83).toFixed(2)}s"></i>`);});
    spec.motes?.forEach(([x,y],i)=>{if(A['summon-orb'])out.push(`<i class="lm-mote" style="left:${x}px;top:${y}px;background-image:url('${light('summon-orb')}');--size:${14+(i*5)%16}px;--delay:${-(i*1.3).toFixed(1)}s;--drift:${(i%2?-1:1)*(10+i*4)}px"></i>`);});
    for(const [kind,lanes] of [['bird',spec.birds],['crow',spec.crows]])for(const [y,duration,delay,scale,direction] of lanes||[])
      out.push(`<i class="lm-lane" style="top:${y}px;--dur:${duration}s;--delay:${delay}s;--dir:${direction}">${sprite('bird','lm-bird'+(kind==='crow'?' lm-crow':''),`--scale:${scale}`)}</i>`);
    spec.glows?.forEach(([x,y,size,rgb],i)=>out.push(`<i class="lm-glow" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px;--c:${rgb};--delay:${-(i*.71).toFixed(2)}s"></i>`));
    if(spec.pulse)glows.forEach((k,i)=>out.push(masked(k,spec.pulse==='deep'?'lm-pulse lm-deep':'lm-pulse',`--delay:${-i*2.1}s`)));
    for(const [x,y,size] of spec.flames||[])out.push(sprite('forge','lm-flame',`left:${x-size/2}px;top:${y-size*.8}px;width:${size}px;height:${size}px`));
    spec.rise?.forEach(([x,y,w,rgb,o],i)=>wisp('lm-rise',x,y-w*.6,w,2,rgb,o,`--delay:${-(i*2.3).toFixed(1)}s;--dx:${i%2?-30:30}px`));
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
    layer.innerHTML=markup(spec,(scene.style.backgroundImage||'none').replace(/"/g,"'"),'ambient-water-'+theme);
    scene.prepend(layer);
  }
  // A hero's realm on the summon spotlight: host shows sceneUrl as cover at 50% 40%; the 941x1672
  // layer is fitted onto it the same way.
  function realm(host,key,sceneUrl){
    const spec=REALMS[key];if(!spec||!sceneUrl||reduced())return;
    const W=host.clientWidth,H=host.clientHeight,k=Math.max(W/941,H/1672);
    const layer=document.createElement('div');layer.className='living-motion';layer.dataset.theme='realm-'+key;layer.setAttribute('aria-hidden','true');
    layer.style.cssText=`transform-origin:0 0;transform:translate(${(W-941*k)/2}px,${(H-1672*k)*.4}px) scale(${k})`;
    layer.innerHTML=markup(spec,`url('${sceneUrl.replace(/'/g,'%27')}')`,'summon-water-'+key,['summon-glow-a-'+key,'summon-glow-b-'+key]);
    host.append(layer);
  }
  window.GemwovenLivingMotion={mount,realm,SCENES,REALMS};
})();
