'use strict';
var bcrypt = require('bcryptjs');

module.exports = function (sequelize, DataTypes) {
  var Account = sequelize.define('Account', {
    email: {
      type: sequelize.STRING(128),
      primaryKey: true,
      validate: {
        isEmail: true
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    password: {
      type: sequelize.STRING(128),
      allowNull: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    classMethods: {
      associate: function (models) {
      },
      hashPassword: function (password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
      }
    },
    instanceMethods: {
      authenticate: function (password) {
        if (bcrypt.compareSync(password, this.password)) {
          this.lastLogin = new Date();
          this.save();
          return true;
        } else {
          return false;
        }
      }
    },
    hooks: {
      beforeCreate: function (account, options, done) {
        account.password = Account.hashPassword(account.password);
        return done(null, account)
      },
      beforeUpdate: function (account, options, done) {
        if (account.password !== account.password) {
          account.password = Account.hashPassword(account.password);
          return done(null, account)
        }
      }
    }
  });
  return Account;
};
