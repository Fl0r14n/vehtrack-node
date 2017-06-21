'use strict';
module.exports = function (sequelize, DataTypes) {
  var Device = sequelize.define('Device', {
    serial: sequelize.STRING(30),
    type: sequelize.STRING(30),
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    phone: {
      type: sequelize.STRING(12),
      defaultValue: '',
      validate: {
        is: {
          args: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
          msg: 'Enter a valid phone number!'
        }
      }
    },
    plate: {
      type: sequelize.STRING(30),
      defaultValue: ''
    },
    vin: {
      type: sequelize.STRING(17),
      defaultValue: '',
      validate: {
        is: {
          args: /^[0-9A-Z-[IOQ]]{17}$/,
          msg: 'Enter a valid Vehicle Identification Number!'
        }
      }
    },
    imei: {
      type: sequelize.STRING(15),
      defaultValue: '',
      validate: {
        is: {
          args: /^[0-9]{15}$/,
          msg: 'Enter a valid International Mobile Station Equipment Identity!'
        },
        luhnChecksum: function (value) {
          if (Device.luhnChecksum(value) !== 0) {
            throw new Error('Enter a valid International Mobile Station Equipment Identity!')
          }
        }
      }
    },
    imsi: {
      type: sequelize.STRING(15),
      defaultValue: '',
      validate: {
        is: {
          args: /^[0-9]{14,15}$/,
          msg: 'Enter a valid International mobile subscriber identity!'
        }
      }
    },
    msisdn: {
      type: sequelize.STRING(14),
      defaultValue: '',
      validate: {
        is: {
          args: /^[1-9]\d{6,14}$/,
          msg: 'Enter a valid mobile subscriber integrated services digital network number!'
        }
      }
    }
  }, {
    classMethods: {
      associate: function (models) {
        Device.belongsTo(models.Account, {
          onDelete: 'CASCADE',
          foreignKey: {
            name: 'account_id',
            allowNull: false,
            unique: true
          }
        });
        Device.belongsToMany(models.Fleet, {
          through: 'FleetDevice',
          as: 'Fleets'
        })
      },
      luhnChecksum: function (value) {
        var nCheck = 0, bEven = false;
        value = value.replace(/\D/g, "");
        for (var n = value.length - 1; n >= 0; n--) {
          var cDigit = value.charAt(n);
          var nDigit = parseInt(cDigit, 10);
          if (bEven) {
            if ((nDigit *= 2) > 9) nDigit -= 9;
          }
          nCheck += nDigit;
          bEven = !bEven;
        }
        return (nCheck % 10) === 0;
      },
      getFleetDevices: function (fleetName) {
        return new Promise(function (resolve, reject) {
          sequelize.models.Fleet.findOne({
            where: {
              name: fleetName
            }
          }).then(function (fleet) {
            Device.findAll({
              where: {
                fleets: {
                  $in: fleet.getDescendants()
                }
              }
            }).then(function (users) {
              resolve(users);
            });
          });
        });
      }
    }
  });
  return Device;
};

