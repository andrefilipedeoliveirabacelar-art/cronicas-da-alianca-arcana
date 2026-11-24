import confetti from 'canvas-confetti';
import { PARTY_LEADERS, CLASSES } from './engine/gameCatalog.js';
import {
  createSoloGame,
  actDrawCard,
  actSummonHero,
  actAttackMonster,
  actChallengeBluff,
  actPlayModifier,
  actPlaySpell,
  actEquipItem,
  actActivateHeroAbility,
  actPassTurn,
  actDiscardAndDraw5,
} from './engine/gameLogic.js';
import { botAI } from './engine/botAI.js';
import { soundManager } from './lib/soundFX.js';
import {
  renderRivalsBarHTML,
  renderCovilHTML,
  renderDiceArenaHTML,
  renderPlayerPartyHTML,
  renderThumbZoneHTML,
  renderReactionBannerHTML,
  renderBluffClassSelectorHTML,
} from './ui/renderMesa.js';

// ==========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
let gameState = null;
let selectedLeaderId = 'leader_fighter';
let selectedCardIndex = null;
let reactionCountdownInterval = null;

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const DOM = {
  // Telas
  screenLobby: document.getElementById('screen-lobby'),
  screenMesa: document.getElementById('screen-mesa'),

  // Header
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  btnOpenRules: document.getElementById('btn-open-rules'),
  btnOpenDbConfig: document.getElementById('btn-open-db-config'),

  // Lobby
  inputNickname: document.getElementById('input-nickname'),
  leaderSelector: document.getElementById('leader-selector'),
  selectedLeaderPreview: document.getElementById('selected-leader-preview'),
  btnPlaySoloInstant: document.getElementById('btn-play-solo-instant'),
  btnToggleMultiplayer: document.getElementById('btn-toggle-multiplayer'),
  multiplayerDrawer: document.getElementById('multiplayer-drawer'),
  btnCreateRoom: document.getElementById('btn-create-room'),
  btnJoinRoom: document.getElementById('btn-join-room'),
  inputRoomCode: document.getElementById('input-room-code'),

  // Zonas da Mesa
  zoneRivalsBar: document.getElementById('zone-rivals-bar'),
  zoneCovil: document.getElementById('zone-covil'),
  zoneDiceArena: document.getElementById('zone-dice-arena'),
  zonePlayerParty: document.getElementById('zone-player-party'),
  zoneThumbControls: document.getElementById('zone-thumb-controls'),
  reactionBannerContainer: document.getElementById('reaction-banner-container'),

  // Modais
  modalCardAction: document.getElementById('modal-card-action'),
  cardActionIcon: document.getElementById('card-action-icon'),
  cardActionTitle: document.getElementById('card-action-title'),
  cardActionSubtitle: document.getElementById('card-action-subtitle'),
  cardActionDescription: document.getElementById('card-action-description'),
  cardActionButtonsContainer: document.getElementById('card-action-buttons-container'),
  btnCloseCardAction: document.getElementById('btn-close-card-action'),

  modalBluffSelector: document.getElementById('modal-bluff-selector'),
  bluffSelectorContent: document.getElementById('bluff-selector-content'),
  btnCloseBluffSelector: document.getElementById('btn-close-bluff-selector'),

  modalMonsterDetail: document.getElementById('modal-monster-detail'),
  monsterDetailIcon: document.getElementById('monster-detail-icon'),
  monsterDetailName: document.getElementById('monster-detail-name'),
  monsterDetailTitle: document.getElementById('monster-detail-title'),
  monsterDetailReqs: document.getElementById('monster-detail-reqs'),
  monsterDetailReward: document.getElementById('monster-detail-reward'),
  monsterDetailPenalty: document.getElementById('monster-detail-penalty'),
  btnConfirmMonsterAttack: document.getElementById('btn-confirm-monster-attack'),
  btnCloseMonsterDetail: document.getElementById('btn-close-monster-detail'),

  modalRivalParty: document.getElementById('modal-rival-party'),
  rivalPartyAvatar: document.getElementById('rival-party-avatar'),
  rivalPartyTitle: document.getElementById('rival-party-title'),
  rivalPartyContent: document.getElementById('rival-party-content'),
  btnCloseRivalParty: document.getElementById('btn-close-rival-party'),

  modalDiscardPile: document.getElementById('modal-discard-pile'),
  discardPileContent: document.getElementById('discard-pile-content'),
  btnCloseDiscardPile: document.getElementById('btn-close-discard-pile'),

  modalRules: document.getElementById('modal-rules'),
  btnCloseRules: document.getElementById('btn-close-rules'),
  btnCloseRulesBottom: document.getElementById('btn-close-rules-bottom'),

  modalVictory: document.getElementById('modal-victory'),
  victoryTitle: document.getElementById('victory-title'),
  victoryMessage: document.getElementById('victory-message'),
  btnPlayAgain: document.getElementById('btn-play-again'),
  btnReturnLobby: document.getElementById('btn-return-lobby'),
};

