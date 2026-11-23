import { supabase } from '../lib/supabase.js';
import {
  trackCardUsage,
  trackCombatStrike,
  trackBluffCall,
  trackBlock,
  trackMatchOutcome,
} from './statsService.js';

// Catálogo Mestre de 35 Cartas (7 Arquétipos x 5 Cópias Cada)
export const CARD_CATALOG = [
  {
    code: 'ARCHMAGE',
    name: 'Arquimago Supremo',
    universe_ref: 'Harry Potter',
    faction_color: '#8B5CF6',
    active_ability_name: 'Transfiguração',
    active_description: 'Compra 2 cartas do grimório, escolhe quais manter e devolve 2 ao fundo do baralho.',
    block_ability_name: 'Contrafeitiço',
    block_description: 'Bloqueia o Manto Élfico (Portador do Anel) e a Profecia Arcana (Oráculo).',
    copies_in_deck: 5,
    icon: '🧙‍♂️',
  },
  {
    code: 'RINGBEARER',
    name: 'Portador do Anel',
    universe_ref: 'O Senhor dos Anéis',
    faction_color: '#F59E0B',
    active_ability_name: 'Manto Élfico',
    active_description: 'Rouba até 2 Runas de um adversário à sua escolha.',
    block_ability_name: 'Invisibilidade',
    block_description: 'Bloqueia tentativas de roubo de outro Portador do Anel.',
    copies_in_deck: 5,
    icon: '💍',
  },
  {
    code: 'DEMIGOD',
    name: 'Semideus do Olimpo',
    universe_ref: 'Percy Jackson',
    faction_color: '#06B6D4',
    active_ability_name: 'Fúria Olímpica',
    active_description: 'Paga 3 Runas e desfere um ataque letal: o alvo perde 1 identidade arcana.',
    block_ability_name: 'Barreira Celeste',
    block_description: 'Bloqueia a Ajuda da Guilda coletada por qualquer jogador.',
    copies_in_deck: 5,
    icon: '⚡',
  },
  {
    code: 'DRAGONSLAYER',
    name: 'Caçador de Dragões',
    universe_ref: 'O Hobbit',
    faction_color: '#EF4444',
    active_ability_name: 'Pilhagem de Smaug',
    active_description: 'Saqueia o tesouro ancestral de Erebor, recebendo imediatamente +3 Runas.',
    block_ability_name: 'Resistência Dracônica',
    block_description: 'Aura inabalável imune a tributos forçados.',
    copies_in_deck: 5,
    icon: '🐉',
  },
  {
    code: 'RELIC_KEEPER',
    name: 'Guardião das Relíquias',
    universe_ref: 'Harry Potter',
    faction_color: '#10B981',
    active_ability_name: 'Voto Perpétuo',
    active_description: 'Recebe +2 Runas puras do santuário arcano (ação sagrada não bloqueável).',
    block_ability_name: 'Escudo das Relíquias',
    block_description: 'Bloqueia o golpe mortal da Fúria Olímpica (Semideus).',
    copies_in_deck: 5,
    icon: '🛡️',
  },
  {
    code: 'ORACLE',
    name: 'Oráculo de Delfos',
    universe_ref: 'Percy Jackson',
    faction_color: '#EC4899',
    active_ability_name: 'Profecia Arcana',
    active_description: 'Espia secretamente 1 carta oculta de um adversário e ganha +1 Runa de oferenda.',
    block_ability_name: 'Névoa Mística',
    block_description: 'Bloqueia tentativas de espionagem do Oráculo adversário.',
    copies_in_deck: 5,
    icon: '🔮',
  },
  {
    code: 'DARK_LORD',
    name: 'Lorde das Sombras',
    universe_ref: 'Senhor dos Anéis & Harry Potter',
    faction_color: '#6366F1',
    active_ability_name: 'Drenagem Sombria',
    active_description: 'Extorque 1 Runa de cada adversário vivo na mesa para o seu poder.',
    block_ability_name: 'Manto das Trevas',
    block_description: 'Bloqueia o roubo do Portador do Anel e a espionagem do Oráculo.',
    copies_in_deck: 5,
    icon: '👁️',
  },
];

