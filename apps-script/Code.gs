/**
 * ============================================================================
 * CODE.GS — Ponto de entrada do Web App (Infinity Analytics v1.0)
 * ============================================================================
 * Este é o único arquivo que o Google Apps Script exige ter uma função
 * `doGet`. Toda a lógica real vive nos módulos especializados
 * (Router, DashboardService, KPIService, Spreadsheet, Cache, Utils,
 * Config) — este arquivo é intencionalmente fino.
 *
 * COMO IMPLANTAR: veja docs/GUIA_DE_INSTALACAO.md.
 * ============================================================================
 */

function doGet(e) {
  try {
    return Router.route(e);
  } catch (erro) {
    return Router.respostaErro(erro);
  }
}

/**
 * Funções de teste manual — rode pelo editor do Apps Script (▶ Executar)
 * para validar a integração antes de implantar como Web App.
 */
function testarLeituraBasica() {
  const q = Spreadsheet.lerQuitacoes();
  const a = Spreadsheet.lerApreensoes();
  Logger.log('Quitações: %s registros. Exemplo: %s', q.length, JSON.stringify(q[0]));
  Logger.log('Apreensões: %s registros. Exemplo: %s', a.length, JSON.stringify(a[0]));
}

function testarRespostaCompleta() {
  const resposta = DashboardService.montarRespostaQuitacoes({});
  Logger.log('KPIs: %s', JSON.stringify(resposta.kpis));
  Logger.log('Gráficos (chaves): %s', JSON.stringify(Object.keys(resposta.graficos)));
  Logger.log('Rankings (chaves): %s', JSON.stringify(Object.keys(resposta.rankings)));
  Logger.log('Curva ABC: %s', JSON.stringify(resposta.curvaABC));
}
