const express = require('express');
const router = express.Router();
const models = require('../models');

const attributes = ['serial', 'type', 'description', 'phone', 'plate', 'vin', 'imei', 'imsi', 'msisdn'];
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
  models.Device.findAll(query).then((devices) => {
    res.json(devices);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    createDevices(req.body).then((devices) => {
      res.status(201).json(devices);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    createDevices([req.body]).then((devices) => {
      res.status(201).json(devices[0]);
    }).catch((err) => {
      res.status(500).send(err);
    });
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

router.get('/:email', (req, res) => {
  models.Device.findOne({
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: req.params.email
      },
      attributes: accountAttributes
    }],
    attributes: attributes
  }).then((device) => {
    res.json(device);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:email', (req, res) => {
  updateDevice(req.params.email, req.body).then((device) => {
    res.json(device);
  }).catch((err) => {
    res.status(500).send(err);
  });
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

router.delete('/:email', (req, res) => {
  models.Account.destroy({
    where: {
      email: req.params.email,
      role_id: 'DEVICE'
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
