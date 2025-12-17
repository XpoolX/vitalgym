import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus, faTrash, faFloppyDisk, faFire, faCalendarDays, faFileLines, faClock, faBolt } from '@fortawesome/free-solid-svg-icons';

export default function QuickRoutineFormPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ejerciciosBase, setEjerciciosBase] = useState([]);
  const [dias, setDias] = useState(1);
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState({});
  const [grupoMuscularFilter, setGrupoMuscularFilter] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [editingExercise, setEditingExercise] = useState({}); // Track which exercise is being edited
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEjercicios = async () => {
      const res = await api.get('/admin/exercises');
      setEjerciciosBase(res.data);
    };
    fetchEjercicios();
  }, []);

  // Agrupar ejercicios por grupo muscular
  const ejerciciosAgrupados = useMemo(() => {
    const grupos = {};
    ejerciciosBase.forEach(ej => {
      const grupo = ej.grupoMuscular || ej.zonaCorporal || 'Otros';
      if (!grupos[grupo]) grupos[grupo] = [];
      grupos[grupo].push(ej);
    });
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [ejerciciosBase]);

  // Get unique muscle groups for filter
  const gruposMusculares = useMemo(() => {
    const grupos = new Set();
    ejerciciosBase.forEach(ej => {
      const grupo = ej.grupoMuscular || ej.zonaCorporal || 'Otros';
      grupos.add(grupo);
    });
    return Array.from(grupos).sort();
  }, [ejerciciosBase]);

  // Filtrar ejercicios por grupo muscular y búsqueda
  const getFilteredExercises = (diaIndex, exerciseIndex) => {
    const key = `${diaIndex}-${exerciseIndex}`;
    const searchTerm = (searchTerms[key] || '').toLowerCase().trim();
    const grupoFilter = grupoMuscularFilter[key];
    
    let filteredGroups = ejerciciosAgrupados;
    
    // Filter by muscle group first
    if (grupoFilter) {
      filteredGroups = ejerciciosAgrupados.filter(([grupo]) => grupo === grupoFilter);
    }
    
    // Then filter by search term
    if (searchTerm) {
      filteredGroups = filteredGroups
        .map(([grupo, ejercicios]) => {
          const filtered = ejercicios.filter(ej => 
            ej.nombre.toLowerCase().includes(searchTerm)
          );
          return [grupo, filtered];
        })
        .filter(([, ejercicios]) => ejercicios.length > 0);
    }
    
    return filteredGroups;
  };

  const actualizarCampo = (dia, i, campo, valor) => {
    const nuevos = {
      ...ejerciciosPorDia,
      [dia]: (ejerciciosPorDia[dia] || []).map((item, idx) => (idx === i ? { ...item, [campo]: valor } : { ...item }))
    };
    setEjerciciosPorDia(nuevos);
  };

  const eliminarEjercicio = (dia, index) => {
    const nuevos = { ...ejerciciosPorDia, [dia]: (ejerciciosPorDia[dia] || []).filter((_, i) => i !== index) };
    setEjerciciosPorDia(nuevos);
  };

  const agregarEjercicio = (dia) => {
    const current = ejerciciosPorDia[dia] ? [...ejerciciosPorDia[dia]] : [];
    current.push({ id: '', repeticiones: 10, series: [10, 10, 10, 10], descansoSegundos: 60, notas: '' });
    setEjerciciosPorDia({ ...ejerciciosPorDia, [dia]: current });
  };

  const agregarSerie = (dia, i) => {
    const current = ejerciciosPorDia[dia] ? [...ejerciciosPorDia[dia]] : [];
    const item = { ...(current[i] || {}) };
    const prevSeries = Array.isArray(item.series) ? [...item.series] : [];
    const serieAnterior = prevSeries.length ? prevSeries[prevSeries.length - 1] : 10;
    prevSeries.push(serieAnterior);
    item.series = prevSeries;
    current[i] = item;
    setEjerciciosPorDia({ ...ejerciciosPorDia, [dia]: current });
  };

  const actualizarSerie = (dia, i, serieIndex, valor) => {
    const current = ejerciciosPorDia[dia] ? [...ejerciciosPorDia[dia]] : [];
    const item = { ...(current[i] || {}) };
    const series = Array.isArray(item.series) ? [...item.series] : [];
    const n = valor === '' ? '' : Number(valor);
    series[serieIndex] = (valor === '' ? '' : (Number.isNaN(n) ? valor : n));
    item.series = series;
    current[i] = item;
    setEjerciciosPorDia({ ...ejerciciosPorDia, [dia]: current });
  };

  const seleccionarEjercicio = (dia, i, ejercicio) => {
    if (ejerciciosPorDia[dia].some((e2, idx) => e2.id === ejercicio.id && idx !== i)) {
      alert('Este ejercicio ya está añadido en este día. Por favor, selecciona otro ejercicio.');
      return;
    }
    actualizarCampo(dia, i, 'id', ejercicio.id);
    actualizarCampo(dia, i, 'ejercicioData', ejercicio);
    
    // Hide the selector after selection
    const key = `${dia}-${i}`;
    setEditingExercise(prev => ({ ...prev, [key]: false }));
    setSearchTerms(prev => ({ ...prev, [key]: '' }));
    setGrupoMuscularFilter(prev => ({ ...prev, [key]: '' }));
  };

  const guardarRutina = async () => {
    const diasArray = Object.entries(ejerciciosPorDia).map(([dia, ejercicios]) => {
      const ejerciciosClean = (ejercicios || [])
        .filter(e => e.id)
        .map(e => {
          let normalizedSeries = [];
          if (Array.isArray(e.series)) {
            normalizedSeries = e.series
              .map(s => {
                if (s === null || s === undefined || String(s).trim() === '') return null;
                const maybeNum = Number(s);
                return Number.isNaN(maybeNum) ? String(s).trim() : maybeNum;
              })
              .filter(x => x !== null && x !== undefined && x !== '');
          }
          if ((!normalizedSeries || normalizedSeries.length === 0) && (e.repeticiones || e.repeticiones === 0)) {
            normalizedSeries = [Number(e.repeticiones)];
          }

          return {
            exerciseId: e.id,
            series: (normalizedSeries && normalizedSeries.length) ? normalizedSeries : null,
            descansoSegundos: e.descansoSegundos,
            notas: e.notas,
          };
        });

      return {
        dia: parseInt(dia, 10),
        ejercicios: ejerciciosClean
      };
    });

    try {
      await api.post('/admin/routines', {
        nombre,
        descripcion,
        dias: diasArray,
        isQuickRoutine: true
      });
      navigate('/rutinas');
    } catch (err) {
      console.error('Error guardando rutina:', err);
      alert('Error al guardar rutina. Mira la consola para más detalles.');
    }
  };

  useEffect(() => {
    const nuevos = { ...ejerciciosPorDia };
    for (let d = 1; d <= dias; d++) {
      if (!nuevos[d]) nuevos[d] = [];
    }
    Object.keys(nuevos).forEach(k => {
      const kNum = Number(k);
      if (kNum > dias) delete nuevos[k];
    });
    setEjerciciosPorDia(nuevos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  const getSelectedExercise = (ej) => {
    if (ej.ejercicioData) return ej.ejercicioData;
    return ejerciciosBase.find(e => e.id === ej.id);
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, black 50%, crimson 50%)', paddingTop: '150px' }}>
      <NavBar />
      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faBolt} 
          title="Crear Rutina Rápida" 
          subtitle="Crea una rutina simple y compártela fácilmente"
        />

        <div className="card shadow-lg border-warning" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-header bg-dark text-white" style={{ padding: '20px 24px', borderBottom: '3px solid #ffc107' }}>
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faBolt} className="text-warning" /> Rutina Rápida (Solo Texto)
            </h5>
            <small className="text-muted">Diseño simple, compartible sin necesidad de registro</small>
          </div>

          <div className="card-body bg-black text-white" style={{ padding: '24px' }}>
            <div className="mb-3">
              <label className="form-label small mb-1" style={{ color: '#aaa' }}>
                <FontAwesomeIcon icon={faFileLines} /> Nombre de la rutina
              </label>
              <input
                className="form-control bg-dark text-white border-warning"
                placeholder="Ej: Rutina Full Body, Rutina Torso-Pierna..."
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label small mb-1" style={{ color: '#aaa' }}>
                <FontAwesomeIcon icon={faFileLines} /> Descripción (opcional)
              </label>
              <textarea
                className="form-control bg-dark text-white border-warning"
                placeholder="Breve descripción..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="form-label small mb-1" style={{ color: '#aaa' }}>
                <FontAwesomeIcon icon={faCalendarDays} /> Número de días de entrenamiento
              </label>
              <input
                type="number"
                min="1"
                max="7"
                className="form-control bg-dark text-white border-warning"
                style={{ width: '120px' }}
                value={dias}
                onChange={(e) => setDias(Math.max(1, parseInt(e.target.value || 1, 10)))}
              />
            </div>

            {[...Array(dias)].map((_, diaIndex) => {
              const dia = diaIndex + 1;
              return (
                <div key={dia} className="mb-4 p-3 border border-warning rounded" style={{ borderRadius: '12px', background: '#111' }}>
                  <h6 className="text-warning">
                    <FontAwesomeIcon icon={faFire} /> Día {dia}
                  </h6>
                  <button type="button" className="btn btn-outline-warning mb-3 btn-sm" onClick={() => agregarEjercicio(dia)}>
                    <FontAwesomeIcon icon={faPlus} /> Añadir ejercicio
                  </button>

                  {ejerciciosPorDia[dia] && ejerciciosPorDia[dia].map((ej, i) => {
                    const dropdownKey = `${dia}-${i}`;
                    const selectedExercise = getSelectedExercise(ej);
                    const filteredGroups = getFilteredExercises(dia, i);
                    const isEditing = editingExercise[dropdownKey] !== false && (!selectedExercise || editingExercise[dropdownKey]);

                    return (
                      <div key={i} className="card p-3 mb-3 bg-dark text-white border-warning" style={{ borderRadius: '8px' }}>
                        <div className="row g-2 align-items-start">
                          <div className="col-md-5">
                            <label className="form-label small text-warning">🏋️ Ejercicio</label>
                            
                            {/* Show selector only if no exercise selected OR if editing */}
                            {isEditing ? (
                              <>
                                {/* Muscle group filter */}
                                <select
                                  className="form-select form-select-sm bg-secondary text-white border-0 mb-2"
                                  value={grupoMuscularFilter[dropdownKey] || ''}
                                  onChange={(e) => {
                                    setGrupoMuscularFilter(prev => ({ ...prev, [dropdownKey]: e.target.value }));
                                  }}
                                >
                                  <option value="">Todos los grupos musculares</option>
                                  {gruposMusculares.map(grupo => (
                                    <option key={grupo} value={grupo}>{grupo}</option>
                                  ))}
                                </select>

                                {/* Exercise search and select */}
                                <input
                                  type="text"
                                  className="form-control form-control-sm bg-secondary text-white border-0 mb-2"
                                  placeholder="Buscar ejercicio..."
                                  value={searchTerms[dropdownKey] || ''}
                                  onChange={(e) => setSearchTerms(prev => ({ ...prev, [dropdownKey]: e.target.value }))}
                                  autoFocus
                                />

                                {/* Exercise dropdown */}
                                {(searchTerms[dropdownKey] || grupoMuscularFilter[dropdownKey]) && (
                                  <div 
                                    className="bg-dark border border-secondary rounded mb-2" 
                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                  >
                                    {filteredGroups.length === 0 ? (
                                      <div className="p-2 text-center text-muted small">
                                        No se encontraron ejercicios
                                      </div>
                                    ) : (
                                      filteredGroups.map(([grupo, ejercicios]) => (
                                        <div key={grupo}>
                                          <div className="px-2 py-1 bg-secondary text-white small fw-bold">
                                            {grupo}
                                          </div>
                                          {ejercicios.map(ejercicio => (
                                            <div
                                              key={ejercicio.id}
                                              className={`px-2 py-1 small ${ej.id === ejercicio.id ? 'bg-success' : ''}`}
                                              style={{ 
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #333'
                                              }}
                                              onClick={() => seleccionarEjercicio(dia, i, ejercicio)}
                                            >
                                              {ejercicio.nombre}
                                            </div>
                                          ))}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </>
                            ) : null}

                            {/* Selected exercise display - clickable to edit */}
                            {selectedExercise && !isEditing && (
                              <div 
                                className="alert alert-success py-2 px-3 mb-0"
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                onClick={() => setEditingExercise(prev => ({ ...prev, [dropdownKey]: true }))}
                                title="Haz clic para cambiar el ejercicio"
                              >
                                <strong>{selectedExercise.nombre}</strong>
                              </div>
                            )}
                          </div>

                          <div className="col-md-4">
                            <label className="form-label small text-warning">Series (repeticiones)</label>
                            <div className="d-flex flex-wrap align-items-center gap-1">
                              {Array.isArray(ej.series) && ej.series.map((serie, idx) => (
                                <input
                                  key={idx}
                                  type="number"
                                  className="form-control bg-dark text-white border-warning"
                                  style={{ width: '50px', padding: '4px' }}
                                  value={serie}
                                  onChange={(ev) => actualizarSerie(dia, i, idx, ev.target.value)}
                                />
                              ))}
                              <button
                                type="button"
                                className="btn btn-outline-warning btn-sm"
                                onClick={() => agregarSerie(dia, i)}
                                title="Añadir serie"
                                style={{ padding: '2px 6px' }}
                              >
                                <FontAwesomeIcon icon={faPlus} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                  const current = ejerciciosPorDia[dia] ? [...ejerciciosPorDia[dia]] : [];
                                  const item = { ...(current[i] || {}) };
                                  const s = Array.isArray(item.series) ? [...item.series] : [];
                                  if (s.length > 1) {
                                    s.pop();
                                    item.series = s;
                                    current[i] = item;
                                    setEjerciciosPorDia({ ...ejerciciosPorDia, [dia]: current });
                                  }
                                }}
                                title="Quitar serie"
                                style={{ padding: '2px 6px' }}
                              >
                                <FontAwesomeIcon icon={faMinus} />
                              </button>
                            </div>
                          </div>

                          <div className="col-md-2">
                            <label className="form-label small text-warning">
                              <FontAwesomeIcon icon={faClock} /> Descanso
                            </label>
                            <div className="input-group input-group-sm">
                              <input
                                type="number"
                                className="form-control bg-dark text-white border-warning"
                                value={ej.descansoSegundos}
                                onChange={(ev) => actualizarCampo(dia, i, 'descansoSegundos', parseInt(ev.target.value || 60, 10))}
                              />
                              <span className="input-group-text bg-dark border-warning text-warning">s</span>
                            </div>
                          </div>

                          <div className="col-md-1 text-end">
                            <label className="form-label small d-block">&nbsp;</label>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => eliminarEjercicio(dia, i)}
                              title="Eliminar ejercicio"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <button type="button" className="btn btn-warning btn-lg mt-4 w-100" onClick={guardarRutina} style={{ borderRadius: '12px', fontWeight: 'bold' }}>
              <FontAwesomeIcon icon={faFloppyDisk} /> Guardar Rutina Rápida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
