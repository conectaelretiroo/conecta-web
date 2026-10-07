# Conecta Telecomunicaciones · sitio web

Sitio del canal local de El Retiro, Antioquia: en vivo, programación, programas propios, PQRS y panel del equipo.

Generado en Figma Make (React + Vite + TypeScript).

## Desarrollo

```bash
npm install
npm run dev     # servidor local
npm run build   # genera dist/
```

## Publicación (Cloudflare Pages)

- Comando de build: `npm run build`
- Carpeta de salida: `dist`
- `public/_redirects` envía todas las rutas a `index.html` (navegación de una sola página).

## Datos editables

- `src/data/canal.ts`: contacto, razón social, NIT y enlace del en vivo.
- `src/data/programas.ts`: programas del carrusel y de la página Programas.
- `src/data/parrilla.ts`: programación.
- `src/services/pqrs.ts`: por ahora simulado; se conectará a Google Sheets + Apps Script.
