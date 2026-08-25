# Arquitetura — Infinity Analytics v1.0

## Visão geral

```
┌─────────────────┐     ┌──────────────────────────────────────┐     ┌──────────────┐
│  Google Sheets   │ ──▶ │        Google Apps Script (API)        │ ──▶ │  Dashboard    │
│  (fonte única    │     │                                          │     │  (GitHub      │
│   de dados)      │     │  Code.gs → Router.gs → DashboardService │     │   Pages)      │
└─────────────────┘     │     → KPIService / Spreadsheet / Cache   │     └──────────────┘
                          └──────────────────────────────────────┘
```

O dashboard fala **exclusivamente** com a API (`fetch`); nunca importa nem lê a planilha diretamente. Toda regra de negócio — Score Econômico, filtros, agregações, rankings — vive no backend.

## Camadas do backend (`apps-script/`)

| Arquivo | Responsabilidade | Depende de |
|---|---|---|
| `Config.gs` | Nomes de abas, mapeamento de colunas, pesos padrão do Score, faixas de classificação | — |
| `Utils.gs` | Parsing de datas/números/booleanos, funções puras (sem efeitos colaterais) | — |
| `Cache.gs` | Wrapper sobre `CacheService`, serialização JSON | `Config.gs` |
| `Spreadsheet.gs` | Única camada que chama `SpreadsheetApp` — lê e normaliza as linhas | `Config.gs`, `Utils.gs` |
| `KPIService.gs` | Regras de negócio: Score Econômico, KPIs, gráficos, rankings, Curva ABC | `Config.gs`, `Utils.gs` |
| `DashboardService.gs` | Aplica filtros vindos da URL, orquestra `Spreadsheet` + `KPIService` | `Spreadsheet.gs`, `KPIService.gs` |
| `Router.gs` | Roteamento HTTP, cache por combinação de parâmetros, sempre responde JSON | `DashboardService.gs`, `Cache.gs` |
| `Code.gs` | Ponto de entrada exigido pelo Apps Script (`doGet`) — intencionalmente fino | `Router.gs` |

Cada arquivo `.gs` expõe um único objeto/namespace (ex.: `const KPIService = (() => {...})()`), então a ordem dos arquivos no editor do Apps Script **não importa** — tudo roda no mesmo escopo global antes de qualquer função ser chamada.

## Contrato da API

```
GET {API_BASE_URL}?setor=quitacoes|apreensoes|todos
                    &estado=PE&modelo=VEICULAR&status=VENCIDO
                    &periodoInicio=2026-01-01&periodoFim=2026-12-31
                    &busca=joão
                    &pesos={"roi":30,"economia":25,...}
```

Resposta (setor=quitacoes):
```json
{
  "sucesso": true,
  "quitacoes": {
    "tabela": [ { "cliente": "...", "score": 87.4, "classificacao": "Muito Alta", ... } ],
    "kpis": { "totalClientes": 133, "economiaTotal": 505855.4, ... },
    "graficos": { "economiaPorEstado": [...], "evolucaoMensal": [...] },
    "rankings": { "topScore": [...], "topROI": [...] },
    "curvaABC": { "A": {...}, "B": {...}, "C": {...} },
    "filtrosDisponiveis": { "estados": [...], "modelos": [...], "status": [...] },
    "pesosPadrao": { "roi": 30, "economia": 25, ... }
  },
  "timestamp": "2026-08-04T18:00:00.000Z",
  "origemCache": false
}
```

Em caso de erro (aba não encontrada, planilha inacessível, parâmetro inválido), a resposta é sempre JSON com `sucesso: false` e `erro: "mensagem legível"` — nunca uma página de erro HTML do Google.

## Decisões de design registradas

1. **Filtragem instantânea no navegador, valores sempre do backend.** A primeira carga busca o conjunto completo (sem filtros) já com Score calculado. A partir daí, os filtros de UF/Modelo/Status/faixas numéricas/busca são aplicados no navegador sobre esse conjunto — resposta instantânea ao usuário. Isso não reintroduz regra de negócio no frontend: os *valores* de cada linha (Score, ROI, dias vencidos, classificação) já vieram prontos da API; o frontend só decide *quais* linhas mostrar. A API também aceita esses mesmos filtros como parâmetros de URL (usado para trocar os pesos do Score, que precisa de recálculo real no servidor).

2. **Pesos do Score recalculam no servidor.** Ao alterar os pesos na tela de Configurações, o frontend chama a API novamente com `pesos=...` — o Score de toda a base é recalculado no Apps Script, não no navegador.

3. **"Economia por Fundo" não existe como gráfico categórico.** Na planilha real, a coluna `FUNDO` é um valor monetário por cliente, não uma categoria — agrupar por ela não produz um gráfico útil. Ver comentário em `KPIService.gs`.

4. **Carregamento sob demanda por setor.** O dashboard só busca os dados de Apreensões na API quando o usuário troca para esse setor pela primeira vez — evita uma chamada desnecessária no carregamento inicial para quem só usa Quitações Vencidas.

## Expansão futura sem reescrever a base

- **Trocar Google Sheets por outro banco:** reescreva só `Spreadsheet.gs`, mantendo a mesma forma de retorno (array de objetos com os mesmos nomes de campo).
- **Autenticação (v2.0):** valide um token no início de `Router.route()`, antes de chamar `DashboardService`.
- **Novo setor de dados:** siga o padrão de `DashboardService.montarRespostaApreensoes` — leia a aba, aplique filtros, devolva KPIs.
