/* The reward transaction completes before this presentation starts. */
(() => {
  const A=window.GEMWOVEN_ASSETS,M=window.GemwovenProgression;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const art=key=>`<img src="${esc((A[key]||A['summon-crystal']).file)}" alt="" draggable="false">`;
  window.GemwovenSummonReveal=results=>new Promise(resolve=>{
    document.getElementById('summon-reveal')?.close();
    const modal=document.createElement('dialog');modal.id='summon-reveal';modal.className='celestial-reveal';
    modal.dataset.phase='sky';modal.dataset.count=results.length;
    modal.style.setProperty('--lake',`url("${new URL(A['summon-lake'].file,document.baseURI).href}")`);
    modal.setAttribute('aria-label','Hồ Tinh Tú · Triệu hồi');
    modal.innerHTML=`<div class="celestial-water" aria-hidden="true"></div><canvas class="celestial-film" aria-hidden="true"></canvas>
      <header><small>GIAO ƯỚC DƯỚI NGÂN HÀ</small><h2>Hồ Tinh Tú</h2><p class="celestial-status" role="status">Tinh tú đang đáp lời…</p></header>
      <button type="button" class="celestial-close" aria-label="Đóng kết quả">×</button>
      <div class="celestial-deck" hidden></div>
      <footer><button type="button" class="celestial-open-all gw-btn" disabled>Mở tất cả</button><p>Phần thưởng đã được lưu vào túi đồ</p></footer>`;
    document.body.append(modal);
    const canvas=modal.querySelector('canvas'),ctx=canvas.getContext('2d'),deck=modal.querySelector('.celestial-deck'),
      status=modal.querySelector('.celestial-status'),all=modal.querySelector('.celestial-open-all');
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    let raf=0,start=performance.now(),elapsed=0,last=0,opened=0,dealt=false,closed=false,width=0,height=0;
    function resize(){
      width=modal.clientWidth;height=modal.clientHeight;
      const dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    function finish(){if(closed)return;closed=true;cancelAnimationFrame(raf);observer.disconnect();motion.removeEventListener('change',changeMotion);modal.remove();resolve();}
    modal.addEventListener('close',finish,{once:true});
    modal.querySelector('.celestial-close').onclick=()=>modal.close();
    const cards=results.map((r,i)=>{
      const card=document.createElement('button');card.type='button';card.className='celestial-card rarity-'+r.rarity;
      card.style.setProperty('--rarity',M.RARITIES[r.rarity].color);card.style.setProperty('--deal',i*90+'ms');
      card.setAttribute('aria-label',`Thẻ ${i+1} · Chưa mở`);card.setAttribute('aria-pressed','false');
      const asset=r.kind==='hero'?'hero-'+r.hero:r.kind==='fragments'?'portrait-'+r.hero:r.kind==='gear'?M.SLOT_ART[r.gear.slot]:M.RESOURCES[r.resource][1];
      card.innerHTML=`<span class="celestial-card-turn"><span class="celestial-back">${art('summon-crystal')}<b>✦</b><small>Chạm để mở</small></span>
        <span class="celestial-front" aria-hidden="true">${art(asset)}<strong>${esc(r.name)}</strong><small>${M.RARITIES[r.rarity].name}</small></span></span>`;
      card.onclick=()=>{
        if(!dealt||card.classList.contains('is-open'))return;
        card.classList.add('is-open');card.setAttribute('aria-pressed','true');
        card.setAttribute('aria-label',r.name+' · '+M.RARITIES[r.rarity].name);
        card.querySelector('.celestial-front').setAttribute('aria-hidden','false');
        card.querySelector('.celestial-back').setAttribute('aria-hidden','true');
        opened++;status.textContent=`Đã mở ${opened} / ${results.length} thẻ`;
        if(opened===results.length){all.disabled=true;status.textContent='Tinh tú đã tìm được chủ nhân';modal.dataset.phase='complete';}
      };deck.append(card);return card;
    });
    function deal(){
      if(dealt||closed)return;dealt=true;deck.hidden=false;all.disabled=!results.length;
      modal.dataset.phase='cards';status.textContent='Chạm từng thẻ để khám phá';cards[0]?.focus({preventScroll:true});
    }
    all.onclick=()=>cards.forEach(card=>card.click());
    function changeMotion(){if(motion.matches){cancelAnimationFrame(raf);ctx.clearRect(0,0,width,height);deal();}}
    motion.addEventListener('change',changeMotion);
    const observer=new ResizeObserver(resize);observer.observe(modal);
    const stars=results.map((r,i)=>({x:results.length===1?.5:.19+((i*7)%11)/11*.64,delay:.4+i*.15,
      color:r.rarity==='divine'?'#e4fbff':r.rarity==='legendary'?'#ffdc87':'#b8d4ff'}));
    function glow(x,y,r,color,alpha){
      const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');
      ctx.globalAlpha=alpha;ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.globalAlpha=1;
    }
    function draw(now){
      if(closed)return;raf=requestAnimationFrame(draw);
      if(document.hidden){last=now;return;}if(now-last<25)return;
      elapsed+=(now-last)/1000;last=now;
      ctx.clearRect(0,0,width,height);
      const t=elapsed,impactY=height*.66;
      if(t>1.2&&!dealt)status.textContent=t<3?'Những vì sao rơi xuống mặt hồ…':'Ánh ngọc đang kết thành giao ước…';
      // A restrained water reflection and rising constellation dust continue behind the deck.
      glow(width*.5,impactY,width*.4,'#68bfff',.1+.04*Math.sin(t));
      for(let i=0;i<24;i++){
        const x=(.08+((i*37)%89)/100)*width,y=(.12+((i*23)%70)/100)*height;
        glow(x,y,2+i%3,'#dfebff',(.2+.15*Math.sin(t*1.4+i))*(dealt?.35:1));
      }
      stars.forEach((s,i)=>{
        const flight=(t-s.delay)/1.75,x=s.x*width;
        if(flight>=0&&flight<1){
          const ease=flight*flight,y=height*(-.12+.78*ease),sx=x-width*.2*(1-ease);
          const tail=ctx.createLinearGradient(sx-20,y-100,sx,y);tail.addColorStop(0,'transparent');tail.addColorStop(1,s.color);
          ctx.strokeStyle=tail;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(sx-20,y-100);ctx.lineTo(sx,y);ctx.stroke();glow(sx,y,15,s.color,.95);
          ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(sx,y,2.5,0,Math.PI*2);ctx.fill();
        }
        const age=t-s.delay-1.75;
        if(age>=0&&age<2.7){
          const fade=Math.max(0,1-age/2.7);glow(x,impactY,45+age*20,s.color,fade*.6);
          for(let ring=0;ring<3;ring++){const r=Math.max(0,age-.15*ring)*width*.19;
            ctx.strokeStyle=s.color;ctx.globalAlpha=fade*.7;ctx.lineWidth=1.5;
            ctx.beginPath();ctx.ellipse(x,impactY,r,r*.24,0,0,Math.PI*2);ctx.stroke();}
          ctx.globalAlpha=1;
          for(let j=0;j<8;j++){const a=j*Math.PI/4,d=age*28;
            glow(x+Math.cos(a)*d,impactY-Math.sin(age/2.7*Math.PI)*65+Math.sin(a)*d*.3,3,s.color,fade);}
        }
      });
      // Reflections gather into a seal before the cards rise from the water.
      const gathering=Math.max(0,Math.min(1,(t-2.8)/.9)),release=Math.max(0,1-(t-4.1)/.7);
      if(gathering>0&&release>0){
        const alpha=gathering*release,cx=width*.5,r=width*.23;
        glow(cx,impactY,r,'#a6dcff',alpha*.5);
        ctx.strokeStyle='#d4eaff';ctx.lineWidth=1.6;ctx.globalAlpha=alpha*.8;
        for(let ring=0;ring<2;ring++){ctx.beginPath();ctx.ellipse(cx,impactY,r+ring*12,(r+ring*12)*.25,0,0,Math.PI*2);ctx.stroke();}
        for(let i=0;i<18;i++){
          const a=i*Math.PI/9+t*.45,rr=r*(.3+i%3*.25),rise=((t*40+i*11)%100);
          glow(cx+Math.cos(a)*rr,impactY+Math.sin(a)*rr*.25-rise,3+i%2,'#e2edff',alpha*.8);
        }
        ctx.globalAlpha=1;
      }
      if(t>=4.8)deal();
    }
    modal.showModal();resize();
    if(motion.matches)deal();else{last=start;raf=requestAnimationFrame(draw);}
  });
})();
