module.exports = (sequelize, DataTypes) => {
  return sequelize.define('User', {
    nombre: DataTypes.STRING,
    username: { type: DataTypes.STRING, unique: true, allowNull: false }, // <-- añadido
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false }, // <-- marcar no nulo si quieres
    rol: DataTypes.ENUM('admin', 'cliente'),
    estado: { type: DataTypes.ENUM('ALTA', 'BAJA'), defaultValue: 'ALTA' },
    rutinaAsignadaId: DataTypes.INTEGER,
    imagenUrl: DataTypes.STRING,
    idLlave: DataTypes.STRING,
    direccion: DataTypes.STRING,
    telefono: DataTypes.STRING,
    currentTrainingDay: { type: DataTypes.INTEGER, defaultValue: 1 },
    // Campos de dirección detallada
    calle: DataTypes.STRING,
    codigoPostal: DataTypes.STRING,
    piso: DataTypes.STRING,
    puerta: DataTypes.STRING,
    poblacion: DataTypes.STRING,
    // Campos de pago
    formaPago: { type: DataTypes.ENUM('domiciliado', 'efectivo', 'tarjeta'), defaultValue: 'domiciliado' },
    diaPago: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 1, max: 31 } },
    // Campos de seguimiento
    ultimaApertura: DataTypes.DATE,
    fechaNacimiento: DataTypes.DATE,
    observaciones: DataTypes.TEXT
  }, {
    tableName: 'Users',
    timestamps: true
  });
};