// ==========================================
// INICIALIZAÇÃO DO LOBBY
// ==========================================
const initLobby = () => {
  // Renderiza seletores dos 6 Líderes de Grupo
  DOM.leaderSelector.innerHTML = PARTY_LEADERS.map((leader) => {
    const isSelected = leader.id === selectedLeaderId;
    return `
      <button
        type="button"
        data-leader-id="${leader.id}"
        class="btn-select-leader p-1.5 rounded-xl border-2 flex flex-col items-center justify-center transition card-chunky ${
          isSelected ? 'border-amber-400 bg-amber-500/20 shadow-tavern-glow ring-2 ring-amber-400' : 'border-slate-800 bg-slate-900/90'
        }"
      >
        <span class="text-xl filter drop-shadow">${leader.avatar}</span>
        <span class="text-[9px] font-title font-bold text-slate-200 mt-0.5 truncate w-full text-center">
          ${CLASSES[leader.heroClass]?.name || leader.name}
        </span>
      </button>
    `;
  }).join('');

  updateLeaderPreview();

  // Evento de seleção de líder
  DOM.leaderSelector.querySelectorAll('.btn-select-leader').forEach((btn) => {
    btn.onclick = () => {
      selectedLeaderId = btn.getAttribute('data-leader-id');
      initLobby();
      soundManager.playCardTap();
    };
  });
};

const updateLeaderPreview = () => {
  const leader = PARTY_LEADERS.find((l) => l.id === selectedLeaderId) || PARTY_LEADERS[0];
  DOM.selectedLeaderPreview.innerHTML = `
    <div class="flex items-center justify-center gap-1.5 font-title font-bold text-amber-300">
      <span>${leader.avatar}</span>
      <span>${leader.name} (${leader.title})</span>
    </div>
    <div class="mt-0.5 text-slate-300 italic">
      "${leader.passiveDescription}"
    </div>
  `;
};

// ==========================================
// INICIAR PARTIDA SOLO (1-CLIQUE INSTANTÂNEO)
// ==========================================
DOM.btnPlaySoloInstant.onclick = () => {
  const nickname = DOM.inputNickname.value.trim() || 'Herói Audaz';
  soundManager.playPACrystal();

  gameState = createSoloGame(nickname, selectedLeaderId, 2);

  DOM.screenLobby.classList.add('hidden');
  DOM.screenMesa.classList.remove('hidden');

  renderGameMesa();
};

