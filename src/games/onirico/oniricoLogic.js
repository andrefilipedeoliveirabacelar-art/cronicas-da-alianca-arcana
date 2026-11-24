// ============================================================================
// LÓGICA DO JOGO: ONÍRICO (DIXIT) — CARTAS SURREAIS, PISTAS & VOTAÇÃO
// ============================================================================

export const ONIRICO_CARDS = [
  { id: 'c1', title: 'Cidade nas Nuvens', icon: '☁️', tags: ['sonho', 'alto', 'liberdade', 'mistério'], gradient: 'from-blue-600 to-indigo-900', desc: 'Edifícios suspensos em espirais de vento dourado' },
  { id: 'c2', title: 'Relógio Fluido', icon: '⏳', tags: ['tempo', 'memória', 'infinito', 'ilusão'], gradient: 'from-amber-600 to-purple-900', desc: 'Ponteiros que derretem sobre pétalas de rosa' },
  { id: 'c3', title: 'Barco de Papel Estelar', icon: '⛵', tags: ['viagem', 'infância', 'estrelas', 'coragem'], gradient: 'from-cyan-600 to-slate-900', desc: 'Navegando num mar feito de poeira cósmica' },
  { id: 'c4', title: 'A Gaiola de Vagalumes', icon: '🏮', tags: ['luz', 'segredo', 'esperança', 'prisão'], gradient: 'from-emerald-600 to-teal-950', desc: 'Mil luzes douradas que anseiam pela noite' },
  { id: 'c5', title: 'Gato das Constelações', icon: '🐱', tags: ['magia', 'silêncio', 'noite', 'curiosidade'], gradient: 'from-purple-600 to-pink-950', desc: 'Olhos que refletem galáxias inteiras' },
  { id: 'c6', title: 'A Chave do Labirinto', icon: '🗝️', tags: ['mistério', 'destino', 'porta', 'descoberta'], gradient: 'from-yellow-600 to-amber-950', desc: 'Uma chave dourada sem fechadura visível' },
  { id: 'c7', title: 'Floresta de Cristais', icon: '💎', tags: ['natureza', 'brilho', 'silêncio', 'antigo'], gradient: 'from-teal-500 to-cyan-950', desc: 'Troncos transparentes ressoando notas musicais' },
  { id: 'c8', title: 'Máscara dos Ventos', icon: '🎭', tags: ['blefe', 'segredo', 'identidade', 'teatro'], gradient: 'from-rose-600 to-slate-900', desc: 'Duas faces sorrindo para tempestades diferentes' },
  { id: 'c9', title: 'O Livro Infinito', icon: '📖', tags: ['história', 'sabedoria', 'imaginação', 'infinito'], gradient: 'from-amber-700 to-stone-900', desc: 'Páginas que se reescrevem ao vento' },
  { id: 'c10', title: 'Espelho de Sombras', icon: '🪞', tags: ['ilusão', 'alma', 'reflexo', 'medo'], gradient: 'from-indigo-700 to-black', desc: 'Mostra o que você foi antes de nascer' },
  { id: 'c11', title: 'O Guardião das Marés', icon: '🐋', tags: ['mar', 'gigante', 'calma', 'profundo'], gradient: 'from-blue-700 to-sky-950', desc: 'Criatura colossal cantando no abismo' },
  { id: 'c12', title: 'Trança Solar', icon: '☀️', tags: ['calor', 'energia', 'vida', 'ouro'], gradient: 'from-orange-500 to-amber-900', desc: 'Fios de sol colhidos antes do crepúsculo' },
  { id: 'c13', title: 'Rosa de Vidro', icon: '🌹', tags: ['fragilidade', 'amor', 'beleza', 'dor'], gradient: 'from-red-600 to-pink-950', desc: 'Pétalas afiadas como memórias perdidas' },
  { id: 'c14', title: 'Voo Noturno', icon: '🦉', tags: ['noite', 'vigilância', 'asas', 'sabedoria'], gradient: 'from-indigo-900 to-slate-950', desc: 'Plumas que cortam a bruma sem fazer ruído' },
  { id: 'c15', title: 'Castelo de Areia Cósmico', icon: '🏰', tags: ['tempo', 'sonho', 'fragilidade', 'reino'], gradient: 'from-yellow-500 to-indigo-950', desc: 'Muralhas construídas na borda da eternidade' },
  { id: 'c16', title: 'Teia de Música', icon: '🕸️', tags: ['música', 'aranha', 'harmonia', 'armadilha'], gradient: 'from-purple-500 to-emerald-950', desc: 'Cordas de violino estendidas sob o luar' },
  { id: 'c17', title: 'Farol das Almas', icon: '🗼', tags: ['guia', 'esperança', 'noite', 'mar'], gradient: 'from-cyan-500 to-blue-950', desc: 'Feixe de luz que resgata pensamentos perdidos' },
  { id: 'c18', title: 'Dança das Chamas', icon: '🔥', tags: ['fogo', 'paixão', 'transformação', 'perigo'], gradient: 'from-amber-500 to-red-950', desc: 'Silhuetas incandescentes num festival sem fim' },
  { id: 'c19', title: 'A Árvore dos Desejos', icon: '🌳', tags: ['vida', 'desejo', 'natureza', 'sagrado'], gradient: 'from-emerald-500 to-stone-900', desc: 'Frutos que sussurram promessas antigas' },
  { id: 'c20', title: 'Náufrago das Nuvens', icon: '🪁', tags: ['liberdade', 'vento', 'infância', 'distância'], gradient: 'from-sky-400 to-indigo-950', desc: 'Uma pipa amarela perdida além do horizonte' },
  { id: 'c21', title: 'O Portão Esquecido', icon: '🚪', tags: ['mistério', 'passagem', 'antigo', 'silêncio'], gradient: 'from-stone-600 to-slate-950', desc: 'Entreaberto para uma dimensão de folhas secas' },
  { id: 'c22', title: 'Bússola sem Norte', icon: '🧭', tags: ['viagem', 'perdido', 'aventura', 'destino'], gradient: 'from-amber-600 to-zinc-950', desc: 'Aponta sempre para onde seu coração quer fugir' },
  { id: 'c23', title: 'Ponte de Arco-Íris Místico', icon: '🌈', tags: ['ponte', 'esperança', 'cor', 'sonho'], gradient: 'from-pink-500 to-teal-950', desc: 'Caminho etéreo que une dois universos' },
  { id: 'c24', title: 'A Cidade Submersa', icon: '🏛️', tags: ['antigo', 'mar', 'mistério', 'memória'], gradient: 'from-teal-700 to-blue-950', desc: 'Colunas de mármore abraçadas por algas azuis' }
];

