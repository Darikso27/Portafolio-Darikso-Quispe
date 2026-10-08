// Sonidos y voz de la intro. No hay archivos de audio:
// - Efectos: Web Audio (osciladores y ruido generados en el navegador).
// - Voz: síntesis de voz del navegador, con dos perfiles (VOICE_STYLE): "formal" (hombre, grave y serio)
//   y "young" (joven, amable y servicial). La voz concreta depende del dispositivo del visitante.
// Los navegadores bloquean el sonido hasta el primer clic o toque; por eso la intro tiene
// una pantalla de inicio, salvo que el navegador ya permita el audio.
// Ajustes: LEVEL (volumen de efectos), VOICE_STYLE y STYLES (tipo de voz, ritmo, tono y frases).
(() => {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const KEY = "hud-sound";
  const LEVEL = 1.5;
  const VOICE_LANG = "es"; // "es" o "en"
  const VOICE_STYLE = "formal"; // "formal": hombre, grave y serio · "young": joven, amable y servicial

  // Saludo según la hora del visitante
  function greeting(lang) {
    const h = new Date().getHours();
    if (lang === "en") return h < 12 ? "Good morning" : h < 19 ? "Good afternoon" : "Good evening";
    return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";
  }

  // Cada perfil define el tipo de voz que se busca, su ritmo y tono, y las frases: una al empezar y otra
  // al abrirse la portada (la intro dura unos 4 s). rate/pitch: más de 1 = más ágil/aguda, menos de 1 = más lenta/grave.
  const STYLES = {
    formal: {
      gender: "male",
      prefer: /jorge|pablo|diego|juan|enrique|carlos|ra[uú]l|[aá]lvaro/i, // voces graves y serias
      rate: 1.0,
      pitch: 0.8,
      lines: {
        es: {
          boot: () => greeting("es") + ". Iniciando sistema.",
          granted: "Acceso concedido. Bienvenido al portafolio de Darikso Quispe.",
        },
        en: {
          boot: () => greeting("en") + ". Initializing system.",
          granted: "Access granted. Welcome to Darikso Quispe's portfolio.",
        },
      },
    },
    young: {
      gender: "female",
      prefer: /elvira|dalia|ximena|abril|vera|irene|laia|laura|paulina|jimena/i, // voces jóvenes y cercanas
      rate: 1.2,
      pitch: 1.15,
      lines: {
        es: {
          boot: "¡Hola! Estoy aquí para ayudarte.",
          granted: "¡Listo! Bienvenido al portafolio de Darikso Quispe.",
        },
        en: {
          boot: "Hi! I'm here to help.",
          granted: "All set! Welcome to Darikso Quispe's portfolio.",
        },
      },
    },
  };
  const STYLE = STYLES[VOICE_STYLE] || STYLES.formal;

  let ctx = null;
  let master = null;
  let echo = null;
  let noise = null;
  let hum = null;
  let ended = false;
  let unlocked = false; // el visitante ya activó el sonido (o el navegador lo permite)
  let bootPlayed = false;
  let offset = 0; // retraso (s) con el que se programa el sonido actual
  let wanted = true; // false si el visitante lo silenció
  try {
    wanted = localStorage.getItem(KEY) !== "off";
  } catch (e) {}

  const save = (on) => {
    try {
      localStorage.setItem(KEY, on ? "on" : "off");
    } catch (e) {}
  };

  function ensure() {
    if (ctx || !AudioCtx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = LEVEL;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 6;
    master.connect(comp);
    comp.connect(ctx.destination);

    // Eco corto para los tonos de confirmación
    echo = ctx.createDelay(1);
    echo.delayTime.value = 0.17;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.32;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    echo.connect(feedback);
    feedback.connect(echo);
    echo.connect(wet);
    wet.connect(master);

    // Un segundo de ruido blanco reutilizable
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  // Tono con envolvente; "to" hace un deslizamiento de frecuencia, "lp" un filtro que se cierra.
  function tone({ f, to, type = "sine", at = 0, dur = 0.12, peak = 0.1, atk = 0.005, lp, withEcho = false }) {
    const t = ctx.currentTime + offset + at;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + atk);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + atk + dur);
    let out = osc;
    if (lp) {
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(lp[0], t);
      filter.frequency.exponentialRampToValueAtTime(lp[1], t + dur);
      osc.connect(filter);
      out = filter;
    }
    out.connect(gain);
    gain.connect(master);
    if (withEcho) gain.connect(echo);
    osc.start(t);
    osc.stop(t + atk + dur + 0.05);
  }

  // Ráfaga de ruido filtrado que barre de una frecuencia a otra (efecto "whoosh")
  function swoosh({ at = 0, dur = 0.8, from = 300, to = 4000, peak = 0.12, q = 1 }) {
    const t = ctx.currentTime + offset + at;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = q;
    band.frequency.setValueAtTime(from, t);
    band.frequency.exponentialRampToValueAtTime(to, t + dur);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(band);
    band.connect(gain);
    gain.connect(master);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  // Zumbido grave de fondo mientras dura la intro
  function startHum() {
    if (hum) return;
    const t = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.035, t + 1.2);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 320;
    const a = ctx.createOscillator();
    a.type = "sine";
    a.frequency.value = 55;
    const b = ctx.createOscillator();
    b.type = "triangle";
    b.frequency.value = 82.4;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    a.connect(lowpass);
    b.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(master);
    [a, b, lfo].forEach((o) => o.start(t));
    hum = { gain };
  }

  const cues = {
    // Encendido del sistema: barrido ascendente
    boot() {
      tone({ f: 70, to: 520, type: "sawtooth", dur: 1.1, peak: 0.09, atk: 0.06, lp: [200, 2600] });
      tone({ f: 140, to: 1040, dur: 1.1, peak: 0.05, atk: 0.06 });
      swoosh({ dur: 0.9, from: 200, to: 2400, peak: 0.05 });
      startHum();
    },
    // Pulso corto de "procesando datos"; sube de tono con el avance
    tick(p) {
      tone({ f: 900 + p * 9, type: "square", dur: 0.03, peak: 0.028, atk: 0.002, lp: [4000, 2500] });
    },
    // Cambio de etapa
    chirp() {
      tone({ f: 1320, dur: 0.06, peak: 0.07 });
      tone({ f: 1760, at: 0.07, dur: 0.1, peak: 0.07 });
    },
    // Módulo cargado (OK); cada uno suena más agudo
    ok(i) {
      const f = 880 * Math.pow(1.122, i * 2);
      tone({ f, type: "triangle", dur: 0.16, peak: 0.08, withEcho: true });
      tone({ f: f * 1.5, at: 0.06, dur: 0.14, peak: 0.05 });
    },
    // Aparece el nombre
    data() {
      swoosh({ dur: 0.35, from: 2500, to: 7000, peak: 0.045, q: 4 });
    },
    // Acceso concedido: arpegio de confirmación
    granted() {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        tone({ f, type: "triangle", at: i * 0.09, dur: 0.9, peak: 0.1, atk: 0.01, withEcho: true });
        tone({ f: f * 2, at: i * 0.09, dur: 0.5, peak: 0.03 });
      });
    },
    // La portada se abre
    whoosh() {
      swoosh({ dur: 0.9, from: 300, to: 4200, peak: 0.13, q: 0.8 });
      tone({ f: 320, to: 60, dur: 0.8, peak: 0.08, atk: 0.02 });
    },
  };

  // ---------- Voz ----------
  const MALE = /pablo|jorge|diego|ra[uú]l|[aá]lvaro|enrique|juan|carlos|miguel|andr[eé]s|sergio|daniel|d[aá]rio|teo\b|arnau|elias|saul|george|ryan|oliver|thomas|male|hombre/i;
  const FEMALE = /helena|sabina|laura|m[oó]nica|paulina|elena|luc[ií]a|mar[ií]a|elvira|dalia|ximena|abril|vera|irene|laia|lia\b|marisol|jimena|zira|hazel|susan|google espa|female|mujer/i;
  const speaking = new Set(); // evita que el navegador descarte frases antes de terminar

  // Puntúa una voz: tipo deseado, calidad (las neuronales de Edge son las más naturales) y nombres del perfil
  function score(v) {
    let s = 0;
    if (STYLE.gender === "female" && FEMALE.test(v.name)) s += 50;
    if (STYLE.gender === "male" && MALE.test(v.name)) s += 50;
    if (/natural|online/i.test(v.name)) s += 40;
    if (/google/i.test(v.name)) s += 15;
    if (STYLE.prefer.test(v.name)) s += 25;
    if (v.localService) s += 5;
    return s;
  }

  // Elige la mejor voz disponible en el idioma preferido (o en el otro si no hay ninguna).
  function pickVoice() {
    if (!("speechSynthesis" in window)) return null;
    const all = speechSynthesis.getVoices();
    if (!all.length) return null;
    const order = VOICE_LANG === "en" ? ["en", "es"] : ["es", "en"];
    for (const lang of order) {
      const list = all.filter((v) => v.lang.toLowerCase().startsWith(lang));
      if (list.length) return { voice: list.reduce((best, v) => (score(v) > score(best) ? v : best)), lang };
    }
    return null;
  }

  // Avisa a la página (para animar el núcleo) y baja los efectos mientras habla la voz
  function notifySpeaking(on) {
    document.dispatchEvent(new CustomEvent("hud-speaking", { detail: on }));
    if (ctx && master && wanted && !ended) master.gain.setTargetAtTime(on ? LEVEL * 0.55 : LEVEL, ctx.currentTime, 0.06);
  }

  function speak(key) {
    if (!wanted || !unlocked) return;
    const pick = pickVoice();
    if (!pick) return;
    const set = STYLE.lines[pick.lang];
    let text = set && set[key];
    if (typeof text === "function") text = text();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = pick.voice;
    u.lang = pick.voice.lang;
    u.rate = STYLE.rate;
    u.pitch = STYLE.pitch;
    u.volume = 1;
    u.onstart = () => notifySpeaking(true);
    const done = () => {
      speaking.delete(u);
      notifySpeaking(false);
    };
    u.onend = done;
    u.onerror = done;
    speaking.add(u);
    speechSynthesis.resume();
    speechSynthesis.speak(u);
  }

  function stopSpeech() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    speaking.clear();
    notifySpeaking(false);
  }

  // Precarga la lista de voces (algunos navegadores la entregan de forma asíncrona)
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  window.HudAudio = {
    supported: !!AudioCtx,

    // "locked": falta activarlo · "on": suena · "off": silenciado
    state() {
      return !wanted ? "off" : unlocked ? "on" : "locked";
    },

    // ¿Deja el navegador sonar sin que el visitante haga clic? (p. ej. sitio con sonido permitido)
    async probe() {
      if (!AudioCtx || ended) return false;
      try {
        ensure();
        const running = ctx.resume().then(() => ctx.state === "running");
        const timeout = new Promise((resolve) => setTimeout(() => resolve(false), 350));
        return await Promise.race([running, timeout]);
      } catch (e) {
        return false;
      }
    },

    // Activa el sonido y la voz. Si no hay permiso previo, debe llamarse desde un clic o toque.
    enable() {
      if (!AudioCtx || ended) return this.state();
      ensure();
      wanted = true;
      unlocked = true;
      ctx.resume().catch(() => {});
      master.gain.setTargetAtTime(LEVEL, ctx.currentTime, 0.04);
      if (!bootPlayed) {
        bootPlayed = true;
        cues.boot();
        speak("boot");
      } else {
        cues.chirp();
      }
      save(true);
      return this.state();
    },

    disable() {
      wanted = false;
      if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      stopSpeech();
      save(false);
      return this.state();
    },

    cue(name, arg = 0, delay = 0) {
      if (!ctx || !unlocked || !wanted || ended || !cues[name]) return;
      offset = delay;
      try {
        cues[name](arg);
      } finally {
        offset = 0;
      }
    },

    // Dice una de las frases del perfil de voz (STYLES) con la voz del sistema
    say(key) {
      if (!ended) speak(key);
    },

    // Apaga el zumbido y libera el audio al terminar. Con silence=true corta también la voz.
    end(silence = false) {
      if (!ctx || ended) return;
      ended = true;
      if (silence) stopSpeech();
      if (hum) {
        hum.gain.gain.cancelScheduledValues(ctx.currentTime);
        hum.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.3);
      }
      setTimeout(() => {
        try {
          ctx.close();
        } catch (e) {}
      }, 2500);
    },
  };
})();
