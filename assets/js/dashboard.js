/**
 * ============================================================================
 * DASHBOARD.JS — Estado global, orquestração, navegação e regras de negócio
 * ============================================================================
 * Este é o módulo "maestro": mantém o estado (STATE), calcula o Score
 * Econômico e os agregados financeiros, decide qual página está ativa e
 * chama os módulos especializados (charts.js, tables.js, filters.js) para
 * renderizar cada um. Também contém a inicialização da aplicação (init),
 * que agora busca os dados via ApiClient (api.js) em vez de ler um XLSX.
 * ============================================================================
 */

const PALETA = {
  bg:'#071B2B', card:'#0F2A3E', text:'#F7F5F0', primary:'#D4AF6A',
  green:'#10B981', red:'#EF4444', yellow:'#F0A030', purple:'#8B5CF6', gray:'#9BAAB8'
};

const UF_CORES = ['#D4AF6A','#10B981','#F0A030','#8B5CF6','#EF4444','#06B6D4','#EC4899','#84CC16'];

const STATE = {
  raw: [],            // dados normalizados (sem filtro)
  filtered: [],        // dados após filtros aplicados
  filtrosDisponiveis: {},
  weights: { roi:30, economia:25, dias:20, baaf:15, doc:10, valorQuit:0 },
  charts: {},          // instâncias Chart.js ativas, por id de canvas
  theme: 'dark',
  simCapital: 500000,
  dtRanking: null,
  dtClientes: null,
  hiddenCols: new Set(),
  animEnabled: true,
  apDados: [],          // linhas de Apreensões vindas da API
  apKpis: {},
  apCarregado: false
};

/**
 * NOTA DE ARQUITETURA v1.0: as funções `normalizarLinha` e `calcularScores`
 * que existiam aqui foram REMOVIDAS. O Score Econômico agora é calculado
 * exclusivamente no backend (apps-script/KPIService.gs) — o frontend
 * recebe as linhas já normalizadas e pontuadas prontas em
 * `resposta.tabela`. Ver carregarDados() mais abaixo.
 */

function calcularAgregados(dados){
  const n = dados.length;
  const soma = (f) => dados.reduce((a,d)=>a+f(d), 0);
  const media = (f) => n ? soma(f)/n : 0;
  const quitados = dados.filter(d=>d.quitado);
  const pendentes = dados.filter(d=>!d.quitado);
  const vencidos = dados.filter(d=>d.status==='VENCIDO');
  const baafSim = dados.filter(d=>d.baaf==='Sim');
  const docCompleta = dados.filter(d=>d.doc==='Sim');
  const rois = dados.map(d=>d.roi).filter(v=>isFinite(v));
  const economias = dados.map(d=>d.economia);
  const valores = dados.map(d=>d.valorQuit);
  const ufsUnicas = unique(dados.map(d=>d.uf));

  return {
    n,
    totalClientes: n,
    quitados: quitados.length,
    pendentes: pendentes.length,
    vencidos: vencidos.length,
    baafSim: baafSim.length,
    docCompleta: docCompleta.length,
    fundoTotal: soma(d=>d.fundo),
    saldoTotal: soma(d=>d.saldo),
    valorQuitTotal: soma(d=>d.valorQuit),
    economiaTotal: soma(d=>d.economia),
    economiaMedia: media(d=>d.economia),
    economiaPct: soma(d=>d.saldo) ? soma(d=>d.economia)/soma(d=>d.saldo) : 0,
    roiMedio: rois.length ? rois.reduce((a,b)=>a+b,0)/rois.length : 0,
    roiMax: rois.length ? Math.max(...rois) : 0,
    roiMin: rois.length ? Math.min(...rois) : 0,
    diasMedioVencidos: media(d=>d.diasVencidos),
    maiorEconomia: economias.length ? Math.max(...economias) : 0,
    maiorQuitacao: valores.length ? Math.max(...valores) : 0,
    menorQuitacao: valores.length ? Math.min(...valores.filter(v=>v>0)) || 0 : 0,
    qtdUf: ufsUnicas.length,
    scoreMedio: media(d=>d.score||0),
    capitalNecessario: soma(d=>d.valorQuit),
    capitalRestante: soma(d=>d.saldo) - soma(d=>d.valorQuit),
    valorMedioCliente: media(d=>d.valorQuit),
    capitalInvestido: soma(d=>d.valorQuit),
    capitalRecuperado: soma(d=>d.economia)
  };
}

function kpiCard(icon, color, label, value, tooltip, id){
  return `
  <div class="kpi-card glass animate__animated animate__fadeIn" style="--kpi-color:${color}">
    <div class="kpi-top">
      <div class="kpi-icon"><i class="fa-solid fa-${icon}"></i></div>
    </div>
    <div class="kpi-value" id="${id}">0</div>
    <div class="kpi-label">${label}</div>
    <div class="kpi-tt">${tooltip}</div>
  </div>`;
}

