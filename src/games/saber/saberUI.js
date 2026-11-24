// ============================================================================
// INTERFACE DE USUÁRIO: MESTRE DO SABER — MOBILE-FIRST
// ============================================================================

import {
  submitHumanGuess,
  submitBet,
  nextSaberRound
} from './saberLogic.js';

export class SaberUI {
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

    const human = this.state.players.find(p => !p.isBot) || this.state.players[0];
    const q = this.state.currentQuestion;

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#061E1A] via-[#0A302A] to-[#041411] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-emerald-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-saber-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-amber-300">
                🧠 MESTRE DO SABER
              </h2>
              <p class="text-[9px] text-emerald-300/80">Rodada ${this.state.round} de ${this.state.maxRounds} • Fichas: ${human.chips}</p>
            </div>
          </div>
          <!-- Fichas do Jogador -->
          <span class="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300 flex items-center gap-1">
            <span>🪙</span>
            <span>${human.chips} Fichas</span>
          </span>
        </header>

        <!-- ÁREA CENTRAL -->
        <main class="flex-1 flex flex-col p-4 gap-4 max-w-lg mx-auto w-full justify-center">
          <!-- CARD DA PERGUNTA -->
          <div class="p-5 rounded-3xl bg-slate-950/90 border-2 border-emerald-500/50 shadow-2xl text-center space-y-2">
            <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
              Pergunta Numérica
            </span>
            <h3 class="font-title text-base sm:text-lg font-black text-white leading-relaxed">
              "${q.question}"
            </h3>
            <span class="text-[10px] text-teal-400 font-mono block">Unidade: ${q.unit}</span>
          </div>

          <!-- ETAPA 1: DIGITAR SEU PALPITE -->
          ${this.state.phase === 'GUESSING' ? `
            <div class="p-5 rounded-3xl bg-black/50 border border-emerald-500/30 text-center space-y-3">
              <span class="text-xs font-bold text-slate-300 block">
                Ninguém precisa saber o valor exato! Qual é o seu melhor palpite numérico?
              </span>
              <div class="flex gap-2 max-w-xs mx-auto">
                <input id="input-numeric-guess" type="number" placeholder="Digite seu número..." class="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-emerald-500/50 text-sm font-mono text-white text-center focus:outline-none focus:border-amber-400 font-bold" />
                <button id="btn-submit-numeric-guess" class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-title text-xs font-black uppercase tracking-wider shadow-md active:scale-95 transition">
                  Enviar
                </button>
              </div>
            </div>
          ` : ''}

          <!-- ETAPA 2: MESA DE APOSTAS COM OS PALPITES ORDENADOS -->
          ${this.state.phase === 'BETTING' || this.state.phase === 'REVEAL' ? `
            <div class="space-y-2.5">
              <div class="text-center">
                <span class="text-[10px] uppercase font-mono text-teal-400 tracking-wider">
                  ${this.state.phase === 'BETTING' ? 'Toque no palpite mais próximo sem passar para apostar:' : 'Resultado da Rodada:'}
                </span>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                ${this.state.sortedGuesses.map((g, idx) => {
                  const isWinning = this.state.phase === 'REVEAL' && this.state.winningGuessIdx === idx;
                  const isHumanBet = human.betGuessIdx === idx;

                  let borderClass = 'border-emerald-500/40 bg-slate-950/80 hover:border-amber-400';
                  if (isWinning) {
                    borderClass = 'border-amber-400 bg-amber-950/60 shadow-xl shadow-amber-400/30 ring-2 ring-amber-400';
                  } else if (isHumanBet) {
                    borderClass = 'border-teal-400 bg-teal-950/60 shadow-md';
                  }

                  return `
                    <button data-guess-idx="${idx}" class="btn-bet-guess p-3 rounded-2xl border-2 flex flex-col justify-between text-center transition active:scale-95 ${borderClass} ${this.state.phase !== 'BETTING' ? 'cursor-default pointer-events-none' : ''}">
                      <div class="flex items-center justify-between text-[10px]">
                        <span class="text-xs">${g.player.avatar}</span>
                        <span class="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                          ${g.payout}:1
                        </span>
                      </div>

                      <div class="my-2">
                        <span class="text-lg font-black text-white font-mono leading-none">${g.guess}</span>
                        <p class="text-[9px] text-slate-400 truncate mt-0.5">${g.player.name}</p>
                      </div>

                      ${isWinning ? `
                        <span class="text-[9px] font-black text-amber-300 uppercase animate-bounce-subtle">👑 Vencedor</span>
                      ` : isHumanBet ? `
                        <span class="text-[9px] font-bold text-teal-300">Sua Aposta 🪙</span>
                      ` : `
                        <span class="text-[8px] text-slate-500">Apostar Aqui</span>
                      `}
                    </button>
                  `;
                }).join('')}
              </div>

              ${this.state.phase === 'REVEAL' ? `
                <div class="p-3.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-2 animate-fade-in">
                  <p class="font-title text-xs font-bold text-emerald-300">
                    🎯 Resposta Exata: <strong class="text-amber-300 text-sm font-black">${q.answer} ${q.unit}</strong>
                  </p>
                  <p class="text-[11px] text-slate-300 leading-relaxed italic">
                    ${q.trivia}
                  </p>
                  <button id="btn-next-saber" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-title text-xs font-black uppercase tracking-wider shadow-md transition transform active:scale-95">
                    Próxima Pergunta →
                  </button>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </main>
      </div>
    `;

    this.bindEvents(human);
  }

  bindEvents(human) {
    const backBtn = this.container.querySelector('#btn-saber-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    const guessInput = this.container.querySelector('#input-numeric-guess');
    const guessSubmit = this.container.querySelector('#btn-submit-numeric-guess');

    const handleGuess = () => {
      const val = parseInt(guessInput?.value);
      if (!isNaN(val)) {
        submitHumanGuess(this.state, val);
        this.render();
      }
    };

    if (guessSubmit) guessSubmit.onclick = handleGuess;
    if (guessInput) {
      guessInput.onkeydown = (e) => {
        if (e.key === 'Enter') handleGuess();
      };
      setTimeout(() => guessInput.focus(), 100);
    }

    if (this.state.phase === 'BETTING') {
      this.container.querySelectorAll('.btn-bet-guess').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.guessIdx);
          submitBet(this.state, idx);
          this.render();
        };
      });
    }

    const btnNext = this.container.querySelector('#btn-next-saber');
    if (btnNext) {
      btnNext.onclick = () => {
        nextSaberRound(this.state);
        this.render();
      };
    }
  }

  renderGameOver() {
    const human = this.state.players.find(p => !p.isBot) || this.state.players[0];
    const won = human.chips >= 15;
    const xpResult = this.playerService.recordGameResult('saber', won, { score: human.chips });

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#061E1A] via-[#0A302A] to-[#041411] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${won ? 'border-amber-400 shadow-2xl shadow-emerald-500/20' : 'border-emerald-500/40'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${won ? '🧠💰' : '📊'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${won ? 'text-amber-300' : 'text-emerald-300'}">
              ${won ? 'GRÃO-MESTRE DO SABER!' : 'FIM DA DISPUTA DE SABER'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              Você terminou a partida com <strong>${human.chips} fichas</strong> no total!
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível no Saber</p>
              <p class="text-lg font-black text-emerald-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-saber-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-title text-sm font-black shadow-lg shadow-emerald-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-saber-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
