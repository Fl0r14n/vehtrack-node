'use strict';
module.exports = function (sequelize, DataTypes) {
  const AccountRole = sequelize.define('AccountRole', {
    name: {
      type: DataTypes.STRING(32),
      primaryKey: true
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    }
  });
  AccountRole.tableName = 'roles';
  AccountRole.associate = (models) => {
  };
  return AccountRole;
};
