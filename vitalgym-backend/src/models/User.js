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
    currentTrainingDay: { type: DataTypes.INTEGER, defaultValue: 1 }
  }, {
    tableName: 'Users',
    timestamps: true
  });
};