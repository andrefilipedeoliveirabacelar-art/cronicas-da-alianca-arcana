import confetti from 'canvas-confetti';
import { supabase, getSupabaseConfig, saveRuntimeCredentials, hasValidCredentials } from './lib/supabase.js';
import {
  createRoom,
  joinRoom,
  startGame,
  rematchGame,
  actCollect1,
  actEpicStrike,
  declareAction,
  callBluff,
  acceptAction,
  declareBlock,
  advanceTurn,
  completeArchmageExchange,
  forcePlayerLoseCard,
  getCardByCode,
  CARD_CATALOG,
} from './engine/gameLogic.js';
import { subscribeToRoom, unsubscribeFromRoom, broadcastEmote } from './engine/realtime.js';
import { soundManager } from './lib/soundFX.js';
import { addBotToRoom, isPlayerBot, botAI } from './engine/botAI.js';
import {
  renderLocalCardHTML,
  renderOpponentsHTML,
  renderActionBarHTML,
  renderCenterAltarHTML,
  renderLogsHTML,
  renderRulesModalHTML,
  renderRankingModalHTML,
  renderQuickCheatDrawerHTML,
  getAvatarIcon,
} from './ui/renderMesa.js';
import {
  fetchLeaderboard,
  getOrCreatePlayerStats,
  resetAllRankings,
} from './engine/statsService.js';

// ESTADO GLOBAL DA APLICAÇÃO
const state = {
  currentRoom: null,
  currentPlayer: null,
  currentPlayers: [],
  currentHands: [],
  currentLogs: [],
  selectedAvatar: 'mago',
  isSelectingTarget: false,
  pendingTargetCallback: null,
  selectingActionLabel: '',
  exchangeSelectedCards: [],
  rankingActiveTab: 'leaderboard',
};

