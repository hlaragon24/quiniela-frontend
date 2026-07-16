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
import AdminOrganizadores from "./AdminOrganizadores";
import { API } from "./config/api";
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
    const [tab, setTab] = useState("resultados");

    const token = localStorage.getItem("token");

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
            if (data.length > 0) setJornada(data[0].numero);
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
            lista.forEach((partido) => {
                if (partido.goles_local !== null && partido.goles_visitante !== null) {
                    resultadosExistentes[partido.id] = {
                        local: partido.goles_local,
                        visitante: partido.goles_visitante,
                    };
                }
            });

            setMarcadores(resultadosExistentes);
        } catch (error) {
            console.error(error);
        }
    };

    // ── Effects ──────────────────────────────────────────────────────────
    useEffect(() => {
        cargarTorneos();
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

            if (!marcador) {
                setMensaje("Ingresa el marcador primero");
                return;
            }

            const response = await fetch(`${API}/resultados/${partidoId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    goles_local: marcador.local ?? 0,
                    goles_visitante: marcador.visitante ?? 0,
                }),
            });

            const data = await response.json();
            setMensaje(data.mensaje);
            setRefreshRanking((prev) => !prev);
        } catch (error) {
            console.error(error);
            setMensaje("Error guardando resultado");
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
        try {
            const promesas = Object.entries(marcadores).map(([partidoId, marcador]) =>
                fetch(`${API}/resultados/${partidoId}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        goles_local: marcador.local ?? 0,
                        goles_visitante: marcador.visitante ?? 0,
                    }),
                })
            );

            await Promise.all(promesas);
            setMensaje("Resultados guardados correctamente");
            setRefreshRanking((prev) => !prev);
        } catch (error) {
            console.error(error);
            setMensaje("Error guardando resultados");
        }
    };

    const actualizarMarcador = (partidoId, equipo, valor) => {
        setMarcadores((prev) => ({
            ...prev,
            [partidoId]: {
                ...prev[partidoId],
                [equipo]: Number(valor),
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
        { id: "auditoria", label: "Auditoría 🕵️" },
        { id: "importar",  label: "Importar CSV 📥" },
    ];

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Panel Admin ⚙️</h1>

                <TimerJornada jornada={jornada} torneoId={torneoId} />

                <div className="flex gap-2.5">
                    <button
                        onClick={exportarResultados}
                        disabled={partidos.length === 0}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-40"
                    >
                        ⬇ CSV
                    </button>
                    <button
                        onClick={guardarTodosResultados}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                    >
                        Guardar todos
                    </button>

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
                            <tr className="bg-gray-100">
                                <th className="text-left p-3 border-b-2 border-gray-300">Local</th>
                                <th className="text-left p-3 border-b-2 border-gray-300">Visitante</th>
                                <th className="text-left p-3 border-b-2 border-gray-300">Resultado</th>
                                <th className="text-left p-3 border-b-2 border-gray-300">⭐</th>
                                <th className="text-left p-3 border-b-2 border-gray-300">Estado</th>
                                <th className="text-left p-3 border-b-2 border-gray-300">Acción</th>
                            </tr>
                        </thead>

                        <tbody>
                            {partidos.map((partido) => {
                                const marcador = marcadores[partido.id] || {};

                                return (
                                    <tr
                                        key={partido.id}
                                        className={`border-b border-gray-100 ${partido.es_comodin ? "bg-orange-50" : ""}`}
                                    >
                                        <td className="p-2.5 w-1/5">
                                            <div className="flex items-center gap-2">
                                                <TeamShield nombre={partido.local} escudoUrl={partido.escudo_local} color={partido.color_local} size="sm" showName={false} />
                                                {partido.local}
                                            </div>
                                        </td>
                                        <td className="p-2.5 w-1/5">
                                            <div className="flex items-center gap-2">
                                                <TeamShield nombre={partido.visitante} escudoUrl={partido.escudo_visitante} color={partido.color_visitante} size="sm" showName={false} />
                                                {partido.visitante}
                                            </div>
                                        </td>
                                        <td className="p-2.5">
                                            <div className="flex gap-1.5 items-center">
                                                <input
                                                    type="number"
                                                    value={marcador.local ?? ""}
                                                    className="w-14 p-1.5 rounded border border-gray-300 text-center"
                                                    onChange={(e) => actualizarMarcador(partido.id, "local", e.target.value)}
                                                />
                                                <span>-</span>
                                                <input
                                                    type="number"
                                                    value={marcador.visitante ?? ""}
                                                    className="w-14 p-1.5 rounded border border-gray-300 text-center"
                                                    onChange={(e) => actualizarMarcador(partido.id, "visitante", e.target.value)}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2.5 text-center">{partido.es_comodin && "⭐"}</td>
                                        <td className="p-2.5">
                                            {marcador.local !== undefined ? "✅ guardado" : "⚪ pendiente"}
                                        </td>
                                        <td className="p-2.5">
                                            <button
                                                onClick={() => registrarResultado(partido.id)}
                                                className="bg-blue-600 text-white px-3.5 py-1.5 rounded font-semibold hover:bg-blue-700"
                                            >
                                                Guardar
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
            {tab === "auditoria" && <AdminAuditoria torneoId={torneoId} />}
            {tab === "importar"  && <AdminImportar />}

            {mensaje && <p className="mt-4 text-sm font-medium">{mensaje}</p>}
        </div>
    );
}

export default AdminResultados;
