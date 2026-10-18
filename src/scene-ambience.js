// Original scene themes share the speaker control, but not the combat-effect queue.
const sceneMusicBuffers=new Map(),sceneMusicVoices=new Set(),sceneMusicOffsets=new Map();
let sceneMusicStarted=false,sceneMusicEpoch=0,sceneMusicPending=null,sceneMusicCurrent=null;
function decodeSceneMusic(context,key){
  if(!sceneMusicBuffers.has(key))sceneMusicBuffers.set(key,(async()=>{
    const binary=atob(ART.music[key].src.split(',')[1]),bytes=new Uint8Array(binary.length);
    for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
    return context.decodeAudioData(bytes.buffer);
  })().catch(error=>{sceneMusicBuffers.delete(key);throw error;}));
  return sceneMusicBuffers.get(key);
}
function retireSceneMusic(entry,seconds=0){
  if(!entry||entry.retired)return;
  entry.retired=true;
  const now=entry.context.currentTime;
  sceneMusicOffsets.set(entry.key,(entry.offset+now-entry.started)%entry.source.buffer.duration);
  entry.gain.gain.cancelAndHoldAtTime(now);
  entry.gain.gain.linearRampToValueAtTime(0,now+seconds);
  try{entry.source.stop(now+seconds+.015);}catch{}
  if(!seconds){entry.source.disconnect();entry.gain.disconnect();sceneMusicVoices.delete(entry);}
}
function stopSceneMusic(){
  sceneMusicEpoch++;sceneMusicPending=null;sceneMusicCurrent=null;
  // Include voices already fading out, even when the shared context is suspended.
  for(const entry of sceneMusicVoices){
    entry.retired=false;retireSceneMusic(entry);
  }
  delete $('scene').dataset.music;
}
async function syncSceneMusic(){
  if(!sceneMusicStarted||!sound||document.hidden){stopSceneMusic();return;}
  const key=progressionMusicKey();
  if(sceneMusicCurrent?.key===key){
    // Cancel an obsolete decode if a quick transition returns to this scene.
    if(sceneMusicPending){sceneMusicEpoch++;sceneMusicPending=null;}
    return;
  }
  if(sceneMusicPending===key)return;
  const context=combatV3AudioContext();if(!context)return;
  const epoch=++sceneMusicEpoch;sceneMusicPending=key;
  try{
    const buffer=await decodeSceneMusic(context,key);
    if(epoch!==sceneMusicEpoch||!sound||document.hidden||progressionMusicKey()!==key)return;
    const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
    source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=buffer.duration;
    const offset=(sceneMusicOffsets.get(key)||0)%buffer.duration;
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.24,now+1.4);
    source.connect(gain);gain.connect(audioOutput(context,'music'));
    const entry={key,source,gain,context,started:now,offset,retired:false};
    source.onended=()=>{source.disconnect();gain.disconnect();sceneMusicVoices.delete(entry);};
    source.start(now,offset);
    retireSceneMusic(sceneMusicCurrent,1.4);
    sceneMusicCurrent=entry;sceneMusicVoices.add(entry);$('scene').dataset.music=key;
  }catch(error){
    // A decoding failure must not stop combat or other sounds.
    console.warn('Scene music unavailable:',key,error);
  }finally{if(epoch===sceneMusicEpoch)sceneMusicPending=null;}
}
function mountSceneAmbience(){
  let atmosphere=$('sceneAtmosphere');
  if(!atmosphere){
    atmosphere=document.createElement('div');atmosphere.id='sceneAtmosphere';atmosphere.className='scene-atmosphere';
    atmosphere.setAttribute('aria-hidden','true');
    atmosphere.innerHTML='<div class="ambient-mist mist-far"></div><div class="ambient-mist mist-near"></div>'+
      Array.from({length:12},(_,i)=>`<i class="ambient-speck" style="--x:${7+(i*29)%88}%;--y:${12+(i*17)%73}%;--drift:${i%2?18:-13}px;--size:${2+i%3}px;--duration:${9+i%5*2}s;--delay:${-i*2.7}s"></i>`).join('');
    $('landscape').after(atmosphere);
  }
  syncSceneMusic();
}
$('startBtn').addEventListener('click',()=>{sceneMusicStarted=true;syncSceneMusic();});
$('soundBtn').addEventListener('click',()=>{if(sound)syncSceneMusic();else stopSceneMusic();});
document.addEventListener('visibilitychange',()=>{
  document.body.classList.toggle('ambience-paused',document.hidden);
  if(document.hidden)stopSceneMusic();else syncSceneMusic();
});
