// Unit tests of individual static functions within the validator.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var jqUnit = require("jqUnit");

require("../../src/js/common/validate");

jqUnit.module("Unit tests for validation component static functions...");

jqUnit.test("Test sanitizing basic path segment...", function () {
    var output = gpii.schema.validator.sanitizePathSegment(".dotless");
    jqUnit.assertEquals("The output should be as expected...", "dotless", output);
});

jqUnit.test("Test sanitizing path segment with square brackets...", function () {
    var output = gpii.schema.validator.sanitizePathSegment(".['this.works']");
    jqUnit.assertEquals("The output should be as expected...", "this.works", output);
});


jqUnit.test("Extract the path for a missing required top-level field....", function () {
    var error    = { keyword: "required", dataPath: ".required", message: "message" };
    var path     = gpii.schema.validator.extractPathSegmentsFromError(error);
    var expected = ["required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Testing handling of solitary dot escaping...", function () {
    var error    = { dataPath: ".['utter.madness']" };
    var expected = ["utter.madness"];
    var output   = gpii.schema.validator.extractPathSegmentsFromError(error);

    jqUnit.assertDeepEq("A path with just one segment that contains an escaped dot should be parsed correctly...", expected, output);
});


jqUnit.test("Testing handling of leading dot escaping...", function () {
    var error    = { dataPath: ".['outer.space'].sky.earth" };
    var expected = ["outer.space", "sky", "earth"];
    var output   = gpii.schema.validator.extractPathSegmentsFromError(error);

    jqUnit.assertDeepEq("A path with escaped dots in the lead position should be parsed correctly...", expected, output);
});

jqUnit.test("Testing handling of intermediate dot escaping...", function () {
    var error    = { dataPath: ".sky['middle.earth'].moria" };
    var expected = ["sky", "middle.earth", "moria"];
    var output   = gpii.schema.validator.extractPathSegmentsFromError(error);

    jqUnit.assertDeepEq("A path with escaped dots in a middle position should be parsed correctly...", expected, output);
});

jqUnit.test("Testing handling of trailing dot escaping...", function () {
    var error    = { dataPath: ".barrel.monkey['monkey.innards']" };
    var expected = ["barrel", "monkey", "monkey.innards"];
    var output   = gpii.schema.validator.extractPathSegmentsFromError(error);

    jqUnit.assertDeepEq("A path with escaped dots in a trailing position should be parsed correctly...", expected, output);
});

jqUnit.test("Testing handling of adjacent dot escaping...", function () {
    var error    = { dataPath: ".['first.segment']['second.segment']" };
    var expected = ["first.segment", "second.segment"];
    var output   = gpii.schema.validator.extractPathSegmentsFromError(error);

    jqUnit.assertDeepEq("Adjacent escaped segments should be parsed correctly...", expected, output);
});


jqUnit.test("Extract the path for a missing required deep field....", function () {
    var error    = { keyword: "required", dataPath: ".deep.required", message: "message" };
    var path     = gpii.schema.validator.extractPathSegmentsFromError(error);
    var expected = ["deep", "required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Extract the path for an invalid top-level field....", function () {
    var error    = { keyword: "minLength", dataPath: ".required", message: "message" };
    var path     = gpii.schema.validator.extractPathSegmentsFromError(error);
    var expected = ["required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Extract the path for an invalid deep field....", function () {
    var error    = { keyword: "minLength", dataPath: ".deep.required", message: "message" };
    var path     = gpii.schema.validator.extractPathSegmentsFromError(error);
    var expected = ["deep", "required"];

    jqUnit.assertDeepEq("The path should be as expected...", expected, path);
});

jqUnit.test("Save a top-level path to a map with no existing data....", function () {
    var errorMap = { fieldErrors: {}};
    gpii.schema.validator.saveToPath(["required"], "message", errorMap);
    var expected = { fieldErrors: { required: ["message"] } };

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Save a top-level path to a map with existing data....", function () {
    var errorMap = { fieldErrors: { required: ["old message"]}};
    gpii.schema.validator.saveToPath(["required"], "new message", errorMap);
    var expected = { fieldErrors: { required: ["old message", "new message"] }};

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Save a deep path to a map with no existing data....", function () {
    var errorMap = { fieldErrors: {}};
    gpii.schema.validator.saveToPath(["deep", "required"], "message", errorMap);
    var expected = { fieldErrors: { deep: { required: ["message"] }}};

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Save a deep path to a map with existing data....", function () {
    var errorMap = { fieldErrors: { deep: { required: ["old message"]}}};
    gpii.schema.validator.saveToPath(["deep", "required"], "new message", errorMap);
    var expected = { fieldErrors: { deep: { required: ["old message", "new message"] }}};

    jqUnit.assertDeepEq("The error map should be as expected...", expected, errorMap);
});

jqUnit.test("Test underlying path targeting mechanism...", function () {
    var original = { deeply: { nested: { foo: "bar"} }};
    var expected = {foo: "bar"};
    var target = gpii.schema.validator.resolveOrCreateTargetFromPath(original, ["deeply", "nested"]);
    jqUnit.assertDeepEq("The target should have been resolved correctly...", expected, target);
});