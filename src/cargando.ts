// Quita la pantalla de carga de index.html cuando la página ya está lista.
// La primera visita de la sesión deja ver la animación completa; las siguientes la quitan apenas carga.
const CLAVE = "conecta-intro-vista";
// Milisegundos desde que arranca la animación hasta que termina la primera onda de los puntos (la última parte).
const FIN_INTRO = 3200;

// La animación arranca cuando el navegador pinta la pantalla, no cuando empieza a cargar la página:
// en una conexión lenta eso pasa varios segundos después. Por eso se mide con el reloj de la propia
// animación (la onda de los puntos, que no termina nunca) y no con el de la página.
function faltaPorVer(pantalla: HTMLElement) {
  const onda = pantalla.querySelector(".c-onda");
  const animacion = onda?.getAnimations?.()[0];
  const transcurrido = animacion?.currentTime;
  if (typeof transcurrido !== "number") return FIN_INTRO - performance.now();
  return FIN_INTRO - transcurrido;
}

export function quitarPantallaDeCarga() {
  const pantalla = document.getElementById("cargando");
  if (!pantalla) return;
  let vista = false;
  try {
    vista = sessionStorage.getItem(CLAVE) === "1";
  } catch {
    // sin almacenamiento: se muestra la animación completa
  }
  const quieta = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quitar = () => {
    try {
      sessionStorage.setItem(CLAVE, "1");
    } catch {
      // sin almacenamiento
    }
    pantalla.classList.add("cargando--fuera");
    window.setTimeout(() => pantalla.remove(), 500);
  };
  if (vista || quieta) return quitar();
  // Si la pestaña está oculta la animación no avanza: se espera a que la persona la vea.
  const esperar = () => {
    if (document.hidden) return;
    document.removeEventListener("visibilitychange", esperar);
    window.setTimeout(quitar, Math.max(0, faltaPorVer(pantalla)));
  };
  document.addEventListener("visibilitychange", esperar);
  esperar();
}
