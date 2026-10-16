// Reusable vector carvings keep the antique frame crisp at phone sizes.
function installAntiqueTrim(){
  const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'svg');
  defs.classList.add('antique-definitions');defs.setAttribute('aria-hidden','true');
  defs.innerHTML=`<defs>
    <linearGradient id="antique-metal" x2="1" y2="1"><stop stop-color="#78502b"/><stop offset=".28" stop-color="#f4d99c"/><stop offset=".55" stop-color="#b98b4d"/><stop offset=".78" stop-color="#f5d99b"/><stop offset="1" stop-color="#79522d"/></linearGradient>
    <symbol id="antique-acanthus" viewBox="0 0 80 80">
      <g fill="none" stroke="url(#antique-metal)" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 75V5H75" stroke-width="2"/><path d="M11 65V11H65" stroke-width=".8"/>
        <path d="M16 57C18 39 36 37 37 24C38 11 18 12 19 24C20 32 31 31 30 24M57 16C39 18 37 36 24 37C11 38 12 18 24 19C32 20 31 31 24 30" stroke-width="1.8"/>
        <path d="M16 47C21 38 30 44 28 50C25 58 17 51 16 47M47 16C38 21 44 30 50 28C58 25 51 17 47 16M17 65Q30 57 32 44M65 17Q57 30 44 32" stroke-width="1.2"/>
        <path d="M17 65Q20 54 24 55Q28 60 17 65M65 17Q54 20 55 24Q60 28 65 17M38 15Q43 9 48 14Q43 22 38 15M15 38Q9 43 14 48Q22 43 15 38" fill="#b58a4e" fill-opacity=".55" stroke-width=".6"/>
      </g><path d="M11 6L16 11L11 16L6 11Z" fill="#f1cf88"/><circle cx="39" cy="39" r="2" fill="#e5bd73"/>
    </symbol>
    <symbol id="antique-flourish" viewBox="0 0 240 32">
      <g fill="none" stroke="url(#antique-metal)" stroke-width="1.25" stroke-linecap="round">
        <path d="M5 17H67C91 17 78 3 68 10C57 21 87 31 103 17M235 17H173C149 17 162 3 172 10C183 21 153 31 137 17M84 18Q97 4 114 16M156 18Q143 4 126 16"/>
        <path d="M120 3Q109 14 120 28Q131 14 120 3ZM99 20Q107 30 115 22M141 20Q133 30 125 22"/>
      </g><path d="M120 9L125 16L120 23L115 16Z" fill="#e7c47f"/>
    </symbol>
  </defs>`;
  document.body.prepend(defs);
  for(const panel of document.querySelectorAll('.battle-card,.puzzle-card,dialog')){
    const trim=document.createElement('div');trim.className='antique-trim';trim.setAttribute('aria-hidden','true');
    for(const corner of ['tl','tr','bl','br']){
      const carving=document.createElementNS(ns,'svg');carving.setAttribute('viewBox','0 0 80 80');carving.classList.add('antique-corner',corner);
      const use=document.createElementNS(ns,'use');use.setAttribute('href','#antique-acanthus');carving.append(use);trim.append(carving);
    }
    panel.append(trim);
  }
  for(const heading of document.querySelectorAll('.board-heading,.app-header')){
    const flourish=document.createElementNS(ns,'svg');flourish.classList.add('antique-flourish');flourish.setAttribute('viewBox','0 0 240 32');flourish.setAttribute('aria-hidden','true');
    const use=document.createElementNS(ns,'use');use.setAttribute('href','#antique-flourish');flourish.append(use);heading.append(flourish);
  }
}
installAntiqueTrim();