export const getCardByCode = (code) => {
  return CARD_CATALOG.find((c) => c.code === code) || {
    code,
    name: code,
    universe_ref: 'Reino Desconhecido',
    faction_color: '#64748B',
    active_ability_name: 'Ação Desconhecida',
    active_description: '',
    block_ability_name: 'Bloqueio',
    block_description: '',
    icon: '🃏',
  };
};

// Embaralhamento Fisher-Yates imutável
export const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Gera código de sala alfanumérico com 4 letras maiúsculas
export const generateRoomCode = () => {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return result;
};

// Registra mensagem no feed de crônicas da partida
export const addGameLog = async (roomId, actorNickname, eventType, message) => {
  try {
    const { error } = await supabase.from('game_logs').insert([
      {
        room_id: roomId,
        actor_nickname: actorNickname || 'Sistema',
        event_type: eventType,
        message,
        created_at: new Date().toISOString(),
      },
    ]);
    if (error) console.error('[addGameLog] Erro ao gravar log:', error);
  } catch (err) {
    console.error('[addGameLog] Exceção:', err);
  }
};

// 1. LOBBY: Criar Sala
export const createRoom = async (hostNickname, avatarTheme = 'mago') => {
  const code = generateRoomCode();
  
  // Cria a sala
  const { data: roomData, error: roomError } = await supabase
    .from('rooms')
    .insert([
      {
        code,
        status: 'waiting',
        turn_phase: 'action',
        deck: [],
      },
    ])
    .select()
    .single();

  if (roomError) throw new Error(`Falha ao criar sala: ${roomError.message}`);

  // Insere o host
  const { data: playerData, error: playerError } = await supabase
    .from('players')
    .insert([
      {
        room_id: roomData.id,
        nickname: hostNickname.trim(),
        avatar_theme: avatarTheme,
        seat_order: 1,
        runes: 2,
        is_alive: true,
        is_host: true,
      },
    ])
    .select()
    .single();

  if (playerError) throw new Error(`Falha ao entrar como Host: ${playerError.message}`);

  await addGameLog(roomData.id, hostNickname, 'SYSTEM', `A sala ${code} foi forjada por ${hostNickname}.`);

  return { room: roomData, player: playerData };
};

// 2. LOBBY: Entrar na Sala
export const joinRoom = async (roomCode, nickname, avatarTheme = 'guerreiro') => {
  const cleanCode = roomCode.trim().toUpperCase();

  // Busca a sala
  const { data: room, error: roomError } = await supabase
    .from('rooms')
    .select('*')
    .eq('code', cleanCode)
    .single();

  if (roomError || !room) {
    throw new Error('Sala não encontrada. Verifique o código de 4 letras.');
  }

  if (room.status !== 'waiting') {
    throw new Error('Esta partida já está em andamento ou foi finalizada.');
  }

  // Busca jogadores atuais para verificar limite e ordem de assento
  const { data: currentPlayers, error: countError } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', room.id)
    .order('seat_order', { ascending: true });

  if (countError) throw new Error('Falha ao verificar jogadores da sala.');

  if (currentPlayers.length >= 5) {
    throw new Error('A sala atingiu o limite máximo de 5 nobres arcanos (2 a 5 jogadores).');
  }

  const nextSeat = currentPlayers.length + 1;

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert([
      {
        room_id: room.id,
        nickname: nickname.trim(),
        avatar_theme: avatarTheme,
        seat_order: nextSeat,
        runes: 2,
        is_alive: true,
        is_host: false,
      },
    ])
    .select()
    .single();

  if (playerError) throw new Error(`Falha ao entrar na sala: ${playerError.message}`);

  await addGameLog(room.id, nickname, 'SYSTEM', `${nickname} juntou-se à aliança arcana.`);

  return { room, player };
};

