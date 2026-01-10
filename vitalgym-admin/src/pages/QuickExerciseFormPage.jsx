import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDumbbell, faFileLines, faCamera, faVideo, faBolt } from '@fortawesome/free-solid-svg-icons';

export default function QuickExerciseFormPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Campos para zonas corporales
  const [zonaCorporal, setZonaCorporal] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [customZona, setCustomZona] = useState('');
  const [customGrupo, setCustomGrupo] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [consejos, setConsejos] = useState('');

  // State for custom zones
  const [zonasPersonalizadas, setZonasPersonalizadas] = useState([]);

  const navigate = useNavigate();

  // Load custom zones from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('zonasPersonalizadas');
    if (saved) {
      try {
        setZonasPersonalizadas(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading custom zones:', e);
      }
    }
  }, []);

  // Opciones para desplegables con zonas personalizadas
  const zonasBase = [
    { value: '', label: 'Selecciona zona corporal' },
    { value: 'pecho', label: 'Pecho' },
    { value: 'espalda', label: 'Espalda' },
    { value: 'piernas', label: 'Piernas' },
    { value: 'hombros', label: 'Hombros' },
    { value: 'brazos', label: 'Brazos' },
    { value: 'abdomen', label: 'Abdomen' },
    { value: 'gluteos', label: 'Glúteos' },
  ];

  // Add custom zones to the list
  const zonas = [
    ...zonasBase,
    ...zonasPersonalizadas.map(z => ({ value: z, label: z })),
    { value: 'otro', label: 'Otro (añadir nueva)' }
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

  // Actualiza las opciones de grupo muscular cuando cambia la zona corporal
  useEffect(() => {
    if (!zonaCorporal || zonaCorporal === 'otro') {
      setGrupoMuscular('');
      return;
    }
    const opciones = gruposByZona[zonaCorporal];
    if (opciones && opciones.length > 0) {
      if (!opciones.includes(grupoMuscular)) {
        setGrupoMuscular('');
      }
    } else {
      setGrupoMuscular('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zonaCorporal]);

  const handleAddCustomZone = () => {
    if (customZona.trim() && !zonasPersonalizadas.includes(customZona.trim())) {
      const newZonas = [...zonasPersonalizadas, customZona.trim()];
      setZonasPersonalizadas(newZonas);
      localStorage.setItem('zonasPersonalizadas', JSON.stringify(newZonas));
      setZonaCorporal(customZona.trim());
      setCustomZona('');
    }
  };

  const guardar = async () => {
    // Determine the final zone value
    let finalZona = zonaCorporal;
    if (zonaCorporal === 'otro' && customZona.trim()) {
      finalZona = customZona.trim();
      // Also add to custom zones if not already added
      if (!zonasPersonalizadas.includes(finalZona)) {
        const newZonas = [...zonasPersonalizadas, finalZona];
        setZonasPersonalizadas(newZonas);
        localStorage.setItem('zonasPersonalizadas', JSON.stringify(newZonas));
      }
    }

    // Determine the final muscle group
    let finalGrupo = grupoMuscular;
    if (grupoMuscular === 'otro' && customGrupo.trim()) {
      finalGrupo = customGrupo.trim();
    }

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);

    // Campos (snake_case)
    formData.append('zona_corporal', finalZona);
    formData.append('grupo_muscular', finalGrupo);
    // Quick exercise doesn't have equipo and nivel
    formData.append('equipo', '');
    formData.append('nivel', '');
    formData.append('descripcion_corta', ''); // No short description in quick exercise
    formData.append('instrucciones', instrucciones);
    formData.append('consejos', consejos);
    formData.append('video_url', videoUrl); // YouTube URL instead of file

    if (imagen) formData.append('imagen', imagen);

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

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const youtubeVideoId = getYouTubeVideoId(videoUrl);

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, black 50%, crimson 50%)', paddingTop: '150px' }}>
      <NavBar />
      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faBolt} 
          title="Crear Ejercicio Rápido" 
          subtitle="Añade un ejercicio de forma rápida y sencilla"
        />
        
        <div className="card shadow-lg border-warning" style={{ borderRadius: '16px', overflow: 'hidden', borderWidth: '3px' }}>
          <div className="card-header bg-dark text-white" style={{ padding: '20px 24px', borderBottom: '3px solid #ffc107' }}>
            <h5 className="mb-0">
              <FontAwesomeIcon icon={faBolt} className="text-warning" /> Crear ejercicio rápido
            </h5>
            <small className="text-muted">Formulario simplificado para crear ejercicios rápidamente</small>
          </div>

          <div className="card-body bg-black text-white" style={{ padding: '24px' }}>
            <div className="mb-3">
              <input
                className="form-control bg-dark text-white border-warning"
                placeholder="Nombre del ejercicio"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <textarea
                className="form-control bg-dark text-white border-warning"
                placeholder="Descripción completa"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <select
                  className="form-select bg-dark text-white border-warning"
                  value={zonaCorporal}
                  onChange={(e) => setZonaCorporal(e.target.value)}
                >
                  {zonas.map((z) => (
                    <option key={z.value} value={z.value}>
                      {z.label}
                    </option>
                  ))}
                </select>
                
                {zonaCorporal === 'otro' && (
                  <div className="mt-2 d-flex gap-2">
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-warning"
                      placeholder="Nombre de la nueva zona corporal"
                      value={customZona}
                      onChange={(e) => setCustomZona(e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="btn btn-warning"
                      onClick={handleAddCustomZone}
                    >
                      Añadir
                    </button>
                  </div>
                )}
              </div>

              <div className="col-md-6 mb-3">
                <select
                  className="form-select bg-dark text-white border-warning"
                  value={grupoMuscular}
                  onChange={(e) => setGrupoMuscular(e.target.value)}
                  disabled={!zonaCorporal || zonaCorporal === 'otro'}
                >
                  <option value="">{zonaCorporal && zonaCorporal !== 'otro' ? 'Selecciona grupo muscular' : 'Selecciona zona primero'}</option>
                  {zonaCorporal && zonaCorporal !== 'otro' &&
                    (gruposByZona[zonaCorporal] || []).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  <option value="otro">Otro</option>
                </select>
                
                {grupoMuscular === 'otro' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-warning"
                      placeholder="Nombre del grupo muscular"
                      value={customGrupo}
                      onChange={(e) => setCustomGrupo(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label text-warning"><FontAwesomeIcon icon={faFileLines} /> Instrucciones</label>
              <textarea
                className="form-control bg-dark text-white border-warning"
                placeholder="Pasos para ejecutar correctamente el ejercicio"
                rows={5}
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-warning"><FontAwesomeIcon icon={faFileLines} /> Consejos</label>
              <textarea
                className="form-control bg-dark text-white border-warning"
                placeholder="Recomendaciones, advertencias o errores comunes"
                rows={3}
                value={consejos}
                onChange={(e) => setConsejos(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-warning"><FontAwesomeIcon icon={faCamera} /> Imagen (archivo)</label>
              <input
                type="file"
                className="form-control bg-dark text-white border-warning"
                accept="image/*"
                onChange={(e) => setImagen(e.target.files[0])}
              />
            </div>

            <div className="mb-4">
              <label className="form-label text-warning"><FontAwesomeIcon icon={faVideo} /> Vídeo de YouTube (URL)</label>
              <input
                type="text"
                className="form-control bg-dark text-white border-warning"
                placeholder="https://www.youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              
              {youtubeVideoId && (
                <div className="mt-3">
                  <p className="text-muted small">Vista previa:</p>
                  <div className="ratio ratio-16x9" style={{ maxWidth: '560px' }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title="YouTube video preview"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}
            </div>

            <button className="btn btn-warning" onClick={guardar} style={{ borderRadius: '12px', padding: '12px 24px', fontWeight: '700' }}>
              <FontAwesomeIcon icon={faBolt} /> Guardar ejercicio rápido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
