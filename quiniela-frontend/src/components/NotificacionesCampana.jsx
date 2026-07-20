import { useEffect, useRef, useState } from "react";
import { API } from "../config/api";

const STORAGE_KEY = "notif_leidas";

function cargarLeidas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [];
  } catch {
    return [];
  }
}

function guardarLeidas(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

const TIPO_ESTILOS = {
  alerta:      "border-l-4 border-red-400 bg-red-50",
  advertencia: "border-l-4 border-yellow-400 bg-yellow-50",
  info:        "border-l-4 border-blue-400 bg-blue-50",
};

export default function NotificacionesCampana({
  jornadaActual,
  jornadaAbierta,
  partidos,
  pronosticosUsuario,
  marcadoresUsuario,
  miPagoTemporada,
  torneoId,
  onNavegar,
}) {
  const [abierto, setAbierto]       = useState(false);
  const [leidas, setLeidas]         = useState(cargarLeidas);
  const [campeonData, setCampeonData] = useState(null);
  const ref   = useRef(null);
  const token = localStorage.getItem("token");

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Obtener datos del campeón
  useEffect(() => {
    if (!torneoId) return;
    let activo = true;
    Promise.all([
      fetch(`${API}/campeon/mi-pronostico?torneo_id=${torneoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/campeon/config?torneo_id=${torneoId}`).then((r) =>
        r.ok ? r.json() : null
      ),
    ])
      .then(([miCampeonData, config]) => {
        if (!activo) return;
        setCampeonData({
          miCampeon: miCampeonData?.pronostico ?? null,
          config: config ?? null,
        });
      })
      .catch(() => {});
    return () => { activo = false; };
  }, [torneoId]);

  // ── Construir lista de notificaciones ──────────────────────────────────
  const notificaciones = [];

  // 1. Jornada por cerrar (< 24 h)
  if (jornadaAbierta && jornadaActual?.fecha_cierre) {
    const diff  = new Date(jornadaActual.fecha_cierre) - Date.now();
    const horas = diff / 3_600_000;
    if (horas > 0 && horas < 24) {
      const urgente = horas < 2;
      const hh = Math.floor(horas);
      const mm = Math.floor((horas - hh) * 60);
      notificaciones.push({
        id:      `cierre-${jornadaActual.id}`,
        icono:   "⏰",
        titulo:  urgente ? "¡Jornada cierra muy pronto!" : "Jornada por cerrar",
        mensaje: `La jornada ${jornadaActual.numero} cierra en ${hh}h ${mm}m`,
        tipo:    urgente ? "alerta" : "advertencia",
        accion:  null,
      });
    }
  }

  // 2. Pronósticos incompletos
  if (jornadaAbierta && partidos.length > 0) {
    const completados = partidos.filter((p) => {
      const tieneResultado = Boolean(pronosticosUsuario[p.id]);
      const m = marcadoresUsuario?.[p.id];
      const tieneMarcador =
        m != null &&
        m.local   !== undefined && m.local   !== "" &&
        m.visitante !== undefined && m.visitante !== "";
      return tieneResultado && tieneMarcador;
    }).length;
    const faltantes = partidos.length - completados;
    if (faltantes > 0) {
      notificaciones.push({
        id:      `pronosticos-${jornadaActual?.id}`,
        icono:   "⚽",
        titulo:  "Pronósticos pendientes",
        mensaje: `Te falt${faltantes === 1 ? "a" : "an"} ${faltantes} pronóstico${faltantes === 1 ? "" : "s"} por completar`,
        tipo:    "info",
        accion:  "pronosticos",
      });
    }
  }

  // 3. Pago pendiente (torneo de temporada)
  if (miPagoTemporada && !miPagoTemporada.pagado) {
    notificaciones.push({
      id:      "pago-pendiente",
      icono:   "💳",
      titulo:  "Pago pendiente",
      mensaje: "Tu inscripción aún no ha sido confirmada. Contacta al administrador.",
      tipo:    "advertencia",
      accion:  null,
    });
  }

  // 4. Campeón sin registrar
  if (
    campeonData?.config?.configurado &&
    !campeonData?.config?.bloqueado &&
    !campeonData?.miCampeon?.equipo
  ) {
    notificaciones.push({
      id:      `campeon-pendiente-${torneoId}`,
      icono:   "👑",
      titulo:  "Registra tu campeón",
      mensaje: "El pronóstico de campeón de temporada está abierto",
      tipo:    "info",
      accion:  "inicio",
    });
  }

  // ── Estado de leídas ──────────────────────────────────────────────────
  const noLeidas = notificaciones.filter((n) => !leidas.includes(n.id));
  const count    = noLeidas.length;

  const marcarTodas = () => {
    const nuevas = [...new Set([...leidas, ...notificaciones.map((n) => n.id)])];
    setLeidas(nuevas);
    guardarLeidas(nuevas);
  };

  const descartar = (id) => {
    const nuevas = [...new Set([...leidas, id])];
    setLeidas(nuevas);
    guardarLeidas(nuevas);
  };

  const handleAccion = (notif) => {
    if (notif.accion && onNavegar) onNavegar(notif.accion);
    descartar(notif.id);
    setAbierto(false);
  };

  return (
    <div ref={ref} className="relative">
      {/* Botón campana */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {abierto && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Cabecera */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-bold text-sm text-gray-800">Notificaciones</h3>
            {count > 0 && (
              <button
                onClick={marcarTodas}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notificaciones.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-3xl mb-2">🔔</p>
                <p className="text-sm font-semibold text-gray-700">Todo al día</p>
                <p className="text-xs text-gray-400 mt-1">No tienes notificaciones pendientes</p>
              </div>
            ) : (
              notificaciones.map((n) => {
                const leida = leidas.includes(n.id);
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 transition-opacity ${TIPO_ESTILOS[n.tipo] ?? ""} ${leida ? "opacity-40" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{n.icono}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 leading-tight">{n.titulo}</p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{n.mensaje}</p>
                        {n.accion && !leida && (
                          <button
                            onClick={() => handleAccion(n)}
                            className="mt-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            Ver ahora →
                          </button>
                        )}
                      </div>
                      {!leida && (
                        <button
                          onClick={() => descartar(n.id)}
                          className="flex-shrink-0 text-gray-300 hover:text-gray-500 transition-colors text-lg leading-none mt-0.5"
                          title="Descartar"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pie */}
          {notificaciones.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center">
                {count === 0 ? "Sin notificaciones sin leer 👍" : `${count} sin leer`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
