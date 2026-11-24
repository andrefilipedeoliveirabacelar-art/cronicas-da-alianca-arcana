import {
  CLASSES,
  PARTY_LEADERS,
  HEROES_CATALOG,
  MONSTERS_CATALOG,
  UTILITY_CATALOG,
  buildFullMainDeck,
  buildMonsterDeck,
  shuffle,
  getCardById,
} from './gameCatalog.js';
import { soundManager } from '../lib/soundFX.js';

/**
 * MOTOR DE REGRAS: HEROES LOVE TO LIE
 * Suporta 100% modo Solo Local (in-memory) e Multiplayer em tempo real.
 */

// Cria uma nova partida Solo com 1 Humano e 2 Bots Arcanos
export const createSoloGame = (humanNickname, chosenLeaderId = 'leader_fighter', botCount = 2) => {
  const mainDeck = buildFullMainDeck();
  const monsterDeck = buildMonsterDeck();

  // 3 monstros ativos no Covil
  const activeMonsters = [monsterDeck.pop(), monsterDeck.pop(), monsterDeck.pop()];

  const humanLeader = PARTY_LEADERS.find((l) => l.id === chosenLeaderId) || PARTY_LEADERS[0];
  const availableLeaders = PARTY_LEADERS.filter((l) => l.id !== chosenLeaderId);
  shuffle(availableLeaders);

  const players = [];

  // Jogador Humano
  const humanStartingHandSize = humanLeader.id === 'leader_bard' ? 6 : 5;
  const humanHand = [];
  for (let c = 0; c < humanStartingHandSize; c++) {
    if (mainDeck.length > 0) humanHand.push(mainDeck.pop());
  }

  players.push({
    id: 'player_human',
    nickname: humanNickname || 'Você',
    isHost: true,
    isBot: false,
    leader: humanLeader,
    party: [], // Heróis na mesa
    slainMonsters: [], // Troféus de monstros
    hand: humanHand,
  });

  // Bots Oponentes
  const botNames = ['🤖 Valquíria de Sangue', '🤖 Mago Alquimista', '🤖 Ladino das Sombras'];
  for (let i = 0; i < botCount; i++) {
    const leader = availableLeaders[i] || PARTY_LEADERS[i + 1];
    const botHandSize = leader.id === 'leader_bard' ? 6 : 5;
    const botHand = [];
    for (let c = 0; c < botHandSize; c++) {
      if (mainDeck.length > 0) botHand.push(mainDeck.pop());
    }

    players.push({
      id: `bot_${i + 1}`,
      nickname: botNames[i] || `🤖 Bot Arcano ${i + 1}`,
      isHost: false,
      isBot: true,
      leader: leader,
      party: [],
      slainMonsters: [],
      hand: botHand,
    });
  }

  const gameState = {
    id: `solo_${Date.now()}`,
    status: 'playing',
    turnIndex: 0,
    turnPlayerId: players[0].id,
    currentPA: 3,
    maxPA: 3,
    activeMonsters,
    monsterDeck,
    mainDeck,
    discardPile: [],
    players,
    diceState: {
      die1: 1,
      die2: 1,
      total: 2,
      isRolling: false,
      purpose: null,
      targetName: '',
      modifiers: 0,
    },
    pendingReaction: null, // Janela de blefe e modificadores
    logs: [
      { text: `⚔️ A contenda na Taverna começou! Bem-vindo, ${humanNickname}!`, type: 'action' },
    ],
    winner: null,
  };

  return gameState;
};

// Rolagem aleatória de dados 2d6
export const roll2d6 = () => {
  const die1 = Math.floor(Math.random() * 6) + 1;
  const die2 = Math.floor(Math.random() * 6) + 1;
  return { die1, die2, total: die1 + die2 };
};