function renderKPIs(){
  const ag = calcularAgregados(STATE.filtered);

  // --- Página Dashboard ---
  document.getElementById('kpiGridMain').innerHTML = [
    kpiCard('users', PALETA.primary, 'Total de Clientes', 0, 'Clientes na base filtrada', 'kMainTotal'),
    kpiCard('circle-check', PALETA.green, 'Clientes Quitados', 0, 'Contratos já quitados', 'kMainQuitados'),
    kpiCard('hourglass-half', PALETA.yellow, 'Clientes Pendentes', 0, 'Aguardando quitação', 'kMainPendentes'),
    kpiCard('triangle-exclamation', PALETA.red, 'Clientes Vencidos', 0, 'Prazo de validade expirado', 'kMainVencidos'),
    kpiCard('file-shield', PALETA.purple, 'BAAF = Sim', 0, 'Clientes com BAAF preenchido', 'kMainBaaf'),
    kpiCard('file-circle-check', PALETA.green, 'Documentação Completa', 0, 'Clientes com docs. 100%', 'kMainDoc'),
    kpiCard('sack-dollar', PALETA.primary, 'Fundo Total', 0, 'Soma do valor de fundo', 'kMainFundo'),
    kpiCard('scale-unbalanced', PALETA.red, 'Saldo Devedor Total', 0, 'Soma dos saldos devedores', 'kMainSaldo'),
    kpiCard('money-check-dollar', PALETA.primary, 'Valor Total p/ Quitação', 0, 'Capital necessário total', 'kMainValorQuit'),
    kpiCard('piggy-bank', PALETA.green, 'Economia Total', 0, 'Economia gerada na carteira', 'kMainEconTotal'),
  ].join('');

  // --- Página Financeiro ---
  document.getElementById('kpiGridFin').innerHTML = [
    kpiCard('piggy-bank', PALETA.green, 'Economia Média', 0, 'Economia média por cliente', 'kFinEconMedia'),
    kpiCard('percent', PALETA.purple, 'Economia %', 0, 'Economia sobre saldo devedor', 'kFinEconPct'),
    kpiCard('chart-line', PALETA.primary, 'ROI Médio', 0, 'Retorno médio (Economia/Quitação)', 'kFinRoiMedio'),
    kpiCard('arrow-up-right-dots', PALETA.green, 'ROI Máximo', 0, 'Maior ROI individual', 'kFinRoiMax'),
    kpiCard('arrow-down-right-dots', PALETA.red, 'ROI Mínimo', 0, 'Menor ROI individual', 'kFinRoiMin'),
    kpiCard('trophy', PALETA.yellow, 'Maior Economia', 0, 'Cliente com maior economia', 'kFinMaiorEcon'),
    kpiCard('coins', PALETA.primary, 'Maior Quitação', 0, 'Maior valor de quitação', 'kFinMaiorQuit'),
    kpiCard('coins', PALETA.gray, 'Menor Quitação', 0, 'Menor valor de quitação', 'kFinMenorQuit'),
    kpiCard('bullseye', PALETA.purple, 'Score Econômico Médio', 0, 'Média do score 0-100', 'kFinScoreMedio'),
    kpiCard('vault', PALETA.primary, 'Capital Necessário', 0, 'Total para quitar a carteira', 'kFinCapNec'),
    kpiCard('wallet', PALETA.green, 'Capital Restante', 0, 'Saldo - Valor de quitação', 'kFinCapRest'),
    kpiCard('receipt', PALETA.gray, 'Valor Médio por Cliente', 0, 'Ticket médio de quitação', 'kFinValorMedio'),
  ].join('');

  // --- Página Operacional ---
  document.getElementById('kpiGridOp').innerHTML = [
    kpiCard('map-location-dot', PALETA.primary, 'Quantidade de UF', 0, 'Estados representados', 'kOpUf'),
    kpiCard('calendar-days', PALETA.yellow, 'Dias Médios Vencidos', 0, 'Média de atraso dos vencidos', 'kOpDias'),
    kpiCard('circle-check', PALETA.green, 'Clientes Quitados', 0, 'Total já quitado', 'kOpQuitados'),
    kpiCard('hourglass-half', PALETA.gray, 'Clientes Pendentes', 0, 'Aguardando ação', 'kOpPendentes'),
  ].join('');

  const set = (id, val, isMoney=false, isPct=false, dec=0) => {
    const el = document.getElementById(id);
    if (el) animateCount(el, val, isMoney, isPct, dec);
  };
  set('kMainTotal', ag.totalClientes);
  set('kMainQuitados', ag.quitados);
  set('kMainPendentes', ag.pendentes);
  set('kMainVencidos', ag.vencidos);
  set('kMainBaaf', ag.baafSim);
  set('kMainDoc', ag.docCompleta);
  set('kMainFundo', ag.fundoTotal, true);
  set('kMainSaldo', ag.saldoTotal, true);
  set('kMainValorQuit', ag.valorQuitTotal, true);
  set('kMainEconTotal', ag.economiaTotal, true);

  set('kFinEconMedia', ag.economiaMedia, true);
  set('kFinEconPct', ag.economiaPct, false, true, 1);
  set('kFinRoiMedio', ag.roiMedio, false, false, 2);
  set('kFinRoiMax', ag.roiMax, false, false, 2);
  set('kFinRoiMin', ag.roiMin, false, false, 2);
  set('kFinMaiorEcon', ag.maiorEconomia, true);
  set('kFinMaiorQuit', ag.maiorQuitacao, true);
  set('kFinMenorQuit', ag.menorQuitacao, true);
  set('kFinScoreMedio', ag.scoreMedio, false, false, 1);
  set('kFinCapNec', ag.capitalNecessario, true);
  set('kFinCapRest', ag.capitalRestante, true);
  set('kFinValorMedio', ag.valorMedioCliente, true);

  set('kOpUf', ag.qtdUf);
  set('kOpDias', ag.diasMedioVencidos, false, false, 0);
  set('kOpQuitados', ag.quitados);
  set('kOpPendentes', ag.pendentes);

  return ag;
}

