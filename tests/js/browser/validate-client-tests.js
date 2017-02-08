/* eslint-env node */
"use strict";
// Test "validator" components using browser and filesystem content.
//
// browser provides two means of interrogating globals within the browser, namely:
//
// 1. `browser.assert.global(name, expected, message)`, which tests the global with `name` to confirm that it matches
//     `expected`, and throws `message` if it does not.
//
// 2. `browser.window[fieldName]` provides direct access to the global variable `fieldName`.
//
// We will use the latter in these tests and using `jqUnit` assertions.  The page itself will use jQuery to manipulate
// all controls, browser is only inspecting the final results.
//
// We have to load this via a `gpii.express` instance because file URLs don't work on windows:
//
// https://github.com/assaf/browser/issues/915

var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../lib/errors");
require("../lib/harness");
require("./environment");
require("../common/validate-common-test-definitions");

require("../../../");

// var jqUnit = require("node-jqunit");
// jqUnit.asyncTest("Waiting for stuff to start....", function () {
//     setTimeout(function () { jqUnit.start(); jqUnit.assert("Stuff has started"); }, 1000);
// });

fluid.registerNamespace("gpii.tests.schema.validator.browser");

// A client-side function to submit JSON content to the client-side component via `gpii-test-browser` and return the output.
//
// Expects to be passed:
//
//   1. `validatorPath`: The namespaced path to the test component.
//   2. `schema`: The id of the schema to validate against.
//   3. `content`: The JSON content to validate.
//
// Returns the output in JSON format.
//
gpii.tests.schema.validator.browser.validateContent = function (schema, content) {
    /* globals clientValidator */
    return clientValidator.validate(schema, content);
};

// A function to wire up a series of test sequences based on our "common" (to this package) test format:
//
//  emptyDerived: {
//    message:     "Validate an empty 'derived' record....",
//    schema:      "derived.json",
//    content:     {},
//    errors:      true,
//    errorPaths: [".required", ".deeply.nested.additionalRequired"]
//  }
//
// This would result in a test sequence that loads a page and then evaluates various statements like:
//
//  {
//    name: "Validate an empty 'derived' record...",
//    sequence: [
//      {
//        func: "{gpii.handlebars.tests.browser.environment}.browser.goto",
//        args: ["{gpii.handlebars.tests.browser.environment}.options.url"]
//      },
//      {
//        event:    "{gpii.handlebars.tests.browser.environment}.browser.events.onLoaded",
//        listener: "{gpii.handlebars.tests.browser.environment}.browser.evaluate",
//        args:     [gpii.tests.schema.validator.browser.validateContent, "derived.json", {}]
//      },
//      {
//        event:    "{gpii.handlebars.tests.browser.environment}.browser.events.onEvaluateComplete",
//        listener: "gpii.test.schema.hasFieldErrors",
//        args:     ["The correct errors should be returned...", [".required", ".deeply.nested.additionalRequired"]]
//      },
//    ]
//  }
//
// The checks for multiples are similar, but add a final `true` argument to the call to
// `gpii.test.schema.hasFieldErrors`.
//
// The checks for tests that do not have errors would look even simpler, as we are expecting `undefined` to be the
// output and can simply use `jqUnit.assertUndefined` to test that..
//
// The generated sequences are eventually run through the normal process that the `addRequiredSequences` function
// provided by `gpii.express` uses.  Thus, you can use the same `sequenceStart` and `sequenceEnd` options.
//
gpii.tests.schema.validator.browser.constructTestSequences = function (that) {
    var generatedTests = [];

    // iterate through the test definitions and generate sequences as outlined above.
    fluid.each(that.options.commonTests, function (testDefinition) {
        var hasMultiples = Boolean(testDefinition.multipleErrorPaths);
        var sequence = [
            {
                func: "{testEnvironment}.webdriver.get",
                args: ["{testEnvironment}.options.url"]
            },
            // TODO:  Listen for the client-side component's `onTemplatesLoaded` event.
            {
                event:    "{testEnvironment}.webdriver.events.onGetComplete",
                listener: "{testEnvironment}.webdriver.sleep",
                args:     [500]
            },
            {
                event:    "{testEnvironment}.webdriver.events.onSleepComplete",
                listener: "{testEnvironment}.webdriver.executeScript",
                args:     [gpii.tests.schema.validator.browser.validateContent, testDefinition.schema, testDefinition.content]
            }
        ];

        if (testDefinition.errors) {
            var errorPaths   = hasMultiples ? testDefinition.multipleErrorPaths : testDefinition.errorPaths;

            sequence.push({
                event:    "{testEnvironment}.webdriver.events.onExecuteScriptComplete",
                listener: "gpii.test.schema.hasFieldErrors",
                args:     ["{arguments}.0", errorPaths, hasMultiples]
            });
        }
        else {
            sequence.push({
                event:    "{testEnvironment}.webdriver.events.onExecuteScriptComplete",
                listener: "jqUnit.assertNull",
                args:     ["There should be no errors...", "{arguments}.0"]
            });
        }
        var generatedTest = {
            name:     testDefinition.message,
            sequence: sequence
        };
        generatedTests.push(generatedTest);
    });

    // Finish off each sequence by running it through the `gpii.express` function that prepends and appends sequence steps.
    var modulesWithStartAndEnd = gpii.test.express.helpers.addRequiredSequences([{ name: "Testing client-side validation...", tests: generatedTests }], that.options.sequenceStart, that.options.sequenceEnd);
    var transformedSequences = fluid.transform(modulesWithStartAndEnd, that.prepareModule);
    return transformedSequences;
};


// Use the standard `gpii-test-browser` caseHolder, but use a more complex function to rehydrate the "common" tests
// before wiring in the standard start and end sequence steps.
fluid.defaults("gpii.tests.schema.validator.browser.caseHolder", {
    gradeNames: ["gpii.test.webdriver.caseHolder", "gpii.test.schema.validator.hasDehydratedTests"],
    moduleSource: {
        funcName: "gpii.tests.schema.validator.browser.constructTestSequences",
        args:     ["{that}"]
    }
});

fluid.defaults("gpii.tests.schema.validator.browser.environment", {
    gradeNames: ["gpii.tests.schema.browser.environment"],
    port:   6985,
    endpoint: "/content/validate-client-tests.html",
    components: {
        caseHolder: {
            type: "gpii.tests.schema.validator.browser.caseHolder"
        }
    }
});

gpii.test.webdriver.allBrowsers({ baseTestEnvironment: "gpii.tests.schema.validator.browser.environment"});
