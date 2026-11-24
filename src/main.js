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
  canAttackMonster,
  calculateMonsterAttackChance,
} from './engine/gameLogic.js';
import { botAI } from './engine/botAI.js';
import { soundManager } from './lib/soundFX.js';
import {
  getSupabaseConfig,
  saveRuntimeCredentials,
  hasValidCredentials,
} from './lib/supabase.js';
import {
  renderRivalsBarHTML,
  renderCovilHTML,
  renderDiceArenaHTML,
  renderPlayerPartyHTML,
  renderThumbZoneHTML,
  renderReactionBannerHTML,
  renderBluffClassSelectorHTML,
} from './ui/renderMesa.js';
import { playerService, AVATARS, calcXPProgress } from './services/playerService.js';
import { authService } from './services/authService.js';
import { GAMES_CATALOG, CATEGORIES } from './services/platformCatalog.js';
import { CorteUI } from './games/corte/corteUI.js';
import { initCorteMatch } from './games/corte/corteLogic.js';
import { OniricoUI } from './games/onirico/oniricoUI.js';
import { initOniricoMatch } from './games/onirico/oniricoLogic.js';
import { SonhosUI } from './games/sonhos/sonhosUI.js';
import { initSonhosMatch } from './games/sonhos/sonhosLogic.js';
import { SintoniaUI } from './games/sintonia/sintoniaUI.js';
import { initSintoniaMatch } from './games/sintonia/sintoniaLogic.js';
import { JukeboxUI } from './games/jukebox/jukeboxUI.js';
import { initJukeboxMatch } from './games/jukebox/jukeboxLogic.js';
import { PalavraUI } from './games/palavra/palavraUI.js';
import { initPalavraMatch } from './games/palavra/palavraLogic.js';
import { QuemDisseUI } from './games/quemdisse/quemdisseUI.js';
import { initQuemDisseMatch } from './games/quemdisse/quemdisseLogic.js';
import { SaberUI } from './games/saber/saberUI.js';
import { initSaberMatch } from './games/saber/saberLogic.js';

// ==========================================
// ESTADO GLOBAL DA APLICAÇÃO
// ==========================================
let gameState = null;
let selectedLeaderId = 'leader_fighter';
let selectedCardIndex = null;
let reactionCountdownInterval = null;
let currentCategoryFilter = 'all';
let hubSearchQuery = '';
let activeSubgameUI = null;

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const DOM = {
  // Telas
  screenHub: document.getElementById('screen-hub'),
  screenGameContainer: document.getElementById('screen-game-container'),
  screenLobby: document.getElementById('screen-lobby'),
  screenMesa: document.getElementById('screen-mesa'),

  // Header & Hub
  btnHeaderHome: document.getElementById('btn-header-home'),
  btnPlayerPill: document.getElementById('btn-player-pill'),
  headerAvatar: document.getElementById('header-avatar'),
  headerNickname: document.getElementById('header-nickname'),
  headerLevelBadge: document.getElementById('header-level-badge'),
  btnHubQuickPlay: document.getElementById('btn-hub-quick-play'),
  btnHubProfile: document.getElementById('btn-hub-profile'),
  hubGamesGrid: document.getElementById('hub-games-grid'),
  inputHubSearch: document.getElementById('input-hub-search'),
  hubCategoryTabs: document.getElementById('hub-category-tabs'),

  // Header Controls
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  btnOpenGameLog: document.getElementById('btn-open-game-log'),
  btnOpenTutorialStep: document.getElementById('btn-open-tutorial-step'),
  btnOpenRules: document.getElementById('btn-open-rules'),
  btnOpenDbConfig: document.getElementById('btn-open-db-config'),

  // Lobby
  inputNickname: document.getElementById('input-nickname'),
  leaderSelector: document.getElementById('leader-selector'),
  selectedLeaderPreview: document.getElementById('selected-leader-preview'),
  btnPlaySoloInstant: document.getElementById('btn-play-solo-instant'),
  btnPlayTutorialStep: document.getElementById('btn-play-tutorial-step'),
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
  monsterDetailCalc: document.getElementById('monster-detail-calc'),
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

  // Modal Tutorial Interativo (6 Passos)
  modalInteractiveTutorial: document.getElementById('modal-interactive-tutorial'),
  btnCloseTutorialStep: document.getElementById('btn-close-tutorial-step'),
  tutHeaderTitle: document.getElementById('tut-header-title'),
  tutTopProgress: document.getElementById('tut-top-progress'),
  tutStepBody: document.getElementById('tut-step-body'),
  btnTutPrev: document.getElementById('btn-tut-prev'),
  btnTutNext: document.getElementById('btn-tut-next'),
  tutDots: document.getElementById('tut-dots'),

  // Modal Histórico de Ações (Log)
  modalGameLog: document.getElementById('modal-game-log'),
  btnCloseGameLog: document.getElementById('btn-close-game-log'),
  gameLogList: document.getElementById('game-log-list'),

  // Modal Configurações & Supabase
  modalDbConfig: document.getElementById('modal-db-config'),
  btnCloseDbConfig: document.getElementById('btn-close-db-config'),
  cfgStatusText: document.getElementById('cfg-status-text'),
  cfgStatusBadge: document.getElementById('cfg-status-badge'),
  cfgSupabaseUrl: document.getElementById('cfg-supabase-url'),
  cfgSupabaseKey: document.getElementById('cfg-supabase-key'),
  btnSaveDbConfig: document.getElementById('btn-save-db-config'),
  btnClearDbConfig: document.getElementById('btn-clear-db-config'),
  cfgFeedbackMsg: document.getElementById('cfg-feedback-msg'),

  modalVictory: document.getElementById('modal-victory'),
  victoryTitle: document.getElementById('victory-title'),
  victoryMessage: document.getElementById('victory-message'),
  btnPlayAgain: document.getElementById('btn-play-again'),
  btnReturnLobby: document.getElementById('btn-return-lobby'),

  // Modal Perfil & Níveis
  modalPlayerProfile: document.getElementById('modal-player-profile'),
  btnClosePlayerProfile: document.getElementById('btn-close-player-profile'),
  profileModalAvatarDisplay: document.getElementById('profile-modal-avatar-display'),
  profileModalNickname: document.getElementById('profile-modal-nickname'),
  profileModalLevelPill: document.getElementById('profile-modal-level-pill'),
  profileModalTitle: document.getElementById('profile-modal-title'),
  profileModalXpText: document.getElementById('profile-modal-xp-text'),
  profileModalXpPercent: document.getElementById('profile-modal-xp-percent'),
  profileModalXpBar: document.getElementById('profile-modal-xp-bar'),
  profileAvatarsGrid: document.getElementById('profile-avatars-grid'),
  profileInputNickname: document.getElementById('profile-input-nickname'),
  btnProfileSaveName: document.getElementById('btn-profile-save-name'),
  profileStatMatches: document.getElementById('profile-stat-matches'),
  profileStatWins: document.getElementById('profile-stat-wins'),
  profileStatWinrate: document.getElementById('profile-stat-winrate'),
  profileStatStreak: document.getElementById('profile-stat-streak'),
  profileGamesProgressList: document.getElementById('profile-games-progress-list'),
  btnProfileResetStats: document.getElementById('btn-profile-reset-stats'),

  // Modal Fase 2
  modalPhase2Preview: document.getElementById('modal-phase2-preview'),
  phase2Icon: document.getElementById('phase2-icon'),
  phase2Name: document.getElementById('phase2-name'),
  phase2Subtitle: document.getElementById('phase2-subtitle'),
  phase2Desc: document.getElementById('phase2-desc'),
  btnClosePhase2: document.getElementById('btn-close-phase2'),

  // Mobile Bottom Nav
  mobileNavBar: document.getElementById('mobile-nav-bar'),
  navBtnHub: document.getElementById('nav-btn-hub'),
  navBtnCronicas: document.getElementById('nav-btn-cronicas'),
  navBtnLevels: document.getElementById('nav-btn-levels'),
  navBtnProfile: document.getElementById('nav-btn-profile'),

  // Auth & Master
  btnOpenMaster: document.getElementById('btn-open-master'),
  btnOpenAuth: document.getElementById('btn-open-auth'),

  // Modal Auth
  modalAuth: document.getElementById('modal-auth'),
  btnCloseAuth: document.getElementById('btn-close-auth'),
  tabAuthLogin: document.getElementById('tab-auth-login'),
  tabAuthRegister: document.getElementById('tab-auth-register'),
  tabAuthForgot: document.getElementById('tab-auth-forgot'),
  authViewLogin: document.getElementById('auth-panel-login'),
  authViewRegister: document.getElementById('auth-panel-register'),
  authViewForgot: document.getElementById('auth-panel-forgot'),
  authViewReset: document.getElementById('auth-panel-reset'),
  authErrorMsg: document.getElementById('auth-feedback-msg'),
  loginEmail: document.getElementById('login-email'),
  loginPassword: document.getElementById('login-password'),
  btnSubmitLogin: document.getElementById('btn-submit-login'),
  btnLoginGuest: document.getElementById('btn-login-guest'),
  btnGotoForgot: document.getElementById('btn-goto-forgot'),
  regName: document.getElementById('reg-name'),
  regEmail: document.getElementById('reg-email'),
  regPassword: document.getElementById('reg-password'),
  regPasswordConfirm: document.getElementById('reg-password-confirm'),
  regLgpdCheckbox: document.getElementById('reg-lgpd-checkbox'),
  btnOpenLgpdTerms: document.getElementById('btn-open-lgpd-terms'),
  btnSubmitRegister: document.getElementById('btn-submit-register'),
  forgotEmail: document.getElementById('forgot-email'),
  btnSubmitForgot: document.getElementById('btn-submit-forgot'),
  forgotFeedbackBox: document.getElementById('forgot-feedback-box'),
  btnOpenResetFlow: document.getElementById('btn-open-reset-flow'),
  resetNewPassword: document.getElementById('reset-new-password'),
  btnSubmitNewPassword: document.getElementById('btn-submit-new-password'),

  // Modal LGPD Terms
  modalLgpdTerms: document.getElementById('modal-lgpd-terms'),
  btnCloseLgpdTerms: document.getElementById('btn-close-lgpd-terms'),
  btnAcceptLgpdTerms: document.getElementById('btn-accept-lgpd-terms'),

  // Modal Master Panel
  modalMasterPanel: document.getElementById('modal-master-panel'),
  btnCloseMasterPanel: document.getElementById('btn-close-master-panel'),
  masterUsersList: document.getElementById('master-users-list'),
  masterUserCount: document.getElementById('master-user-count'),

  // LGPD Art 18 no Perfil
  btnProfileDeleteAccount: document.getElementById('btn-profile-delete-account'),
};

