import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

function MisResultados({ torneoId }) {
  const [partidos, setPartidos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const token = localStorage.getItem("token");

  const cargarResultados = async () => {
    if (!torneoId) return;

    try {
      setCargando(true);
      const response = await fetch(
        `${API}/pronosticos/usuario?torneo_id=${torneoId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) { setPartidos([]); return; }
      const data = await response.json();
      setPartidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando resultados:", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResultados();
  }, [torneoId]);

  const textoResultado = (valor) => {
    if (valor === "L") return "Local";
    if (valor === "V") return "Visitante";
    return "Empate";
  };

  const porJornada = useMemo(() => {
    const grupos = {};
    partidos.forEach((p) => {
      const key = p.jornada_numero ?? "?";
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(p);
    });
    return Object.entries(grupos).sort(([a], [b]) => Number(b) - Number(a));
  }, [partidos]);

  if (cargando) {
    return <p className="mt-6 text-gray-500">Cargando resultados...</p>;
  }

  if (!torneoId) {
    return (
      <p className="mt-6 text-gray-500">Selecciona un torneo para ver tus resultados.</p>
    );
  }

  if (partidos.length === 0) {
    return (
      <p className="mt-6 text-gray-500">No tienes pronósticos registrados en este torneo.</p>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      <h2 className="text-xl font-bold">Resultados de tus pronósticos 📊</h2>

      {porJornada.map(([jornada, lista]) => (
        <div key={`jornada-${jornada}`}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">
            Jornada {jornada}
          </h3>

          <div className="space-y-3">
            {lista.map((partido) => {
              const tieneResultado =
                partido.goles_local !== null && partido.goles_local !== undefined &&
                partido.goles_visitante !== null && partido.goles_visitante !== undefined;

              const resultadoReal = tieneResultado
                ? partido.goles_local > partido.goles_visitante
                  ? "Local"
                  : partido.goles_visitante > partido.goles_local
                    ? "Visitante"
                    : "Empate"
                : null;

              const marcadorExacto =
                tieneResultado &&
                Number(partido.marcador_local) === Number(partido.goles_local) &&
                Number(partido.marcador_visitante) === Number(partido.goles_visitante);

              const pronosticoTexto = partido.pronostico_usuario === "L"
                ? "Local"
                : partido.pronostico_usuario === "V"
                  ? "Visitante"
                  : "Empate";
              const acerto = tieneResultado && pronosticoTexto === resultadoReal;

              const borderColor = !tieneResultado
                ? "border-gray-200"
                : marcadorExacto
                  ? "border-green-400 bg-green-50"
                  : acerto
                    ? "border-yellow-300 bg-yellow-50"
                    : "border-red-200 bg-red-50";

              return (
                <div
                  key={`mis-resultados-${partido.partido_id}`}
                  className={`border rounded-lg p-4 bg-white shadow-sm ${borderColor}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="text-base">
                        {partido.local} vs {partido.visitante}
                      </strong>

                      {partido.es_comodin && (
                        <span className="ml-2 text-orange-500 text-sm">⭐ Comodín</span>
                      )}
                    </div>

                    {!tieneResultado ? (
                      <span className="text-gray-400 text-sm font-medium">Pendiente</span>
                    ) : Number(partido.puntos) > 0 ? (
                      <span className="text-green-600 font-bold">+{partido.puntos} pts</span>
                    ) : (
                      <span className="text-red-500 font-bold">0 pts</span>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-600 space-y-1">
                    <p>
                      Tu pronóstico:{" "}
                      <span className="font-semibold">
                        {textoResultado(partido.pronostico_usuario)} ({partido.marcador_local} - {partido.marcador_visitante})
                      </span>
                    </p>

                    {tieneResultado && (
                      <p>
                        Resultado real:{" "}
                        <span className="font-semibold">
                          {resultadoReal} ({partido.goles_local} - {partido.goles_visitante})
                        </span>
                        {marcadorExacto && <span className="ml-1.5 text-green-600 font-bold">✓ Marcador exacto</span>}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MisResultados;
