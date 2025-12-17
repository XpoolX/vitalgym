const express = require('express');
const router = express.Router();
const controller = require('../controllers/routine.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

// Public route - no authentication required
router.get('/shared/:token', controller.getByShareToken);

// Protected routes - require authentication and admin role
router.use(authMiddleware, adminOnly);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/pdf', controller.generatePDF);
router.post('/:id/share', controller.generateShareToken);
router.get('/:id', controller.getById);


module.exports = router;

