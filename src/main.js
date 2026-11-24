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
  btnOpenTutorialVideo: document.getElementById('btn-open-tutorial-video'),
  btnOpenDbConfig: document.getElementById('btn-open-db-config'),

  // Lobby
  inputNickname: document.getElementById('input-nickname'),
  leaderSelector: document.getElementById('leader-selector'),
  selectedLeaderPreview: document.getElementById('selected-leader-preview'),
  btnPlaySoloInstant: document.getElementById('btn-play-solo-instant'),
  btnPlayTutorialVideo: document.getElementById('btn-play-tutorial-video'),
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

  modalTutorialVideo: document.getElementById('modal-tutorial-video'),
  btnCloseTutorialVideo: document.getElementById('btn-close-tutorial-video'),
  tutSceneBadge: document.getElementById('tut-scene-badge'),
  tutTimestamp: document.getElementById('tut-timestamp'),
  tutStageViewport: document.getElementById('tut-stage-viewport'),
  tutSubtitle: document.getElementById('tut-subtitle'),
  tutProgressFill: document.getElementById('tut-progress-fill'),
  tutProgressContainer: document.getElementById('tut-progress-container'),
  tutBtnPrev: document.getElementById('tut-btn-prev'),
  tutBtnPlay: document.getElementById('tut-btn-play'),
  tutPlayIcon: document.getElementById('tut-play-icon'),
  tutPlayLabel: document.getElementById('tut-play-label'),
  tutBtnNext: document.getElementById('tut-btn-next'),
  tutBtnVoice: document.getElementById('tut-btn-voice'),

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
// VÍDEO TUTORIAL & SIMULAÇÃO INTERATIVA
// ==========================================
let tutSceneIndex = 0;
let tutIsPlaying = false;
let tutTimer = null;
let tutProgress = 0;
let tutVoiceEnabled = true;

