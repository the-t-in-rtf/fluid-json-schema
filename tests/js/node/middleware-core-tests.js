/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var gpii   = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

fluid.require("%gpii-json-schema");

jqUnit.module("Core tests for express validation middleware grade.");

jqUnit.test("We should be able to instantiate the base grade without errors.", function () {
    gpii.schema.validationMiddleware();
    jqUnit.assert("We should be able to instantiate 'gpii.schema.validationMiddleware' with only the defaults.");
});
