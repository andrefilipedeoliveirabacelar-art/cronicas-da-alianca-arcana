// ============================================================================
// LÓGICA DO JOGO: CORTE DAS SOMBRAS (COUP) — REGRAS OFICIAIS & BOT AI
// ============================================================================

export const ROLES = {
  DUKE: {
    id: 'duke',
    name: 'Duque',
    title: 'O Nobre Cobrador',
    icon: '👑',
    color: '#8B5CF6',
    action: 'Taxar (+3 Moedas)',
    actionDesc: 'Coleta 3 moedas do tesouro real.',
    blocks: 'Ajuda Externa',
    description: 'Pode coletar 3 moedas do tesouro e bloqueia qualquer nobre que tente pedir Ajuda Externa.'
  },
  ASSASSIN: {
    id: 'assassin',
    name: 'Assassino',
    title: 'A Lâmina Oculta',
    icon: '🗡️',
    color: '#EF4444',
    cost: 3,
    action: 'Assassinar (-3 Moedas)',
    actionDesc: 'Paga 3 moedas para eliminar 1 influência de um rival.',
    blocks: null,
    description: 'Paga 3 moedas para forçar um jogador alvo a perder uma carta de influência. Bloqueável pela Condessa.'
  },
  CAPTAIN: {
    id: 'captain',
    name: 'Capitão',
    title: 'O Corsário Audaz',
    icon: '⚓',
    color: '#3B82F6',
    action: 'Extorquir (+2 Moedas)',
    actionDesc: 'Rouba até 2 moedas de um jogador adversário.',
    blocks: 'Extorsão de Capitão',
    description: 'Rouba 2 moedas de um adversário. Bloqueia outros Capitães ou tentativas de extorsão.'
  },
  AMBASSADOR: {
    id: 'ambassador',
    name: 'Embaixador',
    title: 'O Diplomata Sagaz',
    icon: '📜',
    color: '#10B981',
    action: 'Trocar Cartas',
    actionDesc: 'Compra 2 cartas da corte, escolhe quais manter e devolve 2 ao baralho.',
    blocks: 'Extorsão de Capitão',
    description: 'Permite renovar sua mão trocando com a corte. Também bloqueia extorsão do Capitão.'
  },
  CONTESSA: {
    id: 'contessa',
    name: 'Condessa',
    title: 'A Protetora Real',
    icon: '🛡️',
    color: '#F59E0B',
    action: null,
    blocks: 'Assassinato',
    description: 'Não possui ação ativa, mas sua mera presença bloqueia qualquer tentativa de assassinato.'
  }
};

export const GENERAL_ACTIONS = {
  INCOME: {
    id: 'income',
    name: 'Renda Básica',
    icon: '🪙',
    desc: '+1 Moeda do Tesouro (Incontestável)',
    cost: 0
  },
  FOREIGN_AID: {
    id: 'foreign_aid',
    name: 'Ajuda Externa',
    icon: '💰',
    desc: '+2 Moedas (Bloqueável por Duque)',
    cost: 0
  },
  COUP: {
    id: 'coup',
    name: 'Golpe de Estado',
    icon: '⚔️',
    desc: 'Pague 7 Moedas para eliminar 1 influência rival (Incontestável)',
    cost: 7
  }
};

