import { useEffect, useState } from "react";
import { API } from "./config/api";
import { exportarCSV } from "./utils/exportCsv";

const ACCIONES = {
  RESULTADO_GUARDADO: { label: "Resultado guardado", color: "bg-blue-100 text-blue-800" },
  PAGO_ACTUALIZADO:   { label: "Pago actualizado",   color: "bg-green-100 text-green-800" },
  JORNADA_CERRADA:    { label: "Jornada cerrada",    color: "bg-red-100 text-red-700" },
  JORNADA_ABIERTA:    { label: "Jornada abierta",    color: "bg-yellow-100 text-yellow-800" },
};

function AdminAuditoria({ torneoId }) {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [filtroAccion, setFiltroAccion] = useState("todos");
  const token = localStorage.getItem("token");

  const cargar = async () => {
    if (!torneoId) return;
    setCargando(true);
    try {
      const res = await fetch(`${API}/auditoria?torneo_id=${torneoId}&limit=200`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [torneoId]);

  const lista = filtroAccion === "todos"
    ? registros
    : registros.filter((r) => r.accion === filtroAccion);

  const exportar = () => {
    exportarCSV(lista, [
      { key: "created_at", label: "Fecha" },
      { key: "admin_nombre", label: "Admin" },
      { key: "accion", label: "Acción" },
      { key: "entidad", label: "Entidad" },
      { key: "entidad_id", label: "ID" },
      { key: "detalle", label: "Detalle" },
    ], `auditoria_torneo_${torneoId}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold">Historial de Auditoría 🕵️</h2>
        <button
          onClick={exportar}
          disabled={lista.length === 0}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40"
        >
          ⬇ Exportar CSV
        </button>
      </div>

      {/* Filtros por acción */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["todos", ...Object.keys(ACCIONES)].map((a) => (
          <button
            key={a}
            onClick={() => setFiltroAccion(a)}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              filtroAccion === a
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-500"
            }`}
          >
            {a === "todos" ? "Todos" : ACCIONES[a]?.label ?? a}
          </button>
        ))}
      </div>

      {cargando ? (
        <p className="text-gray-500 text-sm">Cargando...</p>
      ) : lista.length === 0 ? (
        <p className="text-gray-500 text-sm">Sin registros de auditoría.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left p-2.5 border-b-2 border-gray-300">Fecha</th>
                <th className="text-left p-2.5 border-b-2 border-gray-300">Admin</th>
                <th className="text-left p-2.5 border-b-2 border-gray-300">Acción</th>
                <th className="text-left p-2.5 border-b-2 border-gray-300">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((r) => {
                const meta = ACCIONES[r.accion];
                let detalle = "";
                try {
                  const d = typeof r.detalle === "string" ? JSON.parse(r.detalle) : r.detalle;
                  if (d) detalle = Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(" · ");
                } catch {}
                return (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-2.5 whitespace-nowrap text-gray-500">
                      {new Date(r.created_at).toLocaleString("es-MX", { timeZone: "America/Mexico_City" })}
                    </td>
                    <td className="p-2.5 font-medium">{r.admin_nombre ?? "—"}</td>
                    <td className="p-2.5">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${meta?.color ?? "bg-gray-100 text-gray-700"}`}>
                        {meta?.label ?? r.accion}
                      </span>
                    </td>
                    <td className="p-2.5 text-gray-600 text-xs">{detalle || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminAuditoria;
