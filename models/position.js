'use strict';
module.exports = function (sequelize, DataTypes) {
  var Position = sequelize.define('Position', {
    latitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -90,
        max: 90
      }
    },
    longitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -180,
        max: 180
      }
    },
    timestamp: {
      type: DataTypes.DATE
    },
    speed: {
      type: DataTypes.FLOAT,
      defaultValue: 0.0
    }
  }, {
    classMethods: {
      associate: function (models) {
        Position.belongsTo(models.Journey, {
          onDelete: 'CASCADE',
          foreignKey: {
            name: 'journey_id',
            allowNull: true
          }
        });
        Position.belongsTo(models.Device, {
          onDelete: 'CASCADE',
          foreignKey: {
            name: 'device_id',
            allowNull: false
          }
        });
      }
    }
  });
  return Position;
};
