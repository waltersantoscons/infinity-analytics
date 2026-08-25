# Publicar no GitHub Pages

Esta etapa só pode ser feita por você — publicar exige acesso à sua conta do GitHub, que eu não tenho.

## Passo a passo

1. Crie um repositório novo no GitHub (pode ser privado ou público — GitHub Pages funciona nos dois em contas com plano pago; em contas gratuitas, só repositórios públicos têm Pages disponível de graça).
2. Suba todo o conteúdo desta pasta (`index.html`, `assets/`, `apps-script/`, `docs/`, `README.md` etc.) para o repositório:

   **Pelo site do GitHub (sem usar linha de comando):**
   - No repositório vazio, clique em "uploading an existing file"
   - Arraste todos os arquivos e pastas
   - Escreva uma mensagem de commit (ex.: "Versão inicial v1.0") e confirme

   **Pelo terminal (se preferir Git):**
   ```
   git init
   git add .
   git commit -m "Infinity Analytics v1.0"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

3. No repositório, vá em **Settings → Pages** (menu lateral esquerdo).
4. Em "Build and deployment" → "Source", selecione **Deploy from a branch**.
5. Em "Branch", selecione **main** e a pasta **/ (root)** → **Save**.
6. Aguarde 1-2 minutos. O GitHub mostra a URL pública no topo da mesma página (algo como `https://seu-usuario.github.io/seu-repositorio/`).

## Depois de publicado

- Qualquer push para a branch `main` atualiza o site automaticamente em alguns minutos.
- **Antes de subir**, confirme que `assets/js/config.js` já está com a URL real do seu Apps Script — o arquivo vai ficar público no repositório (se o repositório for público, a URL da API fica visível a qualquer pessoa; ela só permite leitura, mas avalie se isso é aceitável para o seu caso, ou use um repositório privado).
