/* Kỹ Năng — the skill tree rebuilt as drawn art (owner 04/11: "Cây kỹ năng dựng lại đi"; Codex critique and the
 * approved mockup assets/gemwoven/raw/skill-tree/mockup-1.png). A carved bough climbs the trunk from the root:
 * Chủ Động → Bị Động → Biến Dị → Chân Thân, in the order the branches open (SKILL_GATES), not a prerequisite chain.
 * Every frame is a Codex picture (assets/gemwoven/skill-tree): medallion frames by state (learned bronze, selected
 * gold laurel, locked stone with its padlock), wooden rank plates, two-line gate plates, a leaf that points at the one
 * suggested next step, a sprout on a skill that can be learned, and one sleeping bud on a side twig for the future
 * branches ("Sắp ra mắt"). The bough's opened part is lit and the rest dry (CSS light on the same picture).
 * The detail panel below uses the same pieces: rank plate, branch plate, a material tray, a "Cấp kế" card.
 * Words and numbers are the HTML layer; rules stay in progression.js (skillUnlock, skillCost, skillText).
 */
(() => {
  'use strict';
  const G=window.GEMWOVEN_GAME,M=window.GemwovenProgression,L=window.GEMWOVEN_LAYOUT,A=window.GEMWOVEN_ASSETS,C=window.GEMWOVEN_DEFAULT_COPY;
  if(!G?.decorate||!M?.skillText||!A?.['skilltree-bough'])return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const file=k=>A[k]?.file||'',art=k=>file('skilltree-'+k);
  const tight=n=>M.compact(n,1000);
  const owned=(p,id)=>id in p.wallet?p.wallet[id]:p.materials[id]||0;
  const affordable=(p,c)=>c&&Object.entries(c).every(([id,n])=>owned(p,id)>=n);
  const box=(x,y,w,h)=>`left:${x}px;top:${y}px;width:${w}px;height:${h}px`;
  const icon=(key,i)=>key==='novice'?['stat-attack','stat-shield','stat-heart','crest'][i]:`skill-${key}-${i}`;
  const skillArt=(key,i)=>file(`skill-${key}-${i}`)||file(icon(key,i));
  // The bough is placed by its own pixels: the raw sheet is 1024x1536, the webp is its crop (144,21)-(927,1535);
  // the four round pads sit at these raw points. S scales raw pixels to stage units.
  const S=.43,RAW={x:144,y:21,w:784,h:1515},PADS=[[399,1230],[780,868],[378,565],[787,232]],TWIG=[150,262];
  const OX=447.7,OY=342-232*S,at=([x,y])=>[OX+x*S,OY+y*S];
  const CENTRES=PADS.map(at),FRAME=144/320;
  // Hole centre of each frame picture (fraction of its own box), measured from the art.
  const FRAMES={learned:[320,327,.5,.512],selected:[331,326,.498,.52],locked:[325,361,.498,.458]};
  // Each branch keeps its own colour in the medallion well (mockup): ember, sky, crimson, violet.
  const WELL=['#c8502e','#3f78c0','#a0304a','#6a4aa0'];
  const STAGE_TREE=[400,250,520,656];// [x,y,w,h] of the tree layer

  function gateLines(i){const g=M.SKILL_GATES[i];return g?[`Cấp ${g.level}`,g.evolution?`Tiến hóa ${g.evolution}`:'']:[''];}
  function rows(values){return (values||[]).map(([l,v,u])=>`${l} ${v}${u}`);}
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
    const open=[0,1,2,3].map(i=>!!h&&M.skillUnlock(h,i)),top=open.lastIndexOf(true);
    // Lit bough: from the root up to the highest opened pad; the side twig stays dry (future branches).
    const litY=top<0?RAW.h:Math.max(0,(PADS[top][1]-RAW.y)/RAW.h*100);
    const twigX=((PADS[2][0]-RAW.x)/RAW.w*100).toFixed(1),twigY=((PADS[3][1]+70-RAW.y)/RAW.h*100).toFixed(1);
    const bough=box(OX+RAW.x*S-STAGE_TREE[0],OY+RAW.y*S-STAGE_TREE[1],RAW.w*S,RAW.h*S);
    let html=`<img class="st-bough dry" src="${art('bough')}" alt="" style="${bough}">`+
      (top<0?'':`<img class="st-bough lit" src="${art('bough')}" alt="" style="${bough};clip-path:polygon(0 ${litY.toFixed(1)}%,${twigX}% ${litY.toFixed(1)}%,${twigX}% ${twigY}%,0 ${twigY}%,0 100%,100% 100%,100% ${litY.toFixed(1)}%)">`);
    const [tx,ty]=at(TWIG).map((v,k)=>v-STAGE_TREE[k]);
    html+=`<button type="button" class="st-soon" data-action="art:skill-soon" style="${box(tx-104,ty-66,124,128)}" aria-label="Nhánh kỹ năng mở rộng · Sắp ra mắt"><img class="st-bud" src="${art('bud')}" alt=""></button>`+
      `<b class="st-ribbon" style="${box(tx-112,ty+14,176,40)}">Sắp ra mắt</b>`;
    CENTRES.forEach(([X,Y],i)=>{
      const cx=X-STAGE_TREE[0],cy=Y-STAGE_TREE[1],t=M.skillText(hero,h,i),rank=h?h.skills[i]||0:0;
      const state_=!open[i]?'locked':i===sel?'selected':'learned',learnable=open[i]&&rank===0,right=cx>(CENTRES[0][0]+CENTRES[1][0])/2-STAGE_TREE[0];
      html+=`<button type="button" class="st-node skill-live ${state_}${i===sel?' on':''}${i===next?' next':''}${open[i]?'':' skill-unavailable'}" data-action="do:skill-node" data-index="${i}" style="${box(cx-72,cy-72,144,144)}" aria-label="${esc(t.name)} · ${esc(M.SKILL_BRANCHES[i])}${open[i]?` · ${rank}/${M.SKILL_MAX}`:' · '+esc(gateLines(i).join(' '))}">`+
        `<i class="st-well" style="--el:${WELL[i]}"></i><img class="st-icon" src="${skillArt(hero,i)}" alt=""></button>`+frame(state_,[cx,cy]);
      if(i===next)html+=`<img class="st-pointer ${right?'':'flip'}" src="${art('pointer')}" alt="" style="${box(right?cx+70:cx-70-64,cy-16,64,28)}">`;
      if(learnable)html+=`<img class="st-sprout" src="${art('sprout')}" alt="" style="${box(cx+28,cy-80,50,36)}">`;
      if(open[i])html+=`<b class="st-rank${learnable?' learn':''}" style="${box(cx-66,cy+54,132,42)}">${learnable?'Học':`${rank}/${M.SKILL_MAX}`}</b>`;
      else{const [a,b]=gateLines(i);html+=`<b class="st-gate${b?'':' one'}" style="${box(cx-92,cy+80,184,b?80:58)}"><span>${esc(a)}</span>${b?`<span>${esc(b)}</span>`:''}</b>`;}
    });
    el.style.setProperty('--st-rank',`url("${new URL(art('rank-plate'),document.baseURI).href}")`);
    el.style.setProperty('--st-gate',`url("${new URL(art('gate-plate'),document.baseURI).href}")`);
    el.style.setProperty('--st-ribbon',`url("${new URL(art('ribbon'),document.baseURI).href}")`);
    el.innerHTML=html;
  }
  // The detail panel (stage box [15,1004,911,484]; children are placed relative to it).
  const PX=15,PY=1004,rel=(x,y,w,h)=>box(x-PX,y-PY,w,h);
  function detail(el,p,state){
    const hero=state.hero,h=p.heroes[hero],i=state.skill||0,t=M.skillText(hero,h,i),open=!!h&&t.unlocked;
    let c;try{if(open&&!t.maxed)c=M.skillCost(h,i);}catch{}
    for(const k of ['rank-plate','category-plate','tray','next-card','header-tag'])el.style.setProperty('--st-'+k,`url("${new URL(art(k),document.baseURI).href}")`);
    const nameKey=`skills.skill-name-${hero}-${i}`;C[nameKey]=t.name;
    let html=`<img class="sd-icon${open?'':' locked'}" src="${skillArt(hero,i)}" alt="" style="${rel(64,1026,150,150)}">`+
      `<b class="sd-rank" style="${rel(59,1158,160,46)}">Lv.${t.rank}${t.bonusRank?' (+'+t.bonusRank+')':''}/${t.max}</b>`+
      `<b class="sd-name" data-copy="${esc(nameKey)}" style="${rel(244,1024,640,52)}">${esc(t.name)}</b>`+
      `<b class="sd-branch" style="${rel(244,1078,220,46)}">${esc(M.SKILL_BRANCHES[i])}</b>`+
      `<p class="sd-desc" style="${rel(244,1128,646,90)}">${esc(t.description)}</p>`;
    const left=c?(t.rank===0?'Nguyên liệu học':'Nguyên liệu'):t.maxed?'Hoàn thiện':'Điều kiện';
    html+=`<b class="sd-head" style="${rel(118,1222,250,54)}">${left}</b><div class="sd-tray" style="${rel(46,1252,412,128)}">`;
    if(c){const list=Object.entries(c).filter(([,n])=>n>0);
      html+=`<div class="sd-mats n${list.length}">`+list.map(([id,n])=>{const have=owned(p,id);return `<button type="button" class="sd-mat ${have>=n?'':'short'}" data-action="item:${id}" aria-label="${esc(M.RESOURCES[id]?.[0]||id)} · có ${tight(have)} · cần ${tight(n)}"><img src="${file(M.RESOURCES[id]?.[1]||id)}" alt=""><b>${tight(have)}/${tight(n)}</b></button>`;}).join('')+'</div>';}
    else if(t.maxed)html+=`<p class="sd-note">✓ Cấp tối đa</p>`;
    else if(!h)html+=`<p class="sd-note">${esc(M.heroAvailable&&!M.heroAvailable(hero)?'Tướng xuất hiện ở kỳ triệu hồi sau.':'Cần sở hữu tướng.')}</p>`;
    else{const g=M.SKILL_GATES[i];html+=`<p class="sd-note"><span>Cần ${esc(gateLines(i).filter(Boolean).join(' · '))}</span><small>Hiện tại: cấp ${h.level} · tiến hóa ${h.evolution||0}</small></p>`;void g;}
    html+='</div>';
    const right=!open?'Khi mở':t.maxed?'Cấp tối đa':t.rank===0?'Khi học':'Cấp kế';
    const lines=!open||t.rank===0?rows(t.values):t.maxed?rows(t.values):String(t.next||'').split(' · ').filter(Boolean);
    html+=`<b class="sd-head" style="${rel(574,1222,230,54)}">${right}</b><div class="sd-card" style="${rel(484,1252,404,128)}">`+
      `<img src="${skillArt(hero,i)}" alt="">`+`<p class="${lines.length>1?'many':''}">${lines.slice(0,3).map(l=>{const k=l.search(/[-+×]?\d/);return `<span>${k>0?`<small>${esc(l.slice(0,k).trim())}</small>`:''}<b>${esc(k>0?l.slice(k):l).replace('→','<i>→</i>')}</b></span>`;}).join('')}</p></div>`;
    const ready=!!c&&affordable(p,c),label=t.maxed?'Đã Tối Đa':!open?'Chưa Mở':t.rank===0?'Học':'Tăng Cấp';
    html+=`<button type="button" class="sd-go ${ready?'ready':'off'}" data-action="do:train" data-hero="${esc(hero)}" data-index="${i}" ${ready?'':'disabled'} style="${rel(300,1388,340,95)}"><img src="${art(ready?'button-ready':'button-locked')}" alt=""><span>${label}</span></button>`;
    el.innerHTML=html;
  }
  const OLD=/^skills\.(node-\d|node-level-\d|link-\d|locked-\d|selected-icon|skill-name-|skill-category|skill-level|skill-description-|materials-title|skill-materials-|next-title|next-effect-|upgrade-skill|unlock-requirement)/;
  const decorate=G.decorate;
  G.decorate=state=>{
    const p=decorate(state);if(state.screen!=='skills')return p;
    const nodes=L.screens.skills.nodes.filter(n=>!OLD.test(n.id));
    // The path title gets a little room inside its board (Codex review).
    for(const n of nodes)if(n.id==='skills.path-title'){n.rect=[574,177,281,51];n.size=29;}
    nodes.push({id:'skills.tree',kind:'content',rect:STAGE_TREE,className:'exploration-map st-tree',build:el=>tree(el,p,state)});
    nodes.push({id:'skills.detail',kind:'content',rect:[PX,PY,911,484],className:'exploration-map st-detail',build:el=>detail(el,p,state)});
    L.screens.skills.nodes=nodes;return p;
  };
})();
