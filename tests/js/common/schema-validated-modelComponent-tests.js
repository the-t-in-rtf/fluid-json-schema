/* globals Ajv, jqUnit, require */
/* eslint-env browser */
var fluid  = fluid  || {};
var Ajv    = Ajv    || {};
var jqUnit = jqUnit || {};

(function (fluid, Ajv, jqUnit) {
    "use strict";
    if (!fluid.identity) {
        fluid = require("infusion");
        jqUnit = require("node-jqunit");
        require("../../../src/js/common/schemaValidatedModelComponent");
    }

    var gpii = fluid.registerNamespace("gpii");

    jqUnit.module("Schema validated model component tests.");

    jqUnit.test("Testing the base grade.", function () {
        var component = gpii.schema.modelComponent();
        jqUnit.assert("We should have been able to instantiate an instance of the base gpii.schema.component grade successfully.");
        jqUnit.assertLeftHand("The initial model should be valid.", { isValid: true }, component.model.validationResults);
    });

    fluid.defaults("gpii.tests.schemaValidatedModelComponent.basicValidation",{
        gradeNames: ["gpii.schema.modelComponent"],
        modelSchema: {
            properties: {
                validModelVariableIsValid: {
                    enum: [true],
                    enumLabels: ["Must be true."]
                }
            }
        },
        model: {
            validModelVariableIsValid: true
        }
    });

    jqUnit.test("Test model validation (valid -> invalid).", function () {
        var component = gpii.tests.schemaValidatedModelComponent.basicValidation();
        jqUnit.assert("We should have been able to instantiate an instance of our grade successfully.");

        // This may be need to be removed to avoid timing problems, the next test is a more meaningful test of initial vs. subsequent validation.
        jqUnit.assertLeftHand("The initial model should be valid.", { isValid: true }, component.model.validationResults);

        component.applier.modelChanged.addListener({ path: "validationResults"}, function (validationResults) {
            jqUnit.start();
            jqUnit.assertLeftHand("The updated model should be invalid.", { isValid: false }, validationResults);
        });

        jqUnit.stop();
        component.applier.change("validModelVariableIsValid", false);
    });

    jqUnit.test("Test model validation (invalid -> valid).", function () {
        var component = gpii.tests.schemaValidatedModelComponent.basicValidation({ model: { validModelVariableIsValid: false }});

        jqUnit.assert("We should have been able to instantiate an instance of our grade successfully.");

        component.applier.modelChanged.addListener({ path: "validationResults"}, function (newValidationResults, oldValidationResults) {
            jqUnit.start();
            jqUnit.assertLeftHand("The old model should be invalid.", { isValid: false }, oldValidationResults);
            jqUnit.assertLeftHand("The new model should be valid.",   { isValid: true  }, newValidationResults);
        });

        jqUnit.stop();
        component.applier.change("validModelVariableIsValid", true);
    });
})(fluid, Ajv, jqUnit);
