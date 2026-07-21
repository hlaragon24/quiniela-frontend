import { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import TimerJornada from "./TimerJornada";
import HistorialJornadas from "./HistorialJornadas";
import MisResultados from "./MisResultados";
import TablaGeneral from "./TablaGeneral";
import PerfilJugador from "./PerfilJugador";
import HistoricoPronosticos from "./HistoricoPronosticos";
import Reglamento from "./Reglamento";
import { API, apiFetch } from "./config/api";
import { jornadaActivaDeListado } from "./utils/jornadaActiva";
import TeamShield from "./components/TeamShield";
import NotificacionesCampana from "./components/NotificacionesCampana";

const PATH_TO_TAB = {
  "/":                    "inicio",
  "/pronosticos":         "pronosticos",
  "/historial":           "historial",
  "/mis-pronosticos":     "misResultados",
  "/tabla":               "tabla-general",
  "/perfil":              "perfil",
  "/historico":           "historico-pronosticos",
  "/reglamento":          "reglamento",
};

const TAB_TO_PATH = Object.fromEntries(
  Object.entries(PATH_TO_TAB).map(([path, tab]) => [tab, path])
);

function App({ onLogout }) {
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState("");

  const [jornadaNumero, setJornadaNumero] = useState("");
  const [jornadaActual, setJornadaActual] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [pronosticosUsuario, setPronosticosUsuario] = useState({});
  const [marcadoresUsuario, setMarcadoresUsuario] = useState({});

  const [jornadaAbierta, setJornadaAbierta] = useState(false);
  const [refreshRanking, setRefreshRanking] = useState(false);

  const [partidosIncompletos, setPartidosIncompletos] = useState([]);
  const [listaJornadas, setListaJornadas] = useState([]);

  const [torneoTipo, setTorneoTipo]           = useState("temporada");
  const [miPagoTemporada, setMiPagoTemporada] = useState(null);   // {pagado} o null
  const [misPagosJornada, setMisPagosJornada] = useState({});     // { jornadaId: bool }
  const location     = useLocation();
  const navigate     = useNavigate();
  const activeTab    = PATH_TO_TAB[location.pathname] ?? "inicio";
  const setActiveTab = useCallback((tab) => navigate(TAB_TO_PATH[tab] ?? "/"), [navigate]);
  const [usuariosActivos, setUsuariosActivos] = useState([]);
  const [activoSeleccionado, setActivoSeleccionado] = useState(null);

  const token = localStorage.getItem("token");

  const jornadaId = jornadaActual?.id ?? null;

  const handleCerrarJornada = useCallback(() => setJornadaAbierta(false), []);

  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(""), 5000);
    return () => clearTimeout(t);
  }, [mensaje]);

  // ── Torneos ──────────────────────────────────────────────────────────
  const cargarTorneos = async () => {
    try {
      const res = await apiFetch(`${API}/torneos/mis-torneos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) return;

      setTorneos(data);

      if (data.length > 0) setTorneoId(data[0].id);
    } catch (error) {
      console.error("Error cargando torneos:", error);
    }
  };

  const cargarMiPago = async (tid, tipo) => {
    try {
      const res  = await apiFetch(`${API}/pagos/mi-pago?torneo_id=${tid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setMiPagoTemporada(null); setMisPagosJornada({}); return; }
      const data = await res.json();
      if (tipo === "jornada" && Array.isArray(data)) {
        const mapa = {};
        data.forEach((p) => { mapa[p.jornada_id] = Boolean(p.pagado); });
        setMisPagosJornada(mapa);
        setMiPagoTemporada(null);
      } else {
        setMiPagoTemporada(data);
        // Mapear pagos por jornada dentro de la temporada (si existen)
        const mapa = {};
        if (Array.isArray(data?.pagos_jornada)) {
          data.pagos_jornada.forEach((p) => { mapa[p.jornada_id] = Boolean(p.pagado); });
        }
        setMisPagosJornada(mapa);
      }
    } catch (e) {
      console.error("Error cargando mi pago:", e);
    }
  };

  // ── Jornadas ─────────────────────────────────────────────────────────
  const cargarJornadas = async (tid) => {
    if (!tid) return;

    try {
      const res = await fetch(`${API}/jornadas?torneo_id=${tid}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setListaJornadas([]);
        return;
      }

      setListaJornadas(data);

      const activa = jornadaActivaDeListado(data);
      if (activa) setJornadaNumero(String(activa.numero));
    } catch (error) {
      console.error("Error cargando jornadas:", error);
      setListaJornadas([]);
    }
  };

  const cargarJornadaActual = async () => {
    if (!jornadaNumero || !torneoId) return null;

    try {
      const res = await fetch(`${API}/jornadas/${jornadaNumero}?torneo_id=${torneoId}`);
      const data = await res.json();

      if (!res.ok || !data?.id) {
        setJornadaActual(null);
        setJornadaAbierta(false);
        return null;
      }

      setJornadaActual(data);

      const cierre = new Date(data.fecha_cierre);
      const abierta =
        data.estado === "abierta" &&
        !Number.isNaN(cierre.getTime()) &&
        new Date() < cierre;

      setJornadaAbierta(abierta);
      return data;
    } catch (error) {
      console.error("Error cargando jornada actual:", error);
      setJornadaActual(null);
      setJornadaAbierta(false);
      return null;
    }
  };

  const cargarPartidos = async (jornadaDbId) => {
    if (!jornadaDbId) {
      setPartidos([]);
      return;
    }

    try {
      const response = await fetch(`${API}/partidos/${jornadaDbId}`);
      const data = await response.json();

      if (!response.ok) {
        setPartidos([]);
        return;
      }

      setPartidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando partidos:", error);
      setPartidos([]);
    }
  };

  const cargarPronosticosUsuario = async (jornadaDbId) => {
    if (!token || !jornadaDbId) return;

    try {
      const response = await apiFetch(`${API}/pronosticos/usuario/${jornadaDbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (!Array.isArray(data)) return;

      const mapaResultados = {};
      const mapaMarcadores = {};

      data.forEach((p) => {
        mapaResultados[p.partido_id] = p.pronostico_usuario;
        mapaMarcadores[p.partido_id] = {
          local: p.marcador_local,
          visitante: p.marcador_visitante,
        };
      });

      setPronosticosUsuario(mapaResultados);
      setMarcadoresUsuario(mapaMarcadores);
    } catch (error) {
      console.error("Error cargando pronósticos usuario:", error);
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    cargarTorneos();
  }, []);

  useEffect(() => {
    const fetchActivos = () => {
      apiFetch(`${API}/usuarios/activos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setUsuariosActivos(d); })
        .catch(() => {});
    };
    fetchActivos();
    const id = setInterval(fetchActivos, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!torneoId) return;
    const torneo = torneos.find((t) => t.id === Number(torneoId));
    const tipo   = torneo?.tipo ?? "temporada";
    setTorneoTipo(tipo);
    setJornadaNumero("");
    setListaJornadas([]);
    setMiPagoTemporada(null);
    setMisPagosJornada({});
    cargarJornadas(torneoId);
    cargarMiPago(torneoId, tipo);
  }, [torneoId]);

  useEffect(() => {
    if (!jornadaNumero) return;

    const cargarDatos = async () => {
      setMensaje("");
      setPartidos([]);
      setPartidosIncompletos([]);
      setPronosticosUsuario({});
      setMarcadoresUsuario({});

      const jornada = await cargarJornadaActual();
      if (!jornada?.id) return;

      await cargarPartidos(jornada.id);
      await cargarPronosticosUsuario(jornada.id);
    };

    cargarDatos();
  }, [jornadaNumero]);

  // ── Inscripción por jornada ───────────────────────────────────────────
  const inscritoEnJornada =
    torneoTipo === "jornada" && jornadaId != null
      ? jornadaId in misPagosJornada
      : null;

  const inscribirseEnJornada = async () => {
    if (!jornadaId) return;
    try {
      const res = await apiFetch(`${API}/jornadas/${jornadaId}/inscribir`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje || "Inscrito correctamente"}` : `❌ ${data.mensaje || "Error"}`);
      if (res.ok) cargarMiPago(torneoId, torneoTipo);
    } catch {
      setMensaje("❌ Error de conexión");
    }
  };

  const desinscribirseDeJornada = async () => {
    if (!jornadaId) return;
    try {
      const res = await apiFetch(`${API}/jornadas/${jornadaId}/inscribir`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje || "Inscripción cancelada"}` : `❌ ${data.mensaje || "Error"}`);
      if (res.ok) cargarMiPago(torneoId, torneoTipo);
    } catch {
      setMensaje("❌ Error de conexión");
    }
  };

  // ── Acciones pronósticos ──────────────────────────────────────────────
  const actualizarMarcador = (partidoId, campo, valor) => {
    setMarcadoresUsuario((prev) => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: valor === "" ? "" : Number(valor),
      },
    }));
  };

  const seleccionarResultado = (partidoId, resultado) => {
    setPronosticosUsuario((prev) => ({
      ...prev,
      [partidoId]: resultado,
    }));
  };

  const guardarJornadaCompleta = async () => {
    if (!jornadaAbierta) {
      setMensaje("🔒 La jornada ya está cerrada");
      return;
    }

    if (partidos.length === 0) {
      setMensaje("⚠ Esta jornada no tiene partidos configurados");
      return;
    }

    const incompletos = partidos.filter((partido) => {
      const resultado = pronosticosUsuario[partido.id];
      const local = marcadoresUsuario[partido.id]?.local;
      const visitante = marcadoresUsuario[partido.id]?.visitante;

      return (
        !resultado ||
        local === undefined || local === "" ||
        visitante === undefined || visitante === ""
      );
    });

    if (incompletos.length > 0) {
      setPartidosIncompletos(incompletos.map((p) => p.id));
      setMensaje(`⚠ Faltan ${incompletos.length} pronóstico(s)`);
      return;
    }

    setPartidosIncompletos([]);
    setMensaje("Guardando pronósticos...");

    const pronosticos = partidos.map((partido) => ({
      partido_id: partido.id,
      resultado: pronosticosUsuario[partido.id],
      marcador_local: Number(marcadoresUsuario[partido.id].local),
      marcador_visitante: Number(marcadoresUsuario[partido.id].visitante),
    }));

    try {
      const response = await apiFetch(`${API}/pronosticos/guardar-jornada`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pronosticos),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(`❌ ${data.mensaje || "Error guardando pronósticos"}`);
        if (response.status === 403) setJornadaAbierta(false);
        return;
      }

      setMensaje(`✅ ${data.mensaje}`);
      setRefreshRanking((prev) => !prev);
      if (jornadaId) await cargarPronosticosUsuario(jornadaId);
    } catch (error) {
      console.error("Error guardando jornada:", error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  const NAV_ITEMS = [
    { value: "inicio",                icon: "🏠", label: "Inicio" },
    { value: "pronosticos",           icon: "⚽", label: "Pronósticos" },
    { value: "historial",              icon: "📈", label: "Historial" },
    { value: "misResultados",         icon: "📋", label: "Mis pronósticos" },
    { value: "tabla-general",         icon: "🏆", label: "Tabla" },
    { value: "perfil",                icon: "👤", label: "Perfil" },
    { value: "historico-pronosticos", icon: "📚", label: "Histórico general" },
    { value: "reglamento", icon: "📋", label: "Reglamento" },
  ];

  if (torneos.length === 0 && torneoId === "") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8 bg-[#eef3fb]">
        <img src="/Escudo_losTercos.png" alt="Los Tercos" className="h-32 w-auto mb-6 object-contain" />
        <h2 className="text-2xl font-bold mb-2 text-gray-900">Sin acceso a torneos</h2>
        <p className="text-gray-500 max-w-sm text-sm">
          No tienes ningún torneo asignado. Contacta al administrador para que te inscriba.
        </p>
        <button
          onClick={onLogout}
          className="mt-6 bg-red-600 hover:bg-red-500 text-white px-5 py-2 rounded-xl font-semibold transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] text-gray-900">

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-2 flex items-center gap-3">
          <img src="/Escudo_losTercos.png" alt="Los Tercos" className="h-28 w-auto object-contain flex-shrink-0" />
          <div className="flex-1" />
          {jornadaNumero && (
            <TimerJornada
              key={jornadaNumero}
              jornada={jornadaNumero}
              torneoId={torneoId}
              onCerrarJornada={handleCerrarJornada}
            />
          )}

          {/* Campana de notificaciones */}
          <NotificacionesCampana
            jornadaActual={jornadaActual}
            jornadaAbierta={jornadaAbierta}
            partidos={partidos}
            pronosticosUsuario={pronosticosUsuario}
            marcadoresUsuario={marcadoresUsuario}
            miPagoTemporada={miPagoTemporada}
            torneoId={torneoId}
            onNavegar={setActiveTab}
          />

          {/* Usuarios activos en tiempo real */}
          {usuariosActivos.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hidden sm:block">En línea</span>
              <div className="flex -space-x-2">
                {usuariosActivos.map((u) => {
                  const COLORS = ["bg-rose-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-purple-500","bg-pink-500","bg-cyan-500","bg-orange-500","bg-indigo-500","bg-teal-500"];
                  const color = COLORS[u.id % COLORS.length];
                  const selected = activoSeleccionado === u.id;
                  return (
                    <div key={u.id} className="relative">
                      <button
                        onClick={() => setActivoSeleccionado(selected ? null : u.id)}
                        className={`w-7 h-7 rounded-full ${color} text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform ${selected ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                      >
                        {u.nombre.trim()[0].toUpperCase()}
                      </button>
                      {selected && (
                        <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap z-50 shadow-xl">
                          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45 rounded-sm" />
                          {u.nombre}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-[11px] font-semibold text-green-600">{usuariosActivos.length}</span>
            </div>
          )}

          <button
            onClick={onLogout}
            className="flex-shrink-0 text-xs bg-red-600/70 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
          >
            Salir
          </button>
        </div>
      </header>

      {/* ── TORNEO / JORNADA ── */}
      <div className="bg-gray-50 border-b border-gray-200 px-3 sm:px-5 py-2">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-3 items-center">
          {torneos.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Torneo</span>
              <select
                value={torneoId}
                onChange={(e) => setTorneoId(Number(e.target.value))}
                className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500 cursor-pointer shadow-sm"
              >
                {torneos.map((t) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Jornada</span>
            <select
              value={jornadaNumero}
              onChange={(e) => setJornadaNumero(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-green-500 cursor-pointer shadow-sm"
            >
              {listaJornadas.map((j) => {
                const bloqueada = misPagosJornada[j.id] === false;
                return (
                  <option key={`jornada-${j.id}`} value={j.numero}>
                    {bloqueada ? "🔒 " : ""}Jornada {j.numero}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {/* ── NAV PILLS ── */}
      <div className="sticky top-[73px] z-30 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex flex-nowrap gap-1 px-3 sm:px-5 py-2 w-max">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.value}
                onClick={() => setActiveTab(item.value)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs sm:text-sm px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all active:scale-95
                  ${activeTab === item.value
                    ? "bg-green-600 text-white shadow-lg shadow-green-300/50"
                    : "text-gray-500 hover:text-gray-900 hover:bg-blue-50"
                  }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-3 sm:px-5 py-4 pb-8">

        {/* INICIO */}
        {activeTab === "inicio" && (
          <Dashboard
            jornadaActual={jornadaActual}
            jornadaAbierta={jornadaAbierta}
            partidos={partidos}
            pronosticosUsuario={pronosticosUsuario}
            marcadoresUsuario={marcadoresUsuario}
            jornadasCount={listaJornadas.length}
            torneoId={torneoId}
          />
        )}

        {/* PRONÓSTICOS */}
        {activeTab === "pronosticos" && (
          <div>
            {/* Banner inscripción por jornada */}
            {torneoTipo === "jornada" && jornadaId && (
              <div className={`mb-4 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 ${
                inscritoEnJornada
                  ? "bg-blue-50 border-blue-200"
                  : "bg-orange-50 border-orange-300"
              }`}>
                <div>
                  <p className={`font-semibold text-sm ${inscritoEnJornada ? "text-blue-700" : "text-orange-700"}`}>
                    {inscritoEnJornada
                      ? "✅ Estás inscrito en esta jornada"
                      : "⚠️ No estás inscrito en esta jornada"}
                  </p>
                  {!inscritoEnJornada && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      Inscríbete para poder enviar tus pronósticos.
                    </p>
                  )}
                </div>
                <button
                  onClick={inscritoEnJornada ? desinscribirseDeJornada : inscribirseEnJornada}
                  className={`flex-shrink-0 text-sm font-bold px-4 py-2 rounded-xl transition-all active:scale-95 ${
                    inscritoEnJornada
                      ? "bg-red-100 text-red-600 hover:bg-red-200"
                      : "bg-orange-500 text-white hover:bg-orange-600 shadow-md"
                  }`}
                >
                  {inscritoEnJornada ? "Cancelar inscripción" : "Inscribirme"}
                </button>
              </div>
            )}

            {(() => {
              const pagoTemporadaPendiente = torneoTipo === "temporada" && miPagoTemporada?.pagado === false;
              const pagoJornadaPendiente   = Boolean(jornadaId && misPagosJornada[jornadaId] === false);
              if (!pagoTemporadaPendiente && !pagoJornadaPendiente) return null;
              return (
                <div className="mb-4 px-4 py-3 rounded-xl bg-yellow-50 border border-yellow-300 space-y-1">
                  <p className="font-semibold text-yellow-700">💳 Pago pendiente</p>
                  {pagoTemporadaPendiente && (
                    <p className="text-sm text-yellow-700/80">
                      Inscripción pendiente — monto registrado:{" "}
                      <strong>${miPagoTemporada?.monto ?? "0.00"}</strong>
                    </p>
                  )}
                  {pagoJornadaPendiente && (
                    <p className="text-sm text-yellow-700/80">
                      Tu pago para esta jornada no ha sido confirmado.
                    </p>
                  )}
                  <p className="text-sm text-red-600 font-semibold">
                    Contacta al administrador para regularizar tu pago.
                  </p>
                </div>
              );
            })()}

            <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold border ${
              jornadaAbierta
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}>
              <p>
                {jornadaAbierta
                  ? "🟢 Jornada abierta — puedes editar tus pronósticos"
                  : "🔒 Jornada cerrada — ya no es posible modificar pronósticos"}
              </p>
              {jornadaActual?.fecha_cierre && (
                <p className="font-normal text-xs mt-0.5 opacity-75">
                  {jornadaAbierta ? "Cierra" : "Cerró"}{": "}
                  {new Date(jornadaActual.fecha_cierre).toLocaleString("es-MX", {
                    weekday: "short", day: "numeric", month: "short",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              )}
            </div>

            {partidos.length === 0 && (
              <p className="mt-8 text-center text-gray-500">No hay partidos configurados para esta jornada.</p>
            )}

            <div className="space-y-3">
              {partidos.map((partido) => {
                const incompleto = partidosIncompletos.includes(partido.id);
                return (
                  <div
                    key={`partido-${partido.id}`}
                    className={`rounded-2xl p-4 border shadow-md transition-all ${
                      incompleto
                        ? "bg-white border-red-400 shadow-red-200/50"
                        : partido.es_comodin
                        ? "bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-400 shadow-amber-200/60"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 flex justify-center">
                        <TeamShield
                          nombre={partido.local}
                          escudoUrl={partido.escudo_local}
                          color={partido.color_local}
                          size="lg"
                        />
                      </div>
                      <span className="text-gray-600 font-black text-xl px-2">VS</span>
                      <div className="flex-1 flex justify-center">
                        <TeamShield
                          nombre={partido.visitante}
                          escudoUrl={partido.escudo_visitante}
                          color={partido.color_visitante}
                          size="lg"
                        />
                      </div>
                    </div>

                    {partido.es_comodin && (
                      <div className="flex justify-center mt-3 mb-1">
                        <span className="inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide uppercase shadow-sm">
                          ⭐ Partido comodín · puntos dobles
                        </span>
                      </div>
                    )}

                    <div className="flex justify-center items-center gap-3 mt-4">
                      <input
                        type="number" min="0"
                        disabled={!jornadaAbierta}
                        value={marcadoresUsuario[partido.id]?.local ?? ""}
                        onChange={(e) => actualizarMarcador(partido.id, "local", e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-center text-xl font-bold rounded-xl w-14 h-12 focus:outline-none focus:border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                      <span className="text-gray-600 font-black text-xl">–</span>
                      <input
                        type="number" min="0"
                        disabled={!jornadaAbierta}
                        value={marcadoresUsuario[partido.id]?.visitante ?? ""}
                        onChange={(e) => actualizarMarcador(partido.id, "visitante", e.target.value)}
                        className="bg-gray-50 border border-gray-200 text-gray-900 text-center text-xl font-bold rounded-xl w-14 h-12 focus:outline-none focus:border-green-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div className="flex gap-2 mt-4">
                      {[
                        { key: "L", label: "Local",     active: "bg-blue-600 ring-2 ring-blue-300 text-white",    inactive: "border border-blue-200 text-blue-600 hover:bg-blue-50" },
                        { key: "E", label: "Empate",    active: "bg-yellow-500 ring-2 ring-yellow-300 text-white", inactive: "border border-yellow-200 text-yellow-600 hover:bg-yellow-50" },
                        { key: "V", label: "Visitante", active: "bg-red-600 ring-2 ring-red-300 text-white",       inactive: "border border-red-200 text-red-600 hover:bg-red-50" },
                      ].map(({ key, label, active, inactive }) => {
                        const sel = pronosticosUsuario[partido.id] === key;
                        return (
                          <button
                            key={key}
                            disabled={!jornadaAbierta}
                            onClick={() => seleccionarResultado(partido.id, key)}
                            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all active:scale-95
                              ${sel ? active : inactive}
                              ${!jornadaAbierta ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "historial"             && <HistorialJornadas torneoId={torneoId} />}
        {activeTab === "misResultados"         && <MisResultados torneoId={torneoId} />}
        {activeTab === "tabla-general"         && <TablaGeneral torneoId={torneoId} />}
        {activeTab === "perfil"                && <PerfilJugador torneoId={torneoId} />}
        {activeTab === "historico-pronosticos" && <HistoricoPronosticos torneoId={torneoId} />}
        {activeTab === "reglamento" && <Reglamento torneoId={torneoId} />}
      </div>

      {/* ── TOAST NOTIFICACIÓN ── */}
      {mensaje && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl text-white text-sm font-semibold max-w-[85vw] w-max pointer-events-none ${
            mensaje.startsWith("✅") ? "bg-green-600 shadow-green-900/50" :
            mensaje.startsWith("❌") ? "bg-red-600 shadow-red-900/50" :
            mensaje.startsWith("⚠")  ? "bg-amber-500 shadow-amber-900/50" :
            mensaje.startsWith("🔒") ? "bg-slate-700 shadow-slate-900/50" :
            "bg-gray-700 shadow-gray-900/50"
          }`}
        >
          {mensaje}
        </div>
      )}

      {/* ── BOTÓN FLOTANTE GUARDAR ── */}
      {activeTab === "pronosticos" && jornadaAbierta && (
        <div className="fixed bottom-5 right-4 sm:right-6 z-50">
          <button
            onClick={guardarJornadaCompleta}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold px-5 py-3 rounded-2xl shadow-xl shadow-green-300/60 transition-all"
          >
            <span className="text-base">⚽</span>
            <span>Guardar pronósticos</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
