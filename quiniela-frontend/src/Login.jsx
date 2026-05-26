import { useState } from "react";
import { API } from "./config/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async () => {
    if (!email || !password) {
      setMensaje("Ingresa email y password");
      return;
    }

    try {
      setCargando(true);
      setMensaje("");

      const response = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMensaje(data.mensaje || "Error al iniciar sesión");
        return;
      }

      if (!data.token || !data.usuario) {
        setMensaje("Respuesta inválida del servidor");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("nombre", data.usuario.nombre || "");
      localStorage.setItem("usuario_id", data.usuario.id);
      localStorage.setItem("rol", data.usuario.rol || data.usuario.role || "jugador");

      if (onLogin) onLogin(data.token);
    } catch (error) {
      console.error("Error login:", error);
      setMensaje("Error de conexión con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white shadow-lg rounded-xl p-8 w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">Login Quiniela ⚽</h2>

        <input
          className="border p-2 w-full mb-3 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-2 w-full mb-4 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") iniciarSesion();
          }}
        />

        <button
          onClick={iniciarSesion}
          disabled={cargando}
          className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {cargando ? "Entrando..." : "Iniciar sesión"}
        </button>

        {mensaje && <p className="text-red-500 text-sm mt-3 text-center">{mensaje}</p>}
      </div>
    </div>
  );
}

export default Login;
