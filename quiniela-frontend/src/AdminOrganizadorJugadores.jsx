import { useEffect, useState, useCallback } from "react";
import { API } from "./config/api";

function AdminOrganizadorJugadores({ torneoId }) {
  const [jugadores, setJugadores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creando, setCreando] = useState(false);

  const [resetId, setResetId] = useState(null);
  const [resetPassword, setResetPassword] = useState("");

  const token = localStorage.getItem("token");

  const cargar = useCallback(async () => {
    if (!torneoId) return;
    setCargando(true);
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/jugadores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setJugadores(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [torneoId, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const flash = (msg) => {
    setMensaje(msg);
    setTimeout(() => setMensaje(""), 4000);
  };

  const crearJugador = async (e) => {
    e.preventDefault();
    setCreando(true);
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/jugadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        flash(`✅ ${data.mensaje}`);
        setNombre(""); setEmail(""); setPassword("");
        await cargar();
      } else {
        flash(`❌ ${data.mensaje}`);
      }
    } catch {
      flash("❌ Error de conexión");
    } finally {
      setCreando(false);
    }
  };

  const remover = async (usuarioId, nombreJugador) => {
    if (!window.confirm(`¿Remover a ${nombreJugador} del torneo?`)) return;
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/jugadores/${usuarioId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      flash(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) await cargar();
    } catch {
      flash("❌ Error de conexión");
    }
  };

  const resetearPassword = async (usuarioId) => {
    if (!resetPassword || resetPassword.length < 6) {
      flash("❌ La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      const res = await fetch(`${API}/organizador/torneos/${torneoId}/jugadores/${usuarioId}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json();
      flash(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) { setResetId(null); setResetPassword(""); }
    } catch {
      flash("❌ Error de conexión");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold">Jugadores del torneo 👥</h2>
        <button onClick={cargar} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600">
          🔄 Actualizar
        </button>
      </div>

      {mensaje && (
        <div className={`mb-4 px-4 py-2.5 rounded-lg text-sm font-semibold ${
          mensaje.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        }`}>
          {mensaje}
        </div>
      )}

      {/* Formulario crear */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
        <h3 className="font-semibold text-blue-800 mb-3">Agregar jugador</h3>
        <form onSubmit={crearJugador} className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Nombre</label>
            <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre completo"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-44" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-48" required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-40" required minLength={6} />
          </div>
          <button type="submit" disabled={creando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-60">
            {creando ? "Agregando..." : "Agregar ➕"}
          </button>
        </form>
        <p className="text-xs text-blue-600 mt-2 opacity-70">
          Si el email ya existe en el sistema, el jugador se agrega al torneo con su cuenta actual.
        </p>
      </div>

      {/* Lista de jugadores */}
      {cargando ? (
        <p className="text-gray-500 text-sm">Cargando jugadores...</p>
      ) : jugadores.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay jugadores asignados a este torneo aún.</p>
      ) : (
        <div className="space-y-2">
          {jugadores.map(j => (
            <div key={j.id} className="border border-gray-200 rounded-xl bg-white">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{j.nombre}</p>
                  <p className="text-xs text-gray-400 truncate">{j.email}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setResetId(resetId === j.id ? null : j.id); setResetPassword(""); }}
                    className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 hover:bg-yellow-200 font-semibold"
                  >
                    🔑 Contraseña
                  </button>
                  <button
                    onClick={() => remover(j.id, j.nombre)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 font-semibold"
                  >
                    Remover
                  </button>
                </div>
              </div>
              {resetId === j.id && (
                <div className="px-4 pb-3 pt-0 border-t border-gray-100 flex gap-2 items-center">
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={e => setResetPassword(e.target.value)}
                    placeholder="Nueva contraseña (mín. 6 chars)"
                    className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-lg"
                  />
                  <button
                    onClick={() => resetearPassword(j.id)}
                    className="text-sm px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => { setResetId(null); setResetPassword(""); }}
                    className="text-sm px-3 py-1.5 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOrganizadorJugadores;
