import { useEffect, useState } from "react";
import { API } from "./config/api";

function MisResultados() {
  const [pronosticos, setPronosticos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    cargarPronosticos();
  }, []);

  const cargarPronosticos = async () => {
    if (!token) {
      setMensaje("Sesión no disponible");
      return;
    }

    try {
      setMensaje("Cargando resultados...");
      const response = await fetch(`${API}/pronosticos/usuario`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(data)) {
        setPronosticos([]);
        setMensaje(data?.mensaje || "No se pudieron cargar tus resultados");
        return;
      }

      setPronosticos(data);
      setMensaje("");
    } catch (error) {
      console.error("Error cargando mis resultados:", error);
      setMensaje("Error cargando tus resultados");
    }
  };

  return (
    <div className="overflow-x-auto mt-6">
      {mensaje && <p className="mb-3 text-sm text-gray-600">{mensaje}</p>}

      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Jornada</th>
            <th className="border p-2">Partido</th>
            <th className="border p-2">Pronóstico</th>
            <th className="border p-2">Resultado oficial</th>
            <th className="border p-2">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {pronosticos.length === 0 ? (
            <tr>
              <td className="border p-3 text-center" colSpan="5">Sin pronósticos</td>
            </tr>
          ) : (
            pronosticos.map((p, index) => (
              <tr key={`${p.partido_id}-${index}`}>
                <td className="border p-2 text-center">{p.jornada_numero || p.jornada_id}</td>
                <td className="border p-2">{p.local} vs {p.visitante}</td>
                <td className="border p-2 text-center">
                  {p.pronostico_usuario || p.resultado || "-"} ({p.marcador_local ?? "-"}-{p.marcador_visitante ?? "-"})
                </td>
                <td className="border p-2 text-center">
                  {p.goles_local === null || p.goles_local === undefined ? "Pendiente" : `${p.goles_local}-${p.goles_visitante}`}
                </td>
                <td className="border p-2 text-center font-bold">{Number(p.puntos || 0)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default MisResultados;