// ==========================================
// RENDERIZADOR PRINCIPAL DA MESA (5 ZONAS)
// ==========================================
const renderGameMesa = () => {
  if (!gameState) return;

  const humanPlayer = gameState.players.find((p) => !p.isBot) || gameState.players[0];
  const isMyTurn = gameState.turnPlayerId === humanPlayer.id;

  // Checa vitória
  if (gameState.status === 'finished' && gameState.winner) {
    showVictoryScreen(gameState.winner);
    return;
  }

  // ZONA 1: BARRA DE RIVAIS (Topo)
  DOM.zoneRivalsBar.innerHTML = renderRivalsBarHTML(gameState.players, humanPlayer.id, gameState.turnPlayerId);
  attachRivalsEvents();

  // ZONA 2: O COVIL DOS MONSTROS (Meio-Superior)
  DOM.zoneCovil.innerHTML = renderCovilHTML(
    gameState.activeMonsters,
    humanPlayer,
    gameState.mainDeck.length,
    gameState.discardPile.length
  );
  attachCovilEvents(humanPlayer);

  // ZONA 3: ARENA DE DADOS 2D6 & LOGS (Centro)
  const latestLog = gameState.logs[0];
  DOM.zoneDiceArena.innerHTML = renderDiceArenaHTML(gameState.diceState, latestLog);

  // ZONA 4: SUA PARTY NA MESA (Meio-Inferior)
  DOM.zonePlayerParty.innerHTML = renderPlayerPartyHTML(humanPlayer, isMyTurn, gameState.currentPA);
  attachPartyEvents(humanPlayer);

  // ZONA 5: BASE FIXA (MÃO EM CARROSSEL & POLEGAR)
  DOM.zoneThumbControls.innerHTML = renderThumbZoneHTML(
    humanPlayer,
    isMyTurn,
    gameState.currentPA,
    gameState.maxPA
  );
  attachThumbControlsEvents(humanPlayer, isMyTurn);

  // REAÇÃO / BLEFE FLUTUANTE ("🚨 MENTIRA!")
  if (gameState.pendingReaction) {
    DOM.reactionBannerContainer.innerHTML = renderReactionBannerHTML(
      gameState.pendingReaction,
      humanPlayer.id,
      humanPlayer.hand
    );
    attachReactionEvents(humanPlayer);
    startReactionTimer();
  } else {
    DOM.reactionBannerContainer.innerHTML = '';
    stopReactionTimer();
  }

  // Avalia IA dos Bots
  botAI.evaluate(gameState, () => {
    renderGameMesa();
  });
};

// ==========================================
// EVENTOS DAS ZONAS DA MESA
// ==========================================

// Eventos da Barra de Rivais (Zona 1)
const attachRivalsEvents = () => {
  document.querySelectorAll('.btn-open-rival-drawer').forEach((btn) => {
    btn.onclick = () => {
      const rivalId = btn.getAttribute('data-rival-id');
      const rival = gameState.players.find((p) => p.id === rivalId);
      if (rival) openRivalPartyModal(rival);
    };
  });
};

// Eventos do Covil (Zona 2)
const attachCovilEvents = (humanPlayer) => {
  document.querySelectorAll('.btn-inspect-monster').forEach((elem) => {
    elem.onclick = () => {
      const monsterId = elem.getAttribute('data-monster-id');
      const monster = gameState.activeMonsters.find((m) => m.id === monsterId);
      if (monster) openMonsterDetailModal(monster, humanPlayer);
    };
  });

  const btnDiscard = document.getElementById('btn-view-discard');
  if (btnDiscard) {
    btnDiscard.onclick = openDiscardPileModal;
  }
};

// Eventos da Party do Jogador (Zona 4)
const attachPartyEvents = (humanPlayer) => {
  document.querySelectorAll('.btn-activate-hero-ability').forEach((btn) => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const heroId = btn.getAttribute('data-activate-hero-id');
      if (actActivateHeroAbility(gameState, humanPlayer.id, heroId)) {
        renderGameMesa();
      }
    };
  });
};

// Eventos da Base Fixa / Polegar (Zona 5)
const attachThumbControlsEvents = (humanPlayer, isMyTurn) => {
  // Clicar em carta da mão abre Bottom Sheet de Ações
  document.querySelectorAll('.btn-select-hand-card').forEach((btn) => {
    btn.onclick = () => {
      const handIdx = parseInt(btn.getAttribute('data-hand-index'), 10);
      selectedCardIndex = handIdx;
      soundManager.playCardTap();
      openCardActionModal(humanPlayer, handIdx, isMyTurn);
    };
  });

  // Botão Comprar (1 PA)
  const btnDraw = document.getElementById('btn-act-draw');
  if (btnDraw) {
    btnDraw.onclick = () => {
      if (actDrawCard(gameState, humanPlayer.id)) {
        renderGameMesa();
      }
    };
  }

  // Botão Passar Turno
  const btnPass = document.getElementById('btn-act-pass');
  if (btnPass) {
    btnPass.onclick = () => {
      actPassTurn(gameState);
      renderGameMesa();
    };
  }
};

