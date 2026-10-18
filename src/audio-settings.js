const audioDefaults={music:10,effects:100,voices:29},audioLevels={...audioDefaults};
const audioBuses=new Map(),audioStorageKey='mam-phep-audio-v1';
try{
  const saved=JSON.parse(localStorage.getItem(audioStorageKey)||'null');
  if(localStorage.getItem('gemwoven.audio-muted.v1')==='true')sound=false;
  for(const key of Object.keys(audioDefaults))if(typeof saved?.[key]==='number'&&Number.isFinite(saved[key]))audioLevels[key]=Math.round(Math.max(0,Math.min(100,saved[key])));
}catch{}
function audioOutput(context,channel){
  let bus=audioBuses.get(channel);
  if(!bus||bus.context!==context){
    bus=context.createGain();bus.gain.value=audioLevels[channel]/100;
    bus.connect(context.destination);audioBuses.set(channel,bus);
  }
  return bus;
}
function renderAudioSettings(){
  for(const key of Object.keys(audioDefaults)){
    const input=$('volume-'+key),value=audioLevels[key];
    input.value=value;input.style.setProperty('--level',value+'%');
    $('volume-'+key+'-value').value=value===0?'Tắt':value+'%';
    input.setAttribute('aria-valuetext',value===0?'Tắt':value+' phần trăm');
  }
  $('audioMutedNote').hidden=sound;
}
function setAudioLevel(channel,value){
  audioLevels[channel]=Math.round(Math.max(0,Math.min(100,value)));
  const bus=audioBuses.get(channel);
  if(bus){
    const now=bus.context.currentTime;
    bus.gain.cancelAndHoldAtTime(now);bus.gain.linearRampToValueAtTime(audioLevels[channel]/100,now+.06);
  }
  try{localStorage.setItem(audioStorageKey,JSON.stringify(audioLevels));}catch{}
  renderAudioSettings();
}
for(const key of Object.keys(audioDefaults))$('volume-'+key).addEventListener('input',event=>setAudioLevel(key,Number(event.target.value)));
$('audioSettingsBtn').setAttribute('aria-label','Cài đặt âm thanh');
$('audioSettingsBtn').title='Cài đặt âm thanh';
$('audioSettingsBtn').addEventListener('click',()=>{renderAudioSettings();$('audioSettingsDialog').showModal();});
$('audioResetBtn').addEventListener('click',()=>{for(const [key,value]of Object.entries(audioDefaults))setAudioLevel(key,value);});
$('audioSettingsDialog').addEventListener('click',event=>{
  if(event.target!==event.currentTarget)return;
  const box=event.currentTarget.getBoundingClientRect();
  if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)event.currentTarget.close();
});
renderAudioSettings();
// The full settings live at Home; the combat speaker still offers quick mute.
$('audioSettingsBtn').hidden=true;
$('soundBtn').addEventListener('click',()=>{try{localStorage.setItem('gemwoven.audio-muted.v1',JSON.stringify(!sound));}catch{}});
