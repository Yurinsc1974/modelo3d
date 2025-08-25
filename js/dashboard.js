// Dashboard básico usando a primeira planilha
(function(){
  const logEl = ()=> document.getElementById('log');
  const statusEl = ()=> document.getElementById('status');
  const num = (v)=>{
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
      const t = v.trim().replace(/\s/g,'').replace(',', '.');
      const n = Number(t);
      return isNaN(n) ? 0 : n;
    }
    return 0;
  };

  async function boot(){
    try{
      statusEl().textContent = 'Carregando planilha…';
      const wb = await loadExcelSmart({ relativePath: 'data/Base 3.xlsx', cacheBust: true });
      const first = wb.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[first]);

      // Preview
      logEl().textContent = JSON.stringify(rows.slice(0,5), null, 2);

      // Mapeia colunas esperadas
      // Ex.: Área, Empregados Diretos, Empregados Indiretos, custo por frente, Previsto, Real, evolução maturidade
      const areas = [];
      const previsto = [];
      const real = [];

      let totDir = 0, totInd = 0, somaCusto = 0, contaCusto = 0, evoSim = 0, totalAreas = 0;

      rows.forEach(r => {
        const area = r['Área'] ?? r['Area'] ?? r['area'];
        const dir = num(r['Empregados Diretos'] ?? r['Diretos']);
        const ind = num(r['Empregados Indiretos'] ?? r['Indiretos']);
        const custo = r['custo por frente'];
        const prev = num(r['Previsto']);
        const rea = num(r['Real']);
        const evo = (r['evolução maturidade'] ?? r['evolucao maturidade'] ?? r['Evolucao'])
                    ;

        if(area){ areas.push(String(area)); previsto.push(prev); real.push(rea); totalAreas++; }
        totDir += dir; totInd += ind;
        const nc = num(custo); if(nc || nc===0){ somaCusto += nc; contaCusto++; }
        if (typeof evo === 'string' && evo.trim().toLowerCase() === 'sim') evoSim++;
      });

      // KPIs
      document.getElementById('kpiDir').textContent = totDir.toLocaleString('pt-BR');
      document.getElementById('kpiInd').textContent = totInd.toLocaleString('pt-BR');
      const mediaCusto = contaCusto ? (somaCusto/contaCusto) : 0;
      document.getElementById('kpiCusto').textContent = mediaCusto.toLocaleString('pt-BR', {maximumFractionDigits: 3});
      const pctEvo = totalAreas ? Math.round((evoSim/totalAreas)*100) : 0;
      document.getElementById('kpiEvo').textContent = pctEvo + '%';

      // Gráfico
      const ctx = document.getElementById('chartPR');
      if (window._chartPR) window._chartPR.destroy();
      window._chartPR = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: areas,
          datasets: [
            { label: 'Previsto', data: previsto, backgroundColor: 'rgba(54, 162, 235, 0.6)' },
            { label: 'Real', data: real, backgroundColor: 'rgba(75, 192, 192, 0.6)' }
          ]
        },
        options: {
          responsive: true,
          scales: {
            y: { beginAtZero: true }
          }
        }
      });

      statusEl().textContent = 'Pronto';
    }catch(err){
      statusEl().textContent = 'Falha: ' + err.message;
      console.error(err);
    }
  }

  window.addEventListener('load', boot);
  document.getElementById('btnReload').addEventListener('click', boot);
})();
