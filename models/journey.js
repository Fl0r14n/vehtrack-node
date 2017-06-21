'use strict';
module.exports = function (sequelize, DataTypes) {
  var Journey = sequelize.define('Journey', {
    startLatitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -90,
        max: 90
      },
      description: 'gg.ggggg'
    },
    startLongitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -180,
        max: 180
      },
      description: 'gg.ggggg'
    },
    startTimestamp: {
      type: DataTypes.DATE,
      description: 'ms'
    },
    stopLatitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -90,
        max: 90
      },
      description: 'gg.ggggg'
    },
    stopLongitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -180,
        max: 180
      },
      description: 'gg.ggggg'
    },
    stopTimestamp: {
      type: DataTypes.DATE,
      description: 'ms'
    },
    distance: {
      type: DataTypes.BIGINT,
      description: 'm'
    },
    averageSpeed: {
      type: DataTypes.FLOAT,
      description: 'km/h'
    },
    maximumSpeed: {
      types: DataTypes.FLOAT,
      description: 'km/h'
    },
    duration: {
      types: DataTypes.FLOAT,
      description: 'ms'
    }
  }, {
    classMethods: {
      associate: function (models) {
        Journey.belongsTo(models.Device, {
          onDelete: 'CASCADE',
          foreignKey: {
            name: 'device_id',
            allowNull: false
          }
        });
      },
      haversine: function (startLat, startLng, stopLat, stopLng) {
        var degreeToRad = Math.PI / 180.0;
        var dLat = (stopLat - startLat) * degreeToRad;
        var dLong = (stopLng - startLng) * degreeToRad;
        var a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(startLat * degreeToRad) *
          Math.cos(stopLat * degreeToRad) * Math.pow(Math.sin(dLong / 2), 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return 6367 * c; //km
      }
    },
    hooks: {
      beforeSave: function (journey, options, done) {
        journey.duration = Journey.haversine(journey.startLatitude, journey.startLongitude, journey.stopLatitude, journey.stopLongitude);
        journey.duration = journey.stopTimestamp - journey.startTimestamp;
        return done(null, journey);
      }
    }
  });
  return Journey;
};
