'use strict';
module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define('Device', {
    serial: {
      type: DataTypes.UUID,
      unique: true,
      defaultValue: DataTypes.UUIDV4
    },
    type: {
      type:DataTypes.STRING(30),
      defaultValue: ''
    },
    description: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    phone: {
      type: DataTypes.STRING(12),
      allowNull: true,
      defaultValue: null,
      validate: {
        is: {
          args: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
          msg: 'Enter a valid phone number!'
        }
      }
    },
    plate: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null
    },
    vin: {
      type: DataTypes.STRING(17),
      allowNull: true,
      defaultValue: null,
      validate: {
        is: {
          args: /^[0-9A-Z-[IOQ]]{17}$/,
          msg: 'Enter a valid Vehicle Identification Number!'
        }
      }
    },
    imei: {
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
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
      type: DataTypes.STRING(15),
      allowNull: true,
      defaultValue: null,
      validate: {
        is: {
          args: /^[0-9]{14,15}$/,
          msg: 'Enter a valid International mobile subscriber identity!'
        }
      }
    },
    msisdn: {
      type: DataTypes.STRING(14),
      allowNull: true,
      defaultValue: null,
      validate: {
        is: {
          args: /^[1-9]\d{6,14}$/,
          msg: 'Enter a valid mobile subscriber integrated services digital network number!'
        }
      }
    }
  });
  Device.tableName = 'devices';
  Device.associate = (models) => {
    Device.belongsTo(models.Account, {
      as: 'account',
      onDelete: 'CASCADE',
      foreignKey: {
        name: 'account_ptr_id',
        unique: true
      }
    });
    Device.belongsToMany(models.Fleet, {
      as: 'fleets',
      through: 'devices_fleets',
      foreignKey: 'fleet_id',
      otherKey: 'device_id'
    })
  };
  Device.luhnChecksum = (value) => {
    let nCheck = 0, bEven = false;
    value = value.replace(/\D/g, "");
    for (let n = value.length - 1; n >= 0; n--) {
      let cDigit = value.charAt(n);
      let nDigit = parseInt(cDigit, 10);
      if (bEven) {
        if ((nDigit *= 2) > 9) nDigit -= 9;
      }
      nCheck += nDigit;
      bEven = !bEven;
    }
    return (nCheck % 10) === 0;
  };
  Device.getFleetDevices = (fleetName) => {
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
  };
  return Device;
};

