// Tests of the core validator.
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

require("../../");
require("./validate-common-test-definitions");
require("./lib/errors");

jqUnit.module("Unit tests for validation component...");

var testValidator = gpii.schema.validator.ajv.server({
    gradeNames: ["gpii.schema.tests.validator"],
    schemaPath: "%gpii-json-schema/tests/schemas",
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.schema.tests.validator.runTests",
            args:     ["{that}"]
        }
    }
});

console.log("Test component with id '" + testValidator.id + "' available under the global name 'testValidator'...");