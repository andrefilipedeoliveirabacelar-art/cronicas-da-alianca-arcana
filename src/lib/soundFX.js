// ==========================================================
// EFEITOS SONOROS SINTETIZADOS COM WEB AUDIO API
// Zero arquivos externos, zero latência, 100% autônomo
// ==========================================================

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('ARCANUM_SOUND_MUTED') === 'true';
  }

  // Inicializa o contexto de áudio após primeira interação do usuário
  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('ARCANUM_SOUND_MUTED', this.isMuted ? 'true' : 'false');
    return this.isMuted;
  }

  // 1. Ganho de Runas (Som metálico / cristalino ascendente)
  playRuneGain() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.18); // A6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1320, now); // E6
    osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  // 2. Perda de Carta / Ataque Letal (Impacto grave / sombrio)
  playCardLoss() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const subOsc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.45);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(25, now + 0.55);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(80, now + 0.55);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    subOsc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + 0.55);
    subOsc.stop(now + 0.55);
  }

  // 3. Tensão de Contestação / Bloqueio (Alerta tenso de confronto)
  playAlertTension() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.setValueAtTime(494, now + 0.08);

    osc2.type = 'square';
    osc2.frequency.setValueAtTime(466, now); // Dissonância proposital de blefe
    osc2.frequency.setValueAtTime(523, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  }

  // 4. Tick do Cronômetro (Últimos 5 segundos)
  playTimerTick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  // 5. Fanfarra de Vitória
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, d: 0.15, t: 0.0 },   // C5
      { f: 659.25, d: 0.15, t: 0.15 },  // E5
      { f: 783.99, d: 0.15, t: 0.30 },  // G5
      { f: 1046.50, d: 0.55, t: 0.45 }, // C6 (long)
    ];

    const baseTime = this.ctx.currentTime;

    notes.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, baseTime + note.t);

      gain.gain.setValueAtTime(0.25, baseTime + note.t);
      gain.gain.exponentialRampToValueAtTime(0.001, baseTime + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(baseTime + note.t);
      osc.stop(baseTime + note.t + note.d);
    });
  }

  // 6. Emote / Provocação (Bubble pop)
  playEmotePop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }
}

export const soundFX = new SoundManager();
export const soundManager = soundFX;
export default soundFX;
