const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  const limit = req.params.limit;
  const offset = req.params.offset;
  const fleetIds = req.params.fleets_id;

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
  models.Device.findAll(query).then((devices) => {
    res.json(devices);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    try {
      let devices = createDevices(req.body);
      res.status(201).json(devices);
    } catch (err) {
      res.status(500).send(err);
    }
  } else {
    models.Device.create(req.body, {
      include: [{
        model: models.Account,
        as: 'account'
      }]
    }).then((device) => {
      res.status(201).json(device);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

const createDevices = async (devices) => {
  let results = [];
  for (let device of devices) {
    let result = await models.Devices.create(device, {
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
  models.Device.findOne({
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: req.params.email
      },
      attributes: ['email', 'isActive', 'created', 'lastLogin']
    }]
  }).then((device) => {
    res.json(device);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:email', (req, res) => {
  models.Device.update(req.body, {
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: req.params.email
      },
      attributes: ['email', 'isActive', 'created', 'lastLogin']
    }]
  }).then((device) => {
    res.json(device);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:email', (req, res) => {
  models.Device.destroy({
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
