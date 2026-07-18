/**
 * De un listado de jornadas devuelve la "activa":
 * 1. Última jornada cerrada (mayor número) — la que está en curso
 * 2. Si no hay cerradas: la primera abierta
 * 3. Fallback: primera de la lista
 */
export function jornadaActivaDeListado(jornadas) {
  if (!jornadas?.length) return null;
  const cerradas = jornadas.filter((j) => j.estado === "cerrada");
  if (cerradas.length > 0)
    return cerradas.reduce((max, j) => Number(j.numero) > Number(max.numero) ? j : max);
  const abierta = jornadas.find((j) => j.estado === "abierta");
  if (abierta) return abierta;
  return jornadas[0];
}
