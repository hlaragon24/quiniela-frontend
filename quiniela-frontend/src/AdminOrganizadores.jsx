import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminOrganizadores({ torneos, token }) {
  const [torneoId, setTorneoId] = useState("");
  const [organizadores, setOrganizadores] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [usuarioId, setUsuarioId] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const flash = (msg) => { setMensaje(msg); setTimeout(() => setMensaje(""), 4000); };

  useEffect(() => {
    if (torneos.length > 0 && !torneoId) setTorneoId(torneos[0].id);
  }, [torneos]);

  useEffect(() => {
    if (!torneoId) return;
    cargarOrganizadores();
  }, [torneoId]);

  useEffect(() => {
    fetch(`${API}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setTodosUsuarios(data.filter(u => u.rol === "organizer"));
      })
      .catch(console.error);
  }, []);

  const cargarOrganizadores = async () => {
    if (!torneoId) return;
    setCargando(true);
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/organizadores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setOrganizadores(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setCargando(false); }
  };

  const asignar = async () => {
    if (!usuarioId) { flash("⚠️ Selecciona un organizador"); return; }
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/organizadores/${usuarioId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      flash(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) { setUsuarioId(""); await cargarOrganizadores(); }
    } catch { flash("❌ Error de conexión"); }
  };

  const remover = async (uid, nombre) => {
    if (!window.confirm(`¿Remover a ${nombre} como organizador de este torneo?`)) return;
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/organizadores/${uid}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      flash(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) await cargarOrganizadores();
    } catch { flash("❌ Error de conexión"); }
  };

  const organizadoresSinAsignar = todosUsuarios.filter(
    u => !organizadores.some(o => o.id === u.id)
  );

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Organizadores por torneo 🔑</h2>
      <p className="text-sm text-gray-500 mb-5">
        Los organizadores tienen acceso a capturar resultados, ver pronósticos, participación y gestionar jugadores del torneo asignado.
      </p>

      {mensaje && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-semibold border ${
          mensaje.startsWith("✅") ? "bg-green-50 text-green-700 border-green-200"
          : mensaje.startsWith("⚠") ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : "bg-red-50 text-red-700 border-red-200"
        }`}>{mensaje}</div>
      )}

      <div className="mb-5 flex items-center gap-3">
        <label className="font-semibold text-sm">Torneo:</label>
        <select value={torneoId} onChange={e => setTorneoId(Number(e.target.value))}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm">
          {torneos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
        </select>
      </div>

      {/* Asignar */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <h3 className="font-semibold text-blue-800 mb-3 text-sm">Asignar organizador a este torneo</h3>
        {organizadoresSinAsignar.length === 0 ? (
          <p className="text-sm text-blue-600 opacity-70">
            No hay usuarios con rol <strong>organizer</strong> disponibles.<br />
            Créalos en la pestaña <strong>Usuarios</strong> con rol "Organizador".
          </p>
        ) : (
          <div className="flex gap-2 items-center">
            <select value={usuarioId} onChange={e => setUsuarioId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm flex-1 max-w-xs">
              <option value="">— Selecciona un organizador —</option>
              {organizadoresSinAsignar.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
              ))}
            </select>
            <button onClick={asignar}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Asignar ➕
            </button>
          </div>
        )}
      </div>

      {/* Lista */}
      <h3 className="font-semibold text-sm mb-3">
        Organizadores actuales {cargando ? "(cargando...)" : `(${organizadores.length})`}
      </h3>
      {organizadores.length === 0 ? (
        <p className="text-sm text-gray-400">Este torneo no tiene organizadores asignados.</p>
      ) : (
        <div className="space-y-2">
          {organizadores.map(o => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-xl bg-white">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{o.nombre}</p>
                <p className="text-xs text-gray-400">{o.email}</p>
              </div>
              <button onClick={() => remover(o.id, o.nombre)}
                className="text-xs px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-semibold">
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrganizadores;
