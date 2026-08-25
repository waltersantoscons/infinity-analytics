/**
 * ============================================================================
 * CONFIG.GS — Configuração central do Infinity Analytics
 * ============================================================================
 * Único arquivo que a maioria das alterações de configuração deveria tocar:
 * nomes de abas, mapeamento de colunas, TTL de cache e pesos do Score
 * Econômico (antes só existiam no frontend — agora são regra de negócio
 * centralizada no backend, conforme a arquitetura v1.0).
 * ============================================================================
 */

const Config = (() => {

  const ABAS = {
    QUITACOES: 'QUITAÇÕES VENCIDAS',
    APREENSOES: 'APREENSÕES',
  };

  /**
   * Pesos padrão do Score Econômico (0-100, devem somar 100).
   * Continuam ajustáveis pelo usuário na tela de Configurações do dashboard
   * — quando isso acontece, o frontend reenvia os pesos para a API a cada
   * requisição (parâmetro `pesos`), sem precisar persistir no backend.
   * Estes valores abaixo são o padrão de fábrica quando nada é informado.
   */
  const PESOS_SCORE_PADRAO = {
    roi: 30,
    economia: 25,
    dias: 20,
    baaf: 15,
    doc: 10,
    valorQuit: 0, // critério invertido: 100% prioriza os MENORES valores de quitação
  };

  const CACHE_TTL_SEGUNDOS = 120;

  /**
   * Mapeamento tolerante de nomes de coluna: cada campo lógico aceita uma
   * lista de variações de grafia/acentuação encontradas na planilha.
   */
  const COLUNAS_QUITACOES = {
    uf: ['UF'],
    cliente: ['CLIENTE', 'NOME DO CLIENTE'],
    modelo: ['MODELO'],
    baaf: ['BAAF'],
    doc: ['DOCUMENTAÇÃO COMPLETA', 'DOCUMENTACAO COMPLETA'],
    status: ['STATUS'],
    validade: ['VALIDADE'],
    fundo: ['FUNDO'],
    saldo: ['SALDO DEVEDOR'],
    valorQuit: ['VALOR P/ QUITAÇÃO', 'VALOR PARA QUITAÇÃO', 'VALOR P/QUITACAO'],
    economia: ['ECONÔMIA', 'ECONOMIA'],
    pct: ['%(PORCENTAGEM ATINGIDA)', '% ATINGIDO', 'PORCENTAGEM ATINGIDA'],
    quitado: ['QUITADO?', 'QUITADO'],
    dataQuitacao: ['DATA DA QUITAÇÃO', 'DATA DA QUITACAO'],
    dataPrevista: ['DATA PREVISTA:', 'DATA PREVISTA'],
    obs: ['OBSERVAÇÃO', 'OBSERVACAO', 'OBSERVAÇÕES'],
  };

  const COLUNAS_APREENSOES = {
    uf: ['UF'],
    cliente: ['NOME DO CLIENTE', 'CLIENTE'],
    dataFechamento: ['DATA /FECHAMENTO', 'DATA FECHAMENTO', 'DATA/FECHAMENTO'],
    dataApreensao: ['DATA/APREENSÃO', 'DATA APREENSAO', 'DATA/APREENSAO'],
    banco: ['BANCO'],
    observacao: ['OBSERVAÇÕES', 'OBSERVACOES'],
    termoAssinado: ['TERMO ASSINADO'],
    valorPago: ['VALOR PAGO'],
    pendencia: ['PENDENCIA', 'PENDÊNCIA'],
    multa: ['MULTA'],
    valorRessarcir: ['VALOR A SER RESSARCIDO'],
  };

  /** Faixas de classificação do Score Econômico (0-100). */
  const FAIXAS_SCORE = [
    { min: 80, max: 100, label: 'Muito Alta' },
    { min: 60, max: 79.999, label: 'Alta' },
    { min: 40, max: 59.999, label: 'Média' },
    { min: 20, max: 39.999, label: 'Baixa' },
    { min: 0, max: 19.999, label: 'Muito Baixa' },
  ];

  return {
    ABAS, PESOS_SCORE_PADRAO, CACHE_TTL_SEGUNDOS,
    COLUNAS_QUITACOES, COLUNAS_APREENSOES, FAIXAS_SCORE,
  };
})();
