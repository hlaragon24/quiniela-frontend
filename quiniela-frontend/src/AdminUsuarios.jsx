import { useEffect, useState } from "react";
import { API } from "./config/api";

function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creando, setCreando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState("jugador");

  const token = localStorage.getItem("token");

  const cargarUsuarios = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API}/usuarios`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "Error cargando usuarios");
        return;
      }

      setUsuarios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const limpiarFormulario = () => {
    setNombre("");
    setEmail("");
    setPassword("");
    setRol("jugador");
  };

  const crearUsuario = async () => {
    if (!nombre.trim() || !email.trim() || !password.trim() || !rol) {
      alert("Completa todos los campos");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      setCreando(true);

      const response = await fetch(`${API}/usuarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          email: email.trim().toLowerCase(),
          password,
          rol
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "Error creando usuario");
        return;
      }

      alert(data.mensaje || "Usuario creado correctamente");

      limpiarFormulario();
      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error de conexión creando usuario");
    } finally {
      setCreando(false);
    }
  };

  const cambiarRol = async (id, rolActual) => {
    const nuevoRol = rolActual === "admin" ? "jugador" : "admin";

    if (!window.confirm(`¿Cambiar rol a ${nuevoRol}?`)) return;

    try {
      const response = await fetch(`${API}/usuarios/${id}/rol`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          rol: nuevoRol
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "Error actualizando rol");
        return;
      }

      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  const cambiarEstado = async (id, activoActual) => {
    const accion = activoActual ? "desactivar" : "activar";

    if (!window.confirm(`¿Seguro que quieres ${accion} este usuario?`)) {
      return;
    }

    try {
      const response = await fetch(`${API}/usuarios/${id}/estado`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          activo: !activoActual
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "Error actualizando estado");
        return;
      }

      await cargarUsuarios();
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  const resetearPassword = async (id) => {
    const nuevaPassword = prompt("Nueva contraseña:");

    if (!nuevaPassword) return;

    if (nuevaPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    try {
      const response = await fetch(`${API}/usuarios/${id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          password: nuevaPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.mensaje || "Error actualizando contraseña");
        return;
      }

      alert("Contraseña actualizada");
    } catch (error) {
      console.error(error);
      alert("Error de conexión");
    }
  };

  return (
    <div>
      <h2>Administración de Usuarios 👥</h2>

      <div style={formContainer}>
        <h3 style={{ marginBottom: "10px" }}>Crear nuevo usuario</h3>

        <div style={formGrid}>
          <input
            placeholder="Nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <select
            value={rol}
            onChange={(e) => setRol(e.target.value)}
            style={inputStyle}
          >
            <option value="jugador">Jugador</option>
            <option value="admin">Admin</option>
          </select>

          <button
            onClick={crearUsuario}
            disabled={creando}
            style={{
              ...botonCrear,
              opacity: creando ? 0.6 : 1,
              cursor: creando ? "not-allowed" : "pointer"
            }}
          >
            {creando ? "Creando..." : "➕ Crear usuario"}
          </button>

          <button
            onClick={limpiarFormulario}
            style={botonGris}
          >
            Limpiar
          </button>
        </div>
      </div>

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table style={tabla}>
          <thead>
            <tr style={thead}>
              <th style={thtd}>ID</th>
              <th style={thtd}>Nombre</th>
              <th style={thtd}>Email</th>
              <th style={thtd}>Rol</th>
              <th style={thtd}>Estado</th>
              <th style={thtd}>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} style={fila}>
                <td style={thtd}>{u.id}</td>

                <td style={thtd}>{u.nombre}</td>

                <td style={thtd}>{u.email}</td>

                <td style={thtd}>
                  <span
                    style={{
                      background: u.rol === "admin" ? "#dc2626" : "#2563eb",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  >
                    {u.rol}
                  </span>
                </td>

                <td style={thtd}>
                  <span
                    style={{
                      background: u.activo ? "#16a34a" : "#6b7280",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "12px"
                    }}
                  >
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>

                <td style={thtd}>
                  <button
                    onClick={() => cambiarRol(u.id, u.rol)}
                    style={botonAzul}
                  >
                    Cambiar rol
                  </button>

                  <button
                    onClick={() => cambiarEstado(u.id, u.activo)}
                    style={u.activo ? botonRojo : botonVerde}
                  >
                    {u.activo ? "Desactivar" : "Activar"}
                  </button>

                  <button
                    onClick={() => resetearPassword(u.id)}
                    style={botonNaranja}
                  >
                    Reset password
                  </button>
                </td>
              </tr>
            ))}

            {usuarios.length === 0 && (
              <tr>
                <td style={thtd} colSpan="6">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

const formContainer = {
  marginBottom: "25px",
  padding: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "#f9fafb"
};

const formGrid = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  alignItems: "center"
};

const inputStyle = {
  padding: "8px",
  border: "1px solid #ccc",
  borderRadius: "6px"
};

const tabla = {
  width: "100%",
  borderCollapse: "collapse"
};

const thead = {
  background: "#f3f4f6"
};

const fila = {
  borderBottom: "1px solid #eee"
};

const thtd = {
  padding: "10px",
  border: "1px solid #ddd",
  textAlign: "left"
};

const botonCrear = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600"
};

const botonAzul = {
  background: "#2563eb",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "6px"
};

const botonRojo = {
  background: "#dc2626",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "6px"
};

const botonVerde = {
  background: "#16a34a",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  marginRight: "6px"
};

const botonNaranja = {
  background: "#ea580c",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer"
};

const botonGris = {
  background: "#6b7280",
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: "6px",
  cursor: "pointer"
};

export default AdminUsuarios;