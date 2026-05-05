import React from "react";
import ReactDOM from "react-dom/client";

import Login from "./Login";
import Quiniela from "./Quiniela";
import AdminResultados from "./AdminResultados";

import { useState } from "react";

import "./index.css";

function Root() {

  const token = localStorage.getItem("token");

  const [sesionActiva, setSesionActiva] = useState(token);

  const cerrarSesion = () => {

    localStorage.removeItem("token");

    setSesionActiva(null);

  };

  if (!sesionActiva) {

    return <Login onLogin={setSesionActiva} />;

  }


  // detectar rol admin desde token

  const payload = JSON.parse(
    atob(token.split(".")[1])
  );

  const esAdmin = payload.rol === "admin";


if (esAdmin) {
  return <AdminResultados onLogout={cerrarSesion} />;
}


  return <Quiniela onLogout={cerrarSesion} />;

}

ReactDOM.createRoot(document.getElementById("root"))
.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);