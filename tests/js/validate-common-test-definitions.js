// Tests to be used with the validator on both the client and server side. This grade cannot be used by itself.  You
// must mix it in with an existing test grade.  See `validate-server-tests.js` for an example.
//
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");

fluid.registerNamespace("gpii.schema.tests.validator");

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
gpii.schema.tests.validator.singleTest = function (that, message, schema, content, errors, errorPaths, multipleErrorPaths) {
    jqUnit.test(message, function () {
        var result = that.validate(schema, content);

        if (errors) {
            if (errorPaths) {
                gpii.schema.tests.hasFieldErrors(result, errorPaths);
            }
            if (multipleErrorPaths) {
                gpii.schema.tests.hasFieldErrors(result, multipleErrorPaths, true);
            }
        }
        else {
            jqUnit.assertUndefined("There should be no validation errors...", result);
        }
    });
};

gpii.schema.tests.validator.runTests = function (that) {
    fluid.each(that.options.tests, function (test) {
        gpii.schema.tests.validator.singleTest(that, test.message, test.schema, test.content, test.errors, test.errorPaths, test.multipleErrorPaths);
    });

    // This last test is the only one that can't use `hasFieldErrors`
    jqUnit.test("Test handling of non-JSON content....", function () {
        var bogus  = "{}";
        var result = that.validate("base.json", bogus);
        jqUnit.assertNotUndefined("There should be validation errors...", result);
    });
};

fluid.defaults("gpii.schema.tests.validator", {
    tests: {
        validBase: {
            message: "Validate the simplest valid 'base' record....",
            schema:  "base.json",
            content: { required: true },
            errors:  false
        },
        validDerived: {
            message: "Validate the simplest valid 'derived' record....",
            schema:  "derived.json",
            content: {required: true, additionalRequired: true},
            errors:  false
        },
        emptyBase: {
            message:     "Validate an empty 'base' record....",
            schema:      "base.json",
            content:     {},
            errors:      true,
            errorPaths: [".required"]
        },
        emptyDerived: {
            message:     "Validate an empty 'derived' record....",
            schema:      "derived.json",
            content:     {},
            errors:      true,
            errorPaths: [".required", ".additionalRequired"]
        },
        deeplyInvalid: {
            message:     "Test handling of 'deep' validation error....",
            schema:      "deep.json",
            content:     { deep: {} },
            errors:      true,
            errorPaths: [".deep.required"]
        },
        invalidBase: {
            message:     "Validate an invalid 'base' record....",
            schema:      "base.json",
            content:     { required: "bogus"},
            errors:      true,
            errorPaths: [".required"]
        },
        invalidDerived: {
            message:     "Validate an invalid 'derived' record....",
            schema:      "derived.json",
            content:     { required: "bogus", additionalRequired: "also bogus"},
            errors:      true,
            errorPaths: [".required", ".additionalRequired"]
        },
        // Test handling of keys with slashes in their name to ensure that paths are correctly resolved
        invalidEscaped: {
            message:     "Validate an empty 'escaped' record....",
            schema:      "escaped.json",
            content:     {},
            errors:      true,
            errorPaths: [".[x][x]"]
        },
        deeplyInvalidEscaped: {
            message:     "Validate an 'escaped' record missing a 'deep' dependency....",
            schema:      "escaped.json",
            content:     { "this.that": { "th'other": {} } },
            errors:      true,
            errorPaths: [".[x][x]", ".['this.that']['th\\'other'].required"]
        },
        validEscaped: {
            message:     "Validate a valid 'escaped' record....",
            schema:      "escaped.json",
            content:     { "this.that": { "th'other": { "required": true} }, "[x][x]": "also valid"},
            errors:      false
        },
        badRawMultiple: {
            message:     "Validate a field that fails multiple rules (raw output)...",
            schema:      "base.json",
            content:     { required: true, rawMultiple: "bogus" },
            errors:      true,
            multipleErrorPaths: [".rawMultiple"]
        },
        goodMultiple: {
            message: "Validate a field that passes multiple rules...",
            schema:  "base.json",
            content: { required: true, password: "Password1" },
            errors:  false
        },
        // In theory any validation error should be caught using already tested methods, but we want to break things
        // in a range of ways to check.
        complexFraud: {
            message: "Test a variety of invalid field types and formats...",
            schema: "base.json",
            content: {required: true, number: "bogus", date: "bogus", "boolean": "bogus", array: "bogus", regex: "bogus"},
            errors: true,
            errorPaths: [".number", ".date", ".array", ".boolean", ".regex"]
        }
    }
});