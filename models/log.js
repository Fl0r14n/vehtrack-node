'use strict';
module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    timestamp: DataTypes.DATE,
    level: {
      type: DataTypes.ENUM('ERROR', 'WARN', 'INFO', 'DEBUG'),
      defaultValue: 'DEBUG'
    },
    message: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  });
  Log.associate = (models) => {
    Log.belongsTo(models.Journey, {
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'journey_id',
        allowNull: true
      }
    });
    Log.belongsTo(models.Device, {
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'device_id',
        allowNull: false
      }
    });
  };
  Log.tableName = 'logs';
  Log.LEVEL = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
  };
  return Log;
};
