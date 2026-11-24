import {
  canAttackMonster,
  actAttackMonster,
  actSummonHero,
  actDrawCard,
  actPlaySpell,
  actEquipItem,
  actActivateHeroAbility,
  actPassTurn,
  actChallengeBluff,
  actPlayModifier,
  getPartyClasses,
} from './gameLogic.js';

/**
 * INTELIGÊNCIA ARTIFICIAL DOS BOTS: HEROES LOVE TO LIE
 * Toma decisões estratégicas autônomas de forma fluida e humanizada.
 */
class BotAIEngine {
  constructor() {
    this.turnTimer = null;
    this.reactionTimer = null;
    this.isEvaluating = false;
  }

  clearTimers() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
      this.turnTimer = null;
    }
    if (this.reactionTimer) {
      clearTimeout(this.reactionTimer);
      this.reactionTimer = null;
    }
  }

  // Avalia o estado do jogo e engatilha ações para o bot
  evaluate(state, onStateUpdate) {
    if (!state || state.status !== 'playing') {
      this.clearTimers();
      return;
    }

    // 1. REAÇÃO A BLEFE / MODIFICADORES
    if (state.pendingReaction && !this.reactionTimer) {
      const reaction = state.pendingReaction;
      const aliveBots = state.players.filter((p) => p.isBot && p.id !== reaction.initiatorId);

      if (aliveBots.length > 0) {
        this.reactionTimer = setTimeout(() => {
          this.decideBotReaction(state, aliveBots, onStateUpdate);
          this.reactionTimer = null;
        }, 1800 + Math.random() * 1200); // 1.8s a 3.0s de hesitação natural
      }
      return;
    }

    // 2. TURNO DE AÇÃO DO BOT
    const currentTurnPlayer = state.players.find((p) => p.id === state.turnPlayerId);
    if (currentTurnPlayer && currentTurnPlayer.isBot && !this.turnTimer) {
      this.turnTimer = setTimeout(() => {
        this.executeBotAction(state, currentTurnPlayer, onStateUpdate);
        this.turnTimer = null;
      }, 1200 + Math.random() * 1000); // 1.2s a 2.2s de leitura
    }
  }

  // Decisão de reação a blefe
  decideBotReaction(state, bots, onStateUpdate) {
    const reaction = state.pendingReaction;
    if (!reaction) return;

    // Um dos bots decide se desafia ("🚨 MENTIRA!")
    for (const bot of bots) {
      let challengeChance = 0.15; // Chance base de desconfiança

      // Se foi baixado explicitamente em MODO BLEFE
      if (reaction.isBluff) {
        challengeChance = 0.45;

        // Se o iniciante estiver prestes a vencer por 6 classes
        const initiator = state.players.find((p) => p.id === reaction.initiatorId);
        if (initiator && getPartyClasses(initiator).length >= 5) {
          challengeChance = 0.75;
        }

        // Se o iniciante precisa dessa classe para atacar o 3º monstro
        if (initiator && initiator.slainMonsters.length >= 2) {
          challengeChance = 0.8;
        }
      }

      if (Math.random() < challengeChance) {
        actChallengeBluff(state, bot.id);
        if (onStateUpdate) onStateUpdate(state);
        return;
      }
    }
  }

  // Executa uma ação inteligente no turno do Bot
  executeBotAction(state, bot, onStateUpdate) {
    if (state.status !== 'playing' || state.turnPlayerId !== bot.id) return;

    // Se acabou o PA, passa o turno
    if (state.currentPA <= 0) {
      actPassTurn(state);
      if (onStateUpdate) onStateUpdate(state);
      return;
    }

    const partyClasses = getPartyClasses(bot);

    // PRIORIDADE 1: ATACAR MONSTRO (se tiver PA e cumprir os requisitos)
    const hasSkeletonDragon = bot.slainMonsters.some((m) => m.id === 'monster_2');
    const attackCost = hasSkeletonDragon ? 1 : 2;

    if (state.currentPA >= attackCost) {
      const attackableMonster = state.activeMonsters.find((m) => canAttackMonster(bot, m));
      if (attackableMonster) {
        actAttackMonster(state, bot.id, attackableMonster.id);
        if (onStateUpdate) onStateUpdate(state);
        return;
      }
    }

    // PRIORIDADE 2: INVOCAR HERÓI DA MÃO
    const heroIndices = [];
    bot.hand.forEach((card, idx) => {
      if (card.type === 'hero') heroIndices.push(idx);
    });

    if (heroIndices.length > 0 && state.currentPA >= 1) {
      // Procura um herói cuja classe ainda não esteja na party
      const missingClassHeroIdx = heroIndices.find((idx) => !partyClasses.includes(bot.hand[idx].heroClass));

      if (missingClassHeroIdx !== undefined) {
        // Invoca honestamente
        actSummonHero(state, bot.id, missingClassHeroIdx, false);
        if (onStateUpdate) onStateUpdate(state);
        return;
      }

      // Se já tem essa classe ou quer blefar para atacar um monstro
      const allClassKeys = ['fighter', 'wizard', 'thief', 'guardian', 'ranger', 'bard'];
      const missingClasses = allClassKeys.filter((c) => !partyClasses.includes(c));

      // 35% de chance de blefar uma classe que falta para atacar monstros ou vencer
      if (missingClasses.length > 0 && Math.random() < 0.35) {
        const bluffedClass = missingClasses[Math.floor(Math.random() * missingClasses.length)];
        actSummonHero(state, bot.id, heroIndices[0], true, bluffedClass);
        if (onStateUpdate) onStateUpdate(state);
        return;
      }

      // Senão baixa o herói honestamente
      actSummonHero(state, bot.id, heroIndices[0], false);
      if (onStateUpdate) onStateUpdate(state);
      return;
    }

    // PRIORIDADE 3: JOGAR MAGIA (se tiver na mão)
    const spellIdx = bot.hand.findIndex((c) => c.type === 'spell');
    if (spellIdx !== -1 && state.currentPA >= 1) {
      actPlaySpell(state, bot.id, spellIdx);
      if (onStateUpdate) onStateUpdate(state);
      return;
    }

    // PRIORIDADE 4: EQUIPAR ITEM EM UM HERÓI SEM ITEM
    const itemIdx = bot.hand.findIndex((c) => c.type === 'item');
    if (itemIdx !== -1 && state.currentPA >= 1 && bot.party.length > 0) {
      const heroWithoutItem = bot.party.find((h) => !h.equippedItem);
      if (heroWithoutItem) {
        actEquipItem(state, bot.id, itemIdx, heroWithoutItem.instanceId);
        if (onStateUpdate) onStateUpdate(state);
        return;
      }
    }

    // PRIORIDADE 5: ATIVAR HABILIDADE DE HERÓI DISPONÍVEL NA MESA
    const heroWithAbility = bot.party.find((h) => !h.abilityUsedThisTurn && h.card.rollTarget);
    if (heroWithAbility && state.currentPA >= 1) {
      actActivateHeroAbility(state, bot.id, heroWithAbility.instanceId);
      if (onStateUpdate) onStateUpdate(state);
      return;
    }

    // PRIORIDADE 6: COMPRAR CARTA (se tiver menos de 4 cartas ou sem outras opções)
    if (state.currentPA >= 1) {
      actDrawCard(state, bot.id);
      if (onStateUpdate) onStateUpdate(state);
      return;
    }

    // Passa o turno
    actPassTurn(state);
    if (onStateUpdate) onStateUpdate(state);
  }
}

export const botAI = new BotAIEngine();
export default botAI;
