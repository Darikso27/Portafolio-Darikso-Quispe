// Intro tecnológica: cuenta de carga, estados de estado y fondo animado de la portada.
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
  const startedAt = performance.now();
  let rafId = 0;
  let finished = false;
  let lastLabel = "";

  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(rafId);
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

    let label = STATUS[0][1];
    for (const [from, text] of STATUS) if (pct >= from) label = text;
    if (label !== lastLabel) {
      statusEl.textContent = label;
      lastLabel = label;
    }

    if (t < 1) {
      rafId = requestAnimationFrame(frame);
    } else {
      intro.classList.add("ready");
      setTimeout(finish, HOLD);
    }
  }

  intro.addEventListener("click", finish);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Enter") finish();
  });
  rafId = requestAnimationFrame(frame);
})();