export const SUGGESTED_CLUES = [
  'Um sussurro do tempo esquecido',
  'Onde a gravidade perde o sentido',
  'Guardado a sete chaves',
  'A saudade de um lugar nunca visitado',
  'Uma promessa feita à meia-noite',
  'Leve como um pensamento na brisa',
  'O começo de uma grande jornada',
  'A luz que vence as sombras'
];

export function shuffleDeck(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function initOniricoMatch(humanPlayer, botCount = 3) {
  const deck = shuffleDeck(ONIRICO_CARDS);
  const BOT_NAMES = ['Luna Onírica', 'Aura Mística', 'Zephyr Poeta', 'Celeste Oráculo'];

  const players = [
    {
      id: humanPlayer.id || 'human',
      name: humanPlayer.nickname || 'Você',
      avatar: humanPlayer.avatar || '🧙‍♂️',
      isBot: false,
      score: 0,
      hand: deck.splice(0, 6)
    }
  ];

  for (let i = 0; i < botCount; i++) {
    players.push({
      id: `bot_onirico_${i}`,
      name: BOT_NAMES[i % BOT_NAMES.length],
      avatar: ['🌙', '🎨', '✨', '🪶'][i % 4],
      isBot: true,
      score: 0,
      hand: deck.splice(0, 6)
    });
  }

  return {
    gameId: 'onirico',
    deck,
    players,
    narratorIndex: 0,
    round: 1,
    phase: 'CLUE', // CLUE, PLAY_CARDS, VOTING, SCORING, GAME_OVER
    currentClue: '',
    tableCards: [], // { card, ownerId, votes: [] }
    roundReview: null,
    logs: [{ text: 'O mundo de Onírico despertou! Que comecem as pistas da imaginação.', time: new Date().toLocaleTimeString() }]
  };
}

export function setClueAndNarratorCard(state, cardId, clueText) {
  const narrator = state.players[state.narratorIndex];
  state.currentClue = clueText;

  // Remove carta da mão do narrador e coloca na mesa
  const cardIdx = narrator.hand.findIndex(c => c.id === cardId);
  const card = narrator.hand.splice(cardIdx, 1)[0];
  state.tableCards = [{ card, ownerId: narrator.id, votes: [] }];

  state.logs.unshift({
    text: `🌙 ${narrator.name} deu a pista: "${clueText}"`,
    time: new Date().toLocaleTimeString()
  });

  state.phase = 'PLAY_CARDS';
  return state;
}

export function playOtherPlayerCard(state, playerId, cardId) {
  const player = state.players.find(p => p.id === playerId);
  const cardIdx = player.hand.findIndex(c => c.id === cardId);
  const card = player.hand.splice(cardIdx, 1)[0];

  state.tableCards.push({ card, ownerId: player.id, votes: [] });

  // Se todos jogaram, embaralha a mesa e vai para VOTING
  if (state.tableCards.length === state.players.length) {
    state.tableCards.sort(() => Math.random() - 0.5);
    state.phase = 'VOTING';
    state.logs.unshift({
      text: `Todas as cartas foram postas à mesa! Hora de votar secretamente!`,
      time: new Date().toLocaleTimeString()
    });
  }

  return state;
}

export function castVote(state, voterId, cardIndex) {
  const target = state.tableCards[cardIndex];
  if (!target.votes.includes(voterId)) {
    target.votes.push(voterId);
  }

  // Verifica se todos os não-narradores votaram
  const totalExpectedVotes = state.players.length - 1;
  const currentTotalVotes = state.tableCards.reduce((acc, c) => acc + c.votes.length, 0);

  if (currentTotalVotes >= totalExpectedVotes) {
    resolveOniricoRound(state);
  }

  return state;
}

export function resolveOniricoRound(state) {
  const narrator = state.players[state.narratorIndex];
  const narratorTableCard = state.tableCards.find(c => c.ownerId === narrator.id);
  const correctVotesCount = narratorTableCard.votes.length;
  const totalVoters = state.players.length - 1;

  const scoreChanges = {};
  state.players.forEach(p => scoreChanges[p.id] = 0);

  if (correctVotesCount === 0 || correctVotesCount === totalVoters) {
    // Todos ou Ninguém acertou: Narrador ganha 0, todos os outros ganham 2
    state.players.forEach(p => {
      if (p.id !== narrator.id) scoreChanges[p.id] += 2;
    });
    state.logs.unshift({
      text: correctVotesCount === 0
        ? `Ninguém decifrou a pista do Narrador! Todos os outros ganham 2 pts.`
        : `A pista foi óbvia demais (todos acertaram)! Todos os outros ganham 2 pts.`,
      time: new Date().toLocaleTimeString()
    });
  } else {
    // Acerto equilibrado: Narrador ganha 3, quem acertou ganha 3
    scoreChanges[narrator.id] += 3;
    narratorTableCard.votes.forEach(voterId => {
      scoreChanges[voterId] += 3;
    });
    state.logs.unshift({
      text: `Pista sublime! ${correctVotesCount} jogador(es) acertaram a carta do Narrador (+3 pts cada)!`,
      time: new Date().toLocaleTimeString()
    });
  }

  // Bônus: cada voto na carta de outro jogador rende +1 ponto
  state.tableCards.forEach(tc => {
    if (tc.ownerId !== narrator.id) {
      scoreChanges[tc.ownerId] += tc.votes.length;
    }
  });

  // Aplica pontuações
  state.players.forEach(p => {
    p.score += scoreChanges[p.id];
  });

  state.roundReview = {
    narratorCard: narratorTableCard.card,
    narratorName: narrator.name,
    scoreChanges,
    tableCards: [...state.tableCards]
  };

  state.phase = 'SCORING';

  // Compra cartas novas para todos
  state.players.forEach(p => {
    if (state.deck.length > 0 && p.hand.length < 6) {
      p.hand.push(state.deck.shift());
    }
  });

  return state;
}

export function nextOniricoRound(state) {
  // Verifica se alguém atingiu 30 pontos ou se já foram 6 rodadas
  const winner = state.players.find(p => p.score >= 30);
  if (winner || state.round >= 6) {
    state.phase = 'GAME_OVER';
    state.winner = [...state.players].sort((a, b) => b.score - a.score)[0];
    return state;
  }

  state.round++;
  state.narratorIndex = (state.narratorIndex + 1) % state.players.length;
  state.phase = 'CLUE';
  state.currentClue = '';
  state.tableCards = [];
  state.roundReview = null;
  return state;
}
