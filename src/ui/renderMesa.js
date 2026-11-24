import { CLASSES, PARTY_LEADERS } from '../engine/gameCatalog.js';
import { canAttackMonster, getPartyClasses } from '../engine/gameLogic.js';

/**
 * RENDERIZADOR 100% RESPONSIVO & MOBILE-FIRST
 * Arquitetura em 5 Zonas (360px a Desktop) no estilo Taverna Caótica
 */

// ZONA 1: BARRA DE RIVAIS COMPACTA (Topo)
export const renderRivalsBarHTML = (players, myPlayerId, turnPlayerId) => {
  const rivals = players.filter((p) => p.id !== myPlayerId);

  if (rivals.length === 0) {
    return `<div class="text-xs text-slate-400 italic py-1 text-center">Aguardando guerreiros adentrarem a taverna...</div>`;
  }

  return `
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
      ${rivals
        .map((rival) => {
          const isTurn = rival.id === turnPlayerId;
          const partyClasses = getPartyClasses(rival);
          const leader = rival.leader;

          return `
            <button
              type="button"
              data-rival-id="${rival.id}"
              class="btn-open-rival-drawer flex-shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition card-chunky ${
                isTurn
                  ? 'border-amber-400 bg-amber-500/20 shadow-tavern-glow ring-2 ring-amber-400/50'
                  : 'border-slate-800 bg-slate-900/90 hover:border-slate-700'
              }"
            >
              <div class="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-slate-950 border border-slate-700">
                ${leader?.avatar || '👑'}
              </div>

              <div class="text-left">
                <div class="flex items-center gap-1.5">
                  <span class="text-[11px] font-title font-bold text-slate-200 truncate max-w-[85px]">
                    ${rival.nickname}
                  </span>
                  ${isTurn ? `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>` : ''}
                </div>

                <div class="flex items-center gap-2 text-[10px] text-slate-400">
                  <span class="text-amber-400 font-bold">🏆 ${rival.slainMonsters.length}/3</span>
                  <span class="text-cyan-400">🎴 ${rival.hand.length}</span>
                  <div class="flex items-center -space-x-1">
                    ${partyClasses
                      .map((c) => `<span class="text-[9px] drop-shadow">${CLASSES[c]?.icon || '✦'}</span>`)
                      .join('')}
                  </div>
                </div>
              </div>
            </button>
          `;
        })
        .join('')}
    </div>
  `;
};

// ZONA 2: O COVIL DOS MONSTROS & BARALHO (Meio-Superior)
export const renderCovilHTML = (activeMonsters, humanPlayer, mainDeckCount, discardCount) => {
  return `
    <div class="w-full space-y-1.5">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-1.5">
          <span class="text-sm">🔥</span>
          <span class="font-title text-xs font-bold text-amber-400 uppercase tracking-wider">
            O Covil dos Monstros
          </span>
        </div>

        <div class="flex items-center gap-3 text-[10px] text-slate-400">
          <div class="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-lg border border-slate-800">
            <span>📜</span>
            <span class="font-mono text-slate-200 font-bold">${mainDeckCount}</span>
            <span>no Baralho</span>
          </div>
          <button id="btn-view-discard" class="flex items-center gap-1 bg-slate-900/80 hover:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-800 transition">
            <span>🗑️</span>
            <span class="font-mono text-slate-300">${discardCount}</span>
          </button>
        </div>
      </div>

      <!-- Grid dos 3 Monstros Ativos -->
      <div class="grid grid-cols-3 gap-2">
        ${activeMonsters
          .map((monster) => {
            if (!monster) return '';
            const attackable = canAttackMonster(humanPlayer, monster);

            return `
              <div
                data-monster-id="${monster.id}"
                class="btn-inspect-monster group relative p-2 rounded-xl border-2 transition card-chunky cursor-pointer flex flex-col justify-between h-[105px] sm:h-[120px] ${
                  attackable
                    ? 'border-emerald-400 bg-emerald-950/30 shadow-attackable-glow monster-attackable'
                    : 'border-slate-800 bg-slate-950/90 hover:border-slate-700'
                }"
              >
                ${
                  attackable
                    ? `
                  <div class="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-title text-[8px] font-black uppercase tracking-wider shadow-sm animate-pulse whitespace-nowrap">
                    ⚔️ ATACÁVEL
                  </div>
                `
                    : ''
                }

                <div class="flex items-start justify-between">
                  <span class="text-lg filter drop-shadow">${monster.icon}</span>
                  <div class="flex items-center gap-0.5">
                    ${monster.requiredClasses
                      .map((rc) => `<span class="text-[10px]" title="${CLASSES[rc]?.name}">${CLASSES[rc]?.icon}</span>`)
                      .join('')}
                  </div>
                </div>

                <div class="my-auto text-center">
                  <div class="font-title text-[11px] sm:text-xs font-bold text-amber-200 leading-tight truncate">
                    ${monster.name}
                  </div>
                  <div class="text-[9px] text-slate-400 truncate mt-0.5">${monster.title}</div>
                </div>

                <div class="flex items-center justify-between text-[9px] border-t border-slate-800/80 pt-1">
                  <span class="text-emerald-400 font-bold">🎯 ${monster.rollTarget}+</span>
                  <span class="text-red-400 font-medium">💀 ${monster.failThreshold}-</span>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
};

