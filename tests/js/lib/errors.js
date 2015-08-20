// Simple function to examine validation errors.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("jqUnit");

require("../../../src/js/common/validate");

fluid.registerNamespace("gpii.schema.tests");
gpii.schema.tests.hasFieldErrors = function (results, fields) {
    fluid.each(fields, function (field) {
        var path = typeof field === "string" ? [field] : field;
        var target = gpii.schema.validator.resolveTargetFromPath(results.fieldErrors, path);
        jqUnit.assertTrue("There should be an error for the '" + field + "' field...", target && target.length >= 1);
    });
};