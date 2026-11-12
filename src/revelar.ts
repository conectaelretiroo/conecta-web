// Animaciones al bajar por la página: cada bloque aparece con un fundido y una subida corta
// la primera vez que entra en pantalla. Lo que ya está a la vista al cargar no se anima.
// Con "reducir movimiento" activado en el dispositivo no se anima nada.
const SELECTOR = [
  ".service-card", ".home-local__grid", ".home-steps h2", ".steps li", ".home-faq__grid",
  ".featured-program", ".schedule-card", ".program-card", ".section-heading", ".help-card", ".legal > *",
].join(",");

export function activarRevelado() {
  if (typeof IntersectionObserver === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const raiz = document.getElementById("root");
  if (!raiz) return;

  const vistos = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (!entrada.isIntersecting) continue;
      const el = entrada.target as HTMLElement;
      el.classList.add("is-visible");
      vistos.unobserve(el);
      // Al terminar se quitan las clases para que el elemento recupere sus transiciones propias (por ejemplo al pasar el mouse).
      const limpiar = () => { el.classList.remove("reveal", "is-visible"); el.style.removeProperty("--revelar-espera"); };
      el.addEventListener("transitionend", (e) => { if (e.target === el && e.propertyName === "opacity") limpiar(); });
      window.setTimeout(limpiar, 1200);
    }
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.08 });

  const preparar = () => {
    raiz.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
      if (el.dataset.revelar) return;
      el.dataset.revelar = "1";
      // Lo que ya se ve al llegar a la página queda quieto: solo se anima lo que está más abajo.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      // Los hermanos (por ejemplo los tres pasos) entran uno tras otro.
      const hermanos = el.parentElement ? Array.from(el.parentElement.children).filter((h) => h.matches(SELECTOR)) : [];
      el.style.setProperty("--revelar-espera", `${Math.min(hermanos.indexOf(el), 4) * 70}ms`);
      el.classList.add("reveal");
      vistos.observe(el);
    });
  };

  let pendiente = 0;
  new MutationObserver(() => {
    cancelAnimationFrame(pendiente);
    pendiente = requestAnimationFrame(preparar);
  }).observe(raiz, { childList: true, subtree: true });
  preparar();
}
