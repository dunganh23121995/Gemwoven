/* The game's own motion switch (Cài Đặt › Hiệu ứng động), on by default.
 * Windows "Animation effects" off (common on work PCs) makes every browser and VS Code report
 * prefers-reduced-motion, which used to stop all hub animation. The game now follows its own
 * setting: this runs first, answers the reduced-motion media query from the setting, and marks
 * <html> with .reduced-motion so the stylesheets can follow it. */
(() => {
  const KEY='gemwoven.motion';
  let saved=null;try{saved=localStorage.getItem(KEY);}catch{}
  const reduced=saved==='reduced';
  document.documentElement.classList.toggle('reduced-motion',reduced);
  const QUERY=/prefers-reduced-motion\s*:\s*reduce/;
  const native=window.matchMedia?.bind(window);
  if(native)window.matchMedia=query=>{
    if(!QUERY.test(query))return native(query);
    return {matches:reduced,media:query,onchange:null,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){},dispatchEvent(){return false;}};
  };
  window.GemwovenMotion={reduced,set(on){try{localStorage.setItem(KEY,on?'full':'reduced');}catch{}location.reload();}};
})();
