import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

function AdminCampeon({ torneoId }) {
  const [fechaCierre, setFechaCierre] = useState("");
  const [equipoCampeon, setEquipoCampeon] = useState("");
  const [puntosCampeon, setPuntosCampeon] = useState(10);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  const token = localStorage.getItem("token");

  const cargarConfig = async () => {
    if (!torneoId) return;

    try {
      setCargando(true);

      const res = await fetch(`${API}/campeon/config?torneo_id=${torneoId}`);
      const data = await res.json();

      if (res.ok && data.fecha_cierre) {
        const fecha = new Date(data.fecha_cierre);
        const local = new Date(fecha.getTime() - fecha.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
        setFechaCierre(local);
      }
    } catch (error) {
      console.error("Error cargando config campeón:", error);
    } finally {
      setCargando(false);
    }
  };

  const guardarFechaCierre = async () => {
    if (!fechaCierre) {
      setMensaje("⚠ Selecciona una fecha de cierre");
      return;
    }

    try {
      setMensaje("Guardando fecha de cierre...");

      const res = await fetch(`${API}/campeon/admin/config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fecha_cierre: fechaCierre, torneo_id: torneoId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(`❌ ${data.mensaje || "Error guardando fecha"}`);
        return;
      }

      setMensaje(`✅ ${data.mensaje}`);
      await cargarConfig();
    } catch (error) {
      console.error("Error guardando fecha:", error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  const declararCampeon = async () => {
    if (!equipoCampeon.trim()) {
      setMensaje("⚠ Escribe el equipo campeón");
      return;
    }

    try {
      setMensaje("Declarando campeón...");

      const res = await fetch(`${API}/campeon/admin`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          equipo: equipoCampeon.trim(),
          puntos: Number(puntosCampeon),
          torneo_id: torneoId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensaje(`❌ ${data.mensaje || "Error declarando campeón"}`);
        return;
      }

      setMensaje(`✅ ${data.mensaje}`);
    } catch (error) {
      console.error("Error declarando campeón:", error);
      setMensaje("❌ Error de conexión con el servidor");
    }
  };

  useEffect(() => {
    cargarConfig();
  }, [torneoId]);

  if (cargando) {
    return <p className="mt-6 text-gray-500">Cargando configuración...</p>;
  }

  return (
    <div className="mt-6 space-y-6">
      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-1">👑 Administración de Campeón</h2>
          <p className="text-gray-500 mb-6">
            Configura la fecha límite para que los jugadores registren su campeón.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">
                Fecha límite de pronóstico de campeón
              </label>
              <input
                type="datetime-local"
                value={fechaCierre}
                onChange={(e) => setFechaCierre(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full md:w-80"
              />
            </div>

            <button
              onClick={guardarFechaCierre}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
            >
              Guardar fecha límite
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold mb-4">🏆 Declarar campeón real</h3>

          <div className="space-y-4">
            <div>
              <label className="block font-semibold mb-1">Equipo campeón</label>
              <input
                type="text"
                value={equipoCampeon}
                onChange={(e) => setEquipoCampeon(e.target.value)}
                placeholder="Ej. América"
                className="border rounded-lg px-3 py-2 w-full md:w-80"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Puntos por campeón</label>
              <input
                type="number"
                min="0"
                value={puntosCampeon}
                onChange={(e) => setPuntosCampeon(e.target.value)}
                className="border rounded-lg px-3 py-2 w-full md:w-32"
              />
            </div>

            <button
              onClick={declararCampeon}
              className="bg-yellow-600 text-white px-5 py-2 rounded-lg hover:bg-yellow-700"
            >
              Declarar campeón
            </button>
          </div>
        </CardContent>
      </Card>

      {mensaje && (
        <div className="rounded-lg border px-4 py-3 bg-gray-50">{mensaje}</div>
      )}
    </div>
  );
}

export default AdminCampeon;
