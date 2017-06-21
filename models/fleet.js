'use strict';
module.exports = function (sequelize, DataTypes) {
  var Fleet = sequelize.define('Fleet', {
    name: {
      type: sequelize.STRING(64),
      validate: {
        is: /^[\w.@+-]+$/
      }
    },
    parentId: {
      type: DataTypes.INTEGER,
      hierarchy: true
    }
  }, {
    classMethods: {
      associate: function (models) {
        Fleet.belongsToMany(models.User, {
          through: 'FleetUser',
          as: 'Users'
        });
        Fleet.belongsToMany(models.Device, {
          through: 'FleetDevice',
          as: 'Devices'
        })
      }
    },
    getUserFleets: function (user) {
      var account = user.getAccount();
      if (account) {
        var role = account.getRoles();
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
              var fleets = user.getFleets();
              fleets.getDescendants();
            }
            case 'USER': {
              // has only one fleet
              return user.getFleets();
            }
          }
        }
      }
    }
  });
  return Fleet;
};
