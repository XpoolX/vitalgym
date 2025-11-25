module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Routine', {
    nombre: DataTypes.STRING,
    descripcion: DataTypes.TEXT
  });
};

