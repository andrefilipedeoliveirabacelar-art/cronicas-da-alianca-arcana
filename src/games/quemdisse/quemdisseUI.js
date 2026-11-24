// ============================================================================
// INTERFACE DE USUÁRIO: QUEM DISSE ISSO? — MOBILE-FIRST
// ============================================================================

import {
  submitQuoteAnswer,
  nextQuoteRound
} from './quemdisseLogic.js';

export class QuemDisseUI {
  constructor(container, playerService, onExitToHub) {
    this.container = container;
    this.playerService = playerService;
    this.onExitToHub = onExitToHub;
    this.state = null;
  }

  start(state) {
    this.state = state;
    this.render();
  }

  destroy() {
    this.container.innerHTML = '';
  }

  render() {
    if (this.state.phase === 'GAME_OVER') {
      this.renderGameOver();
      return;
    }

    const q = this.state.currentQuote;

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#1C1405] via-[#2A1D08] to-[#100B03] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-amber-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-quemdisse-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-400">
                💬 QUEM DISSE ISSO?
              </h2>
              <p class="text-[9px] text-amber-300/80">Rodada ${this.state.round} de ${this.state.maxRounds} • Pontos: ${this.state.score}</p>
            </div>
          </div>
          <!-- Combo Streak -->
          <div class="flex items-center gap-1.5">
            ${this.state.streak > 1 ? `
              <span class="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40 text-[10px] font-black animate-pulse">
                🔥 Combo x${this.state.streak}
              </span>
            ` : ''}
            <span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300">
              ${this.state.score} pts
            </span>
          </div>
        </header>

        <!-- ÁREA CENTRAL: O CARD DA CITAÇÃO -->
        <main class="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full justify-center">
          <div class="p-6 rounded-3xl bg-slate-950/90 border-2 border-amber-500/60 shadow-2xl flex flex-col gap-4 text-center relative overflow-hidden">
            <span class="text-4xl text-amber-400/40 font-serif leading-none select-none">“</span>
            
            <div class="-mt-3 space-y-1">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                ${q.category}
              </span>
              <h3 class="font-title text-lg sm:text-xl font-black text-white leading-relaxed mt-2">
                "${q.quote}"
              </h3>
            </div>

            <!-- OPÇÕES DE RESPOSTA -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              ${q.options.map(opt => {
                let btnStyle = 'bg-slate-900/90 hover:bg-amber-950/60 border-slate-700 text-slate-200';
                if (this.state.phase === 'REVEAL') {
                  if (opt === q.correct) {
                    btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-black shadow-lg shadow-emerald-900/30';
                  } else if (opt === this.state.lastResult?.chosenOption) {
                    btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-300 line-through';
                  } else {
                    btnStyle = 'bg-black/40 border-slate-800 text-slate-500 opacity-40';
                  }
                }
                return `
                  <button data-option="${opt}" class="btn-quote-option p-3 rounded-2xl border-2 text-xs font-bold text-center transition active:scale-95 ${btnStyle}">
                    ${opt}
                  </button>
                `;
              }).join('')}
            </div>

            <!-- REVELAÇÃO E CURIOSIDADE -->
            ${this.state.phase === 'REVEAL' && this.state.lastResult ? `
              <div class="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-center space-y-2 animate-fade-in">
                <p class="text-xs text-amber-200 leading-relaxed">
                  💡 <strong>Curiosidade:</strong> ${this.state.lastResult.trivia}
                </p>
                <button id="btn-next-quote" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-title text-xs font-black uppercase tracking-wider shadow-md transition transform active:scale-95">
                  Próxima Citação →
                </button>
              </div>
            ` : ''}
          </div>
        </main>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-quemdisse-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    if (this.state.phase === 'ANSWERING') {
      this.container.querySelectorAll('.btn-quote-option').forEach(btn => {
        btn.onclick = () => {
          const opt = btn.dataset.option;
          submitQuoteAnswer(this.state, opt);
          this.render();
        };
      });
    }

    const btnNext = this.container.querySelector('#btn-next-quote');
    if (btnNext) {
      btnNext.onclick = () => {
        nextQuoteRound(this.state);
        this.render();
      };
    }
  }

  renderGameOver() {
    const won = this.state.score >= 400;
    const xpResult = this.playerService.recordGameResult('quemdisse', won, { score: this.state.score });

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#1C1405] via-[#2A1D08] to-[#100B03] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${won ? 'border-amber-400 shadow-2xl shadow-yellow-500/20' : 'border-amber-500/40'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${won ? '🏆💬' : '📜'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${won ? 'text-amber-300' : 'text-slate-200'}">
              ${won ? 'ENCICLOPÉDIA DA CULTURA POP!' : 'FIM DO QUIZ DE FRASES'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Você marcou <strong>${this.state.score} pontos</strong> identificando citações históricas!
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível em Citações</p>
              <p class="text-lg font-black text-amber-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-quemdisse-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-title text-sm font-black shadow-lg shadow-amber-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-quemdisse-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
