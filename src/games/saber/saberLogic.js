// ============================================================================
// LÓGICA DO JOGO: MESTRE DO SABER (WITS & WAGERS) — NÚMEROS & APOSTAS
// ============================================================================

export const NUMERIC_QUESTIONS = [
  {
    id: 'n1',
    question: 'Quantos ossos tem o esqueleto de um ser humano adulto?',
    answer: 206,
    unit: 'ossos',
    trivia: 'Bebês nascem com cerca de 270 ossos, mas muitos se fundem durante o crescimento.'
  },
  {
    id: 'n2',
    question: 'Em que ano a humanidade pisou na Lua pela primeira vez (Missão Apollo 11)?',
    answer: 1969,
    unit: 'ano',
    trivia: 'Neil Armstrong e Buzz Aldrin caminharam na superfície lunar em 20 de julho de 1969.'
  },
  {
    id: 'n3',
    question: 'Qual é a altura total da Torre Eiffel em Paris (em metros, incluindo antenas)?',
    answer: 330,
    unit: 'metros',
    trivia: 'Construída em 1889 para a Exposição Universal, era a estrutura mais alta do mundo na época.'
  },
  {
    id: 'n4',
    question: 'Em que ano o navio RMS Titanic afundou no Oceano Atlântico Norte?',
    answer: 1912,
    unit: 'ano',
    trivia: 'O navio colidiu com um iceberg em 14 de abril e afundou na madrugada de 15 de abril de 1912.'
  },
  {
    id: 'n5',
    question: 'Em que ano Steve Jobs apresentou ao mundo o primeiro modelo do iPhone?',
    answer: 2007,
    unit: 'ano',
    trivia: 'Apresentado na Macworld em janeiro de 2007, revolucionou os smartphones mundiais.'
  },
  {
    id: 'n6',
    question: 'Quantos Estados soberanos são membros oficiais da Organização das Nações Unidas (ONU)?',
    answer: 193,
    unit: 'países',
    trivia: 'O Vaticano e o Estado da Palestina são os dois únicos membros observadores não-plenos.'
  },
  {
    id: 'n7',
    question: 'Quantos dentes possui um ser humano adulto com a dentição completa (incluindo os sisos)?',
    answer: 32,
    unit: 'dentes',
    trivia: 'São 8 incisivos, 4 caninos, 8 pré-molares e 12 molares (4 deles são os sisos).'
  },
  {
    id: 'n8',
    question: 'Quantas teclas tem um piano acústico clássico de cauda tradicional?',
    answer: 88,
    unit: 'teclas',
    trivia: 'São 52 teclas brancas (notas naturais) e 36 teclas pretas (acidentes).'
  }
];

