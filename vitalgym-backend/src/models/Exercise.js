module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Exercise', {
    nombre: DataTypes.STRING,
    descripcion: DataTypes.TEXT,
    zonaCorporal: DataTypes.STRING,
    grupoMuscular: DataTypes.STRING,
    equipo: DataTypes.STRING,
    nivel: DataTypes.STRING,
    descripcionCorta: DataTypes.STRING,
    instrucciones: DataTypes.TEXT,
    consejos: DataTypes.TEXT,
    videoUrl: DataTypes.STRING,
    imagenUrl: DataTypes.STRING
  });
};