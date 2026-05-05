import { useEffect, useState } from "react";

function AdminPartidos() {

    const [partidos, setPartidos] = useState([]);
    const [jornadas, setJornadas] = useState([]);

    const [local, setLocal] = useState("");
    const [visitante, setVisitante] = useState("");
    const [fecha, setFecha] = useState("");
    const [jornadaId, setJornadaId] = useState("");
    const [comodin, setComodin] = useState(false);

    const [editandoId, setEditandoId] = useState(null);

    const token = localStorage.getItem("token");


    /*
    =========================
    CARGAR JORNADAS
    =========================
    */

    const cargarJornadas = async () => {

        const res = await fetch(
            "https://quiniela-app-rq9c.onrender.com/jornadas"
        );

        const data = await res.json();

        setJornadas(data);

        // seleccionar jornada activa automáticamente

        const activa = data.find(j => j.estado !== "cerrada");

        if (activa) setJornadaId(activa.numero);

    };


    /*
    =========================
    CARGAR PARTIDOS
    =========================
    */

    const cargarPartidos = async () => {

        const res = await fetch(
            "https://quiniela-app-rq9c.onrender.com/partidos",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        // ordenar por fecha

        data.sort((a, b) =>
            new Date(a.fecha) - new Date(b.fecha)
        );

        setPartidos(data);

    };


    useEffect(() => {

        cargarJornadas();
        cargarPartidos();

    }, []);


    /*
    =========================
    GUARDAR PARTIDO
    =========================
    */

    const guardarPartido = async () => {

        if (!local || !visitante || !jornadaId) {

            alert("Completa los campos");

            return;

        }

        const url = editandoId
            ? `https://quiniela-app-rq9c.onrender.com/partidos/${editandoId}`
            : "https://quiniela-app-rq9c.onrender.com/partidos";

        const method = editandoId ? "PUT" : "POST";

        await fetch(url, {

            method,

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },

            body: JSON.stringify({

                local,
                visitante,
                fecha,
                jornada_id: Number(jornadaId),
                es_comodin: comodin

            })

        });

        limpiarFormulario();

        cargarPartidos();

    };


    /*
    =========================
    EDITAR
    =========================
    */

    const editarPartido = (p) => {

        setLocal(p.local);
        setVisitante(p.visitante);
        setFecha(p.fecha?.slice(0, 16));
        setJornadaId(p.jornada_id);
        setComodin(p.es_comodin);

        setEditandoId(p.id);

    };


    /*
    =========================
    ELIMINAR
    =========================
    */

    const eliminarPartido = async (id) => {

        if (!confirm("Eliminar partido?")) return;

        await fetch(

            `https://quiniela-app-rq9c.onrender.com/partidos/${id}`,

            {
                method: "DELETE",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }

        );

        cargarPartidos();

    };


    /*
    =========================
    LIMPIAR FORMULARIO
    =========================
    */

    const limpiarFormulario = () => {

        setLocal("");
        setVisitante("");
        setFecha("");
        setComodin(false);

        setEditandoId(null);

    };


    /*
    =========================
    FILTRAR POR JORNADA
    =========================
    */

    const partidosFiltrados = partidos.filter(
        p => p.jornada_id === jornadaId
    );


    /*
    =========================
    RENDER
    =========================
    */

    return (

        <div>

            <h2>Gestión de Partidos ⚽</h2>


            {/* FORMULARIO */}

            <div style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "20px"
            }}>

                <input
                    placeholder="Equipo local"
                    value={local}
                    onChange={e => setLocal(e.target.value)}
                />

                <input
                    placeholder="Equipo visitante"
                    value={visitante}
                    onChange={e => setVisitante(e.target.value)}
                />

                <input
                    type="datetime-local"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                />


                <select
                    value={jornadaId}
                    onChange={e => setJornadaId(Number(e.target.value))}
                >

                    <option value="">
                        Seleccionar jornada
                    </option>

                    {
                        jornadas.map(j => (

                            <option
                                key={j.numero}
                                value={j.numero}
                            >

                                Jornada {j.numero}

                                {j.estado === "cerrada"
                                    ? " 🔒"
                                    : new Date() < new Date(j.fecha_inicio)
                                        ? " 🟢"
                                        : new Date() > new Date(j.fecha_inicio)
                                            && new Date() < new Date(j.fecha_cierre)
                                            ? " 🟡"
                                            : ""}

                            </option>

                        ))
                    }

                </select>


                <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px"
                }}>

                    <input
                        type="checkbox"
                        checked={comodin}
                        onChange={() => setComodin(!comodin)}
                    />

                    ⭐ Comodín

                </label>


                <button
                    onClick={guardarPartido}
                    style={botonCrear}
                >

                    {editandoId
                        ? "✏️ Actualizar partido"
                        : "➕ Crear partido"}

                </button>


                {
                    editandoId && (

                        <button
                            onClick={limpiarFormulario}
                            style={botonCancelar}
                        >

                            Cancelar edición

                        </button>

                    )
                }

            </div>


            <hr />


            {/* TABLA PARTIDOS */}

            <h3>Partidos de la jornada</h3>

            {
                !jornadaId
                    ? (
                        <p style={{ color: "#6b7280" }}>
                            Selecciona jornada
                        </p>
                    )
                    : (

                        <table style={tabla}>

                            <thead>

                                <tr style={thead}>

                                    <th>Local</th>
                                    <th>Visitante</th>
                                    <th>Fecha</th>
                                    <th>⭐</th>
                                    <th>Acciones</th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    partidosFiltrados.length === 0
                                        ? (
                                            <tr>

                                                <td colSpan="5">

                                                    Sin partidos registrados

                                                </td>

                                            </tr>
                                        )
                                        : (

                                            partidosFiltrados.map(p => (

                                                <tr key={p.id} style={fila}>

                                                    <td>{p.local}</td>

                                                    <td>{p.visitante}</td>

                                                    <td>
                                                        {new Date(p.fecha).toLocaleString()}
                                                    </td>

                                                    <td>
                                                        {p.es_comodin ? "⭐" : ""}
                                                    </td>

                                                    <td>

                                                        <button
                                                            onClick={() => editarPartido(p)}
                                                            style={botonEditar}
                                                        >

                                                            ✏️ Editar

                                                        </button>


                                                        <button
                                                            onClick={() => eliminarPartido(p.id)}
                                                            style={botonEliminar}
                                                        >

                                                            🗑 Eliminar

                                                        </button>

                                                    </td>

                                                </tr>

                                            ))
                                        )

                                }

                            </tbody>

                        </table>

                    )

            }

        </div>

    );

}


/*
=========================
ESTILOS
=========================
*/

const tabla = {
    width: "100%",
    borderCollapse: "collapse"
};

const thead = {
    background: "#f3f4f6"
};

const fila = {
    borderBottom: "1px solid #eee"
};

const botonCrear = {
    background: "#2563eb",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
};

const botonCancelar = {
    background: "#6b7280",
    color: "white",
    padding: "10px 18px",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer"
};

const botonEditar = {
    background: "#f59e0b",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "6px"
};

const botonEliminar = {
    background: "#dc2626",
    color: "white",
    padding: "6px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
};


export default AdminPartidos;