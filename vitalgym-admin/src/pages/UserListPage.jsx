import React, { useEffect, useState, useMemo, useCallback } from "react";
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
import {
  faLock as faLockSolid,
  faSave as faSaveSolid,
  faTimes as faTimesSolid,
  faChevronDown as faChevronDownSolid,
  faChevronUp as faChevronUpSolid,
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
    telefono: "",
    username: "",
    calle: "",
    codigoPostal: "",
    piso: "",
    puerta: "",
    poblacion: "",
    formaPago: "",
    diaPago: "",
    fechaNacimiento: "",
    observaciones: "",
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [imagenEditada, setImagenEditada] = useState(null);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [expandidoId, setExpandidoId] = useState(null);
  const [userStats, setUserStats] = useState({});
  const [loadingStats, setLoadingStats] = useState({});

  const [busqueda, setBusqueda] = useState("");

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

  const fetchUserStats = useCallback(async (userId) => {
    if (userStats[userId] || loadingStats[userId]) return;
    
    setLoadingStats(prev => ({ ...prev, [userId]: true }));
    try {
      const res = await api.get(`/admin/users/${userId}/stats`);
      setUserStats(prev => ({ ...prev, [userId]: res.data }));
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setLoadingStats(prev => ({ ...prev, [userId]: false }));
    }
  }, [userStats, loadingStats]);

  const toggleExpandido = (userId) => {
    if (expandidoId === userId) {
      setExpandidoId(null);
    } else {
      setExpandidoId(userId);
      fetchUserStats(userId);
    }
  };

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
    setExpandidoId(usuario.id);
    fetchUserStats(usuario.id);
    setFormulario({
      nombre: usuario.nombre ?? "",
      email: usuario.email ?? "",
      idLlave: usuario.idLlave ?? "",
      telefono: usuario.telefono ?? "",
      username: usuario.username ?? "",
      calle: usuario.calle ?? "",
      codigoPostal: usuario.codigoPostal ?? "",
      piso: usuario.piso ?? "",
      puerta: usuario.puerta ?? "",
      poblacion: usuario.poblacion ?? "",
      formaPago: usuario.formaPago ?? "",
      diaPago: usuario.diaPago ?? "",
      fechaNacimiento: usuario.fechaNacimiento ? usuario.fechaNacimiento.split('T')[0] : "",
      observaciones: usuario.observaciones ?? "",
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
      formData.append("telefono", formulario.telefono ?? "");
      formData.append("username", formulario.username ?? "");
      formData.append("calle", formulario.calle ?? "");
      formData.append("codigoPostal", formulario.codigoPostal ?? "");
      formData.append("piso", formulario.piso ?? "");
      formData.append("puerta", formulario.puerta ?? "");
      formData.append("poblacion", formulario.poblacion ?? "");
      formData.append("formaPago", formulario.formaPago ?? "");
      formData.append("diaPago", formulario.diaPago ?? "");
      formData.append("fechaNacimiento", formulario.fechaNacimiento ?? "");
      formData.append("observaciones", formulario.observaciones ?? "");
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
      formData.append("telefono", nuevoUsuario.telefono ?? "");
      formData.append("username", nuevoUsuario.username ?? "");
      formData.append("calle", nuevoUsuario.calle ?? "");
      formData.append("codigoPostal", nuevoUsuario.codigoPostal ?? "");
      formData.append("piso", nuevoUsuario.piso ?? "");
      formData.append("puerta", nuevoUsuario.puerta ?? "");
      formData.append("poblacion", nuevoUsuario.poblacion ?? "");
      formData.append("formaPago", nuevoUsuario.formaPago ?? "");
      formData.append("diaPago", nuevoUsuario.diaPago ?? "");
      formData.append("fechaNacimiento", nuevoUsuario.fechaNacimiento ?? "");
      formData.append("observaciones", nuevoUsuario.observaciones ?? "");
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
        telefono: "",
        username: "",
        calle: "",
        codigoPostal: "",
        piso: "",
        puerta: "",
        poblacion: "",
        formaPago: "",
        diaPago: "",
        fechaNacimiento: "",
        observaciones: "",
      });
      setMostrarFormulario(false);
      fetchUsuarios();
    } catch (err) {
      console.error(err);
      alert("Error al crear usuario");
    }
  };

  const changePasswordPrompt = async (id) => {
    const pwd = window.prompt(
      "Introduce la nueva contraseña (mínimo 6 caracteres):"
    );
    if (pwd === null) return;
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
        (u.poblacion && u.poblacion.toLowerCase().includes(q)) ||
        (u.calle && u.calle.toLowerCase().includes(q)) ||
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

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
              placeholder="Buscar por nombre, email, usuario, población, calle, teléfono o Nº llave"
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
          <div className="card card-body create-form">
            <h3 className="form-section-title">Datos básicos</h3>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Nombre completo"
                className="form-control"
                value={nuevoUsuario.nombre}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Nombre de usuario"
                className="form-control"
                value={nuevoUsuario.username}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, username: e.target.value })
                }
              />
              <input
                type="email"
                placeholder="Email"
                className="form-control"
                value={nuevoUsuario.email}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="Contraseña"
                className="form-control"
                value={nuevoUsuario.password}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Teléfono"
                className="form-control"
                value={nuevoUsuario.telefono}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Nº Llave"
                className="form-control"
                value={nuevoUsuario.idLlave}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, idLlave: e.target.value })
                }
              />
              <input
                type="date"
                placeholder="Fecha de nacimiento"
                className="form-control"
                value={nuevoUsuario.fechaNacimiento}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, fechaNacimiento: e.target.value })
                }
              />
              <input
                type="file"
                className="form-control"
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, imagen: e.target.files[0] })
                }
              />
            </div>

            <h3 className="form-section-title">Dirección</h3>
            <div className="form-grid">
              <input
                type="text"
                placeholder="Calle y número"
                className="form-control form-control-wide"
                value={nuevoUsuario.calle}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, calle: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Código Postal"
                className="form-control"
                value={nuevoUsuario.codigoPostal}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, codigoPostal: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Piso"
                className="form-control"
                value={nuevoUsuario.piso}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, piso: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Puerta"
                className="form-control"
                value={nuevoUsuario.puerta}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, puerta: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Población"
                className="form-control"
                value={nuevoUsuario.poblacion}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, poblacion: e.target.value })
                }
              />
            </div>

            <h3 className="form-section-title">Pago</h3>
            <div className="form-grid">
              <select
                className="form-control"
                value={nuevoUsuario.formaPago}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, formaPago: e.target.value })
                }
              >
                <option value="">Forma de pago</option>
                <option value="domiciliado">Domiciliado</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
              <input
                type="number"
                placeholder="Día de pago (1-31)"
                className="form-control"
                min="1"
                max="31"
                value={nuevoUsuario.diaPago}
                onChange={(e) =>
                  setNuevoUsuario({ ...nuevoUsuario, diaPago: e.target.value })
                }
              />
            </div>

            <h3 className="form-section-title">Observaciones</h3>
            <textarea
              placeholder="Observaciones o notas adicionales"
              className="form-control"
              rows="3"
              value={nuevoUsuario.observaciones}
              onChange={(e) =>
                setNuevoUsuario({ ...nuevoUsuario, observaciones: e.target.value })
              }
            />

            <button className="btn btn-success mt-3" onClick={crearUsuario}>
              ✅ Crear Usuario
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
                style={{ width: "28%", cursor: "pointer" }}
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
                style={{ width: "10%", cursor: "pointer" }}
                onClick={() => handleSort("telefono")}
              >
                Teléfono{renderSortIndicator("telefono")}
              </th>
              <th style={{ width: "12%" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosVisibles.map((u) => {
              const filaClass = u.estado === "ALTA" ? "row-alta" : "row-baja";
              const isExpanded = expandidoId === u.id;
              const isEditing = editandoId === u.id;
              const stats = userStats[u.id];
              
              return (
                <React.Fragment key={u.id}>
                  <tr 
                    className={`${filaClass} ${isExpanded ? 'row-expanded' : ''}`}
                    onClick={() => !isEditing && toggleExpandido(u.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setImagenAmpliada(`https://vitalgym.fit${u.imagenUrl}`);
                          }}
                        />
                      ) : (
                        <div className="small-avatar placeholder">
                          {(u.nombre || "U").slice(0, 1).toUpperCase()}
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="name-cell">
                        {isEditing ? (
                          <input
                            className="form-control"
                            value={formulario.nombre}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              setFormulario({
                                ...formulario,
                                nombre: e.target.value,
                              })
                            }
                          />
                        ) : (
                          <>
                            <span className="cell-name">{u.nombre}</span>
                            <FontAwesomeIcon 
                              icon={isExpanded ? faChevronUpSolid : faChevronDownSolid} 
                              className="expand-icon"
                            />
                          </>
                        )}
                      </div>
                    </td>

                    <td onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
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

                    <td onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
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

                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
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

                    <td className="text-center" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
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

                    <td className="text-center td-actions" onClick={(e) => e.stopPropagation()}>
                      {isEditing ? (
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
                            <button
                              className="btn btn-icon btn-warning"
                              title="Cambiar contraseña"
                              onClick={() => changePasswordPrompt(u.id)}
                            >
                              <FontAwesomeIcon icon={faLockSolid} />
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {isExpanded && (
                    <tr className="user-details-row">
                      <td colSpan="7">
                        <div className="user-details-panel">
                          <div className="details-grid">
                            <div className="details-section">
                              <h4 className="section-title">📍 Dirección</h4>
                              <div className="details-content">
                                {isEditing ? (
                                  <div className="edit-grid">
                                    <div className="edit-field">
                                      <label>Calle y número</label>
                                      <input
                                        className="form-control"
                                        value={formulario.calle}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, calle: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="edit-field">
                                      <label>Código Postal</label>
                                      <input
                                        className="form-control"
                                        value={formulario.codigoPostal}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, codigoPostal: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="edit-field">
                                      <label>Piso</label>
                                      <input
                                        className="form-control"
                                        value={formulario.piso}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, piso: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="edit-field">
                                      <label>Puerta</label>
                                      <input
                                        className="form-control"
                                        value={formulario.puerta}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, puerta: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="edit-field">
                                      <label>Población</label>
                                      <input
                                        className="form-control"
                                        value={formulario.poblacion}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, poblacion: e.target.value })
                                        }
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="info-list">
                                    <div className="info-item">
                                      <span className="info-label">Calle:</span>
                                      <span className="info-value">{u.calle || "—"}</span>
                                    </div>
                                    <div className="info-item">
                                      <span className="info-label">C.P.:</span>
                                      <span className="info-value">{u.codigoPostal || "—"}</span>
                                    </div>
                                    <div className="info-item">
                                      <span className="info-label">Piso:</span>
                                      <span className="info-value">{u.piso || "—"}</span>
                                    </div>
                                    <div className="info-item">
                                      <span className="info-label">Puerta:</span>
                                      <span className="info-value">{u.puerta || "—"}</span>
                                    </div>
                                    <div className="info-item">
                                      <span className="info-label">Población:</span>
                                      <span className="info-value">{u.poblacion || "—"}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="details-section">
                              <h4 className="section-title">💳 Información de Pago</h4>
                              <div className="details-content">
                                {isEditing ? (
                                  <div className="edit-grid">
                                    <div className="edit-field">
                                      <label>Forma de pago</label>
                                      <select
                                        className="form-control"
                                        value={formulario.formaPago}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, formaPago: e.target.value })
                                        }
                                      >
                                        <option value="">Seleccionar...</option>
                                        <option value="domiciliado">Domiciliado</option>
                                        <option value="efectivo">Efectivo</option>
                                        <option value="tarjeta">Tarjeta</option>
                                      </select>
                                    </div>
                                    <div className="edit-field">
                                      <label>Día de pago</label>
                                      <input
                                        type="number"
                                        className="form-control"
                                        min="1"
                                        max="31"
                                        value={formulario.diaPago}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, diaPago: e.target.value })
                                        }
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="info-list">
                                    <div className="info-item">
                                      <span className="info-label">Forma de pago:</span>
                                      <span className="info-value">
                                        {u.formaPago === 'domiciliado' ? '🏦 Domiciliado' :
                                         u.formaPago === 'efectivo' ? '💵 Efectivo' : 
                                         u.formaPago === 'tarjeta' ? '💳 Tarjeta' : '—'}
                                      </span>
                                    </div>
                                    <div className="info-item">
                                      <span className="info-label">Día de pago:</span>
                                      <span className="info-value">
                                        {u.diaPago ? `Día ${u.diaPago} de cada mes` : '—'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="details-section">
                              <h4 className="section-title">📋 Datos Adicionales</h4>
                              <div className="details-content">
                                {isEditing ? (
                                  <div className="edit-grid">
                                    <div className="edit-field">
                                      <label>Fecha de nacimiento</label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={formulario.fechaNacimiento}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, fechaNacimiento: e.target.value })
                                        }
                                      />
                                    </div>
                                    <div className="edit-field full-width">
                                      <label>Observaciones</label>
                                      <textarea
                                        className="form-control"
                                        rows="2"
                                        value={formulario.observaciones}
                                        onChange={(e) =>
                                          setFormulario({ ...formulario, observaciones: e.target.value })
                                        }
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="info-list">
                                    <div className="info-item">
                                      <span className="info-label">Fecha de nacimiento:</span>
                                      <span className="info-value">{formatDateOnly(u.fechaNacimiento)}</span>
                                    </div>
                                    <div className="info-item full-width">
                                      <span className="info-label">Observaciones:</span>
                                      <span className="info-value">{u.observaciones || "—"}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="details-section stats-section">
                              <h4 className="section-title">📊 Estadísticas</h4>
                              <div className="details-content">
                                {loadingStats[u.id] ? (
                                  <div className="loading-stats">Cargando estadísticas...</div>
                                ) : stats ? (
                                  <div className="stats-grid">
                                    <div className="stat-card">
                                      <div className="stat-icon">🕐</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Última sesión</span>
                                        <span className="stat-value">{formatDate(stats.ultimaSesion)}</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">🚪</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Última apertura</span>
                                        <span className="stat-value">{formatDate(stats.ultimaApertura)}</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">📅</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Entrenos esta semana</span>
                                        <span className="stat-value">{stats.entrenosSemana}</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">📆</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Entrenos este mes</span>
                                        <span className="stat-value">{stats.entrenosMes}</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">🗓️</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Entrenos este año</span>
                                        <span className="stat-value">{stats.entrenosAnio}</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">📈</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Promedio semanal</span>
                                        <span className="stat-value">{stats.promedioSemanal} / semana</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">🔥</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Racha actual</span>
                                        <span className="stat-value">{stats.rachaActual} días</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">💪</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Total entrenos</span>
                                        <span className="stat-value">{stats.totalEntrenos}</span>
                                      </div>
                                    </div>
                                    <div className="stat-card">
                                      <div className="stat-icon">📝</div>
                                      <div className="stat-info">
                                        <span className="stat-label">Fecha de registro</span>
                                        <span className="stat-value">{formatDateOnly(stats.fechaRegistro)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="no-stats">No hay estadísticas disponibles</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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
