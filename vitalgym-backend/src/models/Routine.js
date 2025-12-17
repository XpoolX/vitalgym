module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Routine', {
    nombre: DataTypes.STRING,
    descripcion: DataTypes.TEXT,
    isQuickRoutine: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    shareToken: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    }
  });
};

