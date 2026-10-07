# Conecta Telecomunicaciones · sitio web

Sitio del canal local de El Retiro, Antioquia: en vivo, programación, programas propios, PQRS y panel del equipo.

Generado en Figma Make (React + Vite + TypeScript).

## Desarrollo

```bash
npm install
npm run dev     # servidor local
npm run build   # genera dist/
```

## Publicación (Cloudflare)

- Cloudflare compila con `npm run build` y publica `dist` usando `wrangler.jsonc`.
- `not_found_handling: "single-page-application"` hace que rutas como `/pqrs` o `/admin` carguen `index.html`.

## Datos editables

- `src/data/canal.ts`: contacto, razón social, NIT y enlace del en vivo.
- `src/data/programas.ts`: programas del carrusel y de la página Programas.
- `src/data/parrilla.ts`: programación.
- `src/services/pqrs.ts` y `src/services/sesion.ts`: conexión de las PQRS y del ingreso con Google.

## PQRS

Las PQRS se guardan en una hoja de Google del canal a través de un Apps Script. La guía de instalación está en [`apps-script/README.md`](apps-script/README.md). La página necesita dos variables de entorno (ver `.env.example`); sin ellas funciona en modo demostración.

## Actualizar el diseño desde Figma Make

El diseño se edita en Figma Make y luego se trae a este repositorio. Al traerlo hay que conservar `src/services/`, `apps-script/` y las funciones `Pqrs`, `Admin` y `PqrsDetail` de `src/App.tsx`, que contienen la conexión real.
