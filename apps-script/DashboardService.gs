/**
 * ============================================================================
 * DASHBOARDSERVICE.GS — Orquestração: filtros + KPIs + gráficos + rankings
 * ============================================================================
 * Camada que conecta as demais: lê a planilha (Spreadsheet.gs), aplica os
 * filtros vindos da URL, e delega os cálculos de negócio ao KPIService.
 * O Router.gs chama só esta camada — nunca fala com Spreadsheet ou
 * KPIService diretamente.
 * ============================================================================
 */

const DashboardService = (() => {

  /**
   * Filtros aceitos (Regra 10 da especificação): fundo (faixa numérica —
   * ver nota em KPIService sobre a natureza monetária dessa coluna),
   * estado (uf), modelo, status e período (intervalo de datas).
   * Todos são opcionais; parâmetros ausentes não filtram nada.
   */
  function aplicarFiltrosQuitacoes(linhas, params) {
    let resultado = linhas;
    if (params.estado) resultado = resultado.filter(l => l.uf === params.estado);
    if (params.modelo) resultado = resultado.filter(l => l.modelo === params.modelo);
    if (params.status) resultado = resultado.filter(l => l.status === params.status.toUpperCase());
    if (params.fundoMin !== undefined) resultado = resultado.filter(l => l.fundo >= Number(params.fundoMin));
    if (params.fundoMax !== undefined) resultado = resultado.filter(l => l.fundo <= Number(params.fundoMax));
    if (params.periodoInicio) resultado = resultado.filter(l => l.dataPrevista && l.dataPrevista >= params.periodoInicio);
    if (params.periodoFim) resultado = resultado.filter(l => l.dataPrevista && l.dataPrevista <= params.periodoFim);
    if (params.busca) {
      const termo = params.busca.toUpperCase();
      resultado = resultado.filter(l => l.cliente.toUpperCase().includes(termo));
    }
    return resultado;
  }

  function aplicarFiltrosApreensoes(linhas, params) {
    let resultado = linhas;
    if (params.estado) resultado = resultado.filter(l => l.uf === params.estado);
    if (params.banco) resultado = resultado.filter(l => l.banco === params.banco.toUpperCase());
    if (params.periodoInicio) resultado = resultado.filter(l => l.dataApreensao && l.dataApreensao >= params.periodoInicio);
    if (params.periodoFim) resultado = resultado.filter(l => l.dataApreensao && l.dataApreensao <= params.periodoFim);
    if (params.busca) {
      const termo = params.busca.toUpperCase();
      resultado = resultado.filter(l => l.cliente.toUpperCase().includes(termo));
    }
    return resultado;
  }

  /** Extrai valores únicos de cada dimensão filtrável, para popular os <select> do frontend. */
  function filtrosDisponiveisQuitacoes(linhas) {
    const unicos = campo => [...new Set(linhas.map(l => l[campo]).filter(Boolean))].sort();
    return { estados: unicos('uf'), modelos: unicos('modelo'), status: unicos('status') };
  }
  function filtrosDisponiveisApreensoes(linhas) {
    const unicos = campo => [...new Set(linhas.map(l => l[campo]).filter(Boolean))].sort();
    return { estados: unicos('uf'), bancos: unicos('banco') };
  }

  /**
   * Monta a resposta completa do setor Quitações Vencidas: tabela filtrada
   * (com Score já calculado), KPIs, gráficos, rankings e curva ABC — tudo
   * computado no backend, pronto para o frontend apenas renderizar.
   */
  function montarRespostaQuitacoes(params) {
    const todas = Spreadsheet.lerQuitacoes();
    const filtrosDisponiveis = filtrosDisponiveisQuitacoes(todas);

    const filtradas = aplicarFiltrosQuitacoes(todas, params);
    KPIService.calcularScoresQuitacoes(filtradas, params.pesos);

    return {
      tabela: filtradas,
      kpis: KPIService.kpisQuitacoes(filtradas),
      graficos: KPIService.graficosQuitacoes(filtradas),
      rankings: KPIService.rankingsQuitacoes(filtradas),
      curvaABC: KPIService.curvaABC(filtradas),
      filtrosDisponiveis,
      pesosPadrao: Config.PESOS_SCORE_PADRAO,
      totalSemFiltro: todas.length,
    };
  }

  function montarRespostaApreensoes(params) {
    const todas = Spreadsheet.lerApreensoes();
    const filtrosDisponiveis = filtrosDisponiveisApreensoes(todas);
    const filtradas = aplicarFiltrosApreensoes(todas, params);

    return {
      tabela: filtradas,
      kpis: KPIService.kpisApreensoes(filtradas),
      filtrosDisponiveis,
      totalSemFiltro: todas.length,
    };
  }

  return { montarRespostaQuitacoes, montarRespostaApreensoes };
})();
