import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";

const COLORES = {
  blue:   { wrap: "border-blue-200 bg-blue-50",     bullet: "text-blue-500",   num: "text-blue-600" },
  green:  { wrap: "border-green-200 bg-green-50",   bullet: "text-green-600",  num: "text-green-600" },
  orange: { wrap: "border-orange-200 bg-orange-50", bullet: "text-orange-500", num: "text-orange-600" },
  yellow: { wrap: "border-yellow-200 bg-yellow-50", bullet: "text-yellow-600", num: "text-yellow-700" },
  purple: { wrap: "border-purple-200 bg-purple-50", bullet: "text-purple-500", num: "text-purple-600" },
  gray:   { wrap: "border-gray-200 bg-gray-50",     bullet: "text-gray-400",   num: "text-gray-600" },
};

function Seccion({ titulo, icono, color = "blue", children }) {
  const c = COLORES[color];
  return (
    <div className={`border rounded-xl p-5 ${c.wrap}`}>
      <h3 className="text-base font-bold mb-3 flex items-center gap-2">
        <span>{icono}</span>
        <span>{titulo}</span>
      </h3>
      {children}
    </div>
  );
}

function FilaPuntos({ label, sub, badge, bg = "white", border = "gray-200", textBadge = "green-700", bgBadge = "green-100" }) {
  return (
    <div className={`flex items-center justify-between bg-${bg} rounded-lg px-3 py-2 border border-${border}`}>
      <span className="text-sm text-gray-700">
        {label}
        {sub && <span className="text-gray-400 ml-1">{sub}</span>}
      </span>
      <span className={`font-bold text-${textBadge} text-sm bg-${bgBadge} px-2 py-0.5 rounded-full whitespace-nowrap`}>
        {badge}
      </span>
    </div>
  );
}

