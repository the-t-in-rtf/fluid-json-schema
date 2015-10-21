// Simple function to examine validation errors.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("jqUnit");

require("../../../src/js/common/validate");

fluid.registerNamespace("gpii.schema.tests");
gpii.schema.tests.hasFieldErrors = function (results, fields) {
    if (fields) {
        fluid.each(fields, function (settings, field) {
            var path = typeof field === "string" ? [field] : field;
            var target = gpii.schema.validator.resolveOrCreateTargetFromPath(results.fieldErrors, path);

            if (settings.multiple) {
                jqUnit.assertTrue("There should be multiple errors for the '" + field + "' field...", target && target.length > 1);
            }
            else {
                jqUnit.assertTrue("There should be an error for the '" + field + "' field...", target && target.length >= 1);
            }
        });
    }
    else {
        jqUnit.assertTrue("There should be field errors...", results.fieldErrors && results.fieldErrors.length > 0);
    }
};

gpii.schema.tests.hasDocumentErrors = function (results) {
    jqUnit.assertTrue("There should be document errors...", results.documentErrors && results.documentErrors.length > 0);
};

gpii.schema.tests.hasErrors = function (results) {
    jqUnit.assertTrue("There should be errors...", fluid.makeArray(results.documentErrors).length > 0 || fluid.makeArray(results.fieldErrors).length > 0);
};

