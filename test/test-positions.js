process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');
const createUsers = require('../util/generate-users').createUsers;
const generateJourneysForDevice = require('../util/generate-journeys').generateJourneysForDevice;

const API_ROOT = '/api/v1';
chai.use(chaiHttp);

const STOP_DATE = new Date();
const START_DATE = new Date(STOP_DATE - 604800000);

const createSampleData = async () => {
  const result = await createUsers();
  const journeys = await generateJourneysForDevice(result.users['DEVICE'], START_DATE, STOP_DATE);
  result['journeys'] = journeys;
  return result;
};

const init = async () => {
  await models.sequelize.sync();
  return await createSampleData();
};

describe('Positions', () => {
  const endpoint = '/position';
  let initObj;

  before((done) => {
    init().then((res) => {
      initObj = res;
      done()
    });
  });

  it(`USER should READ ALL on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['USER']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`FLEET_ADMIN should READ by QUERY on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).query({
      offset: 1,
      limit: 3,
      device__id: [initObj.users['DEVICE'].id,, 2, 3, 4],
      journey__id: initObj.journeys[0].id,
      timestamp__gte: START_DATE,
      timestamp__lte: STOP_DATE
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`DEVICE should CREATE SINGLE on ${endpoint} POST`, (done) => {
    const expected = 50;
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['DEVICE']}`).send({
      timestamp: new Date(),
      latitude: 24.56,
      longitude: 45.32,
      speed: expected,
      device_id: initObj.users['DEVICE'].id,
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('speed');
      res.body.speed.should.equal(expected);
      done();
    });
  });

  it(`ADMIN should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).send([{
      timestamp: new Date(),
      latitude: 24.56,
      longitude: 45.32,
      speed: 50,
      device_id: initObj.users['DEVICE'].id,
    }, {
      timestamp: new Date(),
      latitude: 24.58,
      longitude: 45.35,
      speed: 52,
      device_id: initObj.users['DEVICE'].id,
    }]).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`USER should READ a SINGLE on ${endpoint}/:id GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['USER']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('speed');
      done();
    });
  });

  it(`ADMIN should UPDATE SINGLE on ${endpoint}/:id PUT`, (done) => {
    const expected = 20;
    chai.request(server).put(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).send({
      speed: expected
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('speed');
      res.body.speed.should.equal(expected);
      done();
    });
  });

  it(`ADMIN should DELETE SINGLE on ${endpoint}/:id DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });
});
