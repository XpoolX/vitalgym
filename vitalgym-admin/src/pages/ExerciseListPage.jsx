import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrashCan, faPlus, faRotate } from '@fortawesome/free-solid-svg-icons';

export default function ExerciseListPage() {
  const [ejercicios, setEjercicios] = useState([]);
  const [loading, setLoading] = useState(false);

  // filtros
  const [zonaFilter, setZonaFilter] = useState('');
  const [grupoFilter, setGrupoFilter] = useState('');
  const [equipoFilter, setEquipoFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState('');
  const [q, setQ] = useState(''); // búsqueda libre por nombre/descripción

  const fetchEjercicios = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/exercises');
      setEjercicios(res.data || []);
    } catch (err) {
      console.error(err);
      setEjercicios([]);
    } finally {
      setLoading(false);
    }
  };

  const eliminarEjercicio = async (id) => {
    if (!window.confirm('¿Seguro que quieres eliminar este ejercicio?')) return;
    try {
      await api.delete(`/admin/exercises/${id}`);
      fetchEjercicios();
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  useEffect(() => {
    fetchEjercicios();
  }, []);

  // opciones (mismo listado que en el formulario)
  const zonas = [
    { value: '', label: 'Todas las zonas' },
    { value: 'pecho', label: 'Pecho' },
    { value: 'espalda', label: 'Espalda' },
    { value: 'piernas', label: 'Piernas' },
    { value: 'hombros', label: 'Hombros' },
    { value: 'brazos', label: 'Brazos' },
    { value: 'abdomen', label: 'Abdomen' },
    { value: 'gluteos', label: 'Glúteos' },
  ];

  const gruposByZona = {
    pecho: ['Pectorales', 'Pectorales superiores', 'Pectorales inferiores'],
    espalda: ['Dorsales', 'Trapecio', 'Erectores'],
    piernas: ['Cuádriceps', 'Isquiotibiales', 'Pantorrillas'],
    hombros: ['Deltoides anteriores', 'Deltoides laterales', 'Deltoides posteriores'],
    brazos: ['Bíceps', 'Tríceps', 'Antebrazos'],
    abdomen: ['Recto abdominal', 'Oblicuos', 'Transverso'],
    gluteos: ['Glúteo mayor', 'Glúteo medio', 'Glúteo menor'],
  };

  const equipos = [
    { value: '', label: 'Todos los equipos' },
    { value: 'peso_corporal', label: 'Peso corporal' },
    { value: 'mancuernas', label: 'Mancuernas' },
    { value: 'barra', label: 'Barra' },
    { value: 'maquina', label: 'Máquina' },
    { value: 'bandas', label: 'Bandas elásticas' },
    { value: 'kettlebell', label: 'Kettlebell' },
    { value: 'cables', label: 'Cables' },
    { value: 'trx', label: 'TRX' },
    { value: 'otro', label: 'Otro' },
  ];

  const niveles = [
    { value: '', label: 'Todos los niveles' },
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

  // helper para soportar tanto snake_case como camelCase según origen de datos
  const getField = (obj, camel, snake) => obj?.[camel] ?? obj?.[snake] ?? '';

  // filtrado cliente: inicialmente muestra todos, luego aplica filtros
  const filtered = ejercicios.filter((ej) => {
    const zona = (getField(ej, 'zonaCorporal', 'zona_corporal') || '').toString().toLowerCase();
    const grupo = (getField(ej, 'grupoMuscular', 'grupo_muscular') || '').toString().toLowerCase();
    const equipo = (getField(ej, 'equipo', 'equipo') || '').toString().toLowerCase();
    const nivel = (getField(ej, 'nivel', 'nivel') || '').toString().toLowerCase();
    const nombre = (ej.nombre || '').toString().toLowerCase();
    const descripcion = (ej.descripcion || '').toString().toLowerCase();

    if (zonaFilter && zona !== zonaFilter.toLowerCase()) return false;
    if (grupoFilter && grupo !== grupoFilter.toLowerCase()) return false;
    if (equipoFilter && equipo !== equipoFilter.toLowerCase()) return false;
    if (nivelFilter && nivel !== nivelFilter.toLowerCase()) return false;
    if (q) {
      const term = q.toLowerCase();
      if (!nombre.includes(term) && !descripcion.includes(term)) return false;
    }
    return true;
  });

  const resetFilters = () => {
    setZonaFilter('');
    setGrupoFilter('');
    setEquipoFilter('');
    setNivelFilter('');
    setQ('');
  };

  // cuando cambie zona, limpiar grupo si no está en opciones
  useEffect(() => {
    if (!zonaFilter) {
      setGrupoFilter('');
      return;
    }
    const opciones = gruposByZona[zonaFilter] || [];
    if (grupoFilter && !opciones.includes(grupoFilter)) {
      setGrupoFilter('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaFilter]);

  return (
    <div className="container-xl mt-4" style={{ paddingTop: '80px' }}>
      <NavBar />
      <h2 className="text-white mt-4 mb-3">🏋️ Ejercicios base</h2>

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/ejercicios/crear" className="btn btn-success">
            <FontAwesomeIcon icon={faPlus} /> Crear ejercicio
          </Link>

          <button className="btn btn-outline-light" onClick={fetchEjercicios} title="Refrescar">
            <FontAwesomeIcon icon={faRotate} /> Refrescar
          </button>

          <button className="btn btn-sm btn-secondary" onClick={resetFilters} title="Borrar filtros">
            Borrar filtros
          </button>
        </div>

        <div className="text-white">Mostrando {filtered.length} / {ejercicios.length}</div>
      </div>

      {/* FILTROS */}
      <div className="card mb-4 p-3" style={{ backgroundColor: '#0b0b0b', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="row g-2 align-items-center">
          <div className="col-md-3">
            <label className="form-label text-muted small">Zona corporal</label>
            <select className="form-select" value={zonaFilter} onChange={(e) => setZonaFilter(e.target.value)}>
              {zonas.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
            </select>
          </div>

          <div className="col-md-3">
            <label className="form-label text-muted small">Grupo muscular</label>
            <select
              className="form-select"
              value={grupoFilter}
              onChange={(e) => setGrupoFilter(e.target.value)}
              disabled={!zonaFilter}
            >
              <option value="">{zonaFilter ? 'Todos los grupos' : 'Selecciona zona primero'}</option>
              {zonaFilter && (gruposByZona[zonaFilter] || []).map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label text-muted small">Equipo</label>
            <select className="form-select" value={equipoFilter} onChange={(e) => setEquipoFilter(e.target.value)}>
              {equipos.map(eq => <option key={eq.value} value={eq.value}>{eq.label}</option>)}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label text-muted small">Nivel</label>
            <select className="form-select" value={nivelFilter} onChange={(e) => setNivelFilter(e.target.value)}>
              {niveles.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label text-muted small">Buscar</label>
            <input
              className="form-control"
              placeholder="Nombre o descripción..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-white">Cargando ejercicios...</p>
      ) : filtered.length === 0 ? (
        <p className="text-white">No hay ejercicios que coincidan con los filtros.</p>
      ) : (
        <div className="row">
          {filtered.map((ej) => {
            const zona = getField(ej, 'zonaCorporal', 'zona_corporal');
            const grupo = getField(ej, 'grupoMuscular', 'grupo_muscular');
            const equipo = getField(ej, 'equipo', 'equipo');
            const nivel = getField(ej, 'nivel', 'nivel');

            return (
              <div className="col-md-6 col-lg-4 mb-4" key={ej.id}>
                <div className="card h-100 shadow-sm border-0" style={{ backgroundColor: '#111', color: 'white', borderRadius: '10px', border: '1px solid crimson' }}>
                  {ej.imagenUrl && (
                    <img
                      src={ej.imagenUrl}
                      className="card-img-top"
                      alt={ej.nombre}
                      style={{ objectFit: 'cover', height: '200px', borderTopLeftRadius: '10px', borderTopRightRadius: '10px' }}
                    />
                  )}
                  <div className="card-body">
                    <h5 className="card-title">{ej.nombre}</h5>
                    <p className="card-text">{ej.descripcion}</p>

                    <div className="d-flex flex-wrap gap-1">
                      {zona && <span className="badge bg-primary">{zona}</span>}
                      {grupo && <span className="badge bg-info text-dark">{grupo}</span>}
                      {equipo && <span className="badge bg-warning text-dark">{typeof equipo === 'string' ? equipo : equipo}</span>}
                      {nivel && <span className="badge bg-success text-dark">{nivel}</span>}
                    </div>
                  </div>
                  <div className="card-footer bg-black d-flex justify-content-between border-top-0">
                    <Link to={`/ejercicios/${ej.id}/editar`} className="btn btn-sm btn-primary">
                      <FontAwesomeIcon icon={faPenToSquare} /> Editar
                    </Link>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => eliminarEjercicio(ej.id)}
                      title="Eliminar ejercicio"
                    >
                      <FontAwesomeIcon icon={faTrashCan} /> Eliminar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}