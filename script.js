const projectsEl = document.getElementById("projects");
const filtersEl = document.getElementById("filters");
let active = "Todos";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderProject(p) {
  const card = el("article", "card project reveal");

  const thumb = el("div", "thumb");
  if (p.video) {
    const video = el("video");
    video.src = p.video;
    video.controls = true;
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    if (p.image) video.poster = p.image;
    thumb.append(video);
  } else if (p.image) {
    const img = el("img");
    img.src = p.image;
    img.alt = p.title;
    img.loading = "lazy";
    thumb.append(img);
  } else {
    thumb.textContent = p.icon;
  }

  const body = el("div", "body");
  if (p.demo) body.append(el("span", "badge mono", "Proyecto de demostración"));
  body.append(el("h3", "", p.title), el("p", "", p.description));

  const chips = el("ul", "chips");
  p.tech.forEach(t => chips.append(el("li", "", t)));
  body.append(chips);

  const links = el("div", "links");
  [["demo", "Ver demo →"], ["repo", "Código ↗"]].forEach(([key, label]) => {
    if (p.links[key]) {
      const a = el("a", "", label);
      a.href = p.links[key];
      a.target = "_blank";
      a.rel = "noopener";
      links.append(a);
    }
  });
  if (links.children.length) body.append(links);

  card.append(thumb, body);
  return card;
}

function renderProjects() {
  projectsEl.replaceChildren();
  PROJECTS.filter(p => active === "Todos" || p.category === active)
    .forEach(p => projectsEl.append(renderProject(p)));
  observe();
}

function renderFilters() {
  const cats = ["Todos", ...new Set(PROJECTS.map(p => p.category))];
  cats.forEach(c => {
    const b = el("button", c === active ? "active" : "", c);
    b.addEventListener("click", () => {
      active = c;
      filtersEl.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      renderProjects();
    });
    filtersEl.append(b);
  });
}

const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });

function observe() {
  document.querySelectorAll(".reveal:not(.visible)").forEach(n => io.observe(n));
}

// Menú móvil
const toggle = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");
toggle.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
menu.addEventListener("click", e => {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", false);
  }
});

document.querySelectorAll(".card, .steps li, .stack > div").forEach(n => n.classList.add("reveal"));
document.getElementById("year").textContent = new Date().getFullYear();
renderFilters();
renderProjects();
