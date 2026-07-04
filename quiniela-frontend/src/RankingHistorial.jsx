import { useEffect, useState } from "react";
import { API } from "./config/api";

function RankingHistorial({ torneoId }) {
  const [historial, setHistorial] = useState({});
  const [jornadas, setJornadas] = useState([]);
  const [cargando, setCargando] = useState(false);

  const miNombre = localStorage.getItem("nombre") || "";

  useEffect(() => {
    if (!torneoId) return;

    const cargarHistorial = async () => {
      try {
        setCargando(true);
        const token = localStorage.getItem("token");
        const response = await fetch(`${API}/ranking/historial?torneo_id=${torneoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
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
      } finally {
        setCargando(false);
      }
    };

    cargarHistorial();
  }, [torneoId]);

  if (cargando) {
    return <div className="mt-10 text-gray-500">Cargando historial...</div>;
  }

  const usuarios = Object.keys(historial).sort((a, b) => {
    const totalA = jornadas.reduce((s, j) => s + (Number(historial[a][j]) || 0), 0);
    const totalB = jornadas.reduce((s, j) => s + (Number(historial[b][j]) || 0), 0);
    return totalB - totalA;
  });

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">Historial por Jornada 📊</h2>

      {usuarios.length === 0 ? (
        <p className="text-gray-500">No hay datos de historial disponibles.</p>
      ) : (
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
                <th className="border border-gray-300 p-2 text-center font-bold">Total</th>
              </tr>
            </thead>

            <tbody>
              {usuarios.map((usuario) => {
                const esMio = usuario === miNombre;
                const total = jornadas.reduce(
                  (s, j) => s + (Number(historial[usuario][j]) || 0),
                  0
                );

                return (
                  <tr
                    key={`historial-user-${usuario}`}
                    className={esMio ? "bg-green-50 ring-2 ring-inset ring-green-400 font-semibold" : "hover:bg-gray-50"}
                  >
                    <td className="border border-gray-300 p-2 font-semibold">
                      {usuario}
                      {esMio && <span className="ml-1.5 text-xs text-green-600">(tú)</span>}
                    </td>
                    {jornadas.map((j) => (
                      <td key={`historial-${usuario}-${j}`} className="border border-gray-300 p-2 text-center">
                        {historial[usuario][j] ?? 0}
                      </td>
                    ))}
                    <td className="border border-gray-300 p-2 text-center font-bold text-blue-700">
                      {total}
                    </td>
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

export default RankingHistorial;