// 3. INICIAR PARTIDA (Apenas Host, Mínimo 2 e Máximo 5 jogadores)
export const startGame = async (roomId) => {
  const { data: players, error: pError } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('seat_order', { ascending: true });

  if (pError || !players || players.length < 2) {
    throw new Error('A partida precisa de pelo menos 2 guerreiros para iniciar.');
  }

  const playerCount = players.length;

  // Calibragem dinâmica do baralho baseada nas regras oficiais do Coup:
  // Para que o blefe e a contagem de cartas funcionem com perfeição:
  // - 2 Jogadores: 2 cópias de cada carta (14 cartas no total)
  // - 3 Jogadores: 3 cópias de cada carta (21 cartas no total)
  // - 4 Jogadores: 4 cópias de cada carta (28 cartas no total)
  // - 5 Jogadores: 5 cópias de cada carta (35 cartas no total)
  const copiesPerCard = Math.min(5, Math.max(2, playerCount));

  let rawDeck = [];
  CARD_CATALOG.forEach((card) => {
    for (let i = 0; i < copiesPerCard; i++) {
      rawDeck.push(card.code);
    }
  });

  const shuffledDeck = shuffleArray(rawDeck);

  // Distribui 2 cartas para cada jogador
  const handInserts = [];
  players.forEach((player) => {
    const card1 = shuffledDeck.pop();
    const card2 = shuffledDeck.pop();

    handInserts.push({
      room_id: roomId,
      player_id: player.id,
      card_code: card1,
      slot_index: 1,
      is_revealed: false,
    });

    handInserts.push({
      room_id: roomId,
      player_id: player.id,
      card_code: card2,
      slot_index: 2,
      is_revealed: false,
    });
  });

  // Salva mãos no Supabase
  const { error: handError } = await supabase.from('player_hands').insert(handInserts);
  if (handError) throw new Error(`Erro ao distribuir cartas: ${handError.message}`);

  // Regra Oficial Coup para 2 Jogadores:
  // O Jogador 1 (que joga primeiro) inicia com 1 Runa para equilibrar a iniciativa;
  // O Jogador 2 inicia com 2 Runas.
  // Para 3 a 5 jogadores, todos iniciam com 2 Runas.
  if (playerCount === 2) {
    await supabase.from('players').update({ runes: 1 }).eq('id', players[0].id);
    await supabase.from('players').update({ runes: 2 }).eq('id', players[1].id);
  }

  // Primeiro jogador a jogar
  const firstPlayer = players[0];

  // Atualiza estado da sala
  const { error: roomUpdateError } = await supabase
    .from('rooms')
    .update({
      status: 'playing',
      turn_phase: 'action',
      current_turn_player_id: firstPlayer.id,
      deck: shuffledDeck,
      pending_action: null,
      winner_player_id: null,
    })
    .eq('id', roomId);

  if (roomUpdateError) throw new Error(`Erro ao iniciar sala: ${roomUpdateError.message}`);

  await addGameLog(
    roomId,
    firstPlayer.nickname,
    'SYSTEM',
    `⚔️ Duelo iniciado com ${playerCount} jogadores! Grimório calibrado com ${rawDeck.length} cartas (${copiesPerCard} de cada arquétipo). Vez de ${firstPlayer.nickname}.`
  );
};

// Rotação de Turno
export const advanceTurn = async (roomId) => {
  // Busca todos os jogadores da sala ordenados por assento
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .order('seat_order', { ascending: true });

  const { data: room } = await supabase
    .from('rooms')
    .select('current_turn_player_id')
    .eq('id', roomId)
    .single();

  if (!players || !room) return;

  const alivePlayers = players.filter((p) => p.is_alive);

  // Verifica condição de vitória
  if (alivePlayers.length <= 1) {
    await checkVictoryCondition(roomId);
    return;
  }

  const currentIndex = alivePlayers.findIndex((p) => p.id === room.current_turn_player_id);
  const nextIndex = (currentIndex + 1) % alivePlayers.length;
  const nextPlayer = alivePlayers[nextIndex];

  await supabase
    .from('rooms')
    .update({
      turn_phase: 'action',
      current_turn_player_id: nextPlayer.id,
      pending_action: null,
    })
    .eq('id', roomId);

  await addGameLog(roomId, nextPlayer.nickname, 'SYSTEM', `Novo turno! Agora é a vez de ${nextPlayer.nickname}.`);
};

// Checagem de Vitória e Eliminação
export const checkPlayerElimination = async (roomId, playerId) => {
  const { data: hands } = await supabase
    .from('player_hands')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId);

  if (!hands || hands.length === 0) return;

  const allRevealed = hands.every((h) => h.is_revealed);

  if (allRevealed) {
    const { data: player } = await supabase
      .from('players')
      .update({ is_alive: false })
      .eq('id', playerId)
      .select()
      .single();

    if (player) {
      await addGameLog(roomId, player.nickname, 'ELIMINATED', `💀 ${player.nickname} teve todas as suas identidades reveladas e foi eliminado do duelo!`);
    }

    await checkVictoryCondition(roomId);
  }
};