// ZONA 3: ARENA DE DADOS 2D6 & LOG (Centro)
export const renderDiceArenaHTML = (diceState, latestLog) => {
  const isRolling = diceState.isRolling;
  const total = diceState.total;
  const die1 = diceState.die1;
  const die2 = diceState.die2;
  const mod = diceState.modifiers || 0;

  return `
    <div class="w-full flex flex-col items-center justify-center gap-1.5 py-1">
      <div class="flex items-center justify-center gap-3">
        <!-- Dado 1 -->
        <div class="w-10 h-10 sm:w-12 sm:h-12 dice-face text-base sm:text-lg ${isRolling ? 'animate-dice-roll' : ''}">
          ${die1}
        </div>

        <span class="text-slate-400 text-xs font-black">+</span>

        <!-- Dado 2 -->
        <div class="w-10 h-10 sm:w-12 sm:h-12 dice-face text-base sm:text-lg ${isRolling ? 'animate-dice-roll' : ''}">
          ${die2}
        </div>

        ${
          mod !== 0
            ? `
          <span class="text-slate-400 text-xs font-black">=</span>
          <div class="px-2 py-1 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 font-title font-black text-xs">
            ${total} ${mod > 0 ? `(+${mod})` : `(${mod})`}
          </div>
        `
            : `
          <span class="text-slate-400 text-xs font-black">=</span>
          <div class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-title font-black text-xs sm:text-sm">
            ${total}
          </div>
        `
        }
      </div>

      <!-- 1-Line Action Toast / Narrador -->
      <div class="w-full max-w-md mx-auto text-center px-2">
        <div class="inline-block px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 truncate max-w-full">
          ${latestLog?.text || 'A Taverna está em silêncio. Faça sua jogada!'}
        </div>
      </div>
    </div>
  `;
};

