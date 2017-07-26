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
      const id = req.params.id;
      const parentId = Number(req.query.parent__id || req.body.parent_id);
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
  console.log(`email ${email}, id: ${id}, parent ${parentFleetId}`);
  if (parentFleetId) {
    if (userFleets && userFleets.length > 0) {
      console.log('HERE');
      // search fleet admin root fleets
      if (userFleets.filter((fleet) => {
          console.log('INSODE')
          console.log(fleet.id);
          console.log(parentFleetId);
          return fleet.id === parentFleetId;
        }).length > 0) {
        console.log('HERE0');
        return 0;
      }
      console.log('HERE01');
      // else go up through parents
      for (let i = 0; i < MAX_FLEET_CHILD_DEPTH; i++) {
        console.log('HERE1');
        let parentFleet = await models.Fleet.findOne({
          where: {
            parent_id: parentFleetId
          }
        });
        console.log('HERE2');
        if (parentFleet) {
          console.log(parentFleet.id);
          console.log('HERE3');
          if (userFleets.filter((fleet) => {
              return fleet.id === parentFleet.id;
            }).length > 0) {
            console.log('FOUND');
            return i;
          } else {
            parentFleetId = parentFleet.id;
            console.log('NOT FOUND');
          }
        } else {
          return -1;
        }
      }
      return -1;
    }
  } else {
    return -1;
  }
};

router.get('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
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
    const fleets = await models.Fleet.findAll(query);
    res.json(fleets);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), async (req, res) => {
  try {
    if (isRole(req, roles.ADMIN) && Array.isArray(req.body)) {
      await models.Fleet.bulkCreate(req.body, {
        attributes: attributes
      });
      res.status(201).json(req.body);
    } else {
      const level = await findRootFleetLevel(req.account.email, null, req.body.parent_id);
      if (level < MAX_FLEET_CHILD_DEPTH - 1) {
        const fleet = await models.Fleet.create(req.body, {
          attributes: attributes
        });
        res.status(201).json(fleet);
      }
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const fleet = await models.Fleet.findById(req.params.id, {
      attributes: attributes
    });
    res.json(fleet);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.put('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const id = req.params.id;
    await models.Fleet.update(req.body, {
      where: {
        id: id
      },
      attributes: attributes
    });
    const fleet = await models.Fleet.findById(id, {
      attributes: attributes
    });
    res.json(fleet);
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete('/:id', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const rows = await models.Fleet.destroy({
      where: {
        id: req.params.id
      }
    });
    if (rows > 0) {
      res.sendStatus(204);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/:id/user', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
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
    const fleet = await models.Fleet.findById(id);
    if (fleet) {
      const users = await fleet.getUsers(query);
      res.json(users);
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/:id/user/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.params.email;
    const fleet = await models.Fleet.findById(id);
    if (fleet) {
      const user = await models.User.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          },
        }],
      });
      if (user) {
        await fleet.addUser(user);
        res.sendStatus(201);
      } else {
        res.status(400).send(`User with email: ${email} not found`);
      }
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete('/:id/user/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.params.email;
    const fleet = await models.Fleet.findById(id);
    if (fleet) {
      const user = await models.User.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          },
        }],
      });
      if (user) {
        await fleet.removeUser(user)
        res.sendStatus(201);
      } else {
        res.status(400).send(`User with email: ${email} not found`);
      }
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.get('/:id/device', checkForRole([roles.ADMIN, roles.FLEET_ADMIN, roles.USER]), isFleetOwner(), async (req, res) => {
  //TODO check belonging for fleet admin and user
  try {
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
    const fleet = await models.Fleet.findById(id);
    if (fleet) {
      const devices = await fleet.getDevices(query);
      res.json(devices);
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.post('/:id/device/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.params.email;
    const fleet = await models.Fleet.findById(id)
    if (fleet) {
      const device = await models.Device.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          }
        }],
      });
      if (device) {
        await fleet.addDevice(device);
        res.sendStatus(201);
      } else {
        res.status(400).send(`Device with email: ${email} not found`);
      }
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

router.delete('/:id/device/:email', checkForRole([roles.ADMIN, roles.FLEET_ADMIN]), isFleetOwner(), async (req, res) => {
  try {
    const id = req.params.id;
    const email = req.params.email;
    const fleet = await models.Fleet.findById(id);
    if (fleet) {
      const device = await models.Device.findOne({
        include: [{
          model: models.Account,
          as: 'account',
          where: {
            email: email
          },
        }],
      });
      if (device) {
        await fleet.removeDevice(device);
        res.sendStatus(201);
      } else {
        res.status(400).send(`Device with email: ${email} not found`);
      }
    } else {
      res.status(400).send(`Fleet with id: ${id} not found`);
    }
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
