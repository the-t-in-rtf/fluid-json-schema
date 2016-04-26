/*

  Pass the parser a bad JSON Schema and confirm that it throws an error.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

var jqUnit = require("node-jqunit");

require("../../../index");

fluid.defaults("gpii.tests.schema.parser.bornToDie", {
    gradeNames: ["gpii.schema.parser"],
    schemaDirs: "%gpii-json-schema/tests/badSchemas"
});

fluid.registerNamespace("gpii.tests.schema.parser.failure");
gpii.tests.schema.parser.failure.confirmErrorFired = function (error) {
    jqUnit.assertTrue("Attempting to load bad remote schemas fails as expected...", error && error.message && (error.message.indexOf("ENOENT") !== -1));
    console.log(error);
};

fluid.defaults("gpii.tests.schema.parser.failure.caseholder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: {
        name: "Testing failure modes in parser...",
        tests: [
            {
                name: "Confirm that bad schemas eventually trigger a failure...",
                type: "test",
                sequence: [
                    {
                        funcName: "kettle.test.pushInstrumentedErrors",
                        args: "gpii.tests.schema.parser.failure.confirmErrorFired"
                    },
                    {
                        funcName: "gpii.tests.schema.parser.bornToDie",
                        args: []
                    }
                ]
            }
        ]
    }
});

fluid.defaults("gpii.tests.schema.parser.failure.testEnvironment", {
    gradeNames: ["fluid.test.testEnvironment"],
    components: {
        caseHolder: {
            type: "gpii.tests.schema.parser.failure.caseholder"
        }
    }
});

fluid.test.runTests("gpii.tests.schema.parser.failure.testEnvironment");