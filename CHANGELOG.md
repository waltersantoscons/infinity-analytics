# Changelog

Todas as mudanças notáveis deste projeto são documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [1.0.0] — 2026-08-04

### Adicionado
- Integração completa com Google Sheets via API própria em Google Apps Script.
- Backend modular em 8 arquivos (`Config`, `Utils`, `Cache`, `Spreadsheet`, `KPIService`, `DashboardService`, `Router`, `Code`), com regras de negócio (Score Econômico, KPIs, gráficos, rankings, Curva ABC) centralizadas no servidor.
- Filtro por Modelo (além de UF, Status, faixas numéricas e período, já existentes).
- Pesos do Score Econômico agora recalculados no backend ao serem alterados na tela de Configurações.
- Setor Apreensões com carregamento sob demanda (só busca dados quando o usuário acessa esse setor).
- Estrutura de projeto modular (`assets/css` com 5 arquivos, `assets/js` com 9 arquivos), pronta para GitHub Pages.
- Indicador de sincronização, banner de erro amigável com nova tentativa automática (backoff exponencial), e painel de status da API na tela de Configurações.

### Alterado
- Contrato da API: agora sempre retorna KPIs/gráficos/rankings já calculados (versões anteriores retornavam apenas linhas cruas da planilha — **quebra de compatibilidade intencional**, ver decisão registrada em `docs/ARQUITETURA.md`).
- Score Econômico deixou de ser calculado no navegador.

### Removido
- Upload manual de arquivo XLSX (substituído por sincronização automática com Google Sheets).
- Cálculo client-side de Score, KPIs agregados e normalização de linhas (agora no backend).

## [0.x] — versões anteriores (protótipo)
- Dashboard single-file com dados embutidos, depois evoluído para leitura de XLSX via upload manual, depois para uma primeira integração simples com Google Sheets (API sem regras de negócio no backend). Essas versões não seguem SemVer retroativo e não estão marcadas como tags neste repositório.

## [1.0.1] — 2026-08-24

### Corrigido
- **Bug crítico de CSS**: comentários de cabeçalho quebrados em `cards.css`, `charts.css` e `tables.css` faziam o navegador descartar silenciosamente a primeira regra de cada arquivo (`.kpi-grid`, `.grid-2`, `.filters-bar`) — causava os cartões de KPI aparecerem empilhados verticalmente em vez de em grade.
- **Bibliotecas externas agora embutidas localmente** (`assets/js/vendor/`, `assets/css/vendor/`) em vez de carregadas via CDN — elimina o risco de gráficos não aparecerem por bloqueio/instabilidade de rede em determinados computadores/redes corporativas.
