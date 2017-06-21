'use strict';

const models = require('./models');

const DOMAIN = '@vehtrack.com'
const TOTAL_USERS = 10;
const TOTAL_DEVICES = 100;
const TOTAL_FLEETS = TOTAL_USERS / 3;
const MIN_POSITIONS_JOURNEY = 100;
const MAX_POSITIONS_JOURNEY = 150;
const MAX_LOGS_JOURNEY = 5;

let randint = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateRoles = () => {
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
  ]);
};

const generateUsers = () => {
  models.AccountRole.findAll().then((roles) => {
    console.log(roles);
    let users = [];
    for (let i = 0; i < TOTAL_USERS; i++) {
      const username = `user_${i}`;
      const email = username + DOMAIN;
      const password = `pass_${i}`;
      const role = roles[randint(0, roles.length)];
      users.push({
        username: username,
        email: email,
        password: password,
        role: role
      });
    }
    return models.User.bulkCreate(users)
  });
};

// main
generateRoles().then((roles) => {
  console.log(roles);
});

models.User.findAll().then((users) => {
  console.log(users);
});

