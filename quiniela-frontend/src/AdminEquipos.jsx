import { useEffect, useState } from "react";
import { API } from "./config/api";
import TeamShield from "./components/TeamShield";

const EMPTY_FORM = { nombre: "", abreviacion: "", escudo_url: "", color: "#6B7280" };

export default function AdminEquipos() {
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const cargarEquipos = async () => {
    const res = await fetch(`${API}/equipos`);
    const data = await res.json();
    setEquipos(data);
  };

  useEffect(() => { cargarEquipos(); }, []);

  const limpiar = () => {
    setForm(EMPTY_FORM);
    setEditandoId(null);
    setMensaje("");
    setError("");
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const guardar = async () => {
    setMensaje(""); setError("");
    if (!form.nombre.trim()) { setError("El nombre es requerido"); return; }

    const url = editandoId ? `${API}/equipos/${editandoId}` : `${API}/equipos`;
    const method = editandoId ? "PUT" : "POST";

    const res = await fetch(url, { method, headers, body: JSON.stringify(form) });
    const data = await res.json();

    if (!res.ok) { setError(data.mensaje || "Error guardando equipo"); return; }

    setMensaje(data.mensaje);
    limpiar();
    cargarEquipos();
  };

  const editar = (equipo) => {
    setEditandoId(equipo.id);
    setForm({
      nombre: equipo.nombre,
      abreviacion: equipo.abreviacion || "",
      escudo_url: equipo.escudo_url || "",
      color: equipo.color || "#6B7280",
    });
    setMensaje(""); setError("");
  };

  const eliminar = async (id) => {
    if (!confirm("¿Eliminar este equipo?")) return;
    const res = await fetch(`${API}/equipos/${id}`, { method: "DELETE", headers });
    const data = await res.json();
    if (res.ok) { setMensaje(data.mensaje); cargarEquipos(); }
    else setError(data.mensaje || "Error eliminando equipo");
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Equipos y Escudos</h2>

      {/* Formulario */}
      <div className="bg-white border rounded-xl p-5 shadow-sm mb-8">
        <h3 className="font-semibold text-lg mb-4">{editandoId ? "Editar equipo" : "Nuevo equipo"}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Chivas"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Abreviación (máx 5)</label>
            <input
              name="abreviacion"
              value={form.abreviacion}
              onChange={handleChange}
              maxLength={5}
              placeholder="Ej: CHI"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">URL del escudo</label>
            <input
              name="escudo_url"
              value={form.escudo_url}
              onChange={handleChange}
              placeholder="https://... (png, svg, webp)"
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color principal</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                name="color"
                value={form.color}
                onChange={handleChange}
                className="h-9 w-14 rounded border cursor-pointer"
              />
              <span className="text-sm text-gray-500">{form.color}</span>
            </div>
          </div>

          <div className="flex items-end">
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">Vista previa:</span>
              <TeamShield
                nombre={form.nombre || "Equipo"}
                escudoUrl={form.escudo_url}
                color={form.color}
                size="md"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
        {mensaje && <p className="text-green-600 text-sm mt-3">{mensaje}</p>}

        <div className="flex gap-2 mt-4">
          <button
            onClick={guardar}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
          >
            {editandoId ? "Actualizar" : "Crear equipo"}
          </button>
          {editandoId && (
            <button
              onClick={limpiar}
              className="border px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Equipo</th>
              <th className="text-left p-3">Abrev.</th>
              <th className="text-left p-3">Color</th>
              <th className="text-left p-3">Escudo URL</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {equipos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-gray-500 text-center">
                  Sin equipos registrados. Crea el primero arriba.
                </td>
              </tr>
            ) : (
              equipos.map((eq) => (
                <tr key={eq.id} className="border-t border-gray-100">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <TeamShield
                        nombre={eq.nombre}
                        escudoUrl={eq.escudo_url}
                        color={eq.color}
                        size="sm"
                        showName={false}
                      />
                      <span className="font-medium">{eq.nombre}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500">{eq.abreviacion || "—"}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full border"
                        style={{ backgroundColor: eq.color }}
                      />
                      <span className="text-gray-500 text-xs">{eq.color}</span>
                    </div>
                  </td>
                  <td className="p-3 text-gray-400 text-xs truncate max-w-[150px]">
                    {eq.escudo_url || "—"}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => editar(eq)}
                        className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminar(eq.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
