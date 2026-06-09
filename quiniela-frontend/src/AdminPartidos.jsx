import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminPartidos({ torneoId }) {

    const [partidos, setPartidos] = useState([]);
    const [jornadas, setJornadas] = useState([]);

    const [local, setLocal] = useState("");
    const [visitante, setVisitante] = useState("");
    const [fecha, setFecha] = useState("");
    const [jornadaId, setJornadaId] = useState("");
    const [comodin, setComodin] = useState(false);

    const [editandoId, setEditandoId] = useState(null);

    const token = localStorage.getItem("token");

    const cargarJornadas = async () => {
        if (!torneoId) return;

        try {
            const res = await fetch(`${API}/jornadas?torneo_id=${torneoId}`);
            const data = await res.json();

            if (!res.ok || !Array.isArray(data)) return;

            const jornadasConId = await Promise.all(
                data.map(async (j) => {
                    try {
                        const detalleRes = await fetch(`${API}/jornadas/${j.numero}`);
                        const detalle = await detalleRes.json();
                        return { ...j, id: detalle.id ?? j.id };
                    } catch {
                        return j;
                    }
                })
            );

            setJornadas(jornadasConId);

            const activa = jornadasConId.find((j) => j.estado !== "cerrada");
            if (activa?.id) setJornadaId(activa.id);
        } catch (error) {
            console.error("Error cargando jornadas:", error);
        }
    };

    const cargarPartidos = async () => {
        try {
            const res = await fetch(`${API}/partidos`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const data = await res.json();

            const lista = Array.isArray(data) ? data : [];
            lista.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            setPartidos(lista);
        } catch (error) {
            console.error("Error cargando partidos:", error);
        }
    };

    useEffect(() => {
        cargarJornadas();
        cargarPartidos();
    }, [torneoId]);

    const guardarPartido = async () => {
        if (!local || !visitante || !jornadaId) {
            alert("Completa los campos");
            return;
        }

        const url = editandoId ? `${API}/partidos/${editandoId}` : `${API}/partidos`;
        const method = editandoId ? "PUT" : "POST";

        await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                local,
                visitante,
                fecha,
                jornada_id: Number(jornadaId),
                es_comodin: comodin,
            }),
        });

        limpiarFormulario();
        cargarPartidos();
    };

    const editarPartido = (p) => {
        setLocal(p.local);
        setVisitante(p.visitante);
        setFecha(p.fecha?.slice(0, 16));
        setJornadaId(p.jornada_id);
        setComodin(p.es_comodin);
        setEditandoId(p.id);
    };

    const eliminarPartido = async (id) => {
        if (!confirm("Eliminar partido?")) return;

        await fetch(`${API}/partidos/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        cargarPartidos();
    };

    const limpiarFormulario = () => {
        setLocal("");
        setVisitante("");
        setFecha("");
        setComodin(false);
        setEditandoId(null);
    };

    const partidosFiltrados = partidos.filter(
        (p) => Number(p.jornada_id) === Number(jornadaId)
    );

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Gestión de Partidos ⚽</h2>

            <div className="flex flex-wrap gap-2.5 mb-5">
                <input
                    placeholder="Equipo local"
                    value={local}
                    onChange={(e) => setLocal(e.target.value)}
                    className="p-2 rounded border border-gray-300"
                />

                <input
                    placeholder="Equipo visitante"
                    value={visitante}
                    onChange={(e) => setVisitante(e.target.value)}
                    className="p-2 rounded border border-gray-300"
                />

                <input
                    type="datetime-local"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="p-2 rounded border border-gray-300"
                />

                <select
                    value={jornadaId}
                    onChange={(e) => setJornadaId(Number(e.target.value))}
                    className="p-2 rounded border border-gray-300"
                >
                    <option value="">Seleccionar jornada</option>
                    {jornadas.map((j) => (
                        <option key={j.id || j.numero} value={j.id || ""}>
                            Jornada {j.numero}
                            {j.estado === "cerrada"
                                ? " 🔒"
                                : new Date() < new Date(j.fecha_inicio)
                                ? " 🟢"
                                : new Date() > new Date(j.fecha_inicio) &&
                                  new Date() < new Date(j.fecha_cierre)
                                ? " 🟡"
                                : ""}
                        </option>
                    ))}
                </select>

                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={comodin}
                        onChange={() => setComodin(!comodin)}
                    />
                    ⭐ Comodín
                </label>

                <button
                    onClick={guardarPartido}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                >
                    {editandoId ? "✏️ Actualizar partido" : "➕ Crear partido"}
                </button>

                {editandoId && (
                    <button
                        onClick={limpiarFormulario}
                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                    >
                        Cancelar edición
                    </button>
                )}
            </div>

            <hr className="mb-4" />

            <h3 className="text-lg font-semibold mb-3">Partidos de la jornada</h3>

            {!jornadaId ? (
                <p className="text-gray-500">Selecciona una jornada</p>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="text-left p-3 border-b-2 border-gray-300">Local</th>
                            <th className="text-left p-3 border-b-2 border-gray-300">Visitante</th>
                            <th className="text-left p-3 border-b-2 border-gray-300">Fecha</th>
                            <th className="text-center p-3 border-b-2 border-gray-300">⭐</th>
                            <th className="text-left p-3 border-b-2 border-gray-300">Acciones</th>
                        </tr>
                    </thead>

                    <tbody>
                        {partidosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="p-3 text-gray-500">
                                    Sin partidos registrados
                                </td>
                            </tr>
                        ) : (
                            partidosFiltrados.map((p) => (
                                <tr key={p.id} className="border-b border-gray-100">
                                    <td className="p-2.5">{p.local}</td>
                                    <td className="p-2.5">{p.visitante}</td>
                                    <td className="p-2.5">{new Date(p.fecha).toLocaleString()}</td>
                                    <td className="p-2.5 text-center">{p.es_comodin ? "⭐" : ""}</td>
                                    <td className="p-2.5 flex gap-1.5">
                                        <button
                                            onClick={() => editarPartido(p)}
                                            className="bg-yellow-500 text-white px-3 py-1.5 rounded hover:bg-yellow-600"
                                        >
                                            ✏️ Editar
                                        </button>
                                        <button
                                            onClick={() => eliminarPartido(p.id)}
                                            className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
                                        >
                                            🗑 Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminPartidos;
