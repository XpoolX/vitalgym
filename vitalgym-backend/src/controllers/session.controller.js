const db = require('../models');
const User = db.User;
const Routine = db.Routine;
const RoutineExercise = db.RoutineExercise;
const Session = db.Session;
const SessionExercise = db.SessionExercise;
const Exercise = db.Exercise;

// Helper function to get available days from routine exercises
function getAvailableDays(routineExercises) {
  return [...new Set(routineExercises.map(re => re.dia))].sort((a, b) => a - b);
}

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

    // Verificar que el usuario tiene una rutina asignada
    const user = await User.findByPk(req.user.id, { attributes: ['rutinaAsignadaId'] });
    if (!user || !user.rutinaAsignadaId) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    // Buscar el ejercicio verificando que pertenece a la rutina del usuario
    const re = await RoutineExercise.findOne({
      where: { id, routineId: user.rutinaAsignadaId },
      include: [
        {
          model: Exercise,
          as: 'Exercise',
          attributes: [
            'id',
            'nombre',
            'descripcion',
            'zonaCorporal',
            'grupoMuscular',
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
            zonaCorporal: re.Exercise.zonaCorporal,
            grupoMuscular: re.Exercise.grupoMuscular,
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

// Obtener el día de entrenamiento actual del usuario
exports.getCurrentTrainingDay = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'rutinaAsignadaId', 'currentTrainingDay'],
      include: {
        model: Routine,
        include: [RoutineExercise]
      }
    });

    if (!user || !user.Routine) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    // Obtener todos los días disponibles en la rutina using helper
    const diasDisponibles = getAvailableDays(user.Routine.RoutineExercises);
    const currentDay = user.currentTrainingDay || 1;

    // Si el día actual es mayor que los días disponibles, volver al día 1
    const diaActual = diasDisponibles.includes(currentDay) ? currentDay : diasDisponibles[0] || 1;

    res.json({
      currentTrainingDay: diaActual,
      totalDays: diasDisponibles.length,
      availableDays: diasDisponibles,
      routineId: user.Routine.id,
      routineName: user.Routine.nombre
    });
  } catch (error) {
    console.error('Error getting current training day:', error);
    res.status(500).json({ message: 'Error al obtener día de entrenamiento', error: error.message });
  }
};

// Obtener ejercicios del día actual para entrenar
exports.getTrainingDayExercises = async (req, res) => {
  try {
    const { dia } = req.params;
    const dayNum = parseInt(dia, 10);

    const user = await User.findByPk(req.user.id, { attributes: ['rutinaAsignadaId'] });
    if (!user || !user.rutinaAsignadaId) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    const ejercicios = await RoutineExercise.findAll({
      where: { routineId: user.rutinaAsignadaId, dia: dayNum },
      include: [
        {
          model: Exercise,
          as: 'Exercise',
          attributes: ['id', 'nombre', 'descripcion', 'imagenUrl', 'videoUrl']
        }
      ],
      order: [['id', 'ASC']]
    });

    const result = ejercicios.map(re => ({
      id: re.id,
      routineId: re.routineId,
      exerciseId: re.exerciseId,
      dia: re.dia,
      series: re.series,
      descansoSegundos: re.descansoSegundos || 90,
      notas: re.notas,
      exercise: re.Exercise ? {
        id: re.Exercise.id,
        nombre: re.Exercise.nombre,
        descripcion: re.Exercise.descripcion,
        imagenUrl: re.Exercise.imagenUrl,
        videoUrl: re.Exercise.videoUrl
      } : null
    }));

    res.json(result);
  } catch (error) {
    console.error('Error getting training day exercises:', error);
    res.status(500).json({ message: 'Error al obtener ejercicios del día', error: error.message });
  }
};

