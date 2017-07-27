const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;

const attributes = ['id', 'username'];
const accountAttributes = ['email', 'isActive', 'created', 'lastLogin'];
const accountAttributesCreate = ['email', 'isActive', 'created', 'lastLogin', 'password'];
const fleetAttributes = ['id', 'name', 'parent_id'];

router.get('/profile', async (req, res) => {
  try {
    const email = req.account.email;
    const user = await models.User.findOne({
      include: [{
        model: models.Account,
        as: 'account',
        where: {
          email: email
        },
        attributes: accountAttributes
      }],
      attributes: attributes
    });
    res.json(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put('/profile', async (req, res) => {
  try {
    const user = await updateUser(req.account.email, req.body);
    res.json(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/fleet', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), async (req, res) => {
  try {
    const limit = req.query.limit;
    const offset = req.query.offset;
    const email = req.account.email;
    let query = {
      where: {},
      offset: offset || 0,
      limit: limit || 50,
      attributes: fleetAttributes
    };
    switch (req.account.role) {
      case roles.ADMIN: {
        // get top level fleets
        query.where.parent_id = null;
        const fleets = await models.Fleet.findAll(query);
        res.json(fleets);
        break;
      }
      case roles.FLEET_ADMIN: {
        const user = await models.User.findOne({
          include: [{
            model: models.Account,
            as: 'account',
            where: {
              email: email
            },
            attributes: accountAttributes
          }],
          attributes: attributes
        });
        // get top level fleet
        query.where.parent_id = null;
        const fleets = await user.getFleets(query);
        res.json(fleets);
        break;
      }
      case roles.USER: {
        const user = await models.User.findOne({
          include: [{
            model: models.Account,
            as: 'account',
            where: {
              email: email
            },
            attributes: accountAttributes
          }],
          attributes: attributes
        });
        // get user fleets usually just one
        const fleets = await user.getFleets(query);
        res.json(fleets);
        break;
      }
      default: {
        res.sendStatus(400);
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), async (req, res) => {
  try {
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
    const users = await models.User.findAll(query);
    res.json(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const users = await createUsers(req.body);
      res.status(201).json(users);
    } else {
      const users = await createUsers([req.body]);
      res.status(201).json(users[0]);
    }
  } catch (err) {
    res.status(500).send(err);
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

router.get('/:email', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    const user = await models.User.findOne({
      include: [{
        model: models.Account,
        as: 'account',
        where: {
          email: req.params.email
        },
        attributes: accountAttributes
      }],
      attributes: attributes
    });
    res.json(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put('/:email', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    const user = await updateUser(req.params.email, req.body);
    res.json(user);
  } catch (err) {
    res.status(500).send(err);
  }
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

router.delete('/:email', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    await models.Account.destroy({
      where: {
        email: req.params.email,
        role_id: 'USER'
      }
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
