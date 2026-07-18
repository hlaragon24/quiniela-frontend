import { useEffect, useState } from "react";
import Ranking from "./Ranking";
import TimerJornada from "./TimerJornada";
import AdminJornadas from "./AdminJornadas";
import AdminPartidos from "./AdminPartidos";
import AdminUsuarios from "./AdminUsuarios";
import AdminCampeon from "./AdminCampeon";
import HistoricoPronosticos from "./HistoricoPronosticos";
import AdminPagos from "./AdminPagos";
import AdminTorneos from "./AdminTorneos";
import AdminEquipos from "./AdminEquipos";
import TablaGeneral from "./TablaGeneral";
import AdminReglamento from "./AdminReglamento";
import AdminPronosticos from "./AdminPronosticos";
import AdminAuditoria from "./AdminAuditoria";
import AdminImportar from "./AdminImportar";
import AdminParticipacion from "./AdminParticipacion";
import AdminEvidencia from "./AdminEvidencia";
import EvolucionPosiciones from "./EvolucionPosiciones";
import AdminOrganizadores from "./AdminOrganizadores";
import { API, apiFetch } from "./config/api";
import { jornadaActivaDeListado } from "./utils/jornadaActiva";
import TeamShield from "./components/TeamShield";
import { exportarCSV } from "./utils/exportCsv";

