const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;

const attributes = ['id', 'timestamp', 'level', 'message', 'journey_id', 'device_id'];

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), (req, res) => {
  const limit = req.query.limit;
  const offset = req.query.offset;
  const deviceId = req.query.device__id;
  const journeyId = req.query.journey__id;
  const startTimestamp = req.query.timestamp__gte;
  const stopTimestamp = req.query.timestamp__lte;
  const level = req.query.level;

  let query = {
    where: {},
    offset: offset || 0,
    limit: limit || 50,
    attributes: attributes
  };
  if (level) {
    query.where.level = level
  }
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
  models.Log.findAll(query).then((logs) => {
    res.json(logs);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', checkForRole([roles.ADMIN, roles.DEVICE]), (req, res) => {
  if (Array.isArray(req.body)) {
    models.Log.bulkCreate(req.body, {
      attributes: attributes
    }).then(() => {
      res.status(201).json(req.body);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    models.Log.create(req.body, {
      attributes: attributes
    }).then((log) => {
      res.status(201).json(log);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

router.get('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), (req, res) => {
  models.Log.findById(req.params.id, {
    attributes: attributes
  }).then((log) => {
    res.json(log);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', checkForRole([roles.ADMIN]), (req, res) => {
  const id = req.params.id;
  models.Log.update(req.body, {
    where: {
      id: id
    },
    attributes: attributes
  }).then(() => {
    models.Log.findById(id, {
      attributes: attributes
    }).then((log) => {
      res.json(log);
    });
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:id', checkForRole([roles.ADMIN]), (req, res) => {
  models.Log.destroy({
    where: {
      id: req.params.id
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