function abrirDetalheCliente(id){
  const cliente = STATE.raw.find(d => d.id === id);
  if (!cliente){ showToast('Cliente não encontrado.', 'error'); return; }

  document.getElementById('modalClienteNome').textContent = cliente.cliente;
  document.getElementById('modalClienteSub').innerHTML = `
    <span>${cliente.uf}</span> ·
    <span class="status-pill ${cliente.status==='VENCIDO'?'status-vencido':'status-prazo'}">${cliente.status}</span> ·
    <span class="score-badge ${scoreBadgeClass(cliente.classificacao)}">${cliente.classificacao} (${cliente.score.toFixed(1)})</span>
  `;

  const stat = (icon, color, label, value, full=false) => `
    <div class="modal-stat ${full?'full':''}">
      <div class="ms-label"><i class="fa-solid fa-${icon}" style="color:${color}"></i> ${label}</div>
      <div class="ms-value" style="color:${color}">${value}</div>
    </div>`;

  const bodyHtml = `
    <div class="modal-grid">
      ${stat('sack-dollar', PALETA.primary, 'Fundo', fmtMoedaFull(cliente.fundo))}
      ${stat('scale-unbalanced', PALETA.red, 'Saldo Devedor', fmtMoedaFull(cliente.saldo))}
      ${stat('money-check-dollar', PALETA.primary, 'Valor p/ Quitação', fmtMoedaFull(cliente.valorQuit))}
      ${stat('piggy-bank', PALETA.green, 'Economia', fmtMoedaFull(cliente.economia))}
      ${stat('percent', PALETA.purple, '% Atingido', fmtPct(cliente.pct,1))}
      ${stat('car', PALETA.yellow, 'Modelo', cliente.modelo || '—')}
      ${stat('file-shield', cliente.baaf==='Sim'?PALETA.green:PALETA.gray, 'BAAF', cliente.baaf, true)}
    </div>
    ${cliente.obs ? `<div class="modal-obs"><b>Observação da planilha</b>${cliente.obs}</div>` : ''}
  `;
  document.getElementById('modalClienteBody').innerHTML = bodyHtml;
  document.getElementById('clientDetailModal').classList.add('show');
}

function fecharDetalheCliente(){
  document.getElementById('clientDetailModal').classList.remove('show');
}

document.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape') fecharDetalheCliente();
});

function motorSimulacao(capital){
  // Seleciona clientes ordenados por Score Econômico (prioridade ótima) até esgotar o capital
  const candidatos = [...STATE.filtered].filter(x=>!x.quitado).sort((a,b)=>b.score-a.score);
  let usado = 0; const selecionados = [];
  for (const c of candidatos){
    if (usado + c.valorQuit <= capital){
      selecionados.push(c); usado += c.valorQuit;
    }
  }
  const economiaGerada = selecionados.reduce((a,x)=>a+x.economia,0);
  const roiConsolidado = usado>0 ? economiaGerada/usado : 0;
  const scoreMedio = selecionados.length ? selecionados.reduce((a,x)=>a+x.score,0)/selecionados.length : 0;
  const pctMedio = selecionados.length ? selecionados.reduce((a,x)=>a+x.pct,0)/selecionados.length : 0;
  return { selecionados, usado, restante: capital-usado, economiaGerada, roiConsolidado, scoreMedio, pctMedio };
}

