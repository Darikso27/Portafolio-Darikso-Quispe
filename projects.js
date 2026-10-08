// Edita este archivo para agregar o cambiar tus proyectos.
// demo: true muestra la etiqueta "Proyecto de demostración". Déjalo en false (o quítalo) en trabajos reales.
// image: ruta a una captura dentro de la carpeta de su servicio, por ejemplo "img/movil/magic-food.png".
//        Carpetas: img/movil, img/web, img/bases-de-datos, img/datos. Si la dejas vacía se muestra el icono.
// video: (opcional) ruta a un video corto, por ejemplo "img/movil/magic-food.mp4". Tiene prioridad sobre image,
//        que se usa como portada. Mantén los videos por debajo de ~25 MB (GitHub avisa desde 50 MB).
// links: deja demo/repo en "" para ocultar el enlace.
// Importante: no publiques capturas con datos reales de clientes o pacientes.
const PROJECTS = [
  {
    title: "Sistema de gestión de cocheras",
    category: "Sistemas",
    icon: "🚗",
    image: "",
    demo: false,
    description: "Dos aplicaciones que registran ingreso y salida de vehículos con hora y fotografía, controlan la permanencia y los abonos mensuales, y generan reportes interactivos.",
    tech: ["Gestión", "Reportes"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Sistema de ventas para cafetería",
    category: "Sistemas",
    icon: "☕",
    image: "",
    demo: false,
    description: "Gestión de ventas de menú, desayunos y otros productos, con creación y administración de menús y reportes de ventas.",
    tech: ["Gestión", "Reportes"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Magic Food: toma de pedidos",
    category: "Móvil",
    icon: "🍔",
    image: "",
    demo: false,
    description: "App móvil de toma de pedidos de comida con análisis de ventas y registro de productos, respaldada en Firebase.",
    tech: ["Flutter", "Dart", "Firebase"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Find a Pet: IA para mascotas perdidas",
    category: "Datos",
    icon: "🐾",
    image: "",
    demo: false,
    description: "Plataforma inteligente con IA para identificar y localizar mascotas perdidas. 3.er puesto nacional en el Concurso Nacional de Papers, XXXII CONEIMERA Ucayali 2026.",
    tech: ["Inteligencia artificial", "Investigación"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Sistema de registro de pacientes",
    category: "Bases de datos",
    icon: "🗄️",
    image: "",
    demo: false,
    description: "Sistema de registro de pacientes con página web y base de datos, más manipulación y análisis de datos para una clínica estética. Sin capturas por confidencialidad.",
    tech: ["Web", "Base de datos", "Excel"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Tiendas virtuales y landing pages",
    category: "Web",
    icon: "🌐",
    image: "",
    demo: false,
    description: "Sitios web y tiendas virtuales desarrollados para clientes de Minicodevelopers S.A.C.S, junto con apps móviles de taxis y software empresarial interno.",
    tech: ["HTML", "CSS", "JavaScript"],
    links: { demo: "", repo: "" }
  }
];
