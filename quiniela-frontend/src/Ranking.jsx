import { useEffect, useState } from "react";
import { API } from "./config/api";

function Ranking({ jornada, refresh }) {
  const [ranking, setRanking] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!jornada) return;
    cargarRanking();
  }, [jornada, refresh]);

  const cargarRanking = async () => {
    try {
      setMensaje("Cargando ranking...");

      const response = await fetch(`${API}/ranking/jornada/${jornada}`);
      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        setRanking([]);
        setMensaje(data?.mensaje || "No se pudo cargar el ranking");
        return;
      }

      if (Array.isArray(data)) {
        setRanking(data);
      } else if (Array.isArray(data.ranking)) {
        setRanking(data.ranking);
      } else {
        setRanking([]);
      }

      setMensaje("");
    } catch (error) {
      console.error("Error cargando ranking:", error);
      setRanking([]);
      setMensaje("Error cargando ranking");
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      {mensaje && <p className="mb-3 text-sm text-gray-600">{mensaje}</p>}

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Posición</th>
            <th className="border p-2">Jugador</th>
            <th className="border p-2">Exactos</th>
            <th className="border p-2">Resultados</th>
            <th className="border p-2">Total</th>
          </tr>
        </thead>

        <tbody>
          {ranking.length === 0 ? (
            <tr>
              <td className="border p-3 text-center" colSpan="5">
                Sin datos de ranking
              </td>
            </tr>
          ) : (
            ranking.map((jugador, index) => (
              <tr
                key={jugador.id || `${jugador.nombre}-${index}`}
                className={index === 0 ? "bg-green-100" : index === 1 ? "bg-blue-100" : ""}
              >
                <td className="border p-2 text-center">{index + 1}</td>
                <td className="border p-2 font-semibold">{jugador.nombre}</td>
                <td className="border p-2 text-center">{Number(jugador.marcadores_exactos || jugador.puntos_marcador || 0)}</td>
                <td className="border p-2 text-center">{Number(jugador.resultados_correctos || jugador.puntos_resultado || 0)}</td>
                <td className="border p-2 text-center font-bold">{Number(jugador.total || jugador.puntos || 0)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Ranking;
