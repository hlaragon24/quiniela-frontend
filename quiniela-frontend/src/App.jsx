import { useState, useEffect } from "react";
import Ranking from "./Ranking";
import TimerJornada from "./TimerJornada";
import RankingHistorial from "./RankingHistorial";
import MisResultados from "./MisResultados";
import HistoricoGeneral from "./HistoricoGeneral";
import AdminJornadas from "./AdminJornadas";
import { API } from "./config/api";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Card,
  CardContent
} from "@/components/ui/card";

function App({ onLogout }) {
  const [jornada, setJornada] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const [pronosticosUsuario, setPronosticosUsuario] = useState({});
  const [marcadoresUsuario, setMarcadoresUsuario] = useState({});

  const [jornadaAbierta, setJornadaAbierta] = useState(true);
  const [refreshRanking, setRefreshRanking] = useState(false);

  const [partidosIncompletos, setPartidosIncompletos] = useState([]);
  const [listaJornadas, setListaJornadas] = useState([]);

  const token = localStorage.getItem("token");
  const rol = localStorage.getItem("rol");


  /*
  ===============================
  CARGAR JORNADAS
  ===============================
  */
  const cargarJornadas = async () => {
    try {
      const res = await fetch(`${API}/jornadas`);
      const data = await res.json();

      if (Array.isArray(data)) {
        setListaJornadas(data);

        if (!jornada && data.length > 0) {
          setJornada(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error cargando jornadas:", error);
    }
  };

  /*
  ===============================
  CARGAR PARTIDOS
  ===============================
  */
  const cargarPartidos = async () => {
    if (!jornada) return;

    try {
      const response = await fetch(`${API}/partidos/${jornada}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Error cargando partidos:", data);
        setPartidos([]);
        return;
      }

      setPartidos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando partidos:", error);
    }
  };

  /*
  ===============================
  CARGAR PRONÓSTICOS USUARIO
  ===============================
  */
  const cargarPronosticosUsuario = async () => {
    if (!jornada) return;

    try {
      if (!token) {
        console.warn("Token no disponible");
        return;
      }

      const response = await fetch(`${API}/pronosticos/usuario`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.error("Error cargando pronósticos:", response.status);
        return;
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        console.warn("Respuesta inesperada:", data);
        return;
      }

      const mapaResultados = {};
      const mapaMarcadores = {};

      data
        .filter(p => Number(p.jornada_id) === Number(jornada))
        .forEach(p => {
          mapaResultados[p.partido_id] = p.pronostico_usuario;

          mapaMarcadores[p.partido_id] = {
            local: p.marcador_local,
            visitante: p.marcador_visitante
          };
        });

      setPronosticosUsuario(mapaResultados);
      setMarcadoresUsuario(mapaMarcadores);
    } catch (error) {
      console.error("Error cargando pronósticos usuario:", error);
    }
  };

  /*
  ===============================
  VERIFICAR ESTADO JORNADA
  ===============================
  */
  const verificarEstadoJornada = async () => {
    if (!jornada) return;

    try {
      const response = await fetch(`${API}/jornadas/${jornada}`);
      const data = await response.json();

      if (!response.ok || !data?.fecha_cierre) {
        console.warn("Jornada no encontrada o sin fecha_cierre:", data);
        setJornadaAbierta(false);
        return;
      }

      const ahora = new Date();
      const cierre = new Date(data.fecha_cierre);

      const abiertaPorFecha = ahora < cierre;
      const abiertaPorEstado = data.estado === "abierta";

      setJornadaAbierta(abiertaPorFecha && abiertaPorEstado);
    } catch (error) {
      console.error("Error verificando jornada:", error);
      setJornadaAbierta(false);
    }
  };

  useEffect(() => {
    cargarJornadas();
  }, []);

  useEffect(() => {

    if (!jornada) return;

    const cargarDatos = async () => {

      setMensaje("");
      setPartidosIncompletos([]);

      await cargarPartidos();
      await cargarPronosticosUsuario();
      await verificarEstadoJornada();

    };

    cargarDatos();

  }, [jornada]);

  /*
  ===============================
  ACTUALIZAR MARCADOR
  ===============================
  */
  const actualizarMarcador = (partidoId, campo, valor) => {
    setMarcadoresUsuario(prev => ({
      ...prev,
      [partidoId]: {
        ...prev[partidoId],
        [campo]: valor === "" ? "" : Number(valor)
      }
    }));
  };

  /*
  ===============================
  SELECCIONAR RESULTADO
  ===============================
  */
  const seleccionarResultado = (partidoId, resultado) => {
    setPronosticosUsuario(prev => ({
      ...prev,
      [partidoId]: resultado
    }));
  };

  /*
  ===============================
  GUARDAR JORNADA
  ===============================
  */
  const guardarJornadaCompleta = async () => {
    if (!jornadaAbierta) {
      setMensaje("🔒 La jornada ya está cerrada");
      return;
    }

    const incompletos = partidos.filter(partido => {
      const resultado = pronosticosUsuario[partido.id];
      const marcadorLocal = marcadoresUsuario[partido.id]?.local;
      const marcadorVisitante = marcadoresUsuario[partido.id]?.visitante;

      return (
        !resultado ||
        marcadorLocal === undefined ||
        marcadorVisitante === undefined ||
        marcadorLocal === "" ||
        marcadorVisitante === ""
      );
    });

    if (incompletos.length > 0) {
      setPartidosIncompletos(incompletos.map(p => p.id));
      setMensaje(`⚠ Faltan ${incompletos.length} pronóstico(s)`);
      return;
    }

    setPartidosIncompletos([]);
    setMensaje("Guardando pronósticos...");

    const pronosticos = partidos.map(partido => ({
      partido_id: partido.id,
      resultado: pronosticosUsuario[partido.id],
      marcador_local: Number(marcadoresUsuario[partido.id].local),
      marcador_visitante: Number(marcadoresUsuario[partido.id].visitante)
    }));

    try {
      const response = await fetch(`${API}/pronosticos/guardar-jornada`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pronosticos)
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(`❌ ${data.mensaje || "Error guardando pronósticos"}`);

        if (response.status === 403) {
          setJornadaAbierta(false);
        }

        return;
      }

      setMensaje(`✅ ${data.mensaje}`);
      setRefreshRanking(prev => !prev);

      await cargarPronosticosUsuario();
      await verificarEstadoJornada();
    } catch (error) {
      console.error("Error guardando jornada:", error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  /*
  ===============================
  UI
  ===============================
  */
  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Pronósticos Quiniela ⚽
        </h1>

        {jornada && (
          <TimerJornada
            key={jornada}
            jornada={jornada}
            onCerrarJornada={() => setJornadaAbierta(false)}
          />
        )}

        <button
          onClick={onLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mb-6">
        <label className="mr-2 font-semibold">
          Seleccionar jornada:
        </label>

        <select
          value={jornada || ""}
          onChange={(e) => setJornada(Number(e.target.value))}
          className="border rounded px-2 py-1"
        >
          {listaJornadas.map(j => (
            <option key={j.id} value={j.id}>
              Jornada {j.numero}
            </option>
          ))}
        </select>
      </div>

      <Tabs defaultValue="pronosticos">
        <TabsList>
          <TabsTrigger value="pronosticos">
            📊 Pronósticos
          </TabsTrigger>

          <TabsTrigger value="ranking">
            🏆 Ranking
          </TabsTrigger>

          <TabsTrigger value="historial">
            📈 Historial
          </TabsTrigger>

          <TabsTrigger value="misResultados">
            📋 Mis resultados
          </TabsTrigger>

          <TabsTrigger value="historico-general">
            📊 Histórico general
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pronosticos">
          <div
            className={`
              mt-4 mb-3 px-4 py-2 rounded-lg font-semibold
              ${jornadaAbierta
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"}
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

          {partidos.map(partido => {
            const incompleto = partidosIncompletos.includes(partido.id);

            return (
              <Card
                key={partido.id}
                className={`
                  mt-5 shadow-md border
                  ${incompleto ? "border-red-500" : ""}
                `}
              >
                <CardContent className="p-5">
                  <div className="flex justify-between items-center">
                    <div className="text-lg font-semibold">
                      {partido.local}
                    </div>

                    <div className="text-gray-400">
                      VS
                    </div>

                    <div className="text-lg font-semibold">
                      {partido.visitante}
                    </div>
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
                      onChange={(e) =>
                        actualizarMarcador(
                          partido.id,
                          "local",
                          e.target.value
                        )
                      }
                      className={`
                        border rounded w-16 text-center text-lg
                        ${!jornadaAbierta ? "bg-gray-200 cursor-not-allowed" : ""}
                      `}
                    />

                    <span className="text-xl font-bold">-</span>

                    <input
                      type="number"
                      min="0"
                      disabled={!jornadaAbierta}
                      value={marcadoresUsuario[partido.id]?.visitante ?? ""}
                      onChange={(e) =>
                        actualizarMarcador(
                          partido.id,
                          "visitante",
                          e.target.value
                        )
                      }
                      className={`
                        border rounded w-16 text-center text-lg
                        ${!jornadaAbierta ? "bg-gray-200 cursor-not-allowed" : ""}
                      `}
                    />
                  </div>

                  <div className="flex justify-center gap-3 mt-5">
                    {["L", "E", "V"].map(opcion => {
                      const seleccionado =
                        pronosticosUsuario[partido.id] === opcion;

                      const colores = {
                        L: seleccionado
                          ? "bg-blue-600 text-white"
                          : "border-blue-400 text-blue-600",

                        E: seleccionado
                          ? "bg-yellow-400 text-black"
                          : "border-yellow-400 text-yellow-600",

                        V: seleccionado
                          ? "bg-red-600 text-white"
                          : "border-red-400 text-red-600"
                      };

                      return (
                        <button
                          key={opcion}
                          disabled={!jornadaAbierta}
                          onClick={() =>
                            seleccionarResultado(partido.id, opcion)
                          }
                          className={`
                            px-5 py-2 rounded-lg border
                            font-semibold transition-all
                            hover:scale-105
                            ${colores[opcion]}
                            ${!jornadaAbierta ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        >
                          {opcion === "L"
                            ? "Local"
                            : opcion === "E"
                              ? "Empate"
                              : "Visitante"}
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
          <Ranking refresh={refreshRanking} jornada={jornada} />
        </TabsContent>

        <TabsContent value="historial">
          <RankingHistorial />
        </TabsContent>

        <TabsContent value="misResultados">
          <MisResultados />
        </TabsContent>

        <TabsContent value="historico-general">
          <HistoricoGeneral jornada={jornada} />
          {rol === "admin" && <AdminJornadas />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;