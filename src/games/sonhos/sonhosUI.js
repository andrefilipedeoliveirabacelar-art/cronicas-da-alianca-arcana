// ============================================================================
// INTERFACE DE USUÁRIO: ENTRE SONHOS (WHEN I DREAM) — MOBILE-FIRST
// ============================================================================

import {
  DREAM_ROLES,
  generateBotClue,
  submitGuess,
  resolveSonhosRound
} from './sonhosLogic.js';

export class SonhosUI {
  constructor(container, playerService, onExitToHub) {
    this.container = container;
    this.playerService = playerService;
    this.onExitToHub = onExitToHub;
    this.state = null;
    this.timer = null;
    this.spiritClueTimer = null;
  }

  start(state) {
    this.state = state;
    this.render();
    this.startDreamingLoop();
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.spiritClueTimer) clearInterval(this.spiritClueTimer);
    this.container.innerHTML = '';
  }

  startDreamingLoop() {
    // Timer regressivo de 60 segundos
    this.timer = setInterval(() => {
      if (this.state.phase === 'DREAMING') {
        this.state.timeRemaining--;
        if (this.state.timeRemaining <= 0) {
          clearInterval(this.timer);
          clearInterval(this.spiritClueTimer);
          this.state.phase = 'RECALL';
          this.render();
        } else {
          const timerBar = this.container.querySelector('#timer-bar-sonhos');
          const timerText = this.container.querySelector('#timer-text-sonhos');
          if (timerBar) timerBar.style.width = `${(this.state.timeRemaining / 60) * 100}%`;
          if (timerText) timerText.innerText = `${this.state.timeRemaining}s`;
        }
      }
    }, 1000);

    // Ciclo de pistas dos espíritos (a cada 2.5s um espírito dá uma nova pista)
    this.giveSpiritClues();
  }

  giveSpiritClues() {
    const spirits = this.state.players.filter(p => p.role !== 'dreamer');
    let spiritIdx = 0;

    this.spiritClueTimer = setInterval(() => {
      if (this.state.phase === 'DREAMING' && this.state.timeRemaining > 0) {
        if (this.state.currentCluesGiven.length < spirits.length) {
          const currentSpirit = spirits[spiritIdx % spirits.length];
          generateBotClue(this.state, currentSpirit);
          spiritIdx++;
          this.updateCluesBox();
        }
      }
    }, 2200);
  }

  updateCluesBox() {
    const box = this.container.querySelector('#sonhos-clues-container');
    if (!box) return;

    box.innerHTML = this.state.currentCluesGiven.map(c => `
      <div class="p-2 rounded-xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-between text-xs animate-fade-in">
        <span class="flex items-center gap-1.5 font-bold text-purple-200">
          <span>${c.avatar}</span>
          <span>${c.spiritName}:</span>
        </span>
        <span class="font-title font-black text-amber-300 uppercase tracking-wider text-sm">
          "${c.clue}"
        </span>
      </div>
    `).join('');
  }

  render() {
    if (this.state.phase === 'ROUND_SCORE' || this.state.phase === 'GAME_OVER') {
      this.renderGameOver();
      return;
    }

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#180B28] via-[#240E3E] to-[#0E0618] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-pink-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-sonhos-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 to-amber-300">
                ✨ ENTRE SONHOS
              </h2>
              <p class="text-[9px] text-pink-300/80">Você é o Sonhador 😴 • Decifre as pistas!</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span id="timer-text-sonhos" class="text-xs font-mono font-black text-amber-300 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30">
              ${this.state.timeRemaining}s
            </span>
          </div>
        </header>

        <!-- BARRA DE PROGRESSO DO TEMPO -->
        <div class="w-full h-1 bg-black/40">
          <div id="timer-bar-sonhos" class="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-1000" style="width: ${(this.state.timeRemaining / 60) * 100}%"></div>
        </div>

        <!-- ÁREA CENTRAL -->
        <main class="flex-1 flex flex-col p-3 gap-3 max-w-lg mx-auto w-full overflow-y-auto justify-center">
          ${this.state.phase === 'DREAMING' ? this.renderDreamingStage() : this.renderRecallStage()}
        </main>

        <!-- FOOTER: INPUT DE PALPITE -->
        ${this.state.phase === 'DREAMING' ? `
          <footer class="sticky bottom-0 z-40 bg-[#140822]/95 backdrop-blur-md border-t-2 border-pink-500/30 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-2xl">
            <div class="max-w-lg mx-auto flex gap-2">
              <input id="input-guess-sonhos" type="text" placeholder="Qual é a palavra do sonho?" class="flex-1 px-3.5 py-2.5 rounded-xl bg-black/60 border border-pink-500/50 text-xs text-white placeholder-pink-400/50 focus:outline-none focus:border-pink-300 font-bold" />
              <button id="btn-submit-guess" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-title text-xs font-black shadow-lg shadow-pink-900/40 active:scale-95 transition">
                Adivinhar!
              </button>
            </div>
          </footer>
        ` : ''}
      </div>
    `;

    this.bindEvents();
  }

  renderDreamingStage() {
    return `
      <div class="flex flex-col gap-3">
        <!-- PLACAR DE PALAVRAS -->
        <div class="flex items-center justify-between p-2.5 rounded-2xl bg-black/40 border border-purple-500/30 text-xs font-bold">
          <span class="text-emerald-400 flex items-center gap-1">
            ✓ Acertos: ${this.state.correctWords.length}
          </span>
          <span class="text-rose-400 flex items-center gap-1">
            ✗ Erros: ${this.state.wrongWords.length}
          </span>
        </div>

        <!-- ESPÍRITOS DA MESA -->
        <div class="p-3.5 rounded-3xl bg-purple-950/40 border border-purple-500/40 shadow-xl flex flex-col gap-2.5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black text-pink-300 flex items-center gap-1">
              👻 Sussurros dos Espíritos
            </span>
            <span class="text-[10px] text-purple-300 font-mono">1 palavra por espírito</span>
          </div>

          <div id="sonhos-clues-container" class="flex flex-col gap-1.5 min-h-[90px] justify-center">
            ${this.state.currentCluesGiven.length === 0 ? `
              <p class="text-center text-xs text-purple-300/60 italic animate-pulse">
                Ouvindo o primeiro sussurro...
              </p>
            ` : ''}
          </div>
        </div>

        <p class="text-[10px] text-center text-slate-400">
          Dica: Fadas dizem a verdade, Bicho-Papão mente e João Pestana equilibra!
        </p>
      </div>
    `;
  }

  renderRecallStage() {
    return `
      <div class="flex flex-col gap-4 p-5 rounded-3xl bg-purple-950/50 border-2 border-amber-400/50 text-center shadow-2xl">
        <span class="text-5xl animate-bounce-subtle">🌅</span>
        <div>
          <h3 class="font-title text-lg font-black text-amber-300">O Sonhador Acordou!</h3>
          <p class="text-xs text-slate-300 mt-1">
            O tempo acabou! Você adivinhou <strong>${this.state.correctWords.length} palavras</strong> com sucesso.
          </p>
        </div>

        <div class="flex flex-wrap gap-1.5 justify-center p-3 rounded-2xl bg-black/40">
          ${this.state.correctWords.map(w => `
            <span class="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
              ${w}
            </span>
          `).join('')}
        </div>

        <button id="btn-sonhos-resolve" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-title text-xs font-black shadow-lg shadow-amber-500/20 transition transform active:scale-95">
          Revelar Papéis Secretos e Pontuação →
        </button>
      </div>
    `;
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-sonhos-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    const guessInput = this.container.querySelector('#input-guess-sonhos');
    const guessBtn = this.container.querySelector('#btn-submit-guess');

    const handleGuess = () => {
      const val = guessInput?.value?.trim();
      if (val) {
        submitGuess(this.state, val);
        guessInput.value = '';
        this.render();
      }
    };

    if (guessBtn) guessBtn.onclick = handleGuess;
    if (guessInput) {
      guessInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleGuess();
      };
    }

    const resolveBtn = this.container.querySelector('#btn-sonhos-resolve');
    if (resolveBtn) {
      resolveBtn.onclick = () => {
        resolveSonhosRound(this.state, true);
        this.render();
      };
    }
  }

  renderGameOver() {
    const dreamer = this.state.players.find(p => p.role === 'dreamer');
    const isHumanWinner = dreamer.score >= 5;
    const xpResult = this.playerService.recordGameResult('sonhos', isHumanWinner);

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#180B28] via-[#240E3E] to-[#0E0618] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 border-pink-500/40 rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${isHumanWinner ? '✨' : '🌌'}</span>
          <div>
            <h2 class="font-title text-2xl font-black text-pink-300">
              SONHO CONCLUÍDO!
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Os papéis dos espíritos foram revelados!
            </p>
          </div>

          <div class="flex flex-col gap-2">
            ${this.state.players.map(p => {
              const role = DREAM_ROLES[p.role?.toUpperCase()] || DREAM_ROLES.DREAMER;
              return `
                <div class="p-2.5 rounded-xl bg-black/40 border border-purple-500/20 flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">${p.avatar}</span>
                    <div class="text-left">
                      <p class="font-bold text-slate-200">${p.name}</p>
                      <p class="text-[10px] text-purple-400">${role.icon} ${role.name}</p>
                    </div>
                  </div>
                  <span class="font-black text-amber-400">${p.score} pontos</span>
                </div>
              `;
            }).join('')}
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível em Sonhos</p>
              <p class="text-lg font-black text-pink-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-sonhos-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-title text-sm font-black shadow-lg shadow-pink-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-sonhos-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
