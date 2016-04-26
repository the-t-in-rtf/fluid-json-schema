// Simple function to examine validation errors.
"use strict";
var fluid =  require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var jqUnit = require("node-jqunit");

require("../../../");

fluid.registerNamespace("gpii.test.schema");

// Inspects a response body (`results`) looking for errors that match the paths specified in `fieldPaths` (dot notation paths within `fieldErrors`.  If `multiple`
// is specified, there should be more than one error at each `fieldPath`.
gpii.test.schema.hasFieldErrors = function (results, fieldPointers, multiple) {
    if (fieldPointers) {
        var errorsFound = {};
        fluid.each(results, function (error) {
            errorsFound[error.schemaPath] = !isNaN(errorsFound[error.schemaPath]) ? errorsFound[error.schemaPath]++ : 1;
        });

        fluid.each(fieldPointers, function (pointer) {
            if (multiple) {
                jqUnit.assertTrue("There should be multiple errors for field '" + pointer + "'...", errorsFound[pointer] >= 1);
            }
            else {
                jqUnit.assertEquals("There should be a single error for field '" + pointer + "'...", 1, errorsFound[pointer]);
            }
        });
    }
    else {
        jqUnit.assertTrue("There should be field errors...", results.fieldErrors && results.fieldErrors.length > 0);
    }
};