function renderSimulador(){
  const capital = STATE.simCapital;
  document.getElementById('simAmountLabel').textContent = fmtMoeda(capital);
  document.getElementById('simSlider').value = capital;
  const r = motorSimulacao(capital);

  document.getElementById('simKpis').innerHTML = [
    kpiCard('users', PALETA.primary, 'Clientes Quitados', 0, 'Selecionados pelo simulador', 'kSimQtd'),
    kpiCard('vault', PALETA.primary, 'Capital Utilizado', 0, 'Total investido na simulação', 'kSimUsado'),
    kpiCard('wallet', PALETA.gray, 'Capital Restante', 0, 'Sobra do capital informado', 'kSimRestante'),
    kpiCard('piggy-bank', PALETA.green, 'Economia Gerada', 0, 'Economia total da seleção', 'kSimEcon'),
    kpiCard('chart-line', PALETA.purple, 'ROI Consolidado', 0, 'Economia / Capital utilizado', 'kSimRoi'),
    kpiCard('bullseye', PALETA.yellow, 'Score Médio', 0, 'Score médio dos selecionados', 'kSimScore'),
    kpiCard('percent', '#06B6D4', '% Quitação Média', 0, 'Média do % Atingido dos clientes recomendados', 'kSimPct'),
  ].join('');
  animateCount(document.getElementById('kSimQtd'), r.selecionados.length);
  animateCount(document.getElementById('kSimUsado'), r.usado, true);
  animateCount(document.getElementById('kSimRestante'), r.restante, true);
  animateCount(document.getElementById('kSimEcon'), r.economiaGerada, true);
  animateCount(document.getElementById('kSimRoi'), r.roiConsolidado, false, false, 2);
  animateCount(document.getElementById('kSimScore'), r.scoreMedio, false, false, 1);
  animateCount(document.getElementById('kSimPct'), r.pctMedio, false, true, 1);

  destroyChart('chartSimCapital');
  STATE.charts.chartSimCapital = new Chart(document.getElementById('chartSimCapital'), {
    type:'doughnut',
    data:{ labels:['Capital Utilizado','Capital Restante'], datasets:[{ data:[r.usado, Math.max(r.restante,0)], backgroundColor:[PALETA.primary, STATE.theme==='dark'?'#1B3A52':'#EDE3CC'], borderWidth:0 }]},
    options:{ responsive:true, maintainAspectRatio:false, cutout:'70%', plugins:{legend:{position:'bottom', labels:{color:chartTheme().tick, font:{size:11}}}, tooltip:commonTooltip()} }
  });

  document.getElementById('simSelCount').textContent = r.selecionados.length;
  const listEl = document.getElementById('simSelList');
  listEl.innerHTML = r.selecionados.length ? r.selecionados.map((x,i)=>`
    <div class="alert-item client-clickable" onclick="abrirDetalheCliente(${x.id})" tabindex="0" role="button" aria-label="Ver detalhes de ${x.cliente}">
      <div class="alert-ic" style="background:rgba(212,175,106,.15); color:var(--primary);">${i+1}</div>
      <div style="flex:1;">
        <b>${x.cliente}</b>
        <p>${x.uf} · Quitação ${fmtMoeda(x.valorQuit)} · Economia ${fmtMoeda(x.economia)} · Score ${x.score.toFixed(1)}</p>
      </div>
      <i class="fa-solid fa-chevron-right client-clickable-chevron"></i>
    </div>`).join('') : '<p style="font-size:12px;color:var(--gray);padding:10px;">Nenhum cliente cabe no capital informado.</p>';
}

function renderAlertas(){
  const d = STATE.filtered;
  const alertas = [];
  const push = (icon, color, titulo, desc) => alertas.push({icon,color,titulo,desc});

  const vencidos180 = d.filter(x=>x.diasVencidos>180);
  if (vencidos180.length) push('clock', PALETA.red, `${vencidos180.length} clientes vencidos há +180 dias`, 'Atraso crítico — priorizar ação imediata.');

  const roiAlto = d.filter(x=>x.roi>5);
  if (roiAlto.length) push('chart-line', PALETA.green, `${roiAlto.length} clientes com ROI > 5x`, 'Excelente retorno financeiro esperado.');

  const econAlta = d.filter(x=>x.economia>100000);
  if (econAlta.length) push('sack-dollar', PALETA.green, `${econAlta.length} clientes com economia > R$ 100 mil`, 'Alto potencial de economia individual.');

  const quitBaixa = d.filter(x=>x.valorQuit>0 && x.valorQuit<20000);
  if (quitBaixa.length) push('coins', PALETA.primary, `${quitBaixa.length} clientes com quitação < R$ 20 mil`, 'Baixo custo — fácil de quitar rapidamente.');

  const docPend = d.filter(x=>x.doc==='Não');
  if (docPend.length) push('file-circle-exclamation', PALETA.yellow, `${docPend.length} clientes com documentação pendente`, 'Regularizar antes da quitação.');

  const baafOk = d.filter(x=>x.baaf==='Sim');
  if (baafOk.length) push('file-shield', PALETA.purple, `${baafOk.length} clientes com BAAF preenchido`, 'Elegíveis para prioridade no motor de score.');

  const maiorScore = [...d].sort((a,b)=>b.score-a.score)[0];
  if (maiorScore) push('bullseye', PALETA.purple, `Maior score: ${maiorScore.cliente}`, `Score ${maiorScore.score.toFixed(1)} — prioridade máxima.`);

  const maiorEcon = [...d].sort((a,b)=>b.economia-a.economia)[0];
  if (maiorEcon) push('trophy', PALETA.green, `Maior economia: ${maiorEcon.cliente}`, `${fmtMoeda(maiorEcon.economia)} de economia potencial.`);

  const maiorRoi = [...d].sort((a,b)=>b.roi-a.roi)[0];
  if (maiorRoi) push('rocket', PALETA.primary, `Maior ROI: ${maiorRoi.cliente}`, `ROI de ${maiorRoi.roi.toFixed(2)}x.`);

  document.getElementById('alertCount').textContent = alertas.length;
  document.getElementById('alertList').innerHTML = alertas.length ? alertas.map(a=>`
    <div class="alert-item">
      <div class="alert-ic" style="background:${a.color}22; color:${a.color};"><i class="fa-solid fa-${a.icon}"></i></div>
      <div><b>${a.titulo}</b><p>${a.desc}</p></div>
    </div>`).join('') : '<p style="font-size:12px;color:var(--gray);">Nenhum alerta para os filtros atuais.</p>';
}

