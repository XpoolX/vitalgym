// controlador actualizado: acepta los nuevos campos y elimina "categoria"
const db = require('../models');
const Exercise = db.Exercise;

const buildFullUrl = (req, relativePath) => {
  return `${req.protocol}://${req.get('host')}${relativePath}`;
};

exports.getAll = async (req, res) => {
  try {
    const ejercicios = await Exercise.findAll();
    res.json(ejercicios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener ejercicios' });
  }
};

exports.create = async (req, res) => {
  try {
    // campos nuevos (sin categoria)
    const {
      nombre,
      descripcion,
      zona_corporal,
      grupo_muscular,
      equipo,
      nivel,
      descripcion_corta,
      instrucciones,
      consejos
    } = req.body;

    const imagenFile = req.files?.imagen?.[0];
    const videoFile = req.files?.video?.[0];

    const imagenUrl = imagenFile ? buildFullUrl(req, `/uploads/${imagenFile.filename}`) : null;
    const videoUrl = videoFile ? buildFullUrl(req, `/uploads/${videoFile.filename}`) : null;

    const nuevo = await Exercise.create({
      nombre,
      descripcion,
      zonaCorporal: zona_corporal || null,
      grupoMuscular: grupo_muscular || null,
      equipo: equipo || null,
      nivel: nivel || null,
      descripcionCorta: descripcion_corta || null,
      instrucciones: instrucciones || null,
      consejos: consejos || null,
      imagenUrl,
      videoUrl
    });

    res.status(201).json({ message: 'Ejercicio creado', id: nuevo.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al crear ejercicio' });
  }
};

exports.update = async (req, res) => {
  try {
    const ejercicio = await Exercise.findByPk(req.params.id);
    if (!ejercicio) return res.status(404).json({ message: 'No encontrado' });

    // leer del body los nuevos campos (sin categoria)
    const {
      nombre,
      descripcion,
      zona_corporal,
      grupo_muscular,
      equipo,
      nivel,
      descripcion_corta,
      instrucciones,
      consejos
    } = req.body;

    const imagenFile = req.files?.imagen?.[0];
    const videoFile = req.files?.video?.[0];

    const imagenUrl = imagenFile
      ? buildFullUrl(req, `/uploads/${imagenFile.filename}`)
      : ejercicio.imagenUrl;

    const videoUrl = videoFile
      ? buildFullUrl(req, `/uploads/${videoFile.filename}`)
      : ejercicio.videoUrl;

    // Actualizar respetando los campos existentes cuando no se envían
    await ejercicio.update({
      nombre: nombre ?? ejercicio.nombre,
      descripcion: descripcion ?? ejercicio.descripcion,
      zonaCorporal: zona_corporal ?? ejercicio.zonaCorporal,
      grupoMuscular: grupo_muscular ?? ejercicio.grupoMuscular,
      equipo: equipo ?? ejercicio.equipo,
      nivel: nivel ?? ejercicio.nivel,
      descripcionCorta: descripcion_corta ?? ejercicio.descripcionCorta,
      instrucciones: instrucciones ?? ejercicio.instrucciones,
      consejos: consejos ?? ejercicio.consejos,
      imagenUrl,
      videoUrl
    });

    res.json({ message: 'Ejercicio actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar ejercicio' });
  }
};

exports.remove = async (req, res) => {
  try {
    const ejercicio = await Exercise.findByPk(req.params.id);
    if (!ejercicio) return res.status(404).json({ message: 'No encontrado' });
    await ejercicio.destroy();
    res.json({ message: 'Ejercicio eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar ejercicio' });
  }
};