# Modelo3D – Correções para carregar `data/Base.xlsx` no GitHub Pages

Este pacote contém um exemplo funcional que evita erros **HTTP 404** ao buscar `./data/Base.xlsx` em um site hospedado no **GitHub Pages**.

## O que foi corrigido

1. **Resolução de caminho para Pages**: quando um projeto roda em `https://usuario.github.io/REPO/…`, caminhos relativos simples como `./data/Base.xlsx` podem quebrar dependendo da página atual. O script agora calcula a base correta (`https://usuario.github.io/REPO/`) e gera uma URL absoluta robusta.
2. **Fallback automático para `raw.githubusercontent.com`**: se o arquivo não for encontrado no site publicado (por ex., porque não está na mesma pasta que o `index.html` usado pelo Pages), o loader tenta buscar diretamente no repositório, em `https://raw.githubusercontent.com/USUARIO/REPO/BRANCH/data/Base.xlsx`.
3. **Case sensitivity e origem de publicação**: GitHub é sensível a maiúsculas/minúsculas. Certifique-se de que o nome do arquivo é exatamente `data/Base.xlsx`. Além disso, se você publica a partir da pasta **/docs**, o arquivo **precisa** estar dentro de `/docs/data/Base.xlsx`.
4. **`.nojekyll`**: incluímos este arquivo para evitar que o Jekyll interfira na publicação de arquivos estáticos.

## Como usar no seu repositório `modelo3d`

1. **Escolha a origem do GitHub Pages**:
   - *Configurações do repositório → Pages*: selecione **Branch: `main`** e **Folder: `/ (root)`** ou **`/docs`**. Se escolher `/docs`, mova tudo do exemplo para dentro de `docs/` no seu repositório.
2. **Garanta a presença do arquivo**: coloque seu Excel em `data/Base.xlsx` (mesma caixa de letras) no mesmo diretório base publicado pelo Pages.
3. **Copie os arquivos deste ZIP** para o seu repositório:
   - `index.html`
   - `js/loadExcel.js`
   - `data/Base.xlsx` (exemplo; substitua pelo seu)
   - `.nojekyll`
4. **Ajuste (se necessário)** o caminho relativo no `index.html` (parâmetro `relativePath`) e o **branch** no `loadExcelSmart` caso não seja `main`.
5. **Teste localmente** abrindo `index.html` e, depois, acesse o endereço do Pages `https://SEU-USUARIO.github.io/modelo3d/`.

## Dicas de diagnóstico

- Acesse diretamente a URL publicada do arquivo, sem query-string, por exemplo: `https://SEU-USUARIO.github.io/modelo3d/data/Base.xlsx`. Se retornar 404, o arquivo **não está sendo publicado** (provavelmente está fora da pasta fonte do Pages ou com nome/caso divergente).
- Confira no repositório se o caminho **exato** é `data/Base.xlsx`.
- Se você estiver publicando a partir de `/docs`, o caminho correto passa a ser `docs/data/Base.xlsx` **no Git**, mas a URL publicada continua sendo `/data/Base.xlsx`.

## Licença
Livre para uso.
