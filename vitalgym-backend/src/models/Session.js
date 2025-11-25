module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Session', {
    fecha: DataTypes.DATE,
    routineId: DataTypes.INTEGER,
    diaRutina: DataTypes.INTEGER,
    completado: { type: DataTypes.BOOLEAN, defaultValue: false }
  });
};

