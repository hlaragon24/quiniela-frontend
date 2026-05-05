import { useEffect, useState } from "react";

function Ranking({ jornada }) {

  const [ranking, setRanking] = useState([]);

  useEffect(() => {

    cargarRanking();

  }, [jornada]);


  const cargarRanking = async () => {

    try {

      const response = await fetch(
        `https://quiniela-app-rq9c.onrender.com/ranking/jornada/${jornada}`
      );

      const data = await response.json();

      console.log("Ranking recibido:", data);

      if (Array.isArray(data)) {

        setRanking(data);

      }

      else {

        setRanking([]);

      }

    }

    catch (error) {

      console.error("Error cargando ranking:", error);

    }

  };


  return (

    <div className="overflow-x-auto mt-6">

      <table className="min-w-full border border-gray-300">

        <thead>

          <tr className="bg-gray-100">

            <th className="border p-2">Posición</th>

            <th className="border p-2">Jugador</th>

            <th className="border p-2">Puntos marcador</th>

            <th className="border p-2">Puntos resultado</th>

            <th className="border p-2">Total puntos</th>

          </tr>

        </thead>


        <tbody>

          {

            ranking.map((jugador, index) => (

              <tr
                key={jugador.id}
                className={
                  index === 0
                    ? "bg-green-200"
                    : index === 1
                    ? "bg-blue-200"
                    : ""
                }
              >

                <td className="border p-2 text-center">

                  {index + 1}

                </td>


                <td className="border p-2 font-semibold">

                  {jugador.nombre}

                </td>


                <td className="border p-2 text-center">

                  {Number(jugador.puntos_marcador)}

                </td>


                <td className="border p-2 text-center">

                  {Number(jugador.puntos_resultado)}

                </td>


                <td className="border p-2 text-center font-bold">

                  {Number(jugador.total)}

                </td>

              </tr>

            ))

          }

        </tbody>

      </table>

    </div>

  );

}

export default Ranking;