// ELEMENTOS DOM
const DOM = {
  // Telas
  screenLobby: document.getElementById('screen-lobby'),
  screenMesa: document.getElementById('screen-mesa'),

  // Header Controles
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  btnQuickCheat: document.getElementById('btn-quick-cheat'),
  drawerQuickCheat: document.getElementById('drawer-quick-cheat'),
  btnCloseQuickCheat: document.getElementById('btn-close-quick-cheat'),
  quickCheatContent: document.getElementById('quick-cheat-content'),

  // Lobby
  inputNickname: document.getElementById('input-nickname'),
  inputRoomCode: document.getElementById('input-room-code'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  avatarSelector: document.getElementById('avatar-selector'),
  lobbyFormContainer: document.getElementById('lobby-form-container'),
  lobbyWaitingContainer: document.getElementById('lobby-waiting-container'),
  displayRoomCode: document.getElementById('display-room-code'),
  btnCopyCode: document.getElementById('btn-copy-code'),
  copyBtnText: document.getElementById('copy-btn-text'),
  playerCountBadge: document.getElementById('player-count-badge'),
  lobbyPlayersList: document.getElementById('lobby-players-list'),
  hostStartContainer: document.getElementById('host-start-container'),
  btnAddBot: document.getElementById('btn-add-bot'),
  btnStartGame: document.getElementById('btn-start-game'),
  guestWaitingText: document.getElementById('guest-waiting-text'),
  btnLeaveLobby: document.getElementById('btn-leave-lobby'),
  lobbySupabaseNotice: document.getElementById('lobby-supabase-notice'),
  btnFixCredentials: document.getElementById('btn-fix-credentials'),

  // Mesa
  mesaRoomCode: document.getElementById('mesa-room-code'),
  mesaPhaseIndicator: document.getElementById('mesa-phase-indicator'),
  bannerTargetSelection: document.getElementById('banner-target-selection'),
  targetSelectionText: document.getElementById('target-selection-text'),
  btnCancelTargetSelection: document.getElementById('btn-cancel-target-selection'),
  mesaOpponentsContainer: document.getElementById('mesa-opponents-container'),
  mesaAltarContainer: document.getElementById('mesa-altar-container'),
  localPlayerAvatar: document.getElementById('local-player-avatar'),
  localPlayerName: document.getElementById('local-player-name'),
  localTurnBadge: document.getElementById('local-turn-badge'),
  localPlayerRunes: document.getElementById('local-player-runes'),
  localPlayerStatus: document.getElementById('local-player-status'),
  localPlayerCards: document.getElementById('local-player-cards'),
  mesaActionBarContainer: document.getElementById('mesa-action-bar-container'),
  mesaLogsContainer: document.getElementById('mesa-logs-container'),

  // Modais
  modalRules: document.getElementById('modal-rules'),
  rulesContent: document.getElementById('rules-content'),
  btnOpenRules: document.getElementById('btn-open-rules'),
  btnCloseRules: document.getElementById('btn-close-rules'),
  btnCloseRulesBottom: document.getElementById('btn-close-rules-bottom'),

  modalRanking: document.getElementById('modal-ranking'),
  rankingContent: document.getElementById('ranking-content'),
  btnOpenRanking: document.getElementById('btn-open-ranking'),
  btnCloseRanking: document.getElementById('btn-close-ranking'),
  btnCloseRankingBottom: document.getElementById('btn-close-ranking-bottom'),

  modalTarget: document.getElementById('modal-target-selector'),
  targetModalIcon: document.getElementById('target-modal-icon'),
  targetModalTitle: document.getElementById('target-modal-title'),
  targetModalSubtitle: document.getElementById('target-modal-subtitle'),
  targetSelectorList: document.getElementById('target-selector-list'),
  btnCancelTarget: document.getElementById('btn-cancel-target'),

  modalSacrifice: document.getElementById('modal-sacrifice'),
  sacrificeCardChoices: document.getElementById('sacrifice-card-choices'),

  modalExchange: document.getElementById('modal-exchange'),
  exchangeCardsContainer: document.getElementById('exchange-cards-container'),
  exchangeSelectionCount: document.getElementById('exchange-selection-count'),
  btnConfirmExchange: document.getElementById('btn-confirm-exchange'),

  modalOracle: document.getElementById('modal-oracle-spy'),
  oracleSpiedCardDisplay: document.getElementById('oracle-spied-card-display'),
  btnCloseOracle: document.getElementById('btn-close-oracle'),

  modalVictory: document.getElementById('modal-victory'),
  victoryPlayerName: document.getElementById('victory-player-name'),
  btnRematchSameRoom: document.getElementById('btn-rematch-same-room'),
  btnReturnLobby: document.getElementById('btn-return-lobby'),

  modalDbConfig: document.getElementById('modal-supabase-config'),
  btnOpenDbConfig: document.getElementById('btn-open-db-config'),
  btnCloseDbConfig: document.getElementById('btn-close-db-config'),
  cfgSupabaseUrl: document.getElementById('cfg-supabase-url'),
  cfgSupabaseKey: document.getElementById('cfg-supabase-key'),
  btnSaveDbConfig: document.getElementById('btn-save-db-config'),
};

// ==========================================
// PERSISTÊNCIA DE SESSÃO
// ==========================================
const saveSession = (roomId, playerId) => {
  if (roomId) sessionStorage.setItem('ARCANUM_ROOM_ID', roomId);
  if (playerId) sessionStorage.setItem('ARCANUM_PLAYER_ID', playerId);
};

const clearSession = () => {
  sessionStorage.removeItem('ARCANUM_ROOM_ID');
  sessionStorage.removeItem('ARCANUM_PLAYER_ID');
};

const getSavedSession = () => {
  return {
    roomId: sessionStorage.getItem('ARCANUM_ROOM_ID'),
    playerId: sessionStorage.getItem('ARCANUM_PLAYER_ID'),
  };
};

// ==========================================
// NOTIFICAÇÕES TOAST VISUAIS
// ==========================================
const showToast = (message, type = 'info') => {
  const toast = document.createElement('div');
  const bgColors = {
    info: 'bg-purple-900/90 border-purple-500 text-purple-200',
    success: 'bg-emerald-900/90 border-emerald-500 text-emerald-200',
    warning: 'bg-amber-900/90 border-amber-500 text-amber-200',
    error: 'bg-red-900/90 border-red-500 text-red-200',
  };

  toast.className = `fixed bottom-4 right-4 z-50 max-w-sm px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md text-xs sm:text-sm font-medium transition-all duration-300 transform translate-y-10 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `<div class="flex items-center gap-2"><span>✨</span><span>${message}</span></div>`;

  document.body.appendChild(toast);

  // Anima entrada
  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// ==========================================
// RECONEXÃO AUTOMÁTICA
// ==========================================
const checkAutoReconnect = async () => {
  const { roomId, playerId } = getSavedSession();
  if (!roomId || !playerId) return;

  try {
    const { data: room, error: roomError } = await supabase.from('rooms').select('*').eq('id', roomId).single();
    if (roomError || !room) {
      clearSession();
      return;
    }

    const { data: player, error: playerError } = await supabase.from('players').select('*').eq('id', playerId).single();
    if (playerError || !player) {
      clearSession();
      return;
    }

    state.currentRoom = room;
    state.currentPlayer = player;

    await loadInitialRoomData(room.id);
    attachRealtimeListeners(room.id);

    if (room.status === 'playing') {
      showMesaScreen();
    } else {
      showLobbyWaitingScreen();
    }

    showToast(`Bem-vindo de volta à Aliança Arcana, ${player.nickname}!`, 'success');
  } catch (err) {
    console.error('Falha na reconexão automática:', err);
    clearSession();
  }
};

// Carrega dados iniciais da sala
const loadInitialRoomData = async (roomId) => {
  const [{ data: players }, { data: hands }, { data: logs }] = await Promise.all([
    supabase.from('players').select('*').eq('room_id', roomId).order('seat_order', { ascending: true }),
    supabase.from('player_hands').select('*').eq('room_id', roomId),
    supabase.from('game_logs').select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
  ]);

  state.currentPlayers = players || [];
  state.currentHands = hands || [];
  state.currentLogs = logs || [];

  updateMesaUI();
  updateLobbyUI();
};

// ==========================================
// TOAST ÉPICO CENTRAL & BALÕES DE FALA
// ==========================================
let toastTimer = null;
const showEpicActionToast = (message, type = 'info', shake = false) => {
  const toast = document.getElementById('epic-action-toast');
  const text = document.getElementById('epic-action-toast-text');
  if (!toast || !text) return;

  text.innerHTML = message;
  toast.classList.remove('hidden');

  if (shake) {
    DOM.screenMesa.classList.add('animate-shake');
    setTimeout(() => {
      DOM.screenMesa.classList.remove('animate-shake');
    }, 600);
  }

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
    toastTimer = null;
  }, 3500);
};

const showSpeechBubble = (playerId, text) => {
  const bubble = document.getElementById(`speech-bubble-${playerId}`);
  if (bubble) {
    bubble.textContent = text;
    bubble.classList.remove('hidden');
    soundManager.playEmotePop();

    clearTimeout(bubble._timer);
    bubble._timer = setTimeout(() => {
      bubble.classList.add('hidden');
    }, 3500);
  }
};

let lastLocalRunes = null;

// ==========================================
// INSCRIÇÃO EM TEMPO REAL
// ==========================================
const attachRealtimeListeners = (roomId) => {
  subscribeToRoom(roomId, {
    onRoomChange: (newRoom) => {
      state.currentRoom = newRoom;

      // Mudança de status para playing -> muda para Mesa
      if (newRoom.status === 'playing' && DOM.screenMesa.classList.contains('hidden')) {
        showMesaScreen();
      }

      // Mudança de status para finished -> dispara vitória
      if (newRoom.status === 'finished') {
        triggerVictoryScreen(newRoom.winner_player_id);
      }

      updateMesaUI();
    },

    onPlayersChange: (newPlayers) => {
      state.currentPlayers = newPlayers;
      if (state.currentPlayer) {
        const updatedSelf = newPlayers.find((p) => p.id === state.currentPlayer.id);
        if (updatedSelf) {
          if (lastLocalRunes !== null && updatedSelf.runes > lastLocalRunes) {
            soundManager.playRuneGain();
          }
          lastLocalRunes = updatedSelf.runes;
          state.currentPlayer = updatedSelf;
        }
      }
      updateLobbyUI();
      updateMesaUI();
    },

    onHandsChange: (newHands) => {
      state.currentHands = newHands;
      updateMesaUI();
    },

    onLogAdded: (newLog) => {
      state.currentLogs.push(newLog);
      renderLogItem(newLog);

      // Feedback Épico e Sons com base no evento
      const msg = newLog.message || '';
      if (newLog.event_type === 'BLUFF_CALL') {
        const isLoss = msg.includes('PEGO NO BLEFE') || msg.includes('falhou no julgamento');
        if (isLoss) {
          soundManager.playCardLoss();
          showEpicActionToast(msg, 'bluff', true);
        } else {
          showEpicActionToast(msg, 'bluff', false);
        }
      } else if (newLog.event_type === 'ELIMINATED') {
        soundManager.playCardLoss();
        showEpicActionToast(msg, 'eliminated', true);
      } else if (newLog.event_type === 'ACTION' && (msg.includes('GOLPE ÉPICO') || msg.includes('Fúria Olímpica'))) {
        soundManager.playCardLoss();
        showEpicActionToast(msg, 'strike', true);
      } else if (newLog.event_type === 'ACTION' || newLog.event_type === 'BLOCK') {
        showEpicActionToast(msg, 'action', false);
      }
    },

    onEmoteReceived: ({ playerId, emoteText }) => {
      showSpeechBubble(playerId, emoteText);
    },
  });
};

// ==========================================
// CONTROLE DE TELAS
// ==========================================
const showLobbyForm = () => {
  DOM.screenLobby.classList.remove('hidden');
  DOM.screenMesa.classList.add('hidden');
  DOM.lobbyFormContainer.classList.remove('hidden');
  DOM.lobbyWaitingContainer.classList.add('hidden');
};

const showLobbyWaitingScreen = () => {
  DOM.screenLobby.classList.remove('hidden');
  DOM.screenMesa.classList.add('hidden');
  DOM.lobbyFormContainer.classList.add('hidden');
  DOM.lobbyWaitingContainer.classList.remove('hidden');
  updateLobbyUI();
};

const showMesaScreen = () => {
  DOM.screenLobby.classList.add('hidden');
  DOM.screenMesa.classList.remove('hidden');
  updateMesaUI();
};

// ==========================================
// ATUALIZAÇÃO DA INTERFACE DO LOBBY
// ==========================================
const updateLobbyUI = () => {
  if (!state.currentRoom) return;

  DOM.displayRoomCode.textContent = state.currentRoom.code;
  DOM.playerCountBadge.textContent = `${state.currentPlayers.length} / 5 Guerreiros (2 a 5 Heróis)`;

  // Lista de jogadores no Lobby
  DOM.lobbyPlayersList.innerHTML = state.currentPlayers
    .map((p) => `
      <div class="flex items-center justify-between p-2.5 rounded-xl border ${
        p.id === state.currentPlayer?.id ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-900/80'
      }">
        <div class="flex items-center gap-2">
          <span class="text-xl">${getAvatarIcon(p.avatar_theme)}</span>
          <span class="font-title text-xs font-bold text-slate-200">
            ${p.nickname} ${p.id === state.currentPlayer?.id ? '(Você)' : ''}
          </span>
        </div>
        ${p.is_host ? `
          <span class="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-title text-[9px] font-bold uppercase">
            👑 Soberano
          </span>
        ` : `
          <span class="text-[10px] text-slate-400 font-medium">Pronto</span>
        `}
      </div>
    `)
    .join('');

  // Botão de Iniciar Partida (apenas para o Host)
  const isHost = state.currentPlayer?.is_host;
  const canStart = state.currentPlayers.length >= 2;

  if (isHost) {
    DOM.hostStartContainer.classList.remove('hidden');
    DOM.guestWaitingText.classList.add('hidden');
    DOM.btnStartGame.disabled = !canStart;
    if (canStart) {
      DOM.btnStartGame.classList.remove('opacity-40', 'cursor-not-allowed');
    } else {
      DOM.btnStartGame.classList.add('opacity-40', 'cursor-not-allowed');
    }
  } else {
    DOM.hostStartContainer.classList.add('hidden');
    DOM.guestWaitingText.classList.remove('hidden');
  }
};

// ==========================================
// ATUALIZAÇÃO DA INTERFACE DA MESA DE JOGO
// ==========================================
const updateMesaUI = () => {
  if (!state.currentRoom || !state.currentPlayer) return;

  const room = state.currentRoom;
  const myId = state.currentPlayer.id;
  const isMyTurn = room.current_turn_player_id === myId;

  // Informações superiores
  DOM.mesaRoomCode.textContent = room.code;
  DOM.mesaPhaseIndicator.textContent = `Fase: ${room.turn_phase.replace('_', ' ').toUpperCase()}`;

  // Oponentes (com suporte a seleção direta na mesa)
  DOM.mesaOpponentsContainer.innerHTML = renderOpponentsHTML(
    state.currentPlayers,
    state.currentHands,
    room.current_turn_player_id,
    myId,
    state.isSelectingTarget,
    state.selectingActionLabel
  );
  attachOpponentsTargetEvents();

  // Altar Central (Ações, Contestações e Bloqueios)
  DOM.mesaAltarContainer.innerHTML = renderCenterAltarHTML(room, myId, state.currentPlayers);
  attachAltarEventListeners();

  // Gerenciamento dos Temporizadores Anti-Trava
  if (room.status === 'playing') {
    if (room.turn_phase === 'action') {
      stopReactionTimer();
      startActionTimer();
    } else if (room.turn_phase === 'challenge_window' || room.turn_phase === 'block_window') {
      stopActionTimer();
      const rKey = `${room.turn_phase}_${room.pending_action?.actor_id}_${room.pending_action?.action_code}_${room.pending_action?.blocked_by_id || ''}`;
      startReactionTimer(rKey);
    } else {
      stopActionTimer();
      stopReactionTimer();
    }
  } else {
    stopActionTimer();
    stopReactionTimer();
  }

  // Avaliação da Inteligência Artificial dos Bots
  botAI.evaluate({
    room,
    players: state.currentPlayers,
    hands: state.currentHands,
    isHost: state.currentPlayer?.is_host,
  });

  // Reino do Jogador Local
  DOM.localPlayerAvatar.textContent = getAvatarIcon(state.currentPlayer.avatar_theme);
  DOM.localPlayerName.textContent = state.currentPlayer.nickname;
  DOM.localPlayerRunes.textContent = state.currentPlayer.runes;

  if (isMyTurn && room.status === 'playing') {
    DOM.localTurnBadge.classList.remove('hidden');
  } else {
    DOM.localTurnBadge.classList.add('hidden');
  }

  if (state.currentPlayer.is_alive) {
    DOM.localPlayerStatus.className = 'text-emerald-400 font-semibold text-[11px]';
    DOM.localPlayerStatus.textContent = '● Em Combate';
  } else {
    DOM.localPlayerStatus.className = 'text-red-500 font-bold text-[11px]';
    DOM.localPlayerStatus.textContent = '💀 Eliminado';
  }

  // Cartas do Jogador Local
  const myHands = state.currentHands
    .filter((h) => h.player_id === myId)
    .sort((a, b) => a.slot_index - b.slot_index);

  DOM.localPlayerCards.innerHTML = myHands.map((h) => renderLocalCardHTML(h, isMyTurn)).join('');

  // Barra de Ações do Turno
  DOM.mesaActionBarContainer.innerHTML = renderActionBarHTML(
    state.currentPlayer,
    isMyTurn,
    room.turn_phase,
    room.pending_action,
    state.currentPlayers
  );
  attachActionBarEventListeners();

  // Logs
  DOM.mesaLogsContainer.innerHTML = renderLogsHTML(state.currentLogs);
  DOM.mesaLogsContainer.scrollTop = DOM.mesaLogsContainer.scrollHeight;

  // Checa Modais Especiais (Perda de carta, Transfiguração do Arquimago, Oráculo)
  checkSpecialInteractiveModals();
};

const renderLogItem = (log) => {
  DOM.mesaLogsContainer.innerHTML = renderLogsHTML(state.currentLogs);
  DOM.mesaLogsContainer.scrollTop = DOM.mesaLogsContainer.scrollHeight;
};

// ==========================================
// GERENCIADOR DE TEMPORIZADORES ANTI-TRAVA
// ==========================================
let actionTimerInterval = null;
let actionTimeRemaining = 25;

let reactionTimerInterval = null;
let reactionTimeRemaining = 10;
let lastReactionKey = null;

const startActionTimer = () => {
  stopActionTimer();
  actionTimeRemaining = 25;

  const updateBar = () => {
    const bar = document.getElementById('action-timer-bar');
    const text = document.getElementById('action-timer-seconds');
    if (bar) bar.style.width = `${(actionTimeRemaining / 25) * 100}%`;
    if (text) text.textContent = `${actionTimeRemaining}s`;
  };

  updateBar();

  actionTimerInterval = setInterval(async () => {
    actionTimeRemaining -= 1;
    updateBar();

    if (actionTimeRemaining <= 5 && actionTimeRemaining > 0) {
      soundManager.playTimerTick();
    }

    if (actionTimeRemaining <= 0) {
      stopActionTimer();
      // Anti-trava: se for meu turno, executa ação padrão de +1 runa
      const isMyTurn = state.currentRoom?.current_turn_player_id === state.currentPlayer?.id;
      const isHost = state.currentPlayer?.is_host;
      const currentTurnPlayer = state.currentPlayers.find((p) => p.id === state.currentRoom?.current_turn_player_id);
      const isTurnPlayerBot = isPlayerBot(currentTurnPlayer);

      if (isMyTurn && state.currentPlayer?.is_alive) {
        showToast('Tempo esgotado! Coletando +1 Runa automaticamente.', 'warning');
        try {
          await actCollect1(state.currentRoom.id, state.currentPlayer);
        } catch (e) {
          console.error(e);
        }
      } else if (isHost && isTurnPlayerBot && currentTurnPlayer?.is_alive) {
        try {
          await actCollect1(state.currentRoom.id, currentTurnPlayer);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, 1000);
};

const stopActionTimer = () => {
  if (actionTimerInterval) {
    clearInterval(actionTimerInterval);
    actionTimerInterval = null;
  }
};

const startReactionTimer = (key) => {
  if (lastReactionKey === key && reactionTimerInterval) return;
  stopReactionTimer();
  lastReactionKey = key;
  reactionTimeRemaining = 10;
  soundManager.playAlertTension();

  const updateBar = () => {
    const bar = document.getElementById('reaction-timer-bar');
    const text = document.getElementById('reaction-timer-seconds');
    if (bar) bar.style.width = `${(reactionTimeRemaining / 10) * 100}%`;
    if (text) text.textContent = `${reactionTimeRemaining}s`;
  };

  updateBar();

  reactionTimerInterval = setInterval(async () => {
    reactionTimeRemaining -= 1;
    updateBar();

    if (reactionTimeRemaining <= 5 && reactionTimeRemaining > 0) {
      soundManager.playTimerTick();
    }

    if (reactionTimeRemaining <= 0) {
      stopReactionTimer();
      // Anti-trava: o Host da sala resolve automaticamente aceitando/passando a ação
      const isHost = state.currentPlayer?.is_host;
      if (isHost && state.currentRoom && (state.currentRoom.turn_phase === 'challenge_window' || state.currentRoom.turn_phase === 'block_window')) {
        try {
          await acceptAction(state.currentRoom.id, state.currentPlayer);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, 1000);
};

const stopReactionTimer = () => {
  if (reactionTimerInterval) {
    clearInterval(reactionTimerInterval);
    reactionTimerInterval = null;
  }
};

// ==========================================
// SELEÇÃO DIRETA DE ALVO NA MESA (ZERO MODAIS)
// ==========================================
const startDirectTargetSelection = ({ actionLabel, onSelect }) => {
  const validTargets = state.currentPlayers.filter(
    (p) => p.id !== state.currentPlayer.id && p.is_alive
  );

  if (validTargets.length === 0) {
    showToast('Não há oponentes vivos disponíveis para alvejar!', 'warning');
    return;
  }

  state.isSelectingTarget = true;
  state.pendingTargetCallback = onSelect;
  state.selectingActionLabel = actionLabel;

  DOM.targetSelectionText.textContent = `🎯 Selecione um oponente na mesa para aplicar ${actionLabel}`;
  DOM.bannerTargetSelection.classList.remove('hidden');

  DOM.mesaOpponentsContainer.innerHTML = renderOpponentsHTML(
    state.currentPlayers,
    state.currentHands,
    state.currentRoom.current_turn_player_id,
    state.currentPlayer.id,
    true,
    actionLabel
  );
  attachOpponentsTargetEvents();
};

const cancelDirectTargetSelection = () => {
  state.isSelectingTarget = false;
  state.pendingTargetCallback = null;
  state.selectingActionLabel = '';
  DOM.bannerTargetSelection.classList.add('hidden');

  DOM.mesaOpponentsContainer.innerHTML = renderOpponentsHTML(
    state.currentPlayers,
    state.currentHands,
    state.currentRoom.current_turn_player_id,
    state.currentPlayer.id,
    false
  );
  attachOpponentsTargetEvents();
};

const attachOpponentsTargetEvents = () => {
  const opponentSlots = DOM.mesaOpponentsContainer.querySelectorAll('[data-target-player-id]');
  opponentSlots.forEach((slot) => {
    slot.onclick = async () => {
      if (!state.isSelectingTarget || !state.pendingTargetCallback) return;

      const targetId = slot.getAttribute('data-target-player-id');
      const target = state.currentPlayers.find((p) => p.id === targetId);

      if (target && target.is_alive) {
        const callback = state.pendingTargetCallback;
        cancelDirectTargetSelection();
        try {
          await callback(target);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    };
  });
};

if (DOM.btnCancelTargetSelection) {
  DOM.btnCancelTargetSelection.onclick = cancelDirectTargetSelection;
}

// ==========================================
// EVENT LISTENERS DO ALTAR CENTRAL
// ==========================================
const attachAltarEventListeners = () => {
  // Botão Gritar Mentira!
  const btnCallBluff = document.getElementById('btn-call-bluff');
  if (btnCallBluff) {
    btnCallBluff.onclick = async () => {
      try {
        await callBluff(state.currentRoom.id, state.currentPlayer);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // Botão Aceitar / Passar
  const btnAcceptAction = document.getElementById('btn-accept-action');
  if (btnAcceptAction) {
    btnAcceptAction.onclick = async () => {
      try {
        await acceptAction(state.currentRoom.id, state.currentPlayer);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // Botões de Declaração de Bloqueio
  const blockButtons = document.querySelectorAll('.btn-declare-block');
  blockButtons.forEach((btn) => {
    btn.onclick = async () => {
      const blockCode = btn.getAttribute('data-block-code');
      try {
        await declareBlock(state.currentRoom.id, state.currentPlayer, blockCode);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });

  // Botão Não Bloquear
  const btnPassBlock = document.getElementById('btn-pass-block');
  if (btnPassBlock) {
    btnPassBlock.onclick = async () => {
      try {
        await acceptAction(state.currentRoom.id, state.currentPlayer);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }
};

// ==========================================
// EVENT LISTENERS DA BARRA DE AÇÕES
// ==========================================
const attachActionBarEventListeners = () => {
  const roomId = state.currentRoom?.id;
  const player = state.currentPlayer;

  // 1. Coletar 1 Runa
  const btnCollect1 = document.getElementById('btn-act-collect-1');
  if (btnCollect1) {
    btnCollect1.onclick = async () => {
      try {
        await actCollect1(roomId, player);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // 2. Ajuda da Guilda
  const btnGuildAid = document.getElementById('btn-act-guild-aid');
  if (btnGuildAid) {
    btnGuildAid.onclick = async () => {
      try {
        await declareAction(roomId, player, 'GUILD_AID');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // 3. Golpe Épico (-7 Runas) -> Seleção Direta na Mesa
  const btnEpicStrike = document.getElementById('btn-act-epic-strike');
  if (btnEpicStrike) {
    btnEpicStrike.onclick = () => {
      startDirectTargetSelection({
        actionLabel: 'Golpe Épico (-7💎)',
        onSelect: async (target) => {
          await actEpicStrike(roomId, player, target);
        },
      });
    };
  }

  // 4. Transfiguração (Arquimago)
  const btnArchmage = document.getElementById('btn-act-archmage');
  if (btnArchmage) {
    btnArchmage.onclick = async () => {
      try {
        await declareAction(roomId, player, 'ARCHMAGE_EXCHANGE');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // 5. Manto Élfico / Roubar (Portador do Anel) -> Seleção Direta na Mesa
  const btnSteal = document.getElementById('btn-act-steal');
  if (btnSteal) {
    btnSteal.onclick = () => {
      startDirectTargetSelection({
        actionLabel: 'Manto Élfico (Roubo)',
        onSelect: async (target) => {
          await declareAction(roomId, player, 'STEAL', target);
        },
      });
    };
  }

  // 6. Fúria Olímpica / Assassinar (Semideus) -> Seleção Direta na Mesa
  const btnAssassinate = document.getElementById('btn-act-assassinate');
  if (btnAssassinate) {
    btnAssassinate.onclick = () => {
      startDirectTargetSelection({
        actionLabel: 'Fúria Olímpica (-3💎)',
        onSelect: async (target) => {
          await declareAction(roomId, player, 'ASSASSINATE', target);
        },
      });
    };
  }

  // 7. Pilhagem de Smaug (Caçador de Dragões)
  const btnDragon = document.getElementById('btn-act-dragonslayer');
  if (btnDragon) {
    btnDragon.onclick = async () => {
      try {
        await declareAction(roomId, player, 'TAX_TREASURY');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // 8. Voto Perpétuo (Guardião das Relíquias)
  const btnRelic = document.getElementById('btn-act-relic');
  if (btnRelic) {
    btnRelic.onclick = async () => {
      try {
        await declareAction(roomId, player, 'PERPETUAL_VOW');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }

  // 9. Profecia Arcana (Oráculo) -> Seleção Direta na Mesa
  const btnOracle = document.getElementById('btn-act-oracle');
  if (btnOracle) {
    btnOracle.onclick = () => {
      startDirectTargetSelection({
        actionLabel: 'Profecia Arcana (Espiar)',
        onSelect: async (target) => {
          await declareAction(roomId, player, 'DIVINATION', target);
        },
      });
    };
  }

  // 10. Drenagem Sombria (Lorde das Sombras)
  const btnDarkLord = document.getElementById('btn-act-darklord');
  if (btnDarkLord) {
    btnDarkLord.onclick = async () => {
      try {
        await declareAction(roomId, player, 'DARK_DRAIN');
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  }
};

// ==========================================
// MODAL DE SELEÇÃO DE ALVO
// ==========================================
const openTargetSelector = ({ title, icon, subtitle, onSelect }) => {
  DOM.targetModalTitle.textContent = title;
  DOM.targetModalIcon.textContent = icon;
  DOM.targetModalSubtitle.textContent = subtitle;

  const validTargets = state.currentPlayers.filter(
    (p) => p.id !== state.currentPlayer.id && p.is_alive
  );

  if (validTargets.length === 0) {
    showToast('Não há alvos vivos disponíveis na arena!', 'warning');
    return;
  }

  DOM.targetSelectorList.innerHTML = validTargets
    .map((target) => `
      <button
        data-target-id="${target.id}"
        class="btn-target-choice w-full flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-amber-950/40 hover:border-amber-400 text-left transition"
      >
        <div class="flex items-center gap-2">
          <span class="text-xl">${getAvatarIcon(target.avatar_theme)}</span>
          <div>
            <div class="font-title text-xs font-bold text-slate-200">${target.nickname}</div>
            <div class="text-[10px] text-slate-400">Assento ${target.seat_order}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 text-xs text-amber-300 font-semibold">
          <span>💎</span>
          <span>${target.runes}</span>
        </div>
      </button>
    `)
    .join('');

  document.querySelectorAll('.btn-target-choice').forEach((btn) => {
    btn.onclick = async () => {
      const targetId = btn.getAttribute('data-target-id');
      const target = validTargets.find((t) => t.id === targetId);
      DOM.modalTarget.classList.add('hidden');
      try {
        if (target && onSelect) await onSelect(target);
      } catch (err) {
        showToast(err.message, 'error');
      }
    };
  });

  DOM.modalTarget.classList.remove('hidden');
};

DOM.btnCancelTarget.onclick = () => {
  DOM.modalTarget.classList.add('hidden');
};

// ==========================================
// MODAIS ESPECIAIS INTERATIVOS
// ==========================================
const checkSpecialInteractiveModals = () => {
  const room = state.currentRoom;
  const myId = state.currentPlayer?.id;
  if (!room || !myId) return;

  const myHiddenHands = state.currentHands.filter(
    (h) => h.player_id === myId && !h.is_revealed
  );

  // 1. Transfiguração do Arquimago (se eu sou o ator e cartas foram compradas)
  if (
    room.pending_action &&
    room.pending_action.actor_id === myId &&
    room.pending_action.exchange_drawn &&
    room.pending_action.exchange_drawn.length > 0
  ) {
    openExchangeModal(room.pending_action.exchange_drawn, myHiddenHands);
  } else {
    DOM.modalExchange.classList.add('hidden');
  }

  // 2. Visão do Oráculo (se eu sou o ator e há uma carta espiada)
  if (
    room.pending_action &&
    room.pending_action.actor_id === myId &&
    room.pending_action.spied_card
  ) {
    openOracleSpyModal(room.pending_action.spied_card);
  } else {
    DOM.modalOracle.classList.add('hidden');
  }
};

// Modal de Troca de Cartas do Arquimago
const openExchangeModal = (drawnCards, myHiddenHands) => {
  const allAvailableCards = [
    ...myHiddenHands.map((h) => ({ id: h.id, code: h.card_code, source: 'hand' })),
    ...drawnCards.map((code, idx) => ({ id: `drawn-${idx}`, code, source: 'deck' })),
  ];

  state.exchangeSelectedCards = [];
  const neededToKeep = myHiddenHands.length;

  DOM.exchangeCardsContainer.innerHTML = allAvailableCards
    .map((cardItem, idx) => {
      const card = getCardByCode(cardItem.code);
      return `
        <button
          type="button"
          data-exchange-idx="${idx}"
          class="exchange-card-opt p-3 rounded-xl border border-slate-700 bg-slate-900 text-center flex flex-col justify-between transition hover:border-purple-400"
        >
          <div class="text-xl">${card.icon}</div>
          <div class="font-title text-xs font-bold text-amber-300 mt-1">${card.name}</div>
          <div class="text-[9px] text-slate-400">${card.universe_ref}</div>
          <span class="selection-indicator text-[10px] text-purple-400 font-bold mt-2">Toque p/ Manter</span>
        </button>
      `;
    })
    .join('');

  DOM.exchangeSelectionCount.textContent = `Selecionadas: 0 / ${neededToKeep}`;
  DOM.btnConfirmExchange.disabled = true;

  document.querySelectorAll('.exchange-card-opt').forEach((btn, idx) => {
    btn.onclick = () => {
      const cardObj = allAvailableCards[idx];
      const isSelected = state.exchangeSelectedCards.includes(cardObj);

      if (isSelected) {
        state.exchangeSelectedCards = state.exchangeSelectedCards.filter((c) => c !== cardObj);
        btn.classList.remove('border-purple-400', 'bg-purple-950/60');
        btn.querySelector('.selection-indicator').textContent = 'Toque p/ Manter';
        btn.querySelector('.selection-indicator').className = 'selection-indicator text-[10px] text-purple-400 font-bold mt-2';
      } else {
        if (state.exchangeSelectedCards.length >= neededToKeep) {
          showToast(`Você deve selecionar exatamente ${neededToKeep} cartas para manter!`, 'warning');
          return;
        }
        state.exchangeSelectedCards.push(cardObj);
        btn.classList.add('border-purple-400', 'bg-purple-950/60');
        btn.querySelector('.selection-indicator').textContent = '✓ MANTIDA';
        btn.querySelector('.selection-indicator').className = 'selection-indicator text-[10px] text-emerald-400 font-bold mt-2';
      }

      const count = state.exchangeSelectedCards.length;
      DOM.exchangeSelectionCount.textContent = `Selecionadas: ${count} / ${neededToKeep}`;

      if (count === neededToKeep) {
        DOM.btnConfirmExchange.disabled = false;
        DOM.btnConfirmExchange.classList.remove('opacity-40', 'cursor-not-allowed');
      } else {
        DOM.btnConfirmExchange.disabled = true;
        DOM.btnConfirmExchange.classList.add('opacity-40', 'cursor-not-allowed');
      }
    };
  });

  DOM.btnConfirmExchange.onclick = async () => {
    const keptCodes = state.exchangeSelectedCards.map((c) => c.code);
    const returnedCodes = allAvailableCards
      .filter((c) => !state.exchangeSelectedCards.includes(c))
      .map((c) => c.code);

    try {
      await completeArchmageExchange(
        state.currentRoom.id,
        state.currentPlayer.id,
        keptCodes,
        returnedCodes
      );
      DOM.modalExchange.classList.add('hidden');
      showToast('Transfiguração concluída com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  DOM.modalExchange.classList.remove('hidden');
};

// Modal de Revelação da Profecia do Oráculo
const openOracleSpyModal = (cardCode) => {
  const card = getCardByCode(cardCode);
  DOM.oracleSpiedCardDisplay.innerHTML = `
    <div class="p-4 rounded-2xl border-2 border-pink-400 bg-gradient-to-b from-pink-950 to-slate-950 text-center shadow-arcane-glow max-w-xs">
      <span class="text-3xl">${card.icon}</span>
      <div class="font-title text-base font-bold text-pink-300 mt-2">${card.name}</div>
      <div class="text-xs text-slate-400">${card.universe_ref}</div>
      <div class="text-[10px] text-slate-300 italic mt-2 p-2 bg-black/40 rounded-lg border border-slate-800">
        "${card.active_description}"
      </div>
    </div>
  `;

  DOM.btnCloseOracle.onclick = async () => {
    DOM.modalOracle.classList.add('hidden');
    // Limpa a ação pendente e passa o turno
    await advanceTurn(state.currentRoom.id);
  };

  DOM.modalOracle.classList.remove('hidden');
};

// ==========================================
// TELA DE VITÓRIA & CONFETES
// ==========================================
const triggerVictoryScreen = (winnerPlayerId) => {
  const winner = state.currentPlayers.find((p) => p.id === winnerPlayerId);
  DOM.victoryPlayerName.textContent = winner ? `${winner.nickname} Conquistou a Glória!` : 'Glória Arcana!';

  // Toca fanfarra de vitória
  soundManager.playVictoryFanfare();

  // Exibe botão de revanche apenas se for o Host
  const isHost = state.currentPlayer?.is_host;
  if (DOM.btnRematchSameRoom) {
    if (isHost) {
      DOM.btnRematchSameRoom.classList.remove('hidden');
    } else {
      DOM.btnRematchSameRoom.classList.add('hidden');
    }
  }

  DOM.modalVictory.classList.remove('hidden');

  // Chuva de confetes dourados e púrpuras
  const duration = 4 * 1000;
  const animationEnd = Date.now() + duration;

  const frame = () => {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#F59E0B', '#8B5CF6', '#10B981', '#EF4444', '#06B6D4'],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#F59E0B', '#8B5CF6', '#10B981', '#EF4444', '#06B6D4'],
    });

    if (Date.now() < animationEnd) {
      requestAnimationFrame(frame);
    }
  };
  frame();
};

// Revanche Instantânea na Mesma Sala
if (DOM.btnRematchSameRoom) {
  DOM.btnRematchSameRoom.onclick = async () => {
    if (!state.currentRoom) return;

    DOM.btnRematchSameRoom.disabled = true;
    DOM.btnRematchSameRoom.textContent = 'Embaralhando Grimório...';

    try {
      await rematchGame(state.currentRoom.id);
      DOM.modalVictory.classList.add('hidden');
      showToast('⚔️ A revanche começou! Novos grimórios foram distribuídos.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      DOM.btnRematchSameRoom.disabled = false;
      DOM.btnRematchSameRoom.textContent = '⚔️ Jogar Novamente (Mesma Sala)';
    }
  };
}

DOM.btnReturnLobby.onclick = () => {
  DOM.modalVictory.classList.add('hidden');
  clearSession();
  unsubscribeFromRoom();
  state.currentRoom = null;
  state.currentPlayer = null;
  showLobbyForm();
};

// ==========================================
// CONTROLES DO CABEÇALHO (SOM & COLA RÁPIDA)
// ==========================================
if (DOM.btnToggleSound) {
  DOM.btnToggleSound.textContent = soundManager.isMuted ? '🔇' : '🔊';
  DOM.btnToggleSound.onclick = () => {
    const isMuted = soundManager.toggleMute();
    DOM.btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
    showToast(isMuted ? 'Efeitos sonoros desativados' : 'Efeitos sonoros ativados', 'info');
  };
}

if (DOM.btnQuickCheat) {
  DOM.btnQuickCheat.onclick = () => {
    DOM.quickCheatContent.innerHTML = renderQuickCheatDrawerHTML();
    DOM.drawerQuickCheat.classList.toggle('hidden');
  };
}

if (DOM.btnCloseQuickCheat) {
  DOM.btnCloseQuickCheat.onclick = () => {
    DOM.drawerQuickCheat.classList.add('hidden');
  };
}

// ==========================================
// PROVOCAÇÕES RÁPIDAS (EMOTES)
// ==========================================
let emoteCooldown = false;
const setupEmoteButtons = () => {
  const emoteButtons = document.querySelectorAll('.btn-emote');
  emoteButtons.forEach((btn) => {
    btn.onclick = () => {
      if (emoteCooldown || !state.currentRoom || !state.currentPlayer) return;

      const emote = btn.getAttribute('data-emote');
      emoteCooldown = true;

      // Mostra sobre si mesmo localmente
      showSpeechBubble(state.currentPlayer.id, emote);

      // Transmite via Supabase Realtime broadcast
      broadcastEmote(
        state.currentRoom.id,
        state.currentPlayer.id,
        state.currentPlayer.nickname,
        emote
      );

      // Cooldown de 3 segundos
      setTimeout(() => {
        emoteCooldown = false;
      }, 3000);
    };
  });
};

// ==========================================
// EVENT LISTENERS DO LOBBY
// ==========================================

// Invocar Bot Arcano (Host)
if (DOM.btnAddBot) {
  DOM.btnAddBot.onclick = async () => {
    if (!state.currentRoom) return;

    DOM.btnAddBot.disabled = true;
    try {
      await addBotToRoom(state.currentRoom.id, state.currentPlayers);
      showToast('🤖 Bot Arcano invocado para o conclave!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      DOM.btnAddBot.disabled = false;
    }
  };
}

// Seletor de Avatar
DOM.avatarSelector.querySelectorAll('.avatar-opt').forEach((btn) => {
  btn.onclick = () => {
    DOM.avatarSelector.querySelectorAll('.avatar-opt').forEach((b) => {
      b.className = 'avatar-opt p-2 rounded-xl border border-slate-700 bg-slate-900 text-center flex flex-col items-center justify-center transition';
    });
    btn.className = 'avatar-opt p-2 rounded-xl border-2 border-amber-400 bg-amber-500/20 text-center flex flex-col items-center justify-center transition';
    state.selectedAvatar = btn.getAttribute('data-avatar');
  };
});

// Criar Sala
DOM.btnCreateRoom.onclick = async () => {
  const nickname = DOM.inputNickname.value.trim();
  if (!nickname) {
    showToast('Insira seu Nome Arcano para forjar uma aliança.', 'warning');
    DOM.inputNickname.focus();
    return;
  }

  DOM.btnCreateRoom.disabled = true;
  DOM.btnCreateRoom.textContent = 'Forjando Santuário...';

  try {
    const { room, player } = await createRoom(nickname, state.selectedAvatar);
    state.currentRoom = room;
    state.currentPlayer = player;
    state.currentPlayers = [player];

    saveSession(room.id, player.id);
    attachRealtimeListeners(room.id);
    showLobbyWaitingScreen();
    showToast(`Aliança criada com sucesso! Código: ${room.code}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    DOM.btnCreateRoom.disabled = false;
    DOM.btnCreateRoom.innerHTML = '👑 Criar Sala';
  }
};

