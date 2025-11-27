const bcrypt = require('bcryptjs');
const db = require('../models');
const User = db.User;

// Obtener todos los usuarios (sin mostrar la contraseña)
exports.getAllUsers = async (req, res) => {
  try {
    // Devuelve todos los campos excepto la contraseña
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Crear nuevo usuario (con imagen)
// Ahora acepta el campo "username" (nombre de usuario) además de los anteriores
exports.createUser = async (req, res) => {
  try {
    const { 
      nombre, username, email, password, rol, idLlave, direccion, telefono,
      calle, codigoPostal, piso, puerta, poblacion, formaPago, diaPago,
      fechaNacimiento, observaciones
    } = req.body;

    // Validaciones básicas
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email y password son obligatorios' });
    }

    // Verificar si ya existe el email
    const existeEmail = await User.findOne({ where: { email } });
    if (existeEmail) return res.status(400).json({ message: 'Ya existe un usuario con ese email' });

    // Verificar si ya existe el username
    const existeUsername = await User.findOne({ where: { username } });
    if (existeUsername) return res.status(400).json({ message: 'Ya existe ese nombre de usuario' });

    // Hashear la contraseña
    const hashed = await bcrypt.hash(password, 10);

    // Procesar imagen si se envía
    let imagenUrl = null;
    if (req.files && req.files.imagen && req.files.imagen.length > 0) {
      const imagen = req.files.imagen[0];
      imagenUrl = `/uploads/${imagen.filename}`;
    } else if (req.file && req.file.filename) {
      // en caso de usar single file middleware (multer.single('imagen'))
      imagenUrl = `/uploads/${req.file.filename}`;
    }

    const nuevo = await User.create({
      nombre,
      username,
      email,
      password: hashed,
      rol,
      imagenUrl,
      idLlave,
      direccion,
      telefono,
      calle,
      codigoPostal,
      piso,
      puerta,
      poblacion,
      formaPago,
      diaPago: diaPago ? parseInt(diaPago, 10) : null,
      fechaNacimiento: fechaNacimiento || null,
      observaciones
    });

    res.status(201).json({ message: 'Usuario creado', id: nuevo.id });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// Actualizar usuario (incluye cambio de imagen opcional)
// Ahora permite actualizar username y password con comprobación de unicidad en username
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const datos = { ...req.body };

    // Si se quiere cambiar el username, comprobar que no lo tenga otro usuario
    if (datos.username) {
      const otro = await User.findOne({ where: { username: datos.username } });
      if (otro && otro.id.toString() !== id.toString()) {
        return res.status(400).json({ message: 'Ese nombre de usuario ya está en uso' });
      }
    }

    // Si se envía contraseña, hashearla antes de actualizar
    if (datos.password) {
      datos.password = await bcrypt.hash(datos.password, 10);
    }

    // Procesar imagen si se envía
    if (req.files && req.files.imagen && req.files.imagen.length > 0) {
      const imagen = req.files.imagen[0];
      datos.imagenUrl = `/uploads/${imagen.filename}`;
    } else if (req.file && req.file.filename) {
      datos.imagenUrl = `/uploads/${req.file.filename}`;
    }

    await User.update(datos, { where: { id } });
    res.json({ message: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Eliminar usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await User.destroy({ where: { id } });
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// Cambiar estado del usuario (ALTA/BAJA)
exports.toggleStatus = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const nuevoEstado = user.estado === 'ALTA' ? 'BAJA' : 'ALTA';
    await user.update({ estado: nuevoEstado });

    res.json({ message: `Estado cambiado a ${nuevoEstado}`, estado: nuevoEstado });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al cambiar el estado del usuario' });
  }
};

// Obtener todos los usuarios con todos los campos (antes incluía password)
// Por seguridad, ahora devuelvo todos los campos menos la contraseña
exports.getAll = async (req, res) => {
  try {
    const usuarios = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener todos los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener todos los usuarios', error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const hashed = await bcrypt.hash(password, 10);
    await user.update({ password: hashed });

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña', error: error.message });
  }
};

// Usuario autenticado: cambiar su propia contraseña (requiere contraseña antigua)
exports.changeOwnPassword = async (req, res) => {
  try {
    const userId = req.user && req.user.id; // asumo que authMiddleware pone req.user
    if (!userId) return res.status(401).json({ message: 'No autenticado' });

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Debe proporcionar contraseña antigua y nueva' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) return res.status(400).json({ message: 'Contraseña antigua incorrecta' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashed });

    res.json({ message: 'Contraseña cambiada correctamente' });
  } catch (error) {
    console.error('Error cambiando propia contraseña:', error);
    res.status(500).json({ message: 'Error al cambiar la contraseña', error: error.message });
  }
};

// Obtener estadísticas de un usuario (sesiones, entrenamientos, etc.)
exports.getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const Session = db.Session;
    const { Op } = db.Sequelize;

    const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    // Obtener todas las sesiones del usuario
    const sessions = await Session.findAll({
      where: { userId: id, completado: true },
      order: [['fecha', 'DESC']],
      attributes: ['id', 'fecha', 'diaRutina', 'completado']
    });

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    // Calcular estadísticas
    const sessionsLastWeek = sessions.filter(s => new Date(s.fecha) >= oneWeekAgo);
    const sessionsLastMonth = sessions.filter(s => new Date(s.fecha) >= oneMonthAgo);
    const sessionsLastYear = sessions.filter(s => new Date(s.fecha) >= oneYearAgo);

    // Obtener la última sesión
    const ultimaSesion = sessions.length > 0 ? sessions[0].fecha : null;

    // Calcular medias
    const entrenosPorSemana = sessionsLastMonth.length / 4; // promedio semanal del último mes
    const entrenosPorMes = sessionsLastYear.length / 12; // promedio mensual del último año

    // Calcular racha actual de días consecutivos
    let rachaActual = 0;
    if (sessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Agrupar por día
      const diasEntrenados = new Set();
      sessions.forEach(s => {
        const fecha = new Date(s.fecha);
        fecha.setHours(0, 0, 0, 0);
        diasEntrenados.add(fecha.getTime());
      });
      
      // Contar racha desde hoy o ayer
      let checkDate = new Date(today);
      // Si hoy no entrenó, empezar desde ayer
      if (!diasEntrenados.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }
      
      while (diasEntrenados.has(checkDate.getTime())) {
        rachaActual++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    // Calcular total de horas entrenadas (estimando 1 hora por sesión)
    const totalHorasEntrenadas = sessions.length; // aproximado

    res.json({
      ultimaSesion,
      ultimaApertura: user.ultimaApertura,
      entrenosSemana: sessionsLastWeek.length,
      entrenosMes: sessionsLastMonth.length,
      entrenosAnio: sessionsLastYear.length,
      promedioSemanal: Math.round(entrenosPorSemana * 10) / 10,
      promedioMensual: Math.round(entrenosPorMes * 10) / 10,
      totalEntrenos: sessions.length,
      rachaActual,
      totalHorasEntrenadas,
      fechaRegistro: user.createdAt
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error: error.message });
  }
};