// Verifica quais classes uma Party possui atualmente (considerando cartas honestas e declaradas em blefe)
export const getPartyClasses = (player) => {
  const classes = new Set();
  if (player.leader && player.leader.heroClass) {
    classes.add(player.leader.heroClass);
  }

  player.party.forEach((p) => {
    // Se for blefe, conta a classe declarada; se for honesto, conta a classe real
    const heroClass = p.isBluff ? p.declaredClass : p.card.heroClass;
    if (heroClass) classes.add(heroClass);
  });

  return Array.from(classes);
};

// Verifica se um jogador cumpre os requisitos de classes para atacar um Monstro
export const canAttackMonster = (player, monster) => {
  if (!player || !monster) return false;
  const partyClasses = getPartyClasses(player);

  let required = [...monster.requiredClasses];

  // Passiva da Patrulheira: exige 1 classe a menos!
  if (player.leader && player.leader.id === 'leader_ranger' && required.length > 1) {
    required.pop();
  }

  return required.every((reqClass) => partyClasses.includes(reqClass));
};

// Verifica condições de vitória instantânea
export const checkVictory = (player) => {
  if (!player) return null;

  // Condição 1: Caçador Supremo (3 Monstros Abatidos)
  if (player.slainMonsters.length >= 3) {
    return {
      winner: player,
      reason: `🏆 CAÇADOR SUPREMO! ${player.nickname} abateu 3 Monstros Lendários e conquistou a Taverna!`,
    };
  }

  // Condição 2: Aliança Completa (6 Classes Diferentes na Party)
  const partyClasses = getPartyClasses(player);
  if (partyClasses.length >= 6) {
    return {
      winner: player,
      reason: `👑 ALIANÇA COMPLETA! ${player.nickname} uniu todas as 6 Classes de Heróis na sua Party!`,
    };
  }

  return null;
};

// AÇÃO: Comprar 1 Carta (1 PA)
export const actDrawCard = (state, playerId) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.currentPA < 1) return false;

  state.currentPA -= 1;
  soundManager.playPACrystal();

  // Reembaralha se o deck principal estiver vazio
  if (state.mainDeck.length === 0 && state.discardPile.length > 0) {
    state.mainDeck = shuffle([...state.discardPile]);
    state.discardPile = [];
  }

  if (state.mainDeck.length > 0) {
    const card = state.mainDeck.pop();
    player.hand.push(card);
    state.logs.unshift({
      text: `🎴 ${player.nickname} comprou 1 carta do baralho (-1 PA).`,
      type: 'action',
    });
  }

  return true;
};

// AÇÃO: Invocar Herói (1 PA) - Honesto ou Modo Blefe
export const actSummonHero = (state, playerId, handIndex, isBluff = false, declaredClass = null) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.currentPA < 1 || !player.hand[handIndex]) return false;

  const card = player.hand.splice(handIndex, 1)[0];
  state.currentPA -= 1;
  soundManager.playPACrystal();

  const heroEntry = {
    instanceId: card.instanceId || `${card.id}_${Date.now()}`,
    card,
    declaredClass: isBluff ? declaredClass : card.heroClass,
    isBluff,
    isRevealed: !isBluff,
    equippedItem: null,
    abilityUsedThisTurn: false,
  };

  player.party.push(heroEntry);

  const className = CLASSES[heroEntry.declaredClass]?.name || heroEntry.declaredClass;

  if (isBluff) {
    state.logs.unshift({
      text: `🎭 ${player.nickname} baixou uma carta em MODO BLEFE declarando ser [${className}]!`,
      type: 'bluff',
    });
  } else {
    state.logs.unshift({
      text: `✨ ${player.nickname} invocou [${card.name}] (${className}) honestamente!`,
      type: 'action',
    });
  }

  // Abre janela de reação de 6 segundos ("🚨 MENTIRA!")
  state.pendingReaction = {
    type: 'summon_hero',
    initiatorId: playerId,
    initiatorName: player.nickname,
    heroEntry,
    isBluff,
    declaredClass: heroEntry.declaredClass,
    actualClass: card.heroClass,
    card,
    timeRemaining: 6,
  };

  // Se for honesto, rola 2d6 imediatamente para tentar ativar a habilidade gratuitamente
  if (!isBluff && card.rollTarget) {
    executeHeroAbilityRoll(state, player, heroEntry, true);
  }

  const win = checkVictory(player);
  if (win) {
    state.status = 'finished';
    state.winner = win.winner;
    soundManager.playVictoryFanfare();
    state.logs.unshift({ text: win.reason, type: 'slay' });
  }

  return true;
};

