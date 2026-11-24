// ============================================================================
// LÓGICA DO JOGO: QUEM DISSE ISSO? (PARTY TRIVIA / QUOTES)
// ============================================================================

export const QUOTES_DATABASE = [
  {
    id: 'q1',
    quote: 'Que a Força esteja com você.',
    category: 'Cinema & Ficção',
    correct: 'Obi-Wan Kenobi (Star Wars)',
    options: ['Mestre Yoda', 'Obi-Wan Kenobi (Star Wars)', 'Luke Skywalker', 'Darth Vader'],
    trivia: 'Uma das frases mais icônicas da história do cinema, dita pela primeira vez no filme de 1977.'
  },
  {
    id: 'q2',
    quote: 'Com grandes poderes vêm grandes responsabilidades.',
    category: 'Quadrinhos & Cinema',
    correct: 'Tio Ben (Homem-Aranha)',
    options: ['Tony Stark', 'Professor Xavier', 'Tio Ben (Homem-Aranha)', 'Capitão América'],
    trivia: 'A lição fundamental de vida que moldou Peter Parker para sempre.'
  },
  {
    id: 'q3',
    quote: 'Penso, logo existo.',
    category: 'Filosofia & História',
    correct: 'René Descartes',
    options: ['Sócrates', 'Aristóteles', 'René Descartes', 'Friedrich Nietzsche'],
    trivia: 'A famosa frase latina "Cogito, ergo sum" foi publicada no Discurso do Método em 1637.'
  },
  {
    id: 'q4',
    quote: 'Hasta la vista, baby.',
    category: 'Cinema Clássico',
    correct: 'Exterminador do Futuro (T-800)',
    options: ['Rambo', 'Exterminador do Futuro (T-800)', 'RoboCop', 'John Wick'],
    trivia: 'Dita por Arnold Schwarzenegger no clássico Exterminador do Futuro 2 (1991).'
  },
  {
    id: 'q5',
    quote: 'Eu sou o homem de ferro.',
    category: 'Cinema & Marvel',
    correct: 'Tony Stark',
    options: ['Steve Rogers', 'Thor Odinson', 'Tony Stark', 'Bruce Banner'],
    trivia: 'A frase que encerrou o filme Homem de Ferro (2008) e selou a vitória em Vingadores: Ultimato (2019).'
  },
  {
    id: 'q6',
    quote: 'Elementar, meu caro Watson.',
    category: 'Literatura Policial',
    correct: 'Sherlock Holmes',
    options: ['Hercule Poirot', 'Sherlock Holmes', 'Arsène Lupin', 'Inspetor Clouseau'],
    trivia: 'Popularizada no rádio e cinema, embora nos livros de Conan Doyle Sherlock nunca a use exatamente dessa forma.'
  },
  {
    id: 'q7',
    quote: 'Vim, vi e venci (Veni, vidi, vici).',
    category: 'História Antiga',
    correct: 'Júlio César',
    options: ['Alexandre, o Grande', 'Júlio César', 'Napoleão Bonaparte', 'Cícero'],
    trivia: 'Frase que o general romano usou para descrever sua vitória relâmpago na Batalha de Zela em 47 a.C.'
  },
  {
    id: 'q8',
    quote: 'Não há lugar como a nossa casa.',
    category: 'Clássicos do Cinema',
    correct: 'Dorothy (O Mágico de Oz)',
    options: ['Alice no País das Maravilhas', 'Cinderela', 'Dorothy (O Mágico de Oz)', 'Branca de Neve'],
    trivia: 'Basta bater os sapatinhos de rubi três vezes para retornar ao Kansas.'
  }
];

export function shuffleQuotes(quotes) {
  const deck = [...quotes];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function initQuemDisseMatch() {
  const deck = shuffleQuotes(QUOTES_DATABASE);
  const currentQuote = deck.shift();

  return {
    gameId: 'quemdisse',
    deck,
    round: 1,
    maxRounds: 6,
    currentQuote,
    score: 0,
    streak: 0,
    phase: 'ANSWERING', // ANSWERING, REVEAL, GAME_OVER
    lastResult: null,
    logs: [{ text: 'Quem Disse Isso? começou! Reconheça os autores das frases marcantes da humanidade!', time: new Date().toLocaleTimeString() }]
  };
}

export function submitQuoteAnswer(state, chosenOption) {
  const isCorrect = chosenOption === state.currentQuote.correct;

  if (isCorrect) {
    state.streak++;
    const pointsGained = 100 * state.streak;
    state.score += pointsGained;
    state.lastResult = {
      isCorrect: true,
      chosenOption,
      correct: state.currentQuote.correct,
      pointsGained,
      trivia: state.currentQuote.trivia
    };
    state.logs.unshift({
      text: `✨ ACERTOU! Era ${state.currentQuote.correct} (+${pointsGained} pts, Combo x${state.streak})!`,
      time: new Date().toLocaleTimeString()
    });
  } else {
    state.streak = 0;
    state.lastResult = {
      isCorrect: false,
      chosenOption,
      correct: state.currentQuote.correct,
      pointsGained: 0,
      trivia: state.currentQuote.trivia
    };
    state.logs.unshift({
      text: `❌ ERROU! A resposta certa era ${state.currentQuote.correct}.`,
      time: new Date().toLocaleTimeString()
    });
  }

  state.phase = 'REVEAL';
  return isCorrect;
}

export function nextQuoteRound(state) {
  if (state.round >= state.maxRounds || state.deck.length === 0) {
    state.phase = 'GAME_OVER';
    return state;
  }

  state.round++;
  state.currentQuote = state.deck.shift();
  state.lastResult = null;
  state.phase = 'ANSWERING';
  return state;
}
