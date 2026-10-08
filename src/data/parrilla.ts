export const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export type Emision = { hora: string; nombre: string; descripcion: string; enVivo?: boolean };

const original = "Emisión original";
const repeticion = "Repetición";

// Parrilla semanal en hora de Colombia. Por ahora solo programas propios; faltan los externos.
export const parrillaSemanal: Record<string, Emision[]> = {
  Lunes: [{ hora: "4:30 p. m.", nombre: "Un Café para el Alma", descripcion: repeticion }],
  Martes: [],
  Miércoles: [
    { hora: "2:30 p. m.", nombre: "Testigos en la Fe", descripcion: original },
    { hora: "4:00 p. m.", nombre: "El Rey de los Caminos", descripcion: repeticion },
  ],
  Jueves: [{ hora: "5:00 p. m.", nombre: "Raíces Sonoras", descripcion: original }],
  Viernes: [{ hora: "7:00 p. m.", nombre: "Viernes de la Cultura", descripcion: original }],
  Sábado: [{ hora: "4:00 p. m.", nombre: "Un Café para el Alma", descripcion: original }],
  Domingo: [
    { hora: "1:30 p. m.", nombre: "El Rey de los Caminos", descripcion: original },
    { hora: "4:00 p. m.", nombre: "Raíces Sonoras", descripcion: repeticion },
    { hora: "5:30 p. m.", nombre: "Testigos en la Fe", descripcion: repeticion },
    { hora: "8:30 p. m.", nombre: "Viernes de la Cultura", descripcion: repeticion },
  ],
};

/** Día y minutos desde la medianoche, en hora de Colombia. */
function ahoraEnColombia(fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", { timeZone: "America/Bogota", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(fecha);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  const indice = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(valor("weekday"));
  return { indice, minutos: Number(valor("hour")) * 60 + Number(valor("minute")) };
}

function minutosDe(hora: string) {
  const [, h, m, sufijo] = hora.match(/(\d+):(\d+)\s*([ap])/) ?? [];
  return ((Number(h) % 12) + (sufijo === "p" ? 12 : 0)) * 60 + Number(m);
}

export function diaDeHoy() {
  return dias[ahoraEnColombia().indice];
}

/** Fecha de hoy en Colombia, por ejemplo "Jueves 8 de octubre". */
export function fechaDeHoy() {
  const texto = new Intl.DateTimeFormat("es-CO", { timeZone: "America/Bogota", weekday: "long", day: "numeric", month: "long" }).format(new Date()).replace(",", "");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** La próxima emisión de la semana desde ahora, con el día en que sale ("Hoy", "Mañana" o el nombre del día). */
export function proximaEmision() {
  const { indice, minutos } = ahoraEnColombia();
  for (let salto = 0; salto < 8; salto++) {
    const dia = dias[(indice + salto) % 7];
    const emision = parrillaSemanal[dia].find((e) => salto > 0 || minutosDe(e.hora) > minutos);
    if (emision) return { ...emision, dia: salto === 0 ? "Hoy" : salto === 1 ? "Mañana" : dia };
  }
  return undefined;
}
