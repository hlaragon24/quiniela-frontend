import { useEffect, useState } from "react";
import { API } from "./config/api";

function Ranking({ jornada, refresh }) {
  const [ranking, setRanking] = useState([]);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!jornada) {
      setRanking([]);
      return;
    }

    cargarRanking();
  }, [jornada, refresh]);

  const cargarRanking = async () => {
    try {
      const response = await fetch(`${API}/ranking/jornada/${jornada}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Error cargando ranking:", data);
        setRanking([]);
        setMensaje(data.mensaje || "Error cargando ranking");
        return;
      }

      if (Array.isArray(data?.ranking)) {
        setRanking(data.ranking);
      } else if (Array.isArray(data)) {
        setRanking(data);
      } else {
        setRanking([]);
      }

      setMensaje("");
    } catch (error) {
      console.error("Error cargando ranking:", error);
      setRanking([]);
      setMensaje("Error de conexión cargando ranking");
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      {mensaje && <p className="mb-3 text-red-600">{mensaje}</p>}

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Posición</th>
            <th className="border p-2">Jugador</th>
            <th className="border p-2">Exactos</th>
            <th className="border p-2">Resultados</th>
            <th className="border p-2">Total puntos</th>
          </tr>
        </thead>

        <tbody>
          {ranking.map((jugador, index) => (
            <tr
              key={`ranking-${jugador.id}-${index}`}
              className={
                index === 0 ? "bg-green-200" : index === 1 ? "bg-blue-200" : ""
              }
            >
              <td className="border p-2 text-center">{index + 1}</td>
              <td className="border p-2 font-semibold">{jugador.nombre}</td>
              <td className="border p-2 text-center">
                {Number(jugador.marcadores_exactos ?? jugador.puntos_marcador ?? 0)}
              </td>
              <td className="border p-2 text-center">
                {Number(jugador.resultados_correctos ?? jugador.puntos_resultado ?? 0)}
              </td>
              <td className="border p-2 text-center font-bold">
                {Number(jugador.total ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Ranking;
