"use strict";
// Test "validator" components using Zombie and filesystem content.
//
// Zombie provides two means of interrogating globals within the browser, namely:
//
// 1. `browser.assert.global(name, expected, message)`, which tests the global with `name` to confirm that it matches
//     `expected`, and throws `message` if it does not.
//
// 2. `browser.window[fieldName]` provides direct access to the global variable `fieldName`.
//
// We will use the latter in these tests and using `jqUnit` assertions.  The page itself will use jQuery to manipulate
// all controls, Zombie is only inspecting the final results.
//
// We have to load this via a `gpii.express` instance because file URLs don't work on windows:
//
// https://github.com/assaf/zombie/issues/915

var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

fluid.setLogging(true);

var Browser = require("zombie");
var jqUnit = require("jqUnit");

require("./lib/errors");
require("./test-harness");
require("./validate-common-tests");

fluid.registerNamespace("gpii.schema.tests.validator.zombie");

gpii.schema.tests.validator.zombie.singleTest = function (that, message, schema, content, errors, errorFields) {
    jqUnit.asyncTest(message, function () {
        var browser = Browser.create();
        browser.on("error", function (error) {
            jqUnit.start();
            jqUnit.fail("There should be no errors:" + error);
        });
        browser.visit(that.options.url, function () {
            jqUnit.start();
            var component = browser.window[that.options.testComponent];
            var result    = component.validate(schema, content);

            if (errors) {
                gpii.schema.tests.hasFieldErrors(result, errorFields);
            }
            else {
                jqUnit.assertUndefined("There should be no validation errors...", result);
            }
        });

    });
};

gpii.schema.tests.validator.zombie.runTests = function (that) {
    jqUnit.module("Testing client side JSON Schema validation...");

    fluid.each(that.options.tests, function (test) {
        gpii.schema.tests.validator.zombie.singleTest(that, test.message, test.schema, test.content, test.errors, test.errorFields);
    });

    // This last test is the only one that can't use `hasFieldErrors`
    jqUnit.asyncTest("Test handling of non-JSON content....", function () {
        var browser = Browser.create();
        browser.on("error", function (error) {
            jqUnit.start();
            jqUnit.fail("There should be no errors:" + error);
        });
        browser.visit(that.options.url, function () {
            jqUnit.start();
            var component = browser.window[that.options.testComponent];
            var bogus  = "{}";
            var result = component.validate("base", bogus);
            jqUnit.assertNotUndefined("There should be validation errors...", result);
        });
    });
};

var validateComponent = gpii.schema.tests.harness({
    "gradeNames": ["gpii.schema.tests.validator"],
    "expressPort":   6984,
    "url":           "http://localhost:6984/content/validate-client-tests.html",
    "testComponent": "clientValidator",
    listeners: {
        "{express}.events.onStarted": {
            funcName: "gpii.schema.tests.validator.zombie.runTests",
            args:     ["{that}"]
        }
    }
});
module.exports = validateComponent.afterDestroyPromise;

