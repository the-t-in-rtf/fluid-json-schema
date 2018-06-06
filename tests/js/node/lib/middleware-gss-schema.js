/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.tests.schemas.middleware");

gpii.tests.schemas.middleware.gatedSchema = {
    "type": "object",
    "title": "'Gated' schema...",
    "description": "Schema for use in exercising our middleware and client-side components.",
    "properties": {
        "failAfterValidation": {
            "type": "boolean"
        },
        "testString": {
            "type": "string",
            "minLength": 4,
            "maxLength": 9,
            "pattern": ".*CAT.*"
        },
        "testAllOf": {
            "allOf": [
                {
                    "type": "string"
                },
                {
                    "minLength": 4
                },
                {
                    "maxLength": 9
                },
                {
                    "pattern": ".*CAT.*"
                }
            ]
        },
        "deep": {
            "type": "object",
            "properties": {
                "deeplyRequired": {
                    "type": "string",
                    "required": true
                }
            }
        },
        "shallowlyRequired": {
            "required": true
        }
    }
};
