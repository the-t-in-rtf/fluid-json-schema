/*

  Pass the parser a bad JSON Schema and confirm that it throws an error.

 */
"use strict";
var fluid  =  require("infusion");
var gpii   = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

var path   = require("path");
// TODO: move to using resolveable paths
var schemaDir = path.resolve(__dirname, "../badSchemas");

// TODO:  Move to using a common server-side include in index.js
require("../../src/js/common/parser");
require("../../src/js/common/validate");
require("../../src/js/server/validate");

fluid.defaults("gpii.schema.tests.validator.bornToDie", {
    gradeNames: ["gpii.schema.validator.server"],
    schemaDir: schemaDir
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
    jqUnit.expectFrameworkDiagnostic("The component should thrown an error on startup...", gpii.schema.tests.validator.bornToDie, ["ENOENT"]);
    //jqUnit.expectFrameworkDiagnostic("The component should thrown an error on startup...", gpii.fuck.off, ["DIE!"]);
});
