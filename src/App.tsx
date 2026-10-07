import { FormEvent, ReactNode, useEffect, useState } from "react";
import Logo from "./components/Logo";
import { canal } from "./data/canal";
import { dias, parrilla } from "./data/parrilla";
import { programas } from "./data/programas";
import { listarPQRS, radicarPQRS, Solicitud } from "./services/pqrs";

type IconName = "play" | "menu" | "close" | "arrow" | "clock" | "signal" | "copy" | "lock" | "search" | "check";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    play: <path d="m8 5 11 7-11 7V5Z" />,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    arrow: <><path d="M5 12h14M14 7l5 5-5 5" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>,
    signal: <><path d="M5 16a10 10 0 0 1 14 0M8 13a6 6 0 0 1 8 0M11 10a2 2 0 0 1 2 0" /><path d="m4 4 16 16" /></>,
    copy: <><rect x="8" y="8" width="11" height="11" rx="1" /><path d="M16 8V5H5v11h3" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">{paths[name]}</svg>;
}

function Text({ as = "p", className = "", children }: { as?: "p" | "h1" | "h2" | "h3" | "span"; className?: string; children: ReactNode }) {
  const Tag = as;
  return <Tag className={className}>{children}</Tag>;
}

function AppLink({ href, className = "", children, onClick }: { href: string; className?: string; children: ReactNode; onClick?: () => void }) {
  const navigate = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("/")) {
      event.preventDefault();
      window.history.pushState({}, "", href);
      window.dispatchEvent(new PopStateEvent("popstate"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    onClick?.();
  };
  return <a href={href} className={className} onClick={navigate}>{children}</a>;
}

function Button({ children, variant = "primary", type = "button", onClick, className = "" }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost"; type?: "button" | "submit"; onClick?: () => void; className?: string }) {
  return <button type={type} onClick={onClick} className={`button button--${variant} ${className}`}>{children}</button>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <Text className="eyebrow">{children}</Text>;
}

function Header({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const items = [["Inicio", "/"], ["En vivo", "/en-vivo"], ["Programación", "/programacion"], ["Programas", "/programas"], ["PQRS", "/pqrs"]];
  return (
    <header className="site-header">
      <div className="container header-inner">
        <AppLink href="/" className="brand-link" onClick={() => setOpen(false)}><Logo /></AppLink>
        <nav className={`main-nav${open ? " is-open" : ""}`} aria-label="Navegación principal">
          {items.map(([label, href]) => <AppLink key={href} href={href} onClick={() => setOpen(false)} className={path === href ? "active" : ""}>{label}</AppLink>)}
          <AppLink href="/en-vivo" className="button button--primary mobile-live"><Icon name="play" /> Ver en vivo</AppLink>
        </nav>
        <AppLink href="/en-vivo" className="button button--primary desktop-live"><Icon name="play" /> Ver en vivo</AppLink>
        <Button variant="ghost" className="menu-button" onClick={() => setOpen(!open)}><Icon name={open ? "close" : "menu"} /><span className="sr-only">Menú</span></Button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer" data-theme="dark">
      <div className="container footer-grid">
        <div><Logo inverse /><Text>Televisión local hecha con y para la comunidad de El Retiro.</Text></div>
        <div><Text as="h3">Contacto</Text><Text>{canal.direccion}</Text><Text>{canal.telefono}</Text><Text>{canal.correo}</Text></div>
        <div><Text as="h3">Atención al ciudadano</Text><AppLink href="/pqrs">Radicar PQRS</AppLink><AppLink href="/programacion">Programación</AppLink><AppLink href="/politica-de-datos">Política de datos</AppLink></div>
        <div><Text as="h3">Síguenos</Text><a href="#facebook">Facebook</a><a href="#instagram">Instagram</a><a href="#youtube">YouTube</a></div>
      </div>
      <div className="container footer-bottom"><Text>© 2026 {canal.razonSocial} · NIT {canal.nit}</Text><AppLink href="/admin"><Icon name="lock" /> Ingreso del equipo</AppLink></div>
    </footer>
  );
}

function ProgramVisual({ color, compact = false }: { color: string; compact?: boolean }) {
  return <div className={`program-visual visual--${color}${compact ? " compact" : ""}`}><Logo compact /><span>Producción propia</span></div>;
}

function Home() {
  const [slide, setSlide] = useState(0);
  const current = programas[slide];
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setSlide((value) => (value + 1) % programas.length), 7000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <>
      <section className="hero" data-theme="dark">
        <div className="container hero-grid">
          <div><Eyebrow>Canal local · El Retiro, Antioquia</Eyebrow><Text as="h1" className="display">La señal de nuestro pueblo, en vivo</Text><Text className="lead">Información, cultura y conversación para reconocer lo que somos y mantenernos conectados.</Text><div className="button-row"><AppLink href="/en-vivo" className="button button--primary"><Icon name="play" /> Ver en vivo</AppLink><AppLink href="/programacion" className="button button--secondary">Programación</AppLink></div></div>
          <div><div className="video-shell"><span className="live-badge"><i /> En vivo</span><Icon name="signal" /><Text>Señal en directo</Text></div><div className="now-row"><span>Ahora · 7:00 p. m. – 8:00 p. m.</span><strong>Conecta Noticias</strong></div></div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <Eyebrow>Producción propia</Eyebrow><div className="section-heading"><Text as="h2">Nuestros programas</Text><span className="carousel-count">{slide + 1} / {programas.length}</span></div>
          <div className="carousel-stage">
            <Button variant="secondary" className="carousel-arrow carousel-arrow--previous" onClick={() => setSlide((slide - 1 + programas.length) % programas.length)}><span aria-hidden="true">←</span><span className="sr-only">Programa anterior</span></Button>
            <article className="featured-program"><ProgramVisual color={current.color} /><div className="featured-copy"><Eyebrow>{current.categoria}</Eyebrow><Text as="h3">{current.nombre}</Text><Text>{current.descripcion}</Text><Text className="schedule"><Icon name="clock" /> {current.horario}</Text><AppLink href="/programacion" className="text-link">Ver en la programación <Icon name="arrow" /></AppLink></div></article>
            <Button variant="secondary" className="carousel-arrow carousel-arrow--next" onClick={() => setSlide((slide + 1) % programas.length)}><span aria-hidden="true">→</span><span className="sr-only">Programa siguiente</span></Button>
          </div>
          <div className="progress-bars">{programas.map((p, index) => <button key={p.nombre} className={index === slide ? "active" : ""} onClick={() => setSlide(index)} aria-label={`Ver ${p.nombre}`} />)}</div>
        </div>
      </section>
      <section className="section section--soft"><div className="container"><div className="section-heading"><div><Eyebrow>Martes 18 de marzo</Eyebrow><Text as="h2">Programación de hoy</Text></div><AppLink href="/programacion" className="text-link">Ver programación completa <Icon name="arrow" /></AppLink></div><div className="schedule-grid">{parrilla.slice(0, 3).map((item) => <article className={`schedule-card${item.enVivo ? " is-live" : ""}`} key={item.nombre}>{item.enVivo && <span className="live-badge"><i /> En vivo</span>}<Text className="time">{item.hora}</Text><Text as="h3">{item.nombre}</Text><Text>{item.descripcion}</Text></article>)}</div></div></section>
      <section className="cta"><div className="container cta-inner"><div><Eyebrow>Atención al ciudadano</Eyebrow><Text as="h2">¿Tienes una petición, queja o sugerencia?</Text><Text>Cuéntanos cómo podemos ayudarte o mejorar nuestro servicio a la comunidad.</Text></div><AppLink href="/pqrs" className="button button--primary">Radicar PQRS <Icon name="arrow" /></AppLink></div></section>
    </>
  );
}

function Live() {
  return <section className="section live-page" data-theme="dark"><div className="container"><div className="section-heading"><div><Eyebrow>Señal digital</Eyebrow><Text as="h1">En vivo</Text></div><span className="status"><i /> Transmitiendo ahora</span></div><div className="video-shell video-shell--large"><span className="live-badge"><i /> En vivo</span><Icon name="play" /><Text>Conecta Telecomunicaciones</Text></div><div className="live-info"><article><Eyebrow>Ahora · 7:00 p. m.</Eyebrow><Text as="h3">Conecta Noticias</Text><Text>La actualidad de El Retiro y el Oriente antioqueño.</Text></article><article><Eyebrow>A continuación · 8:00 p. m.</Eyebrow><Text as="h3">Voces del Retiro</Text><Text>Conversaciones con los protagonistas de nuestra comunidad.</Text></article></div><AppLink href="/programacion" className="button button--secondary">Ver programación de la semana</AppLink></div></section>;
}

function Programming() {
  const [day, setDay] = useState("Martes");
  return <><PageIntro eyebrow="Parrilla semanal" title="Programación">Horarios en hora de Colombia. El programa que está al aire se marca con la etiqueta «En vivo».</PageIntro><section className="section"><div className="container"><div className="tabs" role="tablist">{dias.map((item) => <button role="tab" aria-selected={item === day} className={item === day ? "active" : ""} onClick={() => setDay(item)} key={item}>{item}</button>)}</div><div className="schedule-grid">{parrilla.map((item) => <article className={`schedule-card${item.enVivo ? " is-live" : ""}`} key={item.nombre}>{item.enVivo && <span className="live-badge"><i /> En vivo</span>}<Text className="time">{item.hora}</Text><Text as="h3">{item.nombre}</Text><Text>{item.descripcion}</Text></article>)}</div></div></section></>;
}

function Programs() {
  return <><PageIntro eyebrow="Producción propia" title="Programas">Historias, información y conversaciones hechas desde El Retiro.</PageIntro><section className="section"><div className="container program-grid">{programas.map((program) => <article className="program-card" key={program.nombre}><ProgramVisual color={program.color} compact /><div><Eyebrow>{program.categoria}</Eyebrow><Text as="h2">{program.nombre}</Text><Text>{program.descripcion}</Text><Text className="schedule"><Icon name="clock" /> {program.horario}</Text></div></article>)}</div></section></>;
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <section className="page-intro"><div className="container narrow"><Eyebrow>{eyebrow}</Eyebrow><Text as="h1">{title}</Text><Text className="lead">{children}</Text></div></section>;
}

function Field({ label, name, type = "text", required = false, help }: { label: string; name: string; type?: string; required?: boolean; help?: string }) {
  return <label className="field"><span>{label}{required && " *"}</span><input name={name} type={type} required={required} />{help && <small>{help}</small>}</label>;
}

function Pqrs() {
  const [sent, setSent] = useState("");
  const [type, setType] = useState("Petición");
  const [description, setDescription] = useState("");
  const submit = async (event: FormEvent) => { event.preventDefault(); setSent(await radicarPQRS()); };
  if (sent) return <><PageIntro eyebrow="Atención al ciudadano" title="Solicitud radicada">Guarda este número de radicado para cualquier comunicación con el canal.</PageIntro><section className="section"><div className="container confirmation"><span className="success-icon"><Icon name="check" /></span><Text as="h2">Recibimos tu solicitud</Text><div className="ticket">{sent}<Button variant="ghost" onClick={() => navigator.clipboard?.writeText(sent)}><Icon name="copy" /> Copiar</Button></div><Button onClick={() => setSent("")}>Radicar otra solicitud</Button></div></section></>;
  return <><PageIntro eyebrow="Atención al ciudadano" title="Peticiones, quejas, reclamos y sugerencias">Radica tu solicitud y recibe un número de radicado.</PageIntro><section className="section"><div className="container form-layout"><form className="form-card" onSubmit={submit}><Text as="h2">Radicar solicitud</Text><fieldset><legend>Tipo de solicitud</legend><div className="chips">{["Petición", "Queja", "Reclamo", "Sugerencia", "Felicitación"].map((item) => <button type="button" className={type === item ? "active" : ""} onClick={() => setType(item)} key={item}>{item}</button>)}</div></fieldset><div className="field-grid"><Field label="Nombre completo" name="nombre" required /><Field label="Correo electrónico" name="correo" type="email" required help="Aquí te enviaremos la respuesta." /><Field label="Teléfono (opcional)" name="telefono" /><Field label="Barrio o vereda" name="ubicacion" required /></div><Field label="Asunto" name="asunto" required /><label className="field"><span>Descripción *</span><textarea required maxLength={4800} value={description} onChange={(e) => setDescription(e.target.value)} /><small>{description.length} de 4.800 caracteres</small></label><label className="checkbox"><input type="checkbox" required /><span>Autorizo el tratamiento de mis datos personales según la <AppLink href="/politica-de-datos">política de tratamiento de datos</AppLink>.</span></label><Button type="submit">Enviar solicitud</Button></form><aside className="help-column"><article><Text as="h3">¿Qué tipo de solicitud elegir?</Text><Text><strong>Petición:</strong> solicita información o una gestión.</Text><Text><strong>Queja:</strong> expresa inconformidad con la atención.</Text><Text><strong>Reclamo:</strong> pide corregir una situación.</Text><Text><strong>Sugerencia:</strong> propone una mejora.</Text></article><article><Text as="h3">Otros canales de atención</Text><Text>{canal.direccion}</Text><Text>{canal.telefono}</Text><Text>{canal.correo}</Text></article></aside></div></section></>;
}

function Admin() {
  const [logged, setLogged] = useState(false);
  const [items, setItems] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const load = async () => { setLoading(true); setItems(await listarPQRS()); setLoading(false); };
  useEffect(() => { if (logged) void load(); }, [logged]);
  if (!logged) return <section className="admin-login"><div className="login-card"><span className="success-icon"><Icon name="lock" /></span><Eyebrow>Acceso restringido</Eyebrow><Text as="h1">Ingreso del equipo</Text><Text>Panel de gestión de PQRS. Solo para personal autorizado del canal.</Text><Button onClick={() => setLogged(true)}>Ingresar con Google</Button></div></section>;
  return <><PageIntro eyebrow="Panel" title="Gestión de PQRS">Revisa y gestiona las solicitudes de la ciudadanía.</PageIntro><section className="section"><div className="container"><div className="admin-actions"><div className="summary"><article><span>Recibidas</span><strong>24</strong></article><article><span>Abiertas</span><strong>8</strong></article><article><span>Respondidas</span><strong>16</strong></article></div><div><Button variant="secondary" onClick={load}>Actualizar</Button> <Button variant="ghost" onClick={() => setLogged(false)}>Cerrar sesión</Button></div></div><label className="search"><Icon name="search" /><input placeholder="Buscar por radicado, asunto o ciudadano" /></label>{loading ? <Text>Cargando solicitudes…</Text> : <div className="table-wrap"><table><thead><tr><th>Radicado</th><th>Tipo</th><th>Asunto y ciudadano</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{items.map((item) => <tr key={item.radicado}><td><code>{item.radicado}</code></td><td>{item.tipo}</td><td><strong>{item.asunto}</strong><small>{item.nombre} · {item.correo}</small></td><td>{item.fecha}</td><td><span className={`state state--${item.estado.replace(" ", "-").toLowerCase()}`}>{item.estado}</span></td></tr>)}</tbody></table></div>}</div></section></>;
}

function Policy() {
  return <><PageIntro eyebrow="Documento legal" title="Política de tratamiento de datos">Información sobre el uso responsable de los datos personales.</PageIntro><article className="section legal container"><Text as="h2">1. Responsable del tratamiento</Text><Text>{canal.razonSocial}, identificada con NIT {canal.nit}, con domicilio en [Dirección] y correo [Correo], es responsable del tratamiento de datos personales.</Text><Text as="h2">2. Finalidades</Text><Text>Los datos se utilizan para gestionar solicitudes ciudadanas, responder comunicaciones y cumplir las obligaciones legales aplicables.</Text><Text as="h2">3. Derechos de los titulares</Text><Text>Conocer, actualizar, rectificar y solicitar la supresión de sus datos; presentar consultas o reclamos y revocar la autorización cuando proceda.</Text><Text as="h2">4. Consultas y reclamos</Text><Text>Las solicitudes relacionadas con datos personales se reciben en [Correo] o en [Dirección], conforme a la Ley 1581 de 2012.</Text></article></>;
}

function NotFound() {
  return <section className="not-found"><Icon name="signal" /><Eyebrow>Error 404</Eyebrow><Text as="h1">Esta página no tiene señal</Text><Text>Puede que el enlace esté mal escrito o que la página ya no exista.</Text><div className="button-row"><AppLink href="/" className="button button--primary">Ir al inicio</AppLink><AppLink href="/programacion" className="button button--secondary">Ver programación</AppLink></div></section>;
}

export default function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => { const update = () => setPath(window.location.pathname); window.addEventListener("popstate", update); return () => window.removeEventListener("popstate", update); }, []);
  const pages: Record<string, ReactNode> = { "/": <Home />, "/en-vivo": <Live />, "/programacion": <Programming />, "/programas": <Programs />, "/pqrs": <Pqrs />, "/admin": <Admin />, "/politica-de-datos": <Policy /> };
  return <><Header path={path} /><main>{pages[path] ?? <NotFound />}</main><Footer /></>;
}