export const checkVictoryCondition = async (roomId) => {
  const { data: alivePlayers } = await supabase
    .from('players')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_alive', true);

  if (alivePlayers && alivePlayers.length === 1) {
    const winner = alivePlayers[0];
    
    // Registra vitória e derrotas no ranking
    try {
      const { data: allRoomPlayers } = await supabase
        .from('players')
        .select('nickname')
        .eq('room_id', roomId);

      const allNicks = allRoomPlayers ? allRoomPlayers.map((p) => p.nickname) : [];
      await trackMatchOutcome(winner.nickname, allNicks);
    } catch (err) {
      console.warn('Erro ao atualizar ranking de fim de partida:', err);
    }

    await supabase
      .from('rooms')
      .update({
        status: 'finished',
        winner_player_id: winner.id,
        turn_phase: 'resolve',
        pending_action: null,
      })
      .eq('id', roomId);

    await addGameLog(roomId, winner.nickname, 'SYSTEM', `🏆 GRANDE VITÓRIA! ${winner.nickname} conquistou a Aliança Arcana e se tornou a lenda suprema!`);
  }
};

// EXECUÇÃO DE AÇÕES DO TURNO

// 1. Coletar 1 Runa (Ação Livre, sem contestação, sem bloqueio)
export const actCollect1 = async (roomId, actor) => {
  // Incrementa 1 runa
  await supabase
    .from('players')
    .update({ runes: actor.runes + 1 })
    .eq('id', actor.id);

  await addGameLog(roomId, actor.nickname, 'ACTION', `${actor.nickname} coletou 1 Runa de poder do altar (+1 Runa).`);
  await advanceTurn(roomId);
};

// 2. Golpe Épico (Custa 7 Runas, sem blefe, sem bloqueio, destrói 1 carta do alvo)
export const actEpicStrike = async (roomId, actor, target) => {
  if (actor.runes < 7) {
    throw new Error('Você precisa de 7 Runas para desferir um Golpe Épico.');
  }

  // Deduz 7 runas do ator
  await supabase
    .from('players')
    .update({ runes: actor.runes - 7 })
    .eq('id', actor.id);

  // Registra combate no ranking
  trackCombatStrike(actor.nickname, target.nickname, 'EPIC_STRIKE');

  await addGameLog(roomId, actor.nickname, 'ACTION', `⚡ ${actor.nickname} conjurou um GOLPE ÉPICO contra ${target.nickname}!`);

  // Alvo perde 1 carta oculta
  await forcePlayerLoseCard(roomId, target.id);
  await advanceTurn(roomId);
};

