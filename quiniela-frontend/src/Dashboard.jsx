import { useEffect, useState } from "react";
import { API } from "./config/api";
import { Card, CardContent } from "@/components/ui/card";
import EvolucionPosiciones from "./EvolucionPosiciones";

function medalla(posicion) {
    if (Number(posicion) === 1) return "🥇";
    if (Number(posicion) === 2) return "🥈";
    if (Number(posicion) === 3) return "🥉";
    if (Number(posicion) === 4) return "4️⃣";
    if (Number(posicion) === 5) return "5️⃣";
    return `#${posicion}`;
}

function formatearFecha(fecha) {
    if (!fecha) return "Sin configurar";
    const date = new Date(fecha);
    if (Number.isNaN(date.getTime())) return "Fecha inválida";
    return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function calcularTiempoRestante(fecha) {
    if (!fecha) return "Sin fecha configurada";
    const cierre = new Date(fecha).getTime();
    const ahora = Date.now();
    const diff = cierre - ahora;

    if (Number.isNaN(cierre)) return "Fecha inválida";
    if (diff <= 0) return "Cerrado";

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutos = Math.floor((diff / (1000 * 60)) % 60);

    if (dias > 0) return `${dias} día(s), ${horas} hora(s)`;
    if (horas > 0) return `${horas} hora(s), ${minutos} minuto(s)`;
    return `${minutos} minuto(s)`;
}

function formatearDinero(valor) {
    return Number(valor || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function Dashboard({ jornadaActual, jornadaAbierta, partidos, pronosticosUsuario, marcadoresUsuario, jornadasCount, torneoId, miPagoTemporada }) {
    const [resumen, setResumen] = useState(null);
    const [ranking, setRanking] = useState([]);
    const [bottom5, setBottom5] = useState([]);
    const [configCampeon, setConfigCampeon] = useState(null);
    const [campeonInput, setCampeonInput] = useState("");
    const [miCampeon, setMiCampeon] = useState(null);
    const miPago = miPagoTemporada ?? null;
    const [mensajeCampeon, setMensajeCampeon] = useState("");
    const [cargando, setCargando] = useState(true);
    const [guardandoCampeon, setGuardandoCampeon] = useState(false);
    const [equipos, setEquipos] = useState([]);

    const token = localStorage.getItem("token");

    const cargarDashboard = async (tid) => {
        if (!tid) return;

        try {
            setCargando(true);

            const [
                resResumen,
                resRanking,
                resMiCampeon,
                resConfigCampeon,
            ] = await Promise.all([
                fetch(`${API}/ranking/mi-resumen?torneo_id=${tid}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API}/ranking/torneo/${tid}`),
                fetch(`${API}/campeon/mi-pronostico?torneo_id=${tid}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API}/campeon/config?torneo_id=${tid}`),
            ]);

            const dataResumen = await resResumen.json();
            const dataRanking = await resRanking.json();
            const dataMiCampeon = await resMiCampeon.json();
            const dataConfigCampeon = await resConfigCampeon.json();

            if (resResumen.ok) setResumen(dataResumen);
            if (resRanking.ok && Array.isArray(dataRanking)) {
                setRanking(dataRanking.slice(0, 5));
                if (dataRanking.length > 5) {
                    setBottom5(dataRanking.slice(-5).reverse());
                } else {
                    setBottom5([]);
                }
            }

            if (resMiCampeon.ok) {
                const pronostico = dataMiCampeon.pronostico || null;
                setMiCampeon(pronostico);
                if (pronostico?.equipo) setCampeonInput(pronostico.equipo);
            }

            if (resConfigCampeon.ok) setConfigCampeon(dataConfigCampeon);
        } catch (error) {
            console.error("Error cargando dashboard:", error);
        } finally {
            setCargando(false);
        }
    };

    const guardarCampeon = async () => {
        const equipo = campeonInput.trim();

        if (!equipo) {
            setMensajeCampeon("⚠ Escribe el nombre del equipo campeón");
            return;
        }

        if (!configCampeon?.configurado) {
            setMensajeCampeon("⚠ El administrador aún no configuró la fecha de cierre");
            return;
        }

        if (configCampeon?.bloqueado) {
            setMensajeCampeon("🔒 El pronóstico de campeón ya está cerrado");
            return;
        }

        if (resumen?.campeonReal) {
            setMensajeCampeon("🔒 El campeón real ya fue declarado");
            return;
        }

        try {
            setGuardandoCampeon(true);
            setMensajeCampeon("Guardando campeón...");

            const metodo = miCampeon ? "PUT" : "POST";
            const url = miCampeon ? `${API}/campeon/mi-pronostico` : `${API}/campeon`;

            const res = await fetch(url, {
                method: metodo,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ equipo, torneo_id: torneoId }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMensajeCampeon(`❌ ${data.mensaje || "Error guardando campeón"}`);
                return;
            }

            setMensajeCampeon(`✅ ${data.mensaje}`);
            await cargarDashboard(torneoId);
        } catch (error) {
            console.error("Error guardando campeón:", error);
            setMensajeCampeon("❌ Error de conexión con el servidor");
        } finally {
            setGuardandoCampeon(false);
        }
    };

    useEffect(() => {
        fetch(`${API}/equipos`)
            .then((r) => r.json())
            .then((d) => { if (Array.isArray(d)) setEquipos(d); })
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (!torneoId) return;
        setResumen(null);
        setRanking([]);
        setBottom5([]);
        setMiCampeon(null);
        setConfigCampeon(null);
        setMensajeCampeon("");
        setCargando(true);
        cargarDashboard(torneoId);
    }, [torneoId]);

    const totalPartidos = partidos.length;
    const pronosticosCompletados = partidos.filter((p) => {
        const tieneResultado = Boolean(pronosticosUsuario[p.id]);
        const m = marcadoresUsuario?.[p.id];
        const tieneMarcador = m != null &&
            m.local !== undefined && m.local !== "" &&
            m.visitante !== undefined && m.visitante !== "";
        return tieneResultado && tieneMarcador;
    }).length;

    const campeonBloqueado =
        guardandoCampeon ||
        Boolean(resumen?.campeonReal) ||
        Boolean(configCampeon?.bloqueado) ||
        !configCampeon?.configurado;

    const estaEnTop3 = Number(resumen?.posicionGeneral) <= 3;
    const esLider = Number(resumen?.posicionGeneral) === 1;
    const puntosParaLider = Number(resumen?.diferenciaLider || 0);
    const promedioPorJornada = jornadasCount > 0
        ? (Number(resumen?.puntosJornadas ?? 0) / jornadasCount).toFixed(1)
        : null;

    if (cargando) {
        return <div className="mt-6 text-gray-500">Cargando inicio...</div>;
    }

    if (!resumen) {
        return (
            <div className="mt-6 bg-red-100 text-red-700 border border-red-300 rounded-lg px-4 py-3">
                No se pudo cargar tu resumen.
            </div>
        );
    }

    return (
        <div className="mt-6 space-y-6">
            {miPago && !miPago.pagado && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <p className="text-lg font-bold">⚠️ Pago pendiente</p>
                            <p className="text-sm">
                                Tu inscripción aún aparece como pendiente. Monto registrado:{" "}
                                <strong>{formatearDinero(miPago.monto)}</strong>
                            </p>
                        </div>
                        <div className="text-sm font-semibold">
                            Contacta al administrador para confirmar tu pago.
                        </div>
                    </div>
                </div>
            )}

            <Card className="shadow-md border">
                <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-1">Hola, {resumen.nombre} 👋</h2>
                    <p className="text-gray-500 mb-6">Este es tu resumen general del torneo.</p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                            <p className="text-sm text-gray-500">Posición general</p>
                            <p className="text-3xl font-bold text-blue-700">#{resumen.posicionGeneral}</p>
                            <p className="text-sm text-gray-500">de {resumen.totalJugadores} jugadores</p>
                        </div>

                        <div className="rounded-xl bg-green-50 border border-green-100 p-4">
                            <p className="text-sm text-gray-500">Puntos totales</p>
                            <p className="text-3xl font-bold text-green-700">{resumen.puntosTotales}</p>
                            <p className="text-sm text-gray-500">puntos acumulados</p>
                        </div>

                        <div className="rounded-xl bg-yellow-50 border border-yellow-100 p-4">
                            <p className="text-sm text-gray-500">Campeón</p>
                            {resumen.campeonReal ? (
                                miCampeon?.equipo && miCampeon.equipo.trim().toLowerCase() === resumen.campeonReal.trim().toLowerCase() ? (
                                    <>
                                        <p className="text-2xl font-bold text-green-600">¡Acertaste!</p>
                                        <p className="text-sm text-green-600 font-semibold">+{resumen.puntosCampeon} pts</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xl font-bold text-red-500">No acertaste</p>
                                        <p className="text-xs text-gray-500">Ganó: {resumen.campeonReal}</p>
                                    </>
                                )
                            ) : (
                                <>
                                    <p className="text-3xl font-bold text-yellow-700">{resumen.puntosCampeon}</p>
                                    <p className="text-sm text-gray-400">
                                        {miCampeon?.equipo ? `Tu apuesta: ${miCampeon.equipo}` : "Sin pronóstico aún"}
                                    </p>
                                </>
                            )}
                        </div>

                        <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                            <p className="text-sm text-gray-500">Contra el líder</p>
                            <p className="text-3xl font-bold text-purple-700">{resumen.diferenciaLider}</p>
                            <p className="text-sm text-gray-500">puntos de diferencia</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card
                className={`shadow-md border ${esLider ? "border-yellow-300 bg-yellow-50" : ""} ${estaEnTop3 && !esLider ? "border-blue-200 bg-blue-50" : ""}`}
            >
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">📈 Mi progreso</h3>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Tu posición</p>
                            <p className="text-3xl font-bold">{medalla(resumen.posicionGeneral)}</p>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Tus puntos</p>
                            <p className="text-3xl font-bold">{resumen.puntosTotales}</p>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Puntos líder</p>
                            <p className="text-3xl font-bold">{resumen.puntosLider}</p>
                        </div>

                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Para alcanzar líder</p>
                            <p className="text-3xl font-bold">{puntosParaLider}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Aciertos</p>
                            <p className="text-2xl font-bold text-blue-700">{resumen.aciertos ?? 0}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Marcadores exactos</p>
                            <p className="text-2xl font-bold text-green-700">{resumen.marcadoresExactos ?? 0}</p>
                        </div>
                        <div className="rounded-lg border bg-white p-4">
                            <p className="text-sm text-gray-500">Efectividad</p>
                            <p className="text-2xl font-bold text-purple-700">
                                {resumen.pronosticosRealizados > 0
                                    ? `${Math.round((resumen.aciertos / resumen.pronosticosRealizados) * 100)}%`
                                    : "—"}
                            </p>
                        </div>
                        {promedioPorJornada && (
                            <div className="rounded-lg border bg-white p-4">
                                <p className="text-sm text-gray-500">Promedio/jornada</p>
                                <p className="text-2xl font-bold text-orange-600">{promedioPorJornada}</p>
                                <p className="text-xs text-gray-400">pts promedio</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 rounded-lg border px-4 py-3 bg-white">
                        {esLider ? (
                            <p className="font-semibold text-yellow-700">
                                🏆 Vas liderando la tabla general. Mantén la ventaja.
                            </p>
                        ) : estaEnTop3 ? (
                            <p className="font-semibold text-blue-700">
                                🔥 Estás en zona de podio. Te faltan {puntosParaLider} punto(s) para alcanzar al líder.
                            </p>
                        ) : (
                            <p className="font-semibold text-gray-700">
                                💪 Te faltan {puntosParaLider} punto(s) para alcanzar al líder.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className={`shadow-md border ${miPago?.pagado ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">💵 Estado de inscripción</h3>

                    {miPago ? (
                        <div className="space-y-2">
                            <p className="text-lg font-bold">
                                {miPago.pagado ? "✅ Pagado" : "❌ Pago pendiente"}
                            </p>
                            <p><span className="font-semibold">Monto:</span> {formatearDinero(miPago.monto)}</p>
                            <p><span className="font-semibold">Método:</span> {miPago.metodo_pago || "Sin método"}</p>
                            {miPago.fecha_pago && (
                                <p><span className="font-semibold">Fecha de pago:</span> {formatearFecha(miPago.fecha_pago)}</p>
                            )}
                            {miPago.notas && <p className="text-sm text-gray-600">{miPago.notas}</p>}
                        </div>
                    ) : (
                        <p className="text-gray-600">No hay información de pago registrada.</p>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-md border">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4">⚽ Jornada actual</h3>

                        <div className="space-y-2">
                            <p><span className="font-semibold">Jornada:</span> {jornadaActual ? jornadaActual.numero : "Sin jornada"}</p>
                            <p><span className="font-semibold">Estado:</span> {jornadaAbierta ? "🟢 Abierta" : "🔒 Cerrada"}</p>
                            <p><span className="font-semibold">Pronósticos:</span> {pronosticosCompletados} de {totalPartidos}</p>
                            <p><span className="font-semibold">Puntos jornadas:</span> {resumen.puntosJornadas}</p>
                            <p><span className="font-semibold">Puntos pronóstico:</span> {resumen.puntosPronostico}</p>
                            <p><span className="font-semibold">Puntos marcador:</span> {resumen.puntosMarcador}</p>
                            <p><span className="font-semibold">Puntos comodín:</span> {resumen.puntosComodin}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`shadow-md border ${configCampeon?.bloqueado ? "border-red-200 bg-red-50" : ""} ${!configCampeon?.bloqueado && configCampeon?.configurado ? "border-green-200 bg-green-50" : ""}`}
                >
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4">👑 Pronóstico de Campeón</h3>

                        <div className="space-y-3">
                            <div
                                className={`rounded-lg px-4 py-3 border ${configCampeon?.bloqueado ? "bg-red-100 border-red-200 text-red-700" : "bg-white border-green-200 text-green-700"}`}
                            >
                                {configCampeon?.configurado ? (
                                    <>
                                        <p className="font-semibold">
                                            {configCampeon.bloqueado ? "🔒 Pronóstico cerrado" : "🟢 Pronóstico abierto"}
                                        </p>
                                        <p className="text-sm">Cierra: {formatearFecha(configCampeon.fecha_cierre)}</p>
                                        <p className="text-sm font-semibold">
                                            ⏳ Faltan: {calcularTiempoRestante(configCampeon.fecha_cierre)}
                                        </p>
                                    </>
                                ) : (
                                    <p className="font-semibold text-yellow-700">
                                        ⚠ El administrador aún no configuró la fecha de cierre.
                                    </p>
                                )}
                            </div>

                            <div className="rounded-lg border bg-white px-4 py-3">
                                <p><span className="font-semibold">Tu selección:</span> {miCampeon?.equipo || "No registrada"}</p>
                                <p><span className="font-semibold">Campeón real:</span> {resumen.campeonReal || "Pendiente"}</p>
                                <p><span className="font-semibold">Puntos posibles:</span> {resumen.campeonReal ? resumen.puntosCampeon : "Pendiente"}</p>
                            </div>

                            {equipos.length > 0 && (
                                <datalist id="equipos-campeon-list">
                                    {equipos.map((e) => (
                                        <option key={e.id} value={e.nombre} />
                                    ))}
                                </datalist>
                            )}
                            <input
                                type="text"
                                list="equipos-campeon-list"
                                value={campeonInput}
                                onChange={(e) => setCampeonInput(e.target.value)}
                                placeholder="Ej. Chivas"
                                disabled={campeonBloqueado}
                                className={`w-full border rounded-lg px-3 py-2 ${campeonBloqueado ? "bg-gray-100 cursor-not-allowed" : ""}`}
                            />

                            <button
                                onClick={guardarCampeon}
                                disabled={campeonBloqueado}
                                className={`px-4 py-2 rounded-lg text-white font-semibold ${campeonBloqueado ? "bg-gray-400 cursor-not-allowed" : "bg-yellow-600 hover:bg-yellow-700"}`}
                            >
                                {miCampeon ? "Actualizar campeón" : "Guardar campeón"}
                            </button>

                            {resumen.campeonReal && (
                                <p className="text-sm text-gray-500">
                                    El campeón real ya fue declarado. Ya no puedes modificar tu elección.
                                </p>
                            )}

                            {configCampeon?.bloqueado && !resumen.campeonReal && (
                                <p className="text-sm text-red-600">
                                    La fecha límite ya pasó. Ya no puedes registrar ni modificar campeón.
                                </p>
                            )}

                            {mensajeCampeon && <p className="text-sm">{mensajeCampeon}</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-md border">
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">📈 Evolución de posiciones</h3>
                    <EvolucionPosiciones torneoId={torneoId} />
                </CardContent>
            </Card>

            <Card className="shadow-md border">
                <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-4">🏆 Top 5 tabla general</h3>

                    {ranking.length === 0 ? (
                        <p className="text-gray-500">Todavía no hay ranking disponible.</p>
                    ) : (
                        <div className="space-y-3">
                            {ranking.map((jugador) => (
                                <div
                                    key={`ranking-dashboard-${jugador.id}`}
                                    className={`flex justify-between items-center border rounded-lg px-4 py-3 ${Number(jugador.posicion) === 1 ? "bg-yellow-50 border-yellow-200" : ""} ${Number(jugador.posicion) === 2 ? "bg-gray-50 border-gray-200" : ""}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{medalla(jugador.posicion)}</span>
                                        <div>
                                            <div className="font-bold">{jugador.nombre}</div>
                                            <div className="text-xs text-gray-500">
                                                Pronóstico {jugador.puntos_pronostico} · Marcador {jugador.puntos_marcador} · Comodín {jugador.puntos_comodin}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-lg">{jugador.total} pts</div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {bottom5.length > 0 && (
                <Card className="shadow-md border">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-bold mb-4">📉 Top 5 de la vergüenza</h3>
                        <div className="space-y-3">
                            {bottom5.map((jugador) => (
                                <div
                                    key={`bottom-${jugador.id}`}
                                    className="flex justify-between items-center border rounded-lg px-4 py-3 bg-orange-50 border-orange-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">#{jugador.posicion}</span>
                                        <div>
                                            <div className="font-bold">{jugador.nombre}</div>
                                            <div className="text-xs text-gray-500">
                                                Pronóstico {jugador.puntos_pronostico} · Marcador {jugador.puntos_marcador} · Comodín {jugador.puntos_comodin}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-lg text-orange-700">{jugador.total} pts</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default Dashboard;
