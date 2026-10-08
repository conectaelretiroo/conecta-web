export type Programa = {
  nombre: string;
  categoria: string;
  descripcion: string;
  horario: string;
  color: string;
};

// Programas propios del canal (2026-10-08). Faltan los programas externos.
export const programas: Programa[] = [
  {
    nombre: "El Rey de los Caminos",
    categoria: "Producción propia · Domingo",
    descripcion: "Repetición el miércoles a las 4:00 p. m.",
    horario: "Domingo 1:30 p. m.",
    color: "teal",
  },
  {
    nombre: "Viernes de la Cultura",
    categoria: "Producción propia · Viernes",
    descripcion: "Repetición el domingo a las 8:30 p. m.",
    horario: "Viernes 7:00 p. m.",
    color: "pink",
  },
  {
    nombre: "Testigos en la Fe",
    categoria: "Producción propia · Miércoles",
    descripcion: "Repetición el domingo a las 5:30 p. m.",
    horario: "Miércoles 2:30 p. m.",
    color: "orange",
  },
  {
    nombre: "Un Café para el Alma",
    categoria: "Producción propia · Sábado",
    descripcion: "Repetición el lunes a las 4:30 p. m.",
    horario: "Sábado 4:00 p. m.",
    color: "cyan",
  },
  {
    nombre: "Raíces Sonoras",
    categoria: "Producción propia · Jueves",
    descripcion: "Repetición el domingo a las 4:00 p. m.",
    horario: "Jueves 5:00 p. m.",
    color: "green",
  },
];
