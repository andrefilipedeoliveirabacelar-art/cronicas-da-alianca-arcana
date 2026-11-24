// ============================================================================
// INTERFACE DE USUÁRIO: CORTE DAS SOMBRAS (COUP) — MOBILE-FIRST
// ============================================================================

import {
  ROLES,
  GENERAL_ACTIONS,
  getActivePlayer,
  executeIncome,
  declareForeignAid,
  declareTax,
  declareAssassinate,
  declareSteal,
  declareExchange,
  executeCoup,
  eliminatePlayerInfluence,
  nextTurn,
  getBotAction
} from './corteLogic.js';

export class CorteUI {
  constructor(container, playerService, onExitToHub) {
    this.container = container;
    this.playerService = playerService;
    this.onExitToHub = onExitToHub;
    this.state = null;
    this.botTimer = null;
    this.reactionTimer = null;
  }

  start(state) {
    this.state = state;
    this.render();
    this.checkTurn();
  }

  destroy() {
    if (this.botTimer) clearTimeout(this.botTimer);
    if (this.reactionTimer) clearTimeout(this.reactionTimer);
    this.container.innerHTML = '';
  }

  checkTurn() {
    if (this.state.phase === 'GAME_OVER') return;

    const active = getActivePlayer(this.state);
    if (active.isBot && this.state.phase === 'ACTION') {
      this.botTimer = setTimeout(() => {
        const botAction = getBotAction(this.state, this.state.turnIndex);
        this.applyAction(active, botAction);
      }, 1600);
    }
  }

  applyAction(player, actionObj) {
    const pIdx = this.state.turnIndex;
    const { action, targetIdx } = actionObj;

    if (action === 'income') {
      executeIncome(this.state, pIdx);
      this.render();
      this.checkTurn();
    } else if (action === 'foreign_aid') {
      declareForeignAid(this.state, pIdx);
      this.render();
      this.handleBlockOrPassReaction('duke', 'Ajuda Externa');
    } else if (action === 'tax') {
      declareTax(this.state, pIdx);
      this.render();
      this.handleChallengeReaction('duke');
    } else if (action === 'assassinate') {
      declareAssassinate(this.state, pIdx, targetIdx);
      this.render();
      this.handleChallengeReaction('assassin', () => {
        // Se passar a contestação da ação, o alvo pode bloquear com Condessa
        this.handleBlockOrPassReaction('contessa', 'Assassinato', targetIdx);
      });
    } else if (action === 'steal') {
      declareSteal(this.state, pIdx, targetIdx);
      this.render();
      this.handleChallengeReaction('captain', () => {
        // Se passar, alvo pode bloquear com Capitão ou Embaixador
        this.handleBlockOrPassReaction(['captain', 'ambassador'], 'Extorsão', targetIdx);
      });
    } else if (action === 'exchange') {
      declareExchange(this.state, pIdx);
      this.render();
      this.handleChallengeReaction('ambassador');
    } else if (action === 'coup') {
      executeCoup(this.state, pIdx, targetIdx);
      this.render();
      this.checkTurn();
    }
  }

  handleChallengeReaction(claimedRole, onSuccessCallback = null) {
    // Se o humano não for o jogador ativo, ele tem a chance de contestar
    const active = getActivePlayer(this.state);
    if (active.isBot) {
      // Exibe a janela de contestação para o jogador humano
      this.render();
      // Se não clicar em 10 segundos, passa automaticamente
      this.reactionTimer = setTimeout(() => {
        this.resolveActionWithoutChallenge(onSuccessCallback);
      }, 9000);
    } else {
      // Se o humano é o ativo, os bots decidem se contestam
      setTimeout(() => {
        const bluffed = !active.cards.some(c => !c.revealed && c.roleKey === claimedRole);
        const botContests = Math.random() < (bluffed ? 0.45 : 0.15);

        if (botContests) {
          const aliveBots = this.state.players.filter(p => p.isAlive && p.isBot);
          const challenger = aliveBots[Math.floor(Math.random() * aliveBots.length)];
          this.executeContest(challenger, active, claimedRole, onSuccessCallback);
        } else {
          this.resolveActionWithoutChallenge(onSuccessCallback);
        }
      }, 1800);
    }
  }

