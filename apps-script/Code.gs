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
 *   TURNSTILE_SECRET  Clave secreta de Cloudflare Turnstile. Si existe, cada PQRS debe
 *                     traer la verificación "no soy un robot" del formulario.
 *   YOUTUBE_API_KEY   Llave de la API de datos de YouTube. Con ella el panel activa la
 *                     transmisión en vivo y la página la quita sola cuando termina.
 *
 * En la hoja, el menú PQRS → "Reporte entre fechas…" llena la pestaña Reporte.
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
// Tope para todo el sitio, por si un robot cambia de correo en cada envío.
const LIMITE_TOTAL_POR_HORA = 30;
const NOMBRE_REMITENTE = 'Conecta Telecomunicaciones';
// Los correos del canal salen desde esta dirección (alias de Gmail) y las respuestas llegan a ella.
const RESPONDER_A = 'contacto@conectaelretiro.tv';
const ZONA = 'America/Bogota';

/** Ejecutar una sola vez desde el editor: crea las pestañas con sus encabezados. */
function configurar() {
  const libro = SpreadsheetApp.getActive();
  crearHoja_(libro, HOJA_PQRS, COLUMNAS);
  crearHoja_(libro, HOJA_HISTORIAL, ['Fecha', 'Radicado', 'Acción', 'Detalle', 'Responsable']);
  crearHoja_(libro, HOJA_EQUIPO, ['Correo', 'Nombre', 'Avisos']);
  const estado = libro.getSheetByName(HOJA_PQRS).getRange(2, COL['Estado'] + 1, 1000, 1);
  estado.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).build());
}

/** Ejecutar desde el editor después de cambiar permisos: pide la autorización y muestra los alias de Gmail. */
function autorizar() {
  console.log('Alias de "Enviar como": ' + GmailApp.getAliases().join(', '));
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
      case 'envivo':
        resultado = { envivo: enVivo_() };
        break;
      case 'envivo-guardar':
        resultado = { envivo: guardarEnVivo_(verificar_(datos.token), datos.enlace) };
        break;
      case 'envivo-quitar':
        verificar_(datos.token);
        resultado = { envivo: quitarEnVivo_() };
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

/** Comprueba con Cloudflare la casilla "no soy un robot". Sin TURNSTILE_SECRET no se exige. */
function verificarHumano_(token) {
  const secreto = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET');
  if (!secreto) return;
  if (!token) throw new ErrorPublico('Confirma que no eres un robot y envía de nuevo.');
  const respuesta = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'post',
    payload: { secret: secreto, response: String(token) },
    muteHttpExceptions: true,
  });
  let resultado = {};
  try { resultado = JSON.parse(respuesta.getContentText()); } catch (e) { /* respuesta inválida: se rechaza */ }
  if (!resultado.success) throw new ErrorPublico('No pudimos confirmar que no eres un robot. Intenta de nuevo.');
}

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
  const claveTotal = 'envios-total:' + Utilities.formatDate(new Date(), ZONA, 'yyyyMMddHH');
  const total = Number(cache.get(claveTotal) || 0);
  if (total >= LIMITE_TOTAL_POR_HORA) {
    throw new ErrorPublico('Estamos recibiendo muchas solicitudes. Intenta de nuevo en una hora.');
  }
  verificarHumano_(s.turnstile);

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
  cache.put(claveTotal, String(total + 1), 3600);

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

  const equipo = correosAvisos_();
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

// ---------- Transmisión en vivo (YouTube) ----------

const PROPIEDAD_ENVIVO = 'ENVIVO';
// La página pregunta cada minuto; YouTube se consulta como mucho una vez por minuto.
const SEGUNDOS_ENVIVO = 60;

/** Lo que la página muestra: { video, titulo } mientras el en vivo esté al aire o programado; si no, null. */
function enVivo_() {
  const cache = CacheService.getScriptCache();
  const enCache = cache.get('envivo');
  if (enCache) return JSON.parse(enCache).envivo;

  const propiedades = PropertiesService.getScriptProperties();
  const guardado = JSON.parse(propiedades.getProperty(PROPIEDAD_ENVIVO) || 'null');
  let envivo = null;
  if (guardado) {
    const info = consultarYoutube_(guardado.video);
    if (!info) {
      // YouTube no respondió: se sigue mostrando lo último que se sabía.
      envivo = { video: guardado.video, titulo: guardado.titulo };
    } else if (info.activo) {
      envivo = { video: guardado.video, titulo: info.titulo };
    } else {
      // Terminó (o lo borraron): se quita solo.
      propiedades.deleteProperty(PROPIEDAD_ENVIVO);
    }
  }
  cache.put('envivo', JSON.stringify({ envivo: envivo }), SEGUNDOS_ENVIVO);
  return envivo;
}

