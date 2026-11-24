// ============================================================================
// LÓGICA DO JOGO: PALAVRA PROIBIDA (TABOO) — ADIVINHAÇÃO RÁPIDA SEM TABUS
// ============================================================================

export const TABOO_CARDS = [
  {
    word: 'PIZZA',
    taboo: ['Queijo', 'Itália', 'Massa', 'Forno', 'Fatia'],
    botClues: [
      'Alimento redondo salgado muito pedido no jantar de domingo.',
      'Vem numa caixa quadrada e tem orégano e tomate por cima.',
      'Você pede por aplicativo de entrega e costuma comer com refrigerante.'
    ]
  },
  {
    word: 'FUTEBOL',
    taboo: ['Bola', 'Gol', 'Estádio', 'Chute', 'Jogador'],
    botClues: [
      'O esporte mais popular do Brasil que mobiliza torcidas aos domingos.',
      'Disputado em gramado com 11 pessoas de cada lado e um árbitro com apito.',
      'Acontece a Copa do Mundo a cada quatro anos com camisas verde e amarela.'
    ]
  },
  {
    word: 'ASTRONAUTA',
    taboo: ['Espaço', 'Lua', 'Foguete', 'Gravidade', 'Nasa'],
    botClues: [
      'Profissão de quem viaja além da atmosfera do nosso planeta.',
      'Usa um traje branco pressurizado com capacete transparente e tubos de oxigênio.',
      'Neil Armstrong foi o mais famoso pioneiro dessa área nos anos sessenta.'
    ]
  },
  {
    word: 'CHOCOLATE',
    taboo: ['Doce', 'Cacau', 'Leite', 'Barra', 'Sobremesa'],
    botClues: [
      'Guloseima escura deliciosa que derrete na boca.',
      'Muito presente em ovos de Páscoa e caixas de bombons.',
      'Pode ser amargo, branco ou ao leite e traz felicidade quando você come.'
    ]
  },
  {
    word: 'VAMPIRO',
    taboo: ['Sangue', 'Drácula', 'Alho', 'Dente', 'Morcego'],
    botClues: [
      'Criatura lendária noturna que não pode tomar luz do Sol de jeito nenhum.',
      'Dorme num caixão e morde o pescoço das pessoas para se alimentar.',
      'Fica apavorado diante de cruzes e não tem reflexo nenhum no espelho.'
    ]
  },
  {
    word: 'INTERNET',
    taboo: ['Computador', 'Wi-Fi', 'Rede', 'Site', 'Conexão'],
    botClues: [
      'Sistema global digital inventado no século vinte para navegar.',
      'Permite mandar mensagens instantâneas e assistir vídeos online.',
      'Começa tradicionalmente com três letras W antes do nome do endereço.'
    ]
  },
  {
    word: 'PIRATA',
    taboo: ['Navio', 'Papagaio', 'Tesouro', 'Perna de pau', 'Tapa-olho'],
    botClues: [
      'Bandido dos sete mares famoso por usar bandeira preta com caveira.',
      'Procura arcas cheias de moedas preciosas enterradas seguindo um mapa.',
      'Jack Sparrow é o personagem mais conhecido desse arquétipo no cinema.'
    ]
  },
  {
    word: 'DINOSSAURO',
    taboo: ['Extinto', 'Fóssil', 'T-Rex', 'Pré-histórico', 'Meteoro'],
    botClues: [
      'Répteis gigantescos colossais que reinaram na Terra milhões de anos atrás.',
      'Ficaram imortalizados na franquia cinematográfica Jurassic Park.',
      'Ossos gigantes deles são descobertos em escavações e exibidos em museus.'
    ]
  }
];

export function shuffleTaboo(cards) {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function initPalavraMatch() {
  const deck = shuffleTaboo(TABOO_CARDS);
  const currentCard = deck.shift();

  return {
    gameId: 'palavra',
    deck,
    currentCard,
    currentClueIndex: 0,
    score: 0,
    timeRemaining: 60,
    correctList: [],
    skippedList: [],
    phase: 'PLAYING', // PLAYING, GAME_OVER
    logs: [{ text: 'Palavra Proibida começou! Adivinhe o termo sem citar os 5 tabus!', time: new Date().toLocaleTimeString() }]
  };
}

export function checkTabooGuess(state, guess) {
  const cleanGuess = guess.trim().toLowerCase();
  const target = state.currentCard.word.toLowerCase();

  if (cleanGuess === target) {
    state.score++;
    state.correctList.push(state.currentCard.word);
    state.logs.unshift({
      text: `✨ ACERTOU! "${state.currentCard.word}" (+1 ponto)!`,
      time: new Date().toLocaleTimeString()
    });
    advanceTabooCard(state);
    return true;
  }

  return false;
}

export function skipTabooCard(state) {
  state.skippedList.push(state.currentCard.word);
  state.logs.unshift({
    text: `⏩ Pulou a palavra "${state.currentCard.word}".`,
    time: new Date().toLocaleTimeString()
  });
  advanceTabooCard(state);
}

export function advanceTabooCard(state) {
  if (state.deck.length === 0) {
    state.phase = 'GAME_OVER';
    return;
  }
  state.currentCard = state.deck.shift();
  state.currentClueIndex = 0;
}
