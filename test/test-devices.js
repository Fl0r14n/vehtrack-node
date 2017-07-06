process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');

const API_ROOT = '/api/v1';
chai.use(chaiHttp);

const USERNAME = 'test@test.com';
const PASSWORD = 'hackme';
const DEVICE = 'device@test.com';
const STOP_DATE = new Date();
const START_DATE = new Date(STOP_DATE - 604800000);

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

const createSampleData = async () => {
  let user = await createUser();
  let role = await models.AccountRole.create({
    name: 'DEVICE',
    description: 'Device'
  });
  let devices = [];
  for (let i = 0; i < 3; i++) {
    let device = await models.Device.create({
      type: 'test',
      description: `test device ${i}`,
      account: {
        email: `device_${i}@test.com`,
        password: PASSWORD,
        role_id: role.name
      }
    }, {
      include: [{
        model: models.Account,
        as: 'account',
      }]
    });
    devices.push(device);
  }
  return {
    user: user,
    devices: devices,
  }
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
  const sampleData = await createSampleData();
  const token = await login();
  return {
    sampleData: sampleData,
    token: token
  }
};

describe('Devices', () => {
  const endpoint = '/device';
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
    const expected = 'mock test device';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send({
      type: 'test',
      description: expected,
      account: {
        email: 'mockdevice@test.com',
        password: PASSWORD,
        role_id: 'DEVICE'
      }
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('description');
      res.body.description.should.equal(expected);
      done();
    });
  });

  it(`should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send([{
      type: 'test',
      account: {
        email: 'mock1device@test.com',
        password: PASSWORD,
        role_id: 'DEVICE'
      }
    }, {
      type: 'test',
      account: {
        email: 'mock2device@test.com',
        password: PASSWORD,
        role_id: 'DEVICE'
      }
    }]).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`should READ a SINGLE on ${endpoint}/:email GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/device_1@test.com`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('description');
      done();
    });
  });

  it(`should UPDATE SINGLE on ${endpoint}/:email PUT`, (done) => {
    const expected = 'test description';
    chai.request(server).put(`${API_ROOT}${endpoint}/device_1@test.com`).set('Authorization', `Bearer ${initObj.token}`).send({
      description: expected,
      account: {
        password: 'hackmenow'
      }
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('description');
      res.body.description.should.equal(expected);
      done();
    });
  });

  it(`should DELETE SINGLE on ${endpoint}/:email DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/device_1@test.com`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });

  it(`after deletion not found SINGLE on ${endpoint}/:email GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/device_1@test.com`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      should.not.exist(res.body);
      done();
    });
  });
});
