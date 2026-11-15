// A small, dependency-free 3D scene. All architecture is schematic, not a model of the built work.
(() => {
  const canvas = document.getElementById('islandCanvas');
  const stage = document.getElementById('islandStage');
  const tooltip = document.getElementById('sceneTooltip');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pieces = [
    { x:-255, z:-130, name:'DAKA 園區', color:'#d8df82', type:'park' },
    { x:0, z:-235, name:'中和運動中心', color:'#8fc5c4', type:'arena' },
    { x:250, z:-120, name:'連雲玥恆', color:'#efa18a', type:'tower' },
    { x:-245, z:175, name:'光盒之樹', color:'#dfb965', type:'boxes' },
    { x:5, z:110, name:'基隆轉運站', color:'#b6d7cd', type:'terminal' },
    { x:255, z:190, name:'莒光公共住宅', color:'#c5d08e', type:'housing' }
  ];
  const overview = { yaw: -.37, tilt: .82, zoom: 1 };
  const links = [[0, 1], [1, 2], [2, 5], [3, 0], [4, 1]];
  let { yaw, tilt, zoom } = overview;
  let hover = -1, labels = [], drawnFaces = [], down = null;
  let width = 0, height = 0, mapWidth = 0, centerX = 0, centerY = 0;
  let showLinks = false;

  function mapScale() {
    return Math.min(mapWidth / 900, height / 690) * zoom;
  }

  function shade(hex, amount) {
    const c = hex.replace('#','');
    const v = [0,2,4].map(i => Math.max(0, Math.min(255, parseInt(c.slice(i,i+2),16) + amount)));
    return '#' + v.map(n => n.toString(16).padStart(2,'0')).join('');
  }
  function project(p) {
    const rx = Math.cos(yaw)*p.x - Math.sin(yaw)*p.z;
    const rz = Math.sin(yaw)*p.x + Math.cos(yaw)*p.z;
    const sy = p.y*Math.cos(tilt) - rz*Math.sin(tilt);
    const depth = rz*Math.cos(tilt) - p.y*Math.sin(tilt);
    const s = mapScale() * 1080/(1080 + depth);
    return { x:centerX+rx*s, y:centerY-sy*s, depth };
  }
  function addFace(faces, points, color, stroke='rgba(16,61,52,.16)') {
    const pts = points.map(project);
    faces.push({ pts, color, stroke, depth:pts.reduce((a,p)=>a+p.depth,0)/pts.length });
  }
  function box(faces, x,z,w,d,h,base,color) {
    const a={x:x-w/2,y:base,z:z-d/2}, b={x:x+w/2,y:base,z:z-d/2};
    const c={x:x+w/2,y:base,z:z+d/2}, e={x:x-w/2,y:base,z:z+d/2};
    const A={...a,y:base+h}, B={...b,y:base+h}, C={...c,y:base+h}, E={...e,y:base+h};
    addFace(faces,[a,b,B,A],shade(color,-28));
    addFace(faces,[b,c,C,B],shade(color,-12));
    addFace(faces,[c,e,E,C],shade(color,-22));
    addFace(faces,[e,a,A,E],shade(color,-8));
    addFace(faces,[A,B,C,E],shade(color,25));
  }
  function hex(faces,x,z,r,color) {
    const bottom=[], top=[];
    for(let i=0;i<6;i++) {
      const a=Math.PI/3*i+Math.PI/6;
      bottom.push({x:x+Math.cos(a)*r,y:-29,z:z+Math.sin(a)*r});
      top.push({x:x+Math.cos(a)*r,y:0,z:z+Math.sin(a)*r});
    }
    for(let i=0;i<6;i++) addFace(faces,[bottom[i],bottom[(i+1)%6],top[(i+1)%6],top[i]],shade(color,-38));
    addFace(faces,top,color,'rgba(255,255,255,.35)');
    const inner=top.map(p=>({x:x+(p.x-x)*.84,y:.7,z:z+(p.z-z)*.84}));
    addFace(faces,inner,shade(color,10),'rgba(20,60,51,.2)');
  }
  function building(faces,p) {
    const {x,z,type}=p;
    const cream='#f2eadb', glass='#9cbec0', brick='#c87d66';
    if(type==='park') {
      box(faces,x-37,z+8,55,65,28,2,cream);
      box(faces,x+32,z-22,52,42,43,2,brick);
      box(faces,x+38,z+42,48,27,18,2,cream);
      for(let i=0;i<5;i++) box(faces,x-61+i*30,z-52,7,7,15+i%2*7,1,'#577f63');
    } else if(type==='arena') {
      box(faces,x,z,145,85,38,2,cream);
      box(faces,x,z,160,98,8,40,glass);
      box(faces,x-38,z-50,48,10,25,2,'#6c9393');
      box(faces,x+25,z-50,45,10,25,2,'#6c9393');
    } else if(type==='tower') {
      box(faces,x-17,z,68,54,145,2,cream);
      box(faces,x+38,z+20,45,45,96,2,brick);
      for(let i=0;i<7;i++) box(faces,x-17,z+29,54,2,3,20+i*17,'#739a9b');
    } else if(type==='boxes') {
      box(faces,x-30,z+12,62,55,43,2,cream);
      box(faces,x+29,z-16,56,48,62,2,glass);
      box(faces,x-8,z+3,70,50,35,68,'#f3e3ba');
      box(faces,x+10,z+8,45,42,20,103,cream);
    } else if(type==='terminal') {
      for(let i=-1;i<=1;i++) box(faces,x+i*43,z,30,65,23,2,glass);
      box(faces,x,z,145,89,7,26,cream);
      box(faces,x,z-42,145,7,8,2,'#628c88');
    } else {
      box(faces,x-40,z,54,58,116,2,cream);
      box(faces,x+34,z-7,57,55,102,2,brick);
      box(faces,x,z+41,105,20,22,2,glass);
      for(let i=0;i<5;i++) {
        box(faces,x-40,z+30,42,2,3,23+i*17,'#709b9d');
        box(faces,x+34,z+22,45,2,3,23+i*15,'#e4b49e');
      }
    }
  }
  function drawFace(face) {
    ctx.beginPath();
    face.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
    ctx.closePath(); ctx.fillStyle=face.color; ctx.fill();
    ctx.strokeStyle=face.stroke; ctx.lineWidth=1; ctx.stroke();
  }
  function render() {
    if (!width || !height) return;
    ctx.clearRect(0,0,width,height);
    const scale=mapScale();
    ctx.save();
    ctx.translate(centerX,centerY);
    ctx.scale(1,.4); ctx.beginPath(); ctx.ellipse(0,70,410*scale,355*scale,0,0,Math.PI*2);
    ctx.fillStyle='rgba(10,46,43,.16)';ctx.fill();ctx.restore();
    for(let n=1;n<=3;n++) {
      ctx.beginPath(); ctx.ellipse(centerX,centerY+7,340*scale+n*32,105*scale+n*16,0,0,Math.PI*2);
      ctx.strokeStyle='rgba(220,243,217,.12)';ctx.lineWidth=1;ctx.stroke();
    }
    if (showLinks) {
      ctx.save();
      ctx.strokeStyle = '#def3ba';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 7]);
      links.forEach(([from, to]) => {
        const a = project({ ...pieces[from], y: -6 });
        const b = project({ ...pieces[to], y: -6 });
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      ctx.restore();
    }
    drawnFaces = pieces.flatMap((piece, index) => {
      const faces = [];
      hex(faces, piece.x, piece.z, 116, piece.color);
      building(faces, piece);
      return faces.map(face => ({ ...face, index }));
    }).sort((a,b)=>b.depth-a.depth);
    drawnFaces.forEach(drawFace);
    ctx.font = width <= 680 ? '700 10px system-ui, sans-serif' : '700 12px system-ui, sans-serif';
    labels=pieces.map((p,i)=>({
      ...project({x:p.x,y:143,z:p.z}),
      i,
      pillWidth: ctx.measureText(p.name).width + (width <= 680 ? 12 : 23)
    })).sort((a,b)=>b.depth-a.depth);
    labels.forEach(({x,y,i,pillWidth})=>{
      const label=pieces[i].name;
      ctx.fillStyle=i===hover?'#d5df7e':'rgba(244,240,232,.95)';
      ctx.beginPath();ctx.roundRect(x-pillWidth/2,y-13,pillWidth,27,14);ctx.fill();
      ctx.fillStyle='#163e38';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,y+1);
      ctx.strokeStyle='rgba(244,240,232,.65)';ctx.beginPath();ctx.moveTo(x,y+14);
      const anchor=project({x:pieces[i].x,y:32,z:pieces[i].z});
      ctx.lineTo(anchor.x,anchor.y);ctx.stroke();
    });
  }
  function layout() {
    const panel = document.querySelector('.map-panel:not([hidden])');
    const side = panel && width > 680 ? panel.getBoundingClientRect().right : 0;
    const mobilePanel = panel && !side;
    mapWidth = mobilePanel ? width * .63 : width - side;
    centerX = side + (width - side) / 2;
    centerY = mobilePanel ? height * .29 : height * (width <= 680 ? .60 : .55);
    render();
  }
  function resize() {
    const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    layout();
  }
  function nearest(x,y) {
    const label = labels.findLast(p => Math.abs(p.x-x) <= p.pillWidth/2 && Math.abs(p.y-y) <= 14);
    if (label) return label.i;
    const face = drawnFaces.findLast(({ pts }) => {
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const a = pts[i], b = pts[j];
        if ((a.y > y) !== (b.y > y) && x < (b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x) inside = !inside;
      }
      return inside;
    });
    return face?.index ?? -1;
  }
  canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY,yaw,tilt,moved:false};canvas.setPointerCapture(e.pointerId);stage.classList.add('dragging');});
  canvas.addEventListener('pointermove',e=>{
    const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
    if(down) {
      const dx=e.clientX-down.x,dy=e.clientY-down.y;
      if(Math.hypot(dx,dy)>5) down.moved=true;
      yaw=down.yaw+dx*.005;tilt=Math.max(.35,Math.min(1.25,down.tilt+dy*.003));
      render();
    } else {
      hover=nearest(x,y);canvas.style.cursor=hover>=0?'pointer':'grab';
      tooltip.classList.toggle('visible',hover>=0);
      if(hover>=0){tooltip.textContent=pieces[hover].name+' · 查看作品';tooltip.style.left=x+'px';tooltip.style.top=y+'px';}
      render();
    }
  });
  canvas.addEventListener('pointerup',e=>{
    const was=down;down=null;stage.classList.remove('dragging');
    if(was&&!was.moved){const rect=canvas.getBoundingClientRect(),i=nearest(e.clientX-rect.left,e.clientY-rect.top);if(i>=0) openDetail(String(i+1).padStart(2,'0'));}
  });
  canvas.addEventListener('pointercancel',()=>{down=null;stage.classList.remove('dragging');});
  canvas.addEventListener('pointerleave',()=>{hover=-1;tooltip.classList.remove('visible');render();});
  function changeZoom(factor) {
    zoom = Math.max(.65, Math.min(1.8, zoom * factor));
    render();
  }
  canvas.addEventListener('wheel',e=>{e.preventDefault();changeZoom(e.deltaY>0?.91:1.09);},{passive:false});
  canvas.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft')yaw-=.14; else if(e.key==='ArrowRight')yaw+=.14;
    else if(e.key==='ArrowUp')tilt=Math.max(.35,tilt-.1); else if(e.key==='ArrowDown')tilt=Math.min(1.25,tilt+.1);
    else if(e.key==='+'||e.key==='=')zoom=Math.min(1.8,zoom*1.1);
    else if(e.key==='-')zoom=Math.max(.65,zoom*.9);
    else if(/^[1-6]$/.test(e.key))openDetail('0'+e.key);
    else return;
    e.preventDefault();render();
  });
  document.getElementById('mapZoomOut').addEventListener('click', () => changeZoom(.87));
  document.getElementById('mapZoomIn').addEventListener('click', () => changeZoom(1.15));
  document.getElementById('mapReset').addEventListener('click', () => {
    ({ yaw, tilt, zoom } = overview);
    render();
  });
  document.getElementById('mapLinks').addEventListener('click', event => {
    showLinks = !showLinks;
    event.currentTarget.setAttribute('aria-pressed', String(showLinks));
    render();
  });
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('maplayout', layout);
})();
