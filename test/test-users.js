process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');

const API_ROOT = '/api/v1';
chai.use(chaiHttp);

const USERNAME = 'user@test.com';
const PASSWORD = 'hackme';

const createUser = async () => {
  let role = await models.AccountRole.create({
    name: 'USER',
    description: 'User'
  });
  return await models.User.create({
    username: 'Test User',
    account: {
      email: USERNAME,
      password: PASSWORD,
      role_id: role.name
    }
  }, {
    include: [{
      model: models.Account,
      as: 'account'
    }]
  });
};

const login = async () => {
  const res = await chai.request(server).post(`/auth/login`).send({
    email: USERNAME,
    password: PASSWORD
  });
  return res.body.token;
};

const init = async () => {
  await models.sequelize.sync();
  const user = await createUser();
  const token = await login();
  return {
    user: user,
    token: token
  }
};

describe('Users', () => {
  const endpoint = '/user';
  let initObj;

  before((done) => {
    init().then((res) => {
      initObj = res;
      done()
    });
  });

  it(`should READ ALL on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`should READ by QUERY on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).query({
      offset: 1,
      limit: 3,
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`should CREATE SINGLE on ${endpoint} POST`, (done) => {
    const expected = 'Mock User';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send({
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

  it(`should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send([{
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

  it(`should READ a SINGLE on ${endpoint}/:email GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/${USERNAME}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('username');
      done();
    });
  });

  it(`should UPDATE SINGLE on ${endpoint}/:email PUT`, (done) => {
    const expected = 'test username';
    chai.request(server).put(`${API_ROOT}${endpoint}/${USERNAME}`).set('Authorization', `Bearer ${initObj.token}`).send({
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

  it(`should DELETE SINGLE on ${endpoint}/:email DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/${USERNAME}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });

  it(`after deletion not found SINGLE on ${endpoint}/:email GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/${USERNAME}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      should.not.exist(res.body);
      done();
    });
  });
});
