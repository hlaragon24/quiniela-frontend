import { useEffect, useState } from "react";
import { API } from "./config/api";

function HistoricoGeneral({ jornada }) {

  const [tabla, setTabla] = useState([]);
  const [jugadores, setJugadores] = useState([]);

  const [filtroJugador, setFiltroJugador] = useState("todos");


  useEffect(() => {
    if (!jornada) return;
    cargarHistorico();
  }, [jornada]);


  const cargarHistorico = async () => {

    try {

      const res = await fetch(
        `${API}/historico/jornada/${jornada}`
      );

      const data = await res.json();

      setTabla(data);


      const jugadoresSet = new Set();

      data.forEach(partido => {

        Object.keys(partido.pronosticos)
          .forEach(j => jugadoresSet.add(j));

      });

      setJugadores([...jugadoresSet]);

    }

    catch (error) {

      console.error("Error cargando histórico:", error);

    }

  };


  if (!jornada) return <p className="mt-6 text-gray-500">Selecciona una jornada.</p>;
  if (!tabla.length) return <p className="mt-6 text-gray-500">No hay datos para esta jornada.</p>;


  // calcular totales
  const totales = {};

  jugadores.forEach(j => totales[j] = 0);


  tabla.forEach(partido => {

    jugadores.forEach(j => {

      if (partido.pronosticos[j]) {

        totales[j] += partido.pronosticos[j].puntos;

      }

    });

  });


  const obtenerColor = (puntos, esComodin) => {

    if (esComodin) {

      if (puntos === 5) return "bg-green-300";
      if (puntos === 3) return "bg-blue-200";
      if (puntos === 2) return "bg-yellow-200";

    }

    else {

      if (puntos === 3) return "bg-green-300";
      if (puntos === 2) return "bg-blue-200";
      if (puntos === 1) return "bg-yellow-200";

    }

    return "bg-red-200";

  };


  const jugadoresFiltrados =
    filtroJugador === "todos"
      ? jugadores
      : [filtroJugador];


  return (

    <div className="mt-6">

      {/* filtros */}

      <div className="flex gap-4 mb-4">

        <div>

          <label className="mr-2 font-semibold">
            Jugador:
          </label>

          <select
            value={filtroJugador}
            onChange={e => setFiltroJugador(e.target.value)}
            className="border p-1 rounded"
          >

            <option value="todos">
              Todos
            </option>

            {

              jugadores.map(j => (

                <option key={j} value={j}>
                  {j}
                </option>

              ))

            }

          </select>

        </div>

      </div>


      {/* tabla */}

      <div className="overflow-x-auto">

        <table className="min-w-full border border-gray-300">

          <thead>

            <tr className="bg-gray-100">

              <th className="border p-2">
                Partido
              </th>

              <th className="border p-2">
                Resultado
              </th>

              {

                jugadoresFiltrados.map(j => (

                  <th key={j} className="border p-2">
                    {j}
                  </th>

                ))

              }

            </tr>

          </thead>


          <tbody>

            {

              tabla.map(partido => (

                <tr key={partido.partido}>

                  <td className="border p-2 font-semibold">

                    {partido.partido}

                    {partido.es_comodin && (

                      <span className="ml-2 text-xs bg-yellow-300 text-yellow-900 px-2 py-1 rounded">

                        ⭐ comodín

                      </span>

                    )}

                  </td>


                  <td className="border p-2 text-center font-bold">

                    {partido.resultado_real}

                  </td>


                  {

                    jugadoresFiltrados.map(j => {

                      const data =
                        partido.pronosticos[j];

                      if (!data)

                        return (

                          <td
                            key={j}
                            className="border p-2 text-center"
                          >
                            -
                          </td>

                        );


                      const color =
                        obtenerColor(
                          data.puntos,
                          partido.es_comodin
                        );


                      return (

                        <td
                          key={j}
                          className={`border p-2 text-center font-semibold ${color}`}
                        >

                          {data.pronostico}

                          <br />

                          <strong>
                            {data.puntos}
                          </strong>

                        </td>

                      );

                    })

                  }

                </tr>

              ))

            }


            {/* totales */}

            <tr className="bg-gray-200 font-bold">

              <td className="border p-2">
                TOTAL
              </td>

              <td></td>

              {

                jugadoresFiltrados.map(j => (

                  <td
                    key={j}
                    className="border p-2 text-center"
                  >

                    {totales[j]}

                  </td>

                ))

              }

            </tr>


          </tbody>

        </table>

      </div>

    </div>

  );

}

export default HistoricoGeneral;
