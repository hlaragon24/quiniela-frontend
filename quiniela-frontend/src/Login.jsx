import { useState } from "react";

function Login({ onLogin }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async () => {

    try {

      const response = await fetch(
        "https://quiniela-app-rq9c.onrender.com/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      // validar respuesta backend
      if (!response.ok) {

        setMensaje(data.mensaje || "Error al iniciar sesión");
        return;

      }

      // validar token
      if (!data.token) {

        setMensaje("No se recibió token");
        return;

      }

      // validar usuario
      if (!data.usuario) {

        setMensaje("No se recibió información del usuario");
        return;

      }

      // guardar sesión correctamente
      localStorage.setItem("token", data.token);
      localStorage.setItem("nombre", data.usuario.nombre);
      localStorage.setItem("usuario_id", data.usuario.id);

      // 🔴 ESTA ES LA LÍNEA CLAVE PARA ADMIN
      localStorage.setItem("rol", data.usuario.rol || "jugador");

      // debug opcional (puedes quitar después)
      console.log("ROL GUARDADO:", data.usuario.rol);

      // actualizar estado global
      if (onLogin) {

        onLogin(data.token);

      }

    }

    catch (error) {

      console.error("Error login:", error);

      setMensaje("Error de conexión con el servidor");

    }

  };


  return (

    <div className="flex flex-col items-center justify-center min-h-screen">

      <div className="bg-white shadow-lg rounded-xl p-8 w-80">

        <h2 className="text-2xl font-bold mb-4 text-center">

          Login Quiniela ⚽

        </h2>


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
        />


        <button
          onClick={iniciarSesion}
          className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-600"
        >

          Iniciar sesión

        </button>


        {mensaje && (

          <p className="text-red-500 text-sm mt-3 text-center">

            {mensaje}

          </p>

        )}

      </div>

    </div>

  );

}

export default Login;