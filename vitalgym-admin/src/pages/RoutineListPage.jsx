import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare as faPenToSquareRegular, faTrashCan as faTrashCanRegular, faPlus, faClipboardList, faFilePdf, faBolt, faShare } from '@fortawesome/free-solid-svg-icons';

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

  const generarLinkCompartir = async (routineId) => {
    try {
      const res = await api.post(`/admin/routines/${routineId}/share`);
      const token = res.data.shareToken;
      
      // Copy to clipboard
      const url = `${window.location.origin}/rutina/${token}`;
      await navigator.clipboard.writeText(url);
      alert('¡Link copiado al portapapeles!\n\n' + url);
    } catch (err) {
      alert('Error al generar link de compartir');
      console.error(err);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, black 50%, crimson 50%)', paddingTop: '150px' }}>
      <NavBar />
      <div className="page-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faClipboardList} 
          title="Rutinas de Entrenamiento" 
          subtitle="Crea, edita y gestiona las rutinas personalizadas"
        />

        <div className="mb-4 d-flex justify-content-start gap-2">
          <Link to="/rutinas/crear" className="btn btn-success" style={{ padding: '12px 20px', borderRadius: '12px', fontWeight: '700' }}>
            <FontAwesomeIcon icon={faPlus} /> Crear nueva rutina
          </Link>
          <Link to="/rutinas/crear-rapida" className="btn btn-warning" style={{ padding: '12px 20px', borderRadius: '12px', fontWeight: '700' }}>
            <FontAwesomeIcon icon={faBolt} /> Crear Rutina Rápida
          </Link>
        </div>

        {rutinas.length === 0 ? (
          <p className="text-white">No hay rutinas aún.</p>
        ) : (
          <div className="row">
            {rutinas.map((rutina) => (
              <div className="col-md-6 col-lg-4 mb-4" key={rutina.id}>
                <div className="card h-100 shadow-sm" style={{
                  border: rutina.isQuickRoutine ? '5px solid #ffc107' : '5px solid rgb(73, 0, 22)', 
                  backgroundColor: '#000', 
                  color: '#fff', 
                  borderRadius: '15px', 
                  boxShadow: rutina.isQuickRoutine ? '0 0 30px #ffc107' : '0 0 30px crimson'
                }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title" style={{ fontWeight: 'bold' }}>{rutina.nombre}</h5>
                      {rutina.isQuickRoutine && (
                        <span className="badge bg-warning text-dark">
                          <FontAwesomeIcon icon={faBolt} /> Rápida
                        </span>
                      )}
                    </div>
                    <p className="card-text text-white">{rutina.descripcion}</p>
                  </div>
                  <div className="card-footer bg-black border-top-0 d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <Link 
                      to={rutina.isQuickRoutine ? `/rutinas/${rutina.id}/editar-rapida` : `/rutinas/${rutina.id}/editar`} 
                      className="btn btn-primary btn-sm" 
                      title="Editar rutina"
                    >
                      <FontAwesomeIcon icon={faPenToSquareRegular} />
                    </Link>

                    {!rutina.isQuickRoutine && (
                      <Link
                        to={`/rutinas/${rutina.id}/preview-pdf`}
                        className="btn btn-warning btn-sm"
                        title="Previsualizar y exportar PDF"
                      >
                        <FontAwesomeIcon icon={faFilePdf} /> PDF
                      </Link>
                    )}

                    {rutina.isQuickRoutine && (
                      <button
                        className="btn btn-info btn-sm"
                        onClick={() => generarLinkCompartir(rutina.id)}
                        title="Compartir rutina"
                      >
                        <FontAwesomeIcon icon={faShare} /> Compartir
                      </button>
                    )}

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