// Eventos da Janela de Reação ("🚨 MENTIRA!" e Modificadores)
const attachReactionEvents = (humanPlayer) => {
  const btnChallenge = document.getElementById('btn-challenge-bluff');
  if (btnChallenge) {
    btnChallenge.onclick = () => {
      actChallengeBluff(gameState, humanPlayer.id);
      renderGameMesa();
    };
  }

  const btnPassReaction = document.getElementById('btn-pass-reaction');
  if (btnPassReaction) {
    btnPassReaction.onclick = () => {
      gameState.pendingReaction = null;
      renderGameMesa();
    };
  }

  document.querySelectorAll('.btn-quick-modifier').forEach((btn) => {
    btn.onclick = () => {
      const modId = btn.getAttribute('data-mod-id');
      actPlayModifier(gameState, humanPlayer.id, modId, true);
      renderGameMesa();
    };
  });
};

// Timer de Reação de 6 segundos
const startReactionTimer = () => {
  if (reactionCountdownInterval) return;

  reactionCountdownInterval = setInterval(() => {
    if (!gameState || !gameState.pendingReaction) {
      stopReactionTimer();
      return;
    }

    gameState.pendingReaction.timeRemaining -= 1;

    if (gameState.pendingReaction.timeRemaining <= 0) {
      stopReactionTimer();
      gameState.pendingReaction = null;
      renderGameMesa();
    } else {
      // Atualiza texto do timer no banner
      const banner = document.getElementById('reaction-banner-container');
      if (banner) {
        banner.innerHTML = renderReactionBannerHTML(
          gameState.pendingReaction,
          gameState.players[0].id,
          gameState.players[0].hand
        );
        attachReactionEvents(gameState.players[0]);
      }
    }
  }, 1000);
};

const stopReactionTimer = () => {
  if (reactionCountdownInterval) {
    clearInterval(reactionCountdownInterval);
    reactionCountdownInterval = null;
  }
};

