/**
 * ============================================================================
 * CHARTS.JS — Todos os gráficos Chart.js do dashboard
 * ============================================================================
 * Cada página do dashboard tem sua própria função "renderChartsX", chamada
 * pelo orquestrador em dashboard.js sempre que os dados mudam (nova
 * sincronização) ou o usuário navega/filtra.
 * ============================================================================
 */

function destroyChart(id){ if (STATE.charts[id]){ STATE.charts[id].destroy(); delete STATE.charts[id]; } }

function baseChartOptions(extra={}){
  const gridColor = STATE.theme==='dark' ? 'rgba(148,163,184,.1)' : 'rgba(15,23,42,.08)';
  const tickColor = STATE.theme==='dark' ? '#94A3B8' : '#475569';
  return Chart.helpers.mergeIfDefined ? extra : extra;
}

function chartTheme(){
  const dark = STATE.theme==='dark';
  return {
    grid: dark? 'rgba(148,163,184,.10)':'rgba(15,23,42,.08)',
    tick: dark? '#94A3B8':'#475569',
    tooltipBg: dark? '#1E293B':'#ffffff',
    tooltipTxt: dark? '#F8FAFC':'#0F172A'
  };
}

function commonTooltip(){
  const t = chartTheme();
  return { backgroundColor:t.tooltipBg, titleColor:t.tooltipTxt, bodyColor:t.tooltipTxt, borderColor:'rgba(148,163,184,.25)', borderWidth:1, padding:10, cornerRadius:9, titleFont:{weight:'700',size:11.5}, bodyFont:{size:11.5} };
}

function axisStyle(){ const t=chartTheme(); return { grid:{color:t.grid, drawBorder:false}, ticks:{color:t.tick, font:{size:10.5}} }; }

