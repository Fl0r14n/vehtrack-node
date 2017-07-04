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

const createUserAndRole = async () => {
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

describe('Auth', function () {
  before((done) => {
    models.sequelize.sync().then(() => {
      createUserAndRole().then((user) => {
        done();
      });
    });
  });

  it('username and password should authenticate', (done) => {
    chai.request(server).post('/auth/login').send({
      email: USERNAME,
      password: PASSWORD
    }).end((err, res) => {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.have.property('token');
      res.body.should.have.property('refreshToken');
      done();
    });
  });

  it('username and password should register', (done) => {
    chai.request(server).post('/auth/register').send({
      email: 'new-user@test.com',
      password: 'hackme'
    }).end((err, res) => {
      res.should.redirect;
      done();
    });
  });

  it('existing user when register should return 409', (done) => {
    chai.request(server).post('/auth/register').send({
      email: USERNAME,
      password: PASSWORD
    }).end((err, res) => {
      res.should.have.status(409);
      done();
    })
  });

});

// describe('Logs', () => {
//   const endpoint = '/log';
//   before((done) => {
//     models.sequelize.sync().then(() => {
//       done()
//     });
//   });
//   it('should list ALL logs on /log GET', (done) => {
//     chai.request(server).get(`${API_ROOT}${endpoint}`).end((err, res) => {
//       res.should.have.status(200);
//       res.should.be.json;
//       done();
//     })
//   });
//   it('should list a SINGLE log on /log/<id> GET', (done) => {
//     done();
//   });
//   it('should add a SINGLE log on /log POST', (done) => {
//     chai.request(server).post(`${API_ROOT}${endpoint}`).send({
//       timestamp: new Date(),
//       level: models.Log.level.DEBUG,
//     }).end((err, res) => {
//       res.should.have.status(201);
//       res.should.be.json;
//       res.body.should.be.a('object');
//       res.body.should.have.property('level');
//       res.body.level.should.equal(models.Log.level.DEBUG);
//       done();
//     })
//   });
//   it('should update a SINGLE log on /log/<id> PUT', (done) => {
//     done();
//   });
//   it('should delete a SINGLE log on /log/<id> DELETE', (done) => {
//     done();
//   });
// });
