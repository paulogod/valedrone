document.addEventListener('DOMContentLoaded', () => {
  const chatToggle = document.getElementById('chat-toggle');
  const chatWindow = document.getElementById('chat-window');
  const chatClose = document.getElementById('chat-close');
  const chatInput = document.getElementById('chat-input');
  const chatSend = document.getElementById('chat-send');
  const chatMessages = document.getElementById('chat-messages');
  const chatInputArea = document.getElementById('chat-input-area');

  // Elementos do Login
  const loginScreen = document.getElementById('chat-login-screen');
  const loginName = document.getElementById('login-name');
  const loginEmail = document.getElementById('login-email');
  const loginPhone = document.getElementById('login-phone');
  const loginStartBtn = document.getElementById('login-start-btn');

  // Dados do usuário
  let userData = null;

  // Lógica de Login
  loginStartBtn.addEventListener('click', () => {
    const name = loginName.value.trim();
    const email = loginEmail.value.trim();
    const phone = loginPhone.value.trim();

    if (!name || !email || !phone) {
      alert("Por favor, preencha todos os campos para iniciar o atendimento.");
      return;
    }

    userData = { name, email, phone };

    // Esconde login, mostra chat
    loginScreen.classList.add('hidden');
    chatMessages.classList.remove('hidden');
    chatInputArea.classList.remove('hidden');

    // Mensagem de boas vindas personalizada
    const welcomeMsg = `Olá, ${name}! Sou o assistente virtual da ValeDrone. Como posso te ajudar hoje?`;
    addMessage(welcomeMsg, 'bot');
    chatHistory += `Assistente: ${welcomeMsg}\n`;

    chatInput.focus();
  });

  // Abrir e fechar a janela
  chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    if (!chatWindow.classList.contains('hidden') && userData) {
      chatInput.focus();
    }
  });

  chatClose.addEventListener('click', () => {
    // Esconde o chat visualmente
    chatWindow.classList.add('hidden');

    // Se o usuário interagiu, envia silenciosamente para o WhatsApp via backend
    if (userData && chatHistory.length > 10) {
      let waText = `*Novo Contato via Site*\n`;
      waText += `Nome: ${userData.name}\n`;
      waText += `E-mail: ${userData.email}\n`;
      waText += `Telefone: ${userData.phone}\n\n`;
      waText += `*Histórico da Conversa:*\n`;
      waText += chatHistory;

      // Faz o envio para o nosso backend
      fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: waText })
      })
      .then(response => {
        if (!response.ok) {
          console.error('Falha ao enviar notificação WhatsApp pelo backend.');
        }
      })
      .catch(err => console.error('Erro na requisição para o backend:', err));
    }
  });

  // O contexto que dá personalidade à IA
  const systemContext = `Você é um assistente virtual útil e amigável da empresa ValeDrone.
A ValeDrone trabalha com filmagens aéreas usando drones, tours panorâmicos 360 graus e cobertura de eventos, imóveis e obras.
Responda de forma curta, prestativa e objetiva.`;

  // Histórico básico para não perder o contexto
  let chatHistory = "";

  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Adiciona msg do usuário
    addMessage(text, 'user');
    chatInput.value = '';

    // Mostra indicador de carregamento
    const loadingId = addMessage('...', 'bot', true);

    try {
      // Monta o prompt incluindo o contexto
      const promptText = `${systemContext}\n\nHistórico:\n${chatHistory}\nUsuário: ${text}\nAssistente:`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: promptText }),
      });

      if (!response.ok) {
        throw new Error('Erro na comunicação com o backend');
      }

      const data = await response.json();
      removeMessage(loadingId);

      // O backend retorna a resposta como 'response'
      const botResponse = data.response;
      addMessage(botResponse, 'bot');

      // Atualiza histórico
      chatHistory += `Usuário: ${text}\nAssistente: ${botResponse}\n`;

    } catch (error) {
      console.error(error);
      removeMessage(loadingId);
      addMessage('Erro: Não foi possível comunicar com o servidor. Tente novamente mais tarde.', 'bot error');
    }
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

    // Rola para o final
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return msgDiv.id;
  }

  function removeMessage(id) {
    const msg = document.getElementById(id);
    if (msg) {
      msg.remove();
    }
  }

  // Eventos de envio
  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
});
