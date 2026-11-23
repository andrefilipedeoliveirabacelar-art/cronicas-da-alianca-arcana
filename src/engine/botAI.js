import { supabase } from '../lib/supabase.js';
import {
  actCollect1,
  actEpicStrike,
  declareAction,
  callBluff,
  acceptAction,
  declareBlock,
} from './gameLogic.js';

// Roster de Bots Arcanos Temáticos
export const BOT_ROSTER = [
  { nickname: '🤖 Mago Alquimista', theme: 'bot_mago' },
  { nickname: '🤖 Guardião de Gondor', theme: 'bot_guerreiro' },
  { nickname: '🤖 Oráculo das Sombras', theme: 'bot_oraculo' },
  { nickname: '🤖 Larápio de Erebor', theme: 'bot_ladrao' },
  { nickname: '🤖 Semideus Titânico', theme: 'bot_semideus' },
];

export const isPlayerBot = (player) => {
  if (!player) return false;
  return (
    player.nickname?.startsWith('🤖') ||
    player.avatar_theme?.startsWith('bot_') ||
    Boolean(player.is_bot)
  );
};

// Adiciona um Bot à sala
export const addBotToRoom = async (roomId, currentPlayers = []) => {
  if (currentPlayers.length >= 5) {
    throw new Error('A sala atingiu o limite de 5 guerreiros.');
  }

  // Encontra um bot que ainda não esteja na sala
  const existingNames = new Set(currentPlayers.map((p) => p.nickname));
  const availableBot = BOT_ROSTER.find((b) => !existingNames.has(b.nickname)) || {
    nickname: `🤖 Autômato ${currentPlayers.length + 1}`,
    theme: 'bot_mago',
  };

  const nextSeat = currentPlayers.length + 1;

  const { data: botPlayer, error } = await supabase
    .from('players')
    .insert([
      {
        room_id: roomId,
        nickname: availableBot.nickname,
        avatar_theme: availableBot.theme,
        seat_order: nextSeat,
        runes: 2,
        is_alive: true,
        is_host: false,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(`Falha ao invocar Bot: ${error.message}`);
  return botPlayer;
};

// Gerenciador de IA dos Bots (Executado centralizadamente pelo Host da Sala)
class BotAIEngine {
  constructor() {
    this.pendingTurnTimer = null;
    this.pendingReactionTimer = null;
    this.processedActionId = null;
  }

  clearTimers() {
    if (this.pendingTurnTimer) {
      clearTimeout(this.pendingTurnTimer);
      this.pendingTurnTimer = null;
    }
    if (this.pendingReactionTimer) {
      clearTimeout(this.pendingReactionTimer);
      this.pendingReactionTimer = null;
    }
  }

  /**
   * Avalia o estado da sala e toma decisões se houver Bot ativo
   */
  evaluate({ room, players, hands, isHost }) {
    if (!isHost || !room || room.status !== 'playing') {
      this.clearTimers();
      return;
    }

    const currentTurnPlayer = players.find((p) => p.id === room.current_turn_player_id);

    // 1. TURNO DO BOT (Fase de Ação)
    if (room.turn_phase === 'action') {
      if (currentTurnPlayer && isPlayerBot(currentTurnPlayer) && currentTurnPlayer.is_alive) {
        if (!this.pendingTurnTimer) {
          const delay = 1600 + Math.random() * 900; // 1.6s a 2.5s
          this.pendingTurnTimer = setTimeout(() => {
            this.executeBotTurn(room, currentTurnPlayer, players, hands);
            this.pendingTurnTimer = null;
          }, delay);
        }
      } else {
        if (this.pendingTurnTimer) {
          clearTimeout(this.pendingTurnTimer);
          this.pendingTurnTimer = null;
        }
      }
    }

    // 2. REAÇÃO DO BOT (Janela de Contestação ou Bloqueio)
    if (room.turn_phase === 'challenge_window' || room.turn_phase === 'block_window') {
      const pending = room.pending_action;
      if (!pending) return;

      const actionKey = `${room.turn_phase}_${pending.actor_id}_${pending.action_code}_${pending.blocked_by_id || ''}`;
      if (this.processedActionId === actionKey) return;

      // Encontra bots vivos elegíveis para reagir
      const aliveBots = players.filter((p) => isPlayerBot(p) && p.is_alive);

      if (aliveBots.length > 0 && !this.pendingReactionTimer) {
        const reactionDelay = 1800 + Math.random() * 800; // 1.8s a 2.6s
        this.pendingReactionTimer = setTimeout(() => {
          this.executeBotReactions(room, aliveBots, players, hands);
          this.processedActionId = actionKey;
          this.pendingReactionTimer = null;
        }, reactionDelay);
      }
    } else {
      this.processedActionId = null;
      if (this.pendingReactionTimer) {
        clearTimeout(this.pendingReactionTimer);
        this.pendingReactionTimer = null;
      }
    }
  }

  // Executa a escolha de ação do Bot
  async executeBotTurn(room, bot, players, hands) {
    try {
      const botHands = hands.filter((h) => h.player_id === bot.id && !h.is_revealed);
      const botCardCodes = botHands.map((h) => h.card_code);
      const aliveOpponents = players.filter((p) => p.id !== bot.id && p.is_alive);

      if (aliveOpponents.length === 0) return;

      // Alvo prioritário (quem tem mais Runas ou menos cartas)
      const target = [...aliveOpponents].sort((a, b) => b.runes - a.runes)[0];

      const runes = bot.runes || 0;

      // 1. Regra Obrigatória: 10+ Runas exige Golpe Épico
      if (runes >= 10) {
        await actEpicStrike(room.id, bot, target);
        return;
      }

      // 2. Se tiver 7 a 9 Runas: 80% chance de Golpe Épico
      if (runes >= 7 && Math.random() < 0.8) {
        await actEpicStrike(room.id, bot, target);
        return;
      }

      // 3. Escolha entre ação real (70%) e blefe (30%)
      const isBluffing = Math.random() < 0.3;

      if (!isBluffing && botCardCodes.length > 0) {
        // Tenta usar uma carta que realmente possui
        const cardToUse = botCardCodes[Math.floor(Math.random() * botCardCodes.length)];

        if (cardToUse === 'DEMIGOD' && runes >= 3) {
          await declareAction(room.id, bot, 'ASSASSINATE', target);
          return;
        } else if (cardToUse === 'RINGBEARER') {
          await declareAction(room.id, bot, 'STEAL', target);
          return;
        } else if (cardToUse === 'DRAGONSLAYER') {
          await declareAction(room.id, bot, 'TAX_TREASURY');
          return;
        } else if (cardToUse === 'ARCHMAGE') {
          await declareAction(room.id, bot, 'ARCHMAGE_EXCHANGE');
          return;
        } else if (cardToUse === 'RELIC_KEEPER') {
          await declareAction(room.id, bot, 'PERPETUAL_VOW');
          return;
        } else if (cardToUse === 'ORACLE') {
          await declareAction(room.id, bot, 'DIVINATION', target);
          return;
        } else if (cardToUse === 'DARK_LORD') {
          await declareAction(room.id, bot, 'DARK_DRAIN');
          return;
        }
      }

      // 4. Se for blefe ou ação básica:
      const randomRoll = Math.random();
      if (randomRoll < 0.35) {
        // Coletar 1 Runa
        await actCollect1(room.id, bot);
      } else if (randomRoll < 0.65) {
        // Ajuda da Guilda (+2)
        await declareAction(room.id, bot, 'GUILD_AID');
      } else if (runes >= 3 && Math.random() < 0.5) {
        // Blefe de Semideus (Assassinar)
        await declareAction(room.id, bot, 'ASSASSINATE', target);
      } else {
        // Blefe de Pilhagem de Smaug (+3)
        await declareAction(room.id, bot, 'TAX_TREASURY');
      }
    } catch (err) {
      console.warn('[BotAI] Exceção no turno do bot:', err);
      // Fallback de segurança para não travar: coleta 1 runa
      try {
        await actCollect1(room.id, bot);
      } catch (e) {}
    }
  }

  // Executa reação dos Bots na janela de contestação ou bloqueio
  async executeBotReactions(room, aliveBots, players, hands) {
    try {
      const pending = room.pending_action;
      if (!pending) return;

      const isBlockContest = Boolean(pending.blocked_by_id);
      const claimantId = isBlockContest ? pending.blocked_by_id : pending.actor_id;
      const claimedCard = isBlockContest ? pending.block_card : pending.claimed_card;

      for (const bot of aliveBots) {
        // O autor da afirmação não contesta a si mesmo
        if (bot.id === claimantId) continue;

        const botHands = hands.filter((h) => h.player_id === bot.id && !h.is_revealed);
        const botCardCodes = botHands.map((h) => h.card_code);

        // Se estiver na janela de contestação ("MENTIRA!")
        if (room.turn_phase === 'challenge_window') {
          // Lógica de dedução:
          // Se o bot tem 2 cópias da carta alegada -> 90% chance de chamar mentira!
          const botCopies = botCardCodes.filter((c) => c === claimedCard).length;
          
          let callBluffChance = 0.08; // 8% desconfiança natural
          if (botCopies >= 2) callBluffChance = 0.90;
          else if (botCopies === 1) callBluffChance = 0.25;

          if (Math.random() < callBluffChance) {
            await callBluff(room.id, bot);
            return; // Uma contestação encerra a janela
          } else {
            await acceptAction(room.id, bot);
          }
        }

        // Se estiver na janela de bloqueio ("block_window")
        if (room.turn_phase === 'block_window') {
          const isTarget = pending.target_id === bot.id;
          const isGuildAid = pending.action_code === 'GUILD_AID';

          if (isTarget || isGuildAid) {
            let blockCardToUse = null;

            if (isGuildAid && botCardCodes.includes('DEMIGOD')) {
              blockCardToUse = 'DEMIGOD';
            } else if (pending.action_code === 'STEAL') {
              if (botCardCodes.includes('RINGBEARER')) blockCardToUse = 'RINGBEARER';
              else if (botCardCodes.includes('ARCHMAGE')) blockCardToUse = 'ARCHMAGE';
              else if (botCardCodes.includes('DARK_LORD')) blockCardToUse = 'DARK_LORD';
            } else if (pending.action_code === 'ASSASSINATE') {
              if (botCardCodes.includes('RELIC_KEEPER')) blockCardToUse = 'RELIC_KEEPER';
            }

            // 85% de chance de bloquear se possuir a carta; 20% de blefar bloqueio se não tiver
            if (blockCardToUse && Math.random() < 0.85) {
              await declareBlock(room.id, bot, blockCardToUse);
              return;
            } else if (!blockCardToUse && isTarget && Math.random() < 0.20) {
              // Blefe de bloqueio
              const bluffBlock = pending.action_code === 'ASSASSINATE' ? 'RELIC_KEEPER' : 'RINGBEARER';
              await declareBlock(room.id, bot, bluffBlock);
              return;
            } else {
              await acceptAction(room.id, bot);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[BotAI] Exceção na reação do bot:', err);
    }
  }
}

export const botAI = new BotAIEngine();
export default botAI;