/** El equipo pega el enlace del en vivo de YouTube desde el panel. */
function guardarEnVivo_(usuario, enlace) {
  const video = idYoutube_(enlace);
  if (!video) throw new ErrorPublico('Pega el enlace del video en vivo de YouTube, por ejemplo https://youtube.com/live/…');
  if (!PropertiesService.getScriptProperties().getProperty('YOUTUBE_API_KEY')) {
    throw new ErrorPublico('Falta configurar YOUTUBE_API_KEY en el script.');
  }
  const info = consultarYoutube_(video);
  if (!info) throw new ErrorPublico('No pudimos consultar YouTube. Intenta de nuevo.');
  if (!info.existe) throw new ErrorPublico('No encontramos ese video. Revisa que sea público u oculto, no privado.');
  if (!info.activo) throw new ErrorPublico('Ese video no es un en vivo al aire ni programado.');

  PropertiesService.getScriptProperties().setProperty(PROPIEDAD_ENVIVO, JSON.stringify({
    video: video, titulo: info.titulo, activadoPor: usuario.correo, fecha: fecha_(new Date()),
  }));
  CacheService.getScriptCache().remove('envivo');
  return { video: video, titulo: info.titulo };
}

/** El equipo termina la transmisión desde el panel antes de que YouTube la cierre. */
function quitarEnVivo_() {
  PropertiesService.getScriptProperties().deleteProperty(PROPIEDAD_ENVIVO);
  CacheService.getScriptCache().remove('envivo');
  return null;
}

/** Acepta youtube.com/watch?v=, youtube.com/live/, youtu.be/ y el código de 11 caracteres. */
function idYoutube_(enlace) {
  const texto = String(enlace || '').trim();
  if (/^[\w-]{11}$/.test(texto)) return texto;
  const encontrado = texto.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|live\/|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return encontrado ? encontrado[1] : '';
}

/** { existe, activo, titulo } según YouTube, o null si no se pudo consultar. */
function consultarYoutube_(video) {
  const llave = PropertiesService.getScriptProperties().getProperty('YOUTUBE_API_KEY');
  if (!llave) return null;
  const respuesta = UrlFetchApp.fetch(
    'https://www.googleapis.com/youtube/v3/videos?part=snippet&id=' + encodeURIComponent(video) + '&key=' + encodeURIComponent(llave),
    { muteHttpExceptions: true },
  );
  if (respuesta.getResponseCode() !== 200) {
    console.error('YouTube respondió ' + respuesta.getResponseCode() + ': ' + respuesta.getContentText());
    return null;
  }
  const items = JSON.parse(respuesta.getContentText()).items || [];
  if (!items.length) return { existe: false, activo: false, titulo: '' };
  const snippet = items[0].snippet;
  // "live" = al aire, "upcoming" = programado, "none" = terminó o no es un en vivo.
  return { existe: true, activo: snippet.liveBroadcastContent !== 'none', titulo: snippet.title };
}

// ---------- Reportes por fechas (menú de la hoja) ----------

const HOJA_REPORTE = 'Reporte';

/** Al abrir la hoja aparece el menú "PQRS" con el reporte entre fechas. */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('PQRS')
    .addItem('Reporte entre fechas…', 'abrirReporte')
    .addToUi();
}

function abrirReporte() {
  const hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  const inicioMes = hoy.slice(0, 8) + '01';
  const html = HtmlService.createHtmlOutput([
    '<style>body{font-family:Arial,sans-serif;font-size:14px;margin:0}label{display:block;margin:0 0 12px}',
    'input{display:block;margin-top:4px;padding:6px;font-size:14px;width:100%;box-sizing:border-box}',
    'button{padding:8px 16px;font-size:14px;background:#115c57;color:#fff;border:0;border-radius:4px;cursor:pointer}',
    'button:disabled{opacity:.6}#aviso{color:#8f1d1d;margin-top:10px}</style>',
    '<label>Desde<input type="date" id="desde" value="' + inicioMes + '"></label>',
    '<label>Hasta<input type="date" id="hasta" value="' + hoy + '"></label>',
    '<button id="crear" onclick="crear()">Crear reporte</button><div id="aviso"></div>',
    '<script>function crear(){var d=document.getElementById("desde").value,h=document.getElementById("hasta").value,',
    'a=document.getElementById("aviso"),b=document.getElementById("crear");',
    'if(!d||!h){a.textContent="Elige las dos fechas.";return}if(d>h){a.textContent="La fecha inicial va antes de la final.";return}',
    'b.disabled=true;b.textContent="Creando…";',
    'google.script.run.withSuccessHandler(function(){google.script.host.close()})',
    '.withFailureHandler(function(e){a.textContent=e.message;b.disabled=false;b.textContent="Crear reporte"}).crearReporte(d,h)}</script>',
  ].join('')).setWidth(320).setHeight(230);
  SpreadsheetApp.getUi().showModalDialog(html, 'Reporte de PQRS');
}