// Executa a rolagem de habilidade de um herói
export const executeHeroAbilityRoll = (state, player, heroEntry, isFreeSummonRoll = false) => {
  const roll = roll2d6();
  soundManager.playDiceRoll();

  let bonus = 0;
  // Bardo (+1 em habilidades)
  if (player.leader && player.leader.id === 'leader_bard') bonus += 1;
  // Mago (+1 permanente ao rolar dados para ativar Habilidades de Heróis ou Magias)
  if (player.leader && player.leader.id === 'leader_wizard') bonus += 1;
  // Item equipado
  if (heroEntry.equippedItem) bonus += heroEntry.equippedItem.bonus || 1;

  const total = roll.total + bonus;
  state.diceState = {
    die1: roll.die1,
    die2: roll.die2,
    total,
    isRolling: true,
    purpose: 'hero_ability',
    targetName: heroEntry.card.name,
    modifiers: bonus,
  };

  setTimeout(() => {
    state.diceState.isRolling = false;
  }, 700);

  const needed = heroEntry.card.rollTarget || 7;
  const success = total >= needed;

  if (success) {
    heroEntry.abilityUsedThisTurn = true;
    soundManager.playMonsterSlay();
    applyHeroEffect(state, player, heroEntry.card);
    state.logs.unshift({
      text: `🎲 ${player.nickname} rolou ${roll.die1}+${roll.die2}${bonus > 0 ? ` (+${bonus})` : ''} = ${total} (Meta ${needed}+) e ATIVOU [${heroEntry.card.abilityName}]!`,
      type: 'dice',
    });
  } else {
    state.logs.unshift({
      text: `🎲 ${player.nickname} rolou ${total} (precisava de ${needed}+). Habilidade de [${heroEntry.card.name}] não ativou.`,
      type: 'action',
    });
  }
};

// Aplica o efeito ativado do herói
const applyHeroEffect = (state, player, card) => {
  // Passiva do Mago Elminster (se total >= 10, compra 1 carta)
  if (player.leader?.id === 'leader_wizard' && state.diceState.total >= 10) {
    if (state.mainDeck.length > 0) player.hand.push(state.mainDeck.pop());
  }

  switch (card.id) {
    case 'hero_w1': // Invocador de Faíscas (+2 cartas)
      for (let i = 0; i < 2; i++) {
        if (state.mainDeck.length > 0) player.hand.push(state.mainDeck.pop());
      }
      break;

    case 'hero_w4': // Arquivista Místico (+1 PA extra)
      state.currentPA += 1;
      break;

    case 'hero_t1': // Batedor de Carteiras (rouba 1 carta aleatória de um rival)
      const rivalWithCards = state.players.find((p) => p.id !== player.id && p.hand.length > 0);
      if (rivalWithCards) {
        const stolen = rivalWithCards.hand.pop();
        player.hand.push(stolen);
        state.logs.unshift({
          text: `💰 ${player.nickname} roubou 1 carta da mão de ${rivalWithCards.nickname}!`,
          type: 'action',
        });
      }
      break;

    case 'hero_f1': // Capitão de Armas (Destrói 1 herói rival)
      const rivalWithParty = state.players.find((p) => p.id !== player.id && p.party.length > 0);
      if (rivalWithParty) {
        // Proteção do Baluarte de Ferro não se aplica a combate se for habilidade de herói, mas protege contra spells
        const deadHero = rivalWithParty.party.pop();
        state.discardPile.push(deadHero.card);
        soundManager.playCardDestroy();
        state.logs.unshift({
          text: `⚔️ ${player.nickname} destruiu o herói [${deadHero.card.name}] de ${rivalWithParty.nickname}!`,
          type: 'action',
        });
      }
      break;

    case 'hero_r4': // Ranger Vento-Leste (Compra 3 cartas)
      for (let i = 0; i < 3; i++) {
        if (state.mainDeck.length > 0) player.hand.push(state.mainDeck.pop());
      }
      break;

    default:
      break;
  }
};

