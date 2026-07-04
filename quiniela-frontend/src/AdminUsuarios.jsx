import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [torneos, setTorneos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);
  const [expandido, setExpandido] = useState(null); // usuario_id expandido
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [mensajeEdicion, setMensajeEdicion] = useState("");
  const [torneosUsuario, setTorneosUsuario] = useState({}); // { usuario_id: [torneos] }
  const [torneoParaAgregar, setTorneoParaAgregar] = useState({});
  const [mensajeTorneos, setMensajeTorneos] = useState({});

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("jugador");

  const token = localStorage.getItem("token");

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) { alert(data.mensaje || "Error cargando usuarios"); return; }
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const cargarTorneos = async () => {
    try {
      const res = await fetch(`${API}/torneos`);
      const data = await res.json();
      if (Array.isArray(data)) setTorneos(data);
    } catch (error) {
      console.error("Error cargando torneos:", error);
    }
  };

  useEffect(() => {
    cargarUsuarios();
    cargarTorneos();
  }, []);

  // ── Torneos por usuario ───────────────────────────────────────────────
  const cargarTorneosUsuario = async (usuarioId) => {
    try {
      const res = await fetch(`${API}/usuarios/${usuarioId}/torneos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTorneosUsuario((prev) => ({
        ...prev,
        [usuarioId]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      console.error("Error cargando torneos del usuario:", error);
    }
  };

  const toggleExpandido = async (usuarioId) => {
    if (expandido === usuarioId) {
      setExpandido(null);
      return;
    }
    setExpandido(usuarioId);
    await cargarTorneosUsuario(usuarioId);
    setTorneoParaAgregar((prev) => ({ ...prev, [usuarioId]: "" }));
  };

  const agregarTorneoAUsuario = async (usuarioId) => {
    const tid = torneoParaAgregar[usuarioId];
    if (!tid) {
      setMensajeTorneos((prev) => ({ ...prev, [usuarioId]: "⚠ Selecciona un torneo" }));
      return;
    }

    try {
      const res = await fetch(`${API}/usuarios/${usuarioId}/torneos/${tid}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensajeTorneos((prev) => ({
        ...prev,
        [usuarioId]: res.ok ? `✅ ${data.mensaje || "Torneo asignado"}` : `❌ ${data.mensaje || "Error"}`,
      }));
      if (res.ok) await cargarTorneosUsuario(usuarioId);
    } catch (error) {
      console.error(error);
      setMensajeTorneos((prev) => ({ ...prev, [usuarioId]: "❌ Error de conexión" }));
    }
  };

  const quitarTorneoDeUsuario = async (usuarioId, torneoId) => {
    if (!window.confirm("¿Quitar al usuario de este torneo?")) return;

    try {
      const res = await fetch(`${API}/usuarios/${usuarioId}/torneos/${torneoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensajeTorneos((prev) => ({
        ...prev,
        [usuarioId]: res.ok ? `✅ ${data.mensaje || "Torneo removido"}` : `❌ ${data.mensaje || "Error"}`,
      }));
      if (res.ok) await cargarTorneosUsuario(usuarioId);
    } catch (error) {
      console.error(error);
      setMensajeTorneos((prev) => ({ ...prev, [usuarioId]: "❌ Error de conexión" }));
    }
  };

  // ── CRUD usuarios ─────────────────────────────────────────────────────
  const limpiarFormulario = () => {
    setNombre(""); setEmail(""); setPassword(""); setRol("jugador");
  };

  const crearUsuario = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !rol) {
      alert("Completa todos los campos"); return;
    }
    if (password.length < 6) { alert("La contraseña debe tener al menos 6 caracteres"); return; }

    try {
      setCreando(true);
      const response = await fetch(`${API}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: nombre.trim(), email: email.trim().toLowerCase(), password, rol }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.mensaje || "Error creando usuario"); return; }
      alert(data.mensaje || "Usuario creado correctamente");
      limpiarFormulario();
      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error de conexión creando usuario");
    } finally {
      setCreando(false);
    }
  };

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === "admin" ? "jugador" : "admin";
    if (!window.confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;
    try {
      const response = await fetch(`${API}/usuarios/${id}/rol`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rol: nuevoRol }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.mensaje || "Error actualizando rol"); return; }
      await cargarUsuarios();
    } catch (error) { console.error(error); alert("Error de conexión"); }
  };

  const cambiarEstado = async (id, activoActual) => {
    const accion = activoActual ? "desactivar" : "activar";
    if (!window.confirm(`¿Seguro que quieres ${accion} este usuario?`)) return;
    try {
      const response = await fetch(`${API}/usuarios/${id}/estado`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ activo: !activoActual }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.mensaje || "Error actualizando estado"); return; }
      await cargarUsuarios();
    } catch (error) { console.error(error); alert("Error de conexión"); }
  };

  const guardarEdicion = async (id) => {
    try {
      const res = await fetch(`${API}/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nombre: editNombre, email: editEmail }),
      });
      const data = await res.json();
      setMensajeEdicion(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje || "Error"}`);
      if (res.ok) { setEditandoId(null); await cargarUsuarios(); }
    } catch { setMensajeEdicion("❌ Error de conexión"); }
  };

  const resetearPassword = async (id) => {
    const nuevaPassword = prompt("Nueva contraseña:");
    if (!nuevaPassword) return;
    if (nuevaPassword.length < 6) { alert("La contraseña debe tener al menos 6 caracteres"); return; }
    try {
      const response = await fetch(`${API}/usuarios/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: nuevaPassword }),
      });
      const data = await response.json();
      if (!response.ok) { alert(data.mensaje || "Error actualizando contraseña"); return; }
      alert("Contraseña actualizada");
    } catch (error) { console.error(error); alert("Error de conexión"); }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Administración de Usuarios 👥</h2>

      {/* Formulario crear usuario */}
      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-3">Crear nuevo usuario</h3>
        <div className="flex flex-wrap gap-2.5 items-center">
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} className="p-2 border border-gray-300 rounded" />
          <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="p-2 border border-gray-300 rounded" />
          <input placeholder="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="p-2 border border-gray-300 rounded" />
          <select value={rol} onChange={(e) => setRol(e.target.value)} className="p-2 border border-gray-300 rounded">
            <option value="jugador">Jugador</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={crearUsuario} disabled={creando} className={`bg-green-600 text-white px-3 py-2 rounded font-semibold hover:bg-green-700 ${creando ? "opacity-60 cursor-not-allowed" : ""}`}>
            {creando ? "Creando..." : "➕ Crear usuario"}
          </button>
          <button onClick={limpiarFormulario} className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600">Limpiar</button>
        </div>
      </div>

      {/* Tabla usuarios */}
      {loading ? (
        <p className="text-gray-500">Cargando usuarios...</p>
      ) : (
        <div className="space-y-2">
          {/* Cabecera */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-100 rounded font-semibold text-sm">
            <div className="col-span-1 text-center">ID</div>
            <div className="col-span-2">Nombre</div>
            <div className="col-span-3">Email</div>
            <div className="col-span-1 text-center">Rol</div>
            <div className="col-span-1 text-center">Estado</div>
            <div className="col-span-4">Acciones</div>
          </div>

          {usuarios.map((u) => (
            <div key={u.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Fila principal */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2.5 items-center text-sm">
                <div className="col-span-1 text-center text-gray-500">{u.id}</div>

                <div className="col-span-2 font-semibold">{u.nombre}</div>

                <div className="col-span-3 text-gray-600 truncate">{u.email}</div>

                <div className="col-span-1 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs text-white font-semibold ${u.rol === "admin" ? "bg-red-600" : "bg-blue-600"}`}>
                    {u.rol}
                  </span>
                </div>

                <div className="col-span-1 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs text-white font-semibold ${u.activo ? "bg-green-600" : "bg-gray-500"}`}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="col-span-4 flex flex-wrap gap-1">
                  <button onClick={() => cambiarRol(u.id, u.rol)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">Cambiar rol</button>
                  <button onClick={() => cambiarEstado(u.id, u.activo)} className={`${u.activo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white px-2 py-1 rounded text-xs`}>
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => resetearPassword(u.id)} className="bg-orange-600 text-white px-2 py-1 rounded text-xs hover:bg-orange-700">Reset pwd</button>
                  <button
                    onClick={() => { setEditandoId(u.id); setEditNombre(u.nombre); setEditEmail(u.email); setMensajeEdicion(""); }}
                    className="bg-teal-600 text-white px-2 py-1 rounded text-xs hover:bg-teal-700"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => toggleExpandido(u.id)}
                    className={`px-2 py-1 rounded text-xs font-semibold border ${expandido === u.id ? "bg-purple-600 text-white border-purple-600" : "border-purple-400 text-purple-600 hover:bg-purple-50"}`}
                  >
                    🏆 Torneos {expandido === u.id ? "▲" : "▼"}
                  </button>
                </div>
              </div>

              {/* Panel de edición inline */}
              {editandoId === u.id && (
                <div className="border-t border-gray-200 bg-teal-50 px-4 py-3 flex flex-wrap gap-2 items-center">
                  <input
                    value={editNombre}
                    onChange={(e) => setEditNombre(e.target.value)}
                    placeholder="Nombre"
                    className="p-1.5 border border-gray-300 rounded text-sm"
                  />
                  <input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    type="email"
                    className="p-1.5 border border-gray-300 rounded text-sm"
                  />
                  <button onClick={() => guardarEdicion(u.id)} className="bg-teal-600 text-white px-3 py-1.5 rounded text-sm hover:bg-teal-700 font-semibold">Guardar</button>
                  <button onClick={() => setEditandoId(null)} className="bg-gray-400 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-500">Cancelar</button>
                  {mensajeEdicion && <span className="text-sm">{mensajeEdicion}</span>}
                </div>
              )}

              {/* Panel de torneos expandible */}
              {expandido === u.id && (
                <div className="border-t border-gray-200 bg-purple-50 px-4 py-3">
                  <p className="text-sm font-semibold text-purple-800 mb-3">Torneos asignados a {u.nombre}</p>

                  {/* Torneos actuales */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(torneosUsuario[u.id] || []).length === 0 ? (
                      <p className="text-sm text-gray-500">Sin torneos asignados.</p>
                    ) : (
                      (torneosUsuario[u.id] || []).map((t) => (
                        <div key={t.id} className="flex items-center gap-1.5 bg-white border border-purple-200 rounded-full px-3 py-1 text-sm">
                          <span className="font-medium">{t.nombre}</span>
                          {t.temporada && <span className="text-gray-400">({t.temporada})</span>}
                          <button
                            onClick={() => quitarTorneoDeUsuario(u.id, t.id)}
                            className="text-red-500 hover:text-red-700 font-bold ml-1 leading-none"
                            title="Quitar torneo"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Agregar torneo */}
                  <div className="flex items-center gap-2">
                    <select
                      value={torneoParaAgregar[u.id] || ""}
                      onChange={(e) =>
                        setTorneoParaAgregar((prev) => ({ ...prev, [u.id]: e.target.value }))
                      }
                      className="p-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="">Seleccionar torneo...</option>
                      {torneos
                        .filter((t) => !(torneosUsuario[u.id] || []).some((tu) => tu.id === t.id))
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre} {t.temporada ? `(${t.temporada})` : ""}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => agregarTorneoAUsuario(u.id)}
                      className="bg-purple-600 text-white px-3 py-1.5 rounded text-sm hover:bg-purple-700 font-semibold"
                    >
                      Asignar
                    </button>
                  </div>

                  {mensajeTorneos[u.id] && (
                    <p className="mt-2 text-sm text-gray-700">{mensajeTorneos[u.id]}</p>
                  )}
                </div>
              )}
            </div>
          ))}

          {usuarios.length === 0 && (
            <p className="text-gray-500 text-sm p-3">No hay usuarios registrados.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminUsuarios;
