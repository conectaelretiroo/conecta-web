/**
 * PQRS de Conecta Telecomunicaciones: backend en Google Apps Script.
 *
 * Este script va dentro de la hoja de cálculo (Extensiones → Apps Script).
 * La hoja es privada: solo este script la lee y la escribe. La página web
 * le habla por POST y el panel se valida con el token de "Ingresar con Google"
 * más la lista de correos de la pestaña Equipo.
 *
 * Propiedades del script (Configuración del proyecto → Propiedades del script):
 *   GOOGLE_CLIENT_ID  ID de cliente OAuth de la página (obligatoria para el panel).
 */

const HOJA_PQRS = 'PQRS';
const HOJA_HISTORIAL = 'Historial';
const HOJA_EQUIPO = 'Equipo';

const COLUMNAS = [
  'Radicado', 'Fecha', 'Tipo', 'Nombre', 'Correo', 'Teléfono', 'Ubicación',
  'Asunto', 'Descripción', 'Estado', 'Respuesta', 'Actualizado', 'Responsable',
];
const COL = COLUMNAS.reduce((mapa, nombre, i) => { mapa[nombre] = i; return mapa; }, {});

const TIPOS = ['Petición', 'Queja', 'Reclamo', 'Sugerencia', 'Felicitación'];
const ESTADOS = ['Radicada', 'En trámite', 'Respondida', 'Cerrada'];
const LIMITE_POR_HORA = 5;
const NOMBRE_REMITENTE = 'Conecta Telecomunicaciones';
const ZONA = 'America/Bogota';

/** Ejecutar una sola vez desde el editor: crea las pestañas con sus encabezados. */
function configurar() {
  const libro = SpreadsheetApp.getActive();
  crearHoja_(libro, HOJA_PQRS, COLUMNAS);
  crearHoja_(libro, HOJA_HISTORIAL, ['Fecha', 'Radicado', 'Acción', 'Detalle', 'Responsable']);
  crearHoja_(libro, HOJA_EQUIPO, ['Correo', 'Nombre']);
  const estado = libro.getSheetByName(HOJA_PQRS).getRange(2, COL['Estado'] + 1, 1000, 1);
  estado.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).build());
}

function crearHoja_(libro, nombre, encabezados) {
  const hoja = libro.getSheetByName(nombre) || libro.insertSheet(nombre);
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(encabezados);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, encabezados.length).setFontWeight('bold');
  }
}

function doPost(e) {
  let resultado;
  try {
    const datos = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    switch (datos.accion) {
      case 'radicar':
        resultado = { radicado: radicar_(datos.solicitud || {}) };
        break;
      case 'listar':
        verificar_(datos.token);
        resultado = { solicitudes: listar_() };
        break;
      case 'obtener':
        verificar_(datos.token);
        resultado = obtener_(String(datos.radicado || ''));
        break;
      case 'actualizar':
        resultado = { solicitud: actualizar_(verificar_(datos.token), datos.cambios || {}) };
        break;
      default:
        throw new ErrorPublico('Acción no válida.');
    }
    resultado.ok = true;
  } catch (error) {
    if (!(error instanceof ErrorPublico)) console.error(error);
    resultado = {
      ok: false,
      error: error instanceof ErrorPublico ? error.message : 'No pudimos procesar la solicitud. Intenta de nuevo.',
      sesion: error instanceof ErrorPublico && error.sesion ? true : undefined,
    };
  }
  return ContentService.createTextOutput(JSON.stringify(resultado)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, servicio: 'PQRS Conecta' }))
    .setMimeType(ContentService.MimeType.JSON);
}

class ErrorPublico extends Error {
  constructor(mensaje, sesion) {
    super(mensaje);
    this.sesion = Boolean(sesion);
  }
}

// ---------- Radicar (público) ----------

