import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';

export default function RoutineEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [dias, setDias] = useState(1);
  const [ejerciciosBase, setEjerciciosBase] = useState([]);
  const [ejerciciosPorDia, setEjerciciosPorDia] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRutina, resEjercicios] = await Promise.all([
          api.get(`/admin/routines/${id}`),
          api.get('/admin/exercises')
        ]);

        setNombre(resRutina.data.nombre);
        setDescripcion(resRutina.data.descripcion);
        setDias(resRutina.data.dias.length);

        const estructura = {};
        resRutina.data.dias.forEach((dia) => {
          estructura[dia.dia] = dia.ejercicios.map((ej) => ({
            id: ej.exerciseId,
            series: (() => {
              if (Array.isArray(ej.series)) return ej.series;
              if (typeof ej.series === 'string') {
                try { return JSON.parse(ej.series); } catch { return [10]; }
              }
              return [10];
            })(),
            descansoSegundos: ej.descansoSegundos ?? 60,
            notas: ej.notas || '',
          }));
        });

        setEjerciciosPorDia(estructura);
        setEjerciciosBase(resEjercicios.data);
      } catch (error) {
        console.error('Error cargando rutina:', error);
      }
    };

    fetchData();
  }, [id]);

  const actualizarCampo = (dia, i, campo, valor) => {
    const nuevos = { ...ejerciciosPorDia };
    nuevos[dia][i][campo] = valor;
    setEjerciciosPorDia(nuevos);
  };

  const eliminarEjercicio = (dia, index) => {
    const nuevos = { ...ejerciciosPorDia };
    nuevos[dia] = nuevos[dia].filter((_, i) => i !== index);
    setEjerciciosPorDia(nuevos);
  };

  const agregarEjercicio = (dia) => {
    const nuevos = { ...ejerciciosPorDia };
    if (!nuevos[dia]) nuevos[dia] = [];
    nuevos[dia].push({ id: '', series: [10], descansoSegundos: 60, notas: '' });
    setEjerciciosPorDia(nuevos);
  };

  const manejarCambioDias = (e) => {
    const nuevoDias = parseInt(e.target.value);
    setDias(nuevoDias);
    const nuevos = { ...ejerciciosPorDia };
    // Asegurar que existan todos los días
    for (let d = 1; d <= nuevoDias; d++) {
      if (!nuevos[d]) nuevos[d] = [];
    }
    // Eliminar días sobrantes
    Object.keys(nuevos).forEach(d => {
      if (d > nuevoDias) delete nuevos[d];
    });
    setEjerciciosPorDia(nuevos);
  };

  const guardarCambios = async () => {
    const diasArray = Object.entries(ejerciciosPorDia).map(([dia, ejercicios]) => ({
      dia: parseInt(dia),
      ejercicios: ejercicios
        .filter(e => e.id)
        .map(e => ({
          exerciseId: e.id,
          series: e.series,
          descansoSegundos: e.descansoSegundos,
          notas: e.notas,
        })),
    }));

    await api.put(`/admin/routines/${id}`, {
      nombre,
      descripcion,
      dias: diasArray,
    });

    navigate('/rutinas');
  };

  return (
    <div className="container-xl mt-5 pt-4">
      <NavBar />
      <div className="card shadow-lg border-danger">
        <div className="card-header bg-dark text-white">
          <h5 className="mb-0">💪 Editar rutina potente</h5>
        </div>
        <div className="card-body bg-black text-white">
          <input className="form-control bg-dark text-white border-danger mb-3" placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <textarea className="form-control bg-dark text-white border-danger mb-3" placeholder="Descripción" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
          <label>📅 Número de días</label>
          <input type="number" min="1" max="7" className="form-control bg-dark text-white border-danger mb-3" value={dias} onChange={manejarCambioDias} />

          {[...Array(dias)].map((_, diaIndex) => {
            const dia = diaIndex + 1;
            return (
              <div key={dia} className="mb-4 p-3 border border-danger rounded">
                <h6>🔥 Día {dia}</h6>
                <button className="btn btn-outline-danger mb-3" onClick={() => agregarEjercicio(dia)}>➕ Añadir ejercicio</button>
                {ejerciciosPorDia[dia] && ejerciciosPorDia[dia].map((ej, i) => (
                  <div key={i} className="card p-3 mb-3 bg-dark text-white border-danger">
                    <div className="row g-2 align-items-center">
                      <div className="col-md-3">
                        <label>Ejercicio</label>
                        <select className="form-select bg-dark text-white border-danger" value={ej.id || ''} onChange={(e) => actualizarCampo(dia, i, 'id', parseInt(e.target.value))}>
                          <option value="">Selecciona ejercicio</option>
                          {ejerciciosBase.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label>Series y reps</label>
                        <div className="d-flex gap-1 flex-wrap align-items-center">
                          {ej.series.map((serie, idx) => (
                            <input key={idx} type="number" value={serie} className="form-control bg-dark text-white border-danger" style={{ width: '60px' }} onChange={(e) => {
                              const nuevos = [...ej.series];
                              nuevos[idx] = e.target.value;
                              actualizarCampo(dia, i, 'series', nuevos);
                            }} />
                          ))}
                          <button className="btn btn-outline-primary p-2" onClick={() => actualizarCampo(dia, i, 'series', [...ej.series, ej.series[ej.series.length - 1] || 10])}>➕</button>
                          <button className="btn btn-outline-secondary p-2" onClick={() => actualizarCampo(dia, i, 'series', ej.series.length > 1 ? ej.series.slice(0, -1) : ej.series)}>➖</button>
                        </div>
                      </div>
                      <div className="col-md-2">
                        <label>Descanso (s)</label>
                        <input type="number" value={ej.descansoSegundos} className="form-control bg-dark text-white border-danger" style={{ width: '80px' }} onChange={(e) => actualizarCampo(dia, i, 'descansoSegundos', parseInt(e.target.value))} />
                      </div>
                      <div className="col-md-2 text-end">
                        <button className="btn btn-outline-danger" onClick={() => eliminarEjercicio(dia, i)}>❌</button>
                      </div>
                      <div className="col-12 mt-2">
                        <label>Notas</label>
                        <textarea className="form-control bg-dark text-white border-danger" rows="2" placeholder="Notas..." value={ej.notas} onChange={(e) => actualizarCampo(dia, i, 'notas', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          <button className="btn btn-success btn-lg w-100 mt-4" onClick={guardarCambios}>💾 Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
