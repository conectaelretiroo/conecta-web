export type Solicitud = {
  radicado: string;
  tipo: string;
  asunto: string;
  nombre: string;
  correo: string;
  fecha: string;
  estado: "Radicada" | "En trámite" | "Respondida" | "Cerrada";
};

const muestra: Solicitud[] = [
  { radicado: "PQRS-2026-000124", tipo: "Petición", asunto: "Cubrimiento de evento comunitario", nombre: "María Restrepo", correo: "maria@ejemplo.com", fecha: "18 mar 2026", estado: "Radicada" },
  { radicado: "PQRS-2026-000123", tipo: "Sugerencia", asunto: "Nuevo espacio cultural", nombre: "Carlos Gómez", correo: "carlos@ejemplo.com", fecha: "17 mar 2026", estado: "En trámite" },
  { radicado: "PQRS-2026-000122", tipo: "Felicitación", asunto: "Programa Nuestro Campo", nombre: "Ana López", correo: "ana@ejemplo.com", fecha: "16 mar 2026", estado: "Respondida" },
];

const espera = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export async function radicarPQRS() {
  await espera();
  return "PQRS-2026-000125";
}

export async function listarPQRS() {
  await espera();
  return muestra;
}

export async function obtenerPQRS(radicado: string) {
  await espera();
  return muestra.find((item) => item.radicado === radicado);
}

export async function actualizarPQRS(solicitud: Solicitud) {
  await espera();
  return solicitud;
}
