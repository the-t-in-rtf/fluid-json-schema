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

// The constructor itself does not call fluid.fail (or at least at not in the way expected here).  The failure is
// thrown by a promise, which itself is created by a listener that responds to the loading of template content during
// startup.
// TODO:  Review with Antranig.
jqUnit.asyncTest("Testing parser resolutions of failed promise...", function () {

    jqUnit.expectFrameworkDiagnostic("The component should thrown an error on startup...", gpii.schema.tests.validator.bornToDie, ["ENOENT"]);
});