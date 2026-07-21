import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import TimerJornada from "./TimerJornada";
import AdminPronosticos from "./AdminPronosticos";
import AdminParticipacion from "./AdminParticipacion";
import AdminOrganizadorJugadores from "./AdminOrganizadorJugadores";
import AdminEvidencia from "./AdminEvidencia";
import TeamShield from "./components/TeamShield";
import { API } from "./config/api";
import { jornadaActivaDeListado } from "./utils/jornadaActiva";

const ORG_PATH_TO_TAB = {
  "/organizer/resultados":    "resultados",
  "/organizer/pronosticos":   "pronosticos",
  "/organizer/participacion": "participacion",
  "/organizer/evidencia":     "evidencia",
  "/organizer/jugadores":     "jugadores",
};

const ORG_TAB_TO_PATH = Object.fromEntries(
  Object.entries(ORG_PATH_TO_TAB).map(([path, tab]) => [tab, path])
);

function AdminOrganizador({ onLogout }) {
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState("");
  const [jornada, setJornada] = useState("");
  const [jornadaId, setJornadaId] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [marcadores, setMarcadores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const location  = useLocation();
  const navigate  = useNavigate();
  const tab       = ORG_PATH_TO_TAB[location.pathname] ?? "resultados";
  const setTab    = (t) => navigate(ORG_TAB_TO_PATH[t] ?? "/organizer/resultados");

  const token = localStorage.getItem("token");
  const nombre = localStorage.getItem("nombre") || "Organizador";

  const cargarTorneos = async () => {
    try {
      const res = await fetch(`${API}/torneos/mis-torneos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTorneos(data);
        if (data.length > 0) setTorneoId(data[0].id);
      }
    } catch (e) { console.error(e); }
  };

  const cargarJornadas = async (tid) => {
    if (!tid) return;
    try {
      const res = await fetch(`${API}/jornadas?torneo_id=${tid}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setJornadas(data);
        const activa = jornadaActivaDeListado(data);
        if (activa) setJornada(activa.numero);
      }
    } catch (e) { console.error(e); }
  };

  const cargarPartidos = async () => {
    if (!jornada || !torneoId) return;
    try {
      const jRes = await fetch(`${API}/jornadas/${jornada}?torneo_id=${torneoId}`);
      const jData = await jRes.json();
      if (!jRes.ok || !jData?.id) { setJornadaId(null); setPartidos([]); return; }
      setJornadaId(jData.id);

      const pRes = await fetch(`${API}/partidos/${jData.id}`);
      const pData = await pRes.json();
      const lista = Array.isArray(pData) ? pData : [];
      setPartidos(lista);

      const golesExistentes = {};
      lista.forEach(p => {
        if (p.goles_local !== null && p.goles_visitante !== null) {
          golesExistentes[p.id] = { local: String(p.goles_local), visitante: String(p.goles_visitante) };
        }
      });
      setMarcadores(golesExistentes);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!location.pathname.startsWith("/organizer")) {
      navigate("/organizer/resultados", { replace: true });
    }
  }, []);

  useEffect(() => { cargarTorneos(); }, []);
  useEffect(() => { if (torneoId) { setJornada(""); setJornadas([]); cargarJornadas(torneoId); } }, [torneoId]);
  useEffect(() => { cargarPartidos(); }, [jornada]);

  const actualizarMarcador = (partidoId, equipo, valor) => {
    setMarcadores(prev => ({ ...prev, [partidoId]: { ...prev[partidoId], [equipo]: valor } }));
  };

  const registrarResultado = async (partidoId) => {
    const marcador = marcadores[partidoId];
    if (!marcador) { setMensaje("❌ Ingresa el marcador primero"); return; }
    try {
      const res = await fetch(`${API}/resultados/${partidoId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goles_local: Number(marcador.local ?? 0), goles_visitante: Number(marcador.visitante ?? 0) }),
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje || "Error guardando"}`);
    } catch { setMensaje("❌ Error de conexión"); }
  };

  const guardarTodos = async () => {
    const entradas = Object.entries(marcadores).filter(([, m]) =>
      m.local !== "" && m.local !== undefined && m.visitante !== "" && m.visitante !== undefined &&
      Number(m.local) >= 0 && Number(m.visitante) >= 0
    );
    if (entradas.length === 0) { setMensaje("⚠️ No hay marcadores válidos para guardar"); return; }
    try {
      const respuestas = await Promise.all(
        entradas.map(([pid, m]) =>
          fetch(`${API}/resultados/${pid}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ goles_local: Number(m.local ?? 0), goles_visitante: Number(m.visitante ?? 0) }),
          })
        )
      );
      const fallidos = respuestas.filter((r) => !r.ok).length;
      if (fallidos > 0) { setMensaje(`❌ ${fallidos} resultado(s) no se pudieron guardar`); return; }
      setMensaje("✅ Resultados guardados");
    } catch { setMensaje("❌ Error guardando resultados"); }
  };

  const torneoActual = torneos.find(t => t.id === Number(torneoId));

  const tabs = [
    { id: "resultados",    label: "Resultados ⚽" },
    { id: "pronosticos",   label: "Pronósticos 🎯" },
    { id: "participacion", label: "Participación 📊" },
    { id: "evidencia",     label: "Evidencia 📸" },
    { id: "jugadores",     label: "Jugadores 👥" },
  ];

  return (
    <div className="min-h-screen bg-[#eef3fb]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-5 py-3 flex items-center gap-3">
        <img src="/Escudo_losTercos.png" alt="Logo" className="h-16 w-auto object-contain" />
        <div className="flex-1">
          <p className="text-xs text-gray-400">Panel Organizador</p>
          <p className="font-bold text-gray-800 text-sm">{torneoActual?.nombre || "Sin torneo"}</p>
        </div>
        <TimerJornada jornada={jornada} torneoId={torneoId} />
        <button onClick={onLogout} className="text-xs bg-red-600/70 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold">
          Salir
        </button>
      </div>

      {/* Selectores */}
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-2 flex flex-wrap gap-4 items-center">
        {torneos.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Torneo</span>
            <select value={torneoId} onChange={e => setTorneoId(Number(e.target.value))}
              className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-1.5">
              {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
          </div>
        )}
        {tab !== "jugadores" && tab !== "evidencia" && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-green-600 font-bold uppercase tracking-widest">Jornada</span>
            <select value={jornada} onChange={e => setJornada(e.target.value)}
              className="bg-white border border-gray-200 text-gray-800 text-sm rounded-lg px-3 py-1.5">
              {jornadas.map(j => <option key={j.id} value={j.numero}>Jornada {j.numero}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-5 py-2 flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}>
            {t.label}
          </button>
        ))}
        {tab === "resultados" && (
          <button onClick={guardarTodos}
            className="ml-auto px-4 py-2 rounded-lg text-sm font-semibold bg-green-600 hover:bg-green-700 text-white">
            Guardar todos
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-5 pb-10">
        {mensaje && (
          <div className={`mb-4 px-4 py-2.5 rounded-xl text-sm font-semibold border ${
            mensaje.startsWith("✅") ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
          }`}>{mensaje}</div>
        )}

        {/* TAB: RESULTADOS */}
        {tab === "resultados" && (
          <div>
            <h2 className="text-lg font-bold mb-4">Registrar resultados</h2>
            {partidos.length === 0 ? (
              <p className="text-gray-500">No hay partidos en esta jornada.</p>
            ) : (
              <div className="space-y-3">
                {partidos.map(partido => {
                  const marcador = marcadores[partido.id] || {};
                  const guardado = marcador.local !== undefined;
                  return (
                    <div key={partido.id}
                      className={`rounded-xl border bg-white shadow-sm p-4 flex flex-col sm:flex-row items-center gap-4 ${partido.es_comodin ? "border-amber-300 bg-amber-50" : "border-gray-200"}`}>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <TeamShield nombre={partido.local} escudoUrl={partido.escudo_local} color={partido.color_local} size="sm" showName={false} />
                        <span className="font-semibold text-sm truncate">{partido.local}</span>
                        {partido.es_comodin && <span className="text-amber-500 text-xs font-bold">⭐</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input type="number" min="0" value={marcador.local ?? ""}
                          onChange={e => actualizarMarcador(partido.id, "local", e.target.value)}
                          className="w-14 text-center border border-gray-300 rounded-lg p-1.5 text-lg font-bold" />
                        <span className="text-gray-500 font-black">—</span>
                        <input type="number" min="0" value={marcador.visitante ?? ""}
                          onChange={e => actualizarMarcador(partido.id, "visitante", e.target.value)}
                          className="w-14 text-center border border-gray-300 rounded-lg p-1.5 text-lg font-bold" />
                      </div>
                      <div className="flex items-center gap-3 flex-1 min-w-0 justify-end sm:justify-start">
                        <span className="font-semibold text-sm truncate">{partido.visitante}</span>
                        <TeamShield nombre={partido.visitante} escudoUrl={partido.escudo_visitante} color={partido.color_visitante} size="sm" showName={false} />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs">{guardado ? "✅" : "⚪"}</span>
                        <button onClick={() => registrarResultado(partido.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-semibold">
                          Guardar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "pronosticos" && jornadaId && <AdminPronosticos torneoId={torneoId} />}
        {tab === "participacion" && <AdminParticipacion torneoId={torneoId} />}
        {tab === "evidencia" && <AdminEvidencia torneoId={torneoId} />}
        {tab === "jugadores" && <AdminOrganizadorJugadores torneoId={Number(torneoId)} />}
      </div>
    </div>
  );
}

export default AdminOrganizador;
