# Guia de Instalação — Infinity Analytics v1.0

## Parte 1 — Preparar a planilha (pule se já tiver a sua)

1. Crie uma planilha em [sheets.google.com](https://sheets.google.com).
2. Renomeie a primeira aba para exatamente **`QUITAÇÕES VENCIDAS`** e crie uma segunda aba **`APREENSÕES`**.
   > Nomes diferentes? Ajuste `Config.ABAS` em `apps-script/Config.gs`.
3. Importe os modelos prontos (`docs/modelo_QUITACOES_VENCIDAS.csv` e `docs/modelo_APREENSOES.csv`) via Arquivo → Importar, ou cole seus dados reais respeitando os cabeçalhos.

## Parte 2 — Publicar a API (Google Apps Script)

1. Na planilha: **Extensões → Apps Script**.
2. Apague o arquivo `Código.gs` padrão.
3. Crie **8 arquivos** no editor (ícone `+` ao lado de "Arquivos"), um para cada arquivo da pasta `apps-script/` deste repositório:
   `Code.gs`, `Config.gs`, `Utils.gs`, `Cache.gs`, `Spreadsheet.gs`, `KPIService.gs`, `DashboardService.gs`, `Router.gs`.
4. Copie o conteúdo de cada arquivo `.gs` deste repositório para o arquivo correspondente no editor. **A ordem dos arquivos na lista não importa** — todos rodam no mesmo escopo.
5. Salve (Ctrl+S).
6. **Implantar → Nova implantação → tipo "App da Web"**.
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
7. Implante, autorize as permissões pedidas, copie a **URL do app da Web** (termina em `/exec`).

### Testando a API isoladamente
No editor do Apps Script, selecione a função `testarLeituraBasica` no menu de funções (topo) e clique em ▶ Executar. Veja o resultado em **Ver → Registros de execução**. Se aparecerem os dois setores com contagens corretas, a leitura está funcionando.

Depois, cole a URL no navegador com `?setor=todos` no final — deve aparecer um JSON grande com `kpis`, `graficos`, `rankings` etc.

## Parte 3 — Conectar o dashboard

1. Abra `assets/js/config.js`.
2. Cole a URL copiada em `API_BASE_URL`.
3. Sirva os arquivos localmente (não dê duplo clique — veja abaixo por quê) ou publique no GitHub Pages (`docs/PUBLICAR_GITHUB_PAGES.md`).

### Servindo localmente
Abrir `index.html` com duplo clique carrega a página como `file://`, e a maioria dos navegadores **bloqueia** por segurança que uma página `file://` faça requisições a APIs externas — o dashboard vai mostrar um banner de erro mesmo com tudo configurado certo.

**Com Python instalado:**
```
cd pasta-do-projeto
python -m http.server 8000
```
Abra `http://localhost:8000`.

**Com VS Code:** instale a extensão **Live Server**, abra a pasta do projeto (File → Open Folder — a pasta inteira, não o arquivo), clique com o botão direito no `index.html` **dentro do painel do VS Code** → "Open with Live Server".

## Problemas comuns

| Sintoma | Causa provável | Correção |
|---|---|---|
| URL retorna página de login do Google | Implantação não está com acesso "Qualquer pessoa" | Implantar → Gerenciar implantações → editar → corrigir acesso |
| Editou o código mas nada muda | Implantação antiga ainda ativa | Implantar → Gerenciar implantações → editar → **Nova versão** → Implantar |
| "Aba não encontrada" | Nome da aba não bate com `Config.ABAS` | Ajuste `Config.gs` |
| Números/datas zerados | Cabeçalho da coluna não reconhecido | Adicione o nome exato da sua coluna na lista de candidatos em `Config.gs` |
| Banner vermelho mesmo com URL certa | Abriu com duplo clique (`file://`) | Sirva localmente (ver acima) |
| Texto cru de JavaScript aparece na tela | Arquivo `.html` corrompido/incompleto no download | Baixe o arquivo de novo, confirme o tamanho antes de abrir |
