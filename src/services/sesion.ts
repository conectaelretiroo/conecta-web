// Ingreso del equipo con Google (Google Identity Services).
// El token se guarda solo en esta pestaña y el Apps Script lo verifica en cada petición.

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const CLAVE = "conecta-sesion";

export const ingresoDemo = !CLIENT_ID;

export type Sesion = { token: string; correo: string; nombre: string; expira: number };

type Google = {
  accounts: {
    id: {
      initialize(opciones: { client_id: string; callback: (r: { credential: string }) => void; auto_select?: boolean }): void;
      renderButton(elemento: HTMLElement, opciones: Record<string, string | number>): void;
      disableAutoSelect(): void;
    };
  };
};

declare global {
  interface Window {
    google?: Google;
  }
}

function leerToken(token: string): Sesion | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const datos = JSON.parse(decodeURIComponent(escape(atob(base64))));
    return { token, correo: datos.email, nombre: datos.name ?? datos.email, expira: datos.exp * 1000 };
  } catch {
    return null;
  }
}

export function sesionGuardada(): Sesion | null {
  try {
    const guardada = JSON.parse(sessionStorage.getItem(CLAVE) ?? "null") as Sesion | null;
    // Margen de un minuto para no enviar un token a punto de vencer.
    return guardada && guardada.expira - 60_000 > Date.now() ? guardada : null;
  } catch {
    return null;
  }
}

/** Guarda la sesión en esta pestaña. Solo se llama cuando el script ya confirmó el acceso. */
export function guardarSesion(sesion: Sesion) {
  try {
    sessionStorage.setItem(CLAVE, JSON.stringify(sesion));
  } catch {
    // sin almacenamiento: la sesión dura mientras la página esté abierta
  }
}

export function cerrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE);
  } catch {
    // sin almacenamiento disponible: no hay nada que borrar
  }
  window.google?.accounts.id.disableAutoSelect();
}

let cargando: Promise<Google> | null = null;

function cargarGoogle() {
  cargando ??= new Promise<Google>((resolve, reject) => {
    if (window.google) return resolve(window.google);
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => (window.google ? resolve(window.google) : reject(new Error("Google no cargó")));
    script.onerror = () => {
      cargando = null;
      reject(new Error("No se pudo cargar el ingreso con Google."));
    };
    document.head.appendChild(script);
  });
  return cargando;
}

/** Dibuja el botón oficial de Google dentro de `elemento` y entrega el token cuando la persona elige su cuenta. */
export async function mostrarBotonGoogle(elemento: HTMLElement, alIngresar: (sesion: Sesion) => void) {
  const google = await cargarGoogle();
  google.accounts.id.initialize({
    client_id: CLIENT_ID!,
    callback: ({ credential }) => {
      const sesion = leerToken(credential);
      if (sesion) alIngresar(sesion);
    },
  });
  google.accounts.id.renderButton(elemento, { theme: "outline", size: "large", text: "signin_with", shape: "rectangular", locale: "es", width: 280 });
}
