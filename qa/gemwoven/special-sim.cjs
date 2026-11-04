/* Special gems before/after (owner 05/11; src/board-specials.js). Plays seeded boards turn by turn with a greedy bot that
 * also uses specials (swaps two specials, taps or swaps a Lõi) under the OLD rules (cluster 4 → 5×5 blast, 5 → colour
 * clear, 6+ → Lõi, double Lõi = full board once per special) and the NEW rules (straight 4 → row/column Sao băng, straight
 * 5+ → Lõi, L/T → Bom 3×3, special combos, double Lõi = board once). Rage per gem and sword damage stay the current
 * table for both, so only the specials differ. Reports rage/turn, damage/turn, gems cleared/turn, specials fired/turn
 * and turns to drain a fixed foe.   node qa/gemwoven/special-sim.cjs [turns=20000] [seeds=10]
 */
const S=require('../../src/board-specials.js');
const N=8,LEN=64,RAGE=(process.env.RAGE||'7,2,5,2,2').split(',').map(Number),SWORD=0;
const TURNS=+(process.argv[2]||20000),SEEDS=+(process.argv[3]||10);
// Variants: BOMB_R=2 (5×5 Bom), BOLT_ENDS=1 (end bursts), RAGE=3,2,7,2,2 (another rage table for both rule sets).
if(process.env.BOMB_R)S.TUNE.bombRadius=+process.env.BOMB_R;if(process.env.BOLT_ENDS)S.TUNE.boltEnds=+process.env.BOLT_ENDS;if(process.env.BOLT_MODE)S.TUNE.boltMode=process.env.BOLT_MODE;if(process.env.CORE_SIZE)S.TUNE.coreSize=+process.env.CORE_SIZE;
function rng(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
// A cell: {t: colour 0-4 or -1 for a Lõi, k: null|'bolt'|'bomb'|'core', d: 'row'|'col'}
const cell=(t,k=null,d)=>({t,k,d});
function runs(b){const groups=[];
  for(let axis=0;axis<2;axis++)for(let i=0;i<N;i++)for(let j=0;j<N;){
    const at=k=>axis?k*N+i:i*N+k,t=b[at(j)]?.t;let e=j+1;
    if(t>=0)while(e<N&&b[at(e)]?.t===t)e++;
    if(t>=0&&e-j>=3)groups.push(Array.from({length:e-j},(_,k)=>at(j+k)));j=Math.max(j+1,e);}
  return groups;}
function clusters(groups){const out=[];for(const g of groups){let c=new Set(g);for(let i=out.length-1;i>=0;i--)if([...c].some(p=>out[i].has(p))){out[i].forEach(p=>c.add(p));out.splice(i,1);}out.push(c);}return out.map(c=>[...c]);}
function refill(b,rand){for(let c=0;c<N;c++){const col=[];for(let r=N-1;r>=0;r--)if(b[r*N+c])col.push(b[r*N+c]);for(let r=N-1;r>=0;r--)b[r*N+c]=col[N-1-r]||cell(Math.floor(rand()*5));}}
function seed(rand){const b=new Array(LEN);do{for(let p=0;p<LEN;p++)b[p]=cell(Math.floor(rand()*5));let g;while((g=runs(b)).length){for(const x of g)for(const p of x)b[p]=null;refill(b,rand);}}while(!moves(b).length);return b;}
function swap(b,i,j){const t=b[i];b[i]=b[j];b[j]=t;}
function moves(b){const out=[];for(let i=0;i<LEN;i++)for(const j of [i%N<N-1?i+1:-1,i+N<LEN?i+N:-1]){if(j<0)continue;
  if(b[i].k&&b[j].k||b[i].k==='core'||b[j].k==='core'){out.push([i,j]);continue;}swap(b,i,j);const ok=runs(b).length;swap(b,i,j);if(ok)out.push([i,j]);}
  for(let p=0;p<LEN;p++)if(b[p].k==='core')out.push([p,-1]);return out;}
// ---- the two rule sets: what a cleared set fires, and what a match creates ----
const OLD={
  create(cluster,groups,pref){const n=cluster.length,k=n>=6?'core':n===5?'bomb':n===4?'bolt':null;return k?{k,at:pref.find(p=>cluster.includes(p))??cluster[Math.floor(n/2)]}:null;},
  blast(b,p){const s=b[p],[r,c]=[Math.floor(p/N),p%N];
    if(s.k==='bolt')return Array.from({length:LEN},(_,q)=>q).filter(q=>Math.abs(Math.floor(q/N)-r)<=2&&Math.abs(q%N-c)<=2);
    if(s.k==='bomb')return Array.from({length:LEN},(_,q)=>q).filter(q=>b[q].t===s.t&&b[q].k!=='core');
    const color=s.color??mostCommon(b);return Array.from({length:LEN},(_,q)=>q).filter(q=>q===p||b[q].t===color);}
};
const NEW={
  create(cluster,groups,pref){const sh=S.shape(cluster,groups);if(!sh.kind)return null;return {k:sh.kind,d:sh.dir,at:S.createAt(cluster,pref,()=>true)};},
  blast(b,p){const s=b[p];return S.blast(s.k,p,s.d,q=>b[q].t,s.color??mostCommon(b));}
};
function mostCommon(b){return S.mostCommon(q=>b[q].t);}
// Clears `start` (positions) and every special it reaches, each once; returns the gems cleared (a colour count).
function fire(b,R,start,primed=[]){const cleared=new Set(start),queue=[...primed],queued=new Set(primed);let fired=0;
  const reach=p=>{if(!queued.has(p)&&b[p].k){queued.add(p);queue.push(p);}};
  start.forEach(reach);
  for(let i=0;i<queue.length;i++){fired++;for(const q of R.blast(b,queue[i])){cleared.add(q);reach(q);}}
  return {cleared,fired};}
function resolve(b,R,move,rand,stats){
  const [i,j]=move,counts=[0,0,0,0,0];let waves=0,fired=0,swordWaves=0,damage=0;
  const take=set=>{const c=[0,0,0,0,0];for(const p of set){if(b[p].t>=0)c[b[p].t]++;}return c;};
  const wave=(set,swords)=>{waves++;swordWaves=swords?swordWaves+1:0;if(swords)damage+=swords*8*(1+Math.min(6,swordWaves-1)*.15)*(swordWaves>=3&&swordWaves%3===0?1.5:1);};
  let first=null;
  if(j<0){const p=i;b[p].color=mostCommon(b);first=fire(b,R,[p],[p]);}
  else{
    swap(b,i,j);const a=b[j],o=b[i];// a: the dragged gem, now at j
    if(a.k&&o.k){
      if(a.k==='core'&&o.k==='core'){if(R===OLD){const total=process.env.OLD_FIX?1:b.filter(x=>x.k).length;for(let w=0;w<total;w++){const all=new Set(Array.from({length:LEN},(_,q)=>q));const c=take(all);c.forEach((n,t)=>counts[t]+=n);wave(all,c[SWORD]);all.forEach(q=>b[q]=null);refill(b,rand);}
          fired+=2;stats.fired+=fired;return {counts,waves,damage};}
        first={cleared:new Set(Array.from({length:LEN},(_,q)=>q)),fired:2};}
      else if(R===OLD){const core=a.k==='core'?j:o.k==='core'?i:null;
        if(core!=null){const other=core===j?i:j;b[core].color=b[other].t;first=fire(b,R,[core,other],[core]);}
        else first=fire(b,R,[i,j],[i,j]);}
      else{const c=S.combo({p:j,kind:a.k,dir:a.d,type:a.t},{p:i,kind:o.k,dir:o.d,type:o.t},j,q=>b[q].t,q=>b[q].k);
        if(c.full)first={cleared:new Set(c.clear),fired:2};
        else{for(const q of c.turn){b[q].k=c.kind;b[q].d=c.dir;}b[i].k=b[j].k=null;const r=fire(b,R,c.clear,c.turn);r.fired+=2;first=r;}}
    }else if(a.k==='core'||o.k==='core'){const core=a.k==='core'?j:i,other=core===j?i:j;b[core].color=b[other].t;first=fire(b,R,[core],[core]);}
  }
  let groups=first?null:runs(b),created=[];
  while(first||groups.length){
    let set;
    if(first){set=first.cleared;fired+=first.fired;first=null;}
    else{const pref=waves===0?[j,i]:[];set=new Set(groups.flat());
      for(const cl of clusters(groups)){const s=R.create(cl,groups,pref);if(s){created.push(s);set.delete(s.at);stats.made=(stats.made||0)+1;stats[s.k]=(stats[s.k]||0)+1;}}
      const r=fire(b,R,[...set]);r.cleared.forEach(q=>set.add(q));fired+=r.fired;for(const s of created)set.delete(s.at);}
    const c=take(set);c.forEach((n,t)=>counts[t]+=n);wave(set,c[SWORD]);
    for(const p of set)b[p]=null;
    for(const s of created){b[s.at]=cell(s.k==='core'?-1:b[s.at].t,s.k,s.d);}created=[];
    refill(b,rand);groups=runs(b);
  }
  stats.fired+=fired;return {counts,waves,damage};
}
// Greedy bot: the move with the best immediate value (damage + rage), trying each on a copy.
const copy=b=>b.map(x=>({...x}));
function play(R,seedValue){
  const rand=rng(seedValue),b=seed(rand),stats={fired:0},per={rage:[],damage:[],cleared:[],fired:[]};
  let foe=0,turnsToDrain=[],turnsThisFoe=0,energy=0;
  for(let turn=0;turn<TURNS/SEEDS;turn++){
    let list=moves(b);if(!list.length){const f=seed(rand);for(let p=0;p<LEN;p++)b[p]=f[p];list=moves(b);}
    let best=null,bestValue=-1;
    for(const mv of list.slice(0,60)){const trial=copy(b),st={fired:0},r=resolve(trial,R,mv,rng(turn*7+1),st);const v=r.damage+r.counts.reduce((s,n,t)=>s+n*RAGE[t],0)*.6;if(v>bestValue){bestValue=v;best=mv;}}
    if(rand()<.2)best=list[Math.floor(rand()*list.length)];
    const before=stats.fired,r=resolve(b,R,best,rand,stats),rage=r.counts.reduce((s,n,t)=>s+n*RAGE[t],0);
    energy+=rage;let dmg=r.damage;while(energy>=100){energy-=100;dmg+=120;}
    per.rage.push(rage);per.damage.push(dmg);per.cleared.push(r.counts.reduce((a,c)=>a+c,0));per.fired.push(stats.fired-before);
    foe+=dmg;turnsThisFoe++;if(foe>=1500){turnsToDrain.push(turnsThisFoe);foe=0;turnsThisFoe=0;}
  }
  return {per,turnsToDrain,stats};
}
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length,p95=a=>{const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length*.95)];};
const report={};
for(const [name,R] of [['old',OLD],['new',NEW]]){
  const all={rage:[],damage:[],cleared:[],fired:[]},drain=[];
  const made={};for(let s=1;s<=SEEDS;s++){const r=play(R,s*101);for(const k in all)all[k].push(...r.per[k]);drain.push(...r.turnsToDrain);for(const k of ['made','bolt','bomb','core'])made[k]=(made[k]||0)+(r.stats[k]||0);}
  if(process.env.VERBOSE)console.log(name,'created per 100 turns',Object.fromEntries(Object.entries(made).map(([k,v])=>[k,+(v/TURNS*100).toFixed(1)])));
  report[name]={rage:mean(all.rage),rageP95:p95(all.rage),damage:mean(all.damage),damageP95:p95(all.damage),cleared:mean(all.cleared),fired:mean(all.fired),turnsToDrain1500:mean(drain),turnsP90:p95(drain)};
}
console.table(Object.fromEntries(Object.entries(report).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([a,b])=>[a,+b.toFixed(2)]))])));
const d=(k)=>((report.new[k]/report.old[k]-1)*100).toFixed(1)+'%';
console.log('change new vs old: rage',d('rage'),'damage',d('damage'),'cleared',d('cleared'),'turns to drain',d('turnsToDrain1500'));
