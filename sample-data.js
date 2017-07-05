'use strict';

const L = require('./logger');
const models = require('./models');
const sampleUtil = require('./sample-util');

const GENERATE_WITH_FLEETS = true;
const DOMAIN = '@vehtrack.com';
const TOTAL_USERS = 10;
const TOTAL_DEVICES = 100;
const TOTAL_FLEETS = TOTAL_USERS / 3;
const START_DATE = new Date();
START_DATE.setMonth(START_DATE.getMonth() - 1);
const STOP_DATE = new Date();

let randint = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRoles = () => {
  return new Promise((resolve, reject) => {
    return models.AccountRole.bulkCreate([
      {
        name: 'ADMIN',
        description: 'Super user'
      },
      {
        name: 'FLEET_ADMIN',
        description: 'Fleet Administrator'
      },
      {
        name: 'USER',
        description: 'User'
      },
      {
        name: 'DEVICE',
        description: 'Device'
      }
    ]).then(() => {
      resolve(models.AccountRole.findAll({
        where: {
          name: {
            $notIn: ['ADMIN', 'DEVICE']
          }
        }
      }));
    }).catch((e) => {
      L.error(e);
      reject(e);
    });
  })
};

const generateFleets = async () => {

  const generateFleet = async (parent, depth, fleetList) => {
    // add child siblings
    let sibling = 0;
    while (randint(0, 1) === 1) {
      const childName = `${parent.name}_(d:${depth}_s:${sibling})`;
      L.info(childName);

      let childFleet;
      try {
        childFleet = await models.Fleet.create({
          name: childName,
          parentId: parent.parentId
        });
      } catch (err) {
        L.error(err);
      }
      if (fleetList && childFleet) {
        fleetList.push(childFleet);
      }
      sibling += 1;
      // add children to child
      if (randint(0, 1) === 1) {
        await generateFleet(childFleet, depth + 1)
      }
    }
  };

  L.info('Generating fleets=============================================');
  let fleets = [];
  for (let group = 0; group < TOTAL_FLEETS; group++) {
    const name = `fg:${group}`;
    L.info(name);
    let fleet;
    try {
      fleet = await models.Fleet.create({
        name: name
      });
      fleets.push(fleet);
    } catch (err) {
      L.error(err);
    }
    await generateFleet(fleet, 1, fleets);
  }

  return fleets;
};

const generateUsersForFleets = async (fleets, roles) => {
  L.info('Generating users for fleets=====================================');
  let users = [];
  for (let fleet of fleets) {
    L.debug(`Fleet: ${fleet.name}`);
    let userId = await models.User.count();
    const username = `user_${userId}`;
    const email = username + DOMAIN;
    const password = `pass_${userId}`;
    const role = roles[randint(0, roles.length - 1)];
    let user;
    try {
      user = await models.User.create({
        username: username,
        account: {
          email: email,
          password: password,
          role_id: role.name
        }
      }, {
        include: [{
          model: models.Account,
          as: 'account'
        }]
      });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        L.warn(`${username} already created!`);
      } else {
        L.error(e);
      }
      user = await models.User.findOne({
        where: {
          username: username
        }
      })
    }
    // assign user to fleet
    let userFleets = await user.getFleets();
    userFleets.push(fleet);
    await user.setFleets(userFleets);
    users.push(user);
  }
  return users;
};

const generateDevicesForFleets = async (fleets) => {
  L.info('Generating devices for fleets==================================');
  let role = await models.AccountRole.findById('DEVICE');
  let devices = [];
  for (let fleet of fleets) {
    L.debug(`Fleet: ${fleet.name}`);
    let deviceId = await models.Device.count();
    const type = `mk_${deviceId % 3}`;
    const description = 'This is a mock device';
    const email = `device_${deviceId}${DOMAIN}`;
    const password = `device_${deviceId}`;
    let device;
    try {
      device = await models.Device.create({
        type: type,
        description: description,
        account: {
          email: email,
          password: password,
          role_id: role.name
        }
      }, {
        include: [{
          model: models.Account,
          as: 'account'
        }]
      });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        L.warn(`${serial} already created!`);
      } else {
        L.error(e);
      }
      device = await models.Device.findOne({
        where: {
          serial: serial
        }
      })
    }
    let deviceFleets = await device.getFleets();
    deviceFleets.push(fleet);
    await device.setFleets(deviceFleets);
    devices.push(device);
  }
  return devices;
};

const generateUsers = async (roles) => {
  let users = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    const username = `user_${i}`;
    const email = username + DOMAIN;
    const password = `pass_${i}`;
    const role = roles[randint(0, roles.length - 1)];
    let user;
    try {
      user = await models.User.create({
        username: username,
        account: {
          email: email,
          password: password,
          role_id: role.name
        }
      }, {
        include: [{
          model: models.Account,
          as: 'account'
        }]
      });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        L.warn(`${username} already created!`);
      } else {
        L.error(e);
      }
      user = await models.User.findOne({
        where: {
          username: username
        }
      })
    }
    users.push(user);
  }
  return users;
};

const generateDevices = async () => {
  let devices = [];
  let role = await models.AccountRole.findById('DEVICE');
  for (let i = 0; i < TOTAL_DEVICES; i++) {
    const type = `mk_${i % 3}`;
    const description = 'This is a mock device';
    const email = `device_${i}${DOMAIN}`;
    const password = `device_${i}`;
    let device;
    try {
      device = await models.Device.create({
        serial: serial,
        type: type,
        description: description,
        account: {
          email: email,
          password: password,
          role_id: role.name
        }
      }, {
        include: [{
          model: models.Account,
          as: 'account'
        }]
      });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        L.warn(`${serial} already created!`);
      } else {
        L.error(e);
      }
      device = await models.Device.findOne({
        where: {
          serial: serial
        }
      });
    }
    devices.push(device);
  }
  return devices;
};

// main
models.sequelize.sync().then(() => {
  generateRoles().then((roles) => {
    if (GENERATE_WITH_FLEETS) {
      generateFleets().then((fleets) => {
        generateUsersForFleets(fleets, roles).then((users) => {
        });
        generateDevicesForFleets(fleets).then((devices) => {
          for (let device of devices) {
            sampleUtil.generateJourneysForDevice(device, null, START_DATE, STOP_DATE);
          }
        })
      });
    } else {
      generateUsers(roles).then((users) => {
      });
      generateDevices().then((devices) => {
        for (let device of devices) {
          sampleUtil.generateJourneysForDevice(device, null, START_DATE, STOP_DATE);
        }
      });
    }
  });
});
