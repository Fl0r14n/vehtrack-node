'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING(64),
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
      as: 'fleets',
      through: 'users_fleets',
      foreignKey: 'user_id',
      otherKey: 'fleet_id'
    })
  };
  return User;
};
