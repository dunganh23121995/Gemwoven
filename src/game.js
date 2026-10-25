(() => {
'use strict';
const $ = id => document.getElementById(id);
const SIZE = 8;
const KEYS = ['fire','earth','ice','lightning'];
const ELEMENTS = {
  fire:{label:'Lửa',color:'#c98673',light:'#f7e6db',beats:'ice',icon:'flame'},
  earth:{label:'Đất',color:'#829a6d',light:'#e9efdd',beats:'lightning',icon:'leaf'},
  ice:{label:'Băng',color:'#7aacc0',light:'#e2f1f3',beats:'earth',icon:'snow'},
  lightning:{label:'Sét',color:'#a48ac4',light:'#eee4f5',beats:'fire',icon:'bolt'},
  shadow:{label:'Bóng tối',color:'#8abcc6',light:'#263344',beats:null,icon:'moon'},
  novice:{label:'Thường',color:'#b6a081',light:'#f1e6ce',beats:null,icon:'sword'}
};
const HEROES = {
  novice:{name:'Hiro',title:'Lữ Khách Tập Sự',hp:145,skill:'Kiếm Nhiệt Huyết',desc:'Một nhát kiếm gỗ · 45 sát thương cơ bản',trait:'Tướng khởi đầu; kỹ năng và chỉ số ở mức cơ bản',color:'#b59b78',dark:'#735b43',hair:'#6e4935'},
  fire:{name:'Mika',title:'Viêm Kiếm Sĩ',hp:170,skill:'Viêm Long Trảm',desc:'Tụ lửa kéo dài kiếm · phóng kiếm khí phát nổ · 135 sát thương cơ bản',trait:'Kiếm gây thêm 60% sát thương',color:'#df9d82',dark:'#a66b64',hair:'#8f5c55'},
  earth:{name:'Nori',title:'Thiết Giáp Vệ',hp:320,skill:'Mộc Linh Hộ Thể',desc:'Choáng 2 lượt · tích sát thương rồi nổ ×3 · hồi 40 HP/lượt ×3',trait:'Sát thương đánh thường giảm 25% (chỉ còn 75% sát thương gốc) · Đại khiên tích lực',color:'#a1b28b',dark:'#708567',hair:'#777363'},
  ice:{name:'Yuki',title:'Băng Tâm Vệ',hp:200,skill:'Thiên Băng Giáng',desc:'+25 giáp · triệu hồi băng gây 60 sát thương · choáng 1 lượt',trait:'Khiên +8 giáp · giảm 20% sát thương',color:'#9cc6d0',dark:'#7399b2',hair:'#adbbd9'},
  lightning:{name:'Lumi',title:'Lôi Cuồng Sư',hp:200,skill:'Ngũ Tinh Lôi',desc:'5 tia sét · tổng 140 sát thương',trait:'Tích năng lượng nhanh gấp đôi',color:'#b8a0d5',dark:'#8973ae',hair:'#d9bb8d'},
  shadow:{name:'Noct',title:'Ảnh Kiếm Sĩ',hp:190,skill:'Ngũ Ảnh Trảm',desc:'5 lượt lướt chém · tổng 150 sát thương',trait:'Lướt chém tốc độ · không chịu khắc hệ',color:'#7d9da9',dark:'#131722',hair:'#141820'}
};
const MONSTERS = {
  fire:{name:'Hỏa Long',boss:'Vua Hỏa Long',attack:'Hỏa tức',skill:'Viêm Long Tức',support:'Vảy hồng',heal:'Hạt lửa hồi sinh'},
  earth:{name:'Thạch Vệ',boss:'Cổ Thụ Đá',attack:'Trọng quyền',skill:'Địa Mạch Bộc Phát',support:'Áo giáp rêu',heal:'Nhựa sống'},
  ice:{name:'Cú Tuyết',boss:'Nữ Hoàng Tuyết',attack:'Lông vũ băng',skill:'Bão Tuyết Mộng Mơ',support:'Kén băng',heal:'Sương mai'},
  lightning:{name:'Lôi Thú',boss:'Chúa Tể Giông',attack:'Lôi kích',skill:'Cuồng Lôi',support:'Màn chắn điện',heal:'Nạp năng lượng'}
};
const TYPES = [
  {name:'Kiếm',icon:'sword',color:'#ba827b',light:'#f7dad0',bg:'#eec2b9',edge:'#d5a29e',effect:'Tấn công'},
  {name:'Tim',icon:'heart',color:'#c486a0',light:'#f5dce8',bg:'#eac5d8',edge:'#d3a6bf',effect:'Hồi máu'},
  {name:'Tinh thể',icon:'crystal',color:'#aa8bc4',light:'#e9dcf7',bg:'#d7c2eb',edge:'#bfa7d8',effect:'Năng lượng'},
  {name:'Băng',icon:'snow',color:'#7ea9c1',light:'#dcf0f6',bg:'#bdddea',edge:'#a2c5d8',effect:'Đóng băng'},
  {name:'Khiên',icon:'shield',color:'#b39b6e',light:'#f5ebcd',bg:'#e9dab0',edge:'#cebd94',effect:'Tăng giáp'}
];
const paths = {
  sword:'<path d="M22 5 27 5 27 10 14 23 9 18Z" fill="currentColor" opacity=".35"/><path d="m10 20 14-14 4-1-1 4-14 14M7 17l8 8M7 24l-3 4M5 22l5 5"/>',
  heart:'<path d="M16 27S3 19 3 11c0-8 10-9 13-2 3-7 13-6 13 2 0 8-13 16-13 16Z" fill="currentColor" stroke="none"/><path d="M8 10q2-3 5-1" stroke="#fff" opacity=".7"/>',
  crystal:'<path d="m16 3 10 10-3 12-7 5-7-5-3-12Z" fill="currentColor" opacity=".35"/><path d="m16 3 10 10-3 12-7 5-7-5-3-12Z M6 13h20M16 3l-4 10 4 17 4-17Z"/><path d="m9 11 6-6" stroke="#fff" opacity=".8"/>',
  snow:'<path d="M16 3v26M5 9l22 14M5 23 27 9M12 6l4 4 4-4M12 26l4-4 4 4M5 14l6-1-1-6M22 25l-1-6 6-1M5 18l6 1-1 6M22 7l-1 6 6 1"/>',
  shield:'<path d="M16 3 27 7v10c0 6-11 12-11 12S5 23 5 17V7Z" fill="currentColor" opacity=".27"/><path d="M16 3 27 7v10c0 6-11 12-11 12S5 23 5 17V7Z"/><path d="M16 9v13M11 15h10" stroke="#fffaf0" stroke-width="3"/>',
  flame:'<path d="M17 2c1 8 11 10 11 19 0 12-24 12-24 0 0-6 4-10 7-12 0 6 3 7 3 7s5-5 3-14Z" fill="currentColor" stroke="none"/><path d="M16 17c0 4 5 5 5 9 0 5-10 5-10 0 0-4 4-6 5-9Z" fill="#fff7db"/>',
  leaf:'<path d="M26 4C10 2 2 10 6 21s23 6 20-17Z" fill="currentColor" opacity=".25"/><path d="M26 4C10 2 2 10 6 21s23 6 20-17ZM5 28 22 9M11 21v-8M16 16h8"/>',
  bolt:'<path d="M18 2 5 19h10l-2 11L28 12H17Z" fill="currentColor" stroke="none"/><path d="m17 8-6 8h7" stroke="#fff" opacity=".6"/>',
  spark:'<path d="m16 2 4 10 10 4-10 4-4 10-4-10-10-4 10-4Z" fill="currentColor" opacity=".6"/><path d="m26 1 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z" fill="currentColor" stroke="none"/>',
  bomb:'<circle cx="15" cy="20" r="10" fill="currentColor" opacity=".4"/><circle cx="15" cy="20" r="10"/><path d="M15 10V6h5l2-3M23 7l4 1M25 3l2-2M9 17l2-2"/>',
  crown:'<path d="m3 8 7 6 6-10 6 10 7-6-4 18H7Z" fill="currentColor" opacity=".3"/><path d="m3 8 7 6 6-10 6 10 7-6-4 18H7ZM8 22h16"/>',
  bulb:'<path d="M11 23h10M12 27h8M14 30h4M10 20C1 10 7 3 16 3s15 7 6 17l-1 3H11Z M16 16v7M12 13l4 3 4-3"/>',
  mouse:'<rect x="8" y="2" width="16" height="28" rx="8"/><path d="M16 3v9"/>',
  help:'<circle cx="16" cy="16" r="13"/><path d="M12 11c0-5 10-5 8 1-1 3-4 2-4 6M16 23v.1"/>',
  sound:'<path d="m14 6-7 6H3v8h4l7 6ZM20 11q6 5 0 10M24 6q11 10 0 20"/>',
  mute:'<path d="m14 6-7 6H3v8h4l7 6ZM21 12l8 8M29 12l-8 8"/>',
  moon:'<path d="M25 22A13 13 0 0 1 10 3 13 13 0 1 0 29 21Z" fill="currentColor" opacity=".3"/><path d="M25 22A13 13 0 0 1 10 3 13 13 0 1 0 29 21Z"/>',
  rainbow:'<path d="M3 25a13 13 0 0 1 26 0" stroke="#d496a3" stroke-width="5"/><path d="M8 25a8 8 0 0 1 16 0" stroke="#c5b48a" stroke-width="4"/><path d="M12 25a4 4 0 0 1 8 0" stroke="#92afc7" stroke-width="3"/>'
};
function icon(name,color='currentColor'){return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="color:${color}">${paths[name]||paths.spark}</svg>`;}
function heroArt(key){
  const h=HEROES[key],c=h.color,d=h.dark,hair=h.hair;
  const ears=key==='fire'?`<path d="m56 67-5-35 29 22M122 54l27-24-5 40" fill="${hair}" stroke="${d}" stroke-width="3"/><path d="m59 55-3-15 16 13M132 53l12-14-3 19" fill="#e8b9a3"/>`:key==='ice'?'<path d="m66 58-2-40q20 4 19 37M118 55q0-33 20-36l-3 42" fill="#d4e3ee" stroke="#9eafcf" stroke-width="2"/><path d="m72 48-2-22 7 25M125 49l7-21-2 25" stroke="#e9c6d2" stroke-width="4"/>':key==='earth'?'<path d="M62 58Q43 40 54 35q17-5 26 20M123 55q13-27 26-17 8 12-11 25" fill="#a4b48e" stroke="#74836a" stroke-width="3"/>':'<path d="m64 56-4-30 25 21M119 47l22-24-1 36" fill="#d9bb8d" stroke="#b69b7d" stroke-width="2"/>';
  const accessory=key==='fire'?'<path d="m124 62 5-13 7 6 10-2-4 14Z" fill="#edc098"/><circle cx="134" cy="60" r="3" fill="#fff0cf"/>':key==='earth'?'<path d="M101 55q-21-21-30-10 0 15 30 10Z" fill="#7f9c70"/><path d="M101 55q18-27 27-17 2 15-27 17Z" fill="#aac38f"/><path d="m101 55 7-20" stroke="#69865f" stroke-width="3"/>':key==='ice'?'<path d="m130 49 4 8 9-1-5 7 3 8-9-3-6 6-1-9-8-4 9-3Z" fill="#f7f9ff" stroke="#adc3d9" stroke-width="1.5"/>':'<path d="M55 61 77 15l19 31q26-10 53 14-43 17-94 1Z" fill="#a18bbf" stroke="#8d77a9" stroke-width="2"/><path d="m77 24 2 6 6 1-5 4 1 6-5-4-5 3 2-6-4-4h6Z" fill="#efdab0"/><path d="M69 47q26 9 51 3" fill="none" stroke="#d1bbdf" stroke-width="5"/>';
  let weapon=key==='fire'?'<path d="m139 136 6-50 8-10 6 11-10 51Z" fill="#fff6dd" stroke="#b59582" stroke-width="2"/><path d="m149 88-5 43" stroke="#f0c79b" stroke-width="3"/><path d="m134 135 24 3" stroke="#ca9c70" stroke-width="6" stroke-linecap="round"/><path d="m145 140-2 15" stroke="#996f66" stroke-width="6"/>':key==='earth'?'<path d="m146 142 1-39" stroke="#9c8067" stroke-width="7"/><rect x="126" y="82" width="42" height="29" rx="10" fill="#a4b096" stroke="#78866f" stroke-width="3"/><path d="M137 87v18m15-18v18" stroke="#c4ceb4" stroke-width="4"/><path d="m139 80 5-9 6 9" fill="#abc895"/>':key==='ice'?'<path d="m144 152 5-59" stroke="#a8b9d4" stroke-width="5"/><path d="m149 67 13 18-13 20-13-20Z" fill="#d9f1f6" stroke="#9fbdd3" stroke-width="2"/><path d="m149 74-1 20M142 84h14" stroke="white" stroke-width="2"/>':'<path d="m143 149 6-57" stroke="#b49ecb" stroke-width="5"/><path d="m150 65 5 10 12 1-8 8 2 11-11-6-10 6 2-11-8-8 11-1Z" fill="#f5dc9c" stroke="#c4a479" stroke-width="2"/><circle cx="149" cy="80" r="3" fill="#fff9dd"/>';
  const shield=key==='earth'?`<path d="M45 124 64 118l18 7-3 26-16 12-16-13Z" fill="#c4d2af" stroke="${d}" stroke-width="3"/><path d="M63 129v22m-8-13h17" stroke="#f0edcd" stroke-width="4"/>`:key==='ice'?'<path d="M44 124q20-12 33 0l-3 23-15 10-13-12Z" fill="#d6eaf0" stroke="#a9c5d7" stroke-width="2"/><path d="M59 130v18m-6-12 12 8m-12 0 12-8" stroke="white" stroke-width="2"/>':'';
  return `<svg viewBox="0 0 200 210" role="img" aria-label="${h.name}, ${h.title}"><ellipse cx="100" cy="188" rx="43" ry="8" fill="#718d7b" opacity=".13"/><g class="rig-body"><path class="rig-cape" d="M77 109q-18 15-26 61 18-5 28 4l20-12 25 13 28-7q-4-33-27-59Z" fill="${c}" opacity=".85"/><g class="rig-foot-left"><path d="M77 153v24" stroke="${d}" stroke-width="18" stroke-linecap="round"/><path d="M77 172q-20 2-15 13h28v-13Z" fill="${d}"/><path d="M67 181h18" stroke="#fff1dc" stroke-width="3"/></g><g class="rig-foot-right"><path d="M118 153v24" stroke="${d}" stroke-width="18" stroke-linecap="round"/><path d="M109 172v13h29q2-12-20-13" fill="${d}"/><path d="M114 181h18" stroke="#fff1dc" stroke-width="3"/></g><path d="M78 106q22-8 44 0l12 50q-34 13-68 0Z" fill="${c}" stroke="${d}" stroke-width="2"/><path d="m86 112 13 16 14-16-4 45H89Z" fill="#fff0d9"/><path d="M72 148q26 7 56 0" fill="none" stroke="${d}" stroke-width="6"/><rect x="94" y="145" width="12" height="10" rx="3" fill="#edcf92"/><g class="rig-left-arm"><path d="M75 116q-18 3-19 24" stroke="${d}" stroke-width="20" stroke-linecap="round"/><circle cx="56" cy="142" r="10" fill="#f6d8bd"/>${shield}</g><g class="rig-right-arm"><path d="M125 117q15 5 19 24" stroke="${c}" stroke-width="21" stroke-linecap="round"/>${weapon}<circle cx="143" cy="144" r="9" fill="#f6d8bd"/><path d="m140 141 5 1" stroke="#dbb89f" stroke-width="2"/></g><g class="rig-head">${ears}<ellipse cx="100" cy="79" rx="47" ry="43" fill="${hair}"/><circle cx="56" cy="87" r="9" fill="#f2ceb2"/><circle cx="144" cy="87" r="9" fill="#f2ceb2"/><ellipse cx="100" cy="85" rx="41" ry="35" fill="#ffe6cc"/><path d="M58 76q-5-44 42-43t44 43q-12-4-17-22-3 15-19 20l1-19q-10 19-28 17l4-15q-14 20-27 19Z" fill="${hair}"/><path d="M69 55q12-13 31-12" fill="none" stroke="#ffffff30" stroke-width="5" stroke-linecap="round"/><g class="rig-eye"><ellipse cx="82" cy="86" rx="6.5" ry="9" fill="#584555"/><ellipse cx="117" cy="86" rx="6.5" ry="9" fill="#584555"/><circle cx="80" cy="82" r="2.5" fill="#fff"/><circle cx="115" cy="82" r="2.5" fill="#fff"/><circle cx="84" cy="90" r="1.5" fill="#b993a0"/><circle cx="119" cy="90" r="1.5" fill="#b993a0"/></g><ellipse cx="72" cy="97" rx="8" ry="4" fill="#eca6a5" opacity=".55"/><ellipse cx="128" cy="97" rx="8" ry="4" fill="#eca6a5" opacity=".55"/><path d="M94 100q6 6 12 0" fill="none" stroke="#b67e79" stroke-width="2.2" stroke-linecap="round"/>${accessory}</g><path d="m85 114 14 7 16-7-8 16-9-5-9 5Z" fill="${d}"/><circle cx="99" cy="120" r="4" fill="#efd7a5"/></g></svg>`;
}
function monsterArt(key,boss=false){
  const p={fire:['#e9b5a0','#c98d85','#f9dac0'],earth:['#b0bea0','#819276','#d7dfbe'],ice:['#d2e3e9','#98b6ce','#f0f5f3'],lightning:['#c9b4dd','#9f86bc','#ece0f0']}[key];
  const [c,d,l]=p;
  const crown=boss?`<g><path d="m71 45-8-25 22 13 15-25 15 25 23-13-9 25Z" fill="#e8cf9a" stroke="#c3a27d" stroke-width="2"/><path d="M73 42h55" stroke="#fff0c9" stroke-width="4"/><path d="m101 20 5 9-5 7-5-7Z" fill="${d}"/></g>`:'';
  const face=`<g class="rig-eye"><ellipse cx="79" cy="99" rx="7" ry="10" fill="#5d5263"/><ellipse cx="119" cy="99" rx="7" ry="10" fill="#5d5263"/><circle cx="77" cy="95" r="3" fill="#fff"/><circle cx="117" cy="95" r="3" fill="#fff"/></g><ellipse cx="66" cy="113" rx="10" ry="5" fill="#e8a6ae" opacity=".55"/><ellipse cx="132" cy="113" rx="10" ry="5" fill="#e8a6ae" opacity=".55"/>`;
  let body='';
  if(key==='fire')body=`<path class="rig-tail" d="M127 155q40 9 44-28 20 42-25 45Z" fill="${c}" stroke="${d}" stroke-width="2"/><path d="m170 130-4-12 10 5 4-12 6 16-9 11Z" fill="#e6ae7c"/><path class="rig-cape" d="M72 126Q36 91 24 112l3 25 21-3 4 22Z M127 126q29-36 45-15l-3 27-22-3-5 21Z" fill="#e9c3ba" stroke="${d}" stroke-width="2"/><g class="rig-foot-left"><ellipse cx="77" cy="178" rx="17" ry="10" fill="${d}"/></g><g class="rig-foot-right"><ellipse cx="121" cy="178" rx="17" ry="10" fill="${d}"/></g><ellipse cx="100" cy="143" rx="38" ry="39" fill="${c}" stroke="${d}" stroke-width="2"/><ellipse cx="100" cy="151" rx="23" ry="25" fill="${l}"/><path d="M83 145h33m-34 10h34m-27 10h21" stroke="#e6bca4" stroke-width="2"/><g class="rig-left-arm"><path d="m71 130-13 18" stroke="${d}" stroke-width="17" stroke-linecap="round"/></g><g class="rig-right-arm"><path d="m130 130 14 16" stroke="${d}" stroke-width="17" stroke-linecap="round"/></g><g class="rig-head"><path d="m65 64-8-27 27 21M118 58l27-24-5 37" fill="${l}" stroke="${d}" stroke-width="2"/><path d="M52 90q-2-43 47-43t48 43v17q-4 28-48 28t-47-28Z" fill="${c}" stroke="${d}" stroke-width="2"/>${face}<ellipse cx="100" cy="115" rx="15" ry="10" fill="${l}"/><path d="M94 116q6 6 12 0" stroke="${d}" stroke-width="2" fill="none"/><circle cx="95" cy="109" r="1.5" fill="${d}"/><circle cx="105" cy="109" r="1.5" fill="${d}"/><path d="m95 51 5-13 6 13" fill="#dfad83"/>${crown}</g>`;
  else if(key==='earth')body=`<g class="rig-foot-left"><path d="m66 152-6 30 30 3 5-28" fill="${d}" stroke="#71816a" stroke-width="2"/></g><g class="rig-foot-right"><path d="m111 155 1 29 31-3-10-29" fill="${d}" stroke="#71816a" stroke-width="2"/></g><path d="m68 110 64 2 16 44-31 18-43-7-16-27Z" fill="${c}" stroke="${d}" stroke-width="3"/><path d="m83 129 34-2 11 23-26 12-24-11Z" fill="${l}"/><path d="m100 136-7 9 7 9 8-9Z" fill="#90a87e"/><g class="rig-left-arm"><path d="m64 121-22-3-8 27 18 15 16-17Z" fill="${c}" stroke="${d}" stroke-width="3"/><path d="m37 135 16 4" stroke="${d}" stroke-width="3"/></g><g class="rig-right-arm"><path d="m135 118 22 5 8 27-20 10-16-22Z" fill="${c}" stroke="${d}" stroke-width="3"/></g><g class="rig-head"><path d="M50 77 65 51l58-5 26 27-3 43-28 21-47-6-24-26Z" fill="${c}" stroke="${d}" stroke-width="3"/><path d="m53 76 24-13 58 5-9-17-58 5Z" fill="${l}"/><path d="m59 63 10-21 39 3 26 10-7 13-30-8-24 11Z" fill="#a6be8f"/><path d="M97 49q-26-26-37-12 2 20 37 12M99 48q7-31 24-25 6 18-24 25" fill="#8fa879"/><path d="m99 49 1-25" stroke="#7a976c" stroke-width="3"/>${face}<path d="M92 116q8 5 16-1" fill="none" stroke="#73866d" stroke-width="2.5" stroke-linecap="round"/><path d="m54 88 8 5-7 14m81-28-8 4 6 7" fill="none" stroke="#8a9d7d" stroke-width="2"/>${crown}</g>`;
  else if(key==='ice')body=`<g class="rig-foot-left"><path d="m81 170-8 14m8-14 2 14m-2-14 11 12" stroke="#baa5a1" stroke-width="5" stroke-linecap="round"/></g><g class="rig-foot-right"><path d="m119 170-8 14m8-14 2 14m-2-14 11 12" stroke="#baa5a1" stroke-width="5" stroke-linecap="round"/></g><ellipse cx="100" cy="131" rx="47" ry="47" fill="${c}" stroke="${d}" stroke-width="2"/><ellipse cx="100" cy="140" rx="31" ry="32" fill="${l}"/><path d="m83 140 5 6 5-6m12 0 5 6 5-6m-21 13 5 6 5-6" stroke="#c4d9e0" stroke-width="3" fill="none"/><g class="rig-left-arm"><path d="M63 114q-28 9-23 38 25 10 31-19" fill="${c}" stroke="${d}" stroke-width="2"/><path d="m49 140 8 4" stroke="${d}" stroke-width="2"/></g><g class="rig-right-arm"><path d="M136 114q29 9 22 38-24 10-30-19" fill="${c}" stroke="${d}" stroke-width="2"/></g><g class="rig-head"><path d="M54 73 48 42l31 19q19-9 42 0l31-21-6 37q18 45-47 53-63-6-45-57Z" fill="${c}" stroke="${d}" stroke-width="2"/><path d="M99 82q-40-33-42 9-2 25 42 34 44-9 43-34-3-42-43-9Z" fill="${l}"/>${face}<path d="m92 109 8-5 8 5-8 10Z" fill="#dbc39a"/><path d="m100 58 3 9 10 2-8 6 1 9-6-5-7 5 1-9-7-6 10-2Z" fill="#fff"/>${crown}</g>`;
  else body=`<path class="rig-tail" d="m128 151 31 1-7-19 24 6-7-25" fill="none" stroke="${d}" stroke-width="10" stroke-linejoin="round"/><path d="m170 99-10 18h11l-3 15 15-20h-11Z" fill="#e7cb8e"/><g class="rig-foot-left"><ellipse cx="78" cy="177" rx="16" ry="8" fill="${d}"/></g><g class="rig-foot-right"><ellipse cx="121" cy="177" rx="16" ry="8" fill="${d}"/></g><ellipse cx="100" cy="139" rx="39" ry="41" fill="${c}" stroke="${d}" stroke-width="2"/><ellipse cx="100" cy="146" rx="25" ry="27" fill="${l}"/><path d="m105 126-17 22h12l-3 15 17-23h-13Z" fill="#d0b988"/><g class="rig-left-arm"><path d="m70 122-13 26" stroke="${d}" stroke-width="17" stroke-linecap="round"/></g><g class="rig-right-arm"><path d="m129 122 14 22" stroke="${d}" stroke-width="17" stroke-linecap="round"/></g><g class="rig-head"><path d="m59 73-9-40 29 23m42 0 30-26-8 46" fill="${c}" stroke="${d}" stroke-width="2"/><path d="m59 46 5 20 8-8m58 1 13-15-5 22" fill="#e6c7df"/><path d="M52 82q-2-35 49-34 50 2 47 43l-3 25-25 18-45-1-25-22Z" fill="${c}" stroke="${d}" stroke-width="2"/><path d="M67 61q5-18 21-11 9-21 23-5 17-12 27 11" fill="${l}"/>${face}<path d="m94 115 6 4 6-4m-6 4v4" stroke="${d}" stroke-width="2.5" fill="none" stroke-linecap="round"/>${crown}</g>`;
  const aura=boss?`<g class="boss-aura" opacity=".55"><circle cx="100" cy="116" r="76" fill="none" stroke="${c}" stroke-width="1.5" stroke-dasharray="4 9"/><circle cx="100" cy="116" r="67" fill="none" stroke="${c}" stroke-width="1"/><path d="m24 67 3 7 7 3-7 3-3 7-3-7-7-3 7-3m151 57 3 7 7 3-7 3-3 7-3-7-7-3 7-3" fill="${d}"/></g>`:'';
  return `<svg viewBox="0 0 200 210" role="img" aria-label="${boss?MONSTERS[key].boss:MONSTERS[key].name}">${aura}<ellipse cx="100" cy="189" rx="46" ry="8" fill="#718d7b" opacity=".13"/><g class="rig-body">${body}</g></svg>`;
}
function landscapeArt(){return `<svg viewBox="0 0 500 280" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f4f3e8"/><stop offset="1" stop-color="#e8eddf"/></linearGradient><radialGradient id="sun"><stop stop-color="#fffbe2"/><stop offset="1" stop-color="#fffbe2" stop-opacity="0"/></radialGradient></defs><path fill="url(#sky)" d="M0 0h500v280H0Z"/><circle cx="300" cy="76" r="85" fill="url(#sun)"/><circle cx="300" cy="76" r="25" fill="#fffce8" opacity=".75"/><path d="m48 0 22 176H38L23 0m95 0 7 157h-13L97 0m317 0-27 179h34L450 0m-85 0-5 147h17L392 0" fill="#cedcc8" opacity=".55"/><path d="M0 63q55-42 92-12 28-35 63-19 13-43 74-32H0Zm500-39q-37-11-64 8-36-29-59-2-20-30-62-29h185Z" fill="#dbe5cf" opacity=".8"/><path d="m43 108 37-31m340 22-40-30m-25 57-25-26" stroke="#d2dfcc" stroke-width="8" stroke-linecap="round"/><path d="M0 174q59-31 115-12 70-37 140-5 87-28 130-1 65-22 115 10v114H0Z" fill="#d5e0ca"/><path d="M0 205q90-35 171-13 69-18 131-3 99-31 198 10v81H0Z" fill="#e2e7d5"/><path d="M191 280q-9-33 61-67 36-22 21-43 43 20-11 55-24 26 48 55Z" fill="#efecd9"/><path d="M0 251q68-26 148-3l-18 32H0Zm500-7q-60-19-124 1l24 35h100Z" fill="#d5dfc4"/><g fill="#b8cba4" opacity=".8"><ellipse cx="25" cy="225" rx="30" ry="13"/><ellipse cx="460" cy="225" rx="38" ry="14"/><path d="m29 224-7-30 17 23 7-30 5 35m400 1-11-31 19 23 10-36 2 42"/></g><g><path d="m33 240 2-15" stroke="#d3b89e" stroke-width="5"/><path d="M19 225q14-27 29 0Z" fill="#d7aaa0"/><circle cx="29" cy="220" r="2" fill="#f8ead6"/><circle cx="39" cy="222" r="2" fill="#f8ead6"/><path d="m457 246-2-18" stroke="#d3b89e" stroke-width="5"/><path d="M437 229q14-31 33-3Z" fill="#c3b1cf"/><circle cx="447" cy="223" r="2" fill="#f8ead6"/><circle cx="459" cy="224" r="2" fill="#f8ead6"/></g><g fill="#f8f3dc"><circle cx="58" cy="251" r="3"/><circle cx="68" cy="247" r="2"/><circle cx="413" cy="251" r="3"/><circle cx="428" cy="254" r="2"/></g><g stroke="#a6bc92" stroke-width="2" stroke-linecap="round"><path d="m83 247-3-12m3 12 4-8M393 235l-3-12m3 12 6-7M149 233l2-10"/></g></svg>`;}

// Every new session starts at the fast full-effects pace. NO FX is opt-in.
let reduced=false;
let sound=true,audioContext=null,board=[],nextId=0,selected=null,locked=true,ended=false,turn='player',chosen='fire',newRun=true,pointer=null,suppressClickUntil=0,toastAnimation=null,plannedIntent=null;
let state={stage:1,score:0,key:'fire',hp:170,armor:0,energy:0,enemyKey:'earth',enemyHp:350,enemyMax:350,enemyArmor:0,enemyEnergy:0,boss:false,frozen:false,stunned:false,playerFrozen:false,enemyTurn:0,enraged:false};
const activeAnimations=new Set();
const rand=n=>Math.floor(Math.random()*n);
const mult=(a,b)=>ELEMENTS[a].beats===b?1.5:1;
const wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(ms/6,10):ms));
// Sound bytes behind an ART src: a linked file (Game.html serves its art beside it) or, in an
// embedded build, a data URI.
async function artBytes(src){
  if(src.startsWith('data:')){const binary=atob(src.split(',')[1]),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
  const response=await fetch(src);if(!response.ok)throw Error('Missing sound '+src);return response.arrayBuffer();
}
function animate(el,frames,options={}){
  if(!el||!el.isConnected)return Promise.resolve();
  // Avoid a display-frame wait for each reduced-motion Web Animation. A short
  // tiny beat preserves action order in NO FX mode without display-frame waits.
  if(reduced)return new Promise(resolve=>setTimeout(resolve,4/1.5));
  const a=el.animate(frames,{duration:300,easing:'cubic-bezier(.22,.7,.3,1)',...options});
  activeAnimations.add(a);
  return a.finished.catch(()=>{}).finally(()=>{activeAnimations.delete(a);a.cancel();});
}
function sfx(kind){
  if(!sound)return;
  try{
    audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioContext.state==='suspended')audioContext.resume();
    const sequence={swap:[392,494],match:[523,659,784],hit:[196,147],buff:[659,784,1047],special:[523,659,784,1047],win:[523,659,784,1047,1319],fail:[294,247]}[kind]||[523];
    sequence.forEach((f,i)=>{const osc=audioContext.createOscillator(),gain=audioContext.createGain(),at=audioContext.currentTime+i*.065;osc.type='sine';osc.frequency.setValueAtTime(f,at);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+.012);gain.gain.exponentialRampToValueAtTime(.001,at+.19);osc.connect(gain);gain.connect(audioOutput(audioContext,'effects'));osc.start(at);osc.stop(at+.2);});
  }catch{sound=false;updateSettings();}
}
function message(text,log=true){$('message').textContent=text;if(log){const li=document.createElement('li');li.textContent=text;$('logEntries').prepend(li);while($('logEntries').children.length>30)$('logEntries').lastChild.remove();$('logCount').textContent=$('logEntries').children.length+' sự kiện';}}
function updateSettings(){document.body.classList.toggle('reduced-motion',reduced);const motion=$('motionBtn');motion.setAttribute('aria-pressed',String(reduced));motion.setAttribute('aria-label','NO FX');motion.title='NO FX: '+(reduced?'đang bật · bấm để bật lại hiệu ứng':'đang tắt · bấm để tắt hiệu ứng');motion.dataset.mode=reduced?'reduced':'full';motion.innerHTML=icon('spark')+'<span class="motion-status" aria-hidden="true">NO FX</span>';$('soundBtn').setAttribute('aria-pressed',String(sound));$('soundBtn').setAttribute('aria-label',sound?'Tắt âm thanh':'Bật âm thanh');$('soundBtn').innerHTML=icon(sound?'sound':'mute');}
function toast(text){if(toastAnimation)toastAnimation.cancel();if(reduced)return;const el=$('boardToast');el.textContent=text;toastAnimation=el.animate([{opacity:0,transform:'translate(-50%,-35%) scale(.9)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)',offset:.2},{opacity:1,offset:.65},{opacity:0,transform:'translate(-50%,-70%) scale(1)'}],{duration:175,easing:'ease-out'});toastAnimation.finished.catch(()=>{});}
function updateTurn(){const el=$('turnChip');el.className='turn-chip'+(turn==='enemy'?' enemy':locked?' busy':'');el.innerHTML='<i></i>'+(ended?'Kết thúc':turn==='frozen'?'Đóng băng · mất lượt':turn==='enemy'?'Lượt quái':locked?'Combo':'Lượt bạn');$('boardFrame').classList.toggle('enemy-turn',turn==='enemy'&&!ended);$('board').setAttribute('aria-busy',String(locked));$('hintBtn').disabled=locked||ended;}
function update(){
  const h=HEROES[state.key],m=MONSTERS[state.enemyKey];
  $('heroName').textContent=h.name;$('enemyName').textContent=state.boss?m.boss:m.name;
  for(const [prefix,key] of [['hero',state.key],['enemy',state.enemyKey]]){const e=ELEMENTS[key];$(prefix+'Element').innerHTML=icon(e.icon)+e.label;$(prefix+'Element').style.setProperty('--element',e.color);}
  $('heroHpText').textContent=Math.max(0,Math.round(state.hp))+' / '+h.hp;$('enemyHpText').textContent=Math.max(0,Math.round(state.enemyHp))+' / '+state.enemyMax;
  const hp=Math.max(0,state.hp/h.hp*100)+'%',ehp=Math.max(0,state.enemyHp/state.enemyMax*100)+'%';
  $('heroHp').style.width=hp;$('heroHpTrail').style.width=hp;$('enemyHp').style.width=ehp;$('enemyHpTrail').style.width=ehp;
  for(const [side,armor,rage]of [['hero',state.armor,state.energy],['enemy',state.enemyArmor,state.enemyEnergy]]){
    $(side+'Armor').innerHTML=icon('shield')+Math.round(armor);$(side+'Armor').hidden=armor<=0;
    $(side+'RageFill').style.width=rage+'%';$(side+'Rage').setAttribute('aria-valuenow',Math.round(rage));
  }
  $('heroStatuses').innerHTML=state.playerFrozen?'<span class="status-pill" title="Đóng băng">'+icon('snow')+'</span>':'';
  $('enemyStatuses').innerHTML=(state.frozen||state.stunned?'<span class="status-pill" title="'+(state.stunned?'Choáng':'Đóng băng')+'">'+icon(state.stunned?'spark':'snow')+'</span>':'')+(state.enraged?'<span class="status-pill enraged" title="Cuồng nộ">'+icon('flame')+'</span>':'');
  $('score').textContent=state.score.toLocaleString('vi-VN');$('stageLabel').textContent=(state.boss?'BOSS':'MÀN')+' '+String(state.stage).padStart(2,'0');$('footerStage').textContent='Màn '+state.stage;
  $('tipTitle').textContent=ELEMENTS[state.key].beats===state.enemyKey?'Bạn đang có lợi thế nguyên tố!':'Nhỏ bé. Nhưng đầy phép màu.';$('tipText').textContent=ELEMENTS[state.key].beats===state.enemyKey?ELEMENTS[state.key].label+' khắc '+ELEMENTS[state.enemyKey].label+' · Đòn đánh của '+h.name+' gây thêm 50% sát thương.':'Ghép 4 ngọc tạo Sao băng, ghép 5 tạo Bom. Ghép Băng giúp bạn chặn lượt tiếp theo của quái.';
  $('journeyTrack').innerHTML=Array.from({length:5},(_,i)=>{const step=i+1,current=(state.stage-1)%5+1;return (i?'<span class="journey-line"></span>':'')+'<span class="journey-step '+(step===current?'active':step<current?'done':'')+'" '+(step===current?'aria-current="step"':'')+' aria-label="Màn '+(Math.floor((state.stage-1)/5)*5+step)+'">'+(step===5?icon('crown'):step<current?'✓':step)+'</span>';}).join('');
  updateTurn();
}
function renderActors(){ $('heroActor').innerHTML=heroArt(state.key);$('enemyActor').innerHTML=monsterArt(state.enemyKey,state.boss);$('enemyActor').classList.toggle('boss',state.boss);$('heroActor').dataset.state='idle';$('enemyActor').dataset.state='idle';}

