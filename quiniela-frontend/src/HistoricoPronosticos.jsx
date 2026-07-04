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

            const url = `${API}/pronosticos/historico-general?torneo_id=${torneoId}`;
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            if (res.ok && Array.isArray(data)) {
                setDatos(data);
            }
        } catch (error) {
            console.error("Error cargando histórico:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarHistorico();
    }, [torneoId]);

    const jornadas = useMemo(() => {
        return [...new Set(datos.map((d) => d.jornada_numero))].sort(
            (a, b) => Number(a) - Number(b)
        );
    }, [datos]);

    const jugadores = useMemo(() => {
        return [...new Set(datos.map((d) => d.jugador))].sort();
    }, [datos]);

    const registros = useMemo(() => {
        return datos
            .filter((item) => {
                const cumpleJornada =
                    jornadaFiltro === "todos" ||
                    String(item.jornada_numero) === jornadaFiltro;

                const cumpleJugador =
                    jugadorFiltro === "todos" || item.jugador === jugadorFiltro;

                return cumpleJornada && cumpleJugador;
            })
            .sort((a, b) =>
                Number(a.jornada_numero) - Number(b.jornada_numero) ||
                a.partido_id - b.partido_id ||
                a.jugador.localeCompare(b.jugador)
            );
    }, [datos, jornadaFiltro, jugadorFiltro]);

    const obtenerResultadoTexto = (fila) => {
        if (fila.goles_local === null || fila.goles_visitante === null) return "-";
        return `${fila.goles_local} - ${fila.goles_visitante}`;
    };

    if (cargando) {
        return <div className="mt-5 text-gray-500">Cargando histórico...</div>;
    }

    return (
        <div className="mt-5">
            <h2 className="text-xl font-bold mb-5">Histórico General de Pronósticos 📚</h2>

            <div className="flex flex-wrap gap-3 mb-5">
                <select
                    value={jornadaFiltro}
                    onChange={(e) => setJornadaFiltro(e.target.value)}
                    className="px-3 py-2 rounded border border-gray-300"
                >
                    <option value="todos">Todas las jornadas</option>
                    {jornadas.map((j) => (
                        <option key={j} value={j}>Jornada {j}</option>
                    ))}
                </select>

                <select
                    value={jugadorFiltro}
                    onChange={(e) => setJugadorFiltro(e.target.value)}
                    className="px-3 py-2 rounded border border-gray-300"
                >
                    <option value="todos">Todos los jugadores</option>
                    {jugadores.map((j) => (
                        <option key={j} value={j}>{j}</option>
                    ))}
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-center p-3 border-b-2 border-gray-300">Jornada</th>
                            <th className="text-left p-3 border-b-2 border-gray-300">Jugador</th>
                            <th className="text-left p-3 border-b-2 border-gray-300">Partido</th>
                            <th className="text-center p-3 border-b-2 border-gray-300">Pronóstico L,E,V</th>
                            <th className="text-center p-3 border-b-2 border-gray-300">Marcador</th>
                            <th className="text-center p-3 border-b-2 border-gray-300">Resultado</th>
                            <th className="text-center p-3 border-b-2 border-gray-300">Puntos</th>
                        </tr>
                    </thead>

                    <tbody>
                        {registros.map((fila) => {
                            const sinResultado = fila.goles_local === null || fila.goles_visitante === null;
                            const marcadorExacto = !sinResultado &&
                                Number(fila.pronostico_local) === Number(fila.goles_local) &&
                                Number(fila.pronostico_visitante) === Number(fila.goles_visitante);
                            const acerto = !sinResultado && Number(fila.puntos_calculados) > 0;

                            const rowBg = sinResultado
                                ? "hover:bg-gray-50"
                                : marcadorExacto
                                    ? "bg-green-50"
                                    : acerto
                                        ? "bg-yellow-50"
                                        : "bg-red-50";

                            return (
                            <tr
                                key={`${fila.usuario_id}-${fila.partido_id}`}
                                className={`border-b border-gray-200 ${rowBg}`}
                            >
                                <td className="text-center p-2.5">J{fila.jornada_numero}</td>
                                <td className="p-2.5">{fila.jugador}</td>
                                <td className="p-2.5">
                                    {fila.local} vs {fila.visitante}
                                    {fila.es_comodin && <span className="ml-1.5">⭐</span>}
                                </td>
                                <td className="text-center p-2.5">
                                    <strong>{fila.pronostico_resultado}</strong>
                                </td>
                                <td className="text-center p-2.5">
                                    {fila.pronostico_local} - {fila.pronostico_visitante}
                                </td>
                                <td className="text-center p-2.5">{obtenerResultadoTexto(fila)}</td>
                                <td className="text-center p-2.5">
                                    <strong>{fila.puntos_calculados}</strong>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {registros.length === 0 && (
                <p className="mt-5 text-gray-500">No hay registros para los filtros seleccionados.</p>
            )}
        </div>
    );
}

export default HistoricoPronosticos;
