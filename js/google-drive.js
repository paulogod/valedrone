/**
 * ValeDrone RPG & D&D 5.5 — Integração Google Login (Gmail) + Google Drive API v3
 *
 * Responsável por:
 * 1. Autenticação OAuth 2.0 via Google Identity Services (GIS).
 * 2. Armazenamento e sincronização das fichas dos jogadores no Google Drive de cada conta.
 * 3. Vínculo e sincronização contínua entre as fichas (/dnd) e a mesa do Mestre (/rpg).
 */
(function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'vd_google_auth';
  const CLIENT_ID_STORAGE_KEY = 'vd_google_client_id';
  const DEFAULT_GOOGLE_CLIENT_ID = '1056341849762-b2mul1a0f4ingn9bhinnpao7enon2i7n.apps.googleusercontent.com';
  const FOLDER_CACHE_PREFIX = 'vd_gdrive_folder_';
  const DRIVE_FOLDER_NAME = 'ValeDrone RPG - Fichas D&D 5.5';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive openid email profile';

  let gsiLoadPromise = null;
  let tokenClient = null;
  let activeClientId = null;

  function getClientId() {
    try {
      const saved = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
      if (saved && saved.trim()) return saved.trim();
    } catch (e) { /* ignore */ }
    const fromConfig = window.CONFIG && window.CONFIG.GOOGLE_CLIENT_ID;
    if (fromConfig && fromConfig !== '__GOOGLE_CLIENT_ID__' && fromConfig.trim() !== '') {
      return fromConfig.trim();
    }
    return DEFAULT_GOOGLE_CLIENT_ID;
  }

  function setClientId(clientId) {
    const clean = String(clientId || '').trim();
    try {
      if (clean) localStorage.setItem(CLIENT_ID_STORAGE_KEY, clean);
      else localStorage.removeItem(CLIENT_ID_STORAGE_KEY);
    } catch (e) { /* ignore */ }
    tokenClient = null;
    activeClientId = null;
  }

  function hasClientId() {
    return !!getClientId();
  }

  function getAuthState() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.accessToken || !parsed.expiresAt) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function isTokenValid(auth) {
    if (!auth || !auth.accessToken || !auth.expiresAt) return false;
    return Date.now() < (auth.expiresAt - 45000);
  }

  function isLoggedIn() {
    return isTokenValid(getAuthState());
  }

  function getUser() {
    const auth = getAuthState();
    return auth && auth.user ? auth.user : null;
  }

  function saveAuthState(auth) {
    try {
      if (auth) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
      else localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('vd-google-auth-changed', { detail: auth }));
  }

  window.addEventListener('storage', (ev) => {
    if (ev.key === AUTH_STORAGE_KEY) {
      window.dispatchEvent(new CustomEvent('vd-google-auth-changed', { detail: getAuthState() }));
    }
  });

  function loadGsiScript() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) {
      return Promise.resolve();
    }
    if (gsiLoadPromise) return gsiLoadPromise;
    gsiLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gsiLoadPromise = null;
        reject(new Error('Não foi possível carregar o serviço de login do Google (accounts.google.com).'));
      };
      document.head.appendChild(script);
    });
    return gsiLoadPromise;
  }

  async function fetchUserInfo(accessToken) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('Falha ao obter dados da conta Google.');
    return res.json();
  }

  async function login(options = {}) {
    const clientId = getClientId();
    if (!clientId) {
      const configured = await openClientIdModal();
      if (!configured) throw new Error('Client ID do Google não configurado.');
      return login(options);
    }

    await loadGsiScript();

    const prevAuth = getAuthState();
    const hintEmail = (options.loginHint || (prevAuth && prevAuth.user && prevAuth.user.email)) || '';

    return new Promise((resolve, reject) => {
      try {
        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              reject(new Error(tokenResponse.error_description || tokenResponse.error));
              return;
            }
            const accessToken = tokenResponse.access_token;
            const expiresIn = Number(tokenResponse.expires_in || 3599);
            const expiresAt = Date.now() + expiresIn * 1000;
            let user = (prevAuth && prevAuth.user) || { email: '', name: 'Usuário Google', picture: '' };
            try {
              const info = await fetchUserInfo(accessToken);
              user = {
                email: (info.email || '').toLowerCase().trim(),
                name: info.name || info.given_name || info.email || 'Jogador',
                picture: info.picture || '',
                sub: info.sub || ''
              };
            } catch (err) {
              console.warn('Aviso ao ler perfil Google:', err);
            }
            const newState = { accessToken, expiresAt, user };
            saveAuthState(newState);
            resolve(newState);
          },
          error_callback: (err) => {
            reject(new Error((err && err.message) || 'Janela de login fechada ou bloqueada.'));
          }
        });
        activeClientId = clientId;

        const reqConfig = {};
        if (options.prompt !== undefined) reqConfig.prompt = options.prompt;
        else if (!prevAuth) reqConfig.prompt = 'consent';
        if (hintEmail) reqConfig.hint = hintEmail;

        tokenClient.requestAccessToken(reqConfig);
      } catch (err) {
        reject(err);
      }
    });
  }

  function logout() {
    const auth = getAuthState();
    if (auth && auth.accessToken && window.google && window.google.accounts && window.google.accounts.oauth2) {
      try {
        window.google.accounts.oauth2.revoke(auth.accessToken, () => {});
      } catch (e) { /* ignore */ }
    }
    saveAuthState(null);
  }

  async function ensureValidToken(options = {}) {
    const auth = getAuthState();
    if (isTokenValid(auth)) return auth.accessToken;
    if (options.interactive || (auth && auth.user && auth.user.email)) {
      const refreshed = await login({
        prompt: options.interactive ? undefined : '',
        loginHint: auth && auth.user ? auth.user.email : undefined
      });
      return refreshed.accessToken;
    }
    throw new Error('Faça login com sua conta Google primeiro.');
  }

  async function driveFetch(url, options = {}, retryAuth = true) {
    const token = await ensureValidToken({ interactive: false });
    const headers = Object.assign({}, options.headers || {}, {
      Authorization: `Bearer ${token}`
    });
    const res = await fetch(url, Object.assign({}, options, { headers }));
    if (res.status === 401 && retryAuth) {
      // Token expirou: limpa validade e tenta renovar silenciosamente
      const current = getAuthState();
      if (current) {
        current.expiresAt = 0;
        saveAuthState(current);
      }
      const newToken = await ensureValidToken({ interactive: true });
      const retryHeaders = Object.assign({}, options.headers || {}, {
        Authorization: `Bearer ${newToken}`
      });
      return fetch(url, Object.assign({}, options, { headers: retryHeaders }));
    }
    return res;
  }

  // ==================== OPERAÇÕES GOOGLE DRIVE ====================

  async function ensureFolder() {
    const user = getUser();
    const cacheKey = FOLDER_CACHE_PREFIX + ((user && user.email) || 'default');
    try {
      const cachedId = localStorage.getItem(cacheKey);
      if (cachedId) {
        const check = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(cachedId)}?fields=id,trashed`);
        if (check.ok) {
          const meta = await check.json();
          if (meta && meta.id && !meta.trashed) return meta.id;
        }
      }
    } catch (e) { /* fallback para busca */ }

    const q = "mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='vdFolder' and value='fichas_dnd55' } and 'me' in owners and trashed = false";
    const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=5`;
    const searchRes = await driveFetch(searchUrl);
    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.files && data.files.length > 0) {
        const folderId = data.files[0].id;
        try { localStorage.setItem(cacheKey, folderId); } catch (e) {}
        return folderId;
      }
    }

    // Cria a pasta no Google Drive da conta logada
    const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        appProperties: { vdFolder: 'fichas_dnd55' }
      })
    });
    if (!createRes.ok) {
      const errTxt = await createRes.text();
      throw new Error('Não foi possível criar a pasta no Google Drive: ' + errTxt);
    }
    const folder = await createRes.json();
    try { localStorage.setItem(cacheKey, folder.id); } catch (e) {}
    return folder.id;
  }

  function buildMultipartBody(metadata, jsonObject, boundary) {
    const metaPart = JSON.stringify(metadata);
    const mediaPart = typeof jsonObject === 'string' ? jsonObject : JSON.stringify(jsonObject, null, 2);
    return (
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metaPart}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${mediaPart}\r\n` +
      `--${boundary}--`
    );
  }

  function safeProp(val, maxBytes = 80) {
    return String(val || '').trim().slice(0, maxBytes);
  }

  async function findFileByCharId(charId) {
    if (!charId) return null;
    const cleanId = safeProp(charId, 50).replace(/'/g, "\\'");
    const q = `appProperties has { key='vdType' and value='ficha_dnd55' } and appProperties has { key='vdCharId' and value='${cleanId}' } and 'me' in owners and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&pageSize=5`;
    const res = await driveFetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.files && data.files[0]) || null;
  }

  /**
   * Salva ou atualiza a ficha do personagem no Google Drive do jogador.
   */
  async function saveSheetToDrive(characterObj, options = {}) {
    if (!characterObj || !characterObj.id) throw new Error('Ficha inválida para salvar no Drive.');
    const user = getUser();
    const charName = (characterObj.name || '').trim() || 'Personagem Sem Nome';
    const level1 = +characterObj.level1 || 1;
    const level2 = characterObj.class2 && characterObj.class2 !== 'none' ? (+characterObj.level2 || 0) : 0;
    const totalLevel = level1 + level2;
    const fileName = `${charName} - Nível ${totalLevel}.dnd55.json`.replace(/[\\/:*?"<>|]+/g, '-');

    const mesaInfo = characterObj.mesaVinculada || {};
    const mesaId = safeProp(options.mesaId !== undefined ? options.mesaId : mesaInfo.mesaId, 45);
    const mestreEmail = safeProp(options.mestreEmail !== undefined ? options.mestreEmail : mesaInfo.mestreEmail, 75).toLowerCase();

    const appProperties = {
      vdType: 'ficha_dnd55',
      vdCharId: safeProp(characterObj.id, 50),
      vdMesa: mesaId,
      vdMestre: mestreEmail,
      vdBy: safeProp(options.updatedBy || 'jogador', 15)
    };

    let existingFileId = options.fileId || characterObj.driveFileId || (mesaInfo && mesaInfo.driveFileId) || null;
    if (existingFileId) {
      // Confere se o arquivo existe e não está na lixeira
      const check = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(existingFileId)}?fields=id,trashed`);
      if (!check.ok) {
        existingFileId = null;
      } else {
        const m = await check.json();
        if (!m || m.trashed) existingFileId = null;
      }
    }
    if (!existingFileId) {
      const found = await findFileByCharId(characterObj.id);
      if (found) existingFileId = found.id;
    }

    const payloadCopy = Object.assign({}, characterObj, {
      driveUpdatedAt: new Date().toISOString(),
      driveOwnerEmail: (user && user.email) || characterObj.driveOwnerEmail || ''
    });

    const boundary = '-------vd_boundary_' + Date.now().toString(36);

    if (existingFileId) {
      const metadata = { name: fileName, appProperties };
      const body = buildMultipartBody(metadata, payloadCopy, boundary);
      const res = await driveFetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingFileId)}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error('Erro ao atualizar ficha no Google Drive: ' + txt);
      }
      return res.json();
    } else {
      const folderId = await ensureFolder();
      const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
        appProperties
      };
      const body = buildMultipartBody(metadata, payloadCopy, boundary);
      const res = await driveFetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,appProperties',
        {
          method: 'POST',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body
        }
      );
      if (!res.ok) {
        const txt = await res.text();
        throw new Error('Erro ao criar ficha no Google Drive: ' + txt);
      }
      return res.json();
    }
  }

  /**
   * Compartilha o arquivo da ficha no Google Drive do jogador com o Gmail do Mestre
   * (e ativa permissão de link para garantir sincronização contínua sem bloqueio).
   */
  async function shareSheetWithMaster(fileId, mestreEmail) {
    if (!fileId) throw new Error('ID do arquivo no Drive ausente.');
    const cleanEmail = String(mestreEmail || '').trim().toLowerCase();

    if (cleanEmail && cleanEmail.includes('@')) {
      try {
        await driveFetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions?sendNotificationEmail=false`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
            body: JSON.stringify({
              role: 'writer',
              type: 'user',
              emailAddress: cleanEmail
            })
          }
        );
      } catch (e) {
        console.warn('Aviso ao compartilhar com e-mail específico do Mestre:', e);
      }
    }

    // Fallback: permite que qualquer pessoa com o link/ID da mesa sincronize
    try {
      await driveFetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({
            role: 'writer',
            type: 'anyone'
          })
        }
      );
    } catch (e) {
      console.warn('Aviso ao definir permissão de link da ficha:', e);
    }
  }

  /**
   * Lista todas as fichas de D&D 5.5 salvas no Google Drive do próprio jogador.
   */
  async function listMySheets() {
    const q = "appProperties has { key='vdType' and value='ficha_dnd55' } and 'me' in owners and trashed = false";
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&orderBy=modifiedTime desc&pageSize=50`;
    const res = await driveFetch(url);
    if (!res.ok) throw new Error('Falha ao listar fichas do Google Drive.');
    const data = await res.json();
    return data.files || [];
  }

  /**
   * Lista todas as fichas vinculadas a uma Mesa específica do Mestre (próprias ou compartilhadas pelos jogadores).
   */
  async function listMesaSheets(mesaId) {
    if (!mesaId) return [];
    const cleanMesa = safeProp(mesaId, 45).replace(/'/g, "\\'");
    const q = `appProperties has { key='vdType' and value='ficha_dnd55' } and appProperties has { key='vdMesa' and value='${cleanMesa}' } and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties,owners(displayName,emailAddress))&orderBy=modifiedTime desc&pageSize=50`;
    const res = await driveFetch(url);
    if (!res.ok) throw new Error('Falha ao buscar fichas vinculadas à mesa no Google Drive.');
    const data = await res.json();
    return data.files || [];
  }

  /**
   * Obtém apenas os metadados rápidos (modifiedTime, appProperties) de um arquivo no Drive.
   */
  async function getFileMeta(fileId) {
    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`
    );
    if (!res.ok) throw new Error('Arquivo não encontrado ou sem permissão no Google Drive.');
    return res.json();
  }

  /**
   * Baixa os metadados e o conteúdo JSON completo de uma ficha no Google Drive.
   */
  async function getFileJson(fileId) {
    const [metaRes, mediaRes] = await Promise.all([
      driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`),
      driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`)
    ]);
    if (!metaRes.ok || !mediaRes.ok) {
      throw new Error('Não foi possível ler a ficha no Google Drive.');
    }
    const meta = await metaRes.json();
    const data = await mediaRes.json();
    return { meta, data };
  }

  /**
   * Atualiza os dados de uma ficha vinculada no Google Drive a partir do painel do Mestre (/rpg).
   */
  async function updateLinkedSheetAsMaster(fileId, jsonDados, mesaId) {
    if (!fileId || !jsonDados) throw new Error('Dados insuficientes para atualizar ficha no Drive.');
    const boundary = '-------vd_mestre_' + Date.now().toString(36);
    const metadata = {
      appProperties: {
        vdType: 'ficha_dnd55',
        vdCharId: safeProp(jsonDados.id || '', 50),
        vdMesa: safeProp(mesaId || (jsonDados.mesaVinculada && jsonDados.mesaVinculada.mesaId) || '', 45),
        vdBy: 'mestre'
      }
    };
    const payload = Object.assign({}, jsonDados, {
      driveUpdatedAt: new Date().toISOString(),
      driveLastUpdatedBy: 'mestre'
    });
    const body = buildMultipartBody(metadata, payload, boundary);
    const res = await driveFetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error('Não foi possível gravar alterações na ficha do jogador: ' + txt);
    }
    return res.json();
  }

  async function deleteFile(fileId) {
    if (!fileId) return;
    await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ trashed: true })
    });
  }

  // ==================== BACKUP DA SESSÃO DO MESTRE (/rpg) ====================

  async function saveMasterSessionToDrive(sessionPayload) {
    const folderId = await ensureFolder();
    const q = "appProperties has { key='vdType' and value='rpg_master_session' } and 'me' in owners and trashed = false";
    const searchRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name)&pageSize=5`);
    let existingId = null;
    if (searchRes.ok) {
      const d = await searchRes.json();
      if (d.files && d.files[0]) existingId = d.files[0].id;
    }

    const boundary = '-------vd_session_' + Date.now().toString(36);
    const fileName = 'RPG Master - Sessão e Mesa.json';
    const appProperties = { vdType: 'rpg_master_session' };

    if (existingId) {
      const body = buildMultipartBody({ name: fileName, appProperties }, sessionPayload, boundary);
      const res = await driveFetch(
        `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id,modifiedTime`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body
        }
      );
      if (!res.ok) throw new Error('Falha ao atualizar sessão do Mestre no Drive.');
      return res.json();
    } else {
      const body = buildMultipartBody({ name: fileName, mimeType: 'application/json', parents: [folderId], appProperties }, sessionPayload, boundary);
      const res = await driveFetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime',
        {
          method: 'POST',
          headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
          body
        }
      );
      if (!res.ok) throw new Error('Falha ao criar arquivo de sessão do Mestre no Drive.');
      return res.json();
    }
  }

  async function loadMasterSessionFromDrive() {
    const q = "appProperties has { key='vdType' and value='rpg_master_session' } and 'me' in owners and trashed = false";
    const searchRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc&pageSize=5`);
    if (!searchRes.ok) return null;
    const d = await searchRes.json();
    if (!d.files || !d.files.length) return null;
    return getFileJson(d.files[0].id);
  }

  // ==================== MODAL DE CONFIGURAÇÃO DO CLIENT ID ====================

  function openClientIdModal() {
    return new Promise((resolve) => {
      let overlay = document.getElementById('vdGoogleConfigModal');
      if (overlay) overlay.remove();

      overlay = document.createElement('div');
      overlay.id = 'vdGoogleConfigModal';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.82);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;font-family:Inter,Outfit,sans-serif;';

      const currentId = getClientId();
      const originUrl = window.location.origin;

      overlay.innerHTML = `
        <div style="background:#111827;border:1px solid #334155;border-radius:14px;max-width:560px;width:100%;padding:1.5rem;color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <h3 style="margin:0;font-size:1.15rem;color:#f3e8ff;display:flex;align-items:center;gap:0.5rem;">
              🔑 Configurar Login com Google (OAuth Client ID)
            </h3>
            <button type="button" id="vdGcClose" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;">✕</button>
          </div>
          <p style="font-size:0.86rem;color:#cbd5e1;line-height:1.5;margin:0 0 0.75rem;">
            Para conectar o Gmail e salvar as fichas no Google Drive, informe o <strong>Client ID OAuth 2.0</strong> do Google Cloud (ou defina em <code>config.js</code> na chave <code>GOOGLE_CLIENT_ID</code>).
          </p>
          <details style="background:#1e293b;border:1px solid #334155;border-radius:8px;padding:0.65rem 0.85rem;margin-bottom:0.9rem;font-size:0.8rem;color:#cbd5e1;">
            <summary style="cursor:pointer;font-weight:600;color:#38bdf8;">📋 Passo a passo rápido no Google Cloud Console</summary>
            <ol style="margin:0.5rem 0 0 1.1rem;padding:0;line-height:1.55;">
              <li>Acesse <a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank" rel="noopener" style="color:#38bdf8;">Google Cloud Console — Google Drive API</a> e clique em <strong>Ativar</strong>.</li>
              <li>Em <strong>Tela de permissão OAuth (OAuth consent screen)</strong>, escolha <em>Externo</em>, preencha o nome do app (ex: <em>ValeDrone RPG</em>) e adicione os e-mails da mesa em <em>Usuários de teste</em> (ou publique o app).</li>
              <li>Em <strong>Credenciais → Criar credenciais → ID do cliente OAuth</strong>, escolha <strong>Aplicativo da Web</strong>.</li>
              <li>Em <strong>Origens JavaScript autorizadas</strong>, adicione: <code style="color:#fbbf24;">${originUrl}</code> e <code style="color:#fbbf24;">https://valedrone.com.br</code></li>
              <li>Copie o <strong>ID do cliente</strong> (termina com <code>.apps.googleusercontent.com</code>) e cole abaixo.</li>
            </ol>
          </details>
          <form id="vdGcForm">
            <label style="display:block;font-size:0.8rem;color:#94a3b8;margin-bottom:0.35rem;">Google OAuth Client ID</label>
            <input type="text" id="vdGcInput" value="${currentId.replace(/"/g, '&quot;')}" placeholder="1234567890-abcdefg.apps.googleusercontent.com" required
              style="width:100%;box-sizing:border-box;padding:0.65rem 0.75rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:0.88rem;margin-bottom:1rem;">
            <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
              <button type="button" id="vdGcCancel" style="padding:0.5rem 0.95rem;border-radius:8px;border:1px solid #475569;background:#1e293b;color:#e2e8f0;cursor:pointer;font-size:0.85rem;">Cancelar</button>
              <button type="submit" style="padding:0.5rem 1.1rem;border-radius:8px;border:none;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-weight:600;cursor:pointer;font-size:0.85rem;">Salvar e Continuar</button>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(overlay);
      const input = overlay.querySelector('#vdGcInput');
      setTimeout(() => input && input.focus(), 50);

      const close = (val) => {
        overlay.remove();
        resolve(val);
      };

      overlay.querySelector('#vdGcClose').onclick = () => close(false);
      overlay.querySelector('#vdGcCancel').onclick = () => close(false);
      overlay.querySelector('#vdGcForm').onsubmit = (e) => {
        e.preventDefault();
        const v = input.value.trim();
        if (!v) return;
        setClientId(v);
        close(true);
      };
    });
  }

  window.VDGoogleDrive = {
    getClientId,
    setClientId,
    hasClientId,
    openClientIdModal,
    getAuthState,
    isLoggedIn,
    getUser,
    login,
    logout,
    ensureValidToken,
    ensureFolder,
    saveSheetToDrive,
    shareSheetWithMaster,
    listMySheets,
    listMesaSheets,
    getFileMeta,
    getFileJson,
    updateLinkedSheetAsMaster,
    deleteFile,
    saveMasterSessionToDrive,
    loadMasterSessionFromDrive
  };
})();

