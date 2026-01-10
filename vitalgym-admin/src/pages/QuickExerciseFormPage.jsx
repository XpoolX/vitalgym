import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileLines, faCamera, faVideo, faBolt } from '@fortawesome/free-solid-svg-icons';

export default function QuickExerciseFormPage() {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');

  // Campos para zonas corporales
  const [zonaCorporal, setZonaCorporal] = useState('');
  const [customZona, setCustomZona] = useState('');
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

  // Actualiza las opciones cuando cambia la zona corporal
  useEffect(() => {
    if (!zonaCorporal || zonaCorporal === 'otro') {
      return;
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

    // Campos (snake_case)
    formData.append('zona_corporal', finalZona);
    formData.append('grupo_muscular', ''); // Quick exercise doesn't have muscle group
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
              <label className="form-label text-warning">Nombre del ejercicio</label>
              <input
                className="form-control bg-dark text-white border-warning"
                placeholder="Nombre del ejercicio"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-warning">Descripción</label>
              <textarea
                className="form-control bg-dark text-white border-warning"
                placeholder="Descripción completa"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={3}
              />
            </div>

            <div className="mb-3">
              <label className="form-label text-warning">Zona corporal</label>
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
              
              {todasLasZonas.length > 0 && (
                <div className="mt-2">
                  <small className="text-muted d-block mb-1">Zonas disponibles (haz clic en × para ocultar):</small>
                  <div className="d-flex flex-wrap gap-2">
                    {todasLasZonas.map((zona) => (
                      <span 
                        key={zona.value} 
                        className={`badge ${zona.isCustom ? 'bg-warning text-dark' : 'bg-secondary'} d-flex align-items-center gap-1`}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.6rem' }}
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
              
              {imagenPreview && (
                <div className="mt-3">
                  <p className="text-muted small">Vista previa:</p>
                  <img 
                    src={imagenPreview} 
                    alt="Preview" 
                    className="img-fluid rounded border border-warning" 
                    style={{ maxHeight: '200px', objectFit: 'cover' }}
                  />
                </div>
              )}
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
