import { useEffect, useMemo, useState } from "react";
import { API } from "./config/api";

const PALETTE = [
  "#EF4444", "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6",
  "#EC4899", "#0EA5E9", "#F97316", "#6366F1", "#84CC16",
  "#06B6D4", "#A855F7", "#FB7185", "#34D399", "#D97706",
  "#60A5FA", "#E879F9", "#4ADE80", "#F472B6", "#2DD4BF",
];

function nombreCorto(nombre) {
  const p = nombre.trim().split(/\s+/);
  if (p.length === 1) return p[0].substring(0, 11);
  return p[0] + " " + p[1][0] + ".";
}

function buildPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const cx = (prev.x + curr.x) / 2;
    d += ` C ${cx} ${prev.y} ${cx} ${curr.y} ${curr.x} ${curr.y}`;
  }
  return d;
}

function EvolucionPosiciones({ torneoId }) {
  const [datos, setDatos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!torneoId) return;
    setCargando(true);
    fetch(`${API}/pronosticos/historico-general?torneo_id=${torneoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setDatos(d); })
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [torneoId]);

  const chart = useMemo(() => {
    if (!datos.length) return null;

    // Puntos por jugador por jornada
    const ptsMap = {};
    datos.forEach((d) => {
      const j = d.jugador;
      const jn = Number(d.jornada_numero);
      if (!ptsMap[j]) ptsMap[j] = {};
      ptsMap[j][jn] = (ptsMap[j][jn] || 0) + Number(d.puntos_calculados || 0);
    });

    const jornadas = [...new Set(datos.map((d) => Number(d.jornada_numero)))].sort((a, b) => a - b);
    const jugadores = [...new Set(datos.map((d) => d.jugador))].sort();

    // Puntos acumulados por jornada
    const acum = {};
    jugadores.forEach((j) => {
      acum[j] = {};
      let total = 0;
      jornadas.forEach((jn) => {
        total += ptsMap[j]?.[jn] || 0;
        acum[j][jn] = total;
      });
    });

    // Ranking en cada jornada (desempate por nombre)
    const ranks = {};
    jornadas.forEach((jn) => {
      const sorted = [...jugadores].sort(
        (a, b) => (acum[b][jn] || 0) - (acum[a][jn] || 0) || a.localeCompare(b)
      );
      ranks[jn] = {};
      sorted.forEach((j, i) => { ranks[jn][j] = i + 1; });
    });

    return { jornadas, jugadores, acum, ranks };
  }, [datos]);

  if (cargando) return <p className="text-gray-400 text-sm py-4">Cargando gráfico de evolución...</p>;

  if (!chart || chart.jornadas.length < 2) {
    return (
      <p className="text-gray-400 text-sm py-4 text-center">
        Se necesitan al menos 2 jornadas con resultados para mostrar la evolución de posiciones.
      </p>
    );
  }

  const { jornadas, jugadores, acum, ranks } = chart;
  const n = jugadores.length;
  const m = jornadas.length;

  // Dimensiones SVG
  const PAD_L = 28;
  const PAD_R = 120;
  const PAD_T = 28;
  const PAD_B = 12;
  const ROW = 34;
  const COL = Math.max(68, Math.min(110, 760 / Math.max(m - 1, 1)));

  const W = PAD_L + COL * (m - 1) + PAD_R;
  const H = PAD_T + ROW * (n - 1) + PAD_B;

  const xOf = (i) => PAD_L + i * COL;
  const yOf = (rank) => PAD_T + (rank - 1) * ROW;

  return (
    <div className="w-full overflow-x-auto rounded-xl">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ minWidth: `${Math.min(W, 700)}px` }}
      >
        {/* Fondo blanco */}
        <rect x="0" y="0" width={W} height={H} fill="white" />

        {/* Líneas horizontales tenues por posición */}
        {Array.from({ length: n }, (_, i) => (
          <line
            key={`h-${i}`}
            x1={PAD_L - 4} y1={yOf(i + 1)}
            x2={PAD_L + COL * (m - 1) + 4} y2={yOf(i + 1)}
            stroke="#F3F4F6" strokeWidth="1"
          />
        ))}

        {/* Columnas verticales + etiquetas de jornada */}
        {jornadas.map((jn, i) => (
          <g key={`col-${jn}`}>
            <line
              x1={xOf(i)} y1={PAD_T - 6}
              x2={xOf(i)} y2={H - PAD_B + 4}
              stroke="#E5E7EB" strokeWidth="1"
            />
            <text
              x={xOf(i)} y={14}
              textAnchor="middle"
              fontSize="9.5"
              fill="#6B7280"
              fontWeight="700"
            >
              J{jn}
            </text>
          </g>
        ))}

        {/* Etiquetas de posición en el eje Y (izquierda) */}
        {Array.from({ length: n }, (_, i) => (
          <text
            key={`yl-${i}`}
            x={PAD_L - 8}
            y={yOf(i + 1) + 1}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="8.5"
            fill="#D1D5DB"
            fontWeight="600"
          >
            {i + 1}
          </text>
        ))}

        {/* Líneas y etiquetas de jugadores */}
        {jugadores.map((j, ci) => {
          const color = PALETTE[ci % PALETTE.length];
          const pts = jornadas.map((jn, i) => ({
            x: xOf(i),
            y: yOf(ranks[jn]?.[j] || n),
          }));
          const lastJn = jornadas[m - 1];
          const lastRank = ranks[lastJn]?.[j] || n;
          const lastPts = acum[j]?.[lastJn] || 0;

          return (
            <g key={j}>
              {/* Línea suavizada */}
              <path
                d={buildPath(pts)}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.9"
              />

              {/* Puntos en cada jornada */}
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x} cy={p.y}
                  r="4"
                  fill={color}
                  stroke="white"
                  strokeWidth="1.5"
                />
              ))}

              {/* Nombre del jugador al final */}
              <text
                x={xOf(m - 1) + 9}
                y={yOf(lastRank) + 1}
                dominantBaseline="middle"
                fontSize="10"
                fill={color}
                fontWeight="700"
              >
                {nombreCorto(j)}
              </text>

              {/* Puntos acumulados en pequeño */}
              <text
                x={xOf(m - 1) + 9}
                y={yOf(lastRank) + 11}
                dominantBaseline="middle"
                fontSize="8"
                fill={color}
                opacity="0.65"
              >
                {lastPts}pt
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default EvolucionPosiciones;
