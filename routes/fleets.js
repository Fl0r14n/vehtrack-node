const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;

const attributes = ['id', 'name', 'parent_id'];
const accountAttributes = ['email', 'isActive', 'created', 'lastLogin'];
const userAttributes = ['id', 'username'];
const deviceAttributes = ['id', 'serial', 'type', 'description', 'phone', 'plate', 'vin', 'imei', 'imsi', 'msisdn'];

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO fleet admin should not be allowed to query without parentId
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

router.post('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO fleet admin should not be allowed to create top level fleets
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

router.get('/:id', checkForRole([roles.ADMIN]), (req, res) => {
  models.Fleet.findById(req.params.id, {
    attributes: attributes
  }).then((fleet) => {
    res.json(fleet);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO check belonging for fleet admin
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

router.delete('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  console.log('HERE=================')
  //TODO check belonging for fleet admin
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

router.get('/:id/user', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO check belonging for fleet admin
  const id = req.params.id;
  const limit = req.query.limit;
  const offset = req.query.offset;

  let query = {
    include: [{
      model: models.Account,
      as: 'account',
      attributes: accountAttributes
    }],
    attributes: userAttributes,
    offset: offset || 0,
    limit: limit || 50,
  };

  models.Fleet.findById(id).then((fleet) => {
    if (fleet) {
      fleet.getUsers(query).then((users) => {
        res.json(users);
      }).catch((err) => {
        res.status(500).send(err);
      })
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/:id/user/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO check belonging for fleet admin
  const id = req.params.id;
  const email = req.params.email;
  models.Fleet.findById(id).then((fleet) => {
    if (fleet) {
      models.User.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          },
        }],
      }).then((user) => {
        if (user) {
          fleet.addUser(user).then(() => {
            res.sendStatus(201);
          }).catch((err) => {
            res.status(500).send(err);
          });
        } else {
          res.status(400).send(`User with email: ${email} not found`);
        }
      }).catch((err) => {
        res.status(500).send(err);
      });
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:id/user/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO check belonging for fleet admin
  const id = req.params.id;
  const email = req.params.email;
  models.Fleet.findById(id).then((fleet) => {
    if (fleet) {
      models.User.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          },
        }],
      }).then((user) => {
        if (user) {
          fleet.removeUser(user).then(() => {
            res.sendStatus(201);
          }).catch((err) => {
            res.status(500).send(err);
          });
        } else {
          res.status(400).send(`User with email: ${email} not found`);
        }
      }).catch((err) => {
        res.status(500).send(err);
      })
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.get('/:id/device', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), (req, res) => {
  //TODO check belonging for fleet admin and user
  const id = req.params.id;
  const limit = req.query.limit;
  const offset = req.query.offset;

  let query = {
    include: [{
      model: models.Account,
      as: 'account',
      attributes: accountAttributes
    }],
    attributes: deviceAttributes,
    offset: offset || 0,
    limit: limit || 50,
  };

  models.Fleet.findById(id).then((fleet) => {
    if (fleet) {
      fleet.getDevices(query).then((devices) => {
        res.json(devices);
      }).catch((err) => {
        res.status(500).send(err);
      })
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.post('/:id/device/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO check belonging for fleet admin
  const id = req.params.id;
  const email = req.params.email;
  models.Fleet.findById(id).then((fleet) => {
    if (fleet) {
      models.Device.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          }
        }],
      }).then((device) => {
        if (device) {
          fleet.addDevice(device).then(() => {
            res.sendStatus(201);
          }).catch((err) => {
            res.status(500).send(err);
          });
        } else {
          res.status(400).send(`Device with email: ${email} not found`);
        }
      }).catch((err) => {
        res.status(500).send(err);
      })
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.delete('/:id/device/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), (req, res) => {
  //TODO check belonging for fleet admin
  const id = req.params.id;
  const email = req.params.email;
  models.Fleet.findById(id).then((fleet) => {
    if (fleet) {
      models.Device.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          },
        }],
      }).then((device) => {
        if (device) {
          fleet.removeDevice(device).then(() => {
            res.sendStatus(201);
          }).catch((err) => {
            res.status(500).send(err);
          });
        } else {
          res.status(400).send(`Device with email: ${email} not found`);
        }
      }).catch((err) => {
        res.status(500).send(err);
      })
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  }).catch((err) => {
    res.status(500).send(err);
  });
});

module.exports = router;