// AÇÃO: Ativar Habilidade de Herói na Mesa (1 PA)
export const actActivateHeroAbility = (state, playerId, heroInstanceId) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.currentPA < 1) return false;

  const heroEntry = player.party.find((h) => h.instanceId === heroInstanceId);
  if (!heroEntry || heroEntry.abilityUsedThisTurn) return false;

  state.currentPA -= 1;
  soundManager.playPACrystal();

  executeHeroAbilityRoll(state, player, heroEntry, false);
  return true;
};

// Calcula a chance real de sucesso contra um Monstro com todos os bônus ativos
export const calculateMonsterAttackChance = (player, monster) => {
  if (!player || !monster) return { bonus: 0, target: 8, neededOnDice: 8, pct: 42 };

  let bonus = 0;
  // Bônus do Líder Guerreiro: +1 permanente em ataques a monstros
  if (player.leader?.id === 'leader_fighter') bonus += 1;

  // Bônus do Dragão Esqueleto abatido: +2 permanente em ataques
  if (player.slainMonsters?.some((m) => m.id === 'monster_2')) bonus += 2;

  // Bônus da Hidra de Cristal abatida: +1 em ataques
  if (player.slainMonsters?.some((m) => m.id === 'monster_1')) bonus += 1;

  // Itens equipados na party
  if (player.party) {
    player.party.forEach((h) => {
      if (h.equippedItem?.bonus) bonus += h.equippedItem.bonus;
    });
  }

  const target = monster.rollTarget || 8;
  const neededOnDice = Math.max(2, target - bonus);

  let successWays = 0;
  for (let d1 = 1; d1 <= 6; d1++) {
    for (let d2 = 1; d2 <= 6; d2++) {
      if (d1 + d2 >= neededOnDice) successWays++;
    }
  }

  const pct = Math.min(100, Math.round((successWays / 36) * 100));
  return { bonus, target, neededOnDice, pct };
};

// AÇÃO: Atacar Monstro (2 PA)
export const actAttackMonster = (state, playerId, monsterId) => {
  const player = state.players.find((p) => p.id === playerId);
  const monster = state.activeMonsters.find((m) => m.id === monsterId);

  if (!player || !monster) return false;

  // Custo: 2 PA (ou 1 PA se abateu o Dragão Esqueleto)
  const hasSkeletonDragon = player.slainMonsters.some((m) => m.id === 'monster_2');
  const paCost = hasSkeletonDragon ? 1 : 2;

  if (state.currentPA < paCost) return false;
  if (!canAttackMonster(player, monster)) return false;

  state.currentPA -= paCost;
  soundManager.playPACrystal();

  const roll = roll2d6();
  soundManager.playDiceRoll();

  const attackCalc = calculateMonsterAttackChance(player, monster);
  const bonus = attackCalc.bonus;
  const total = roll.total + bonus;
  state.diceState = {
    die1: roll.die1,
    die2: roll.die2,
    total,
    isRolling: true,
    purpose: 'monster_attack',
    targetName: monster.name,
    modifiers: bonus,
  };

  setTimeout(() => {
    state.diceState.isRolling = false;
  }, 700);

  // SUCESSO: Abateu o Monstro!
  if (total >= monster.rollTarget) {
    soundManager.playMonsterSlay();
    state.activeMonsters = state.activeMonsters.filter((m) => m.id !== monster.id);
    player.slainMonsters.push(monster);

    // Passiva do Patrulheiro: Ao abater um Monstro, ganha +1 PA imediato no mesmo turno!
    if (player.leader?.id === 'leader_ranger') {
      state.currentPA += 1;
      state.logs.unshift({
        text: `🏹 Rastreadora Silvestre concedeu +1 PA imediato pelo abate de [${monster.name}]!`,
        type: 'action',
      });
    }

    // Repõe Monstro no Covil se houver no baralho
    if (state.monsterDeck.length > 0) {
      state.activeMonsters.push(state.monsterDeck.pop());
    }

    state.logs.unshift({
      text: `🏆 GLÓRIA! ${player.nickname} rolou ${roll.die1}+${roll.die2}${bonus > 0 ? ` (+${bonus})` : ''} = ${total} e ABATEU [${monster.name}]! (${monster.rewardDescription})`,
      type: 'slay',
    });

    const win = checkVictory(player);
    if (win) {
      state.status = 'finished';
      state.winner = win.winner;
      soundManager.playVictoryFanfare();
      state.logs.unshift({ text: win.reason, type: 'slay' });
    }
    return true;
  }

  // FALHA: Sofre a penalidade!
  if (total <= monster.failThreshold) {
    soundManager.playCardDestroy();
    applyMonsterFailurePenalty(state, player, monster);
    state.logs.unshift({
      text: `💀 FALHA CRÍTICA! ${player.nickname} rolou ${total} contra [${monster.name}] (limiar ${monster.failThreshold}-). Penalidade sofrida!`,
      type: 'bluff',
    });
    return false;
  }

  // Empate / Falha sem penalidade
  state.logs.unshift({
    text: `🛡️ O ataque de ${player.nickname} contra [${monster.name}] não atingiu a meta de ${monster.rollTarget}+ (rolou ${total}), mas escapou ileso.`,
    type: 'action',
  });

  return false;
};

