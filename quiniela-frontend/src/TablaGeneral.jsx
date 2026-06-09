import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

function obtenerMedalla(posicion) {
  if (Number(posicion) === 1) return "🥇";
  if (Number(posicion) === 2) return "🥈";
  return `#${posicion}`;
}

function TablaGeneral({ torneoId }) {
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarTablaGeneral = async () => {
    if (!torneoId) return;

    try {
      setCargando(true);
      setError("");

      const res = await fetch(`${API}/ranking/torneo/${torneoId}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setError(data.mensaje || "Error cargando tabla general");
        setRanking([]);
        return;
      }

      setRanking(data);
    } catch (error) {
      console.error("Error cargando tabla general:", error);
      setError("Error de conexión con el servidor");
      setRanking([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTablaGeneral();
  }, [torneoId]);

  if (cargando) {
    return <div className="mt-6 text-gray-500">Cargando tabla general...</div>;
  }

  if (error) {
    return (
      <div className="mt-6 bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-6">
      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-1">🏆 Tabla General</h2>
          <p className="text-gray-500 mb-6">Acumulado total del torneo por jugador.</p>

          {ranking.length === 0 ? (
            <p className="text-gray-500">Todavía no hay jugadores en la tabla general.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 border">Posición</th>
                    <th className="p-3 border">Jugador</th>
                    <th className="p-3 border text-center">Puntos pronóstico</th>
                    <th className="p-3 border text-center">Puntos marcador</th>
                    <th className="p-3 border text-center">Puntos comodín</th>
                    <th className="p-3 border text-center">Campeón</th>
                    <th className="p-3 border text-center">Total</th>
                  </tr>
                </thead>

                <tbody>
                  {ranking.map((jugador) => (
                    <tr
                      key={`tabla-general-${jugador.id}`}
                      className={`hover:bg-gray-50 ${Number(jugador.posicion) === 1 ? "bg-yellow-50" : ""} ${Number(jugador.posicion) === 2 ? "bg-gray-50" : ""}`}
                    >
                      <td className="p-3 border font-bold">{obtenerMedalla(jugador.posicion)}</td>
                      <td className="p-3 border font-semibold">{jugador.nombre}</td>
                      <td className="p-3 border text-center">{jugador.puntos_pronostico}</td>
                      <td className="p-3 border text-center">{jugador.puntos_marcador}</td>
                      <td className="p-3 border text-center">{jugador.puntos_comodin}</td>
                      <td className="p-3 border text-center">
                        <div className="font-semibold">{jugador.puntos_campeon}</div>
                        {jugador.campeon_pronosticado && (
                          <div className="text-xs text-gray-500">{jugador.campeon_pronosticado}</div>
                        )}
                      </td>
                      <td className="p-3 border text-center text-lg font-bold">{jugador.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TablaGeneral;
