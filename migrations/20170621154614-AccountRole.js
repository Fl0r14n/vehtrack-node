'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
            return queryInterface.createTable('AccountRole',
            {
                "name": {
                    "type": "VARCHAR(32)",
                    "primaryKey": true
                },
                "description": {
                    "type": "VARCHAR(255)",
                    "defaultValue": ""
                },
                "createdAt": {
                    "type": "DATETIME",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": "DATETIME",
                    "allowNull": false
                },
                "account_id": {
                    "name": "account_id",
                    "allowNull": false,
                    "type": "VARCHAR(128)",
                    "references": {
                        "model": "Account",
                        "key": "email"
                    },
                    "onDelete": "CASCADE",
                    "onUpdate": "CASCADE"
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
            return queryInterface.dropTable('AccountRole');
        })
        .then(() => {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    }
};