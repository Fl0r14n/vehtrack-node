"use strict";

var _models = require("./models/index");

var models = _interopRequireWildcard(_models);

var _sequelize = require("sequelize");

var _sequelize2 = _interopRequireDefault(_sequelize);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

delete models.default;

var sequelize = new _sequelize2.default('', '', '', {
  dialect: 'sqlite',
  storage: './db.development.sqlite'
});

var _loop = function _loop(model) {

  var attributes = models[model].attributes;

  for (var column in attributes) {
    delete attributes[column].Model;
    delete attributes[column].fieldName;
    delete attributes[column].field;
    for (var property in attributes[column]) {
      if (property.startsWith('_')) {
        delete attributes[column][property];
      }
    }

    if (typeof attributes[column]['type'] !== 'undefined') {

      if (typeof attributes[column]['type']['options'] !== 'undefined' && typeof attributes[column]['type']['options'].toString === 'function') {
        attributes[column]['type']['options'] = attributes[column]['type']['options'].toString(sequelize);
      }

      if (typeof attributes[column]['type'].toString === 'function') {
        attributes[column]['type'] = attributes[column]['type'].toString(sequelize);
      }
    }
  }

  var schema = JSON.stringify(attributes, null, 4);
  var tableName = models[model].tableName;
  var indexes = ['\n'];

  if (models[model].options.indexes && models[model].options.indexes.length) {

    models[model].options.indexes.forEach(function (obj) {

      indexes.push('        .then(() => {');
      indexes.push('            return queryInterface.addIndex(');
      indexes.push("                '" + tableName + "',");
      indexes.push("                ['" + obj.fields.join("','") + "']");

      var opts = {};
      if (obj.name) {
        opts.indexName = obj.name;
      }
      if (obj.unique === true) {
        opts.indicesType = 'UNIQUE';
      }
      if (obj.method === true) {
        opts.indexType = obj.method;
      }
      if (Object.keys(opts).length) {
        indexes.push("                , " + JSON.stringify(opts));
      }

      indexes.push('            )');
      indexes.push('        })');
    });
  }

  if(schema) {
    schema = schema.split('\n').map(function (line) {
      return '            ' + line;
    }).join('\n');
  }

  var template = "'use strict';\nmodule.exports = {\n    up: function(queryInterface, Sequelize) {\n        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')\n        .then(() => {\n            return queryInterface.createTable('" + tableName + "',\n" + schema + ")\n        })" + indexes.join('\n') + "\n        .then(() => {\n            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');\n        });\n    },\n    down: function(queryInterface, Sequelize) {\n        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')\n        .then(() => {\n            return queryInterface.dropTable('" + tableName + "');\n        })\n        .then(() => {\n            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');\n        });\n    }\n};";

  var d = new Date();

  var filename = [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()].map(function (num) {
      return num <= 60 && (num + 100).toString().substring(1) || num;
    }).join('') + ("-" + models[model].tableName);

  _fs2.default.writeFileSync("./" + filename + ".js", template);
};

for (var model in models) {
  _loop(model);
};
