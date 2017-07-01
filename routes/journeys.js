const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  const limit = req.params.limit;
  const offset = req.params.offset;
  const deviceSerial = req.params.device__serial;
  const startTimestamp = req.params.timestamp__gte;
  const stopTimestamp = req.params.timestamp__lte;

  let query = {
    where: {},
    include: [],
    offset: offset || 0,
    limit: limit || 50
  };
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
  models.Journey.findAll(query).then((Journey) => {
    res.json(Journey);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    models.Journey.bulkCreate(req.body).then(() => {
      res.status(201).json(req.body);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    models.Journey.create(req.body).then((journey) => {
      res.status(201).json(journey);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

router.get('/:id', (req, res) => {
  models.Journey.findById(req.params.id).then((journey) => {
    res.json(journey);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', (req, res) => {
  models.Journey.update(req.body, {
    where: {
      id: req.params.id
    }
  }).then((journey) => {
    res.json(journey);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:id', (req, res) => {
  models.Journey.destroy({
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
