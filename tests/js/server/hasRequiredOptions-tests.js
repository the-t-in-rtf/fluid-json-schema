// Tests for the `hasRequiredOptions` grade that enforces required options.
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

require("../../../");

var jqUnit = require("node-jqunit");

jqUnit.module("Testing hasRequiredOptions grade...");

jqUnit.test("A grade that has all the required options should be created successfully...", function () {
    gpii.hasRequiredOptions({
        requiredFields: {
            "topLevel": true,
            "deep.field": true
        },
        topLevel: {},
        deep: { field: {} }
    });

    jqUnit.assert("The component should have been created successfully...");
});

jqUnit.test("A grade with all no required fields should be created successfully...", function () {
    gpii.hasRequiredOptions({});

    jqUnit.assert("The component should have been created successfully...");
});

jqUnit.test("A grade that is missing required options should not be created successfully...", function () {
    fluid.failureEvent.addListener(function () {
        jqUnit.assert("A component that is missing options should throw an error...");
    }, "jqUnit", "before:fail");

    try {
        gpii.hasRequiredOptions({
            requiredFields: {
                "topLevel": true,
                "deep.field": true
            }
        });
    }
    catch (e) {
        jqUnit.assert("An exception should have been thrown...");
    }
});

