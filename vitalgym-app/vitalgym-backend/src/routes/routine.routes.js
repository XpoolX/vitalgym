const express = require('express');
const router = express.Router();
const controller = require('../controllers/routine.controller');
const { authMiddleware, adminOnly } = require('../middlewares/auth.middleware');

router.use(authMiddleware, adminOnly);

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.get('/:id/pdf', controller.generatePDF);
router.get('/:id', controller.getById); // ← esto usa el getById que debe estar exportado


module.exports = router;

