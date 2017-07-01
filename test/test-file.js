process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');
const API_ROOT = '/api/v1';
chai.use(chaiHttp);


describe('Auth', function () {
  // TODO
});

describe('Logs', () => {
  const endpoint = '/log';
  before((done) => {
    models.sequelize.sync().then(() => {
      done()
    });
  });
  it('should list ALL logs on /log GET', (done) => {
    chai.request(server).get(`${API_ROOT}${endpoint}`).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      done();
    })
  });
  it('should list a SINGLE log on /log/<id> GET', (done) => {
    done();
  });
  it('should add a SINGLE log on /log POST', (done) => {
    chai.request(server).post(`${API_ROOT}${endpoint}`).send({
      timestamp: new Date(),
      level: models.Log.level.DEBUG,
    }).end((err, res) => {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('level');
      res.body.level.should.equal(models.Log.level.DEBUG);
      done();
    })
  });
  it('should update a SINGLE log on /log/<id> PUT', (done) => {
    done();
  });
  it('should delete a SINGLE log on /log/<id> DELETE', (done) => {
    done();
  });
});
