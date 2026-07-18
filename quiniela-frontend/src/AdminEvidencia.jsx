import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

const RES_BADGE = {
  L: "bg-blue-100 text-blue-800",
  E: "bg-amber-100 text-amber-800",
  V: "bg-red-100 text-red-800",
};

function fmtFecha(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function nombreCorto(nombre) {
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].substring(0, 13);
  return partes[0] + " " + partes[1][0] + ".";
}

function GridContent({ torneoNombre, jornadaNum, jornadaInfo, partidos, jugadores, pronMap, horaCaptura }) {
  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-900 text-white px-5 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/Escudo_losTercos.png"
            alt=""
            className="h-14 w-auto object-contain opacity-90"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-base leading-tight">{torneoNombre || "Quiniela"}</h1>
            <p className="text-blue-200 text-sm">
              Jornada {jornadaNum}
              {jornadaInfo?.fecha_cierre && ` · Cierre: ${fmtFecha(jornadaInfo.fecha_cierre)}`}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-blue-100 font-semibold">{fmtFecha(horaCaptura)}</p>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-2 text-center">
        <p className="text-indigo-700 font-bold text-sm tracking-wide">¡Suerte a todos! 🍀</p>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs w-full min-w-max">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="px-3 py-2.5 text-left font-semibold whitespace-nowrap sticky left-0 bg-gray-800 z-10 min-w-[160px]">
                Partido
              </th>
              {jugadores.map((j) => (
                <th
                  key={j}
                  title={j}
                  className="px-2 py-2.5 text-center font-semibold min-w-[72px] max-w-[90px]"
                >
                  <span className="block truncate">{nombreCorto(j)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partidos.map((p, idx) => {
              const bgRow = p.es_comodin
                ? "bg-amber-50"
                : idx % 2 === 0
                ? "bg-white"
                : "bg-gray-50";
              return (
                <tr key={p.id} className={bgRow}>
                  <td
                    className={`px-3 py-2 font-medium text-gray-800 whitespace-nowrap sticky left-0 z-10 border-r border-gray-200 ${bgRow}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {p.es_comodin && (
                        <span className="text-amber-500 flex-shrink-0">⭐</span>
                      )}
                      <span className="text-[11px]">
                        {p.local} vs {p.visitante}
                      </span>
                      {p.goles_local != null && (
                        <span className="text-gray-400 font-normal text-[10px] flex-shrink-0 ml-0.5">
                          [{p.goles_local}-{p.goles_visitante}]
                        </span>
                      )}
                    </div>
                  </td>
                  {jugadores.map((j) => {
                    const pron = pronMap[p.id]?.[j];
                    return (
                      <td
                        key={j}
                        className="px-1.5 py-1.5 text-center border-l border-gray-100 align-middle"
                      >
                        {pron ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded font-bold text-[11px] ${
                                RES_BADGE[pron.resultado] || "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {pron.resultado}
                            </span>
                            <span className="text-[11px] text-gray-600 font-semibold leading-none">
                              {pron.local}-{pron.visitante}
                            </span>
                            {pron.puntos != null && Number(pron.puntos) > 0 && (
                              <span className="text-[9px] font-bold leading-none text-green-600">
                                {pron.puntos}pt
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-200">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-gray-500 text-[10px] px-4 py-2 flex justify-between items-center">
        <span>
          {jugadores.length} jugador{jugadores.length !== 1 ? "es" : ""} ·{" "}
          {partidos.length} partido{partidos.length !== 1 ? "s" : ""}
        </span>
        <span>
          {torneoNombre || "Quiniela"} — Jornada {jornadaNum}
        </span>
      </div>
    </div>
  );
}

function jornadaActivaDeListado(jornadas) {
  if (!jornadas?.length) return null;
  // Prioridad 1: última jornada cerrada (mayor número)
  const cerradas = jornadas.filter((j) => j.estado === "cerrada");
  if (cerradas.length > 0)
    return cerradas.reduce((max, j) => Number(j.numero) > Number(max.numero) ? j : max);
  // Prioridad 2: jornada abierta
  const abierta = jornadas.find((j) => j.estado === "abierta");
  if (abierta) return abierta;
  // Fallback: primera de la lista
  return jornadas[0];
}

function AdminEvidencia({ torneoId }) {
  const [datos, setDatos] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [torneoNombre, setTorneoNombre] = useState("");
  const [jornadaNum, setJornadaNum] = useState("");
  const [cargando, setCargando] = useState(false);
  const [modoCaptura, setModoCaptura] = useState(false);
  const [horaCaptura, setHoraCaptura] = useState(new Date());

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API}/torneos`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          const t = d.find((x) => x.id === Number(torneoId));
          if (t) setTorneoNombre(t.nombre);
        }
      })
      .catch(console.error);
  }, [torneoId]);

  useEffect(() => {
    if (!torneoId) return;
    fetch(`${API}/jornadas?torneo_id=${torneoId}`)
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d) && d.length > 0) {
          setJornadas(d);
          setJornadaNum(jornadaActivaDeListado(d).numero);
        }
      })
      .catch(console.error);
  }, [torneoId]);

  useEffect(() => {
    if (!torneoId) return;
    setCargando(true);
    fetch(`${API}/pronosticos/historico-general?torneo_id=${torneoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setDatos(d);
      })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [torneoId]);

  const datosJornada = useMemo(
    () => datos.filter((d) => String(d.jornada_numero) === String(jornadaNum)),
    [datos, jornadaNum]
  );

  const partidos = useMemo(() => {
    const m = new Map();
    datosJornada.forEach((d) => {
      if (!m.has(d.partido_id)) {
        m.set(d.partido_id, {
          id: d.partido_id,
          local: d.local,
          visitante: d.visitante,
          es_comodin: d.es_comodin,
          goles_local: d.goles_local,
          goles_visitante: d.goles_visitante,
        });
      }
    });
    return [...m.values()].sort((a, b) => a.id - b.id);
  }, [datosJornada]);

  const jugadores = useMemo(
    () => [...new Set(datosJornada.map((d) => d.jugador))].sort(),
    [datosJornada]
  );

  const pronMap = useMemo(() => {
    const m = {};
    datosJornada.forEach((d) => {
      if (!m[d.partido_id]) m[d.partido_id] = {};
      m[d.partido_id][d.jugador] = {
        resultado: d.pronostico_resultado,
        local: d.pronostico_local,
        visitante: d.pronostico_visitante,
        puntos: d.puntos_calculados,
      };
    });
    return m;
  }, [datosJornada]);

  const jornadaInfo = jornadas.find((j) => String(j.numero) === String(jornadaNum));

  const gridProps = {
    torneoNombre,
    jornadaNum,
    jornadaInfo,
    partidos,
    jugadores,
    pronMap,
    horaCaptura,
  };

  const activarCaptura = () => {
    setHoraCaptura(new Date());
    setModoCaptura(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h2 className="text-xl font-bold">Evidencia de Pronósticos 📸</h2>

        <select
          value={jornadaNum}
          onChange={(e) => setJornadaNum(e.target.value)}
          className="px-3 py-1.5 rounded border border-gray-300 text-sm"
        >
          {jornadas.map((j) => (
            <option key={j.id} value={j.numero}>
              Jornada {j.numero}
            </option>
          ))}
        </select>

        <button
          onClick={activarCaptura}
          disabled={datosJornada.length === 0}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          📸 Abrir para captura
        </button>

        {jugadores.length > 0 && (
          <span className="text-xs text-gray-400 ml-auto">
            {jugadores.length} jugador{jugadores.length !== 1 ? "es" : ""} ·{" "}
            {partidos.length} partido{partidos.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {cargando ? (
        <p className="text-gray-400 text-sm py-6">Cargando pronósticos...</p>
      ) : datosJornada.length === 0 ? (
        <div className="text-center py-12 text-gray-400 border border-dashed border-gray-200 rounded-xl">
          <p className="text-3xl mb-2">📋</p>
          <p className="text-sm">
            No hay pronósticos registrados para la Jornada {jornadaNum}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <GridContent {...gridProps} />
        </div>
      )}

      {/* Modo captura: overlay de pantalla completa */}
      {modoCaptura && (
        <div className="fixed inset-0 bg-white z-[9999] overflow-auto">
          <div className="p-6 pt-16 max-w-[1600px] mx-auto">
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
              <GridContent {...gridProps} />
            </div>
            <p className="text-[11px] text-center text-gray-400 mt-3">
              Usa la herramienta de captura de tu dispositivo para tomar el
              screenshot &nbsp;·&nbsp; Windows: Win + Shift + S &nbsp;·&nbsp;
              Mac: Cmd + Shift + 4
            </p>
          </div>

          <button
            onClick={() => setModoCaptura(false)}
            className="fixed top-4 right-4 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-lg z-[10000]"
          >
            ✕ Salir
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminEvidencia;