  handleBlockOrPassReaction(blockingRoles, actionName, targetIdx = null) {
    const rolesArray = Array.isArray(blockingRoles) ? blockingRoles : [blockingRoles];
    const active = getActivePlayer(this.state);

    // Se o alvo for o humano, dá opção de bloquear
    const isHumanTarget = targetIdx !== null ? !this.state.players[targetIdx]?.isBot : active.isBot;

    if (isHumanTarget) {
      this.render();
      this.reactionTimer = setTimeout(() => {
        this.resolveBlockDecision(false);
      }, 9000);
    } else {
      setTimeout(() => {
        // Bot decide se bloqueia
        const target = targetIdx !== null ? this.state.players[targetIdx] : null;
        const potentialBlocker = target || this.state.players.find(p => p.isAlive && p.isBot && p.id !== active.id);

        if (potentialBlocker) {
          const hasCard = potentialBlocker.cards.some(c => !c.revealed && rolesArray.includes(c.roleKey));
          const decidesToBlock = hasCard || Math.random() < 0.25;

          if (decidesToBlock) {
            const roleUsed = hasCard ? potentialBlocker.cards.find(c => !c.revealed && rolesArray.includes(c.roleKey)).roleKey : rolesArray[0];
            this.state.currentBlock = {
              playerIndex: this.state.players.indexOf(potentialBlocker),
              claimedRole: roleUsed
            };
            this.state.phase = 'CHALLENGE_BLOCK';
            this.state.logs.unshift({
              text: `🛡️ ${potentialBlocker.name} interpôs um BLOQUEIO alegando ter [${ROLES[roleUsed.toUpperCase()]?.name}]!`,
              type: 'action',
              time: new Date().toLocaleTimeString()
            });
            this.render();

            // Ativo pode contestar o bloqueio
            if (!active.isBot) {
              // Deixa o humano contestar o bloqueio
            } else {
              setTimeout(() => {
                const activeContests = Math.random() < 0.25;
                if (activeContests) {
                  this.executeContest(active, potentialBlocker, roleUsed, null, true);
                } else {
                  this.state.logs.unshift({
                    text: `O bloqueio de ${potentialBlocker.name} foi aceito. Ação anulada!`,
                    type: 'system',
                    time: new Date().toLocaleTimeString()
                  });
                  nextTurn(this.state);
                  this.render();
                  this.checkTurn();
                }
              }, 1800);
            }
            return;
          }
        }

        // Ninguém bloqueou
        this.resolveActionWithoutChallenge();
      }, 1600);
    }
  }

  executeContest(challenger, accused, claimedRole, onSuccessCallback, isBlockContest = false) {
    if (this.reactionTimer) clearTimeout(this.reactionTimer);

    const hasCard = accused.cards.some(c => !c.revealed && c.roleKey === claimedRole);

    this.state.logs.unshift({
      text: `⚡ CONTESTAÇÃO! ${challenger.name} gritou "MENTIRA!" para ${accused.name}!`,
      type: 'danger',
      time: new Date().toLocaleTimeString()
    });

    if (hasCard) {
      // Acusado falou a verdade! Acusador perde influência!
      this.state.logs.unshift({
        text: `✨ A VERDADE FOI REVELADA! ${accused.name} provou possuir [${ROLES[claimedRole.toUpperCase()]?.name}]!`,
        type: 'action',
        time: new Date().toLocaleTimeString()
      });
      eliminatePlayerInfluence(this.state, this.state.players.indexOf(challenger));

      // Acusado devolve a carta ao baralho e compra uma nova
      const cardIdx = accused.cards.findIndex(c => !c.revealed && c.roleKey === claimedRole);
      if (cardIdx !== -1) {
        this.state.deck.push(accused.cards[cardIdx]);
        accused.cards[cardIdx] = this.state.deck.shift();
      }

      if (isBlockContest) {
        this.state.logs.unshift({ text: `O bloqueio se mantém e a ação original falha!`, type: 'system', time: new Date().toLocaleTimeString() });
        nextTurn(this.state);
      } else if (onSuccessCallback) {
        onSuccessCallback();
      } else {
        this.executeActionEffects();
      }
    } else {
      // Acusado foi pego no blefe! Acusado perde influência!
      this.state.logs.unshift({
        text: `💥 BLEFE DESMASCARADO! ${accused.name} NÃO possuía a carta alegada!`,
        type: 'danger',
        time: new Date().toLocaleTimeString()
      });
      eliminatePlayerInfluence(this.state, this.state.players.indexOf(accused));

      if (!isBlockContest) {
        this.state.logs.unshift({ text: `A ação de ${accused.name} foi totalmente cancelada!`, type: 'system', time: new Date().toLocaleTimeString() });
        nextTurn(this.state);
      } else {
        // Bloqueio mentiroso falhou, ação original acontece
        this.executeActionEffects();
      }
    }

    this.render();
    this.checkTurn();
  }

