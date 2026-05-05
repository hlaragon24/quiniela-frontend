import { useEffect, useState } from "react";

function MisResultados() {

  const [partidos, setPartidos] = useState([]);

  const token = localStorage.getItem("token");


  const cargarResultados = async () => {

    try {

      const response = await fetch("https://quiniela-app-rq9c.onrender.com/pronosticos/usuario", {
            headers: {
                Authorization: `Bearer ${token}`
            }
            })

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

    if (token) {

      cargarResultados();

    }

  }, [token]);


  return (

    <div style={{ marginTop: "40px" }}>

      <h2>Resultados de tus pronósticos 📊</h2>

      {
  partidos.map(partido => {

    const resultadoReal =
      partido.goles_local > partido.goles_visitante
        ? "Local"
        : partido.goles_visitante > partido.goles_local
        ? "Visitante"
        : "Empate";

    const pronosticoUsuario =
      partido.pronostico_usuario === "L"
        ? "Local"
        : partido.pronostico_usuario === "V"
        ? "Visitante"
        : "Empate";

    return (

      <div key={partido.id} style={{ marginBottom: "15px" }}>

        <strong>
          {partido.local} vs {partido.visitante}
        </strong>

        {partido.es_comodin && (
          <span style={{ marginLeft: "10px", color: "orange" }}>
            ⭐ Comodín
          </span>
        )}

        <br />

        <span>
          Tu pronóstico:
          {" "}
          <b>
            {pronosticoUsuario}
            {" "}
            ({partido.marcador_local} - {partido.marcador_visitante})
          </b>
        </span>

        <br />

        {
          partido.goles_local !== null && (
            <span>
              Resultado real:
              {" "}
              <b>
                {resultadoReal}
                {" "}
                ({partido.goles_local} - {partido.goles_visitante})
              </b>
            </span>
          )
        }

        <br />

        {
          partido.puntos > 0
            ? (
              <span style={{ color: "green" }}>
                ✅ +{partido.puntos} puntos
              </span>
            )
            : (
              <span style={{ color: "red" }}>
                ❌ 0 puntos
              </span>
            )
        }

      </div>

    );

  })
}

    </div>

  );

}

export default MisResultados;