function radicar_(s) {
  // Campo trampa: los humanos no lo ven; si llega lleno es un robot.
  if (s.sitio) throw new ErrorPublico('No pudimos procesar la solicitud.');

  const solicitud = {
    tipo: texto_(s.tipo, 20),
    nombre: texto_(s.nombre, 120),
    correo: texto_(s.correo, 254).toLowerCase(),
    telefono: texto_(s.telefono, 30),
    ubicacion: texto_(s.ubicacion, 120),
    asunto: texto_(s.asunto, 150),
    descripcion: texto_(s.descripcion, 4800),
  };
  if (TIPOS.indexOf(solicitud.tipo) < 0) throw new ErrorPublico('Elige el tipo de solicitud.');
  if (!solicitud.nombre || !solicitud.ubicacion || !solicitud.asunto || !solicitud.descripcion) {
    throw new ErrorPublico('Completa todos los campos obligatorios.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(solicitud.correo)) throw new ErrorPublico('Revisa el correo electrónico.');
  if (s.autorizacion !== true) throw new ErrorPublico('Debes autorizar el tratamiento de datos personales.');

  const cache = CacheService.getScriptCache();
  const clave = 'envios:' + solicitud.correo;
  const envios = Number(cache.get(clave) || 0);
  if (envios >= LIMITE_POR_HORA) {
    throw new ErrorPublico('Recibimos varias solicitudes desde este correo. Intenta de nuevo en una hora.');
  }

  const candado = LockService.getScriptLock();
  candado.waitLock(20000);
  let radicado;
  const ahora = new Date();
  try {
    radicado = siguienteRadicado_(ahora);
    const fila = COLUMNAS.map(() => '');
    fila[COL['Radicado']] = radicado;
    fila[COL['Fecha']] = ahora;
    fila[COL['Tipo']] = solicitud.tipo;
    fila[COL['Nombre']] = seguro_(solicitud.nombre);
    fila[COL['Correo']] = seguro_(solicitud.correo);
    fila[COL['Teléfono']] = seguro_(solicitud.telefono);
    fila[COL['Ubicación']] = seguro_(solicitud.ubicacion);
    fila[COL['Asunto']] = seguro_(solicitud.asunto);
    fila[COL['Descripción']] = seguro_(solicitud.descripcion);
    fila[COL['Estado']] = 'Radicada';
    fila[COL['Actualizado']] = ahora;
    hoja_(HOJA_PQRS).appendRow(fila);
    historial_(radicado, 'Radicada', 'Solicitud recibida desde el sitio web.', 'Sistema');
  } finally {
    candado.releaseLock();
  }
  cache.put(clave, String(envios + 1), 3600);

  correo_(solicitud.correo, 'Radicamos tu solicitud ' + radicado, [
    'Hola, ' + solicitud.nombre + '.',
    '',
    'Recibimos tu ' + solicitud.tipo.toLowerCase() + ' con el número de radicado ' + radicado + '.',
    'Asunto: ' + solicitud.asunto,
    '',
    'Te responderemos a este correo. Guarda el número de radicado para cualquier comunicación con el canal.',
    '',
    NOMBRE_REMITENTE,
  ].join('\n'));

  const equipo = correosEquipo_();
  if (equipo.length) {
    correo_(equipo.join(','), 'Nueva PQRS ' + radicado + ': ' + solicitud.asunto, [
      'Tipo: ' + solicitud.tipo,
      'Ciudadano: ' + solicitud.nombre + ' <' + solicitud.correo + '>',
      'Ubicación: ' + solicitud.ubicacion,
      '',
      solicitud.descripcion,
      '',
      'Gestiónala en el panel del sitio, en Ingreso del equipo.',
    ].join('\n'));
  }
  return radicado;
}

/** PQRS-AAAA-NNNNNN, consecutivo por año. Se llama con el candado tomado. */
function siguienteRadicado_(fecha) {
  const anio = Utilities.formatDate(fecha, ZONA, 'yyyy');
  const propiedades = PropertiesService.getScriptProperties();
  const clave = 'consecutivo-' + anio;
  const siguiente = Number(propiedades.getProperty(clave) || 0) + 1;
  propiedades.setProperty(clave, String(siguiente));
  return 'PQRS-' + anio + '-' + ('000000' + siguiente).slice(-6);
}

// ---------- Panel (solo equipo) ----------

/** Valida el token de Google y que el correo esté en la pestaña Equipo. */
function verificar_(token) {
  if (!token) throw new ErrorPublico('Inicia sesión para continuar.', true);
  const clienteId = PropertiesService.getScriptProperties().getProperty('GOOGLE_CLIENT_ID');
  if (!clienteId) throw new ErrorPublico('Falta configurar GOOGLE_CLIENT_ID en el script.');

  const respuesta = UrlFetchApp.fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token),
    { muteHttpExceptions: true },
  );
  if (respuesta.getResponseCode() !== 200) throw new ErrorPublico('Tu sesión expiró. Ingresa de nuevo.', true);
  const info = JSON.parse(respuesta.getContentText());
  const emisorValido = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  if (info.aud !== clienteId || !emisorValido || String(info.email_verified) !== 'true') {
    throw new ErrorPublico('Tu sesión no es válida. Ingresa de nuevo.', true);
  }

  const correo = String(info.email).toLowerCase();
  if (correosEquipo_().indexOf(correo) < 0) {
    throw new ErrorPublico('La cuenta ' + correo + ' no tiene acceso al panel.', true);
  }
  return { correo: correo, nombre: info.name || correo };
}

