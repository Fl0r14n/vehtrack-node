const express = require('express');
const router = express.Router();
const models = require('../models');

/* GET users listing. */
router.get('/', function(req, res, next) {
  models.User.findAll().then((users) => {
    res.send(users);
  });
});

module.exports = router;
