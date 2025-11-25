const express = require('express');
const cors = require('cors');
const exerciseRoutes = require('./routes/exercise.routes');

require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/auth', require('./routes/auth.routes'));
app.use('/admin/users', require('./routes/user.routes'));
app.use('/admin/routines', require('./routes/routine.routes'));
app.use('/client', require('./routes/client.routes'));
app.use('/admin/exercises', exerciseRoutes);

module.exports = app;