// 3. Declarar Ação de Personagem ou Ação Bloqueável
export const declareAction = async (roomId, actor, actionCode, target = null) => {
  // Validação: Se tiver 10+ runas, Golpe Épico é OBRIGATÓRIO
  if (actor.runes >= 10 && actionCode !== 'EPIC_STRIKE') {
    throw new Error('Você acumulou 10 ou mais Runas! Pela lei arcana, você DEVE desferir um Golpe Épico.');
  }

  // Validação Demigod (Assassinar) requer 3 runas
  if (actionCode === 'ASSASSINATE' && actor.runes < 3) {
    throw new Error('A Fúria Olímpica requer ao menos 3 Runas de oferenda.');
  }

  let actionLabel = '';
  let claimedCard = null;
  let nextPhase = 'challenge_window';

  switch (actionCode) {
    case 'GUILD_AID':
      actionLabel = 'Ajuda da Guilda (+2 Runas)';
      claimedCard = null; // Ação livre, não contestável, mas bloqueável por Demigod
      nextPhase = 'block_window';
      break;

    case 'ARCHMAGE_EXCHANGE':
      actionLabel = 'Transfiguração (Trocar 2 cartas do deck)';
      claimedCard = 'ARCHMAGE';
      break;

    case 'STEAL':
      actionLabel = `Manto Élfico (Roubar 2 Runas de ${target?.nickname})`;
      claimedCard = 'RINGBEARER';
      break;

    case 'ASSASSINATE':
      actionLabel = `Fúria Olímpica (Eliminar carta de ${target?.nickname})`;
      claimedCard = 'DEMIGOD';
      // Deduz antecipadamente as 3 runas
      await supabase
        .from('players')
        .update({ runes: actor.runes - 3 })
        .eq('id', actor.id);
      break;

    case 'TAX_TREASURY':
      actionLabel = 'Pilhagem de Smaug (+3 Runas)';
      claimedCard = 'DRAGONSLAYER';
      break;

    case 'PERPETUAL_VOW':
      actionLabel = 'Voto Perpétuo (+2 Runas puras)';
      claimedCard = 'RELIC_KEEPER';
      break;

    case 'DIVINATION':
      actionLabel = `Profecia Arcana (Espiar carta de ${target?.nickname} e +1 Runa)`;
      claimedCard = 'ORACLE';
      break;

    case 'DARK_DRAIN':
      actionLabel = 'Drenagem Sombria (Extorquir 1 Runa de cada adversário)';
      claimedCard = 'DARK_LORD';
      break;

    default:
      throw new Error(`Ação desconhecida: ${actionCode}`);
  }

  // Rastreia carta declarada no perfil
  if (claimedCard) {
    trackCardUsage(actor.nickname, claimedCard);
  }

  const pendingAction = {
    actor_id: actor.id,
    actor_name: actor.nickname,
    action_code: actionCode,
    action_label: actionLabel,
    target_id: target?.id || null,
    target_name: target?.nickname || null,
    claimed_card: claimedCard,
    blocked_by_id: null,
    blocked_by_name: null,
    block_card: null,
    accepted_by: [actor.id], // lista de jogadores que aceitaram
  };

  await supabase
    .from('rooms')
    .update({
      turn_phase: nextPhase,
      pending_action: pendingAction,
    })
    .eq('id', roomId);

  await addGameLog(
    roomId,
    actor.nickname,
    'ACTION',
    `${actor.nickname} declarou: "${actionLabel}" ${claimedCard ? `alegando ser [${getCardByCode(claimedCard).name}]!` : ''}`
  );
};

// RESOLUÇÃO DE CONTESTAÇÃO ("MENTIRA!")
export const callBluff = async (roomId, challenger) => {
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room || !room.pending_action) return;

  const { actor_id, actor_name, claimed_card, blocked_by_id, blocked_by_name, block_card } = room.pending_action;

  // Está contestando um BLOQUEIO ou a AÇÃO original?
  const isContestingBlock = Boolean(blocked_by_id && block_card);
  const targetId = isContestingBlock ? blocked_by_id : actor_id;
  const targetName = isContestingBlock ? blocked_by_name : actor_name;
  const verifiedCard = isContestingBlock ? block_card : claimed_card;

  // Busca as cartas ocultas do acusado
  const { data: hands } = await supabase
    .from('player_hands')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', targetId)
    .eq('is_revealed', false);

  const hasCard = hands && hands.some((h) => h.card_code === verifiedCard);

  await addGameLog(
    roomId,
    challenger.nickname,
    'BLUFF_CALL',
    `⚔️ ${challenger.nickname} gritou: "MENTIRA!" desafiando a declaração de [${getCardByCode(verifiedCard).name}] por ${targetName}!`
  );

  if (!hasCard) {
    // ERA BLEFE! O acusado mentiu!
    trackBluffCall(targetName, challenger.nickname, true);

    await addGameLog(
      roomId,
      targetName,
      'BLUFF_CALL',
      `❌ PEGO NO BLEFE! ${targetName} não possuía a carta! ${targetName} perde uma identidade arcana!`
    );

    // O mentiroso perde uma carta
    await forcePlayerLoseCard(roomId, targetId);

    if (isContestingBlock) {
      // Bloqueio frustrado! A ação original agora pode ser executada
      await resolveAction(roomId);
    } else {
      // Ação original cancelada! Turno passa.
      await advanceTurn(roomId);
    }
  } else {
    // ERA VERDADE! O acusado falava a verdade!
    trackBluffCall(targetName, challenger.nickname, false);

    await addGameLog(
      roomId,
      targetName,
      'BLUFF_CALL',
      `✨ ERA VERDADE! ${targetName} revelou com orgulho [${getCardByCode(verifiedCard).name}]! ${challenger.nickname} falhou no julgamento e perde 1 identidade!`
    );

    // O contestador perde uma carta
    await forcePlayerLoseCard(roomId, challenger.id);

    // O acusado coloca a carta comprovada de volta no deck e compra uma nova
    await replaceProvenCard(roomId, targetId, verifiedCard);

    if (isContestingBlock) {
      // O bloqueio foi mantido e validado! A ação foi cancelada pelo bloqueio bem-sucedido.
      await addGameLog(roomId, blocked_by_name, 'BLOCK', `🛡️ O bloqueio foi bem-sucedido. A ação foi frustrada.`);
      await advanceTurn(roomId);
    } else {
      // A ação original segue em frente!
      // Se a ação for bloqueável, abre janela de bloqueio. Se não, resolve!
      const blockableActions = ['GUILD_AID', 'STEAL', 'ASSASSINATE', 'DIVINATION'];
      if (blockableActions.includes(room.pending_action.action_code)) {
        await supabase
          .from('rooms')
          .update({ turn_phase: 'block_window' })
          .eq('id', roomId);
      } else {
        await resolveAction(roomId);
      }
    }
  }
};