// Entrar na Sala
DOM.btnJoinRoom.onclick = async () => {
  const nickname = DOM.inputNickname.value.trim();
  const roomCode = DOM.inputRoomCode.value.trim();

  if (!nickname) {
    showToast('Insira seu Nome Arcano primeiro.', 'warning');
    DOM.inputNickname.focus();
    return;
  }

  if (!roomCode || roomCode.length < 4) {
    showToast('Insira o código de 4 letras da sala.', 'warning');
    DOM.inputRoomCode.focus();
    return;
  }

  DOM.btnJoinRoom.disabled = true;
  DOM.btnJoinRoom.textContent = 'Entrando...';

  try {
    const { room, player } = await joinRoom(roomCode, nickname, state.selectedAvatar);
    state.currentRoom = room;
    state.currentPlayer = player;

    saveSession(room.id, player.id);
    await loadInitialRoomData(room.id);
    attachRealtimeListeners(room.id);
    showLobbyWaitingScreen();
    showToast(`Você entrou na sala ${room.code}!`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    DOM.btnJoinRoom.disabled = false;
    DOM.btnJoinRoom.textContent = 'Entrar';
  }
};

// Copiar Código da Sala
DOM.btnCopyCode.onclick = async () => {
  if (!state.currentRoom) return;
  try {
    await navigator.clipboard.writeText(state.currentRoom.code);
    DOM.copyBtnText.textContent = 'Copiado!';
    DOM.btnCopyCode.classList.add('text-emerald-400');
    setTimeout(() => {
      DOM.copyBtnText.textContent = 'Copiar';
      DOM.btnCopyCode.classList.remove('text-emerald-400');
    }, 2000);
  } catch (err) {
    showToast('Código: ' + state.currentRoom.code, 'info');
  }
};

// Iniciar Partida (Apenas Host)
DOM.btnStartGame.onclick = async () => {
  if (!state.currentRoom) return;

  DOM.btnStartGame.disabled = true;
  DOM.btnStartGame.textContent = 'Selando Grimórios...';

  try {
    await startGame(state.currentRoom.id);
    showToast('A batalha começou!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    DOM.btnStartGame.disabled = false;
    DOM.btnStartGame.innerHTML = '⚔️ Iniciar Partida (Mín. 2)';
  }
};

// Abandonar Lobby
DOM.btnLeaveLobby.onclick = () => {
  clearSession();
  unsubscribeFromRoom();
  state.currentRoom = null;
  state.currentPlayer = null;
  showLobbyForm();
};

// ==========================================
// MODAL DO GRIMÓRIO DE REGRAS
// ==========================================
DOM.btnOpenRules.onclick = () => {
  DOM.rulesContent.innerHTML = renderRulesModalHTML();
  DOM.modalRules.classList.remove('hidden');
};

const closeRules = () => {
  DOM.modalRules.classList.add('hidden');
};
DOM.btnCloseRules.onclick = closeRules;
DOM.btnCloseRulesBottom.onclick = closeRules;

// ==========================================
// MODAL DE SALÃO DA GLÓRIA & RANKING
// ==========================================
const openRankingModal = async () => {
  const currentNick = state.currentPlayer?.nickname || DOM.inputNickname?.value.trim() || null;
  const [leaderboard, myStats] = await Promise.all([
    fetchLeaderboard(),
    currentNick ? getOrCreatePlayerStats(currentNick) : null,
  ]);

  DOM.rankingContent.innerHTML = renderRankingModalHTML(leaderboard, myStats, state.rankingActiveTab);
  attachRankingModalEvents(leaderboard, myStats);
  DOM.modalRanking.classList.remove('hidden');
};

const attachRankingModalEvents = (leaderboard, myStats) => {
  const tabBtnLeaderboard = document.getElementById('tab-btn-leaderboard');
  const tabBtnProfile = document.getElementById('tab-btn-profile');
  const btnResetRanking = document.getElementById('btn-reset-ranking');

  if (tabBtnLeaderboard) {
    tabBtnLeaderboard.onclick = () => {
      state.rankingActiveTab = 'leaderboard';
      DOM.rankingContent.innerHTML = renderRankingModalHTML(leaderboard, myStats, 'leaderboard');
      attachRankingModalEvents(leaderboard, myStats);
    };
  }

  if (tabBtnProfile) {
    tabBtnProfile.onclick = () => {
      state.rankingActiveTab = 'profile';
      DOM.rankingContent.innerHTML = renderRankingModalHTML(leaderboard, myStats, 'profile');
      attachRankingModalEvents(leaderboard, myStats);
    };
  }

  if (btnResetRanking) {
    btnResetRanking.onclick = async () => {
      const confirmReset = window.confirm(
        '⚠️ ATENÇÃO: Deseja realmente zerar todos os rankings, vitórias, derrotas e histórico de combate do Santuário? Esta ação é irreversível.'
      );
      if (confirmReset) {
        await resetAllRankings();
        showToast('Ranking do santuário foi zerado com sucesso!', 'success');
        openRankingModal();
      }
    };
  }
};

DOM.btnOpenRanking.onclick = openRankingModal;
DOM.btnCloseRanking.onclick = () => DOM.modalRanking.classList.add('hidden');
DOM.btnCloseRankingBottom.onclick = () => DOM.modalRanking.classList.add('hidden');

// ==========================================
// CONFIGURAÇÃO SUPABASE RUNTIME
// ==========================================
DOM.btnOpenDbConfig.onclick = () => {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  DOM.cfgSupabaseUrl.value = supabaseUrl || '';
  DOM.cfgSupabaseKey.value = supabaseAnonKey || '';
  DOM.modalDbConfig.classList.remove('hidden');
};

DOM.btnFixCredentials?.addEventListener('click', () => {
  DOM.btnOpenDbConfig.click();
});

DOM.btnCloseDbConfig.onclick = () => {
  DOM.modalDbConfig.classList.add('hidden');
};

DOM.btnSaveDbConfig.onclick = () => {
  const url = DOM.cfgSupabaseUrl.value.trim();
  const key = DOM.cfgSupabaseKey.value.trim();

  if (!url || !key) {
    showToast('Preencha a URL e a Anon Key do Supabase.', 'warning');
    return;
  }

  saveRuntimeCredentials(url, key);
  DOM.modalDbConfig.classList.add('hidden');
  showToast('Credenciais salvas! Recarregando aplicação...', 'success');
  setTimeout(() => window.location.reload(), 800);
};

// ==========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================
const initApp = async () => {
  // Configura botões de provocação
  setupEmoteButtons();

  // Verifica credenciais do Supabase
  if (!hasValidCredentials()) {
    DOM.lobbySupabaseNotice?.classList.remove('hidden');
  }

  // Tenta reconexão automática
  await checkAutoReconnect();
};

initApp();
