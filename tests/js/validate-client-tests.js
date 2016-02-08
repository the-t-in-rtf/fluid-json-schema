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

require("./lib/errors");
require("./test-harness");
require("./validate-common-test-definitions");
require("../../src/js/server/validate");

require("gpii-express");
gpii.express.loadTestingSupport();

fluid.registerNamespace("gpii.schema.tests.validator.browser");

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
gpii.schema.tests.validator.browser.validateContent = function (schema, content) {
    /* globals clientValidator */
    return clientValidator.validate(schema, content);
};

// A function to evaluate whether the correct errors were returned
gpii.schema.tests.validator.browser.hasCorrectErrors = function (validatorOutput, errorFields, multiple) {
    gpii.schema.tests.hasFieldErrors(validatorOutput, errorFields, multiple);
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
//        func: "{gpii.templates.tests.browser.environment}.browser.goto",
//        args: ["{gpii.templates.tests.browser.environment}.options.url"]
//      },
//      {
//        event:    "{gpii.templates.tests.browser.environment}.browser.events.onLoaded",
//        listener: "{gpii.templates.tests.browser.environment}.browser.evaluate",
//        args:     [gpii.schema.tests.validator.browser.validateContent, "derived.json", {}]
//      },
//      {
//        event:    "{gpii.templates.tests.browser.environment}.browser.events.onEvaluateComplete",
//        listener: "gpii.schema.tests.validator.browser.hasCorrectErrors",
//        args:     ["The correct errors should be returned...", [".required", ".deeply.nested.additionalRequired"]]
//      },
//    ]
//  }
//
// The checks for multiples are similar, but add a final `true` argument to the call to
// `gpii.schema.tests.validator.browser.hasCorrectErrors`.
//
// The checks for tests that do not have errors would look even simpler, as we are expecting `undefined` to be the
// output and can simply use `jqUnit.assertUndefined` to test that..
//
// The generated sequences are eventually run through the normal process that the `addRequiredSequences` function
// provided by `gpii.express` uses.  Thus, you can use the same `sequenceStart` and `sequenceEnd` options.
//
gpii.schema.tests.validator.browser.constructTestSequences = function (that) {
    var generatedTests = [];

    // iterate through the test definitions and generate sequences as outlined above.
    fluid.each(that.options.commonTests, function (testDefinition) {
        var hasMultiples = Boolean(testDefinition.multipleErrorPaths);
        var sequence = [
            {
                func: "{gpii.schema.tests.validator.browser.environment}.browser.goto",
                args: ["{gpii.schema.tests.validator.browser.environment}.options.url"]
            },

            {
                event:    "{gpii.schema.tests.validator.browser.environment}.browser.events.onLoaded",
                listener: "{gpii.schema.tests.validator.browser.environment}.browser.evaluate",
                args:     [gpii.schema.tests.validator.browser.validateContent, testDefinition.schema, testDefinition.content]
            }
        ];

        if (testDefinition.errors) {
            var errorPaths   = hasMultiples ? testDefinition.multipleErrorPaths : testDefinition.errorPaths;

            sequence.push({
                event:    "{gpii.schema.tests.validator.browser.environment}.browser.events.onEvaluateComplete",
                listener: "gpii.schema.tests.validator.browser.hasCorrectErrors",
                args:     ["{arguments}.0", errorPaths, hasMultiples]
            });
        }
        else {
            sequence.push({
                event:    "{gpii.schema.tests.validator.browser.environment}.browser.events.onEvaluateComplete",
                listener: "jqUnit.assertEquals",
                args:     ["There should be no errors...", null, "{arguments}.0"]
            });
        }
        var generatedTest = {
            name:     testDefinition.message,
            sequence: sequence
        };
        generatedTests.push(generatedTest);
    });

    // Finish off each sequence by running it through the `gpii.express` function that prepends and appends sequence steps.
    var finalSequences = gpii.express.tests.helpers.addRequiredSequences([{ tests: generatedTests }], that.options.sequenceStart, that.options.sequenceEnd);

    return finalSequences;
};

// A variation on what we do with `gpii.express.tests.caseHolder.base`.  Only the `mergePolicy` is duplicated, so for
// now it seems a bit much to make a common base grade.  If we use this pattern more often, we will move it some place
// more general.
//
fluid.defaults("gpii.schema.tests.validator.browser.caseHolder", {
    gradeNames: ["fluid.test.testCaseHolder"],
    mergePolicy: {
        sequenceStart: "noexpand",
        sequenceEnd:   "noexpand"
    },
    moduleSource: {
        funcName: "gpii.schema.tests.validator.browser.constructTestSequences",
        args:     ["{that}"]
    },
    sequenceStart: [
        {
            func: "{gpii.schema.tests.validator.browser.environment}.events.constructFixtures.fire"
        },
        {
            listener: "fluid.identity",
            event: "{gpii.schema.tests.validator.browser.environment}.events.onReady"
        }
    ],
    sequenceEnd: [
        {
            func: "{gpii.schema.tests.validator.browser.environment}.harness.destroy"
        },
        {
            func: "{gpii.schema.tests.validator.browser.environment}.browser.end"
        },
        {
            listener: "fluid.identity",
            event: "{gpii.schema.tests.validator.browser.environment}.events.onAllDone"
        }
    ],
    commonTests: gpii.schema.tests.validator.testDefinitions
});

// A test environment for use with both a browser and express.  There are similar grades in `gpii-handlebars`, we should
// TODO:  agree where these should live (i.e. in `gpii-express` or `gpii-test-browser` or somewhere else) and consolidate.
fluid.defaults("gpii.schema.tests.validator.browser.environment", {
    gradeNames:     ["fluid.test.testEnvironment"],
    expressPort:   6984,
    url:           "http://localhost:6984/content/validate-client-tests.html",
    events: {
        constructFixtures: null,
        onBrowserDone:     null,
        onExpressDone:     null,
        onBrowserReady:    null,
        onExpressReady:    null,
        onReady: {
            events: {
                onBrowserReady: "onBrowserReady",
                onExpressReady: "onExpressReady"
            }
        },
        onAllDone: {
            events: {
                onBrowserDone: "onBrowserDone",
                onExpressDone: "onExpressDone"
            }
        }
    },
    components: {
        browser: {
            type: "gpii.tests.browser",
            createOnEvent: "constructFixtures",
            options: {
                // Uncomment the next line (or add your own options in a derived grade) if you want to see the browser output on your screen.
                //nightmareOptions: { show: true},
                listeners: {
                    "onReady.notifyEnvironment": {
                        func: "{gpii.schema.tests.validator.browser.environment}.events.onBrowserReady.fire"
                    },
                    "onEndComplete.notifyEnvironment": {
                        func: "{gpii.schema.tests.validator.browser.environment}.events.onBrowserDone.fire"
                    }
                }
            }
        },
        harness: {
            type:          "gpii.schema.tests.harness",
            createOnEvent: "constructFixtures",
            options: {
                expressPort:   "{gpii.schema.tests.validator.browser.environment}.options.expressPort",
                url:           "{gpii.schema.tests.validator.browser.environment}.options.url",
                listeners: {
                    "onStarted.notifyEnvironment": {
                        func: "{gpii.schema.tests.validator.browser.environment}.events.onExpressReady.fire"
                    },
                    "afterDestroy.notifyEnvironment": {
                        func: "{gpii.schema.tests.validator.browser.environment}.events.onExpressDone.fire"
                    }
                }
            }
        },
        caseHolder: {
            type: "gpii.schema.tests.validator.browser.caseHolder"
        }
    }
});

gpii.schema.tests.validator.browser.environment();