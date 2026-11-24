// ============================================================================
// INTERFACE DE USUÁRIO: JUKEBOX RETRÔ (HITSTER) — MOBILE-FIRST
// ============================================================================

import {
  placeSongInTimeline,
  nextJukeboxSong
} from './jukeboxLogic.js';

export class JukeboxUI {
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

    const current = this.state.currentSong;

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col justify-between bg-gradient-to-b from-[#1C0928] via-[#2B0E3D] to-[#100518] text-slate-100 font-inter select-none">
        <!-- BARRA SUPERIOR -->
        <header class="flex items-center justify-between px-3 py-2 bg-black/50 backdrop-blur-md border-b border-rose-500/30 z-30">
          <div class="flex items-center gap-2">
            <button id="btn-jukebox-back" class="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs transition">
              ← Sair
            </button>
            <div>
              <h2 class="font-title text-xs sm:text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300">
                🎸 JUKEBOX RETRÔ
              </h2>
              <p class="text-[9px] text-rose-300/80">Meta: ${this.state.targetHits} Músicas • Restam: ${this.state.targetHits - this.state.timeline.length}</p>
            </div>
          </div>
          <!-- Vidas -->
          <div class="flex items-center gap-1 text-sm">
            ${Array.from({ length: 3 }).map((_, i) => `
              <span class="${i < this.state.lives ? 'text-rose-500 drop-shadow' : 'text-slate-700 opacity-40'}">❤️</span>
            `).join('')}
          </div>
        </header>

        <!-- ÁREA CENTRAL: CARTA ATUAL E LINHA DO TEMPO -->
        <main class="flex-1 flex flex-col p-3 sm:p-5 gap-4 max-w-4xl mx-auto w-full overflow-y-auto justify-center">
          <!-- CARTA DA MÚSICA DA VEZ -->
          <div class="p-4 rounded-3xl bg-gradient-to-br from-purple-950/80 via-black/70 to-rose-950/80 border-2 border-rose-500/50 shadow-2xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <!-- Vinil Animado -->
            <div class="relative w-20 h-20 rounded-full bg-slate-950 border-4 border-slate-900 shadow-xl flex items-center justify-center animate-spin-slow">
              <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 border-2 border-black flex items-center justify-center text-xs font-bold">
                🎵
              </div>
            </div>

            <div class="flex-1 space-y-1">
              <span class="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-black uppercase tracking-wider">
                ${current.genre}
              </span>
              <h3 class="font-title text-lg font-black text-amber-300 leading-tight">
                ${current.title}
              </h3>
              <p class="text-xs font-bold text-slate-200">${current.artist}</p>
              <p class="text-[11px] text-pink-300/90 italic mt-1 leading-tight">
                "${current.hint}"
              </p>
            </div>

            <!-- Instrução de Ação -->
            <div class="p-2.5 rounded-2xl bg-black/40 border border-rose-500/20 text-center sm:w-44">
              <span class="text-[10px] text-rose-400 font-mono uppercase block">Ano Secreto:</span>
              <span class="text-2xl font-black text-rose-300 tracking-widest font-mono">????</span>
              <p class="text-[9px] text-slate-400 mt-0.5">Toque em um slot da linha do tempo abaixo para posicionar!</p>
            </div>
          </div>

          <!-- FEEDBACK DE REVELAÇÃO -->
          ${this.state.phase === 'REVEAL' && this.state.lastPlacementResult ? `
            <div class="p-3.5 rounded-2xl ${this.state.lastPlacementResult.isCorrect ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200' : 'bg-rose-950/70 border-rose-500/50 text-rose-200'} border text-center space-y-2 animate-fade-in shadow-xl">
              <p class="font-title text-sm font-black">${this.state.lastPlacementResult.text}</p>
              <button id="btn-next-song" class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-title text-xs font-black uppercase tracking-wider shadow-lg transition transform active:scale-95">
                Próxima Música →
              </button>
            </div>
          ` : ''}

          <!-- A LINHA DO TEMPO CRONOLÓGICA -->
          <div class="space-y-2">
            <div class="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
              <span>Sua Linha do Tempo (${this.state.timeline.length} cartas)</span>
              <span class="text-[10px] text-rose-400 font-mono">Mais antiga ⟶ Mais recente</span>
            </div>

            <!-- Pista de Cartas e Slots de Inserção -->
            <div class="overflow-x-auto pb-3 flex items-center gap-2 no-scrollbar">
              ${this.renderTimelineTrack()}
            </div>
          </div>
        </main>
      </div>
    `;

    this.bindEvents();
  }

  renderTimelineTrack() {
    const t = this.state.timeline;
    let html = '';

    // Slot inicial (antes da primeira carta)
    if (this.state.phase === 'PLACING') {
      html += `
        <button data-slot-idx="0" class="btn-timeline-slot flex-shrink-0 w-16 h-28 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-amber-400 bg-rose-950/20 hover:bg-amber-500/20 text-rose-300 hover:text-amber-300 text-xs font-black flex flex-col items-center justify-center gap-1 transition active:scale-95">
          <span class="text-lg">+</span>
          <span class="text-[8px] uppercase">Antes</span>
        </button>
      `;
    }

    t.forEach((song, idx) => {
      // Carta da timeline
      html += `
        <div class="flex-shrink-0 w-28 h-36 rounded-2xl p-2.5 bg-gradient-to-b from-slate-900 via-purple-950 to-black border-2 border-amber-400/60 shadow-lg flex flex-col justify-between text-center">
          <div class="w-8 h-8 mx-auto rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs">
            💿
          </div>
          <div>
            <p class="font-title text-[10px] font-black text-slate-100 line-clamp-2 leading-tight">${song.title}</p>
            <p class="text-[8px] text-slate-400 truncate mt-0.5">${song.artist}</p>
          </div>
          <span class="py-0.5 px-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-black">
            ${song.year}
          </span>
        </div>
      `;

      // Slot entre as cartas ou após a última
      if (this.state.phase === 'PLACING') {
        html += `
          <button data-slot-idx="${idx + 1}" class="btn-timeline-slot flex-shrink-0 w-16 h-28 rounded-2xl border-2 border-dashed border-rose-500/40 hover:border-amber-400 bg-rose-950/20 hover:bg-amber-500/20 text-rose-300 hover:text-amber-300 text-xs font-black flex flex-col items-center justify-center gap-1 transition active:scale-95">
            <span class="text-lg">+</span>
            <span class="text-[8px] uppercase">${idx + 1 === t.length ? 'Depois' : 'Entre'}</span>
          </button>
        `;
      }
    });

    return html;
  }

  bindEvents() {
    const backBtn = this.container.querySelector('#btn-jukebox-back');
    if (backBtn) backBtn.onclick = () => this.onExitToHub();

    // Inserção em slot da timeline
    this.container.querySelectorAll('.btn-timeline-slot').forEach(btn => {
      btn.onclick = () => {
        const slotIdx = parseInt(btn.dataset.slotIdx);
        placeSongInTimeline(this.state, slotIdx);
        this.render();
      };
    });

    const btnNext = this.container.querySelector('#btn-next-song');
    if (btnNext) {
      btnNext.onclick = () => {
        nextJukeboxSong(this.state);
        this.render();
      };
    }
  }

  renderGameOver() {
    const won = this.state.timeline.length >= this.state.targetHits;
    const xpResult = this.playerService.recordGameResult('jukebox', won, { score: this.state.timeline.length });

    this.container.innerHTML = `
      <div class="min-h-[100dvh] flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#1C0928] via-[#2B0E3D] to-[#100518] text-slate-100 font-inter">
        <div class="max-w-md w-full bg-slate-900/90 border-2 ${won ? 'border-amber-400 shadow-2xl shadow-rose-500/20' : 'border-rose-500/40'} rounded-3xl p-6 text-center flex flex-col gap-5">
          <span class="text-6xl">${won ? '🎸🏆' : '📻💥'}</span>
          <div>
            <h2 class="font-title text-2xl font-black ${won ? 'text-amber-300' : 'text-rose-400'}">
              ${won ? 'MESTRE DA JUKEBOX!' : 'FIM DA LINHA DO TEMPO'}
            </h2>
            <p class="text-xs text-slate-400 mt-1">
              ${won ? `Você encaixou ${this.state.timeline.length} sucessos mundiais com maestria cronológica!` : `Você perdeu todas as vidas! Acumulou ${this.state.timeline.length} sucessos na linha.`}
            </p>
          </div>

          <div class="p-3.5 rounded-2xl bg-black/40 border border-slate-800 flex items-center justify-around">
            <div>
              <p class="text-[10px] text-slate-400">XP Concedido</p>
              <p class="text-lg font-black text-amber-400">+${xpResult.xpGained} XP</p>
            </div>
            <div class="h-8 w-px bg-slate-800"></div>
            <div>
              <p class="text-[10px] text-slate-400">Nível na Jukebox</p>
              <p class="text-lg font-black text-rose-400">Nv. ${xpResult.newGameLevel}</p>
            </div>
          </div>

          <button id="btn-jukebox-gameover-exit" class="w-full py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-slate-950 font-title text-sm font-black shadow-lg shadow-rose-500/20 transition transform active:scale-95">
            Voltar ao Clube Arcana Table
          </button>
        </div>
      </div>
    `;

    this.container.querySelector('#btn-jukebox-gameover-exit').onclick = () => {
      this.onExitToHub();
    };
  }
}