// Aplica penalidade de falha do monstro
const applyMonsterFailurePenalty = (state, player, monster) => {
  // Guardião Baluarte de Ferro: Suas cartas na Party não podem ser destruídas por penalidades de Monstros (apenas descartar cartas)
  const isGuardianLeader = player.leader?.id === 'leader_guardian';
  const hasObsidianGolem = player.slainMonsters.some((m) => m.id === 'monster_3');

  if (monster.penaltyDescription.includes('Sacrifique')) {
    if (isGuardianLeader || hasObsidianGolem) {
      state.logs.unshift({
        text: `🛡️ ${isGuardianLeader ? 'Baluarte de Ferro' : 'Golem de Obsidiana'} protegeu a Party de ${player.nickname} contra o sacrifício! Em vez disso, descartou 1 carta da mão.`,
        type: 'action',
      });
      if (player.hand.length > 0) player.hand.pop();
      return;
    }

    if (player.party.length > 0) {
      const sacrificed = player.party.pop();
      state.discardPile.push(sacrificed.card);
    }
  } else if (monster.penaltyDescription.includes('Descarte')) {
    player.hand.splice(0, 2);
  }
};

// CONTESTAÇÃO DE BLEFE: "🚨 MENTIRA!"
export const actChallengeBluff = (state, challengerId) => {
  const reaction = state.pendingReaction;
  if (!reaction || reaction.type !== 'summon_hero') return false;

  const liarPlayer = state.players.find((p) => p.id === reaction.initiatorId);
  const challenger = state.players.find((p) => p.id === challengerId);
  if (!liarPlayer || !challenger) return false;

  soundManager.playBluffAlert();

  const isActuallyLying = reaction.actualClass !== reaction.declaredClass;

  if (isActuallyLying) {
    // BLEFE DESMASCARADO!
    // A carta é destruída e o mentiroso perde 1 PA
    soundManager.playCardDestroy();
    liarPlayer.party = liarPlayer.party.filter((h) => h.instanceId !== reaction.heroEntry.instanceId);
    state.discardPile.push(reaction.card);

    if (state.currentPA > 0) state.currentPA -= 1;

    // Passiva do Ladino Velka: rouba 1 carta do mentiroso
    if (challenger.leader?.id === 'leader_thief' && liarPlayer.hand.length > 0) {
      challenger.hand.push(liarPlayer.hand.pop());
    }

    state.logs.unshift({
      text: `🚨 BLEFE DESMASCARADO! ${challenger.nickname} gritou "MENTIRA!" e provou que ${liarPlayer.nickname} não possuía [${CLASSES[reaction.declaredClass]?.name}]. A carta foi destruída!`,
      type: 'bluff',
    });
  } else {
    // ERA VERDADE! O acusador foi imprudente!
    reaction.heroEntry.isBluff = false;
    reaction.heroEntry.isRevealed = true;

    // Acusador deve descartar 2 cartas (ou sacrificar 1 herói)
    if (challenger.hand.length >= 2) {
      challenger.hand.splice(0, 2);
    } else if (challenger.party.length > 0) {
      const sacrificed = challenger.party.pop();
      state.discardPile.push(sacrificed.card);
    }

    state.logs.unshift({
      text: `✨ ERA A MAIS PURA VERDADE! ${liarPlayer.nickname} realmente possuía um [${CLASSES[reaction.declaredClass]?.name}]. ${challenger.nickname} falhou na acusação e foi penalizado!`,
      type: 'action',
    });
  }

  state.pendingReaction = null;
  return true;
};

