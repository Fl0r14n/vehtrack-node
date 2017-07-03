'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const Account = sequelize.define('Account', {
    email: {
      type: DataTypes.STRING(128),
      primaryKey: true,
      validate: {
        isEmail: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    password: {
      type: DataTypes.STRING(128),
      allowNull: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_login'
    }
  });
  Account.tableName = 'accounts';
  Account.associate = (models) => {
    Account.belongsTo(models.AccountRole, {
      as: 'role',
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'role_id',
      }
    })
  };
  Account._hashPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
  };
  Account.hook('beforeCreate', (account, options) => {
    account.password = Account._hashPassword(account.password);
  });
  Account.hook('beforeUpdate', (account, options) => {
    if (account.password !== account.password) {
      account.password = Account._hashPassword(account.password);
    }
  });
  Account.prototype.authenticate = function (password) {
    if (this.isActive && bcrypt.compareSync(password, this.password)) {
      this.lastLogin = new Date();
      this.save();
      return true;
    } else {
      return false;
    }
  };
  return Account;
};
