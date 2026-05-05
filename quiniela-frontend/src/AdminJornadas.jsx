import { useEffect, useState } from "react";

function AdminJornadas() {

  const [jornadas, setJornadas] = useState([]);
  const [numero, setNumero] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaCierre, setFechaCierre] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);

  const token = localStorage.getItem("token");


  /*
  ============================
  CARGAR JORNADAS
  ============================
  */

  const cargarJornadas = async () => {

    try {

      const response = await fetch(
        "https://quiniela-app-rq9c.onrender.com/jornadas"
      );

      const data = await response.json();

      setJornadas(data);

    }

    catch (error) {

      console.error(error);

    }

  };


  useEffect(() => {

    cargarJornadas();

  }, []);


  /*
  ============================
  CREAR / EDITAR JORNADA
  ============================
  */

  const guardarJornada = async () => {

    try {

      const url = modoEdicion
        ? `https://quiniela-app-rq9c.onrender.com/jornadas/${numero}`
        : "https://quiniela-app-rq9c.onrender.com/jornadas";

      const method = modoEdicion ? "PUT" : "POST";


      const response = await fetch(url, {

        method,

        headers: {

          "Content-Type": "application/json",

          Authorization: `Bearer ${token}`

        },

        body: JSON.stringify({

          numero,

          fecha_inicio: fechaInicio,

          fecha_cierre: fechaCierre

        })

      });


      const data = await response.json();

      alert(data.mensaje);

      limpiarFormulario();

      cargarJornadas();

    }

    catch (error) {

      console.error(error);

    }

  };


  /*
  ============================
  CARGAR DATOS PARA EDITAR
  ============================
  */

  const editarJornada = (jornada) => {

    setNumero(jornada.numero);

    setFechaInicio(
      jornada.fecha_inicio?.slice(0, 16)
    );

    setFechaCierre(
      jornada.fecha_cierre?.slice(0, 16)
    );

    setModoEdicion(true);

  };


  /*
  ============================
  ELIMINAR JORNADA
  ============================
  */

  const eliminarJornada = async (numero) => {

    if (!window.confirm("¿Eliminar jornada?")) return;

    try {

      const response = await fetch(
        `https://quiniela-app-rq9c.onrender.com/jornadas/${numero}`,
        {

          method: "DELETE",

          headers: {

            Authorization: `Bearer ${token}`

          }

        }

      );

      const data = await response.json();

      alert(data.mensaje);

      cargarJornadas();

    }

    catch (error) {

      console.error(error);

    }

  };


  /*
  ============================
  CERRAR JORNADA
  ============================
  */

  const cerrarJornada = async (numero) => {

    try {

      const response = await fetch(
        `https://quiniela-app-rq9c.onrender.com/jornadas/${numero}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            fecha_cierre: new Date().toISOString()
          })
        }
      );

      if (!response.ok) {

        throw new Error("No se pudo cerrar la jornada");

      }

      const data = await response.json();

      alert(data.mensaje || "Jornada cerrada correctamente");

      cargarJornadas();

    }

    catch (error) {

      console.error(error);

      alert("Error cerrando jornada");

    }

  };


  /*
  ============================
  LIMPIAR FORMULARIO
  ============================
  */

  const limpiarFormulario = () => {

    setNumero("");

    setFechaInicio("");

    setFechaCierre("");

    setModoEdicion(false);

  };


  return (

    <div>

      <h2>Gestión de Jornadas 📅</h2>


      {/* FORMULARIO */}

      <div style={{

        display: "flex",

        gap: "10px",

        marginBottom: "20px"

      }}>


        <input

          placeholder="Número jornada"

          value={numero}

          onChange={(e) => setNumero(e.target.value)}

          style={inputStyle}

        />


        <input

          type="datetime-local"

          value={fechaInicio}

          onChange={(e) => setFechaInicio(e.target.value)}

          style={inputStyle}

        />


        <input

          type="datetime-local"

          value={fechaCierre}

          onChange={(e) => setFechaCierre(e.target.value)}

          style={inputStyle}

        />


        <button

          onClick={guardarJornada}

          style={botonAzul}

        >

          {modoEdicion ? "Actualizar" : "Crear"}

        </button>


        {

          modoEdicion && (

            <button

              onClick={limpiarFormulario}

              style={botonGris}

            >

              Cancelar

            </button>

          )

        }


      </div>


      <hr />


      {/* LISTA JORNADAS */}


      {

        jornadas.map(j => (

          <div key={j.numero} style={cardStyle}>


            <div>

              <strong>

                Jornada {j.numero}

                <span
                  style={{
                    marginLeft: "10px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background:
                      j.estado === "cerrada"
                        ? "#dc2626"
                        : "#16a34a",
                    color: "white",
                    fontSize: "12px"
                  }}
                >

                  {j.estado}

                </span>

              </strong>


              <br />

              Inicio:

              {new Date(j.fecha_inicio).toLocaleString()}


              <br />

              Cierre:

              {new Date(j.fecha_cierre).toLocaleString()}

            </div>


            <div style={{ display: "flex", gap: "8px" }}>


              <button

                onClick={() => editarJornada(j)}

                style={botonVerde}

              >

                Editar

              </button>


              <button
                disabled={j.estado === "cerrada"}
                onClick={() => cerrarJornada(j.numero)}
                style={{
                  ...botonNaranja,
                  opacity: j.estado === "cerrada" ? 0.5 : 1,
                  cursor: j.estado === "cerrada" ? "not-allowed" : "pointer"
                }}
              >
                Cerrar
              </button>


              <button

                onClick={() => eliminarJornada(j.numero)}

                style={botonRojo}

              >

                Eliminar

              </button>


            </div>


          </div>

        ))

      }


    </div>

  );

}


/*
============================
ESTILOS
============================
*/

const inputStyle = {

  padding: "8px",

  borderRadius: "6px",

  border: "1px solid #ccc"

};


const botonAzul = {

  background: "#2563eb",

  color: "white",

  padding: "8px 14px",

  border: "none",

  borderRadius: "6px",

  cursor: "pointer"

};


const botonVerde = {

  background: "#16a34a",

  color: "white",

  padding: "6px 12px",

  border: "none",

  borderRadius: "6px",

  cursor: "pointer"

};


const botonNaranja = {

  background: "#ea580c",

  color: "white",

  padding: "6px 12px",

  border: "none",

  borderRadius: "6px",

  cursor: "pointer"

};


const botonRojo = {

  background: "#dc2626",

  color: "white",

  padding: "6px 12px",

  border: "none",

  borderRadius: "6px",

  cursor: "pointer"

};


const botonGris = {

  background: "#6b7280",

  color: "white",

  padding: "6px 12px",

  border: "none",

  borderRadius: "6px",

  cursor: "pointer"

};


const cardStyle = {

  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

  padding: "12px",

  borderBottom: "1px solid #ddd"

};


export default AdminJornadas;