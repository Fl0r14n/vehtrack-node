const passport = require('passport');
const passportLocal = require('passport-local');
const jwt = require('jsonwebtoken');
const ejwt = require('express-jwt');
const express = require('express');
const router = express.Router();
const models = require('../models');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env]['jwt'];

passport.use(new passportLocal.Strategy(function (email, password, next) {
  models.Account.findOne({email: email}).then(function (account) {
    if (!account) return next(null, false);
    return next(null, account.authenticate(password) ? account : false);
  });
}));

router.post('/login', function (req, res, next) {
  passport.authenticate('local', function (err, account, info) {
    if (err) return next(err);
    if (!account) {
      return res.status(401).json({
        status: 'error',
        code: 'unauthorized'
      });
    } else {
      return res.json({
        token: jwt.sign(account, config.secret, {
          expiresIn: config.expiresIn
        })
      });
    }
  })(req, res, next);
});

router.post('/register', function (req, res, next) {
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
};

exports.passport = passport.initialize();
exports.router = router;
exports.ejwt = ejwt({secret: config.secret, userProperty: 'tokenPayload'}).unless({path: ['/login']});
exports.addAccountToRequest = addAccountToRequest;
