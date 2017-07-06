const express = require('express');
const router = express.Router();
const models = require('../models');

const attributes = ['username'];
const accountAttributes = ['email', 'isActive', 'created', 'lastLogin'];
const accountAttributesCreate = ['email', 'isActive', 'created', 'lastLogin', 'password'];

router.get('/', (req, res) => {
  const limit = req.query.limit;
  const offset = req.query.offset;
  const fleetId = req.query.fleets__id;

  let query = {
    where: {},
    include: [{
      model: models.Account,
      as: 'account',
      attributes: accountAttributes
    }],
    offset: offset || 0,
    limit: limit || 50,
    attributes: attributes
  };
  if (fleetId) {
    if (Array.isArray(fleetId)) {
      query.where.fleet_id = {
        $in: fleetId
      };
    } else {
      query.where.fleet_id = fleetId;
    }
  }
  models.User.findAll(query).then((users) => {
    res.json(users);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    createUsers(req.body).then((users) => {
      res.status(201).json(users);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    createUsers([req.body]).then((users) => {
      res.status(201).json(users[0]);
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
        as: 'account',
        attributes: accountAttributesCreate
      }],
      attributes: attributes
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
      attributes: accountAttributes
    }],
    attributes: attributes
  }).then((user) => {
    res.json(user);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:email', (req, res) => {
  updateUser(req.params.email, req.body).then((user) => {
    res.json(user);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

const updateUser = async (email, content) => {
  // workaround since update through join table does not work with sequelize
  if (content.account) {
    await models.Account.update(content.account, {
      where: {
        email: email
      },
      attributes: accountAttributesCreate
    });
  }
  await models.User.update(content, {
    where: {
      account_ptr_id: email
    },
    attributes: attributes
  });
  return await models.User.findOne({
    where: {
      account_ptr_id: email
    },
    include: [{
      model: models.Account,
      as: 'account',
      attributes: accountAttributes
    }],
    attributes: attributes
  });
};

router.delete('/:email', (req, res) => {
  models.Account.destroy({
    where: {
      email: req.params.email,
      role_id: 'USER'
    }
  }).then((rows) => {
    if (rows > 0) {
      res.sendStatus(204);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

module.exports = router;
