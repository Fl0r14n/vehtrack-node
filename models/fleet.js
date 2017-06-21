'use strict';
module.exports = (sequelize, DataTypes) => {
  const Fleet = sequelize.define('Fleet', {
    name: {
      type: DataTypes.STRING(64),
      validate: {
        is: /^[\w.@+-]+$/
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      hierarchy: true
    }
  });
  Fleet.associate = (models) => {
    Fleet.belongsToMany(models.User, {
      through: 'FleetUser',
      as: 'Users'
    });
    Fleet.belongsToMany(models.Device, {
      through: 'FleetDevice',
      as: 'Devices'
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