function listar_() {
  const hoja = hoja_(HOJA_PQRS);
  if (hoja.getLastRow() < 2) return [];
  const filas = hoja.getRange(2, 1, hoja.getLastRow() - 1, COLUMNAS.length).getValues();
  return filas.filter((f) => f[COL['Radicado']]).map(aSolicitud_).reverse();
}

function obtener_(radicado) {
  const encontrada = buscar_(radicado);
  if (!encontrada) throw new ErrorPublico('No encontramos esa solicitud.');
  const hoja = hoja_(HOJA_HISTORIAL);
  const historial = hoja.getLastRow() < 2 ? [] : hoja.getRange(2, 1, hoja.getLastRow() - 1, 5).getValues()
    .filter((f) => f[1] === radicado)
    .map((f) => ({ fecha: fecha_(f[0]), accion: f[2], detalle: f[3], responsable: f[4] }));
  return { solicitud: aSolicitud_(encontrada.valores), historial: historial };
}

function actualizar_(usuario, cambios) {
  const radicado = String(cambios.radicado || '');
  const candado = LockService.getScriptLock();
  candado.waitLock(20000);
  let solicitud;
  let enviarRespuesta = false;
  try {
    const encontrada = buscar_(radicado);
    if (!encontrada) throw new ErrorPublico('No encontramos esa solicitud.');
    const fila = encontrada.valores;
    const estadoAnterior = fila[COL['Estado']];
    const respuestaAnterior = String(fila[COL['Respuesta']] || '');

    const estado = cambios.estado === undefined ? estadoAnterior : String(cambios.estado);
    if (ESTADOS.indexOf(estado) < 0) throw new ErrorPublico('Estado no válido.');
    const respuesta = cambios.respuesta === undefined ? respuestaAnterior : texto_(cambios.respuesta, 4800);
    if (estado === 'Respondida' && !respuesta) throw new ErrorPublico('Escribe la respuesta antes de marcarla como respondida.');

    fila[COL['Estado']] = estado;
    fila[COL['Respuesta']] = respuesta;
    fila[COL['Actualizado']] = new Date();
    fila[COL['Responsable']] = usuario.correo;
    // getValues devuelve el texto sin el apóstrofo protector; se vuelve a poner al reescribir.
    const escrita = fila.map((valor) => (typeof valor === 'string' ? seguro_(valor) : valor));
    encontrada.hoja.getRange(encontrada.numero, 1, 1, COLUMNAS.length).setValues([escrita]);

    if (estado !== estadoAnterior) historial_(radicado, 'Estado: ' + estado, 'Antes: ' + estadoAnterior, usuario.correo);
    if (respuesta && respuesta !== respuestaAnterior) {
      historial_(radicado, 'Respuesta enviada', respuesta, usuario.correo);
      enviarRespuesta = true;
    }
    solicitud = aSolicitud_(fila);
  } finally {
    candado.releaseLock();
  }

  if (enviarRespuesta) {
    correo_(solicitud.correo, 'Respuesta a tu solicitud ' + solicitud.radicado, [
      'Hola, ' + solicitud.nombre + '.',
      '',
      'Esta es la respuesta a tu solicitud ' + solicitud.radicado + ' (' + solicitud.asunto + '):',
      '',
      solicitud.respuesta,
      '',
      NOMBRE_REMITENTE,
    ].join('\n'));
  }
  return solicitud;
}

