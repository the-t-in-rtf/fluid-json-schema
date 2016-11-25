// Tests of the core validator.
/* eslint-env node */
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../../");
require("../common/validate-common-test-definitions");
require("../lib/errors");
require("../lib/fixtures");

fluid.registerNamespace("gpii.tests.schema.validator.server");

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
gpii.tests.schema.validator.server.singleTest = function (that, test) {
    var result = that.validate(test.schema, test.content);

    if (test.errors) {
        if (test.errorPaths) {
            gpii.test.schema.hasFieldErrors(result, test.errorPaths);
        }
        if (test.multipleErrorPaths) {
            gpii.test.schema.hasFieldErrors(result, test.multipleErrorPaths, true);
        }
    }
    else {
        jqUnit.assertUndefined("There should be no validation errors...", result);
    }
};


// This last test is the only one that can't use the common definitions or `hasFieldErrors` function...
gpii.tests.schema.validator.server.invalidJsonTest = function (that) {
    var result = that.validate("base.json", "{}");
    jqUnit.assertNotUndefined("There should be validation errors...", result);
};

// We need a custom test sequence constructor.  We rehydrate the common test cases here.
gpii.tests.schema.validator.server.constructTestSequences = function (that) {
    var generatedTests = [];

    // iterate through the test definitions and generate sequences as outlined above.
    fluid.each(that.options.commonTests, function (testDefinition) {
        var generatedCommonTest = {
            name:     testDefinition.message,
            sequence: [{
                func: "gpii.tests.schema.validator.server.singleTest",
                args: ["{testEnvironment}.validator", testDefinition]
            }]
        };
        generatedTests.push(generatedCommonTest);
    });

    // This one isn't part of the commmon test definitions, so we generate and add it manually.
    var generatedBonusTest = {
        name: "Test invalid JSON content...",
        sequence: [{
            func: "gpii.tests.schema.validator.server.invalidJsonTest",
            args: ["{testEnvironment}.validator"]
        }]
    };

    generatedTests.push(generatedBonusTest);

    var testsWithStartAndEnd = gpii.test.express.helpers.addRequiredSequences([{
        name: "Testing server-side validation...",
        tests: generatedTests
    }], that.options.sequenceStart, that.options.sequenceEnd);

    return testsWithStartAndEnd;
};

gpii.tests.schema.validator.server.standardStartSequence = [
    {
        func: "{testEnvironment}.events.onConstructFixtures.fire"
    },
    {
        event:    "{testEnvironment}.events.onSchemasLoaded",
        listener: "fluid.identity"
    }
];



// Use the standard `gpii-test-browser` caseHolder, but use a more complex function to rehydrate the "common" tests
// before wiring in the standard start and end sequence steps.
fluid.defaults("gpii.tests.schema.validator.server.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder", "gpii.test.schema.validator.hasDehydratedTests"],
    sequenceStart: gpii.tests.schema.validator.server.standardStartSequence,
    mergePolicy: {
        rawModules:    "noexpand",
        sequenceStart: "noexpand",
        sequenceEnd:   "noexpand"
    },
    moduleSource: {
        funcName: "gpii.tests.schema.validator.server.constructTestSequences",
        args:     ["{that}"]
    }
});

fluid.defaults("gpii.tests.schema.validator.server.environment.base", {
    gradeNames: ["gpii.test.schema.testEnvironment"],
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
        }
    }
});

fluid.defaults("gpii.tests.schema.validator.server.environment.standard", {
    gradeNames: ["gpii.tests.schema.validator.server.environment.base"],
    components: {
        caseHolder: {
            type: "gpii.tests.schema.validator.server.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.schema.validator.server.environment.standard");

// The next tests can use the standard harness from gpii-express
fluid.registerNamespace("gpii.tests.schema.validator.server.caseHolder.replay");
gpii.tests.schema.validator.server.caseHolder.replay.validateMultiples = function (validator, schemaKey, message, inputs, expected) {
    var results = [];
    fluid.each(inputs, function (input) {
        var result = validator.validate(schemaKey, input);
        results.push(result === undefined);
    });

    jqUnit.assertDeepEq(message, expected, results);
};

fluid.defaults("gpii.tests.schema.validator.server.caseHolder.replay", {
    gradeNames: ["gpii.test.express.caseHolder.base"],
    sequenceStart: gpii.tests.schema.validator.server.standardStartSequence,
    schemaKey: "base.json",
    rawModules: [{
        name: "Testing multiple validations with a single component...",
        tests: [
            {
                name: "Fail twice in a row...",
                type: "test",
                sequence: [
                    {
                        func: "gpii.tests.schema.validator.server.caseHolder.replay.validateMultiples",
                        args: ["{testEnvironment}.validator", "{that}.options.schemaKey", "We should be able to fail after a failure...", [{},{}], [false, false]]
                    }
                ]
            },
            {
                name: "Succeed twice in a row...",
                type: "test",
                sequence: [
                    {
                        func: "gpii.tests.schema.validator.server.caseHolder.replay.validateMultiples",
                        args: ["{testEnvironment}.validator", "{that}.options.schemaKey", "We should be able to succeed after a success...", [{ required: true },{ required: true }], [true, true]]
                    }
                ]
            },
            {
                name: "Succeed, then fail...",
                type: "test",
                sequence: [
                    {
                        func: "gpii.tests.schema.validator.server.caseHolder.replay.validateMultiples",
                        args: ["{testEnvironment}.validator", "{that}.options.schemaKey", "We should be able to fail after a success...", [{ required: true },{}], [true, false]]
                    }
                ]
            },
            {
                name: "Fail, then succeed...",
                type: "test",
                sequence: [
                    {
                        func: "gpii.tests.schema.validator.server.caseHolder.replay.validateMultiples",
                        args: ["{testEnvironment}.validator", "{that}.options.schemaKey", "We should be able to succeed after a failure...", [{},{ required: true }], [false, true]]
                    }
                ]
            }
        ]
    }]
});

fluid.defaults("gpii.tests.schema.validator.server.environment.replay", {
    gradeNames: ["gpii.tests.schema.validator.server.environment.base"],
    components: {
        caseHolder: {
            type: "gpii.tests.schema.validator.server.caseHolder.replay"
        }
    }
});

fluid.test.runTests("gpii.tests.schema.validator.server.environment.replay");
