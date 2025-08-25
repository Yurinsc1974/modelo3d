(function(){
  const logEl = ()=> document.getElementById('log');
  const selArea = ()=> document.getElementById('selArea');
  const selData = ()=> document.getElementById('selData');

  const num = (v)=>{
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const t = v.trim().replace(/\s/g,'').replace(',', '.');
      const n = Number(t);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };
  const toPct = (v)=> (v*100);

  function normalizeRows(rows){
    return rows.map(r=>({
      _area: r['Área'] ?? r['Area'] ?? r['area'] ?? r['ARÉA'] ?? r['arEa'],
      _prev: r['Previsto']!=null ? num(r['Previsto']) : (r['Planejado']!=null? num(r['Planejado']) : null),
      _real: r['Real']!=null ? num(r['Real']) : (r['Real2']!=null? num(r['Real2']) : null),
      _mp: r['Masterplan']!=null ? num(r['Masterplan']) : null,
      _custo: r['custo por frente']!=null ? num(r['custo por frente']) : null,
      _data: r['Data'] ?? r['data'] ?? r['DATE'] ?? null,
      _raw: r
    }))
    .filter(r=> r._area);
  }

  function uniqueSorted(arr){ return Array.from(new Set(arr)).filter(v=> v!=null && v!=='').sort(); }

  function buildFilters(rows){
    const areas = uniqueSorted(rows.map(r=> r._area));
    selArea().innerHTML = areas.map(a=>`<option value="${a}">${a}</option>`).join('');

    // Datas: usa coluna Data se existir; senão, usa marcos
    const datesCol = uniqueSorted(rows.map(r=> r._data)).filter(Boolean);
    const marcos = ['Masterplan','Previsto','Real'];
    const values = datesCol.length? datesCol : marcos;
    selData().innerHTML = values.map(v=>`<option value="${v}">${v}</option>`).join('');

    // Seta timeline do 4D
    window._vis4d.init({ rows, uniqueAreas: areas, dates: datesCol });
  }

  function applyFilters(rows){
    const selAreas = Array.from(selArea().selectedOptions).map(o=> o.value);
    const selDate = selData().value || null;

    const filtered = rows.filter(r=> !selAreas.length || selAreas.includes(String(r._area)));

    // Atualiza mosaico 4D
    window._vis4d.applyAreaFilter(selAreas);
    if(selDate) window._vis4d.goTo(selDate);

    return {rows: filtered, selAreas, selDate};
  }

  function updateKPIs(rows){
    const totDir = rows.reduce((s,r)=> s + num(r._raw['Empregados Diretos'] ?? r._raw['Diretos']), 0);
    const totInd = rows.reduce((s,r)=> s + num(r._raw['Empregados Indiretos'] ?? r._raw['Indiretos']), 0);
    const custos = rows.map(r=> num(r._raw['custo por frente'])).filter(v=> v || v===0);
    const mediaCusto = custos.length? custos.reduce((a,b)=>a+b,0)/custos.length : 0;
    const evoSimPct = (function(){
      const ok = rows.filter(r=> typeof (r._raw['evolução maturidade']||'').toString === 'function' ? String(r._raw['evolução maturidade']).toLowerCase()==='sim' : (r._raw['evolução maturidade']||'').toLowerCase?.()==='sim');
      return rows.length? Math.round((ok.length/rows.length)*100) : 0;
    })();

    // Mostra na área de preview por enquanto (ou você pluga em cards separados)
    const txt = `Diretos: ${totDir.toLocaleString('pt-BR')}\n`+
                `Indiretos: ${totInd.toLocaleString('pt-BR')}\n`+
                `Custo/Frente (média): ${mediaCusto.toLocaleString('pt-BR', {maximumFractionDigits:3})}\n`+
                `Evolução (Sim): ${evoSimPct}%`;
    logEl().textContent = txt + "\n\n" + JSON.stringify(rows.slice(0,5).map(r=> r._raw), null, 2);
  }

  // ---- Charts ----
  let chartPRM, chartCurvaS, chartDesvioCusto;

  function renderPRM(rows){
    const byArea = rows;
    const L = byArea.map(r=> r._area);
    const Dprev = byArea.map(r=> toPct(r._prev||0));
    const Dreal = byArea.map(r=> toPct(r._real||0));
    const Dmp = byArea.map(r=> toPct(r._mp||0));

    const ctx = document.getElementById('chartPRM');
    if(chartPRM) chartPRM.destroy();
    chartPRM = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: L,
        datasets: [
          { label: 'Previsto', data: Dprev, backgroundColor: 'rgba(84,174,255,0.7)' },
          { label: 'Real', data: Dreal, backgroundColor: 'rgba(46,164,79,0.7)' },
          { label: 'Masterplan', data: Dmp, backgroundColor: 'rgba(194,151,255,0.7)' }
        ]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { callback: v => v+'%' } } },
        plugins: { tooltip: { callbacks: { label: ctx => ctx.dataset.label+': '+ctx.formattedValue+'%' } } }
      }
    });
  }

  function renderCurvaS(rows, dates){
    // Se houver coluna Data, ordena por data; senão, cria marcos
    let labels = dates && dates.length ? dates.slice(0,12) : ['Masterplan','Previsto','Real'];
    // Simplificação: usa médias por marco
    const avg = (arr)=> arr.length? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    function avgBy(key){ return toPct(avg(rows.map(r=> r[key] || 0))); }

    const dataPrev = []; const dataReal = []; const dataMP = [];
    if (labels.length===3 && labels[0]==='Masterplan'){
      dataPrev.push(null); dataReal.push(null); dataMP.push(avgBy('_mp'));
      dataPrev.push(avgBy('_prev')); dataReal.push(null); dataMP.push(null);
      dataPrev.push(null); dataReal.push(avgBy('_real')); dataMP.push(null);
    } else {
      // Com datas reais não temos séries por data; simulamos curva com médias acumuladas
      for(let i=0;i<labels.length;i++){
        const f = (i+1)/labels.length;
        dataPrev.push( toPct(f * avg(rows.map(r=> r._prev || 0))) );
        dataReal.push( toPct(f * avg(rows.map(r=> r._real || 0))) );
        dataMP.push( toPct(f * avg(rows.map(r=> r._mp || 0))) );
      }
    }

    const ctx = document.getElementById('chartCurvaS');
    if(chartCurvaS) chartCurvaS.destroy();
    chartCurvaS = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Previsto (média)', data: dataPrev, borderColor: '#54aeff', backgroundColor: 'transparent', tension: .25 },
          { label: 'Real (média)', data: dataReal, borderColor: '#2da44e', backgroundColor: 'transparent', tension: .25 },
          { label: 'Masterplan (média)', data: dataMP, borderColor: '#c297ff', backgroundColor: 'transparent', borderDash:[6,4], tension: .25 }
        ]
      },
      options: { responsive: true, scales: { y:{ beginAtZero:true, ticks:{ callback:v=> v+'%' } } } }
    });
  }

  function renderDesvioCusto(rows){
    const pts = rows.map(r=>({
      x: ( (r._real||0) - (r._prev||0) ) * 100, // desvio em pontos percentuais
      y: r._custo || 0,
      area: r._area
    }));
    const ctx = document.getElementById('chartDesvioCusto');
    if(chartDesvioCusto) chartDesvioCusto.destroy();
    chartDesvioCusto = new Chart(ctx, {
      type: 'scatter',
      data: { datasets: [{
        label: 'Desvio (Real - Previsto) vs Custo/Frente',
        data: pts,
        backgroundColor: pts.map(p=> p.x < -5 ? 'rgba(255,217,102,0.9)' : (p.x>5 ? 'rgba(46,164,79,0.8)' : 'rgba(126,231,135,0.8)')),
        borderColor: 'rgba(0,0,0,0.15)'
      }]},
      options: {
        plugins: {
          tooltip: { callbacks: { label: (c)=> `${c.raw.area}: desvio ${c.raw.x.toFixed(1)}pp, custo ${c.raw.y}` } }
        },
        scales: {
          x: { title: {display:true, text:'Desvio (p.p.)'}, ticks:{ callback:v=> v+' pp' } },
          y: { title: {display:true, text:'Custo por frente'} }
        }
      }
    });
  }

  async function boot(){
    try{
      const wb = await loadExcelSmart({ relativePath: 'data/Base 3.xlsx', cacheBust: true });
      const first = wb.SheetNames[0];
      const rows0 = XLSX.utils.sheet_to_json(wb.Sheets[first]);
      const rows = normalizeRows(rows0);

      buildFilters(rows);
      const {rows: fr} = applyFilters(rows);

      updateKPIs(fr);
      renderPRM(fr);
      const dates = Array.from(new Set(rows.map(r=> r._data))).filter(Boolean).sort();
      renderCurvaS(fr, dates);
      renderDesvioCusto(fr);

      document.getElementById('btnReload').onclick = ()=> boot();
      document.getElementById('btnClear').onclick = ()=>{ Array.from(selArea().options).forEach(o=> o.selected=false); selData().selectedIndex=0; boot(); };
      selArea().onchange = ()=>{ const {rows: fr2} = applyFilters(rows); updateKPIs(fr2); renderPRM(fr2); renderDesvioCusto(fr2); };
      selData().onchange = ()=>{ const {rows: fr2} = applyFilters(rows); updateKPIs(fr2); renderPRM(fr2); renderDesvioCusto(fr2); };

    }catch(err){
      logEl().textContent = 'Falha: ' + err.message;
      console.error(err);
    }
  }

  window.addEventListener('load', boot);
})();
