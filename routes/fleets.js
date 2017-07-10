const express = require('express');
const router = express.Router();
const models = require('../models');

const attributes = ['name', 'parent_id'];

router.get('/', (req, res) => {
  const limit = req.query.limit;
  const offset = req.query.offset;
  const name = req.query.name;
  const parentId = req.query.parent__id;

  let query = {
    where: {},
    offset: offset || 0,
    limit: limit || 50,
    attributes: attributes
  };
  if (name) {
    query.where.name = name
  }
  if (parentId) {
    if (Array.isArray(parentId)) {
      query.where.parent_id = {
        $in: parentId
      };
    } else {
      query.where.parent_id = parentId;
    }
  }
  models.Fleet.findAll(query).then((fleets) => {
    res.json(fleets);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/', (req, res) => {
  if (Array.isArray(req.body)) {
    models.Fleet.bulkCreate(req.body, {
      attributes: attributes
    }).then(() => {
      res.status(201).json(req.body);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else {
    models.Fleet.create(req.body, {
      attributes: attributes
    }).then((fleet) => {
      res.status(201).json(fleet);
    }).catch((err) => {
      res.status(500).send(err);
    });
  }
});

router.get('/:id', (req, res) => {
  models.Fleet.findById(req.params.id, {
    attributes: attributes
  }).then((fleet) => {
    res.json(fleet);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', (req, res) => {
  const id = req.params.id;
  models.Fleet.update(req.body, {
    where: {
      id: id
    },
    attributes: attributes
  }).then(() => {
    models.Fleet.findById(id, {
      attributes: attributes
    }).then((log) => {
      res.json(log);
    });
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

router.post('/:id/user/:email', (req, res) => {
  // TODO add user to fleet
  res.sendStatus(404);
});

router.delete('/:id/user/:email', (req, res) => {
  // TODO remove user from fleet
  res.sendStatus(404);
});

router.get('/:id/device/:email', (req, res) => {
  // TODO add device to fleet
  res.sendStatus(404);
});

router.get('/:id/device/:email', (req, res) => {
  // TODO remove device from fleet
  res.sendStatus(404);
});

module.exports = router;
