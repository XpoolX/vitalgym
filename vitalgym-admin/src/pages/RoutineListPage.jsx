import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare as faPenToSquareRegular, faTrashCan as faTrashCanRegular, faPlus, faClipboardList, faFilePdf } from '@fortawesome/free-solid-svg-icons';

export default function RoutineListPage() {
  const [rutinas, setRutinas] = useState([]);

  const fetchRutinas = async () => {
    const res = await api.get('/admin/routines');
    setRutinas(res.data);
  };

  useEffect(() => {
    fetchRutinas();
  }, []);

  const eliminarRutina = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta rutina?')) return;
    try {
      await api.delete(`/admin/routines/${id}`);
      setRutinas(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Error al eliminar rutina');
      console.error(err);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 50%, #0a0a0f 100%)', paddingTop: '100px' }}>
      <NavBar />
      <div className="page-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faClipboardList} 
          title="Rutinas de Entrenamiento" 
          subtitle="Crea, edita y gestiona las rutinas personalizadas"
        />

        <div className="mb-4 d-flex justify-content-start">
          <Link to="/rutinas/crear" className="btn btn-success" style={{ padding: '12px 20px', borderRadius: '12px', fontWeight: '700' }}>
            <FontAwesomeIcon icon={faPlus} /> Crear nueva rutina
          </Link>
        </div>

        {rutinas.length === 0 ? (
          <p className="text-white">No hay rutinas aún.</p>
        ) : (
          <div className="row">
            {rutinas.map((rutina) => (
              <div className="col-md-6 col-lg-4 mb-4" key={rutina.id}>
                <div className="card h-100 shadow-sm" style={{border: '5px solid rgb(73, 0, 22)', backgroundColor: '#000', color: '#fff', borderRadius: '15px', boxShadow: '0 0 30px crimson' }}>
                  <div className="card-body">
                    <h5 className="card-title" style={{ fontWeight: 'bold' }}>{rutina.nombre}</h5>
                    <p className="card-text text-white">{rutina.descripcion}</p>
                  </div>
                  <div className="card-footer bg-black border-top-0 d-flex justify-content-between align-items-center">
                    <Link to={`/rutinas/${rutina.id}/editar`} className="btn btn-primary btn-sm" title="Editar rutina">
                      <FontAwesomeIcon icon={faPenToSquareRegular} />
                    </Link>

                    <Link
                      to={`/rutinas/${rutina.id}/preview-pdf`}
                      className="btn btn-sm btn-outline-warning"
                      title="Previsualizar y exportar PDF"
                    >
                      <FontAwesomeIcon icon={faFilePdf} /> PDF
                    </Link>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => eliminarRutina(rutina.id)}
                      title="Eliminar rutina"
                    >
                      <FontAwesomeIcon icon={faTrashCanRegular} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}