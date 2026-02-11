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

5. **Apontar seu domínio (valedrone.com.br)** — veja a seção **DNS (erro InvalidDNSError)** abaixo.

---

## DNS — Corrigir "Improperly configured" / InvalidDNSError

Se o GitHub mostrar **"Both www.valedrone.com.br and its alternate name are improperly configured"** ou **"Domain's DNS record could not be retrieved (InvalidDNSError)"**, o DNS do domínio ainda não está correto ou não propagou. Siga um dos fluxos abaixo.

### Opção A: Usar só **www.valedrone.com.br** (mais simples)

1. **No painel do domínio (Registro.br, GoDaddy, etc.)**
   - Vá em **DNS** / **Zona DNS** / **Configurar endereçamento**.
   - **Remova** entradas antigas de **www** ou do domínio raiz que apontem para outra coisa (ex.: “estacionado”, “parked”).
   - Adicione **um** registro:
     - **Tipo:** CNAME  
     - **Nome/Host:** `www` (só isso, sem .valedrone.com.br)  
     - **Destino/Valor:** `SEU_USUARIO.github.io`  
       → Troque **SEU_USUARIO** pelo seu login do GitHub (ex.: `paulo` → `paulo.github.io`).
   - Salve as alterações.

2. **No GitHub**
   - Repositório → **Settings** → **Pages** → **Custom domain**.
   - Digite **apenas:** `www.valedrone.com.br` (com www).
   - Clique em **Save**. Não marque **Enforce HTTPS** ainda.

3. **Aguarde a propagação**
   - Pode levar de **alguns minutos até 24–48 horas**.
   - Para conferir: [whatsmydns.net](https://www.whatsmydns.net) → pesquise `www.valedrone.com.br` → tipo **CNAME**. Deve mostrar `SEU_USUARIO.github.io`.

4. **Quando o DNS estiver certo**
   - O GitHub deve mostrar o domínio como verificado (✓).
   - Aí sim marque **Enforce HTTPS**.

### Opção B: Usar **valedrone.com.br** (sem www) e **www**

- **Domínio raiz (valedrone.com.br):** no Registro.br não existe ALIAS; use **4 registros A** com o mesmo nome (ou @):
  - Nome: `@` ou em branco (domínio raiz)  
  - Tipo: **A**  
  - Valores (um registro A para cada IP):
    - `185.199.108.153`
    - `185.199.109.153`
    - `185.199.110.153`
    - `185.199.111.153`
- **www:** como na Opção A (CNAME `www` → `SEU_USUARIO.github.io`).
- No GitHub, em **Custom domain**, use `valedrone.com.br`. Se quiser que quem digitar `www` também caia no site, o CNAME do www já resolve.

### Checklist rápido

| O que verificar | Correto |
|-----------------|--------|
| CNAME **www** aponta para | `SEU_USUARIO.github.io` (nada depois: sem `/valedrone`) |
| No GitHub está escrito | `www.valedrone.com.br` (se escolheu Opção A) ou `valedrone.com.br` (se escolheu B) |
| Não há outro CNAME/A conflitando para **www** ou raiz | Remova “estacionado” / “parked” |
| Salvou a zona DNS no provedor do domínio? | Sim |
| Esperou propagação (minutos a 48h)? | Depois disso o GitHub consegue “enxergar” o DNS |

### Erro "NotServedByPagesError" — "Domain does not resolve to the GitHub Pages server"

Esse erro aparece quando o **DNS até responde**, mas **não está apontando para os servidores do GitHub**. Causa muito comum:

- Você colocou **valedrone.com.br** (sem www) no campo "Custom domain" do GitHub.
- O GitHub verifica **os dois**: `valedrone.com.br` **e** `www.valedrone.com.br` ("alternate name").
- No **domínio raiz** (valedrone.com.br) **não pode usar CNAME** no Registro.br — CNAME no apex não resolve para o GitHub. Por isso o domínio raiz "não é servido" pelo Pages.

**Solução (escolha uma):**

**Solução 1 — Só www (mais rápido)**  
1. No GitHub: em **Custom domain** troque para **só** `www.valedrone.com.br` (com www).  
2. No DNS: tenha **só** o CNAME `www` → `SEU_USUARIO.github.io`.  
3. Não use o domínio raiz no GitHub por enquanto. Assim o GitHub só verifica o www e o erro some.  
4. Quem acessar **www.valedrone.com.br** verá o site. Quem digitar **valedrone.com.br** pode não abrir até você configurar a Solução 2.

**Solução 2 — Domínio raiz + www (recomendado)**  
Para o GitHub aceitar **valedrone.com.br** no campo Custom domain, **os dois** têm de apontar para o GitHub:

1. **No DNS do domínio** (Registro.br etc.):  
   - **www:** CNAME `www` → `SEU_USUARIO.github.io` (já feito).  
   - **Domínio raiz (valedrone.com.br):** crie **4 registros A** (um para cada IP), todos com nome `@` ou em branco:  
     `185.199.108.153` · `185.199.109.153` · `185.199.110.153` · `185.199.111.153`  
   - **Remova** qualquer registro A antigo do domínio raiz (estacionado/parked) para não conflitar.  
2. **No GitHub:** em Custom domain use `valedrone.com.br`.  
3. Aguarde a propagação do DNS (até 24–48 h). Confira em [whatsmydns.net](https://www.whatsmydns.net): pesquisa por `valedrone.com.br` tipo **A** — deve listar os 4 IPs acima.

Resumo: **NotServedByPagesError** no domínio raiz = falta os **4 registros A** no apex. CNAME só vale para **www**.

### Se ainda der erro

- Confirme o **usuário do GitHub** (o que aparece em github.com/SEU_USUARIO). O destino do CNAME é **exatamente** `SEU_USUARIO.github.io`.
- Use [whatsmydns.net](https://www.whatsmydns.net): se lá ainda não mostrar o CNAME ou os A corretos, o GitHub continuará com erro até propagar.
- Tente **só** `www.valedrone.com.br` primeiro (Opção A); depois que estiver verde, adicione os 4 A para o domínio raiz (Opção B) se quiser.

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
