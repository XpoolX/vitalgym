module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SessionExercise', {
    nombre: DataTypes.STRING,
    repeticiones: DataTypes.INTEGER,
    completado: DataTypes.BOOLEAN
  });
};