  resolveActionWithoutChallenge(onSuccessCallback = null) {
    if (this.reactionTimer) clearTimeout(this.reactionTimer);
    if (onSuccessCallback) {
      onSuccessCallback();
    } else {
      this.executeActionEffects();
    }
  }

  resolveBlockDecision(didBlock) {
    if (this.reactionTimer) clearTimeout(this.reactionTimer);
    const active = getActivePlayer(this.state);
    const human = this.state.players.find(p => !p.isBot) || this.state.players[0];

    if (didBlock) {
      const claimedRole = this.state.currentAction.type === 'foreign_aid' ? 'duke' : 'contessa';
      this.state.currentBlock = {
        playerIndex: this.state.players.indexOf(human),
        claimedRole
      };
      this.state.phase = 'CHALLENGE_BLOCK';
      this.state.logs.unshift({
        text: `🛡️ Você bloqueou a ação com [${ROLES[claimedRole.toUpperCase()]?.name}]!`,
        type: 'action',
        time: new Date().toLocaleTimeString()
      });
      this.render();

      setTimeout(() => {
        const activeContests = Math.random() < 0.3;
        if (activeContests) {
          this.executeContest(active, human, claimedRole, null, true);
        } else {
          this.state.logs.unshift({ text: `Os nobres aceitaram seu bloqueio!`, type: 'system', time: new Date().toLocaleTimeString() });
          nextTurn(this.state);
          this.render();
          this.checkTurn();
        }
      }, 1500);
    } else {
      this.executeActionEffects();
    }
  }

  executeActionEffects() {
    const { type, playerIndex, targetIndex } = this.state.currentAction;
    const actor = this.state.players[playerIndex];

    if (type === 'foreign_aid') {
      actor.coins += 2;
      this.state.logs.unshift({ text: `${actor.name} recebeu +2 moedas de Ajuda Externa. Saldo: ${actor.coins}`, type: 'action', time: new Date().toLocaleTimeString() });
    } else if (type === 'tax') {
      actor.coins += 3;
      this.state.logs.unshift({ text: `${actor.name} coletou 3 moedas de Impostos do Duque. Saldo: ${actor.coins}`, type: 'action', time: new Date().toLocaleTimeString() });
    } else if (type === 'assassinate') {
      const target = this.state.players[targetIndex];
      eliminatePlayerInfluence(this.state, targetIndex);
      this.state.logs.unshift({ text: `🗡️ O Assassino cumpriu o contrato! ${target.name} perdeu 1 influência.`, type: 'danger', time: new Date().toLocaleTimeString() });
    } else if (type === 'steal') {
      const target = this.state.players[targetIndex];
      const stolen = Math.min(2, target.coins);
      target.coins -= stolen;
      actor.coins += stolen;
      this.state.logs.unshift({ text: `⚓ ${actor.name} extorquiu ${stolen} moedas de ${target.name}!`, type: 'action', time: new Date().toLocaleTimeString() });
    } else if (type === 'exchange') {
      // Troca 2 cartas com o topo do baralho
      if (this.state.deck.length >= 2) {
        const drawn = [this.state.deck.shift(), this.state.deck.shift()];
        const aliveCards = actor.cards.filter(c => !c.revealed);
        const pool = [...aliveCards, ...drawn];
        // Escolhe as melhores
        pool.sort(() => Math.random() - 0.5);
        for (let i = 0; i < aliveCards.length; i++) {
          aliveCards[i].roleKey = pool[i].roleKey;
        }
        this.state.deck.push(pool[pool.length - 2], pool[pool.length - 1]);
      }
      this.state.logs.unshift({ text: `📜 ${actor.name} concluiu a troca diplomática com a corte.`, type: 'action', time: new Date().toLocaleTimeString() });
    }

    nextTurn(this.state);
    this.render();
    this.checkTurn();
  }

