import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminJornadas() {
  const [torneos, setTorneos] = useState([]);
  const [torneoSeleccionado, setTorneoSeleccionado] = useState("");

  const [jornadas, setJornadas] = useState([]);
  const [numero, setNumero] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaCierre, setFechaCierre] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [reabrirNumero, setReabrirNumero] = useState(null);
  const [nuevaFechaCierre, setNuevaFechaCierre] = useState("");

  const token = localStorage.getItem("token");

  const cargarTorneos = async () => {
    try {
      const res = await fetch(`${API}/torneos`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setTorneos(data);
        setTorneoSeleccionado(data[0].id);
      }
    } catch (error) {
      console.error("Error cargando torneos:", error);
    }
  };

  const cargarJornadas = async (tid) => {
    if (!tid) return;
    try {
      const res = await fetch(`${API}/jornadas?torneo_id=${tid}`);
      const data = await res.json();
      if (Array.isArray(data)) setJornadas(data);
    } catch (error) {
      console.error("Error cargando jornadas:", error);
    }
  };

  useEffect(() => {
    cargarTorneos();
  }, []);

  useEffect(() => {
    cargarJornadas(torneoSeleccionado);
  }, [torneoSeleccionado]);

  const guardarJornada = async () => {
    if (!torneoSeleccionado) {
      setMensaje("⚠ Selecciona un torneo");
      return;
    }

    try {
      const url = modoEdicion ? `${API}/jornadas/${numero}` : `${API}/jornadas`;
      const method = modoEdicion ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numero,
          fecha_inicio: fechaInicio,
          fecha_cierre: fechaCierre,
          torneo_id: torneoSeleccionado,
        }),
      });

      const data = await res.json();
      setMensaje(data.mensaje || (modoEdicion ? "Jornada actualizada" : "Jornada creada"));
      limpiarFormulario();
      cargarJornadas(torneoSeleccionado);
    } catch (error) {
      console.error(error);
      setMensaje("Error guardando jornada");
    }
  };

  const editarJornada = (jornada) => {
    setNumero(jornada.numero);
    setFechaInicio(jornada.fecha_inicio?.slice(0, 16));
    setFechaCierre(jornada.fecha_cierre?.slice(0, 16));
    if (jornada.torneo_id) setTorneoSeleccionado(jornada.torneo_id);
    setModoEdicion(true);
  };

  const eliminarJornada = async (num) => {
    if (!window.confirm("¿Eliminar jornada?")) return;
    try {
      const res = await fetch(`${API}/jornadas/${num}?torneo_id=${torneoSeleccionado}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMensaje(data.mensaje || "Jornada eliminada");
      cargarJornadas(torneoSeleccionado);
    } catch (error) {
      console.error(error);
      setMensaje("Error eliminando jornada");
    }
  };

  const cerrarJornada = async (num) => {
    try {
      const res = await fetch(`${API}/jornadas/${num}/cerrar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ torneo_id: torneoSeleccionado }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMensaje(data.mensaje || "Jornada cerrada correctamente");
      cargarJornadas(torneoSeleccionado);
    } catch (error) {
      console.error(error);
      setMensaje("Error cerrando jornada");
    }
  };

  const reabrirJornada = async (num) => {
    if (!nuevaFechaCierre) {
      setMensaje("⚠ Selecciona una nueva fecha de cierre");
      return;
    }
    try {
      const res = await fetch(`${API}/jornadas/${num}/abrir`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ torneo_id: torneoSeleccionado, fecha_cierre: nuevaFechaCierre }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMensaje(`❌ ${data.mensaje || "Error reabriendo jornada"}`);
        return;
      }
      setMensaje(`✅ ${data.mensaje}`);
      setReabrirNumero(null);
      setNuevaFechaCierre("");
      cargarJornadas(torneoSeleccionado);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  const limpiarFormulario = () => {
    setNumero("");
    setFechaInicio("");
    setFechaCierre("");
    setModoEdicion(false);
  };

  const torneoActual = torneos.find((t) => t.id === Number(torneoSeleccionado));

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Gestión de Jornadas 📅</h2>

      {/* Selector de torneo */}
      <div className="mb-5 flex items-center gap-3">
        <label className="font-semibold text-sm">Torneo:</label>
        <select
          value={torneoSeleccionado}
          onChange={(e) => setTorneoSeleccionado(Number(e.target.value))}
          className="px-3 py-2 rounded border border-gray-300 font-medium"
        >
          {torneos.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.temporada ? `(${t.temporada})` : ""}
            </option>
          ))}
        </select>

        {torneoActual && (
          <span
            className={`px-2 py-0.5 rounded text-xs text-white font-semibold ${
              torneoActual.estado === "cerrado" ? "bg-red-500" : "bg-green-600"
            }`}
          >
            {torneoActual.estado || "abierto"}
          </span>
        )}
      </div>

      {/* Formulario */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        <input
          placeholder="Número jornada"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          className="p-2 rounded border border-gray-300"
        />

        <input
          type="datetime-local"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          className="p-2 rounded border border-gray-300"
        />

        <input
          type="datetime-local"
          value={fechaCierre}
          onChange={(e) => setFechaCierre(e.target.value)}
          className="p-2 rounded border border-gray-300"
        />

        <button
          onClick={guardarJornada}
          className="bg-blue-600 text-white px-3.5 py-2 rounded hover:bg-blue-700"
        >
          {modoEdicion ? "Actualizar" : "Crear"}
        </button>

        {modoEdicion && (
          <button
            onClick={limpiarFormulario}
            className="bg-gray-500 text-white px-3 py-2 rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        )}
      </div>

      {mensaje && <p className="mb-4 text-sm font-medium text-gray-700">{mensaje}</p>}

      <hr className="mb-4" />

      {jornadas.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay jornadas para este torneo.</p>
      ) : (
        jornadas.map((j) => {
          const cierreEnPasado = new Date(j.fecha_cierre) <= new Date();
          const bloqueada = j.estado !== "abierta" || cierreEnPasado;

          return (
            <div key={j.numero} className="border-b border-gray-300">
              <div className="flex justify-between items-center p-3">
                <div>
                  <strong>
                    Jornada {j.numero}{" "}
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs text-white font-semibold ${
                        bloqueada ? "bg-red-600" : "bg-green-600"
                      }`}
                    >
                      {bloqueada ? "bloqueada" : j.estado}
                    </span>
                  </strong>
                  <br />
                  Inicio: {new Date(j.fecha_inicio).toLocaleString()}
                  <br />
                  Cierre: {new Date(j.fecha_cierre).toLocaleString()}
                </div>

                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => editarJornada(j)}
                    className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                  >
                    Editar
                  </button>

                  {bloqueada ? (
                    <button
                      onClick={() => {
                        setReabrirNumero(j.numero);
                        setNuevaFechaCierre("");
                        setMensaje("");
                      }}
                      className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700"
                    >
                      🔓 Reabrir
                    </button>
                  ) : (
                    <button
                      onClick={() => cerrarJornada(j.numero)}
                      className="bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700"
                    >
                      Cerrar
                    </button>
                  )}

                  <button
                    onClick={() => eliminarJornada(j.numero)}
                    className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              {reabrirNumero === j.numero && (
                <div className="flex items-center gap-2 px-3 pb-3 bg-blue-50 border-t border-blue-100">
                  <span className="text-sm font-semibold text-blue-700">Nueva fecha de cierre:</span>
                  <input
                    type="datetime-local"
                    value={nuevaFechaCierre}
                    onChange={(e) => setNuevaFechaCierre(e.target.value)}
                    className="p-1.5 rounded border border-gray-300 text-sm"
                  />
                  <button
                    onClick={() => reabrirJornada(j.numero)}
                    className="bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 text-sm font-semibold"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={() => { setReabrirNumero(null); setNuevaFechaCierre(""); }}
                    className="bg-gray-400 text-white px-3 py-1.5 rounded hover:bg-gray-500 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

export default AdminJornadas;
