import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import NavBar from '../components/NavBar';

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
  const [videoFile, setVideoFile] = useState(null);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [customGrupo, setCustomGrupo] = useState('');
  const [customEquipo, setCustomEquipo] = useState('');

  // opciones
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
  }, [id]);

  // previsualización de imagen/vídeo
  useEffect(() => {
    if (imagenFile) {
      const url = URL.createObjectURL(imagenFile);
      setImagenPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setImagenPreview(null);
    }
  }, [imagenFile]);

  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile);
      setVideoPreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoPreview(null);
    }
  }, [videoFile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const guardar = async () => {
    const data = new FormData();
    data.append('nombre', form.nombre || '');
    data.append('descripcion', form.descripcion || '');
    data.append('zona_corporal', form.zonaCorporal || '');
    const grupoToSend = form.grupoMuscular === 'otro' ? customGrupo : form.grupoMuscular;
    const equipoToSend = form.equipo === 'otro' ? customEquipo : form.equipo;
    data.append('grupo_muscular', grupoToSend || '');
    data.append('equipo', equipoToSend || '');
    data.append('nivel', form.nivel || '');
    data.append('descripcion_corta', form.descripcionCorta || '');
    data.append('instrucciones', form.instrucciones || '');
    data.append('consejos', form.consejos || '');
    if (imagenFile) data.append('imagen', imagenFile);
    if (videoFile) data.append('video', videoFile);

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

  return (
    <div className="container-xl mt-5 pt-4">
      <NavBar />
      <div className="card shadow-sm">
        <div className="card-header">
          <h5 className="mb-0">✏️ Editar ejercicio</h5>
        </div>

        <div className="card-body">
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
                disabled={!form.zonaCorporal}
              >
                <option value="">{form.zonaCorporal ? 'Selecciona grupo' : 'Selecciona zona primero'}</option>
                {form.zonaCorporal &&
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
            <label className="form-label">📝 Instrucciones</label>
            <textarea className="form-control" placeholder="Pasos para ejecutar correctamente el ejercicio" rows={5} name="instrucciones" value={form.instrucciones} onChange={handleChange}/>
          </div>

          <div className="mb-4">
            <label className="form-label">💡 Consejos</label>
            <textarea className="form-control" placeholder="Recomendaciones, advertencias o errores comunes" rows={3} name="consejos" value={form.consejos} onChange={handleChange}/>
          </div>

          {/* === IMAGEN === */}
          <div className="mb-4">
            <label className="form-label d-block">📷 Imagen actual / nueva</label>
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
            <label className="form-label d-block">🎬 Vídeo actual / nuevo</label>
            <div className="row g-2 align-items-center">
              <div className="col-md-6">
                {videoPreview ? (
                  <div className="ratio ratio-16x9 border rounded">
                    <video src={videoPreview} controls />
                  </div>
                ) : form.videoUrl ? (
                  <div className="ratio ratio-16x9 border rounded">
                    <video src={form.videoUrl} controls />
                  </div>
                ) : (
                  <div className="text-muted">Sin vídeo</div>
                )}
              </div>
              <div className="col-md-6">
                <label className="form-label">Cambiar vídeo</label>
                <input type="file" className="form-control" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])}/>
              </div>
            </div>
          </div>

          {/* === BOTONES === */}
          <div className="d-flex gap-2">
            <button className="btn btn-success" onClick={guardar}>Guardar cambios</button>
            <button className="btn btn-secondary" onClick={() => navigate('/ejercicios')}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