// Jogador aceita a ação / não contesta
export const acceptAction = async (roomId, player) => {
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room || !room.pending_action) return;

  const currentAccepted = room.pending_action.accepted_by || [];
  if (!currentAccepted.includes(player.id)) {
    currentAccepted.push(player.id);
  }

  // Busca jogadores vivos
  const { data: alivePlayers } = await supabase
    .from('players')
    .select('id')
    .eq('room_id', roomId)
    .eq('is_alive', true);

  // Se todos os jogadores vivos aceitaram
  const allAccepted = alivePlayers.every((p) => currentAccepted.includes(p.id));

  if (allAccepted) {
    if (room.turn_phase === 'challenge_window') {
      const isBlockContest = Boolean(room.pending_action.blocked_by_id);
      if (isBlockContest) {
        // Bloqueio aceito por todos! Ação original cancelada com sucesso.
        await addGameLog(
          roomId,
          room.pending_action.blocked_by_name,
          'BLOCK',
          `🛡️ O bloqueio de ${room.pending_action.blocked_by_name} foi aceito por todos. A ação foi frustrada.`
        );
        await advanceTurn(roomId);
        return;
      }

      // Ação não foi contestada. Se puder ser bloqueada, vai para block_window; senão resolve
      const blockableActions = ['GUILD_AID', 'STEAL', 'ASSASSINATE', 'DIVINATION'];
      if (blockableActions.includes(room.pending_action.action_code)) {
        await supabase
          .from('rooms')
          .update({
            turn_phase: 'block_window',
            pending_action: { ...room.pending_action, accepted_by: [] },
          })
          .eq('id', roomId);
      } else {
        await resolveAction(roomId);
      }
    } else if (room.turn_phase === 'block_window') {
      // Ninguém bloqueou. Resolve a ação original!
      await resolveAction(roomId);
    }
  } else {
    // Atualiza lista de aceitos
    await supabase
      .from('rooms')
      .update({
        pending_action: { ...room.pending_action, accepted_by: currentAccepted },
      })
      .eq('id', roomId);
  }
};

// DECLARAÇÃO DE BLOQUEIO
export const declareBlock = async (roomId, blocker, blockCard) => {
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room || !room.pending_action) return;

  // Rastreia bloqueio e uso da carta no perfil
  trackBlock(blocker.nickname);
  trackCardUsage(blocker.nickname, blockCard);

  const updatedAction = {
    ...room.pending_action,
    blocked_by_id: blocker.id,
    blocked_by_name: blocker.nickname,
    block_card: blockCard,
    accepted_by: [blocker.id],
  };

  await supabase
    .from('rooms')
    .update({
      turn_phase: 'challenge_window', // Nova janela de contestação para o bloqueio
      pending_action: updatedAction,
    })
    .eq('id', roomId);

  await addGameLog(
    roomId,
    blocker.nickname,
    'BLOCK',
    `🛡️ ${blocker.nickname} interpôs um BLOQUEIO alegando possuir [${getCardByCode(blockCard).name}]!`
  );
};

