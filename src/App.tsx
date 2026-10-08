import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import Logo from "./components/Logo";
import { canal } from "./data/canal";
import { diaDeHoy, dias, fechaDeHoy, parrillaSemanal, proximaEmision } from "./data/parrilla";
import { programas } from "./data/programas";
import { actualizarPQRS, ErrorPQRS, Estado, estados, EventoHistorial, listarPQRS, modoDemo, obtenerPQRS, radicarPQRS, Solicitud } from "./services/pqrs";
import { cerrarSesion, guardarSesion, ingresoDemo, mostrarBotonGoogle, Sesion, sesionGuardada } from "./services/sesion";

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

function Button({ children, variant = "primary", type = "button", onClick, className = "", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost"; type?: "button" | "submit"; onClick?: () => void; className?: string; disabled?: boolean }) {
  return <button type={type} onClick={onClick} disabled={disabled} className={`button button--${variant} ${className}`}>{children}</button>;
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
  const hoy = parrillaSemanal[diaDeHoy()];
  const proxima = proximaEmision();
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
          <div><div className="video-shell"><span className="live-badge"><i /> En vivo</span><Icon name="signal" /><Text>Señal en directo</Text></div>{proxima && <div className="now-row"><span>Próximo programa · {proxima.dia} {proxima.hora}</span><strong>{proxima.nombre}</strong></div>}</div>
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
      <section className="section section--soft"><div className="container"><div className="section-heading"><div><Eyebrow>{fechaDeHoy()}</Eyebrow><Text as="h2">Programación de hoy</Text></div><AppLink href="/programacion" className="text-link">Ver programación completa <Icon name="arrow" /></AppLink></div>{hoy.length ? <div className="schedule-grid">{hoy.slice(0, 3).map((item) => <article className={`schedule-card${item.enVivo ? " is-live" : ""}`} key={item.nombre}>{item.enVivo && <span className="live-badge"><i /> En vivo</span>}<Text className="time">{item.hora}</Text><Text as="h3">{item.nombre}</Text><Text>{item.descripcion}</Text></article>)}</div> : <Text>Hoy no hay programas propios al aire. Consulta la programación de la semana.</Text>}</div></section>
      <section className="cta"><div className="container cta-inner"><div><Eyebrow>Atención al ciudadano</Eyebrow><Text as="h2">¿Tienes una petición, queja o sugerencia?</Text><Text>Cuéntanos cómo podemos ayudarte o mejorar nuestro servicio a la comunidad.</Text></div><AppLink href="/pqrs" className="button button--primary">Radicar PQRS <Icon name="arrow" /></AppLink></div></section>
    </>
  );
}

function Live() {
  const proxima = proximaEmision();
  return <section className="section live-page" data-theme="dark"><div className="container"><div className="section-heading"><div><Eyebrow>Señal digital</Eyebrow><Text as="h1">En vivo</Text></div><span className="status"><i /> Transmitiendo ahora</span></div><div className="video-shell video-shell--large"><span className="live-badge"><i /> En vivo</span><Icon name="play" /><Text>Conecta Telecomunicaciones</Text></div>{proxima && <div className="live-info"><article><Eyebrow>Próximo programa · {proxima.dia} {proxima.hora}</Eyebrow><Text as="h3">{proxima.nombre}</Text><Text>{proxima.descripcion}</Text></article></div>}<AppLink href="/programacion" className="button button--secondary">Ver programación de la semana</AppLink></div></section>;
}

function Programming() {
  const [day, setDay] = useState(diaDeHoy);
  const emisiones = parrillaSemanal[day];
  return <><PageIntro eyebrow="Parrilla semanal" title="Programación">Horarios en hora de Colombia de los programas propios del canal.</PageIntro><section className="section"><div className="container"><div className="tabs" role="tablist">{dias.map((item) => <button role="tab" aria-selected={item === day} className={item === day ? "active" : ""} onClick={() => setDay(item)} key={item}>{item}</button>)}</div>{emisiones.length ? <div className="schedule-grid">{emisiones.map((item) => <article className={`schedule-card${item.enVivo ? " is-live" : ""}`} key={item.nombre}>{item.enVivo && <span className="live-badge"><i /> En vivo</span>}<Text className="time">{item.hora}</Text><Text as="h3">{item.nombre}</Text><Text>{item.descripcion}</Text></article>)}</div> : <Text>No hay programas propios este día.</Text>}</div></section></>;
}

