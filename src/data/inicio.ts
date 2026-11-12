// Fotos de las tarjetas de Inicio. Poner el archivo en public/inicio/ y escribir aquí su ruta
// (por ejemplo "/inicio/internet.jpg") y el pie de foto. Con src vacío se ve un fondo de color.
export const fotosInicio = {
  internet: { src: "", pie: "Internet que acerca" },
  television: { src: "", pie: "Televisión para compartir" },
};

// "Así te conectas": los tres pasos de Inicio.
export const pasosInicio = [
  { titulo: "Escríbenos", texto: "Cuéntanos por WhatsApp o en la oficina qué servicio te interesa y en qué barrio o vereda vives." },
  { titulo: "Confirmamos cobertura", texto: "Revisamos si llegamos a tu casa y te contamos las opciones disponibles." },
  { titulo: "Agendamos la instalación", texto: "Acordamos contigo el día de la visita y dejamos el servicio funcionando." },
];

// Preguntas frecuentes de Inicio. Las que tengan respuesta vacía no se muestran:
// faltan los datos del canal (tiempos de instalación y medios de pago).
export const preguntasInicio = [
  { pregunta: "¿Cómo pido el servicio?", respuesta: "Escríbenos por WhatsApp o visítanos en la oficina. Con tu barrio o vereda te confirmamos si tenemos cobertura." },
  { pregunta: "¿Llegan a mi barrio o vereda?", respuesta: "Depende de la zona. Escríbenos con tu dirección y te respondemos si podemos instalar." },
  { pregunta: "¿Cuánto tarda la instalación?", respuesta: "" },
  { pregunta: "¿Cómo y dónde pago?", respuesta: "" },
  { pregunta: "¿Qué hago si se cae el servicio?", respuesta: "Llámanos o escríbenos por WhatsApp para revisarlo. Si no queda resuelto, puedes radicar una PQRS desde esta página." },
];