// ==========================================
// MODAL DE AÇÃO DA CARTA DA MÃO (BOTTOM SHEET)
// ==========================================
const openCardActionModal = (player, handIndex, isMyTurn) => {
  const card = player.hand[handIndex];
  if (!card) return;

  DOM.cardActionIcon.textContent = card.icon || '✦';
  DOM.cardActionTitle.textContent = card.name;

  let subtitle = 'Carta de Aventura';
  let desc = card.description || '';

  if (card.type === 'hero') {
    const c = CLASSES[card.heroClass] || CLASSES.fighter;
    subtitle = `Herói da Classe ${c.name} • Rolagem: ${card.rollTarget}+`;
    desc = card.abilityDescription;
  } else if (card.type === 'spell') {
    subtitle = 'Carta de Magia Arcana';
  } else if (card.type === 'item') {
    subtitle = `Item de Equipamento (+${card.bonus || 1})`;
  } else if (card.type === 'modifier') {
    subtitle = `Modificador de Dados (${card.bonus >= 0 ? `+${card.bonus}` : card.bonus})`;
  }

  DOM.cardActionSubtitle.textContent = subtitle;
  DOM.cardActionDescription.textContent = desc;

  // Botões contextuais
  let buttonsHTML = '';

  if (isMyTurn && gameState.currentPA >= 1) {
    if (card.type === 'hero') {
      buttonsHTML = `
        <button id="btn-modal-summon-honest" class="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-title text-xs font-black uppercase tracking-wider card-chunky">
          ✨ Invocar Honesto (1 PA)
        </button>
        <button id="btn-modal-summon-bluff" class="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-title text-xs font-black uppercase tracking-wider card-chunky shadow-bluff-glow">
          🎭 Blefar Classe (1 PA)
        </button>
      `;
    } else if (card.type === 'spell') {
      buttonsHTML = `
        <button id="btn-modal-play-spell" class="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-title text-xs font-black uppercase tracking-wider card-chunky">
          ⚡ Lançar Magia (1 PA)
        </button>
      `;
    } else if (card.type === 'item') {
      if (player.party.length > 0) {
        buttonsHTML = `
          <button id="btn-modal-equip-item" class="w-full py-3 rounded-xl bg-gradient-to-r from-slate-400 to-slate-600 text-slate-950 font-title text-xs font-black uppercase tracking-wider card-chunky">
            🛡️ Equipar em Herói (1 PA)
          </button>
        `;
      } else {
        buttonsHTML = `<div class="text-xs text-amber-400 text-center italic py-2">Você precisa ter ao menos 1 Herói na Party para equipar itens!</div>`;
      }
    } else if (card.type === 'modifier') {
      buttonsHTML = `
        <div class="text-xs text-slate-400 text-center italic py-2">
          Cartas Modificadoras podem ser jogadas instantaneamente durante qualquer rolagem de 2d6 na mesa!
        </div>
      `;
    }
  } else {
    buttonsHTML = `<div class="text-xs text-slate-500 text-center italic py-2">${!isMyTurn ? 'Aguarde seu turno para jogar cartas.' : 'Pontos de Ação (PA) insuficientes.'}</div>`;
  }

  DOM.cardActionButtonsContainer.innerHTML = buttonsHTML;

  // Handlers dos botões do modal
  const btnHonest = document.getElementById('btn-modal-summon-honest');
  if (btnHonest) {
    btnHonest.onclick = () => {
      DOM.modalCardAction.classList.add('hidden');
      actSummonHero(gameState, player.id, selectedCardIndex, false);
      renderGameMesa();
    };
  }

  const btnBluff = document.getElementById('btn-modal-summon-bluff');
  if (btnBluff) {
    btnBluff.onclick = () => {
      DOM.modalCardAction.classList.add('hidden');
      openBluffSelectorModal(player, selectedCardIndex);
    };
  }

  const btnSpell = document.getElementById('btn-modal-play-spell');
  if (btnSpell) {
    btnSpell.onclick = () => {
      DOM.modalCardAction.classList.add('hidden');
      actPlaySpell(gameState, player.id, selectedCardIndex);
      renderGameMesa();
    };
  }

  const btnItem = document.getElementById('btn-modal-equip-item');
  if (btnItem) {
    btnItem.onclick = () => {
      DOM.modalCardAction.classList.add('hidden');
      // Equipa no primeiro herói sem item
      const targetHero = player.party.find((h) => !h.equippedItem) || player.party[0];
      if (targetHero) {
        actEquipItem(gameState, player.id, selectedCardIndex, targetHero.instanceId);
        renderGameMesa();
      }
    };
  }

  DOM.modalCardAction.classList.remove('hidden');
};

DOM.btnCloseCardAction.onclick = () => {
  DOM.modalCardAction.classList.add('hidden');
};

// ==========================================
// MODAL SELETOR DE CLASSE PARA BLEFAR
// ==========================================
const openBluffSelectorModal = (player, handIndex) => {
  DOM.bluffSelectorContent.innerHTML = renderBluffClassSelectorHTML();

  document.querySelectorAll('.btn-choose-bluff-class').forEach((btn) => {
    btn.onclick = () => {
      const chosenClass = btn.getAttribute('data-bluff-class');
      DOM.modalBluffSelector.classList.add('hidden');
      actSummonHero(gameState, player.id, handIndex, true, chosenClass);
      renderGameMesa();
    };
  });

  DOM.modalBluffSelector.classList.remove('hidden');
};

DOM.btnCloseBluffSelector.onclick = () => {
  DOM.modalBluffSelector.classList.add('hidden');
};