// Guardar sesión de entrenamiento completada
exports.saveCompletedWorkout = async (req, res) => {
  try {
    const { diaRutina, ejercicios } = req.body;

    // Input validation
    if (!Number.isInteger(diaRutina) || diaRutina < 1) {
      return res.status(400).json({ message: 'El día de rutina debe ser un número entero positivo' });
    }
    if (!Array.isArray(ejercicios) || ejercicios.length === 0) {
      return res.status(400).json({ message: 'Debe proporcionar al menos un ejercicio' });
    }

    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'rutinaAsignadaId', 'currentTrainingDay'],
      include: {
        model: Routine,
        include: [RoutineExercise]
      }
    });

    if (!user || !user.Routine) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    // Crear sesión
    const nuevaSesion = await Session.create({
      userId: req.user.id,
      fecha: new Date(),
      routineId: user.rutinaAsignadaId,
      diaRutina: diaRutina,
      completado: true
    });

    // Guardar ejercicios con sus series using bulkCreate
    const sessionExercisesData = ejercicios.map(ej => ({
      sessionId: nuevaSesion.id,
      nombre: ej.nombre,
      repeticiones: ej.repeticiones || null,
      completado: true,
      routineExerciseId: ej.routineExerciseId,
      seriesData: ej.seriesData, // Array de { serieNum, reps, kg, completed }
      notas: ej.notas || null // User notes for this exercise
    }));
    await SessionExercise.bulkCreate(sessionExercisesData);

    // Calcular el siguiente día de entrenamiento using helper
    const diasDisponibles = getAvailableDays(user.Routine.RoutineExercises);
    const currentIndex = diasDisponibles.indexOf(diaRutina);
    const nextDay = currentIndex >= 0 && currentIndex < diasDisponibles.length - 1
      ? diasDisponibles[currentIndex + 1]
      : diasDisponibles[0]; // Volver al primer día si terminamos

    // Actualizar el día de entrenamiento del usuario
    await user.update({ currentTrainingDay: nextDay });

    res.status(201).json({
      message: 'Entrenamiento guardado correctamente',
      sessionId: nuevaSesion.id,
      nextTrainingDay: nextDay
    });
  } catch (error) {
    console.error('Error saving completed workout:', error);
    res.status(500).json({ message: 'Error al guardar entrenamiento', error: error.message });
  }
};

// Obtener días completados con sus fechas
exports.getCompletedDays = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['rutinaAsignadaId'] });
    if (!user || !user.rutinaAsignadaId) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    // Buscar todas las sesiones completadas de esta rutina
    const sessions = await Session.findAll({
      where: { 
        userId: req.user.id, 
        routineId: user.rutinaAsignadaId,
        completado: true 
      },
      attributes: ['id', 'diaRutina', 'fecha'],
      order: [['fecha', 'DESC']]
    });

    // Agrupar por día y obtener la fecha más reciente de cada uno
    const completedDays = {};
    for (const session of sessions) {
      if (session.diaRutina && !completedDays[session.diaRutina]) {
        completedDays[session.diaRutina] = {
          dia: session.diaRutina,
          fecha: session.fecha,
          sessionId: session.id
        };
      }
    }

    res.json(Object.values(completedDays));
  } catch (error) {
    console.error('Error getting completed days:', error);
    res.status(500).json({ message: 'Error al obtener días completados', error: error.message });
  }
};

// Obtener datos del último entrenamiento de un ejercicio específico
exports.getLastExerciseData = async (req, res) => {
  try {
    const { routineExerciseId } = req.params;
    const reId = parseInt(routineExerciseId, 10);

    if (!Number.isInteger(reId) || reId < 1) {
      return res.status(400).json({ message: 'ID de ejercicio inválido' });
    }

    const user = await User.findByPk(req.user.id, { attributes: ['rutinaAsignadaId'] });
    if (!user || !user.rutinaAsignadaId) {
      return res.status(404).json({ message: 'No tienes rutina asignada' });
    }

    // Buscar el último SessionExercise con este routineExerciseId
    const lastExercise = await SessionExercise.findOne({
      where: { routineExerciseId: reId },
      include: [{
        model: Session,
        where: { 
          userId: req.user.id,
          routineId: user.rutinaAsignadaId,
          completado: true
        },
        attributes: ['fecha']
      }],
      order: [[Session, 'fecha', 'DESC']]
    });

    if (!lastExercise) {
      return res.json({ found: false });
    }

    res.json({
      found: true,
      seriesData: lastExercise.seriesData || [],
      notas: lastExercise.notas || '',
      fecha: lastExercise.Session?.fecha
    });
  } catch (error) {
    console.error('Error getting last exercise data:', error);
    res.status(500).json({ message: 'Error al obtener datos del último entrenamiento', error: error.message });
  }
};