export type Programa = {
  nombre: string;
  categoria: string;
  descripcion: string;
  horario: string;
  color: string;
};

export const programas: Programa[] = [
  {
    nombre: "Conecta Noticias",
    categoria: "Noticias · Lunes a viernes",
    descripcion: "La actualidad de El Retiro contada con contexto, cercanía y las voces de nuestra comunidad.",
    horario: "7:00 p. m.",
    color: "teal",
  },
  {
    nombre: "Nuestro Campo",
    categoria: "Región · Martes",
    descripcion: "Historias, saberes y proyectos de quienes cultivan el presente y el futuro del Oriente antioqueño.",
    horario: "6:30 p. m.",
    color: "cyan",
  },
  {
    nombre: "Voces del Retiro",
    categoria: "Conversación · Miércoles",
    descripcion: "Personajes y conversaciones que nos ayudan a reconocer la memoria viva del municipio.",
    horario: "8:00 p. m.",
    color: "orange",
  },
  {
    nombre: "Agenda Cultural",
    categoria: "Cultura · Jueves",
    descripcion: "Una guía para encontrarnos alrededor del arte, la música y las expresiones locales.",
    horario: "6:00 p. m.",
    color: "pink",
  },
  {
    nombre: "Cancha Local",
    categoria: "Deportes · Viernes",
    descripcion: "Resultados, protagonistas y procesos deportivos que mueven a nuestra comunidad.",
    horario: "7:30 p. m.",
    color: "green",
  },
];
