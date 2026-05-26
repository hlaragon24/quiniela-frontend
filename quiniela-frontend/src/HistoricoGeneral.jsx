import { useEffect, useState } from "react";
import { API } from "./config/api";

function HistoricoGeneral({ jornada }) {
  const [partidos, setPartidos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!jornada) return;
    cargarHistorico();
  }, [jornada]);

  const cargarHistorico = async () => {
    try {
      setMensaje("Cargando histórico...");
      const response = await fetch(`${API}/historico/jornada/${jornada}`);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setPartidos([]);
        setMensaje(data?.mensaje || "No se pudo cargar el histórico");
        return;
      }

      setPartidos(Array.isArray(data) ? data : []);
      setMensaje("");
    } catch (error) {
      console.error("Error cargando histórico:", error);
      setMensaje("Error cargando histórico");
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      {mensaje && <p className="mb-3 text-sm text-gray-600">{mensaje}</p>}

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Local</th>
            <th className="border p-2">Visitante</th>
            <th className="border p-2">Resultado</th>
            <th className="border p-2">Comodín</th>
          </tr>
        </thead>
        <tbody>
          {partidos.length === 0 ? (
            <tr>
              <td className="border p-3 text-center" colSpan="4">Sin histórico</td>
            </tr>
          ) : (
            partidos.map((p, index) => (
              <tr key={`${p.id || p.partido_id}-${index}`}>
                <td className="border p-2">{p.local}</td>
                <td className="border p-2">{p.visitante}</td>
                <td className="border p-2 text-center">
                  {p.goles_local === null || p.goles_local === undefined ? "Pendiente" : `${p.goles_local}-${p.goles_visitante}`}
                </td>
                <td className="border p-2 text-center">{p.es_comodin ? "⭐" : ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default HistoricoGeneral;
