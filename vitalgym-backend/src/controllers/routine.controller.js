const { Routine, RoutineExercise, Exercise } = require('../models');
const PDFDocument = require('pdfkit');
const crypto = require('crypto');

/**
 * Helper: formatea/normaliza series (siempre devuelve array de strings)
 */
function normalizeSeries(series) {
  if (series == null) return [];
  if (Array.isArray(series)) return series.map((s) => String(s).trim()).filter(Boolean);
  if (typeof series === 'number') return [String(series)];
  if (typeof series === 'object') {
    try {
      // objeto que no es array -> convertir a string y tratar
      return [String(series)];
    } catch {
      return [];
    }
  }

  // es string: limpiar
  let s = String(series).trim();

  // Intentar parsear JSON repetidamente (maneja doble-encoding)
  for (let i = 0; i < 3; i++) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean);
      if (parsed == null) return [];
      s = String(parsed).trim();
    } catch {
      break;
    }
  }

  // quitar comillas externas
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }

  // quitar corchetes externos
  if (s.startsWith('[') && s.endsWith(']')) {
    s = s.slice(1, -1).trim();
  }

  if (s === '') return [];

  // extraer números como fallback
  const numberMatches = s.match(/-?\d+(\.\d+)?/g);
  if (numberMatches && numberMatches.length) {
    return numberMatches.map((n) => String(n));
  }

  // dividir por separadores comunes
  const parts = s.split(/[,;\/\|\-]+|\s+/).map((p) => p.trim()).filter(Boolean);
  return parts.map((p) => p.replace(/^["']|["']$/g, '').trim());
}

/**
 * Helper para preparar valor a guardar en DB según tipo de columna
 * - Si la columna series está tipada como JSON en el modelo, devuelve el array tal cual.
 * - Si es STRING/VARCHAR, devuelve JSON.stringify(array) o null.
 */
function prepareSeriesForSave(rawSeries) {
  // detectar tipo de atributo si está disponible
  const attr = (RoutineExercise && RoutineExercise.rawAttributes && RoutineExercise.rawAttributes.series) || null;
  const isJsonType = attr && attr.type && (String(attr.type).toLowerCase().includes('json') || (attr.type.key && attr.type.key.toUpperCase() === 'JSON'));
  if (rawSeries == null) return null;

  // si llega un array, normalizarlo primero
  const normalized = Array.isArray(rawSeries) ? rawSeries.map(x => (typeof x === 'string' ? x.trim() : String(x))) : rawSeries;

  if (isJsonType) {
    return Array.isArray(normalized) ? normalized : [String(normalized)];
  } else {
    // guardamos como string JSON para columnas VARCHAR
    try {
      return JSON.stringify(Array.isArray(normalized) ? normalized : [String(normalized)]);
    } catch {
      return null;
    }
  }
}

/**
 * Obtener todas las rutinas
 */
exports.getAll = async (req, res) => {
  try {
    const rutinas = await Routine.findAll({ order: [['createdAt', 'DESC']] });
    res.json(rutinas);
  } catch (error) {
    console.error('Error getAll routines:', error);
    res.status(500).json({ message: 'Error al obtener rutinas', error: error.message });
  }
};

/**
 * Obtener una rutina específica con ejercicios
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const rutina = await Routine.findByPk(id);
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    // Determina atributos válidos de Exercise según modelo
    const exerciseAttrs = Object.keys(Exercise.rawAttributes || {});
    const desiredExerciseAttrs = ['nombre', 'descripcion', 'zonaCorporal', 'grupoMuscular', 'equipo', 'nivel', 'descripcionCorta', 'instrucciones', 'consejos', 'videoUrl', 'imagenUrl'];
    const requestedAttrs = desiredExerciseAttrs.filter(a => exerciseAttrs.includes(a));

    const ejercicios = await RoutineExercise.findAll({
      where: { routineId: id },
      include: [{ model: Exercise, as: 'Exercise', ...(requestedAttrs.length ? { attributes: requestedAttrs } : {}) }],
      order: [['dia', 'ASC'], ['id', 'ASC']]
    });

    const dias = {};
    ejercicios.forEach(ej => {
      // raw value from DB (could be null, string, array depending on column)
      const raw = ej.series;
      const parsed = normalizeSeries(raw);

      // si no hay series, usar repeticiones como fallback
      const finalSeries = (Array.isArray(parsed) && parsed.length) ? parsed : (ej.repeticiones ? [String(ej.repeticiones)] : []);

      if (!dias[ej.dia]) dias[ej.dia] = [];
      dias[ej.dia].push({
        exerciseId: ej.exerciseId,
        nombre: ej.Exercise?.nombre || null,
        imagenUrl: ej.Exercise?.imagenUrl || null,
        seriesRaw: raw,               // opcional para debugging; quita en producción
        series: finalSeries,          // siempre array de strings
        repeticiones: ej.repeticiones,
        descansoSegundos: ej.descansoSegundos,
        notas: ej.notas
      });
    });

    const diasArray = Object.keys(dias)
      .map(dia => ({ dia: parseInt(dia, 10), ejercicios: dias[dia] }))
      .sort((a, b) => a.dia - b.dia);

    res.json({
      id: rutina.id,
      nombre: rutina.nombre,
      descripcion: rutina.descripcion,
      dias: diasArray
    });
  } catch (error) {
    console.error('Error al obtener rutina:', error);
    res.status(500).json({ message: 'Error al obtener rutina', error: error.message });
  }
};

/**
 * Crear nueva rutina
 */
exports.create = async (req, res) => {
  try {
    const { nombre, descripcion, dias, isQuickRoutine } = req.body;
    console.log('========== CREATE ROUTINE REQUEST ==========');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Creating routine:', { nombre, descripcion, isQuickRoutine, diasCount: dias?.length });
    console.log('Dias is Array?', Array.isArray(dias));
    console.log('Dias value:', dias);
    
    const nuevaRutina = await Routine.create({ 
      nombre, 
      descripcion,
      isQuickRoutine: isQuickRoutine || false
    });
    console.log('Routine created with ID:', nuevaRutina.id);

    if (Array.isArray(dias)) {
      console.log('Processing dias array:', dias.length, 'days');
      for (const diaData of dias) {
        console.log(`Processing day ${diaData.dia} with ${diaData.ejercicios?.length || 0} exercises`);
        console.log('Day data:', JSON.stringify(diaData, null, 2));
        for (const ej of diaData.ejercicios || []) {
          const exerciseData = {
            routineId: nuevaRutina.id,
            exerciseId: ej.exerciseId,
            dia: diaData.dia,
            series: prepareSeriesForSave(ej.series),
            repeticiones: ej.repeticiones ?? null,
            descansoSegundos: ej.descansoSegundos ?? null,
            notas: ej.notas ?? null
          };
          console.log('Creating RoutineExercise:', JSON.stringify(exerciseData, null, 2));
          await RoutineExercise.create(exerciseData);
        }
      }
      console.log('All exercises created successfully');
    } else {
      console.log('WARNING: dias is not an array or is undefined!');
    }
    console.log('========== END CREATE ROUTINE REQUEST ==========');

    res.status(201).json({ message: 'Rutina creada', id: nuevaRutina.id });
  } catch (error) {
    console.error('Error al crear rutina:', error);
    res.status(500).json({ message: 'Error al crear rutina', error: error.message });
  }
};

/**
 * Actualizar rutina
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, dias } = req.body;

    const rutina = await Routine.findByPk(id);
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    await rutina.update({ nombre, descripcion });
    await RoutineExercise.destroy({ where: { routineId: id } });

    if (Array.isArray(dias)) {
      for (const diaData of dias) {
        for (const ej of diaData.ejercicios || []) {
          await RoutineExercise.create({
            routineId: id,
            exerciseId: ej.exerciseId,
            dia: diaData.dia,
            series: prepareSeriesForSave(ej.series),
            repeticiones: ej.repeticiones ?? null,
            descansoSegundos: ej.descansoSegundos ?? null,
            notas: ej.notas ?? null
          });
        }
      }
    }

    res.json({ message: 'Rutina actualizada' });
  } catch (error) {
    console.error('Error al actualizar rutina:', error);
    res.status(500).json({ message: 'Error al actualizar rutina', error: error.message });
  }
};

/**
 * Eliminar rutina
 */
exports.remove = async (req, res) => {
  try {
    const rutina = await Routine.findByPk(req.params.id);
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    await RoutineExercise.destroy({ where: { routineId: rutina.id } });
    await rutina.destroy();

    res.json({ message: 'Rutina eliminada' });
  } catch (error) {
    console.error('Error al eliminar rutina:', error);
    res.status(500).json({ message: 'Error al eliminar rutina', error: error.message });
  }
};

/**
 * PDF generation (opcional)
 */
exports.generatePDF = async (req, res) => {
  try {
    const { id } = req.params;

    const exerciseAttrs = Object.keys(Exercise.rawAttributes || {});
    const desiredExerciseAttrs = ['nombre', 'imagenUrl'];
    const requestedAttrs = desiredExerciseAttrs.filter(a => exerciseAttrs.includes(a));

    const rutina = await Routine.findByPk(id, {
      include: [{
        model: RoutineExercise,
        include: [{ model: Exercise, as: 'Exercise', ...(requestedAttrs.length ? { attributes: requestedAttrs } : {}) }]
      }]
    });

    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Rutina_${(rutina.nombre || 'sin_nombre').replace(/\s+/g, '_')}.pdf"`);
    doc.pipe(res);

    doc.font('Helvetica-Bold').fontSize(20).text(String(rutina.nombre || '').toUpperCase(), { align: 'center' }).moveDown(1);

    const byDay = {};
    (rutina.RoutineExercises || []).forEach(re => {
      const dia = re.dia ?? 1;
      if (!byDay[dia]) byDay[dia] = [];
      byDay[dia].push(re);
    });

    Object.keys(byDay).sort((a, b) => a - b).forEach(diaKey => {
      doc.addPage();
      doc.font('Helvetica-Bold').fontSize(16).text(`Día ${diaKey}`, { underline: true }).moveDown(0.5);
      byDay[diaKey].forEach((re, i) => {
        const nombre = re.Exercise?.nombre || '(sin nombre)';
        const seriesText = normalizeSeries(re.series).join(' - ');
        const rep = re.repeticiones ? ` x${re.repeticiones}` : '';
        doc.font('Helvetica').fontSize(12).text(`${i + 1}. ${nombre} ${seriesText ? `| Series: ${seriesText}` : ''}${rep}`);
      });
    });

    doc.end();
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ error: 'Error generando PDF', details: err.message });
  }
};

