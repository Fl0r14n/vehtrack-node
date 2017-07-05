process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const server = require('../app');
const models = require('../models');

chai.use(chaiHttp);

const USERNAME = 'test@test.com';
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

describe('Auth', function () {
  const endpoint = '/auth';

  before((done) => {
    models.sequelize.sync().then(() => {
      createUser().then(() => {
        done();
      });
    });
  });

  it('username and password should authenticate', (done) => {
    chai.request(server).post(`${endpoint}/login`).send({
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
    chai.request(server).post(`${endpoint}/register`).send({
      email: 'new-user@test.com',
      password: 'hackme'
    }).end((err, res) => {
      res.should.redirect;
      done();
    });
  });

  it('existing user when register should return 409', (done) => {
    chai.request(server).post(`${endpoint}/register`).send({
      email: USERNAME,
      password: PASSWORD
    }).end((err, res) => {
      res.should.have.status(409);
      done();
    })
  });

  it('not logged in user should not be abe to access logout', (done) => {
    chai.request(server).post(`${endpoint}/logout`).end((err, res) => {
      res.should.have.status(401);
      done();
    })
  });

  it('logged in user should logout', (done) => {
    chai.request(server).post(`${endpoint}/login`).send({
      email: USERNAME,
      password: PASSWORD
    }).end((err, res) => {
      const token = res.body.token;
      chai.request(server).post(`${endpoint}/logout`).set('Authorization', `Bearer ${token}`).end((err, res) => {
        res.should.have.status(204);
        done();
      })
    });
  });

  it('not logged in user should not be able to access refresh token', (done) => {
    chai.request(server).post(`${endpoint}/refresh`).end((err, res) => {
      res.should.have.status(401);
      done();
    });
  });

  it('logged in user should be able to use refresh token', (done) => {
    chai.request(server).post(`${endpoint}/login`).send({
      email: USERNAME,
      password: PASSWORD
    }).end((err, res) => {
      const token = res.body.token;
      const refreshToken = res.body.refreshToken;
      chai.request(server).post(`${endpoint}/refresh`).set('Authorization', `Bearer ${token}`).send({
        refreshToken: refreshToken
      }).end((err, res) => {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.have.property('token');
        done();
      })
    });
  })
});