// ==========================================
// MODAL DETALHES DO MONSTRO & ATAQUE (COVIL)
// ==========================================
const openMonsterDetailModal = (monster, player) => {
  DOM.monsterDetailIcon.textContent = monster.icon;
  DOM.monsterDetailName.textContent = monster.name;
  DOM.monsterDetailTitle.textContent = monster.title;

  DOM.monsterDetailReqs.innerHTML = monster.requiredClasses
    .map((c) => `
      <span class="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1">
        <span>${CLASSES[c]?.icon}</span>
        <span>${CLASSES[c]?.name}</span>
      </span>
    `)
    .join('');

  DOM.monsterDetailReward.textContent = monster.rewardDescription;
  DOM.monsterDetailPenalty.textContent = monster.penaltyDescription;

  const attackable = canAttackMonster(player, monster);
  const isMyTurn = gameState.turnPlayerId === player.id;
  const hasPA = gameState.currentPA >= 2;

  DOM.btnConfirmMonsterAttack.disabled = !attackable || !isMyTurn || !hasPA;
  if (attackable && isMyTurn && hasPA) {
    DOM.btnConfirmMonsterAttack.classList.remove('opacity-40', 'cursor-not-allowed');
  } else {
    DOM.btnConfirmMonsterAttack.classList.add('opacity-40', 'cursor-not-allowed');
  }

  DOM.btnConfirmMonsterAttack.onclick = () => {
    DOM.modalMonsterDetail.classList.add('hidden');
    actAttackMonster(gameState, player.id, monster.id);
    renderGameMesa();
  };

  DOM.modalMonsterDetail.classList.remove('hidden');
};

DOM.btnCloseMonsterDetail.onclick = () => {
  DOM.modalMonsterDetail.classList.add('hidden');
};

// ==========================================
// MODAL INSPECIONAR PARTY DO RIVAL
// ==========================================
const openRivalPartyModal = (rival) => {
  DOM.rivalPartyAvatar.textContent = rival.leader?.avatar || '👑';
  DOM.rivalPartyTitle.textContent = `Party de ${rival.nickname}`;

  const partyClasses = getPartyClasses(rival);

  DOM.rivalPartyContent.innerHTML = `
    <!-- Líder -->
    <div class="p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 space-y-1">
      <div class="flex items-center justify-between">
        <span class="font-title text-xs font-bold text-amber-300">👑 Líder: ${rival.leader.name}</span>
        <span class="text-xs">${CLASSES[rival.leader.heroClass]?.name}</span>
      </div>
      <p class="text-[11px] text-slate-300 italic">"${rival.leader.passiveDescription}"</p>
    </div>

    <!-- Classes Ativas -->
    <div class="flex items-center gap-1.5 flex-wrap pt-1">
      <span class="text-[10px] text-slate-400 font-bold uppercase">Classes Ativas (${partyClasses.length}/6):</span>
      ${partyClasses
        .map((c) => `
        <span class="px-2 py-0.5 rounded-lg border text-[10px] font-bold ${CLASSES[c]?.badgeBg || ''}">
          ${CLASSES[c]?.icon} ${CLASSES[c]?.name}
        </span>
      `)
        .join('')}
    </div>

    <!-- Heróis na Mesa -->
    <div class="space-y-1.5 pt-2">
      <div class="text-[11px] font-bold text-slate-300 uppercase">Heróis da Party (${rival.party.length}):</div>
      ${
        rival.party.length === 0
          ? `<div class="text-xs text-slate-500 italic">Nenhum herói adicional invocado.</div>`
          : rival.party
              .map((h) => {
                if (h.isBluff) {
                  return `
                    <div class="p-2 rounded-xl border border-pink-500/40 bg-pink-950/20 flex items-center justify-between text-xs">
                      <div class="flex items-center gap-2">
                        <span>🎭</span>
                        <span class="font-bold text-pink-300">[${CLASSES[h.declaredClass]?.name}]</span>
                      </div>
                      <span class="text-[9px] text-slate-400 uppercase">Blefe Oculto</span>
                    </div>
                  `;
                }
                return `
                  <div class="p-2 rounded-xl border border-slate-700 bg-slate-900/80 flex items-center justify-between text-xs">
                    <div class="flex items-center gap-2">
                      <span>${h.card.icon}</span>
                      <span class="font-bold text-slate-200">${h.card.name}</span>
                    </div>
                    <span class="text-[10px] text-amber-400 font-bold">🎲 ${h.card.rollTarget}+</span>
                  </div>
                `;
              })
              .join('')
      }
    </div>

    <!-- Monstros Abatidos -->
    <div class="space-y-1.5 pt-2">
      <div class="text-[11px] font-bold text-slate-300 uppercase">Troféus de Monstros (${rival.slainMonsters.length}/3):</div>
      ${
        rival.slainMonsters.length === 0
          ? `<div class="text-xs text-slate-500 italic">Nenhum monstro abatido ainda.</div>`
          : rival.slainMonsters
              .map((m) => `
                <div class="p-2 rounded-xl border border-emerald-500/40 bg-emerald-950/20 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span>${m.icon}</span>
                    <span class="font-bold text-emerald-300">${m.name}</span>
                  </div>
                  <span class="text-[9px] text-slate-300">${m.rewardDescription}</span>
                </div>
              `)
              .join('')
      }
    </div>
  `;

  DOM.modalRivalParty.classList.remove('hidden');
};

