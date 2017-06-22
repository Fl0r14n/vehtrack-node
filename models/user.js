'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING(64),
      validate: {
        is: /^[\w.@+-]+$/
      }
    }
  });
  User.tableName = 'users';
  User.associate = (models) => {
    User.belongsTo(models.Account, {
      as: 'account',
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'account_ptr_id',
        unique: true
      }
    });
    User.belongsToMany(models.Fleet, {
      as: 'Fleets',
      through: 'users_fleets',
      foreignKey: 'user_id',
      otherKey: 'fleet_id'
    })
  };
  User.getFleetUsers = (fleetName) => {
    return new Promise(function (resolve, reject) {
      sequelize.models.Fleet.findOne({
        where: {
          name: fleetName
        }
      }).then(function (fleet) {
        User.findAll({
          where: {
            fleet: {
              $in: fleet.getDescendants()
            }
          }
        }).then(function (users) {
          resolve(users);
        });
      });
    });
  };
  return User;
};
