process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');
const createUsers = require('../util/generate-users').createUsers;

const API_ROOT = '/api/v1';
chai.use(chaiHttp);

const init = async () => {
  await models.sequelize.sync();
  let result = await createUsers();
  return result;
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

  it(`FLEET_ADMIN should CREATE SINGLE on ${endpoint} POST`, (done) => {
    const expected = 'Mock Fleet';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).send({
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

  it(`FLEET_ADMIN should CREATE MULTIPLE on ${endpoint} POST`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).send([{
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

  it(`ADMIN should READ a SINGLE on ${endpoint}/:id GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      done();
    });
  });

  it(`FLEET_ADMIN should UPDATE SINGLE on ${endpoint}/:id PUT`, (done) => {
    const expected = 'test node';
    chai.request(server).put(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).send({
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

  it(`FLEET_ADMIN should READ ALL on ${endpoint} GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
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
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    });
  });

  it(`FLEET_ADMIN should ASSIGN user to fleet`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}/1/user/${initObj.users['USER'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`FLEET_ADMIN should READ ALL users assigned to fleet`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1/user/`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    })
  });

  it(`FLEET_ADMIN should REMOVE user from fleet`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1/user/${initObj.users['USER'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`FLEET_ADMIN should ASSIGN device to fleet`, (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}/1/device/${initObj.users['DEVICE'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`FLEET_ADMIN should READ ALL devices assigned to fleet`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1/device/`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('array');
      done();
    })
  });

  it(`FLEET_ADMIN should REMOVE device from fleet`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1/device/${initObj.users['DEVICE'].account.email}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(201);
      done();
    })
  });

  it(`FLEET_ADMIN should DELETE SINGLE on ${endpoint}/:id DELETE`, (done) => {
    chai.request(server).delete(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).end((err, res) => {
      res.should.have.status(204);
      done();
    });
  });

  it(`ADMIN after deletion not found SINGLE on ${endpoint}/:id GET`, (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}/1`).set('Authorization', `Bearer ${initObj.tokens['ADMIN']}`).end((err, res) => {
      res.should.have.status(200);
      should.not.exist(res.body);
      done();
    });
  });

  it(`FLEET_ADMIN should create fleet with subfleet on ${endpoint} POST`, (done) => {
    const expectedParent = 'Parent Fleet';
    const expectedChild = 'Child Fleet';
    chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).send({
      name: expectedParent,
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('name');
      res.body.name.should.equal(expectedParent);
      res.body.should.have.property('id');
      let expectedParentId = res.body.id;

      chai.request(server).post(`${API_ROOT}${endpoint}`).set('Authorization', `Bearer ${initObj.tokens['FLEET_ADMIN']}`).send({
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

