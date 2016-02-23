// A grade that wires in a function that checks for the existing of required `options` on startup and fails with an
// error message if they are missing.  This is automatically called when a component that has this grade is created.
//
// This is intended to test for the presence of required options.  More complex options validation (for example using a
// validator) is not supported by this package.
//
// This grade looks for a single configuration option, `options.requiredFields`, an object whose keys represent relative
// paths to definitions, as in:
//
// requiredFields: {
//   "path.relative.to.that.options": true
// }
//
"use strict";
var fluid = fluid || require("infusion"); // Can also be used within client-side components.
var gpii = fluid.registerNamespace("gpii");

/**
 *
 * Check a component's options to ensure that required options are set.  Throws `fluid.fail` if one or more fields is
 * missing.
 *
 * @param options {Object} - The component options to be checked.
 * @param requiredFields {Array} - The field paths we expect to be found in the options.
 * @param component - The component whose options we are checking.
 */
gpii.checkRequiredOptions = function (options, requiredFields, component) {
    var errors = [];

    fluid.each(requiredFields, function (value, path) {
        var requiredValue = fluid.get(options, path);
        if (requiredValue === undefined) {
            errors.push("You have not supplied the required option '" + path + "' in component '" + component.typeName + "'...");
        }
    });

    if (errors.length > 0) {
        fluid.fail(errors);
    }
};

fluid.defaults("gpii.hasRequiredOptions", {
    gradeNames: ["fluid.component"],
    listeners: {
        "onCreate.checkRequiredOptions": {
            funcName: "gpii.checkRequiredOptions",
            args:     ["{that}.options", "{that}.options.requiredFields", "{that}"]
        }
    }
});