// ==========================================
// CONTROLADOR DA PLATAFORMA ARCANA TABLE
// ==========================================
export const switchView = (viewName) => {
  if (DOM.screenHub) DOM.screenHub.classList.add('hidden');
  if (DOM.screenLobby) DOM.screenLobby.classList.add('hidden');
  if (DOM.screenMesa) DOM.screenMesa.classList.add('hidden');
  if (DOM.screenGameContainer) DOM.screenGameContainer.classList.add('hidden');

  if (activeSubgameUI && viewName !== 'game-container') {
    activeSubgameUI.destroy();
    activeSubgameUI = null;
  }

  if (viewName === 'hub') {
    if (DOM.screenHub) DOM.screenHub.classList.remove('hidden');
    updateHeaderProfilePill();
    renderHubGames();
  } else if (viewName === 'cronicas-lobby') {
    if (DOM.screenLobby) DOM.screenLobby.classList.remove('hidden');
    initLobby();
  } else if (viewName === 'cronicas-mesa') {
    if (DOM.screenMesa) DOM.screenMesa.classList.remove('hidden');
  } else if (viewName === 'game-container') {
    if (DOM.screenGameContainer) DOM.screenGameContainer.classList.remove('hidden');
  }
};

export const launchCorteGame = () => {
  switchView('game-container');
  const player = playerService.getProfile();
  const match = initCorteMatch(player, 3);
  activeSubgameUI = new CorteUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchOniricoGame = () => {
  switchView('game-container');
  const player = playerService.getProfile();
  const match = initOniricoMatch(player, 3);
  activeSubgameUI = new OniricoUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchSonhosGame = () => {
  switchView('game-container');
  const player = playerService.getProfile();
  const match = initSonhosMatch(player, 3);
  activeSubgameUI = new SonhosUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchSintoniaGame = () => {
  switchView('game-container');
  const player = playerService.getProfile();
  const match = initSintoniaMatch(player);
  activeSubgameUI = new SintoniaUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchJukeboxGame = () => {
  switchView('game-container');
  const match = initJukeboxMatch();
  activeSubgameUI = new JukeboxUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchPalavraGame = () => {
  switchView('game-container');
  const match = initPalavraMatch();
  activeSubgameUI = new PalavraUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchQuemDisseGame = () => {
  switchView('game-container');
  const match = initQuemDisseMatch();
  activeSubgameUI = new QuemDisseUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const launchSaberGame = () => {
  switchView('game-container');
  const player = playerService.getProfile();
  const match = initSaberMatch(player, 3);
  activeSubgameUI = new SaberUI(DOM.screenGameContainer, playerService, () => switchView('hub'));
  activeSubgameUI.start(match);
};

export const updateHeaderProfilePill = () => {
  const profile = playerService.getProfile();
  const session = authService.getCurrentSession();

  const currentAvatar = (session && session.avatar) || profile.avatar || '🧙‍♂️';
  const currentNickname = (session && session.nickname) || profile.nickname || 'Jogador';

  if (DOM.headerAvatar) DOM.headerAvatar.textContent = currentAvatar;
  if (DOM.headerNickname) DOM.headerNickname.textContent = currentNickname;

  if (DOM.headerLevelBadge) {
    if (session && session.role === 'master') {
      DOM.headerLevelBadge.textContent = '👑 MASTER';
      DOM.headerLevelBadge.className = 'text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40';
    } else {
      DOM.headerLevelBadge.textContent = `Nv. ${profile.globalLevel || 1}`;
      DOM.headerLevelBadge.className = 'text-[9px] font-black uppercase tracking-wider text-amber-400 bg-black/40 px-1.5 py-0.5 rounded';
    }
  }

  // Visibilidade do Botão Painel Master
  if (DOM.btnOpenMaster) {
    if (authService.isMaster()) {
      DOM.btnOpenMaster.classList.remove('hidden');
    } else {
      DOM.btnOpenMaster.classList.add('hidden');
    }
  }

  // Botão Entrar / Sair no Header
  if (DOM.btnOpenAuth) {
    if (session && !session.isGuest) {
      DOM.btnOpenAuth.textContent = '🚪 Sair';
      DOM.btnOpenAuth.title = `Conectado como ${session.email}`;
    } else {
      DOM.btnOpenAuth.textContent = '🔑 Entrar';
      DOM.btnOpenAuth.title = 'Entrar ou Cadastrar-se';
    }
  }
};

export const renderHubGames = () => {
  if (!DOM.hubGamesGrid) return;
  const profile = playerService.getProfile();

  const filtered = GAMES_CATALOG.filter((game) => {
    const matchesCategory = currentCategoryFilter === 'all' || game.category === currentCategoryFilter;
    const matchesQuery = !hubSearchQuery || game.name.toLowerCase().includes(hubSearchQuery.toLowerCase()) || game.subtitle.toLowerCase().includes(hubSearchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  DOM.hubGamesGrid.innerHTML = filtered.map((game) => {
    const gameStat = profile.gameStats[game.id] || { level: 1, xp: 0, matches: 0, wins: 0 };
    const isPlayable = game.status === 'playable';

    return `
      <div class="rounded-3xl p-4 sm:p-5 border-2 border-slate-800 bg-gradient-to-b ${game.bgGradient} hover:border-amber-500/50 shadow-xl flex flex-col justify-between transition-all transform hover:-translate-y-1">
        <div class="space-y-3">
          <!-- Topo do Card -->
          <div class="flex items-start justify-between">
            <span class="text-3xl sm:text-4xl filter drop-shadow">${game.icon}</span>
            <div class="flex items-center gap-1.5">
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black border ${game.badgeColor}">
                ${game.badge}
              </span>
              <span class="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-950/80 text-amber-300 border border-slate-700">
                Nv. ${gameStat.level}
              </span>
            </div>
          </div>

          <!-- Título e Subtítulo -->
          <div>
            <h3 class="font-title text-base sm:text-lg font-black text-slate-100 leading-tight">
              ${game.name}
            </h3>
            <p class="text-[11px] text-amber-400 font-semibold mt-0.5">
              ${game.subtitle}
            </p>
            <span class="inline-block text-[9px] text-purple-300/80 font-mono mt-0.5">
              Ref: ${game.inspiredBy}
            </span>
          </div>

          <p class="text-xs text-slate-300 leading-relaxed line-clamp-3">
            ${game.description}
          </p>

          <!-- Metadados -->
          <div class="flex items-center gap-2 text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
            <span>👥 ${game.minPlayers}-${game.maxPlayers} Jogadores</span>
            <span>•</span>
            <span>⏱️ ~${game.estimatedMinutes} min</span>
            <span>•</span>
            <span>⚡ ${game.difficulty}</span>
          </div>
        </div>

        <!-- Botões de Ação do Jogo -->
        <div class="pt-4 space-y-1.5">
          ${
            isPlayable
              ? `
            <button
              data-game-id="${game.id}"
              class="btn-play-game-solo w-full min-h-[44px] py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-title text-xs font-black shadow-md shadow-amber-500/20 uppercase tracking-wider transition transform active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>⚔️</span>
              <span>Jogar Solo (vs Bots)</span>
            </button>
            <button
              data-game-id="${game.id}"
              class="btn-play-game-multi w-full py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-amber-300 font-title text-[10px] font-bold border border-slate-800 transition"
            >
              👑 Criar / Entrar em Sala
            </button>
          `
              : `
            <button
              data-game-id="${game.id}"
              class="btn-preview-phase2 w-full min-h-[44px] py-2.5 px-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 font-title text-xs font-bold border border-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <span>🔔</span>
              <span>Em Breve (Fase 2)</span>
            </button>
          `
          }
        </div>
      </div>
    `;
  }).join('');

  // Eventos de clique nos cards
  DOM.hubGamesGrid.querySelectorAll('.btn-play-game-solo').forEach((btn) => {
    btn.onclick = () => {
      const gId = btn.getAttribute('data-game-id');
      soundManager.playCardTap();
      if (gId === 'cronicas') switchView('cronicas-lobby');
      else if (gId === 'corte') launchCorteGame();
      else if (gId === 'onirico') launchOniricoGame();
      else if (gId === 'sonhos') launchSonhosGame();
      else if (gId === 'sintonia') launchSintoniaGame();
      else if (gId === 'jukebox') launchJukeboxGame();
      else if (gId === 'palavra') launchPalavraGame();
      else if (gId === 'quemdisse') launchQuemDisseGame();
      else if (gId === 'saber') launchSaberGame();
    };
  });

  DOM.hubGamesGrid.querySelectorAll('.btn-play-game-multi').forEach((btn) => {
    btn.onclick = () => {
      const gId = btn.getAttribute('data-game-id');
      soundManager.playCardTap();
      if (gId === 'cronicas') {
        switchView('cronicas-lobby');
        DOM.multiplayerDrawer.classList.remove('hidden');
      } else {
        if (gId === 'corte') launchCorteGame();
        else if (gId === 'onirico') launchOniricoGame();
        else if (gId === 'sonhos') launchSonhosGame();
        else if (gId === 'sintonia') launchSintoniaGame();
        else if (gId === 'jukebox') launchJukeboxGame();
        else if (gId === 'palavra') launchPalavraGame();
        else if (gId === 'quemdisse') launchQuemDisseGame();
        else if (gId === 'saber') launchSaberGame();
      }
    };
  });

  DOM.hubGamesGrid.querySelectorAll('.btn-preview-phase2').forEach((btn) => {
    btn.onclick = () => {
      const gId = btn.getAttribute('data-game-id');
      const game = GAMES_CATALOG.find((g) => g.id === gId);
      if (game) openPhase2PreviewModal(game);
    };
  });
};

export const openPhase2PreviewModal = (game) => {
  if (!DOM.modalPhase2Preview) return;
  DOM.phase2Icon.textContent = game.icon;
  DOM.phase2Name.textContent = game.name;
  DOM.phase2Subtitle.textContent = `${game.subtitle} (Inspirado em ${game.inspiredBy})`;
  DOM.phase2Desc.textContent = game.description;
  DOM.modalPhase2Preview.classList.remove('hidden');
};

export const openPlayerProfileModal = () => {
  if (!DOM.modalPlayerProfile) return;
  const profile = playerService.getProfile();
  const session = authService.getCurrentSession();
  const xpProg = calcXPProgress(profile.globalXP || 0);

  DOM.profileModalAvatarDisplay.textContent = (session && session.avatar) || profile.avatar || '🧙‍♂️';
  DOM.profileModalNickname.textContent = (session && session.nickname) || profile.nickname || 'Jogador';
  
  if (session && session.role === 'master') {
    DOM.profileModalLevelPill.textContent = '👑 MASTER';
    DOM.profileModalLevelPill.className = 'text-xs font-black uppercase text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/40';
  } else {
    DOM.profileModalLevelPill.textContent = `Nv. ${profile.globalLevel || 1}`;
    DOM.profileModalLevelPill.className = 'text-xs font-black uppercase text-amber-400 bg-black/50 px-2.5 py-0.5 rounded-full border border-amber-500/30';
  }

  if (session && !session.isGuest) {
    DOM.profileModalTitle.textContent = `${profile.title || 'Iniciado Arcano'} • ${session.email}`;
  } else {
    DOM.profileModalTitle.textContent = `${profile.title || 'Iniciado Arcano'} • Modo Visitante`;
  }

  DOM.profileModalXpText.textContent = `${profile.globalXP || 0} / ${xpProg.nextLevelXP} XP`;
  DOM.profileModalXpPercent.textContent = `${xpProg.percent}%`;
  DOM.profileModalXpBar.style.width = `${xpProg.percent}%`;
  DOM.profileInputNickname.value = (session && session.nickname) || profile.nickname || '';

  // Estatísticas Globais
  DOM.profileStatMatches.textContent = profile.totalMatches || 0;
  DOM.profileStatWins.textContent = profile.totalWins || 0;
  const wr = profile.totalMatches > 0 ? Math.round((profile.totalWins / profile.totalMatches) * 100) : 0;
  DOM.profileStatWinrate.textContent = `${wr}%`;
  DOM.profileStatStreak.textContent = profile.winStreak || 0;

  // Grid de Avatares
  DOM.profileAvatarsGrid.innerHTML = AVATARS.map((av) => {
    const isSelected = av.emoji === profile.avatar;
    return `
      <button data-avatar="${av.emoji}" class="btn-select-profile-avatar p-2 rounded-xl border-2 flex items-center justify-center text-xl transition ${
        isSelected ? 'border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400' : 'border-slate-800 bg-black/40 hover:bg-slate-800'
      }">
        ${av.emoji}
      </button>
    `;
  }).join('');

  DOM.profileAvatarsGrid.querySelectorAll('.btn-select-profile-avatar').forEach((btn) => {
    btn.onclick = () => {
      const chosenAvatar = btn.getAttribute('data-avatar');
      playerService.updateProfile({ avatar: chosenAvatar });
      openPlayerProfileModal();
      updateHeaderProfilePill();
      soundManager.playCardTap();
    };
  });

  // Lista de Progresso dos 9 Jogos
  DOM.profileGamesProgressList.innerHTML = GAMES_CATALOG.map((game) => {
    const stat = profile.gameStats[game.id] || { level: 1, xp: 0, matches: 0, wins: 0 };
    const gProg = calcXPProgress(stat.xp || 0);

    return `
      <div class="p-2.5 rounded-xl bg-black/40 border border-slate-800 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">${game.icon}</span>
          <div>
            <p class="font-bold text-slate-200 leading-tight">${game.name}</p>
            <p class="text-[10px] text-slate-400">${stat.matches} partidas • ${stat.wins} vitórias</p>
          </div>
        </div>
        <div class="text-right w-24">
          <span class="text-xs font-black text-amber-400">Nv. ${stat.level}</span>
          <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-1">
            <div class="h-full bg-amber-500" style="width: ${gProg.percent}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  DOM.modalPlayerProfile.classList.remove('hidden');
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
      const rx = gameState.pendingReaction;
      if (rx && rx.isBluff) {
        const initiator = gameState.players.find((p) => p.id === rx.initiatorId);
        if (initiator && initiator.leader?.id === 'leader_thief') {
          if (gameState.mainDeck.length > 0) {
            initiator.hand.push(gameState.mainDeck.pop());
            gameState.logs.unshift({
              text: `🤫 Sombra de Velka: Ninguém desconfiou do blefe de ${initiator.nickname}! Comprou 1 carta grátis.`,
              type: 'bluff',
            });
          }
        }
      }
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
      const rx = gameState.pendingReaction;
      stopReactionTimer();
      // Passiva do Líder Ladino (Sombra de Velka): compra 1 carta se ninguém gritar MENTIRA
      if (rx && rx.isBluff) {
        const initiator = gameState.players.find((p) => p.id === rx.initiatorId);
        if (initiator && initiator.leader?.id === 'leader_thief') {
          if (gameState.mainDeck.length > 0) {
            initiator.hand.push(gameState.mainDeck.pop());
            gameState.logs.unshift({
              text: `🤫 Sombra de Velka: Ninguém desconfiou do blefe de ${initiator.nickname}! Comprou 1 carta grátis.`,
              type: 'bluff',
            });
          }
        }
      }
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
        <button id="btn-modal-summon-honest" class="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-title text-xs sm:text-sm font-black uppercase tracking-wider card-chunky shadow-lg flex items-center justify-center gap-2">
          <span>✨</span>
          <span>Invocar Honesto (1 PA)</span>
        </button>
        <button id="btn-modal-summon-bluff" class="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-title text-xs sm:text-sm font-black uppercase tracking-wider card-chunky shadow-bluff-glow flex items-center justify-center gap-2">
          <span>🎭</span>
          <span>Blefar Classe (1 PA)</span>
        </button>
      `;
    } else if (card.type === 'spell') {
      buttonsHTML = `
        <button id="btn-modal-play-spell" class="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-title text-xs sm:text-sm font-black uppercase tracking-wider card-chunky shadow-lg flex items-center justify-center gap-2">
          <span>⚡</span>
          <span>Usar Carta de Magia (1 PA)</span>
        </button>
      `;
    } else if (card.type === 'item') {
      if (player.party.length > 0) {
        buttonsHTML = `
          <button id="btn-modal-equip-item" class="w-full min-h-[48px] py-3 rounded-2xl bg-gradient-to-r from-slate-400 to-slate-600 hover:from-slate-300 hover:to-slate-500 text-slate-950 font-title text-xs sm:text-sm font-black uppercase tracking-wider card-chunky shadow-lg flex items-center justify-center gap-2">
            <span>🛡️</span>
            <span>Equipar Item em Herói (1 PA)</span>
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

  buttonsHTML += `
    <button id="btn-modal-close-sheet" class="w-full min-h-[44px] py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-title text-xs font-bold uppercase tracking-wider transition">
      Fechar
    </button>
  `;

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

  const btnCloseSheet = document.getElementById('btn-modal-close-sheet');
  if (btnCloseSheet) {
    btnCloseSheet.onclick = () => {
      DOM.modalCardAction.classList.add('hidden');
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

  // Calculadora de Chance de Sucesso da Rolagem
  const calc = calculateMonsterAttackChance(player, monster);
  if (DOM.monsterDetailCalc) {
    DOM.monsterDetailCalc.innerHTML = `
      <div class="flex items-center justify-between text-xs">
        <span>Bônus da Party/Líder: <strong class="text-amber-300 font-bold">+${calc.bonus}</strong></span>
        <span>Meta no dado: <strong class="text-emerald-400 font-black">${calc.neededOnDice}+</strong></span>
      </div>
      <div class="text-[11px] text-slate-300 font-medium mt-1">
        Probabilidade de Sucesso: <strong class="text-emerald-300 font-black text-xs">${calc.pct}%</strong>
      </div>
    `;
  }

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
// TUTORIAL INTERATIVO EM 6 ETAPAS (ONBOARDING MOBILE)
// ==========================================
let tutCurrentStep = 0;

const TUTORIAL_STEPS = [
  {
    step: 1,
    title: 'Objetivo da Batalha',
    render: () => `
      <div class="space-y-3.5">
        <div class="w-14 h-14 mx-auto rounded-2xl border-2 border-amber-400 bg-gradient-to-tr from-purple-900 to-pink-900 flex items-center justify-center text-3xl shadow-lg">
          👑
        </div>
        <h4 class="font-title text-base font-black text-amber-300">
          COMO VENCER A PARTIDA
        </h4>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="p-3 rounded-2xl bg-slate-950 border-2 border-orange-500/60 flex flex-col items-center text-center shadow-md">
            <span class="text-3xl mb-1">🐉</span>
            <span class="font-title text-orange-400 font-bold">ROTA 1</span>
            <span class="font-black text-white text-[11px] mt-0.5">3 Monstros</span>
            <span class="text-[9px] text-slate-400 mt-1">Abata 3 feras épicas no Covil</span>
          </div>
          <div class="p-3 rounded-2xl bg-slate-950 border-2 border-pink-500/60 flex flex-col items-center text-center shadow-md">
            <span class="text-3xl mb-1">⚔️</span>
            <span class="font-title text-pink-400 font-bold">ROTA 2</span>
            <span class="font-black text-white text-[11px] mt-0.5">6 Classes</span>
            <span class="text-[9px] text-slate-400 mt-1">Reúna 6 heróis diferentes na Party</span>
          </div>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Você começa a partida com seu <strong>Líder de Grupo</strong> na mesa e <strong>5 cartas</strong> na mão!
        </p>
      </div>
    `,
  },
  {
    step: 2,
    title: 'Os 3 Pontos de Ação (PA)',
    render: () => `
      <div class="space-y-3.5">
        <div class="flex items-center justify-center gap-3 py-1">
          <div class="w-12 h-12 rounded-2xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-2xl shadow-cyan-500/50 shadow-md">💎</div>
          <div class="w-12 h-12 rounded-2xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-2xl shadow-cyan-500/50 shadow-md">💎</div>
          <div class="w-12 h-12 rounded-2xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-2xl shadow-cyan-500/50 shadow-md">💎</div>
        </div>
        <h4 class="font-title text-sm font-bold text-cyan-300">
          SEUS 3 CRISTAIS DE AÇÃO (PA)
        </h4>
        <div class="grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-200">
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-center">
            <span class="text-cyan-300 block text-xs font-black">1 PA</span>
            <span>Comprar Carta</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-center">
            <span class="text-cyan-300 block text-xs font-black">1 PA</span>
            <span>Invocar Herói</span>
          </div>
          <div class="p-2.5 rounded-xl bg-slate-950 border border-amber-500/50 text-center">
            <span class="text-amber-400 block text-xs font-black">2 PA</span>
            <span>Atacar Monstro</span>
          </div>
        </div>
        <div class="p-2.5 rounded-xl bg-purple-950/50 border border-purple-500/30 text-xs text-purple-200 text-left">
          💡 <strong>Manobra Tática:</strong> Com 3 PA você pode descartar toda a sua mão e puxar 5 novas cartas do baralho!
        </div>
      </div>
    `,
  },
  {
    step: 3,
    title: 'Habilidades & Dados 2d6',
    render: () => `
      <div class="space-y-3.5">
        <div class="flex items-center justify-center gap-3">
          <div class="w-28 p-2.5 rounded-2xl bg-purple-950 border-2 border-purple-400 text-center shadow-lg">
            <span class="text-3xl block">🧙‍♀️</span>
            <span class="font-title text-[10px] font-bold text-purple-200 block">Maga do Vórtice</span>
            <span class="px-2 py-0.5 rounded bg-purple-800 text-[9px] text-purple-300 font-bold mt-1 inline-block">Meta: 7+</span>
          </div>
          <div class="flex flex-col items-center p-3 rounded-2xl bg-black/60 border border-slate-700">
            <span class="text-[10px] text-slate-400 font-bold mb-1">ROLAGEM 2d6</span>
            <div class="flex gap-2">
              <div class="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">4</div>
              <div class="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 font-black text-xl flex items-center justify-center shadow-md">5</div>
            </div>
            <span class="text-xs font-bold text-emerald-400 font-title mt-1.5">TOTAL: 9 (Sucesso!)</span>
          </div>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Ao invocar honestamente um Herói (face aberta), você rola 2d6 gratuitamente! Se atingir a meta da carta (7+), a habilidade especial é ativada na hora!
        </p>
      </div>
    `,
  },
  {
    step: 4,
    title: 'A Arte do Blefe',
    render: () => `
      <div class="space-y-3.5">
        <div class="relative w-32 h-44 mx-auto rounded-2xl bg-gradient-to-br from-slate-950 to-purple-950 border-2 border-pink-500 flex flex-col items-center justify-center shadow-2xl">
          <span class="text-4xl">🎭</span>
          <span class="font-title text-xs font-bold text-pink-300 mt-2">CARTA OCULTA</span>
          <div class="absolute -bottom-2.5 px-3 py-1 rounded-full bg-red-600 text-white font-title text-[9px] font-black uppercase tracking-wider shadow-md">
            Alegou: GUERREIRO
          </div>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">
          Precisa de um Guerreiro para atacar o Dragão mas só tem um Bardo na mão? Baixe a carta virada para baixo em <strong>Modo Blefe</strong> e declare ser a classe que desejar!
        </p>
      </div>
    `,
  },
  {
    step: 5,
    title: 'Gritar "MENTIRA!"',
    render: () => `
      <div class="space-y-3.5">
        <div class="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 text-white font-title text-sm font-black shadow-xl flex items-center justify-center gap-2 max-w-xs mx-auto animate-pulse">
          <span>🚨</span>
          <span>GRITAR MENTIRA!</span>
        </div>
        <div class="p-3 rounded-2xl bg-black/70 border border-red-500/40 text-left text-xs space-y-2">
          <div class="text-emerald-400 font-bold">
            ✓ Se o jogador estiver mentindo:
            <span class="text-slate-300 block font-normal text-[11px] mt-0.5">
              O blefe é desmascarado! A carta é destruída e o mentiroso perde 1 PA.
            </span>
          </div>
          <div class="text-rose-400 font-bold border-t border-slate-800 pt-1.5">
            ✗ Se o jogador falou a verdade:
            <span class="text-slate-300 block font-normal text-[11px] mt-0.5">
              O acusador é punido por falso testemunho e descarta 2 cartas da mão!
            </span>
          </div>
        </div>
      </div>
    `,
  },
  {
    step: 6,
    title: 'Mini-Desafio Prático',
    render: () => `
      <div class="space-y-3.5">
        <div class="p-3 rounded-2xl bg-slate-950 border-2 border-orange-500 max-w-xs mx-auto text-center space-y-1.5 shadow-lg">
          <span class="text-3xl block">🐉</span>
          <h5 class="font-title text-xs font-black text-orange-400">HIDRA DE CRISTAL</h5>
          <span class="px-2 py-0.5 rounded bg-orange-950 text-[10px] text-orange-300 font-bold inline-block">Meta no 2d6: 8+</span>
          <div id="tut-challenge-result" class="text-xs font-bold text-amber-300 py-1">
            Toque abaixo para testar sua sorte no combate!
          </div>
        </div>

        <button
          id="btn-tut-roll-challenge"
          class="w-full min-h-[48px] py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-title text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
        >
          <span>⚔️</span>
          <span>Atacar Hidra (2 PA)</span>
        </button>
      </div>
    `,
  },
];

const renderTutStep = (index) => {
  if (index < 0) index = 0;
  if (index >= TUTORIAL_STEPS.length) index = TUTORIAL_STEPS.length - 1;
  tutCurrentStep = index;
  const stepObj = TUTORIAL_STEPS[tutCurrentStep];

  if (DOM.tutHeaderTitle) {
    DOM.tutHeaderTitle.textContent = `Como Jogar • Passo ${stepObj.step} de 6: ${stepObj.title}`;
  }
  if (DOM.tutTopProgress) {
    DOM.tutTopProgress.style.width = `${((tutCurrentStep + 1) / 6) * 100}%`;
  }
  if (DOM.tutStepBody) {
    DOM.tutStepBody.innerHTML = stepObj.render();
  }

  // Atualiza bolinhas
  if (DOM.tutDots) {
    DOM.tutDots.innerHTML = TUTORIAL_STEPS.map((_, i) => `
      <span class="w-2.5 h-2.5 rounded-full transition ${
        i === tutCurrentStep ? 'bg-amber-400 scale-125' : 'bg-slate-700'
      }"></span>
    `).join('');
  }

  // Botões
  if (DOM.btnTutPrev) {
    DOM.btnTutPrev.disabled = tutCurrentStep === 0;
    DOM.btnTutPrev.className = `min-h-[44px] px-3.5 py-2 rounded-xl text-slate-300 font-title text-xs font-bold transition ${
      tutCurrentStep === 0 ? 'opacity-30 cursor-not-allowed bg-slate-900' : 'bg-slate-800 hover:bg-slate-700'
    }`;
  }

  if (DOM.btnTutNext) {
    if (tutCurrentStep === TUTORIAL_STEPS.length - 1) {
      DOM.btnTutNext.textContent = '⚔️ Começar Partida!';
    } else {
      DOM.btnTutNext.textContent = 'Próximo →';
    }
  }

  // Handler do mini-desafio no Passo 6
  if (tutCurrentStep === 5) {
    const btnChallenge = document.getElementById('btn-tut-roll-challenge');
    if (btnChallenge) {
      btnChallenge.onclick = () => {
        soundManager.playDiceRoll();
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const total = d1 + d2;
        const resultEl = document.getElementById('tut-challenge-result');
        if (resultEl) {
          if (total >= 8) {
            soundManager.playMonsterSlay();
            resultEl.innerHTML = `🎲 Rolou [${d1}] + [${d2}] = <span class="text-emerald-400 font-black text-sm">${total}</span>! 🏆 <span class="text-emerald-300">MONSTRO ABATIDO! Você está pronto para triunfar na Taverna!</span>`;
          } else {
            soundManager.playCardTap();
            resultEl.innerHTML = `🎲 Rolou [${d1}] + [${d2}] = <span class="text-rose-400 font-black text-sm">${total}</span>. Quase! Use cartas Modificadoras (+2) na partida real para garantir a vitória!`;
          }
        }
      };
    }
  }
};

const openTutorialStepModal = () => {
  renderTutStep(0);
  DOM.modalInteractiveTutorial.classList.remove('hidden');
};

const closeTutorialStepModal = () => {
  DOM.modalInteractiveTutorial.classList.add('hidden');
};

if (DOM.btnOpenTutorialStep) DOM.btnOpenTutorialStep.onclick = openTutorialStepModal;
if (DOM.btnPlayTutorialStep) DOM.btnPlayTutorialStep.onclick = openTutorialStepModal;
if (DOM.btnCloseTutorialStep) DOM.btnCloseTutorialStep.onclick = closeTutorialStepModal;

if (DOM.btnTutPrev) {
  DOM.btnTutPrev.onclick = () => {
    if (tutCurrentStep > 0) renderTutStep(tutCurrentStep - 1);
  };
}

if (DOM.btnTutNext) {
  DOM.btnTutNext.onclick = () => {
    if (tutCurrentStep < TUTORIAL_STEPS.length - 1) {
      renderTutStep(tutCurrentStep + 1);
    } else {
      closeTutorialStepModal();
      DOM.btnPlaySoloInstant.click();
    }
  };
}

// ==========================================
// MODAL HISTÓRICO DE AÇÕES (LOG)
// ==========================================
const renderGameLogModal = () => {
  if (!gameState || !gameState.logs || gameState.logs.length === 0) {
    DOM.gameLogList.innerHTML = `<div class="text-xs text-slate-400 italic text-center py-6">Nenhuma ação registrada nesta partida ainda.</div>`;
    return;
  }

  const last15 = gameState.logs.slice(0, 15);
  DOM.gameLogList.innerHTML = last15
    .map((log) => `
      <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-start gap-2 shadow-sm">
        <span class="flex-1 leading-snug">${log.text}</span>
      </div>
    `)
    .join('');
};

if (DOM.btnOpenGameLog) {
  DOM.btnOpenGameLog.onclick = () => {
    renderGameLogModal();
    DOM.modalGameLog.classList.remove('hidden');
  };
}

if (DOM.btnCloseGameLog) {
  DOM.btnCloseGameLog.onclick = () => {
    DOM.modalGameLog.classList.add('hidden');
  };
}

// ==========================================
// MODAL CONFIGURAÇÕES & SUPABASE
// ==========================================
if (DOM.btnOpenDbConfig) {
  DOM.btnOpenDbConfig.onclick = () => {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const isConnected = hasValidCredentials();

    if (DOM.cfgSupabaseUrl) DOM.cfgSupabaseUrl.value = supabaseUrl || '';
    if (DOM.cfgSupabaseKey) DOM.cfgSupabaseKey.value = supabaseAnonKey || '';
    if (DOM.cfgFeedbackMsg) DOM.cfgFeedbackMsg.textContent = '';

    if (DOM.cfgStatusText && DOM.cfgStatusBadge) {
      if (isConnected) {
        DOM.cfgStatusText.textContent = 'Conectado ao Supabase Cloud';
        DOM.cfgStatusText.className = 'text-xs font-semibold text-emerald-400';
        DOM.cfgStatusBadge.textContent = '✓ Conectado';
        DOM.cfgStatusBadge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      } else {
        DOM.cfgStatusText.textContent = 'Modo Solo Ativo (Offline / Memória)';
        DOM.cfgStatusText.className = 'text-xs font-semibold text-amber-400';
        DOM.cfgStatusBadge.textContent = 'Solo / Local';
        DOM.cfgStatusBadge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
      }
    }

    if (DOM.modalDbConfig) DOM.modalDbConfig.classList.remove('hidden');
  };
}

if (DOM.btnCloseDbConfig) {
  DOM.btnCloseDbConfig.onclick = () => {
    if (DOM.modalDbConfig) DOM.modalDbConfig.classList.add('hidden');
  };
}

if (DOM.btnSaveDbConfig) {
  DOM.btnSaveDbConfig.onclick = () => {
    const url = DOM.cfgSupabaseUrl?.value.trim() || '';
    const key = DOM.cfgSupabaseKey?.value.trim() || '';

    if (!url || !key) {
      if (DOM.cfgFeedbackMsg) {
        DOM.cfgFeedbackMsg.textContent = '⚠️ Preencha a URL e a Anon Key.';
        DOM.cfgFeedbackMsg.className = 'text-[11px] text-center font-bold text-rose-400';
      }
      return;
    }

    saveRuntimeCredentials(url, key);
    if (DOM.cfgFeedbackMsg) {
      DOM.cfgFeedbackMsg.textContent = '✓ Credenciais salvas com sucesso!';
      DOM.cfgFeedbackMsg.className = 'text-[11px] text-center font-bold text-emerald-400';
    }
    if (DOM.cfgStatusText && DOM.cfgStatusBadge) {
      DOM.cfgStatusText.textContent = 'Conectado ao Supabase Cloud';
      DOM.cfgStatusText.className = 'text-xs font-semibold text-emerald-400';
      DOM.cfgStatusBadge.textContent = '✓ Conectado';
      DOM.cfgStatusBadge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
    }
    setTimeout(() => {
      if (DOM.modalDbConfig) DOM.modalDbConfig.classList.add('hidden');
    }, 1200);
  };
}

if (DOM.btnClearDbConfig) {
  DOM.btnClearDbConfig.onclick = () => {
    localStorage.removeItem('ARCANUM_SUPABASE_URL');
    localStorage.removeItem('ARCANUM_SUPABASE_ANON_KEY');
    sessionStorage.removeItem('ARCANUM_SUPABASE_URL');
    sessionStorage.removeItem('ARCANUM_SUPABASE_ANON_KEY');

    if (DOM.cfgSupabaseUrl) DOM.cfgSupabaseUrl.value = '';
    if (DOM.cfgSupabaseKey) DOM.cfgSupabaseKey.value = '';

    if (DOM.cfgStatusText && DOM.cfgStatusBadge) {
      DOM.cfgStatusText.textContent = 'Modo Solo Ativo (Offline / Memória)';
      DOM.cfgStatusText.className = 'text-xs font-semibold text-amber-400';
      DOM.cfgStatusBadge.textContent = 'Solo / Local';
      DOM.cfgStatusBadge.className = 'px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40';
    }

    if (DOM.cfgFeedbackMsg) {
      DOM.cfgFeedbackMsg.textContent = '🗑️ Credenciais limpas. Modo solo ativado.';
      DOM.cfgFeedbackMsg.className = 'text-[11px] text-center font-bold text-slate-300';
    }
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

  // Concede XP e atualiza perfil
  const isHumanWinner = winner.id === 'player_human';
  playerService.recordGameResult('cronicas', isHumanWinner);
  updateHeaderProfilePill();

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
  switchView('hub');
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

// ==========================================
// EVENTOS GLOBAIS DA PLATAFORMA ARCANA TABLE
// ==========================================
// Botão Home no Header
if (DOM.btnHeaderHome) {
  DOM.btnHeaderHome.onclick = () => {
    soundManager.playCardTap();
    switchView('hub');
  };
}

// Perfil / Níveis
const handleOpenProfile = () => {
  soundManager.playCardTap();
  openPlayerProfileModal();
};

if (DOM.btnPlayerPill) DOM.btnPlayerPill.onclick = handleOpenProfile;
if (DOM.btnHubProfile) DOM.btnHubProfile.onclick = handleOpenProfile;
if (DOM.navBtnProfile) DOM.navBtnProfile.onclick = handleOpenProfile;
if (DOM.navBtnLevels) DOM.navBtnLevels.onclick = handleOpenProfile;

if (DOM.btnClosePlayerProfile) {
  DOM.btnClosePlayerProfile.onclick = () => {
    DOM.modalPlayerProfile.classList.add('hidden');
  };
}

// Salvar Apelido no Perfil
if (DOM.btnProfileSaveName) {
  DOM.btnProfileSaveName.onclick = () => {
    const newName = DOM.profileInputNickname?.value.trim();
    if (newName) {
      playerService.updateProfile({ nickname: newName });
      updateHeaderProfilePill();
      openPlayerProfileModal();
      if (DOM.inputNickname) DOM.inputNickname.value = newName;
      soundManager.playCardTap();
    }
  };
}

// Zerar Estatísticas
if (DOM.btnProfileResetStats) {
  DOM.btnProfileResetStats.onclick = () => {
    if (confirm('Tem certeza de que deseja zerar todas as estatísticas e progresso de níveis?')) {
      playerService.resetStats();
      updateHeaderProfilePill();
      openPlayerProfileModal();
      renderHubGames();
    }
  };
}

// Fechar Modal Fase 2
if (DOM.btnClosePhase2) {
  DOM.btnClosePhase2.onclick = () => {
    DOM.modalPhase2Preview.classList.add('hidden');
  };
}

// Jogo Rápido Aleatório no Hub
if (DOM.btnHubQuickPlay) {
  DOM.btnHubQuickPlay.onclick = () => {
    soundManager.playCardTap();
    const playableGames = [
      'cronicas', 'corte', 'onirico', 'sonhos',
      'sintonia', 'jukebox', 'palavra', 'quemdisse', 'saber'
    ];
    const chosen = playableGames[Math.floor(Math.random() * playableGames.length)];
    if (chosen === 'cronicas') switchView('cronicas-lobby');
    else if (chosen === 'corte') launchCorteGame();
    else if (chosen === 'onirico') launchOniricoGame();
    else if (chosen === 'sonhos') launchSonhosGame();
    else if (chosen === 'sintonia') launchSintoniaGame();
    else if (chosen === 'jukebox') launchJukeboxGame();
    else if (chosen === 'palavra') launchPalavraGame();
    else if (chosen === 'quemdisse') launchQuemDisseGame();
    else if (chosen === 'saber') launchSaberGame();
  };
}

// Abas de Categoria no Hub
if (DOM.hubCategoryTabs) {
  DOM.hubCategoryTabs.querySelectorAll('.btn-hub-cat').forEach((btn) => {
    btn.onclick = () => {
      soundManager.playCardTap();
      currentCategoryFilter = btn.getAttribute('data-cat') || 'all';

      DOM.hubCategoryTabs.querySelectorAll('.btn-hub-cat').forEach((b) => {
        b.className = 'btn-hub-cat px-3 py-1.5 rounded-xl text-xs font-bold font-title border bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 transition whitespace-nowrap';
      });
      btn.className = 'btn-hub-cat px-3 py-1.5 rounded-xl text-xs font-bold font-title border bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm transition whitespace-nowrap';

      renderHubGames();
    };
  });
}

// Pesquisa de Jogos no Hub
if (DOM.inputHubSearch) {
  DOM.inputHubSearch.oninput = (e) => {
    hubSearchQuery = e.target.value.trim();
    renderHubGames();
  };
}

// Navegação Inferior Mobile
if (DOM.navBtnHub) {
  DOM.navBtnHub.onclick = () => {
    soundManager.playCardTap();
    switchView('hub');
  };
}
if (DOM.navBtnCronicas) {
  DOM.navBtnCronicas.onclick = () => {
    soundManager.playCardTap();
    switchView('cronicas-lobby');
  };
}

// Sincroniza apelido do perfil com o input do Lobby
const currentProf = playerService.getProfile();
if (DOM.inputNickname && currentProf.nickname) {
  DOM.inputNickname.value = currentProf.nickname;
}

// ==========================================
// AUTENTICAÇÃO, LGPD, MASTER & RECUPERAÇÃO DE SENHA
// ==========================================
let currentResetToken = null;

const showAuthError = (msg) => {
  if (DOM.authErrorMsg) {
    DOM.authErrorMsg.textContent = msg;
    DOM.authErrorMsg.classList.remove('hidden');
  }
};

const clearAuthError = () => {
  if (DOM.authErrorMsg) {
    DOM.authErrorMsg.textContent = '';
    DOM.authErrorMsg.classList.add('hidden');
  }
};

const switchAuthTab = (viewName) => {
  clearAuthError();
  if (DOM.authViewLogin) DOM.authViewLogin.classList.toggle('hidden', viewName !== 'login');
  if (DOM.authViewRegister) DOM.authViewRegister.classList.toggle('hidden', viewName !== 'register');
  if (DOM.authViewForgot) DOM.authViewForgot.classList.toggle('hidden', viewName !== 'forgot');
  if (DOM.authViewReset) DOM.authViewReset.classList.toggle('hidden', viewName !== 'reset');

  if (DOM.tabAuthLogin) {
    DOM.tabAuthLogin.className = viewName === 'login'
      ? 'flex-1 py-3 text-xs font-bold font-title border-b-2 border-amber-400 text-amber-300 transition'
      : 'flex-1 py-3 text-xs font-bold font-title text-slate-400 hover:text-slate-200 transition';
  }
  if (DOM.tabAuthRegister) {
    DOM.tabAuthRegister.className = viewName === 'register'
      ? 'flex-1 py-3 text-xs font-bold font-title border-b-2 border-amber-400 text-amber-300 transition'
      : 'flex-1 py-3 text-xs font-bold font-title text-slate-400 hover:text-slate-200 transition';
  }
  if (DOM.tabAuthForgot) {
    DOM.tabAuthForgot.className = (viewName === 'forgot' || viewName === 'reset')
      ? 'flex-1 py-3 text-xs font-bold font-title border-b-2 border-amber-400 text-amber-300 transition'
      : 'flex-1 py-3 text-xs font-bold font-title text-slate-400 hover:text-slate-200 transition';
  }
};

const openAuthModal = (initialTab = 'login') => {
  switchAuthTab(initialTab);
  if (DOM.modalAuth) DOM.modalAuth.classList.remove('hidden');
};

const closeAuthModal = () => {
  if (DOM.modalAuth) DOM.modalAuth.classList.add('hidden');
  clearAuthError();
};

if (DOM.btnOpenAuth) {
  DOM.btnOpenAuth.onclick = () => {
    soundManager.playCardTap();
    const session = authService.getCurrentSession();
    if (session && !session.isGuest) {
      if (confirm(`Deseja desconectar a conta ${session.email}?`)) {
        authService.logout();
        updateHeaderProfilePill();
        alert('Você foi desconectado com segurança.');
      }
    } else {
      openAuthModal('login');
    }
  };
}

if (DOM.btnCloseAuth) DOM.btnCloseAuth.onclick = closeAuthModal;
if (DOM.tabAuthLogin) DOM.tabAuthLogin.onclick = () => switchAuthTab('login');
if (DOM.tabAuthRegister) DOM.tabAuthRegister.onclick = () => switchAuthTab('register');
if (DOM.tabAuthForgot) DOM.tabAuthForgot.onclick = () => switchAuthTab('forgot');
if (DOM.btnGotoForgot) DOM.btnGotoForgot.onclick = () => switchAuthTab('forgot');

// Login
if (DOM.btnSubmitLogin) {
  DOM.btnSubmitLogin.onclick = async () => {
    clearAuthError();
    const email = DOM.loginEmail?.value.trim();
    const password = DOM.loginPassword?.value;

    if (!email || !password) {
      showAuthError('Preencha o e-mail e a senha.');
      return;
    }

    try {
      const session = await authService.login({ email, password });
      playerService.updateProfile({ nickname: session.nickname, avatar: session.avatar });
      updateHeaderProfilePill();
      closeAuthModal();
      soundManager.playVictoryFanfare();
      alert(`Bem-vindo de volta, ${session.nickname}!`);
    } catch (err) {
      showAuthError(err.message || 'Erro ao realizar login.');
    }
  };
}

// Visitante
if (DOM.btnLoginGuest) {
  DOM.btnLoginGuest.onclick = () => {
    soundManager.playCardTap();
    const session = authService.loginAsGuest();
    playerService.updateProfile({ nickname: session.nickname, avatar: session.avatar });
    updateHeaderProfilePill();
    closeAuthModal();
  };
}

// Cadastro com LGPD
if (DOM.btnSubmitRegister) {
  DOM.btnSubmitRegister.onclick = async () => {
    clearAuthError();
    const nickname = DOM.regName?.value.trim();
    const email = DOM.regEmail?.value.trim();
    const password = DOM.regPassword?.value;
    const passwordConfirm = DOM.regPasswordConfirm?.value;
    const lgpdConsent = DOM.regLgpdCheckbox?.checked;

    if (!lgpdConsent) {
      showAuthError('Você deve concordar com os Termos de Privacidade e LGPD para se cadastrar.');
      return;
    }
    if (!password || password.length < 6) {
      showAuthError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      showAuthError('As senhas digitadas não coincidem.');
      return;
    }

    try {
      const session = await authService.register({
        email,
        password,
        nickname,
        avatar: '🧙‍♂️',
        lgpdConsent: true
      });
      playerService.updateProfile({ nickname: session.nickname, avatar: session.avatar });
      updateHeaderProfilePill();
      closeAuthModal();
      soundManager.playVictoryFanfare();
      alert(`Conta criada com sucesso! Seja bem-vindo(a), ${session.nickname}.`);
    } catch (err) {
      showAuthError(err.message || 'Erro ao criar conta.');
    }
  };
}

// Modal de Termos LGPD
if (DOM.btnOpenLgpdTerms) {
  DOM.btnOpenLgpdTerms.onclick = (e) => {
    e.preventDefault();
    if (DOM.modalLgpdTerms) DOM.modalLgpdTerms.classList.remove('hidden');
  };
}
if (DOM.btnCloseLgpdTerms) {
  DOM.btnCloseLgpdTerms.onclick = () => {
    if (DOM.modalLgpdTerms) DOM.modalLgpdTerms.classList.add('hidden');
  };
}
if (DOM.btnAcceptLgpdTerms) {
  DOM.btnAcceptLgpdTerms.onclick = () => {
    if (DOM.regLgpdCheckbox) DOM.regLgpdCheckbox.checked = true;
    if (DOM.modalLgpdTerms) DOM.modalLgpdTerms.classList.add('hidden');
  };
}

// Solicitação de Recuperação de Senha
if (DOM.btnSubmitForgot) {
  DOM.btnSubmitForgot.onclick = () => {
    clearAuthError();
    const email = DOM.forgotEmail?.value.trim();
    if (!email) {
      showAuthError('Digite seu e-mail cadastrado.');
      return;
    }

    try {
      const res = authService.requestPasswordReset(email);
      currentResetToken = res.token;
      if (DOM.forgotFeedbackBox) {
        DOM.forgotFeedbackBox.classList.remove('hidden');
      }
    } catch (err) {
      showAuthError(err.message || 'Erro ao solicitar redefinição.');
    }
  };
}

if (DOM.btnOpenResetFlow) {
  DOM.btnOpenResetFlow.onclick = () => {
    switchAuthTab('reset');
  };
}

// Redefinir Nova Senha
if (DOM.btnSubmitNewPassword) {
  DOM.btnSubmitNewPassword.onclick = async () => {
    clearAuthError();
    const newPass = DOM.resetNewPassword?.value;

    if (!newPass || newPass.length < 6) {
      showAuthError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (!currentResetToken) {
      showAuthError('Token de recuperação não identificado.');
      return;
    }

    try {
      await authService.resetPasswordWithToken(currentResetToken, newPass);
      currentResetToken = null;
      alert('Senha redefinida com sucesso! Você já pode fazer login com a nova senha.');
      switchAuthTab('login');
    } catch (err) {
      showAuthError(err.message || 'Erro ao redefinir senha.');
    }
  };
}

// Verificar Token na URL (#reset-token=...)
const checkUrlResetToken = () => {
  const hash = window.location.hash;
  if (hash.includes('reset-token=')) {
    const match = hash.match(/reset-token=([^&]+)/);
    if (match && match[1]) {
      currentResetToken = match[1];
      openAuthModal('reset');
    }
  }
};
window.addEventListener('hashchange', checkUrlResetToken);
checkUrlResetToken();

// Painel Master
export const renderMasterUsersList = () => {
  if (!DOM.masterUsersList) return;
  const users = authService.getAllUsersForMaster();
  if (DOM.masterUserCount) DOM.masterUserCount.textContent = users.length;

  DOM.masterUsersList.innerHTML = users.map((u) => {
    const isMasterRole = u.role === 'master';
    return `
      <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div class="flex items-center gap-3">
          <span class="text-2xl">${u.avatar || '🧙‍♂️'}</span>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-amber-300 text-sm">${u.nickname}</span>
              ${isMasterRole ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black uppercase">Master</span>' : '<span class="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">Jogador</span>'}
            </div>
            <p class="text-slate-400 text-[11px] font-mono">${u.email}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">LGPD: ${new Date(u.lgpdConsentDate).toLocaleDateString('pt-BR')} • Cadastrado em: ${new Date(u.createdAt).toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div class="flex items-center gap-2 self-end md:self-center">
          <button data-user-id="${u.id}" data-user-email="${u.email}" class="btn-master-change-pass px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 transition text-[11px] font-bold">
            🔑 Alterar Senha
          </button>
          ${!isMasterRole ? `
            <button data-user-id="${u.id}" data-user-email="${u.email}" class="btn-master-delete-user px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 transition text-[11px] font-bold">
              🗑️ Excluir
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  DOM.masterUsersList.querySelectorAll('.btn-master-change-pass').forEach((btn) => {
    btn.onclick = async () => {
      const uId = btn.getAttribute('data-user-id');
      const uEmail = btn.getAttribute('data-user-email');
      const newPass = prompt(`Digite a nova senha para o usuário ${uEmail} (mínimo 6 caracteres):`);
      if (newPass) {
        try {
          await authService.masterChangeUserPassword(uId, newPass);
          alert(`Senha do usuário ${uEmail} alterada com sucesso pelo Master!`);
        } catch (err) {
          alert('Erro ao alterar senha: ' + err.message);
        }
      }
    };
  });

  DOM.masterUsersList.querySelectorAll('.btn-master-delete-user').forEach((btn) => {
    btn.onclick = () => {
      const uId = btn.getAttribute('data-user-id');
      const uEmail = btn.getAttribute('data-user-email');
      if (confirm(`Excluir permanentemente todos os dados e conta do usuário ${uEmail} (LGPD Art. 18)?`)) {
        try {
          authService.deleteUserAccount(uId);
          renderMasterUsersList();
          alert(`Usuário ${uEmail} removido com sucesso.`);
        } catch (err) {
          alert('Erro ao excluir usuário: ' + err.message);
        }
      }
    };
  });
};

if (DOM.btnOpenMaster) {
  DOM.btnOpenMaster.onclick = () => {
    soundManager.playCardTap();
    renderMasterUsersList();
    if (DOM.modalMasterPanel) DOM.modalMasterPanel.classList.remove('hidden');
  };
}
if (DOM.btnCloseMasterPanel) {
  DOM.btnCloseMasterPanel.onclick = () => {
    if (DOM.modalMasterPanel) DOM.modalMasterPanel.classList.add('hidden');
  };
}

// LGPD Art. 18: Direito ao Esquecimento no Perfil
if (DOM.btnProfileDeleteAccount) {
  DOM.btnProfileDeleteAccount.onclick = () => {
    const session = authService.getCurrentSession();
    if (!session || session.isGuest) {
      if (confirm('Deseja limpar todos os dados salvos localmente deste visitante?')) {
        playerService.resetStats();
        updateHeaderProfilePill();
        if (DOM.modalPlayerProfile) DOM.modalPlayerProfile.classList.add('hidden');
        renderHubGames();
        alert('Dados locais limpos.');
      }
      return;
    }

    if (confirm(`Atenção (LGPD Art. 18): Deseja revogar seu consentimento e excluir permanentemente sua conta (${session.email}) e todo seu histórico de dados?\n\nEsta ação é irreversível.`)) {
      try {
        authService.deleteUserAccount(session.id);
        playerService.resetStats();
        updateHeaderProfilePill();
        if (DOM.modalPlayerProfile) DOM.modalPlayerProfile.classList.add('hidden');
        renderHubGames();
        alert('Sua conta e dados pessoais foram excluídos com sucesso, conforme o Art. 18 da LGPD.');
      } catch (err) {
        alert('Erro ao excluir conta: ' + err.message);
      }
    }
  };
}

// Inicializa a Plataforma no Hub
switchView('hub');
