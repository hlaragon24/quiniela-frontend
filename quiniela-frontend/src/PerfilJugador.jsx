import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

function PerfilJugador() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const cargarPerfil = async () => {
    try {
      setCargando(true);
      setError("");

      const res = await fetch(`${API}/usuarios/perfil`, {
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
  }, []);

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
          <h2 className="text-2xl font-bold mb-1">
            👤 Mi Perfil
          </h2>

          <p className="text-gray-500 mb-6">
            Estadísticas generales de tu participación.
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
    </div>
  );
}

export default PerfilJugador;