function listaRecomendacao(tipo){
  const d = STATE.filtered;
  switch(tipo){
    case 'prioridade': return [...d].sort((a,b)=>b.score-a.score).slice(0,20).map(x=>({x, val:x.score.toFixed(1), label:'score'}));
    case 'roi': return [...d].sort((a,b)=>b.roi-a.roi).slice(0,20).map(x=>({x, val:x.roi.toFixed(2)+'x', label:'ROI'}));
    case 'economia': return [...d].sort((a,b)=>b.economia-a.economia).slice(0,20).map(x=>({x, val:fmtMoeda(x.economia), label:'economia'}));
    case 'esquecidos': return d.filter(x=>!x.quitado && x.diasVencidos>90 && x.score<40).slice(0,20).map(x=>({x, val:x.diasVencidos+'d', label:'esquecido'}));
    case 'criticos': return d.filter(x=>x.diasVencidos>180).sort((a,b)=>b.diasVencidos-a.diasVencidos).slice(0,20).map(x=>({x, val:x.diasVencidos+'d', label:'crítico'}));
    case 'imediata': return d.filter(x=>!x.quitado && x.baaf==='Sim' && x.doc==='Sim').sort((a,b)=>b.score-a.score).slice(0,20).map(x=>({x, val:x.score.toFixed(1), label:'apto'}));
    case 'docpendente': return d.filter(x=>x.doc==='Não').slice(0,20).map(x=>({x, val:'Pendente', label:'doc'}));
    default: return [];
  }
}

function renderRecomendacoes(tipo='prioridade'){
  const arr = listaRecomendacao(tipo);
  const el = document.getElementById('recoList');
  el.innerHTML = arr.length ? arr.map((item,i)=>`
    <div class="reco-row">
      <div class="reco-pos">${i+1}</div>
      <div class="reco-name">${item.x.cliente}</div>
      <span class="score-badge ${scoreBadgeClass(item.x.classificacao)}">${item.x.classificacao}</span>
      <div class="reco-val" style="color:var(--primary); margin-left:8px;">${item.val}</div>
    </div>`).join('') : '<p style="font-size:12px;color:var(--gray);padding:10px 0;">Nenhum cliente corresponde a este critério.</p>';
}

const WEIGHT_DEFS = [
  {key:'roi', label:'ROI', icon:'percent', color:PALETA.primary},
  {key:'economia', label:'Economia', icon:'sack-dollar', color:PALETA.green},
  {key:'dias', label:'Dias Vencidos', icon:'hourglass-half', color:PALETA.yellow},
  {key:'baaf', label:'BAAF', icon:'file-shield', color:PALETA.purple},
  {key:'doc', label:'Documentação', icon:'file-lines', color:PALETA.red},
  {key:'valorQuit', label:'Valor de Quitação', icon:'coins', color:'#06B6D4',
   hint:'100% prioriza os MENORES valores para quitar · 0% não considera este critério'}
];