// ZONA 4: SUA PARTY NA MESA (Meio-Inferior)
export const renderPlayerPartyHTML = (player, isMyTurn, currentPA) => {
  const leader = player.leader;
  const party = player.party || [];
  const partyClasses = getPartyClasses(player);

  return `
    <div class="w-full space-y-1">
      <div class="flex items-center justify-between px-1">
        <div class="flex items-center gap-1.5">
          <span class="text-sm">🛡️</span>
          <span class="font-title text-xs font-bold text-slate-200 uppercase tracking-wider">
            Sua Party (${party.length + 1} Heróis • ${partyClasses.length}/6 Classes)
          </span>
        </div>

        <!-- Troféus de Monstros Abatidos -->
        <div class="flex items-center gap-1">
          <span class="text-[10px] text-slate-400">Troféus:</span>
          ${
            player.slainMonsters.length > 0
              ? player.slainMonsters.map((m) => `<span class="text-xs" title="${m.name}">${m.icon}</span>`).join('')
              : `<span class="text-[10px] text-slate-500 italic">Nenhum</span>`
          }
        </div>
      </div>

      <!-- Carrossel da Party (Líder + Heróis) -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1">
        <!-- 1. CARTA DO LÍDER DE GRUPO -->
        <div
          class="flex-shrink-0 w-24 sm:w-28 h-32 sm:h-36 rounded-xl border-2 p-2 flex flex-col justify-between card-chunky select-none bg-gradient-to-b from-slate-900 to-slate-950"
          style="border-color: ${leader.color};"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-black/60 text-slate-200">
              LÍDER
            </span>
            <span class="text-sm">${leader.avatar}</span>
          </div>

          <div class="text-center my-auto">
            <div class="font-title text-[11px] font-bold text-amber-300 leading-tight truncate">
              ${leader.name}
            </div>
            <div class="text-[9px] text-slate-400 mt-0.5 truncate">${leader.title}</div>
          </div>

          <div class="text-[8px] text-slate-300 line-clamp-2 italic border-t border-slate-800 pt-0.5">
            ${leader.passiveDescription}
          </div>
        </div>

        <!-- 2. HERÓIS DA PARTY -->
        ${party
          .map((heroEntry) => {
            const isBluff = heroEntry.isBluff;
            const hero = heroEntry.card;
            const displayClassKey = isBluff ? heroEntry.declaredClass : hero.heroClass;
            const classObj = CLASSES[displayClassKey] || CLASSES.fighter;
            const item = heroEntry.equippedItem;
            const canUseAbility = isMyTurn && currentPA >= 1 && !heroEntry.abilityUsedThisTurn && hero.rollTarget;

            if (isBluff) {
              // CARTA EM MODO BLEFE (Face Oculta com Máscara Mística)
              return `
                <div
                  data-hero-instance-id="${heroEntry.instanceId}"
                  class="btn-inspect-party-hero group relative flex-shrink-0 w-24 sm:w-28 h-32 sm:h-36 rounded-xl border-2 border-pink-500/80 p-2 flex flex-col justify-between card-chunky cursor-pointer bg-gradient-to-b from-purple-950 via-slate-950 to-pink-950 shadow-bluff-glow"
                >
                  <div class="flex items-center justify-between text-xs">
                    <span class="px-1 py-0.2 rounded-full text-[8px] font-black uppercase text-pink-200 bg-pink-950/80 border border-pink-500/50">
                      🎭 BLEFE
                    </span>
                    <span class="text-xs">${classObj.icon}</span>
                  </div>

                  <div class="my-auto text-center">
                    <div class="w-8 h-8 mx-auto rounded-full bg-pink-950/60 border border-pink-500/60 flex items-center justify-center text-sm animate-pulse">
                      🎭
                    </div>
                    <div class="font-title text-[10px] font-bold text-pink-300 mt-1 truncate">
                      [${classObj.name}]
                    </div>
                    <div class="text-[8px] text-slate-400">Classe Declarada</div>
                  </div>

                  <div class="text-center text-[8px] text-slate-400 border-t border-pink-900/40 pt-0.5 italic">
                    Identidade Oculta 🤫
                  </div>
                </div>
              `;
            }

            // CARTA HONESTA FACE ABERTA
            return `
              <div
                data-hero-instance-id="${heroEntry.instanceId}"
                class="btn-inspect-party-hero group relative flex-shrink-0 w-24 sm:w-28 h-32 sm:h-36 rounded-xl border-2 p-2 flex flex-col justify-between card-chunky cursor-pointer bg-gradient-to-b from-slate-900 to-slate-950"
                style="border-color: ${classObj.color};"
              >
                <div class="flex items-center justify-between text-xs">
                  <span class="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-black/60 text-slate-200">
                    ${classObj.name}
                  </span>
                  <span class="text-sm">${hero.icon}</span>
                </div>

                <div class="text-center my-auto">
                  <div class="font-title text-[11px] font-bold text-slate-200 leading-tight truncate">
                    ${hero.name}
                  </div>
                  <div class="text-[9px] text-amber-400 font-bold mt-0.5">
                    🎲 ${hero.rollTarget}+
                  </div>
                </div>

                <div class="space-y-0.5 border-t border-slate-800 pt-0.5">
                  ${
                    item
                      ? `
                    <div class="text-[8px] text-cyan-300 truncate font-semibold">
                      🗡️ ${item.name} (+${item.bonus || 1})
                    </div>
                  `
                      : ''
                  }
                  ${
                    canUseAbility
                      ? `
                    <button
                      type="button"
                      data-activate-hero-id="${heroEntry.instanceId}"
                      class="btn-activate-hero-ability w-full py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-title text-[8px] font-black uppercase tracking-wider transition"
                    >
                      ⚡ Ativar (1 PA)
                    </button>
                  `
                      : `
                    <div class="text-[8px] text-slate-400 truncate text-center">
                      ${heroEntry.abilityUsedThisTurn ? '✓ Já Usado' : hero.abilityName}
                    </div>
                  `
                  }
                </div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>
  `;
};

// ZONA 5: BASE FIXA (MÃO EM CARROSSEL & BARRA DO POLEGAR - THUMB ZONE)
export const renderThumbZoneHTML = (player, isMyTurn, currentPA, maxPA) => {
  const hand = player.hand || [];

  return `
    <div class="w-full space-y-1.5 pt-1.5 sticky bottom-0 z-40 bg-[#140F1D]/95 backdrop-blur-md border-t-2 border-amber-500/40 shadow-2xl pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <!-- Mão de Cartas em Carrossel Horizontal Suave (snap-x) -->
      <div class="flex items-center gap-2 overflow-x-auto snap-x no-scrollbar px-3 py-1">
        ${
          hand.length === 0
            ? `
          <div class="w-full text-center py-3 text-xs text-slate-500 italic">
            Sua mão está vazia. Toque em "Comprar (1 PA)" abaixo!
          </div>
        `
            : hand
                .map((card, idx) => {
                  let badge = '';
                  let borderColor = '#64748B';

                  if (card.type === 'hero') {
                    const c = CLASSES[card.heroClass] || CLASSES.fighter;
                    borderColor = c.color;
                    badge = `🎲 ${card.rollTarget}+`;
                  } else if (card.type === 'spell') {
                    borderColor = '#06B6D4';
                    badge = 'MAGIA';
                  } else if (card.type === 'item') {
                    borderColor = '#94A3B8';
                    badge = `ITEM (+${card.bonus || 1})`;
                  } else if (card.type === 'modifier') {
                    borderColor = '#F43F5E';
                    badge = `MOD (${card.bonus >= 0 ? `+${card.bonus}` : card.bonus})`;
                  }

                  return `
                    <button
                      type="button"
                      data-hand-index="${idx}"
                      class="btn-select-hand-card flex-shrink-0 snap-start w-20 sm:w-24 h-28 sm:h-32 rounded-xl border-2 p-1.5 flex flex-col justify-between card-chunky transition transform active:scale-95 bg-gradient-to-b from-slate-900 to-slate-950 text-left hover:border-amber-400"
                      style="border-color: ${borderColor};"
                    >
                      <div class="flex items-center justify-between">
                        <span class="text-xs">${card.icon || '✦'}</span>
                        <span class="text-[8px] font-black uppercase px-1 rounded bg-black/60 text-slate-300">
                          ${badge}
                        </span>
                      </div>

                      <div class="my-auto text-center">
                        <div class="font-title text-[10px] sm:text-[11px] font-bold text-slate-100 leading-tight truncate">
                          ${card.name}
                        </div>
                      </div>

                      <div class="text-[8px] text-amber-400 font-bold text-center uppercase tracking-wider">
                        Toque p/ Jogar
                      </div>
                    </button>
                  `;
                })
                .join('')
        }
      </div>

      <!-- Barra Inferior Fixa ao Alcance do Polegar (Min. 48px Touch Target) -->
      <div class="flex items-center justify-between gap-2 px-3 pt-0.5">
        <!-- Cristais de Ação (PA) -->
        <div class="flex items-center gap-1.5 bg-slate-950/90 px-3 py-2 rounded-xl border border-slate-800">
          <div class="flex items-center gap-1">
            ${Array.from({ length: maxPA })
              .map((_, i) => `<span class="pa-crystal ${i < currentPA ? '' : 'empty'}"></span>`)
              .join('')}
          </div>
          <span class="font-title text-xs font-black text-cyan-400 ml-1">
            ${currentPA}/${maxPA} PA
          </span>
        </div>

        <!-- Botões de Ação do Polegar (Min. 48px Touch Target) -->
        <div class="flex items-center gap-2">
          <!-- Botão Comprar Carta (1 PA) -->
          <button
            id="btn-act-draw"
            ${!isMyTurn || currentPA < 1 ? 'disabled' : ''}
            class="min-h-[48px] px-3.5 py-2.5 rounded-xl border border-cyan-500/50 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 font-title text-xs font-bold uppercase tracking-wider transition card-chunky flex items-center gap-1.5 ${
              !isMyTurn || currentPA < 1 ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
            }"
          >
            <span>🎴</span>
            <span>Comprar (1 PA)</span>
          </button>

          <!-- Botão Passar Turno -->
          <button
            id="btn-act-pass"
            ${!isMyTurn ? 'disabled' : ''}
            class="min-h-[48px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-title text-xs sm:text-sm font-black uppercase tracking-wider transition card-chunky shadow-tavern-glow ${
              !isMyTurn ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
            }"
          >
            ${isMyTurn ? 'Passar Vez ➔' : 'Aguarde...'}
          </button>
        </div>
      </div>
    </div>
  `;
};

// BANNER CENTRAL FLUTUANTE DE REAÇÃO / BLEFE ("🚨 MENTIRA!")
export const renderReactionBannerHTML = (reaction, myPlayerId, myHand) => {
  if (!reaction) return '';

  const isMe = reaction.initiatorId === myPlayerId;
  const isBluff = reaction.isBluff;
  const declaredClass = CLASSES[reaction.declaredClass]?.name || reaction.declaredClass;

  // Filtra cartas modificadoras na mão do jogador
  const modifierCards = myHand.filter((c) => c.type === 'modifier');

  return `
    <div class="fixed inset-x-3 top-16 sm:top-20 z-50 max-w-md mx-auto p-4 rounded-3xl bg-gradient-to-b from-[#25101A] via-slate-950 to-[#190C1C] border-2 border-red-500 shadow-2xl text-center space-y-3 drawer-slide-up ring-4 ring-red-500/30 animate-pulse">
      
      <!-- Topo com Timer Regressivo de 6s -->
      <div class="flex items-center justify-between border-b border-red-500/40 pb-2">
        <span class="font-title text-xs font-black uppercase text-red-400 tracking-wider flex items-center gap-1.5">
          <span>⚔️</span>
          <span>JANELA DE BLEFE & CONTESTAÇÃO</span>
        </span>
        <span class="px-2 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-mono font-bold">
          ${reaction.timeRemaining}s
        </span>
      </div>

      <!-- Barra de progresso regressiva -->
      <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div class="h-full bg-red-500 transition-all duration-1000 ease-linear" style="width: ${(reaction.timeRemaining / 6) * 100}%"></div>
      </div>

      <div class="text-xs sm:text-sm text-slate-200">
        <span class="font-bold text-amber-300">${reaction.initiatorName}</span> baixou uma carta:
        <div class="font-title text-sm sm:text-base font-black text-pink-300 mt-1">
          ${isBluff ? `🎭 MODO BLEFE declarando ser [${declaredClass}]!` : `[${reaction.card.name}]`}
        </div>
      </div>

      ${
        !isMe
          ? `
        <div class="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
          <!-- Botão Gigante Gritar Mentira (min-h-[48px]) -->
          <button
            id="btn-challenge-bluff"
            class="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-title text-sm font-black uppercase tracking-wider transition shadow-2xl card-chunky active:scale-95 flex items-center justify-center gap-2 border-2 border-red-400"
          >
            <span>🚨</span>
            <span>GRITAR MENTIRA!</span>
          </button>
          
          <button
            id="btn-pass-reaction"
            class="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-title text-xs font-bold uppercase transition"
          >
            ✓ Deixar Passar
          </button>
        </div>

        <!-- Atalho de Modificadores de Dados -->
        ${
          modifierCards.length > 0
            ? `
          <div class="border-t border-slate-800 pt-2 space-y-1">
            <span class="text-[10px] text-slate-400 font-semibold uppercase">Jogar Modificador Rápido:</span>
            <div class="flex items-center justify-center gap-1.5 flex-wrap">
              ${modifierCards
                .map(
                  (m) => `
                <button
                  type="button"
                  data-mod-id="${m.instanceId}"
                  class="btn-quick-modifier min-h-[38px] px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/60 hover:bg-rose-900 text-rose-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <span>🎲</span>
                  <span>${m.name} (${m.bonus >= 0 ? `+${m.bonus}` : m.bonus})</span>
                </button>
              `
                )
                .join('')}
            </div>
          </div>
        `
            : ''
        }
      `
          : `
        <div class="text-xs text-amber-400/80 italic py-2">
          Aguardando a reação dos outros heróis à sua jogada...
        </div>
      `
      }
    </div>
  `;
};

// MODAL DE SELEÇÃO DE CLASSE PARA BLEFE (6 Classes)
export const renderBluffClassSelectorHTML = () => {
  return `
    <div class="space-y-3">
      <div class="text-center">
        <h4 class="font-title text-sm font-bold text-pink-300">
          Escolha a Classe a ser Declarada no Blefe
        </h4>
        <p class="text-[11px] text-slate-400 mt-0.5">
          Os outros guerreiros verão apenas a classe que você alegar!
        </p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
        ${Object.values(CLASSES)
          .map(
            (c) => `
          <button
            type="button"
            data-bluff-class="${c.id}"
            class="btn-choose-bluff-class p-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition card-chunky bg-slate-900/90 hover:scale-105"
            style="border-color: ${c.color};"
          >
            <span class="text-2xl">${c.icon}</span>
            <span class="font-title text-xs font-bold text-slate-100 mt-1">${c.name}</span>
          </button>
        `
          )
          .join('')}
      </div>
    </div>
  `;
};
