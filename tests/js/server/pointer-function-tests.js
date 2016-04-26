/*

    Tests for the static functions used within the.pointers.

 */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../../");

fluid.registerNamespace("gpii.tests.schema.pointers");

/*

    Run a single test.  Tests must be of the form:

    {
        message:  "The message passed to jqUnit.test and used in the assertion...",
        func:     gpii.schema.pointers.getChildJsonPointer, // The static function under test.
        args:     [], // the arguments to be passed to the function
        expected: "" // The expected output as compared with assertDeepEq
    }

 */
gpii.tests.schema.pointers.runSingleTest = function (test) {
    jqUnit.test(test.message, function () {
        jqUnit.assertDeepEq(test.message, test.expected, test.func.apply(null, test.args));
    });
};

fluid.defaults("gpii.tests.schema.pointers", {
    gradeNames: ["fluid.component"],
    tests: [
        // gpii.schema.pointers.getParentJsonPointer (jsonPointer)
        {
            message:  "The parent for a deep element should be correctly resolved...",
            func:     gpii.schema.pointers.getParentJsonPointer,
            args:     ["#/definitions/testString/minLength"],
            expected: "#/definitions/testString"
        },
        {
            message:  "The parent for an immediate child of the root element should be correctly resolved...",
            func:     gpii.schema.pointers.getParentJsonPointer,
            args:     ["#/required"],
            expected: "#/"
        },
        {
            message:  "The parent for the root itself should be correctly resolved...",
            func:     gpii.schema.pointers.getParentJsonPointer,
            args:     ["#/"],
            expected: "#/"
        },
        // gpii.schema.pointers.getChildJsonPointer (jsonPointer, childPath)
        {
            message:  "A child path should be resolved correctly from the root...",
            func:     gpii.schema.pointers.getChildJsonPointer,
            args:     ["#/", "errors"],
            expected: "#/errors"
        },
        {
            message:  "A simple child path should be resolved correctly...",
            func:     gpii.schema.pointers.getChildJsonPointer,
            args:     ["#/definitions/testString", "minLength"],
            expected: "#/definitions/testString/minLength"
        },
        // These tests are here to ensure that we do not double escape or strip escaping.
        {
            message:  "A child path with slashes should be resolved correctly...",
            func:     gpii.schema.pointers.getChildJsonPointer,
            args:     ["#/definitions", "testString/minLength"],
            expected: "#/definitions/testString/minLength"
        },
        {
            message:  "A child path with escaped slashes and tildes should be correctly resolved...",
            func:     gpii.schema.pointers.getChildJsonPointer,
            args:     ["#/definitions/testString", "this~0and~1that"],
            expected: "#/definitions/testString/this~0and~1that"
        },
        // gpii.schema.pointers.getFieldErrorsFromFailure(failurePointer)
        {
            message:  "Root required errors should be resolved correctly...",
            func:     gpii.schema.pointers.getFieldErrorsFromFailure,
            args:     ["#/required"],
            expected: "#/errors"
        },
        {
            message:  "Deep required errors should be resolved correctly...",
            func:     gpii.schema.pointers.getFieldErrorsFromFailure,
            args:     ["#/field1/allOf/1/required"],
            expected: "#/field1/allOf/1/errors"
        },
        {
            message:  "Deep field errors should be resolved correctly...",
            func:     gpii.schema.pointers.getFieldErrorsFromFailure,
            args:     ["#/field1/allOf/1/maxLength"],
            expected: "#/field1/allOf/1/errors"
        }
    ],
    listeners: {
        "onCreate.runTests": {
            funcName: "fluid.each",
            args: ["{that}.options.tests", gpii.tests.schema.pointers.runSingleTest]
        }
    }
});

gpii.tests.schema.pointers();