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

fluid.defaults("gpii.schema.tests.parser.bornToDie", {
    gradeNames: ["gpii.schema.parser"],
    schemaDirs: "%gpii-json-schema/tests/badSchemas"
});

fluid.registerNamespace("gpii.schema.tests.parser.failure");
gpii.schema.tests.parser.failure.confirmErrorFired = function (error) {
    jqUnit.assertTrue("Attempting to load bad remote schemas fails as expected...", error && error.message && (error.message.indexOf("ENOENT") !== -1));
    console.log(error);
};

fluid.defaults("gpii.schema.tests.parser.failure.caseholder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    modules: {
        tests: [
            {
                name: "Confirm that bad schemas eventually trigger a failure...",
                type: "test",
                sequence: [
                    {
                        funcName: "kettle.test.pushInstrumentedErrors",
                        args: "gpii.schema.tests.parser.failure.confirmErrorFired"
                    },
                    {
                        funcName: "gpii.schema.tests.parser.bornToDie",
                        args: []
                    }
                ]
            }
        ]
    }
});

fluid.test.testEnvironment({
    components: {
        caseHolder: {
            type: "gpii.schema.tests.parser.failure.caseholder"
        }
    }
});