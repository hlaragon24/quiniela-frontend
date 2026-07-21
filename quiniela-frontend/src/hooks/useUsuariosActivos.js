import { useState, useEffect } from "react";
import { API, apiFetch } from "../config/api";

export function useUsuariosActivos() {
  const [usuariosActivos, setUsuariosActivos] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const fetch = () => {
      apiFetch(`${API}/usuarios/activos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((d) => { if (Array.isArray(d)) setUsuariosActivos(d); })
        .catch(() => {});
    };
    fetch();
    const id = setInterval(fetch, 30_000);
    return () => clearInterval(id);
  }, []);

  return usuariosActivos;
}
