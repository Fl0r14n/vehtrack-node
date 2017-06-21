'use strict';
module.exports = function (sequelize, DataTypes) {
  var AccountRole = sequelize.define('AccountRole', {
    name: {
      type: DataTypes.STRING(32),
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  }, {
    classMethods: {
      associate: function (models) {
        AccountRole.belongsTo(models.Account, {
          as: 'Role',
          onDelete: 'CASCADE',
          foreignKey: {
            name: 'account_id',
            allowNull: false
          }
        })
      }
    }
  });
  return AccountRole;
};
