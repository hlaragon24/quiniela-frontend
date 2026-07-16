import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

function HistoricoPronosticos({ torneoId }) {
    const [datos, setDatos] = useState([]);
    const [jornadaFiltro, setJornadaFiltro] = useState("todos");
    const [jugadorFiltro, setJugadorFiltro] = useState("todos");
    const [cargando, setCargando] = useState(true);

    const token = localStorage.getItem("token");

    const cargarHistorico = async () => {
        if (!torneoId) return;
        try {
            setCargando(true);
            const res = await fetch(`${API}/pronosticos/historico-general?torneo_id=${torneoId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setDatos(data);
        } catch (error) {
            console.error("Error cargando histórico:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarHistorico(); }, [torneoId]);

    const jornadas = useMemo(() =>
        [...new Set(datos.map((d) => d.jornada_numero))].sort((a, b) => Number(a) - Number(b)),
    [datos]);

    const jugadores = useMemo(() =>
        [...new Set(datos.map((d) => d.jugador))].sort(),
    [datos]);

    const registrosFiltrados = useMemo(() =>
        datos.filter((item) => {
            const cumpleJornada = jornadaFiltro === "todos" || String(item.jornada_numero) === jornadaFiltro;
            const cumpleJugador = jugadorFiltro === "todos" || item.jugador === jugadorFiltro;
            return cumpleJornada && cumpleJugador;
        }),
    [datos, jornadaFiltro, jugadorFiltro]);

    // Agrupar por jornada → partido
    const porJornada = useMemo(() => {
        const acc = {};
        registrosFiltrados.forEach((fila) => {
            const jKey = fila.jornada_numero;
            if (!acc[jKey]) acc[jKey] = {};
            const pKey = fila.partido_id;
            if (!acc[jKey][pKey]) {
                acc[jKey][pKey] = {
                    local: fila.local,
                    visitante: fila.visitante,
                    es_comodin: fila.es_comodin,
                    goles_local: fila.goles_local,
                    goles_visitante: fila.goles_visitante,
                    jugadores: [],
                };
            }
            acc[jKey][pKey].jugadores.push(fila);
        });
        return acc;
    }, [registrosFiltrados]);

    const jornadasOrdenadas = useMemo(() =>
        Object.keys(porJornada).sort((a, b) => Number(a) - Number(b)),
    [porJornada]);

    const rowColor = (fila) => {
        const sinResultado = fila.goles_local === null || fila.goles_visitante === null;
        if (sinResultado) return "";
        const exacto =
            Number(fila.pronostico_local) === Number(fila.goles_local) &&
            Number(fila.pronostico_visitante) === Number(fila.goles_visitante);
        if (exacto) return "bg-green-50";
        if (Number(fila.puntos_calculados) > 0) return "bg-yellow-50";
        return "bg-red-50";
    };

    const resultadoReal = (p) =>
        p.goles_local !== null ? `${p.goles_local} - ${p.goles_visitante}` : "—";

    if (cargando) return <div className="mt-5 text-gray-500">Cargando histórico...</div>;

    return (
        <div className="mt-5">
            <h2 className="text-xl font-bold mb-5">Histórico General de Pronósticos 📚</h2>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-5">
                <select
                    value={jornadaFiltro}
                    onChange={(e) => setJornadaFiltro(e.target.value)}
                    className="px-3 py-2 rounded border border-gray-300 text-sm"
                >
                    <option value="todos">Todas las jornadas</option>
                    {jornadas.map((j) => (
                        <option key={j} value={j}>Jornada {j}</option>
                    ))}
                </select>

                <select
                    value={jugadorFiltro}
                    onChange={(e) => setJugadorFiltro(e.target.value)}
                    className="px-3 py-2 rounded border border-gray-300 text-sm"
                >
                    <option value="todos">Todos los jugadores</option>
                    {jugadores.map((j) => (
                        <option key={j} value={j}>{j}</option>
                    ))}
                </select>
            </div>

            {jornadasOrdenadas.length === 0 && (
                <p className="text-gray-500 text-sm">No hay registros para los filtros seleccionados.</p>
            )}

            {jornadasOrdenadas.map((jNum) => (
                <div key={jNum} className="mb-8">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">
                        Jornada {jNum}
                    </h3>

                    {Object.entries(porJornada[jNum]).map(([partidoId, partido]) => (
                        <div key={partidoId} className="mb-4 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            {/* Header del partido */}
                            <div className={`px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 ${partido.es_comodin ? "bg-amber-50 border-b border-amber-100" : "bg-gray-50 border-b border-gray-200"}`}>
                                <span className="font-bold text-sm text-gray-800">
                                    {partido.local} vs {partido.visitante}
                                    {partido.es_comodin && <span className="ml-2 text-amber-600">⭐ comodín</span>}
                                </span>
                                <span className="text-xs sm:text-sm font-semibold text-gray-500">
                                    Resultado: <strong className="text-gray-700">{resultadoReal(partido)}</strong>
                                </span>
                            </div>

                            {/* Jugadores */}
                            {partido.jugadores.length === 0 ? (
                                <p className="px-4 py-2 text-sm text-gray-400">Sin pronósticos registrados.</p>
                            ) : (
                                <>
                                    {/* ── MÓVIL: tarjetas ── */}
                                    <div className="sm:hidden divide-y divide-gray-100">
                                        {partido.jugadores
                                            .sort((a, b) => a.jugador.localeCompare(b.jugador))
                                            .map((fila) => (
                                            <div
                                                key={`${fila.usuario_id}-${fila.partido_id}`}
                                                className={`px-3 py-2.5 ${rowColor(fila)}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-semibold text-gray-800 text-sm truncate">{fila.jugador}</span>
                                                    <span className="font-bold text-gray-700 text-sm ml-2 flex-shrink-0">
                                                        {fila.puntos_calculados ?? "—"} pts
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    <span className="font-bold text-gray-700">{fila.pronostico_resultado}</span>
                                                    <span className="mx-1.5 text-gray-300">·</span>
                                                    {fila.pronostico_local} - {fila.pronostico_visitante}
                                                </p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ── DESKTOP: tabla ── */}
                                    <table className="hidden sm:table w-full text-sm">
                                        <thead className="bg-white">
                                            <tr className="border-b border-gray-100">
                                                <th className="p-2.5 text-left text-gray-600 font-semibold">Jugador</th>
                                                <th className="p-2.5 text-center text-gray-600 font-semibold">Resultado</th>
                                                <th className="p-2.5 text-center text-gray-600 font-semibold">Marcador</th>
                                                <th className="p-2.5 text-center text-gray-600 font-semibold">Puntos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {partido.jugadores
                                                .sort((a, b) => a.jugador.localeCompare(b.jugador))
                                                .map((fila) => (
                                                <tr
                                                    key={`${fila.usuario_id}-${fila.partido_id}`}
                                                    className={`border-t border-gray-100 ${rowColor(fila)}`}
                                                >
                                                    <td className="p-2.5 font-medium text-gray-800">{fila.jugador}</td>
                                                    <td className="p-2.5 text-center font-bold">{fila.pronostico_resultado}</td>
                                                    <td className="p-2.5 text-center">
                                                        {fila.pronostico_local} - {fila.pronostico_visitante}
                                                    </td>
                                                    <td className="p-2.5 text-center font-bold">
                                                        {fila.puntos_calculados ?? "—"}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default HistoricoPronosticos;
