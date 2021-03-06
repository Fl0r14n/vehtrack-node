const roles = {
  ADMIN: 'ADMIN',
  FLEET_ADMIN: 'FLEET_ADMIN',
  DEVICE: 'DEVICE',
  USER: 'USER'
};

const checkForRole = (roles) => {
  return (req, res, next) => {
    if (req.account && Array.isArray(roles) && roles.indexOf(req.account.role) !== -1) {
      next();
    } else {
      res.sendStatus(403);
    }
  }
};

const isRole = (req, role) => {
  return req.account && req.account.role === role;
};

exports.roles = roles;
exports.checkForRole = checkForRole;
exports.isRole = isRole;
