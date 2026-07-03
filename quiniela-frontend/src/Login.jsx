import { useState } from "react";
import { API } from "./config/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 via-emerald-700 to-[#0d1f3c] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">

        {/* Logo y título */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Los Tercos"
            className="h-20 w-auto object-contain mb-3 drop-shadow-md"
          />
          <h1 className="text-2xl font-bold text-gray-900">Los Tercos</h1>
          <p className="text-sm text-gray-500 mt-1">Quiniela de fútbol</p>
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
