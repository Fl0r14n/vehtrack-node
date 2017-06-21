var passport = require('passport');
var passportLocal = require('passport-local');
var jwt = require('jsonwebtoken');
var ejwt = require('express-jwt');
var express = require('express');
var router = express.Router();
var models = require('../models');

var env = process.env.NODE_ENV || 'development';
var config = require('../config.json')[env]['jwt'];

passport.use(new passportLocal.LocalStrategy(function (email, password, next) {
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

exports.auth = passport.initialize();
exports.login = router;
exports.jwt = ejwt({secret: secret, userProperty: 'tokenPayload'}).unless({path: ['/login']});
