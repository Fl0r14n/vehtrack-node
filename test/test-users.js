process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');

const API_ROOT = '/api/v1';
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

const init = async () => {
  await models.sequelize.sync();
  return await createUsers();
};

describe('Users', () => {
  const endpoint = '/user';
  let initObj;

  before((done) => {
    init().then((res) => {
      initObj = res;
      done();
    });
  });

  it(`USER should be able to read his profile`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/profile`).set('Authorization', `Bearer ${initObj.tokens['USER']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      done();
    });
  });

  it(`USER should be able to edit his profile`, (done) => {
    const expected = 'test username';
    chai.request(server).put(`${API_ROOT}${endpoint}/profile`).set('Authorization', `Bearer ${initObj.tokens['USER']}`).send({
      username: expected,
      account: {
        password: 'hackmenow'
      }
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal(expected);
      done();
    });
  });

  it(`USER should get his fleets`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/fleet`).set('Authorization', `Bearer ${initObj.tokens['USER']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`FLEET_ADMIN should get his top level fleets`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/fleet`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      console.log(res.body);
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`ADMIN should get all top level fleets`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/fleet`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`ADMIN should READ ALL on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`ADMIN should READ by QUERY on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).query({
      offset: 1,
      limit: 3,
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`ADMIN should CREATE SINGLE on ${endpoint} POST`, (done) => {
    const expected = 'Mock User';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).send({
      username: expected,
      account: {
        email: 'mockuser@test.com',
        password: PASSWORD,
        role_id: 'USER'
      }
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal(expected);
      done();
    });
  });

  it(`ADMIN should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).send([{
      username: 'Mock1',
      account: {
        email: 'mock1user@test.com',
        password: PASSWORD,
        role_id: 'USER'
      }
    }, {
      username: 'Mock2',
      account: {
        email: 'mock2user@test.com',
        password: PASSWORD,
        role_id: 'USER'
      }
    }]).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`ADMIN should READ a SINGLE on ${endpoint}/:email GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/${initObj.users['USER'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      done();
    });
  });

  it(`ADMIN should UPDATE SINGLE on ${endpoint}/:email PUT`, (done) => {
    const expected = 'test username';
    chai.request(server).put(`${API_ROOT}${endpoint}/${initObj.users['USER'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).send({
      username: expected,
      account: {
        password: 'hackmenow'
      }
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      res.body.username.should.equal(expected);
      done();
    });
  });

  it(`ADMIN should DELETE SINGLE on ${endpoint}/:email DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/${initObj.users['USER'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });

  it(`ADMIN after deletion not found SINGLE on ${endpoint}/:email GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/${initObj.users['USER'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      should.not.exist(res.body);
      done();
    });
  });
});
