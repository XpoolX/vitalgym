import { useEffect, useState } from 'react';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faPen, faPlus } from '@fortawesome/free-solid-svg-icons'; // 👈 Sólidos (planos)

export default function AssignRoutinePage() {
  const [usuarios, setUsuarios] = useState([]);
  const [rutinas, setRutinas] = useState([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [rutinaSeleccionada, setRutinaSeleccionada] = useState('');
  const [mensaje, setMensaje] = useState('');

  const fetchData = async () => {
    const resUsuarios = await api.get('/admin/users');
    const resRutinas = await api.get('/admin/routines');
    setUsuarios(resUsuarios.data);
    setRutinas(resRutinas.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">📌 Asignar rutina a usuario</h5>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Selecciona un usuario:</label>
              <select
                className="form-select"
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              >
                <option value="">-- Elegir usuario --</option>
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Selecciona una rutina:</label>
              <select
                className="form-select"
                value={rutinaSeleccionada}
                onChange={(e) => setRutinaSeleccionada(e.target.value)}
              >
                <option value="">-- Elegir rutina --</option>
                {rutinas.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 text-end">
            <button className="btn btn-success" onClick={asignar}>
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
        <h5 className="mb-3">🗂️ Rutinas asignadas</h5>
        <table className="table table-bordered align-middle">
          <thead className="table-dark">
            <tr>
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
                    <td>{u.email}</td>
                    <td>{rutina ? rutina.nombre : 'Sin rutina'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-danger me-2"
                        onClick={() => eliminarAsignacion(u.id)}
                      >
                        <FontAwesomeIcon icon={faTrash} color="white" />
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          setUsuarioSeleccionado(u.id.toString());
                          setRutinaSeleccionada(rutina?.id?.toString() || '');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <FontAwesomeIcon icon={faPen} color="white" />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