// Joga uma carta modificadora da mão para alterar a rolagem ativa
export const actPlayModifier = (state, playerId, cardInstanceId, choosePlus = true) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player) return false;

  const cardIdx = player.hand.findIndex((c) => c.instanceId === cardInstanceId && c.type === 'modifier');
  if (cardIdx === -1) return false;

  const modCard = player.hand.splice(cardIdx, 1)[0];
  state.discardPile.push(modCard);

  const bonusVal = Math.abs(modCard.bonus || 2) * (choosePlus ? 1 : -1);
  state.diceState.modifiers += bonusVal;
  state.diceState.total += bonusVal;

  soundManager.playPACrystal();

  state.logs.unshift({
    text: `🎲 ${player.nickname} jogou [${modCard.name}] (${bonusVal >= 0 ? `+${bonusVal}` : bonusVal}) alterando o total dos dados para ${state.diceState.total}!`,
    type: 'dice',
  });

  return true;
};

// AÇÃO: Jogar Magia (1 PA)
export const actPlaySpell = (state, playerId, handIndex, targetRivalId = null) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.currentPA < 1 || !player.hand[handIndex]) return false;

  const spellCard = player.hand.splice(handIndex, 1)[0];
  state.currentPA -= 1;
  soundManager.playPACrystal();

  state.discardPile.push(spellCard);

  switch (spellCard.id) {
    case 'spell_1': // Raio Arcano: Destrói 1 herói rival
      const rival = state.players.find((p) => p.id === targetRivalId) || state.players.find((p) => p.id !== player.id && p.party.length > 0);
      if (rival && rival.party.length > 0) {
        if (rival.leader?.id === 'leader_guardian') {
          state.logs.unshift({
            text: `🛡️ O [Baluarte de Ferro] de ${rival.nickname} impediu a destruição de seus heróis pela magia!`,
            type: 'action',
          });
        } else {
          const dead = rival.party.pop();
          state.discardPile.push(dead.card);
          soundManager.playCardDestroy();
          state.logs.unshift({
            text: `⚡ [${spellCard.name}] de ${player.nickname} fulminou [${dead.card.name}] da Party de ${rival.nickname}!`,
            type: 'action',
          });
        }
      }
      break;

    case 'spell_2': // Pilhagem das Sombras: rouba 2 cartas
      const victim = state.players.find((p) => p.id !== player.id && p.hand.length > 0);
      if (victim) {
        for (let i = 0; i < 2; i++) {
          if (victim.hand.length > 0) player.hand.push(victim.hand.pop());
        }
        state.logs.unshift({
          text: `🖐️ ${player.nickname} usou [${spellCard.name}] e pilhou 2 cartas da mão de ${victim.nickname}!`,
          type: 'action',
        });
      }
      break;

    case 'spell_3': // Poção da Fortuna: compra 3 cartas
      for (let i = 0; i < 3; i++) {
        if (state.mainDeck.length > 0) player.hand.push(state.mainDeck.pop());
      }
      state.logs.unshift({
        text: `🧪 ${player.nickname} bebeu [${spellCard.name}] e comprou 3 cartas!`,
        type: 'action',
      });
      break;

    case 'spell_4': // Vórtice do Caos: todos descartam 1 e compra 2
      state.players.forEach((p) => {
        if (p.id !== player.id && p.hand.length > 0) p.hand.pop();
      });
      for (let i = 0; i < 2; i++) {
        if (state.mainDeck.length > 0) player.hand.push(state.mainDeck.pop());
      }
      state.logs.unshift({
        text: `🌀 [${spellCard.name}] forçou todos os rivais a descartar e ${player.nickname} comprou 2 cartas!`,
        type: 'action',
      });
      break;

    default:
      break;
  }

  return true;
};

