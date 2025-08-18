
# Dashboard 3D de Barragem (para GitHub Pages)

Este pacote contém duas páginas:

- **index.html** → Versão DEMO (dados fixos) pronta para apresentação.
- **data_from_excel.html** → Versão gerada a partir do seu `Base.xlsx` (snapshot embutido no HTML).

## Como publicar no GitHub Pages
1. Crie um repositório novo no GitHub e faça upload destes arquivos (ou envie o ZIP e extraia).
2. Vá em **Settings → Pages** e em **Build and deployment** selecione **Deploy from branch**.
3. Selecione a branch (`main`/`master`) e a pasta **/root**. Salve.
4. Acesse a URL mostrada pelo GitHub (ex.: `https://usuario.github.io/repositorio/`).
   - A página padrão abre `index.html` (DEMO).
   - Para a versão baseada na planilha, abra `data_from_excel.html`.

> Dica: se quiser que a página da planilha seja a principal, renomeie `data_from_excel.html` para `index.html`.

## Observações
- O 3D usa **Three.js** via CDN (unpkg). Não requer backend.
- O botão **Tela cheia** usa a Fullscreen API (precisa de ação do usuário, por isso há um botão).
- Para trocar as coordenadas e métricas das áreas, edite o array `DATA` no `<script type="module">`.
- Se for integrar coordenadas reais (UTM/XYZ), substitua `x, y, z, height` para cada área.

## Suporte
Se precisar, me diga que eu ajusto a distribuição das áreas, cores ou métricas conforme sua planilha.
