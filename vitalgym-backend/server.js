require('dotenv').config(); // carga .env

const express = require('express');
const app = require('./src/app'); // tu lógica de rutas, middlewares y db
const path = require('path');

const PORT = process.env.PORT || 3000;

// Sirve archivos subidos públicamente
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Inicia servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor VitalGym en http://localhost:${PORT}`);
});
