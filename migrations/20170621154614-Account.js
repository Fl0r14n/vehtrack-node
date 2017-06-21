'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
            return queryInterface.createTable('Account',
            {
                "email": {
                    "type": "VARCHAR(128)",
                    "primaryKey": true,
                    "validate": {
                        "isEmail": true
                    }
                },
                "isActive": {
                    "type": "TINYINT(1)",
                    "defaultValue": true
                },
                "created": {
                    "type": "DATETIME",
                    "defaultValue": {}
                },
                "password": {
                    "type": "VARCHAR(128)",
                    "allowNull": false
                },
                "lastLogin": {
                    "type": "DATETIME",
                    "defaultValue": {}
                },
                "createdAt": {
                    "type": "DATETIME",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": "DATETIME",
                    "allowNull": false
                }
            })
        })

        .then(() => {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    },
    down: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
            return queryInterface.dropTable('Account');
        })
        .then(() => {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    }
};