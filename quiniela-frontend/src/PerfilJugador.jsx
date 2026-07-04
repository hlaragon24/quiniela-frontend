import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

function PerfilJugador({ torneoId }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtrarTorneo, setFiltrarTorneo] = useState(true);

  const [pwActual, setPwActual] = useState("");
  const [pwNuevo, setPwNuevo] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwMensaje, setPwMensaje] = useState("");

  const token = localStorage.getItem("token");

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      setError("");

      const tid = filtrarTorneo ? torneoId : null;
      const url = tid
        ? `${API}/usuarios/perfil?torneo_id=${tid}`
        : `${API}/usuarios/perfil`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.mensaje || "Error cargando perfil");
        return;
      }

      setPerfil(data);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      setError("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPerfil();
  }, [torneoId, filtrarTorneo]);

  const cambiarPassword = async () => {
    setPwMensaje("");
    if (!pwActual || !pwNuevo || !pwConfirm) {
      setPwMensaje("❌ Completa todos los campos");
      return;
    }
    if (pwNuevo !== pwConfirm) {
      setPwMensaje("❌ Las contraseñas nuevas no coinciden");
      return;
    }
    if (pwNuevo.length < 6) {
      setPwMensaje("❌ La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const res = await fetch(`${API}/usuarios/mi-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ passwordActual: pwActual, passwordNuevo: pwNuevo }),
      });
      const data = await res.json();
      if (!res.ok) { setPwMensaje(`❌ ${data.mensaje}`); return; }
      setPwMensaje(`✅ ${data.mensaje}`);
      setPwActual(""); setPwNuevo(""); setPwConfirm("");
    } catch {
      setPwMensaje("❌ Error de conexión");
    }
  };

  if (cargando) {
    return <p className="mt-6 text-gray-500">Cargando perfil...</p>;
  }

  if (error) {
    return (
      <div className="mt-6 bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-3">
        {error}
      </div>
    );
  }

  if (!perfil) return null;

  return (
    <div className="mt-6 space-y-6">
      <Card className="shadow-md border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <h2 className="text-2xl font-bold">👤 Mi Perfil</h2>
            {torneoId && (
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-semibold">
                <button
                  onClick={() => setFiltrarTorneo(true)}
                  className={`px-3 py-1.5 transition-colors ${filtrarTorneo ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  Este torneo
                </button>
                <button
                  onClick={() => setFiltrarTorneo(false)}
                  className={`px-3 py-1.5 transition-colors ${!filtrarTorneo ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}
                >
                  Total histórico
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-500 mb-6">
            {filtrarTorneo && torneoId ? "Estadísticas del torneo actual." : "Estadísticas de todos tus torneos."}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm text-gray-500">Jugador</p>
              <p className="text-xl font-bold">{perfil.nombre}</p>
              <p className="text-sm text-gray-500">{perfil.email}</p>
            </div>

            <div className="rounded-xl bg-green-50 border border-green-100 p-4">
              <p className="text-sm text-gray-500">Pronósticos</p>
              <p className="text-3xl font-bold text-green-700">
                {perfil.pronosticosRealizados}
              </p>
            </div>

            <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
              <p className="text-sm text-gray-500">Efectividad</p>
              <p className="text-3xl font-bold text-yellow-700">
                {perfil.efectividad}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">
            📊 Estadísticas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Aciertos</p>
              <p className="text-2xl font-bold">{perfil.aciertos}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Marcadores exactos</p>
              <p className="text-2xl font-bold">{perfil.marcadoresExactos}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Jornadas jugadas</p>
              <p className="text-2xl font-bold">{perfil.jornadasJugadas}</p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">Puntos totales</p>
              <p className="text-2xl font-bold">{perfil.puntosTotales}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">🔒 Cambiar contraseña</h3>

          <div className="space-y-3 max-w-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
              <input
                type="password"
                value={pwActual}
                onChange={(e) => setPwActual(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Tu contraseña actual"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
              <input
                type="password"
                value={pwNuevo}
                onChange={(e) => setPwNuevo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nueva contraseña</label>
              <input
                type="password"
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="Repite la nueva contraseña"
              />
            </div>

            {pwMensaje && (
              <p className={`text-sm font-medium ${pwMensaje.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
                {pwMensaje}
              </p>
            )}

            <button
              onClick={cambiarPassword}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
            >
              Cambiar contraseña
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PerfilJugador;