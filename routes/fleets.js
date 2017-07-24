const express = require('express');
const router = express.Router();
const models = require('../models');
const roles = require('../util/roles').roles;
const checkForRole = require('../util/roles').checkForRole;
const isRole = require('../util/roles').isRole;

const attributes = ['id', 'name', 'parent_id'];
const accountAttributes = ['email', 'isActive', 'created', 'lastLogin'];
const userAttributes = ['id', 'username'];
const deviceAttributes = ['id', 'serial', 'type', 'description', 'phone', 'plate', 'vin', 'imei', 'imsi', 'msisdn'];

const MAX_FLEET_CHILD_DEPTH = 3;

const isFleetOwner = () => {
  return (req, res, next) => {
    if (isRole(req, roles.FLEET_ADMIN)) {
      const email = req.account.email;
      const id = req.param.id;
      const parentId = req.query.parent__id || req.body.parent_id;
      findRootFleetLevel(email, id, parentId).then((level) => {
        if (level >= 0) {
          next(level);
        } else {
          res.status(400).send(`Fleet Administrators can query only their fleets!`);
        }
      });
    } else {
      next(0);
    }
  }
};

const findRootFleetLevel = async (email, id, parentId) => {
  if (!email) {
    return -1;
  }
  let parentFleetId = parentId;
  // get user
  const user = await models.User.findOne({
    include: [{
      model: models.Account,
      as: 'account',
      where: {
        email: email
      },
    }],
  });
  // get top level fleets of fleet admin
  const userFleets = await user.getFleets({
    where: {
      parent_id: null
    }
  });
  if (id) {
    // we have id so we search it's parent
    const fleet = await models.Fleet.findById(id);
    if (fleet) {
      // is by chance top level?
      if (userFleets.filter((fleet) => {
          return fleet.id === id;
        }).length > 0) {
        return 0;
      } else {
        // then just get the parent id
        parentFleetId = fleet.parent_id;
      }
    } else {
      return -1;
    }
  }
  if (parentFleetId) {
    if (userFleets && userFleets.length > 0) {
      // go up through parents
      for (let i = 0; i < MAX_FLEET_CHILD_DEPTH; i++) {
        let parentFleet = await models.Fleet.findOne({
          where: {
            parent_id: parentFleetId
          }
        });
        if (parentFleet && userFleets.filter((fleet) => {
            return fleet.id === parentFleet.id;
          }).length > 0) {
          return i;
        } else {
          parentFleetId = parentFleet.id;
        }
      }
    }
  }
};

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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
  if (isRole(req, roles.ADMIN) && Array.isArray(req.body)) {
    models.Fleet.bulkCreate(req.body, {
      attributes: attributes
    }).then(() => {
      res.status(201).json(req.body);
    }).catch((err) => {
      res.status(500).send(err);
    });
  } else if (isFleetOwner()(req, res, (level) => {
      if (level < MAX_FLEET_CHILD_DEPTH - 1) {
        models.Fleet.create(req.body, {
          attributes: attributes
        }).then((fleet) => {
          res.status(201).json(fleet);
        }).catch((err) => {
          res.status(500).send(err);
        });
      }
    })) {
  } else {
    res.sendStatus(500);
  }
});

router.get('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
  models.Fleet.findById(req.params.id, {
    attributes: attributes
  }).then((fleet) => {
    res.json(fleet);
  }).catch((err) => {
    res.status(500).send(err);
  });
});

router.put('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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

router.delete('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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

router.get('/:id/user', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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

router.post('/:id/user/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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

router.delete('/:id/user/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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

router.get('/:id/device', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), isFleetOwner(), (req, res) => {
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

router.post('/:id/device/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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

router.delete('/:id/device/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), (req, res) => {
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
