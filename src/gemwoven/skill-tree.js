/* Kỹ Năng — the skill tree as drawn art. Pass 1 (owner 04/11 "Cây kỹ năng dựng lại đi", mockup
 * assets/gemwoven/raw/skill-tree/mockup-1.png); pass 2 answers the full-game review ("các nút rời rạc trên thân cây …
 * vẽ thêm nhánh nối và ổ gắn biểu tượng; làm nút đang chọn nổi bật, gom điều kiện khóa thành một kiểu nhãn") with
 * Codex's critique and approved mockup assets/gemwoven/raw/skill-tree/pass2/ (critique-1.md, mockup-1.png).
 * One honey-wood bough climbs the trunk from the root, Chủ Động → Bị Động → Biến Dị → Chân Thân, in the order the
 * branches open (SKILL_GATES), not a prerequisite chain; it stays fully lit, locked parts included. Every medallion
 * sits in a carved wooden socket; the selected one alone gets the gold selection ring (static), the one suggested
 * next step only a small leaf, a learnable skill a sprout and "Học". Every gate uses the same wooden plate.
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
  const CENTRES=PADS.map(at),FRAME=144/320;
  // Hole centre of each frame picture (fraction of its own box), measured from the art.
  const FRAMES={learned:[320,327,.5,.512],selected:[331,326,.498,.52],locked:[325,361,.498,.458]};
  // Each branch keeps its own colour in the medallion well (mockup): ember, sky, crimson, violet.
  const WELL=['#c8502e','#3f78c0','#a0304a','#6a4aa0'];
  const STAGE_TREE=[400,250,520,656];// [x,y,w,h] of the tree layer

  function gateLines(i){const g=M.SKILL_GATES[i];return g?[`Cấp ${g.level}`,g.evolution?`Tiến hóa ${g.evolution}`:'']:[''];}
  function rows(values){return (values||[]).map(([l,v,u])=>`${l} ${v}${u}`);}
  // A long description (Chân Thân) shows its first clause; the full text is one tap away.
  function summary(text){const s=String(text||'');if(s.length<=90)return [s,false];const cut=s.search(/\s*[(:]/);return [(cut>12?s.slice(0,cut):s.slice(0,80)).replace(/[.;,\s]+$/,'')+'.',true];}
  // One suggestion at a time: a skill that can be learned now, else the cheapest affordable upgrade.
  function suggestion(p,h){
    if(!h)return -1;let best=-1,bestCost=Infinity;
    for(let i=0;i<4;i++){if(!M.skillUnlock(h,i)||(h.skills[i]||0)>=M.SKILL_MAX)continue;let c;try{c=M.skillCost(h,i);}catch{continue;}
      if(!affordable(p,c))continue;const w=(h.skills[i]||0)===0?-1:c.gold;if(w<bestCost){bestCost=w;best=i;}}
    return best;
  }
  function frame(kind,[cx,cy]){const [w,h,fx,fy]=FRAMES[kind],W=w*FRAME,H=h*FRAME;return `<img class="st-frame" src="${art('frame-'+kind)}" alt="" style="${box(cx-W*fx,cy-H*fy,W,H)}">`;}
  function tree(el,p,state){
    const hero=state.hero,h=p.heroes[hero],sel=state.skill||0,next=suggestion(p,h);
    const open=[0,1,2,3].map(i=>!!h&&M.skillUnlock(h,i));
    const T=([x,y])=>[x-STAGE_TREE[0],y-STAGE_TREE[1]];
    // Readability pass (full review 3): the bough lights from the root up to the selected skill, a second copy of
    // the same picture masked above that pad, so the eye runs root → selected node → the panel below.
    const bough=box(OX+RAW.x*S-STAGE_TREE[0],OY+RAW.y*S-STAGE_TREE[1],RAW.w*S,RAW.h*S),cut=((PADS[sel][1]-RAW.y-70)/RAW.h*100).toFixed(1);
    let html=`<img class="st-bough" src="${art('bough2')}" alt="" style="${bough}"><img class="st-bough st-lit" src="${art('bough2')}" alt="" style="${bough};--cut:${cut}%">`;
    const [tx,ty]=T(at(TWIG));
    html+=`<button type="button" class="st-soon" data-action="art:skill-soon" style="${box(tx-104,ty-66,124,128)}" aria-label="Nhánh kỹ năng mở rộng · Sắp ra mắt"><img class="st-bud" src="${art('bud')}" alt=""></button>`+
      `<b class="st-ribbon" style="${box(tx-122,ty-112,196,44)}">Sắp ra mắt</b>`;
    CENTRES.forEach((c,i)=>{
      const [cx,cy]=T(c),t=M.skillText(hero,h,i),rank=h?h.skills[i]||0:0,on=i===sel;
      const kind=!open[i]?'locked':on?'selected':'learned',learnable=open[i]&&rank===0;
      // A locked medallion keeps only its padlock frame and one gate plate (no socket ring behind it).
      if(open[i])html+=`<img class="st-socket" src="${art('socket')}" alt="" style="${box(cx-82,cy-82,164,164)}">`;
      if(on)html+=`${open[i]?`<i class="st-halo" style="${box(cx-130,cy-130,260,260)}"></i>`:''}<img class="st-ring${open[i]?'':' dim'}" src="${art('select-ring')}" alt="" style="${box(cx-97,cy-97,194,194)}">`;
      // The tap target covers the medallion and its plate (≥ 176 units ≈ 73 CSS px on a phone).
      const tall=open[i]?176+16:176+96;
      html+=`<button type="button" class="st-node skill-live ${kind}${on?' on':''}${i===next?' next':''}${open[i]?'':' skill-unavailable'}" data-action="do:skill-node" data-index="${i}" style="${box(cx-88,cy-88,176,tall)}" aria-label="${esc(t.name)} · ${esc(M.SKILL_BRANCHES[i])}${open[i]?` · ${rank}/${M.SKILL_MAX}`:' · '+esc(gateLines(i).filter(Boolean).join(' · '))}"${on?' aria-current="true"':''}>`+
        `<i class="st-well" style="--el:${WELL[i]}"></i><img class="st-icon" src="${skillArt(hero,i)}" alt=""></button>`+frame(kind,[cx,cy]);
      if(i===next)html+=`<img class="st-pointer" src="${art('pointer')}" alt="" style="${box(cx-166,cy-17,76,34)}">`;
      if(learnable)html+=`<img class="st-sprout" src="${art('sprout')}" alt="" style="${box(cx+30,cy-86,46,33)}">`;
      if(open[i])html+=`<b class="st-rank${learnable?' learn':''}${on?' on':''}" style="${box(cx-78,cy+52,156,50)}">${learnable?'Học':`${rank}/${M.SKILL_MAX}`}</b>`;
      // Full review 4 (Codex: "chưa nói phần thưởng mở khóa là kỹ năng gì"): every medallion carries a plate with its
      // skill's name; a locked one adds the padlock and the level / evolution it still needs ("Cần …"), so an unmet
      // condition never reads like the Coming-soon bud. Left-hand plates sit beside the medallion, right-hand ones below.
      const left=cx<(CENTRES[0][0]+CENTRES[1][0])/2-STAGE_TREE[0],[a,b]=gateLines(i),need=!open[i]&&h?[a,b].filter(Boolean).join(' · '):'';
      // Left-hand plates stop at the hero's shoulder (stage x ≈ 330); the first one rides above-left of its medallion.
      const w=left?236:open[i]?228:250,lines=need?(need.length>12?3:2):1,ht=lines===1?62:lines===2?98:128,nameSize=Math.min(30,Math.floor((w-30)/(Math.max(t.name.length,1)*.5)));
      const pos=left?box(cx-62-w,i===0?cy-146:cy-36,w,ht):open[i]?box(cx-94,cy+104,w,ht):box(cx-118,cy+86,w,ht);
      html+=`<b class="st-gate${open[i]?' is-open':' is-need'}${on?' on':''}" style="${pos};--n:${nameSize}px"><span class="st-name">${esc(t.name)}</span>`+
        (need?`<span class="st-need"><img src="${file('kit-lock')}" alt="">Cần ${esc(lines===3?a:need)}</span>${lines===3?`<span class="st-need st-need2">${esc(b)}</span>`:''}`:'')+'</b>';
    });
    // A thin thread of the same light runs from the lit root down to the panel, right of the roster, ending in a
    // spark on the panel's edge: the panel below is this node's card.
    html+=`<i class="st-thread" style="${box(244,600,6,156)}"></i><i class="st-spark" style="${box(235,744,24,24)}"></i>`;
    for(const k of ['rank-plate','gate-plate2','ribbon'])el.style.setProperty('--st-'+k,cssUrl(k));
    el.innerHTML=html;
  }
  // The detail panel (stage box [15,1004,911,484]; children are placed relative to it).
  const PX=15,PY=1004,rel=(x,y,w,h)=>box(x-PX,y-PY,w,h);
  function detail(el,p,state){
    const hero=state.hero,h=p.heroes[hero],i=state.skill||0,t=M.skillText(hero,h,i),open=!!h&&t.unlocked;
    let c;try{if(open&&!t.maxed)c=M.skillCost(h,i);}catch{}
    for(const k of ['rank-plate','category-plate','tray-wide','next-card2','header-tag'])el.style.setProperty('--st-'+k,cssUrl(k));
    const nameKey=`skills.skill-name-${hero}-${i}`;C[nameKey]=t.name;
    const [desc,more]=summary(t.description);
    // The panel repeats the selected medallion (socket, branch colour, gold ring) so it reads as that node's card.
    let html=`<img class="sd-socket" src="${art(open?'socket':'frame-locked')}" alt="" style="${open?rel(46,1022,128,128):rel(50,1018,120,134)}"><i class="sd-well${open?'':' locked'}" style="${rel(74,1050,72,72)};--el:${WELL[i]}"></i>`+
      `<img class="sd-icon${open?'':' locked'}" src="${skillArt(hero,i)}" alt="" style="${rel(68,1044,84,84)}">`+(open?`<img class="sd-ring" src="${art('select-ring')}" alt="" style="${rel(34,1010,152,152)}">`:'')+
      `<b class="sd-rank" style="${rel(40,1152,140,42)}">Lv.${t.rank}${t.bonusRank?' (+'+t.bonusRank+')':''}/${t.max}</b>`+
      `<b class="sd-name" data-copy="${esc(nameKey)}" style="${rel(198,1022,686,50)}">${esc(t.name)}</b>`+
      `<b class="sd-branch" style="${rel(198,1072,220,40)}">${esc(M.SKILL_BRANCHES[i])}</b>`+
      `<p class="sd-desc" style="${rel(198,1112,692,84)}">${esc(desc)}</p>`+
      (more?`<button type="button" class="sd-more" data-action="skilltree:info" data-hero="${esc(hero)}" data-index="${i}" style="${rel(430,1069,140,46)}" aria-label="Xem đầy đủ"><span>Chi tiết</span></button>`:'');
    const left=c?(t.rank===0?'Nguyên liệu học':'Nguyên liệu'):t.maxed?'Hoàn thiện':'Điều kiện';
    const lw=left.length>12?292:250;html+=`<b class="sd-head" style="${rel(323-lw/2,1200,lw,46)}">${left}</b><div class="sd-tray" style="${rel(40,1228,566,140)}">`;
    if(c){const list=Object.entries(c).filter(([,n])=>n>0);
      html+=`<div class="sd-mats n${list.length}">`+list.map(([id,n])=>{const have=owned(p,id),ok=have>=n;return `<button type="button" class="sd-mat ${ok?'ok':'short'}" data-action="item:${id}" aria-label="${esc(M.RESOURCES[id]?.[0]||id)} · có ${tight(have)} · cần ${tight(n)}"><img src="${file(M.RESOURCES[id]?.[1]||id)}" alt=""><span>Có ${tight(have)}</span><b>Cần ${tight(n)}</b></button>`;}).join('')+'</div>';}
    else if(t.maxed)html+=`<p class="sd-note">✓ Cấp tối đa</p>`;
    else if(!h)html+=`<p class="sd-note">${esc(M.heroAvailable&&!M.heroAvailable(hero)?'Tướng xuất hiện ở kỳ triệu hồi sau.':'Cần sở hữu tướng.')}</p>`;
    else html+=`<p class="sd-note"><span>Cần: ${esc(gateLines(i).filter(Boolean).join(' · '))}</span><small>Hiện tại: Cấp ${h.level} · Tiến hóa ${h.evolution||0}</small></p>`;
    html+='</div>';
    const right=!open?'Khi mở':t.maxed?'Cấp tối đa':t.rank===0?'Khi học':'Cấp kế';
    const lines=!open||t.rank===0?rows(t.values):t.maxed?rows(t.values):String(t.next||'').split(' · ').filter(Boolean);
    // Each line splits into its label and its value; the card fits the longest value (Cambria bold ≈ .55 em a glyph),
    // dropping the small picture when the value needs the room.
    const parts=lines.slice(0,3).map(l=>{const k=l.search(/[-+×]?\d/);return k>0?[l.slice(0,k).trim(),l.slice(k)]:['',l];});
    const one=parts.length===1,longest=Math.max(...parts.map(([,v])=>v.length),1),pic=one&&longest<=9;
    const room=pic?176:238,size=Math.min(one?36:28,Math.floor(room/(longest*.55))),label=Math.min(one?27:25,Math.floor(room/(Math.max(...parts.map(([a])=>a.length),1)*.5)));
    html+=`<b class="sd-head" style="${rel(646,1200,230,46)}">${right}</b><div class="sd-card${one?' one':' many'}" style="${rel(624,1228,274,140)};--v:${size}px;--l:${label}px">`+
      (pic?`<img src="${skillArt(hero,i)}" alt="">`:'')+`<p>${parts.map(([a,v])=>`<span>${a?`<small>${esc(a)}</small>`:''}<b>${esc(v).replace('→','<i>→</i>')}</b></span>`).join('')}</p></div>`;
    const ready=!!c&&affordable(p,c),action=t.maxed?'Đã Tối Đa':!open?'Chưa Mở':!ready&&c?'Thiếu nguyên liệu':t.rank===0?'Học':'Tăng Cấp';
    html+=`<button type="button" class="sd-go ${ready?'ready':'off'}" data-action="do:train" data-hero="${esc(hero)}" data-index="${i}" ${ready?'':'disabled'} style="${!ready&&c?rel(250,1376,440,100):rel(300,1376,340,100)}"><img src="${art(ready?'button-ready':'button-locked')}" alt=""><span>${action}</span></button>`;
    el.innerHTML=html;
  }
  const OLD=/^skills\.(node-\d|node-level-\d|link-\d|locked-\d|selected-icon|skill-name-|skill-category|skill-level|skill-description-|materials-title|skill-materials-|next-title|next-effect-|upgrade-skill|unlock-requirement)/;
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='skills')return p;
    // Codex text review 25: the slogan and the second title add nothing to tap; the tree speaks for itself.
    const nodes=L.screens.skills.nodes.filter(n=>!OLD.test(n.id)&&!/^skills\.(motto|path-title|path-title-board)$/.test(n.id));
    nodes.push({id:'skills.tree',kind:'content',rect:STAGE_TREE,className:'exploration-map st-tree',build:el=>tree(el,p,state)});
    nodes.push({id:'skills.detail',kind:'content',rect:[PX,PY,911,484],className:'exploration-map st-detail',build:el=>detail(el,p,state)});
    L.screens.skills.nodes=nodes;return p;
  };
  const handle=G.handle;
  G.handle=(action,el,ctx,state)=>{
    if(action!=='skilltree:info')return handle(action,el,ctx,state);
    const hero=el.dataset.hero,i=Number(el.dataset.index),h=G.engine.read().heroes[hero],t=M.skillText(hero,h,i);
    ctx.showModal(`${t.name} · ${M.SKILL_BRANCHES[i]}`,[],t.description);return true;
  };
})();
