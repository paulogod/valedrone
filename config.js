// Configuration file - values are injected by GitHub Actions during build
const CONFIG = {
  CALLMEBOT_API_KEY: process.env.CALLMEBOT_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  WHATSAPP_PHONE: process.env.WHATSAPP_PHONE || ''
};

// Make CONFIG available globally
window.CONFIG = CONFIG;