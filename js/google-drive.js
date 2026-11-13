/**
 * ValeDrone RPG & D&D 5.5 — Integração Login Gmail + Google Drive + Sincronização em Nuvem da Mesa
 *
 * Responsável por:
 * 1. Login via Gmail (OAuth 2.0 Google Drive + sincronização em nuvem instantânea por conta Gmail).
 * 2. Armazenamento e sincronização de todas as fichas na pasta "ValeDrone RPG - Fichas D&D 5.5"
 *    do Google Drive de cada conta e entre dispositivos diferentes.
 * 3. Vínculo em tempo real entre /dnd (Fichas dos Jogadores) e /rpg (Painel do Mestre).
 */
(function () {
  'use strict';

  const AUTH_STORAGE_KEY = 'vd_google_auth';
  const CLIENT_ID_STORAGE_KEY = 'vd_google_client_id';
  const DEFAULT_GOOGLE_CLIENT_ID = '1056341849762-b2mul1a0f4ingn9bhinnpao7enon2i7n.apps.googleusercontent.com';
  const FOLDER_CACHE_PREFIX = 'vd_gdrive_folder_';
  const DRIVE_FOLDER_NAME = 'ValeDrone RPG - Fichas D&D 5.5';
  const SCOPES = 'https://www.googleapis.com/auth/drive.file openid email profile';
  const CLOUD_RELAY_BASE = 'https://ntfy.sh';

  const authBroadcast = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('vd_google_auth_channel')
    : null;

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
    return !!(auth && auth.mode !== 'cloud' && auth.accessToken && auth.expiresAt && Date.now() < (auth.expiresAt - 45000));
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

  if (authBroadcast) {
    authBroadcast.addEventListener('message', (ev) => {
      if (ev.data && ev.data.type === 'vd-google-oauth-success' && ev.data.auth) {
        saveAuthState(ev.data.auth);
      }
    });
  }

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
      } catch (e) { /* fallback */ }
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
   * Remove textos automáticos da ficha que o recalculateCharacter() reconstrói sozinho,
   * deixando o pacote compactado abaixo de 2KB para sincronização instantânea entre dispositivos.
   */
  function compactCharacterForCloud(charObj) {
    const copy = JSON.parse(JSON.stringify(charObj));
    if (Array.isArray(copy.hpLog) && copy.hpLog.length > 10) {
      copy.hpLog = copy.hpLog.slice(-10);
    }
    if (copy.sheet && typeof copy.sheet === 'object') {
      if (!copy.sheet.classFeaturesEdited) delete copy.sheet.classFeatures;
      if (!copy.sheet.speciesTraitsEdited) delete copy.sheet.speciesTraits;
      if (!copy.sheet.featsEdited) delete copy.sheet.feats;
      if (Array.isArray(copy.sheet.spellRows)) {
        copy.sheet.spellRows = copy.sheet.spellRows.filter(r => r && (r.edited || !r.srcId));
      }
    }
    return copy;
  }

  async function publishCloudTopic(topic, envelope) {
    const packed = await compressJson(envelope);
    const res = await fetch(`${CLOUD_RELAY_BASE}/${encodeURIComponent(topic)}`, {
      method: 'POST',
      body: packed
    });
    if (!res.ok) throw new Error('Falha ao sincronizar na nuvem (' + res.status + ').');
    return true;
  }

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
        if (!ev || ev.event !== 'message') continue;
        let payloadStr = ev.message || '';
        // Se o pacote foi grande e o ntfy guardou como anexo, baixa o anexo
        if ((!payloadStr || (!payloadStr.startsWith('gz:') && !payloadStr.startsWith('raw:'))) && ev.attachment && ev.attachment.url) {
          try {
            const attRes = await fetch(ev.attachment.url);
            if (attRes.ok) payloadStr = (await attRes.text()).trim();
          } catch (e) {}
        }
        if (payloadStr && (payloadStr.startsWith('gz:') || payloadStr.startsWith('raw:') || payloadStr.startsWith('{'))) {
          const decoded = await decompressJson(payloadStr);
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

  // ==================== LOGIN OAUTH GOOGLE DRIVE + FALLBACK ====================

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

  // Captura o token no retorno do redirecionamento OAuth (#access_token=...)
  (function handleOAuthHashCallback() {
    const hash = window.location.hash || '';
    if (!hash || (!hash.includes('access_token=') && !hash.includes('error='))) return;
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const accessToken = params.get('access_token');
    const error = params.get('error');
    const expiresIn = params.get('expires_in');
    const isPopup = window.name === 'vd_google_oauth_popup' || !!(window.opener && window.opener !== window);

    try {
      history.replaceState(null, document.title, window.location.pathname + window.location.search);
    } catch (e) {}

    if (error) {
      if (authBroadcast) {
        try { authBroadcast.postMessage({ type: 'vd-google-oauth-error', error }); } catch (e) {}
      }
      if (window.opener && window.opener !== window) {
        try { window.opener.postMessage({ type: 'vd-google-oauth-error', error }, window.location.origin); } catch (e) {}
      }
      if (isPopup) {
        setTimeout(() => { try { window.close(); } catch (e) {} }, 100);
      }
      return;
    }

    if (accessToken) {
      finalizeTokenLogin(accessToken, expiresIn).then((newState) => {
        if (authBroadcast) {
          try { authBroadcast.postMessage({ type: 'vd-google-oauth-success', auth: newState }); } catch (e) {}
        }
        if (window.opener && window.opener !== window) {
          try { window.opener.postMessage({ type: 'vd-google-oauth-success', auth: newState }, window.location.origin); } catch (e) {}
        }
        if (isPopup) {
          setTimeout(() => { try { window.close(); } catch (e) {} }, 150);
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
        if (authBroadcast) authBroadcast.removeEventListener('message', onBroadcast);
        clearInterval(checkClosedTimer);
      };

      const onSuccess = (authObj) => {
        if (finished) return;
        cleanup();
        saveAuthState(authObj);
        try { popup.close(); } catch (e) {}
        resolve(authObj);
      };

      const onMessage = (ev) => {
        if (ev.origin !== window.location.origin) return;
        const data = ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'vd-google-oauth-success' && data.auth) onSuccess(data.auth);
        else if (data.type === 'vd-google-oauth-error') {
          cleanup();
          reject(new Error('Erro no OAuth Google: ' + (data.error || 'acesso negado')));
        }
      };

      const onBroadcast = (ev) => {
        const data = ev.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'vd-google-oauth-success' && data.auth) onSuccess(data.auth);
        else if (data.type === 'vd-google-oauth-error') {
          cleanup();
          reject(new Error('Erro no OAuth Google: ' + (data.error || 'acesso negado')));
        }
      };

      const onStorage = (ev) => {
        if (ev.key === AUTH_STORAGE_KEY && ev.newValue) {
          const st = getAuthState();
          if (isTokenValid(st)) onSuccess(st);
        }
      };

      window.addEventListener('message', onMessage);
      window.addEventListener('storage', onStorage);
      if (authBroadcast) authBroadcast.addEventListener('message', onBroadcast);

      const checkClosedTimer = setInterval(() => {
        if (finished) return;
        const st = getAuthState();
        if (st && st.mode === 'oauth' && isTokenValid(st) && (!prevAuth || st.expiresAt !== prevAuth.expiresAt)) {
          onSuccess(st);
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

  async function login(options = {}) {
    if (options && options.silent && isLoggedIn()) {
      return getAuthState();
    }
    try {
      return await startGoogleOAuthPopup(options);
    } catch (oauthErr) {
      if (oauthErr && /fechada/i.test(oauthErr.message)) {
        throw oauthErr;
      }
      return openFallbackLoginModal(options, oauthErr);
    }
  }

  function openFallbackLoginModal(options = {}, oauthErr = null) {
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
              🎲 Conectar Conta Gmail (Google Drive)
            </h3>
            <button type="button" id="vdLgClose" style="background:none;border:none;color:#94a3b8;font-size:1.3rem;cursor:pointer;">✕</button>
          </div>
          ${oauthErr ? `<p style="font-size:0.8rem;color:#fca5a5;margin:0 0 0.75rem;">Aviso OAuth: ${oauthErr.message}</p>` : ''}
          <button type="button" id="vdLgOAuthBtn" style="width:100%;padding:0.7rem 1rem;border-radius:8px;border:none;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;font-weight:700;cursor:pointer;font-size:0.9rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;margin-bottom:0.9rem;">
            🔑 Entrar com Google (Salvar no Google Drive)
          </button>
          <form id="vdLgFastForm" style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1rem;">
            <div style="margin-bottom:0.65rem;">
              <label style="display:block;font-size:0.76rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:0.25rem;">Ou entrar rápido com seu E-mail</label>
              <input type="email" id="vdLgEmail" value="${savedEmail.replace(/"/g, '&quot;')}" placeholder="exemplo@gmail.com" required
                style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:0.9rem;">
            </div>
            <div style="margin-bottom:0.85rem;">
              <label style="display:block;font-size:0.76rem;color:#94a3b8;font-weight:600;text-transform:uppercase;margin-bottom:0.25rem;">Seu Nome</label>
              <input type="text" id="vdLgName" value="${savedName.replace(/"/g, '&quot;')}" placeholder="Ex: Paulo Godoy"
                style="width:100%;box-sizing:border-box;padding:0.6rem 0.75rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:0.9rem;">
            </div>
            <button type="submit" style="width:100%;padding:0.55rem 1rem;border-radius:8px;border:1px solid #475569;background:#0f172a;color:#cbd5e1;font-weight:600;cursor:pointer;font-size:0.84rem;">
              ⚡ Continuar só com E-mail
            </button>
          </form>
        </div>
      `;

      document.body.appendChild(overlay);
      const emailIn = overlay.querySelector('#vdLgEmail');
      const nameIn = overlay.querySelector('#vdLgName');

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
          alert('Erro ao autenticar no Google: ' + err.message);
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

    const q = "mimeType = 'application/vnd.google-apps.folder' and appProperties has { key='vdFolder' and value='fichas_dnd55' } and trashed = false";
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
    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error('Não foi possível criar pasta no Google Drive: ' + errText);
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

  /**
   * Extrai a lista única de todas as mesas às quais uma ficha pertence
   * (suporta múltiplas mesas simultâneas em `mesasVinculadas` + legado `mesaVinculada`).
   */
  function extractMesasFromCharacter(characterObj, extraMesa = null) {
    const map = new Map();
    const add = (m) => {
      if (!m || !m.mesaId) return;
      const id = String(m.mesaId).trim();
      if (!id) return;
      const prev = map.get(id) || {};
      map.set(id, {
        mesaId: id,
        mestreEmail: String(m.mestreEmail || prev.mestreEmail || '').toLowerCase().trim(),
        nomeMesa: String(m.nomeMesa || prev.nomeMesa || 'Mesa do Mestre').trim(),
        driveFileId: m.driveFileId || prev.driveFileId || characterObj?.driveFileId || null,
        vinculadaEm: m.vinculadaEm || prev.vinculadaEm || new Date().toISOString()
      });
    };
    if (characterObj && Array.isArray(characterObj.mesasVinculadas)) {
      characterObj.mesasVinculadas.forEach(add);
    }
    if (characterObj && characterObj.mesaVinculada && characterObj.mesaVinculada.mesaId) {
      add(characterObj.mesaVinculada);
    }
    if (extraMesa && extraMesa.mesaId) {
      add(extraMesa);
    }
    return Array.from(map.values());
  }

  async function findDriveFileByCharId(charId) {
    if (!charId || !hasDriveToken()) return null;
    const cleanId = safeProp(charId, 50).replace(/'/g, "\\'");
    const q = `appProperties has { key='vdCharId' and value='${cleanId}' } and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&pageSize=5`;
    const res = await driveFetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return (data.files && data.files[0]) || null;
  }

  /**
   * Salva a ficha do jogador no Google Drive da conta E no canal de nuvem da conta/mesas
   * para garantir carregamento instantâneo em qualquer outro dispositivo e em todas as mesas vinculadas.
   */
  async function saveSheetToDrive(characterObj, options = {}) {
    if (!characterObj || !characterObj.id) throw new Error('Ficha inválida.');
    const user = getUser();
    const ownerEmail = ((user && user.email) || characterObj.driveOwnerEmail || '').toLowerCase().trim();
    const nowIso = new Date().toISOString();

    const extraMesa = options.mesaId
      ? { mesaId: options.mesaId, mestreEmail: options.mestreEmail || '', nomeMesa: options.nomeMesa || 'Mesa do Mestre' }
      : null;
    const todasMesas = extractMesasFromCharacter(characterObj, extraMesa);
    characterObj.mesasVinculadas = todasMesas;
    characterObj.mesaVinculada = todasMesas.length > 0 ? todasMesas[todasMesas.length - 1] : null;

    const mesaIdProp = safeProp(todasMesas.map(m => m.mesaId).join(','), 75);
    const mestreEmailProp = safeProp(
      (options.mestreEmail || (characterObj.mesaVinculada && characterObj.mesaVinculada.mestreEmail) || ''),
      75
    ).toLowerCase();

    let finalMeta = null;

    // 1. Grava o arquivo completo no Google Drive (se autenticado via OAuth)
    if (hasDriveToken()) {
      try {
        const charName = (characterObj.name || '').trim() || 'Personagem Sem Nome';
        const level1 = +characterObj.level1 || 1;
        const level2 = characterObj.class2 && characterObj.class2 !== 'none' ? (+characterObj.level2 || 0) : 0;
        const fileName = `${charName} - Nível ${level1 + level2}.dnd55.json`.replace(/[\\/:*?"<>|]+/g, '-');
        const appProperties = {
          vdType: 'ficha_dnd55',
          vdCharId: safeProp(characterObj.id, 50),
          vdMesa: mesaIdProp,
          vdMestre: mestreEmailProp,
          vdBy: safeProp(options.updatedBy || 'jogador', 15)
        };

        let existingDriveId = (characterObj.driveFileId && !String(characterObj.driveFileId).startsWith('cloud_'))
          ? characterObj.driveFileId
          : null;
        if (!existingDriveId) {
          const found = await findDriveFileByCharId(characterObj.id);
          if (found) existingDriveId = found.id;
        }

        const fullPayload = Object.assign({}, characterObj, {
          driveUpdatedAt: nowIso,
          driveOwnerEmail: ownerEmail
        });
        const boundary = '-------vd_boundary_' + Date.now().toString(36);

        if (existingDriveId) {
          const body = buildMultipartBody({ name: fileName, appProperties }, fullPayload, boundary);
          const res = await driveFetch(
            `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existingDriveId)}?uploadType=multipart&fields=id,name,modifiedTime,appProperties`,
            { method: 'PATCH', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
          );
          if (res.ok) finalMeta = await res.json();
        }
        if (!finalMeta) {
          const folderId = await ensureFolder();
          const body = buildMultipartBody({ name: fileName, mimeType: 'application/json', parents: [folderId], appProperties }, fullPayload, boundary);
          const res = await driveFetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime,appProperties',
            { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
          );
          if (res.ok) finalMeta = await res.json();
        }
      } catch (err) {
        console.warn('Aviso ao gravar no Google Drive OAuth:', err);
      }
    }

    const effectiveFileId = (finalMeta && finalMeta.id) || characterObj.driveFileId || `cloud_${characterObj.id}`;
    const effectiveMtime = (finalMeta && finalMeta.modifiedTime) || nowIso;

    characterObj.mesasVinculadas = todasMesas.map(m => Object.assign({}, m, { driveFileId: effectiveFileId }));
    if (characterObj.mesaVinculada) characterObj.mesaVinculada.driveFileId = effectiveFileId;

    const compactCopy = Object.assign({}, compactCharacterForCloud(characterObj), {
      driveFileId: effectiveFileId,
      driveUpdatedAt: effectiveMtime,
      driveModifiedTime: effectiveMtime,
      driveOwnerEmail: ownerEmail,
      mesasVinculadas: characterObj.mesasVinculadas,
      mesaVinculada: characterObj.mesaVinculada
    });

    // 2. Publica também no canal de nuvem da conta Gmail (garante sincronia entre PC e celular mesmo se um deles estiver só no modo rápido)
    if (ownerEmail) {
      try {
        const userTopic = 'vd_usr_' + (await sha256Short(ownerEmail));
        await publishCloudTopic(userTopic, {
          t: 'sheet_save',
          charId: characterObj.id,
          fileId: effectiveFileId,
          modifiedTime: effectiveMtime,
          ownerEmail,
          data: compactCopy
        });
      } catch (err) {
        console.warn('Aviso ao publicar no canal da conta na nuvem:', err);
      }
    }

    // 3. Se vinculada a uma ou mais Mesas, publica no canal de TODAS as Mesas vinculadas em tempo real
    for (const m of todasMesas) {
      if (!m || !m.mesaId) continue;
      try {
        const mesaTopic = 'vd_mesa_' + String(m.mesaId).replace(/[^a-zA-Z0-9_-]/g, '');
        await publishCloudTopic(mesaTopic, {
          t: 'mesa_sheet',
          mesaId: m.mesaId,
          mestreEmail: m.mestreEmail || '',
          charId: characterObj.id,
          fileId: effectiveFileId,
          modifiedTime: effectiveMtime,
          updatedBy: options.updatedBy || 'jogador',
          ownerEmail,
          data: compactCopy
        });
      } catch (err) {
        console.warn('Aviso ao publicar no canal da mesa:', m.mesaId, err);
      }
    }

    return finalMeta || {
      id: effectiveFileId,
      name: `${characterObj.name || 'Ficha'}.dnd55.json`,
      modifiedTime: effectiveMtime,
      appProperties: {
        vdType: 'ficha_dnd55',
        vdCharId: String(characterObj.id),
        vdMesa: mesaIdProp,
        vdMestre: mestreEmailProp
      }
    };
  }

  /**
   * Remove o vínculo de uma ficha com uma mesa específica sem afetar outras mesas às quais ela pertença.
   */
  async function unlinkSheetFromMesa(characterObj, mesaId) {
    if (!mesaId) return;
    const cleanMesaId = String(mesaId).trim();
    const charId = characterObj && characterObj.id ? String(characterObj.id) : '';
    if (characterObj) {
      const restantes = extractMesasFromCharacter(characterObj).filter(m => m.mesaId !== cleanMesaId);
      characterObj.mesasVinculadas = restantes;
      characterObj.mesaVinculada = restantes.length > 0 ? restantes[restantes.length - 1] : null;
      try {
        await saveSheetToDrive(characterObj, { updatedBy: 'jogador' });
      } catch (e) {}
    }
    if (charId) {
      try {
        const mesaTopic = 'vd_mesa_' + cleanMesaId.replace(/[^a-zA-Z0-9_-]/g, '');
        await publishCloudTopic(mesaTopic, {
          t: 'mesa_unlink',
          mesaId: cleanMesaId,
          charId,
          modifiedTime: new Date().toISOString()
        });
      } catch (e) {}
    }
  }

  async function shareSheetWithMaster(fileId) {
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

  const _cloudFilesCache = new Map();

  /**
   * Lista todas as fichas da conta logada (buscando tanto no Google Drive quanto no canal da conta na nuvem).
   */
  async function listMySheets() {
    const user = getUser();
    const resultsMap = new Map();

    // 1. Busca no Google Drive (se autenticado via OAuth)
    if (hasDriveToken()) {
      try {
        const q = "(appProperties has { key='vdType' and value='ficha_dnd55' } or name contains '.dnd55.json') and trashed = false";
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties)&pageSize=100`;
        const res = await driveFetch(url);
        if (res.ok) {
          const d = await res.json();
          (d.files || []).forEach(f => {
            const cid = (f.appProperties && f.appProperties.vdCharId) || f.id;
            resultsMap.set(cid, f);
          });
        }
      } catch (e) {
        console.warn('Aviso ao listar arquivos do Google Drive:', e);
      }
    }

    // 2. Busca também no canal de nuvem da conta Gmail (sincroniza entre dispositivos)
    if (user && user.email) {
      try {
        const userTopic = 'vd_usr_' + (await sha256Short(user.email));
        const items = await pollCloudTopic(userTopic);
        items.forEach(({ time, envelope }) => {
          if (!envelope || !envelope.charId) return;
          const cid = String(envelope.charId);
          if (envelope.t === 'sheet_delete') {
            resultsMap.delete(cid);
            return;
          }
          if (!envelope.data) return;
          const fid = envelope.fileId || `cloud_${cid}`;
          const mtime = envelope.modifiedTime || time;
          const cloudMeta = {
            id: fid,
            name: `${envelope.data.name || 'Ficha'}.dnd55.json`,
            modifiedTime: mtime,
            appProperties: { vdType: 'ficha_dnd55', vdCharId: cid },
            owners: [{ emailAddress: envelope.ownerEmail || user.email }]
          };
          _cloudFilesCache.set(fid, { meta: cloudMeta, data: envelope.data });

          const existing = resultsMap.get(cid);
          if (!existing || (mtime && existing.modifiedTime && mtime > existing.modifiedTime)) {
            resultsMap.set(cid, cloudMeta);
          }
        });
      } catch (e) {
        console.warn('Aviso ao listar fichas da nuvem:', e);
      }
    }

    return Array.from(resultsMap.values());
  }

  async function listMesaSheets(mesaId) {
    if (!mesaId) return [];
    const cleanMesaId = String(mesaId).trim();
    const resultsMap = new Map();
    const unlinkedMap = new Map();
    const mesaTopic = 'vd_mesa_' + cleanMesaId.replace(/[^a-zA-Z0-9_-]/g, '');

    try {
      const items = await pollCloudTopic(mesaTopic);
      items.forEach(({ time, envelope }) => {
        if (!envelope || !envelope.charId) return;
        const cid = String(envelope.charId);
        const mtime = envelope.modifiedTime || time;
        if (envelope.t === 'mesa_unlink') {
          resultsMap.delete(cid);
          unlinkedMap.set(cid, mtime);
          return;
        }
        if (!envelope.data) return;
        unlinkedMap.delete(cid);
        const fid = envelope.fileId || `cloud_${cid}`;
        const meta = {
          id: fid,
          name: `${envelope.data.name || 'Ficha'}.dnd55.json`,
          modifiedTime: mtime,
          appProperties: {
            vdType: 'ficha_dnd55',
            vdCharId: cid,
            vdMesa: cleanMesaId,
            vdBy: envelope.updatedBy || 'jogador'
          },
          owners: [{ emailAddress: envelope.ownerEmail || envelope.data.driveOwnerEmail || '' }]
        };
        _cloudFilesCache.set(fid, { meta, data: envelope.data });
        resultsMap.set(cid, meta);
      });
    } catch (e) {
      console.warn('Aviso ao ler canal da mesa na nuvem:', e);
    }

    // Se o Mestre está autenticado no Google Drive, busca também fichas do Drive cujos metadados incluem esta mesa
    if (hasDriveToken()) {
      try {
        const q = "appProperties has { key='vdType' and value='ficha_dnd55' } and trashed = false";
        const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,modifiedTime,appProperties,owners(displayName,emailAddress))&pageSize=100`;
        const res = await driveFetch(url);
        if (res.ok) {
          const d = await res.json();
          (d.files || []).forEach(f => {
            const props = f.appProperties || {};
            const mesasStr = String(props.vdMesa || '');
            const mesasArr = mesasStr.split(',').map(s => s.trim()).filter(Boolean);
            if (!mesasArr.includes(cleanMesaId)) return;
            const cid = props.vdCharId || f.id;
            const unlinkTime = unlinkedMap.get(cid);
            if (unlinkTime && f.modifiedTime && f.modifiedTime <= unlinkTime) return;
            const existing = resultsMap.get(cid);
            if (!existing || (f.modifiedTime && existing.modifiedTime && f.modifiedTime > existing.modifiedTime)) {
              resultsMap.set(cid, f);
            }
          });
        }
      } catch (e) {}
    }

    return Array.from(resultsMap.values());
  }

  async function getFileMeta(fileId) {
    if (!fileId) throw new Error('fileId ausente.');
    const charId = String(fileId).replace(/^cloud_/, '');
    try {
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
    } catch (e) {}

    if (_cloudFilesCache.has(fileId)) {
      return _cloudFilesCache.get(fileId).meta;
    }

    if (hasDriveToken() && !String(fileId).startsWith('cloud_')) {
      const res = await driveFetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`
      );
      if (res.ok) return res.json();
    }

    return { id: fileId, modifiedTime: null, trashed: false };
  }

  async function getFileJson(fileId) {
    if (_cloudFilesCache.has(fileId)) {
      const cached = _cloudFilesCache.get(fileId);
      if (hasDriveToken() && !String(fileId).startsWith('cloud_')) {
        try {
          const metaRes = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`);
          if (metaRes.ok) {
            const driveMeta = await metaRes.json();
            if (driveMeta.modifiedTime && (!cached.meta.modifiedTime || driveMeta.modifiedTime > cached.meta.modifiedTime)) {
              const mediaRes = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`);
              if (mediaRes.ok) {
                const data = await mediaRes.json();
                return { meta: driveMeta, data };
              }
            }
          }
        } catch (e) {}
      }
      return cached;
    }
    if (hasDriveToken() && !String(fileId).startsWith('cloud_')) {
      try {
        const [metaRes, mediaRes] = await Promise.all([
          driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,modifiedTime,appProperties,trashed,owners(displayName,emailAddress)`),
          driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`)
        ]);
        if (metaRes.ok && mediaRes.ok) {
          const meta = await metaRes.json();
          const data = await mediaRes.json();
          return { meta, data };
        }
      } catch (e) {}
    }
    await getFileMeta(fileId);
    if (_cloudFilesCache.has(fileId)) return _cloudFilesCache.get(fileId);
    throw new Error('Não foi possível baixar a ficha.');
  }

  async function updateLinkedSheetAsMaster(fileId, jsonDados, mesaId) {
    if (!jsonDados) throw new Error('Dados ausentes.');
    const nowIso = new Date().toISOString();
    const charId = String(jsonDados.id || fileId || '').replace(/^cloud_/, '');
    const fid = fileId || `cloud_${charId}`;
    const user = getUser();
    const ownerEmail = (jsonDados.driveOwnerEmail || (user && user.email) || '').toLowerCase().trim();

    const todasMesas = extractMesasFromCharacter(jsonDados, mesaId ? { mesaId } : null);
    jsonDados.mesasVinculadas = todasMesas;

    // 1. Se tiver token OAuth e o arquivo existir no Google Drive, atualiza também o arquivo no Drive
    if (hasDriveToken() && fid && !String(fid).startsWith('cloud_')) {
      try {
        const boundary = '-------vd_mestre_' + Date.now().toString(36);
        const charName = (jsonDados.name || '').trim() || 'Personagem Sem Nome';
        const level1 = +jsonDados.level1 || 1;
        const level2 = jsonDados.class2 && jsonDados.class2 !== 'none' ? (+jsonDados.level2 || 0) : 0;
        const fileName = `${charName} - Nível ${level1 + level2}.dnd55.json`.replace(/[\\/:*?"<>|]+/g, '-');
        const appProperties = {
          vdType: 'ficha_dnd55',
          vdCharId: safeProp(charId, 50),
          vdMesa: safeProp(todasMesas.map(m => m.mesaId).join(','), 75),
          vdBy: 'mestre'
        };
        const fullPayload = Object.assign({}, jsonDados, {
          driveUpdatedAt: nowIso,
          driveModifiedTime: nowIso,
          driveLastUpdatedBy: 'mestre'
        });
        const body = buildMultipartBody({ name: fileName, appProperties }, fullPayload, boundary);
        await driveFetch(
          `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fid)}?uploadType=multipart&fields=id,modifiedTime`,
          { method: 'PATCH', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body }
        );
      } catch (e) {}
    }

    const payload = Object.assign({}, compactCharacterForCloud(jsonDados), {
      driveFileId: fid,
      driveUpdatedAt: nowIso,
      driveModifiedTime: nowIso,
      driveLastUpdatedBy: 'mestre',
      mesasVinculadas: todasMesas
    });

    // 2. Publica no canal individual da ficha (para atualizar a tela do jogador ao vivo)
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
      } catch (e) {}
    }

    // 3. Publica no canal da conta dona da ficha (para sincronizar todos os dispositivos do jogador/mestre)
    if (ownerEmail) {
      try {
        const userTopic = 'vd_usr_' + (await sha256Short(ownerEmail));
        await publishCloudTopic(userTopic, {
          t: 'sheet_save',
          charId,
          fileId: fid,
          modifiedTime: nowIso,
          ownerEmail,
          data: payload
        });
      } catch (e) {}
    }

    // 4. Publica no canal de TODAS as mesas às quais esta ficha pertence
    for (const m of todasMesas) {
      if (!m || !m.mesaId) continue;
      try {
        const mesaTopic = 'vd_mesa_' + String(m.mesaId).replace(/[^a-zA-Z0-9_-]/g, '');
        await publishCloudTopic(mesaTopic, {
          t: 'mesa_sheet',
          mesaId: m.mesaId,
          charId,
          fileId: fid,
          modifiedTime: nowIso,
          updatedBy: 'mestre',
          ownerEmail,
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

  async function deleteFile(fileId, charId = '') {
    if (!fileId) return;
    _cloudFilesCache.delete(fileId);
    const user = getUser();
    const cid = charId || String(fileId).replace(/^cloud_/, '');
    if (user && user.email && cid) {
      try {
        const userTopic = 'vd_usr_' + (await sha256Short(user.email));
        await publishCloudTopic(userTopic, {
          t: 'sheet_delete',
          charId: cid,
          fileId,
          modifiedTime: new Date().toISOString()
        });
      } catch (e) {}
    }
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
        const q = "appProperties has { key='vdType' and value='rpg_master_session' } and trashed = false";
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
    hasDriveToken,
    openClientIdModal,
    getAuthState,
    isLoggedIn,
    getUser,
    login,
    logout,
    ensureValidToken,
    ensureFolder,
    extractMesasFromCharacter,
    saveSheetToDrive,
    unlinkSheetFromMesa,
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
