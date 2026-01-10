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
  const [imagenPreview, setImagenPreview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Nuevos campos solicitados
  const [zonaCorporal, setZonaCorporal] = useState('');
  const [grupoMuscular, setGrupoMuscular] = useState('');
  const [customZona, setCustomZona] = useState('');
  const [customGrupo, setCustomGrupo] = useState('');
  const [equipo, setEquipo] = useState('');
  const [nivel, setNivel] = useState('principiante');
  const [descripcionCorta, setDescripcionCorta] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [consejos, setConsejos] = useState('');

  // State for custom zones and disabled base zones
  const [zonasPersonalizadas, setZonasPersonalizadas] = useState([]);
  const [zonasDeshabilitadas, setZonasDeshabilitadas] = useState([]);

  const navigate = useNavigate();

  // Load custom zones and disabled zones from localStorage
  useEffect(() => {
    const savedCustom = localStorage.getItem('zonasPersonalizadas');
    if (savedCustom) {
      try {
        setZonasPersonalizadas(JSON.parse(savedCustom));
      } catch (e) {
        console.error('Error loading custom zones:', e);
      }
    }
    
    const savedDisabled = localStorage.getItem('zonasDeshabilitadas');
    if (savedDisabled) {
      try {
        setZonasDeshabilitadas(JSON.parse(savedDisabled));
      } catch (e) {
        console.error('Error loading disabled zones:', e);
      }
    }
  }, []);

  // Image preview effect
  useEffect(() => {
    if (imagen) {
      const url = URL.createObjectURL(imagen);
      setImagenPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagenPreview(null);
    }
  }, [imagen]);

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

  // Filter out disabled base zones and add custom zones
  const zonasBaseFiltradas = zonasBase.filter(z => z.value === '' || !zonasDeshabilitadas.includes(z.value));
  
  const zonas = [
    ...zonasBaseFiltradas,
    ...zonasPersonalizadas.map(z => ({ value: z, label: z })),
    { value: 'otro', label: 'Otro (añadir nueva)' }
  ];

  // Get all zones for display in management UI (excluding empty option and "otro")
  const todasLasZonas = [
    ...zonasBase.filter(z => z.value !== '' && !zonasDeshabilitadas.includes(z.value)),
    ...zonasPersonalizadas.map(z => ({ value: z, label: z, isCustom: true }))
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
    if (!zonaCorporal || zonaCorporal === 'otro') {
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

  const handleAddCustomZone = () => {
    if (customZona.trim() && !zonasPersonalizadas.includes(customZona.trim())) {
      const newZonas = [...zonasPersonalizadas, customZona.trim()];
      setZonasPersonalizadas(newZonas);
      localStorage.setItem('zonasPersonalizadas', JSON.stringify(newZonas));
      setZonaCorporal(customZona.trim());
      setCustomZona('');
    }
  };

  const handleRemoveCustomZone = (zonaToRemove) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la zona "${zonaToRemove}"?`)) {
      // Check if it's a custom zone
      if (zonasPersonalizadas.includes(zonaToRemove)) {
        // Remove from custom zones
        const newZonas = zonasPersonalizadas.filter(z => z !== zonaToRemove);
        setZonasPersonalizadas(newZonas);
        localStorage.setItem('zonasPersonalizadas', JSON.stringify(newZonas));
      } else {
        // It's a base zone, add to disabled list
        const newDisabled = [...zonasDeshabilitadas, zonaToRemove];
        setZonasDeshabilitadas(newDisabled);
        localStorage.setItem('zonasDeshabilitadas', JSON.stringify(newDisabled));
      }
      
      // If the removed zone was selected, clear selection
      if (zonaCorporal === zonaToRemove) {
        setZonaCorporal('');
      }
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

    // Campos nuevos (snake_case)
    formData.append('zona_corporal', finalZona);
    formData.append('grupo_muscular', finalGrupo);
    formData.append('equipo', equipo);
    formData.append('nivel', nivel);
    formData.append('descripcion_corta', descripcionCorta);
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
              
              {zonaCorporal === 'otro' && (
                <div className="mt-2 d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nombre de la nueva zona corporal"
                    value={customZona}
                    onChange={(e) => setCustomZona(e.target.value)}
                  />
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={handleAddCustomZone}
                  >
                    Añadir
                  </button>
                </div>
              )}
              
              {todasLasZonas.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted d-block mb-1">Zonas disponibles (haz clic en × para ocultar):</small>
                  <div className="d-flex flex-wrap gap-2">
                    {todasLasZonas.map((zona) => (
                      <span 
                        key={zona.value} 
                        className={`badge ${zona.isCustom ? 'bg-primary' : 'bg-secondary'} d-flex align-items-center gap-1`}
                        style={{ fontSize: '0.85rem', padding: '0.35rem 0.5rem' }}
                      >
                        {zona.label}
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          style={{ fontSize: '0.6rem', marginLeft: '4px' }}
                          onClick={() => handleRemoveCustomZone(zona.value)}
                          aria-label="Eliminar"
                        ></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-md-4 mb-3">
              <select
                className="form-select"
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
                    className="form-control"
                    placeholder="Nombre del grupo muscular"
                    value={customGrupo}
                    onChange={(e) => setCustomGrupo(e.target.value)}
                  />
                </div>
              )}
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
            
            {imagenPreview && (
              <div className="mt-3">
                <p className="text-muted small">Vista previa:</p>
                <img 
                  src={imagenPreview} 
                  alt="Preview" 
                  className="img-fluid rounded border" 
                  style={{ maxHeight: '200px', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label"><FontAwesomeIcon icon={faVideo} /> Vídeo de YouTube (URL)</label>
            <input
              type="text"
              className="form-control"
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

          <button className="btn btn-success" onClick={guardar} style={{ borderRadius: '12px', padding: '12px 24px' }}>
            Guardar ejercicio
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}