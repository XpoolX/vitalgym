import { useEffect, useState, useMemo } from "react";
import api from "../api/axios";
import NavBar from "../components/NavBar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser as faUserRegular,
  faPenToSquare as faPenToSquareRegular,
  faTrashCan as faTrashCanRegular,
  faCircleDown as faCircleDownRegular,
  faCircleUp as faCircleUpRegular,
} from "@fortawesome/free-regular-svg-icons";
// <-- Añadido: import de iconos sólidos que faltaban
import {
  faLock as faLockSolid,
  faSave as faSaveSolid,
  faTimes as faTimesSolid,
} from "@fortawesome/free-solid-svg-icons";
import "./UserListPage.css";

export default function UserListPage() {
  const [usuarios, setUsuarios] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState({});
  const [nuevoUsuario, setNuevoUsuario] = useState({
    nombre: "",
    email: "",
    password: "",
    imagen: null,
    idLlave: "",
    direccion: "",
    telefono: "",
    username: "",
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [imagenEditada, setImagenEditada] = useState(null);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);

  const [busqueda, setBusqueda] = useState("");

  // Estado para ordenar
  const [sortConfig, setSortConfig] = useState({
    key: "nombre",
    direction: "asc",
  });

  const fetchUsuarios = async () => {
    try {
      const res = await api.get("/admin/users");
      setUsuarios(res.data);
    } catch (err) {
      console.error(err);
      alert("Error al cargar usuarios");
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const eliminar = async (id) => {
    if (!confirm("¿Seguro que quieres eliminar este usuario?")) return;
    await api.delete(`/admin/users/${id}`);
    fetchUsuarios();
  };

  const toggleEstado = async (id) => {
    await api.patch(`/admin/users/${id}/toggle-status`);
    fetchUsuarios();
  };

  const iniciarEdicion = (usuario) => {
    setEditandoId(usuario.id);
    setFormulario({
      nombre: usuario.nombre ?? "",
      email: usuario.email ?? "",
      idLlave: usuario.idLlave ?? "",
      direccion: usuario.direccion ?? "",
      telefono: usuario.telefono ?? "",
      username: usuario.username ?? "",
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormulario({});
    setImagenEditada(null);
  };

  const actualizar = async (id) => {
    try {
      const formData = new FormData();
      formData.append("nombre", formulario.nombre);
      formData.append("email", formulario.email);
      formData.append("idLlave", formulario.idLlave ?? "");
      formData.append("direccion", formulario.direccion ?? "");
      formData.append("telefono", formulario.telefono ?? "");
      formData.append("username", formulario.username ?? "");
      if (formulario.password) formData.append("password", formulario.password);
      if (imagenEditada) formData.append("imagen", imagenEditada);

      await api.put(`/admin/users/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      cancelarEdicion();
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      alert("Error al actualizar usuario");
    }
  };

  const crearUsuario = async () => {
    try {
      const formData = new FormData();
      formData.append("nombre", nuevoUsuario.nombre);
      formData.append("email", nuevoUsuario.email);
      formData.append("password", nuevoUsuario.password);
      formData.append("idLlave", nuevoUsuario.idLlave ?? "");
      formData.append("direccion", nuevoUsuario.direccion ?? "");
      formData.append("telefono", nuevoUsuario.telefono ?? "");
      formData.append("username", nuevoUsuario.username ?? "");
      if (nuevoUsuario.imagen) formData.append("imagen", nuevoUsuario.imagen);

      await api.post("/admin/users", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNuevoUsuario({
        nombre: "",
        email: "",
        password: "",
        imagen: null,
        idLlave: "",
        direccion: "",
        telefono: "",
        username: "",
      });
      setMostrarFormulario(false);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      alert("Error al crear usuario");
    }
  };

  // Abrir prompt para cambiar contraseña (simple, evita UI extra)
  const changePasswordPrompt = async (id) => {
    const pwd = window.prompt(
      "Introduce la nueva contraseña (mínimo 6 caracteres):"
    );
    if (pwd === null) return; // cancelado
    if (typeof pwd !== "string" || pwd.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    try {
      await api.patch(`/admin/users/${id}/password`, { password: pwd });
      alert("Contraseña actualizada.");
    } catch (err) {
      console.error(err);
      alert("Error al cambiar la contraseña");
    }
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const usuariosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const filtrados = usuarios.filter(
      (u) =>
        !q ||
        (u.nombre && u.nombre.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.username && u.username.toLowerCase().includes(q)) ||
        (u.direccion && u.direccion.toLowerCase().includes(q)) ||
        (u.telefono && u.telefono.toLowerCase().includes(q)) ||
        (u.idLlave && u.idLlave.toString().toLowerCase().includes(q))
    );

    const { key, direction } = sortConfig;
    const sorted = [...filtrados].sort((a, b) => {
      const aVal = (a[key] ?? "").toString().toLowerCase();
      const bVal = (b[key] ?? "").toString().toLowerCase();
      if (aVal < bVal) return direction === "asc" ? -1 : 1;
      if (aVal > bVal) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [usuarios, busqueda, sortConfig]);

  const renderSortIndicator = (colKey) => {
    if (sortConfig.key !== colKey) return null;
    return sortConfig.direction === "asc" ? " ▲" : " ▼";
  };

  return (
    <div className="container-xl mt-4">
      <NavBar />
      <div className="table-header">
        <div className="header-inner">
          <div className="title-group">
            <div className="emoji">👥</div>
            <h1 className="page-title">Usuarios</h1>
          </div>

          <div className="center-controls">
            <input
              className="search-input"
              placeholder="Buscar por nombre, email, ID llave, dirección, teléfono o usuario"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar usuarios"
            />
          </div>

          <div className="right-controls">
            <button
              className="btn btn-create"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              aria-expanded={mostrarFormulario}
            >
              <FontAwesomeIcon icon={faUserRegular} />{" "}
              {mostrarFormulario ? "Cerrar formulario" : "Crear nuevo usuario"}
            </button>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="mb-4">
          <div className="card card-body">
            <input
              type="text"
              placeholder="Nombre"
              className="form-control mb-2"
              value={nuevoUsuario.nombre}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Nombre de usuario"
              className="form-control mb-2"
              value={nuevoUsuario.username}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })
              }
            />
            <input
              type="email"
              placeholder="Email"
              className="form-control mb-2"
              value={nuevoUsuario.email}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
              }
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="form-control mb-2"
              value={nuevoUsuario.password}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
              }
            />
            <input
              type="file"
              className="form-control mb-2"
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, imagen: e.target.files[0] })
              }
            />
            <input
              type="text"
              placeholder="ID Llave"
              className="form-control mb-2"
              value={nuevoUsuario.idLlave}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, idLlave: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Dirección"
              className="form-control mb-2"
              value={nuevoUsuario.direccion}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, direccion: e.target.value })
              }
            />
            <input
              type="text"
              placeholder="Teléfono"
              className="form-control mb-2"
              value={nuevoUsuario.telefono}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })
              }
            />
            <button className="btn btn-success" onClick={crearUsuario}>
              ✅ Crear
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table users-table">
          <thead className="table-dark">
            <tr>
              <th style={{ width: "8%" }}>Foto</th>
              <th
                style={{ width: "25%", cursor: "pointer" }}
                onClick={() => handleSort("nombre")}
              >
                Nombre{renderSortIndicator("nombre")}
              </th>
              <th
                style={{ width: "12%", cursor: "pointer" }}
                onClick={() => handleSort("username")}
              >
                Usuario{renderSortIndicator("username")}
              </th>
              <th
                style={{ width: "22%", cursor: "pointer" }}
                onClick={() => handleSort("email")}
              >
                Email{renderSortIndicator("email")}
              </th>
              <th
                style={{ width: "8%", cursor: "pointer" }}
                onClick={() => handleSort("idLlave")}
              >
                Nº llave{renderSortIndicator("idLlave")}
              </th>
              <th
                style={{ width: "17%", cursor: "pointer" }}
                onClick={() => handleSort("direccion")}
              >
                Dirección{renderSortIndicator("direccion")}
              </th>
              <th
                style={{ width: "8%", cursor: "pointer" }}
                onClick={() => handleSort("telefono")}
              >
                Teléfono{renderSortIndicator("telefono")}
              </th>
              <th style={{ width: "10%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosVisibles.map((u) => {
              const filaClass = u.estado === "ALTA" ? "row-alta" : "row-baja";
              return (
                <tr key={u.id} className={filaClass}>
                  <td className="text-center">
                    {editandoId === u.id ? (
                      <input
                        type="file"
                        className="form-control mb-2"
                        onChange={(e) => setImagenEditada(e.target.files[0])}
                      />
                    ) : (
                      <span className="d-block mb-2"></span>
                    )}
                    {u.imagenUrl ? (
                      <img
                        src={`https://vitalgym.fit${u.imagenUrl}`}
                        alt={u.nombre}
                        className="small-avatar"
                        onClick={() =>
                          setImagenAmpliada(
                            `https://vitalgym.fit${u.imagenUrl}`
                          )
                        }
                      />
                    ) : (
                      <div className="small-avatar placeholder">
                        {(u.nombre || "U").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </td>

                  <td>
                    {editandoId === u.id ? (
                      <input
                        className="form-control"
                        value={formulario.nombre}
                        onChange={(e) =>
                          setFormulario({
                            ...formulario,
                            nombre: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="cell-name">{u.nombre}</div>
                    )}
                  </td>

                  <td>
                    {editandoId === u.id ? (
                      <input
                        className="form-control"
                        value={formulario.username}
                        onChange={(e) =>
                          setFormulario({
                            ...formulario,
                            username: e.target.value,
                          })
                        }
                      />
                    ) : (
                      u.username ?? ""
                    )}
                  </td>

                  <td>
                    {editandoId === u.id ? (
                      <input
                        className="form-control"
                        value={formulario.email}
                        onChange={(e) =>
                          setFormulario({
                            ...formulario,
                            email: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="cell-muted">{u.email}</div>
                    )}
                  </td>

                  <td className="text-center">
                    {editandoId === u.id ? (
                      <input
                        className="form-control"
                        value={formulario.idLlave}
                        onChange={(e) =>
                          setFormulario({
                            ...formulario,
                            idLlave: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div>{u.idLlave ?? "—"}</div>
                    )}
                  </td>

                  <td>
                    {editandoId === u.id ? (
                      <input
                        className="form-control"
                        value={formulario.direccion}
                        onChange={(e) =>
                          setFormulario({
                            ...formulario,
                            direccion: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="cell-muted">{u.direccion ?? "—"}</div>
                    )}
                  </td>

                  <td className="text-center">
                    {editandoId === u.id ? (
                      <input
                        className="form-control"
                        value={formulario.telefono}
                        onChange={(e) =>
                          setFormulario({
                            ...formulario,
                            telefono: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="cell-muted">{u.telefono ?? "—"}</div>
                    )}
                  </td>

                  <td className="text-center td-actions">
                    {editandoId === u.id ? (
                      <div className="inline-edit-actions">
                        <button
                          className="btn btn-save"
                          onClick={() => actualizar(u.id)}
                        >
                          <FontAwesomeIcon icon={faSaveSolid} /> Guardar
                        </button>
                        <button
                          className="btn btn-cancel"
                          onClick={cancelarEdicion}
                        >
                          <FontAwesomeIcon icon={faTimesSolid} /> Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="actions-group">
                        <div className="main-actions">
                          <button
                            className="btn btn-icon"
                            title="Editar"
                            onClick={() => iniciarEdicion(u)}
                          >
                            <FontAwesomeIcon icon={faPenToSquareRegular} />
                          </button>
                          <button
                            className="btn btn-icon btn-danger"
                            title="Eliminar"
                            onClick={() => eliminar(u.id)}
                          >
                            <FontAwesomeIcon icon={faTrashCanRegular} />
                          </button>
                          <button
                            className={`btn btn-icon ${
                              u.estado === "ALTA"
                                ? "btn-outline-danger"
                                : "btn-outline-success"
                            }`}
                            title={
                              u.estado === "ALTA"
                                ? "Dar de baja"
                                : "Dar de alta"
                            }
                            onClick={() => toggleEstado(u.id)}
                          >
                            <FontAwesomeIcon
                              icon={
                                u.estado === "ALTA"
                                  ? faCircleDownRegular
                                  : faCircleUpRegular
                              }
                            />
                          </button>
                          {/* candado al lado de los iconos */}
                          <button
                            className="btn btn-icon btn-warning"
                            title="Cambiar contraseña"
                            onClick={() => changePasswordPrompt(u.id)}
                          >
                            <FontAwesomeIcon icon={faLockSolid} />
                          </button>
                        </div>
                        <div className="secondary-action">
                          {/* dejar espacio para acciones secundarias si quieres */}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {imagenAmpliada && (
          <div
            onClick={() => setImagenAmpliada(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <img
              src={imagenAmpliada}
              alt="Imagen ampliada"
              style={{
                maxHeight: "80%",
                maxWidth: "80%",
                borderRadius: "10px",
                boxShadow: "0 0 20px white",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
