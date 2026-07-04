import { useState, useRef } from "react";
import { API } from "./config/api";
import { exportarCSV } from "./utils/exportCsv";

/* ─── CSV parser ────────────────────────────────────────────────────── */
function parsearCSV(texto) {
  const lineas = texto.trim().split(/\r?\n/);
  if (lineas.length < 2) return { headers: [], rows: [] };

  const headers = lineas[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  const rows = lineas.slice(1).filter((l) => l.trim()).map((linea) => {
    const valores = [];
    let dentro = false;
    let actual = "";
    for (let i = 0; i < linea.length; i++) {
      const c = linea[i];
      if (c === '"') { dentro = !dentro; }
      else if (c === "," && !dentro) { valores.push(actual.trim()); actual = ""; }
      else { actual += c; }
    }
    valores.push(actual.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (valores[i] ?? "").replace(/^"|"$/g, ""); });
    return obj;
  });

  return { headers, rows };
}

/* ─── Plantillas ────────────────────────────────────────────────────── */
const PLANTILLAS = {
  equipos: {
    label: "Equipos / Escudos",
    columnas: ["nombre", "abreviacion", "escudo_url", "color"],
    ejemplo: [
      { nombre: "Chivas", abreviacion: "CHI", escudo_url: "https://ejemplo.com/chivas.png", color: "#CC0000" },
      { nombre: "América", abreviacion: "AME", escudo_url: "https://ejemplo.com/america.png", color: "#FFCC00" },
    ],
    campos: [
      { key: "nombre",      label: "Nombre",        req: true  },
      { key: "abreviacion", label: "Abreviación",    req: false },
      { key: "escudo_url",  label: "URL del escudo", req: false },
      { key: "color",       label: "Color (#hex)",   req: false },
    ],
  },
  torneos: {
    label: "Torneos",
    columnas: ["nombre", "temporada", "fecha_inicio", "fecha_fin", "tipo"],
    ejemplo: [
      { nombre: "Liga MX Apertura", temporada: "2025", fecha_inicio: "2025-07-01", fecha_fin: "2025-12-15", tipo: "temporada" },
    ],
    campos: [
      { key: "nombre",       label: "Nombre",             req: true  },
      { key: "temporada",    label: "Temporada",           req: false },
      { key: "fecha_inicio", label: "Fecha inicio (YYYY-MM-DD)", req: false },
      { key: "fecha_fin",    label: "Fecha fin (YYYY-MM-DD)",    req: false },
      { key: "tipo",         label: "Tipo (temporada/jornada)",  req: false },
    ],
  },
  jornadas: {
    label: "Jornadas",
    columnas: ["torneo_id", "numero", "fecha_inicio", "fecha_cierre"],
    ejemplo: [
      { torneo_id: "1", numero: "1", fecha_inicio: "2025-07-10T20:00", fecha_cierre: "2025-07-11T18:00" },
      { torneo_id: "1", numero: "2", fecha_inicio: "2025-07-17T20:00", fecha_cierre: "2025-07-18T18:00" },
    ],
    campos: [
      { key: "torneo_id",    label: "ID del torneo",               req: true },
      { key: "numero",       label: "Número de jornada",           req: true },
      { key: "fecha_inicio", label: "Fecha inicio (YYYY-MM-DDTHH:MM)", req: true },
      { key: "fecha_cierre", label: "Fecha cierre (YYYY-MM-DDTHH:MM)", req: true },
    ],
  },
  partidos: {
    label: "Partidos",
    columnas: ["torneo_id", "jornada_numero", "local", "visitante", "es_comodin"],
    ejemplo: [
      { torneo_id: "1", jornada_numero: "1", local: "Chivas", visitante: "América", es_comodin: "false" },
      { torneo_id: "1", jornada_numero: "1", local: "Cruz Azul", visitante: "Pumas", es_comodin: "true" },
    ],
    campos: [
      { key: "torneo_id",      label: "ID del torneo",    req: true  },
      { key: "jornada_numero", label: "Número jornada",   req: true  },
      { key: "local",          label: "Equipo local",     req: true  },
      { key: "visitante",      label: "Equipo visitante", req: true  },
      { key: "es_comodin",     label: "Comodín (true/false)", req: false },
    ],
  },
  usuarios: {
    label: "Usuarios",
    columnas: ["nombre", "email", "password", "rol"],
    ejemplo: [
      { nombre: "Juan Pérez",  email: "juan@correo.com",  password: "Pass123!", rol: "jugador" },
      { nombre: "Ana García",  email: "ana@correo.com",   password: "Pass456!", rol: "jugador" },
    ],
    campos: [
      { key: "nombre",   label: "Nombre",              req: true },
      { key: "email",    label: "Email",               req: true },
      { key: "password", label: "Contraseña (min 6)",  req: true },
      { key: "rol",      label: "Rol (jugador/admin)", req: false },
    ],
  },
};

