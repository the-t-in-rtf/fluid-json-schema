/*

  Pass the parser a bad JSON Schema and confirm that it throws an error.

 */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../index");

fluid.defaults("gpii.schema.tests.validator.bornToDie", {
    gradeNames: ["gpii.schema.validator.ajv.server"],
    schemaPath:  "%gpii-json-schema/tests/badSchemas"
});

fluid.defaults("gpii.fuck.off", {
    gradeNames: ["fluid.component"],
    listeners: {
        "onCreate.misbehave": {
            funcName: "fluid.fail",
            args: ["DIE!"]
        }
    }
});

jqUnit.test("Testing parser resolutions of failed promise...", function () {
    //jqUnit.expectFrameworkDiagnostic("The component should thrown an error on startup...", gpii.schema.tests.validator.bornToDie, ["ENOENT"]);
    jqUnit.expectFrameworkDiagnostic("The component should thrown an error on startup...", gpii.fuck.off, ["DIE!"]);
});
