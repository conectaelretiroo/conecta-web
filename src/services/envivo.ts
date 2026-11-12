// Transmisión en vivo por YouTube o Facebook: el equipo pega el enlace en el panel y la página
// la muestra hasta que YouTube diga que terminó (lo decide el Apps Script) o el equipo la termine.
// Los de Facebook se terminan desde el panel (o se quitan solos a las 8 horas).

import { useSyncExternalStore } from "react";
import { llamar, modoDemo } from "./pqrs";

export type Fuente = "youtube" | "facebook";
/** video: el código de YouTube, o el enlace del video en facebook.com. */
export type EnVivo = { fuente?: Fuente; video: string; titulo: string } | null;

const CADA = 60_000;

let actual: EnVivo = null;
let temporizador: number | undefined;
const oyentes = new Set<() => void>();

function poner(nuevo: EnVivo) {
  if (nuevo?.video === actual?.video && nuevo?.titulo === actual?.titulo && nuevo?.fuente === actual?.fuente) return;
  actual = nuevo;
  oyentes.forEach((avisar) => avisar());
}

async function revisar() {
  if (modoDemo || document.hidden) return;
  try {
    const { envivo } = await llamar<{ envivo: EnVivo }>("envivo", {});
    poner(envivo);
  } catch {
    // sin conexión: se mantiene lo último que se sabía y se reintenta en el siguiente turno
  }
}

const alVolver = () => {
  if (!document.hidden) void revisar();
};

function suscribir(avisar: () => void) {
  oyentes.add(avisar);
  if (oyentes.size === 1) {
    void revisar();
    temporizador = window.setInterval(revisar, CADA);
    document.addEventListener("visibilitychange", alVolver);
  }
  return () => {
    oyentes.delete(avisar);
    if (!oyentes.size) {
      window.clearInterval(temporizador);
      document.removeEventListener("visibilitychange", alVolver);
    }
  };
}

/** La transmisión activa, o null. Todos los componentes comparten la misma consulta. */
export function useEnVivo() {
  return useSyncExternalStore(suscribir, () => actual);
}

export const esFacebook = (enlace: string) => /facebook\.com|fb\.watch|fb\.com/i.test(enlace);

export function enlaceEmbebido(envivo: NonNullable<EnVivo>) {
  if (envivo.fuente === "facebook") {
    return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(envivo.video)}&show_text=false&autoplay=true&mute=true&allowfullscreen=true`;
  }
  return `https://www.youtube-nocookie.com/embed/${envivo.video}?autoplay=1&mute=1&playsinline=1&rel=0`;
}

/** Solo el equipo: activa (o reemplaza) el en vivo con el enlace de YouTube o Facebook. */
export async function activarEnVivo(token: string, enlace: string, titulo = "") {
  if (modoDemo) {
    const facebook = esFacebook(enlace);
    const video = facebook ? enlace.trim() : enlace.match(/(?:v=|live\/|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] ?? enlace.trim();
    const envivo = { fuente: (facebook ? "facebook" : "youtube") as Fuente, video, titulo: titulo.trim() || "Transmisión de demostración" };
    poner(envivo);
    return envivo;
  }
  const { envivo } = await llamar<{ envivo: EnVivo }>("envivo-guardar", { token, enlace, titulo });
  poner(envivo);
  return envivo;
}

/** Solo el equipo: deja de mostrar la transmisión en la página. */
export async function terminarEnVivo(token: string) {
  if (!modoDemo) await llamar("envivo-quitar", { token });
  poner(null);
}
