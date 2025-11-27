import { useEffect, useState, useMemo } from 'react';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen, faPlus } from '@fortawesome/free-solid-svg-icons';

export default function AssignRoutinePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [routineSearch, setRoutineSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [routineDropdownOpen, setRoutineDropdownOpen] = useState(false);

  const fetchData = async () => {
    const resUsuarios = await api.get('/admin/users');
    const resRutinas = await api.get('/admin/routines');
    setUsuarios(resUsuarios.data);
    setRutinas(resRutinas.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.searchable-dropdown')) {
        setUserDropdownOpen(false);
        setRoutineDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtrar usuarios
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return usuarios;
    const search = userSearch.toLowerCase();
    return usuarios.filter(u => 
      u.nombre?.toLowerCase().includes(search) ||
      u.email?.toLowerCase().includes(search) ||
      u.telefono?.toLowerCase().includes(search)
    );
  }, [usuarios, userSearch]);

  // Filtrar rutinas
  const filteredRoutines = useMemo(() => {
    if (!routineSearch.trim()) return rutinas;
    const search = routineSearch.toLowerCase();
    return rutinas.filter(r => 
      r.nombre?.toLowerCase().includes(search) ||
      r.descripcion?.toLowerCase().includes(search)
    );
  }, [rutinas, routineSearch]);

  const selectedUser = usuarios.find(u => u.id.toString() === usuarioSeleccionado);
  const selectedRoutine = rutinas.find(r => r.id.toString() === rutinaSeleccionada);

  const selectUser = (user) => {
    setUsuarioSeleccionado(user.id.toString());
    setUserDropdownOpen(false);
    setUserSearch('');
  };

  const selectRoutine = (routine) => {
    setRutinaSeleccionada(routine.id.toString());
    setRoutineDropdownOpen(false);
    setRoutineSearch('');
  };

  const asignar = async () => {
    if (!usuarioSeleccionado || !rutinaSeleccionada) {
      alert('Selecciona un usuario y una rutina');
      return;
    }

    await api.post('/admin/users/assign-routine', {
      userId: usuarioSeleccionado,
      routineId: rutinaSeleccionada,
    });

    setMensaje('✅ Rutina asignada correctamente');
    fetchData(); 
  };

  const eliminarAsignacion = async (userId) => {
    await api.post('/admin/users/assign-routine', {
      userId,
      routineId: null,
    });
    fetchData();
  };

  return (
    <div className="container-xl mt-5 pt-4">
      <NavBar />

      <div className="card shadow-lg border-danger">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">📌 Asignar rutina a usuario</h5>
        </div>
        <div className="card-body bg-black text-white">
          <div className="row g-3">
            {/* User Dropdown */}
            <div className="col-md-6">
              <label className="form-label" style={{ color: '#aaa' }}>👤 Selecciona un usuario:</label>
              <div className="searchable-dropdown position-relative">
                <div
                  className="form-control bg-dark text-white border-danger d-flex align-items-center justify-content-between"
                  style={{ cursor: 'pointer', minHeight: '42px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setUserDropdownOpen(!userDropdownOpen);
                    setRoutineDropdownOpen(false);
                  }}
                >
                  {selectedUser ? (
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: '600' }}>{selectedUser.nombre}</span>
                      <span style={{ color: '#888', marginLeft: '8px' }}>({selectedUser.email})</span>
                    </div>
                  ) : (
                    <span style={{ color: '#888' }}>-- Elegir usuario --</span>
                  )}
                  <span style={{ marginLeft: '8px' }}>{userDropdownOpen ? '▲' : '▼'}</span>
                </div>

                {userDropdownOpen && (
                  <div 
                    className="position-absolute w-100 bg-dark border border-danger rounded-bottom shadow-lg"
                    style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto', top: '100%', left: 0 }}
                  >
                    <div className="p-2 border-bottom border-secondary sticky-top bg-dark">
                      <input
                        type="text"
                        className="form-control form-control-sm bg-secondary text-white border-0"
                        placeholder="🔍 Buscar por nombre, email o teléfono..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-center" style={{ color: '#888' }}>No se encontraron usuarios</div>
                    ) : (
                      filteredUsers.map(user => {
                        const isSelected = usuarioSeleccionado === user.id.toString();
                        return (
                          <div
                            key={user.id}
                            className={`px-3 py-2 ${isSelected ? 'bg-success' : ''}`}
                            style={{ cursor: 'pointer', borderBottom: '1px solid #333' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectUser(user);
                            }}
                            onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#333')}
                            onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = '')}
                          >
                            <div style={{ fontWeight: '600' }}>{user.nombre}</div>
                            <div style={{ fontSize: '12px', color: '#aaa' }}>
                              {user.email} {user.telefono && `• ${user.telefono}`}
                            </div>
                            {user.rutinaAsignadaId && (
                              <span className="badge bg-warning text-dark" style={{ fontSize: '10px' }}>
                                Ya tiene rutina
                              </span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <small style={{ color: '#666' }}>Busca por nombre, email o teléfono</small>
            </div>

            {/* Routine Dropdown */}
            <div className="col-md-6">
              <label className="form-label" style={{ color: '#aaa' }}>🏋️ Selecciona una rutina:</label>
              <div className="searchable-dropdown position-relative">
                <div
                  className="form-control bg-dark text-white border-danger d-flex align-items-center justify-content-between"
                  style={{ cursor: 'pointer', minHeight: '42px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRoutineDropdownOpen(!routineDropdownOpen);
                    setUserDropdownOpen(false);
                  }}
                >
                  {selectedRoutine ? (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '600' }}>
                      {selectedRoutine.nombre}
                    </span>
                  ) : (
                    <span style={{ color: '#888' }}>-- Elegir rutina --</span>
                  )}
                  <span style={{ marginLeft: '8px' }}>{routineDropdownOpen ? '▲' : '▼'}</span>
                </div>

                {routineDropdownOpen && (
                  <div 
                    className="position-absolute w-100 bg-dark border border-danger rounded-bottom shadow-lg"
                    style={{ zIndex: 1000, maxHeight: '300px', overflowY: 'auto', top: '100%', left: 0 }}
                  >
                    <div className="p-2 border-bottom border-secondary sticky-top bg-dark">
                      <input
                        type="text"
                        className="form-control form-control-sm bg-secondary text-white border-0"
                        placeholder="🔍 Buscar rutina por nombre..."
                        value={routineSearch}
                        onChange={(e) => setRoutineSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                      />
                    </div>
                    {filteredRoutines.length === 0 ? (
                      <div className="p-3 text-center" style={{ color: '#888' }}>No se encontraron rutinas</div>
                    ) : (
                      filteredRoutines.map(routine => {
                        const isSelected = rutinaSeleccionada === routine.id.toString();
                        const usersWithRoutine = usuarios.filter(u => u.rutinaAsignadaId === routine.id).length;
                        return (
                          <div
                            key={routine.id}
                            className={`px-3 py-2 ${isSelected ? 'bg-success' : ''}`}
                            style={{ cursor: 'pointer', borderBottom: '1px solid #333' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              selectRoutine(routine);
                            }}
                            onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = '#333')}
                            onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = '')}
                          >
                            <div style={{ fontWeight: '600' }}>{routine.nombre}</div>
                            {routine.descripcion && (
                              <div style={{ fontSize: '12px', color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {routine.descripcion}
                              </div>
                            )}
                            <span className="badge bg-secondary" style={{ fontSize: '10px' }}>
                              {usersWithRoutine} usuario{usersWithRoutine !== 1 ? 's' : ''}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
              <small style={{ color: '#666' }}>Busca por nombre o descripción</small>
            </div>
          </div>

          <div className="mt-4 text-end">
            <button className="btn btn-success btn-lg" onClick={asignar}>
              <FontAwesomeIcon icon={faPlus} className="me-2" color="white" /> Asignar rutina
            </button>
          </div>

          {mensaje && (
            <div className="alert alert-success mt-4" role="alert">
              {mensaje}
            </div>
          )}
        </div>
      </div>

      {/* 🗂️ Rutinas asignadas */}
      <div className="mt-5">
        <div className="card shadow-lg border-danger">
          <div className="card-header bg-dark text-white">
            <h5 className="mb-0">🗂️ Rutinas asignadas</h5>
          </div>
          <div className="card-body bg-black p-0">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr style={{ borderBottom: '2px solid #c20f0f' }}>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rutina asignada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios
                  .filter((u) => u.rutinaAsignadaId)
                  .map((u) => {
                    const rutina = rutinas.find((r) => r.id === u.rutinaAsignadaId);
                    return (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td style={{ color: '#aaa' }}>{u.email}</td>
                        <td>
                          <span className="badge bg-danger">{rutina ? rutina.nombre : 'Sin rutina'}</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger me-2"
                            onClick={() => eliminarAsignacion(u.id)}
                            title="Eliminar asignación"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                              setUsuarioSeleccionado(u.id.toString());
                              setRutinaSeleccionada(rutina?.id?.toString() || '');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            title="Editar asignación"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                {usuarios.filter((u) => u.rutinaAsignadaId).length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-4" style={{ color: '#666' }}>
                      No hay rutinas asignadas todavía
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
