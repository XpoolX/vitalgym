const express = require('express');
const router = express.Router();
const controller = require('../controllers/session.controller');
const { authMiddleware, clientOnly } = require('../middlewares/auth.middleware');

router.use(authMiddleware);
router.use(clientOnly);

router.get('/my-routine', controller.getMyRoutine);
router.post('/start-session', controller.startSession);
router.get('/history', controller.getHistory);
router.get('/routine-exercises/:id', controller.getRoutineExerciseById);

module.exports = router;

