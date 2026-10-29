// Summon showcase (Game.html?qa&showcase): only the battle scene, on a transparent page, so the hub's
// summon cinematic can lay this page over its spotlight and play a newly summoned hero's own combat
// ultimate (every effect and sound of the fight) on the default foe, a slime. The hub drives it
// through window.gemwovenShowcase; the page shows no board, HUD, landscape or music.
if(new URLSearchParams(location.search).has('showcase')){
  document.documentElement.classList.add('showcase');
  window.gemwovenShowcase={
    ready:new Promise(done=>{const t=setInterval(()=>{if(window.gameQA?.art&&document.querySelector('[data-class]')){clearInterval(t);done();}},50);}),
    // Puts the hero (and form) in front of the slime; returns the hero's sprite box in page pixels.
    stage(hero,form){
      const q=window.gameQA,c=q.art.campaignCreatures.slime;
      q.art.enemies.fire=c.idle?{idle:c.idle,attack:c.still,cast:c.still,hurt:c.still}:{idle:c,attack:c,cast:c,hurt:c};
      q.configure({key:hero,form,hp:10000,enemyHp:10000,enemyMax:10000,armor:0,enemyArmor:0,energy:0,enemyEnergy:0,stage:4,enemyKey:'fire',qaElite:false,qaBossArt:'',qaFoeFx:{tier:'normal',creature:'slime'}});
      return this.box();
    },
    // Scales the hero and the slime together (1: the hero box is 40% of the page width).
    size(k){document.documentElement.style.setProperty('--showcase-k',k);return this.box();},
    box(){const r=document.querySelector('#heroActor .sprite-body').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};},
    // The hub keeps its own hero on screen until this one takes over for the ultimate.
    act(on){document.documentElement.classList.toggle('acting',on);},
    play(){return window.gameQA.heroUltimate();}
  };
}
