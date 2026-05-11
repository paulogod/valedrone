# ValeDrone chat proxy

Este Worker mantem as chaves do Gemini e do CallMeBot fora do navegador.

## Variaveis obrigatorias

- `GEMINI_API_KEY`: chave privada da API Gemini.
- `CALLMEBOT_API_KEY`: chave privada do CallMeBot.
- `WHATSAPP_PHONE`: numero de destino usado pelo CallMeBot.
- `ALLOWED_ORIGIN`: origem publica do site, por exemplo `https://valedrone.com.br`.

## Endpoints

- `POST /chat`: recebe `{ "message": "...", "history": "...", "user": {...} }` e retorna `{ "reply": "..." }`.
- `POST /lead`: recebe `{ "user": {...}, "history": "..." }` e encaminha o resumo para WhatsApp.

## Deploy

Na pasta `workers/`, publique com Wrangler depois de configurar os secrets:

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put CALLMEBOT_API_KEY
npx wrangler secret put WHATSAPP_PHONE
npx wrangler deploy
```

Depois de publicar o Worker, configure a variavel de repositorio `CHAT_API_BASE_URL` no GitHub com a URL do Worker. A variavel `WHATSAPP_PHONE` tambem pode ser definida como variavel publica do repositorio para o fallback de contato.
