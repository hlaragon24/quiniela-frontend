import { useEffect, useState } from "react";
import { API } from "./config/api";
import { jornadaActivaDeListado } from "./utils/jornadaActiva";

function AdminPronosticos({ torneoId }) {
  const [jornadas, setJornadas] = useState([]);
  const [jornadaId, setJornadaId] = useState("");
  const [pronosticos, setPronosticos] = useState([]);
  const [editando, setEditando] = useState(null);
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
          const activa = jornadaActivaDeListado(data);
          if (activa) setJornadaId(activa.id);
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

  const iniciarEdicion = (j) => {
    setEditando({ usuarioId: j.usuario_id, partidoId: j.partido_id });
    setEditForm({ resultado: j.resultado, marcador_local: j.marcador_local, marcador_visitante: j.marcador_visitante });
    setMensaje("");
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

  const porPartido = pronosticos.reduce((acc, p) => {
    const key = p.partido_id;
    if (!acc[key]) acc[key] = { local: p.local, visitante: p.visitante, es_comodin: p.es_comodin, jugadores: [] };
    if (p.usuario_id) acc[key].jugadores.push(p);
    return acc;
  }, {});

  const esEditando = (j) => editando?.usuarioId === j.usuario_id && editando?.partidoId === j.partido_id;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Pronósticos Admin 🎯</h2>

      <div className="mb-4 flex items-center gap-3">
        <label className="font-semibold text-sm">Jornada:</label>
        <select
          value={jornadaId}
          onChange={(e) => setJornadaId(Number(e.target.value))}
          className="px-3 py-1.5 rounded border border-gray-300 text-sm"
        >
          {jornadas.map((j) => (
            <option key={j.id} value={j.id}>Jornada {j.numero}</option>
          ))}
        </select>
      </div>

      {mensaje && <p className="mb-3 text-sm font-medium">{mensaje}</p>}

      {Object.entries(porPartido).map(([partidoId, partido]) => (
        <div key={partidoId} className="mb-5 border border-gray-200 rounded-lg overflow-hidden shadow-sm">

          {/* Header partido */}
          <div className={`px-4 py-2.5 font-bold text-sm ${partido.es_comodin ? "bg-amber-50" : "bg-gray-100"}`}>
            {partido.local} vs {partido.visitante} {partido.es_comodin ? "⭐" : ""}
          </div>

          {partido.jugadores.length === 0 ? (
            <p className="px-4 py-2 text-sm text-gray-400">Sin pronósticos registrados.</p>
          ) : (
            <>
              {/* ── MÓVIL: tarjetas ── */}
              <div className="sm:hidden divide-y divide-gray-100">
                {partido.jugadores.map((j) => (
                  <div key={`${j.usuario_id}-${j.partido_id}`} className="p-3">
                    {esEditando(j) ? (
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800 text-sm">{j.jugador}</p>
                        <div className="flex gap-2 flex-wrap items-center text-sm">
                          <select
                            value={editForm.resultado}
                            onChange={(e) => setEditForm((f) => ({ ...f, resultado: e.target.value }))}
                            className="border border-gray-300 rounded px-2 py-1 text-sm"
                          >
                            <option value="L">L</option>
                            <option value="E">E</option>
                            <option value="V">V</option>
                          </select>
                          <input type="number" min="0" value={editForm.marcador_local}
                            onChange={(e) => setEditForm((f) => ({ ...f, marcador_local: Number(e.target.value) }))}
                            className="w-12 border border-gray-300 rounded text-center p-1 text-sm" />
                          <span className="text-gray-400">-</span>
                          <input type="number" min="0" value={editForm.marcador_visitante}
                            onChange={(e) => setEditForm((f) => ({ ...f, marcador_visitante: Number(e.target.value) }))}
                            className="w-12 border border-gray-300 rounded text-center p-1 text-sm" />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={guardarEdicion} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold">Guardar</button>
                          <button onClick={() => setEditando(null)} className="bg-gray-400 text-white px-3 py-1 rounded text-xs">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{j.jugador}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            <span className="font-bold text-gray-700">{j.resultado}</span>
                            <span className="mx-1.5 text-gray-300">·</span>
                            {j.marcador_local} - {j.marcador_visitante}
                            <span className="mx-1.5 text-gray-300">·</span>
                            <span className="font-semibold text-gray-700">{j.puntos ?? "-"} pts</span>
                          </p>
                        </div>
                        <div className="flex gap-1.5 flex-shrink-0">
                          <button onClick={() => iniciarEdicion(j)}
                            className="bg-yellow-500 text-white w-8 h-8 rounded flex items-center justify-center text-sm">✏️</button>
                          <button onClick={() => eliminar(j.usuario_id, j.partido_id)}
                            className="bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center text-sm">🗑</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* ── DESKTOP: tabla ── */}
              <table className="hidden sm:table w-full text-sm">
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
                      {esEditando(j) ? (
                        <>
                          <td className="p-2 font-semibold">{j.jugador}</td>
                          <td className="p-2 text-center">
                            <select value={editForm.resultado}
                              onChange={(e) => setEditForm((f) => ({ ...f, resultado: e.target.value }))}
                              className="border border-gray-300 rounded px-1 py-0.5 text-sm">
                              <option value="L">L</option>
                              <option value="E">E</option>
                              <option value="V">V</option>
                            </select>
                          </td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <input type="number" min="0" value={editForm.marcador_local}
                                onChange={(e) => setEditForm((f) => ({ ...f, marcador_local: Number(e.target.value) }))}
                                className="w-10 border border-gray-300 rounded text-center p-0.5" />
                              <span>-</span>
                              <input type="number" min="0" value={editForm.marcador_visitante}
                                onChange={(e) => setEditForm((f) => ({ ...f, marcador_visitante: Number(e.target.value) }))}
                                className="w-10 border border-gray-300 rounded text-center p-0.5" />
                            </div>
                          </td>
                          <td className="p-2 text-center">{j.puntos ?? "-"}</td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button onClick={guardarEdicion} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs hover:bg-green-700">Guardar</button>
                              <button onClick={() => setEditando(null)} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs">Cancelar</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2 font-semibold">{j.jugador}</td>
                          <td className="p-2 text-center font-bold">{j.resultado}</td>
                          <td className="p-2 text-center">{j.marcador_local} - {j.marcador_visitante}</td>
                          <td className="p-2 text-center">{j.puntos ?? "-"}</td>
                          <td className="p-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => iniciarEdicion(j)}
                                className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs hover:bg-yellow-600">✏️</button>
                              <button onClick={() => eliminar(j.usuario_id, j.partido_id)}
                                className="bg-red-600 text-white px-2 py-0.5 rounded text-xs hover:bg-red-700">🗑</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
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
