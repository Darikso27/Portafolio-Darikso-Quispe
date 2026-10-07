// Edita este archivo para agregar tus proyectos reales.
// demo: true muestra la etiqueta "Proyecto de demostración". Cámbialo a false (o quítalo) en trabajos reales.
// image: ruta a una captura dentro de la carpeta de su servicio, por ejemplo "img/movil/inventario.png".
//        Carpetas: img/movil, img/web, img/bases-de-datos, img/datos. Si la dejas vacía se muestra el icono.
// video: (opcional) ruta a un video corto, por ejemplo "img/movil/inventario.mp4". Tiene prioridad sobre image,
//        que se usa como portada. Mantén los videos por debajo de ~25 MB (GitHub avisa desde 50 MB).
// links: deja demo/repo en "" para ocultar el enlace.
const PROJECTS = [
  {
    title: "Sistema de inventario móvil",
    category: "Móvil",
    icon: "📱",
    image: "",
    demo: true,
    description: "App Flutter para registrar productos y movimientos de stock, con base de datos PostgreSQL.",
    tech: ["Flutter", "Dart", "PostgreSQL"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Landing page para negocio local",
    category: "Web",
    icon: "🌐",
    image: "",
    demo: true,
    description: "Sitio adaptable con catálogo de servicios, formulario de contacto y enlace directo a WhatsApp.",
    tech: ["HTML", "CSS", "JavaScript"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Dashboard de ventas",
    category: "Datos",
    icon: "📊",
    image: "",
    demo: true,
    description: "Análisis de ventas con indicadores por mes, producto y región a partir de consultas SQL.",
    tech: ["Python", "SQL", "SQL Server"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Migración y diseño de base de datos",
    category: "Bases de datos",
    icon: "🗄️",
    image: "",
    demo: true,
    description: "Modelo entidad-relación, normalización y migración de MySQL a PostgreSQL con scripts documentados.",
    tech: ["PostgreSQL", "MySQL", "SQL"],
    links: { demo: "", repo: "" }
  },
  {
    title: "Automatización de reportes",
    category: "Datos",
    icon: "⚙️",
    image: "",
    demo: true,
    description: "Script que consolida archivos, limpia datos y genera un reporte semanal automáticamente.",
    tech: ["Python", "R"],
    links: { demo: "", repo: "" }
  }
];
