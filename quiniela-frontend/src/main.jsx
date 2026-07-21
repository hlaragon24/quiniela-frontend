import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import Login from "./Login";
import App from "./App";
import AdminResultados from "./AdminResultados";
import AdminOrganizador from "./AdminOrganizador";

import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { setOnUnauthorized } from "./config/api";
import { API } from "./config/api";

import "./index.css";

// Componente que protege rutas según el rol esperado
function RequireRole({ rol, children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (payload.rol !== rol) return <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/" replace />;
  }
  return children;
}

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

  // S-07: setOnUnauthorized en efecto, no en el cuerpo del render
  useEffect(() => {
    setOnUnauthorized(cerrarSesion);
  }, [cerrarSesion]);

  // Ping al backend cada 2 min para registrar presencia
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

  // Expiración de sesión
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

  if (!sesionActiva) return <Login onLogin={setSesionActiva} />;

  // A-01: detectar rol y renderizar la UI correcta con protección real
  let payload = {};
  try {
    payload = JSON.parse(atob(token.split(".")[1]));
  } catch {
    localStorage.removeItem("token");
    return <Login onLogin={setSesionActiva} />;
  }

  if (payload.rol === "admin") {
    return (
      <RequireRole rol="admin">
        <AdminResultados onLogout={cerrarSesion} />
      </RequireRole>
    );
  }

  if (payload.rol === "organizer") {
    return (
      <RequireRole rol="organizer">
        <AdminOrganizador onLogout={cerrarSesion} />
      </RequireRole>
    );
  }

  return <App onLogout={cerrarSesion} />;
}

ReactDOM.createRoot(document.getElementById("root"))
.render(
  <React.StrictMode>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </React.StrictMode>
);