function Reglamento({ torneoId }) {
  const [notas, setNotas] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!torneoId) return;
    setCargando(true);
    fetch(`${API}/reglamento?torneo_id=${torneoId}`)
      .then((r) => r.json())
      .then((data) => setNotas(data.contenido ?? ""))
      .catch(console.error)
      .finally(() => setCargando(false));
  }, [torneoId]);

  return (
    <div className="mt-6 space-y-4">

      {/* Encabezado */}
      <Card className="shadow-md border">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-1">📋 Reglamento</h2>
          <p className="text-gray-500 text-sm">
            Aquí encontrarás todas las reglas y el sistema de puntuación de la quiniela.
          </p>
        </CardContent>
      </Card>

      {/* Cómo funciona */}
      <Seccion titulo="¿Cómo funciona?" icono="⚽" color="blue">
        <ol className="space-y-2.5 text-sm text-gray-700">
          {[
            <>Antes del cierre de cada jornada, registra tu pronóstico: elige <strong>quién gana o si hay empate</strong> y anota un <strong>marcador exacto</strong>.</>,
            <>Una vez que cierra la jornada, <strong>ya no se pueden modificar</strong> los pronósticos.</>,
            <>El administrador ingresa los resultados reales y el sistema <strong>calcula los puntos automáticamente</strong>.</>,
            <>Los puntos se acumulan en la tabla general y puedes ver tu posición con el ranking actualizado.</>,
          ].map((texto, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-blue-600 min-w-[20px]">{i + 1}.</span>
              <span>{texto}</span>
            </li>
          ))}
        </ol>
      </Seccion>

      {/* Puntuación */}
      <Seccion titulo="Sistema de puntuación" icono="🏅" color="green">
        <div className="space-y-5">

          {/* Normal */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Partido normal</p>
            <div className="space-y-2">
              <FilaPuntos
                label="Resultado correcto (Local / Empate / Visitante)"
                badge="+1 pt"
                textBadge="green-700" bgBadge="green-100"
              />
              <FilaPuntos
                label="Marcador exacto"
                sub="(además del resultado correcto)"
                badge="+2 pts extra"
                textBadge="green-700" bgBadge="green-100"
              />
              <FilaPuntos
                label="Máximo por partido normal"
                badge="3 pts"
                bg="green-100" border="green-300"
                textBadge="green-800" bgBadge="green-200"
              />
            </div>
          </div>

          {/* Comodín */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Partido comodín ⭐ <span className="text-orange-500 normal-case">— puntuación especial</span>
            </p>
            <div className="space-y-2">
              <FilaPuntos
                label="Resultado correcto"
                badge="+2 pts"
                textBadge="orange-700" bgBadge="orange-100"
              />
              <FilaPuntos
                label="Marcador exacto"
                sub="(además del resultado correcto)"
                badge="+3 pts extra"
                textBadge="orange-700" bgBadge="orange-100"
              />
              <FilaPuntos
                label="Máximo por partido comodín"
                badge="5 pts"
                bg="orange-100" border="orange-300"
                textBadge="orange-800" bgBadge="orange-200"
              />
            </div>
          </div>

          {/* Campeón */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Campeón de temporada 🏆 <span className="text-yellow-600 normal-case">— solo torneos de temporada</span>
            </p>
            <FilaPuntos
              label="Equipo campeón acertado"
              badge="+10 pts"
              textBadge="yellow-700" bgBadge="yellow-200"
            />
          </div>

          {/* Resumen visual */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { label: "Resultado", pts: "1 pt",  color: "bg-blue-100 text-blue-800 border-blue-200" },
              { label: "Marcador",  pts: "+2 pts", color: "bg-green-100 text-green-800 border-green-200" },
              { label: "Comodín",   pts: "hasta 5", color: "bg-orange-100 text-orange-800 border-orange-200" },
              { label: "Campeón",   pts: "+10 pts", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
            ].map(({ label, pts, color }) => (
              <div key={label} className={`rounded-lg border text-center p-2 ${color}`}>
                <p className="text-xs font-semibold">{label}</p>
                <p className="text-lg font-black">{pts}</p>
              </div>
            ))}
          </div>
        </div>
      </Seccion>

      {/* Partido comodín */}
      <Seccion titulo="Partido Comodín ⭐" icono="⭐" color="orange">
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            <>Cada jornada puede tener <strong>un partido marcado como comodín</strong>.</>,
            <>El partido comodín se identifica con <strong>⭐</strong> al registrar y ver tus pronósticos.</>,
            <>Otorga <strong>puntuación especial</strong>: +2 pts por resultado correcto y +3 pts adicionales por marcador exacto.</>,
            <>El comodín es <strong>el mismo para todos los jugadores</strong> de la jornada. Nadie tiene ventaja.</>,
            <>Si no aciertas el resultado en el comodín, <strong>los puntos de marcador exacto no aplican</strong> aunque hayas anotado los goles correctos.</>,
          ].map((texto, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-orange-400 mt-0.5">•</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* Campeón */}
      <Seccion titulo="Pronóstico de Campeón de Temporada" icono="🏆" color="yellow">
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            <>Solo aplica en torneos de <strong>temporada completa</strong>.</>,
            <>Cada jugador registra <strong>una sola vez</strong> qué equipo cree que será campeón del torneo.</>,
            <>Puedes cambiar tu apuesta cuantas veces quieras <strong>antes de la fecha de cierre</strong> configurada por el administrador.</>,
            <>Una vez declarado el campeón real, <strong>no se pueden hacer modificaciones</strong>.</>,
            <>Si aciertas: <strong>+10 puntos</strong> que se suman a tu total acumulado del torneo.</>,
          ].map((texto, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-yellow-500 mt-0.5">•</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* Jornadas */}
      <Seccion titulo="Jornadas y fechas" icono="📅" color="purple">
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            <>Cada jornada tiene una <strong>fecha y hora de cierre</strong> que el administrador publica con anticipación.</>,
            <>Registra tus pronósticos <strong>antes del cierre</strong>. El sistema muestra un contador regresivo.</>,
            <>Una jornada <strong>cerrada 🔒</strong> no permite nuevos pronósticos ni modificaciones de ningún tipo.</>,
            <>Si no registraste pronóstico para un partido, ese partido te otorga <strong>0 puntos</strong>. No hay excepciones.</>,
            <>Puedes revisar tus pronósticos y resultados en el tab <strong>"Mis pronósticos"</strong>.</>,
          ].map((texto, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* Pagos */}
      <Seccion titulo="Pagos e inscripción" icono="💳" color="gray">
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            <>El torneo puede ser <strong>por temporada completa</strong> (un pago inicial) o <strong>por jornada</strong> (pago semanal).</>,
            <>Los pagos son <strong>confirmados por el administrador</strong>. Si tienes un pago pendiente, verás un aviso en la aplicación.</>,
            <>Contacta al administrador para <strong>confirmar tu pago</strong> y asegurar tu participación en las jornadas.</>,
            <>El monto y las condiciones específicas de pago son establecidas por el organizador del torneo.</>,
          ].map((texto, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* Distribución de premios */}
      <Seccion titulo="Distribución de premios" icono="💰" color="green">
        <div className="space-y-5">

          {/* Torneo de temporada */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Torneo de temporada completa
            </p>

            {/* Desglose visual del pozo */}
            <div className="rounded-xl overflow-hidden border border-green-200 mb-3">
              <div className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider">
                Pozo total recaudado = 100%
              </div>
              <div className="divide-y divide-green-100">
                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50">
                  <span className="text-sm text-gray-600">🏢 Administración</span>
                  <span className="font-bold text-gray-700 bg-gray-200 px-2 py-0.5 rounded-full text-sm">15%</span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 bg-yellow-50">
                  <span className="text-sm font-semibold text-yellow-800">🥇 1er lugar</span>
                  <span className="font-bold text-yellow-700 bg-yellow-200 px-2 py-0.5 rounded-full text-sm">59.5% <span className="font-normal text-yellow-600 text-xs">(70% del 85%)</span></span>
                </div>
                <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50">
                  <span className="text-sm font-semibold text-orange-800">🥈 2do lugar</span>
                  <span className="font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full text-sm">25.5% <span className="font-normal text-orange-600 text-xs">(30% del 85%)</span></span>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-sm text-gray-700">
              {[
                <>El 15% del total recaudado se destina a la <strong>administración del torneo</strong>.</>,
                <>El 85% restante se reparte entre los ganadores: <strong>70% para 1er lugar</strong> y <strong>30% para 2do lugar</strong>.</>,
                <>Si dos o más jugadores <strong>empatan en 1er lugar</strong>: no habrá 2do lugar. El 85% completo se divide en partes iguales entre todos los empatados en primer lugar.</>,
                <>Si dos o más jugadores <strong>empatan en 2do lugar</strong>: el 30% se divide en partes iguales entre todos los empatados en ese lugar.</>,
              ].map((texto, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Por jornada */}
          <div className="border-t border-green-200 pt-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Torneo por jornada
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              {[
                <>Cada jornada tiene una <strong>cuota fija</strong> establecida por el administrador.</>,
                <>En torneos por jornada <strong>solo existe el 1er lugar</strong>. No hay 2do lugar.</>,
                <>Si uno o varios jugadores empatan en el primer lugar, el <strong>premio de esa jornada se divide en partes iguales</strong> entre todos los empatados.</>,
                <>El monto específico de cada jornada es comunicado por el administrador antes del inicio de la misma.</>,
              ].map((texto, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Seccion>

      {/* Conducta */}
      <Seccion titulo="Conducta y fair play" icono="🤝" color="blue">
        <ul className="space-y-2 text-sm text-gray-700">
          {[
            <>Los pronósticos son <strong>personales e intransferibles</strong>. Cada cuenta es de un solo jugador.</>,
            <>Cualquier intento de manipulación, fraude o uso de múltiples cuentas resultará en <strong>descalificación inmediata</strong>.</>,
            <>Las decisiones del administrador en materia de puntuación y resultados son <strong>definitivas</strong>.</>,
          ].map((texto, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-blue-400 mt-0.5">•</span>
              <span>{texto}</span>
            </li>
          ))}
        </ul>
      </Seccion>

      {/* Notas adicionales del admin */}
      {!cargando && notas && (
        <Seccion titulo="Información adicional del torneo" icono="📝" color="gray">
          <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{notas}</div>
        </Seccion>
      )}

    </div>
  );
}

export default Reglamento;