function renderWeightRows(){
  const el = document.getElementById('weightRows');
  el.innerHTML = WEIGHT_DEFS.map(w=>`
    <div class="weight-row">
      <label><i class="fa-solid fa-${w.icon}" style="color:${w.color}"></i> ${w.label}${w.hint ? `<i class="fa-solid fa-circle-info" style="color:var(--gray);font-size:10.5px;cursor:help;" title="${w.hint}"></i>` : ''}</label>
      <input type="range" min="0" max="100" value="${STATE.weights[w.key]}" data-key="${w.key}" class="weightSlider">
      <div class="weight-val" id="wval_${w.key}">${STATE.weights[w.key]}%</div>
    </div>`).join('');
  document.querySelectorAll('.weightSlider').forEach(inp=>{
    inp.addEventListener('input', function(){
      document.getElementById('wval_'+this.dataset.key).textContent = this.value+'%';
      updateWeightTotal();
    });
  });
  updateWeightTotal();
}

function updateWeightTotal(){
  let total = 0;
  document.querySelectorAll('.weightSlider').forEach(inp=>{ total += parseInt(inp.value); });
  const el = document.getElementById('weightTotal');
  el.textContent = `Soma dos pesos: ${total}%` + (total===100 ? ' ✓' : ' — ajuste para totalizar 100%');
  el.className = 'weight-total ' + (total===100 ? 'ok' : 'err');
}

async function applyWeights(){
  const total = [...document.querySelectorAll('.weightSlider')].reduce((a,i)=>a+parseInt(i.value),0);
  if (total !== 100){ showToast('A soma dos pesos deve ser exatamente 100%.', 'error'); return; }
  document.querySelectorAll('.weightSlider').forEach(inp=>{ STATE.weights[inp.dataset.key] = parseInt(inp.value); });
  try{
    await carregarDados({ forcarAtualizacao: true });
    showToast('Pesos aplicados! Score recalculado no servidor.', 'success');
  }catch(erro){
    // Mensagem amigável já exibida via evento 'api:erro'.
  }
}

const PAGE_TITLES = {
  dashboard:'Dashboard Executivo', financeiro:'Inteligência Financeira', roi:'Priorização Econômica',
  score:'Score Econômico', simulador:'Simulador de Caixa', ranking:'Ranking de Clientes',
  clientes:'Base de Clientes', operacional:'Análise Operacional', config:'Configurações',
  'ap-geral':'Apreensões — Visão Geral', 'ap-rankings':'Apreensões — Rankings', 'ap-resumo':'Apreensões — Resumo Mensal'
};

let paginaAtiva = 'dashboard';

let setorAtivo = 'quitacoes';

function seguro(fn, rotulo){
  // Executa uma etapa de renderização isolando erros, para que uma falha pontual
  // (ex.: biblioteca de gráfico indisponível) não impeça o restante do dashboard.
  try{ fn(); }
  catch(err){ console.error(`Erro ao renderizar "${rotulo}":`, err); }
}

function renderizarPaginaAtiva(){
  if (setorAtivo === 'apreensoes'){
    switch(paginaAtiva){
      case 'ap-geral': seguro(renderApGeral, 'apreensões — visão geral'); break;
      case 'ap-rankings': seguro(renderApRankings, 'apreensões — rankings'); break;
      case 'ap-resumo': seguro(renderApTabela, 'apreensões — tabela'); break;
    }
    return;
  }
  let ag;
  seguro(()=>{ ag = calcularAgregados(STATE.filtered); }, 'agregados');
  ag = ag || calcularAgregados([]);
  seguro(renderKPIs, 'KPIs');
  seguro(renderAlertas, 'alertas');
  switch(paginaAtiva){
    case 'dashboard':
      seguro(renderChartsDashboard, 'gráficos do dashboard');
      seguro(()=>renderRecomendacoes(document.querySelector('.reco-tab.active')?.dataset.reco || 'prioridade'), 'recomendações');
      break;
    case 'financeiro': seguro(()=>renderChartsFinanceiro(ag), 'gráficos financeiros'); break;
    case 'roi': seguro(renderChartsRoi, 'gráficos ROI/ABC'); break;
    case 'score': seguro(renderPaginaScore, 'score econômico'); break;
    case 'simulador': seguro(renderSimulador, 'simulador'); break;
    case 'ranking': seguro(renderRanking, 'ranking'); break;
    case 'clientes': seguro(renderTabelaClientes, 'tabela de clientes'); break;
    case 'operacional': seguro(renderChartsOperacional, 'análise operacional'); break;
    case 'config': seguro(atualizarPainelConfigApi, 'painel de status da API'); break;
  }
}

function mudarSetor(setor){
  if (setor === setorAtivo) return;
  setorAtivo = setor;
  document.querySelectorAll('.sector-btn').forEach(b=>b.classList.toggle('active', b.dataset.sector===setor));
  document.getElementById('menuQuitacoes').style.display = setor==='quitacoes' ? '' : 'none';
  document.getElementById('menuApreensoes').style.display = setor==='apreensoes' ? '' : 'none';
  const paginaAlvo = setor==='quitacoes' ? 'dashboard' : 'ap-geral';
  if (setor === 'apreensoes' && !STATE.apCarregado) {
    carregarDadosApreensoes().then(() => irParaPagina(paginaAlvo));
  } else {
    irParaPagina(paginaAlvo);
  }
}

