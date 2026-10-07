// Quita la pantalla de carga de index.html cuando la página ya está lista.
// La primera visita de la sesión deja ver la animación completa; las siguientes la quitan apenas carga.
const CLAVE = "conecta-intro-vista";
const DURACION_INTRO = 2300;

export function quitarPantallaDeCarga() {
  const pantalla = document.getElementById("cargando");
  if (!pantalla) return;
  let vista = false;
  try {
    vista = sessionStorage.getItem(CLAVE) === "1";
    sessionStorage.setItem(CLAVE, "1");
  } catch {
    // sin almacenamiento: se muestra la animación completa
  }
  const quieta = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const espera = vista || quieta ? 0 : Math.max(0, DURACION_INTRO - performance.now());
  window.setTimeout(() => {
    pantalla.classList.add("cargando--fuera");
    window.setTimeout(() => pantalla.remove(), 500);
  }, espera);
}
