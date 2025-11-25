// models/RoutineExercise.js
module.exports = (sequelize, DataTypes) => {
  const RoutineExercise = sequelize.define('RoutineExercise', {
    exerciseId: DataTypes.INTEGER,
    nombre: DataTypes.STRING,
    dia: DataTypes.INTEGER,
    series: DataTypes.JSON,  // 🆕
    descansoSegundos: DataTypes.INTEGER,
    notas: DataTypes.STRING
  });

  RoutineExercise.associate = (models) => {
    RoutineExercise.belongsTo(models.Exercise, { foreignKey: 'exerciseId', as: 'Exercise' });
    RoutineExercise.belongsTo(models.Routine, { foreignKey: 'routineId', as: 'Routine' });
  };

  return RoutineExercise;
};
