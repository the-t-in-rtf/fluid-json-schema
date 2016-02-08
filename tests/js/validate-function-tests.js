// Unit tests of individual static functions within the validator.
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("node-jqunit");

require("../../src/js/common/validate");

fluid.registerNamespace("gpii.schema.validator.ajv.tests");

// A test runner function that executes `test.fnToExecute` and compares the result to `test.expected` using
// `jqUnit[test.compareFnName]`.  Supports two variations, one for the `saveToPath` function, and one for everything
// else.  For the former, `test.input`, `test.expected`, and `test.startMap` are required.  For the latter,
// `test.startMap` is not required.
//
// We use this instead of a standard test sequence because we are dealing with static functions that do not fire any
// events.
gpii.schema.validator.ajv.tests.runSingleTest = function (test) {
    jqUnit.test(test.message, function () {
        // `saveToPath` modified an existing map, so we have to construct and pass it the initial data, and then evaluate that.
        if (test.fnToExecute === "saveToPath") {
            var resultMap = test.startMap;
            gpii.schema.validator.ajv.saveToPath.apply(null, fluid.makeArray(test.input).concat(resultMap));

            jqUnit[test.compareFnName](test.message, test.expected, resultMap);
        }
        // For everything else, we can execute the named function using the given input and compare the output to the expected result.
        else {
            jqUnit[test.compareFnName](test.message, test.expected, gpii.schema.validator.ajv[test.fnToExecute].apply(null, fluid.makeArray(test.input)));
        }
    });
};

fluid.defaults("gpii.schema.validator.ajv.tests", {
    gradeNames: ["fluid.component"],
    tests: [
        {
            message:       "Test sanitizing basic path segment...",
            compareFnName: "assertEquals",
            fnToExecute:   "sanitizePathSegment",
            input:         ".dotless",
            expected:      "dotless"
        },
        {
            message:       "Test sanitizing path segment with square brackets...",
            compareFnName: "assertEquals",
            fnToExecute:   "sanitizePathSegment",
            input:         ".['this.works']",
            expected:      "this.works"
        },
        {
            message:       "Extract the path for a missing required top-level field...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { keyword: "required", dataPath: ".required", message: "message" },
            expected:      ["required"]
        },
        {
            message:       "Testing handling of solitary dot escaping...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { dataPath: ".['utter.madness']" },
            expected:      ["utter.madness"]
        },
        {
            message:       "Testing handling of leading dot escaping...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { dataPath: ".['outer.space'].sky.earth" },
            expected:      ["outer.space", "sky", "earth"]
        },
        {
            message:       "Testing handling of intermediate dot escaping...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { dataPath: ".sky['middle.earth'].moria" },
            expected:      ["sky", "middle.earth", "moria"]
        },
        {
            message:       "Testing handling of trailing dot escaping...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { dataPath: ".barrel.monkey['monkey.innards']" },
            expected:      ["barrel", "monkey", "monkey.innards"]
        },
        {
            message:       "Testing handling of adjacent dot escaping...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { dataPath: ".['first.segment']['second.segment']" },
            expected:      ["first.segment", "second.segment"]
        },
        {
            message:       "Extract the path for a missing required deep field...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "extractPathSegmentsFromError",
            input:         { keyword: "required", dataPath: ".deep.required", message: "message" },
            expected:      ["deep", "required"]
        },
        {
            message:       "Extract the path for an invalid top-level field...",
            compareFnName: "assertDeepEq",
            fnToExecute:  "extractPathSegmentsFromError",
            input:         { keyword: "minLength", dataPath: ".required", message: "message" },
            expected:      ["required"]
        },
        {
            message:       "Extract the path for an invalid deep field...",
            compareFnName: "assertDeepEq",
            fnToExecute:  "extractPathSegmentsFromError",
            input:         { keyword: "minLength", dataPath: ".deep.required", message: "message" },
            expected:      ["deep", "required"]
        },
        {
            message:       "Test underlying path targeting mechanism...",
            compareFnName: "assertDeepEq",
            fnToExecute:  "resolveOrCreateTargetFromPath",
            input:         [{ deeply: { nested: { foo: "bar"} }}, ["deeply", "nested"]],
            expected:      {foo: "bar"}
        },
        {
            message:       "Save a top-level path to a map with no existing data...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "saveToPath",
            startMap:      { fieldErrors: {}},
            input:         [["required"], "message"],
            expected:      { fieldErrors: { required: ["message"] } }
        },
        {
            message:       "Save a top-level path to a map with existing data...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "saveToPath",
            startMap:      { fieldErrors: { required: ["old message"]}},
            input:         [["required"], "new message"],
            expected:      { fieldErrors: { required: ["old message", "new message"] }}
        },
        {
            message:       "Save a deep path to a map with no existing data...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "saveToPath",
            startMap:      { fieldErrors: {}},
            input:         [["deep", "required"], "message"],
            expected:      { fieldErrors: { deep: { required: ["message"] }}}
        },
        {
            message:       "Save a deep path to a map with existing data...",
            compareFnName: "assertDeepEq",
            fnToExecute:   "saveToPath",
            startMap:      { fieldErrors: { deep: { required: ["old message"]}}},
            input:         [["deep", "required"], "new message"],
            expected:      { fieldErrors: { deep: { required: ["old message", "new message"] }}}
        }
    ],
    listeners: {
        "onCreate.setModule": {
            funcName: "jqUnit.module",
            args:     ["Unit tests for validation component static functions..."]
        },
        "onCreate.runTests": {
            funcName: "fluid.each",
            args:     ["{that}.options.tests", gpii.schema.validator.ajv.tests.runSingleTest]

        }
    }
});

gpii.schema.validator.ajv.tests();