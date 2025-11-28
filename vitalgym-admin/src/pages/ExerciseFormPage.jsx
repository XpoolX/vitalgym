import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faFileLines, faLightbulb, faCamera, faVideo } from '@fortawesome/free-solid-svg-icons';

export default function ExerciseFormPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState(null);
  const [video, setVideo] = useState(null);

  // Nuevos campos solicitados
  const [zonaCorporal, setZonaCorporal] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [equipo, setEquipo] = useState('');
  const [nivel, setNivel] = useState('principiante');
  const [descripcionCorta, setDescripcionCorta] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [consejos, setConsejos] = useState('');

  const navigate = useNavigate();

  // Opciones para desplegables
  const zonas = [
    { value: '', label: 'Selecciona zona corporal' },
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
    { value: '', label: 'Selecciona equipo' },
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

  // Actualiza las opciones de grupo muscular cuando cambia la zona corporal
  useEffect(() => {
    if (!zonaCorporal) {
      setGrupoMuscular('');
      return;
    }
    const opciones = gruposByZona[zonaCorporal];
    if (opciones && opciones.length > 0) {
      // si el grupo actual no está en las nuevas opciones, resetea para que el usuario elija
      if (!opciones.includes(grupoMuscular)) {
        setGrupoMuscular('');
      }
    } else {
      setGrupoMuscular('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaCorporal]);

  const guardar = async () => {
    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);

    // Campos nuevos (snake_case)
    formData.append('zona_corporal', zonaCorporal);
    formData.append('grupo_muscular', grupoMuscular);
    formData.append('equipo', equipo);
    formData.append('nivel', nivel);
    formData.append('descripcion_corta', descripcionCorta);
    formData.append('instrucciones', instrucciones);
    formData.append('consejos', consejos);

    if (imagen) formData.append('imagen', imagen);
    if (video) formData.append('video', video);

    try {
      await api.post('/admin/exercises', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      navigate('/ejercicios');
    } catch (err) {
      alert('Error al guardar el ejercicio');
      console.error(err);
    }
  };

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, black 50%, crimson 50%)', paddingTop: '150px' }}>
      <NavBar />
      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faDumbbell} 
          title="Crear Nuevo Ejercicio" 
          subtitle="Añade un nuevo ejercicio a la biblioteca"
        />
        
        <div className="card shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-header bg-dark text-white" style={{ padding: '20px 24px' }}>
            <h5 className="mb-0"><FontAwesomeIcon icon={faDumbbell} /> Crear nuevo ejercicio</h5>
          </div>

          <div className="card-body" style={{ padding: '24px' }}>
            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Nombre del ejercicio"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <input
                className="form-control"
                placeholder="Descripción corta (resumen)"
                value={descripcionCorta}
                onChange={(e) => setDescripcionCorta(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <textarea
                className="form-control"
                placeholder="Descripción completa"
                value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="row">
            <div className="col-md-4 mb-3">
              <select
                className="form-select"
                value={zonaCorporal}
                onChange={(e) => setZonaCorporal(e.target.value)}
              >
                {zonas.map((z) => (
                  <option key={z.value} value={z.value}>
                    {z.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <select
                className="form-select"
                value={grupoMuscular}
                onChange={(e) => setGrupoMuscular(e.target.value)}
                disabled={!zonaCorporal}
              >
                <option value="">{zonaCorporal ? 'Selecciona grupo muscular' : 'Selecciona zona primero'}</option>
                {zonaCorporal &&
                  (gruposByZona[zonaCorporal] || []).map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="col-md-4 mb-3">
              <select
                className="form-select"
                value={equipo}
                onChange={(e) => setEquipo(e.target.value)}
              >
                {equipos.map((eq) => (
                  <option key={eq.value} value={eq.value}>
                    {eq.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <select
                className="form-select"
                value={nivel}
                onChange={(e) => setNivel(e.target.value)}
              >
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div className="col-md-6 text-end">
              {/* espacio para posibles acciones o etiquetas */}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label"><FontAwesomeIcon icon={faFileLines} /> Instrucciones</label>
            <textarea
              className="form-control"
              placeholder="Pasos para ejecutar correctamente el ejercicio"
              rows={5}
              value={instrucciones}
              onChange={(e) => setInstrucciones(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label"><FontAwesomeIcon icon={faLightbulb} /> Consejos</label>
            <textarea
              className="form-control"
              placeholder="Recomendaciones, advertencias o errores comunes"
              rows={3}
              value={consejos}
              onChange={(e) => setConsejos(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label"><FontAwesomeIcon icon={faCamera} /> Imagen (archivo)</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={(e) => setImagen(e.target.files[0])}
            />
          </div>

          <div className="mb-4">
            <label className="form-label"><FontAwesomeIcon icon={faVideo} /> Vídeo (archivo)</label>
            <input
              type="file"
              className="form-control"
              accept="video/*"
              onChange={(e) => setVideo(e.target.files[0])}
            />
          </div>

          <button className="btn btn-success" onClick={guardar} style={{ borderRadius: '12px', padding: '12px 24px' }}>
            Guardar ejercicio
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}