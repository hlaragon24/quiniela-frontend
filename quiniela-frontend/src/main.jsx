import React from "react";
import ReactDOM from "react-dom/client";

import Login from "./Login";
import App from "./App";
import AdminResultados from "./AdminResultados";
import AdminOrganizador from "./AdminOrganizador";

import { useState, useEffect, useCallback } from "react";
import { setOnUnauthorized } from "./config/api";
import { API } from "./config/api";

import "./index.css";

function Root() {

  const token = localStorage.getItem("token");

  const [sesionActiva, setSesionActiva] = useState(token);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombre");
    localStorage.removeItem("usuario_id");
    setSesionActiva(null);
  }, []);

  setOnUnauthorized(cerrarSesion);

  // Ping al backend cada 2 min para registrar presencia (activos en tiempo real)
  useEffect(() => {
    if (!sesionActiva) return;
    const ping = () => {
      const t = localStorage.getItem("token");
      if (!t) return;
      fetch(`${API}/usuarios/ping`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}` },
      }).catch(() => {});
    };
    ping();
    const id = setInterval(ping, 2 * 60_000);
    return () => clearInterval(id);
  }, [sesionActiva]);

  useEffect(() => {
    const checkExpiry = () => {
      const t = localStorage.getItem("token");
      if (!t) return;
      try {
        const { exp } = JSON.parse(atob(t.split(".")[1]));
        if (exp && Date.now() / 1000 > exp) cerrarSesion();
      } catch {
        cerrarSesion();
      }
    };
    checkExpiry();
    const id = setInterval(checkExpiry, 60_000);
    return () => clearInterval(id);
  }, [cerrarSesion]);

  if (!sesionActiva) {

    return <Login onLogin={setSesionActiva} />;

  }


  // detectar rol admin desde token

  let payload = {};

  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch (error) {
    console.error("Token inválido:", error);
    localStorage.removeItem("token");
    return <Login onLogin={setSesionActiva} />;
  }

  const esAdmin = payload.rol === "admin";


if (esAdmin) {
  return <AdminResultados onLogout={cerrarSesion} />;
}

if (payload.rol === "organizer") {
  return <AdminOrganizador onLogout={cerrarSesion} />;
}


  return <App onLogout={cerrarSesion} />;

}

ReactDOM.createRoot(document.getElementById("root"))
.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);