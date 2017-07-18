process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');
const sampleUtil = require('./util/sample-util');

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
  let device = await models.Device.create({
    type: 'test',
    description: 'test device',
    account: {
      email: DEVICE,
      password: PASSWORD,
      role_id: role.name
    }
  }, {
    include: [{
      model: models.Account,
      as: 'account'
    }]
  });
  let journeys = await sampleUtil.generateJourneysForDevice(device, START_DATE, STOP_DATE);
  return {
    user: user,
    device: device,
    journeys: journeys
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

describe('Journeys', () => {
  const endpoint = '/journey';
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
      device__id: [initObj.sampleData.device.id, 2, 3, 4]
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`should CREATE SINGLE on ${endpoint} POST`, (done) => {
    const expected = 20;
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send({
      timestamp: new Date(),
      device_id: initObj.sampleData.device.id,
      startLatitude: 25.01,
      stopLatitude: 25.05,
      startLongitude: 45.01,
      stopLongitude: 45.03,
      startTimestamp: new Date(new Date() - 108000),
      stopTimestamp: new Date(),
      averageSpeed: expected
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('averageSpeed');
      res.body.averageSpeed.should.equal(expected);
      done();
    });
  });

  it(`should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send([{
      timestamp: new Date(),
      device_id: initObj.sampleData.device.id,
      startLatitude: 25.01,
      stopLatitude: 25.05,
      startLongitude: 45.01,
      stopLongitude: 45.03,
      startTimestamp: new Date(new Date() - 108000),
      stopTimestamp: new Date(),
      averageSpeed: 20
    }, {
      timestamp: new Date(),
      device_id: initObj.sampleData.device.id,
      startLatitude: 25.01,
      stopLatitude: 25.05,
      startLongitude: 45.01,
      stopLongitude: 45.03,
      startTimestamp: new Date(new Date() - 108000),
      stopTimestamp: new Date(),
      averageSpeed: 30
    }]).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`should READ a SINGLE on ${endpoint}/:id GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('averageSpeed');
      done();
    });
  });

  it(`should UPDATE SINGLE on ${endpoint}/:id PUT`, (done) => {
    const expected = 50;
    chai.request(server).put(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.token}`).send({
      averageSpeed: 50
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('averageSpeed');
      res.body.averageSpeed.should.equal(expected);
      done();
    });
  });

  it(`should DELETE SINGLE on ${endpoint}/:id DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });
});