// AÇÃO: Equipar Item em um Herói (1 PA)
export const actEquipItem = (state, playerId, handIndex, heroInstanceId) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.currentPA < 1 || !player.hand[handIndex]) return false;

  const heroEntry = player.party.find((h) => h.instanceId === heroInstanceId);
  if (!heroEntry) return false;

  const itemCard = player.hand.splice(handIndex, 1)[0];
  state.currentPA -= 1;
  soundManager.playPACrystal();

  heroEntry.equippedItem = itemCard;

  state.logs.unshift({
    text: `🗡️ ${player.nickname} equipou [${itemCard.name}] (+${itemCard.bonus || 1}) em [${heroEntry.card.name}]!`,
    type: 'action',
  });

  return true;
};

// AÇÃO: Renovar Mão - Descarta tudo e compra 5 (3 PA)
export const actDiscardAndDraw5 = (state, playerId) => {
  const player = state.players.find((p) => p.id === playerId);
  if (!player || state.currentPA < 3) return false;

  state.currentPA = 0;
  soundManager.playPACrystal();

  state.discardPile.push(...player.hand);
  player.hand = [];

  for (let i = 0; i < 5; i++) {
    if (state.mainDeck.length === 0 && state.discardPile.length > 0) {
      state.mainDeck = shuffle([...state.discardPile]);
      state.discardPile = [];
    }
    if (state.mainDeck.length > 0) {
      player.hand.push(state.mainDeck.pop());
    }
  }

  state.logs.unshift({
    text: `🔄 ${player.nickname} gastou todos os 3 PA, descartou a mão e comprou 5 novas cartas!`,
    type: 'action',
  });

  return true;
};

// PASSAR TURNO
export const actPassTurn = (state) => {
  if (!state || state.status !== 'playing') return;

  state.turnIndex = (state.turnIndex + 1) % state.players.length;
  const nextPlayer = state.players[state.turnIndex];
  state.turnPlayerId = nextPlayer.id;

  // Passiva do Titã da Tempestade: 4 PA por turno!
  const hasTitan = nextPlayer.slainMonsters.some((m) => m.id === 'monster_9');
  state.maxPA = hasTitan ? 4 : 3;
  state.currentPA = state.maxPA;

  // Passiva da Quimera Arcana ou Hidra de Cristal: compra 1 carta no início do turno
  const extraDrawMonsters = nextPlayer.slainMonsters.filter(
    (m) => m.id === 'monster_4' || m.id === 'monster_1'
  );
  if (extraDrawMonsters.length > 0 && state.mainDeck.length > 0) {
    nextPlayer.hand.push(state.mainDeck.pop());
    state.logs.unshift({
      text: `✨ Troféus de Monstro concederam +1 carta inicial para ${nextPlayer.nickname}!`,
      type: 'action',
    });
  }

  // Reseta usos de habilidade da Party
  nextPlayer.party.forEach((h) => {
    h.abilityUsedThisTurn = false;
  });

  state.pendingReaction = null;

  state.logs.unshift({
    text: `🔔 Turno de ${nextPlayer.nickname} começou! (${state.currentPA} PA disponíveis).`,
    type: 'action',
  });
};
