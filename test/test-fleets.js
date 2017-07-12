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

const createDevice = async () => {
  let role = await models.AccountRole.create({
    name: 'DEVICE',
    description: 'Device'
  });
  return await models.Device.create({
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
  const device = await createDevice();
  return {
    user: user,
    token: token,
    device: device
  }
};

describe('Fleets', () => {
  const endpoint = '/fleet';
  let initObj;

  before((done) => {
    init().then((res) => {
      initObj = res;
      done()
    });
  });

  it(`should CREATE SINGLE on ${endpoint} POST`, (done) => {
    const expected = 'Mock Fleet';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send({
      name: expected,
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal(expected);
      done();
    });
  });

  it(`should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send([{
      name: 'Node 1',
    }, {
      name: 'Node 2',
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
      res.body.should.have.property('name');
      done();
    });
  });

  it(`should UPDATE SINGLE on ${endpoint}/:id PUT`, (done) => {
    const expected = 'test node';
    chai.request(server).put(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.token}`).send({
      name: expected,
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal(expected);
      done();
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

  it(`should ASSIGN user to fleet`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}/1/user/${USERNAME}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`should READ ALL users assigned to fleet`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1/user/`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    })
  });

  it(`should REMOVE user from fleet`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1/user/${USERNAME}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`should ASSIGN device to fleet`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}/1/device/${DEVICE}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`should READ ALL devices assigned to fleet`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1/device/`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    })
  });

  it(`should REMOVE device from fleet`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1/device/${DEVICE}`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`should DELETE SINGLE on ${endpoint}/:id DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });

  it(`after deletion not found SINGLE on ${endpoint}/:id GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.token}`).end((err, res) => {
      res.should.have.status(200);
      should.not.exist(res.body);
      done();
    });
  });

  it(`should create fleet with subfleet on ${endpoint} POST`, (done) => {
    const expectedParent = 'Parent Fleet';
    const expectedChild = 'Child Fleet';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send({
      name: expectedParent,
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal(expectedParent);
      res.body.should.have.property('id');
      let expectedParentId = res.body.id;

      chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.token}`).send({
        name: expectedChild,
        parent_id: expectedParentId
      }).end((err, res) => {
        res.should.have.status(201);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('name');
        res.body.name.should.equal(expectedChild);
        res.body.should.have.property('parent_id');
        res.body.parent_id.should.equal(expectedParentId);
        done();
      });
    });
  });
});

