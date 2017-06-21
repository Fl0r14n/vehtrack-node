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
  User.associate = (models) => {
    User.belongsTo(models.Account, {
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'account_id',
        allowNull: false,
        unique: true
      }
    });
    User.belongsToMany(models.Fleet, {
      through: 'FleetUser',
      as: 'Fleets'
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
