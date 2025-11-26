module.exports = (sequelize, DataTypes) => {
  return sequelize.define('SessionExercise', {
    nombre: DataTypes.STRING,
    repeticiones: DataTypes.INTEGER,
    completado: DataTypes.BOOLEAN,
    routineExerciseId: DataTypes.INTEGER,
    seriesData: DataTypes.JSON, // Array of { serieNum, reps, kg, completed }
    notas: DataTypes.TEXT // User notes for this exercise
  });
};

