/**
 * ============================================================================
 * FILTERS.JS — Barra de filtros globais do Dashboard Executivo
 * ============================================================================
 * As opções de UF, Modelo e Status vêm prontas do backend
 * (STATE.filtrosDisponiveis, calculado em DashboardService.gs) — o
 * frontend não decide mais quais valores existem na planilha, só exibe.
 *
 * A filtragem em si continua acontecendo no navegador, sobre as linhas que
 * o backend já validou/normalizou/pontuou — garante resposta instantânea
 * ao usuário (Regra 12: carregamento e interação abaixo de 3 segundos),
 * sem reinventar nenhuma regra de negócio (os valores de cada linha — Score,
 * ROI, dias vencidos — já vieram prontos da API).
 * ============================================================================
 */

function renderFiltersBar(){
  const disponiveis = STATE.filtrosDisponiveis || {};
  const ufs = disponiveis.estados || unique(STATE.raw.map(d=>d.uf));
  const modelos = disponiveis.modelos || unique(STATE.raw.map(d=>d.modelo));
  const statuses = disponiveis.status || unique(STATE.raw.map(d=>d.status));
  const clientes = unique(STATE.raw.map(d=>d.cliente));

  const html = `
  <div class="filters-bar glass">
    <div class="filters-grid">
      <div class="filter-group"><label>UF</label><select id="fUf"><option value="">Todas</option>${ufs.map(u=>`<option value="${u}">${u}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Modelo</label><select id="fModelo"><option value="">Todos</option>${modelos.map(m=>`<option value="${m}">${m}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Cliente</label><select id="fCliente"><option value="">Todos</option>${clientes.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="filter-group"><label>Status</label><select id="fStatus"><option value="">Todos</option>${statuses.map(s=>`<option value="${s}">${s}</option>`).join('')}</select></div>
      <div class="filter-group"><label>BAAF</label><select id="fBaaf"><option value="">Todos</option><option value="Sim">Sim</option><option value="Não">Não</option></select></div>
      <div class="filter-group"><label>Documentação</label><select id="fDoc"><option value="">Todas</option><option value="Sim">Sim</option><option value="Não">Não</option></select></div>
      <div class="filter-group"><label>Quitado</label><select id="fQuitado"><option value="">Todos</option><option value="sim">Sim</option><option value="nao">Não</option></select></div>
      <div class="filter-group range"><div><label>ROI mín.</label><input type="number" id="fRoiMin" placeholder="0" step="0.1"></div><div><label>ROI máx.</label><input type="number" id="fRoiMax" placeholder="∞" step="0.1"></div></div>
      <div class="filter-group range"><div><label>Economia mín.</label><input type="number" id="fEconMin" placeholder="R$ 0"></div><div><label>Economia máx.</label><input type="number" id="fEconMax" placeholder="R$ ∞"></div></div>
      <div class="filter-group range"><div><label>Quitação mín.</label><input type="number" id="fValMin" placeholder="R$ 0"></div><div><label>Quitação máx.</label><input type="number" id="fValMax" placeholder="R$ ∞"></div></div>
      <div class="filter-group range"><div><label>Saldo mín.</label><input type="number" id="fSaldoMin" placeholder="R$ 0"></div><div><label>Saldo máx.</label><input type="number" id="fSaldoMax" placeholder="R$ ∞"></div></div>
      <div class="filter-group range"><div><label>% Atingido mín.</label><input type="number" id="fPctMin" placeholder="0" step="1"></div><div><label>% Atingido máx.</label><input type="number" id="fPctMax" placeholder="100" step="1"></div></div>
      <div class="filter-group range"><div><label>Dias vencidos mín.</label><input type="number" id="fDiasMin" placeholder="0"></div><div><label>Dias vencidos máx.</label><input type="number" id="fDiasMax" placeholder="∞"></div></div>
      <div class="filter-group"><label>Período — Data prevista (de)</label><input type="date" id="fDataPrevDe"></div>
      <div class="filter-group"><label>Período — Data prevista (até)</label><input type="date" id="fDataPrevAte"></div>
      <div class="filter-group"><label><i class="fa-solid fa-magnifying-glass" style="margin-right:4px;"></i>Pesquisar cliente</label><input type="text" id="fBusca" placeholder="Digite o nome do cliente..."></div>
      <div class="filter-group"><label><i class="fa-solid fa-arrow-down-wide-short" style="margin-right:4px;"></i>Ordenar por</label>
        <select id="fOrdenar">
          <option value="">Padrão (sem ordenação)</option>
          <option value="clienteAsc">Nome do Cliente (A-Z)</option>
          <option value="clienteDesc">Nome do Cliente (Z-A)</option>
          <option value="diasDesc">Mais tempo vencido primeiro</option>
          <option value="diasAsc">Menos tempo vencido primeiro</option>
          <option value="valorQuitDesc">Maior valor para quitação</option>
          <option value="valorQuitAsc">Menor valor para quitação</option>
          <option value="pctDesc">Maior % atingido</option>
          <option value="pctAsc">Menor % atingido</option>
          <option value="economiaDesc">Maior economia</option>
          <option value="roiDesc">Maior ROI</option>
          <option value="scoreDesc">Maior Score Econômico</option>
        </select>
      </div>
    </div>
    <div class="filters-footer">
      <div id="filterCount">Exibindo <b>0</b> de <b>0</b> clientes</div>
      <button class="btn-clear" onclick="limparFiltros()"><i class="fa-solid fa-broom"></i> Limpar Filtros</button>
    </div>
  </div>`;
  document.getElementById('filtersBar').innerHTML = html;
  const ids = ['fUf','fModelo','fCliente','fStatus','fBaaf','fDoc','fQuitado','fRoiMin','fRoiMax','fEconMin','fEconMax','fValMin','fValMax','fSaldoMin','fSaldoMax','fPctMin','fPctMax','fDiasMin','fDiasMax','fDataPrevDe','fDataPrevAte','fBusca','fOrdenar'];
  ids.forEach(id=>{
    const el = document.getElementById(id);
    el.addEventListener('input', debounce(aplicarFiltros, 250));
    el.addEventListener('change', aplicarFiltros);
  });
}

function popularFiltros(){ renderFiltersBar(); }

function aplicarFiltros(){
  const g = id => document.getElementById(id);
  const uf = g('fUf')?.value, modelo = g('fModelo')?.value, cliente = g('fCliente')?.value, status = g('fStatus')?.value;
  const baaf = g('fBaaf')?.value, doc = g('fDoc')?.value, quitado = g('fQuitado')?.value;
  const roiMin = parseFloat(g('fRoiMin')?.value), roiMax = parseFloat(g('fRoiMax')?.value);
  const econMin = parseFloat(g('fEconMin')?.value), econMax = parseFloat(g('fEconMax')?.value);
  const valMin = parseFloat(g('fValMin')?.value), valMax = parseFloat(g('fValMax')?.value);
  const saldoMin = parseFloat(g('fSaldoMin')?.value), saldoMax = parseFloat(g('fSaldoMax')?.value);
  const pctMin = parseFloat(g('fPctMin')?.value), pctMax = parseFloat(g('fPctMax')?.value);
  const diasMin = parseFloat(g('fDiasMin')?.value), diasMax = parseFloat(g('fDiasMax')?.value);
  const dataDe = g('fDataPrevDe')?.value, dataAte = g('fDataPrevAte')?.value;
  const busca = (g('fBusca')?.value || '').toUpperCase().trim();
  const ordenar = g('fOrdenar')?.value || '';

  STATE.filtered = STATE.raw.filter(d=>{
    if (uf && d.uf!==uf) return false;
    if (modelo && d.modelo!==modelo) return false;
    if (cliente && d.cliente!==cliente) return false;
    if (status && d.status!==status) return false;
    if (baaf && d.baaf!==baaf) return false;
    if (doc && d.doc!==doc) return false;
    if (quitado==='sim' && !d.quitado) return false;
    if (quitado==='nao' && d.quitado) return false;
    if (!isNaN(roiMin) && d.roi < roiMin) return false;
    if (!isNaN(roiMax) && d.roi > roiMax) return false;
    if (!isNaN(econMin) && d.economia < econMin) return false;
    if (!isNaN(econMax) && d.economia > econMax) return false;
    if (!isNaN(valMin) && d.valorQuit < valMin) return false;
    if (!isNaN(valMax) && d.valorQuit > valMax) return false;
    if (!isNaN(saldoMin) && d.saldo < saldoMin) return false;
    if (!isNaN(saldoMax) && d.saldo > saldoMax) return false;
    if (!isNaN(pctMin) && d.pct*100 < pctMin) return false;
    if (!isNaN(pctMax) && d.pct*100 > pctMax) return false;
    if (!isNaN(diasMin) && d.diasVencidos < diasMin) return false;
    if (!isNaN(diasMax) && d.diasVencidos > diasMax) return false;
    if (dataDe && d.dataPrevista && d.dataPrevista < dataDe) return false;
    if (dataAte && d.dataPrevista && d.dataPrevista > dataAte) return false;
    if (busca && !d.cliente.toUpperCase().includes(busca)) return false;
    return true;
  });

  if (ordenar){
    const cmp = {
      clienteAsc: (a,b)=>a.cliente.localeCompare(b.cliente,'pt-BR'),
      clienteDesc:(a,b)=>b.cliente.localeCompare(a.cliente,'pt-BR'),
      diasDesc:   (a,b)=>b.diasVencidos - a.diasVencidos,
      diasAsc:    (a,b)=>a.diasVencidos - b.diasVencidos,
      valorQuitDesc:(a,b)=>b.valorQuit - a.valorQuit,
      valorQuitAsc: (a,b)=>a.valorQuit - b.valorQuit,
      pctDesc:    (a,b)=>b.pct - a.pct,
      pctAsc:     (a,b)=>a.pct - b.pct,
      economiaDesc:(a,b)=>b.economia - a.economia,
      roiDesc:    (a,b)=>b.roi - a.roi,
      scoreDesc:  (a,b)=>b.score - a.score
    }[ordenar];
    if (cmp) STATE.filtered.sort(cmp);
  }

  const cEl = document.getElementById('filterCount');
  if (cEl) cEl.innerHTML = `Exibindo <b>${STATE.filtered.length}</b> de <b>${STATE.raw.length}</b> clientes`;

  renderizarPaginaAtiva();
}

function limparFiltros(){
  document.querySelectorAll('.filters-grid select').forEach(s=>s.value='');
  document.querySelectorAll('.filters-grid input').forEach(i=>i.value='');
  aplicarFiltros();
  showToast('Filtros limpos.', 'info');
}