const TUT_SCENES = [
  {
    title: 'Cena 1/6 • Objetivo da Partida',
    durationMs: 8000,
    text: 'Bem-vindo a Heroes Love to Lie! Para vencer, você tem duas opções: Abater 3 Monstros Lendários OU reunir 6 Heróis de classes diferentes na sua Party!',
    html: `
      <div class="flex flex-col items-center text-center space-y-3 animate-fade-in max-w-sm">
        <div class="w-14 h-14 rounded-2xl border-2 border-amber-400 bg-gradient-to-tr from-purple-900 to-pink-900 flex items-center justify-center text-3xl shadow-lg">
          🎭
        </div>
        <h3 class="font-title text-base font-black text-amber-300">DUAS FORMAS DE VENCER</h3>
        <div class="grid grid-cols-2 gap-2 w-full text-xs">
          <div class="p-2.5 rounded-xl bg-slate-950 border border-orange-500/50 text-center">
            <span class="text-2xl block">🐉</span>
            <span class="font-title text-orange-400 font-bold block mt-1">3 Monstros</span>
            <span class="text-[9px] text-slate-400">Caçador Supremo</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-pink-500/50 text-center">
            <span class="text-2xl block">👑</span>
            <span class="font-title text-pink-400 font-bold block mt-1">6 Classes</span>
            <span class="text-[9px] text-slate-400">Aliança Completa</span>
          </div>
        </div>
      </div>
    `,
  },
  {
    title: 'Cena 2/6 • Cristais de Ação (3 PA)',
    durationMs: 8000,
    text: 'A cada início de turno você recebe 3 Cristais de Ação (PA). Gaste 1 PA para comprar ou invocar, e 2 PA para atacar monstros!',
    html: `
      <div class="flex flex-col items-center text-center space-y-3 max-w-sm">
        <h3 class="font-title text-base font-black text-amber-300">SEUS 3 PONTOS DE AÇÃO</h3>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-cyan-500/50 shadow-md">💎</div>
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-cyan-500/50 shadow-md">💎</div>
          <div class="w-10 h-10 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-xl shadow-cyan-500/50 shadow-md">💎</div>
        </div>
        <div class="grid grid-cols-3 gap-1.5 w-full text-[9px] font-bold">
          <div class="p-1.5 rounded-lg bg-black/60 border border-slate-700"><span class="text-cyan-300 block">1 PA</span>Comprar</div>
          <div class="p-1.5 rounded-lg bg-black/60 border border-slate-700"><span class="text-cyan-300 block">1 PA</span>Invocar</div>
          <div class="p-1.5 rounded-lg bg-black/60 border border-amber-500/40"><span class="text-amber-400 block">2 PA</span>Atacar Monstro</div>
        </div>
      </div>
    `,
  },
  {
    title: 'Cena 3/6 • Invocação & Rolagem 2d6',
    durationMs: 8500,
    text: 'Ao invocar honestamente um herói, role 2 dados! Se tirar o valor exigido, você ativa sua habilidade especial!',
    html: `
      <div class="flex items-center justify-center gap-3 max-w-sm">
        <div class="w-28 p-2 rounded-xl bg-purple-950 border-2 border-purple-400 text-center">
          <span class="text-2xl">🧙‍♀️</span>
          <span class="font-title text-[10px] font-bold text-purple-200 block">MAGA DO VÓRTICE</span>
          <span class="px-1.5 py-0.2 rounded bg-purple-800 text-[8px] text-purple-200">7+</span>
        </div>
        <div class="flex flex-col items-center p-2 rounded-xl bg-black/60 border border-slate-700">
          <div class="flex gap-2">
            <div class="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center">4</div>
            <div class="w-9 h-9 rounded-lg bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center">5</div>
          </div>
          <span class="mt-1 text-[9px] font-bold text-emerald-400 font-title">TOTAL: 9 (Sucesso!)</span>
        </div>
      </div>
    `,
  },
  {
    title: 'Cena 4/6 • O Grande Blefe',
    durationMs: 8500,
    text: 'Não tem a classe necessária para um monstro? Você pode blefar! Jogue a carta virada para baixo e declare qualquer classe!',
    html: `
      <div class="flex flex-col items-center text-center space-y-2 max-w-sm">
        <div class="w-28 h-36 rounded-xl bg-gradient-to-br from-slate-950 to-purple-950 border-2 border-pink-500 flex flex-col items-center justify-center relative shadow-xl">
          <span class="text-3xl">🎭</span>
          <span class="font-title text-[9px] font-bold text-pink-300 mt-1">CARTA OCULTA</span>
          <div class="absolute -bottom-2 px-2 py-0.5 rounded bg-red-600 text-white font-title text-[8px] font-black uppercase">
            Declarou: GUERREIRO
          </div>
        </div>
        <p class="text-[10px] text-slate-300">Você fingiu ter a classe exigida pelo Monstro!</p>
      </div>
    `,
  },
  {
    title: 'Cena 5/6 • A Contestação: MENTIRA!',
    durationMs: 8500,
    text: 'Os oponentes têm 6 segundos para gritar MENTIRA! Se descobrirem seu blefe, você é punido; se falarem errado, eles perdem um herói!',
    html: `
      <div class="flex flex-col items-center text-center space-y-2 max-w-sm">
        <div class="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-title text-xs font-black shadow-lg flex items-center gap-1.5 animate-pulse">
          <span>🚨</span><span>MENTIRA! (Desafiar)</span>
        </div>
        <div class="p-2 rounded-xl bg-black/70 border border-red-500/30 text-left text-[10px] space-y-1">
          <p class="text-emerald-400 font-bold">✓ Se era mentira: <span class="text-slate-300 font-normal">A carta blefada é destruída!</span></p>
          <p class="text-rose-400 font-bold">✗ Se era verdade: <span class="text-slate-300 font-normal">O desafiante perde 1 herói!</span></p>
        </div>
      </div>
    `,
  },
  {
    title: 'Cena 6/6 • Caça a Monstros & Glória',
    durationMs: 8500,
    text: 'Cumpra os requisitos, gaste 2 PA e ataque o Monstro! Use cartas modificadoras (+2, +3) para garantir a vitória!',
    html: `
      <div class="flex flex-col items-center text-center space-y-2 max-w-sm">
        <div class="w-36 p-2 rounded-xl bg-slate-950 border-2 border-orange-500 text-center shadow-lg">
          <span class="text-3xl">🦖</span>
          <span class="font-title text-[10px] font-black text-orange-400 block">REX DA FENDA</span>
          <span class="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-title text-[9px] font-black uppercase mt-1 inline-block">
            🏆 MONSTRO ABATIDO!
          </span>
        </div>
        <span class="text-xs font-title font-bold text-amber-300">Troféus: 🏆 3/3 (Vitória Suprema!)</span>
      </div>
    `,
  },
];