function irParaPagina(page){
  paginaAtiva = page;
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.getElementById('page-'+page).classList.add('active');
  document.querySelectorAll('.menu-item').forEach(m=>m.classList.remove('active'));
  document.querySelector(`.menu-item[data-page="${page}"]`).classList.add('active');
  document.getElementById('pageTitle').textContent = PAGE_TITLES[page];
  document.getElementById('content').scrollTop = 0;
  toggleSidebar(false);
  renderizarPaginaAtiva();
}

document.querySelectorAll('.menu-item').forEach(m=>{
  m.addEventListener('click', ()=> irParaPagina(m.dataset.page));
});

document.getElementById('animSwitch').addEventListener('change', function(){ STATE.animEnabled = this.checked; });

/**
 * Botão "Atualizar" do topo: força uma nova busca na API (ignorando o
 * cache local), em vez de apenas reprocessar os dados que já estavam em
 * memória — assim reflete de verdade qualquer alteração feita na planilha.
 */
async function refreshData(){
  try{
    await carregarDados({ forcarAtualizacao: true });
    showToast('Dados sincronizados com o Google Sheets.', 'success');
  }catch(erro){
    // A mensagem amigável já foi exibida pelo listener de 'api:erro' em dashboard.js.
  }
}

document.getElementById('simSlider').addEventListener('input', function(){
  STATE.simCapital = parseInt(this.value);
  document.getElementById('simAmountLabel').textContent = fmtMoeda(STATE.simCapital);
  renderSimulador();
});

document.querySelectorAll('.sim-preset-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    STATE.simCapital = parseInt(btn.dataset.val);
    renderSimulador();
  });
});

