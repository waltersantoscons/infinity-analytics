# Infinity Analytics v1.0

Dashboard executivo da Infinity Protege, sincronizado em tempo real com Google Sheets através de uma API própria em Google Apps Script.

```
Google Sheets  →  Google Apps Script (API)  →  JSON  →  Dashboard (GitHub Pages)
```

O dashboard **nunca** acessa a planilha diretamente — toda leitura, cálculo de Score Econômico, KPIs, gráficos e rankings acontece no backend (Apps Script). O frontend só renderiza o que a API entrega.

## Estrutura do projeto

```
/index.html              Dashboard (única página)
/assets/css/              Estilos (5 arquivos temáticos)
/assets/js/                JavaScript modular (9 arquivos, cada um com uma responsabilidade)
/assets/images/            Logo e ícones
/apps-script/              Backend — cole estes 8 arquivos no editor do Google Apps Script
/docs/                      Guias de instalação, arquitetura e planejamento futuro
```

## Início rápido

1. Siga o [Guia de Instalação](docs/GUIA_DE_INSTALACAO.md) para publicar a API a partir da sua planilha.
2. Cole a URL gerada em `assets/js/config.js` (`API_BASE_URL`).
3. Abra `index.html` — veja [docs/GUIA_DE_INSTALACAO.md](docs/GUIA_DE_INSTALACAO.md#servindo-localmente) para o motivo de não poder simplesmente dar duplo clique no arquivo.
4. Para publicar de verdade, veja [docs/PUBLICAR_GITHUB_PAGES.md](docs/PUBLICAR_GITHUB_PAGES.md).

## Arquitetura

Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md) para o detalhamento de cada camada do backend (Config, Utils, Cache, Spreadsheet, KPIService, DashboardService, Router, Code) e das decisões de design tomadas.

## Fontes de dados

Duas abas da planilha, tratadas como dois "setores" independentes no dashboard:
- **QUITAÇÕES VENCIDAS** — priorização de clientes para quitação, com Score Econômico configurável.
- **APREENSÕES** — acompanhamento de veículos apreendidos, valores pagos/pendentes/multas.

## Roadmap

- **v1.0** (este repositório): integração completa com Google Sheets, arquitetura modular, regras de negócio centralizadas no backend.
- **v2.0**: cadastro de usuários e autenticação.
- **v3.0**: integração com CRM, módulo financeiro, IA para análise de indicadores, automações (ex.: WhatsApp).

Veja [docs/PROXIMOS_PASSOS.md](docs/PROXIMOS_PASSOS.md) para detalhes.

## Licença e uso

Projeto interno da Infinity Protege. Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição e [CHANGELOG.md](CHANGELOG.md) para o histórico de versões.
