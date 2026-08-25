# Como contribuir

## Princípios do projeto

1. **Regra de negócio vive no backend (`apps-script/`).** Se você está calculando algo a partir de valores "crus" da planilha (não apenas reorganizando dados já prontos para exibição), isso provavelmente pertence a `KPIService.gs` ou `DashboardService.gs`, não a um arquivo em `assets/js/`.
2. **Não altere o layout visual sem alinhar antes.** Mudanças de CSS/estrutura HTML que afetam a aparência devem ser discutidas antes de implementadas.
3. **Não remova funcionalidades existentes** sem substituí-las por algo equivalente ou combinar isso explicitamente.
4. **Cada módulo tem uma responsabilidade só.** Antes de adicionar uma função em `dashboard.js`, confira se ela não pertence a `charts.js`, `tables.js` ou `filters.js`.

## Estrutura para novas funcionalidades

- Novo campo/coluna na planilha → adicione ao mapeamento em `Config.gs` e ao objeto retornado em `Spreadsheet.gs`.
- Novo KPI/gráfico → `KPIService.gs`, exposto no objeto de retorno de `DashboardService.gs`.
- Novo filtro → `DashboardService.aplicarFiltrosX` (backend) e, se precisar de resposta instantânea no navegador, também em `filters.js` (frontend).
- Nova página do dashboard → siga o padrão de `<section class="page" id="page-NOME">` no `index.html`, registre em `PAGE_TITLES` e no `switch` de `renderizarPaginaAtiva()` em `dashboard.js`.

## Testando antes de enviar

Este projeto não usa framework de testes automatizados no navegador — a validação usada durante o desenvolvimento foi:
1. `node --check arquivo.js` em cada módulo, para sintaxe.
2. Simulação do ambiente do Apps Script em Node (`vm.createContext`) para testar `apps-script/*.gs` sem precisar de uma planilha real.
3. Testes de integração com `jsdom` servindo os arquivos por HTTP local e mockando `fetch`, cobrindo carregamento inicial, navegação, filtros, pesos do Score, troca de setor e cenários de erro de rede.

Se for adicionar uma funcionalidade nova, o ideal é replicar esse padrão: valide a lógica de negócio isolada (backend) antes de conectar ao frontend.

## Commits e Pull Requests

- Mensagens de commit em português, no imperativo ("Adiciona filtro de banco", não "Adicionado").
- Um PR por funcionalidade/correção — evite misturar mudanças não relacionadas.
- Descreva no PR: o que mudou, por quê, e como foi testado.
