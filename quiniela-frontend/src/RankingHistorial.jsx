import { useEffect, useState } from "react";

function RankingHistorial() {

  const [historial, setHistorial] = useState({});
  const [jornadas, setJornadas] = useState([]);

  useEffect(() => {

    const cargarHistorial = async () => {

      try {

        const response = await fetch(
          "https://quiniela-app-rq9c.onrender.com/ranking/historial"
        );

        const data = await response.json();

        const tabla = {};

        const jornadasSet = new Set();

        data.forEach(row => {

          jornadasSet.add(row.jornada_id);

          if (!tabla[row.nombre]) {

            tabla[row.nombre] = {};

          }

          tabla[row.nombre][row.jornada_id] = row.puntos;

        });

        setHistorial(tabla);

        setJornadas([...jornadasSet].sort());

      } catch (error) {

        console.error(error);

      }

    };

    cargarHistorial();

  }, []);

  return (

    <div style={{ marginTop: "40px" }}>

      <h2>Historial por Jornada 📊</h2>

      <table border="1" cellPadding="8">

        <thead>

          <tr>

            <th>Usuario</th>

            {

              jornadas.map(j => (

                <th key={j}>J{j}</th>

              ))

            }

          </tr>

        </thead>

        <tbody>

          {

            Object.keys(historial).map(usuario => (

              <tr key={usuario}>

                <td>{usuario}</td>

                {

                  jornadas.map(j => (

                    <td key={j}>

                      {historial[usuario][j] || 0}

                    </td>

                  ))

                }

              </tr>

            ))

          }

        </tbody>

      </table>

    </div>

  );

}

export default RankingHistorial;