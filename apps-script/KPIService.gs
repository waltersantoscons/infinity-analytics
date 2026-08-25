/**
 * ============================================================================
 * KPISERVICE.GS — Regras de negócio: Score, KPIs, gráficos e rankings
 * ============================================================================
 * Esta é a camada que antes vivia inteiramente no JavaScript do navegador.
 * Agora é o backend quem decide o que é "Score Alto", como a economia é
 * somada, e o que entra em cada gráfico — o frontend só exibe o que a API
 * manda. Isso é o que a arquitetura v1.0 pede em "centralizar regras de
 * negócio no backend".
 * ============================================================================
 */

const KPIService = (() => {

  /**
   * Calcula o Score Econômico (0-100) de cada linha de Quitações, usando
   * os pesos informados (ou os padrões de Config.gs). Também define a
   * classificação (Muito Alta...Muito Baixa) e a prioridade (posição no
   * ranking por score).
   */
  function calcularScoresQuitacoes(linhas, pesosInformados) {
    if (!linhas.length) return linhas;
    const pesos = Object.assign({}, Config.PESOS_SCORE_PADRAO, pesosInformados || {});
    const hoje = new Date();

    // Calcula dias vencidos e ROI de cada linha primeiro (dependências do score)
    linhas.forEach(l => {
      l.diasVencidos = l.status === 'VENCIDO' ? Utils.diasVencidosAte(l.validade, hoje) : 0;
      l.roi = l.valorQuit > 0 ? l.economia / l.valorQuit : 0;
    });

    const maxRoi = Math.max(...linhas.map(l => l.roi), 0.0001);
    const maxEconomia = Math.max(...linhas.map(l => l.economia), 0.0001);
    const maxDias = Math.max(...linhas.map(l => l.diasVencidos), 0.0001);
    const maxValorQuit = Math.max(...linhas.map(l => l.valorQuit), 0.0001);

    linhas.forEach(l => {
      const nRoi = Math.min(l.roi / maxRoi, 1);
      const nEconomia = Math.min(l.economia / maxEconomia, 1);
      const nDias = Math.min(l.diasVencidos / maxDias, 1);
      const nBaaf = l.baaf === 'Sim' ? 1 : 0;
      const nDoc = l.doc === 'Sim' ? 1 : 0;
      // Valor de Quitação é invertido: menor valor = nota maior nesse critério.
      const nValorQuit = 1 - Math.min(l.valorQuit / maxValorQuit, 1);

      const score = (nRoi * pesos.roi) + (nEconomia * pesos.economia) + (nDias * pesos.dias)
                  + (nBaaf * pesos.baaf) + (nDoc * pesos.doc) + (nValorQuit * pesos.valorQuit);

      l.score = Math.round(Math.max(0, Math.min(100, score)) * 10) / 10;
      l.classificacao = classificarScore(l.score);
    });

    const ordenado = [...linhas].sort((a, b) => b.score - a.score);
    ordenado.forEach((l, i) => { l.prioridade = i + 1; });

    return linhas;
  }

  function classificarScore(score) {
    const faixa = Config.FAIXAS_SCORE.find(f => score >= f.min && score <= f.max);
    return faixa ? faixa.label : 'Muito Baixa';
  }

  /**
   * KPIs principais de Quitações Vencidas (Regra 8 da especificação):
   * saldo devedor, valor para quitação, economia total, economia média,
   * percentual médio, clientes, quitações e pendências.
   */
  function kpisQuitacoes(linhas) {
    const quitados = linhas.filter(l => l.quitado);
    const pendentes = linhas.filter(l => !l.quitado);
    return {
      totalClientes: linhas.length,
      totalQuitacoes: quitados.length,
      totalPendencias: pendentes.length,
      saldoDevedorTotal: Utils.somar(linhas, 'saldo'),
      valorQuitacaoTotal: Utils.somar(linhas, 'valorQuit'),
      economiaTotal: Utils.somar(linhas, 'economia'),
      economiaMedia: Utils.media(linhas, 'economia'),
      percentualMedio: Utils.media(linhas, 'pct'),
      roiMedio: Utils.media(linhas, 'roi'),
      scoreMedio: Utils.media(linhas, 'score'),
    };
  }

  /**
   * Gráficos de Quitações Vencidas (Regra 9): economia por estado, modelo,
   * evolução mensal e status.
   *
   * NOTA IMPORTANTE sobre "economia por fundo": a especificação original
   * pede esse gráfico assumindo que "Fundo" é uma categoria (ex.: nome de
   * um fundo de investimento). Na planilha real, a coluna FUNDO é um VALOR
   * MONETÁRIO (quanto foi alocado à operação), não uma categoria — agrupar
   * por esse campo geraria uma barra por cliente (cada um com um valor de
   * fundo praticamente único), o que não produz um gráfico útil. Por isso
   * este endpoint não gera "economiaPorFundo". Se no futuro a planilha
   * ganhar uma coluna categórica de fundo (ex.: "FUNDO_NOME"), basta somar
   * `porChave('fundoNome')` aqui — a função já está pronta para isso.
   */
  function graficosQuitacoes(linhas) {
    const porChave = (campo) => {
      const grupos = Utils.agruparPor(linhas, l => l[campo] || '—');
      return Object.keys(grupos).map(chave => ({
        chave, economia: Utils.somar(grupos[chave], 'economia'), quantidade: grupos[chave].length,
      })).sort((a, b) => b.economia - a.economia);
    };

    const porMes = Utils.agruparPor(
      linhas.filter(l => l.dataPrevista),
      l => l.dataPrevista.slice(0, 7)
    );
    const evolucaoMensal = Object.keys(porMes).sort().map(mes => ({
      mes, economia: Utils.somar(porMes[mes], 'economia'), quantidade: porMes[mes].length,
    }));

    return {
      economiaPorEstado: porChave('uf'),
      economiaPorModelo: porChave('modelo'),
      economiaPorStatus: porChave('status'),
      evolucaoMensal,
    };
  }

  /** Top 20 rankings usados nas páginas ROI/Score do dashboard. */
  function rankingsQuitacoes(linhas) {
    const top = (campo, n) => [...linhas].sort((a, b) => b[campo] - a[campo]).slice(0, n)
      .map(l => ({ cliente: l.cliente, uf: l.uf, valor: l[campo] }));
    return {
      topScore: top('score', 20),
      topROI: top('roi', 20),
      topEconomia: top('economia', 20),
      topDiasVencidos: top('diasVencidos', 20),
    };
  }

  /** Curva ABC (Pareto 80/20) por economia. */
  function curvaABC(linhas) {
    const ordenado = [...linhas].sort((a, b) => b.economia - a.economia);
    const total = Utils.somar(ordenado, 'economia') || 1;
    let acumulado = 0;
    const classes = { A: [], B: [], C: [] };
    ordenado.forEach(l => {
      acumulado += l.economia;
      const pct = (acumulado / total) * 100;
      const classe = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
      classes[classe].push(l);
    });
    const resumo = (itens) => ({ quantidade: itens.length, economia: Utils.somar(itens, 'economia') });
    return { A: resumo(classes.A), B: resumo(classes.B), C: resumo(classes.C) };
  }

  /** KPIs do setor Apreensões. */
  function kpisApreensoes(linhas) {
    return {
      totalClientes: linhas.length,
      termoAssinado: linhas.filter(l => l.termoAssinado).length,
      termoNaoAssinado: linhas.filter(l => !l.termoAssinado).length,
      valorPagoTotal: Utils.somar(linhas, 'valorPago'),
      pendenciaTotal: Utils.somar(linhas, 'pendencia'),
      multaTotal: Utils.somar(linhas, 'multa'),
      valorRessarcirTotal: Utils.somar(linhas, 'valorRessarcir'),
    };
  }

  return {
    calcularScoresQuitacoes, classificarScore, kpisQuitacoes, graficosQuitacoes,
    rankingsQuitacoes, curvaABC, kpisApreensoes,
  };
})();
