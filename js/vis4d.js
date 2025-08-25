// Simulador 4D simples: mosaico de áreas + timeline (marcos ou datas)
(function(){
  const el = (id)=> document.getElementById(id);
  const TT = ()=> el('tt');
  let timer = null, steps = [], stepIndex = 0, areas = [], dataRows = [];

  function buildSvg(container, tiles){
    const w = container.clientWidth - 2, h = container.clientHeight - 2;
    const cols = Math.ceil(Math.sqrt(tiles.length));
    const rows = Math.ceil(tiles.length/cols);
    const pad = 8; const tw = Math.floor((w - pad*(cols+1))/cols); const th = Math.floor((h - pad*(rows+1))/rows);
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('width', w); svg.setAttribute('height', h);
    svg.style.display='block';

    tiles.forEach((t,i)=>{
      const c = i % cols; const r = Math.floor(i/cols);
      const x = pad + c*(tw+pad); const y = pad + r*(th+pad);
      const g = document.createElementNS(svg.namespaceURI,'g');
      const rect = document.createElementNS(svg.namespaceURI,'rect');
      rect.setAttribute('x', x); rect.setAttribute('y', y); rect.setAttribute('rx', 10); rect.setAttribute('ry', 10);
      rect.setAttribute('width', tw); rect.setAttribute('height', th); rect.setAttribute('fill', t.fill || '#ddd');
      rect.setAttribute('stroke', '#c7ccd1');
      rect.dataset.area = t.area;

      const label = document.createElementNS(svg.namespaceURI,'text');
      label.setAttribute('x', x+8); label.setAttribute('y', y+18);
      label.setAttribute('font-size','12'); label.setAttribute('fill','#111'); label.textContent = t.area;

      g.appendChild(rect); g.appendChild(label); svg.appendChild(g);

      g.addEventListener('mousemove', (ev)=>{
        const row = dataRows.find(r=> String(r._area)===String(t.area));
        const html = row ?
          `<b>${t.area}</b><br>`+
          `Previsto: ${fmtP(row._prev)}<br>`+
          `Real: ${fmtP(row._real)}<br>`+
          `Masterplan: ${fmtP(row._mp)}<br>`+
          (row._custo!=null?`Custo/Frente: ${row._custo}`:'')
          : t.area;
        showTT(ev.clientX, ev.clientY, html);
      });
      g.addEventListener('mouseleave', hideTT);
    });

    container.innerHTML='';
    container.appendChild(svg);
  }

  function showTT(cx, cy, html){
    const tt = TT(); tt.innerHTML = html; tt.style.opacity=1;
    const r = tt.parentElement.getBoundingClientRect();
    tt.style.left = (cx - r.left) + 'px';
    tt.style.top = (cy - r.top) + 'px';
  }
  function hideTT(){ const tt = TT(); tt.style.opacity=0; }

  function fmtP(v){ return (v==null? '–' : (typeof v==='number'? (v*100).toFixed(0)+'%' : v)); }

  function colorFor(areaRow, mode){
    const p = areaRow._prev||0, r = areaRow._real||0, m = areaRow._mp||0;
    if(mode==='Previsto') return '#54aeff';
    if(mode==='Masterplan') return '#c297ff';
    if(mode==='Real'){
      // Real adiantado ou atrasado vs Previsto
      const desvio = r - p; // >0 adiantado, <0 atrasado
      if(desvio < -0.05) return '#ffd966'; // atraso
      if(desvio > 0.05) return '#2da44e'; // adiantado
      return '#7ee787'; // dentro
    }
    return '#ddd';
  }

  function recomputeTiles(mode){
    const container = el('vis4d');
    const tiles = areas.map(a=>{
      const row = dataRows.find(r=> String(r._area)===String(a)) || {};
      return {area:a, fill: colorFor(row, mode)};
    });
    buildSvg(container, tiles);
    el('lblStep').textContent = mode;
  }

  function play(){
    if(timer){ clearInterval(timer); timer=null; el('btnPlay').textContent='▶️ Play'; return; }
    el('btnPlay').textContent='⏸️ Pause';
    timer = setInterval(()=>{
      stepIndex = (stepIndex + 1) % steps.length;
      el('rngStep').value = stepIndex; recomputeTiles(steps[stepIndex]);
    }, 1200);
  }

  function setupTimeline(possibleDates){
    steps = possibleDates && possibleDates.length ? possibleDates.slice(0,30) : ['Masterplan','Previsto','Real'];
    stepIndex = 0;
    const rng = el('rngStep'); rng.max = String(Math.max(0, steps.length-1)); rng.value = '0';
    el('lblStep').textContent = steps[0];
    rng.oninput = ()=>{ stepIndex = Number(rng.value); recomputeTiles(steps[stepIndex]); };
    el('btnPlay').onclick = play;
  }

  // API pública
  window._vis4d = {
    init: ({rows, uniqueAreas, dates})=>{
      dataRows = rows; areas = uniqueAreas;
      setupTimeline(dates);
      recomputeTiles(steps[0]);
    },
    applyAreaFilter: (areasSel)=>{
      areas = areasSel && areasSel.length ? areasSel : Array.from(new Set(dataRows.map(r=> r._area))).sort();
      recomputeTiles(steps[stepIndex]);
    },
    goTo: (label)=>{
      const idx = steps.indexOf(label); if(idx>=0){ stepIndex=idx; el('rngStep').value=String(idx); recomputeTiles(steps[idx]); }
    }
  };
})();
