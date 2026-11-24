// ============================================================================
// LÓGICA DO JOGO: ENTRE SONHOS (WHEN I DREAM) — ESPÍRITOS & ADIVINHAÇÃO
// ============================================================================

export const DREAM_ROLES = {
  DREAMER: {
    id: 'dreamer',
    name: 'Sonhador',
    title: 'A Mente Adormecida',
    icon: '😴',
    color: '#818CF8',
    description: 'Tenta adivinhar o máximo de palavras baseado nas pistas de uma só palavra dadas pelos espíritos.'
  },
  FAIRY: {
    id: 'fairy',
    name: 'Fada dos Sonhos',
    title: 'A Guia Benevolente',
    icon: '🧚‍♀️',
    color: '#34D399',
    description: 'Dá pistas verdadeiras e claras. Pontua por cada palavra acertada pelo Sonhador!'
  },
  BOOGEYMAN: {
    id: 'boogeyman',
    name: 'Bicho-Papão',
    title: 'O Pesadelo Sorrateiro',
    icon: '👹',
    color: '#F87171',
    description: 'Dá pistas enganosas ou ambíguas para fazer o Sonhador errar. Pontua por cada erro!'
  },
  SANDMAN: {
    id: 'sandman',
    name: 'João Pestana',
    title: 'O Tecelão do Equilíbrio',
    icon: '⏳',
    color: '#FBBF24',
    description: 'Busca o equilíbrio perfeito: quer que o número de acertos e erros seja rigorosamente igual!'
  }
};

export const WORD_BANK = [
  { word: 'Castelo', clues: { fairy: ['Rei', 'Torre', 'Pedra'], boogeyman: ['Areia', 'Prisão', 'Nuvem'] } },
  { word: 'Dragão', clues: { fairy: ['Fogo', 'Asas', 'Escamas'], boogeyman: ['Lagarto', 'Voo', 'Pássaro'] } },
  { word: 'Espelho', clues: { fairy: ['Reflexo', 'Vidro', 'Olhar'], boogeyman: ['Quadro', 'Janela', 'Água'] } },
  { word: 'Floresta', clues: { fairy: ['Árvores', 'Verde', 'Natureza'], boogeyman: ['Selva', 'Parque', 'Jardim'] } },
  { word: 'Gato', clues: { fairy: ['Mia', 'Bigodes', 'Felino'], boogeyman: ['Cão', 'Rato', 'Tigre'] } },
  { word: 'Lua', clues: { fairy: ['Noite', 'Cheia', 'Crateras'], boogeyman: ['Sol', 'Estrela', 'Luz'] } },
  { word: 'Oceano', clues: { fairy: ['Ondas', 'Água', 'Profundo'], boogeyman: ['Rio', 'Lago', 'Piscina'] } },
  { word: 'Pêndulo', clues: { fairy: ['Relógio', 'Balanço', 'Tempo'], boogeyman: ['Sino', 'Peso', 'Corda'] } },
  { word: 'Rosa', clues: { fairy: ['Espinhos', 'Flor', 'Pétalas'], boogeyman: ['Cravo', 'Vermelho', 'Fruta'] } },
  { word: 'Tesouro', clues: { fairy: ['Baú', 'Ouro', 'Pirata'], boogeyman: ['Banco', 'Chave', 'Jóia'] } },
  { word: 'Vento', clues: { fairy: ['Brisa', 'Sopra', 'Invisível'], boogeyman: ['Tempestade', 'Ar', 'Voo'] } },
  { word: 'Violino', clues: { fairy: ['Cordas', 'Arco', 'Melodia'], boogeyman: ['Violão', 'Música', 'Madeira'] } },
  { word: 'Bruxa', clues: { fairy: ['Vassoura', 'Poção', 'Caldeirão'], boogeyman: ['Fada', 'Mulher', 'Mágica'] } },
  { word: 'Farol', clues: { fairy: ['Torre', 'Guia', 'Mar'], boogeyman: ['Lâmpada', 'Navio', 'Porto'] } },
  { word: 'Pégaso', clues: { fairy: ['Cavalo', 'Asas', 'Mítico'], boogeyman: ['Unicórnio', 'Pássaro', 'Anjo'] } },
  { word: 'Chuva', clues: { fairy: ['Gotas', 'Nuvem', 'Molhado'], boogeyman: ['Neve', 'Choro', 'Guarda-chuva'] } }
];