DOM.btnCloseRivalParty.onclick = () => {
  DOM.modalRivalParty.classList.add('hidden');
};

// ==========================================
// MODAL PILHA DE DESCARTE
// ==========================================
const openDiscardPileModal = () => {
  if (!gameState) return;

  const pile = gameState.discardPile || [];
  DOM.discardPileContent.innerHTML =
    pile.length === 0
      ? `<div class="text-center py-6 text-slate-500 italic">A pilha de descarte está vazia.</div>`
      : pile
          .slice(-15)
          .reverse()
          .map((card) => `
            <div class="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span>${card.icon || '✦'}</span>
                <span class="font-bold text-slate-300">${card.name}</span>
              </div>
              <span class="text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/50 text-slate-400">
                ${card.type}
              </span>
            </div>
          `)
          .join('');

  DOM.modalDiscardPile.classList.remove('hidden');
};

DOM.btnCloseDiscardPile.onclick = () => {
  DOM.modalDiscardPile.classList.add('hidden');
};

// ==========================================
// MODAL GRIMÓRIO / REGRAS
// ==========================================
DOM.btnOpenRules.onclick = () => {
  DOM.modalRules.classList.remove('hidden');
};

const closeRules = () => {
  DOM.modalRules.classList.add('hidden');
};
DOM.btnCloseRules.onclick = closeRules;
DOM.btnCloseRulesBottom.onclick = closeRules;

// ==========================================
// TELA DE VITÓRIA & CONFETES
// ==========================================
const showVictoryScreen = (winner) => {
  DOM.victoryTitle.textContent = `${winner.nickname} Venceu!`;
  DOM.victoryMessage.textContent =
    winner.slainMonsters.length >= 3
      ? 'Conquistou a Taverna como o Caçador Supremo ao abater 3 Monstros Lendários!'
      : 'Uniu todas as 6 Classes de Heróis na sua Party com maestria!';

  soundManager.playVictoryFanfare();
  DOM.modalVictory.classList.remove('hidden');

  // Chuva de confetes
  const end = Date.now() + 4 * 1000;
  const frame = () => {
    confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#F59E0B', '#8B5CF6', '#10B981'] });
    confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#EF4444', '#EC4899', '#06B6D4'] });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
};

DOM.btnPlayAgain.onclick = () => {
  DOM.modalVictory.classList.add('hidden');
  DOM.btnPlaySoloInstant.click();
};

DOM.btnReturnLobby.onclick = () => {
  DOM.modalVictory.classList.add('hidden');
  gameState = null;
  DOM.screenMesa.classList.add('hidden');
  DOM.screenLobby.classList.remove('hidden');
};

// ==========================================
// CONTROLE DE SOM
// ==========================================
DOM.btnToggleSound.onclick = () => {
  const isMuted = soundManager.toggleMute();
  DOM.btnToggleSound.textContent = isMuted ? '🔇' : '🔊';
};

// Alternar Gaveta Multiplayer
DOM.btnToggleMultiplayer.onclick = () => {
  DOM.multiplayerDrawer.classList.toggle('hidden');
};

// Inicializa a tela de Lobby na partida
initLobby();
