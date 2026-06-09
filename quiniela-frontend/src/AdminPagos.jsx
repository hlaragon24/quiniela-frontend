import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

function AdminPagos({ torneoId }) {
  const [pagos, setPagos] = useState([]);
  const [editando, setEditando] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState("todos");

  const token = localStorage.getItem("token");

  const cargarPagos = async () => {
    if (!torneoId) return;

    try {
      setCargando(true);

      const res = await fetch(`${API}/pagos?torneo_id=${torneoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.mensaje || "Error cargando pagos");
        return;
      }

      const lista = Array.isArray(data) ? data : [];
      setPagos(lista);

      const mapa = {};
      lista.forEach((p) => {
        mapa[p.usuario_id] = {
          monto: p.monto || 0,
          pagado: Boolean(p.pagado),
          metodo_pago: p.metodo_pago || "",
          notas: p.notas || "",
        };
      });

      setEditando(mapa);
    } catch (error) {
      console.error("Error cargando pagos:", error);
      setMensaje("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const actualizarCampo = (usuarioId, campo, valor) => {
    setEditando((prev) => ({
      ...prev,
      [usuarioId]: { ...prev[usuarioId], [campo]: valor },
    }));
  };

  const guardarPago = async (usuarioId) => {
    const datos = editando[usuarioId];

    try {
      setMensaje("Guardando pago...");

      const res = await fetch(`${API}/pagos/${usuarioId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          monto: Number(datos.monto || 0),
          pagado: Boolean(datos.pagado),
          metodo_pago: datos.metodo_pago || null,
          notas: datos.notas || null,
          torneo_id: torneoId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(data.mensaje || "Error guardando pago");
        return;
      }

      setMensaje(data.mensaje);
      await cargarPagos();
    } catch (error) {
      console.error("Error guardando pago:", error);
      setMensaje("Error de conexión con el servidor");
    }
  };

  useEffect(() => {
    cargarPagos();
  }, [torneoId]);

  const pagosFiltrados = useMemo(() => {
    if (filtro === "pagados") return pagos.filter((p) => Boolean(editando[p.usuario_id]?.pagado));
    if (filtro === "pendientes") return pagos.filter((p) => !Boolean(editando[p.usuario_id]?.pagado));
    return pagos;
  }, [pagos, editando, filtro]);

  const resumen = useMemo(() => {
    const totalJugadores = pagos.length;
    const pagados = pagos.filter((p) => Boolean(editando[p.usuario_id]?.pagado)).length;
    const pendientes = totalJugadores - pagados;
    const totalRecaudado = pagos.reduce((acc, p) => {
      const datos = editando[p.usuario_id];
      return datos?.pagado ? acc + Number(datos.monto || 0) : acc;
    }, 0);
    const totalEsperado = pagos.reduce((acc, p) => acc + Number(editando[p.usuario_id]?.monto || 0), 0);
    const porcentaje = totalJugadores === 0 ? 0 : Math.round((pagados / totalJugadores) * 100);

    return { totalJugadores, pagados, pendientes, totalRecaudado, totalEsperado, porcentaje };
  }, [pagos, editando]);

  if (cargando) return <p className="mt-4 text-gray-500">Cargando pagos...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-5">Control de Pagos 💵</h2>

      {/* Resumen cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Jugadores", valor: resumen.totalJugadores, color: "" },
          { label: "Pagados", valor: resumen.pagados, color: "text-green-600" },
          { label: "Pendientes", valor: resumen.pendientes, color: "text-red-600" },
          {
            label: "Recaudado",
            valor: `$${resumen.totalRecaudado.toFixed(2)}`,
            sub: `Esperado: $${resumen.totalEsperado.toFixed(2)}`,
            color: "",
          },
        ].map((item) => (
          <div key={item.label} className="border rounded-lg p-3.5 bg-gray-50">
            <p className="text-sm text-gray-500 m-0">{item.label}</p>
            <strong className={`text-2xl ${item.color}`}>{item.valor}</strong>
            {item.sub && <p className="text-xs text-gray-500 mt-1">{item.sub}</p>}
          </div>
        ))}
      </div>

      {/* Barra de progreso */}
      <div className="border rounded-lg p-3.5 bg-gray-50 mb-5">
        <div className="flex justify-between">
          <strong>💵 Estado financiero</strong>
          <strong>{resumen.porcentaje}%</strong>
        </div>
        <div className="w-full h-3.5 bg-gray-200 rounded-full overflow-hidden mt-2.5">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${resumen.porcentaje}%`,
              background: resumen.porcentaje >= 80 ? "#16a34a" : resumen.porcentaje >= 50 ? "#f59e0b" : "#dc2626",
            }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {resumen.pagados} pagado(s), {resumen.pendientes} pendiente(s).
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        {[
          { id: "todos", label: "Todos" },
          { id: "pagados", label: "Pagados" },
          { id: "pendientes", label: "Pendientes" },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setFiltro(item.id)}
            className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
              filtro === item.id ? "bg-blue-600 text-white" : "bg-gray-200 text-black hover:bg-gray-300"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mensaje && (
        <div className="mb-4 px-4 py-2.5 border rounded-lg bg-gray-50 text-sm">{mensaje}</div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 border-b-2 border-gray-300">Jugador</th>
              <th className="text-left p-3 border-b-2 border-gray-300">Email</th>
              <th className="text-center p-3 border-b-2 border-gray-300">Monto</th>
              <th className="text-center p-3 border-b-2 border-gray-300">Estado</th>
              <th className="text-center p-3 border-b-2 border-gray-300">Método</th>
              <th className="text-left p-3 border-b-2 border-gray-300">Notas</th>
              <th className="text-center p-3 border-b-2 border-gray-300">Acción</th>
            </tr>
          </thead>

          <tbody>
            {pagosFiltrados.map((pago) => {
              const datos = editando[pago.usuario_id] || {};

              return (
                <tr
                  key={pago.usuario_id}
                  className={datos.pagado ? "bg-green-50" : "bg-red-50"}
                >
                  <td className="p-2.5 border-b border-gray-200">
                    <strong>{pago.nombre}</strong>
                  </td>
                  <td className="p-2.5 border-b border-gray-200">{pago.email}</td>
                  <td className="p-2.5 border-b border-gray-200 text-center">
                    <input
                      type="number"
                      min="0"
                      value={datos.monto}
                      onChange={(e) => actualizarCampo(pago.usuario_id, "monto", e.target.value)}
                      className="w-24 p-1.5 rounded border border-gray-300 text-center"
                    />
                  </td>
                  <td className="p-2.5 border-b border-gray-200 text-center">
                    <label className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(datos.pagado)}
                        onChange={(e) => actualizarCampo(pago.usuario_id, "pagado", e.target.checked)}
                      />{" "}
                      {datos.pagado ? "✅ Pagado" : "❌ Pendiente"}
                    </label>
                  </td>
                  <td className="p-2.5 border-b border-gray-200 text-center">
                    <select
                      value={datos.metodo_pago}
                      onChange={(e) => actualizarCampo(pago.usuario_id, "metodo_pago", e.target.value)}
                      className="p-1.5 rounded border border-gray-300"
                    >
                      <option value="">Sin método</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Transferencia">Transferencia</option>
                      <option value="Depósito">Depósito</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </td>
                  <td className="p-2.5 border-b border-gray-200">
                    <input
                      type="text"
                      value={datos.notas}
                      onChange={(e) => actualizarCampo(pago.usuario_id, "notas", e.target.value)}
                      placeholder="Notas"
                      className="w-full p-1.5 rounded border border-gray-300"
                    />
                  </td>
                  <td className="p-2.5 border-b border-gray-200 text-center">
                    <button
                      onClick={() => guardarPago(pago.usuario_id)}
                      className="bg-green-600 text-white px-3.5 py-1.5 rounded font-semibold hover:bg-green-700"
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagosFiltrados.length === 0 && (
        <p className="mt-5 text-gray-500">No hay jugadores para este filtro.</p>
      )}
    </div>
  );
}

export default AdminPagos;
