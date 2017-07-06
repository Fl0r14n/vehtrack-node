const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  const limit = req.query.limit;
  const offset = req.query.offset;
  const fleetIds = req.query.fleets__id;

  let query = {
    where: {},
    include: [{
      model: models.Account,
      as: 'account',
      attributes: ['email', 'isActive', 'created', 'lastLogin']
    }],
    offset: offset || 0,
    limit: limit || 50
  };
  if (fleetIds) {
    query.include.push({
      model: models.Fleet,
      where: {
        id: {
          $in: [fleetIds.split(',')]
        }
      }
    })
  }
  models.User.findAll(query).then((users) => {
    res.json(users);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    try {
      let users = createUsers(req.body);
      res.status(201).json(users);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    models.User.create(req.body, {
      include: [{
        model: models.Account,
        as: 'account'
      }]
    }).then((user) => {
      res.status(201).json(user);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

const createUsers = async (users) => {
  let results = [];
  for (let user of users) {
    let result = await models.User.create(user, {
      include: [{
        model: models.Account,
        as: 'account'
      }]
    });
    results.push(result);
  }
  return results;
};

router.get('/:email', (req, res) => {
  models.User.findOne({
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: req.params.email
      },
      attributes: ['email', 'isActive', 'created', 'lastLogin']
    }]
  }).then((user) => {
    res.json(user);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:email', (req, res) => {
  models.User.update(req.body, {
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: req.params.email
      },
      attributes: ['email', 'isActive', 'created', 'lastLogin']
    }]
  }).then((user) => {
    res.json(user);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:email', (req, res) => {
  models.User.destroy({
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: req.params.email
      }
    }]
  }).then((rows) => {
    if (rows > 0) {
      res.sendStatus(204);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

module.exports = router;
