// Casilla "no soy un robot" de Cloudflare Turnstile en el formulario de PQRS.
// Sin VITE_TURNSTILE_SITE_KEY no se muestra y el formulario funciona como antes.

type Turnstile = {
  render: (elemento: HTMLElement, opciones: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
export const turnstileActivo = Boolean(SITE_KEY);

let cargando: Promise<Turnstile> | undefined;

function cargar() {
  cargando ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile no cargó")));
    script.onerror = () => {
      cargando = undefined;
      reject(new Error("Turnstile no cargó"));
    };
    document.head.appendChild(script);
  });
  return cargando;
}

/** Dibuja la casilla en `elemento`. Devuelve una función para quitarla y otra para reiniciarla. */
export function mostrarTurnstile(elemento: HTMLElement, alCambiar: (token: string) => void) {
  let id: string | undefined;
  let activo = true;
  if (SITE_KEY) {
    cargar()
      .then((turnstile) => {
        if (!activo) return;
        id = turnstile.render(elemento, {
          sitekey: SITE_KEY,
          language: "es",
          callback: (token: string) => alCambiar(token),
          "expired-callback": () => alCambiar(""),
          "error-callback": () => alCambiar(""),
        });
      })
      .catch(() => alCambiar(""));
  }
  return {
    quitar: () => {
      activo = false;
      if (id) window.turnstile?.remove(id);
    },
    reiniciar: () => {
      alCambiar("");
      if (id) window.turnstile?.reset(id);
    },
  };
}
