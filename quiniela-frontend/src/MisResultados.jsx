import { useEffect, useState } from "react";
import { API } from "./config/api";

function MisResultados() {
  const [partidos, setPartidos] = useState([]);
  const token = localStorage.getItem("token");

  const cargarResultados = async () => {
    try {
      const response = await fetch(`${API}/pronosticos/usuario`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (Array.isArray(data)) {
        setPartidos(data);
      } else {
        console.log("Respuesta backend:", data);
        setPartidos([]);
      }
    } catch (error) {
      console.error("Error cargando resultados:", error);
    }
  };

  useEffect(() => {
    if (token) cargarResultados();
  }, [token]);

  const textoResultado = (valor) => {
    if (valor === "L") return "Local";
    if (valor === "V") return "Visitante";
    return "Empate";
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>Resultados de tus pronósticos 📊</h2>

      {partidos.map((partido) => {
        const tieneResultado =
          partido.goles_local !== null && partido.goles_local !== undefined &&
          partido.goles_visitante !== null && partido.goles_visitante !== undefined;

        const resultadoReal = tieneResultado
          ? partido.goles_local > partido.goles_visitante
            ? "Local"
            : partido.goles_visitante > partido.goles_local
              ? "Visitante"
              : "Empate"
          : "Pendiente";

        return (
          <div key={`mis-resultados-${partido.partido_id}`} style={{ marginBottom: "15px" }}>
            <strong>{partido.local} vs {partido.visitante}</strong>
            {partido.es_comodin && (
              <span style={{ marginLeft: "10px", color: "orange" }}>⭐ Comodín</span>
            )}
            <br />
            <span>
              Tu pronóstico: <b>{textoResultado(partido.pronostico_usuario)} ({partido.marcador_local} - {partido.marcador_visitante})</b>
            </span>
            <br />
            {tieneResultado && (
              <span>Resultado real: <b>{resultadoReal} ({partido.goles_local} - {partido.goles_visitante})</b></span>
            )}
            <br />
            {Number(partido.puntos) > 0 ? (
              <span style={{ color: "green" }}>✅ +{partido.puntos} puntos</span>
            ) : (
              <span style={{ color: "red" }}>❌ 0 puntos</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MisResultados;
