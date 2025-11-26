const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./User')(sequelize, Sequelize);
db.Routine = require('./Routine')(sequelize, Sequelize);
db.RoutineExercise = require('./RoutineExercise')(sequelize, Sequelize);
db.Exercise = require('./Exercise')(sequelize, Sequelize);
db.Session = require('./Session')(sequelize, Sequelize);
db.SessionExercise = require('./SessionExercise')(sequelize, Sequelize);

// Relaciones
db.User.belongsTo(db.Routine, { foreignKey: 'rutinaAsignadaId' });
db.Routine.hasMany(db.RoutineExercise, { foreignKey: 'routineId' });
db.Session.hasMany(db.SessionExercise, { foreignKey: 'sessionId' });
db.SessionExercise.belongsTo(db.Session, { foreignKey: 'sessionId' });
db.User.hasMany(db.Session, { foreignKey: 'userId' });

module.exports = db;

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
