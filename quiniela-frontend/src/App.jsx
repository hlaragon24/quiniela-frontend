import { useEffect, useState, useCallback } from "react";
import Dashboard from "./Dashboard";
import Ranking from "./Ranking";
import TimerJornada from "./TimerJornada";
import RankingHistorial from "./RankingHistorial";
import MisResultados from "./MisResultados";
import HistoricoGeneral from "./HistoricoGeneral";
import TablaGeneral from "./TablaGeneral";
import PerfilJugador from "./PerfilJugador";
import HistoricoPronosticos from "./HistoricoPronosticos";
import { API, apiFetch } from "./config/api";
import TeamShield from "./components/TeamShield";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Card, CardContent } from "@/components/ui/card";

function App({ onLogout }) {
  const [torneos, setTorneos] = useState([]);
  const [torneoId, setTorneoId] = useState("");

  const [jornadaNumero, setJornadaNumero] = useState("");
  const [jornadaActual, setJornadaActual] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [pronosticosUsuario, setPronosticosUsuario] = useState({});
  const [marcadoresUsuario, setMarcadoresUsuario] = useState({});

  const [jornadaAbierta, setJornadaAbierta] = useState(false);
  const [refreshRanking, setRefreshRanking] = useState(false);

  const [partidosIncompletos, setPartidosIncompletos] = useState([]);
  const [listaJornadas, setListaJornadas] = useState([]);

  const [torneoTipo, setTorneoTipo]           = useState("temporada");
  const [miPagoTemporada, setMiPagoTemporada] = useState(null);   // {pagado} o null
  const [misPagosJornada, setMisPagosJornada] = useState({});     // { jornadaId: bool }

  const token = localStorage.getItem("token");

  const jornadaId = jornadaActual?.id ?? null;

  const handleCerrarJornada = useCallback(() => setJornadaAbierta(false), []);

  // ── Torneos ──────────────────────────────────────────────────────────
  const cargarTorneos = async () => {
    try {
      const res = await apiFetch(`${API}/torneos/mis-torneos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) return;

      setTorneos(data);

      if (data.length > 0) setTorneoId(data[0].id);
    } catch (error) {
      console.error("Error cargando torneos:", error);
    }
  };

  const cargarMiPago = async (tid, tipo) => {
    try {
      const res  = await apiFetch(`${API}/pagos/mi-pago?torneo_id=${tid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setMiPagoTemporada(null); setMisPagosJornada({}); return; }
      const data = await res.json();
      if (tipo === "jornada" && Array.isArray(data)) {
        const mapa = {};
        data.forEach((p) => { mapa[p.jornada_id] = Boolean(p.pagado); });
        setMisPagosJornada(mapa);
        setMiPagoTemporada(null);
      } else {
        setMiPagoTemporada(data);
        // Mapear pagos por jornada dentro de la temporada (si existen)
        const mapa = {};
        if (Array.isArray(data?.pagos_jornada)) {
          data.pagos_jornada.forEach((p) => { mapa[p.jornada_id] = Boolean(p.pagado); });
        }
        setMisPagosJornada(mapa);
      }
    } catch (e) {
      console.error("Error cargando mi pago:", e);
    }
  };

  // ── Jornadas ─────────────────────────────────────────────────────────
  const cargarJornadas = async (tid) => {
    if (!tid) return;

    try {
      const res = await fetch(`${API}/jornadas?torneo_id=${tid}`);
      const data = await res.json();

      if (!res.ok || !Array.isArray(data)) {
        setListaJornadas([]);
        return;
      }

      setListaJornadas(data);

      if (data.length > 0) setJornadaNumero(String(data[0].numero));
    } catch (error) {
      console.error("Error cargando jornadas:", error);
      setListaJornadas([]);
    }
  };

  const cargarJornadaActual = async () => {
    if (!jornadaNumero || !torneoId) return null;

    try {
      const res = await fetch(`${API}/jornadas/${jornadaNumero}?torneo_id=${torneoId}`);
      const data = await res.json();

      if (!res.ok || !data?.id) {
        setJornadaActual(null);
        setJornadaAbierta(false);
        return null;
      }

      setJornadaActual(data);

      const cierre = new Date(data.fecha_cierre);
      const abierta =
        data.estado === "abierta" &&
        !Number.isNaN(cierre.getTime()) &&
        new Date() < cierre;

      setJornadaAbierta(abierta);
      return data;
    } catch (error) {
      console.error("Error cargando jornada actual:", error);
      setJornadaActual(null);
      setJornadaAbierta(false);
      return null;
    }
  };

  const cargarPartidos = async (jornadaDbId) => {
    if (!jornadaDbId) {
      setPartidos([]);
      return;
    }

    try {
      const response = await fetch(`${API}/partidos/${jornadaDbId}`);
      const data = await response.json();

      if (!response.ok) {
        setPartidos([]);
        return;
      }

      setPartidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando partidos:", error);
      setPartidos([]);
    }
  };

  const cargarPronosticosUsuario = async (jornadaDbId) => {
    if (!token || !jornadaDbId) return;

    try {
      const response = await apiFetch(`${API}/pronosticos/usuario/${jornadaDbId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();

      if (!Array.isArray(data)) return;

      const mapaResultados = {};
      const mapaMarcadores = {};

      data.forEach((p) => {
        mapaResultados[p.partido_id] = p.pronostico_usuario;
        mapaMarcadores[p.partido_id] = {
          local: p.marcador_local,
          visitante: p.marcador_visitante,
        };
      });

      setPronosticosUsuario(mapaResultados);
      setMarcadoresUsuario(mapaMarcadores);
    } catch (error) {
      console.error("Error cargando pronósticos usuario:", error);
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────
  useEffect(() => {
    cargarTorneos();
  }, []);

  useEffect(() => {
    if (!torneoId) return;
    const torneo = torneos.find((t) => t.id == torneoId);
    const tipo   = torneo?.tipo ?? "temporada";
    setTorneoTipo(tipo);
    setJornadaNumero("");
    setListaJornadas([]);
    setMiPagoTemporada(null);
    setMisPagosJornada({});
    cargarJornadas(torneoId);
    cargarMiPago(torneoId, tipo);
  }, [torneoId]);

  useEffect(() => {
    if (!jornadaNumero) return;

    const cargarDatos = async () => {
      setMensaje("");
      setPartidos([]);
      setPartidosIncompletos([]);
      setPronosticosUsuario({});
      setMarcadoresUsuario({});

      const jornada = await cargarJornadaActual();
      if (!jornada?.id) return;

      await cargarPartidos(jornada.id);
      await cargarPronosticosUsuario(jornada.id);
    };

    cargarDatos();
  }, [jornadaNumero]);

  // ── Acciones pronósticos ──────────────────────────────────────────────
  const actualizarMarcador = (partidoId, campo, valor) => {
    setMarcadoresUsuario((prev) => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: valor === "" ? "" : Number(valor),
      },
    }));
  };

  const seleccionarResultado = (partidoId, resultado) => {
    setPronosticosUsuario((prev) => ({
      ...prev,
      [partidoId]: resultado,
    }));
  };

  const guardarJornadaCompleta = async () => {
    if (!jornadaAbierta) {
      setMensaje("🔒 La jornada ya está cerrada");
      return;
    }

    if (partidos.length === 0) {
      setMensaje("⚠ Esta jornada no tiene partidos configurados");
      return;
    }

    const incompletos = partidos.filter((partido) => {
      const resultado = pronosticosUsuario[partido.id];
      const local = marcadoresUsuario[partido.id]?.local;
      const visitante = marcadoresUsuario[partido.id]?.visitante;

      return (
        !resultado ||
        local === undefined || local === "" ||
        visitante === undefined || visitante === ""
      );
    });

    if (incompletos.length > 0) {
      setPartidosIncompletos(incompletos.map((p) => p.id));
      setMensaje(`⚠ Faltan ${incompletos.length} pronóstico(s)`);
      return;
    }

    setPartidosIncompletos([]);
    setMensaje("Guardando pronósticos...");

    const pronosticos = partidos.map((partido) => ({
      partido_id: partido.id,
      resultado: pronosticosUsuario[partido.id],
      marcador_local: Number(marcadoresUsuario[partido.id].local),
      marcador_visitante: Number(marcadoresUsuario[partido.id].visitante),
    }));

    try {
      const response = await apiFetch(`${API}/pronosticos/guardar-jornada`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pronosticos),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(`❌ ${data.mensaje || "Error guardando pronósticos"}`);
        if (response.status === 403) setJornadaAbierta(false);
        return;
      }

      setMensaje(`✅ ${data.mensaje}`);
      setRefreshRanking((prev) => !prev);
      if (jornadaId) await cargarPronosticosUsuario(jornadaId);
    } catch (error) {
      console.error("Error guardando jornada:", error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  if (torneos.length === 0 && torneoId === "") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
        <p className="text-5xl mb-4">⚽</p>
        <h2 className="text-2xl font-bold mb-2">Sin acceso a torneos</h2>
        <p className="text-gray-500 max-w-sm">
          No tienes ningún torneo asignado. Contacta al administrador para que te inscriba en un torneo.
        </p>
        <button
          onClick={onLogout}
          className="mt-6 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">
          Pronósticos Quiniela ⚽
        </h1>

        {jornadaNumero && (
          <TimerJornada
            key={jornadaNumero}
            jornada={jornadaNumero}
            onCerrarJornada={handleCerrarJornada}
          />
        )}

        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        {torneos.length > 1 && (
          <div>
            <label className="mr-2 font-semibold">Torneo:</label>
            <select
              value={torneoId}
              onChange={(e) => setTorneoId(Number(e.target.value))}
              className="border rounded px-2 py-1"
            >
              {torneos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="mr-2 font-semibold">Jornada:</label>
          <select
            value={jornadaNumero}
            onChange={(e) => setJornadaNumero(e.target.value)}
            className="border rounded px-2 py-1"
          >
            {listaJornadas.map((j) => {
              const bloqueada = misPagosJornada[j.id] === false;
              return (
                <option key={`jornada-${j.id}`} value={j.numero}>
                  {bloqueada ? "🔒 " : ""}Jornada {j.numero}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <Tabs defaultValue="inicio">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="inicio">🏠 Inicio</TabsTrigger>
          <TabsTrigger value="pronosticos">📊 Pronósticos</TabsTrigger>
          <TabsTrigger value="ranking">🏆 Ranking</TabsTrigger>
          <TabsTrigger value="historial">📈 Historial</TabsTrigger>
          <TabsTrigger value="misResultados">📋 Mis resultados</TabsTrigger>
          <TabsTrigger value="historico-general">📊 Histórico general</TabsTrigger>
          <TabsTrigger value="tabla-general">🏆 Tabla General</TabsTrigger>
          <TabsTrigger value="perfil">👤 Mi Perfil</TabsTrigger>
          <TabsTrigger value="historico-pronosticos">📚 Histórico pronósticos</TabsTrigger>
        </TabsList>

        <TabsContent value="inicio">
          <Dashboard
            jornadaActual={jornadaActual}
            jornadaAbierta={jornadaAbierta}
            partidos={partidos}
            pronosticosUsuario={pronosticosUsuario}
            torneoId={torneoId}
          />
        </TabsContent>

        <TabsContent value="pronosticos">
          {/* Banner pago pendiente — temporada */}
          {torneoTipo === "temporada" && miPagoTemporada?.pagado === false && (
            <div className="mt-4 mb-3 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-300">
              <p className="font-semibold text-yellow-700">💳 Pago pendiente</p>
              <p className="text-sm text-yellow-600 mt-1">
                Tu pago para este torneo no ha sido confirmado. Contacta al administrador para activar tu acceso.
              </p>
            </div>
          )}

          {/* Banner pago pendiente — jornada (aplica cualquier tipo de torneo) */}
          {jornadaId && misPagosJornada[jornadaId] === false && (
            <div className="mt-4 mb-3 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-300">
              <p className="font-semibold text-yellow-700">💳 Pago pendiente para esta jornada</p>
              <p className="text-sm text-yellow-600 mt-1">
                Tu pago para esta jornada no ha sido confirmado. Contacta al administrador.
              </p>
            </div>
          )}

          <div
            className={`
              mt-4 mb-3 px-4 py-2 rounded-lg font-semibold
              ${jornadaAbierta
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
              }
            `}
          >
            {jornadaAbierta
              ? "🟢 Jornada abierta — puedes editar tus pronósticos"
              : "🔒 Jornada cerrada — ya no es posible modificar pronósticos"}
          </div>

          {jornadaAbierta && (
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700"
              onClick={guardarJornadaCompleta}
            >
              Guardar pronósticos
            </button>
          )}

          <p className="mt-2">{mensaje}</p>

          {partidos.length === 0 && (
            <p className="mt-6 text-gray-500">
              No hay partidos configurados para esta jornada.
            </p>
          )}

          {partidos.map((partido) => {
            const incompleto = partidosIncompletos.includes(partido.id);

            return (
              <Card
                key={`partido-${partido.id}`}
                className={`mt-5 shadow-md border ${incompleto ? "border-red-500" : ""}`}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center gap-2">
                    <TeamShield
                      nombre={partido.local}
                      escudoUrl={partido.escudo_local}
                      color={partido.color_local}
                      size="lg"
                    />
                    <div className="text-gray-400 font-bold text-lg">VS</div>
                    <TeamShield
                      nombre={partido.visitante}
                      escudoUrl={partido.escudo_visitante}
                      color={partido.color_visitante}
                      size="lg"
                    />
                  </div>

                  {partido.es_comodin && (
                    <div className="mt-2 text-orange-500 font-medium">
                      ⭐ Partido comodín
                    </div>
                  )}

                  <div className="flex justify-center gap-4 mt-4">
                    <input
                      type="number"
                      min="0"
                      disabled={!jornadaAbierta}
                      value={marcadoresUsuario[partido.id]?.local ?? ""}
                      onChange={(e) => actualizarMarcador(partido.id, "local", e.target.value)}
                      className={`border rounded w-16 text-center text-lg ${!jornadaAbierta ? "bg-gray-200 cursor-not-allowed" : ""}`}
                    />

                    <span className="text-xl font-bold">-</span>

                    <input
                      type="number"
                      min="0"
                      disabled={!jornadaAbierta}
                      value={marcadoresUsuario[partido.id]?.visitante ?? ""}
                      onChange={(e) => actualizarMarcador(partido.id, "visitante", e.target.value)}
                      className={`border rounded w-16 text-center text-lg ${!jornadaAbierta ? "bg-gray-200 cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div className="flex justify-center gap-3 mt-5">
                    {["L", "E", "V"].map((opcion) => {
                      const seleccionado = pronosticosUsuario[partido.id] === opcion;

                      const colores = {
                        L: seleccionado ? "bg-blue-600 text-white" : "border-blue-400 text-blue-600",
                        E: seleccionado ? "bg-yellow-400 text-black" : "border-yellow-400 text-yellow-600",
                        V: seleccionado ? "bg-red-600 text-white" : "border-red-400 text-red-600",
                      };

                      return (
                        <button
                          key={`partido-${partido.id}-opcion-${opcion}`}
                          disabled={!jornadaAbierta}
                          onClick={() => seleccionarResultado(partido.id, opcion)}
                          className={`
                            px-5 py-2 rounded-lg border font-semibold transition-all hover:scale-105
                            ${colores[opcion]}
                            ${!jornadaAbierta ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        >
                          {opcion === "L" ? "Local" : opcion === "E" ? "Empate" : "Visitante"}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="ranking">
          <Ranking refresh={refreshRanking} jornada={jornadaId} />
        </TabsContent>

        <TabsContent value="historial">
          <RankingHistorial torneoId={torneoId} />
        </TabsContent>

        <TabsContent value="misResultados">
          <MisResultados torneoId={torneoId} />
        </TabsContent>

        <TabsContent value="historico-general">
          <HistoricoGeneral jornada={jornadaId} />
        </TabsContent>

        <TabsContent value="tabla-general">
          <TablaGeneral torneoId={torneoId} />
        </TabsContent>

        <TabsContent value="perfil">
          <PerfilJugador />
        </TabsContent>

        <TabsContent value="historico-pronosticos">
          <HistoricoPronosticos torneoId={torneoId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
