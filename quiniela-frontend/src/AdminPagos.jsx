import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

function AdminPagos({ torneoId }) {
  const [torneoInfo, setTorneoInfo]           = useState(null);
  const [jornadas, setJornadas]               = useState([]);
  const [jornadaId, setJornadaId]             = useState(null);
  const [pagos, setPagos]                     = useState([]);
  const [editando, setEditando]               = useState({});
  const [mensaje, setMensaje]                 = useState("");
  const [cargando, setCargando]               = useState(false);
  const [cargandoJornadas, setCargandoJornadas] = useState(false);
  const [filtro, setFiltro]                   = useState("todos");

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ─── 1. cargar datos del torneo ─── */
  useEffect(() => {
    if (!torneoId) return;
    setTorneoInfo(null);
    setJornadas([]);
    setJornadaId(null);
    setPagos([]);

    fetch(`${API}/torneos/${torneoId}`)
      .then((r) => r.json())
      .then((data) => setTorneoInfo(data))
      .catch(console.error);
  }, [torneoId]);

  /* ─── 2. si tipo='jornada', cargar jornadas del torneo ─── */
  useEffect(() => {
    if (!torneoInfo || torneoInfo.tipo !== "jornada") return;
    setCargandoJornadas(true);

    fetch(`${API}/jornadas?torneo_id=${torneoId}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = (Array.isArray(data) ? data : [])
          .filter((j) => j.torneo_id == torneoId)
          .sort((a, b) => a.numero - b.numero);
        setJornadas(lista);
        if (lista.length > 0) setJornadaId(lista[0].id);
      })
      .catch(console.error)
      .finally(() => setCargandoJornadas(false));
  }, [torneoInfo]);

  /* ─── 3. cargar pagos según tipo ─── */
  const cargarPagos = async () => {
    if (!torneoId || !torneoInfo) return;
    if (torneoInfo.tipo === "jornada" && !jornadaId) return;

    setCargando(true);
    setMensaje("");

    const url =
      torneoInfo.tipo === "jornada"
        ? `${API}/pagos?torneo_id=${torneoId}&jornada_id=${jornadaId}`
        : `${API}/pagos?torneo_id=${torneoId}`;

    try {
      const res  = await fetch(url, { headers });
      const data = await res.json();

      if (!res.ok) { setMensaje(data.mensaje || "Error cargando pagos"); return; }

      const lista = Array.isArray(data) ? data : [];
      setPagos(lista);

      const mapa = {};
      lista.forEach((p) => {
        mapa[p.usuario_id] = {
          monto:      p.monto      || 0,
          pagado:     Boolean(p.pagado),
          metodo_pago: p.metodo_pago || "",
          notas:      p.notas      || "",
        };
      });
      setEditando(mapa);
    } catch (err) {
      console.error(err);
      setMensaje("Error de conexión");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPagos(); }, [torneoInfo, jornadaId]);

  /* ─── helpers ─── */
  const actualizarCampo = (uid, campo, valor) =>
    setEditando((prev) => ({ ...prev, [uid]: { ...prev[uid], [campo]: valor } }));

  const guardarPago = async (usuarioId) => {
    const datos = editando[usuarioId];
    setMensaje("Guardando...");

    const body = {
      monto:       Number(datos.monto || 0),
      pagado:      Boolean(datos.pagado),
      metodo_pago: datos.metodo_pago || null,
      notas:       datos.notas       || null,
      torneo_id:   torneoId,
      ...(torneoInfo?.tipo === "jornada" && { jornada_id: jornadaId }),
    };

    try {
      const res  = await fetch(`${API}/pagos/${usuarioId}`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setMensaje(data.mensaje || "Error guardando pago"); return; }
      setMensaje(data.mensaje);
      await cargarPagos();
    } catch (err) {
      console.error(err);
      setMensaje("Error de conexión");
    }
  };

  /* ─── derivados ─── */
  const pagosFiltrados = useMemo(() => {
    if (filtro === "pagados")   return pagos.filter((p) =>  Boolean(editando[p.usuario_id]?.pagado));
    if (filtro === "pendientes") return pagos.filter((p) => !Boolean(editando[p.usuario_id]?.pagado));
    return pagos;
  }, [pagos, editando, filtro]);

  const resumen = useMemo(() => {
    const totalJugadores  = pagos.length;
    const pagados         = pagos.filter((p) => Boolean(editando[p.usuario_id]?.pagado)).length;
    const pendientes      = totalJugadores - pagados;
    const totalRecaudado  = pagos.reduce((acc, p) =>
      editando[p.usuario_id]?.pagado ? acc + Number(editando[p.usuario_id]?.monto || 0) : acc, 0);
    const totalEsperado   = pagos.reduce((acc, p) => acc + Number(editando[p.usuario_id]?.monto || 0), 0);
    const porcentaje      = totalJugadores === 0 ? 0 : Math.round((pagados / totalJugadores) * 100);
    return { totalJugadores, pagados, pendientes, totalRecaudado, totalEsperado, porcentaje };
  }, [pagos, editando]);

  const jornadaActual = jornadas.find((j) => j.id === jornadaId);

  /* ─── render ─── */
  if (!torneoInfo) return <p className="mt-4 text-gray-500">Cargando torneo...</p>;

  return (
    <div>
      {/* Encabezado con contexto */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2 className="text-xl font-bold">Control de Pagos 💵</h2>
        <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
          {torneoInfo.nombre}
        </span>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          torneoInfo.tipo === "jornada"
            ? "bg-orange-100 text-orange-700"
            : "bg-gray-100 text-gray-600"
        }`}>
          {torneoInfo.tipo === "jornada" ? "Por jornada" : "Por temporada"}
        </span>
      </div>

      {/* Nota de acceso */}
      <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-5 text-blue-700">
        ℹ️ Marcar a un jugador como <strong>Pagado ✅</strong> le otorga acceso para guardar pronósticos.
        Mientras esté <strong>Pendiente ❌</strong>, el sistema le bloqueará al intentar enviar.
      </div>

      {/* Selector de jornada (solo tipo='jornada') */}
      {torneoInfo.tipo === "jornada" && (
        <div className="mb-5">
          {cargandoJornadas ? (
            <p className="text-sm text-gray-500">Cargando jornadas...</p>
          ) : jornadas.length === 0 ? (
            <p className="text-sm text-gray-500">Sin jornadas en este torneo.</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-600 mb-2">Selecciona la jornada:</p>
              <div className="flex flex-wrap gap-2">
                {jornadas.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => { setJornadaId(j.id); setFiltro("todos"); }}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                      jornadaId === j.id
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    J{j.numero}
                    {j.estado === "finalizada" && " ✓"}
                  </button>
                ))}
              </div>
              {jornadaActual && (
                <p className="text-xs text-gray-400 mt-2">
                  Jornada {jornadaActual.numero} · estado: <strong>{jornadaActual.estado}</strong>
                  {jornadaActual.fecha_cierre && (
                    <> · cierre: {new Date(jornadaActual.fecha_cierre).toLocaleDateString()}</>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando pagos...</p>
      ) : (
        <>
          {/* Resumen cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Jugadores",   valor: resumen.totalJugadores, color: "" },
              { label: "Pagados",     valor: resumen.pagados,        color: "text-green-600" },
              { label: "Pendientes",  valor: resumen.pendientes,     color: "text-red-600" },
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
                  background:
                    resumen.porcentaje >= 80 ? "#16a34a"
                    : resumen.porcentaje >= 50 ? "#f59e0b"
                    : "#dc2626",
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
              { id: "todos",      label: "Todos" },
              { id: "pagados",    label: "✅ Pagados" },
              { id: "pendientes", label: "❌ Pendientes" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setFiltro(item.id)}
                className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
                  filtro === item.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-black hover:bg-gray-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {mensaje && (
            <div className="mb-4 px-4 py-2.5 border rounded-lg bg-gray-50 text-sm">{mensaje}</div>
          )}

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 border-b-2 border-gray-300">Jugador</th>
                  <th className="text-left p-3 border-b-2 border-gray-300">
                    {torneoInfo.tipo === "jornada" ? "Jornada" : "Torneo"}
                  </th>
                  <th className="text-center p-3 border-b-2 border-gray-300">Monto</th>
                  <th className="text-center p-3 border-b-2 border-gray-300">Estado</th>
                  <th className="text-center p-3 border-b-2 border-gray-300">Método</th>
                  <th className="text-left p-3 border-b-2 border-gray-300">Notas</th>
                  <th className="text-center p-3 border-b-2 border-gray-300">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500">
                      {torneoInfo.tipo === "jornada" && !jornadaId
                        ? "Selecciona una jornada para ver los pagos."
                        : "No hay jugadores para este filtro."}
                    </td>
                  </tr>
                ) : (
                  pagosFiltrados.map((pago) => {
                    const datos = editando[pago.usuario_id] || {};
                    return (
                      <tr
                        key={pago.usuario_id}
                        className={datos.pagado ? "bg-green-50" : "bg-red-50"}
                      >
                        <td className="p-2.5 border-b border-gray-200">
                          <strong>{pago.nombre}</strong>
                          <div className="text-xs text-gray-400">{pago.email}</div>
                        </td>
                        <td className="p-2.5 border-b border-gray-200 text-sm text-gray-600">
                          {torneoInfo.tipo === "jornada" ? (
                            <span className="font-medium">
                              J{jornadaActual?.numero ?? "—"}
                            </span>
                          ) : (
                            <span>{torneoInfo.nombre}</span>
                          )}
                        </td>
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPagos;
