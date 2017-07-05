process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');
const sampleUtil = require('../sample-util');

const API_ROOT = '/api/v1';
chai.use(chaiHttp);

const USERNAME = 'test@test.com';
const PASSWORD = 'hackme';
const DEVICE = 'device@test.com';
const START_DATE = new Date();
const STOP_DATE = new Date(START_DATE - 604800000);

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
    serial: 'serial_test',
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
  console.log('1===============================');
  const sampleData = await createSampleData();
  console.log('2===============================');
  const token = await login();
  return {
    sampleData: sampleData,
    token: token
  }
};

describe('Logs', () => {
  const endpoint = '/log';
  let initObj;

  before((done) => {
    init().then((res) => {
      initObj = res;
      done()
    });
  });

  it('should list ALL logs on /log GET', (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      console.log(res.body);
      done();
    })
  });

  // it('should list a SINGLE log on /log/:id GET', (done) => {
  //   done();
  // });
  //
  // it('should add a SINGLE log on /log POST', (done) => {
  //   chai.request(server).post(`${API_ROOT}${endpoint}`).send({
  //     timestamp: new Date(),
  //     level: models.Log.level.DEBUG,
  //   }).end((err, res) => {
  //     res.should.have.status(201);
  //     res.should.be.json;
  //     res.body.should.be.a('object');
  //     res.body.should.have.property('level');
  //     res.body.level.should.equal(models.Log.level.DEBUG);
  //     done();
  //   })
  // });
  //
  // it('should update a SINGLE log on /log/<id> PUT', (done) => {
  //   done();
  // });
  //
  // it('should delete a SINGLE log on /log/<id> DELETE', (done) => {
  //   done();
  // });
});