function Programs() {
  return <><PageIntro eyebrow="Producción propia" title="Programas">Historias, información y conversaciones hechas desde El Retiro.</PageIntro><section className="section"><div className="container program-grid">{programas.map((program) => <article className="program-card" key={program.nombre}><ProgramVisual color={program.color} compact /><div><Eyebrow>{program.categoria}</Eyebrow><Text as="h2">{program.nombre}</Text><Text>{program.descripcion}</Text><Text className="schedule"><Icon name="clock" /> {program.horario}</Text></div></article>)}</div></section></>;
}

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <section className="page-intro"><div className="container narrow"><Eyebrow>{eyebrow}</Eyebrow><Text as="h1">{title}</Text><Text className="lead">{children}</Text></div></section>;
}

function Field({ label, name, type = "text", required = false, help, maxLength }: { label: string; name: string; type?: string; required?: boolean; help?: string; maxLength?: number }) {
  return <label className="field"><span>{label}{required && " *"}</span><input name={name} type={type} required={required} maxLength={maxLength} />{help && <small>{help}</small>}</label>;
}

function Pqrs() {
  const [sent, setSent] = useState("");
  const [type, setType] = useState("Petición");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = (name: string) => String(data.get(name) ?? "").trim();
    setSending(true);
    setError("");
    try {
      const radicado = await radicarPQRS({ tipo: type, nombre: value("nombre"), correo: value("correo"), telefono: value("telefono"), ubicacion: value("ubicacion"), asunto: value("asunto"), descripcion: description.trim(), autorizacion: data.get("autorizacion") === "on", sitio: value("sitio") });
      setDescription("");
      setType("Petición");
      setSent(radicado);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos enviar la solicitud. Intenta de nuevo.");
    } finally {
      setSending(false);
    }
  };
  if (sent) return <><PageIntro eyebrow="Atención al ciudadano" title="Solicitud radicada">Guarda este número de radicado para cualquier comunicación con el canal.</PageIntro><section className="section"><div className="container confirmation"><span className="success-icon"><Icon name="check" /></span><Text as="h2">Recibimos tu solicitud</Text><div className="ticket">{sent}<Button variant="ghost" onClick={() => navigator.clipboard?.writeText(sent)}><Icon name="copy" /> Copiar</Button></div><Text>Te enviamos una confirmación a tu correo y por ese medio recibirás la respuesta.</Text><Button onClick={() => setSent("")}>Radicar otra solicitud</Button></div></section></>;
  return <><PageIntro eyebrow="Atención al ciudadano" title="Peticiones, quejas, reclamos y sugerencias">Radica tu solicitud y recibe un número de radicado.</PageIntro><section className="section"><div className="container form-layout"><form className="form-card" onSubmit={submit}><Text as="h2">Radicar solicitud</Text>{modoDemo && <p className="form-notice">Formulario en modo de prueba: las solicitudes todavía no se guardan.</p>}<fieldset><legend>Tipo de solicitud</legend><div className="chips">{["Petición", "Queja", "Reclamo", "Sugerencia", "Felicitación"].map((item) => <button type="button" aria-pressed={type === item} className={type === item ? "active" : ""} onClick={() => setType(item)} key={item}>{item}</button>)}</div></fieldset><div className="field-grid"><Field label="Nombre completo" name="nombre" required maxLength={120} /><Field label="Correo electrónico" name="correo" type="email" required maxLength={254} help="Aquí te enviaremos la respuesta." /><Field label="Teléfono (opcional)" name="telefono" type="tel" maxLength={30} /><Field label="Barrio o vereda" name="ubicacion" required maxLength={120} /></div><Field label="Asunto" name="asunto" required maxLength={150} /><label className="field"><span>Descripción *</span><textarea name="descripcion" required maxLength={4800} value={description} onChange={(e) => setDescription(e.target.value)} /><small>{description.length} de 4.800 caracteres</small></label><label className="trap" aria-hidden="true">Sitio web<input name="sitio" tabIndex={-1} autoComplete="off" /></label><label className="checkbox"><input type="checkbox" name="autorizacion" required /><span>Autorizo el tratamiento de mis datos personales según la <AppLink href="/politica-de-datos">política de tratamiento de datos</AppLink>.</span></label>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" disabled={sending}>{sending ? "Enviando…" : "Enviar solicitud"}</Button></form><aside className="help-column"><article><Text as="h3">¿Qué tipo de solicitud elegir?</Text><Text><strong>Petición:</strong> solicita información o una gestión.</Text><Text><strong>Queja:</strong> expresa inconformidad con la atención.</Text><Text><strong>Reclamo:</strong> pide corregir una situación.</Text><Text><strong>Sugerencia:</strong> propone una mejora.</Text></article><article><Text as="h3">Otros canales de atención</Text><Text>{canal.direccion}</Text><Text>{canal.telefono}</Text><Text>{canal.correo}</Text></article></aside></div></section></>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}

