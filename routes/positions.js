const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;

const attributes = ['id', 'latitude', 'longitude', 'timestamp', 'speed', 'journey_id', 'device_id'];

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), async (req, res) => {
  try {
    const limit = req.params.limit;
    const offset = req.params.offset;
    const deviceId = req.params.device__id;
    const journeyId = req.params.journey__id;
    const startTimestamp = req.params.timestamp__gte;
    const stopTimestamp = req.params.timestamp__lte;

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
    if (journeyId) {
      if (Array.isArray(journeyId)) {
        query.where.journey_id = {
          $in: journeyId
        };
      } else {
        query.where.journey_id = journeyId;
      }
    }
    const positions = await models.Position.findAll(query);
    res.json(positions);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', checkForRole([roles.ADMIN, roles.DEVICE]), async (req, res) => {
  try {
    if (Array.isArray(req.body)) {
      await models.Position.bulkCreate(req.body, {
        attributes: attributes
      });
      res.status(201).json(req.body);
    } else {
      const position = await models.Position.create(req.body, {
        attributes: attributes
      });
      res.status(201).json(position);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), async (req, res) => {
  try {
    const position = await models.Position.findById(req.params.id, {
      attributes: attributes
    });
    res.json(position);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put('/:id', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    const id = req.params.id;
    await models.Position.update(req.body, {
      where: {
        id: id
      }
    });
    const position = await models.Position.findById(id, {
      attributes: attributes
    });
    res.json(position);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete('/:id', checkForRole([roles.ADMIN]), async (req, res) => {
  try {
    await models.Position.destroy({
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