function AdminResultados({ onLogout }) {
    const [torneos, setTorneos] = useState([]);
    const [torneoId, setTorneoId] = useState("");

    const [jornada, setJornada] = useState("");
    const [jornadaId, setJornadaId] = useState(null);
    const [jornadas, setJornadas] = useState([]);
    const [partidos, setPartidos] = useState([]);
    const [marcadores, setMarcadores] = useState({});
    const [mensaje, setMensaje] = useState("");
    const [refreshRanking, setRefreshRanking] = useState(false);
    const [guardados, setGuardados] = useState({});
    const [tab, setTab] = useState("resultados");

    const token = localStorage.getItem("token");
    const [usuariosActivos, setUsuariosActivos] = useState([]);
    const [activoSeleccionado, setActivoSeleccionado] = useState(null);

    // ── Torneos ─────────────────────────────────────────────────────────
    const cargarTorneos = async () => {
        try {
            const res = await fetch(`${API}/torneos`);
            const data = await res.json();

            if (!res.ok || !Array.isArray(data)) return;

            setTorneos(data);
            if (data.length > 0) setTorneoId(data[0].id);
        } catch (error) {
            console.error("Error cargando torneos:", error);
        }
    };

    // ── Jornadas ─────────────────────────────────────────────────────────
    const cargarJornadas = async (tid) => {
        if (!tid) return;

        try {
            const res = await fetch(`${API}/jornadas?torneo_id=${tid}`);
            const data = await res.json();

            if (!res.ok || !Array.isArray(data)) {
                console.error("Error cargando jornadas:", data);
                return;
            }

            setJornadas(data);
            const activa = jornadaActivaDeListado(data);
            if (activa) setJornada(activa.numero);
        } catch (error) {
            console.error("Error cargando jornadas:", error);
        }
    };

    const cargarPartidos = async () => {
        if (!jornada) return;

        try {
            const jornadaResponse = await fetch(`${API}/jornadas/${jornada}?torneo_id=${torneoId}`);
            const jornadaData = await jornadaResponse.json();

            if (!jornadaResponse.ok || !jornadaData?.id) {
                setJornadaId(null);
                setPartidos([]);
                return;
            }

            setJornadaId(jornadaData.id);

            const response = await fetch(`${API}/partidos/${jornadaData.id}`);
            const data = await response.json();

            const lista = Array.isArray(data) ? data : [];
            setPartidos(lista);

            const resultadosExistentes = {};
            const guardadosExistentes = {};
            lista.forEach((partido) => {
                if (partido.goles_local !== null && partido.goles_visitante !== null) {
                    resultadosExistentes[partido.id] = {
                        local: String(partido.goles_local),
                        visitante: String(partido.goles_visitante),
                    };
                    guardadosExistentes[partido.id] = true;
                }
            });

            setMarcadores(resultadosExistentes);
            setGuardados(guardadosExistentes);
        } catch (error) {
            console.error(error);
        }
    };

    // ── Effects ──────────────────────────────────────────────────────────
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
        setJornada("");
        setJornadas([]);
        cargarJornadas(torneoId);
    }, [torneoId]);

    useEffect(() => {
        cargarPartidos();
    }, [jornada]);

    // ── Acciones resultados ───────────────────────────────────────────────
    const registrarResultado = async (partidoId) => {
        try {
            const marcador = marcadores[partidoId];

            if (!marcador || marcador.local === "" || marcador.local === undefined || marcador.visitante === "" || marcador.visitante === undefined) {
                setMensaje("⚠️ Ingresa el marcador primero");
                return;
            }

            const response = await fetch(`${API}/resultados/${partidoId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    goles_local: Number(marcador.local),
                    goles_visitante: Number(marcador.visitante),
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setGuardados((prev) => ({ ...prev, [partidoId]: true }));
                setMensaje("✅ " + data.mensaje);
            } else {
                setMensaje("❌ " + (data.mensaje || "Error guardando"));
            }
            setRefreshRanking((prev) => !prev);
        } catch (error) {
            console.error(error);
            setMensaje("❌ Error guardando resultado");
        }
    };

    const exportarResultados = () => {
        exportarCSV(partidos, [
            { key: "local",      label: "Local" },
            { key: "visitante",  label: "Visitante" },
            { key: "goles_local",    label: "Goles local" },
            { key: "goles_visitante", label: "Goles visitante" },
            { key: "es_comodin", label: "Comodín" },
        ], `resultados_jornada_${jornada}`);
    };

    const guardarTodosResultados = async () => {
        const entradas = Object.entries(marcadores).filter(
            ([, m]) => m.local !== "" && m.local !== undefined && m.visitante !== "" && m.visitante !== undefined
        );
        if (entradas.length === 0) { setMensaje("⚠️ No hay marcadores para guardar"); return; }
        try {
            await Promise.all(
                entradas.map(([partidoId, marcador]) =>
                    fetch(`${API}/resultados/${partidoId}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            goles_local: Number(marcador.local),
                            goles_visitante: Number(marcador.visitante),
                        }),
                    })
                )
            );
            const nuevosGuardados = {};
            entradas.forEach(([id]) => { nuevosGuardados[id] = true; });
            setGuardados((prev) => ({ ...prev, ...nuevosGuardados }));
            setMensaje("✅ Todos los resultados guardados");
            setRefreshRanking((prev) => !prev);
        } catch (error) {
            console.error(error);
            setMensaje("❌ Error guardando resultados");
        }
    };

    const actualizarMarcador = (partidoId, equipo, valor) => {
        setGuardados((prev) => ({ ...prev, [partidoId]: false }));
        setMarcadores((prev) => ({
            ...prev,
            [partidoId]: {
                ...prev[partidoId],
                [equipo]: valor, // string — permite borrar el 0 y escribir otro valor
            },
        }));
    };

    const tabs = [
        { id: "torneos", label: "Torneos 🏆" },
        { id: "organizadores", label: "Organizadores 🔑" },
        { id: "resultados", label: "Resultados" },
        { id: "jornadas", label: "Jornadas" },
        { id: "partidos", label: "Partidos" },
        { id: "usuarios", label: "Usuarios" },
        { id: "campeon", label: "Campeón 👑" },
        { id: "historico", label: "Histórico 📚" },
        { id: "pagos", label: "Pagos 💰" },
        { id: "equipos", label: "Equipos 🛡️" },
        { id: "tabla", label: "Tabla 🏆" },
        { id: "reglamento", label: "Reglamento 📋" },
        { id: "pronosticos-admin", label: "Pronósticos 🎯" },
        { id: "participacion", label: "Participación 📊" },
        { id: "evidencia", label: "Evidencia 📸" },
        { id: "evolucion", label: "Evolución 📈" },
        { id: "auditoria", label: "Auditoría 🕵️" },
        { id: "importar",  label: "Importar CSV 📥" },
    ];

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <img src="/Escudo_losTercos.png" alt="Los Tercos" className="h-28 w-auto object-contain" />
                    <h1 className="text-3xl font-bold">Panel Admin</h1>
                </div>

                <TimerJornada jornada={jornada} torneoId={torneoId} />

                {/* Usuarios activos en tiempo real */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl">
                    {usuariosActivos.length === 0 ? (
                        <span className="text-xs text-gray-400">Sin usuarios en línea</span>
                    ) : (
                        <>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">En línea</span>
                            <div className="flex -space-x-2">
                                {usuariosActivos.map((u) => {
                                    const COLORS = ["bg-rose-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-purple-500","bg-pink-500","bg-cyan-500","bg-orange-500","bg-indigo-500","bg-teal-500"];
                                    const color = COLORS[u.id % COLORS.length];
                                    const selected = activoSeleccionado === u.id;
                                    return (
                                        <div key={u.id} className="relative">
                                            <button
                                                onClick={() => setActivoSeleccionado(selected ? null : u.id)}
                                                className={`w-8 h-8 rounded-full ${color} text-white text-xs font-bold flex items-center justify-center border-2 border-white shadow-sm hover:scale-110 transition-transform ${selected ? "ring-2 ring-offset-1 ring-gray-400" : ""}`}
                                            >
                                                {u.nombre.trim()[0].toUpperCase()}
                                            </button>
                                            {selected && (
                                                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap z-20 shadow-xl">
                                                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-800 rotate-45 rounded-sm" />
                                                    {u.nombre}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-[11px] font-semibold text-green-600">{usuariosActivos.length}</span>
                        </>
                    )}
                </div>

                <div className="flex gap-2.5">
                    <button
                        onClick={onLogout}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* Selector de torneo */}
            {torneos.length > 0 && (
                <div className="mb-5 flex flex-wrap gap-4 items-center">
                    {torneos.length > 1 && (
                        <div>
                            <label className="mr-2 font-semibold">Torneo:</label>
                            <select
                                value={torneoId}
                                onChange={(e) => setTorneoId(Number(e.target.value))}
                                className="px-3 py-1.5 rounded border border-gray-300"
                            >
                                {torneos.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {torneos.length === 1 && (
                        <p className="text-sm text-gray-600 font-medium">
                            Torneo: <span className="font-bold">{torneos[0].nombre}</span>
                        </p>
                    )}
                </div>
            )}

            <hr className="my-8" />

            <div className="flex flex-wrap gap-3 mb-5">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                            tab === t.id
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-black hover:bg-gray-300"
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "resultados" && (
                <div>
                    <h2 className="mb-4 text-xl font-bold">Registrar Resultados ⚽</h2>

                    <div className="mb-5 flex items-center gap-2.5">
                        <label className="font-semibold">Seleccionar jornada:</label>
                        <select
                            value={jornada}
                            onChange={(e) => setJornada(e.target.value)}
                            className="px-3 py-1.5 rounded border border-gray-300"
                        >
                            {jornadas.map((j) => (
                                <option key={j.numero} value={j.numero}>
                                    Jornada {j.numero}
                                </option>
                            ))}
                        </select>
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b-2 border-gray-200">
                                <th className="text-left p-3 text-gray-600 font-semibold">Local</th>
                                <th className="text-left p-3 text-gray-600 font-semibold">Visitante</th>
                                <th className="text-center p-3 text-gray-600 font-semibold">Marcador</th>
                                <th className="text-center p-3 text-gray-600 font-semibold w-10">⭐</th>
                                <th className="text-center p-3 text-gray-600 font-semibold">Estado</th>
                                <th className="text-center p-3 text-gray-600 font-semibold">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {partidos.map((partido) => {
                                const marcador = marcadores[partido.id] || {};
                                const yaGuardado = guardados[partido.id];
                                const tieneValor = marcador.local !== "" && marcador.local !== undefined;

                                return (
                                    <tr
                                        key={partido.id}
                                        className={`border-b border-gray-100 transition-colors ${partido.es_comodin ? "bg-amber-50" : "hover:bg-gray-50"}`}
                                    >
                                        <td className="p-2.5 w-1/5">
                                            <div className="flex items-center gap-2">
                                                <TeamShield nombre={partido.local} escudoUrl={partido.escudo_local} color={partido.color_local} size="sm" showName={false} />
                                                <span className="font-medium">{partido.local}</span>
                                            </div>
                                        </td>
                                        <td className="p-2.5 w-1/5">
                                            <div className="flex items-center gap-2">
                                                <TeamShield nombre={partido.visitante} escudoUrl={partido.escudo_visitante} color={partido.color_visitante} size="sm" showName={false} />
                                                <span className="font-medium">{partido.visitante}</span>
                                            </div>
                                        </td>
                                        <td className="p-2.5">
                                            <div className="flex gap-2 items-center justify-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={marcador.local ?? ""}
                                                    className={`w-14 p-1.5 rounded-lg border text-center text-lg font-bold transition-colors ${yaGuardado ? "border-green-300 bg-green-50 text-green-800" : "border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"}`}
                                                    onChange={(e) => actualizarMarcador(partido.id, "local", e.target.value)}
                                                />
                                                <span className="text-gray-400 font-bold text-lg">—</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={marcador.visitante ?? ""}
                                                    className={`w-14 p-1.5 rounded-lg border text-center text-lg font-bold transition-colors ${yaGuardado ? "border-green-300 bg-green-50 text-green-800" : "border-gray-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200"}`}
                                                    onChange={(e) => actualizarMarcador(partido.id, "visitante", e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2.5 text-center">{partido.es_comodin && <span className="text-lg">⭐</span>}</td>
                                        <td className="p-2.5 text-center">
                                            {yaGuardado ? (
                                                <span className="inline-flex items-center gap-1 text-green-700 font-semibold text-sm bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                                                    ✅ Guardado
                                                </span>
                                            ) : tieneValor ? (
                                                <span className="inline-flex items-center gap-1 text-amber-700 font-semibold text-sm bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                                                    ✏️ Sin guardar
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-gray-400 text-sm bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                                                    ⏳ Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-2.5 text-center">
                                            <button
                                                onClick={() => registrarResultado(partido.id)}
                                                className={`px-4 py-1.5 rounded-lg font-semibold text-sm transition-all ${
                                                    yaGuardado
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200 border border-green-300"
                                                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                                                }`}
                                            >
                                                {yaGuardado ? "✓ Actualizar" : "💾 Guardar"}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {tab === "torneos" && (
                <AdminTorneos onTorneoChange={cargarTorneos} />
            )}
            {tab === "organizadores" && (
                <AdminOrganizadores torneos={torneos} token={token} />
            )}

            {tab === "jornadas" && (
                <AdminJornadas
                    torneoId={torneoId}
                    torneoNombre={torneos.find((t) => t.id === torneoId)?.nombre || ""}
                />
            )}
            {tab === "partidos" && <AdminPartidos torneoId={torneoId} />}
            {tab === "usuarios" && <AdminUsuarios />}
            {tab === "campeon" && <AdminCampeon torneoId={torneoId} />}
            {tab === "historico" && <HistoricoPronosticos torneoId={torneoId} />}
            {tab === "pagos" && <AdminPagos torneoId={torneoId} />}
            {tab === "equipos" && <AdminEquipos />}
            {tab === "tabla" && <TablaGeneral torneoId={torneoId} />}
            {tab === "reglamento" && <AdminReglamento torneoId={torneoId} />}
            {tab === "pronosticos-admin" && <AdminPronosticos torneoId={torneoId} />}
            {tab === "participacion" && <AdminParticipacion torneoId={torneoId} />}
            {tab === "evidencia" && <AdminEvidencia torneoId={torneoId} />}
            {tab === "evolucion" && <EvolucionPosiciones torneoId={torneoId} />}
            {tab === "auditoria" && <AdminAuditoria torneoId={torneoId} />}
            {tab === "importar"  && <AdminImportar />}

            {mensaje && <p className="mt-4 text-sm font-medium">{mensaje}</p>}
        </div>
    );
}

export default AdminResultados;