// RESOLUÇÃO FINAL DA AÇÃO
export const resolveAction = async (roomId) => {
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room || !room.pending_action) return;

  const { actor_id, actor_name, action_code, target_id, target_name } = room.pending_action;

  // Busca dados dos jogadores envolvidos
  const { data: actor } = await supabase.from('players').select('*').eq('id', actor_id).single();
  let target = null;
  if (target_id) {
    const { data: t } = await supabase.from('players').select('*').eq('id', target_id).single();
    target = t;
  }

  switch (action_code) {
    case 'GUILD_AID': {
      await supabase
        .from('players')
        .update({ runes: actor.runes + 2 })
        .eq('id', actor.id);
      await addGameLog(roomId, actor_name, 'ACTION', `💰 ${actor_name} recebeu +2 Runas da Ajuda da Guilda.`);
      await advanceTurn(roomId);
      break;
    }

    case 'DRAGONSLAYER':
    case 'TAX_TREASURY': {
      await supabase
        .from('players')
        .update({ runes: actor.runes + 3 })
        .eq('id', actor.id);
      await addGameLog(roomId, actor_name, 'ACTION', `🐉 ${actor_name} pilhou o tesouro de Smaug (+3 Runas)!`);
      await advanceTurn(roomId);
      break;
    }

    case 'RELIC_KEEPER':
    case 'PERPETUAL_VOW': {
      await supabase
        .from('players')
        .update({ runes: actor.runes + 2 })
        .eq('id', actor.id);
      await addGameLog(roomId, actor_name, 'ACTION', `✨ ${actor_name} completou o Voto Perpétuo (+2 Runas puras)!`);
      await advanceTurn(roomId);
      break;
    }

    case 'RINGBEARER':
    case 'STEAL': {
      if (target) {
        trackCombatStrike(actor_name, target_name, 'STEAL');
        const stolenAmount = Math.min(2, Math.max(0, target.runes));
        await supabase
          .from('players')
          .update({ runes: target.runes - stolenAmount })
          .eq('id', target.id);
        await supabase
          .from('players')
          .update({ runes: actor.runes + stolenAmount })
          .eq('id', actor.id);
        await addGameLog(
          roomId,
          actor_name,
          'ACTION',
          `💍 ${actor_name} usou o Manto Élfico e roubou ${stolenAmount} Runas de ${target_name}!`
        );
      }
      await advanceTurn(roomId);
      break;
    }

    case 'DEMIGOD':
    case 'ASSASSINATE': {
      if (target) {
        trackCombatStrike(actor_name, target_name, 'ASSASSINATE');
        await addGameLog(
          roomId,
          actor_name,
          'ACTION',
          `⚡ O raio da Fúria Olímpica de ${actor_name} atingiu ${target_name}!`
        );
        await forcePlayerLoseCard(roomId, target.id);
      }
      await advanceTurn(roomId);
      break;
    }

    case 'DARK_LORD':
    case 'DARK_DRAIN': {
      // Drenagem Sombria: drena 1 runa de cada outro jogador vivo na mesa
      const { data: otherPlayers } = await supabase
        .from('players')
        .select('*')
        .eq('room_id', roomId)
        .eq('is_alive', true)
        .neq('id', actor.id);

      let totalDrained = 0;
      if (otherPlayers && otherPlayers.length > 0) {
        for (const op of otherPlayers) {
          if (op.runes > 0) {
            await supabase
              .from('players')
              .update({ runes: op.runes - 1 })
              .eq('id', op.id);
            totalDrained += 1;
          }
        }
      }

      await supabase
        .from('players')
        .update({ runes: actor.runes + totalDrained })
        .eq('id', actor.id);

      await addGameLog(
        roomId,
        actor_name,
        'ACTION',
        `👁️ ${actor_name} conjurou a Drenagem Sombria e extorquiu ${totalDrained} Runas dos outros jogadores!`
      );
      await advanceTurn(roomId);
      break;
    }

    case 'ORACLE':
    case 'DIVINATION': {
      if (target) {
        // Ator ganha 1 runa
        await supabase
          .from('players')
          .update({ runes: actor.runes + 1 })
          .eq('id', actor.id);

        // Busca 1 carta oculta do alvo
        const { data: targetCards } = await supabase
          .from('player_hands')
          .select('*')
          .eq('room_id', roomId)
          .eq('player_id', target.id)
          .eq('is_revealed', false);

        if (targetCards && targetCards.length > 0) {
          const spiedCard = targetCards[Math.floor(Math.random() * targetCards.length)];
          // Salva no pending_action a carta espiada apenas para leitura do ator
          await supabase
            .from('rooms')
            .update({
              pending_action: {
                ...room.pending_action,
                spied_card: spiedCard.card_code,
              },
            })
            .eq('id', roomId);

          await addGameLog(
            roomId,
            actor_name,
            'ACTION',
            `🔮 ${actor_name} contemplou as névoas da profecia e vislumbrou a alma de ${target_name} (+1 Runa).`
          );
        }
      }
      // Não passa de imediato para o ator poder ver no modal e clicar em "Concluir Visão"
      break;
    }

    case 'ARCHMAGE':
    case 'ARCHMAGE_EXCHANGE': {
      // Compra 2 cartas do deck
      const deck = Array.isArray(room.deck) ? [...room.deck] : [];
      if (deck.length >= 2) {
        const drawn1 = deck.pop();
        const drawn2 = deck.pop();

        await supabase
          .from('rooms')
          .update({
            deck,
            pending_action: {
              ...room.pending_action,
              exchange_drawn: [drawn1, drawn2],
            },
          })
          .eq('id', roomId);

        await addGameLog(
          roomId,
          actor_name,
          'ACTION',
          `🧙‍♂️ ${actor_name} canalizou a Transfiguração e invocou novos conhecimentos do grimório.`
        );
      } else {
        await addGameLog(roomId, actor_name, 'ACTION', `O grimório não possui cartas suficientes para transfiguração.`);
        await advanceTurn(roomId);
      }
      break;
    }

    default:
      await advanceTurn(roomId);
      break;
  }
};

