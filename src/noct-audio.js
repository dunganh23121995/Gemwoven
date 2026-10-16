// Finished katana recordings, with short wind layers and alternating stereo.
const noctSoundBuffers=new Map(),noctSoundSources=new Set();
let noctSoundEpoch=0,noctSlashVariant=0;
function decodeNoctSound(context,id){
  if(!noctSoundBuffers.has(id))noctSoundBuffers.set(id,(async()=>{
    const binary=atob(ART.noctSounds[id].src.split(',')[1]),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return context.decodeAudioData(bytes.buffer);
  })().catch(error=>{noctSoundBuffers.delete(id);throw error;}));
  return noctSoundBuffers.get(id);
}
function stopNoctSounds(){
  noctSoundEpoch++;
  for(const entry of noctSoundSources)try{entry.source.stop();}catch{}
  noctSoundSources.clear();
}
async function playNoctSound(id,{volume=.34,pan=0}={}){
  const context=combatV3AudioContext();if(!context)return false;
  const epoch=noctSoundEpoch;
  try{
    const buffer=await decodeNoctSound(context,id);
    if(!sound||epoch!==noctSoundEpoch)return false;
    // Bound the mix even when NO FX resolves an entire cascade immediately.
    if(noctSoundSources.size>=8){const oldest=noctSoundSources.values().next().value;try{oldest.source.stop();}catch{}noctSoundSources.delete(oldest);}
    const source=context.createBufferSource(),gain=context.createGain(),stereo=context.createStereoPanner();
    source.buffer=buffer;gain.gain.value=volume;stereo.pan.value=Math.max(-.6,Math.min(.6,pan));
    source.connect(gain);gain.connect(stereo);stereo.connect(audioOutput(context,'effects'));
    const entry={source,id,pan:stereo.pan.value};noctSoundSources.add(entry);
    source.onended=()=>{noctSoundSources.delete(entry);source.disconnect();gain.disconnect();stereo.disconnect();};
    source.start();return true;
  }catch{return false;}
}
async function warmNoctSounds(){
  const context=combatV3AudioContext();if(context)await Promise.allSettled(Object.keys(ART.noctSounds).map(id=>decodeNoctSound(context,id)));
}
$('startBtn').addEventListener('click',()=>{if(state.key==='shadow')warmNoctSounds();});
$('soundBtn').addEventListener('click',()=>{if(!sound)stopNoctSounds();else if(state.key==='shadow')warmNoctSounds();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopNoctSounds();});
$('helpDialog').insertAdjacentHTML('beforeend','<p class="voice-credits">Noct katana: <a href="https://taira-komori.net/freesounden.html" target="_blank" rel="noopener">Taira Komori</a></p>');
