// Interruptor del sitio real (conectaelretiro.tv, www y conecta-web.conectaelretiroo.workers.dev).
//
//   CERRADO = true  → los visitantes ven el aviso "Estamos haciendo mejoras".
//   CERRADO = false → el sitio funciona normal.
//
// Mientras está cerrado se responde con el código 503 (no disponible por un rato) y
// "Retry-After", que es la forma que Google entiende como cierre temporal: no borra
// las páginas de sus resultados si el cierre dura pocos días.
//
// El sitio de pruebas (wrangler.pruebas.jsonc) no usa este archivo, así que sigue abierto.
const CERRADO = true;

// true = el panel de PQRS (/admin) sigue funcionando aunque el sitio esté cerrado.
const ADMIN_ABIERTO = false;

// Archivos que se siguen entregando aunque esté cerrado (logo, íconos y robots para Google).
const SIEMPRE = /^\/(assets\/logo-conecta\.png|favicon[^/]*|apple-touch-icon\.png|robots\.txt)$/;

export default {
  async fetch(request, env) {
    if (!CERRADO) return env.ASSETS.fetch(request);

    const { pathname } = new URL(request.url);
    if (SIEMPRE.test(pathname)) return env.ASSETS.fetch(request);
    if (ADMIN_ABIERTO && (pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/assets/"))) {
      return env.ASSETS.fetch(request);
    }

    return new Response(AVISO, {
      status: 503,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "retry-after": "86400",
        "cache-control": "no-store",
      },
    });
  },
};

const AVISO = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Conecta El Retiro · Volvemos pronto</title>
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<meta name="theme-color" content="#1e1f19" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600&display=swap" rel="stylesheet" />
<style>
  :root { --ink:#1e1f19; --muted:#686a60; --soft:#f6f7f6; --teal:#115c57; }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    min-height: 100vh; display: flex; flex-direction: column;
    background: var(--soft); color: var(--ink);
    font-family: Inter, system-ui, sans-serif; line-height: 1.55;
  }
  .franja { height: 6px; background: linear-gradient(90deg,#50bbcd 0 25%,#35a43d 25% 50%,#f4ad37 50% 75%,#df2b74 75%); }
  main { flex: 1; display: grid; place-items: center; padding: 48px 20px; }
  .caja { max-width: 34rem; text-align: center; }
  img { width: 200px; max-width: 70%; height: auto; margin-bottom: 36px; }
  h1 { font-family: Poppins, Inter, sans-serif; font-weight: 600; font-size: clamp(1.75rem, 5vw, 2.5rem); line-height: 1.15; margin: 0 0 16px; }
  p { color: var(--muted); font-size: 1.05rem; margin: 0 0 12px; }
  .contacto { margin-top: 32px; font-size: .95rem; }
  .contacto a { color: var(--teal); font-weight: 500; text-decoration: none; }
  .contacto a:hover { text-decoration: underline; }
  footer { text-align: center; color: var(--muted); font-size: .85rem; padding: 20px; }
</style>
</head>
<body>
<div class="franja"></div>
<main>
  <div class="caja">
    <img src="/assets/logo-conecta.png" alt="Conecta Telecomunicaciones" />
    <h1>Estamos haciendo mejoras</h1>
    <p>Nuestra página está cerrada por unos días mientras la renovamos. Volvemos pronto.</p>
    <p class="contacto">
      Si necesitas algo, escríbenos a <a href="mailto:contacto@conectaelretiro.tv">contacto@conectaelretiro.tv</a><br />
      o llámanos al <a href="tel:+576045413066">604 541 3066</a> · <a href="tel:+573232869963">323 286 9963</a>
    </p>
  </div>
</main>
<footer>Conecta Telecomunicaciones · Cra. 20 #22-25, El Retiro, Antioquia</footer>
</body>
</html>`;
