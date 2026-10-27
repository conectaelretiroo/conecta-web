// Título, descripción y dirección oficial de cada página, para Google y para cuando se comparte un enlace.
// Solo el dominio propio se deja indexar: workers.dev y la copia de pruebas quedan fuera de Google.
export const SITIO = "https://conectaelretiro.tv";

const paginas: Record<string, { titulo: string; descripcion: string }> = {
  "/": { titulo: "Conecta El Retiro · Canal de televisión de El Retiro, Antioquia", descripcion: "Conecta Telecomunicaciones, el canal local de El Retiro, Antioquia: en vivo, programación, programas propios, canales de televisión e internet, y PQRS." },
  "/en-vivo": { titulo: "En vivo · Conecta El Retiro", descripcion: "Mira en vivo las transmisiones del canal Conecta El Retiro." },
  "/programacion": { titulo: "Programación · Conecta El Retiro", descripcion: "Horarios de la programación semanal del canal Conecta El Retiro." },
  "/programas": { titulo: "Programas · Conecta El Retiro", descripcion: "Programas propios del canal Conecta El Retiro: historias, información y conversaciones hechas desde El Retiro." },
  "/canales": { titulo: "Canales de televisión · Conecta El Retiro", descripcion: "Lista de canales del servicio de televisión de Conecta Digital en El Retiro, Antioquia." },
  "/pqrs": { titulo: "PQRS · Conecta El Retiro", descripcion: "Radica tus peticiones, quejas, reclamos o sugerencias sobre internet, televisión o el canal Conecta El Retiro." },
  "/politica-de-datos": { titulo: "Política de datos · Conecta El Retiro", descripcion: "Política de tratamiento de datos personales de Conecta Telecomunicaciones." },
  "/admin": { titulo: "Panel · Conecta El Retiro", descripcion: "" },
};

// Páginas que nunca deben salir en Google.
const privadas = new Set(["/admin"]);

function meta(selector: string, crear: () => HTMLElement) {
  return (document.head.querySelector(selector) as HTMLElement | null) ?? document.head.appendChild(crear());
}

export function actualizarSeo(path: string) {
  const pagina = paginas[path];
  document.title = pagina?.titulo ?? "Página no encontrada · Conecta El Retiro";
  if (pagina?.descripcion) meta('meta[name="description"]', () => Object.assign(document.createElement("meta"), { name: "description" })).setAttribute("content", pagina.descripcion);

  const canonica = meta('link[rel="canonical"]', () => Object.assign(document.createElement("link"), { rel: "canonical" }));
  canonica.setAttribute("href", SITIO + path);

  const oficial = window.location.hostname === "conectaelretiro.tv";
  const robots = meta('meta[name="robots"]', () => Object.assign(document.createElement("meta"), { name: "robots" }));
  robots.setAttribute("content", oficial && pagina && !privadas.has(path) ? "index, follow" : "noindex, nofollow");
}
