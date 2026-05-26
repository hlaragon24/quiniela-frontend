import { useEffect, useState } from "react";
import { API } from "./config/api";

function RankingHistorial() {
  const [historial, setHistorial] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    try {
      setMensaje("Cargando historial...");
      const response = await fetch(`${API}/ranking/historial`);
      const data = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(data)) {
        setHistorial([]);
        setMensaje(data?.mensaje || "No se pudo cargar el historial");
        return;
      }

      setHistorial(data);
      setMensaje("");
    } catch (error) {
      console.error("Error cargando historial:", error);
      setMensaje("Error cargando historial");
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      {mensaje && <p className="mb-3 text-sm text-gray-600">{mensaje}</p>}

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Jugador</th>
            <th className="border p-2">Jornada</th>
            <th className="border p-2">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {historial.length === 0 ? (
            <tr>
              <td className="border p-3 text-center" colSpan="3">Sin historial</td>
            </tr>
          ) : (
            historial.map((item, index) => (
              <tr key={`${item.id || item.usuario_id}-${item.jornada_id}-${index}`}>
                <td className="border p-2">{item.nombre}</td>
                <td className="border p-2 text-center">{item.jornada_numero || item.jornada_id}</td>
                <td className="border p-2 text-center font-bold">{Number(item.puntos || 0)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RankingHistorial;
