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