// ============================================================================
// LÓGICA DO JOGO: JUKEBOX RETRÔ (HITSTER) — LINHA DO TEMPO MUSICAL
// ============================================================================

export const SONGS_DATABASE = [
  { id: 's1', title: 'Garota de Ipanema', artist: 'Tom Jobim & Vinicius de Moraes', year: 1962, genre: 'Bossa Nova', hint: 'Olha que coisa mais linda, mais cheia de graça...' },
  { id: 's2', title: 'Hey Jude', artist: 'The Beatles', year: 1968, genre: 'Rock', hint: 'Na-na-na-na-na-na-na, na-na-na-na...' },
  { id: 's3', title: 'Águas de Março', artist: 'Elis Regina & Tom Jobim', year: 1972, genre: 'MPB', hint: 'É pau, é pedra, é o fim do caminho...' },
  { id: 's4', title: 'Bohemian Rhapsody', artist: 'Queen', year: 1975, genre: 'Rock Clássico', hint: 'Is this the real life? Is this just fantasy?' },
  { id: 's5', title: 'Stayin\' Alive', artist: 'Bee Gees', year: 1977, genre: 'Disco', hint: 'Whether you\'re a brother or whether you\'re a mother...' },
  { id: 's6', title: 'Billie Jean', artist: 'Michael Jackson', year: 1982, genre: 'Pop', hint: 'She told me her name was Billie Jean, as she caused a scene...' },
  { id: 's7', title: 'Como Nossos Pais', artist: 'Elis Regina (comp. Belchior)', year: 1976, genre: 'MPB', hint: 'Você me pergunta pela minha paixão...' },
  { id: 's8', title: 'Take On Me', artist: 'a-ha', year: 1985, genre: 'Synthpop', hint: 'Take on me, take me on, I\'ll be gone in a day or two...' },
  { id: 's9', title: 'Pais e Filhos', artist: 'Legião Urbana', year: 1989, genre: 'Rock Nacional', hint: 'É preciso amar as pessoas como se não houvesse amanhã...' },
  { id: 's10', title: 'Evidências', artist: 'Chitãozinho & Xororó', year: 1990, genre: 'Sertanejo', hint: 'E nessa loucura de dizer que não te quero...' },
  { id: 's11', title: 'Smells Like Teen Spirit', artist: 'Nirvana', year: 1991, genre: 'Grunge', hint: 'With the lights out, it\'s less dangerous, here we are now, entertain us...' },
  { id: 's12', title: 'Anna Júlia', artist: 'Los Hermanos', year: 1999, genre: 'Pop Rock', hint: 'Quem te vê passar assim por mim não sabe o que é sofrer...' },
  { id: 's13', title: 'Festa', artist: 'Ivete Sangalo', year: 2001, genre: 'Axé', hint: 'Vai rolar a festa, vai rolar!' },
  { id: 's14', title: 'Crazy in Love', artist: 'Beyoncé ft. Jay-Z', year: 2003, genre: 'R&B / Pop', hint: 'Got me looking so crazy in love...' },
  { id: 's15', title: 'Ai Se Eu Te Pego', artist: 'Michel Teló', year: 2011, genre: 'Sertanejo Pop', hint: 'Nossa, nossa, assim você me mata...' },
  { id: 's16', title: 'Rolling in the Deep', artist: 'Adele', year: 2011, genre: 'Soul Pop', hint: 'There\'s a fire starting in my heart...' },
  { id: 's17', title: 'Trem-Bala', artist: 'Ana Vilela', year: 2016, genre: 'Folk / MPB', hint: 'Não é sobre ter todas as pessoas do mundo pra si...' },
  { id: 's18', title: 'Blinding Lights', artist: 'The Weeknd', year: 2019, genre: 'Synthwave', hint: 'I\'m blinded by the lights, no I can\'t sleep until I feel your touch...' }
];

export function shuffleSongs(songs) {
  const deck = [...songs];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function initJukeboxMatch() {
  const deck = shuffleSongs(SONGS_DATABASE);
  // Primeira carta da timeline inicial já é revelada como marco
  const starter = deck.shift();
  starter.revealed = true;

  const currentSong = deck.shift();

  return {
    gameId: 'jukebox',
    deck,
    timeline: [starter],
    currentSong,
    targetHits: 6,
    lives: 3,
    phase: 'PLACING', // PLACING, REVEAL, GAME_OVER
    lastPlacementResult: null,
    logs: [{ text: `A Jukebox ligou! Seu marco inicial é "${starter.title}" (${starter.year}). Ordene os sucessos!`, time: new Date().toLocaleTimeString() }]
  };
}

export function placeSongInTimeline(state, insertIndex) {
  const song = state.currentSong;
  const t = state.timeline;

  // Validação cronológica: a carta deve ter year >= carta anterior (se houver) e <= carta seguinte (se houver)
  const prevCard = insertIndex > 0 ? t[insertIndex - 1] : null;
  const nextCard = insertIndex < t.length ? t[insertIndex] : null;

  const validPrev = !prevCard || song.year >= prevCard.year;
  const validNext = !nextCard || song.year <= nextCard.year;
  const isCorrect = validPrev && validNext;

  if (isCorrect) {
    song.revealed = true;
    state.timeline.splice(insertIndex, 0, song);
    state.lastPlacementResult = {
      isCorrect: true,
      text: `🎵 ACERTOU! "${song.title}" foi lançada em ${song.year}!`,
      song
    };
    state.logs.unshift({
      text: `✨ Acerto cronológico! "${song.title}" (${song.year}) encaixada com sucesso!`,
      time: new Date().toLocaleTimeString()
    });
  } else {
    state.lives--;
    state.lastPlacementResult = {
      isCorrect: false,
      text: `❌ ERROU! "${song.title}" foi lançada em ${song.year}!`,
      song
    };
    state.logs.unshift({
      text: `💥 Erro de época! "${song.title}" era de ${song.year}. Você perdeu 1 vida (restam ${state.lives}).`,
      time: new Date().toLocaleTimeString()
    });
  }

  state.phase = 'REVEAL';
  return isCorrect;
}

export function nextJukeboxSong(state) {
  if (state.timeline.length >= state.targetHits || state.lives <= 0 || state.deck.length === 0) {
    state.phase = 'GAME_OVER';
    return state;
  }

  state.currentSong = state.deck.shift();
  state.lastPlacementResult = null;
  state.phase = 'PLACING';
  return state;
}
