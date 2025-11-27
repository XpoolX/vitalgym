import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';

export default function RoutineFormPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ejerciciosBase, setEjerciciosBase] = useState([]);
  const [dias, setDias] = useState(1);
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
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
    // Ordenar grupos alfabéticamente
    return Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
  }, [ejerciciosBase]);

  // Filtrar ejercicios por búsqueda
  const getFilteredExercises = (diaIndex, exerciseIndex) => {
    const key = `${diaIndex}-${exerciseIndex}`;
    const searchTerm = (searchTerms[key] || '').toLowerCase().trim();
    
    if (!searchTerm) return ejerciciosAgrupados;
    
    const filteredGroups = ejerciciosAgrupados
      .map(([grupo, ejercicios]) => {
        const filtered = ejercicios.filter(ej => 
          ej.nombre.toLowerCase().includes(searchTerm) ||
          (ej.grupoMuscular && ej.grupoMuscular.toLowerCase().includes(searchTerm)) ||
          (ej.zonaCorporal && ej.zonaCorporal.toLowerCase().includes(searchTerm))
        );
        return [grupo, filtered];
      })
      .filter(([, ejercicios]) => ejercicios.length > 0);
    
    return filteredGroups;
  };

  const actualizarCampo = (dia, i, campo, valor) => {
    const nuevos = {
      ...ejerciciosPorDia,
      [dia]: (ejerciciosPorDia[dia] || []).map((item, idx) => (idx === i ? { ...item } : { ...item }))
    };
    if (!nuevos[dia][i]) nuevos[dia][i] = {};
    nuevos[dia][i][campo] = valor;
    setEjerciciosPorDia(nuevos);
  };

  const eliminarEjercicio = (dia, index) => {
    const nuevos = { ...ejerciciosPorDia, [dia]: (ejerciciosPorDia[dia] || []).filter((_, i) => i !== index) };
    setEjerciciosPorDia(nuevos);
  };

  const agregarEjercicio = (dia) => {
    const current = ejerciciosPorDia[dia] ? [...ejerciciosPorDia[dia]] : [];
    current.push({ id: '', repeticiones: 10, series: [10], descansoSegundos: 60, notas: '' });
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
    if (ejerciciosPorDia[dia].some((e2, idx) => e2.id === ejercicio.id && idx !== i)) return;
    actualizarCampo(dia, i, 'id', ejercicio.id);
    actualizarCampo(dia, i, 'ejercicioData', ejercicio);
    setOpenDropdown(null);
    const key = `${dia}-${i}`;
    setSearchTerms(prev => ({ ...prev, [key]: '' }));
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

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.exercise-dropdown-container')) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const getSelectedExercise = (ej) => {
    if (ej.ejercicioData) return ej.ejercicioData;
    return ejerciciosBase.find(e => e.id === ej.id);
  };

  return (
    <div className="container-xl mt-5 pt-4">
      <NavBar />

      <div className="card shadow-lg border-danger">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">💪 Crear nueva rutina potente</h5>
        </div>

        <div className="card-body bg-black text-white">
          <div className="mb-3">
            <label className="form-label small mb-1" style={{ color: '#aaa' }}>📝 Nombre de la rutina</label>
            <input
              className="form-control bg-dark text-white border-danger"
              placeholder="Ej: Rutina de hipertrofia, Full Body principiantes..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
            <small style={{ color: "#888" }}>Nombre descriptivo para identificar la rutina</small>
          </div>

          <div className="mb-3">
            <label className="form-label small mb-1" style={{ color: '#aaa' }}>📄 Descripción</label>
            <textarea
              className="form-control bg-dark text-white border-danger"
              placeholder="Describe el objetivo de esta rutina, para quién está diseñada..."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
            <small style={{ color: "#888" }}>Objetivo y detalles de la rutina (opcional)</small>
          </div>

          <div className="mb-3">
            <label className="form-label small mb-1" style={{ color: '#aaa' }}>📅 Número de días de entrenamiento</label>
            <input
              type="number"
              min="1"
              max="7"
              className="form-control bg-dark text-white border-danger"
              style={{ width: '120px' }}
              value={dias}
              onChange={(e) => setDias(Math.max(1, parseInt(e.target.value || 1, 10)))}
            />
            <small style={{ color: "#888" }}>¿Cuántos días a la semana entrena el usuario?</small>
          </div>

          {[...Array(dias)].map((_, diaIndex) => {
            const dia = diaIndex + 1;
            return (
              <div key={dia} className="mb-4 p-3 border border-danger rounded">
                <h6>🔥 Día {dia}</h6>
                <button type="button" className="btn btn-outline-danger mb-3" onClick={() => agregarEjercicio(dia)}>
                  ➕ Añadir ejercicio
                </button>

                {ejerciciosPorDia[dia] && ejerciciosPorDia[dia].map((ej, i) => {
                  const dropdownKey = `${dia}-${i}`;
                  const isOpen = openDropdown === dropdownKey;
                  const selectedExercise = getSelectedExercise(ej);
                  const filteredGroups = getFilteredExercises(dia, i);

                  return (
                    <div key={i} className="card p-3 mb-3 bg-dark text-white border-danger">
                      <div className="row g-2 align-items-start">
                        <div className="col-md-4">
                          <label className="form-label small" style={{ color: '#aaa' }}>🏋️ Ejercicio</label>
                          <div className="exercise-dropdown-container position-relative">
                            <div
                              className="form-control bg-dark text-white border-danger d-flex align-items-center justify-content-between"
                              style={{ cursor: 'pointer', minHeight: '42px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdown(isOpen ? null : dropdownKey);
                              }}
                            >
                              {selectedExercise ? (
                                <div className="d-flex align-items-center gap-2" style={{ overflow: 'hidden' }}>
                                  {selectedExercise.imagenUrl && (
                                    <img 
                                      src={selectedExercise.imagenUrl} 
                                      alt="" 
                                      style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }}
                                    />
                                  )}
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {selectedExercise.nombre}
                                  </span>
                                </div>
                              ) : (
                                <span style={{ color: "#888" }}>Selecciona ejercicio...</span>
                              )}
                              <span style={{ marginLeft: '8px' }}>{isOpen ? '▲' : '▼'}</span>
                            </div>
                            
                            {isOpen && (
                              <div 
                                className="position-absolute w-100 bg-dark border border-danger rounded-bottom shadow-lg"
                                style={{ 
                                  zIndex: 1000, 
                                  maxHeight: '350px', 
                                  overflowY: 'auto',
                                  top: '100%',
                                  left: 0
                                }}
                              >
                                <div className="p-2 border-bottom border-secondary sticky-top bg-dark">
                                  <input
                                    type="text"
                                    className="form-control form-control-sm bg-secondary text-white border-0"
                                    placeholder="🔍 Buscar por nombre o músculo..."
                                    value={searchTerms[dropdownKey] || ''}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      setSearchTerms(prev => ({ ...prev, [dropdownKey]: e.target.value }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    autoFocus
                                  />
                                </div>
                                
                                {filteredGroups.length === 0 ? (
                                  <div className="p-3 text-center" style={{ color: '#888' }}>
                                    No se encontraron ejercicios
                                  </div>
                                ) : (
                                  filteredGroups.map(([grupo, ejercicios]) => (
                                    <div key={grupo}>
                                      <div className="px-2 py-1 bg-secondary text-white small fw-bold sticky-top" style={{ top: '45px' }}>
                                        💪 {grupo}
                                      </div>
                                      {ejercicios.map(ejercicio => {
                                        const isSelected = ej.id === ejercicio.id;
                                        const isUsed = ejerciciosPorDia[dia].some((e2, idx) => e2.id === ejercicio.id && idx !== i);
                                        
                                        return (
                                          <div
                                            key={ejercicio.id}
                                            className={`px-2 py-2 d-flex align-items-center gap-2 ${isSelected ? 'bg-success' : isUsed ? 'bg-secondary opacity-50' : ''}`}
                                            style={{ 
                                              cursor: isUsed ? 'not-allowed' : 'pointer',
                                              borderBottom: '1px solid #333'
                                            }}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (!isUsed) seleccionarEjercicio(dia, i, ejercicio);
                                            }}
                                          >
                                            {ejercicio.imagenUrl ? (
                                              <img 
                                                src={ejercicio.imagenUrl} 
                                                alt="" 
                                                style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                                              />
                                            ) : (
                                              <div 
                                                style={{ 
                                                  width: '36px', 
                                                  height: '36px', 
                                                  borderRadius: '6px', 
                                                  background: '#444',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  fontSize: '14px'
                                                }}
                                              >
                                                🏋️
                                              </div>
                                            )}
                                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                              <div style={{ fontWeight: '600', fontSize: '14px' }}>{ejercicio.nombre}</div>
                                              {ejercicio.zonaCorporal && (
                                                <div style={{ fontSize: '11px', color: '#aaa' }}>
                                                  {ejercicio.zonaCorporal}
                                                </div>
                                              )}
                                            </div>
                                            {isUsed && <span className="badge bg-warning text-dark">Ya añadido</span>}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          <small style={{ color: "#888" }}>Busca y selecciona el ejercicio</small>
                        </div>

                        <div className="col-md-4">
                          <label className="form-label small" style={{ color: '#aaa' }}>🔢 Series y repeticiones</label>
                          <div className="d-flex flex-wrap align-items-center gap-1">
                            {Array.isArray(ej.series) && ej.series.map((serie, idx) => (
                              <input
                                key={idx}
                                type="number"
                                className="form-control bg-dark text-white border-danger"
                                style={{ width: '55px' }}
                                value={serie}
                                onChange={(ev) => actualizarSerie(dia, i, idx, ev.target.value)}
                                title={`Serie ${idx + 1}`}
                              />
                            ))}
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => agregarSerie(dia, i)}
                              title="Añadir serie"
                            >
                              ➕
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
                            >
                              ➖
                            </button>
                          </div>
                          <small style={{ color: "#888" }}>Cada número es las reps de una serie</small>
                        </div>

                        <div className="col-md-2">
                          <label className="form-label small" style={{ color: '#aaa' }}>⏱️ Descanso</label>
                          <div className="input-group">
                            <input
                              type="number"
                              className="form-control bg-dark text-white border-danger"
                              style={{ width: '70px' }}
                              value={ej.descansoSegundos}
                              onChange={(ev) => actualizarCampo(dia, i, 'descansoSegundos', parseInt(ev.target.value || 60, 10))}
                            />
                            <span className="input-group-text bg-dark border-danger" style={{ color: '#888' }}>s</span>
                          </div>
                          <small style={{ color: "#888" }}>Segundos entre series</small>
                        </div>

                        <div className="col-md-2 text-end">
                          <label className="form-label small d-block" style={{ color: '#aaa' }}>&nbsp;</label>
                          <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => eliminarEjercicio(dia, i)}
                            title="Eliminar ejercicio"
                          >
                            ❌
                          </button>
                        </div>

                        <div className="col-12 mt-2">
                          <label className="form-label small" style={{ color: '#aaa' }}>📝 Notas personales</label>
                          <textarea
                            className="form-control bg-dark text-white border-danger"
                            placeholder="Instrucciones especiales, variaciones, tips..."
                            value={ej.notas}
                            onChange={(ev) => actualizarCampo(dia, i, 'notas', ev.target.value)}
                            rows={2}
                          />
                          <small style={{ color: "#888" }}>Indicaciones específicas para este ejercicio (opcional)</small>
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>
            );
          })}

          <button type="button" className="btn btn-success btn-lg mt-4 w-100" onClick={guardarRutina}>
            💾 Guardar rutina completa
          </button>
        </div>
      </div>
    </div>
  );
}