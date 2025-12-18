const express = require('express');
const cors = require('cors');
const exerciseRoutes = require('./routes/exercise.routes');

require('dotenv').config();

const app = express();

// CORS configuration - allow requests from production and development
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://vitalgym.fit',
      'https://www.vitalgym.fit'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now - can be restricted later
    }
  },
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Public routes (no authentication)
const routineRoutes = require('./routes/routine.routes');
app.use('/api/routines', routineRoutes);

// Protected admin routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin/users', require('./routes/user.routes'));
app.use('/api/admin/routines', routineRoutes); // Reuse the same router
app.use('/api/client', require('./routes/client.routes'));
app.use('/api/admin/exercises', exerciseRoutes);

module.exports = app;

