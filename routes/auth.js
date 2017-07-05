const passport = require('passport');
const JsonStrategy = require('passport-json').Strategy;
const jwt = require('jsonwebtoken');
const ejwt = require('express-jwt');
const express = require('express');
const router = express.Router();
const models = require('../models');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env]['jwt'];

passport.use(new JsonStrategy({
  usernameProp: 'email',
  passwordProp: 'password'
}, (email, password, next) => {
  models.Account.findById(email).then((account) => {
    if (!account) return next(null, false);
    return next(null, account.authenticate(password) ? account : false);
  });
}));

router.post('/auth/login', (req, res, next) => {
  passport.authenticate('json', function (err, account, info) {
    if (err) return next(err);
    if (!account) {
      return res.status(401).json({
        status: 'error',
        code: 'unauthorized'
      });
    } else {
      return res.json({
        token: jwt.sign({
          email: account.email,
          role: account.role
        }, config.token.secret, {
          expiresIn: config.token.expiresIn
        }),
        refreshToken: jwt.sign({
          email: account.email,
          role: account.role
        }, config.refreshToken.secret, {
          expiresIn: config.refreshToken.expiresIn
        })
      });
    }
  })(req, res, next);
});

router.post('/auth/refresh', (req, res) => {
  const token = getToken(req);
  jwt.verify(token, config.token.secret, (err, decoded) => {
    console.log(decoded);
    const owner = decoded.email;
    const role = decoded.role;
    if (err) {
      res.status(500).send(err);
    } else {
      const refreshToken = req.body.refreshToken;
      jwt.verify(refreshToken, config.refreshToken.secret, (err, decoded) => {
        if (err) {
          res.status(500).send(err);
        } else {
          if (owner === decoded.email) { // same owner so we good
            return res.json({
              token: jwt.sign({
                email: owner,
                role: role
              }, config.token.secret, {
                expiresIn: config.token.expiresIn
              })
            })
          }
        }
      });
    }
  });
});

router.post('/auth/logout', (req, res) => {
  const token = getToken(req);
  jwt.verify(token, config.token.secret, (err, decoded) => {
    if (err) {
      res.status(500).send(err);
    }
    revokedTokens.push({
      token: token,
      timestamp: new Date()
    });
    res.sendStatus(204);
  });
});

router.post('/auth/register', (req, res) => {
  models.Account.findOrCreate({
    where: {
      email: req.body.email
    },
    defaults: {
      password: req.body.password
    }
  }).spread(function (account, created) {
    if (created) {
      res.redirect('/login');
    } else {
      res.status(409).json({status: 'conflict', code: 'user already created'});
    }
  });
});

const getToken = (req) => {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
};

let revokedTokens = []; // TODO a more complex structure that would include timestamp and some logic to clear expired tokens

exports.passport = passport;
exports.router = router;
exports.ejwt = ejwt({
  secret: config.token.secret,
  userProperty: 'token',
  isRevoked: (req, payload, done) => {
    if (revokedTokens.length === 0) {
      return done(null, false);
    }
    const token = getToken(req);
    const now = new Date();
    let isFound = false;
    for (let i = 0; i < revokedTokens; i++) {
      // remove expired tokens
      if (now - revokedTokens[i].timestamp > (config.token.expiresIn * 1000)) {
        revokedTokens.splice(i, 1);
      }
      // is token found
      if (revokedTokens[i].token === token) {
        isFound = true;
        return;
      }
    }
    return done(null, isFound);
  }
}).unless({
  path: ['/auth/login', '/auth/register']
});
