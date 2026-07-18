import { useState, useEffect } from "react";
import { API } from "./config/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  useEffect(() => {
    // Warm up Render backend (free tier spins down after inactivity)
    fetch(`${API}/jornadas`)
      .catch(() => {})
      .finally(() => setServerReady(true));
  }, []);

  const iniciarSesion = async () => {
    setLoading(true);
    setMensaje("");
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMensaje(data.mensaje || "Error al iniciar sesión");
        return;
      }

      if (!data.token || !data.usuario) {
        setMensaje("Respuesta incompleta del servidor");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("nombre", data.usuario.nombre);
      localStorage.setItem("usuario_id", data.usuario.id);
      localStorage.setItem("rol", data.usuario.rol || "jugador");

      if (onLogin) onLogin(data.token);
    } catch (error) {
      console.error("Error login:", error);
      setMensaje("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") iniciarSesion();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: "linear-gradient(160deg, #064e1a 0%, #0d7a2e 35%, #0a5c22 65%, #061b0d 100%)" }}>

      {/* Campo de fútbol - decoración de fondo */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Línea central */}
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-white/10" />
        {/* Círculo central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-[3px] border-white/10" />
        {/* Punto central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/20" />
        {/* Borde del campo */}
        <div className="absolute inset-6 border-[3px] border-white/8 rounded" />
        {/* Área grande derecha */}
        <div className="absolute top-1/4 right-6 w-24 h-1/2 border-[3px] border-white/10 border-r-0" />
        {/* Área grande izquierda */}
        <div className="absolute top-1/4 left-6 w-24 h-1/2 border-[3px] border-white/10 border-l-0" />
        {/* Balones decorativos */}
        <div className="absolute top-8 left-8 text-7xl opacity-[0.07] -rotate-12 blur-[1px]">⚽</div>
        <div className="absolute bottom-8 right-8 text-7xl opacity-[0.07] rotate-12 blur-[1px]">⚽</div>
        <div className="absolute top-1/3 right-16 text-5xl opacity-[0.06] rotate-45">⚽</div>
        <div className="absolute bottom-1/3 left-16 text-5xl opacity-[0.06] -rotate-45">⚽</div>
        {/* Gradiente oscuro sobre el campo para dar profundidad */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />

        {/* Alineación 4-3-3 */}
        {[
          { id:  1, left: "7%",  top: "50%" },  // Portero
          { id:  2, left: "23%", top: "10%" },  // Lateral izq
          { id:  3, left: "25%", top: "34%" },  // Central izq
          { id:  4, left: "25%", top: "66%" },  // Central der
          { id:  5, left: "23%", top: "90%" },  // Lateral der
          { id:  6, left: "41%", top: "20%" },  // Medio izq
          { id:  7, left: "43%", top: "50%" },  // Medio centro
          { id:  8, left: "41%", top: "80%" },  // Medio der
          { id:  9, left: "63%", top: "16%" },  // Extremo izq
          { id: 10, left: "66%", top: "50%" },  // Delantero centro
          { id: 11, left: "63%", top: "84%" },  // Extremo der
        ].map(({ id, left, top }) => (
          <div
            key={id}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5"
            style={{ left, top }}
          >
            <div className="w-6 h-6 rounded-full bg-white/25 border-2 border-white/50 flex items-center justify-center shadow-md">
              <span className="text-white/80 text-[9px] font-black leading-none">{id}</span>
            </div>
            <div className="w-6 h-[13px] rounded-sm bg-white/15 border border-white/30" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 relative z-10">

        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/Escudo_losTercos.png"
            alt="Los Tercos"
            className="h-44 w-auto object-contain mb-4 drop-shadow-lg"
          />
          {serverReady ? (
            <p className="text-sm text-gray-500 mt-1">Quiniela de fútbol</p>
          ) : (
            <p className="text-sm mt-1 flex items-center gap-1.5 justify-center text-amber-500">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Iniciando servidor...
            </p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
            Correo
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
              ✉
            </span>
            <input
              className="w-full pl-9 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              type="email"
              autoComplete="email"
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
            Contraseña
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base select-none">
              🔒
            </span>
            <input
              className="w-full pl-9 pr-16 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 hover:text-green-600 transition-colors"
            >
              {showPassword ? "Ocultar" : "Ver"}
            </button>
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={iniciarSesion}
          disabled={loading}
          className="w-full py-3 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Ingresando..." : "Iniciar sesión ⚽"}
        </button>

        {mensaje && (
          <p className="mt-4 text-center text-sm font-medium text-red-500">{mensaje}</p>
        )}
      </div>
    </div>
  );
}

export default Login;

