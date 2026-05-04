// Configurações do site ValeDrone
// Os valores são injetados automaticamente pelo GitHub Actions durante o deploy.
// NÃO coloque chaves reais aqui — elas vêm dos Secrets do repositório.
const CONFIG = {
  GEMINI_API_KEY: '__GEMINI_API_KEY__',
  CALLMEBOT_API_KEY: '__CALLMEBOT_API_KEY__',
  WHATSAPP_PHONE: '__WHATSAPP_PHONE__'
};

window.CONFIG = CONFIG;