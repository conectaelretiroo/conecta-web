// Transmisión en vivo por YouTube: el equipo pega el enlace en el panel y la página
// muestra el bloque de en vivo hasta que YouTube diga que terminó (lo decide el Apps Script).

import { useSyncExternalStore } from "react";
import { llamar, modoDemo } from "./pqrs";

export type EnVivo = { video: string; titulo: string } | null;

const CADA = 60_000;

let actual: EnVivo = null;
let temporizador: number | undefined;
const oyentes = new Set<() => void>();

function poner(nuevo: EnVivo) {
  if (nuevo?.video === actual?.video && nuevo?.titulo === actual?.titulo) return;
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

export function enlaceEmbebido(video: string) {
  return `https://www.youtube-nocookie.com/embed/${video}?autoplay=1&mute=1&playsinline=1&rel=0`;
}

/** Solo el equipo: activa (o reemplaza) el en vivo con el enlace de YouTube. */
export async function activarEnVivo(token: string, enlace: string) {
  if (modoDemo) {
    const video = enlace.match(/(?:v=|live\/|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] ?? enlace.trim();
    const envivo = { video, titulo: "Transmisión de demostración" };
    poner(envivo);
    return envivo;
  }
  const { envivo } = await llamar<{ envivo: EnVivo }>("envivo-guardar", { token, enlace });
  poner(envivo);
  return envivo;
}

/** Solo el equipo: deja de mostrar la transmisión en la página. */
export async function terminarEnVivo(token: string) {
  if (!modoDemo) await llamar("envivo-quitar", { token });
  poner(null);
}
