// ============================================================================
// SERVIÇO DE PERFIL, AUTENTICAÇÃO E PROGRESSÃO DE XP — ARCANA TABLE
// ============================================================================

const STORAGE_KEY = 'arcana_table_player_profile';

export const AVATARS = [
  { id: 'mage', emoji: '🧙‍♂️', name: 'Arquimago' },
  { id: 'elf', emoji: '🧝‍♀️', name: 'Guardiã Élfica' },
  { id: 'knight', emoji: '⚔️', name: 'Guerreiro da Aliança' },
  { id: 'rogue', emoji: '🦊', name: 'Mestre da Trapaça' },
  { id: 'dragon', emoji: '🐉', name: 'Senhor dos Dragões' },
  { id: 'monarch', emoji: '👑', name: 'Soberano da Corte' },
  { id: 'owl', emoji: '🦉', name: 'Oráculo da Sabedoria' },
  { id: 'crystal', emoji: '🔮', name: 'Vidente Místico' },
];

export const UNLOCKABLE_TITLES = [
  { id: 'novice', name: 'Iniciado Arcano', minLevel: 1 },
  { id: 'apprentice', name: 'Estrategista em Ascensão', minLevel: 3 },
  { id: 'bluffer', name: 'Mestre do Blefe', minLevel: 5 },
  { id: 'dreamer', name: 'Tecelão de Sonhos', minLevel: 8 },
  { id: 'champion', name: 'Campeão da Aliança', minLevel: 10 },
  { id: 'grandmaster', name: 'Grão-Mestre da Mesa', minLevel: 15 },
  { id: 'legend', name: 'Lenda Imortal de Arcana', minLevel: 20 },
];

const DEFAULT_GAMES = [
  'cronicas', 'corte', 'onirico', 'sonhos',
  'sintonia', 'jukebox', 'palavra', 'quemdisse', 'saber'
];

export function calcLevel(xp) {
  if (!xp || xp <= 0) return 1;
  // Progressão suave: Nível 1 = 0-39, Nível 2 = 40-159, Nível 3 = 160-359...
  return Math.floor(Math.sqrt(xp / 40)) + 1;
}

export function calcXPForNextLevel(currentLevel) {
  return Math.pow(currentLevel, 2) * 40;
}

export function calcXPProgress(xp) {
  const level = calcLevel(xp);
  const currentLevelBaseXP = Math.pow(level - 1, 2) * 40;
  const nextLevelXP = Math.pow(level, 2) * 40;
  const range = nextLevelXP - currentLevelBaseXP;
  const progressInLevel = Math.max(0, xp - currentLevelBaseXP);
  const percent = Math.min(100, Math.round((progressInLevel / range) * 100));
  return {
    level,
    currentXP: xp,
    levelBaseXP: currentLevelBaseXP,
    nextLevelXP,
    neededForNext: nextLevelXP - xp,
    percent
  };
}

export function getDefaultProfile() {
  const gameStats = {};
  DEFAULT_GAMES.forEach(g => {
    gameStats[g] = { xp: 0, level: 1, matches: 0, wins: 0, bestScore: 0 };
  });

  return {
    id: 'arcana_p_' + Math.random().toString(36).substring(2, 9),
    nickname: 'Viajante Arcano',
    avatar: '🧙‍♂️',
    title: 'Iniciado Arcano',
    isGuest: true,
    email: null,
    globalXP: 50,
    globalLevel: 1,
    totalMatches: 0,
    totalWins: 0,
    winStreak: 0,
    bestStreak: 0,
    gameStats,
    createdAt: new Date().toISOString()
  };
}

class PlayerService {
  constructor() {
    this.profile = this.loadProfile();
  }

  loadProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        // Garantir que todos os 9 jogos existam no objeto
        if (!parsed.gameStats) parsed.gameStats = {};
        DEFAULT_GAMES.forEach(g => {
          if (!parsed.gameStats[g]) {
            parsed.gameStats[g] = { xp: 0, level: 1, matches: 0, wins: 0, bestScore: 0 };
          }
        });
        parsed.globalLevel = calcLevel(parsed.globalXP || 0);
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao carregar perfil do jogador:', e);
    }
    const def = getDefaultProfile();
    this.saveProfile(def);
    return def;
  }

  saveProfile(profile) {
    this.profile = { ...profile, globalLevel: calcLevel(profile.globalXP || 0) };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    } catch (e) {
      console.error('Erro ao salvar perfil:', e);
    }
    return this.profile;
  }

  getProfile() {
    return this.profile;
  }

  updateProfile({ nickname, avatar, title }) {
    if (nickname && nickname.trim()) {
      this.profile.nickname = nickname.trim().slice(0, 20);
    }
    if (avatar) {
      this.profile.avatar = avatar;
    }
    if (title) {
      this.profile.title = title;
    }
    return this.saveProfile(this.profile);
  }

  recordGameResult(gameId, won = false, details = {}) {
    const xpGained = won ? 100 : 35;
    const oldGlobalLevel = calcLevel(this.profile.globalXP || 0);
    
    // Atualiza XP Global
    this.profile.globalXP = (this.profile.globalXP || 0) + xpGained;
    const newGlobalLevel = calcLevel(this.profile.globalXP);
    const leveledUpGlobal = newGlobalLevel > oldGlobalLevel;

    // Atualiza Partidas Globais
    this.profile.totalMatches = (this.profile.totalMatches || 0) + 1;
    if (won) {
      this.profile.totalWins = (this.profile.totalWins || 0) + 1;
      this.profile.winStreak = (this.profile.winStreak || 0) + 1;
      if (this.profile.winStreak > (this.profile.bestStreak || 0)) {
        this.profile.bestStreak = this.profile.winStreak;
      }
    } else {
      this.profile.winStreak = 0;
    }

    // Atualiza Estatísticas do Jogo Específico
    if (!this.profile.gameStats[gameId]) {
      this.profile.gameStats[gameId] = { xp: 0, level: 1, matches: 0, wins: 0, bestScore: 0 };
    }
    const gStat = this.profile.gameStats[gameId];
    const oldGameLevel = calcLevel(gStat.xp || 0);
    gStat.xp = (gStat.xp || 0) + xpGained;
    const newGameLevel = calcLevel(gStat.xp);
    const leveledUpGame = newGameLevel > oldGameLevel;
    gStat.level = newGameLevel;
    gStat.matches = (gStat.matches || 0) + 1;
    if (won) gStat.wins = (gStat.wins || 0) + 1;
    if (details.score && details.score > (gStat.bestScore || 0)) {
      gStat.bestScore = details.score;
    }

    this.saveProfile(this.profile);

    return {
      xpGained,
      won,
      leveledUpGlobal,
      newGlobalLevel,
      leveledUpGame,
      newGameLevel,
      profile: this.profile
    };
  }

  getUnlockedTitles() {
    const lvl = this.profile.globalLevel || 1;
    return UNLOCKABLE_TITLES.filter(t => t.minLevel <= lvl);
  }

  resetStats() {
    const def = getDefaultProfile();
    def.nickname = this.profile.nickname;
    def.avatar = this.profile.avatar;
    return this.saveProfile(def);
  }
}

export const playerService = new PlayerService();
