// ============================================================================
// INTERFACE DE USUÁRIO: PALAVRA PROIBIDA (TABOO) — MOBILE-FIRST
// ============================================================================

import {
  checkTabooGuess,
  skipTabooCard
} from './palavraLogic.js';

export class PalavraUI {
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
    this.startTimer();
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.container.innerHTML = '';
  }

  startTimer() {
    this.timer = setInterval(() => {
      if (this.state.phase === 'PLAYING') {
        this.state.timeRemaining--;
        if (this.state.timeRemaining <= 0) {
          clearInterval(this.timer);
          this.state.phase = 'GAME_OVER';
          this.render();
        } else {
          const timeText = this.container.querySelector('#taboo-timer-text');
          const timeBar = this.container.querySelector('#taboo-timer-bar');
          if (timeText) timeText.textContent = `${this.state.timeRemaining}s`;
          if (timeBar) timeBar.style.width = `${(this.state.timeRemaining / 60) * 100}%`;
        }
      }
    }, 1000);
  }

  render() {
    if (this.state.phase === 'GAME_OVER') {
      this.renderGameOver();
      return;
    }

    const card = this.state.currentCard;
    const currentClue = card.botClues[this.state.currentClueIndex % card.botClues.length];

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#2B0909] via-[#3B0C0C] to-[#170404] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-red-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-palavra-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-300">
                🚫 PALAVRA PROIBIDA
              </h2>
              <p class="text-[9px] text-red-300/80">Acertos: ${this.state.score} • Pulos: ${this.state.skippedList.length}</p>
            </div>
          </div>
          <span id="taboo-timer-text" class="text-xs font-mono font-black text-amber-300 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
            ${this.state.timeRemaining}s
          </span>
        </header>

        <!-- BARRA DO TEMPO -->
        <div class="w-full h-1 bg-black/40">
          <div id="taboo-timer-bar" class="h-full bg-gradient-to-r from-red-500 to-amber-400 transition-all duration-1000" style="width: ${(this.state.timeRemaining / 60) * 100}%"></div>
        </div>

        <!-- ÁREA CENTRAL: CARTA DE TABU -->
        <main class="flex-1 flex flex-col p-4 gap-4 max-w-md mx-auto w-full justify-center">
          <div class="p-5 rounded-3xl bg-slate-950/90 border-2 border-red-500/60 shadow-2xl flex flex-col gap-4 text-center">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block">Palavra Secreta a Adivinhar:</span>
              <h3 class="font-title text-2xl font-black text-white mt-1 tracking-wider">
                ${card.word}
              </h3>
            </div>

            <!-- AS 5 PALAVRAS PROIBIDAS (TABU) -->
            <div class="p-3.5 rounded-2xl bg-red-950/50 border border-red-500/40 space-y-2">
              <span class="text-[10px] font-bold text-red-300 uppercase tracking-wider flex items-center justify-center gap-1">
                <span>⚠️</span>
                <span>5 Termos Proibidos (NÃO PODEM SER DITOS):</span>
              </span>
              <div class="flex flex-wrap gap-1.5 justify-center">
                ${card.taboo.map(t => `
                  <span class="px-2.5 py-1 rounded-xl bg-red-600/30 border border-red-500 text-red-200 text-xs font-black uppercase line-through">
                    ${t}
                  </span>
                `).join('')}
              </div>
            </div>

            <!-- PISTA ATUAL DO PARCEIRO (BOT) -->
            <div class="p-3.5 rounded-2xl bg-black/50 border border-slate-800 text-left space-y-1">
              <span class="text-[10px] text-amber-400 font-mono font-bold block">🤖 Dica do Parceiro de Equipe:</span>
              <p class="text-xs text-slate-200 italic leading-relaxed font-medium">
                "${currentClue}"
              </p>
            </div>

            <div class="flex gap-2">
              <button id="btn-next-clue" class="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition">
                💡 Mais uma Dica
              </button>
              <button id="btn-skip-card" class="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-rose-300 text-xs font-bold transition">
                ⏩ Pular Palavra
              </button>
            </div>
          </div>
        </main>

        <!-- FOOTER: INPUT DE ADIVINHAÇÃO -->
        <footer class="sticky bottom-0 z-40 bg-[#1A0505]/95 backdrop-blur-md border-t-2 border-red-500/30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl">
          <div class="max-w-md mx-auto flex gap-2">
            <input id="input-taboo-guess" type="text" placeholder="Qual é a palavra?" class="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-red-500/50 text-xs text-white placeholder-red-300/40 focus:outline-none focus:border-red-400 font-bold uppercase" />
            <button id="btn-submit-taboo" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-title text-xs font-black shadow-lg shadow-red-900/40 active:scale-95 transition">
              Adivinhar!
            </button>
          </div>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-palavra-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    const input = this.container.querySelector('#input-taboo-guess');
    const submitBtn = this.container.querySelector('#btn-submit-taboo');

    const handleGuess = () => {
      const val = input?.value?.trim();
      if (val) {
        const correct = checkTabooGuess(this.state, val);
        input.value = '';
        if (correct) {
          this.render();
        } else {
          input.classList.add('border-red-500', 'animate-shake');
          setTimeout(() => input.classList.remove('border-red-500', 'animate-shake'), 400);
        }
      }
    };

    if (submitBtn) submitBtn.onclick = handleGuess;
    if (input) {
      input.onkeydown = (e) => {
        if (e.key === 'Enter') handleGuess();
      };
      // Foco automático
      setTimeout(() => input.focus(), 100);
    }

    const btnNextClue = this.container.querySelector('#btn-next-clue');
    if (btnNextClue) {
      btnNextClue.onclick = () => {
        this.state.currentClueIndex++;
        this.render();
      };
    }

    const btnSkip = this.container.querySelector('#btn-skip-card');
    if (btnSkip) {
      btnSkip.onclick = () => {
        skipTabooCard(this.state);
        this.render();
      };
    }
  }

  renderGameOver() {
    const won = this.state.score >= 4;
    const xpResult = this.playerService.recordGameResult('palavra', won, { score: this.state.score });

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#2B0909] via-[#3B0C0C] to-[#170404] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${won ? 'border-amber-400 shadow-2xl shadow-red-500/20' : 'border-red-500/40'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${won ? '🏆🎉' : '⏰💥'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${won ? 'text-amber-300' : 'text-red-400'}">
              ${won ? 'MESTRE DAS PALAVRAS!' : 'O TEMPO ESGOTOU!'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Você decifrou <strong>${this.state.score} palavras</strong> contra o relógio!
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível em Palavras</p>
              <p class="text-lg font-black text-red-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-palavra-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 text-white font-title text-sm font-black shadow-lg shadow-red-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-palavra-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
