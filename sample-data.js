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
      resolve(models.AccountRole.findAll());
    }).catch((e) => {
      resolve(models.AccountRole.findAll());
    });
  })
};

const generateUsers = (roles) => {
  return new Promise((resolve, reject) => {
    let users = [];
    for (let i = 0; i < TOTAL_USERS; i++) {
      const username = `user_${i}`;
      const email = username + DOMAIN;
      const password = `pass_${i}`;
      const role = roles[randint(0, roles.length)];
      models.User.create({
        username: username,
        account: {
          email: email,
          password: password,
          role: role
        }
      }, {
        include: [{
          model: models.Account,
          as: 'account'
        }]
      }).then((user) => {
        users.push(user);
        if (i === TOTAL_USERS - 1) {
          resolve(users);
        }
      })
    }
  });
};

// main
generateRoles().then((roles) => {
  generateUsers(roles).then((users) => {
    console.log(users);
  });
});

