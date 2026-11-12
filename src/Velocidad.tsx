// Página "Prueba tu velocidad": mide bajada, subida y latencia con el motor abierto de Cloudflare
// (@cloudflare/speedtest), el mismo de speed.cloudflare.com. La medición sale del aparato del visitante
// hacia la red de Cloudflare; no pasa por ningún servidor de Conecta. Cloudflare recibe el resultado
// para sus estadísticas agregadas de calidad de internet.
import { useEffect, useRef, useState } from "react";

type Estado = "lista" | "midiendo" | "terminada" | "error";
type Fase = "latency" | "download" | "upload" | "";
type Medidas = { bajada?: number; subida?: number; latencia?: number; variacion?: number | null };

// Mismo recorrido que la prueba de Cloudflare, sin el archivo más grande (250 MB) para no gastar datos de más.
// El motor solo llega a los archivos grandes si la conexión es rápida: en una conexión lenta se detiene antes.
const MEDICIONES = [
  { type: "latency", numPackets: 1 },
  { type: "download", bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: "latency", numPackets: 20 },
  { type: "download", bytes: 1e5, count: 9 },
  { type: "download", bytes: 1e6, count: 8 },
  { type: "upload", bytes: 1e5, count: 8 },
  { type: "upload", bytes: 1e6, count: 6 },
  { type: "download", bytes: 1e7, count: 6 },
  { type: "upload", bytes: 1e7, count: 4 },
  { type: "download", bytes: 2.5e7, count: 4 },
  { type: "upload", bytes: 2.5e7, count: 4 },
  { type: "download", bytes: 1e8, count: 3 },
  { type: "upload", bytes: 5e7, count: 3 },
];

const mbps = (bps?: number) => (!bps ? "—" : (bps / 1e6).toLocaleString("es-CO", { maximumFractionDigits: bps >= 1e8 ? 0 : 1 }));
const ms = (valor?: number | null) => (!valor ? "—" : Math.round(valor).toLocaleString("es-CO"));
const NOMBRE_FASE: Record<Fase, string> = { latency: "Midiendo la respuesta de la conexión…", download: "Midiendo la bajada…", upload: "Midiendo la subida…", "": "Preparando la prueba…" };

export function Velocidad() {
  const [estado, setEstado] = useState<Estado>("lista");
  const [fase, setFase] = useState<Fase>("");
  const [medidas, setMedidas] = useState<Medidas>({});
  const motor = useRef<{ pause: () => void } | null>(null);

  // Si la persona sale de la página a mitad de la prueba, la medición se detiene.
  useEffect(() => () => motor.current?.pause(), []);

  const iniciar = async () => {
    setEstado("midiendo"); setFase(""); setMedidas({});
    try {
      const { default: SpeedTest } = await import("@cloudflare/speedtest");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const prueba = new SpeedTest({ autoStart: false, measurements: MEDICIONES as any });
      motor.current = prueba;
      const leer = () => {
        const r = prueba.results;
        setMedidas({ bajada: r.getDownloadBandwidth(), subida: r.getUploadBandwidth(), latencia: r.getUnloadedLatency(), variacion: r.getUnloadedJitter() });
      };
      let errores = 0;
      prueba.onResultsChange = ({ type }) => { if (type === "latency" || type === "download" || type === "upload") setFase(type); leer(); };
      prueba.onFinish = () => { leer(); const sirve = !!prueba.results.getDownloadBandwidth(); if (!sirve) setMedidas({}); setEstado(sirve ? "terminada" : "error"); };
      prueba.onError = () => { errores += 1; if (errores >= 5) { prueba.pause(); setMedidas({}); setEstado("error"); } };
      prueba.play();
    } catch {
      setEstado("error");
    }
  };

  const midiendo = estado === "midiendo";
  return (
    <section className="section speed-page">
      <div className="container speed">
        <h1>Prueba tu velocidad</h1>
        <p className="speed__lead">Mide en unos segundos la velocidad de internet que le está llegando a este dispositivo.</p>
        <div className="speed__panel" aria-live="polite" aria-busy={midiendo}>
          <div className="speed__main">
            <span className="speed__label">Bajada</span>
            <p className="speed__number"><strong>{medidas.bajada ? mbps(medidas.bajada) : "0"}</strong> <span>Mbps</span></p>
            <p className={`speed__status${midiendo ? " is-running" : ""}`}>
              {estado === "lista" && "Presiona el botón para empezar."}
              {midiendo && NOMBRE_FASE[fase]}
              {estado === "terminada" && "Prueba terminada."}
              {estado === "error" && "No pudimos completar la prueba. Revisa tu conexión e inténtalo de nuevo."}
            </p>
            <button type="button" className="button button--primary" onClick={iniciar} disabled={midiendo}>{estado === "lista" ? "Iniciar prueba" : midiendo ? "Midiendo…" : "Repetir prueba"}</button>
          </div>
          <dl className="speed__datos">
            <div><dt>Subida</dt><dd><strong>{mbps(medidas.subida)}</strong> Mbps</dd></div>
            <div><dt>Latencia</dt><dd><strong>{ms(medidas.latencia)}</strong> ms</dd></div>
            <div><dt>Variación</dt><dd><strong>{ms(medidas.variacion)}</strong> ms</dd></div>
          </dl>
        </div>
        <div className="speed__notas">
          <div><h2>Para un resultado real</h2><ul><li>Conecta el equipo por cable al módem o acércate al router.</li><li>Cierra descargas, videos y juegos en este y en otros aparatos de la casa.</li><li>Con wifi, la velocidad suele ser menor que la del plan: depende de la distancia y de las paredes.</li></ul></div>
          <div><h2>Qué significa cada dato</h2><ul><li><strong>Bajada:</strong> qué tan rápido recibes (ver videos, abrir páginas).</li><li><strong>Subida:</strong> qué tan rápido envías (videollamadas, subir fotos).</li><li><strong>Latencia:</strong> cuánto tarda en responder la conexión; entre menos, mejor.</li></ul></div>
        </div>
        <p className="speed__legal">La prueba usa parte de tu plan de datos si estás en datos móviles. La medición se hace contra la red de Cloudflare, que recibe el resultado para sus estadísticas de calidad de internet.</p>
      </div>
    </section>
  );
}