export function createDeck(playerCount = 4) {
  // 3 cópias de cada uma das 5 cartas = 15 cartas
  const deck = [];
  const roles = Object.keys(ROLES);
  roles.forEach(roleKey => {
    for (let i = 0; i < 3; i++) {
      deck.push({
        id: `${roleKey}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        roleKey: roleKey.toLowerCase(),
        revealed: false
      });
    }
  });

  // Embaralhar Fisher-Yates
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function initCorteMatch(humanPlayer, botCount = 3) {
  const deck = createDeck(botCount + 1);
  const BOT_NAMES = ['Lorde Malakar', 'Lady Vespera', 'Barão Tybalt', 'Visconde Dorian', 'Duquesa Selene'];

  const players = [
    {
      id: humanPlayer.id || 'human',
      name: humanPlayer.nickname || 'Você',
      avatar: humanPlayer.avatar || '🧙‍♂️',
      isBot: false,
      coins: 2,
      cards: [deck.pop(), deck.pop()],
      isAlive: true
    }
  ];

  for (let i = 0; i < botCount; i++) {
    players.push({
      id: `bot_${i}`,
      name: BOT_NAMES[i % BOT_NAMES.length],
      avatar: ['🦊', '👑', '🗡️', '🦉', '💎'][i % 5],
      isBot: true,
      coins: 2,
      cards: [deck.pop(), deck.pop()],
      isAlive: true
    });
  }

  return {
    gameId: 'corte',
    deck,
    players,
    turnIndex: 0,
    round: 1,
    phase: 'ACTION', // ACTION, CHALLENGE_ACTION, BLOCK_DECISION, CHALLENGE_BLOCK, RESOLUTION, GAME_OVER
    currentAction: null, // { playerIndex, type, targetIndex, claimedRole }
    currentBlock: null,  // { playerIndex, claimedRole }
    logs: [{ text: 'O banquete da Corte das Sombras começou! Cada nobre recebeu 2 moedas e 2 cartas secretas.', type: 'system', time: new Date().toLocaleTimeString() }],
    winner: null,
    pendingKillTarget: null
  };
}

export function getActivePlayer(state) {
  return state.players[state.turnIndex];
}

export function nextTurn(state) {
  let nextIdx = (state.turnIndex + 1) % state.players.length;
  let loops = 0;
  while (!state.players[nextIdx].isAlive && loops < state.players.length) {
    nextIdx = (nextIdx + 1) % state.players.length;
    loops++;
  }

  const alivePlayers = state.players.filter(p => p.isAlive);
  if (alivePlayers.length <= 1) {
    state.phase = 'GAME_OVER';
    state.winner = alivePlayers[0] || null;
    state.logs.unshift({
      text: `👑 A Corte foi dominada! ${state.winner.name} é o Soberano supremo!`,
      type: 'victory',
      time: new Date().toLocaleTimeString()
    });
    return state;
  }

  state.turnIndex = nextIdx;
  state.phase = 'ACTION';
  state.currentAction = null;
  state.currentBlock = null;
  state.pendingKillTarget = null;
  state.round++;
  return state;
}

export function executeIncome(state, playerIdx) {
  const p = state.players[playerIdx];
  p.coins += 1;
  state.logs.unshift({
    text: `${p.name} coletou Renda Básica (+1 moeda). Saldo: ${p.coins}`,
    type: 'action',
    time: new Date().toLocaleTimeString()
  });
  return nextTurn(state);
}

export function declareForeignAid(state, playerIdx) {
  const p = state.players[playerIdx];
  state.currentAction = {
    playerIndex: playerIdx,
    type: 'foreign_aid',
    targetIndex: null,
    claimedRole: null
  };
  state.phase = 'BLOCK_DECISION'; // Qualquer jogador pode bloquear dizendo que tem Duque
  state.logs.unshift({
    text: `${p.name} solicitou Ajuda Externa (+2 moedas). Qualquer jogador com Duque pode bloquear!`,
    type: 'action',
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function declareTax(state, playerIdx) {
  const p = state.players[playerIdx];
  state.currentAction = {
    playerIndex: playerIdx,
    type: 'tax',
    targetIndex: null,
    claimedRole: 'duke'
  };
  state.phase = 'CHALLENGE_ACTION'; // Outros podem contestar se ele tem Duque
  state.logs.unshift({
    text: `${p.name} declarou ser o Duque e cobrar Impostos (+3 moedas). Alguém contesta o blefe?`,
    type: 'action',
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function declareAssassinate(state, playerIdx, targetIdx) {
  const p = state.players[playerIdx];
  const target = state.players[targetIdx];
  p.coins -= 3;
  state.currentAction = {
    playerIndex: playerIdx,
    type: 'assassinate',
    targetIndex: targetIdx,
    claimedRole: 'assassin'
  };
  state.phase = 'CHALLENGE_ACTION';
  state.logs.unshift({
    text: `${p.name} pagou 3 moedas e contratou um Assassino contra ${target.name}! Alguém contesta?`,
    type: 'danger',
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function declareSteal(state, playerIdx, targetIdx) {
  const p = state.players[playerIdx];
  const target = state.players[targetIdx];
  state.currentAction = {
    playerIndex: playerIdx,
    type: 'steal',
    targetIndex: targetIdx,
    claimedRole: 'captain'
  };
  state.phase = 'CHALLENGE_ACTION';
  state.logs.unshift({
    text: `${p.name} declarou ser o Capitão e tentou extorquir moedas de ${target.name}!`,
    type: 'action',
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function declareExchange(state, playerIdx) {
  const p = state.players[playerIdx];
  state.currentAction = {
    playerIndex: playerIdx,
    type: 'exchange',
    targetIndex: null,
    claimedRole: 'ambassador'
  };
  state.phase = 'CHALLENGE_ACTION';
  state.logs.unshift({
    text: `${p.name} declarou ser o Embaixador para negociar e trocar cartas com a corte!`,
    type: 'action',
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function executeCoup(state, playerIdx, targetIdx) {
  const p = state.players[playerIdx];
  const target = state.players[targetIdx];
  p.coins -= 7;
  state.logs.unshift({
    text: `💥 GOLPE DE ESTADO! ${p.name} financiou um levante militar contra ${target.name}!`,
    type: 'danger',
    time: new Date().toLocaleTimeString()
  });
  
  // O alvo perde uma influência imediatamente
  eliminatePlayerInfluence(state, targetIdx);
  return nextTurn(state);
}

export function eliminatePlayerInfluence(state, playerIdx, cardIndex = null) {
  const p = state.players[playerIdx];
  const aliveCards = p.cards.filter(c => !c.revealed);
  
  if (aliveCards.length === 0) {
    p.isAlive = false;
    return;
  }

  let cardToReveal;
  if (cardIndex !== null && !p.cards[cardIndex].revealed) {
    cardToReveal = p.cards[cardIndex];
  } else {
    // Escolhe a primeira não revelada (ou bot escolhe)
    cardToReveal = aliveCards[0];
  }

  cardToReveal.revealed = true;
  state.logs.unshift({
    text: `💀 ${p.name} perdeu sua influência: [${ROLES[cardToReveal.roleKey.toUpperCase()]?.name || cardToReveal.roleKey}] foi revelado!`,
    type: 'danger',
    time: new Date().toLocaleTimeString()
  });

  const remaining = p.cards.filter(c => !c.revealed);
  if (remaining.length === 0) {
    p.isAlive = false;
    state.logs.unshift({
      text: `⚰️ ${p.name} perdeu todas as influências e foi banido da Corte!`,
      type: 'danger',
      time: new Date().toLocaleTimeString()
    });
  }
}

// Bot AI Decision
export function getBotAction(state, botIdx) {
  const bot = state.players[botIdx];
  const aliveRivals = state.players
    .map((p, idx) => ({ ...p, originalIdx: idx }))
    .filter(p => p.isAlive && p.originalIdx !== botIdx);

  // Alvo prioritário: quem tem mais moedas ou é humano
  aliveRivals.sort((a, b) => b.coins - a.coins);
  const target = aliveRivals[0] || null;

  // Se tiver 10 ou mais moedas, Golpe de Estado é OBRIGATÓRIO
  if (bot.coins >= 10) {
    return { action: 'coup', targetIdx: target.originalIdx };
  }

  // Se tiver 7 ou mais moedas, 85% de chance de Golpe
  if (bot.coins >= 7 && Math.random() < 0.85) {
    return { action: 'coup', targetIdx: target.originalIdx };
  }

  const unrevealedCards = bot.cards.filter(c => !c.revealed).map(c => c.roleKey);
  const hasDuke = unrevealedCards.includes('duke');
  const hasAssassin = unrevealedCards.includes('assassin');
  const hasCaptain = unrevealedCards.includes('captain');
  const hasAmbassador = unrevealedCards.includes('ambassador');

  // Se tiver Moedas para Assassinar e tiver carta ou quiser blefar (25%)
  if (bot.coins >= 3 && (hasAssassin || Math.random() < 0.25)) {
    return { action: 'assassinate', targetIdx: target.originalIdx };
  }

  // Taxar com Duque (ou blefar 30%)
  if (hasDuke || Math.random() < 0.3) {
    return { action: 'tax' };
  }

  // Extorquir com Capitão
  if ((hasCaptain || Math.random() < 0.25) && target && target.coins > 0) {
    return { action: 'steal', targetIdx: target.originalIdx };
  }

  // Trocar cartas com Embaixador se tiver cartas ruins
  if (hasAmbassador && Math.random() < 0.5) {
    return { action: 'exchange' };
  }

  // Se não fez nada, Ajuda Externa ou Renda Básica
  return Math.random() < 0.6 ? { action: 'foreign_aid' } : { action: 'income' };
}