/* ─── Importador por entidad ────────────────────────────────────────── */
function PanelImportar({ tipo, token }) {
  const cfg = PLANTILLAS[tipo];
  const fileRef = useRef(null);

  const [filas, setFilas]         = useState([]);
  const [resultados, setResultados] = useState([]); // { estado: 'ok'|'error'|'pendiente', msg }
  const [importando, setImportando] = useState(false);
  const [errorParseo, setErrorParseo] = useState("");

  /* Caché de jornadas por torneo (para partidos) */
  const jornadaCache = useRef({});

  const resolverJornadaId = async (torneoId, numero) => {
    const clave = `${torneoId}-${numero}`;
    if (jornadaCache.current[clave]) return jornadaCache.current[clave];

    if (!jornadaCache.current[`loaded-${torneoId}`]) {
      const res = await fetch(`${API}/jornadas?torneo_id=${torneoId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((j) => {
          jornadaCache.current[`${torneoId}-${j.numero}`] = j.id;
        });
        jornadaCache.current[`loaded-${torneoId}`] = true;
      }
    }
    return jornadaCache.current[clave] ?? null;
  };

  const descargarPlantilla = () => {
    exportarCSV(cfg.ejemplo, cfg.campos.map((c) => ({ key: c.key, label: c.key })), `plantilla_${tipo}`);
  };

  const leerArchivo = (e) => {
    setResultados([]);
    setErrorParseo("");
    const archivo = e.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const { rows } = parsearCSV(ev.target.result);
      if (rows.length === 0) {
        setErrorParseo("El archivo no contiene filas o el formato es incorrecto.");
        setFilas([]);
        return;
      }
      setFilas(rows);
    };
    reader.readAsText(archivo, "UTF-8");
  };

  const importarFila = async (fila, idx) => {
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    try {
      if (tipo === "equipos") {
        if (!fila.nombre?.trim()) throw new Error("nombre requerido");
        const res = await fetch(`${API}/equipos`, {
          method: "POST", headers,
          body: JSON.stringify({
            nombre: fila.nombre.trim(),
            abreviacion: fila.abreviacion?.trim() || null,
            escudo_url: fila.escudo_url?.trim() || null,
            color: fila.color?.trim() || "#6B7280",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error");
        return { estado: "ok", msg: data.mensaje || "Creado" };
      }

      if (tipo === "torneos") {
        if (!fila.nombre?.trim()) throw new Error("nombre requerido");
        const res = await fetch(`${API}/torneos`, {
          method: "POST", headers,
          body: JSON.stringify({
            nombre: fila.nombre.trim(),
            temporada: fila.temporada?.trim() || null,
            fecha_inicio: fila.fecha_inicio?.trim() || null,
            fecha_fin: fila.fecha_fin?.trim() || null,
            tipo: fila.tipo?.trim() || "temporada",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error");
        return { estado: "ok", msg: data.mensaje || "Creado" };
      }

      if (tipo === "jornadas") {
        if (!fila.torneo_id || !fila.numero || !fila.fecha_inicio || !fila.fecha_cierre)
          throw new Error("torneo_id, numero, fecha_inicio y fecha_cierre son requeridos");
        const res = await fetch(`${API}/jornadas`, {
          method: "POST", headers,
          body: JSON.stringify({
            torneo_id: Number(fila.torneo_id),
            numero: Number(fila.numero),
            fecha_inicio: fila.fecha_inicio.trim(),
            fecha_cierre: fila.fecha_cierre.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error");
        return { estado: "ok", msg: data.mensaje || "Creada" };
      }

      if (tipo === "partidos") {
        if (!fila.torneo_id || !fila.jornada_numero || !fila.local || !fila.visitante)
          throw new Error("torneo_id, jornada_numero, local y visitante son requeridos");

        const jornadaId = await resolverJornadaId(fila.torneo_id, fila.jornada_numero);
        if (!jornadaId)
          throw new Error(`No se encontró jornada ${fila.jornada_numero} en torneo ${fila.torneo_id}`);

        const res = await fetch(`${API}/partidos`, {
          method: "POST", headers,
          body: JSON.stringify({
            local: fila.local.trim(),
            visitante: fila.visitante.trim(),
            jornada_id: jornadaId,
            es_comodin: fila.es_comodin?.toLowerCase() === "true",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error");
        return { estado: "ok", msg: data.mensaje || "Creado" };
      }

      if (tipo === "usuarios") {
        if (!fila.nombre?.trim() || !fila.email?.trim() || !fila.password?.trim())
          throw new Error("nombre, email y password son requeridos");
        if (fila.password.length < 6) throw new Error("contraseña mínimo 6 caracteres");
        const res = await fetch(`${API}/usuarios`, {
          method: "POST", headers,
          body: JSON.stringify({
            nombre: fila.nombre.trim(),
            email: fila.email.trim().toLowerCase(),
            password: fila.password,
            rol: fila.rol?.trim() || "jugador",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.mensaje || "Error");
        return { estado: "ok", msg: data.mensaje || "Creado" };
      }
    } catch (err) {
      return { estado: "error", msg: err.message };
    }
  };

  const importar = async () => {
    if (filas.length === 0) return;
    setImportando(true);
    jornadaCache.current = {};

    const init = filas.map(() => ({ estado: "pendiente", msg: "Esperando..." }));
    setResultados(init);

    const nuevos = [...init];
    for (let i = 0; i < filas.length; i++) {
      nuevos[i] = await importarFila(filas[i], i);
      setResultados([...nuevos]);
    }
    setImportando(false);
  };

  const limpiar = () => {
    setFilas([]);
    setResultados([]);
    setErrorParseo("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const okCount    = resultados.filter((r) => r.estado === "ok").length;
  const errorCount = resultados.filter((r) => r.estado === "error").length;

  return (
    <div className="space-y-5">

      {/* Instrucciones y plantilla */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-semibold mb-2">Columnas esperadas:</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {cfg.campos.map((c) => (
            <span key={c.key} className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${c.req ? "bg-blue-200 text-blue-900" : "bg-blue-100 text-blue-700"}`}>
              {c.key}{c.req ? " *" : ""}
            </span>
          ))}
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-blue-700">
          {cfg.campos.map((c) => (
            <li key={c.key}><strong>{c.key}</strong>: {c.label}{c.req ? " (obligatorio)" : " (opcional)"}</li>
          ))}
        </ul>
        <button
          onClick={descargarPlantilla}
          className="mt-3 inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-blue-700"
        >
          ⬇ Descargar plantilla CSV
        </button>
      </div>

      {/* Selector de archivo */}
      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={leerArchivo}
          className="text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 file:font-semibold hover:file:bg-gray-200 cursor-pointer"
        />
        {filas.length > 0 && (
          <button onClick={limpiar} className="text-gray-400 hover:text-gray-700 text-lg leading-none" title="Limpiar">✕</button>
        )}
      </div>

      {errorParseo && (
        <p className="text-red-600 text-sm">{errorParseo}</p>
      )}

      {/* Vista previa */}
      {filas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">{filas.length} fila(s) detectadas</p>
            {resultados.length === 0 && (
              <button
                onClick={importar}
                disabled={importando}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {importando ? "Importando..." : `Importar ${filas.length} registros`}
              </button>
            )}
            {resultados.length > 0 && !importando && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-green-700 font-semibold">{okCount} ✅</span>
                {errorCount > 0 && <span className="text-sm text-red-600 font-semibold">{errorCount} ❌</span>}
                <button onClick={limpiar} className="border px-3 py-1.5 rounded text-sm hover:bg-gray-50">
                  Nueva importación
                </button>
              </div>
            )}
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left text-gray-500 w-8">#</th>
                  {cfg.columnas.map((col) => (
                    <th key={col} className="p-2 text-left font-semibold">{col}</th>
                  ))}
                  {resultados.length > 0 && <th className="p-2 text-left">Resultado</th>}
                </tr>
              </thead>
              <tbody>
                {filas.map((fila, i) => {
                  const r = resultados[i];
                  return (
                    <tr
                      key={i}
                      className={`border-t border-gray-100 ${
                        r?.estado === "ok"    ? "bg-green-50" :
                        r?.estado === "error" ? "bg-red-50"   : ""
                      }`}
                    >
                      <td className="p-2 text-gray-400">{i + 1}</td>
                      {cfg.columnas.map((col) => (
                        <td key={col} className="p-2 truncate max-w-[150px]" title={fila[col]}>
                          {fila[col] || <span className="text-gray-300">—</span>}
                        </td>
                      ))}
                      {r && (
                        <td className={`p-2 font-semibold ${r.estado === "ok" ? "text-green-700" : r.estado === "error" ? "text-red-600" : "text-gray-400"}`}>
                          {r.estado === "ok" ? "✅ " : r.estado === "error" ? "❌ " : "⏳ "}
                          {r.msg}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal ──────────────────────────────────────────── */
const TABS = [
  { id: "equipos",  label: "Equipos 🛡️" },
  { id: "torneos",  label: "Torneos 🏆" },
  { id: "jornadas", label: "Jornadas 📅" },
  { id: "partidos", label: "Partidos ⚽" },
  { id: "usuarios", label: "Usuarios 👥" },
];

export default function AdminImportar() {
  const [tab, setTab] = useState("equipos");
  const token = localStorage.getItem("token");

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Importar desde CSV</h2>
      <p className="text-sm text-gray-500 mb-5">
        Selecciona el tipo de datos, descarga la plantilla, llénala y sube el archivo.
        Los registros se crean uno por uno — puedes ver el resultado de cada fila.
      </p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <PanelImportar key={tab} tipo={tab} token={token} />
    </div>
  );
}
