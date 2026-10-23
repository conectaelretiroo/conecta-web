export type Canal = {
  numero: number;
  nombre: string;
  categoria: string;
  /** Ruta del logo dentro de public/, por ejemplo "/canales/caracol.png". Sin logo se muestran las iniciales. */
  logo?: string;
  /** El logo es claro (blanco) y necesita fondo oscuro. */
  logoOscuro?: boolean;
};

// Parrilla de Conecta Digital (PDF "PARRILLA TV CONECTA 2026", 72 canales, recibido 2026-10-23).
// Las categorías no venían en el PDF: las asignó Claude y se pueden cambiar aquí.
// Logos en public/canales/, tomados del repositorio público github.com/tv-logo/tv-logos (2026-10-23)
// y los demás los envió Tomás el mismo día.
// Los canales sin logo muestran sus iniciales; para agregar uno, pon el PNG en public/canales/ y su ruta en "logo".
export const canales: Canal[] = [
  { numero: 1, nombre: "Canal Institucional", categoria: "Nacional", logo: "/canales/1-canal-institucional.png" },
  { numero: 2, nombre: "Win Sports", categoria: "Deportes", logo: "/canales/2-win-sports.png" },
  { numero: 3, nombre: "Señal Colombia", categoria: "Nacional", logo: "/canales/3-senal-colombia.png" },
  { numero: 4, nombre: "Canal 1", categoria: "Nacional", logo: "/canales/4-canal-1.png" },
  { numero: 5, nombre: "Teleantioquia", categoria: "Regional", logo: "/canales/5-teleantioquia.png" },
  { numero: 6, nombre: "Telemedellín", categoria: "Regional", logo: "/canales/6-telemedellin.png" },
  { numero: 7, nombre: "Caracol", categoria: "Nacional", logo: "/canales/7-caracol.png", logoOscuro: true },
  { numero: 8, nombre: "Conecta", categoria: "Local", logo: "/canales/8-conecta.png" },
  { numero: 9, nombre: "RCN", categoria: "Nacional", logo: "/canales/9-rcn.png" },
  { numero: 10, nombre: "Disney", categoria: "Infantil", logo: "/canales/10-disney.png" },
  { numero: 11, nombre: "Disney Junior", categoria: "Infantil", logo: "/canales/11-disney-junior.png" },
  { numero: 12, nombre: "Baby TV", categoria: "Infantil", logo: "/canales/12-baby-tv.png" },
  { numero: 13, nombre: "Canal Infantil", categoria: "Infantil", logo: "/canales/13-canal-infantil.png" },
  { numero: 14, nombre: "Discovery Kids", categoria: "Infantil", logo: "/canales/14-discovery-kids.png" },
  { numero: 15, nombre: "Cartoon Network", categoria: "Infantil", logo: "/canales/15-cartoon-network.png" },
  { numero: 16, nombre: "ESPN", categoria: "Deportes", logo: "/canales/16-espn.png" },
  { numero: 17, nombre: "ESPN 2", categoria: "Deportes", logo: "/canales/17-espn-2.png" },
  { numero: 18, nombre: "ESPN 3", categoria: "Deportes", logo: "/canales/18-espn-3.png" },
  { numero: 19, nombre: "ESPN 4", categoria: "Deportes", logo: "/canales/19-espn-4.png" },
  { numero: 20, nombre: "ESPN 5", categoria: "Deportes", logo: "/canales/20-espn-5.png" },
  { numero: 21, nombre: "ESPN 6", categoria: "Deportes", logo: "/canales/21-espn-6.png" },
  { numero: 22, nombre: "ESPN 7", categoria: "Deportes", logo: "/canales/22-espn-7.png" },
  { numero: 23, nombre: "Discovery ID", categoria: "Documentales y estilo de vida", logo: "/canales/23-discovery-id.png" },
  { numero: 24, nombre: "Discovery Turbo", categoria: "Documentales y estilo de vida", logo: "/canales/24-discovery-turbo.png" },
  { numero: 25, nombre: "Discovery Channel", categoria: "Documentales y estilo de vida", logo: "/canales/25-discovery-channel.png", logoOscuro: true },
  { numero: 26, nombre: "Discovery H&H", categoria: "Documentales y estilo de vida", logo: "/canales/26-discovery-h-h.png" },
  { numero: 27, nombre: "Discovery Food", categoria: "Documentales y estilo de vida", logo: "/canales/27-discovery-food.png", logoOscuro: true },
  { numero: 28, nombre: "Nat Geo Food", categoria: "Documentales y estilo de vida", logo: "/canales/28-nat-geo-food.png" },
  { numero: 29, nombre: "TLC", categoria: "Documentales y estilo de vida", logo: "/canales/29-tlc.png" },
  { numero: 30, nombre: "Animal Planet", categoria: "Documentales y estilo de vida", logo: "/canales/30-animal-planet.png" },
  { numero: 31, nombre: "Star Channel", categoria: "Películas y series", logo: "/canales/31-star-channel.png", logoOscuro: true },
  { numero: 32, nombre: "TNT Novelas", categoria: "Películas y series", logo: "/canales/32-tnt-novelas.png" },
  { numero: 33, nombre: "TCM", categoria: "Películas y series", logo: "/canales/33-tcm.png" },
  { numero: 34, nombre: "FX Colombia", categoria: "Películas y series", logo: "/canales/34-fx-colombia.png", logoOscuro: true },
  { numero: 35, nombre: "TNT", categoria: "Películas y series", logo: "/canales/35-tnt.png", logoOscuro: true },
  { numero: 36, nombre: "Space", categoria: "Películas y series", logo: "/canales/36-space.png" },
  { numero: 37, nombre: "DHE", categoria: "Películas y series", logo: "/canales/37-dhe.png" },
  { numero: 38, nombre: "Cine Premium HD", categoria: "Películas y series", logo: "/canales/38-cine-premium.png" },
  { numero: 39, nombre: "Cine Hispano HD", categoria: "Películas y series", logo: "/canales/39-cine-hispano.png" },
  { numero: 40, nombre: "TNT Series", categoria: "Películas y series", logo: "/canales/40-tnt-series.png" },
  { numero: 41, nombre: "Cine Familiar HD", categoria: "Películas y series", logo: "/canales/41-cine-familiar.png" },
  { numero: 42, nombre: "NTN24", categoria: "Noticias", logo: "/canales/42-ntn24.png" },
  { numero: 43, nombre: "Cable Noticias", categoria: "Noticias", logo: "/canales/43-cable-noticias.png" },
  { numero: 44, nombre: "DW", categoria: "Noticias", logo: "/canales/44-dw.png" },
  { numero: 45, nombre: "RT", categoria: "Noticias", logo: "/canales/45-rt.png" },
  { numero: 46, nombre: "Telesur", categoria: "Noticias", logo: "/canales/46-telesur.png" },
  { numero: 47, nombre: "CNN", categoria: "Noticias", logo: "/canales/47-cnn.png" },
  { numero: 48, nombre: "Canal Trece", categoria: "Regional", logo: "/canales/48-canal-trece.png", logoOscuro: true },
  { numero: 49, nombre: "Canal TRO", categoria: "Regional", logo: "/canales/49-canal-tro.png" },
  { numero: 50, nombre: "Telepacífico", categoria: "Regional", logo: "/canales/50-telepacifico.png" },
  { numero: 51, nombre: "Telecaribe", categoria: "Regional" },
  { numero: 52, nombre: "Telecafé", categoria: "Regional" },
  { numero: 53, nombre: "Teleislas", categoria: "Regional", logo: "/canales/53-teleislas.png" },
  { numero: 54, nombre: "TV Agro HD", categoria: "Variedades", logo: "/canales/54-tv-agro.png", logoOscuro: true },
  { numero: 55, nombre: "City TV", categoria: "Variedades", logo: "/canales/55-city-tv.png" },
  { numero: 56, nombre: "Zoom", categoria: "Variedades", logo: "/canales/56-zoom.png" },
  { numero: 57, nombre: "Hogar TV", categoria: "Variedades" },
  { numero: 58, nombre: "Pasiones", categoria: "Variedades", logo: "/canales/58-pasiones.png", logoOscuro: true },
  { numero: 59, nombre: "V+ (VPlus)", categoria: "Variedades" },
  { numero: 60, nombre: "EWTN", categoria: "Religiosos", logo: "/canales/60-ewtn.png", logoOscuro: true },
  { numero: 61, nombre: "Enlace", categoria: "Religiosos", logo: "/canales/61-enlace.png" },
  { numero: 62, nombre: "Teleamiga", categoria: "Religiosos", logo: "/canales/62-teleamiga.png" },
  { numero: 63, nombre: "Televid", categoria: "Religiosos", logo: "/canales/63-televid.png", logoOscuro: true },
  { numero: 64, nombre: "Cristovisión", categoria: "Religiosos", logo: "/canales/64-cristovision.png" },
  { numero: 65, nombre: "HTV", categoria: "Música", logo: "/canales/65-htv.png" },
  { numero: 66, nombre: "La Kalle", categoria: "Música", logo: "/canales/66-la-kalle.png" },
  { numero: 67, nombre: "Rumba TV", categoria: "Música", logo: "/canales/67-rumba-tv.png", logoOscuro: true },
  { numero: 68, nombre: "Mi Música Popular", categoria: "Música" },
  { numero: 69, nombre: "Mi Música Salsa", categoria: "Música" },
  { numero: 70, nombre: "Mi Música Regional", categoria: "Música" },
  { numero: 71, nombre: "Mi Música Reggaetón", categoria: "Música" },
  { numero: 72, nombre: "Telenostalgia", categoria: "Música", logo: "/canales/72-telenostalgia.png", logoOscuro: true },
];

/** Orden de las pestañas de la página Canales. */
export const categorias = ["Nacional", "Regional", "Local", "Deportes", "Infantil", "Documentales y estilo de vida", "Películas y series", "Noticias", "Variedades", "Religiosos", "Música"];