export function initSonhosMatch(humanPlayer, botCount = 3) {
  const BOT_NAMES = ['Aether Espírito', 'Noctis Sombra', 'Sylvia Encanto', 'Zephyrus'];
  const players = [
    {
      id: humanPlayer.id || 'human',
      name: humanPlayer.nickname || 'Você',
      avatar: humanPlayer.avatar || '🧙‍♂️',
      isBot: false,
      score: 0,
      role: 'dreamer' // O humano começa como Sonhador
    }
  ];

  const rolesPool = ['fairy', 'boogeyman', 'sandman', 'fairy'];
  rolesPool.sort(() => Math.random() - 0.5);

  for (let i = 0; i < botCount; i++) {
    players.push({
      id: `bot_sonhos_${i}`,
      name: BOT_NAMES[i % BOT_NAMES.length],
      avatar: ['🧚', '👹', '⏳', '✨'][i % 4],
      isBot: true,
      score: 0,
      role: rolesPool[i % rolesPool.length]
    });
  }

  // Embaralha palavras
  const words = [...WORD_BANK].sort(() => Math.random() - 0.5);

  return {
    gameId: 'sonhos',
    players,
    words,
    currentWordIndex: 0,
    round: 1,
    timeRemaining: 60,
    phase: 'DREAMING', // DREAMING, RECALL, ROUND_SCORE, GAME_OVER
    currentCluesGiven: [], // [{ spiritName, clue }]
    correctWords: [],
    wrongWords: [],
    logs: [{ text: 'O Sonhador adormeceu! Os espíritos do sono começam a sussurrar suas pistas...', time: new Date().toLocaleTimeString() }]
  };
}

export function getCurrentWord(state) {
  return state.words[state.currentWordIndex % state.words.length];
}

export function generateBotClue(state, spiritPlayer) {
  const currentWord = getCurrentWord(state);
  const isFairy = spiritPlayer.role === 'fairy';
  const isBoogeyman = spiritPlayer.role === 'boogeyman';
  
  let clueList;
  if (isFairy) {
    clueList = currentWord.clues.fairy;
  } else if (isBoogeyman) {
    clueList = currentWord.clues.boogeyman;
  } else {
    // Sandman equilibra: se tiver mais acertos, dá pista ruim; se tiver mais erros, dá boa
    const needWrong = state.correctWords.length > state.wrongWords.length;
    clueList = needWrong ? currentWord.clues.boogeyman : currentWord.clues.fairy;
  }

  const chosenClue = clueList[Math.floor(Math.random() * clueList.length)];
  state.currentCluesGiven.push({
    spiritId: spiritPlayer.id,
    spiritName: spiritPlayer.name,
    avatar: spiritPlayer.avatar,
    role: spiritPlayer.role,
    clue: chosenClue
  });
  return chosenClue;
}

export function submitGuess(state, guessedWord) {
  const current = getCurrentWord(state);
  const isCorrect = guessedWord.trim().toLowerCase() === current.word.toLowerCase();

  if (isCorrect) {
    state.correctWords.push(current.word);
    state.logs.unshift({
      text: `✨ ACERTOU! O Sonhador decifrou "${current.word}"!`,
      time: new Date().toLocaleTimeString()
    });
  } else {
    state.wrongWords.push({ expected: current.word, guessed: guessedWord });
    state.logs.unshift({
      text: `❌ ERROU! O Sonhador chutou "${guessedWord}" (era "${current.word}").`,
      time: new Date().toLocaleTimeString()
    });
  }

  // Avança para a próxima palavra
  state.currentWordIndex++;
  state.currentCluesGiven = [];
  return isCorrect;
}

export function resolveSonhosRound(state, toldStory = true) {
  const dreamer = state.players.find(p => p.role === 'dreamer');
  const fairies = state.players.filter(p => p.role === 'fairy');
  const boogeymen = state.players.filter(p => p.role === 'boogeyman');
  const sandmen = state.players.filter(p => p.role === 'sandman');

  const correctCount = state.correctWords.length;
  const wrongCount = state.wrongWords.length;

  // Pontuação do Sonhador: +1 por acerto + 2 se contou a história
  if (dreamer) {
    dreamer.score += correctCount + (toldStory ? 2 : 0);
  }

  // Fadas: +1 por acerto
  fairies.forEach(f => f.score += correctCount);

  // Bicho-Papão: +1 por erro
  boogeymen.forEach(b => b.score += wrongCount);

  // João Pestana: se igual, +2 bônus extra além de acertos
  sandmen.forEach(s => {
    if (correctCount === wrongCount) {
      s.score += correctCount + 2;
    } else {
      s.score += Math.min(correctCount, wrongCount);
    }
  });

  state.phase = 'ROUND_SCORE';
  return state;
}
