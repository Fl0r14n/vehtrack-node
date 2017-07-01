const express = require('express');
const router = express.Router();
const models = require('../models');

router.get('/', (req, res) => {
  const limit = req.params.limit;
  const offset = req.params.offset;
  const name = req.params.name;

  let query = {
    where: {},
    include: [],
    offset: offset || 0,
    limit: limit || 50
  };
  if (name) {
    query.where.name = name
  }
  models.Fleet.findAll(query).then((fleets) => {
    res.json(fleets);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    models.Fleet.bulkCreate(req.body).then(() => {
      res.status(201).json(req.body);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    models.Fleet.create(req.body).then((fleet) => {
      res.status(201).json(fleet);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

router.get('/:id', (req, res) => {
  models.Fleet.findById(req.params.id).then((fleet) => {
    res.json(fleet);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', (req, res) => {
  models.Fleet.update(req.body, {
    where: {
      id: req.params.id
    }
  }).then((fleet) => {
    res.json(fleet);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:id', (req, res) => {
  models.Fleet.destroy({
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

router.put('/:id/user/:email', (req, res) => {
  // TODO
  res.sendStatus(404);
});

router.get('/:id/device/:email', (req, res) => {
  // TODO
  res.sendStatus(404);
});


module.exports = router;
