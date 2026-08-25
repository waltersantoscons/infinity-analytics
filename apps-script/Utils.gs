/**
 * ============================================================================
 * UTILS.GS — Funções utilitárias puras (parsing, formatação, datas)
 * ============================================================================
 * Nenhuma função aqui acessa a planilha, cache ou monta resposta HTTP —
 * são todas puras (mesma entrada = mesma saída), fáceis de testar isoladamente.
 * ============================================================================
 */

const Utils = (() => {

  function paraNumero(v) {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v;
    const s = String(v).trim().replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function paraISO(v) {
    if (!v) return null;
    if (v instanceof Date) {
      return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    const s = String(v).trim().replace(/\/+/g, '/');
    const partes = s.split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1].substring(0, 2), 10);
      const ano = parseInt(partes[2], 10);
      if (!isNaN(dia) && !isNaN(mes) && !isNaN(ano)) {
        const d = new Date(ano, mes - 1, dia);
        return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
    }
    return null;
  }

  function paraBooleano(v) {
    if (typeof v === 'boolean') return v;
    const s = String(v || '').trim().toUpperCase();
    return s === 'SIM' || s === 'TRUE' || s === 'VERDADEIRO';
  }

  function normalizarSimNao(v) {
    return paraBooleano(v) ? 'Sim' : 'Não';
  }

  /** Dias corridos entre duas datas ISO (yyyy-MM-dd). Retorna null se inválido. */
  function diasEntre(isoInicio, isoFim) {
    if (!isoInicio || !isoFim) return null;
    const a = new Date(isoInicio);
    const b = new Date(isoFim);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
    return Math.round((b.getTime() - a.getTime()) / 86400000);
  }

  /** Dias vencidos até hoje (0 se ainda não venceu ou data ausente). */
  function diasVencidosAte(isoValidade, hoje) {
    if (!isoValidade) return 0;
    const d = diasEntre(isoValidade, Utilities.formatDate(hoje, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
    return d && d > 0 ? d : 0;
  }

  /** Localiza, para cada campo lógico, em qual coluna (índice) ele está. */
  function mapearColunas(header, candidatosPorCampo) {
    const headerNorm = header.map(h => String(h || '').trim().toUpperCase());
    const idx = {};
    Object.keys(candidatosPorCampo).forEach(campo => {
      let encontrado = -1;
      for (const nome of candidatosPorCampo[campo]) {
        const pos = headerNorm.indexOf(nome.toUpperCase());
        if (pos !== -1) { encontrado = pos; break; }
      }
      idx[campo] = encontrado;
    });
    return idx;
  }

  function pegar(row, indice) {
    if (indice === undefined || indice === -1) return null;
    return row[indice];
  }

  /** Soma um campo numérico de um array de objetos. */
  function somar(arr, campo) {
    return arr.reduce((s, item) => s + (Number(item[campo]) || 0), 0);
  }

  function media(arr, campo) {
    if (!arr.length) return 0;
    return somar(arr, campo) / arr.length;
  }

  /** Agrupa um array de objetos por uma função de chave. */
  function agruparPor(arr, keyFn) {
    const grupos = {};
    arr.forEach(item => {
      const k = keyFn(item);
      if (!grupos[k]) grupos[k] = [];
      grupos[k].push(item);
    });
    return grupos;
  }

  return {
    paraNumero, paraISO, paraBooleano, normalizarSimNao,
    diasEntre, diasVencidosAte, mapearColunas, pegar,
    somar, media, agruparPor,
  };
})();
