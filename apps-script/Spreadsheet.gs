/**
 * ============================================================================
 * SPREADSHEET.GS — Acesso e normalização dos dados da planilha
 * ============================================================================
 * Única camada que fala diretamente com SpreadsheetApp. Devolve arrays de
 * objetos já normalizados (tipos corretos, nomes de campo estáveis) —
 * nenhuma outra camada do sistema precisa saber como a planilha é montada.
 * ============================================================================
 */

const Spreadsheet = (() => {

  function pegarAba(nome) {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const aba = planilha.getSheetByName(nome);
    if (!aba) throw new Error(`Aba "${nome}" não encontrada na planilha.`);
    return aba;
  }

  function lerQuitacoes() {
    const aba = pegarAba(Config.ABAS.QUITACOES);
    const valores = aba.getDataRange().getValues();
    const idx = Utils.mapearColunas(valores[0], Config.COLUNAS_QUITACOES);

    const linhas = [];
    for (let i = 1; i < valores.length; i++) {
      const row = valores[i];
      const cliente = Utils.pegar(row, idx.cliente);
      if (!cliente || String(cliente).trim() === '') continue;

      linhas.push({
        id: linhas.length,
        uf: String(Utils.pegar(row, idx.uf) || '').trim(),
        cliente: String(cliente).trim(),
        modelo: String(Utils.pegar(row, idx.modelo) || '').trim(),
        baaf: Utils.normalizarSimNao(Utils.pegar(row, idx.baaf)),
        doc: Utils.normalizarSimNao(Utils.pegar(row, idx.doc)),
        status: String(Utils.pegar(row, idx.status) || '').trim().toUpperCase(),
        validade: Utils.paraISO(Utils.pegar(row, idx.validade)),
        fundo: Utils.paraNumero(Utils.pegar(row, idx.fundo)),
        saldo: Utils.paraNumero(Utils.pegar(row, idx.saldo)),
        valorQuit: Utils.paraNumero(Utils.pegar(row, idx.valorQuit)),
        economia: Utils.paraNumero(Utils.pegar(row, idx.economia)),
        pct: Utils.paraNumero(Utils.pegar(row, idx.pct)),
        quitado: Utils.paraBooleano(Utils.pegar(row, idx.quitado)),
        dataQuitacao: Utils.paraISO(Utils.pegar(row, idx.dataQuitacao)),
        dataPrevista: Utils.paraISO(Utils.pegar(row, idx.dataPrevista)),
        obs: String(Utils.pegar(row, idx.obs) || '').trim(),
      });
    }
    return linhas;
  }

  function lerApreensoes() {
    const aba = pegarAba(Config.ABAS.APREENSOES);
    const valores = aba.getDataRange().getValues();
    const idx = Utils.mapearColunas(valores[0], Config.COLUNAS_APREENSOES);

    const linhas = [];
    for (let i = 1; i < valores.length; i++) {
      const row = valores[i];
      const cliente = Utils.pegar(row, idx.cliente);
      if (!cliente || String(cliente).trim() === '') continue;

      linhas.push({
        id: linhas.length,
        uf: String(Utils.pegar(row, idx.uf) || '').trim(),
        cliente: String(cliente).trim(),
        dataFechamento: Utils.paraISO(Utils.pegar(row, idx.dataFechamento)),
        dataApreensao: Utils.paraISO(Utils.pegar(row, idx.dataApreensao)),
        banco: String(Utils.pegar(row, idx.banco) || '').trim().toUpperCase(),
        observacao: String(Utils.pegar(row, idx.observacao) || '').trim(),
        termoAssinado: Utils.paraBooleano(Utils.pegar(row, idx.termoAssinado)),
        valorPago: Utils.paraNumero(Utils.pegar(row, idx.valorPago)),
        pendencia: Utils.paraNumero(Utils.pegar(row, idx.pendencia)),
        multa: Utils.paraNumero(Utils.pegar(row, idx.multa)),
        valorRessarcir: Utils.paraNumero(Utils.pegar(row, idx.valorRessarcir)),
      });
    }
    return linhas;
  }

  return { lerQuitacoes, lerApreensoes };
})();