export function shuffleQuestions(questions) {
  const deck = [...questions];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function initSaberMatch(humanPlayer, botCount = 3) {
  const deck = shuffleQuestions(NUMERIC_QUESTIONS);
  const BOT_NAMES = ['Prof. Gauss', 'Dr. Arquimedes', 'Sofia Sabedoria'];

  const players = [
    {
      id: humanPlayer.id || 'human',
      name: humanPlayer.nickname || 'Você',
      avatar: humanPlayer.avatar || '🧙‍♂️',
      isBot: false,
      chips: 10,
      guess: null,
      betGuessIdx: null
    }
  ];

  for (let i = 0; i < botCount; i++) {
    players.push({
      id: `bot_saber_${i}`,
      name: BOT_NAMES[i % BOT_NAMES.length],
      avatar: ['🧠', '📐', '🦉'][i % 3],
      isBot: true,
      chips: 10,
      guess: null,
      betGuessIdx: null
    });
  }

  return {
    gameId: 'saber',
    deck,
    players,
    round: 1,
    maxRounds: 5,
    currentQuestion: deck.shift(),
    sortedGuesses: [], // [{ player, guess, payoutMultiplier }]
    phase: 'GUESSING', // GUESSING, BETTING, REVEAL, GAME_OVER
    winningGuessIdx: null,
    logs: [{ text: 'Mestre do Saber começou! Dê seu melhor palpite e aposte com sabedoria!', time: new Date().toLocaleTimeString() }]
  };
}

export function generateBotGuess(actualAnswer) {
  // Gera variação entre -35% e +35% da resposta real
  const variation = (Math.random() * 0.7) - 0.35;
  const guess = Math.max(1, Math.round(actualAnswer * (1 + variation)));
  return guess;
}

export function submitHumanGuess(state, guessNumber) {
  const human = state.players.find(p => !p.isBot);
  human.guess = guessNumber;

  // Gera palpites dos bots
  state.players.filter(p => p.isBot).forEach(b => {
    b.guess = generateBotGuess(state.currentQuestion.answer);
  });

  // Ordena os palpites do menor para o maior
  const allGuesses = state.players.map(p => ({
    player: p,
    guess: p.guess
  }));

  allGuesses.sort((a, b) => a.guess - b.guess);

  // Atribui multiplicadores de aposta estilo Wits & Wagers
  // Extremos pagam mais, centro paga menos
  const multipliers = [4, 2, 3, 5];
  state.sortedGuesses = allGuesses.map((g, idx) => ({
    ...g,
    payout: multipliers[idx % multipliers.length] || 2
  }));

  // Bots decidem onde apostar
  state.players.filter(p => p.isBot).forEach(b => {
    // Escolhe aleatoriamente ou no próprio palpite
    b.betGuessIdx = Math.floor(Math.random() * state.sortedGuesses.length);
  });

  state.phase = 'BETTING';
  state.logs.unshift({
    text: `Todos os palpites foram computados e organizados na mesa de apostas! Hora de apostar fichas!`,
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function submitBet(state, sortedGuessIndex) {
  const human = state.players.find(p => !p.isBot);
  human.betGuessIdx = sortedGuessIndex;

  resolveSaberRound(state);
  return state;
}

export function resolveSaberRound(state) {
  const ans = state.currentQuestion.answer;

  // Regra clássica: vence o palpite mais próximo SEM ULTRAPASSAR (Price is Right)
  // Se todos ultrapassarem, vence o menor palpite
  let bestIdx = -1;
  let bestDiff = Infinity;

  state.sortedGuesses.forEach((g, idx) => {
    if (g.guess <= ans) {
      const diff = ans - g.guess;
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = idx;
      }
    }
  });

  // Se nenhum for menor ou igual, vence o menor de todos
  if (bestIdx === -1) {
    bestIdx = 0;
  }

  state.winningGuessIdx = bestIdx;
  const winningGuessObj = state.sortedGuesses[bestIdx];

  // Paga as apostas
  state.players.forEach(p => {
    if (p.betGuessIdx === bestIdx) {
      const payoutChips = winningGuessObj.payout * 2;
      p.chips += payoutChips;
      state.logs.unshift({
        text: `💰 ${p.name} apostou no palpite vencedor e faturou +${payoutChips} fichas!`,
        time: new Date().toLocaleTimeString()
      });
    }
  });

  state.phase = 'REVEAL';
  state.logs.unshift({
    text: `🎯 Resposta Exata: ${ans} ${state.currentQuestion.unit}! Palpite vencedor: ${winningGuessObj.guess} (${winningGuessObj.player.name}).`,
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function nextSaberRound(state) {
  if (state.round >= state.maxRounds || state.deck.length === 0) {
    state.phase = 'GAME_OVER';
    return state;
  }

  state.round++;
  state.currentQuestion = state.deck.shift();
  state.sortedGuesses = [];
  state.winningGuessIdx = null;
  state.players.forEach(p => {
    p.guess = null;
    p.betGuessIdx = null;
  });
  state.phase = 'GUESSING';
  return state;
}