const isOpen = (item: Solicitud) => item.estado === "Radicada" || item.estado === "En trámite";

function GoogleButton({ onLogin }: { onLogin: (session: Sesion) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState("");
  useEffect(() => {
    if (ref.current) mostrarBotonGoogle(ref.current, onLogin).catch((e: Error) => setFailed(e.message));
  }, []);
  return failed ? <p className="form-error" role="alert">{failed}</p> : <div ref={ref} className="google-button" />;
}

function Admin() {
  const [session, setSession] = useState<Sesion | null>(null);
  const [items, setItems] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"Todas" | "Abiertas" | "Cerradas">("Abiertas");
  const [selected, setSelected] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const exit = (message = "") => { cerrarSesion(); setSession(null); setItems([]); setSelected(null); setError(message); };
  const fail = (e: unknown) => { if (e instanceof ErrorPQRS && e.sesion) exit(e.message); else setError(e instanceof Error ? e.message : "Algo salió mal. Intenta de nuevo."); };
  const load = async () => {
    if (!session) return;
    setLoading(true);
    setError("");
    try { setItems(await listarPQRS(session.token)); } catch (e) { fail(e); } finally { setLoading(false); }
  };
  // El panel solo se muestra cuando el script confirma que la cuenta está en la pestaña Equipo,
  // también al volver con una sesión guardada (pudieron quitarle el acceso).
  const login = async (next: Sesion) => {
    setChecking(true);
    setError("");
    try {
      const list = await listarPQRS(next.token);
      guardarSesion(next);
      setItems(list);
      setSession(next);
    } catch (e) {
      cerrarSesion();
      setError(e instanceof Error ? e.message : "No pudimos verificar tu acceso. Intenta de nuevo.");
    } finally { setChecking(false); }
  };
  useEffect(() => { const saved = sesionGuardada(); if (saved) void login(saved); }, []);

  if (!session) return <section className="admin-login"><div className="login-card"><span className="success-icon"><Icon name="lock" /></span><Eyebrow>Acceso restringido</Eyebrow><Text as="h1">Ingreso del equipo</Text><Text>Panel de gestión de PQRS. Solo para personal autorizado del canal.</Text>{error && <p className="form-error" role="alert">{error}</p>}{checking ? <p className="form-notice" role="status">Verificando acceso…</p> : ingresoDemo ? <Button onClick={() => void login({ token: "demo", correo: "demo@conecta", nombre: "Demostración", expira: Date.now() + 3_600_000 })}>Ingresar con Google (demostración)</Button> : <GoogleButton onLogin={(next) => void login(next)} />}</div></section>;

  if (selected) return <PqrsDetail token={session.token} radicado={selected} onBack={() => { setSelected(null); void load(); }} onError={fail} />;

  const text = query.trim().toLowerCase();
  const visible = items.filter((item) => (tab === "Todas" || (tab === "Abiertas") === isOpen(item)) && (!text || [item.radicado, item.asunto, item.nombre, item.correo].some((field) => field.toLowerCase().includes(text))));
  const open = items.filter(isOpen).length;
  return <><PageIntro eyebrow="Panel" title="Gestión de PQRS">Revisa y gestiona las solicitudes de la ciudadanía.</PageIntro><section className="section"><div className="container"><div className="admin-actions"><div className="summary"><article><span>Recibidas</span><strong>{items.length}</strong></article><article><span>Abiertas</span><strong>{open}</strong></article><article><span>Respondidas</span><strong>{items.length - open}</strong></article></div><div className="admin-session"><small>{session.correo}</small><div><Button variant="secondary" onClick={load}>Actualizar</Button> <Button variant="ghost" onClick={() => exit()}>Cerrar sesión</Button></div></div></div>{modoDemo && <p className="form-notice">Modo demostración: estos son datos de ejemplo.</p>}{error && <p className="form-error" role="alert">{error}</p>}<div className="tabs" role="tablist">{(["Abiertas", "Cerradas", "Todas"] as const).map((item) => <button role="tab" aria-selected={item === tab} className={item === tab ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</div><label className="search"><Icon name="search" /><input placeholder="Buscar por radicado, asunto o ciudadano" value={query} onChange={(e) => setQuery(e.target.value)} /></label>{loading ? <Text>Cargando solicitudes…</Text> : visible.length === 0 ? <Text>No hay solicitudes para mostrar.</Text> : <div className="table-wrap"><table><thead><tr><th>Radicado</th><th>Tipo</th><th>Asunto y ciudadano</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>{visible.map((item) => <tr key={item.radicado} className="row-link" onClick={() => setSelected(item.radicado)}><td><button className="link-button" onClick={() => setSelected(item.radicado)}><code>{item.radicado}</code></button></td><td>{item.tipo}</td><td><strong>{item.asunto}</strong><small>{item.nombre} · {item.correo}</small></td><td>{formatDate(item.fecha)}</td><td><span className={`state state--${item.estado.replace(" ", "-").toLowerCase()}`}>{item.estado}</span></td></tr>)}</tbody></table></div>}</div></section></>;
}

function PqrsDetail({ token, radicado, onBack, onError }: { token: string; radicado: string; onBack: () => void; onError: (e: unknown) => void }) {
  const [data, setData] = useState<{ solicitud: Solicitud; historial: EventoHistorial[] } | null>(null);
  const [estado, setEstado] = useState<Estado>("Radicada");
  const [respuesta, setRespuesta] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const load = async () => {
    try {
      const result = await obtenerPQRS(token, radicado);
      setData(result);
      setEstado(result.solicitud.estado);
      setRespuesta(result.solicitud.respuesta);
    } catch (e) { onError(e); onBack(); }
  };
  useEffect(() => { void load(); }, [radicado]);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!data) return;
    const answered = respuesta.trim() !== "" && respuesta.trim() !== data.solicitud.respuesta;
    setSaving(true);
    setNotice("");
    try {
      await actualizarPQRS(token, { radicado, estado, respuesta: respuesta.trim() });
      await load();
      setNotice(answered ? `Guardado. La respuesta se envió a ${data.solicitud.correo}.` : "Guardado.");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "No se pudo guardar.");
      onError(e);
    } finally { setSaving(false); }
  };
  if (!data) return <section className="section"><div className="container"><Text>Cargando solicitud…</Text></div></section>;
  const s = data.solicitud;
  return <><PageIntro eyebrow={`${s.tipo} · ${s.radicado}`} title={s.asunto}>Radicada el {formatDate(s.fecha)}.</PageIntro><section className="section"><div className="container"><Button variant="ghost" className="back-button" onClick={onBack}>← Volver a la lista</Button><div className="form-layout"><div className="form-card"><dl className="detail-data"><div><dt>Estado</dt><dd><span className={`state state--${s.estado.replace(" ", "-").toLowerCase()}`}>{s.estado}</span></dd></div><div><dt>Ciudadano</dt><dd>{s.nombre}</dd></div><div><dt>Correo</dt><dd>{s.correo}</dd></div><div><dt>Teléfono</dt><dd>{s.telefono || "—"}</dd></div><div><dt>Barrio o vereda</dt><dd>{s.ubicacion}</dd></div><div><dt>Última gestión</dt><dd>{s.responsable ? `${formatDate(s.actualizado)} · ${s.responsable}` : "—"}</dd></div></dl><div><Text as="h3">Descripción</Text><p className="detail-text">{s.descripcion}</p></div></div><aside className="help-column"><form className="form-card" onSubmit={save}><Text as="h2">Gestionar</Text><label className="field"><span>Estado</span><select value={estado} onChange={(e) => setEstado(e.target.value as Estado)}>{estados.map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>Respuesta al ciudadano</span><textarea value={respuesta} maxLength={4800} onChange={(e) => setRespuesta(e.target.value)} /><small>Al guardar una respuesta nueva se envía por correo a {s.correo}.</small></label>{notice && <p className="form-notice" role="status">{notice}</p>}<Button type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button></form><article><Text as="h3">Historial</Text><ol className="history">{data.historial.map((item, index) => <li key={index}><strong>{item.accion}</strong><small>{formatDate(item.fecha)} · {item.responsable}</small>{item.detalle && <p>{item.detalle}</p>}</li>)}</ol></article></aside></div></div></section></>;
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
