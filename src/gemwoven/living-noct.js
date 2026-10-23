/* Living Noct: a mesh-free per-pixel cloth rig (WebGL) for his resting drawing.
 * A weight map built from the drawing's own alpha decides what may move: cloth near the body
 * is pinned and motion grows toward the ragged edges, so wind waves travel from where the cloak
 * is attached out to the tatter tips. The hood, face, weapon and boots are pinned (authored
 * per form below); the chest swells in place a little; the eyes glow with the breath.
 * Usage: GemwovenLivingNoct.attach(hostElement, imageSource, form[, cell]) -> {stop()}. */
(() => {
  // Per form, in 256px cell coordinates: crown/neck/foot rows, eyes, chest, and pinned shapes
  // ([x1,y1,x2,y2,halfWidth] capsules along weapons, [x,y,w,h] rectangles).
  const FORMS={
    1:{neck:136,foot:242,eyes:[[150,121],[166,121]],chest:[150,168],capsules:[[100,80,114,128,6]],rects:[]},
    2:{neck:136,foot:244,eyes:[[168,108],[185,108]],chest:[172,165],capsules:[[4,248,134,174,13],[116,154,144,194,11]],rects:[]},
    3:{neck:142,foot:246,eyes:[[136,127],[152,127]],chest:[146,172],capsules:[[99,44,133,240,6],[80,46,104,84,10]],rects:[[0,0,256,88],[174,86,200,130]]}
  };
  const VERT='attribute vec2 p;varying vec2 uv;void main(){uv=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0,1);}';
  const FRAG=`precision mediump float;varying vec2 uv;uniform sampler2D img;uniform sampler2D wmap;uniform float t;uniform vec2 chest;uniform vec4 eyes;uniform float strength;
  void main(){
    vec4 w=texture2D(wmap,uv);            // r: cloth weight, g: distance from body (0..1), b: chest falloff
    float breath=.5-.5*cos(t*1.366);       // 4.6 s breath
    float gust=.65+.35*sin(t*.53)*sin(t*.31+1.3);
    float d=w.g*14.;
    float wave=sin(t*2.3-d*2.6+uv.y*9.)+.45*sin(t*3.7-d*4.1+1.7)+.25*sin(t*5.9-d*6.3+uv.y*21.);
    vec2 off=w.r*strength*gust*vec2(.011*wave-.006,.0045*sin(t*2.9-d*3.3+uv.x*7.));
    vec2 c=uv-chest;off+=c*(-.018*breath*w.b);   // chest swells in place
    vec4 col=texture2D(img,uv+off);
    float e=0.;for(int i=0;i<2;i++){vec2 q=(uv-(i==0?eyes.xy:eyes.zw))*vec2(1.,2.2);e+=exp(-dot(q,q)*9000.);}
    col.rgb+=e*(.18+.32*breath)*vec3(.9,.86,1.)*col.a;
    gl_FragColor=col;
  }`;
  function weightMap(alpha,f){
    const N=256,core=new Float32Array(N*N),dist=new Float32Array(N*N);
    // Body core: opaque pixels at least 9px inside the silhouette (two-pass chamfer distance).
    const inner=new Float32Array(N*N);
    for(let i=0;i<N*N;i++)inner[i]=alpha[i]>200?1e9:0;
    const pass=(a)=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!a[i])continue;let m=a[i];if(x)m=Math.min(m,a[i-1]+1);if(y)m=Math.min(m,a[i-N]+1);if(x&&y)m=Math.min(m,a[i-N-1]+1.4);if(x<N-1&&y)m=Math.min(m,a[i-N+1]+1.4);a[i]=m;}
      for(let y=N-1;y>=0;y--)for(let x=N-1;x>=0;x--){const i=y*N+x;if(!a[i])continue;let m=a[i];if(x<N-1)m=Math.min(m,a[i+1]+1);if(y<N-1)m=Math.min(m,a[i+N]+1);if(x<N-1&&y<N-1)m=Math.min(m,a[i+N+1]+1.4);if(x&&y<N-1)m=Math.min(m,a[i+N-1]+1.4);a[i]=m;}};
    pass(inner);
    for(let i=0;i<N*N;i++){core[i]=inner[i]>=9?0:1e9;}
    // Distance of every pixel from the core, outward.
    const pass2=(a)=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;let m=a[i];if(x)m=Math.min(m,a[i-1]+1);if(y)m=Math.min(m,a[i-N]+1);if(x&&y)m=Math.min(m,a[i-N-1]+1.4);if(x<N-1&&y)m=Math.min(m,a[i-N+1]+1.4);a[i]=m;}
      for(let y=N-1;y>=0;y--)for(let x=N-1;x>=0;x--){const i=y*N+x;let m=a[i];if(x<N-1)m=Math.min(m,a[i+1]+1);if(y<N-1)m=Math.min(m,a[i+N]+1);if(x<N-1&&y<N-1)m=Math.min(m,a[i+N+1]+1.4);if(x&&y<N-1)m=Math.min(m,a[i+N-1]+1.4);a[i]=m;}};
    pass2(core);
    const smooth=(a,b,x)=>{const k=Math.min(1,Math.max(0,(x-a)/(b-a)));return k*k*(3-2*k);};
    const capsule=(x,y,[x1,y1,x2,y2,r])=>{const vx=x2-x1,vy=y2-y1,l=vx*vx+vy*vy,k=Math.max(0,Math.min(1,((x-x1)*vx+(y-y1)*vy)/l)),dx=x-x1-k*vx,dy=y-y1-k*vy;return Math.sqrt(dx*dx+dy*dy)-r;};
    const out=new Uint8Array(N*N*4);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const i=y*N+x,d=Math.min(core[i],40);
      let w=smooth(2,20,d)*(.35+.65*smooth(f.neck,f.foot-30,y)) // more freedom lower down
        *smooth(f.neck,f.neck+18,y)                               // hood pinned
        *(1-smooth(f.foot-14,f.foot-3,y));                        // hem rests on the ground
      for(const c of f.capsules)w*=smooth(0,8,capsule(x,y,c));
      for(const [rx,ry,rw,rh] of f.rects)if(x>=rx-6&&x<=rx+rw+6&&y>=ry-6&&y<=ry+rh+6)w*=Math.min(1,Math.max(0,Math.min(x-rx+6,rx+rw+6-x,y-ry+6,ry+rh+6-y)/6))*0;
      const cx=(x-f.chest[0])/30,cy=(y-f.chest[1])/24,chest=Math.exp(-(cx*cx+cy*cy))*(1-smooth(f.neck-4,f.neck+10,256-y));
      out[i*4]=w*255;out[i*4+1]=d/40*255;out[i*4+2]=Math.max(0,Math.exp(-(cx*cx+cy*cy)))*255*smooth(f.neck,f.neck+12,y);out[i*4+3]=255;
    }
    return out;
  }
  function texture(gl,unit,source,data){
    const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);
    if(data)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,256,0,gl.RGBA,gl.UNSIGNED_BYTE,data);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
    for(const [k,v] of [[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR],[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE]])gl.texParameteri(gl.TEXTURE_2D,k,v);
    return tex;
  }
  const cache=new Map();
  function load(src,cell){
    const key=src+'|'+(cell||'');if(cache.has(key))return cache.get(key);
    const job=new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{
      const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
      const [sx,sy,sw,sh]=cell||[0,0,im.naturalWidth,im.naturalHeight];g.drawImage(im,sx,sy,sw,sh,0,0,256,256);resolve(c);};im.onerror=reject;im.src=src;});
    cache.set(key,job);return job;
  }
  function attach(host,src,form,{cell=null,strength=1}={}){
    const f=FORMS[form]||FORMS[3];let stopped=false,raf=0;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;canvas.className='living-noct';canvas.setAttribute('aria-hidden','true');
    const gl=canvas.getContext('webgl',{premultipliedAlpha:false,alpha:true,antialias:false});
    if(!gl)return null;
    load(src,cell).then(c=>{
      if(stopped)return;
      const alpha=new Uint8Array(256*256),px=c.getContext('2d').getImageData(0,0,256,256).data;for(let i=0;i<alpha.length;i++)alpha[i]=px[i*4+3];
      const prog=gl.createProgram();for(const [type,code] of [[gl.VERTEX_SHADER,VERT],[gl.FRAGMENT_SHADER,FRAG]]){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);gl.attachShader(prog,s);}
      gl.linkProgram(prog);gl.useProgram(prog);
      const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
      texture(gl,0,c);texture(gl,1,null,weightMap(alpha,f));
      gl.uniform1i(gl.getUniformLocation(prog,'img'),0);gl.uniform1i(gl.getUniformLocation(prog,'wmap'),1);
      gl.uniform2f(gl.getUniformLocation(prog,'chest'),f.chest[0]/256,f.chest[1]/256);
      gl.uniform4f(gl.getUniformLocation(prog,'eyes'),f.eyes[0][0]/256,f.eyes[0][1]/256,f.eyes[1][0]/256,f.eyes[1][1]/256);
      gl.uniform1f(gl.getUniformLocation(prog,'strength'),strength);
      const tl=gl.getUniformLocation(prog,'t'),start=performance.now()-Math.random()*4000;
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      const reduced=()=>document.body?.classList.contains('reduced-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const frame=now=>{if(stopped)return;raf=requestAnimationFrame(frame);if(document.hidden)return;
        gl.viewport(0,0,512,512);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(tl,reduced()?0:(now-start)/1000);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);};
      raf=requestAnimationFrame(frame);host.classList.add('living-noct-on');
    });
    host.append(canvas);
    return {canvas,stop(){stopped=true;cancelAnimationFrame(raf);canvas.remove();host.classList.remove('living-noct-on');gl.getExtension('WEBGL_lose_context')?.loseContext();}};
  }
  window.GemwovenLivingNoct={attach,FORMS};
})();
