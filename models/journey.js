'use strict';
module.exports = (sequelize, DataTypes) => {
  const Journey = sequelize.define('Journey', {
    startLatitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -90,
        max: 90
      },
      field: 'start_latitude',
      description: 'gg.ggggg'
    },
    startLongitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -180,
        max: 180
      },
      field: 'start_longitude',
      description: 'gg.ggggg'
    },
    startTimestamp: {
      type: DataTypes.DATE,
      field: 'start_timestamp',
      description: 'ms'
    },
    stopLatitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -90,
        max: 90
      },
      field: 'stop_latitude',
      description: 'gg.ggggg'
    },
    stopLongitude: {
      type: DataTypes.FLOAT,
      validate: {
        min: -180,
        max: 180
      },
      field: 'stop_longitude',
      description: 'gg.ggggg'
    },
    stopTimestamp: {
      type: DataTypes.DATE,
      field: 'stop_timestamp',
      description: 'ms'
    },
    distance: {
      type: DataTypes.BIGINT,
      description: 'm'
    },
    averageSpeed: {
      type: DataTypes.FLOAT,
      field: 'average_speed',
      description: 'km/h'
    },
    maximumSpeed: {
      type: DataTypes.FLOAT,
      field: 'maximum_speed',
      description: 'km/h'
    },
    duration: {
      type: DataTypes.FLOAT,
      description: 'ms'
    }
  });
  Journey.tableName = 'journeys';
  Journey.associate = (models) => {
    Journey.belongsTo(models.Device, {
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'device_id',
        allowNull: false
      }
    });
  };
  Journey._haversine = (startLat, startLng, stopLat, stopLng) => {
    let degreeToRad = Math.PI / 180.0;
    let dLat = (stopLat - startLat) * degreeToRad;
    let dLong = (stopLng - startLng) * degreeToRad;
    let a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(startLat * degreeToRad) *
      Math.cos(stopLat * degreeToRad) * Math.pow(Math.sin(dLong / 2), 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return 6367 * c; //km
  };
  Journey.beforeSave = (journey, options, done) => {
    journey.duration = Journey._haversine(journey.startLatitude, journey.startLongitude, journey.stopLatitude, journey.stopLongitude);
    journey.duration = journey.stopTimestamp - journey.startTimestamp;
    return done(null, journey);
  };
  return Journey;
};
