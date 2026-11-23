import { supabase } from '../lib/supabase.js';

// Chave para fallback no localStorage caso a tabela ainda não esteja no Supabase
const LOCAL_STATS_KEY = 'ARCANUM_PLAYER_STATS_CACHE';

// Recupera dados locais de fallback
const getLocalStats = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STATS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
};

const saveLocalStats = (statsObj) => {
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(statsObj));
  } catch (err) {}
};

/**
 * Garante ou cria registro inicial do jogador
 */
export const getOrCreatePlayerStats = async (nickname) => {
  if (!nickname) return null;
  const cleanNick = nickname.trim();

  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('nickname', cleanNick)
      .maybeSingle();

    if (!error && data) {
      return data;
    }

    if (!error && !data) {
      const initial = {
        nickname: cleanNick,
        games_played: 0,
        wins: 0,
        losses: 0,
        epic_strikes_dealt: 0,
        epic_strikes_received: 0,
        assassinations_dealt: 0,
        assassinations_received: 0,
        steals_dealt: 0,
        steals_received: 0,
        bluffs_caught: 0,
        bluffs_exposed: 0,
        blocks_performed: 0,
        cards_used: {},
        score: 0,
      };

      const { data: inserted } = await supabase
        .from('player_stats')
        .insert([initial])
        .select()
        .maybeSingle();

      return inserted || initial;
    }
  } catch (err) {
    console.warn('[Stats] Falha ao conectar player_stats no Supabase, usando cache local:', err);
  }

  // Fallback Local
  const local = getLocalStats();
  if (!local[cleanNick]) {
    local[cleanNick] = {
      nickname: cleanNick,
      games_played: 0,
      wins: 0,
      losses: 0,
      epic_strikes_dealt: 0,
      epic_strikes_received: 0,
      assassinations_dealt: 0,
      assassinations_received: 0,
      steals_dealt: 0,
      steals_received: 0,
      bluffs_caught: 0,
      bluffs_exposed: 0,
      blocks_performed: 0,
      cards_used: {},
      score: 0,
    };
    saveLocalStats(local);
  }
  return local[cleanNick];
};

/**
 * Registra o uso/declaração de uma carta por um jogador
 */
export const trackCardUsage = async (nickname, cardCode) => {
  if (!nickname || !cardCode) return;
  const stats = await getOrCreatePlayerStats(nickname);
  if (!stats) return;

  const cardsUsed = { ...(stats.cards_used || {}) };
  cardsUsed[cardCode] = (cardsUsed[cardCode] || 0) + 1;

  const updates = {
    cards_used: cardsUsed,
    updated_at: new Date().toISOString(),
  };

  try {
    await supabase.from('player_stats').update(updates).eq('nickname', nickname);
  } catch (err) {}

  // Atualiza Local
  const local = getLocalStats();
  if (local[nickname]) {
    local[nickname].cards_used = cardsUsed;
    saveLocalStats(local);
  }
};

/**
 * Registra golpes de combate (Golpe Épico, Fúria Olímpica, Manto Élfico)
 */
export const trackCombatStrike = async (actorNick, targetNick, type) => {
  if (actorNick) {
    const actorStats = await getOrCreatePlayerStats(actorNick);
    if (actorStats) {
      let field = '';
      if (type === 'EPIC_STRIKE') field = 'epic_strikes_dealt';
      else if (type === 'ASSASSINATE') field = 'assassinations_dealt';
      else if (type === 'STEAL') field = 'steals_dealt';

      if (field) {
        const val = (actorStats[field] || 0) + 1;
        try {
          await supabase.from('player_stats').update({ [field]: val }).eq('nickname', actorNick);
        } catch (e) {}

        const local = getLocalStats();
        if (local[actorNick]) {
          local[actorNick][field] = val;
          saveLocalStats(local);
        }
      }
    }
  }

  if (targetNick) {
    const targetStats = await getOrCreatePlayerStats(targetNick);
    if (targetStats) {
      let field = '';
      if (type === 'EPIC_STRIKE') field = 'epic_strikes_received';
      else if (type === 'ASSASSINATE') field = 'assassinations_received';
      else if (type === 'STEAL') field = 'steals_received';

      if (field) {
        const val = (targetStats[field] || 0) + 1;
        try {
          await supabase.from('player_stats').update({ [field]: val }).eq('nickname', targetNick);
        } catch (e) {}

        const local = getLocalStats();
        if (local[targetNick]) {
          local[targetNick][field] = val;
          saveLocalStats(local);
        }
      }
    }
  }
};

