// Tests of the core validator.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");

var path = require("path");

require("../../src/js/server/validate");
require("./validate-common-tests");
require("./lib/errors");

var basePath    = path.resolve(__dirname, "../schemas/base.json");
var derivedPath = path.resolve(__dirname, "../schemas/derived.json");
var deepPath    = path.resolve(__dirname, "../schemas/deep.json");
var escapedPath = path.resolve(__dirname, "../schemas/escaped.json");

jqUnit.module("Unit tests for validation component...");

var testValidator = gpii.schema.validator.server({
    gradeNames: ["gpii.schema.tests.validator"],
    schemaFiles: {
        base:    basePath,
        derived: derivedPath,
        deep:    deepPath,
        escaped: escapedPath
    },
    listeners: {
        "onCreate.runTests": {
            funcName: "gpii.schema.tests.validator.runTests",
            args:     ["{that}"]
        }
    }
});

console.log("Test component with id '" + testValidator.id + "' available under the global name 'testValidator'...");