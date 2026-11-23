import { getCardByCode, CARD_CATALOG } from '../engine/gameLogic.js';

/**
 * Renderizador reativo da Mesa de Jogo das Crônicas da Aliança Arcana
 */

// Gera ícone/avatar temático
export const getAvatarIcon = (theme) => {
  switch (theme) {
    case 'mago': return '🧙‍♂️';
    case 'guerreiro': return '⚔️';
    case 'elfo': return '🧝';
    case 'anão': return '⛏️';
    case 'oraculo': return '🔮';
    case 'semideus': return '⚡';
    case 'ladrao': return '🗡️';
    default: return '👑';
  }
};

// Renderiza a carta do jogador local
export const renderLocalCardHTML = (hand, isMyTurn) => {
  if (!hand) return '';
  const card = getCardByCode(hand.card_code);

  if (hand.is_revealed) {
    return `
      <div class="relative w-36 sm:w-44 h-56 sm:h-64 rounded-xl border border-red-500/50 bg-slate-900/90 p-3 flex flex-col justify-between shadow-lg grayscale filter opacity-70">
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span class="bg-red-950/90 text-red-400 border border-red-500 text-[10px] sm:text-xs font-title font-bold px-2 py-1 rounded-md rotate-[-12deg] tracking-widest shadow-crimson-glow">
            IDENTIDADE REVELADA
          </span>
        </div>
        <div class="flex justify-between items-center text-xs text-slate-400">
          <span class="truncate max-w-[80px]">${card.universe_ref}</span>
          <span class="text-xl">${card.icon}</span>
        </div>
        <div class="my-auto text-center">
          <div class="font-title text-sm sm:text-base font-bold text-slate-300 leading-tight">${card.name}</div>
          <div class="text-[10px] sm:text-xs text-slate-500 mt-1">${card.active_ability_name}</div>
        </div>
        <div class="text-[9px] sm:text-[10px] text-slate-400 line-clamp-2 italic border-t border-slate-700/50 pt-1">
          ${card.active_description}
        </div>
      </div>
    `;
  }

  return `
    <div 
      class="group relative w-36 sm:w-44 h-56 sm:h-64 rounded-xl border-2 p-3 flex flex-col justify-between shadow-arcane-glow transition-all duration-300 transform hover:-translate-y-2 cursor-pointer bg-gradient-to-b from-fantasy-surface to-slate-950"
      style="border-color: ${card.faction_color}; box-shadow: 0 0 15px -3px ${card.faction_color}40;"
      title="${card.name} - ${card.universe_ref}"
    >
      <div class="flex justify-between items-center">
        <span class="text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/40 text-slate-300 border border-slate-700/50">
          ${card.universe_ref}
        </span>
        <span class="text-2xl filter drop-shadow">${card.icon}</span>
      </div>

      <div class="my-auto text-center">
        <div class="font-title text-sm sm:text-base font-bold text-amber-300 leading-tight drop-shadow-md">
          ${card.name}
        </div>
        <div class="text-[10px] sm:text-xs font-medium text-purple-300 mt-1">
          ⚡ ${card.active_ability_name}
        </div>
      </div>

      <div class="space-y-1 bg-black/40 p-1.5 rounded-lg border border-slate-800 text-[9px] sm:text-[10px]">
        <div class="text-slate-300 line-clamp-2">
          <span class="text-amber-400 font-semibold">Ativa:</span> ${card.active_description}
        </div>
        ${card.block_ability_name !== 'Bloqueio' ? `
          <div class="text-slate-400 line-clamp-2 border-t border-slate-800 pt-0.5">
            <span class="text-cyan-400 font-semibold">Defesa:</span> ${card.block_description}
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

// Renderiza a carta dos oponentes (Verso seguro se oculta, Frente se revelada)
export const renderOpponentCardHTML = (hand) => {
  if (!hand) return '';

  if (hand.is_revealed) {
    const card = getCardByCode(hand.card_code);
    return `
      <div class="relative w-16 sm:w-20 h-24 sm:h-28 rounded-lg border border-red-500/40 bg-slate-900/90 p-1 flex flex-col justify-between text-center grayscale filter opacity-70">
        <span class="text-xs text-red-400">💀</span>
        <div class="font-title text-[9px] sm:text-[10px] font-bold text-slate-300 leading-tight truncate">
          ${card.name}
        </div>
        <span class="text-[8px] text-red-400 uppercase tracking-tighter">Revelada</span>
      </div>
    `;
  }

  // VERSO DA CARTA (Estilo Grimório Selado com Runa Mística - NUNCA expor o nome da carta)
  return `
    <div class="relative w-16 sm:w-20 h-24 sm:h-28 rounded-lg border-2 border-amber-600/40 bg-gradient-to-br from-amber-950/80 via-slate-900 to-purple-950/80 p-1 flex flex-col items-center justify-center shadow-md select-none">
      <div class="w-full h-full border border-amber-500/20 rounded flex flex-col items-center justify-center bg-black/30">
        <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-400/50 flex items-center justify-center bg-amber-900/40 text-amber-300 text-xs sm:text-sm animate-pulse-slow">
          ✦
        </div>
        <span class="text-[8px] sm:text-[9px] font-title font-semibold text-amber-400/80 mt-1 uppercase tracking-widest">
          SELADA
        </span>
      </div>
    </div>
  `;
};

// Renderiza a lista de oponentes no topo da mesa
export const renderOpponentsHTML = (players, hands, currentTurnPlayerId, myPlayerId) => {
  const opponents = players.filter((p) => p.id !== myPlayerId);

  if (opponents.length === 0) {
    return `
      <div class="text-center py-6 text-slate-400 italic">
        Aguardando outros guerreiros adentrarem a aliança...
      </div>
    `;
  }

  return opponents
    .map((opp) => {
      const oppHands = hands.filter((h) => h.player_id === opp.id);
      const isTurn = opp.id === currentTurnPlayerId;
      const isAlive = opp.is_alive;

      return `
        <div class="relative flex flex-col items-center p-2.5 sm:p-3 rounded-2xl border ${
          isTurn
            ? 'border-amber-400 bg-amber-500/10 shadow-gold-glow animate-pulse-slow'
            : isAlive
            ? 'border-slate-800 bg-fantasy-surface/80'
            : 'border-red-900/40 bg-black/60 opacity-50'
        } transition-all">
          
          ${isTurn ? `
            <div class="absolute -top-3 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-title text-[10px] font-bold shadow tracking-wider uppercase">
              Vez Atual
            </div>
          ` : ''}

          <!-- Header do Oponente -->
          <div class="flex items-center gap-2 mb-2 w-full justify-between">
            <div class="flex items-center gap-1.5 truncate">
              <span class="text-lg">${getAvatarIcon(opp.avatar_theme)}</span>
              <span class="font-title text-xs sm:text-sm font-bold text-slate-200 truncate ${!isAlive ? 'line-through text-red-400' : ''}">
                ${opp.nickname}
              </span>
            </div>
            
            <div class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 text-xs font-semibold">
              <span>💎</span>
              <span>${opp.runes}</span>
            </div>
          </div>

          <!-- Cartas do Oponente -->
          <div class="flex items-center gap-2">
            ${oppHands.map((h) => renderOpponentCardHTML(h)).join('')}
          </div>

          ${!isAlive ? `
            <div class="text-[10px] font-title font-bold text-red-500 mt-1 uppercase">
              Eliminado
            </div>
          ` : ''}
        </div>
      `;
    })
    .join('');
};

// Renderiza a barra de ações do jogador ativo
export const renderActionBarHTML = (myPlayer, isMyTurn, turnPhase, pendingAction, players) => {
  if (!myPlayer || !myPlayer.is_alive) {
    return `
      <div class="p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-center text-red-400 text-sm">
        💀 Você foi eliminado desta partida arcana. Acompanhe o desenrolar das crônicas!
      </div>
    `;
  }

  if (turnPhase !== 'action' || !isMyTurn) {
    return `
      <div class="p-3 text-center text-slate-400 text-xs sm:text-sm italic">
        Aguardando resolução dos arcanos...
      </div>
    `;
  }

  const runes = myPlayer.runes;
  const mustEpicStrike = runes >= 10;

  return `
    <div class="space-y-3">
      ${mustEpicStrike ? `
        <div class="p-2.5 rounded-lg bg-amber-500/20 border border-amber-500 text-amber-300 text-xs sm:text-sm font-semibold text-center animate-pulse">
          ⚡ Você possui 10 ou mais Runas! A lei do santuário exige um GOLPE ÉPICO.
        </div>
      ` : ''}

      <!-- Ações Básicas e Livres -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <button
          id="btn-act-collect-1"
          ${mustEpicStrike ? 'disabled' : ''}
          class="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-amber-400/50 text-left transition flex flex-col justify-between ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
        >
          <div class="flex items-center justify-between">
            <span class="font-title text-xs font-bold text-amber-300">Coletar 1 Runa</span>
            <span class="text-sm">🪙</span>
          </div>
          <span class="text-[10px] text-slate-400 mt-1">Ação livre. +1 Runa sem contestação.</span>
        </button>

        <button
          id="btn-act-guild-aid"
          ${mustEpicStrike ? 'disabled' : ''}
          class="p-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 hover:border-amber-400/50 text-left transition flex flex-col justify-between ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
        >
          <div class="flex items-center justify-between">
            <span class="font-title text-xs font-bold text-amber-300">Ajuda da Guilda</span>
            <span class="text-sm">🤝</span>
          </div>
          <span class="text-[10px] text-slate-400 mt-1">+2 Runas (Bloqueável por Semideus).</span>
        </button>

        <button
          id="btn-act-epic-strike"
          ${runes < 7 ? 'disabled' : ''}
          class="p-2.5 rounded-xl border border-red-500/50 bg-red-950/40 hover:bg-red-900/60 hover:border-red-400 text-left transition flex flex-col justify-between col-span-2 sm:col-span-1 ${runes < 7 ? 'opacity-40 cursor-not-allowed' : 'shadow-crimson-glow animate-pulse'}"
        >
          <div class="flex items-center justify-between">
            <span class="font-title text-xs font-bold text-red-400">Golpe Épico (-7💎)</span>
            <span class="text-sm">⚡</span>
          </div>
          <span class="text-[10px] text-red-300 mt-1">Destrói 1 carta do alvo. Sem blefe/bloqueio.</span>
        </button>
      </div>

      <!-- Ações de Personagem (Permite Blefe!) -->
      <div class="border-t border-slate-800 pt-2">
        <div class="flex items-center justify-between mb-2">
          <span class="text-[11px] font-title font-semibold text-purple-300 uppercase tracking-wider">
            Ações de Personagem (Você pode blefar!)
          </span>
          <span class="text-[10px] text-slate-400 italic">Blefe por sua conta e risco 🤫</span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <!-- Transfiguração (Arquimago) -->
          <button
            id="btn-act-archmage"
            ${mustEpicStrike ? 'disabled' : ''}
            class="p-2 rounded-lg border border-purple-500/30 bg-purple-950/30 hover:bg-purple-900/40 hover:border-purple-400 text-left transition ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-purple-300">Transfiguração</span>
              <span class="text-xs">🧙‍♂️</span>
            </div>
            <span class="text-[9px] text-slate-400">Troca 2 cartas do grimório.</span>
          </button>

          <!-- Manto Élfico (Portador do Anel) -->
          <button
            id="btn-act-steal"
            ${mustEpicStrike ? 'disabled' : ''}
            class="p-2 rounded-lg border border-amber-500/30 bg-amber-950/30 hover:bg-amber-900/40 hover:border-amber-400 text-left transition ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-amber-300">Manto Élfico</span>
              <span class="text-xs">💍</span>
            </div>
            <span class="text-[9px] text-slate-400">Rouba até 2 Runas de um alvo.</span>
          </button>

          <!-- Fúria Olímpica (Semideus) -->
          <button
            id="btn-act-assassinate"
            ${mustEpicStrike || runes < 3 ? 'disabled' : ''}
            class="p-2 rounded-lg border border-cyan-500/30 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-400 text-left transition ${mustEpicStrike || runes < 3 ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-cyan-300">Fúria Olímpica (-3💎)</span>
              <span class="text-xs">⚡</span>
            </div>
            <span class="text-[9px] text-slate-400">Elimina 1 carta de um alvo.</span>
          </button>

          <!-- Pilhagem de Smaug (Caçador de Dragões) -->
          <button
            id="btn-act-dragonslayer"
            ${mustEpicStrike ? 'disabled' : ''}
            class="p-2 rounded-lg border border-red-500/30 bg-red-950/30 hover:bg-red-900/40 hover:border-red-400 text-left transition ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-red-300">Pilhagem (+3💎)</span>
              <span class="text-xs">🐉</span>
            </div>
            <span class="text-[9px] text-slate-400">Saqueia +3 Runas do tesouro.</span>
          </button>

          <!-- Voto Perpétuo (Guardião das Relíquias) -->
          <button
            id="btn-act-relic"
            ${mustEpicStrike ? 'disabled' : ''}
            class="p-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 hover:bg-emerald-900/40 hover:border-emerald-400 text-left transition ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-emerald-300">Voto Perpétuo</span>
              <span class="text-xs">🛡️</span>
            </div>
            <span class="text-[9px] text-slate-400">+2 Runas puras (Inviolável).</span>
          </button>

          <!-- Profecia Arcana (Oráculo) -->
          <button
            id="btn-act-oracle"
            ${mustEpicStrike ? 'disabled' : ''}
            class="p-2 rounded-lg border border-pink-500/30 bg-pink-950/30 hover:bg-pink-900/40 hover:border-pink-400 text-left transition ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-pink-300">Profecia Arcana</span>
              <span class="text-xs">🔮</span>
            </div>
            <span class="text-[9px] text-slate-400">Espia 1 carta do alvo e +1 Runa.</span>
          </button>

          <!-- Drenagem Sombria (Lorde das Sombras) -->
          <button
            id="btn-act-darklord"
            ${mustEpicStrike ? 'disabled' : ''}
            class="p-2 rounded-lg border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-900/40 hover:border-indigo-400 text-left transition col-span-2 sm:col-span-1 ${mustEpicStrike ? 'opacity-40 cursor-not-allowed' : ''}"
          >
            <div class="flex items-center justify-between">
              <span class="font-title text-xs font-bold text-indigo-300">Drenagem Sombria</span>
              <span class="text-xs">👁️</span>
            </div>
            <span class="text-[9px] text-slate-400">Extorque 1 Runa de cada adversário.</span>
          </button>
        </div>
      </div>
    </div>
  `;
};

// Renderiza o Altar Central e os Banners Interativos de Contestação / Bloqueio
export const renderCenterAltarHTML = (room, myPlayerId, players) => {
  if (!room) return '';

  const { turn_phase, pending_action, deck } = room;
  const deckCount = Array.isArray(deck) ? deck.length : 0;

  // Se estiver na Janela de Contestação ("MENTIRA!")
  if (turn_phase === 'challenge_window' && pending_action) {
    const isBlockContest = Boolean(pending_action.blocked_by_id);
    
    // Quem fez a afirmação a ser contestada:
    // Se for bloqueio, quem declarou foi o bloqueador (blocked_by_id)
    // Se for ação, quem declarou foi o autor da ação (actor_id)
    const claimantId = isBlockContest ? pending_action.blocked_by_id : pending_action.actor_id;
    const isClaimant = claimantId === myPlayerId;

    const subjectName = pending_action.blocked_by_name || pending_action.actor_name;
    const claimedCardName = pending_action.block_card
      ? getCardByCode(pending_action.block_card).name
      : pending_action.claimed_card
      ? getCardByCode(pending_action.claimed_card).name
      : '';

    return `
      <div class="w-full max-w-lg mx-auto p-4 rounded-2xl bg-gradient-to-b from-purple-950/90 to-slate-950 border-2 border-purple-500/60 shadow-arcane-glow animate-pulse-slow text-center space-y-3">
        <div class="inline-block px-3 py-1 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 text-xs font-title font-semibold uppercase tracking-widest">
          ⚔️ Janela de Contestação Arcana
        </div>

        <div class="text-sm sm:text-base text-slate-200">
          <span class="font-bold text-amber-300">${subjectName}</span> declarou:
          <div class="font-title text-base sm:text-lg font-bold text-purple-200 mt-1">
            "${isBlockContest ? `Bloqueio com [${claimedCardName}]` : pending_action.action_label}"
          </div>
          ${claimedCardName ? `
            <div class="text-xs text-slate-400 mt-0.5">
              Alegando possuir a carta: <span class="text-amber-300 font-semibold">[${claimedCardName}]</span>
            </div>
          ` : ''}
        </div>

        ${isClaimant ? `
          <div class="text-xs text-amber-400/80 italic py-2">
            Aguardando a reação dos outros nobres arcanos à sua declaração...
          </div>
        ` : `
          <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="btn-call-bluff"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-title text-xs sm:text-sm font-bold shadow-crimson-glow tracking-wider uppercase transition transform hover:scale-105 active:scale-95"
            >
              ⚔️ GRITAR MENTIRA! (Contestar)
            </button>
            <button
              id="btn-accept-action"
              class="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-title text-xs sm:text-sm font-bold tracking-wider uppercase transition"
            >
              🛡️ ${isBlockContest ? 'Aceitar Bloqueio' : 'Aceitar / Passar'}
            </button>
          </div>
        `}
      </div>
    `;
  }

  // Se estiver na Janela de Bloqueio ("block_window")
  if (turn_phase === 'block_window' && pending_action) {
    const isActor = pending_action.actor_id === myPlayerId;
    const isTarget = pending_action.target_id === myPlayerId;
    const isGuildAid = pending_action.action_code === 'GUILD_AID';

    // Determina quem pode bloquear e com quais cartas
    let blockOptions = [];

    if (isGuildAid) {
      // Qualquer um pode bloquear com Semideus
      blockOptions.push({ code: 'DEMIGOD', label: 'Bloquear com Semideus do Olimpo' });
    } else if (pending_action.action_code === 'STEAL' && isTarget) {
      blockOptions.push({ code: 'RINGBEARER', label: 'Bloquear com Portador do Anel' });
      blockOptions.push({ code: 'ARCHMAGE', label: 'Bloquear com Arquimago Supremo' });
      blockOptions.push({ code: 'DARK_LORD', label: 'Bloquear com Lorde das Sombras' });
    } else if (pending_action.action_code === 'ASSASSINATE' && isTarget) {
      blockOptions.push({ code: 'RELIC_KEEPER', label: 'Bloquear com Guardião das Relíquias' });
    } else if (pending_action.action_code === 'DIVINATION' && isTarget) {
      blockOptions.push({ code: 'ORACLE', label: 'Bloquear com Oráculo de Delfos' });
      blockOptions.push({ code: 'ARCHMAGE', label: 'Bloquear com Arquimago Supremo' });
      blockOptions.push({ code: 'DARK_LORD', label: 'Bloquear com Lorde das Sombras' });
    }

    const canIBlock = isGuildAid ? !isActor : isTarget;

    return `
      <div class="w-full max-w-lg mx-auto p-4 rounded-2xl bg-gradient-to-b from-cyan-950/90 to-slate-950 border-2 border-cyan-500/60 shadow-arcane-glow text-center space-y-3">
        <div class="inline-block px-3 py-1 rounded-full bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-title font-semibold uppercase tracking-widest">
          🛡️ Janela de Bloqueio Defensivo
        </div>

        <div class="text-sm sm:text-base text-slate-200">
          <span class="font-bold text-amber-300">${pending_action.actor_name}</span> declarou:
          <div class="font-title text-base sm:text-lg font-bold text-cyan-200 mt-1">
            "${pending_action.action_label}"
          </div>
        </div>

        ${canIBlock && blockOptions.length > 0 ? `
          <div class="space-y-2 pt-2">
            <div class="text-xs text-cyan-300 font-semibold">
              Deseja tentar bloquear esta ação? (Você pode blefar o bloqueio!)
            </div>
            <div class="flex flex-wrap items-center justify-center gap-2">
              ${blockOptions.map((opt) => `
                <button
                  data-block-code="${opt.code}"
                  class="btn-declare-block px-4 py-2 rounded-xl bg-cyan-700 hover:bg-cyan-600 text-white font-title text-xs font-bold tracking-wider uppercase transition shadow-md"
                >
                  🛡️ ${opt.label}
                </button>
              `).join('')}
              <button
                id="btn-pass-block"
                class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-title text-xs font-bold tracking-wider uppercase transition"
              >
                Não Bloquear
              </button>
            </div>
          </div>
        ` : `
          <div class="text-xs text-slate-400 italic py-2">
            Aguardando declarações de defesa dos alvos...
          </div>
        `}
      </div>
    `;
  }

  // Altar Padrão em repouso
  return `
    <div class="flex items-center justify-center gap-4 sm:gap-6 py-2">
      <!-- Indicador do Baralho / Grimório -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs shadow-inner">
        <span class="text-lg">📜</span>
        <div>
          <div class="font-title font-bold text-slate-200">${deckCount} cartas</div>
          <div class="text-[9px] text-slate-400">no Grimório</div>
        </div>
      </div>

      <!-- Tesouro Arcano de Runas -->
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-amber-500/30 text-amber-300 text-xs shadow-inner">
        <span class="text-lg">💎</span>
        <div>
          <div class="font-title font-bold text-amber-300">Tesouro Arcano</div>
          <div class="text-[9px] text-slate-400">Reserva Mágica</div>
        </div>
      </div>
    </div>
  `;
};

// Renderiza o Feed de Crônicas da Mesa (Game Logs)
export const renderLogsHTML = (logs) => {
  if (!logs || logs.length === 0) {
    return `
      <div class="text-center py-4 text-slate-500 text-xs italic">
        O pergaminho das crônicas está em branco. A magia aguarda o primeiro ato.
      </div>
    `;
  }

  return logs
    .map((log) => {
      let badgeClass = 'bg-slate-800 text-slate-300 border-slate-700';
      let icon = '📜';

      switch (log.event_type) {
        case 'ACTION':
          badgeClass = 'bg-purple-950/80 text-purple-300 border-purple-500/40';
          icon = '⚡';
          break;
        case 'BLUFF_CALL':
          badgeClass = 'bg-red-950/80 text-red-300 border-red-500/40';
          icon = '⚔️';
          break;
        case 'BLOCK':
          badgeClass = 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
          icon = '🛡️';
          break;
        case 'ELIMINATED':
          badgeClass = 'bg-red-950 text-red-400 border-red-600';
          icon = '💀';
          break;
        case 'SYSTEM':
          badgeClass = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
          icon = '✨';
          break;
      }

      const timeStr = log.created_at
        ? new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : '';

      return `
        <div class="flex items-start gap-2 text-xs p-2 rounded-lg bg-black/40 border border-slate-800/60 transition hover:bg-slate-900/60">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-title font-bold border ${badgeClass} shrink-0">
            ${icon} ${log.event_type}
          </span>
          <div class="flex-1 text-slate-300 leading-snug">
            ${log.message}
          </div>
          <span class="text-[9px] text-slate-500 shrink-0 select-none">${timeStr}</span>
        </div>
      `;
    })
    .join('');
};

// Renderiza a Tabela do Grimório de Regras (Modal)
export const renderRulesModalHTML = () => {
  return `
    <div class="space-y-4 text-xs sm:text-sm text-slate-300">
      <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
        💡 <strong>Lei dos Nobres:</strong> Você pode declarar QUALQUER ação de personagem mesmo que NÃO tenha a carta correspondente na mão. Porém, se alguém gritar <em>"MENTIRA!"</em> e você for pego blefando, perderá uma de suas identidades arcanas! O baralho possui <strong>35 cartas</strong> (7 arquétipos x 5 cópias cada) para 2 a 5 guerreiros.
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-amber-500/30 font-title text-amber-400 text-[11px] sm:text-xs">
              <th class="py-2 px-2">Carta & Universo</th>
              <th class="py-2 px-2">Ação Ativa (Pode Blefar)</th>
              <th class="py-2 px-2">Bloqueio Defensivo</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            ${CARD_CATALOG.map((card) => `
              <tr class="hover:bg-slate-800/40 transition">
                <td class="py-2.5 px-2 font-medium">
                  <div class="flex items-center gap-1.5">
                    <span class="text-lg">${card.icon}</span>
                    <div>
                      <div class="font-title text-xs font-bold" style="color: ${card.faction_color}">${card.name}</div>
                      <div class="text-[10px] text-slate-400">${card.universe_ref} (5 cópias)</div>
                    </div>
                  </div>
                </td>
                <td class="py-2.5 px-2">
                  <div class="font-semibold text-slate-200">${card.active_ability_name}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">${card.active_description}</div>
                </td>
                <td class="py-2.5 px-2">
                  <div class="font-semibold text-cyan-300">${card.block_ability_name}</div>
                  <div class="text-[10px] text-slate-400 mt-0.5">${card.block_description}</div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs space-y-1.5">
        <div class="font-title font-bold text-amber-400">Ações Gerais (Sem Carta Necessária)</div>
        <div>• <strong>Coletar 1 Runa:</strong> Ganha +1 Runa sem risco de contestação ou bloqueio.</div>
        <div>• <strong>Ajuda da Guilda:</strong> Ganha +2 Runas. Não é blefe, mas o Semideus pode tentar bloquear.</div>
        <div>• <strong>Golpe Épico (-7 Runas):</strong> Custa 7 Runas. Elimina imediatamente 1 carta de um adversário sem chance de blefe ou bloqueio. (Obrigatório se tiver 10+ Runas).</div>
      </div>
    </div>
  `;
};

// Renderiza o Modal Completo do Ranking & Estatísticas
export const renderRankingModalHTML = (leaderboard = [], myStats = null, activeTab = 'leaderboard') => {
  const isLeaderboard = activeTab === 'leaderboard';

  return `
    <div class="space-y-4">
      <!-- Navegação das Abas -->
      <div class="flex items-center justify-center gap-2 border-b border-slate-800 pb-3">
        <button
          id="tab-btn-leaderboard"
          class="px-4 py-2 rounded-xl font-title text-xs font-bold uppercase tracking-wider transition ${
            isLeaderboard
              ? 'bg-amber-500 text-slate-950 shadow-gold-glow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }"
        >
          🏆 Classificação Geral
        </button>
        <button
          id="tab-btn-profile"
          class="px-4 py-2 rounded-xl font-title text-xs font-bold uppercase tracking-wider transition ${
            !isLeaderboard
              ? 'bg-purple-600 text-white shadow-arcane-glow'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }"
        >
          📜 Meu Perfil Arcano
        </button>
      </div>

      <!-- CONTEÚDO: ABA 1 - CLASSIFICAÇÃO GERAL -->
      ${isLeaderboard ? `
        <div class="space-y-3">
          <div class="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Ordem dos Guerreiros mais Gloriosos da Aliança</span>
            <span>Total: ${leaderboard.length} Heróis</span>
          </div>

          ${leaderboard.length === 0 ? `
            <div class="text-center py-8 text-slate-500 text-xs italic">
              Nenhum duelo foi registrado ainda neste santuário. Seja o primeiro a forjar sua lenda!
            </div>
          ` : `
            <div class="overflow-x-auto max-h-[50vh] overflow-y-auto pr-1">
              <table class="w-full text-left border-collapse text-xs">
                <thead>
                  <tr class="border-b border-amber-500/30 font-title text-amber-400 text-[11px]">
                    <th class="py-2 px-2 text-center">Rank</th>
                    <th class="py-2 px-2">Guerreiro</th>
                    <th class="py-2 px-2 text-center">Pontos</th>
                    <th class="py-2 px-2 text-center">Vitórias</th>
                    <th class="py-2 px-2 text-center">Derrotas</th>
                    <th class="py-2 px-2 text-center">Win Rate</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  ${leaderboard.map((item, idx) => {
                    let medal = `#${idx + 1}`;
                    if (idx === 0) medal = '🥇 1º';
                    else if (idx === 1) medal = '🥈 2º';
                    else if (idx === 2) medal = '🥉 3º';

                    const total = (item.wins || 0) + (item.losses || 0);
                    const winrate = total > 0 ? ((item.wins / total) * 100).toFixed(0) + '%' : '0%';

                    return `
                      <tr class="hover:bg-slate-800/40 transition">
                        <td class="py-2 px-2 text-center font-title font-bold text-amber-300">
                          ${medal}
                        </td>
                        <td class="py-2 px-2 font-bold text-slate-200">
                          ${item.nickname}
                        </td>
                        <td class="py-2 px-2 text-center font-mono font-bold text-purple-300">
                          ${item.score || 0}
                        </td>
                        <td class="py-2 px-2 text-center text-emerald-400 font-semibold">
                          ${item.wins || 0}
                        </td>
                        <td class="py-2 px-2 text-center text-red-400 font-semibold">
                          ${item.losses || 0}
                        </td>
                        <td class="py-2 px-2 text-center text-amber-300 font-mono">
                          ${winrate}
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      ` : `
        <!-- CONTEÚDO: ABA 2 - MEU PERFIL ARCANO DETALHADO -->
        <div class="space-y-4">
          ${!myStats ? `
            <div class="text-center py-8 text-slate-500 text-xs italic">
              Selecione seu nome de guerreiro para carregar seu registro histórico.
            </div>
          ` : `
            <!-- Resumo Superior -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span class="text-[10px] text-slate-400 uppercase font-semibold">Duelos</span>
                <div class="font-title text-lg font-bold text-slate-200 mt-0.5">${myStats.games_played || 0}</div>
              </div>

              <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center">
                <span class="text-[10px] text-emerald-400 uppercase font-semibold">Vitórias</span>
                <div class="font-title text-lg font-bold text-emerald-300 mt-0.5">${myStats.wins || 0}</div>
              </div>

              <div class="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-center">
                <span class="text-[10px] text-red-400 uppercase font-semibold">Derrotas</span>
                <div class="font-title text-lg font-bold text-red-300 mt-0.5">${myStats.losses || 0}</div>
              </div>

              <div class="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-center">
                <span class="text-[10px] text-amber-400 uppercase font-semibold">Win Rate</span>
                <div class="font-title text-lg font-bold text-amber-300 mt-0.5">
                  ${(myStats.games_played || 0) > 0 ? (((myStats.wins || 0) / myStats.games_played) * 100).toFixed(1) + '%' : '0%'}
                </div>
              </div>
            </div>

            <!-- Golpes Aplicados vs Sofridos -->
            <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div class="font-title text-xs font-bold text-amber-300 uppercase tracking-wider">
                ⚔️ Registro de Golpes e Conflitos
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                  <span>⚡ Golpe Épico:</span>
                  <div class="font-mono text-right">
                    <span class="text-emerald-400 font-bold">${myStats.epic_strikes_dealt || 0} feitos</span> / 
                    <span class="text-red-400 font-bold">${myStats.epic_strikes_received || 0} sofridos</span>
                  </div>
                </div>

                <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                  <span>🗡️ Fúria Olímpica:</span>
                  <div class="font-mono text-right">
                    <span class="text-emerald-400 font-bold">${myStats.assassinations_dealt || 0} feitos</span> / 
                    <span class="text-red-400 font-bold">${myStats.assassinations_received || 0} sofridos</span>
                  </div>
                </div>

                <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                  <span>💍 Manto Élfico:</span>
                  <div class="font-mono text-right">
                    <span class="text-emerald-400 font-bold">${myStats.steals_dealt || 0} roubos</span> / 
                    <span class="text-red-400 font-bold">${myStats.steals_received || 0} sofridos</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Blefes e Bloqueios -->
            <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div class="font-title text-xs font-bold text-purple-300 uppercase tracking-wider">
                🎭 Arte do Blefe e Proteção
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                  <span>⚔️ Blefes Desmascarados:</span>
                  <span class="font-mono font-bold text-emerald-400">${myStats.bluffs_exposed || 0} vezes</span>
                </div>
                <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                  <span>❌ Pego Mentindo:</span>
                  <span class="font-mono font-bold text-red-400">${myStats.bluffs_caught || 0} vezes</span>
                </div>
                <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                  <span>🛡️ Bloqueios Bem-Sucedidos:</span>
                  <span class="font-mono font-bold text-cyan-300">${myStats.blocks_performed || 0} vezes</span>
                </div>
              </div>
            </div>

            <!-- Cartas Mais Invocadas -->
            <div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div class="font-title text-xs font-bold text-amber-300 uppercase tracking-wider">
                🃏 Cartas Mais Invocadas nas Partidas
              </div>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${CARD_CATALOG.map((card) => {
                  const usedCount = (myStats.cards_used && myStats.cards_used[card.code]) || 0;
                  return `
                    <div class="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between text-xs">
                      <div class="flex items-center gap-1.5 truncate">
                        <span>${card.icon}</span>
                        <span class="truncate text-[11px] text-slate-300">${card.name}</span>
                      </div>
                      <span class="font-mono font-bold text-amber-400 shrink-0 ml-1">${usedCount}x</span>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `}
        </div>
      `}

      <!-- AÇÃO ADMINISTRATIVA: ZERAR RANKING -->
      <div class="border-t border-slate-800 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span class="text-[10px] text-slate-500 italic">
          Os registros de glória são atualizados automaticamente ao fim de cada contenda.
        </span>
        <button
          id="btn-reset-ranking"
          class="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 font-title text-[10px] font-bold tracking-wider uppercase transition shadow-sm"
          title="Zerar todos os registros do Santuário"
        >
          ⚠️ Zerar Ranking do Santuário
        </button>
      </div>
    </div>
  `;
};
