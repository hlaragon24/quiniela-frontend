import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

function obtenerMedalla(posicion) {
  if (Number(posicion) === 1) return "🥇";
  if (Number(posicion) === 2) return "🥈";
  if (Number(posicion) === 3) return "🥉";
  return `#${posicion}`;
}

function TablaGeneral({ torneoId }) {
  const [ranking, setRanking] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const miId = Number(localStorage.getItem("usuario_id"));

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
          <p className="text-gray-500 mb-3">Puntos acumulados del torneo por jugador.</p>

          {/* Leyenda de puntuación */}
          <div className="flex flex-wrap gap-3 mb-5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="font-semibold text-gray-700">¿Cómo se puntúa?</span>
            <span><span className="font-bold text-blue-700">Pronóstico</span> = resultado correcto (L/E/V) → +1 pt</span>
            <span><span className="font-bold text-green-700">Marcador</span> = goles exactos → +2 pts</span>
            <span><span className="font-bold text-orange-600">Comodín</span> = partido especial ⭐ con doble bonus</span>
            <span><span className="font-bold text-yellow-700">Campeón</span> = pronóstico de campeón de temporada</span>
          </div>

          {ranking.length === 0 ? (
            <p className="text-gray-500">Todavía no hay jugadores en la tabla general.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-3 border">Posición</th>
                    <th className="p-3 border">Jugador</th>
                    <th className="p-3 border text-center">
                      <span className="text-blue-700">Pronóstico</span>
                      <div className="text-xs font-normal text-gray-400">resultado</div>
                    </th>
                    <th className="p-3 border text-center">
                      <span className="text-green-700">Marcador</span>
                      <div className="text-xs font-normal text-gray-400">goles exactos</div>
                    </th>
                    <th className="p-3 border text-center">
                      <span className="text-orange-600">Comodín</span>
                      <div className="text-xs font-normal text-gray-400">bonus ⭐</div>
                    </th>
                    <th className="p-3 border text-center">
                      <span className="text-yellow-700">Campeón</span>
                      <div className="text-xs font-normal text-gray-400">temporada</div>
                    </th>
                    <th className="p-3 border text-center font-bold">Total<div className="text-xs font-normal text-gray-400">acumulado</div></th>
                  </tr>
                </thead>

                <tbody>
                  {ranking.map((jugador) => {
                    const esMio = jugador.id === miId;
                    const pos = Number(jugador.posicion);
                    const rowClass = esMio
                      ? "ring-2 ring-inset ring-green-400 bg-green-50 font-semibold"
                      : pos === 1
                        ? "bg-yellow-50"
                        : pos === 2
                          ? "bg-gray-50"
                          : pos === 3
                            ? "bg-orange-50"
                            : "hover:bg-gray-50";

                    return (
                      <tr
                        key={`tabla-general-${jugador.id}`}
                        className={rowClass}
                      >
                        <td className="p-3 border font-bold">{obtenerMedalla(jugador.posicion)}</td>
                        <td className="p-3 border font-semibold">
                          {jugador.nombre}
                          {esMio && <span className="ml-1.5 text-xs text-green-600 font-bold">(tú)</span>}
                        </td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-gray-400 text-right">
            ¿Dudas sobre los puntos? Consulta el tab <span className="font-semibold">Reglamento 📋</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default TablaGeneral;
