/**
 * ============================================================================
 * CACHE.GS — Camada de cache (Google Apps Script CacheService)
 * ============================================================================
 * Reduz leituras repetidas da planilha em rajadas de requisições. Isolado
 * em módulo próprio para poder ser trocado no futuro (ex.: por um cache
 * externo) sem tocar em nenhum outro arquivo.
 * ============================================================================
 */

const Cache = (() => {

  function obter(chave) {
    try {
      const bruto = CacheService.getScriptCache().get(chave);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      return null; // cache indisponível não pode derrubar a aplicação
    }
  }

  function gravar(chave, valor, ttlSegundos) {
    try {
      CacheService.getScriptCache().put(chave, JSON.stringify(valor), ttlSegundos || Config.CACHE_TTL_SEGUNDOS);
      return true;
    } catch (e) {
      // Payload pode ser grande demais para o cache (limite ~100KB por chave) — não é erro fatal.
      return false;
    }
  }

  function remover(chave) {
    try { CacheService.getScriptCache().remove(chave); } catch (e) { /* ignora */ }
  }

  /** Constrói uma chave de cache estável a partir do recurso + parâmetros relevantes. */
  function chaveDe(recurso, params) {
    const partes = Object.keys(params || {}).sort().map(k => `${k}=${params[k]}`);
    return `ia_${recurso}_${partes.join('&')}`;
  }

  return { obter, gravar, remover, chaveDe };
})();