/**
 * Generate share token for quick routine
 */
exports.generateShareToken = async (req, res) => {
  try {
    const { id } = req.params;
    const rutina = await Routine.findByPk(id);
    
    if (!rutina) return res.status(404).json({ message: 'Rutina no encontrada' });
    if (!rutina.isQuickRoutine) return res.status(400).json({ message: 'Solo se pueden compartir rutinas rápidas' });
    
    // Generate a unique token if it doesn't exist
    if (!rutina.shareToken) {
      const token = crypto.randomBytes(16).toString('hex');
      await rutina.update({ shareToken: token });
    }
    
    res.json({ shareToken: rutina.shareToken });
  } catch (error) {
    console.error('Error generating share token:', error);
    res.status(500).json({ message: 'Error al generar token', error: error.message });
  }
};

/**
 * Get quick routine by share token (public, no auth)
 */
exports.getByShareToken = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Fetching routine with token:', token);
    
    const rutina = await Routine.findOne({ where: { shareToken: token } });
    
    if (!rutina) {
      console.log('Routine not found for token:', token);
      return res.status(404).json({ message: 'Rutina no encontrada', token });
    }
    
    console.log('Found routine:', { id: rutina.id, nombre: rutina.nombre, isQuickRoutine: rutina.isQuickRoutine });
    
    if (!rutina.isQuickRoutine) {
      console.log('Routine is not a quick routine');
      return res.status(400).json({ message: 'Rutina no válida' });
    }
    
    // Get exercises without image URLs for quick routines
    const ejercicios = await RoutineExercise.findAll({
      where: { routineId: rutina.id },
      include: [{ 
        model: Exercise, 
        as: 'Exercise', 
        attributes: ['nombre', 'grupoMuscular', 'zonaCorporal']
      }],
      order: [['dia', 'ASC'], ['id', 'ASC']]
    });
    
    console.log('Found exercises:', ejercicios.length);
    
    const dias = {};
    ejercicios.forEach(ej => {
      const raw = ej.series;
      const parsed = normalizeSeries(raw);
      const finalSeries = (Array.isArray(parsed) && parsed.length) ? parsed : (ej.repeticiones ? [String(ej.repeticiones)] : []);
      
      if (!dias[ej.dia]) dias[ej.dia] = [];
      dias[ej.dia].push({
        exerciseId: ej.exerciseId,
        nombre: ej.Exercise?.nombre || null,
        grupoMuscular: ej.Exercise?.grupoMuscular || null,
        series: finalSeries,
        descansoSegundos: ej.descansoSegundos,
        notas: ej.notas
      });
    });
    
    const diasArray = Object.keys(dias)
      .map(dia => ({ dia: parseInt(dia, 10), ejercicios: dias[dia] }))
      .sort((a, b) => a.dia - b.dia);
    
    console.log('Returning routine with', diasArray.length, 'days');
    
    res.json({
      id: rutina.id,
      nombre: rutina.nombre,
      descripcion: rutina.descripcion,
      dias: diasArray
    });
  } catch (error) {
    console.error('Error al obtener rutina compartida:', error);
    res.status(500).json({ message: 'Error al obtener rutina', error: error.message });
  }
};