const loadTutScene = (index) => {
  if (index < 0) index = 0;
  if (index >= TUT_SCENES.length) index = 0;
  tutSceneIndex = index;
  tutProgress = 0;
  const scene = TUT_SCENES[tutSceneIndex];

  if (DOM.tutSceneBadge) DOM.tutSceneBadge.textContent = scene.title;
  if (DOM.tutSubtitle) DOM.tutSubtitle.textContent = scene.text;
  if (DOM.tutStageViewport) DOM.tutStageViewport.innerHTML = scene.html;

  // Atualiza tabs
  document.querySelectorAll('.tut-tab').forEach((tab, i) => {
    if (i === tutSceneIndex) {
      tab.className = 'tut-tab px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30';
    } else {
      tab.className = 'tut-tab px-2 py-0.5 rounded bg-slate-800 text-slate-400';
    }
  });

  // Som & Locução
  soundManager.playCardTap();
  if (tutVoiceEnabled && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(scene.text);
    utt.lang = 'pt-BR';
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  }
};

const tutTick = () => {
  if (!tutIsPlaying) return;
  const scene = TUT_SCENES[tutSceneIndex];
  tutProgress += 150;

  const totalScenes = TUT_SCENES.length;
  const overallPercent = ((tutSceneIndex + (tutProgress / scene.durationMs)) / totalScenes) * 100;
  if (DOM.tutProgressFill) DOM.tutProgressFill.style.width = Math.min(100, overallPercent) + '%';

  const currentSeconds = Math.floor((tutSceneIndex * 15) + (tutProgress / 1000));
  const mm = String(Math.floor(currentSeconds / 60)).padStart(2, '0');
  const ss = String(currentSeconds % 60).padStart(2, '0');
  if (DOM.tutTimestamp) DOM.tutTimestamp.textContent = `${mm}:${ss} / 02:15`;

  if (tutProgress >= scene.durationMs) {
    if (tutSceneIndex < TUT_SCENES.length - 1) {
      loadTutScene(tutSceneIndex + 1);
    } else {
      loadTutScene(0);
    }
  }
};

const openTutorialModal = () => {
  DOM.modalTutorialVideo.classList.remove('hidden');
  tutIsPlaying = true;
  if (DOM.tutPlayIcon) DOM.tutPlayIcon.textContent = '⏸️';
  if (DOM.tutPlayLabel) DOM.tutPlayLabel.textContent = 'Pausar';
  loadTutScene(0);
  if (tutTimer) clearInterval(tutTimer);
  tutTimer = setInterval(tutTick, 150);
};

const closeTutorialModal = () => {
  DOM.modalTutorialVideo.classList.add('hidden');
  tutIsPlaying = false;
  if (tutTimer) clearInterval(tutTimer);
  if (window.speechSynthesis) window.speechSynthesis.cancel();
};

if (DOM.btnOpenTutorialVideo) DOM.btnOpenTutorialVideo.onclick = openTutorialModal;
if (DOM.btnPlayTutorialVideo) DOM.btnPlayTutorialVideo.onclick = openTutorialModal;
if (DOM.btnCloseTutorialVideo) DOM.btnCloseTutorialVideo.onclick = closeTutorialModal;

if (DOM.tutBtnPlay) {
  DOM.tutBtnPlay.onclick = () => {
    tutIsPlaying = !tutIsPlaying;
    DOM.tutPlayIcon.textContent = tutIsPlaying ? '⏸️' : '▶️';
    DOM.tutPlayLabel.textContent = tutIsPlaying ? 'Pausar' : 'Reproduzir';
    if (!tutIsPlaying && window.speechSynthesis) window.speechSynthesis.pause();
    if (tutIsPlaying && window.speechSynthesis) window.speechSynthesis.resume();
  };
}

if (DOM.tutBtnPrev) {
  DOM.tutBtnPrev.onclick = () => loadTutScene(tutSceneIndex - 1);
}
if (DOM.tutBtnNext) {
  DOM.tutBtnNext.onclick = () => loadTutScene(tutSceneIndex + 1);
}

document.querySelectorAll('.tut-tab').forEach((tab) => {
  tab.onclick = () => {
    const idx = parseInt(tab.getAttribute('data-tut-scene'), 10);
    loadTutScene(idx);
  };
});

if (DOM.tutBtnVoice) {
  DOM.tutBtnVoice.onclick = () => {
    tutVoiceEnabled = !tutVoiceEnabled;
    DOM.tutBtnVoice.textContent = tutVoiceEnabled ? '🎙️ Voz: Ligada' : '🔇 Voz: Desligada';
    if (!tutVoiceEnabled && window.speechSynthesis) window.speechSynthesis.cancel();
  };
}

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
