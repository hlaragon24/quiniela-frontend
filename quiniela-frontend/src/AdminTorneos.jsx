import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminTorneos({ onTorneoChange }) {
  const [torneos, setTorneos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [temporada, setTemporada] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const token = localStorage.getItem("token");

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
    cargarTorneos();
  }, []);

  const guardarTorneo = async () => {
    if (!nombre.trim()) {
      setMensaje("⚠ El nombre del torneo es obligatorio");
      return;
    }

    try {
      const url = modoEdicion ? `${API}/torneos/${editandoId}` : `${API}/torneos`;
      const method = modoEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          temporada: temporada.trim() || null,
          fecha_inicio: fechaInicio || null,
          fecha_fin: fechaFin || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(`❌ ${data.mensaje || "Error guardando torneo"}`);
        return;
      }

      setMensaje(`✅ ${data.mensaje || (modoEdicion ? "Torneo actualizado" : "Torneo creado")}`);
      limpiarFormulario();
      await cargarTorneos();
      onTorneoChange?.();
    } catch (error) {
      console.error("Error guardando torneo:", error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  const editarTorneo = (t) => {
    setNombre(t.nombre);
    setTemporada(t.temporada || "");
    setFechaInicio(t.fecha_inicio ? t.fecha_inicio.slice(0, 10) : "");
    setFechaFin(t.fecha_fin ? t.fecha_fin.slice(0, 10) : "");
    setEditandoId(t.id);
    setModoEdicion(true);
  };

  const activarTorneo = async (id) => {
    try {
      const res = await fetch(`${API}/torneos/${id}/activar`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje || "Error activando torneo"}`);
      await cargarTorneos();
      onTorneoChange?.();
    } catch (error) {
      console.error("Error activando torneo:", error);
      setMensaje("❌ Error de conexión");
    }
  };

  const eliminarTorneo = async (id) => {
    if (!window.confirm("¿Eliminar este torneo? Se eliminarán también sus jornadas y partidos asociados.")) return;

    try {
      const res = await fetch(`${API}/torneos/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setMensaje(data.mensaje || "Torneo eliminado");
      await cargarTorneos();
      onTorneoChange?.();
    } catch (error) {
      console.error("Error eliminando torneo:", error);
      setMensaje("❌ Error eliminando torneo");
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setTemporada("");
    setFechaInicio("");
    setFechaFin("");
    setModoEdicion(false);
    setEditandoId(null);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Gestión de Torneos 🏆</h2>

      {/* Formulario */}
      <div className="mb-5 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="font-semibold mb-3">
          {modoEdicion ? "Editar torneo" : "Crear nuevo torneo"}
        </h3>

        <div className="flex flex-wrap gap-2.5 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Nombre *</label>
            <input
              placeholder="Ej. Liga MX Apertura 2025"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="p-2 rounded border border-gray-300 w-56"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Temporada</label>
            <input
              placeholder="Ej. 2025"
              value={temporada}
              onChange={(e) => setTemporada(e.target.value)}
              className="p-2 rounded border border-gray-300 w-28"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Fecha inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="p-2 rounded border border-gray-300"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 font-medium">Fecha fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="p-2 rounded border border-gray-300"
            />
          </div>

          <button
            onClick={guardarTorneo}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            {modoEdicion ? "Actualizar" : "Crear"}
          </button>

          {modoEdicion && (
            <button
              onClick={limpiarFormulario}
              className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <p className="mb-4 text-sm font-medium text-gray-700">{mensaje}</p>
      )}

      <hr className="mb-4" />

      {/* Lista de torneos */}
      {torneos.length === 0 ? (
        <p className="text-gray-500">No hay torneos creados aún.</p>
      ) : (
        <div className="space-y-3">
          {torneos.map((t) => (
            <div
              key={t.id}
              className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm"
            >
              <div>
                <p className="font-bold text-lg">{t.nombre}</p>

                <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-500">
                  {t.temporada && <span>📅 Temporada: {t.temporada}</span>}

                  {t.fecha_inicio && (
                    <span>Inicio: {new Date(t.fecha_inicio).toLocaleDateString("es-MX")}</span>
                  )}

                  {t.fecha_fin && (
                    <span>Fin: {new Date(t.fecha_fin).toLocaleDateString("es-MX")}</span>
                  )}

                  <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
                    t.estado === "finalizado" ? "bg-gray-500" : "bg-green-600"
                  }`}>
                    {t.estado || "abierto"}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white ${
                    t.activo ? "bg-blue-500" : "bg-red-400"
                  }`}>
                    {t.activo ? "⚡ Activo" : "Inactivo"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => activarTorneo(t.id)}
                  className={`px-3 py-1.5 rounded font-semibold text-white ${
                    t.activo
                      ? "bg-gray-500 hover:bg-gray-600"
                      : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
                  title={t.activo ? "Desactivar torneo" : "Activar torneo"}
                >
                  {t.activo ? "⏸ Desactivar" : "⚡ Activar"}
                </button>

                <button
                  onClick={() => editarTorneo(t)}
                  className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                >
                  Editar
                </button>

                <button
                  onClick={() => eliminarTorneo(t.id)}
                  className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminTorneos;
