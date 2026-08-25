/**
 * ============================================================================
 * ROUTER.GS — Roteamento de requisições e montagem da resposta HTTP
 * ============================================================================
 * Único lugar que decide "o que fazer" com uma requisição GET. Sempre
 * devolve JSON (nunca uma página de erro do Google), mesmo quando algo
 * falha — decisão de design para o frontend nunca receber HTML inesperado.
 *
 * Contrato único (v1.0): toda resposta já vem com KPIs, gráficos, rankings
 * e curva ABC calculados no backend — o frontend só renderiza.
 * ============================================================================
 */

const Router = (() => {

  function route(e) {
    const params = (e && e.parameter) ? e.parameter : {};
    const setor = params.setor || 'todos';

    const chaveCache = Cache.chaveDe(setor, params);
    const doCache = Cache.obter(chaveCache);
    if (doCache) {
      doCache.origemCache = true;
      return respostaJSON(doCache);
    }

    const paramsComPesos = Object.assign({}, params);
    if (params.pesos) {
      try { paramsComPesos.pesos = JSON.parse(params.pesos); }
      catch (e2) { throw new Error('Parâmetro "pesos" inválido: deve ser um JSON válido.'); }
    }

    let payload;
    if (setor === 'quitacoes') payload = { setor, quitacoes: DashboardService.montarRespostaQuitacoes(paramsComPesos) };
    else if (setor === 'apreensoes') payload = { setor, apreensoes: DashboardService.montarRespostaApreensoes(paramsComPesos) };
    else payload = {
      setor: 'todos',
      quitacoes: DashboardService.montarRespostaQuitacoes(paramsComPesos),
      apreensoes: DashboardService.montarRespostaApreensoes(paramsComPesos),
    };

    payload.sucesso = true;
    payload.timestamp = new Date().toISOString();
    payload.origemCache = false;

    Cache.gravar(chaveCache, payload);
    return respostaJSON(payload);
  }

  function respostaErro(erro) {
    const saida = ContentService.createTextOutput(JSON.stringify({
      sucesso: false,
      erro: String(erro && erro.message ? erro.message : erro),
      timestamp: new Date().toISOString(),
    }));
    saida.setMimeType(ContentService.MimeType.JSON);
    return saida;
  }

  function respostaJSON(objeto) {
    const saida = ContentService.createTextOutput(JSON.stringify(objeto));
    saida.setMimeType(ContentService.MimeType.JSON);
    return saida;
  }

  return { route, respostaErro };
})();
