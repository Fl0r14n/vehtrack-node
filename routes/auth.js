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
        }, config.secret, {
          expiresIn: config.expiresIn
        })
      });
    }
  })(req, res, next);
});

router.post('/auth/register', (req, res, next) => {
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

const addAccountToRequest = (req, res, next) => {
  if (req.tokenPayload) {
    models.Account.findById(req.tokenPayload.email).then((account) => {
      if (account) {
        req.account = account;
        return next();
      } else {
        return res.status(401).json({status: 'error', code: 'unauthorized'});
      }
    });
  }
  if (req.account) {
    return next();
  } else {
    return res.status(401).json({status: 'error', code: 'unauthorized'});
  }
};

exports.passport = passport;
exports.router = router;
exports.ejwt = ejwt({secret: config.secret, userProperty: 'tokenPayload'}).unless({path: ['/auth/login']});
exports.addAccountToRequest = addAccountToRequest;
