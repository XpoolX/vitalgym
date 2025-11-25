const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');
const multer = require('multer');
const path = require('path');
const db = require('../models');
const User = db.User;

// Configurar multer para guardar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `imagen-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// Rutas accesibles solo por admin
router.get('/', adminOnly, controller.getAllUsers); // Retorna usuarios sin password
router.post('/', adminOnly, upload.fields([{ name: 'imagen', maxCount: 1 }]), controller.createUser);
router.put('/:id', adminOnly, upload.fields([{ name: 'imagen', maxCount: 1 }]), controller.updateUser);
router.delete('/:id', adminOnly, controller.deleteUser);
router.patch('/:id/toggle-status', adminOnly, controller.toggleStatus);

// PATCH para que el admin cambie la contraseña de cualquier usuario
router.patch('/:id/password', adminOnly, controller.changePassword);

// Ruta para que el usuario autenticado cambie SU propia contraseña (no requiere admin)
router.patch('/me/password', controller.changeOwnPassword);

// Asignar rutina (admin)
router.post('/assign-routine', adminOnly, async (req, res) => {
  try {
    const { userId, routineId } = req.body;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    user.rutinaAsignadaId = routineId;
    await user.save();

    res.json({ message: 'Rutina asignada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al asignar rutina', error: error.message });
  }
});

module.exports = router;