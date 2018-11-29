/*

    Generate sample AJV validation errors when various conditions are not met.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var AJV = require("ajv");
var ajv = new AJV({ allErrors: true });

require("../validator-tests-ajv-errors-testDefs");

var defs = {
    "contains": {
        schema: { "type": "array", "contains": { type: "string"} },
        input: []
    },
    "dependencies": {
        schema: { properties: { foo: {}, bar: {}}, dependencies: { foo: ["bar"], bar: ["foo"]}},
        input: { foo: true }
    },
    "else": {
        schema: { if: { type: "string"}, then: { maxLength: 1}, else: { type: "boolean"} },
        input: 1
    },
    "enum": {
        schema: { enum: ["yes"]},
        input: "no"
    },
    "exclusiveMaximum": {
        schema: { exclusiveMaximum: 10 },
        input: 10
    },
    "exclusiveMinimum": {
        schema: { exclusiveMinimum: 2 },
        input: 2
    },
    "format": {
        schema: { type: "string", format: "email" },
        input: "not an email address"
    },
    "maxItems": {
        schema: { type: "array", maxItems: 1},
        input: [1,2]
    },
    "maxLength": {
        schema: { type: "string", maxLength: 2},
        input: "foo"
    },
    "maxProperties": {
        schema: { maxProperties: 1 },
        input: { foo: true, bar: true}
    },
    "maximum": {
        schema: { type: "number", maximum: 3},
        input: 4
    },
    "minItems": {
        schema: { type: "array", minItems: 1},
        input: []
    },
    "minLength": {
        schema: { minLength: 2},
        input: "z"
    },
    "minProperties": {
        schema: { minProperties: 1 },
        input: {}
    },
    "minimum": {
        schema: { minimum: 5 },
        input: 4
    },
    "multipleOf": {
        schema: { multipleOf: 2 },
        input: 3
    },
    "not": {
        schema: { not: { type: "number"} },
        input: 0
    },
    "oneOf": {
        schema: { oneOf: [{type: "string"}]},
        input: false
    },
    "pattern": {
        schema: { type: "string", pattern: "a+" },
        input: "bbbb"
    },
    "propertyNames": {
        schema: { type: "object", propertyNames: { pattern: "z.+" }},
        input: { foo: "bar"}
    },
    "required": {
        schema: { required: ["foo"]},
        input: {}
    },
    "then": {
        schema: { if: { type: "string"}, then: { maxLength: 1}, else: { type: "boolean"} },
        input: "too long"
    },
    "type": {
        schema: { type: "string" },
        input: false
    },
    "uniqueItems": {
        schema: { uniqueItems: true },
        input: [0,1,0]
    }
};

var combinedResults = {};
fluid.each(defs, function (def, key) {
    var validator = ajv.compile(def.schema);
    var validationResults = validator(def.input);
    if (!validationResults) {
        combinedResults[key] = { input: validator.errors, schema: def.schema };
    }
});

console.log(JSON.stringify(fluid.merge({}, gpii.tests.validator.ajvErrors, combinedResults), null, 2));
