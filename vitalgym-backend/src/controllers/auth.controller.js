const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;

exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    const existe = await User.findOne({ where: { email } });
    if (existe) return res.status(400).json({ message: 'Ya existe un usuario con ese email' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await User.create({
      nombre,
      email,
      password: hashedPassword,
      rol: rol || 'cliente'
    });

    res.status(201).json({ message: 'Usuario creado', id: nuevoUsuario.id });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await User.findOne({ where: { email } });
    if (!usuario) return res.status(400).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, usuario.password);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login correcto',
      token,
      user: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, imagen: usuario.imagenUrl, estado: usuario.estado }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error al hacer login', error: error.message });
  }
};