function all(){return board.flat().filter(Boolean);}
function tileType(t){return t&&t.special!=='core'?t.type:null;}
function newTile(type,r,c,special=null){return {id:++nextId,type,r,c,special,el:null};}
function tileLabel(t){return (t.special==='core'?'Cầu vồng':TYPES[t.type].name+(t.special==='bolt'?' · Sao băng':t.special==='bomb'?' · Bom':''))+', hàng '+(t.r+1)+', cột '+(t.c+1);}
function paintTile(t){
  const p=TYPES[Math.max(0,t.type)],e=t.el;e.className='tile'+(t.special?' special '+t.special:'');e.setAttribute('aria-label',tileLabel(t));e.setAttribute('aria-rowindex',t.r+1);e.setAttribute('aria-colindex',t.c+1);e.setAttribute('aria-selected','false');
  e.style.setProperty('--tile-light',p.light);e.style.setProperty('--tile-bg',p.bg);e.style.setProperty('--tile-edge',p.edge);
  e.innerHTML='<span class="gem">'+icon(t.special==='core'?'rainbow':p.icon,p.color)+(t.special&&t.special!=='core'?'<span class="special-badge">'+icon(t.special==='bolt'?'bolt':'bomb')+'</span>':'')+'</span>';
}
function place(t){t.el.style.left=t.c*12.5+'%';t.el.style.top=t.r*12.5+'%';t.el.setAttribute('aria-label',tileLabel(t));t.el.setAttribute('aria-rowindex',t.r+1);t.el.setAttribute('aria-colindex',t.c+1);}
function createTile(t){t.el=document.createElement('button');t.el.type='button';t.el.dataset.id=t.id;t.el.setAttribute('role','gridcell');t.el.tabIndex=-1;paintTile(t);place(t);$('board').append(t.el);}
function matches(){
  const groups=[],set=new Set();
  for(let axis=0;axis<2;axis++)for(let i=0;i<SIZE;i++)for(let j=0;j<SIZE;){
    const group=[],first=axis?board[j][i]:board[i][j],type=tileType(first);let end=j;
    while(end<SIZE&&type!==null&&tileType(axis?board[end][i]:board[i][end])===type){group.push(axis?board[end][i]:board[i][end]);end++;}
    if(group.length>=3){groups.push(group);group.forEach(t=>set.add(t));}j=Math.max(j+1,end);
  }
  return {groups,tiles:[...set]};
}
function matchClusters(m){
  const clusters=[];
  for(const group of m.groups){let combined=new Set(group);for(let i=clusters.length-1;i>=0;i--){if([...combined].some(t=>clusters[i].has(t))){clusters[i].forEach(t=>combined.add(t));clusters.splice(i,1);}}clusters.push(combined);}
  return clusters;
}
function adjacent(a,b){return a&&b&&Math.abs(a.r-b.r)+Math.abs(a.c-b.c)===1;}
function swapData(a,b){const r=a.r,c=a.c;board[a.r][a.c]=b;board[b.r][b.c]=a;a.r=b.r;a.c=b.c;b.r=r;b.c=c;}
function legalMoves(includeCore=true){
  const result=[];
  for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++)for(const [dr,dc] of [[0,1],[1,0]]){
    if(r+dr>=SIZE||c+dc>=SIZE)continue;
    const a=board[r][c],b=board[r+dr][c+dc];if(!a||!b)continue;
    if(a.special==='core'||b.special==='core'){if(includeCore)result.push({a,b,score:100});continue;}
    swapData(a,b);const m=matches();if(m.tiles.length){const counts=[0,0,0,0,0];m.tiles.forEach(t=>counts[t.type]++);const score=counts[0]*8+counts[1]*(state.enemyHp<state.enemyMax*.6?5:0)+counts[4]*2+counts[2]*2;result.push({a,b,score});}swapData(a,b);
  }
  return result;
}
function seedBoard(){
  clearSelection();$('board').replaceChildren();$('boardEffects').replaceChildren();
  do{
    board=Array.from({length:SIZE},()=>Array(SIZE).fill(null));
    for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
      let type;do{type=rand(5);}while(c>=2&&tileType(board[r][c-1])===type&&tileType(board[r][c-2])===type||r>=2&&tileType(board[r-1][c])===type&&tileType(board[r-2][c])===type);
      board[r][c]=newTile(type,r,c);
    }
  }while(!legalMoves().length);
  all().forEach(createTile);board[0][0].el.tabIndex=0;
}
function clearSelection(){if(selected?.el){selected.el.classList.remove('selected');selected.el.setAttribute('aria-selected','false');}selected=null;}
function selectTile(t){clearSelection();selected=t;t.el.classList.add('selected');t.el.setAttribute('aria-selected','true');}
function focusTile(t){all().forEach(x=>x.el.tabIndex=x===t?0:-1);t.el.focus({preventScroll:true});}
async function moveTile(t,fromR,fromC,delay=0){
  place(t);const cell=$('board').clientWidth/SIZE,dx=(fromC-t.c)*cell,dy=(fromR-t.r)*cell;
  if(!dx&&!dy)return;
  await animate(t.el,[{transform:`translate(${dx}px,${dy}px)`},{transform:'translate(0,0)'}],{duration:Math.min(450,240+Math.abs(fromR-t.r)*22),delay,easing:'cubic-bezier(.22,.65,.35,1)',fill:'backwards'});
}
async function swapAnimated(a,b){const ar=a.r,ac=a.c,br=b.r,bc=b.c;swapData(a,b);sfx('swap');await Promise.all([moveTile(a,ar,ac),moveTile(b,br,bc)]);}
function makePlan(m,preferred,owner,core=null,coreType=null){
  const targets=new Set(m?m.tiles:[]),creates=[],acts=[],playerTiles=new Set(),queued=new Set();
  if(owner==='hero'&&m)for(const cl of matchClusters(m)){
    const kind=cl.size>=6?'core':cl.size===5?'bomb':cl.size===4?'bolt':null;
    if(kind){const normals=[...cl].filter(t=>!t.special),pick=normals.includes(preferred)?preferred:normals[Math.floor(normals.length/2)];if(pick){creates.push({tile:pick,kind});targets.delete(pick);}}
  }
  const enqueue=t=>{if(t.special&&!queued.has(t)){queued.add(t);acts.push({tile:t,kind:t.special});}};
  if(core){targets.add(core);enqueue(core);}
  [...targets].forEach(enqueue);
  for(let i=0;i<acts.length;i++){
    const a=acts[i],type=a.kind==='core'?(a.tile===core?coreType:rand(5)):a.tile.type;
    const hits=all().filter(t=>a.kind==='bolt'?Math.abs(t.r-a.tile.r)<=2&&Math.abs(t.c-a.tile.c)<=2:a.kind==='core'?t===a.tile||t.type===type:t.type===type&&t.special!=='core');
    a.hits=hits;
    for(const t of hits){targets.add(t);playerTiles.add(t);enqueue(t);}
  }
  creates.forEach(x=>targets.delete(x.tile));
  return {targets:[...targets],creates,acts,playerTiles};
}
function coreFusionCount(a,b){
  return a.special==='core'&&b.special==='core'?all().filter(t=>t.special).length:0;
}
function makeCoreFusionPlan(origin,total,wave=1){
  const targets=all(),tile=board[origin.r][origin.c];
  // The pair consumes every special together. Count once, before the first
  // blast; refills and subsequent matches cannot extend this finite sequence.
  return {targets,creates:[],acts:[{tile,kind:'core',hits:targets,fullBoard:true}],
    playerTiles:new Set(targets),fusion:{total,wave,r:origin.r,c:origin.c}};
}
function svgNode(tag,attrs){const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);$('boardEffects').append(e);return e;}
async function boardBurst(t,color){
  if(reduced)return;
  const x=t.c*100+50,y=t.r*100+50;
  const ps=Array.from({length:6},(_,i)=>{const angle=i*Math.PI/3,dist=25+rand(20);const e=svgNode('circle',{cx:x,cy:y,r:i%2?3:4,fill:color,stroke:'#fff9','stroke-width':1});return animate(e,[{opacity:1,transform:'translate(0,0)'},{opacity:0,transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px)`}],{duration:360}).finally(()=>e.remove());});await Promise.all(ps);
}
async function specialEffect(act){
  const t=act.tile,x=t.c*100+50,y=t.r*100+50,color=act.kind==='bomb'?'#d9a57c':act.kind==='core'?'#b295d2':'#8ebfd1';
  if(act.kind==='bomb'){
    const e=svgNode('circle',{cx:x,cy:y,r:5,fill:'#f4dca7',stroke:'#deb98c','stroke-width':3});
    await animate(e,[{r:'5px',opacity:.65},{r:'245px',opacity:0}],{duration:550});e.remove();
  }else{
    await Promise.all(act.hits.filter(h=>h!==t).slice(0,24).map(async(h,i)=>{const tx=h.c*100+50,ty=h.r*100+50,mx=(x+tx)/2,my=(y+ty)/2;const e=svgNode('path',{d:`M${x} ${y} L${mx-10} ${my+12} L${mx+10} ${my-12} L${tx} ${ty}`,fill:'none',stroke:act.kind==='core'?TYPES[Math.max(0,h.type)].color:color,'stroke-width':4,'stroke-linecap':'round'});await animate(e,[{opacity:0},{opacity:.9,offset:.25},{opacity:0}],{duration:420,delay:Math.min(i*14,180),fill:'backwards'});e.remove();}));
  }
}
async function gravity(){
  const tasks=[];
  for(let c=0;c<SIZE;c++){
    const survivors=[];for(let r=SIZE-1;r>=0;r--)if(board[r][c])survivors.push(board[r][c]);
    for(let r=0;r<SIZE;r++)board[r][c]=null;
    let dest=SIZE-1;
    for(const t of survivors){const old=t.r;t.r=dest;board[dest--][c]=t;tasks.push(moveTile(t,old,c,c*3.5/1.5,'fall'));}
    const missing=dest+1;
    for(let r=dest;r>=0;r--){const t=newTile(rand(5),r,c);board[r][c]=t;createTile(t);tasks.push(moveTile(t,r-missing,c,c*3.5/1.5,'fall'));}
  }
  await Promise.all(tasks);
}
async function clearPlan(plan,chain){
  $('comboLabel').textContent=chain>1?'Cascade ×'+chain:plan.targets.length+' ngọc kết nối';
  if(chain>1)toast('Combo ×'+chain);
  if(plan.acts.length){sfx('special');toast(plan.acts.some(a=>a.kind==='core')?'Cầu vồng thức giấc!':plan.acts.some(a=>a.kind==='bomb')?'Bùng nổ phép thuật!':'Sét lan tỏa!');await Promise.all(plan.acts.slice(0,8).map(specialEffect));}
  else sfx('match');
  await Promise.all(plan.targets.map(async(t,i)=>{
    const gem=t.el.firstElementChild;
    await animate(gem,[{transform:'scale(1)',opacity:1},{transform:'scale(1.14)',opacity:1,offset:.35},{transform:'scale(.25)',opacity:0}],{duration:260,delay:Math.min(i*9,90),fill:'forwards'});
    t.el.style.visibility='hidden';
  }).concat(plan.targets.slice(0,28).map(t=>boardBurst(t,TYPES[Math.max(0,t.type)].color))));
  const focused=document.activeElement,hadFocus=focused?.classList.contains('tile'),focusRow=hadFocus?Number(focused.getAttribute('aria-rowindex'))-1:0,focusCol=hadFocus?Number(focused.getAttribute('aria-colindex'))-1:0;
  plan.targets.forEach(t=>{if(board[t.r][t.c]===t)board[t.r][t.c]=null;t.el.remove();});
  for(const x of plan.creates){x.tile.special=x.kind;if(x.kind==='core')x.tile.type=-1;paintTile(x.tile);await animate(x.tile.el.firstElementChild,[{transform:'scale(.65)'},{transform:'scale(1.13)',offset:.6},{transform:'scale(1)'}],{duration:260});}
  await gravity();
  if(hadFocus)focusTile(board[Math.max(0,focusRow)][Math.max(0,focusCol)]);else if(!all().some(t=>t.el.tabIndex===0))board[0][0].el.tabIndex=0;
}
async function ensurePlayable(){
  if(legalMoves().length)return;
  message('Khu rừng đổi gió — bàn ngọc được xáo lại miễn phí.');toast('Một làn gió mới…');
  const tiles=all(),origins=new Map(tiles.map(t=>[t,{r:t.r,c:t.c}]));
  let attempts=0;
  do{
    for(let i=tiles.length-1;i>0;i--){const j=rand(i+1);[tiles[i],tiles[j]]=[tiles[j],tiles[i]];}
    tiles.forEach((t,i)=>{t.r=Math.floor(i/SIZE);t.c=i%SIZE;board[t.r][t.c]=t;});attempts++;
  }while((matches().tiles.length||!legalMoves().length)&&attempts<200);
  if(attempts===200){seedBoard();return;}
  await Promise.all(tiles.map(t=>moveTile(t,origins.get(t).r,origins.get(t).c)));
}
function actor(side){return $(side==='hero'?'heroActor':'enemyActor');}
// Status texts (burns, curses, misses, interrupts) share the combat popup column and its readable hold.
async function floating(side,text,kind=''){await combatPopup(side,text,{kind:'status',tone:kind==='good'?'good':kind==='armor'?'ward':'',beat:690}).ready;}
async function combatParticles(side,key,count=8){if(reduced)return;const rect=$('scene').getBoundingClientRect(),x=rect.width*(side==='hero'?.24:.76),y=rect.height*.48;await Promise.all(Array.from({length:count},(_,i)=>{const e=document.createElement('i');e.className='combat-particle';e.style.left=x+'px';e.style.top=y+'px';e.style.setProperty('--element',ELEMENTS[key].color);e.innerHTML=icon(i%3?'spark':ELEMENTS[key].icon);$('combatEffects').append(e);const angle=i*Math.PI*2/count;return animate(e,[{opacity:1,transform:'translate(0,0) scale(.6)'},{opacity:0,transform:`translate(${Math.cos(angle)*65}px,${Math.sin(angle)*50}px) scale(1)`}],{duration:520}).finally(()=>e.remove());}));}
function damage(side,raw,ledger=null){
  const target=side==='hero'?'enemy':'hero',attackerKey=side==='hero'?state.key:state.enemyKey,defenderKey=side==='hero'?state.enemyKey:state.key;
  if(side==='hero')raw*=progressionKit(state.key).attackScale;
  if(ledger)ledger.raw+=raw;
  let n=Math.round((ledger?ledger.raw:raw)*mult(attackerKey,defenderKey)*(side==='enemy'&&state.enraged?1.25:1));if(target==='hero'&&progressionKit(state.key).damageReduction)n=Math.round(n*(1-progressionKit(state.key).damageReduction));
  if(ledger){const total=n;n-=ledger.applied;ledger.applied=total;}
  if(side==='hero'&&state.key==='earth'&&state.noriStunTurns>0&&state.enemyHp>0&&state.hp>0){
    state.noriStoredDamage=(state.noriStoredDamage||0)+n;update();
    return {amount:0,blocked:0,stored:n};
  }
  return applyCombatDamage(target,n);
}
function applyCombatDamage(target,n){
  const armorKey=target==='hero'?'armor':'enemyArmor',hpKey=target==='hero'?'hp':'enemyHp',blocked=Math.min(state[armorKey],n),previousHp=state[hpKey];state[armorKey]-=blocked;state[hpKey]=Math.max(0,state[hpKey]-(n-blocked));update();
  if(target==='enemy'&&state.boss&&previousHp>0&&state.enemyHp===0)combatVoice('enemy','death');
  // Shown numbers are what the bar lost: overkill is clipped to the HP that remained.
  return {amount:previousHp-state[hpKey],blocked};
}
// Armour scales with the bearer: 999 early, then half of a hero's max HP or 8% of
// an enemy's (large boss pools would otherwise turn guard skills into walls).
function combatArmorCap(side){return Math.max(999,Math.round(side==='hero'?HEROES[state.key].hp*.5:state.enemyMax*.08));}
async function attack(side,raw,{ultimate=false,hits=1}={}){
  const source=actor(side),target=actor(side==='hero'?'enemy':'hero'),key=side==='hero'?state.key:state.enemyKey,direction=side==='hero'?1:-1,targetSide=side==='hero'?'enemy':'hero';
  source.dataset.state=ultimate?'cast':'attack';
  if(ultimate){
    const halo=document.createElement('span');halo.className='buff-ring';halo.style.left=side==='hero'?'24%':'76%';halo.style.top='45%';halo.style.margin='-47px';halo.style.color=ELEMENTS[key].color;$('combatEffects').append(halo);
    await Promise.all([animate(halo,[{opacity:0,transform:'scale(1.5)'},{opacity:.75,transform:'scale(.65)',offset:.75},{opacity:0,transform:'scale(.4)'}],{duration:380}),combatParticles(side,key,10)]);halo.remove();
  }
  await animate(source,[{transform:'translateX(0)'},{transform:`translateX(${-direction*9}px) rotate(${-direction*4}deg)`},{transform:`translateX(${direction*(key==='fire'||key==='earth'?25:7)}px) rotate(${direction*3}deg)`}],{duration:250});
  let total=0,blocked=0;
  for(let i=0;i<hits;i++){
    const e=document.createElement('span');e.className='projectile';e.style.setProperty('--element',ELEMENTS[key].color);e.innerHTML=icon(ELEMENTS[key].icon);$('combatEffects').append(e);
    const w=$('scene').clientWidth,h=$('scene').clientHeight,start=w*(side==='hero'?.29:.71),finish=w*(side==='hero'?.73:.23);
    e.style.left=(key==='lightning'?finish:start)-17+'px';e.style.top=(key==='lightning'?5:h*.42)+'px';
    await Promise.all([animate(e,key==='lightning'?[{transform:'translateY(-15px) scale(.8)',opacity:.5},{transform:`translateY(${h*.42}px) scale(1.5)`,opacity:1}]:[{transform:'translateX(0) scale(.7)',opacity:.6},{transform:`translateX(${finish-start}px) scale(${ultimate?1.6:1.1})`,opacity:1}],{duration:key==='lightning'?150:230}),animate(source.querySelector('.rig-right-arm'),[{transform:'rotate(-30deg)'},{transform:'rotate(55deg)',offset:.55},{transform:'rotate(0deg)'}],{duration:230})]);e.remove();
    const result=damage(side,raw/hits);total+=result.amount;blocked+=result.blocked;sfx('hit');target.dataset.state='hurt';
    await Promise.all([animate(target,[{transform:'translateX(0)'},{transform:`translateX(${direction*10}px) rotate(${direction*5}deg)`,offset:.3},{transform:'translateX(0)'}],{duration:240}),floating(targetSide,result.amount?'-'+result.amount:'Chặn '+result.blocked,result.amount?'':'armor'),combatParticles(targetSide,key,ultimate?12:6)]);
  }
  source.dataset.state='idle';target.dataset.state='idle';return {amount:total,blocked};
}
async function buff(side,kind,value){
  const isHero=side==='hero',hpKey=isHero?'hp':'enemyHp',armorKey=isHero?'armor':'enemyArmor',max=isHero?HEROES[state.key].hp:state.enemyMax;let gained;
  if(kind==='heal'){gained=Math.min(value,max-state[hpKey]);state[hpKey]+=gained;}else{gained=Math.min(value,combatArmorCap(side)-state[armorKey]);state[armorKey]+=gained;}
  if(!gained)return 0;
  const f=actor(side);f.dataset.state='buff';sfx('buff');update();const ring=document.createElement('span');ring.className='buff-ring';ring.style.left=(isHero?'24%':'76%');ring.style.top='44%';ring.style.margin='-47px';ring.style.color=kind==='heal'?'#a1c9a4':'#c4b0db';$('combatEffects').append(ring);
  await Promise.all([animate(ring,[{transform:'scale(.4)',opacity:0},{transform:'scale(.85)',opacity:.7,offset:.45},{transform:'scale(1.3)',opacity:0}],{duration:650}),animate(f,[{transform:'translateY(0)'},{transform:'translateY(-9px)',offset:.5},{transform:'translateY(0)'}],{duration:650}),floating(side,'+'+gained+(kind==='heal'?' HP':' giáp'),kind==='heal'?'good':'armor')]);ring.remove();f.dataset.state='idle';return gained;
}
async function resolveBoard(owner,initial=null,preferred=null){
  let m=matches(),plan=initial,chain=0;const combat=createLiveCombat();
  beginBoardCombo(owner);
  try{
  while(plan||m.tiles.length){
    chain++;plan ||= makePlan(m,chain===1?preferred:null,owner);
    combat.beginWave(chain,plan,owner);
    const wavePlan=plan;
    await clearPlan(plan,chain,t=>combat.collect(t,owner==='hero'||wavePlan.playerTiles.has(t)?'hero':'enemy',chain));
    const fusion=wavePlan.fusion;
    if(fusion&&fusion.wave<fusion.total){plan=makeCoreFusionPlan(fusion,fusion.total,fusion.wave+1);}
    else{m=matches();plan=null;}
  }
  await Promise.all([finishBoardCombo(),combat.finish()]);
  $('comboLabel').textContent=chain?'Combo ×'+chain:'Ghép 3 để tung phép';
  }finally{await combat.cancel();resetBoardCombo();}
}

function intent(){
  const m=MONSTERS[state.enemyKey];
  if(state.frozen||state.stunned)return {kind:'skip',name:state.stunned?'Đang bị choáng':'Đang bị đóng băng',icon:'snow',detail:'Bỏ qua lượt kế'};
  if(state.boss){if(state.enemyEnergy>=80)return {kind:'skill',name:m.skill,icon:ELEMENTS[state.enemyKey].icon,detail:'Ghép ngọc, đủ nộ sẽ tung chiêu'};return {kind:'board',name:'Kết nối ngọc phép',icon:'crystal',detail:'Boss tự chọn một nước ghép'};}
  const cycle=state.enemyTurn%4;
  if(cycle===1)return {kind:'guard',name:m.support,icon:'shield',detail:'+'+(10+state.stage*3)+' giáp'};
  if(cycle===2||state.enemyEnergy>=100)return {kind:'skill',name:m.skill,icon:ELEMENTS[state.enemyKey].icon,detail:state.enemyKey==='ice'?'Gây đóng băng 1 lượt':state.enemyKey==='lightning'?'Đánh 3 lần · hút 15 năng lượng':state.enemyKey==='earth'?'Đánh mạnh · tăng giáp':'3 ngọn lửa liên tiếp'};
  if(cycle===3&&state.enemyHp<state.enemyMax*.65)return {kind:'heal',name:m.heal,icon:'heart',detail:'Hồi '+(18+state.stage*5)+' HP'};
  return {kind:'board',name:'Kết nối ngọc phép',icon:'crystal',detail:'Ghép ngọc để tấn công và tích nộ'};
}
async function enemySkill({reserved=false}={}){
  const key=state.enemyKey,m=MONSTERS[key],base=state.boss?60+state.stage*5:14+state.stage*4;
  if(!reserved)state.enemyEnergy=0;message((state.boss?'Boss':'Quái')+' tung '+m.skill+'!');update();
  await rageChoreography('enemy',base*(key==='earth'?1.1:key==='ice'?.75:1),{
    hits:key==='fire'?3:key==='lightning'?(state.boss?5:3):1,onRelease(pending){
      if(key==='earth'){state.enemyArmor=Math.min(combatArmorCap('enemy'),state.enemyArmor+(state.boss?35:12+state.stage*2));pending.push(combatLootReceive('enemy',4));}
      if(key==='ice'&&state.hp>0){state.playerFrozen=true;message('Băng tuyết bao phủ! Bạn sẽ mất 1 lượt hành động.');popActorSkill('hero','Đóng băng',false,pending);}
      if(key==='lightning'){state.energy=Math.max(0,state.energy-15);message('Dòng điện cuốn đi 15 năng lượng của bạn.');}
    }
  });
  update();
}
async function enemyAction(){
  if(state.enemyHp<=0||state.hp<=0)return;
  turn='enemy';update();
  await castReadyUltimates();if(state.enemyHp<=0||state.hp<=0)return;
  await battleBeat(650);
  if(state.noriStunTurns>0){await consumeNoriStunTurn();return;}
  if(state.frozen||state.stunned){message(state.stunned?'Quái bị choáng, bỏ qua lượt này.':'Quái bị đóng băng, bỏ qua lượt này.');await floating('enemy',state.stunned?'Choáng':'Đóng băng','armor');state.frozen=false;state.stunned=false;update();return;}
  const it=plannedIntent||intent();
  if(!state.boss&&it.kind==='board')message(MONSTERS[state.enemyKey].name+' dùng '+it.name+'.');
  if(state.boss&&!state.enraged&&state.enemyHp<=state.enemyMax*.4){state.enraged=true;message('Boss thức tỉnh! Sát thương tăng 25%.');await buff('enemy','armor',20+state.stage*2);}
  const played=await opponentBoardTurn();
  if(!played)await attack('enemy',(progressionBattle?10:10+5*(state.stage-1))*(state.boss?1.3:1));
  if(state.enemyHp>0&&state.hp>0){
    await castReadyUltimates();
    if(!state.boss&&state.hp>0&&state.enemyHp>0&&!(state.noriStunTurns>0)){
      state.enemyTurn++;
      if(it.kind==='guard'||it.kind==='heal'){
        await battleBeat(450);
        if(it.kind==='guard'){message(MONSTERS[state.enemyKey].name+' dùng '+it.name+'.');await buff('enemy','armor',10+state.stage*3);}
        else{message(MONSTERS[state.enemyKey].name+' dùng '+it.name+'.');await buff('enemy','heal',18+state.stage*5);}
      }
    }
  }
  plannedIntent=intent();update();await battleBeat(380);
}
async function finishBattle(){
  if(state.hp>0&&state.enemyHp>0)return false;
  ended=true;const won=state.hp>0;const defeated=actor(won?'enemy':'hero');defeated.dataset.state='hurt';await animate(defeated,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(15px) scale(.85)'}],{duration:500,fill:'forwards'});defeated.style.opacity='0';actor(won?'hero':'enemy').dataset.state='victory';
  if(won)await departVictoriousHero();
  sfx(won?'win':'fail');$('resultArt').innerHTML=won?heroArt(state.key):monsterArt(state.enemyKey,state.boss);$('resultEyebrow').textContent=won?'MỘT CHIẾN THẮNG NHỎ':'NGHỈ MỘT CHÚT NHÉ';$('resultTitle').textContent=won?'Khu rừng mỉm cười!':'Ngày mai, lại lên đường.';
  $('resultDesc').textContent=won?'Đã vượt qua màn '+state.stage+'. Xem đối thủ tiếp theo rồi chọn người đồng hành. Máu, giáp và nộ được giữ lại.':'Bạn đã đi đến màn '+state.stage+'. Một hành trình mới luôn chờ bạn.';
  $('resultStage').textContent=String(state.stage).padStart(2,'0');$('resultScore').textContent=state.score.toLocaleString('vi-VN');$('nextBtn').innerHTML=(won?'Tiếp tục hành trình':'Bắt đầu hành trình mới')+' <span>→</span>';update();$('resultDialog').showModal();$('nextBtn').focus();return true;
}
async function perform(action){
  // Lock synchronously before any await: taps, swipes and skills share one transaction.
  if(locked||ended||$('selectDialog').open||$('helpDialog').open||$('audioSettingsDialog').open||$('resultDialog').open)return;
  locked=true;clearSelection();updateTurn();
  try{
    if(!state.playerFrozen){const consumed=await action();if(consumed&&typeof progressionRecordTurn==='function')progressionRecordTurn();await castReadyUltimates();if(consumed&&state.enemyHp>0&&state.hp>0)await enemyAction();}
    await castReadyUltimates();
    // Resolve disabled player turns before releasing input. Previously we showed
    // "Lượt bạn" while frozen, then silently consumed the user's next swap.
    // A fresh freeze from the following enemy action also resolves in this lock.
    while(state.playerFrozen&&state.hp>0&&state.enemyHp>0){
      turn='frozen';clearSelection();pointer=null;update();
      message('Đóng băng: bạn mất 1 lượt. Quái tiếp tục hành động.');
      await floating('hero','ĐÓNG BĂNG · MẤT LƯỢT','armor');
      await battleBeat(450);
      state.playerFrozen=false;update();
      if(typeof progressionRecordTurn==='function')progressionRecordTurn();
      await enemyAction();await castReadyUltimates();
    }
    if(await finishBattle())return;
    await ensurePlayable();
  }catch(error){
    console.error('Battle transaction failed',error);seedBoard();message('Phép thuật bị gián đoạn. Bàn ngọc đã được khôi phục, bạn có thể tiếp tục.');
  }finally{turn='player';locked=ended;update();}
}
async function trySwap(a,b){
  if(!adjacent(a,b))return;
  return perform(async()=>{
    const core=a.special==='core'?a:b.special==='core'?b:null,other=core===a?b:a,fusionCount=coreFusionCount(a,b);
    await swapAnimated(a,b);
    if(fusionCount){await resolveBoard('hero',makeCoreFusionPlan(a,fusionCount));return true;}
    if(core){await resolveBoard('hero',makePlan(null,null,'hero',core,other.special==='core'?rand(5):other.type));return true;}
    if(!matches().tiles.length){await swapAnimated(a,b);sfx('fail');message('Chưa tạo được bộ ba. Thử một kết nối khác nhé.',false);return false;}
    await resolveBoard('hero',null,a);return true;
  });
}
function activateCore(t){return perform(async()=>{await resolveBoard('hero',makePlan(null,null,'hero',t,rand(5)));return true;});}
function activateSkill(){
  if(state.energy<100)return;
  if(typeof foeSilenced==='function'&&foeSilenced()){message('Bị phong ấn: tuyệt kỹ chưa thể dùng.');return;}
  return perform(async()=>{
    state.energy-=100;update();await heroUltimate();
    return true;
  });
}
function tileFromElement(el){const button=el.closest?.('.tile');return button?all().find(t=>t.el===button):null;}
function onTileClick(t){
  if(!t||locked||ended)return;
  if(!selected&&t.special==='core'){activateCore(t);return;}
  if(selected===t){clearSelection();return;}
  if(selected&&adjacent(selected,t)){trySwap(selected,t);return;}
  selectTile(t);
}
$('board').addEventListener('click',e=>{if(performance.now()<suppressClickUntil)return;onTileClick(tileFromElement(e.target));});
$('board').addEventListener('pointerdown',e=>{
  if(locked||ended||e.button!==0||!e.isPrimary)return;
  const t=tileFromElement(e.target);if(!t)return;pointer={id:e.pointerId,t,x:e.clientX,y:e.clientY};$('board').setPointerCapture(e.pointerId);
});
$('board').addEventListener('pointerup',e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const p=pointer;pointer=null;if($('board').hasPointerCapture(e.pointerId))$('board').releasePointerCapture(e.pointerId);
  if(locked||ended)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
  if(Math.max(Math.abs(dx),Math.abs(dy))<15){suppressClickUntil=performance.now()+350;onTileClick(p.t);return;}
  suppressClickUntil=performance.now()+450;
  const horizontal=Math.abs(dx)>=Math.abs(dy),r=p.t.r+(horizontal?0:dy>0?1:-1),c=p.t.c+(horizontal?(dx>0?1:-1):0);
  if(r>=0&&r<SIZE&&c>=0&&c<SIZE)trySwap(p.t,board[r][c]);
});
$('board').addEventListener('pointercancel',()=>{pointer=null;});$('board').addEventListener('lostpointercapture',()=>{pointer=null;});
$('board').addEventListener('keydown',e=>{
  const t=tileFromElement(e.target);if(!t)return;
  const delta={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];
  if(delta){e.preventDefault();const r=Math.max(0,Math.min(7,t.r+delta[0])),c=Math.max(0,Math.min(7,t.c+delta[1]));focusTile(board[r][c]);}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();onTileClick(t);}
  if(e.key==='Escape')clearSelection();
});
$('hintBtn').addEventListener('click',async()=>{
  if(locked||ended)return;clearSelection();const moves=legalMoves();if(!moves.length)return;const move=moves[0];
  for(const t of [move.a,move.b])animate(t.el.firstElementChild,[{transform:'scale(1)'},{transform:'scale(.85)',outline:'2px solid #fff8e7',offset:.25},{transform:'scale(1)',offset:.5},{transform:'scale(.85)',outline:'2px solid #fff8e7',offset:.75},{transform:'scale(1)'}],{duration:900});
  message('Hai ngọc đang nhấp nháy có thể kết nối với nhau.',false);
});
$('motionBtn').addEventListener('click',()=>{reduced=!reduced;if(reduced)for(const a of activeAnimations)a.finish();updateSettings();});
$('soundBtn').addEventListener('click',()=>{sound=!sound;updateSettings();if(sound)sfx('buff');else audioContext?.suspend();});
$('helpBtn').addEventListener('click',()=>{$('helpDialog').showModal();});
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$(b.dataset.close).close()));
for(const id of ['selectDialog','resultDialog'])$(id).addEventListener('cancel',e=>{e.preventDefault();if(id==='selectDialog'&&!$('heroDetail').hidden)showHeroList();});
$('helpDialog').addEventListener('click',e=>{if(e.target===$('helpDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
document.querySelector('.brand').addEventListener('click',e=>e.preventDefault());
function showSelection(initial){
  newRun=initial;chosen=initial?'fire':state.key;
  chosen=progressionInitialHero(chosen);
  $('classGrid').innerHTML=progressionHeroKeys().map((key,i)=>{const h=HEROES[key];return `<button class="class-card gem-choice" data-class="${key}" aria-label="${h.name} · ${h.title}" title="${h.name}" aria-pressed="false" style="--gem-color:${ELEMENTS[key].color};--gem-light:${ELEMENTS[key].light};--glint-delay:${-i*.7}s"><span class="avatar-gem" aria-hidden="true"><span class="gem-portrait">${heroArt(key)}</span><span class="gem-facets"></span><span class="gem-gloss"></span></span><span class="gem-sparkles" aria-hidden="true"><i></i><i></i><i></i></span></button>`;}).join('');
  $('classGrid').querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{chosen=b.dataset.class;updateSelection();showHeroDetail();}));updateSelection();showHeroList(false);$('selectDialog').showModal();$('classGrid').querySelector(`[data-class="${chosen}"]`).focus();
}
function updateSelection(){
  $('classGrid').querySelectorAll('button').forEach(b=>{b.classList.toggle('chosen',b.dataset.class===chosen);b.setAttribute('aria-pressed',String(b.dataset.class===chosen));});
  $('startBtn').setAttribute('aria-label','Xuất chiến cùng '+HEROES[chosen].name);
}
function showHeroList(focus=true){
  $('heroDetail').hidden=true;$('heroList').hidden=false;
  $('selectDialog').classList.remove('showing-hero');
  $('selectTitle').textContent=newRun?'Chọn chiến binh của bạn.':'Một chặng đường mới.';
  $('selectIntro').textContent=progressionSelectionIntro(newRun?'Chọn người đồng hành cho trận đánh.':'Màn '+state.stage+' · Quái hệ '+ELEMENTS[state.enemyKey].label+' đang chờ.');
  $('heroSelectionScroll').scrollTop=0;
  if(focus)$('classGrid').querySelector(`[data-class="${chosen}"]`).focus({preventScroll:true});
}
function showHeroDetail(){
  const h=HEROES[chosen],element=ELEMENTS[chosen];
  const skillDetails={
    fire:'Đứng tại chỗ giơ cao kiếm chéo ra sau, vận sức khiến lưỡi kiếm dài dần và rực lửa. Bổ mạnh một nhát để phóng kiếm khí tới đối thủ; kiếm khí trúng đích phát nổ, gây 135 sát thương cơ bản.',
    earth:'Lao vào bằng đại khiên, gây choáng 2 lượt và không gây sát thương trực tiếp. Trong thời gian choáng, sát thương Nori gây ra được tích trữ; khi hết choáng, toàn bộ lượng tích trữ nổ với sức mạnh ×3. Hồi 40 HP vào đầu mỗi lượt của bạn trong 3 lượt tiếp theo.',
    ice:'Nhận 25 giáp, niệm phép bằng trượng rồi triệu hồi tảng băng lớn từ trên trời. Băng giáng xuống gây 60 sát thương cơ bản và choáng mục tiêu 1 lượt.',
    lightning:'Lơ lửng niệm phép, gọi mây giông và giáng liên tiếp 5 tia sét xuống đối thủ. Tổng sát thương cơ bản: 140.',
    shadow:'Chậm rãi áp sát rồi tăng tốc, để lại tàn ảnh qua 5 lần lướt chém phải–trái trước khi trở về. Tổng sát thương cơ bản: 150.'
  };
  $('selectTitle').textContent=h.name;$('selectIntro').textContent=h.title+' · '+element.label;
  $('heroList').hidden=true;$('heroDetail').hidden=false;
  $('selectDialog').classList.add('showing-hero');
  $('heroDetail').style.setProperty('--hero-tint',element.color);
  $('heroShowcase').dataset.hero=chosen;$('heroShowcase').innerHTML='<div class="hero-showcase-art">'+heroArt(chosen)+'</div>';
  const stats=[['Máu tối đa',h.hp+' HP'],['Sát thương / ngọc kiếm',chosen==='fire'?'12,8':chosen==='earth'?'4,8':'8'],['Giáp / ngọc khiên',chosen==='ice'?'+8':'+4'],['Hồi máu / ngọc tim','+6 HP']];
  $('heroDetailStats').innerHTML=stats.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('');
  $('heroDetailTrait').textContent=h.trait+(chosen==='lightning'?' · Luôn lơ lửng khi còn sống.':'.');
  $('heroSkillName').textContent=h.skill;$('heroSkillDescription').textContent=skillDetails[chosen]||h.desc;
  $('heroStatNote').textContent='Sát thương cơ bản trước khắc hệ, liên hoàn và chí mạng; làm tròn khi gây sát thương.';
  $('heroCarryover').hidden=newRun;
  $('heroCarryover').textContent=newRun?'':'Xuất chiến với '+Math.min(state.hp,h.hp)+'/'+h.hp+' HP · '+state.armor+' giáp · '+state.energy+'/100 nộ. Chỉ số được giữ từ màn trước, máu giới hạn theo tướng.';
  $('selectTitle').focus({preventScroll:true});$('heroSelectionScroll').scrollTop=0;
}
$('heroBackBtn').addEventListener('click',()=>showHeroList());
function startStage(){
  state.noriStunTurns=0;state.noriStoredDamage=0;
  state.noriRegenTurns=0;clearNoriRenewal();
  stopCombatVoices();bossDeathVoicePlayed=false;
  resetBoardCombo();
  state.boss=state.stage%5===0;state.enemyMax=Math.round((350+180*(state.stage-1))*(state.boss?2.5:1));state.enemyHp=state.enemyMax;state.enemyArmor=0;state.enemyEnergy=0;state.frozen=false;state.stunned=false;state.playerFrozen=false;state.enemyTurn=0;state.enraged=false;
  ended=false;locked=false;turn='player';pointer=null;suppressClickUntil=0;plannedIntent=intent();$('heroActor').style.opacity='1';$('enemyActor').style.opacity='1';$('combatEffects').replaceChildren();seedBoard();renderActors();update();message(state.boss?'Người giữ rừng xuất hiện! Đọc ý định và chuẩn bị ngọc đặc biệt.':'Chào '+HEROES[state.key].name+'! Ghép ngọc, cùng nhau đánh thức khu rừng.');
}
$('startBtn').addEventListener('click',()=>{if(sound)sfx('buff');state.key=chosen;state.hp=newRun?HEROES[chosen].hp:Math.min(state.hp,HEROES[chosen].hp);$('selectDialog').close();startStage();$('hintBtn').focus({preventScroll:true});startReadyUltimates();});
$('nextBtn').addEventListener('click',async()=>{
  if(stageTransition)return;stageTransition=true;
  const won=state.hp>0;$('resultDialog').close();
  try{
    if(won){state.stage++;state.enemyKey=KEYS[rand(4)];}
    else{state={stage:1,score:0,key:'fire',hp:170,armor:0,energy:0,enemyKey:KEYS[rand(4)],enemyHp:350,enemyMax:350,enemyArmor:0,enemyEnergy:0,boss:false,frozen:false,stunned:false,playerFrozen:false,enemyTurn:0,enraged:false};$('logEntries').replaceChildren();$('logCount').textContent='0 sự kiện';}
    await previewNextEncounter(!won);
  }finally{stageTransition=false;}
});
// Resizing cancels visual interpolation only; model positions are already final.
let lastWidth=0;new ResizeObserver(entries=>{const w=entries[0].contentRect.width;if(lastWidth&&Math.abs(w-lastWidth)>2)for(const a of activeAnimations){if(a.effect?.target?.classList?.contains('tile'))a.finish();}lastWidth=w;}).observe($('board'));
/* GAME_EXTENSIONS */
document.querySelectorAll('[data-icon]').forEach(e=>e.innerHTML=icon(e.dataset.icon));$('helpBtn').innerHTML=icon('help');$('motionBtn').innerHTML=icon('spark');$('landscape').innerHTML=landscapeArt();
$('tileLegend').innerHTML=TYPES.map(t=>'<div class="legend-item"><span class="legend-icon">'+icon(t.icon,t.color)+'</span><span>'+t.name+'</span><small>'+t.effect+'</small></div>').join('');
$('helpLegend').innerHTML=TYPES.map((t,i)=>'<div>'+icon(t.icon,t.color)+'<span><b>'+t.name+'</b> · '+['8 sát thương mỗi ngọc, trước hệ số nhân vật và nguyên tố','Hồi 6 HP mỗi ngọc','Tích thêm năng lượng để dùng tuyệt kỹ','Ghép 3 để đóng băng quái trong 1 lượt','4 giáp mỗi ngọc; Yuki nhận 8'][i]+'</span></div>').join('');
updateSettings();state.enemyKey=KEYS[rand(4)];renderActors();update();seedBoard();showSelection(true);
if(typeof finishArtSetup==='function')finishArtSetup();
// Local QA bridge is opt-in and absent from normal game sessions.
if(new URLSearchParams(location.search).has('qa'))window.gameQA={
  beginBoardCombo,boardComboStart,finishBoardCombo,resetBoardCombo,
  warmCombatVoices,stopCombatVoices,restorationEffect,heroUltimate,enemySkill,rageChoreography,combatVoice,combatLootReceive,boardItemRecoil,specialStarNova,departVictoriousHero,damage,
  warmNoctSounds,playNoctSound,stopNoctSounds,get noctSounds(){return [...noctSoundSources].map(({id,pan})=>({id,pan}));},
  playCastSound,stopCastSounds,get castSounds(){return [...castSoundSources].map(({id})=>id);},
  spriteInfo(family,key,action){const {sheet,action:mapped}=spriteDefinition(family,key,action);return {action:mapped,count:sheet.count,heads:sheet.heads};},
  get state(){return state;},get board(){return board;},get locked(){return locked;},get ended(){return ended;},matches,legalMoves,trySwap,activateSkill,activateCore,enemyAction,resolveBoard,ensurePlayable,makePlan,attack,buff,setSpriteFrame,setSpriteAction,chooseEnemyMove,enemyThinkingLevel,opponentAI:OpponentAI,createLiveCombat,finishBattle,boardItemSound,boardImpactShake,
  get progressionTurns(){return progressionTurn;},
  get expedition(){return typeof expeditionState==='undefined'?null:expeditionState;},expeditionCollect,
  get progressionEnemyEffects(){return {dot:progressionEnemyDot?{...progressionEnemyDot}:null,charge:progressionEnemyCharge};},
  // Studio: try an alternative drawing of a hero (ART.heroVariants) in place of its current one.
  heroVariant(key,name){const base=ART.heroVariantBase||(ART.heroVariantBase={});base[key]??=ART.heroes[key];ART.heroes[key]=name?ART.heroVariants?.[key]?.[name]||base[key]:base[key];renderActors();update();return Object.keys(ART.heroVariants?.[key]||{});},
  configure(options){if(locked&&!$('selectDialog').open)throw Error('Wait for the current action to finish');Object.assign(state,options);if($('selectDialog').open)$('selectDialog').close();if($('resultDialog').open)$('resultDialog').close();startStage();Object.assign(state,options);plannedIntent=intent();renderActors();update();},
  setBoard(types,specials=[]){if(locked)throw Error('Board is busy');clearSelection();$('board').replaceChildren();board=types.map((row,r)=>row.map((type,c)=>newTile(type,r,c)));specials.forEach(s=>{board[s.r][s.c].special=s.kind;if(s.kind==='core')board[s.r][s.c].type=-1;});all().forEach(createTile);board[0][0].el.tabIndex=0;},
  setReduced(value){reduced=value;updateSettings();},async settle(){await ensurePlayable();},get effects(){return activeAnimations.size;},get art(){return ART;},get monsters(){return MONSTERS;},get creatureNames(){return progressionRules.WORLD.CREATURE_NAMES;},get foeStatuses(){return foeStatuses;},get foeHaste(){return foeHaste;},resetFoeStatuses(){foeStatusReset();},tickFoeStatuses(){return tickFoeStatuses();},applyFoeStatus(s,base){return applyFoeStatus(s,base);},castReadyUltimates(){return castReadyUltimates();},foeSkills(){const o=state.qaFoeFx;if(!o)return [];const W=progressionRules.WORLD;return (o.tier==='boss'?W.BOSSES[o.boss]?.skills:o.tier==='elite'?W.ELITE_SKILLS[o.creature]:[W.COMMON_SKILL])||[];},
  foeCast(index,base=30){const s=this.foeSkills()[index];if(!s)return;const hit=s.effects?.find(e=>e.type==='hit'||e.type==='burst'),ward=s.effects?.find(e=>e.type==='ward'),heal=s.effects?.find(e=>e.type==='heal');
    const skill=s.effects?{name:s.name,move:s.move,ult:s.ult,kind:s.kind,power:hit?.power||0,hits:hit?.hits||1,shield:ward?.pct,heal:heal?.pct,status:s.effects.find(e=>e.type==='status')}:s;return castFoeSkill(skill,base);},get chapters(){return progressionRules.WORLD.CHAPTERS;},get bossDefs(){return progressionRules.WORLD.BOSSES;}
};
})();
