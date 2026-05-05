import { useEffect, useState } from "react";
import Ranking from "./Ranking";
import TimerJornada from "./TimerJornada";
import AdminJornadas from "./AdminJornadas";
import AdminPartidos from "./AdminPartidos";

function AdminResultados({ onLogout }) {

    const [jornada, setJornada] = useState(1);
    const [jornadas, setJornadas] = useState([]);
    const [partidos, setPartidos] = useState([]);

    const [marcadores, setMarcadores] = useState({});
    const [mensaje, setMensaje] = useState("");
    const [refreshRanking, setRefreshRanking] = useState(false);

    const [tab, setTab] = useState("resultados");

    const token = localStorage.getItem("token");


    /*
    ============================
    CARGAR JORNADAS
    ============================
    */

    const cargarJornadas = async () => {

        const res = await fetch(
            "https://quiniela-app-rq9c.onrender.com/jornadas"
        );

        const data = await res.json();

        setJornadas(data);

    };


    /*
    ============================
    CARGAR PARTIDOS + RESULTADOS
    ============================
    */

    const cargarPartidos = async () => {

        try {

            const response = await fetch(
                `https://quiniela-app-rq9c.onrender.com/partidos/${jornada}`
            );

            const data = await response.json();

            setPartidos(data);


            // precargar resultados guardados en inputs

            const resultadosExistentes = {};

            data.forEach(partido => {

                if (
                    partido.goles_local !== null &&
                    partido.goles_visitante !== null
                ) {

                    resultadosExistentes[partido.id] = {
                        local: partido.goles_local,
                        visitante: partido.goles_visitante
                    };

                }

            });

            setMarcadores(resultadosExistentes);

        }

        catch (error) {

            console.error(error);

        }

    };


    useEffect(() => {

        cargarJornadas();

    }, []);


    useEffect(() => {

        cargarPartidos();

    }, [jornada]);


    /*
    ============================
    GUARDAR RESULTADO INDIVIDUAL
    ============================
    */

    const registrarResultado = async (partidoId) => {

        try {

            const marcador = marcadores[partidoId];

            if (!marcador) {

                setMensaje("Ingresa el marcador primero");
                return;

            }

            const response = await fetch(
                `https://quiniela-app-rq9c.onrender.com/resultados/${partidoId}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        goles_local: marcador.local ?? 0,
                        goles_visitante: marcador.visitante ?? 0
                    })
                }
            );

            const data = await response.json();

            setMensaje(data.mensaje);

            setRefreshRanking(prev => !prev);

        }
        catch (error) {

            console.error(error);

        }

    };


    /*
    ============================
    GUARDAR TODOS RESULTADOS
    ============================
    */

    const guardarTodosResultados = async () => {

        try {

            const promesas = Object.entries(marcadores).map(
                ([partidoId, marcador]) =>

                    fetch(
                        `https://quiniela-app-rq9c.onrender.com/resultados/${partidoId}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                goles_local: marcador.local ?? 0,
                                goles_visitante: marcador.visitante ?? 0
                            })
                        }
                    )
            );

            await Promise.all(promesas);

            setMensaje("Resultados guardados correctamente");

            setRefreshRanking(prev => !prev);

        }
        catch (error) {

            console.error(error);

        }

    };


    /*
    ============================
    ACTUALIZAR INPUT MARCADOR
    ============================
    */

    const actualizarMarcador = (partidoId, equipo, valor) => {

        setMarcadores(prev => ({

            ...prev,

            [partidoId]: {

                ...prev[partidoId],

                [equipo]: Number(valor)

            }

        }));

    };


    return (

        <div style={{ padding: "40px", fontFamily: "Arial" }}>


            {/* HEADER */}

            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
            }}>

                <h1>Panel Admin ⚙️</h1>

                <TimerJornada jornada={jornada} />

                <div style={{ display: "flex", gap: "10px" }}>

                    <button
                        onClick={guardarTodosResultados}
                        style={btnGuardarTodos}
                    >

                        Guardar todos

                    </button>

                    <button
                        onClick={onLogout}
                        style={btnCerrarSesion}
                    >

                        Cerrar sesión

                    </button>

                </div>

            </div>


            {/* RANKING */}

            <Ranking
                refresh={refreshRanking}
                jornada={jornada}
            />


            <hr style={{ margin: "30px 0" }} />


            {/* TABS */}

            <div style={{ display: "flex", gap: "12px", marginBottom: "20px" }}>

                {[
                    { id: "resultados", label: "Resultados" },
                    { id: "jornadas", label: "Jornadas" },
                    { id: "partidos", label: "Partidos" }
                ].map(t => (

                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: "10px 20px",
                            borderRadius: "8px",
                            border: "none",
                            cursor: "pointer",
                            background:
                                tab === t.id
                                    ? "#2563eb"
                                    : "#e5e7eb",
                            color:
                                tab === t.id
                                    ? "white"
                                    : "black"
                        }}
                    >

                        {t.label}

                    </button>

                ))}

            </div>


            {/* TAB RESULTADOS */}

            {tab === "resultados" && (

                <div>

                    <h2 style={{ marginBottom: "15px" }}>
                        Registrar Resultados ⚽
                    </h2>


                    <div style={{
                        marginBottom: "20px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                    }}>

                        <label style={{ fontWeight: "600" }}>
                            Seleccionar jornada:
                        </label>

                        <select
                            value={jornada}
                            onChange={(e) => setJornada(e.target.value)}
                            style={selectStyle}
                        >

                            {
                                jornadas.map(j => (
                                    <option key={j.numero} value={j.numero}>
                                        Jornada {j.numero}
                                    </option>
                                ))
                            }

                        </select>

                    </div>


                    <table style={tablaResultados}>

                        <thead>

                            <tr>

                                <th style={thStyle}>Local</th>
                                <th style={thStyle}>Visitante</th>
                                <th style={thStyle}>Resultado</th>
                                <th style={thStyle}>⭐</th>
                                <th style={thStyle}>Estado</th>
                                <th style={thStyle}>Acción</th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                partidos.map(partido => {

                                    const marcador = marcadores[partido.id] || {};

                                    return (

                                        <tr
                                            key={partido.id}
                                            style={{
                                                ...filaStyle,
                                                background: partido.es_comodin
                                                    ? "#fff7ed"
                                                    : "transparent"
                                            }}
                                        >

                                            <td style={tdEquipo}>
                                                {partido.local}
                                            </td>


                                            <td style={tdEquipo}>
                                                {partido.visitante}
                                            </td>


                                            <td style={tdResultado}>

                                                <input
                                                    type="number"
                                                    value={marcador.local ?? ""}
                                                    style={inputMarcador}
                                                    onChange={(e) =>
                                                        actualizarMarcador(
                                                            partido.id,
                                                            "local",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                                <span>-</span>

                                                <input
                                                    type="number"
                                                    value={marcador.visitante ?? ""}
                                                    style={inputMarcador}
                                                    onChange={(e) =>
                                                        actualizarMarcador(
                                                            partido.id,
                                                            "visitante",
                                                            e.target.value
                                                        )
                                                    }
                                                />

                                            </td>


                                            <td style={{ textAlign: "center" }}>

                                                {partido.es_comodin && "⭐"}

                                            </td>


                                            <td>

                                                {
                                                    marcador.local !== undefined
                                                        ? "✅ guardado"
                                                        : "⚪ pendiente"
                                                }

                                            </td>


                                            <td>

                                                <button
                                                    onClick={() => registrarResultado(partido.id)}
                                                    style={btnGuardar}
                                                >

                                                    Guardar

                                                </button>

                                            </td>

                                        </tr>

                                    )

                                })
                            }

                        </tbody>

                    </table>

                </div>

            )}


            {tab === "jornadas" && <AdminJornadas />}
            {tab === "partidos" && <AdminPartidos />}

            <p>{mensaje}</p>

        </div>

    );

}

export default AdminResultados;


/*
============================
ESTILOS
============================
*/

const tablaResultados = {

    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed"

};


const thStyle = {

    textAlign: "left",
    padding: "12px",
    borderBottom: "2px solid #ddd"

};


const filaStyle = {

    borderBottom: "1px solid #eee"

};


const tdEquipo = {

    padding: "10px",
    width: "20%"

};


const tdResultado = {

    display: "flex",
    gap: "6px",
    alignItems: "center"

};


const badgeResultado = {

    display: "inline-block",
    marginTop: "4px",
    background: "#dbeafe",
    color: "#1d4ed8",
    padding: "2px 6px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600"

};


const inputMarcador = {

    width: "55px",
    padding: "6px",
    borderRadius: "6px",
    border: "1px solid #ccc",
    textAlign: "center"

};


const btnGuardar = {

    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600"

};


const btnGuardarTodos = {

    background: "#16a34a",
    color: "white",
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    fontWeight: "600"

};


const btnCerrarSesion = {

    background: "#dc2626",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer"

};


const selectStyle = {

    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #ccc"

};