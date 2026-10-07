// PQRS: habla con el Apps Script de la hoja de Google del canal.
// Sin VITE_PQRS_API la página funciona en modo demostración con datos de ejemplo.

export type Estado = "Radicada" | "En trámite" | "Respondida" | "Cerrada";

export const estados: Estado[] = ["Radicada", "En trámite", "Respondida", "Cerrada"];

export type Solicitud = {
  radicado: string;
  fecha: string;
  tipo: string;
  nombre: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  asunto: string;
  descripcion: string;
  estado: Estado;
  respuesta: string;
  actualizado: string;
  responsable: string;
};

export type NuevaSolicitud = {
  tipo: string;
  nombre: string;
  correo: string;
  telefono: string;
  ubicacion: string;
  asunto: string;
  descripcion: string;
  autorizacion: boolean;
  sitio: string; // campo trampa para robots; siempre vacío
};

export type EventoHistorial = { fecha: string; accion: string; detalle: string; responsable: string };

export class ErrorPQRS extends Error {
  constructor(message: string, readonly sesion = false) {
    super(message);
  }
}

const API = import.meta.env.VITE_PQRS_API as string | undefined;
export const modoDemo = !API;

async function llamar<T>(accion: string, datos: Record<string, unknown>): Promise<T> {
  let respuesta: Response;
  try {
    // text/plain evita la petición previa de CORS que Apps Script no responde.
    respuesta = await fetch(API!, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ accion, ...datos }),
    });
  } catch {
    throw new ErrorPQRS("No hay conexión. Revisa tu internet e intenta de nuevo.");
  }
  const cuerpo = await respuesta.json().catch(() => null);
  if (!cuerpo) throw new ErrorPQRS("No pudimos procesar la solicitud. Intenta de nuevo.");
  if (!cuerpo.ok) throw new ErrorPQRS(cuerpo.error, Boolean(cuerpo.sesion));
  return cuerpo as T;
}

export async function radicarPQRS(solicitud: NuevaSolicitud) {
  if (modoDemo) {
    await espera();
    return "PQRS-2026-000125";
  }
  const { radicado } = await llamar<{ radicado: string }>("radicar", { solicitud });
  return radicado;
}

export async function listarPQRS(token: string) {
  if (modoDemo) {
    await espera();
    return muestra;
  }
  const { solicitudes } = await llamar<{ solicitudes: Solicitud[] }>("listar", { token });
  return solicitudes;
}

export async function obtenerPQRS(token: string, radicado: string) {
  if (modoDemo) {
    await espera();
    const solicitud = muestra.find((item) => item.radicado === radicado);
    if (!solicitud) throw new ErrorPQRS("No encontramos esa solicitud.");
    return { solicitud, historial: [{ fecha: solicitud.fecha, accion: "Radicada", detalle: "Solicitud recibida desde el sitio web.", responsable: "Sistema" }] };
  }
  return llamar<{ solicitud: Solicitud; historial: EventoHistorial[] }>("obtener", { token, radicado });
}

export async function actualizarPQRS(token: string, cambios: { radicado: string; estado: Estado; respuesta: string }) {
  if (modoDemo) {
    await espera();
    const solicitud = muestra.find((item) => item.radicado === cambios.radicado);
    if (!solicitud) throw new ErrorPQRS("No encontramos esa solicitud.");
    Object.assign(solicitud, cambios, { actualizado: new Date().toISOString(), responsable: "demo@conecta" });
    return solicitud;
  }
  const { solicitud } = await llamar<{ solicitud: Solicitud }>("actualizar", { token, cambios });
  return solicitud;
}

const espera = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const ejemplo = { telefono: "", ubicacion: "Centro", respuesta: "", responsable: "" };
const muestra: Solicitud[] = [
  { ...ejemplo, radicado: "PQRS-2026-000124", tipo: "Petición", asunto: "Cubrimiento de evento comunitario", descripcion: "Queremos invitar al canal a cubrir el festival de la vereda.", nombre: "María Restrepo", correo: "maria@ejemplo.com", fecha: "2026-03-18T09:12:00", actualizado: "2026-03-18T09:12:00", estado: "Radicada" },
  { ...ejemplo, radicado: "PQRS-2026-000123", tipo: "Sugerencia", asunto: "Nuevo espacio cultural", descripcion: "Propongo un programa con los grupos de música del municipio.", nombre: "Carlos Gómez", correo: "carlos@ejemplo.com", fecha: "2026-03-17T16:40:00", actualizado: "2026-03-17T18:02:00", estado: "En trámite" },
  { ...ejemplo, radicado: "PQRS-2026-000122", tipo: "Felicitación", asunto: "Programa Nuestro Campo", descripcion: "Felicitaciones por el último capítulo.", nombre: "Ana López", correo: "ana@ejemplo.com", fecha: "2026-03-16T11:05:00", actualizado: "2026-03-16T15:30:00", estado: "Respondida", respuesta: "¡Gracias, Ana! Se lo contamos al equipo." },
];