// Finaliza a troca de cartas do Arquimago
export const completeArchmageExchange = async (roomId, playerId, keptCards, returnedCards) => {
  const { data: room } = await supabase.from('rooms').select('*').eq('id', roomId).single();
  if (!room) return;

  const currentDeck = Array.isArray(room.deck) ? [...room.deck] : [];
  // Adiciona as devolvidas ao fundo do deck
  const newDeck = [...returnedCards, ...currentDeck];

  // Atualiza as cartas ocultas do jogador
  const { data: hands } = await supabase
    .from('player_hands')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .eq('is_revealed', false)
    .order('slot_index', { ascending: true });

  if (hands) {
    for (let i = 0; i < hands.length; i++) {
      if (keptCards[i]) {
        await supabase
          .from('player_hands')
          .update({ card_code: keptCards[i] })
          .eq('id', hands[i].id);
      }
    }
  }

  await supabase
    .from('rooms')
    .update({
      deck: newDeck,
      pending_action: null,
    })
    .eq('id', roomId);

  await advanceTurn(roomId);
};

// Faz um jogador perder 1 carta oculta
export const forcePlayerLoseCard = async (roomId, playerId, chosenHandId = null) => {
  const { data: hands } = await supabase
    .from('player_hands')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .eq('is_revealed', false);

  if (!hands || hands.length === 0) return;

  // Se passou o id da carta escolhida ou se só resta 1
  let targetHand = null;
  if (chosenHandId) {
    targetHand = hands.find((h) => h.id === chosenHandId);
  }
  if (!targetHand) {
    targetHand = hands[0];
  }

  await supabase
    .from('player_hands')
    .update({ is_revealed: true })
    .eq('id', targetHand.id);

  const cardObj = getCardByCode(targetHand.card_code);
  await addGameLog(
    roomId,
    'Destino',
    'ACTION',
    `💥 A identidade [${cardObj.name}] foi irrevogavelmente revelada!`
  );

  await checkPlayerElimination(roomId, playerId);
};

// Substitui carta comprovada do jogador verdadeiro com uma nova do baralho
export const replaceProvenCard = async (roomId, playerId, cardCode) => {
  const { data: room } = await supabase.from('rooms').select('deck').eq('id', roomId).single();
  const deck = Array.isArray(room?.deck) ? [...room.deck] : [];

  // Devolve a carta ao baralho e reembaralha
  deck.push(cardCode);
  const shuffledDeck = shuffleArray(deck);
  const newCard = shuffledDeck.pop();

  // Encontra o slot da carta comprovada
  const { data: hand } = await supabase
    .from('player_hands')
    .select('*')
    .eq('room_id', roomId)
    .eq('player_id', playerId)
    .eq('card_code', cardCode)
    .eq('is_revealed', false)
    .limit(1)
    .single();

  if (hand) {
    await supabase
      .from('player_hands')
      .update({ card_code: newCard })
      .eq('id', hand.id);
  }

  await supabase
    .from('rooms')
    .update({ deck: shuffledDeck })
    .eq('id', roomId);
};
