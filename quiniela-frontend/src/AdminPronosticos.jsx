import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminPronosticos({ torneoId }) {
  const [jornadas, setJornadas] = useState([]);
  const [jornadaId, setJornadaId] = useState("");
  const [pronosticos, setPronosticos] = useState([]);
  const [editando, setEditando] = useState(null); // { usuarioId, partidoId }
  const [editForm, setEditForm] = useState({ resultado: "L", marcador_local: 0, marcador_visitante: 0 });
  const [mensaje, setMensaje] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!torneoId) return;
    fetch(`${API}/jornadas?torneo_id=${torneoId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setJornadas(data);
          if (data.length > 0) setJornadaId(data[0].id);
        }
      })
      .catch(console.error);
  }, [torneoId]);

  const cargarPronosticos = async () => {
    if (!jornadaId) return;
    try {
      const res = await fetch(`${API}/pronosticos/admin/jornada/${jornadaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setPronosticos(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargarPronosticos(); }, [jornadaId]);

  const eliminar = async (usuarioId, partidoId) => {
    if (!window.confirm("¿Eliminar este pronóstico?")) return;
    try {
      const res = await fetch(`${API}/pronosticos/admin/${usuarioId}/partido/${partidoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) await cargarPronosticos();
    } catch { setMensaje("❌ Error de conexión"); }
  };

  const guardarEdicion = async () => {
    if (!editando) return;
    try {
      const res = await fetch(`${API}/pronosticos/admin/${editando.usuarioId}/partido/${editando.partidoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) { setEditando(null); await cargarPronosticos(); }
    } catch { setMensaje("❌ Error de conexión"); }
  };

  // Agrupar por partido
  const porPartido = pronosticos.reduce((acc, p) => {
    const key = p.partido_id;
    if (!acc[key]) acc[key] = { local: p.local, visitante: p.visitante, es_comodin: p.es_comodin, jugadores: [] };
    if (p.usuario_id) acc[key].jugadores.push(p);
    return acc;
  }, {});

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pronósticos Admin 🎯</h2>

      <div className="mb-4 flex items-center gap-3">
        <label className="font-semibold text-sm">Jornada:</label>
        <select
          value={jornadaId}
          onChange={(e) => setJornadaId(Number(e.target.value))}
          className="px-3 py-1.5 rounded border border-gray-300"
        >
          {jornadas.map((j) => (
            <option key={j.id} value={j.id}>Jornada {j.numero}</option>
          ))}
        </select>
      </div>

      {mensaje && <p className="mb-3 text-sm font-medium">{mensaje}</p>}

      {Object.entries(porPartido).map(([partidoId, partido]) => (
        <div key={partidoId} className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
          <div className={`px-4 py-2 font-bold text-sm ${partido.es_comodin ? "bg-orange-100" : "bg-gray-100"}`}>
            {partido.local} vs {partido.visitante} {partido.es_comodin ? "⭐" : ""}
          </div>

          {partido.jugadores.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-400">Sin pronósticos registrados.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">Jugador</th>
                  <th className="p-2 text-center">Resultado</th>
                  <th className="p-2 text-center">Marcador</th>
                  <th className="p-2 text-center">Puntos</th>
                  <th className="p-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {partido.jugadores.map((j) => (
                  <tr key={`${j.usuario_id}-${j.partido_id}`} className="border-t border-gray-100">
                    {editando?.usuarioId === j.usuario_id && editando?.partidoId === j.partido_id ? (
                      <>
                        <td className="p-2 font-semibold">{j.jugador}</td>
                        <td className="p-2 text-center">
                          <select
                            value={editForm.resultado}
                            onChange={(e) => setEditForm((f) => ({ ...f, resultado: e.target.value }))}
                            className="border border-gray-300 rounded px-1 py-0.5 text-sm"
                          >
                            <option value="L">L</option>
                            <option value="E">E</option>
                            <option value="V">V</option>
                          </select>
                        </td>
                        <td className="p-2 text-center flex gap-1 justify-center">
                          <input type="number" min="0" value={editForm.marcador_local} onChange={(e) => setEditForm((f) => ({ ...f, marcador_local: Number(e.target.value) }))} className="w-10 border border-gray-300 rounded text-center p-0.5" />
                          <span>-</span>
                          <input type="number" min="0" value={editForm.marcador_visitante} onChange={(e) => setEditForm((f) => ({ ...f, marcador_visitante: Number(e.target.value) }))} className="w-10 border border-gray-300 rounded text-center p-0.5" />
                        </td>
                        <td className="p-2 text-center">{j.puntos ?? "-"}</td>
                        <td className="p-2 text-center flex gap-1 justify-center">
                          <button onClick={guardarEdicion} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-700">Guardar</button>
                          <button onClick={() => setEditando(null)} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs">Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 font-semibold">{j.jugador}</td>
                        <td className="p-2 text-center font-bold">{j.resultado}</td>
                        <td className="p-2 text-center">{j.marcador_local} - {j.marcador_visitante}</td>
                        <td className="p-2 text-center">{j.puntos ?? "-"}</td>
                        <td className="p-2 text-center flex gap-1 justify-center">
                          <button
                            onClick={() => { setEditando({ usuarioId: j.usuario_id, partidoId: j.partido_id }); setEditForm({ resultado: j.resultado, marcador_local: j.marcador_local, marcador_visitante: j.marcador_visitante }); setMensaje(""); }}
                            className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs hover:bg-yellow-600"
                          >✏️</button>
                          <button onClick={() => eliminar(j.usuario_id, j.partido_id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-xs hover:bg-red-700">🗑</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}

      {Object.keys(porPartido).length === 0 && (
        <p className="text-gray-500 text-sm">No hay partidos en esta jornada.</p>
      )}
    </div>
  );
}

export default AdminPronosticos;
