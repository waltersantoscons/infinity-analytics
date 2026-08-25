# Próximos Passos e Roadmap

## O que está pronto (v1.0)

- API própria (Google Apps Script) com regras de negócio centralizadas.
- Dois setores: Quitações Vencidas (completo: Dashboard, Financeiro, ROI/Curva ABC, Score, Simulador, Ranking, Clientes, Operacional, Configurações) e Apreensões (Visão Geral, Rankings, Resumo Mensal).
- Filtros: UF, Modelo, Status, faixas numéricas, período, busca textual.
- Score Econômico com pesos configuráveis, recalculado no backend.
- Exportações Excel/CSV/PDF.
- Sincronização automática + manual, com tratamento de erro e nova tentativa automática.

## O que eu não pude validar

Todo o backend e frontend foram testados com **ambientes simulados** (Apps Script e navegador simulados via Node.js) — não tenho acesso a uma conta Google ou GitHub reais para testar contra a sua planilha e repositório de verdade. Depois de seguir o guia de instalação, se algo se comportar diferente do testado, isso é esperado como próximo passo de ajuste fino, não como sinal de que o sistema está mal construído.

## Roadmap

### v2.0 — Cadastro e autenticação
- Login de usuários (ex.: Google OAuth via Apps Script, ou tabela de usuários própria).
- Controle de permissões (quem vê Quitações, quem vê Apreensões, quem pode mudar pesos do Score).
- Auditoria de quem alterou o quê.

### v3.0 — CRM, financeiro, IA e automações
- Integração com CRM (histórico de contato por cliente).
- Módulo financeiro consolidado entre os dois setores.
- IA para sugerir priorização além do Score Econômico (ex.: propensão a pagamento).
- Notificações automáticas (WhatsApp/e-mail) para clientes prioritários.
- Migração opcional de Google Sheets para um banco de dados dedicado (Firebase/MySQL/PostgreSQL) — a arquitetura atual isola isso em `Spreadsheet.gs`, então essa troca não deveria exigir reescrever o resto do sistema.

## Limitações conhecidas (aceitas conscientemente no v1.0)

- **"Economia por Fundo"** não existe como gráfico — a coluna `FUNDO` na planilha é um valor monetário, não uma categoria. Documentado em `docs/ARQUITETURA.md`.
- **Filtros aplicam-se no navegador** sobre o conjunto de dados já carregado (não fazem uma nova chamada à API a cada mudança) — decisão de performance, documentada em `docs/ARQUITETURA.md`.
- **Sem autenticação** — qualquer pessoa com a URL da API ou do dashboard pode ler os dados. Planejado para v2.0.
