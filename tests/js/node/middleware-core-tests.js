/* eslint-env node */
"use strict";
var fluid  = require("infusion");
var jqUnit = require("node-jqunit");

require("../../../");

jqUnit.module("Core tests for express validation middleware grade.");

jqUnit.test("We should be able to instantiate the base grade without errors.", function () {
    fluid.schema.validationMiddleware();
    jqUnit.assert("We should be able to instantiate 'fluid.schema.validationMiddleware' with only the defaults.");
});
