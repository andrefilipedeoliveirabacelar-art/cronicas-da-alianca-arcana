// ============================================================================
// SERVIÇO DE AUTENTICAÇÃO, CRIPTOGRAFIA, LGPD & USUÁRIO MASTER
// HUB BOARD GAMES BY ANDRÉ BACELAR
// ============================================================================

const USERS_STORAGE_KEY = 'hub_bg_registered_users';
const SESSION_STORAGE_KEY = 'hub_bg_current_session';
const RESET_TOKENS_KEY = 'hub_bg_password_resets';
const LGPD_AUDIT_KEY = 'hub_bg_lgpd_audit_logs';

const PASSWORD_SALT = 'hub_board_games_bacelar_2026_secure_salt!';

// Função de Criptografia de Senha (SHA-256 com Salt via Web Crypto API)
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + PASSWORD_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export class AuthService {
  constructor() {
    this.users = this.loadUsers();
    this.session = this.loadSession();
    this.initMasterUser();
  }

  loadUsers() {
    try {
      const data = localStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Erro ao carregar usuários:', e);
      return [];
    }
  }

  saveUsers() {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(this.users));
    } catch (e) {
      console.error('Erro ao salvar usuários:', e);
    }
  }

  loadSession() {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveSession(sessionData) {
    this.session = sessionData;
    try {
      if (sessionData) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Erro ao salvar sessão:', e);
    }
  }

  // Inicializa o Usuário Master Padrão (Administrador do Sistema)
  async initMasterUser() {
    const masterEmail = 'master@hubboardgames.com';
    let master = this.users.find(u => u.email === masterEmail);
    if (!master) {
      const defaultHash = await hashPassword('Master@2026');
      master = {
        id: 'usr_master_001',
        email: masterEmail,
        nickname: 'André Bacelar (Master)',
        avatar: '👑',
        role: 'master', // Permissões administrativas
        passwordHash: defaultHash,
        lgpdConsentDate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      this.users.unshift(master);
      this.saveUsers();
    }
  }

  // Cadastro de Novo Usuário com Consentimento LGPD
  async register({ email, password, nickname, avatar, lgpdConsent }) {
    if (!lgpdConsent) {
      throw new Error('É obrigatório aceitar os Termos de Privacidade e LGPD para criar uma conta.');
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Informe um e-mail válido.');
    }
    if (!password || password.length < 6) {
      throw new Error('A senha deve possuir no mínimo 6 caracteres.');
    }

    const existing = this.users.find(u => u.email === cleanEmail);
    if (existing) {
      throw new Error('Este e-mail já está cadastrado no sistema.');
    }

    const passwordHash = await hashPassword(password);
    const newUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      nickname: (nickname && nickname.trim()) || 'Viajante dos Jogos',
      avatar: avatar || '🧙‍♂️',
      role: 'player',
      passwordHash,
      lgpdConsentDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    this.saveUsers();

    // Log de Auditoria LGPD
    this.logLgpdAction('USER_REGISTERED_CONSENT', newUser.id, cleanEmail);

    // Inicia sessão automaticamente
    const session = {
      id: newUser.id,
      email: newUser.email,
      nickname: newUser.nickname,
      avatar: newUser.avatar,
      role: newUser.role,
      isGuest: false
    };
    this.saveSession(session);
    return session;
  }

  // Login de Usuário
  async login({ email, password }) {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const hash = await hashPassword(password);
    if (user.passwordHash !== hash) {
      throw new Error('E-mail ou senha incorretos.');
    }

    const session = {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      role: user.role,
      isGuest: false
    };
    this.saveSession(session);
    this.logLgpdAction('USER_LOGIN', user.id, cleanEmail);
    return session;
  }

  // Login como Visitante (Modo Rápido sem Cadastro)
  loginAsGuest(nickname = 'Visitante Arcano', avatar = '🦊') {
    const session = {
      id: 'guest_' + Math.random().toString(36).substring(2, 8),
      email: null,
      nickname,
      avatar,
      role: 'guest',
      isGuest: true
    };
    this.saveSession(session);
    return session;
  }

  // Logout
  logout() {
    this.saveSession(null);
  }

  // Solicitação de Recuperação de Senha (Gera link e token seguro)
  requestPasswordReset(email) {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(u => u.email === cleanEmail);
    if (!user) {
      throw new Error('E-mail não encontrado no sistema.');
    }

    const token = 'rst_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
    const expiresAt = Date.now() + 1000 * 60 * 60; // 1 hora de validade

    let tokens = [];
    try {
      const data = localStorage.getItem(RESET_TOKENS_KEY);
      if (data) tokens = JSON.parse(data);
    } catch (e) {}

    tokens.push({ token, email: cleanEmail, expiresAt });
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));

    this.logLgpdAction('PASSWORD_RESET_REQUESTED', user.id, cleanEmail);

    return {
      token,
      email: cleanEmail,
      resetUrl: `${window.location.origin}/#reset-token=${token}`,
      message: `Link de redefinição de senha gerado para ${cleanEmail}.`
    };
  }

  // Redefinir Senha com Token de Recuperação
  async resetPasswordWithToken(token, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve possuir no mínimo 6 caracteres.');
    }

    let tokens = [];
    try {
      const data = localStorage.getItem(RESET_TOKENS_KEY);
      if (data) tokens = JSON.parse(data);
    } catch (e) {}

    const tokenObj = tokens.find(t => t.token === token && t.expiresAt > Date.now());
    if (!tokenObj) {
      throw new Error('Token de recuperação inválido ou expirado.');
    }

    const user = this.users.find(u => u.email === tokenObj.email);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    user.passwordHash = await hashPassword(newPassword);
    this.saveUsers();

    // Remove token usado
    tokens = tokens.filter(t => t.token !== token);
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));

    this.logLgpdAction('PASSWORD_RESET_COMPLETED', user.id, user.email);
    return true;
  }

  // Função Exclusiva do Usuário Master: Alterar senha de qualquer usuário
  async masterChangeUserPassword(targetUserId, newPassword) {
    if (!this.session || this.session.role !== 'master') {
      throw new Error('Acesso negado: Somente o Usuário Master pode alterar senhas de outros usuários.');
    }
    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha deve possuir no mínimo 6 caracteres.');
    }

    const target = this.users.find(u => u.id === targetUserId);
    if (!target) {
      throw new Error('Usuário alvo não encontrado.');
    }

    target.passwordHash = await hashPassword(newPassword);
    this.saveUsers();

    this.logLgpdAction('MASTER_PASSWORD_OVERRIDE', target.id, `by ${this.session.email}`);
    return true;
  }

  // Função Exclusiva do Usuário Master: Listar todos os usuários
  getAllUsersForMaster() {
    if (!this.session || this.session.role !== 'master') {
      throw new Error('Acesso negado.');
    }
    return this.users.map(u => ({
      id: u.id,
      email: u.email,
      nickname: u.nickname,
      avatar: u.avatar,
      role: u.role,
      createdAt: u.createdAt,
      lgpdConsentDate: u.lgpdConsentDate
    }));
  }

  // LGPD Art. 18: Direito à Exclusão Definitiva dos Dados (Esquecimento)
  deleteUserAccount(userId) {
    const isSelf = this.session && this.session.id === userId;
    const isMaster = this.session && this.session.role === 'master';

    if (!isSelf && !isMaster) {
      throw new Error('Você não tem permissão para excluir esta conta.');
    }

    const userToDelete = this.users.find(u => u.id === userId);
    if (!userToDelete) throw new Error('Usuário não encontrado.');

    if (userToDelete.role === 'master' && this.users.filter(u => u.role === 'master').length <= 1) {
      throw new Error('O Usuário Master principal não pode ser excluído.');
    }

    this.users = this.users.filter(u => u.id !== userId);
    this.saveUsers();

    this.logLgpdAction('USER_DATA_DELETED_LGPD', userId, userToDelete.email);

    if (isSelf) {
      this.logout();
    }
    return true;
  }

  // Registro de Auditoria de Ações LGPD
  logLgpdAction(action, userId, detail) {
    try {
      const logs = JSON.parse(localStorage.getItem(LGPD_AUDIT_KEY) || '[]');
      logs.unshift({
        action,
        userId,
        detail,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(LGPD_AUDIT_KEY, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {}
  }

  getCurrentSession() {
    return this.session;
  }

  isMaster() {
    return this.session && this.session.role === 'master';
  }
}

export const authService = new AuthService();
