import { useEffect, useState } from "react";
import { API } from "./config/api";

function TimerJornada({ jornada, torneoId, onCerrarJornada }) {
  const [tiempoRestante, setTiempoRestante] = useState("Cargando...");
  const [colorClase, setColorClase] = useState(
    "bg-green-100 text-green-700 border-green-300"
  );

  useEffect(() => {
    if (!jornada) {
      setTiempoRestante("Sin jornada");
      return undefined;
    }

    let intervaloActivo = null;
    let componenteActivo = true;

    const iniciarTimer = async () => {
      try {
        setTiempoRestante("Cargando...");

        const qs = torneoId ? `?torneo_id=${torneoId}` : "";
        const response = await fetch(`${API}/jornadas/${jornada}${qs}`);

        if (!response.ok) {
          console.warn("Jornada no encontrada:", jornada);
          setTiempoRestante("Sin fecha configurada");
          return;
        }

        const data = await response.json();

        if (!data?.fecha_cierre) {
          console.warn("fecha_cierre no existe");
          setTiempoRestante("Sin fecha configurada");
          return;
        }

        const fechaCierre = new Date(data.fecha_cierre);

        if (Number.isNaN(fechaCierre.getTime())) {
          console.warn("fecha_cierre inválida:", data.fecha_cierre);
          setTiempoRestante("Fecha inválida");
          return;
        }

        const actualizarTimer = () => {
          if (!componenteActivo) return;

          const ahora = new Date();
          const diferencia = fechaCierre.getTime() - ahora.getTime();

          if (diferencia <= 0 || data.estado !== "abierta") {
            setTiempoRestante("🔒 Jornada cerrada");
            setColorClase("bg-red-100 text-red-700 border-red-300");

            if (onCerrarJornada) onCerrarJornada();
            if (intervaloActivo) clearInterval(intervaloActivo);
            return;
          }

          const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
          const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
          const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
          const segundos = Math.floor((diferencia / 1000) % 60);
          const horasTotales = diferencia / (1000 * 60 * 60);

          if (horasTotales <= 3) {
            setColorClase("bg-red-100 text-red-700 border-red-300");
          } else if (horasTotales <= 12) {
            setColorClase("bg-yellow-100 text-yellow-700 border-yellow-300");
          } else {
            setColorClase("bg-green-100 text-green-700 border-green-300");
          }

          setTiempoRestante(`${dias}d ${horas}h ${minutos}m ${segundos}s`);
        };

        actualizarTimer();
        intervaloActivo = setInterval(actualizarTimer, 1000);
      } catch (error) {
        console.error("Error cargando timer:", error);
        setTiempoRestante("Error cargando fecha");
      }
    };

    iniciarTimer();

    return () => {
      componenteActivo = false;
      if (intervaloActivo) clearInterval(intervaloActivo);
    };
  }, [jornada, torneoId, onCerrarJornada]);

  return (
    <div
      className={`
        flex items-center gap-2 text-sm font-semibold
        px-4 py-2 rounded-lg border shadow-sm
        ${colorClase}
      `}
    >
      ⏱️ Cierre en:
      <span>{tiempoRestante}</span>
    </div>
  );
}

export default TimerJornada;