document.getElementById('recoTabs').addEventListener('click', e=>{
  const btn = e.target.closest('.reco-tab');
  if (!btn) return;
  document.querySelectorAll('.reco-tab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  renderRecomendacoes(btn.dataset.reco);
});

/**
 * ============================================================================
 * INTEGRAÇÃO COM A API (Google Sheets) — substitui a antiga leitura de XLSX
 * ============================================================================
 */

/**
 * Busca os dados na API (api.js) e alimenta o restante da aplicação.
 * v1.0: a API já devolve a tabela normalizada e pontuada (Score calculado
 * no backend), além de KPIs/gráficos/rankings/curva ABC prontos — este
 * frontend não computa mais nenhuma dessas regras de negócio.
 */
async function carregarDados({ forcarAtualizacao = false } = {}) {
  const resposta = await ApiClient.buscarDados('quitacoes', {
    forcarAtualizacao,
    pesos: STATE.weights
  });
  STATE.raw = resposta.tabela;
  STATE.filtrosDisponiveis = resposta.filtrosDisponiveis || {};
  STATE.apiKpis = resposta.kpis;
  STATE.apiGraficos = resposta.graficos;
  STATE.apiRankings = resposta.rankings;
  STATE.apiCurvaABC = resposta.curvaABC;
  popularFiltros();
  aplicarFiltros();
  return STATE.raw;
}

/** Busca os dados do setor Apreensões (carregado sob demanda, na primeira troca de setor). */
async function carregarDadosApreensoes({ forcarAtualizacao = false } = {}) {
  const resposta = await ApiClient.buscarDados('apreensoes', { forcarAtualizacao });
  STATE.apDados = resposta.tabela;
  STATE.apKpis = resposta.kpis;
  STATE.apCarregado = true;
  return resposta;
}

/** Indicador visual de sincronização no topo (ícone girando + texto). */
function mostrarIndicadorSincronizando(mostrar) {
  const el = document.getElementById('syncIndicator');
  if (el) el.classList.toggle('syncing', mostrar);
}

/** Atualiza o texto "Última sincronização às HH:MM:SS". */
function atualizarTextoUltimaSincronizacao() {
  const ts = ApiClient.getUltimaSincronizacao();
  const el = document.getElementById('lastUpdate');
  if (!el) return;
  el.textContent = ts ? luxon.DateTime.fromJSDate(ts).toFormat('dd/MM/yyyy HH:mm:ss') : '—';
}

/**
 * Banner de erro amigável — fica visível enquanto a última tentativa de
 * sincronização tiver falhado, e some sozinho assim que uma sincronização
 * subsequente for bem-sucedida.
 */
function mostrarBannerErro(mensagem) {
  const banner = document.getElementById('errorBanner');
  if (!banner) { showToast(mensagem, 'error'); return; }
  banner.querySelector('.error-banner-msg').textContent = mensagem;
  banner.classList.add('show');
}
function esconderBannerErro() {
  const banner = document.getElementById('errorBanner');
  if (banner) banner.classList.remove('show');
}

/** Preenche o painel de status da API na página Configurações. */
function atualizarPainelConfigApi() {
  const elUrl = document.getElementById('configApiUrlDisplay');
  const elIntervalo = document.getElementById('configIntervaloSync');
  const elUltima = document.getElementById('configUltimaSync');
  if (elIntervalo) elIntervalo.textContent = Math.round(window.APP_CONFIG.INTERVALO_SINCRONIZACAO_MS / 1000);
  if (elUltima) {
    const ts = ApiClient.getUltimaSincronizacao();
    elUltima.textContent = ts ? luxon.DateTime.fromJSDate(ts).toFormat('dd/MM/yyyy HH:mm:ss') : 'Ainda não sincronizado';
  }
  if (!elUrl) return;
  if (window.APP_CONFIG.API_BASE_URL.includes('COLE_AQUI')) {
    elUrl.textContent = 'Não configurado — edite assets/js/config.js';
    elUrl.style.color = 'var(--red)';
  } else {
    const url = window.APP_CONFIG.API_BASE_URL;
    elUrl.textContent = url.length > 55 ? url.slice(0, 52) + '…' : url;
    elUrl.style.color = 'var(--gray)';
  }
}

function registrarListenersApi() {
  document.addEventListener('api:carregando-inicio', () => mostrarIndicadorSincronizando(true));
  document.addEventListener('api:carregando-fim', () => mostrarIndicadorSincronizando(false));

  document.addEventListener('api:sucesso', (e) => {
    esconderBannerErro();
    atualizarTextoUltimaSincronizacao();
    if (!e.detail.origemCache) {
      // Só re-renderiza a UI quando o dado é realmente novo (não veio do cache local),
      // evitando trabalho de renderização desnecessário.
      renderizarPaginaAtiva();
    }
  });

  document.addEventListener('api:erro', (e) => {
    mostrarBannerErro(e.detail.erro.message);
    console.error('[API]', e.detail.erro.mensagemTecnica || e.detail.erro.message);
  });

  document.getElementById('retryConnectionBtn')?.addEventListener('click', () => {
    esconderBannerErro();
    refreshData();
  });
}

/** Callback compartilhado entre a inicialização e o switch de Configurações. */
function aplicarDadosSincronizados(resposta) {
  STATE.raw = resposta.tabela;
  STATE.filtrosDisponiveis = resposta.filtrosDisponiveis || {};
  STATE.apiKpis = resposta.kpis;
  STATE.apiGraficos = resposta.graficos;
  STATE.apiRankings = resposta.rankings;
  STATE.apiCurvaABC = resposta.curvaABC;
  aplicarFiltros();
}

let pararSincronizacaoAutomatica = null;

/** Liga/desliga a sincronização automática periódica com o Google Sheets. */
function definirSincronizacaoAutomatica(ativa) {
  if (pararSincronizacaoAutomatica) { pararSincronizacaoAutomatica(); pararSincronizacaoAutomatica = null; }
  if (ativa) {
    pararSincronizacaoAutomatica = ApiClient.iniciarSincronizacaoAutomatica('quitacoes', () => ({ pesos: STATE.weights }), aplicarDadosSincronizados);
  }
}

document.getElementById('autoRefreshSwitch')?.addEventListener('change', function(){
  definirSincronizacaoAutomatica(this.checked);
  showToast(this.checked ? 'Sincronização automática ativada.' : 'Sincronização automática pausada — use "Atualizar" para sincronizar manualmente.', 'info');
});

function init(){
  try{
    renderWeightRows();
    registrarListenersApi();
    atualizarPainelConfigApi();

    // Primeira carga: usa cache se existir (navegação rápida), senão busca na API.
    carregarDados({ forcarAtualizacao: false })
      .catch(() => { /* erro já tratado e exibido via evento 'api:erro' */ })
      .finally(() => setTimeout(esconderOverlay, 300));

    // Sincronização automática periódica (Fetch API, sem recarregar a página).
    // Liga por padrão; o switch "Atualização automática" em Configurações controla isso.
    const switchAuto = document.getElementById('autoRefreshSwitch');
    if (switchAuto) switchAuto.checked = true;
    definirSincronizacaoAutomatica(true);
  }catch(err){
    console.error('Falha ao inicializar o dashboard:', err);
    showToast('Ocorreu um erro ao inicializar o dashboard. Verifique o console (F12) para detalhes.', 'error');
  }finally{
    // Rede de segurança: garante que a tela de carregamento NUNCA fique presa
    // para sempre, mesmo que a API demore demais ou algo dê errado silenciosamente.
    setTimeout(esconderOverlay, 8000);
  }
}

window.addEventListener('error', function(e){
  console.error('Erro não tratado:', e.error || e.message);
  esconderOverlay();
});

if (document.readyState === 'loading'){
  window.addEventListener('DOMContentLoaded', init);
}else{
  // Caso o script rode após o DOM já estar pronto (ex.: carregamento tardio de recursos).
  init();
}