// ---------- Utilidades ----------

function hoja_(nombre) {
  const hoja = SpreadsheetApp.getActive().getSheetByName(nombre);
  if (!hoja) throw new Error('Falta la pestaña ' + nombre + '. Ejecuta configurar().');
  return hoja;
}

function buscar_(radicado) {
  if (!/^PQRS-\d{4}-\d{6}$/.test(radicado)) return null;
  const hoja = hoja_(HOJA_PQRS);
  const celda = hoja.getRange('A:A').createTextFinder(radicado).matchEntireCell(true).findNext();
  if (!celda || celda.getRow() < 2) return null;
  const numero = celda.getRow();
  return { hoja: hoja, numero: numero, valores: hoja.getRange(numero, 1, 1, COLUMNAS.length).getValues()[0] };
}

function aSolicitud_(f) {
  return {
    radicado: f[COL['Radicado']],
    fecha: fecha_(f[COL['Fecha']]),
    tipo: f[COL['Tipo']],
    nombre: limpio_(f[COL['Nombre']]),
    correo: limpio_(f[COL['Correo']]),
    telefono: limpio_(f[COL['Teléfono']]),
    ubicacion: limpio_(f[COL['Ubicación']]),
    asunto: limpio_(f[COL['Asunto']]),
    descripcion: limpio_(f[COL['Descripción']]),
    estado: f[COL['Estado']],
    respuesta: limpio_(f[COL['Respuesta']]),
    actualizado: fecha_(f[COL['Actualizado']]),
    responsable: f[COL['Responsable']],
  };
}

function historial_(radicado, accion, detalle, responsable) {
  hoja_(HOJA_HISTORIAL).appendRow([new Date(), radicado, accion, seguro_(detalle), responsable]);
}

function correosEquipo_() {
  const hoja = hoja_(HOJA_EQUIPO);
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 1).getValues()
    .map((f) => String(f[0]).trim().toLowerCase())
    .filter((c) => c.indexOf('@') > 0);
}

function correo_(para, asunto, cuerpo) {
  try {
    MailApp.sendEmail({ to: para, subject: asunto, body: cuerpo, name: NOMBRE_REMITENTE });
  } catch (error) {
    // Un correo fallido no debe perder la PQRS, que ya quedó en la hoja.
    console.error('No se pudo enviar el correo a ' + para + ': ' + error);
  }
}

function texto_(valor, maximo) {
  return String(valor === undefined || valor === null ? '' : valor).trim().slice(0, maximo);
}

/** Evita que un texto que empieza con = + - @ se interprete como fórmula en la hoja. */
function seguro_(valor) {
  return /^[=+\-@]/.test(valor) ? "'" + valor : valor;
}

function limpio_(valor) {
  return String(valor === undefined || valor === null ? '' : valor);
}

function fecha_(valor) {
  return valor instanceof Date ? Utilities.formatDate(valor, ZONA, "yyyy-MM-dd'T'HH:mm:ss") : String(valor || '');
}
