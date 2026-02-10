# Vale Drone — Site e Hospedagem (valedrone.com.br)

Guia para colocar o site no ar com **menor custo** usando GitHub Pages e configurar e-mail no domínio.

---

## 1. Site na nuvem (custo zero com GitHub Pages)

### Por que GitHub Pages?
- **Grátis** para sites estáticos
- HTTPS automático
- Fácil de atualizar (git push)
- Funciona bem para fotos, vídeos e tours 360°

### Passo a passo

1. **Criar conta no GitHub** (se ainda não tiver): [github.com](https://github.com)

2. **Criar um repositório** para o site:
   - Nome sugerido: `valedrone` ou `valedrone-site`
   - Deixe **público**
   - **Não** marque "Add a README" (você já tem os arquivos localmente)

3. **Publicar este projeto no repositório** (no PowerShell, na pasta do projeto):
   ```powershell
   git init
   git add .
   git commit -m "Site inicial Vale Drone"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/valedrone.git
   git push -u origin main
   ```

4. **Ativar o GitHub Pages** no repositório:
   - Repositório → **Settings** → **Pages**
   - Em "Source" escolha: **Deploy from a branch**
   - Branch: **main**, pasta: **/ (root)**
   - Salve. Em 1–2 minutos o site fica em: `https://SEU_USUARIO.github.io/valedrone/`

5. **Apontar seu domínio (valedrone.com.br)**:
   - No seu **registro do domínio** (Registro.br, GoDaddy, etc.):
     - Crie um registro **CNAME**: `www` → `SEU_USUARIO.github.io`
     - Ou **A** para o domínio raiz: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - No repositório do GitHub: **Settings** → **Pages** → em "Custom domain" coloque: `www.valedrone.com.br` ou `valedrone.com.br`
   - Marque **Enforce HTTPS** depois que o DNS propagar (pode levar até 48h).

---

## 2. E-mail no domínio (contato@valedrone.com.br)

O GitHub **não** oferece e-mail. Opções baratas/fáceis:

| Opção | Custo | Dificuldade | Observação |
|-------|--------|-------------|------------|
| **Zoho Mail** | Grátis até 5 usuários (domínio próprio) | Fácil | Recomendado para começar |
| **ImprovMX** | Grátis (encaminar para Gmail/Outlook) | Muito fácil | Só encaminamento, não caixa de entrada própria |
| **Registro.br** | Pago (se domínio for .br) | Média | E-mail incluso em alguns planos |
| **Google Workspace** | Pago (~R$ 34/usuário/mês) | Fácil | contato@valedrone.com.br com Gmail |

### Recomendações rápidas

- **Só quer receber em contato@valedrone.com.br?**  
  Use **ImprovMX**: crie conta, adicione o domínio, configure MX no registro do domínio e encaminhe para seu Gmail/Outlook. **Grátis.**

- **Quer caixa de entrada própria (contato@, orcamento@, etc.)?**  
  Use **Zoho Mail** (plano gratuito com domínio próprio).

### Configurar ImprovMX (grátis, em poucos minutos)

1. Acesse [improvmx.com](https://improvmx.com) e crie conta.
2. Adicione o domínio `valedrone.com.br`.
3. ImprovMX vai mostrar os registros **MX** que você deve criar no painel do domínio.
4. No registro do domínio, apague os MX antigos (se houver) e coloque os que o ImprovMX indicar.
5. No ImprovMX, crie o alias `contato` e encaminhe para seu e-mail pessoal.
6. Depois da propagação do DNS (até 24–48h), e-mails para `contato@valedrone.com.br` chegam na sua caixa pessoal.

---

## 3. Otimizar para filmagem de drones e tour panorâmico

O site que está nesta pasta já inclui:

- **Página inicial** com foco em serviços de drone e 360°.
- **Seção de tour panorâmico** preparada para uso com **Pannellum** (visualizador 360° open source, leve).
- **Vídeos**: use hospedagem externa (YouTube, Vimeo) e embed no site para não pesar no GitHub Pages e evitar limite de banda.
- **Galeria de fotos**: imagens otimizadas (WebP quando possível, tamanho moderado) para carregamento rápido.

### Tour 360° (panorâmico)

- **Pannellum**: sem custo, só HTML/JS. Você gera as imagens 360° no drone ou no celular e coloca na pasta do projeto.
- **Marzipano** (Google): também gratuito, alternativa ao Pannellum.
- Coloque as imagens panorâmicas em uma pasta (ex.: `panoramas/`) e referencie no HTML; o guia de uso está em `panoramas/README.md` (se existir) ou na seção do tour no próprio site.

### Dicas de desempenho

- Comprima fotos (TinyPNG, Squoosh) antes de subir.
- Use **lazy loading** nas imagens (`loading="lazy"`).
- Vídeos: sempre em YouTube/Vimeo e embed; evite arquivos MP4 pesados no repositório.

---

## Resumo de custos

| Item | Custo |
|------|--------|
| Domínio valedrone.com.br | Você já tem |
| Site (GitHub Pages) | **R$ 0** |
| E-mail (ImprovMX ou Zoho free) | **R$ 0** |
| **Total** | **R$ 0** (só o domínio que você já pagou) |

Se quiser, depois podemos adicionar formulário de contato (ex.: Formspree ou Netlify Forms) ou analytics. Basta seguir este README e depois ir ajustando o conteúdo do site na pasta do projeto.
