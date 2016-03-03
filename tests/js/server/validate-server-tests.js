// Tests of the core validator.
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");
//jqUnit.module("Unit tests for validation component...");
//
//// We cannot use proper test sequences without writing some kind of event wrapper around the `validate` invoker.
//// For now, just issue a single test to give the validator time to start up.
//jqUnit.asyncTest("Waiting for stuff to start....", function () {
//    setTimeout(function () { jqUnit.start(); jqUnit.assertTrue("Stuff has started", true); }, 2000);
//});

require("../../../");
require("../common/validate-common-test-definitions");
require("../lib/errors");

fluid.registerNamespace("gpii.schema.tests.validator.server");

// We are working with test definitions that look like:
//
//  emptyDerived: {
//    message:     "Validate an empty 'derived' record....",
//    schema:      "derived.json",
//    content:     {},
//    errors:      true,
//    errorPaths: [".required", ".deeply.nested.additionalRequired"]
//  }
//
// See `options.tests` below for examples.
//
gpii.schema.tests.validator.server.singleTest = function (that, test) {
    var result = that.validate(test.schema, test.content);

    if (test.errors) {
        if (test.errorPaths) {
            gpii.schema.tests.hasFieldErrors(result, test.errorPaths);
        }
        if (test.multipleErrorPaths) {
            gpii.schema.tests.hasFieldErrors(result, test.multipleErrorPaths, true);
        }
    }
    else {
        jqUnit.assertUndefined("There should be no validation errors...", result);
    }
};


// This last test is the only one that can't use the common definitions or `hasFieldErrors` function...
gpii.schema.tests.validator.server.invalidJsonTest = function (that) {
    var result = that.validate("base.json", "{}");
    jqUnit.assertNotUndefined("There should be validation errors...", result);
};

// We need a custom test sequence constructor.  We rehydrate the common test cases here.
gpii.schema.tests.validator.server.constructTestSequences = function (that) {
    var generatedTests = [];

    // iterate through the test definitions and generate sequences as outlined above.
    fluid.each(that.options.commonTests, function (testDefinition) {
        var generatedCommonTest = {
            name:     testDefinition.message,
            sequence: [
                {
                    func: "{testEnvironment}.events.onConstructFixtures.fire"
                },
                {
                    event:    "{testEnvironment}.events.onSchemasLoaded",
                    listener: "gpii.schema.tests.validator.server.singleTest",
                    args:     ["{testEnvironment}.validator", testDefinition]
                }
            ]
        };
        generatedTests.push(generatedCommonTest);
    });

    // This one isn't part of the commmon test definitions, so we generate and add it manually.
    var generatedBonusTest = {
        name: "Test invalid JSON content...",
        sequence: [
            {
                func: "{testEnvironment}.events.onConstructFixtures.fire"
            },
            {
                event:    "{testEnvironment}.events.onSchemasLoaded",
                listener: "gpii.schema.tests.validator.server.invalidJsonTest",
                args:     ["{testEnvironment}.validator"]
            }
        ]
    };

    generatedTests.push(generatedBonusTest);

    return { tests: generatedTests };
};


// Use the standard `gpii-test-browser` caseHolder, but use a more complex function to rehydrate the "common" tests
// before wiring in the standard start and end sequence steps.
fluid.defaults("gpii.schema.tests.validator.server.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder", "gpii.schema.tests.validator.hasDehydratedTests"],
    moduleSource: {
        funcName: "gpii.schema.tests.validator.server.constructTestSequences",
        args:     ["{that}"]
    }
});

fluid.defaults("gpii.schema.tests.validator.server.environment", {
    gradeNames: ["fluid.test.testEnvironment"],
    events: {
        onSchemasLoaded:    null,
        onConstructFixtures: null
    },
    components: {
        validator: {
            type: "gpii.schema.validator.ajv.server",
            createOnEvent: "onConstructFixtures",
            options: {
                schemaDirs: "%gpii-json-schema/tests/schemas",
                schemaKey:  "base.json",
                listeners: {
                    "onSchemasLoaded.notifyEnvironment": {
                        func: "{testEnvironment}.events.onSchemasLoaded.fire"
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.schema.tests.validator.server.caseHolder"
        }
    }
});

gpii.schema.tests.validator.server.environment();