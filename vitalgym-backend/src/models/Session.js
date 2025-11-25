module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Session', {
    fecha: DataTypes.DATE
  });
};

