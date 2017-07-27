const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;

const attributes = ['id', 'serial', 'type', 'description', 'phone', 'plate', 'vin', 'imei', 'imsi', 'msisdn'];
const accountAttributes = ['email', 'isActive', 'created', 'lastLogin'];
const accountAttributesCreate = ['email', 'isActive', 'created', 'lastLogin', 'password'];

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), async (req, res) => {
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
    const devices = await models.Device.findAll(query);
    res.json(devices);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      const devices = await createDevices(req.body);
      res.status(201).json(devices);
    } else {
      const devices = await createDevices([req.body]);
      res.status(201).json(devices[0]);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

const createDevices = async (devices) => {
  let results = [];
  for (let device of devices) {
    let result = await models.Device.create(device, {
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
    const device = await models.Device.findOne({
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
    res.json(device);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put('/:email', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    const device = await updateDevice(req.params.email, req.body)
    res.json(device);
  } catch (err) {
    res.status(500).send(err);
  }
});

const updateDevice = async (email, content) => {
  // workaround since update through join table does not work with sequelize
  if (content.account) {
    await models.Account.update(content.account, {
      where: {
        email: email
      },
      attributes: accountAttributesCreate
    });
  }
  await models.Device.update(content, {
    where: {
      account_ptr_id: email
    },
    attributes: attributes
  });
  return await models.Device.findOne({
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
        role_id: 'DEVICE'
      }
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
