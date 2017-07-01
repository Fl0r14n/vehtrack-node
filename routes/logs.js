const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  const limit = req.params.limit;
  const offset = req.params.offset;
  const deviceSerial = req.params.device__serial;
  const journeyId = req.params.journey__id;
  const startTimestamp = req.params.timestamp__gte;
  const stopTimestamp = req.params.timestamp__lte;
  const level = req.params.level;

  let query = {
    where: {},
    include: [],
    offset: offset || 0,
    limit: limit || 50
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
  if (deviceSerial) {
    query.include.push({
      model: models.Device,
      where: {
        serial: deviceSerial
      }
    });
  }
  if (journeyId) {
    query.include.push({
      model: models.Journey,
      where: {
        id: journeyId
      }
    });
  }
  models.Log.findAll(query).then((logs) => {
    res.json(logs);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    models.Log.bulkCreate(req.body).then(() => {
      res.status(201).json(req.body);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    models.Log.create(req.body).then((log) => {
      res.status(201).json(log);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

router.get('/:id', (req, res) => {
  models.Log.findById(req.params.id).then((log) => {
    res.json(log);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', (req, res) => {
  models.Log.update(req.body, {
    where: {
      id: req.params.id
    }
  }).then((log) => {
    res.json(log);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:id', (req, res) => {
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
