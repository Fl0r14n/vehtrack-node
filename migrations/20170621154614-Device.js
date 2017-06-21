'use strict';
module.exports = {
    up: function(queryInterface, Sequelize) {
        return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
        .then(() => {
            return queryInterface.createTable('Device',
            {
                "id": {
                    "type": "INTEGER",
                    "allowNull": false,
                    "primaryKey": true,
                    "autoIncrement": true
                },
                "serial": {
                    "type": "VARCHAR(30)"
                },
                "type": {
                    "type": "VARCHAR(30)"
                },
                "description": {
                    "type": "VARCHAR(255)",
                    "defaultValue": ""
                },
                "phone": {
                    "type": "VARCHAR(12)",
                    "defaultValue": "",
                    "validate": {
                        "is": {
                            "args": {},
                            "msg": "Enter a valid phone number!"
                        }
                    }
                },
                "plate": {
                    "type": "VARCHAR(30)",
                    "defaultValue": ""
                },
                "vin": {
                    "type": "VARCHAR(17)",
                    "defaultValue": "",
                    "validate": {
                        "is": {
                            "args": {},
                            "msg": "Enter a valid Vehicle Identification Number!"
                        }
                    }
                },
                "imei": {
                    "type": "VARCHAR(15)",
                    "defaultValue": "",
                    "validate": {
                        "is": {
                            "args": {},
                            "msg": "Enter a valid International Mobile Station Equipment Identity!"
                        }
                    }
                },
                "imsi": {
                    "type": "VARCHAR(15)",
                    "defaultValue": "",
                    "validate": {
                        "is": {
                            "args": {},
                            "msg": "Enter a valid International mobile subscriber identity!"
                        }
                    }
                },
                "msisdn": {
                    "type": "VARCHAR(14)",
                    "defaultValue": "",
                    "validate": {
                        "is": {
                            "args": {},
                            "msg": "Enter a valid mobile subscriber integrated services digital network number!"
                        }
                    }
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
                    "unique": true,
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
            return queryInterface.dropTable('Device');
        })
        .then(() => {
            return queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        });
    }
};