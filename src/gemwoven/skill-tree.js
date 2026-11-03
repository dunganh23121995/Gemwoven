/* Kỹ Năng — the skill tree as drawn art. Pass 1 (owner 04/11 "Cây kỹ năng dựng lại đi", mockup
 * assets/gemwoven/raw/skill-tree/mockup-1.png); pass 2 answers the full-game review ("các nút rời rạc trên thân cây …
 * vẽ thêm nhánh nối và ổ gắn biểu tượng; làm nút đang chọn nổi bật, gom điều kiện khóa thành một kiểu nhãn") with
 * Codex's critique and approved mockup assets/gemwoven/raw/skill-tree/pass2/ (critique-1.md, mockup-1.png).
 * One honey-wood bough climbs the trunk from the root, Chủ Động → Bị Động → Biến Dị → Chân Thân, in the order the
 * branches open (SKILL_GATES), not a prerequisite chain; it stays fully lit, locked parts included. Every medallion
 * sits in a carved wooden socket; the selected one alone gets the gold selection ring (static), the one suggested
 * next step only a small leaf, a learnable skill a sprout and "Học".
 * Pass 3 (owner: "bỏ phần mô tả yêu cầu và tên ngay cạnh kỹ năng … tướng sau này phát triển thêm kỹ năng thì sao?";
 * Codex critique and mockup assets/gemwoven/raw/skill-tree/pass3/): no plates beside the medallions, and the tree is
 * data-driven: N skills on an ordered slot list along a bough that grows by a repeated two-pad period and scrolls.
 * The detail panel: rank and branch plates, a wide material tray with "Có / Cần" lines, a compact "Cấp kế" card.
 * Words and numbers are the HTML layer; rules stay in progression.js (skillUnlock, skillCost, skillText).
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G?.decorate||!M?.skillText||!A?.['skilltree-bough2'])return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const file=k=>A[k]?.file||'',art=k=>file('skilltree-'+k);
  const tight=n=>M.compact(n,1000);
  const owned=(p,id)=>id in p.wallet?p.wallet[id]:p.materials[id]||0;
  const affordable=(p,c)=>c&&Object.entries(c).every(([id,n])=>owned(p,id)>=n);
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const icon=(key,i)=>key==='novice'?['stat-attack','stat-shield','stat-heart','crest'][i]:`skill-${key}-${i}`;
  const skillArt=(key,i)=>file(`skill-${key}-${i}`)||file(icon(key,i));
  const cssUrl=k=>`url("${new URL(art(k),document.baseURI).href}")`;
  // The bough (pass2/bough2-raw.png) is placed by its own pixels: the webp is the sheet crop (94,32) 859x1504; the
  // four round pads were measured on the sheet (distance-transform peaks). S scales sheet pixels to stage units.
  const S=.46,RAW={x:94,y:32,w:859,h:1504},PADS=[[395,1229],[777,868],[378,565],[785,231]],TWIG=[112,255];
  const OX=447.5,OY=233.8,at=([x,y])=>[OX+x*S,OY+y*S];
  const FRAME=144/320;
  // Hole centre of each frame picture (fraction of its own box), measured from the art.
  const FRAMES={learned:[320,327,.5,.512],selected:[331,326,.498,.52],locked:[325,361,.498,.458]};
  // Each branch keeps its own colour in the medallion well (mockup): ember, sky, crimson, violet.
  const WELL=['#c8502e','#3f78c0','#a0304a','#6a4aa0'];

  function gateLines(i){const g=M.SKILL_GATES[i];return g?[`Cấp ${g.level}`,g.evolution?`Tiến hóa ${g.evolution}`:'']:[''];}
  function rows(values){return (values||[]).map(([l,v,u])=>`${l} ${v}${u}`);}
  // A long description (Chân Thân) shows its first clause; the full text is one tap away.
  function summary(text){const s=String(text||'');if(s.length<=90)return [s,false];const cut=s.search(/\s*[(:]/);return [(cut>12?s.slice(0,cut):s.slice(0,80)).replace(/[.;,\s]+$/,'')+'.',true];}
  // ---- The hero's skill list (pass 3, owner 04/11: "nếu mỗi tướng sau này phát triển thêm kỹ năng thì sao?").
  // Every node comes from this list, in unlock order from the root up. Real heroes have the four branches of
  // progression.js. window.GEMWOVEN_QA_SKILLS = N is a QA-only switch (never set by the game) that appends fake
  // skills up to N, so the long tree can be checked without adding skills to a real hero or changing any rule.
  function realSkill(hero,h,i){
    return {i,real:true,open:!!h&&M.skillUnlock(h,i),rank:h?h.skills[i]||0:0,well:WELL[i%WELL.length],icon:skillArt(hero,i),gate:gateLines(i),
      text:()=>M.skillText(hero,h,i),cost:()=>M.skillCost(h,i)};
  }
  function qaSkill(hero,h,i){
    const open=!!h&&i<6,rank=i===4?3:0,base=i%4,name=`Kỹ năng thử ${i+1}`;
    return {i,real:false,open,rank,well:WELL[base],icon:skillArt(hero,base),gate:[`Cấp ${200+i*20}`,`Tiến hóa ${Math.min(6,i-2)}`],
      text:()=>({name,branch:'Mở rộng',rank,max:M.SKILL_MAX,owned:!!h,unlocked:open,maxed:false,bonusRank:0,description:'Kỹ năng thử để kiểm tra cây mở rộng.',values:[['Sát thương','+5','%']],next:'Sát thương 91 → 97'}),
      cost:()=>({gold:9000,skillBooks:5})};
  }
  function skillList(hero,h){
    const n=M.SKILL_BRANCHES.length,qa=Math.min(24,Math.floor(Number(window.GEMWOVEN_QA_SKILLS)||0));
    return Array.from({length:Math.max(n,qa)},(_,i)=>i<n?realSkill(hero,h,i):qaSkill(hero,h,i));
  }
  // ---- Slots along the bough (pass 3, Codex critique assets/gemwoven/raw/skill-tree/pass3/critique-1.md).
  // bough2 is cut through pad centres and restacked: the root part (pads 1, 2), the two-pad period (pad 1's upper
  // half → pad 2 → pad 3's lower half) k times, then the crown (pad 3's upper half → pad 4, the twig and the bud).
  // k = 0 is today's single picture, unchanged. Every cut lies inside a pad, under a socket or a locked frame; each
  // period sits on the one below at a pad centre, so the bough leans 7.8 units left per period instead of showing a
  // seam. An odd skill count leaves the crown's pad free: a leafy tip (200 × 181, Codex) covers it, no socket, no tap.
  const CUT=PADS[2][1],STEP=[PADS[2][0]-PADS[0][0],PADS[2][1]-PADS[0][1]];// sheet px per period: (-17,-664)
  const PERIOD=-STEP[1]*S;// 305.44 stage units
  function slotsFor(n){
    const k=Math.max(0,Math.ceil((n-4)/2)),sh=([x,y],j)=>[x+j*STEP[0],y+j*STEP[1]],s=[PADS[0],PADS[1],PADS[2]];
    for(let j=1;j<=k;j++)s.push(sh(PADS[1],j),sh(PADS[2],j));
    s.push(sh(PADS[3],k));return {k,slots:s.map(at),twig:at(sh(TWIG,k))};
  }
  // The tree layer: four skills keep today's box and never scroll; a longer tree gets a taller viewport that runs up
  // under the HUD (Codex: [370,120,…,786]; it reaches the stage's right edge so a halo is never cut) and scrolls.
  const VIEW4=[370,230,550,676],VIEWN=[370,120,571,786];
  const viewFor=n=>n>4?VIEWN:VIEW4;
  function boughHtml(k,dy,cls,fade){
    const W=RAW.w*S,H=RAW.h*S,x0=OX+RAW.x*S-VIEWN[0],y0=OY+RAW.y*S+dy,end=RAW.y+RAW.h;
    const piece=(from,to,j,extra='')=>{const top=y0+(from-RAW.y+j*STEP[1])*S,h=(to-from)*S+(to<end?1:0);
      return `<span class="st-piece${extra}" style="${box(x0+j*STEP[0]*S,top,W,h)};--fade:${(fade-top).toFixed(1)}px"><img src="${art('bough2')}" alt="" style="${box(0,-(from-RAW.y)*S,W,H)}"></span>`;};
    let html=piece(k?CUT:RAW.y,end,0,' root');
    for(let j=1;j<=k;j++)html+=piece(CUT,PADS[0][1],j);
    if(k)html+=piece(RAW.y,CUT,k);
    return html;
  }
  function frame(kind,[cx,cy]){const [w,h,fx,fy]=FRAMES[kind],W=w*FRAME,H=h*FRAME;return `<img class="st-frame ${kind}" src="${art('frame-'+kind)}" alt="" style="${box(cx-W*fx,cy-H*fy,W,H)}">`;}
  // One suggestion at a time: a skill that can be learned now, else the cheapest affordable upgrade.
  function suggestion(p,list){
    let best=-1,bestCost=Infinity;
    for(const s of list){if(!s.open||s.rank>=M.SKILL_MAX)continue;let c;try{c=s.cost();}catch{continue;}
      if(!affordable(p,c))continue;const w=s.rank===0?-1:c.gold;if(w<bestCost){bestCost=w;best=s.i;}}
    return best;
  }
  function tree(el,p,state){
    const hero=state.hero,h=p.heroes[hero],list=skillList(hero,h);
    if(!(state.skill<list.length))state.skill=0;
    const sel=state.skill||0,next=h?suggestion(p,list):-1,{k,slots,twig}=slotsFor(list.length),long=k>0;
    // Content coordinates: x from 370 (both boxes), y from the viewport top with the tree k periods taller.
    const V=viewFor(list.length),dy=k*PERIOD-V[1],T=([x,y])=>[x-V[0],y+dy],height=V[3]+k*PERIOD,sy=T(slots[sel])[1];
    // The bough lights from the root up to the selected skill: a brighter copy of the same pieces, masked above it
    // (in content coordinates, so it scrolls with the tree). The root fades into the trunk above the roster.
    const fade=857.3+dy;
    let inner=`<span class="st-bough">${boughHtml(k,dy,'',fade)}</span><span class="st-bough st-lit" style="--cut:${(sy-32.2).toFixed(1)}px">${boughHtml(k,dy,'',fade-14)}</span>`;
    // The bud's stem end sits on the twig's tip (pass 3 review: they no longer float apart).
    const [tx,ty]=T(twig);
    inner+=`<button type="button" class="st-soon" data-action="art:skill-soon" style="${box(tx-119,ty-93,124,128)}" aria-label="Nhánh kỹ năng mở rộng · Sắp ra mắt"><img class="st-bud" src="${art('bud')}" alt=""></button>`+
      `<b class="st-ribbon" style="${box(tx-122,ty-112,196,44)}">Sắp ra mắt</b>`;
    // Pass 3 (owner): no name or requirement plates beside the medallions, the panel below says it all. A learned
    // skill keeps its rank plate, a learnable one "Học" and the sprout, a locked one its padlock frame.
    slots.forEach((c,i)=>{
      const [cx,cy]=T(c),s=list[i];
      if(!s){inner+=`<img class="st-crown" src="${art('crown-leaves')}" alt="" style="${box(cx-100,cy-92,200,181)}">`;return;}
      const t=s.text(),on=i===sel,kind=!s.open?'locked':on?'selected':'learned',learnable=s.open&&s.rank===0;
      if(s.open)inner+=`<img class="st-socket" src="${art('socket')}" alt="" style="${box(cx-82,cy-82,164,164)}">`;
      if(on)inner+=`${s.open?`<i class="st-halo" style="${box(cx-160,cy-160,320,320)}"></i>`:''}<img class="st-ring${s.open?'':' dim'}" src="${art('select-ring')}" alt="" style="${box(cx-97,cy-97,194,194)}">`;
      // The tap target covers the medallion and its rank plate (176 × 192 units ≈ 73 × 80 CSS px on a phone).
      inner+=`<button type="button" class="st-node skill-live ${kind}${on?' on':''}${i===next?' next':''}${s.open?'':' skill-unavailable'}" data-action="do:skill-node" data-index="${i}" style="${box(cx-88,cy-88,176,192)}" aria-label="${esc(t.name)} · ${esc(t.branch||M.SKILL_BRANCHES[i])}${s.open?` · ${s.rank}/${M.SKILL_MAX}`:' · '+esc(s.gate.filter(Boolean).join(' · '))}"${on?' aria-current="true"':''}>`+
        `<i class="st-well" style="--el:${s.well}"></i><img class="st-icon" src="${s.icon}" alt=""></button>`+frame(kind,[cx,cy]);
      if(i===next)inner+=`<img class="st-pointer" src="${art('pointer')}" alt="" style="${box(cx-166,cy-17,76,34)}">`;
      if(learnable)inner+=`<img class="st-sprout" src="${art('sprout')}" alt="" style="${box(cx+30,cy-86,46,33)}">`;
      if(s.open)inner+=`<b class="st-rank${learnable?' learn':''}${on?' on':''}" style="${box(cx-78,cy+52,156,50)}">${learnable?'Học':`${s.rank}/${M.SKILL_MAX}`}</b>`;
    });
    // A thin thread of the same light runs from the root down to the panel; it stays put when the tree scrolls.
    const fixed=`<i class="st-thread" style="${box(647-V[0],850-V[1],8,156)}"></i><i class="st-spark" style="${box(635-V[0],994-V[1],24,24)}"></i>`;
    for(const key of ['rank-plate','ribbon'])el.style.setProperty('--st-'+key,cssUrl(key));
    if(!long){el.innerHTML=`<div class="st-content" style="${box(0,0,V[2],V[3])}">${inner}</div>`+fixed;return;}
    // A longer tree scrolls inside its viewport: two carved leaf cues step one period up or down, fades only where
    // more of the tree is hidden, and the selected node is kept in view.
    const cue=(dir,y)=>`<button type="button" class="st-cue ${dir}" data-cue="${dir}" style="${box(432-V[0],y-V[1],108,108)}" aria-label="${dir==='up'?'Xem kỹ năng phía trên':'Xem kỹ năng phía dưới'}"><img src="${art('cue-'+dir)}" alt="" style="${box(18,18,72,72)}"></button>`;
    el.classList.add('st-long');
    el.innerHTML=`<div class="st-scroll" style="${box(0,0,V[2],V[3])}"><div class="st-content" style="width:${V[2]}px;height:${height}px">${inner}</div></div>`+fixed+cue('up',124)+cue('down',786);
    const view=el.querySelector('.st-scroll'),max=k*PERIOD,saved=state.skillTreeScroll?.[hero];
    const inView=(y,top)=>y>=top+96&&y<=top+V[3]-110;
    const start=saved==null?max:Math.max(0,Math.min(max,saved)),goal=inView(sy,start)?start:Math.max(0,Math.min(max,sy-V[3]*.5));
    const sync=()=>{const top=view.scrollTop;el.classList.toggle('at-top',top<=2);el.classList.toggle('at-bottom',top>=max-2);(state.skillTreeScroll??={})[hero]=top;};
    // Codex: the selection never leaves the view. When the player scrolls it away, the nearest visible skill becomes
    // the selection once the scroll settles (the panel follows; nothing is learned or spent).
    let settle=0,quiet=0;
    const follow=()=>{if(quiet>Date.now()||drag)return;const top=view.scrollTop;if(inView(sy,top))return;
      let best=-1,dist=Infinity;slots.forEach((c,i)=>{if(!list[i])return;const y=T(c)[1];if(!inView(y,top))return;const d=Math.abs(y-sy);if(d<dist){dist=d;best=i;}});
      if(best>=0)el.querySelector(`.st-node[data-index="${best}"]`)?.click();};
    view.addEventListener('scroll',()=>{sync();clearTimeout(settle);settle=setTimeout(follow,240);},{passive:true});
    const glide=top=>{quiet=Date.now()+700;view.scrollTo({top,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});};
    for(const b of el.querySelectorAll('.st-cue'))b.onclick=e=>{e.stopPropagation();glide(Math.max(0,Math.min(max,view.scrollTop+(b.dataset.cue==='up'?-PERIOD:PERIOD))));setTimeout(follow,760);};
    // Dragged with a mouse too (Studio); touch pans natively. A drag never taps the node under the pointer.
    let drag=null;
    view.onpointerdown=e=>{if(e.pointerType!=='mouse')return;drag={y:e.clientY,top:view.scrollTop,moved:false};};
    view.onpointermove=e=>{if(!drag)return;const d=(e.clientY-drag.y)*V[3]/view.getBoundingClientRect().height;
      if(Math.abs(d)>12)drag.moved=true;if(drag.moved){view.scrollTop=drag.top-d;view.classList.add('dragging');}};
    view.onpointerup=view.onpointerleave=()=>{if(drag?.moved)view.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();},{capture:true,once:true});drag=null;view.classList.remove('dragging');clearTimeout(settle);settle=setTimeout(follow,240);};
    requestAnimationFrame(()=>{quiet=Date.now()+700;view.scrollTop=start;sync();if(Math.abs(goal-start)>1)glide(goal);});
  }
  // The detail panel (stage box [15,1004,911,484]; children are placed relative to it).
  const PX=15,PY=1004,rel=(x,y,w,h)=>box(x-PX,y-PY,w,h);
  function detail(el,p,state){
    const hero=state.hero,h=p.heroes[hero],list=skillList(hero,h),i=state.skill<list.length?state.skill||0:0,s=list[i],t=s.text(),open=!!h&&t.unlocked;
    let c;try{if(open&&!t.maxed)c=s.cost();}catch{}
    for(const k of ['rank-plate','category-plate','tray-wide','next-card2','header-tag'])el.style.setProperty('--st-'+k,cssUrl(k));
    const nameKey=`skills.skill-name-${hero}-${i}`;if(s.real)C[nameKey]=t.name;
    const [desc,more]=summary(t.description);
    // The panel repeats the selected medallion (socket, branch colour, gold ring) so it reads as that node's card.
    let html=`<img class="sd-socket" src="${art(open?'socket':'frame-locked')}" alt="" style="${open?rel(46,1022,128,128):rel(50,1018,120,134)}"><i class="sd-well${open?'':' locked'}" style="${rel(74,1050,72,72)};--el:${s.well}"></i>`+
      `<img class="sd-icon${open?'':' locked'}" src="${s.icon}" alt="" style="${rel(68,1044,84,84)}">`+(open?`<img class="sd-ring" src="${art('select-ring')}" alt="" style="${rel(34,1010,152,152)}">`:'')+
      `<b class="sd-rank" style="${rel(40,1152,140,42)}">Lv.${t.rank}${t.bonusRank?' (+'+t.bonusRank+')':''}/${t.max}</b>`+
      `<b class="sd-name"${s.real?` data-copy="${esc(nameKey)}"`:''} style="${rel(198,1022,686,50)}">${esc(t.name)}</b>`+
      `<b class="sd-branch" style="${rel(198,1072,220,40)}">${esc(t.branch||M.SKILL_BRANCHES[i])}</b>`+
      `<p class="sd-desc" style="${rel(198,1112,692,84)}">${esc(desc)}</p>`+
      (more?`<button type="button" class="sd-more" data-action="skilltree:info" data-hero="${esc(hero)}" data-index="${i}" style="${rel(430,1069,140,46)}" aria-label="Xem đầy đủ"><span>Chi tiết</span></button>`:'');
    const left=c?(t.rank===0?'Nguyên liệu học':'Nguyên liệu'):t.maxed?'Hoàn thiện':'Điều kiện';
    const lw=left.length>12?292:250;html+=`<b class="sd-head" style="${rel(323-lw/2,1200,lw,46)}">${left}</b><div class="sd-tray" style="${rel(40,1228,566,140)}">`;
    if(c){const mats=Object.entries(c).filter(([,n])=>n>0);
      html+=`<div class="sd-mats n${mats.length}">`+mats.map(([id,n])=>{const have=owned(p,id),ok=have>=n;return `<button type="button" class="sd-mat ${ok?'ok':'short'}" data-action="item:${id}" aria-label="${esc(M.RESOURCES[id]?.[0]||id)} · có ${tight(have)} · cần ${tight(n)}"><img src="${file(M.RESOURCES[id]?.[1]||id)}" alt=""><span>Có ${tight(have)}</span><b>Cần ${tight(n)}</b></button>`;}).join('')+'</div>';}
    else if(t.maxed)html+=`<p class="sd-note">✓ Cấp tối đa</p>`;
    else if(!h)html+=`<p class="sd-note">${esc(M.heroAvailable&&!M.heroAvailable(hero)?'Tướng xuất hiện ở kỳ triệu hồi sau.':'Cần sở hữu tướng.')}</p>`;
    else html+=`<p class="sd-note"><span>Cần: ${esc(s.gate.filter(Boolean).join(' · '))}</span><small>Hiện tại: Cấp ${h.level} · Tiến hóa ${h.evolution||0}</small></p>`;
    html+='</div>';
    const right=!open?'Khi mở':t.maxed?'Cấp tối đa':t.rank===0?'Khi học':'Cấp kế';
    const lines=!open||t.rank===0?rows(t.values):t.maxed?rows(t.values):String(t.next||'').split(' · ').filter(Boolean);
    // Each line splits into its label and its value; the card fits the longest value (Cambria bold ≈ .55 em a glyph),
    // dropping the small picture when the value needs the room.
    const parts=lines.slice(0,3).map(l=>{const k=l.search(/[-+×]?\d/);return k>0?[l.slice(0,k).trim(),l.slice(k)]:['',l];});
    const one=parts.length===1,longest=Math.max(...parts.map(([,v])=>v.length),1),pic=one&&longest<=9;
    const room=pic?176:238,size=Math.min(one?36:28,Math.floor(room/(longest*.55))),label=Math.min(one?27:25,Math.floor(room/(Math.max(...parts.map(([a])=>a.length),1)*.5)));
    html+=`<b class="sd-head" style="${rel(646,1200,230,46)}">${right}</b><div class="sd-card${one?' one':' many'}" style="${rel(624,1228,274,140)};--v:${size}px;--l:${label}px">`+
      (pic?`<img src="${s.icon}" alt="">`:'')+`<p>${parts.map(([a,v])=>`<span>${a?`<small>${esc(a)}</small>`:''}<b>${esc(v).replace('→','<i>→</i>')}</b></span>`).join('')}</p></div>`;
    const ready=!!c&&affordable(p,c),action=t.maxed?'Đã Tối Đa':!open?'Chưa Mở':!ready&&c?'Thiếu nguyên liệu':t.rank===0?'Học':'Tăng Cấp';
    // A QA skill only says so: it has no rule to train against.
    html+=`<button type="button" class="sd-go ${ready?'ready':'off'}" data-action="${s.real?'do:train':'skilltree:qa'}" data-hero="${esc(hero)}" data-index="${i}" ${ready?'':'disabled'} style="${!ready&&c?rel(250,1376,440,100):rel(300,1376,340,100)}"><img src="${art(ready?'button-ready':'button-locked')}" alt=""><span>${action}</span></button>`;
    el.innerHTML=html;
  }
  const OLD=/^skills\.(node-\d|node-level-\d|link-\d|locked-\d|selected-icon|skill-name-|skill-category|skill-level|skill-description-|materials-title|skill-materials-|next-title|next-effect-|upgrade-skill|unlock-requirement)/;
  const decorate=G.decorate;
  G.decorate=state=>{
    // The older layers under this one know only the real branches: a QA skill past them is shown to them as the first.
    const extra=state.screen==='skills'&&state.skill>=M.SKILL_BRANCHES.length,keep=state.skill;
    let p;if(extra){state.skill=0;try{p=decorate(state);}finally{state.skill=keep;}}else p=decorate(state);
    if(state.screen!=='skills')return p;
    // Codex text review 25: the slogan and the second title add nothing to tap; the tree speaks for itself.
    const nodes=L.screens.skills.nodes.filter(n=>!OLD.test(n.id)&&!/^skills\.(motto|path-title|path-title-board)$/.test(n.id));
    const view=viewFor(skillList(state.hero,p.heroes[state.hero]).length);
    nodes.push({id:'skills.tree',kind:'content',rect:view,className:'exploration-map st-tree',build:el=>tree(el,p,state)});
    nodes.push({id:'skills.detail',kind:'content',rect:[PX,PY,911,484],className:'exploration-map st-detail',build:el=>detail(el,p,state)});
    L.screens.skills.nodes=nodes;return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action==='skilltree:qa'){ctx.showModal('Kỹ năng thử (QA)',[],'Chỉ để kiểm tra cây kỹ năng dài; không có trong game.');return true;}
    if(action!=='skilltree:info')return handle(action,el,ctx,state);
    const hero=el.dataset.hero,i=Number(el.dataset.index),h=G.engine.read().heroes[hero],t=M.skillText(hero,h,i);
    ctx.showModal(`${t.name} · ${M.SKILL_BRANCHES[i]}`,[],t.description);return true;
  };
})();
