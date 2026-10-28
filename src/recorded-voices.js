// Separate hero performances and creature SFX, embedded for offline playback.
const voiceBuffers=new Map(),activeVoices=new Map(),voiceVariants=new Map();
let voiceEpoch=0,bossDeathVoicePlayed=false;
function decodeCombatVoice(context,id){
  if(!voiceBuffers.has(id))voiceBuffers.set(id,(async()=>{
    return context.decodeAudioData(await artBytes(ART.voices[id].src));
  })().catch(error=>{voiceBuffers.delete(id);throw error;}));
  return voiceBuffers.get(id);
}
async function warmCombatVoices(){
  const context=combatV3AudioContext();if(!context)return;
  await Promise.allSettled(Object.keys(ART.voices).map(id=>decodeCombatVoice(context,id)));
}
function stopCombatVoices(){
  stopNoctSounds();
  stopCastSounds();
  voiceEpoch++;
  for(const entry of activeVoices.values())if(entry.source)try{entry.source.stop();}catch{}
  activeVoices.clear();
  for(const side of ['hero','enemy'])delete actor(side).dataset.voiceClip;
}
// A campaign boss, elite or common foe speaks with its cast voice (common foes by species);
// anything uncast falls back to the element's creature (or boss) voice.
function foeVoiceFamily(key){
  const battle=typeof progressionBattle!=='undefined'?progressionBattle:null,cast=ART.voiceCasting||{};
  const owner=state.qaFoeFx||{boss:battle?.bossId,tier:battle?.tier};
  const creature=battle?.creature||state.qaFoeFx?.creature;
  const own=state.boss?cast.bosses?.[owner.boss]:owner.tier==='elite'?cast.elites?.[creature]:cast.creatures?.[creature];
  return own&&ART.voices[own+'-attack1']?own:(state.boss?'boss-':'creature-')+key;
}
async function combatVoice(side,kind='attack'){
  const death=side==='enemy'&&kind==='death';
  if(death){
    if(!state.boss||state.enemyHp>0||bossDeathVoicePlayed)return false;
    bossDeathVoicePlayed=true;
    // The finishing roar replaces an in-flight hurt/attack, including a clip
    // that is still decoding. Subsequent combo hits cannot interrupt it.
    const previous=activeVoices.get(side);activeVoices.delete(side);
    if(previous?.source)try{previous.source.stop();}catch{}
  }else if(side==='enemy'&&state.enemyHp<=0)return false;
  const context=combatV3AudioContext();if(!context||activeVoices.has(side))return false;
  const key=side==='hero'?state.key:state.enemyKey,monster=side==='enemy';
  const family=monster?foeVoiceFamily(key):{fire:'mika',earth:'nori',ice:'yuki',lightning:'lumi',shadow:'noct',novice:'hiro'}[key];
  const variantKey=family+kind,index=voiceVariants.get(variantKey)||0;
  const id=family+'-'+kind+(['attack','hurt'].includes(kind)?index%3+1:'');
  const entry={epoch:voiceEpoch,id,source:null};activeVoices.set(side,entry);
  try{
    if(!ART.voices[id]){activeVoices.delete(side);return false;}// Hiro has attack takes only
    const buffer=await decodeCombatVoice(context,id);
    if(!sound||entry.epoch!==voiceEpoch||activeVoices.get(side)!==entry)return false;
    voiceVariants.set(variantKey,index+1);
    const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter(),now=context.currentTime;
    source.buffer=buffer;
    source.playbackRate.value=1;
    filter.type='highpass';filter.frequency.value=monster?30:95;
    gain.gain.value=monster?(death?.85:state.boss?.68:.58):key==='shadow'?1:.90;
    source.connect(filter);filter.connect(gain);gain.connect(audioOutput(context,'voices'));
    // A quiet, short room reflection gives the whole syllable a natural tail.
    const delay=context.createDelay(.2),reflection=context.createGain();delay.delayTime.value=monster?.028:.075;reflection.gain.value=monster?.045:key==='shadow'?.025:.08;
    gain.connect(delay);delay.connect(reflection);reflection.connect(audioOutput(context,'voices'));
    entry.source=source;actor(side).dataset.voiceClip=id;
    source.onended=()=>{
      if(activeVoices.get(side)===entry){activeVoices.delete(side);delete actor(side).dataset.voiceClip;}
      source.disconnect();filter.disconnect();
      setTimeout(()=>{gain.disconnect();delay.disconnect();reflection.disconnect();},160);
    };
    source.start(now);return true;
  }catch(error){if(activeVoices.get(side)===entry)activeVoices.delete(side);return false;}
  finally{if(entry.epoch!==voiceEpoch&&activeVoices.get(side)===entry)activeVoices.delete(side);}
}
$('startBtn').addEventListener('click',()=>queueMicrotask(warmCombatVoices));
$('soundBtn').addEventListener('click',()=>queueMicrotask(()=>sound?warmCombatVoices():stopCombatVoices()));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCombatVoices();});
$('helpDialog').insertAdjacentHTML('beforeend','<p class="voice-credits">Noct: <a href="https://youfulca.com/2022/08/06/cool/" target="_blank" rel="noopener">YouFulca · Cool / Lone Rival</a></p>');
$('helpDialog').insertAdjacentHTML('beforeend','<p class="voice-credits">Voice: <a href="https://opengameart.org/content/female-rpg-voice-starter-pack" target="_blank" rel="noopener">Cici Fyre</a> · <a href="https://freesound.org/" target="_blank" rel="noopener">Freesound (CC0)</a> · <a href="https://youfulca.com/2022/08/07/fighter/" target="_blank" rel="noopener">YouFulca</a></p>');
$('helpDialog').insertAdjacentHTML('beforeend','<p class="voice-credits">Sấm: <a href="https://freesound.org/people/seth-m/sounds/458015/" target="_blank" rel="noopener">seth-m</a> · Sét đánh: <a href="https://freesound.org/people/Simon%20Spiers/sounds/437243/" target="_blank" rel="noopener">Simon Spiers</a> (CC0, đã biên tập)</p>');
$('helpDialog').insertAdjacentHTML('beforeend','<p class="voice-credits">Băng nộ Yuki: <a href="https://freesound.org/people/j_p_higgins/sounds/262633/" target="_blank" rel="noopener">j_p_higgins · Ice Crack 3</a> · <a href="https://freesound.org/people/Za-Games/sounds/539968/" target="_blank" rel="noopener">Za-Games · Deep Boom</a> (CC0, đã lọc âm, phối và thêm vang trầm)</p>');
$('helpDialog').insertAdjacentHTML('beforeend','<p class="voice-credits">Khiên Nori: <a href="https://freesound.org/people/Hybrid_V/sounds/319590/" target="_blank" rel="noopener">Hybrid_V · Shield Bash Impact</a> — <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a> (đã cắt, EQ và thêm vang). Gió lửa Mika: <a href="https://freesound.org/people/hnhnh/sounds/244926/" target="_blank" rel="noopener">hnhnh · fire-whoosh.wav</a> (CC0, đã biên tập).</p>');
