import React from "react";
import ReactDOM from "react-dom/client";

import Login from "./Login";
import App from "./App";
import AdminResultados from "./AdminResultados";
import AdminOrganizador from "./AdminOrganizador";

import { useState } from "react";
import { setOnUnauthorized } from "./config/api";

import "./index.css";

function Root() {

  const token = localStorage.getItem("token");

  const [sesionActiva, setSesionActiva] = useState(token);

  const cerrarSesion = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombre");
    localStorage.removeItem("usuario_id");

    setSesionActiva(null);

  };

  setOnUnauthorized(cerrarSesion);

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