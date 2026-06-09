import { useEffect, useState } from "react";
import { API } from "./config/api";

function RankingHistorial({ torneoId }) {
  const [historial, setHistorial] = useState({});
  const [jornadas, setJornadas] = useState([]);

  useEffect(() => {
    if (!torneoId) return;

    const cargarHistorial = async () => {
      try {
        const response = await fetch(`${API}/ranking/historial?torneo_id=${torneoId}`);
        const data = await response.json();

        if (!response.ok || !Array.isArray(data)) {
          console.error("Error cargando historial:", data);
          setHistorial({});
          setJornadas([]);
          return;
        }

        const tabla = {};
        const jornadasSet = new Set();

        data.forEach((row) => {
          const jornada = row.jornada_numero ?? row.jornada_id;
          jornadasSet.add(jornada);

          if (!tabla[row.nombre]) tabla[row.nombre] = {};
          tabla[row.nombre][jornada] = row.puntos;
        });

        setHistorial(tabla);
        setJornadas([...jornadasSet].sort((a, b) => Number(a) - Number(b)));
      } catch (error) {
        console.error("Error cargando historial:", error);
      }
    };

    cargarHistorial();
  }, [torneoId]);

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Historial por Jornada 📊</h2>

      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Usuario</th>
              {jornadas.map((j) => (
                <th key={`historial-head-${j}`} className="border border-gray-300 p-2 text-center">
                  J{j}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.keys(historial).map((usuario) => (
              <tr key={`historial-user-${usuario}`} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2 font-semibold">{usuario}</td>
                {jornadas.map((j) => (
                  <td key={`historial-${usuario}-${j}`} className="border border-gray-300 p-2 text-center">
                    {historial[usuario][j] || 0}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RankingHistorial;
