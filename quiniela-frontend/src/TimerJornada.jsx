import { useEffect, useRef, useState } from "react";
import { API } from "./config/api";

function TimerJornada({ jornada, torneoId, onCerrarJornada }) {
  const [tiempoRestante, setTiempoRestante] = useState("Cargando...");
  const [fechaCierreStr, setFechaCierreStr] = useState("");
  const [colorClase, setColorClase] = useState(
    "bg-green-100 text-green-700 border-green-300"
  );

  const hasClosed = useRef(false);

  useEffect(() => {
    hasClosed.current = false;

    if (!jornada) {
      setTiempoRestante("Sin jornada");
      setFechaCierreStr("");
      return undefined;
    }

    let intervaloActivo = null;
    let componenteActivo = true;

    const iniciarTimer = async () => {
      try {
        setTiempoRestante("Cargando...");
        setFechaCierreStr("");

        const qs = torneoId ? `?torneo_id=${torneoId}` : "";
        const response = await fetch(`${API}/jornadas/${jornada}${qs}`);

        if (!response.ok) {
          setTiempoRestante("Sin fecha configurada");
          return;
        }

        const data = await response.json();

        if (!data?.fecha_cierre) {
          setTiempoRestante("Sin fecha configurada");
          return;
        }

        const fechaCierre = new Date(data.fecha_cierre);

        if (Number.isNaN(fechaCierre.getTime())) {
          setTiempoRestante("Fecha inválida");
          return;
        }

        setFechaCierreStr(
          fechaCierre.toLocaleString("es-MX", {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })
        );

        const actualizarTimer = () => {
          if (!componenteActivo) return;

          const ahora = new Date();
          const diferencia = fechaCierre.getTime() - ahora.getTime();

          if (diferencia <= 0 || data.estado !== "abierta") {
            setTiempoRestante("🔒 Cerrada");
            setColorClase("bg-red-100 text-red-700 border-red-300");

            if (onCerrarJornada && !hasClosed.current) {
              hasClosed.current = true;
              onCerrarJornada();
            }
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

          const partes = [];
          if (dias > 0) partes.push(`${dias}d`);
          partes.push(`${horas}h`, `${minutos}m`, `${segundos}s`);
          setTiempoRestante(partes.join(" "));
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
      className={`flex flex-col items-center px-3 py-1.5 rounded-lg border shadow-sm text-center ${colorClase}`}
    >
      {fechaCierreStr && (
        <span className="text-[10px] font-medium opacity-70 leading-tight">
          Cierra: {fechaCierreStr}
        </span>
      )}
      <span className="text-sm font-bold leading-tight">⏱️ {tiempoRestante}</span>
    </div>
  );
}

export default TimerJornada;
