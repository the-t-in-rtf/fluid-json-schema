/*

  Pass the parser a bad JSON Schema and confirm that it throws an error.

 */
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.loadTestingSupport();

var kettle = require("kettle");
kettle.loadTestingSupport();

var jqUnit = require("node-jqunit");

fluid.require("%gpii-express");
gpii.express.loadTestingSupport();
gpii.express.loadGlobalFailureHandler();


fluid.require("%gpii-json-schema");

fluid.defaults("gpii.tests.schema.parser.bornToDie", {
    gradeNames: ["gpii.schema.parser"],
    schemaDirs: "%gpii-json-schema/tests/badSchemas"
});

fluid.registerNamespace("gpii.tests.schema.parser.failure");
// TODO: Wire this into the listener
gpii.tests.schema.parser.failure.confirmErrorFired = function (errors) {
    var matchingError = fluid.find(errors, function (error) {
        if (error.message && error.message.indexOf("ENOENT") !== -1) {
            return true;
        }
    });
    jqUnit.assertTrue("There should be an error that matches what we expecte...", matchingError);
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
                        args:     ["gpii.test.notifyGlobalFailure"]
                    },
                    {
                        funcName: "gpii.tests.schema.parser.bornToDie",
                        args:     []
                    },
                    {
                        event:    "{globalFailureHandler}.events.onError",
                        listener: "gpii.tests.schema.parser.failure.confirmErrorFired",
                        args:     ["{arguments}.0"] // errors
                    },
                    {
                        funcName: "kettle.test.popInstrumentedErrors"
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