/**
 * Registra o resultado de uma contestação ("MENTIRA!")
 */
export const trackBluffCall = async (blufferNick, challengerNick, wasCaught) => {
  if (wasCaught) {
    // Bluffer foi pego
    if (blufferNick) {
      const s = await getOrCreatePlayerStats(blufferNick);
      if (s) {
        const val = (s.bluffs_caught || 0) + 1;
        try {
          await supabase.from('player_stats').update({ bluffs_caught: val }).eq('nickname', blufferNick);
        } catch (e) {}
      }
    }

    // Challenger acertou
    if (challengerNick) {
      const s = await getOrCreatePlayerStats(challengerNick);
      if (s) {
        const val = (s.bluffs_exposed || 0) + 1;
        const newScore = (s.score || 0) + 25;
        try {
          await supabase.from('player_stats').update({ bluffs_exposed: val, score: newScore }).eq('nickname', challengerNick);
        } catch (e) {}
      }
    }
  }
};

/**
 * Registra um bloqueio realizado
 */
export const trackBlock = async (blockerNick) => {
  if (!blockerNick) return;
  const s = await getOrCreatePlayerStats(blockerNick);
  if (s) {
    const val = (s.blocks_performed || 0) + 1;
    try {
      await supabase.from('player_stats').update({ blocks_performed: val }).eq('nickname', blockerNick);
    } catch (e) {}
  }
};

/**
 * Registra final de partida (Vitória e Derrotas)
 */
export const trackMatchOutcome = async (winnerNick, allPlayerNicks = []) => {
  if (winnerNick) {
    const w = await getOrCreatePlayerStats(winnerNick);
    if (w) {
      const wins = (w.wins || 0) + 1;
      const games = (w.games_played || 0) + 1;
      const score = (w.score || 0) + 100;

      try {
        await supabase.from('player_stats').update({ wins, games_played: games, score }).eq('nickname', winnerNick);
      } catch (e) {}

      const local = getLocalStats();
      if (local[winnerNick]) {
        local[winnerNick].wins = wins;
        local[winnerNick].games_played = games;
        local[winnerNick].score = score;
        saveLocalStats(local);
      }
    }
  }

  for (const nick of allPlayerNicks) {
    if (nick !== winnerNick) {
      const p = await getOrCreatePlayerStats(nick);
      if (p) {
        const losses = (p.losses || 0) + 1;
        const games = (p.games_played || 0) + 1;
        const score = Math.max(0, (p.score || 0) + 15);

        try {
          await supabase.from('player_stats').update({ losses, games_played: games, score }).eq('nickname', nick);
        } catch (e) {}

        const local = getLocalStats();
        if (local[nick]) {
          local[nick].losses = losses;
          local[nick].games_played = games;
          local[nick].score = score;
          saveLocalStats(local);
        }
      }
    }
  }
};

/**
 * Obtém todos os jogadores ordenados por pontuação/vitórias (Ranking Geral)
 */
export const fetchLeaderboard = async () => {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .order('score', { ascending: false })
      .order('wins', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[fetchLeaderboard] Erro ao ler Supabase:', err);
  }

  // Fallback Local
  const local = getLocalStats();
  return Object.values(local).sort((a, b) => (b.score || 0) - (a.score || 0) || (b.wins || 0) - (a.wins || 0));
};

/**
 * Zera completamente o ranking de todos os jogadores
 */
export const resetAllRankings = async () => {
  try {
    const { error } = await supabase.from('player_stats').delete().neq('nickname', '___DUMMY___');
    if (error) console.error('Erro ao deletar player_stats no Supabase:', error);
  } catch (err) {
    console.warn('Erro ao zerar no Supabase:', err);
  }

  // Limpa o cache local
  localStorage.removeItem(LOCAL_STATS_KEY);
  return true;
};
