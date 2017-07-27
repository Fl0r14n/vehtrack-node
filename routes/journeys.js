const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;

const attributes = ['id', 'startLatitude', 'startLongitude', 'startTimestamp', 'stopLatitude', 'stopLongitude', 'stopTimestamp', 'distance', 'averageSpeed', 'maximumSpeed', 'duration'];

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), async (req, res) => {
  try {
    const limit = req.query.limit;
    const offset = req.query.offset;
    const deviceId = req.query.device__id;
    const startTimestamp = req.query.timestamp__gte;
    const stopTimestamp = req.query.timestamp__lte;

    let query = {
      where: {},
      offset: offset || 0,
      limit: limit || 50,
      attributes: attributes
    };
    if (startTimestamp) {
      query.where.timestamp = query.where.timestamp || {};
      query.where.timestamp.$gte = startTimestamp;
    }
    if (stopTimestamp) {
      query.where.timestamp = query.where.timestamp || {};
      query.where.timestamp.$lte = stopTimestamp
    }
    if (deviceId) {
      if (Array.isArray(deviceId)) {
        query.where.device_id = {
          $in: deviceId
        };
      } else {
        query.where.device_id = deviceId;
      }
    }
    const journeys = await models.Journey.findAll(query);
    res.json(journeys);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', checkForRole([roles.ADMIN, roles.DEVICE]), async (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        await models.Journey.bulkCreate(req.body, {
          attributes: attributes
        });
        res.status(201).json(req.body);
      } else {
        const journey = await models.Journey.create(req.body, {
          attributes: attributes
        });
        res.status(201).json(journey);
      }
    } catch (err) {
      res.status(500).send(err);
    }
  }
);

router.get('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), async (req, res) => {
  try {
    const journey = await models.Journey.findById(req.params.id, {
      attributes: attributes
    });
    res.json(journey);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put('/:id', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    const id = req.params.id;
    await models.Journey.update(req.body, {
      where: {
        id: id
      },
      attributes: attributes
    });
    const journey = await models.Journey.findById(id, {
      attributes: attributes
    });
    res.json(journey);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete('/:id', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    await models.Journey.destroy({
      where: {
        id: req.params.id
      }
    });
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