  render() {
    if (this.state.phase === 'GAME_OVER') {
      this.renderGameOver();
      return;
    }

    const human = this.state.players.find(p => !p.isBot) || this.state.players[0];
    const active = getActivePlayer(this.state);
    const isHumanTurn = !active.isBot;
    const rivals = this.state.players.filter(p => p.isBot);

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#140F22] via-[#1A1429] to-[#0D0A17] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/40 backdrop-blur-md border-b border-purple-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-corte-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-amber-300">
                👑 CORTE DAS SOMBRAS
              </h2>
              <p class="text-[9px] text-slate-400">Rodada ${this.state.round} • Baralho: ${this.state.deck.length} cartas</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-0.5 rounded-full font-bold border ${isHumanTurn ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border-slate-700'}">
              ${isHumanTurn ? 'SUA VEZ' : `Vez de ${active.name}`}
            </span>
          </div>
        </header>

        <!-- ÁREA CENTRAL: ADVERSÁRIOS E MESA -->
        <main class="flex-1 flex flex-col p-2 sm:p-4 gap-3 max-w-4xl mx-auto w-full overflow-y-auto">
          <!-- CARROSSEL DE RIVAIS -->
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
            ${rivals.map(r => {
              const isTurn = active.id === r.id;
              return `
                <div class="p-2.5 rounded-xl border ${r.isAlive ? (isTurn ? 'border-amber-500 shadow-lg shadow-amber-500/20 bg-amber-950/20' : 'border-slate-800 bg-slate-900/60') : 'border-red-950 bg-black/50 opacity-40'} flex flex-col justify-between transition">
                  <div class="flex items-center justify-between">
                    <span class="text-lg">${r.avatar}</span>
                    <span class="text-xs font-bold text-amber-400 flex items-center gap-1">
                      🪙 ${r.coins}
                    </span>
                  </div>
                  <div class="my-1.5">
                    <p class="text-xs font-bold truncate ${r.isAlive ? 'text-slate-200' : 'text-slate-500 line-through'}">${r.name}</p>
                    <p class="text-[10px] ${r.isAlive ? 'text-slate-400' : 'text-red-400 font-bold'}">
                      ${r.isAlive ? `${r.cards.filter(c => !c.revealed).length} influências` : 'ELIMINADO'}
                    </p>
                  </div>
                  <div class="flex gap-1">
                    ${r.cards.map(c => `
                      <div class="flex-1 h-6 rounded flex items-center justify-center text-[10px] font-bold ${c.revealed ? 'bg-red-950/60 text-red-300 border border-red-800/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}">
                        ${c.revealed ? ROLES[c.roleKey.toUpperCase()]?.icon : '🂠'}
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- JANELA DE CONTESTAÇÃO / REAÇÃO -->
          ${this.renderReactionBanner(human, active)}

          <!-- HISTÓRICO DE AÇÕES COMPACTO -->
          <div class="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 max-h-32 overflow-y-auto text-xs space-y-1">
            ${this.state.logs.slice(0, 5).map(log => `
              <div class="flex items-start gap-1.5 text-[11px] ${log.type === 'danger' ? 'text-red-300 font-bold' : log.type === 'action' ? 'text-amber-300' : 'text-slate-400'}">
                <span class="text-[9px] text-slate-500 font-mono">${log.time || ''}</span>
                <span>${log.text}</span>
              </div>
            `).join('')}
          </div>
        </main>

        <!-- PAINEL DO JOGADOR HUMANO (CARTAS SECRETAS + AÇÕES) -->
        <footer class="sticky bottom-0 z-40 bg-[#120E1E]/95 backdrop-blur-md border-t-2 border-indigo-500/30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl">
          <div class="max-w-4xl mx-auto flex flex-col gap-2">
            <!-- SUAS CARTAS SECRETAS E SALDO -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xl">${human.avatar}</span>
                <div>
                  <span class="text-xs font-black text-slate-200">${human.name}</span>
                  <div class="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <span>🪙 ${human.coins} Moedas</span>
                    ${human.coins >= 10 ? '<span class="text-[10px] text-red-400 animate-pulse font-black">(GOLPE OBRIGATÓRIO)</span>' : ''}
                  </div>
                </div>
              </div>

              <!-- SUAS CARTAS -->
              <div class="flex gap-2">
                ${human.cards.map(c => {
                  const role = ROLES[c.roleKey.toUpperCase()];
                  return `
                    <div class="px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold shadow-md transition ${c.revealed ? 'bg-red-950/30 border-red-800/50 text-red-400 opacity-60 line-through' : 'bg-indigo-950/60 border-indigo-500/50 text-indigo-200'}">
                      <span class="text-sm">${role?.icon || '🂠'}</span>
                      <div class="text-left">
                        <p class="leading-none text-[11px] font-black">${role?.name || c.roleKey}</p>
                        <p class="text-[8px] text-slate-400 leading-none">${c.revealed ? 'Revelada' : 'Secreta'}</p>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <!-- BOTÕES DE AÇÕES (HABILITADOS QUANDO É A VEZ DO HUMANO) -->
            ${isHumanTurn && this.state.phase === 'ACTION' ? this.renderActionButtons(human) : ''}
          </div>
        </footer>
      </div>
    `;

    this.bindEvents(human, active);
  }

  renderReactionBanner(human, active) {
    if (this.state.phase === 'CHALLENGE_ACTION' && active.isBot) {
      const act = this.state.currentAction;
      const role = ROLES[act.claimedRole?.toUpperCase()];
      return `
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/80 to-purple-950/80 border-2 border-red-500/60 shadow-xl flex flex-col gap-2.5 animate-bounce-subtle">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-red-300 flex items-center gap-1">
              ⚡ JANELA DE CONTESTAÇÃO
            </span>
            <span class="text-[10px] text-red-200 font-mono animate-pulse">Decida em 10s...</span>
          </div>
          <p class="text-xs text-slate-200 font-medium">
            <strong class="text-amber-300">${active.name}</strong> declarou a ação de <strong>${role?.name}</strong>: <em>"${act.type}"</em>.
          </p>
          <div class="flex gap-2">
            <button id="btn-corte-challenge" class="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-title text-xs font-black shadow-lg shadow-red-900/40 active:scale-95 transition">
              ⚡ CONTESTAR (MENTIRA!)
            </button>
            <button id="btn-corte-pass" class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-title text-xs font-bold border border-slate-700 active:scale-95 transition">
              ✓ Deixar Passar
            </button>
          </div>
        </div>
      `;
    }

    if (this.state.phase === 'BLOCK_DECISION') {
      return `
        <div class="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 to-purple-950/80 border-2 border-indigo-500/60 shadow-xl flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-indigo-300">🛡️ BLOQUEAR COM DUQUE?</span>
            <span class="text-[10px] text-indigo-200">Decida em 10s...</span>
          </div>
          <p class="text-xs text-slate-200">
            ${active.name} pediu Ajuda Externa (+2 moedas). Deseja bloquear alegando ter o Duque?
          </p>
          <div class="flex gap-2">
            <button id="btn-corte-block-yes" class="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-title text-xs font-black shadow-md transition">
              🛡️ Bloquear com Duque
            </button>
            <button id="btn-corte-block-no" class="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-title text-xs font-bold transition">
              ✓ Permitir
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  renderActionButtons(human) {
    const mustCoup = human.coins >= 10;
    const canCoup = human.coins >= 7;
    const canAssassinate = human.coins >= 3;

    if (mustCoup) {
      return `
        <div class="flex flex-col gap-1.5 p-2 bg-red-950/40 border border-red-500/40 rounded-xl">
          <p class="text-[11px] text-red-300 font-bold">Você possui 10+ moedas: Golpe de Estado é obrigatório!</p>
          <div class="flex gap-1.5 overflow-x-auto">
            ${this.renderTargetButtons('coup')}
          </div>
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
        <button id="btn-act-income" class="py-2 px-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-amber-300 font-title text-[11px] font-bold flex flex-col items-center">
          <span>🪙 +1 Renda</span>
        </button>
        <button id="btn-act-foreign" class="py-2 px-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-amber-300 font-title text-[11px] font-bold flex flex-col items-center">
          <span>💰 +2 Ajuda</span>
        </button>
        <button id="btn-act-tax" class="py-2 px-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 font-title text-[11px] font-bold flex flex-col items-center">
          <span>👑 Duque (+3)</span>
        </button>
        <button id="btn-act-exchange" class="py-2 px-1.5 rounded-xl bg-teal-950/60 hover:bg-teal-900/60 border border-teal-500/40 text-teal-200 font-title text-[11px] font-bold flex flex-col items-center">
          <span>📜 Embaixador</span>
        </button>
        <button id="btn-act-steal" class="py-2 px-1.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 text-blue-200 font-title text-[11px] font-bold flex flex-col items-center">
          <span>⚓ Capitão (Roubo)</span>
        </button>
        <button id="btn-act-assassinate" class="py-2 px-1.5 rounded-xl ${canAssassinate ? 'bg-red-950/60 hover:bg-red-900/60 border-red-500/40 text-red-200 cursor-pointer' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'} border font-title text-[11px] font-bold flex flex-col items-center">
          <span>🗡️ Assassino (-3)</span>
        </button>
        <button id="btn-act-coup" class="col-span-3 sm:col-span-2 py-2 px-1.5 rounded-xl ${canCoup ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white border-amber-400 font-black cursor-pointer' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'} border font-title text-[11px] flex items-center justify-center gap-1">
          <span>⚔️ GOLPE DE ESTADO (-7)</span>
        </button>
      </div>
    `;
  }

  renderTargetButtons(actionType) {
    const rivals = this.state.players
      .map((p, idx) => ({ ...p, originalIdx: idx }))
      .filter(p => p.isAlive && p.isBot);

    return rivals.map(r => `
      <button data-target-idx="${r.originalIdx}" data-action-type="${actionType}" class="btn-target-select flex-1 py-2 px-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-title text-xs font-black shadow-md flex items-center justify-center gap-1">
        <span>${r.avatar}</span>
        <span class="truncate">${r.name}</span>
      </button>
    `).join('');
  }

  bindEvents(human, active) {
    const backBtn = this.container.querySelector('#btn-corte-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    // Contest buttons
    const btnChallenge = this.container.querySelector('#btn-corte-challenge');
    if (btnChallenge) {
      btnChallenge.onclick = () => {
        this.executeContest(human, active, this.state.currentAction.claimedRole);
      };
    }

    const btnPass = this.container.querySelector('#btn-corte-pass');
    if (btnPass) {
      btnPass.onclick = () => {
        this.resolveActionWithoutChallenge();
      };
    }

    // Block buttons
    const btnBlockYes = this.container.querySelector('#btn-corte-block-yes');
    if (btnBlockYes) {
      btnBlockYes.onclick = () => this.resolveBlockDecision(true);
    }
    const btnBlockNo = this.container.querySelector('#btn-corte-block-no');
    if (btnBlockNo) {
      btnBlockNo.onclick = () => this.resolveBlockDecision(false);
    }

    // Human action buttons
    const btnIncome = this.container.querySelector('#btn-act-income');
    if (btnIncome) btnIncome.onclick = () => this.applyAction(human, { action: 'income' });

    const btnForeign = this.container.querySelector('#btn-act-foreign');
    if (btnForeign) btnForeign.onclick = () => this.applyAction(human, { action: 'foreign_aid' });

    const btnTax = this.container.querySelector('#btn-act-tax');
    if (btnTax) btnTax.onclick = () => this.applyAction(human, { action: 'tax' });

    const btnExchange = this.container.querySelector('#btn-act-exchange');
    if (btnExchange) btnExchange.onclick = () => this.applyAction(human, { action: 'exchange' });

    // Target modal for Steal, Assassinate, Coup
    const btnSteal = this.container.querySelector('#btn-act-steal');
    if (btnSteal) btnSteal.onclick = () => this.showTargetPicker('steal');

    const btnAssassinate = this.container.querySelector('#btn-act-assassinate');
    if (btnAssassinate && human.coins >= 3) {
      btnAssassinate.onclick = () => this.showTargetPicker('assassinate');
    }

    const btnCoup = this.container.querySelector('#btn-act-coup');
    if (btnCoup && human.coins >= 7) {
      btnCoup.onclick = () => this.showTargetPicker('coup');
    }

    // Modal target click
    this.container.querySelectorAll('.btn-target-select').forEach(btn => {
      btn.onclick = () => {
        const targetIdx = parseInt(btn.dataset.targetIdx);
        const actionType = btn.dataset.actionType;
        this.applyAction(human, { action: actionType, targetIdx });
      };
    });
  }

  showTargetPicker(actionType) {
    const rivals = this.state.players
      .map((p, idx) => ({ ...p, originalIdx: idx }))
      .filter(p => p.isAlive && p.isBot);

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-gradient-to-b from-slate-900 to-[#181226] border-2 border-indigo-500/50 rounded-2xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
        <h3 class="font-title text-base font-black text-amber-300 text-center">
          Escolha o Alvo para ${actionType.toUpperCase()}
        </h3>
        <div class="flex flex-col gap-2">
          ${rivals.map(r => `
            <button data-idx="${r.originalIdx}" class="btn-pick-target p-3 rounded-xl bg-slate-800 hover:bg-indigo-900/60 border border-slate-700 hover:border-indigo-500/50 flex items-center justify-between text-slate-100 font-bold transition">
              <span class="flex items-center gap-2">
                <span class="text-lg">${r.avatar}</span>
                <span>${r.name}</span>
              </span>
              <span class="text-amber-400 font-mono text-xs">🪙 ${r.coins}</span>
            </button>
          `).join('')}
        </div>
        <button id="btn-cancel-target" class="py-2 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-700">
          Cancelar
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelectorAll('.btn-pick-target').forEach(btn => {
      btn.onclick = () => {
        const targetIdx = parseInt(btn.dataset.idx);
        document.body.removeChild(modal);
        const human = this.state.players.find(p => !p.isBot) || this.state.players[0];
        this.applyAction(human, { action: actionType, targetIdx });
      };
    });

    modal.querySelector('#btn-cancel-target').onclick = () => {
      document.body.removeChild(modal);
    };
  }

  renderGameOver() {
    const isHumanWinner = this.state.winner && !this.state.winner.isBot;
    const xpResult = this.playerService.recordGameResult('corte', isHumanWinner);

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#140F22] via-[#1A1429] to-[#0D0A17] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${isHumanWinner ? 'border-amber-500 shadow-2xl shadow-amber-500/20' : 'border-red-500/50'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${isHumanWinner ? '👑' : '💀'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${isHumanWinner ? 'text-amber-400' : 'text-red-400'}">
              ${isHumanWinner ? 'SOBERANO DA CORTE!' : 'VOCÊ FOI DEPOSTO!'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              ${isHumanWinner ? 'Você sobreviveu às intrigas e blefes e dominou a Corte das Sombras!' : `${this.state.winner?.name || 'Outro nobre'} conquistou o trono absoluto.`}
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível na Corte</p>
              <p class="text-lg font-black text-indigo-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-corte-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-title text-sm font-black shadow-lg shadow-amber-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-corte-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
