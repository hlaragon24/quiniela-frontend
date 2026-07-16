import { useEffect, useState, useCallback } from "react";
import { API } from "./config/api";

function AdminParticipacion({ torneoId }) {
  const [jornadas, setJornadas] = useState([]);
  const [jornadaId, setJornadaId] = useState("");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
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

  const cargar = useCallback(async () => {
    if (!jornadaId) return;
    setCargando(true);
    try {
      const res = await fetch(`${API}/pronosticos/admin/jornada/${jornadaId}/participacion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setDatos(data);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  }, [jornadaId, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const pct = datos?.total_jugadores > 0
    ? Math.round((datos.completaron / datos.total_jugadores) * 100)
    : 0;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold">Participación en la quiniela 📊</h2>
        <button
          onClick={cargar}
          className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 font-semibold text-gray-600"
        >
          🔄 Actualizar
        </button>
      </div>

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

      {cargando && <p className="text-gray-500 text-sm">Cargando...</p>}

      {datos && !cargando && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-center">
              <p className="text-3xl font-bold text-blue-700">{datos.total_jugadores}</p>
              <p className="text-xs text-gray-500 mt-1">Total jugadores</p>
            </div>
            <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{datos.completaron}</p>
              <p className="text-xs text-gray-500 mt-1">Completaron ✅</p>
            </div>
            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{datos.pendientes}</p>
              <p className="text-xs text-gray-500 mt-1">Pendientes ⏳</p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{datos.completaron} de {datos.total_jugadores} completaron ({pct}%)</span>
              <span>{datos.total_partidos} partido{datos.total_partidos !== 1 ? "s" : ""} en la jornada</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: pct === 100 ? "#16a34a" : pct >= 50 ? "#eab308" : "#ef4444",
                }}
              />
            </div>
          </div>

          {/* Lista de jugadores */}
          {datos.jugadores.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay jugadores inscritos en esta jornada.</p>
          ) : (
            <div className="space-y-2">
              {datos.jugadores.map((j) => (
                <div
                  key={j.usuario_id}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    j.completo
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{j.completo ? "✅" : "⏳"}</span>
                    <span className="font-semibold text-gray-800 text-sm">{j.nombre}</span>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {j.completo ? (
                      <span className="text-green-700 font-semibold">Completo</span>
                    ) : (
                      <span className="text-red-600 font-semibold">
                        {j.pronosticos_enviados}/{j.total_partidos} partidos
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminParticipacion;
