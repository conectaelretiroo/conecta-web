# PQRS con Google Sheets: guía de instalación

Todo se hace con la cuenta del canal, **conectaelretiroo@gmail.com**. Toma unos 20 minutos y se hace una sola vez.

Al final necesitas dos datos para la página: la **URL del script** (termina en `/exec`) y el **ID de cliente de Google**. Ninguno de los dos es secreto.

## 1. Crear la hoja y el script

1. Entra a [Google Drive](https://drive.google.com) con la cuenta del canal, toca **Nuevo → Hojas de cálculo** y nómbrala `PQRS Conecta`.
2. En la hoja, abre **Extensiones → Apps Script**.
3. Borra lo que trae el archivo `Código.gs` y pega todo el contenido de [`Code.gs`](./Code.gs).
4. Toca el engranaje (**Configuración del proyecto**), activa **Mostrar el archivo de manifiesto "appsscript.json"** y vuelve al editor. Abre `appsscript.json`, borra lo que trae y pega el contenido de [`appsscript.json`](./appsscript.json).
5. Guarda (ícono de disquete). Arriba, en la lista de funciones, elige **configurar** y toca **Ejecutar**.
6. Google pide permisos. Elige la cuenta del canal. Si aparece "Google no verificó esta app", toca **Configuración avanzada → Ir a … (no seguro)** y luego **Permitir**. Es normal: el script es del mismo canal.
7. Vuelve a la hoja: ya tiene las pestañas **PQRS**, **Historial** y **Equipo**.
8. En **Equipo** escribe, desde la fila 2, el correo de cada persona que gestionará las PQRS (columna A) y su nombre (columna B). Deben ser cuentas de Google.

## 2. Publicar el script

1. En Apps Script toca **Implementar → Nueva implementación**.
2. En el engranaje de "Seleccionar tipo" elige **Aplicación web**.
3. **Ejecutar como:** Yo (conectaelretiroo@gmail.com). **Quién tiene acceso:** Cualquier usuario.
4. Toca **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).

Cuando cambies el código más adelante, usa **Implementar → Administrar implementaciones → editar (lápiz) → Versión: nueva versión**, para que la URL no cambie.

## 3. Crear el ID de cliente para "Ingresar con Google"

1. Entra a [Google Cloud Console](https://console.cloud.google.com) con la cuenta del canal y crea un proyecto llamado `Conecta Web`. Es gratis y no pide tarjeta.
2. Ve a **APIs y servicios → Pantalla de consentimiento de OAuth** (puede aparecer como **Google Auth Platform**). Tipo de usuario **Externo**, nombre de la app `Conecta Telecomunicaciones` y el correo del canal como soporte. Publica la app (estado **En producción**). Como solo pide nombre y correo, Google no exige verificación.
3. Ve a **Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo **Aplicación web**.
4. En **Orígenes autorizados de JavaScript** agrega la dirección de la página (por ejemplo `https://conecta-web.pages.dev` y el dominio propio cuando exista) y `http://localhost:5173` para pruebas.
5. Copia el **ID de cliente** (termina en `.apps.googleusercontent.com`).
6. De vuelta en Apps Script: **Configuración del proyecto → Propiedades del script → Agregar propiedad**. Nombre `GOOGLE_CLIENT_ID`, valor: el ID de cliente. Guarda.

## 4. Conectar la página

En Cloudflare Pages (o en un archivo `.env` local, ver `.env.example`) se configuran dos variables:

| Variable | Valor |
| --- | --- |
| `VITE_PQRS_API` | La URL `/exec` del paso 2 |
| `VITE_GOOGLE_CLIENT_ID` | El ID de cliente del paso 3 |

Sin esas variables la página funciona en **modo demostración**: el formulario avisa que no guarda y el panel muestra datos de ejemplo.

## Cómo funciona

- **Radicar (público):** la página envía la solicitud al script, que valida los campos, aplica el límite de 5 envíos por correo por hora, descarta robots (campo trampa), asigna el radicado `PQRS-AAAA-NNNNNN`, guarda la fila y envía la confirmación al ciudadano y un aviso al equipo.
- **Panel (equipo):** la persona ingresa con Google. En cada petición el script verifica el token con Google y que el correo esté en la pestaña Equipo. Si no, no devuelve datos.
- **Responder:** al guardar una respuesta nueva, el script la envía por correo al ciudadano y deja el registro en Historial.
- La hoja nunca se comparte: solo el script la lee y la escribe. Para dar o quitar acceso al panel, edita la pestaña Equipo.
- Los textos que empiezan con `=`, `+`, `-` o `@` se guardan como texto para que nadie pueda meter fórmulas en la hoja.
- Gmail permite 100 destinatarios al día desde scripts. Cada PQRS usa 2 o 3 correos, así que alcanza de sobra para unas 100 PQRS al mes.

## Respaldo

Una vez al mes, desde la hoja: **Archivo → Descargar → Microsoft Excel**, o **Archivo → Hacer una copia** en una carpeta de respaldo del Drive del canal.
