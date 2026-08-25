/**
 * ============================================================================
 * API.JS — Camada de integração com a API do Infinity Analytics
 * ============================================================================
 * Único arquivo que fala com `fetch()`. Isola o resto da aplicação da forma
 * como os dados chegam — trocar Google Sheets por Firebase/MySQL no futuro
 * significa reescrever só este arquivo, mantendo a mesma forma de saída.
 *
 * v1.0: a API agora devolve por setor um objeto já com KPIs, gráficos,
 * rankings, curva ABC e a tabela de linhas (já com Score calculado no
 * backend) — não mais um array cru. Também aceita filtros e pesos do Score
 * como parâmetros de query, processados no Google Apps Script.
 * ============================================================================
 */

const ApiClient = (() => {
  const cfg = window.APP_CONFIG;
  let ultimaSincronizacao = null;

  function emitir(nomeEvento, detalhe = {}) {
    document.dispatchEvent(new CustomEvent(nomeEvento, { detail: detalhe }));
  }

  function lerCache(chave) {
    try {
      const bruto = sessionStorage.getItem(chave);
      if (!bruto) return null;
      const { dados, timestamp } = JSON.parse(bruto);
      if (Date.now() - timestamp > cfg.CACHE_TTL_MS) return null;
      return dados;
    } catch (e) { return null; }
  }

  function gravarCache(chave, dados) {
    try { sessionStorage.setItem(chave, JSON.stringify({ dados, timestamp: Date.now() })); }
    catch (e) { /* segue sem cache */ }
  }

  function esperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  async function fetchComRetry(url, tentativa = 1) {
    try {
      const resposta = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (!resposta.ok) throw new Error(`A API respondeu com status HTTP ${resposta.status}`);
      const json = await resposta.json();
      if (json && json.sucesso === false) throw new Error(json.erro || 'A API retornou um erro não especificado.');
      return json;
    } catch (erro) {
      if (tentativa >= cfg.MAX_TENTATIVAS_FETCH) throw classificarErro(erro);
      const espera = cfg.ESPERA_BASE_RETRY_MS * Math.pow(2, tentativa - 1);
      emitir('api:tentativa-falhou', { tentativa, proximaEsperaMs: espera, erro: String(erro.message || erro) });
      await esperar(espera);
      return fetchComRetry(url, tentativa + 1);
    }
  }

  function classificarErro(erro) {
    const msg = String(erro && erro.message ? erro.message : erro);
    let mensagemAmigavel, tipo;
    if (cfg.API_BASE_URL.includes('COLE_AQUI')) {
      tipo = 'nao_configurado';
      mensagemAmigavel = 'O dashboard ainda não foi conectado à planilha. Configure a URL da API em assets/js/config.js (veja docs/GUIA_DE_INSTALACAO.md).';
    } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network')) {
      tipo = 'rede';
      mensagemAmigavel = 'Não foi possível conectar à planilha. Verifique sua conexão com a internet e tente novamente.';
    } else if (msg.includes('status HTTP 4') || msg.includes('status HTTP 5')) {
      tipo = 'servidor';
      mensagemAmigavel = 'A API respondeu com um erro. Ela pode estar temporariamente indisponível — tentando novamente em instantes.';
    } else if (msg.toLowerCase().includes('aba') && msg.toLowerCase().includes('não encontrada')) {
      tipo = 'planilha_mal_configurada';
      mensagemAmigavel = msg + ' Confira o nome da aba na sua planilha e em apps-script/Config.gs.';
    } else if (msg.toLowerCase().includes('pesos')) {
      tipo = 'pesos_invalidos';
      mensagemAmigavel = msg;
    } else {
      tipo = 'desconhecido';
      mensagemAmigavel = 'Ocorreu um erro inesperado ao carregar os dados da planilha. Detalhes no console (F12).';
    }
    const e = new Error(mensagemAmigavel);
    e.tipo = tipo; e.mensagemTecnica = msg;
    return e;
  }

  /** Monta a query string a partir de filtros/pesos (omitindo valores vazios). */
  function montarQuery(setor, opcoes) {
    const params = new URLSearchParams();
    params.set('setor', setor);
    params.set('_ts', Date.now());
    const filtros = opcoes.filtros || {};
    Object.keys(filtros).forEach(k => {
      if (filtros[k] !== undefined && filtros[k] !== null && filtros[k] !== '') params.set(k, filtros[k]);
    });
    if (opcoes.pesos) params.set('pesos', JSON.stringify(opcoes.pesos));
    return `${cfg.API_BASE_URL}?${params.toString()}`;
  }

  /**
   * Busca os dados de um setor ("quitacoes", "apreensoes" ou "todos").
   * Retorna o objeto rico do setor: { tabela, kpis, graficos, rankings,
   * curvaABC, filtrosDisponiveis, pesosPadrao }. Usa cache local por
   * combinação de filtros+pesos, a menos que `forcarAtualizacao` seja true.
   */
  async function buscarDados(setor, { forcarAtualizacao = false, filtros = {}, pesos = null } = {}) {
    const chaveCache = `ia_cache_${setor}_${JSON.stringify(filtros)}_${JSON.stringify(pesos)}`;

    if (!forcarAtualizacao) {
      const doCache = lerCache(chaveCache);
      if (doCache) {
        emitir('api:sucesso', { setor, origemCache: true, timestamp: ultimaSincronizacao });
        return doCache;
      }
    }

    if (cfg.API_BASE_URL.includes('COLE_AQUI')) {
      const erro = classificarErro(new Error('não configurado'));
      emitir('api:erro', { setor, erro });
      throw erro;
    }

    emitir('api:carregando-inicio', { setor });
    try {
      const url = montarQuery(setor, { filtros, pesos });
      const json = await fetchComRetry(url);
      const dados = setor === 'todos' ? { quitacoes: json.quitacoes, apreensoes: json.apreensoes } : json[setor];

      if (!dados) throw new Error('A API respondeu em um formato inesperado.');

      ultimaSincronizacao = new Date();
      gravarCache(chaveCache, dados);
      emitir('api:sucesso', { setor, origemCache: false, timestamp: ultimaSincronizacao });
      return dados;
    } catch (erroBruto) {
      const erro = erroBruto.tipo ? erroBruto : classificarErro(erroBruto);
      emitir('api:erro', { setor, erro });
      throw erro;
    } finally {
      emitir('api:carregando-fim', { setor });
    }
  }

  function getUltimaSincronizacao() { return ultimaSincronizacao; }

  function iniciarSincronizacaoAutomatica(setor, opcoesFn, callback) {
    const id = setInterval(async () => {
      try {
        const dados = await buscarDados(setor, Object.assign({ forcarAtualizacao: true }, opcoesFn()));
        callback(dados);
      } catch (e) { /* erro já emitido via 'api:erro' */ }
    }, cfg.INTERVALO_SINCRONIZACAO_MS);
    return () => clearInterval(id);
  }

  return { buscarDados, getUltimaSincronizacao, iniciarSincronizacaoAutomatica };
})();
