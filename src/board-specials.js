/* Special gems (owner 05/11, Claude + Codex "Vòng Ngọc đặc biệt"; spec in assets/gemwoven/raw/board-specials/codex-spec.md).
 * One pure rule set shared by the live board (game.js makePlan), the opponent AI (numeric cells) and the simulators:
 *   a straight 4 makes a Sao băng that clears its row (matched horizontally) or column (matched vertically);
 *   a straight 5+ makes a Lõi that clears one colour; an L/T or crossing cluster of 5+ makes a Bom clearing 3×3.
 *   Priority inside one cluster: Lõi > Bom > Sao băng, one special per cluster.
 *   Swapping two specials always fires a combo: Sao+Sao a cross, Sao+Bom three rows and three columns, Bom+Bom 5×5,
 *   Lõi+Sao / Lõi+Bom turn that colour's plain gems into the partner kind and fire them all, Lõi+Lõi clears the board once.
 * Positions are p = r*N + c. Callers pass accessors, so the module never touches tiles, DOM or randomness. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.GemwovenSpecials=api;})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  'use strict';
  const N=8,LEN=N*N,NAMES={bolt:'Sao băng',bomb:'Bom',core:'Lõi'};
  // Tuning (balance round, owner's coordinator 05/11: stay within about ±10% of the old specials; measured by
  // qa/gemwoven/special-sim.cjs). The Sao sweeps a 3-lane band ('wide': its row and the rows beside it, or its column and
  // the columns beside it; 'line' and 'cross' kept for trials), the Bom clears 5×5 (radius 2), and a crossing cluster of
  // 6+ gems makes a Lõi as a straight 5 does. boltEnds adds end bursts to a 'line' Sao.
  const TUNE={bombRadius:2,boltEnds:0,boltMode:'wide',coreSize:6};
  const rc=p=>[Math.floor(p/N),p%N];
  const all=()=>Array.from({length:LEN},(_,p)=>p);
  // Geometry of each blast (positions on the board, origin included).
  const line=(p,dir)=>{const [r,c]=rc(p);return dir==='col'?Array.from({length:N},(_,i)=>i*N+c):Array.from({length:N},(_,i)=>r*N+i);};
  const area=(p,radius)=>{const [r,c]=rc(p);return all().filter(q=>{const [qr,qc]=rc(q);return Math.abs(qr-r)<=radius&&Math.abs(qc-c)<=radius;});};
  const cross=p=>[...new Set([...line(p,'row'),...line(p,'col')])];
  const band=(p,half)=>{const [r,c]=rc(p);return all().filter(q=>{const [qr,qc]=rc(q);return Math.abs(qr-r)<=half||Math.abs(qc-c)<=half;});};
  // A matched group's axis: a horizontal run clears its row, a vertical run its column.
  const axis=group=>Math.floor(group[0]/N)===Math.floor(group[1]/N)?'row':'col';
  /** The special one matched cluster makes. groups: the straight runs (position arrays) that lie inside the cluster. */
  function shape(cluster,groups){
    const runs=groups.filter(g=>g.every(p=>cluster.includes(p)));
    const longest=Math.max(0,...runs.map(g=>g.length));
    if(longest>=5||TUNE.coreSize&&cluster.length>=TUNE.coreSize)return {kind:'core',dir:null};
    const axes=new Set(runs.map(axis));
    if(axes.size>1&&cluster.length>=5)return {kind:'bomb',dir:null};
    const four=runs.find(g=>g.length===4);
    return four?{kind:'bolt',dir:axis(four)}:{kind:null,dir:null};
  }
  /** Where the special appears: the swapped gem that belongs to the cluster (dragged first), else the plain gem nearest
   *  the cluster's centre (row first, then column). plain(p) says the gem is not already special. */
  function createAt(cluster,preferred,plain){
    const options=cluster.filter(plain);if(!options.length)return null;
    for(const p of preferred||[])if(options.includes(p))return p;
    const cr=cluster.reduce((s,p)=>s+rc(p)[0],0)/cluster.length,cc=cluster.reduce((s,p)=>s+rc(p)[1],0)/cluster.length;
    return options.slice().sort((a,b)=>{const [ar,ac]=rc(a),[br,bc]=rc(b);return Math.hypot(ar-cr,ac-cc)-Math.hypot(br-cr,bc-cc)||ar-br||ac-bc;})[0];
  }
  /** The colour a Lõi takes when it fires without a partner: the most common colour on the board (ties: fixed order). */
  function mostCommon(typeAt){
    const counts=[0,0,0,0,0];for(let p=0;p<LEN;p++){const t=typeAt(p);if(t>=0&&t<5)counts[t]++;}
    let best=0;for(let t=1;t<5;t++)if(counts[t]>counts[best])best=t;return best;
  }
  /** Positions one special clears when it fires on its own (chain or matched). color: the Lõi's colour. */
  function boltBlast(p,dir){
    if(TUNE.boltMode==='cross')return cross(p);
    if(TUNE.boltMode==='wide'){const [r,c]=rc(p);return all().filter(q=>{const [qr,qc]=rc(q);return dir==='col'?Math.abs(qc-c)<=1:Math.abs(qr-r)<=1;});}
    const cells=line(p,dir);if(!TUNE.boltEnds)return cells;
    // End bursts: at both ends of the line, the cells beside the last one (cut at the board's edge).
    const [r,c]=rc(p),extra=[];
    for(const end of [0,N-1])for(let k=1;k<=TUNE.boltEnds;k++)for(const s of [-1,1]){
      const rr=dir==='col'?end:r+s*k,cc=dir==='col'?c+s*k:end;if(rr>=0&&rr<N&&cc>=0&&cc<N)extra.push(rr*N+cc);}
    return [...new Set([...cells,...extra])];
  }
  function blast(kind,p,dir,typeAt,color){
    if(kind==='bolt')return boltBlast(p,dir||'row');
    if(kind==='bomb')return area(p,TUNE.bombRadius);
    if(kind==='core')return [p,...all().filter(q=>q!==p&&typeAt(q)===color)];
    return [p];
  }
  const ORDER={bolt:0,bomb:1,core:2};
  /** Two specials swapped together. center: where the dragged gem landed. a/b: {p,kind,dir,type}. Returns the direct
   *  clear, the plain gems that turn into the partner kind (Lõi + Sao/Bom) and whether it is the full-board Lõi + Lõi. */
  function combo(a,b,center,typeAt,kindAt){
    const [x,y]=ORDER[a.kind]<=ORDER[b.kind]?[a,b]:[b,a];
    if(x.kind==='core'&&y.kind==='core')return {name:'core+core',clear:all(),turn:[],full:true};
    if(y.kind==='core'){
      // Lõi + Sao / Lõi + Bom: the partner's colour; its plain gems become the partner kind (Sao keeps the partner's line).
      const color=x.type,turn=all().filter(q=>q!==x.p&&q!==y.p&&typeAt(q)===color&&!kindAt(q));
      return {name:'core+'+x.kind,color,kind:x.kind,dir:x.dir,turn,clear:[x.p,y.p,...turn],full:false};
    }
    // Each combo is a step above its parts: Sao+Sao a band of 3 rows and 3 columns, Sao+Bom 5 and 5, Bom+Bom one ring wider.
    const lanes=TUNE.boltMode==='wide'?1:0;
    const clear=x.kind==='bolt'&&y.kind==='bolt'?band(center,lanes):x.kind==='bolt'?band(center,lanes+1):area(center,TUNE.bombRadius+1);
    return {name:x.kind+'+'+y.kind,clear,turn:[],full:false};
  }
  /** Run the specials a clear touches, each once by position, in waves (all hits of a wave fire together).
   *  start: [{p,kind,dir,color}] already firing; isSpecial(p) -> {kind,dir} or null for gems the blasts reach.
   *  Returns {cleared:Set, fired:[{p,kind,dir,color,hits}]}. The board state before the wave decides Lõi colours. */
  function chain(start,initialClear,typeAt,isSpecial){
    const cleared=new Set(initialClear),fired=[],queued=new Set(start.map(s=>s.p));
    const queue=start.slice();
    // gen: 0 for the specials the move fires itself, then +1 for each ring of the chain they set off.
    const reach=(p,gen)=>{if(queued.has(p))return;const s=isSpecial(p);if(s){queued.add(p);queue.push({p,kind:s.kind,dir:s.dir,gen,color:s.kind==='core'?mostCommon(typeAt):undefined});}};
    for(const s of queue)s.gen??=0;
    for(const p of initialClear)reach(p,0);
    for(let i=0;i<queue.length;i++){
      const s=queue[i],hits=blast(s.kind,s.p,s.dir,typeAt,s.color);
      fired.push({...s,hits});
      for(const p of hits){cleared.add(p);reach(p,s.gen+1);}
    }
    return {cleared,fired};
  }
  return {N,LEN,NAMES,TUNE,rc,line,area,cross,band,axis,shape,createAt,mostCommon,blast,combo,chain};
});
