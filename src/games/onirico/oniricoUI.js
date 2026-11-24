// ============================================================================
// INTERFACE DE USUÁRIO: ONÍRICO (DIXIT) — MOBILE-FIRST
// ============================================================================

import {
  SUGGESTED_CLUES,
  setClueAndNarratorCard,
  playOtherPlayerCard,
  castVote,
  nextOniricoRound
} from './oniricoLogic.js';

export class OniricoUI {
  constructor(container, playerService, onExitToHub) {
    this.container = container;
    this.playerService = playerService;
    this.onExitToHub = onExitToHub;
    this.state = null;
    this.timer = null;
  }

  start(state) {
    this.state = state;
    this.render();
    this.processAITurns();
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.container.innerHTML = '';
  }

  processAITurns() {
    const narrator = this.state.players[this.state.narratorIndex];

    // Se Narrador é Bot e estamos na fase CLUE
    if (narrator.isBot && this.state.phase === 'CLUE') {
      this.timer = setTimeout(() => {
        const randomCard = narrator.hand[Math.floor(Math.random() * narrator.hand.length)];
        const clue = SUGGESTED_CLUES[Math.floor(Math.random() * SUGGESTED_CLUES.length)];
        setClueAndNarratorCard(this.state, randomCard.id, clue);
        this.render();
        this.processAITurns();
      }, 1500);
      return;
    }

    // Se estamos na fase PLAY_CARDS, bots jogam cartas
    if (this.state.phase === 'PLAY_CARDS') {
      const botsToPlay = this.state.players.filter(p => p.isBot && p.id !== narrator.id && !this.state.tableCards.some(tc => tc.ownerId === p.id));
      if (botsToPlay.length > 0) {
        this.timer = setTimeout(() => {
          botsToPlay.forEach(bot => {
            const card = bot.hand[Math.floor(Math.random() * bot.hand.length)];
            playOtherPlayerCard(this.state, bot.id, card.id);
          });
          this.render();
          this.processAITurns();
        }, 1200);
        return;
      }
    }

    // Se estamos na fase VOTING, bots votam
    if (this.state.phase === 'VOTING') {
      const botsToVote = this.state.players.filter(p => p.isBot && p.id !== narrator.id);
      this.timer = setTimeout(() => {
        botsToVote.forEach(bot => {
          // Bot não vota na própria carta
          const validCards = this.state.tableCards
            .map((tc, idx) => ({ ...tc, idx }))
            .filter(tc => tc.ownerId !== bot.id);
          
          if (validCards.length > 0) {
            const pick = validCards[Math.floor(Math.random() * validCards.length)];
            castVote(this.state, bot.id, pick.idx);
          }
        });
        this.render();
      }, 1800);
    }
  }

