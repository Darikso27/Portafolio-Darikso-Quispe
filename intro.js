// Intro tecnológica: pantalla de inicio, cuenta de carga, sonido y voz, y fondo animado de la portada.
(() => {
  const root = document.documentElement;
  const intro = document.getElementById("intro");
  if (!intro) return;

  // El núcleo del HUD se reutiliza como fondo animado de la portada.
  const heroHud = document.getElementById("heroHud");
  const core = intro.querySelector(".hud-core");
  if (heroHud && core) {
    const clone = core.cloneNode(true);
    clone.setAttribute("class", "hud");
    heroHud.append(clone);
    // Pausa la animación mientras la portada no está a la vista.
    new IntersectionObserver(([entry]) => {
      heroHud.classList.toggle("is-paused", !entry.isIntersecting);
    }).observe(heroHud.parentElement);
  }

  // Sin intro (por ejemplo, movimiento reducido): se descarta el bloque.
  if (!root.classList.contains("has-intro")) {
    intro.remove();
    return;
  }
  // Avisa al <head> de que el script cargó: su red de seguridad ya no abrirá la página por su cuenta.
  root.classList.add("intro-live");

  // Barras del ecualizador, generadas para no repetir 18 elementos en el HTML.
  const eq = intro.querySelector(".eq");
  if (eq) {
    for (let i = 0; i < 18; i++) {
      const h = 30 + ((i * 37) % 41);
      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("x", i * 11);
      bar.setAttribute("y", -h);
      bar.setAttribute("width", 7);
      bar.setAttribute("height", h);
      bar.style.animationDuration = 0.8 + ((i * 13) % 7) / 10 + "s";
      bar.style.animationDelay = -(i * 0.19) + "s";
      eq.append(bar);
    }
  }

  // ---------- Sonido y voz (intro-audio.js) ----------
  const audio = window.HudAudio;
  const hasAudio = !!(audio && audio.supported);
  const sound = (name, arg, delay) => hasAudio && audio.cue(name, arg, delay);
  const say = (key) => hasAudio && audio.say(key);
  const soundBtn = intro.querySelector(".intro-sound");
  const SOUND_LABEL = { locked: "Activar sonido", on: "Sonido ON", off: "Sonido OFF" };

  function renderSound() {
    if (!soundBtn || !hasAudio) return;
    const state = audio.state();
    soundBtn.dataset.state = state;
    soundBtn.setAttribute("aria-pressed", String(state === "on"));
    soundBtn.textContent = SOUND_LABEL[state];
  }
  if (soundBtn && hasAudio) {
    renderSound();
    soundBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // un clic en este botón no debe saltar la intro
      if (audio.state() === "on") audio.disable();
      else audio.enable();
      renderSound();
    });
  } else if (soundBtn) {
    soundBtn.remove();
  }

  // El núcleo late mientras habla la voz.
  document.addEventListener("hud-speaking", (e) => intro.classList.toggle("speaking", !!e.detail));

  // Los sonidos de "OK" y del nombre siguen a sus animaciones CSS para quedar sincronizados.
  intro.querySelectorAll(".ok").forEach((el, i) => {
    el.addEventListener("animationstart", () => sound("ok", i));
  });
  intro.querySelector(".intro-title").addEventListener("animationstart", (e) => {
    if (e.animationName === "introTitle") sound("data");
  });

  // ---------- Cuenta de carga ----------
  const DURATION = 3200; // ms que tarda en llegar al 100 %
  const HOLD = 600; // ms que se mantiene "ACCESO CONCEDIDO" antes de abrir la portada
  const STATUS = [
    [0, "INICIALIZANDO INTERFAZ…"],
    [25, "CARGANDO MÓDULOS…"],
    [50, "CONECTANDO BASES DE DATOS…"],
    [75, "OPTIMIZANDO EXPERIENCIA…"],
    [100, "ACCESO CONCEDIDO"],
  ];
  const pctEl = document.getElementById("introPct");
  const statusEl = document.getElementById("introStatus");
  let startedAt = 0;
  let rafId = 0;
  let gateOpen = true; // true mientras se espera el inicio (clic del visitante)
  let finished = false;
  let lastLabel = "";
  let lastTick = -4;

  function finish() {
    if (finished) return;
    finished = true;
    gateOpen = false;
    cancelAnimationFrame(rafId);
    sound("whoosh");
    // Si se salta la intro se corta la voz; si termina sola, la bienvenida acaba de sonar sobre la portada.
    if (hasAudio) audio.end(!intro.classList.contains("ready"));
    root.classList.add("intro-done");
    setTimeout(() => intro.remove(), 1500);
  }

  function frame(now) {
    if (finished) return;
    const t = Math.min(Math.max((now - startedAt) / DURATION, 0), 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const pct = Math.round(eased * 100);

    intro.style.setProperty("--p", eased.toFixed(3));
    pctEl.textContent = pct + "%";

    if (pct < 100 && pct >= lastTick + 4) {
      lastTick = pct;
      sound("tick", pct);
    }

    let label = STATUS[0][1];
    for (const [from, text] of STATUS) if (pct >= from) label = text;
    if (label !== lastLabel) {
      statusEl.textContent = label;
      if (lastLabel && pct < 100) sound("chirp");
      lastLabel = label;
    }

    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      intro.classList.add("ready");
      sound("granted");
      say("granted");
      setTimeout(finish, HOLD);
    }
  }

  // Arranca la intro. Con sonido, debe ocurrir dentro de un clic del visitante (salvo que el navegador ya lo permita).
  function begin(withSound) {
    if (!gateOpen || finished) return;
    gateOpen = false;
    if (hasAudio) {
      if (withSound) audio.enable();
      else audio.disable();
      renderSound();
    }
    intro.classList.remove("is-gate", "gate-ready");
    startedAt = performance.now();
    rafId = requestAnimationFrame(frame);
  }

  const gateReady = () => gateOpen && intro.classList.contains("gate-ready");

  document.getElementById("gateStart").addEventListener("click", (e) => {
    e.stopPropagation();
    begin(true);
  });
  document.getElementById("gateMute").addEventListener("click", (e) => {
    e.stopPropagation();
    begin(false);
  });
  intro.addEventListener("click", () => {
    if (gateOpen) {
      if (gateReady()) begin(true);
    } else {
      finish();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") finish();
    // Enter sobre un botón activa ese botón; en cualquier otro lugar inicia o salta.
    else if (e.key === "Enter" && !e.target.closest("button")) {
      if (gateOpen) {
        if (gateReady()) begin(true);
      } else {
        finish();
      }
    }
  });

  // ¿Cómo se arranca? Sin sonido si el visitante ya lo silenció antes o no hay audio; con sonido
  // directamente si el navegador lo permite; en otro caso, pantalla de inicio para pedir un clic.
  if (!hasAudio || audio.state() === "off") {
    begin(false);
  } else {
    audio.probe().then((canAutoplay) => {
      if (finished || !gateOpen) return;
      if (canAutoplay) {
        begin(true);
      } else {
        intro.classList.add("gate-ready");
        document.getElementById("gateStart").focus({ preventScroll: true });
      }
    });
  }
})();
