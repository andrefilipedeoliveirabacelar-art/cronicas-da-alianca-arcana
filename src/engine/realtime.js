import { supabase } from '../lib/supabase.js';

let activeChannel = null;

/**
 * Inscreve-se nos eventos em tempo real da sala do Supabase
 * @param {string} roomId - ID da sala
 * @param {object} callbacks - Funções chamadas quando os dados mudam
 * @param {function} callbacks.onRoomChange - (room)
 * @param {function} callbacks.onPlayersChange - (players)
 * @param {function} callbacks.onHandsChange - (hands)
 * @param {function} callbacks.onLogAdded - (newLog)
 */
export const subscribeToRoom = (roomId, callbacks = {}) => {
  // Limpa canal anterior se houver
  unsubscribeFromRoom();

  if (!roomId) return null;

  const channelName = `room_realtime_${roomId}_${Date.now()}`;
  activeChannel = supabase.channel(channelName);

  // 1. Escuta mudanças na tabela 'rooms'
  activeChannel
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (callbacks.onRoomChange) {
          callbacks.onRoomChange(payload.new);
        }
      }
    )
    // 2. Escuta mudanças na tabela 'players'
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'players',
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        if (callbacks.onPlayersChange) {
          // Busca todos os jogadores atualizados da sala
          const { data: players } = await supabase
            .from('players')
            .select('*')
            .eq('room_id', roomId)
            .order('seat_order', { ascending: true });

          if (players) callbacks.onPlayersChange(players);
        }
      }
    )
    // 3. Escuta mudanças na tabela 'player_hands'
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'player_hands',
        filter: `room_id=eq.${roomId}`,
      },
      async () => {
        if (callbacks.onHandsChange) {
          const { data: hands } = await supabase
            .from('player_hands')
            .select('*')
            .eq('room_id', roomId);

          if (hands) callbacks.onHandsChange(hands);
        }
      }
    )
    // 4. Escuta novos registros na tabela 'game_logs'
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'game_logs',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (callbacks.onLogAdded && payload.new) {
          callbacks.onLogAdded(payload.new);
        }
      }
    );

  activeChannel.subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log(`[Realtime] Conectado ao santuário arcano da sala: ${roomId}`);
    } else if (status === 'CHANNEL_ERROR') {
      console.error('[Realtime] Erro de canal realtime:', err);
    }
  });

  return activeChannel;
};

export const unsubscribeFromRoom = () => {
  if (activeChannel) {
    try {
      supabase.removeChannel(activeChannel);
    } catch (err) {
      console.warn('[Realtime] Aviso ao desconectar canal:', err);
    }
    activeChannel = null;
  }
};
