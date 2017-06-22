const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  models.Log.findAll().then((logs) => {
    res.send(logs);
  })
});

module.exports = router;
