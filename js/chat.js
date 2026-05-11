document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.getElementById('chat-toggle');
  const chatWindow = document.getElementById('chat-window');
  const chatClose = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  const chatInputArea = document.getElementById('chat-input-area');
  const loginScreen = document.getElementById('chat-login-screen');
  const loginName = document.getElementById('login-name');
  const loginEmail = document.getElementById('login-email');
  const loginPhone = document.getElementById('login-phone');
  const loginConsent = document.getElementById('login-consent');
  const loginStartBtn = document.getElementById('login-start-btn');

  const MAX_NAME_LENGTH = 80;
  const MAX_EMAIL_LENGTH = 120;
  const MAX_PHONE_LENGTH = 20;
  const MAX_MESSAGE_LENGTH = 1000;
  const MAX_HISTORY_LENGTH = 6000;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\+?[0-9\s().-]{10,20}$/;

  const config = window.CONFIG || {};
  const apiBaseUrl = normalizePublicConfig(config.CHAT_API_BASE_URL);
  const whatsappPhone = normalizePublicConfig(config.WHATSAPP_PHONE);

  let userData = null;
  let chatHistory = '';

  loginStartBtn.addEventListener('click', () => {
    const name = loginName.value.trim();
    const email = loginEmail.value.trim();
    const phone = loginPhone.value.trim();

    if (!isValidLead(name, email, phone)) {
      alert('Preencha nome, e-mail e WhatsApp válidos para iniciar o atendimento.');
      return;
    }

    if (loginConsent && !loginConsent.checked) {
      alert('Confirme a autorização para retorno do atendimento.');
      return;
    }

    userData = { name, email, phone };
    loginScreen.classList.add('hidden');
    chatMessages.classList.remove('hidden');
    chatInputArea.classList.remove('hidden');

    const welcomeMsg = `Olá, ${name}! Sou o assistente virtual da ValeDrone. Como posso te ajudar hoje?`;
    addMessage(welcomeMsg, 'bot');
    appendHistory(`Assistente: ${welcomeMsg}`);
    chatInput.focus();
  });

  chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden') && userData) {
      chatInput.focus();
    }
  });

  chatClose.addEventListener('click', () => {
    chatWindow.classList.add('hidden');

    if (userData && chatHistory.length > 10) {
      sendLead().catch(error => {
        console.error('Erro ao registrar atendimento:', error);
      });
    }
  });

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    if (text.length > MAX_MESSAGE_LENGTH) {
      addMessage('Mensagem muito longa. Envie uma versão mais curta.', 'bot error');
      return;
    }

    addMessage(text, 'user');
    appendHistory(`Usuário: ${text}`);
    chatInput.value = '';

    const loadingId = addMessage('...', 'bot', true);

    try {
      const botResponse = apiBaseUrl
        ? await requestBotResponse(text)
        : localBotResponse(text);

      removeMessage(loadingId);
      addMessage(botResponse, 'bot');
      appendHistory(`Assistente: ${botResponse}`);
    } catch (error) {
      console.error(error);
      removeMessage(loadingId);
      addMessage('Erro: Não foi possível comunicar com o atendimento agora. Tente novamente mais tarde.', 'bot error');
    }
  }

  async function requestBotResponse(message) {
    const response = await fetch(`${apiBaseUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        history: chatHistory.slice(-MAX_HISTORY_LENGTH),
        user: userData
      })
    });

    if (!response.ok) {
      throw new Error('Erro na comunicação com o backend do chat');
    }

    const data = await response.json();
    if (!data || typeof data.reply !== 'string') {
      throw new Error('Resposta inválida do backend do chat');
    }

    return data.reply.slice(0, MAX_MESSAGE_LENGTH);
  }

  async function sendLead() {
    if (apiBaseUrl) {
      const response = await fetch(`${apiBaseUrl}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: userData,
          history: chatHistory.slice(-MAX_HISTORY_LENGTH)
        })
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar lead');
      }

      return;
    }

    if (whatsappPhone) {
      const summary = encodeURIComponent(`Olá! Sou ${userData.name} e gostaria de falar com a ValeDrone.`);
      window.open(`https://wa.me/${digitsOnly(whatsappPhone)}?text=${summary}`, '_blank', 'noopener');
    }
  }

  function localBotResponse(text) {
    const normalized = text.toLowerCase();

    if (normalized.includes('preço') || normalized.includes('valor') || normalized.includes('orçamento')) {
      return 'Para orçamento, preciso entender local, data, duração e tipo de entrega desejada. Envie esses detalhes ou fale pelo WhatsApp da ValeDrone.';
    }

    if (normalized.includes('360') || normalized.includes('tour') || normalized.includes('panor')) {
      return 'Fazemos tours panorâmicos 360 graus para imóveis, ambientes comerciais, obras e eventos. Informe o local e o objetivo do tour para estimarmos o projeto.';
    }

    if (normalized.includes('evento') || normalized.includes('casamento') || normalized.includes('obra') || normalized.includes('imóvel')) {
      return 'Atendemos eventos, imóveis e obras com imagens aéreas e vídeos. Conte a cidade, data e o tipo de captação que você precisa.';
    }

    if (normalized.includes('whatsapp') || normalized.includes('contato') || normalized.includes('telefone')) {
      return 'Você pode falar com a ValeDrone pelo WhatsApp informado na página de contato. Se preferir, deixe aqui os detalhes do atendimento.';
    }

    return 'Posso ajudar com filmagem aérea, tours 360 graus, eventos, imóveis e obras. Para avançar, me diga o serviço desejado, local e prazo.';
  }

  function addMessage(text, sender, isLoading = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    if (isLoading) {
      msgDiv.id = 'loading-msg';
    }

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    msgDiv.appendChild(contentDiv);
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgDiv.id;
  }

  function removeMessage(id) {
    const msg = document.getElementById(id);
    if (msg) {
      msg.remove();
    }
  }

  function appendHistory(line) {
    chatHistory = `${chatHistory}${line}\n`.slice(-MAX_HISTORY_LENGTH);
  }

  function isValidLead(name, email, phone) {
    return name.length > 0 &&
      name.length <= MAX_NAME_LENGTH &&
      email.length > 0 &&
      email.length <= MAX_EMAIL_LENGTH &&
      EMAIL_RE.test(email) &&
      phone.length > 0 &&
      phone.length <= MAX_PHONE_LENGTH &&
      PHONE_RE.test(phone);
  }

  function normalizePublicConfig(value) {
    if (!value || value.startsWith('__')) return '';
    return String(value).trim().replace(/\/+$/, '');
  }

  function digitsOnly(value) {
    return String(value).replace(/\D/g, '');
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
