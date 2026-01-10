import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';
import PageHeader from '../components/PageHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faFileLines, faLightbulb, faCamera, faVideo } from '@fortawesome/free-solid-svg-icons';

export default function ExerciseEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    zonaCorporal: '',
    grupoMuscular: '',
    equipo: '',
    nivel: '',
    descripcionCorta: '',
    instrucciones: '',
    consejos: '',
    imagenUrl: '',
    videoUrl: ''
  });

  const [imagenFile, setImagenFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [customGrupo, setCustomGrupo] = useState('');
  const [customEquipo, setCustomEquipo] = useState('');
  const [customZona, setCustomZona] = useState('');

  // State for custom zones and disabled base zones
  const [zonasPersonalizadas, setZonasPersonalizadas] = useState([]);
  const [zonasDeshabilitadas, setZonasDeshabilitadas] = useState([]);

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

  // opciones con zonas personalizadas
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

  const niveles = [
    { value: '', label: 'Selecciona nivel' },
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

  const getField = (obj, camel, snake) => obj?.[camel] ?? obj?.[snake] ?? '';

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/admin/exercises');
        const ejercicio = res.data.find((e) => e.id === parseInt(id));
        if (ejercicio) {
          const zonaVal = getField(ejercicio, 'zonaCorporal', 'zona_corporal') || '';
          const grupoVal = getField(ejercicio, 'grupoMuscular', 'grupo_muscular') || '';
          const equipoVal = getField(ejercicio, 'equipo', 'equipo') || '';
          const nivelVal = getField(ejercicio, 'nivel', 'nivel') || '';
          const descripcionCortaVal = getField(ejercicio, 'descripcionCorta', 'descripcion_corta') || '';
          const instruccionesVal = getField(ejercicio, 'instrucciones', 'instrucciones') || '';
          const consejosVal = getField(ejercicio, 'consejos', 'consejos') || '';

          let grupoState = '';
          let customG = '';
          if (zonaVal && gruposByZona[zonaVal]?.includes(grupoVal)) grupoState = grupoVal;
          else if (grupoVal) { grupoState = 'otro'; customG = grupoVal; }

          const equipoValues = equipos.map((e) => e.value).filter(Boolean);
          let equipoState = '';
          let customE = '';
          if (equipoValues.includes(equipoVal)) equipoState = equipoVal;
          else if (equipoVal) { equipoState = 'otro'; customE = equipoVal; }

          setForm({
            nombre: ejercicio.nombre || '',
            descripcion: ejercicio.descripcion || '',
            zonaCorporal: zonaVal,
            grupoMuscular: grupoState,
            equipo: equipoState,
            nivel: nivelVal,
            descripcionCorta: descripcionCortaVal,
            instrucciones: instruccionesVal,
            consejos: consejosVal,
            imagenUrl: ejercicio.imagenUrl || '',
            videoUrl: ejercicio.videoUrl || ''
          });
          setCustomGrupo(customG);
          setCustomEquipo(customE);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // previsualización de imagen
  useEffect(() => {
    if (imagenFile) {
      const url = URL.createObjectURL(imagenFile);
      setImagenPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagenPreview(null);
    }
  }, [imagenFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddCustomZone = () => {
    if (customZona.trim() && !zonasPersonalizadas.includes(customZona.trim())) {
      const newZonas = [...zonasPersonalizadas, customZona.trim()];
      setZonasPersonalizadas(newZonas);
      localStorage.setItem('zonasPersonalizadas', JSON.stringify(newZonas));
      setForm((prev) => ({ ...prev, zonaCorporal: customZona.trim() }));
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
      if (form.zonaCorporal === zonaToRemove) {
        setForm((prev) => ({ ...prev, zonaCorporal: '' }));
      }
    }
  };

  const guardar = async () => {
    // Determine final values
    let finalZona = form.zonaCorporal;
    if (form.zonaCorporal === 'otro' && customZona.trim()) {
      finalZona = customZona.trim();
      if (!zonasPersonalizadas.includes(finalZona)) {
        const newZonas = [...zonasPersonalizadas, finalZona];
        setZonasPersonalizadas(newZonas);
        localStorage.setItem('zonasPersonalizadas', JSON.stringify(newZonas));
      }
    }

    const data = new FormData();
    data.append('nombre', form.nombre || '');
    data.append('descripcion', form.descripcion || '');
    data.append('zona_corporal', finalZona || '');
    const grupoToSend = form.grupoMuscular === 'otro' ? customGrupo : form.grupoMuscular;
    const equipoToSend = form.equipo === 'otro' ? customEquipo : form.equipo;
    data.append('grupo_muscular', grupoToSend || '');
    data.append('equipo', equipoToSend || '');
    data.append('nivel', form.nivel || '');
    data.append('descripcion_corta', form.descripcionCorta || '');
    data.append('instrucciones', form.instrucciones || '');
    data.append('consejos', form.consejos || '');
    data.append('video_url', form.videoUrl || ''); // YouTube URL
    if (imagenFile) data.append('imagen', imagenFile);

    try {
      await api.put(`/admin/exercises/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/ejercicios');
    } catch (err) {
      alert('Error al actualizar ejercicio');
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

  const youtubeVideoId = getYouTubeVideoId(form.videoUrl);

  return (
    <div className="page-container" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, black 50%, crimson 50%)', paddingTop: '150px' }}>
      <NavBar />
      <div className="page-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <PageHeader 
          icon={faPenToSquare} 
          title="Editar Ejercicio" 
          subtitle="Modifica los detalles del ejercicio"
        />
        
        <div className="card shadow-sm" style={{ borderRadius: '16px', overflow: 'hidden' }}>
          <div className="card-header bg-dark text-white" style={{ padding: '20px 24px' }}>
            <h5 className="mb-0"><FontAwesomeIcon icon={faPenToSquare} /> Editar ejercicio</h5>
          </div>

          <div className="card-body" style={{ padding: '24px' }}>
            {/* === campos de texto y select === */}
            <div className="mb-3">
              <input className="form-control" placeholder="Nombre" name="nombre" value={form.nombre} onChange={handleChange}/>
            </div>

            <div className="mb-3">
              <input className="form-control" placeholder="Descripción corta" name="descripcionCorta" value={form.descripcionCorta} onChange={handleChange}/>
            </div>

            <div className="mb-3">
              <textarea className="form-control" placeholder="Descripción completa" name="descripcion" rows="3" value={form.descripcion} onChange={handleChange}/>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-md-4">
                <label className="form-label small">Zona corporal</label>
                <select className="form-select" name="zonaCorporal" value={form.zonaCorporal} onChange={handleChange}>
                  {zonas.map((z) => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
                
                {form.zonaCorporal === 'otro' && (
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

            <div className="col-md-4">
              <label className="form-label small">Grupo muscular</label>
              <select
                className="form-select"
                name="grupoMuscular"
                value={form.grupoMuscular}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, grupoMuscular: v }));
                  if (v !== 'otro') setCustomGrupo('');
                }}
                disabled={!form.zonaCorporal || form.zonaCorporal === 'otro'}
              >
                <option value="">{form.zonaCorporal && form.zonaCorporal !== 'otro' ? 'Selecciona grupo' : 'Selecciona zona primero'}</option>
                {form.zonaCorporal && form.zonaCorporal !== 'otro' &&
                  (gruposByZona[form.zonaCorporal] || []).map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                <option value="otro">Otro</option>
              </select>

              {form.grupoMuscular === 'otro' && (
                <input className="form-control mt-2" placeholder="Especifica el grupo muscular" value={customGrupo} onChange={(e) => setCustomGrupo(e.target.value)}/>
              )}
            </div>

            <div className="col-md-4">
              <label className="form-label small">Equipo</label>
              <select
                className="form-select"
                name="equipo"
                value={form.equipo}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm((p) => ({ ...p, equipo: v }));
                  if (v !== 'otro') setCustomEquipo('');
                }}
              >
                {equipos.map((eq) => (
                  <option key={eq.value} value={eq.value}>{eq.label}</option>
                ))}
              </select>

              {form.equipo === 'otro' && (
                <input className="form-control mt-2" placeholder="Especifica el equipo" value={customEquipo} onChange={(e) => setCustomEquipo(e.target.value)}/>
              )}
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label small">Nivel</label>
            <select className="form-select" name="nivel" value={form.nivel} onChange={handleChange}>
              {niveles.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label"><FontAwesomeIcon icon={faFileLines} /> Instrucciones</label>
            <textarea className="form-control" placeholder="Pasos para ejecutar correctamente el ejercicio" rows={5} name="instrucciones" value={form.instrucciones} onChange={handleChange}/>
          </div>

          <div className="mb-4">
            <label className="form-label"><FontAwesomeIcon icon={faLightbulb} /> Consejos</label>
            <textarea className="form-control" placeholder="Recomendaciones, advertencias o errores comunes" rows={3} name="consejos" value={form.consejos} onChange={handleChange}/>
          </div>

          {/* === IMAGEN === */}
          <div className="mb-4">
            <label className="form-label d-block"><FontAwesomeIcon icon={faCamera} /> Imagen actual / nueva</label>
            <div className="row g-2 align-items-center">
              <div className="col-md-6">
                {imagenPreview ? (
                  <img src={imagenPreview} alt="preview" className="img-fluid rounded border" style={{ maxHeight: '200px', objectFit: 'cover' }}/>
                ) : form.imagenUrl ? (
                  <img src={form.imagenUrl} alt="actual" className="img-fluid rounded border" style={{ maxHeight: '200px', objectFit: 'cover' }}/>
                ) : (
                  <div className="text-muted">Sin imagen</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Cambiar imagen</label>
                <input type="file" className="form-control" accept="image/*" onChange={(e) => setImagenFile(e.target.files[0])}/>
              </div>
            </div>
          </div>

          {/* === VIDEO === */}
          <div className="mb-4">
            <label className="form-label d-block"><FontAwesomeIcon icon={faVideo} /> Vídeo de YouTube (URL)</label>
            
            <div className="mb-2">
              <input 
                type="text"
                className="form-control"
                placeholder="https://www.youtube.com/watch?v=..."
                name="videoUrl"
                value={form.videoUrl}
                onChange={handleChange}
              />
            </div>
            
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

          {/* === BOTONES === */}
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={guardar} style={{ borderRadius: '12px', padding: '12px 24px' }}>Guardar cambios</button>
            <button className="btn btn-secondary" onClick={() => navigate('/ejercicios')} style={{ borderRadius: '12px', padding: '12px 24px' }}>Cancelar</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