/**
 * Llena la pestaña "Reporte" con las PQRS radicadas entre dos fechas (incluidas):
 * resumen por tipo y por estado, y la lista completa. La pestaña PQRS no se toca.
 * Recibe fechas "aaaa-mm-dd" desde el cuadro del menú.
 */
function crearReporte(desde, hasta) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(desde) || !/^\d{4}-\d{2}-\d{2}$/.test(hasta)) throw new Error('Fechas no válidas.');
  const inicio = Utilities.parseDate(desde + ' 00:00:00', ZONA, 'yyyy-MM-dd HH:mm:ss');
  const fin = Utilities.parseDate(hasta + ' 23:59:59', ZONA, 'yyyy-MM-dd HH:mm:ss');
  if (inicio > fin) throw new Error('La fecha inicial va antes de la final.');

  const hoja = hoja_(HOJA_PQRS);
  const filas = hoja.getLastRow() < 2 ? [] : hoja.getRange(2, 1, hoja.getLastRow() - 1, COLUMNAS.length).getValues()
    .filter((f) => f[COL['Fecha']] instanceof Date && f[COL['Fecha']] >= inicio && f[COL['Fecha']] <= fin)
    .sort((a, b) => a[COL['Fecha']] - b[COL['Fecha']]);

  const contar = (columna, valores) => valores.map((v) => [v, filas.filter((f) => f[COL[columna]] === v).length]);
  const dia = (fecha) => Utilities.formatDate(fecha, ZONA, 'dd/MM/yyyy');

  const libro = SpreadsheetApp.getActive();
  const reporte = libro.getSheetByName(HOJA_REPORTE) || libro.insertSheet(HOJA_REPORTE);
  reporte.clear();

  const bloques = [
    [['Reporte de PQRS del ' + dia(inicio) + ' al ' + dia(fin)]],
    [['Creado el ' + Utilities.formatDate(new Date(), ZONA, "dd/MM/yyyy 'a las' HH:mm")]],
    [['']],
    [['Total de solicitudes', filas.length]],
    [['']],
    [['Por tipo', 'Cantidad']].concat(contar('Tipo', TIPOS)),
    [['']],
    [['Por estado', 'Cantidad']].concat(contar('Estado', ESTADOS)),
    [['']],
  ];
  let fila = 1;
  const negrita = [];
  bloques.forEach((bloque, i) => {
    bloque.forEach((valores) => {
      reporte.getRange(fila, 1, 1, valores.length).setValues([valores]);
      fila++;
    });
    if (i === 0 || i === 3 || i === 5 || i === 7) negrita.push(fila - bloque.length);
  });
  negrita.forEach((n) => reporte.getRange(n, 1, 1, 2).setFontWeight('bold'));
  reporte.getRange(1, 1).setFontSize(14);
  reporte.getRange(2, 1).setFontColor('#686a60');

  reporte.getRange(fila, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#eef6f5');
  const inicioLista = fila + 1;
  if (filas.length) {
    // Los textos que empiezan con = + - @ se guardan como texto, igual que en la pestaña PQRS.
    const lista = filas.map((f) => f.map((v) => (typeof v === 'string' ? seguro_(v) : v)));
    reporte.getRange(inicioLista, 1, lista.length, COLUMNAS.length).setValues(lista);
    [COL['Fecha'], COL['Actualizado']].forEach((c) => {
      reporte.getRange(inicioLista, c + 1, lista.length, 1).setNumberFormat('dd/mm/yyyy hh:mm');
    });
  } else {
    reporte.getRange(inicioLista, 1).setValue('No hay PQRS radicadas en esas fechas.');
  }
  reporte.setColumnWidth(1, 170);
  libro.setActiveSheet(reporte);
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
  return filasEquipo_().map((f) => f.correo);
}

/** Quienes reciben el aviso de cada PQRS nueva: todo el equipo, salvo quien tenga "no" en la columna Avisos. */
function correosAvisos_() {
  return filasEquipo_().filter((f) => f.avisos !== 'no').map((f) => f.correo);
}

function filasEquipo_() {
  const hoja = hoja_(HOJA_EQUIPO);
  if (hoja.getLastRow() < 2) return [];
  return hoja.getRange(2, 1, hoja.getLastRow() - 1, 3).getValues()
    .map((f) => ({ correo: String(f[0]).trim().toLowerCase(), avisos: String(f[2]).trim().toLowerCase() }))
    .filter((f) => f.correo.indexOf('@') > 0);
}

function correo_(para, asunto, cuerpo) {
  try {
    const opciones = { name: NOMBRE_REMITENTE, replyTo: RESPONDER_A };
    // Sale desde contacto@ si ese alias está en Gmail → Configuración → "Enviar como"; si no, desde la cuenta del script.
    if (GmailApp.getAliases().indexOf(RESPONDER_A) >= 0) opciones.from = RESPONDER_A;
    GmailApp.sendEmail(para, asunto, cuerpo, opciones);
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
