const express = require('express');
const router = express.Router();
const controller = require('../controllers/session.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.get('/my-routine', controller.getMyRoutine);
router.post('/start-session', controller.startSession);
router.get('/history', controller.getHistory);
router.get('/routine-exercises/:id', controller.getRoutineExerciseById);
router.get('/current-training-day', controller.getCurrentTrainingDay);
router.get('/training-day/:dia/exercises', controller.getTrainingDayExercises);
router.post('/complete-workout', controller.saveCompletedWorkout);
router.get('/completed-days', controller.getCompletedDays);

module.exports = router;

