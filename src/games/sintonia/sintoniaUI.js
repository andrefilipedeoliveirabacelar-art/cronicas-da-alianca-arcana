// ============================================================================
// INTERFACE DE USUÁRIO: SINTONIA TOTAL (WAVELENGTH) — MOBILE-FIRST
// ============================================================================

import {
  generateBotClueForTarget,
  startRoundWithClue,
  resolveGuess,
  nextSintoniaRound
} from './sintoniaLogic.js';

export class SintoniaUI {
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
    this.checkCluePhase();
  }

  destroy() {
    if (this.timer) clearTimeout(this.timer);
    this.container.innerHTML = '';
  }

  checkCluePhase() {
    if (this.state.phase === 'CLUE') {
      // Bot Psíquico gera a pista após breve suspense
      this.timer = setTimeout(() => {
        const botClue = generateBotClueForTarget(this.state.currentCard, this.state.targetPosition);
        startRoundWithClue(this.state, botClue);
        this.render();
      }, 1200);
    }
  }

  render() {
    if (this.state.phase === 'GAME_OVER') {
      this.renderGameOver();
      return;
    }

    const card = this.state.currentCard;

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#0A1326] via-[#0F1E3D] to-[#070D1A] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-blue-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-sintonia-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-400">
                📻 SINTONIA TOTAL
              </h2>
              <p class="text-[9px] text-cyan-400/80">Rodada ${this.state.round} de ${this.state.maxRounds} • Pontos: ${this.state.teamScore}</p>
            </div>
          </div>
          <div class="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-xs font-black text-blue-300">
            ${this.state.teamScore} pts
          </div>
        </header>

        <!-- ÁREA CENTRAL DO DISPOSITIVO DE ESPECTRO -->
        <main class="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full justify-center">
          <!-- CARD DE ESPECTRO (DUAS PONTAS OPOSTAS) -->
          <div class="p-3 rounded-2xl bg-black/40 border border-blue-500/30 flex items-center justify-between gap-2 text-center shadow-lg">
            <div class="flex-1 p-2 rounded-xl bg-blue-950/40 border border-blue-500/20">
              <span class="text-[10px] text-blue-400 font-mono uppercase block">Extremo Esquerdo</span>
              <p class="font-title text-xs font-black text-blue-200 mt-0.5 leading-tight">${card.left}</p>
            </div>
            <span class="text-base text-cyan-400 font-black">⟷</span>
            <div class="flex-1 p-2 rounded-xl bg-purple-950/40 border border-purple-500/20">
              <span class="text-[10px] text-purple-400 font-mono uppercase block">Extremo Direito</span>
              <p class="font-title text-xs font-black text-purple-200 mt-0.5 leading-tight">${card.right}</p>
            </div>
          </div>

          <!-- PISTA DO PSÍQUICO -->
          <div class="p-4 rounded-3xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-2 border-cyan-400/50 shadow-xl text-center space-y-1">
            <span class="text-[10px] font-mono uppercase tracking-widest text-cyan-300 flex items-center justify-center gap-1">
              <span>🧠</span>
              <span>Pista da Frequência Mental</span>
            </span>
            <h3 class="font-title text-base sm:text-lg font-black text-amber-300 italic">
              ${this.state.psychicClue ? `"${this.state.psychicClue}"` : 'Sintonizando mente do psíquico...'}
            </h3>
          </div>

          <!-- O DIAL DE SINTONIA (SLIDER INTERATIVO + PONTEIRO) -->
          <div class="p-5 rounded-3xl bg-slate-950/80 border-2 border-blue-500/40 shadow-2xl flex flex-col gap-4">
            <div class="relative w-full h-14 bg-gradient-to-r from-blue-900/60 via-slate-800 to-purple-900/60 rounded-2xl border border-slate-700 overflow-hidden flex items-center px-2">
              <!-- ZONA DO ALVO (REVELADA APENAS NA FASE REVEAL) -->
              ${this.state.phase === 'REVEAL' ? this.renderTargetZone() : ''}

              <!-- PONTEIRO ATUAL -->
              <div id="dial-needle" class="absolute top-0 bottom-0 w-1.5 bg-amber-400 shadow-lg shadow-amber-400/60 z-20 pointer-events-none transition-all duration-75" style="left: ${this.state.needlePosition}%">
                <div class="w-4 h-4 rounded-full bg-amber-400 -translate-x-[5px] -translate-y-1 shadow-md"></div>
              </div>
            </div>

            <!-- CONTROLE DE SLIDER -->
            ${this.state.phase === 'GUESSING' ? `
              <div class="space-y-2">
                <div class="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>0% (Esquerda)</span>
                  <span id="slider-val-text" class="text-amber-400 font-bold">${this.state.needlePosition}%</span>
                  <span>100% (Direita)</span>
                </div>
                <input id="needle-range-input" type="range" min="0" max="100" value="${this.state.needlePosition}" class="w-full h-3 rounded-lg bg-slate-800 accent-amber-400 cursor-pointer" />
              </div>

              <button id="btn-confirm-guess" class="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-title text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition transform active:scale-95">
                🎯 Confirmar Sintonia do Ponteiro
              </button>
            ` : ''}

            <!-- RESULTADO DA REVELAÇÃO -->
            ${this.state.phase === 'REVEAL' && this.state.lastResult ? `
              <div class="p-3.5 rounded-2xl bg-blue-950/50 border border-cyan-400/50 text-center space-y-2 animate-fade-in">
                <p class="font-title text-sm font-black text-amber-300">${this.state.lastResult.text}</p>
                <div class="flex justify-around text-xs text-slate-300">
                  <span>Seu Palpite: <strong>${this.state.lastResult.needle}%</strong></span>
                  <span>Alvo Real: <strong>${this.state.lastResult.target}%</strong></span>
                </div>
                <button id="btn-next-sintonia" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-title text-xs font-black shadow-md transition transform active:scale-95 mt-1">
                  Próxima Rodada →
                </button>
              </div>
            ` : ''}
          </div>
        </main>
      </div>
    `;

    this.bindEvents();
  }

  renderTargetZone() {
    const t = this.state.targetPosition;
    return `
      <!-- Zona 2 pts (+-16) -->
      <div class="absolute top-0 bottom-0 bg-yellow-500/30 border-x border-yellow-400/40 z-0" style="left: ${Math.max(0, t - 16)}%; width: 32%;"></div>
      <!-- Zona 3 pts (+-10) -->
      <div class="absolute top-0 bottom-0 bg-amber-500/40 border-x border-amber-400/60 z-5" style="left: ${Math.max(0, t - 10)}%; width: 20%;"></div>
      <!-- Zona 4 pts (+-4 Bullseye) -->
      <div class="absolute top-0 bottom-0 bg-emerald-500/70 border-x-2 border-emerald-300 z-10 flex items-center justify-center text-[10px] font-black text-white" style="left: ${Math.max(0, t - 4)}%; width: 8%;">
        🎯
      </div>
    `;
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-sintonia-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    const slider = this.container.querySelector('#needle-range-input');
    const needle = this.container.querySelector('#dial-needle');
    const valText = this.container.querySelector('#slider-val-text');

    if (slider && needle && valText) {
      slider.oninput = (e) => {
        const val = parseInt(e.target.value);
        this.state.needlePosition = val;
        needle.style.left = `${val}%`;
        valText.textContent = `${val}%`;
      };
    }

    const btnConfirm = this.container.querySelector('#btn-confirm-guess');
    if (btnConfirm) {
      btnConfirm.onclick = () => {
        resolveGuess(this.state, this.state.needlePosition);
        this.render();
      };
    }

    const btnNext = this.container.querySelector('#btn-next-sintonia');
    if (btnNext) {
      btnNext.onclick = () => {
        nextSintoniaRound(this.state);
        this.render();
        this.checkCluePhase();
      };
    }
  }

  renderGameOver() {
    const won = this.state.teamScore >= 10;
    const xpResult = this.playerService.recordGameResult('sintonia', won, { score: this.state.teamScore });

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#0A1326] via-[#0F1E3D] to-[#070D1A] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${won ? 'border-amber-400 shadow-2xl shadow-cyan-500/20' : 'border-blue-500/40'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${won ? '📻✨' : '📡'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${won ? 'text-amber-300' : 'text-blue-300'}">
              ${won ? 'SINTONIA PERFEITA!' : 'FIM DA TRANSMISSÃO'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Você acumulou <strong>${this.state.teamScore} pontos</strong> em ${this.state.maxRounds} frequências sintonizadas!
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível em Sintonia</p>
              <p class="text-lg font-black text-cyan-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-sintonia-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-title text-sm font-black shadow-lg shadow-cyan-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-sintonia-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
