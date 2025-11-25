const db = require('../models');
const User = db.User;
const Routine = db.Routine;
const RoutineExercise = db.RoutineExercise;
const Session = db.Session;
const SessionExercise = db.SessionExercise;
const Exercise = db.Exercise;

// Obtener rutina asignada al usuario autenticado
exports.getMyRoutine = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: {
        model: Routine,
        include: [RoutineExercise]
      }
    });

    if (!user || !user.Routine) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    res.json(user.Routine);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener rutina', error: error.message });
  }
};

// Iniciar y guardar una sesión de entrenamiento
exports.startSession = async (req, res) => {
  try {
    const { ejercicios } = req.body;

    const nuevaSesion = await Session.create({
      userId: req.user.id,
      fecha: new Date()
    });

    for (const ejercicio of ejercicios) {
      await SessionExercise.create({
        sessionId: nuevaSesion.id,
        nombre: ejercicio.nombre,
        repeticiones: ejercicio.repeticiones,
        completado: ejercicio.completado || false
      });
    }

    res.status(201).json({ message: 'Sesión guardada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar sesión', error: error.message });
  }
};

// Historial de sesiones del usuario
exports.getHistory = async (req, res) => {
  try {
    const sesiones = await Session.findAll({
      where: { userId: req.user.id },
      include: [SessionExercise],
      order: [['fecha', 'DESC']]
    });

    res.json(sesiones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial', error: error.message });
  }
};


// Obtener un ejercicio de rutina concreto (por id de RoutineExercise)
exports.getRoutineExerciseById = async (req, res) => {
  try {
    const { id } = req.params; // este es el ID de RoutineExercise (81, 82, ...)

    const re = await RoutineExercise.findByPk(id, {
      include: [
        {
          model: Exercise,
          as: 'Exercise',
          attributes: [
            'id',
            'nombre',
            'descripcion',
            'categoria',
            'imagenUrl',
            'videoUrl'
          ],
        },
      ],
    });

    if (!re) {
      return res.status(404).json({ message: 'Ejercicio de rutina no encontrado' });
    }

    // lo devolvemos en el formato que la app espera
    return res.json({
      id: re.id,                    // id del RoutineExercise
      routineId: re.routineId,
      exerciseId: re.exerciseId,
      dia: re.dia,
      series: re.series,            // viene como string "[10,10,10]" -> lo parsea el frontend
      repeticiones: re.repeticiones,
      descansoSegundos: re.descansoSegundos,
      notas: re.notas,
      // datos del ejercicio base
      exercise: re.Exercise
        ? {
            id: re.Exercise.id,
            nombre: re.Exercise.nombre,
            descripcion: re.Exercise.descripcion,
            categoria: re.Exercise.categoria,
            imagenUrl: re.Exercise.imagenUrl,
            videoUrl: re.Exercise.videoUrl,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: 'Error al obtener ejercicio de la rutina', error: error.message });
  }
};