  render() {
    if (this.state.phase === 'GAME_OVER') {
      this.renderGameOver();
      return;
    }

    const human = this.state.players.find(p => !p.isBot) || this.state.players[0];
    const narrator = this.state.players[this.state.narratorIndex];
    const isHumanNarrator = !narrator.isBot;

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#07191E] via-[#0B252C] to-[#041217] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-teal-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-onirico-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-300">
                🌙 ONÍRICO
              </h2>
              <p class="text-[9px] text-teal-400/80">Rodada ${this.state.round} de 6 • Narrador: ${narrator.name}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            ${this.state.players.map(p => `
              <div class="px-2 py-0.5 rounded-lg bg-teal-950/40 border border-teal-500/20 text-[10px] font-bold flex items-center gap-1">
                <span>${p.avatar}</span>
                <span class="text-teal-300">${p.score}p</span>
              </div>
            `).join('')}
          </div>
        </header>

        <!-- BANNER DE PISTA ATUAL (SE HOUVER) -->
        ${this.state.currentClue ? `
          <div class="mx-3 mt-2 p-2.5 rounded-2xl bg-teal-950/60 border border-teal-500/40 text-center shadow-lg animate-fade-in">
            <span class="text-[10px] uppercase font-mono tracking-widest text-teal-400">Pista do Narrador</span>
            <p class="font-title text-sm sm:text-base font-black text-teal-100 italic">"${this.state.currentClue}"</p>
          </div>
        ` : ''}

        <!-- ÁREA CENTRAL: MESA DE CARTAS OU REVIEW -->
        <main class="flex-1 flex flex-col p-3 gap-3 max-w-4xl mx-auto w-full overflow-y-auto">
          ${this.renderMainStage(human, narrator, isHumanNarrator)}
        </main>

        <!-- MÃO DO JOGADOR HUMANO (INFERIOR FIXO) -->
        <footer class="sticky bottom-0 z-40 bg-[#06161B]/95 backdrop-blur-md border-t-2 border-teal-500/30 p-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] shadow-2xl">
          <div class="max-w-4xl mx-auto flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-xs font-bold text-teal-300 px-1">
              <span>Sua Mão de Cartas (${human.hand.length})</span>
              <span class="text-[10px] text-slate-400">Toque para selecionar</span>
            </div>
            
            <div class="overflow-x-auto snap-x flex gap-2 pb-1">
              ${human.hand.map(card => `
                <div data-card-id="${card.id}" class="btn-hand-card flex-shrink-0 w-24 sm:w-28 h-36 rounded-2xl p-2 bg-gradient-to-br ${card.gradient} border border-teal-400/40 shadow-lg flex flex-col justify-between cursor-pointer hover:scale-105 active:scale-95 transition">
                  <div class="flex justify-between items-start">
                    <span class="text-2xl">${card.icon}</span>
                  </div>
                  <div>
                    <p class="font-title text-[10px] font-black leading-tight text-white drop-shadow">${card.title}</p>
                    <p class="text-[8px] text-teal-200/90 leading-tight line-clamp-2 mt-0.5">${card.desc}</p>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </footer>
      </div>
    `;

    this.bindEvents(human, narrator, isHumanNarrator);
  }

  renderMainStage(human, narrator, isHumanNarrator) {
    if (this.state.phase === 'CLUE' && isHumanNarrator) {
      return `
        <div class="flex-1 flex flex-col items-center justify-center p-4 bg-teal-950/30 border border-teal-500/30 rounded-3xl text-center gap-3">
          <span class="text-4xl animate-bounce-subtle">🪶</span>
          <h3 class="font-title text-base font-black text-teal-200">Você é o Narrador da Rodada!</h3>
          <p class="text-xs text-slate-300 max-w-sm">
            Escolha uma carta da sua mão abaixo e digite ou selecione uma pista poética e misteriosa.
          </p>
          <div class="w-full max-w-sm flex flex-col gap-2">
            <input id="input-custom-clue" type="text" placeholder="Digite sua pista poética..." class="w-full px-3 py-2.5 rounded-xl bg-black/50 border border-teal-500/50 text-xs text-teal-100 placeholder-teal-600 focus:outline-none focus:border-teal-400" />
            
            <div class="flex flex-wrap gap-1 justify-center">
              ${SUGGESTED_CLUES.slice(0, 4).map(sug => `
                <button class="btn-sug-clue px-2 py-1 rounded-lg bg-teal-900/60 border border-teal-500/30 text-[10px] text-teal-200 hover:bg-teal-800 transition">
                  ${sug}
                </button>
              `).join('')}
            </div>
          </div>
          <p class="text-[10px] text-amber-300 font-bold mt-1">Toque na carta da sua mão abaixo para enviar!</p>
        </div>
      `;
    }

    if (this.state.phase === 'PLAY_CARDS') {
      const hasHumanPlayed = this.state.tableCards.some(tc => tc.ownerId === human.id);
      return `
        <div class="flex-1 flex flex-col items-center justify-center p-4 bg-teal-950/30 border border-teal-500/30 rounded-3xl text-center gap-3">
          <span class="text-4xl">🎨</span>
          <h3 class="font-title text-base font-black text-teal-200">
            ${hasHumanPlayed ? 'Carta Enviada!' : 'Escolha sua Carta para a Pista!'}
          </h3>
          <p class="text-xs text-slate-300 max-w-sm">
            ${hasHumanPlayed ? 'Aguardando os outros jogadores colocarem suas cartas na mesa...' : 'Selecione em sua mão abaixo a carta que melhor enganará os outros ou se assemelhe à pista.'}
          </p>
          <div class="flex gap-2">
            ${this.state.players.map(p => {
              const played = this.state.tableCards.some(tc => tc.ownerId === p.id);
              return `
                <div class="flex flex-col items-center gap-1">
                  <span class="text-2xl">${p.avatar}</span>
                  <span class="text-[9px] px-1.5 py-0.5 rounded-full ${played ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' : 'bg-slate-800 text-slate-500'}">
                    ${played ? 'Pronto ✓' : 'Pensando...'}
                  </span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (this.state.phase === 'VOTING') {
      return `
        <div class="flex flex-col gap-2">
          <div class="text-center">
            <h3 class="font-title text-sm font-black text-teal-200">Qual é a carta do Narrador?</h3>
            <p class="text-[11px] text-slate-300">Toque na carta que você acredita ser a original!</p>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            ${this.state.tableCards.map((tc, idx) => {
              const card = tc.card;
              const hasVoted = tc.votes.includes(human.id);
              return `
                <div data-table-idx="${idx}" class="btn-vote-card h-44 rounded-2xl p-2.5 bg-gradient-to-br ${card.gradient} border-2 ${hasVoted ? 'border-amber-400 shadow-xl shadow-amber-400/30 scale-102' : 'border-teal-500/40'} flex flex-col justify-between cursor-pointer active:scale-95 transition">
                  <div class="flex justify-between items-center">
                    <span class="text-xs font-black px-2 py-0.5 rounded-full bg-black/60 text-teal-300">#${idx + 1}</span>
                    <span class="text-2xl">${card.icon}</span>
                  </div>
                  <div>
                    <p class="font-title text-xs font-black text-white drop-shadow">${card.title}</p>
                    <p class="text-[9px] text-teal-200/90 line-clamp-2 mt-0.5">${card.desc}</p>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    if (this.state.phase === 'SCORING' && this.state.roundReview) {
      const rev = this.state.roundReview;
      return `
        <div class="flex-1 flex flex-col p-4 bg-teal-950/40 border border-teal-500/40 rounded-3xl gap-3 animate-fade-in">
          <div class="text-center">
            <span class="text-xs font-mono uppercase tracking-widest text-teal-400">Resultado da Rodada</span>
            <h3 class="font-title text-base font-black text-amber-300">Carta do Narrador: ${rev.narratorCard.title} ${rev.narratorCard.icon}</h3>
          </div>

          <div class="flex flex-col gap-2">
            ${this.state.players.map(p => {
              const pts = rev.scoreChanges[p.id] || 0;
              return `
                <div class="p-2.5 rounded-xl bg-black/40 border border-teal-500/20 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">${p.avatar}</span>
                    <div>
                      <p class="text-xs font-bold text-slate-200">${p.name}</p>
                      <p class="text-[10px] text-teal-400">Total: ${p.score} pontos</p>
                    </div>
                  </div>
                  <span class="text-sm font-black ${pts > 0 ? 'text-amber-400' : 'text-slate-500'}">
                    +${pts} pts
                  </span>
                </div>
              `;
            }).join('')}
          </div>

          <button id="btn-next-onirico-round" class="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-title text-xs font-black shadow-lg shadow-teal-500/20 transition transform active:scale-95">
            Avançar para Próxima Rodada →
          </button>
        </div>
      `;
    }

    return '';
  }

  bindEvents(human, narrator, isHumanNarrator) {
    const backBtn = this.container.querySelector('#btn-onirico-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    // Sugestões de pistas
    this.container.querySelectorAll('.btn-sug-clue').forEach(btn => {
      btn.onclick = () => {
        const input = this.container.querySelector('#input-custom-clue');
        if (input) input.value = btn.innerText.trim();
      };
    });

    // Toque em carta da mão
    this.container.querySelectorAll('.btn-hand-card').forEach(btn => {
      btn.onclick = () => {
        const cardId = btn.dataset.cardId;

        if (this.state.phase === 'CLUE' && isHumanNarrator) {
          const input = this.container.querySelector('#input-custom-clue');
          const clue = input?.value?.trim() || SUGGESTED_CLUES[0];
          setClueAndNarratorCard(this.state, cardId, clue);
          this.render();
          this.processAITurns();
        } else if (this.state.phase === 'PLAY_CARDS' && !isHumanNarrator) {
          playOtherPlayerCard(this.state, human.id, cardId);
          this.render();
          this.processAITurns();
        }
      };
    });

    // Votação
    this.container.querySelectorAll('.btn-vote-card').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.tableIdx);
        // Não pode votar na própria carta se for dono
        const tableCard = this.state.tableCards[idx];
        if (tableCard.ownerId === human.id) {
          alert('Você não pode votar na sua própria carta!');
          return;
        }
        castVote(this.state, human.id, idx);
        this.render();
        this.processAITurns();
      };
    });

    // Próxima Rodada
    const btnNext = this.container.querySelector('#btn-next-onirico-round');
    if (btnNext) {
      btnNext.onclick = () => {
        nextOniricoRound(this.state);
        this.render();
        this.processAITurns();
      };
    }
  }

  renderGameOver() {
    const isHumanWinner = this.state.winner?.id === 'human';
    const xpResult = this.playerService.recordGameResult('onirico', isHumanWinner);

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#07191E] via-[#0B252C] to-[#041217] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${isHumanWinner ? 'border-amber-400 shadow-2xl shadow-teal-500/20' : 'border-teal-500/40'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${isHumanWinner ? '🏆' : '🌙'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${isHumanWinner ? 'text-amber-300' : 'text-teal-300'}">
              ${isHumanWinner ? 'MESTRE DOS SONHOS!' : 'FIM DA JORNADA ONÍRICA'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              ${isHumanWinner ? 'Sua imaginação conquistou todos os viajantes!' : `${this.state.winner?.name || 'Outro viajante'} venceu com a maior pontuação de sonhos.`}
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível em Onírico</p>
              <p class="text-lg font-black text-teal-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-onirico-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 font-title text-sm font-black shadow-lg shadow-teal-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-onirico-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
