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
  Fleet.getUserFleets = (user) => {
    let account = user.getAccount();
    if (account) {
      let role = account.getRoles();
      if (role) {
        switch (role.name) {
          case 'ADMIN': {
            // return root nodes wo children
            return Fleet.findAll({
              where: {
                parentId: null
              }
            });
          }
          case 'FLEET_ADMIN': {
            // return node + children
            let fleets = user.getFleets();
            return fleets.getDescendants();
          }
          case 'USER': {
            // has only one fleet
            return user.getFleets();
          }
        }
      }
    }
  };
  return Fleet;
};
