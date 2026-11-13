/**
 * ValeDrone RPG & D&D 5.5 — Integração Login Gmail + Google Drive + Sincronização em Nuvem da Mesa
 *
 * Funciona em modo híbrido (sem bloqueios):
 * 1. Login via Gmail:
 *    - Modo Rápido (Nuvem Direta por Gmail): funciona instantaneamente sem depender de aprovação OAuth.
 *    - Modo Google OAuth (Google Drive): usa apenas o escopo não-sensível `drive.file` para gravar
 *      os arquivos `.dnd55.json` na pasta "ValeDrone RPG - Fichas D&D 5.5" do Google Drive de cada conta.
 * 2. Sincronização em Tempo Real da Mesa (/dnd ⇄ Nuvem/Drive ⇄ /rpg):
 *    - Quando o jogador abre o link da mesa enviado pelo Mestre (/rpg) e vincula sua ficha no /dnd,
 *      a ficha sincroniza instantaneamente com o painel do Mestre (e recebe dano/cura ao vivo).
 */
(function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'vd_google_auth';
  const CLIENT_ID_STORAGE_KEY = 'vd_google_client_id';
  const DEFAULT_GOOGLE_CLIENT_ID = '1056341849762-b2mul1a0f4ingn9bhinnpao7enon2i7n.apps.googleusercontent.com';
  const FOLDER_CACHE_PREFIX = 'vd_gdrive_folder_';
  const DRIVE_FOLDER_NAME = 'ValeDrone RPG - Fichas D&D 5.5';
  // Escopo não-sensível (drive.file): não exige verificação restrita do Google
  const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile';
  const CLOUD_RELAY_BASE = 'https://ntfy.sh';

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
  }

  function hasClientId() {
    return !!getClientId();
  }

  function getAuthState() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.user || !parsed.user.email) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function isTokenValid(auth) {
    if (!auth) return false;
    if (auth.mode === 'cloud' && auth.user && auth.user.email) return true;
    if (!auth.accessToken || !auth.expiresAt) return false;
    return Date.now() < (auth.expiresAt - 45000);
  }

  function hasDriveToken() {
    const auth = getAuthState();
    return !!(auth && auth.accessToken && auth.expiresAt && Date.now() < (auth.expiresAt - 45000));
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

  // ==================== COMPACTAÇÃO & NUVEM EM TEMPO REAL ====================

  async function sha256Short(str) {
    const clean = String(str || '').toLowerCase().trim();
    if (window.crypto && window.crypto.subtle) {
      const buf = new TextEncoder().encode('valedrone_salt_' + clean);
      const digest = await window.crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 22);
    }
    let h = 2166136261;
    for (let i = 0; i < clean.length; i++) {
      h ^= clean.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return 'h' + (h >>> 0).toString(16);
  }

  function uint8ToBase64(bytes) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToUint8(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  async function compressJson(obj) {
    const jsonStr = JSON.stringify(obj);
    if (typeof CompressionStream !== 'undefined') {
      try {
        const stream = new Blob([jsonStr]).stream().pipeThrough(new CompressionStream('gzip'));
        const buf = await new Response(stream).arrayBuffer();
        return 'gz:' + uint8ToBase64(new Uint8Array(buf));
      } catch (e) { /* fallback abaixo */ }
    }
    return 'raw:' + uint8ToBase64(new TextEncoder().encode(jsonStr));
  }

  async function decompressJson(str) {
    if (!str || typeof str !== 'string') return null;
    if (str.startsWith('gz:') && typeof DecompressionStream !== 'undefined') {
      const bytes = base64ToUint8(str.slice(3));
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      const txt = await new Response(stream).text();
      return JSON.parse(txt);
    }
    if (str.startsWith('raw:')) {
      const bytes = base64ToUint8(str.slice(4));
      const txt = new TextDecoder().decode(bytes);
      return JSON.parse(txt);
    }
    return JSON.parse(str);
  }

  /**
   * Envia um pacote compactado para um tópico na nuvem.
   */
  async function publishCloudTopic(topic, envelope) {
    const packed = await compressJson(envelope);
    const res = await fetch(`${CLOUD_RELAY_BASE}/${encodeURIComponent(topic)}`, {
      method: 'POST',
      body: packed
    });
    if (!res.ok) throw new Error('Falha ao sincronizar na nuvem (' + res.status + ').');
    return true;
  }

  /**
   * Lê todos os pacotes recentes de um tópico na nuvem.
   */
  async function pollCloudTopic(topic) {
    const url = `${CLOUD_RELAY_BASE}/${encodeURIComponent(topic)}/json?poll=1&since=all`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const items = [];
    for (const line of lines) {
      try {
        const ev = JSON.parse(line);
        if (ev && ev.event === 'message' && ev.message) {
          const decoded = await decompressJson(ev.message);
          if (decoded) {
            items.push({
              time: ev.time ? new Date(ev.time * 1000).toISOString() : new Date().toISOString(),
              envelope: decoded
            });
          }
        }
      } catch (e) { /* ignora mensagem malformada */ }
    }
    return items;
  }

  /**
   * Enxuga campos pesados ou desnecessários se a ficha for muito grande para o relay em tempo real,
   * preservando 100% dos atributos, magias, armas, inventário, escolhas e resumo.
   */
  function compactCharacterForCloud(charObj) {
    const copy = Object.assign({}, charObj);
    // Histórico longo de log de PV não precisa trafegar inteiro a cada segundo
    if (Array.isArray(copy.hpLog) && copy.hpLog.length > 15) {
      copy.hpLog = copy.hpLog.slice(-15);
    }
    return copy;
  }

  // ==================== LOGIN (MODAL HÍBRIDO: RÁPIDO POR GMAIL + GOOGLE OAUTH) ====================

  function getRedirectUri() {
    const origin = window.location.origin;
    const path = window.location.pathname || '/';
    if (path.startsWith('/dnd')) return origin + '/dnd/';
    if (path.startsWith('/rpg')) return origin + '/rpg/';
    return origin;
  }

  async function fetchUserInfo(accessToken) {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!res.ok) throw new Error('Falha ao obter dados da conta Google.');
    return res.json();
  }

  async function finalizeTokenLogin(accessToken, expiresInSec) {
    const prevAuth = getAuthState();
    const expiresIn = Number(expiresInSec || 3599);
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
    const newState = { mode: 'oauth', accessToken, expiresAt, user };
    saveAuthState(newState);
    return newState;
  }

  // Captura o token caso esta janela seja o retorno do redirecionamento OAuth (#access_token=...)
  (function handleOAuthHashCallback() {
    const hash = window.location.hash || '';
    if (!hash || (!hash.includes('access_token=') && !hash.includes('error='))) return;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const expiresIn = params.get('expires_in');

    try {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    } catch (e) {}

    if (error) {
      if (window.opener && window.opener !== window) {
        try {
          window.opener.postMessage({ type: 'vd-google-oauth-error', error }, window.location.origin);
          window.close();
        } catch (e) {}
      }
      return;
    }

    if (accessToken) {
      finalizeTokenLogin(accessToken, expiresIn).then((newState) => {
        if (window.opener && window.opener !== window) {
          try {
            window.opener.postMessage({ type: 'vd-google-oauth-success', auth: newState }, window.location.origin);
          } catch (e) {}
          setTimeout(() => {
            try { window.close(); } catch (e) {}
          }, 150);
        }
      });
    }
  })();

  function startGoogleOAuthPopup(options = {}) {
    const clientId = getClientId();
    const prevAuth = getAuthState();
    const hintEmail = (options.loginHint || (prevAuth && prevAuth.user && prevAuth.user.email)) || '';
    const redirectUri = getRedirectUri();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('include_granted_scopes', 'true');
    authUrl.searchParams.set('prompt', 'select_account');
    if (hintEmail) authUrl.searchParams.set('login_hint', hintEmail);

    const w = 520;
    const h = 640;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - w) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - h) / 2));
    const popup = window.open(
      authUrl.toString(),
      'vd_google_oauth_popup',
      `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes`
    );

    if (!popup) {
      window.location.href = authUrl.toString();
      return new Promise(() => {});
    }

    return new Promise((resolve, reject) => {
      let finished = false;
      const cleanup = () => {
        finished = true;
        window.removeEventListener('message', onMessage);
        window.removeEventListener('storage', onStorage);
        clearInterval(checkClosedTimer);
      };

      const onMessage = (ev) => {
        if (ev.origin !== window.location.origin) return;
        const data = ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'vd-google-oauth-success' && data.auth) {
          cleanup();
          saveAuthState(data.auth);
          resolve(data.auth);
        } else if (data.type === 'vd-google-oauth-error') {
          cleanup();
          reject(new Error('Erro no OAuth Google: ' + (data.error || 'acesso negado')));
        }
      };

      const onStorage = (ev) => {
        if (ev.key === AUTH_STORAGE_KEY && ev.newValue) {
          const st = getAuthState();
          if (isTokenValid(st)) {
            cleanup();
            try { popup.close(); } catch (e) {}
            resolve(st);
          }
        }
      };

      window.addEventListener('message', onMessage);
      window.addEventListener('storage', onStorage);

      const checkClosedTimer = setInterval(() => {
        if (finished) return;
        const st = getAuthState();
        if (st && st.mode === 'oauth' && isTokenValid(st) && (!prevAuth || st.expiresAt !== prevAuth.expiresAt)) {
          cleanup();
          resolve(st);
          return;
        }
        try {
          if (popup.closed) {
            cleanup();
            const finalSt = getAuthState();
            if (isTokenValid(finalSt)) resolve(finalSt);
            else reject(new Error('Janela de login fechada.'));
          }
        } catch (e) {}
      }, 500);
    });
  }

  /**
   * Abre o modal de Login com Gmail:
   * Permite entrar em 1 segundo digitando o Gmail (sincronização na nuvem sem bloqueio do Google Cloud)
   * OU autenticar direto na API do Google Drive via OAuth.
   */
  function login(options = {}) {
    if (options && options.silent && isLoggedIn()) {
      return Promise.resolve(getAuthState());
    }
    return new Promise((resolve, reject) => {
      let overlay = document.getElementById('vdLoginModal');
      if (overlay) overlay.remove();

      const prev = getAuthState();
      const savedEmail = (prev && prev.user && prev.user.email) || '';
      const savedName = (prev && prev.user && prev.user.name) || '';

      overlay = document.createElement('div');
      overlay.id = 'vdLoginModal';
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,0.85);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:1rem;font-family:Inter,Outfit,sans-serif;';

      overlay.innerHTML = `
        <div style="background:#111827;border:1px solid #4c1d95;border-radius:16px;max-width:460px;width:100%;padding:1.5rem;color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.7);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
            <h3 style="margin:0;font-size:1.15rem;color:#f3e8ff;display:flex;align-items:center;gap:0.5rem;">
              🎲 Conectar Conta Gmail (ValeDrone RPG)
            </h3>
            <button type="button" id="vdLgClose" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;">✕</button>
          </div>
          <p style="font-size:0.84rem;color:#cbd5e1;line-height:1.45;margin:0 0 1rem;">
            Informe seu Gmail para salvar suas fichas na nuvem e vincular em tempo real entre <strong>/dnd</strong> (Jogadores) e <strong>/rpg</strong> (Mestre):
          </p>
          <form id="vdLgFastForm" style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1rem;margin-bottom:0.9rem;">
            <div style="margin-bottom:0.65rem;">
              <label style="display:block;font-size:0.76rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:0.25rem;">Seu E-mail (Gmail)</label>
              <input type="email" id="vdLgEmail" value="${savedEmail.replace(/"/g, '&quot;')}" placeholder="exemplo@gmail.com" required
                style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:0.9rem;">
            </div>
            <div style="margin-bottom:0.85rem;">
              <label style="display:block;font-size:0.76rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:0.25rem;">Seu Nome (Mestre ou Jogador)</label>
              <input type="text" id="vdLgName" value="${savedName.replace(/"/g, '&quot;')}" placeholder="Ex: Paulo Godoy"
                style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:0.9rem;">
            </div>
            <button type="submit" style="width:100%;padding:0.65rem 1rem;border-radius:8px;border:none;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;font-weight:700;cursor:pointer;font-size:0.9rem;box-shadow:0 4px 12px rgba(34,197,94,0.3);">
              ⚡ Entrar Agora e Sincronizar na Nuvem
            </button>
          </form>

          <div style="text-align:center;position:relative;margin:0.75rem 0;">
            <span style="font-size:0.75rem;color:#64748b;background:#111827;padding:0 0.5rem;">ou, se já liberou os testadores no Google Cloud:</span>
          </div>

          <button type="button" id="vdLgOAuthBtn" style="width:100%;padding:0.55rem 1rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#cbd5e1;font-weight:600;cursor:pointer;font-size:0.82rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;">
            🔑 Conectar também ao Google Drive (OAuth)
          </button>
        </div>
      `;

      document.body.appendChild(overlay);
      const emailIn = overlay.querySelector('#vdLgEmail');
      const nameIn = overlay.querySelector('#vdLgName');
      setTimeout(() => emailIn && emailIn.focus(), 50);

      const close = (err) => {
        overlay.remove();
        if (err) reject(err);
      };

      overlay.querySelector('#vdLgClose').onclick = () => close(new Error('Login cancelado.'));

      overlay.querySelector('#vdLgFastForm').onsubmit = (e) => {
        e.preventDefault();
        const email = emailIn.value.trim().toLowerCase();
        if (!email || !email.includes('@')) return;
        const name = nameIn.value.trim() || email.split('@')[0];
        const newState = {
          mode: 'cloud',
          accessToken: 'cloud_' + Date.now(),
          expiresAt: Date.now() + 365 * 24 * 3600 * 1000,
          user: { email, name, picture: '' }
        };
        overlay.remove();
        saveAuthState(newState);
        resolve(newState);
      };

      overlay.querySelector('#vdLgOAuthBtn').onclick = async () => {
        try {
          const st = await startGoogleOAuthPopup(options);
          overlay.remove();
          resolve(st);
        } catch (err) {
          alert(
            'O Google Cloud ainda bloqueou o OAuth (' + err.message + ').\n\n' +
            'Use o botão verde "⚡ Entrar Agora e Sincronizar na Nuvem" logo acima — ele funciona na hora com o seu Gmail sem precisar do Google Cloud!'
          );
        }
      };
    });
  }

  function logout() {
    saveAuthState(null);
  }

  async function ensureValidToken(options = {}) {
    const auth = getAuthState();
    if (isTokenValid(auth)) return auth.accessToken;
    if (options.interactive) {
      const refreshed = await login(options);
      return refreshed.accessToken;
    }
    throw new Error('Faça login com seu Gmail primeiro.');
  }

  async function driveFetch(url, options = {}) {
    if (!hasDriveToken()) throw new Error('Sem token OAuth do Google Drive.');
    const auth = getAuthState();
    const headers = Object.assign({}, options.headers || {}, {
      Authorization: `Bearer ${auth.accessToken}`
    });
    return fetch(url, Object.assign({}, options, { headers }));
  }

  // ==================== OPERAÇÕES GOOGLE DRIVE + NUVEM ====================

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
    } catch (e) {}

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

    const createRes = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        name: DRIVE_FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder',
        appProperties: { vdFolder: 'fichas_dnd55' }
      })
    });
    if (!createRes.ok) throw new Error('Não foi possível criar pasta no Drive.');
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

  /**
   * Salva a ficha do jogador na nuvem da conta Gmail dele, na mesa vinculada (se houver)
   * e também no Google Drive (se autenticado com OAuth).
   */
  async function saveSheetToDrive(characterObj, options = {}) {
    if (!characterObj || !characterObj.id) throw new Error('Ficha inválida.');
    const user = getUser();
    const ownerEmail = ((user && user.email) || characterObj.driveOwnerEmail || '').toLowerCase().trim();
    const nowIso = new Date().toISOString();

    const mesaInfo = characterObj.mesaVinculada || {};
    const mesaId = safeProp(options.mesaId !== undefined ? options.mesaId : mesaInfo.mesaId, 45);
    const mestreEmail = safeProp(options.mestreEmail !== undefined ? options.mestreEmail : mesaInfo.mestreEmail, 75).toLowerCase();

    const cloudFileId = characterObj.driveFileId || `cloud_${characterObj.id}`;
    const payloadCopy = Object.assign({}, compactCharacterForCloud(characterObj), {
      driveFileId: cloudFileId,
      driveUpdatedAt: nowIso,
      driveModifiedTime: nowIso,
      driveOwnerEmail: ownerEmail
    });

    // 1. Publica no canal de nuvem da conta Gmail do jogador
    if (ownerEmail) {
      try {
        const userTopic = 'vd_usr_' + (await sha256Short(ownerEmail));
        await publishCloudTopic(userTopic, {
          t: 'sheet_save',
          charId: characterObj.id,
          fileId: cloudFileId,
          modifiedTime: nowIso,
          ownerEmail,
          data: payloadCopy
        });
      } catch (err) {
        console.warn('Aviso ao salvar no canal da conta na nuvem:', err);
      }
    }

    // 2. Se a ficha está vinculada a uma Mesa do Mestre, publica no canal da Mesa em tempo real
    if (mesaId) {
      try {
        const mesaTopic = 'vd_mesa_' + mesaId.replace(/[^a-zA-Z0-9_-]/g, '');
        await publishCloudTopic(mesaTopic, {
          t: 'mesa_sheet',
          mesaId,
          mestreEmail,
          charId: characterObj.id,
          fileId: cloudFileId,
          modifiedTime: nowIso,
          updatedBy: options.updatedBy || 'jogador',
          ownerEmail,
          data: payloadCopy
        });
      } catch (err) {
        console.warn('Aviso ao publicar ficha no canal da mesa:', err);
      }
    }

    // 3. Se também tiver token OAuth do Google Drive ativo, grava o arquivo .json no Google Drive
    if (hasDriveToken()) {
      try {
        const charName = (characterObj.name || '').trim() || 'Personagem Sem Nome';
        const level1 = +characterObj.level1 || 1;
        const level2 = characterObj.class2 && characterObj.class2 !== 'none' ? (+characterObj.level2 || 0) : 0;
        const fileName = `${charName} - Nível ${level1 + level2}.dnd55.json`.replace(/[\\/:*?"<>|]+/g, '-');
        const appProperties = {
          vdType: 'ficha_dnd55',
          vdCharId: safeProp(characterObj.id, 50),
          vdMesa: mesaId,
          vdMestre: mestreEmail,
          vdBy: safeProp(options.updatedBy || 'jogador', 15)
        };
        const folderId = await ensureFolder();
        const boundary = '-------vd_boundary_' + Date.now().toString(36);
        const isRealDriveId = characterObj.driveFileId && !String(characterObj.driveFileId).startsWith('cloud_');

        if (isRealDriveId) {
          const body = buildMultipartBody({ name: fileName, appProperties }, payloadCopy, boundary);
          const res = await driveFetch(
            `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(characterObj.driveFileId)}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`,
            { method: 'PATCH', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
          );
          if (res.ok) return res.json();
        } else {
          const body = buildMultipartBody({ name: fileName, mimeType: 'application/json', parents: [folderId], appProperties }, payloadCopy, boundary);
          const res = await driveFetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,appProperties',
            { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
          );
          if (res.ok) return res.json();
        }
      } catch (err) {
        console.warn('Aviso ao gravar cópia no Google Drive OAuth:', err);
      }
    }

    return {
      id: cloudFileId,
      name: `${characterObj.name || 'Ficha'}.dnd55.json`,
      modifiedTime: nowIso,
      appProperties: {
        vdType: 'ficha_dnd55',
        vdCharId: String(characterObj.id),
        vdMesa: mesaId,
        vdMestre: mestreEmail
      }
    };
  }

  async function shareSheetWithMaster(fileId, mestreEmail) {
    // No modo nuvem, o saveSheetToDrive já publica direto no tópico da mesa do Mestre.
    if (!hasDriveToken() || !fileId || String(fileId).startsWith('cloud_')) return;
    try {
      await driveFetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ role: 'writer', type: 'anyone' })
        }
      );
    } catch (e) {}
  }

  // Cache em memória dos pacotes baixados da nuvem para responder rápido a getFileJson / getFileMeta
  const _cloudFilesCache = new Map();

  /**
   * Lista todas as fichas da conta Gmail logada (da nuvem + Google Drive se ativo).
   */
  async function listMySheets() {
    const user = getUser();
    const resultsMap = new Map();

    if (user && user.email) {
      try {
        const userTopic = 'vd_usr_' + (await sha256Short(user.email));
        const items = await pollCloudTopic(userTopic);
        items.forEach(({ time, envelope }) => {
          if (!envelope || !envelope.data || !envelope.charId) return;
          if (envelope.t === 'sheet_delete') {
            resultsMap.delete(envelope.charId);
            return;
          }
          const fid = envelope.fileId || `cloud_${envelope.charId}`;
          const mtime = envelope.modifiedTime || time;
          _cloudFilesCache.set(fid, {
            meta: {
              id: fid,
              name: `${envelope.data.name || 'Ficha'}.dnd55.json`,
              modifiedTime: mtime,
              appProperties: { vdType: 'ficha_dnd55', vdCharId: String(envelope.charId) },
              owners: [{ emailAddress: envelope.ownerEmail || user.email }]
            },
            data: envelope.data
          });
          resultsMap.set(envelope.charId, _cloudFilesCache.get(fid).meta);
        });
      } catch (e) {
        console.warn('Aviso ao listar fichas da nuvem:', e);
      }
    }

    if (hasDriveToken()) {
      try {
        const q = "appProperties has { key='vdType' and value='ficha_dnd55' } and 'me' in owners and trashed = false";
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&orderBy=modifiedTime desc&pageSize=50`;
        const res = await driveFetch(url);
        if (res.ok) {
          const d = await res.json();
          (d.files || []).forEach(f => {
            const cid = (f.appProperties && f.appProperties.vdCharId) || f.id;
            if (!resultsMap.has(cid)) resultsMap.set(cid, f);
          });
        }
      } catch (e) {}
    }

    return Array.from(resultsMap.values());
  }

  /**
   * Lista todas as fichas vinculadas a uma Mesa específica do Mestre (/rpg).
   */
  async function listMesaSheets(mesaId) {
    if (!mesaId) return [];
    const resultsMap = new Map();
    const mesaTopic = 'vd_mesa_' + String(mesaId).replace(/[^a-zA-Z0-9_-]/g, '');

    try {
      const items = await pollCloudTopic(mesaTopic);
      items.forEach(({ time, envelope }) => {
        if (!envelope || !envelope.data || !envelope.charId) return;
        const fid = envelope.fileId || `cloud_${envelope.charId}`;
        const mtime = envelope.modifiedTime || time;
        const meta = {
          id: fid,
          name: `${envelope.data.name || 'Ficha'}.dnd55.json`,
          modifiedTime: mtime,
          appProperties: {
            vdType: 'ficha_dnd55',
            vdCharId: String(envelope.charId),
            vdMesa: String(mesaId),
            vdBy: envelope.updatedBy || 'jogador'
          },
          owners: [{ emailAddress: envelope.ownerEmail || envelope.data.driveOwnerEmail || '' }]
        };
        _cloudFilesCache.set(fid, { meta, data: envelope.data });
        resultsMap.set(String(envelope.charId), meta);
      });
    } catch (e) {
      console.warn('Aviso ao ler canal da mesa na nuvem:', e);
    }

    return Array.from(resultsMap.values());
  }

  async function getFileMeta(fileId, mesaIdHint) {
    if (!fileId) throw new Error('fileId ausente.');
    // Se tiver mesa vinculada na ficha do jogador, confere atualizações no tópico da ficha/mesa
    if (String(fileId).startsWith('cloud_') || !hasDriveToken()) {
      const charId = String(fileId).replace(/^cloud_/, '');
      const charTopic = 'vd_chr_' + (await sha256Short(charId));
      const items = await pollCloudTopic(charTopic);
      if (items.length > 0) {
        const last = items[items.length - 1];
        const env = last.envelope;
        if (env && env.data) {
          const mtime = env.modifiedTime || last.time;
          const meta = {
            id: fileId,
            name: `${env.data.name || 'Ficha'}.dnd55.json`,
            modifiedTime: mtime,
            trashed: false,
            appProperties: { vdType: 'ficha_dnd55', vdCharId: charId, vdBy: env.updatedBy || 'mestre' },
            owners: [{ emailAddress: env.ownerEmail || '' }]
          };
          _cloudFilesCache.set(fileId, { meta, data: env.data });
          return meta;
        }
      }
      if (_cloudFilesCache.has(fileId)) {
        return _cloudFilesCache.get(fileId).meta;
      }
      return { id: fileId, modifiedTime: null, trashed: false };
    }

    const res = await driveFetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`
    );
    if (!res.ok) throw new Error('Arquivo não encontrado no Google Drive.');
    return res.json();
  }

  async function getFileJson(fileId) {
    if (_cloudFilesCache.has(fileId)) {
      return _cloudFilesCache.get(fileId);
    }
    if (String(fileId).startsWith('cloud_') || !hasDriveToken()) {
      await getFileMeta(fileId);
      if (_cloudFilesCache.has(fileId)) return _cloudFilesCache.get(fileId);
      throw new Error('Ficha ainda não encontrada na nuvem.');
    }
    const [metaRes, mediaRes] = await Promise.all([
      driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`),
      driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`)
    ]);
    if (!metaRes.ok || !mediaRes.ok) throw new Error('Não foi possível ler a ficha no Google Drive.');
    const meta = await metaRes.json();
    const data = await mediaRes.json();
    return { meta, data };
  }

  /**
   * Atualiza os dados de uma ficha vinculada a partir do painel do Mestre (/rpg),
   * enviando tanto para o canal da Mesa quanto para o canal individual da ficha do jogador.
   */
  async function updateLinkedSheetAsMaster(fileId, jsonDados, mesaId) {
    if (!jsonDados) throw new Error('Dados ausentes.');
    const nowIso = new Date().toISOString();
    const charId = String(jsonDados.id || fileId || '').replace(/^cloud_/, '');
    const fid = fileId || `cloud_${charId}`;

    const payload = Object.assign({}, compactCharacterForCloud(jsonDados), {
      driveFileId: fid,
      driveUpdatedAt: nowIso,
      driveModifiedTime: nowIso,
      driveLastUpdatedBy: 'mestre'
    });

    // 1. Publica no canal direto da ficha para o /dnd do jogador receber na hora
    if (charId) {
      try {
        const charTopic = 'vd_chr_' + (await sha256Short(charId));
        await publishCloudTopic(charTopic, {
          t: 'master_update',
          charId,
          fileId: fid,
          mesaId: mesaId || '',
          modifiedTime: nowIso,
          updatedBy: 'mestre',
          data: payload
        });
      } catch (e) {
        console.warn('Aviso ao enviar atualização ao jogador:', e);
      }
    }

    // 2. Publica também no canal da Mesa para manter o histórico da mesa atualizado
    if (mesaId) {
      try {
        const mesaTopic = 'vd_mesa_' + String(mesaId).replace(/[^a-zA-Z0-9_-]/g, '');
        await publishCloudTopic(mesaTopic, {
          t: 'mesa_sheet',
          mesaId,
          charId,
          fileId: fid,
          modifiedTime: nowIso,
          updatedBy: 'mestre',
          ownerEmail: jsonDados.driveOwnerEmail || '',
          data: payload
        });
      } catch (e) {}
    }

    const meta = {
      id: fid,
      name: `${jsonDados.name || 'Ficha'}.dnd55.json`,
      modifiedTime: nowIso,
      appProperties: { vdType: 'ficha_dnd55', vdCharId: charId, vdMesa: String(mesaId || ''), vdBy: 'mestre' }
    };
    _cloudFilesCache.set(fid, { meta, data: payload });
    return meta;
  }

  async function deleteFile(fileId) {
    if (!fileId) return;
    _cloudFilesCache.delete(fileId);
    if (hasDriveToken() && !String(fileId).startsWith('cloud_')) {
      try {
        await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ trashed: true })
        });
      } catch (e) {}
    }
  }

  async function saveMasterSessionToDrive(sessionPayload) {
    const user = getUser();
    if (!user || !user.email) return null;
    if (hasDriveToken()) {
      try {
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
          await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingId)}?uploadType=multipart&fields=id,modifiedTime`, {
            method: 'PATCH', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body
          });
        } else {
          const body = buildMultipartBody({ name: fileName, mimeType: 'application/json', parents: [folderId], appProperties }, sessionPayload, boundary);
          await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime', {
            method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body
          });
        }
      } catch (e) {}
    }
    return { ok: true };
  }

  async function loadMasterSessionFromDrive() {
    return null;
  }

  function openClientIdModal() {
    return login();
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
