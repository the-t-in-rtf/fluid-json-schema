/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii = fluid.registerNamespace("gpii");

fluid.require("%gpii-json-schema/src/js/server/lib/schemaUrlAssembler.js");

var jqUnit = require("node-jqunit");

fluid.registerNamespace("gpii.test.schema.urlAssembler");

gpii.test.schema.urlAssembler.runSingleTest = function (testDef) {
    jqUnit.test(testDef.message, function () {
        var output = gpii.schema.urlAssembler.apply(null, testDef.args);
        jqUnit.assertEquals("The output should be as expected...", testDef.expected, output);
    });
};

fluid.defaults("gpii.test.schema.urlAssembler.testRunner", {
    gradeNames: ["fluid.component"],
    testDefs: {
        baseAndFilename: {
            message:  "A schema directory and filename should be handled correctly...",
            args:     ["http://some.host/base/path/", "schema.json"],
            expected: "http://some.host/base/path/schema.json"
        },
        baseAndPath: {
            message:  "A schema directory and relative schema path should be handled correctly...",
            args:     ["http://some.host/base/path/", "/some/other/path/schema.json"],
            expected: "http://some.host/some/other/path/schema.json"
        },
        noArgs: {
            message:  "Sending no arguments should result in an undefined value...",
            args:     [],
            expected: undefined
        },
        noBaseUrl: {
            message:  "Sending an undefined base URL should result in an undefined value...",
            args:     [undefined, "schema.json"],
            expected: undefined
        },
        noSchemaPath: {
            message:  "Sending an undefined schema path should results in an undefined value...",
            args:     ["http://some.host/base/path/", undefined],
            expected: undefined
        }
    },
    listeners: {
        "onCreate.setModuleName": {
            priority: "first",
            funcName: "jqUnit.module",
            args:     ["Unit tests for schema URL assembler..."]
        },
        "onCreate.runTests": {
            funcName: "fluid.each",
            args: ["{that}.options.testDefs", gpii.test.schema.urlAssembler.runSingleTest]
        }
    }
});

gpii.test.schema.urlAssembler.testRunner();
