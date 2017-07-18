'use strict';
module.exports = (sequelize, DataTypes) => {
  const Fleet = sequelize.define('Fleet', {
    name: {
      type: DataTypes.STRING(64),
    },
  });
  Fleet.tableName = 'fleets';
  Fleet.associate = (models) => {
    Fleet.belongsTo(models.Fleet, {
      as: 'parent',
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'parent_id',
        allowNull: true
      }
    });
    Fleet.belongsToMany(models.User, {
      as: 'users',
      through: 'users_fleets',
      foreignKey: 'fleet_id',
      otherKey: 'user_id'
    });
    Fleet.belongsToMany(models.Device, {
      as: 'devices',
      through: 'devices_fleets',
      foreignKey: 'fleet_id',
      otherKey: 'device_id'
    })
  };
  return Fleet;
};
