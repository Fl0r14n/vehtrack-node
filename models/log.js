'use strict';
module.exports = function(sequelize, DataTypes) {
  var Log = sequelize.define('Log', {
    timestamp: DataTypes.DATE,
    level: {
      type: DataTypes.ENUM('ERROR', 'WARN', 'INFO', 'DEBUG'),
      defaultValue: 'DEBUG'
    },
    message: {
      type: DataTypes.TEXT,
      defaultValue: ''
    }
  }, {
    classMethods: {
      associate: function(models) {
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
      }
    },
    instanceMethods: {
      LEVEL: {
        ERROR: 'ERROR',
        WARN: 'WARN',
        INFO: 'INFO',
        DEBUG: 'DEBUG'
      }
    }
  });
  return Log;
};
