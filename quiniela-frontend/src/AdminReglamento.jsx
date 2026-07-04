import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminReglamento({ torneoId }) {
  const [contenido, setContenido] = useState("");
  const [editando, setEditando] = useState(false);
  const [draft, setDraft] = useState("");
  const [mensaje, setMensaje] = useState("");
  const token = localStorage.getItem("token");

  const cargar = async () => {
    if (!torneoId) return;
    try {
      const res = await fetch(`${API}/reglamento?torneo_id=${torneoId}`);
      const data = await res.json();
      setContenido(data.contenido ?? "");
    } catch (e) { console.error(e); }
  };

  useEffect(() => { cargar(); }, [torneoId]);

  const guardar = async () => {
    try {
      const res = await fetch(`${API}/reglamento`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ torneo_id: torneoId, contenido: draft }),
      });
      const data = await res.json();
      setMensaje(res.ok ? `✅ ${data.mensaje}` : `❌ ${data.mensaje}`);
      if (res.ok) { setContenido(draft); setEditando(false); }
    } catch { setMensaje("❌ Error de conexión"); }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Reglamento 📋</h2>
      {mensaje && <p className="mb-3 text-sm font-medium">{mensaje}</p>}
      {!editando ? (
        <div>
          <div className="bg-white border border-gray-200 rounded-lg p-4 min-h-[200px] whitespace-pre-wrap text-sm text-gray-700 mb-4">
            {contenido || <span className="text-gray-400">Sin reglamento configurado.</span>}
          </div>
          <button
            onClick={() => { setDraft(contenido); setEditando(true); setMensaje(""); }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            ✏️ Editar reglamento
          </button>
        </div>
      ) : (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={15}
            className="w-full border border-gray-300 rounded-lg p-3 text-sm font-mono mb-3 focus:outline-none focus:border-blue-500"
            placeholder="Escribe el reglamento aquí..."
          />
          <div className="flex gap-2">
            <button onClick={guardar} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 font-semibold">
              💾 Guardar
            </button>
            <button onClick={() => { setEditando(false); setMensaje(""); }} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminReglamento;
