// Unit tests of individual static functions within the validator.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");

require("../../src/js/common/validate");

jqUnit.module("Unit tests for validation component static functions...");

jqUnit.test("Extract the path for a missing required top-level field....", function () {
    var error    = { code: "OBJECT_MISSING_REQUIRED_PROPERTY", params: [ "required"], path: "#/", message: "message" };
    var path     = gpii.schema.validator.extractPathSegments(error);
    var expected = ["required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Testing handling of Z-Schema escaping...", function () {
    var original = ["this~1that", "other~01"];
    var expected = ["this/that", "other~1"];
    var output   = original.map(gpii.schema.validator.unescapeZSchemaisms);

    jqUnit.assertDeepEq("The array data should have been escaped correctly...", expected, output);
});

jqUnit.test("Extract the path for a missing required deep field....", function () {
    var error    = { code: "OBJECT_MISSING_REQUIRED_PROPERTY", params: [ "required"], path: "#/deep", message: "message" };
    var path     = gpii.schema.validator.extractPathSegments(error);
    var expected = ["deep", "required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Extract the path for an invalid top-level field....", function () {
    var error    = { code: "MIN_LENGTH", path: "#/required", message: "message" };
    var path     = gpii.schema.validator.extractPathSegments(error);
    var expected = ["required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Extract the path for an invalid deep field....", function () {
    var error    = { code: "MIN_LENGTH", path: "#/deep/required", message: "message" };
    var path     = gpii.schema.validator.extractPathSegments(error);
    var expected = ["deep", "required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Extract the path when escaped slashes and tildes are part of the path....", function () {
    var error    = { code: "MIN_LENGTH", path: "#/this~1that/other~01", message: "message" };
    var path     = gpii.schema.validator.extractPathSegments(error);
    var expected = ["this/that", "other~1"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Save a top-level path to a map with no existing data....", function () {
    var errorMap = { fieldErrors: {}, documentErrors: []};
    gpii.schema.validator.saveToPath(["required"], "message", errorMap);
    var expected = { fieldErrors: { required: ["message"] }, documentErrors: [] };

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Save a top-level path to a map with existing data....", function () {
    var errorMap = { fieldErrors: { required: ["old message"]}, documentErrors: []};
    gpii.schema.validator.saveToPath(["required"], "new message", errorMap);
    var expected = { fieldErrors: { required: ["old message", "new message"] }, documentErrors: []};

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Save a deep path to a map with no existing data....", function () {
    var errorMap = { fieldErrors: {}, documentErrors: []};
    gpii.schema.validator.saveToPath(["deep", "required"], "message", errorMap);
    var expected = { fieldErrors: { deep: { required: ["message"] }}, documentErrors: []};

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Save a deep path to a map with existing data....", function () {
    var errorMap = { fieldErrors: { deep: { required: ["old message"]}}, documentErrors: []};
    gpii.schema.validator.saveToPath(["deep", "required"], "new message", errorMap);
    var expected = { fieldErrors: { deep: { required: ["old message", "new message"] }}, documentErrors: []};

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Remove empty segments from an array using our filter function..", function () {
    var output = ["", "data", null, "more data", undefined].filter(gpii.schema.validator.removeEmptySegments);
    var expected = ["data", "more data"];
    jqUnit.assertDeepEq("The filtered array should be as expected...", expected, output);
});

jqUnit.test("Test underlying path targeting mechanism...", function () {
    var original = { deeply: { nested: { foo: "bar"} }};
    var expected = {foo: "bar"};
    var target = gpii.schema.validator.resolveOrCreateTargetFromPath(original, ["deeply", "nested"]);
    jqUnit.assertDeepEq("The target should have been resolved correctly...", expected, target);
});

// In theory we have already tested all the individual underlying static functions, now we test the static function that
// uses them all end-to-end.
jqUnit.test("Test sanitizing an individual error with an empty map...", function () {
    var errorMap = { fieldErrors: {}, documentErrors: []};
    var error    = { code: "OBJECT_MISSING_REQUIRED_PROPERTY", message: "message", path: "#/", params: ["required"]};
    var expected = { fieldErrors: { required: ["message"]}, documentErrors: []};
    gpii.schema.validator.sanitizeError(error, errorMap);
    jqUnit.assertDeepEq("The sanitized error output should be as expected...", expected, errorMap);
});

jqUnit.test("Test sanitizing an individual error with a non-empty map...", function () {
    var errorMap = { fieldErrors: { required: ["old message"]}, documentErrors: []};
    var error    = { code: "OBJECT_MISSING_REQUIRED_PROPERTY", message: "new message", path: "#/", params: ["required"]};
    var expected = { fieldErrors: { required: ["old message", "new message"]}, documentErrors: []};
    gpii.schema.validator.sanitizeError(error, errorMap);
    jqUnit.assertDeepEq("The sanitized error output should be as expected...", expected, errorMap);
});
