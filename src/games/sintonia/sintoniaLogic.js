// ============================================================================
// LÓGICA DO JOGO: SINTONIA TOTAL (WAVELENGTH) — ESPECTRO MENTAL & PONTUAÇÃO
// ============================================================================

export const SPECTRUM_CARDS = [
  {
    id: 'sp1',
    left: 'Cafona / Brega',
    right: 'Elegante / Chique',
    clues: [
      { min: 0, max: 20, clue: 'Meias com sandálias num casamento' },
      { min: 21, max: 40, clue: 'Camisa estampada floral chamativa' },
      { min: 41, max: 60, clue: 'Jeans com blazer casual' },
      { min: 61, max: 80, clue: 'Relógio clássico de prata' },
      { min: 81, max: 100, clue: 'Smoking sob medida em gala de cinema' }
    ]
  },
  {
    id: 'sp2',
    left: 'Inútil numa Ilha Deserta',
    right: 'Indispensável numa Ilha Deserta',
    clues: [
      { min: 0, max: 20, clue: 'Um secador de cabelo sem tomada' },
      { min: 21, max: 40, clue: 'Um par de sapatos de salto alto' },
      { min: 41, max: 60, clue: 'Um livro de 1000 páginas' },
      { min: 61, max: 80, clue: 'Uma lona impermeável' },
      { min: 81, max: 100, clue: 'Um facão afiado e pederneira' }
    ]
  },
  {
    id: 'sp3',
    left: 'Filme Horrível',
    right: 'Obra-Prima do Cinema',
    clues: [
      { min: 0, max: 20, clue: 'Sharknado 4' },
      { min: 21, max: 40, clue: 'Comédia pastelão dos anos 2000' },
      { min: 41, max: 60, clue: 'Velozes e Furiosos 5' },
      { min: 61, max: 80, clue: 'Interestelar' },
      { min: 81, max: 100, clue: 'O Poderoso Chefão' }
    ]
  },
  {
    id: 'sp4',
    left: 'Muito Frio',
    right: 'Muito Quente',
    clues: [
      { min: 0, max: 20, clue: 'Picolé de limão esquecido na Sibéria' },
      { min: 21, max: 40, clue: 'Um copo de água mineral com gás gelada' },
      { min: 41, max: 60, clue: 'Café morno de padaria' },
      { min: 61, max: 80, clue: 'Sopa de legumes fervendo' },
      { min: 81, max: 100, clue: 'Superfície de uma estrela' }
    ]
  },
  {
    id: 'sp5',
    left: 'Vilão Pura Maldade',
    right: 'Herói Salvador Inquestionável',
    clues: [
      { min: 0, max: 20, clue: 'Voldemort' },
      { min: 21, max: 40, clue: 'Darth Vader redimido no fim' },
      { min: 41, max: 60, clue: 'Deadpool' },
      { min: 61, max: 80, clue: 'Homem-Aranha' },
      { min: 81, max: 100, clue: 'Superman salvando um gatinho' }
    ]
  },
  {
    id: 'sp6',
    left: 'Superestimado',
    right: 'Subestimado',
    clues: [
      { min: 0, max: 20, clue: 'Fila de balada badalada' },
      { min: 21, max: 40, clue: 'Caviar em festa chique' },
      { min: 41, max: 60, clue: 'Carro elétrico moderno' },
      { min: 61, max: 80, clue: 'Dormir 8 horas completas' },
      { min: 81, max: 100, clue: 'Beber água quando está com sede extrema' }
    ]
  },
  {
    id: 'sp7',
    left: 'Fácil de Aprender',
    right: 'Extremamente Difícil de Dominar',
    clues: [
      { min: 0, max: 20, clue: 'Jogo da Velha' },
      { min: 21, max: 40, clue: 'Uno' },
      { min: 41, max: 60, clue: 'Xadrez básico' },
      { min: 61, max: 80, clue: 'Tocar violino clássico' },
      { min: 81, max: 100, clue: 'Astrofísica quântica' }
    ]
  },
  {
    id: 'sp8',
    left: 'Assustador / Perigoso',
    right: 'Fofo / Inofensivo',
    clues: [
      { min: 0, max: 20, clue: 'Tubarão-branco com fome no escuro' },
      { min: 21, max: 40, clue: 'Cão de guarda latindo bravo' },
      { min: 41, max: 60, clue: 'Camaleão imóvel num galho' },
      { min: 61, max: 80, clue: 'Panda comendo bambu' },
      { min: 81, max: 100, clue: 'Filhote de golden retriever sonhando' }
    ]
  }
];

export function initSintoniaMatch(humanPlayer) {
  const cards = [...SPECTRUM_CARDS].sort(() => Math.random() - 0.5);
  
  return {
    gameId: 'sintonia',
    cards,
    round: 1,
    maxRounds: 5,
    teamScore: 0,
    rivalScore: 0,
    currentCard: cards[0],
    targetPosition: Math.floor(Math.random() * 70) + 15, // Entre 15 e 85 para ter margem
    needlePosition: 50,
    psychicClue: '',
    phase: 'CLUE', // CLUE, GUESSING, REVEAL, GAME_OVER
    lastResult: null,
    logs: [{ text: 'Bem-vindo ao Sintonia Total! Sintonize a mente da sua equipe!', time: new Date().toLocaleTimeString() }]
  };
}

export function generateBotClueForTarget(card, target) {
  const matching = card.clues.find(c => target >= c.min && target <= c.max);
  return matching ? matching.clue : 'Algo equilibrado no meio do espectro';
}

export function startRoundWithClue(state, clueText) {
  state.psychicClue = clueText;
  state.phase = 'GUESSING';
  state.needlePosition = 50;
  state.logs.unshift({
    text: `📻 Pista recebida: "${clueText}". Ajuste o ponteiro no espectro!`,
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function calculateScore(needle, target) {
  const diff = Math.abs(needle - target);
  if (diff <= 4) return { points: 4, zone: 'BULLSEYE', text: '🎯 NA MOSCA! Sintonia Perfeita (+4 pts)' };
  if (diff <= 10) return { points: 3, zone: 'GREAT', text: '✨ Quase perfeito! (+3 pts)' };
  if (diff <= 16) return { points: 2, zone: 'GOOD', text: '👍 Boa sintonia! (+2 pts)' };
  return { points: 0, zone: 'MISS', text: '❌ Fora da frequência! (+0 pts)' };
}

export function resolveGuess(state, finalNeedle) {
  state.needlePosition = finalNeedle;
  const result = calculateScore(finalNeedle, state.targetPosition);
  state.teamScore += result.points;
  state.lastResult = {
    needle: finalNeedle,
    target: state.targetPosition,
    ...result
  };
  state.phase = 'REVEAL';
  state.logs.unshift({
    text: `${result.text} (Ponteiro: ${finalNeedle} | Alvo: ${state.targetPosition})`,
    time: new Date().toLocaleTimeString()
  });
  return state;
}

export function nextSintoniaRound(state) {
  if (state.round >= state.maxRounds) {
    state.phase = 'GAME_OVER';
    return state;
  }

  state.round++;
  state.currentCard = state.cards[state.round % state.cards.length];
  state.targetPosition = Math.floor(Math.random() * 70) + 15;
  state.needlePosition = 50;
  state.psychicClue = '';
  state.lastResult = null;
  state.phase = 'CLUE';
  return state;
}
