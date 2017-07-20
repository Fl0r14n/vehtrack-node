const models = require('../models');
const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../app');

chai.use(chaiHttp);

const DOMAIN = 'test.com';
const PASSWORD = 'hackme';

const createUsers = async () => {
  let users = {};
  let tokens = {};
  let roleNames = ['ADMIN', 'FLEET_ADMIN', 'USER', 'DEVICE'];

  for (let roleName of roleNames) {
    const email = `${roleName}@${DOMAIN}`;
    // create role
    let role = await models.AccountRole.create({
      name: roleName,
      description: roleName
    });
    // create user
    users[roleName] = await models.User.create({
      username: roleName,
      account: {
        email: email,
        password: PASSWORD,
        role_id: role.name
      }
    }, {
      include: [{
        model: models.Account,
        as: 'account'
      }]
    });
    // do login
    const res = await chai.request(server).post(`/auth/login`).send({
      email: `${roleName}@${DOMAIN}`,
      password: PASSWORD
    });
    tokens[roleName] = res.body.token;
  }
  return {
    users: users,
    tokens: tokens
  };
};

exports.createUsers = createUsers;