function renderChartsDashboard(){
  const d = STATE.filtered;

  // Saldo x Valor Quitação (top 25 por saldo)
  const top25 = [...d].sort((a,b)=>b.saldo-a.saldo).slice(0,25);
  destroyChart('chartSaldoQuit');
  STATE.charts.chartSaldoQuit = new Chart(document.getElementById('chartSaldoQuit'), {
    type:'bar',
    data:{ labels: top25.map(x=>x.cliente.split(' ').slice(0,2).join(' ')),
      datasets:[
        {label:'Saldo Devedor', data:top25.map(x=>x.saldo), backgroundColor:PALETA.red+'cc', borderRadius:5, maxBarThickness:16},
        {label:'Valor Quitação', data:top25.map(x=>x.valorQuit), backgroundColor:PALETA.primary+'cc', borderRadius:5, maxBarThickness:16}
      ]},
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y',
      plugins:{ legend:{labels:{color:chartTheme().tick, font:{size:11}}}, tooltip:commonTooltip() },
      scales:{ x:axisStyle(), y:{...axisStyle(), ticks:{...axisStyle().ticks, autoSkip:false}} } }
  });

  // Clientes por UF
  const ufCounts = {}; d.forEach(x=>ufCounts[x.uf]=(ufCounts[x.uf]||0)+1);
  const ufLabels = Object.keys(ufCounts);
  destroyChart('chartClientesUF');
  STATE.charts.chartClientesUF = new Chart(document.getElementById('chartClientesUF'), {
    type:'bar',
    data:{ labels: ufLabels, datasets:[{ label:'Clientes', data:ufLabels.map(u=>ufCounts[u]), backgroundColor: ufLabels.map((_,i)=>UF_CORES[i%UF_CORES.length]), borderRadius:8, maxBarThickness:46 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });

  // Pizza Status
  const statusCounts = {}; d.forEach(x=>statusCounts[x.status]=(statusCounts[x.status]||0)+1);
  destroyChart('chartStatusPie');
  STATE.charts.chartStatusPie = new Chart(document.getElementById('chartStatusPie'), {
    type:'doughnut',
    data:{ labels:Object.keys(statusCounts), datasets:[{ data:Object.values(statusCounts), backgroundColor:[PALETA.red, PALETA.green, PALETA.yellow], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{position:'bottom', labels:{color:chartTheme().tick, font:{size:10.5}, boxWidth:9, padding:10}}, tooltip:commonTooltip()} }
  });

  // Pizza BAAF
  const baafCounts = {Sim:0, 'Não':0}; d.forEach(x=>baafCounts[x.baaf]=(baafCounts[x.baaf]||0)+1);
  destroyChart('chartBaafPie');
  STATE.charts.chartBaafPie = new Chart(document.getElementById('chartBaafPie'), {
    type:'doughnut',
    data:{ labels:Object.keys(baafCounts), datasets:[{ data:Object.values(baafCounts), backgroundColor:[PALETA.green, PALETA.gray], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{position:'bottom', labels:{color:chartTheme().tick, font:{size:10.5}, boxWidth:9, padding:10}}, tooltip:commonTooltip()} }
  });

  // Pizza Documentação
  const docCounts = {Sim:0, 'Não':0}; d.forEach(x=>docCounts[x.doc]=(docCounts[x.doc]||0)+1);
  destroyChart('chartDocPie');
  STATE.charts.chartDocPie = new Chart(document.getElementById('chartDocPie'), {
    type:'doughnut',
    data:{ labels:Object.keys(docCounts), datasets:[{ data:Object.values(docCounts), backgroundColor:[PALETA.purple, PALETA.gray], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{position:'bottom', labels:{color:chartTheme().tick, font:{size:10.5}, boxWidth:9, padding:10}}, tooltip:commonTooltip()} }
  });
}

function drawGauge(canvasId, valorPct, color){
  destroyChart(canvasId);
  STATE.charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type:'doughnut',
    data:{ datasets:[{ data:[valorPct, 100-valorPct], backgroundColor:[color, STATE.theme==='dark'?'#1B3A52':'#EDE3CC'], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, circumference:180, rotation:270, cutout:'75%', plugins:{legend:{display:false}, tooltip:{enabled:false}} }
  });
}

function renderChartsFinanceiro(ag){
  drawGauge('gaugeROI', Math.min(ag.roiMedio*20,100), PALETA.primary);
  document.getElementById('gaugeROIVal').innerHTML = `<b>${ag.roiMedio.toFixed(2)}x</b><span>ROI médio</span>`;
  drawGauge('gaugeEconomia', Math.min((ag.economiaMedia/50000)*100,100), PALETA.green);
  document.getElementById('gaugeEconomiaVal').innerHTML = `<b>${fmtMoeda(ag.economiaMedia)}</b><span>Economia média</span>`;
  drawGauge('gaugeScore', ag.scoreMedio, PALETA.purple);
  document.getElementById('gaugeScoreVal').innerHTML = `<b>${ag.scoreMedio.toFixed(1)}</b><span>Score médio</span>`;

  const d = [...STATE.filtered].sort((a,b)=>(a.dataPrevista||'9999').localeCompare(b.dataPrevista||'9999'));
  let acumEcon = 0, acumCap = 0;
  const labels = d.map((x,i)=>`#${i+1}`);
  const econAcum = d.map(x=>{ acumEcon += x.economia; return acumEcon; });
  const capAcum = d.map(x=>{ acumCap += x.valorQuit; return acumCap; });

  destroyChart('chartEconAcum');
  STATE.charts.chartEconAcum = new Chart(document.getElementById('chartEconAcum'), {
    type:'line',
    data:{ labels, datasets:[{ label:'Economia Acumulada', data:econAcum, borderColor:PALETA.green, backgroundColor:PALETA.green+'22', fill:true, tension:.35, pointRadius:0, borderWidth:2.5 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:{...axisStyle(), ticks:{...axisStyle().ticks, maxTicksLimit:8}}, y:axisStyle()} }
  });
  destroyChart('chartCapitalInvest');
  STATE.charts.chartCapitalInvest = new Chart(document.getElementById('chartCapitalInvest'), {
    type:'line',
    data:{ labels, datasets:[{ label:'Capital Investido', data:capAcum, borderColor:PALETA.primary, backgroundColor:PALETA.primary+'22', fill:true, tension:.35, pointRadius:0, borderWidth:2.5 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:{...axisStyle(), ticks:{...axisStyle().ticks, maxTicksLimit:8}}, y:axisStyle()} }
  });

  // Economia por UF
  const ufEcon = {}; STATE.filtered.forEach(x=>ufEcon[x.uf]=(ufEcon[x.uf]||0)+x.economia);
  const ufKeys = Object.keys(ufEcon);
  destroyChart('chartEconUF');
  STATE.charts.chartEconUF = new Chart(document.getElementById('chartEconUF'), {
    type:'bar',
    data:{ labels:ufKeys, datasets:[{ label:'Economia', data:ufKeys.map(u=>ufEcon[u]), backgroundColor:ufKeys.map((_,i)=>UF_CORES[i%UF_CORES.length]), borderRadius:8, maxBarThickness:50 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });

  // Radar indicadores financeiros (normalizado 0-100)
  const norm = (v, max) => max? Math.min((v/max)*100,100) : 0;
  const maxRoi = Math.max(...STATE.filtered.map(x=>x.roi),0.01);
  const maxEcon = Math.max(...STATE.filtered.map(x=>x.economia),0.01);
  destroyChart('chartRadarFin');
  STATE.charts.chartRadarFin = new Chart(document.getElementById('chartRadarFin'), {
    type:'radar',
    data:{ labels:['ROI','Economia %','Score','Documentação','BAAF','Capital Recuperado'],
      datasets:[{ label:'Carteira Atual', data:[
        norm(ag.roiMedio, maxRoi), ag.economiaPct*100, ag.scoreMedio,
        ag.n? (ag.docCompleta/ag.n)*100:0, ag.n? (ag.baafSim/ag.n)*100:0,
        ag.saldoTotal? (ag.capitalRecuperado/ag.saldoTotal)*100:0
      ], backgroundColor:PALETA.purple+'33', borderColor:PALETA.purple, borderWidth:2, pointBackgroundColor:PALETA.purple }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()},
      scales:{ r:{ angleLines:{color:chartTheme().grid}, grid:{color:chartTheme().grid}, pointLabels:{color:chartTheme().tick, font:{size:10.5}}, ticks:{display:false, backdropColor:'transparent'} } } }
  });

  renderHeatmaps();
}

function renderHeatmaps(){
  const ufData = {};
  STATE.filtered.forEach(x=>{ if(!ufData[x.uf]) ufData[x.uf]={econ:0, qtd:0}; ufData[x.uf].econ+=x.economia; ufData[x.uf].qtd+=1; });
  const ufs = Object.keys(ufData);
  const maxEcon = Math.max(...ufs.map(u=>ufData[u].econ), 1);
  const maxQtd = Math.max(...ufs.map(u=>ufData[u].qtd), 1);

  const heatEcon = document.getElementById('heatmapEcon');
  heatEcon.style.gridTemplateColumns = `repeat(${Math.min(ufs.length,4)}, 1fr)`;
  heatEcon.innerHTML = ufs.map(u=>{
    const intensity = ufData[u].econ/maxEcon;
    const bg = `rgba(16,185,129,${0.25+intensity*0.65})`;
    return `<div class="heat-cell" style="background:${bg}">${u}<br><small style="font-weight:600;">${fmtMoeda(ufData[u].econ)}</small></div>`;
  }).join('');

  const heatQtd = document.getElementById('heatmapQtd');
  heatQtd.style.gridTemplateColumns = `repeat(${Math.min(ufs.length,4)}, 1fr)`;
  heatQtd.innerHTML = ufs.map(u=>{
    const intensity = ufData[u].qtd/maxQtd;
    const bg = `rgba(37,99,235,${0.25+intensity*0.65})`;
    return `<div class="heat-cell" style="background:${bg}">${u}<br><small style="font-weight:600;">${ufData[u].qtd} clientes</small></div>`;
  }).join('');
}

function renderChartsRoi(){
  const d = STATE.filtered;

  destroyChart('scatterValorEcon');
  STATE.charts.scatterValorEcon = new Chart(document.getElementById('scatterValorEcon'), {
    type:'scatter',
    data:{ datasets:[{ label:'Clientes', data:d.map(x=>({x:x.valorQuit, y:x.economia, cliente:x.cliente})), backgroundColor:PALETA.primary+'aa', pointRadius:5, pointHoverRadius:7 }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...commonTooltip(), callbacks:{ label:(ctx)=>`${ctx.raw.cliente}: ${fmtMoeda(ctx.raw.x)} → ${fmtMoeda(ctx.raw.y)}` } } },
      scales:{ x:{...axisStyle(), title:{display:true, text:'Valor Quitação', color:chartTheme().tick}}, y:{...axisStyle(), title:{display:true, text:'Economia', color:chartTheme().tick}} } }
  });

  destroyChart('scatterRoiDias');
  STATE.charts.scatterRoiDias = new Chart(document.getElementById('scatterRoiDias'), {
    type:'scatter',
    data:{ datasets:[{ label:'Clientes', data:d.map(x=>({x:x.diasVencidos, y:x.roi, cliente:x.cliente})), backgroundColor:PALETA.red+'aa', pointRadius:5, pointHoverRadius:7 }]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{...commonTooltip(), callbacks:{ label:(ctx)=>`${ctx.raw.cliente}: ${ctx.raw.x}d → ROI ${ctx.raw.y.toFixed(2)}x` } } },
      scales:{ x:{...axisStyle(), title:{display:true, text:'Dias Vencidos', color:chartTheme().tick}}, y:{...axisStyle(), title:{display:true, text:'ROI', color:chartTheme().tick}} } }
  });

  renderCurvaABC();
  renderTreemapEconomia();
  renderTop20('top20Econ', [...d].sort((a,b)=>b.economia-a.economia).slice(0,20), x=>fmtMoeda(x.economia), PALETA.green);
  renderTop20('top20Roi', [...d].sort((a,b)=>b.roi-a.roi).slice(0,20), x=>x.roi.toFixed(2)+'x', PALETA.primary);
}

function renderCurvaABC(){
  const d = [...STATE.filtered].sort((a,b)=>b.economia-a.economia);
  const total = d.reduce((a,x)=>a+x.economia,0) || 1;
  let acum = 0;
  const pctAcum = d.map(x=>{ acum += x.economia; return (acum/total)*100; });
  d.forEach((x,i)=>{ x._classeABC = pctAcum[i] <= 80 ? 'A' : pctAcum[i] <= 95 ? 'B' : 'C'; });

  destroyChart('chartABC');
  STATE.charts.chartABC = new Chart(document.getElementById('chartABC'), {
    data:{ labels:d.map((x,i)=>i+1),
      datasets:[
        { type:'bar', label:'Economia', data:d.map(x=>x.economia), backgroundColor:d.map(x=>x._classeABC==='A'?PALETA.green:x._classeABC==='B'?PALETA.yellow:PALETA.gray), order:2, yAxisID:'y' },
        { type:'line', label:'% Acumulado', data:pctAcum, borderColor:PALETA.primary, borderWidth:2.5, pointRadius:0, yAxisID:'y1', order:1, tension:.2 }
      ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{labels:{color:chartTheme().tick, font:{size:11}}}, tooltip:commonTooltip() },
      scales:{ x:{...axisStyle(), ticks:{...axisStyle().ticks, display:false}}, y:{...axisStyle(), position:'left'}, y1:{ position:'right', min:0, max:100, grid:{display:false}, ticks:{color:chartTheme().tick, callback:v=>v+'%'} } } }
  });

  const classA = d.filter(x=>x._classeABC==='A'), classB = d.filter(x=>x._classeABC==='B'), classC = d.filter(x=>x._classeABC==='C');
  document.getElementById('abcClassA').textContent = classA.length + ' clientes';
  document.getElementById('abcClassB').textContent = classB.length + ' clientes';
  document.getElementById('abcClassC').textContent = classC.length + ' clientes';
  const cardHtml = (arr) => `Economia: <b style="color:var(--text)">${fmtMoeda(arr.reduce((a,x)=>a+x.economia,0))}</b><br>Participação: <b style="color:var(--text)">${d.length? ((arr.length/d.length)*100).toFixed(1):0}%</b>`;
  document.getElementById('abcCardA').innerHTML = cardHtml(classA);
  document.getElementById('abcCardB').innerHTML = cardHtml(classB);
  document.getElementById('abcCardC').innerHTML = cardHtml(classC);
}

function renderTreemapEconomia(){
  const d = [...STATE.filtered].sort((a,b)=>b.economia-a.economia).slice(0,15);
  const total = d.reduce((a,x)=>a+x.economia,0) || 1;
  const cores = [PALETA.primary, PALETA.green, PALETA.purple, PALETA.yellow, PALETA.red];
  const el = document.getElementById('treemapEcon');
  el.innerHTML = d.map((x,i)=>{
    const pct = x.economia/total;
    const flexBasis = Math.max(pct*600, 70);
    const h = i<3 ? 130 : 80;
    return `<div class="tree-cell" style="flex:${flexBasis} 1 ${flexBasis}px; height:${h}px; background:${cores[i%cores.length]}cc;">
      ${x.cliente.split(' ').slice(0,2).join(' ')}<small>${fmtMoeda(x.economia)}</small></div>`;
  }).join('');
}

function renderTop20(elId, arr, valFn, color){
  const el = document.getElementById(elId);
  if (!arr.length){ el.innerHTML = '<p style="font-size:12px;color:var(--gray);padding:10px 0;">Sem dados para o filtro atual.</p>'; return; }
  el.innerHTML = arr.map((x,i)=>`
    <div class="reco-row">
      <div class="reco-pos">${i+1}</div>
      <div class="reco-name">${x.cliente}</div>
      <div style="font-size:10.5px;color:var(--gray);width:32px;">${x.uf}</div>
      <div class="reco-val" style="color:${color}">${valFn(x)}</div>
    </div>`).join('');
}

function renderPaginaScore(){
  const d = STATE.filtered;
  const classes = ['Muito Alta','Alta','Média','Baixa','Muito Baixa'];
  const counts = classes.map(c=>d.filter(x=>x.classificacao===c).length);
  const cores = [PALETA.green,'#60a5fa',PALETA.yellow,'#fb923c',PALETA.red];
  destroyChart('chartScoreDist');
  STATE.charts.chartScoreDist = new Chart(document.getElementById('chartScoreDist'), {
    type:'bar',
    data:{ labels:classes, datasets:[{ label:'Clientes', data:counts, backgroundColor:cores, borderRadius:8, maxBarThickness:60 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });
  renderTop20('top20Score', [...d].sort((a,b)=>b.score-a.score).slice(0,20), x=>x.score.toFixed(1), PALETA.purple);
  renderTop20('top20Dias', [...d].sort((a,b)=>b.diasVencidos-a.diasVencidos).slice(0,20), x=>x.diasVencidos+' dias', PALETA.red);
}

function renderChartsOperacional(){
  const d = STATE.filtered;

  const porData = {};
  d.filter(x=>x.dataQuitacao).forEach(x=>{ const m = x.dataQuitacao.slice(0,7); porData[m]=(porData[m]||0)+1; });
  const meses = Object.keys(porData).sort();
  destroyChart('chartEvolucao');
  STATE.charts.chartEvolucao = new Chart(document.getElementById('chartEvolucao'), {
    type:'line',
    data:{ labels:meses.length?meses:['Sem quitações registradas'], datasets:[{ label:'Quitações', data:meses.length?meses.map(m=>porData[m]):[0], borderColor:PALETA.green, backgroundColor:PALETA.green+'22', fill:true, tension:.3, pointRadius:4, pointBackgroundColor:PALETA.green }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });

  const quitados = d.filter(x=>x.quitado).length, pendentes = d.filter(x=>!x.quitado).length;
  destroyChart('chartQuitPend');
  STATE.charts.chartQuitPend = new Chart(document.getElementById('chartQuitPend'), {
    type:'bar',
    data:{ labels:['Quitados','Pendentes'], datasets:[{ data:[quitados,pendentes], backgroundColor:[PALETA.green, PALETA.yellow], borderRadius:9, maxBarThickness:70 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });

  const modeloCounts = {}; d.forEach(x=>modeloCounts[x.modelo]=(modeloCounts[x.modelo]||0)+1);
  destroyChart('chartModelo');
  STATE.charts.chartModelo = new Chart(document.getElementById('chartModelo'), {
    type:'polarArea',
    data:{ labels:Object.keys(modeloCounts), datasets:[{ data:Object.values(modeloCounts), backgroundColor:[PALETA.primary+'bb',PALETA.green+'bb',PALETA.purple+'bb',PALETA.yellow+'bb',PALETA.red+'bb'] }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom', labels:{color:chartTheme().tick, font:{size:10.5}, boxWidth:9}}, tooltip:commonTooltip()},
      scales:{ r:{ ticks:{display:false, backdropColor:'transparent'}, grid:{color:chartTheme().grid}, angleLines:{color:chartTheme().grid} } } }
  });

  const bins = [0,30,60,90,180,365];
  const binLabels = ['0-30','31-60','61-90','91-180','180+'];
  const binCounts = new Array(binLabels.length).fill(0);
  d.filter(x=>x.diasVencidos>0).forEach(x=>{
    for (let i=0;i<bins.length-1;i++){ if (x.diasVencidos>bins[i] && x.diasVencidos<=bins[i+1]){ binCounts[i]++; return; } }
    if (x.diasVencidos>365) binCounts[binCounts.length-1]++;
  });
  destroyChart('chartDiasVencidos');
  STATE.charts.chartDiasVencidos = new Chart(document.getElementById('chartDiasVencidos'), {
    type:'bar',
    data:{ labels:binLabels, datasets:[{ label:'Clientes', data:binCounts, backgroundColor:PALETA.red+'cc', borderRadius:8, maxBarThickness:60 }]},
    options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });
}

/* =========================================================================
   MÓDULO: SETOR APREENSÕES — KPIs, gráficos e tabela
   ========================================================================= */
function renderApGeral(){
  const d = STATE.apDados;
  const k = STATE.apKpis;

  document.getElementById('apKpiGrid').innerHTML = [
    kpiCard('users', PALETA.primary, 'Total de Clientes', 0, 'Registros na base de apreensões', 'apKTotal'),
    kpiCard('file-signature', PALETA.green, 'Termo Assinado', 0, 'Clientes que assinaram o termo', 'apKTermo'),
    kpiCard('sack-dollar', PALETA.green, 'Total Valores Pagos', 0, 'Soma dos valores pagos', 'apKPago'),
    kpiCard('hourglass-half', PALETA.yellow, 'Total de Pendências', 0, 'Soma das pendências', 'apKPendencia'),
    kpiCard('triangle-exclamation', PALETA.red, 'Total de Multa', 0, 'Soma das multas', 'apKMulta'),
    kpiCard('receipt', PALETA.primary, 'Valor a Ressarcir', 0, 'Soma a ser ressarcido', 'apKRessarcir'),
  ].join('');

  const set = (id, val, isMoney=false) => { const el = document.getElementById(id); if (el) animateCount(el, val, isMoney); };
  set('apKTotal', k.totalClientes);
  set('apKTermo', k.termoAssinado);
  set('apKPago', k.valorPagoTotal, true);
  set('apKPendencia', k.pendenciaTotal, true);
  set('apKMulta', k.multaTotal, true);
  set('apKRessarcir', k.valorRessarcirTotal, true);

  // Apreensões por estado
  const porUF = {};
  d.forEach(x => { porUF[x.uf] = (porUF[x.uf]||0) + 1; });
  const ufs = Object.keys(porUF).sort((a,b) => porUF[b]-porUF[a]);
  destroyChart('apChartPorUF');
  STATE.charts.apChartPorUF = new Chart(document.getElementById('apChartPorUF'), {
    type: 'bar',
    data: { labels: ufs, datasets: [{ label: 'Apreensões', data: ufs.map(u=>porUF[u]), backgroundColor: UF_CORES, borderRadius: 8, maxBarThickness: 50 }] },
    options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:axisStyle(), y:axisStyle()} }
  });

  // Termo assinado (pizza)
  const assinado = d.filter(x=>x.termoAssinado).length;
  const naoAssinado = d.length - assinado;
  destroyChart('apChartTermo');
  STATE.charts.apChartTermo = new Chart(document.getElementById('apChartTermo'), {
    type: 'doughnut',
    data: { labels:['Assinado','Não assinado'], datasets:[{ data:[assinado, naoAssinado], backgroundColor:[PALETA.green, PALETA.gray], borderWidth:0 }] },
    options: { responsive:true, maintainAspectRatio:false, cutout:'68%', plugins:{legend:{position:'bottom', labels:{color:chartTheme().tick, font:{size:10.5}, boxWidth:9}}, tooltip:commonTooltip()} }
  });
}

function renderApRankings(){
  const d = STATE.apDados;

  const porBanco = {};
  d.forEach(x => { porBanco[x.banco] = (porBanco[x.banco]||0) + 1; });
  const bancos = Object.keys(porBanco).sort((a,b) => porBanco[b]-porBanco[a]).slice(0,10);
  destroyChart('apChartRankBanco');
  STATE.charts.apChartRankBanco = new Chart(document.getElementById('apChartRankBanco'), {
    type: 'bar',
    data: { labels: bancos, datasets: [{ label:'Apreensões', data: bancos.map(b=>porBanco[b]), backgroundColor: PALETA.primary, borderRadius:8, maxBarThickness:36 }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}, tooltip:commonTooltip()}, scales:{x:{...axisStyle(), beginAtZero:true}, y:{grid:{display:false}, ticks:{...axisStyle().ticks, font:{size:11.5,weight:'700'}}}} }
  });

  const top = [...d].filter(x=>x.valorRessarcir>0).sort((a,b)=>b.valorRessarcir-a.valorRessarcir).slice(0,12);
  destroyChart('apChartTopRessarcir');
  STATE.charts.apChartTopRessarcir = new Chart(document.getElementById('apChartTopRessarcir'), {
    type: 'bar',
    data: { labels: top.map(x=>x.cliente.split(' ').slice(0,2).join(' ')), datasets: [{ label:'A Ressarcir', data: top.map(x=>x.valorRessarcir), backgroundColor: PALETA.yellow, borderRadius:7, maxBarThickness:20 }] },
    options: { responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}, tooltip:{...commonTooltip(), callbacks:{title:(items)=>top[items[0].dataIndex].cliente, label:(ctx)=>' '+fmtMoeda(ctx.parsed.x)}}}, scales:{x:axisStyle(), y:{grid:{display:false}, ticks:{...axisStyle().ticks, font:{size:10.5}}}} }
  });
}

function renderApTabela(){
  const d = STATE.apDados;
  document.getElementById('apTableBody').innerHTML = d.map(x => `
    <tr>
      <td>${x.cliente}</td>
      <td>${x.uf}</td>
      <td><span class="tag-banco">${x.banco}</span></td>
      <td><span class="status-pill ${x.termoAssinado?'pill-sim':'pill-nao'}">${x.termoAssinado?'Sim':'Não'}</span></td>
      <td class="mono">${fmtMoeda(x.valorPago)}</td>
      <td class="mono">${fmtMoeda(x.pendencia)}</td>
      <td class="mono">${fmtMoeda(x.multa)}</td>
      <td class="mono">${fmtMoeda(x.valorRessarcir)}</td>
    </tr>`).join('') || `<tr><td colspan="8" style="padding:20px;color:var(--gray);text-align:center;">Nenhum registro encontrado.</td></tr>`;
}
