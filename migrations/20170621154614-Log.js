'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
            return queryInterface.createTable('Log',
            {
                "id": {
                    "type": "INTEGER",
                    "allowNull": false,
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "timestamp": {
                    "type": "DATETIME"
                },
                "level": {
                    "type": "TEXT",
                    "defaultValue": "DEBUG",
                    "values": [
                        "ERROR",
                        "WARN",
                        "INFO",
                        "DEBUG"
                    ]
                },
                "message": {
                    "type": "TEXT",
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
                "journey_id": {
                    "name": "journey_id",
                    "allowNull": true,
                    "type": "INTEGER",
                    "references": {
                        "model": "Journey",
                        "key": "id"
                    },
                    "onDelete": "CASCADE",
                    "onUpdate": "CASCADE"
                },
                "device_id": {
                    "name": "device_id",
                    "allowNull": false,
                    "type": "INTEGER",
                    "references": {
                        "model": "Device",
                        "key": "id"
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
            return queryInterface.dropTable('Log');
        })
        .then(() => {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    }
};