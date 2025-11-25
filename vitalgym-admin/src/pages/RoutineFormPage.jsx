import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';

export default function RoutineFormPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ejerciciosBase, setEjerciciosBase] = useState([]);
  const [dias, setDias] = useState(1); // Número de días
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEjercicios = async () => {
      const res = await api.get('/admin/exercises');
      setEjerciciosBase(res.data);
    };
    fetchEjercicios();
  }, []);

  // Actualiza de forma inmutable el ejercicio concreto
  const actualizarCampo = (dia, i, campo, valor) => {
    const nuevos = {
      ...ejerciciosPorDia,
      [dia]: (ejerciciosPorDia[dia] || []).map((item, idx) => (idx === i ? { ...item } : { ...item }))
    };
    // Asegurarse de que exista el objeto
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
    // normalizar: intentar convertir a número cuando sea posible
    const n = valor === '' ? '' : Number(valor);
    series[serieIndex] = (valor === '' ? '' : (Number.isNaN(n) ? valor : n));
    item.series = series;
    current[i] = item;
    setEjerciciosPorDia({ ...ejerciciosPorDia, [dia]: current });
  };

  const guardarRutina = async () => {
    // Normaliza y prepara el objeto a enviar
    const diasArray = Object.entries(ejerciciosPorDia).map(([dia, ejercicios]) => {
      const ejerciciosClean = (ejercicios || [])
        .filter(e => e.id)
        .map(e => {
          // Normalizar series: convertir strings numéricos a Number, filtrar vacíos
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
          // Si no hay series y hay repeticiones, usar repeticiones como fallback
          if ((!normalizedSeries || normalizedSeries.length === 0) && (e.repeticiones || e.repeticiones === 0)) {
            normalizedSeries = [Number(e.repeticiones)];
          }

          return {
            exerciseId: e.id,
            // Enviar null si no hay series para que el backend trate el fallback
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

  // Asegurar que cuando el número de días cambie, existan keys en ejerciciosPorDia (opcional)
  useEffect(() => {
    const nuevos = { ...ejerciciosPorDia };
    for (let d = 1; d <= dias; d++) {
      if (!nuevos[d]) nuevos[d] = [];
    }
    // Eliminar días extra si se redujo (opcional)
    Object.keys(nuevos).forEach(k => {
      const kNum = Number(k);
      if (kNum > dias) delete nuevos[k];
    });
    setEjerciciosPorDia(nuevos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dias]);

  return (
    <div className="container-xl mt-5 pt-4">
      <NavBar />

      <div className="card shadow-lg border-danger">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">💪 Crear nueva rutina potente</h5>
        </div>

        <div className="card-body bg-black text-white">
          <div className="mb-3">
            <input
              className="form-control bg-dark text-white border-danger"
              placeholder="Nombre de la rutina"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <textarea
              className="form-control bg-dark text-white border-danger"
              placeholder="Descripción"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">📅 Número de días de entrenamiento</label>
            <input
              type="number"
              min="1"
              max="7"
              className="form-control bg-dark text-white border-danger"
              value={dias}
              onChange={(e) => setDias(Math.max(1, parseInt(e.target.value || 1, 10)))}
            />
          </div>

          {[...Array(dias)].map((_, diaIndex) => {
            const dia = diaIndex + 1;
            return (
              <div key={dia} className="mb-4 p-3 border border-danger rounded">
                <h6>🔥 Día {dia}</h6>
                <button type="button" className="btn btn-outline-danger mb-3" onClick={() => agregarEjercicio(dia)}>
                  ➕ Añadir ejercicio
                </button>

                {ejerciciosPorDia[dia] && ejerciciosPorDia[dia].map((ej, i) => (
                  <div key={i} className="card p-3 mb-3 bg-dark text-white border-danger">
                    <div className="row g-2 align-items-center">
                      <div className="col-md-3">
                        <label className="form-label">Ejercicio</label>
                        <select
                          className="form-select bg-dark text-white border-danger"
                          value={ej.id || ''}
                          onChange={(evt) => {
                            const id = parseInt(evt.target.value, 10);
                            const base = ejerciciosBase.find((x) => x.id === id);
                            if (!base) return;
                            if (ejerciciosPorDia[dia].some((e2, idx) => e2.id === id && idx !== i)) return;
                            actualizarCampo(dia, i, 'id', base.id);
                          }}
                        >
                          <option value="">Selecciona ejercicio</option>
                          {ejerciciosBase.map((e) => (
                            <option key={e.id} value={e.id}>{e.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label">Series y repeticiones</label>
                        <div className="d-flex flex-wrap align-items-center gap-1">
                          {Array.isArray(ej.series) && ej.series.map((serie, idx) => (
                            <input
                              key={idx}
                              type="number"
                              className="form-control bg-dark text-white border-danger"
                              style={{ width: '60px' }}
                              value={serie}
                              onChange={(ev) => actualizarSerie(dia, i, idx, ev.target.value)}
                            />
                          ))}
                          <button
                            type="button"
                            className="btn btn-outline-primary p-2"
                            onClick={() => agregarSerie(dia, i)}
                            title="Añadir serie"
                          >
                            ➕
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-secondary p-2"
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
                      </div>

                      <div className="col-md-2">
                        <label className="form-label">Descanso (s)</label>
                        <input
                          type="number"
                          className="form-control bg-dark text-white border-danger"
                          style={{ width: '80px' }}
                          value={ej.descansoSegundos}
                          onChange={(ev) => actualizarCampo(dia, i, 'descansoSegundos', parseInt(ev.target.value || 60, 10))}
                        />
                      </div>

                      <div className="col-md-2 text-end">
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => eliminarEjercicio(dia, i)}
                        >
                          ❌
                        </button>
                      </div>

                      <div className="col-12 mt-2">
                        <label className="form-label">Notas personales</label>
                        <textarea
                          className="form-control bg-dark text-white border-danger"
                          placeholder="Notas personales..."
                          value={ej.notas}
                          onChange={(ev) => actualizarCampo(dia, i, 'notas', ev.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                ))}

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