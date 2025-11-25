const express = require('express');
const router = express.Router();
const controller = require('../controllers/exercise.controller');
const upload = require('../middlewares/upload.middleware'); // nuevo
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

router.use(authMiddleware, adminOnly);

router.get('/', controller.getAll);

// Aquí modificamos solo la ruta POST para permitir archivos:
router.post(
  '/',
  upload.fields([
    { name: 'imagen', maxCount: 1 },
    { name: 'video', maxCount: 1 }
  ]),
  controller.create
);
router.post('/', upload.fields([{ name: 'imagen' }, { name: 'video' }]), controller.create);
router.put('/:id', upload.fields([{ name: 'imagen' }, { name: 'video' }]), controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

