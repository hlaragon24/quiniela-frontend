import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

function medalla(pos) {
  if (pos === 0) return "🥇";
  if (pos === 1) return "🥈";
  if (pos === 2) return "🥉";
  return `#${pos + 1}`;
}

function cellColor(pts, max) {
  if (!pts || pts === 0) return "bg-gray-100 text-gray-400";
  const pct = pts / Math.max(max, 1);
  if (pct >= 0.85) return "bg-green-500 text-white font-bold";
  if (pct >= 0.6)  return "bg-green-200 text-green-900";
  if (pct >= 0.3)  return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-700";
}

function jornadaActivaDeListado(jornadas) {
  const ahora = new Date();
  const abierta = jornadas.find(
    (j) => j.estado === "abierta" && j.fecha_cierre && new Date(j.fecha_cierre) > ahora
  );
  if (abierta) return abierta;
  return jornadas.reduce((mas, j) => {
    if (!j.fecha_cierre) return mas;
    const d = Math.abs(new Date(j.fecha_cierre) - ahora);
    const dMas = mas?.fecha_cierre ? Math.abs(new Date(mas.fecha_cierre) - ahora) : Infinity;
    return d < dMas ? j : mas;
  }, jornadas[0]);
}

function HistorialJornadas({ torneoId }) {
  const [datos, setDatos]       = useState([]);
  const [cargando, setCargando] = useState(false);
  const [vista, setVista]       = useState("jornada");
  const [jornadaSel, setJornadaSel] = useState(null);
  const [jornadaActivaNum, setJornadaActivaNum] = useState(null);

  const miId    = Number(localStorage.getItem("usuario_id"));
  const token   = localStorage.getItem("token");

  useEffect(() => {
    if (!torneoId) return;
    const cargar = async () => {
      setCargando(true);
      try {
        const res = await fetch(`${API}/ranking/historial?torneo_id=${torneoId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setDatos(data);
        } else {
          setDatos([]);
        }
      } catch (e) {
        console.error("Error cargando historial:", e);
      } finally {
        setCargando(false);
      }
    };
    setDatos([]);
    setJornadaSel(null);
    setJornadaActivaNum(null);
    cargar();

    // Fetch jornadas para saber cuál es la activa por fecha
    fetch(`${API}/jornadas?torneo_id=${torneoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setJornadaActivaNum(jornadaActivaDeListado(d).numero);
        }
      })
      .catch(console.error);
  }, [torneoId]);

  // jornadas ordenadas: más reciente primero (para selector), más antigua primero (para tabla)
  const jornadasDesc = useMemo(
    () => [...new Set(datos.map((d) => d.jornada_numero))].sort((a, b) => Number(b) - Number(a)),
    [datos]
  );
  const jornadasAsc = useMemo(() => [...jornadasDesc].reverse(), [jornadasDesc]);

  // Seleccionar la jornada activa al cargar (o la más cercana si no está en los datos)
  useEffect(() => {
    if (jornadasDesc.length === 0 || jornadaSel !== null) return;
    if (jornadaActivaNum !== null) {
      const num = Number(jornadaActivaNum);
      const enData = jornadasDesc.map(Number).includes(num);
      if (enData) {
        setJornadaSel(num);
      } else {
        // La más cercana al número activo que sí tenga datos
        const closest = jornadasDesc.reduce((c, j) =>
          Math.abs(Number(j) - num) < Math.abs(Number(c) - num) ? j : c
        );
        setJornadaSel(closest);
      }
    } else {
      setJornadaSel(jornadasDesc[0]);
    }
  }, [jornadasDesc, jornadaActivaNum]);

  // Ranking de la jornada seleccionada
  const rankingJornada = useMemo(() => {
    return datos
      .filter((d) => String(d.jornada_numero) === String(jornadaSel))
      .sort((a, b) =>
        Number(b.puntos) - Number(a.puntos) || a.nombre.localeCompare(b.nombre)
      );
  }, [datos, jornadaSel]);

  // Datos para vista acumulada
  const { usuarios, maxPorJornada } = useMemo(() => {
    const mapa = {};
    datos.forEach((d) => {
      if (!mapa[d.id]) mapa[d.id] = { id: d.id, nombre: d.nombre };
      mapa[d.id][d.jornada_numero] = Number(d.puntos);
    });

    const maxPorJornada = {};
    jornadasAsc.forEach((j) => {
      maxPorJornada[j] = Math.max(...Object.values(mapa).map((u) => u[j] || 0), 0);
    });

    const usuarios = Object.values(mapa)
      .map((u) => ({
        ...u,
        total: jornadasAsc.reduce((s, j) => s + (u[j] || 0), 0),
      }))
      .sort((a, b) => b.total - a.total);

    return { usuarios, maxPorJornada };
  }, [datos, jornadasAsc]);

  if (cargando) {
    return <div className="mt-6 text-gray-400 text-sm">Cargando historial...</div>;
  }

  if (!datos.length) {
    return <p className="mt-6 text-gray-500">No hay datos de historial disponibles.</p>;
  }

  return (
    <div className="mt-4 space-y-4">

      {/* ── Selector de vista ── */}
      <div className="flex gap-2">
        <button
          onClick={() => setVista("jornada")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            vista === "jornada"
              ? "bg-green-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ⚽ Por jornada
        </button>
        <button
          onClick={() => setVista("acumulado")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            vista === "acumulado"
              ? "bg-green-600 text-white shadow"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          📊 Acumulado
        </button>
      </div>

      {/* ════════════════════ VISTA POR JORNADA ════════════════════ */}
      {vista === "jornada" && (
        <div className="space-y-4">

          {/* Pills de jornada */}
          <div className="flex flex-wrap gap-2">
            {jornadasDesc.map((j) => (
              <button
                key={`pill-${j}`}
                onClick={() => setJornadaSel(j)}
                className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  String(jornadaSel) === String(j)
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                J{j}
              </button>
            ))}
          </div>

          {rankingJornada.length === 0 ? (
            <p className="text-gray-500 text-sm">Sin datos para esta jornada.</p>
          ) : (
            <div>
              <h3 className="text-lg font-bold mb-4 text-gray-800">
                Jornada {jornadaSel}
              </h3>

              {/* ── Pódium top 3 ── */}
              {rankingJornada.length >= 1 && (
                <div className="flex items-end justify-center gap-2 mb-6">
                  {/* 2do lugar (izquierda) */}
                  {rankingJornada[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[110px]">
                      <span className="text-2xl mb-1">🥈</span>
                      <div
                        className={`w-full flex flex-col items-center justify-end rounded-t-xl pt-3 pb-2 px-2 bg-gray-100 border border-gray-300 ${
                          rankingJornada[1].id === miId ? "ring-2 ring-green-400" : ""
                        }`}
                        style={{ height: 96 }}
                      >
                        <p className={`text-xs font-bold text-center leading-tight mb-1 ${rankingJornada[1].id === miId ? "text-green-700" : "text-gray-700"}`}>
                          {rankingJornada[1].nombre}
                          {rankingJornada[1].id === miId && <span className="block text-green-500">(tú)</span>}
                        </p>
                        <p className="text-base font-black text-gray-800">{rankingJornada[1].puntos} pts</p>
                      </div>
                    </div>
                  )}

                  {/* 1er lugar (centro, más alto) */}
                  <div className="flex flex-col items-center flex-1 max-w-[130px]">
                    <span className="text-3xl mb-1">🥇</span>
                    <div
                      className={`w-full flex flex-col items-center justify-end rounded-t-xl pt-3 pb-2 px-2 bg-yellow-100 border border-yellow-300 ${
                        rankingJornada[0].id === miId ? "ring-2 ring-green-400" : ""
                      }`}
                      style={{ height: 128 }}
                    >
                      <p className={`text-xs font-bold text-center leading-tight mb-1 ${rankingJornada[0].id === miId ? "text-green-700" : "text-yellow-800"}`}>
                        {rankingJornada[0].nombre}
                        {rankingJornada[0].id === miId && <span className="block text-green-500">(tú)</span>}
                      </p>
                      <p className="text-lg font-black text-yellow-800">{rankingJornada[0].puntos} pts</p>
                    </div>
                  </div>

                  {/* 3er lugar (derecha) */}
                  {rankingJornada[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[110px]">
                      <span className="text-2xl mb-1">🥉</span>
                      <div
                        className={`w-full flex flex-col items-center justify-end rounded-t-xl pt-3 pb-2 px-2 bg-orange-100 border border-orange-300 ${
                          rankingJornada[2].id === miId ? "ring-2 ring-green-400" : ""
                        }`}
                        style={{ height: 80 }}
                      >
                        <p className={`text-xs font-bold text-center leading-tight mb-1 ${rankingJornada[2].id === miId ? "text-green-700" : "text-orange-800"}`}>
                          {rankingJornada[2].nombre}
                          {rankingJornada[2].id === miId && <span className="block text-green-500">(tú)</span>}
                        </p>
                        <p className="text-sm font-black text-orange-800">{rankingJornada[2].puntos} pts</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Resto del ranking ── */}
              {rankingJornada.length > 3 && (
                <div className="space-y-1.5">
                  {rankingJornada.slice(3).map((jugador, i) => (
                    <div
                      key={`rank-${jugador.id}-${i}`}
                      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${
                        jugador.id === miId
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-400 w-6 font-mono">#{i + 4}</span>
                        <span className={`font-medium text-sm ${jugador.id === miId ? "text-green-700" : "text-gray-800"}`}>
                          {jugador.nombre}
                          {jugador.id === miId && (
                            <span className="ml-1.5 text-xs text-green-500">(tú)</span>
                          )}
                        </span>
                      </div>
                      <span className={`font-bold text-sm ${jugador.id === miId ? "text-green-700" : "text-gray-700"}`}>
                        {jugador.puntos} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════ VISTA ACUMULADA ════════════════════ */}
      {vista === "acumulado" && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600">
                <th className="border-b border-r border-gray-200 p-3 text-left sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                  Jugador
                </th>
                {jornadasAsc.map((j) => (
                  <th
                    key={`head-${j}`}
                    className="border-b border-r border-gray-200 p-2 text-center min-w-[50px]"
                  >
                    J{j}
                  </th>
                ))}
                <th className="border-b border-gray-200 p-2 text-center min-w-[60px] bg-blue-50 text-blue-700 font-bold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, idx) => (
                <tr
                  key={`acum-${u.id || u.nombre}`}
                  className={u.id === miId ? "ring-2 ring-inset ring-green-400" : ""}
                >
                  <td
                    className={`border-b border-r border-gray-200 p-3 font-semibold sticky left-0 z-10 ${
                      u.id === miId ? "bg-green-50 text-green-800" : idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <span className="mr-1.5 text-gray-400 font-mono text-xs">#{idx + 1}</span>
                    {u.nombre}
                    {u.id === miId && (
                      <span className="ml-1 text-xs text-green-600 font-bold">(tú)</span>
                    )}
                  </td>
                  {jornadasAsc.map((j) => (
                    <td
                      key={`cell-${u.id || u.nombre}-${j}`}
                      className={`border-b border-r border-gray-200 p-2 text-center text-xs ${cellColor(u[j], maxPorJornada[j])}`}
                    >
                      {u[j] ?? 0}
                    </td>
                  ))}
                  <td className="border-b border-gray-200 p-2 text-center font-bold text-blue-700 bg-blue-50">
                    {u.total}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Leyenda de colores */}
          <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100 text-xs text-gray-500 flex-wrap">
            <span className="font-semibold">Puntos vs mejor de la jornada:</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" /> ≥ 85%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> ≥ 60%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 inline-block border" /> ≥ 30%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 inline-block border" /> &lt; 30%</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-100 inline-block border" /> 0 pts</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialJornadas;
