import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminJornadas({ torneoId }) {
  const [jornadas, setJornadas] = useState([]);
  const [numero, setNumero] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaCierre, setFechaCierre] = useState("");
  const [modoEdicion, setModoEdicion] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const token = localStorage.getItem("token");

  const cargarJornadas = async () => {
    if (!torneoId) return;

    try {
      const response = await fetch(`${API}/jornadas?torneo_id=${torneoId}`);
      const data = await response.json();
      if (Array.isArray(data)) setJornadas(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    cargarJornadas();
  }, [torneoId]);

  const guardarJornada = async () => {
    if (!torneoId) {
      setMensaje("⚠ No hay torneo seleccionado");
      return;
    }

    try {
      const url = modoEdicion ? `${API}/jornadas/${numero}` : `${API}/jornadas`;
      const method = modoEdicion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          numero,
          fecha_inicio: fechaInicio,
          fecha_cierre: fechaCierre,
          torneo_id: torneoId,
        }),
      });

      const data = await response.json();
      setMensaje(data.mensaje || (modoEdicion ? "Jornada actualizada" : "Jornada creada"));
      limpiarFormulario();
      cargarJornadas();
    } catch (error) {
      console.error(error);
      setMensaje("Error guardando jornada");
    }
  };

  const editarJornada = (jornada) => {
    setNumero(jornada.numero);
    setFechaInicio(jornada.fecha_inicio?.slice(0, 16));
    setFechaCierre(jornada.fecha_cierre?.slice(0, 16));
    setModoEdicion(true);
  };

  const eliminarJornada = async (num) => {
    if (!window.confirm("¿Eliminar jornada?")) return;

    try {
      const response = await fetch(`${API}/jornadas/${num}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      setMensaje(data.mensaje || "Jornada eliminada");
      cargarJornadas();
    } catch (error) {
      console.error(error);
      setMensaje("Error eliminando jornada");
    }
  };

  const cerrarJornada = async (num) => {
    try {
      const response = await fetch(`${API}/jornadas/${num}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha_cierre: new Date().toISOString() }),
      });

      if (!response.ok) throw new Error("No se pudo cerrar la jornada");

      const data = await response.json();
      setMensaje(data.mensaje || "Jornada cerrada correctamente");
      cargarJornadas();
    } catch (error) {
      console.error(error);
      setMensaje("Error cerrando jornada");
    }
  };

  const limpiarFormulario = () => {
    setNumero("");
    setFechaInicio("");
    setFechaCierre("");
    setModoEdicion(false);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Gestión de Jornadas 📅</h2>

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

      {mensaje && (
        <p className="mb-4 text-sm font-medium text-gray-700">{mensaje}</p>
      )}

      <hr className="mb-4" />

      {jornadas.map((j) => (
        <div key={j.numero} className="flex justify-between items-center p-3 border-b border-gray-300">
          <div>
            <strong>
              Jornada {j.numero}{" "}
              <span
                className={`ml-2 px-2 py-0.5 rounded text-xs text-white font-semibold ${
                  j.estado === "cerrada" ? "bg-red-600" : "bg-green-600"
                }`}
              >
                {j.estado}
              </span>
            </strong>

            <br />
            Inicio: {new Date(j.fecha_inicio).toLocaleString()}
            <br />
            Cierre: {new Date(j.fecha_cierre).toLocaleString()}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => editarJornada(j)}
              className="bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
            >
              Editar
            </button>

            <button
              disabled={j.estado === "cerrada"}
              onClick={() => cerrarJornada(j.numero)}
              className={`bg-orange-600 text-white px-3 py-1.5 rounded hover:bg-orange-700 ${
                j.estado === "cerrada" ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              Cerrar
            </button>

            <button
              onClick={() => eliminarJornada(j.numero)}
              className="bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminJornadas;
