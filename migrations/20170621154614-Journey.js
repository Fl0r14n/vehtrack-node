'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
            return queryInterface.createTable('Journey',
            {
                "id": {
                    "type": "INTEGER",
                    "allowNull": false,
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "startLatitude": {
                    "type": "FLOAT",
                    "validate": {
                        "min": -90,
                        "max": 90
                    },
                    "description": "gg.ggggg"
                },
                "startLongitude": {
                    "type": "FLOAT",
                    "validate": {
                        "min": -180,
                        "max": 180
                    },
                    "description": "gg.ggggg"
                },
                "startTimestamp": {
                    "type": "DATETIME",
                    "description": "ms"
                },
                "stopLatitude": {
                    "type": "FLOAT",
                    "validate": {
                        "min": -90,
                        "max": 90
                    },
                    "description": "gg.ggggg"
                },
                "stopLongitude": {
                    "type": "FLOAT",
                    "validate": {
                        "min": -180,
                        "max": 180
                    },
                    "description": "gg.ggggg"
                },
                "stopTimestamp": {
                    "type": "DATETIME",
                    "description": "ms"
                },
                "distance": {
                    "type": "BIGINT",
                    "description": "m"
                },
                "averageSpeed": {
                    "type": "FLOAT",
                    "description": "km/h"
                },
                "maximumSpeed": {
                    "type": "FLOAT",
                    "description": "km/h"
                },
                "duration": {
                    "type": "FLOAT",
                    "description": "ms"
                },
                "createdAt": {
                    "type": "DATETIME",
                    "allowNull": false
                },
                "updatedAt": {
                    "type": "DATETIME",
                    "allowNull": false
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
            return queryInterface.dropTable('Journey');
        })
        .then(() => {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    }
};