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

require("gpii-test-browser");

require("../lib/errors");
require("../lib/harness");
require("../common/validate-common-test-definitions");

require("../../../");

require("gpii-express");
gpii.express.loadTestingSupport();

require("gpii-test-browser");
gpii.test.browser.loadTestingSupport();

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
                func: "{gpii.tests.schema.validator.browser.environment}.browser.goto",
                args: ["{gpii.tests.schema.validator.browser.environment}.options.url"]
            },
            // TODO:  Listen for the client-side component's `onTemplatesLoaded` event once https://issues.gpii.net/browse/GPII-1574 is fixed.
            {
                event:    "{gpii.tests.schema.validator.browser.environment}.browser.events.onLoaded",
                listener: "{gpii.tests.schema.validator.browser.environment}.browser.wait",
                args:     [500]
            },
            {
                event:    "{gpii.tests.schema.validator.browser.environment}.browser.events.onWaitComplete",
                listener: "{gpii.tests.schema.validator.browser.environment}.browser.evaluate",
                args:     [gpii.tests.schema.validator.browser.validateContent, testDefinition.schema, testDefinition.content]
            }
        ];

        if (testDefinition.errors) {
            var errorPaths   = hasMultiples ? testDefinition.multipleErrorPaths : testDefinition.errorPaths;

            sequence.push({
                event:    "{gpii.tests.schema.validator.browser.environment}.browser.events.onEvaluateComplete",
                listener: "gpii.test.schema.hasFieldErrors",
                args:     ["{arguments}.0", errorPaths, hasMultiples]
            });
        }
        else {
            sequence.push({
                event:    "{gpii.tests.schema.validator.browser.environment}.browser.events.onEvaluateComplete",
                listener: "jqUnit.assertEquals",
                args:     ["There should be no errors...", undefined, "{arguments}.0"]
            });
        }
        var generatedTest = {
            name:     testDefinition.message,
            sequence: sequence
        };
        generatedTests.push(generatedTest);
    });

    // Finish off each sequence by running it through the `gpii.express` function that prepends and appends sequence steps.
    var finalSequences = gpii.test.express.helpers.addRequiredSequences([{ name: "Testing client-side validation...", tests: generatedTests }], that.options.sequenceStart, that.options.sequenceEnd);

    return finalSequences;
};


// Use the standard `gpii-test-browser` caseHolder, but use a more complex function to rehydrate the "common" tests
// before wiring in the standard start and end sequence steps.
fluid.defaults("gpii.tests.schema.validator.browser.caseHolder", {
    gradeNames: ["gpii.test.browser.caseHolder.withExpress", "gpii.test.schema.validator.hasDehydratedTests"],
    moduleSource: {
        funcName: "gpii.tests.schema.validator.browser.constructTestSequences",
        args:     ["{that}"]
    }
});

fluid.defaults("gpii.tests.schema.validator.browser.environment", {
    gradeNames: ["gpii.test.browser.environment.withExpress"],
    port:   6984,
    url: {
        expander: {
            funcName: "fluid.stringTemplate",
            args: ["http://localhost:%port/content/validate-client-tests.html", {port: "{that}.options.port"}]
        }
    },
    components: {
        express: {
            type: "gpii.test.schema.harness",
            options: {
                port: "{testEnvironment}.options.port"
            }
        },
        browser: {
            options: {
                listeners: {
                    "onError": {
                        funcName: "fluid.log",
                        args: ["BROWSER ERROR:", "{arguments}.0"]
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.tests.schema.validator.browser.caseHolder"
        }
    }
});

fluid.test.runTests("gpii.tests.schema.validator.browser.environment");